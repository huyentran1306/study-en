"use client";

import React from "react";
import { PetType } from "@/contexts/game-context";

export default function PetIcon({ type = "cat", size = "sm", className = "" }: { type?: PetType; size?: "sm" | "md" | "lg"; className?: string }) {
  const emojiMap: Record<PetType, string> = {
    cat: "🐱",
    dog: "🐶",
    bunny: "🐰",
    dragon: "🐲",
  };

  const sizeClass = size === "sm" ? "w-10 h-10 text-2xl" : size === "md" ? "w-14 h-14 text-3xl" : "w-20 h-20 text-4xl";

  return (
    <div className={`flex items-center justify-center rounded-xl bg-white/80 dark:bg-gray-800/80 shadow-kawaii ${sizeClass} ${className}`}>
      <span aria-hidden className="select-none">{emojiMap[type]}</span>
    </div>
  );
}
