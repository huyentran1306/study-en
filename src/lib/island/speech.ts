"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NPCS, type NpcId } from "./curriculum";

// ───────────── Đọc (TTS bằng giọng có sẵn của trình duyệt) ─────────────

let cachedVoice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en"));
  const prefer = ["Samantha", "Google US English", "Microsoft Aria", "Microsoft Jenny", "Karen", "Daniel", "Google UK English Female"];
  cachedVoice =
    prefer.map((p) => voices.find((v) => v.name.includes(p))).find(Boolean) ||
    voices.find((v) => v.lang === "en-US") ||
    voices[0] ||
    null;
  return cachedVoice;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null;
    pickVoice();
  };
}

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Đọc một câu. speed: "slow" | "normal" | "fast". Trả về Promise khi đọc xong. */
export function speak(text: string, opts: { who?: NpcId | "you"; speed?: "slow" | "normal" | "fast" } = {}): Promise<void> {
  return new Promise((resolve) => {
    if (!canSpeak()) return resolve();
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice();
    if (v) u.voice = v;
    u.lang = v?.lang || "en-US";
    const npc = opts.who && opts.who !== "you" ? NPCS[opts.who] : NPCS.bo;
    const base = npc.rate;
    u.rate = opts.speed === "slow" ? base * 0.7 : opts.speed === "fast" ? base * 1.35 : base;
    u.pitch = npc.pitch;
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        resolve();
      }
    };
    u.onend = finish;
    u.onerror = finish;
    // Phòng trường hợp trình duyệt không bắn onend
    setTimeout(finish, Math.max(2500, text.length * 140));
    synth.speak(u);
  });
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}

// ───────────── Nghe (Web Speech API) ─────────────

type RecognitionCtor = new () => SpeechRecognition;

function getRecognition(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function useListen() {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognition | null>(null);
  const resolveRef = useRef<((text: string) => void) | null>(null);
  const finalRef = useRef("");

  useEffect(() => {
    setSupported(!!getRecognition());
    return () => recRef.current?.abort();
  }, []);

  /**
   * Bắt đầu nghe; Promise trả về câu nghe được khi người dùng ngừng nói.
   * onVoice: gọi một lần, ngay khi phát hiện người dùng bắt đầu nói (performance.now()) — để đo tốc độ phản xạ.
   */
  const listen = useCallback((opts: { onVoice?: (t: number) => void; onAudio?: () => void } = {}): Promise<string> => {
    const Ctor = getRecognition();
    if (!Ctor) return Promise.resolve("");
    stopSpeaking();
    recRef.current?.abort();
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    finalRef.current = "";
    setInterim("");
    setError(null);
    let voiced = false;
    const voice = () => {
      if (voiced) return;
      voiced = true;
      opts.onVoice?.(performance.now());
    };
    (rec as unknown as { onspeechstart: (() => void) | null }).onspeechstart = voice;
    (rec as unknown as { onaudiostart: (() => void) | null }).onaudiostart = () => opts.onAudio?.();
    rec.onresult = (e: SpeechRecognitionEvent) => {
      voice();
      let fin = "";
      let tmp = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) fin += r[0].transcript;
        else tmp += r[0].transcript;
      }
      if (fin) finalRef.current = fin;
      setInterim(fin || tmp);
    };
    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === "not-allowed") setError("Bạn chưa cho phép dùng micro. Hãy bật quyền micro cho trang này.");
      else if (e.error === "no-speech") setError("Mình chưa nghe thấy gì. Thử nói to và rõ hơn nhé.");
      else if (e.error !== "aborted") setError("Micro gặp lỗi: " + e.error);
    };
    rec.onend = () => {
      setListening(false);
      const text = finalRef.current || "";
      resolveRef.current?.(text);
      resolveRef.current = null;
    };
    recRef.current = rec;
    setListening(true);
    return new Promise<string>((resolve) => {
      resolveRef.current = resolve;
      try {
        rec.start();
      } catch {
        setListening(false);
        resolve("");
      }
    });
  }, []);

  const stop = useCallback(() => recRef.current?.stop(), []);
  /** Huỷ ngay, không chờ kết quả (Promise trả về chuỗi rỗng hoặc phần đã nghe). */
  const abort = useCallback(() => recRef.current?.abort(), []);

  return { supported, listening, interim, error, listen, stop, abort };
}

// ───────────── Chấm câu nói ─────────────

const CONTRACTIONS: Record<string, string> = {
  "i'm": "i am", "it's": "it is", "that's": "that is", "i've": "i have", "i'd": "i would", "don't": "do not",
  "there's": "there is", "let's": "let us", "what's": "what is", "how's": "how is", "here's": "here is",
  "you're": "you are", "we'll": "we will", "it'll": "it will", "can't": "cannot", "didn't": "did not",
  "they're": "they are", "that'll": "that will", "we'd": "we would", "flight's": "flight has", "i'll": "i will",
  "won't": "will not", "isn't": "is not", "doesn't": "does not", "you'd": "you would", "machine's": "machine is",
};

/** Từ riêng (tên, quê của người học) được bỏ qua khi chấm vì máy nhận giọng tiếng Anh hay nghe sai. */
let lenient = new Set<string>();
export function setLenientWords(words: string[]) {
  lenient = new Set(words.flatMap((w) => normWords(w)));
}

export function normWords(s: string): string[] {
  const cleaned = s
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”"]/g, " ")
    .replace(/[^a-z0-9'\s-]/g, " ")
    .replace(/-/g, " ");
  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((w) => (CONTRACTIONS[w] ? CONTRACTIONS[w].split(" ") : [w.replace(/'/g, "")]));
}

/** So câu nói với câu mẫu: % từ của câu mẫu xuất hiện trong câu nói, kèm đánh dấu từng từ. */
export function scoreSpeech(said: string, target: string): { score: number; marks: { word: string; ok: boolean }[] } {
  const saidBag = new Map<string, number>();
  for (const w of normWords(said)) saidBag.set(w, (saidBag.get(w) || 0) + 1);
  const display = target.split(/\s+/).filter(Boolean);
  let hit = 0;
  let total = 0;
  const marks = display.map((word) => {
    const parts = normWords(word);
    if (parts.length === 0) return { word, ok: true };
    let ok = true;
    for (const p of parts) {
      total++;
      const n = saidBag.get(p) || 0;
      if (lenient.has(p)) hit++;
      else if (n > 0) {
        saidBag.set(p, n - 1);
        hit++;
      } else ok = false;
    }
    return { word, ok };
  });
  return { score: total ? hit / total : 0, marks };
}

/** Xin quyền micro trước (true = dùng được). Giúp phát hiện sớm máy không có / chặn micro. */
export async function ensureMic(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return false;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    return false;
  }
}
