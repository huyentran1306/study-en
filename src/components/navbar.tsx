"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  LogOut,
  RotateCcw,
  BookOpen,
  Mic,
  Gamepad2,
  Award,
  BarChart3,
  Repeat,
  Layers,
  Activity,
  ShieldCheck,
  Wand2,
  Zap,
  Flame,
  Coins,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { useGame, useTranslation } from "@/contexts/game-context";
import { WOTDBadge } from "@/components/wotd-badge";
import LogoutDialog from "@/components/logout-dialog";
import { BrandLogo } from "@/components/brand-logo";
import { getTechRank } from "@/components/gamification";

function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return { open, setOpen, ref };
}

interface DropdownItem {
  href: string;
  label: string;
  desc?: string;
  icon?: React.ElementType;
  badge?: string;
}

function NavDropdown({
  label,
  items,
  pathname,
}: {
  label: string;
  items: DropdownItem[];
  pathname: string;
}) {
  const { open, setOpen, ref } = useDropdown();
  const isAnyActive = items.some((i) => pathname === i.href);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-normal transition-all whitespace-nowrap h-9 select-none",
          isAnyActive
            ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200/80 dark:border-indigo-800/80"
            : "text-slate-600 dark:text-slate-300 hover:text-foreground hover:bg-slate-100/80 dark:hover:bg-slate-800/60"
        )}
      >
        <span>{label}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-slate-400 transition-transform duration-200",
            open && "rotate-180 text-indigo-500"
          )}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-11 left-0 z-50 min-w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden p-2 space-y-1"
          >
            {items.map((item) => {
              const active = pathname === item.href;
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                >
                  <div
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all group",
                      active
                        ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold"
                        : "text-slate-700 dark:text-slate-300 hover:text-foreground hover:bg-slate-100/80 dark:hover:bg-slate-800/60"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {IconComponent && (
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                          active
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                        )}>
                          <IconComponent className="h-3.5 w-3.5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-indigo-600 text-white flex-shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.desc && (
                          <div className="text-[10px] text-muted-foreground font-normal truncate mt-0.5">
                            {item.desc}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const t = useTranslation();
  const {
    activeStudyLanguage,
    setActiveStudyLanguage,
    username,
    xp,
    level,
    streak,
    coins,
    resetProgress,
    logout,
  } = useGame();
  const profileDropdown = useDropdown();
  const rank = getTechRank(level);

  // Group 1: Solution Call & Speaking Studio
  const callStudioLinks: DropdownItem[] = [
    {
      href: "/shadowing",
      label: "Shadowing Call Solution",
      desc: "6 kịch bản hội thoại dài với CTO & VP",
      icon: Repeat,
      badge: "HOT",
    },
    {
      href: "/roleplay",
      label: "AI Roleplay Call Simulation",
      desc: "Hội thoại đối đáp trực tiếp với AI CTO",
      icon: Layers,
    },
    {
      href: "/voice",
      label: "Voice Realtime Studio",
      desc: "Luyện nói rảnh tay độ trễ cực thấp <200ms",
      icon: Mic,
    },
    {
      href: "/story",
      label: "Contextual IT Stories",
      desc: "Tình huống kiến trúc & case study thực tế",
      icon: BookOpen,
    },
  ];

  // Group 2: Tech Lead Writing & Communication Tools
  const toolsLinks: DropdownItem[] = [
    {
      href: "/fix-english",
      label: "Writing & Slack Polish",
      desc: "Tối ưu email đối tác, PR review & tin Slack",
      icon: Wand2,
      badge: "AI",
    },
    {
      href: "/speed-speaking",
      label: "Speed Speaking Sprint",
      desc: "Thử thách phản xạ nói 30s không ngập ngừng",
      icon: Zap,
    },
    {
      href: "/phrases",
      label: "Tech Lead Phrasebook",
      desc: "Mẫu câu đàm phán, pushback & bảo vệ kiến trúc",
      icon: BookOpen,
    },
    {
      href: "/chat",
      label: "AI Mentor Partner",
      desc: "Trợ lý ảo luyện giao tiếp 1-on-1 theo ngữ cảnh",
      icon: MessageSquare,
    },
    {
      href: "/speaking",
      label: "Speech Lab & Pronunciation",
      desc: "Chấm điểm chuẩn phát âm & ngữ điệu câu",
      icon: Mic,
    },
    {
      href: "/review",
      label: "Spaced Repetition Review",
      desc: "Ôn tập ngắt quãng từ vựng & cấu trúc đã học",
      icon: Activity,
    },
  ];

  const isTechLeadActive = pathname === "/tech-lead";
  const isArenaActive = pathname === "/games";
  const isVocabActive = pathname === "/vocab";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/85 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 gap-2">
        {/* Left: Brand Logo */}
        <BrandLogo />

        {/* Center: Curated Streamlined Desktop Menu (Single Line, No Wrapping) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 flex-1 justify-center max-w-2xl px-2">
          {/* Tech Lead 90D Flagship Button */}
          <Link href="/tech-lead" className="flex-shrink-0">
            <button
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-normal transition-all whitespace-nowrap h-9 select-none",
                isTechLeadActive
                  ? "bg-indigo-600 text-white font-bold shadow-xs"
                  : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 border border-indigo-200/60 dark:border-indigo-800/60"
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>Tech Lead 90D</span>
              <span className={cn(
                "text-[9px] px-1.5 py-0.2 rounded font-black",
                isTechLeadActive ? "bg-white text-indigo-600" : "bg-indigo-600 text-white"
              )}>
                PRO
              </span>
            </button>
          </Link>

          {/* Call & Shadowing Studio Dropdown */}
          <NavDropdown label="Call & Shadowing" items={callStudioLinks} pathname={pathname} />

          {/* Tech Lead Tools Dropdown */}
          <NavDropdown label="Công cụ" items={toolsLinks} pathname={pathname} />

          {/* Arena Game Hub */}
          <Link href="/games" className="flex-shrink-0">
            <button
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-normal transition-all whitespace-nowrap h-9 select-none",
                isArenaActive
                  ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200/80 dark:border-indigo-800/80"
                  : "text-slate-600 dark:text-slate-300 hover:text-foreground hover:bg-slate-100/80 dark:hover:bg-slate-800/60"
              )}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Arena</span>
            </button>
          </Link>

          {/* Vocabulary */}
          <Link href="/vocab" className="flex-shrink-0">
            <button
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-normal transition-all whitespace-nowrap h-9 select-none",
                isVocabActive
                  ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200/80 dark:border-indigo-800/80"
                  : "text-slate-600 dark:text-slate-300 hover:text-foreground hover:bg-slate-100/80 dark:hover:bg-slate-800/60"
              )}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Từ vựng</span>
            </button>
          </Link>
        </nav>

        {/* Right HUD & Profile */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Unified Compact Streak & Coin Status Pill (Desktop only) */}
          <div className="hidden lg:flex items-center gap-2.5 bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 rounded-xl px-2.5 py-1 text-xs font-semibold select-none h-9">
            <span className="flex items-center gap-1 text-orange-500">
              <Flame className="w-3.5 h-3.5 fill-orange-500" />
              <span className="tabular-nums font-bold text-foreground">{streak}</span>
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Coins className="w-3.5 h-3.5 text-emerald-500" />
              <span className="tabular-nums font-bold text-foreground">{coins}</span>
            </span>
          </div>

          {/* Word of the Day Pill */}
          <WOTDBadge />

          {/* User Profile Pill & Dropdown */}
          <div className="hidden sm:block relative" ref={profileDropdown.ref}>
            <button
              onClick={() => profileDropdown.setOpen(!profileDropdown.open)}
              className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-900/80 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 border border-slate-200/70 dark:border-slate-800 rounded-xl px-2.5 py-1.5 transition-all text-xs font-semibold h-9 select-none"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-rose-400 via-pink-400 to-indigo-500 flex items-center justify-center text-white text-[11px] font-black shadow-xs flex-shrink-0">
                {username?.[0]?.toUpperCase() || "T"}
              </div>
              <span className="max-w-[70px] truncate font-bold text-foreground">{username || "Trân"}</span>
              <ChevronDown
                className={cn(
                  "h-3 w-3 text-slate-400 transition-transform duration-200",
                  profileDropdown.open && "rotate-180"
                )}
              />
            </button>

            <AnimatePresence>
              {profileDropdown.open && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  className="absolute right-0 top-11 z-50 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden"
                >
                  {/* Profile Header */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-850/60 border-b border-slate-200/70 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-400 via-pink-400 to-indigo-500 flex items-center justify-center text-white font-black text-sm shadow-xs shadow-pink-500/20">
                        {username?.[0]?.toUpperCase() || "T"}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-foreground truncate">
                          {username || "Trân"}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span>Level {level}</span>
                          <span>·</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{rank.title}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Active Curriculum Switcher */}
                  <div className="p-3 border-b border-slate-200/70 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Ngôn ngữ học tập
                    </p>
                    <div className="flex gap-1.5">
                      {[
                        { id: "en", label: "Tiếng Anh 🇬🇧" },
                        { id: "zh", label: "Tiếng Trung 🇨🇳" },
                      ].map((lang) => (
                        <button
                          key={lang.id}
                          onClick={() => {
                            setActiveStudyLanguage(lang.id);
                            profileDropdown.setOpen(false);
                          }}
                          className={cn(
                            "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all text-center",
                            activeStudyLanguage === lang.id
                              ? "bg-indigo-600 text-white shadow-xs font-bold"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-foreground"
                          )}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Achievements and Leaderboard Links */}
                  <div className="p-1.5 border-b border-slate-200/70 dark:border-slate-800 space-y-0.5">
                    <Link
                      href="/achievements"
                      onClick={() => profileDropdown.setOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>Chứng chỉ & Huy hiệu</span>
                    </Link>
                    <Link
                      href="/leaderboard"
                      onClick={() => profileDropdown.setOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-sky-500" />
                      <span>Bảng xếp hạng (Leaderboard)</span>
                    </Link>
                  </div>

                  {/* Account Actions */}
                  <div className="p-1.5 space-y-0.5">
                    <button
                      onClick={() => {
                        if (confirm("Đặt lại toàn bộ tiến độ rèn luyện?")) {
                          resetProgress();
                          profileDropdown.setOpen(false);
                        }
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-colors text-left"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Đặt lại tiến độ học tập</span>
                    </button>
                    <LogoutDialog
                      renderTrigger={
                        <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors text-left">
                          <LogOut className="h-3.5 w-3.5" />
                          <span>Đăng xuất tài khoản</span>
                        </button>
                      }
                      onConfirm={() => {
                        logout();
                        profileDropdown.setOpen(false);
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Mode Switcher */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
