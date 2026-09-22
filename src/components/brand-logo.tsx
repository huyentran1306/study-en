"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
  clickable?: boolean;
  className?: string;
}

export function BrandLogoIcon({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeMap = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  };

  return (
    <div
      className={cn(
        sizeMap[size],
        "relative rounded-2xl flex items-center justify-center flex-shrink-0 select-none",
        "bg-gradient-to-br from-rose-400 via-pink-400 to-indigo-400",
        "shadow-[0_4px_16px_-2px_rgba(244,114,182,0.45)] dark:shadow-[0_4px_20px_-2px_rgba(244,114,182,0.3)]",
        "border border-white/60 dark:border-pink-300/30",
        "transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 group-hover:shadow-[0_6px_22px_-2px_rgba(244,114,182,0.6)]",
        className
      )}
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full p-1.5 drop-shadow-sm"
      >
        <defs>
          <radialGradient
            id="pearlCore"
            cx="35%"
            cy="35%"
            r="65%"
            fx="30%"
            fy="30%"
          >
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#FFF1F2" />
            <stop offset="100%" stopColor="#FCE7F3" />
          </radialGradient>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Soft upper glossy glass reflection */}
        <path
          d="M6 13C6 8.5 9.5 5 14 5H26C30.5 5 34 8.5 34 13V15C34 15 26 18 20 18C14 18 6 15 6 15V13Z"
          fill="white"
          fillOpacity="0.22"
        />

        {/* Delicate Blooming 4-Petal Star / Pearl Blossom */}
        <path
          d="M20 7.5C20 13 14.5 18.5 9 18.5C14.5 18.5 20 24 20 29.5C20 24 25.5 18.5 31 18.5C25.5 18.5 20 13 20 7.5Z"
          fill="white"
          fillOpacity="0.95"
          filter="url(#softGlow)"
        />

        {/* Radiant Inner Pearl Gem */}
        <circle
          cx="20"
          cy="18.5"
          r="3.2"
          fill="url(#pearlCore)"
          className="drop-shadow-xs"
        />
        <circle
          cx="19.2"
          cy="17.7"
          r="1"
          fill="white"
        />

        {/* Cute Sweet Sparkle (Top-Right) */}
        <path
          d="M30 6.5C30 8.2 28.8 9.5 27 9.5C28.8 9.5 30 10.8 30 12.5C30 10.8 31.2 9.5 33 9.5C31.2 9.5 30 8.2 30 6.5Z"
          fill="#FFFDF0"
          fillOpacity="0.95"
        />

        {/* Gentle Dew Sparkle Dot (Bottom-Left) */}
        <circle cx="11.5" cy="27.5" r="1.2" fill="white" fillOpacity="0.85" />
      </svg>
    </div>
  );
}

export function BrandLogo({
  size = "md",
  showBadge = true,
  clickable = true,
  className,
}: BrandLogoProps) {
  const content = (
    <div className={cn("flex items-center gap-2.5 group flex-shrink-0 select-none", className)}>
      <BrandLogoIcon size={size} />

      <div className="flex items-center gap-2">
        <span className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center">
          TranTech
          <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500 bg-clip-text text-transparent font-extrabold ml-1">
            Talk
          </span>
        </span>

        {showBadge && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/50 dark:to-pink-950/50 text-rose-600 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800/60 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            Studio
          </span>
        )}
      </div>
    </div>
  );

  if (!clickable) return content;

  return (
    <Link href="/" className="inline-flex items-center focus:outline-none">
      {content}
    </Link>
  );
}
