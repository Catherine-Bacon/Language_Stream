// --- File start: background.js ---

// 1. Listen for network requests on Netflix tabs
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        const url = details.url;

        // Check for the Netflix subtitle URL pattern: 
        // 1. Must be a fetch/xhr request (type)
        // 2. Must contain the unique subtitle parameters (?o=1&v=...)
        if (details.type === "xmlhttprequest" && url.includes("?o=1&v=")) {
            
            console.log("Captured Netflix Subtitle URL:", url);

            // Save the captured URL to storage where popup.js can find it.
            chrome.storage.local.set({ 
                'captured_subtitle_url': url
            });

            // Optional: Send a message to the active tab/popup to notify it was found.
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        command: "subtitle_url_found",
                        url: url
                    }).catch(e => {
                        // Ignore error if popup or content script isn't listening
                    });
                }
            });
        }
    },
    // Filter only requests on Netflix domains
    { urls: ["*://*.netflix.com/*"] },
    ["requestBody"]
);
