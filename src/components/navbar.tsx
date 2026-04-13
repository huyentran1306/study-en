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
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home", icon: Home, emoji: "🏠" },
  { href: "/chat", label: "AI Chat", icon: MessageSquare, emoji: "💬" },
  { href: "/vocab", label: "Vocabulary", icon: BookOpen, emoji: "📚" },
  { href: "/speaking", label: "Speaking", icon: Mic, emoji: "🎤" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 shadow-cute transition-transform group-hover:scale-110">
            <span className="text-xl">🎓</span>
          </div>
          <div className="hidden sm:block">
            <span className="text-xl font-extrabold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
              StudyEN
            </span>
            <span className="ml-1 text-xs text-muted-foreground">✨</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "gap-2 rounded-xl transition-all font-medium",
                      isActive
                        ? "bg-gradient-to-r from-violet-500/15 to-pink-500/10 text-primary font-semibold shadow-sm"
                        : "hover:bg-secondary/80"
                    )}
                  >
                    <span className="text-base">{link.emoji}</span>
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute -bottom-px left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-pink-500 rounded-full"
                      />
                    )}
                  </Button>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
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
            className="overflow-hidden border-t border-border/50 md:hidden bg-background/95 backdrop-blur-xl"
          >
            <nav className="flex flex-col gap-1 p-4">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 rounded-xl text-base py-6",
                        isActive && "bg-gradient-to-r from-violet-500/15 to-pink-500/10 text-primary font-semibold"
                      )}
                    >
                      <span className="text-xl">{link.emoji}</span>
                      {link.label}
                    </Button>
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
