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
var subtitleStylePref = 'netflix'; // <<< ADDED: To track the current style

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
            // MODIFIED: Always save the base and target language code if available
            baseLang: subtitleLanguages.base,
            targetLang: progress < 100 ? subtitleLanguages.target : subtitleLanguages.target,
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

// <<< NEW FUNCTION: To find the container that goes fullscreen
function getNetflixPlayerContainer() {
    // This selector targets the main container for the video player UI, which is what enters fullscreen.
    return document.querySelector('.watch-video--player-view');
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

            // 2. FIX 1: Replace HTML line breaks with a space.
            let htmlWithSpaces = rawHtml.replace(/<br[\s\S]*?\/>|<br>/gi, ' ');

            // 3. Create a temporary element and load the modified HTML.
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlWithSpaces;

            // 4. Extract the clean text content from the temporary div.
            let text = tempDiv.textContent;


            // 5. Normalize all whitespace to a single space, and trim.
            text = text.replace(/\s+/g, ' ');
            text = text.trim();

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

        });

        console.log(`Successfully parsed ${parsedSubtitles.length} subtitles.`);
        return true;

    } catch (e) {
        console.error("Fatal error during XML parsing:", e);
        sendStatusUpdate("Invalid URL retrieved - please repeat URL retrieval steps", 0, url, 'url');
        return false;
    }
}

// --- NEW FUNCTION: Base Language Detection ---
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


// <<< MODIFIED FUNCTION
function createFloatingWindow() {
  let existingWindow = document.getElementById('language-stream-window');

  const textShadow = getFontShadowCss(fontShadowPref);
  const defaultFontColor = getFontColor(fontColorPref);

  if (existingWindow) {
    floatingWindow = existingWindow;
    floatingWindow.style.textShadow = textShadow;
    floatingWindow.style.color = defaultFontColor;

  } else {
    const windowDiv = document.createElement('div');
    windowDiv.id = 'language-stream-window';
    windowDiv.style.cssText = `
      position: absolute; /* MODIFIED: Changed from fixed to absolute */
      bottom: 10%; /* MODIFIED: Positioned from the bottom */
      left: 50%;
      transform: translateX(-50%); /* MODIFIED: Only X transform is needed */
      width: 90%;
      max-width: 1200px;
      min-height: 50px;
      background-color: rgba(0, 0, 0, 0);
      padding: 0;
      border-radius: 0;
      box-shadow: none;
      z-index: 9999; /* High z-index to stay on top of player controls */
      color: ${defaultFontColor};
      font-family: 'Inter', sans-serif;
      font-size: 3.6rem;
      text-align: center;
      line-height: 1.4;
      overflow: hidden;
      cursor: grab;
      display: none;
      text-shadow: ${textShadow};
      /* Prevents clicks on the subtitle box from pausing the video */
      pointer-events: none; 
    `;

    // Make the window draggable, but re-enable pointer-events during drag
    makeDraggable(windowDiv);

    // <<< MODIFICATION START: Append to player container for fullscreen visibility
    const playerContainer = getNetflixPlayerContainer();
    // Use the player container if found, otherwise fall back to the document body
    const parentElement = playerContainer || document.body; 
    
    parentElement.appendChild(windowDiv);
    // If we attached to the player container, it needs a relative position
    // for our absolute positioning to work correctly.
    if (playerContainer) {
        playerContainer.style.position = 'relative';
    }
    // <<< MODIFICATION END

    floatingWindow = windowDiv;
  }
}

// <<< MODIFIED FUNCTION
function makeDraggable(element) {
  let isDragging = false;
  let offsetX, offsetY;

  const startDrag = (e) => {
    e.preventDefault();
    isDragging = true;
    
    // <<< MODIFICATION: Enable pointer events only for dragging
    element.style.pointerEvents = 'auto'; 
    
    const rect = element.getBoundingClientRect();
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;

    offsetX = clientX - rect.left;
    offsetY = clientY - rect.top;
    
    element.style.cursor = 'grabbing';
    
    // Using `position: fixed` during drag allows moving it anywhere on screen
    element.style.position = 'fixed'; 
    // We set the initial fixed position to its current location to avoid jumps
    element.style.left = rect.left + 'px';
    element.style.top = rect.top + 'px';
    element.style.transform = 'none'; // Reset transform for direct positioning

    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', drag);
    document.addEventListener('touchend', stopDrag);
  };

  const drag = (e) => {
    if (!isDragging) return;
    e.preventDefault();

    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;

    element.style.left = (clientX - offsetX) + 'px';
    element.style.top = (clientY - offsetY) + 'px';
  };

  const stopDrag = () => {
    isDragging = false;
    // <<< MODIFICATION: Disable pointer events again after dragging
    element.style.pointerEvents = 'none'; 
    element.style.cursor = 'grab';
    
    // We don't revert position to absolute, allowing user to place it anywhere.
    // The fixed position will persist until the page is reloaded.

    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('touchend', stopDrag);
  };

  // Add a dedicated drag handle or listen on the element itself
  // For simplicity, we listen on the element but this can be refined
  element.addEventListener('mousedown', startDrag);
  element.addEventListener('touchstart', startDrag);
}


// --- Translation Logic (REWRITTEN FOR NATIVE API) ---

var currentTranslator = currentTranslator || null;

async function translateSubtitle(textToTranslate, sourceLang, targetLang) {
    const cacheKey = `${sourceLang}-${targetLang}:${textToTranslate}`;
    if (translationCache[cacheKey]) {
        return translationCache[cacheKey];
    }

    if (!currentTranslator ||
        currentTranslator.sourceLanguage !== sourceLang ||
        currentTranslator.targetLanguage !== targetLang) {

        if (!('Translator' in self)) {
            console.error("ERROR: Chrome Translator API not supported in this browser version.");
            return "(Translation Failed - API Missing)";
        }

        try {
             currentTranslator = await Translator.create({
                sourceLanguage: sourceLang,
                targetLanguage: targetLang,
                monitor(m) {
                    m.addEventListener('downloadprogress', (e) => {
                        const loaded = Math.floor(e.loaded * 100);
                        const overallProgress = 30 + Math.floor(loaded * 0.3);
                        sendStatusUpdate(`Downloading model: ${loaded}% complete.`, overallProgress);
                    });
                }
            });

            sendStatusUpdate("Translator model ready. Starting translation...", 60);

        } catch (e) {
            console.error("Native Translator API failed to create. Language pair likely unavailable:", e);
            return "(Translation Failed - Model Setup Error)";
        }
    }

    try {
        const translatedText = await currentTranslator.translate(textToTranslate);
        if (translatedText) {
            translationCache[cacheKey] = translatedText.trim();
            return translatedText.trim();
        }
        throw new Error("Empty translation result.");

    } catch (e) {
        console.error(`Native translation failed for: "${textToTranslate}"`, e);
        return `(Translation Failed - Unavailable)`;
    }
}


async function translateAllSubtitles(url) {
    const totalSubs = parsedSubtitles.length;
    const baseLang = subtitleLanguages.base;
    const targetLang = subtitleLanguages.target;

    const CRITICAL_BATCH_SIZE = 30;
    const criticalBatch = parsedSubtitles.slice(0, CRITICAL_BATCH_SIZE);
    const concurrentBatch = parsedSubtitles.slice(CRITICAL_BATCH_SIZE);
    const START_PROGRESS = 60;
    const CRITICAL_BATCH_WEIGHT = 10;
    const CONCURRENT_BATCH_WEIGHT = 30;

    console.log(`C6.1. Starting sequential translation of the first ${criticalBatch.length} lines.`);
    sendStatusUpdate(`Translating first ${criticalBatch.length} lines for immediate playback...`, START_PROGRESS, url);

    for (let index = 0; index < criticalBatch.length; index++) {
        if (isCancelled) {
             console.log("Translation aborted by user cancellation.");
             throw new Error("ABORT_TRANSLATION");
        }
        const sub = criticalBatch[index];
        const translatedText = await translateSubtitle(sub.text, baseLang, targetLang);
        sub.translatedText = translatedText;
        const progress = START_PROGRESS + Math.floor(((index + 1) / criticalBatch.length) * CRITICAL_BATCH_WEIGHT);
        sendStatusUpdate(`First ${index + 1} lines ready to watch!`, progress, url);
    }

    const CONCURRENT_START_PROGRESS = START_PROGRESS + CRITICAL_BATCH_WEIGHT; // 70%
    sendStatusUpdate(`First ${CRITICAL_BATCH_SIZE} lines ready! Starting background translation...`, CONCURRENT_START_PROGRESS, url);

    console.log(`C6.2. Starting concurrent translation of the remaining ${concurrentBatch.length} lines.`);
    const translationPromises = concurrentBatch.map(async (sub, index) => {
        if (isCancelled) {
             return Promise.resolve("ABORTED");
        }
        const translatedText = await translateSubtitle(sub.text, baseLang, targetLang);
        sub.translatedText = translatedText;
        if (index % 5 === 0 || index === concurrentBatch.length - 1) {
             const progress = CONCURRENT_START_PROGRESS + Math.floor(((index + 1) / concurrentBatch.length) * CONCURRENT_BATCH_WEIGHT);
             if (progress < 100) {
                 const totalReady = CRITICAL_BATCH_SIZE + index + 1;
                 sendStatusUpdate(`First ${totalReady} lines ready to watch!`, progress, url);
             }
        }
        return translatedText;
    });

    await Promise.all(translationPromises);

    if (!isCancelled) {
        sendStatusUpdate(`Translation complete! ${totalSubs} lines ready.`, 100, url);
        console.log("Native translation process finished. All subtitles are ready.");
    } else {
        console.log("Translation finished, but process was marked as cancelled. No 100% status sent.");
    }
}


function getFontSizeEm(preference) {
    switch (preference) {
        case 'small': return '0.75em';
        case 'large': return '1.25em';
        case 'medium': default: return '1em';
    }
}

function getFontShadowCss(preference) {
    switch (preference) {
        case 'black_shadow': return '2px 2px 4px rgba(0, 0, 0, 0.8)';
        case 'white_shadow': return '1px 1px 2px rgba(255, 255, 255, 0.8), -1px -1px 2px rgba(255, 255, 255, 0.8)';
        case 'none': default: return 'none';
    }
}

function getFontColor(preference) {
    switch (preference) {
        case 'yellow': return '#FFFF00';
        case 'cyan': return '#00FFFF';
        case 'white': default: return '#FFFFFF';
    }
}

function getSpanBackgroundColor(preference) {
    switch (preference) {
        case 'black': return 'rgba(0, 0, 0, 0.85)';
        case 'gray': return 'rgba(128, 128, 128, 0.85)';
        case 'none': default: return 'transparent';
    }
}

function startSubtitleSync(videoElement) {
    if (syncInterval) clearInterval(syncInterval);

    let currentSubtitleIndex = -1;
    let lastTime = 0;

    if (floatingWindow) floatingWindow.style.display = 'block';

    const currentFontSizeEm = getFontSizeEm(fontSizeEm);
    const currentFontShadow = getFontShadowCss(fontShadowPref);
    const currentFontColor = getFontColor(fontColorPref);
    const currentSpanBgColor = getSpanBackgroundColor(backgroundColorPref);
    const fontWeight = (subtitleStylePref === 'netflix') ? 'bold' : 'normal';

    if (floatingWindow) {
        floatingWindow.style.textShadow = currentFontShadow;
        floatingWindow.style.color = currentFontColor;
    }

    const spanBaseCss = `
        display: inline-block;
        padding: 0 0.5em;
        border-radius: 0.2em;
        background-color: ${currentSpanBgColor};
        font-size: ${currentFontSizeEm};
        color: ${currentFontColor};
        font-weight: ${fontWeight};
        /* Allow clicks to pass through the text spans */
        pointer-events: auto; 
    `;

    const syncLoop = () => {
        const currentTime = videoElement.currentTime;
        const isPaused = videoElement.paused;

        if (isPaused && currentTime === lastTime) return;

        let newSubtitle = null;
        let newIndex = -1;
        let subtitleFound = false;

        for (let i = Math.max(0, currentSubtitleIndex - 2); i < Math.min(currentSubtitleIndex + 4, parsedSubtitles.length); i++) {
             const sub = parsedSubtitles[i];
             if (i >= 0 && sub && currentTime >= sub.begin && currentTime < sub.end) {
                 newSubtitle = sub;
                 newIndex = i;
                 subtitleFound = true;
                 break;
             }
        }

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

        if (subtitleFound) {
            if (newIndex !== currentSubtitleIndex) {
                const baseText = newSubtitle.text;
                const translatedText = newSubtitle.translatedText;
                let innerHTML = '';

                if (translatedText) {
                     if (isTranslatedOnly) {
                        innerHTML = `<span class="translated-sub" style="opacity: 1.0; ${spanBaseCss}">${translatedText}</span>`;
                    } else {
                        innerHTML = `<span class="base-sub" style="${spanBaseCss}">${baseText}</span><br><span class="translated-sub" style="opacity: 1.0; ${spanBaseCss}">${translatedText}</span>`;
                    }
                } else {
                     if (!isTranslatedOnly) {
                         innerHTML = `<span class="base-sub" style="${spanBaseCss}">${baseText}</span><br><span class="translated-sub" style="opacity: 0.6; ${spanBaseCss}">(Translating...)</span>`;
                     }
                }
                floatingWindow.innerHTML = innerHTML;
                currentSubtitleIndex = newIndex;
            }
        } else {
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
    if (typeof subtitleObserver !== 'undefined' && subtitleObserver) {
        subtitleObserver.disconnect();
        console.log("Netflix native subtitle observer disconnected.");
    }
}


// --- Message Listener for Popup Communication ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.command === "check_language_pair") {
        const { baseLang, targetLang } = request;
        (async () => {
            let isAvailable = false;
            if ('Translator' in self) {
                try {
                    await Translator.create({ sourceLanguage: baseLang, targetLanguage: targetLang });
                    isAvailable = true;
                } catch (e) {
                    isAvailable = false;
                }
            }
            chrome.runtime.sendMessage({
                command: "language_pair_status",
                isAvailable: isAvailable,
                targetLang: targetLang
            }).catch(e => {
                if (!e.message.includes('Receiving end does not exist')) {
                    console.warn("Could not send language pair status message:", e);
                }
            });
        })();
        return false;
    }

    if (request.command === "detect_language" && request.url) {
        console.log("C-DETECT: Received 'detect_language' command.");
        const tempUrl = request.url;
        (async () => {
            const xmlContent = await fetchXmlContent(tempUrl);
            if (!xmlContent) return;

            let tempParsedSubtitles = [];
            try {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');
                if (xmlDoc.querySelector('parsererror')) {
                     chrome.runtime.sendMessage({ command: "language_detected", baseLangCode: null, baseLangName: null, url: tempUrl }).catch(e => console.warn("Could not send detection failure message:", e));
                     return;
                }
                const subtitleParagraphs = xmlDoc.querySelectorAll('p');
                subtitleParagraphs.forEach((p) => {
                     let rawHtml = p.innerHTML;
                     let htmlWithSpaces = rawHtml.replace(/<br[\s\S]*?\/>|<br>/gi, ' ');
                     const tempDiv = document.createElement('div');
                     tempDiv.innerHTML = htmlWithSpaces;
                     let text = tempDiv.textContent.replace(/\s+/g, ' ').trim();
                     if (text) tempParsedSubtitles.push({ text: text });
                });

            } catch (e) {
                 console.error("C-DETECT: Fatal error during temporary XML parsing:", e);
                 chrome.runtime.sendMessage({ command: "language_detected", baseLangCode: null, baseLangName: null, url: tempUrl }).catch(e => console.warn("Could not send detection failure message:", e));
                 return;
            }

            const tempDetectBaseLanguage = () => {
                const sampleText = tempParsedSubtitles.slice(0, 50).map(sub => sub.text).join(' ').slice(0, 1000);
                return new Promise((resolve) => {
                    if (!chrome.i18n || !chrome.i18n.detectLanguage) {
                        resolve('en');
                        return;
                    }
                    chrome.i18n.detectLanguage(sampleText, (result) => {
                        const detectedCode = (result.languages && result.languages.length > 0 && result.languages[0].language !== 'und') ? result.languages[0].language : null;
                        resolve(detectedCode);
                    });
                });
            };

            const detectedLangCode = await tempDetectBaseLanguage();
            const getLanguageName = (langCode) => {
                // Inline LANGUAGE_MAP for this helper to be self-contained
                const LANGUAGE_MAP = {"afar":"aa","abkhazian":"ab","avesta":"ae","afrikaans":"af","akan":"ak","amharic":"am","aragonese":"an","arabic":"ar","assamese":"as","avaric":"av","aymara":"ay","azerbaijan":"az","bashkir":"ba","belarusian":"be","bulgarian":"bg","bihari languages":"bh","bislama":"bi","bambara":"bm","bengali / bangla":"bn","tibetan":"bo","breton":"br","bosnian":"bs","catalan / valencian":"ca","chechen":"ce","chamorro":"ch","corsican":"co","cree":"cr","czech":"cs","church slavic / church slavonic / old bulgarian / old church slavonic / old slavonic":"cu","chuvash":"cv","welsh":"cy","danish":"da","german":"de","dhivehi / divehi / maldivian":"dv","dzongkha":"dz","ewe":"ee","modern greek (1453-)":"el","english":"en","esperanto":"eo","spanish / castilian":"es","estonian":"et","basque":"eu","persian":"fa","fulah":"ff","finnish":"fi","fijian":"fj","faroese":"fo","french":"fr","western frisian":"fy","irish":"ga","scottish gaelic / gaelic":"gd","galician":"gl","guarani":"gn","gujarati":"gu","manx":"gv","hausa":"ha","hebrew":"he","hindi":"hi","hiri motu":"ho","croatian":"hr","haitian / haitian creole":"ht","hungarian":"hu","armenian":"hy","herero":"hz","interlingua (international auxiliary language association)":"ia","indonesian":"id","interlingue / occidental":"ie","igbo":"ig","sichuan yi / nuosu":"ii","inupiaq":"ik","indonesian (deprecated: use id)":"in","ido":"io","icelandic":"is","italian":"it","inuktitut":"iu","hebrew (deprecated: use he)":"iw","japanese":"ja","yiddish (deprecated: use yi)":"ji","javanese":"jv","javanese (deprecated: use jv)":"jw","georgian":"ka","kong":"kg","kikuyu / gikuyu":"ki","kuanyama / kwanyama":"kj","kazakh":"kk","kalaallisut / greenlandic":"kl","khmer / central khmer":"km","kannada":"kn","ko":"korean","kanuri":"kr","kashmiri":"ks","kurdish":"ku","komi":"kv","cornish":"kw","kirghiz / kyrgyz":"ky","latin":"la","luxembourgish / letzeburgesch":"lb","ganda / luganda":"lg","limburgan / limburger / limburgish":"li","lingala":"ln","lao":"lo","lithuanian":"lt","luba-katanga":"lu","latvian":"lv","malagasy":"mg","marshallese":"mh","maori":"mi","macedonian":"mk","malayalam":"ml","mongolian":"mn","moldavian / moldovan (deprecated: use ro)":"mo","marathi":"mr","malay (macrolanguage)":"ms","maltese":"mt","burmese":"my","nauru":"na","norwegian bokmål":"nb","north ndebele":"nd","nepali (macrolanguage)":"ne","ndonga":"ng","dutch / flemish":"nl","norwegian nynorsk":"nn","norwegian":"no","south ndebele":"nr","navajo / navaho":"nv","nyanja / chewa / chichewa":"ny","occitan (post 1500)":"oc","ojibwa":"oj","oromo":"om","oriya (macrolanguage) / odia (macrolanguage)":"or","ossetian / ossetic":"os","panjabi / punjabi":"pa","pali":"pi","polish":"pl","pushto / pashto":"ps","portuguese":"pt","quechua":"qu","romansh":"rm","rundi":"rn","romanian / moldavian / moldovan":"ro","russian":"ru","kinyarwanda":"rw","sanskrit":"sa","sardinian":"sc","sindhi":"sd","northern sami":"se","sango":"sg","serbo-croatian":"sh","sinhala / sinhalese":"si","slovak":"sk","slovenian":"sl","samoan":"sm","shona":"sn","somali":"so","albanian":"sq","serbian":"sr","swati":"ss","southern sotho":"st","sundanese":"su","swedish":"sv","swahili (macrolanguage)":"sw","tamil":"ta","telugu":"te","tajik":"tg","thai":"th","tigrinya":"ti","turkmen":"tk","tagalog":"tl","tswana":"tn","tonga (tonga islands)":"to","turkish":"tr","tsonga":"ts","tatar":"tt","twi":"tw","tahitian":"ty","uighur / uyghur":"ug","ukrainian":"uk","urdu":"ur","uzbek":"uz","venda":"ve","vietnamese":"vi","volapük":"vo","walloon":"wa","wolof":"wo","xhosa":"xh","yiddish":"yi","yoruba":"yo","zhuang / chuang":"za","chinese":"zh","zulu":"zu"};
                const langKey = Object.keys(LANGUAGE_MAP).find(key => LANGUAGE_MAP[key] === langCode);
                return langKey ? langKey.charAt(0).toUpperCase() + langKey.slice(1) : langCode.toUpperCase();
            };
            const detectedLangName = detectedLangCode ? getLanguageName(detectedLangCode) : null;
            console.log(`C-DETECT: Detected language: ${detectedLangName} (${detectedLangCode}).`);

            chrome.runtime.sendMessage({
                command: "language_detected",
                baseLangCode: detectedLangCode,
                baseLangName: detectedLangName,
                url: tempUrl
            }).catch(e => {
                if (!e.message.includes('Receiving end does not exist')) {
                     console.warn("Could not send detection result message:", e);
                }
            });
        })();
        return false;
    }

    if (request.command === "fetch_and_process_url" && request.url) {
        if (isProcessing) {
            console.log("C1. Process already running, ignoring repeated 'fetch_and_process_url' command.");
            return false;
        }
        isProcessing = true;
        isCancelled = false;

        console.log("C1. Received 'fetch_and_process_url' command from popup.");
        subtitleLanguages.target = request.targetLang;
        isTranslatedOnly = request.translatedOnly;
        fontSizeEm = request.fontSize;
        backgroundColorPref = request.backgroundColor;
        fontShadowPref = request.fontShadow;
        fontColorPref = request.fontColor;
        subtitleStylePref = request.colourCoding;
        translationCache = {};
        if (syncInterval) clearInterval(syncInterval);

        const url = request.url;
        if (!('Translator' in self)) {
            sendStatusUpdate("ERROR: Chrome Translator API not detected. Translations are unavailable.", 0, url);
            isProcessing = false;
            return false;
        }

        console.log("C2. Starting core fetch/parse/translate sequence...");
        (async () => {
            const videoElement = getNetflixVideoElement();
            if (!videoElement) {
                console.error("C2.1. Video player element not found on this page.");
                sendStatusUpdate("Video player not found. Please start playback and try again.", 0);
                isProcessing = false;
                return;
            }

            const xmlContent = await fetchXmlContent(url);
            console.log("C3. XML Content fetch complete. Content size:", xmlContent ? xmlContent.length : '0');
            if (!xmlContent || isCancelled) {
                isProcessing = false;
                return;
            }

            createFloatingWindow();
            disableNetflixSubObserver();

            const parseSuccess = parseTtmlXml(xmlContent, url);
            console.log("C4. XML Parsing attempt finished. Success:", parseSuccess);

            if (parseSuccess && parsedSubtitles.length > 0 && !isCancelled) {
                sendStatusUpdate("Detecting subtitle language...", 30, url);
                const detectedLang = await detectBaseLanguage();
                subtitleLanguages.base = detectedLang;

                if (isCancelled) {
                    isProcessing = false;
                    return;
                }

                if (!subtitleLanguages.base) {
                    sendStatusUpdate(`Detected Base Language: (FAIL). Attempting translation with fallback 'en'...`, 30, url);
                    subtitleLanguages.base = 'en';
                } else {
                    sendStatusUpdate(`Detected Base Language: ${detectedLang.toUpperCase()}. Starting translation...`, 30, url);
                }
                
                console.log("C5. Starting subtitle sync loop *early* while translation runs in background.");
                startSubtitleSync(videoElement);
                
                console.log(`C6. Starting concurrent translation: ${subtitleLanguages.base} -> ${subtitleLanguages.target}...`);
                try {
                    await translateAllSubtitles(url);
                } catch (e) {
                    if (e.message !== "ABORT_TRANSLATION") {
                        console.error("Fatal error during translation:", e);
                    }
                }

                console.log("C7. Translation process finished. Checking final status...");
                isProcessing = false;

            } else {
                console.error("C8. Failed to process XML or no subtitles found after parsing/cancellation.");
                if (!isCancelled) {
                    sendStatusUpdate("Invalid URL retrieved - please repeat URL retrieval steps", 0, url, 'url');
                }
                isProcessing = false;
            }
        })();

        return false;
    }

    if (request.command === "cancel_processing") {
        isCancelled = true;
        if (syncInterval) {
            clearInterval(syncInterval);
            syncInterval = null;
            console.log("Subtitle sync loop stopped by user cancel.");
        }
        if (floatingWindow) {
            floatingWindow.style.display = 'none';
            floatingWindow.innerHTML = '';
        }
        isProcessing = false;
        return false;
    }

    return false;
});