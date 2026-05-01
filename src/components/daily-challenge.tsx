"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import { DAILY_CHALLENGES, DAILY_CHALLENGES_ZH } from "@/lib/data";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useGame } from "@/contexts/game-context";

const OPTION_COLORS = [
  "from-violet-400 to-purple-500 border-violet-300/50 dark:border-violet-700/50",
  "from-blue-400 to-cyan-500 border-blue-300/50 dark:border-blue-700/50",
  "from-pink-400 to-rose-500 border-pink-300/50 dark:border-pink-700/50",
  "from-amber-400 to-orange-500 border-amber-300/50 dark:border-amber-700/50",
];

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
    <div className="rounded-3xl border-2 border-orange-200/50 dark:border-orange-800/50 bg-gradient-to-br from-orange-50/80 to-amber-50/80 dark:from-orange-900/20 dark:to-amber-900/20 overflow-hidden shadow-sm">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-orange-200/50 dark:border-orange-800/50">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">
            {challenge.type === "fill-blank" ? "✏️ Fill in the Blank" : challenge.type === "translate" ? "🔤 What does it mean?" : "🔀 Rearrange"}
          </span>
          <span className="text-xs text-muted-foreground bg-white/50 dark:bg-white/10 rounded-full px-2.5 py-0.5 font-medium">
            {(currentIndex % challenges.length) + 1}/{challenges.length}
          </span>
        </div>

        {/* Streak badge */}
        <motion.div
          animate={{ scale: streak > 0 ? [1, 1.1, 1] : 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-1.5 bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-full px-3 py-1.5 text-sm font-bold shadow-sm"
        >
          🔥 {streak} streak
        </motion.div>
      </div>

      <div className="p-6 space-y-5">
        {/* Question */}
        <p className="text-lg font-semibold leading-relaxed">{challenge.question}</p>

        {/* Hint button */}
        {challenge.hint && !showHint && !showResult && (
          <button
            className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 transition-colors font-medium"
            onClick={() => setShowHint(true)}
          >
            <Lightbulb className="h-4 w-4" />
            Show hint
          </button>
        )}
        <AnimatePresence>
          {showHint && !showResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl bg-amber-100/70 dark:bg-amber-900/30 border border-amber-200/50 dark:border-amber-800/50 px-4 py-3 text-sm text-amber-700 dark:text-amber-300 font-medium"
            >
              💡 {challenge.hint}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Options */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {challenge.options?.map((option, idx) => {
            const colorClass = OPTION_COLORS[idx % OPTION_COLORS.length];

            let stateClass = "";
            if (showResult) {
              if (option === challenge.answer) {
                stateClass = "ring-2 ring-green-400 bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700";
              } else if (option === selectedAnswer) {
                stateClass = "ring-2 ring-red-400 bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700 opacity-70";
              } else {
                stateClass = "opacity-50";
              }
            }

            return (
              <motion.button
                key={option}
                whileHover={!showResult ? { scale: 1.02, y: -1 } : {}}
                whileTap={!showResult ? { scale: 0.98 } : {}}
                onClick={() => handleAnswer(option)}
                disabled={showResult}
                className={`relative rounded-2xl border-2 p-4 text-left text-sm font-medium transition-all ${
                  showResult
                    ? stateClass
                    : `border-transparent bg-white/60 dark:bg-white/10 hover:border-current hover:shadow-sm`
                }`}
              >
                {/* Colorful left accent */}
                {!showResult && (
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b ${colorClass.split(" ")[0]} ${colorClass.split(" ")[1]}`} />
                )}
                <span className="pl-2">{option}</span>
                {showResult && option === challenge.answer && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
                {showResult && option === selectedAnswer && option !== challenge.answer && (
                  <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Result */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {isCorrect ? (
                <div className="rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 text-white p-4 flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎉</span>
                    <div>
                      <p className="font-bold">Correct! Awesome job!</p>
                      {!isCompletedToday && (
                        <p className="text-xs opacity-90 mt-0.5">+1 streak 🔥 +{challenge.xpReward || 10} XP ⭐</p>
                      )}
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNext}
                    className="bg-white/20 hover:bg-white/30 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
                  >
                    Next →
                  </motion.button>
                </div>
              ) : (
                <div className="rounded-2xl bg-gradient-to-r from-red-400 to-rose-500 text-white p-4 flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">😅</span>
                    <div>
                      <p className="font-bold">Not quite!</p>
                      <p className="text-xs opacity-90 mt-0.5">
                        Answer: &ldquo;{challenge.answer}&rdquo;
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNext}
                    className="bg-white/20 hover:bg-white/30 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
                  >
                    Next →
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
