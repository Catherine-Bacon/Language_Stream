// Initialises the Language Detector API
async function initialiseLanguageDetector() {
  if ('LanguageDetector' in self) {
    try {
      const detector = await LanguageDetector.create({
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            console.log(`Model download progress: ${e.loaded * 100}%`);
          });
        },
      });
      console.log("Language detector instance created successfully.");
      return detector;
    } catch (error) {
      console.error("Failed to initialise Language Detector:", error);
      return null;
    }
  } else {
    console.log("Language Detector API is not supported in this browser.");
    return null;
  }
}

// Use the API to detect language
async function detectLanguage(text) {
  const detector = await initialiseLanguageDetector();
  if (detector) {
    const results = await detector.detect(text);
    const topResult = results[0];
    if (topResult && topResult.confidence > 0.5) { // Use a confidence threshold
      return `Language: ${topResult.detectedLanguage} (Confidence: ${Math.round(topResult.confidence * 100)}%)`;
    } else {
      return "Could not detect the language with high confidence.";
    }
  }
  return "Language Detector not available.";
}

// Retrieve HTML elements
const detectButton = document.getElementById('detectButton');
const inputText = document.getElementById('inputText');
const resultsSpan = document.getElementById('results');

// Add a click event listener to the button
detectButton.addEventListener('click', async () => {
  const text = inputText.value; // Get the text from the textarea
  if (text.trim() === '') {
    resultsSpan.textContent = "Please enter some text.";
    return;
  }
  
  resultsSpan.textContent = "Detecting..."; // Show a loading message
  const resultText = await detectLanguage(text);
  resultsSpan.textContent = resultText; // Display the final result
});