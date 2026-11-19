"use client";

// Giọng nói "thật" cho đảo: ghi âm (MediaRecorder) → Whisper phía máy chủ, và giọng đọc AI riêng cho từng cư dân.
// Dùng cho Gọi điện, Gương thời gian, Phòng nghe, Nói đuổi. Không có mic / mạng thì các trang tự lùi về cách cũ.
import type { NpcId } from "./curriculum";
import { reportSpoken, speak, stopSpeaking } from "./speech";

/** Giọng Aura-2 của từng cư dân. */
export const NPC_VOICE: Record<NpcId | "you", string> = { bo: "asteria", miso: "arcas", mallow: "luna", pip: "orion", kero: "atlas", you: "athena" };
/** Giọng để luyện nghe nhiều vùng. */
export const ACCENTS = [
  { id: "us", vi: "Mỹ", voices: ["asteria", "orion", "luna", "arcas"] },
  { id: "uk", vi: "Anh", voices: ["draco", "pandora"] },
  { id: "au", vi: "Úc", voices: ["hyperion", "theia"] },
] as const;
export type AccentId = (typeof ACCENTS)[number]["id"];

export function ttsUrl(text: string, voice: string): string {
  return `/api/island-tts?v=${encodeURIComponent(voice)}&t=${encodeURIComponent(text.replace(/\s+/g, " ").trim().slice(0, 400))}`;
}

let current: HTMLAudioElement | null = null;
const blobs = new Map<string, string>();

/** Đọc bằng giọng AI. rate 0.6..1.4. Lỗi mạng thì đọc bằng giọng của trình duyệt. Promise xong khi đọc hết (hoặc bị dừng). */
export async function playVoice(text: string, voice: string, opts: { rate?: number; fallbackWho?: NpcId | "you" } = {}): Promise<void> {
  stopVoice();
  const url = ttsUrl(text, voice);
  try {
    let src = blobs.get(url);
    if (!src) {
      const res = await fetch(url);
      if (!res.ok) throw new Error("tts " + res.status);
      src = URL.createObjectURL(await res.blob());
      if (blobs.size > 60) {
        const [k, v] = blobs.entries().next().value as [string, string];
        URL.revokeObjectURL(v);
        blobs.delete(k);
      }
      blobs.set(url, src);
    }
    const a = new Audio(src);
    a.playbackRate = opts.rate || 1;
    // Giữ cao độ khi đổi tốc độ (đọc chậm không bị trầm giọng).
    (a as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true;
    current = a;
    await new Promise<void>((resolve) => {
      a.onended = () => resolve();
      a.onerror = () => resolve();
      a.onpause = () => resolve();
      a.play().catch(() => resolve());
    });
  } catch {
    await speak(text, { who: opts.fallbackWho, speed: opts.rate && opts.rate < 0.9 ? "slow" : opts.rate && opts.rate > 1.1 ? "fast" : "normal" });
  } finally {
    if (current && current.ended) current = null;
  }
}

export function stopVoice() {
  if (current) {
    current.pause();
    current = null;
  }
  stopSpeaking();
}

export function isVoicePlaying(): boolean {
  return !!current && !current.paused && !current.ended;
}

// ───────────── Ghi âm ─────────────

export function canRecord(): boolean {
  return typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";
}

function pickMime(): string {
  const list = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return list.find((m) => MediaRecorder.isTypeSupported?.(m)) || "";
}

export interface Recording {
  blob: Blob;
  ms: number;
}

/** Bắt đầu ghi âm. Gọi stop() để lấy âm thanh. maxMs: tự dừng. */
export async function startRecording(maxMs = 60_000): Promise<{ stop: () => Promise<Recording>; cancel: () => void; level: () => number }> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const mime = pickMime();
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const t0 = performance.now();
  rec.start(250);
  // Đo độ to để vẽ sóng âm.
  let analyser: AnalyserNode | null = null;
  let actx: AudioContext | null = null;
  try {
    actx = new AudioContext();
    analyser = actx.createAnalyser();
    analyser.fftSize = 512;
    actx.createMediaStreamSource(stream).connect(analyser);
  } catch {
    analyser = null;
  }
  const buf = new Uint8Array(256);
  const level = () => {
    if (!analyser) return 0;
    analyser.getByteTimeDomainData(buf);
    let peak = 0;
    for (const v of buf) peak = Math.max(peak, Math.abs(v - 128));
    return Math.min(1, peak / 64);
  };
  let done = false;
  const cleanup = () => {
    done = true;
    stream.getTracks().forEach((t) => t.stop());
    actx?.close().catch(() => {});
  };
  let timer: ReturnType<typeof setTimeout> | null = null;
  const stop = () =>
    new Promise<Recording>((resolve) => {
      if (timer) clearTimeout(timer);
      if (done || rec.state === "inactive") {
        cleanup();
        return resolve({ blob: new Blob(chunks, { type: rec.mimeType || mime || "audio/webm" }), ms: performance.now() - t0 });
      }
      rec.onstop = () => {
        cleanup();
        resolve({ blob: new Blob(chunks, { type: rec.mimeType || mime || "audio/webm" }), ms: performance.now() - t0 });
      };
      rec.stop();
    });
  timer = setTimeout(() => void stop(), maxMs);
  return {
    stop,
    cancel: () => {
      if (timer) clearTimeout(timer);
      try {
        rec.stop();
      } catch {
        /* đã dừng */
      }
      cleanup();
    },
    level,
  };
}

export interface Transcript {
  text: string;
  words: { w: string; s: number; e: number }[];
  duration: number;
  offline?: boolean;
}

export async function transcribe(blob: Blob): Promise<Transcript> {
  try {
    const res = await fetch("/api/island-transcribe", { method: "POST", headers: { "Content-Type": (blob.type || "audio/webm").split(";")[0] }, body: blob });
    if (!res.ok) throw new Error(String(res.status));
    const t = (await res.json()) as Transcript;
    const span = t.words.length >= 2 ? t.words[t.words.length - 1].e - t.words[0].s : t.duration;
    reportSpoken(t.text || "", span);
    return t;
  } catch {
    return { text: "", words: [], duration: 0, offline: true };
  }
}

// ───────────── Số liệu nói (cho Gương thời gian, Gọi điện) ─────────────

const FILLER_RE = /\b(um+|uh+|er+|erm|hmm+|you know|i mean|like)\b/gi;

export interface SpeechStats {
  words: number;
  wpm: number;
  /** Số chỗ ngừng dài hơn 0.7 giây giữa hai từ. */
  pauses: number;
  fillers: number;
  /** Số từ trung bình mỗi câu. */
  sentenceLen: number;
  /** Các thì / cấu trúc đã dùng (đếm thô). */
  tenses: string[];
}

export function speechStats(t: Transcript): SpeechStats {
  const text = t.text;
  const words = text.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w));
  const spoken = t.words.length >= 2 ? Math.max(0.5, t.words[t.words.length - 1].e - t.words[0].s) : t.duration;
  let pauses = 0;
  for (let i = 1; i < t.words.length; i++) if (t.words[i].s - t.words[i - 1].e > 0.7) pauses++;
  const sentences = text.split(/[.!?]+/).map((x) => x.trim()).filter(Boolean);
  const low = ` ${text.toLowerCase().replace(/[^a-z' ]/g, " ")} `;
  const tenses: string[] = [];
  if (/\b(am|is|are|work|live|like|love|have|go)\b/.test(low)) tenses.push("Hiện tại đơn");
  if (/\b(was|were|went|did|had|\w+ed)\b/.test(low)) tenses.push("Quá khứ");
  if (/\b(will|going to|'ll)\b/.test(low)) tenses.push("Tương lai");
  if (/\b(have|has|'ve) (been|\w+ed|done|gone|seen|made|met)\b/.test(low)) tenses.push("Hiện tại hoàn thành");
  if (/\b(am|is|are|was|were|'m|'re|'s) \w+ing\b/.test(low)) tenses.push("Tiếp diễn");
  if (/\b(because|so|but|although|when|if)\b/.test(low)) tenses.push("Câu nối (because, so, but…)");
  return {
    words: words.length,
    wpm: spoken > 0 ? Math.round((words.length / spoken) * 60) : 0,
    pauses,
    fillers: (text.match(FILLER_RE) || []).length,
    sentenceLen: sentences.length ? Math.round((words.length / sentences.length) * 10) / 10 : words.length,
    tenses,
  };
}
