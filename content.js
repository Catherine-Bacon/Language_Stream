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

function sendStatusUpdate(message, progress, url = null, route = 'main', mode = 'netflix') {
    if (isCancelled) return; // FIX: Prevents any status updates after cancellation.
    chrome.storage.local.set({ 'ls_status': { message: message, progress: progress, baseLang: subtitleLanguages.base, targetLang: subtitleLanguages.target, url: progress < 100 ? url : null } }).catch(e => console.error("Could not save status to storage:", e));
    chrome.runtime.sendMessage({ command: "update_status", message: message, progress: progress, route: route, mode: mode }).catch(e => { if (!e.message.includes('Receiving end does not exist')) console.warn("Content Script Messaging Error:", e); });
}

function ticksToSeconds(tickString) {
    if (!tickString) return 0;
    const tickValue = parseInt(tickString.replace('t', ''), 10);
    return tickValue / TICK_RATE;
}

function getNetflixVideoElement() {
    const playerView = document.querySelector('.watch-video--player-view');
    if (playerView) return playerView.querySelector('video');
    return document.querySelector('video[src*="blob"]');
}

// --- MODIFICATION: New YouTube Video Element Getter ---
function getYoutubeVideoElement() {
    return document.querySelector('video.html5-main-video') || document.querySelector('ytd-player video');
}

function getNetflixPlayerContainer() {
    return document.querySelector('.watch-video--player-view');
}

// --- MODIFICATION: New YouTube Player Container Getter ---
function getYoutubePlayerContainer() {
    return document.querySelector('#movie_player') || document.querySelector('ytd-player');
}

async function fetchXmlContent(url) {
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

// --- MODIFICATION: New simplified parser for YouTube raw data ---
function parseRawSubtitles(rawSubs) {
    parsedSubtitles = [];
    rawSubs.forEach(sub => {
        if (sub.begin !== undefined && sub.end !== undefined && sub.text) {
            parsedSubtitles.push({
                begin: sub.begin,
                end: sub.end,
                text: sub.text,
                translatedText: null,
                baseWordColors: null,
                translatedWordColors: null
            });
        }
    });
    console.log(`Successfully parsed ${parsedSubtitles.length} subtitles from YouTube data.`);
    return parsedSubtitles.length > 0;
}

function detectBaseLanguage() {
    const sampleText = parsedSubtitles.slice(0, 50).map(sub => sub.text).join(' ').slice(0, 1000);
    return new Promise((resolve) => {
        if (!chrome.i18n || !chrome.i18n.detectLanguage) {
            console.error("Chrome i18n.detectLanguage API not available. Defaulting to 'en'.");
            resolve('en');
            return;
        }
        chrome.i18n.detectLanguage(sampleText, (result) => {
            const detectedCode = (result.languages && result.languages.length > 0 && result.languages[0].language !== 'und') ? result.languages[0].language : null;
            resolve(detectedCode);
        });
    });
}

function createFloatingWindow(mode) {
    let existingWindow = document.getElementById('language-stream-window');
    const textShadow = getFontShadowCss(fontShadowPref);
    const defaultFontColor = colorNameToRgba(fontColorPref, fontColorAlphaPref);
    
    // Determine the player container based on mode
    const playerContainer = (mode === 'youtube' ? getYoutubePlayerContainer() : getNetflixPlayerContainer());
    
    if (existingWindow) {
        floatingWindow = existingWindow;
        floatingWindow.style.textShadow = textShadow;
        floatingWindow.style.color = defaultFontColor;
    } else {
        const windowDiv = document.createElement('div');
        windowDiv.id = 'language-stream-window';
        // CRITICAL: Ensure correct positioning relative to the detected player container
        windowDiv.style.cssText = `position: absolute; bottom: 10%; left: 50%; transform: translateX(-50%); width: 90%; max-width: 1200px; min-height: 50px; background-color: rgba(0, 0, 0, 0); padding: 0; z-index: 9999; color: ${defaultFontColor}; font-family: 'Inter', sans-serif; font-size: 3.6rem; text-align: center; line-height: 1.4; cursor: grab; display: none; text-shadow: ${textShadow}; pointer-events: none;`;
        makeDraggable(windowDiv);
        
        const parentElement = playerContainer || document.body;
        parentElement.appendChild(windowDiv);
        if (playerContainer) {
             // For YouTube, the movie_player is already relatively positioned, 
             // but ensuring it doesn't break.
             if (mode === 'netflix' && playerContainer.style.position !== 'relative') {
                playerContainer.style.position = 'relative';
             }
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

async function translateAllSubtitles(url, mode) {
    const totalSubs = parsedSubtitles.length;
    const baseLang = subtitleLanguages.base;
    const targetLang = subtitleLanguages.target;
    const CRITICAL_BATCH_SIZE = 30;
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
    
    sendStatusUpdate(`Translating first ${criticalBatch.length} lines for immediate playback...`, START_PROGRESS, url, 'main', mode);
    
    // --- Phase 1: Critical Batch Translation and VOCAB PROCESSING ---
    for (let index = 0; index < criticalBatch.length; index++) {
        if (isCancelled) {
            console.log("Translation aborted.");
            throw new Error("ABORT_TRANSLATION");
        }
        const sub = criticalBatch[index];
        
        // 1. Translate the entire line
        sub.translatedText = await translateSubtitle(sub.text, baseLang, targetLang);
        
        let progress = START_PROGRESS + Math.floor(((index + 1) / criticalBatch.length) * TRANSLATION_WEIGHT);

        // 2. MODIFICATION: Process for word-level color coding if in Vocab mode
        if (isVocab && sub.translatedText && !sub.translatedText.includes('Translation Failed')) {
             await processVocabColorCoding(sub);
             progress = START_PROGRESS + Math.floor(((index + 1) / criticalBatch.length) * CRITICAL_BATCH_TOTAL_WEIGHT);
        }
        
        sendStatusUpdate(`First ${index + 1} lines ready to watch!`, progress, url, 'main', mode);
    }
    
    // --- Phase 2: Concurrent Batch Translation and VOCAB PROCESSING ---
    const CONCURRENT_START_PROGRESS = START_PROGRESS + CRITICAL_BATCH_TOTAL_WEIGHT;
    sendStatusUpdate(`First ${CRITICAL_BATCH_SIZE} lines ready! Starting background translation...`, CONCURRENT_START_PROGRESS, url, 'main', mode);
    
    const translationPromises = concurrentBatch.map(async (sub, index) => {
        if (isCancelled) return Promise.resolve("ABORTED");
        
        // 1. Translate the entire line
        sub.translatedText = await translateSubtitle(sub.text, baseLang, targetLang);
        
        // 2. MODIFICATION: Process for word-level color coding if in Vocab mode
        if (isVocab && sub.translatedText && !sub.translatedText.includes('Translation Failed')) {
             await processVocabColorCoding(sub);
        }
        
        if (index % 5 === 0 || index === concurrentBatch.length - 1) {
            const progressRatio = (index + 1) / concurrentBatch.length;
            
            const progress = CONCURRENT_START_PROGRESS + Math.floor(progressRatio * CONCURRENT_BATCH_TOTAL_WEIGHT);

            if (progress < 100) {
                const totalReady = CRITICAL_BATCH_SIZE + index + 1;
                sendStatusUpdate(`First ${totalReady} lines ready to watch!`, progress, url, 'main', mode);
            }
        }
        return sub.translatedText;
    });
    
    await Promise.all(translationPromises);
    
    if (!isCancelled) {
        sendStatusUpdate(`Translation complete! ${totalSubs} lines ready.`, 100, url, 'main', mode);
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
    const colorName = colors[index % colors.length] || 'white';
    return colorNameToRgba(colorName, alpha);
}

function startSubtitleSync(videoElement, mode) {
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
        floatingWindow.style.fontSize = currentFontSizeEm; // Apply size to main container for relative sizing
    }
    
    const getSpanStyle = (colorOverride = null) => {
        const finalColor = colorOverride || baseFontColor;
        const finalBgColor = (subtitleStylePref === 'vocabulary') ? colorNameToRgba('none', 0) : currentSpanBgColor;

        return `display: inline-block; padding: 0 0.2em; border-radius: 0.2em; background-color: ${finalBgColor}; font-weight: ${fontWeight}; pointer-events: auto; color: ${finalColor};`;
    };

    const buildColorCodedHtml = (text, colorCodes, defaultColor, isBaseLanguage) => {
        if (!colorCodes || subtitleStylePref !== 'vocabulary') {
            const finalColor = isBaseLanguage ? defaultColor : getSpanStyle(colorNameToRgba('yellow', fontColorAlphaPref));
            return `<span style="${finalColor}">${text}</span>`;
        }

        const words = text.split(/\s+/).filter(w => w.length > 0);
        
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
            return `<span style="${originalStyle}">${text}</span>`; 
        } else if (subtitleStylePref === 'grammar') {
            translatedStyle = getSpanStyle(colorNameToRgba('cyan', fontColorAlphaPref));
        } else if (subtitleStylePref === 'custom' || subtitleStylePref === 'netflix') {
            translatedStyle = getSpanStyle(colorNameToRgba(fontColorPref, fontColorAlphaPref));
        }
        
        const style = isTranslated ? translatedStyle : originalStyle;
        return `<span style="${style}">${text}</span>`;
    }

    const syncLoop = () => {
        const currentTime = videoElement.currentTime;
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

// --- MODIFICATION: Implemented Live Transcript Scraping Logic ---
function extractYoutubeTranscript() {
    // Select the entire transcript panel container
    const transcriptPanel = document.querySelector('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"] #transcript');
    
    if (!window.location.href.includes('youtube.com/watch')) {
        return { success: false, error: "Error: Not on a YouTube video page.", data: null, baseLangCode: null };
    }

    if (!transcriptPanel) {
        // This is the CRITICAL failure point if the user hasn't opened the transcript
        return { success: false, error: "Error: Transcript panel not found. Did you click 'Show transcript'?", data: null, baseLangCode: null };
    }
    
    // Find the currently displayed language code from the settings button's aria-label
    // This element is usually nested inside ytd-transcript-renderer
    const langElement = document.querySelector('ytd-transcript-renderer button[aria-label^="Transcript language:"]');
    let baseLangCode = 'en'; // Default fallback
    if (langElement) {
        const match = langElement.getAttribute('aria-label').match(/language:\s*([a-z]{2})/i);
        if (match && match[1]) {
            baseLangCode = match[1].toLowerCase();
        }
    }
    
    // Select all individual transcript segments
    const transcriptElements = transcriptPanel.querySelectorAll('ytd-transcript-segment-renderer');
    const fullTranscript = [];
    let previousEndTime = 0;

    transcriptElements.forEach((segment, index) => {
        const timeElement = segment.querySelector('.segment-timestamp');
        const textElement = segment.querySelector('.segment-text');

        if (timeElement && textElement) {
            // Convert MM:SS or H:MM:SS to seconds
            const timeParts = timeElement.textContent.trim().split(':').map(p => parseInt(p, 10));
            let beginTime = 0;
            if (timeParts.length === 3) {
                beginTime = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
            } else if (timeParts.length === 2) {
                beginTime = timeParts[0] * 60 + timeParts[1];
            } else if (timeParts.length === 1) {
                beginTime = timeParts[0];
            }

            const text = textElement.textContent.trim();

            if (text) {
                // Determine the end time: use the next segment's start time, 
                // or a default duration if it's the last segment.
                let endTime = 0;
                if (index < transcriptElements.length - 1) {
                    // Try to peek at the next segment's start time
                    const nextTimeElement = transcriptElements[index + 1].querySelector('.segment-timestamp');
                    if (nextTimeElement) {
                        const nextTimeParts = nextTimeElement.textContent.trim().split(':').map(p => parseInt(p, 10));
                        if (nextTimeParts.length === 3) {
                            endTime = nextTimeParts[0] * 3600 + nextTimeParts[1] * 60 + nextTimeParts[2];
                        } else if (nextTimeParts.length === 2) {
                            endTime = nextTimeParts[0] * 60 + nextTimeParts[1];
                        } else if (nextTimeParts.length === 1) {
                            endTime = nextTimeParts[0];
                        }
                    }
                }
                
                // If endTime couldn't be determined from the next segment, estimate it
                if (endTime <= beginTime) {
                    endTime = beginTime + 3.0; // Assume 3-second duration if no explicit end time
                }

                // Ensure timing consistency (prevents negative durations if scraping is slightly off)
                if (beginTime < previousEndTime) {
                    beginTime = previousEndTime;
                }
                
                fullTranscript.push({
                    begin: beginTime,
                    end: endTime,
                    text: text
                });
                previousEndTime = endTime;
            }
        }
    });

    if (fullTranscript.length > 0) {
        return { success: true, data: fullTranscript, baseLangCode: baseLangCode };
    } else {
        return { success: false, error: "Error: No text or segments found in the transcript panel.", data: null, baseLangCode: null };
    }
}
// --- END MODIFICATION ---


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    // --- NEW LISTENER: YouTube Transcript Detection ---
    if (request.command === "detect_youtube_transcript") {
        const result = extractYoutubeTranscript();
        sendResponse(result);
        return true; 
    }
    // --- END NEW LISTENER ---
    
    if (request.command === "check_language_pair") {
        // This function checks language availability (requires external translation API)
        
        // Placeholder implementation for language check
        const isAvailable = (request.baseLang && request.targetLang && request.baseLang !== request.targetLang);

        sendResponse({
            isAvailable: isAvailable,
            baseLang: request.baseLang,
            targetLang: request.targetLang
        });
        return true; 
    }

    if (request.command === "detect_language") {
        // This function is for Netflix (detecting language from a fetched XML)
        
        // Asynchronously parse XML to detect language
        (async () => {
            const xmlContent = await fetchXmlContent(request.url);
            if (!xmlContent) {
                sendResponse({ url: request.url, baseLangCode: null });
                return;
            }
            if (!parseTtmlXml(xmlContent, request.url)) {
                sendResponse({ url: request.url, baseLangCode: null });
                return;
            }
            const baseLangCode = await detectBaseLanguage();
            sendResponse({ url: request.url, baseLangCode: baseLangCode });
        })();
        return true; 
    }

    // --- MODIFICATION: Updated fetch_and_process_url to handle YouTube mode ---
    if (request.command === "fetch_and_process_url" && request.targetLang) {
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
        const mode = request.mode; // New: Capture mode
        translationCache = {};
        if (syncInterval) clearInterval(syncInterval);
        const url = request.url; // Only relevant for Netflix

        if (!('Translator' in self)) {
            sendStatusUpdate("ERROR: Chrome Translator API not detected.", 0, url, 'main', mode);
            isProcessing = false;
            return false;
        }

        (async () => {
            const videoElement = mode === 'youtube' ? getYoutubeVideoElement() : getNetflixVideoElement();
            
            if (!videoElement) {
                sendStatusUpdate("Video player not found.", 0, url, 'main', mode);
                isProcessing = false;
                return;
            }
            
            let parseSuccess = false;
            
            if (mode === 'netflix') {
                const xmlContent = await fetchXmlContent(url);
                if (!xmlContent || isCancelled) {
                    isProcessing = false;
                    return;
                }
                parseSuccess = parseTtmlXml(xmlContent, url);
                
            } else { // YouTube Mode
                const data = await chrome.storage.local.get(['youtube_transcript_data', 'youtube_base_lang_code']);
                if (!data.youtube_transcript_data || isCancelled) {
                    sendStatusUpdate("Error: Transcript not found in storage.", 0, url, 'url', mode);
                    isProcessing = false;
                    return;
                }
                subtitleLanguages.base = data.youtube_base_lang_code;
                parseSuccess = parseRawSubtitles(data.youtube_transcript_data);
                await chrome.storage.local.remove(['youtube_transcript_data']); // Clear after loading
            }
            
            createFloatingWindow(mode);
            if (mode === 'netflix') disableNetflixSubObserver();
            
            if (parseSuccess && parsedSubtitles.length > 0 && !isCancelled) {
                
                if (mode === 'netflix') {
                    sendStatusUpdate("Detecting language...", 30, url, 'main', mode);
                    subtitleLanguages.base = await detectBaseLanguage();
                }
                
                if (isCancelled) {
                    isProcessing = false;
                    return;
                }
                
                if (!subtitleLanguages.base) {
                    sendStatusUpdate(`Detection FAIL. Fallback 'en'.`, 30, url, 'main', mode);
                    subtitleLanguages.base = 'en';
                } else {
                    sendStatusUpdate(`Detected: ${subtitleLanguages.base.toUpperCase()}. Translating...`, 30, url, 'main', mode);
                }
                
                startSubtitleSync(videoElement, mode);
                
                try {
                    await translateAllSubtitles(url, mode);
                } catch (e) {
                    if (e.message !== "ABORT_TRANSLATION") console.error("Translation error:", e);
                }
                isProcessing = false;
            } else {
                if (!isCancelled) sendStatusUpdate(mode === 'netflix' ? "Invalid URL." : "No valid transcript lines found.", 0, url, 'url', mode);
                isProcessing = false;
            }
        })();
        return false;
    }

    if (request.command === "cancel_processing") {
        console.log("Processing cancelled by user command.");
        isCancelled = true;
        isProcessing = false;
        if (syncInterval) clearInterval(syncInterval);
        
        // Remove the custom subtitle window
        const windowDiv = document.getElementById('language-stream-window');
        if (windowDiv) {
            windowDiv.remove();
        }
        
        // Clear status storage
        chrome.storage.local.remove(['ls_status', 'last_input', 'translated_only_pref', 'subtitle_style_pref', 'detected_base_lang_name', 'detected_base_lang_code', 'youtube_transcript_data', 'youtube_base_lang_code']);
        
        // Placeholder: If Netflix observer was disabled, re-enable if possible (complex for this scope)

        return false;
    }

    return false;
});