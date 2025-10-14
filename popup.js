console.log("1. popup.js script file loaded.");

// --- MODIFICATION START: Added CUSTOM_DEFAULTS for fallback values ---
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
// --- MODIFICATION END ---


const LANGUAGE_MAP = {
    "afar": "aa", "abkhazian": "ab", "avesta": "ae", "afrikaans": "af", "akan": "ak", "amharic": "am", "aragonese": "an", "arabic": "ar", "assamese": "as", "avaric": "av", "aymara": "ay", "azerbaijan": "az", "bashkir": "ba", "belarusian": "be", "bulgarian": "bg", "bihari languages": "bh", "bislama": "bi", "bambara": "bm", "bengali / bangla": "bn", "tibetan": "bo", "breton": "br", "bosnian": "bs", "catalan / valencian": "ca", "chechen": "ce", "chamorro": "ch", "corsican": "co", "cree": "cr", "czech": "cs", "church slavic / church slavonic / old bulgarian / old church slavonic / old slavonic": "cu", "chuvash": "cv", "welsh": "cy", "danish": "da", "german": "de", "dhivehi / divehi / maldivian": "dv", "dzongkha": "dz", "ewe": "ee", "modern greek (1453-)": "el", "english": "en", "esperanto": "eo", "spanish / castilian": "es", "estonian": "et", "basque": "eu", "persian": "fa", "fulah": "ff", "finnish": "fi", "fijian": "fj", "faroese": "fo", "french": "fr", "western frisian": "fy", "irish": "ga", "scottish gaelic / gaelic": "gd", "galician": "gl", "guarani": "gn", "gujarati": "gu", "manx": "gv", "hausa": "ha", "hebrew": "he", "hindi": "hi", "hiri motu": "ho", "croatian": "hr", "haitian / haitian creole": "ht", "hungarian": "hu", "armenian": "hy", "herero": "hz", "interlingua (international auxiliary language association)": "ia", "indonesian": "id", "interlingue / occidental": "ie", "igbo": "ig", "sichuan yi / nuosu": "ii", "inupiaq": "ik", "ido": "io", "icelandic": "is", "italian": "it", "inuktitut": "iu", "japanese": "ja", "javanese": "jv", "georgian": "ka", "kongo": "kg", "kikuyu / gikuyu": "ki", "kuanyama / kwanyama": "kj", "kazakh": "kk", "kalaallisut / greenlandic": "kl", "khmer / central khmer": "km", "kannada": "kn", "korean": "ko", "kanuri": "kr", "kashmiri": "ks", "kurdish": "ku", "komi": "kv", "cornish": "kw", "kirghiz / kyrgyz": "ky", "latin": "la", "luxembourgish / letzeburgesch": "lb", "ganda / luganda": "lg", "limburgan / limburger / limburgish": "li", "lingala": "ln", "lao": "lo", "lithuanian": "lt", "luba-katanga": "lu", "latvian": "lv", "malagasy": "mg", "marshallese": "mh", "maori": "mi", "macedonian": "mk", "malayalam": "ml", "mongolian": "mn", "marathi": "mr", "malay (macrolanguage)": "ms", "maltese": "mt", "burmese": "my", "nauru": "na", "norwegian bokmål": "nb", "north ndebele": "nd", "nepali (macrolanguage)": "ne", "ndonga": "ng", "dutch / flemish": "nl", "norwegian nynorsk": "nn", "norwegian": "no", "south ndebele": "nr", "navajo / navaho": "nv", "nyanja / chewa / chichewa": "ny", "occitan (post 1500)": "oc", "ojibwa": "oj", "oromo": "om", "oriya (macrolanguage) / odia (macrolanguage)": "or", "ossetian / ossetic": "os", "panjabi / punjabi": "pa", "pali": "pi", "polish": "pl", "pushto / pashto": "ps", "portuguese": "pt", "quechua": "qu", "romansh": "rm", "rundi": "rn", "romanian / moldavian / moldovan": "ro", "russian": "ru", "kinyarwanda": "rw", "sanskrit": "sa", "sardinian": "sc", "sindhi": "sd", "northern sami": "se", "sango": "sg", "sinhala / sinhalese": "si", "slovak": "sk", "slovenian": "sl", "samoan": "sm", "shona": "sn", "somali": "so", "albanian": "sq", "serbian": "sr", "swati": "ss", "southern sotho": "st", "sundanese": "su", "swedish": "sv", "swahili (macrolanguage)": "sw", "tamil": "ta", "telugu": "te", "tajik": "tg", "thai": "th", "tigrinya": "ti", "turkmen": "tk", "tagalog": "tl", "tswana": "tn", "tonga (tonga islands)": "to", "turkish": "tr", "tsonga": "ts", "tatar": "tt", "twi": "tw", "tahitian": "ty", "uighur / uyghur": "ug", "ukrainian": "uk", "urdu": "ur", "uzbek": "uz", "venda": "ve", "vietnamese": "vi", "volapük": "vo", "walloon": "wa", "wolof": "wo", "xhosa": "xh", "yiddish": "yi", "yoruba": "yo", "zhuang / chuang": "za", "chinese": "zh", "zulu": "zu"
};

let isCancelledByPopup = false;

function saveCurrentInputs(elements) {
    const currentState = {
        url: elements.subtitleUrlInput.value.trim(),
        targetLang: elements.targetLanguageInput.value.trim()
    };
    chrome.storage.local.set({ 'ui_temp_state': currentState });
}

async function resetStatus(elements) {
    await chrome.storage.local.remove([
        'ls_status',
        'last_input',
        'captured_subtitle_url',
        'detected_base_lang_name',
        'detected_base_lang_code',
        'ui_temp_state'
    ]);

    const netflixSettingsToSave = {};
    for (const key of PREF_KEYS) {
        netflixSettingsToSave[`netflix_${key}`] = NETFLIX_PRESET[key];
    }
    await chrome.storage.local.set(netflixSettingsToSave);

    if (!elements.confirmButton) return;

    elements.subtitleUrlInput.value = '';
    elements.targetLanguageInput.value = '';

    await chrome.storage.local.set({
        'translated_only_pref': false,
        'subtitle_style_pref': 'netflix'
    });

    elements.subtitleModeDual.checked = true;
    elements.subtitleStyleNetflix.checked = true;
    elements.editStyleSettingsButton.disabled = false;

    elements.confirmButton.disabled = true;
    elements.targetLanguageInput.disabled = false;
    elements.subtitleUrlInput.disabled = false;

    elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
    elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = false);

    elements.cancelButton.classList.add('hidden-no-space');
    elements.cancelButton.textContent = "Cancel Subtitle Generation";

    elements.statusBox.classList.add('hidden-no-space');
    elements.statusText.textContent = "";
    elements.progressBar.style.width = '0%';

    elements.urlStatusText.textContent = "Waiting for URL...";
    elements.urlStatusText.style.color = "#e50914";

    elements.urlStatusText.classList.remove('hidden-no-space');
    elements.langStatusText.classList.remove('hidden-no-space');

    console.log("Processing status reset completed. Fields cleared.");
    await checkLanguagePairAvailability(elements);
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

async function checkLanguagePairAvailability(elements) {
    const inputLang = elements.targetLanguageInput.value.trim().toLowerCase();
    if (inputLang === '') {
        elements.langStatusText.textContent = "Waiting for language...";
        elements.langStatusText.style.color = "#e50914";
        return;
    }

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

    if (!targetLangCode) {
        elements.langStatusText.textContent = "Please check language spelling.";
        elements.langStatusText.style.color = "#e50914";
        return;
    }

    const data = await chrome.storage.local.get(['detected_base_lang_code']);
    const baseLangCode = data.detected_base_lang_code;
    if (!baseLangCode) {
        elements.langStatusText.textContent = "Waiting for URL to check translation compatibility...";
        elements.langStatusText.style.color = "#777";
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
                    return;
                }
                
                const currentInputLang = elements.targetLanguageInput.value.trim().toLowerCase();
                let currentTargetLangCode = null;
                if(currentInputLang.length === 2) {
                    currentTargetLangCode = currentInputLang;
                } else if (currentInputLang.length > 2) {
                    currentTargetLangCode = LANGUAGE_MAP[currentInputLang] || (Object.keys(LANGUAGE_MAP).find(key => key.startsWith(currentInputLang)) ? LANGUAGE_MAP[Object.keys(LANGUAGE_MAP).find(key => key.startsWith(currentInputLang))] : null);
                }

                if (currentTargetLangCode === response.targetLang) {
                    if (response.isAvailable) {
                        elements.langStatusText.textContent = `Ready to translate to ${getLanguageName(response.targetLang)}!`;
                        elements.langStatusText.style.color = "green";
                    } else {
                        elements.langStatusText.textContent = "Language pair not yet available, please retry with different inputs.";
                        elements.langStatusText.style.color = "#e50914";
                    }
                }
            }).catch(e => {
                console.warn("Could not send language pair check message:", e);
                elements.langStatusText.textContent = "Cannot check: please reload the Netflix tab.";
                elements.langStatusText.style.color = "#e50914";
            });
        }
    } catch (e) {
        console.warn("Could not query tabs for language pair check:", e);
        elements.langStatusText.textContent = "Cannot check: please reload the Netflix tab.";
        elements.langStatusText.style.color = "#e50914";
    }
}

function checkUrlAndDetectLanguage(elements) {
    const url = elements.subtitleUrlInput.value.trim();
    const isUrlValid = (url && url.startsWith('http'));
    elements.confirmButton.disabled = !isUrlValid;

    if (isUrlValid) {
        chrome.storage.local.get(['detected_base_lang_name'], (data) => {
            if (!data.detected_base_lang_name) {
                elements.urlStatusText.textContent = `Detecting language...`;
                elements.urlStatusText.style.color = "#e50914";
            } else {
                elements.urlStatusText.textContent = `${data.detected_base_lang_name} subtitles ready to translate!`;
                elements.urlStatusText.style.color = "green";
            }
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
                    }
                }).catch(e => {
                   if (!e.message.includes('Receiving end does not exist')) {
                        console.warn("Could not send detection message, content script not ready:", e);
                    }
                });
            }
        });
    } else {
         elements.urlStatusText.textContent = "Waiting for URL...";
         elements.urlStatusText.style.color = "#e50914";
         chrome.storage.local.remove(['detected_base_lang_name', 'detected_base_lang_code']);
    }
    
    if (!elements.statusBox.classList.contains('hidden-no-space')) {
        elements.statusBox.classList.add('hidden-no-space');
        elements.statusText.textContent = "";
        elements.progressBar.style.width = '0%';
    }
}

function loadSavedStatus(elements) {
    console.log("3. Loading saved status from storage.");
    chrome.storage.local.get([
        'ls_status', 'last_input', 'translated_only_pref', 'subtitle_style_pref',
        'detected_base_lang_name', 'ui_temp_state'
    ], (data) => {
        const status = data.ls_status;
        const detectedBaseLangName = data.detected_base_lang_name;
        
        if (status && status.progress >= 100 && status.message && status.message.startsWith("Translation complete!")) {
            const popcornEmoji = "\u{1F37F}";
            status.message = `Enjoy your show !${popcornEmoji}`;
            chrome.storage.local.set({ 'ls_status': status });
        }
        
        elements.progressBar.style.width = '0%';
        elements.targetLanguageInput.disabled = false;
        elements.subtitleUrlInput.disabled = false;
        elements.cancelButton.classList.add('hidden-no-space');
        elements.cancelButton.textContent = "Cancel Subtitle Generation";
        elements.statusBox.classList.add('hidden-no-space');
        
        if (data.translated_only_pref === true) {
            elements.subtitleModeTranslatedOnly.checked = true;
        } else {
            elements.subtitleModeDual.checked = true;
        }
        
        const savedStyle = data.subtitle_style_pref || 'netflix';
        const styleElement = document.getElementById(`subtitleStyle${savedStyle.charAt(0).toUpperCase() + savedStyle.slice(1)}`);
        if (styleElement) styleElement.checked = true;

        const hasSettings = (savedStyle === 'netflix' || savedStyle === 'custom');
        elements.editStyleSettingsButton.disabled = !hasSettings;

        const isProcessing = status && status.progress > 0 && status.progress < 100;
        if (!isProcessing) {
            if (data.ui_temp_state) {
                elements.targetLanguageInput.value = data.ui_temp_state.targetLang || '';
                elements.subtitleUrlInput.value = data.ui_temp_state.url || '';
            } else if (data.last_input) {
                const fullLangName = Object.keys(LANGUAGE_MAP).find(key => LANGUAGE_MAP[key] === data.last_input.targetLang) || data.last_input.targetLang;
                elements.targetLanguageInput.value = (fullLangName.charAt(0).toUpperCase() + fullLangName.slice(1));
                elements.subtitleUrlInput.value = data.last_input.url || '';
            }
        } else if (data.last_input) {
            const fullLangName = Object.keys(LANGUAGE_MAP).find(key => LANGUAGE_MAP[key] === data.last_input.targetLang) || data.last_input.targetLang;
            elements.targetLanguageInput.value = (fullLangName.charAt(0).toUpperCase() + fullLangName.slice(1));
            elements.subtitleUrlInput.value = data.last_input.url || '';
        }

        let currentBaseLangName = null;
        if (status && status.baseLang) {
             currentBaseLangName = getLanguageName(status.baseLang);
        }

        if (status && status.progress > 0) {
            elements.statusBox.classList.remove('hidden-no-space');
            elements.statusText.textContent = status.message;
            elements.progressBar.style.width = status.progress + '%';
            elements.urlStatusText.classList.add('hidden-no-space');
            elements.langStatusText.classList.add('hidden-no-space');
            
            if (status.progress < 100) {
                elements.confirmButton.disabled = true;
                elements.targetLanguageInput.disabled = true;
                elements.subtitleUrlInput.disabled = true;
                elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                elements.editStyleSettingsButton.disabled = true;
                elements.cancelButton.classList.remove('hidden-no-space');
                elements.cancelButton.textContent = "Cancel Subtitle Generation";
            } else {
                const finalLangName = currentBaseLangName || detectedBaseLangName || "Subtitle";
                elements.urlStatusText.textContent = `${finalLangName} subtitles ready to translate!`;
                elements.urlStatusText.style.color = "green";
                elements.confirmButton.disabled = false;
                elements.targetLanguageInput.disabled = false;
                elements.subtitleUrlInput.disabled = false;
                elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                elements.editStyleSettingsButton.disabled = !hasSettings;
                elements.cancelButton.classList.remove('hidden-no-space');
                elements.cancelButton.textContent = "Clear Status & Reset";
                checkLanguagePairAvailability(elements);
            }
        } else {
             elements.urlStatusText.classList.remove('hidden-no-space');
             elements.langStatusText.classList.remove('hidden-no-space');
             checkLanguagePairAvailability(elements);
             const urlValue = elements.subtitleUrlInput.value.trim();
             if (urlValue && urlValue.startsWith('http')) {
                 checkUrlAndDetectLanguage(elements);
                 if (status && status.message && (status.message.includes("Old subtitle URL used") || status.message.includes("Error fetching subtitles") || status.message.includes("Invalid URL retrieved"))) {
                     elements.urlStatusText.textContent = status.message;
                     elements.urlStatusText.style.color = "#e50914";
                 }
             } else {
                 elements.urlStatusText.textContent = "Waiting for URL...";
                 elements.urlStatusText.style.color = "#e50914";
                 elements.confirmButton.disabled = true;
                 elements.subtitleUrlInput.value = '';
             }
             if (status && status.message && !status.message.includes("Old subtitle URL used") && !status.message.includes("Error fetching subtitles") && !status.message.includes("Invalid URL retrieved")) {
                elements.statusBox.classList.remove('hidden-no-space');
                elements.statusText.textContent = status.message;
             } else {
                elements.statusText.textContent = "";
             }
             elements.cancelButton.classList.add('hidden-no-space');
             elements.targetLanguageInput.disabled = false;
             elements.subtitleUrlInput.disabled = false;
             elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
             elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = false);
             elements.editStyleSettingsButton.disabled = !hasSettings;
        }
    });
}

async function handleConfirmClick(elements) {
    console.log("[POPUP] 'Generate Subtitles' button clicked. Starting process.");
    
    isCancelledByPopup = false;
    elements.statusBox.classList.remove('hidden-no-space');
    await chrome.storage.local.remove(['detected_base_lang_name', 'detected_base_lang_code']);

    const url = elements.subtitleUrlInput.value.trim();
    const inputLangName = elements.targetLanguageInput.value.trim().toLowerCase();
    
    const selectedSubtitleMode = document.querySelector('input[name="subtitleMode"]:checked').value;
    const translatedOnly = (selectedSubtitleMode === 'translated_only');
    const selectedStyle = document.querySelector('input[name="subtitleStyle"]:checked').value;
    
    // --- MODIFICATION START: Added default fallbacks to ensure settings are always applied ---
    let stylePrefix = 'custom_';
    let defaults = CUSTOM_DEFAULTS;
    if (selectedStyle === 'netflix') {
        stylePrefix = 'netflix_';
        defaults = NETFLIX_PRESET;
    }
    
    const keysToLoad = PREF_KEYS.map(key => `${stylePrefix}${key}`);
    const storedData = await chrome.storage.local.get(keysToLoad);
    
    const finalStylePrefs = {};
    for (const key of PREF_KEYS) {
        const storedKey = `${stylePrefix}${key}`;
        // Use the saved value, or fall back to the style's default if nothing is saved
        finalStylePrefs[key] = storedData[storedKey] ?? defaults[key];
    }
    // --- MODIFICATION END ---

    let targetLang = null;
    if (inputLangName.length === 2) {
        if (Object.values(LANGUAGE_MAP).includes(inputLangName)) targetLang = inputLangName;
    } else if (inputLangName.length > 2) {
        targetLang = LANGUAGE_MAP[inputLangName];
        if (!targetLang) {
            const matchingKey = Object.keys(LANGUAGE_MAP).find(key => key.startsWith(inputLangName));
            if (matchingKey) targetLang = LANGUAGE_MAP[matchingKey];
        }
    }
    
    if (!targetLang) {
         elements.langStatusText.textContent = `Please check language spelling`;
         elements.langStatusText.style.color = "#e50914";
         elements.statusText.textContent = "";
         elements.progressBar.style.width = '0%';
         elements.confirmButton.disabled = false;
         return;
    }
    
    elements.statusText.textContent = "Generating subtitles...";
    elements.urlStatusText.classList.add('hidden-no-space');
    elements.langStatusText.classList.add('hidden-no-space');
    elements.progressBar.style.width = '5%';
    
    if (!url || !url.startsWith('http')) {
        elements.urlStatusText.textContent = "Invalid URL retrieved - please repeat URL retrieval steps";
        elements.urlStatusText.style.color = "#e50914";
        elements.statusText.textContent = "Error: Invalid URL. Please paste a valid Netflix TTML URL.";
        elements.progressBar.style.width = '0%';
        elements.confirmButton.disabled = false;
        elements.urlStatusText.classList.remove('hidden-no-space');
        return;
    }

    await chrome.storage.local.remove(['ls_status']);
    await chrome.storage.local.set({
        last_input: { url, targetLang: targetLang },
        translated_only_pref: translatedOnly,
        subtitle_style_pref: selectedStyle,
    });
    await chrome.storage.local.remove(['ui_temp_state']);

    elements.statusText.textContent = "URL accepted. Initializing content script...";
    elements.progressBar.style.width = '10%';
    elements.confirmButton.disabled = true;
    elements.targetLanguageInput.disabled = true;
    elements.subtitleUrlInput.disabled = true;
    
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
        
        const message = {
            command: "fetch_and_process_url",
            url: url,
            targetLang: targetLang,
            translatedOnly: translatedOnly,
            fontSize: finalStylePrefs.font_size,
            backgroundColor: finalStylePrefs.background_color,
            backgroundAlpha: finalStylePrefs.background_alpha,
            fontShadow: finalStylePrefs.font_shadow,
            fontColor: finalStylePrefs.font_color,
            fontColorAlpha: finalStylePrefs.font_color_alpha,
            colourCoding: selectedStyle
        };

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
    });
}

async function handleCancelClick(elements) {
    isCancelledByPopup = true;
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
    await resetStatus(elements);
}

document.addEventListener('DOMContentLoaded', () => {
    const elements = {
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
        subtitleStyleGrammar: document.getElementById('subtitleStyleGrammar'),
        editStyleSettingsButton: document.getElementById('editStyleSettingsButton'),
    };
    
    let languageInputTimer;

    if (!elements.confirmButton || !elements.statusText || !elements.subtitleStyleGroup) {
        console.error("2. FATAL ERROR: Core DOM elements not found. Check main.html IDs.");
        return;
    }
    console.log("2. All DOM elements found. Attaching listeners.");
    
    loadSavedStatus(elements);

    elements.confirmButton.addEventListener('click', () => handleConfirmClick(elements));
    elements.cancelButton.addEventListener('click', () => handleCancelClick(elements));
    
    elements.subtitleModeGroup.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                chrome.storage.local.set({ 'translated_only_pref': (e.target.value === 'translated_only') });
            }
        });
    });
    
    elements.subtitleStyleGroup.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                const selectedStyle = e.target.value;
                chrome.storage.local.set({ 'subtitle_style_pref': selectedStyle }, () => {
                    const hasSettings = (selectedStyle === 'netflix' || selectedStyle === 'custom');
                    elements.editStyleSettingsButton.disabled = !hasSettings;
                    elements.editStyleSettingsButton.title = `Edit ${selectedStyle.charAt(0).toUpperCase() + selectedStyle.slice(1)} Settings`;
                });
            }
        });
    });
    
    elements.editStyleSettingsButton.addEventListener('click', () => {
        const selectedStyle = document.querySelector('input[name="subtitleStyle"]:checked').value;
        openCustomSettingsWindow(selectedStyle);
    });

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

    chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
        if (request.command === "update_status") {
            if (isCancelledByPopup) {
                console.log("Popup is in cancelled state. Ignoring status update.");
                return;
            }
            
            const { progress, message, route } = request;
            elements.statusBox.classList.remove('hidden-no-space');
            
            if (route === 'url' || progress === 0) {
                 if (message.includes("Old subtitle URL used") || message.includes("Error fetching subtitles") || message.includes("Invalid URL retrieved")) {
                     elements.urlStatusText.textContent = message;
                     elements.urlStatusText.style.color = "#e50914";
                     elements.statusText.textContent = "";
                     elements.urlStatusText.classList.remove('hidden-no-space');
                 }
            } 
            
            if (progress > 0 && progress < 100) {
                 elements.statusText.textContent = message;
                 elements.urlStatusText.classList.add('hidden-no-space');
                 elements.langStatusText.classList.add('hidden-no-space');
            } else if (progress === 0) {
                elements.statusText.textContent = message;
            }
            
            elements.progressBar.style.width = progress + '%';
            
            if (progress >= 100) {
                const popcornEmoji = "\u{1F37F}";
                const completionMessage = `Enjoy your show !${popcornEmoji}`;
                elements.statusText.textContent = completionMessage;

                const { ls_status } = await chrome.storage.local.get('ls_status');
                if (ls_status) {
                    ls_status.message = completionMessage;
                    await chrome.storage.local.set({ ls_status });
                }
                
                elements.confirmButton.disabled = false;
                elements.targetLanguageInput.disabled = false;
                elements.subtitleUrlInput.disabled = false;
                elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                
                chrome.storage.local.get(['subtitle_style_pref', 'ls_status', 'detected_base_lang_name'], async (data) => {
                    const savedStyle = data.subtitle_style_pref;
                    const hasSettings = (savedStyle === 'netflix' || savedStyle === 'custom');
                    elements.editStyleSettingsButton.disabled = !hasSettings;
                    
                    const baseLangCode = data.ls_status?.baseLang;
                    const detectedBaseLangName = data.detected_base_lang_name;
                    const finalLangName = (baseLangCode) ? getLanguageName(baseLangCode) : (detectedBaseLangName || "Subtitle");
                    elements.urlStatusText.textContent = `${finalLangName} subtitles ready to translate!`;
                    elements.urlStatusText.style.color = "green";
                    await checkLanguagePairAvailability(elements);
                    chrome.storage.local.remove(['detected_base_lang_name', 'detected_base_lang_code']);
                });
                elements.cancelButton.classList.remove('hidden-no-space');
                elements.cancelButton.textContent = "Clear Status & Reset";
            } else if (progress > 0) {
                elements.confirmButton.disabled = true;
                elements.targetLanguageInput.disabled = true;
                elements.subtitleUrlInput.disabled = true;
                elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                elements.editStyleSettingsButton.disabled = true;
                elements.cancelButton.classList.remove('hidden-no-space');
                elements.cancelButton.textContent = "Cancel Subtitle Generation";
            } else {
                const isUrlValid = (elements.subtitleUrlInput.value && elements.subtitleUrlInput.value.startsWith('http'));
                elements.confirmButton.disabled = !isUrlValid;
                if (!isUrlValid) {
                    elements.urlStatusText.textContent = "Waiting for URL...";
                    elements.urlStatusText.style.color = "#e50914";
                }
                elements.targetLanguageInput.disabled = false;
                elements.subtitleUrlInput.disabled = false;
                elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = false);
                elements.cancelButton.classList.add('hidden-no-space');
                elements.cancelButton.textContent = "Cancel Subtitle Generation";
                checkLanguagePairAvailability(elements);
            }
        }
    });
});