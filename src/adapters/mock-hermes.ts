import type { AgentAdapter, Agent } from "../types";

export function createMockHermesAdapter(agent: Agent): AgentAdapter {
  return {
    agentId: agent.id,
    async send(message: string): Promise<string> {
      await delay(300);
      return [
        "Hermes is currently connected as a mock agent.",
        `I received your message: "${message.slice(0, 120)}"`,
        "Next step: wire Hermes to the local Hermes gateway so this becomes a real reply.",
      ].join("\n");
    },
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}