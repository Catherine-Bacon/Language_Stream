// Function to find the subtitle element on the page
function getSubtitleElement() {
  // Netflix often changes its class names, so you may need to inspect the page
  // and find the current class. This is a common pattern.
  return document.querySelector('.player-timed-text-track');
}

// Function to send the subtitle text to the popup
function sendSubtitleToPopup(text) {
  // Use a message to communicate with the popup script
  chrome.runtime.sendMessage({ subtitle: text });
}

// Observe the DOM for changes to the subtitle element
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' || mutation.type === 'characterData') {
      const subtitleElement = getSubtitleElement();
      if (subtitleElement) {
        // Get the full text from the subtitle element
        const subtitleText = subtitleElement.textContent;
        // Send it to your popup.js file
        sendSubtitleToPopup(subtitleText);
      }
    }
  });
});

// Start observing the video player container for changes
const playerContainer = document.querySelector('.PlayerControls--container');
if (playerContainer) {
  observer.observe(playerContainer, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}