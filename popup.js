const confirmButton = document.getElementById('confirmButton');
const fileInput = document.getElementById('subtitleFileInput');
const statusText = document.getElementById('statusText');
const progressBar = document.getElementById('progressBar');

confirmButton.addEventListener('click', () => {
    const file = fileInput.files[0];

    if (!file) {
        statusText.textContent = "Error: Please select a TTML XML file first.";
        progressBar.style.width = '0%';
        return;
    }

    statusText.textContent = "Reading file...";
    progressBar.style.width = '10%';

    const reader = new FileReader();

    reader.onload = (e) => {
        const xmlContent = e.target.result;
        statusText.textContent = "File read. Sending to Netflix tab for processing...";
        progressBar.style.width = '30%';

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTabId = tabs[0].id;

            // Try to send a message to the content script to process the XML.
            chrome.tabs.sendMessage(currentTabId, { 
                command: "process_xml", 
                xml: xmlContent 
            }, (response) => {
                // Check for error/response to determine if content script is loaded
                if (chrome.runtime.lastError) {
                    // No response, inject the content script first
                    chrome.scripting.executeScript({
                        target: { tabId: currentTabId },
                        files: ['content.js']
                    }, () => {
                        // Send the command after a slight delay to ensure the script is ready.
                        setTimeout(() => {
                            chrome.tabs.sendMessage(currentTabId, { 
                                command: "process_xml", 
                                xml: xmlContent 
                            });
                        }, 200);
                    });
                } 
                // Status updates will now be handled by the content script sending messages back.
            });
        });
    };

    reader.onerror = () => {
        statusText.textContent = "Error reading file.";
        progressBar.style.width = '0%';
    };

    reader.readAsText(file);
});


// Listener to update status from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === "update_status") {
        statusText.textContent = request.message;
        progressBar.style.width = request.progress + '%';

        if (request.progress >= 100) {
            confirmButton.disabled = true;
            fileInput.disabled = true;
        }
    }
});
