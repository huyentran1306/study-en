"use client";

/**
 * XP/coin particle flight.
 *
 * Renders a portal layer that animates small star/coin emojis flying from a
 * trigger point toward the top-right corner (where the XP HUD typically lives).
 *
 * Usage:
 *   import { fireXPParticles } from "@/components/fx/xp-particles";
 *   fireXPParticles({ x: e.clientX, y: e.clientY, amount: 10, kind: "xp" });
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

type ParticleKind = "xp" | "coin";

interface Particle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  kind: ParticleKind;
  delay: number;
}

interface Emitter {
  emit: (p: Omit<Particle, "id" | "dx" | "dy"> & { targetX: number; targetY: number }) => void;
}

let emitter: Emitter | null = null;
let nextId = 1;

export function fireXPParticles(opts: {
  x: number;
  y: number;
  amount?: number;
  kind?: ParticleKind;
  targetSelector?: string;
}) {
  if (typeof window === "undefined" || !emitter) return;
  const count = Math.min(Math.max(opts.amount ?? 6, 3), 14);

  // Target = a DOM node (e.g. the XP HUD) or the top-right corner by default.
  const selector = opts.targetSelector ?? "[data-xp-hud]";
  const target = document.querySelector<HTMLElement>(selector);
  const rect = target?.getBoundingClientRect();
  const targetX = rect ? rect.left + rect.width / 2 : window.innerWidth - 60;
  const targetY = rect ? rect.top + rect.height / 2 : 40;

  for (let i = 0; i < count; i++) {
    emitter.emit({
      x: opts.x + (Math.random() - 0.5) * 20,
      y: opts.y + (Math.random() - 0.5) * 20,
      kind: opts.kind ?? "xp",
      delay: i * 0.04,
      targetX,
      targetY,
    });
  }
}

/** Mount once near the root (e.g. in app-shell / layout). */
export function XPParticleLayer() {
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const ref = useRef(particles);
  ref.current = particles;

  useEffect(() => {
    setMounted(true);
    emitter = {
      emit: (p) => {
        const id = nextId++;
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const next: Particle = {
          id,
          x: p.x,
          y: p.y,
          dx,
          dy,
          kind: p.kind,
          delay: p.delay,
        };
        setParticles((prev) => [...prev, next]);
        window.setTimeout(() => {
          setParticles((prev) => prev.filter((pp) => pp.id !== id));
        }, 1200 + p.delay * 1000);
      },
    };
    return () => {
      emitter = null;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden"
    >
      <AnimatePresence>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            initial={{
              x: p.x,
              y: p.y,
              scale: 0.2,
              opacity: 0,
              rotate: 0,
            }}
            animate={{
              x: [p.x, p.x + p.dx * 0.3, p.x + p.dx],
              y: [p.y, p.y + p.dy * 0.3 - 80, p.y + p.dy],
              scale: [0.2, 1.1, 0.4],
              opacity: [0, 1, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 1.05,
              delay: p.delay,
              ease: [0.34, 1.2, 0.4, 1],
              times: [0, 0.45, 1],
            }}
            className="absolute left-0 top-0 text-xl select-none drop-shadow-[0_0_6px_rgba(255,200,80,0.7)]"
          >
            {p.kind === "coin" ? "🪙" : "⭐"}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
