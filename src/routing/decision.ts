import type { Agent, RoutingDecision, MentionTarget } from "../types";
import { parseMentions } from "./parser";

export function decideRouting(
  input: string,
  agents: Agent[],
  butlerId: string,
): RoutingDecision {
  const mention = parseMentions(input);
  return buildDecision(mention, agents, butlerId);
}

export function buildDecision(
  mention: MentionTarget,
  agents: Agent[],
  butlerId: string,
): RoutingDecision {
  const enabled = agents.filter((a) => a.enabled);
  const mentionable = enabled.filter((a) => a.mentionable && a.speaker);
  const callable = enabled.filter((a) => a.callable);

  switch (mention.kind) {
    case "specific": {
      const target = resolveMentionedAgent(mention.agentId, mentionable);
      return {
        mention,
        targetAgents: target ? [target.id] : [],
        callableAgents: [],
        finalSpeaker: target ? "mentioned" : "none",
        includeContext: Boolean(target),
      };
    }

    case "broadcast": {
      return {
        mention,
        targetAgents: mentionable.map((a) => a.id),
        callableAgents: [],
        finalSpeaker: mentionable.length > 0 ? "multiple" : "none",
        includeContext: true,
      };
    }

    case "none": {
      const butler = enabled.find((a) => a.id === butlerId);
      const callables = callable
        .filter((a) => a.id !== butlerId)
        .map((a) => a.id);
      return {
        mention,
        targetAgents: butler ? [butler.id] : [],
        callableAgents: callables,
        finalSpeaker: butler ? "butler" : "none",
        includeContext: true,
      };
    }
  }
}

function resolveMentionedAgent(rawMention: string, agents: Agent[]): Agent | undefined {
  const mention = normalizeMention(rawMention);
  return agents.find((agent) => {
    const candidates = [agent.id, agent.name, ...agent.aliases].map(normalizeMention);
    return candidates.includes(mention);
  });
}

function normalizeMention(value: string): string {
  return value.toLowerCase().replace(/[\s_]+/g, "-");
}