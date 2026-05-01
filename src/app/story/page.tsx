"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame, useTranslation } from "@/contexts/game-context";
import { ArrowLeft, BookOpen, CheckCircle2, XCircle, Zap } from "lucide-react";
import Link from "next/link";

const WORKER_BASE = process.env.NEXT_PUBLIC_WORKER_URL || "https://d1-template.trann46698.workers.dev";

interface Story {
  id: string;
  language: string;
  level: string;
  title: string;
  intro: string;
  body: string;
  mid_question: string;
  mid_question_options: string;
  mid_question_answer: number;
  conclusion: string;
  vocab_highlight: string;
  emoji: string;
}

type StoryPhase = "intro" | "body" | "question" | "conclusion" | "done";

function useTypingEffect(text: string, speed = 15) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const idx = useRef(0);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    idx.current = 0;
    if (!text) return;
    const timer = setInterval(() => {
      idx.current++;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayed, done };
}

function StoryReader({ story, onComplete }: { story: Story; onComplete: () => void }) {
  const { addXP, addCoins, unlockAchievement } = useGame();
  const [phase, setPhase] = useState<StoryPhase>("intro");
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<"correct" | "wrong" | null>(null);
  const [earnedXP, setEarnedXP] = useState(0);
  const [readWPM, setReadWPM] = useState<number | null>(null);
  const bodyStartTime = useRef<number | null>(null);

  const options: string[] = JSON.parse(story.mid_question_options || "[]");
  const vocabList: { word: string; meaning: string }[] = JSON.parse(story.vocab_highlight || "[]");

  const currentText =
    phase === "intro" ? story.intro :
    phase === "body" ? story.body :
    phase === "conclusion" ? story.conclusion : "";

  const { displayed, done: typingDone } = useTypingEffect(currentText, 15);

  const handleAnswer = (i: number) => {
    if (answerResult) return;
    setSelectedAnswer(i);
    const correct = i === story.mid_question_answer;
    setAnswerResult(correct ? "correct" : "wrong");
    const xp = correct ? 15 : 5;
    setEarnedXP((p) => p + xp);
    addXP(xp);
  };

  const advance = () => {
    if (phase === "intro") {
      setPhase("body");
      bodyStartTime.current = Date.now();
    } else if (phase === "body") {
      // Calculate WPM
      if (bodyStartTime.current) {
        const mins = (Date.now() - bodyStartTime.current) / 60000;
        const wordCount = story.body.split(/\s+/).length;
        const wpm = Math.round(wordCount / Math.max(mins, 0.1));
        setReadWPM(wpm);
        if (wpm >= 150) unlockAchievement("speed_reader");
      }
      setPhase("question");
    } else if (phase === "question") setPhase("conclusion");
    else if (phase === "conclusion") {
      addXP(20); addCoins(10);
      setEarnedXP((p) => p + 20);
      if (!sessionStorage.getItem("first_story")) {
        sessionStorage.setItem("first_story", "1");
        unlockAchievement("first_story");
      }
      setPhase("done");
    }
  };

  if (phase === "done") {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-10">
        <motion.div className="text-7xl" animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }} transition={{ duration: 0.6 }}>🎉</motion.div>
        <h2 className="text-2xl font-bold">Story Complete!</h2>
        <p className="text-muted-foreground">You earned <span className="font-bold text-kawaii-purple">{earnedXP} XP</span> &amp; <span className="font-bold text-amber-500">10 coins</span></p>
        {readWPM && (
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold ${readWPM >= 150 ? "bg-yellow-100 text-yellow-700 border border-yellow-300" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
            <Zap className="h-4 w-4" />
            {readWPM} WPM {readWPM >= 150 ? "⚡ Speed Reader!" : "reading speed"}
          </div>
        )}
        {vocabList.length > 0 && (
          <div className="rounded-2xl bg-kawaii-purple/10 p-4 text-left space-y-2">
            <p className="font-bold text-sm">📚 Vocabulary Learned:</p>
            {vocabList.map((v, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="font-bold">{v.word}</span>
                <span className="text-muted-foreground">— {v.meaning}</span>
              </div>
            ))}
          </div>
        )}
        <motion.button onClick={onComplete} className="px-6 py-3 rounded-2xl bg-gradient-kawaii text-white font-bold shadow-kawaii" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          ← Back to Stories
        </motion.button>
      </motion.div>
    );
  }

  if (phase === "question") {
    return (
      <motion.div key="question" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        <div className="text-center mb-2"><span className="inline-block px-3 py-1 rounded-full bg-kawaii-yellow/30 text-xs font-bold">❓ Mid-Story Check</span></div>
        <div className="rounded-2xl bg-gradient-to-br from-kawaii-purple/20 to-kawaii-pink/10 p-5">
          <p className="font-bold text-base leading-relaxed">{story.mid_question}</p>
        </div>
        <div className="space-y-2">
          {options.map((opt, i) => {
            const isSelected = selectedAnswer === i;
            const isCorrect = i === story.mid_question_answer;
            let cls = "w-full text-left p-4 rounded-2xl font-medium transition-all border-2 ";
            if (!answerResult) cls += "bg-white/60 dark:bg-gray-700/60 border-transparent hover:border-kawaii-purple/30";
            else if (isCorrect) cls += "bg-green-100 dark:bg-green-900/30 border-green-400";
            else if (isSelected) cls += "bg-red-100 dark:bg-red-900/30 border-red-400";
            else cls += "bg-white/40 dark:bg-gray-700/40 border-transparent opacity-60";
            return (
              <motion.button key={i} onClick={() => handleAnswer(i)} className={cls} whileHover={!answerResult ? { scale: 1.02 } : {}} whileTap={!answerResult ? { scale: 0.98 } : {}}>
                <span className="flex items-center gap-2">
                  {answerResult && isCorrect && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                  {answerResult && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                  {opt}
                </span>
              </motion.button>
            );
          })}
        </div>
        {answerResult && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <p className={`text-sm font-bold text-center ${answerResult === "correct" ? "text-green-600" : "text-orange-600"}`}>
              {answerResult === "correct" ? "✅ Correct! +15 XP" : "❌ Not quite — +5 XP for trying!"}
            </p>
            <motion.button onClick={advance} className="w-full py-3 rounded-2xl bg-gradient-kawaii text-white font-bold shadow-kawaii" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              Continue Story →
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div key={phase} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block px-3 py-1 rounded-full bg-kawaii-purple/20 text-xs font-bold capitalize">
            {phase === "intro" ? "📖 Introduction" : phase === "body" ? "📚 Story" : "🏁 Conclusion"}
          </span>
          <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-xs font-medium text-amber-700 capitalize">{story.level}</span>
        </div>
        <div className="rounded-3xl bg-white/70 dark:bg-gray-800/70 backdrop-blur p-6 shadow-kawaii min-h-[120px]">
          <p className="text-base leading-relaxed whitespace-pre-line">
            {displayed}
            {!typingDone && <span className="inline-block w-0.5 h-4 bg-kawaii-purple ml-0.5 animate-pulse" />}
          </p>
        </div>
        {phase === "body" && vocabList.length > 0 && typingDone && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2">
            {vocabList.map((v, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-kawaii-purple/10 text-sm font-medium">
                <span className="font-bold">{v.word}</span>
                <span className="text-muted-foreground">= {v.meaning}</span>
              </span>
            ))}
          </motion.div>
        )}
        {typingDone && (
          <motion.button onClick={advance} className="w-full py-3 rounded-2xl bg-gradient-kawaii text-white font-bold shadow-kawaii" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            {phase === "intro" ? "Continue →" : phase === "body" ? "Answer Question →" : "Finish Story 🎉"}
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default function StoryPage() {
  const { activeStudyLanguage } = useGame();
  const t = useTranslation();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStory, setActiveStory] = useState<Story | null>(null);

  useEffect(() => {
    setLoading(true);
    setActiveStory(null);
    fetch(`${WORKER_BASE}/api/stories?language=${activeStudyLanguage}&limit=30`)
      .then((r) => r.json())
      .then((res) => setStories(res.data || res))
      .catch(() => setStories([]))
      .finally(() => setLoading(false));
  }, [activeStudyLanguage]);

  const levelColors: Record<string, string> = {
    beginner: "from-green-300 to-emerald-400",
    intermediate: "from-blue-300 to-indigo-400",
    advanced: "from-purple-300 to-violet-400",
  };

  if (activeStory) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.button onClick={() => setActiveStory(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4" whileHover={{ x: -3 }}>
          <ArrowLeft className="w-4 h-4" /> Back to stories
        </motion.button>
        <div className="mb-4">
          <h2 className="text-xl font-bold">{activeStory.emoji} {activeStory.title}</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-kawaii-purple/20 font-medium capitalize">{activeStory.level}</span>
        </div>
        <StoryReader story={activeStory} onComplete={() => setActiveStory(null)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="w-6 h-6 text-kawaii-purple" />
        <h1 className="text-2xl font-bold">
          <span className="bg-gradient-kawaii bg-clip-text text-transparent">
            {activeStudyLanguage === "zh" ? "📖 故事阅读" : `📖 ${t.story}`}
          </span>
        </h1>
      </div>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 rounded-3xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse" />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-3">📭</p>
          <p>No stories yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <motion.button
              key={story.id}
              onClick={() => setActiveStory(story)}
              className={`p-5 rounded-3xl bg-gradient-to-br ${levelColors[story.level] || "from-gray-300 to-gray-400"} text-white text-left shadow-lg`}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.97 }}
            >
              <motion.span className="text-4xl block mb-2" animate={{ y: [0, -4, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
                {story.emoji}
              </motion.span>
              <h3 className="text-base font-bold leading-tight mb-1">{story.title}</h3>
              <span className="text-xs opacity-80 capitalize">{story.level}</span>
            </motion.button>
          ))}
        </div>
      )}
      <div className="mt-8 text-center">
        <Link href="/"><motion.span className="text-sm text-muted-foreground hover:text-kawaii-purple" whileHover={{ scale: 1.05 }}>← Back to Home</motion.span></Link>
      </div>
    </div>
  );
}
