"use client";

// Hiệu ứng âm thanh vui tai cho Chit Chat Island — tổng hợp bằng Web Audio, không cần file âm thanh.
// Dùng chung công tắc với cả web (localStorage "studyen-sound-enabled"); nhạc nền có công tắc riêng.
import type { NpcId } from "./curriculum";

const SOUND_KEY = "studyen-sound-enabled";
const MUSIC_KEY = "cci-music";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

export function soundOn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SOUND_KEY) !== "false";
  } catch {
    return true;
  }
}

export function setSoundOn(on: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, on ? "true" : "false");
  } catch {
    /* bỏ qua */
  }
  if (!on) stopMusic();
  notify();
}

interface ToneOpts {
  type?: OscillatorType;
  vol?: number;
  at?: number; // giây, tính từ bây giờ
  to?: number; // tần số trượt tới
  attack?: number;
  vibrato?: number; // Hz
  filter?: number; // lowpass
}

function tone(freq: number, dur: number, o: ToneOpts = {}) {
  const c = ac();
  if (!c || !master) return;
  const t0 = c.currentTime + (o.at || 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type || "sine";
  osc.frequency.setValueAtTime(freq, t0);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
  const vol = o.vol ?? 0.12;
  const atk = o.attack ?? 0.008;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + atk);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let node: AudioNode = osc;
  if (o.vibrato) {
    const lfo = c.createOscillator();
    const lg = c.createGain();
    lfo.frequency.value = o.vibrato;
    lg.gain.value = freq * 0.04;
    lfo.connect(lg);
    lg.connect(osc.frequency);
    lfo.start(t0);
    lfo.stop(t0 + dur + 0.05);
  }
  if (o.filter) {
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = o.filter;
    node.connect(f);
    node = f;
  }
  node.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur: number, o: { vol?: number; at?: number; from?: number; to?: number; q?: number } = {}) {
  const c = ac();
  if (!c || !master) return;
  const t0 = c.currentTime + (o.at || 0);
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.Q.value = o.q ?? 1.2;
  f.frequency.setValueAtTime(o.from ?? 800, t0);
  f.frequency.exponentialRampToValueAtTime(o.to ?? 3000, t0 + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(o.vol ?? 0.1, t0 + dur * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

/** Chuông (sine + bội âm) cho tiếng "ting". */
function bell(freq: number, at = 0, vol = 0.1, dur = 0.5) {
  tone(freq, dur, { at, vol });
  tone(freq * 2, dur * 0.6, { at, vol: vol * 0.35 });
  tone(freq * 3, dur * 0.35, { at, vol: vol * 0.15 });
}

const run = (fn: () => void) => {
  if (!soundOn()) return;
  try {
    fn();
  } catch {
    /* âm thanh không quan trọng bằng việc học */
  }
};

const NPC_VOICE: Record<NpcId, number> = { bo: 660, miso: 520, mallow: 820, pip: 600, kero: 300 };

export const sfx = {
  /** Bấm nút thường: tiếng "bóp" như bong bóng. */
  pop: () => run(() => tone(520, 0.09, { to: 980, vol: 0.09, type: "sine" })),
  /** Chạm ô chữ / lựa chọn: tiếng gõ gỗ. */
  tap: () => run(() => tone(880, 0.05, { to: 620, vol: 0.08, type: "triangle" })),
  /** Mở bảng / hộp thoại. */
  open: () => run(() => {
    tone(392, 0.12, { to: 784, vol: 0.08, type: "triangle" });
    tone(988, 0.12, { at: 0.07, vol: 0.05 });
  }),
  close: () => run(() => tone(700, 0.1, { to: 380, vol: 0.07, type: "triangle" })),
  /** Đúng: ting-ting. */
  correct: () => run(() => {
    bell(1318.5, 0, 0.09, 0.35);
    bell(1760, 0.09, 0.09, 0.5);
  }),
  /** Sai: "bùm-bụp" nhẹ nhàng, không làm nản. */
  wrong: () => run(() => {
    tone(330, 0.14, { type: "triangle", vol: 0.1, to: 300 });
    tone(247, 0.22, { type: "triangle", vol: 0.1, at: 0.13, to: 220 });
  }),
  /** Sao thứ i (0..2) hiện ra. */
  star: (i = 0) => run(() => {
    const base = [1046.5, 1318.5, 1568][Math.min(2, Math.max(0, i))];
    bell(base, 0, 0.08, 0.4);
    noise(0.25, { from: 4000, to: 9000, vol: 0.03, q: 4 });
  }),
  /** Hoàn thành bài / thắng vòng. */
  win: () => run(() => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.18, { at: i * 0.09, vol: 0.1, type: "triangle" }));
    [523.25, 659.25, 783.99].forEach((f) => tone(f, 0.7, { at: 0.38, vol: 0.06 }));
    bell(2093, 0.4, 0.05, 0.6);
  }),
  /** Lên cấp / mở khoá đồ mới trên đảo. */
  unlock: () => run(() => {
    [784, 988, 1175, 1568, 1976].forEach((f, i) => bell(f, i * 0.07, 0.06, 0.45));
    noise(0.6, { from: 3000, to: 10000, vol: 0.03, q: 3 });
  }),
  /** Tích tắc đồng hồ đếm ngược (urgent = 3 giây cuối). */
  tick: (urgent = false) => run(() => tone(urgent ? 1500 : 1100, 0.03, { type: "square", vol: urgent ? 0.05 : 0.025, filter: 3000 })),
  /** Hết giờ. */
  timeUp: () => run(() => tone(440, 0.45, { to: 180, type: "sawtooth", vol: 0.06, filter: 1200 })),
  /** Chuỗi đúng liên tiếp: càng dài càng cao. */
  combo: (n: number) => run(() => {
    const f = 660 * Math.pow(1.122, Math.min(n, 10));
    tone(f, 0.08, { type: "square", vol: 0.04, filter: 4000 });
    tone(f * 1.5, 0.12, { type: "square", vol: 0.04, at: 0.06, filter: 4000 });
  }),
  /** Nhận xu / XP. */
  coin: () => run(() => {
    tone(987.8, 0.07, { type: "square", vol: 0.04, filter: 5000 });
    tone(1318.5, 0.25, { type: "square", vol: 0.04, at: 0.07, filter: 5000 });
  }),
  /** Lật thẻ / chuyển bước. */
  flip: () => run(() => noise(0.16, { from: 600, to: 2600, vol: 0.06 })),
  whoosh: () => run(() => noise(0.3, { from: 300, to: 2000, vol: 0.05 })),
  /** Bật / tắt micro. */
  micOn: () => run(() => tone(660, 0.08, { to: 990, vol: 0.07 })),
  micOff: () => run(() => tone(990, 0.08, { to: 660, vol: 0.07 })),
  /** Cư dân "nói" kiểu líu lo (mỗi NPC một giọng). */
  chirp: (who: NpcId = "bo") => run(() => {
    const base = NPC_VOICE[who] || 600;
    const n = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) {
      const f = base * (0.85 + Math.random() * 0.4);
      tone(f, 0.06, { at: i * 0.075, type: "triangle", vol: 0.07, to: f * (Math.random() > 0.5 ? 1.15 : 0.9) });
    }
  }),
  /** Thả giống xuống nước. */
  splash: () => run(() => {
    noise(0.45, { from: 2500, to: 300, vol: 0.09, q: 0.8 });
    tone(520, 0.12, { at: 0.08, to: 300, vol: 0.05 });
    tone(760, 0.1, { at: 0.18, to: 420, vol: 0.04 });
  }),
  /** Cho ăn: lách cách hạt thức ăn. */
  feed: () => run(() => {
    for (let i = 0; i < 4; i++) tone(1200 + Math.random() * 600, 0.03, { at: i * 0.05, type: "triangle", vol: 0.05 });
  }),
  /** Tiếng các con vật trong vườn. */
  animal: (kind: "pig" | "dragon" | "buffalo") => run(() => {
    if (kind === "pig") {
      // ụt ịt
      tone(260, 0.12, { type: "sawtooth", vol: 0.08, to: 380, filter: 1400, vibrato: 30 });
      tone(240, 0.16, { type: "sawtooth", vol: 0.08, at: 0.16, to: 330, filter: 1400, vibrato: 30 });
    } else if (kind === "buffalo") {
      // ò... ò
      tone(150, 0.9, { type: "sawtooth", vol: 0.09, to: 115, filter: 700, vibrato: 5, attack: 0.08 });
    } else {
      // rồng con: gầm nhẹ + phụt lửa lấp lánh
      tone(110, 0.5, { type: "sawtooth", vol: 0.07, to: 220, filter: 900, vibrato: 18, attack: 0.04 });
      noise(0.55, { from: 400, to: 3500, vol: 0.06, at: 0.15 });
      bell(1568, 0.55, 0.04, 0.4);
    }
  }),
};

// ───────────── Nhạc nền nhẹ (ngũ cung, chơi ngẫu nhiên) ─────────────

let musicTimer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}
export function subscribeAudio(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function musicOn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(MUSIC_KEY) === "1";
  } catch {
    return false;
  }
}

const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];
const BASS = [130.81, 146.83, 174.61, 196];

export function startMusic() {
  if (musicTimer || !soundOn()) return;
  let step = 0;
  let chord = 0;
  musicTimer = setInterval(() => {
    if (!soundOn() || document.visibilityState === "hidden") return;
    try {
      if (step % 8 === 0) {
        chord = Math.floor(Math.random() * BASS.length);
        tone(BASS[chord], 1.6, { type: "triangle", vol: 0.035, attack: 0.05 });
      }
      if (Math.random() < 0.62) {
        const f = SCALE[Math.floor(Math.random() * SCALE.length)];
        tone(f, 0.55, { type: "sine", vol: 0.03, attack: 0.01 });
        tone(f * 2, 0.25, { type: "sine", vol: 0.008 });
      }
    } catch {
      /* bỏ qua */
    }
    step++;
  }, 300);
}

export function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
}

export function setMusicOn(on: boolean) {
  try {
    localStorage.setItem(MUSIC_KEY, on ? "1" : "0");
  } catch {
    /* bỏ qua */
  }
  if (on) startMusic();
  else stopMusic();
  notify();
}
