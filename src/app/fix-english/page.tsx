"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Square,
  Send,
  Volume2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Wand2,
  Check,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSTTRecorder } from "@/hooks/use-stt-recorder";
import { useGame } from "@/contexts/game-context";
import Link from "next/link";

interface FixResult {
  is_correct: boolean;
  naturalness_score: number;
  issues: string[];
  corrected: string;
  alternatives: string[];
  explanation: string;
  good_parts: string;
}

export default function FixEnglishPage() {
  const { addXP, addCoins } = useGame();
  const [text, setText] = useState("");
  const [result, setResult] = useState<FixResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [ttsLoading, setTtsLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { isRecording, isTranscribing, transcript, startRecording, stopRecording, resetTranscript } = useSTTRecorder();

  const handleVoiceToggle = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      resetTranscript();
      await startRecording();
    }
  };

  if (transcript && !text) {
    setText(transcript);
  }

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/fix-english", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      const data = await res.json() as FixResult;
      setResult(data);
      addXP(10);
      if (data.is_correct) addCoins(5);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const playTTS = async (phrase: string) => {
    setTtsLoading(phrase);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: phrase, lang: "en" }),
      });
      if (!res.ok) throw new Error("TTS failed");
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

  const copyToClipboard = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-foreground">
            Dashboard
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Writing Refiner</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
          <Wand2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          AI Writing & Grammar Refiner
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Nhập câu nói hoặc email công việc — AI tự động phân tích ngữ pháp, tinh chỉnh độ tự nhiên và đề xuất cách nói chuẩn bản xứ.
        </p>
      </div>

      {/* Editor Box */}
      <div className="pro-card p-6 space-y-4">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nhập câu tiếng Anh bạn muốn kiểm tra (ví dụ: I am very boring in this meeting, She said me that she will come...)"
          className="min-h-[120px] text-sm sm:text-base resize-none border-slate-200/80 dark:border-slate-800 focus-visible:ring-indigo-500 rounded-xl leading-relaxed"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleVoiceToggle}
              className={`rounded-xl text-xs font-semibold gap-1.5 ${
                isRecording ? "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800" : ""
              }`}
            >
              {isRecording ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-indigo-500" />}
              {isRecording ? "Dừng ghi âm" : isTranscribing ? "Đang xử lý..." : "Nhập bằng giọng nói"}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleAnalyze}
              disabled={!text.trim() || loading}
              className="btn-pro text-xs font-bold gap-2 px-5"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? "Đang phân tích..." : "Phân Tích & Tối Ưu Hóa"}
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Example Chips */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold text-muted-foreground block">
          Hoặc thử nhanh với các lỗi diễn đạt phổ biến:
        </span>
        <div className="flex flex-wrap gap-2">
          {[
            "I am very boring in this meeting.",
            "She said me that she will come tomorrow.",
            "Can you explain to me about this strategy?",
            "Please revert back to me as soon as possible.",
          ].map((ex) => (
            <button
              key={ex}
              onClick={() => setText(ex)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 transition-colors text-left"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback & Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Naturalness Score Bar */}
            <div className="pro-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {result.is_correct ? (
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-base text-foreground">
                    {result.is_correct ? "Ngữ pháp chuẩn xác" : "Phát hiện điểm cần cải thiện"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {result.explanation}
                  </p>
                </div>
              </div>

              <div className="sm:text-right">
                <span className="text-[11px] font-semibold text-muted-foreground block">Chỉ số tự nhiên (Naturalness)</span>
                <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {result.naturalness_score} / 10
                </span>
              </div>
            </div>

            {/* Side by Side Diff */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="pro-card p-5 border-rose-500/30 bg-rose-50/20 dark:bg-rose-950/10 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block">
                  Bản gốc (Original)
                </span>
                <p className="text-sm font-medium text-foreground leading-relaxed">{text}</p>
              </div>

              <div className="pro-card p-5 border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                    Bản đã tối ưu (Refined)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(result.corrected)}
                      className="text-slate-400 hover:text-foreground text-xs transition-colors p-1"
                      title="Sao chép"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => playTTS(result.corrected)}
                      className="text-indigo-600 dark:text-indigo-400 text-xs transition-colors p-1"
                      title="Nghe phát âm"
                    >
                      {ttsLoading === result.corrected ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-sm font-bold text-foreground leading-relaxed">{result.corrected}</p>
              </div>
            </div>

            {/* Issues checklist */}
            {result.issues && result.issues.length > 0 && (
              <div className="pro-card p-5 space-y-2.5">
                <span className="text-xs font-bold text-foreground block">Điểm lưu ý chi tiết:</span>
                <div className="space-y-1.5">
                  {result.issues.map((issue, i) => (
                    <div key={i} className="text-xs flex items-start gap-2 text-slate-600 dark:text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alternative Phrases */}
            {result.alternatives && result.alternatives.length > 0 && (
              <div className="pro-card p-6 space-y-3">
                <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Các Cách Diễn Đạt Tương Đương Chuẩn Bản Xứ
                </div>
                <div className="space-y-2">
                  {result.alternatives.map((alt, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-750 flex items-center justify-between gap-3 text-xs sm:text-sm font-medium"
                    >
                      <span className="text-foreground">&ldquo;{alt}&rdquo;</span>
                      <button
                        onClick={() => playTTS(alt)}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 p-1 flex-shrink-0"
                      >
                        {ttsLoading === alt ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
