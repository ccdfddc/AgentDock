import type { Agent, AgentAdapter, AdapterConfig } from "../types";

export function createHttpAdapter(agent: Agent, config: AdapterConfig): AgentAdapter {
  if (!config.endpoint) {
    throw new Error(`Missing endpoint for ${agent.name}`);
  }

  return {
    agentId: agent.id,
    async send(message: string): Promise<string> {
      const response = await fetch(config.endpoint!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, ...config.requestBody }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(String(payload.error ?? `HTTP ${response.status}`));
      }
      if (typeof payload.reply !== "string") {
        throw new Error("Agent response did not include reply");
      }
      return payload.reply;
    },
  };
}