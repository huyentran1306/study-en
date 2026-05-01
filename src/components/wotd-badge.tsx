"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SAMPLE_VOCABULARY } from "@/lib/data";
import { useGame } from "@/contexts/game-context";
import { cn } from "@/lib/utils";

const ZH_WORDS = [
  { word: "坚持", pinyin: "jiānchí", meaning: "Persevere", example: "坚持就是胜利。(Perseverance leads to victory.)", emoji: "💪" },
  { word: "进步", pinyin: "jìnbù", meaning: "Progress", example: "每天都在进步。(Making progress every day.)", emoji: "📈" },
  { word: "勇气", pinyin: "yǒngqì", meaning: "Courage", example: "你需要勇气。(You need courage.)", emoji: "🦁" },
  { word: "智慧", pinyin: "zhìhuì", meaning: "Wisdom", example: "智慧比知识更重要。(Wisdom is more important than knowledge.)", emoji: "🧠" },
  { word: "快乐", pinyin: "kuàilè", meaning: "Happiness", example: "学习让我快乐。(Learning makes me happy.)", emoji: "😊" },
  { word: "努力", pinyin: "nǔlì", meaning: "Hard work", example: "努力学习很重要。(Working hard at studying is important.)", emoji: "📚" },
  { word: "梦想", pinyin: "mèngxiǎng", meaning: "Dream", example: "追求你的梦想。(Chase your dreams.)", emoji: "🌟" },
  { word: "友谊", pinyin: "yǒuyì", meaning: "Friendship", example: "友谊是宝贵的。(Friendship is precious.)", emoji: "🤝" },
  { word: "成功", pinyin: "chénggōng", meaning: "Success", example: "你会成功的。(You will succeed.)", emoji: "🏆" },
  { word: "感恩", pinyin: "gǎn'ēn", meaning: "Gratitude", example: "感恩每一天。(Be grateful every day.)", emoji: "🙏" },
];

export function WOTDBadge() {
  const { activeStudyLanguage, unlockAchievement } = useGame();
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
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-2xl px-2.5 py-1 text-xs font-bold text-yellow-700 dark:text-yellow-400 shadow-sm hover:shadow-md transition-all"
        title="Word of the Day"
      >
        <span>🌟</span>
        <span className="hidden sm:inline">{isZh ? "今日词" : "WOTD"}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-10 z-50 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-kawaii-purple/20 overflow-hidden"
            >
              <div className="h-1.5 bg-gradient-to-r from-yellow-400 to-orange-400" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-400">
                    {isZh ? "📅 今日词语" : "📅 Word of the Day"}
                  </span>
                  <span className="text-2xl">{(word as { emoji?: string }).emoji || "✨"}</span>
                </div>
                <div className="text-2xl font-extrabold text-foreground mb-1">{word.word}</div>
                {isZh && (word as { pinyin?: string }).pinyin && (
                  <div className="text-sm text-blue-500 mb-1">{(word as { pinyin: string }).pinyin}</div>
                )}
                {!isZh && (word as { phonetic?: string }).phonetic && (
                  <div className="text-sm text-muted-foreground mb-1">{(word as { phonetic: string }).phonetic}</div>
                )}
                <div className="text-sm font-semibold text-foreground mb-2">{word.meaning}</div>
                <div className="text-xs text-muted-foreground italic bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2 mb-3">
                  &ldquo;{word.example}&rdquo;
                </div>
                <button
                  onClick={speakWord}
                  className="w-full py-2 rounded-xl bg-gradient-kawaii text-white text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  🔊 {isZh ? "听发音" : "Listen"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
