console.log("1. popup.js script file loaded.");

const LANGUAGE_MAP = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'ja': 'Japanese',
    'ko': 'Korean',
    // Add other relevant languages if your translator supports them
    'zh': 'Chinese (Detected)', 
    'pt': 'Portuguese',
    'ru': 'Russian',
    'it': 'Italian',
    'sv': 'Swedish',
    'pl': 'Polish',
    'tr': 'Turkish'
};

function getFullLanguageName(code) {
    if (!code || code.toUpperCase() === '(FAIL)') return "Language not yet identified";
    return LANGUAGE_MAP[code.toLowerCase()] || `Code: ${code.toUpperCase()}`; 
}


// Define functions outside DOMContentLoaded but ensure they use initialized elements
async function resetStatus(elements) {
    await chrome.storage.local.remove(['ls_status', 'last_input', 'captured_subtitle_url', 'translated_only_pref']); 
    
    if (!elements.confirmButton) return; 

    elements.subtitleUrlInput.value = '';
    elements.targetLanguageSelect.value = 'es'; // Default target language
    elements.translatedOnlyCheckbox.checked = false;
    
    elements.confirmButton.disabled = true; // Button disabled until URL is pasted
    elements.targetLanguageSelect.disabled = false;
    elements.translatedOnlyCheckbox.disabled = false; // NEW: Enable checkbox
    
    elements.cancelButton.classList.add('hidden-no-space'); 
    elements.cancelButton.textContent = "Cancel Subtitle Generation"; // Ensure text is reset

    // --- MODIFICATION: Set initial status text to empty string ---
    elements.statusText.textContent = ""; 
    elements.progressBar.style.width = '0%';
    console.log("Processing status reset completed. Fields cleared.");
}

function loadSavedStatus(elements) {
    console.log("3. Loading saved status from storage.");
    chrome.storage.local.get(['ls_status', 'last_input', 'translated_only_pref'], (data) => {
        const status = data.ls_status;
        
        // Always set the defaults first
        elements.progressBar.style.width = '0%';
        elements.targetLanguageSelect.disabled = false;
        elements.translatedOnlyCheckbox.disabled = false; // NEW: Enable checkbox by default
        
        elements.cancelButton.classList.add('hidden-no-space'); 
        elements.cancelButton.textContent = "Cancel Subtitle Generation"; // Default text
        
        // NEW: Load persistent preference
        elements.translatedOnlyCheckbox.checked = data.translated_only_pref || false;
        
        // Load Language Inputs and last URL first
        const input = data.last_input;
        if (input) {
             elements.targetLanguageSelect.value = input.targetLang || 'es';
             elements.subtitleUrlInput.value = input.url || '';
        }

        if (status && status.progress > 0) {
            elements.statusText.textContent = status.message;
            elements.progressBar.style.width = status.progress + '%';
            
            // Disable inputs while processing (progress > 0 and < 100)
            if (status.progress < 100) {
                elements.confirmButton.disabled = true;
                elements.targetLanguageSelect.disabled = true;
                elements.translatedOnlyCheckbox.disabled = true; // NEW: Disable checkbox
                elements.cancelButton.classList.remove('hidden-no-space');
                elements.cancelButton.textContent = "Cancel Subtitle Generation"; // Running
            } else {
                // Process finished (progress == 100)
                elements.confirmButton.disabled = false; // Allow re-run
                elements.targetLanguageSelect.disabled = false;
                elements.translatedOnlyCheckbox.disabled = false;
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
                 elements.targetLanguageSelect.value = 'es';
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
        }
    });
}

// --- Handler Functions ---

async function handleConfirmClick(elements) {
    console.log("[POPUP] 'Generate Subtitles' button clicked. Starting process.");

    const url = elements.subtitleUrlInput.value.trim();
    // NEW: Get preference value
    const translatedOnly = elements.translatedOnlyCheckbox.checked;

    // IMMEDIATE VISUAL FEEDBACK
    elements.statusText.textContent = "Generating subtitles...";
    elements.progressBar.style.width = '5%';
    
    const targetLang = elements.targetLanguageSelect.value;
    
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
        // We only save the URL and Target Lang now
        last_input: { url, targetLang },
        // NEW: Save the preference state
        translated_only_pref: translatedOnly
    });

    // 2. Update UI for start of process
    elements.statusText.textContent = "URL accepted. Initializing content script...";
    elements.progressBar.style.width = '10%';
    elements.confirmButton.disabled = true;
    elements.targetLanguageSelect.disabled = true; 
    elements.translatedOnlyCheckbox.disabled = true; // NEW: Disable checkbox
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

        // ADDED: translatedOnly to the message
        const message = { 
            command: "fetch_and_process_url", 
            url: url,
            targetLang: targetLang,
            translatedOnly: translatedOnly // NEW
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
    // Send cancel message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
             // We don't wait for response, just send the stop command.
             chrome.tabs.sendMessage(tabs[0].id, { command: "cancel_processing" }).catch(e => {});
        }
    });
    
    // Clear local storage status and reload UI (this resets everything)
    await chrome.storage.local.remove(['ls_status']);
    loadSavedStatus(elements); 
}

// -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    
    // 2. Initialize DOM variables locally
    const elements = {
        confirmButton: document.getElementById('confirmButton'),
        targetLanguageSelect: document.getElementById('targetLanguage'),
        subtitleUrlInput: document.getElementById('subtitleUrlInput'), 
        statusText: document.getElementById('statusText'),
        progressBar: document.getElementById('progressBar'),
        cancelButton: document.getElementById('cancelButton'),
        // detectedLanguageText: document.getElementById('detectedLanguageText'),
        translatedOnlyCheckbox: document.getElementById('translatedOnlyCheckbox')
    };
    
    // CRITICAL DEBUG CHECK
    if (!elements.confirmButton || !elements.statusText || !elements.translatedOnlyCheckbox) {
        console.error("2. FATAL ERROR: Core DOM elements (button/status/checkbox) not found. Check main.html IDs.");
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
    
    elements.translatedOnlyCheckbox.addEventListener('change', (e) => {
        chrome.storage.local.set({ 'translated_only_pref': e.target.checked });
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
                elements.targetLanguageSelect.disabled = false;
                elements.translatedOnlyCheckbox.disabled = false; // NEW: Re-enable checkbox
                elements.cancelButton.classList.remove('hidden-no-space');
                elements.cancelButton.textContent = "Clear Status & Reset"; // Set to CLEAR text
                
            } else if (progress > 0) {
                // --- PROGRESS 0% < x < 100% STATE (RUNNING) ---
                elements.confirmButton.disabled = true;
                elements.targetLanguageSelect.disabled = true;
                elements.translatedOnlyCheckbox.disabled = true; // NEW: Disable checkbox
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
                elements.targetLanguageSelect.disabled = false;
                elements.translatedOnlyCheckbox.disabled = false; // NEW: Re-enable checkbox
                elements.cancelButton.classList.add('hidden-no-space');
                elements.cancelButton.textContent = "Cancel Subtitle Generation"; // Reset to default text
            }
        }
    }); 

}); // End DOMContentLoaded