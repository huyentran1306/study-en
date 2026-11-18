"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createWorld, type Projected, type WorldController, type WorldState } from "./world3d";

export type Label3D = { id: string; node: ReactNode; /** đứng yên tại chỗ, nổi trên và được các nhãn khác né (dấu "!", bong bóng thoại) */ top?: boolean };

/** Bản đồ đảo 3D: canvas WebGL + nhãn HTML bám theo vị trí 3D. */
export default function Island3D({
  state,
  labels,
  onPick,
  onFail,
  apiRef,
}: {
  state: WorldState;
  labels: Label3D[];
  onPick: (id: string | null) => void;
  onFail?: () => void;
  apiRef?: React.MutableRefObject<WorldController | null>;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctlRef = useRef<WorldController | null>(null);
  const labelEls = useRef(new Map<string, HTMLDivElement>());
  const tops = useRef(new Set<string>());
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const stateRef = useRef(state);
  stateRef.current = state;
  tops.current = new Set(labels.filter((l) => l.top).map((l) => l.id));

  useEffect(() => {
    const canvas = canvasRef.current,
      box = boxRef.current;
    if (!canvas || !box) return;
    let ctl: WorldController;
    try {
      ctl = createWorld({
        canvas,
        state: stateRef.current,
        reduceMotion: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
        onPick: (id) => pickRef.current(id),
        onFrame: (pts: Projected[], w: number) => {
          // Gần trước, xa sau: nhãn xa bị đè thì đẩy lên trên cho khỏi chồng.
          const order = pts.filter((p) => labelEls.current.has(p.id)).sort((a, b) => Number(tops.current.has(b.id)) - Number(tops.current.has(a.id)) || a.depth - b.depth);
          const placed: { l: number; r: number; t: number; b: number }[] = [];
          for (const p of order) {
            const el = labelEls.current.get(p.id)!;
            const ew = el.offsetWidth,
              eh = el.offsetHeight;
            const half = ew / 2 + 4;
            const clampX = (v: number) => Math.min(w - half, Math.max(half, v));
            let x = clampX(p.x);
            let y = Math.max(eh + 2, p.y);
            if (!tops.current.has(p.id)) {
              const hitAt = (cx: number, cy: number) => placed.find((r) => cx - ew / 2 < r.r - 1 && cx + ew / 2 > r.l + 1 && cy - eh < r.b - 1 && cy > r.t + 1);
              let hit = hitAt(x, y);
              if (hit) {
                // Thử lần lượt: đẩy lên, né sang hai bên, rồi hạ xuống dưới nhãn đang đè.
                const cands: [number, number][] = [];
                let uy = y;
                for (let k = 0; k < 4 && hit; k++) {
                  uy = hit.t - 3;
                  if (uy < eh + 2) break;
                  cands.push([x, uy]);
                  hit = hitAt(x, uy);
                }
                const h0 = hitAt(x, y)!;
                cands.push([clampX(h0.r + ew / 2 + 3), y], [clampX(h0.l - ew / 2 - 3), y], [x, h0.b + eh + 3]);
                const free = cands.find(([cx, cy]) => !hitAt(cx, cy));
                if (free) [x, y] = free;
              }
            }
            placed.push({ l: x - ew / 2, r: x + ew / 2, t: y - eh, b: y });
            el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
            el.style.opacity = p.behind ? "0" : "1";
            el.style.zIndex = String(tops.current.has(p.id) ? 700 : Math.round(600 - p.depth * 10));
          }
        },
      });
    } catch {
      onFail?.();
      return;
    }
    ctlRef.current = ctl;
    if (apiRef) apiRef.current = ctl;

    const ro = new ResizeObserver(() => ctl.resize(box.clientWidth, box.clientHeight));
    ro.observe(box);
    ctl.resize(box.clientWidth, box.clientHeight);

    let onScreen = true;
    const sync = () => ctl.setActive(onScreen && document.visibilityState === "visible");
    const io = new IntersectionObserver((es) => {
      onScreen = es.some((e) => e.isIntersecting);
      sync();
    });
    io.observe(box);
    document.addEventListener("visibilitychange", sync);
    const lost = (e: Event) => {
      e.preventDefault();
      onFail?.();
    };
    canvas.addEventListener("webglcontextlost", lost);
    sync();

    return () => {
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      canvas.removeEventListener("webglcontextlost", lost);
      ctl.dispose();
      ctlRef.current = null;
      if (apiRef) apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sig = JSON.stringify(state);
  useEffect(() => {
    ctlRef.current?.setState(stateRef.current);
  }, [sig]);

  return (
    <div ref={boxRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" style={{ touchAction: "pan-y" }} aria-label="Bản đồ đảo 3D. Kéo ngang để xoay, chụm hai ngón hoặc cuộn chuột để phóng to." role="img" />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {labels.map((l) => (
          <div
            key={l.id}
            ref={(el) => {
              if (el) labelEls.current.set(l.id, el);
              else labelEls.current.delete(l.id);
            }}
            className="absolute left-0 top-0 pointer-events-auto transition-opacity duration-200"
            style={{ transform: "translate(-9999px,-9999px)", willChange: "transform" }}
          >
            {l.node}
          </div>
        ))}
      </div>
    </div>
  );
}
