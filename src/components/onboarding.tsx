"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mascot } from "@/components/mascot";
import { useGame, translations } from "@/contexts/game-context";
import { Sparkles } from "@/components/floating-decorations";

type OnboardingStep = "language" | "name" | "complete";

export function OnboardingFlow() {
  const { setLanguage, setUsername, completeOnboarding, language } = useGame();
  const [step, setStep] = useState<OnboardingStep>("language");
  const [name, setName] = useState("");
  const [mascotMood, setMascotMood] = useState<"happy" | "excited" | "cheering">("happy");
  const t = translations[language];

  const handleLanguageSelect = (lang: "en" | "vi") => {
    setLanguage(lang);
    setMascotMood("excited");
    setTimeout(() => {
      setStep("name");
      setMascotMood("happy");
    }, 500);
  };

  const handleNameSubmit = () => {
    if (name.trim()) {
      setUsername(name.trim());
      setMascotMood("cheering");
      setStep("complete");
      setTimeout(() => {
        completeOnboarding();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-100 via-pink-50 to-sky-100 dark:from-purple-950 dark:via-pink-950 dark:to-sky-950 flex items-center justify-center p-4 z-50 overflow-hidden">
      {/* Floating decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-[10%] left-[5%] text-6xl opacity-30"
          animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          ⭐
        </motion.div>
        <motion.div
          className="absolute top-[15%] right-[10%] text-5xl opacity-25"
          animate={{ y: [0, -15, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
        >
          ☁️
        </motion.div>
        <motion.div
          className="absolute bottom-[20%] left-[8%] text-4xl opacity-30"
          animate={{ y: [0, -10, 0], rotate: [-5, 5, -5] }}
          transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
        >
          🌸
        </motion.div>
        <motion.div
          className="absolute bottom-[15%] right-[5%] text-6xl opacity-20"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          🌈
        </motion.div>
        <motion.div
          className="absolute top-[40%] right-[3%] text-3xl opacity-30"
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: 0.8 }}
        >
          ✨
        </motion.div>
        <motion.div
          className="absolute top-[60%] left-[3%] text-4xl opacity-25"
          animate={{ scale: [1, 1.2, 1], rotate: [-10, 10, -10] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          📚
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {/* Language Selection */}
        {step === "language" && (
          <motion.div
            key="language"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -50 }}
            className="flex flex-col items-center text-center max-w-md"
          >
            <Mascot mood={mascotMood} size="xl" animate />
            
            <motion.h1
              className="text-3xl md:text-4xl font-bold mt-8 mb-4 bg-gradient-kawaii bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              StudyEN ✨
            </motion.h1>

            <motion.p
              className="text-lg text-muted-foreground mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {t.selectLanguage}
            </motion.p>

            <motion.div
              className="flex gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.button
                onClick={() => handleLanguageSelect("en")}
                className="relative group px-8 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-3xl shadow-kawaii hover:shadow-kawaii-lg transition-all"
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-4xl mb-2 block">🇬🇧</span>
                <span className="font-bold text-lg">English</span>
                <Sparkles count={3} />
              </motion.button>

              <motion.button
                onClick={() => handleLanguageSelect("vi")}
                className="relative group px-8 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-3xl shadow-kawaii hover:shadow-kawaii-lg transition-all"
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-4xl mb-2 block">🇻🇳</span>
                <span className="font-bold text-lg">Tiếng Việt</span>
                <Sparkles count={3} />
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {/* Name Input */}
        {step === "name" && (
          <motion.div
            key="name"
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -50 }}
            className="flex flex-col items-center text-center max-w-md"
          >
            <Mascot mood={mascotMood} size="lg" animate />

            <motion.h2
              className="text-2xl md:text-3xl font-bold mt-6 mb-6 text-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {t.enterName} 🎒
            </motion.h2>

            <motion.div
              className="w-full max-w-xs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                placeholder="..."
                maxLength={20}
                className="w-full px-6 py-4 text-xl text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-3xl shadow-kawaii border-2 border-transparent focus:border-kawaii-purple focus:outline-none transition-all placeholder:text-muted-foreground/50"
                autoFocus
              />
            </motion.div>

            <motion.button
              onClick={handleNameSubmit}
              disabled={!name.trim()}
              className="mt-6 px-8 py-4 bg-gradient-kawaii text-white font-bold text-lg rounded-3xl shadow-kawaii hover:shadow-kawaii-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: name.trim() ? 1.05 : 1 }}
              whileTap={{ scale: name.trim() ? 0.95 : 1 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {t.startAdventure} 🚀
            </motion.button>
          </motion.div>
        )}

        {/* Welcome Complete */}
        {step === "complete" && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: 3 }}
            >
              <Mascot mood="cheering" size="xl" />
            </motion.div>

            <motion.h2
              className="text-3xl md:text-4xl font-bold mt-8 bg-gradient-kawaii bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {t.welcome}, {name}! 🎉
            </motion.h2>

            {/* Confetti effect */}
            <div className="fixed inset-0 pointer-events-none">
              {Array.from({ length: 30 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-2xl"
                  style={{ left: `${Math.random() * 100}%` }}
                  initial={{ y: -50, opacity: 1 }}
                  animate={{ y: "100vh", opacity: 0 }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    delay: i * 0.1,
                    ease: "easeIn",
                  }}
                >
                  {["🎊", "🎉", "⭐", "✨", "💫", "🌟"][Math.floor(Math.random() * 6)]}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
