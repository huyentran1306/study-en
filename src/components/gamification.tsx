"use client";

import { motion } from "framer-motion";
import { useGame, useTranslation } from "@/contexts/game-context";
import { Flame, Zap, Coins, Star } from "lucide-react";

export function XPBar() {
  const { xp, xpToNextLevel, xpProgress, level } = useGame();
  const t = useTranslation();

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-muted-foreground">
          {t.level} {level}
        </span>
        <span className="text-xs font-medium text-kawaii-purple">
          {xp} / {xpToNextLevel} {t.xp}
        </span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
        <motion.div
          className="h-full bg-gradient-kawaii rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${xpProgress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
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
      color: "text-kawaii-yellow",
      bg: "bg-kawaii-yellow/20",
    },
    {
      icon: Flame,
      value: streak,
      label: t.streak,
      color: "text-orange-500",
      bg: "bg-orange-500/20",
    },
    {
      icon: Coins,
      value: coins,
      label: t.coins,
      color: "text-kawaii-yellow",
      bg: "bg-kawaii-yellow/20",
    },
  ];

  return (
    <div className="flex items-center gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${stat.bg} shadow-sm`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ scale: 1.05 }}
        >
          <stat.icon className={`w-4 h-4 ${stat.color}`} />
          <span className="font-bold text-sm">{stat.value}</span>
        </motion.div>
      ))}
    </div>
  );
}

export function LevelBadge({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const { level } = useGame();

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-lg",
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} bg-gradient-kawaii rounded-full flex items-center justify-center shadow-kawaii font-bold text-white`}
      whileHover={{ scale: 1.1, rotate: 5 }}
      animate={{ 
        boxShadow: [
          "0 0 20px rgba(167, 139, 250, 0.5)",
          "0 0 30px rgba(244, 114, 182, 0.5)",
          "0 0 20px rgba(167, 139, 250, 0.5)",
        ]
      }}
      transition={{ duration: 2, repeat: Infinity }}
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
      className="flex items-center gap-2 bg-gradient-to-r from-orange-400 to-red-400 text-white px-4 py-2 rounded-2xl shadow-lg"
      animate={{ scale: [1, 1.02, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <Flame className="w-5 h-5 animate-pulse" />
      <div className="flex flex-col">
        <span className="font-bold text-lg leading-none">{streak}</span>
        <span className="text-xs opacity-80">{t.streak}</span>
      </div>
    </motion.div>
  );
}

export function CoinDisplay() {
  const { coins } = useGame();

  return (
    <motion.div
      className="flex items-center gap-1.5 bg-kawaii-yellow/30 px-3 py-1.5 rounded-full"
      whileHover={{ scale: 1.05 }}
    >
      <span className="text-xl">🪙</span>
      <span className="font-bold text-amber-700">{coins}</span>
    </motion.div>
  );
}

export function XPGain({ amount }: { amount: number }) {
  return (
    <motion.div
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50"
      initial={{ opacity: 0, scale: 0.5, y: 0 }}
      animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 1, 1], y: [0, -50, -80, -100] }}
      transition={{ duration: 1.5 }}
    >
      <div className="bg-gradient-kawaii text-white px-6 py-3 rounded-2xl shadow-glow-lg font-bold text-xl flex items-center gap-2">
        <Zap className="w-6 h-6" />
        +{amount} XP
      </div>
    </motion.div>
  );
}
