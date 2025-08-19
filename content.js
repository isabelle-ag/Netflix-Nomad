// ----- constants -----
const IDENTIFIERS = {
	WATCH: "netflix.com/watch",   
	LOCK_MSG: "Your device isn\’t part of the Netflix Household for this account",
	CHOOSE_PROFILE: "Choose Profile", 
	TARGET_CLASS: "nf-modal interstitial-full-screen",
};

const CONFIG = {
	MAX_RETRIES: 20,
	INITIAL_DELAY: 3000, 
	RETRY_DELAY: 1000,    
	CONTROL_KEY: 'Space',  
	MAX_ELEMENTS: 10,
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
	
};

const ERR = {
	PLAYER_ERROR: 'No player sessions available',
	NOT_READY: 'Player/video not ready',
	REDUNDANT: "Script already loaded"
};

//safegaurd
if (window.__netflixUnblockExecuted) throw new Error(ERR.REDUNDANT);
window.__netflixUnblockExecuted = true;

//TESTING VARS
let ogCode = "";
let currCode = "";
let missingCode = "";
let captured = false;


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
			console.log(MESSAGES.ELEMENT_REMOVED);
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
				console.log(MESSAGES.AUTOPLAY_RESUME);
				video.play();
			}
		}, 1000);

    } catch (e) {
        console.log(MESSAGES.AUTOPLAY_FAILED, e.message);
        scheduleRetry();
        return;
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
            console.log(MESSAGES.KEY_PLAY);
        } else {
            video.pause();
            console.log(MESSAGES.KEY_PAUSE);
        }
    } catch (e) {
        console.warn("Playback toggle failed:", e);
    }
}

/* =================================================================== 
	pick up: 
	this crashes 
	maybe split by \n before restoring it?
	try finding what's missing before removing the lock
	basically I'm just trying to find what/where is the control
   =================================================================== */
function codeOnLoad(){
	ogCode = document.documentElement.outerHTML;
}

function findMissing(){
	currentSource = document.documentElement.outerHTML;
	const currLines = currentSource.split("\n");
	let removedParts = [];

	for (let line of currLines){
		if(!ogCode.includes(line)){
			removedParts.push(line);
		}
	}

	const removedCode =  removedParts.join("\n");
	return removedCode;
}

function restoreMissing(missingLines){
	for (let line of missingLines){
		if (!line || line.trim() === "") {
			console.log("No line provided to restore.");
		}
		else{
			try {
				// Create a temporary container to parse the HTML
				let tempDiv = document.createElement("div");
				tempDiv.innerHTML = line.trim();

				// Append its child nodes into <body>
				while (tempDiv.firstChild) {
					document.body.appendChild(tempDiv.firstChild);
				}

				console.log("Restored:", line);
			} catch (e) {
				console.error("Failed to restore:", line, e);
			}
		}
	}
}


function handleMissing(){
	if(!captured){
		let missing = findMissing();
		console.log("missing found:");
		console.log(missing);
		captured = true;
		restoreMissing(missing);
	}
}

function init() {
    console.log(MESSAGES.INIT_START);
	codeOnLoad();
	console.log("Retrieved code");
	domain = getDomain();


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
				handleMissing();
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