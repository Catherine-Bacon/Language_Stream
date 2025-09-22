// Global variable to store the floating window element
let floatingWindow = null;
let subtitleObserver = null;

// Function to find the Netflix subtitle element
function getNetflixSubtitleElement() {
  return document.querySelector('.player-timed-text-track');
}

// Function to create and inject the floating window
function createFloatingWindow() {
  if (floatingWindow) {
    console.log("Floating window already exists.");
    return;
  }
  const windowDiv = document.createElement('div');
  windowDiv.id = 'language-stream-window';
  windowDiv.style.cssText = `
    position: absolute;
    top: 50px;
    left: 50px;
    width: 400px;
    min-height: 100px;
    background-color: rgba(0, 0, 0, 0.8);
    border: 1px solid #333;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
    z-index: 9999;
    padding: 15px;
    color: white;
    font-family: Arial, sans-serif;
    resize: both;
    overflow: auto;
    cursor: move;
  `;
  document.body.appendChild(windowDiv);
  floatingWindow = windowDiv;
  makeDraggable(floatingWindow);
}

// Function to make the window draggable
function makeDraggable(element) {
  let isDragging = false;
  let offsetX, offsetY;

  element.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - element.getBoundingClientRect().left;
    offsetY = e.clientY - element.getBoundingClientRect().top;
    element.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      element.style.left = (e.clientX - offsetX) + 'px';
      element.style.top = (e.clientY - offsetY) + 'px';
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    element.style.cursor = 'move';
  });
}

// Function to send subtitles to the popup
function sendSubtitleToPopup(text) {
  chrome.runtime.sendMessage({ subtitle: text });
}

// Add a listener to receive messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "ping") {
    sendResponse({ status: "ready" });
    return true; // Keep the message channel open
  }
  if (request.command === "create_window") {
    createFloatingWindow();
    return false;
  }
  if (request.translatedText) {
    if (floatingWindow) {
      floatingWindow.innerHTML = request.translatedText;
    }
    return false;
  }
});

// Observe the Netflix player for subtitle changes
subtitleObserver = new MutationObserver((mutations) => {
  if (!floatingWindow) {
    return; // Do nothing until the window is created
  }
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' || mutation.type === 'characterData') {
      const subtitleElement = getNetflixSubtitleElement();
      if (subtitleElement && subtitleElement.textContent.trim() !== '') {
        sendSubtitleToPopup(subtitleElement.textContent.trim());
      }
    }
  });
});

const playerContainer = document.querySelector('.PlayerControls--container');
if (playerContainer) {
  subtitleObserver.observe(playerContainer, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}