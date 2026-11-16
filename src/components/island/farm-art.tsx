"use client";

import type { FarmKind } from "@/lib/island/state";

const O = "#4A3222";

/** Tôm, cua, tôm hùm kiểu dễ thương, cùng nét viền với cư dân đảo. */
export function SeaCreature({ kind, className = "" }: { kind: FarmKind; className?: string }) {
  if (kind === "shrimp")
    return (
      <svg viewBox="0 0 100 80" className={`w-full h-auto overflow-visible ${className}`}>
        <g className="ch-bob">
          <path d="M70 22 C88 10 98 26 92 40" fill="none" stroke={O} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M66 20 C80 4 96 10 96 22" fill="none" stroke={O} strokeWidth="2" strokeLinecap="round" />
          <path d="M18 58 L6 70 L22 66 L16 76 L28 64 Z" fill="#F7A072" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M24 60 C20 36 40 18 62 20 C80 22 84 40 72 50 C60 60 40 66 24 60 Z" fill="#F7A072" stroke={O} strokeWidth="3" strokeLinejoin="round" />
          <path d="M40 30 C44 40 44 50 40 58 M52 26 C56 36 56 48 52 56" fill="none" stroke="#E07A45" strokeWidth="2.5" strokeLinecap="round" />
          {[44, 54, 62].map((x) => (
            <path key={x} d={`M${x} 56 l-3 10`} stroke={O} strokeWidth="2.5" strokeLinecap="round" />
          ))}
          <g className="ch-eyes">
            <circle cx="68" cy="32" r="4" fill={O} />
            <circle cx="69.4" cy="30.6" r="1.3" fill="#fff" />
          </g>
          <ellipse cx="74" cy="42" rx="4" ry="2.4" fill="#F06292" opacity=".45" />
        </g>
      </svg>
    );
  if (kind === "crab")
    return (
      <svg viewBox="0 0 110 84" className={`w-full h-auto overflow-visible ${className}`}>
        <g className="ch-bob">
          {[-1, 1].map((d) => (
            <g key={d}>
              {[0, 1, 2].map((i) => (
                <path key={i} d={`M${55 + d * 26} ${52 + i * 6} l${d * 16} ${4 + i * 3}`} stroke={O} strokeWidth="3" strokeLinecap="round" />
              ))}
              <path d={`M${55 + d * 22} 40 L${55 + d * 36} 24`} stroke={O} strokeWidth="3" strokeLinecap="round" />
              <path d={`M${55 + d * 36} 26 C${55 + d * 52} 22 ${55 + d * 50} 4 ${55 + d * 36} 8 L${55 + d * 42} 16 Z`} fill="#E86F5A" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
            </g>
          ))}
          <ellipse cx="55" cy="50" rx="30" ry="20" fill="#E86F5A" stroke={O} strokeWidth="3" />
          <path d="M45 34 V24 M65 34 V24" stroke={O} strokeWidth="2.5" />
          <g className="ch-eyes">
            <circle cx="45" cy="22" r="4.5" fill="#fff" stroke={O} strokeWidth="2.5" />
            <circle cx="65" cy="22" r="4.5" fill="#fff" stroke={O} strokeWidth="2.5" />
            <circle cx="45.5" cy="22.5" r="2" fill={O} />
            <circle cx="65.5" cy="22.5" r="2" fill={O} />
          </g>
          <path d="M48 54 q7 6 14 0" fill="none" stroke={O} strokeWidth="2.5" strokeLinecap="round" />
          <ellipse cx="38" cy="50" rx="4.5" ry="2.6" fill="#F4B6C2" opacity=".8" />
          <ellipse cx="72" cy="50" rx="4.5" ry="2.6" fill="#F4B6C2" opacity=".8" />
        </g>
      </svg>
    );
  return (
    <svg viewBox="0 0 120 90" className={`w-full h-auto overflow-visible ${className}`}>
      <g className="ch-bob">
        <path d="M78 34 C98 18 112 28 112 40" fill="none" stroke={O} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M20 66 L6 80 L24 74 L18 86 L32 72 Z" fill="#B5473A" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M26 68 C20 44 44 30 70 32 C90 34 94 50 82 58 C68 68 44 74 26 68 Z" fill="#C8553D" stroke={O} strokeWidth="3" strokeLinejoin="round" />
        <path d="M44 40 C48 50 48 60 44 68 M58 36 C62 46 62 58 58 66" fill="none" stroke="#9E3A2C" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M74 36 L86 18" stroke={O} strokeWidth="3" strokeLinecap="round" />
        <path d="M86 20 C100 16 102 0 88 2 L92 10 Z" fill="#C8553D" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M80 56 L96 64" stroke={O} strokeWidth="3" strokeLinecap="round" />
        <path d="M96 62 C112 66 116 82 102 82 L100 72 Z" fill="#C8553D" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
        <g className="ch-eyes">
          <circle cx="76" cy="42" r="4" fill={O} />
          <circle cx="77.4" cy="40.6" r="1.3" fill="#fff" />
        </g>
        <path d="M14 22 l3 -6 l3 6 l6 3 l-6 3 l-3 6 l-3 -6 l-6 -3 z" className="sparkle" fill="#F2C14E" stroke={O} strokeWidth="1.5" />
      </g>
    </svg>
  );
}
