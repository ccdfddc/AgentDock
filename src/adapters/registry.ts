import { registerAdapter } from "./interface";
import { createMockHermesAdapter } from "./mock-hermes";
import { createMockClaudeCodeAdapter } from "./mock-claude-code";
import { createHttpAdapter } from "./http";
import type { AgentAdapter, AdapterConfig, Agent } from "../types";

// Mock adapters for MVP
registerAdapter("mock", (agent: Agent, _config: AdapterConfig): AgentAdapter => {
  switch (agent.id) {
    case "hermes":
      return createMockHermesAdapter(agent);
    case "claude-code":
      return createMockClaudeCodeAdapter(agent);
    default:
      return {
        agentId: agent.id,
        async send(message: string): Promise<string> {
          await new Promise((r) => setTimeout(r, 200));
          return `[${agent.name}] Echo: ${message.slice(0, 80)}`;
        },
      };
  }
});

registerAdapter("http", createHttpAdapter);