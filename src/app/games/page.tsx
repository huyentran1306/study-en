"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame, useTranslation } from "@/contexts/game-context";
import { Mascot } from "@/components/mascot";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { WordScrambleGame } from "@/components/games/word-scramble";
import { MemoryMatchGame } from "@/components/games/memory-match";

// ─── Word Data ─────────────────────────────────────────────
const GAME_WORDS = [
  { word: "Apple", meaning: "Quả táo", emoji: "🍎" },
  { word: "Cat", meaning: "Con mèo", emoji: "🐱" },
  { word: "Book", meaning: "Cuốn sách", emoji: "📖" },
  { word: "Sun", meaning: "Mặt trời", emoji: "☀️" },
  { word: "Star", meaning: "Ngôi sao", emoji: "⭐" },
  { word: "Fish", meaning: "Con cá", emoji: "🐟" },
  { word: "Moon", meaning: "Mặt trăng", emoji: "🌙" },
  { word: "Tree", meaning: "Cái cây", emoji: "🌳" },
  { word: "Dog", meaning: "Con chó", emoji: "🐶" },
  { word: "Bird", meaning: "Con chim", emoji: "🐦" },
  { word: "House", meaning: "Ngôi nhà", emoji: "🏠" },
  { word: "Water", meaning: "Nước", emoji: "💧" },
  { word: "Flower", meaning: "Bông hoa", emoji: "🌸" },
  { word: "Music", meaning: "Âm nhạc", emoji: "🎵" },
  { word: "Happy", meaning: "Vui vẻ", emoji: "😊" },
  { word: "Heart", meaning: "Trái tim", emoji: "❤️" },
];

// ─── Catch the Word Game ───────────────────────────────────
interface FallingWord {
  id: number;
  word: string;
  meaning: string;
  emoji: string;
  x: number;
  speed: number;
  y: number;
}

function CatchTheWordGame() {
  const { addXP, addCoins, language } = useGame();
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [targetWord, setTargetWord] = useState(GAME_WORDS[0]);
  const [fallingWords, setFallingWords] = useState<FallingWord[]>([]);
  const [gameActive, setGameActive] = useState(false);
  const [wordId, setWordId] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const spawnWord = useCallback(() => {
    const randomWord = GAME_WORDS[Math.floor(Math.random() * GAME_WORDS.length)];
    setWordId((prev) => prev + 1);
    setFallingWords((prev) => [
      ...prev,
      {
        id: wordId,
        word: randomWord.word,
        meaning: randomWord.meaning,
        emoji: randomWord.emoji,
        x: Math.random() * 80 + 10,
        speed: 2 + Math.random() * 2,
        y: -10,
      },
    ]);
  }, [wordId]);

  useEffect(() => {
    if (!gameActive || gameOver) return;
    const interval = setInterval(spawnWord, 1500);
    return () => clearInterval(interval);
  }, [gameActive, gameOver, spawnWord]);

  useEffect(() => {
    if (!gameActive || gameOver) return;
    const tick = setInterval(() => {
      setFallingWords((prev) => {
        const updated = prev
          .map((w) => ({ ...w, y: w.y + w.speed }))
          .filter((w) => {
            if (w.y > 100) {
              if (w.word === targetWord.word) {
                setLives((l) => {
                  const newL = l - 1;
                  if (newL <= 0) setGameOver(true);
                  return newL;
                });
              }
              return false;
            }
            return true;
          });
        return updated;
      });
    }, 50);
    return () => clearInterval(tick);
  }, [gameActive, gameOver, targetWord.word]);

  const handleCatch = (word: FallingWord) => {
    if (word.word === targetWord.word) {
      setScore((s) => s + 10);
      setFallingWords((prev) => prev.filter((w) => w.id !== word.id));
      // New target
      const newTarget = GAME_WORDS[Math.floor(Math.random() * GAME_WORDS.length)];
      setTargetWord(newTarget);
    } else {
      setLives((l) => {
        const newL = l - 1;
        if (newL <= 0) setGameOver(true);
        return newL;
      });
      setFallingWords((prev) => prev.filter((w) => w.id !== word.id));
    }
  };

  const startGame = () => {
    setScore(0);
    setLives(3);
    setFallingWords([]);
    setGameOver(false);
    setGameActive(true);
    setTargetWord(GAME_WORDS[Math.floor(Math.random() * GAME_WORDS.length)]);
  };

  const endGame = () => {
    setGameActive(false);
    setGameOver(false);
    addXP(Math.floor(score / 2));
    addCoins(Math.floor(score / 5));
  };

  if (!gameActive && !gameOver) {
    return (
      <div className="text-center py-12">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-6xl mb-4"
        >
          🎯
        </motion.div>
        <h3 className="text-xl font-bold mb-2">Catch the Word!</h3>
        <p className="text-muted-foreground mb-6 text-sm">
          {language === "vi"
            ? "Bắt từ đúng rơi xuống! Chạm từ khớp với nghĩa đã cho."
            : "Catch the right falling word! Tap the word that matches the given meaning."}
        </p>
        <motion.button
          onClick={startGame}
          className="px-8 py-4 bg-gradient-kawaii text-white font-bold rounded-3xl shadow-kawaii"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🎮 Start Game
        </motion.button>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="text-center py-12">
        <Mascot mood="cheering" size="lg" />
        <h3 className="text-2xl font-bold mt-4 mb-2">Game Over!</h3>
        <p className="text-3xl font-bold text-kawaii-purple mb-2">{score} pts</p>
        <p className="text-sm text-muted-foreground mb-6">
          +{Math.floor(score / 2)} XP • +{Math.floor(score / 5)} 🪙
        </p>
        <div className="flex gap-3 justify-center">
          <motion.button
            onClick={startGame}
            className="px-6 py-3 bg-gradient-kawaii text-white font-bold rounded-2xl shadow-kawaii"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🔄 Play Again
          </motion.button>
          <motion.button
            onClick={endGame}
            className="px-6 py-3 bg-muted font-bold rounded-2xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ✅ Collect Rewards
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* HUD */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className="text-xl">{i < lives ? "❤️" : "🖤"}</span>
          ))}
        </div>
        <div className="text-lg font-bold">⭐ {score}</div>
      </div>

      {/* Target */}
      <motion.div
        className="text-center py-3 mb-4 rounded-2xl bg-gradient-kawaii text-white font-bold shadow-kawaii"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <span className="text-2xl mr-2">{targetWord.emoji}</span>
        Find: &quot;{language === "vi" ? targetWord.word : targetWord.meaning}&quot;
      </motion.div>

      {/* Game area */}
      <div className="relative h-80 bg-gradient-to-b from-sky-100/50 to-green-100/50 dark:from-sky-900/20 dark:to-green-900/20 rounded-3xl overflow-hidden border-2 border-kawaii-purple/10">
        <AnimatePresence>
          {fallingWords.map((word) => (
            <motion.button
              key={word.id}
              className="absolute px-4 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl shadow-kawaii font-bold text-sm cursor-pointer hover:bg-kawaii-purple/20 transition-colors"
              style={{ left: `${word.x}%`, top: `${word.y}%` }}
              onClick={() => handleCatch(word)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              {word.emoji} {word.word}
            </motion.button>
          ))}
        </AnimatePresence>

        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-green-300/50 to-transparent" />
      </div>
    </div>
  );
}

// ─── Drag & Drop Matching Game ─────────────────────────────
function MatchingGame() {
  const { addXP, addCoins, language } = useGame();
  const [pairs, setPairs] = useState<typeof GAME_WORDS>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [shuffledMeanings, setShuffledMeanings] = useState<string[]>([]);
  const [selectedMeaning, setSelectedMeaning] = useState<number | null>(null);
  const [wrongPair, setWrongPair] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const startGame = () => {
    const shuffled = [...GAME_WORDS].sort(() => Math.random() - 0.5).slice(0, 6);
    setPairs(shuffled);
    setShuffledMeanings(shuffled.map((w) => w.meaning).sort(() => Math.random() - 0.5));
    setMatched(new Set());
    setSelected(null);
    setSelectedMeaning(null);
    setScore(0);
    setGameStarted(true);
  };

  const handleWordClick = (idx: number) => {
    if (matched.has(idx)) return;
    setSelected(idx);

    if (selectedMeaning !== null) {
      // Check match
      if (shuffledMeanings[selectedMeaning] === pairs[idx].meaning) {
        setMatched((prev) => { const s = new Set(Array.from(prev)); s.add(idx); return s; });
        setScore((s) => s + 15);
        setSelected(null);
        setSelectedMeaning(null);
      } else {
        setWrongPair([idx, selectedMeaning]);
        setTimeout(() => {
          setWrongPair(null);
          setSelected(null);
          setSelectedMeaning(null);
        }, 500);
      }
    }
  };

  const handleMeaningClick = (idx: number) => {
    const meaningUsed = pairs.some(
      (p, i) => matched.has(i) && p.meaning === shuffledMeanings[idx]
    );
    if (meaningUsed) return;
    setSelectedMeaning(idx);

    if (selected !== null) {
      if (shuffledMeanings[idx] === pairs[selected].meaning) {
        setMatched((prev) => { const s = new Set(Array.from(prev)); s.add(selected); return s; });
        setScore((s) => s + 15);
        setSelected(null);
        setSelectedMeaning(null);
      } else {
        setWrongPair([selected, idx]);
        setTimeout(() => {
          setWrongPair(null);
          setSelected(null);
          setSelectedMeaning(null);
        }, 500);
      }
    }
  };

  const isComplete = matched.size === pairs.length && pairs.length > 0;

  if (!gameStarted) {
    return (
      <div className="text-center py-12">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-6xl mb-4"
        >
          🧩
        </motion.div>
        <h3 className="text-xl font-bold mb-2">Word Matching</h3>
        <p className="text-muted-foreground mb-6 text-sm">
          {language === "vi"
            ? "Nối từ tiếng Anh với nghĩa tiếng Việt!"
            : "Match English words with their meanings!"}
        </p>
        <motion.button
          onClick={startGame}
          className="px-8 py-4 bg-gradient-kawaii text-white font-bold rounded-3xl shadow-kawaii"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🎮 Start Game
        </motion.button>
      </div>
    );
  }

  if (isComplete) {
    addXP(score);
    addCoins(Math.floor(score / 3));
    return (
      <div className="text-center py-12">
        <Mascot mood="excited" size="lg" />
        <h3 className="text-2xl font-bold mt-4 mb-2">Perfect Match! 🎉</h3>
        <p className="text-3xl font-bold text-kawaii-purple mb-2">{score} pts</p>
        <p className="text-sm text-muted-foreground mb-6">
          +{score} XP • +{Math.floor(score / 3)} 🪙
        </p>
        <motion.button
          onClick={startGame}
          className="px-6 py-3 bg-gradient-kawaii text-white font-bold rounded-2xl shadow-kawaii"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🔄 Play Again
        </motion.button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="font-bold">Matched: {matched.size}/{pairs.length}</p>
        <p className="font-bold">⭐ {score}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Words column */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-center text-muted-foreground mb-2">English</p>
          {pairs.map((pair, idx) => (
            <motion.button
              key={`word-${idx}`}
              onClick={() => handleWordClick(idx)}
              disabled={matched.has(idx)}
              className={`w-full py-3 px-4 rounded-2xl font-bold text-sm transition-all ${
                matched.has(idx)
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 opacity-60"
                  : selected === idx
                  ? "bg-kawaii-purple/20 ring-2 ring-kawaii-purple"
                  : wrongPair && wrongPair[0] === idx
                  ? "bg-red-100 dark:bg-red-900/30 ring-2 ring-red-400"
                  : "bg-white/60 dark:bg-gray-800/60 hover:bg-kawaii-purple/10"
              }`}
              whileHover={!matched.has(idx) ? { scale: 1.02 } : {}}
              whileTap={!matched.has(idx) ? { scale: 0.98 } : {}}
            >
              {pair.emoji} {pair.word}
            </motion.button>
          ))}
        </div>

        {/* Meanings column */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-center text-muted-foreground mb-2">Meaning</p>
          {shuffledMeanings.map((meaning, idx) => {
            const meaningMatched = pairs.some(
              (p, i) => matched.has(i) && p.meaning === meaning
            );
            return (
              <motion.button
                key={`meaning-${idx}`}
                onClick={() => handleMeaningClick(idx)}
                disabled={meaningMatched}
                className={`w-full py-3 px-4 rounded-2xl font-bold text-sm transition-all ${
                  meaningMatched
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 opacity-60"
                    : selectedMeaning === idx
                    ? "bg-kawaii-sky/30 ring-2 ring-kawaii-sky"
                    : wrongPair && wrongPair[1] === idx
                    ? "bg-red-100 dark:bg-red-900/30 ring-2 ring-red-400"
                    : "bg-white/60 dark:bg-gray-800/60 hover:bg-kawaii-sky/10"
                }`}
                whileHover={!meaningMatched ? { scale: 1.02 } : {}}
                whileTap={!meaningMatched ? { scale: 0.98 } : {}}
              >
                {meaning}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Games Page ───────────────────────────────────────
type GameId = "catch" | "match" | "scramble" | "memory";

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const t = useTranslation();

  const games: { id: GameId; title: string; emoji: string; desc: string; gradient: string }[] = [
    {
      id: "catch",
      title: "Catch the Word",
      emoji: "🎯",
      desc: "Catch falling words that match the given meaning!",
      gradient: "from-orange-300 to-red-400",
    },
    {
      id: "match",
      title: "Word Matching",
      emoji: "🧩",
      desc: "Match English words with their translations!",
      gradient: "from-blue-300 to-purple-400",
    },
    {
      id: "scramble",
      title: "Word Scramble",
      emoji: "🔤",
      desc: "Unscramble the letters to form the English word!",
      gradient: "from-pink-300 to-fuchsia-400",
    },
    {
      id: "memory",
      title: "Memory Match",
      emoji: "🃏",
      desc: "Flip cards to pair English words with their meanings!",
      gradient: "from-emerald-300 to-sky-400",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-6">
        {activeGame && (
          <motion.button
            onClick={() => setActiveGame(null)}
            className="p-2 rounded-xl bg-muted hover:bg-kawaii-purple/10"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
        )}
        <h1 className="text-2xl font-bold">
          <span className="bg-gradient-kawaii bg-clip-text text-transparent">
            🎮 {t.games}
          </span>
        </h1>
      </div>

      {!activeGame ? (
        <motion.div
          className="grid gap-4 sm:grid-cols-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {games.map((game) => (
            <motion.button
              key={game.id}
              onClick={() => setActiveGame(game.id)}
              className={`p-6 rounded-3xl bg-gradient-to-br ${game.gradient} text-white text-left shadow-lg`}
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.97 }}
            >
              <motion.span
                className="text-5xl block mb-3"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {game.emoji}
              </motion.span>
              <h3 className="text-xl font-bold mb-1">{game.title}</h3>
              <p className="text-sm opacity-80">{game.desc}</p>
            </motion.button>
          ))}
        </motion.div>
      ) : (
        <motion.div
          className="rounded-3xl bg-white/70 dark:bg-gray-800/70 backdrop-blur p-6 shadow-kawaii border-2 border-kawaii-purple/20"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {activeGame === "catch" && <CatchTheWordGame />}
          {activeGame === "match" && <MatchingGame />}
          {activeGame === "scramble" && <WordScrambleGame />}
          {activeGame === "memory" && <MemoryMatchGame />}
        </motion.div>
      )}

      {/* Quick link back */}
      {!activeGame && (
        <div className="mt-8 text-center">
          <Link href="/">
            <motion.span
              className="text-sm text-muted-foreground hover:text-kawaii-purple transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              ← Back to Home
            </motion.span>
          </Link>
        </div>
      )}
    </div>
  );
}
