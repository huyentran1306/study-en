"use client";

/**
 * Word Scramble mini-game.
 *
 * Mechanics:
 * - Show an English word with letters scrambled into clickable tiles.
 * - Emoji + Vietnamese meaning serve as the hint.
 * - Player clicks tiles to append letters to the answer row, click a placed
 *   letter to send it back to the tile pool.
 * - 30-second timer per word. Session of 5 words.
 * - Scoring: 10 base + ceil(time_left / 3) time bonus, per word.
 * - Hint (5 coins) reveals the first letter.
 * - Runs confetti on a correct answer; fireXPParticles on tile place.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/contexts/game-context";
import { Mascot } from "@/components/mascot";
import { fireConfetti, fireCelebration } from "@/lib/confetti";
import { fireXPParticles } from "@/components/fx/xp-particles";

// Reuse the vocab list from games page; keep a local copy so this component
// is self-contained. Longer words = more interesting puzzles.
const WORD_BANK: { word: string; meaning: string; emoji: string }[] = [
  { word: "APPLE", meaning: "Quả táo", emoji: "🍎" },
  { word: "HOUSE", meaning: "Ngôi nhà", emoji: "🏠" },
  { word: "WATER", meaning: "Nước", emoji: "💧" },
  { word: "MUSIC", meaning: "Âm nhạc", emoji: "🎵" },
  { word: "HAPPY", meaning: "Vui vẻ", emoji: "😊" },
  { word: "HEART", meaning: "Trái tim", emoji: "❤️" },
  { word: "FLOWER", meaning: "Bông hoa", emoji: "🌸" },
  { word: "BRIDGE", meaning: "Cây cầu", emoji: "🌉" },
  { word: "GARDEN", meaning: "Khu vườn", emoji: "🌷" },
  { word: "OCEAN", meaning: "Đại dương", emoji: "🌊" },
  { word: "ORANGE", meaning: "Quả cam", emoji: "🍊" },
  { word: "SUMMER", meaning: "Mùa hè", emoji: "☀️" },
  { word: "WINTER", meaning: "Mùa đông", emoji: "❄️" },
  { word: "SCHOOL", meaning: "Trường học", emoji: "🏫" },
  { word: "FRIEND", meaning: "Bạn bè", emoji: "🤝" },
  { word: "COFFEE", meaning: "Cà phê", emoji: "☕" },
  { word: "ROCKET", meaning: "Tên lửa", emoji: "🚀" },
  { word: "PLANET", meaning: "Hành tinh", emoji: "🪐" },
  { word: "GUITAR", meaning: "Đàn guitar", emoji: "🎸" },
  { word: "RAINBOW", meaning: "Cầu vồng", emoji: "🌈" },
];

const TIMER_SECONDS = 30;
const WORDS_PER_SESSION = 5;
const HINT_COST = 5;

type Tile = {
  /** Stable id: `${attemptIndex}-${sourcePoolIndex}` so Framer animates correctly across rerenders. */
  id: string;
  letter: string;
};

type Phase = "intro" | "playing" | "result";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Scramble letters — retries up to 5 times if the shuffle lands on the original. */
function scramble(word: string, attempt = 0): string {
  if (word.length <= 1 || attempt >= 5) return word;
  const scrambled = shuffle(word.split("")).join("");
  if (scrambled === word) return scramble(word, attempt + 1);
  return scrambled;
}

export function WordScrambleGame() {
  const { addXP, addCoins, spendCoins, coins, language } = useGame();

  const [phase, setPhase] = useState<Phase>("intro");
  const [roundWords, setRoundWords] = useState<typeof WORD_BANK>([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [pool, setPool] = useState<Tile[]>([]);
  const [placed, setPlaced] = useState<Tile[]>([]);
  const [hintUsed, setHintUsed] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = roundWords[roundIdx];

  const loadWord = useCallback((word: (typeof WORD_BANK)[number], idx: number) => {
    const scrambled = scramble(word.word);
    const tiles: Tile[] = scrambled.split("").map((letter, i) => ({
      id: `${idx}-${i}`,
      letter,
    }));
    setPool(tiles);
    setPlaced([]);
    setHintUsed(false);
    setTimeLeft(TIMER_SECONDS);
    setFeedback(null);
  }, []);

  const startSession = () => {
    const picks = shuffle(WORD_BANK).slice(0, WORDS_PER_SESSION);
    setRoundWords(picks);
    setRoundIdx(0);
    setScore(0);
    setStreak(0);
    setPhase("playing");
    loadWord(picks[0], 0);
  };

  // Timer
  useEffect(() => {
    if (phase !== "playing") return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, roundIdx]);

  // Auto-advance when time runs out (if user didn't finish)
  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft > 0) return;
    // Times up — count as wrong, advance after a beat.
    setFeedback("wrong");
    setStreak(0);
    const t = setTimeout(() => advance(false, 0), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  const advance = (correct: boolean, gained: number) => {
    if (correct) setScore((s) => s + gained);
    const nextIdx = roundIdx + 1;
    if (nextIdx >= roundWords.length) {
      // Session over
      const finalScore = score + (correct ? gained : 0);
      setPhase("result");
      if (finalScore > 0) {
        addXP(finalScore);
        addCoins(Math.floor(finalScore / 3));
      }
      if (correct && streak + 1 >= 3) fireCelebration();
      return;
    }
    setRoundIdx(nextIdx);
    loadWord(roundWords[nextIdx], nextIdx);
  };

  const handleTileClick = (tile: Tile, e: React.MouseEvent) => {
    if (feedback) return;
    // Move tile from pool -> placed
    setPool((p) => p.filter((t) => t.id !== tile.id));
    setPlaced((p) => [...p, tile]);
    // Small XP particle for feedback
    fireXPParticles({ x: e.clientX, y: e.clientY, amount: 3, kind: "xp" });

    // Check completion
    const nextPlaced = [...placed, tile].map((t) => t.letter).join("");
    if (nextPlaced.length === current.word.length) {
      if (nextPlaced === current.word) {
        // Correct!
        setFeedback("correct");
        const timeBonus = Math.ceil(timeLeft / 3);
        const gained = 10 + timeBonus + (streak >= 2 ? 5 : 0);
        setStreak((s) => s + 1);
        fireConfetti({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2.2,
          count: 80,
          spread: 120,
        });
        setTimeout(() => advance(true, gained), 900);
      } else {
        // Wrong — nudge and let them try again (don't auto-advance).
        setFeedback("wrong");
        setStreak(0);
        setTimeout(() => {
          // Return tiles to pool in scrambled order so they can re-try.
          const rescrambled = shuffle([...pool.filter((t) => t.id !== tile.id), ...placed, tile]);
          setPool(rescrambled);
          setPlaced([]);
          setFeedback(null);
        }, 700);
      }
    }
  };

  const handlePlacedClick = (tile: Tile) => {
    if (feedback) return;
    setPlaced((p) => p.filter((t) => t.id !== tile.id));
    setPool((p) => [...p, tile]);
  };

  const useHint = () => {
    if (hintUsed || placed.length > 0) return;
    if (!spendCoins(HINT_COST)) return;
    setHintUsed(true);
    // Auto-place the first letter.
    const firstLetter = current.word[0];
    const tileIdx = pool.findIndex((t) => t.letter === firstLetter);
    if (tileIdx >= 0) {
      const tile = pool[tileIdx];
      setPool((p) => p.filter((_, i) => i !== tileIdx));
      setPlaced([tile]);
    }
  };

  // ───────── Render ─────────
  if (phase === "intro") {
    return (
      <div className="text-center py-12">
        <motion.div
          animate={{ rotate: [0, -8, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-6xl mb-4"
        >
          🔤
        </motion.div>
        <h3 className="text-xl font-bold mb-2">Word Scramble</h3>
        <p className="text-muted-foreground mb-6 text-sm max-w-md mx-auto">
          {language === "vi"
            ? "Sắp xếp các chữ cái bị xáo trộn thành từ tiếng Anh đúng! 5 từ mỗi lượt, mỗi từ 30 giây."
            : "Unscramble the letters to form the correct English word! 5 words per round, 30s each."}
        </p>
        <motion.button
          onClick={startSession}
          className="px-8 py-4 bg-gradient-kawaii text-white font-bold rounded-3xl shadow-kawaii"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🎮 Start Game
        </motion.button>
      </div>
    );
  }

  if (phase === "result") {
    return (
      <div className="text-center py-12">
        <Mascot mood={score > 40 ? "excited" : "cheering"} size="lg" />
        <h3 className="text-2xl font-bold mt-4 mb-2">
          {score > 40 ? "Amazing! 🎉" : "Nice work! 👏"}
        </h3>
        <p className="text-3xl font-bold text-kawaii-purple mb-2">{score} pts</p>
        <p className="text-sm text-muted-foreground mb-6">
          +{score} XP • +{Math.floor(score / 3)} 🪙
        </p>
        <motion.button
          onClick={startSession}
          className="px-6 py-3 bg-gradient-kawaii text-white font-bold rounded-2xl shadow-kawaii"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🔄 Play Again
        </motion.button>
      </div>
    );
  }

  // Playing state
  return (
    <div>
      {/* HUD */}
      <div className="flex justify-between items-center mb-4 text-sm font-bold">
        <span>
          📝 {roundIdx + 1} / {roundWords.length}
        </span>
        <span className="tabular-nums">
          <motion.span
            key={timeLeft}
            initial={{ scale: 1.3, color: timeLeft <= 5 ? "#ef4444" : undefined }}
            animate={{ scale: 1 }}
            className={timeLeft <= 5 ? "text-red-500" : ""}
          >
            ⏱ {timeLeft}s
          </motion.span>
        </span>
        <span>⭐ {score}</span>
      </div>

      {/* Hint card */}
      <div className="text-center mb-4 py-4 px-6 rounded-3xl bg-gradient-candy text-white shadow-kawaii">
        <motion.div
          className="text-5xl mb-1"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {current.emoji}
        </motion.div>
        <p className="font-bold text-lg">&ldquo;{current.meaning}&rdquo;</p>
        <p className="text-xs opacity-75 mt-1">
          {current.word.length} {language === "vi" ? "chữ cái" : "letters"}
        </p>
      </div>

      {/* Answer slots */}
      <div className="flex flex-wrap justify-center gap-2 min-h-[4rem] mb-4 px-2 py-3 rounded-2xl bg-white/50 dark:bg-gray-800/50 border-2 border-dashed border-kawaii-purple/30">
        {Array.from({ length: current.word.length }).map((_, i) => {
          const tile = placed[i];
          return (
            <motion.button
              key={`slot-${i}`}
              disabled={!tile || feedback !== null}
              onClick={() => tile && handlePlacedClick(tile)}
              className={`w-12 h-12 rounded-xl font-extrabold text-xl flex items-center justify-center transition-colors ${
                tile
                  ? feedback === "correct"
                    ? "bg-green-400 text-white shadow-lg"
                    : feedback === "wrong"
                    ? "bg-red-400 text-white shadow-lg"
                    : "bg-gradient-kawaii text-white shadow-kawaii hover:brightness-110"
                  : "bg-muted/50 text-muted-foreground"
              }`}
              whileTap={tile && !feedback ? { scale: 0.9 } : {}}
              animate={
                feedback === "wrong" && tile
                  ? { x: [0, -6, 6, -4, 4, 0] }
                  : { x: 0 }
              }
              transition={{ duration: 0.4 }}
            >
              {tile?.letter ?? ""}
            </motion.button>
          );
        })}
      </div>

      {/* Tile pool */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        <AnimatePresence>
          {pool.map((tile) => (
            <motion.button
              key={tile.id}
              layout
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={(e) => handleTileClick(tile, e)}
              disabled={feedback !== null}
              className="w-12 h-12 rounded-xl font-extrabold text-xl flex items-center justify-center bg-white dark:bg-gray-700 shadow-kawaii border-2 border-kawaii-purple/20 hover:bg-kawaii-purple/10 hover:border-kawaii-purple/50 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.1, y: -4 }}
              whileTap={{ scale: 0.9 }}
            >
              {tile.letter}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-2">
        <motion.button
          onClick={useHint}
          disabled={hintUsed || placed.length > 0 || coins < HINT_COST}
          className="px-4 py-2 rounded-2xl text-xs font-bold bg-kawaii-yellow/30 text-amber-700 disabled:opacity-40"
          whileHover={!hintUsed ? { scale: 1.05 } : {}}
          whileTap={!hintUsed ? { scale: 0.95 } : {}}
        >
          💡 {language === "vi" ? "Gợi ý" : "Hint"} ({HINT_COST} 🪙)
        </motion.button>
        <motion.button
          onClick={() => {
            // Shuffle tile pool
            setPool((p) => shuffle(p));
          }}
          disabled={feedback !== null}
          className="px-4 py-2 rounded-2xl text-xs font-bold bg-kawaii-sky/30 text-sky-700 disabled:opacity-40"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🔀 {language === "vi" ? "Xáo lại" : "Reshuffle"}
        </motion.button>
        <motion.button
          onClick={() => {
            setPool((p) => [...p, ...placed]);
            setPlaced([]);
          }}
          disabled={placed.length === 0 || feedback !== null}
          className="px-4 py-2 rounded-2xl text-xs font-bold bg-muted disabled:opacity-40"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ↩️ {language === "vi" ? "Xoá" : "Clear"}
        </motion.button>
      </div>
    </div>
  );
}
