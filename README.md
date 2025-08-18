# Netflix Nomad

[![Firefox Add-on](https://img.shields.io/amo/v/netflix-nomad?label=Firefox)](https://addons.mozilla.org/firefox/addon/netflix-nomad/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

> Bypass Netflix's “Not part of this household” restrictions and keep playback controls functional.

---

## Table of Contents
- [Features](#features)
- [Disclaimer](#disclaimer)
- [Installation](#installation)
- [How It Works](#how-it-works)
- [Video Controls Reference](#video-controls-reference)
- [Support Development](#support-development)
- [Known Limitations](#known-limitations)
- [Legal Disclaimer](#legal-disclaimer)

---

## Features
- **Household Lock Bypass**: Automatically removes Netflix’s account-sharing lock screens
- **Keyboard Controls**: Spacebar toggles play/pause (restores missing native behavior)
- **Click Control**: Left-click video to toggle playback
- **Fullscreen Support**: <kbd>F</kbd> key works when video is focused
- **Lightweight**: No background processes or tracking
- **Instant Activation**: Works immediately on page load

---

## Disclaimer
This extension currently removes Netflix's native video control bar. To compensate, it provides:
- Spacebar keyboard shortcut for play/pause
- Left-click playback toggle when video is focused
- Auto-playback resumption after unlocking

*Working to restore full control functionality in future updates*

---

## Installation
1. **Firefox**  
   - Install from [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/netflix-nomad/)  
   - Or load manually:
     1. Go to `about:debugging`  
     2. Select **This Firefox**  
     3. Click **Load Temporary Add-on**  
     4. Choose `manifest.json` from the extension folder  

> Currently tested only in Firefox. Chrome build requires further testing.  

## How It Works
Netflix Nomad bypasses household verification by:  
1. Removing blocking overlay elements
2. Auto-resuming playback after unlock
3. Providing alternative playback controls (see [Video Controls](#video-controls-reference))
4. Retrying automatically if initial unlock fails

### Technical Details & Advantages
This extension uses **non-invasive DOM manipulation**:  
- Removes only the blocking overlay elements (leaves Netflix’s core functionality intact)
- Does not intercept or alter network traffic
- Keeps Netflix’s native video streaming pipeline untouched
- Requires no special permissions beyond page access

**Key benefits:**
- **Stealthy**: Less detectable by Netflix since no API calls are blocked
- **Resilient**: Works independently of Netflix backend changes
- **Lightweight**: Minimal performance impact
- **Safe**: Doesn’t interfere with authentication or billing systems

*Unlike network-level solutions, this DOM-focused approach preserves Netflix's native functionality while specifically targeting only the restriction overlays.*

## Video Controls Reference
Netflix Nomad restores intuitive controls so playback remains fully usable even without the native control bar.  
| Action | Shortcut |
|--------|--------|
| Play/Pause | <kbd>Space</kbd> <sup>✪</sup> <br> <sub>Single left-click on video <sup>✪</sup></sub> |
| Skip Intro | <kbd>S</kbd> <sup>~</sup> |
| Skip Back/Forward 10s | <kbd>←</kbd> / <kbd>→</kbd> <sup>~</sup> |
| Volume Up/Down | <kbd>↑</kbd> / <kbd>↓</kbd> <sup>^</sup> |
| Mute Toggle | <kbd>M</kbd> <sup>^</sup> |
| Fullscreen | <kbd>F</kbd> <sup>^</sup> <br> <sub>Double left-click on video<sup>^</sup></sub> |
| Toggle Subtitles | <kbd>C</kbd> <sup>~</sup> |
| Audio Track Menu | <kbd>Shift</kbd> + <kbd>S</kbd> <sup>~</sup> |

> <sup>*Legend* <br>
> `✪` = Extension<br>
> `~` = Netflix native<br>
> `^` = Browser standard</sup>

---

## Support Development
If you find this extension useful, please consider supporting its development:  

[☕ Buy Me a Coffee](https://www.buymeacoffee.com/yourprofile)  

Your support helps fund:  
- Chrome/Edge and Safari browser support  
- Restored native-style video controls  
- Develop mobile browser compatibility  
- Maintain compatibility as Netflix updates

---

## Known Limitations
Since Netflix’s native control bar is removed:  
- Next episode button unavailable
- “Back to Browse” button unavailable
- Episode selection during playback unavailable

**Workarounds:** *Use browser navigation controls* 
- **Back to previous page**: <kbd>Alt</kbd> + <kbd>←</kbd> (Win/Linux) / <kbd>Cmd</kbd> + <kbd>[</kbd> (Mac)  
- **Episode selection**: Navigate back to the series page
- **Next episode**: Manually navigate and select

---

## Legal Disclaimer
This extension:  
- Does not modify Netflix’s video streaming 
- Does not circumvent account payment systems
- Only removes viewing restrictions on paid accounts

*Use at your own discretion. Not affiliated with Netflix Inc.*  
