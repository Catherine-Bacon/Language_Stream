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

// LANGUAGE TRANSLATION
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

// Global variables for user's selected languages
let baseLanguage = '';
let targetLanguage = '';

// Get HTML elements
const baseLanguageSelect = document.getElementById('baseLanguage');
const targetLanguageSelect = document.getElementById('targetLanguage');
const confirmButton = document.getElementById('confirmButton');

// Event listener for the "Confirm Languages" button
confirmButton.addEventListener('click', () => {
  baseLanguage = baseLanguageSelect.value;
  targetLanguage = targetLanguageSelect.value;
  
  // Save languages to chrome storage so content.js can access them
  chrome.storage.local.set({
    baseLanguage: baseLanguage,
    targetLanguage: targetLanguage
  });
  
  console.log(`Languages confirmed: Base: ${baseLanguage}, Target: ${targetLanguage}`);
  alert(`Languages set to: ${baseLanguage} and ${targetLanguage}. You can now start the show.`);
});