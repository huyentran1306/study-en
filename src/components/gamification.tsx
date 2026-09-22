"use client";

import { motion } from "framer-motion";
import { useGame, useTranslation } from "@/contexts/game-context";
import { Flame, Zap, Coins, Star, Trophy } from "lucide-react";
import { AnimatedNumber } from "@/components/fx/animated-number";

export function XPBar() {
  const { xp, xpToNextLevel, xpProgress, level } = useGame();
  const t = useTranslation();

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5 text-xs">
        <span className="font-semibold text-foreground flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5 text-indigo-500" />
          {t.level} {level}
        </span>
        <span className="font-medium text-muted-foreground tabular-nums">
          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{xp}</span> / {xpToNextLevel} {t.xp}
        </span>
      </div>
      <div className="h-2 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-sky-500 rounded-full relative"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, xpProgress))}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export function StatsBar() {
  const { level, streak, coins } = useGame();
  const t = useTranslation();

  const stats = [
    {
      icon: Star,
      value: level,
      label: t.level,
      color: "text-amber-500",
      accent: "hover:border-amber-500/30",
    },
    {
      icon: Flame,
      value: streak,
      label: t.streak,
      color: "text-orange-500",
      accent: "hover:border-orange-500/30",
    },
    {
      icon: Coins,
      value: coins,
      label: t.coins,
      color: "text-emerald-500",
      accent: "hover:border-emerald-500/30",
    },
  ];

  return (
    <div data-xp-hud className="flex items-center gap-1.5 sm:gap-2">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold shadow-xs transition-colors ${stat.accent}`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
          <AnimatedNumber value={stat.value} className="text-foreground tabular-nums" />
        </motion.div>
      ))}
    </div>
  );
}

export function LevelBadge({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const { level } = useGame();

  const sizeClasses = {
    sm: "w-7 h-7 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center font-bold text-white shadow-sm border border-indigo-400/30`}
      whileHover={{ scale: 1.05 }}
    >
      {level}
    </motion.div>
  );
}

export function StreakDisplay() {
  const { streak } = useGame();
  const t = useTranslation();

  return (
    <motion.div
      className="flex items-center gap-2.5 bg-slate-900 dark:bg-slate-800 text-white px-4 py-2 rounded-xl border border-slate-700/60 shadow-sm"
      whileHover={{ scale: 1.02 }}
    >
      <Flame className="w-5 h-5 text-orange-400" />
      <div className="flex flex-col">
        <span className="font-bold text-base leading-none tabular-nums">{streak} {t.streak}</span>
        <span className="text-[11px] text-slate-400 font-medium">Daily Streak</span>
      </div>
    </motion.div>
  );
}

export function CoinDisplay() {
  const { coins } = useGame();

  return (
    <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-600 dark:text-amber-400">
      <Coins className="w-3.5 h-3.5 text-amber-500" />
      <span className="tabular-nums">{coins}</span>
    </div>
  );
}

export function XPGain({ amount }: { amount: number }) {
  return (
    <motion.div
      className="fixed top-20 right-6 pointer-events-none z-50"
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: [0, 1, 1, 0], y: [0, 0, 0, -15], scale: 1 }}
      transition={{ duration: 1.8 }}
    >
      <div className="bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg font-bold text-sm flex items-center gap-2 border border-indigo-400/30">
        <Zap className="w-4 h-4 text-amber-300" />
        +{amount} XP
      </div>
    </motion.div>
  );
}
