"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Mic, MicOff, RotateCcw, ChevronRight, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useSTTRecorder } from "@/hooks/use-stt-recorder";
import { useGame } from "@/contexts/game-context";

const CATEGORIES = [
  {
    id: "greetings",
    name: "Greetings & Small Talk",
    emoji: "👋",
    color: "from-sky-400 to-blue-500",
    sentences: [
      "How are you doing today?",
      "It's nice to meet you!",
      "What do you do for a living?",
      "How long have you been learning English?",
      "What do you like to do in your free time?",
      "The weather has been really nice lately, hasn't it?",
      "I've been really busy with work this week.",
      "What are your plans for the weekend?",
    ],
  },
  {
    id: "coffee",
    name: "At the Coffee Shop",
    emoji: "☕",
    color: "from-amber-400 to-orange-500",
    sentences: [
      "I'd like a large latte, please.",
      "Could I get that to go?",
      "Do you have any dairy-free options?",
      "How much is the caramel macchiato?",
      "Could I get extra foam on that?",
      "I'll have whatever you recommend.",
      "Is the wifi password available for customers?",
      "Could I get a receipt, please?",
    ],
  },
  {
    id: "workplace",
    name: "Workplace Small Talk",
    emoji: "💼",
    color: "from-green-400 to-emerald-500",
    sentences: [
      "Could we schedule a meeting for tomorrow?",
      "I wanted to follow up on the email I sent.",
      "Let me know if you need any help with that.",
      "I appreciate your feedback on this.",
      "Could you clarify what you mean by that?",
      "I'll have that ready by end of day.",
      "Thank you for bringing this to my attention.",
      "I think we should discuss this further.",
    ],
  },
  {
    id: "phone",
    name: "Phone Conversations",
    emoji: "📱",
    color: "from-purple-400 to-violet-500",
    sentences: [
      "Hello, this is speaking. How can I help you?",
      "I'm calling to make a reservation.",
      "Could you please hold for a moment?",
      "I'm sorry, could you repeat that?",
      "I'll make sure to pass that message along.",
      "Is this a good time to talk?",
      "Let me check my schedule and get back to you.",
      "Thanks for calling, have a great day!",
    ],
  },
  {
    id: "opinions",
    name: "Expressing Opinions",
    emoji: "💬",
    color: "from-pink-400 to-rose-500",
    sentences: [
      "I think that's a really good point.",
      "To be honest, I'm not sure about that.",
      "I completely agree with what you're saying.",
      "That's an interesting perspective.",
      "I see where you're coming from, but...",
      "In my opinion, we should try a different approach.",
      "Could you explain your reasoning behind that?",
      "I hadn't thought about it that way before.",
    ],
  },
];

interface ScoreResult {
  similarity_score: number;
  pronunciation_score: number;
  feedback: string;
  missed_words: string[];
  good_job: string;
}

async function playTTS(text: string): Promise<void> {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang: "en" }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    await audio.play();
    return new Promise<void>((resolve) => {
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
    });
  } catch { /* ignore */ }
}

export default function ShadowingPage() {
  const { addXP, addCoins } = useGame();
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[0] | null>(null);
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [phase, setPhase] = useState<"listen" | "record" | "scored">("listen");
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const hasPlayedRef = useRef(false);

  const { isRecording, isTranscribing, transcript, startRecording, stopRecording, resetTranscript, isSupported } = useSTTRecorder();

  const currentSentence = selectedCategory?.sentences[sentenceIdx] ?? "";

  const handleListen = useCallback(async () => {
    if (isPlayingTTS) return;
    setIsPlayingTTS(true);
    await playTTS(currentSentence);
    setIsPlayingTTS(false);
    if (!hasPlayedRef.current) {
      hasPlayedRef.current = true;
      setPhase("record");
    }
  }, [currentSentence, isPlayingTTS]);

  const handleStopRecording = useCallback(async () => {
    stopRecording();
  }, [stopRecording]);

  // Score when transcript ready
  const handleScore = useCallback(async (spokenText: string) => {
    setIsScoring(true);
    try {
      const res = await fetch("/api/shadowing-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original: currentSentence, transcript: spokenText }),
      });
      const data = await res.json() as ScoreResult;
      setScore(data);
      setPhase("scored");
      setCompletedCount((c) => c + 1);
      addXP(10);
      const sim = data.similarity_score || 0;
      if (sim >= 80) addCoins(10);
    } catch {
      setPhase("scored");
      setScore({ similarity_score: 50, pronunciation_score: 50, feedback: "Keep practicing!", missed_words: [], good_job: "You tried!" });
    } finally {
      setIsScoring(false);
    }
  }, [currentSentence, addXP, addCoins]);

  // Trigger scoring when STT produces result
  const transcriptRef = useRef("");
  transcriptRef.current = transcript;
  const isRecordingRef = useRef(false);
  isRecordingRef.current = isRecording;

  const prevIsTranscribing = useRef(false);
  if (prevIsTranscribing.current && !isTranscribing && transcript && phase === "record") {
    handleScore(transcript);
  }
  prevIsTranscribing.current = isTranscribing;

  const nextSentence = useCallback(() => {
    if (!selectedCategory) return;
    const nextIdx = (sentenceIdx + 1) % selectedCategory.sentences.length;
    setSentenceIdx(nextIdx);
    setPhase("listen");
    setScore(null);
    resetTranscript();
    hasPlayedRef.current = false;
  }, [sentenceIdx, selectedCategory, resetTranscript]);

  const getScoreColor = (s: number) => s >= 80 ? "text-green-500" : s >= 60 ? "text-amber-500" : "text-rose-500";
  const getScoreEmoji = (s: number) => s >= 80 ? "🌟" : s >= 60 ? "👍" : "💪";

  if (!selectedCategory) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/">
            <motion.div className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" whileHover={{ x: -3 }}>
              <ArrowLeft className="w-4 h-4" /> Back
            </motion.div>
          </Link>
        </div>
        <h1 className="text-2xl font-bold mb-1">
          <span className="bg-gradient-kawaii bg-clip-text text-transparent">🔁 Shadowing Mode</span>
        </h1>
        <p className="text-muted-foreground mb-2 text-sm">
          Listen → Repeat → Get scored. The best technique for natural pronunciation!
        </p>
        <div className="bg-kawaii-yellow/20 rounded-2xl px-4 py-3 mb-6 text-sm">
          <p className="font-medium mb-1">💡 How it works:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-muted-foreground">
            <li>Press <strong>Listen</strong> to hear the sentence</li>
            <li>Press <strong>Record</strong> and repeat it</li>
            <li>Get instant pronunciation feedback</li>
          </ol>
        </div>
        <div className="grid gap-4">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat); setSentenceIdx(0); setPhase("listen"); setScore(null); hasPlayedRef.current = false; }}
              className={`p-5 rounded-3xl bg-gradient-to-r ${cat.color} text-white text-left shadow-lg`}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="flex items-center gap-4">
                <motion.span className="text-4xl" animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                  {cat.emoji}
                </motion.span>
                <div>
                  <p className="font-bold text-lg">{cat.name}</p>
                  <p className="text-sm opacity-80">{cat.sentences.length} sentences</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <motion.button
          onClick={() => { setSelectedCategory(null); setSentenceIdx(0); setScore(null); }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          whileHover={{ x: -3 }}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </motion.button>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${selectedCategory.color} text-white text-sm font-medium shadow`}>
          <span>{selectedCategory.emoji}</span>
          <span>{selectedCategory.name}</span>
        </div>
        <div className="ml-auto text-xs text-muted-foreground">
          {sentenceIdx + 1} / {selectedCategory.sentences.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-6 overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${selectedCategory.color} rounded-full`}
          animate={{ width: `${((sentenceIdx + 1) / selectedCategory.sentences.length) * 100}%` }}
          transition={{ type: "spring", stiffness: 100 }}
        />
      </div>

      {/* Sentence card */}
      <motion.div
        key={sentenceIdx}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-white dark:bg-gray-800 shadow-xl p-8 mb-6 text-center border border-kawaii-purple/10"
      >
        <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Repeat this sentence</p>
        <p className="text-xl font-semibold leading-relaxed text-gray-800 dark:text-gray-100">
          &ldquo;{currentSentence}&rdquo;
        </p>
      </motion.div>

      {/* Phase: listen */}
      <AnimatePresence mode="wait">
        {phase === "listen" && (
          <motion.div key="listen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
            <motion.button
              onClick={handleListen}
              disabled={isPlayingTTS}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-semibold shadow-lg text-lg transition-all ${isPlayingTTS ? "bg-gray-400" : `bg-gradient-to-r ${selectedCategory.color} hover:scale-105`}`}
              whileTap={!isPlayingTTS ? { scale: 0.97 } : {}}
            >
              {isPlayingTTS ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6" />}
              {isPlayingTTS ? "Playing..." : "Listen 🔊"}
            </motion.button>
            <p className="text-sm text-muted-foreground">Listen carefully, then you&apos;ll record yourself</p>
          </motion.div>
        )}

        {phase === "record" && (
          <motion.div key="record" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
            <motion.button
              onClick={handleListen}
              disabled={isPlayingTTS}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <Play className="w-3 h-3" /> Listen again
            </motion.button>
            <motion.button
              onClick={isRecording ? handleStopRecording : startRecording}
              disabled={isTranscribing || isScoring || !isSupported}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all ${isRecording ? "bg-gradient-to-br from-rose-400 to-pink-500 scale-110" : isTranscribing || isScoring ? "bg-gray-300 dark:bg-gray-600" : `bg-gradient-to-r ${selectedCategory.color} hover:scale-105`}`}
              animate={isRecording ? { scale: [1.1, 1.15, 1.1] } : {}}
              transition={{ duration: 0.8, repeat: Infinity }}
              whileTap={!isRecording && !isTranscribing ? { scale: 0.95 } : {}}
            >
              {isTranscribing || isScoring ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : isRecording ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
            </motion.button>
            <p className="text-sm text-muted-foreground">
              {isRecording ? "🔴 Recording... tap to stop" : isTranscribing ? "⏳ Transcribing..." : isScoring ? "🤖 Scoring..." : "🎤 Tap to record yourself"}
            </p>
            {transcript && !isRecording && (
              <p className="text-sm italic text-muted-foreground">You said: &ldquo;{transcript}&rdquo;</p>
            )}
          </motion.div>
        )}

        {phase === "scored" && score && (
          <motion.div key="scored" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Score cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center shadow border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-muted-foreground mb-1">Similarity</p>
                <p className={`text-3xl font-bold ${getScoreColor(score.similarity_score)}`}>
                  {getScoreEmoji(score.similarity_score)} {score.similarity_score}%
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center shadow border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-muted-foreground mb-1">Pronunciation</p>
                <p className={`text-3xl font-bold ${getScoreColor(score.pronunciation_score)}`}>
                  {getScoreEmoji(score.pronunciation_score)} {score.pronunciation_score}%
                </p>
              </div>
            </div>

            {/* Feedback */}
            <div className="bg-kawaii-mint/20 rounded-2xl p-4">
              <p className="text-sm font-medium mb-1">🌟 Good job!</p>
              <p className="text-sm text-muted-foreground">{score.good_job}</p>
            </div>
            <div className="bg-kawaii-yellow/20 rounded-2xl p-4">
              <p className="text-sm font-medium mb-1">💡 Feedback</p>
              <p className="text-sm text-muted-foreground">{score.feedback}</p>
            </div>
            {score.missed_words.length > 0 && (
              <div className="bg-kawaii-pink/20 rounded-2xl p-4">
                <p className="text-sm font-medium mb-2">🎯 Focus on these words:</p>
                <div className="flex flex-wrap gap-2">
                  {score.missed_words.map((w) => (
                    <span key={w} className="px-3 py-1 bg-white dark:bg-gray-700 rounded-full text-sm font-medium shadow-sm">{w}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <motion.button
                onClick={() => { setPhase("listen"); setScore(null); resetTranscript(); hasPlayedRef.current = false; }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-100 dark:bg-gray-700 font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RotateCcw className="w-4 h-4" /> Try Again
              </motion.button>
              <motion.button
                onClick={nextSentence}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r ${selectedCategory.color} text-white font-medium text-sm shadow`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Next <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>

            {completedCount >= selectedCategory.sentences.length && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="font-bold text-lg">Category Complete! 🎉</p>
                <p className="text-sm text-muted-foreground">You finished all sentences in this category!</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
