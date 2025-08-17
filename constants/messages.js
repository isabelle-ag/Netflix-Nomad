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
	ELEMENT_NOT_FOUND: "Lock detected but cannot be remove",
	ELEMENT_REMOVED: "Removed locking element",
	PLAYBACK_STARTED: "Starting playback...",
	PLAYBACK_FAILED: (err) => `Playback failed: ${err}`,
	KEY_PLAY: (key) => { if (key == "SPACE") {"Video played via spacebar"} 
			else {`Video played via ${key} key`}},
	KEY_PAUSE: (key) => { if (key == "SPACE") {"Video paused via spacebar"} 
	else {`Video paused via ${key} key`}},
	UNLOCK_FAILED: (count) => `removeLock() did not remove the correct element. Elements removed: ${count++})\nTrying again`,
	PROFILE_CHOICE_SCREEN: "Skipping init: profile choice screen",
  };

  export const ERR = {
	PLAYER_ERROR: 'No player sessions available',
	API_ERROR: 'Netflix API not ready',
	NOT_READY: 'Player/video not ready',
  }
  