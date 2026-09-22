"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  LogOut,
  RotateCcw,
  Compass,
  MessageSquare,
  BookOpen,
  Mic,
  Gamepad2,
  Sparkles,
  Award,
  BarChart3,
  Repeat,
  Layers,
  Activity,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { StatsBar } from "@/components/gamification";
import { useTranslation, useGame } from "@/contexts/game-context";
import { WOTDBadge } from "@/components/wotd-badge";
import LogoutDialog from "@/components/logout-dialog";

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
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all",
          isAnyActive
            ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80"
            : "text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-slate-100/80 dark:hover:bg-slate-800/60"
        )}
      >
        <span>{label}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-9 left-0 z-50 min-w-48 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden p-1.5"
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
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all",
                      active
                        ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400"
                        : "text-slate-600 dark:text-slate-300 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    )}
                  >
                    {IconComponent && (
                      <IconComponent className="h-4 w-4 text-slate-400 group-hover:text-indigo-500" />
                    )}
                    <div>
                      <div>{item.label}</div>
                      {item.desc && (
                        <div className="text-[10px] text-muted-foreground font-normal">
                          {item.desc}
                        </div>
                      )}
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
    resetProgress,
    logout,
  } = useGame();
  const profileDropdown = useDropdown();

  const primaryLinks = [
    { href: "/", label: t.home, icon: Compass },
    { href: "/chat", label: "AI Mentor", icon: MessageSquare },
    { href: "/vocab", label: "Vocabulary", icon: BookOpen },
    { href: "/speaking", label: "Speech Lab", icon: Mic },
    { href: "/games", label: "Arena", icon: Gamepad2 },
  ];

  const practiceLinks: DropdownItem[] = [
    { href: "/voice", label: "Voice Realtime", desc: "Hands-free AI speaking", icon: Mic },
    { href: "/shadowing", label: "Shadowing Studio", desc: "Accent & intonation drill", icon: Repeat },
    { href: "/roleplay", label: "Situational Roleplay", desc: "Workplace & life scenarios", icon: Layers },
    { href: "/story", label: "Contextual Stories", desc: "Immersive narrative reading", icon: BookOpen },
    { href: "/review", label: "Spaced Review", desc: "Smart memory retention", icon: Activity },
    { href: "/path", label: "Learning Path", desc: "Milestone progression", icon: Compass },
  ];

  const statsLinks: DropdownItem[] = [
    { href: "/achievements", label: "Certifications & Badges", icon: Award },
    { href: "/leaderboard", label: "Performance Board", icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              Lingua<span className="text-indigo-600 dark:text-indigo-400">Pro</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              Studio
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {primaryLinks.map((link) => {
            const isActive = pathname === link.href;
            const IconComponent = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <button
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all",
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-slate-100/80 dark:hover:bg-slate-800/60"
                  )}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                  {link.label}
                </button>
              </Link>
            );
          })}
          <NavDropdown label="Drills & Lab" items={practiceLinks} pathname={pathname} />
          <NavDropdown label="Analytics" items={statsLinks} pathname={pathname} />
        </nav>

        {/* Right HUD & Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          <WOTDBadge />

          {/* Language Switcher */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-0.5 rounded-lg">
            {["en", "zh"].map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveStudyLanguage(lang)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide transition-all",
                  activeStudyLanguage === lang
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold"
                    : "text-slate-500 hover:text-foreground"
                )}
              >
                {lang === "en" ? "EN" : "ZH"}
              </button>
            ))}
          </div>

          <div className="hidden lg:block">
            <StatsBar />
          </div>

          {/* Profile Dropdown */}
          <div className="hidden md:block relative" ref={profileDropdown.ref}>
            <button
              onClick={() => profileDropdown.setOpen(!profileDropdown.open)}
              className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-900/80 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 border border-slate-200/70 dark:border-slate-800 rounded-lg px-2.5 py-1.5 transition-all text-xs font-semibold"
            >
              <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center text-white text-[11px] font-bold">
                {username?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="max-w-16 truncate">{username || "User"}</span>
              <ChevronDown
                className={cn(
                  "h-3 w-3 text-slate-400 transition-transform",
                  profileDropdown.open && "rotate-180"
                )}
              />
            </button>
            <AnimatePresence>
              {profileDropdown.open && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  className="absolute right-0 top-10 z-50 w-60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden"
                >
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200/70 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                        {username?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-foreground truncate">
                          {username}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Level {level} · {xp} XP
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-2.5 border-b border-slate-200/70 dark:border-slate-800">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Active Curriculum
                    </p>
                    <div className="flex gap-1.5">
                      {["en", "zh"].map((lang) => (
                        <button
                          key={lang}
                          onClick={() => {
                            setActiveStudyLanguage(lang);
                            profileDropdown.setOpen(false);
                          }}
                          className={cn(
                            "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all text-center",
                            activeStudyLanguage === lang
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-foreground"
                          )}
                        >
                          {lang === "en" ? "English" : "Chinese"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-1">
                    <button
                      onClick={() => {
                        if (confirm("Reset all progress?")) {
                          resetProgress();
                          profileDropdown.setOpen(false);
                        }
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset Training Progress
                    </button>
                    <LogoutDialog
                      renderTrigger={
                        <button className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors">
                          <LogOut className="h-3.5 w-3.5" />
                          Sign Out
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

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
