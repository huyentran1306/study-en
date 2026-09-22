"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Lightbulb, Flame, ArrowRight, Target } from "lucide-react";
import { DAILY_CHALLENGES, DAILY_CHALLENGES_ZH } from "@/lib/data";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useGame } from "@/contexts/game-context";

export function DailyChallengeCard() {
  const { activeStudyLanguage, addXP } = useGame();
  const isZh = activeStudyLanguage === "zh";
  const challenges = isZh ? DAILY_CHALLENGES_ZH : DAILY_CHALLENGES;
  const [streak, setStreak] = useLocalStorage("daily-streak", 0);
  const [lastCompleted, setLastCompleted] = useLocalStorage("last-challenge-date", "");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const today = new Date().toDateString();
  const isCompletedToday = lastCompleted === today;
  const challenge = challenges[currentIndex % challenges.length];
  const isCorrect = selectedAnswer === challenge.answer;

  const handleAnswer = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
    setShowResult(true);
    if (answer === challenge.answer && !isCompletedToday) {
      setStreak((prev: number) => prev + 1);
      setLastCompleted(today);
      addXP(challenge.xpReward || 10);
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => prev + 1);
    setSelectedAnswer(null);
    setShowResult(false);
    setShowHint(false);
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-foreground">
              {challenge.type === "fill-blank"
                ? "Điền từ vào chỗ trống (Fill in the Blank)"
                : challenge.type === "translate"
                ? "Ý nghĩa tự nhiên (Contextual Meaning)"
                : "Tái cấu trúc câu (Sentence Rearrange)"}
            </span>
            <span className="ml-2 text-[10px] font-semibold text-muted-foreground tabular-nums">
              Câu {(currentIndex % challenges.length) + 1}/{challenges.length}
            </span>
          </div>
        </div>

        {/* Streak Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-bold">
          <Flame className="w-3.5 h-3.5" />
          <span>{streak} Ngày liên tục</span>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-4">
        {/* Question Text */}
        <p className="text-base sm:text-lg font-semibold text-foreground leading-relaxed">
          {challenge.question}
        </p>

        {/* Hint Trigger */}
        {challenge.hint && !showHint && !showResult && (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium transition-colors"
            onClick={() => setShowHint(true)}
          >
            <Lightbulb className="h-3.5 w-3.5" />
            Xem gợi ý ngữ cảnh
          </button>
        )}

        <AnimatePresence>
          {showHint && !showResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-800/50 px-4 py-2.5 text-xs text-indigo-700 dark:text-indigo-300 font-medium"
            >
              Gợi ý: {challenge.hint}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Multiple Choice Options */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {challenge.options?.map((option) => {
            let stateClass = "border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 hover:border-indigo-500/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20";
            if (showResult) {
              if (option === challenge.answer) {
                stateClass = "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/50";
              } else if (option === selectedAnswer) {
                stateClass = "border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/50 opacity-80";
              } else {
                stateClass = "border-slate-200 dark:border-slate-800 opacity-40";
              }
            }

            return (
              <motion.button
                key={option}
                whileHover={!showResult ? { y: -1 } : {}}
                whileTap={!showResult ? { scale: 0.99 } : {}}
                onClick={() => handleAnswer(option)}
                disabled={showResult}
                className={`relative rounded-xl border p-3.5 text-left text-xs sm:text-sm font-semibold transition-all flex items-center justify-between ${stateClass}`}
              >
                <span>{option}</span>
                {showResult && option === challenge.answer && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 ml-2" />
                )}
                {showResult && option === selectedAnswer && option !== challenge.answer && (
                  <XCircle className="h-4 w-4 text-rose-500 shrink-0 ml-2" />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Result Action Bar */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`rounded-xl p-4 flex items-center justify-between gap-3 border ${
                isCorrect
                  ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60"
                  : "bg-slate-100 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">
                    {isCorrect ? "Chính xác! Diễn đạt rất chuẩn." : `Đáp án đúng: "${challenge.answer}"`}
                  </span>
                </div>
                {!isCompletedToday && isCorrect && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    +1 Ngày streak · +{challenge.xpReward || 10} XP
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="btn-pro text-xs py-2 px-4 rounded-xl gap-1 shrink-0"
              >
                Câu tiếp theo
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
export default DailyChallengeCard;
