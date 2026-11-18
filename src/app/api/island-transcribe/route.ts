import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Nhận giọng phía máy chủ bằng Whisper (ổn định hơn nhận giọng của trình duyệt, nhất là iPhone và giọng Việt).
// Gửi thẳng tệp âm thanh trong body (audio/webm, audio/mp4, audio/mpeg...). Trả về chữ + mốc thời gian từng từ.

const MAX_BYTES = 4 * 1024 * 1024;

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export async function POST(request: NextRequest) {
  const type = request.headers.get("content-type") || "";
  if (!/^(audio|video)\//.test(type) && type !== "application/octet-stream") return NextResponse.json({ error: "Send audio in the body" }, { status: 415 });
  const buf = await request.arrayBuffer();
  if (!buf.byteLength) return NextResponse.json({ error: "Empty audio" }, { status: 400 });
  if (buf.byteLength > MAX_BYTES) return NextResponse.json({ error: "Audio too long" }, { status: 413 });
  try {
    const { env } = await getCloudflareContext({ async: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ai = (env as any).AI;
    if (!ai) throw new Error("AI binding missing");
    const r = (await ai.run("@cf/openai/whisper-large-v3-turbo", { audio: toBase64(buf), language: "en", vad_filter: true })) as {
      text?: string;
      segments?: { start: number; end: number; words?: { word: string; start: number; end: number }[] }[];
      transcription_info?: { duration?: number };
    };
    const words = (r.segments || []).flatMap((s) => s.words || []).map((w) => ({ w: String(w.word).trim(), s: Math.round(w.start * 100) / 100, e: Math.round(w.end * 100) / 100 }));
    const text = String(r.text || "").replace(/\s+/g, " ").trim();
    return NextResponse.json({ text, words, duration: r.transcription_info?.duration ?? (words.length ? words[words.length - 1].e : 0) });
  } catch (error) {
    console.error("island-transcribe error:", error);
    return NextResponse.json({ text: "", words: [], duration: 0, offline: true });
  }
}
