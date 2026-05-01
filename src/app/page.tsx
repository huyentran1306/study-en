"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DailyChallengeCard } from "@/components/daily-challenge";
// Mascot removed for hero — small pet appears in Navbar
import { XPBar, LevelBadge } from "@/components/gamification";
import { useGame, useTranslation } from "@/contexts/game-context";
import { PetWidget } from "@/components/pet-system";
import { WorldMap } from "@/components/world-map";
import { MysteryBoxWidget } from "@/components/mystery-box";
import { StreakHeatmap } from "@/components/streak-heatmap";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  const { username, level, streak } = useGame();
  const t = useTranslation();

  const features = [
    {
      title: t.practiceConversation,
      description: "Chat with AI friends and practice real conversations!",
      emoji: "💬",
      href: "/chat",
      color: "kawaii-sky",
      gradient: "from-sky-300 to-blue-400",
    },
    {
      title: t.learnNewWords,
      description: "Learn words with cute flashcards and fun quizzes!",
      emoji: "📚",
      href: "/vocab",
      color: "kawaii-purple",
      gradient: "from-purple-300 to-violet-400",
    },
    {
      title: t.improveSkills,
      description: "Record your voice and get instant feedback!",
      emoji: "🎤",
      href: "/speaking",
      color: "kawaii-pink",
      gradient: "from-pink-300 to-rose-400",
    },
    {
      title: t.games,
      description: "Play fun mini-games while learning new words!",
      emoji: "🎮",
      href: "/games",
      color: "kawaii-mint",
      gradient: "from-green-300 to-emerald-400",
    },
    {
      title: t.story,
      description: "Interactive stories with vocabulary adventures!",
      emoji: "📖",
      href: "/story",
      color: "kawaii-yellow",
      gradient: "from-amber-300 to-orange-400",
    },
    {
      title: t.roleplay,
      description: "Practice real-life scenarios like ordering food!",
      emoji: "🎭",
      href: "/roleplay",
      color: "kawaii-purple",
      gradient: "from-indigo-300 to-purple-400",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Welcome Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-8 text-center"
      >
        {/* Greeting with Mascot */}
        <div className="flex flex-col items-center gap-4">
          {/* Large mascot removed per design — keep greeting only */}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <h1 className="text-3xl sm:text-4xl font-extrabold">
              <span className="bg-gradient-kawaii bg-clip-text text-transparent">
                {t.welcome}, {username}!
              </span>
              <motion.span
                className="inline-block ml-2"
                animate={{ rotate: [0, 20, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                👋
              </motion.span>
            </h1>
            <p className="text-muted-foreground text-lg">
              {t.continueJourney} ✨
            </p>
          </motion.div>
        </div>

        {/* XP Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 max-w-md mx-auto"
        >
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur rounded-3xl p-5 shadow-kawaii">
            <div className="flex items-center gap-4 mb-3">
              <LevelBadge size="lg" />
              <div className="flex-1">
                <XPBar />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>🔥</span>
              <span className="font-medium">{streak} {t.streak}</span>
              <span className="mx-2">•</span>
              <span>⭐</span>
              <span className="font-medium">{t.level} {level}</span>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* Feature Cards */}
      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="py-8"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {features.map((feature, idx) => (
            <motion.div key={feature.title} variants={item} custom={idx}>
              <Link href={feature.href}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group cursor-pointer rounded-3xl bg-white/70 dark:bg-gray-800/70 backdrop-blur p-6 shadow-kawaii hover:shadow-kawaii-lg transition-all border-2 border-transparent hover:border-kawaii-purple/30"
                >
                  {/* Icon */}
                  <motion.div 
                    className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg`}
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <span className="text-3xl">{feature.emoji}</span>
                  </motion.div>
                  
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2 group-hover:text-kawaii-purple transition-colors">
                    {feature.title}
                    <motion.div
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </motion.div>
                  </h3>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Daily Challenge */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="py-6"
      >
        <div className="mb-6 flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-red-400 shadow-lg"
          >
            <span className="text-2xl">🔥</span>
          </motion.div>
          <div>
            <h2 className="text-xl font-bold">{t.dailyChallenge}</h2>
            <p className="text-sm text-muted-foreground">
              Complete to earn XP & coins! 💰
            </p>
          </div>
        </div>
        <DailyChallengeCard />
      </motion.section>

      {/* Quick Actions */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="py-8"
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/chat">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="gap-2 px-8 py-6 text-lg rounded-3xl bg-gradient-kawaii text-white font-bold shadow-kawaii hover:shadow-kawaii-lg">
                💬 {t.practiceNow}
                <Sparkles className="h-5 w-5" />
              </Button>
            </motion.div>
          </Link>
          <Link href="/games">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="outline" 
                className="gap-2 px-8 py-6 text-lg rounded-3xl border-2 border-kawaii-purple/30 hover:bg-kawaii-purple/10 font-bold"
              >
                🎮 {t.games}
              </Button>
            </motion.div>
          </Link>
        </div>
      </motion.section>

      {/* Pet, World Map & Mystery Box */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="py-6"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <PetWidget />
          <WorldMap />
          <MysteryBoxWidget />
        </div>
      </motion.section>

      {/* Study Activity Heatmap */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="py-6"
      >
        <StreakHeatmap />
      </motion.section>
    </div>
  );
}
