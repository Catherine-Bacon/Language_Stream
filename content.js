// Function to find the Netflix subtitle element
function getNetflixSubtitleElement() {
  return document.querySelector('.player-timed-text-track');
}

// Function to create and inject the floating window
function createFloatingWindow() {
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
  return windowDiv;
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

// Get or create the floating window
const floatingWindow = createFloatingWindow();
makeDraggable(floatingWindow);

// Add a listener to receive translated text from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.translatedText) {
    floatingWindow.innerHTML = request.translatedText;
  }
});

// Observe the Netflix player for subtitle changes
const observer = new MutationObserver((mutations) => {
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
  observer.observe(playerContainer, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}