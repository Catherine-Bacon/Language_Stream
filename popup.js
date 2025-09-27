const confirmButton = document.getElementById('confirmButton');
const urlInput = document.getElementById('subtitleUrlInput'); 
const baseLanguageSelect = document.getElementById('baseLanguage');
const targetLanguageSelect = document.getElementById('targetLanguage');
const statusText = document.getElementById('statusText');
const progressBar = document.getElementById('progressBar');

confirmButton.addEventListener('click', () => {
    const subtitleUrl = urlInput.value.trim();
    const baseLang = baseLanguageSelect.value;
    const targetLang = targetLanguageSelect.value;

    if (!subtitleUrl) {
        statusText.textContent = "Error: Please enter a subtitle URL.";
        progressBar.style.width = '0%';
        return;
    }

    statusText.textContent = "Requesting subtitle data...";
    progressBar.style.width = '10%';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTabId = tabs[0].id;

        // Message contains the URL and language preferences
        const message = { 
            command: "fetch_and_process_xml", 
            url: subtitleUrl,
            baseLang: baseLang,
            targetLang: targetLang
        };

        // Try to send a message to the content script.
        chrome.tabs.sendMessage(currentTabId, message, (response) => {
            // Check for error/response to determine if content script is loaded
            if (chrome.runtime.lastError) {
                // No response, inject the content script first
                chrome.scripting.executeScript({
                    target: { tabId: currentTabId },
                    files: ['content.js']
                }, () => {
                    // Send the command after a slight delay to ensure the script is ready.
                    setTimeout(() => {
                        chrome.tabs.sendMessage(currentTabId, message);
                    }, 200);
                });
            } 
        });
    });
});


// Listener to update status from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === "update_status") {
        statusText.textContent = request.message;
        // Ensure progress is clamped between 0 and 100
        const progress = Math.max(0, Math.min(100, request.progress || 0));
        progressBar.style.width = progress + '%';

        if (progress >= 100) {
            confirmButton.disabled = true;
            urlInput.disabled = true;
        } else {
             // Re-enable if processing fails and progress is reset
             confirmButton.disabled = false;
             urlInput.disabled = false;
        }
    }
});
