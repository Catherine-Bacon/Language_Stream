// --- File start: popup.js ---

console.log("1. popup.js script file loaded.");

// Define functions outside DOMContentLoaded but ensure they use initialized elements
async function resetStatus(elements) {
    await chrome.storage.local.remove(['ls_status']);
    
    // Safety check
    if (!elements.confirmButton) return; 

    elements.confirmButton.disabled = true; 
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
    chrome.storage.local.get(['ls_status', 'last_input', 'captured_subtitle_url'], (data) => {
        const status = data.ls_status;
        const capturedUrl = data.captured_subtitle_url;

        // Always set the defaults first
        elements.progressBar.style.width = '0%';
        elements.baseLanguageSelect.disabled = false;
        elements.targetLanguageSelect.disabled = false;
        elements.cancelButton.style.display = 'none';
        
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
             if (capturedUrl) {
                 elements.statusText.textContent = "Subtitle URL CAPTURED! Click Generate to start translation.";
                 elements.confirmButton.disabled = false;
             } else {
                 // Updated message to reflect the new capture method (watching a video)
                 elements.statusText.textContent = "Waiting for Netflix subtitle data. Play an episode/movie to capture URL.";
                 elements.confirmButton.disabled = true;
             }
             
             if (status && status.progress === 0 && status.message) {
                 elements.statusText.textContent = status.message;
             }
        }

        // Load Language Inputs
        const input = data.last_input;
        if (input) {
             elements.baseLanguageSelect.value = input.baseLang || 'en';
             elements.targetLanguageSelect.value = input.targetLang || 'es';
        }
    });
}

// --- Handler Functions ---

async function handleConfirmClick(elements) {
    console.log("4. 'Generate Subtitles' button clicked. Starting process.");

    // IMMEDIATE VISUAL FEEDBACK
    elements.statusText.textContent = "Generating subtitles...";
    elements.progressBar.style.width = '5%';
    
    const baseLang = elements.baseLanguageSelect.value;
    const targetLang = elements.targetLanguageSelect.value;

    const storedData = await chrome.storage.local.get(['captured_subtitle_url']);
    const url = storedData.captured_subtitle_url; 
    
    console.log("4a. Retrieved URL from storage. URL found:", !!url);

    if (!url) {
        elements.statusText.textContent = "Error: Subtitle URL was not found. Play a Netflix video and ensure subtitles are ON.";
        elements.progressBar.style.width = '0%';
        elements.confirmButton.disabled = true; 
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
            console.error("4b. Failed to retrieve active tab information.");
            elements.progressBar.style.width = '0%';
            return;
        }
        
        const currentTabId = tabs[0].id;
        console.log(`4c. Target Tab ID: ${currentTabId}. Executing chrome.scripting.executeScript...`);


        const message = { 
            command: "fetch_and_process_url", 
            url: url,
            baseLang: baseLang,
            targetLang: targetLang
        };

        // Inject/ensure content.js is loaded, THEN send the message.
        chrome.scripting.executeScript({
            target: { tabId: currentTabId },
            files: ['content.js']
        }, () => {
            if (chrome.runtime.lastError) {
                elements.statusText.textContent = `FATAL ERROR: Script injection failed: ${chrome.runtime.lastError.message}.`;
                console.error("4d. Scripting FAILED. Error:", chrome.runtime.lastError.message);
                elements.progressBar.style.width = '0%';
                return;
            }
            
            elements.statusText.textContent = "Content script injected. Sending start command...";
            console.log("4e. Content script injected successfully. Sending message...");


            chrome.tabs.sendMessage(currentTabId, message).catch(e => {
                console.error("4f. Failed to send message after script injection:", e);
                elements.statusText.textContent = "Error: Could not communicate with content script. Try a full page reload.";
            });
        });
    });
}

async function handleCancelClick(elements) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
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

    // 6. Listener to update status from content script or background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        
        if (request.command === "update_status") {
            const progress = request.progress;
            const message = request.message;

            elements.statusText.textContent = message;
            elements.progressBar.style.width = progress + '%';
            
            if (progress >= 100) {
                elements.confirmButton.disabled = true;
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
                chrome.storage.local.get(['captured_subtitle_url'], (data) => {
                     if (data.captured_subtitle_url) {
                         elements.statusText.textContent = "Error, but URL is captured. Click Generate to retry.";
                         elements.confirmButton.disabled = false;
                     } else {
                         // Updated error message
                         elements.statusText.textContent = "Error. Play an episode/movie to capture subtitle data.";
                         elements.confirmButton.disabled = true;
                     }
                     elements.baseLanguageSelect.disabled = false;
                     elements.targetLanguageSelect.disabled = false;
                     elements.cancelButton.style.display = 'none';
                });
            }
        }
        
        if (request.command === "subtitle_url_found" && request.url) {
            chrome.storage.local.get(['ls_status'], (data) => {
                 // Only update status if the app isn't currently running a process (progress > 0)
                 if (!data.ls_status || data.ls_status.progress <= 0) { 
                     elements.statusText.textContent = "Subtitle URL CAPTURED! Click Generate to start translation.";
                     elements.confirmButton.disabled = false;
                 }
            });
        }
    }); 

}); // End DOMContentLoaded
