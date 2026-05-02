# AgentDock

Open-source local multi-agent desktop/web MVP. Route prompts to multiple AI agents through a unified chat interface.

## What You Get

- a local web app
- a packaged macOS desktop app via Electron
- built-in Hermes, Claude Code, and Codex agents
- custom OpenAI-compatible model entries that appear automatically in the left sidebar

## Quick Start

```bash
npm install
npm run dev      # Vite dev server
npm run test     # Vitest tests
npm run build    # Production build
npm run desktop  # Electron shell
npm run desktop:build  # Build the desktop bundle
```

Copy `.env.example` to `.env` if you want to override local paths or ports.

## Architecture

```
src/
  adapters/        Agent adapter interface + mock implementations
  routing/         Mention parser + routing decision engine
  components/      React UI (ChatView, AgentPanel, AgentToggle)
  state/           React state management (useAgentStore)
  __tests__/       Vitest tests for routing logic
```

More detail:

- [Agent Manifest](docs/agent-manifest.md)
- [Routing Rules](docs/routing-rules.md)

## Routing Rules

| Input | Behaviour |
| --- | --- |
| `@agent-id msg` | Only the mentioned enabled agent replies directly |
| `@all msg` / `@全部 msg` | Broadcast to all enabled mentionable agents |
| plain text | Routes to selected butler; callable agents run silently as activity |

Priority: `@specific` > `@broadcast` > `none (butler)`.

## Agents

| Agent | Role |
| --- | --- |
| Hermes | Fast general-purpose assistant |
| Claude Code | Deep code analysis |

Each agent has toggles: **Enabled**, **Mentionable**, **Callable**, **Speaker**.

The current MVP uses a pragmatic first-phase setup:

- Hermes: local entry direction, currently mocked in the UI
- Claude Code: CLI automation direction, currently mocked in the UI
- OpenAI-compatible models: add them from the left sidebar and they appear as new agents automatically

## Adapters

The adapter interface (`src/adapters/interface.ts`) supports pluggable transports:

- `mock` - In-process mock (MVP default)
- `stdio` - Planned: subprocess over stdin/stdout for agents that support automation

Register new transports via `registerAdapter(transport, factory)`.

## Tech Stack

- Vite + React 19 + TypeScript
- Vitest for routing tests
- No backend required (mock adapters)
