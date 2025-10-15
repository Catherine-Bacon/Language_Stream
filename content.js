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
    chrome.storage.local.set({ 'ls_status': { message: message, progress: progress, baseLang: subtitleLanguages.base, targetLang: subtitleLanguages.target, url: progress < 100 ? url : null } }).catch(e => console.error("Could not save status to storage:", e));
    chrome.runtime.sendMessage({ command: "update_status", message: message, progress: progress, route: route }).catch(e => { if (!e.message.includes('Receiving end does not exist')) console.warn("Content Script Messaging Error:", e); });
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

function getNetflixPlayerContainer() {
    return document.querySelector('.watch-video--player-view');
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
            if (beginTick && endTick && text) parsedSubtitles.push({ begin: ticksToSeconds(beginTick), end: ticksToSeconds(endTick), text: text, translatedText: null });
        });
        console.log(`Successfully parsed ${parsedSubtitles.length} subtitles.`);
        return true;
    } catch (e) {
        console.error("Fatal error during XML parsing:", e);
        sendStatusUpdate("Invalid URL retrieved - please repeat URL retrieval steps", 0, url, 'url');
        return false;
    }
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
        const playerContainer = getNetflixPlayerContainer();
        const parentElement = playerContainer || document.body;
        parentElement.appendChild(windowDiv);
        if (playerContainer) playerContainer.style.position = 'relative';
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

async function translateAllSubtitles(url) {
    const totalSubs = parsedSubtitles.length;
    const baseLang = subtitleLanguages.base;
    const targetLang = subtitleLanguages.target;
    const CRITICAL_BATCH_SIZE = 30;
    const criticalBatch = parsedSubtitles.slice(0, CRITICAL_BATCH_SIZE);
    const concurrentBatch = parsedSubtitles.slice(CRITICAL_BATCH_SIZE);
    const START_PROGRESS = 60;
    const CRITICAL_BATCH_WEIGHT = 10;
    const CONCURRENT_BATCH_WEIGHT = 30;
    sendStatusUpdate(`Translating first ${criticalBatch.length} lines for immediate playback...`, START_PROGRESS, url);
    for (let index = 0; index < criticalBatch.length; index++) {
        if (isCancelled) {
            console.log("Translation aborted.");
            throw new Error("ABORT_TRANSLATION");
        }
        const sub = criticalBatch[index];
        sub.translatedText = await translateSubtitle(sub.text, baseLang, targetLang);
        const progress = START_PROGRESS + Math.floor(((index + 1) / criticalBatch.length) * CRITICAL_BATCH_WEIGHT);
        sendStatusUpdate(`First ${index + 1} lines ready to watch!`, progress, url);
    }
    const CONCURRENT_START_PROGRESS = START_PROGRESS + CRITICAL_BATCH_WEIGHT;
    sendStatusUpdate(`First ${CRITICAL_BATCH_SIZE} lines ready! Starting background translation...`, CONCURRENT_START_PROGRESS, url);
    const translationPromises = concurrentBatch.map(async (sub, index) => {
        if (isCancelled) return Promise.resolve("ABORTED");
        sub.translatedText = await translateSubtitle(sub.text, baseLang, targetLang);
        if (index % 5 === 0 || index === concurrentBatch.length - 1) {
            const progress = CONCURRENT_START_PROGRESS + Math.floor(((index + 1) / concurrentBatch.length) * CONCURRENT_BATCH_WEIGHT);
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
        case 'none': return 'transparent';
    }
    return `rgba(${rgb}, ${alpha})`;
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

    if (subtitleStylePref === 'netflix') {
        currentSpanBgColor = 'transparent';
    }

    if (floatingWindow) {
        floatingWindow.style.textShadow = currentFontShadow;
        floatingWindow.style.color = baseFontColor;
    }
    
    const getSpanStyle = (colorOverride = null) => {
        const finalColor = colorOverride || baseFontColor;
        return `display: inline-block; padding: 0 0.5em; border-radius: 0.2em; background-color: ${currentSpanBgColor}; font-size: ${currentFontSizeEm}; font-weight: ${fontWeight}; pointer-events: auto; color: ${finalColor};`;
    };

    const syncLoop = () => {
        const currentTime = videoElement.currentTime;
        if (videoElement.paused && currentTime === lastTime) return;
        lastTime = currentTime;

        // --- OPTIMIZATION: Use Binary Search ---
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
                const { text, translatedText } = newSubtitle;
                
                let originalStyle = getSpanStyle();
                let translatedStyle = originalStyle;

                if (subtitleStylePref === 'vocabulary') {
                    translatedStyle = getSpanStyle(colorNameToRgba('yellow', fontColorAlphaPref));
                } else if (subtitleStylePref === 'grammar') {
                    translatedStyle = getSpanStyle(colorNameToRgba('cyan', fontColorAlphaPref));
                }

                let innerHTML = '';
                if (translatedText) {
                    if (isTranslatedOnly) {
                        innerHTML = `<span style="${translatedStyle}">${translatedText}</span>`;
                    } else {
                        innerHTML = `<span style="${originalStyle}">${text}</span><br><span style="${translatedStyle}">${translatedText}</span>`;
                    }
                } else if (!isTranslatedOnly) {
                    const placeholderStyle = `opacity:0.6; ${originalStyle}`;
                    innerHTML = `<span style="${originalStyle}">${text}</span><br><span style="${placeholderStyle}">(Translating...)</span>`;
                }
                
                floatingWindow.innerHTML = innerHTML;
                currentSubtitleIndex = newIndex;
            }
        } else if (currentSubtitleIndex !== -1) {
            floatingWindow.innerHTML = '';
            currentSubtitleIndex = -1;
        }
    };
    syncInterval = setInterval(syncLoop, 100); // Increased interval slightly for better performance
    console.log("Subtitle sync loop started with binary search.");
}


function disableNetflixSubObserver() {
    if (typeof subtitleObserver !== 'undefined' && subtitleObserver) {
        subtitleObserver.disconnect();
        console.log("Netflix native subtitle observer disconnected.");
    }
}

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

    if (request.command === "detect_language") {
        (async () => {
            parsedSubtitles = [];
            const xmlContent = await fetchXmlContent(request.url);

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
            }
        })();
        return true;
    }

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
            const videoElement = getNetflixVideoElement();
            if (!videoElement) {
                sendStatusUpdate("Video player not found.", 0);
                isProcessing = false;
                return;
            }
            const xmlContent = await fetchXmlContent(url);
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
        return false;
    }

    return false;
});