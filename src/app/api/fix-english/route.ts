import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const { env } = await getCloudflareContext({ async: true });

    const messages = [
      {
        role: "system",
        content: `You are a native English speaking coach helping Vietnamese learners improve their English communication.
Analyze the given English text and respond ONLY with valid JSON in this exact format:
{
  "is_correct": <true/false>,
  "naturalness_score": <1-10>,
  "issues": ["<issue1>", "<issue2>"],
  "corrected": "<corrected version>",
  "alternatives": ["<more natural way 1>", "<more natural way 2>", "<more natural way 3>"],
  "explanation": "<brief explanation in Vietnamese why natives say it differently>",
  "good_parts": "<what they got right>"
}
Be encouraging. Focus on making it sound natural, not just grammatically correct.`,
      },
      {
        role: "user",
        content: `Analyze this English: "${text}"`,
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (env.AI as any).run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages,
      max_tokens: 400,
    });

    const raw = (result as { response: string }).response || "";
    let parsed;
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    } catch {
      parsed = null;
    }

    if (!parsed) {
      parsed = {
        is_correct: true,
        naturalness_score: 7,
        issues: [],
        corrected: text,
        alternatives: [],
        explanation: "Câu của bạn trông ổn! Hãy tiếp tục luyện tập.",
        good_parts: "Good attempt!",
      };
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Fix english error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
