// --- File start: background.js ---

console.log("Language Stream Service Worker is running.");

const SUBTITLE_URL_PATTERN = /^https:\/\/.*\.nflxvideo\.net\/subtitles\/.*o=\d+.*$/;
const SUBTITLE_TYPE_PATTERN = /timedtext\/dfxp/i;

/**
 * Listener function to capture the subtitle URL using the webRequest API.
 * This effectively replaces the manual DevTools process:
 * 1. It monitors all network requests on Netflix (*://*.nflxvideo.net).
 * 2. It checks the URL pattern (like the '?o=' query parameter you mentioned).
 * 3. It checks the content type (application/x-dfxp+xml) which confirms it's a TTML subtitle file.
 */
chrome.webRequest.onHeadersReceived.addListener(
    (details) => {
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
                console.log("Web Request API captured Netflix Subtitle URL:", url);

                // Save the captured URL to storage
                chrome.storage.local.set({
                    'captured_subtitle_url': url
                }).then(() => {
                    // Notify the active tab's popup
                    chrome.tabs.sendMessage(details.tabId, {
                        command: "subtitle_url_found",
                        url: url
                    }).catch(e => {
                        // Ignore error if content script isn't loaded or tab is gone
                    });
                }).catch(e => {
                    console.error("Error saving subtitle URL to storage:", e);
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
