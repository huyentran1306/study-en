"use client";

import { useMemo } from "react";
import { useGame } from "@/contexts/game-context";
import { cn } from "@/lib/utils";
import { Activity, Flame, CalendarDays } from "lucide-react";

interface StreakHeatmapProps {
  weeks?: number;
}

export function StreakHeatmap({ weeks = 18 }: StreakHeatmapProps) {
  const { studyDates = [], streak, activeStudyLanguage } = useGame();

  const cells = useMemo(() => {
    const result: { date: string; active: boolean; month: string; day: number }[] = [];
    const totalDays = weeks * 7;
    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
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
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-indigo-500" />
            Nhật Ký Tần Suất Rèn Luyện (Study Cadence)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lịch sử hoạt động trong {weeks} tuần qua · {activeDays} ngày có phiên đàm thoại
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs font-bold text-orange-600 dark:text-orange-400">
            <Flame className="w-3.5 h-3.5" />
            <span className="tabular-nums">{streak}</span> ngày liên tục
          </div>
        </div>
      </div>

      {/* Heatmap Matrix */}
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-thin">
        {columns.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-1 shrink-0">
            {col.map((cell) => (
              <div
                key={cell.date}
                title={`${cell.date}${cell.active ? " (Đã học)" : ""}`}
                className={cn(
                  "w-3 h-3 rounded-[3px] transition-all",
                  cell.active
                    ? "bg-indigo-600 dark:bg-indigo-500 shadow-xs ring-1 ring-indigo-500/30"
                    : "bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend & Meta */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-muted-foreground font-medium">
        <span>Cập nhật theo thời gian thực mỗi phiên học</span>
        <div className="flex items-center gap-1.5">
          <span>Ít</span>
          <div className="w-2.5 h-2.5 rounded-[2px] bg-slate-100 dark:bg-slate-800" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-indigo-300 dark:bg-indigo-700" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-indigo-500" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-indigo-600 dark:bg-indigo-400" />
          <span>Nhiều</span>
        </div>
      </div>
    </div>
  );
}
export default StreakHeatmap;
