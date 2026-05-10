import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { transcript, durationSeconds = 30, topic } = await request.json();
    const { env } = await getCloudflareContext({ async: true });

    const words = transcript.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const wpm = Math.round((wordCount / durationSeconds) * 60);

    const messages = [
      {
        role: "system",
        content: `You are an English speaking coach. Evaluate a student's speaking performance.
Respond ONLY with valid JSON:
{
  "fluency_score": <0-100>,
  "accuracy_score": <0-100>,
  "vocabulary_score": <0-100>,
  "overall_score": <0-100>,
  "strong_words": ["<good vocabulary word used>"],
  "filler_words": ["<filler words detected like um, uh, like>"],
  "feedback": "<2-3 sentences of specific encouraging feedback in Vietnamese>",
  "next_tip": "<one specific tip to improve>"
}`,
      },
      {
        role: "user",
        content: `Topic: "${topic || "free speaking"}"\nStudent spoke for ${durationSeconds} seconds and said:\n"${transcript}"\nWPM: ${wpm}`,
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (env.AI as any).run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages,
      max_tokens: 350,
    });

    const raw = (result as { response: string }).response || "";
    let parsed;
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    } catch {
      parsed = null;
    }

    const baseScore = Math.min(100, Math.max(20, wpm > 80 ? 75 : wpm > 50 ? 60 : 45));
    if (!parsed) {
      parsed = {
        fluency_score: baseScore,
        accuracy_score: baseScore,
        vocabulary_score: baseScore,
        overall_score: baseScore,
        strong_words: [],
        filler_words: [],
        feedback: `Bạn nói được ${wordCount} từ trong ${durationSeconds} giây (${wpm} từ/phút). Tiếp tục luyện tập nhé!`,
        next_tip: "Hãy cố gắng nói chậm và rõ ràng hơn.",
      };
    }

    return NextResponse.json({
      ...parsed,
      word_count: wordCount,
      wpm,
      duration_seconds: durationSeconds,
    });
  } catch (error) {
    console.error("Speed speaking error:", error);
    return NextResponse.json({ error: "Scoring failed" }, { status: 500 });
  }
}
