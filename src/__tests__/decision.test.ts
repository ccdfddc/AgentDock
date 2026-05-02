import { describe, it, expect } from "vitest";
import { decideRouting, buildDecision } from "../routing/decision";
import type { Agent, MentionTarget } from "../types";

const AGENTS: Agent[] = [
  { id: "hermes", name: "Hermes", aliases: ["管家"], description: "", transport: "mock", enabled: true, mentionable: true, callable: true, speaker: true },
  { id: "claude-code", name: "Claude Code", aliases: ["claude"], description: "", transport: "mock", enabled: true, mentionable: true, callable: false, speaker: true },
  { id: "codex", name: "Codex", aliases: [], description: "", transport: "mock", enabled: false, mentionable: true, callable: true, speaker: true },
];

describe("decideRouting", () => {
  it("routes @hermes to hermes only", () => {
    const d = decideRouting("@hermes explain this", AGENTS, "hermes");
    expect(d.mention).toEqual({ kind: "specific", agentId: "hermes" });
    expect(d.targetAgents).toEqual(["hermes"]);
    expect(d.callableAgents).toEqual([]);
  });

  it("routes @claude-code to claude-code only", () => {
    const d = decideRouting("@claude-code refactor", AGENTS, "hermes");
    expect(d.targetAgents).toEqual(["claude-code"]);
  });

  it("routes @Claude alias to claude-code only", () => {
    const d = decideRouting("@Claude refactor", AGENTS, "hermes");
    expect(d.targetAgents).toEqual(["claude-code"]);
    expect(d.finalSpeaker).toBe("mentioned");
    expect(d.includeContext).toBe(true);
  });

  it("routes @管家 alias to hermes only", () => {
    const d = decideRouting("@管家 出来", AGENTS, "hermes");
    expect(d.targetAgents).toEqual(["hermes"]);
    expect(d.finalSpeaker).toBe("mentioned");
  });

  it("returns empty target for disabled agent mention", () => {
    const d = decideRouting("@codex generate code", AGENTS, "hermes");
    expect(d.targetAgents).toEqual([]);
  });

  it("broadcasts to all enabled mentionable agents on @all", () => {
    const d = decideRouting("@all review", AGENTS, "hermes");
    expect(d.mention).toEqual({ kind: "broadcast" });
    expect(d.targetAgents).toEqual(["hermes", "claude-code"]);
    expect(d.finalSpeaker).toBe("multiple");
  });

  it("broadcasts on @全部", () => {
    const d = decideRouting("@全部 review", AGENTS, "hermes");
    expect(d.mention).toEqual({ kind: "broadcast" });
    expect(d.targetAgents).toContain("hermes");
    expect(d.targetAgents).toContain("claude-code");
  });

  it("routes no-mention to butler with callable agents as activity", () => {
    const d = decideRouting("hello", AGENTS, "hermes");
    expect(d.mention).toEqual({ kind: "none" });
    expect(d.targetAgents).toEqual(["hermes"]);
    expect(d.finalSpeaker).toBe("butler");
    // codex is disabled, so no callable agents
    expect(d.callableAgents).toEqual([]);
  });

  it("routes plain text to selected butler even when butler speaker is off", () => {
    const agents: Agent[] = [
      { id: "hermes", name: "Hermes", aliases: [], description: "", transport: "mock", enabled: true, mentionable: true, callable: true, speaker: false },
      { id: "claude-code", name: "Claude Code", aliases: ["claude"], description: "", transport: "mock", enabled: true, mentionable: true, callable: false, speaker: true },
    ];
    const d = decideRouting("管家出来", agents, "hermes");
    expect(d.mention).toEqual({ kind: "none" });
    expect(d.targetAgents).toEqual(["hermes"]);
    expect(d.finalSpeaker).toBe("butler");
  });

  it("routes no-mention to butler and shows enabled callable agents", () => {
    const agentsWithCallable: Agent[] = [
      { id: "hermes", name: "Hermes", aliases: [], description: "", transport: "mock", enabled: true, mentionable: true, callable: true, speaker: true },
      { id: "codex", name: "Codex", aliases: [], description: "", transport: "mock", enabled: true, mentionable: true, callable: true, speaker: true },
    ];
    const d = decideRouting("hello", agentsWithCallable, "hermes");
    expect(d.targetAgents).toEqual(["hermes"]);
    expect(d.callableAgents).toEqual(["codex"]);
  });

  it("butler is excluded from callable list", () => {
    const agentsWithCallable: Agent[] = [
      { id: "hermes", name: "Hermes", aliases: [], description: "", transport: "mock", enabled: true, mentionable: true, callable: true, speaker: true },
      { id: "codex", name: "Codex", aliases: [], description: "", transport: "mock", enabled: true, mentionable: true, callable: true, speaker: true },
    ];
    const d = decideRouting("hello", agentsWithCallable, "codex");
    expect(d.targetAgents).toEqual(["codex"]);
    expect(d.callableAgents).toEqual(["hermes"]);
  });
});

describe("buildDecision", () => {
  const agents: Agent[] = [
    { id: "a", name: "A", aliases: [], description: "", transport: "mock", enabled: true, mentionable: true, callable: false, speaker: true },
    { id: "b", name: "B", aliases: [], description: "", transport: "mock", enabled: true, mentionable: false, callable: true, speaker: true },
  ];

  it("specific mention targets only mentionable agents", () => {
    const mention: MentionTarget = { kind: "specific", agentId: "b" };
    const d = buildDecision(mention, agents, "a");
    // b is not mentionable, so empty
    expect(d.targetAgents).toEqual([]);
  });

  it("broadcast skips non-mentionable agents", () => {
    const mention: MentionTarget = { kind: "broadcast" };
    const d = buildDecision(mention, agents, "a");
    expect(d.targetAgents).toEqual(["a"]);
  });

  it("none routes to butler", () => {
    const mention: MentionTarget = { kind: "none" };
    const d = buildDecision(mention, agents, "b");
    expect(d.targetAgents).toEqual(["b"]);
    expect(d.callableAgents).toEqual([]);
  });
});