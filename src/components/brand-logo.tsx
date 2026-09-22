"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
  clickable?: boolean;
  className?: string;
}

export function BrandLogoIcon({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const imgPx = {
    sm: 32,
    md: 40,
    lg: 48,
  };

  return (
    <div
      className={cn(
        sizeMap[size],
        "relative rounded-2xl flex items-center justify-center flex-shrink-0 select-none overflow-hidden",
        "bg-white dark:bg-slate-900",
        "border-2 border-rose-200/90 dark:border-rose-900/80 ring-2 ring-pink-400/25",
        "shadow-[0_4px_14px_-2px_rgba(244,114,182,0.4)] dark:shadow-[0_4px_18px_-2px_rgba(244,114,182,0.25)]",
        "transition-all duration-300 group-hover:scale-108 group-hover:rotate-3 group-hover:shadow-[0_6px_22px_-2px_rgba(244,114,182,0.55)]",
        className
      )}
    >
      <Image
        src="/mascot-logo.png"
        alt="TranTech Talk Mascot"
        width={imgPx[size]}
        height={imgPx[size]}
        className="w-full h-full object-cover scale-105"
        priority
      />
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
