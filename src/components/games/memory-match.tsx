"use client";

/**
 * Memory Match mini-game.
 *
 * Classic concentration game with an English-learning twist:
 * - Each pair is an English word card + its Vietnamese meaning card.
 * - Player flips 2 cards per turn; matches stay flipped, mismatches flip back.
 * - 3 difficulty grids:
 *     Easy   4x4 (8 pairs)
 *     Medium 6x4 (12 pairs)
 *     Hard   6x6 (18 pairs)
 * - Scoring: 100 per match, -2 per move, +streak bonus on consecutive matches.
 * - 3D flip animation via framer-motion's 3D transform (preserve-3d).
 * - Confetti on every match + full celebration when the board is cleared.
 */

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useGame } from "@/contexts/game-context";
import { Mascot } from "@/components/mascot";
import { fireConfetti, fireCelebration } from "@/lib/confetti";

type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { pairs: number; cols: number; label: string; labelVi: string; emoji: string }
> = {
  easy: { pairs: 8, cols: 4, label: "Easy", labelVi: "Dễ", emoji: "🌱" },
  medium: { pairs: 12, cols: 4, label: "Medium", labelVi: "Trung bình", emoji: "🌟" },
  hard: { pairs: 18, cols: 6, label: "Hard", labelVi: "Khó", emoji: "🔥" },
};

const WORD_BANK: { word: string; meaning: string; emoji: string }[] = [
  { word: "Apple", meaning: "Quả táo", emoji: "🍎" },
  { word: "House", meaning: "Ngôi nhà", emoji: "🏠" },
  { word: "Water", meaning: "Nước", emoji: "💧" },
  { word: "Music", meaning: "Âm nhạc", emoji: "🎵" },
  { word: "Happy", meaning: "Vui vẻ", emoji: "😊" },
  { word: "Heart", meaning: "Trái tim", emoji: "❤️" },
  { word: "Flower", meaning: "Bông hoa", emoji: "🌸" },
  { word: "Bridge", meaning: "Cây cầu", emoji: "🌉" },
  { word: "Garden", meaning: "Khu vườn", emoji: "🌷" },
  { word: "Ocean", meaning: "Đại dương", emoji: "🌊" },
  { word: "Orange", meaning: "Quả cam", emoji: "🍊" },
  { word: "Summer", meaning: "Mùa hè", emoji: "☀️" },
  { word: "Winter", meaning: "Mùa đông", emoji: "❄️" },
  { word: "School", meaning: "Trường học", emoji: "🏫" },
  { word: "Friend", meaning: "Bạn bè", emoji: "🤝" },
  { word: "Coffee", meaning: "Cà phê", emoji: "☕" },
  { word: "Rocket", meaning: "Tên lửa", emoji: "🚀" },
  { word: "Planet", meaning: "Hành tinh", emoji: "🪐" },
  { word: "Guitar", meaning: "Đàn guitar", emoji: "🎸" },
  { word: "Rainbow", meaning: "Cầu vồng", emoji: "🌈" },
];

type CardSide = "word" | "meaning";

type Card = {
  id: number;
  pairKey: string; // the English word, used to match two halves of a pair
  side: CardSide;
  display: string; // what the user sees when flipped
  emoji: string;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(difficulty: Difficulty, externalWords?: { word: string; meaning: string; emoji: string }[]): Card[] {
  const { pairs } = DIFFICULTY_CONFIG[difficulty];
  const bank = externalWords && externalWords.length >= pairs ? externalWords : WORD_BANK;
  const picks = shuffle(bank).slice(0, pairs);
  const cards: Card[] = [];
  let id = 0;
  for (const p of picks) {
    cards.push({ id: id++, pairKey: p.word, side: "word", display: p.word, emoji: p.emoji });
    cards.push({ id: id++, pairKey: p.word, side: "meaning", display: p.meaning, emoji: p.emoji });
  }
  return shuffle(cards);
}

export function MemoryMatchGame({ words: externalWords }: { words?: { word: string; meaning: string; emoji: string }[] } = {}) {
  const { addXP, addCoins, language } = useGame();

  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [deck, setDeck] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);

  const cfg = difficulty ? DIFFICULTY_CONFIG[difficulty] : null;

  const startGame = (d: Difficulty) => {
    setDifficulty(d);
    setDeck(buildDeck(d, externalWords));
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setStreak(0);
    setScore(0);
    setStartedAt(Date.now());
    setElapsed(0);
    setDone(false);
  };

  // Elapsed timer (display only)
  useEffect(() => {
    if (!startedAt || done) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startedAt, done]);

  const handleFlip = useCallback(
    (card: Card) => {
      if (done) return;
      if (matched.has(card.pairKey)) return;
      if (flipped.includes(card.id)) return;
      if (flipped.length >= 2) return;

      const nextFlipped = [...flipped, card.id];
      setFlipped(nextFlipped);

      if (nextFlipped.length === 2) {
        setMoves((m) => m + 1);
        const [aId, bId] = nextFlipped;
        const a = deck.find((c) => c.id === aId)!;
        const b = deck.find((c) => c.id === bId)!;

        if (a.pairKey === b.pairKey && a.side !== b.side) {
          // Match!
          const newStreak = streak + 1;
          const gained = 100 + (newStreak >= 2 ? 20 * (newStreak - 1) : 0);
          setTimeout(() => {
            setMatched((prev) => {
              const next = new Set(prev);
              next.add(a.pairKey);
              return next;
            });
            setFlipped([]);
            setScore((s) => Math.max(0, s + gained - 2));
            setStreak(newStreak);
            fireConfetti({
              count: 40,
              spread: 80,
              y: window.innerHeight / 2,
              velocity: 22,
            });
          }, 450);
        } else {
          // Miss — flip back shortly.
          setStreak(0);
          setScore((s) => Math.max(0, s - 2));
          setTimeout(() => setFlipped([]), 900);
        }
      }
    },
    [flipped, matched, deck, streak, done],
  );

  // Win detection
  useEffect(() => {
    if (!cfg) return;
    if (done) return;
    if (matched.size === cfg.pairs && cfg.pairs > 0) {
      setDone(true);
      const timeBonus = Math.max(0, cfg.pairs * 30 - elapsed);
      const totalScore = score + timeBonus;
      addXP(Math.floor(totalScore / 4));
      addCoins(Math.floor(totalScore / 10));
      setTimeout(() => fireCelebration(), 200);
    }
  }, [matched, cfg, elapsed, score, addXP, addCoins, done]);

  // ───────── Render ─────────

  if (!difficulty) {
    return (
      <div className="text-center py-8">
        <motion.div
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-6xl mb-4"
        >
          🃏
        </motion.div>
        <h3 className="text-xl font-bold mb-2">Memory Match</h3>
        <p className="text-muted-foreground mb-6 text-sm max-w-md mx-auto">
          {language === "vi"
            ? "Lật thẻ để tìm cặp: từ tiếng Anh ↔ nghĩa tiếng Việt. Ghi nhớ vị trí!"
            : "Flip cards to find pairs: English word ↔ Vietnamese meaning. Remember positions!"}
        </p>
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
          {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((d) => {
            const c = DIFFICULTY_CONFIG[d];
            return (
              <motion.button
                key={d}
                onClick={() => startGame(d)}
                className="p-4 rounded-2xl bg-gradient-kawaii text-white shadow-kawaii"
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="text-3xl">{c.emoji}</div>
                <div className="font-bold text-sm mt-1">
                  {language === "vi" ? c.labelVi : c.label}
                </div>
                <div className="text-xs opacity-80">{c.pairs} pairs</div>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  if (done && cfg) {
    const timeBonus = Math.max(0, cfg.pairs * 30 - elapsed);
    const finalScore = score + timeBonus;
    return (
      <div className="text-center py-8">
        <Mascot mood="excited" size="lg" />
        <h3 className="text-2xl font-bold mt-4 mb-2">
          {language === "vi" ? "Tuyệt vời!" : "Memory Master!"} 🎉
        </h3>
        <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto my-4 text-sm">
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl py-2">
            <div className="font-bold text-lg">{moves}</div>
            <div className="text-xs text-muted-foreground">
              {language === "vi" ? "lượt" : "moves"}
            </div>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl py-2">
            <div className="font-bold text-lg">{elapsed}s</div>
            <div className="text-xs text-muted-foreground">
              {language === "vi" ? "thời gian" : "time"}
            </div>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl py-2">
            <div className="font-bold text-lg">+{timeBonus}</div>
            <div className="text-xs text-muted-foreground">
              {language === "vi" ? "thưởng" : "time bonus"}
            </div>
          </div>
        </div>
        <p className="text-3xl font-bold text-kawaii-purple mb-2">{finalScore} pts</p>
        <p className="text-sm text-muted-foreground mb-6">
          +{Math.floor(finalScore / 4)} XP • +{Math.floor(finalScore / 10)} 🪙
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <motion.button
            onClick={() => startGame(difficulty)}
            className="px-6 py-3 bg-gradient-kawaii text-white font-bold rounded-2xl shadow-kawaii"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🔄 {language === "vi" ? "Chơi lại" : "Play Again"}
          </motion.button>
          <motion.button
            onClick={() => setDifficulty(null)}
            className="px-6 py-3 bg-muted font-bold rounded-2xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ⚙️ {language === "vi" ? "Đổi cấp" : "Change Level"}
          </motion.button>
        </div>
      </div>
    );
  }

  // Playing
  return (
    <div>
      {/* HUD */}
      <div className="flex justify-between items-center mb-4 text-sm font-bold flex-wrap gap-2">
        <span className="flex items-center gap-1.5">
          🃏 {matched.size}/{cfg!.pairs}
        </span>
        <span className="tabular-nums">⏱ {elapsed}s</span>
        <span>🎯 {moves} moves</span>
        <span className={streak >= 2 ? "text-kawaii-pink animate-pulse" : ""}>
          🔥 x{streak}
        </span>
        <span>⭐ {score}</span>
      </div>

      {/* Board */}
      <div
        className="grid gap-2 sm:gap-3"
        style={{ gridTemplateColumns: `repeat(${cfg!.cols}, minmax(0, 1fr))` }}
      >
        {deck.map((card) => {
          const isMatched = matched.has(card.pairKey);
          const isFlipped = flipped.includes(card.id) || isMatched;
          return (
            <MemoryCard
              key={card.id}
              card={card}
              flipped={isFlipped}
              matched={isMatched}
              onClick={() => handleFlip(card)}
            />
          );
        })}
      </div>
    </div>
  );
}

interface MemoryCardProps {
  card: Card;
  flipped: boolean;
  matched: boolean;
  onClick: () => void;
}

function MemoryCard({ card, flipped, matched, onClick }: MemoryCardProps) {
  return (
    <motion.button
      onClick={onClick}
      className="relative aspect-[3/4] w-full rounded-2xl"
      style={{ perspective: 1000 }}
      whileHover={!matched && !flipped ? { y: -4 } : {}}
      whileTap={!matched && !flipped ? { scale: 0.96 } : {}}
      disabled={matched}
      aria-label={flipped ? card.display : "Hidden card"}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Back (hidden side) */}
        <div
          className="absolute inset-0 rounded-2xl flex items-center justify-center bg-gradient-kawaii shadow-kawaii text-white"
          style={{ backfaceVisibility: "hidden" }}
        >
          <motion.span
            className="text-3xl"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            ✨
          </motion.span>
        </div>
        {/* Front (revealed side) */}
        <div
          className={`absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-1.5 text-center ${
            matched
              ? "bg-gradient-mint shadow-kawaii-mint ring-2 ring-emerald-300"
              : card.side === "word"
              ? "bg-gradient-sky shadow-kawaii-sky"
              : "bg-gradient-pink shadow-kawaii-pink"
          } text-white`}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <span className="text-xl sm:text-2xl mb-0.5">{card.emoji}</span>
          <span className="font-bold text-[11px] sm:text-sm leading-tight break-words">
            {card.display}
          </span>
        </div>
      </motion.div>
    </motion.button>
  );
}
