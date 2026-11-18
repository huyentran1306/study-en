"use client";

// Tiếng ồn nền tự tạo (không cần tệp âm thanh) cho Phòng nghe: quán cà phê, sân bay.
export type NoiseKind = "off" | "cafe" | "airport";

let ctx: AudioContext | null = null;
let nodes: { src: AudioBufferSourceNode; gain: GainNode; timer?: ReturnType<typeof setInterval> } | null = null;

export function stopNoise() {
  if (!nodes) return;
  try {
    nodes.src.stop();
  } catch {
    /* đã dừng */
  }
  if (nodes.timer) clearInterval(nodes.timer);
  nodes = null;
}

export function playNoise(kind: NoiseKind, volume = 0.5) {
  stopNoise();
  if (kind === "off" || typeof window === "undefined") return;
  ctx = ctx || new AudioContext();
  const c = ctx;
  if (c.state === "suspended") c.resume().catch(() => {});
  // Tiếng ồn nâu (trầm, giống tiếng rì rầm đám đông).
  const len = c.sampleRate * 3;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    d[i] = last * 3.5;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = kind === "cafe" ? "bandpass" : "lowpass";
  filter.frequency.value = kind === "cafe" ? 600 : 350;
  filter.Q.value = 0.6;
  const gain = c.createGain();
  gain.gain.value = 0.18 * volume;
  src.connect(filter).connect(gain).connect(c.destination);
  src.start();
  // Âm thanh xen kẽ: tiếng ly tách (quán) hoặc tiếng "ding" thông báo (sân bay).
  const timer = setInterval(() => {
    if (Math.random() > (kind === "cafe" ? 0.45 : 0.85)) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = kind === "cafe" ? 2200 + Math.random() * 1800 : 660;
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime((kind === "cafe" ? 0.025 : 0.05) * volume, c.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + (kind === "cafe" ? 0.15 : 0.9));
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + 1);
  }, 1400);
  nodes = { src, gain, timer };
}
