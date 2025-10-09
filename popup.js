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

// Define functions outside DOMContentLoaded but ensure they use initialized elements
async function resetStatus(elements) {
    // MODIFICATION: Added subtitle_style_pref to the removal list
    // NEW: Remove detected_base_lang_name
    await chrome.storage.local.remove(['ls_status', 'last_input', 'captured_subtitle_url', 'translated_only_pref', 'font_size_pref', 'background_color_pref', 'font_shadow_pref', 'font_color_pref', 'subtitle_style_pref', 'detected_base_lang_name']); 
    
    if (!elements.confirmButton) return; 

    elements.subtitleUrlInput.value = '';
    // --- MODIFIED: Reset language input value ---
    elements.targetLanguageInput.value = 'Spanish'; // Default language in full text
    
    // MODIFICATION: Reset subtitle mode and style to default 'dual' and 'netflix'
    elements.subtitleModeDual.checked = true;
    elements.subtitleStyleNetflix.checked = true;
    elements.customSettingsButton.disabled = true; // Disable button on reset

    
    elements.confirmButton.disabled = true; // Button disabled until URL is pasted
    // --- MODIFIED: Ensure new input is NOT disabled ---
    elements.targetLanguageInput.disabled = false; 
    
    // MODIFICATION: Enable all main popup preference radio buttons
    elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
    elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = false);

    elements.cancelButton.classList.add('hidden-no-space'); 
    elements.cancelButton.textContent = "Cancel Subtitle Generation"; // Ensure text is reset

    // --- MODIFICATION: Set initial status text to empty string and new status lines to default ---
    elements.statusText.textContent = ""; 
    elements.urlStatusText.textContent = "Waiting for URL..."; // NEW
    elements.langStatusText.textContent = ""; // NEW

    elements.progressBar.style.width = '0%';
    console.log("Processing status reset completed. Fields cleared.");
}

// Function to handle opening the custom settings window
function openCustomSettingsWindow() {
    chrome.windows.create({
        url: 'custom_settings.html', // NEW FILE
        type: 'popup',
        width: 380,
        height: 345, // MODIFIED: Adjusted height to be smaller
        focused: true
    });
}

function getLanguageName(langCode) {
    const langKey = Object.keys(LANGUAGE_MAP).find(key => LANGUAGE_MAP[key] === langCode);
    // Return capitalized name or the uppercased code if not found
    return langKey ? langKey.charAt(0).toUpperCase() + langKey.slice(1) : langCode.toUpperCase();
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
            } else {
                // If detected language is already saved, don't re-run detection, just display
                elements.urlStatusText.textContent = `${data.detected_base_lang_name} subtitles ready to translate!`;
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
                    }
                });
            }
        });
        
    } else {
         // Set to "Waiting" status
         elements.urlStatusText.textContent = "Waiting for URL...";
         // Clear saved detected language on clearing URL
         chrome.storage.local.remove(['detected_base_lang_name']); 
    }
    
    // Clear other status lines on input change
    elements.statusText.textContent = "";
    elements.langStatusText.textContent = "";
    elements.progressBar.style.width = '0%';
}

function loadSavedStatus(elements) {
    console.log("3. Loading saved status from storage.");
    // MODIFICATION: Added subtitle_style_pref and detected_base_lang_name to retrieval list
    chrome.storage.local.get([
        'ls_status', 
        'last_input', 
        'translated_only_pref', // This preference name is kept for backward compatibility and is now a boolean
        'subtitle_style_pref', // New style tracker
        'font_size_pref', // Still retrieved, though managed by custom_settings.js
        'background_color_pref', 
        'font_shadow_pref', 
        'font_color_pref',
        'detected_base_lang_name' // NEW: Retrieve the pre-detected language name
    ], (data) => {
        const status = data.ls_status;
        const detectedBaseLangName = data.detected_base_lang_name; // NEW
        
        // Always set the defaults first
        elements.progressBar.style.width = '0%';
        elements.targetLanguageInput.disabled = false; 
        elements.cancelButton.classList.add('hidden-no-space'); 
        elements.cancelButton.textContent = "Cancel Subtitle Generation"; 
        
        // MODIFICATION: Load Subtitle Mode
        const isTranslatedOnlyPref = data.translated_only_pref;
        if (isTranslatedOnlyPref === true) {
            elements.subtitleModeTranslatedOnly.checked = true;
        } else {
            elements.subtitleModeDual.checked = true; 
        }
        
        // MODIFICATION: Load Subtitle Style, default to 'netflix'
        const savedStyle = data.subtitle_style_pref || 'netflix';
        if (savedStyle === 'custom') {
            elements.subtitleStyleCustom.checked = true;
            elements.customSettingsButton.disabled = false; // Enable custom button
        } else {
            elements.subtitleStyleNetflix.checked = true;
            elements.customSettingsButton.disabled = true; // Disable custom button
        }

        // Load Language Inputs and last URL first
        let currentFullLangName = 'Spanish'; // Default value
        let currentBaseLangName = null; // NEW: Store Base Language Name
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
                
                // MODIFICATION: Disable all main popup preference radio buttons
                elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                elements.customSettingsButton.disabled = true; // Also disable the settings button

                elements.cancelButton.classList.remove('hidden-no-space');
                elements.cancelButton.textContent = "Cancel Subtitle Generation"; 
            } else {
                // Process finished (progress == 100)
                
                // MODIFICATION: SET NEW BASE LANGUAGE READY MESSAGE ON COMPLETION
                if (currentBaseLangName) {
                    elements.urlStatusText.textContent = `${currentBaseLangName} subtitles ready to translate!`;
                } else {
                    // Fallback to the saved detected language or generic message
                    const finalLangName = detectedBaseLangName ? detectedBaseLangName : "Subtitle";
                    elements.urlStatusText.textContent = `${finalLangName} subtitles ready to translate!`;
                }
                
                elements.confirmButton.disabled = false; // Allow re-run
                elements.targetLanguageInput.disabled = false; 
                
                // MODIFICATION: Enable all main popup preference radio buttons
                elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                
                // Re-enable settings button only if custom is selected
                elements.customSettingsButton.disabled = (savedStyle === 'netflix');


                elements.cancelButton.classList.remove('hidden-no-space');
                elements.cancelButton.textContent = "Clear Status & Reset"; // Finished
            }
        } else {
             // --- NEUTRAL or ERROR State (Progress == 0) ---
             
             // Language Status
             // MODIFICATION: Check for the language status message and route it
             if (status && status.message && status.message.includes("Language pair not yet available")) {
                 elements.langStatusText.textContent = "Language pair not yet available, please retry with different inputs.";
             } else {
                 elements.langStatusText.textContent = ""; // Clear language status
             }
             
             // URL Status & Confirmation Button Logic
             const urlValue = elements.subtitleUrlInput.value.trim();
             if (urlValue && urlValue.startsWith('http')) {
                 
                 // MODIFICATION: Call the central detection function here.
                 // This covers the initial load when a URL is retrieved from storage.
                 checkUrlAndDetectLanguage(elements);
                 
                 // If there's a URL-related error message from a previous run, override the ready status
                 if (status && status.message) {
                     // NEW: Check for the URL-related errors in status.message
                     if (status.message.includes("Old subtitle URL used") || 
                         status.message.includes("Error fetching subtitles") || 
                         status.message.includes("Invalid URL retrieved")) { // New consolidated error
                         
                         elements.urlStatusText.textContent = status.message;
                     }
                 }
                 
             } else {
                 // No URL
                 elements.urlStatusText.textContent = "Waiting for URL...";
                 elements.confirmButton.disabled = true;
                 elements.subtitleUrlInput.value = '';
                 elements.targetLanguageInput.value = 'Spanish'; 
             }
             
             // Status Box (Main)
             if (status && status.message && !status.message.includes("Language pair not yet available")) {
                  // Only show non-URL/non-Lang error messages in the main box
                  if (!status.message.includes("Old subtitle URL used") && 
                      !status.message.includes("Error fetching subtitles") &&
                      !status.message.includes("Invalid URL retrieved")) {
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
             
             // MODIFICATION: Ensure main popup preferences are enabled
             elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
             elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = false);
             elements.customSettingsButton.disabled = (savedStyle === 'netflix');

        }
    });
}

async function handleConfirmClick(elements) {
    console.log("[POPUP] 'Generate Subtitles' button clicked. Starting process.");
    
    // NEW: Clear the temp detection status as the full process is starting
    await chrome.storage.local.remove(['detected_base_lang_name']);

    const url = elements.subtitleUrlInput.value.trim();
    const inputLangName = elements.targetLanguageInput.value.trim().toLowerCase(); 
    
    // 1. Get Subtitle Mode (boolean)
    const selectedSubtitleMode = document.querySelector('input[name="subtitleMode"]:checked').value;
    const translatedOnly = (selectedSubtitleMode === 'translated_only'); 

    // 2. Get Subtitle Style Mode
    const selectedStyle = document.querySelector('input[name="subtitleStyle"]:checked').value;
    
    // 3. Determine Final Style Preferences
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
         elements.statusText.textContent = ""; // REMOVED redundant message
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
        // MODIFICATION: Use the new consolidated error message
        elements.urlStatusText.textContent = "Invalid URL retrieved - please repeat URL retrieval steps";
        elements.statusText.textContent = "Error: Invalid URL. Please paste a valid Netflix TTML URL."; // Keep main error for context
        elements.progressBar.style.width = '0%';
        elements.confirmButton.disabled = false; 
        return;
    }


    // 5. Save runtime preferences and clear old status
    await chrome.storage.local.remove(['ls_status']);
    await chrome.storage.local.set({ 
        last_input: { url, targetLang: targetLang },
        translated_only_pref: translatedOnly, 
        subtitle_style_pref: selectedStyle, // Save the selected style mode
    });

    // 6. Update UI for start of process
    elements.statusText.textContent = "URL accepted. Initializing content script...";
    elements.progressBar.style.width = '10%';
    elements.confirmButton.disabled = true;
    elements.targetLanguageInput.disabled = true; 
    
    // MODIFICATION: Disable all main popup preference radio buttons
    elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = true);
    elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = true);
    elements.customSettingsButton.disabled = true;

    
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

        // 7. MODIFICATION: Pass all final style preferences to content script
        const message = { 
            command: "fetch_and_process_url", 
            url: url,
            targetLang: targetLang, 
            translatedOnly: translatedOnly, 
            fontSize: finalStylePrefs.font_size_pref, // Use final determined value
            backgroundColor: finalStylePrefs.background_color_pref, // Use final determined value
            fontShadow: finalStylePrefs.font_shadow_pref, // Use final determined value
            fontColor: finalStylePrefs.font_color_pref // Use final determined value
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

async function handleCancelClick(elements) {
    // 1. Send the cancel message to content.js 
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0] || !tabs[0].id) {
            console.error("[POPUP] Cannot cancel: Active tab ID is unavailable.");
            return;
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
    
    // 2. Immediately clear the saved status and reset UI elements
    await chrome.storage.local.remove(['ls_status', 'detected_base_lang_name']); // NEW: Clear base language
    
    // MODIFICATION: Set a neutral message when cancelled
    elements.statusText.textContent = "Processing stopped. Click 'Clear Status & Reset' to restart.";
    elements.progressBar.style.width = '0%';
    elements.confirmButton.disabled = false;
    elements.targetLanguageInput.disabled = false; 
    
    // MODIFICATION: Re-enable main popup preference radio buttons
    elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
    elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = false);
    
    // Re-enable custom settings button only if custom is selected (which loadSavedStatus will handle)
    
    elements.cancelButton.classList.remove('hidden-no-space'); // Keep cancel button visible with new text
    elements.cancelButton.textContent = "Clear Status & Reset"; // Set to RESET text
    
    elements.urlStatusText.textContent = "";
    elements.langStatusText.textContent = ""; 
    
    loadSavedStatus(elements); 
}

// -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    
    // 2. Initialize DOM variables locally
    const elements = {
        confirmButton: document.getElementById('confirmButton'),
        targetLanguageInput: document.getElementById('targetLanguage'), 
        subtitleUrlInput: document.getElementById('subtitleUrlInput'), 
        statusText: document.getElementById('statusText'),
        progressBar: document.getElementById('progressBar'),
        cancelButton: document.getElementById('cancelButton'),
        
        // NEW: Status lines
        urlStatusText: document.getElementById('urlStatusText'), // NEW
        langStatusText: document.getElementById('langStatusText'), // NEW
        
        // MODIFICATION: Subtitle mode radio button elements
        subtitleModeGroup: document.getElementById('subtitleModeGroup'), 
        subtitleModeDual: document.getElementById('subtitleModeDual'), 
        subtitleModeTranslatedOnly: document.getElementById('subtitleModeTranslatedOnly'), 
        
        // NEW: Subtitle Style elements
        subtitleStyleGroup: document.getElementById('subtitleStyleGroup'),
        subtitleStyleNetflix: document.getElementById('subtitleStyleNetflix'),
        subtitleStyleCustom: document.getElementById('subtitleStyleCustom'),
        customSettingsButton: document.getElementById('customSettingsButton'),
    };
    
    // CRITICAL DEBUG CHECK
    if (!elements.confirmButton || !elements.statusText || !elements.subtitleStyleGroup) { 
        console.error("2. FATAL ERROR: Core DOM elements not found. Check main.html IDs.");
        return; 
    } else {
        console.log("2. All DOM elements found. Attaching listeners.");
    }
    
    // 3. Load previous status and set initial UI state
    // FIX APPLIED HERE: loadSavedStatus is now called only after 'elements' is defined.
    loadSavedStatus(elements);

    // --- Final, Robust Listener Attachment ---
    
    elements.confirmButton.addEventListener('click', () => handleConfirmClick(elements));
    elements.cancelButton.addEventListener('click', () => handleCancelClick(elements));
    
    // MODIFICATION: Listener for subtitle mode radio buttons (saves boolean for translated_only)
    elements.subtitleModeGroup.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                const isTranslatedOnly = (e.target.value === 'translated_only');
                chrome.storage.local.set({ 'translated_only_pref': isTranslatedOnly });
            }
        });
    });
    
    // NEW: Listener for subtitle style radio buttons
    elements.subtitleStyleGroup.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                const selectedStyle = e.target.value;
                chrome.storage.local.set({ 'subtitle_style_pref': selectedStyle }, () => {
                    // Enable/Disable the settings button based on selection
                    elements.customSettingsButton.disabled = (selectedStyle === 'netflix');
                });
            }
        });
    });
    
    // NEW: Listener for the Custom Settings Button
    elements.customSettingsButton.addEventListener('click', openCustomSettingsWindow);

    
    // NEW: Listen to changes in the URL input box to enable/disable the button
    elements.subtitleUrlInput.addEventListener('input', () => {
         // MODIFICATION: Call the central function on user input
         checkUrlAndDetectLanguage(elements);
    });
    
    // NEW: Listen to changes in the language input box
    elements.targetLanguageInput.addEventListener('input', () => {
         const url = elements.subtitleUrlInput.value.trim();
         const isUrlValid = (url && url.startsWith('http'));
         
         if (isUrlValid) {
             // MODIFICATION: Do NOT update the "ready" message with the target language.
             // The language_detected handler manages the ready message now.
             // Keep it simple when the URL is ready, as per the new requirement.
             // If a detection has already occurred, it will remain visible.
             
         }
         // Clear language status text on new input
         elements.langStatusText.textContent = "";
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
                     // Save the name for display on popup reload
                     await chrome.storage.local.set({ 'detected_base_lang_name': baseLangName });
                 } else {
                     // Detection failed or returned 'und'
                     elements.urlStatusText.textContent = `Language detection failed. Ready to generate.`;
                     await chrome.storage.local.remove(['detected_base_lang_name']); // Clear bad detection
                 }
             }
             return false; // Not an async response
        }
        
        // EXISTING HANDLER: To update status from content script
        if (request.command === "update_status") {
            const progress = request.progress;
            const message = request.message;
            
            // --- NEW MESSAGE ROUTING LOGIC ---
            
            // 1. Language Status (Always route language-related messages to langStatusText)
            if (request.route === 'lang') {
                 elements.langStatusText.textContent = message;
                 elements.statusText.textContent = ""; // Clear main status box
            } else if (message.includes("Detected Base Language: (FAIL)")) {
                 // MODIFICATION: Route the language failure message to the language status box
                 elements.langStatusText.textContent = "Language pair not yet available, please retry with different inputs.";
                 elements.statusText.textContent = ""; // Keep main status box clear of this message
            } else {
                 elements.langStatusText.textContent = ""; // Clear lang status for other messages
            }

            // 2. URL Status (Only update on URL errors or if process is cancelled/finished)
            if (request.route === 'url' || progress === 0 || progress === 100) {
                 if (message.includes("Old subtitle URL used") || 
                     message.includes("Error fetching subtitles") || 
                     message.includes("Invalid URL retrieved")) {
                      
                     elements.urlStatusText.textContent = message;
                     elements.statusText.textContent = ""; // Clear main status box for URL errors
                 }
                 // If progress is 0 but it's not a URL/Lang error, keep URL status ready/waiting (handled by logic below)
            } 
            
            // 3. Main Status Box (For all other progress/messages)
            if (progress > 0 && progress < 100) {
                 elements.statusText.textContent = message;
                 elements.urlStatusText.textContent = ""; // Clear URL status while running
                 elements.langStatusText.textContent = ""; // Clear Lang status while running
            }
            
            elements.progressBar.style.width = progress + '%';
            
            // --- UI STATE MANAGEMENT ---
            
            if (progress >= 100) {
                // --- PROGRESS 100% STATE ---
                elements.statusText.textContent = message; // Show completion message
                
                elements.confirmButton.disabled = false;
                elements.targetLanguageInput.disabled = false; 
                
                // MODIFICATION: Re-enable main popup preference radio buttons
                elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                
                // Re-enable settings button based on style selection
                chrome.storage.local.get(['subtitle_style_pref', 'ls_status', 'detected_base_lang_name'], (data) => {
                     elements.customSettingsButton.disabled = (data.subtitle_style_pref !== 'custom');
                     
                     // MODIFICATION: SET NEW BASE LANGUAGE READY MESSAGE ON COMPLETION
                     const baseLangCode = data.ls_status?.baseLang;
                     const detectedBaseLangName = data.detected_base_lang_name;
                     
                     if (baseLangCode) {
                         const baseLangName = getLanguageName(baseLangCode);
                         elements.urlStatusText.textContent = `${baseLangName} subtitles ready to translate!`;
                     } else {
                         const finalLangName = detectedBaseLangName ? detectedBaseLangName : "Subtitle";
                         elements.urlStatusText.textContent = `${finalLangName} subtitles ready to translate!`;
                     }
                     
                     // NEW: Clear the temp detection status as the full process is complete
                     chrome.storage.local.remove(['detected_base_lang_name']);
                });

                elements.cancelButton.classList.remove('hidden-no-space');
                elements.cancelButton.textContent = "Clear Status & Reset"; // Set to CLEAR text
                
                
            } else if (progress > 0) {
                // --- PROGRESS 0% < x < 100% STATE (RUNNING) ---
                // Status text set above
                elements.confirmButton.disabled = true;
                elements.targetLanguageInput.disabled = true; 
                
                // MODIFICATION: Disable all main popup preference radio buttons
                elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                elements.customSettingsButton.disabled = true; // Always disable while running
                
                elements.cancelButton.classList.remove('hidden-no-space');
                elements.cancelButton.textContent = "Cancel Subtitle Generation"; // Set to CANCEL text
                
            } else {
                // --- PROGRESS 0% STATE (ERROR/NEUTRAL) ---
                const isUrlValid = (elements.subtitleUrlInput.value && elements.subtitleUrlInput.value.startsWith('http'));
                
                elements.confirmButton.disabled = !isUrlValid;

                if (isUrlValid) {
                     // If it's a URL/Lang error, the status text is set by the routing logic above.
                     if (!elements.urlStatusText.textContent && !elements.langStatusText.textContent && !elements.statusText.textContent) {
                         // If it's a clean neutral state, check storage for pre-detection
                         chrome.storage.local.get(['subtitle_style_pref', 'detected_base_lang_name'], (data) => {
                             if (data.detected_base_lang_name) {
                                 elements.urlStatusText.textContent = `${data.detected_base_lang_name} subtitles ready to translate!`;
                             } else {
                                 // Fallback to "Detecting" if URL is present but detection failed or not started
                                 // NOTE: This will be covered by loadSavedStatus calling checkUrlAndDetectLanguage
                                 // We only set it to "Detecting" here if it was cleared by an error, but no new input occurred.
                                 if (elements.subtitleUrlInput.value.trim()) {
                                      elements.urlStatusText.textContent = "Detecting language..."; 
                                 } else {
                                      elements.urlStatusText.textContent = "Waiting for URL...";
                                 }
                             }
                             // Also re-enable settings button based on style selection
                             elements.customSettingsButton.disabled = (data.subtitle_style_pref !== 'custom');
                         });
                     }
                } else {
                    elements.urlStatusText.textContent = "Waiting for URL...";
                     // Re-enable settings button based on style selection
                    chrome.storage.local.get(['subtitle_style_pref'], (data) => {
                         elements.customSettingsButton.disabled = (data.subtitle_style_pref !== 'custom');
                    });
                }
                
                elements.targetLanguageInput.disabled = false; 
                
                // MODIFICATION: Re-enable main popup preference radio buttons
                elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                

                elements.cancelButton.classList.add('hidden-no-space');
                elements.cancelButton.textContent = "Cancel Subtitle Generation"; // Reset to default text
            }
        }
    }); 

}); // End DOMContentLoaded