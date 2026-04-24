import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

// Prevent Next.js from pre-rendering this route during build
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      // Return simulated feedback when no API key
      return NextResponse.json({
        feedback: getSimulatedFeedback(text),
      });
    }

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an English speaking coach. Analyze the following spoken text and provide feedback in JSON format with these fields:
- pronunciation_score (1-10): How clear and correct the pronunciation likely is
- grammar_score (1-10): Grammar correctness  
- fluency_score (1-10): How natural and fluent the speech is
- overall_score (1-10): Overall speaking score
- corrections: Array of {original, corrected, explanation} for any errors
- tips: Array of strings with improvement tips
- improved_version: The text rewritten in better English

Be encouraging but honest. Respond ONLY with valid JSON.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      max_tokens: 800,
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content || "{}";
    let feedback;
    try {
      feedback = JSON.parse(content);
    } catch {
      feedback = { raw: content };
    }

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Speech API error:", error);
    return NextResponse.json(
      { error: "Failed to analyze speech" },
      { status: 500 }
    );
  }
}

function getSimulatedFeedback(text: string) {
  const wordCount = text.split(/\s+/).length;
  const hasCapital = /^[A-Z]/.test(text);
  const hasPeriod = /[.!?]$/.test(text.trim());

  let grammarScore = 7;
  if (!hasCapital) grammarScore -= 1;
  if (!hasPeriod) grammarScore -= 1;
  if (wordCount < 3) grammarScore -= 1;

  return {
    pronunciation_score: Math.min(10, Math.max(5, 6 + Math.floor(wordCount / 5))),
    grammar_score: grammarScore,
    fluency_score: Math.min(10, Math.max(5, 5 + Math.floor(wordCount / 4))),
    overall_score: Math.min(10, Math.max(5, Math.floor((grammarScore + 6 + 6) / 3))),
    corrections: !hasCapital
      ? [
          {
            original: text.slice(0, 1),
            corrected: text.slice(0, 1).toUpperCase(),
            explanation: "Sentences should start with a capital letter.",
          },
        ]
      : [],
    tips: [
      "Try speaking a bit more slowly for clearer pronunciation.",
      "Use connecting words like 'however', 'therefore', 'additionally'.",
      "Practice speaking in complete sentences for better fluency.",
    ],
    improved_version:
      text.charAt(0).toUpperCase() +
      text.slice(1) +
      (hasPeriod ? "" : "."),
  };
}
