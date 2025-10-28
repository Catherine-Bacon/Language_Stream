// --- SAFE GLOBAL VARIABLE INITIALIZATION ---
var floatingWindow = floatingWindow || null;
var parsedSubtitles = parsedSubtitles || [];
var syncInterval = syncInterval || null;
// --- Observer variable (now less relevant, but kept for disable function) ---
var subtitleObserver = subtitleObserver || null;
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
// --- Variable to track current site ---
var currentSite = ''; // Will be set by getVideoElement

function sendStatusUpdate(message, progress, url = null, route = 'main') {
    if (isCancelled) return;
    chrome.storage.local.set({ 'ls_status': { message: message, progress: progress, baseLang: subtitleLanguages.base, targetLang: subtitleLanguages.target, url: progress < 100 ? url : null } }).catch(e => console.error("Could not save status to storage:", e));
    chrome.runtime.sendMessage({ command: "update_status", message: message, progress: progress, route: route }).catch(e => { if (!e.message.includes('Receiving end does not exist')) console.warn("Content Script Messaging Error:", e); });
}

function ticksToSeconds(tickString) {
    if (!tickString) return 0;
    const tickValue = parseInt(tickString.replace('t', ''), 10);
    return tickValue / TICK_RATE;
}

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
        } else if (timeString && !isNaN(parseFloat(timeString))) {
             seconds = parseFloat(timeString); // Failsafe for just seconds
        } else {
            console.warn("Could not parse VTT time:", timeString);
        }
        return seconds;
    } catch(e) {
        console.error("Error parsing VTT time:", timeString, e);
        return 0;
    }
}

function getPlayerCurrentTime(videoElement) {
    // 1. Try Disney+ UI time element (as a potentially more reliable source)
    const disneyTimeElement = document.querySelector('.btm-time-current');
    if (currentSite === 'disney' && disneyTimeElement && disneyTimeElement.textContent) {
        const timeString = disneyTimeElement.textContent.trim();
        const uiTime = vttTimeToSeconds(timeString);
        if (!isNaN(uiTime) && uiTime >= 0) { // Allow 0 time
            return uiTime;
        } else {
             console.warn("Failed to parse Disney UI time, falling back to video.currentTime:", timeString);
        }
    }

    // 2. Fallback for Netflix, YouTube, or if Disney UI not found/fails
    if (videoElement) {
      // Add a check for NaN, which can happen if video isn't ready
      return isNaN(videoElement.currentTime) ? 0 : videoElement.currentTime;
    }
    return 0; // Default if no element
}


function getNetflixVideoElement() {
    const playerView = document.querySelector('.watch-video--player-view');
    if (playerView) return playerView.querySelector('video');
    return document.querySelector('video[src*="blob"]'); // Common selector
}

function getNetflixPlayerContainer() {
    return document.querySelector('.watch-video--player-view');
}


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
                parsedSubtitles.push({
                    begin: ticksToSeconds(beginTick),
                    end: ticksToSeconds(endTick),
                    text: text,
                    translatedText: null,
                    baseWordColors: null,
                    translatedWordColors: null
                });
            }
        });
        console.log(`Successfully parsed ${parsedSubtitles.length} TTML subtitles.`);
        return parsedSubtitles.length > 0;
    } catch (e) {
        console.error("Fatal error during XML parsing:", e);
        sendStatusUpdate("Invalid URL retrieved - please repeat URL retrieval steps", 0, url, 'url');
        return false;
    }
}


function parseVttContent(vttString, url) {
    parsedSubtitles = [];
    try {
        const cues = vttString.split('\n\n');
        const timeRegex = /([\d:.]+) --> ([\d:.]+)/;

        for (const cue of cues) {
            const trimmedCue = cue.trim();
            if (trimmedCue.toUpperCase().startsWith('WEBVTT') || trimmedCue.toUpperCase().startsWith('STYLE') || !trimmedCue.includes('-->')) {
                continue; // Skip headers, style blocks, and lines without timestamps
            }
            const lines = trimmedCue.split('\n');
            if (lines.length < 2) continue; // Need at least timestamp + text

            const timeMatch = lines[0].match(timeRegex);
            if (timeMatch) {
                const begin = vttTimeToSeconds(timeMatch[1]);
                const end = vttTimeToSeconds(timeMatch[2]);

                // Join all potential text lines
                let textContent = lines.slice(1).join('\n'); // Keep newlines between original VTT lines

                // Strip HTML tags (like <i>)
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = textContent;
                textContent = tempDiv.textContent;

                // Basic whitespace cleanup (trim ends, replace multiple spaces with one, but keep newlines)
                textContent = textContent.replace(/ +/g, ' ').trim();


                if (textContent && begin < end) { // Ensure valid time range
                    parsedSubtitles.push({
                        begin: begin,
                        end: end,
                        text: textContent, // Store text potentially with internal newlines
                        translatedText: null,
                        baseWordColors: null,
                        translatedWordColors: null
                    });
                } else if (textContent) {
                    console.warn("Skipping VTT cue with invalid time range:", lines[0]);
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

function detectBaseLanguage() {
    if (!parsedSubtitles || parsedSubtitles.length === 0) return Promise.resolve(null);
    const sampleText = parsedSubtitles.slice(0, 50).map(sub => sub.text).join(' ').slice(0, 1000);
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
        // Added white-space: pre-wrap
        windowDiv.style.cssText = `position: absolute; bottom: 10%; left: 50%; transform: translateX(-50%); width: 90%; max-width: 1200px; min-height: 50px; background-color: rgba(0, 0, 0, 0); padding: 0; z-index: 9999; color: ${defaultFontColor}; font-family: 'Inter', sans-serif; font-size: 3.6rem; text-align: center; line-height: 1.4; cursor: grab; display: none; text-shadow: ${textShadow}; pointer-events: none; white-space: pre-wrap;`;
        makeDraggable(windowDiv);

        let playerContainer = getNetflixPlayerContainer();
        if (!playerContainer) playerContainer = document.getElementById('movie_player');
        if (!playerContainer) playerContainer = document.querySelector('.btm-media-player-container') || document.getElementById('vader_Player');

        const parentElement = playerContainer || document.body;
        // Make sure parent is not static for absolute positioning to work relative to it
        if (parentElement !== document.body && getComputedStyle(parentElement).position === 'static') {
             parentElement.style.position = 'relative';
             console.log("Set player container position to relative.");
        }
        parentElement.appendChild(windowDiv);

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
        // Replace literal newlines with spaces before sending to translator
        const textWithoutNewlines = textToTranslate.replace(/\n/g, ' ');
        const translatedText = await currentTranslator.translate(textWithoutNewlines);
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

async function processVocabColorCoding(subtitle) {
     // Helper to sanitize words for matching (removes punctuation, keeps spaces for phrase matching)
    const sanitizePhrase = (phrase) => phrase.toLowerCase().replace(/[.,/#!$%^&*;:{}=-_`~()]/g, "").trim();

    // Process text without newlines for word splitting
    const baseWords = subtitle.text.replace(/\n/g, ' ').split(/\s+/).filter(w => w.length > 0);
    // Translation result should not have newlines
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
                // Bounds check added
                if (i + k >= baseWordColors.length || baseWordColors[i + k] !== 0) {
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
                     // Bounds check added
                     if(i + k < baseWordColors.length) {
                       baseWordColors[i + k] = colorCodeCounter;
                     }
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
    if (totalSubs === 0) {
      console.warn("No subtitles parsed to translate.");
      sendStatusUpdate("No subtitles found to translate.", 0, url);
      return;
    }
    const baseLang = subtitleLanguages.base;
    const targetLang = subtitleLanguages.target;
     if (!baseLang || !targetLang) {
       console.error("Base or target language is missing.");
       sendStatusUpdate("Error: Language detection failed or target language invalid.", 0, url);
       return;
     }
    const CRITICAL_BATCH_SIZE = Math.min(30, totalSubs); // Ensure batch size isn't larger than total subs
    const criticalBatch = parsedSubtitles.slice(0, CRITICAL_BATCH_SIZE);
    const concurrentBatch = parsedSubtitles.slice(CRITICAL_BATCH_SIZE);
    const START_PROGRESS = 60;

    const isVocab = (subtitleStylePref === 'vocabulary');
    const TRANSLATION_WEIGHT = isVocab ? 20 : 30;
    const MATCHING_WEIGHT = isVocab ? 10 : 0;
    const CRITICAL_BATCH_TOTAL_WEIGHT = TRANSLATION_WEIGHT + MATCHING_WEIGHT;
    const CONCURRENT_TRANSLATION_WEIGHT = isVocab ? 20 : 30;
    const CONCURRENT_MATCHING_WEIGHT = isVocab ? 10 : 0;
    const CONCURRENT_BATCH_TOTAL_WEIGHT = CONCURRENT_TRANSLATION_WEIGHT + CONCURRENT_MATCHING_WEIGHT;

    sendStatusUpdate(`Translating first ${criticalBatch.length} lines for immediate playback...`, START_PROGRESS, url);

    // --- Phase 1: Critical Batch ---
    for (let index = 0; index < criticalBatch.length; index++) {
        if (isCancelled) throw new Error("ABORT_TRANSLATION");
        const sub = criticalBatch[index];
        sub.translatedText = await translateSubtitle(sub.text, baseLang, targetLang);
        let progress = START_PROGRESS + Math.floor(((index + 1) / CRITICAL_BATCH_SIZE) * TRANSLATION_WEIGHT);
        if (isVocab && sub.translatedText && !sub.translatedText.includes('Translation Failed')) {
             await processVocabColorCoding(sub);
             progress = START_PROGRESS + Math.floor(((index + 1) / CRITICAL_BATCH_SIZE) * CRITICAL_BATCH_TOTAL_WEIGHT);
        }
        // Ensure progress doesn't exceed 100 prematurely
        progress = Math.min(progress, 99);
        sendStatusUpdate(`First ${index + 1} lines ready to watch!`, progress, url);
    }

    // --- Phase 2: Concurrent Batch ---
    const CONCURRENT_START_PROGRESS = START_PROGRESS + CRITICAL_BATCH_TOTAL_WEIGHT;
    // Ensure start progress is capped
    const cappedConcurrentStartProgress = Math.min(CONCURRENT_START_PROGRESS, 99);
    sendStatusUpdate(`First ${CRITICAL_BATCH_SIZE} lines ready! Starting background translation...`, cappedConcurrentStartProgress, url);

    if (concurrentBatch.length > 0) {
        const translationPromises = concurrentBatch.map(async (sub, index) => {
            if (isCancelled) return Promise.resolve("ABORTED");
            sub.translatedText = await translateSubtitle(sub.text, baseLang, targetLang);
            if (isVocab && sub.translatedText && !sub.translatedText.includes('Translation Failed')) {
                 await processVocabColorCoding(sub);
            }
            if ((index + 1) % 5 === 0 || index === concurrentBatch.length - 1) { // Report progress every 5 or on the last one
                const progressRatio = (index + 1) / concurrentBatch.length;
                let progress = cappedConcurrentStartProgress + Math.floor(progressRatio * CONCURRENT_BATCH_TOTAL_WEIGHT);
                // Cap progress at 99 until fully complete
                progress = Math.min(progress, 99);

                if (progress < 100) {
                    const totalReady = CRITICAL_BATCH_SIZE + index + 1;
                    sendStatusUpdate(`First ${totalReady} lines ready to watch!`, progress, url);
                }
            }
            return sub.translatedText;
        });
        await Promise.all(translationPromises);
    }


    if (!isCancelled) {
        sendStatusUpdate(`Translation complete! ${totalSubs} lines ready.`, 100, url);
        console.log("Native translation process finished.");
    } else {
        console.log("Translation finished, but process was cancelled.");
    }
}


function getFontSizeEm(preference) { /* ... */ }
function getFontShadowCss(preference) { /* ... */ }
function colorNameToRgba(name, alpha) { /* ... */ }
function getIndexedColor(index, alpha) { /* ... */ }


function startSubtitleSync(videoElement) {
    cleanupSyncMechanisms(); // Clear previous sync first

    if (!floatingWindow) { createFloatingWindow(); } // Ensure window exists
    if (!floatingWindow) { console.error("Failed to create floating window."); return; } // Bail if still no window
    if (!videoElement) { console.error("Video element not found for syncing."); sendStatusUpdate("Error: Video player element not found.", 0); return; }

    floatingWindow.style.display = 'block';

    const currentFontSizeEm = getFontSizeEm(fontSizeEm);
    const currentFontShadow = getFontShadowCss(fontShadowPref);
    const baseFontColor = colorNameToRgba(fontColorPref, fontColorAlphaPref);
    let currentSpanBgColor = colorNameToRgba(backgroundColorPref, backgroundAlphaPref);
    const fontWeight = (subtitleStylePref === 'netflix') ? 'bold' : 'normal';

    if (subtitleStylePref === 'netflix' || subtitleStylePref === 'vocabulary') {
        currentSpanBgColor = 'transparent';
    }

    floatingWindow.style.textShadow = currentFontShadow;
    floatingWindow.style.color = baseFontColor;

    const getSpanStyle = (colorOverride = null) => {
        const finalColor = colorOverride || baseFontColor;
        const finalBgColor = (subtitleStylePref === 'vocabulary') ? colorNameToRgba('none', 0) : currentSpanBgColor;
        return `display: inline-block; padding: 0 0.2em; border-radius: 0.2em; background-color: ${finalBgColor}; font-size: ${currentFontSizeEm}; font-weight: ${fontWeight}; pointer-events: auto; color: ${finalColor}; line-height: 1.2;`;
    };

     const buildColorCodedHtml = (text, colorCodes, defaultColor, isBaseLanguage) => {
        if (!text) return ''; // Handle null/undefined text
        // Ensure text is treated as a string
        const textStr = String(text);

        if (!colorCodes || subtitleStylePref !== 'vocabulary') {
            const finalStyle = isBaseLanguage ? getSpanStyle(defaultColor) : getSpanStyle(colorNameToRgba('yellow', fontColorAlphaPref));
            const htmlText = textStr.replace(/\n/g, '<br>');
            return `<span style="${finalStyle}">${htmlText}</span>`;
        }
        // Split while preserving whitespace (including newlines)
        const parts = textStr.split(/(\s+)/);
        let htmlParts = [];
        let wordIndex = 0;
        for (const part of parts) {
            if (part && part.trim().length > 0) { // It's a word
                const colorCode = colorCodes && wordIndex < colorCodes.length ? colorCodes[wordIndex] : 0;
                const wordColor = (colorCode === 0) ? colorNameToRgba('white', fontColorAlphaPref) : getIndexedColor(colorCode, fontColorAlphaPref);
                const wordStyle = getSpanStyle(wordColor);
                htmlParts.push(`<span style="${wordStyle}">${part}</span>`);
                wordIndex++;
            } else if (part) { // It's whitespace
                htmlParts.push(part.replace(/\n/g, '<br>'));
            }
        }
        return htmlParts.join('');
    };

    const buildSimpleHtml = (text, isTranslated) => {
         if (!text) return ''; // Handle null/undefined text
         // Ensure text is treated as a string
         const textStr = String(text);

        let style = getSpanStyle(baseFontColor); // Default
        if (isTranslated) {
            if (subtitleStylePref === 'grammar') {
                 style = getSpanStyle(colorNameToRgba('cyan', fontColorAlphaPref));
            } // 'custom' and 'netflix' use baseFontColor already set
        }
        const htmlText = textStr.replace(/\n/g, '<br>');
        return `<span style="${style}">${htmlText}</span>`;
    };


    const updateFloatingWindow = (subtitle) => {
        if (!floatingWindow) return; // Guard against missing window
        if (!subtitle) {
            floatingWindow.innerHTML = '';
            return;
        }
        // Ensure subtitle properties exist before accessing
        const text = subtitle.text || '';
        const translatedText = subtitle.translatedText;
        const baseWordColors = subtitle.baseWordColors;
        const translatedWordColors = subtitle.translatedWordColors;

        let innerHTML = '';
        const hasTranslation = translatedText && !translatedText.includes('Translation Failed');

        if (hasTranslation) {
            if (subtitleStylePref === 'vocabulary') {
                const baseHtml = buildColorCodedHtml(text, baseWordColors, baseFontColor, true);
                const translatedHtml = buildColorCodedHtml(translatedText, translatedWordColors, baseFontColor, false);
                innerHTML = isTranslatedOnly ? translatedHtml : `${baseHtml}<br>${translatedHtml}`;
            } else {
                const baseHtml = buildSimpleHtml(text, false);
                const translatedHtml = buildSimpleHtml(translatedText, true);
                innerHTML = isTranslatedOnly ? translatedHtml : `${baseHtml}<br>${translatedHtml}`;
            }
        } else if (!isTranslatedOnly) {
            const placeholderStyle = `opacity:0.6; ${getSpanStyle()}`;
            const baseHtml = buildSimpleHtml(text, false); // Contains <br> already
            innerHTML = `${baseHtml}<br><span style="${placeholderStyle}">(Translating...)</span>`;
        } else {
             innerHTML = ''; // Don't show anything if translated only and no translation yet
        }

        floatingWindow.innerHTML = innerHTML;
    };


    console.log(`Setting up setInterval sync for ${currentSite} mode.`);
    let currentSubtitleIndex = -1;
    let lastTime = -1;

    const syncLoop = () => {
        if (isCancelled || !videoElement || typeof videoElement.currentTime === 'undefined') {
            cleanupSyncMechanisms(); // Clear interval if cancelled or video gone
            return;
        }
        const currentTime = getPlayerCurrentTime(videoElement);

        if (videoElement.paused && currentTime === lastTime) { return; }
        lastTime = currentTime;

        let low = 0, high = parsedSubtitles.length - 1;
        let bestMatchIndex = -1;
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            if (!parsedSubtitles[mid]) { high = mid - 1; continue; }
            if (parsedSubtitles[mid].begin <= currentTime) { bestMatchIndex = mid; low = mid + 1; }
            else { high = mid - 1; }
        }

        let newSubtitle = null;
        let newIndex = -1;
        if (bestMatchIndex !== -1 && parsedSubtitles[bestMatchIndex]) {
            const sub = parsedSubtitles[bestMatchIndex];
            if (currentTime >= sub.begin && currentTime < sub.end) { // More precise check
                newSubtitle = sub;
                newIndex = bestMatchIndex;
            }
        }

        if (newIndex !== currentSubtitleIndex) {
            updateFloatingWindow(newSubtitle);
            currentSubtitleIndex = newIndex;
        }
    };

    syncInterval = setInterval(syncLoop, 100);
    console.log("setInterval sync loop started.");
}

// Renamed and simplified
function cleanupSyncMechanisms() {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
        console.log("Cleared setInterval sync.");
    }
     if (subtitleObserver) {
        subtitleObserver.disconnect();
        subtitleObserver = null;
        console.log("Disconnected MutationObserver.");
    }
}


function getVideoElement() {
    let video = getNetflixVideoElement();
    if (video) { currentSite = 'netflix'; console.log("Detected site: Netflix"); return video; }

    video = document.querySelector('#movie_player video.html5-main-video');
    if (video) { currentSite = 'youtube'; console.log("Detected site: YouTube"); return video; }

    video = document.querySelector('.btm-media-player-container video');
    if (!video) video = document.querySelector('#vader_Player video');
    // --- Added one more potential selector ---
    if (!video) video = document.querySelector('video[data-testid="vader-player"]');
    if (video) { currentSite = 'disney'; console.log("Detected site: Disney+"); return video; }


    console.warn("Could not detect site or find video element.");
    currentSite = '';
    return null;
}

function parseYouTubeTranscript(transcriptText) { /* ... same as before ... */ }


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // --- Language Pair Check ---
    if (request.command === "check_language_pair") { /* ... same logic ... */ return true; }
    // --- Detect Lang from Text (YouTube) ---
    if (request.command === "detect_language_from_text") { /* ... same logic ... */ return true; }
    // --- Detect Lang from Netflix URL ---
    if (request.command === "detect_language") { /* ... same logic ... */ return true; }
    // --- Detect Lang from Disney+ URL ---
    if (request.command === "detect_language_disney") { /* ... same logic ... */ return true; }

    // --- Process Netflix URL ---
    if (request.command === "fetch_and_process_url" && request.url) {
        if (isProcessing) return false;
        isProcessing = true; isCancelled = false;
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
        cleanupSyncMechanisms();
        const url = request.url;
        if (!('Translator' in self)) { sendStatusUpdate("ERROR: Chrome Translator API not detected.", 0, url); isProcessing = false; return false; }

        (async () => {
            const videoElement = getVideoElement();
            if (!videoElement) { sendStatusUpdate("Video player not found.", 0); isProcessing = false; return; }
            const xmlContent = await fetchSubtitleContent(url);
            if (!xmlContent || isCancelled) { isProcessing = false; if (!isCancelled) sendStatusUpdate("Error fetching subtitles.", 0, url, 'url'); return; }
            createFloatingWindow(); // Ensure window exists before parsing/syncing
            const parseSuccess = parseTtmlXml(xmlContent, url);
            if (parseSuccess && !isCancelled) {
                sendStatusUpdate("Detecting language...", 30, url);
                subtitleLanguages.base = await detectBaseLanguage();
                if (isCancelled) { isProcessing = false; return; }
                 if (!subtitleLanguages.base) { sendStatusUpdate(`Detection FAIL. Fallback 'en'...`, 30, url); subtitleLanguages.base = 'en'; }
                 else { sendStatusUpdate(`Detected: ${subtitleLanguages.base.toUpperCase()}. Translating...`, 30, url); }
                startSubtitleSync(videoElement);
                try { await translateAllSubtitles(url); }
                catch (e) { if (e.message !== "ABORT_TRANSLATION") console.error("Translation error:", e); }
            } else if (!isCancelled) { sendStatusUpdate("Invalid subtitle format or empty.", 0, url, 'url'); }
            isProcessing = false;
        })();
        // Send immediate response for sync messages if needed, but fetch/process is async
        // sendResponse({status: "processing_started"}); // Uncomment if popup needs confirmation
        return false; // Indicate async work (or true if sendResponse is used above)
    }

    // --- Process YouTube Transcript ---
    if (request.command === "process_youtube_subtitles" && request.transcript) {
         if (isProcessing) return false;
        isProcessing = true; isCancelled = false;
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
        cleanupSyncMechanisms();
        if (!('Translator' in self)) { sendStatusUpdate("ERROR: Chrome Translator API not detected.", 0, null, 'transcript'); isProcessing = false; return false; }

        (async () => {
            const videoElement = getVideoElement();
            if (!videoElement) { sendStatusUpdate("Video player not found.", 0, null, 'transcript'); isProcessing = false; return; }
            createFloatingWindow();
            const parseSuccess = parseYouTubeTranscript(request.transcript);
            if (parseSuccess && !isCancelled) {
                sendStatusUpdate("Detecting language...", 30, null, 'transcript');
                subtitleLanguages.base = await detectBaseLanguage();
                 if (isCancelled) { isProcessing = false; return; }
                 if (!subtitleLanguages.base) { sendStatusUpdate(`Detection FAIL. Fallback 'en'...`, 30, null, 'transcript'); subtitleLanguages.base = 'en'; }
                 else { sendStatusUpdate(`Detected: ${subtitleLanguages.base.toUpperCase()}. Translating...`, 30, null, 'transcript'); }
                startSubtitleSync(videoElement);
                try { await translateAllSubtitles(null); }
                catch (e) { if (e.message !== "ABORT_TRANSLATION") console.error("Translation error:", e); }
            } else if (!isCancelled) { sendStatusUpdate("Invalid transcript or empty.", 0, null, 'transcript'); }
            isProcessing = false;
        })();
        sendResponse({ status: "processing_started" });
        return true;
    }

    // --- Process Disney+ URL ---
    if (request.command === "process_disney_url" && request.url) {
        if (isProcessing) return false;
        isProcessing = true; isCancelled = false;
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
        cleanupSyncMechanisms();
        const url = request.url;
        if (!('Translator' in self)) { sendStatusUpdate("ERROR: Chrome Translator API not detected.", 0, url, 'url'); isProcessing = false; return false; }

        (async () => {
            const videoElement = getVideoElement();
            if (!videoElement) { sendStatusUpdate("Video player not found.", 0, url, 'url'); isProcessing = false; return; }
            const vttContent = await fetchSubtitleContent(url);
             if (!vttContent || isCancelled) { isProcessing = false; if(!isCancelled) sendStatusUpdate("Error fetching Disney+ subtitles.", 0, url, 'url'); return; }
            createFloatingWindow();
            const parseSuccess = parseVttContent(vttContent, url);
            if (parseSuccess && !isCancelled) {
                sendStatusUpdate("Detecting language...", 30, url, 'url');
                subtitleLanguages.base = await detectBaseLanguage();
                 if (isCancelled) { isProcessing = false; return; }
                 if (!subtitleLanguages.base) { sendStatusUpdate(`Detection FAIL. Fallback 'en'...`, 30, url, 'url'); subtitleLanguages.base = 'en'; }
                 else { sendStatusUpdate(`Detected: ${subtitleLanguages.base.toUpperCase()}. Translating...`, 30, url, 'url'); }
                startSubtitleSync(videoElement);
                try { await translateAllSubtitles(url); }
                catch (e) { if (e.message !== "ABORT_TRANSLATION") console.error("Translation error:", e); }
            } else if (!isCancelled) { sendStatusUpdate("Invalid Disney+ URL or content.", 0, url, 'url'); }
            isProcessing = false;
        })();
        sendResponse({ status: "processing_started" });
        return true;
    }

    // --- Cancel Processing ---
    if (request.command === "cancel_processing") {
        isCancelled = true;
        cleanupSyncMechanisms();
        if (floatingWindow) {
            floatingWindow.style.display = 'none';
            floatingWindow.innerHTML = '';
        }
        isProcessing = false;
        (async () => { await chrome.storage.local.remove(['ls_status']); })();
        console.log("Processing cancelled.");
        return false;
    }

    return false; // Default for unhandled messages
});