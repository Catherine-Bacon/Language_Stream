// Add a listener to receive messages from the content script
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.subtitle) {
      // Get the textarea element from the popup's HTML
      const inputText = document.getElementById('inputText');
      // Update the value of the textarea with the new subtitle text
      inputText.value = request.subtitle;

      // Automatically trigger the translation process
      // Assuming you have a function called 'processTranslation' in your main JS file
      processTranslation(request.subtitle);
    }
  }
);