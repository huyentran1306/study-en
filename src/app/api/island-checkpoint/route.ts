import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { CEFR, type Cefr } from "@/lib/island/feedback";
import { CHECK_TASKS, type CheckAI, type CheckSkill, type CheckTask } from "@/lib/island/checkpoint";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Kiểm tra nói định kỳ: chấm 3 bài nói ngắn (giới thiệu, kể chuyện quá khứ, xử lý tình huống)
// trên thang TUYỆT ĐỐI gắn với CEFR, để so được tiến bộ giữa các lần.

interface Body {
  tasks?: { id?: string; text?: string; sec?: number }[];
}

const clean = (v: unknown, max = 300) => String(v || "").replace(/[\u0000-\u001f`]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const KEYS: CheckSkill[] = ["f", "a", "r", "c"];
const wordCount = (s: string) => s.split(/\s+/).filter((w) => /[a-z]/i.test(w)).length;

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
  const answers = CHECK_TASKS.map((t) => {
    const a = (Array.isArray(body.tasks) ? body.tasks : []).find((x) => x?.id === t.id);
    return { task: t, text: clean(a?.text, 1200), sec: Math.max(0, Math.min(120, Number(a?.sec) || 0)) };
  });
  if (answers.reduce((n, a) => n + wordCount(a.text), 0) < 8) return NextResponse.json({ error: "Too short" }, { status: 400 });

  const system = `You are a certified, fair English speaking examiner for Vietnamese adult learners. The learner recorded three short spoken answers (transcribed by speech recognition, so ignore small transcription glitches and missing punctuation).
Score on an ABSOLUTE scale anchored to CEFR (NOT relative to any course level), so scores can be compared over months:
1 = below A1 (isolated words), 2 = A1 (memorised phrases, very short simple sentences), 3 = A2 (simple connected sentences on familiar topics), 4 = B1 (connected speech, reasons and narration, mostly accurate), 5 = B2 or above (fluent, detailed, varied, few errors).
Skills:
- f (fluency): length and flow; full sentences vs fragments; few restarts.
- a (accuracy): grammar and word choice, relative to how much was said (e.g. past tense in the weekend story).
- r (range): variety of vocabulary and sentence patterns.
- c (coherence & task): answers the task fully, gives main idea + details/reasons, uses linking words (and, but, because, then, so).
If an answer is empty or off-topic, lower c and f for that task.
Return JSON:
- "f","a","r","c": integers 1-5 for the whole test.
- "cefr": overall level, one of ${CEFR.join(", ")}. Be honest; most beginners are A1 or A2.
- "praise": one specific Vietnamese sentence (max 25 words) that QUOTES the learner's own English words in quotes and says WHY it is good, e.g. "Bạn dùng 'because it helps me relax' để nêu lý do, nghe rất tự nhiên!" or "Bạn mở đầu lịch sự bằng 'Excuse me, I think there is a mistake'." Never praise just saying a name.
- "focus": the ONE most useful next step: {"title": Vietnamese, max 10 words, naming the pattern (e.g. "Kể chuyện đã qua: go → went"), "tip": Vietnamese, max 30 words, that QUOTES the learner's exact English mistake and the fix (e.g. "Bạn nói 'I go cinema', kể chuyện cuối tuần trước nên là 'I went to the cinema'."), "example": one short model English sentence}.
- "upgrade": {"from": an exact short sentence the learner said, "to": a natural version one CEFR level higher (max 2 sentences)} or null.
- "notes": {"intro": ..., "past": ..., "solve": ...} one short Vietnamese comment (max 18 words) per task.
JSON only.`;

  const user = answers.map((a) => `Task "${a.task.id}": ${a.task.en}\nLearner (${a.sec}s): ${a.text || "(no answer)"}`).join("\n\n");

  try {
    const { env } = await getCloudflareContext({ async: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ai = (env as any).AI;
    if (!ai) throw new Error("AI binding missing");
    const result = await ai.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [
        { role: "system", content: system },
        { role: "user", content: `${user}\n\nJSON only.` },
      ],
      max_tokens: 600,
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          type: "object",
          properties: {
            f: { type: "integer" },
            a: { type: "integer" },
            r: { type: "integer" },
            c: { type: "integer" },
            cefr: { type: "string", enum: [...CEFR] },
            praise: { type: "string" },
            focus: { type: "object", properties: { title: { type: "string" }, tip: { type: "string" }, example: { type: "string" } }, required: ["title", "tip", "example"] },
            upgrade: { anyOf: [{ type: "null" }, { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, required: ["from", "to"] }] },
            notes: { type: "object", properties: { intro: { type: "string" }, past: { type: "string" }, solve: { type: "string" } }, required: ["intro", "past", "solve"] },
          },
          required: ["f", "a", "r", "c", "cefr", "praise", "focus", "upgrade", "notes"],
        },
      },
    });
    const j = extractJson((result as { response?: unknown }).response);
    if (!j) throw new Error("Bad AI response");
    const sc = (k: CheckSkill) => Math.min(5, Math.max(1, Math.round(Number(j[k]) || 2)));
    const focus = (j.focus || {}) as Record<string, unknown>;
    const notes = (j.notes || {}) as Record<string, unknown>;
    const up = j.upgrade as Record<string, unknown> | null;
    const upFrom = clean(up?.from, 200);
    const upTo = clean(up?.to, 300);
    const all = answers.map((a) => a.text.toLowerCase()).join(" ");
    const out: CheckAI = {
      scores: Object.fromEntries(KEYS.map((k) => [k, sc(k)])) as Record<CheckSkill, number>,
      cefr: CEFR.includes(j.cefr as Cefr) ? (j.cefr as Cefr) : "A1",
      praise: clean(j.praise, 220),
      focus: { title: clean(focus.title, 80), tip: clean(focus.tip, 240), example: clean(focus.example, 200) },
      // Chỉ nhận "nâng cấp" khi câu gốc đúng là câu người học đã nói.
      upgrade: upFrom && upTo && all.includes(upFrom.toLowerCase().replace(/[.!?]+$/, "")) ? { from: upFrom, to: upTo } : null,
      notes: Object.fromEntries(CHECK_TASKS.map((t) => [t.id, clean(notes[t.id], 160)])) as Record<CheckTask["id"], string>,
    };
    if (!out.focus.title || !out.praise) throw new Error("Incomplete result");
    return NextResponse.json({ result: out });
  } catch (error) {
    console.error("island-checkpoint error:", error);
    return NextResponse.json({ result: null, offline: true });
  }
}
