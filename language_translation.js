// Import the necessary function from the other module
import { detectLanguage } from './language_detection.js';

/**
 * Initialises the Translator API for a specific language pair.
 * @param {string} sourceLang - The source language.
 * @param {string} targetLang - The target language.
 * @returns {Promise<object|null>} The translator object or null if not available.
 */
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