import { SELECTORS } from "./selectors.js";
import { IDENTIFIERS } from "./selectors.js";
import { CONFIG } from "./config.js";
import{ MESSAGES } from "./messages.js";
import { ERR } from "./messages.js";

//safegaurd
if (window.__netflixUnblockExecuted) throw new Error(ERR.REDUNDANT);
window.__netflixUnblockExecuted = true;

// ----------------
const debug = true;
//-----------------


//variables
let retryLock = 0;
let retryPlay = 0;
let elemCount = 0;
let autoplayDone = false;
let domain;
const cleanupCallbacks = [];
let unlockTimeout, autoplayTimeout;

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

function init() {
    console.log(MESSAGES.PREFIX, MESSAGES.INIT_START);
	domain = getDomain()

	const playbackHandler = (event) => {
		// For keyboard events
		if(getDomain() == "WATCH"){
			if (event.type === 'keydown' && event.code === CONFIG.CONTROL_KEY) {
				event.preventDefault();
				event.stopPropagation(); // Prevent Netflix handlers from interfering
				togglePlayback();
			}
			// For mouse events
			else if (event.type === 'click' && event.button === 0) {
				togglePlayback();
			}}
	};

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
	
window.addEventListener('beforeunload', () => {
	cleanupCallbacks.forEach(fn => fn());
	clearTimeout(unlockTimeout);
    clearTimeout(autoplayTimeout);
  });

if (document.readyState === 'complete') {
init();
} else {
window.addEventListener('load', init);
}