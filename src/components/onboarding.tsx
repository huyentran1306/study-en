"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame, translations } from "@/contexts/game-context";
import { Sparkles } from "@/components/floating-decorations";
import { PetType } from "@/contexts/game-context";

type OnboardingStep = "name" | "target_language" | "pet" | "complete";

const PET_OPTIONS: { type: PetType; emoji: string; name: string; nameVi: string }[] = [
  { type: "cat", emoji: "🐱", name: "Cat", nameVi: "Mèo" },
  { type: "bunny", emoji: "🐰", name: "Bunny", nameVi: "Thỏ" },
  { type: "dog", emoji: "🐶", name: "Dog", nameVi: "Chó" },
  { type: "dragon", emoji: "🐲", name: "Dragon", nameVi: "Rồng" },
];

const PET_MASCOT: Record<PetType, string> = {
  cat: "🐱", bunny: "🐰", dog: "🐶", dragon: "🐲",
};

export function OnboardingFlow() {
  const { setLanguage, setUsername, completeOnboarding, language, setPetType } = useGame();
  // Default UI language to Vietnamese
  const [step, setStep] = useState<OnboardingStep>("name");
  const [name, setName] = useState("");
  const [selectedTargetLangs, setSelectedTargetLangs] = useState<string[]>(["en"]);
  const [selectedPet, setSelectedPet] = useState<PetType>("cat");
  const t = translations[language] || translations["vi"];

  const handleNameSubmit = () => {
    if (name.trim()) {
      setUsername(name.trim());
      setStep("target_language");
    }
  };

  const toggleTargetLang = (lang: string) => {
    setSelectedTargetLangs((prev) =>
      prev.includes(lang) ? (prev.length > 1 ? prev.filter((l) => l !== lang) : prev) : [...prev, lang]
    );
  };

  const handleTargetLanguageSubmit = () => {
    setStep("pet");
  };

  const handlePetSubmit = () => {
    setPetType(selectedPet);
    setStep("complete");
    setTimeout(() => {
      completeOnboarding(name.trim(), selectedTargetLangs);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-100 via-pink-50 to-sky-100 dark:from-purple-950 dark:via-pink-950 dark:to-sky-950 flex items-center justify-center p-4 z-50 overflow-hidden">
      {/* Floating decorations */}
      <div className="absolute inset-0 pointer-events-none">
        {["⭐","☁️","🌸","🌈","✨","📚"].map((e, i) => (
          <motion.div key={i} className="absolute text-4xl opacity-25"
            style={{ left: `${[5,85,8,92,96,3][i]}%`, top: `${[10,15,75,70,40,60][i]}%` }}
            animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.5 }}
          >
            {e}
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Name Input */}
        {step === "name" && (
          <motion.div key="name" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9, y: -50 }}
            className="flex flex-col items-center text-center max-w-md w-full"
          >
            <motion.div className="text-7xl mb-4" animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              🌟
            </motion.div>
            <h1 className="text-3xl font-extrabold mb-2 bg-gradient-kawaii bg-clip-text text-transparent">StudyEN ✨</h1>
            <p className="text-muted-foreground mb-6 text-base">
              {language === "en" ? "What's your name?" : "Tên bạn là gì?"}
            </p>

            {/* UI Language quick toggle */}
            <div className="flex gap-2 mb-6">
              {(["vi", "en"] as const).map(lang => (
                <button key={lang} onClick={() => setLanguage(lang)}
                  className={`px-4 py-1.5 rounded-2xl text-sm font-bold transition-all border-2 ${language === lang ? "bg-gradient-kawaii text-white border-transparent" : "border-gray-200 text-muted-foreground"}`}>
                  {lang === "vi" ? "🇻🇳 Tiếng Việt" : "🇬🇧 English"}
                </button>
              ))}
            </div>

            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
              placeholder={language === "en" ? "Your name..." : "Tên của bạn..."}
              maxLength={20}
              className="w-full max-w-xs px-6 py-4 text-xl text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-3xl shadow-kawaii border-2 border-transparent focus:border-kawaii-purple focus:outline-none transition-all"
              autoFocus
            />
            <motion.button onClick={handleNameSubmit} disabled={!name.trim()}
              className="mt-6 px-8 py-4 bg-gradient-kawaii text-white font-bold text-lg rounded-3xl shadow-kawaii disabled:opacity-50"
              whileHover={{ scale: name.trim() ? 1.05 : 1 }} whileTap={{ scale: name.trim() ? 0.95 : 1 }}
            >
              {language === "en" ? "Continue 🚀" : "Tiếp tục 🚀"}
            </motion.button>
          </motion.div>
        )}

        {/* Target Language Selection */}
        {step === "target_language" && (
          <motion.div key="target_language" initial={{ opacity: 0, scale: 0.9, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="flex flex-col items-center text-center max-w-md w-full"
          >
            <motion.div className="text-6xl mb-4" animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>🌍</motion.div>
            <h2 className="text-2xl font-extrabold mb-2">
              {language === "en" ? `Hi ${name}! What will you study?` : `Chào ${name}! Bạn muốn học gì?`}
            </h2>
            <p className="text-muted-foreground mb-6 text-sm">
              {language === "vi" ? "Có thể chọn nhiều ngôn ngữ" : "You can select multiple languages"}
            </p>

            <div className="flex flex-col gap-3 w-full max-w-xs">
              {[
                { code: "en", label: language === "vi" ? "Tiếng Anh 🇬🇧" : "English 🇬🇧" },
                { code: "zh", label: language === "vi" ? "Tiếng Trung 🇨🇳" : "Chinese 🇨🇳" },
              ].map(({ code, label }) => {
                const sel = selectedTargetLangs.includes(code);
                return (
                  <motion.button key={code} onClick={() => toggleTargetLang(code)}
                    className={`flex items-center gap-4 px-6 py-4 rounded-3xl shadow-kawaii border-2 transition-all ${sel ? "bg-gradient-kawaii text-white border-transparent" : "bg-white/80 dark:bg-gray-800/80 border-transparent hover:border-kawaii-purple"}`}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  >
                    <span className="font-bold text-lg flex-1 text-left">{label}</span>
                    {sel && <span className="text-xl">✓</span>}
                  </motion.button>
                );
              })}
            </div>

            <motion.button onClick={handleTargetLanguageSubmit}
              className="mt-6 px-8 py-4 bg-gradient-kawaii text-white font-bold text-lg rounded-3xl shadow-kawaii"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
              {language === "en" ? "Next ➡️" : "Tiếp theo ➡️"}
            </motion.button>
          </motion.div>
        )}

        {/* Pet Selection */}
        {step === "pet" && (
          <motion.div key="pet" initial={{ opacity: 0, scale: 0.9, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="flex flex-col items-center text-center max-w-md w-full"
          >
            <motion.div className="text-6xl mb-3" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
              {PET_MASCOT[selectedPet]}
            </motion.div>
            <h2 className="text-2xl font-extrabold mb-1">
              {language === "en" ? "Choose your companion!" : "Chọn bạn đồng hành!"}
            </h2>
            <p className="text-muted-foreground mb-6 text-sm">
              {language === "vi" ? "Bạn sẽ chăm sóc bạn đồng hành này trong suốt hành trình học tập" : "Your companion will grow with you as you learn!"}
            </p>

            <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-6">
              {PET_OPTIONS.map(pet => (
                <motion.button key={pet.type} onClick={() => setSelectedPet(pet.type)}
                  className={`flex flex-col items-center gap-2 py-5 rounded-3xl shadow-kawaii border-2 transition-all ${selectedPet === pet.type ? "bg-gradient-kawaii text-white border-transparent" : "bg-white/80 dark:bg-gray-800/80 border-transparent hover:border-kawaii-purple"}`}
                  whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.95 }}
                >
                  <span className="text-4xl">{pet.emoji}</span>
                  <span className="font-bold text-sm">{language === "vi" ? pet.nameVi : pet.name}</span>
                  {selectedPet === pet.type && <span className="text-xs opacity-80">✓ Selected</span>}
                </motion.button>
              ))}
            </div>

            <motion.button onClick={handlePetSubmit}
              className="px-8 py-4 bg-gradient-kawaii text-white font-bold text-lg rounded-3xl shadow-kawaii"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
              {language === "en" ? "Let's Go! 🚀" : "Bắt đầu thôi! 🚀"}
            </motion.button>
          </motion.div>
        )}

        {/* Welcome Complete */}
        {step === "complete" && (
          <motion.div key="complete" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center"
          >
            <motion.div className="text-8xl mb-4" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5, repeat: 3 }}>
              {PET_MASCOT[selectedPet]}
            </motion.div>
            <h2 className="text-3xl font-extrabold bg-gradient-kawaii bg-clip-text text-transparent">
              {language === "en" ? `Welcome, ${name}! 🎉` : `Chào mừng, ${name}! 🎉`}
            </h2>

            <div className="fixed inset-0 pointer-events-none">
              {Array.from({ length: 30 }).map((_, i) => (
                <motion.div key={i} className="absolute text-2xl" style={{ left: `${Math.random() * 100}%` }}
                  initial={{ y: -50, opacity: 1 }} animate={{ y: "100vh", opacity: 0 }}
                  transition={{ duration: 3 + Math.random() * 2, delay: i * 0.1 }}
                >
                  {["🎊","🎉","⭐","✨","💫","🌟"][Math.floor(Math.random() * 6)]}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

