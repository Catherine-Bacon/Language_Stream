/* --- popup.js (ZMODYFIKOWANY) --- */
console.log("1. popup.js script file loaded.");

let isPopupInitialized = false;

// --- MODIFICATION: Define heights for all modes ---
const NETFLIX_SETUP_HEIGHT = '485px'; // Taller height for setup state (Netflix)
const YOUTUBE_SETUP_HEIGHT = '510px'; // NEW: Taller height for YouTube w/ transcript
const DISNEY_SETUP_HEIGHT = '450px'; // NEW: Height for Disney+
const PRIME_SETUP_HEIGHT = '510px'; // NEW: Height for Prime Video (File Upload)
const PROCESSING_POPUP_HEIGHT = '360px'; // Shorter height for processing state
// --- NEW: Offline Height ---
const OFFLINE_POPUP_HEIGHT = '485px';

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

let isCancelledByPopup = false;
let currentMode = 'netflix';
// --- NEW: Master Mode ---
let currentMasterMode = 'online';

function getModeColor() {
    switch (currentMode) {
        case 'youtube': return '#FF0000';
        case 'disney': return '#0d8199';
        case 'prime': return '#00A8E1';
        case 'netflix':
        default:
            return '#e50914';
    }
}

// --- MODIFIED: Load Saved Videos Implementation ---
async function loadSavedVideos(mode, elements) {
    console.log(`Loading saved videos for: ${mode}`);
    elements.savedVideosList.innerHTML = '<p>Loading saved subtitles...</p>'; // Show loading state

    try {
        const data = await chrome.storage.local.get('ls_offline_subtitles');
        const allSavedSubs = data.ls_offline_subtitles || {};
        const subsForThisService = allSavedSubs[mode] || [];

        if (subsForThisService.length === 0) {
            elements.savedVideosList.innerHTML = '<p>No saved subtitles found for this service.</p>';
            return;
        }

        elements.savedVideosList.innerHTML = ''; // Clear loading/previous content

        // Sort by timestamp descending (newest first)
        subsForThisService.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        subsForThisService.forEach(savedSub => {
            // --- MODIFICATION START: Create list item with delete button ---
            const listItem = document.createElement('div');
            listItem.className = 'saved-video-item';

            const itemText = document.createElement('span');
            itemText.title = 'Click to display (functionality not yet implemented)'; // Placeholder title

            // Build the label string
            const title = savedSub.title || 'Unknown Title';
            const baseLang = getLanguageName(savedSub.baseLang || '??');
            const targetLang = getLanguageName(savedSub.targetLang || '??');
            const modeText = savedSub.isTranslatedOnly ? 'Translated' : 'Dual';
            const styleText = (savedSub.style || 'N/A').charAt(0).toUpperCase() + (savedSub.style || 'N/A').slice(1);
            itemText.textContent = `${title} - ${baseLang} to ${targetLang} - ${modeText} - ${styleText}`;
            
            // TODO: Add click listener to itemText to handle displaying subtitles
            // itemText.addEventListener('click', () => { /* ... logic to display savedSub.subtitles ... */ });
            
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'X';
            deleteButton.className = 'delete-sub-btn';
            deleteButton.title = 'Delete this subtitle';
            
            // Add click listener for deletion
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent any parent click
                // Call the new delete function
                deleteSavedSubtitle(mode, savedSub.timestamp, elements);
            });

            listItem.appendChild(itemText);
            listItem.appendChild(deleteButton);
            elements.savedVideosList.appendChild(listItem);
            // --- MODIFICATION END ---
        });

    } catch (error) {
        console.error("Error loading saved subtitles:", error);
        elements.savedVideosList.innerHTML = '<p>Error loading saved subtitles.</p>';
    }
}
// --- END MODIFICATION ---

// --- MODIFICATION START: New function to delete saved subtitles ---
async function deleteSavedSubtitle(mode, timestamp, elements) {
    console.log(`Attempting to delete subtitle for ${mode} with timestamp: ${timestamp}`);
    try {
        const data = await chrome.storage.local.get('ls_offline_subtitles');
        const allSavedSubs = data.ls_offline_subtitles || {};

        if (!allSavedSubs[mode]) {
            console.warn("No subtitles found for this mode to delete from.");
            return;
        }

        const originalCount = allSavedSubs[mode].length;

        // Filter out the item with the matching timestamp
        allSavedSubs[mode] = allSavedSubs[mode].filter(sub => sub.timestamp !== timestamp);

        const newCount = allSavedSubs[mode].length;

        if (newCount === originalCount) {
            console.warn("Could not find subtitle with that timestamp to delete.");
        }

        // Save the modified object back
        await chrome.storage.local.set({ 'ls_offline_subtitles': allSavedSubs });
        console.log("Subtitle deleted. Refreshing list.");

        // Refresh the UI by reloading the list
        loadSavedVideos(mode, elements);

    } catch (error) {
        console.error("Error deleting subtitle:", error);
        elements.savedVideosList.innerHTML = '<p>Error occurred while deleting.</p>';
    }
}
// --- MODIFICATION END ---

// --- NEW: Master Mode Toggle Function ---
function updateMasterMode(masterMode, elements) {
    currentMasterMode = masterMode;
    chrome.storage.local.set({ 'ls_master_mode': masterMode });

    if (masterMode === 'offline') {
        elements.onlineModeButton.classList.remove('active');
        elements.offlineModeButton.classList.add('active');

        elements.onlineModeContainer.classList.add('hidden-no-space');
        elements.offlineModeContainer.classList.remove('hidden-no-space');

        // Hide processing UI if it was open
        elements.statusBox.classList.add('hidden-no-space');
        elements.cancelButton.classList.add('hidden-no-space');

        document.body.style.height = OFFLINE_POPUP_HEIGHT;

        // Update offline title based on current streaming mode
        updateUIMode(currentMode, elements); // This will call loadSavedVideos
        // Load the list of saved videos is now called within updateUIMode

    } else { // 'online'
        elements.onlineModeButton.classList.add('active');
        elements.offlineModeButton.classList.remove('active');

        elements.onlineModeContainer.classList.remove('hidden-no-space');
        elements.offlineModeContainer.classList.add('hidden-no-space');

        // Restore correct online UI state and height
        updateUIMode(currentMode, elements);
    }
}

function updateGenerateButtonState(elements) {
    const isInputValid = (currentMode === 'netflix' && elements.urlStatusText.style.color === 'green') ||
                         (currentMode === 'youtube' && elements.transcriptStatusText.style.color === 'green') ||
                         (currentMode === 'disney' && elements.disneyUrlStatusText.style.color === 'green') ||
                         (currentMode === 'prime' && elements.primeUrlStatusText.style.color === 'green');
    const isLangValid = elements.langStatusText.style.color === 'green';

    elements.confirmButton.disabled = !(isInputValid && isLangValid);
}

// --- MODIFIED: This function now handles both Online and Offline UI updates ---
function updateUIMode(mode, elements) {
    currentMode = mode;
    chrome.storage.local.set({ 'ls_mode': mode });

    const isProcessing = elements.statusBox.classList.contains('hidden-no-space') === false;

    // Deactivate all mode buttons
    elements.netflixModeButton.classList.remove('active');
    elements.youtubeModeButton.classList.remove('active');
    elements.disneyModeButton.classList.remove('active');
    elements.primeModeButton.classList.remove('active');

    // --- Logic for ONLINE mode ---
    if (currentMasterMode === 'online') {
        // Hide all input sections
        elements.netflixInputs.classList.add('hidden-no-space');
        elements.youtubeInputs.classList.add('hidden-no-space');
        elements.disneyInputs.classList.add('hidden-no-space');
        elements.primeInputs.classList.add('hidden-no-space');

        // Hide all input status texts
        elements.urlStatusText.classList.add('hidden-no-space');
        elements.transcriptStatusText.classList.add('hidden-no-space');
        elements.disneyUrlStatusText.classList.add('hidden-no-space');
        elements.primeUrlStatusText.classList.add('hidden-no-space');
    }

    // Set common headers
    elements.languageHeader.textContent = '2. Select Language';
    elements.preferencesHeader.textContent = '3. Select Subtitle Preferences';

    if (mode === 'netflix') {
        elements.titleHeader.textContent = 'Language Stream';
        elements.titleHeader.style.color = '#e50914';
        elements.netflixModeButton.classList.add('active');
        elements.offlineTitle.textContent = "Saved Netflix Subtitles";
        elements.offlineInstructionsText.innerHTML = `
            <p>For this mode you will have to download your video on a supported phone/tablet and lean it against your laptop to watch and read at the same time.</p>
            <p>Select the relevant pre-saved subtitles below > Press display</p>
        `;
        if (currentMasterMode === 'online') {
            elements.netflixInputs.classList.remove('hidden-no-space');
            elements.urlStatusText.classList.remove('hidden-no-space');
            elements.urlHeader.textContent = '1. Retrieve Subtitle URL';
            if (!isProcessing) {
                document.body.style.height = NETFLIX_SETUP_HEIGHT;
                checkUrlAndDetectLanguage(elements);
            }
        }

    } else if (mode === 'youtube') {
        elements.titleHeader.textContent = 'Language Stream';
        elements.titleHeader.style.color = '#FF0000';
        elements.youtubeModeButton.classList.add('active');
        elements.offlineTitle.textContent = "Saved YouTube Subtitles";
        elements.offlineInstructionsText.innerHTML = `
            <p>Navigate to your downloaded YouTube video on your laptop on youtube.com</p>
            <p>Select the relevant pre-saved subtitles below > Press display</p>
        `;
        if (currentMasterMode === 'online') {
            elements.youtubeInputs.classList.remove('hidden-no-space');
            elements.transcriptStatusText.classList.remove('hidden-no-space');
            elements.transcriptHeader.textContent = '1. Retrieve Transcript';
            if (!isProcessing) {
                document.body.style.height = YOUTUBE_SETUP_HEIGHT;
                checkTranscriptAndDetectLanguage(elements);
            }
        }
    } else if (mode === 'disney') {
        elements.titleHeader.textContent = 'Language Stream';
        elements.titleHeader.style.color = '#0d8199';
        elements.disneyModeButton.classList.add('active');
        elements.offlineTitle.textContent = "Saved Disney+ Subtitles";
        elements.offlineInstructionsText.innerHTML = `
            <p>For this mode you will have to download your video on a supported phone/tablet and lean it against your laptop to watch and read at the same time.</p>
            <p>Select the relevant pre-saved subtitles below > Press display</p>
        `;

        if (currentMasterMode === 'online') {
            elements.disneyInputs.classList.remove('hidden-no-space');
            elements.disneyUrlStatusText.classList.remove('hidden-no-space');
            elements.disneyHeader.textContent = '1. Retrieve Subtitle URL';
            if (!isProcessing) {
                document.body.style.height = DISNEY_SETUP_HEIGHT;
                checkDisneyUrlAndDetectLanguage(elements);
            }
        }
    } else if (mode === 'prime') {
        elements.titleHeader.textContent = 'Language Stream';
        elements.titleHeader.style.color = '#00A8E1';
        elements.primeModeButton.classList.add('active');
        elements.offlineTitle.textContent = "Saved Prime Video Subtitles";
        elements.offlineInstructionsText.innerHTML = `
            <p>For this mode you will have to download your video on a supported phone/tablet and lean it against your laptop to watch and read at the same time.</p>
            <p>Select the relevant pre-saved subtitles below > Press display</p>
        `;
        if (currentMasterMode === 'online') {
            elements.primeInputs.classList.remove('hidden-no-space');
            elements.primeUrlStatusText.classList.remove('hidden-no-space');
            elements.primeHeader.textContent = '1. Upload Subtitle File';
            if (!isProcessing) {
                document.body.style.height = PRIME_SETUP_HEIGHT;
                checkPrimeFileStatus(elements);
            }
        }
    }

    // Re-validate language and button state (only if online)
    if (currentMasterMode === 'online') {
        checkLanguagePairAvailability(elements);
        updateGenerateButtonState(elements);
    } else {
        // We are offline, load the saved videos for this new mode
        loadSavedVideos(mode, elements); // <-- Call loadSavedVideos here
    }
}


function saveCurrentInputs(elements) {
    const currentState = {
        url: elements.subtitleUrlInput.value.trim(),
        targetLang: elements.targetLanguageInput.value.trim(),
        youtubeTranscript: elements.youtubeTranscriptInput.value,
        disneyUrl: elements.disneyUrlInput.value.trim(),
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
        'ui_temp_state',
        'prime_file_content'
    ]);

    const netflixSettingsToSave = {};
    for (const key of PREF_KEYS) {
        netflixSettingsToSave[`netflix_${key}`] = NETFLIX_PRESET[key];
    }
    await chrome.storage.local.set(netflixSettingsToSave);

    if (!elements.confirmButton) return;

    // --- MODIFIED: Height check now respects master mode ---
    if (currentMasterMode === 'online') {
        let setupHeight;
        if (currentMode === 'netflix') setupHeight = NETFLIX_SETUP_HEIGHT;
        else if (currentMode === 'youtube') setupHeight = YOUTUBE_SETUP_HEIGHT;
        else if (currentMode === 'disney') setupHeight = DISNEY_SETUP_HEIGHT;
        else setupHeight = PRIME_SETUP_HEIGHT;
        document.body.style.height = setupHeight;
    }
    // --- END MODIFICATION ---

    elements.subtitleUrlInput.value = '';
    elements.youtubeTranscriptInput.value = '';
    elements.disneyUrlInput.value = '';
    elements.primeFileInput.value = '';
    elements.targetLanguageInput.value = '';

    await chrome.storage.local.set({
        'translated_only_pref': false,
        'subtitle_style_pref': 'netflix'
    });

    elements.subtitleModeDual.checked = true;
    elements.subtitleStyleNetflix.checked = true;
    elements.editStyleSettingsButton.disabled = false;
    elements.editStyleSettingsButton.title = `Edit Netflix Settings`;

    // --- NEW: Reset checkbox ---
    elements.saveForOfflineCheckbox.checked = false;

    elements.confirmButton.disabled = true;
    elements.targetLanguageInput.disabled = false;
    elements.subtitleUrlInput.disabled = false;
    elements.youtubeTranscriptInput.disabled = false;
    elements.disneyUrlInput.disabled = false;
    elements.primeUploadButton.disabled = false;
    elements.primeUploadButton.textContent = "Upload .ttml2 File";

    elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
    elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = false);

    elements.cancelButton.classList.add('hidden-no-space');
    elements.cancelButton.textContent = "Cancel Subtitle Generation";

    elements.statusBox.classList.add('hidden-no-space');
    elements.statusText.textContent = "";
    elements.progressBar.style.width = '0%';

    elements.urlStatusText.classList.add('hidden-no-space');
    elements.transcriptStatusText.classList.add('hidden-no-space');
    elements.disneyUrlStatusText.classList.add('hidden-no-space');
    elements.primeUrlStatusText.classList.add('hidden-no-space');

    if (currentMode === 'netflix') {
        elements.urlStatusText.textContent = "Waiting for URL...";
        elements.urlStatusText.style.color = "#e50914";
        elements.urlStatusText.classList.remove('hidden-no-space');
    } else if (currentMode === 'youtube') {
        elements.transcriptStatusText.textContent = "Waiting for transcript...";
        elements.transcriptStatusText.style.color = "#FF0000";
        elements.transcriptStatusText.classList.remove('hidden-no-space');
    } else if (currentMode === 'disney') {
        elements.disneyUrlStatusText.textContent = "Waiting for URL...";
        elements.disneyUrlStatusText.style.color = "#0d8199";
        elements.disneyUrlStatusText.classList.remove('hidden-no-space');
    } else if (currentMode === 'prime') {
        elements.primeUrlStatusText.textContent = "Waiting for file upload...";
        elements.primeUrlStatusText.style.color = "#00A8E1";
        elements.primeUrlStatusText.classList.remove('hidden-no-space');
    }

    elements.langStatusText.classList.remove('hidden-no-space');
    elements.langStatusText.textContent = "Waiting for language...";
    elements.langStatusText.style.color = getModeColor();

    console.log("Processing status reset completed. Fields cleared.");
    await checkLanguagePairAvailability(elements);
}

async function stopProcessingUI(elements) {
    // --- MODIFIED: Height check now respects master mode ---
    if (currentMasterMode === 'online') {
        let setupHeight;
        if (currentMode === 'netflix') setupHeight = NETFLIX_SETUP_HEIGHT;
        else if (currentMode === 'youtube') setupHeight = YOUTUBE_SETUP_HEIGHT;
        else if (currentMode === 'disney') setupHeight = DISNEY_SETUP_HEIGHT;
        else setupHeight = PRIME_SETUP_HEIGHT;
        document.body.style.height = setupHeight;
    }
    // --- END MODIFICATION ---

    elements.targetLanguageInput.disabled = false;
    elements.subtitleUrlInput.disabled = false;
    elements.youtubeTranscriptInput.disabled = false;
    elements.disneyUrlInput.disabled = false;
    elements.primeUploadButton.disabled = false;

    elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = false);
    elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = false);
    elements.saveForOfflineCheckbox.disabled = false; // --- NEW ---

    const selectedStyle = document.querySelector('input[name="subtitleStyle"]:checked').value;
    const hasSettings = ['netflix', 'custom', 'vocabulary'].includes(selectedStyle);
    elements.editStyleSettingsButton.disabled = !hasSettings;
    elements.editStyleSettingsButton.title = `Edit ${selectedStyle.charAt(0).toUpperCase() + selectedStyle.slice(1)} Settings`;

    elements.cancelButton.classList.add('hidden-no-space');
    elements.statusBox.classList.add('hidden-no-space');
    elements.statusText.textContent = "";
    elements.progressBar.style.width = '0%';

    elements.confirmButton.classList.remove('hidden-no-space');

    elements.netflixInputs.classList.add('hidden-no-space');
    elements.youtubeInputs.classList.add('hidden-no-space');
    elements.disneyInputs.classList.add('hidden-no-space');
    elements.primeInputs.classList.add('hidden-no-space');
    elements.urlStatusText.classList.add('hidden-no-space');
    elements.transcriptStatusText.classList.add('hidden-no-space');
    elements.disneyUrlStatusText.classList.add('hidden-no-space');
    elements.primeUrlStatusText.classList.add('hidden-no-space');

    if (currentMode === 'netflix') {
        elements.netflixInputs.classList.remove('hidden-no-space');
        elements.urlStatusText.classList.remove('hidden-no-space');
        checkUrlAndDetectLanguage(elements);
    } else if (currentMode === 'youtube') {
        elements.youtubeInputs.classList.remove('hidden-no-space');
        elements.transcriptStatusText.classList.remove('hidden-no-space');
        checkTranscriptAndDetectLanguage(elements);
    } else if (currentMode === 'disney') {
        elements.disneyInputs.classList.remove('hidden-no-space');
        elements.disneyUrlStatusText.classList.remove('hidden-no-space');
        checkDisneyUrlAndDetectLanguage(elements);
    } else if (currentMode === 'prime') {
        elements.primeInputs.classList.remove('hidden-no-space');
        elements.primeUrlStatusText.classList.remove('hidden-no-space');
        checkPrimeFileStatus(elements);
    }

    elements.langStatusText.classList.remove('hidden-no-space');
    checkLanguagePairAvailability(elements);
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
    // Check cache first
    if (getLanguageName.cache && getLanguageName.cache[langCode]) {
        return getLanguageName.cache[langCode];
    }
    // Build cache if it doesn't exist
    if (!getLanguageName.cache) {
        getLanguageName.cache = {};
        for (const key in LANGUAGE_MAP) {
            getLanguageName.cache[LANGUAGE_MAP[key]] = key.charAt(0).toUpperCase() + key.slice(1);
        }
    }
    // Look up and cache if needed
    const name = getLanguageName.cache[langCode] || langCode.toUpperCase();
    return name;
}


async function checkLanguagePairAvailability(elements) {
    // --- MODIFIED: Don't run this check if offline ---
    if (currentMasterMode === 'offline') return;
    // --- END MODIFICATION ---

    const inputLang = elements.targetLanguageInput.value.trim().toLowerCase();
    if (inputLang === '') {
        elements.langStatusText.textContent = "Waiting for language...";
        elements.langStatusText.style.color = getModeColor();
        updateGenerateButtonState(elements);
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
        elements.langStatusText.style.color = getModeColor();
        updateGenerateButtonState(elements);
        return;
    }

    const data = await chrome.storage.local.get(['detected_base_lang_code']);
    const baseLangCode = data.detected_base_lang_code;

    if (!baseLangCode) {
        let waitMessage;
        if (currentMode === 'netflix') waitMessage = "Waiting for URL...";
        else if (currentMode === 'youtube') waitMessage = "Waiting for transcript...";
        else if (currentMode === 'disney') waitMessage = "Waiting for Disney URL...";
        else waitMessage = "Waiting for Prime file...";

        elements.langStatusText.textContent = `${waitMessage} to check compatibility.`;
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
                    let tabType;
                    if (currentMode === 'netflix') tabType = 'Netflix';
                    else if (currentMode === 'youtube') tabType = 'YouTube';
                    else if (currentMode === 'disney') tabType = 'Disney+';
                    else tabType = 'Prime Video';

                    elements.langStatusText.textContent = `Cannot check: please reload the ${tabType} tab.`;
                    elements.langStatusText.style.color = getModeColor();
                    updateGenerateButtonState(elements);
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
                        elements.langStatusText.style.color = getModeColor();
                    }
                }
                updateGenerateButtonState(elements);
            }).catch(e => {
                console.warn("Could not send language pair check message:", e);
                let tabType;
                if (currentMode === 'netflix') tabType = 'Netflix';
                else if (currentMode === 'youtube') tabType = 'YouTube';
                else if (currentMode === 'disney') tabType = 'Disney+';
                else tabType = 'Prime Video';

                elements.langStatusText.textContent = `Cannot check: please reload the ${tabType} tab.`;
                elements.langStatusText.style.color = getModeColor();
                updateGenerateButtonState(elements);
            });
        }
    } catch (e) {
        console.warn("Could not query tabs for language pair check:", e);
        let tabType;
        if (currentMode === 'netflix') tabType = 'Netflix';
        else if (currentMode === 'youtube') tabType = 'YouTube';
        else if (currentMode === 'disney') tabType = 'Disney+';
        else tabType = 'Prime Video';

        elements.langStatusText.textContent = `Cannot check: please reload the ${tabType} tab.`;
        elements.langStatusText.style.color = getModeColor();
        updateGenerateButtonState(elements);
    }
}

async function checkPrimeFileStatus(elements) {
    if (currentMode !== 'prime' || currentMasterMode === 'offline') return;

    const data = await chrome.storage.local.get(['prime_file_content', 'detected_base_lang_name']);

    if (data.prime_file_content && data.detected_base_lang_name) {
        elements.primeUrlStatusText.textContent = `${data.detected_base_lang_name} file ready to translate!`;
        elements.primeUrlStatusText.style.color = "green";
        elements.primeUploadButton.textContent = "Clear Uploaded TTML";
    } else if (data.prime_file_content) {
        elements.primeUrlStatusText.textContent = "File uploaded. Detecting language...";
        elements.primeUrlStatusText.style.color = "#00A8E1";
        elements.primeUploadButton.textContent = "Clear Uploaded TTML";
        checkPrimeFileAndDetectLanguage(elements, data.prime_file_content);
    } else {
        elements.primeUrlStatusText.textContent = "Waiting for file upload...";
        elements.primeUrlStatusText.style.color = "#00A8E1";
        elements.primeUploadButton.textContent = "Upload .ttml2 File";
    }
    updateGenerateButtonState(elements);
}

async function checkPrimeFileAndDetectLanguage(elements, ttmlString) {
    if (currentMode !== 'prime' || currentMasterMode === 'offline') return;

    elements.primeUrlStatusText.textContent = `Detecting language...`;
    elements.primeUrlStatusText.style.color = "#00A8E1";

    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, {
                command: "detect_language_from_ttml",
                ttmlString: ttmlString
            }).then(async (response) => {
                if (chrome.runtime.lastError) {
                    console.warn("Detection error:", chrome.runtime.lastError.message);
                    elements.primeUrlStatusText.textContent = `Detection error. Reload tab.`;
                    elements.primeUrlStatusText.style.color = "#00A8E1";
                    await chrome.storage.local.remove(['detected_base_lang_name', 'detected_base_lang_code']);
                    updateGenerateButtonState(elements);
                    return;
                }

                if (response && currentMode === 'prime') {
                    if (response.baseLangCode) {
                        const baseLangName = getLanguageName(response.baseLangCode);
                        elements.primeUrlStatusText.textContent = `${baseLangName} file ready to translate!`;
                        elements.primeUrlStatusText.style.color = "green";
                        await chrome.storage.local.set({
                            'detected_base_lang_name': baseLangName,
                            'detected_base_lang_code': response.baseLangCode
                        });
                        checkLanguagePairAvailability(elements);
                    } else {
                        elements.primeUrlStatusText.textContent = `Language detection failed.`;
                        elements.primeUrlStatusText.style.color = "#00A8E1";
                        await chrome.storage.local.remove(['detected_base_lang_name', 'detected_base_lang_code']);
                    }
                    updateGenerateButtonState(elements);
                }
            }).catch(e => {
               if (!e.message.includes('Receiving end does not exist')) {
                    console.warn("Could not send detection message, content script not ready:", e);
               }
               elements.primeUrlStatusText.textContent = `Detection failed. Reload tab.`;
               elements.primeUrlStatusText.style.color = "#00A8E1";
               updateGenerateButtonState(elements);
            });
        }
    } catch (e) {
        console.warn("Could not query tabs for Prime detection:", e);
        elements.primeUrlStatusText.textContent = `Detection failed. Reload tab.`;
        elements.primeUrlStatusText.style.color = "#00A8E1";
        updateGenerateButtonState(elements);
    }
}

async function checkDisneyUrlAndDetectLanguage(elements) {
    if (currentMode !== 'disney' || currentMasterMode === 'offline') return;

    const url = elements.disneyUrlInput.value.trim();
    const urlLooksValid = (url && (url.startsWith('http') || url.startsWith('blob:')));

    if (urlLooksValid) {
        const data = await chrome.storage.local.get(['detected_base_lang_name']);

        if (!data.detected_base_lang_name) {
            elements.disneyUrlStatusText.textContent = `Detecting language...`;
            elements.disneyUrlStatusText.style.color = "#0d8199";
        } else {
            elements.disneyUrlStatusText.textContent = `${data.detected_base_lang_name} subtitles ready to translate!`;
            elements.disneyUrlStatusText.style.color = "green";
        }
        updateGenerateButtonState(elements);

        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    command: "detect_language_disney",
                    url: url
                }).then(async (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn("Detection error:", chrome.runtime.lastError.message);
                        return;
                    }
                    if (response && elements.disneyUrlInput.value.trim() === response.url) {
                        if (response.baseLangCode) {
                            const baseLangName = getLanguageName(response.baseLangCode);
                            elements.disneyUrlStatusText.textContent = `${baseLangName} subtitles ready to translate!`;
                            elements.disneyUrlStatusText.style.color = "green";
                            await chrome.storage.local.set({
                                'detected_base_lang_name': baseLangName,
                                'detected_base_lang_code': response.baseLangCode
                            });
                            checkLanguagePairAvailability(elements);
                        } else {
                            elements.disneyUrlStatusText.textContent = `Language detection failed.`;
                            elements.disneyUrlStatusText.style.color = "#0d8199";
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
        } catch (e) {
            console.warn("Could not query tabs for Disney detection:", e);
            updateGenerateButtonState(elements);
        }
    } else {
         elements.disneyUrlStatusText.textContent = "Waiting for URL...";
         elements.disneyUrlStatusText.style.color = "#0d8199";
         await chrome.storage.local.remove(['detected_base_lang_name', 'detected_base_lang_code']);
         updateGenerateButtonState(elements);
    }
}

async function checkTranscriptAndDetectLanguage(elements) {
    if (currentMode !== 'youtube' || currentMasterMode === 'offline') return;

    const transcript = elements.youtubeTranscriptInput.value.trim();

    if (transcript) {
        elements.transcriptStatusText.textContent = `Detecting language...`;
        elements.transcriptStatusText.style.color = "#FF0000";

        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

            if (tabs[0] && tabs[0].id) {
                const transcriptSnippet = transcript.substring(0, 1000);

                chrome.tabs.sendMessage(tabs[0].id, {
                    command: "detect_language_from_text",
                    text: transcriptSnippet
                }).then(async (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn("Detection error:", chrome.runtime.lastError.message);
                        elements.transcriptStatusText.textContent = `Language detection failed.`;
                        elements.transcriptStatusText.style.color = "#FF0000";
                        await chrome.storage.local.remove(['detected_base_lang_name', 'detected_base_lang_code']);
                        return;
                    }

                    if (response && elements.youtubeTranscriptInput.value.trim().startsWith(transcriptSnippet)) {
                        if (response.baseLangCode) {
                            const baseLangName = getLanguageName(response.baseLangCode);
                            elements.transcriptStatusText.textContent = `${baseLangName} transcript ready to translate!`;
                            elements.transcriptStatusText.style.color = "green";
                            await chrome.storage.local.set({
                                'detected_base_lang_name': baseLangName,
                                'detected_base_lang_code': response.baseLangCode
                            });
                            checkLanguagePairAvailability(elements);
                        } else {
                            elements.transcriptStatusText.textContent = `Language detection failed.`;
                            elements.transcriptStatusText.style.color = "#FF0000";
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
        } catch (e) {
            console.warn("Could not query tabs for YouTube detection:", e);
            updateGenerateButtonState(elements);
        }
    } else {
         elements.transcriptStatusText.textContent = "Waiting for transcript...";
         elements.transcriptStatusText.style.color = "#FF0000";
         await chrome.storage.local.remove(['detected_base_lang_name', 'detected_base_lang_code']);
         updateGenerateButtonState(elements);
    }
}

async function checkUrlAndDetectLanguage(elements) {
    if (currentMode !== 'netflix' || currentMasterMode === 'offline') return;

    const url = elements.subtitleUrlInput.value.trim();
    const urlLooksValid = (url && url.startsWith('http'));

    if (urlLooksValid) {
        const data = await chrome.storage.local.get(['detected_base_lang_name']);

        if (!data.detected_base_lang_name) {
            elements.urlStatusText.textContent = `Detecting language...`;
            elements.urlStatusText.style.color = "#e50914";
        } else {
            elements.urlStatusText.textContent = `${data.detected_base_lang_name} subtitles ready to translate!`;
            elements.urlStatusText.style.color = "green";
        }
        updateGenerateButtonState(elements);

        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

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
        } catch (e) {
            console.warn("Could not query tabs for Netflix detection:", e);
            updateGenerateButtonState(elements);
        }
    } else {
         elements.urlStatusText.textContent = "Waiting for URL...";
         elements.urlStatusText.style.color = "#e50914";
         await chrome.storage.local.remove(['detected_base_lang_name', 'detected_base_lang_code']);
         updateGenerateButtonState(elements);
    }

    if (!elements.statusBox.classList.contains('hidden-no-space')) {
        elements.statusBox.classList.add('hidden-no-space');
        elements.statusText.textContent = "";
        elements.progressBar.style.width = '0%';
    }
}

async function loadSavedStatus(elements) {
    console.log("3. Loading saved status from storage.");

    const data = await chrome.storage.local.get([
        'ls_status', 'last_input', 'translated_only_pref', 'subtitle_style_pref',
        'detected_base_lang_name', 'ui_temp_state', 'ls_mode',
        'ls_master_mode' // --- NEW: Load master mode ---
    ]);

    // --- NEW: Set master mode FIRST ---
    currentMasterMode = data.ls_master_mode || 'online';
    updateMasterMode(currentMasterMode, elements);
    // --- END NEW ---

    currentMode = data.ls_mode || 'netflix';
    // updateUIMode needs to be called AFTER master mode is set.
    // updateMasterMode calls updateUIMode, so we don't need to call it explicitly here anymore.
    // updateUIMode(currentMode, elements); // Set streaming mode second

    const status = data.ls_status;

    if (status && status.progress >= 100 && status.message && status.message.startsWith("Translation complete!")) {
        const popcornEmoji = "\u{1F37F}";
        status.message = `Enjoy your show !${popcornEmoji}`;
        chrome.storage.local.set({ 'ls_status': status });
    }

    // --- This UI logic only applies to ONLINE mode ---
    if (currentMasterMode === 'online') {
        elements.progressBar.style.width = '0%';
        elements.targetLanguageInput.disabled = false;
        elements.subtitleUrlInput.disabled = false;
        elements.youtubeTranscriptInput.disabled = false;
        elements.disneyUrlInput.disabled = false;
        elements.primeUploadButton.disabled = false;

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

        const hasSettings = ['netflix', 'custom', 'vocabulary'].includes(savedStyle);
        elements.editStyleSettingsButton.disabled = !hasSettings;
        elements.editStyleSettingsButton.title = `Edit ${savedStyle.charAt(0).toUpperCase() + savedStyle.slice(1)} Settings`;

        const isProcessing = status && status.progress > 0 && status.progress < 100;

        if (!isProcessing) {
            if (data.ui_temp_state) {
                elements.targetLanguageInput.value = data.ui_temp_state.targetLang || '';
                elements.subtitleUrlInput.value = data.ui_temp_state.url || '';
                elements.youtubeTranscriptInput.value = data.ui_temp_state.youtubeTranscript || '';
                elements.disneyUrlInput.value = data.ui_temp_state.disneyUrl || '';
            } else if (data.last_input) {
                const fullLangName = Object.keys(LANGUAGE_MAP).find(key => LANGUAGE_MAP[key] === data.last_input.targetLang) || data.last_input.targetLang;
                elements.targetLanguageInput.value = (fullLangName.charAt(0).toUpperCase() + fullLangName.slice(1));
                elements.subtitleUrlInput.value = data.last_input.url || '';
                elements.youtubeTranscriptInput.value = data.last_input.youtubeTranscript || '';
                elements.disneyUrlInput.value = data.last_input.disneyUrl || '';
            }
        } else if (data.last_input) {
            const fullLangName = Object.keys(LANGUAGE_MAP).find(key => LANGUAGE_MAP[key] === data.last_input.targetLang) || data.last_input.targetLang;
            elements.targetLanguageInput.value = (fullLangName.charAt(0).toUpperCase() + fullLangName.slice(1));
            elements.subtitleUrlInput.value = data.last_input.url || '';
            elements.youtubeTranscriptInput.value = data.last_input.youtubeTranscript || '';
            elements.disneyUrlInput.value = data.last_input.disneyUrl || '';
        }

        if (status && status.progress > 0) {
            // Processing/Complete State
            document.body.style.height = PROCESSING_POPUP_HEIGHT;

            elements.statusBox.classList.remove('hidden-no-space');
            elements.statusText.textContent = status.message;
            elements.progressBar.style.width = status.progress + '%';

            elements.onlineModeContainer.classList.add('hidden-no-space'); // Hide the whole container

            elements.targetLanguageInput.disabled = true;
            elements.subtitleUrlInput.disabled = true;
            elements.youtubeTranscriptInput.disabled = true;
            elements.disneyUrlInput.disabled = true;
            elements.primeUploadButton.disabled = true;
            elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = true);
            elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = true);
            elements.editStyleSettingsButton.disabled = true;
            elements.saveForOfflineCheckbox.disabled = true; // --- NEW ---

            elements.cancelButton.classList.remove('hidden-no-space');
            elements.cancelButton.textContent = (status.progress < 100) ? "Cancel Subtitle Generation" : "Clear Subtitles";

        } else {
                // Initial/Error State
                let setupHeight;
                if (currentMode === 'netflix') setupHeight = NETFLIX_SETUP_HEIGHT;
                else if (currentMode === 'youtube') setupHeight = YOUTUBE_SETUP_HEIGHT;
                else if (currentMode === 'disney') setupHeight = DISNEY_SETUP_HEIGHT;
                else setupHeight = PRIME_SETUP_HEIGHT;
                document.body.style.height = setupHeight;

                elements.langStatusText.classList.remove('hidden-no-space');

                if (currentMode === 'netflix') {
                elements.urlStatusText.classList.remove('hidden-no-space');
                checkUrlAndDetectLanguage(elements);
                if (status && status.message && (status.message.includes("Old subtitle URL used") || status.message.includes("Error fetching subtitles") || status.message.includes("Invalid URL retrieved"))) {
                    elements.urlStatusText.textContent = status.message;
                    elements.urlStatusText.style.color = "#e50914";
                }
                } else if (currentMode === 'youtube') {
                elements.transcriptStatusText.classList.remove('hidden-no-space');
                checkTranscriptAndDetectLanguage(elements);
                } else if (currentMode === 'disney') {
                elements.disneyUrlStatusText.classList.remove('hidden-no-space');
                checkDisneyUrlAndDetectLanguage(elements);
                } else if (currentMode === 'prime') {
                elements.primeUrlStatusText.classList.remove('hidden-no-space');
                checkPrimeFileStatus(elements);
                }

                if (status && status.message && !status.message.includes("Old subtitle URL used") && !status.message.includes("Error fetching subtitles") && !status.message.includes("Invalid URL retrieved")) {
                elements.statusBox.classList.remove('hidden-no-space');
                elements.statusText.textContent = status.message;
                } else {
                elements.statusText.textContent = "";
                }

                checkLanguagePairAvailability(elements);
                updateGenerateButtonState(elements);
        }
    }
    // --- END Online-only logic ---

    isPopupInitialized = true;
    console.log("4. Popup initialization complete.");
}

async function handleConfirmClick(elements) {
    console.log(`[POPUP] 'Generate Subtitles' button clicked for mode: ${currentMode}.`);

    document.body.style.height = PROCESSING_POPUP_HEIGHT;

    // Hide setup UI
    elements.onlineModeContainer.classList.add('hidden-no-space'); // NEW: Hide main container

    isCancelledByPopup = false;
    elements.statusBox.classList.remove('hidden-no-space');
    elements.cancelButton.classList.remove('hidden-no-space');
    elements.cancelButton.textContent = "Cancel Subtitle Generation";

    elements.statusText.textContent = "Generating subtitles...";
    elements.progressBar.style.width = '5%';

    // Disable inputs
    elements.targetLanguageInput.disabled = true;
    elements.subtitleUrlInput.disabled = true;
    elements.youtubeTranscriptInput.disabled = true;
    elements.disneyUrlInput.disabled = true;
    elements.primeUploadButton.disabled = true;
    elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = true);
    elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = true);
    elements.editStyleSettingsButton.disabled = true;
    elements.saveForOfflineCheckbox.disabled = true; // --- NEW ---

    await chrome.storage.local.remove(['detected_base_lang_name', 'detected_base_lang_code']);

    const url = elements.subtitleUrlInput.value.trim();
    const transcript = elements.youtubeTranscriptInput.value.trim();
    const disneyUrl = elements.disneyUrlInput.value.trim();
    let primeTtmlString = null;

    if (currentMode === 'prime') {
        const data = await chrome.storage.local.get('prime_file_content');
        primeTtmlString = data.prime_file_content;
        if (!primeTtmlString) {
            elements.statusText.textContent = "Error: No Prime Video file uploaded.";
            elements.progressBar.style.width = '0%';
            await stopProcessingUI(elements);
            elements.primeUrlStatusText.textContent = "Error: No file uploaded.";
            elements.primeUrlStatusText.style.color = "#00A8E1";
            return;
        }
    }

    const inputLangName = elements.targetLanguageInput.value.trim().toLowerCase();

    const selectedSubtitleMode = document.querySelector('input[name="subtitleMode"]:checked').value;
    const translatedOnly = (selectedSubtitleMode === 'translated_only');
    const selectedStyle = document.querySelector('input[name="subtitleStyle"]:checked').value;
    const saveOffline = elements.saveForOfflineCheckbox.checked; // --- NEW: Get checkbox state ---

    const defaults = (selectedStyle === 'netflix' || selectedStyle === 'vocabulary') ? NETFLIX_PRESET : CUSTOM_DEFAULTS;
    const stylePrefix = `${selectedStyle}_`;
    const keysToLoad = PREF_KEYS.map(key => `${stylePrefix}${key}`);
    const storedData = await chrome.storage.local.get(keysToLoad);

    const finalStylePrefs = {};
    for (const key of PREF_KEYS) {
        const storedKey = `${stylePrefix}${key}`;
        finalStylePrefs[key] = storedData[storedKey] ?? defaults[key];
    }

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
        elements.statusText.textContent = "Error: Please check language spelling.";
        elements.progressBar.style.width = '0%';
        await stopProcessingUI(elements);
        elements.langStatusText.textContent = `Please check language spelling`;
        elements.langStatusText.style.color = getModeColor();
        return;
    }

    if (currentMode === 'netflix' && (!url || !url.startsWith('http'))) {
        elements.statusText.textContent = "Error: Invalid URL. Please paste a valid Netflix TTML URL.";
        elements.progressBar.style.width = '0%';
        await stopProcessingUI(elements);
        elements.urlStatusText.textContent = "Invalid URL retrieved - please repeat URL retrieval steps";
        elements.urlStatusText.style.color = "#e50914";
        return;
    }

    if (currentMode === 'youtube' && !transcript) {
        elements.statusText.textContent = "Error: Transcript is empty. Please paste the transcript.";
        elements.progressBar.style.width = '0%';
        await stopProcessingUI(elements);
        elements.transcriptStatusText.textContent = "Transcript is empty. Please paste the transcript.";
        elements.transcriptStatusText.style.color = "#FF0000";
        return;
    }

    if (currentMode === 'disney' && (!disneyUrl || !(disneyUrl.startsWith('http') || disneyUrl.startsWith('blob:')))) {
        elements.statusText.textContent = "Error: Invalid URL. Please paste a valid Disney+ URL.";
        elements.progressBar.style.width = '0%';
        await stopProcessingUI(elements);
        elements.disneyUrlStatusText.textContent = "Invalid Disney+ URL.";
        elements.disneyUrlStatusText.style.color = "#0d8199";
        return;
    }

    await chrome.storage.local.remove(['ls_status']);
    await chrome.storage.local.set({
        last_input: { url, targetLang: targetLang, youtubeTranscript: transcript, disneyUrl: disneyUrl, primeFileContent: primeTtmlString },
        translated_only_pref: translatedOnly,
        subtitle_style_pref: selectedStyle,
    });
    await chrome.storage.local.remove(['ui_temp_state']);

    elements.statusText.textContent = "Input accepted. Initializing content script...";
    elements.progressBar.style.width = '10%';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0] || !tabs[0].id) {
            elements.statusText.textContent = "FATAL ERROR: Could not find the active tab ID. Reload page.";
            console.error("[POPUP] Failed to retrieve active tab information.");
            elements.progressBar.style.width = '0%';
            stopProcessingUI(elements);
            return;
        }

        const currentTabId = tabs[0].id;
        console.log(`[POPUP] Target Tab ID: ${currentTabId}. Executing chrome.scripting.executeScript...`);

        let message;
        if (currentMode === 'netflix') {
            message = {
                command: "fetch_and_process_url",
                url: url,
                targetLang: targetLang,
                translatedOnly: translatedOnly,
                saveOffline: saveOffline, // --- NEW ---
                ...finalStylePrefs,
                colourCoding: selectedStyle
            };
        } else if (currentMode === 'youtube') {
            message = {
                command: "process_youtube_subtitles",
                transcript: transcript,
                targetLang: targetLang,
                translatedOnly: translatedOnly,
                saveOffline: saveOffline, // --- NEW ---
                ...finalStylePrefs,
                colourCoding: selectedStyle
            };
            console.log("[POPUP] Sending 'process_youtube_subtitles' command with transcript.");
        } else if (currentMode === 'disney') {
            message = {
                command: "process_disney_url",
                url: disneyUrl,
                targetLang: targetLang,
                translatedOnly: translatedOnly,
                saveOffline: saveOffline, // --- NEW ---
                ...finalStylePrefs,
                colourCoding: selectedStyle
            };
            console.log("[POPUP] Sending 'process_disney_url' command.");
        } else if (currentMode === 'prime') {
             message = {
                command: "process_prime_file",
                ttmlString: primeTtmlString,
                targetLang: targetLang,
                translatedOnly: translatedOnly,
                saveOffline: saveOffline, // --- NEW ---
                ...finalStylePrefs,
                colourCoding: selectedStyle
            };
            console.log("[POPUP] Sending 'process_prime_file' command.");
        }

        chrome.scripting.executeScript({
            target: { tabId: currentTabId },
            files: ['content.js']
        }, () => {
            if (chrome.runtime.lastError) {
                elements.statusText.textContent = `FATAL ERROR: Script injection failed: ${chrome.runtime.lastError.message}.`;
                console.error("[POPUP] Scripting FAILED. Error:", chrome.runtime.lastError.message);
                elements.progressBar.style.width = '0%';
                stopProcessingUI(elements);
                return;
            }
            elements.statusText.textContent = "Content script injected. Sending start command...";
            chrome.tabs.sendMessage(currentTabId, message, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn("[POPUP] Error sending message (might be ok if script is just injecting):", chrome.runtime.lastError.message);
                }
            });
        });
    });
}

async function handleCancelClick(elements) {
    isCancelledByPopup = true;

    if (elements.cancelButton.textContent === "Clear Subtitles") {
        console.log("[POPUP] 'Clear Subtitles' clicked. Performing full reset.");
        await resetStatus(elements);

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, { command: "cancel_processing" }).catch(e => {
                    if (!e.message.includes('Receiving end does not exist')) console.error("[POPUP] Error sending final clear message:", e);
                });
            }
        });
        // --- NEW: Make sure we're in online mode after clearing ---
        updateMasterMode('online', elements);
        return;
    }

    if (elements.cancelButton.textContent === "Cancel Subtitle Generation") {
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


document.addEventListener('DOMContentLoaded', async () => {
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
        editStyleSettingsButton: document.getElementById('editStyleSettingsButton'),
        urlInstructions: document.getElementById('urlInstructions'),
        // Mode switcher elements
        titleHeader: document.getElementById('titleHeader'),
        netflixModeButton: document.getElementById('netflixModeButton'),
        youtubeModeButton: document.getElementById('youtubeModeButton'),
        disneyModeButton: document.getElementById('disneyModeButton'),
        primeModeButton: document.getElementById('primeModeButton'),
        // Section headers
        urlHeader: document.getElementById('urlHeader'),
        languageHeader: document.getElementById('languageHeader'),
        preferencesHeader: document.getElementById('preferencesHeader'),
        // Netflix inputs
        netflixInputs: document.getElementById('netflixInputs'),
        // YouTube inputs
        youtubeInputs: document.getElementById('youtubeInputs'),
        transcriptHeader: document.getElementById('transcriptHeader'),
        transcriptInstructions: document.getElementById('transcriptInstructions'),
        youtubeTranscriptInput: document.getElementById('youtubeTranscriptInput'),
        transcriptStatusText: document.getElementById('transcriptStatusText'),
        // Disney+ inputs
        disneyInputs: document.getElementById('disneyInputs'),
        disneyHeader: document.getElementById('disneyHeader'),
        disneyInstructions: document.getElementById('disneyInstructions'),
        disneyUrlInput: document.getElementById('disneyUrlInput'),
        disneyUrlStatusText: document.getElementById('disneyUrlStatusText'),
        // Prime Video inputs
        primeInputs: document.getElementById('primeInputs'),
        primeHeader: document.getElementById('primeHeader'),
        primeInstructions: document.getElementById('primeInstructions'),
        primeFileInput: document.getElementById('primeFileInput'),
        primeUploadButton: document.getElementById('primeUploadButton'),
        primeUrlStatusText: document.getElementById('primeUrlStatusText'),
        // --- NEW: Master Mode Elements ---
        onlineModeButton: document.getElementById('onlineModeButton'),
        offlineModeButton: document.getElementById('offlineModeButton'),
        onlineModeContainer: document.getElementById('online-mode-container'),
        offlineModeContainer: document.getElementById('offline-mode-container'),
        offlineTitle: document.getElementById('offline-title'),
        savedVideosList: document.getElementById('saved-videos-list'),
        offlineInstructionsText: document.getElementById('offlineInstructionsText'),
        displayOfflineSubtitlesButton: document.getElementById('displayOfflineSubtitlesButton'),
        // --- MODIFICATION: Add new checkbox ---
        saveForOfflineCheckbox: document.getElementById('saveForOfflineCheckbox')
    };

    let languageInputTimer;
    let transcriptInputTimer;
    let disneyUrlInputTimer;

    if (!elements.confirmButton || !elements.statusText || !elements.subtitleStyleGroup) {
        console.error("2. FATAL ERROR: Core DOM elements not found. Check main.html IDs.");
        return;
    }
    console.log("2. All DOM elements found. Attaching listeners.");

    await loadSavedStatus(elements); // Load status *first* and wait for it

    // --- NEW: Master Mode Listeners ---
    elements.onlineModeButton.addEventListener('click', () => updateMasterMode('online', elements));
    elements.offlineModeButton.addEventListener('click', () => updateMasterMode('offline', elements));
    // --- END NEW ---

    elements.netflixModeButton.addEventListener('click', () => updateUIMode('netflix', elements));
    elements.youtubeModeButton.addEventListener('click', () => updateUIMode('youtube', elements));
    elements.disneyModeButton.addEventListener('click', () => updateUIMode('disney', elements));
    elements.primeModeButton.addEventListener('click', () => updateUIMode('prime', elements));

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
                    const hasSettings = ['netflix', 'custom', 'vocabulary'].includes(selectedStyle);
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

    // Netflix URL input listener
    elements.subtitleUrlInput.addEventListener('input', () => {
        checkUrlAndDetectLanguage(elements);
        saveCurrentInputs(elements);
    });

    // YouTube transcript input listener
    elements.youtubeTranscriptInput.addEventListener('input', () => {
        clearTimeout(transcriptInputTimer);
        transcriptInputTimer = setTimeout(() => {
            checkTranscriptAndDetectLanguage(elements);
            saveCurrentInputs(elements);
        }, 500);
    });

    // Disney+ URL input listener
    elements.disneyUrlInput.addEventListener('input', () => {
        clearTimeout(disneyUrlInputTimer);
        disneyUrlInputTimer = setTimeout(() => {
            checkDisneyUrlAndDetectLanguage(elements);
            saveCurrentInputs(elements);
        }, 500);
    });

    // Prime Video File Input Listeners
    elements.primeUploadButton.addEventListener('click', () => {
        if (elements.primeUploadButton.textContent === "Clear Uploaded TTML") {
            chrome.storage.local.remove([
                'prime_file_content',
                'detected_base_lang_name',
                'detected_base_lang_code'
            ], () => {
                elements.primeFileInput.value = '';
                elements.primeUrlStatusText.textContent = "Waiting for file upload...";
                elements.primeUrlStatusText.style.color = "#00A8E1";
                elements.primeUploadButton.textContent = "Upload .ttml2 File";
                updateGenerateButtonState(elements);
                checkLanguagePairAvailability(elements);
                console.log("Prime file content cleared.");
            });
        } else {
            elements.primeFileInput.click();
        }
    });

    elements.primeFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            const ttmlString = event.target.result;
            if (!ttmlString) {
                elements.primeUrlStatusText.textContent = "Error: Could not read file.";
                elements.primeUrlStatusText.style.color = "#00A8E1";
                return;
            }
            chrome.storage.local.set({ 'prime_file_content': ttmlString }, () => {
                elements.primeUploadButton.textContent = "Clear Uploaded TTML";
                checkPrimeFileAndDetectLanguage(elements, ttmlString);
                saveCurrentInputs(elements);
            });
        };
        reader.onerror = () => {
            elements.primeUrlStatusText.textContent = "Error: File read failed.";
            elements.primeUrlStatusText.style.color = "#00A8E1";
        };
        reader.readAsText(file);
    });

    // Target language input listener
    elements.targetLanguageInput.addEventListener('input', () => {
        clearTimeout(languageInputTimer);
        languageInputTimer = setTimeout(() => {
            checkLanguagePairAvailability(elements);
            saveCurrentInputs(elements);
        }, 500);
    });

    chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
        if (!isPopupInitialized) {
            console.log("Popup not initialized, ignoring message:", request.command);
            return;
        }

        if (request.command === "update_status") {
            // --- NEW: If we get a status update, force switch to online mode ---
            if (currentMasterMode === 'offline') {
                updateMasterMode('online', elements);
            }
            // --- END NEW ---

            if (isCancelledByPopup) {
                console.log("Popup is in cancelled state. Ignoring status update.");
                return;
            }

            document.body.style.height = PROCESSING_POPUP_HEIGHT;

            const { progress, message, route } = request;
            elements.statusBox.classList.remove('hidden-no-space');

            if (route === 'url' || progress === 0) {
                if (currentMode === 'netflix' && (message.includes("Old subtitle URL used") || message.includes("Error fetching subtitles") || message.includes("Invalid URL retrieved"))) {
                    elements.urlStatusText.textContent = message;
                    elements.urlStatusText.style.color = "#e50914";
                    elements.urlStatusText.classList.remove('hidden-no-space');
                }
                if (currentMode === 'youtube' && (message.includes("Invalid transcript") || message.includes("Transcript parsing failed"))) {
                    elements.transcriptStatusText.textContent = message;
                    elements.transcriptStatusText.style.color = "#FF0000";
                    elements.transcriptStatusText.classList.remove('hidden-no-space');
                }
                if (currentMode === 'disney' && (message.includes("Disney+") || message.includes("Invalid Disney URL") || message.includes("Error fetching Disney+ subtitles"))) {
                    elements.disneyUrlStatusText.textContent = message;
                    elements.disneyUrlStatusText.style.color = "#0d8199";
                    elements.disneyUrlStatusText.classList.remove('hidden-no-space');
                }
                if (currentMode === 'prime' && (message.includes("Prime Video") || message.includes("Invalid Prime") || message.includes("Error fetching Prime Video subtitles") || message.includes("prime_file_upload"))) {
                    elements.primeUrlStatusText.textContent = message.replace("prime_file_upload", "file");
                    elements.primeUrlStatusText.style.color = "#00A8E1";
                    elements.primeUrlStatusText.classList.remove('hidden-no-space');
                }
            }

            if (progress > 0 && progress < 100) {
                elements.statusText.textContent = message;
            } else if (progress === 0) {
                elements.statusText.textContent = message;
            }

            elements.progressBar.style.width = progress + '%';

            if (progress >= 100) {
                const popcornEmoji = "\u{1F37F}";
                let completionMessage = `Enjoy your show !${popcornEmoji}`;
                // --- NEW: Append saved message ---
                if (elements.saveForOfflineCheckbox.checked) {
                    completionMessage += " Subtitles saved for offline use.";
                }
                // --- END NEW ---
                elements.statusText.textContent = completionMessage;


                const { ls_status } = await chrome.storage.local.get('ls_status');
                if (ls_status) {
                    ls_status.message = completionMessage; // Use the potentially modified message
                    await chrome.storage.local.set({ ls_status });
                }

                elements.targetLanguageInput.disabled = true;
                elements.subtitleUrlInput.disabled = true;
                elements.youtubeTranscriptInput.disabled = true;
                elements.disneyUrlInput.disabled = true;
                elements.primeUploadButton.disabled = true;

                elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                elements.editStyleSettingsButton.disabled = true;
                elements.saveForOfflineCheckbox.disabled = true; // --- NEW ---

                elements.confirmButton.classList.add('hidden-no-space');
                elements.cancelButton.classList.remove('hidden-no-space');
                elements.cancelButton.textContent = "Clear Subtitles";

            } else if (progress > 0) {
                elements.onlineModeContainer.classList.add('hidden-no-space'); // Hide inputs during processing
                elements.confirmButton.classList.add('hidden-no-space');

                elements.targetLanguageInput.disabled = true;
                elements.subtitleUrlInput.disabled = true;
                elements.youtubeTranscriptInput.disabled = true;
                elements.disneyUrlInput.disabled = true;
                elements.primeUploadButton.disabled = true;

                elements.subtitleModeGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                elements.subtitleStyleGroup.querySelectorAll('input').forEach(input => input.disabled = true);
                elements.editStyleSettingsButton.disabled = true;
                elements.saveForOfflineCheckbox.disabled = true; // --- NEW ---
                elements.cancelButton.classList.remove('hidden-no-space');
                elements.cancelButton.textContent = "Cancel Subtitle Generation";
            } else {
                await stopProcessingUI(elements);
            }
        }
    });
});