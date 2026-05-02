import type { AgentAdapter, AdapterConfig, Agent } from "../types";

export type AdapterFactory = (agent: Agent, config: AdapterConfig) => AgentAdapter;

const factories = new Map<string, AdapterFactory>();

export function registerAdapter(transport: string, factory: AdapterFactory): void {
  factories.set(transport, factory);
}

export function createAdapter(agent: Agent, config: AdapterConfig): AgentAdapter {
  const factory = factories.get(config.transport);
  if (!factory) {
    throw new Error(`No adapter registered for transport: ${config.transport}`);
  }
  return factory(agent, config);
}