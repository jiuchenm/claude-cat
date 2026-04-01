# claude-cat

Desktop pet companion for Claude Code — a transparent, always-on-top animated cat that lives on your macOS desktop.

Built with Electron. Animations powered by WebM video sprites extracted from [PetClaw](https://petclaw.ai/).

https://github.com/user-attachments/assets/placeholder

## Features

- Transparent frameless window, always-on-top, visible on all workspaces
- Drag the cat anywhere on your desktop
- Click for sparkle effects, triple-click for happy bounce + speech bubble
- Auto-sleeps after 60s idle with floating 💤 indicator
- Frosted-glass speech bubbles with slide-in animation
- System tray icon with state controls (Wake / Sleep / Task / Quit)
- Right-click context menu on the cat
- CLI with `--detach` mode for background operation

## Animation States

```
begin → idle ⇄ sleep-start → sleep-loop → sleep-leave
               ⇄ task-start  → task-loop  → task-leave
               → listening
```

Each state is a WebM video clip. Non-looping clips auto-chain to the next state.

## Install & Run

### Prerequisites

- Node.js >= 18
- Electron (`npm install` in `pet/` will fetch it)

### Quick start

```bash
cd pet
npm install
npm start
```

### CLI (install to PATH)

```bash
cd pet
npm install
npm link     # creates global 'claude-cat' command

claude-cat          # launch pet (attached to terminal)
claude-cat -d       # launch in background (detached)
claude-cat -v       # show version
claude-cat -h       # show help
```

To uninstall the CLI:

```bash
cd pet
npm unlink -g
```

## Project Structure

```
├── pet/                        # Desktop pet Electron app
│   ├── cli.js                  # CLI entry point (shebang, --detach)
│   ├── main.js                 # Electron main process (windows, tray, IPC)
│   ├── pet.html                # Pet renderer: animation state machine, drag, click
│   ├── bubble.html             # Speech bubble renderer (frosted glass)
│   ├── pet-preload.js          # Pet window IPC bridge
│   ├── bubble-preload.js       # Bubble window IPC bridge
│   ├── assets/                 # 9 WebM animations, 2 MP3s, SVG/PNG logos
│   ├── renderer/               # Original PetClaw minified bundles (reference)
│   ├── reference/              # Original module structure stubs (reference)
│   ├── i18n/                   # Locale files (en, zh, ja)
│   └── package.json
├── source/                     # Claude Code source (for future integration)
│   ├── cli.js.map              # Source map (gitignored, 57MB)
│   ├── src/                    # Overlay TypeScript sources
│   ├── vendor/                 # Native addon TypeScript wrappers
│   ├── native-addons/          # Pre-built macOS .node binaries (gitignored)
│   └── runtime-vendor/         # Cross-platform binaries (gitignored)
├── scripts/build-cli.mjs       # Claude Code build orchestrator
├── CLAUDE.md                   # AI coding assistant guidance
└── package.json                # Root package
```

## How the Pet Works

1. `cli.js` locates the Electron binary and spawns `main.js`
2. `main.js` creates two transparent `BrowserWindow`s — pet (160×160) and bubble (220×120)
3. `pet.html` runs a video-based animation state machine with 9 states
4. User interactions (click, drag, right-click) trigger IPC messages between renderer and main
5. Speech bubbles appear above the cat with auto-positioning that follows drag

## Future

- WebSocket/IPC bridge to Claude Code CLI — pet reflects real tool execution states (working, idle, listening)

## License

MIT
