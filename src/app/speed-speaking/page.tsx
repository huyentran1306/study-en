"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Mic, Square, Trophy, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGame } from "@/contexts/game-context";
import { useSTTRecorder } from "@/hooks/use-stt-recorder";
import Link from "next/link";

const TOPICS = [
  { emoji: "🌅", topic: "Describe your perfect morning routine", vn: "Mô tả buổi sáng lý tưởng của bạn" },
  { emoji: "🍜", topic: "Talk about your favorite food and why you love it", vn: "Kể về món ăn yêu thích của bạn" },
  { emoji: "🏙️", topic: "Describe the city you live in", vn: "Mô tả thành phố bạn đang sống" },
  { emoji: "📱", topic: "How has technology changed your daily life?", vn: "Công nghệ đã thay đổi cuộc sống như thế nào?" },
  { emoji: "🌍", topic: "If you could travel anywhere, where would you go and why?", vn: "Nếu có thể đi du lịch bất cứ đâu..." },
  { emoji: "💼", topic: "Describe your dream job", vn: "Mô tả công việc mơ ước của bạn" },
  { emoji: "📚", topic: "What book or movie changed your perspective on life?", vn: "Cuốn sách/bộ phim nào thay đổi quan điểm của bạn?" },
  { emoji: "🤝", topic: "Talk about someone who inspires you and why", vn: "Kể về người truyền cảm hứng cho bạn" },
];

const WPM_BADGES = [
  { wpm: 60, label: "Người mới bắt đầu", emoji: "🌱", color: "bg-green-100 text-green-700" },
  { wpm: 80, label: "Đang tiến bộ", emoji: "📈", color: "bg-blue-100 text-blue-700" },
  { wpm: 100, label: "Khá lưu loát", emoji: "⚡", color: "bg-yellow-100 text-yellow-700" },
  { wpm: 130, label: "Nói như người bản ngữ", emoji: "🌟", color: "bg-purple-100 text-purple-700" },
];

interface ScoreResult {
  fluency_score: number;
  accuracy_score: number;
  vocabulary_score: number;
  overall_score: number;
  strong_words: string[];
  filler_words: string[];
  feedback: string;
  next_tip: string;
  word_count: number;
  wpm: number;
  duration_seconds: number;
}

const DURATION = 30;

export default function SpeedSpeakingPage() {
  const { addXP, addCoins } = useGame();
  const [phase, setPhase] = useState<"pick" | "ready" | "speaking" | "analyzing" | "result">("pick");
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0]);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { isRecording, transcript, startRecording, stopRecording, resetTranscript } = useSTTRecorder();

  const stopAndScore = useCallback(async (finalTranscript: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopRecording();
    setPhase("analyzing");

    const elapsed = DURATION - timeLeft;
    const durationUsed = elapsed > 3 ? elapsed : DURATION;

    try {
      const res = await fetch("/api/speed-speaking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: finalTranscript || "...",
          durationSeconds: durationUsed,
          topic: selectedTopic.topic,
        }),
      });
      const data = await res.json() as ScoreResult;
      setResult(data);
      addXP(15);
      if (data.wpm >= 100) addCoins(20);
      else if (data.wpm >= 60) addCoins(10);
      else addCoins(5);
    } catch (e) {
      console.error(e);
    } finally {
      setPhase("result");
    }
  }, [timeLeft, selectedTopic, stopRecording, addXP, addCoins]);

  useEffect(() => {
    if (phase !== "speaking") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          stopAndScore(transcript);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, stopAndScore, transcript]);

  const startSpeaking = async () => {
    resetTranscript();
    setTimeLeft(DURATION);
    setPhase("speaking");
    await startRecording();
  };

  const getBadge = (wpm: number) => WPM_BADGES.slice().reverse().find((b) => wpm >= b.wpm) || WPM_BADGES[0];

  const scoreColor = (s: number) => s >= 80 ? "text-green-500" : s >= 60 ? "text-yellow-500" : "text-red-500";

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">← Quay lại</Link>
      <h1 className="text-2xl font-bold mb-1">
        <span className="bg-gradient-kawaii bg-clip-text text-transparent">⚡ Speed Speaking</span>
      </h1>
      <p className="text-muted-foreground text-sm mb-6">30 giây — nói càng nhiều càng tốt. AI sẽ chấm điểm fluency, accuracy và vocabulary</p>

      <AnimatePresence mode="wait">
        {/* Phase: pick topic */}
        {phase === "pick" && (
          <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="font-semibold mb-3">Chọn chủ đề:</p>
            <div className="grid gap-3 mb-6">
              {TOPICS.map((t) => (
                <motion.button
                  key={t.topic}
                  onClick={() => setSelectedTopic(t)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    selectedTopic.topic === t.topic
                      ? "border-kawaii-purple bg-kawaii-lavender/10"
                      : "border-gray-200/50 bg-white/60 dark:bg-gray-800/60 hover:border-kawaii-purple/40"
                  }`}
                  whileHover={{ scale: 1.01 }}
                >
                  <span className="text-2xl mr-3">{t.emoji}</span>
                  <span className="text-sm font-medium">{t.vn}</span>
                </motion.button>
              ))}
            </div>
            <button
              onClick={() => setPhase("ready")}
              className="w-full py-4 bg-gradient-kawaii text-white font-bold rounded-2xl text-lg"
            >
              Bắt đầu! 🚀
            </button>
          </motion.div>
        )}

        {/* Phase: ready */}
        {phase === "ready" && (
          <motion.div key="ready" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
            <div className="text-6xl mb-4">{selectedTopic.emoji}</div>
            <p className="text-lg font-bold mb-2">{selectedTopic.vn}</p>
            <p className="text-sm text-muted-foreground mb-8">&ldquo;{selectedTopic.topic}&rdquo;</p>
            <div className="bg-kawaii-lavender/10 rounded-2xl p-4 mb-6 text-sm text-left space-y-1">
              <p>⏱️ Bạn có <strong>30 giây</strong> để nói</p>
              <p>🎙️ Nhấn nút để bắt đầu ghi âm</p>
              <p>💡 Nói tự nhiên, đừng lo về lỗi sai</p>
            </div>
            <button
              onClick={startSpeaking}
              className="px-8 py-4 bg-gradient-kawaii text-white font-bold rounded-3xl text-lg shadow-kawaii"
            >
              🎙️ Bắt đầu ghi âm
            </button>
          </motion.div>
        )}

        {/* Phase: speaking */}
        {phase === "speaking" && (
          <motion.div key="speaking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
            {/* Timer ring */}
            <div className="relative w-32 h-32 mx-auto mb-6">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-700" />
                <circle
                  cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - timeLeft / DURATION)}`}
                  className={timeLeft <= 10 ? "text-red-500" : "text-kawaii-purple"}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-3xl font-bold ${timeLeft <= 10 ? "text-red-500" : ""}`}>{timeLeft}</span>
              </div>
            </div>

            <div className="text-4xl mb-2 animate-pulse">🎙️</div>
            <p className="font-semibold mb-1">{selectedTopic.vn}</p>
            <p className="text-sm text-muted-foreground mb-6">Đang ghi âm...</p>

            {transcript && (
              <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl p-3 mb-4 text-sm text-left max-h-24 overflow-y-auto">
                {transcript}
              </div>
            )}

            <button
              onClick={() => stopAndScore(transcript)}
              className="px-6 py-3 bg-red-500 text-white font-bold rounded-2xl gap-2 flex items-center mx-auto"
            >
              <Square className="w-4 h-4" /> Dừng sớm
            </button>
          </motion.div>
        )}

        {/* Phase: analyzing */}
        {phase === "analyzing" && (
          <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-kawaii-purple mx-auto mb-4" />
            <p className="text-lg font-semibold">AI đang chấm điểm...</p>
          </motion.div>
        )}

        {/* Phase: result */}
        {phase === "result" && result && (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* WPM Badge */}
            <div className="text-center">
              <div className="text-5xl mb-2">🏆</div>
              <p className="text-3xl font-bold">{result.wpm} <span className="text-lg text-muted-foreground">từ/phút</span></p>
              <p className="text-sm text-muted-foreground">{result.word_count} từ trong {result.duration_seconds}s</p>
              <div className={`inline-flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full text-sm font-bold ${getBadge(result.wpm).color}`}>
                {getBadge(result.wpm).emoji} {getBadge(result.wpm).label}
              </div>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Fluency", score: result.fluency_score },
                { label: "Accuracy", score: result.accuracy_score },
                { label: "Vocabulary", score: result.vocabulary_score },
              ].map(({ label, score }) => (
                <div key={label} className="bg-white/60 dark:bg-gray-800/60 rounded-2xl p-4 text-center border border-gray-200/40">
                  <p className={`text-2xl font-bold ${scoreColor(score)}`}>{score}</p>
                  <p className="text-xs text-muted-foreground mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Feedback */}
            <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl p-4 border border-kawaii-lavender/20">
              <p className="text-sm">{result.feedback}</p>
            </div>

            {result.filler_words.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-3 text-sm">
                <p className="font-semibold text-amber-700 dark:text-amber-300 mb-1">⚠️ Filler words:</p>
                <div className="flex flex-wrap gap-2">
                  {result.filler_words.map((w) => <Badge key={w} variant="outline" className="rounded-full">{w}</Badge>)}
                </div>
              </div>
            )}

            <div className="bg-kawaii-mint/10 rounded-2xl p-3 text-sm border border-kawaii-mint/30">
              <p className="font-semibold text-green-700 dark:text-green-300 mb-1">💡 Tip:</p>
              <p>{result.next_tip}</p>
            </div>

            {/* Next challenge */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setPhase("ready"); setResult(null); }}
                className="py-3 bg-white dark:bg-gray-800 border border-gray-200 rounded-2xl text-sm font-semibold"
              >
                Thử lại topic này
              </button>
              <button
                onClick={() => {
                  const next = TOPICS[Math.floor(Math.random() * TOPICS.length)];
                  setSelectedTopic(next);
                  setPhase("ready");
                  setResult(null);
                }}
                className="py-3 bg-gradient-kawaii text-white rounded-2xl text-sm font-semibold"
              >
                Topic khác 🎲
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
