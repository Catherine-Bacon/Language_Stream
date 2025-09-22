let floatingWindow = null;
let subtitleObserver = null;

// Function to find the Netflix subtitle element with the corrected selector
function getNetflixSubtitleElement() {
  return document.querySelector('.player-timedtext-text-container');
}

// Function to create and inject the floating window
function createFloatingWindow() {
  // Check if an instance of the window already exists.
  const existingWindow = document.getElementById('language-stream-window');
  if (existingWindow) {
    // If it does, don't create a new one.
    console.log("Floating window already exists. Reusing it.");
    floatingWindow = existingWindow;
  } else {
    // If it doesn't, create it.
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
}

// Function to make the window draggable (no changes)
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

// Add a listener to receive messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "ping") {
    sendResponse({ status: "ready" });
    return true; // Keep the message channel open
  }
  if (request.command === "create_window") {
    console.log("Received create_window command. Creating window.");
    createFloatingWindow();
    return false;
  }
});

// The observer that will watch for subtitle changes
// This now starts immediately when the script is injected
subtitleObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        const subtitleElement = getNetflixSubtitleElement();
        if (subtitleElement && subtitleElement.textContent.trim() !== '') {
          if (floatingWindow) {
              floatingWindow.innerHTML = subtitleElement.textContent.trim();
          }
        }
      }
    });
});

const playerContainer = document.querySelector('.watch-video--player-view'); // Corrected selector
if (playerContainer) {
    subtitleObserver.observe(playerContainer, {
      childList: true,
      subtree: true,
      characterData: true,
    });
}