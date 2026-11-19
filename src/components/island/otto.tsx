"use client";

/** Thuyền trưởng Rái (rái cá đội mũ thuyền trưởng) — ảnh đại diện 2D. */
export function OttoAvatar({ size = 56 }: { size?: number }) {
  const O = "#4A3222";
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden className="shrink-0">
      <circle cx="50" cy="50" r="48" fill="#D7ECF5" stroke={O} strokeWidth="3" />
      <circle cx="26" cy="44" r="8" fill="#A8775A" stroke={O} strokeWidth="2.5" />
      <circle cx="74" cy="44" r="8" fill="#A8775A" stroke={O} strokeWidth="2.5" />
      <ellipse cx="50" cy="60" rx="28" ry="26" fill="#A8775A" stroke={O} strokeWidth="3" />
      <ellipse cx="50" cy="70" rx="17" ry="12" fill="#F2DCC4" />
      <circle cx="40" cy="58" r="3.6" fill={O} />
      <circle cx="60" cy="58" r="3.6" fill={O} />
      <circle cx="41.2" cy="56.8" r="1.2" fill="#fff" />
      <circle cx="61.2" cy="56.8" r="1.2" fill="#fff" />
      <ellipse cx="50" cy="66" rx="4.5" ry="3" fill={O} />
      <path d="M44 72 q6 5 12 0" fill="none" stroke={O} strokeWidth="2" strokeLinecap="round" />
      <path d="M30 68 h-9 M30 72 h-8 M70 68 h9 M70 72 h8" stroke={O} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M28 38 C28 22 72 22 72 38 Z" fill="#FFFFFF" stroke={O} strokeWidth="3" strokeLinejoin="round" />
      <rect x="26" y="35" width="48" height="7" rx="3" fill="#2B4C7E" stroke={O} strokeWidth="2.5" />
      <path d="M36 42 q14 8 28 0" fill="#2B4C7E" stroke={O} strokeWidth="2.5" />
      <circle cx="50" cy="30" r="4" fill="#F2C14E" stroke={O} strokeWidth="1.5" />
    </svg>
  );
}
