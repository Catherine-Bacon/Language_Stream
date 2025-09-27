let floatingWindow = null;
let parsedSubtitles = [];
let syncInterval = null; // Used to hold the interval ID for time synchronization
const TICK_RATE = 10000000; // Hardcoded based on user's XML example
let subtitleLanguages = { base: 'en', target: 'es' }; // Store language settings

// --- Utility Functions ---

// Helper to send status updates back to the popup
function sendStatusUpdate(message, progress) {
    chrome.runtime.sendMessage({
        command: "update_status",
        message: message,
        progress: progress
    }).catch(e => console.error("Could not send status:", e)); // Ignore if popup closed
}

// Converts a tick value string (e.g., "95095000t") to seconds (number)
function ticksToSeconds(tickString) {
    if (!tickString) return 0;
    const tickValue = parseInt(tickString.replace('t', ''), 10);
    // Formula: seconds = tickValue / TICK_RATE
    return tickValue / TICK_RATE;
}

// Function to find the Netflix video element
function getNetflixVideoElement() {
    // Look for the main player video element.
    const playerView = document.querySelector('.watch-video--player-view');
    if (playerView) {
        return playerView.querySelector('video');
    }
    // Fallback search
    return document.querySelector('video[src*="blob"]');
}

// --- XML Fetching Logic ---

async function fetchXmlContent(url) {
    try {
        sendStatusUpdate("Fetching XML from external URL...", 20);
        // The content script can make cross-domain requests, which is why we do it here.
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} (${response.statusText})`);
        }
        sendStatusUpdate("Subtitle file downloaded. Starting parsing...", 30);
        return await response.text();
    } catch (e) {
        console.error("Error fetching XML from URL:", e);
        sendStatusUpdate(`Error fetching subtitles: ${e.message}. Check URL or network permissions.`, 0);
        return null;
    }
}

// --- XML Processing Logic ---

function parseTtmlXml(xmlString) {
    parsedSubtitles = [];
    sendStatusUpdate("Starting XML parsing...", 40);

    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'application/xml'); 

        // Check for XML parsing errors
        const errorNode = xmlDoc.querySelector('parsererror');
        if (errorNode) {
             console.error("XML Parsing Error:", errorNode.textContent);
             sendStatusUpdate(`Error: Could not parse XML. ${errorNode.textContent}`, 0);
             return false;
        }

        const subtitleParagraphs = xmlDoc.querySelectorAll('p');
        const totalSubs = subtitleParagraphs.length;

        subtitleParagraphs.forEach((p, index) => {
            const beginTick = p.getAttribute('begin');
            const endTick = p.getAttribute('end');
            
            // Extract the text content, removing any internal tags
            let text = '';
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = p.innerHTML;
            text = tempDiv.textContent.trim();

            if (beginTick && endTick && text) {
                parsedSubtitles.push({
                    begin: ticksToSeconds(beginTick),
                    end: ticksToSeconds(endTick),
                    text: text
                });
            }

            // Update progress bar
            if (index % 100 === 0 || index === totalSubs - 1) {
                const progress = 40 + Math.floor((index / totalSubs) * 40); // 40% to 80%
                sendStatusUpdate(`Processing subtitles: ${index + 1}/${totalSubs} lines...`, progress);
            }
        });

        console.log(`Successfully parsed ${parsedSubtitles.length} subtitles.`);
        sendStatusUpdate(`Finished parsing ${parsedSubtitles.length} subtitles. Ready to start sync.`, 80);
        return true;

    } catch (e) {
        console.error("Fatal error during XML parsing:", e);
        sendStatusUpdate("Fatal error during XML parsing. Check console.", 0);
        return false;
    }
}

// --- Floating Window & Sync Logic ---

function createFloatingWindow() {
  const existingWindow = document.getElementById('language-stream-window');
  if (existingWindow) {
    console.log("Floating window already exists. Reusing it.");
    floatingWindow = existingWindow;
  } else {
    const windowDiv = document.createElement('div');
    windowDiv.id = 'language-stream-window';
    windowDiv.style.cssText = `
      position: absolute;
      bottom: 10%; 
      left: 50%;
      transform: translateX(-50%); 
      width: 70%; 
      max-width: 800px;
      min-height: 50px;
      background-color: rgba(0, 0, 0, 0.85);
      border: 2px solid #e50914;
      border-radius: 12px;
      box-shadow: 0 6px 15px rgba(0, 0, 0, 0.7);
      z-index: 9999;
      padding: 15px 25px;
      color: white;
      font-family: 'Inter', sans-serif;
      font-size: 1.5rem;
      text-align: center;
      line-height: 1.4;
      resize: both;
      overflow: hidden;
      cursor: grab;
      display: none; 
    `;
    document.body.appendChild(windowDiv);
    floatingWindow = windowDiv;
    makeDraggable(floatingWindow);
  }
}

function makeDraggable(element) {
  let isDragging = false;
  let offsetX, offsetY;

  const startDrag = (e) => {
    e.preventDefault();
    isDragging = true;
    const rect = element.getBoundingClientRect();
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    
    offsetX = clientX - rect.left;
    offsetY = clientY - rect.top;
    element.style.cursor = 'grabbing';
    element.style.position = 'fixed'; 

    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', drag);
    document.addEventListener('touchend', stopDrag);
  };

  const drag = (e) => {
    if (!isDragging) return;
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    
    element.style.left = (clientX - offsetX) + 'px';
    element.style.top = (clientY - offsetY) + 'px';
    element.style.transform = 'none'; 
  };

  const stopDrag = () => {
    isDragging = false;
    element.style.cursor = 'grab';
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('touchend', stopDrag);
  };

  element.addEventListener('mousedown', startDrag);
  element.addEventListener('touchstart', startDrag);
}

function startSubtitleSync() {
    const videoElement = getNetflixVideoElement();

    if (!videoElement) {
        console.warn("Video element not found. Retrying sync setup in 1 second...");
        setTimeout(startSubtitleSync, 1000);
        return;
    }

    if (syncInterval) {
        clearInterval(syncInterval);
    }
    
    let currentSubtitleIndex = -1;
    let lastTime = 0;
    
    if (floatingWindow) {
        floatingWindow.style.display = 'block';
    }

    const syncLoop = () => {
        const currentTime = videoElement.currentTime;
        const isPaused = videoElement.paused;

        if (isPaused && currentTime === lastTime) {
            return;
        }

        let newSubtitle = null;
        let newIndex = -1;
        let subtitleFound = false;

        // Efficient search: Check near current index
        for (let i = Math.max(0, currentSubtitleIndex - 1); i < Math.min(currentSubtitleIndex + 3, parsedSubtitles.length); i++) {
             const sub = parsedSubtitles[i];
             if (currentTime >= sub.begin && currentTime < sub.end) {
                 newSubtitle = sub;
                 newIndex = i;
                 subtitleFound = true;
                 break;
             }
        }

        // Fallback search (if jump occurred)
        if (!subtitleFound) {
            for (let i = 0; i < parsedSubtitles.length; i++) {
                const sub = parsedSubtitles[i];
                if (currentTime >= sub.begin && currentTime < sub.end) {
                    newSubtitle = sub;
                    newIndex = i;
                    subtitleFound = true;
                    break;
                }
            }
        }
        
        lastTime = currentTime;

        // Update the display
        if (subtitleFound) {
            if (newIndex !== currentSubtitleIndex) {
                // New subtitle detected, update the floating window
                floatingWindow.innerHTML = `
                    <span class="base-sub">${newSubtitle.text}</span><br>
                    <span class="translated-sub" style="opacity: 0.7; font-size: 0.85em;">...translating to ${subtitleLanguages.target.toUpperCase()}...</span>
                `;
                currentSubtitleIndex = newIndex;
                console.log(`Showing sub at ${currentTime.toFixed(3)}s: ${newSubtitle.text}`);
                // TODO: In the next step, we will implement translation here.
            }
        } else {
            // No subtitle active (gap in time)
            if (currentSubtitleIndex !== -1) {
                floatingWindow.innerHTML = '';
                currentSubtitleIndex = -1;
            }
        }
    };
    
    syncInterval = setInterval(syncLoop, 50); 
    console.log("Subtitle sync loop started.");
    sendStatusUpdate("Dual-Sub Mode Active! Subtitles are now synced.", 100);
}

function disableNetflixSubObserver() {
    // Placeholder to disable the native subtitle observer, if it was defined elsewhere
    if (typeof subtitleObserver !== 'undefined' && subtitleObserver) {
        subtitleObserver.disconnect();
        console.log("Netflix native subtitle observer disconnected.");
    }
}


// --- Message Listener for Popup Communication ---

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === "fetch_and_process_xml" && request.url) {
        
        // 1. Store language preferences
        subtitleLanguages.base = request.baseLang;
        subtitleLanguages.target = request.targetLang;
        sendStatusUpdate(`Ready to fetch XML for languages: ${subtitleLanguages.base} -> ${subtitleLanguages.target}`, 10);

        // 2. Async wrapper to handle the fetch/parse sequence
        (async () => {
            const xmlContent = await fetchXmlContent(request.url);

            if (xmlContent) {
                // 3. Create the floating window and disable native subs
                createFloatingWindow();
                disableNetflixSubObserver();
                
                // 4. Parse the XML
                const success = parseTtmlXml(xmlContent);
                
                // 5. Start synchronization
                if (success && parsedSubtitles.length > 0) {
                    startSubtitleSync();
                } else {
                    sendStatusUpdate("Failed to process XML or no subtitles found.", 0);
                }
            }
        })();
        
        return false; 
    }
    
    if (request.command === "ping") {
        sendResponse({ status: "ready" });
        return true;
    }
});
