# Routing Rules

AgentDock is designed around one social rule:

> The user is never surrounded by agents unless they explicitly ask for it.

## Priority

1. `@specific-agent`
2. `@all` or `@全部`
3. No mention, routed to the current butler

## Specific Mention

When the user sends `@Claude review this`:

- Resolve the mention against `id`, `name`, and `aliases`.
- The target must be enabled, mentionable, and allowed to speak.
- Only the target reads the current conversation context.
- Only the target replies directly.
- The butler does not answer unless it is the mentioned target.

## Broadcast

When the user sends `@全部 compare these approaches`:

- Every enabled, mentionable, speaking agent receives the current conversation
  context.
- Each agent produces its own response in the collaboration area.
- The butler can add a summary after the individual responses.

## Butler Default

When the user sends a normal message:

- Only the selected butler replies directly.
- Enabled callable agents may be invoked silently.
- Silent activity can be shown for transparency, but it should not interrupt the
  main conversation.

## Toggle Semantics

- `enabled`: The agent can run at all.
- `mentionable`: The user can route direct messages to the agent.
- `callable`: The butler can invoke the agent in the background.
- `speaker`: The agent can produce user-visible responses.

An agent with `speaker=false` can still be callable, but should only return
private activity to the butler or orchestration layer.