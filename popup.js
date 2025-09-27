// --- File start: popup.js ---

const confirmButton = document.getElementById('confirmButton');
const subtitleUrlInput = document.getElementById('subtitleUrlInput');
const baseLanguageSelect = document.getElementById('baseLanguage');
const targetLanguageSelect = document.getElementById('targetLanguage');
const statusText = document.getElementById('statusText');
const progressBar = document.getElementById('progressBar');

// Renamed and split the reset buttons
const resetStatusButton = document.getElementById('resetStatusButton');
const clearInputButton = document.getElementById('clearInputButton');


// --- Status Management Functions ---

// 1. Function to reset the UI and clear *only the processing state*
async function resetStatus() {
    await chrome.storage.local.remove(['processing_status']);
    
    // Always re-enable controls
    confirmButton.disabled = false;
    subtitleUrlInput.disabled = false;
    baseLanguageSelect.disabled = false;
    targetLanguageSelect.disabled = false;
    
    // Reset UI to default state
    statusText.textContent = "Ready to load new subtitles.";
    progressBar.style.width = '0%';
    console.log("Processing status reset completed.");
}

// 2. New function to clear URL and Language inputs
async function clearInput() {
    await chrome.storage.local.remove(['last_input']);
    subtitleUrlInput.value = '';
    // Reset languages to default options (en/es)
    baseLanguageSelect.value = 'en';
    targetLanguageSelect.value = 'es';
    statusText.textContent = "URL and language inputs cleared.";
    console.log("Input fields cleared.");
}


// 3. Function to load status from storage on popup open
function loadSavedStatus() {
    // Only retrieve the processing status
    chrome.storage.local.get(['processing_status'], (data) => {
        const status = data.processing_status;

        if (status && status.progress < 100) {
            // Case 1: Ongoing process
            statusText.textContent = status.message;
            progressBar.style.width = status.progress + '%';
            
            // Disable inputs while a background process is running
            confirmButton.disabled = true;
            subtitleUrlInput.disabled = true;
            baseLanguageSelect.disabled = true;
            targetLanguageSelect.disabled = true;
        } else if (status && status.progress === 100) {
            // Case 2: Process completed successfully
            statusText.textContent = status.message;
            progressBar.style.width = '100%';
            confirmButton.disabled = true;
            // Inputs remain enabled so user can easily adjust languages/URL for a new run
        } else {
             // Case 3: Default/cleared state
             statusText.textContent = "Enter subtitle URL and click Load.";
             progressBar.style.width = '0%';
             // Ensure controls are enabled
             confirmButton.disabled = false;
             subtitleUrlInput.disabled = false;
             baseLanguageSelect.disabled = false;
             targetLanguageSelect.disabled = false;
        }
    });
    
    // Separately load the last used input values (URL/Languages) to persist them across popup closes
    chrome.storage.local.get(['last_input'], (data) => {
        const input = data.last_input;
        if (input) {
             subtitleUrlInput.value = input.url || '';
             baseLanguageSelect.value = input.baseLang || 'en';
             targetLanguageSelect.value = input.targetLang || 'es';
        }
    });
}

// --- Event Listeners ---

// 1. Load saved status immediately when the DOM is ready
document.addEventListener('DOMContentLoaded', loadSavedStatus);

// 2. Load Subtitles & Start Dual-Sub Mode
confirmButton.addEventListener('click', async () => {
    const url = subtitleUrlInput.value.trim();
    const baseLang = baseLanguageSelect.value;
    const targetLang = targetLanguageSelect.value;

    if (!url) {
        statusText.textContent = "Error: Please enter a subtitle URL first.";
        progressBar.style.width = '0%';
        return;
    }

    // 1. Proactively clear old status and save new input
    await chrome.storage.local.remove(['processing_status']); // Clear old status only
    await chrome.storage.local.set({ 
        last_input: { url, baseLang, targetLang } 
    });

    // 2. Update UI for start of process
    statusText.textContent = "URL accepted. Initializing...";
    progressBar.style.width = '10%';
    confirmButton.disabled = true;
    subtitleUrlInput.disabled = true;
    baseLanguageSelect.disabled = true;
    targetLanguageSelect.disabled = true;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTabId = tabs[0].id;
        
        // Command to tell the content script to fetch, parse, and translate.
        const message = { 
            command: "fetch_and_process_url", 
            url: url,
            baseLang: baseLang,
            targetLang: targetLang
        };

        // Try to send a message. If the content script isn't loaded, inject it first.
        chrome.tabs.sendMessage(currentTabId, message, (response) => {
            if (chrome.runtime.lastError) {
                // Content script not ready: inject and then send message
                chrome.scripting.executeScript({
                    target: { tabId: currentTabId },
                    files: ['content.js']
                }, () => {
                    setTimeout(() => {
                        chrome.tabs.sendMessage(currentTabId, message);
                    }, 200);
                });
            } 
            // Status updates will now come back via chrome.runtime.onMessage listener below.
        });
    });
});

// 3. Reset Button Listeners
resetStatusButton.addEventListener('click', resetStatus);
clearInputButton.addEventListener('click', clearInput);


// 4. Listener to update status from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === "update_status") {
        const progress = request.progress;
        const message = request.message;

        statusText.textContent = message;
        progressBar.style.width = progress + '%';
        
        if (progress >= 100) {
            confirmButton.disabled = true;
            subtitleUrlInput.disabled = false;
            baseLanguageSelect.disabled = false;
            targetLanguageSelect.disabled = false;
        } else if (progress > 0) {
             // Disable controls while processing
            confirmButton.disabled = true;
            subtitleUrlInput.disabled = true;
            baseLanguageSelect.disabled = true;
            targetLanguageSelect.disabled = true;
        } else {
            // Error case (progress 0), re-enable controls
            confirmButton.disabled = false;
            subtitleUrlInput.disabled = false;
            baseLanguageSelect.disabled = false;
            targetLanguageSelect.disabled = false;
        }
    }
});

// --- File end: popup.js ---