const browserAPI = (typeof browser !== "undefined") ? browser : chrome;

    document.addEventListener("DOMContentLoaded", async () => {
      const controlKeyInput = document.getElementById("controlKey");
      const controlKeyLabel = document.getElementById("controlKeyLabel");
      const enabledCheckbox = document.getElementById("enabledToggle");
      const enabledStatus = document.getElementById("enabledStatus");
      const resetKeyButton = document.getElementById("resetKey");
      const saveMessage = document.getElementById("saveMessage");
      const versionLabel = document.getElementById("versionLabel");

      const defaults = { CONTROL_KEY: "Space", ENABLED: true };
      const stored = await browserAPI.storage.local.get(Object.keys(defaults));
      const config = Object.assign({}, defaults, stored);

	  function formatKeyDisplay(code) {
        return code.startsWith('Key') ? code.substring(3) : code;
      }

      // Helper to update status text
      function updateEnabledText(isEnabled) {
        const enabled = (isEnabled === true || isEnabled === "true");
        enabledStatus.textContent = enabled ? "Enabled" : "Disabled";
        enabledStatus.className = enabled ? "status-label status-enabled" : "status-label status-disabled";
      }

      // Show save confirmation message
      function showSaveMessage() {
        saveMessage.classList.add('show');
        setTimeout(() => {
          saveMessage.classList.remove('show');
        }, 2000);
      }

      // Initialize UI
      controlKeyLabel.textContent = formatKeyDisplay(config.CONTROL_KEY);
  	  enabledCheckbox.checked = config.ENABLED;
 	  updateEnabledText(config.ENABLED);

      // Set version number
      versionLabel.textContent = `v${browserAPI.runtime.getManifest().version}`;

      // Capture key input
      controlKeyInput.addEventListener('click', function() {
        this.classList.add('recording');
        this.placeholder = 'Press any key...';
      });

      controlKeyInput.addEventListener('keydown', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Don't allow modifier keys alone
        if (["Shift", "Control", "Alt", "Meta", "Tab"].includes(e.key)) {
          return;
        }
        
        let keyValue = e.code;
        
        // Handle special cases for better readability
        if (e.key === " ") {
          keyValue = "Space";
        }
    
		const displayValue = formatKeyDisplay(keyValue);
		//controlKeyInput.value = displayValue;
        controlKeyInput.classList.remove('recording');
        controlKeyInput.placeholder = 'Click to change key';
        controlKeyLabel.textContent = displayValue;
        
        await browserAPI.storage.local.set({ CONTROL_KEY: keyValue });
        showSaveMessage();
      });

      controlKeyInput.addEventListener('blur', function() {
        this.classList.remove('recording');
        this.placeholder = 'Click here and press a key';
      });

	  resetKeyButton.addEventListener('click', async () => {
        const displayValue = formatKeyDisplay(defaults.CONTROL_KEY);
        //controlKeyInput.value = displayValue;
        controlKeyLabel.textContent = displayValue;
        
        await browserAPI.storage.local.set({ CONTROL_KEY: defaults.CONTROL_KEY });
        showSaveMessage();
      });

      // Update enabled status
      enabledCheckbox.addEventListener("change", async () => {
        updateEnabledText(enabledCheckbox.checked);
        await browserAPI.storage.local.set({ ENABLED: enabledCheckbox.checked });
        showSaveMessage();
      });

      // Close popup on ESC key
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          if (controlKeyInput.classList.contains('recording')) {
            controlKeyInput.classList.remove('recording');
            controlKeyInput.placeholder = 'Click here and press a key';
          } else {
            window.close();
          }
        }
      });
    });