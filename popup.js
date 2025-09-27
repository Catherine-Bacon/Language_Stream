// --- File start: popup.js ---

const confirmButton = document.getElementById('confirmButton');
const subtitleUrlInput = document.getElementById('subtitleUrlInput');
const baseLanguageSelect = document.getElementById('baseLanguage');
const targetLanguageSelect = document.getElementById('targetLanguage');
const statusText = document.getElementById('statusText');
const progressBar = document.getElementById('progressBar');
const resetButton = document.getElementById('resetButton');

// --- Status Management Functions ---

// Function to reset the UI and clear storage
async function resetStatus() {
    await chrome.storage.local.remove(['processing_status', 'last_input']);
    statusText.textContent = "Ready to load new subtitles.";
    progressBar.style.width = '0%';
    confirmButton.disabled = false;
    subtitleUrlInput.disabled = false;
    baseLanguageSelect.disabled = false;
    targetLanguageSelect.disabled = false;
    console.log("Status reset completed.");
}

// Function to load status from storage on popup open
function loadSavedStatus() {
    chrome.storage.local.get(['processing_status', 'last_input'], (data) => {
        const status = data.processing_status;
        const input = data.last_input;

        if (input && subtitleUrlInput) {
             subtitleUrlInput.value = input.url || '';
             baseLanguageSelect.value = input.baseLang || 'en';
             targetLanguageSelect.value = input.targetLang || 'es';
        }

        if (status && status.progress < 100) {
            statusText.textContent = status.message;
            progressBar.style.width = status.progress + '%';
            
            // Disable inputs while a background process is running
            confirmButton.disabled = true;
            subtitleUrlInput.disabled = true;
            baseLanguageSelect.disabled = true;
            targetLanguageSelect.disabled = true;
        } else if (status && status.progress === 100) {
            statusText.textContent = status.message;
            progressBar.style.width = '100%';
            confirmButton.disabled = true;
        } else {
             // Default state
             statusText.textContent = "Enter subtitle URL and click Load.";
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
    await resetStatus(); 
    await chrome.storage.local.set({ 
        last_input: { url, baseLang, targetLang } 
    });

    // 2. Update UI for start of process
    statusText.textContent = "URL accepted. Initializing...";
    progressBar.style.width = '10%';
    confirmButton.disabled = true;
    subtitleUrlInput.disabled = true;

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

// 3. Reset Button Listener
resetButton.addEventListener('click', resetStatus);


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
        } else if (progress > 0) {
             // Disable controls while processing
            confirmButton.disabled = true;
            subtitleUrlInput.disabled = true;
        } else {
            // Error case, re-enable controls
            confirmButton.disabled = false;
            subtitleUrlInput.disabled = false;
        }
    }
});

// --- File end: popup.js ---
