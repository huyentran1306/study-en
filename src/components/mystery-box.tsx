"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame, useTranslation } from "@/contexts/game-context";
import { Gift } from "lucide-react";

export function MysteryBoxWidget() {
  const { openMysteryBox, canOpenMysteryBox, mysteryBox } = useGame();
  const t = useTranslation();
  const [wonSticker, setWonSticker] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);

  const handleOpen = () => {
    if (!canOpenMysteryBox) return;
    setIsOpening(true);
    setTimeout(() => {
      const sticker = openMysteryBox();
      setWonSticker(sticker);
      setTimeout(() => {
        setIsOpening(false);
        setWonSticker(null);
      }, 3000);
    }, 1000);
  };

  return (
    <div className="rounded-3xl bg-white/70 dark:bg-gray-800/70 backdrop-blur p-6 shadow-kawaii border-2 border-kawaii-purple/20">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Gift className="w-5 h-5 text-kawaii-purple" />
        {t.mysteryBox}
      </h3>

      {/* Box */}
      <div className="text-center mb-4">
        <AnimatePresence mode="wait">
          {wonSticker ? (
            <motion.div
              key="won"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              className="inline-block"
            >
              <div className="text-7xl mb-2">{wonSticker}</div>
              <p className="font-bold text-kawaii-purple">New sticker! 🎉</p>

              {/* Confetti */}
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute text-lg"
                  style={{ left: `${20 + Math.random() * 60}%` }}
                  initial={{ y: 0, opacity: 1 }}
                  animate={{ y: 100, opacity: 0, x: (Math.random() - 0.5) * 100 }}
                  transition={{ duration: 1, delay: i * 0.05 }}
                >
                  {["✨", "⭐", "💫"][i % 3]}
                </motion.span>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="box"
              animate={isOpening ? { rotate: [-5, 5, -5, 5, 0], scale: [1, 1.1, 1] } : { y: [0, -5, 0] }}
              transition={isOpening ? { duration: 1 } : { duration: 2, repeat: Infinity }}
            >
              <span className="text-6xl">{canOpenMysteryBox ? "🎁" : "📦"}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Open button */}
      <motion.button
        onClick={handleOpen}
        disabled={!canOpenMysteryBox || isOpening}
        className="w-full py-3 rounded-2xl bg-gradient-kawaii text-white font-bold shadow-kawaii disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={canOpenMysteryBox ? { scale: 1.02 } : {}}
        whileTap={canOpenMysteryBox ? { scale: 0.98 } : {}}
      >
        {canOpenMysteryBox ? `🎁 ${t.openBox}` : `⏰ ${t.comeTomorrow}`}
      </motion.button>

      {/* Sticker collection */}
      {mysteryBox.stickers.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">
            {t.stickers} ({mysteryBox.stickers.length}/32)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {mysteryBox.stickers.map((s, i) => (
              <motion.span
                key={i}
                className="text-xl bg-white/50 dark:bg-gray-700/50 rounded-lg p-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.3, rotate: 10 }}
              >
                {s}
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
