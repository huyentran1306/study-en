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
import { soundFX } from "@/lib/sound-fx";

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
  const [tone, setTone] = useState<"executive" | "slack" | "code_review" | "incident">("executive");
  const [result, setResult] = useState<FixResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [ttsLoading, setTtsLoading] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
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
        body: JSON.stringify({ text: text.trim(), tone }),
      });
      const data = await res.json() as FixResult;
      setResult(data);
      soundFX.success();
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

  const copyToClipboard = (val: string, key = "main") => {
    navigator.clipboard.writeText(val);
    soundFX.select();
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const tones = [
    {
      id: "executive" as const,
      label: "Client / C-Level",
      sub: "Ngoại giao & Đàm phán",
      icon: "👔",
    },
    {
      id: "slack" as const,
      label: "Slack & Standup",
      sub: "Ngắn gọn & Tự nhiên",
      icon: "💬",
    },
    {
      id: "code_review" as const,
      label: "PR Code Review",
      sub: "Góp ý code xây dựng",
      icon: "🔍",
    },
    {
      id: "incident" as const,
      label: "Incident Update",
      sub: "Báo cáo sự cố khẩn",
      icon: "🚨",
    },
  ];

  const quickScenarios = [
    {
      label: "Báo cáo giảm 70% RU Cosmos DB & Tiered Cache",
      tone: "executive" as const,
      text: "We change partition key to userId and add Redis L1 cache so Cosmos DB RU cost reduce 70% and no more 429 error.",
    },
    {
      label: "Bảo vệ In-Process Rule Engine (.NET 8 NuGet)",
      tone: "executive" as const,
      text: "We should not make rule engine as separate microservice because network call will make latency too slow for 500k flash sale users.",
    },
    {
      label: "Đề xuất lộ trình Strangler Fig trên AKS",
      tone: "executive" as const,
      text: "We plan to strangle monolith service by service to AKS. We will run dual-run 3 weeks to make sure data is 100% same before switch.",
    },
    {
      label: "Tích hợp Azure OpenAI sinh unit test biên",
      tone: "slack" as const,
      text: "We integrated Azure OpenAI GPT-4o to generate edge case unit test, our code coverage increase from 40% to 85%.",
    },
    {
      label: "Từ chối Scope Creep (Pushback)",
      tone: "executive" as const,
      text: "We cannot deploy this sprint on Friday because QA found a critical bug in payment and we need more time to test.",
    },
    {
      label: "Đề xuất refactor Technical Debt",
      tone: "executive" as const,
      text: "The current monolithic service has high coupling. We should spend this sprint to refactor rather than add features.",
    },
    {
      label: "Nhờ review PR gấp trước release",
      tone: "slack" as const,
      text: "Can you review my PR when you have free time? It is urgent for today release.",
    },
    {
      label: "Góp ý tối ưu query N+1 trong PR",
      tone: "code_review" as const,
      text: "I think this database query will make slow in production because it query inside loop.",
    },
    {
      label: "Chia nhỏ PR quá dài",
      tone: "code_review" as const,
      text: "This pull request has 1500 lines changed. It is too big and hard to review. Can you split it into smaller PRs?",
    },
    {
      label: "Báo cáo sự cố server & ETA phục hồi",
      tone: "incident" as const,
      text: "Our payment service is down now. We are fixing it. Maybe 30 minutes will be ok.",
    },
    {
      label: "Hỏi rõ yêu cầu SLA P99 & scale",
      tone: "executive" as const,
      text: "Can you tell me more about how many users visit website same time and what is response time you want?",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-foreground">
            Dashboard
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Tech Lead Writing Co-pilot</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
          <Wand2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Tech Lead Executive Writing & Slack Polish
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Biến các ý tưởng tiếng Anh gượng gạo thành thông điệp chuẩn Tech Lead: chuyên nghiệp khi làm việc với đối tác, súc tích trên Slack, và chuẩn mực trong Code Review.
        </p>
      </div>

      {/* Tone Mode Selector */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
          Chọn phong cách giao tiếp (Tone of Voice):
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {tones.map((t) => {
            const active = tone === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTone(t.id)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                  active
                    ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-sm"
                    : "bg-card border-border/80 hover:bg-muted/50 text-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </div>
                <span className="text-[11px] text-muted-foreground leading-tight">
                  {t.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor Box */}
      <div className="pro-card p-6 space-y-4">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nhập câu tiếng Anh bạn muốn kiểm tra (ví dụ: We cannot deliver this sprint because QA found bug, Can you review my PR...)"
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
              {isRecording ? "Dừng ghi âm" : isTranscribing ? "Đang xử lý..." : "Nói bằng Micro"}
            </Button>
            {text && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setText("")}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Xóa
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleAnalyze}
              disabled={!text.trim() || loading}
              className="btn-pro text-xs font-bold gap-2 px-5"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? "Đang tinh chỉnh..." : "Tối Ưu Ngay (Refine)"}
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Example Chips */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold text-muted-foreground block">
          💡 Tình huống Tech Lead mẫu thường gặp (Click để điền nhanh):
        </span>
        <div className="flex flex-wrap gap-2">
          {quickScenarios.map((sc, idx) => (
            <button
              key={idx}
              onClick={() => {
                setText(sc.text);
                setTone(sc.tone);
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 transition-colors text-left flex items-center gap-1.5"
            >
              <span>{sc.label}</span>
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
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 flex-shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-base text-foreground">
                    {result.is_correct ? "Ngữ pháp chuẩn xác & Tự nhiên" : "Gợi ý cải thiện diễn đạt"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {result.explanation}
                  </p>
                </div>
              </div>

              <div className="sm:text-right flex-shrink-0">
                <span className="text-[11px] font-semibold text-muted-foreground block">Độ tự nhiên Tech Lead</span>
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
                    Bản tối ưu đề xuất (Refined)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(result.corrected, "refined")}
                      className="text-slate-400 hover:text-foreground text-xs transition-colors p-1"
                      title="Sao chép"
                    >
                      {copiedKey === "refined" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
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

            {/* Alternative Variations */}
            {result.alternatives && result.alternatives.length > 0 && (
              <div className="pro-card p-6 space-y-3">
                <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Các Biến Thể Diễn Đạt Khác Nhau (Tùy bối cảnh)
                </div>
                <div className="space-y-2.5">
                  {result.alternatives.map((alt, i) => {
                    const badgeLabels = [
                      "⚡ Ngắn gọn & Trực tiếp",
                      "🤝 Ngoại giao & Thấu cảm",
                      "🛠️ Chuyên sâu Kỹ thuật",
                    ];
                    const label = badgeLabels[i] || `Lựa chọn ${i + 1}`;
                    const cleanAlt = alt.replace(/^(⚡|🤝|🛠️|Option \d+|Lựa chọn \d+)[^:]*:\s*/i, "").replace(/^["'“”]+|["'“”]+$/g, "");
                    return (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-750 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm font-medium"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block">
                            {label}
                          </span>
                          <span className="text-foreground leading-relaxed">&ldquo;{cleanAlt}&rdquo;</span>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                          <button
                            onClick={() => copyToClipboard(cleanAlt, `alt-${i}`)}
                            className="p-1 text-slate-400 hover:text-foreground transition-colors"
                            title="Sao chép"
                          >
                            {copiedKey === `alt-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => playTTS(cleanAlt)}
                            className="p-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                            title="Nghe phát âm"
                          >
                            {ttsLoading === cleanAlt ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
