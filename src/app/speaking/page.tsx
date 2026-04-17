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
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { Mascot } from "@/components/mascot";
import { useGame } from "@/contexts/game-context";

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
  { key: "pronunciation_score", label: "Pronunciation", emoji: "👄", gradient: "from-kawaii-pink to-rose-400" },
  { key: "grammar_score", label: "Grammar", emoji: "📖", gradient: "from-kawaii-sky to-blue-400" },
  { key: "fluency_score", label: "Fluency", emoji: "🌊", gradient: "from-kawaii-purple to-violet-400" },
  { key: "overall_score", label: "Overall", emoji: "⭐", gradient: "from-kawaii-yellow to-amber-400" },
];

export default function SpeakingPage() {
  const { transcript, isListening, startListening, stopListening, resetTranscript, isSupported } = useSpeechRecognition();
  const [manualText, setManualText] = useState("");
  const [feedback, setFeedback] = useState<SpeechFeedback | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [mascotMood, setMascotMood] = useState<"happy" | "thinking" | "excited" | "cheering">("happy");
  const { addXP, addCoins } = useGame();

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
    setMascotMood("thinking");
    try {
      const response = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToAnalyze }),
      });
      const data = await response.json();
      setFeedback(data.feedback);
      
      // Reward based on score
      const overall = data.feedback?.overall_score || 5;
      addXP(overall * 3);
      if (overall >= 7) {
        addCoins(15);
        setMascotMood("cheering");
      } else {
        setMascotMood("excited");
      }
      setTimeout(() => setMascotMood("happy"), 3000);
    } catch {
      console.error("Failed to analyze speech");
      setMascotMood("happy");
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
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-4">
          <Mascot mood={mascotMood} size="md" />
          <div>
            <h1 className="text-2xl font-bold">
              <span className="bg-gradient-kawaii bg-clip-text text-transparent">
                🎤 Speaking Practice
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Record your voice & get AI feedback! ✨
            </p>
          </div>
        </div>

        {/* Practice Prompt */}
        <div className="rounded-3xl bg-gradient-to-br from-kawaii-purple/20 to-kawaii-pink/20 p-6 shadow-kawaii">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎯</span>
              <span className="font-bold text-sm">Practice Prompt</span>
              <Badge className="text-xs rounded-full bg-white/50 text-foreground">
                {currentPrompt + 1}/{PRACTICE_PROMPTS.length}
              </Badge>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={getNewPrompt}
                className="gap-1.5 rounded-xl"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                New Prompt
              </Button>
            </motion.div>
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
        <div className="rounded-3xl bg-white/70 dark:bg-gray-800/70 backdrop-blur p-6 shadow-kawaii space-y-5">
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
                      className="absolute inset-0 rounded-full bg-kawaii-pink/30"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full bg-kawaii-pink/20"
                      animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                    />
                  </>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={isListening ? stopListening : startListening}
                  className={`relative flex h-24 w-24 items-center justify-center rounded-full text-white shadow-kawaii-lg transition-all ${
                    isListening
                      ? "bg-gradient-to-br from-red-400 to-rose-500"
                      : "bg-gradient-to-br from-kawaii-pink to-rose-400"
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
                className={`rounded-full px-4 py-1.5 text-sm ${
                  isListening ? "bg-red-100 text-red-600" : "bg-kawaii-purple/20"
                }`}
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
              className="rounded-2xl bg-kawaii-purple/10 p-4"
            >
              <p className="text-xs font-semibold text-kawaii-purple mb-2 flex items-center gap-1">
                🎙️ Transcript
              </p>
              <p className="text-base leading-relaxed">{transcript}</p>
            </motion.div>
          ) : (
            <Textarea
              placeholder="Or type your response here..."
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              className="min-h-[120px] rounded-2xl border-kawaii-purple/20"
            />
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
              <Button
                onClick={analyzeSpeech}
                disabled={!textToAnalyze.trim() || isAnalyzing}
                className="w-full gap-2 rounded-2xl bg-gradient-kawaii text-white shadow-kawaii"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isAnalyzing ? "Analyzing..." : "Get AI Feedback ✨"}
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                onClick={() => { resetTranscript(); setManualText(""); setFeedback(null); }}
                className="gap-2 rounded-2xl border-2 border-kawaii-purple/30"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </motion.div>
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
                      className="rounded-3xl bg-white/70 dark:bg-gray-800/70 p-4 text-center shadow-kawaii"
                    >
                      <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg text-2xl`}>
                        {emoji}
                      </div>
                      <div className={`text-3xl font-extrabold bg-gradient-to-br ${gradient} bg-clip-text text-transparent`}>
                        {score}
                        <span className="text-base font-medium opacity-60">/10</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{getScoreLabel(score)}</p>
                      {/* Mini progress bar */}
                      <div className="mt-2 h-2 w-full rounded-full bg-kawaii-purple/10 overflow-hidden">
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
                <div className="rounded-3xl bg-kawaii-yellow/20 p-5 space-y-3 shadow-kawaii">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    Corrections
                  </div>
                  {feedback.corrections.map((c, i) => (
                    <div key={i} className="rounded-2xl bg-white/60 dark:bg-gray-800/60 p-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span className="line-through text-red-400">{c.original}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-kawaii-mint">{c.corrected}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{c.explanation}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tips */}
              {feedback.tips && feedback.tips.length > 0 && (
                <div className="rounded-3xl bg-kawaii-sky/20 p-5 space-y-2 shadow-kawaii">
                  <div className="flex items-center gap-2 font-bold">
                    <Lightbulb className="h-5 w-5 text-kawaii-sky" />
                    Tips for Improvement
                  </div>
                  <ul className="space-y-2">
                    {feedback.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-kawaii-purple mt-0.5 shrink-0">✦</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improved Version */}
              {feedback.improved_version && (
                <div className="rounded-3xl bg-kawaii-mint/20 p-5 shadow-kawaii">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 font-bold">
                      <CheckCircle2 className="h-5 w-5 text-kawaii-mint" />
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
