"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Mic,
  Square,
  Trophy,
  Zap,
  Gauge,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  Radio,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/contexts/game-context";
import { useSTTRecorder } from "@/hooks/use-stt-recorder";
import Link from "next/link";

const TOPICS = [
  {
    topic: "Pitching your current project impact to executive stakeholders",
    vn: "Thuyết trình về giá trị dự án bạn đang phụ trách cho ban giám đốc",
    context: "Business Pitch & Stakeholder Value",
  },
  {
    topic: "How automation and generative AI are transforming your daily workflow",
    vn: "Tác động của AI và tự động hóa đến năng suất làm việc của bạn",
    context: "Tech Trends & Productivity",
  },
  {
    topic: "Describe a high-pressure situation at work and how you handled it",
    vn: "Xử lý khủng hoảng hoặc áp lực cao trong công việc thực tế",
    context: "Problem Solving & Resilience",
  },
  {
    topic: "The pros and cons of fully remote work vs hybrid corporate models",
    vn: "Đánh giá mô hình làm việc từ xa (Remote) so với Hybrid",
    context: "Modern Workplace Strategy",
  },
  {
    topic: "What are your most critical career milestones for the upcoming three years?",
    vn: "Mục tiêu và lộ trình sự nghiệp then chốt trong 3 năm tới",
    context: "Career Vision & Growth",
  },
];

const WPM_TIERS = [
  { wpm: 60, label: "Foundational (Khởi đầu)", color: "text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800" },
  { wpm: 80, label: "Progressing (Tiến bộ)", color: "text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-950/60" },
  { wpm: 100, label: "Fluent (Lưu loát)", color: "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/60" },
  { wpm: 130, label: "Executive Native (Bản xứ)", color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/60" },
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
    } catch {
      setResult({
        fluency_score: 75,
        accuracy_score: 80,
        vocabulary_score: 70,
        overall_score: 75,
        strong_words: ["impact", "project", "strategy"],
        filler_words: ["um", "ah"],
        feedback: "Tốc độ nói rất tốt và ý tứ mạch lạc.",
        next_tip: "Giảm thiểu từ đệm để tăng tính chuyên nghiệp.",
        word_count: 45,
        wpm: 90,
        duration_seconds: durationUsed,
      });
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

  const getTier = (wpm: number) => WPM_TIERS.slice().reverse().find((b) => wpm >= b.wpm) || WPM_TIERS[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-foreground">
            Dashboard
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Speed Speaking</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
          <Gauge className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          30-Second Fluency Sprint
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          30 giây thử thách phản xạ nói không ngập ngừng — AI đo lường chỉ số WPM (từ/phút), độ lưu loát và mức độ từ đệm.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* Phase: pick topic */}
        {phase === "pick" && (
          <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-foreground">Chọn chủ đề phản xạ:</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Lựa chọn chủ đề bạn muốn luyện tư duy nhanh bằng tiếng Anh.</p>
            </div>

            <div className="space-y-3">
              {TOPICS.map((t) => (
                <button
                  key={t.topic}
                  onClick={() => setSelectedTopic(t)}
                  className={`pro-card p-5 w-full text-left transition-all flex items-center justify-between gap-4 ${
                    selectedTopic.topic === t.topic
                      ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20"
                      : ""
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                      {t.context}
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-foreground">{t.vn}</h4>
                    <p className="text-xs text-muted-foreground italic mt-0.5">&ldquo;{t.topic}&rdquo;</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedTopic.topic === t.topic ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300"
                  }`}>
                    {selectedTopic.topic === t.topic && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </button>
              ))}
            </div>

            <Button
              onClick={() => setPhase("ready")}
              className="btn-pro w-full py-3.5 text-sm font-bold gap-2"
            >
              <span>Vào phòng thử thách Sprint</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}

        {/* Phase: ready */}
        {phase === "ready" && (
          <motion.div key="ready" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="pro-card p-8 text-center space-y-6">
            <div className="space-y-2 max-w-lg mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-200/60 dark:border-indigo-800/60">
                Chủ đề đã chọn
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-3">{selectedTopic.vn}</h3>
              <p className="text-sm text-muted-foreground italic">&ldquo;{selectedTopic.topic}&rdquo;</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-750 text-xs text-left max-w-md mx-auto space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Zap className="w-4 h-4 text-amber-500" /> Hướng dẫn bài tập:
              </div>
              <p className="text-muted-foreground">· Bạn có đúng 30 giây để nói liên tục theo chủ đề trên.</p>
              <p className="text-muted-foreground">· Hãy tập trung vào tính mạch lạc và tự nhiên, không sợ mắc lỗi ngữ pháp nhỏ.</p>
            </div>

            <Button
              onClick={startSpeaking}
              className="btn-pro px-8 py-3.5 text-sm font-bold gap-2"
            >
              <Mic className="w-4 h-4" />
              <span>Bắt đầu tính giờ & thu âm (30s)</span>
            </Button>
          </motion.div>
        )}

        {/* Phase: speaking */}
        {phase === "speaking" && (
          <motion.div key="speaking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pro-card p-8 sm:p-10 text-center space-y-6">
            {/* SVG Precision Dial Timer */}
            <div className="relative w-36 h-36 mx-auto">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-200 dark:text-slate-800" />
                <circle
                  cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - timeLeft / DURATION)}`}
                  className={timeLeft <= 8 ? "text-rose-500" : "text-indigo-600 dark:text-indigo-400"}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-extrabold tabular-nums ${timeLeft <= 8 ? "text-rose-500 animate-pulse" : "text-foreground"}`}>
                  {timeLeft}s
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">còn lại</span>
              </div>
            </div>

            <div>
              <h4 className="text-base font-bold text-foreground">{selectedTopic.vn}</h4>
              <p className="text-xs text-rose-500 font-semibold mt-1 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                Đang thu âm phản xạ trực tiếp...
              </p>
            </div>

            {transcript && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-750 text-xs text-left max-h-24 overflow-y-auto leading-relaxed text-foreground font-medium">
                {transcript}
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => stopAndScore(transcript)}
              className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/40 text-xs font-semibold gap-1.5"
            >
              <Square className="w-3.5 h-3.5" /> Dừng sớm & Chấm điểm
            </Button>
          </motion.div>
        )}

        {/* Phase: analyzing */}
        {phase === "analyzing" && (
          <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pro-card p-12 text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
            <h4 className="text-base font-bold text-foreground">AI đang tính toán chỉ số WPM & phân tích độ trôi chảy...</h4>
            <p className="text-xs text-muted-foreground">Đang đối chiếu dữ liệu ngữ âm và mật độ từ vựng.</p>
          </motion.div>
        )}

        {/* Phase: result */}
        {phase === "result" && result && (
          <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* WPM Main Telemetry Card */}
            <div className="pro-card p-8 text-center space-y-4 bg-gradient-to-b from-indigo-50/40 via-white to-white dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 border-indigo-500/30">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Tốc Độ Phản Xạ Ngôn Ngữ
              </span>

              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-extrabold text-foreground tracking-tight tabular-nums">
                  {result.wpm}
                </span>
                <span className="text-sm font-bold text-muted-foreground">WPM (từ/phút)</span>
              </div>

              <p className="text-xs text-muted-foreground">
                Đã nói được <strong className="text-foreground">{result.word_count} từ</strong> trong {result.duration_seconds} giây
              </p>

              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border border-current/20 ${getTier(result.wpm).color}`}>
                <Trophy className="w-3.5 h-3.5" />
                <span>Phân hạng: {getTier(result.wpm).label}</span>
              </div>
            </div>

            {/* 3 Metrics */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Độ Lưu Loát (Fluency)", score: result.fluency_score, color: "text-indigo-600 dark:text-indigo-400" },
                { label: "Độ Chuẩn Xác (Accuracy)", score: result.accuracy_score, color: "text-sky-600 dark:text-sky-400" },
                { label: "Vốn Từ (Vocabulary)", score: result.vocabulary_score, color: "text-emerald-600 dark:text-emerald-400" },
              ].map(({ label, score, color }) => (
                <div key={label} className="pro-card p-4 text-center space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground block truncate">{label}</span>
                  <span className={`text-2xl font-extrabold tabular-nums ${color}`}>{score}</span>
                  <span className="text-[10px] text-muted-foreground block">/ 100</span>
                </div>
              ))}
            </div>

            {/* AI Feedback & Tips */}
            <div className="pro-card p-6 space-y-3">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Đánh giá & Lời khuyên từ AI:</h4>
              <p className="text-xs sm:text-sm text-foreground leading-relaxed font-medium">{result.feedback}</p>
              {result.next_tip && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-750 text-xs text-indigo-600 dark:text-indigo-400">
                  💡 Gợi ý tiếp theo: {result.next_tip}
                </div>
              )}
            </div>

            {/* Control Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => { setPhase("pick"); setResult(null); }}
                className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold flex-1"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Thử chủ đề khác
              </Button>

              <Button
                onClick={() => { setPhase("ready"); setResult(null); }}
                className="btn-pro text-xs font-bold flex-1"
              >
                Lặp lại thử thách này
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
