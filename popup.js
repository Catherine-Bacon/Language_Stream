// --- File start: popup.js (Updated with Critical Debugging) ---

console.log("1. popup.js script started execution.");

const confirmButton = document.getElementById('confirmButton');
const baseLanguageSelect = document.getElementById('baseLanguage');
const targetLanguageSelect = document.getElementById('targetLanguage');
const statusText = document.getElementById('statusText');
const progressBar = document.getElementById('progressBar');

const cancelButton = document.getElementById('cancelButton');

// CRITICAL DEBUG CHECK:
if (!confirmButton) {
    console.error("2. FATAL ERROR: confirmButton element not found. Check main.html IDs.");
} else {
    console.log("2. confirmButton element found. Attaching listener.");
}

// --- Status Management Functions ---

// 1. Function to reset the UI and clear *only the processing state*
async function resetStatus() {
    // UNIFY STORAGE KEY: 'ls_status' is used in content.js, so use it here too.
    await chrome.storage.local.remove(['ls_status']);
    
    // Always re-enable controls
    // Button state (enabled/disabled) will be correctly set by loadSavedStatus
    confirmButton.disabled = true; 
    baseLanguageSelect.disabled = false;
    targetLanguageSelect.disabled = false;
    
    // Hide the cancel button when not needed
    cancelButton.style.display = 'none';

    // Reset UI to default state
    statusText.textContent = "Ready to detect Netflix subtitles."; 
    progressBar.style.width = '0%';
    console.log("Processing status reset completed.");
    
    // Rerun loadSavedStatus to check if a URL was captured immediately after reset
    loadSavedStatus(); 
}

// 3. Function to load status from storage on popup open
function loadSavedStatus() {
    console.log("3. Loading saved status from storage.");
    // Keys include the processing status, last input (for language persistence), and the captured URL
    chrome.storage.local.get(['ls_status', 'last_input', 'captured_subtitle_url'], (data) => {
        const status = data.ls_status;
        const capturedUrl = data.captured_subtitle_url;

        // --- 3A. Handle Status/Progress Bar Display ---
        if (status && status.progress < 100 && status.progress > 0) {
            // Case 1: Ongoing process
            statusText.textContent = status.message;
            progressBar.style.width = status.progress + '%';
            
            // Disable inputs while a background process is running
            confirmButton.disabled = true;
            baseLanguageSelect.disabled = true;
            targetLanguageSelect.disabled = true;
            cancelButton.style.display = 'block'; 
        } else if (status && status.progress === 100) {
            // Case 2: Process completed successfully
            statusText.textContent = status.message;
            progressBar.style.width = '100%';
            confirmButton.disabled = true;
            baseLanguageSelect.disabled = false;
            targetLanguageSelect.disabled = false;
            cancelButton.style.display = 'block'; 
        } else {
             // Case 3: Default/cleared or Error state
             
             progressBar.style.width = '0%';
             baseLanguageSelect.disabled = false;
             targetLanguageSelect.disabled = false;
             cancelButton.style.display = 'none'; 
             
             if (capturedUrl) {
                 statusText.textContent = "Subtitle URL CAPTURED! Click Generate to start translation.";
                 confirmButton.disabled = false; // ENABLED: We have the URL
             } else {
                 statusText.textContent = "Waiting for Netflix subtitle data. Play a video to begin capture.";
                 confirmButton.disabled = true; // DISABLED: No URL, cannot start.
             }
             
             // Check for saved error message
             if (status && status.progress === 0 && status.message) {
                 statusText.textContent = status.message;
             }
        }

        // --- 3B. Load Language Inputs ---
        const input = data.last_input;
        if (input) {
             // Load language selections to persist user choice
             baseLanguageSelect.value = input.baseLang || 'en';
             targetLanguageSelect.value = input.targetLang || 'es';
        }
    });
}

// --- Event Listeners ---

// 1. Load saved status immediately when the DOM is ready
document.addEventListener('DOMContentLoaded', loadSavedStatus);

// 2. Generate Subtitles
confirmButton.addEventListener('click', async () => {
    console.log("4. 'Generate Subtitles' button clicked. Starting process.");

    // IMMEDIATE VISUAL FEEDBACK
    statusText.textContent = "Generating subtitles...";
    progressBar.style.width = '5%';
    
    const baseLang = baseLanguageSelect.value;
    const targetLang = targetLanguageSelect.value;

    // CRITICAL CHANGE: Get URL ONLY from storage
    const storedData = await chrome.storage.local.get(['captured_subtitle_url']);
    const url = storedData.captured_subtitle_url; 

    if (!url) {
        statusText.textContent = "Error: Subtitle URL was not found in storage. Play a Netflix video.";
        progressBar.style.width = '0%';
        confirmButton.disabled = true; 
        return;
    }


    // 1. Save language choices and clear old status
    await chrome.storage.local.remove(['ls_status']); // Clear old status only
    await chrome.storage.local.set({ 
        last_input: { url, baseLang, targetLang } // Save the URL we are using along with languages
    });

    // 2. Update UI for start of process
    statusText.textContent = "URL accepted. Initializing content script...";
    progressBar.style.width = '10%';
    confirmButton.disabled = true;
    baseLanguageSelect.disabled = true;
    targetLanguageSelect.disabled = true;
    cancelButton.style.display = 'block'; // Ensure cancel button is shown on start

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        
        if (!tabs[0] || !tabs[0].id) {
            statusText.textContent = "FATAL ERROR: Could not find the active tab ID. Reload page.";
            console.error("Popup Error: Failed to retrieve active tab information.");
            progressBar.style.width = '0%';
            return;
        }
        
        const currentTabId = tabs[0].id;
        
        // Command to tell the content script to fetch, parse, and translate.
        const message = { 
            command: "fetch_and_process_url", 
            url: url, // Pass the captured URL to content.js
            baseLang: baseLang,
            targetLang: targetLang
        };

        // Inject/ensure content.js is loaded, THEN send the message. (The fix)
        chrome.scripting.executeScript({
            target: { tabId: currentTabId },
            files: ['content.js']
        }, () => {
            // Check for error in script injection itself
            if (chrome.runtime.lastError) {
                statusText.textContent = `FATAL ERROR: Script injection failed: ${chrome.runtime.lastError.message}.`;
                console.error("Scripting Error:", chrome.runtime.lastError.message);
                progressBar.style.width = '0%';
                return;
            }
            
            statusText.textContent = "Content script injected. Sending start command...";

            // Send the message to the now-active content script.
            chrome.tabs.sendMessage(currentTabId, message).catch(e => {
                console.error("Failed to send message after script injection:", e);
                // Fallback UI update for major failure
                statusText.textContent = "Error: Could not communicate with content script. Please try a full page reload on Netflix.";
            });
        });
    });
});

// 3. Cancel Button Listener
cancelButton.addEventListener('click', async () => {
    // 1. Send command to content script to stop interval/cleanup
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
             chrome.tabs.sendMessage(tabs[0].id, { command: "cancel_processing" }).catch(e => {
                 // Ignore error if content script is gone
             });
        }
    });
    // 2. Clear status in popup UI and storage
    await resetStatus();
});


// 4. Listener to update status from content script or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === "update_status") {
        const progress = request.progress;
        const message = request.message;

        statusText.textContent = message;
        progressBar.style.width = progress + '%';
        
        if (progress >= 100) {
            // Success state - UI remains disabled until user hits CANCEL
            confirmButton.disabled = true;
            baseLanguageSelect.disabled = false;
            targetLanguageSelect.disabled = false;
            cancelButton.style.display = 'block';
        } else if (progress > 0) {
             // Processing state - disable controls
            confirmButton.disabled = true;
            baseLanguageSelect.disabled = true;
            targetLanguageSelect.disabled = true;
            cancelButton.style.display = 'block';
        } else {
            // Error case (progress 0) - re-enable controls if URL is captured
            confirmButton.disabled = false;
            baseLanguageSelect.disabled = false;
            targetLanguageSelect.disabled = false;
            cancelButton.style.display = 'none';
            
            // If the message contains an error, check storage again to decide button state
            if (statusText.textContent.includes("Error")) {
                chrome.storage.local.get(['captured_subtitle_url'], (data) => {
                    if (data.captured_subtitle_url) {
                        statusText.textContent = "Error, but URL is captured. Click Generate to retry.";
                        confirmButton.disabled = false;
                    } else {
                        // If we are in an error state AND the URL is NOT found, prompt user to play video
                        statusText.textContent = "Error. Play a Netflix video to capture subtitle data.";
                        confirmButton.disabled = true;
                    }
                });
            }
        }
    }
    
    // NEW HANDLER: Handle message from content script when a URL is found
    if (request.command === "subtitle_url_found" && request.url) {
        // Only update the status if the app is currently in a neutral or error state
        chrome.storage.local.get(['ls_status'], (data) => {
             if (!data.ls_status || data.ls_status.progress <= 0) {
                 statusText.textContent = "Subtitle URL CAPTURED! Click Generate to start translation.";
                 // If status was cleared, re-enable buttons
                 confirmButton.disabled = false;
             }
        });
        
    }
});