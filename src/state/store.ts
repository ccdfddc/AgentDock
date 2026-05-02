import { useCallback, useEffect, useState } from "react";
import type { Agent, AgentMessage, ChatMessage, RuntimeStatus } from "../types";
import { createAdapter } from "../adapters/interface";
import "../adapters/registry"; // side-effect registration
import { decideRouting } from "../routing/decision";
import { stripMentions } from "../routing/parser";

const CUSTOM_AGENTS_STORAGE_KEY = "agentdock.custom-agents.v1";
const OPENAI_COMPATIBLE_ENDPOINT = "http://127.0.0.1:8787/api/agents/openai-compatible";
const APP_RUNTIME_VERSION = "agentdock-mvp-2026-05-01-1";
const AGENT_REPLY_TIMEOUT_MS = 120000;

const DEFAULT_AGENTS: Agent[] = [
  {
    id: "hermes",
    name: "Hermes",
    aliases: ["h", "butler", "管家"],
    description: "Real Hermes CLI via local AgentDock API",
    source: "builtin",
    transport: "http",
    endpoint: "http://127.0.0.1:8787/api/agents/hermes",
    enabled: true,
    mentionable: true,
    callable: false,
    speaker: true,
  },
  {
    id: "claude-code",
    name: "Claude Code",
    aliases: ["claude", "cc"],
    description: "Real Claude Code CLI via local AgentDock API",
    source: "builtin",
    transport: "http",
    endpoint: "http://127.0.0.1:8787/api/agents/claude-code",
    enabled: true,
    mentionable: true,
    callable: false,
    speaker: true,
  },
  {
    id: "codex",
    name: "Codex",
    aliases: ["cx"],
    description: "Real Codex CLI via local AgentDock API",
    source: "builtin",
    transport: "http",
    endpoint: "http://127.0.0.1:8787/api/agents/codex",
    enabled: true,
    mentionable: true,
    callable: false,
    speaker: true,
  },
];

interface OpenAICompatibleDraft {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export function useAgentStore() {
  const [agents, setAgents] = useState<Agent[]>(() => loadAgents());
  const [butlerId, setButlerId] = useState<string>("hermes");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus>({
    loadedAt: Date.now(),
    sendCount: 0,
    lastInput: "",
    lastRoute: "No message sent yet.",
    lastError: "",
  });

  useEffect(() => {
    persistCustomAgents(agents.filter((agent) => agent.source === "custom"));
  }, [agents]);

  const resetSession = useCallback(() => {
    setAgents(loadAgents());
    setButlerId("hermes");
    setMessages([]);
    setIsProcessing(false);
    setRuntimeStatus({
      loadedAt: Date.now(),
      sendCount: 0,
      lastInput: "",
      lastRoute: `Reset ${APP_RUNTIME_VERSION}. No message sent yet.`,
      lastError: "",
    });
  }, []);

  const addOpenAICompatibleModel = useCallback((draft: OpenAICompatibleDraft) => {
    const name = draft.name.trim();
    const baseUrl = normalizeBaseUrl(draft.baseUrl);
    const apiKey = draft.apiKey.trim();
    const model = draft.model.trim();

    if (!name || !baseUrl || !apiKey || !model) {
      throw new Error("Name, base URL, API key, and model are required.");
    }

    const agentId = generateCustomAgentId(name, model, agents);
    const agent: Agent = {
      id: agentId,
      name,
      aliases: uniqueStrings([slugify(name), slugify(model)]),
      description: `OpenAI-compatible model via ${baseUrl}`,
      source: "custom",
      transport: "http",
      endpoint: OPENAI_COMPATIBLE_ENDPOINT,
      requestBody: {
        provider: {
          baseUrl,
          apiKey,
          model,
        },
      },
      enabled: true,
      mentionable: true,
      callable: false,
      speaker: true,
    };

    setAgents((prev) => [...prev, agent]);
  }, [agents]);

  const toggleAgent = useCallback(
    (agentId: string, field: keyof Pick<Agent, "enabled" | "mentionable" | "callable" | "speaker">) => {
      if (agentId === butlerId && field === "enabled") {
        return;
      }

      setAgents((prev) =>
        prev.map((agent) => (agent.id === agentId ? { ...agent, [field]: !agent[field] } : agent)),
      );
    },
    [butlerId],
  );

  const sendMessage = useCallback(
    async (input: string) => {
      if (!input.trim() || isProcessing) return;

      setIsProcessing(true);
      setRuntimeStatus((prev) => ({
        ...prev,
        sendCount: prev.sendCount + 1,
        lastInput: input,
        lastError: "",
      }));

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: input,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const decision = decideRouting(input, agents, butlerId);
        const cleanInput = stripMentions(input);
        const routeDescription = describeRoute(decision.targetAgents, decision.callableAgents, agents);
        setRuntimeStatus((prev) => ({
          ...prev,
          lastRoute: routeDescription,
        }));

        const agentMessages: AgentMessage[] = [
          {
            id: crypto.randomUUID(),
            agentId: "system",
            content: routeDescription,
            timestamp: Date.now(),
            type: "activity",
          },
        ];

        const tasks = decision.targetAgents.map(async (agentId) => {
          const agent = agents.find((item) => item.id === agentId);
          if (!agent) return;

          try {
            const adapter = createAdapter(agent, {
              transport: agent.transport,
              endpoint: agent.endpoint,
              requestBody: agent.requestBody,
            });
            const reply = await withTimeout(
              adapter.send(cleanInput || input),
              AGENT_REPLY_TIMEOUT_MS,
              `${agent.name} timed out after ${AGENT_REPLY_TIMEOUT_MS / 1000}s`,
            );
            agentMessages.push({
              id: crypto.randomUUID(),
              agentId,
              content: reply,
              timestamp: Date.now(),
              type: "response",
            });
          } catch (error) {
            agentMessages.push({
              id: crypto.randomUUID(),
              agentId,
              content: `${agent.name} failed: ${error instanceof Error ? error.message : "unknown error"}`,
              timestamp: Date.now(),
              type: "response",
            });
          }
        });

        const callableTasks = decision.callableAgents.map(async (agentId) => {
          const agent = agents.find((item) => item.id === agentId);
          if (!agent) return;

          try {
            const adapter = createAdapter(agent, {
              transport: agent.transport,
              endpoint: agent.endpoint,
              requestBody: agent.requestBody,
            });
            await withTimeout(
              adapter.send(cleanInput || input),
              AGENT_REPLY_TIMEOUT_MS,
              `${agent.name} silent call timed out after ${AGENT_REPLY_TIMEOUT_MS / 1000}s`,
            );
            agentMessages.push({
              id: crypto.randomUUID(),
              agentId,
              content: `(${agent.name} processed silently)`,
              timestamp: Date.now(),
              type: "activity",
            });
          } catch (error) {
            agentMessages.push({
              id: crypto.randomUUID(),
              agentId,
              content: `(${agent.name} silent call failed: ${error instanceof Error ? error.message : "unknown error"})`,
              timestamp: Date.now(),
              type: "activity",
            });
          }
        });

        await Promise.all([...tasks, ...callableTasks]);

        if (decision.mention.kind === "broadcast") {
          const butler = agents.find((item) => item.id === butlerId);
          if (butler) {
            agentMessages.push({
              id: crypto.randomUUID(),
              agentId: butlerId,
              content: `[Butler Summary] ${decision.targetAgents.length} agents responded to your broadcast.`,
              timestamp: Date.now(),
              type: "summary",
            });
          }
        }

        agentMessages.sort((a, b) => a.timestamp - b.timestamp);

        const agentMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "agents",
          content: agentMessages.map((m) => m.content).join("\n\n"),
          agentMessages,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, agentMsg]);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown routing error";
        setRuntimeStatus((prev) => ({
          ...prev,
          lastError: errorMessage,
        }));
        const agentMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "agents",
          content: errorMessage,
          agentMessages: [
            {
              id: crypto.randomUUID(),
              agentId: "system",
              content: errorMessage,
              timestamp: Date.now(),
              type: "response",
            },
          ],
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, agentMsg]);
      } finally {
        setIsProcessing(false);
      }
    },
    [agents, butlerId, isProcessing],
  );

  return {
    agents,
    butlerId,
    setButlerId,
    messages,
    isProcessing,
    runtimeStatus,
    toggleAgent,
    addOpenAICompatibleModel,
    resetSession,
    sendMessage,
  };
}

function loadAgents(): Agent[] {
  return [...DEFAULT_AGENTS, ...loadCustomAgents()];
}

function loadCustomAgents(): Agent[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CUSTOM_AGENTS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeAgent)
      .filter((agent): agent is Agent => agent !== null);
  } catch {
    return [];
  }
}

function persistCustomAgents(customAgents: Agent[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CUSTOM_AGENTS_STORAGE_KEY, JSON.stringify(customAgents));
  } catch {
    // Ignore storage errors; the session still works.
  }
}

function normalizeAgent(value: unknown): Agent | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<Agent>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.name !== "string" ||
    !Array.isArray(candidate.aliases) ||
    typeof candidate.description !== "string" ||
    typeof candidate.transport !== "string" ||
    typeof candidate.enabled !== "boolean" ||
    typeof candidate.mentionable !== "boolean" ||
    typeof candidate.callable !== "boolean" ||
    typeof candidate.speaker !== "boolean"
  ) {
    return null;
  }

  return {
    id: candidate.id,
    name: candidate.name,
    aliases: candidate.aliases.filter((item): item is string => typeof item === "string"),
    description: candidate.description,
    source: candidate.source === "custom" ? "custom" : "builtin",
    transport: candidate.transport as Agent["transport"],
    endpoint: typeof candidate.endpoint === "string" ? candidate.endpoint : undefined,
    requestBody:
      candidate.requestBody && typeof candidate.requestBody === "object"
        ? (candidate.requestBody as Record<string, unknown>)
        : undefined,
    enabled: candidate.enabled,
    mentionable: candidate.mentionable,
    callable: candidate.callable,
    speaker: candidate.speaker,
  };
}

function generateCustomAgentId(name: string, model: string, agents: Agent[]): string {
  const base = slugify(`${name}-${model}`) || "custom-model";
  let candidate = `model-${base}`;
  let counter = 2;

  while (agents.some((agent) => agent.id === candidate)) {
    candidate = `model-${base}-${counter}`;
    counter += 1;
  }

  return candidate;
}

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function describeRoute(targetAgentIds: string[], callableAgentIds: string[], agents: Agent[]): string {
  const describe = (id: string) => {
    if (id === "system") return "System";
    const agent = agents.find((item) => item.id === id);
    if (!agent) return id;
    if (agent.source === "custom") {
      const provider = agent.requestBody?.provider;
      const model =
        provider && typeof provider === "object" && "model" in provider
          ? String((provider as { model?: unknown }).model ?? "")
          : "";
      return model ? `${agent.name} (OpenAI-compatible: ${model})` : `${agent.name} (OpenAI-compatible)`;
    }
    return `${agent.name} (${agent.transport})`;
  };

  const targets = targetAgentIds.map(describe).join(", ") || "none";
  const callables = callableAgentIds.map(describe).join(", ") || "none";
  return `Route: visible replies -> ${targets}; silent calls -> ${callables}.`;
}