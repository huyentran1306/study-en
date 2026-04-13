import { NextRequest, NextResponse } from "next/server";
import { openai, AI_ROLES, AIRole } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const { messages, role } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      // Return a simulated response when no API key is configured
      return NextResponse.json({
        message: getSimulatedResponse(role, messages),
      });
    }

    const aiRole = AI_ROLES[role as AIRole] || AI_ROLES.partner;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: aiRole.systemPrompt },
        ...messages.map((msg: { role: string; content: string }) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return NextResponse.json({
      message: completion.choices[0]?.message?.content || "I couldn't generate a response. Please try again.",
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}

function getSimulatedResponse(role: string, messages: { role: string; content: string }[]): string {
  const lastMessage = messages[messages.length - 1]?.content || "";

  const responses: Record<string, string[]> = {
    partner: [
      `That's a great point! I'd love to hear more about that. By the way, you could also say "${lastMessage.slice(0, 20)}..." in a more natural way. Would you like some suggestions?`,
      "Interesting! Your English is improving. Let me suggest a small improvement: try using more connecting words like 'however', 'moreover', or 'furthermore' to make your speech flow better.",
      "Great job expressing yourself! One small tip: native speakers often use contractions in casual speech. For example, 'I am' becomes 'I'm'. Keep practicing!",
    ],
    interviewer: [
      "Thank you for your answer. That was a solid response. For improvement, try to structure your answers using the STAR method: Situation, Task, Action, Result. Let me ask you another question: What are your greatest strengths?",
      "Good answer! I'd suggest being more specific with examples. Can you tell me about a time when you faced a challenging situation at work and how you handled it?",
      "Nice response. Remember to maintain eye contact and speak confidently. Here's your next question: Where do you see yourself in five years?",
    ],
    support: [
      "Welcome! Thank you for calling our support line. How may I assist you today? Remember, when speaking with support, it's helpful to clearly state your issue. For example: 'I'd like to inquire about...' or 'I'm having trouble with...'",
      "I understand your concern. Let me help you with that. In customer service situations, you can use phrases like 'Could you please...', 'I'd appreciate if...', or 'Would it be possible to...'",
      "Thank you for your patience. Let me look into that for you. A useful phrase to remember: 'I'd like to follow up on...' is great for checking on previous requests.",
    ],
  };

  const roleResponses = responses[role] || responses.partner;
  return roleResponses[Math.floor(Math.random() * roleResponses.length)];
}
