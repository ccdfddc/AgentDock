# Agent Manifest

AgentDock loads agents from a manifest-like shape. The MVP keeps agents in
React state, but this contract is the intended file/API boundary for local
plugins.

```json
{
  "id": "claude-code",
  "name": "Claude Code",
  "aliases": ["claude", "cc"],
  "description": "Deep code analysis and refactoring",
  "transport": "stdio",
  "command": "claude",
  "args": ["-p"],
  "defaultState": {
    "enabled": true,
    "mentionable": true,
    "callable": false,
    "speaker": true
  },
  "permissions": {
    "readChatContext": "current-conversation",
    "readFiles": "ask",
    "writeFiles": "ask",
    "network": "ask"
  }
}
```

## Fields

- `id`: Stable machine id. Used by routing and storage.
- `name`: Human-readable label.
- `aliases`: Mention shortcuts. `@Claude` can resolve to `claude-code`.
- `description`: Short UI text.
- `transport`: `mock`, `stdio`, `http`, or a future plugin transport.
- `command` / `args`: Used by local stdio adapters.
- `defaultState.enabled`: Whether the agent can run.
- `defaultState.mentionable`: Whether direct `@agent` routing is allowed.
- `defaultState.callable`: Whether the butler can call the agent silently.
- `defaultState.speaker`: Whether the agent may speak directly to the user.

## First Test Agents

```json
[
  {
    "id": "hermes",
    "name": "Hermes",
    "aliases": ["h", "butler", "管家"],
    "transport": "stdio",
    "command": "hermes",
    "args": ["mcp", "serve"]
  },
  {
    "id": "claude-code",
    "name": "Claude Code",
    "aliases": ["claude", "cc"],
    "transport": "stdio",
    "command": "claude",
    "args": ["-p", "--output-format", "json"]
  }
]
```

Hermes summon behavior such as `叫老大` is not replaced by AgentDock. That
existing bridge remains a separate remote wake flow; AgentDock should consume
Hermes as a local agent endpoint or adapter.