"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSRCards, saveSRCards, sm2Update, isDue, SRCard } from "@/lib/spaced-repetition";
import { useGame } from "@/contexts/game-context";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

export default function ReviewPage() {
  const { addXP, addCoins, unlockAchievement, incrementReviewCount, activeStudyLanguage } = useGame();
  const isZh = activeStudyLanguage === "zh";

  const [dueCards, setDueCards] = useState<SRCard[]>([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const cards = getSRCards().filter(isDue);
    setDueCards(cards);
    if (cards.length === 0) setDone(true);
  }, []);

  const rate = (quality: 0 | 1 | 2 | 3 | 4 | 5) => {
    const card = dueCards[current];
    const updated = sm2Update(card, quality);
    const allCards = getSRCards();
    const idx = allCards.findIndex(c => c.id === card.id);
    if (idx >= 0) { allCards[idx] = updated; saveSRCards(allCards); }

    addXP(quality >= 3 ? 5 : 2);
    if (quality >= 3) addCoins(1);
    incrementReviewCount();
    setReviewedCount(p => p + 1);

    const nextIdx = current + 1;
    if (nextIdx >= dueCards.length) {
      setDone(true);
      unlockAchievement("review_10");
    } else {
      setCurrent(nextIdx);
      setFlipped(false);
    }
  };

  if (!mounted) return null;

  const totalCards = getSRCards().length;
  const card = dueCards[current];

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/vocab" className="p-2 rounded-xl hover:bg-kawaii-purple/10 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold bg-gradient-kawaii bg-clip-text text-transparent">
            {isZh ? "🔄 复习卡片" : "🔄 Spaced Review"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isZh ? `${totalCards} 张卡片 · ${dueCards.length} 张待复习` : `${totalCards} cards · ${dueCards.length} due today`}
          </p>
        </div>
      </div>

      {done ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 space-y-4">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-bold">{isZh ? "复习完成！" : "All done!"}</h2>
          <p className="text-muted-foreground">
            {isZh ? `今天复习了 ${reviewedCount} 张卡片` : `Reviewed ${reviewedCount} cards today`}
          </p>
          {totalCards === 0 && (
            <div className="bg-kawaii-purple/10 rounded-2xl p-4 text-sm">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-kawaii-purple" />
              <p>{isZh ? "从词汇页面添加单词到复习列表" : "Add words from the Vocab page to start reviewing"}</p>
              <Link href="/vocab" className="mt-2 inline-block text-kawaii-purple font-bold hover:underline">
                {isZh ? "前往词汇页面 →" : "Go to Vocab →"}
              </Link>
            </div>
          )}
        </motion.div>
      ) : card ? (
        <div>
          {/* Progress */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-kawaii rounded-full transition-all" style={{ width: `${(current / dueCards.length) * 100}%` }} />
            </div>
            <span className="text-sm font-bold text-muted-foreground">{current}/{dueCards.length}</span>
          </div>

          {/* Flashcard */}
          <div className="perspective-1000">
            <motion.div
              className="relative w-full cursor-pointer"
              style={{ minHeight: 280 }}
              onClick={() => setFlipped(!flipped)}
            >
              <AnimatePresence mode="wait">
                {!flipped ? (
                  <motion.div
                    key="front"
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: -90, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white dark:bg-gray-800 rounded-3xl shadow-kawaii p-8 text-center border-2 border-kawaii-purple/20"
                  >
                    <div className="text-5xl mb-4">{card.emoji || "📝"}</div>
                    <div className="text-3xl font-extrabold mb-2">{card.word}</div>
                    {card.phonetic && <div className="text-muted-foreground text-sm mb-4">{card.phonetic}</div>}
                    <p className="text-sm text-muted-foreground">{isZh ? "点击查看释义" : "Tap to reveal meaning"}</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="back"
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: -90, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-br from-kawaii-purple/10 to-kawaii-pink/10 rounded-3xl shadow-kawaii p-8 text-center border-2 border-kawaii-purple/30"
                  >
                    <div className="text-2xl font-bold mb-2">{card.meaning}</div>
                    {card.example && (
                      <p className="text-sm italic text-muted-foreground bg-white/50 dark:bg-gray-800/50 rounded-2xl p-3 mt-3">
                        &ldquo;{card.example}&rdquo;
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-4">
                      {isZh ? "📅 间隔: " : "📅 Next in: "}{card.interval} {isZh ? "天" : "days"} · #{card.repetitions}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Rating buttons (shown after flip) */}
          <AnimatePresence>
            {flipped && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 grid grid-cols-3 gap-3"
              >
                {[
                  { quality: 1 as const, label: isZh ? "忘记了" : "Forgot", color: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400" },
                  { quality: 3 as const, label: isZh ? "还行" : "Hard", color: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400" },
                  { quality: 5 as const, label: isZh ? "记住了" : "Easy", color: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400" },
                ].map(btn => (
                  <motion.button
                    key={btn.quality}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => rate(btn.quality)}
                    className={cn("py-3 rounded-2xl font-bold border-2 text-sm transition-all", btn.color)}
                  >
                    {btn.label}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : null}
    </div>
  );
}
