"use client";

import { useGame } from "@/contexts/game-context";
import { ACHIEVEMENTS, RARITY_BORDER, RARITY_LABEL } from "@/lib/achievements";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Award, CheckCircle2, Lock, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";

export default function AchievementsPage() {
  const { achievements, xp, level, streak, activeStudyLanguage } = useGame();
  const isZh = activeStudyLanguage === "zh";

  const unlocked = achievements.length;
  const total = ACHIEVEMENTS.length;
  const progressPct = Math.round((unlocked / total) * 100);

  const rarityOrder = ["legendary", "epic", "rare", "common"] as const;

  const rarityTitles: Record<string, string> = {
    legendary: "Executive & Strategic Master (Xuất Sắc)",
    epic: "Advanced Professional (Chuyên Sâu)",
    rare: "Proficient Practitioner (Thành Thạo)",
    common: "Foundational Milestones (Cơ Bản)",
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-foreground">
            Dashboard
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Credentials</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
          <Award className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Professional Credentials & Badges
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Ghi nhận các mốc thành thạo kỹ năng, chuỗi ngày rèn luyện và thành tích giao tiếp quốc tế.
        </p>
      </div>

      {/* Overview Telemetry Card */}
      <div className="pro-card p-6 bg-slate-50/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-foreground">Tổng quan tiến độ chứng nhận</span>
            <p className="text-xs text-muted-foreground">Đã mở khóa {unlocked} trên tổng số {total} huy hiệu năng lực</p>
          </div>
          <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
            {progressPct}%
          </span>
        </div>

        <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-indigo-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
      </div>

      {/* Rarity Tier Groups */}
      <div className="space-y-8">
        {rarityOrder.map((rarity) => {
          const group = ACHIEVEMENTS.filter((a) => a.rarity === rarity);
          return (
            <div key={rarity} className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                {rarityTitles[rarity] || RARITY_LABEL[rarity]}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {group.map((ach, i) => {
                  const isUnlocked = achievements.includes(ach.id);
                  return (
                    <motion.div
                      key={ach.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`pro-card p-4 flex items-center justify-between gap-3.5 transition-all ${
                        isUnlocked
                          ? "border-indigo-500/30 bg-white dark:bg-slate-900"
                          : "opacity-40 grayscale border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                          isUnlocked
                            ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                        }`}>
                          {isUnlocked ? <Trophy className="w-5 h-5 text-indigo-500" /> : <Lock className="w-4 h-4" />}
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-xs sm:text-sm font-bold text-foreground truncate">
                            {isZh ? ach.titleZh : ach.title}
                          </h3>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {isZh ? ach.descriptionZh : ach.description}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        {isUnlocked ? (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60">
                            +{ach.xpReward} XP
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-semibold">Chưa đạt</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
