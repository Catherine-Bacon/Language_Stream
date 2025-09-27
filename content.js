let floatingWindow = null;
let parsedSubtitles = [];
let syncInterval = null; // Used to hold the interval ID for time synchronization
const TICK_RATE = 10000000; // Hardcoded based on user's XML example

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
    // Netflix uses multiple video elements; often the one with the smallest dimensions is the dummy,
    // but the main player is usually within the element structure. We look for the main one.
    // The player-view element contains the video.
    const playerView = document.querySelector('.watch-video--player-view');
    if (playerView) {
        return playerView.querySelector('video');
    }
    // Fallback search
    return document.querySelector('video[src*="blob"]');
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
            
            // Extract the text content, removing any internal tags like <span> or <br>
            let text = '';
            // Use innerText/textContent on a temporary element to strip all tags safely
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

// Function to create and inject the floating window (same as before, but with initial content)
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
      bottom: 10%; /* Move slightly up from the bottom */
      left: 50%;
      transform: translateX(-50%); /* Center horizontally */
      width: 70%; /* Make it wider for dual subs */
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
      display: none; /* Hide until subs are loaded */
    `;
    document.body.appendChild(windowDiv);
    floatingWindow = windowDiv;
    makeDraggable(floatingWindow);
  }
}

// Function to make the window draggable
function makeDraggable(element) {
  let isDragging = false;
  let offsetX, offsetY;

  const startDrag = (e) => {
    e.preventDefault();
    isDragging = true;
    const rect = element.getBoundingClientRect();
    // Use clientX/Y for mouse, touch.clientX/Y for touch events
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    
    offsetX = clientX - rect.left;
    offsetY = clientY - rect.top;
    element.style.cursor = 'grabbing';
    
    // Switch to fixed position temporarily to prevent movement issues
    element.style.position = 'fixed'; 

    // Add event listeners to the document/window for moving/stopping
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
    element.style.transform = 'none'; // Remove translateX(-50%) when dragging starts
  };

  const stopDrag = () => {
    isDragging = false;
    element.style.cursor = 'grab';
    
    // Clean up event listeners
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('touchend', stopDrag);
  };

  element.addEventListener('mousedown', startDrag);
  element.addEventListener('touchstart', startDrag);
}

// The core synchronization function
function startSubtitleSync() {
    const videoElement = getNetflixVideoElement();

    if (!videoElement) {
        // Retry search for the video element
        console.warn("Video element not found. Retrying sync setup in 1 second...");
        setTimeout(startSubtitleSync, 1000);
        return;
    }

    // Stop any existing sync loop
    if (syncInterval) {
        clearInterval(syncInterval);
    }
    
    let currentSubtitleIndex = -1;
    let lastTime = 0;
    
    // Ensure the floating window is visible
    if (floatingWindow) {
        floatingWindow.style.display = 'block';
    }

    const syncLoop = () => {
        const currentTime = videoElement.currentTime;
        const isPaused = videoElement.paused;

        // Skip if time hasn't changed much while playing to save CPU,
        // but always run if paused to ensure correct sub on seek/pause.
        if (isPaused && currentTime === lastTime) {
            return;
        }

        let newSubtitle = null;
        let newIndex = -1;
        let subtitleFound = false;

        // 1. Check current/next subtitle first for efficiency
        // Look ahead 2 subtitles
        for (let i = currentSubtitleIndex; i < Math.min(currentSubtitleIndex + 3, parsedSubtitles.length); i++) {
            if (i >= 0) {
                 const sub = parsedSubtitles[i];
                 if (currentTime >= sub.begin && currentTime < sub.end) {
                     newSubtitle = sub;
                     newIndex = i;
                     subtitleFound = true;
                     break;
                 }
            }
        }

        // 2. If not found near the current index (e.g., after a seek), do a binary search (or simple loop)
        // Since the array is small/medium, a simple forward search is often faster than setting up binary search.
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
                floatingWindow.innerHTML = `<span class="base-sub">${newSubtitle.text}</span><br><span class="translated-sub">...translating...</span>`;
                currentSubtitleIndex = newIndex;
                console.log(`Showing sub at ${currentTime.toFixed(3)}s: ${newSubtitle.text}`);
                // TODO: In the next step, we will call the translation function here.
            }
        } else {
            // No subtitle active (gap in time)
            if (currentSubtitleIndex !== -1) {
                floatingWindow.innerHTML = '';
                currentSubtitleIndex = -1;
            }
        }
    };
    
    // Start the sync loop, running 20 times per second for smooth updates
    syncInterval = setInterval(syncLoop, 50); 
    console.log("Subtitle sync loop started.");
    sendStatusUpdate("Dual-Sub Mode Active! Subtitles are now synced.", 100);
}

// Disconnect the old Netflix subtitle observer as we are using custom subs now
// The original content.js had a startSubtitleObserver, we need to disable it.
function disableNetflixSubObserver() {
    // This is the function from the original content.js, now repurposed to disable it
    // The previous version of content.js defined 'subtitleObserver' globally
    if (typeof subtitleObserver !== 'undefined' && subtitleObserver) {
        subtitleObserver.disconnect();
        console.log("Netflix native subtitle observer disconnected.");
    }
}


// --- Message Listener for Popup Communication ---

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // We only respond to XML processing requests now
    if (request.command === "process_xml" && request.xml) {
        console.log("Received XML content for processing.");
        // 1. Create the floating window if it doesn't exist
        createFloatingWindow();
        // 2. Disable the native subtitle watcher
        disableNetflixSubObserver();
        
        // 3. Parse the XML
        const success = parseTtmlXml(request.xml);
        
        // 4. Start synchronization if parsing succeeded
        if (success && parsedSubtitles.length > 0) {
            startSubtitleSync();
        } else {
             sendStatusUpdate("Failed to process XML or no subtitles found.", 0);
        }
        return false; // Not using sendResponse here
    }
    
    // Retaining ping command from previous version for initial injection check, though 'process_xml' handles it now
    if (request.command === "ping") {
        sendResponse({ status: "ready" });
        return true;
    }
});

// Initial function calls
// createFloatingWindow() is now called upon receiving the 'process_xml' command.
// We remove the old createFloatingWindow/startSubtitleObserver call from the message listener
// as we only want to proceed once the user provides the XML file.
// The code from the original content.js is now fully contained in this file.
// The old logic for create_window is also removed as it is now part of process_xml flow.
