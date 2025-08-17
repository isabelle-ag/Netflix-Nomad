import { PAGE_IDENTIFIERS } from "./constants/config.js";
import { CONFIG } from "./constants/config.js";
import { MESSAGES } from "./constants/messages.js";
import { SELECTORS } from "./constants/selectors.js";
import { ERR } from "./constants/messages.js";

let retryLock = 0;
let retryPlay = 0;
let elemCount = 0;
let autoplayDone = false;
const cleanupCallbacks = [];
//let readyCount = 0;

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

// function pageWatch() {
// }

// function pageBrowse() {
// }

// function pageTitle() {
// }

function removeLock() {
	const elements = document.querySelectorAll(SELECTORS.BLOCKING_ELEMENTS);
	const fullscreenElement = document.fullscreenElement;
	let removedAny = false;
	const domain = getDomain();
	
	for (let i = 0; i < elements.length; i++) {
		const style = getComputedStyle(elements[i]);
		if ((style.position === 'fixed' || style.position === 'sticky') && 
			!elements[i].contains(fullscreenElement)) {
			elements[i].remove();
			console.log(MESSAGES.ELEMENT_REMOVED);
			elemCount++;
			removedAny = true;
			if(!isLocked()){
				break;
			}
		}
	}
	return removedAny;
}//removeLock()


function tryUnlock() {
	if(isLocked()) {const removed = removeLock();}

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
			setTimeout(tryUnlock, CONFIG.RETRY_DELAY);
		} 
		else {
			console.error(MESSAGES.RETRY_MAX);
			location.reload(); // refresh only after max retries
		}
	}
}//tryUnlock()



function tryAutoplay(){
	if (autoplayDone || isLocked() ) return;
	else if (retryPlay >= CONFIG.MAX_RETRIES){
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
			}).catch(e => {
				console.log(MESSAGES.PLAYBACK_FAILED, e.message);
				scheduleRetry();
			});
		}
		else {
			console.log(MESSAGES.AUTOPLAY_ALREADY_PLAYING);
			autoplayDone = true;
		}
	} catch(e) {
		console.log(MESSAGES.AUTOPLAY_FAILED, e.message);
		scheduleRetry();
	}
}//tryAutoplay()

function scheduleRetry() {
	if(retryPlay++ < CONFIG.MAX_RETRIES){
		console.log(MESSAGES.RETRY(retryPlay, CONFIG.MAX_RETRIES, CONFIG.RETRY_DELAY));
		setTimeout(tryAutoplay, CONFIG.RETRY_DELAY);
	}
}//scheduleRetry()

// Process video elements with readyState check
function processVideo(video) {
	if (autoplayDone) return;
	
	if (video.readyState >= 3) {  
		tryUnlock();
		tryAutoplay();
	} else {
		video.addEventListener('canplay', () => {
			tryUnlock();
			tryAutoplay();
		}, { once: true });
	}
}

function init() {
	console.log(MESSAGES.INIT_START);
	let page = getDomain();
	tryUnlock();

	if(page == "WATCH"){
		setTimeout(tryAutoplay, CONFIG.INITIAL_DELAY);

		window.addEventListener('keydown', function(event) {
			if (event.code === CONFIG.CONTROL_KEY) {
				event.preventDefault();
				const video = document.querySelector('video');
				if (video) {
					if (video.paused) {
						video.play();
						console.log(MESSAGES.KEY_PLAY(CONFIG.CONTROL_KEY));
					} else {
						video.pause();
						console.log(MESSAGES.KEY_PAUSE(CONFIG.CONTROL_KEY));
					}
				}
			}
		}, true); // <-- `true` enables "capture" phase

		document.querySelectorAll('video').forEach(processVideo);

		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				for (const node of mutation.addedNodes) {
					// Only process video elements
					if (node.nodeName === 'VIDEO') {
						processVideo(node);
					}
					// Check for video elements within added nodes
					else if (node.querySelectorAll) {
						node.querySelectorAll('video').forEach(processVideo);
					}
				}
			}
		});

	// const observer = new MutationObserver((mutations, obs) => {
	// 	for (const mutation of mutations) {
	// 		mutation.addedNodes.forEach(node => {
	// 			if (node.tagName === 'VIDEO') {
	// 				const video = node;
	// 				if (video.readyState >= 3) {
	// 					tryUnlock();
	// 					tryAutoplay();
	// 					obs.disconnect(); // stop observing once ready
	// 				} else {
	// 					// wait until the video can play
	// 					video.addEventListener('canplay', () => {
	// 						tryUnlock();
	// 						tryAutoplay();
	// 						obs.disconnect();
	// 					}, { once: true });
	// 				}
	// 			}
	// 		});
	// 	}
	// });

	
		observer.observe(document.body, {
			childList: true,
			subtree: true
		});
	}
	cleanupCallbacks.push(() => {
		observer.disconnect();
		window.removeEventListener('keydown', handleKeyEvent);
	  });

}//init()
	
window.addEventListener('beforeunload', () => {
	cleanupCallbacks.forEach(fn => fn());
  });

if(document.getElementsByClassName(SELECTORS.PROFILE_CHOICE).length > 0){ 
	console.log(MESSAGES.PROFILE_CHOICE_SCREEN); //skip init
}
else if (document.readyState === 'complete') {
	init();
} 
else {
	window.addEventListener('load', init);
	/*this is never reached lol
	readyCount++;
	console.log(`${MESSAGES.LOAD_FAILED} (attempt ${readyCount}/${CONFIG.MAX_RETRIES}`); */  
}

//TODO: refresh page after max attempts