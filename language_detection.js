// language-detection.js

/**
 * Initialises the Language Detector API.
 * @returns {Promise<object|null>} The detector object or null if not available.
 */
export async function initialiseLanguageDetector() {
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

/**
 * Detects the language of a given text.
 * @param {string} text - The text to analyse.
 * @returns {Promise<string>} The detected language or 'unknown'.
 */
export async function detectLanguage(text) {
  const detector = await initialiseLanguageDetector();
  if (!detector) {
    return "unknown";
  }
  const results = await detector.detect(text);
  const topResult = results[0];
  return (topResult && topResult.confidence > 0.5) ? topResult.detectedLanguage : "unknown";
}