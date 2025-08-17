// import { PAGE_IDENTIFIERS } from "./constants/config.js";
// import { CONFIG } from "./constants/config.js";
// import { MESSAGES } from "./constants/messages.js";
// import { SELECTORS } from "./constants/selectors.js";
// import { ERR } from "./constants/messages.js";

// ----- constants -----
const PAGE_IDENTIFIERS = {
	HOME: "Netflix",
	WATCH: "netflix.com/watch",   
	BROWSE: "netflix.com/browse",  
	TITLE: "netflix.com/title",		
	LOCK_MSG: "Your device isn\’t part of the Netflix Household for this account",
	CHOOSE_PROFILE: "Choose Profile", //TODO: confirm msg
};

const CONFIG = {
	MAX_RETRIES: 20,
	INITIAL_DELAY: 3000,  // ms before first autoplay attempt
	RETRY_DELAY: 1000,    // ms between retries
	CONTROL_KEY: 'Space',  // key to be used to play and pause
	MAX_ELEMENTS: 10,
};

const SELECTORS = {
    //BLOCKING_ELEMENTS: ".pinLockOverlay, .modalContainer, .overlay",
    //PROFILE_CHOICE: "profile-selection",
	VIDEO: "video",
	FULLSCREEN_ELEMENT: () => document.fullscreenElement,
	BLOCKING_ELEMENTS: "body *:not(:fullscreen)",
	PROFILE_CHOICE: "profile-gate-label"
};

const MESSAGES = {
	INIT_START: "Initializing - waiting for video load",
	AUTOPLAY_START: "Netflix AutoPlay started",
	AUTOPLAY_SUCCESS: "Autoplay successful",
	AUTOPLAY_ALREADY_PLAYING: "Video is already playing",
	AUTOPLAY_FAILED: (reason) => `Autoplay attempt failed: ${reason}`,
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
};

const ERR = {
	PLAYER_ERROR: 'No player sessions available',
	API_ERROR: 'Netflix API not ready',
	NOT_READY: 'Player/video not ready',
};

if (window.__netflixUnblockExecuted) throw new Error("Script already loaded");
window.__netflixUnblockExecuted = true;

let retryLock = 0;
let retryPlay = 0;
let elemCount = 0;
let autoplayDone = false;
let domain;
const cleanupCallbacks = [];
let unlockTimeout, autoplayTimeout;

function getDomain() {
	const url = window.location.href;
	if (url.includes(PAGE_IDENTIFIERS.WATCH)) return "WATCH";
	if (url.includes(PAGE_IDENTIFIERS.BROWSE)) return "BROWSE";
	if (url.includes(PAGE_IDENTIFIERS.TITLE)) return "TITLE";
	if (document.title.includes(PAGE_IDENTIFIERS.HOME)) return "HOME";
	return "UNKNOWN";
}

function isLocked() {
	return document.body.innerText.includes((PAGE_IDENTIFIERS.LOCK_MSG));
}
function removeLock() {
	const elements = document.querySelectorAll(SELECTORS.BLOCKING_ELEMENTS);
	const fullscreenElement = document.fullscreenElement;
	let removedAny = false;
	
	for (let i = 0; i < elements.length; i++) {
		const style = getComputedStyle(elements[i]);
		if ((style.position === 'fixed' || style.position === 'sticky') && 
			!elements[i].contains(fullscreenElement)) {
			elements[i].remove();
			console.log(MESSAGES.ELEMENT_REMOVED);
			elemCount++;
			removedAny = true;
			if(!isLocked()) break;
		}
	}
	return removedAny;
}//removeLock()


function tryUnlock() {
	if (!isLocked()) {
		retryLock = 0;
		elemCount = 0;
		return;
	}

	let removed = removeLock();

	if (isLocked()) {
		if (!removed) {
			console.error(MESSAGES.ELEMENT_NOT_FOUND);
			return;
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
			location.reload(); // refresh only after max retries
		}
	}
}//tryUnlock()

function waitForNetflixAPI(maxRetries = 50, delay = 500) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            const appContext = window.netflix?.appContext;
            const playerApp = appContext?.state?.playerApp;
            const getAPI = playerApp?.getAPI;

            if (getAPI) {
                clearInterval(interval);
                resolve(getAPI());
            } else if (attempts >= maxRetries) {
                clearInterval(interval);
                reject(new Error(ERR.API_ERROR));
            }
        }, delay);
    });
}


async function tryAutoplay() {
    if (autoplayDone) return;

    const video = document.querySelector("video");
    if (!video) return;

    try {
        await video.play();
		autoplayDone = true;
		setTimeout(() => {
			if (video.paused) {
				console.log("🔁 Forcing resume after Netflix pause");
				video.play();
			}
		}, 1000);

    } catch (err) {
        console.error("❌ Autoplay failed:", err.message);
        scheduleRetry(); // <-- retry if it failed
        return;
    }

    // Optional Netflix API part...
    try {
        await waitForNetflixAPI(CONFIG.MAX_RETRIES, CONFIG.RETRY_DELAY);
        const api = netflix.appContext.state.playerApp.getAPI();
        console.log("✅ Netflix API ready:", api);
    } catch (err) {
        console.warn("⚠️ API not ready yet, continuing without it:", err.message);
    }
}




function scheduleRetry() {
	clearTimeout(autoplayTimeout); 
	const video = document.querySelector('video');
	if(video.paused){
		if(retryPlay++ < CONFIG.MAX_RETRIES){
			console.log(MESSAGES.RETRY(retryPlay, CONFIG.MAX_RETRIES, CONFIG.RETRY_DELAY));
			autoplayTimeout = setTimeout(tryAutoplay, CONFIG.RETRY_DELAY);
		}
	}
}//scheduleRetry()

// Process video elements with readyState check
function processVideo(video) {
    if (autoplayDone || domain !== "WATCH") return;

    if (video.readyState >= 3) {
        tryAutoplay();
    } else {
        video.addEventListener('canplay', tryAutoplay, { once: true });
    }
}


function handleKeyEvent(event) {
	if (event.code === CONFIG.CONTROL_KEY) {
		event.preventDefault();
		const video = document.querySelector('video');
		if (video) {
			if (video.paused) {
				video.play();
				console.log(MESSAGES.KEY_PLAY(event.code));
			} 
			else {
				video.pause();
				console.log(MESSAGES.KEY_PAUSE(event.code));
			}
		}
	}
}//handleKeyEvent()

function init() {
    console.log(MESSAGES.INIT_START);

    // Keep domain updated in case user navigates
    const domainInterval = setInterval(() => {
        domain = getDomain();
        if (domain === "WATCH") {
            tryUnlock();
            document.querySelectorAll('video').forEach(processVideo);
        }
    }, 1000);
    cleanupCallbacks.push(() => clearInterval(domainInterval));

    // Key press listener
    window.addEventListener('keydown', handleKeyEvent, {
        capture: true,
        passive: true
    });
    cleanupCallbacks.push(() => {
        window.removeEventListener('keydown', handleKeyEvent);
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

    // Observer for lock overlay changes (secondary safeguard)
    const lockObserver = new MutationObserver(() => {
        if (isLocked()) tryUnlock();
    });
    lockObserver.observe(document.body, { childList: true, subtree: true });
    cleanupCallbacks.push(() => lockObserver.disconnect());

    // Initial attempt after small delay
    setTimeout(() => {
        tryUnlock();
        document.querySelectorAll('video').forEach(processVideo);
    }, CONFIG.INITIAL_DELAY);
}//init()

	
window.addEventListener('beforeunload', () => {
	cleanupCallbacks.forEach(fn => fn());
	clearTimeout(unlockTimeout);
    clearTimeout(autoplayTimeout);
  });

const isProfileScreen = document.querySelectorAll(`.${SELECTORS.PROFILE_CHOICE}`).length > 0;

if (isProfileScreen) {
console.log(MESSAGES.PROFILE_CHOICE_SCREEN);
} else if (document.readyState === 'complete') {
init();
} else {
window.addEventListener('load', init);
}