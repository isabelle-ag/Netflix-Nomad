# Netflix Nomad

[![Firefox Add-on](https://img.shields.io/amo/v/netflix-nomad?label=Firefox)](https://addons.mozilla.org/firefox/addon/netflix-nomad/)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ff813f?logo=buy-me-a-coffee&logoColor=white)](https://www.buymeacoffee.com/isabelle.ag)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

> Firefox extension that improves the Netflix experience by reducing repeated travel verification prompts and enhancing playback controls.

---

## Table of Contents
- [Overview](#overview)
- [Why This Exists](#why-this-exists)
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
- Reduces repeated travel-related verification prompts so playback remains accessible
- Automatically resumes playback after interruptions
- Adds reliable keyboard and mouse playback controls

---

## Why This Exists
Frequent travel can trigger repeated verification prompts that interrupt playback and degrade the user experience. Netflix Nomad was built to explore how client-side extensions can improve usability in these edge cases without modifying core streaming behavior.

This project focuses on:
- Identifying UX friction points in real-world applications
- Applying lightweight, maintainable DOM-based solutions
- Preserving system integrity while improving accessibility

---

## Features
- **Seamless Travel Viewing**: Reduces interruptions caused by repeated verification prompts when accessing Netflix away from your primary household
- **Keyboard Controls**: Spacebar toggles play/pause (restores missing native behavior)
- **Fullscreen Support**: <kbd>F</kbd> key works when video is focused
- **Lightweight**: No background processes, minimal performance impact
- **Instant Activation**: Runs immediately on page load, no setup required

---

## Installation

### Firefox Add-ons (Recommended)
1. Install directly with [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/netflix-nomad/)
2. The extension will automatically update when new versions are released

### Manual Installation
1. Download the `netflix-nomad-v*.zip` from the latest [release](https://github.com/isabelle-ag/Netflix-Nomad/releases/latest)
2. Navigate to `about:debugging#/runtime/this-firefox` on Firefox
3. Click **`Load Temporary Add-on`**  
4. Select the downloaded ZIP file
   - *Alternatively: Extract the ZIP and select any file from the folder (like `manifest.json`)*

> Note: Temporary add-ons remain installed until you restart Firefox and must be clicked to initialize. For permanent installation, consider using the Firefox Add-ons store version.

> Currently tested only in Firefox. Chrome build requires further testing.

---

## How It Works
Netflix Nomad uses lightweight client-side DOM manipulation to improve playback accessibility during interrupted sessions:

- Removes blocking UI overlays that prevent interaction with the video player
- Preserves Netflix’s core playback engine and streaming pipeline
- Adds minimal event listeners for playback controls
- Automatically retries when overlays load asynchronously
- Requires only standard page permissions (no network interception)

**Design Principles**
- **Non-invasive:** Does not modify streaming, DRM, or network requests
- **Lightweight:** No background scripts; minimal runtime overhead
- **Focused:** Targets only UI elements that block playback
- **Resilient:** Designed to tolerate UI changes without breaking core functionality

*Unlike network-level solutions, this DOM-focused approach preserves Netflix's native functionality while specifically targeting only the restriction overlays*

---

## Keyboard Controls
Netflix Nomad restores intuitive controls so playback remains fully usable even without the native control bar.  
| Action | Shortcut |
|--------|--------|
| Play/Pause | <kbd>Space</kbd> <sup>✢</sup> <br> |
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

[☕ Buy Me a Coffee](https://www.buymeacoffee.com/isabelle.ag)  

Your support helps fund:  
- Chrome/Edge and Safari browser support  
- Restored native-style video controls
- An extension UI  
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
- Does not modify Netflix’s video streaming or DRM systems
- Does not interact with authentication or billing systems
- Focuses on improving playback accessibility and user experience

Use at your own discretion. Not affiliated with Netflix Inc.
