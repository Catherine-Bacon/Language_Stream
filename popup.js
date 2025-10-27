console.log("1. popup.js script file loaded.");

// --- MODIFICATION START: Define fixed heights ---
const INITIAL_POPUP_HEIGHT = '485px'; // Taller height for setup state
const PROCESSING_POPUP_HEIGHT = '360px'; // Shorter height for processing state (This is the CSS default)
// --- MODIFICATION END ---

const NETFLIX_PRESET = {
    font_size: 'medium',
    background_color: 'none',
    background_alpha: 1.0,
    font_shadow: 'black_shadow',
    font_color: 'white',
    font_color_alpha: 1.0
};
const CUSTOM_DEFAULTS = {
    font_size: 'medium',
    background_color: 'black',
    background_alpha: 0.8,
    font_shadow: 'black_shadow',
    font_color: 'white',
    font_color_alpha: 1.0
};
const PREF_KEYS = Object.keys(NETFLIX_PRESET);


const LANGUAGE_MAP = {
    "afar": "aa", "abkhazian": "ab", "avesta": "ae", "afrikaans": "af", "akan": "ak", "amharic": "am", "aragonese": "an", "arabic": "ar", "assamese": "as", "avaric": "av", "aymara": "ay", "azerbaijan": "az", "bashkir": "ba", "belarusian": "be", "bulgarian": "bg", "bihari languages": "bh", "bislama": "bi", "bambara": "bm", "bengali / bangla": "bn", "tibetan": "bo", "breton": "br", "bosnian": "bs", "catalan / valencian": "ca", "chechen": "ce", "chamorro": "ch", "corsican": "co", "cree": "cr", "czech": "cs", "church slavic / church slavonic / old bulgarian / old church slavonic / old slavonic": "cu", "chuvash": "cv", "welsh": "cy", "danish": "da", "german": "de", "dhivehi / divehi / maldivian": "dv", "dzongkha": "dz", "ewe": "ee", "modern greek (1453-)": "el", "english": "en", "esperanto": "eo", "spanish / castilian": "es", "estonian": "et", "basque": "eu", "persian": "fa", "fulah": "ff", "finnish": "fi", "fijian": "fj", "faroese": "fo", "french": "fr", "western frisian": "fy", "irish": "ga", "scottish gaelic / gaelic": "gd", "galician": "gl", "guarani": "gn", "gujarati": "gu", "manx": "gv", "hausa": "ha", "hebrew": "he", "hindi": "hi", "hiri motu": "ho", "croatian": "hr", "haitian / haitian creole": "ht", "hungarian": "hu", "armenian": "hy", "herero": "hz", "interlingua (international auxiliary language association)": "ia", "indonesian": "id", "interlingue / occidental": "ie", "igbo": "ig", "sichuan yi / nuosu": "ii", "inupiaq": "ik", "ido": "io", "icelandic": "is", "italian": "it", "inuktitut": "iu", "japanese": "ja", "javanese": "jv", "georgian": "ka", "kongo": "kg", "kikuyu / gikuyu": "ki", "kuanyama / kwanyama": "kj", "kazakh": "kk", "kalaallisut / greenlandic": "kl", "khmer / central khmer": "km", "kannada": "kn", "korean": "ko", "kanuri": "kr", "kashmiri": "ks", "kurdish": "ku", "komi": "kv", "cornish": "kw", "kirghiz / kyrgyz": "ky", "latin": "la", "luxembourgish / letzeburgesch": "lb", "ganda / luganda": "lg", "limburgan / limburger / limburgish": "li", "lingala": "ln", "lao": "lo", "lithuanian": "lt", "luba-katanga": "lu", "latvian": "lv", "malagasy": "mg", "marshallese": "mh", "maori": "mi", "macedonian": "mk", "malayalam": "ml", "mongolian": "mn", "marathi": "mr", "malay (macrolanguage)": "ms", "maltese": "mt", "burmese": "my", "nauru": "na", "norwegian bokmål": "nb", "north ndebele": "nd", "nepali (macrolanguage)": "ne", "ndonga": "ng", "dutch / flemish": "nl", "norwegian nynorsk": "nn", "norwegian": "no", "south ndebele": "nr", "navajo / navaho": "nv", "nyanja / chewa / chichewa": "ny", "occitan (post 1500)": "oc", "ojibwa": "oj", "oromo": "om", "oriya (macrolanguage) / odia (macrolanguage)": "or", "ossetian / ossetic": "os", "panjabi / punjabi": "pa", "pali": "pi", "polish": "pl", "pushto / pashto": "ps", "portuguese": "pt", "quechua": "qu", "romansh": "rm", "rundi": "rn", "romanian / moldavian / moldovan": "ro", "russian": "ru", "kinyarwanda": "rw", "sanskrit": "sa", "sardinian": "sc", "sindhi": "sd", "northern sami": "se", "sango": "sg", "sinhala / sinhalese": "si", "slovak": "sk", "slovenian": "sl", "samoan": "sm", "shona": "sn", "somali": "so", "albanian": "sq", "serbian": "sr", "swati": "ss", "southern sotho": "st", "sundanese": "su", "swedish": "sv", "swahili (macrolanguage)": "sw", "tamil": "ta", "telugu": "te", "tajik": "tg", "thai": "th", "tigrinya": "ti", "turkmen": "tk", "tagalog": "tl", "tswana": "tn", "tonga (tonga islands)": "to", "turkish": "tr", "tsonga": "ts", "tatar": "tt", "twi": "tw", "tahitian": "ty", "uighur / uyghur": "ug", "ukrainian": "uk", "urdu": "ur", "uzbek": "uz", "venda": "ve", "vietnamese": "vi", "volapük": "vo", "walloon": "wa", "wolof": "wo", "xhosa": "xh", "yiddish": "yi", "yoruba": "yo", "zhuang / chuang": "za", "chinese": "zh", "zulu": "zu"
};

// --- MODIFICATION START: Added UI Mode function ---
function updateUIMode(mode, elements) {
    // Clear status fields when switching
    elements.urlStatusText.textContent = "";
    elements.langStatusText.textContent = "";
    elements.youtubeUrlStatusText.textContent = "";
    elements.youtubeLangStatusText.textContent = "";

    if (mode === 'youtube') {
        elements.title.textContent = "Language Stream - YouTube";
        elements.netflixContent.classList.add('hidden-no-space');
        elements.youtubeContent.classList.remove('hidden-no-space');
        elements.youtubeIcon.classList.add('active');
        elements.netflixIcon.classList.remove('active');
        // Initial setup for YouTube mode
        checkYoutubeTranscriptInput(elements); // MODIFIED: Check transcript input
        checkYoutubeLanguagePairAvailability(elements);
    } else { // Default to 'netflix'
        elements.title.textContent = "Language Stream - Netflix";
        elements.netflixContent.classList.remove('hidden-no-space');
        elements.youtubeContent.classList.add('hidden-no-space');
        elements.youtubeIcon.classList.remove('active');
        elements.netflixIcon.classList.add('active');
        // Initial setup for Netflix mode
        checkLanguagePairAvailability(elements);
    }
}
// --- MODIFICATION END ---

let isCancelledByPopup = false;

// --- MODIFICATION: Updated for Youtube mode UI elements ---
function updateGenerateButtonState(elements) {
    const mode = elements.netflixContent.classList.contains('hidden-no-space') ? 'youtube' : 'netflix';
    
    if (mode === 'netflix') {
        const isUrlValid = elements.urlStatusText.style.color === 'green';
        const isLangValid = elements.langStatusText.style.color === 'green';
        elements.confirmButton.disabled = !(isUrlValid && isLangValid);
    } else { // YouTube Mode
        // MODIFICATION: Check if the raw transcript input has content AND if base language has been detected (green status)
        const isTranscriptPresent = elements.youtubeUrlStatusText.style.color === 'green';
        const isLangValid = elements.youtubeLangStatusText.style.color === 'green';
        elements.youtubeConfirmButton.disabled = !(isTranscriptPresent && isLangValid);
    }
}

function saveCurrentInputs(elements) {
    const mode = elements.netflixContent.classList.contains('hidden-no-space') ? 'youtube' : 'netflix';
    if (mode === 'netflix') {
        const currentState = {
            url: elements.subtitleUrlInput.value.trim(),
            targetLang: elements.targetLanguageInput.value.trim()
        };
        chrome.storage.local.set({ 'ui_temp_state_netflix': currentState });
    } else {
        const currentState = {
            targetLang: elements.youtubeTargetLanguage.value.trim(),
            rawTranscript: elements.youtubeTranscriptInput.value.trim() // MODIFICATION: Save raw transcript
        };
        chrome.storage.local.set({ 'ui_temp_state_youtube': currentState });
    }
}

async function resetStatus(elements) {
    await chrome.storage.local.remove([
        'ls_status',
        'last_input',
        'captured_subtitle_url',
        'detected_base_lang_name',
        'detected_base_lang_code',
        'ui_temp_state_netflix', // Updated for Netflix
        'ui_temp_state_youtube', // Added for YouTube
        'youtube_raw_transcript_data', // MODIFICATION: New key for raw text to clear
        'youtube_base_lang_code', // New YouTube data to clear
        'detected_youtube_base_lang_code', // MODIFICATION: Clear new YouTube detection keys
        'detected_youtube_base_lang_name' // MODIFICATION: Clear new YouTube detection keys
    ]);

    // Reset Netflix settings to default
    const netflixSettingsToSave = {};
    for (const key of PREF_KEYS) {
        netflixSettingsToSave[`netflix_${key}`] = NETFLIX_PRESET[key];
    }
    await chrome.storage.local.set(netflixSettingsToSave);

    await chrome.storage.local.set({
        'translated_only_pref': false,
        'subtitle_style_pref': 'netflix'
    });

    // Determine current mode and reset UI accordingly
    const mode = elements.netflixContent.classList.contains('hidden-no-space') ? 'youtube' : 'netflix';
    const currentElements = mode === 'youtube' ? {
        confirmButton: elements.youtubeConfirmButton,
        targetLanguageInput: elements.youtubeTargetLanguage,
        subtitleModeDual: document.getElementById('youtube-subtitleModeDual'),
        subtitleStyleNetflix: document.getElementById('youtube-subtitleStyleNetflix'),
        editStyleSettingsButton: elements.youtubeEditStyleSettingsButton,
        cancelButton: elements.youtubeCancelButton,
        statusBox: elements.youtubeStatusBox,
        statusText: elements.youtubeStatusText,
        progressBar: elements.youtubeProgressBar,
        urlStatusText: elements.youtubeUrlStatusText,
        langStatusText: elements.youtubeLangStatusText,
        // New YouTube-specific elements
        youtubeTranscriptInput: elements.youtubeTranscriptInput, // MODIFIED
        subtitleModeGroup: elements.youtubeSubtitleModeGroup,
        subtitleStyleGroup: elements.youtubeSubtitleStyleGroup
    } : {
        confirmButton: elements.confirmButton,
        targetLanguageInput: elements.targetLanguageInput,
        subtitleUrlInput: elements.subtitleUrlInput,
        subtitleModeDual: document.getElementById('subtitleModeDual'),
        subtitleStyleNetflix: document.getElementById('subtitleStyleNetflix'),
        editStyleSettingsButton: elements.editStyleSettingsButton,
        cancelButton: elements.cancelButton,
        statusBox: elements.statusBox,
        statusText: elements.statusText,
        progressBar: elements.progressBar,
        urlStatusText: elements.urlStatusText,
        langStatusText: elements.langStatusText,
        subtitleModeGroup: elements.subtitleModeGroup,
        subtitleStyleGroup: elements.subtitleStyleGroup
    };

    if (!currentElements.confirmButton) return;
    
    // --- HEIGHT: Set height back to initial setup size ---
    document.body.style.height = INITIAL_POPUP_HEIGHT; 

    currentElements.targetLanguageInput.value = '';
    if (mode === 'netflix') {
        currentElements.subtitleUrlInput.value = '';
    } else { // YouTube specific reset
        currentElements.youtubeTranscriptInput.value = ''; // MODIFIED
    }

    currentElements.subtitleModeDual.checked = true;
    currentElements.subtitleStyleNetflix.checked = true;
    currentElements.editStyleSettingsButton.disabled = false;
    currentElements.editStyleSettingsButton.title = `Edit Netflix Settings`;

    currentElements.confirmButton.disabled = true;
    currentElements.targetLanguageInput.disabled = false;
    if (mode === 'netflix') currentElements.subtitleUrlInput.disabled = false;
    if (mode === 'youtube') currentElements.youtubeTranscriptInput.disabled = false; // MODIFIED

    currentElements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
    currentElements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = false);

    currentElements.cancelButton.classList.add('hidden-no-space');
    currentElements.cancelButton.textContent = "Cancel Subtitle Generation";

    currentElements.statusBox.classList.add('hidden-no-space');
    currentElements.statusText.textContent = "";
    currentElements.progressBar.style.width = '0%';
    
    // YouTube specific reset
    if (mode === 'youtube') {
        currentElements.urlStatusText.textContent = "Paste transcript with timestamps above."; // MODIFIED
    } else { // Netflix specific reset
        currentElements.urlStatusText.textContent = "Waiting for URL...";
    }
    currentElements.urlStatusText.style.color = "#e50914";

    currentElements.urlStatusText.classList.remove('hidden-no-space');
    currentElements.langStatusText.classList.remove('hidden-no-space');

    console.log("Processing status reset completed. Fields cleared.");
    if (mode === 'netflix') {
        await checkLanguagePairAvailability(elements);
    } else {
        await checkYoutubeLanguagePairAvailability(elements);
    }
}

async function stopProcessingUI(elements) {
    // --- HEIGHT: Set height back to initial setup size on Cancel/Clear ---
    document.body.style.height = INITIAL_POPUP_HEIGHT; // Set to '485px'

    const mode = elements.netflixContent.classList.contains('hidden-no-space') ? 'youtube' : 'netflix';
    const currentElements = mode === 'youtube' ? {
        confirmButton: elements.youtubeConfirmButton,
        targetLanguageInput: elements.youtubeTargetLanguage,
        subtitleModeGroup: elements.youtubeSubtitleModeGroup,
        subtitleStyleGroup: elements.youtubeSubtitleStyleGroup,
        editStyleSettingsButton: elements.youtubeEditStyleSettingsButton,
        cancelButton: elements.youtubeCancelButton,
        statusBox: elements.youtubeStatusBox,
        statusText: elements.youtubeStatusText,
        progressBar: elements.youtubeProgressBar,
        urlInstructions: elements.youtubeUrlInstructions,
        urlStatusText: elements.youtubeUrlStatusText,
        langStatusText: elements.youtubeLangStatusText,
        // New YouTube-specific elements
        youtubeTranscriptInput: elements.youtubeTranscriptInput, // MODIFIED
        subtitleUrlInput: null // Not applicable
    } : {
        confirmButton: elements.confirmButton,
        targetLanguageInput: elements.targetLanguageInput,
        subtitleUrlInput: elements.subtitleUrlInput,
        subtitleModeGroup: elements.subtitleModeGroup,
        subtitleStyleGroup: elements.subtitleStyleGroup,
        editStyleSettingsButton: elements.editStyleSettingsButton,
        cancelButton: elements.cancelButton,
        statusBox: elements.statusBox,
        statusText: elements.statusText,
        progressBar: elements.progressBar,
        urlInstructions: elements.urlInstructions,
        urlStatusText: elements.urlStatusText,
        langStatusText: elements.langStatusText,
        // Not applicable
        youtubeTranscriptInput: null, // MODIFIED
    };
    
    currentElements.targetLanguageInput.disabled = false;
    if (currentElements.subtitleUrlInput) currentElements.subtitleUrlInput.disabled = false;
    if (currentElements.youtubeTranscriptInput) currentElements.youtubeTranscriptInput.disabled = false; // MODIFIED
    
    currentElements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
    currentElements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = false);

    const selectedStyle = mode === 'youtube' 
        ? document.querySelector('input[name="youtube-subtitleStyle"]:checked').value
        : document.querySelector('input[name="subtitleStyle"]:checked').value;
        
    const hasSettings = ['netflix', 'custom', 'vocabulary'].includes(selectedStyle);
    currentElements.editStyleSettingsButton.disabled = !hasSettings;
    currentElements.editStyleSettingsButton.title = `Edit ${selectedStyle.charAt(0).toUpperCase() + selectedStyle.slice(1)} Settings`;

    currentElements.cancelButton.classList.add('hidden-no-space');
    currentElements.statusBox.classList.add('hidden-no-space');
    currentElements.statusText.textContent = "";
    currentElements.progressBar.style.width = '0%';
    
    currentElements.confirmButton.classList.remove('hidden-no-space');

    currentElements.urlInstructions.classList.remove('hidden-no-space');
    currentElements.urlStatusText.classList.remove('hidden-no-space');
    currentElements.langStatusText.classList.remove('hidden-no-space');
    
    if (mode === 'netflix') {
        checkUrlAndDetectLanguage(elements);
        checkLanguagePairAvailability(elements);
    } else {
        // Re-check detection status for YouTube
        const transcriptText = currentElements.youtubeTranscriptInput.value.trim(); // MODIFIED
        if (transcriptText.length > 0) {
            // Rerun detection only if status is not already green
            if (currentElements.urlStatusText.style.color !== 'green') {
                detectYoutubeBaseLanguage(elements, transcriptText);
            }
        } else {
             currentElements.urlStatusText.textContent = "Paste transcript with timestamps above."; // MODIFIED
             currentElements.urlStatusText.style.color = "#e50914";
             chrome.storage.local.remove(['detected_youtube_base_lang_code', 'detected_youtube_base_lang_name']);
        }
        checkYoutubeLanguagePairAvailability(elements);
    }
    
    updateGenerateButtonState(elements);

    console.log("Processing stopped. UI reset.");
}

async function openCustomSettingsWindow(selectedStyle) {
    await chrome.storage.local.set({ 'settings_context': selectedStyle });
    chrome.windows.create({
        url: 'custom_settings.html',
        type: 'popup',
        width: 380,
        height: 450,
        focused: true
    });
}

function getLanguageName(langCode) {
    const langKey = Object.keys(LANGUAGE_MAP).find(key => LANGUAGE_MAP[key] === langCode);
    return langKey ? langKey.charAt(0).toUpperCase() + langKey.slice(1) : langCode.toUpperCase();
}

async function getLangCodeFromInput(inputLang) {
    inputLang = inputLang.trim().toLowerCase();
    let targetLangCode = null;

    if (inputLang.length === 2) {
        if (Object.values(LANGUAGE_MAP).includes(inputLang)) {
            targetLangCode = inputLang;
        }
    } else if (inputLang.length > 2) {
        targetLangCode = LANGUAGE_MAP[inputLang];
        if (!targetLangCode) {
            const matchingKey = Object.keys(LANGUAGE_MAP).find(key => key.startsWith(inputLang));
            if (matchingKey) {
                targetLangCode = LANGUAGE_MAP[matchingKey];
            }
        }
    }
    return targetLangCode;
}

// --- NEW FUNCTION: Detects base language of the raw transcript via content script ---
async function detectYoutubeBaseLanguage(elements, rawTranscript) {
    if (!rawTranscript) {
        await chrome.storage.local.remove(['detected_youtube_base_lang_code', 'detected_youtube_base_lang_name']);
        return;
    }

    elements.youtubeUrlStatusText.textContent = `Detecting base language...`;
    elements.youtubeUrlStatusText.style.color = "#e50914";

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
            command: "detect_transcript_language",
            rawTranscript: rawTranscript
        }).then(async (response) => {
            if (chrome.runtime.lastError) {
                console.warn("YouTube base language detection error:", chrome.runtime.lastError.message);
                elements.youtubeUrlStatusText.textContent = "Language detection failed. Assuming English ('en').";
                await chrome.storage.local.set({ 'detected_youtube_base_lang_code': 'en', 'detected_youtube_base_lang_name': 'English' });
            } else if (response && response.baseLangCode) {
                const baseLangName = getLanguageName(response.baseLangCode);
                elements.youtubeUrlStatusText.textContent = `Detected: ${baseLangName} subtitles ready to translate!`;
                elements.youtubeUrlStatusText.style.color = "green";
            } else {
                elements.youtubeUrlStatusText.textContent = "Language detection failed. Assuming English ('en').";
                await chrome.storage.local.set({ 'detected_youtube_base_lang_code': 'en', 'detected_youtube_base_lang_name': 'English' });
            }
            checkYoutubeLanguagePairAvailability(elements);
        }).catch(e => {
            console.warn("Could not send detection message, content script not ready:", e);
            elements.youtubeUrlStatusText.textContent = "Cannot check: please reload the YouTube tab.";
            elements.youtubeUrlStatusText.style.color = "#e50914";
            checkYoutubeLanguagePairAvailability(elements);
        });
    }
}
// --- END NEW FUNCTION ---

// --- MODIFICATION: New function to check raw transcript input ---
function checkYoutubeTranscriptInput(elements) {
    const transcriptText = elements.youtubeTranscriptInput.value.trim();
    if (transcriptText.length > 0) {
        // MODIFICATION: Trigger base language detection from the raw text
        detectYoutubeBaseLanguage(elements, transcriptText);
    } else {
        elements.youtubeUrlStatusText.textContent = "Paste transcript with timestamps above.";
        elements.youtubeUrlStatusText.style.color = "#e50914";
        // Also clear stored detection when the box is empty
        chrome.storage.local.remove(['detected_youtube_base_lang_code', 'detected_youtube_base_lang_name']);
        updateGenerateButtonState(elements);
    }
}
// --- END NEW FUNCTION ---

// --- MODIFICATION: New YouTube Language Check uses detected code ---
async function checkYoutubeLanguagePairAvailability(elements) {
    const inputLang = elements.youtubeTargetLanguage.value.trim().toLowerCase();
    if (inputLang === '') {
        elements.youtubeLangStatusText.textContent = "Waiting for language...";
        elements.youtubeLangStatusText.style.color = "#e50914";
        updateGenerateButtonState(elements);
        return;
    }

    const targetLangCode = await getLangCodeFromInput(inputLang);

    if (!targetLangCode) {
        elements.youtubeLangStatusText.textContent = "Please check language spelling.";
        elements.youtubeLangStatusText.style.color = "#e50914";
        updateGenerateButtonState(elements);
        return;
    }
    
    // MODIFICATION: Get detected base language code from storage
    const data = await chrome.storage.local.get(['detected_youtube_base_lang_code']);
    const baseLangCode = data.detected_youtube_base_lang_code;
    
    if (!baseLangCode) {
        elements.youtubeLangStatusText.textContent = "Waiting for base language detection from transcript..."; // MODIFIED text
        elements.youtubeLangStatusText.style.color = "#777";
        updateGenerateButtonState(elements);
        return;
    }

    elements.youtubeLangStatusText.textContent = "Checking language pair availability...";
    elements.youtubeLangStatusText.style.color = "#777";

    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, {
                command: "check_language_pair",
                baseLang: baseLangCode,
                targetLang: targetLangCode
            }).then(response => {
                if (chrome.runtime.lastError) {
                    console.warn("Language check error:", chrome.runtime.lastError.message);
                    elements.youtubeLangStatusText.textContent = "Cannot check: please reload the YouTube tab.";
                    elements.youtubeLangStatusText.style.color = "#e50914";
                    updateGenerateButtonState(elements);
                    return;
                }
                
                // Re-validate the input in case the user typed quickly
                const currentTargetLangCode = getLangCodeFromInput(elements.youtubeTargetLanguage.value);

                if (currentTargetLangCode === response.targetLang) {
                    // MODIFICATION: Check response.isAvailable instead of relying on simple logic
                    if (response.isAvailable) { 
                        elements.youtubeLangStatusText.textContent = `Ready to translate to ${getLanguageName(response.targetLang)}!`;
                        elements.youtubeLangStatusText.style.color = "green";
                    } else {
                        // Display a more helpful message based on the issue
                        let message = "Language pair not yet available, please retry with different inputs.";
                        if (response.status === 'downloadable') {
                            message = "Translation model is downloading. Try again shortly.";
                        } else if (response.status === 'error' || response.status === 'missing_api') {
                            message = "Compatibility check failed. Please reload the tab.";
                        }
                        
                        elements.youtubeLangStatusText.textContent = message;
                        elements.youtubeLangStatusText.style.color = "#e50914";
                    }
                }
                updateGenerateButtonState(elements);
            }).catch(e => {
                console.warn("Could not send language pair check message:", e);
                elements.youtubeLangStatusText.textContent = "Cannot check: please reload the YouTube tab.";
                elements.youtubeLangStatusText.style.color = "#e50914";
                updateGenerateButtonState(elements);
            });
        }
    } catch (e) {
        console.warn("Could not query tabs for language pair check:", e);
        elements.youtubeLangStatusText.textContent = "Cannot check: please reload the YouTube tab.";
        elements.youtubeLangStatusText.style.color = "#e50914";
        updateGenerateButtonState(elements);
    }
}


async function checkLanguagePairAvailability(elements) {
    const inputLang = elements.targetLanguageInput.value.trim().toLowerCase();
    if (inputLang === '') {
        elements.langStatusText.textContent = "Waiting for language...";
        elements.langStatusText.style.color = "#e50914";
        updateGenerateButtonState(elements);
        return;
    }

    const targetLangCode = await getLangCodeFromInput(inputLang);

    if (!targetLangCode) {
        elements.langStatusText.textContent = "Please check language spelling.";
        elements.langStatusText.style.color = "#e50914";
        updateGenerateButtonState(elements);
        return;
    }

    const data = await chrome.storage.local.get(['detected_base_lang_code']);
    const baseLangCode = data.detected_base_lang_code;
    if (!baseLangCode) {
        elements.langStatusText.textContent = "Waiting for URL to check translation compatibility...";
        elements.langStatusText.style.color = "#777";
        updateGenerateButtonState(elements);
        return;
    }

    elements.langStatusText.textContent = "Checking language pair availability...";
    elements.langStatusText.style.color = "#777";

    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, {
                command: "check_language_pair",
                baseLang: baseLangCode,
                targetLang: targetLangCode
            }).then(response => {
                if (chrome.runtime.lastError) {
                    console.warn("Language check error:", chrome.runtime.lastError.message);
                    elements.langStatusText.textContent = "Cannot check: please reload the Netflix tab.";
                    elements.langStatusText.style.color = "#e50914";
                    updateGenerateButtonState(elements);
                    return;
                }
                
                const currentInputLang = elements.targetLanguageInput.value.trim().toLowerCase();
                let currentTargetLangCode = getLangCodeFromInput(currentInputLang);
                
                if (currentTargetLangCode === response.targetLang) {
                    // MODIFICATION: Check response.isAvailable instead of relying on simple logic
                    if (response.isAvailable) { 
                        elements.langStatusText.textContent = `Ready to translate to ${getLanguageName(response.targetLang)}!`;
                        elements.langStatusText.style.color = "green";
                    } else {
                        // Display a more helpful message based on the issue
                        let message = "Language pair not yet available, please retry with different inputs.";
                        if (response.status === 'downloadable') {
                            message = "Translation model is downloading. Try again shortly.";
                        } else if (response.status === 'error' || response.status === 'missing_api') {
                            message = "Compatibility check failed. Please reload the tab.";
                        }
                        
                        elements.langStatusText.textContent = message;
                        elements.langStatusText.style.color = "#e50914";
                    }
                }
                updateGenerateButtonState(elements);
            }).catch(e => {
                console.warn("Could not send language pair check message:", e);
                elements.langStatusText.textContent = "Cannot check: please reload the Netflix tab.";
                elements.langStatusText.style.color = "#e50914";
                updateGenerateButtonState(elements);
            });
        }
    } catch (e) {
        console.warn("Could not query tabs for language pair check:", e);
        elements.langStatusText.textContent = "Cannot check: please reload the Netflix tab.";
        elements.langStatusText.style.color = "#e50914";
        updateGenerateButtonState(elements);
    }
}

function checkUrlAndDetectLanguage(elements) {
    const url = elements.subtitleUrlInput.value.trim();
    const urlLooksValid = (url && url.startsWith('http'));

    if (urlLooksValid) {
        chrome.storage.local.get(['detected_base_lang_name'], (data) => {
            if (!data.detected_base_lang_name) {
                elements.urlStatusText.textContent = `Detecting language...`;
                elements.urlStatusText.style.color = "#e50914";
            } else {
                elements.urlStatusText.textContent = `${data.detected_base_lang_name} subtitles ready to translate!`;
                elements.urlStatusText.style.color = "green";
            }
            updateGenerateButtonState(elements); 
        });
        
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    command: "detect_language",
                    url: url
                }).then(async (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn("Detection error:", chrome.runtime.lastError.message);
                        return;
                    }
                    if (response && elements.subtitleUrlInput.value.trim() === response.url) {
                        if (response.baseLangCode) {
                            const baseLangName = getLanguageName(response.baseLangCode);
                            elements.urlStatusText.textContent = `${baseLangName} subtitles ready to translate!`;
                            elements.urlStatusText.style.color = "green";
                            await chrome.storage.local.set({
                                'detected_base_lang_name': baseLangName,
                                'detected_base_lang_code': response.baseLangCode
                            });
                            checkLanguagePairAvailability(elements);
                        } else {
                            elements.urlStatusText.textContent = `Language detection failed. Ready to generate.`;
                            elements.urlStatusText.style.color = "#e50914";
                            await chrome.storage.local.remove(['detected_base_lang_name', 'detected_base_lang_code']);
                        }
                        updateGenerateButtonState(elements);
                    }
                }).catch(e => {
                   if (!e.message.includes('Receiving end does not exist')) {
                        console.warn("Could not send detection message, content script not ready:", e);
                   }
                   updateGenerateButtonState(elements);
                });
            }
        });
    } else {
         elements.urlStatusText.textContent = "Waiting for URL...";
         elements.urlStatusText.style.color = "#e50914";
         chrome.storage.local.remove(['detected_base_lang_name', 'detected_base_lang_code']);
         updateGenerateButtonState(elements);
    }
    
    if (!elements.statusBox.classList.contains('hidden-no-space')) {
        elements.statusBox.classList.add('hidden-no-space');
        elements.statusText.textContent = "";
        elements.progressBar.style.width = '0%';
    }
}

// --- MODIFICATION: Added YouTube support to loadSavedStatus ---
function loadSavedStatus(elements) {
    console.log("3. Loading saved status from storage.");
    
    chrome.storage.local.get(['ui_mode'], (modeData) => {
        const savedMode = modeData.ui_mode || 'netflix'; // Default to Netflix
        updateUIMode(savedMode, elements);
        
        const mode = savedMode; // Use the freshly loaded mode
        const currentElements = mode === 'youtube' ? {
            confirmButton: elements.youtubeConfirmButton,
            targetLanguageInput: elements.youtubeTargetLanguage,
            subtitleModeDual: document.getElementById('youtube-subtitleModeDual'),
            subtitleModeTranslatedOnly: document.getElementById('youtube-subtitleModeTranslatedOnly'),
            subtitleStyleNetflix: document.getElementById('youtube-subtitleStyleNetflix'),
            subtitleStyleCustom: document.getElementById('youtube-subtitleStyleCustom'),
            subtitleStyleVocabulary: document.getElementById('youtube-subtitleStyleVocabulary'),
            editStyleSettingsButton: elements.youtubeEditStyleSettingsButton,
            cancelButton: elements.youtubeCancelButton,
            statusBox: elements.youtubeStatusBox,
            statusText: elements.youtubeStatusText,
            progressBar: elements.youtubeProgressBar,
            urlInstructions: elements.youtubeUrlInstructions,
            urlStatusText: elements.youtubeUrlStatusText,
            langStatusText: elements.youtubeLangStatusText,
            subtitleModeGroup: elements.youtubeSubtitleModeGroup,
            subtitleStyleGroup: elements.youtubeSubtitleStyleGroup,
            youtubeTranscriptInput: elements.youtubeTranscriptInput, // MODIFIED
            subtitleUrlInput: null
        } : {
            confirmButton: elements.confirmButton,
            targetLanguageInput: elements.targetLanguageInput,
            subtitleUrlInput: elements.subtitleUrlInput,
            subtitleModeDual: elements.subtitleModeDual,
            subtitleModeTranslatedOnly: elements.subtitleModeTranslatedOnly,
            subtitleStyleNetflix: elements.subtitleStyleNetflix,
            subtitleStyleCustom: elements.subtitleStyleCustom,
            subtitleStyleVocabulary: elements.subtitleStyleVocabulary,
            editStyleSettingsButton: elements.editStyleSettingsButton,
            cancelButton: elements.cancelButton,
            statusBox: elements.statusBox,
            statusText: elements.statusText,
            progressBar: elements.progressBar,
            urlInstructions: elements.urlInstructions,
            urlStatusText: elements.urlStatusText,
            langStatusText: elements.langStatusText,
            subtitleModeGroup: elements.subtitleModeGroup,
            subtitleStyleGroup: elements.subtitleStyleGroup,
            youtubeTranscriptInput: null // MODIFIED
        };

        const keysToLoad = [
            'ls_status', 'last_input', 'translated_only_pref', 'subtitle_style_pref',
            'detected_base_lang_name', 'detected_base_lang_code', 'ui_temp_state_netflix', 'ui_temp_state_youtube',
            'youtube_raw_transcript_data', // MODIFIED: New key for raw text storage
            'youtube_base_lang_code',
            'detected_youtube_base_lang_code', // NEW KEY
            'detected_youtube_base_lang_name' // NEW KEY
        ];

        chrome.storage.local.get(keysToLoad, (data) => {
            const status = data.ls_status;
            
            if (status && status.progress >= 100 && status.message && status.message.startsWith("Translation complete!")) {
                const popcornEmoji = "\u{1F37F}";
                status.message = `Enjoy your show !${popcornEmoji}`;
                chrome.storage.local.set({ 'ls_status': status });
            }
            
            currentElements.progressBar.style.width = '0%';
            currentElements.targetLanguageInput.disabled = false;
            if (currentElements.subtitleUrlInput) currentElements.subtitleUrlInput.disabled = false;
            if (currentElements.youtubeTranscriptInput) currentElements.youtubeTranscriptInput.disabled = false; // MODIFIED
            
            currentElements.cancelButton.classList.add('hidden-no-space');
            currentElements.cancelButton.textContent = "Cancel Subtitle Generation";
            currentElements.statusBox.classList.add('hidden-no-space'); 
            
            if (data.translated_only_pref === true) {
                currentElements.subtitleModeTranslatedOnly.checked = true;
            } else {
                currentElements.subtitleModeDual.checked = true;
            }
            
            const savedStyle = data.subtitle_style_pref || 'netflix';
            const styleElement = document.getElementById(mode === 'youtube' 
                ? `youtube-subtitleStyle${savedStyle.charAt(0).toUpperCase() + savedStyle.slice(1)}`
                : `subtitleStyle${savedStyle.charAt(0).toUpperCase() + savedStyle.slice(1)}`);
                
            if (styleElement) styleElement.checked = true;
            
            const hasSettings = ['netflix', 'custom', 'vocabulary'].includes(savedStyle);
            currentElements.editStyleSettingsButton.disabled = !hasSettings;
            currentElements.editStyleSettingsButton.title = `Edit ${savedStyle.charAt(0).toUpperCase() + savedStyle.slice(1)} Settings`;

            const isProcessing = status && status.progress > 0 && status.progress < 100;
            
            if (!isProcessing) {
                // Load previous inputs from temp state
                const tempState = mode === 'youtube' ? data.ui_temp_state_youtube : data.ui_temp_state_netflix;
                
                if (tempState) {
                    currentElements.targetLanguageInput.value = tempState.targetLang || '';
                    if (mode === 'netflix') currentElements.subtitleUrlInput.value = tempState.url || '';
                    if (mode === 'youtube') currentElements.youtubeTranscriptInput.value = tempState.rawTranscript || ''; // MODIFIED
                } else if (data.last_input) {
                    const fullLangName = Object.keys(LANGUAGE_MAP).find(key => LANGUAGE_MAP[key] === data.last_input.targetLang) || data.last_input.targetLang;
                    currentElements.targetLanguageInput.value = (fullLangName.charAt(0).toUpperCase() + fullLangName.slice(1));
                    if (mode === 'netflix') currentElements.subtitleUrlInput.value = data.last_input.url || '';
                }
            } else if (data.last_input) {
                // If currently processing, show the last input
                const fullLangName = Object.keys(LANGUAGE_MAP).find(key => LANGUAGE_MAP[key] === data.last_input.targetLang) || data.last_input.targetLang;
                currentElements.targetLanguageInput.value = (fullLangName.charAt(0).toUpperCase() + fullLangName.slice(1));
                if (mode === 'netflix') currentElements.subtitleUrlInput.value = data.last_input.url || '';
            }
            
            // MODIFICATION: Load saved raw transcript text if available (for processing state visibility)
            if (mode === 'youtube' && (data.ui_temp_state_youtube?.rawTranscript || data.youtube_raw_transcript_data)) {
                 currentElements.youtubeTranscriptInput.value = data.ui_temp_state_youtube?.rawTranscript || data.youtube_raw_transcript_data || '';
            }


            if (status && status.progress > 0) {
                // Processing/Complete State
                document.body.style.height = PROCESSING_POPUP_HEIGHT;

                currentElements.statusBox.classList.remove('hidden-no-space');
                currentElements.statusText.textContent = status.message;
                currentElements.progressBar.style.width = status.progress + '%';
                
                currentElements.urlInstructions.classList.add('hidden-no-space');
                currentElements.urlStatusText.classList.add('hidden-no-space');
                currentElements.langStatusText.classList.add('hidden-no-space');
                
                currentElements.confirmButton.classList.add('hidden-no-space');
                // MODIFIED: No detectTranscriptButton to hide
                
                if (status.progress < 100) {
                    currentElements.targetLanguageInput.disabled = true;
                    if (currentElements.subtitleUrlInput) currentElements.subtitleUrlInput.disabled = true;
                    if (currentElements.youtubeTranscriptInput) currentElements.youtubeTranscriptInput.disabled = true; // MODIFIED
                    currentElements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                    currentElements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                    currentElements.editStyleSettingsButton.disabled = true;
                    currentElements.cancelButton.classList.remove('hidden-no-space');
                    currentElements.cancelButton.textContent = "Cancel Subtitle Generation";
                    
                } else {
                    currentElements.targetLanguageInput.disabled = true;
                    if (currentElements.subtitleUrlInput) currentElements.subtitleUrlInput.disabled = true;
                    if (currentElements.youtubeTranscriptInput) currentElements.youtubeTranscriptInput.disabled = true; // MODIFIED
                    currentElements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                    currentElements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                    currentElements.editStyleSettingsButton.disabled = true;
                    currentElements.cancelButton.classList.remove('hidden-no-space');
                    currentElements.cancelButton.textContent = "Clear Subtitles";
                }
            } else {
                // Initial/Error State
                document.body.style.height = INITIAL_POPUP_HEIGHT;
                
                currentElements.urlStatusText.classList.remove('hidden-no-space');
                currentElements.langStatusText.classList.remove('hidden-no-space');
                currentElements.cancelButton.classList.add('hidden-no-space');
                
                currentElements.targetLanguageInput.disabled = false;
                if (currentElements.subtitleUrlInput) currentElements.subtitleUrlInput.disabled = false;
                if (currentElements.youtubeTranscriptInput) currentElements.youtubeTranscriptInput.disabled = false; // MODIFIED
                
                currentElements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                currentElements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                currentElements.editStyleSettingsButton.disabled = !hasSettings;
                
                if (mode === 'netflix') {
                    const urlValue = currentElements.subtitleUrlInput.value.trim();
                    if (urlValue && urlValue.startsWith('http')) {
                        checkUrlAndDetectLanguage(elements);
                    } else {
                        currentElements.urlStatusText.textContent = "Waiting for URL...";
                        currentElements.urlStatusText.style.color = "#e50914";
                        currentElements.confirmButton.disabled = true;
                        currentElements.subtitleUrlInput.value = '';
                    }
                    checkLanguagePairAvailability(elements);
                } else { // YouTube Mode
                    // MODIFIED: Check transcript input instead of stored data
                    const transcriptText = currentElements.youtubeTranscriptInput.value.trim();
                    if (transcriptText.length > 0) {
                        // Display the detected base language name if available
                        if (data.detected_youtube_base_lang_name) {
                            currentElements.urlStatusText.textContent = `Detected: ${data.detected_youtube_base_lang_name} subtitles ready to translate!`;
                            currentElements.urlStatusText.style.color = "green";
                        } else {
                            // If not in storage, trigger detection/fallback via checkInput
                            checkYoutubeTranscriptInput(elements);
                        }
                    } else {
                        currentElements.urlStatusText.textContent = "Paste transcript with timestamps above.";
                        currentElements.urlStatusText.style.color = "#e50914";
                    }
                    checkYoutubeLanguagePairAvailability(elements);
                }
                
                if (status && status.message && !status.message.includes("Old subtitle URL used") && !status.message.includes("Error fetching subtitles") && !status.message.includes("Invalid URL retrieved")) {
                    currentElements.statusBox.classList.remove('hidden-no-space');
                    currentElements.statusText.textContent = status.message;
                } else {
                    currentElements.statusText.textContent = "";
                }
                
                updateGenerateButtonState(elements);
            }
        });
    });
}

// --- MODIFICATION: Updated handleConfirmClick for YouTube mode ---
async function handleConfirmClick(elements) {
    const mode = elements.netflixContent.classList.contains('hidden-no-space') ? 'youtube' : 'netflix';
    const isNetflix = (mode === 'netflix');
    
    const currentElements = isNetflix ? {
        confirmButton: elements.confirmButton,
        targetLanguageInput: elements.targetLanguageInput,
        subtitleUrlInput: elements.subtitleUrlInput,
        subtitleModeGroup: elements.subtitleModeGroup,
        subtitleStyleGroup: elements.subtitleStyleGroup,
        editStyleSettingsButton: elements.editStyleSettingsButton,
        cancelButton: elements.cancelButton,
        statusBox: elements.statusBox,
        statusText: elements.statusText,
        progressBar: elements.progressBar,
        urlInstructions: elements.urlInstructions,
        urlStatusText: elements.urlStatusText,
        langStatusText: elements.langStatusText,
        youtubeTranscriptInput: null // MODIFIED
    } : {
        confirmButton: elements.youtubeConfirmButton,
        targetLanguageInput: elements.youtubeTargetLanguage,
        subtitleUrlInput: null,
        subtitleModeGroup: elements.youtubeSubtitleModeGroup,
        subtitleStyleGroup: elements.youtubeSubtitleStyleGroup,
        editStyleSettingsButton: elements.youtubeEditStyleSettingsButton,
        cancelButton: elements.youtubeCancelButton,
        statusBox: elements.youtubeStatusBox,
        statusText: elements.youtubeStatusText,
        progressBar: elements.youtubeProgressBar,
        urlInstructions: elements.youtubeUrlInstructions,
        urlStatusText: elements.youtubeUrlStatusText,
        langStatusText: elements.youtubeLangStatusText,
        youtubeTranscriptInput: elements.youtubeTranscriptInput // MODIFIED
    };

    console.log(`[POPUP] 'Generate Subtitles' button clicked for ${mode} mode. Starting process.`);
    
    // 1. Hide irrelevant setup UI
    document.body.style.height = PROCESSING_POPUP_HEIGHT; 
    
    currentElements.urlInstructions.classList.add('hidden-no-space');
    currentElements.urlStatusText.classList.add('hidden-no-space');
    currentElements.langStatusText.classList.add('hidden-no-space');
    currentElements.confirmButton.classList.add('hidden-no-space');
    // MODIFIED: Removed hide for detectTranscriptButton
    
    // 2. Show status/control UI
    isCancelledByPopup = false;
    currentElements.statusBox.classList.remove('hidden-no-space');
    currentElements.cancelButton.classList.remove('hidden-no-space');
    currentElements.cancelButton.textContent = "Cancel Subtitle Generation";
    
    // 3. Set initial status
    currentElements.statusText.textContent = "Generating subtitles...";
    currentElements.progressBar.style.width = '5%';
    
    // 4. Disable inputs
    currentElements.targetLanguageInput.disabled = true;
    if (currentElements.subtitleUrlInput) currentElements.subtitleUrlInput.disabled = true;
    if (currentElements.youtubeTranscriptInput) currentElements.youtubeTranscriptInput.disabled = true; // MODIFIED
    currentElements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = true);
    currentElements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = true);
    currentElements.editStyleSettingsButton.disabled = true;

    await chrome.storage.local.remove(['detected_base_lang_name', 'detected_base_lang_code']);
    
    const url = isNetflix ? currentElements.subtitleUrlInput.value.trim() : null;
    const inputLangName = currentElements.targetLanguageInput.value.trim().toLowerCase();
    
    const selectedSubtitleMode = document.querySelector(`input[name="${isNetflix ? 'subtitleMode' : 'youtube-subtitleMode'}"]:checked`).value;
    const translatedOnly = (selectedSubtitleMode === 'translated_only');
    const selectedStyle = document.querySelector(`input[name="${isNetflix ? 'subtitleStyle' : 'youtube-subtitleStyle'}"]:checked`).value;
    
    const defaults = (selectedStyle === 'netflix' || selectedStyle === 'vocabulary') ? NETFLIX_PRESET : CUSTOM_DEFAULTS;
    const stylePrefix = `${selectedStyle}_`;
    
    const keysToLoad = PREF_KEYS.map(key => `${stylePrefix}${key}`);
    const storedData = await chrome.storage.local.get(keysToLoad);
    
    const finalStylePrefs = {};
    for (const key of PREF_KEYS) {
        const storedKey = `${stylePrefix}${key}`;
        finalStylePrefs[key] = storedData[storedKey] ?? defaults[key];
    }

    const targetLang = await getLangCodeFromInput(inputLangName);
        
    if (!targetLang) {
        currentElements.statusText.textContent = "Error: Please check language spelling.";
        currentElements.progressBar.style.width = '0%';
        await stopProcessingUI(elements); 
        currentElements.langStatusText.textContent = `Please check language spelling`; 
        currentElements.langStatusText.style.color = "#e50914";
        return;
    }
        
    if (isNetflix) {
        if (!url || !url.startsWith('http')) {
            currentElements.statusText.textContent = "Error: Invalid URL. Please paste a valid Netflix TTML URL.";
            currentElements.progressBar.style.width = '0%';
            await stopProcessingUI(elements); 
            currentElements.urlStatusText.textContent = "Invalid URL retrieved - please repeat URL retrieval steps";
            currentElements.urlStatusText.style.color = "#e50914";
            return;
        }
    } else {
        // MODIFICATION START: Use raw input box and detected language
        const rawTranscript = currentElements.youtubeTranscriptInput.value.trim();
        if (!rawTranscript) {
            currentElements.statusText.textContent = "Error: Transcript box is empty. Please paste the transcript.";
            currentElements.progressBar.style.width = '0%';
            await stopProcessingUI(elements); 
            currentElements.urlStatusText.textContent = "Transcript box is empty. Paste transcript above.";
            currentElements.urlStatusText.style.color = "#e50914";
            return;
        }
        
        // Retrieve the language detected during input check (or fallback to 'en')
        const data = await chrome.storage.local.get(['detected_youtube_base_lang_code']);
        const baseLangCode = data.detected_youtube_base_lang_code || 'en'; 
        
        // --- Store the raw text and base language for content.js to process ---
        await chrome.storage.local.set({ 
            'youtube_raw_transcript_data': rawTranscript,
            'youtube_base_lang_code': baseLangCode // Use the detected code
        });
        // MODIFICATION END
    }
        
    // 5. Save state and proceed
    await chrome.storage.local.remove(['ls_status']);
    await chrome.storage.local.set({
        last_input: { url, targetLang: targetLang, mode: mode },
        translated_only_pref: translatedOnly,
        subtitle_style_pref: selectedStyle,
    });
    // MODIFICATION: Remove temporary UI state keys including temp transcript data
    await chrome.storage.local.remove([isNetflix ? 'ui_temp_state_netflix' : 'ui_temp_state_youtube']); 
        
    
    currentElements.statusText.textContent = isNetflix ? "URL accepted. Initializing content script..." : "Transcript found. Initializing content script...";
    currentElements.progressBar.style.width = '10%';
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0] || !tabs[0].id) {
            currentElements.statusText.textContent = "FATAL ERROR: Could not find the active tab ID. Reload page.";
            console.error("[POPUP] Failed to retrieve active tab information.");
            currentElements.progressBar.style.width = '0%';
            stopProcessingUI(elements);
            return;
        }
        
        const currentTabId = tabs[0].id;
        console.log(`[POPUP] Target Tab ID: ${currentTabId}. Executing chrome.scripting.executeScript...`);
        
        const message = {
            command: "fetch_and_process_url",
            url: url, // Only used for Netflix
            targetLang: targetLang,
            translatedOnly: translatedOnly,
            fontSize: finalStylePrefs.font_size,
            backgroundColor: finalStylePrefs.background_color,
            backgroundAlpha: finalStylePrefs.background_alpha,
            fontShadow: finalStylePrefs.font_shadow,
            fontColor: finalStylePrefs.font_color,
            fontColorAlpha: finalStylePrefs.font_color_alpha,
            colourCoding: selectedStyle,
            mode: mode // New: Specify mode
        };
        
        chrome.scripting.executeScript({
            target: { tabId: currentTabId },
            files: ['content.js']
        }, () => {
            if (chrome.runtime.lastError) {
                currentElements.statusText.textContent = `FATAL ERROR: Script injection failed: ${chrome.runtime.lastError.message}.`;
                console.error("[POPUP] Scripting FAILED. Error:", chrome.runtime.lastError.message);
                currentElements.progressBar.style.width = '0%';
                stopProcessingUI(elements);
                return;
            }
            currentElements.statusText.textContent = "Content script injected. Sending start command...";
            chrome.tabs.sendMessage(currentTabId, message);
        });
    });
}

// --- MODIFICATION: Updated handleCancelClick for YouTube mode ---
async function handleCancelClick(elements) {
    const mode = elements.netflixContent.classList.contains('hidden-no-space') ? 'youtube' : 'netflix';
    const currentElements = mode === 'youtube' ? elements.youtubeCancelButton : elements.cancelButton;
    
    isCancelledByPopup = true;

    if (currentElements.textContent === "Clear Subtitles") {
        console.log("[POPUP] 'Clear Subtitles' clicked. Performing full reset.");
        await resetStatus(elements);
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
             if (tabs[0] && tabs[0].id) {
                 chrome.tabs.sendMessage(tabs[0].id, { command: "cancel_processing" }).catch(e => {
                    if (!e.message.includes('Receiving end does not exist')) console.error("[POPUP] Error sending final clear message:", e);
                });
             }
        });
        return;
    }

    if (currentElements.textContent === "Cancel Subtitle Generation") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0] || !tabs[0].id) {
                console.error("[POPUP] Cannot cancel: Active tab ID is unavailable.");
                return;
            }
            const currentTabId = tabs[0].id;
            chrome.scripting.executeScript({
                target: { tabId: currentTabId },
                files: ['content.js']
            }, () => {
                if (chrome.runtime.lastError) console.warn("[POPUP] Script injection before cancel failed:", chrome.runtime.lastError.message);
                chrome.tabs.sendMessage(currentTabId, { command: "cancel_processing" }).catch(e => {
                    if (!e.message.includes('Receiving end does not exist')) console.error("[POPUP] Error sending cancel message:", e);
                });
            });
        });
    }

    await stopProcessingUI(elements);
}


document.addEventListener('DOMContentLoaded', () => {
    // --- MODIFICATION START: Updated elements for YouTube ---
    const elements = {
        // Netflix Elements
        confirmButton: document.getElementById('confirmButton'),
        targetLanguageInput: document.getElementById('targetLanguage'),
        subtitleUrlInput: document.getElementById('subtitleUrlInput'),
        statusBox: document.getElementById('statusBox'),
        statusText: document.getElementById('statusText'),
        progressBar: document.getElementById('progressBar'),
        cancelButton: document.getElementById('cancelButton'),
        urlStatusText: document.getElementById('urlStatusText'),
        langStatusText: document.getElementById('langStatusText'),
        subtitleModeGroup: document.getElementById('subtitleModeGroup'),
        subtitleModeDual: document.getElementById('subtitleModeDual'),
        subtitleModeTranslatedOnly: document.getElementById('subtitleModeTranslatedOnly'),
        subtitleStyleGroup: document.getElementById('subtitleStyleGroup'),
        subtitleStyleNetflix: document.getElementById('subtitleStyleNetflix'),
        subtitleStyleCustom: document.getElementById('subtitleStyleCustom'),
        subtitleStyleVocabulary: document.getElementById('subtitleStyleVocabulary'),
        editStyleSettingsButton: document.getElementById('editStyleSettingsButton'),
        urlInstructions: document.getElementById('urlInstructions'),
        
        // UI Mode Elements
        title: document.getElementById('title'),
        netflixIcon: document.getElementById('netflix-icon'),
        youtubeIcon: document.getElementById('youtube-icon'),
        netflixContent: document.getElementById('netflix-content'),
        youtubeContent: document.getElementById('youtube-content'),
        
        // YouTube Elements (MODIFIED)
        youtubeTranscriptInput: document.getElementById('youtubeTranscriptInput'), // MODIFIED: New input field
        youtubeConfirmButton: document.getElementById('youtube-confirmButton'),
        youtubeTargetLanguage: document.getElementById('youtube-targetLanguage'),
        youtubeUrlStatusText: document.getElementById('youtube-urlStatusText'),
        youtubeLangStatusText: document.getElementById('youtube-langStatusText'),
        youtubeSubtitleModeGroup: document.getElementById('youtube-subtitleModeGroup'),
        youtubeSubtitleModeDual: document.getElementById('youtube-subtitleModeDual'),
        youtubeSubtitleModeTranslatedOnly: document.getElementById('youtube-subtitleModeTranslatedOnly'),
        youtubeSubtitleStyleGroup: document.getElementById('youtube-subtitleStyleGroup'),
        youtubeSubtitleStyleNetflix: document.getElementById('youtube-subtitleStyleNetflix'),
        youtubeSubtitleStyleCustom: document.getElementById('youtube-subtitleStyleCustom'),
        youtubeSubtitleStyleVocabulary: document.getElementById('youtube-subtitleStyleVocabulary'),
        youtubeEditStyleSettingsButton: document.getElementById('youtube-editStyleSettingsButton'),
        youtubeCancelButton: document.getElementById('youtube-cancelButton'),
        youtubeStatusBox: document.getElementById('youtube-statusBox'),
        youtubeStatusText: document.getElementById('youtube-statusText'),
        youtubeProgressBar: document.getElementById('youtube-progressBar'),
        youtubeUrlInstructions: document.getElementById('youtube-urlInstructions')
    };
    // --- MODIFICATION END ---
    
    let languageInputTimer;

    if (!elements.confirmButton || !elements.statusText || !elements.subtitleStyleGroup) {
        console.error("2. FATAL ERROR: Core DOM elements not found. Check main.html IDs.");
        return;
    }
    console.log("2. All DOM elements found. Attaching listeners.");

    // --- CRITICAL FIX: Force the taller setup size immediately after loading ---
    document.body.style.height = INITIAL_POPUP_HEIGHT; 
    
    loadSavedStatus(elements);
    
    // --- NETFLIX LISTENERS ---
    elements.confirmButton.addEventListener('click', () => handleConfirmClick(elements));
    elements.cancelButton.addEventListener('click', () => handleCancelClick(elements));
    
    elements.subtitleUrlInput.addEventListener('input', () => {
        checkUrlAndDetectLanguage(elements);
        saveCurrentInputs(elements);
    });

    elements.targetLanguageInput.addEventListener('input', () => {
        clearTimeout(languageInputTimer);
        languageInputTimer = setTimeout(() => {
            checkLanguagePairAvailability(elements);
            saveCurrentInputs(elements);
        }, 500);
    });
    
    // --- YOUTUBE LISTENERS (MODIFIED) ---
    elements.youtubeTranscriptInput.addEventListener('input', () => {
        checkYoutubeTranscriptInput(elements); // MODIFIED: Check new input instead of detecting
        saveCurrentInputs(elements);
    });
    elements.youtubeConfirmButton.addEventListener('click', () => handleConfirmClick(elements));
    elements.youtubeCancelButton.addEventListener('click', () => handleCancelClick(elements));
    
    elements.youtubeTargetLanguage.addEventListener('input', () => {
        clearTimeout(languageInputTimer);
        languageInputTimer = setTimeout(() => {
            checkYoutubeLanguagePairAvailability(elements);
            saveCurrentInputs(elements);
        }, 500);
    });

    // --- COMMON LISTENERS ---
    // Mode Group (Netflix)
    elements.subtitleModeGroup.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                chrome.storage.local.set({ 'translated_only_pref': (e.target.value === 'translated_only') });
            }
        });
    });
    
    // Mode Group (YouTube)
    elements.youtubeSubtitleModeGroup.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                chrome.storage.local.set({ 'translated_only_pref': (e.target.value === 'translated_only') });
            }
        });
    });
    
    // Style Group (Netflix)
    elements.subtitleStyleGroup.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                const selectedStyle = e.target.value;
                chrome.storage.local.set({ 'subtitle_style_pref': selectedStyle }, () => {
                    const hasSettings = ['netflix', 'custom', 'vocabulary'].includes(selectedStyle);
                    elements.editStyleSettingsButton.disabled = !hasSettings;
                    elements.editStyleSettingsButton.title = `Edit ${selectedStyle.charAt(0).toUpperCase() + selectedStyle.slice(1)} Settings`;
                });
            }
        });
    });
    
    // Style Group (YouTube)
    elements.youtubeSubtitleStyleGroup.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                const selectedStyle = e.target.value;
                chrome.storage.local.set({ 'subtitle_style_pref': selectedStyle }, () => {
                    const hasSettings = ['netflix', 'custom', 'vocabulary'].includes(selectedStyle);
                    elements.youtubeEditStyleSettingsButton.disabled = !hasSettings;
                    elements.youtubeEditStyleSettingsButton.title = `Edit ${selectedStyle.charAt(0).toUpperCase() + selectedStyle.slice(1)} Settings`;
                });
            }
        });
    });
    
    elements.editStyleSettingsButton.addEventListener('click', () => {
        const selectedStyle = document.querySelector('input[name="subtitleStyle"]:checked').value;
        openCustomSettingsWindow(selectedStyle);
    });
    
    elements.youtubeEditStyleSettingsButton.addEventListener('click', () => {
        const selectedStyle = document.querySelector('input[name="youtube-subtitleStyle"]:checked').value;
        openCustomSettingsWindow(selectedStyle);
    });

    // --- UI Mode Listeners ---
    elements.netflixIcon.addEventListener('click', () => {
        chrome.storage.local.set({ 'ui_mode': 'netflix' });
        updateUIMode('netflix', elements);
    });

    elements.youtubeIcon.addEventListener('click', () => {
        chrome.storage.local.set({ 'ui_mode': 'youtube' });
        updateUIMode('youtube', elements);
    });

    // --- Runtime Message Listener (Modified for YouTube Status) ---
    chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
        if (request.command === "update_status") {
            if (isCancelledByPopup) {
                console.log("Popup is in 'cancelled' state. Ignoring status update.");
                return;
            }
            
            const { progress, message, route } = request;
            const mode = request.mode || 'netflix';
            
            const currentElements = mode === 'youtube' ? {
                confirmButton: elements.youtubeConfirmButton,
                targetLanguageInput: elements.youtubeTargetLanguage,
                subtitleUrlInput: null,
                subtitleModeGroup: elements.youtubeSubtitleModeGroup,
                subtitleStyleGroup: elements.youtubeSubtitleStyleGroup,
                editStyleSettingsButton: elements.youtubeEditStyleSettingsButton,
                cancelButton: elements.youtubeCancelButton,
                statusBox: elements.youtubeStatusBox,
                statusText: elements.youtubeStatusText,
                progressBar: elements.youtubeProgressBar,
                urlStatusText: elements.youtubeUrlStatusText,
                youtubeTranscriptInput: elements.youtubeTranscriptInput, // MODIFIED
                langStatusText: elements.youtubeLangStatusText
            } : {
                confirmButton: elements.confirmButton,
                targetLanguageInput: elements.targetLanguageInput,
                subtitleUrlInput: elements.subtitleUrlInput,
                subtitleModeGroup: elements.subtitleModeGroup,
                subtitleStyleGroup: elements.subtitleStyleGroup,
                editStyleSettingsButton: elements.editStyleSettingsButton,
                cancelButton: elements.cancelButton,
                statusBox: elements.statusBox,
                statusText: elements.statusText,
                progressBar: elements.progressBar,
                urlStatusText: elements.urlStatusText,
                youtubeTranscriptInput: null, // MODIFIED
                langStatusText: elements.langStatusText
            };
            
            currentElements.statusBox.classList.remove('hidden-no-space');
            
            // Handle URL/Detection Errors (Route: 'url' used for both Netflix URL errors and YouTube detection errors)
            if (route === 'url' || progress === 0) {
                if (message.includes("Old subtitle URL used") || message.includes("Error fetching subtitles") || message.includes("Invalid URL retrieved") || message.includes("Error: Transcript not found") || message.includes("Transcript box is empty")) { // MODIFIED: Added check for empty box
                    currentElements.urlStatusText.textContent = message;
                    currentElements.urlStatusText.style.color = "#e50914";
                    currentElements.urlStatusText.classList.remove('hidden-no-space');
                }
            } 
            
            if (progress > 0 && progress < 100) {
                currentElements.statusText.textContent = message;
            } else if (progress === 0) {
                currentElements.statusText.textContent = message;
            }
            
            currentElements.progressBar.style.width = progress + '%';
            
            if (progress >= 100) {
                const popcornEmoji = "\u{1F37F}";
                const completionMessage = `Enjoy your show !${popcornEmoji}`;
                currentElements.statusText.textContent = completionMessage;

                const { ls_status } = await chrome.storage.local.get('ls_status');
                if (ls_status) {
                    ls_status.message = completionMessage;
                    await chrome.storage.local.set({ ls_status });
                }
                
                currentElements.targetLanguageInput.disabled = true;
                if (currentElements.subtitleUrlInput) currentElements.subtitleUrlInput.disabled = true;
                if (currentElements.youtubeTranscriptInput) currentElements.youtubeTranscriptInput.disabled = true; // MODIFIED
                currentElements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                currentElements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                currentElements.editStyleSettingsButton.disabled = true;
                
                currentElements.confirmButton.classList.add('hidden-no-space');
                currentElements.cancelButton.classList.remove('hidden-no-space');
                currentElements.cancelButton.textContent = "Clear Subtitles";
                
            } else if (progress > 0) {
                currentElements.confirmButton.classList.add('hidden-no-space');
                
                currentElements.targetLanguageInput.disabled = true;
                if (currentElements.subtitleUrlInput) currentElements.subtitleUrlInput.disabled = true;
                if (currentElements.youtubeTranscriptInput) currentElements.youtubeTranscriptInput.disabled = true; // MODIFIED
                currentElements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                currentElements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                currentElements.editStyleSettingsButton.disabled = true;
                currentElements.cancelButton.classList.remove('hidden-no-space');
                currentElements.cancelButton.textContent = "Cancel Subtitle Generation";
            } else {
                // Progress is 0 or less, re-enable buttons
                currentElements.confirmButton.disabled = false;
                
                if (mode === 'netflix') {
                    if (!currentElements.subtitleUrlInput.value.trim().startsWith('http')) {
                        currentElements.urlStatusText.textContent = "Waiting for URL...";
                        currentElements.urlStatusText.style.color = "#e50914";
                    }
                    checkLanguagePairAvailability(elements);
                } else {
                    // MODIFIED: Check transcript input status from storage
                    const { detected_youtube_base_lang_name } = await chrome.storage.local.get('detected_youtube_base_lang_name');
                    const transcriptText = currentElements.youtubeTranscriptInput.value.trim();
                    if (!transcriptText) {
                         currentElements.urlStatusText.textContent = "Paste transcript with timestamps above.";
                         currentElements.urlStatusText.style.color = "#e50914";
                    } else if (!detected_youtube_base_lang_name) {
                        currentElements.urlStatusText.textContent = "Detecting base language...";
                        currentElements.urlStatusText.style.color = "#e50914";
                    }
                    checkYoutubeLanguagePairAvailability(elements);
                }
                
                currentElements.targetLanguageInput.disabled = false;
                if (currentElements.subtitleUrlInput) currentElements.subtitleUrlInput.disabled = false;
                if (currentElements.youtubeTranscriptInput) currentElements.youtubeTranscriptInput.disabled = false; // MODIFIED
                
                currentElements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                currentElements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                currentElements.cancelButton.classList.add('hidden-no-space');
                currentElements.cancelButton.textContent = "Cancel Subtitle Generation";
                
                updateGenerateButtonState(elements);
            }
        }
    });
});