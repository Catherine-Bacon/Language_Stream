console.log("1. popup.js script file loaded.");

// Define functions outside DOMContentLoaded but ensure they use initialized elements
async function resetStatus(elements) {
    // Clear ALL stored state and language settings if the user manually hits reset/cancel
    await chrome.storage.local.remove(['ls_status', 'last_input', 'captured_subtitle_url']); 
    
    if (!elements.confirmButton) return; 

    // Reset fields to empty (new requirement for refreshed state)
    elements.subtitleUrlInput.value = '';
    elements.targetLanguageSelect.value = 'es'; // Default target language
    
    elements.confirmButton.disabled = true; // Button disabled until URL is pasted
    elements.targetLanguageSelect.disabled = false;
    
    elements.cancelButton.style.display = 'none';

    elements.statusText.textContent = "Please paste the Netflix TTML URL into the box below."; 
    elements.progressBar.style.width = '0%';
    // NEW: Hide detected language text on reset
    elements.detectedLanguageText.style.display = 'none';
    console.log("Processing status reset completed. Fields cleared.");
}

function loadSavedStatus(elements) {
    console.log("3. Loading saved status from storage.");
    // Only retrieve 'ls_status' and 'last_input' (which now contains the URL and target lang)
    chrome.storage.local.get(['ls_status', 'last_input'], (data) => {
        const status = data.ls_status;
        
        // Always set the defaults first
        elements.progressBar.style.width = '0%';
        elements.targetLanguageSelect.disabled = false;
        elements.cancelButton.style.display = 'none';
        elements.detectedLanguageText.style.display = 'none'; // Default to hidden
        
        // Load Language Inputs and last URL first
        const input = data.last_input;
        if (input) {
             // We only care about targetLang and URL now (persistence)
             elements.targetLanguageSelect.value = input.targetLang || 'es';
             elements.subtitleUrlInput.value = input.url || '';
        }

        if (status && status.progress > 0) {
            elements.statusText.textContent = status.message;
            elements.progressBar.style.width = status.progress + '%';

            // Check if status message contains detected language (e.g., after detection but before 100%)
            const langMatch = status.message.match(/Detected Base Language: (\w+)\./);
            if (langMatch) {
                elements.detectedLanguageText.textContent = `Language identified: ${langMatch[1].toUpperCase()}`;
                elements.detectedLanguageText.style.display = 'block';
            }
            
            // Disable inputs while processing (progress > 0 and < 100)
            if (status.progress < 100) {
                elements.confirmButton.disabled = true;
                elements.targetLanguageSelect.disabled = true;
                elements.cancelButton.style.display = 'block';
            } else {
                // Process finished (progress == 100)
                elements.confirmButton.disabled = false; // Allow re-run
                elements.cancelButton.style.display = 'block';
            }
        } else {
             // Neutral or Error State
             // Check the input field's value
             if (elements.subtitleUrlInput.value && elements.subtitleUrlInput.value.startsWith('http')) {
                 elements.statusText.textContent = "Subtitle URL ready. Click Generate to start translation.";
                 elements.confirmButton.disabled = false;
             } else {
                 // Updated message for manual paste
                 elements.statusText.textContent = "Please paste the Netflix TTML URL into the box below.";
                 elements.confirmButton.disabled = true;
                 
                 // On clean state, ensure fields are empty (new requirement on refresh/clean)
                 elements.subtitleUrlInput.value = '';
                 elements.targetLanguageSelect.value = 'es';
             }
             
             if (status && status.progress === 0 && status.message) {
                 elements.statusText.textContent = status.message;
             }
        }
    });
}

// --- Handler Functions ---

async function handleConfirmClick(elements) {
    console.log("[POPUP] 'Generate Subtitles' button clicked. Starting process.");

    const url = elements.subtitleUrlInput.value.trim();

    // IMMEDIATE VISUAL FEEDBACK
    elements.statusText.textContent = "Generating subtitles...";
    elements.progressBar.style.width = '5%';
    
    const targetLang = elements.targetLanguageSelect.value;
    
    console.log("[POPUP] Retrieved URL from input box. URL found:", !!url);

    if (!url || !url.startsWith('http')) {
        elements.statusText.textContent = "Error: Please paste a valid Netflix TTML URL into the input box.";
        elements.progressBar.style.width = '0%';
        elements.confirmButton.disabled = false; 
        return;
    }

    // 1. Save language choices and clear old status
    await chrome.storage.local.remove(['ls_status']);
    await chrome.storage.local.set({ 
        // We only save the URL and Target Lang now
        last_input: { url, targetLang } 
    });

    // 2. Update UI for start of process
    elements.detectedLanguageText.style.display = 'none'; // Hide language text on start
    elements.statusText.textContent = "URL accepted. Initializing content script...";
    elements.progressBar.style.width = '10%';
    elements.confirmButton.disabled = true;
    elements.targetLanguageSelect.disabled = true; 
    elements.cancelButton.style.display = 'block';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        
        if (!tabs[0] || !tabs[0].id) {
            elements.statusText.textContent = "FATAL ERROR: Could not find the active tab ID. Reload page.";
            console.error("[POPUP] Failed to retrieve active tab information.");
            elements.progressBar.style.width = '0%';
            return;
        }
        
        const currentTabId = tabs[0].id;
        console.log(`[POPUP] Target Tab ID: ${currentTabId}. Executing chrome.scripting.executeScript...`);

        // The message no longer contains baseLang
        const message = { 
            command: "fetch_and_process_url", 
            url: url,
            targetLang: targetLang
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
    // Note: Sending messages from popup to content script is generally okay 
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
             // Send message to content script (it handles the cancellation logic).
             chrome.tabs.sendMessage(tabs[0].id, { command: "cancel_processing" }).catch(e => {});
        }
    });
    // NEW LOGIC: When cancelling, we only clear the status, NOT the settings.
    await chrome.storage.local.remove(['ls_status']);
    
    // Reload state from storage (which will retain the URL/target lang)
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
        // NEW: Element for detected language
        detectedLanguageText: document.getElementById('detectedLanguageText') 
    };
    
    // CRITICAL DEBUG CHECK
    if (!elements.confirmButton || !elements.statusText) {
        console.error("2. FATAL ERROR: Core DOM elements (button/status) not found. Check main.html IDs.");
        return; 
    } else {
        console.log("2. All DOM elements found. Attaching listeners.");
    }
    
    // 3. Load previous status and set initial UI state
    loadSavedStatus(elements);

    // --- Final, Robust Listener Attachment ---
    
    // Use an anonymous function to wrap the call, passing 'elements' for safety
    elements.confirmButton.addEventListener('click', () => handleConfirmClick(elements));
    elements.cancelButton.addEventListener('click', () => handleCancelClick(elements));
    
    // NEW: Listen to changes in the URL input box to enable/disable the button
    elements.subtitleUrlInput.addEventListener('input', () => {
         const url = elements.subtitleUrlInput.value.trim();
         elements.confirmButton.disabled = !(url && url.startsWith('http'));
         
         // Always hide the detected language text if the user starts typing a new URL
         elements.detectedLanguageText.style.display = 'none';
         
         if (elements.confirmButton.disabled === false) {
             elements.statusText.textContent = "Subtitle URL ready. Click Generate to start translation.";
         } else {
              elements.statusText.textContent = "Please paste the Netflix TTML URL into the box below.";
         }
    });


    // 6. Listener to update status from content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        
        if (request.command === "update_status") {
            const progress = request.progress;
            const message = request.message;
            
            // --- NEW LOGIC: CHECK FOR DETECTED LANGUAGE IN STATUS MESSAGE ---
            // The message sent from content.js is: "Detected Base Language: EN. Starting translation..."
            const langMatch = message.match(/Detected Base Language: (\w+)\./);
            
            if (langMatch && elements.detectedLanguageText) {
                const detectedLangCode = langMatch[1].toUpperCase();
                elements.detectedLanguageText.textContent = `Language identified: ${detectedLangCode}`;
                elements.detectedLanguageText.style.display = 'block';
            } else if (progress === 0 || progress === 100) {
                 // On error or completion, hide the indicator
                 if (elements.detectedLanguageText) {
                    elements.detectedLanguageText.style.display = 'none';
                 }
            }
            // --- END NEW LOGIC ---

            elements.statusText.textContent = message;
            elements.progressBar.style.width = progress + '%';
            
            if (progress >= 100) {
                // Process finished. Re-enable button and clear status.
                elements.confirmButton.disabled = false;
                elements.targetLanguageSelect.disabled = false;
                elements.cancelButton.style.display = 'block';
            } else if (progress > 0) {
                // Processing in progress. Disable inputs.
                elements.confirmButton.disabled = true;
                elements.targetLanguageSelect.disabled = true;
                elements.cancelButton.style.display = 'block';
            } else {
                // Error case (progress 0). Re-enable selection.
                if (elements.subtitleUrlInput.value && elements.subtitleUrlInput.value.startsWith('http')) {
                    elements.statusText.textContent = "Error, but URL is in the box. Click Generate to retry.";
                    elements.confirmButton.disabled = false;
                } else {
                    elements.statusText.textContent = "Error. Please paste subtitle data into the box.";
                    elements.confirmButton.disabled = true;
                }
                elements.targetLanguageSelect.disabled = false;
                elements.cancelButton.style.display = 'none';
            }
        }
    }); 

}); // End DOMContentLoaded