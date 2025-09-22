// Get HTML elements from main.html
const liveSubtitlesDiv = document.getElementById('liveSubtitles');

// Add a listener to receive messages from the content script
chrome.runtime.onMessage.addListener(
  async function(request, sender, sendResponse) {
    if (request.subtitle) {
      // Get the selected languages from chrome storage
      const languages = await chrome.storage.local.get(['baseLanguage', 'targetLanguage']);
      const baseLang = languages.baseLanguage;
      const targetLang = languages.targetLanguage;

      if (!baseLang || !targetLang) {
        // Stop if languages are not set
        liveSubtitlesDiv.textContent = "Please select languages and click 'Confirm'.";
        return;
      }

      // Detect the language of the incoming subtitle text
      const detectedLang = await detectLanguage(request.subtitle);
      
      let baseText = '';
      let translatedText = '';

      if (detectedLang === baseLang) {
        baseText = request.subtitle;
        // Translate the subtitle text to the target language
        const translator = await initialiseTranslator(baseLang, targetLang);
        if (translator) {
          translatedText = await translator.translate(request.subtitle);
        }
      } else if (detectedLang === targetLang) {
        // If the subtitle text is in the target language, translate it back to the base language
        translatedText = request.subtitle;
        const translator = await initialiseTranslator(targetLang, baseLang);
        if (translator) {
          baseText = await translator.translate(request.subtitle);
        }
      }

      // Display the subtitles line by line
      if (baseText && translatedText) {
        liveSubtitlesDiv.innerHTML = `
          <p><b>${baseLang.toUpperCase()}:</b> ${baseText}</p>
          <p><b>${targetLang.toUpperCase()}:</b> ${translatedText}</p>
        `;
      }
    }
  }
);