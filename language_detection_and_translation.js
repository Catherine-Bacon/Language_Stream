// LANGUAGE DETECTION
async function initialiseLanguageDetector() {
  if (!('LanguageDetector' in self)) {
    console.error("Language Detector API is not supported.");
    return null;
  }
  try {
    const detector = await LanguageDetector.create();
    return detector;
  } catch (error) {
    console.error("Failed to initialise Language Detector:", error);
    return null;
  }
}

async function detectLanguage(text) {
  const detector = await initialiseLanguageDetector();
  if (!detector) {
    return "unknown";
  }
  const results = await detector.detect(text);
  const topResult = results[0];
  return (topResult && topResult.confidence > 0.5) ? topResult.detectedLanguage : "unknown";
}

// LANGUAGE TRANSLATION:
async function initialiseTranslator(sourceLang, targetLang) {
  if (!('Translator' in self)) {
    console.error("Translator API is not supported.");
    return null;
  }
  try {
    const translator = await Translator.create({
      sourceLanguage: sourceLang,
      targetLanguage: targetLang
    });
    return translator;
  } catch (error) {
    console.error("Failed to initialise Translator:", error);
    return null;
  }
}

// Get HTML elements
const detectButton = document.getElementById('detectButton');
const translateButton = document.getElementById('translateButton');
const inputText = document.getElementById('inputText');
const detectedLanguageSpan = document.getElementById('detectedLanguage');
const targetLanguageSelect = document.getElementById('targetLanguage');
const translatedTextSpan = document.getElementById('translatedText');

let sourceLanguage = '';

// Event listener for the "Detect Language" button
detectButton.addEventListener('click', async () => {
    const text = inputText.value.trim();
    if (text === '') {
        detectedLanguageSpan.textContent = "Please enter some text.";
        return;
    }
    detectedLanguageSpan.textContent = "Detecting...";
    sourceLanguage = await detectLanguage(text);
    detectedLanguageSpan.textContent = sourceLanguage === 'unknown' ? 'Could not detect language.' : sourceLanguage;
});

// Event listener for the "Translate" button
translateButton.addEventListener('click', async () => {
    const text = inputText.value.trim();
    const targetLanguage = targetLanguageSelect.value;

    if (text === '') {
        translatedTextSpan.textContent = "Please enter some text.";
        return;
    }

    if (sourceLanguage === '') {
        translatedTextSpan.textContent = "Please detect the source language first.";
        return;
    }

    translatedTextSpan.textContent = "Translating...";

    const translator = await initialiseTranslator(sourceLanguage, targetLanguage);
    if (translator) {
        try {
            const translatedText = await translator.translate(text);
            translatedTextSpan.textContent = translatedText;
        } catch (error) {
            console.error("Translation failed:", error);
            translatedTextSpan.textContent = "Translation failed.";
        }
    } else {
        translatedTextSpan.textContent = "Translator not available for this language pair.";
    }
});