/* =============== Constants =============== */
const debug = true;

const IDENTIFIERS = {
	WATCH: "netflix.com/watch",   
	//WATCH_TEST: "netflix-test.html",
	LOCK_MSG: "Your device isn\’t part of the Netflix Household for this account",
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
	UNLOCK_FAILED: (count) => `removeLock() did not remove the correct element. Elements removed: ${count++})\nTrying again`,
	PROFILE_CHOICE_SCREEN: "Skipping init: profile choice screen",
	PREFIX: "[Netflix Nomad]",
	EXTENSION_ENABLED: "Extension enabled, attempting to remove lock"
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
let CONTROL_KEY = 'Space';
let autoplayDone = false;
let domain, unlockTimeout, autoplayTimeout;
let isInitialized = false;

/* =============== Body =============== */

//safegaurd
if (window.__netflixUnblockExecuted) throw new Error(ERR.REDUNDANT);
window.__netflixUnblockExecuted = true;

//get config from local storage
browserAPI.storage.local.get(["CONTROL_KEY", "ENABLED"]).then((result) => {
    if (result.CONTROL_KEY) CONFIG.CONTROL_KEY = result.CONTROL_KEY;
    if (result.ENABLED !== undefined) CONFIG.ENABLED = result.ENABLED;
    
    // Initialize if enabled
    if (CONFIG.ENABLED) {
        init();
    }
});


/* =============== Listeners =============== */
  
//update config
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (debug) console.log("Updating config");
    if (request.action === "updateConfig") {
        if (request.config.CONTROL_KEY) {
            CONFIG.CONTROL_KEY = request.config.CONTROL_KEY;
        }
        if (request.config.ENABLED !== undefined) {
            const wasEnabled = CONFIG.ENABLED;
            CONFIG.ENABLED = request.config.ENABLED;
            
            // If extension was just enabled, initialize or try to remove lock
            if (CONFIG.ENABLED && !wasEnabled) {
                if (debug) console.log(MESSAGES.PREFIX, MESSAGES.EXTENSION_ENABLED);
                
                if (!isInitialized) {
                    // Initialize if not already done
                    init();
                } else {
                    // Already initialized, just try to remove lock
                    tryUnlock();
                    
                    // Also try to process any videos
                    document.querySelectorAll('video').forEach(processVideo);
                }
            }
        }

        initializeKeyListener();
        
        sendResponse({status: "success"});
    }
});
  

  window.addEventListener('beforeunload', () => {
	cleanupCallbacks.forEach(fn => fn());
	clearTimeout(unlockTimeout);
    clearTimeout(autoplayTimeout);
  });

  function initializeKeyListener() {
	// Remove any existing event listener
	document.removeEventListener("keydown", playbackHandler);
	
	// Add new event listener with current config
	if (CONFIG.ENABLED) {
	  document.addEventListener("keydown", playbackHandler);
	}
  }

function getDomain() {
	const url = window.location.href;
	if (url.includes(IDENTIFIERS.WATCH)/* || url.includes(IDENTIFIERS.WATCH_TEST)*/) return "WATCH";
	return "OTHER";
}

function isLocked() {
	return document.body.innerText.includes((IDENTIFIERS.LOCK_MSG));
}

function removeLock() {
	const fullscreenElement = document.fullscreenElement;
	let removedAny = false;
	if (debug) console.log("Lock found")
	const elements = document.getElementsByClassName(IDENTIFIERS.TARGET_CLASS);
	
	for (let i = 0; i < elements.length; i++) {
		const style = getComputedStyle(elements[i]);
		if ((style.position === 'fixed' || style.position === 'sticky') && 
			!elements[i].contains(fullscreenElement)) {
			elements[i].remove();
			if (debug) console.log(MESSAGES.PREFIX, MESSAGES.ELEMENT_REMOVED);
			elemCount++;
			removedAny = true;
		}
	}
	return removedAny;
}

function tryUnlock() {
	if(!CONFIG.ENABLED) return;
	if (!isLocked()) {
		retryLock = 0;
		elemCount = 0;
		return;
	}

	let removed = removeLock();

	if (isLocked()) {
		if (!removed) {
			console.error(MESSAGES.ELEMENT_NOT_FOUND);
		}

		retryLock++;
		if (elemCount > CONFIG.MAX_ELEMENTS){
			console.error(MESSAGES.UNLOCK_FAILED(elemCount));
			location.reload();
		}
		else if (retryLock < CONFIG.MAX_RETRIES) {
			console.error(MESSAGES.RETRY(retryLock, CONFIG.MAX_ELEMENTS, CONFIG.RETRY_DELAY));
			clearTimeout(unlockTimeout);
			unlockTimeout = setTimeout(tryUnlock, CONFIG.RETRY_DELAY);
		} 
		else {
			console.error(MESSAGES.RETRY_MAX);
			location.reload(); 
		}
	}
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
	if(video.paused){
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

function togglePlayback() {
    if(!CONFIG.ENABLED) return;
	const video = getVideoElement();
    if (!video) return;
    
    try {
        if (video.paused) {
            video.play();
            if (debug) console.log(MESSAGES.PREFIX, MESSAGES.KEY_PLAY);
        } else {
            video.pause();
            if (debug) console.log(MESSAGES.PREFIX, MESSAGES.KEY_PAUSE);
        }
    } catch (e) {
        console.warn("Playback toggle failed:", e);
    }
}

const playbackHandler = (event) => {
	// For keyboard events
	if(!CONFIG.ENABLED) return;
	if(getDomain() == ("WATCH" /*|| "WATCH_TEST"*/)){
		if (event.type === 'keydown' && event.code === CONFIG.CONTROL_KEY) {
			event.preventDefault();
			event.stopPropagation(); 
			togglePlayback();
			if(debug) console.log(MESSAGES.PREFIX, MESSAGES.KEY_PLAY);
		}
		// TODO: add configuration for click to pause
		else if (event.type === 'click' && event.button === 0) {
			togglePlayback();
		}}
};

// browser.storage.sync.get(Object.keys(CONFIG)).then((saved) => {
// 	Object.assign(CONFIG, saved);
//   });
  
//   // Keep CONFIG updated live if user changes settings from popup
//   browser.storage.onChanged.addListener((changes, area) => {
// 	if (area === "sync") {
// 	  for (const [key, { newValue }] of Object.entries(changes)) {
// 		if (key in CONFIG) {
// 		  CONFIG[key] = newValue;
// 		}
// 	  }
// 	}
//   });
  
/* =============== Init =============== */
function init() {
	if(isInitialized) return;

	console.log(MESSAGES.PREFIX, MESSAGES.INIT_START);
	domain = getDomain()

	initializeKeyListener();

	window.addEventListener('keydown', playbackHandler, true);
	window.addEventListener('click', playbackHandler);

	cleanupCallbacks.push(() => {
		window.removeEventListener('keydown', playbackHandler, true); 
		window.removeEventListener('click', playbackHandler);
	});

	// Observer for new video elements
	const videoObserver = new MutationObserver(mutations => {
		mutations.forEach(mutation => {
			mutation.addedNodes.forEach(node => {
				if (node.tagName === 'VIDEO') processVideo(node);
				if (node.querySelectorAll) node.querySelectorAll('video').forEach(processVideo);
			});
		});
	});
	videoObserver.observe(document.body, { childList: true, subtree: true });
	cleanupCallbacks.push(() => videoObserver.disconnect());

	// Initial attempt after small delay
	setTimeout(() => {
		tryUnlock();
		document.querySelectorAll('video').forEach(processVideo);
	}, CONFIG.INITIAL_DELAY);

    // Observer for lock overlay changes (secondary safeguard)
    const lockObserver = new MutationObserver(() => {
        if (isLocked()) tryUnlock();
    });
    lockObserver.observe(document.body, { childList: true, subtree: true });
    cleanupCallbacks.push(() => lockObserver.disconnect());
}

if (CONFIG.ENABLED) {
    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
    }
}