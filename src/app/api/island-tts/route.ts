import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Giọng đọc cho cư dân đảo (Deepgram Aura-2 trên Workers AI). Mỗi cư dân một giọng; có giọng Anh, Úc để luyện nghe.
// Câu giống nhau + giọng giống nhau => lấy từ cache của Cloudflare, khỏi gọi AI lại (rẻ và nhanh hơn).

const SPEAKERS = ["asteria", "luna", "athena", "orion", "arcas", "apollo", "atlas", "draco", "pandora", "hyperion", "theia"] as const;

export async function GET(request: NextRequest) {
  const u = new URL(request.url);
  const text = (u.searchParams.get("t") || "").replace(/\s+/g, " ").trim().slice(0, 400);
  const sp = u.searchParams.get("v") || "asteria";
  const speaker = (SPEAKERS as readonly string[]).includes(sp) ? sp : "asteria";
  if (!text) return new Response("Missing text", { status: 400 });

  // Khoá cache chuẩn hoá (bỏ tham số lạ) để câu lặp lại luôn trúng cache.
  const key = new Request(`${u.origin}/api/island-tts?v=${speaker}&t=${encodeURIComponent(text)}`);
  const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;
  try {
    const hit = await cache?.match(key);
    if (hit) return hit;
  } catch {
    /* không có cache (dev) */
  }
  try {
    const { env, ctx } = await getCloudflareContext({ async: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const audio = await (env as any).AI.run("@cf/deepgram/aura-2-en", { text, speaker, encoding: "mp3" }, { returnRawResponse: false });
    const body = audio instanceof ReadableStream ? await new Response(audio).arrayBuffer() : (audio as ArrayBuffer);
    const res = new Response(body, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=2592000, immutable" } });
    if (cache) ctx.waitUntil(cache.put(key, res.clone()).catch(() => {}));
    return res;
  } catch (error) {
    console.error("island-tts error:", error);
    return new Response("TTS failed", { status: 503 });
  }
}
