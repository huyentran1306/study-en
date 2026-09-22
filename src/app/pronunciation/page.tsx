"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  Loader2,
  CheckCircle2,
  XCircle,
  Mic,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Radio,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/contexts/game-context";
import { useSTTRecorder } from "@/hooks/use-stt-recorder";
import Link from "next/link";

const MINIMAL_PAIRS = [
  {
    category: "Ship vs Sheep",
    phonetics: "/ɪ/ ngắn vs /iː/ dài",
    description: "Khẩu hình miệng kéo ngang và độ dài hơi thở",
    pairs: [
      { a: "ship", b: "sheep" },
      { a: "bit", b: "beat" },
      { a: "sit", b: "seat" },
      { a: "fill", b: "feel" },
      { a: "live", b: "leave" },
    ],
  },
  {
    category: "This vs Thin",
    phonetics: "/ð/ rung vs /θ/ không rung",
    description: "Vị trí đặt đầu lưỡi giữa hai hàm răng",
    pairs: [
      { a: "this", b: "thin" },
      { a: "then", b: "ten" },
      { a: "there", b: "their" },
      { a: "though", b: "through" },
      { a: "breathe", b: "breed" },
    ],
  },
  {
    category: "V vs W",
    phonetics: "/v/ răng cắn môi vs /w/ chu môi",
    description: "Khác biệt cơ bản giữa âm cọ xát và âm lướt môi",
    pairs: [
      { a: "vine", b: "wine" },
      { a: "very", b: "wary" },
      { a: "vest", b: "west" },
      { a: "veil", b: "whale" },
      { a: "vow", b: "wow" },
    ],
  },
  {
    category: "P vs B",
    phonetics: "/p/ bật hơi vs /b/ rung thanh quản",
    description: "Cặp âm môi-môi bật hơi có và không có rung",
    pairs: [
      { a: "pat", b: "bat" },
      { a: "pen", b: "ben" },
      { a: "cap", b: "cab" },
      { a: "lip", b: "lib" },
      { a: "cup", b: "cub" },
    ],
  },
  {
    category: "R vs L",
    phonetics: "/r/ cong lưỡi vs /l/ đầu lưỡi chạm nướu",
    description: "Cặp âm gây vấp phổ biến nhất của người Việt",
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

  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-foreground">
              Dashboard
            </Link>
            <span className="text-slate-400">/</span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Pronunciation Lab</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Minimal Pairs Pronunciation Lab
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Luyện phân biệt và chuẩn hóa các cặp âm dễ nhầm lẫn trong giao tiếp tiếng Anh quốc tế.
          </p>
        </div>

        {/* Telemetry Accuracy Meter */}
        <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2.5 rounded-xl text-xs">
          <div>
            <span className="text-muted-foreground block text-[10px]">Độ chính xác</span>
            <span className="text-sm font-bold text-foreground tabular-nums">{accuracy}%</span>
          </div>
          <div className="h-6 w-px bg-slate-300 dark:bg-slate-700" />
          <div>
            <span className="text-muted-foreground block text-[10px]">Đã hoàn thành</span>
            <span className="text-sm font-bold text-foreground tabular-nums">{totalCorrect}/{totalAttempts}</span>
          </div>
        </div>
      </div>

      {/* Category Segmented Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {MINIMAL_PAIRS.map((cat, i) => (
          <button
            key={cat.category}
            onClick={() => { setSelectedCat(i); setPairIndex(0); setDrillState("idle"); setScore(null); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedCat === i
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:text-foreground"
            }`}
          >
            <span>{cat.category}</span>
          </button>
        ))}
      </div>

      {/* Category Phonetics Info */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
        <div>
          <strong className="text-foreground">{category.category}</strong>
          <span className="text-slate-400 mx-2">·</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">{category.phonetics}</span>
        </div>
        <span className="text-muted-foreground hidden sm:inline">{category.description}</span>
      </div>

      {/* Contrast Word Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {currentPair && [currentPair.a, currentPair.b].map((word) => (
          <div
            key={word}
            className={`pro-card p-6 sm:p-8 text-center space-y-4 transition-all ${
              targetWord === word ? "border-indigo-500 ring-2 ring-indigo-500/20" : ""
            }`}
          >
            <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {word}
            </h3>

            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => playTTS(word)}
                className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold gap-1.5"
              >
                {ttsLoading === word ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                )}
                <span>Nghe mẫu</span>
              </Button>

              <Button
                size="sm"
                onClick={() => startDrill(word)}
                disabled={drillState === "recording"}
                className="btn-pro text-xs font-bold gap-1.5 px-4"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Luyện phát âm từ này</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Drill Feedback State */}
      <AnimatePresence>
        {drillState === "recording" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pro-card p-6 text-center space-y-3 border-rose-500/30"
          >
            <div className="w-12 h-12 rounded-full bg-rose-600 flex items-center justify-center text-white mx-auto animate-pulse">
              <Mic className="w-6 h-6" />
            </div>
            <p className="text-xs text-muted-foreground">
              Đang ghi âm... Hãy phát âm to rõ từ: <strong className="text-foreground text-sm">{targetWord}</strong>
            </p>
            <Button
              onClick={stopDrill}
              className="rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
            >
              Hoàn tất ghi âm
            </Button>
          </motion.div>
        )}

        {drillState === "result" && score !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pro-card p-6 text-center space-y-4"
          >
            {score >= 70 ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            ) : (
              <XCircle className="w-10 h-10 text-rose-500 mx-auto" />
            )}

            <div>
              <div className="text-3xl font-extrabold text-foreground tabular-nums">{score}%</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                AI ghi nhận bạn nói: &ldquo;<strong className="text-foreground">{transcript}</strong>&rdquo;
              </p>
              <p className={`text-xs font-bold mt-1 ${score >= 70 ? "text-emerald-600" : "text-amber-600"}`}>
                {score >= 90 ? "Phát âm chuẩn bản ngữ!" : score >= 70 ? "Rất tốt, tiếp tục duy trì!" : "Chưa hoàn toàn chuẩn, hãy thử lại nhé!"}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setDrillState("idle"); setScore(null); resetTranscript(); }}
                className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Thử lại
              </Button>
              <Button
                size="sm"
                onClick={nextPair}
                className="btn-pro text-xs font-bold gap-1"
              >
                <span>Cặp tiếp theo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
