"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSRCards, saveSRCards, sm2Update, isDue, SRCard } from "@/lib/spaced-repetition";
import { useGame } from "@/contexts/game-context";
import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle2, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const speak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = isZh ? "zh-CN" : "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
  };

  const rate = (quality: 0 | 1 | 2 | 3 | 4 | 5) => {
    const card = dueCards[current];
    const updated = sm2Update(card, quality);
    const allCards = getSRCards();
    const idx = allCards.findIndex((c) => c.id === card.id);
    if (idx >= 0) {
      allCards[idx] = updated;
      saveSRCards(allCards);
    }

    addXP(quality >= 3 ? 5 : 2);
    if (quality >= 3) addCoins(1);
    incrementReviewCount();
    setReviewedCount((p) => p + 1);

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
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <Link
          href="/vocab"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Về kho từ vựng
        </Link>
        <span className="text-xs font-semibold text-muted-foreground">
          {dueCards.length} từ cần ôn hôm nay
        </span>
      </div>

      {done ? (
        <div className="pro-card p-10 text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto border border-emerald-200/60 dark:border-emerald-800/60">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground">Hoàn Thành Ôn Tập Hôm Nay!</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Bạn đã củng cố trí nhớ cho <strong className="text-foreground">{reviewedCount} thẻ từ vựng</strong> theo thuật toán SM-2.
            </p>
          </div>

          {totalCards === 0 && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 text-xs text-muted-foreground">
              Kho ôn tập hiện đang trống. Hãy thêm các từ vựng mới từ trang Flashcard.
            </div>
          )}

          <Link href="/vocab" className="inline-block">
            <Button className="btn-pro text-xs font-bold px-6">
              Quay lại Flashcard Studio
            </Button>
          </Link>
        </div>
      ) : card ? (
        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Thẻ {current + 1} / {dueCards.length}</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                Lặp lại #{card.repetitions} · Khoảng cách: {card.interval} ngày
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{ width: `${((current + 1) / dueCards.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Flashcard Component */}
          <div
            onClick={() => setFlipped(!flipped)}
            className="pro-card p-8 sm:p-10 text-center cursor-pointer min-h-[260px] flex flex-col justify-between border-indigo-500/20 hover:border-indigo-500/40 select-none"
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-md border border-indigo-200/60 dark:border-indigo-800/60 inline-block mb-4">
                {flipped ? "Mặt sau: Nghĩa & Ngữ cảnh" : "Mặt trước: Thuật ngữ"}
              </span>

              <div className="flex items-center justify-center gap-2">
                <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                  {card.word}
                </h3>
                <button
                  onClick={(e) => { e.stopPropagation(); speak(card.word); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                  title="Phát âm"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {card.phonetic && (
                <p className="text-xs font-mono text-muted-foreground mt-1">{card.phonetic}</p>
              )}
            </div>

            {flipped ? (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-4">
                <p className="text-lg font-bold text-foreground">{card.meaning}</p>
                {card.example && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-750">
                    &ldquo;{card.example}&rdquo;
                  </p>
                )}
              </motion.div>
            ) : (
              <p className="text-xs text-muted-foreground pt-4">
                Nhấn vào thẻ để lật mặt sau
              </p>
            )}
          </div>

          {/* SM-2 Retention Evaluation Buttons */}
          <AnimatePresence>
            {flipped && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-4 gap-2 pt-2"
              >
                <button
                  onClick={() => rate(1)}
                  className="p-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-center hover:bg-rose-100 transition-all"
                >
                  <span className="text-xs font-bold block">Again</span>
                  <span className="text-[10px] opacity-75">&lt; 1m</span>
                </button>

                <button
                  onClick={() => rate(2)}
                  className="p-3 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-center hover:bg-amber-100 transition-all"
                >
                  <span className="text-xs font-bold block">Hard</span>
                  <span className="text-[10px] opacity-75">1 ngày</span>
                </button>

                <button
                  onClick={() => rate(4)}
                  className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-center hover:bg-indigo-100 transition-all"
                >
                  <span className="text-xs font-bold block">Good</span>
                  <span className="text-[10px] opacity-75">3 ngày</span>
                </button>

                <button
                  onClick={() => rate(5)}
                  className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-center hover:bg-emerald-100 transition-all"
                >
                  <span className="text-xs font-bold block">Easy</span>
                  <span className="text-[10px] opacity-75">7 ngày</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : null}
    </div>
  );
}
