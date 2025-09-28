// --- File start: inpage.js ---

// Note: This script runs in the 'main' context of the Netflix page.
// It intercepts network calls to reliably get the subtitle URL.

const MANIFEST_PATTERN = new RegExp('manifest|licensedManifest');
const ALL_FORMATS = ['imsc1.1', 'dfxp-ls-sdh', 'webvtt-lssdh-ios8', 'simplesdh'];

// This function intercepts network data that contains subtitle information.
function injectInterceptor() {
    ((parse, stringify) => {
        JSON.parse = function (text) {
            const data = parse(text);

            if (data && data.result && data.result.timedtexttracks && data.result.movieId) {
                // We found the subtitle track data.
                const subtitleTracks = data.result.timedtexttracks;
                
                let foundUrl = null;
                // Look for the DFXP format URL, which is typically the TTML file.
                for (const track of subtitleTracks) {
                    if (track.isNoneTrack) continue;

                    // DFXP is the format corresponding to the full TTML/XML file
                    const dfxp = track.ttDownloadables['dfxp-ls-sdh']; 
                    if (dfxp && dfxp.downloadUrls) {
                        // Take the first URL found
                        foundUrl = Object.values(dfxp.downloadUrls)[0];
                        break; 
                    }
                }
                
                if (foundUrl) {
                    // Dispatch a CustomEvent to communicate with content.js (isolated world)
                    window.dispatchEvent(new CustomEvent('LS_Subtitle_Data_Found', {
                        detail: { url: foundUrl }
                    }));
                }
            }
            return data;
        };

        // This part forces the subtitle formats to be available in the manifest request
        JSON.stringify = function (data) {
            if (data && typeof data.url === 'string' && data.url.search(MANIFEST_PATTERN) > -1) {
                for (let v of Object.values(data)) {
                    try {
                        if (v.profiles) {
                            for(const profile_name of ALL_FORMATS) {
                                if(!v.profiles.includes(profile_name)) {
                                    v.profiles.unshift(profile_name);
                                }
                            }
                        }
                    }
                    catch (e) {
                        if (e instanceof TypeError)
                            continue;
                        else
                            throw e;
                    }
                }
            }
            return stringify(data);
        };
        
    })(JSON.parse, JSON.stringify);
}

// Inject the function and call it immediately
const sc = document.createElement('script');
sc.innerHTML = '(' + injectInterceptor.toString() + ')();';
document.head.appendChild(sc);
document.head.removeChild(sc);