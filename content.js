// --- SAFE GLOBAL VARIABLE INITIALIZATION ---

var floatingWindow = floatingWindow || null;
var parsedSubtitles = parsedSubtitles || [];
var syncInterval = syncInterval || null; 
// Initialize to empty strings, values will be set from the popup message
var subtitleLanguages = subtitleLanguages || { base: '', target: '' }; 
var translationCache = translationCache || {}; // Cache for translations

var currentTranslator = currentTranslator || null; 
// CORRECTED TICK_RATE: Standard high-resolution for TTML timing (10,000,000 ticks/sec).
var TICK_RATE = TICK_RATE || 10000000; 

// --- Utility Functions ---

/**
 * Helper to send status updates back to the popup and save state to local storage.
 */
function sendStatusUpdate(message, progress, url = null) {
    // 1. Save state to local storage (for persistent popup display)
    chrome.storage.local.set({
        'ls_status': { 
            message: message,
            progress: progress,
            baseLang: progress < 100 ? subtitleLanguages.base : null,
            targetLang: progress < 100 ? subtitleLanguages.target : null,
            url: progress < 100 ? url : null 
        }
    }).catch(e => console.error("Could not save status to storage:", e));

    // 2. Send state to the currently open popup
    // CRITICAL FIX: Add .catch() to suppress "Unchecked runtime.lastError" 
    // when the popup window is closed.
    chrome.runtime.sendMessage({
        command: "update_status",
        message: message,
        progress: progress
    }).catch(e => {
        // Suppress the error: 'Could not establish connection. Receiving end does not exist.'
        // This is expected if the popup is closed.
        if (!e.message.includes('Receiving end does not exist')) {
            console.warn("Content Script Messaging Error:", e);
        }
    }); 
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
    const playerView = document.querySelector('.watch-video--player-view');
    if (playerView) {
        return playerView.querySelector('video');
    }
    return document.querySelector('video[src*="blob"]');
}

// --- XML Fetching, Parsing, and Window Logic ---

async function fetchXmlContent(url) {
    try {
        // Fetch starts at 10%
        sendStatusUpdate("Fetching XML from external URL...", 10, url); 
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} (${response.statusText})`);
        }
        sendStatusUpdate("Subtitle file downloaded. Starting parsing...", 15, url);
        return await response.text();
    } catch (e) {
        console.error("Error fetching XML from URL:", e);
        sendStatusUpdate(`Error fetching subtitles: ${e.message}. Check URL or network permissions.`, 0, url);
        return null;
    }
}

function parseTtmlXml(xmlString, url) {
    parsedSubtitles = []; 
    // Parsing starts at 20%
    sendStatusUpdate("Starting XML parsing...", 20, url); 

    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'application/xml'); 

        const errorNode = xmlDoc.querySelector('parsererror');
        if (errorNode) {
             console.error("XML Parsing Error:", errorNode.textContent);
             sendStatusUpdate(`Error: Could not parse XML. ${errorNode.textContent}`, 0, url);
             return false;
        }

        const subtitleParagraphs = xmlDoc.querySelectorAll('p');
        const totalSubs = subtitleParagraphs.length;

        subtitleParagraphs.forEach((p, index) => {
            const beginTick = p.getAttribute('begin');
            const endTick = p.getAttribute('end');
                        
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlString;
            const pElement = tempDiv.firstElementChild; 
            let text = pElement.textContent;
            text = text.replace(/\s+/g, ' ');
            text = text.trim();

            if (beginTick && endTick && text) {
                parsedSubtitles.push({
                    begin: ticksToSeconds(beginTick),
                    end: ticksToSeconds(endTick),
                    text: text,
                    translatedText: null
                });
            }

            // Progress for parsing: 20% to 25% (Smoother update logic)
            if (index % 10 === 0 || index === totalSubs - 1) { 
                const progress = 20 + Math.floor((index / totalSubs) * 5); 
                sendStatusUpdate(`Processing subtitles: ${index + 1}/${totalSubs} lines...`, progress, url);
            }
        });

        console.log(`Successfully parsed ${parsedSubtitles.length} subtitles.`);
        // Start translation setup at 25%
        sendStatusUpdate(`Finished parsing ${parsedSubtitles.length} subtitles. Starting language detection...`, 25, url);
        return true;

    } catch (e) {
        console.error("Fatal error during XML parsing:", e);
        sendStatusUpdate("Fatal error during XML parsing. Check console.", 0, url);
        return false;
    }
}

// --- NEW FUNCTION: Base Language Detection ---
/**
 * Detects the language of the first 50 subtitle lines using the Chrome Detector API.
 */
function detectBaseLanguage() {
    // Take a sample of the first 50 lines' text
    const sampleText = parsedSubtitles.slice(0, 50)
                                     .map(sub => sub.text)
                                     .join(' ')
                                     .slice(0, 1000); // Max 1000 chars

    return new Promise((resolve) => {
        // Fallback if API or feature is missing
        if (!chrome.i18n || !chrome.i18n.detectLanguage) {
            console.error("Chrome i18n.detectLanguage API not available. Defaulting to 'en'.");
            resolve('en'); // Default fallback language
            return;
        }

        chrome.i18n.detectLanguage(sampleText, (result) => {
            // FIX: If Chrome cannot detect confidently, it returns 'und' (undetermined).
            const detectedCode = (result.languages && result.languages.length > 0 && result.languages[0].language !== 'und') 
                                ? result.languages[0].language : null; // Return null if detection is uncertain
            resolve(detectedCode);
        });
    });
}


function createFloatingWindow() {
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
      padding: 20px 30px; 
      color: white;
      font-family: 'Inter', sans-serif;
      font-size: 3.6rem; 
      text-align: center;
      line-height: 1.4;
      /* FIX: Removed 'resize: both' to prevent size change on drag */
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
    
    // FIX: Ensure cursor update is immediate and persistent
    element.style.cursor = 'grabbing !important'; 
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
    // Ensure transform reset is maintained
    element.style.transform = 'none'; 
  };

  const stopDrag = () => {
    isDragging = false;
    // Restore default cursor style
    element.style.cursor = 'grab';
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('touchend', stopDrag);
  };

  element.addEventListener('mousedown', startDrag);
  element.addEventListener('touchstart', startDrag);
}


// --- Translation Logic (REWRITTEN FOR NATIVE API) ---

var currentTranslator = currentTranslator || null; 

/**
 * Translates the given text using the native Chrome Translator API.
 * Handles Translator instance creation and model download monitoring.
 */
async function translateSubtitle(textToTranslate, sourceLang, targetLang) {
    const cacheKey = `${sourceLang}-${targetLang}:${textToTranslate}`;
    if (translationCache[cacheKey]) {
        return translationCache[cacheKey];
    }
    
    // Check if the translator needs to be created or updated
    if (!currentTranslator || 
        currentTranslator.sourceLanguage !== sourceLang || 
        currentTranslator.targetLanguage !== targetLang) {

        if (!('Translator' in self)) {
            // Feature detection check
            sendStatusUpdate("ERROR: Chrome Translator API not supported in this browser version.", 0);
            return "(Translation Failed - API Missing)";
        }
        
        try {
             // 1. Create the new translator instance, monitoring download progress
             currentTranslator = await Translator.create({
                sourceLanguage: sourceLang,
                targetLanguage: targetLang,
                monitor(m) {
                    m.addEventListener('downloadprogress', (e) => {
                        const loaded = Math.floor(e.loaded * 100);
                        // PROGRESS UPDATE: Model download is 30% to 59% (29% of total bar)
                        const overallProgress = 30 + Math.floor(loaded * 0.29); 
                        sendStatusUpdate(`Downloading model: ${loaded}% complete.`, overallProgress);
                    });
                }
            });
            // PROGRESS UPDATE: Model ready just before translation loop starts
            sendStatusUpdate("Translator model ready. Starting translation...", 60); 

        } catch (e) {
            console.error("Native Translator API failed to create:", e);
            sendStatusUpdate(`Translation failed during model setup: ${e.message}`, 0);
            return "(Translation Failed - Model Setup Error)";
        }
    }

    // 2. Perform the translation
    try {
        const translatedText = await currentTranslator.translate(textToTranslate);
        if (translatedText) {
            translationCache[cacheKey] = translatedText.trim();
            return translatedText.trim();
        }
        throw new Error("Empty translation result.");

    } catch (e) {
        console.error(`Native translation failed for: "${textToTranslate}"`, e);
        // This usually means the API or language pair is unavailable.
        return `(Translation Failed - Unavailable)`;
    }
}


/**
 * Runs CONCURRENT translation for all parsed subtitles to drastically increase speed.
 */
async function translateAllSubtitles(url) {
    const totalSubs = parsedSubtitles.length;
    const baseLang = subtitleLanguages.base;
    const targetLang = subtitleLanguages.target;

    // 1. Create an array of Promises for all translation jobs
    const translationPromises = parsedSubtitles.map(async (sub, index) => {
        let translatedText;
        
        // Skip lines that are just sound effects (e.g., [Music], [Sigh])
        if (sub.text.match(/^\[.*\]$/)) {
             translatedText = sub.text;
        } else {
             // 2. Execute translation call (which returns a Promise)
             translatedText = await translateSubtitle(sub.text, baseLang, targetLang);
        }
        
        // Update the progress status *periodically* since the loop isn't sequential
        // FIX: Smoother update, checking every 5 lines
        if (index % 5 === 0 || index === totalSubs - 1) { 
             const progress = 60 + Math.floor(((index + 1) / totalSubs) * 40); 
             if (progress < 100) { 
                 sendStatusUpdate(`Translating: ${index + 1}/${totalSubs} lines...`, progress, url);
             }
        }

        return translatedText;
    });

    // 3. Wait for all Promises (translations) to resolve concurrently
    sendStatusUpdate(`Starting concurrent translation of ${totalSubs} lines...`, 60, url);
    const results = await Promise.all(translationPromises);
    
    // 4. Update the original subtitle objects with the results
    results.forEach((translatedText, index) => {
        parsedSubtitles[index].translatedText = translatedText;
    });

    // FIX: Final status update to 100% after all work is done.
    sendStatusUpdate(`Translation complete! ${totalSubs} lines ready.`, 100, url);
    console.log("Native translation process finished. All subtitles are ready.");
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
    
    var currentSubtitleIndex = -1;
    var lastTime = 0;
    
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
        for (let i = Math.max(0, currentSubtitleIndex - 2); i < Math.min(currentSubtitleIndex + 4, parsedSubtitles.length); i++) {
             const sub = parsedSubtitles[i];
             if (i >= 0 && sub) {
                 if (currentTime >= sub.begin && currentTime < sub.end) {
                     newSubtitle = sub;
                     newIndex = i;
                     subtitleFound = true;
                     break;
                 }
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
                // NEW SUBTITLE LINE DETECTED: Use the pre-translated text
                const baseText = newSubtitle.text;
                const translatedText = newSubtitle.translatedText || `(Translation Error)`;

                // Base language (original text) is smaller (0.8em of 3.6rem)
                // Translated line (learning language) is larger (1em of 3.6rem)
                floatingWindow.innerHTML = `
                    <span class="base-sub" style="font-weight: bold; font-size: 0.8em;">${baseText}</span><br>
                    <span class="translated-sub" style="opacity: 1.0; font-size: 1em;">
                        ${translatedText}
                    </span>
                `;
                currentSubtitleIndex = newIndex;
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
    // Note: request.baseLang is no longer sent from popup.js
    if (request.command === "fetch_and_process_url" && request.url) {
        console.log("C1. Received 'fetch_and_process_url' command from popup.");

        // 1. Store only the target language initially
        subtitleLanguages.target = request.targetLang;
        // subtitleLanguages.base will be set after detection
        translationCache = {}; 
        
        if (syncInterval) {
            clearInterval(syncInterval);
        }

        // 2. Clear status locally and start UI update
        const url = request.url;
        // API CHECK
        if (!('Translator' in self)) {
            sendStatusUpdate("ERROR: Chrome Translator API not detected. Translations are unavailable.", 0, url);
            return false;
        }

        // Initial progress starts low
        sendStatusUpdate(`Ready to fetch XML for target language: ${subtitleLanguages.target}`, 10, url);
        console.log("C2. Starting core fetch/parse/translate sequence...");


        // 3. Async wrapper to handle the fetch/parse/translate sequence
        (async () => {
            const xmlContent = await fetchXmlContent(url);
            
            console.log("C3. XML Content fetch complete. Content size:", xmlContent ? xmlContent.length : '0');


            if (xmlContent) {
                // 4. Create the floating window and disable native subs
                createFloatingWindow();
                disableNetflixSubObserver();
                
                // 5. Parse the XML
                const parseSuccess = parseTtmlXml(xmlContent, url);
                
                console.log("C4. XML Parsing attempt finished. Success:", parseSuccess);

                if (parseSuccess && parsedSubtitles.length > 0) {
                    
                    // --- NEW STEP: BASE LANGUAGE DETECTION (25% -> 30%) ---
                    sendStatusUpdate("Detecting subtitle language...", 25, url);
                    const detectedLang = await detectBaseLanguage();
                    subtitleLanguages.base = detectedLang;
                    
                    // FIX: Check if detectedLang is null (detection failed)
                    if (!subtitleLanguages.base) {
                        sendStatusUpdate(`Detected Base Language: (FAIL). Starting translation...`, 30, url);
                        // Use a fallback language if detection fails for translation
                        subtitleLanguages.base = 'en'; 
                    } else {
                        // UPDATE UI with detected language
                        sendStatusUpdate(`Detected Base Language: ${detectedLang.toUpperCase()}. Starting translation...`, 30, url);
                    }


                    // 6. Run concurrent translation (30% -> 100%)
                    console.log(`C5. Starting concurrent translation: ${subtitleLanguages.base} -> ${subtitleLanguages.target}...`);
                    await translateAllSubtitles(url);

                    // 7. Start synchronization after translation is 100% complete
                    console.log("C6. Translation complete. Starting subtitle sync loop.");
                    startSubtitleSync();
                } else {
                    console.error("C7. Failed to parse XML or no subtitles found after parsing.");
                    sendStatusUpdate("Failed to process XML or no subtitles found.", 0, url);
                }
            }
        })();
        
        return false; 
    }
    
    // HANDLER: Stops the background sync loop when the user cancels
    if (request.command === "cancel_processing") {
        if (syncInterval) {
            clearInterval(syncInterval);
            syncInterval = null;
            console.log("Subtitle sync loop stopped by user cancel.");
        }
        // Also hide the floating window
        if (floatingWindow) {
            floatingWindow.style.display = 'none';
            floatingWindow.innerHTML = '';
        }
        return true;
    }
    
    if (request.command === "ping") {
        sendResponse({ status: "ready" });
        return true;
    }
});