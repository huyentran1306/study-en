"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ChevronDown,
  LogOut,
  RotateCcw,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StatsBar } from "@/components/gamification";
import { useTranslation, useGame } from "@/contexts/game-context";
import { Mascot } from "@/components/mascot";
import { WOTDBadge } from "@/components/wotd-badge";

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

interface DropdownItem { href: string; label: string; emoji: string; }

function NavDropdown({ label, emoji, items, pathname }: { label: string; emoji: string; items: DropdownItem[]; pathname: string }) {
  const { open, setOpen, ref } = useDropdown();
  const isAnyActive = items.some(i => pathname === i.href);

  return (
    <div className="relative" ref={ref}>
      <motion.button
        whileHover={{ scale: 1.03, y: -1 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-sm font-semibold transition-all",
          isAnyActive ? "bg-gradient-kawaii text-white shadow-kawaii" : "hover:bg-kawaii-purple/10 text-foreground"
        )}
      >
        <span>{emoji}</span>
        <span>{label}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-10 left-0 z-50 min-w-44 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-kawaii-purple/15 overflow-hidden py-1"
          >
            {items.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                <div className={cn(
                  "flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold hover:bg-kawaii-purple/10 transition-colors",
                  pathname === item.href && "bg-kawaii-purple/10 text-kawaii-purple"
                )}>
                  <span className="text-base">{item.emoji}</span>
                  {item.label}
                </div>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslation();
  const { activeStudyLanguage, setActiveStudyLanguage, username, xp, level, resetProgress, logout } = useGame();
  const profileDropdown = useDropdown();

  const primaryLinks = [
    { href: "/", label: t.home, emoji: "🏠" },
    { href: "/chat", label: t.chat, emoji: "💬" },
    { href: "/vocab", label: t.vocab, emoji: "📚" },
    { href: "/speaking", label: t.speaking, emoji: "🎤" },
    { href: "/games", label: t.games, emoji: "🎮" },
  ];

  const practiceLinks = [
    { href: "/story", label: t.story || "Story", emoji: "📖" },
    { href: "/roleplay", label: t.roleplay || "Roleplay", emoji: "🎭" },
    { href: "/path", label: "Path", emoji: "🗺️" },
    { href: "/review", label: "Review", emoji: "🔄" },
  ];

  const statsLinks = [
    { href: "/achievements", label: "Achievements", emoji: "🏆" },
    { href: "/leaderboard", label: "Leaderboard", emoji: "📊" },
  ];

  const allLinks = [...primaryLinks, ...practiceLinks, ...statsLinks];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-kawaii-purple/20 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <motion.div whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.95 }}>
            <Mascot mood="happy" size="sm" animate={false} />
          </motion.div>
          <div className="hidden sm:block">
            <span className="text-xl font-extrabold bg-gradient-kawaii bg-clip-text text-transparent">StudyEN</span>
            <span className="ml-1 text-sm">✨</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {primaryLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href}>
                <motion.div whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "gap-1.5 rounded-2xl transition-all font-semibold text-sm px-3",
                      isActive ? "bg-gradient-kawaii text-white shadow-kawaii" : "hover:bg-kawaii-purple/10"
                    )}
                  >
                    <span className="text-sm">{link.emoji}</span>
                    {link.label}
                  </Button>
                </motion.div>
              </Link>
            );
          })}
          <NavDropdown label="Practice" emoji="🎯" items={practiceLinks} pathname={pathname} />
          <NavDropdown label="Stats" emoji="📈" items={statsLinks} pathname={pathname} />
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <WOTDBadge />
          {/* Language switcher */}
          <div className="hidden sm:flex items-center gap-0.5 bg-white/60 dark:bg-gray-800/60 rounded-2xl p-1 shadow-sm">
            {["en", "zh"].map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveStudyLanguage(lang)}
                className={cn(
                  "px-2 py-1 rounded-xl text-xs font-bold transition-all",
                  activeStudyLanguage === lang
                    ? "bg-gradient-kawaii text-white shadow-kawaii"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {lang === "en" ? "🇬🇧" : "🇨🇳"}
              </button>
            ))}
          </div>
          <div className="hidden lg:block"><StatsBar /></div>
          {/* Profile dropdown */}
          <div className="hidden md:block relative" ref={profileDropdown.ref}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => profileDropdown.setOpen(!profileDropdown.open)}
              className="flex items-center gap-1.5 bg-kawaii-purple/10 hover:bg-kawaii-purple/20 rounded-2xl px-2.5 py-1.5 transition-all"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-kawaii flex items-center justify-center text-white text-xs font-bold">
                {username?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="text-xs font-bold max-w-14 truncate">{username || "User"}</span>
              <ChevronDown className={cn("h-3 w-3 transition-transform text-muted-foreground", profileDropdown.open && "rotate-180")} />
            </motion.button>
            <AnimatePresence>
              {profileDropdown.open && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  className="absolute right-0 top-10 z-50 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-kawaii-purple/15 overflow-hidden"
                >
                  <div className="px-4 py-3 bg-kawaii-purple/5 border-b border-kawaii-purple/10">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-kawaii flex items-center justify-center text-white font-bold">
                        {username?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{username}</div>
                        <div className="text-xs text-muted-foreground">⭐ {xp} XP · Level {level}</div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-2.5 border-b border-kawaii-purple/10">
                    <p className="text-xs text-muted-foreground mb-1.5">Study Language</p>
                    <div className="flex gap-2">
                      {["en", "zh"].map(lang => (
                        <button key={lang} onClick={() => { setActiveStudyLanguage(lang); profileDropdown.setOpen(false); }}
                          className={cn("flex-1 py-1.5 rounded-xl text-xs font-bold transition-all", activeStudyLanguage === lang ? "bg-gradient-kawaii text-white" : "bg-gray-100 dark:bg-gray-700 text-muted-foreground")}>
                          {lang === "en" ? "🇬🇧 English" : "🇨🇳 中文"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { if (confirm("Reset all progress?")) { resetProgress(); profileDropdown.setOpen(false); } }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-500 transition-colors"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset Progress
                    </button>
                    <button
                      onClick={() => { if (confirm("Log out and reset?")) { logout(); profileDropdown.setOpen(false); } }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Log Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden rounded-xl"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-kawaii-purple/20 md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl"
          >
            <nav className="flex flex-col gap-1 p-4">
              <div className="mb-3 pb-3 border-b border-kawaii-purple/10"><StatsBar /></div>
              <div className="mb-3 pb-3 border-b border-kawaii-purple/10 flex items-center gap-2">
                <span className="text-sm text-muted-foreground font-medium">Study:</span>
                {["en", "zh"].map((lang) => (
                  <button key={lang} onClick={() => { setActiveStudyLanguage(lang); setMobileOpen(false); }}
                    className={cn("px-3 py-1.5 rounded-xl text-sm font-bold transition-all",
                      activeStudyLanguage === lang ? "bg-gradient-kawaii text-white shadow-kawaii" : "bg-white/80 dark:bg-gray-700/80 text-muted-foreground")}>
                    {lang === "en" ? "🇬🇧 English" : "🇨🇳 Chinese"}
                  </button>
                ))}
              </div>
              {allLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button variant="ghost"
                        className={cn("w-full justify-start gap-3 rounded-2xl text-base py-5",
                          isActive ? "bg-gradient-kawaii text-white shadow-kawaii" : "hover:bg-kawaii-purple/10")}>
                        <span className="text-xl">{link.emoji}</span>
                        {link.label}
                      </Button>
                    </motion.div>
                  </Link>
                );
              })}
              <button
                onClick={() => { if (confirm("Log out?")) { resetProgress(); setMobileOpen(false); } }}
                className="mt-2 flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-base font-semibold"
              >
                <LogOut className="h-5 w-5" />
                Log Out
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
