export const CONFIG = {
	MAX_RETRIES: 20,
	INITIAL_DELAY: 3000,  // ms before first autoplay attempt
	RETRY_DELAY: 1000,    // ms between retries
	CONTROL_KEY: 'Space',  // key to be used to play and pause
	MAX_ELEMENTS: 10,
	//TODO: Key to set seek(0) 
  };
  
export const PAGE_IDENTIFIERS = {
	HOME: "Netflix",
	WATCH: "netflix.com/watch",   
	BROWSE: "netflix.com/browse",  
	TITLE: "netflix.com/title",		
	LOCK_MSG: "Your device isn\’t part of the Netflix Household for this account",
	CHOOSE_PROFILE: "Choose Profile", //TODO: confirm msg
  };
  