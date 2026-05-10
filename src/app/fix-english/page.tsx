"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Send, Volume2, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

  // When transcript arrives, fill textarea
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

  const scoreColor = (score: number) => {
    if (score >= 8) return "text-green-500";
    if (score >= 5) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">← Quay lại</Link>
        <h1 className="text-2xl font-bold">
          <span className="bg-gradient-kawaii bg-clip-text text-transparent">🔧 Fix My English</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Nhập câu tiếng Anh bất kỳ — AI sẽ phân tích và gợi ý cách nói tự nhiên hơn như người bản ngữ
        </p>
      </div>

      {/* Input area */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur rounded-3xl border border-kawaii-pink/20 p-5 mb-5 shadow-sm">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nhập câu tiếng Anh của bạn... VD: I am very boring in this meeting."
          className="min-h-[100px] text-base resize-none border-none bg-transparent focus-visible:ring-0 p-0"
        />
        <div className="flex items-center gap-3 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleVoiceToggle}
            className={`rounded-2xl gap-2 ${isRecording ? "bg-red-100 border-red-300 text-red-600" : ""}`}
          >
            {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isRecording ? "Dừng" : isTranscribing ? "Đang xử lý..." : "Nói"}
          </Button>
          <Button
            onClick={handleAnalyze}
            disabled={!text.trim() || loading}
            className="rounded-2xl gap-2 bg-gradient-kawaii text-white ml-auto"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Phân tích
          </Button>
        </div>
      </div>

      {/* Example inputs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          "I am very boring in this meeting.",
          "She said me that she will come.",
          "I have been to there yesterday.",
          "Can you explain to me about this?",
        ].map((ex) => (
          <button
            key={ex}
            onClick={() => setText(ex)}
            className="text-xs px-3 py-1.5 rounded-full bg-kawaii-lavender/10 hover:bg-kawaii-lavender/20 text-muted-foreground transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Score card */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur rounded-3xl p-5 border border-kawaii-pink/20 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                {result.is_correct
                  ? <CheckCircle2 className="w-6 h-6 text-green-500" />
                  : <AlertCircle className="w-6 h-6 text-amber-500" />
                }
                <div>
                  <p className="font-bold">{result.is_correct ? "Câu đúng! 🎉" : "Cần cải thiện một chút"}</p>
                  <p className="text-sm text-muted-foreground">
                    Độ tự nhiên: <span className={`font-bold ${scoreColor(result.naturalness_score)}`}>{result.naturalness_score}/10</span>
                  </p>
                </div>
              </div>

              {result.good_parts && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl px-4 py-2 text-sm text-green-700 dark:text-green-300 mb-3">
                  ✅ {result.good_parts}
                </div>
              )}

              {result.issues.length > 0 && (
                <div className="space-y-1 mb-3">
                  {result.issues.map((issue, i) => (
                    <div key={i} className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl px-4 py-2 text-sm text-amber-700 dark:text-amber-300">
                      ⚠️ {issue}
                    </div>
                  ))}
                </div>
              )}

              <p className="text-sm text-muted-foreground">{result.explanation}</p>
            </div>

            {/* Side by side comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-red-50/60 dark:bg-red-900/10 rounded-3xl p-4 border border-red-200/40">
                <p className="text-xs font-bold text-red-500 mb-2">❌ Bạn nói</p>
                <p className="text-sm">{text}</p>
              </div>
              <div className="bg-green-50/60 dark:bg-green-900/10 rounded-3xl p-4 border border-green-200/40">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-green-600">✅ Đã sửa</p>
                  <button
                    onClick={() => playTTS(result.corrected)}
                    className="text-green-600 hover:text-green-700"
                  >
                    {ttsLoading === result.corrected
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-sm font-medium">{result.corrected}</p>
              </div>
            </div>

            {/* Alternative phrases */}
            {result.alternatives.length > 0 && (
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur rounded-3xl p-5 border border-kawaii-purple/20 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-kawaii-purple" />
                  <p className="font-bold text-sm">Cách người bản ngữ thường nói</p>
                </div>
                <div className="space-y-2">
                  {result.alternatives.map((alt, i) => (
                    <div key={i} className="flex items-center justify-between bg-kawaii-lavender/10 rounded-2xl px-4 py-3">
                      <p className="text-sm">{alt}</p>
                      <button
                        onClick={() => playTTS(alt)}
                        className="text-kawaii-purple hover:text-kawaii-pink ml-3 shrink-0"
                      >
                        {ttsLoading === alt
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Try another */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => { setText(""); setResult(null); }}
                className="rounded-2xl flex-1"
              >
                Thử câu khác
              </Button>
              <Button
                onClick={() => playTTS(result.corrected)}
                variant="outline"
                className="rounded-2xl gap-2"
              >
                <Volume2 className="w-4 h-4" /> Nghe lại
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Badges info */}
      <div className="mt-8 flex flex-wrap gap-2">
        <Badge variant="outline" className="rounded-full">+10 XP mỗi phân tích</Badge>
        <Badge variant="outline" className="rounded-full">+5 🪙 nếu câu đúng</Badge>
      </div>
    </div>
  );
}
