import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { sameFact } from "@/lib/island/memory";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// "Cư dân nhớ bạn": đọc cuộc trò chuyện, rút ra tối đa 2 chuyện đời thật người học kể
// (dự định, sự kiện, người thân, sở thích...) để lần sau cư dân hỏi lại.

interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface Body {
  npcName?: string;
  topic?: string;
  history?: Msg[];
  /** Những chuyện đã nhớ (tiếng Anh) — để không lưu trùng. */
  known?: string[];
}

const clean = (v: unknown, max = 160) => String(v || "").replace(/["\\\u0000-\u001f<>{}`]/g, "").replace(/\s+/g, " ").trim().slice(0, max);

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
  const history = (Array.isArray(body.history) ? body.history : []).slice(-14).map((m) => ({
    who: m.role === "assistant" ? "NPC" : "Learner",
    text: clean(m.content, 400),
  }));
  if (history.filter((m) => m.who === "Learner" && m.text).length < 2) return NextResponse.json({ memories: [] });
  const known = (Array.isArray(body.known) ? body.known : []).slice(0, 12).map((k) => clean(k)).filter(Boolean);
  const npc = clean(body.npcName, 20) || "the NPC";
  const topic = clean(body.topic, 80);

  const system = `You read a short English practice chat between ${npc} (a character in a language-learning game) and a Vietnamese learner. Topic: ${topic}.
Your job: find at most 2 things about the learner's REAL life that a friend would remember and ask about on another day: plans ("I'm going to Da Lat this weekend"), recent or upcoming events (exam, interview, trip, party, new job), people in their life, a new hobby, a strong feeling or preference.
Skip:
- Pretend role-play actions that only make sense inside the game scene (ordering a drink, asking the price, checking in a bag).
- Basic profile facts (name, hometown, job title) unless something new happened.
- Anything sensitive: health, money, religion, politics, romance details, contact info, addresses, passwords.
- Anything already known: ${known.length ? known.map((k) => `"${k}"`).join("; ") : "(nothing yet)"}.
- Anything the learner did not clearly say about themselves.
For each item return:
- "fact": English, second person, starting with "you". It will be read days later after "Last time you told me ...", so use reported (past) forms: "you were planning ...", "you were going to ...", "you had ... coming up", "you had just started ...", "you loved ...". Never "you have" / "you are" / "you go". Keep the specific details (who, where, what). Max 15 words. No final period.
  Good: "you had a job interview at a bank coming up", "you were going to Da Lat with your sister this weekend".
- "vi": the same fact in natural Vietnamese, starting with "bạn", keeping the details (e.g. "bạn sắp đi Đà Lạt với chị gái cuối tuần này"). Max 20 words.
- "ask": ONE short, friendly follow-up question in simple, grammatically correct A2 English to ask on another day, naming the specific thing with "your" where needed (good: "How did your interview at the bank go?", "How was your English exam?", "Did you enjoy Da Lat with your sister?"; bad: "How was exam?", "How was sister's birthday?"). Max 12 words.
If there is nothing worth remembering, return an empty list. Respond ONLY with JSON: {"memories": [{"fact": "...", "vi": "...", "ask": "..."}]}`;

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
      max_tokens: 300,
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          type: "object",
          properties: { memories: { type: "array", items: { type: "object", properties: { fact: { type: "string" }, vi: { type: "string" }, ask: { type: "string" } }, required: ["fact", "vi", "ask"] } } },
          required: ["memories"],
        },
      },
    });
    const j = extractJson((result as { response?: unknown }).response);
    const list = Array.isArray(j?.memories) ? (j!.memories as Record<string, unknown>[]) : [];
    const memories = list
      .slice(0, 2)
      .map((m) => ({
        fact: clean(m?.fact).replace(/[.!\s]+$/, ""),
        vi: clean(m?.vi).replace(/[.!\s]+$/, ""),
        ask: clean(m?.ask, 120),
      }))
      .filter((m) => /^you\b/i.test(m.fact) && m.ask.endsWith("?") && m.vi)
      .map((m) => ({ ...m, fact: m.fact.replace(/^you/i, "you") }))
      .filter((m) => !known.some((k) => sameFact(k, m.fact)));
    return NextResponse.json({ memories });
  } catch (error) {
    console.error("island-memory error:", error);
    return NextResponse.json({ memories: [], offline: true });
  }
}
