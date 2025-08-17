export const SELECTORS = {
	VIDEO: "video",
	FULLSCREEN_ELEMENT: () => document.fullscreenElement,
	BLOCKING_ELEMENTS: "body *:not(:fullscreen)",
	PROFILE_CHOICE: "profile-gate-label",
	//PROFILE_CHOICE: () => document.getElementsByClassName("profile-gate-label"),
  };
  