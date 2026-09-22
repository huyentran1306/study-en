"use client";

import { motion } from "framer-motion";

export function FloatingDecorations() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Subtle ambient light accents */}
      <motion.div
        className="absolute top-1/4 left-10 w-72 h-72 rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 right-10 w-80 h-80 rounded-full bg-sky-500/5 dark:bg-sky-500/10 blur-3xl"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
    </div>
  );
}

export function Sparkles({ count = 3, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute w-1 h-1 rounded-full bg-indigo-400/60 dark:bg-indigo-300/80 shadow-[0_0_8px_rgba(99,102,241,0.8)]"
          style={{
            left: `${20 + i * 30}%`,
            top: `${25 + (i % 2) * 40}%`,
          }}
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 2.5,
            delay: i * 0.8,
            repeat: Infinity,
            repeatDelay: 1.5,
          }}
        />
      ))}
    </div>
  );
}
