"use client";

// Gọi AI cho các màn trò chuyện (Tám chuyện, Gọi điện, Nhiệm vụ hỏi thông tin, Thử thách cuối tuần) — dùng chung.
import { NPCS, type NpcId } from "./curriculum";
import type { ErrorTag, FixMode, ReportAI } from "./feedback";
import { addMemories, type Memory } from "./progress";

export type Turn = { role: "user" | "assistant"; content: string };
export type Correction = { fixed: string; note: string; tag?: ErrorTag };
export type NpcReply = { reply: string; correction: Correction | null; praise?: number | null; offline?: boolean };

export interface AskParams {
  npc: NpcId;
  persona: string;
  topic: string;
  level: string;
  history: Turn[];
  message: string;
  twist?: string;
  about?: string;
  memories?: string[];
  practice?: { said: string; fixed: string }[];
  mode?: FixMode;
  /** Thông tin bí mật cư dân giữ (Nhiệm vụ hỏi thông tin). */
  secret?: string;
  /** -1 = nói dễ hơn, 1 = nói khó hơn (tự chỉnh độ khó). */
  adapt?: number;
  /** Cư dân thỉnh thoảng nói khó / dùng từ lạ để người học luyện cách hỏi lại. */
  tricky?: boolean;
}

export async function askNpc(p: AskParams): Promise<NpcReply> {
  try {
    const res = await fetch("/api/island-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, npcName: NPCS[p.npc].name, npc: undefined }),
    });
    return (await res.json()) as NpcReply;
  } catch {
    return { reply: "Sorry, I didn't catch that. Could you say it again?", correction: null, offline: true };
  }
}

/** Gửi cuộc trò chuyện cho AI để cư dân nhớ vài chuyện bạn kể. keepalive: vẫn chạy khi đã rời trang. */
export async function rememberChat(npc: NpcId, ch: number, topic: string, history: Turn[], known: string[]): Promise<Memory[]> {
  try {
    const res = await fetch("/api/island-memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ npcName: NPCS[npc].name, topic, history: history.slice(-14), known }),
      keepalive: true,
    });
    const j = (await res.json()) as { memories?: { fact: string; vi: string; ask: string }[] };
    return j.memories?.length ? addMemories(npc, ch, j.memories) : [];
  } catch {
    return [];
  }
}

/** Chấm phiếu nhận xét. */
export async function fetchReport(p: { npc: NpcId; topic: string; level: string; history: Turn[]; fixes: { said: string; fixed: string; tag?: string }[] }): Promise<ReportAI | null> {
  try {
    const res = await fetch("/api/island-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ npcName: NPCS[p.npc].name, topic: p.topic, level: p.level, history: p.history, fixes: p.fixes }),
    });
    return ((await res.json()) as { report?: ReportAI | null }).report || null;
  } catch {
    return null;
  }
}
