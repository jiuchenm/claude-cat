# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Code is Anthropic's official CLI for Claude — a feature-rich terminal application built with TypeScript, React (Ink for terminal UI), and bundled with Bun. The CLI is rebuilt from source maps with overlay TypeScript sources.

## Build

### Prerequisites
- Node.js >= 20
- Bun >= 1.1 (`npm install -g bun`)

### Commands
```bash
# Production build (minified)
node scripts/build-cli.mjs

# Development build (unminified, faster)
node scripts/build-cli.mjs --no-minify

# Custom output path
node scripts/build-cli.mjs --outfile /path/to/output/cli.js

# Clean rebuild (forces workspace re-extraction)
rm -f .cache/workspace/.prepared.json
node scripts/build-cli.mjs --no-minify
```

### Run
```bash
node dist/cli.js
```

### How the build works
1. `scripts/build-cli.mjs` extracts ~4756 modules from `source/cli.js.map` into `.cache/workspace/`
2. Overlay TypeScript sources from `source/src/` are copied on top (these are the editable source files)
3. ~80 npm packages are installed in the workspace
4. Module resolution shims, feature flag patches, and stubs are generated
5. Bun bundles everything into `dist/cli.bundle/` with a `dist/cli.js` wrapper
6. Build retries up to 6 times, auto-resolving missing exports/packages

First build runs `npm install` for overlay packages; subsequent builds use cached workspace.

## Repository Layout

```
├── scripts/build-cli.mjs      # Build orchestrator (1600+ lines)
├── package.json                # Root package ("bun ./scripts/build-cli.mjs")
├── source/
│   ├── cli.js.map              # Source map with 4756 modules (57MB)
│   ├── package.json            # CLI package metadata (version, bin)
│   ├── src/                    # Overlay TypeScript sources (editable)
│   ├── vendor/                 # Native addon TypeScript wrappers
│   ├── native-addons/          # Pre-built macOS .node binaries
│   └── runtime-vendor/         # Cross-platform binaries (ripgrep, audio-capture)
├── .cache/                     # (generated) Extracted workspace + node_modules
└── dist/                       # (generated) Build output
```

**`source/src/`** is the primary directory for code changes. Files here overlay those extracted from the source map.

## Architecture

All source paths below are relative to `source/src/`.

### Entry Points
- **`entrypoints/cli.tsx`** — Bootstrap entrypoint. Handles fast paths (`--version`, `--dump-system-prompt`) with zero/minimal imports, then dynamically loads `main.tsx` for full CLI startup.
- **`main.tsx`** (~800KB) — Primary application entry. Orchestrates initialization (MDM, keychain prefetch, GrowthBook, OAuth, policy limits), parses CLI args via Commander.js, and launches the REPL.

### Core Loop
- **`QueryEngine.ts`** — Orchestrates AI queries with tool execution, manages conversation turns, handles auto-compaction, and coordinates agent/subagent workflows.
- **`query.ts`** — Main query loop: message normalization, API calls to Anthropic, streaming, compaction strategies (auto, reactive, context collapse).

### Tool System
Tools live in `tools/<ToolName>/`. Each tool exports a `Tool` object conforming to the interface in `Tool.ts`. Tools are registered in `tools.ts` — some conditionally via `feature()` flags or `process.env.USER_TYPE` checks.

Core tools: `BashTool`, `FileReadTool`, `FileEditTool`, `FileWriteTool`, `GlobTool`, `GrepTool`, `AgentTool`, `WebFetchTool`, `WebSearchTool`, `MCPTool`, `SkillTool`, `NotebookEditTool`, `AskUserQuestionTool`, `TaskCreateTool`/`TaskUpdateTool`/etc.

### Command System
Slash commands live in `commands/` (87+ directories). They are registered in `commands.ts`. Each command exports a `Command` object. Some commands are conditionally loaded via `feature()` flags.

### State Management
- **`state/AppState.tsx`** — React context-based state using a custom store (`state/store.js`). Provides `AppStateProvider` and `AppStoreContext`.
- **`state/AppStateStore.ts`** — Immutable state store with subscription model.

### Key Subsystems
- **`services/`** — Business logic: API client (`api/`), MCP server management (`mcp/`), analytics/GrowthBook (`analytics/`), compaction strategies (`compact/`), LSP integration (`lsp/`), OAuth (`oauth/`), plugins (`plugins/`), policy limits (`policyLimits/`), remote managed settings (`remoteManagedSettings/`).
- **`bridge/`** — VS Code extension integration (33 files). Handles IDE↔CLI communication, session management, messaging.
- **`hooks/`** — React hooks (85 files) for permissions, tool state, authentication, feature flags, etc.
- **`components/`** — Ink (terminal UI) React components (146 directories).
- **`utils/`** — 331 utility modules covering auth, config, git, shell, permissions, system prompts, model management, and more.
- **`memdir/`** — Memory directory management (CLAUDE.md context injection for AI conversations).
- **`skills/`** — Skill system with bundled and user-extensible skills.
- **`context/`** — System/user context assembly including git status, CLAUDE.md loading.

### Feature Flags & Dead Code Elimination
The codebase uses `feature()` from `bun:bundle` for compile-time feature gating. Features like `KAIROS`, `COORDINATOR_MODE`, `VOICE_MODE`, `BRIDGE_MODE`, `PROACTIVE`, `AGENT_TRIGGERS` control conditional imports that Bun eliminates in external builds.

The build script defines enabled features in `enabledBundleFeatures` (~line 177 of `scripts/build-cli.mjs`). Default enabled: `BUILDING_CLAUDE_APPS`, `BASH_CLASSIFIER`, `TRANSCRIPT_CLASSIFIER`, `CHICAGO_MCP`. ~90 total flags available.

`process.env.USER_TYPE === 'ant'` gates internal-only tools and commands.

### Import Conventions
- Uses `.js` extensions in imports (ESM convention even though source is `.ts`/`.tsx`)
- Circular dependencies are broken via lazy `require()` calls with type-only casts
- `bun:bundle` feature flags must be imported at module level for DCE to work
- Custom ESLint rules enforce side-effect hygiene: `custom-rules/no-top-level-side-effects`, `custom-rules/no-process-env-top-level`

## Key Patterns

- **Startup performance**: The CLI uses profiling checkpoints (`profileCheckpoint()`), parallel prefetch (MDM, keychain, GrowthBook), and lazy dynamic imports to minimize cold start time.
- **Memoized context**: Functions like `getGitStatus`, `getUserContext`, `getSystemContext` use lodash `memoize` with cache clearing on state changes.
- **React Compiler**: Some components use the React compiler runtime (`react/compiler-runtime`).
- **Message types**: Defined in `types/message.ts` — `UserMessage`, `AssistantMessage`, `SystemMessage`, `ProgressMessage`, etc.
- **Permission types**: Defined in `types/permissions.ts` — `PermissionMode`, `PermissionResult`.
