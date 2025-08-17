import { PAGE_IDENTIFIERS } from "./constants/config.js";
import { CONFIG } from "./constants/config.js";
import { MESSAGES } from "./constants/messages.js";
import { SELECTORS } from "./constants/selectors.js";
import { ERR } from "./constants/messages.js";

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



function tryAutoplay(){
	if (autoplayDone || isLocked() ) return;

	if (retryPlay >= CONFIG.MAX_RETRIES){
		console.error(MESSAGES.RETRY_MAX);
		location.reload();
	}
	
	try {
		if (!window.netflix?.appContext?.state?.playerApp?.getAPI) {
			throw new Error(ERR.API_ERROR);
		}
		const api = netflix.appContext.state.playerApp.getAPI();
		const sessionIds = api.videoPlayer.getAllPlayerSessionIds();

		if (!sessionIds?.length) {
			throw new Error(ERR.PLAYER_ERROR);
		}
		const player = api.videoPlayer.getVideoPlayerBySessionId(sessionIds[0]);
		const video = document.querySelector('video');

		if (!player || typeof player.isPaused !== 'function' || !video) {
			throw new Error(ERR.NOT_READY);
		}

		if (player.isPaused()){
			console.log(MESSAGES.PLAYBACK_STARTED);
			player.play().then(() => {
				console.log(MESSAGES.AUTOPLAY_SUCCESS)
				autoplayDone = true;
				clearTimeout(autoplayTimeout);
			}).catch(e => {
				console.log(MESSAGES.PLAYBACK_FAILED, e.message);
				scheduleRetry();
			});
		}
		else {
			console.log(MESSAGES.AUTOPLAY_ALREADY_PLAYING);
			autoplayDone = true;
			clearTimeout(autoplayTimeout);
		}
	} catch(e) {
		console.log(MESSAGES.AUTOPLAY_FAILED, e.message);
		scheduleRetry();
	}
}//tryAutoplay()

function scheduleRetry() {
	clearTimeout(autoplayTimeout); 
	if(retryPlay++ < CONFIG.MAX_RETRIES){
		console.log(MESSAGES.RETRY(retryPlay, CONFIG.MAX_RETRIES, CONFIG.RETRY_DELAY));
		autoplayTimeout = setTimeout(tryAutoplay, CONFIG.RETRY_DELAY);
	}
}//scheduleRetry()

// Process video elements with readyState check
function processVideo(video) {
    if (autoplayDone || domain != "WATCH") return;
    
    const playHandler = () => {
        if (!autoplayDone) {
            if (isLocked()) tryUnlock();
            tryAutoplay();
        }
    };
    
    if (video.readyState >= 3) { 
        playHandler();
    } else {
        video.addEventListener('canplay', playHandler, { once: true });
    }
}//processVideo()

function handleKeyEvent(event) {
	if (event.code === CONFIG.CONTROL_KEY) {
	  event.preventDefault();
	  const video = document.querySelector('video');
	  if (video) {
		video[video.paused ? 'play' : 'pause']();
		console.log(video.paused ? MESSAGES.KEY_PLAY : MESSAGES.KEY_PAUSE);
	  }
	}
}//handleKeyEvent()

function init() {
	console.log(MESSAGES.INIT_START);
	domain = getDomain();
	tryUnlock();

	if(domain == "WATCH"){
		autoplayTimeout = setTimeout(tryAutoplay, CONFIG.INITIAL_DELAY);

		window.addEventListener('keydown', handleKeyEvent, {
			capture: true,
			passive: true
		  });
		cleanupCallbacks.push(() => {
			window.removeEventListener('keydown', handleKeyEvent);
		  });

		document.querySelectorAll('video').forEach(processVideo);

		const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.tagName === 'VIDEO') {
                        processVideo(node);
                    }
                    if (node.querySelectorAll) {
                        node.querySelectorAll('video').forEach(processVideo);
                    }
                });
            });
        });
	
		observer.observe(document.body, {
			childList: true,
			subtree: true
		});
		cleanupCallbacks.push(() => observer.disconnect());
	}

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