// --- DOM Elements ---
const confirmButton = document.getElementById('confirmButton');
const urlInput = document.getElementById('subtitleUrlInput');
const baseLanguageSelect = document.getElementById('baseLanguage');
const targetLanguageSelect = document.getElementById('targetLanguage');
const statusText = document.getElementById('statusText');
const progressBar = document.getElementById('progressBar');

// --- Initialization: Load status from storage ---
document.addEventListener('DOMContentLoaded', () => {
    // Attempt to load saved status
    chrome.storage.local.get('ls_status', (data) => {
        const savedStatus = data.ls_status;

        if (savedStatus) {
            statusText.textContent = savedStatus.message;
            progressBar.style.width = savedStatus.progress + '%';

            // If a process is active (progress < 100), disable controls and restore input values
            if (savedStatus.progress < 100) {
                confirmButton.disabled = true;
                urlInput.disabled = true;
                
                // Restore values if they were saved during processing
                if (savedStatus.url) urlInput.value = savedStatus.url;
                if (savedStatus.baseLang) baseLanguageSelect.value = savedStatus.baseLang;
                if (savedStatus.targetLang) targetLanguageSelect.value = savedStatus.targetLang;
                
                // Indicate that the background process is still running
                statusText.textContent = savedStatus.message + " (Processing in background...)";
            } else {
                // If progress is 100, show completion status but enable controls for a new job
                confirmButton.disabled = false;
                urlInput.disabled = false;
            }
        } else {
            // Default state
            statusText.textContent = "Enter subtitle URL and click Load.";
            progressBar.style.width = '0%';
        }
    });
});

// --- Main Button Logic ---
confirmButton.addEventListener('click', () => {
    const url = urlInput.value;
    const baseLang = baseLanguageSelect.value;
    const targetLang = targetLanguageSelect.value;

    if (!url || !url.startsWith('http')) {
        statusText.textContent = "Error: Please enter a valid subtitle URL.";
        progressBar.style.width = '0%';
        return;
    }
    
    // Disable controls while processing starts
    confirmButton.disabled = true;
    urlInput.disabled = true;

    statusText.textContent = "Starting process...";
    progressBar.style.width = '10%';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTabId = tabs[0].id;

        // Message payload includes URL and language settings
        const payload = { 
            command: "fetch_and_process_xml", 
            url: url,
            baseLang: baseLang,
            targetLang: targetLang
        };

        // Try to send a message to the content script.
        chrome.tabs.sendMessage(currentTabId, { command: "ping" }, (response) => {
            // Check for an error. If an error exists, the content script isn't there.
            if (chrome.runtime.lastError) {
                // No response, inject the content script first
                chrome.scripting.executeScript({
                    target: { tabId: currentTabId },
                    files: ['content.js']
                }, () => {
                    // Send the command after a slight delay to ensure the script is ready.
                    setTimeout(() => {
                        chrome.tabs.sendMessage(currentTabId, payload);
                    }, 200);
                });
            } else {
                // The content script is already running, just send the command.
                chrome.tabs.sendMessage(currentTabId, payload);
            }
        });
    });
});


// --- Listener to update status from content script ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === "update_status") {
        statusText.textContent = request.message;
        progressBar.style.width = request.progress + '%';

        if (request.progress >= 100) {
            confirmButton.disabled = false;
            urlInput.disabled = false;
            // Also clear the saved state on successful completion
            chrome.storage.local.remove('ls_status');
        }
    }
});
