"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Folder,
  Volume2,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Sparkles,
  Repeat,
  MessageSquare,
  ShieldCheck,
  Flame,
  Award,
  Calendar,
  CheckSquare,
  Copy,
  Check,
  Radio,
  User,
  Plus,
  Play,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DAILY_ROADMAP_DATA, DayPlan, DailyTask } from "@/data/daily-roadmap-data";
import { useGame } from "@/contexts/game-context";

function LessonsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { username, streak, level, addXP } = useGame();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);
  const [selectedSprint, setSelectedSprint] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load completed days from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("tran_daily_roadmap_completed");
        if (saved) setCompletedDays(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  // Sync with URL query parameter ?open=...
  useEffect(() => {
    const openParam = searchParams.get("open");
    if (openParam) {
      const num = parseInt(openParam, 10);
      if (!isNaN(num) && num >= 1 && num <= 30) {
        setSelectedDay(num);
        setTimeout(() => {
          const el = document.getElementById("lesson-detail-drawer");
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 200);
      }
    }
  }, [searchParams]);

  // Audio speech preview
  const playSpeech = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const copyText = (text: string, id: string) => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const toggleDayCompletion = (dayNum: number) => {
    const next = completedDays.includes(dayNum)
      ? completedDays.filter((d) => d !== dayNum)
      : [...completedDays, dayNum];
    setCompletedDays(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("tran_daily_roadmap_completed", JSON.stringify(next));
    }
    if (!completedDays.includes(dayNum)) {
      addXP(50);
    }
  };

  // Filter lessons based on search query and sprint filter
  const filteredLessons = useMemo(() => {
    return DAILY_ROADMAP_DATA.filter((d) => {
      const matchesSprint = selectedSprint === "all" || d.sprint === selectedSprint;
      if (!matchesSprint) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.objectiveVi.toLowerCase().includes(q) ||
        d.targetCallSituation.toLowerCase().includes(q) ||
        d.sprintTitle.toLowerCase().includes(q)
      );
    });
  }, [selectedSprint, searchQuery]);

  const activeLesson = useMemo(() => {
    return DAILY_ROADMAP_DATA.find((d) => d.day === selectedDay) || DAILY_ROADMAP_DATA[0];
  }, [selectedDay]);

  const selectDay = (dayNum: number) => {
    setSelectedDay(dayNum);
    const params = new URLSearchParams(searchParams.toString());
    params.set("open", dayNum.toString());
    router.replace(`/lessons?${params.toString()}`, { scroll: false });
    setTimeout(() => {
      const el = document.getElementById("lesson-detail-drawer");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 80);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
      {/* Top Header Bar Harmonized with TranTech Talk Theme */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-950/85 backdrop-blur-2xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Sidebar Toggle & Sprint Filter Pills */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-xs"
            title={isSidebarOpen ? "Thu gọn thanh bên" : "Mở rộng thanh bên"}
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Sprint Select Pills */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100/90 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <button
              onClick={() => setSelectedSprint("all")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                selectedSprint === "all"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-foreground"
              )}
            >
              Tất cả 30 ngày
            </button>
            {[1, 2, 3, 4].map((sp) => (
              <button
                key={sp}
                onClick={() => setSelectedSprint(sp)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                  selectedSprint === sp
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-foreground"
                )}
              >
                Sprint {sp}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Search pill */}
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo bài học, tình huống hoặc mẫu câu..."
            className="w-full bg-slate-100/80 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-full pl-9 pr-4 py-2 text-xs sm:text-sm text-foreground placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-xs transition-all"
          />
        </div>

        {/* Right: User Status & Navigation */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/voice">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex rounded-full border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900 text-foreground text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 gap-1.5"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              Voice Studio
            </Button>
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold shadow-xs">
            <User className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-bold text-foreground">{username || "Trân"}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
              Lv.{level}
            </span>
          </div>
        </div>
      </header>

      {/* Main Body with Collapsible Sidebar & 2-Column Grid */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ======================================================== */}
        {/* 1. COLLAPSIBLE LEFT SIDEBAR                              */}
        {/* ======================================================== */}
        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex-shrink-0 border-r border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden flex flex-col z-20"
            >
              <div className="w-[320px] h-full flex flex-col p-4 space-y-3.5 overflow-y-auto">
                {/* Category Header Card */}
                <div className="rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50/40 to-sky-50/60 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-slate-900 border border-indigo-200/70 dark:border-indigo-800/60 p-3.5 flex items-center gap-3 shadow-xs">
                  <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-850 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center p-1.5 shadow-xs flex-shrink-0">
                    <Image
                      src="/mascot-logo.png"
                      alt="TranTech Talk Mascot"
                      width={38}
                      height={38}
                      className="w-full h-full object-contain"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      TranTech Talk Studio
                    </div>
                    <div className="text-sm font-extrabold text-foreground truncate font-heading">
                      Lộ trình 30 Ngày Call Khách
                    </div>
                  </div>
                </div>

                {/* Accordion Item: Kiến thức 30 bài */}
                <div className="space-y-1">
                  <button
                    onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-xs font-bold transition-all shadow-2xs"
                  >
                    <div className="flex items-center gap-2 text-foreground">
                      <Folder className="w-4 h-4 text-indigo-500" />
                      <span>Danh mục 30 ngày luyện Call</span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        ({completedDays.length}/30 xong)
                      </span>
                    </div>
                    <ChevronRight
                      className={cn(
                        "w-3.5 h-3.5 text-muted-foreground transition-transform duration-200",
                        isAccordionOpen && "rotate-90 text-indigo-500"
                      )}
                    />
                  </button>

                  {/* Sidebar Lesson Items List */}
                  {isAccordionOpen && (
                    <div className="space-y-1 pl-1 pt-1 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
                      {filteredLessons.map((d) => {
                        const isSelected = selectedDay === d.day;
                        const isDone = completedDays.includes(d.day);
                        return (
                          <button
                            key={d.day}
                            onClick={() => selectDay(d.day)}
                            className={cn(
                              "w-full text-left p-2 rounded-xl text-xs flex items-center gap-2.5 transition-all select-none",
                              isSelected
                                ? "bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/90 dark:border-indigo-800/80 shadow-xs"
                                : "hover:bg-slate-100/80 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                            )}
                          >
                            <span
                              className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors",
                                isSelected
                                  ? "bg-gradient-to-tr from-indigo-600 to-sky-500 text-white shadow-xs"
                                  : isDone
                                  ? "bg-emerald-500 text-white"
                                  : "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                              )}
                            >
                              {d.day}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-foreground truncate">
                                {d.title}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate italic">
                                {d.sprintBadge}
                              </div>
                            </div>
                            <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex-shrink-0 font-medium">
                              {isDone ? "✓" : `0/${d.tasks.length}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Floating Toggle Button On Sidebar Edge */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-1/2 -translate-y-1/2 z-30 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-center text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all hover:scale-110"
          style={{ left: isSidebarOpen ? "308px" : "8px" }}
          title={isSidebarOpen ? "Đóng thanh bên" : "Mở thanh bên"}
        >
          {isSidebarOpen ? (
            <ChevronLeft className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {/* ======================================================== */}
        {/* 2. MAIN 2-COLUMN LESSON GRID & TASK DRAWER               */}
        {/* ======================================================== */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-7 lg:p-8 space-y-6">
          {/* Header Banner Card Styled in TranTech Talk Aesthetic */}
          <div className="rounded-3xl bg-gradient-to-br from-white via-indigo-50/20 to-sky-50/30 dark:from-slate-900 dark:via-slate-900/95 dark:to-indigo-950/40 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.03),0_20px_40px_-20px_rgba(99,102,241,0.1)] flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-indigo-500/10 via-sky-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-5 sm:gap-6 relative z-10">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white dark:bg-slate-850 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-center p-2 shadow-md shadow-indigo-500/15 flex-shrink-0">
                <Image
                  src="/mascot-logo.png"
                  alt="TranTech Talk Mascot"
                  width={56}
                  height={56}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-1 border border-indigo-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Chương trình thực chiến Tech Lead
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-heading">
                  Lộ trình 30 Ngày Call Khách
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                  30 bài học thiết kế theo micro-learning 15 phút mỗi ngày · Chọn bài để bắt đầu luyện tập
                </p>
              </div>
            </div>

            {/* Quick Completion Telemetry */}
            <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-850/80 border border-slate-200/80 dark:border-slate-750 px-4 py-3 rounded-2xl backdrop-blur-md flex-shrink-0 shadow-xs relative z-10">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <Flame className="w-5 h-5 fill-orange-500" />
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">
                  {completedDays.length} / 30 Ngày
                </div>
                <div className="text-[10px] text-muted-foreground font-medium">
                  Đã hoàn thành check-in
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Grid of Lesson Cards Matching Reference Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLessons.map((d) => {
              const isSelected = selectedDay === d.day;
              const isDone = completedDays.includes(d.day);
              return (
                <motion.div
                  key={d.day}
                  whileHover={{ y: -3 }}
                  onClick={() => selectDay(d.day)}
                  className={cn(
                    "pro-card card-spring-hover p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none transition-all duration-200",
                    isSelected
                      ? "border-2 border-indigo-500 dark:border-indigo-400 shadow-[0_8px_30px_rgba(99,102,241,0.22)] bg-gradient-to-r from-indigo-50/60 via-white to-sky-50/40 dark:from-indigo-950/50 dark:via-slate-900 dark:to-slate-900"
                      : "hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-md"
                  )}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Big Number Box (Left Side) */}
                    <div
                      className={cn(
                        "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black flex-shrink-0 transition-all",
                        isSelected
                          ? "bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-500 text-white shadow-md shadow-indigo-500/30 scale-102"
                          : isDone
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60"
                      )}
                    >
                      {d.day}
                    </div>

                    {/* Card Content Information */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          BÀI {d.day}
                        </span>
                        <span className="text-[10px] text-muted-foreground px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800">
                          Sprint {d.sprint}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-foreground truncate font-heading">
                        {d.title}
                      </h3>
                      <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate italic">
                        {d.objectiveVi}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2">
                        <span>{isDone ? "Đã check-in ✓" : `0/${d.tasks.length} nhiệm vụ`}</span>
                        <span>·</span>
                        <span className="truncate">{d.sprintBadge}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side Action Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playSpeech(d.title);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all"
                      title="Nghe tiêu đề"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectDay(d.day);
                      }}
                      className={cn(
                        "rounded-xl text-xs font-bold px-3 py-1.5 transition-all gap-1 shadow-xs",
                        isSelected
                          ? "bg-indigo-600 text-white shadow-indigo-500/20"
                          : "bg-slate-100 hover:bg-indigo-600 hover:text-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      )}
                    >
                      <span>{isSelected ? "Đang học" : "Vào bài học"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ======================================================== */}
          {/* 3. EXPANDED ACTIVE LESSON STUDY DRAWER                   */}
          {/* ======================================================== */}
          {selectedDay && (
            <motion.section
              id="lesson-detail-drawer"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-500/50 dark:border-indigo-600/60 p-6 sm:p-8 shadow-2xl space-y-6 scroll-mt-24 ring-4 ring-indigo-500/10"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white flex items-center justify-center text-xl font-black shadow-md shadow-indigo-500/25">
                    {selectedDay}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Chi tiết bài học {selectedDay} · {activeLesson.sprintTitle}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground font-heading">
                      {activeLesson.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 italic">
                      Mục tiêu: {activeLesson.objectiveVi}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    onClick={() => playSpeech(activeLesson.title)}
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-slate-200 dark:border-slate-800 text-foreground font-semibold gap-1.5"
                  >
                    <Volume2 className="w-4 h-4 text-indigo-500" />
                    Nghe mẫu
                  </Button>

                  <Button
                    onClick={() => toggleDayCompletion(selectedDay)}
                    className={cn(
                      "rounded-xl text-xs font-bold gap-1.5 transition-all",
                      completedDays.includes(selectedDay)
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25"
                    )}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {completedDays.includes(selectedDay) ? "Đã hoàn thành bài này" : "Đánh dấu hoàn thành (+50 XP)"}
                  </Button>
                </div>
              </div>

              {/* Tasks List for the Active Day */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    3 Micro-Tasks cho buổi luyện 15 phút hôm nay
                  </h4>
                  <span className="text-xs text-sky-600 dark:text-sky-400 font-semibold">
                    {activeLesson.targetCallSituation}
                  </span>
                </div>

                <div className="space-y-3.5">
                  {activeLesson.tasks.map((t, idx) => (
                    <div
                      key={t.id}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-400/50 transition-colors"
                    >
                      <div className="space-y-2 max-w-2xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            Nhiệm vụ {idx + 1} · {t.duration}
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            {t.title}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          {t.description}
                        </p>
                        {t.keyPhrase && (
                          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-750 text-xs text-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
                            <div className="space-y-0.5 min-w-0">
                              <div className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                                “{t.keyPhrase}”
                              </div>
                              {t.keyPhraseVi && (
                                <div className="text-[11px] text-muted-foreground italic">
                                  {t.keyPhraseVi}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                onClick={() => playSpeech(t.keyPhrase || "")}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors"
                                title="Phát âm câu"
                              >
                                <Volume2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => copyText(t.keyPhrase || "", t.id)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors"
                                title="Sao chép"
                              >
                                {copiedId === t.id ? (
                                  <Check className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <Link href={t.actionHref} className="flex-shrink-0">
                        <Button className="bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl gap-1.5 shadow-md shadow-indigo-500/20 hover:scale-102 transition-all">
                          {t.actionLabel}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}
        </main>
      </div>
    </div>
  );
}

export default function LessonsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <span>Đang nạp không gian bài học...</span>
        </div>
      }
    >
      <LessonsContent />
    </Suspense>
  );
}
