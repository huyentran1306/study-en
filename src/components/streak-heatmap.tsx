"use client";

import { useMemo } from "react";
import { useGame } from "@/contexts/game-context";
import { cn } from "@/lib/utils";

interface StreakHeatmapProps {
  weeks?: number;
}

export function StreakHeatmap({ weeks = 15 }: StreakHeatmapProps) {
  const { studyDates = [], streak, activeStudyLanguage } = useGame();
  const isZh = activeStudyLanguage === "zh";

  const cells = useMemo(() => {
    const result: { date: string; active: boolean; month: string; day: number }[] = [];
    const totalDays = weeks * 7;
    const today = new Date();
    // Start from the beginning of the current week
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const dayOfWeek = startOfToday.getDay(); // 0=Sun
    // Go back to find the start date
    const start = new Date(startOfToday);
    start.setDate(start.getDate() - (totalDays - 1));

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      result.push({
        date: iso,
        active: studyDates.includes(iso),
        month: d.toLocaleString("default", { month: "short" }),
        day: d.getDate(),
      });
    }
    return result;
  }, [studyDates, weeks]);

  // Group into columns of 7
  const columns: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    columns.push(cells.slice(i, i + 7));
  }

  const activeDays = studyDates.length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-kawaii-purple/20 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-sm text-foreground">
            {isZh ? "📅 学习记录" : "📅 Study Activity"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isZh ? `过去${weeks}周 · ${activeDays}天活跃` : `${weeks} weeks · ${activeDays} active days`}
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-extrabold text-orange-500">🔥 {streak}</div>
          <div className="text-xs text-muted-foreground">{isZh ? "连续天数" : "day streak"}</div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex gap-0.5 overflow-x-auto pb-1">
        {columns.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-0.5">
            {col.map((cell, ri) => (
              <div
                key={cell.date}
                title={`${cell.date}${cell.active ? " ✓" : ""}`}
                className={cn(
                  "w-3 h-3 rounded-sm transition-all",
                  cell.active
                    ? "bg-kawaii-purple dark:bg-kawaii-purple/80 shadow-sm"
                    : "bg-gray-100 dark:bg-gray-700"
                )}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-xs text-muted-foreground">{isZh ? "少" : "Less"}</span>
        {[false, false, true, true, true].map((a, i) => (
          <div key={i} className={cn("w-3 h-3 rounded-sm", a ? "bg-kawaii-purple/60 dark:bg-kawaii-purple/60" : "bg-gray-100 dark:bg-gray-700")}
            style={a ? { opacity: 0.4 + i * 0.2 } : {}} />
        ))}
        <span className="text-xs text-muted-foreground">{isZh ? "多" : "More"}</span>
      </div>
    </div>
  );
}
