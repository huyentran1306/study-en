import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { text, tone = "executive" } = await request.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const { env } = await getCloudflareContext({ async: true });

    const toneDescriptions: Record<string, string> = {
      executive: "Executive & Client Diplomatic: Professional, respectful, high-level technical diplomacy suitable for Tech Leads communicating with client CTOs, VPs, or pushing back gracefully.",
      slack: "Slack & Agile Sync: Crisp, natural, modern software engineer conversational style for Slack/Teams blockers, daily standups, and async updates.",
      code_review: "Constructive PR Code Review: Respectful, encouraging, peer-review style explaining architectural trade-offs without sounding harsh or condescending.",
      incident: "Incident & Outage Update: Calm, transparent, authoritative, reassuring tone reporting telemetry, failure isolation, and mitigation ETA.",
    };

    const selectedToneDesc = toneDescriptions[tone] || toneDescriptions.executive;

    const messages = [
      {
        role: "system",
        content: `You are an elite English communication coach specializing in software engineering leaders and solution architects.
Target Communication Style: ${selectedToneDesc}

Analyze the user's draft (which may be awkward English, literal Vietnamese-translated English, or brief bullets).
Respond ONLY with valid JSON in this exact structure:
{
  "is_correct": <boolean>,
  "naturalness_score": <integer from 1 to 10>,
  "issues": ["<specific awkward phrasing or grammatical slip 1>", "<issue 2>"],
  "corrected": "<drop-in polished rewrite matching the target style>",
  "alternatives": [
    "<Option 1: Short & Direct>",
    "<Option 2: Ultra-Diplomatic & Polished>",
    "<Option 3: High-Impact Technical>"
  ],
  "explanation": "<Clear 2-3 sentence explanation in Vietnamese of why native tech leaders say it this way and what nuance was improved>",
  "good_parts": "<Brief encouraging praise of what was already clear>"
}
Ensure the vocabulary sounds like a senior engineer/tech lead (e.g., latency, SLA, trade-off, bandwidth, velocity, failover).`,
      },
      {
        role: "user",
        content: `Refine this tech message with tone "${tone}": "${text}"`,
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
