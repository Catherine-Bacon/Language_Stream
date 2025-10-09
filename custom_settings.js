document.addEventListener('DOMContentLoaded', () => {
    // 1. Define preference keys used for custom settings
    const PREF_KEYS = [
        'font_size_pref', 
        'background_color_pref', 
        'font_shadow_pref', 
        'font_color_pref'
    ];

    // 2. Map group names to default values
    const PREF_DEFAULTS = {
        'fontSize': 'medium',
        'backgroundColor': 'black',
        'fontShadow': 'black_shadow',
        'fontColor': 'white'
    };
    
    const saveStatusElement = document.getElementById('saveStatus');

    // 3. Load saved custom preferences
    chrome.storage.local.get(PREF_KEYS, (data) => {
        
        // Load Font Size
        const savedFontSize = data.font_size_pref || PREF_DEFAULTS.fontSize;
        const fontSizeElement = document.getElementById(`fontSize${savedFontSize.charAt(0).toUpperCase() + savedFontSize.slice(1)}`);
        if (fontSizeElement) fontSizeElement.checked = true;

        // Load Background Color
        const savedBgColor = data.background_color_pref || PREF_DEFAULTS.backgroundColor;
        const bgColorElement = document.getElementById(`backgroundColor${savedBgColor.charAt(0).toUpperCase() + savedBgColor.slice(1)}`);
        if (bgColorElement) bgColorElement.checked = true;

        // Load Font Shadow
        const savedFontShadow = data.font_shadow_pref || PREF_DEFAULTS.fontShadow;
        const fontShadowElement = document.getElementById(`fontShadow${savedFontShadow.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')}`);
        if (fontShadowElement) fontShadowElement.checked = true;

        // Load Font Color
        const savedFontColor = data.font_color_pref || PREF_DEFAULTS.fontColor;
        const fontColorElement = document.getElementById(`fontColor${savedFontColor.charAt(0).toUpperCase() + savedFontColor.slice(1)}`);
        if (fontColorElement) fontColorElement.checked = true;
    });

    // 4. Attach event listeners to all radio buttons for saving
    const radioGroups = document.querySelectorAll('.radio-group');
    radioGroups.forEach(group => {
        group.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    const prefKey = e.target.name + '_pref'; // e.g., 'fontSize_pref'
                    
                    // Save the new value
                    chrome.storage.local.set({ [prefKey]: e.target.value }, () => {
                        // Display save confirmation message briefly
                        saveStatusElement.textContent = "Settings saved!";
                        saveStatusElement.style.color = "green";
                        setTimeout(() => {
                            saveStatusElement.textContent = "Settings saved automatically.";
                            saveStatusElement.style.color = "green"; // Keep color green
                        }, 1500);
                    });
                }
            });
        });
    });
});