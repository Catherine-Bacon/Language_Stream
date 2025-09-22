const confirmButton = document.getElementById('confirmButton');

confirmButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTabId = tabs[0].id;

        // Use executeScript to ensure the content script is running and up-to-date
        chrome.scripting.executeScript({
            target: { tabId: currentTabId },
            files: ['content.js']
        }, () => {
            // Once the script is injected, send the command
            chrome.tabs.sendMessage(currentTabId, { command: "create_window" });
        });
    });
});