# Netflix Nomad

[![Firefox Add-on](https://img.shields.io/amo/v/netflix-nomad?label=Firefox)](https://addons.mozilla.org/firefox/addon/netflix-nomad/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

> Awaiting approval for app to be published, in the meantime you can install it [manually](#manual-installation).

> Bypass Netflix's “Not part of this household” restrictions and keep playback controls functional.

---

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [How It Works](#how-it-works)
- [Video Controls Reference](#keyboard-controls)
- [Support Development](#support-development)
- [Known Limitations](#known-limitations)
- [Legal Disclaimer](#legal-disclaimer)

---

## Overview

> ⚠️ **Heads-up:** Netflix Nomad currently **hides Netflix’s native control bar**. To keep playback usable, the extension adds lightweight keyboard and mouse controls (see below). Restoring the native bar is on the roadmap.

**What it does**
- Dismisses/neutralizes “household lock” overlays so the player is reachable.
- Resumes playback automatically after unlock.
- Adds reliable play/pause via **Space**, click-to-toggle, and other essentials

---

## Features
- **Household Lock Bypass**: Automatically removes Netflix’s account-sharing lock screens
- **Keyboard Controls**: Spacebar toggles play/pause (restores missing native behavior)
- **Click Control**: Left-click video to toggle playback
- **Fullscreen Support**: <kbd>F</kbd> key works when video is focused
- **Lightweight**: No persistent background processes or tracking, minimal footprint
- **Instant Activation**: Runs immediately on page load, no setup required

---

## Installation

### Firefox Add-ons (Recommended)
1. Install directly with [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/netflix-nomad/)
2. The extension will automatically update when new versions are released

### Manual Installation
1. Download file netflix-nomad1.0.zip
2. Navigate to `about:debugging#/runtime/this-firefox` on Firefox
3. Click **`Load Temporary Add-on`** and either:  
	- Select the zip file, Or,
	- Select any file from the extracted extension folder (typically `manifest.json`)
> Note: Temporary add-ons remain installed until you restart Firefox. For permanent installation, consider using the Firefox Add-ons store version.

> Currently tested only in Firefox. Chrome build requires further testing.

---

## How It Works
Netflix Nomad bypasses household verification through **non-invasive DOM manipulation**, exclusively targeting restriction overlays while preserving core functionality:
- Removes blocking overlays without affecting Netflix's playback engine or video pipeline
- Adds minimal play/pause/fullscreen listeners for seamless UX
- Automatically retries when overlays load late
- Zero network traffic interception or modification
- Requires only standard page access permissions

**Key Advantages**
- **Low Detectability:** Avoids network/DRM hooks used by Netflix's detection systems
- **Lightweight:** No background scripts; minimal performance impact
- **Safe:** Never interacts with authentication or billing systems
- **Resilient:** Functions independently of Netflix backend changes

*Unlike network-level solutions, this DOM-focused approach preserves Netflix's native functionality while specifically targeting only the restriction overlays.*

---

## Keyboard Controls
Netflix Nomad restores intuitive controls so playback remains fully usable even without the native control bar.  
| Action | Shortcut |
|--------|--------|
| Play/Pause | <kbd>Space</kbd> <sup>✢</sup> <br> <sub>Single left-click on video <sup>✢</sup></sub> |
| Skip Intro | <kbd>S</kbd> <sup>✦</sup> |
| Skip Back/Forward 10s | <kbd>←</kbd> / <kbd>→</kbd> <sup>✦</sup> |
| Volume Up/Down | <kbd>↑</kbd> / <kbd>↓</kbd> <sup>✲</sup> |
| Mute Toggle | <kbd>M</kbd> <sup>✲</sup> |
| Fullscreen | <kbd>F</kbd> <sup>✲</sup> <br> <sub>Double left-click on video<sup>✦</sup></sub> |
| Toggle Subtitles | <kbd>C</kbd> <sup>✦</sup> |
| Audio Track Menu | <kbd>Shift</kbd> + <kbd>S</kbd> <sup>✦</sup> |

> <sup>*Shortcut source:*<br>
> `✢` = Extension<br>
> `✦` = Netflix native<br>
> `✲` = Browser standard</sup>

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
