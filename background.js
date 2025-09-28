// --- File start: background.js ---

console.log("Language Stream Service Worker is running.");

const SUBTITLE_URL_PATTERN = /^https:\/\/.*\.nflxvideo\.net\/subtitles\/.*o=\d+.*$/;
const SUBTITLE_TYPE_PATTERN = /timedtext\/dfxp/i;

/**
 * Sends a message robustly to a specific tab ID.
 * Handles the potential for the tab's content script not being ready.
 */
function sendTabMessage(tabId, message) {
    return new Promise((resolve, reject) => {
        // Use a slight delay to ensure the service worker context is fully initialized
        setTimeout(() => {
             chrome.tabs.sendMessage(tabId, message, (response) => {
                if (chrome.runtime.lastError) {
                    // Ignore "Receiving end does not exist" and similar errors
                    // which are common if the content script hasn't loaded yet.
                    console.warn(`[BG] Message failed to tab ${tabId}. Last Error: ${chrome.runtime.lastError.message}`);
                    reject(chrome.runtime.lastError.message);
                } else {
                    resolve(response);
                }
            });
        }, 50); // Small delay
    });
}


/**
 * Listener function to capture the subtitle URL using the webRequest API.
 */
chrome.webRequest.onHeadersReceived.addListener(
    (details) => {
        // Ensure we are processing a valid tab and an XMLHttpRequest
        if (details.tabId === -1 || details.type !== 'xmlhttprequest') {
            return;
        }

        const url = details.url;

        // 1. Check if the URL matches the known pattern (contains '?o=' and is from the video CDN)
        if (SUBTITLE_URL_PATTERN.test(url)) {
            let isSubtitle = false;

            // 2. Check content type from headers to confirm it's a TTML/DFXP file
            for (const header of details.responseHeaders) {
                if (header.name.toLowerCase() === 'content-type' && SUBTITLE_TYPE_PATTERN.test(header.value)) {
                    isSubtitle = true;
                    break;
                }
            }

            if (isSubtitle) {
                console.log("[BG] Web Request API captured Netflix Subtitle URL:", url);

                // Save the captured URL to storage
                chrome.storage.local.set({
                    'captured_subtitle_url': url
                }).then(() => {
                    // Notify the active tab's popup
                    sendTabMessage(details.tabId, {
                        command: "subtitle_url_found",
                        url: url
                    }).catch(e => {
                        // Error handled inside sendTabMessage
                    });
                }).catch(e => {
                    console.error("[BG] Error saving subtitle URL to storage:", e);
                });
            }
        }
    },
    {
        // Filters: Limit monitoring to the Netflix video content domain
        urls: ["*://*.nflxvideo.net/*"],
        types: ["xmlhttprequest"]
    },
    ["responseHeaders"] // Must be specified to inspect headers
);
