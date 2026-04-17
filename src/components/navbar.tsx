"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  BookOpen,
  Mic,
  Home,
  Menu,
  X,
  Gamepad2,
  BookHeart,
  Theater,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StatsBar } from "@/components/gamification";
import { useTranslation } from "@/contexts/game-context";
import { Mascot } from "@/components/mascot";

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslation();

  const navLinks = [
    { href: "/", label: t.home, icon: Home, emoji: "🏠" },
    { href: "/chat", label: t.chat, icon: MessageSquare, emoji: "💬" },
    { href: "/vocab", label: t.vocab, icon: BookOpen, emoji: "📚" },
    { href: "/speaking", label: t.speaking, icon: Mic, emoji: "🎤" },
    { href: "/games", label: t.games, icon: Gamepad2, emoji: "🎮" },
    { href: "/story", label: t.story, icon: BookHeart, emoji: "📖" },
    { href: "/roleplay", label: t.roleplay, icon: Theater, emoji: "🎭" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-kawaii-purple/20 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Mascot mood="happy" size="sm" animate={false} />
          </motion.div>
          <div className="hidden sm:block">
            <span className="text-xl font-extrabold bg-gradient-kawaii bg-clip-text text-transparent">
              StudyEN
            </span>
            <span className="ml-1 text-sm">✨</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href}>
                <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "gap-2 rounded-2xl transition-all font-semibold",
                      isActive
                        ? "bg-gradient-kawaii text-white shadow-kawaii"
                        : "hover:bg-kawaii-purple/10"
                    )}
                  >
                    <span className="text-base">{link.emoji}</span>
                    {link.label}
                  </Button>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Right side - Stats */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <StatsBar />
          </div>
          <div className="hidden md:block">
            <ModeToggle />
          </div>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden rounded-xl"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
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
              {/* Mobile Stats */}
              <div className="mb-4 pb-4 border-b border-kawaii-purple/10">
                <StatsBar />
              </div>
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                  >
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-3 rounded-2xl text-base py-6",
                          isActive 
                            ? "bg-gradient-kawaii text-white shadow-kawaii" 
                            : "hover:bg-kawaii-purple/10"
                        )}
                      >
                        <span className="text-xl">{link.emoji}</span>
                        {link.label}
                      </Button>
                    </motion.div>
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
