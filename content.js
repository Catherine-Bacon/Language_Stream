// --- SAFE GLOBAL VARIABLE INITIALIZATION ---
// This pattern prevents '...has already been declared' errors when the content script 
// is injected multiple times (e.g., when the extension popup is repeatedly opened).

var floatingWindow = floatingWindow || null;
var parsedSubtitles = parsedSubtitles || [];
var syncInterval = syncInterval || null; 
var subtitleLanguages = subtitleLanguages || { base: 'en', target: 'es' };
var translationCache = translationCache || {};

// Constants must also be declared this way using 'var'
var TICK_RATE = TICK_RATE || 10000000; 
var API_URL = API_URL || "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent";
var API_KEY = API_KEY || ""; // Placeholder - Canvas will provide this at runtime

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

// --- XML Fetching, Parsing, and Window Logic ---

async function fetchXmlContent(url) {
    try {
        sendStatusUpdate("Fetching XML from external URL...", 20);
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

function parseTtmlXml(xmlString) {
    // Clear old subtitles array
    parsedSubtitles = []; 
    sendStatusUpdate("Starting XML parsing...", 40);

    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'application/xml'); 

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

            if (index % 100 === 0 || index === totalSubs - 1) {
                const progress = 40 + Math.floor((index / totalSubs) * 40); 
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

function createFloatingWindow() {
  // Use assignment since it's checked for existence at the top level
  let existingWindow = document.getElementById('language-stream-window');
  if (existingWindow) {
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
    floatingWindow = windowDiv; // Assign to the global variable
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

// --- Translation Logic ---

/**
 * Translates the given text using the Gemini API with exponential backoff.
 * @param {string} textToTranslate The subtitle text to translate.
 * @param {string} sourceLang The source language code (e.g., 'en').
 * @param {string} targetLang The target language code (e.g., 'es').
 * @returns {Promise<string>} The translated text.
 */
async function translateSubtitle(textToTranslate, sourceLang, targetLang) {
    const cacheKey = `${sourceLang}-${targetLang}:${textToTranslate}`;
    if (translationCache[cacheKey]) {
        return translationCache[cacheKey];
    }

    const systemPrompt = `You are an expert, fluent language translator. Translate the following text from ${sourceLang} to ${targetLang}. Provide only the translation, with no extra commentary, formatting, or punctuation unless it is part of the translation.`;
    const userQuery = textToTranslate;
    
    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
    };

    let translatedText = `Translation Error: Check console`;
    const maxRetries = 3;
    let delay = 1000;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(`${API_URL}?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                    translatedText = text.trim();
                    translationCache[cacheKey] = translatedText;
                    return translatedText;
                }
            }
             // If response not OK or content missing, throw to trigger retry/catch
             throw new Error(`API response failed or content was empty. Status: ${response.status}`);

        } catch (error) {
            console.warn(`Translation attempt ${i + 1} failed. Retrying in ${delay / 1000}s.`);
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
            } else {
                console.error("Gemini API translation failed after all retries.", error);
            }
        }
    }

    return translatedText; 
}


// --- Floating Window & Sync Logic ---

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
                // NEW SUBTITLE LINE DETECTED:
                const baseText = newSubtitle.text;
                const targetLang = subtitleLanguages.target;

                // 1. Immediately update the floating window with the base text and a loading indicator
                floatingWindow.innerHTML = `
                    <span class="base-sub" style="font-weight: bold;">${baseText}</span><br>
                    <span id="translated-line-${newIndex}" class="translated-sub" style="opacity: 0.7; font-size: 0.85em;">
                        ...translating to ${targetLang.toUpperCase()}...
                    </span>
                `;
                currentSubtitleIndex = newIndex;
                console.log(`Showing sub at ${currentTime.toFixed(3)}s: ${baseText}`);
                
                // 2. Start translation in the background
                translateSubtitle(baseText, subtitleLanguages.base, targetLang)
                    .then(translatedText => {
                        // Check if the current line index is still the same (i.e., we haven't jumped to a new line)
                        if (currentSubtitleIndex === newIndex) {
                            const translatedElement = document.getElementById(`translated-line-${newIndex}`);
                            if (translatedElement) {
                                translatedElement.textContent = translatedText;
                                translatedElement.style.opacity = '1.0';
                            }
                        }
                    })
                    .catch(e => {
                         console.error("Translation promise failed:", e);
                         // Display error message on the screen
                         if (currentSubtitleIndex === newIndex) {
                             const translatedElement = document.getElementById(`translated-line-${newIndex}`);
                             if (translatedElement) {
                                translatedElement.textContent = "Translation failed.";
                            }
                         }
                    });

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
        // Clear cache when starting new language combination
        translationCache = {}; 
        
        // Clear old sync loop if it was running
        if (syncInterval) {
            clearInterval(syncInterval);
        }

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
