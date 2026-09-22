"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SAMPLE_VOCABULARY } from "@/lib/data";
import { useGame } from "@/contexts/game-context";
import { Sparkles, Volume2, X } from "lucide-react";

const ZH_WORDS = [
  { word: "坚持", pinyin: "jiānchí", meaning: "Persevere", example: "坚持就是胜利。(Perseverance leads to victory.)" },
  { word: "进步", pinyin: "jìnbù", meaning: "Progress", example: "每天都在进步。(Making progress every day.)" },
  { word: "勇气", pinyin: "yǒngqì", meaning: "Courage", example: "你需要勇气。(You need courage.)" },
  { word: "智慧", pinyin: "zhìhuì", meaning: "Wisdom", example: "智慧比知识更重要。(Wisdom is more important than knowledge.)" },
  { word: "效率", pinyin: "xiàolǜ", meaning: "Efficiency", example: "提高工作效率。(Improve work efficiency.)" },
  { word: "协作", pinyin: "xiézuò", meaning: "Collaboration", example: "团队协作至关重要。(Team collaboration is crucial.)" },
  { word: "战略", pinyin: "zhànlüè", meaning: "Strategy", example: "制定长期战略。(Formulate long-term strategy.)" },
  { word: "沟通", pinyin: "gōutōng", meaning: "Communication", example: "有效的沟通能够解决问题。(Effective communication solves problems.)" },
  { word: "创新", pinyin: "chuàngxīn", meaning: "Innovation", example: "持续创新是核心竞争力。(Continuous innovation is key.)" },
  { word: "卓越", pinyin: "zhuóyuè", meaning: "Excellence", example: "追求卓越品质。(Pursue excellence in quality.)" },
];

export function WOTDBadge() {
  const { activeStudyLanguage } = useGame();
  const [open, setOpen] = useState(false);
  const isZh = activeStudyLanguage === "zh";

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);

  const word = isZh
    ? ZH_WORDS[dayOfYear % ZH_WORDS.length]
    : SAMPLE_VOCABULARY[dayOfYear % SAMPLE_VOCABULARY.length];

  const speakWord = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utt = new SpeechSynthesisUtterance(word.word);
    utt.lang = isZh ? "zh-CN" : "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs transition-all"
        title="Word of the Day"
      >
        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
        <span className="hidden sm:inline font-bold tracking-wide">{isZh ? "今日精选" : "WOTD"}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              className="absolute right-0 top-10 z-50 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden"
            >
              <div className="h-1 bg-gradient-to-r from-indigo-500 via-indigo-600 to-sky-500" />
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200/60 dark:border-indigo-800/60">
                    {isZh ? "今日商务精选" : "Daily High-Yield Word"}
                  </span>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-slate-400 hover:text-foreground transition-colors p-1 rounded-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <div className="flex items-baseline justify-between">
                    <h4 className="text-2xl font-extrabold text-foreground tracking-tight">{word.word}</h4>
                    {isZh && (word as { pinyin?: string }).pinyin && (
                      <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                        {(word as { pinyin: string }).pinyin}
                      </span>
                    )}
                    {!isZh && (word as { phonetic?: string }).phonetic && (
                      <span className="text-xs font-mono text-muted-foreground">
                        {(word as { phonetic: string }).phonetic}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1">
                    {word.meaning}
                  </p>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-750 italic leading-relaxed">
                  &ldquo;{word.example}&rdquo;
                </div>

                <button
                  onClick={speakWord}
                  className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs shadow-indigo-500/20"
                >
                  <Volume2 className="w-4 h-4" />
                  Phát âm mẫu (Audio)
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
