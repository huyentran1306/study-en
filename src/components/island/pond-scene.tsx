"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { FarmKind } from "@/lib/island/state";
import { SeaCreature } from "./farm-art";

/**
 * Tôm cua bơi thật trong hồ.
 * - mode "side": nhìn ngang như bể kính — tôm bơi giữa nước, cua bò ngang dưới cát, tôm hùm bò chậm dưới đáy.
 * - mode "top": nhìn từ trên xuống (hồ trên bản đồ) — bơi lòng vòng trong hình elip.
 * Vị trí cập nhật bằng requestAnimationFrame, ghi thẳng vào style nên không re-render React mỗi khung hình.
 */

export type SwimItem = { id: number; kind: FarmKind; size: number; ready?: boolean; leaving?: boolean; label?: string; rare?: boolean };

type Mode = "side" | "top";
type Sw = { kind: FarmKind; x: number; y: number; tx: number; ty: number; face: 1 | -1; wait: number; t: number; dart: number; boost: number };

const SPEED: Record<FarmKind, number> = { shrimp: 9, crab: 6, lobster: 3.6 };

function pick(kind: FarmKind, mode: Mode): [number, number] {
  if (mode === "top") {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * 0.6;
    return [50 + Math.cos(a) * r * 50, 50 + Math.sin(a) * r * 50];
  }
  const x = 9 + Math.random() * 82;
  if (kind === "shrimp") return [x, 24 + Math.random() * 40];
  if (kind === "crab") return [x, 80 + Math.random() * 3];
  return [x, 77 + Math.random() * 3];
}

/** Độ sâu (theo % chiều cao) mà thức ăn rơi tới, tuỳ con. */
function feedDepth(s: Sw) {
  if (s.kind === "shrimp") return Math.max(30, Math.min(64, s.y));
  return s.kind === "crab" ? 84 : 81;
}

let seq = 0;

export function Swimmers({
  items,
  mode,
  onPick,
  lure,
  selected,
}: {
  items: SwimItem[];
  mode: Mode;
  onPick?: (id: number) => void;
  /** Đổi `n` để rải thức ăn cho con `id`. */
  lure?: { id: number; n: number } | null;
  selected?: number | null;
}) {
  const box = useRef<HTMLDivElement>(null);
  const els = useRef(new Map<number, HTMLDivElement>());
  const flips = useRef(new Map<number, HTMLDivElement>());
  const st = useRef(new Map<number, Sw>());
  const booted = useRef(false);
  const [ripples, setRipples] = useState<{ k: number; x: number; y: number }[]>([]);
  const [pellets, setPellets] = useState<{ k: number; x: number; y: number; d: number }[]>([]);
  const [hop, setHop] = useState<number | null>(null);
  const [talk, setTalk] = useState<{ id: number; text: string } | null>(null);

  const ripple = (x: number, y: number) => {
    const k = ++seq;
    setRipples((r) => [...r, { k, x, y }]);
    setTimeout(() => setRipples((r) => r.filter((q) => q.k !== k)), 1400);
  };

  // Đồng bộ danh sách con với trạng thái bơi: con mới thả thì rơi từ mặt nước xuống.
  const sig = items.map((i) => `${i.id}:${i.kind}`).join(",");
  useLayoutEffect(() => {
    const m = st.current;
    const want = new Map(items.map((i) => [i.id, i.kind]));
    for (const id of [...m.keys()]) if (want.get(id) !== m.get(id)?.kind) m.delete(id);
    for (const [id, kind] of want) {
      if (m.has(id)) continue;
      const [tx, ty] = pick(kind, mode);
      let x: number, y: number;
      if (!booted.current) [x, y] = pick(kind, mode);
      else if (mode === "side") {
        x = 15 + Math.random() * 70;
        y = -6;
        ripple(x, 4);
      } else [x, y] = [50, 50];
      m.set(id, { kind, x, y, tx: mode === "side" && booted.current ? x : tx, ty, face: Math.random() < 0.5 ? 1 : -1, wait: 0, t: Math.random() * 6, dart: 0, boost: booted.current ? 1.6 : 1 });
      const el = els.current.get(id);
      if (el) {
        el.style.left = `${x}%`;
        el.style.top = `${y}%`;
      }
    }
    booted.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, mode]);

  // Vòng lặp bơi.
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const b = box.current;
      if (!b || document.hidden) return;
      const asp = b.clientHeight / Math.max(1, b.clientWidth);
      st.current.forEach((s, id) => {
        s.t += dt;
        let moving = false;
        if (s.wait > 0) s.wait -= dt * 1000;
        else {
          const dx = s.tx - s.x;
          const dy = (s.ty - s.y) * asp;
          const d = Math.hypot(dx, dy);
          if (d < 0.5) {
            s.wait = 500 + Math.random() * (s.kind === "lobster" ? 3600 : 2200);
            s.boost = 1;
            [s.tx, s.ty] = pick(s.kind, mode);
            if (s.kind === "shrimp" && Math.random() < 0.3) s.dart = 0.5;
          } else {
            moving = true;
            const v = SPEED[s.kind] * (mode === "top" ? 0.55 : 1) * (reduce ? 0.35 : 1) * (s.dart > 0 ? 2.8 : 1) * s.boost;
            s.dart -= dt;
            const step = Math.min(d, v * dt);
            s.x += (dx / d) * step;
            s.y += (dy / d) * step / asp;
            if (s.kind !== "crab" && Math.abs(dx) > 0.4) s.face = dx > 0 ? 1 : -1;
          }
        }
        const el = els.current.get(id);
        if (el) {
          const bob = s.kind === "shrimp" ? Math.sin(s.t * 2.4) * (mode === "top" ? 1.2 : 0.9) : 0;
          el.style.left = `${s.x}%`;
          el.style.top = `${s.y + bob}%`;
        }
        const f = flips.current.get(id);
        if (f) {
          const wob = moving && s.kind !== "shrimp" ? Math.sin(s.t * (s.kind === "crab" ? 20 : 9)) * 4 : 0;
          const tilt = mode === "top" && s.kind === "shrimp" ? Math.sin(s.t * 1.3) * 8 : 0;
          f.style.transform = `scaleX(${s.face}) rotate(${wob + tilt}deg)`;
        }
      });
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  // Rải thức ăn: hạt rơi xuống cạnh con được cho ăn, con bơi tới đớp.
  useEffect(() => {
    if (!lure) return;
    const s = st.current.get(lure.id);
    if (!s) return;
    const px = Math.max(8, Math.min(92, s.x + s.face * 6));
    const py = mode === "side" ? feedDepth(s) : s.y;
    const ks = [-2.5, 0, 2.5].map((off, i) => ({ k: ++seq, x: px + off, y: py + (i % 2) * 1.5, d: i * 0.12 }));
    setPellets((p) => [...p, ...ks]);
    ripple(px, mode === "side" ? 4 : py);
    s.wait = 650;
    s.tx = px;
    s.ty = py;
    s.boost = 1.8;
    s.dart = 0;
    const done = new Set(ks.map((q) => q.k));
    const t = setTimeout(() => setPellets((p) => p.filter((q) => !done.has(q.k))), 2200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lure?.n]);

  useEffect(() => {
    if (!talk) return;
    const t = setTimeout(() => setTalk(null), 2200);
    return () => clearTimeout(t);
  }, [talk]);

  const interactive = !!onPick;

  return (
    <div ref={box} className={interactive ? "absolute inset-0" : "absolute inset-0 pointer-events-none"}>
      {ripples.map((r) => (
        <span key={r.k} aria-hidden className="swim-ripple" style={{ left: `${r.x}%`, top: `${r.y}%` }} />
      ))}
      {pellets.map((p) => (
        <span key={p.k} aria-hidden className="swim-pellet" style={{ left: `${p.x}%`, top: `${p.y}%`, animationDelay: `${p.d}s, ${1.5 + p.d}s` }} />
      ))}
      {items.map((it) => {
        const s = st.current.get(it.id);
        const sel = selected === it.id;
        const Tag = interactive ? "button" : "div";
        return (
          <div
            key={`${it.id}:${it.kind}`}
            ref={(el) => {
              if (el) els.current.set(it.id, el);
              else els.current.delete(it.id);
            }}
            className="absolute"
            style={{ left: `${s?.x ?? -20}%`, top: `${s?.y ?? -20}%`, width: `calc(${it.size}% * var(--swim-scale, 1))`, transform: "translate(-50%,-50%)", zIndex: sel ? 4 : it.kind === "shrimp" ? 3 : 2 }}
          >
            {it.ready && !it.leaving && talk?.id !== it.id && (
              <span aria-hidden className="absolute left-1/2 -translate-x-1/2 -top-[38%] pointer-events-none">
                <span className="block anim-bounce rounded-full bg-[#F2C14E] border-2 border-[#4A3222] text-[#4A3222] font-baloo font-extrabold leading-none px-1.5 py-0.5 text-[11px] sm:text-xs whitespace-nowrap">
                  {mode === "side" ? "Bắt được rồi!" : "!"}
                </span>
              </span>
            )}
            {talk?.id === it.id && (
              <span className="absolute left-1/2 -translate-x-1/2 bottom-[105%] pointer-events-none z-10">
                <span className="block anim-pop rounded-[12px] bg-white border-2 border-[#4A3222] px-2 py-1 text-[12px] font-extrabold text-[#4A3222] whitespace-nowrap shadow-[0_3px_0_rgba(74,50,34,.25)]">{talk.text}</span>
              </span>
            )}
            <Tag
              {...(interactive
                ? {
                    type: "button" as const,
                    "data-sfx": "none",
                    "aria-label": it.label ?? it.kind,
                    onClick: () => {
                      setHop(it.id);
                      setTimeout(() => setHop((h) => (h === it.id ? null : h)), 520);
                      if (it.label) setTalk({ id: it.id, text: it.label });
                      onPick?.(it.id);
                    },
                  }
                : {})}
              className={[
                "block w-full",
                interactive && "cursor-pointer focus:outline-none",
                it.leaving ? "swim-leap" : hop === it.id ? "swim-hop" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div
                ref={(el) => {
                  if (el) flips.current.set(it.id, el);
                  else flips.current.delete(it.id);
                }}
                style={{ filter: it.ready ? "drop-shadow(0 0 6px #F2C14E) drop-shadow(0 0 2px #fff)" : sel ? "drop-shadow(0 0 5px #fff)" : undefined }}
              >
                <SeaCreature kind={it.kind} rare={it.rare} />
              </div>
            </Tag>
          </div>
        );
      })}
    </div>
  );
}

const BUBBLES: [number, number, number, number][] = [
  // left %, size px, duration s, delay s
  [12, 8, 7, 0],
  [18, 5, 6, 2.5],
  [34, 7, 8, 1.2],
  [47, 4, 5.5, 3.8],
  [63, 9, 7.5, 0.6],
  [71, 5, 6, 4.4],
  [86, 7, 8.5, 2],
  [91, 4, 5, 5.2],
];

/** Phông hồ nhìn ngang: nước, tia nắng, mặt nước gợn sóng, cát, rong, đá, bong bóng. */
export function PondBackdrop() {
  return (
    <>
      <svg viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden>
        <defs>
          <linearGradient id="pw" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#D2F0F7" />
            <stop offset=".45" stopColor="#8ED0E2" />
            <stop offset="1" stopColor="#4C9CBC" />
          </linearGradient>
          <linearGradient id="pray" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".55" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="1000" height="560" fill="url(#pw)" />
        {/* Tia nắng */}
        {[
          [120, 70],
          [380, 50],
          [640, 80],
          [860, 46],
        ].map(([x, w], i) => (
          <polygon key={x} className="pond-ray" style={{ animationDelay: `${i * 1.3}s` }} points={`${x},0 ${x + w},0 ${x + w + 150},520 ${x + 90},520`} fill="url(#pray)" />
        ))}
        {/* Đá xa mờ */}
        <path d="M0 470 C60 400 140 410 190 450 C240 380 330 400 360 460 L360 560 H0 Z" fill="#5FA9C4" opacity=".45" />
        <path d="M620 470 C680 392 760 400 800 446 C850 400 940 410 1000 450 V560 H620 Z" fill="#5FA9C4" opacity=".4" />
        {/* Rong */}
        {[
          [70, 150, "#5FA34A"],
          [110, 110, "#6FAE4F"],
          [470, 120, "#5FA34A"],
          [890, 170, "#6FAE4F"],
          [930, 120, "#5FA34A"],
        ].map(([x, h, c], i) => (
          <g key={i} className="pond-weed" style={{ animationDelay: `${i * 0.7}s` }}>
            <path
              d={`M${x} 500 C${Number(x) - 22} ${500 - Number(h) * 0.35} ${Number(x) + 22} ${500 - Number(h) * 0.6} ${x} ${500 - Number(h)} C${Number(x) + 14} ${500 - Number(h) * 0.6} ${Number(x) - 6} ${500 - Number(h) * 0.35} ${Number(x) + 12} 500 Z`}
              fill={String(c)}
              stroke="#3F7A34"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </g>
        ))}
        {/* Đá có hang */}
        <path d="M720 500 C716 448 760 420 806 424 C852 428 880 462 872 500 Z" fill="#9AA7AE" stroke="#4A3222" strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M772 500 C772 476 806 470 812 500 Z" fill="#4E5D66" stroke="#4A3222" strokeWidth="3" />
        <path d="M750 452 C762 440 780 436 792 440" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="4" strokeLinecap="round" />
        {/* Cát */}
        <path d="M0 482 C120 462 220 498 360 484 C500 468 620 500 760 482 C860 468 940 482 1000 474 V560 H0 Z" fill="#F1D9A6" stroke="#C9A66B" strokeWidth="3" />
        {[
          [80, 520, 2],
          [210, 540, 3],
          [330, 512, 2],
          [560, 530, 3],
          [690, 516, 2],
          [940, 530, 3],
        ].map(([x, y, r]) => (
          <circle key={x} cx={x} cy={y} r={r} fill="#C9A66B" />
        ))}
        <ellipse cx="270" cy="508" rx="16" ry="9" fill="#B9C3C8" stroke="#4A3222" strokeWidth="2.5" />
        <ellipse cx="610" cy="512" rx="11" ry="7" fill="#C7CFD3" stroke="#4A3222" strokeWidth="2.5" />
        {/* Vỏ sò + sao biển */}
        <path d="M400 516 C400 500 424 500 424 516 Z" fill="#F7C6CF" stroke="#4A3222" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M406 514 L410 504 M412 514 V502 M418 514 L414 504" stroke="#4A3222" strokeWidth="1.5" />
        <path d="M150 520 l6 -12 l6 12 l12 2 l-10 8 l4 12 l-12 -6 l-12 6 l4 -12 l-10 -8 z" fill="#F7A072" stroke="#4A3222" strokeWidth="2.5" strokeLinejoin="round" />
        {/* Mặt nước */}
        <g className="pond-wave">
          <path d="M0 18 q62.5 -14 125 0 t125 0 t125 0 t125 0 t125 0 t125 0 t125 0 t125 0 t125 0 t125 0 t125 0 t125 0 V0 H0 Z" fill="#fff" opacity=".55" />
          <path d="M0 18 q62.5 -14 125 0 t125 0 t125 0 t125 0 t125 0 t125 0 t125 0 t125 0 t125 0 t125 0 t125 0 t125 0" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
        </g>
        {/* Lá sen trôi */}
        <g className="pond-lily">
          <path d="M560 14 a44 14 0 1 0 2 0 L582 22 Z" fill="#6FAE4F" stroke="#3F7A34" strokeWidth="3" />
          <circle cx="548" cy="8" r="7" fill="#F4B6C2" stroke="#4A3222" strokeWidth="2.5" />
        </g>
      </svg>
      {BUBBLES.map(([l, sz, dur, d], i) => (
        <span key={i} aria-hidden className="pond-bubble" style={{ left: `${l}%`, width: sz, height: sz, animationDuration: `${dur}s`, animationDelay: `${d}s` }} />
      ))}
    </>
  );
}
