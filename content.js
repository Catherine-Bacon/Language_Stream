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

var colourCodingPref = 'none'; // <--- NEW: Colour Coding preference

var isProcessing = false; // <--- NEW: Flag to prevent repeated execution
var isCancelled = false; // <--- NEW: Cancellation flag

var currentTranslator = currentTranslator || null; 
// CORRECTED TICK_RATE: Standard high-resolution for TTML timing (10,000,000 ticks/sec).
var TICK_RATE = TICK_RATE || 10000000; 

// --- Utility Functions ---

/**
 * Helper to send status updates back to the popup and save state to local storage.
 * MODIFIED: Added 'route' parameter for new status line logic in popup.
 */
function sendStatusUpdate(message, progress, url = null, route = 'main') {
    // 1. Save state to local storage (for persistent popup display)
    chrome.storage.local.set({
        'ls_status': { 
            message: message,
            progress: progress,
            // MODIFIED: Always save the base language code if available
            baseLang: subtitleLanguages.base, 
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
        progress: progress,
        route: route // NEW: Route information
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
             // This is the message you requested for 403. Route as 'url' message.
             sendStatusUpdate("Old subtitle URL used; please repeat URL retrieval steps.", 0, url, 'url');
        } else {
             // Handle all other errors (including generic HTTP errors and network errors). Route as 'url' message.
             sendStatusUpdate(`Error fetching subtitles: ${e.message}. Check URL or network permissions.`, 0, url, 'url');
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
             // MODIFICATION: Use the consolidated error message. Route as 'url' message.
             sendStatusUpdate(`Invalid URL retrieved - please repeat URL retrieval steps`, 0, url, 'url');
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
        // MODIFICATION: Use the consolidated error message. Route as 'url' message.
        sendStatusUpdate("Invalid URL retrieved - please repeat URL retrieval steps", 0, url, 'url');
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
  
  // Font shadow requires helper function or direct calculation
  const textShadow = getFontShadowCss(fontShadowPref);
  
  // Font color is applied to the individual spans, but we set the container's default for clarity
  const defaultFontColor = getFontColor(fontColorPref);
  
  if (existingWindow) {
    floatingWindow = existingWindow;
    // Only update shadow/color on existing window, background is handled by the spans now.
    floatingWindow.style.textShadow = textShadow;
    floatingWindow.style.color = defaultFontColor; 

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
      
      /* MODIFIED: REMOVE BACKGROUND COLOR AND PADDING from the main window */
      background-color: rgba(0, 0, 0, 0); 
      padding: 0; 
      
      /* MODIFIED: REMOVE BORDER/SHADOW from the main window, keeping only grab cursor and z-index */
      border-radius: 0;
      box-shadow: none;
      z-index: 9999;
      
      color: ${defaultFontColor}; 
      font-family: 'Inter', sans-serif;
      font-size: 3.6rem; 
      text-align: center;
      line-height: 1.4;
      overflow: hidden;
      cursor: grab;
      display: none; 
      text-shadow: ${textShadow}; 
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
    const clientY = e.touches[0].clientY;
    
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
    const clientY = e.touches[0].clientY;
    
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
 * * MODIFIED: This function now returns a structured object to simulate
 * word-for-word translation data when colour coding is active.
 */
async function translateSubtitle(textToTranslate, sourceLang, targetLang) {
    const cacheKey = `${sourceLang}-${targetLang}:${textToTranslate}`;
    if (translationCache[cacheKey]) {
        // Return the cached result (which is now the structured object)
        return translationCache[cacheKey];
    }
    
    // Check if the translator needs to be created or updated
    if (!currentTranslator || 
        currentTranslator.sourceLanguage !== sourceLang || 
        currentTranslator.targetLanguage !== targetLang) {

        if (!('Translator' in self)) {
            sendStatusUpdate("ERROR: Chrome Translator API not supported in this browser version.", 0);
            return { raw: "(Translation Failed - API Missing)", structured: null };
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
            return { raw: "(Translation Failed - Model Setup Error)", structured: null };
        }
    }

    // 2. Perform the translation
    try {
        const translatedText = await currentTranslator.translate(textToTranslate);
        if (translatedText) {
            const rawText = translatedText.trim();
            
            // 3. --- NEW: SIMULATE WORD-FOR-WORD STRUCTURE IF VOCAB CODING IS ACTIVE ---
            if (colourCodingPref === 'vocabulary') {
                const simulatedStructure = simulateVocabularyCoding(textToTranslate, rawText);
                const result = { raw: rawText, structured: simulatedStructure };
                translationCache[cacheKey] = result;
                return result;
            }
            // --------------------------------------------------------------------------
            
            // If not colour coding, just cache and return the raw string (for sync loop compatibility)
            const result = { raw: rawText, structured: null };
            translationCache[cacheKey] = result;
            return result;

        }
        throw new Error("Empty translation result.");

    } catch (e) {
        console.error(`Native translation failed for: "${textToTranslate}"`, e);
        return { raw: `(Translation Failed - Unavailable)`, structured: null };
    }
}


/**
 * UPDATED: SIMULATION FUNCTION FOR VOCABULARY CODING.
 * Implements a heuristic for word alignment based on punctuation segmentation 
 * and segment word count (where word count is 1 in either base or translated).
 */
function simulateVocabularyCoding(baseText, translatedText) {
    // 1. Define a set of colours to cycle through (15 distinct colors)
    const colours = [
        '#FF6347', // Tomato Red
        '#3CB371', // Medium Sea Green
        '#4169E1', // Royal Blue
        '#9370DB', // Medium Purple
        '#FFA500', // Orange
        '#00FFFF', // Cyan
        '#FFD700', // Gold
        '#7CFC00', // Lawn Green
        '#DC143C', // Crimson
        '#1E90FF', // Dodger Blue
        '#FF69B4', // Hot Pink
        '#DAA520', // Goldenrod
        '#00CED1', // Dark Cyan
        '#F08080', // Light Coral
        '#20B2AA'  // Light Sea Green
    ]; 
    
    // 2. Function to split text into sections based on punctuation (excluding apostrophes)
    const PUNCTUATION_REGEX = /([.,!?;:—])/g;

    const splitTextIntoSections = (text) => {
        // Split text by punctuation, keeping the delimiter. Filter out empty strings.
        const sectionsWithPunctuation = text.split(PUNCTUATION_REGEX).filter(s => s.length > 0);
        
        // Re-group segments and their trailing punctuation back together
        const result = [];
        let currentSegment = "";

        for (let i = 0; i < sectionsWithPunctuation.length; i++) {
            const segmentPart = sectionsWithPunctuation[i];
            
            // If the part is punctuation, attach it to the current segment and finalize the segment
            if (segmentPart.length === 1 && PUNCTUATION_REGEX.test(segmentPart)) {
                if (currentSegment) {
                    result.push(currentSegment.trim() + segmentPart);
                    currentSegment = "";
                } else {
                    // Handle case where punctuation starts the line or follows empty segment (rare, but handle safely)
                    result.push(segmentPart);
                }
            } else {
                // It's text. Append it.
                if (currentSegment) {
                    currentSegment += segmentPart;
                } else {
                    currentSegment = segmentPart;
                }
            }
        }
        
        // Push any remaining text segment without trailing punctuation
        if (currentSegment.trim()) {
            result.push(currentSegment.trim());
        }

        // Clean up: filter out any remaining standalone punctuation that wasn't attached
        return result.filter(s => s.length > 0 && !PUNCTUATION_REGEX.test(s) || s.length > 1);
    };

    // 3. Segment the base and translated texts
    const baseSections = splitTextIntoSections(baseText);
    const translatedSections = splitTextIntoSections(translatedText);
    
    
    // 4. Default combined output (start with all segments white)
    let baseCodedSegments = [];
    let translatedCodedSegments = [];
    
    // 5. Iterate and match sections by index (The best alignment available without NMT data)
    const minSections = Math.min(baseSections.length, translatedSections.length);
    
    // Use a color index counter independent of the loop index
    let colorIndex = 0; 

    // Function to count words in a segment
    const countWords = (segment) => {
         // Remove ALL punctuation (including internal) and count words based on whitespace separation
         const cleanSegment = segment.replace(/[.,!?;:—]/g, ' ').trim();
         return cleanSegment.split(/\s+/).filter(w => w.length > 0).length;
    }
    
    for (let i = 0; i < minSections; i++) {
        const baseSegment = baseSections[i].trim();
        const translatedSegment = translatedSections[i].trim();
        
        const baseWordCount = countWords(baseSegment);
        const translatedWordCount = countWords(translatedSegment);
        
        let colorToAssign = getFontColor(fontColorPref); // Default to white
        
        // 6. Apply Logic: If either section has a word count of 1, assign the next unique color.
        if (baseWordCount === 1 || translatedWordCount === 1) {
            colorToAssign = colours[colorIndex % colours.length];
            colorIndex++; // Use the next color for the next single-word match
        }
        
        // 7. Store the results for assembly
        baseCodedSegments.push({ text: baseSegment, color: colorToAssign });
        translatedCodedSegments.push({ text: translatedSegment, color: colorToAssign });
    }
    
    // 8. Handle trailing unmatched sections (default to white)
    for (let i = minSections; i < baseSections.length; i++) {
        baseCodedSegments.push({ text: baseSections[i].trim(), color: getFontColor(fontColorPref) });
    }
    for (let i = minSections; i < translatedSections.length; i++) {
        translatedCodedSegments.push({ text: translatedSections[i].trim(), color: getFontColor(fontColorPref) });
    }

    // 9. Update the return structure
    return {
        base: baseCodedSegments,
        translated: translatedCodedSegments
    };
}


/**
 * MODIFIED: Generates the HTML for a subtitle line, applying color coding if set to 'vocabulary'.
 * Now expects an array of {text: segmentString, color: hexColor} objects.
 */
function generateCodedHtml(segmentsCoded, spanBaseCss, defaultTextColor) {
    if (colourCodingPref === 'vocabulary' && segmentsCoded && segmentsCoded.length > 0) {
        // Build the HTML by wrapping each segment in a span with its assigned color
        const html = segmentsCoded.map(item => {
            // Use the item's color, or fallback to the default if it was missed
            const color = item.color || defaultTextColor; 
            
            // Ensure the spanBaseCss is applied, but with the color overridden by the segment color
            const segmentSpanCss = `${spanBaseCss} color: ${color};`;
            
            // Use the full segment text which includes its punctuation
            return `<span style="${segmentSpanCss}">${item.text}</span>`;
            
        }).join(' '); // Join segments with a single space to separate the spans.
        
        // Remove potential double spaces created by joining and return the final HTML
        return html.replace(/\s+/g, ' ').trim();

    } else {
        // Fallback to the raw text (this path should be mostly avoided if 'vocabulary' is selected)
        const rawText = segmentsCoded.map(item => item.text).join(' ');
        // Wrap the whole phrase in a span with the base CSS for background/shadow/default color
        const standardSpanCss = `${spanBaseCss} color: ${defaultTextColor};`;
        return `<span style="${standardSpanCss}">${rawText.replace(/\s+/g, ' ').trim()}</span>`;
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
    const currentFontColor = getFontColor(fontColorPref); // This is the user-selected text color.
    // NEW: Get span-specific background color
    const currentSpanBgColor = getSpanBackgroundColor(backgroundColorPref);


    // Update the floating window's text shadow (color is managed by inner spans when coding)
    if (floatingWindow) {
        floatingWindow.style.textShadow = currentFontShadow;
        // NOTE: We leave floatingWindow.style.color at its default/user-selected value, 
        // but the individual word spans will override it when colour coding is active.
    }
    
    // NEW: Base CSS for the span tag (used for background, padding, font size, etc.)
    const spanBaseCss = `
        display: inline-block; 
        padding: 0 0.5em; 
        border-radius: 0.2em;
        background-color: ${currentSpanBgColor};
        font-size: ${currentFontSizeEm}; 
        /* The default font color is NOT set here if coding is active, 
           as it will be set by generateCodedHtml */
    `;


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
                
                // --- MODIFICATION START: EXTRACTING TRANSLATION DATA ---
                const translationResult = newSubtitle.translatedText; 
                
                // Get the raw strings for the fallback
                const baseText = newSubtitle.text;
                const translatedText = translationResult ? translationResult.raw : null;

                // Get the structured data for coding
                const structuredData = translationResult ? translationResult.structured : null;
                
                let innerHTML = '';
                
                if (translatedText) {
                    // --- APPLY COLOUR CODING OR FALLBACK TO STANDARD STYLE ---
                    
                    const isVocabCoding = colourCodingPref === 'vocabulary' && structuredData;
                    
                    let baseHtml = '';
                    let translatedHtml = '';

                    // The logic here is simplified because generateCodedHtml now handles segmentation.
                    // When 'vocabulary' is NOT selected, we still need to provide a structured list 
                    // to generateCodedHtml so it can fall back to the raw text, which we do below.
                    
                    // Create a pseudo-structured data object for non-vocabulary modes, 
                    // so generateCodedHtml can fall back to the whole text.
                    const fallbackSegments = [{ text: baseText, color: currentFontColor }];
                    const fallbackTranslatedSegments = [{ text: translatedText, color: currentFontColor }];
                    
                    const finalBaseSegments = structuredData?.base || fallbackSegments;
                    const finalTranslatedSegments = structuredData?.translated || fallbackTranslatedSegments;
                    
                    // Generate HTML using the new segment-based function
                    baseHtml = generateCodedHtml(finalBaseSegments, spanBaseCss, currentFontColor);
                    // Add opacity to translated line by styling the outer span
                    translatedHtml = generateCodedHtml(finalTranslatedSegments, `${spanBaseCss} opacity: 1.0;`, currentFontColor);
                    

                    // Construct final innerHTML
                     if (isTranslatedOnly) {
                        innerHTML = translatedHtml;
                    } else {
                        innerHTML = `${baseHtml}<br>${translatedHtml}`;
                    }
                    
                } else {
                     // If translation is NOT complete, show placeholder
                     
                     // Use the user's default text color for the base text and placeholder
                     const standardSpanCss = `${spanBaseCss} color: ${currentFontColor};`;

                     if (isTranslatedOnly) {
                         innerHTML = ''; // If translated only, show nothing when not ready
                     } else {
                         // Show base text, and a simple loading indicator
                         innerHTML = `
                             <span class="base-sub" style="${standardSpanCss}">${baseText}</span><br>
                             <span class="translated-sub" style="opacity: 0.6; ${standardSpanCss}">
                                 (Translating...)
                             </span>
                         `;
                     }
                }
                // --- MODIFICATION END ---
                
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
    
    // NEW HANDLER: For language detection BEFORE GENERATION
    if (request.command === "detect_language" && request.url) {
        
        console.log("C-DETECT: Received 'detect_language' command.");
        const tempUrl = request.url;
        
        // Use an async IIFE to run the detection logic
        (async () => {
            // 1. Fetch
            const xmlContent = await fetchXmlContent(tempUrl);
            if (!xmlContent) {
                // Error status is already sent back via sendStatusUpdate in fetchXmlContent
                return; 
            }
            
            // 2. Parse (using a temporary array to store the result)
            let tempParsedSubtitles = [];
            try {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlContent, 'application/xml'); 

                // Basic parsing check for error
                if (xmlDoc.querySelector('parsererror')) {
                     console.error("C-DETECT: XML Parsing Error.");
                     // Send detection failure back to popup (but not via sendStatusUpdate)
                     chrome.runtime.sendMessage({
                         command: "language_detected", 
                         baseLangCode: null, 
                         baseLangName: null, 
                         url: tempUrl 
                     }).catch(e => console.warn("Could not send detection failure message:", e));
                     return;
                }
                
                // Perform a simple and quick parse for the language detection
                const subtitleParagraphs = xmlDoc.querySelectorAll('p');
                subtitleParagraphs.forEach((p) => {
                     // NEW: Use the proper text extraction logic without full parsing overhead
                     let rawHtml = p.innerHTML;
                     let htmlWithSpaces = rawHtml.replace(/<br[\s\S]*?\/>|<br>/gi, ' '); 
                     const tempDiv = document.createElement('div');
                     tempDiv.innerHTML = htmlWithSpaces;
                     let text = tempDiv.textContent; 
                     text = text.replace(/\s+/g, ' ').trim();
                     if (text) tempParsedSubtitles.push({ text: text });
                });
                
            } catch (e) {
                 console.error("C-DETECT: Fatal error during temporary XML parsing:", e);
                 chrome.runtime.sendMessage({
                     command: "language_detected", 
                     baseLangCode: null, 
                     baseLangName: null, 
                     url: tempUrl 
                 }).catch(e => console.warn("Could not send detection failure message:", e));
                 return;
            }
            
            // 3. Detect Language (Use a temporary local copy of the detection function, operating on tempParsedSubtitles)
            const tempDetectBaseLanguage = () => {
                const sampleText = tempParsedSubtitles.slice(0, 50)
                                                     .map(sub => sub.text)
                                                     .join(' ')
                                                     .slice(0, 1000);

                return new Promise((resolve) => {
                    if (!chrome.i18n || !chrome.i18n.detectLanguage) {
                        resolve('en'); 
                        return;
                    }
                    chrome.i18n.detectLanguage(sampleText, (result) => {
                        const detectedCode = (result.languages && result.languages.length > 0 && result.languages[0].language !== 'und') 
                                            ? result.languages[0].language : null;
                        resolve(detectedCode);
                    });
                });
            };

            const detectedLangCode = await tempDetectBaseLanguage();
            // Need the getLanguageName helper function from the top of the file!
            const getLanguageName = (langCode) => {
                const LANGUAGE_MAP = {
                    "afar": "aa", "abkhazian": "ab", "avesta": "ae", "afrikaans": "af", "akan": "ak", "amharic": "am", "aragonese": "an", "arabic": "ar", "assamese": "as", "avaric": "av", "aymara": "ay", "azerbaijan": "az", "bashkir": "ba", "belarusian": "be", "bulgarian": "bg", "bihari languages": "bh", "bislama": "bi", "bambara": "bm", "bengali / bangla": "bn", "tibetan": "bo", "breton": "br", "bosnian": "bs", "catalan / valencian": "ca", "chechen": "ce", "chamorro": "ch", "corsican": "co", "cree": "cr", "czech": "cs", "church slavic / church slavonic / old bulgarian / old church slavonic / old slavonic": "cu", "chuvash": "cv", "welsh": "cy", "danish": "da", "german": "de", "dhivehi / divehi / maldivian": "dv", "dzongkha": "dz", "ewe": "ee", "modern greek (1453-)": "el", "english": "en", "esperanto": "eo", "spanish / castilian": "es", "estonian": "et", "basque": "eu", "persian": "fa", "fulah": "ff", "finnish": "fi", "fijian": "fj", "faroese": "fo", "french": "fr", "western frisian": "fy", "irish": "ga", "scottish gaelic / gaelic": "gd", "galician": "gl", "guarani": "gn", "gujarati": "gu", "manx": "gv", "hausa": "ha", "hebrew": "he", "hindi": "hi", "hiri motu": "ho", "croatian": "hr", "haitian / haitian creole": "ht", "hungarian": "hu", "armenian": "hy", "herero": "hz", "interlingua (international auxiliary language association)": "ia", "indonesian": "id", "interlingue / occidental": "ie", "igbo": "ig", "sichuan yi / nuosu": "ii", "inupiaq": "ik", "indonesian (deprecated: use id)": "in", "ido": "io", "icelandic": "is", "italian": "it", "inuktitut": "iu", "hebrew (deprecated: use he)": "iw", "japanese": "ja", "yiddish (deprecated: use yi)": "ji", "javanese": "jv", "javanese (deprecated: use jv)": "jw", "georgian": "ka", "kong": "kg", "kikuyu / gikuyu": "ki", "kuanyama / kwanyama": "kj", "kazakh": "kk", "kalaallisut / greenlandic": "kl", "khmer / central khmer": "km", "kannada": "kn", "ko": "korean", "kanuri": "kr", "kashmiri": "ks", "kurdish": "ku", "komi": "kv", "cornish": "kw", "kirghiz / kyrgyz": "ky", "latin": "la", "luxembourgish / letzeburgesch": "lb", "ganda / luganda": "lg", "limburgan / limburger / limburgish": "li", "lingala": "ln", "lao": "lo", "lithuanian": "lt", "luba-katanga": "lu", "latvian": "lv", "malagasy": "mg", "marshallese": "mh", "maori": "mi", "macedonian": "mk", "malayalam": "ml", "mongolian": "mn", "moldavian / moldovan (deprecated: use ro)": "mo", "marathi": "mr", "malay (macrolanguage)": "ms", "maltese": "mt", "burmese": "my", "nauru": "na", "norwegian bokmål": "nb", "north ndebele": "nd", "nepali (macrolanguage)": "ne", "ndonga": "ng", "dutch / flemish": "nl", "norwegian nynorsk": "nn",
                    "norwegian": "no",
                    "south ndebele": "nr",
                    "navajo / navaho": "nv",
                    "nyanja / chewa / chichewa": "ny",
                    "occitan (post 1500)": "oc",
                    "ojibwa": "oj",
                    "oromo": "om",
                    "oriya (macrolanguage) / odia (macrolanguage)": "or",
                    "ossetian / ossetic": "os",
                    "panjabi / punjabi": "pa",
                    "pali": "pi",
                    "polish": "pl",
                    "pushto / pashto": "ps",
                    "portuguese": "pt",
                    "quechua": "qu",
                    "romansh": "rm",
                    "rundi": "rn",
                    "romanian / moldavian / moldovan": "ro",
                    "russian": "ru",
                    "kinyarwanda": "rw",
                    "sanskrit": "sa",
                    "sardinian": "sc",
                    "sindhi": "sd",
                    "northern sami": "se",
                    "sango": "sg",
                    "serbo-croatian": "sh",
                    "sinhala / sinhalese": "si",
                    "slovak": "sk",
                    "slovenian": "sl",
                    "samoan": "sm",
                    "shona": "sn",
                    "somali": "so",
                    "albanian": "sq",
                    "serbian": "sr",
                    "swati": "ss",
                    "southern sotho": "st",
                    "sundanese": "su",
                    "swedish": "sv",
                    "swahili (macrolanguage)": "sw",
                    "tamil": "ta",
                    "telugu": "te",
                    "tajik": "tg",
                    "thai": "th",
                    "tigrinya": "ti",
                    "turkmen": "tk",
                    "tagalog": "tl",
                    "tswana": "tn",
                    "tonga (tonga islands)": "to",
                    "turkish": "tr",
                    "tsonga": "ts",
                    "tatar": "tt",
                    "twi": "tw",
                    "tahitian": "ty",
                    "uighur / uyghur": "ug",
                    "ukrainian": "uk",
                    "urdu": "ur",
                    "uzbek": "uz",
                    "venda": "ve",
                    "vietnamese": "vi",
                    "volapük": "vo",
                    "walloon": "wa",
                    "wolof": "wo",
                    "xhosa": "xh",
                    "yiddish": "yi",
                    "yoruba": "yo",
                    "zhuang / chuang": "za",
                    "chinese": "zh",
                    "zulu": "zu"
                };
                const langKey = Object.keys(LANGUAGE_MAP).find(key => LANGUAGE_MAP[key] === langCode);
                return langKey ? langKey.charAt(0).toUpperCase() + langKey.slice(1) : langCode.toUpperCase();
            };
            const detectedLangName = detectedLangCode ? getLanguageName(detectedLangCode) : null;
            
            console.log(`C-DETECT: Detected language: ${detectedLangName} (${detectedLangCode}).`);

            // 4. Send the result back to the popup
            chrome.runtime.sendMessage({
                command: "language_detected", 
                baseLangCode: detectedLangCode, 
                baseLangName: detectedLangName, 
                url: tempUrl // Send URL back for comparison
            }).catch(e => {
                if (!e.message.includes('Receiving end does not exist')) {
                     console.warn("Could not send detection result message:", e);
                }
            });
            
        })();
        
        return false; 
    }
    
    // --- EXISTING 'fetch_and_process_url' HANDLER ---
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
        isTranslatedOnly = request.translatedOnly; 
        fontSizeEm = request.fontSize; 
        backgroundColorPref = request.backgroundColor; 
        fontShadowPref = request.fontShadow; 
        fontColorPref = request.fontColor;
        
        // NEW: Store the colour coding preference
        colourCodingPref = request.colourCoding;

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
                    // MODIFICATION: Send the new language error message with a 'lang' route
                    sendStatusUpdate(`Language pair not yet available, please retry with different inputs.`, 30, url, 'lang');
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
                    // MODIFICATION: Use the consolidated error message for final failure. Route as 'url' message.
                    sendStatusUpdate("Invalid URL retrieved - please repeat URL retrieval steps", 0, url, 'url');
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
        
        // MODIFICATION: Do NOT send "Subtitle generation cancelled by user" status.
        // The popup handles setting the neutral/reset status immediately.
        
        isProcessing = false; // Reset processing status
        // CRITICAL FIX: Return false to prevent the "A listener indicated an asynchronous response..." error
        return false; 
    }
    
    if (request.command === "ping") {
        // Since this isn't performing an async operation back to the sender, return false is safest.
        return false;
    }
});