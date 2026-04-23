/**
 * Lightweight canvas confetti burst.
 *
 * Self-contained (no external deps). Creates a full-screen, pointer-events:none
 * canvas, fires N particles from an origin, animates with gravity + drag, then
 * cleans up. Multiple overlapping bursts are supported — the canvas is reused
 * until all particles have left the screen.
 */

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rot: number;
  vr: number;
  shape: "square" | "circle" | "star";
  life: number;
};

export type ConfettiOptions = {
  /** Origin in CSS pixels (window coords). Defaults to center-top of viewport. */
  x?: number;
  y?: number;
  /** Number of particles. Default 120. */
  count?: number;
  /** Spread angle in degrees around the launch direction. Default 70. */
  spread?: number;
  /** Launch direction in degrees (0 = right, 90 = down, 270 = up). Default 270. */
  angle?: number;
  /** Initial velocity magnitude. Default 30. */
  velocity?: number;
  /** Palette. Defaults to kawaii palette. */
  colors?: string[];
  /** Include star shape too. Default true. */
  withStars?: boolean;
};

const KAWAII_COLORS = [
  "#a78bfa", // purple
  "#f472b6", // pink
  "#7dd3fc", // sky
  "#6ee7b7", // mint
  "#fcd34d", // yellow
  "#fca5a5", // peach
  "#ff9a9e", // coral
  "#c4b5fd", // lavender
];

let sharedCanvas: HTMLCanvasElement | null = null;
let sharedCtx: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let rafId: number | null = null;
let lastTs = 0;

function ensureCanvas(): HTMLCanvasElement | null {
  if (typeof window === "undefined") return null;
  if (sharedCanvas) return sharedCanvas;

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  document.body.appendChild(canvas);

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize);

  sharedCanvas = canvas;
  sharedCtx = canvas.getContext("2d");
  return canvas;
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i;
    const radius = i % 2 === 0 ? r : r / 2;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function tick(ts: number) {
  if (!sharedCtx || !sharedCanvas) return;
  const dt = lastTs ? Math.min((ts - lastTs) / 16.6667, 2.5) : 1;
  lastTs = ts;

  const w = sharedCanvas.clientWidth;
  const h = sharedCanvas.clientHeight;
  sharedCtx.clearRect(0, 0, w, h);

  const gravity = 0.35;
  const drag = 0.015;

  for (const p of particles) {
    p.vy += gravity * dt;
    p.vx *= 1 - drag * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
    p.life -= dt;

    sharedCtx.save();
    sharedCtx.translate(p.x, p.y);
    sharedCtx.rotate((p.rot * Math.PI) / 180);
    sharedCtx.globalAlpha = Math.max(0, Math.min(1, p.life / 40));
    sharedCtx.fillStyle = p.color;
    if (p.shape === "circle") {
      sharedCtx.beginPath();
      sharedCtx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      sharedCtx.fill();
    } else if (p.shape === "star") {
      drawStar(sharedCtx, 0, 0, p.size / 1.5);
    } else {
      sharedCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.55);
    }
    sharedCtx.restore();
  }

  // Remove offscreen / dead particles
  particles = particles.filter(
    (p) => p.life > 0 && p.y < h + 50 && p.x > -50 && p.x < w + 50,
  );

  if (particles.length > 0) {
    rafId = requestAnimationFrame(tick);
  } else {
    rafId = null;
    lastTs = 0;
    if (sharedCtx) sharedCtx.clearRect(0, 0, w, h);
  }
}

/**
 * Fire a confetti burst. Safe to call from event handlers; returns immediately.
 */
export function fireConfetti(opts: ConfettiOptions = {}) {
  const canvas = ensureCanvas();
  if (!canvas || !sharedCtx) return;

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const x = opts.x ?? w / 2;
  const y = opts.y ?? h / 3;
  const count = opts.count ?? 120;
  const spread = (opts.spread ?? 70) * (Math.PI / 180);
  const angle = ((opts.angle ?? 270) * Math.PI) / 180;
  const velocity = opts.velocity ?? 30;
  const colors = opts.colors ?? KAWAII_COLORS;
  const withStars = opts.withStars ?? true;

  for (let i = 0; i < count; i++) {
    const a = angle + (Math.random() - 0.5) * spread;
    const v = velocity * (0.5 + Math.random() * 0.7);
    const shape: Particle["shape"] = withStars && Math.random() < 0.18
      ? "star"
      : Math.random() < 0.4 ? "circle" : "square";
    particles.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      size: 6 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 12,
      shape,
      life: 60 + Math.random() * 40,
    });
  }

  if (!rafId) {
    lastTs = 0;
    rafId = requestAnimationFrame(tick);
  }
}

/**
 * Celebratory "side cannons" — two bursts from bottom-left and bottom-right,
 * great for level-up / perfect-game moments.
 */
export function fireCelebration() {
  if (typeof window === "undefined") return;
  const h = window.innerHeight;
  const w = window.innerWidth;
  fireConfetti({ x: 0, y: h - 20, angle: 300, spread: 55, velocity: 38, count: 90 });
  fireConfetti({ x: w, y: h - 20, angle: 240, spread: 55, velocity: 38, count: 90 });
  setTimeout(() => {
    fireConfetti({ x: w / 2, y: h / 2, count: 100, spread: 140, velocity: 28 });
  }, 180);
}
