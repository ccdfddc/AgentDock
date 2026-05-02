import type { MentionTarget } from "../types";

const BROADCAST_RE = /@(all|全部)(?=$|[\s,.!?;:，。！？；：])/i;
const MENTION_RE = /@([\p{L}\p{N}_-]+)/gu;

export function parseMentions(input: string): MentionTarget {
  if (BROADCAST_RE.test(input)) {
    return { kind: "broadcast" };
  }

  const mentions: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = MENTION_RE.exec(input)) !== null) {
    const tag = match[1].toLowerCase();
    if (tag !== "all" && tag !== "全部") {
      mentions.push(tag);
    }
  }

  if (mentions.length === 1) {
    return { kind: "specific", agentId: mentions[0] };
  }
  // Zero or multiple specific mentions: treat as first specific if any
  if (mentions.length > 1) {
    return { kind: "specific", agentId: mentions[0] };
  }

  return { kind: "none" };
}

export function stripMentions(input: string): string {
  return input.replace(/@([\p{L}\p{N}_-]+)/gu, "").replace(/\s+/g, " ").trim();
}