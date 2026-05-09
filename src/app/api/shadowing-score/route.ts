import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { original, transcript } = await request.json();
    const { env } = await getCloudflareContext({ async: true });

    const messages = [
      {
        role: "system",
        content: `You are a pronunciation and speaking coach. Compare the original sentence with what the student said and provide detailed feedback.
Respond ONLY with valid JSON in this exact format:
{
  "similarity_score": <0-100>,
  "pronunciation_score": <0-100>,
  "feedback": "<1-2 sentences of specific feedback>",
  "missed_words": ["<word1>", "<word2>"],
  "good_job": "<what they did well>"
}`,
      },
      {
        role: "user",
        content: `Original sentence: "${original}"\nStudent said: "${transcript}"\n\nProvide pronunciation feedback:`,
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (env.AI as any).run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages,
      max_tokens: 300,
    });

    const text = (result as { response: string }).response || "";

    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      parsed = null;
    }

    if (!parsed) {
      // Fallback: basic similarity calculation
      const origWords = original.toLowerCase().split(/\s+/);
      const transWords = transcript.toLowerCase().split(/\s+/);
      const matches = origWords.filter((w: string) => transWords.includes(w)).length;
      const similarity = Math.round((matches / origWords.length) * 100);

      parsed = {
        similarity_score: similarity,
        pronunciation_score: Math.max(40, similarity - 10),
        feedback: similarity > 70 ? "Good job! Keep practicing for more fluency." : "Try again, focus on each word clearly.",
        missed_words: origWords.filter((w: string) => !transWords.includes(w)).slice(0, 3),
        good_job: "You attempted the sentence, which is great practice!",
      };
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Shadowing score error:", error);
    return NextResponse.json({
      similarity_score: 50,
      pronunciation_score: 50,
      feedback: "Keep practicing! Try speaking more clearly and slowly.",
      missed_words: [],
      good_job: "You attempted the sentence!",
    });
  }
}
