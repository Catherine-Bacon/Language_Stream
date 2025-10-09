console.log("1. popup.js script file loaded.");

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
    "korean": "ko",
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

// Define functions outside DOMContentLoaded but ensure they use initialized elements
async function resetStatus(elements) {
    // MODIFICATION: Add new preferences to removal list
    await chrome.storage.local.remove(['ls_status', 'last_input', 'captured_subtitle_url', 'translated_only_pref', 'font_size_pref', 'background_color_pref', 'font_shadow_pref', 'font_color_pref']); 
    
    if (!elements.confirmButton) return; 

    elements.subtitleUrlInput.value = '';
    // --- MODIFIED: Reset language input value ---
    elements.targetLanguageInput.value = 'Spanish'; // Default language in full text
    
    // MODIFICATION: Reset subtitle mode to default 'dual'
    elements.subtitleModeDual.checked = true;

    // NEW: Reset font size to default 'medium'
    elements.fontSizeMedium.checked = true;
    
    // NEW: Reset background color to default 'black'
    elements.backgroundColorBlack.checked = true;
    
    // NEW: Reset font shadow to default 'black_shadow'
    elements.fontShadowBlack.checked = true;

    // NEW: Reset font color to default 'white'
    elements.fontColorWhite.checked = true;
    
    elements.confirmButton.disabled = true; // Button disabled until URL is pasted
    // --- MODIFIED: Ensure new input is NOT disabled ---
    elements.targetLanguageInput.disabled = false; 
    
    // MODIFICATION: Enable all subtitle mode radio buttons
    elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
    
    // NEW: Enable all other preference radio buttons
    elements.fontSizeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
    elements.backgroundColorGroup.querySelectorAll('input').forEach(input => input.disabled = false);
    elements.fontShadowGroup.querySelectorAll('input').forEach(input => input.disabled = false);
    elements.fontColorGroup.querySelectorAll('input').forEach(input => input.disabled = false);

    elements.cancelButton.classList.add('hidden-no-space'); 
    elements.cancelButton.textContent = "Cancel Subtitle Generation"; // Ensure text is reset

    // --- MODIFICATION: Set initial status text to empty string ---
    elements.statusText.textContent = ""; 
    elements.progressBar.style.width = '0%';
    console.log("Processing status reset completed. Fields cleared.");
}

function loadSavedStatus(elements) {
    console.log("3. Loading saved status from storage.");
    // MODIFICATION: Retrieve translated_only_pref
    chrome.storage.local.get([
        'ls_status', 
        'last_input', 
        'translated_only_pref', // This preference name is kept for backward compatibility and is now a boolean
        'font_size_pref', 
        'background_color_pref', 
        'font_shadow_pref', 
        'font_color_pref'
    ], (data) => {
        const status = data.ls_status;
        
        // Always set the defaults first
        elements.progressBar.style.width = '0%';
        // --- MODIFIED: Reference new targetLanguageInput element ---
        elements.targetLanguageInput.disabled = false; 
        
        elements.cancelButton.classList.add('hidden-no-space'); 
        elements.cancelButton.textContent = "Cancel Subtitle Generation"; // Default text
        
        // MODIFICATION: Load persistent preference for subtitle mode
        // Note: The storage key 'translated_only_pref' is a boolean (true/false)
        const isTranslatedOnlyPref = data.translated_only_pref;
        
        if (isTranslatedOnlyPref === true) {
            elements.subtitleModeTranslatedOnly.checked = true;
        } else {
            // Default to dual mode if preference is false, null, or undefined
            elements.subtitleModeDual.checked = true; 
        }

        // NEW: Load persistent preference for font size, default to 'medium'
        const savedFontSize = data.font_size_pref || 'medium';
        const fontSizeElement = document.getElementById(`fontSize${savedFontSize.charAt(0).toUpperCase() + savedFontSize.slice(1)}`);
        if (fontSizeElement) {
             fontSizeElement.checked = true;
        }

        // NEW: Load persistent preference for background color, default to 'black'
        const savedBgColor = data.background_color_pref || 'black';
        const bgColorElement = document.getElementById(`backgroundColor${savedBgColor.charAt(0).toUpperCase() + savedBgColor.slice(1)}`);
        if (bgColorElement) {
             bgColorElement.checked = true;
        }

        // NEW: Load persistent preference for font shadow, default to 'black_shadow'
        const savedFontShadow = data.font_shadow_pref || 'black_shadow';
        const fontShadowElement = document.getElementById(`fontShadow${savedFontShadow.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')}`);
        if (fontShadowElement) {
             fontShadowElement.checked = true;
        }

        // NEW: Load persistent preference for font color, default to 'white'
        const savedFontColor = data.font_color_pref || 'white';
        const fontColorElement = document.getElementById(`fontColor${savedFontColor.charAt(0).toUpperCase() + savedFontColor.slice(1)}`);
        if (fontColorElement) {
             fontColorElement.checked = true;
        }


        // Load Language Inputs and last URL first
        const input = data.last_input;
        if (input) {
             // We can only reliably save the code (input.targetLang), so we need to look up the full name
             const fullLangName = Object.keys(LANGUAGE_MAP).find(key => LANGUAGE_MAP[key] === input.targetLang) || input.targetLang;
             
             // --- MODIFIED: Set value for input field (full name or code if not found) ---
             elements.targetLanguageInput.value = fullLangName.charAt(0).toUpperCase() + fullLangName.slice(1);
             elements.subtitleUrlInput.value = input.url || '';
        }

        if (status && status.progress > 0) {
            elements.statusText.textContent = status.message;
            elements.progressBar.style.width = status.progress + '%';
            
            // Disable inputs while processing (progress > 0 and < 100)
            if (status.progress < 100) {
                elements.confirmButton.disabled = true;
                // --- MODIFIED: Disable language input element ---
                elements.targetLanguageInput.disabled = true; 
                
                // MODIFICATION: Disable all preference radio buttons while running
                elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                elements.fontSizeGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                elements.backgroundColorGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                elements.fontShadowGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                elements.fontColorGroup.querySelectorAll('input').forEach(input => input.disabled = true);

                elements.cancelButton.classList.remove('hidden-no-space');
                elements.cancelButton.textContent = "Cancel Subtitle Generation"; // Running
            } else {
                // Process finished (progress == 100)
                elements.confirmButton.disabled = false; // Allow re-run
                // --- MODIFIED: Enable language input element ---
                elements.targetLanguageInput.disabled = false; 
                
                // MODIFICATION: Enable all preference radio buttons
                elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                elements.fontSizeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                elements.backgroundColorGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                elements.fontShadowGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                elements.fontColorGroup.querySelectorAll('input').forEach(input => input.disabled = false);

                elements.cancelButton.classList.remove('hidden-no-space');
                elements.cancelButton.textContent = "Clear Status & Reset"; // Finished
            }
        } else {
             // Neutral or Error State
             // Check the input field's value
             if (elements.subtitleUrlInput.value && elements.subtitleUrlInput.value.startsWith('http')) {
                 elements.statusText.textContent = "Subtitle URL ready. Click Generate to start translation.";
                 elements.confirmButton.disabled = false;
             } else {
                 // --- MODIFICATION: Set initial text to empty string if URL is empty ---
                 elements.statusText.textContent = "";
                 elements.confirmButton.disabled = true;
                 
                 // On clean state, ensure fields are empty (new requirement on refresh/clean)
                 elements.subtitleUrlInput.value = '';
                 // --- MODIFIED: Set language input default value ---
                 elements.targetLanguageInput.value = 'Spanish'; 
             }
             
             if (status && status.progress === 0 && status.message) {
                 // If status is 0 and we have a message (e.g., 403 error or language fail)
                 if (status.message.includes("Detected Base Language: (FAIL)")) {
                    elements.statusText.textContent = "Language pair not yet available, please retry with different inputs";
                 } else {
                    elements.statusText.textContent = status.message;
                 }
                 elements.cancelButton.classList.add('hidden-no-space');
             }
             
             // MODIFICATION: Ensure preferences are enabled on a neutral/error state
             elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
             elements.fontSizeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
             elements.backgroundColorGroup.querySelectorAll('input').forEach(input => input.disabled = false);
             elements.fontShadowGroup.querySelectorAll('input').forEach(input => input.disabled = false);
             elements.fontColorGroup.querySelectorAll('input').forEach(input => input.disabled = false);
        }
    });
}

// --- Handler Functions ---

async function handleConfirmClick(elements) {
    console.log("[POPUP] 'Generate Subtitles' button clicked. Starting process.");

    const url = elements.subtitleUrlInput.value.trim();
    // --- MODIFIED: Get full language name from input field ---
    const inputLangName = elements.targetLanguageInput.value.trim().toLowerCase(); 
    
    // MODIFICATION: Get selected subtitle mode preference
    const selectedSubtitleMode = document.querySelector('input[name="subtitleMode"]:checked').value;
    const translatedOnly = (selectedSubtitleMode === 'translated_only'); // Set the boolean for content script
    
    // NEW: Get selected font size preference
    const selectedFontSize = document.querySelector('input[name="fontSize"]:checked').value;
    
    // NEW: Get selected background color preference
    const selectedBackgroundColor = document.querySelector('input[name="backgroundColor"]:checked').value;

    // NEW: Get selected font shadow preference
    const selectedFontShadow = document.querySelector('input[name="fontShadow"]:checked').value;

    // NEW: Get selected font color preference
    const selectedFontColor = document.querySelector('input[name="fontColor"]:checked').value;


    // --- NEW: LOOKUP THE 2-LETTER CODE ---
    const targetLang = LANGUAGE_MAP[inputLangName] || inputLangName; 
    
    // --- NEW: VALIDATE THE LANGUAGE CODE (MUST BE 2 LETTERS) ---
    if (targetLang.length !== 2) {
         elements.statusText.textContent = `Please check language spelling`;
         elements.progressBar.style.width = '0%';
         elements.confirmButton.disabled = false;
         return;
    }
    // --------------------------------------------------------

    // IMMEDIATE VISUAL FEEDBACK
    elements.statusText.textContent = "Generating subtitles...";
    elements.progressBar.style.width = '5%';
    
    
    console.log("[POPUP] Retrieved URL from input box. URL found:", !!url);

    if (!url || !url.startsWith('http')) {
        // --- MODIFICATION: Generic error message for invalid input ---
        elements.statusText.textContent = "Error: Invalid URL. Please paste a valid Netflix TTML URL.";
        elements.progressBar.style.width = '0%';
        elements.confirmButton.disabled = false; 
        return;
    }


    // 1. Save language choices and preference and clear old status
    await chrome.storage.local.remove(['ls_status']);
    await chrome.storage.local.set({ 
        // We save the found CODE, not the full name
        last_input: { url, targetLang: targetLang },
        // MODIFICATION: Save the translatedOnly boolean based on selected mode
        translated_only_pref: translatedOnly, 
        font_size_pref: selectedFontSize, // NEW
        background_color_pref: selectedBackgroundColor, // NEW
        font_shadow_pref: selectedFontShadow, // NEW
        font_color_pref: selectedFontColor // NEW
    });

    // 2. Update UI for start of process
    elements.statusText.textContent = "URL accepted. Initializing content script...";
    elements.progressBar.style.width = '10%';
    elements.confirmButton.disabled = true;
    // --- MODIFIED: Disable language input field ---
    elements.targetLanguageInput.disabled = true; 
    
    // MODIFICATION: Disable all preference radio buttons while processing
    elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = true);
    elements.fontSizeGroup.querySelectorAll('input').forEach(input => input.disabled = true);
    elements.backgroundColorGroup.querySelectorAll('input').forEach(input => input.disabled = true);
    elements.fontShadowGroup.querySelectorAll('input').forEach(input => input.disabled = true);
    elements.fontColorGroup.querySelectorAll('input').forEach(input => input.disabled = true);

    
    elements.cancelButton.textContent = "Cancel Subtitle Generation"; // Ensure running text
    elements.cancelButton.classList.remove('hidden-no-space'); // Show while running

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        
        if (!tabs[0] || !tabs[0].id) {
            elements.statusText.textContent = "FATAL ERROR: Could not find the active tab ID. Reload page.";
            console.error("[POPUP] Failed to retrieve active tab information.");
            elements.progressBar.style.width = '0%';
            return;
        }
        
        const currentTabId = tabs[0].id;
        console.log(`[POPUP] Target Tab ID: ${currentTabId}. Executing chrome.scripting.executeScript...`);

        // MODIFICATION: Pass all preferences to content script
        const message = { 
            command: "fetch_and_process_url", 
            url: url,
            targetLang: targetLang, // Pass the 2-letter code
            translatedOnly: translatedOnly, // Pass the boolean
            fontSize: selectedFontSize, // NEW
            backgroundColor: selectedBackgroundColor, // NEW
            fontShadow: selectedFontShadow, // NEW
            fontColor: selectedFontColor // NEW
        };

        // --- IMPROVED SCRIPT INJECTION AND MESSAGING ---
        chrome.scripting.executeScript({
            target: { tabId: currentTabId },
            files: ['content.js']
        }, () => {
            if (chrome.runtime.lastError) {
                // This error handler is for injection failures only
                elements.statusText.textContent = `FATAL ERROR: Script injection failed: ${chrome.runtime.lastError.message}.`;
                console.error("[POPUP] Scripting FAILED. Error:", chrome.runtime.lastError.message);
                elements.progressBar.style.width = '0%';
                return;
            }
            
            elements.statusText.textContent = "Content script injected. Sending start command...";
            console.log("[POPUP] Content script injected successfully. Sending message...");
            
            // Sending the message without a callback function.
            chrome.tabs.sendMessage(currentTabId, message);

            
        });
        // --- END IMPROVED SCRIPT INJECTION AND MESSAGING ---
    });
}

async function handleCancelClick(elements) {
    // 1. Send the cancel message to content.js (logic remains the same, ensuring injection)
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
                // This warning is usually fine, meaning the script was already injected/running.
                console.warn("[POPUP] Script injection before cancel failed:", chrome.runtime.lastError.message);
            }
            
            chrome.tabs.sendMessage(currentTabId, { command: "cancel_processing" }).catch(e => {
                 if (!e.message.includes('Receiving end does not exist')) {
                     console.error("[POPUP] Error sending cancel message:", e);
                 }
            });
        });
    });
    
    // 2. Immediately clear the saved status.
    await chrome.storage.local.remove(['ls_status']);
    
    // 3. Manually reset UI elements to the initial state
    elements.statusText.textContent = "Subtitle generation cancelled.";
    elements.progressBar.style.width = '0%';
    elements.confirmButton.disabled = false;
    elements.targetLanguageInput.disabled = false; 
    
    // MODIFICATION: Re-enable all preference radio buttons
    elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
    elements.fontSizeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
    elements.backgroundColorGroup.querySelectorAll('input').forEach(input => input.disabled = false);
    elements.fontShadowGroup.querySelectorAll('input').forEach(input => input.disabled = false);
    elements.fontColorGroup.querySelectorAll('input').forEach(input => input.disabled = false);
    
    elements.cancelButton.classList.add('hidden-no-space');
    elements.cancelButton.textContent = "Cancel Subtitle Generation";
    
    // 4. Re-run loadSavedStatus to correctly load any saved URL/prefs (which were NOT cleared above)
    loadSavedStatus(elements); 
}

// -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    
    // 2. Initialize DOM variables locally
    const elements = {
        confirmButton: document.getElementById('confirmButton'),
        // --- MODIFIED: Reference new targetLanguageInput element ---
        targetLanguageInput: document.getElementById('targetLanguage'), 
        subtitleUrlInput: document.getElementById('subtitleUrlInput'), 
        statusText: document.getElementById('statusText'),
        progressBar: document.getElementById('progressBar'),
        cancelButton: document.getElementById('cancelButton'),
        // MODIFICATION: Subtitle mode radio button elements
        subtitleModeGroup: document.getElementById('subtitleModeGroup'), 
        subtitleModeDual: document.getElementById('subtitleModeDual'), 
        subtitleModeTranslatedOnly: document.getElementById('subtitleModeTranslatedOnly'), 
        
        // NEW Elements for font size
        fontSizeGroup: document.getElementById('fontSizeGroup'),
        fontSizeSmall: document.getElementById('fontSizeSmall'),
        fontSizeMedium: document.getElementById('fontSizeMedium'),
        fontSizeLarge: document.getElementById('fontSizeLarge'),
        // NEW Elements for background color
        backgroundColorGroup: document.getElementById('backgroundColorGroup'),
        backgroundColorNone: document.getElementById('backgroundColorNone'),
        backgroundColorBlack: document.getElementById('backgroundColorBlack'),
        backgroundColorGray: document.getElementById('backgroundColorGray'),
        // NEW Elements for font shadow
        fontShadowGroup: document.getElementById('fontShadowGroup'),
        fontShadowNone: document.getElementById('fontShadowNone'),
        fontShadowBlack: document.getElementById('fontShadowBlack'),
        fontShadowWhite: document.getElementById('fontShadowWhite'),
        // NEW Elements for font color
        fontColorGroup: document.getElementById('fontColorGroup'),
        fontColorWhite: document.getElementById('fontColorWhite'),
        fontColorYellow: document.getElementById('fontColorYellow'),
        fontColorCyan: document.getElementById('fontColorCyan')
    };
    
    // CRITICAL DEBUG CHECK
    if (!elements.confirmButton || !elements.statusText || !elements.subtitleModeGroup) { 
        console.error("2. FATAL ERROR: Core DOM elements (button/status/subtitleModeGroup) not found. Check main.html IDs.");
        return; 
    } else {
        console.log("2. All DOM elements found. Attaching listeners.");
    }
    
    // 3. Load previous status and set initial UI state
    loadSavedStatus(elements);

    // --- Final, Robust Listener Attachment ---
    
    elements.confirmButton.addEventListener('click', () => handleConfirmClick(elements));
    // The handleCancelClick now handles both 'Cancel' and 'Clear Status & Reset'
    elements.cancelButton.addEventListener('click', () => handleCancelClick(elements));
    
    // MODIFICATION: Listener for subtitle mode radio buttons
    elements.subtitleModeGroup.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                // Save the boolean value for the preference: true if 'translated_only', false if 'dual'
                const isTranslatedOnly = (e.target.value === 'translated_only');
                chrome.storage.local.set({ 'translated_only_pref': isTranslatedOnly });
            }
        });
    });
    
    // NEW: Listener for font size radio buttons
    elements.fontSizeGroup.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                chrome.storage.local.set({ 'font_size_pref': e.target.value });
            }
        });
    });

    // NEW: Listener for background color radio buttons
    elements.backgroundColorGroup.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                chrome.storage.local.set({ 'background_color_pref': e.target.value });
            }
        });
    });

    // NEW: Listener for font shadow radio buttons
    elements.fontShadowGroup.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                chrome.storage.local.set({ 'font_shadow_pref': e.target.value });
            }
        });
    });

    // NEW: Listener for font color radio buttons
    elements.fontColorGroup.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                chrome.storage.local.set({ 'font_color_pref': e.target.value });
            }
        });
    });

    
    // NEW: Listen to changes in the URL input box to enable/disable the button
    elements.subtitleUrlInput.addEventListener('input', () => {
         const url = elements.subtitleUrlInput.value.trim();
         elements.confirmButton.disabled = !(url && url.startsWith('http'));
         
         if (elements.confirmButton.disabled === false) {
             elements.statusText.textContent = "Subtitle URL ready. Click Generate to start translation.";
         } else {
              // --- MODIFICATION: Set status to empty string when input is invalid/empty ---
              elements.statusText.textContent = "";
         }
    });


    // 6. Listener to update status from content script
    chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
        
        if (request.command === "update_status") {
            const progress = request.progress;
            const message = request.message;
            
            const langMatch = message.match(/Detected Base Language: (\w+)\./);
            
            if (langMatch) {
                const detectedLangCode = langMatch[1];
                
                if (detectedLangCode.toUpperCase() === '(FAIL)') {
                    elements.statusText.textContent = "Language pair not yet available, please retry with different inputs";
                } else {
                    elements.statusText.textContent = message;
                }
                
            } else if (progress === 0 && elements.subtitleUrlInput.value) {
                elements.statusText.textContent = message;
                
            } else {
                 elements.statusText.textContent = message;
            }

            elements.progressBar.style.width = progress + '%';
            
            if (progress >= 100) {
                // --- PROGRESS 100% STATE ---
                elements.confirmButton.disabled = false;
                elements.targetLanguageInput.disabled = false; 
                
                // MODIFICATION: Re-enable all preference radio buttons
                elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                elements.fontSizeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                elements.backgroundColorGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                elements.fontShadowGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                elements.fontColorGroup.querySelectorAll('input').forEach(input => input.disabled = false);

                elements.cancelButton.classList.remove('hidden-no-space');
                elements.cancelButton.textContent = "Clear Status & Reset"; // Set to CLEAR text
                
            } else if (progress > 0) {
                // --- PROGRESS 0% < x < 100% STATE (RUNNING) ---
                elements.confirmButton.disabled = true;
                elements.targetLanguageInput.disabled = true; 
                
                // MODIFICATION: Disable all preference radio buttons
                elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                elements.fontSizeGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                elements.backgroundColorGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                elements.fontShadowGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                elements.fontColorGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                
                elements.cancelButton.classList.remove('hidden-no-space');
                elements.cancelButton.textContent = "Cancel Subtitle Generation"; // Set to CANCEL text
                
            } else {
                // --- PROGRESS 0% STATE (ERROR/NEUTRAL) ---
                if (elements.subtitleUrlInput.value && elements.subtitleUrlInput.value.startsWith('http')) {
                    
                    // --- MODIFICATION START: REFINED ERROR HANDLING AT PROGRESS 0 ---
                    
                    if (message.includes("Detected Base Language: (FAIL)")) {
                        elements.statusText.textContent = "Language pair not yet available, please retry with different inputs";
                    } 
                    else if (message.includes("Old subtitle URL used") || message.startsWith("Error fetching subtitles")) {
                        elements.statusText.textContent = message;
                    }
                    else {
                        elements.statusText.textContent = "Non-subtitle URL inputted; please repeat URL retrieval steps.";
                    }
                    // --- MODIFICATION END ---
                    
                    elements.confirmButton.disabled = false;
                } else {
                    // --- MODIFICATION: Set status to empty string when input is invalid/empty ---
                    elements.statusText.textContent = "";
                    elements.confirmButton.disabled = true;
                }
                elements.targetLanguageInput.disabled = false; 
                
                // MODIFICATION: Re-enable all preference radio buttons
                elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                elements.fontSizeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                elements.backgroundColorGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                elements.fontShadowGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                elements.fontColorGroup.querySelectorAll('input').forEach(input => input.disabled = false);


                elements.cancelButton.classList.add('hidden-no-space');
                elements.cancelButton.textContent = "Cancel Subtitle Generation"; // Reset to default text
            }
        }
    }); 

}); // End DOMContentLoaded