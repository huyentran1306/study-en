"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGame } from "@/contexts/game-context";
import { useSTTRecorder } from "@/hooks/use-stt-recorder";
import Link from "next/link";

const MINIMAL_PAIRS = [
  {
    category: "Ship / Sheep",
    emoji: "🚢🐑",
    description: "Âm /ɪ/ ngắn vs /iː/ dài",
    pairs: [
      { a: "ship", b: "sheep" },
      { a: "bit", b: "beat" },
      { a: "sit", b: "seat" },
      { a: "fill", b: "feel" },
      { a: "live", b: "leave" },
    ],
  },
  {
    category: "This / Thin",
    emoji: "👆",
    description: "Âm /ð/ vs /θ/",
    pairs: [
      { a: "this", b: "thin" },
      { a: "then", b: "ten" },
      { a: "there", b: "their" },
      { a: "though", b: "through" },
      { a: "breathe", b: "breed" },
    ],
  },
  {
    category: "V / W",
    emoji: "✌️",
    description: "Âm /v/ vs /w/",
    pairs: [
      { a: "vine", b: "wine" },
      { a: "very", b: "wary" },
      { a: "vest", b: "west" },
      { a: "veil", b: "whale" },
      { a: "vow", b: "wow" },
    ],
  },
  {
    category: "P / B",
    emoji: "💋",
    description: "Âm /p/ không rung vs /b/ rung",
    pairs: [
      { a: "pat", b: "bat" },
      { a: "pen", b: "ben" },
      { a: "cap", b: "cab" },
      { a: "lip", b: "lib" },
      { a: "cup", b: "cub" },
    ],
  },
  {
    category: "R / L",
    emoji: "🔤",
    description: "Âm /r/ vs /l/ (khó với người Việt)",
    pairs: [
      { a: "right", b: "light" },
      { a: "road", b: "load" },
      { a: "rice", b: "lice" },
      { a: "pray", b: "play" },
      { a: "rock", b: "lock" },
    ],
  },
];

type DrillState = "idle" | "listening" | "recording" | "result";

export default function PronunciationPage() {
  const { addXP, addCoins } = useGame();
  const [selectedCat, setSelectedCat] = useState(0);
  const [pairIndex, setPairIndex] = useState(0);
  const [ttsLoading, setTtsLoading] = useState<string | null>(null);
  const [drillState, setDrillState] = useState<DrillState>("idle");
  const [targetWord, setTargetWord] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { isRecording, isTranscribing, transcript, startRecording, stopRecording, resetTranscript } = useSTTRecorder();

  const category = MINIMAL_PAIRS[selectedCat];
  const currentPair = category.pairs[pairIndex];

  const playTTS = async (word: string) => {
    setTtsLoading(word);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: word, lang: "en" }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(url);
      audioRef.current.play();
    } catch (e) {
      console.error(e);
    } finally {
      setTtsLoading(null);
    }
  };

  const startDrill = async (word: string) => {
    setTargetWord(word);
    setScore(null);
    setDrillState("listening");
    await playTTS(word);
    setDrillState("recording");
    resetTranscript();
    await startRecording();
  };

  const stopDrill = async () => {
    stopRecording();
    setDrillState("result");
  };

  // Calculate score when transcript arrives
  if (drillState === "recording" && transcript && targetWord) {
    const similarity = transcript.toLowerCase().trim() === targetWord.toLowerCase() ? 100
      : transcript.toLowerCase().includes(targetWord.toLowerCase()) ? 80
      : 40;
    setScore(similarity);
    setTotalAttempts((t) => t + 1);
    if (similarity >= 70) { setTotalCorrect((c) => c + 1); addXP(5); }
    if (similarity === 100) addCoins(3);
    setDrillState("result");
  }

  const nextPair = () => {
    setPairIndex((i) => (i + 1) % category.pairs.length);
    setDrillState("idle");
    setTargetWord(null);
    setScore(null);
    resetTranscript();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">← Quay lại</Link>
      <h1 className="text-2xl font-bold mb-1">
        <span className="bg-gradient-kawaii bg-clip-text text-transparent">🔤 Pronunciation Drill</span>
      </h1>
      <p className="text-muted-foreground text-sm mb-4">Luyện phân biệt các cặp âm khó — nghe, lặp lại và nhận điểm</p>

      {/* Stats */}
      <div className="flex gap-3 mb-5">
        <Badge variant="outline" className="rounded-full">{totalCorrect}/{totalAttempts} đúng</Badge>
        <Badge variant="outline" className="rounded-full">
          {totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0}% accuracy
        </Badge>
      </div>

      {/* Category selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {MINIMAL_PAIRS.map((cat, i) => (
          <button
            key={cat.category}
            onClick={() => { setSelectedCat(i); setPairIndex(0); setDrillState("idle"); setScore(null); }}
            className={`px-4 py-2 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all ${
              selectedCat === i ? "bg-gradient-kawaii text-white shadow-md" : "bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 text-muted-foreground"
            }`}
          >
            {cat.emoji} {cat.category}
          </button>
        ))}
      </div>

      {/* Category info */}
      <div className="bg-kawaii-lavender/10 rounded-2xl px-4 py-3 mb-5 text-sm text-center text-muted-foreground">
        💡 {category.description}
      </div>

      {/* Pair cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {currentPair && [currentPair.a, currentPair.b].map((word) => (
          <motion.div
            key={word}
            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur rounded-3xl p-6 border border-gray-200/40 text-center shadow-sm"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-3xl font-bold mb-3">{word}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => playTTS(word)}
                className="p-2 rounded-xl bg-kawaii-sky/20 hover:bg-kawaii-sky/30 transition-colors"
              >
                {ttsLoading === word ? <Loader2 className="w-5 h-5 animate-spin" /> : <Volume2 className="w-5 h-5 text-kawaii-sky" />}
              </button>
              <button
                onClick={() => startDrill(word)}
                disabled={drillState === "recording"}
                className="px-4 py-2 rounded-xl bg-kawaii-pink text-white text-sm font-semibold hover:bg-kawaii-pink/80 transition-colors disabled:opacity-50"
              >
                🎙️ Lặp lại
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Drill UI */}
      <AnimatePresence>
        {drillState === "listening" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6 text-muted-foreground">
            <div className="text-4xl mb-2 animate-pulse">🔊</div>
            <p>Nghe kỹ rồi lặp lại...</p>
          </motion.div>
        )}
        {drillState === "recording" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
            <div className="text-4xl mb-3 animate-pulse text-red-500">🎙️</div>
            <p className="text-muted-foreground mb-4">Đang ghi âm... hãy nói <strong className="text-foreground">{targetWord}</strong></p>
            <button
              onClick={stopDrill}
              className="px-6 py-3 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-colors"
            >
              ■ Dừng ghi âm
            </button>
          </motion.div>
        )}
        {drillState === "result" && score !== null && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6">
            {score >= 70
              ? <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              : <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            }
            <p className="text-2xl font-bold mb-1">{score}%</p>
            <p className="text-muted-foreground mb-1">Bạn nói: &ldquo;{transcript}&rdquo;</p>
            <p className={`text-sm font-semibold mb-4 ${score >= 70 ? "text-green-600" : "text-amber-600"}`}>
              {score >= 90 ? "Xuất sắc! 🌟" : score >= 70 ? "Tốt lắm! 👍" : "Thử lại nhé! 💪"}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setDrillState("idle"); setScore(null); resetTranscript(); }}
                className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 rounded-2xl text-sm font-semibold"
              >
                Thử lại
              </button>
              <button
                onClick={nextPair}
                className="px-5 py-2.5 bg-gradient-kawaii text-white rounded-2xl text-sm font-semibold"
              >
                Cặp tiếp theo →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pair navigation */}
      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <span>Cặp {pairIndex + 1}/{category.pairs.length}</span>
        <div className="flex gap-1">
          {category.pairs.map((_, i) => (
            <button key={i} onClick={() => { setPairIndex(i); setDrillState("idle"); setScore(null); }}
              className={`w-2 h-2 rounded-full transition-all ${i === pairIndex ? "bg-kawaii-purple w-4" : "bg-gray-300 dark:bg-gray-600"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
