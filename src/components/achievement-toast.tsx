"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Achievement, RARITY_COLORS, RARITY_BORDER } from "@/lib/achievements";

interface AchievementToastProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  useEffect(() => {
    if (!achievement) return;
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [achievement, onDismiss]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-20 right-4 z-50 max-w-xs cursor-pointer"
          onClick={onDismiss}
        >
          <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 ${RARITY_BORDER[achievement.rarity]} overflow-hidden`}>
            <div className={`h-1.5 bg-gradient-to-r ${RARITY_COLORS[achievement.rarity]}`} />
            <div className="p-4 flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${RARITY_COLORS[achievement.rarity]} flex items-center justify-center text-2xl shadow-lg`}>
                {achievement.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  🏆 Achievement Unlocked!
                </div>
                <div className="font-bold text-sm text-foreground truncate">{achievement.title}</div>
                <div className="text-xs text-muted-foreground truncate">{achievement.description}</div>
                <div className="text-xs text-yellow-500 font-bold mt-0.5">+{achievement.xpReward} XP bonus</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Global achievement toast manager
let toastQueue: Achievement[] = [];
let toastCallback: ((a: Achievement) => void) | null = null;

export function triggerAchievementToast(achievement: Achievement) {
  if (toastCallback) {
    toastCallback(achievement);
  } else {
    toastQueue.push(achievement);
  }
}

export function useAchievementToastManager() {
  const [current, setCurrent] = useState<Achievement | null>(null);
  const [queue, setQueue] = useState<Achievement[]>([]);

  useEffect(() => {
    toastCallback = (a: Achievement) => {
      setQueue(prev => [...prev, a]);
    };
    // flush queued toasts
    if (toastQueue.length > 0) {
      setQueue(toastQueue);
      toastQueue = [];
    }
    return () => { toastCallback = null; };
  }, []);

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue(prev => prev.slice(1));
    }
  }, [current, queue]);

  const dismiss = () => setCurrent(null);

  return { current, dismiss };
}
