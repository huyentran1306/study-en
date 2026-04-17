"use client";

import { motion } from "framer-motion";
import { useGame, useTranslation, WorldId } from "@/contexts/game-context";
import { Lock } from "lucide-react";

const WORLDS = [
  {
    id: "forest" as WorldId,
    emoji: "🌳",
    bg: "from-green-300 to-emerald-400",
    unlockLevel: 1,
    scenes: ["🌿", "🍄", "🦊", "🌸", "🦋", "🌲"],
  },
  {
    id: "beach" as WorldId,
    emoji: "🏖️",
    bg: "from-cyan-300 to-blue-400",
    unlockLevel: 5,
    scenes: ["🐚", "🦀", "🌴", "🐬", "🌊", "⛱️"],
  },
  {
    id: "space" as WorldId,
    emoji: "🚀",
    bg: "from-indigo-400 to-purple-500",
    unlockLevel: 10,
    scenes: ["⭐", "🌙", "🪐", "🛸", "☄️", "🌌"],
  },
];

export function WorldMap() {
  const { world, setCurrentWorld, level } = useGame();
  const t = useTranslation();

  const worldNames: Record<WorldId, string> = {
    forest: t.forest,
    beach: t.beach,
    space: t.space,
  };

  return (
    <div className="rounded-3xl bg-white/70 dark:bg-gray-800/70 backdrop-blur p-6 shadow-kawaii border-2 border-kawaii-purple/20">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        🗺️ {t.worldMap}
      </h3>

      <div className="space-y-3">
        {WORLDS.map((w) => {
          const isUnlocked = world.unlockedWorlds.includes(w.id);
          const isCurrent = world.currentWorld === w.id;
          const progress = world.worldProgress[w.id] || 0;

          return (
            <motion.button
              key={w.id}
              onClick={() => isUnlocked && setCurrentWorld(w.id)}
              disabled={!isUnlocked}
              className={`w-full p-4 rounded-2xl text-left transition-all relative overflow-hidden ${
                isCurrent
                  ? `bg-gradient-to-r ${w.bg} text-white shadow-lg`
                  : isUnlocked
                  ? "bg-white/60 dark:bg-gray-800/60 hover:bg-kawaii-purple/10"
                  : "bg-gray-100 dark:bg-gray-900 opacity-60"
              }`}
              whileHover={isUnlocked ? { scale: 1.02, x: 5 } : {}}
              whileTap={isUnlocked ? { scale: 0.98 } : {}}
            >
              <div className="flex items-center gap-3 relative z-10">
                <span className="text-3xl">{isUnlocked ? w.emoji : "🔒"}</span>
                <div className="flex-1">
                  <p className="font-bold">{worldNames[w.id]}</p>
                  {isUnlocked ? (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-white/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white/80 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs opacity-80">{progress}%</span>
                    </div>
                  ) : (
                    <p className="text-xs opacity-60 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      {t.unlockAt} {w.unlockLevel}
                    </p>
                  )}
                </div>
                {isCurrent && (
                  <motion.span
                    className="text-sm"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    📍
                  </motion.span>
                )}
              </div>

              {/* Floating scene elements */}
              {isUnlocked && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 opacity-30">
                  {w.scenes.slice(0, 3).map((s, i) => (
                    <motion.span
                      key={i}
                      className="text-lg"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                    >
                      {s}
                    </motion.span>
                  ))}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Current world display */}
      <div className="mt-4 text-center text-sm text-muted-foreground">
        {t.level} {level} • {WORLDS.find(w => w.id === world.currentWorld)?.scenes.join(" ")}
      </div>
    </div>
  );
}

export function WorldBanner() {
  const { world } = useGame();
  const w = WORLDS.find((x) => x.id === world.currentWorld)!;

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${w.bg} p-4 shadow-lg`}>
      <div className="flex items-center justify-between relative z-10">
        <span className="text-3xl">{w.emoji}</span>
        <div className="flex gap-2">
          {w.scenes.map((s, i) => (
            <motion.span
              key={i}
              className="text-xl opacity-60"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2.5, delay: i * 0.4, repeat: Infinity }}
            >
              {s}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}
