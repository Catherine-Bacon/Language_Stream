// Language selection and confirmation logic
const baseLanguageSelect = document.getElementById('baseLanguage');
const targetLanguageSelect = document.getElementById('targetLanguage');
const confirmButton = document.getElementById('confirmButton');

// Listen for the confirm button click
confirmButton.addEventListener('click', () => {
  const baseLanguage = baseLanguageSelect.value;
  const targetLanguage = targetLanguageSelect.value;
  
  chrome.storage.local.set({ baseLanguage, targetLanguage }, () => {
    // Send a message to the content script to create the window
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      // Check if the content script is ready to receive messages
      chrome.tabs.sendMessage(tabs[0].id, { command: "ping" }, function(response) {
        if (chrome.runtime.lastError) {
          console.error("Content script not ready:", chrome.runtime.lastError.message);
          alert("Please reload the Netflix page and try again.");
        } else {
          // If the ping is successful, send the create_window command
          chrome.tabs.sendMessage(tabs[0].id, { command: "create_window" });
          alert(`Languages set to: ${baseLanguage} and ${targetLanguage}.`);
        }
      });
    });
  });
});

// Listener to receive subtitles from the content script
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.subtitle) {
    const { baseLanguage, targetLanguage } = await chrome.storage.local.get(['baseLanguage', 'targetLanguage']);
    
    if (!baseLanguage || !targetLanguage) {
      chrome.tabs.sendMessage(sender.tab.id, { translatedText: "Please select languages in the extension popup." });
      return;
    }
    
    // Process the subtitle
    const detectedLang = await detectLanguage(request.subtitle);
    
    let baseText = '';
    let translatedText = '';

    if (detectedLang === baseLanguage) {
      baseText = request.subtitle;
      const translator = await initialiseTranslator(baseLanguage, targetLanguage);
      if (translator) {
        translatedText = await translator.translate(request.subtitle);
      }
    } else if (detectedLang === targetLanguage) {
      translatedText = request.subtitle;
      const translator = await initialiseTranslator(targetLang, baseLanguage);
      if (translator) {
        baseText = await translator.translate(request.subtitle);
      }
    }

    // Combine the base and translated text for display
    const htmlOutput = `
      <p><b>${baseLanguage.toUpperCase()}:</b> ${baseText}</p>
      <p><b>${targetLanguage.toUpperCase()}:</b> ${translatedText}</p>
    `;

    // Send the final HTML back to the content script to display in the floating window
    chrome.tabs.sendMessage(sender.tab.id, { translatedText: htmlOutput });
  }
});