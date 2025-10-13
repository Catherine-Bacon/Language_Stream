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

// ----------------------------------------------------------------------
// --- GLOBAL LANGUAGE MAP (Minimal set for helper function) ---
// FIX: Changed const to var to prevent "Identifier 'LANGUAGE_MAP_CONTENT' has already been declared" error
var LANGUAGE_MAP_CONTENT = {
    "afar": "aa", "abkhazian": "ab", "avesta": "ae", "afrikaans": "af", "akan": "ak", "amharic": "am", "aragonese": "an", "arabic": "ar", "assamese": "as", "avaric": "av", "aymara": "ay", "azerbaijan": "az", "bashkir": "ba", "belarusian": "be", "bulgarian": "bg", "bihari languages": "bh", "bislama": "bi", "bambara": "bm", "bengali / bangla": "bn", "tibetan": "bo", "breton": "br", "bosnian": "bs", "catalan / valencian": "ca", "chechen": "ce", "chamorro": "ch", "corsican": "co", "cree": "cr", "czech": "cs", "church slavic / church slavonic / old bulgarian / old church slavonic / old slavonic": "cu", "chuvash": "cv", "welsh": "cy", "danish": "da", "german": "de", "dhivehi / divehi / maldivian": "dv", "dzongkha": "dz", "ewe": "ee", "modern greek (1453-)": "el", "english": "en", "esperanto": "eo", "spanish / castilian": "es", "estonian": "et", "basque": "eu", "persian": "fa", "fulah": "ff", "finnish": "fi", "fijian": "fj", "faroese": "fo",
    "french": "fr", "western frisian": "fy", "irish": "ga", "scottish gaelic / gaelic": "gd", "galician": "gl", "guarani": "gn", "gujarati": "gu", "manx": "gv", "hausa": "ha", "hebrew": "he", "hindi": "hi", "hebrew (deprecated: use he)": "iw", "japanese": "ja", "korean": "ko", "latin": "la", "dutch / flemish": "nl", "norwegian": "no", "polish": "pl", "portuguese": "pt", "romanian / moldavian / moldovan": "ro", "russian": "ru", "swedish": "sv", "thai": "th", "turkish": "tr", "ukrainian": "uk", "vietnamese": "vi", "chinese": "zh"
    // Truncated list for brevity and assuming core languages are sufficient for this utility
};

// --- NEW HELPER FUNCTION (Moved to the top to fix ReferenceError) ---
function getLanguageName(langCode) {
    const langKey = Object.keys(LANGUAGE_MAP_CONTENT).find(key => LANGUAGE_MAP_CONTENT[key] === langCode);
    // Return capitalized name or the uppercased code if not found
    return langKey ? langKey.charAt(0).toUpperCase() + langKey.slice(1) : langCode.toUpperCase();
}
// ----------------------------------------------------------------------


// ----------------------------------------------------------------------
// --- NEW SECTION: STYLE HELPER FUNCTIONS ---
// ----------------------------------------------------------------------

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

// --- NEW helper function to get CSS background color for the span tag ---
function getSpanBackgroundColor(preference) {
    switch (preference) {
        case 'black':
            return 'rgba(0, 0, 0, 0.85)';
        case 'gray':
        case 'grey': // Accept 'grey' as an input too
            return 'rgba(128, 128, 128, 0.85)';
        case 'none':
        default:
            return 'transparent'; // No background
    }
}

// ----------------------------------------------------------------------
// --- END STYLE HELPER FUNCTIONS ---
// ----------------------------------------------------------------------

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
        // CRITICAL FIX: Reset the processing flag on fetch/network error
        isProcessing = false;
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
             // CRITICAL FIX: Reset the processing flag on XML parsing error
             isProcessing = false;
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
        // CRITICAL FIX: Reset the processing flag on XML parsing error
        isProcessing = false;
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

// ----------------------------------------------------------------------
// --- START WINDOW/SYNC LOGIC (MOVED UP) ---
// ----------------------------------------------------------------------

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
      width: 100%; 
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
    element.style.setProperty('cursor', 'grabbing', 'important');
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
                    
                    // The structured data will be correctly filled during the pipeline 
                    // with simulated translation if it exists.
                    
                    const finalBaseSegments = structuredData?.base || [{ text: baseText, color: currentFontColor }];
                    const finalTranslatedSegments = structuredData?.translated || [{ text: translatedText, color: currentFontColor }];
                    
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

// ----------------------------------------------------------------------
// --- END WINDOW/SYNC LOGIC ---
// ----------------------------------------------------------------------


// ----------------------------------------------------------------------
// --- START TRANSLATION/ALIGNMENT LOGIC (MOVED UP) ---
// ----------------------------------------------------------------------

/**
 * MODIFIED: Generates the HTML for a subtitle line, applying color coding if set to 'vocabulary'.
 * Now expects an array of {text: segmentString, color: hexColor} objects.
 */
function generateCodedHtml(segmentsCoded, spanBaseCss, defaultTextColor) {
    if (colourCodingPref === 'vocabulary' && segmentsCoded && segmentsCoded.length > 0) {
        
        // <--- INSERT DEBUG 5 HERE: Confirms vocab mode is active --->
        console.log("DEBUG: Starting HTML generation with vocab coding.");
        
        // Build the HTML by wrapping each segment in a span with its assigned color
        const html = segmentsCoded.map(item => {
            // Use the item's color, or fallback to the default if it was missed
            const color = item.color || defaultTextColor; 
            
            // Ensure the spanBaseCss is applied, but with the color overridden by the segment color
            const segmentSpanCss = `${spanBaseCss} color: ${color};`;
            
            // FIX: Explicitly trim the segment text before placing it in the span.
            const cleanText = item.text.trim();
            
            // <--- INSERT DEBUG 6 HERE: Shows input text and trimmed text --->
            console.log(`DEBUG: Segment HTML: Input Text: "${item.text}", Clean Text: "${cleanText}"`);
            
            // Use the full segment text which includes its punctuation
            return `<span style="${segmentSpanCss}">${cleanText}</span>`;
            
        // <--- INSERT DEBUG 7 HERE: Shows the array of spans before joining --->
        });
        console.log("DEBUG: HTML Segments (pre-join):", html.map(s => s.trim())); // Trim segments for cleaner log
        
        // Join segments with a single space to separate the spans.
        const finalJoinedHtml = html.join(' '); 
        
        // Remove potential double spaces created by joining and return the final HTML
        const finalHtml = finalJoinedHtml.replace(/\s+/g, ' ').trim();
        
        // <--- INSERT DEBUG 8 HERE: Shows the final cleaned string --->
        console.log("DEBUG: Final HTML Output:", finalHtml);
        
        return finalHtml;

    } else {
        // Fallback to the raw text (this path should be mostly avoided if 'vocabulary' is selected)
        const rawText = segmentsCoded.map(item => item.text).join(' ');
        // Wrap the whole phrase in a span with the base CSS for background/shadow/default color
        const standardSpanCss = `${spanBaseCss} color: ${defaultTextColor};`;
        return `<span style="${standardSpanCss}">${rawText.replace(/\s+/g, ' ').trim()}</span>`;
    }
}


var currentTranslator = currentTranslator || null; 

/**
 * UPDATED: SIMULATION FUNCTION FOR VOCABULARY CODING.
 * Implements a heuristic for word alignment based on punctuation segmentation 
 * and segment word count (where word count is 1 in either base or translated).
 */
function simulateVocabularyCoding(baseText, translatedText) {
    
    // <--- INSERT DEBUG 1 HERE: Confirms the function is called --->
    console.log("DEBUG: Starting vocab coding simulation."); 
    
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
                    // Check for leading space before attaching punctuation
                    if (currentSegment.trim().length > 0 && currentSegment[currentSegment.length - 1] !== ' ') {
                        currentSegment += ' '; // Add space if missing before punctuation
                    }
                    result.push(currentSegment.trim() + segmentPart);
                    currentSegment = "";
                } else {
                    // Handle case where punctuation starts the line or follows empty segment (rare, but handle safely)
                    result.push(segmentPart);
                }
            } else {
                // It's text. Append it.
                if (currentSegment) {
                    // Add a space separator if the previous text didn't end with one
                    if (currentSegment[currentSegment.length - 1] !== ' ' && segmentPart[0] !== ' ') {
                        currentSegment += ' ';
                    }
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
        // Also trim all resulting segments to remove excess internal space before returning
        return result.filter(s => s.length > 0 && !PUNCTUATION_REGEX.test(s) || s.length > 1).map(s => s.replace(/\s+/g, ' ').trim());
    };

    // 3. Segment the base and translated texts
    const baseSections = splitTextIntoSections(baseText);
    const translatedSections = splitTextIntoSections(translatedText);
    
    // <--- INSERT DEBUG 2 HERE: Shows the segmented arrays --->
    console.log("DEBUG: Base Sections:", baseSections); 
    console.log("DEBUG: Translated Sections:", translatedSections); 
    
    
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
        
        // <--- INSERT DEBUG 3 HERE: Shows segment pair and color assignment --->
        console.log(`DEBUG: Segment ${i}: Base: "${baseSegment}", Trans: "${translatedSegment}", Color: ${colorToAssign}`); 
        
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
    
    // <--- INSERT DEBUG 4 HERE: Confirms function exit --->
    console.log("DEBUG: Vocab coding complete. Returning structured data.");
    
    return {
        base: baseCodedSegments,
        translated: translatedCodedSegments
    };
}

/**
 * Runs CONCURRENT translation for all parsed subtitles, prioritizing the first 30 lines.
 */
async function runFullTranslationPipeline(url, targetLang, translatedOnly, fontSize, backgroundColor, fontShadow, fontColor, colourCoding) {
    // 1. Fetch XML
    sendStatusUpdate("Fetching and parsing XML content...", 10, url);
    const xmlString = await fetchXmlContent(url);
    if (!xmlString) {
        // NOTE: isProcessing = false is already handled within fetchXmlContent on failure
        return; // Exit on fetch/network/403 failure
    }
    
    // 2. Parse XML
    if (!parseTtmlXml(xmlString, url)) {
        // NOTE: isProcessing = false is already handled within parseTtmlXml on failure
        return; // Exit on XML parsing failure
    }

    // 3. Detect Base Language
    sendStatusUpdate("Detecting base language...", 25);
    const baseLangCode = await detectBaseLanguage();

    if (!baseLangCode) {
        const errorMsg = "Detected Base Language: (FAIL). Cannot proceed with translation.";
        sendStatusUpdate(errorMsg, 0, url, 'lang'); // Route to lang status box
        isProcessing = false; // CRITICAL FIX: Reset on language detection failure
        return;
    }

    // Store runtime preferences globally
    subtitleLanguages = { base: baseLangCode, target: targetLang };
    isTranslatedOnly = translatedOnly;
    fontSizeEm = fontSize;
    backgroundColorPref = backgroundColor;
    fontShadowPref = fontShadow;
    fontColorPref = fontColor;
    colourCodingPref = colourCoding; // NEW: Store color coding preference

    sendStatusUpdate(`Base Language: ${getLanguageName(baseLangCode)} detected. Starting translation...`, 30);
    
    // Placeholder for actual translation logic (SIMULATION)
    const totalSubs = parsedSubtitles.length;
    for (let i = 0; i < totalSubs; i++) {
        if (isCancelled) {
            sendStatusUpdate("Processing cancelled by user.", 0, url);
            isProcessing = false; // CRITICAL FIX: Reset on cancellation
            return;
        }
        const sub = parsedSubtitles[i];
        
        // Check if translation is already cached or not needed
        if (!sub.translatedText) {
            // --- SIMULATE TRANSLATION AND CODING ---
            // In a real scenario, this would involve an API call.
            const simulatedTranslation = `Translated: ${sub.text}`; 
            
            let structuredData = null;
            if (colourCoding === 'vocabulary') {
                // Apply the simulation function for vocab coding
                structuredData = simulateVocabularyCoding(sub.text, simulatedTranslation);
            } else {
                // FIX: Ensure the simulated translation is used for the translated line, not the base text.
                 structuredData = { 
                     base: [{ text: sub.text, color: getFontColor(fontColor) }],
                     translated: [{ text: simulatedTranslation, color: getFontColor(fontColor) }] // CRITICAL FIX HERE
                 };
            }
            
            // Store the result in the subtitle object
            sub.translatedText = {
                raw: simulatedTranslation,
                structured: structuredData
            };
            // --- END SIMULATION ---
        }

        // Update progress (from 30% to 90%)
        const currentProgress = 30 + Math.floor((i / totalSubs) * 60);
        if (i % 50 === 0 || i === totalSubs - 1) { // Update status every 50 subs or at the end
            sendStatusUpdate(`Translating subtitles (${i}/${totalSubs})...`, currentProgress);
        }
    }


    // 4. Create UI and start sync (90%)
    sendStatusUpdate("Translation complete. Starting subtitle sync.", 90);
    createFloatingWindow();
    disableNetflixSubObserver();
    startSubtitleSync(); // Starts the loop

    // 5. Final completion status (100%)
    sendStatusUpdate("Subtitle generation and synchronization active.", 100);
    // CRITICAL FIX: The process is now complete, reset the flag.
    isProcessing = false;
}


// --- Message Listener (Communication from popup.js) ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    if (request.command === "detect_language") {
        const url = request.url;
        
        // 1. BLOCK: If the main pipeline is currently running, block detection immediately.
        if (isProcessing) { 
            console.warn("Full processing already underway. Ignoring detection request.");
            return;
        }
        
        // 2. BLOCK: If we already have parsed subtitles, the base language is known and we don't need detection.
        if (parsedSubtitles.length > 0) {
             // Send the already known language back to the popup to update its status message
             chrome.runtime.sendMessage({
                command: "language_detected",
                url: url,
                baseLangCode: subtitleLanguages.base,
                baseLangName: getLanguageName(subtitleLanguages.base)
             }).catch(e => { /* suppress error */ });
             return; 
        }

        // 3. EXECUTE: Only if no processing is active AND no subtitles are loaded, proceed with detection.

        // Set a temporary flag to prevent concurrent detection
        isProcessing = true; 
        
        fetchXmlContent(url).then(xmlString => {
            if (!xmlString) {
                // isProcessing reset inside fetchXmlContent on error
                return; 
            }
            
            if (!parseTtmlXml(xmlString, url)) {
                // isProcessing reset inside parseTtmlXml on error
                return;
            }

            return detectBaseLanguage();
        }).then(baseLangCode => {
            if (baseLangCode) {
                const baseLangName = getLanguageName(baseLangCode);
                // Temporarily store the language for the message response before the final reset
                subtitleLanguages.base = baseLangCode; 
                
                // Send result back to popup.js to update the 'ready' message
                chrome.runtime.sendMessage({
                    command: "language_detected",
                    url: url,
                    baseLangCode: baseLangCode,
                    baseLangName: baseLangName
                }).catch(e => { /* suppress error */ });
            }
        }).catch(e => {
            console.error("Language detection pipeline failed:", e);
        }).finally(() => {
            // CRITICAL FIX: Always reset the temporary processing flag for detection
            isProcessing = false; 
        });
        
    } else if (request.command === "fetch_and_process_url") {
        if (isProcessing) {
             console.warn("Processing already underway. Ignoring new request.");
             // MODIFICATION: Send the status back with a specific route to clear main box
             sendStatusUpdate("Processing is already active. Please cancel first.", 5, request.url, 'lang'); 
             return;
        }
        // IMPORTANT: isProcessing is set to TRUE immediately upon starting fetch_and_process_url
        isProcessing = true;
        isCancelled = false; // Reset cancellation flag
        
        // NEW: Store all preferences globally before starting the pipeline
        subtitleLanguages.target = request.targetLang;
        isTranslatedOnly = request.translatedOnly;
        fontSizeEm = request.fontSize;
        backgroundColorPref = request.backgroundColor;
        fontShadowPref = request.fontShadow;
        fontColorPref = request.fontColor;
        colourCodingPref = request.colourCoding; // NEW: Store color coding preference

        // Start the main pipeline
        runFullTranslationPipeline(
            request.url, 
            request.targetLang, 
            request.translatedOnly, 
            request.fontSize, 
            request.backgroundColor, 
            request.fontShadow, 
            request.fontColor,
            request.colourCoding // Pass the colour coding preference
        ).catch(e => {
            console.error("Translation pipeline failed:", e);
            // MODIFIED: Send error status with a specific route for UI management
            sendStatusUpdate(`Fatal Processing Error: ${e.message}`, 0, request.url, 'main');
            isProcessing = false; // CRITICAL FIX: Reset flag on pipeline failure
        });

    } else if (request.command === "cancel_processing") {
         if (syncInterval) {
             clearInterval(syncInterval);
             syncInterval = null;
         }
         isCancelled = true;
         // MODIFIED: Set the flag to false, ensuring a proper reset if the process was running
         isProcessing = false; 
         // MODIFIED: Also hide the floating window if it exists
         if (floatingWindow) {
             floatingWindow.style.display = 'none';
         }
         // Send final status update to clear the progress bar in the popup
         sendStatusUpdate("Processing cancelled by user.", 0, null, 'main');
    }

    // Indicate that the response is asynchronous if needed (though not strictly required for one-way messages)
    return false; 
});