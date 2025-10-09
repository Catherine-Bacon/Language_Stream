// custom_settings.js (Modified)

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
    
    // NEW: Get the label elements to manipulate size
    const labelSmall = document.getElementById('labelFontSizeSmall');
    const labelMedium = document.getElementById('labelFontSizeMedium');
    const labelLarge = document.getElementById('labelFontSizeLarge');
    
    // 3. Function to get the actual CSS 'em' size value (using the content.js definitions)
    function getFontSizeEm(preference) {
        switch (preference) {
            case 'small':
                return '0.75em'; 
            case 'large':
                return '1.1em'; 
            case 'medium':
            default:
                return '0.9em'; 
        }
    }

    // 4. NEW: Function to apply ALL font sizes to their respective labels
    function applySizeToLabels() {
        // Apply the correct size to each label directly
        if (labelSmall) labelSmall.style.fontSize = getFontSizeEm('small');
        if (labelMedium) labelMedium.style.fontSize = getFontSizeEm('medium');
        if (labelLarge) labelLarge.style.fontSize = getFontSizeEm('large');
    }


    // 5. Load saved custom preferences
    chrome.storage.local.get(PREF_KEYS, (data) => {
        
        // CRITICAL: Apply all sizes to the labels immediately upon load
        applySizeToLabels();

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

    // 6. Attach event listeners to all radio buttons for saving
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