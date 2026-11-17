import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Chấm nhanh một câu trả lời trong Ao Phản Xạ: có đáp đúng ý / hợp ngữ cảnh không (không bắt khớp từng chữ).

interface Body {
  q?: string;
  answer?: string;
  samples?: string[];
  level?: string;
}

function extractJson(raw: unknown): { ok?: unknown; better?: unknown; note?: unknown; hasError?: unknown; fixed?: unknown } | null {
  if (raw && typeof raw === "object") return raw as never;
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
  const q = String(body.q || "").slice(0, 300);
  const answer = String(body.answer || "").slice(0, 400).trim();
  const samples = (Array.isArray(body.samples) ? body.samples : []).slice(0, 3).map((x) => String(x).slice(0, 200));
  const level = String(body.level || "A2").slice(0, 4);
  if (!q || !answer) return NextResponse.json({ error: "Missing q or answer" }, { status: 400 });

  const system = `You judge a Vietnamese English learner (CEFR ${level}) in a fast speaking-reflex game.
The learner heard: "${q}"
The learner answered (speech-to-text, may lack punctuation): "${answer}"
Example good answers: ${samples.map((x) => `"${x}"`).join(", ") || "(none)"}

"ok" = true if the answer is an understandable, appropriate reply in this situation, even if short or slightly imperfect. Different content from the examples is fine. "ok" = false if it is off-topic, not English, or so broken it would confuse a listener.
"better": one natural sentence the learner could say instead (keep their idea if it was appropriate). Max 15 words.
"hasError": true ONLY if the learner's answer contains a real grammar or word-choice mistake (e.g. missing "to be", wrong tense, missing article, wrong preposition). Different content from the examples is NOT a mistake. Being short is NOT a mistake. Never count capitalization, punctuation, or a misspelled Vietnamese name or place (speech-to-text mangles them).
"fixed": if hasError, the learner's OWN sentence with only the mistakes corrected (keep all their content and meaning; do not replace it with example content). Otherwise "".
"note": if hasError, a very short tip in Vietnamese (max 14 words) naming the mistake. Otherwise "".
Respond ONLY with JSON: {"ok": true, "better": "...", "hasError": false, "fixed": "", "note": ""}`;

  try {
    const { env } = await getCloudflareContext({ async: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ai = (env as any).AI;
    if (!ai) throw new Error("AI binding missing");
    const result = await ai.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [
        { role: "system", content: system },
        { role: "user", content: "Judge now. JSON only." },
      ],
      max_tokens: 200,
      temperature: 0.2,
    });
    const j = extractJson((result as { response?: unknown }).response);
    if (!j || typeof j.ok !== "boolean") throw new Error("Bad AI response");
    const hasError = j.hasError === true && !!String(j.fixed || "").trim();
    return NextResponse.json({ ok: j.ok, better: String(j.better || "").slice(0, 200), fixed: hasError ? String(j.fixed).trim().slice(0, 300) : "", note: hasError || !j.ok ? String(j.note || "").slice(0, 160) : "", ai: true });
  } catch (error) {
    console.error("island-reflex error:", error);
    return NextResponse.json({ ai: false });
  }
}
