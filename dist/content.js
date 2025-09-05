/* =============== Constants =============== */
const debug = true;

const IDENTIFIERS = {
    WATCH: "netflix.com/watch",   
    LOCK_MSG: "Your device isn\’t part of the Netflix Household for this account",
    OVERLAY: `[data-uia*="controls-standard"]`,
    TARGET_CLASS: "nf-modal interstitial-full-screen",
};

const CONFIG = {
    MAX_RETRIES: 20,
    INITIAL_DELAY: 2000, 
    RETRY_DELAY: 1000,    
    CONTROL_KEY: 'Space',  
    MAX_ELEMENTS: 10,
    ENABLED: true
};

const SELECTORS = {
    VIDEO: "video",
    FULLSCREEN_ELEMENT: () => document.fullscreenElement,
    BLOCKING_ELEMENTS: "body *:not(:fullscreen)",
    PROFILE_CHOICE: "profile-gate-label"
};

const MESSAGES = {
    INIT_START: "Initializing",
    AUTOPLAY_START: "Netflix AutoPlay started",
    AUTOPLAY_SUCCESS: "Autoplay successful",
    AUTOPLAY_ALREADY_PLAYING: "Video is already playing",
    AUTOPLAY_FAILED: (reason) => `Autoplay attempt failed: ${reason}`,
    AUTOPLAY_RESUME: "Resuming autoplay after netflix paused it",
    LOAD_FAILED: "Load attempt failed",
    RETRY: (count, max, delay) => 
      `Retrying in ${delay}ms (attempt ${count}/${max})`,
    RETRY_MAX: "Max retries reached, refreshing page",
    ELEMENT_NOT_FOUND: "Lock detected but cannot be remove",
    ELEMENT_REMOVED: "Removed locking element",
    PLAYBACK_STARTED: "Starting playback...",
    PLAYBACK_FAILED: (err) => `Playback failed: ${err}`,
    KEY_PLAY: (key) => key === "Space"
    ? "Video played via spacebar"
    : `Video played via ${key} key`,
    KEY_PAUSE: (key) => key === "Space"
    ? "Video paused via spacebar"
    : `Video paused via ${key} key`,
	CLICK_PLAY: "Video played via click",
	CLICK_PAUSE: "Video paused via click",
    UNLOCK_FAILED: (count) => `removeLock() did not remove the correct element. Elements removed: ${count})\nTrying again`,
    PROFILE_CHOICE_SCREEN: "Skipping init: profile choice screen",
    PREFIX: "[Netflix Nomad]",
    EXTENSION_ENABLED: "Extension enabled, attempting to remove lock",
    STORAGE_UPDATE: (key, value) => `Storage updated: ${key} = ${value}`,
    MESSAGE_RECEIVED: "Message received from runtime"
};

const ERR = {
    PLAYER_ERROR: 'No player sessions available',
    NOT_READY: 'Player/video not ready',
    REDUNDANT: "Script already loaded"
};

const cleanupCallbacks = [];

const browserAPI = (typeof browser !== "undefined") ? browser : chrome;

/* =============== Variables =============== */
let retryLock = 0;
let retryPlay = 0;
let elemCount = 0;
let autoplayDone = false;
let domain;
let unlockTimeout, autoplayTimeout;
let isInitialized = false;
let lockObserver = null;

/* =============== Body =============== */

if (window.__netflixUnblockExecuted) throw new Error(ERR.REDUNDANT);
window.__netflixUnblockExecuted = true;

async function loadConfig() {
    try {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Config load timeout')), 3000);
        });
        const result = await Promise.race([
            browserAPI.storage.local.get(["CONTROL_KEY", "ENABLED"]),
            timeoutPromise
        ]);
        
        if (debug) console.log(MESSAGES.PREFIX, "Loaded config from storage:", result);
        
        CONFIG.CONTROL_KEY = result.CONTROL_KEY || 'Space';
        CONFIG.ENABLED = result.ENABLED !== undefined ? result.ENABLED : true;
        
        return true;
    } catch (error) {
        console.error(MESSAGES.PREFIX, "Error loading config, using defaults:", error);
        CONFIG.CONTROL_KEY = 'Space';
        CONFIG.ENABLED = true;
        return true;
    }
}

/* =============== Listeners =============== */
  
function handleConfigUpdate(newConfig) {
    if (debug) console.log(MESSAGES.PREFIX, MESSAGES.STORAGE_UPDATE("CONTROL_KEY", newConfig.CONTROL_KEY));
    if (debug) console.log(MESSAGES.PREFIX, MESSAGES.STORAGE_UPDATE("ENABLED", newConfig.ENABLED));
    
    if (newConfig.CONTROL_KEY) {
        CONFIG.CONTROL_KEY = newConfig.CONTROL_KEY;
    }
    if (newConfig.ENABLED !== undefined) {
        const wasEnabled = CONFIG.ENABLED;
        CONFIG.ENABLED = newConfig.ENABLED;

        if (CONFIG.ENABLED && !wasEnabled) {
            if (debug) console.log(MESSAGES.PREFIX, MESSAGES.EXTENSION_ENABLED);
            
            if (!isInitialized) {
                init();
            } else {      
                tryUnlock();

                document.querySelectorAll('video').forEach(processVideo);
            }
        }
    }

    initializeKeyListener();
}

browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (debug) console.log(MESSAGES.PREFIX, MESSAGES.MESSAGE_RECEIVED, request);
    
    if (request.action === "updateConfig") {
        handleConfigUpdate(request.config);
        sendResponse({status: "success"});
        return true; 
    }
});

browserAPI.storage.onChanged.addListener((changes, area) => {
    if (area === "local") {
        if (debug) console.log(MESSAGES.PREFIX, "Storage changed:", changes);
        
        if (!changes.CONTROL_KEY && !changes.ENABLED) return;
        
        const newConfig = {};
        if (changes.CONTROL_KEY) {
            newConfig.CONTROL_KEY = changes.CONTROL_KEY.newValue;
        }
        if (changes.ENABLED) {
            newConfig.ENABLED = changes.ENABLED.newValue;
        }
        
        if (Object.keys(newConfig).length > 0) {
            setTimeout(() => handleConfigUpdate(newConfig), 100);
        }
    }
});

window.addEventListener('beforeunload', () => {
    cleanupCallbacks.forEach(fn => fn());
    clearTimeout(unlockTimeout);
    clearTimeout(autoplayTimeout);
    if (lockObserver) {
        lockObserver.disconnect();
    }
    if (window.videoObserver) {
        window.videoObserver.disconnect();
    }
});

function initializeKeyListener() {
    document.removeEventListener("keydown", playbackHandler);
    
    if (CONFIG.ENABLED) {
        document.addEventListener("keydown", playbackHandler);
        if (debug) console.log(MESSAGES.PREFIX, "Key listener initialized with key:", CONFIG.CONTROL_KEY);
    } else {
        if (debug) console.log(MESSAGES.PREFIX, "Key listener disabled");
    }
}

function getDomain() {
    const url = window.location.href;
    if (url.includes(IDENTIFIERS.WATCH)) return "WATCH";
    return "OTHER";
}

function isLocked() {
    return document.body.innerText.includes((IDENTIFIERS.LOCK_MSG));
}

function removeLock() {
    const fullscreenElement = document.fullscreenElement;
    let removedAny = false;
    if (debug) console.log(MESSAGES.PREFIX, "Lock found");
    
    const elements = document.getElementsByClassName(IDENTIFIERS.TARGET_CLASS);
    
    for (let i = 0; i < elements.length; i++) {
        if (!document.body.contains(elements[i])) {
            continue;
        }
        const style = getComputedStyle(elements[i]);
        if ((style.position === 'fixed' || style.position === 'sticky') && 
        (!fullscreenElement || !elements[i].contains(fullscreenElement))) {
            elements[i].remove();
            if (debug) console.log(MESSAGES.PREFIX, MESSAGES.ELEMENT_REMOVED);
            elemCount++;
            removedAny = true;
        }
    }
    return removedAny;
}

function tryUnlock() {
    if(!CONFIG.ENABLED) {
        if (debug) console.log(MESSAGES.PREFIX, "Extension disabled, skipping unlock");
        return;
    }

    if (!document.body || !document.body.contains) {
        if (debug) console.log(MESSAGES.PREFIX, "Document not ready");
        return;
    }

    if (!isLocked()) {
        retryLock = 0;
        elemCount = 0;
        return;
    }

    let removed = removeLock();

    if (isLocked()) {
        if (!removed) {
            console.error(MESSAGES.PREFIX, MESSAGES.ELEMENT_NOT_FOUND);
        }

        retryLock++;
        if (elemCount > CONFIG.MAX_ELEMENTS){
            console.error(MESSAGES.PREFIX, MESSAGES.UNLOCK_FAILED(elemCount));
            elemCount++;
            location.reload();
        }
        else if (retryLock < CONFIG.MAX_RETRIES) {
            console.error(MESSAGES.PREFIX, MESSAGES.RETRY(retryLock, CONFIG.MAX_ELEMENTS, CONFIG.RETRY_DELAY));
            clearTimeout(unlockTimeout);
            unlockTimeout = setTimeout(tryUnlock, CONFIG.RETRY_DELAY);
        } 
        else {
            console.error(MESSAGES.PREFIX, MESSAGES.RETRY_MAX);
            location.reload(); 
        }
    }
}

function setupLockObserver() {
    if (lockObserver) {
        lockObserver.disconnect();
    }
    
    lockObserver = new MutationObserver(() => {
        if (CONFIG.ENABLED && isLocked()) {
            if (debug) console.log(MESSAGES.PREFIX, "Lock detected via observer");
            tryUnlock();
        }
    });
    
    lockObserver.observe(document.body, { childList: true, subtree: true });
    if (debug) console.log(MESSAGES.PREFIX, "Lock observer set up");
}

async function tryAutoplay() {
    if(!CONFIG.ENABLED) return;
    if (autoplayDone) return;

    const video = document.querySelector("video");
    if (!video) return;

    try {
        await video.play();
        autoplayDone = true;
        setTimeout(() => {
            if (video.paused) {
                if (debug) console.log(MESSAGES.PREFIX, MESSAGES.AUTOPLAY_RESUME);
                video.play();
            }
        }, CONFIG.INITIAL_DELAY);

    } catch (e) {
        if (debug) console.log(MESSAGES.PREFIX, MESSAGES.AUTOPLAY_FAILED, e.message);
        scheduleRetry();
        return;
    }
}

function scheduleRetry() {
    clearTimeout(autoplayTimeout); 
    const video = document.querySelector('video');
    if(video && video.paused){
        if(retryPlay++ < CONFIG.MAX_RETRIES){
            if (debug) console.log(MESSAGES.PREFIX, MESSAGES.RETRY(retryPlay, CONFIG.MAX_RETRIES, CONFIG.RETRY_DELAY));
            autoplayTimeout = setTimeout(tryAutoplay, CONFIG.RETRY_DELAY);
        }
    }
}

function processVideo(video) {
    if(!CONFIG.ENABLED) return;
    if (autoplayDone || domain !== "WATCH") return;

    if (video.readyState >= 3) {
        tryAutoplay();
    } else {
        video.addEventListener('canplay', tryAutoplay, { once: true });
    }
}

function getVideoElement() {
    if (document.fullscreenElement?.querySelector('video')) {
        return document.fullscreenElement.querySelector('video');
    }
    return document.querySelector('video');
}

function togglePlayback(type) {
    if(!CONFIG.ENABLED) return;
    const video = getVideoElement();
    if (!video) return;
    
    try {
        if (video.paused) {
            video.play();
            if (debug){
				if (type === "key"){
					console.log(MESSAGES.PREFIX, MESSAGES.KEY_PLAY(CONFIG.CONTROL_KEY));
				}
				else{
					console.log(MESSAGES.PREFIX, MESSAGES.CLICK_PLAY);
				}
			}
        } else {
            video.pause();
            if (type === "key"){
				console.log(MESSAGES.PREFIX, MESSAGES.KEY_PAUSE(CONFIG.CONTROL_KEY));
			}
			else{
				console.log(MESSAGES.PREFIX, MESSAGES.CLICK_PAUSE);
			}
        }
    } catch (e) {
        console.warn(MESSAGES.PREFIX, "Playback toggle failed:", e);
    }
}

const playbackHandler = (event) => {
    if(!CONFIG.ENABLED) return;
    if(getDomain() === "WATCH"){
        if (event.type === 'keydown' && event.code === CONFIG.CONTROL_KEY) {
            event.preventDefault();
            event.stopPropagation(); 
            togglePlayback("key");
        }
    }
};

/* =============== Init =============== */
function init() {
    if(isInitialized) return;
    
    console.log(MESSAGES.PREFIX, MESSAGES.INIT_START);
    domain = getDomain();

    initializeKeyListener();

    window.addEventListener('keydown', playbackHandler, true);

    cleanupCallbacks.push(() => {
        window.removeEventListener('keydown', playbackHandler, true); 

    });

    if (window.videoObserver) {
        window.videoObserver.disconnect();
    }

	window.videoObserver = new MutationObserver(mutations => {
		mutations.forEach(mutation => {
			mutation.addedNodes.forEach(node => {
				if (node.tagName === 'VIDEO') processVideo(node);
				if (node.querySelectorAll) node.querySelectorAll('video').forEach(processVideo);
			});
		});
	});
	window.videoObserver.observe(document.body, { childList: true, subtree: true });
	cleanupCallbacks.push(() => window.videoObserver.disconnect());

    setupLockObserver();
    setTimeout(() => {
        tryUnlock();
        document.querySelectorAll('video').forEach(processVideo);
    }, CONFIG.INITIAL_DELAY);
    
    isInitialized = true;
}

async function initializeExtension() {
    await loadConfig();
    
    if (CONFIG.ENABLED) {
        if (document.readyState === 'complete') {
            init();
        } else {
            window.addEventListener('load', init);
        }
    } else {
        setupLockObserver();
    }
}

initializeExtension();