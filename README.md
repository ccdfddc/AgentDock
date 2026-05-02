# AgentDock

Open-source local multi-agent aggregation platform for desktop and web. Connect multiple AI agents behind one unified interface, route work by mention or broadcast, and keep the whole stack local when you want it.

## What You Get

- a local web app and a packaged macOS desktop app
- built-in Hermes, Claude Code, and Codex agents
- custom OpenAI-compatible model entries that appear automatically in the left sidebar
- one place to aggregate multiple intelligent agents into a single workflow
- mention-based routing, broadcast routing, and silent callable agents
- local-first execution with a small, inspectable codebase

## Why It Matters

AgentDock is meant to be a hub, not just a chat app:

- drop in another OpenAI-compatible model and it becomes a new agent immediately
- keep specialized agents side by side instead of switching between separate apps
- send one prompt to one agent, all agents, or let the selected butler coordinate quietly
- run the UI as a web app or package it as a native macOS desktop app

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

## Release Notes

- Do not commit `dist/` or `release/`; those are build outputs.
- The packaged macOS app is generated in `release/` when you run `npm run desktop:build`.
- OpenAI-compatible models are configured from the left sidebar and stored locally in the browser profile.

## Routing Rules

| Input               | Behaviour                                          |
| ------------------- | -------------------------------------------------- |
| `@agent-id msg`     | Only the mentioned enabled agent replies directly  |
| `@all msg` / `@全部 msg` | Broadcast to all enabled mentionable agents   |
| plain text          | Routes to selected butler; callable agents run silently as activity |

Priority: `@specific` > `@broadcast` > `none (butler)`.

## Agents

| Agent        | Role                           |
| ------------ | ------------------------------ |
| Hermes       | Fast general-purpose assistant |
| Claude Code  | Deep code analysis             |

Each agent has toggles: **Enabled**, **Mentionable**, **Callable**, **Speaker**.

The current MVP uses a pragmatic first-phase setup:

- Hermes: local entry direction, currently backed by the local Hermes gateway
- Claude Code: CLI automation direction, backed by the local Claude Code integration
- Codex: local coding assistant route, backed by the local Codex integration
- OpenAI-compatible models: add them from the left sidebar and they appear as new agents automatically

## Platform Summary

AgentDock gives you:

- a single place to register and switch between agents
- a routing layer that decides whether a message goes to one agent, many agents, or the butler
- a desktop shell for local use without opening a browser
- a simple OpenAI-compatible entry point for third-party models
- storage for custom agents so the setup survives app restarts

## Adapters

The adapter interface (`src/adapters/interface.ts`) supports pluggable transports:

- `mock` - In-process mock (MVP default)
- `stdio` - Planned: subprocess over stdin/stdout for agents that support automation

Register new transports via `registerAdapter(transport, factory)`.

## Tech Stack

- Vite + React 19 + TypeScript
- Vitest for routing tests
- No backend required (mock adapters)
