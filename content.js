import { PAGE_IDENTIFIERS } from "./constants/config.js";
import { CONFIG } from "./constants/config.js";
import { MESSAGES } from "./constants/messages.js";
import { SELECTORS } from "./constants/selectors.js";
import { ERR } from "./constants/messages.js";

let retryCount = 0;
let autoplayDone = false;
let readyCount = 0;

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

function pageWatch() {

}

function pageBrowse() {

}

function pageTitle() {

}

function removeLock() {
	const elements = document.querySelectorAll(SELECTORS.BLOCKING_ELEMENTS);
	let removedAny = false;
	var domain = getDomain();
	var count = 0;
	
	for (let i = 0; i < elements.length; i++) {
		const style = getComputedStyle(elements[i]);
		if ((style.position === 'fixed' || style.position === 'sticky') && 
			!elements[i].contains(fullscreenElement)) {
			elements[i].remove();
			console.log(MESSAGES.ELEMENT_REMOVED);
			removedAny = true;
			if(domain != "WATCH"){
				break;
			}
		}
	}
	if(isLocked()){
		if(!removedAny){
			console.error(MESSAGES.ELEMENT_NOT_FOUND);
		}
		else if (count < CONFIG.MAX_RETRIES){
			console.error(MESSAGES.UNLOCK_FAILED(count++));
			removeLock();
		}
		else{
			console.error(MESSAGES.RETRY_MAX);
			location.reload();
		}
	}
	return removedAny;
}//removeLock()

function tryAutoplay(){
	if (autoplayDone) return;
	else if (retryCount >= MAX_RETRIES){
		console.error(MESSAGES.RETRY_MAX);
		location.reload();
	}

	try {
		if (!window.netflix?.appContext?.state?.playerApp?.getAPI) {
			throw new Error('Netflix API not ready');
		}
		const api = netflix.appContext.state.playerApp.getAPI();
        const sessionIds = api.videoPlayer.getAllPlayerSessionIds();

		if (!sessionIds?.length) {
			throw new Error(ERR.PLAYER_ERROR);
		}
		const player = api.videoPlayer.getVideoPlayerBySessionId(sessionIds[0]);
        const video = document.querySelector('video');

		if (!player || typeof player.isPaused !== 'function' || !video) {
			throw new Error('Player/video not ready');
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
	if(retryCount++ < CONFIG.MAX_RETRIES){
		console.log(MESSAGES.RETRY, retryCount, CONFIG.MAX_RETRIES, CONFIG.RETRY_DELAY);
		setTimeout(tryAutoplay, RETRY_DELAY);
	}
}//scheduleRetry()

function init() {
	console.log(MESSAGES.INIT_START);
	let page = getDomain();
	if (isLocked()){
		if (!removeLock()){
		setTimeout(removeLock, CONFIG.INITIAL_DELAY);
		}
	}
	setTimeout(tryAutoplay, CONFIG.INITIAL_DELAY);

	window.addEventListener('keydown', function(event) {
        if (event.code === CONFIG.CONTROL_KEY) {
            event.preventDefault();
            const video = document.querySelector('video');
            if (video) {
                if (video.paused) {
                    video.play();
                    console.log('Video played via spacebar');
                } else {
                    video.pause();
                    console.log('Video paused via spacebar');
                }
            }
        }
    }, true); // <-- `true` enables "capture" phase

	// Setup observer for video element
	const observer = new MutationObserver((mutations, obs) => {
		const video = document.querySelector('video');
		if (video && video.readyState >= 3) {
			// Video is loaded, try removing elements
			removeBlockingElements();
			if(video.paused){
				video.play();
				console.log(MESSAGES.AUTOPLAY_START);
			}
			// Disconnect after first successful check
			obs.disconnect();
		}
	});
	//TODO: possibly use observer to search for lock
	observer.observe(document.body, {
		childList: true,
		subtree: true
	});

}//init()
	
if(document.getElementsByClassName(SELECTORS.PROFILE_CHOICE).length > 0){
	return;
}
else if (document.readyState === 'complete' && isLocked()) {
	init();
} else {
	window.addEventListener('load', init);
	/*this is never reached lol
	readyCount++;
	console.log(`${MESSAGES.LOAD_FAILED} (attempt ${readyCount}/${CONFIG.MAX_RETRIES}`); */  
}

//TODO: refresh page after max attempts