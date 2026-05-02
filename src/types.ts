export interface Agent {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  source?: "builtin" | "custom";
  transport: TransportType;
  endpoint?: string;
  requestBody?: Record<string, unknown>;
  enabled: boolean;
  mentionable: boolean;
  callable: boolean;
  speaker: boolean;
}

export interface AgentMessage {
  id: string;
  agentId: string;
  content: string;
  timestamp: number;
  type: "response" | "activity" | "summary";
}

export interface ChatMessage {
  id: string;
  role: "user" | "agents";
  content: string;
  agentMessages?: AgentMessage[];
  timestamp: number;
}

export interface RuntimeStatus {
  loadedAt: number;
  sendCount: number;
  lastInput: string;
  lastRoute: string;
  lastError: string;
}

export type MentionTarget =
  | { kind: "specific"; agentId: string }
  | { kind: "broadcast" }
  | { kind: "none" };

export interface RoutingDecision {
  mention: MentionTarget;
  targetAgents: string[];
  callableAgents: string[];
  finalSpeaker: "butler" | "mentioned" | "multiple" | "none";
  includeContext: boolean;
}

export type TransportType = "mock" | "stdio" | "http";

export interface AdapterConfig {
  transport: TransportType;
  endpoint?: string;
  command?: string;
  requestBody?: Record<string, unknown>;
}

export interface AgentAdapter {
  agentId: string;
  send(message: string): Promise<string>;
  cancel?(): void;
}