import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { scenario, history, userMessage, language = "en" } = await request.json();
    const { env } = await getCloudflareContext({ async: true });

    const historyText = history
      .slice(-6) // last 3 exchanges
      .map((m: { sender: string; text: string }) => `${m.sender === "npc" ? "NPC" : "Player"}: ${m.text}`)
      .join("\n");

    const systemPrompt = language === "zh"
      ? `你是${scenario.npc_name}，${scenario.npc_role}。场景：${scenario.setting}。
用中文自然地回应。回应要简短（1-2句）。保持角色。根据对话内容给出相关回应。`
      : `You are ${scenario.npc_name}, a ${scenario.npc_role}. Setting: ${scenario.setting}.
Respond naturally in English. Keep responses SHORT (1-2 sentences). Stay in character.
Give contextually relevant responses. Be helpful in this specific scenario.`;

    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Conversation so far:\n${historyText}\n\nPlayer just said: "${userMessage}"\n\nRespond as ${scenario.npc_name}:`,
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (env.AI as any).run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages,
      max_tokens: 120,
    });

    const reply = (result as { response: string }).response?.trim() || "That's interesting! Tell me more.";

    return NextResponse.json({ message: reply });
  } catch (error) {
    console.error("NPC response error:", error);
    return NextResponse.json({ message: "That's great! Tell me more." });
  }
}
