document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        title: document.getElementById('settingsTitle'),
        fontColorAlphaSlider: document.getElementById('fontColorAlphaSlider'),
        fontColorAlphaValue: document.getElementById('fontColorAlphaValue'),
        backgroundAlphaSlider: document.getElementById('backgroundAlphaSlider'),
        backgroundAlphaValue: document.getElementById('backgroundAlphaValue'),
        statusMessage: document.getElementById('saveStatus'),
        // --- MODIFICATION: Added reference to the font color row ---
        fontColorRow: document.getElementById('fontColorRow')
    };

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
    const PREF_KEYS = Object.keys(CUSTOM_DEFAULTS);
    let settingsPrefix = 'custom_';

    function applySettingsToUI(settings) {
        document.querySelector(`input[name="font_size"][value="${settings.font_size}"]`).checked = true;
        document.querySelector(`input[name="background_color"][value="${settings.background_color}"]`).checked = true;
        document.querySelector(`input[name="font_shadow"][value="${settings.font_shadow}"]`).checked = true;
        document.querySelector(`input[name="font_color"][value="${settings.font_color}"]`).checked = true;
        
        elements.fontColorAlphaSlider.value = settings.font_color_alpha;
        elements.fontColorAlphaValue.textContent = `${Math.round(settings.font_color_alpha * 100)}%`;
        elements.backgroundAlphaSlider.value = settings.background_alpha;
        elements.backgroundAlphaValue.textContent = `${Math.round(settings.background_alpha * 100)}%`;
    }

    function savePreference(key, value) {
        chrome.storage.local.set({ [`${settingsPrefix}${key}`]: value }, () => {
            elements.statusMessage.textContent = "Saved!";
            setTimeout(() => {
                elements.statusMessage.textContent = "Settings are saved automatically.";
            }, 1500);
        });
    }

    chrome.storage.local.get('settings_context', (data) => {
        const settingsContext = data.settings_context || 'custom';
        settingsPrefix = `${settingsContext}_`;
        
        const keysToLoad = PREF_KEYS.map(key => `${settingsPrefix}${key}`);

        chrome.storage.local.get(keysToLoad, (storedData) => {
            const settings = {};
            const defaults = (settingsContext === 'netflix') ? NETFLIX_PRESET : CUSTOM_DEFAULTS;

            for (const key of PREF_KEYS) {
                const storedKey = `${settingsPrefix}${key}`;
                settings[key] = storedData[storedKey] ?? defaults[key];
            }
            
            // --- MODIFICATION START: Update UI based on the style being edited ---
            const capitalizedContext = settingsContext.charAt(0).toUpperCase() + settingsContext.slice(1);
            elements.title.textContent = `Settings - ${capitalizedContext}`;

            // Hide the font color option for learning modes, as their colors are fixed.
            if (settingsContext === 'vocabulary' || settingsContext === 'grammar') {
                elements.fontColorRow.style.display = 'none';
            } else {
                elements.fontColorRow.style.display = 'flex';
            }
            // --- MODIFICATION END ---
            
            applySettingsToUI(settings);
        });
    });

    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
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