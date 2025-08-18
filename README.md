# Netflix Nomad

[![Firefox Add-on](https://img.shields.io/amo/v/netflix-nomad?label=Firefox)](https://addons.mozilla.org/firefox/addon/netflix-nomad/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

> Bypass Netflix's "Not part of this household" restrictions and restore playback controls

## Features
- **Household Lock Bypass**: Automatically removes Netflix's account sharing lock screens
- **Keyboard Controls**: Spacebar toggles play/pause (replaces removed native controls)
- **Click Control**: Left-click video to toggle playback
- **Fullscreen Support**: Standard `F` key works when video is focused
- **Lightweight**: No background processes or tracking
- **Instant Activation**: Works immediately on page load

## Important Note
This extension currently removes Netflix's native video control bar. To compensate, it provides:
- Spacebar keyboard shortcut for play/pause
- Left-click playback toggle when video is focused
- Auto-playback resumption after unlocking

*Working to restore full control functionality in future updates*

## Installation
1. **Firefox:**
   - Download from [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/netflix-nomad/)
   - Or manually load the extension:
     1. Go to `about:debugging`
     2. Click "This Firefox"
     3. Click "Load Temporary Add-on"
     4. Select manifest.json from the extension folder

> **Chrome/Edge Support Coming Soon**  
> Currently only tested in Firefox - Chrome version requires additional testing

## How It Works
The extension detects and bypasses Netflix's household verification by:
1. Removing blocking overlay elements
2. Auto-resuming playback after unlock
3. Providing alternative playback controls:
   - Spacebar toggles play/pause
   - Left-click toggles playback when video focused
4. Automatically retrying if initial unlock fails

## Technical Approach & Advantages
This extension uses a **non-invasive DOM manipulation technique** that:
- **Only removes blocking overlay elements** (does not modify Netflix's core functionality)
- **Does not intercept or alter network traffic** to/from Netflix servers
- **Maintains native video streaming and playback systems** intact
- **Requires no special permissions** beyond page access

**Key benefits:**
**Stealthier**: Less detectable by Netflix since no API calls are blocked  
**More resilient**: Works independently of Netflix backend changes  
**Lighter weight**: Minimal performance impact on browsing  
**Safer**: Doesn't interfere with account authentication or payment systems  

*Unlike network-level solutions, this DOM-focused approach preserves Netflix's native functionality while specifically targeting only the restriction overlays.*

## Video Controls Reference  

This extension keeps all native keyboard shortcuts and adds intuitive play/pause controls. You’ll have **full functionality even without Netflix’s control bar.**

---

**Playback**
- Play/Pause
  - <kbd>Space</kbd> *
  - *Single left-click on video* *
- Skip Intro
  - <kbd>S</kbd> ~
- Skip 10s Back/Forward
  - <kbd>←</kbd> / <kbd>→</kbd> ~

**Volume**
- Volume Up/Down
  - <kbd>↑</kbd> / <kbd>↓</kbd> ~
- Mute Toggle
  - <kbd>M</kbd> ~  

**Display & Subtitles**
- Fullscreen
  - <kbd>F</kbd> ^
  - *Double left-click on video* ~
- Toggle Subtitles
  - <kbd>C</kbd> ~
- Audio Track Menu
  - <kbd>Shift</kbd> + <kbd>S</kbd> ~

---

**Legend:**  
&#8291;* = Extension · ~ = Netflix · ^ = Browser
  
## Support Development
If this extension helps you bypass Netflix's restrictions, please consider supporting its development:

[☕ Buy Me a Coffee](https://www.buymeacoffee.com/yourprofile)

Your support helps:
- Add Chrome/Edge browser support
- Restore native-style video controls
- Develop mobile browser versions
- Maintain compatibility as Netflix updates

## Known Limitations

- **Navigation Controls Missing**:  
  ⚠️ Since Netflix's native control bar is removed:
  - Next episode button unavailable (use browser back button instead)
  - "Back to Browse" button unavailable (use browser back button)
  - Episode selection unavailable during playback
  
  *Workaround: Use browser navigation controls:*
  - **Back to previous page**: <kbd>Alt</kbd> + <kbd>←</kbd> (Win/Linux) / <kbd>Cmd</kbd> + <kbd>[</kbd> (Mac)
  - **Episode selection**: Navigate back to series page
  - **Next episode**: Not automated - manually navigate back and select next

## Legal Disclaimer
This extension:
- Does not modify Netflix's video streaming
- Does not circumvent account payment systems
- Simply removes viewing restrictions on paid accounts
- Should be used in compliance with Netflix's Terms of Service

*Use at your own discretion. Not affiliated with Netflix Inc.*
