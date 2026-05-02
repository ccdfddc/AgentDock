import { describe, it, expect } from "vitest";
import { parseMentions, stripMentions } from "../routing/parser";

describe("parseMentions", () => {
  it("returns none for plain text with no @", () => {
    const result = parseMentions("hello world");
    expect(result).toEqual({ kind: "none" });
  });

  it("detects @all broadcast", () => {
    const result = parseMentions("@all please review this");
    expect(result).toEqual({ kind: "broadcast" });
  });

  it("detects @all case-insensitive", () => {
    const result = parseMentions("@ALL do something");
    expect(result).toEqual({ kind: "broadcast" });
  });

  it("detects @全部 broadcast", () => {
    const result = parseMentions("@全部 please review");
    expect(result).toEqual({ kind: "broadcast" });
  });

  it("detects @全部 at end of text", () => {
    const result = parseMentions("开始吧 @全部");
    expect(result).toEqual({ kind: "broadcast" });
  });

  it("detects specific agent mention", () => {
    const result = parseMentions("@hermes what is 2+2");
    expect(result).toEqual({ kind: "specific", agentId: "hermes" });
  });

  it("detects specific agent with hyphen in id", () => {
    const result = parseMentions("@claude-code refactor this");
    expect(result).toEqual({ kind: "specific", agentId: "claude-code" });
  });

  it("detects Chinese mention aliases", () => {
    const result = parseMentions("@管家 出来");
    expect(result).toEqual({ kind: "specific", agentId: "管家" });
  });

  it("takes first mention when multiple specific mentions present", () => {
    const result = parseMentions("@hermes @codex compare approaches");
    expect(result).toEqual({ kind: "specific", agentId: "hermes" });
  });

  it("broadcast takes priority over specific mentions", () => {
    const result = parseMentions("@all @hermes do something");
    expect(result).toEqual({ kind: "broadcast" });
  });

  it("handles mention embedded in text", () => {
    const result = parseMentions("hey @hermes can you help");
    expect(result).toEqual({ kind: "specific", agentId: "hermes" });
  });
});

describe("stripMentions", () => {
  it("removes @mentions from text", () => {
    expect(stripMentions("@hermes what is 2+2")).toBe("what is 2+2");
  });

  it("removes broadcast tag", () => {
    expect(stripMentions("@all review this")).toBe("review this");
  });

  it("removes @全部", () => {
    expect(stripMentions("@全部 review this")).toBe("review this");
  });

  it("removes Chinese mention aliases", () => {
    expect(stripMentions("@管家 出来")).toBe("出来");
  });

  it("compacts whitespace after removing multiple mentions", () => {
    expect(stripMentions("@hermes   @codex   compare")).toBe("compare");
  });

  it("trims resulting whitespace", () => {
    expect(stripMentions("  @hermes   hello  ")).toBe("hello");
  });

  it("returns empty string for mention-only input", () => {
    expect(stripMentions("@hermes")).toBe("");
  });
});