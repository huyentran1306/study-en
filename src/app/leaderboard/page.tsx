"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useGame } from "@/contexts/game-context";

const FAKE_PLAYERS = [
  { name: "Trân 🌸", avatar: "🦋", xp: 1850 },
  { name: "demo ⭐", avatar: "🌟", xp: 200 },
];

export default function LeaderboardPage() {
  const { username, xp, activeStudyLanguage } = useGame();
  const isZh = activeStudyLanguage === "zh";

  const players = useMemo(() => {
    const all = [
      ...FAKE_PLAYERS,
      { name: `${username || "You"} 👤`, avatar: "🌟", xp },
    ].sort((a, b) => b.xp - a.xp);
    return all;
  }, [username, xp]);

  const userRank = players.findIndex(p => p.xp === xp) + 1;

  const medalFor = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold bg-gradient-kawaii bg-clip-text text-transparent mb-2">
          {isZh ? "🏆 排行榜" : "🏆 Leaderboard"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isZh ? `你的排名: #${userRank}` : `Your rank: #${userRank}`}
        </p>
      </div>

      {/* Top 3 Podium */}
      <div className="flex items-end justify-center gap-4 mb-8">
        {[1, 0, 2].map((idx) => {
          const p = players[idx];
          if (!p) return null;
          const isUser = p.name.includes(username || "You");
          const heights = ["h-24", "h-32", "h-20"];
          const podiumIdx = [1, 0, 2].indexOf(idx);
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: podiumIdx * 0.1 }}
              className="flex flex-col items-center gap-2"
            >
              <div className={`text-3xl ${isUser ? "ring-2 ring-kawaii-purple ring-offset-2 rounded-full" : ""}`}>
                {p.avatar}
              </div>
              <div className="text-xs font-bold text-center max-w-16 truncate">{p.name.split(" ")[0]}</div>
              <div className="text-xs text-muted-foreground">{p.xp.toLocaleString()} XP</div>
              <div className={`${heights[podiumIdx]} w-20 rounded-t-2xl flex items-center justify-center text-2xl font-black text-white
                ${idx === 0 ? "bg-gradient-to-b from-yellow-400 to-amber-500" :
                  idx === 1 ? "bg-gradient-to-b from-gray-300 to-gray-400 text-gray-700" :
                  "bg-gradient-to-b from-orange-400 to-amber-600"}`}>
                {medalFor(idx + 1)}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Full List */}
      <div className="space-y-2">
        {players.map((player, idx) => {
          const rank = idx + 1;
          const isUser = player.name.includes(username || "You") && player.xp === xp;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
                isUser ? "bg-kawaii-purple/10 border-2 border-kawaii-purple/30" : "bg-white/70 dark:bg-gray-800/70"
              }`}
            >
              <div className="w-8 text-center font-bold text-sm">
                {rank <= 3 ? medalFor(rank) : <span className="text-muted-foreground">#{rank}</span>}
              </div>
              <div className="text-xl">{player.avatar}</div>
              <div className="flex-1">
                <div className="font-bold text-sm flex items-center gap-1">
                  {player.name}
                  {isUser && <span className="text-xs bg-kawaii-purple text-white rounded-full px-2">You</span>}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm">{player.xp.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">XP</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
