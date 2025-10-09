// --- SAFE GLOBAL VARIABLE INITIALIZATION ---

var floatingWindow = floatingWindow || null;
var parsedSubtitles = parsedSubtitles || [];
var syncInterval = syncInterval || null; 
// Initialize to empty strings, values will be set from the popup message
var subtitleLanguages = subtitleLanguages || { base: '', target: '' }; 
var translationCache = translationCache || {}; // Cache for translations

var isTranslatedOnly = isTranslatedOnly || false; // <--- ADDED: Preference tracker
var fontSizeEm = 'medium'; // <--- UPDATED: Default font size value (preference string)
var backgroundColorPref = 'black'; // <--- NEW: Background color preference
var fontShadowPref = 'black_shadow'; // <--- NEW: Font shadow preference
var fontColorPref = 'white'; // <--- NEW: Font color preference

var isProcessing = false; // <--- NEW: Flag to prevent repeated execution
var isCancelled = false; // <--- NEW: Cancellation flag

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
        // Fetch starts at 10% - REMOVED PROGRESS UPDATE
        const response = await fetch(url);
        
        if (!response.ok) {
            // --- MODIFICATION START: 403 CHECK IS THE FIRST RESPONSE ERROR HANDLING ---
            if (response.status === 403) {
                 // Throw a unique, specific error tag for the catch block
                 throw new Error("403_FORBIDDEN"); 
            }
            // If it's not a 403, throw the general HTTP error
            throw new Error(`HTTP error! status: ${response.status} (${response.statusText})`);
            // --- MODIFICATION END ---
        }
        
        // Subtitle file downloaded. Starting parsing... - REMOVED PROGRESS UPDATE
        return await response.text();
    } catch (e) {
        
        // --- MODIFICATION START: Handle the specific 403 message first in catch ---
        if (e.message === "403_FORBIDDEN") {
             // This is the message you requested for 403
             sendStatusUpdate("Old subtitle URL used; please repeat URL retrieval steps.", 0, url);
        } else {
             // Handle all other errors (including generic HTTP errors and network errors)
             sendStatusUpdate(`Error fetching subtitles: ${e.message}. Check URL or network permissions.`, 0, url);
        }
        // --- MODIFICATION END ---
        
        return null;
    }
}

function parseTtmlXml(xmlString, url) {
    parsedSubtitles = []; 
    // Parsing starts at 20% - REMOVED PROGRESS UPDATE

    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'application/xml'); 

        const errorNode = xmlDoc.querySelector('parsererror');
        if (errorNode) {
             // Keep this error for debugging parsing issues
             console.error("XML Parsing Error:", errorNode.textContent);
             sendStatusUpdate(`Error: Could not parse XML. ${errorNode.textContent}`, 0, url);
             return false;
        }

        const subtitleParagraphs = xmlDoc.querySelectorAll('p');
        const totalSubs = subtitleParagraphs.length;

        subtitleParagraphs.forEach((p, index) => {
            const beginTick = p.getAttribute('begin');
            const endTick = p.getAttribute('end');
            
            // ----------------------------------------------------
            // --- START DEBUG LOGGING & TEXT EXTRACTION FIX ---
            // ----------------------------------------------------
            
            // 1. Get the inner HTML string.
            let rawHtml = p.innerHTML;
            
            // Debug 1: Show the raw XML content (may contain multiple lines inside a span or just text)
            // console.log(`[DEBUG PARSE] Sub ${index + 1}: Raw Inner HTML: "${rawHtml}"`);

            // 2. FIX 1: Replace HTML line breaks with a space.
            let htmlWithSpaces = rawHtml.replace(/<br[\s\S]*?\/>|<br>/gi, ' '); 
            
            // Debug 2: Show HTML after <br> replacement
            // console.log(`[DEBUG PARSE] Sub ${index + 1}: HTML After BR Replace: "${htmlWithSpaces}"`);

            // 3. Create a temporary element and load the modified HTML.
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlWithSpaces;
            
            // 4. Extract the clean text content from the temporary div.
            let text = tempDiv.textContent; 


            // 5. Normalize all whitespace to a single space, and trim.
            text = text.replace(/\s+/g, ' ');
            text = text.trim();

            // Debug 3: Show the final extracted text
            // console.log(`[DEBUG PARSE] Sub ${index + 1}: Final Extracted Text: "${text}"`);

            // ----------------------------------------------------
            // --- END DEBUG LOGGING & TEXT EXTRACTION FIX ---
            // ----------------------------------------------------


            if (beginTick && endTick && text) {
                parsedSubtitles.push({
                    begin: ticksToSeconds(beginTick),
                    end: ticksToSeconds(endTick),
                    text: text,
                    translatedText: null
                });
            }

            // Progress for parsing: 20% to 25% (Smoother update logic) - REMOVED PROGRESS UPDATE LOOP
        });

        console.log(`Successfully parsed ${parsedSubtitles.length} subtitles.`);
        // Start translation setup at 25% - REMOVED PROGRESS UPDATE
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
  
  // --- NEW: Dynamic styles based on preferences ---
  const bgColor = backgroundColorPref === 'none' ? 'rgba(0, 0, 0, 0)' : 
                  backgroundColorPref === 'black' ? 'rgba(0, 0, 0, 0.85)' : 
                  'rgba(128, 128, 128, 0.85)'; // Gray
  
  // Font shadow requires helper function or direct calculation
  const textShadow = getFontShadowCss(fontShadowPref);
  
  // Font color is applied to the individual spans, but we set the container's default for clarity
  const defaultFontColor = getFontColor(fontColorPref);
  
  if (existingWindow) {
    floatingWindow = existingWindow;
    // Update existing window styles
    floatingWindow.style.backgroundColor = bgColor;
    floatingWindow.style.textShadow = textShadow;
    floatingWindow.style.color = defaultFontColor; // Apply the default color

  } else {
    const windowDiv = document.createElement('div');
    windowDiv.id = 'language-stream-window';
    windowDiv.style.cssText = `
      position: fixed;       
      top: 80%;            
      left: 50%;
      transform: translate(-50%, 0); 
      width: 70%; 
      max-width: 800px;
      min-height: 50px;
      background-color: ${bgColor}; /* NEW: Dynamic Background Color */
      border: 2px solid #e50914;
      border-radius: 12px;
      box-shadow: 0 6px 15px rgba(0, 0, 0, 0.7);
      z-index: 9999;
      padding: 20px 30px; 
      color: ${defaultFontColor}; /* NEW: Dynamic Default Font Color */
      font-family: 'Inter', sans-serif;
      /* Font size of the container is large, but text size is controlled by span */
      font-size: 3.6rem; 
      text-align: center;
      line-height: 1.4;
      overflow: hidden;
      cursor: grab;
      display: none; 
      text-shadow: ${textShadow}; /* NEW: Dynamic Text Shadow */
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
    // --- MODIFICATION: Prevent default behavior immediately on drag start ---
    // This stops accidental resizing and context menu display.
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
    
    // --- MODIFICATION: Prevent default behavior during drag ---
    e.preventDefault(); 
    
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
                        // PROGRESS UPDATE: Model download is 30% to 60%
                        const overallProgress = 30 + Math.floor(loaded * 0.3); 
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
 * Runs CONCURRENT translation for all parsed subtitles, prioritizing the first 30 lines.
 *
 * MODIFIED: Checks the global isCancelled flag and throws an error to abort the promise chain.
 */
async function translateAllSubtitles(url) {
    const totalSubs = parsedSubtitles.length;
    const baseLang = subtitleLanguages.base;
    const targetLang = subtitleLanguages.target;
    
    // Define the critical, prioritized batch size
    const CRITICAL_BATCH_SIZE = 30; 
    
    // Split the subtitles into two groups
    const criticalBatch = parsedSubtitles.slice(0, CRITICAL_BATCH_SIZE);
    const concurrentBatch = parsedSubtitles.slice(CRITICAL_BATCH_SIZE);

    // Initial progress before starting translation is 60%
    const START_PROGRESS = 60;
    const CRITICAL_BATCH_WEIGHT = 10; // Allocate 10% of the progress bar to the first batch (60% to 70%)
    const CONCURRENT_BATCH_WEIGHT = 30; // Allocate 30% to the rest (70% to 100%)


    // ----------------------------------------------------------------------
    // 1. PHASE 1: SEQUENTIAL TRANSLATION (CRITICAL BATCH) - 60% to 70%
    // ----------------------------------------------------------------------
    console.log(`C6.1. Starting sequential translation of the first ${criticalBatch.length} lines.`);
    sendStatusUpdate(`Translating first ${criticalBatch.length} lines for immediate playback...`, START_PROGRESS, url);

    for (let index = 0; index < criticalBatch.length; index++) {
        // --- CANCELLATION CHECK 1: BEFORE EACH SEQUENTIAL CALL ---
        if (isCancelled) {
             console.log("Translation aborted by user cancellation.");
             throw new Error("ABORT_TRANSLATION");
        }
        // --------------------------------------------------------
        
        const sub = criticalBatch[index];
        let translatedText;
        
        // --- MODIFICATION: REMOVED IF-BLOCK. ALL TEXT IS TRANSLATED. ---
        translatedText = await translateSubtitle(sub.text, baseLang, targetLang);
        // -------------------------------------------------------------------------
        
        // Update the original subtitle object directly
        sub.translatedText = translatedText; 
        
        // Update progress for the critical batch (60% to 70%)
        const progress = START_PROGRESS + Math.floor(((index + 1) / criticalBatch.length) * CRITICAL_BATCH_WEIGHT);
        sendStatusUpdate(`First ${index + 1} lines ready to watch!`, progress, url);
    }
    
    // Ensure we reach the boundary progress before starting the main batch
    const CONCURRENT_START_PROGRESS = START_PROGRESS + CRITICAL_BATCH_WEIGHT; // 70%
    sendStatusUpdate(`First ${CRITICAL_BATCH_SIZE} lines ready! Starting background translation...`, CONCURRENT_START_PROGRESS, url);


    // ----------------------------------------------------------------------
    // 2. PHASE 2: CONCURRENT TRANSLATION (REMAINING BATCH) - 70% to 100%
    // ----------------------------------------------------------------------
    console.log(`C6.2. Starting concurrent translation of the remaining ${concurrentBatch.length} lines.`);

    // 2.1. Create an array of Promises for the concurrent batch translation jobs
    const translationPromises = concurrentBatch.map(async (sub, index) => {
        
        // --- CANCELLATION CHECK 2: BEFORE EACH CONCURRENT CALL (Inside the map loop) ---
        if (isCancelled) {
             // Returning a promise that resolves immediately with an error tag
             return Promise.resolve("ABORTED"); 
        }
        // -------------------------------------------------------------------------------

        let translatedText;
        
        // --- MODIFICATION: REMOVED IF-BLOCK. ALL TEXT IS TRANSLATED. ---
        translatedText = await translateSubtitle(sub.text, baseLang, targetLang);
        // -------------------------------------------------------------------------
        
        // 2.3. Update the subtitle object
        sub.translatedText = translatedText;

        // 2.4. Update the progress status *periodically*
        if (index % 5 === 0 || index === concurrentBatch.length - 1) { 
             // PROGRESS CALCULATION: Range 70% to 100%
             const progress = CONCURRENT_START_PROGRESS + Math.floor(((index + 1) / concurrentBatch.length) * CONCURRENT_BATCH_WEIGHT); 
             if (progress < 100) { 
                 // Send a message showing total lines ready (critical + concurrent index)
                 const totalReady = CRITICAL_BATCH_SIZE + index + 1;
                 sendStatusUpdate(`First ${totalReady} lines ready to watch!`, progress, url);
             }
        }

        return translatedText; // Return value is not strictly used, but keeps Promise.all happy
    });

    // 2.5. Wait for all Promises (translations) to resolve concurrently
    // We expect some promises to resolve with "ABORTED" if cancelled
    await Promise.all(translationPromises);
    
    // ----------------------------------------------------------------------
    // 3. PHASE 3: FINAL COMPLETION - 100%
    // ----------------------------------------------------------------------
    
    // Only send 100% update if not cancelled
    if (!isCancelled) {
        // Final 100% status update
        sendStatusUpdate(`Translation complete! ${totalSubs} lines ready.`, 100, url);
        console.log("Native translation process finished. All subtitles are ready.");
    } else {
        // Send a final status update that acknowledges the cancellation
        sendStatusUpdate("Subtitle generation cancelled by user.", 0, url);
    }
}

// --- NEW helper function to convert the string preference to a CSS 'em' value ---
function getFontSizeEm(preference) {
    switch (preference) {
        case 'small':
            return '0.75em'; // Adjusted for slightly smaller size on screen
        case 'large':
            return '1.1em'; // Adjusted for slightly larger size on screen
        case 'medium':
        default:
            return '0.9em'; // Adjusted for a visually balanced medium on screen
    }
}

// --- NEW helper function to get CSS text-shadow value ---
function getFontShadowCss(preference) {
    switch (preference) {
        case 'black_shadow':
            // Standard black drop shadow for readability
            return '2px 2px 4px rgba(0, 0, 0, 0.8)'; 
        case 'white_shadow':
            // White outline/shadow for dark backgrounds
            return '1px 1px 2px rgba(255, 255, 255, 0.8), -1px -1px 2px rgba(255, 255, 255, 0.8)';
        case 'none':
        default:
            return 'none';
    }
}

// --- NEW helper function to get CSS font color value ---
function getFontColor(preference) {
    switch (preference) {
        case 'yellow':
            return '#FFFF00';
        case 'cyan':
            return '#00FFFF';
        case 'white':
        default:
            return '#FFFFFF';
    }
}
// ---------------------------------------------------------------------------------

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

    // Determine the styles once at the start of the loop setup
    const currentFontSizeEm = getFontSizeEm(fontSizeEm);
    const currentFontShadow = getFontShadowCss(fontShadowPref);
    const currentFontColor = getFontColor(fontColorPref); // New

    // Update the floating window's text shadow and background color
    if (floatingWindow) {
        const bgColor = backgroundColorPref === 'none' ? 'rgba(0, 0, 0, 0)' : 
                        backgroundColorPref === 'black' ? 'rgba(0, 0, 0, 0.85)' : 
                        'rgba(128, 128, 128, 0.85)'; // Gray
        floatingWindow.style.backgroundColor = bgColor;
        floatingWindow.style.textShadow = currentFontShadow;
        // The overall window color should be the chosen font color
        floatingWindow.style.color = currentFontColor;
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
                
                const baseText = newSubtitle.text;
                const translatedText = newSubtitle.translatedText; // <-- Get the translated text (can be null while translating)

                let innerHTML = '';
                
                // --- CRITICAL FIX START: Check if translatedText is available ---
                if (translatedText) {
                     if (isTranslatedOnly) {
                        // Show only the translated text (with matching font size, non-bold, and preferred color)
                        innerHTML = `
                            <span class="translated-sub" style="opacity: 1.0; font-size: ${currentFontSizeEm}; color: ${currentFontColor};">
                                ${translatedText}
                            </span>
                        `;
                    } else {
                        // Show both (original text and translated text use the same size, and preferred color)
                        // Note: Setting color on the span overrides the window's default color
                        innerHTML = `
                            <span class="base-sub" style="font-size: ${currentFontSizeEm}; color: ${currentFontColor};">${baseText}</span><br>
                            <span class="translated-sub" style="opacity: 1.0; font-size: ${currentFontSizeEm}; color: ${currentFontColor};">
                                ${translatedText}
                            </span>
                        `;
                    }
                } else {
                     // If translation is NOT complete, show a placeholder or nothing
                     
                     if (isTranslatedOnly) {
                         // If the user wants ONLY translated text, but it's not ready, show nothing
                         innerHTML = ''; 
                     } else {
                         // Show base text, and a simple loading indicator (with matching font size and preferred color)
                         innerHTML = `
                             <span class="base-sub" style="font-size: ${currentFontSizeEm}; color: ${currentFontColor};">${baseText}</span><br>
                             <span class="translated-sub" style="opacity: 0.6; font-size: ${currentFontSizeEm}; color: ${currentFontColor};">
                                 (Translating...)
                             </span>
                         `;
                     }
                }
                // --- CRITICAL FIX END ---
                
                floatingWindow.innerHTML = innerHTML;
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
        
        // --- NEW CHECK: PREVENT RE-ENTRY ---
        if (isProcessing) {
            console.log("C1. Process already running, ignoring repeated 'fetch_and_process_url' command.");
            return false;
        }
        isProcessing = true; // Set flag to block future attempts until reset
        isCancelled = false; // RESET the cancel flag for a new run
        // ------------------------------------
        
        console.log("C1. Received 'fetch_and_process_url' command from popup.");

        // 1. Store the preferences from the popup message
        subtitleLanguages.target = request.targetLang;
        isTranslatedOnly = request.translatedOnly; // <--- ADDED: Preference tracker
        fontSizeEm = request.fontSize; // <--- NEW: Get font size preference
        backgroundColorPref = request.backgroundColor; // <--- NEW: Get background color preference
        fontShadowPref = request.fontShadow; // <--- NEW: Get font shadow preference
        fontColorPref = request.fontColor; // <--- NEW: Get font color preference

        translationCache = {}; 
        
        if (syncInterval) {
            clearInterval(syncInterval);
        }

        // 2. Clear status locally and start UI update
        const url = request.url;
        // API CHECK
        if (!('Translator' in self)) {
            sendStatusUpdate("ERROR: Chrome Translator API not detected. Translations are unavailable.", 0, url);
            isProcessing = false; // Reset on failure
            return false;
        }

        // Initial progress starts low - REMOVED PROGRESS UPDATE
        console.log("C2. Starting core fetch/parse/translate sequence...");


        // 3. Async wrapper to handle the fetch/parse/translate sequence
        (async () => {
            const xmlContent = await fetchXmlContent(url);
            
            console.log("C3. XML Content fetch complete. Content size:", xmlContent ? xmlContent.length : '0');

            if (!xmlContent || isCancelled) {
                // Fetch failed or was cancelled during fetch
                isProcessing = false; 
                return; 
            }
            
            // 4. Create the floating window and disable native subs
            createFloatingWindow();
            disableNetflixSubObserver();
            
            // 5. Parse the XML
            const parseSuccess = parseTtmlXml(xmlContent, url);
            
            console.log("C4. XML Parsing attempt finished. Success:", parseSuccess);

            if (parseSuccess && parsedSubtitles.length > 0 && !isCancelled) {
                
                // --- NEW STEP: BASE LANGUAGE DETECTION (Now 0% -> 30% jump) ---
                // This is the first progress report > 0%, which will show the cancel button!
                sendStatusUpdate("Detecting subtitle language...", 30, url); 
                const detectedLang = await detectBaseLanguage();
                subtitleLanguages.base = detectedLang;
                
                // Check for cancel again after the awaited detection
                if (isCancelled) {
                    isProcessing = false;
                    return;
                }
                
                // FIX: Check if detectedLang is null (detection failed)
                if (!subtitleLanguages.base) {
                    // The language detection failure message is now the first message AFTER 
                    // successful fetch/parse, so we jump the progress to 30% to acknowledge completion of initial steps
                    sendStatusUpdate(`Detected Base Language: (FAIL). Starting translation...`, 30, url);
                    // Use a fallback language if detection fails for translation
                    subtitleLanguages.base = 'en'; 
                } else {
                    // UPDATE UI with detected language
                    sendStatusUpdate(`Detected Base Language: ${detectedLang.toUpperCase()}. Starting translation...`, 30, url);
                }

                // -------------------------------------------------------------------------------------
                // ⭐ CRITICAL CHANGE: Start the sync loop NOW, right after detection and before translation.
                // This allows subtitles to appear as soon as they are translated concurrently.
                // -------------------------------------------------------------------------------------
                console.log("C5. Starting subtitle sync loop *early* while translation runs in background.");
                startSubtitleSync();
                // -------------------------------------------------------------------------------------


                // 6. Run concurrent translation (30% -> 100%)
                console.log(`C6. Starting concurrent translation: ${subtitleLanguages.base} -> ${subtitleLanguages.target}...`);
                try {
                    await translateAllSubtitles(url);
                } catch (e) {
                    if (e.message === "ABORT_TRANSLATION") {
                        // The loop was aborted by the cancellation flag. Do nothing and let isCancelled handle the cleanup.
                    } else {
                        console.error("Fatal error during translation:", e);
                    }
                }


                // 7. The sync loop (started in C5) continues running automatically.
                console.log("C7. Translation process finished. Checking final status...");
                isProcessing = false; // Reset flag only after completion/cancellation attempt

            } else {
                console.error("C8. Failed to process XML or no subtitles found after parsing/cancellation.");
                // Only send error status if it wasn't cancelled
                if (!isCancelled) {
                    sendStatusUpdate("Failed to process XML or no subtitles found.", 0, url);
                }
                isProcessing = false; // Reset flag on failure
            }
        })();
        
        return false; 
    }
    
    // HANDLER: Stops the background sync loop and sets the cancellation flag
    if (request.command === "cancel_processing") {
        isCancelled = true; // Set the flag to abort the translation loop
        
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
        
        // Since isProcessing is reset by the async wrapper, we just set the status immediately
        sendStatusUpdate("Subtitle generation cancelled by user.", 0);
        
        isProcessing = false; // Reset processing status
        // CRITICAL FIX: Return false to prevent the "A listener indicated an asynchronous response..." error
        return false; 
    }
    
    if (request.command === "ping") {
        // Since this isn't performing an async operation back to the sender, return false is safest.
        return false;
    }
});