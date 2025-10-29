/* --- content.js (ZMODYFIKOWANY) --- */
// --- SAFE GLOBAL VARIABLE INITIALIZATION ---
var floatingWindow = floatingWindow || null;
var parsedSubtitles = parsedSubtitles || [];
var syncInterval = syncInterval || null;
// NEW: Variable to hold the Disney+ time element if found
var disneyTimeElement = disneyTimeElement || null;
var subtitleLanguages = subtitleLanguages || { base: '', target: '' };
var translationCache = translationCache || {};
var isTranslatedOnly = isTranslatedOnly || false;
var fontSizeEm = 'medium';
var backgroundColorPref = 'black';
var backgroundAlphaPref = 1.0;
var fontColorAlphaPref = 1.0;
var fontShadowPref = 'black_shadow';
var fontColorPref = 'white';
var subtitleStylePref = 'netflix'; // Represents 'colourCoding'
var isProcessing = isProcessing || false;
var isCancelled = isCancelled || false;
var currentTranslator = currentTranslator || null;
// --- NEW: Flag for saving offline ---
var shouldSaveOffline = shouldSaveOffline || false;
var TICK_RATE = TICK_RATE || 10000000; // Netflix TTML ticks per second

function sendStatusUpdate(message, progress, url = null, route = 'main') {
    if (isCancelled && progress < 100) return; // Allow final cancellation message if needed
    // Ensure progress doesn't exceed 100
    const cappedProgress = Math.min(progress, 100);
    chrome.storage.local.set({ 'ls_status': { message: message, progress: cappedProgress, baseLang: subtitleLanguages.base, targetLang: subtitleLanguages.target, url: cappedProgress < 100 ? url : null } }).catch(e => console.error("Could not save status to storage:", e));
    chrome.runtime.sendMessage({ command: "update_status", message: message, progress: cappedProgress, route: route }).catch(e => { if (!e.message.includes('Receiving end does not exist')) console.warn("Content Script Messaging Error:", e); });
}


function ticksToSeconds(tickString) {
    if (!tickString) return 0;
    const tickValue = parseInt(tickString.replace('t', ''), 10);
    return tickValue / TICK_RATE;
}

function vttTimeToSeconds(timeString) {
    if (!timeString) return 0; // Handle null or undefined
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
        return isNaN(seconds) ? 0 : seconds; // Ensure we return a number
    } catch(e) {
        console.error("Error parsing VTT/Time time:", timeString, e);
        return 0;
    }
}

function getNetflixVideoElement() {
    const playerView = document.querySelector('.watch-video--player-view');
    if (playerView) return playerView.querySelector('video');
    return document.querySelector('video[src*="blob"]');
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

// --- MODIFIED: This function now supports both time formats ---
function parseTtmlXml(xmlString, url) {
    parsedSubtitles = [];
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
        const errorNode = xmlDoc.querySelector('parsererror');
        if (errorNode) {
            console.error("XML Parsing Error:", errorNode.textContent);
            // MODIFIED: Handle file upload error
            const errorMsg = (url === 'prime_file_upload') ? "Invalid Prime Video file. Please re-download and re-upload." : "Invalid URL retrieved - please repeat URL retrieval steps";
            sendStatusUpdate(errorMsg, 0, url, 'url');
            return false;
        }
        const subtitleParagraphs = xmlDoc.querySelectorAll('p');

        subtitleParagraphs.forEach((p) => {
            const beginTimeStr = p.getAttribute('begin');
            const endTimeStr = p.getAttribute('end');
            let beginSeconds, endSeconds;

            // Check format and parse accordingly
            if (beginTimeStr && beginTimeStr.includes(':')) {
                beginSeconds = vttTimeToSeconds(beginTimeStr); // Use VTT parser for HH:MM:SS.mmm
            } else {
                beginSeconds = ticksToSeconds(beginTimeStr); // Use ticks parser for Netflix
            }

            if (endTimeStr && endTimeStr.includes(':')) {
                endSeconds = vttTimeToSeconds(endTimeStr);
            } else {
                endSeconds = ticksToSeconds(endTimeStr);
            }

            let rawHtml = p.innerHTML;
            let htmlWithSpaces = rawHtml.replace(/<br[\s\S]*?\/>|<br>/gi, ' ');
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlWithSpaces;
            let text = tempDiv.textContent.replace(/\s+/g, ' ').trim();

            if (beginTimeStr && endTimeStr && text) {
                parsedSubtitles.push({
                    begin: beginSeconds,
                    end: endSeconds,
                    text: text,
                    translatedText: null,
                    // Remove color properties, they are large and derived on demand
                    // baseWordColors: null,
                    // translatedWordColors: null
                });
            }
        });
        console.log(`Successfully parsed ${parsedSubtitles.length} subtitles.`);
        return true;
    } catch (e) {
        console.error("Fatal error during XML parsing:", e);
        // MODIFIED: Handle file upload error
        const errorMsg = (url === 'prime_file_upload') ? "Error parsing Prime Video file." : "Invalid URL retrieved - please repeat URL retrieval steps";
        sendStatusUpdate(errorMsg, 0, url, 'url');
        return false;
    }
}
// --- END MODIFICATION ---

function parseVttContent(vttString, url) {
    parsedSubtitles = [];
    try {
        const cues = vttString.split('\n\n');
        const timeRegex = /([\d:.]+) --> ([\d:.]+)/;

        for (const cue of cues) {
            const trimmedCue = cue.trim();
            if (trimmedCue.toUpperCase().startsWith('WEBVTT') || trimmedCue.toUpperCase().startsWith('STYLE')) {
                continue;
            }
            const lines = trimmedCue.split('\n');
            if (lines.length < 2) continue;
            const timeMatch = lines[0].match(timeRegex);
            if (timeMatch) {
                const begin = vttTimeToSeconds(timeMatch[1]);
                const end = vttTimeToSeconds(timeMatch[2]);
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
                        // Remove color properties
                        // baseWordColors: null,
                        // translatedWordColors: null
                    });
                }
            }
        }
        console.log(`Successfully parsed ${parsedSubtitles.length} VTT subtitles.`);
        return parsedSubtitles.length > 0;
    } catch (e) {
        console.error("Fatal error during VTT parsing:", e);
        // MODIFIED: Added check for context
        const isDisney = window.location.hostname === 'www.disneyplus.com';
        sendStatusUpdate(isDisney ? "Invalid Disney+ URL or content." : "Invalid VTT URL or content.", 0, url, 'url');
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
    const sampleText = parsedSubtitles.slice(0, 50).map(sub => sub.text).join(' ').slice(0, 1000);
    return detectLanguageFromText(sampleText);
}

// --- NEW FUNCTION: Hides native subtitles on all platforms ---
function hideNativeSubtitles() {
    const hostname = window.location.hostname;
    let nativeSubSelectors = [];

    if (hostname.includes('youtube.com')) {
        nativeSubSelectors = [
            '.ytp-caption-segment',
            '.ytp-caption-window'
        ];
    } else if (hostname.includes('disneyplus.com')) {
        // This is a guess for Disney's shadow DOM or container
        nativeSubSelectors = [
            '[data-testid="media-player__subtitle_line"]',
            '.dss-subtitle-renderer-container'
        ];
    } else if (hostname.includes('primevideo.com') || hostname.includes('amazon.')) {
        // Prime Video selectors
        nativeSubSelectors = [
            '.atvwebplayersdk-subtitle-text-container',
            '.persistent-player-subtitle-container'
        ];
    } else if (hostname.includes('netflix.com')) {
        nativeSubSelectors = ['.player-timedtext-text-container'];
    }

    if (nativeSubSelectors.length > 0) {
        let styleSheet = document.getElementById('ls-style-overrides');
        if (!styleSheet) {
            styleSheet = document.createElement('style');
            styleSheet.id = 'ls-style-overrides';
            document.head.appendChild(styleSheet);
        }

        const cssRules = nativeSubSelectors.map(selector =>
            `${selector} { display: none !important; visibility: hidden !important; }`
        ).join('\n');

        styleSheet.textContent = cssRules;
        console.log(`Language Stream: Hiding native subtitles with rules: ${cssRules}`);
    }
}
// --- END NEW FUNCTION ---

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
        // --- MODIFICATION: Changed 'position: absolute' to 'position: fixed' ---
        windowDiv.style.cssText = `position: fixed; bottom: 10%; left: 50%; transform: translateX(-50%); width: 90%; max-width: 1200px; min-height: 50px; background-color: rgba(0, 0, 0, 0); padding: 0; z-index: 9999; color: ${defaultFontColor}; font-family: 'Inter', sans-serif; font-size: 3.6rem; text-align: center; line-height: 1.4; cursor: grab; display: none; text-shadow: ${textShadow}; pointer-events: none;`;
        // --- END MODIFICATION ---
        makeDraggable(windowDiv);

        let playerContainer = getNetflixPlayerContainer(); // Try Netflix first
        if (!playerContainer) playerContainer = document.getElementById('movie_player'); // Fallback for YouTube
        if (!playerContainer) playerContainer = document.querySelector('.btm-media-player-container') || document.getElementById('vader_Player'); // Disney+
        if (!playerContainer) playerContainer = document.getElementById('dv-web-player'); // NEW: Prime Video container

        const parentElement = playerContainer || document.body;
        parentElement.appendChild(windowDiv);

        // This block (from the previous fix) is still correct.
        // We do NOT want to apply 'position: relative' to 'dv-web-player'.
        if (playerContainer && (playerContainer.classList.contains('watch-video--player-view') || playerContainer.id === 'movie_player' || playerContainer.id === 'vader_Player' || playerContainer.classList.contains('btm-media-player-container'))) {
            playerContainer.style.position = 'relative';
        }

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

async function processVocabColorCoding(subtitle) {
    const sanitizePhrase = (phrase) => phrase.toLowerCase().replace(/[.,/#!$%^&*;:{}=-_`~()]/g, "").trim();
    const baseWords = subtitle.text.split(/\s+/).filter(w => w.length > 0);
    const translatedWords = subtitle.translatedText.split(/\s+/).filter(w => w.length > 0);
    const baseWordColors = Array(baseWords.length).fill(0);
    const translatedWordColors = Array(translatedWords.length).fill(0);
    let colorCodeCounter = 1;
    const baseLang = subtitleLanguages.base;
    const targetLang = subtitleLanguages.target;

    for (let i = 0; i < baseWords.length; i++) {
        if (baseWordColors[i] !== 0) continue;
        const wordToTranslate = sanitizePhrase(baseWords[i]);
        if (wordToTranslate.length === 0) continue;
        const wordTranslation = await translateSubtitle(wordToTranslate, baseLang, targetLang);
        if (!wordTranslation || wordTranslation.includes('Translation Failed')) continue;
        const targetPhrase = sanitizePhrase(wordTranslation);
        const targetPhraseWords = targetPhrase.split(/\s+/).filter(w => w.length > 0);
        const matchLength = targetPhraseWords.length;
        for (let j = 0; j <= translatedWords.length - matchLength; j++) {
            let isUncolored = true;
            for (let k = 0; k < matchLength; k++) { if (translatedWordColors[j + k] !== 0) { isUncolored = false; break; } }
            if (!isUncolored) continue;
            const subtitlePhraseWords = translatedWords.slice(j, j + matchLength);
            const subtitlePhrase = sanitizePhrase(subtitlePhraseWords.join(' '));
            if (subtitlePhrase === targetPhrase) {
                baseWordColors[i] = colorCodeCounter;
                for (let k = 0; k < matchLength; k++) { translatedWordColors[j + k] = colorCodeCounter; }
                colorCodeCounter++;
                break;
            }
        }
    }
    for (let j = 0; j < translatedWords.length; j++) {
        if (translatedWordColors[j] !== 0) continue;
        const wordToTranslate = sanitizePhrase(translatedWords[j]);
        if (wordToTranslate.length === 0) continue;
        const wordTranslation = await translateSubtitle(wordToTranslate, targetLang, baseLang);
        if (!wordTranslation || wordTranslation.includes('Translation Failed')) continue;
        const targetPhrase = sanitizePhrase(wordTranslation);
        const targetPhraseWords = targetPhrase.split(/\s+/).filter(w => w.length > 0);
        const matchLength = targetPhraseWords.length;
        for (let i = 0; i <= baseWords.length - matchLength; i++) {
            let isUncolored = true;
            for (let k = 0; k < matchLength; k++) { if (baseWordColors[i + k] !== 0) { isUncolored = false; break; } }
            if (!isUncolored) continue;
            const subtitlePhraseWords = baseWords.slice(i, i + matchLength);
            const subtitlePhrase = sanitizePhrase(subtitlePhraseWords.join(' '));
            if (subtitlePhrase === targetPhrase) {
                translatedWordColors[j] = colorCodeCounter;
                for (let k = 0; k < matchLength; k++) { baseWordColors[i + k] = colorCodeCounter; }
                colorCodeCounter++;
                break;
            }
        }
    }
    // Store temporarily for display, but don't save permanently
    subtitle.tempBaseWordColors = baseWordColors;
    subtitle.tempTranslatedWordColors = translatedWordColors;
    // subtitle.baseWordColors = baseWordColors;
    // subtitle.translatedWordColors = translatedWordColors;
    subtitle.colorCodeCount = colorCodeCounter;
}

// --- MODIFICATION: Added saving step ---
async function translateAllSubtitles(url) {
    const totalSubs = parsedSubtitles.length;
    const baseLang = subtitleLanguages.base;
    const targetLang = subtitleLanguages.target;
    const CRITICAL_BATCH_SIZE = 30;
    const criticalBatch = parsedSubtitles.slice(0, CRITICAL_BATCH_SIZE);
    const concurrentBatch = parsedSubtitles.slice(CRITICAL_BATCH_SIZE);
    const START_PROGRESS = 60;
    const isVocab = (subtitleStylePref === 'vocabulary');
    const TRANSLATION_WEIGHT = isVocab ? 20 : 30; // Weight for translation part
    const MATCHING_WEIGHT = isVocab ? 10 : 0; // Weight for matching part
    const CRITICAL_BATCH_TOTAL_WEIGHT = TRANSLATION_WEIGHT + MATCHING_WEIGHT;
    const CONCURRENT_TRANSLATION_WEIGHT = isVocab ? 20 : 30;
    const CONCURRENT_MATCHING_WEIGHT = isVocab ? 10 : 0;
    const CONCURRENT_BATCH_TOTAL_WEIGHT = CONCURRENT_TRANSLATION_WEIGHT + CONCURRENT_MATCHING_WEIGHT;
    // --- NEW: Define final progress step before 100 ---
    const SAVING_PROGRESS_POINT = 98; // Use 98% to indicate saving step

    sendStatusUpdate(`Translating first ${criticalBatch.length} lines for immediate playback...`, START_PROGRESS, url);

    for (let index = 0; index < criticalBatch.length; index++) {
        if (isCancelled) throw new Error("ABORT_TRANSLATION");
        const sub = criticalBatch[index];
        sub.translatedText = await translateSubtitle(sub.text, baseLang, targetLang);
        let progress = START_PROGRESS + Math.floor(((index + 1) / criticalBatch.length) * TRANSLATION_WEIGHT);
        if (isVocab && sub.translatedText && !sub.translatedText.includes('Translation Failed')) {
             await processVocabColorCoding(sub);
             progress = START_PROGRESS + Math.floor(((index + 1) / criticalBatch.length) * CRITICAL_BATCH_TOTAL_WEIGHT);
        }
        sendStatusUpdate(`First ${index + 1} lines ready to watch!`, progress, url);
    }

    const CONCURRENT_START_PROGRESS = START_PROGRESS + CRITICAL_BATCH_TOTAL_WEIGHT;
    sendStatusUpdate(`First ${CRITICAL_BATCH_SIZE} lines ready! Starting background translation...`, CONCURRENT_START_PROGRESS, url);

    const translationPromises = concurrentBatch.map(async (sub, index) => {
        if (isCancelled) return Promise.resolve("ABORTED");
        sub.translatedText = await translateSubtitle(sub.text, baseLang, targetLang);
        if (isVocab && sub.translatedText && !sub.translatedText.includes('Translation Failed')) {
             await processVocabColorCoding(sub);
        }
        if (index % 5 === 0 || index === concurrentBatch.length - 1) {
            const progressRatio = (index + 1) / concurrentBatch.length;
            // Cap progress just below saving point if saving is needed
            const maxProgressBeforeSave = shouldSaveOffline ? SAVING_PROGRESS_POINT - 1 : 99;
            const progress = CONCURRENT_START_PROGRESS + Math.floor(progressRatio * CONCURRENT_BATCH_TOTAL_WEIGHT);
            const displayProgress = Math.min(progress, maxProgressBeforeSave); // Cap before saving step

            if (displayProgress < 100) {
                const totalReady = CRITICAL_BATCH_SIZE + index + 1;
                sendStatusUpdate(`First ${totalReady} lines ready to watch!`, displayProgress, url);
            }
        }
        return sub.translatedText;
    });

    await Promise.all(translationPromises);

    if (!isCancelled) {
        console.log("Translation complete. Checking if saving is needed...");
        // --- MODIFICATION: Save if requested BEFORE sending 100% ---
        if (shouldSaveOffline) {
            sendStatusUpdate("Saving subtitles for offline use...", SAVING_PROGRESS_POINT, url);
            await saveSubtitlesOffline(); // Wait for save to complete
            sendStatusUpdate(`Translation complete! ${totalSubs} lines ready.`, 100, url); // Final 100% after saving
        } else {
            sendStatusUpdate(`Translation complete! ${totalSubs} lines ready.`, 100, url); // Final 100% immediately
        }
        console.log("Native translation and saving (if applicable) process finished.");
        // --- END MODIFICATION ---
    } else {
        console.log("Translation finished, but process was cancelled.");
    }
}
// --- END MODIFICATION ---

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

function getIndexedColor(index, alpha) {
    const colors = ['white', 'red', 'green', 'blue', 'magenta', 'yellow', 'cyan', 'orange', 'lime', 'pink', 'teal'];
    const colorName = colors[(index - 1) % colors.length] || 'white';
    return colorNameToRgba(colorName, alpha);
}

// --- MODIFIED: Split startSubtitleSync and created separate loops ---
function startSubtitleSync() {
    if (syncInterval) clearInterval(syncInterval);
    disneyTimeElement = null; // Reset disney element reference
    let currentSubtitleIndex = -1;
    let lastTime = -1; // Initialize to -1 to ensure first run
    if (floatingWindow) floatingWindow.style.display = 'block';

    const currentFontSizeEm = getFontSizeEm(fontSizeEm);
    const currentFontShadow = getFontShadowCss(fontShadowPref);
    const baseFontColor = colorNameToRgba(fontColorPref, fontColorAlphaPref);
    let currentSpanBgColor = colorNameToRgba(backgroundColorPref, backgroundAlphaPref);
    const fontWeight = (subtitleStylePref === 'netflix') ? 'bold' : 'normal';

    if (floatingWindow) {
        floatingWindow.style.textShadow = currentFontShadow;
        floatingWindow.style.color = baseFontColor;
    }

    const getSpanStyle = (colorOverride = null) => {
        const finalColor = colorOverride || baseFontColor;
        const finalBgColor = (subtitleStylePref === 'vocabulary') ? colorNameToRgba('none', 0) : currentSpanBgColor;
        return `display: inline-block; padding: 0 0.2em; border-radius: 0.2em; background-color: ${finalBgColor}; font-size: ${currentFontSizeEm}; font-weight: ${fontWeight}; pointer-events: auto; color: ${finalColor};`;
    };

    const buildColorCodedHtml = (text, colorCodes, defaultColor, isBaseLanguage) => {
        if (!colorCodes || subtitleStylePref !== 'vocabulary') {
            const finalStyle = isBaseLanguage ? getSpanStyle(defaultColor) : getSpanStyle(colorNameToRgba('yellow', fontColorAlphaPref));
            return `<span style="${finalStyle}">${text}</span>`;
        }
        const words = text.split(/\s+/).filter(w => w.length > 0);
        let finalHtml = words.map((word, index) => {
            const colorCode = colorCodes[index] || 0;
            const wordColor = (colorCode === 0) ? colorNameToRgba('white', fontColorAlphaPref) : getIndexedColor(colorCode, fontColorAlphaPref);
            const wordStyle = getSpanStyle(wordColor);
            return `<span style="${wordStyle}">${word}</span>`;
        }).join(' ');
        return finalHtml;
    };

    const buildSimpleHtml = (text, isTranslated) => {
        let originalStyle = getSpanStyle(baseFontColor);
        let translatedStyle = getSpanStyle(baseFontColor);
        if (subtitleStylePref === 'grammar') {
            translatedStyle = getSpanStyle(colorNameToRgba('cyan', fontColorAlphaPref));
        } else if (subtitleStylePref === 'custom' || subtitleStylePref === 'netflix') {
            translatedStyle = getSpanStyle(colorNameToRgba(fontColorPref, fontColorAlphaPref));
        }
        const style = isTranslated ? translatedStyle : originalStyle;
        return `<span style="${style}">${text}</span>`;
    }

    // --- Core logic shared by both loops ---
    const updateSubtitleDisplay = (currentTime) => {
        if (currentTime === lastTime && lastTime !== -1) return; // Only update if time changed
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
            // Ensure currentTime is within the subtitle duration
            // Add a small buffer (e.g., 0.1s) to account for interval timing
            if (currentTime < sub.end + 0.1) {
                newSubtitle = sub;
                newIndex = bestMatchIndex;
            }
        }

        if (newIndex !== -1) {
            if (newIndex !== currentSubtitleIndex) {
                // --- MODIFICATION: Use temp color properties ---
                const { text, translatedText, tempBaseWordColors, tempTranslatedWordColors } = newSubtitle;
                // --- END MODIFICATION ---
                let innerHTML = '';
                if (translatedText) {
                    if (subtitleStylePref === 'vocabulary') {
                        // --- MODIFICATION: Use temp color properties ---
                        const baseHtml = buildColorCodedHtml(text, tempBaseWordColors, baseFontColor, true);
                        const translatedHtml = buildColorCodedHtml(translatedText, tempTranslatedWordColors, baseFontColor, false);
                        // --- END MODIFICATION ---
                        innerHTML = isTranslatedOnly ? translatedHtml : `${baseHtml}<br>${translatedHtml}`;
                    } else {
                        const baseHtml = buildSimpleHtml(text, false);
                        const translatedHtml = buildSimpleHtml(translatedText, true);
                        innerHTML = isTranslatedOnly ? translatedHtml : `${baseHtml}<br>${translatedHtml}`;
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
    // --- End core logic ---

    // --- Loop for Netflix/YouTube/Prime (uses video.currentTime) ---
    const syncLoopStandard = (videoElement) => {
        if (!videoElement) {
            console.error("Video element lost during sync loop.");
            clearInterval(syncInterval);
            return;
        }
        const currentTime = videoElement.currentTime;
        updateSubtitleDisplay(currentTime);
    };

    // --- Loop for Disney+ (uses aria-valuenow) ---
    const syncLoopDisney = () => {
        if (!disneyTimeElement) {
            // Attempt to re-find the element if lost (e.g., page navigation/reload within Disney+)
             const progressBarHost = document.querySelector('progress-bar');
             if (progressBarHost && progressBarHost.shadowRoot) {
                 disneyTimeElement = progressBarHost.shadowRoot.querySelector('.progress-bar__thumb');
             }
             if (!disneyTimeElement) {
                console.error("Disney+ time element lost during sync loop and couldn't be re-found.");
                clearInterval(syncInterval);
                sendStatusUpdate("Error: Lost connection to Disney+ player time.", 0);
                return;
             }
        }
        const timeString = disneyTimeElement.getAttribute('aria-valuenow');
        if (timeString === null) return; // Element might not be ready yet or attribute removed temporarily

        const currentTime = parseFloat(timeString);
        if (isNaN(currentTime)) return; // Invalid time value

        updateSubtitleDisplay(currentTime);
    };

    // --- Determine which loop to start ---
    const hostname = window.location.hostname;
    if (hostname === 'www.disneyplus.com') {
        // Find the Disney time element ONCE
        const progressBarHost = document.querySelector('progress-bar');
        if (progressBarHost && progressBarHost.shadowRoot) {
            disneyTimeElement = progressBarHost.shadowRoot.querySelector('.progress-bar__thumb');
            if (disneyTimeElement) {
                syncInterval = setInterval(syncLoopDisney, 100); // Check 10 times per second
                console.log("Disney+ subtitle sync loop started (using aria-valuenow polling).");
            } else {
                console.error("Could not find '.progress-bar__thumb' element inside Disney+ shadow root for time polling.");
                sendStatusUpdate("Error: Could not find Disney+ time element.", 0);
            }
        } else {
            console.error("Could not find Disney+ <progress-bar> element or its shadow root for time polling.");
            sendStatusUpdate("Error: Could not find Disney+ progress bar.", 0);
        }
    } else {
        // Assume Netflix, YouTube or Prime Video
        const videoElement = getVideoElement();
        if (videoElement) {
            // Need to wrap syncLoopStandard to pass videoElement correctly
            syncInterval = setInterval(() => syncLoopStandard(videoElement), 100); // Check 10 times per second
            console.log("Standard subtitle sync loop started (using video.currentTime polling).");
        } else {
            console.error("Could not find video element for Netflix/YouTube/Prime sync loop.");
            sendStatusUpdate("Error: Could not find video player.", 0);
        }
    }
}
// --- END MODIFIED startSubtitleSync ---

function disableNetflixSubObserver() {
    if (typeof subtitleObserver !== 'undefined' && subtitleObserver) {
        subtitleObserver.disconnect();
        console.log("Netflix native subtitle observer disconnected.");
    }
}

function getVideoElement() {
    let video = getNetflixVideoElement();
    if (video) return video;
    video = document.querySelector('#movie_player video.html5-main-video');
    if (video) return video;
    video = document.getElementById('hivePlayer1');
    if (video) return video;
    video = document.querySelector('.hive-video');
    if (video) return video;
    video = document.querySelector('.btm-media-client video');
    if (video) return video;
    video = document.querySelector('.btm-media-player-container video');
    if (video) return video;
    video = document.querySelector('#vader_Player video');
    if (video) return video;
    // NEW: Prime Video video element
    video = document.querySelector('.dv-player-video');
    if (video) return video;
    return null;
}

function parseYouTubeTranscript(transcriptText) {
    parsedSubtitles = [];
    const lines = transcriptText.split('\n');
    const timeRegex = /(?:.*?\s)?(?:(\d{1,2}):)?(\d{1,2}):(\d{2})$/;
    let currentSubtitle = null;

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        const timeMatch = trimmedLine.match(timeRegex);
        if (timeMatch) {
            const hours = parseInt(timeMatch[1] || '0', 10);
            const minutes = parseInt(timeMatch[2], 10);
            const seconds = parseInt(timeMatch[3], 10);
            const newTime = (hours * 3600) + (minutes * 60) + seconds;
            if (currentSubtitle) {
                currentSubtitle.end = newTime;
                if (currentSubtitle.text && currentSubtitle.end > currentSubtitle.begin) {
                    parsedSubtitles.push(currentSubtitle);
                }
            }
            currentSubtitle = {
                begin: newTime, end: 0, text: "", translatedText: null,
                // Remove color properties
                // baseWordColors: null, translatedWordColors: null
            };
        } else if (currentSubtitle) {
            currentSubtitle.text = (currentSubtitle.text + " " + trimmedLine).trim();
        }
    }
    if (currentSubtitle && currentSubtitle.text) {
        if (currentSubtitle.end === 0) { currentSubtitle.end = currentSubtitle.begin + 5; }
        if (currentSubtitle.end > currentSubtitle.begin) { parsedSubtitles.push(currentSubtitle); }
    }
    console.log(`Successfully parsed ${parsedSubtitles.length} subtitles from YouTube transcript.`);
    return parsedSubtitles.length > 0;
}

// --- NEW FUNCTION: Get Video Title ---
function getVideoTitle() {
    const hostname = window.location.hostname;
    let title = 'Unknown Title';

    try {
        if (hostname.includes('youtube.com')) {
            title = document.querySelector('h1.style-scope.ytd-watch-metadata')?.textContent.trim() ||
                    document.querySelector('meta[name="title"]')?.content ||
                    document.title.replace(' - YouTube', '').trim();
        } else if (hostname.includes('netflix.com')) {
            title = document.querySelector('.video-title h4')?.textContent.trim() ||
                    document.querySelector('meta[property="og:title"]')?.content ||
                    document.title.split(' | ')[0].trim();
        } else if (hostname.includes('disneyplus.com')) {
            // Disney titles might be harder due to dynamic loading
            title = document.querySelector('h1[data-testid="program-title"]')?.textContent.trim() ||
                    document.querySelector('meta[property="og:title"]')?.content ||
                    document.title.split(' | ')[0].trim();
        } else if (hostname.includes('primevideo.com') || hostname.includes('amazon.')) {
            title = document.querySelector('.atvwebplayersdk-title-text')?.textContent.trim() ||
                    document.querySelector('h1[data-automation-id="title"]')?.textContent.trim() ||
                    document.querySelector('meta[property="og:title"]')?.content ||
                    document.title.split(' - ')[0].split(' | ')[0].trim();
        }
    } catch (e) {
        console.warn("Could not reliably extract video title:", e);
    }
    // Clean up potential extra info
    title = title.replace(/\s+\(.*\)$/, ''); // Remove things like (Official Music Video)
    return title || 'Unknown Title';
}
// --- END NEW FUNCTION ---

// --- NEW FUNCTION: Save Subtitles to Storage ---
async function saveSubtitlesOffline() {
    console.log("Attempting to save subtitles for offline use...");
    if (!parsedSubtitles || parsedSubtitles.length === 0) {
        console.warn("No parsed subtitles available to save.");
        return;
    }

    // Determine the current service mode based on hostname
    let serviceMode = 'unknown';
    const hostname = window.location.hostname;
    if (hostname.includes('youtube.com')) serviceMode = 'youtube';
    else if (hostname.includes('netflix.com')) serviceMode = 'netflix';
    else if (hostname.includes('disneyplus.com')) serviceMode = 'disney';
    else if (hostname.includes('primevideo.com') || hostname.includes('amazon.')) serviceMode = 'prime';

    if (serviceMode === 'unknown') {
        console.warn("Could not determine service mode for saving.");
        return;
    }

    const videoTitle = getVideoTitle();
    const saveData = {
        title: videoTitle,
        baseLang: subtitleLanguages.base,
        targetLang: subtitleLanguages.target,
        isTranslatedOnly: isTranslatedOnly,
        style: subtitleStylePref,
        timestamp: Date.now(),
        subtitles: parsedSubtitles // Save the full array
    };

    try {
        const data = await chrome.storage.local.get('ls_offline_subtitles');
        const allSavedSubs = data.ls_offline_subtitles || {}; // { netflix: [], youtube: [], ... }

        if (!allSavedSubs[serviceMode]) {
            allSavedSubs[serviceMode] = [];
        }

        // Add the new data
        allSavedSubs[serviceMode].push(saveData);

        // Optional: Limit the number of saved items per service (e.g., keep last 20)
        const MAX_SAVED_PER_SERVICE = 20;
        if (allSavedSubs[serviceMode].length > MAX_SAVED_PER_SERVICE) {
            // Sort by timestamp descending (newest first) and keep the top N
            allSavedSubs[serviceMode].sort((a, b) => b.timestamp - a.timestamp);
            allSavedSubs[serviceMode] = allSavedSubs[serviceMode].slice(0, MAX_SAVED_PER_SERVICE);
        }

        await chrome.storage.local.set({ 'ls_offline_subtitles': allSavedSubs });
        console.log(`Subtitles saved successfully for ${serviceMode}: "${videoTitle}"`);
        // We don't need a status update here, popup shows it on completion message
    } catch (error) {
        console.error("Error saving subtitles to chrome.storage.local:", error);
        // Optionally send an error status update if needed
        // sendStatusUpdate("Error saving subtitles offline.", 99);
    }
}
// --- END NEW FUNCTION ---

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Check Language Pair
    if (request.command === "check_language_pair") {
        (async () => {
            let isAvailable = false;
            if ('Translator' in self && typeof Translator.availability === 'function') {
                try {
                    const availabilityResult = await Translator.availability({ sourceLanguage: request.baseLang, targetLanguage: request.targetLang });
                    isAvailable = (availabilityResult === 'available' || availabilityResult === 'downloadable');
                } catch (e) { console.error("Error checking availability:", e); }
            } else { console.warn("Translator API (or availability function) not available."); }
            sendResponse({ isAvailable: isAvailable, baseLang: request.baseLang, targetLang: request.targetLang });
        })();
        return true; // Indicates asynchronous response
    }

    // Detect Language from Text (YouTube Transcript)
    if (request.command === "detect_language_from_text") {
        (async () => {
            const baseLangCode = await detectLanguageFromText(request.text);
            sendResponse({ baseLangCode: baseLangCode });
        })();
        return true;
    }

    // --- NEW: Detect Language from TTML File Content (Prime Video) ---
    if (request.command === "detect_language_from_ttml") {
        (async () => {
            parsedSubtitles = [];
            let baseLangCode = null;
            if (request.ttmlString) {
                const parseSuccess = parseTtmlXml(request.ttmlString, 'prime_file_upload');
                if (parseSuccess && parsedSubtitles.length > 0) {
                    baseLangCode = await detectBaseLanguage();
                }
            }
            sendResponse({ baseLangCode: baseLangCode });
        })();
        return true;
    }

    // Detect Language from URL (Netflix)
    if (request.command === "detect_language") {
        (async () => {
            parsedSubtitles = [];
            const xmlContent = await fetchSubtitleContent(request.url);
            let baseLangCode = null;
            if (xmlContent) {
                const parseSuccess = parseTtmlXml(xmlContent, request.url);
                if (parseSuccess && parsedSubtitles.length > 0) {
                    baseLangCode = await detectBaseLanguage();
                }
            }
            sendResponse({ url: request.url, baseLangCode: baseLangCode });
        })();
        return true;
    }

    // Detect Language from URL (Disney+)
    if (request.command === "detect_language_disney") {
        (async () => {
            parsedSubtitles = [];
            const vttContent = await fetchSubtitleContent(request.url);
            let baseLangCode = null;
            if (vttContent) {
                const parseSuccess = parseVttContent(vttContent, request.url);
                if (parseSuccess && parsedSubtitles.length > 0) {
                    baseLangCode = await detectBaseLanguage();
                }
            }
            sendResponse({ url: request.url, baseLangCode: baseLangCode });
        })();
        return true;
    }

    // Process Netflix URL
    if (request.command === "fetch_and_process_url" && request.url) {
        if (isProcessing) return false;
        isProcessing = true;
        isCancelled = false;
        // Assign preferences...
        subtitleLanguages.target = request.targetLang;
        isTranslatedOnly = request.translatedOnly;
        shouldSaveOffline = request.saveOffline; // --- NEW ---
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
        if (!('Translator' in self)) { sendStatusUpdate("ERROR: Chrome Translator API not detected.", 0, url); isProcessing = false; return false; }

        (async () => {
            const xmlContent = await fetchSubtitleContent(url);
            if (!xmlContent || isCancelled) { isProcessing = false; return; }
            createFloatingWindow();
            hideNativeSubtitles(); // --- MODIFICATION: Hide native subs ---
            disableNetflixSubObserver();
            const parseSuccess = parseTtmlXml(xmlContent, url);
            if (parseSuccess && parsedSubtitles.length > 0 && !isCancelled) {
                sendStatusUpdate("Detecting language...", 30, url);
                subtitleLanguages.base = await detectBaseLanguage();
                if (isCancelled) { isProcessing = false; return; }
                if (!subtitleLanguages.base) { sendStatusUpdate(`Detection FAIL. Fallback 'en'...`, 30, url); subtitleLanguages.base = 'en'; }
                else { sendStatusUpdate(`Detected: ${subtitleLanguages.base.toUpperCase()}. Translating...`, 30, url); }
                startSubtitleSync(); // Call the modified function
                try {
                    await translateAllSubtitles(url);
                    // Saving now happens inside translateAllSubtitles if needed
                }
                catch (e) { if (e.message !== "ABORT_TRANSLATION") console.error("Translation error:", e); }
                isProcessing = false;
            } else { if (!isCancelled) sendStatusUpdate("Invalid URL.", 0, url, 'url'); isProcessing = false; }
        })();
        return false;
    }

    // Process YouTube Transcript
    if (request.command === "process_youtube_subtitles" && request.transcript) {
        if (isProcessing) return false;
        isProcessing = true;
        isCancelled = false;
        // Assign preferences...
        subtitleLanguages.target = request.targetLang;
        isTranslatedOnly = request.translatedOnly;
        shouldSaveOffline = request.saveOffline; // --- NEW ---
        fontSizeEm = request.fontSize;
        backgroundColorPref = request.backgroundColor;
        backgroundAlphaPref = request.backgroundAlpha;
        fontShadowPref = request.fontShadow;
        fontColorPref = request.fontColor;
        fontColorAlphaPref = request.fontColorAlpha;
        subtitleStylePref = request.colourCoding;
        translationCache = {};
        if (syncInterval) clearInterval(syncInterval);
        if (!('Translator' in self)) { sendStatusUpdate("ERROR: Chrome Translator API not detected.", 0, null, 'transcript'); isProcessing = false; return false; }

        (async () => {
            createFloatingWindow();
            hideNativeSubtitles(); // --- MODIFICATION: Hide native subs ---
            const parseSuccess = parseYouTubeTranscript(request.transcript);
            if (parseSuccess && parsedSubtitles.length > 0 && !isCancelled) {
                sendStatusUpdate("Detecting language...", 30, null, 'transcript');
                subtitleLanguages.base = await detectBaseLanguage();
                if (isCancelled) { isProcessing = false; return; }
                if (!subtitleLanguages.base) { sendStatusUpdate(`Detection FAIL. Fallback 'en'...`, 30, null, 'transcript'); subtitleLanguages.base = 'en'; }
                else { sendStatusUpdate(`Detected: ${subtitleLanguages.base.toUpperCase()}. Translating...`, 30, null, 'transcript'); }
                startSubtitleSync(); // Call the modified function
                try {
                    await translateAllSubtitles(null);
                    // Saving now happens inside translateAllSubtitles if needed
                }
                catch (e) { if (e.message !== "ABORT_TRANSLATION") console.error("Translation error:", e); }
                isProcessing = false;
            } else { if (!isCancelled) sendStatusUpdate("Invalid transcript. Please re-paste.", 0, null, 'transcript'); isProcessing = false; }
        })();
        sendResponse({ status: "processing_started" });
        return true;
    }

    // Process Disney+ URL
    if (request.command === "process_disney_url" && request.url) {
        if (isProcessing) return false;
        isProcessing = true;
        isCancelled = false;
        // Assign preferences...
        subtitleLanguages.target = request.targetLang;
        isTranslatedOnly = request.translatedOnly;
        shouldSaveOffline = request.saveOffline; // --- NEW ---
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
        if (!('Translator' in self)) { sendStatusUpdate("ERROR: Chrome Translator API not detected.", 0, url, 'url'); isProcessing = false; return false; }

        (async () => {
            const vttContent = await fetchSubtitleContent(url);
            if (!vttContent || isCancelled) { if (!isCancelled) sendStatusUpdate("Error fetching Disney+ subtitles.", 0, url, 'url'); isProcessing = false; return; }
            createFloatingWindow();
            hideNativeSubtitles(); // --- MODIFICATION: Hide native subs ---
            const parseSuccess = parseVttContent(vttContent, url);
            if (parseSuccess && parsedSubtitles.length > 0 && !isCancelled) {
                sendStatusUpdate("Detecting language...", 30, url, 'url');
                subtitleLanguages.base = await detectBaseLanguage();
                if (isCancelled) { isProcessing = false; return; }
                if (!subtitleLanguages.base) { sendStatusUpdate(`Detection FAIL. Fallback 'en'...`, 30, url, 'url'); subtitleLanguages.base = 'en'; }
                else { sendStatusUpdate(`Detected: ${subtitleLanguages.base.toUpperCase()}. Translating...`, 30, url, 'url'); }
                startSubtitleSync(); // Call the modified function
                try {
                    await translateAllSubtitles(url);
                     // Saving now happens inside translateAllSubtitles if needed
                }
                catch (e) { if (e.message !== "ABORT_TRANSLATION") console.error("Translation error:", e); }
                isProcessing = false;
            } else { if (!isCancelled) sendStatusUpdate("Invalid Disney+ URL or content.", 0, url, 'url'); isProcessing = false; }
        })();
        sendResponse({ status: "processing_started" });
        return true;
    }

    // NEW: Process Prime Video File Content
    if (request.command === "process_prime_file" && request.ttmlString) {
        if (isProcessing) return false;
        isProcessing = true;
        isCancelled = false;
        // Assign preferences...
        subtitleLanguages.target = request.targetLang;
        isTranslatedOnly = request.translatedOnly;
        shouldSaveOffline = request.saveOffline; // --- NEW ---
        fontSizeEm = request.fontSize;
        backgroundColorPref = request.backgroundColor;
        backgroundAlphaPref = request.backgroundAlpha;
        fontShadowPref = request.fontShadow;
        fontColorPref = request.fontColor;
        fontColorAlphaPref = request.fontColorAlpha;
        subtitleStylePref = request.colourCoding;
        translationCache = {};
        if (syncInterval) clearInterval(syncInterval);
        const urlStub = 'prime_file_upload'; // Use a stub for status updates
        if (!('Translator' in self)) { sendStatusUpdate("ERROR: Chrome Translator API not detected.", 0, urlStub, 'url'); isProcessing = false; return false; }

        (async () => {
            const ttmlContent = request.ttmlString;
            createFloatingWindow();
            hideNativeSubtitles(); // --- MODIFICATION: Hide native subs ---
            // Prime Video uses TTML, so we reuse the TTML parser
            const parseSuccess = parseTtmlXml(ttmlContent, urlStub);
            if (parseSuccess && parsedSubtitles.length > 0 && !isCancelled) {
                sendStatusUpdate("Detecting language...", 30, urlStub, 'url');
                subtitleLanguages.base = await detectBaseLanguage();
                if (isCancelled) { isProcessing = false; return; }
                if (!subtitleLanguages.base) { sendStatusUpdate(`Detection FAIL. Fallback 'en'...`, 30, urlStub, 'url'); subtitleLanguages.base = 'en'; }
                else { sendStatusUpdate(`Detected: ${subtitleLanguages.base.toUpperCase()}. Translating...`, 30, urlStub, 'url'); }
                startSubtitleSync(); // Call the modified function
                try {
                    await translateAllSubtitles(urlStub);
                    // Saving now happens inside translateAllSubtitles if needed
                }
                catch (e) { if (e.message !== "ABORT_TRANSLATION") console.error("Translation error:", e); }
                isProcessing = false;
            } else { if (!isCancelled) sendStatusUpdate("Invalid Prime Video file or content.", 0, urlStub, 'url'); isProcessing = false; }
        })();
        sendResponse({ status: "processing_started" });
        return true;
    }

    // Cancel Processing
    if (request.command === "cancel_processing") {
        isCancelled = true;
        if (syncInterval) {
            clearInterval(syncInterval);
            syncInterval = null;
        }
        // Reset element references on cancel
        disneyTimeElement = null;
        if (floatingWindow) {
            floatingWindow.style.display = 'none';
            floatingWindow.innerHTML = '';
        }
        // --- MODIFICATION: Clear style overrides on cancel ---
        let styleSheet = document.getElementById('ls-style-overrides');
        if (styleSheet) {
            styleSheet.textContent = ''; // Clear the rules
        }
        // --- END MODIFICATION ---
        isProcessing = false;
        (async () => { await chrome.storage.local.remove(['ls_status']); console.log("Processing cancelled. Cleared status from storage."); })();
        return false;
    }

    return false; // Indicate no async response for other commands
});