import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// "Hồ sơ của tôi": người học gõ tiếng Việt hoặc tiếng Anh, AI chuyển thành dạng dùng được trong câu tiếng Anh.

interface Body {
  name?: string;
  hometown?: string;
  job?: string;
  hobby?: string;
}

const clean = (v: unknown, max = 60) => String(v || "").replace(/["\\\u0000-\u001f<>{}]/g, "").replace(/\s+/g, " ").trim().slice(0, max);

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
  const name = clean(body.name, 40);
  const hometown = clean(body.hometown, 40);
  const job = clean(body.job, 50);
  const hobby = clean(body.hobby, 50);
  if (!name && !hometown && !job && !hobby) return NextResponse.json({ error: "Empty profile" }, { status: 400 });
  const raw = { name, hometown, job, jobVi: job, hobby, hobbyVi: hobby };

  const system = `A Vietnamese learner of English filled in a small profile (in Vietnamese or English). Convert it so each value can be dropped into an English sentence.
Input: ${JSON.stringify({ hometown, job, hobby })}
Return JSON with exactly these keys:
- "hometown": the SAME place the learner wrote, spelled the way it is written in English: only remove Vietnamese diacritics or translate generic words ("Sài Gòn" -> "Saigon", "Đà Nẵng" -> "Da Nang", "Hà Nội" -> "Hanoi", "Thành phố Hồ Chí Minh" -> "Ho Chi Minh City"). Never swap it for a different name. Empty string if input is empty.
- "job": the job as a lowercase English noun phrase WITHOUT an article, fitting "I work as a/an ___" (e.g. "software tester", "accountant", "university student").
- "jobVi": the same job in natural Vietnamese, lowercase (e.g. "kiểm thử phần mềm").
- "hobby": the hobby as a lowercase English -ing phrase fitting "My hobby is ___" (e.g. "playing badminton", "reading books").
- "hobbyVi": the same hobby in natural Vietnamese, lowercase, fitting "Sở thích của mình là ___" (e.g. "chơi cầu lông").
Keep the learner's meaning. If a field is empty, return an empty string for it. Respond ONLY with JSON.`;

  try {
    const { env } = await getCloudflareContext({ async: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ai = (env as any).AI;
    if (!ai) throw new Error("AI binding missing");
    const result = await ai.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [
        { role: "system", content: system },
        { role: "user", content: "Convert now. JSON only." },
      ],
      max_tokens: 200,
      temperature: 0.1,
    });
    const j = extractJson((result as { response?: unknown }).response);
    if (!j) throw new Error("Bad AI response");
    const pick = (k: string, fallback: string) => (fallback ? clean(j[k], 50) || fallback : "");
    return NextResponse.json({
      profile: { name, hometown: pick("hometown", hometown), job: pick("job", job).replace(/^(a|an|the)\s+/i, ""), jobVi: pick("jobVi", job), hobby: pick("hobby", hobby), hobbyVi: pick("hobbyVi", hobby) },
      ai: true,
    });
  } catch (error) {
    console.error("island-profile error:", error);
    return NextResponse.json({ profile: raw, ai: false });
  }
}
