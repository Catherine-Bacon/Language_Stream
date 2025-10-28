// background.js (Service Worker)

console.log("Service Worker registered and running.");

// Simple fetch function that runs in the privileged Service Worker context
async function fetchSubtitleContent(url) {
    try {
        // The Service Worker bypasses CORS for declared host_permissions
        const response = await fetch(url);
        
        if (!response.ok) {
            // Check for specific error status codes
            if (response.status === 403) {
                 return { error: "403_FORBIDDEN" };
            }
            // Use text() for general HTTP error message
            const errorText = await response.text();
            return { error: `HTTP_ERROR: ${response.status} ${response.statusText}`, details: errorText.substring(0, 500) };
        }
        
        // Return the content as text
        const content = await response.text();
        return { content: content };
        
    } catch (e) {
        // Network or fetch API error
        console.error("Fetch failed in Service Worker:", e);
        return { error: `NETWORK_FAIL: ${e.message}` };
    }
}

// Listener to handle messages from content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Only intercept content fetching requests
    if (request.command === "fetch_content_for_prime" || 
        request.command === "fetch_content_for_netflix" || 
        request.command === "fetch_content_for_disney") {
        
        // Need to return true to indicate an asynchronous response will be sent
        (async () => {
            console.log(`Service Worker fetching content for: ${request.url}`);
            const fetchResult = await fetchSubtitleContent(request.url);
            
            // Relay the result (either content or an error) back to the content script
            sendResponse(fetchResult);
        })();
        return true; 
    }
    
    // For other commands (like update_status, check_language_pair, etc.), do nothing here.
    return false;
});