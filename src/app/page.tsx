"use client";

import Link from "next/link";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DailyChallengeCard } from "@/components/daily-challenge";
import { XPBar, LevelBadge } from "@/components/gamification";
import { useGame, useTranslation } from "@/contexts/game-context";
import { StreakHeatmap } from "@/components/streak-heatmap";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemAnim = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function Home() {
  const { username, level, streak, xp, xpToNextLevel } = useGame();
  const t = useTranslation();

  return (
    <div className="mx-auto max-w-6xl px-3.5 py-6 sm:px-6 sm:py-8 space-y-6 sm:space-y-10">
      {/* Executive Command Header */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-8 lg:p-10 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_40px_-20px_rgba(15,23,42,0.08)]"
      >
        {/* Subtle top edge glow highlight */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            {/* Live System Indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>AI Speech & Mentorship Engine · Online</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              Chào mừng trở lại,{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 bg-clip-text text-transparent">
                {username || "Trân"}
              </span>
            </h1>

            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
              Không gian rèn luyện phản xạ tiếng Anh chuyên sâu cho người đi làm. Luyện nói tự nhiên, đàm phán tự tin và chuẩn hóa ngữ điệu bản xứ.
            </p>

            {/* Quick Action CTA Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/voice">
                <Button className="btn-pro px-5 py-3 text-xs sm:text-sm font-bold gap-2">
                  <Mic className="w-4 h-4" />
                  Mở Voice Studio 1-on-1
                </Button>
              </Link>
              <Link href="/chat">
                <Button
                  variant="outline"
                  className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold px-4 py-2.5 text-xs sm:text-sm text-foreground"
                >
                  <MessageSquare className="w-4 h-4 mr-2 text-indigo-500" />
                  AI Chat Mentor
                </Button>
              </Link>
              <Link href="/vocab">
                <Button
                  variant="outline"
                  className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold px-4 py-2.5 text-xs sm:text-sm text-foreground"
                >
                  <BookOpen className="w-4 h-4 mr-2 text-sky-500" />
                  Flashcard Anki SM-2
                </Button>
              </Link>
            </div>
          </div>

          {/* Telemetry KPI Card */}
          <div className="w-full lg:w-84 rounded-2xl bg-slate-50/70 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-750 p-5 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-3">
              <LevelBadge size="md" />
              <div className="flex-1 min-w-0">
                <XPBar />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-200/70 dark:border-slate-700/60">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground tabular-nums">{streak} Ngày</div>
                  <div className="text-[10px] text-muted-foreground font-medium">Chuỗi rèn luyện</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2.5">
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

      {/* Flagship Asymmetric Bento Studio Grid */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-slate-200/70 dark:border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="w-2 h-5 rounded-full bg-indigo-600 dark:bg-indigo-500" />
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
          {/* Bento Card 1: Flagship Voice Realtime (Large Spanning 2 Columns) */}
          <motion.div variants={itemAnim} className="sm:col-span-2">
            <Link href="/voice" className="block h-full">
              <div className="pro-card p-6 sm:p-7 flex flex-col justify-between h-full bg-gradient-to-br from-indigo-900/10 via-white to-sky-900/10 dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 border-indigo-500/30">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/30">
                        <Mic className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          Flagship Realtime Audio
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-foreground">
                          Phòng Luyện Nói Realtime AI (Full Voice Studio)
                        </h3>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      Độ trễ thấp &lt; 200ms
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                    Đàm thoại hai chiều bằng giọng nói tự nhiên, không cần gõ phím. Đóng vai phỏng vấn, trao đổi công việc hoặc đàm phán với AI với phản hồi âm thanh chuẩn bản xứ.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <span className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                    Sẵn sàng kết nối cuộc gọi thoại
                  </span>
                  <span className="inline-flex items-center gap-1">
                    Bắt đầu luyện nói <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Bento Card 2: AI Conversation Mentor */}
          <motion.div variants={itemAnim}>
            <Link href="/chat" className="block h-full">
              <div className="pro-card p-6 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                      Multi-Role AI
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1.5">
                    AI Chat Mentor
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Hội thoại linh hoạt theo nhiều vai trò (Interviewer, Colleague, Mentor). Tích hợp phát âm TTS từng câu.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <span>Mở phòng chat</span>
                  <span>→</span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Bento Card 3: Shadowing Studio */}
          <motion.div variants={itemAnim}>
            <Link href="/shadowing" className="block h-full">
              <div className="pro-card p-6 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-xs">
                      <Repeat className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Chuẩn Ngữ Điệu
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1.5">
                    Shadowing Studio
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Lặp lại đồng thời theo câu nói của người bản ngữ để triệt tiêu vấp váp và cải thiện intonation.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <span>Luyện Shadowing</span>
                  <span>→</span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Bento Card 4: Situational Roleplay */}
          <motion.div variants={itemAnim}>
            <Link href="/roleplay" className="block h-full">
              <div className="pro-card p-6 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-xs">
                      <Layers className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      Tình Huống Công Sở
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1.5">
                    Situational Roleplay
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Nhập vai đàm phán hợp đồng, họp dự án (Standup), phỏng vấn tuyển dụng và xử lý tình huống thực tế.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-purple-600 dark:text-purple-400">
                  <span>Vào kịch bản</span>
                  <span>→</span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Bento Card 5: Spaced Repetition Flashcards */}
          <motion.div variants={itemAnim}>
            <Link href="/vocab" className="block h-full">
              <div className="pro-card p-6 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                      Anki Pro SM-2
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1.5">
                    Flashcard & Thuật Toán SM-2
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Học từ vựng ngắt quãng với 4 cấp độ đánh giá (Again, Hard, Good, Easy) giúp ghi nhớ lâu bền.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <span>Lật thẻ ôn tập</span>
                  <span>→</span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Bento Card 6: Fix My English */}
          <motion.div variants={itemAnim}>
            <Link href="/fix-english" className="block h-full">
              <div className="pro-card p-6 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-xs">
                      <Wand2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                      Writing Refiner
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1.5">
                    Fix My English
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Nhập câu nói hoặc email công việc — AI tự động tối ưu hóa văn phong ngắn gọn và tự nhiên hơn.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                  <span>Sửa câu & email</span>
                  <span>→</span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Bento Card 7: Speed Speaking 30s */}
          <motion.div variants={itemAnim}>
            <Link href="/speed-speaking" className="block h-full">
              <div className="pro-card p-6 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center text-white shadow-xs">
                      <Gauge className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      Đo WPM Phản Xạ
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1.5">
                    Speed Speaking 30s
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    30 giây nói tự do theo chủ đề ngẫu nhiên: AI đo lường tốc độ WPM và chấm điểm độ lưu loát.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <span>Thử thách tốc độ</span>
                  <span>→</span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Bento Card 8: Pronunciation Drill */}
          <motion.div variants={itemAnim}>
            <Link href="/pronunciation" className="block h-full">
              <div className="pro-card p-6 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-600 flex items-center justify-center text-white shadow-xs">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                      Cặp Âm Khó
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1.5">
                    Pronunciation Drills
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Phân biệt các cặp âm dễ nhầm (Ship/Sheep, This/Thin, V/W, R/L) với AI chấm điểm sóng âm.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-teal-600 dark:text-teal-400">
                  <span>Luyện phát âm</span>
                  <span>→</span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Bento Card 9: Language Arena */}
          <motion.div variants={itemAnim}>
            <Link href="/games" className="block h-full">
              <div className="pro-card p-6 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-600 flex items-center justify-center text-white shadow-xs">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      Active Recall
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1.5">
                    Language Arena
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Thử thách phản xạ từ vựng Business & Workplace dưới áp lực thời gian để nhớ nhanh hơn.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <span>Vào sàn đấu</span>
                  <span>→</span>
                </div>
              </div>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Daily Sprint & Assessment */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="w-2 h-5 rounded-full bg-amber-500" />
              Mục Tiêu & Nhiệm Vụ Hôm Nay
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Hoàn thành bài tập đánh giá ngắn để duy trì chuỗi học tập và kích hoạt phản xạ ngôn ngữ.
            </p>
          </div>
        </div>
        <DailyChallengeCard />
      </section>

      {/* Cadence Analytics & Consistency */}
      <section className="space-y-4">
        <StreakHeatmap />

        {/* 3 Executive Telemetry Metrics */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="pro-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">Chỉ Số Phản Xạ (Fluency Index)</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold text-foreground tabular-nums">86 / 100</div>
            <p className="text-[11px] text-muted-foreground mt-1">Độ trôi chảy & giảm thiểu từ đệm</p>
          </div>

          <div className="pro-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">Kho Từ Vựng Chủ Động</span>
              <Zap className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-extrabold text-foreground tabular-nums">480+ Thuật ngữ</div>
            <p className="text-[11px] text-muted-foreground mt-1">Ứng dụng trong ngữ cảnh công sở</p>
          </div>

          <div className="pro-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">Tỷ Lệ Nhớ Dài Hạn (SM-2)</span>
              <BrainCircuit className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-2xl font-extrabold text-foreground tabular-nums">94% Retention</div>
            <p className="text-[11px] text-muted-foreground mt-1">Dựa trên lịch trình Spaced Review</p>
          </div>
        </div>
      </section>
    </div>
  );
}
