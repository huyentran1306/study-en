"use client";

import { motion } from "framer-motion";
import { useGame, useTranslation } from "@/contexts/game-context";
import { Baby, GraduationCap } from "lucide-react";

export function ModeToggle() {
  const { mode, setMode } = useGame();
  const t = useTranslation();

  return (
    <motion.button
      onClick={() => setMode(mode === "kid" ? "adult" : "kid")}
      className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-sm transition-all ${
        mode === "kid"
          ? "bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-kawaii"
          : "bg-gradient-to-r from-slate-600 to-gray-700 text-white shadow-md"
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {mode === "kid" ? (
        <>
          <Baby className="w-4 h-4" />
          {t.kidMode}
        </>
      ) : (
        <>
          <GraduationCap className="w-4 h-4" />
          {t.adultMode}
        </>
      )}
    </motion.button>
  );
}
