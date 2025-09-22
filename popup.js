// Language selection and confirmation logic
const baseLanguageSelect = document.getElementById('baseLanguage');
const targetLanguageSelect = document.getElementById('targetLanguage');
const confirmButton = document.getElementById('confirmButton');

// Listen for the confirm button click
confirmButton.addEventListener('click', () => {
  const baseLanguage = baseLanguageSelect.value;
  const targetLanguage = targetLanguageSelect.value;
  
  chrome.storage.local.set({ baseLanguage, targetLanguage }, () => {
    alert(`Languages set to: ${baseLanguage} and ${targetLanguage}.`);
  });
});

// Listener to receive subtitles from the content script
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.subtitle) {
    const { baseLanguage, targetLanguage } = await chrome.storage.local.get(['baseLanguage', 'targetLanguage']);
    
    if (!baseLanguage || !targetLanguage) {
      // If languages are not set, send a message to content.js to update its UI
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
      const translator = await initialiseTranslator(targetLanguage, baseLanguage);
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

// A small utility function that can be used by the listener
async function detectLanguage(text) {
  const detector = await initialiseLanguageDetector();
  if (!detector) return "unknown";
  const results = await detector.detect(text);
  const topResult = results[0];
  return (topResult && topResult.confidence > 0.5) ? topResult.detectedLanguage : "unknown";
}
async function initialiseLanguageDetector() {
  if (!('LanguageDetector' in self)) return null;
  const detector = await LanguageDetector.create();
  return detector;
}
async function initialiseTranslator(sourceLang, targetLang) {
  if (!('Translator' in self)) return null;
  const translator = await Translator.create({ sourceLanguage: sourceLang, targetLanguage: targetLang });
  return translator;
}