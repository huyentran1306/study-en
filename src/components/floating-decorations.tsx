"use client";

import { motion } from "framer-motion";

const decorations = [
  { emoji: "⭐", delay: 0, duration: 4, x: "5%", size: "text-2xl" },
  { emoji: "✨", delay: 0.5, duration: 3.5, x: "15%", size: "text-xl" },
  { emoji: "🌟", delay: 1, duration: 4.5, x: "25%", size: "text-lg" },
  { emoji: "☁️", delay: 0.3, duration: 5, x: "35%", size: "text-3xl" },
  { emoji: "💫", delay: 1.5, duration: 3.8, x: "50%", size: "text-xl" },
  { emoji: "🌸", delay: 0.8, duration: 4.2, x: "65%", size: "text-lg" },
  { emoji: "☁️", delay: 1.2, duration: 5.5, x: "75%", size: "text-2xl" },
  { emoji: "⭐", delay: 2, duration: 4, x: "85%", size: "text-lg" },
  { emoji: "✨", delay: 0.7, duration: 3.2, x: "92%", size: "text-xl" },
];

export function FloatingDecorations() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {decorations.map((dec, i) => (
        <motion.div
          key={i}
          className={`absolute ${dec.size} opacity-40`}
          style={{ left: dec.x, top: "10%" }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: dec.duration,
            delay: dec.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {dec.emoji}
        </motion.div>
      ))}

      {/* Bottom decorations */}
      <motion.div
        className="absolute bottom-20 left-[10%] text-4xl opacity-30"
        animate={{ y: [0, -15, 0], rotate: [-5, 5, -5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        📚
      </motion.div>
      <motion.div
        className="absolute bottom-32 right-[15%] text-3xl opacity-30"
        animate={{ y: [0, -10, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        🚀
      </motion.div>
      <motion.div
        className="absolute bottom-16 right-[30%] text-2xl opacity-25"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        🌈
      </motion.div>
    </div>
  );
}

export function Sparkles({ count = 5, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute text-yellow-300 text-sm"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.5,
            delay: i * 0.3,
            repeat: Infinity,
            repeatDelay: 1,
          }}
        >
          ✨
        </motion.span>
      ))}
    </div>
  );
}
