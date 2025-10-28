// --- SAFE GLOBAL VARIABLE INITIALIZATION ---
var floatingWindow = floatingWindow || null;
var parsedSubtitles = parsedSubtitles || [];
var syncInterval = syncInterval || null;
var subtitleLanguages = subtitleLanguages || { base: '', target: '' };
var translationCache = translationCache || {};
var isTranslatedOnly = isTranslatedOnly || false;
var fontSizeEm = 'medium';
var backgroundColorPref = 'black';
var backgroundAlphaPref = 1.0;
var fontColorAlphaPref = 1.0;
var fontShadowPref = 'black_shadow';
var fontColorPref = 'white';
var subtitleStylePref = 'netflix';
var isProcessing = isProcessing || false;
var isCancelled = isCancelled || false;
var currentTranslator = currentTranslator || null;
var TICK_RATE = TICK_RATE || 10000000;

function sendStatusUpdate(message, progress, url = null, route = 'main') {
    if (isCancelled) return; // FIX: Prevents any status updates after cancellation.
    chrome.storage.local.set({ 'ls_status': { message: message, progress: progress, baseLang: subtitleLanguages.base, targetLang: subtitleLanguages.target, url: progress < 100 ? url : null } }).catch(e => console.error("Could not save status to storage:", e));
    chrome.runtime.sendMessage({ command: "update_status", message: message, progress: progress, route: route }).catch(e => { if (!e.message.includes('Receiving end does not exist')) console.warn("Content Script Messaging Error:", e); });
}

function ticksToSeconds(tickString) {
    if (!tickString) return 0;
    const tickValue = parseInt(tickString.replace('t', ''), 10);
    return tickValue / TICK_RATE;
}

// --- NEW: Helper function to convert VTT time (HH:MM:SS.mmm or MM:SS.mmm) to seconds ---
function vttTimeToSeconds(timeString) {
    const parts = timeString.split(':');
    let seconds = 0;
    try {
        if (parts.length === 3) { // HH:MM:SS.mmm
            seconds += parseInt(parts[0], 10) * 3600;
            seconds += parseInt(parts[1], 10) * 60;
            seconds += parseFloat(parts[2]);
        } else if (parts.length === 2) { // MM:SS.mmm
            seconds += parseInt(parts[0], 10) * 60;
            seconds += parseFloat(parts[1]);
        } else {
            seconds = parseFloat(timeString); // Failsafe for just seconds
        }
        return seconds;
    } catch(e) {
        console.error("Error parsing VTT time:", timeString, e);
        return 0;
    }
}

// --- NEW HELPER FUNCTION TO GET CORRECT PLAYER TIME ---
function getPlayerCurrentTime(videoElement) {
    // 1. Try to find the Disney+ UI time element
    // This is more reliable than video.currentTime which can be for a segment
    const disneyTimeElement = document.querySelector('.btm-time-current');
    if (disneyTimeElement && disneyTimeElement.textContent) {
        const timeString = disneyTimeElement.textContent.trim();
        // Use our existing vttTimeToSeconds to parse UI time like "1:05:30" or "05:30"
        const uiTime = vttTimeToSeconds(timeString);
        if (!isNaN(uiTime) && uiTime > 0) {
            return uiTime;
        }
    }

    // 2. Fallback for Netflix, YouTube, or if Disney UI not found
    return videoElement.currentTime;
}
// --- END NEW HELPER FUNCTION ---


function getNetflixVideoElement() {
    const playerView = document.querySelector('.watch-video--player-view');
    if (playerView) return playerView.querySelector('video');
    return document.querySelector('video[src*="blob"]');
}

function getNetflixPlayerContainer() {
    return document.querySelector('.watch-video--player-view');
}

// --- RENAMED: from fetchXmlContent to be more generic ---
async function fetchSubtitleContent(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 403) throw new Error("403_FORBIDDEN");
            throw new Error(`HTTP error! status: ${response.status} (${response.statusText})`);
        }
        return await response.text();
    } catch (e) {
        if (e.message === "403_FORBIDDEN") sendStatusUpdate("Old subtitle URL used; please repeat URL retrieval steps.", 0, url, 'url');
        else sendStatusUpdate(`Error fetching subtitles: ${e.message}. Check URL or network permissions.`, 0, url, 'url');
        return null;
    }
}

function parseTtmlXml(xmlString, url) {
    parsedSubtitles = [];
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
        const errorNode = xmlDoc.querySelector('parsererror');
        if (errorNode) {
            console.error("XML Parsing Error:", errorNode.textContent);
            sendStatusUpdate(`Invalid URL retrieved - please repeat URL retrieval steps`, 0, url, 'url');
            return false;
        }
        const subtitleParagraphs = xmlDoc.querySelectorAll('p');
        subtitleParagraphs.forEach((p) => {
            const beginTick = p.getAttribute('begin');
            const endTick = p.getAttribute('end');
            let rawHtml = p.innerHTML;
            let htmlWithSpaces = rawHtml.replace(/<br[\s\S]*?\/>|<br>/gi, ' ');
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlWithSpaces;
            let text = tempDiv.textContent.replace(/\s+/g, ' ').trim();
            if (beginTick && endTick && text) {
                // MODIFICATION: Add color lists for Vocab mode
                parsedSubtitles.push({ 
                    begin: ticksToSeconds(beginTick), 
                    end: ticksToSeconds(endTick), 
                    text: text, 
                    translatedText: null, 
                    baseWordColors: null, // New field for color codes/markers
                    translatedWordColors: null // New field for color codes/markers
                });
            }
        });
        console.log(`Successfully parsed ${parsedSubtitles.length} subtitles.`);
        return true;
    } catch (e) {
        console.error("Fatal error during XML parsing:", e);
        sendStatusUpdate("Invalid URL retrieved - please repeat URL retrieval steps", 0, url, 'url');
        return false;
    }
}

// --- NEW: Parser for Disney+ VTT format ---
function parseVttContent(vttString, url) {
    parsedSubtitles = [];
    try {
        // Split cues by double newline
        const cues = vttString.split('\n\n');
        
        // Regex to match the timestamp line
        const timeRegex = /([\d:.]+) --> ([\d:.]+)/;

        for (const cue of cues) {
            const trimmedCue = cue.trim();
            
            // Skip headers
            if (trimmedCue.toUpperCase().startsWith('WEBVTT') || trimmedCue.toUpperCase().startsWith('STYLE')) {
                continue;
            }
            
            const lines = trimmedCue.split('\n');
            if (lines.length < 2) continue; // Need at least timestamp + text

            const timeMatch = lines[0].match(timeRegex);
            
            if (timeMatch) {
                const begin = vttTimeToSeconds(timeMatch[1]);
                const end = vttTimeToSeconds(timeMatch[2]);
                
                // Join all text lines, strip HTML, and clean up
                const rawHtml = lines.slice(1).join(' ');
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = rawHtml;
                const text = tempDiv.textContent.replace(/\s+/g, ' ').trim();

                if (text) {
                    parsedSubtitles.push({
                        begin: begin,
                        end: end,
                        text: text,
                        translatedText: null,
                        baseWordColors: null,
                        translatedWordColors: null
                    });
                }
            }
        }
        
        console.log(`Successfully parsed ${parsedSubtitles.length} VTT subtitles.`);
        return parsedSubtitles.length > 0;
    } catch (e) {
        console.error("Fatal error during VTT parsing:", e);
        sendStatusUpdate("Invalid Disney+ URL or content.", 0, url, 'url');
        return false;
    }
}


// --- NEW HELPER FUNCTION ---
// Detects language from a provided text snippet
function detectLanguageFromText(sampleText) {
    return new Promise((resolve) => {
        if (!chrome.i18n || !chrome.i18n.detectLanguage) {
            console.error("Chrome i18n.detectLanguage API not available. Defaulting to 'en'.");
            resolve('en'); // Default fallback
            return;
        }
        chrome.i18n.detectLanguage(sampleText, (result) => {
            const detectedCode = (result.languages && result.languages.length > 0 && result.languages[0].language !== 'und') ? result.languages[0].language : null;
            resolve(detectedCode); // Resolves with language code (e.g., 'en') or null
        });
    });
}
// --- END NEW HELPER FUNCTION ---

// Detects language from the globally parsed subtitles (for Netflix)
function detectBaseLanguage() {
    const sampleText = parsedSubtitles.slice(0, 50).map(sub => sub.text).join(' ').slice(0, 1000);
    // Uses the new helper function
    return detectLanguageFromText(sampleText); 
}


function createFloatingWindow() {
    let existingWindow = document.getElementById('language-stream-window');
    const textShadow = getFontShadowCss(fontShadowPref);
    const defaultFontColor = colorNameToRgba(fontColorPref, fontColorAlphaPref);
    if (existingWindow) {
        floatingWindow = existingWindow;
        floatingWindow.style.textShadow = textShadow;
        floatingWindow.style.color = defaultFontColor;
    } else {
        const windowDiv = document.createElement('div');
        windowDiv.id = 'language-stream-window';
        windowDiv.style.cssText = `position: absolute; bottom: 10%; left: 50%; transform: translateX(-50%); width: 90%; max-width: 1200px; min-height: 50px; background-color: rgba(0, 0, 0, 0); padding: 0; z-index: 9999; color: ${defaultFontColor}; font-family: 'Inter', sans-serif; font-size: 3.6rem; text-align: center; line-height: 1.4; cursor: grab; display: none; text-shadow: ${textShadow}; pointer-events: none;`;
        makeDraggable(windowDiv);
        
        // --- MODIFICATION: Find correct player container for Netflix or YouTube ---
        let playerContainer = getNetflixPlayerContainer(); // Try Netflix first
        if (!playerContainer) {
            // Fallback for YouTube
            playerContainer = document.getElementById('movie_player'); 
        }
        // NEW: Add Disney+ container
        if (!playerContainer) {
            playerContainer = document.querySelector('.btm-media-player-container') || document.getElementById('vader_Player');
        }
        
        const parentElement = playerContainer || document.body;
        parentElement.appendChild(windowDiv);
        
        // Only make relative if it's a known container
        if (playerContainer && (playerContainer.classList.contains('watch-video--player-view') || playerContainer.id === 'movie_player' || playerContainer.id === 'vader_Player' || playerContainer.classList.contains('btm-media-player-container'))) {
            playerContainer.style.position = 'relative';
        }
        // --- END MODIFICATION ---

        floatingWindow = windowDiv;
    }
}

function makeDraggable(element) {
    let isDragging = false;
    let offsetX, offsetY;
    const startDrag = (e) => {
        e.preventDefault();
        isDragging = true;
        element.style.pointerEvents = 'auto';
        const rect = element.getBoundingClientRect();
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        offsetX = clientX - rect.left;
        offsetY = clientY - rect.top;
        element.style.cursor = 'grabbing';
        element.style.position = 'fixed';
        element.style.left = rect.left + 'px';
        element.style.top = rect.top + 'px';
        element.style.transform = 'none';
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchmove', drag);
        document.addEventListener('touchend', stopDrag);
    };
    const drag = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        element.style.left = (clientX - offsetX) + 'px';
        element.style.top = (clientY - offsetY) + 'px';
    };
    const stopDrag = () => {
        isDragging = false;
        element.style.pointerEvents = 'none';
        element.style.cursor = 'grab';
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('touchend', stopDrag);
    };
    element.addEventListener('mousedown', startDrag);
    element.addEventListener('touchstart', startDrag);
}

async function translateSubtitle(textToTranslate, sourceLang, targetLang) {
    const cacheKey = `${sourceLang}-${targetLang}:${textToTranslate}`;
    if (translationCache[cacheKey]) return translationCache[cacheKey];
    if (!currentTranslator || currentTranslator.sourceLanguage !== sourceLang || currentTranslator.targetLanguage !== targetLang) {
        if (!('Translator' in self)) {
            console.error("ERROR: Chrome Translator API not supported.");
            return "(Translation Failed - API Missing)";
        }
        try {
            currentTranslator = await Translator.create({
                sourceLanguage: sourceLang,
                targetLanguage: targetLang,
                monitor(m) {
                    m.addEventListener('downloadprogress', (e) => {
                        const loaded = Math.floor(e.loaded * 100);
                        const overallProgress = 30 + Math.floor(loaded * 0.3);
                        sendStatusUpdate(`Downloading model: ${loaded}% complete.`, overallProgress);
                    });
                }
            });
            sendStatusUpdate("Translator model ready. Starting translation...", 60);
        } catch (e) {
            console.error("Native Translator API failed to create:", e);
            return "(Translation Failed - Model Setup Error)";
        }
    }
    try {
        const translatedText = await currentTranslator.translate(textToTranslate);
        if (translatedText) {
            translationCache[cacheKey] = translatedText.trim();
            return translatedText.trim();
        }
        throw new Error("Empty translation result.");
    } catch (e) {
        console.error(`Native translation failed for: "${textToTranslate}"`, e);
        return `(Translation Failed - Unavailable)`;
    }
}

// --- MODIFIED FUNCTION: Word-level translation and color coding for Vocab mode (Two Passes with Multi-Word Match) ---
async function processVocabColorCoding(subtitle) {
    // Helper to sanitize words for matching (removes punctuation, keeps spaces for phrase matching)
    const sanitizePhrase = (phrase) => phrase.toLowerCase().replace(/[.,/#!$%^&*;:{}=-_`~()]/g, "").trim();

    const baseWords = subtitle.text.split(/\s+/).filter(w => w.length > 0);
    const translatedWords = subtitle.translatedText.split(/\s+/).filter(w => w.length > 0);
    
    // Initialize color code lists: 0 will represent the 'unmatched' white color
    const baseWordColors = Array(baseWords.length).fill(0);
    const translatedWordColors = Array(translatedWords.length).fill(0);
    
    let colorCodeCounter = 1; // Start numbering matched groups from 1
    const baseLang = subtitleLanguages.base;
    const targetLang = subtitleLanguages.target;
    
    // --- PASS 1: Base Language (i) to Target Language (j) - Search for single/multi-word match ---
    for (let i = 0; i < baseWords.length; i++) {
        if (baseWordColors[i] !== 0) continue; // Skip if already matched
        
        const wordToTranslate = sanitizePhrase(baseWords[i]);
        if (wordToTranslate.length === 0) continue; 
        
        // 1. Get word-level translation (Base -> Target)
        const wordTranslation = await translateSubtitle(wordToTranslate, baseLang, targetLang);
        if (!wordTranslation || wordTranslation.includes('Translation Failed')) continue;

        const targetPhrase = sanitizePhrase(wordTranslation);
        const targetPhraseWords = targetPhrase.split(/\s+/).filter(w => w.length > 0);
        const matchLength = targetPhraseWords.length;

        // 2. Search for multi-word match in the translated subtitle
        for (let j = 0; j <= translatedWords.length - matchLength; j++) {
            // Check if the sequence of target words is currently uncolored
            let isUncolored = true;
            for (let k = 0; k < matchLength; k++) {
                if (translatedWordColors[j + k] !== 0) {
                    isUncolored = false;
                    break;
                }
            }
            if (!isUncolored) continue; // Skip if any part of the sequence is already matched

            // Construct the phrase from the subtitle for comparison
            const subtitlePhraseWords = translatedWords.slice(j, j + matchLength);
            const subtitlePhrase = sanitizePhrase(subtitlePhraseWords.join(' '));
            
            if (subtitlePhrase === targetPhrase) {
                // Match found: assign a new color code to the base word and the target phrase sequence
                baseWordColors[i] = colorCodeCounter;
                for (let k = 0; k < matchLength; k++) {
                    translatedWordColors[j + k] = colorCodeCounter;
                }
                colorCodeCounter++;
                break; // Found match for base word[i], move to next base word
            }
        }
    }

    // --- PASS 2: Translated Language (j) to Base Language (i) - Search for single/multi-word match ---
    for (let j = 0; j < translatedWords.length; j++) {
        if (translatedWordColors[j] !== 0) continue; // Skip if already matched
        
        const wordToTranslate = sanitizePhrase(translatedWords[j]);
        if (wordToTranslate.length === 0) continue;
        
        // 1. Get word-level back-translation (Target -> Base)
        const wordTranslation = await translateSubtitle(wordToTranslate, targetLang, baseLang);
        if (!wordTranslation || wordTranslation.includes('Translation Failed')) continue;
        
        const targetPhrase = sanitizePhrase(wordTranslation);
        const targetPhraseWords = targetPhrase.split(/\s+/).filter(w => w.length > 0);
        const matchLength = targetPhraseWords.length;
        
        // 2. Search for multi-word match in the base subtitle
        for (let i = 0; i <= baseWords.length - matchLength; i++) {
            // Check if the sequence of base words is currently uncolored
            let isUncolored = true;
            for (let k = 0; k < matchLength; k++) {
                if (baseWordColors[i + k] !== 0) {
                    isUncolored = false;
                    break;
                }
            }
            if (!isUncolored) continue; // Skip if any part of the sequence is already matched

            // Construct the phrase from the subtitle for comparison
            const subtitlePhraseWords = baseWords.slice(i, i + matchLength);
            const subtitlePhrase = sanitizePhrase(subtitlePhraseWords.join(' '));
            
            if (subtitlePhrase === targetPhrase) {
                // Match found: assign a new color code to the translated word and the base phrase sequence
                translatedWordColors[j] = colorCodeCounter;
                for (let k = 0; k < matchLength; k++) {
                    baseWordColors[i + k] = colorCodeCounter;
                }
                colorCodeCounter++;
                break; // Found match for translated word[j], move to next translated word
            }
        }
    }
    
    // Finalize the subtitle object with the color lists
    subtitle.baseWordColors = baseWordColors;
    subtitle.translatedWordColors = translatedWordColors;
    subtitle.colorCodeCount = colorCodeCounter; 
}

async function translateAllSubtitles(url) {
    const totalSubs = parsedSubtitles.length;
    const baseLang = subtitleLanguages.base;
    const targetLang = subtitleLanguages.target;
    const CRITICAL_BATCH_SIZE = 30;
    const criticalBatch = parsedSubtitles.slice(0, CRITICAL_BATCH_SIZE);
    const concurrentBatch = parsedSubtitles.slice(CRITICAL_BATCH_SIZE);
    const START_PROGRESS = 60;
    
    // --- MODIFICATION START: Adjust weights for Vocab style ---
    const isVocab = (subtitleStylePref === 'vocabulary');
    const TRANSLATION_WEIGHT = isVocab ? 20 : 30; // 20% for translation if Vocab, 30% otherwise
    const MATCHING_WEIGHT = isVocab ? 10 : 0;     // 10% for matching if Vocab, 0% otherwise
    const CRITICAL_BATCH_TOTAL_WEIGHT = TRANSLATION_WEIGHT + MATCHING_WEIGHT; // Total is 30% for all styles
    
    // The total weight for the concurrent batch needs to cover the remaining portion up to 100 (excluding initial 60)
    const CONCURRENT_TRANSLATION_WEIGHT = isVocab ? 20 : 30;
    const CONCURRENT_MATCHING_WEIGHT = isVocab ? 10 : 0;
    const CONCURRENT_BATCH_TOTAL_WEIGHT = CONCURRENT_TRANSLATION_WEIGHT + CONCURRENT_MATCHING_WEIGHT; // Total is 30% for all styles
    // --- MODIFICATION END ---
    
    sendStatusUpdate(`Translating first ${criticalBatch.length} lines for immediate playback...`, START_PROGRESS, url);
    
    // --- Phase 1: Critical Batch Translation and VOCAB PROCESSING ---
    for (let index = 0; index < criticalBatch.length; index++) {
        if (isCancelled) {
            console.log("Translation aborted.");
            throw new Error("ABORT_TRANSLATION");
        }
        const sub = criticalBatch[index];
        
        // 1. Translate the entire line
        sub.translatedText = await translateSubtitle(sub.text, baseLang, targetLang);
        
        // Calculate progress after main translation (for Vocab this is TRANSLATION_WEIGHT of the batch)
        let progress = START_PROGRESS + Math.floor(((index + 1) / criticalBatch.length) * TRANSLATION_WEIGHT);

        // 2. MODIFICATION: Process for word-level color coding if in Vocab mode
        if (isVocab && sub.translatedText && !sub.translatedText.includes('Translation Failed')) {
             await processVocabColorCoding(sub);
             // Increment progress by MATCHING_WEIGHT after word matching
             progress = START_PROGRESS + Math.floor(((index + 1) / criticalBatch.length) * CRITICAL_BATCH_TOTAL_WEIGHT);
        }
        
        sendStatusUpdate(`First ${index + 1} lines ready to watch!`, progress, url);
    }
    
    // --- Phase 2: Concurrent Batch Translation and VOCAB PROCESSING ---
    const CONCURRENT_START_PROGRESS = START_PROGRESS + CRITICAL_BATCH_TOTAL_WEIGHT;
    sendStatusUpdate(`First ${CRITICAL_BATCH_SIZE} lines ready! Starting background translation...`, CONCURRENT_START_PROGRESS, url);
    
    const translationPromises = concurrentBatch.map(async (sub, index) => {
        if (isCancelled) return Promise.resolve("ABORTED");
        
        // 1. Translate the entire line
        sub.translatedText = await translateSubtitle(sub.text, baseLang, targetLang);
        
        // 2. MODIFICATION: Process for word-level color coding if in Vocab mode
        if (isVocab && sub.translatedText && !sub.translatedText.includes('Translation Failed')) {
             await processVocabColorCoding(sub);
        }
        
        if (index % 5 === 0 || index === concurrentBatch.length - 1) {
            // Calculate total progress: START_PROGRESS + CRITICAL_BATCH_TOTAL_WEIGHT (for phase 1) 
            // + CONCURRENT_BATCH_TOTAL_WEIGHT (for phase 2, which covers both translation and matching if vocab)
            const progressRatio = (index + 1) / concurrentBatch.length;
            
            // Total progress = Start of Phase 2 + (Progress Ratio * Phase 2 Weight)
            const progress = CONCURRENT_START_PROGRESS + Math.floor(progressRatio * CONCURRENT_BATCH_TOTAL_WEIGHT);

            if (progress < 100) {
                const totalReady = CRITICAL_BATCH_SIZE + index + 1;
                sendStatusUpdate(`First ${totalReady} lines ready to watch!`, progress, url);
            }
        }
        return sub.translatedText;
    });
    
    await Promise.all(translationPromises);
    
    if (!isCancelled) {
        sendStatusUpdate(`Translation complete! ${totalSubs} lines ready.`, 100, url);
        console.log("Native translation process finished.");
    } else {
        console.log("Translation finished, but process was cancelled.");
    }
}

function getFontSizeEm(preference) {
    switch (preference) {
        case 'small': return '0.75em';
        case 'large': return '1.25em';
        default: return '1em';
    }
}

function getFontShadowCss(preference) {
    switch (preference) {
        case 'black_shadow': return '2px 2px 4px rgba(0, 0, 0, 0.8)';
        case 'white_shadow': return '1px 1px 2px rgba(255, 255, 255, 0.8), -1px -1px 2px rgba(255, 255, 255, 0.8)';
        default: return 'none';
    }
}

function colorNameToRgba(name, alpha) {
    let rgb = '255, 255, 255';
    switch (name) {
        case 'black': rgb = '0, 0, 0'; break;
        case 'gray': rgb = '128, 128, 128'; break;
        case 'yellow': rgb = '255, 255, 0'; break;
        case 'cyan': rgb = '0, 255, 255'; break;
        case 'red': rgb = '255, 0, 0'; break;
        case 'green': rgb = '0, 255, 0'; break;
        case 'blue': rgb = '0, 0, 255'; break;
        case 'magenta': rgb = '255, 0, 255'; break;
        case 'orange': rgb = '255, 165, 0'; break;
        case 'lime': rgb = '0, 255, 127'; break;
        case 'none': return 'transparent';
    }
    return `rgba(${rgb}, ${alpha})`;
}

// Helper to get a color from the color code (1, 2, 3...)
function getIndexedColor(index, alpha) {
    const colors = [
        'white', 'red', 'green', 'blue', 'magenta', 'yellow', 
        'cyan', 'orange', 'lime', 'pink', 'teal'
    ];
    // Use index - 1 because our color codes start at 1 (0 is default/white)
    const colorName = colors[(index - 1) % colors.length] || 'white';
    return colorNameToRgba(colorName, alpha);
}

function startSubtitleSync(videoElement) {
    if (syncInterval) clearInterval(syncInterval);
    let currentSubtitleIndex = -1;
    let lastTime = 0;
    if (floatingWindow) floatingWindow.style.display = 'block';

    const currentFontSizeEm = getFontSizeEm(fontSizeEm);
    const currentFontShadow = getFontShadowCss(fontShadowPref);
    const baseFontColor = colorNameToRgba(fontColorPref, fontColorAlphaPref);
    let currentSpanBgColor = colorNameToRgba(backgroundColorPref, backgroundAlphaPref);
    const fontWeight = (subtitleStylePref === 'netflix') ? 'bold' : 'normal';

    if (subtitleStylePref === 'netflix' || subtitleStylePref === 'vocabulary') {
        currentSpanBgColor = 'transparent';
    }

    if (floatingWindow) {
        floatingWindow.style.textShadow = currentFontShadow;
        floatingWindow.style.color = baseFontColor; // Set base window color
    }
    
    const getSpanStyle = (colorOverride = null) => {
        const finalColor = colorOverride || baseFontColor;
        // Vocab mode uses a simpler text color, so we use white for base lines unless color-coded
        const finalBgColor = (subtitleStylePref === 'vocabulary') ? colorNameToRgba('none', 0) : currentSpanBgColor;

        return `display: inline-block; padding: 0 0.2em; border-radius: 0.2em; background-color: ${finalBgColor}; font-size: ${currentFontSizeEm}; font-weight: ${fontWeight}; pointer-events: auto; color: ${finalColor};`;
    };

    const buildColorCodedHtml = (text, colorCodes, defaultColor, isBaseLanguage) => {
        if (!colorCodes || subtitleStylePref !== 'vocabulary') {
            const finalStyle = isBaseLanguage ? getSpanStyle(defaultColor) : getSpanStyle(colorNameToRgba('yellow', fontColorAlphaPref));
            return `<span style="${finalStyle}">${text}</span>`;
        }

        const words = text.split(/\s+/).filter(w => w.length > 0);
        
        // --- Simpler Re-construction using array map/join ---
        let finalHtml = words.map((word, index) => {
            const colorCode = colorCodes[index] || 0; // 0 for white/unmatched
            const wordColor = (colorCode === 0) 
                ? colorNameToRgba('white', fontColorAlphaPref) 
                : getIndexedColor(colorCode, fontColorAlphaPref);

            const wordStyle = getSpanStyle(wordColor);
            return `<span style="${wordStyle}">${word}</span>`;
        }).join(' ');

        return finalHtml;
    };
    
    // Helper for non-vocab styles
    const buildSimpleHtml = (text, isTranslated) => {
        let originalStyle = getSpanStyle(baseFontColor);
        let translatedStyle = getSpanStyle(baseFontColor);

        if (subtitleStylePref === 'vocabulary') {
            // Should not happen for this function branch, but as a fallback
            return `<span style="${originalStyle}">${text}</span>`; 
        } else if (subtitleStylePref === 'grammar') {
            translatedStyle = getSpanStyle(colorNameToRgba('cyan', fontColorAlphaPref));
        } else if (subtitleStylePref === 'custom' || subtitleStylePref === 'netflix') {
            translatedStyle = getSpanStyle(colorNameToRgba(fontColorPref, fontColorAlphaPref));
        } else {
            // Default (should be handled by colorOverride in getSpanStyle)
        }
        
        const style = isTranslated ? translatedStyle : originalStyle;
        return `<span style="${style}">${text}</span>`;
    }

    const syncLoop = () => {
        // --- THIS IS THE FIX ---
        // Get the reliable player time instead of the video segment time
        const currentTime = getPlayerCurrentTime(videoElement);
        // --- END FIX ---
        
        if (videoElement.paused && currentTime === lastTime) return;
        lastTime = currentTime;

        let low = 0, high = parsedSubtitles.length - 1;
        let bestMatchIndex = -1;

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            if (parsedSubtitles[mid].begin <= currentTime) {
                bestMatchIndex = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        let newSubtitle = null;
        let newIndex = -1;
        if (bestMatchIndex !== -1) {
            const sub = parsedSubtitles[bestMatchIndex];
            if (currentTime < sub.end) {
                newSubtitle = sub;
                newIndex = bestMatchIndex;
            }
        }
        
        if (newIndex !== -1) {
            if (newIndex !== currentSubtitleIndex) {
                const { text, translatedText, baseWordColors, translatedWordColors } = newSubtitle;
                
                let innerHTML = '';
                
                if (translatedText) {
                    if (subtitleStylePref === 'vocabulary') {
                        const baseHtml = buildColorCodedHtml(text, baseWordColors, baseFontColor, true);
                        const translatedHtml = buildColorCodedHtml(translatedText, translatedWordColors, baseFontColor, false);
                        
                        if (isTranslatedOnly) {
                             innerHTML = translatedHtml;
                        } else {
                             innerHTML = `${baseHtml}<br>${translatedHtml}`;
                        }
                    } else {
                        // Original non-vocab logic
                        const baseHtml = buildSimpleHtml(text, false);
                        const translatedHtml = buildSimpleHtml(translatedText, true);
                        
                        if (isTranslatedOnly) {
                            innerHTML = translatedHtml;
                        } else {
                            innerHTML = `${baseHtml}<br>${translatedHtml}`;
                        }
                    }

                } else if (!isTranslatedOnly) {
                    const placeholderStyle = `opacity:0.6; ${getSpanStyle()}`;
                    innerHTML = buildSimpleHtml(text, false) + `<br><span style="${placeholderStyle}">(Translating...)</span>`;
                }
                
                floatingWindow.innerHTML = innerHTML;
                currentSubtitleIndex = newIndex;
            }
        } else if (currentSubtitleIndex !== -1) {
            floatingWindow.innerHTML = '';
            currentSubtitleIndex = -1;
        }
    };
    syncInterval = setInterval(syncLoop, 100);
    console.log("Subtitle sync loop started with binary search.");
}


function disableNetflixSubObserver() {
    if (typeof subtitleObserver !== 'undefined' && subtitleObserver) {
        subtitleObserver.disconnect();
        console.log("Netflix native subtitle observer disconnected.");
    }
}

// --- MODIFICATION: Find correct video element for Netflix, YouTube, or Disney+ ---
function getVideoElement() {
    let video = getNetflixVideoElement(); // Try Netflix
    if (video) return video;
    
    // Fallback for YouTube
    video = document.querySelector('#movie_player video.html5-main-video');
    if (video) return video;

    // Fallback for Disney+
    video = document.querySelector('.btm-media-player-container video');
    if (video) return video;

    return null;
}
// --- END MODIFICATION ---

// --- MODIFICATION: Robust YouTube transcript parser ---
function parseYouTubeTranscript(transcriptText) {
    parsedSubtitles = [];
    const lines = transcriptText.split('\n');
    
    // Regex to find timestamps like "0:00", "1:23", "10:45", "1:02:03"
    // It allows optional prefixes (like "P: ") and optional hours.
    const timeRegex = /(?:.*?\s)?(?:(\d{1,2}):)?(\d{1,2}):(\d{2})$/;

    let currentSubtitle = null;

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue; // Skip empty lines

        const timeMatch = trimmedLine.match(timeRegex);

        if (timeMatch) {
            // This is a new timestamp line.
            
            // 1. Get the time in seconds for this new line.
            const hours = parseInt(timeMatch[1] || '0', 10);
            const minutes = parseInt(timeMatch[2], 10);
            const seconds = parseInt(timeMatch[3], 10);
            const newTime = (hours * 3600) + (minutes * 60) + seconds;

            // 2. If we have a subtitle being built, this new time is its END time.
            if (currentSubtitle) {
                currentSubtitle.end = newTime;
                // Only push if it has text and a valid duration
                if (currentSubtitle.text && currentSubtitle.end > currentSubtitle.begin) {
                    parsedSubtitles.push(currentSubtitle);
                }
            }

            // 3. Start a new subtitle object
            currentSubtitle = {
                begin: newTime,
                end: 0, // We don't know the end time yet
                text: "",
                translatedText: null,
                baseWordColors: null,
                translatedWordColors: null
            };
            
        } else if (currentSubtitle) {
            // This is a text line. Append it to the current subtitle's text.
            currentSubtitle.text = (currentSubtitle.text + " " + trimmedLine).trim();
        }
    }

    // After the loop, push the very last subtitle buffer
    if (currentSubtitle && currentSubtitle.text) {
        // Estimate end time (e.g., 5 seconds after start) as we don't have a final timestamp.
        if (currentSubtitle.end === 0) {
             currentSubtitle.end = currentSubtitle.begin + 5; // Simple 5-second duration
        }
        if (currentSubtitle.end > currentSubtitle.begin) {
            parsedSubtitles.push(currentSubtitle);
        }
    }
    
    console.log(`Successfully parsed ${parsedSubtitles.length} subtitles from YouTube transcript.`);
    
    // Return true if parsing found at least one subtitle line
    return parsedSubtitles.length > 0;
}
// --- END MODIFICATION ---


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === "check_language_pair") {
        console.log(`[DEBUG] Received check_language_pair. Base: ${request.baseLang}, Target: ${request.targetLang}`);
        
        if ('Translator' in self && typeof Translator.availability === 'function') {
            (async () => {
                try {
                    const availabilityResult = await Translator.availability({
                        sourceLanguage: request.baseLang,
                        targetLanguage: request.targetLang
                    });

                    console.log(`[DEBUG] Translator.availability() returned: '${availabilityResult}'`);
                    const isAvailable = (availabilityResult === 'available' || availabilityResult === 'downloadable');

                    sendResponse({
                        isAvailable: isAvailable,
                        baseLang: request.baseLang,
                        targetLang: request.targetLang
                    });
                } catch (e) {
                    console.error("[DEBUG] Error during Translator.availability() check:", e);
                    sendResponse({ isAvailable: false });
                }
            })();
        } else {
            console.warn("Translator API (or availability function) is not available in this context.");
            sendResponse({ isAvailable: false });
        }
        return true;
    }

    // --- NEW COMMAND HANDLER ---
    if (request.command === "detect_language_from_text") {
        (async () => {
            const baseLangCode = await detectLanguageFromText(request.text);
            sendResponse({
                baseLangCode: baseLangCode
            });
        })();
        return true; // Indicates asynchronous response
    }
    // --- END NEW COMMAND HANDLER ---

    if (request.command === "detect_language") {
        (async () => {
            parsedSubtitles = [];
            // --- UPDATED: Use generic fetch function ---
            const xmlContent = await fetchSubtitleContent(request.url); 

            if (xmlContent) {
                const parseSuccess = parseTtmlXml(xmlContent, request.url);
                if (parseSuccess && parsedSubtitles.length > 0) {
                    const baseLangCode = await detectBaseLanguage();
                    sendResponse({
                        url: request.url,
                        baseLangCode: baseLangCode
                    });
                } else {
                    sendResponse({ url: request.url, baseLangCode: null });
                }
            } else {
                 sendResponse({ url: request.url, baseLangCode: null });
            }
        })();
        return true;
    }
    
    // --- NEW: Handler for Disney+ language detection ---
    if (request.command === "detect_language_disney") {
        (async () => {
            parsedSubtitles = [];
            const vttContent = await fetchSubtitleContent(request.url);

            if (vttContent) {
                const parseSuccess = parseVttContent(vttContent, request.url);
                if (parseSuccess && parsedSubtitles.length > 0) {
                    const baseLangCode = await detectBaseLanguage();
                    sendResponse({
                        url: request.url,
                        baseLangCode: baseLangCode
                    });
                } else {
                    sendResponse({ url: request.url, baseLangCode: null });
                }
            } else {
                 sendResponse({ url: request.url, baseLangCode: null });
            }
        })();
        return true;
    }
    // --- END NEW HANDLER ---


    if (request.command === "fetch_and_process_url" && request.url) {
        if (isProcessing) return false;
        isProcessing = true;
        isCancelled = false;
        subtitleLanguages.target = request.targetLang;
        isTranslatedOnly = request.translatedOnly;
        fontSizeEm = request.fontSize;
        backgroundColorPref = request.backgroundColor;
        backgroundAlphaPref = request.backgroundAlpha;
        fontShadowPref = request.fontShadow;
        fontColorPref = request.fontColor;
        fontColorAlphaPref = request.fontColorAlpha;
        subtitleStylePref = request.colourCoding;
        translationCache = {};
        if (syncInterval) clearInterval(syncInterval);
        const url = request.url;
        if (!('Translator' in self)) {
            sendStatusUpdate("ERROR: Chrome Translator API not detected.", 0, url);
            isProcessing = false;
            return false;
        }

        (async () => {
            const videoElement = getVideoElement(); // Use generic function
            if (!videoElement) {
                sendStatusUpdate("Video player not found.", 0);
                isProcessing = false;
                return;
            }
            // --- UPDATED: Use generic fetch function ---
            const xmlContent = await fetchSubtitleContent(url); 
            if (!xmlContent || isCancelled) {
                isProcessing = false;
                return;
            }
            createFloatingWindow();
            disableNetflixSubObserver();
            const parseSuccess = parseTtmlXml(xmlContent, url);
            if (parseSuccess && parsedSubtitles.length > 0 && !isCancelled) {
                sendStatusUpdate("Detecting language...", 30, url);
                subtitleLanguages.base = await detectBaseLanguage();
                if (isCancelled) {
                    isProcessing = false;
                    return;
                }
                if (!subtitleLanguages.base) {
                    sendStatusUpdate(`Detection FAIL. Fallback 'en'...`, 30, url);
                    subtitleLanguages.base = 'en';
                } else {
                    sendStatusUpdate(`Detected: ${subtitleLanguages.base.toUpperCase()}. Translating...`, 30, url);
                }
                startSubtitleSync(videoElement);
                try {
                    await translateAllSubtitles(url);
                } catch (e) {
                    if (e.message !== "ABORT_TRANSLATION") console.error("Translation error:", e);
                }
                isProcessing = false;
            } else {
                if (!isCancelled) sendStatusUpdate("Invalid URL.", 0, url, 'url');
                isProcessing = false;
            }
        })();
        return false;
    }
    
    // --- NEW COMMAND HANDLER FOR YOUTUBE ---
    if (request.command === "process_youtube_subtitles" && request.transcript) {
        if (isProcessing) return false;
        isProcessing = true;
        isCancelled = false;
        subtitleLanguages.target = request.targetLang;
        isTranslatedOnly = request.translatedOnly;
        fontSizeEm = request.fontSize;
        backgroundColorPref = request.backgroundColor;
        backgroundAlphaPref = request.backgroundAlpha;
        fontShadowPref = request.fontShadow;
        fontColorPref = request.fontColor;
        fontColorAlphaPref = request.fontColorAlpha;
        subtitleStylePref = request.colourCoding;
        translationCache = {};
        if (syncInterval) clearInterval(syncInterval);
        
        if (!('Translator' in self)) {
            sendStatusUpdate("ERROR: Chrome Translator API not detected.", 0, null, 'transcript');
            isProcessing = false;
            return false;
        }
        
        (async () => {
            const videoElement = getVideoElement(); // Use generic function
            if (!videoElement) {
                sendStatusUpdate("Video player not found.", 0, null, 'transcript');
                isProcessing = false;
                return;
            }
            
            createFloatingWindow();
            
            // Parse the provided transcript
            const parseSuccess = parseYouTubeTranscript(request.transcript);
            
            if (parseSuccess && parsedSubtitles.length > 0 && !isCancelled) {
                sendStatusUpdate("Detecting language...", 30, null, 'transcript');
                
                // Detect language from the parsed subs
                subtitleLanguages.base = await detectBaseLanguage(); 
                
                if (isCancelled) {
                    isProcessing = false;
                    return;
                }
                if (!subtitleLanguages.base) {
                    sendStatusUpdate(`Detection FAIL. Fallback 'en'...`, 30, null, 'transcript');
                    subtitleLanguages.base = 'en';
                } else {
                    sendStatusUpdate(`Detected: ${subtitleLanguages.base.toUpperCase()}. Translating...`, 30, null, 'transcript');
                }
                
                startSubtitleSync(videoElement);
                
                try {
                    // Pass null for URL as it's not needed for YouTube status
                    await translateAllSubtitles(null); 
                } catch (e) {
                    if (e.message !== "ABORT_TRANSLATION") console.error("Translation error:", e);
                }
                isProcessing = false;
            } else {
                if (!isCancelled) sendStatusUpdate("Invalid transcript. Please re-paste.", 0, null, 'transcript');
                isProcessing = false;
            }
        })();
        
        sendResponse({ status: "processing_started" }); // Acknowledge message received
        return true; // Indicate async work
    }
    // --- END NEW COMMAND HANDLER ---

    // --- UPDATED: Full implementation for Disney+ ---
    if (request.command === "process_disney_url" && request.url) {
        if (isProcessing) return false;
        
        // --- Full implementation, replacing placeholder ---
        isProcessing = true;
        isCancelled = false;
        subtitleLanguages.target = request.targetLang;
        isTranslatedOnly = request.translatedOnly;
        fontSizeEm = request.fontSize;
        backgroundColorPref = request.backgroundColor;
        backgroundAlphaPref = request.backgroundAlpha;
        fontShadowPref = request.fontShadow;
        fontColorPref = request.fontColor;
        fontColorAlphaPref = request.fontColorAlpha;
        subtitleStylePref = request.colourCoding;
        translationCache = {};
        if (syncInterval) clearInterval(syncInterval);
        const url = request.url;
        
        if (!('Translator' in self)) {
            sendStatusUpdate("ERROR: Chrome Translator API not detected.", 0, url, 'url');
            isProcessing = false;
            return false;
        }
        
        (async () => {
            const videoElement = getVideoElement(); // Use generic function
            if (!videoElement) {
                sendStatusUpdate("Video player not found.", 0, url, 'url');
                isProcessing = false;
                return;
            }
            
            const vttContent = await fetchSubtitleContent(url);
            if (!vttContent || isCancelled) {
                if(!isCancelled) sendStatusUpdate("Error fetching Disney+ subtitles.", 0, url, 'url');
                isProcessing = false;
                return;
            }
            
            createFloatingWindow();
            
            const parseSuccess = parseVttContent(vttContent, url);
            
            if (parseSuccess && parsedSubtitles.length > 0 && !isCancelled) {
                sendStatusUpdate("Detecting language...", 30, url, 'url');
                
                subtitleLanguages.base = await detectBaseLanguage(); 
                
                if (isCancelled) {
                    isProcessing = false;
                    return;
                }
                if (!subtitleLanguages.base) {
                    sendStatusUpdate(`Detection FAIL. Fallback 'en'...`, 30, url, 'url');
                    subtitleLanguages.base = 'en';
                } else {
                    sendStatusUpdate(`Detected: ${subtitleLanguages.base.toUpperCase()}. Translating...`, 30, url, 'url');
                }
                
                startSubtitleSync(videoElement);
                
                try {
                    await translateAllSubtitles(url); 
                } catch (e) {
                    if (e.message !== "ABORT_TRANSLATION") console.error("Translation error:", e);
                }
                isProcessing = false;
            } else {
                if (!isCancelled) sendStatusUpdate("Invalid Disney+ URL or content.", 0, url, 'url');
                isProcessing = false;
            }
        })();
        
        sendResponse({ status: "processing_started" }); // Acknowledge message
        return true; // Indicate async work
    }
    // --- END DISNEY+ IMPLEMENTATION ---

    if (request.command === "cancel_processing") {
        isCancelled = true;
        if (syncInterval) {
            clearInterval(syncInterval);
            syncInterval = null;
        }
        if (floatingWindow) {
            floatingWindow.style.display = 'none';
            floatingWindow.innerHTML = '';
        }
        isProcessing = false;
        
        (async () => {
            await chrome.storage.local.remove(['ls_status']);
            console.log("Processing cancelled. Cleared status from storage.");
        })();
        
        return false;
    }

    return false;
});