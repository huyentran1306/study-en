"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useGame } from "@/contexts/game-context";
import { BarChart3, Crown, Flame, Medal, Trophy, User } from "lucide-react";
import Link from "next/link";

const FAKE_PLAYERS = [
  { name: "Huyen Tran", role: "Product Strategy", xp: 2450, streak: 18 },
  { name: "Alex Chen", role: "Software Architect", xp: 1980, streak: 14 },
  { name: "David Miller", role: "Engineering VP", xp: 1650, streak: 9 },
  { name: "Elena Rostova", role: "Enterprise Sales", xp: 1420, streak: 12 },
  { name: "Kenji Sato", role: "Operations Lead", xp: 1150, streak: 7 },
];

export default function LeaderboardPage() {
  const { username, xp, streak, activeStudyLanguage } = useGame();
  const isZh = activeStudyLanguage === "zh";

  const players = useMemo(() => {
    const all = [
      ...FAKE_PLAYERS,
      { name: username || "You", role: "Active Learner", xp, streak },
    ].sort((a, b) => b.xp - a.xp);
    return all;
  }, [username, xp, streak]);

  const userRank = players.findIndex((p) => p.name === (username || "You")) + 1;

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { label: "1st", color: "text-amber-500 bg-amber-50 dark:bg-amber-950/60 border-amber-500/30" };
    if (rank === 2) return { label: "2nd", color: "text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-400/30" };
    if (rank === 3) return { label: "3rd", color: "text-orange-500 bg-orange-50 dark:bg-orange-950/60 border-orange-500/30" };
    return { label: `#${rank}`, color: "text-muted-foreground bg-slate-50 dark:bg-slate-900 border-slate-200/60 dark:border-slate-800" };
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
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Leaderboard</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
          <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Executive Performance Leaderboard
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Bảng xếp hạng mức độ chuyên cần và năng lực phản xạ tiếng Anh toàn hệ thống.
        </p>
      </div>

      {/* User Rank Fast Summary */}
      <div className="pro-card p-6 bg-slate-50/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
            {username?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-foreground">{username || "You"}</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                Tài khoản của bạn
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Chuỗi học tập hiện tại: <strong className="text-foreground">{streak} ngày liên tục</strong>
            </p>
          </div>
        </div>

        <div className="sm:text-right">
          <span className="text-[11px] font-semibold text-muted-foreground block">Vị trí hiện tại</span>
          <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
            #{userRank}
          </span>
        </div>
      </div>

      {/* Top 3 Executive Podium */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 items-end pt-6 pb-2 max-w-xl mx-auto text-center">
        {/* 2nd Place */}
        {players[1] && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold mx-auto text-sm">
              2
            </div>
            <h4 className="text-xs font-bold text-foreground truncate">{players[1].name}</h4>
            <span className="text-[10px] text-muted-foreground block tabular-nums">{players[1].xp.toLocaleString()} XP</span>
            <div className="h-24 rounded-t-2xl bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs font-bold text-slate-500">
              Silver
            </div>
          </motion.div>
        )}

        {/* 1st Place */}
        {players[0] && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white font-extrabold flex items-center justify-center mx-auto text-base shadow-md shadow-amber-500/20">
              <Crown className="w-6 h-6" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">{players[0].name}</h4>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block tabular-nums">{players[0].xp.toLocaleString()} XP</span>
            <div className="h-32 rounded-t-2xl bg-amber-50 dark:bg-amber-950/40 border-t-2 border-amber-500 flex items-center justify-center text-xs font-bold text-amber-600 dark:text-amber-400">
              Gold
            </div>
          </motion.div>
        )}

        {/* 3rd Place */}
        {players[2] && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 border border-orange-300 dark:border-orange-800 flex items-center justify-center text-orange-700 dark:text-orange-400 font-bold mx-auto text-sm">
              3
            </div>
            <h4 className="text-xs font-bold text-foreground truncate">{players[2].name}</h4>
            <span className="text-[10px] text-muted-foreground block tabular-nums">{players[2].xp.toLocaleString()} XP</span>
            <div className="h-20 rounded-t-2xl bg-orange-50/50 dark:bg-orange-950/20 border-t-2 border-orange-400 flex items-center justify-center text-xs font-bold text-orange-600 dark:text-orange-400">
              Bronze
            </div>
          </motion.div>
        )}
      </div>

      {/* Full Leaderboard Table */}
      <div className="space-y-2.5">
        {players.map((player, idx) => {
          const rank = idx + 1;
          const isUser = player.name === (username || "You");
          const badge = getRankBadge(rank);

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`pro-card p-4 flex items-center justify-between gap-4 transition-all ${
                isUser
                  ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10 dark:bg-indigo-950/20"
                  : ""
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border flex-shrink-0 ${badge.color}`}>
                  {badge.label}
                </span>

                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-foreground flex-shrink-0">
                  {player.name[0]}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">{player.name}</h4>
                    {isUser && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-600 text-white">
                        Bạn
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground block">{player.role}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right flex-shrink-0">
                <div className="hidden sm:block text-xs text-muted-foreground font-medium">
                  <span className="inline-flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    {player.streak} ngày
                  </span>
                </div>

                <div className="text-xs sm:text-sm font-extrabold text-foreground tabular-nums">
                  {player.xp.toLocaleString()} <span className="text-[10px] font-semibold text-muted-foreground">XP</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
