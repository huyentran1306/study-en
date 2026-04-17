"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export type MascotMood = "happy" | "thinking" | "excited" | "cheering" | "shocked" | "sleeping";

interface MascotProps {
  mood?: MascotMood;
  size?: "sm" | "md" | "lg" | "xl";
  message?: string;
  onClick?: () => void;
  className?: string;
  animate?: boolean;
}

const messages = {
  happy: [
    "Yay! Let's learn together! 📚",
    "You're doing great! ⭐",
    "Keep it up, superstar! 🌟",
    "Learning is fun! 🎉",
  ],
  thinking: [
    "Hmm, let me think... 🤔",
    "That's a good question! 💭",
    "Processing... 🧠",
    "Interesting... 📖",
  ],
  excited: [
    "WOW! Amazing! 🎊",
    "You got it! 🎯",
    "Incredible work! 💫",
    "Fantastic! 🚀",
  ],
  cheering: [
    "You can do it! 💪",
    "Go go go! 🏃‍♂️",
    "Almost there! 🏁",
    "Never give up! ✨",
  ],
  shocked: [
    "Oh no! 😱",
    "Oops! Let's try again! 🔄",
    "Don't worry, mistakes help us learn! 💜",
    "That was unexpected! 😮",
  ],
  sleeping: [
    "Zzz... 💤",
    "*snore* 😴",
    "So sleepy... 🌙",
    "Need... coffee... ☕",
  ],
};

const sizeClasses = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
  xl: "w-48 h-48",
};

export function Mascot({
  mood = "happy",
  size = "md",
  message,
  onClick,
  className = "",
  animate = true,
}: MascotProps) {
  const [showMessage, setShowMessage] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Show random message
      const moodMessages = messages[mood];
      const randomMsg = moodMessages[Math.floor(Math.random() * moodMessages.length)];
      setCurrentMessage(randomMsg);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 2500);
    }
  };

  const getEyes = () => {
    switch (mood) {
      case "happy":
      case "cheering":
        return (
          <>
            <div className="absolute top-[28%] left-[22%] w-[18%] h-[18%] bg-gray-800 rounded-full">
              <div className="absolute top-[15%] left-[25%] w-[35%] h-[35%] bg-white rounded-full" />
            </div>
            <div className="absolute top-[28%] right-[22%] w-[18%] h-[18%] bg-gray-800 rounded-full">
              <div className="absolute top-[15%] left-[25%] w-[35%] h-[35%] bg-white rounded-full" />
            </div>
          </>
        );
      case "excited":
        return (
          <>
            <div className="absolute top-[26%] left-[20%] w-[20%] h-[22%] bg-gray-800 rounded-full">
              <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] bg-white rounded-full" />
              <div className="absolute top-[35%] left-[55%] w-[20%] h-[20%] bg-white rounded-full" />
            </div>
            <div className="absolute top-[26%] right-[20%] w-[20%] h-[22%] bg-gray-800 rounded-full">
              <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] bg-white rounded-full" />
              <div className="absolute top-[35%] left-[55%] w-[20%] h-[20%] bg-white rounded-full" />
            </div>
          </>
        );
      case "thinking":
        return (
          <>
            <div className="absolute top-[30%] left-[25%] w-[15%] h-[15%] bg-gray-800 rounded-full" />
            <div className="absolute top-[28%] right-[20%] w-[18%] h-[18%] bg-gray-800 rounded-full">
              <div className="absolute top-[15%] left-[25%] w-[35%] h-[35%] bg-white rounded-full" />
            </div>
          </>
        );
      case "shocked":
        return (
          <>
            <div className="absolute top-[25%] left-[20%] w-[20%] h-[24%] bg-gray-800 rounded-full border-4 border-white">
              <div className="absolute top-[20%] left-[30%] w-[25%] h-[25%] bg-white rounded-full" />
            </div>
            <div className="absolute top-[25%] right-[20%] w-[20%] h-[24%] bg-gray-800 rounded-full border-4 border-white">
              <div className="absolute top-[20%] left-[30%] w-[25%] h-[25%] bg-white rounded-full" />
            </div>
          </>
        );
      case "sleeping":
        return (
          <>
            <div className="absolute top-[32%] left-[22%] w-[18%] h-[4%] bg-gray-800 rounded-full" />
            <div className="absolute top-[32%] right-[22%] w-[18%] h-[4%] bg-gray-800 rounded-full" />
          </>
        );
      default:
        return null;
    }
  };

  const getMouth = () => {
    switch (mood) {
      case "happy":
        return (
          <div className="absolute bottom-[22%] left-1/2 -translate-x-1/2 w-[30%] h-[15%] border-b-4 border-gray-800 rounded-b-full" />
        );
      case "excited":
      case "cheering":
        return (
          <div className="absolute bottom-[18%] left-1/2 -translate-x-1/2 w-[35%] h-[20%] bg-gray-800 rounded-full flex items-center justify-center">
            <div className="w-[60%] h-[40%] bg-pink-400 rounded-full mt-1" />
          </div>
        );
      case "thinking":
        return (
          <div className="absolute bottom-[24%] left-[55%] w-[12%] h-[8%] bg-gray-800 rounded-full" />
        );
      case "shocked":
        return (
          <div className="absolute bottom-[18%] left-1/2 -translate-x-1/2 w-[20%] h-[20%] bg-gray-800 rounded-full" />
        );
      case "sleeping":
        return (
          <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2 w-[8%] h-[12%] bg-transparent border-2 border-gray-400 rounded-full" />
        );
      default:
        return null;
    }
  };

  const getBlush = () => {
    if (mood === "sleeping") return null;
    return (
      <>
        <div className="absolute top-[42%] left-[12%] w-[12%] h-[8%] bg-pink-300/60 rounded-full blur-[2px]" />
        <div className="absolute top-[42%] right-[12%] w-[12%] h-[8%] bg-pink-300/60 rounded-full blur-[2px]" />
      </>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Speech bubble */}
      {(showMessage || message) && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.8 }}
          className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-2xl shadow-kawaii text-sm font-medium text-gray-700 whitespace-nowrap z-10"
        >
          {message || currentMessage}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45" />
        </motion.div>
      )}

      {/* Mascot body */}
      <motion.div
        onClick={handleClick}
        className={`${sizeClasses[size]} relative cursor-pointer`}
        animate={
          animate
            ? {
                y: mood === "sleeping" ? [0, -3, 0] : [0, -8, 0],
                rotate: mood === "excited" ? [-2, 2, -2] : 0,
              }
            : {}
        }
        transition={{
          duration: mood === "sleeping" ? 3 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Main body - blue blob */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-300 via-sky-400 to-blue-400 rounded-[45%_55%_50%_50%/55%_50%_50%_45%] shadow-kawaii-sky">
          {/* Belly highlight */}
          <div className="absolute top-[55%] left-1/2 -translate-x-1/2 w-[50%] h-[35%] bg-white/40 rounded-[50%]" />
        </div>

        {/* Face */}
        {getEyes()}
        {getMouth()}
        {getBlush()}

        {/* Ears/antennas */}
        <div className="absolute -top-[8%] left-[20%] w-[15%] h-[15%] bg-gradient-to-br from-sky-300 to-sky-400 rounded-full" />
        <div className="absolute -top-[8%] right-[20%] w-[15%] h-[15%] bg-gradient-to-br from-sky-300 to-sky-400 rounded-full" />

        {/* Arms */}
        <motion.div
          className="absolute top-[50%] -left-[10%] w-[20%] h-[15%] bg-gradient-to-br from-sky-300 to-sky-400 rounded-full"
          animate={mood === "cheering" ? { rotate: [0, -20, 0] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-[50%] -right-[10%] w-[20%] h-[15%] bg-gradient-to-br from-sky-300 to-sky-400 rounded-full"
          animate={mood === "cheering" ? { rotate: [0, 20, 0] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        />

        {/* Feet */}
        <div className="absolute -bottom-[5%] left-[20%] w-[20%] h-[12%] bg-gradient-to-br from-sky-300 to-sky-400 rounded-full" />
        <div className="absolute -bottom-[5%] right-[20%] w-[20%] h-[12%] bg-gradient-to-br from-sky-300 to-sky-400 rounded-full" />

        {/* Z's for sleeping */}
        {mood === "sleeping" && (
          <div className="absolute -top-4 -right-2 text-gray-400 text-lg font-bold animate-pulse">
            💤
          </div>
        )}

        {/* Stars for excited */}
        {mood === "excited" && (
          <>
            <motion.span
              className="absolute -top-2 -left-2 text-yellow-400"
              animate={{ scale: [1, 1.3, 1], rotate: [0, 15, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              ✨
            </motion.span>
            <motion.span
              className="absolute -top-4 right-0 text-yellow-400"
              animate={{ scale: [1.2, 1, 1.2], rotate: [0, -15, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            >
              ⭐
            </motion.span>
          </>
        )}
      </motion.div>
    </div>
  );
}
