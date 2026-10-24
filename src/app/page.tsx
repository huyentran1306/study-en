"use client";

import Link from "next/link";
import { useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Mic,
  MessageSquare,
  Repeat,
  Layers,
  BookOpen,
  Volume2,
  Wand2,
  Gauge,
  Flame,
  CheckCircle2,
  Headphones,
  Compass,
  Trophy,
  Zap,
  TrendingUp,
  ShieldCheck,
  Radio,
  BrainCircuit,
  Calendar,
  BarChart3,
  CheckSquare,
  Globe,
  Play,
  ArrowUpRight,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DailyChallengeCard } from "@/components/daily-challenge";
import { XPBar, LevelBadge } from "@/components/gamification";
import { useGame, useTranslation } from "@/contexts/game-context";
import { StreakHeatmap } from "@/components/streak-heatmap";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemAnim = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function Home() {
  const { username, level, streak, xp, xpToNextLevel } = useGame();
  const t = useTranslation();

  /** Track mouse position for pro-card radial glow effect */
  const handleCardMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    e.currentTarget.style.setProperty("--mouse-x", `${x}%`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}%`);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-3.5 py-6 sm:px-6 sm:py-8 space-y-8 sm:space-y-12">
      {/* ======================================================== */}
      {/* 1. EXECUTIVE COMMAND HERO CENTER                         */}
      {/* ======================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-indigo-50/20 to-sky-50/30 dark:from-slate-900 dark:via-slate-900/95 dark:to-indigo-950/40 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-9 lg:p-12 shadow-[0_4px_30px_rgba(0,0,0,0.04),0_20px_50px_-20px_rgba(99,102,241,0.12)]"
      >
        {/* Ambient decorative glowing backdrops */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-indigo-400/20 via-sky-400/20 to-purple-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-gradient-to-tr from-rose-400/15 via-indigo-400/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        {/* Subtle top edge gradient highlight line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 relative z-10">
          <div className="space-y-5 max-w-2xl">
            {/* Live System Indicator Badge */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/70 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs backdrop-blur-md">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>AI Speech & Mentorship Engine · Online</span>
              </div>

              <Link
                href="https://huyentran1306.github.io/study-hub/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 hover:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-xs font-semibold border border-indigo-500/20 transition-all hover:scale-102"
              >
                <Globe className="w-3 h-3" />
                <span>Trở về Study Hub</span>
                <ArrowUpRight className="w-3 h-3 opacity-70" />
              </Link>
            </div>

            {/* Welcoming Title with Hand-drawn Squiggle */}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.15] font-heading">
                Chào mừng trở lại,{" "}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 dark:from-indigo-400 dark:via-purple-300 dark:to-sky-400 bg-clip-text text-transparent">
                    {username || "Trân"}
                  </span>
                  {/* Playful hand-drawn doodle squiggle underline */}
                  <svg
                    className="absolute -bottom-2 left-0 w-full h-2.5 text-indigo-500/70 dark:text-indigo-400/80 overflow-visible"
                    viewBox="0 0 100 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 9C25 3 65 3 98 8"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                {" "}✨
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed pt-2">
                Không gian rèn luyện phản xạ tiếng Anh chuyên sâu cho Tech Lead & Developers. Xóa bỏ 3 giây dịch nhẩm, phản xạ tự nhiên trong mọi cuộc họp & đàm phán với đối tác quốc tế.
              </p>
            </div>

            {/* Quick Action CTA Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href="/tech-lead">
                <Button className="bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-700 hover:from-indigo-700 hover:to-sky-700 text-white px-5 py-3 rounded-xl text-xs sm:text-sm font-bold gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all hover:scale-102">
                  <ShieldCheck className="w-4 h-4 text-sky-200" />
                  Lộ trình 30 Ngày Call Khách
                </Button>
              </Link>
              <Link href="/voice">
                <Button variant="outline" className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 font-semibold px-4 py-3 text-xs sm:text-sm text-foreground gap-2 transition-all hover:scale-102 shadow-xs">
                  <Mic className="w-4 h-4 text-indigo-500" />
                  Voice Studio 1-on-1
                </Button>
              </Link>
              <Link href="/shadowing?tab=dialogues">
                <Button
                  variant="outline"
                  className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 font-semibold px-4 py-3 text-xs sm:text-sm text-foreground gap-2 transition-all hover:scale-102 shadow-xs"
                >
                  <Repeat className="w-4 h-4 text-sky-500" />
                  Call Shadowing
                </Button>
              </Link>
            </div>
          </div>

          {/* Telemetry KPI Card */}
          <div className="w-full lg:w-84 rounded-2xl bg-white/80 dark:bg-slate-850/70 border border-slate-200/90 dark:border-slate-750 p-5 backdrop-blur-xl shadow-lg space-y-4">
            <div className="flex items-center gap-3">
              <LevelBadge size="md" />
              <div className="flex-1 min-w-0">
                <XPBar />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-200/70 dark:border-slate-700/60">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Flame className="w-4 h-4 fill-orange-500" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground tabular-nums">{streak} Ngày</div>
                  <div className="text-[10px] text-muted-foreground font-medium">Chuỗi rèn luyện</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Cấp {level}</div>
                  <div className="text-[10px] text-muted-foreground font-medium">Độ thành thạo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ======================================================== */}
      {/* 2. TECH LEAD 30-DAY CALL PREP BANNER                     */}
      {/* ======================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border border-indigo-500/40 p-6 sm:p-8 shadow-2xl text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/50 text-xs font-bold text-indigo-200">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                Lộ trình 30 Ngày Call Khách · 15 phút mỗi ngày
              </span>
              <span className="text-xs text-sky-300 font-semibold px-2 py-0.5 rounded bg-sky-500/10 border border-sky-400/20">
                Dành riêng cho Lead & Architect
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white font-heading">
              Chuẩn bị phản xạ trước giờ Call với Khách Nước Ngoài
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Xóa bỏ 3 giây dịch nhẩm tiếng Việt trong đầu. Rèn luyện 15 phút hôm nay với 3 micro-tasks: Mẫu câu mở đầu, Shadowing nhịp thở tự nhiên và mô phỏng phản biện với AI CTO.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
            <Link href="/tech-lead?tab=daily">
              <Button className="bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white font-bold px-5 py-3 rounded-xl text-xs sm:text-sm gap-2 shadow-lg shadow-indigo-500/30 hover:scale-102 transition-all">
                <CheckSquare className="w-4 h-4" />
                Luyện 15 phút hôm nay & Check-in
              </Button>
            </Link>
            <Link href="/tech-lead?tab=assessment">
              <Button
                variant="outline"
                className="rounded-xl border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-3 text-xs sm:text-sm gap-1.5 hover:scale-102 transition-all"
              >
                <BarChart3 className="w-4 h-4 text-sky-400" />
                Nhật ký Call & Đánh giá
              </Button>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* ======================================================== */}
      {/* 3. FLAGSHIP ASYMMETRIC BENTO STUDIO GRID                 */}
      {/* ======================================================== */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5 font-heading">
              <span className="w-2.5 h-6 rounded-full bg-gradient-to-b from-indigo-600 to-sky-500" />
              Studio Luyện Tập & Phản Xạ Ngôn Ngữ
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Lựa chọn module rèn luyện chuyên sâu theo mục tiêu thực tế của bạn.
            </p>
          </div>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {/* ---------------------------------------------------- */}
          {/* Card 1: Flagship Voice Realtime (Large 2 Columns)    */}
          {/* ---------------------------------------------------- */}
          <motion.div variants={itemAnim} className="sm:col-span-2">
            <Link href="/voice" className="block h-full group">
              <div
                onMouseMove={handleCardMouseMove}
                className="pro-card card-spring-hover p-6 sm:p-8 flex flex-col justify-between h-full bg-gradient-to-br from-indigo-900/10 via-white to-sky-900/10 dark:from-indigo-950/50 dark:via-slate-900 dark:to-slate-900 border-indigo-500/35 relative overflow-hidden"
              >
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-500" />

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 group-hover:scale-108 transition-transform duration-300">
                        <Mic className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          Flagship Realtime Audio
                        </div>
                        <h3 className="text-lg sm:text-2xl font-black text-foreground font-heading">
                          Phòng Luyện Nói Realtime AI (Voice Studio)
                        </h3>
                      </div>
                    </div>

                    {/* Latency & Live Equalizer Preview */}
                    <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-950/60 border border-indigo-500/20">
                      <div className="flex items-end gap-1 h-5">
                        <span className="w-1 bg-indigo-500 rounded-full wave-bar-1" />
                        <span className="w-1 bg-sky-500 rounded-full wave-bar-2" />
                        <span className="w-1 bg-emerald-500 rounded-full wave-bar-3" />
                        <span className="w-1 bg-purple-500 rounded-full wave-bar-4" />
                        <span className="w-1 bg-indigo-500 rounded-full wave-bar-5" />
                      </div>
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                        &lt; 200ms Latency
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                    Đàm thoại hai chiều bằng giọng nói tự nhiên, không cần gõ phím. Đóng vai phỏng vấn, trao đổi công việc hoặc đàm phán với AI với phản hồi âm thanh chuẩn bản xứ.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                      🎙️ Neural Aura Voice
                    </span>
                    <span className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                      ⚡ Speech-to-Speech
                    </span>
                    <span className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                      🎯 Chấm ngữ điệu tức thì
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 relative z-10">
                  <span className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                    Sẵn sàng kết nối cuộc gọi thoại
                  </span>
                  <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Bắt đầu luyện nói <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* ---------------------------------------------------- */}
          {/* Card 2: AI Conversation Mentor                       */}
          {/* ---------------------------------------------------- */}
          <motion.div variants={itemAnim}>
            <Link href="/chat" className="block h-full group">
              <div
                onMouseMove={handleCardMouseMove}
                className="pro-card card-spring-hover p-6 flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-sky-500/20 group-hover:scale-108 transition-transform duration-300">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                      Multi-Role AI
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1.5 font-heading">
                    AI Chat Mentor
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Hội thoại linh hoạt theo nhiều vai trò (Interviewer, Colleague, Mentor). Tích hợp phát âm TTS từng câu.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <span>Mở phòng chat</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* ---------------------------------------------------- */}
          {/* Card 3: Shadowing Studio                             */}
          {/* ---------------------------------------------------- */}
          <motion.div variants={itemAnim}>
            <Link href="/shadowing" className="block h-full group">
              <div
                onMouseMove={handleCardMouseMove}
                className="pro-card card-spring-hover p-6 flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 group-hover:scale-108 transition-transform duration-300">
                      <Repeat className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Chuẩn Ngữ Điệu
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1.5 font-heading">
                    Shadowing Studio
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Lặp lại đồng thời theo câu nói của người bản ngữ để triệt tiêu vấp váp và cải thiện intonation tự nhiên.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <span>Luyện Shadowing</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* ---------------------------------------------------- */}
          {/* Card 4: Situational Roleplay                         */}
          {/* ---------------------------------------------------- */}
          <motion.div variants={itemAnim}>
            <Link href="/roleplay" className="block h-full group">
              <div
                onMouseMove={handleCardMouseMove}
                className="pro-card card-spring-hover p-6 flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-sm shadow-purple-500/20 group-hover:scale-108 transition-transform duration-300">
                      <Layers className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      Tình Huống Công Sở
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1.5 font-heading">
                    Situational Roleplay
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Nhập vai đàm phán hợp đồng, họp dự án (Standup), phỏng vấn tuyển dụng và xử lý tình huống thực tế.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-purple-600 dark:text-purple-400">
                  <span>Vào kịch bản</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* ---------------------------------------------------- */}
          {/* Card 5: Spaced Repetition Flashcards                 */}
          {/* ---------------------------------------------------- */}
          <motion.div variants={itemAnim}>
            <Link href="/vocab" className="block h-full group">
              <div
                onMouseMove={handleCardMouseMove}
                className="pro-card card-spring-hover p-6 flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-violet-500/20 group-hover:scale-108 transition-transform duration-300">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                      Anki Pro SM-2
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1.5 font-heading">
                    Flashcard & Thuật Toán SM-2
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Học từ vựng ngắt quãng với 4 cấp độ đánh giá (Again, Hard, Good, Easy) giúp ghi nhớ lâu bền.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <span>Lật thẻ ôn tập</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* ---------------------------------------------------- */}
          {/* Card 6: Fix My English                               */}
          {/* ---------------------------------------------------- */}
          <motion.div variants={itemAnim}>
            <Link href="/fix-english" className="block h-full group">
              <div
                onMouseMove={handleCardMouseMove}
                className="pro-card card-spring-hover p-6 flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-cyan-500/20 group-hover:scale-108 transition-transform duration-300">
                      <Wand2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                      Executive Polish
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1.5 font-heading">
                    Fix My English
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Nhập câu nói hoặc email công việc — AI tự động tối ưu hóa văn phong ngắn gọn, tự nhiên và chuyên nghiệp.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                  <span>Sửa câu & email</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* ---------------------------------------------------- */}
          {/* Card 7: Speed Speaking 30s                           */}
          {/* ---------------------------------------------------- */}
          <motion.div variants={itemAnim}>
            <Link href="/speed-speaking" className="block h-full group">
              <div
                onMouseMove={handleCardMouseMove}
                className="pro-card card-spring-hover p-6 flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center text-white shadow-sm shadow-amber-500/20 group-hover:scale-108 transition-transform duration-300">
                      <Gauge className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      Đo WPM Phản Xạ
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1.5 font-heading">
                    Speed Speaking 30s
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    30 giây nói tự do theo chủ đề ngẫu nhiên: AI đo lường tốc độ WPM và chấm điểm độ lưu loát.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <span>Thử thách tốc độ</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* ---------------------------------------------------- */}
          {/* Card 8: Pronunciation Drill                          */}
          {/* ---------------------------------------------------- */}
          <motion.div variants={itemAnim}>
            <Link href="/pronunciation" className="block h-full group">
              <div
                onMouseMove={handleCardMouseMove}
                className="pro-card card-spring-hover p-6 flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-600 flex items-center justify-center text-white shadow-sm shadow-teal-500/20 group-hover:scale-108 transition-transform duration-300">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                      Cặp Âm Khó
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1.5 font-heading">
                    Pronunciation Drills
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Phân biệt các cặp âm dễ nhầm (Ship/Sheep, This/Thin, V/W, R/L) với AI chấm điểm sóng âm.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-teal-600 dark:text-teal-400">
                  <span>Luyện phát âm</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* ---------------------------------------------------- */}
          {/* Card 9: Language Arena                               */}
          {/* ---------------------------------------------------- */}
          <motion.div variants={itemAnim}>
            <Link href="/games" className="block h-full group">
              <div
                onMouseMove={handleCardMouseMove}
                className="pro-card card-spring-hover p-6 flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 group-hover:scale-108 transition-transform duration-300">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      Active Recall
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1.5 font-heading">
                    Language Arena
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Thử thách phản xạ từ vựng Business & Workplace dưới áp lực thời gian để nhớ nhanh hơn.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <span>Vào sàn đấu</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ======================================================== */}
      {/* 4. DAILY SPRINT & ASSESSMENT                             */}
      {/* ======================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5 font-heading">
              <span className="w-2.5 h-6 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
              Mục Tiêu & Nhiệm Vụ Hôm Nay
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Hoàn thành bài tập đánh giá ngắn để duy trì chuỗi học tập và kích hoạt phản xạ ngôn ngữ.
            </p>
          </div>
        </div>
        <DailyChallengeCard />
      </section>

      {/* ======================================================== */}
      {/* 5. CADENCE ANALYTICS & CONSISTENCY                       */}
      {/* ======================================================== */}
      <section className="space-y-4">
        <StreakHeatmap />

        {/* 3 Executive Telemetry Metrics */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="pro-card card-spring-hover p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground">Chỉ Số Phản Xạ (Fluency Index)</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums font-heading">86 / 100</div>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">Độ trôi chảy & giảm thiểu từ đệm trong các buổi đàm thoại</p>
          </div>

          <div className="pro-card card-spring-hover p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground">Kho Từ Vựng Chủ Động</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums font-heading">480+ Thuật ngữ</div>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">Ứng dụng trực tiếp trong ngữ cảnh họp và review kiến trúc</p>
          </div>

          <div className="pro-card card-spring-hover p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground">Tỷ Lệ Nhớ Dài Hạn (SM-2)</span>
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500">
                <BrainCircuit className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums font-heading">94% Retention</div>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">Duy trì ổn định dựa trên lịch trình Spaced Review</p>
          </div>
        </div>
      </section>
    </div>
  );
}
