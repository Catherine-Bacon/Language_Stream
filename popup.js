// --- File start: popup.js (Structurally Corrected) ---

// Define variables globally but initialize them inside DOMContentLoaded
let confirmButton, baseLanguageSelect, targetLanguageSelect, statusText, progressBar, cancelButton;

console.log("1. popup.js script file loaded.");

// --- Status Management Functions (remain outside for scope) ---

// 1. Function to reset the UI and clear *only the processing state*
async function resetStatus() {
    await chrome.storage.local.remove(['ls_status']);
    
    confirmButton.disabled = true; 
    baseLanguageSelect.disabled = false;
    targetLanguageSelect.disabled = false;
    
    cancelButton.style.display = 'none';

    statusText.textContent = "Ready to detect Netflix subtitles."; 
    progressBar.style.width = '0%';
    console.log("Processing status reset completed.");
    
    loadSavedStatus(); 
}

// 3. Function to load status from storage on popup open
function loadSavedStatus() {
    console.log("3. Loading saved status from storage.");
    chrome.storage.local.get(['ls_status', 'last_input', 'captured_subtitle_url'], (data) => {
        const status = data.ls_status;
        const capturedUrl = data.captured_subtitle_url;

        // --- 3A. Handle Status/Progress Bar Display ---
        if (status && status.progress < 100 && status.progress > 0) {
            statusText.textContent = status.message;
            progressBar.style.width = status.progress + '%';
            
            confirmButton.disabled = true;
            baseLanguageSelect.disabled = true;
            targetLanguageSelect.disabled = true;
            cancelButton.style.display = 'block'; 
        } else if (status && status.progress === 100) {
            statusText.textContent = status.message;
            progressBar.style.width = '100%';
            confirmButton.disabled = true;
            baseLanguageSelect.disabled = false;
            targetLanguageSelect.disabled = false;
            cancelButton.style.display = 'block'; 
        } else {
             progressBar.style.width = '0%';
             baseLanguageSelect.disabled = false;
             targetLanguageSelect.disabled = false;
             cancelButton.style.display = 'none'; 
             
             if (capturedUrl) {
                 statusText.textContent = "Subtitle URL CAPTURED! Click Generate to start translation.";
                 confirmButton.disabled = false; 
             } else {
                 statusText.textContent = "Waiting for Netflix subtitle data. Play a video to begin capture.";
                 confirmButton.disabled = true; 
             }
             
             if (status && status.progress === 0 && status.message) {
                 statusText.textContent = status.message;
             }
        }

        // --- 3B. Load Language Inputs ---
        const input = data.last_input;
        if (input) {
             baseLanguageSelect.value = input.baseLang || 'en';
             targetLanguageSelect.value = input.targetLang || 'es';
        }
    });
}

// --- Event Listeners (Main Execution Block) ---

// 1. Wait for the entire HTML document to be loaded before running any DOM code
document.addEventListener('DOMContentLoaded', () => {
    
    // 2. Initialize DOM variables inside the safety of DOMContentLoaded
    confirmButton = document.getElementById('confirmButton');
    baseLanguageSelect = document.getElementById('baseLanguage');
    targetLanguageSelect = document.getElementById('targetLanguage');
    statusText = document.getElementById('statusText');
    progressBar = document.getElementById('progressBar');
    cancelButton = document.getElementById('cancelButton');
    
    // CRITICAL DEBUG CHECK (Should pass now)
    if (!confirmButton) {
        console.error("2. FATAL ERROR: confirmButton element not found. Check main.html IDs.");
        return; // Stop execution if we can't find the main button
    } else {
        console.log("2. All DOM elements found. Attaching listeners.");
    }
    
    // 3. Load previous status and set initial UI state
    loadSavedStatus();

    // 4. Attach Generate Subtitles Listener
    confirmButton.addEventListener('click', async () => {
        console.log("4. 'Generate Subtitles' button clicked. Starting process.");

        // IMMEDIATE VISUAL FEEDBACK
        statusText.textContent = "Generating subtitles...";
        progressBar.style.width = '5%';
        
        const baseLang = baseLanguageSelect.value;
        const targetLang = targetLanguageSelect.value;

        const storedData = await chrome.storage.local.get(['captured_subtitle_url']);
        const url = storedData.captured_subtitle_url; 

        if (!url) {
            statusText.textContent = "Error: Subtitle URL was not found in storage. Play a Netflix video.";
            progressBar.style.width = '0%';
            confirmButton.disabled = true; 
            return;
        }

        // 1. Save language choices and clear old status
        await chrome.storage.local.remove(['ls_status']);
        await chrome.storage.local.set({ 
            last_input: { url, baseLang, targetLang }
        });

        // 2. Update UI for start of process
        statusText.textContent = "URL accepted. Initializing content script...";
        progressBar.style.width = '10%';
        confirmButton.disabled = true;
        baseLanguageSelect.disabled = true;
        targetLanguageSelect.disabled = true;
        cancelButton.style.display = 'block';

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            
            if (!tabs[0] || !tabs[0].id) {
                statusText.textContent = "FATAL ERROR: Could not find the active tab ID. Reload page.";
                console.error("Popup Error: Failed to retrieve active tab information.");
                progressBar.style.width = '0%';
                return;
            }
            
            const currentTabId = tabs[0].id;
            
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
                    statusText.textContent = `FATAL ERROR: Script injection failed: ${chrome.runtime.lastError.message}.`;
                    console.error("Scripting Error:", chrome.runtime.lastError.message);
                    progressBar.style.width = '0%';
                    return;
                }
                
                statusText.textContent = "Content script injected. Sending start command...";

                chrome.tabs.sendMessage(currentTabId, message).catch(e => {
                    console.error("Failed to send message after script injection:", e);
                    statusText.textContent = "Error: Could not communicate with content script. Try a full page reload.";
                });
            });
        });
    });

    // 5. Attach Cancel Button Listener
    cancelButton.addEventListener('click', async () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                 chrome.tabs.sendMessage(tabs[0].id, { command: "cancel_processing" }).catch(e => {});
            }
        });
        await resetStatus();
    });
}); // End DOMContentLoaded

// 6. Listener to update status from content script or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Only proceed if the elements have been initialized by DOMContentLoaded
    if (!statusText) return; 

    if (request.command === "update_status") {
        const progress = request.progress;
        const message = request.message;

        statusText.textContent = message;
        progressBar.style.width = progress + '%';
        
        if (progress >= 100) {
            confirmButton.disabled = true;
            baseLanguageSelect.disabled = false;
            targetLanguageSelect.disabled = false;
            cancelButton.style.display = 'block';
        } else if (progress > 0) {
            confirmButton.disabled = true;
            baseLanguageSelect.disabled = true;
            targetLanguageSelect.disabled = true;
            cancelButton.style.display = 'block';
        } else {
            // Error case (progress 0)
            chrome.storage.local.get(['captured_subtitle_url'], (data) => {
                 if (data.captured_subtitle_url) {
                    statusText.textContent = "Error, but URL is captured. Click Generate to retry.";
                    confirmButton.disabled = false;
                 } else {
                    statusText.textContent = "Error. Play a Netflix video to capture subtitle data.";
                    confirmButton.disabled = true;
                 }
                 baseLanguageSelect.disabled = false;
                 targetLanguageSelect.disabled = false;
                 cancelButton.style.display = 'none';
            });
        }
    }
    
    if (request.command === "subtitle_url_found" && request.url) {
        chrome.storage.local.get(['ls_status'], (data) => {
             if (!data.ls_status || data.ls_status.progress <= 0) {
                 statusText.textContent = "Subtitle URL CAPTURED! Click Generate to start translation.";
                 confirmButton.disabled = false;
             }
        });
    }
});