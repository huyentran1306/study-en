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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";

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
  "Describe your daily routine in the morning.",
  "Tell me about your favorite hobby and why you enjoy it.",
  "Explain the advantages and disadvantages of working from home.",
  "Describe a memorable trip or vacation you have taken.",
  "What would you do if you won a million dollars?",
  "Talk about a person who has influenced your life.",
  "Describe the city or town where you live.",
  "What are your goals for the next five years?",
];

const SCORE_CONFIG = [
  { key: "pronunciation_score", label: "Pronunciation", emoji: "👄", gradient: "from-pink-400 to-rose-500" },
  { key: "grammar_score", label: "Grammar", emoji: "📖", gradient: "from-blue-400 to-cyan-500" },
  { key: "fluency_score", label: "Fluency", emoji: "🌊", gradient: "from-purple-400 to-violet-500" },
  { key: "overall_score", label: "Overall", emoji: "⭐", gradient: "from-amber-400 to-orange-500" },
];

export default function SpeakingPage() {
  const { transcript, isListening, startListening, stopListening, resetTranscript, isSupported } = useSpeechRecognition();
  const [manualText, setManualText] = useState("");
  const [feedback, setFeedback] = useState<SpeechFeedback | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(0);

  const textToAnalyze = transcript || manualText;

  const getNewPrompt = () => {
    setCurrentPrompt((prev) => (prev + 1) % PRACTICE_PROMPTS.length);
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
        body: JSON.stringify({ text: textToAnalyze }),
      });
      const data = await response.json();
      setFeedback(data.feedback);
    } catch {
      console.error("Failed to analyze speech");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.85;
      speechSynthesis.speak(utterance);
    }
  };

  const getScoreLabel = (score: number) => {
    if (score >= 9) return "Excellent! 🏆";
    if (score >= 7) return "Great! 🌟";
    if (score >= 5) return "Good 👍";
    return "Keep practicing 💪";
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 shadow-md text-2xl">
              🎤
            </span>
            Speaking Practice
          </h1>
          <p className="mt-1 text-muted-foreground">
            Record your voice and get instant AI feedback! 🌟
          </p>
        </div>

        {/* Practice Prompt */}
        <div className="rounded-2xl border-2 border-purple-200/50 dark:border-purple-800/50 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎯</span>
              <span className="font-bold text-sm">Practice Prompt</span>
              <Badge variant="secondary" className="text-xs rounded-full">
                {currentPrompt + 1}/{PRACTICE_PROMPTS.length}
              </Badge>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={getNewPrompt}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-xl px-3 py-1.5 hover:bg-white/50 dark:hover:bg-white/10"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              New Prompt
            </motion.button>
          </div>
          <p className="text-lg font-semibold leading-relaxed">
            {PRACTICE_PROMPTS[currentPrompt]}
          </p>
          <button
            className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => speakText(PRACTICE_PROMPTS[currentPrompt])}
          >
            <Volume2 className="h-4 w-4" />
            Listen to prompt
          </button>
        </div>

        {/* Recording Area */}
        <div className="rounded-2xl border-2 border-border/50 bg-card/80 p-6 space-y-5">
          <div>
            <h2 className="font-bold text-base">Your Response</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isSupported
                ? "Click the microphone to start recording, or type your response"
                : "Type your response below to get AI feedback"}
            </p>
          </div>

          {/* Big Mic Button */}
          {isSupported && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="relative">
                {isListening && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full bg-red-400/20"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full bg-red-400/10"
                      animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                    />
                  </>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={isListening ? stopListening : startListening}
                  className={`relative flex h-24 w-24 items-center justify-center rounded-full text-white shadow-cute-lg transition-all ${
                    isListening
                      ? "bg-gradient-to-br from-red-400 to-rose-500"
                      : "bg-gradient-to-br from-pink-400 to-rose-500 hover:shadow-pink"
                  }`}
                >
                  {isListening ? (
                    <MicOff className="h-10 w-10" />
                  ) : (
                    <Mic className="h-10 w-10" />
                  )}
                </motion.button>
              </div>
              <Badge
                variant={isListening ? "destructive" : "secondary"}
                className={`rounded-full px-4 py-1.5 text-sm ${isListening ? "" : ""}`}
              >
                {isListening ? "🔴 Recording... Click to stop" : "🎤 Click to record"}
              </Badge>
            </div>
          )}

          {/* Transcript / Manual Input */}
          {transcript ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-violet-200/50 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-900/20 p-4"
            >
              <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mb-2 flex items-center gap-1">
                🎙️ Transcript
              </p>
              <p className="text-base leading-relaxed">{transcript}</p>
            </motion.div>
          ) : (
            <Textarea
              placeholder="Or type your response here..."
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              className="min-h-[120px] rounded-2xl border-border/50"
            />
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
              <Button
                onClick={analyzeSpeech}
                disabled={!textToAnalyze.trim() || isAnalyzing}
                className="w-full gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-pink"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isAnalyzing ? "Analyzing..." : "Get AI Feedback ✨"}
              </Button>
            </motion.div>
            <Button
              variant="outline"
              onClick={() => { resetTranscript(); setManualText(""); setFeedback(null); }}
              className="gap-2 rounded-2xl"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>

        {/* Feedback Section */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Score Cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {SCORE_CONFIG.map(({ key, label, emoji, gradient }) => {
                  const score = feedback[key as keyof SpeechFeedback] as number;
                  return (
                    <motion.div
                      key={key}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileHover={{ scale: 1.03, y: -2 }}
                      className="rounded-2xl border border-border/50 bg-card/80 p-4 text-center shadow-sm"
                    >
                      <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-sm text-2xl`}>
                        {emoji}
                      </div>
                      <div className={`text-3xl font-extrabold bg-gradient-to-br ${gradient} bg-clip-text text-transparent`}>
                        {score}
                        <span className="text-base font-medium opacity-60">/10</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{getScoreLabel(score)}</p>
                      {/* Mini progress bar */}
                      <div className="mt-2 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${score * 10}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Corrections */}
              {feedback.corrections && feedback.corrections.length > 0 && (
                <div className="rounded-2xl border-2 border-amber-200/50 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/20 p-5 space-y-3">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    Corrections
                  </div>
                  {feedback.corrections.map((c, i) => (
                    <div key={i} className="rounded-xl border border-amber-200/50 dark:border-amber-800/50 bg-white/60 dark:bg-black/20 p-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span className="line-through text-red-400">{c.original}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-green-600 dark:text-green-400">{c.corrected}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{c.explanation}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tips */}
              {feedback.tips && feedback.tips.length > 0 && (
                <div className="rounded-2xl border-2 border-blue-200/50 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/20 p-5 space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <Lightbulb className="h-5 w-5 text-blue-500" />
                    Tips for Improvement
                  </div>
                  <ul className="space-y-2">
                    {feedback.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-blue-500 mt-0.5 shrink-0">✦</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improved Version */}
              {feedback.improved_version && (
                <div className="rounded-2xl border-2 border-green-200/50 dark:border-green-800/50 bg-green-50/50 dark:bg-green-900/20 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 font-bold">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      Improved Version ✨
                    </div>
                    <button
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => speakText(feedback.improved_version)}
                    >
                      <Volume2 className="h-4 w-4" />
                      Listen
                    </button>
                  </div>
                  <Separator className="mb-3" />
                  <p className="text-sm leading-relaxed">{feedback.improved_version}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
