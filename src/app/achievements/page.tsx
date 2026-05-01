"use client";

import { useGame } from "@/contexts/game-context";
import { ACHIEVEMENTS, RARITY_COLORS, RARITY_BORDER, RARITY_LABEL } from "@/lib/achievements";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function AchievementsPage() {
  const { achievements, xp, level, streak, activeStudyLanguage } = useGame();
  const isZh = activeStudyLanguage === "zh";

  const unlocked = achievements.length;
  const total = ACHIEVEMENTS.length;

  const rarityOrder = ["legendary", "epic", "rare", "common"] as const;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold bg-gradient-kawaii bg-clip-text text-transparent mb-2">
          {isZh ? "🏆 成就" : "🏆 Achievements"}
        </h1>
        <p className="text-muted-foreground">
          {isZh ? `已解锁 ${unlocked} / ${total}` : `${unlocked} / ${total} unlocked`}
        </p>
        {/* Progress bar */}
        <div className="mt-4 bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-kawaii rounded-full transition-all"
            style={{ width: `${(unlocked / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Groups by rarity */}
      {rarityOrder.map(rarity => {
        const group = ACHIEVEMENTS.filter(a => a.rarity === rarity);
        return (
          <div key={rarity} className="mb-8">
            <h2 className={cn(
              "text-sm font-bold uppercase tracking-widest mb-3 px-1",
              rarity === "legendary" ? "text-yellow-500" :
              rarity === "epic" ? "text-purple-500" :
              rarity === "rare" ? "text-blue-500" : "text-gray-500"
            )}>
              {RARITY_LABEL[rarity]}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {group.map((ach, i) => {
                const isUnlocked = achievements.includes(ach.id);
                return (
                  <motion.div
                    key={ach.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "rounded-2xl border-2 overflow-hidden transition-all",
                      isUnlocked ? RARITY_BORDER[rarity] : "border-gray-200 dark:border-gray-700",
                      !isUnlocked && "opacity-50 grayscale"
                    )}
                  >
                    <div className={cn("h-1", isUnlocked ? `bg-gradient-to-r ${RARITY_COLORS[rarity]}` : "bg-gray-200 dark:bg-gray-700")} />
                    <div className="p-3 bg-white dark:bg-gray-800 flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-xl",
                        isUnlocked ? `bg-gradient-to-br ${RARITY_COLORS[rarity]}` : "bg-gray-100 dark:bg-gray-700"
                      )}>
                        {isUnlocked ? ach.emoji : "🔒"}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{isZh ? ach.titleZh : ach.title}</div>
                        <div className="text-xs text-muted-foreground">{isZh ? ach.descriptionZh : ach.description}</div>
                        {isUnlocked && (
                          <div className="text-xs text-yellow-500 font-bold">+{ach.xpReward} XP</div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
