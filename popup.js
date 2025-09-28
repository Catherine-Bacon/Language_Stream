// --- File start: popup.js ---

const confirmButton = document.getElementById('confirmButton');
// REMOVED: const subtitleUrlInput = document.getElementById('subtitleUrlInput');
const baseLanguageSelect = document.getElementById('baseLanguage');
const targetLanguageSelect = document.getElementById('targetLanguage');
const statusText = document.getElementById('statusText');
const progressBar = document.getElementById('progressBar');

// Renamed the reset button constant
const cancelButton = document.getElementById('cancelButton');


// --- Status Management Functions ---

// 1. Function to reset the UI and clear *only the processing state*
async function resetStatus() {
    // UNIFY STORAGE KEY: 'ls_status' is used in content.js, so use it here too.
    await chrome.storage.local.remove(['ls_status']);
    
    // Always re-enable controls
    confirmButton.disabled = false;
    baseLanguageSelect.disabled = false;
    targetLanguageSelect.disabled = false;
    
    // Hide the cancel button when not needed
    cancelButton.style.display = 'none';

    // Reset UI to default state
    statusText.textContent = "Ready to detect Netflix subtitles."; 
    progressBar.style.width = '0%';
    console.log("Processing status reset completed.");
}

// 2. New function to clear URL and Language inputs (REMOVED)


// 3. Function to load status from storage on popup open
function loadSavedStatus() {
    // Keys include the processing status, last input (for language persistence), and the captured URL
    chrome.storage.local.get(['ls_status', 'last_input', 'captured_subtitle_url'], (data) => {
        const status = data.ls_status;

        // --- 3A. Handle Status/Progress Bar Display ---
        if (status && status.progress < 100) {
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
            cancelButton.style.display = 'block'; 
        } else {
             // Case 3: Default/cleared state
             const capturedUrl = data.captured_subtitle_url;
             
             if (capturedUrl) {
                 statusText.textContent = "Subtitle URL CAPTURED! Click Generate to start translation.";
                 confirmButton.disabled = false;
             } else {
                 statusText.textContent = "Waiting for Netflix subtitle data. Play a video to begin capture.";
                 confirmButton.disabled = true; // Cannot generate without URL
             }
             
             progressBar.style.width = '0%';
             baseLanguageSelect.disabled = false;
             targetLanguageSelect.disabled = false;
             cancelButton.style.display = 'none'; 
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
    const baseLang = baseLanguageSelect.value;
    const targetLang = targetLanguageSelect.value;

    // CRITICAL CHANGE: Get URL ONLY from storage
    const storedData = await chrome.storage.local.get(['captured_subtitle_url']);
    const url = storedData.captured_subtitle_url; 

    if (!url) {
        statusText.textContent = "Error: Subtitle URL was not found. Please ensure you are on a Netflix playback page and the background script captured the URL.";
        progressBar.style.width = '0%';
        // Re-disable button if capture failed
        confirmButton.disabled = true; 
        return;
    }


    // 1. Save language choices and clear old status
    await chrome.storage.local.remove(['ls_status']); // Clear old status only
    await chrome.storage.local.set({ 
        last_input: { url, baseLang, targetLang } // Save the URL we are using along with languages
    });

    // 2. Update UI for start of process
    statusText.textContent = "URL accepted. Initializing...";
    progressBar.style.width = '10%';
    confirmButton.disabled = true;
    baseLanguageSelect.disabled = true;
    targetLanguageSelect.disabled = true;
    cancelButton.style.display = 'block'; // Ensure cancel button is shown on start

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTabId = tabs[0].id;
        
        // Command to tell the content script to fetch, parse, and translate.
        const message = { 
            command: "fetch_and_process_url", 
            url: url, // Pass the captured URL to content.js
            baseLang: baseLang,
            targetLang: targetLang
        };

        chrome.tabs.sendMessage(currentTabId, message, (response) => {
            if (chrome.runtime.lastError) {
                chrome.scripting.executeScript({
                    target: { tabId: currentTabId },
                    files: ['content.js']
                }, () => {
                    setTimeout(() => {
                        chrome.tabs.sendMessage(currentTabId, message);
                    }, 200);
                });
            } 
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
            // Success state - allow user to change URL/languages
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
            // Error case (progress 0) - re-enable controls
            confirmButton.disabled = false;
            baseLanguageSelect.disabled = false;
            targetLanguageSelect.disabled = false;
            cancelButton.style.display = 'none';
            
            // If the error is persistent, re-check URL to see if we should re-enable the button
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
    
    // NEW HANDLER: Handle message from background script when a URL is found
    if (request.command === "subtitle_url_found" && request.url) {
        // Only update the status if the app is currently in a neutral or error state
        chrome.storage.local.get(['ls_status'], (data) => {
             if (!data.ls_status || data.ls_status.progress === 0) {
                 statusText.textContent = "Subtitle URL CAPTURED! Click Generate to start translation.";
                 // If status was cleared, re-enable buttons
                 confirmButton.disabled = false;
             }
        });
        
    }
});
