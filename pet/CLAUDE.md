# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this directory.

## Overview

`claude-cat` is a desktop pet companion for Claude Code — a transparent, always-on-top Electron app that displays an animated cat on the macOS desktop. It uses WebM video sprites for animation and supports drag, click interactions, and speech bubbles.

## Commands

```bash
# Run directly via Electron
npm start

# Run via CLI (requires npm link first)
claude-cat

# Run detached (background)
claude-cat -d

# Install CLI globally (creates symlink in PATH)
npm link

# Uninstall CLI
npm unlink -g
```

## Architecture

### Electron Process Model

```
cli.js (Node)  ──spawn──▶  Electron main.js
                              ├── petWin    (160x160, transparent BrowserWindow)
                              │     └── pet.html + pet-preload.js
                              ├── bubbleWin (220x120, mouse-passthrough)
                              │     └── bubble.html + bubble-preload.js
                              └── Tray      (system tray icon + context menu)
```

### IPC Bridge

Renderer processes communicate with main via `contextBridge.exposeInMainWorld()`:
- `petAPI` (pet-preload.js): drag, showBubble, rightClick, onSetState
- `bubbleAPI` (bubble-preload.js): onShowBubble

### Animation State Machine (pet.html)

States: `begin` → `idle` ⇄ `sleep-start` → `sleep-loop` → `sleep-leave`, `task-start` → `task-loop` → `task-leave`, `listening`

- Each state maps to a WebM video in `assets/`
- Non-looping animations chain to `next` state via `video.onended`
- Auto-sleep after 60s idle (`IDLE_SLEEP_MS`)
- `setState(target)` handles proper transitions (e.g., wake before task if sleeping)

### Key Files

| File | Role |
|------|------|
| `cli.js` | CLI entry point (shebang, electron binary resolution, --detach) |
| `main.js` | Electron main process (windows, tray, IPC handlers, bubble positioning) |
| `pet.html` | Pet renderer: animation state machine, drag, click sparkles, triple-click bounce |
| `bubble.html` | Speech bubble renderer: frosted glass style, slide-in animation |
| `pet-preload.js` | Pet window IPC bridge |
| `bubble-preload.js` | Bubble window IPC bridge |

### Reference Files (read-only)

- `renderer/` — Original PetClaw minified bundles (for reference only)
- `reference/` — Bytenode loader stubs showing original module structure
- `pet-agents.md` — Original AI agent behavior rules
- `preload.js` — Original PetClaw IPC bridge (275 lines, all channels documented)
- `fn-monitor.swift` — macOS Fn key CGEventTap monitor source
- `i18n/` — Locale files (en, zh, ja)

### Assets

`assets/` contains 9 WebM animation sprites, 2 MP3 sound effects, SVG/PNG logos. Total ~13MB.

## Future: Claude Code Integration

Communication bridge between Claude Code CLI and the pet app is deferred. The eventual plan is a WebSocket/IPC connection so the pet reflects real tool execution states (idle when waiting, task-loop during tool runs, listening during user input).
