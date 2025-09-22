const confirmButton = document.getElementById('confirmButton');

confirmButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTabId = tabs[0].id;

        // Try to send a message to the content script.
        chrome.tabs.sendMessage(currentTabId, { command: "ping" }, (response) => {
            // Check for an error. If an error exists, the content script isn't there.
            if (chrome.runtime.lastError) {
                // No response, inject the content script.
                chrome.scripting.executeScript({
                    target: { tabId: currentTabId },
                    files: ['content.js']
                }, () => {
                    // Send the command after a slight delay to ensure the script is ready.
                    setTimeout(() => {
                        chrome.tabs.sendMessage(currentTabId, { command: "create_window" });
                    }, 200);
                });
            } else {
                // The content script is already running, just send the command.
                chrome.tabs.sendMessage(currentTabId, { command: "create_window" });
            }
        });
    });
});