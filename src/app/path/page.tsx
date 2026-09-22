"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/contexts/game-context";
import {
  Lock,
  CheckCircle2,
  Trophy,
  BookOpen,
  MessageSquare,
  Gamepad2,
  Mic,
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Level {
  id: number;
  theme: string;
  themeZh: string;
  emoji: string;
  xpRequired: number;
  gateXP: number;
  lessons: Lesson[];
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
    id: 1, theme: "Professional Foundations & Workplace Intro", themeZh: "职场基础与自我介绍", emoji: "🏢",
    xpRequired: 0, gateXP: 100,
    lessons: [
      { id: "l1-vocab", type: "vocab", title: "Core Workplace Terms", titleZh: "核心职场词汇", xpReward: 20, href: "/vocab" },
      { id: "l1-story", type: "story", title: "First Week Onboarding", titleZh: "入职第一周", xpReward: 30, href: "/story" },
      { id: "l1-role", type: "roleplay", title: "Meeting Team Members", titleZh: "认识团队成员", xpReward: 25, href: "/roleplay" },
      { id: "l1-speak", type: "speaking", title: "Introduce Your Background", titleZh: "介绍你的专业背景", xpReward: 25, href: "/speaking" },
    ],
  },
  {
    id: 2, theme: "Project Alignment & Agile Communication", themeZh: "项目协作与敏捷沟通", emoji: "📊",
    xpRequired: 100, gateXP: 250,
    lessons: [
      { id: "l2-vocab", type: "vocab", title: "Agile & Project Lexicon", titleZh: "敏捷项目词汇", xpReward: 20, href: "/vocab" },
      { id: "l2-game", type: "game", title: "Business Term Recall", titleZh: "商业术语快速回忆", xpReward: 30, href: "/games" },
      { id: "l2-story", type: "story", title: "The Critical Sprint Deadline", titleZh: "关键迭代冲刺", xpReward: 30, href: "/story" },
      { id: "l2-role", type: "roleplay", title: "Sprint Standup Update", titleZh: "每日站会汇报", xpReward: 25, href: "/roleplay" },
    ],
  },
  {
    id: 3, theme: "Client Relations & Networking Protocol", themeZh: "商务接待与人脉拓展", emoji: "🤝",
    xpRequired: 250, gateXP: 450,
    lessons: [
      { id: "l3-vocab", type: "vocab", title: "Networking & Dining Terms", titleZh: "商务社交词汇", xpReward: 20, href: "/vocab" },
      { id: "l3-story", type: "story", title: "The Client Dinner Dialogue", titleZh: "客户晚宴对话", xpReward: 30, href: "/story" },
      { id: "l3-role", type: "roleplay", title: "Coffee Sync & Small Talk", titleZh: "咖啡交流会", xpReward: 30, href: "/roleplay" },
      { id: "l3-speak", type: "speaking", title: "Pitch Your Division's Value", titleZh: "介绍团队核心价值", xpReward: 25, href: "/speaking" },
    ],
  },
  {
    id: 4, theme: "Strategic Negotiation & Contract Terms", themeZh: "商务谈判与合同条款", emoji: "📑",
    xpRequired: 450, gateXP: 700,
    lessons: [
      { id: "l4-vocab", type: "vocab", title: "Contract & Agreement Vocab", titleZh: "合同条款词汇", xpReward: 20, href: "/vocab" },
      { id: "l4-game", type: "game", title: "Negotiation Pair Match", titleZh: "谈判词汇配对", xpReward: 30, href: "/games" },
      { id: "l4-role", type: "roleplay", title: "Vendor Pricing Negotiation", titleZh: "供应商价格谈判", xpReward: 35, href: "/roleplay" },
      { id: "l4-speak", type: "speaking", title: "Argue for SLA Expansion", titleZh: "争取服务等级协议", xpReward: 25, href: "/speaking" },
    ],
  },
  {
    id: 5, theme: "Global Operations & International Travel", themeZh: "跨国业务与差旅沟通", emoji: "✈️",
    xpRequired: 700, gateXP: 1000,
    lessons: [
      { id: "l5-vocab", type: "vocab", title: "Global Logistics Lexicon", titleZh: "国际商务与出行", xpReward: 20, href: "/vocab" },
      { id: "l5-story", type: "story", title: "Overseas Expansion Mission", titleZh: "海外拓展任务", xpReward: 30, href: "/story" },
      { id: "l5-role", type: "roleplay", title: "At the Overseas Branch Office", titleZh: "在海外分部", xpReward: 35, href: "/roleplay" },
      { id: "l5-speak", type: "speaking", title: "Cross-cultural Collaboration", titleZh: "跨文化协作经验", xpReward: 25, href: "/speaking" },
    ],
  },
  {
    id: 6, theme: "Executive Leadership & Board Presentations", themeZh: "高管领导力与董事会汇报", emoji: "🏆",
    xpRequired: 1000, gateXP: 1400,
    lessons: [
      { id: "l6-vocab", type: "vocab", title: "Executive Strategic Terms", titleZh: "战略领导力术语", xpReward: 20, href: "/vocab" },
      { id: "l6-game", type: "game", title: "Executive Decision Drill", titleZh: "高管决策演练", xpReward: 30, href: "/games" },
      { id: "l6-story", type: "story", title: "The Annual Shareholder Meeting", titleZh: "年度股东大会", xpReward: 30, href: "/story" },
      { id: "l6-role", type: "roleplay", title: "Presenting to the Board", titleZh: "董事会战略报告", xpReward: 35, href: "/roleplay" },
    ],
  },
];

const LESSON_ICONS = { vocab: BookOpen, story: BookOpen, roleplay: MessageSquare, speaking: Mic, game: Gamepad2 };

const BOSS_QUESTIONS: Record<number, { q: string; options: string[]; answer: number }[]> = {
  1: [
    { q: "What does 'deliverable' mean in a professional context?", options: ["An email attachment", "A tangible result or product committed to a client", "A physical parcel delivery", "A casual conversation"], answer: 1 },
    { q: "Which term describes a project constraint preventing forward progress?", options: ["Milestone", "Blocker", "Deliverable", "Backlog"], answer: 1 },
    { q: "Fill in: 'Let's schedule a brief ___ to review the contract terms'", options: ["vacation", "alignment", "cancellation", "dispute"], answer: 1 },
    { q: "What does 'onboarding' refer to?", options: ["Boarding an airplane", "The process of integrating a new employee", "Writing a report", "Terminating an account"], answer: 1 },
    { q: "Which word means mutually agreeing on expectations?", options: ["Alignment", "Deviation", "Disconnection", "Stagnation"], answer: 0 },
  ],
  2: [
    { q: "What is an 'agile sprint'?", options: ["A fast athletic race", "A fixed timebox where team completes set tasks", "An annual review", "An unexpected meeting"], answer: 1 },
    { q: "What does 'stakeholder' mean?", options: ["A shareholder only", "Any person with an interest in the project outcome", "An external competitor", "A temporary contractor"], answer: 1 },
    { q: "What does 'to flag an issue' mean?", options: ["To ignore it", "To highlight and bring attention to a problem", "To delete the ticket", "To celebrate success"], answer: 1 },
    { q: "Fill in: 'We need to ___ our queries to minimize server latency.'", options: ["slow down", "optimize", "disable", "postpone"], answer: 1 },
    { q: "What does 'trade-off' imply?", options: ["A fair gift", "Sacrificing one quality in return for another benefit", "An illegal transaction", "A complete error"], answer: 1 },
  ],
  3: [
    { q: "What is 'SLA' an abbreviation for?", options: ["Service Level Agreement", "Standard Legal Action", "System Load Analysis", "Secure Logistics Asset"], answer: 0 },
    { q: "What does 'volume discount' indicate?", options: ["A louder speaker", "Price reduction based on higher purchasing quantity", "A loss in quality", "An inflation rate"], answer: 1 },
    { q: "Fill in: 'Let's connect over coffee to ___ on recent industry trends.'", options: ["catch up", "break down", "fall out", "run away"], answer: 0 },
    { q: "What does 'prospective client' mean?", options: ["A former client", "A potential future customer", "A competitor", "A disgruntled user"], answer: 1 },
    { q: "Which word denotes professional mutual agreement?", options: ["Consensus", "Conflict", "Ambiguity", "Hesitation"], answer: 0 },
  ],
  4: [
    { q: "What does 'procurement' involve in business?", options: ["Selling goods", "The act of purchasing services or materials for a firm", "Filing taxes", "Interviewing staff"], answer: 1 },
    { q: "What does 'binding agreement' mean?", options: ["A physical book", "A legally enforceable contract", "An informal suggestion", "A draft document"], answer: 1 },
    { q: "Fill in: 'The vendor proposed net-30 ___ terms.'", options: ["payment", "holiday", "cancellation", "storage"], answer: 0 },
    { q: "What does 'leverage' in negotiation mean?", options: ["A physical tool", "The power or advantage to influence results", "A severe penalty", "An apology"], answer: 1 },
    { q: "Which term means an agreement clause specifying penalties?", options: ["Breach clause", "Introduction", "Signature", "Font styling"], answer: 0 },
  ],
  5: [
    { q: "What is 'APAC' in corporate geographical planning?", options: ["Asia-Pacific Region", "Atlantic Partnership Asset", "American Policy Action", "Audit Program Council"], answer: 0 },
    { q: "What does 'logistics' refer to in enterprise ops?", options: ["Mathematical theory", "The management of flow of goods and resources", "Website design", "Legal complaints"], answer: 1 },
    { q: "Fill in: 'We are expanding our market ___ into EMEA this quarter.'", options: ["presence", "absence", "farewell", "retreat"], answer: 0 },
    { q: "What does 'compliance' mean in global operations?", options: ["Breaking laws", "Adhering to rules, regulations, and standards", "Complaining loudly", "Marketing products"], answer: 1 },
    { q: "Which term means adapting a product for a foreign region?", options: ["Localization", "Isolation", "Demolition", "Fabrication"], answer: 0 },
  ],
  6: [
    { q: "What is 'governance' at the board level?", options: ["Direct political control", "System by which corporations are directed and controlled", "Advertising campaigns", "Customer support"], answer: 1 },
    { q: "What does 'EBITDA' measure?", options: ["Company employee count", "Operating performance and cash profit metrics", "Marketing clicks", "Patent count"], answer: 1 },
    { q: "Fill in: 'The CEO emphasized long-term shareholder ___.'", options: ["value", "cost", "confusion", "debt"], answer: 0 },
    { q: "What does 'fiduciary duty' mean?", options: ["Legal obligation to act in best interest of another party", "Personal friendship", "Casual advice", "Secret negotiation"], answer: 0 },
    { q: "Which denotes a fundamental shift in company direction?", options: ["Strategic pivot", "Minor typo", "Daily routine", "Coffee break"], answer: 0 },
  ],
};

const XP_MILESTONES = [
  { xp: 100, reward: "Mở khóa Cột mốc 2: Agile Project Communication", level: 2 },
  { xp: 250, reward: "Mở khóa Cột mốc 3: Client Relations & Networking", level: 3 },
  { xp: 450, reward: "Mở khóa Cột mốc 4: Strategic Negotiation", level: 4 },
  { xp: 700, reward: "Mở khóa Cột mốc 5: Global Operations", level: 5 },
  { xp: 1000, reward: "Mở khóa Cột mốc 6: Executive Leadership", level: 6 },
  { xp: 1400, reward: "Hoàn tất Toàn Bộ Lộ Trình Năng Lực Quốc Tế!", level: 6 },
];

export default function PathPage() {
  const { xp, activeStudyLanguage, addXP, addCoins, unlockAchievement } = useGame();
  const isZh = activeStudyLanguage === "zh";
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(LEVELS[0]);
  const [bossLevel, setBossLevel] = useState<Level | null>(null);
  const [bossQ, setBossQ] = useState(0);
  const [bossScore, setBossScore] = useState(0);
  const [bossSelected, setBossSelected] = useState<number | null>(null);
  const [bossResult, setBossResult] = useState<"win" | "lose" | null>(null);
  const [bossAnswered, setBossAnswered] = useState(false);

  const getProgress = () => {
    const nextMilestone = XP_MILESTONES.find((m) => xp < m.xp);
    if (!nextMilestone) return { current: xp, target: XP_MILESTONES[XP_MILESTONES.length - 1].xp, pct: 100 };
    const prevXP = XP_MILESTONES[XP_MILESTONES.indexOf(nextMilestone) - 1]?.xp || 0;
    const range = nextMilestone.xp - prevXP;
    const progress = xp - prevXP;
    return { current: xp, target: nextMilestone.xp, pct: Math.min(100, Math.round((progress / range) * 100)) };
  };

  const { pct, target } = getProgress();

  const startAssessment = (level: Level) => {
    setBossLevel(level);
    setBossQ(0);
    setBossScore(0);
    setBossSelected(null);
    setBossResult(null);
    setBossAnswered(false);
  };

  const answerAssessment = (i: number) => {
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
          addXP(100);
          addCoins(50);
          unlockAchievement("boss_first");
        }
      } else {
        setBossQ((q) => q + 1);
        setBossSelected(null);
        setBossAnswered(false);
      }
    }, 900);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Assessment Modal */}
      <AnimatePresence>
        {bossLevel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="pro-card bg-white dark:bg-slate-900 w-full max-w-md overflow-hidden shadow-2xl border-slate-800"
            >
              <div className="bg-slate-900 p-6 text-white text-center border-b border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Đánh Giá Năng Lực Cột Mốc {bossLevel.id}
                </span>
                <h3 className="text-lg font-extrabold mt-2">{bossLevel.theme}</h3>
              </div>

              <div className="p-6">
                {bossResult ? (
                  <div className="text-center py-4 space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto border border-indigo-200/60 dark:border-indigo-800/60">
                      <Trophy className="w-7 h-7" />
                    </div>

                    <h4 className="text-xl font-bold text-foreground">
                      {bossResult === "win" ? "Đạt Chuẩn Năng Lực!" : "Cần Ôn Tập Thêm"}
                    </h4>

                    <p className="text-xs text-muted-foreground">
                      Bạn đã hoàn thành chính xác <strong className="text-foreground">{bossScore} / 5 câu hỏi</strong>.
                    </p>

                    {bossResult === "win" && (
                      <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 p-2.5 rounded-xl">
                        +100 XP thưởng cột mốc &amp; +50 Coins
                      </div>
                    )}

                    <div className="flex gap-2.5 pt-2">
                      {bossResult === "lose" && (
                        <Button
                          onClick={() => startAssessment(bossLevel)}
                          className="btn-pro flex-1 text-xs font-bold"
                        >
                          Làm lại bài đánh giá
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => setBossLevel(null)}
                        className="flex-1 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold"
                      >
                        Đóng
                      </Button>
                    </div>
                  </div>
                ) : (() => {
                  const questions = BOSS_QUESTIONS[bossLevel.id] || [];
                  const q = questions[bossQ];
                  return (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>Câu hỏi {bossQ + 1} / {questions.length}</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">Điểm: {bossScore}</span>
                      </div>

                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all"
                          style={{ width: `${(bossQ / questions.length) * 100}%` }}
                        />
                      </div>

                      <p className="font-bold text-sm text-foreground leading-relaxed">{q.q}</p>

                      <div className="space-y-2">
                        {q.options.map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => answerAssessment(i)}
                            disabled={bossAnswered}
                            className={`w-full p-3 rounded-xl text-xs font-semibold border text-left transition-all ${
                              bossAnswered
                                ? i === q.answer
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold"
                                  : i === bossSelected
                                  ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                                  : "border-slate-200 dark:border-slate-800 opacity-40"
                                : "border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 bg-slate-50/50 dark:bg-slate-850/50"
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

      {/* Header */}
      <div className="pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-foreground">
            Dashboard
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Learning Roadmap</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
          <Compass className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Professional Competency Roadmap
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Lộ trình năng lực giao tiếp kinh doanh quốc tế từ sơ cấp đến điều hành chiến lược.
        </p>
      </div>

      {/* Level XP Progress HUD */}
      <div className="pro-card p-6 bg-slate-50/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-foreground flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            Tiến Trình Tích Lũy Điểm Năng Lực
          </span>
          <span className="font-semibold text-muted-foreground">
            <strong className="text-foreground">{xp} XP</strong> / Mục tiêu tiếp theo: {target} XP
          </span>
        </div>
        <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-indigo-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
      </div>

      {/* Vertical Competency Track */}
      <div className="space-y-4">
        {LEVELS.map((level) => {
          const isUnlocked = xp >= level.xpRequired;
          const isComplete = xp >= level.gateXP;
          const isSelected = selectedLevel?.id === level.id;

          return (
            <div key={level.id} className="space-y-2">
              <motion.button
                onClick={() => isUnlocked && setSelectedLevel(isSelected ? null : level)}
                disabled={!isUnlocked}
                className={`pro-card w-full p-5 text-left transition-all flex items-center justify-between gap-4 ${
                  !isUnlocked
                    ? "opacity-50 grayscale cursor-not-allowed"
                    : isSelected
                    ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10 dark:bg-indigo-950/20"
                    : ""
                }`}
                whileHover={isUnlocked ? { scale: 1.005 } : {}}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0 ${
                    isComplete
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60"
                      : isUnlocked
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  }`}>
                    {isComplete ? <CheckCircle2 className="w-5 h-5" /> : !isUnlocked ? <Lock className="w-5 h-5" /> : level.id}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Cột mốc {level.id} · {level.gateXP} XP
                      </span>
                      {isComplete && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                          Đạt chuẩn
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-foreground mt-0.5">{level.theme}</h3>
                  </div>
                </div>

                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  {isUnlocked ? (isSelected ? "Thu gọn" : "Chi tiết") : "Đang khóa"}
                </div>
              </motion.button>

              {/* Expanded Lessons & Assessment Drawer */}
              <AnimatePresence>
                {isSelected && isUnlocked && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pl-4 sm:pl-8 space-y-2.5"
                  >
                    <div className="pro-card p-4 space-y-2 bg-slate-50/50 dark:bg-slate-850/50 border-slate-200/80 dark:border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                        Các bài tập thực hành trong cột mốc này:
                      </span>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {level.lessons.map((lesson) => {
                          const Icon = LESSON_ICONS[lesson.type];
                          return (
                            <Link key={lesson.id} href={lesson.href}>
                              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 hover:border-indigo-500/50 transition-all flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <Icon className="w-4 h-4 text-indigo-500" />
                                  <div>
                                    <h4 className="text-xs font-bold text-foreground">{lesson.title}</h4>
                                    <span className="text-[10px] text-muted-foreground capitalize">{lesson.type}</span>
                                  </div>
                                </div>
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                  +{lesson.xpReward} XP
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>

                      {/* Milestone Assessment Button */}
                      <div className="pt-2">
                        <Button
                          onClick={() => startAssessment(level)}
                          className="btn-pro w-full text-xs font-bold gap-2 py-2.5"
                        >
                          <Trophy className="w-3.5 h-3.5" />
                          <span>Làm bài đánh giá vượt cột mốc (Milestone Assessment)</span>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
