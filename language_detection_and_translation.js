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

// NOTE: All redundant declarations removed from here.

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