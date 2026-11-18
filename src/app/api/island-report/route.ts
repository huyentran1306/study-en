import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { CEFR, type Cefr, type ReportAI, type SkillKey } from "@/lib/island/feedback";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Phiếu nhận xét sau một cuộc trò chuyện: chấm 4 tiêu chí nói (CEFR), khen một câu cụ thể,
// chọn MỘT điểm cần sửa, và "nâng cấp" một câu trả lời ngắn thành câu dài hơn.

interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface Body {
  npcName?: string;
  topic?: string;
  level?: string;
  history?: Msg[];
  /** Các câu đã bị sửa trong buổi. */
  fixes?: { said: string; fixed: string; note?: string; tag?: string }[];
}

const clean = (v: unknown, max = 300) => String(v || "").replace(/[\u0000-\u001f`]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const KEYS: SkillKey[] = ["fluency", "accuracy", "range", "interaction"];

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
  const history = (Array.isArray(body.history) ? body.history : []).slice(-24).map((m) => ({ who: m.role === "assistant" ? "NPC" : "Learner", text: clean(m.content, 400) }));
  const mine = history.filter((m) => m.who === "Learner" && m.text);
  if (mine.length < 2) return NextResponse.json({ error: "Too short" }, { status: 400 });
  const fixes = (Array.isArray(body.fixes) ? body.fixes : []).slice(0, 12).map((f) => ({ said: clean(f?.said, 200), fixed: clean(f?.fixed, 200), tag: clean(f?.tag, 20) }));
  const level = clean(body.level, 4) || "A2";

  const system = `You are an expert, warm English speaking teacher for Vietnamese adults. Below is a short practice chat between ${clean(body.npcName, 20) || "an NPC"} and a learner (target level ${level}, topic: ${clean(body.topic, 80)}).
Mistakes already found in the learner's lines: ${fixes.length ? fixes.map((f) => `"${f.said}" -> "${f.fixed}" (${f.tag})`).join("; ") : "none"}.

Give feedback ONLY on the Learner's lines. Score each skill 1-5 (be honest but encouraging; 3 = solid for ${level}):
- fluency: length and flow of answers (1 = single words, 3 = full simple sentences, 5 = several connected sentences with linking words)
- accuracy: grammar correctness relative to how much they said
- range: variety of vocabulary and sentence patterns
- interaction: answers what was asked, adds details, asks questions back, keeps the chat going
Also return:
- "cefr": the CEFR level this chat sounds like, one of ${CEFR.join(", ")}.
- "praise": the learner's BEST line (longest or richest, never a one-word answer): {"quote": an exact quote of it (or its best part), "vi": one specific Vietnamese sentence naming WHAT is good in it, e.g. "Bạn dùng 'so' để nối lý do, câu nghe rất tự nhiên!" or "Bạn hỏi lại Miso, đúng kiểu người bản xứ giữ mạch chuyện." (max 25 words)}. Never praise being short.
- "focus": the ONE most useful thing to improve next time: {"title": a concrete Vietnamese title naming the pattern, max 10 words (e.g. "Kể chuyện đã qua: go → went, visit → visited"), "tip": a concrete Vietnamese tip quoting the learner's own words (max 30 words, e.g. "Khi có 'yesterday', 'last weekend', đổi động từ sang quá khứ: bạn nói 'I go', nên là 'I went'."), "example": one short model English sentence on the same topic as the chat}. Prefer the pattern that appears most in the mistakes; if there are none, pick giving longer answers (answer + reason) or asking questions back.
- "upgrade": take the learner's shortest or simplest answer and show a natural, longer ${level === "A1" ? "A2" : "B1"} version (2 short sentences: answer + reason or detail): {"from": exact learner line, "to": better version}. Use null if every answer is already rich.
Respond ONLY with JSON.`;

  try {
    const { env } = await getCloudflareContext({ async: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ai = (env as any).AI;
    if (!ai) throw new Error("AI binding missing");
    const result = await ai.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Chat:\n${history.map((m) => `${m.who}: ${m.text}`).join("\n")}\n\nJSON only.` },
      ],
      max_tokens: 500,
      temperature: 0.3,
      response_format: {
        type: "json_schema",
        json_schema: {
          type: "object",
          properties: {
            fluency: { type: "integer" },
            accuracy: { type: "integer" },
            range: { type: "integer" },
            interaction: { type: "integer" },
            cefr: { type: "string", enum: [...CEFR] },
            praise: { type: "object", properties: { quote: { type: "string" }, vi: { type: "string" } }, required: ["quote", "vi"] },
            focus: { type: "object", properties: { title: { type: "string" }, tip: { type: "string" }, example: { type: "string" } }, required: ["title", "tip", "example"] },
            upgrade: { anyOf: [{ type: "null" }, { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, required: ["from", "to"] }] },
          },
          required: ["fluency", "accuracy", "range", "interaction", "cefr", "praise", "focus", "upgrade"],
        },
      },
    });
    const j = extractJson((result as { response?: unknown }).response);
    if (!j) throw new Error("Bad AI response");
    const sc = (k: SkillKey) => Math.min(5, Math.max(1, Math.round(Number(j[k]) || 3)));
    const praise = (j.praise || {}) as Record<string, unknown>;
    const focus = (j.focus || {}) as Record<string, unknown>;
    const up = j.upgrade as Record<string, unknown> | null;
    const upFrom = clean(up?.from, 200);
    const upTo = clean(up?.to, 300);
    const report: ReportAI = {
      scores: Object.fromEntries(KEYS.map((k) => [k, sc(k)])) as Record<SkillKey, number>,
      cefr: CEFR.includes(j.cefr as Cefr) ? (j.cefr as Cefr) : (level as Cefr),
      praise: { quote: clean(praise.quote, 200), vi: clean(praise.vi, 200) },
      focus: { title: clean(focus.title, 80), tip: clean(focus.tip, 240), example: clean(focus.example, 200) },
      // Chỉ nhận "nâng cấp" khi câu gốc đúng là câu người học đã nói.
      upgrade: upFrom && upTo && mine.some((m) => m.text.toLowerCase().includes(upFrom.toLowerCase().replace(/[.!?]+$/, ""))) ? { from: upFrom, to: upTo } : null,
    };
    if (!report.focus.title || !report.praise.vi) throw new Error("Incomplete report");
    return NextResponse.json({ report });
  } catch (error) {
    console.error("island-report error:", error);
    return NextResponse.json({ report: null, offline: true });
  }
}
