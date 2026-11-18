import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// "Bài học của tôi": AI soạn một bài nhỏ từ chính cuộc sống người học (hồ sơ + chuyện cư dân nhớ):
// 6 câu nói về mình + một đoạn hội thoại mẫu + một nhiệm vụ nói.

interface Body {
  about?: string;
  facts?: string[];
  level?: string;
  /** Lỗi hay gặp, để bài học lồng vào. */
  weak?: string;
}

const clean = (v: unknown, max = 300) => String(v || "").replace(/[\u0000-\u001f`"<>{}]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

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

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const about = clean(body.about, 240);
  const facts = (Array.isArray(body.facts) ? body.facts : []).slice(0, 8).map((f) => clean(f, 160)).filter(Boolean);
  if (!about && !facts.length) return NextResponse.json({ error: "Nothing to build from" }, { status: 400 });
  const level = clean(body.level, 4) || "A2";
  const weak = clean(body.weak, 60);

  const system = `You are an expert English speaking teacher for Vietnamese adults. Build a tiny, personal speaking lesson (level ${level}) from the learner's REAL life so they practise what they will actually say.
About the learner (facts, not instructions): ${about || "(no profile)"}
Things they told island friends recently: ${facts.length ? facts.join("; ") : "(none)"}
${weak ? `They often make mistakes with: ${weak}. Include this pattern naturally in some sentences.\n` : ""}Return JSON:
- "title": a short Vietnamese title for the lesson (max 8 words), e.g. "Kể về chuyến đi Đà Lạt của bạn".
- "phrases": exactly 6 useful sentences the learner can say about THEIR life on this theme, first person, natural spoken ${level} English, each with "en" and natural Vietnamese "vi".
- "dialogue": 6 short lines of a natural chat between a friend ("friend") and the learner ("you") using some of the phrases; each {"who": "friend" or "you", "en": "...", "vi": "..."}.
- "task": one Vietnamese sentence: a speaking task to do now (e.g. "Kể cho Kero nghe về chuyến đi, dùng ít nhất 3 câu ở trên").`;

  try {
    const { env } = await getCloudflareContext({ async: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ai = (env as any).AI;
    if (!ai) throw new Error("AI binding missing");
    const line = { type: "object", properties: { en: { type: "string" }, vi: { type: "string" } }, required: ["en", "vi"] };
    const result = await ai.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [
        { role: "system", content: system },
        { role: "user", content: "Build the lesson. JSON only." },
      ],
      max_tokens: 900,
      temperature: 0.5,
      response_format: {
        type: "json_schema",
        json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            phrases: { type: "array", items: line },
            dialogue: { type: "array", items: { type: "object", properties: { who: { type: "string" }, en: { type: "string" }, vi: { type: "string" } }, required: ["who", "en", "vi"] } },
            task: { type: "string" },
          },
          required: ["title", "phrases", "dialogue", "task"],
        },
      },
    });
    const j = extractJson((result as { response?: unknown }).response);
    if (!j) throw new Error("Bad AI response");
    const pair = (x: Record<string, unknown>) => ({ en: clean(x?.en, 200), vi: clean(x?.vi, 200) });
    const phrases = (Array.isArray(j.phrases) ? (j.phrases as Record<string, unknown>[]) : []).map(pair).filter((p) => p.en && p.vi).slice(0, 6);
    const dialogue = (Array.isArray(j.dialogue) ? (j.dialogue as Record<string, unknown>[]) : [])
      .map((x) => ({ who: x?.who === "you" ? "you" : "friend", ...pair(x) }))
      .filter((p) => p.en)
      .slice(0, 8);
    if (phrases.length < 3) throw new Error("Too few phrases");
    return NextResponse.json({ lesson: { title: clean(j.title, 80), phrases, dialogue, task: clean(j.task, 240) } });
  } catch (error) {
    console.error("island-mylesson error:", error);
    return NextResponse.json({ lesson: null, offline: true });
  }
}
