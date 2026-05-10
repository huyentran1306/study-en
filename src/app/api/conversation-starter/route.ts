import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { situation, context: ctx = "" } = await request.json();
    const { env } = await getCloudflareContext({ async: true });

    const messages = [
      {
        role: "system",
        content: `You are an English conversation coach helping Vietnamese learners start and maintain conversations in English.
Respond ONLY with valid JSON:
{
  "openers": [
    { "phrase": "<opening line>", "vn": "<Vietnamese translation>", "tone": "formal|casual|friendly" },
    { "phrase": "<opening line 2>", "vn": "<Vietnamese translation>", "tone": "formal|casual|friendly" },
    { "phrase": "<opening line 3>", "vn": "<Vietnamese translation>", "tone": "formal|casual|friendly" }
  ],
  "follow_ups": [
    "<natural follow-up question 1>",
    "<natural follow-up question 2>",
    "<natural follow-up question 3>"
  ],
  "tips": "<brief tip in Vietnamese on how to keep this conversation going>",
  "common_responses": ["<likely response 1>", "<likely response 2>"]
}
Keep phrases natural, not textbook-stiff.`,
      },
      {
        role: "user",
        content: `Situation: ${situation}${ctx ? `\nAdditional context: ${ctx}` : ""}`,
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (env.AI as any).run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages,
      max_tokens: 500,
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
        openers: [
          { phrase: "Hey! How's it going?", vn: "Này! Bạn khỏe không?", tone: "casual" },
          { phrase: "Hi! Have you worked here long?", vn: "Xin chào! Bạn làm ở đây lâu chưa?", tone: "friendly" },
        ],
        follow_ups: ["What do you think about...?", "Have you tried...?", "By the way, do you...?"],
        tips: "Hãy lắng nghe câu trả lời và hỏi thêm về những gì họ chia sẻ.",
        common_responses: ["Oh really? That's interesting!", "I know right!"],
      };
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Conversation starter error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
