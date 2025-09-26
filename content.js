let floatingWindow = null;
let subtitleObserver = null;

// Function to find the Netflix subtitle element
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

  // Once the window is created, immediately try to start the subtitle observer
  startSubtitleObserver();
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

// The core logic to observe the subtitle text changes
function startSubtitleObserver() {
    const subtitleElement = getNetflixSubtitleElement();

    if (subtitleObserver) {
        subtitleObserver.disconnect();
    }

    if (subtitleElement) {
        subtitleObserver = new MutationObserver((mutations) => {
            // Read the text content from the subtitle container
            const subtitleText = subtitleElement.textContent.trim();
            
            if (subtitleText !== '' && floatingWindow) {
                // Update the floating window's content
                floatingWindow.innerHTML = subtitleText;
            }
        });

        // Observe the subtitle element and all its children for:
        // childList: when a new <span/> is added (e.g., first subtitle appears)
        // subtree: to watch all the nested span elements
        // characterData: when the actual text inside the span changes (most common update)
        subtitleObserver.observe(subtitleElement, {
            childList: true,
            subtree: true,
            characterData: true,
            // Also observe attributes, as the 'display:none' attribute might change
            attributes: true,
            attributeFilter: ['style', 'class']
        });
        console.log("Subtitle observer is active and watching the subtitle element.");
    } else {
        // If the subtitle element is not found immediately, retry later.
        console.log("Subtitle element not found yet. Retrying in 1 second.");
        setTimeout(startSubtitleObserver, 1000);
    }
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