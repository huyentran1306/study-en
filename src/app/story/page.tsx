"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame, useTranslation } from "@/contexts/game-context";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  XCircle,
  Zap,
  RotateCcw,
  Sparkles,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
      if (bodyStartTime.current) {
        const mins = (Date.now() - bodyStartTime.current) / 60000;
        const wordCount = story.body.split(/\s+/).length;
        const wpm = Math.round(wordCount / Math.max(mins, 0.1));
        setReadWPM(wpm);
        if (wpm >= 150) unlockAchievement("speed_reader");
      }
      setPhase("question");
    } else if (phase === "question") {
      setPhase("conclusion");
    } else if (phase === "conclusion") {
      addXP(20);
      addCoins(10);
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
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="pro-card p-8 sm:p-10 text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto border border-indigo-200/60 dark:border-indigo-800/60">
          <Trophy className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground">Hoàn Thành Bài Đọc Ngữ Cảnh!</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Bạn đã xuất sắc nhận được <strong className="text-indigo-600 dark:text-indigo-400">+{earnedXP} XP</strong> &amp; <strong className="text-amber-500">+10 Coins</strong>
          </p>
        </div>

        {readWPM && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
            <Zap className="h-3.5 w-3.5 text-indigo-500" />
            <span>Tốc độ đọc trung bình: <strong className="text-foreground">{readWPM} WPM</strong></span>
          </div>
        )}

        {vocabList.length > 0 && (
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-750 text-left space-y-3 max-w-lg mx-auto">
            <p className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Thuật ngữ ghi nhớ từ bài đọc:
            </p>
            <div className="grid gap-2">
              {vocabList.map((v, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                  <span className="font-bold text-foreground">{v.word}</span>
                  <span className="text-muted-foreground">{v.meaning}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button onClick={onComplete} className="btn-pro px-8 py-3 text-xs font-bold">
          Quay lại danh mục truyện
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reading Progress Stepper */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          {phase === "intro" ? "Phần 1: Khởi đầu bối cảnh" :
           phase === "body" ? "Phần 2: Diễn biến tình huống" :
           phase === "question" ? "Phần 3: Kiểm tra hiểu ngữ cảnh" : "Phần 4: Tổng kết & Đúc kết"}
        </span>
        <span>
          {phase === "intro" ? "1 / 4" : phase === "body" ? "2 / 4" : phase === "question" ? "3 / 4" : "4 / 4"}
        </span>
      </div>

      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 transition-all duration-300"
          style={{
            width: phase === "intro" ? "25%" : phase === "body" ? "50%" : phase === "question" ? "75%" : "100%",
          }}
        />
      </div>

      {/* Reader Article Card */}
      {phase !== "question" ? (
        <div className="pro-card p-8 sm:p-10 space-y-6 min-h-[220px]">
          <div className="prose dark:prose-invert max-w-none text-base sm:text-lg leading-relaxed text-slate-800 dark:text-slate-100 font-normal">
            {displayed}
            {!typingDone && <span className="inline-block w-1.5 h-4 bg-indigo-600 ml-1 animate-pulse" />}
          </div>

          {vocabList.length > 0 && phase === "intro" && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground mr-1">Thuật ngữ chính:</span>
              {vocabList.map((v, i) => (
                <span key={i} className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                  {v.word}
                </span>
              ))}
            </div>
          )}

          {typingDone && (
            <div className="pt-4 flex justify-end">
              <Button onClick={advance} className="btn-pro text-xs font-bold gap-2">
                <span>Tiếp tục</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Comprehension Check Phase */
        <div className="pro-card p-8 space-y-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-md border border-indigo-200/60 dark:border-indigo-800/60">
              Kiểm tra khả năng thấu hiểu (Comprehension Check)
            </span>
            <h3 className="text-lg font-bold text-foreground mt-3">{story.mid_question}</h3>
          </div>

          <div className="space-y-2.5">
            {options.map((opt, i) => {
              let btnClass = "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500/50";
              if (answerResult) {
                if (i === story.mid_question_answer) {
                  btnClass = "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold";
                } else if (i === selectedAnswer) {
                  btnClass = "border-rose-500 bg-rose-50/50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300";
                } else {
                  btnClass = "opacity-40 border-slate-200 dark:border-slate-800";
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={!!answerResult}
                  className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all ${btnClass}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {answerResult && (
            <div className="flex items-center justify-between pt-2">
              <span className={`text-xs font-bold ${answerResult === "correct" ? "text-emerald-600" : "text-amber-600"}`}>
                {answerResult === "correct" ? "Chính xác! (+15 XP)" : "Chưa chính xác, cùng theo dõi phần kết nhé!"}
              </span>

              <Button onClick={advance} className="btn-pro text-xs font-bold gap-1.5">
                <span>Xem kết thúc</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
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
    fetch(`${WORKER_BASE}/api/stories?language=${activeStudyLanguage}&limit=12`)
      .then((r) => r.json())
      .then((res) => setStories(Array.isArray(res) ? res : (res.data || [])))
      .catch(() => setStories([]))
      .finally(() => setLoading(false));
  }, [activeStudyLanguage]);

  if (activeStory) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setActiveStory(null)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Danh mục bài đọc
          </button>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            Cấp độ: {activeStory.level}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          {activeStory.title}
        </h1>

        <StoryReader story={activeStory} onComplete={() => setActiveStory(null)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-foreground">
            Dashboard
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Stories</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
          <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Contextual Reading & Narration Studio
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Rèn luyện khả năng đọc hiểu trong ngữ cảnh câu chuyện, mở rộng vốn từ tự nhiên và cải thiện tốc độ xử lý câu văn.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200/60 dark:border-slate-700" />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="pro-card p-12 text-center text-muted-foreground space-y-2">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold">Chưa có bài đọc nào được tải. Vui lòng thử lại sau!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <motion.button
              key={story.id}
              onClick={() => setActiveStory(story)}
              className="pro-card p-6 text-left hover:-translate-y-1 transition-all group flex flex-col justify-between"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                    {story.level}
                  </span>
                  <BookOpen className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </div>

                <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                  {story.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {story.intro}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <span>Đọc bài này</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
