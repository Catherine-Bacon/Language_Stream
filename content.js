// content.js

// This file is designed to be injected.
// Check if an instance of the window already exists
const existingWindow = document.getElementById('language-stream-window');
if (existingWindow) {
    existingWindow.remove();
}

let floatingWindow = null;
let subtitleObserver = null;

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
  floatingWindow = windowDiv;
  makeDraggable(floatingWindow);
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
  if (request.command === "create_window") {
    createFloatingWindow();
    
    // Start observing only after the window is created
    const playerContainer = document.querySelector('.PlayerControls--container');
    if (playerContainer) {
      subtitleObserver.observe(playerContainer, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }
  }
  // The popup no longer sends translated text. The content script handles everything.
});

// The observer that will watch for subtitle changes
subtitleObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        const subtitleElement = getNetflixSubtitleElement();
        if (subtitleElement && subtitleElement.textContent.trim() !== '') {
          // Display the subtitle directly in the floating window
          if (floatingWindow) {
            floatingWindow.innerHTML = subtitleElement.textContent.trim();
          }
        }
      }
    });
});