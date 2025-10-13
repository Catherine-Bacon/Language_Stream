console.log("1. popup.js script file loaded.");

// --- NETFLIX STYLE PRESET ---
const NETFLIX_PRESET = {
    font_size_pref: 'medium', // Corresponds to 0.9em in content.js
    background_color_pref: 'black', // Corresponds to rgba(0, 0, 0, 0.85) in content.js
    font_shadow_pref: 'black_shadow', // Corresponds to 2px 2px 4px rgba(0, 0, 0, 0.8) in content.js
    font_color_pref: 'white' // Corresponds to #FFFFFF in content.js
};
// ----------------------------

// --- NEW GLOBAL LANGUAGE MAP ---
const LANGUAGE_MAP = {
// ... (LANGUAGE_MAP remains unchanged) ...
    "afar": "aa",
    "abkhazian": "ab",
    "avesta": "ae",
    "afrikaans": "af",
    "akan": "ak",
    "amharic": "am",
    "aragonese": "an",
    "arabic": "ar",
    "assamese": "as",
    "avaric": "av",
    "aymara": "ay",
    "azerbaijan": "az",
    "bashkir": "ba",
    "belarusian": "be",
    "bulgarian": "bg",
    "bihari languages": "bh",
    "bislama": "bi",
    "bambara": "bm",
    "bengali / bangla": "bn",
    "tibetan": "bo",
    "breton": "br",
    "bosnian": "bs",
    "catalan / valencian": "ca",
    "chechen": "ce",
    "chamorro": "ch",
    "corsican": "co",
    "cree": "cr",
    "czech": "cs",
    "church slavic / church slavonic / old bulgarian / old church slavonic / old slavonic": "cu",
    "chuvash": "cv",
    "welsh": "cy",
    "danish": "da",
    "german": "de",
    "dhivehi / divehi / maldivian": "dv",
    "dzongkha": "dz",
    "ewe": "ee",
    "modern greek (1453-)": "el",
    "english": "en",
    "esperanto": "eo",
    "spanish / castilian": "es",
    "estonian": "et",
    "basque": "eu",
    "persian": "fa",
    "fulah": "ff",
    "finnish": "fi",
    "fijian": "fj",
    "faroese": "fo",
    "french": "fr",
    "western frisian": "fy",
    "irish": "ga",
    "scottish gaelic / gaelic": "gd",
    "galician": "gl",
    "guarani": "gn",
    "gujarati": "gu",
    "manx": "gv",
    "hausa": "ha",
    "hebrew": "he",
    "hindi": "hi",
    "hiri motu": "ho",
    "croatian": "hr",
    "haitian / haitian creole": "ht",
    "hungarian": "hu",
    "armenian": "hy",
    "herero": "hz",
    "interlingua (international auxiliary language association)": "ia",
    "indonesian": "id",
    "interlingue / occidental": "ie",
    "igbo": "ig",
    "sichuan yi / nuosu": "ii",
    "inupiaq": "ik",
    "indonesian (deprecated: use id)": "in",
    "ido": "io",
    "icelandic": "is",
    "italian": "it",
    "inuktitut": "iu",
    "hebrew (deprecated: use he)": "iw",
    "japanese": "ja",
    "yiddish (deprecated: use yi)": "ji",
    "javanese": "jv",
    "javanese (deprecated: use jv)": "jw",
    "georgian": "ka",
    "kong": "kg",
    "kikuyu / gikuyu": "ki",
    "kuanyama / kwanyama": "kj",
    "kazakh": "kk",
    "kalaallisut / greenlandic": "kl",
    "khmer / central khmer": "km",
    "kannada": "kn",
    "ko": "korean",
    "kanuri": "kr",
    "kashmiri": "ks",
    "kurdish": "ku",
    "komi": "kv",
    "cornish": "kw",
    "kirghiz / kyrgyz": "ky",
    "latin": "la",
    "luxembourgish / letzeburgesch": "lb",
    "ganda / luganda": "lg",
    "limburgan / limburger / limburgish": "li",
    "lingala": "ln",
    "lao": "lo",
    "lithuanian": "lt",
    "luba-katanga": "lu",
    "latvian": "lv",
    "malagasy": "mg",
    "marshallese": "mh",
    "maori": "mi",
    "macedonian": "mk",
    "malayalam": "ml",
    "mongolian": "mn",
    "moldavian / moldovan (deprecated: use ro)": "mo",
    "marathi": "mr",
    "malay (macrolanguage)": "ms",
    "maltese": "mt",
    "burmese": "my",
    "nauru": "na",
    "norwegian bokmål": "nb",
    "north ndebele": "nd",
    "nepali (macrolanguage)": "ne",
    "ndonga": "ng",
    "dutch / flemish": "nl",
    "norwegian nynorsk": "nn",
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

// NEW: Flag to prevent race conditions on cancellation
let isCancelledByPopup = false;

// Define functions outside DOMContentLoaded but ensure they use initialized elements
async function resetStatus(elements) {
    // MODIFICATION: Removed colour_coding_pref from removal list as it's now part of subtitle_style_pref logic
    await chrome.storage.local.remove(['ls_status', 'last_input', 'captured_subtitle_url', 'translated_only_pref', 'font_size_pref', 'background_color_pref', 'font_shadow_pref', 'font_color_pref', 'subtitle_style_pref', 'detected_base_lang_name', 'detected_base_lang_code']);
    
    if (!elements.confirmButton) return;

    elements.subtitleUrlInput.value = '';
    // MODIFIED: Clear the language input on reset for a cleaner state
    elements.targetLanguageInput.value = '';
    
    // MODIFICATION: Reset subtitle mode and style to default 'dual' and 'netflix'
    elements.subtitleModeDual.checked = true;
    elements.subtitleStyleNetflix.checked = true;
    
    // MODIFIED: Renamed from customSettingsButton
    elements.editStyleSettingsButton.disabled = true; // Disable button on reset

    
    elements.confirmButton.disabled = true; // Button disabled until URL is pasted
    // --- MODIFIED: Ensure new input is NOT disabled ---
    elements.targetLanguageInput.disabled = false;
    
    // MODIFICATION: Enable all main popup preference radio buttons
    elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
    elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = false);

    elements.cancelButton.classList.add('hidden-no-space');
    elements.cancelButton.textContent = "Cancel Subtitle Generation"; // Ensure text is reset

    // MODIFIED: Hide the status box on reset
    elements.statusBox.classList.add('hidden-no-space');
    elements.statusText.textContent = "";
    elements.progressBar.style.width = '0%';
    
    // Set other status lines to default
    elements.urlStatusText.textContent = "Waiting for URL...";
    elements.urlStatusText.style.color = "#e50914";

    console.log("Processing status reset completed. Fields cleared.");

    // MODIFIED: Call the language checker to set the correct initial "Waiting for URL..." message.
    await checkLanguagePairAvailability(elements);
}

// Function to handle opening the custom settings window
function openCustomSettingsWindow(selectedStyle) {
    let settingsFile = 'custom_settings.html'; // Default to font/shadow settings
    let windowHeight = 345;

    // Placeholder logic for future color coding settings windows
    if (selectedStyle === 'vocabulary') {
        settingsFile = 'vocabulary_settings.html'; // Placeholder
        windowHeight = 200;
    } else if (selectedStyle === 'grammar') {
        settingsFile = 'grammar_settings.html'; // Placeholder
        windowHeight = 200;
    }

    chrome.windows.create({
        // MODIFIED: Use dynamic file based on selectedStyle
        url: settingsFile,
        type: 'popup',
        width: 380,
        height: windowHeight,
        focused: true
    });
}

function getLanguageName(langCode) {
    const langKey = Object.keys(LANGUAGE_MAP).find(key => LANGUAGE_MAP[key] === langCode);
    // Return capitalized name or the uppercased code if not found
    return langKey ? langKey.charAt(0).toUpperCase() + langKey.slice(1) : langCode.toUpperCase();
}


/**
 * MODIFIED: Checks language pair availability with improved waiting messages.
 */
async function checkLanguagePairAvailability(elements) {
    const inputLangName = elements.targetLanguageInput.value.trim().toLowerCase();
    
    // NEW: If the language box is empty, show a waiting message.
    if (inputLangName === '') {
        elements.langStatusText.textContent = "Waiting for language...";
        elements.langStatusText.style.color = "#e50914"; 
        return;
    }

    const targetLangCode = LANGUAGE_MAP[inputLangName] || inputLangName;

    // 1. Format validation
    if (targetLangCode.length !== 2) {
        elements.langStatusText.textContent = "Please check language spelling.";
        elements.langStatusText.style.color = "#e50914";
        return;
    }

    // 2. Get the detected base language from storage
    const data = await chrome.storage.local.get(['detected_base_lang_code']);
    const baseLangCode = data.detected_base_lang_code;

    // NEW: If language is valid but URL is missing, show a different waiting message.
    if (!baseLangCode) {
        elements.langStatusText.textContent = "Waiting for URL to check translation compatibility...";
        elements.langStatusText.style.color = "#777"; // Neutral color
        return;
    }
    
    // 3. If both codes are valid and available, send a message to the content script to check the pair
    elements.langStatusText.textContent = "Checking language pair availability...";
    elements.langStatusText.style.color = "#777"; // A neutral "in-progress" color

    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, {
                command: "check_language_pair",
                baseLang: baseLangCode,
                targetLang: targetLangCode
            });
        }
    } catch (e) {
        console.warn("Could not send language pair check message:", e);
        // If content script isn't ready, we can't check. Show an error.
        elements.langStatusText.textContent = "Cannot check: please reload the Netflix tab.";
        elements.langStatusText.style.color = "#e50914";
    }
}


/**
 * NEW: Centralized function to check URL validity and trigger detection.
 */
function checkUrlAndDetectLanguage(elements) {
    const url = elements.subtitleUrlInput.value.trim();
    const isUrlValid = (url && url.startsWith('http'));
    elements.confirmButton.disabled = !isUrlValid;

    if (isUrlValid) {
        // Only set status to 'Detecting...' if we haven't already finished detection successfully
        chrome.storage.local.get(['detected_base_lang_name'], (data) => {
            if (!data.detected_base_lang_name) {
                elements.urlStatusText.textContent = `Detecting language...`;
                elements.urlStatusText.style.color = "#e50914";
            } else {
                // If detected language is already saved, don't re-run detection, just display
                elements.urlStatusText.textContent = `${data.detected_base_lang_name} subtitles ready to translate!`;
                elements.urlStatusText.style.color = "green";
            }
        });
        
        // NEW: Send message to content script to fetch/parse/detect language
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    command: "detect_language",
                    url: url
                }).catch(e => {
                   // Fallback for when content script might not be loaded yet
                    if (!e.message.includes('Receiving end does not exist')) {
                        console.warn("Could not send detection message, content script not ready:", e);
                        elements.urlStatusText.textContent = `URL accepted. Ready to generate.`; // Fallback status
                        elements.urlStatusText.style.color = "green";
                    }
                });
            }
        });
        
    } else {
         // Set to "Waiting" status
         elements.urlStatusText.textContent = "Waiting for URL...";
         elements.urlStatusText.style.color = "#e50914";
         // Clear saved detected language on clearing URL
         chrome.storage.local.remove(['detected_base_lang_name', 'detected_base_lang_code']);
    }
    
    // Clear other status lines on input change and hide status box
    if (!elements.statusBox.classList.contains('hidden-no-space')) {
        // Only reset if it was previously visible from an error state.
        elements.statusBox.classList.add('hidden-no-space');
        elements.statusText.textContent = "";
        elements.progressBar.style.width = '0%';
    }
}

function loadSavedStatus(elements) {
    console.log("3. Loading saved status from storage.");
    // MODIFICATION: subtitle_style_pref is the single preference that holds the style AND color coding
    chrome.storage.local.get([
        'ls_status',
        'last_input',
        'translated_only_pref',
        'subtitle_style_pref', // Style preference now includes color coding options
        'font_size_pref',
        'background_color_pref',
        'font_shadow_pref',
        'font_color_pref',
        'detected_base_lang_name'
    ], (data) => {
        const status = data.ls_status;
        const detectedBaseLangName = data.detected_base_lang_name;
        
        // Always set the defaults first
        elements.progressBar.style.width = '0%';
        elements.targetLanguageInput.disabled = false;
        elements.cancelButton.classList.add('hidden-no-space');
        elements.cancelButton.textContent = "Cancel Subtitle Generation";
        
        // MODIFIED: Hide status box by default
        elements.statusBox.classList.add('hidden-no-space');
        
        // Load Subtitle Mode
        const isTranslatedOnlyPref = data.translated_only_pref;
        if (isTranslatedOnlyPref === true) {
            elements.subtitleModeTranslatedOnly.checked = true;
        } else {
            elements.subtitleModeDual.checked = true;
        }
        
        // MODIFIED: Load Subtitle Style, default to 'netflix'
        // The savedStyle now holds: 'netflix', 'custom', 'vocabulary', or 'grammar'
        const savedStyle = data.subtitle_style_pref || 'netflix';
        
        // Check the correct radio button
        const styleElement = document.getElementById(`subtitleStyle${savedStyle.charAt(0).toUpperCase() + savedStyle.slice(1)}`);
        if (styleElement) styleElement.checked = true;

        // Enable settings button only if a style with settings is selected
        const hasSettings = (savedStyle !== 'netflix');
        elements.editStyleSettingsButton.disabled = !hasSettings;


        // Load Language Inputs and last URL first
        let currentFullLangName = 'Spanish'; // Default value
        let currentBaseLangName = null; // Store Base Language Name
        if (data.last_input) {
             const fullLangName = Object.keys(LANGUAGE_MAP).find(key => LANGUAGE_MAP[key] === data.last_input.targetLang) || data.last_input.targetLang;
             currentFullLangName = fullLangName.charAt(0).toUpperCase() + fullLangName.slice(1);
             elements.targetLanguageInput.value = currentFullLangName;
             elements.subtitleUrlInput.value = data.last_input.url || '';
        }
        // NEW: Get Base Language Name from saved status if available
        if (status && status.baseLang) {
             currentBaseLangName = getLanguageName(status.baseLang);
        }

        if (status && status.progress > 0) {
            // --- RUNNING STATE ---
            
            // MODIFIED: Show status box
            elements.statusBox.classList.remove('hidden-no-space');
            
            // Status Box
            elements.statusText.textContent = status.message;
            elements.progressBar.style.width = status.progress + '%';
            
            // URL Status (Always clear URL status while running)
            elements.urlStatusText.textContent = "";
            elements.langStatusText.textContent = "";
            
            // Disable inputs while processing (progress > 0 and < 100)
            if (status.progress < 100) {
                elements.confirmButton.disabled = true;
                elements.targetLanguageInput.disabled = true;
                
                // Disable all main popup preference radio buttons
                elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                elements.editStyleSettingsButton.disabled = true;

                elements.cancelButton.classList.remove('hidden-no-space');
                elements.cancelButton.textContent = "Cancel Subtitle Generation";
            } else {
                // Process finished (progress == 100)
                
                // SET NEW BASE LANGUAGE READY MESSAGE ON COMPLETION
                const finalLangName = currentBaseLangName ? currentBaseLangName : (detectedBaseLangName ? detectedBaseLangName : "Subtitle");
                elements.urlStatusText.textContent = `${finalLangName} subtitles ready to translate!`;
                elements.urlStatusText.style.color = "green";
                
                elements.confirmButton.disabled = false; // Allow re-run
                elements.targetLanguageInput.disabled = false;
                
                // Enable all main popup preference radio buttons
                elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                
                // Re-enable settings button only if style allows it
                elements.editStyleSettingsButton.disabled = (savedStyle === 'netflix');


                elements.cancelButton.classList.remove('hidden-no-space');
                elements.cancelButton.textContent = "Clear Status & Reset"; // Finished
                checkLanguagePairAvailability(elements); // Re-run check on completion
            }

        } else {
             // --- NEUTRAL or ERROR State (Progress == 0) ---
             
             // Language Status
             checkLanguagePairAvailability(elements);
             
             // URL Status & Confirmation Button Logic
             const urlValue = elements.subtitleUrlInput.value.trim();
             if (urlValue && urlValue.startsWith('http')) {
                 
                 // Call the central detection function here.
                 checkUrlAndDetectLanguage(elements);
                 
                 // If there's a URL-related error message from a previous run, override the ready status
                 if (status && status.message) {
                     // Check for the URL-related errors in status.message
                     if (status.message.includes("Old subtitle URL used") ||
                         status.message.includes("Error fetching subtitles") ||
                         status.message.includes("Invalid URL retrieved")) {
                         
                         elements.urlStatusText.textContent = status.message;
                         elements.urlStatusText.style.color = "#e50914";
                     }
                 }
                 
             } else {
                 // No URL
                 elements.urlStatusText.textContent = "Waiting for URL...";
                 elements.urlStatusText.style.color = "#e50914";
                 elements.confirmButton.disabled = true;
                 elements.subtitleUrlInput.value = '';
                 // Language input value should be kept from storage load above, not hard reset here
             }
             
             // Status Box (Main)
             if (status && status.message) {
                  // Only show non-URL/non-Lang error messages in the main box
                  if (!status.message.includes("Old subtitle URL used") &&
                      !status.message.includes("Error fetching subtitles") &&
                      !status.message.includes("Invalid URL retrieved")) {
                      
                      // MODIFIED: Show status box only for non-URL errors.
                      elements.statusBox.classList.remove('hidden-no-space');
                      elements.statusText.textContent = status.message;
                  } else {
                       elements.statusText.textContent = "";
                  }
             } else {
                  elements.statusText.textContent = ""; // Clear main status
             }
             
             // Final UI fixes for neutral/error state
             elements.cancelButton.classList.add('hidden-no-space');
             elements.targetLanguageInput.disabled = false;
             
             // Ensure main popup preferences are enabled
             elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
             elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = false);
             elements.editStyleSettingsButton.disabled = (savedStyle === 'netflix');

        }
    });
}

async function handleConfirmClick(elements) {
    console.log("[POPUP] 'Generate Subtitles' button clicked. Starting process.");
    
    // MODIFIED: Reset the cancellation flag for a new run
    isCancelledByPopup = false;
    
    // MODIFIED: Show the status box
    elements.statusBox.classList.remove('hidden-no-space');
    
    // NEW: Clear the temp detection status as the full process is starting
    await chrome.storage.local.remove(['detected_base_lang_name', 'detected_base_lang_code']);

    const url = elements.subtitleUrlInput.value.trim();
    const inputLangName = elements.targetLanguageInput.value.trim().toLowerCase();
    
    // 1. Get Subtitle Mode (boolean)
    const selectedSubtitleMode = document.querySelector('input[name="subtitleMode"]:checked').value;
    const translatedOnly = (selectedSubtitleMode === 'translated_only');

    // 2. Get Subtitle Style Mode (which includes color coding modes)
    const selectedStyle = document.querySelector('input[name="subtitleStyle"]:checked').value;
    
    // 3. Determine Final Style Preferences (Font/Background/Shadow/Color)
    let finalStylePrefs = {};
    if (selectedStyle === 'netflix') {
        // Use the hardcoded preset
        finalStylePrefs = NETFLIX_PRESET;
    } else {
        // Retrieve custom settings from storage
        const customData = await chrome.storage.local.get(['font_size_pref', 'background_color_pref', 'font_shadow_pref', 'font_color_pref']);
        finalStylePrefs.font_size_pref = customData.font_size_pref || NETFLIX_PRESET.font_size_pref;
        finalStylePrefs.background_color_pref = customData.background_color_pref || NETFLIX_PRESET.background_color_pref;
        finalStylePrefs.font_shadow_pref = customData.font_shadow_pref || NETFLIX_PRESET.font_shadow_pref;
        finalStylePrefs.font_color_pref = customData.font_color_pref || NETFLIX_PRESET.font_color_pref;
    }

    // --- LOOKUP THE 2-LETTER CODE AND VALIDATE ---
    const targetLang = LANGUAGE_MAP[inputLangName] || inputLangName;
    if (targetLang.length !== 2) {
         // MODIFICATION: Route language check error to lang status and NOT to main status
         elements.langStatusText.textContent = `Please check language spelling`;
         elements.langStatusText.style.color = "#e50914";
         elements.statusText.textContent = "";
         elements.progressBar.style.width = '0%';
         elements.confirmButton.disabled = false;
         return;
    }
    // ---------------------------------------------

    // 4. Input validation and UI update
    
    elements.statusText.textContent = "Generating subtitles...";
    elements.urlStatusText.textContent = ""; // Clear URL status when starting
    elements.langStatusText.textContent = ""; // Clear lang status when starting
    elements.progressBar.style.width = '5%';
    
    if (!url || !url.startsWith('http')) {
        // Use the new consolidated error message
        elements.urlStatusText.textContent = "Invalid URL retrieved - please repeat URL retrieval steps";
        elements.urlStatusText.style.color = "#e50914";
        elements.statusText.textContent = "Error: Invalid URL. Please paste a valid Netflix TTML URL.";
        elements.progressBar.style.width = '0%';
        elements.confirmButton.disabled = false;
        return;
    }


    // 5. Save runtime preferences and clear old status
    await chrome.storage.local.remove(['ls_status']);
    await chrome.storage.local.set({
        last_input: { url, targetLang: targetLang },
        translated_only_pref: translatedOnly,
        // MODIFIED: selectedStyle now includes color coding options
        subtitle_style_pref: selectedStyle,
    });

    // 6. Update UI for start of process
    elements.statusText.textContent = "URL accepted. Initializing content script...";
    elements.progressBar.style.width = '10%';
    elements.confirmButton.disabled = true;
    elements.targetLanguageInput.disabled = true;
    
    // Disable all main popup preference radio buttons
    elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = true);
    elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = true);
    elements.editStyleSettingsButton.disabled = true;

    
    elements.cancelButton.textContent = "Cancel Subtitle Generation";
    elements.cancelButton.classList.remove('hidden-no-space');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        
        if (!tabs[0] || !tabs[0].id) {
            elements.statusText.textContent = "FATAL ERROR: Could not find the active tab ID. Reload page.";
            console.error("[POPUP] Failed to retrieve active tab information.");
            elements.progressBar.style.width = '0%';
            return;
        }
        
        const currentTabId = tabs[0].id;
        console.log(`[POPUP] Target Tab ID: ${currentTabId}. Executing chrome.scripting.executeScript...`);

        // 7. Pass all final style preferences and the style mode
        const message = {
            command: "fetch_and_process_url",
            url: url,
            targetLang: targetLang,
            translatedOnly: translatedOnly,
            fontSize: finalStylePrefs.font_size_pref,
            backgroundColor: finalStylePrefs.background_color_pref,
            fontShadow: finalStylePrefs.font_shadow_pref,
            fontColor: finalStylePrefs.font_color_pref,
            // MODIFIED: Pass the selected style as the colourCoding preference
            colourCoding: selectedStyle // Will be 'netflix', 'custom', 'vocabulary', or 'grammar'
        };

        // --- IMPROVED SCRIPT INJECTION AND MESSAGING ---
        chrome.scripting.executeScript({
            target: { tabId: currentTabId },
            files: ['content.js']
        }, () => {
            if (chrome.runtime.lastError) {
                elements.statusText.textContent = `FATAL ERROR: Script injection failed: ${chrome.runtime.lastError.message}.`;
                console.error("[POPUP] Scripting FAILED. Error:", chrome.runtime.lastError.message);
                elements.progressBar.style.width = '0%';
                return;
            }
            
            elements.statusText.textContent = "Content script injected. Sending start command...";
            chrome.tabs.sendMessage(currentTabId, message);

            
        });
        // --- END IMPROVED SCRIPT INJECTION AND MESSAGING ---
    });
}

/**
 * FIXED: This function now handles both 'Cancel' and 'Reset' actions in a single click.
 */
async function handleCancelClick(elements) {
    
    // MODIFIED: Set the cancellation flag to true to ignore any late messages.
    isCancelledByPopup = true;
    
    // 1. Send the cancel message to content.js to stop any background process.
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0] || !tabs[0].id) {
            console.error("[POPUP] Cannot cancel: Active tab ID is unavailable.");
            return; // Fail gracefully
        }

        const currentTabId = tabs[0].id;
        console.log(`[POPUP] Target Tab ID: ${currentTabId}. Executing cancel command.`);

        chrome.scripting.executeScript({
            target: { tabId: currentTabId },
            files: ['content.js']
        }, () => {
            if (chrome.runtime.lastError) {
                console.warn("[POPUP] Script injection before cancel failed:", chrome.runtime.lastError.message);
            }
            
            chrome.tabs.sendMessage(currentTabId, { command: "cancel_processing" }).catch(e => {
                 if (!e.message.includes('Receiving end does not exist')) {
                     console.error("[POPUP] Error sending cancel message:", e);
                 }
            });
        });
    });
    
    // 2. Immediately call resetStatus() to clear storage and reset the entire UI.
    // This will hide the status box and restore the initial state.
    await resetStatus(elements);
}

// -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    
    // 2. Initialize DOM variables locally
    const elements = {
        confirmButton: document.getElementById('confirmButton'),
        targetLanguageInput: document.getElementById('targetLanguage'),
        subtitleUrlInput: document.getElementById('subtitleUrlInput'),
        // MODIFIED: Added statusBox element
        statusBox: document.getElementById('statusBox'),
        statusText: document.getElementById('statusText'),
        progressBar: document.getElementById('progressBar'),
        cancelButton: document.getElementById('cancelButton'),
        
        // NEW: Status lines
        urlStatusText: document.getElementById('urlStatusText'),
        langStatusText: document.getElementById('langStatusText'),
        
        // Subtitle mode radio button elements
        subtitleModeGroup: document.getElementById('subtitleModeGroup'),
        subtitleModeDual: document.getElementById('subtitleModeDual'),
        subtitleModeTranslatedOnly: document.getElementById('subtitleModeTranslatedOnly'),
        
        // NEW: Subtitle Style elements
        subtitleStyleGroup: document.getElementById('subtitleStyleGroup'),
        subtitleStyleNetflix: document.getElementById('subtitleStyleNetflix'),
        subtitleStyleCustom: document.getElementById('subtitleStyleCustom'),
        subtitleStyleVocabulary: document.getElementById('subtitleStyleVocabulary'), // NEW
        subtitleStyleGrammar: document.getElementById('subtitleStyleGrammar'), // NEW
        editStyleSettingsButton: document.getElementById('editStyleSettingsButton'), // MODIFIED: Renamed
        
        // REMOVED: Colour Coding elements
    };
    
    // CRITICAL DEBUG CHECK
    if (!elements.confirmButton || !elements.statusText || !elements.subtitleStyleGroup) {
        console.error("2. FATAL ERROR: Core DOM elements not found. Check main.html IDs.");
        return;
    } else {
        console.log("2. All DOM elements found. Attaching listeners.");
    }
    
    // 3. Load previous status and set initial UI state
    loadSavedStatus(elements);

    // --- Final, Robust Listener Attachment ---
    
    elements.confirmButton.addEventListener('click', () => handleConfirmClick(elements));
    elements.cancelButton.addEventListener('click', () => handleCancelClick(elements));
    
    // Listener for subtitle mode radio buttons 
    elements.subtitleModeGroup.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                const isTranslatedOnly = (e.target.value === 'translated_only');
                chrome.storage.local.set({ 'translated_only_pref': isTranslatedOnly });
            }
        });
    });
    
    // NEW: Listener for subtitle style radio buttons (which includes color coding)
    elements.subtitleStyleGroup.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                const selectedStyle = e.target.value;
                chrome.storage.local.set({ 'subtitle_style_pref': selectedStyle }, () => {
                    // Enable/Disable the settings button based on selection
                    elements.editStyleSettingsButton.disabled = (selectedStyle === 'netflix');
                    // Update the settings button title based on selection
                    const buttonTitle = (selectedStyle === 'custom') ? 'Edit Custom Settings' :
                                        (selectedStyle === 'vocabulary') ? 'Edit Vocabulary Settings' :
                                        (selectedStyle === 'grammar') ? 'Edit Grammar Settings' : 'Edit Style Settings';
                    elements.editStyleSettingsButton.title = buttonTitle;
                });
            }
        });
    });
    
    // NEW: Listener for the Edit Style Settings Button
    elements.editStyleSettingsButton.addEventListener('click', () => {
        // Read the currently selected style to open the correct window
        const selectedStyle = document.querySelector('input[name="subtitleStyle"]:checked').value;
        openCustomSettingsWindow(selectedStyle);
    });

    
    // Listen to changes in the URL input box to enable/disable the button
    elements.subtitleUrlInput.addEventListener('input', () => {
         checkUrlAndDetectLanguage(elements);
    });
    
    // NEW: Listen to changes in the language input box
    elements.targetLanguageInput.addEventListener('input', () => {
         checkLanguagePairAvailability(elements);
    });


    // 6. Listener to update status from content script
    chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
        
        // NEW HANDLER: Language detection result from content script
        if (request.command === "language_detected") {
             const baseLangCode = request.baseLangCode;
             const baseLangName = request.baseLangName;
             const urlForDetection = elements.subtitleUrlInput.value.trim();

             // Only update if the URL in the box matches the URL we detected for
             if (urlForDetection === request.url) {
                 if (baseLangCode) {
                     const statusMessage = `${baseLangName} subtitles ready to translate!`;
                     elements.urlStatusText.textContent = statusMessage;
                     elements.urlStatusText.style.color = "green";
                     // Save the name and code for the proactive language pair check
                     await chrome.storage.local.set({
                         'detected_base_lang_name': baseLangName,
                         'detected_base_lang_code': baseLangCode
                     });
                     // Now that base language is known, trigger the pair check
                     checkLanguagePairAvailability(elements);
                 } else {
                     // Detection failed or returned 'und'
                     elements.urlStatusText.textContent = `Language detection failed. Ready to generate.`;
                     elements.urlStatusText.style.color = "#e50914";
                     await chrome.storage.local.remove(['detected_base_lang_name', 'detected_base_lang_code']); // Clear bad detection
                 }
             }
             return false; // Not an async response
        }

        // NEW HANDLER: For real-time language pair availability status
        if (request.command === "language_pair_status") {
            const currentInputLangName = elements.targetLanguageInput.value.trim().toLowerCase();
            const currentTargetLangCode = LANGUAGE_MAP[currentInputLangName] || currentInputLangName;

            // Only update the UI if the result matches the currently typed language
            if (currentTargetLangCode === request.targetLang) {
                if (request.isAvailable) {
                    const fullLangName = getLanguageName(request.targetLang);
                    elements.langStatusText.textContent = `Ready to translate to ${fullLangName}!`;
                    elements.langStatusText.style.color = "green";
                } else {
                    elements.langStatusText.textContent = "Language pair not yet available, please retry with different inputs.";
                    elements.langStatusText.style.color = "#e50914";
                }
            }
            return false;
        }
        
        // EXISTING HANDLER: To update status from content script
        if (request.command === "update_status") {
            // MODIFIED: Check cancellation flag before processing the message
            if (isCancelledByPopup) {
                console.log("Popup is in cancelled state. Ignoring status update.");
                return;
            }
            
            const progress = request.progress;
            const message = request.message;
            
            // MODIFIED: Always make status box visible when there's a status update from content.js
            elements.statusBox.classList.remove('hidden-no-space');
            
            // --- NEW MESSAGE ROUTING LOGIC ---
            
            // 1. URL Status (Only update on URL errors or if process is cancelled/finished)
            if (request.route === 'url' || progress === 0 || progress === 100) {
                 if (message.includes("Old subtitle URL used") ||
                     message.includes("Error fetching subtitles") ||
                     message.includes("Invalid URL retrieved")) {
                      
                     elements.urlStatusText.textContent = message;
                     elements.urlStatusText.style.color = "#e50914"; // Error status
                     elements.statusText.textContent = ""; // Clear main status box for URL errors
                 }
            } 
            
            // 2. Main Status Box (For all other progress/messages)
            if (progress > 0 && progress < 100) {
                 elements.statusText.textContent = message;
                 elements.urlStatusText.textContent = ""; // Clear URL status while running
                 elements.langStatusText.textContent = ""; // Clear language status while running
            } else if (progress === 0) {
                // If progress is 0, it's an error state
                elements.statusText.textContent = message;
            }
            
            elements.progressBar.style.width = progress + '%';
            
            // --- UI STATE MANAGEMENT ---
            
            if (progress >= 100) {
                // --- PROGRESS 100% STATE ---
                elements.statusText.textContent = message; // Show completion message
                
                elements.confirmButton.disabled = false;
                elements.targetLanguageInput.disabled = false;
                
                // Re-enable main popup preference radio buttons
                elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                
                // Re-enable settings button based on style selection
                chrome.storage.local.get(['subtitle_style_pref', 'ls_status', 'detected_base_lang_name'], (data) => {
                     const savedStyle = data.subtitle_style_pref;
                     elements.editStyleSettingsButton.disabled = (savedStyle === 'netflix');
                     
                     // SET NEW BASE LANGUAGE READY MESSAGE ON COMPLETION
                     const baseLangCode = data.ls_status?.baseLang;
                     const detectedBaseLangName = data.detected_base_lang_name;
                     
                     const finalLangName = (baseLangCode) ? getLanguageName(baseLangCode) :
                                           (detectedBaseLangName ? detectedBaseLangName : "Subtitle");
                                           
                     elements.urlStatusText.textContent = `${finalLangName} subtitles ready to translate!`;
                     elements.urlStatusText.style.color = "green";
                     
                     // Re-run the availability check to restore the green language status message
                     checkLanguagePairAvailability(elements);

                     // Clear the temp detection status as the full process is complete
                     chrome.storage.local.remove(['detected_base_lang_name', 'detected_base_lang_code']);
                });

                elements.cancelButton.classList.remove('hidden-no-space');
                elements.cancelButton.textContent = "Clear Status & Reset"; // Set to CLEAR text
                
                
            } else if (progress > 0) {
                // --- PROGRESS 0% < x < 100% STATE (RUNNING) ---
                // Status text set above
                elements.confirmButton.disabled = true;
                elements.targetLanguageInput.disabled = true;
                
                // Disable all main popup preference radio buttons
                elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                elements.editStyleSettingsButton.disabled = true;
                
                elements.cancelButton.classList.remove('hidden-no-space');
                elements.cancelButton.textContent = "Cancel Subtitle Generation"; // Set to CANCEL text
                
            } else {
                // --- PROGRESS 0% STATE (ERROR/NEUTRAL) ---
                const isUrlValid = (elements.subtitleUrlInput.value && elements.subtitleUrlInput.value.startsWith('http'));
                
                elements.confirmButton.disabled = !isUrlValid;

                if (!isUrlValid) {
                    elements.urlStatusText.textContent = "Waiting for URL...";
                    elements.urlStatusText.style.color = "#e50914";
                }
                
                elements.targetLanguageInput.disabled = false;
                
                // Re-enable main popup preference radio buttons
                elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = false);

                elements.cancelButton.classList.add('hidden-no-space');
                elements.cancelButton.textContent = "Cancel Subtitle Generation"; // Reset to default text
                
                // Run language check in case an error cleared the message
                checkLanguagePairAvailability(elements);
            }
        }
    });

}); // End DOMContentLoaded