"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Send,
  Loader2,
  Volume2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Radio,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useSTTRecorder } from "@/hooks/use-stt-recorder";
import { useGame } from "@/contexts/game-context";
import Link from "next/link";

interface SpeechFeedback {
  pronunciation_score: number;
  grammar_score: number;
  fluency_score: number;
  overall_score: number;
  corrections: { original: string; corrected: string; explanation: string }[];
  tips: string[];
  improved_version: string;
}

const PRACTICE_PROMPTS = [
  "Describe your daily routine in the morning and how you prioritize your key tasks.",
  "Tell me about a challenging project at work and how you collaborated with your team.",
  "Explain the advantages and disadvantages of remote work vs in-office collaboration.",
  "Describe a memorable trip you took and the cultural insights you gained.",
  "How would you handle a disagreement with a client or colleague regarding project deadlines?",
  "Talk about a professional mentor who influenced your career path and what you learned.",
  "Describe an industry trend in your field that you find promising for the next few years.",
  "What are your primary professional goals for the next three to five years?",
  "How do you usually maintain focus and manage stress during high-pressure work periods?",
  "Talk about a mistake you made in a past project and the corrective measures you took.",
];

const CHINESE_PROMPTS = [
  "请描述你的工作日常以及如何规划每日优先级。（Describe your daily work routine and priorities.）",
  "谈谈你在团队合作中遇到的挑战与解决方法。（Talk about a teamwork challenge and how you solved it.）",
  "请分析远程办公与办公室协作的优缺点。（Analyze the pros and cons of remote vs office work.）",
  "介绍一次对你影响深刻的旅行与文化收获。（Introduce a memorable trip and cultural takeaways.）",
  "如果在项目中与同事产生意见分歧，你会如何沟通？（How do you handle disagreements with colleagues?）",
];

const SCORE_CONFIG = [
  { key: "pronunciation_score", label: "Phát Âm (Pronunciation)", color: "text-indigo-600 dark:text-indigo-400", bar: "bg-indigo-500" },
  { key: "grammar_score", label: "Ngữ Pháp (Grammar)", color: "text-sky-600 dark:text-sky-400", bar: "bg-sky-500" },
  { key: "fluency_score", label: "Độ Lưu Loát (Fluency)", color: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" },
  { key: "overall_score", label: "Tổng Điểm (Overall)", color: "text-purple-600 dark:text-purple-400", bar: "bg-purple-500" },
];

export default function SpeakingPage() {
  const { transcript: browserTranscript, isListening, startListening, stopListening, resetTranscript: resetBrowserTranscript, isSupported: isBrowserSpeechSupported } = useSpeechRecognition();
  const {
    isRecording: isAIRecording,
    isTranscribing: isAITranscribing,
    transcript: aiTranscript,
    startRecording: startAIRecording,
    stopRecording: stopAIRecording,
    resetTranscript: resetAITranscript,
    isSupported: isMicSupported,
  } = useSTTRecorder();

  const transcript = aiTranscript || browserTranscript;
  const isListeningOrRecording = isListening || isAIRecording;
  const isSupported = isMicSupported || isBrowserSpeechSupported;

  const resetTranscript = () => {
    resetBrowserTranscript();
    resetAITranscript();
  };

  const [manualText, setManualText] = useState("");
  const [feedback, setFeedback] = useState<SpeechFeedback | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(0);
  const { addXP, addCoins, activeStudyLanguage, unlockAchievement } = useGame();
  const isZh = activeStudyLanguage === 'zh';
  const prompts = isZh ? CHINESE_PROMPTS : PRACTICE_PROMPTS;

  const textToAnalyze = transcript || manualText;

  const getNewPrompt = () => {
    setCurrentPrompt((prev) => (prev + 1) % prompts.length);
    resetTranscript();
    setManualText("");
    setFeedback(null);
  };

  const analyzeSpeech = async () => {
    if (!textToAnalyze.trim()) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToAnalyze, language: isZh ? 'zh' : 'en' }),
      });
      const data = await response.json();
      setFeedback(data.feedback);
      
      const overall = data.feedback?.overall_score || 5;
      addXP(overall * 3);
      if (overall >= 7) {
        addCoins(15);
      }
      if ((data.feedback?.pronunciation_score || 0) >= 9) {
        unlockAchievement("perfect_pronunciation");
      }
      if (!sessionStorage.getItem("first_speaking")) {
        sessionStorage.setItem("first_speaking", "1");
        unlockAchievement("first_speaking");
      }
    } catch {
      console.error("Failed to analyze speech");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = isZh ? "zh-CN" : "en-US";
      utterance.rate = 0.85;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-foreground">
              Dashboard
            </Link>
            <span className="text-slate-400">/</span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Speech Lab</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Mic className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            {isZh ? "AI 口语测评实验室" : "Speech Evaluation Lab"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Ghi âm phản xạ tự nhiên, đo đạc độ trôi chảy và nhận đánh giá ngữ âm chuẩn bản ngữ.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/voice">
            <Button variant="outline" size="sm" className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold">
              <Radio className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
              Chuyển sang Realtime Voice
            </Button>
          </Link>
        </div>
      </div>

      {/* Practice Prompt Card */}
      <div className="pro-card p-6 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50/50 dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 border-indigo-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              Chủ đề thực hành #{currentPrompt + 1}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {currentPrompt + 1} / {prompts.length}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={getNewPrompt}
            className="gap-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Đổi chủ đề
          </Button>
        </div>

        <p className="text-base sm:text-lg font-semibold text-foreground leading-relaxed">
          &ldquo;{prompts[currentPrompt]}&rdquo;
        </p>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-4">
          <button
            onClick={() => speakText(prompts[currentPrompt])}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <Volume2 className="h-4 w-4" />
            Nghe phát âm chuẩn
          </button>
        </div>
      </div>

      {/* Audio Capture & Response Studio */}
      <div className="pro-card p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-base font-bold text-foreground">Khu Vực Thu Âm & Trả Lời</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Nhấn nút microphone bên dưới để thu âm phản xạ tự nhiên của bạn hoặc gõ văn bản trực tiếp.
          </p>
        </div>

        {/* Studio Microphone Console */}
        {isSupported && (
          <div className="flex flex-col items-center justify-center py-6 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
            <div className="relative mb-4">
              {isListeningOrRecording && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-full bg-indigo-500/30"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full bg-indigo-500/20"
                    animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 1.8, repeat: Infinity, delay: 0.3 }}
                  />
                </>
              )}

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                disabled={isAITranscribing}
                onClick={async () => {
                  if (isAIRecording) {
                    stopAIRecording();
                  } else if (isListening) {
                    stopListening();
                  } else if (isMicSupported) {
                    await startAIRecording();
                  } else {
                    startListening();
                  }
                }}
                className={`relative flex h-20 w-20 items-center justify-center rounded-2xl text-white shadow-lg transition-all disabled:opacity-60 ${
                  isListeningOrRecording
                    ? "bg-rose-600 hover:bg-rose-500 shadow-rose-500/30"
                    : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30"
                }`}
              >
                {isAITranscribing ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : isListeningOrRecording ? (
                  <MicOff className="h-8 w-8" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
              </motion.button>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold">
              {isAITranscribing ? (
                <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang chuyển đổi giọng nói (AI STT)...
                </span>
              ) : isListeningOrRecording ? (
                <span className="text-rose-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  Đang ghi âm... Nhấn để hoàn tất
                </span>
              ) : (
                <span className="text-slate-600 dark:text-slate-400">
                  {isMicSupported ? "Nhấn microphone để bắt đầu nói" : "Microphone khả dụng"}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Live Transcript / Manual Input Display */}
        {transcript ? (
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-750 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-500" />
                Nội Dung Ghi Nhận (Transcript)
              </span>
              <button
                onClick={resetTranscript}
                className="text-xs text-slate-400 hover:text-foreground transition-colors"
              >
                Xóa ghi âm
              </button>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-foreground font-medium">
              {transcript}
            </p>
          </div>
        ) : (
          <Textarea
            placeholder={isZh ? "输入你的回应或在此处输入..." : "Hoặc nhập trực tiếp câu trả lời của bạn tại đây để AI phân tích..."}
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            className="min-h-[110px] rounded-xl border-slate-200/80 dark:border-slate-800 focus-visible:ring-indigo-500 text-sm"
          />
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={analyzeSpeech}
            disabled={!textToAnalyze.trim() || isAnalyzing}
            className="btn-pro flex-1 gap-2 text-xs sm:text-sm font-bold"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isAnalyzing ? "AI đang phân tích..." : "Đánh Giá & Phân Tích Kỹ Lưỡng"}
          </Button>

          <Button
            variant="outline"
            onClick={() => { resetTranscript(); setManualText(""); setFeedback(null); }}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold px-4"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Đặt lại
          </Button>
        </div>
      </div>

      {/* AI Telemetry Feedback Section */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <span className="w-2 h-5 rounded-full bg-indigo-600" />
                Bảng Đánh Giá Năng Lực Phát Âm
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Các chỉ số được chấm điểm tự động dựa trên mô hình phát hiện ngữ âm bản ngữ.
              </p>
            </div>

            {/* 4 Score Telemetry Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {SCORE_CONFIG.map(({ key, label, color, bar }) => {
                const score = (feedback[key as keyof SpeechFeedback] as number) || 0;
                return (
                  <div key={key} className="pro-card p-5 space-y-2">
                    <span className="text-[11px] font-semibold text-muted-foreground block truncate">
                      {label}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-extrabold tracking-tight ${color} tabular-nums`}>
                        {score}
                      </span>
                      <span className="text-xs text-muted-foreground font-semibold">/ 10</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${bar}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${score * 10}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Corrections */}
            {feedback.corrections && feedback.corrections.length > 0 && (
              <div className="pro-card p-6 border-amber-500/30 space-y-4">
                <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Điểm Cần Điều Chỉnh Ngữ Pháp & Dùng Từ
                </div>
                <div className="space-y-2.5">
                  {feedback.corrections.map((c, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-750 text-xs sm:text-sm">
                      <div className="flex flex-wrap items-center gap-2 font-medium">
                        <span className="line-through text-rose-500">{c.original}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{c.corrected}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{c.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips for Improvement */}
            {feedback.tips && feedback.tips.length > 0 && (
              <div className="pro-card p-6 space-y-3">
                <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                  <Lightbulb className="h-4 w-4 text-indigo-500" />
                  Chiến Lược Cải Thiện Tiếp Theo
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {feedback.tips.map((tip, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-start gap-2.5 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                      <span className="text-slate-600 dark:text-slate-300 leading-relaxed">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improved Native Version */}
            {feedback.improved_version && (
              <div className="pro-card p-6 border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    Bản Diễn Đạt Tự Nhiên Theo Văn Phong Bản Xứ
                  </div>
                  <button
                    onClick={() => speakText(feedback.improved_version)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <Volume2 className="h-4 w-4" />
                    Nghe đọc mẫu
                  </button>
                </div>
                <p className="text-sm sm:text-base leading-relaxed text-foreground font-medium p-4 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80">
                  &ldquo;{feedback.improved_version}&rdquo;
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
