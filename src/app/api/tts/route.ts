import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { text, lang = "en" } = await request.json();
    if (!text) {
      return new Response(JSON.stringify({ error: "No text provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { env } = await getCloudflareContext({ async: true });

    // Use Deepgram Aura-2 for English, MeloTTS for others
    const model = lang === "zh" ? "@cf/myshell-ai/melotts" : "@cf/deepgram/aura-2-en";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (env.AI as any).run(model, { text });

    return new Response(response as BodyInit, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return new Response(JSON.stringify({ error: "TTS failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
