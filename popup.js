// --- File start: popup.js ---

console.log("1. popup.js script file loaded.");

// Define functions outside DOMContentLoaded but ensure they use initialized elements
async function resetStatus(elements) {
    await chrome.storage.local.remove(['ls_status']);
    
    // Safety check
    if (!elements.confirmButton) return; 

    // MODIFIED: Re-enable the button if a URL is in the box
    elements.confirmButton.disabled = !(elements.subtitleUrlInput.value && elements.subtitleUrlInput.value.startsWith('http'));
    elements.baseLanguageSelect.disabled = false;
    elements.targetLanguageSelect.disabled = false;
    
    elements.cancelButton.style.display = 'none';

    elements.statusText.textContent = "Ready to detect Netflix subtitles."; 
    elements.progressBar.style.width = '0%';
    console.log("Processing status reset completed.");
    
    loadSavedStatus(elements); 
}

function loadSavedStatus(elements) {
    console.log("3. Loading saved status from storage.");
    // We keep 'captured_subtitle_url' retrieval to automatically populate the input box if available
    chrome.storage.local.get(['ls_status', 'last_input', 'captured_subtitle_url'], (data) => {
        const status = data.ls_status;
        const capturedUrl = data.captured_subtitle_url;

        // Always set the defaults first
        elements.progressBar.style.width = '0%';
        elements.baseLanguageSelect.disabled = false;
        elements.targetLanguageSelect.disabled = false;
        elements.cancelButton.style.display = 'none';
        
        // Load Language Inputs and last URL first
        const input = data.last_input;
        if (input) {
             elements.baseLanguageSelect.value = input.baseLang || 'en';
             elements.targetLanguageSelect.value = input.targetLang || 'es';
             elements.subtitleUrlInput.value = input.url || ''; 
        } else if (capturedUrl) {
            // Populate input if background captured it but no process has started yet
            elements.subtitleUrlInput.value = capturedUrl;
        }


        if (status && status.progress > 0) {
            elements.statusText.textContent = status.message;
            elements.progressBar.style.width = status.progress + '%';
            
            // Disable inputs while processing (progress > 0 and < 100)
            if (status.progress < 100) {
                elements.confirmButton.disabled = true;
                elements.baseLanguageSelect.disabled = true;
                elements.targetLanguageSelect.disabled = true;
                elements.cancelButton.style.display = 'block';
            } else {
                // Process finished (progress == 100)
                elements.confirmButton.disabled = true;
                elements.cancelButton.style.display = 'block';
            }
        } else {
             // Neutral or Error State
             // MODIFIED: Check the input field's value
             if (elements.subtitleUrlInput.value && elements.subtitleUrlInput.value.startsWith('http')) {
                 elements.statusText.textContent = "Subtitle URL ready. Click Generate to start translation.";
                 elements.confirmButton.disabled = false;
             } else {
                 // Updated message to prompt for manual paste
                 elements.statusText.textContent = "Waiting for Netflix subtitle URL. Please paste it into the box below.";
                 elements.confirmButton.disabled = true;
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

    // ADDED: Get URL directly from the input element
    const url = elements.subtitleUrlInput.value.trim();

    // IMMEDIATE VISUAL FEEDBACK
    elements.statusText.textContent = "Generating subtitles...";
    elements.progressBar.style.width = '5%';
    
    const baseLang = elements.baseLanguageSelect.value;
    const targetLang = elements.targetLanguageSelect.value;
    
    // The previous logic for retrieving from storage has been removed/modified.

    console.log("[POPUP] Retrieved URL from input box. URL found:", !!url);

    if (!url || !url.startsWith('http')) {
        // MODIFIED ERROR MESSAGE
        elements.statusText.textContent = "Error: Please paste a valid Netflix TTML URL into the input box.";
        elements.progressBar.style.width = '0%';
        elements.confirmButton.disabled = false; 
        return;
    }

    // 1. Save language choices and clear old status
    await chrome.storage.local.remove(['ls_status']);
    await chrome.storage.local.set({ 
        last_input: { url, baseLang, targetLang }
    });

    // 2. Update UI for start of process
    elements.statusText.textContent = "URL accepted. Initializing content script...";
    elements.progressBar.style.width = '10%';
    elements.confirmButton.disabled = true;
    elements.baseLanguageSelect.disabled = true;
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


        const message = { 
            command: "fetch_and_process_url", 
            url: url,
            baseLang: baseLang,
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
    // because the content script is running in the tab's context.
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
             // Send message to content script (it handles the cancellation logic).
             // Using .catch() here ensures we suppress the 'No content script listening' error.
             chrome.tabs.sendMessage(tabs[0].id, { command: "cancel_processing" }).catch(e => {});
        }
    });
    await resetStatus(elements);
}

// -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    
    // 2. Initialize DOM variables locally
    const elements = {
        confirmButton: document.getElementById('confirmButton'),
        baseLanguageSelect: document.getElementById('baseLanguage'),
        targetLanguageSelect: document.getElementById('targetLanguage'),
        subtitleUrlInput: document.getElementById('subtitleUrlInput'), // ADDED
        statusText: document.getElementById('statusText'),
        progressBar: document.getElementById('progressBar'),
        cancelButton: document.getElementById('cancelButton')
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
         if (elements.confirmButton.disabled === false) {
             elements.statusText.textContent = "Subtitle URL ready. Click Generate to start translation.";
         }
    });


    // 6. Listener to update status from content script or background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        
        if (request.command === "update_status") {
            const progress = request.progress;
            const message = request.message;

            elements.statusText.textContent = message;
            elements.progressBar.style.width = progress + '%';
            
            if (progress >= 100) {
                // MODIFIED: Re-enable the button if the URL is still valid in the box
                elements.confirmButton.disabled = !(elements.subtitleUrlInput.value && elements.subtitleUrlInput.value.startsWith('http'));
                elements.baseLanguageSelect.disabled = false;
                elements.targetLanguageSelect.disabled = false;
                elements.cancelButton.style.display = 'block';
            } else if (progress > 0) {
                elements.confirmButton.disabled = true;
                elements.baseLanguageSelect.disabled = true;
                elements.targetLanguageSelect.disabled = true;
                elements.cancelButton.style.display = 'block';
            } else {
                // Error case (progress 0)
                // MODIFIED: Check the input field's value
                if (elements.subtitleUrlInput.value && elements.subtitleUrlInput.value.startsWith('http')) {
                    elements.statusText.textContent = "Error, but URL is in the box. Click Generate to retry.";
                    elements.confirmButton.disabled = false;
                } else {
                    elements.statusText.textContent = "Error. Please paste subtitle data into the box.";
                    elements.confirmButton.disabled = true;
                }
                elements.baseLanguageSelect.disabled = false;
                elements.targetLanguageSelect.disabled = false;
                elements.cancelButton.style.display = 'none';
            }
        }
        
        // This block will auto-populate the input box if the background script successfully captures a URL
        if (request.command === "subtitle_url_found" && request.url) {
            chrome.storage.local.get(['ls_status'], (data) => {
                 // Only update status if the app isn't currently running a process (progress > 0)
                 if (!data.ls_status || data.ls_status.progress <= 0) { 
                     elements.subtitleUrlInput.value = request.url; // Populate the field
                     elements.statusText.textContent = "Subtitle URL CAPTURED (and pasted below). Click Generate to start translation.";
                     elements.confirmButton.disabled = false;
                 }
            });
        }
    }); 

}); // End DOMContentLoaded