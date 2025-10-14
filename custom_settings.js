document.addEventListener('DOMContentLoaded', () => {
    // --- MODIFICATION START: Renamed elements for clarity ---
    const elements = {
        title: document.getElementById('settingsTitle'),
        fontColorAlphaSlider: document.getElementById('fontColorAlphaSlider'),
        fontColorAlphaValue: document.getElementById('fontColorAlphaValue'),
        backgroundAlphaSlider: document.getElementById('backgroundAlphaSlider'),
        backgroundAlphaValue: document.getElementById('backgroundAlphaValue'),
        statusMessage: document.getElementById('saveStatus') // Renamed for clarity
    };
    // --- MODIFICATION END ---

    // Define presets and storage keys
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
    // --- MODIFICATION START: Use a single list of base keys ---
    const PREF_KEYS = Object.keys(CUSTOM_DEFAULTS);
    let settingsPrefix = 'custom_'; // Default context prefix
    // --- MODIFICATION END ---

    // Function to update the UI from a settings object
    function applySettingsToUI(settings) {
        document.querySelector(`input[name="fontSize"][value="${settings.font_size}"]`).checked = true;
        document.querySelector(`input[name="backgroundColor"][value="${settings.background_color}"]`).checked = true;
        document.querySelector(`input[name="fontShadow"][value="${settings.font_shadow}"]`).checked = true;
        document.querySelector(`input[name="fontColor"][value="${settings.font_color}"]`).checked = true;
        
        elements.fontColorAlphaSlider.value = settings.font_color_alpha;
        elements.fontColorAlphaValue.textContent = `${Math.round(settings.font_color_alpha * 100)}%`;
        elements.backgroundAlphaSlider.value = settings.background_alpha;
        elements.backgroundAlphaValue.textContent = `${Math.round(settings.background_alpha * 100)}%`;
    }

    // --- MODIFICATION START: Simplified save function using the prefix ---
    function savePreference(key, value) {
        // Always save using the determined prefix. No more context checks needed here.
        chrome.storage.local.set({ [`${settingsPrefix}${key}`]: value }, () => {
            elements.statusMessage.textContent = "Saved!";
            setTimeout(() => {
                elements.statusMessage.textContent = "Settings are saved automatically.";
            }, 1500);
        });
    }
    // --- MODIFICATION END ---

    // --- MODIFICATION START: Overhauled loading logic to use prefixes ---
    chrome.storage.local.get('settings_context', (data) => {
        const settingsContext = data.settings_context || 'custom';
        settingsPrefix = `${settingsContext}_`;
        
        const keysToLoad = PREF_KEYS.map(key => `${settingsPrefix}${key}`);

        chrome.storage.local.get(keysToLoad, (storedData) => {
            const settings = {};
            const defaults = (settingsContext === 'netflix') ? NETFLIX_PRESET : CUSTOM_DEFAULTS;

            // Populate settings from storage, falling back to the correct defaults
            for (const key of PREF_KEYS) {
                const storedKey = `${settingsPrefix}${key}`;
                settings[key] = storedData[storedKey] ?? defaults[key];
            }
            
            if (settingsContext === 'netflix') {
                elements.title.textContent = 'Settings - Netflix';
            } else {
                elements.title.textContent = 'Settings - Custom';
            }
            
            applySettingsToUI(settings);
        });
    });
    // --- MODIFICATION END ---

    // Attach event listeners
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                // The key is now just the base name (e.g., 'font_size')
                savePreference(e.target.name, e.target.value);
            }
        });
    });

    elements.fontColorAlphaSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        elements.fontColorAlphaValue.textContent = `${Math.round(value * 100)}%`;
        savePreference('font_color_alpha', value);
    });

    elements.backgroundAlphaSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        elements.backgroundAlphaValue.textContent = `${Math.round(value * 100)}%`;
        savePreference('background_alpha', value);
    });
});