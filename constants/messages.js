export const MESSAGES = {
	INIT_START: "Initializing - waiting for video load",
	AUTOPLAY_START: "Netflix AutoPlay started",
	AUTOPLAY_SUCCESS: "Autoplay successful",
	AUTOPLAY_ALREADY_PLAYING: "Video is already playing",
	AUTOPLAY_FAILED: (reason) => `Autoplay attempt failed: ${reason}`,
	LOAD_FAILED: "Load attempt failed",
	RETRY: (count, max, delay) => 
	  `Retrying in ${delay}ms (attempt ${count}/${max})`,
	RETRY_MAX: "Max retries reached, refreshing page",
	ELEMENT_NOT_FOUND: "Lock detected but cannot remove",
	ELEMENT_REMOVED: "Removed locking element",
	PLAYBACK_STARTED: "Starting playback...",
	PLAYBACK_FAILED: (err) => `Playback failed: ${err}`,
	SPACEBAR_PLAY: "Video played via spacebar",
	SPACEBAR_PAUSE: "Video paused via spacebar",
	UNLOCK_FAILED: (count) => `removeLock() did not remove the correct element. Elements removed: ${count++})\nTrying again`,
  };
  