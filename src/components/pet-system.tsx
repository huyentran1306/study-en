"use client";

import { motion } from "framer-motion";
import { useGame, useTranslation, PetType } from "@/contexts/game-context";

const PET_EMOJIS: Record<PetType, string> = {
  cat: "🐱",
  dog: "🐶",
  bunny: "🐰",
  dragon: "🐲",
};

const PET_COLORS: Record<PetType, string> = {
  cat: "from-orange-300 to-amber-400",
  dog: "from-amber-300 to-yellow-400",
  bunny: "from-pink-300 to-rose-400",
  dragon: "from-purple-400 to-indigo-500",
};

export function PetWidget({ compact = false }: { compact?: boolean }) {
  const { pet, feedPet, coins } = useGame();
  const t = useTranslation();

  if (compact) {
    return (
      <motion.div
        className="flex items-center gap-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur rounded-2xl px-3 py-2 shadow-kawaii cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.span
          className="text-2xl"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {PET_EMOJIS[pet.type]}
        </motion.span>
        <div className="text-xs">
          <p className="font-bold">{pet.name}</p>
          <p className="text-muted-foreground">Lv.{pet.level}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="rounded-3xl bg-white/70 dark:bg-gray-800/70 backdrop-blur p-6 shadow-kawaii border-2 border-kawaii-purple/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="text-center mb-4">
        <motion.div
          className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br ${PET_COLORS[pet.type]} shadow-lg mb-3`}
          animate={{
            y: [0, -8, 0],
            rotate: pet.mood === "excited" ? [-3, 3, -3] : 0,
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-5xl">{PET_EMOJIS[pet.type]}</span>
        </motion.div>
        <h3 className="font-bold text-lg">{pet.name}</h3>
        <p className="text-sm text-muted-foreground">
          {t.level} {pet.level} • {pet.mood === "happy" ? "😊" : pet.mood === "hungry" ? "😋" : pet.mood === "sleepy" ? "😴" : "🤩"}
        </p>
      </div>

      {/* Hunger bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span>🍖 Hunger</span>
          <span>{pet.hunger}%</span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${pet.hunger > 60 ? "bg-green-400" : pet.hunger > 30 ? "bg-yellow-400" : "bg-red-400"}`}
            initial={{ width: 0 }}
            animate={{ width: `${pet.hunger}%` }}
          />
        </div>
      </div>

      {/* Energy bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span>⚡ Energy</span>
          <span>{pet.energy}%</span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pet.energy}%` }}
          />
        </div>
      </div>

      {/* Feed button */}
      <motion.button
        onClick={feedPet}
        disabled={coins < 5}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-400 to-amber-400 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={{ scale: coins >= 5 ? 1.02 : 1 }}
        whileTap={{ scale: coins >= 5 ? 0.98 : 1 }}
      >
        🍖 {t.feed} (5 🪙)
      </motion.button>
    </motion.div>
  );
}

export function PetSelector() {
  const { pet, setPetType, setPetName } = useGame();
  const types: PetType[] = ["cat", "dog", "bunny", "dragon"];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {types.map((type) => (
          <motion.button
            key={type}
            onClick={() => setPetType(type)}
            className={`p-4 rounded-2xl text-center ${
              pet.type === type
                ? "bg-gradient-kawaii text-white shadow-kawaii"
                : "bg-white/60 dark:bg-gray-800/60 hover:bg-kawaii-purple/10"
            }`}
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-3xl block mb-1">{PET_EMOJIS[type]}</span>
            <span className="text-xs font-medium capitalize">{type}</span>
          </motion.button>
        ))}
      </div>
      <input
        type="text"
        value={pet.name}
        onChange={(e) => setPetName(e.target.value)}
        maxLength={12}
        className="w-full px-4 py-3 rounded-2xl bg-white/60 dark:bg-gray-800/60 border-2 border-transparent focus:border-kawaii-purple focus:outline-none text-center font-bold"
        placeholder="Pet name..."
      />
    </div>
  );
}
