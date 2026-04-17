"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useGame, useTranslation } from "@/contexts/game-context";

const SKIN_COLORS = ["#FFDBB4", "#E8B88A", "#C68B59", "#8D5524", "#5C3A1E", "#FFF0DB"];
const HAIR_STYLES = ["💇", "💇‍♀️", "👱", "👩‍🦱", "👩‍🦰", "👩‍🦳"];
const OUTFITS = [
  { id: "default", name: "Casual", emoji: "👕", cost: 0 },
  { id: "student", name: "Student", emoji: "🎓", cost: 30 },
  { id: "explorer", name: "Explorer", emoji: "🧥", cost: 30 },
  { id: "wizard", name: "Wizard", emoji: "🧙", cost: 50 },
  { id: "astronaut", name: "Astronaut", emoji: "🧑‍🚀", cost: 50 },
  { id: "superhero", name: "Superhero", emoji: "🦸", cost: 80 },
  { id: "pirate", name: "Pirate", emoji: "🏴‍☠️", cost: 60 },
  { id: "chef", name: "Chef", emoji: "👨‍🍳", cost: 40 },
];

export function AvatarDisplay({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const { avatar } = useGame();
  const outfit = OUTFITS.find((o) => o.id === avatar.outfit) || OUTFITS[0];
  const sizeClass = size === "sm" ? "w-12 h-12 text-2xl" : size === "md" ? "w-20 h-20 text-4xl" : "w-28 h-28 text-6xl";

  return (
    <motion.div
      className={`${sizeClass} rounded-full flex items-center justify-center shadow-kawaii`}
      style={{ backgroundColor: SKIN_COLORS[avatar.skinColor] }}
      whileHover={{ scale: 1.1, rotate: 5 }}
    >
      {outfit.emoji}
    </motion.div>
  );
}

export function AvatarCustomizer() {
  const { avatar, updateAvatar, unlockOutfit, coins } = useGame();
  const t = useTranslation();
  const [tab, setTab] = useState<"skin" | "hair" | "outfit">("skin");

  return (
    <div className="rounded-3xl bg-white/70 dark:bg-gray-800/70 backdrop-blur p-6 shadow-kawaii border-2 border-kawaii-purple/20">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        🎨 {t.avatar}
      </h3>

      {/* Preview */}
      <div className="flex justify-center mb-6">
        <AvatarDisplay size="lg" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(["skin", "hair", "outfit"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === t ? "bg-gradient-kawaii text-white shadow-sm" : "bg-muted hover:bg-kawaii-purple/10"
            }`}
          >
            {t === "skin" ? "🎨" : t === "hair" ? "💇" : "👕"} {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Options */}
      {tab === "skin" && (
        <div className="grid grid-cols-6 gap-2">
          {SKIN_COLORS.map((color, i) => (
            <motion.button
              key={i}
              onClick={() => updateAvatar({ skinColor: i })}
              className={`w-10 h-10 rounded-full border-3 ${
                avatar.skinColor === i ? "border-kawaii-purple ring-2 ring-kawaii-purple/50" : "border-transparent"
              }`}
              style={{ backgroundColor: color }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>
      )}

      {tab === "hair" && (
        <div className="grid grid-cols-6 gap-2">
          {HAIR_STYLES.map((style, i) => (
            <motion.button
              key={i}
              onClick={() => updateAvatar({ hairStyle: i })}
              className={`p-2 rounded-xl text-2xl ${
                avatar.hairStyle === i ? "bg-kawaii-purple/20 ring-2 ring-kawaii-purple" : "bg-muted"
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {style}
            </motion.button>
          ))}
        </div>
      )}

      {tab === "outfit" && (
        <div className="grid grid-cols-2 gap-2">
          {OUTFITS.map((outfit) => {
            const owned = avatar.unlockedOutfits.includes(outfit.id);
            const equipped = avatar.outfit === outfit.id;
            return (
              <motion.button
                key={outfit.id}
                onClick={() => {
                  if (owned) {
                    updateAvatar({ outfit: outfit.id });
                  } else {
                    unlockOutfit(outfit.id);
                  }
                }}
                disabled={!owned && coins < outfit.cost}
                className={`p-3 rounded-2xl text-left ${
                  equipped
                    ? "bg-gradient-kawaii text-white shadow-kawaii"
                    : owned
                    ? "bg-white/60 dark:bg-gray-700/60 hover:bg-kawaii-purple/10"
                    : "bg-muted/50 border-2 border-dashed border-muted-foreground/20"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-2xl">{outfit.emoji}</span>
                <p className="text-xs font-bold mt-1">{outfit.name}</p>
                {!owned && (
                  <p className="text-xs opacity-70">🪙 {outfit.cost}</p>
                )}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
