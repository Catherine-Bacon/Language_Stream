let floatingWindow = null;
let subtitleObserver = null;
let mainObserver = null;

// Function to find the Netflix subtitle element with the corrected selector
function getNetflixSubtitleElement() {
  return document.querySelector('.player-timedtext-text-container');
}

// Function to create and inject the floating window
function createFloatingWindow() {
  const existingWindow = document.getElementById('language-stream-window');
  if (existingWindow) {
    console.log("Floating window already exists. Reusing it.");
    floatingWindow = existingWindow;
  } else {
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
    return true;
  }
  if (request.command === "create_window") {
    console.log("Received create_window command. Creating window.");
    createFloatingWindow();
    return false;
  }
});

// The main observer to detect when the subtitle element appears on the page
mainObserver = new MutationObserver((mutations) => {
  const subtitleContainer = getNetflixSubtitleElement();
  if (subtitleContainer) {
    // Subtitle container found, disconnect the main observer
    mainObserver.disconnect();
    
    // Attach the new, more specific observer to the subtitle container
    subtitleObserver = new MutationObserver(() => {
        const subtitleText = subtitleContainer.textContent.trim();
        if (subtitleText !== '') {
            if (floatingWindow) {
                floatingWindow.innerHTML = subtitleText;
            }
        }
    });

    subtitleObserver.observe(subtitleContainer, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    console.log("Subtitle observer attached.");
  }
});

// Start the main observer to watch the entire body for the subtitle container
mainObserver.observe(document.body, {
  childList: true,
  subtree: true,
});