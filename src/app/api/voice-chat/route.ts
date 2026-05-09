import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SYSTEM_PROMPTS: Record<string, string> = {
  partner: `You are a friendly English conversation partner. Keep responses SHORT (2-3 sentences max). 
Be natural, casual, and encouraging. Occasionally fix grammar mistakes subtly by rephrasing correctly.
Never mention you are an AI. Just have a genuine conversation.`,
  interviewer: `You are a professional job interviewer. Ask follow-up questions based on the candidate's answers.
Keep responses SHORT (2-3 sentences). Use standard interview questions. Be professional but friendly.`,
  teacher: `You are an encouraging English teacher. Keep responses SHORT (2-3 sentences).
Point out 1 small grammar/vocabulary improvement per response, then continue the conversation naturally.`,
  support: `You are a customer support agent at a tech company. Handle common support scenarios naturally.
Keep responses SHORT (2-3 sentences). Be polite and solution-focused.`,
  barista: `You are a barista at a coffee shop. Stay in character. Take orders, answer questions about menu items.
Keep responses SHORT (1-2 sentences). Be friendly and upbeat.`,
  colleague: `You are a friendly work colleague making small talk. Keep responses SHORT (2-3 sentences).
Talk about work life, weekend plans, current projects. Be natural and conversational.`,
};

export async function POST(request: NextRequest) {
  try {
    const { messages, role = "partner", language = "en" } = await request.json();
    const { env } = await getCloudflareContext({ async: true });

    const systemPrompt = SYSTEM_PROMPTS[role] || SYSTEM_PROMPTS.partner;

    const aiMessages = [
      { role: "system", content: `${systemPrompt}\nRespond in ${language === "en" ? "English" : "English (keep it simple for learners)"}.` },
      ...messages,
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (env.AI as any).run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: aiMessages,
      max_tokens: 150,
      stream: true,
    });

    return new Response(response as BodyInit, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Voice chat error:", error);
    return new Response(JSON.stringify({ error: "Chat failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
