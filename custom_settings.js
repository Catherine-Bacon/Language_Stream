document.addEventListener('DOMContentLoaded', () => {
    // Define UI elements
    const elements = {
        title: document.getElementById('settingsTitle'),
        fontColorAlphaSlider: document.getElementById('fontColorAlphaSlider'),
        fontColorAlphaValue: document.getElementById('fontColorAlphaValue'),
        backgroundAlphaSlider: document.getElementById('backgroundAlphaSlider'),
        backgroundAlphaValue: document.getElementById('backgroundAlphaValue'),
        saveStatus: document.getElementById('saveStatus')
    };

    // Define presets and storage keys
    const NETFLIX_PRESET = {
        font_size_pref: 'medium',
        background_color_pref: 'none',
        background_alpha_pref: 1.0,
        font_shadow_pref: 'black_shadow',
        font_color_pref: 'white',
        font_color_alpha_pref: 1.0
    };
    const CUSTOM_DEFAULTS = {
        font_size_pref: 'medium',
        background_color_pref: 'black',
        background_alpha_pref: 0.8,
        font_shadow_pref: 'black_shadow',
        font_color_pref: 'white',
        font_color_alpha_pref: 1.0
    };
    const ALL_PREF_KEYS = Object.keys(CUSTOM_DEFAULTS);

    let settingsContext = 'custom'; // Default context

    // Function to update the UI from a settings object
    function applySettingsToUI(settings) {
        // Radios
        document.querySelector(`input[name="fontSize"][value="${settings.font_size_pref}"]`).checked = true;
        document.querySelector(`input[name="backgroundColor"][value="${settings.background_color_pref}"]`).checked = true;
        document.querySelector(`input[name="fontShadow"][value="${settings.font_shadow_pref}"]`).checked = true;
        document.querySelector(`input[name="fontColor"][value="${settings.font_color_pref}"]`).checked = true;
        
        // Sliders
        elements.fontColorAlphaSlider.value = settings.font_color_alpha_pref;
        elements.fontColorAlphaValue.textContent = `${Math.round(settings.font_color_alpha_pref * 100)}%`;
        elements.backgroundAlphaSlider.value = settings.background_alpha_pref;
        elements.backgroundAlphaValue.textContent = `${Math.round(settings.background_alpha_pref * 100)}%`;
    }

    // Function to save a preference if in 'custom' context
    function savePreference(key, value) {
        if (settingsContext === 'custom') {
            chrome.storage.local.set({ [key]: value }, () => {
                elements.saveStatus.textContent = "Saved!";
                setTimeout(() => {
                    elements.saveStatus.textContent = "Settings are saved automatically.";
                }, 1500);
            });
        }
    }

    // Main logic on load
    chrome.storage.local.get(['settings_context', ...ALL_PREF_KEYS], (data) => {
        settingsContext = data.settings_context || 'custom';

        if (settingsContext === 'netflix') {
            elements.title.textContent = 'Settings - Netflix';
            elements.saveStatus.textContent = 'Changes are temporary and will not be saved.';
            applySettingsToUI(NETFLIX_PRESET);
        } else {
            elements.title.textContent = 'Settings - Custom';
            // Build settings from storage, falling back to defaults
            const customSettings = {};
            for (const key of ALL_PREF_KEYS) {
                customSettings[key] = data[key] ?? CUSTOM_DEFAULTS[key];
            }
            applySettingsToUI(customSettings);
        }
    });

    // Attach event listeners
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                savePreference(`${e.target.name}_pref`, e.target.value);
            }
        });
    });

    elements.fontColorAlphaSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        elements.fontColorAlphaValue.textContent = `${Math.round(value * 100)}%`;
        savePreference('font_color_alpha_pref', value);
    });

    elements.backgroundAlphaSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        elements.backgroundAlphaValue.textContent = `${Math.round(value * 100)}%`;
        savePreference('background_alpha_pref', value);
    });
});