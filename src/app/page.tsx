"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DailyChallengeCard } from "@/components/daily-challenge";

const features = [
  {
    title: "AI Conversation",
    description: "Practice real conversations with AI partners — from casual chat to job interviews.",
    emoji: "💬",
    href: "/chat",
    gradient: "from-blue-400 to-cyan-400",
    bgGlow: "bg-blue-500/10",
    border: "border-blue-200/50 dark:border-blue-800/50",
  },
  {
    title: "Vocabulary Builder",
    description: "Master new words with cute illustrated flashcards and progress tracking.",
    emoji: "📚",
    href: "/vocab",
    gradient: "from-violet-400 to-purple-500",
    bgGlow: "bg-violet-500/10",
    border: "border-violet-200/50 dark:border-violet-800/50",
  },
  {
    title: "Speaking Practice",
    description: "Record your voice, get AI feedback on pronunciation, grammar, and fluency.",
    emoji: "🎤",
    href: "/speaking",
    gradient: "from-pink-400 to-rose-400",
    bgGlow: "bg-pink-500/10",
    border: "border-pink-200/50 dark:border-pink-800/50",
  },
];

const stats = [
  { label: "AI Roles", value: "3+", emoji: "🤖" },
  { label: "Vocabulary", value: "100+", emoji: "📖" },
  { label: "Challenges", value: "Daily", emoji: "🎯" },
  { label: "Practice", value: "24/7", emoji: "⭐" },
];

const floatingEmojis = ["🌟", "✨", "🎓", "📝", "💡", "🚀", "🌈", "🎉"];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative py-12 text-center sm:py-20 overflow-hidden"
      >
        {/* Floating emoji decorations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {floatingEmojis.map((emoji, i) => (
            <motion.span
              key={i}
              className="absolute text-2xl select-none opacity-30"
              style={{
                left: `${8 + (i * 12) % 85}%`,
                top: `${10 + (i * 17) % 75}%`,
              }}
              animate={{
                y: [0, -16, 0],
                rotate: [0, i % 2 === 0 ? 10 : -10, 0],
              }}
              transition={{
                duration: 3 + (i * 0.4),
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            >
              {emoji}
            </motion.span>
          ))}
        </div>

        {/* Badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Badge
            variant="secondary"
            className="mb-6 gap-1.5 px-5 py-2 text-sm rounded-full bg-gradient-to-r from-violet-100 to-pink-100 dark:from-violet-900/40 dark:to-pink-900/40 text-violet-700 dark:text-violet-300 border-violet-200/50 dark:border-violet-700/50"
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            AI-Powered English Learning ✨
          </Badge>
        </motion.div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-7xl leading-tight">
          Learn English{" "}
          <span className="relative inline-block">
            <span className="bg-gradient-to-r from-violet-500 via-pink-500 to-rose-400 bg-clip-text text-transparent">
              
            </span>
            <motion.span
              className="absolute -top-2 -right-6 text-2xl"
              animate={{ rotate: [0, 20, -10, 20, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              🌟
            </motion.span>
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
          Practice conversations, build vocabulary with emoji illustrations, and improve your speaking with intelligent AI feedback — anytime, anywhere! 🎉
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/chat">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                className="gap-2 text-base px-8 py-6 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 shadow-cute text-white font-semibold"
              >
                💬 Start Chatting
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </Link>
          <Link href="/vocab">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 text-base px-8 py-6 rounded-2xl border-2 border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 font-semibold"
              >
                📚 Explore Words
              </Button>
            </motion.div>
          </Link>
        </div>

        {/* Stats */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mx-auto mt-14 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={item}
              whileHover={{ scale: 1.05, y: -2 }}
              className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-5 text-center shadow-sm"
            >
              <div className="text-3xl mb-1">{stat.emoji}</div>
              <div className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="py-12"
      >
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Everything You Need 🎯
          </h2>
          <p className="mt-3 text-muted-foreground text-lg">
            Three powerful tools to supercharge your English learning journey
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <motion.div key={feature.title} variants={item} custom={idx}>
              <Link href={feature.href}>
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`group cursor-pointer rounded-3xl border-2 ${feature.border} bg-card/80 backdrop-blur-sm p-8 shadow-sm hover:shadow-card transition-all`}
                >
                  {/* Emoji icon */}
                  <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-md`}>
                    <span className="text-3xl">{feature.emoji}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    {feature.title}
                    <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Daily Challenge Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="py-12"
      >
        <div className="mb-8 flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-red-400 shadow-md"
          >
            <span className="text-2xl">🔥</span>
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold">Daily Challenge</h2>
            <p className="text-sm text-muted-foreground">
              Complete today&apos;s challenge to keep your streak alive! 🏆
            </p>
          </div>
        </div>
        <DailyChallengeCard />
      </motion.section>
    </div>
  );
}
