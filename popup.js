// popup.js

const confirmButton = document.getElementById('confirmButton');

confirmButton.addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        // Send a message to the content script to create the window
        chrome.tabs.sendMessage(tabs[0].id, { command: "create_window" });
        alert('Window creation command sent to Netflix page.');
    });
});