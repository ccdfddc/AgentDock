import type { AgentAdapter, Agent } from "../types";

export function createMockClaudeCodeAdapter(agent: Agent): AgentAdapter {
  return {
    agentId: agent.id,
    async send(message: string): Promise<string> {
      await delay(500);
      return [
        "Claude Code is currently connected as a mock agent.",
        `I received your message: "${message.slice(0, 120)}"`,
        "Next step: replace this mock with a guarded claude -p adapter.",
      ].join("\n");
    },
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}