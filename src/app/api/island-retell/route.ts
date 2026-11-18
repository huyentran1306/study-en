import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// "Kể lại cho Bơ": sau cuộc trò chuyện, người học kể lại cho bạn khác nghe (đổi ngôi, lùi thì, tóm tắt) — kỹ năng của B1.

interface Body {
  npcName?: string;
  level?: string;
  history?: { role: "user" | "assistant"; content: string }[];
  retell?: string;
}

const clean = (v: unknown, max = 400) => String(v || "").replace(/[\u0000-\u001f`]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

function extractJson(raw: unknown): Record<string, unknown> | null {
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw !== "string") return null;
  const a = raw.indexOf("{");
  const b = raw.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try {
    return JSON.parse(raw.slice(a, b + 1));
  } catch {
    return null;
  }
}

// Cư dân là con vật: không bắt lỗi he/she/him/her — giữ đúng đại từ người học đã chọn.
const PRON = new Set(["he", "she", "him", "her", "his", "hers", "it", "its"]);
function keepPronouns(said: string, fixed: string): string {
  const a = said.split(" ");
  const b = fixed.split(" ");
  if (a.length !== b.length) return fixed;
  return b.map((w, i) => (PRON.has(w.toLowerCase()) && PRON.has(a[i].toLowerCase()) ? a[i] : w)).join(" ");
}

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const retell = clean(body.retell, 800);
  if (retell.split(/\s+/).length < 4) return NextResponse.json({ error: "Too short" }, { status: 400 });
  const npc = clean(body.npcName, 20) || "the NPC";
  const history = (Array.isArray(body.history) ? body.history : []).slice(-20).map((m) => `${m.role === "assistant" ? npc : "Learner"}: ${clean(m.content, 300)}`);
  const level = clean(body.level, 4) || "A2";

  const system = `You are a warm, expert English speaking teacher. A Vietnamese learner (level ${level}) just chatted with ${npc}. Now they retell that chat to their friend Bơ, in English.
A good retelling: tells what happened in the past tense, uses third person for ${npc} ("${npc} asked me...", "she said..."), covers the main points, and links ideas (first, then, because, so).
Return JSON:
- "score": 1-5 for this retelling (3 = clear and mostly correct for ${level}).
- "good": one specific Vietnamese sentence on what they did well, talking to the learner as "bạn" (max 25 words).
- "fixes": up to 3 items {"said": exact words from the retelling, "fixed": corrected words, "note": short, precise Vietnamese reason (e.g. "say là động từ bất quy tắc: said")}. Empty list if none. ${npc} is an animal character: never correct he/she/him/her/it choices for ${npc}.
- "model": a natural model retelling of the same chat in 3-4 short sentences at level ${level === "A1" ? "A2" : "B1"}, from the learner's point of view.`;

  try {
    const { env } = await getCloudflareContext({ async: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ai = (env as any).AI;
    if (!ai) throw new Error("AI binding missing");
    const result = await ai.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [
        { role: "system", content: system },
        { role: "user", content: `The chat:\n${history.join("\n")}\n\nThe learner's retelling to Bơ:\n${retell}\n\nJSON only.` },
      ],
      max_tokens: 500,
      temperature: 0.3,
      response_format: {
        type: "json_schema",
        json_schema: {
          type: "object",
          properties: {
            score: { type: "integer" },
            good: { type: "string" },
            fixes: { type: "array", items: { type: "object", properties: { said: { type: "string" }, fixed: { type: "string" }, note: { type: "string" } }, required: ["said", "fixed", "note"] } },
            model: { type: "string" },
          },
          required: ["score", "good", "fixes", "model"],
        },
      },
    });
    const j = extractJson((result as { response?: unknown }).response);
    if (!j) throw new Error("Bad AI response");
    const fixes = (Array.isArray(j.fixes) ? (j.fixes as Record<string, unknown>[]) : [])
      .slice(0, 3)
      .map((f) => ({ said: clean(f.said, 200), fixed: keepPronouns(clean(f.said, 200), clean(f.fixed, 200)), note: clean(f.note, 160) }))
      .filter((f) => f.said && f.fixed && f.said.toLowerCase() !== f.fixed.toLowerCase());
    return NextResponse.json({ score: Math.min(5, Math.max(1, Math.round(Number(j.score) || 3))), good: clean(j.good, 200), fixes, model: clean(j.model, 600) });
  } catch (error) {
    console.error("island-retell error:", error);
    return NextResponse.json({ offline: true });
  }
}
