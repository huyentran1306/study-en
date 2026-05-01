"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/contexts/game-context";
import { Lock, Star, CheckCircle, Trophy, BookOpen, MessageSquare, Gamepad2, Mic, Sword } from "lucide-react";
import Link from "next/link";

interface Level {
  id: number;
  theme: string;
  themeZh: string;
  emoji: string;
  gradient: string;
  xpRequired: number;
  lessons: Lesson[];
  gateXP: number; // XP to pass the gate
}

interface Lesson {
  id: string;
  type: "vocab" | "story" | "roleplay" | "speaking" | "game";
  title: string;
  titleZh: string;
  xpReward: number;
  href: string;
}

const LEVELS: Level[] = [
  {
    id: 1, theme: "Family & Home", themeZh: "家庭与家", emoji: "🏡", gradient: "from-pink-400 to-rose-500",
    xpRequired: 0, gateXP: 100,
    lessons: [
      { id: "l1-vocab", type: "vocab", title: "Family Words", titleZh: "家庭词汇", xpReward: 20, href: "/vocab" },
      { id: "l1-story", type: "story", title: "My Family Story", titleZh: "我的家庭故事", xpReward: 30, href: "/story" },
      { id: "l1-role", type: "roleplay", title: "Meeting Family", titleZh: "认识家人", xpReward: 25, href: "/roleplay" },
      { id: "l1-speak", type: "speaking", title: "Describe Your Home", titleZh: "描述你的家", xpReward: 25, href: "/speaking" },
    ],
  },
  {
    id: 2, theme: "School & Learning", themeZh: "学校与学习", emoji: "🏫", gradient: "from-blue-400 to-indigo-500",
    xpRequired: 100, gateXP: 250,
    lessons: [
      { id: "l2-vocab", type: "vocab", title: "School Vocabulary", titleZh: "学校词汇", xpReward: 20, href: "/vocab" },
      { id: "l2-game", type: "game", title: "Word Scramble Challenge", titleZh: "单词拼写挑战", xpReward: 30, href: "/games" },
      { id: "l2-story", type: "story", title: "A Day at School", titleZh: "在学校的一天", xpReward: 30, href: "/story" },
      { id: "l2-role", type: "roleplay", title: "Classroom Conversation", titleZh: "课堂对话", xpReward: 25, href: "/roleplay" },
    ],
  },
  {
    id: 3, theme: "Food & Dining", themeZh: "饮食与餐饮", emoji: "🍜", gradient: "from-orange-400 to-amber-500",
    xpRequired: 250, gateXP: 450,
    lessons: [
      { id: "l3-vocab", type: "vocab", title: "Food & Drinks", titleZh: "食物与饮料", xpReward: 20, href: "/vocab" },
      { id: "l3-story", type: "story", title: "The Magic Restaurant", titleZh: "神奇的餐厅", xpReward: 30, href: "/story" },
      { id: "l3-role", type: "roleplay", title: "Ordering Food", titleZh: "点餐", xpReward: 30, href: "/roleplay" },
      { id: "l3-speak", type: "speaking", title: "Talk About Your Favorite Food", titleZh: "谈论你最喜欢的食物", xpReward: 25, href: "/speaking" },
    ],
  },
  {
    id: 4, theme: "Work & Business", themeZh: "工作与商务", emoji: "💼", gradient: "from-violet-400 to-purple-500",
    xpRequired: 450, gateXP: 700,
    lessons: [
      { id: "l4-vocab", type: "vocab", title: "Work Vocabulary", titleZh: "工作词汇", xpReward: 20, href: "/vocab" },
      { id: "l4-game", type: "game", title: "Matching Game", titleZh: "配对游戏", xpReward: 30, href: "/games" },
      { id: "l4-role", type: "roleplay", title: "Job Interview", titleZh: "工作面试", xpReward: 35, href: "/roleplay" },
      { id: "l4-speak", type: "speaking", title: "Present Your Ideas", titleZh: "介绍你的想法", xpReward: 25, href: "/speaking" },
    ],
  },
  {
    id: 5, theme: "Travel & Adventure", themeZh: "旅游与冒险", emoji: "✈️", gradient: "from-teal-400 to-cyan-500",
    xpRequired: 700, gateXP: 1000,
    lessons: [
      { id: "l5-vocab", type: "vocab", title: "Travel Words", titleZh: "旅行词汇", xpReward: 20, href: "/vocab" },
      { id: "l5-story", type: "story", title: "The Great Journey", titleZh: "伟大的旅程", xpReward: 30, href: "/story" },
      { id: "l5-role", type: "roleplay", title: "At the Airport", titleZh: "在机场", xpReward: 35, href: "/roleplay" },
      { id: "l5-speak", type: "speaking", title: "Describe a Trip", titleZh: "描述一次旅行", xpReward: 25, href: "/speaking" },
    ],
  },
  {
    id: 6, theme: "Health & Wellness", themeZh: "健康与养生", emoji: "🏃", gradient: "from-green-400 to-emerald-500",
    xpRequired: 1000, gateXP: 1400,
    lessons: [
      { id: "l6-vocab", type: "vocab", title: "Health Vocabulary", titleZh: "健康词汇", xpReward: 20, href: "/vocab" },
      { id: "l6-game", type: "game", title: "Memory Match", titleZh: "记忆配对", xpReward: 30, href: "/games" },
      { id: "l6-story", type: "story", title: "The Healthy Chef", titleZh: "健康的厨师", xpReward: 30, href: "/story" },
      { id: "l6-role", type: "roleplay", title: "At the Doctor", titleZh: "在医院", xpReward: 35, href: "/roleplay" },
    ],
  },
];

const LESSON_ICONS = { vocab: BookOpen, story: BookOpen, roleplay: MessageSquare, speaking: Mic, game: Gamepad2 };
const LESSON_COLORS = { vocab: "from-kawaii-purple to-violet-500", story: "from-kawaii-pink to-rose-400", roleplay: "from-kawaii-sky to-blue-400", speaking: "from-orange-400 to-amber-400", game: "from-green-400 to-emerald-400" };

// Boss battle questions per level
const BOSS_QUESTIONS: Record<number, { q: string; options: string[]; answer: number }[]> = {
  1: [
    { q: "What is a 'sibling'?", options: ["A parent", "A brother or sister", "A cousin", "A neighbor"], answer: 1 },
    { q: "Which word means the place where you live?", options: ["Office", "School", "Home", "Market"], answer: 2 },
    { q: "Fill in: 'My mother is my father's ___'", options: ["daughter", "sister", "wife", "aunt"], answer: 2 },
    { q: "What does 'domestic' mean?", options: ["Foreign", "Related to the home", "Expensive", "Wild"], answer: 1 },
    { q: "Which is NOT a family member?", options: ["Uncle", "Colleague", "Grandparent", "Nephew"], answer: 1 },
  ],
  2: [
    { q: "What is a 'curriculum'?", options: ["A type of food", "A school subjects plan", "A sports event", "A classroom"], answer: 1 },
    { q: "What does 'graduate' mean?", options: ["To fail a test", "To complete a degree", "To enroll", "To skip class"], answer: 1 },
    { q: "Which word means to study hard?", options: ["Slack", "Revise", "Ignore", "Skip"], answer: 1 },
    { q: "What is a 'thesis'?", options: ["A short quiz", "A long research paper", "A classroom exercise", "A textbook"], answer: 1 },
    { q: "Fill in: 'She ___ her exam with flying colors'", options: ["failed", "skipped", "passed", "avoided"], answer: 2 },
  ],
  3: [
    { q: "What does 'cuisine' refer to?", options: ["A type of music", "A style of cooking", "A restaurant name", "A kitchen tool"], answer: 1 },
    { q: "Which word means very tasty?", options: ["Bland", "Delicious", "Sour", "Frozen"], answer: 1 },
    { q: "What is a 'menu'?", options: ["A chef", "A table", "A list of dishes", "A cooking method"], answer: 2 },
    { q: "What does 'appetizer' mean?", options: ["Dessert", "A small dish before main meal", "A drink", "A snack"], answer: 1 },
    { q: "Fill in: 'Can I have the ___ please?' (to see dishes)", options: ["receipt", "menu", "bill", "napkin"], answer: 1 },
  ],
  4: [
    { q: "What is a 'colleague'?", options: ["A boss", "A coworker", "A client", "An enemy"], answer: 1 },
    { q: "What does 'deadline' mean?", options: ["A salary", "The end time for a task", "A promotion", "A meeting"], answer: 1 },
    { q: "What is a 'resume'?", options: ["A business plan", "A document listing your experience", "A work contract", "A job offer"], answer: 1 },
    { q: "Fill in: 'She got a ___ for her hard work'", options: ["deadline", "promotion", "resignation", "complaint"], answer: 1 },
    { q: "What does 'negotiate' mean?", options: ["To argue", "To discuss to reach agreement", "To quit", "To ignore"], answer: 1 },
  ],
  5: [
    { q: "What is an 'itinerary'?", options: ["A type of ticket", "A travel plan", "A hotel room", "A passport"], answer: 1 },
    { q: "What does 'departure' mean?", options: ["Arrival", "Leaving a place", "Landing", "Boarding"], answer: 1 },
    { q: "What is 'jet lag'?", options: ["A type of plane", "Tiredness from flying across time zones", "A travel bag", "A flight delay"], answer: 1 },
    { q: "What does 'souvenir' mean?", options: ["A travel guide", "A keepsake from a trip", "A local food", "A currency"], answer: 1 },
    { q: "Fill in: 'We need to ___ the flight early'", options: ["miss", "board", "cancel", "forget"], answer: 1 },
  ],
  6: [
    { q: "What does 'nutritious' mean?", options: ["Very expensive", "Good for health", "Very sweet", "Quick to cook"], answer: 1 },
    { q: "What is 'aerobic exercise'?", options: ["Swimming only", "Exercise that increases heart rate", "Stretching", "Weightlifting"], answer: 1 },
    { q: "What does 'hydrated' mean?", options: ["Tired", "Having enough water in body", "Hungry", "Energetic"], answer: 1 },
    { q: "What is a 'symptom'?", options: ["A medicine", "A sign of illness", "A doctor", "A hospital"], answer: 1 },
    { q: "Fill in: 'Regular exercise ___ your health'", options: ["harms", "improves", "ignores", "complicates"], answer: 1 },
  ],
};

const XP_MILESTONES = [
  { xp: 100, reward: "🎁 Unlocked: School Level!", emoji: "🏫" },
  { xp: 250, reward: "�� Unlocked: Food Level!", emoji: "🍜" },
  { xp: 450, reward: "🎁 Unlocked: Work Level!", emoji: "💼" },
  { xp: 700, reward: "🎁 Unlocked: Travel Level!", emoji: "✈️" },
  { xp: 1000, reward: "🎁 Unlocked: Health Level!", emoji: "🏃" },
  { xp: 1400, reward: "🏆 All Levels Complete! You're a Master!", emoji: "🏆" },
];

export default function PathPage() {
  const { xp, activeStudyLanguage, addXP, addCoins, unlockAchievement, achievements } = useGame();
  const isZh = activeStudyLanguage === "zh";
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [celebrateMilestone, setCelebrateMilestone] = useState<string | null>(null);
  const [bossLevel, setBossLevel] = useState<Level | null>(null);
  const [bossQ, setBossQ] = useState(0);
  const [bossScore, setBossScore] = useState(0);
  const [bossSelected, setBossSelected] = useState<number | null>(null);
  const [bossResult, setBossResult] = useState<"win" | "lose" | null>(null);
  const [bossAnswered, setBossAnswered] = useState(false);

  // Check milestone when XP changes
  useEffect(() => {
    const lastMilestone = XP_MILESTONES.filter((m) => xp >= m.xp).pop();
    if (lastMilestone) {
      const key = `milestone_${lastMilestone.xp}_seen`;
      if (typeof window !== "undefined" && !sessionStorage.getItem(key)) {
        setCelebrateMilestone(lastMilestone.reward);
        sessionStorage.setItem(key, "1");
        setTimeout(() => setCelebrateMilestone(null), 4000);
      }
    }
  }, [xp]);

  const getProgress = () => {
    const nextMilestone = XP_MILESTONES.find((m) => xp < m.xp);
    if (!nextMilestone) return { current: xp, target: XP_MILESTONES[XP_MILESTONES.length - 1].xp, pct: 100 };
    const prevXP = XP_MILESTONES[XP_MILESTONES.indexOf(nextMilestone) - 1]?.xp || 0;
    const range = nextMilestone.xp - prevXP;
    const progress = xp - prevXP;
    return { current: xp, target: nextMilestone.xp, pct: Math.min(100, Math.round((progress / range) * 100)) };
  };

  const { pct, target } = getProgress();

  const startBoss = (level: Level) => {
    setBossLevel(level);
    setBossQ(0);
    setBossScore(0);
    setBossSelected(null);
    setBossResult(null);
    setBossAnswered(false);
  };

  const answerBoss = (i: number) => {
    if (bossAnswered || !bossLevel) return;
    setBossSelected(i);
    setBossAnswered(true);
    const questions = BOSS_QUESTIONS[bossLevel.id] || [];
    const correct = i === questions[bossQ].answer;
    const newScore = bossScore + (correct ? 1 : 0);
    setBossScore(newScore);
    setTimeout(() => {
      if (bossQ + 1 >= questions.length) {
        const win = newScore >= 3;
        setBossResult(win ? "win" : "lose");
        if (win) {
          addXP(100); addCoins(50);
          const bossKey = `boss_${bossLevel.id}_defeated`;
          if (typeof window !== "undefined" && !sessionStorage.getItem(bossKey)) {
            sessionStorage.setItem(bossKey, "1");
            unlockAchievement("boss_first");
            // Check if all 6 bosses defeated
            const allDefeated = [1,2,3,4,5,6].every(id => sessionStorage.getItem(`boss_${id}_defeated`));
            if (allDefeated) unlockAchievement("boss_all");
          }
        }
      } else {
        setBossQ(q => q + 1);
        setBossSelected(null);
        setBossAnswered(false);
      }
    }, 1000);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Boss Battle Modal */}
      <AnimatePresence>
        {bossLevel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 40 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className={`bg-gradient-to-r ${bossLevel.gradient} p-6 text-white text-center`}>
                <div className="text-5xl mb-2">⚔️</div>
                <h2 className="text-xl font-extrabold">Boss Battle!</h2>
                <p className="text-white/80 text-sm">{isZh ? bossLevel.themeZh : bossLevel.theme} — Level {bossLevel.id}</p>
              </div>
              <div className="p-6">
                {bossResult ? (
                  <div className="text-center py-4 space-y-4">
                    <div className="text-6xl">{bossResult === "win" ? "🏆" : "💀"}</div>
                    <h3 className="text-xl font-bold">{bossResult === "win" ? (isZh ? "胜利！" : "You won!") : (isZh ? "失败..." : "Defeated...")}</h3>
                    <p className="text-muted-foreground text-sm">{bossScore}/5 {isZh ? "答对" : "correct"}</p>
                    {bossResult === "win" && <p className="text-yellow-500 font-bold">+100 XP · +50 🪙</p>}
                    <div className="flex gap-3">
                      {bossResult === "lose" && (
                        <button onClick={() => startBoss(bossLevel)} className="flex-1 py-2.5 rounded-2xl bg-gradient-kawaii text-white font-bold text-sm">
                          {isZh ? "再试一次" : "Try Again"}
                        </button>
                      )}
                      <button onClick={() => setBossLevel(null)} className="flex-1 py-2.5 rounded-2xl border-2 border-gray-200 font-bold text-sm">
                        {isZh ? "关闭" : "Close"}
                      </button>
                    </div>
                  </div>
                ) : (() => {
                  const questions = BOSS_QUESTIONS[bossLevel.id] || [];
                  const q = questions[bossQ];
                  return (
                    <div className="space-y-4">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{isZh ? "问题" : "Question"} {bossQ + 1}/{questions.length}</span>
                        <span>⚔️ {bossScore} {isZh ? "分" : "pts"}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-kawaii rounded-full transition-all" style={{ width: `${(bossQ / questions.length) * 100}%` }} />
                      </div>
                      <p className="font-bold text-base">{q.q}</p>
                      <div className="grid grid-cols-1 gap-2">
                        {q.options.map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => answerBoss(i)}
                            disabled={bossAnswered}
                            className={`py-2.5 px-4 rounded-2xl text-sm font-semibold border-2 text-left transition-all ${
                              bossAnswered
                                ? i === q.answer ? "border-green-400 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                  : i === bossSelected ? "border-red-400 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                                  : "border-gray-200 opacity-50"
                                : "border-gray-200 hover:border-kawaii-purple hover:bg-kawaii-purple/5"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Milestone celebration */}
      <AnimatePresence>
        {celebrateMilestone && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.8 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-kawaii text-white px-6 py-4 rounded-3xl shadow-kawaii text-center font-bold text-sm"
          >
            🎉 {celebrateMilestone}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">
          <span className="bg-gradient-kawaii bg-clip-text text-transparent">
            🗺️ {isZh ? "学习路径" : "Learning Path"}
          </span>
        </h1>
        {/* XP Progress bar */}
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>⭐ {xp} XP</span>
            <span>Next unlock: {target} XP</span>
          </div>
          <div className="h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-kawaii"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Level Path */}
      <div className="relative space-y-0">
        {LEVELS.map((level, idx) => {
          const isUnlocked = xp >= level.xpRequired;
          const isComplete = xp >= level.gateXP;
          const isCurrent = isUnlocked && !isComplete;

          return (
            <div key={level.id} className="relative">
              {/* Connector line */}
              {idx < LEVELS.length - 1 && (
                <div className={`absolute left-1/2 -translate-x-1/2 top-full w-1 h-8 z-0 ${isComplete ? "bg-gradient-kawaii" : "bg-gray-200 dark:bg-gray-700"}`} />
              )}

              <motion.button
                onClick={() => isUnlocked && setSelectedLevel(selectedLevel?.id === level.id ? null : level)}
                disabled={!isUnlocked}
                className={`relative z-10 w-full text-left rounded-3xl p-5 shadow-lg transition-all ${
                  isUnlocked
                    ? `bg-gradient-to-br ${level.gradient} text-white cursor-pointer`
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                }`}
                whileHover={isUnlocked ? { scale: 1.02, y: -2 } : {}}
                whileTap={isUnlocked ? { scale: 0.98 } : {}}
              >
                <div className="flex items-center gap-4">
                  <motion.span
                    className="text-4xl"
                    animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {isComplete ? "✅" : !isUnlocked ? "🔒" : level.emoji}
                  </motion.span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs opacity-70">Level {level.id}</span>
                      {isComplete && <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">Complete!</span>}
                      {isCurrent && <span className="text-xs bg-white/30 rounded-full px-2 py-0.5 animate-pulse">Current</span>}
                    </div>
                    <p className="font-bold text-base">{isZh ? level.themeZh : level.theme}</p>
                    <p className="text-xs opacity-70">{level.lessons.length} lessons · {level.gateXP} XP to unlock next</p>
                  </div>
                  {isUnlocked && (
                    <span className="text-xl">{selectedLevel?.id === level.id ? "▲" : "▼"}</span>
                  )}
                  {!isUnlocked && <Lock className="w-5 h-5" />}
                </div>

                {/* XP progress within level */}
                {isUnlocked && !isComplete && (
                  <div className="mt-3">
                    <div className="h-2 rounded-full bg-white/30 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-white"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.round(((xp - level.xpRequired) / (level.gateXP - level.xpRequired)) * 100))}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                    <p className="text-xs mt-1 opacity-70">{Math.min(100, Math.round(((xp - level.xpRequired) / (level.gateXP - level.xpRequired)) * 100))}% complete</p>
                  </div>
                )}
              </motion.button>

              {/* Lessons dropdown */}
              <AnimatePresence>
                {selectedLevel?.id === level.id && isUnlocked && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden mx-2"
                  >
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-b-3xl p-4 space-y-2 border border-t-0 border-kawaii-purple/10">
                      {level.lessons.map((lesson) => {
                        const Icon = LESSON_ICONS[lesson.type];
                        return (
                          <Link key={lesson.id} href={lesson.href}>
                            <motion.div
                              className={`flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r ${LESSON_COLORS[lesson.type]} text-white cursor-pointer`}
                              whileHover={{ scale: 1.02, x: 3 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="p-2 bg-white/20 rounded-xl">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-sm">{isZh ? lesson.titleZh : lesson.title}</p>
                                <p className="text-xs opacity-80 capitalize">{lesson.type}</p>
                              </div>
                              <span className="text-xs font-bold bg-white/20 rounded-full px-2 py-0.5">+{lesson.xpReward} XP</span>
                            </motion.div>
                          </Link>
                        );
                      })}
                      {/* Boss Battle Button */}
                      <motion.button
                        onClick={() => startBoss(level)}
                        whileHover={{ scale: 1.02, x: 3 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 text-white cursor-pointer"
                      >
                        <div className="p-2 bg-white/20 rounded-xl">
                          <Sword className="w-4 h-4" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-bold text-sm">{isZh ? "⚔️ Boss Battle！" : "⚔️ Boss Battle!"}</p>
                          <p className="text-xs opacity-80">{isZh ? "答对3/5题获胜" : "Answer 3/5 to win"}</p>
                        </div>
                        <span className="text-xs font-bold bg-white/20 rounded-full px-2 py-0.5">+100 XP</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Gate reward badge */}
              {idx < LEVELS.length - 1 && (
                <div className={`relative z-10 mx-auto w-fit mt-0 mb-0 py-1 px-4 rounded-full text-xs font-bold mt-8 mb-0 ${isComplete ? "bg-gradient-kawaii text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-400"}`}>
                  {isComplete ? "🔓 Gate Passed!" : `🔒 Gate: ${level.gateXP} XP`}
                </div>
              )}
            </div>
          );
        })}

        {/* Final achievement */}
        <motion.div
          className={`rounded-3xl p-6 text-center shadow-lg ${xp >= 1400 ? "bg-gradient-to-br from-amber-300 to-yellow-400 text-white" : "bg-gray-100 dark:bg-gray-800 text-muted-foreground"}`}
          animate={xp >= 1400 ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Trophy className={`w-10 h-10 mx-auto mb-2 ${xp >= 1400 ? "text-white" : "text-gray-400"}`} />
          <p className="font-bold text-lg">{isZh ? "大师级别！" : "Master Level!"}</p>
          <p className="text-sm opacity-80">{xp >= 1400 ? "You've completed all levels! 🎉" : `${1400 - xp} XP to unlock`}</p>
        </motion.div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/"><motion.span className="text-sm text-muted-foreground hover:text-kawaii-purple" whileHover={{ scale: 1.05 }}>← Back to Home</motion.span></Link>
      </div>
    </div>
  );
}
