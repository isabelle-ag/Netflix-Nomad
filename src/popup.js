const browserAPI = (typeof browser !== "undefined") ? browser : chrome;

document.addEventListener("DOMContentLoaded", async () => {
  const controlKeyInput = document.getElementById("controlKey");
  const enabledCheckbox = document.getElementById("enabledToggle");
  const enabledStatus   = document.getElementById("enabledStatus");

  const defaults = { CONTROL_KEY: "Space", ENABLED: true };
  const stored   = await browserAPI.storage.local.get(Object.keys(defaults));
  const config   = Object.assign({}, defaults, stored);

  // Helper to update status text
  function updateEnabledText(isEnabled) {
    enabledStatus.textContent = (isEnabled === true || isEnabled === "true") 
      ? "Enabled" 
      : "Disabled";
  }

  // Initialize UI
  controlKeyInput.value = config.CONTROL_KEY;
  enabledCheckbox.checked = config.ENABLED;
  updateEnabledText(config.ENABLED);

  // Capture key input and save immediately
  controlKeyInput.addEventListener("keydown", async (e) => {
    e.preventDefault();
    controlKeyInput.value = e.code;
    await browserAPI.storage.local.set({ CONTROL_KEY: e.code });
  });

  // Update enabled status and save immediately
  enabledCheckbox.addEventListener("change", async () => {
    updateEnabledText(enabledCheckbox.checked);
    await browserAPI.storage.local.set({ ENABLED: enabledCheckbox.checked });
  });

  // Close popup on ESC key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") window.close();
  });
});
