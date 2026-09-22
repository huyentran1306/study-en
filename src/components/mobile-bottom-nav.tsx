"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  BookOpen,
  Mic,
  LayoutGrid,
  X,
  Radio,
  Repeat,
  Layers,
  MessageSquare,
  Activity,
  Award,
  BarChart3,
  Flame,
  Gamepad2,
  FileEdit,
  Sparkles,
  RotateCcw,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGame } from "@/contexts/game-context";
import { StatsBar, XPBar } from "@/components/gamification";
import LogoutDialog from "@/components/logout-dialog";

export function MobileBottomNav() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const {
    activeStudyLanguage,
    setActiveStudyLanguage,
    username,
    level,
    xp,
    resetProgress,
    logout,
  } = useGame();

  // Close sheet when route changes
  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  const navTabs = [
    {
      href: "/",
      label: "Trang chủ",
      icon: Compass,
      isActive: pathname === "/",
    },
    {
      href: "/shadowing",
      label: "Shadowing",
      badge: "IT",
      icon: Radio,
      isActive: pathname === "/shadowing",
    },
    {
      href: "/vocab",
      label: "Từ vựng",
      icon: BookOpen,
      isActive: pathname === "/vocab",
    },
    {
      href: "/speaking",
      label: "Phát âm",
      icon: Mic,
      isActive: pathname === "/speaking",
    },
  ];

  const drawerSections = [
    {
      title: "Phòng Luyện Nói & Ngữ Điệu",
      items: [
        {
          href: "/shadowing",
          label: "Shadowing & IT Calls",
          desc: "Nhại âm & ngữ điệu đàm thoại IT",
          icon: Radio,
          badge: "Hot",
        },
        {
          href: "/speaking",
          label: "Speech Evaluation Lab",
          desc: "Đo sóng âm & điểm số IELTS",
          icon: Mic,
        },
        {
          href: "/voice",
          label: "Voice Realtime Partner",
          desc: "Nói rảnh tay với AI bản xứ",
          icon: Sparkles,
        },
        {
          href: "/pronunciation",
          label: "Minimal Pairs Lab",
          desc: "Cặp âm dễ nhầm lẫn & bảng IPA",
          icon: Repeat,
        },
        {
          href: "/speed-speaking",
          label: "30s Fluency Sprint",
          desc: "Đo tốc độ WPM & từ đệm",
          icon: Flame,
        },
      ],
    },
    {
      title: "Viết, Đọc & Tình Huống",
      items: [
        {
          href: "/vocab",
          label: "Executive Vocabulary Hub",
          desc: "Kho từ vựng 7 chủ đề dạng thẻ",
          icon: BookOpen,
        },
        {
          href: "/fix-english",
          label: "AI Writing & Grammar",
          desc: "So sánh câu trước & sau",
          icon: FileEdit,
        },
        {
          href: "/roleplay",
          label: "Situational Roleplay",
          desc: "Đàm phán & phỏng vấn công sở",
          icon: Layers,
        },
        {
          href: "/chat",
          label: "AI Mentor Chat",
          desc: "Trò chuyện phản xạ công việc",
          icon: MessageSquare,
        },
        {
          href: "/story",
          label: "Contextual Stories",
          desc: "Đọc báo phong cách Readwise",
          icon: BookOpen,
        },
      ],
    },
    {
      title: "Lộ Trình & Gamification",
      items: [
        {
          href: "/path",
          label: "Competency Roadmap",
          desc: "Bản đồ cột mốc năng lực CEFR",
          icon: Compass,
        },
        {
          href: "/review",
          label: "Spaced Review Studio",
          desc: "Ôn tập ngắt quãng chuẩn SM-2",
          icon: Activity,
        },
        {
          href: "/games",
          label: "Language Arena",
          desc: "Game tốc độ từ vựng công sở",
          icon: Gamepad2,
        },
        {
          href: "/achievements",
          label: "Credentials & Badges",
          desc: "Huy hiệu & chứng chỉ chuyên gia",
          icon: Award,
        },
        {
          href: "/leaderboard",
          label: "Performance Board",
          desc: "Bục vinh danh Top 3",
          icon: BarChart3,
        },
      ],
    },
  ];

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          FIXED BOTTOM BAR FOR MOBILE (md:hidden)
         ───────────────────────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl border-t border-slate-200/80 dark:border-slate-800/80 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.4)] pb-[env(safe-area-inset-bottom,0px)]"
        aria-label="Mobile Navigation"
      >
        <div className="grid grid-cols-5 h-16 items-center px-1 max-w-md mx-auto">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "relative flex flex-col items-center justify-center h-full py-1 text-[10px] font-semibold transition-all group select-none",
                  tab.isActive
                    ? "text-indigo-600 dark:text-indigo-400 font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-foreground"
                )}
              >
                {/* Active Indicator Glow / Pill */}
                {tab.isActive && (
                  <motion.div
                    layoutId="mobileNavActivePill"
                    className="absolute top-1.5 w-8 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                <div className="relative mt-1">
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-transform duration-150 group-active:scale-90",
                      tab.isActive && "scale-105"
                    )}
                  />
                  {tab.badge && (
                    <span className="absolute -top-1.5 -right-3 text-[8px] font-black px-1 rounded-full bg-cyan-500 text-white leading-tight">
                      {tab.badge}
                    </span>
                  )}
                </div>

                <span className="mt-1 truncate max-w-[56px] tracking-tight">
                  {tab.label}
                </span>
              </Link>
            );
          })}

          {/* Tab 5: "More / Thêm" Trigger for All Studios */}
          <button
            onClick={() => setSheetOpen(true)}
            className={cn(
              "relative flex flex-col items-center justify-center h-full py-1 text-[10px] font-semibold transition-all group select-none",
              sheetOpen
                ? "text-indigo-600 dark:text-indigo-400 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-foreground"
            )}
          >
            {sheetOpen && (
              <motion.div
                layoutId="mobileNavActivePill"
                className="absolute top-1.5 w-8 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <div className="relative mt-1">
              <LayoutGrid
                className={cn(
                  "w-5 h-5 transition-transform duration-150 group-active:scale-90",
                  sheetOpen && "scale-105"
                )}
              />
            </div>
            <span className="mt-1 tracking-tight">Thêm</span>
          </button>
        </div>
      </nav>

      {/* ─────────────────────────────────────────────────────────────
          SLIDE-UP DRAWER / SHEET FOR ALL STUDIOS & SETTINGS
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {sheetOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSheetOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Sheet Content Container */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative w-full max-h-[85vh] bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-200/80 dark:border-slate-800 flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom,16px)]"
            >
              {/* Drag Handle & Top Header */}
              <div className="flex-shrink-0 pt-3 pb-2 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto absolute left-1/2 -translate-x-1/2 top-2.5" />
                <div className="flex items-center gap-2 pt-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-black">
                    {username?.[0]?.toUpperCase() || "T"}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground truncate max-w-[150px]">
                      {username || "Trân"}
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      Level {level} · {xp} XP
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSheetOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-foreground flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5 overscroll-contain">
                {/* User Progress Mini Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80 space-y-3">
                  <StatsBar />
                  <XPBar />
                </div>

                {/* Curriculum Language Switcher */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">Ngôn ngữ học:</span>
                  <div className="flex gap-1.5">
                    {["en", "zh"].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setActiveStudyLanguage(lang)}
                        className={cn(
                          "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                          activeStudyLanguage === lang
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        )}
                      >
                        {lang === "en" ? "English" : "Tiếng Trung"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Studio Sections */}
                {drawerSections.map((section, sIdx) => (
                  <div key={sIdx} className="space-y-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                      {section.title}
                    </h4>
                    <div className="grid grid-cols-1 gap-1.5">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isCurrent = pathname === item.href;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSheetOpen(false)}
                          >
                            <div
                              className={cn(
                                "flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all group",
                                isCurrent
                                  ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60"
                                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                                    isCurrent
                                      ? "bg-indigo-600 text-white"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-indigo-600 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60"
                                  )}
                                >
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5 font-bold">
                                    <span>{item.label}</span>
                                    {item.badge && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500 text-white font-black">
                                        {item.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-muted-foreground font-normal">
                                    {item.desc}
                                  </p>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Account Actions */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5">
                  <button
                    onClick={() => {
                      if (confirm("Đặt lại toàn bộ tiến độ rèn luyện?")) {
                        resetProgress();
                        setSheetOpen(false);
                      }
                    }}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Đặt lại tiến độ học tập</span>
                  </button>

                  <LogoutDialog
                    renderTrigger={
                      <button className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors">
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất tài khoản</span>
                      </button>
                    }
                    onConfirm={() => {
                      logout();
                      setSheetOpen(false);
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
