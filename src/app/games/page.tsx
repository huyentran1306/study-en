"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame, useTranslation } from "@/contexts/game-context";
import { Mascot } from "@/components/mascot";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WordScrambleGame } from "@/components/games/word-scramble";
import { MemoryMatchGame } from "@/components/games/memory-match";
import { useApiVocab } from "@/hooks/use-api-vocab";

// ─── Word Data (Business, Workplace & Fluent Communication) ──────────
const GAME_WORDS = [
  { word: "Collaborate", meaning: "Hợp tác, cộng tác", emoji: "🤝" },
  { word: "Negotiate", meaning: "Thương lượng, đàm phán", emoji: "💼" },
  { word: "Deliverable", meaning: "Sản phẩm bàn giao", emoji: "📦" },
  { word: "Deadline", meaning: "Hạn chót công việc", emoji: "⏰" },
  { word: "Initiative", meaning: "Sáng kiến, chủ động", emoji: "💡" },
  { word: "Perspective", meaning: "Góc nhìn, quan điểm", emoji: "👁️" },
  { word: "Implement", meaning: "Triển khai, thực thi", emoji: "⚙️" },
  { word: "Consensus", meaning: "Sự đồng thuận chung", emoji: "✅" },
  { word: "Objective", meaning: "Mục tiêu chiến lược", emoji: "🎯" },
  { word: "Feedback", meaning: "Ý kiến phản hồi", emoji: "💬" },
  { word: "Efficiency", meaning: "Hiệu quả, năng suất", emoji: "⚡" },
  { word: "Strategy", meaning: "Chiến lược hành động", emoji: "🗺️" },
  { word: "Facilitate", meaning: "Tạo điều kiện, điều phối", emoji: "🔄" },
  { word: "Benchmark", meaning: "Tiêu chuẩn đối sánh", emoji: "📊" },
  { word: "Synergy", meaning: "Hiệu ứng cộng hưởng", emoji: "🔗" },
  { word: "Prioritize", meaning: "Ưu tiên xử lý", emoji: "🔝" },
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

function CatchTheWordGame({ words: externalWords }: { words?: { word: string; meaning: string; emoji: string }[] } = {}) {
  const { addXP, addCoins, language } = useGame();
  const wordBank = externalWords && externalWords.length > 0 ? externalWords : GAME_WORDS;
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [targetWord, setTargetWord] = useState(wordBank[0]);
  const [fallingWords, setFallingWords] = useState<FallingWord[]>([]);
  const [gameActive, setGameActive] = useState(false);
  const [wordId, setWordId] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const spawnWord = useCallback(() => {
    const randomWord = wordBank[Math.floor(Math.random() * wordBank.length)];
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
  }, [wordId, wordBank]);

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
      const newTarget = wordBank[Math.floor(Math.random() * wordBank.length)];
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
    setTargetWord(wordBank[Math.floor(Math.random() * wordBank.length)]);
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
            : "Nhanh tay bắt đúng từ rơi xuống theo nghĩa tiếng Việt được chỉ định!"}
        </p>
        <motion.button
          onClick={startGame}
          className="btn-pro px-8 py-3.5 text-sm font-bold"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Bắt đầu thử thách
        </motion.button>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="text-center py-12">
        <Mascot mood="cheering" size="lg" />
        <h3 className="text-2xl font-bold mt-4 mb-2">Hoàn Thành!</h3>
        <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-2">{score} pts</p>
        <p className="text-xs text-muted-foreground mb-6">
          +{Math.floor(score / 2)} XP • +{Math.floor(score / 5)} Coins
        </p>
        <div className="flex gap-3 justify-center">
          <motion.button
            onClick={startGame}
            className="btn-pro px-6 py-3 text-xs font-bold"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Chơi lại
          </motion.button>
          <motion.button
            onClick={endGame}
            className="px-6 py-3 bg-muted hover:bg-slate-200 dark:hover:bg-slate-700 font-bold rounded-xl text-xs"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Nhận thưởng
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
      <div className="pro-card text-center py-4 mb-4 border-indigo-500/30 bg-slate-900 text-white">
        Tìm từ tương ứng: &ldquo;<strong className="text-indigo-300">{language === "vi" ? targetWord.word : targetWord.meaning}</strong>&rdquo;
      </div>

      {/* Game area */}
      <div className="relative h-80 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <AnimatePresence>
          {fallingWords.map((word) => (
            <motion.button
              key={word.id}
              className="absolute px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl shadow-sm font-bold text-xs cursor-pointer hover:border-indigo-500 transition-colors text-foreground"
              style={{ left: `${word.x}%`, top: `${word.y}%` }}
              onClick={() => handleCatch(word)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              {word.word}
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
function MatchingGame({ words: externalWords }: { words?: { word: string; meaning: string; emoji: string }[] } = {}) {
  const { addXP, addCoins, language } = useGame();
  const wordBank = externalWords && externalWords.length > 0 ? externalWords : GAME_WORDS;
  const [pairs, setPairs] = useState<typeof GAME_WORDS>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [shuffledMeanings, setShuffledMeanings] = useState<string[]>([]);
  const [selectedMeaning, setSelectedMeaning] = useState<number | null>(null);
  const [wrongPair, setWrongPair] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [rewardGiven, setRewardGiven] = useState(false);

  const isComplete = matched.size === pairs.length && pairs.length > 0;

  // Award XP only once when game completes
  useEffect(() => {
    if (isComplete && !rewardGiven) {
      // Compute score from matched pairs to avoid stale closure issue
      const finalScore = matched.size * 15;
      if (finalScore > 0) {
        addXP(finalScore);
        addCoins(Math.floor(finalScore / 3));
        setRewardGiven(true);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, rewardGiven]);

  const startGame = () => {
    const shuffled = [...wordBank].sort(() => Math.random() - 0.5).slice(0, 6);
    setPairs(shuffled);
    setShuffledMeanings(shuffled.map((w) => w.meaning).sort(() => Math.random() - 0.5));
    setMatched(new Set());
    setSelected(null);
    setSelectedMeaning(null);
    setScore(0);
    setGameStarted(true);
    setRewardGiven(false);
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
          className="btn-pro px-8 py-3.5 text-sm font-bold"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Bắt đầu nối từ
        </motion.button>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="text-center py-12">
        <Mascot mood="excited" size="lg" />
        <h3 className="text-2xl font-bold mt-4 mb-2">Hoàn Thành Xuất Sắc!</h3>
        <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-2">{score} pts</p>
        <p className="text-xs text-muted-foreground mb-6">
          +{score} XP • +{Math.floor(score / 3)} Coins
        </p>
        <motion.button
          onClick={startGame}
          className="btn-pro px-6 py-3 text-xs font-bold"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Lượt ghép mới
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
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all border ${
                matched.has(idx)
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 opacity-60"
                  : selected === idx
                  ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20"
                  : wrongPair && wrongPair[0] === idx
                  ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300"
                  : "bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-750 hover:border-indigo-500/50"
              }`}
              whileHover={!matched.has(idx) ? { scale: 1.01 } : {}}
              whileTap={!matched.has(idx) ? { scale: 0.99 } : {}}
            >
              {pair.word}
            </motion.button>
          ))}
        </div>

        {/* Meanings column */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-center text-muted-foreground mb-2">Ý Nghĩa</p>
          {shuffledMeanings.map((meaning, idx) => {
            const meaningMatched = pairs.some(
              (p, i) => matched.has(i) && p.meaning === meaning
            );
            return (
              <motion.button
                key={`meaning-${idx}`}
                onClick={() => handleMeaningClick(idx)}
                disabled={meaningMatched}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all border ${
                  meaningMatched
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 opacity-60"
                    : selectedMeaning === idx
                    ? "bg-sky-50 dark:bg-sky-950/60 border-sky-600 text-sky-600 dark:text-sky-400 ring-2 ring-sky-500/20"
                    : wrongPair && wrongPair[1] === idx
                    ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300"
                    : "bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-750 hover:border-sky-500/50"
                }`}
                whileHover={!meaningMatched ? { scale: 1.01 } : {}}
                whileTap={!meaningMatched ? { scale: 0.99 } : {}}
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
  const { activeStudyLanguage, hskLevel } = useGame();
  // Load vocab from API based on active study language for games
  const [apiWords] = useApiVocab(activeStudyLanguage, activeStudyLanguage === 'zh' ? hskLevel : undefined);
  // Convert to game word format (sample 30 words)
  const gameWords = apiWords.slice(0, 30).map((w) => ({
    word: w.word,
    meaning: w.meaning,
    emoji: w.emoji || "📖",
  }));

  const games: { id: GameId; title: string; badge: string; emoji: string; desc: string; gradient: string }[] = [
    {
      id: "catch",
      title: "Speed Falling Recall",
      badge: "Phản xạ nhanh",
      emoji: "🎯",
      desc: "Bắt đúng từ vựng tiếng Anh tương ứng với nghĩa tiếng Việt trước khi chạm đáy.",
      gradient: "from-indigo-600 to-violet-600",
    },
    {
      id: "match",
      title: "Executive Word Matching",
      badge: "Nối cặp từ",
      emoji: "🧩",
      desc: "Nối nhanh các thuật ngữ tiếng Anh với nghĩa chuyên môn tương ứng.",
      gradient: "from-sky-600 to-indigo-600",
    },
    {
      id: "scramble",
      title: "Word Scramble Sprint",
      badge: "Sắp xếp ký tự",
      emoji: "🔤",
      desc: "Tái cấu trúc các chữ cái bị đảo lộn thành từ vựng tiếng Anh chuẩn xác.",
      gradient: "from-violet-600 to-purple-600",
    },
    {
      id: "memory",
      title: "Memory Recall Matrix",
      badge: "Trí nhớ thị giác",
      emoji: "🃏",
      desc: "Lật thẻ và ghép đôi các cụm từ vựng để củng cố liên kết thần kinh.",
      gradient: "from-emerald-600 to-teal-600",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center gap-3">
        {activeGame ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveGame(null)}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Thoát bài tập
          </Button>
        ) : (
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Về trang chủ
          </Link>
        )}
      </div>

      {!activeGame && (
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <span>Timed Active Recall</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Language Arena & Active Recall Lab
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Rèn luyện tốc độ xử lý ngôn ngữ dưới áp lực thời gian. Chuyển hóa vốn từ vựng từ nhận biết thụ động sang phản xạ chủ động.
          </p>
        </div>
      )}

      {!activeGame ? (
        <motion.div
          className="grid gap-4 sm:grid-cols-2"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {games.map((game) => (
            <motion.button
              key={game.id}
              onClick={() => setActiveGame(game.id)}
              className="group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-left shadow-xs hover:border-indigo-500/50 hover:shadow-md transition-all flex flex-col justify-between"
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${game.gradient} flex items-center justify-center text-white text-2xl shadow-xs`}
                  >
                    {game.emoji}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                    {game.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {game.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {game.desc}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <span>Vào phòng rèn luyện</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </motion.button>
          ))}
        </motion.div>
      ) : (
        <motion.div
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {activeGame === "catch" && (
            <CatchTheWordGame words={gameWords.length >= 4 ? gameWords : undefined} />
          )}
          {activeGame === "match" && (
            <MatchingGame words={gameWords.length >= 4 ? gameWords : undefined} />
          )}
          {activeGame === "scramble" && (
            <WordScrambleGame words={gameWords.length >= 5 ? gameWords : undefined} />
          )}
          {activeGame === "memory" && (
            <MemoryMatchGame words={gameWords.length >= 8 ? gameWords : undefined} />
          )}
        </motion.div>
      )}
    </div>
  );
}
