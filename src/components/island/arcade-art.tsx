"use client";

// Hình cho mini game ở Đảo Cát Vui: các bậc sinh vật biển (Ghép sinh vật biển) và rau quả (Ghép 3 vườn rau).
// Cùng nét viền nâu, màu pastel như cư dân đảo.
import { SeaCreature } from "./farm-art";

const O = "#4A3222";
const SW = 3;

function Eye({ x, y, r = 4 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={O} />
      <circle cx={x + r * 0.35} cy={y - r * 0.35} r={r * 0.32} fill="#fff" />
    </g>
  );
}
function Blush({ x, y }: { x: number; y: number }) {
  return <ellipse cx={x} cy={y} rx="5" ry="3" fill="#F06292" opacity=".4" />;
}

export interface SeaTier {
  en: string;
  vi: string;
  bg: string;
}

/** Các bậc ghép: hai con cùng bậc gộp thành bậc kế tiếp. */
export const SEA_TIERS: SeaTier[] = [
  { en: "clam", vi: "con sò", bg: "#FBEFE2" },
  { en: "sea snail", vi: "con ốc", bg: "#F7E4D0" },
  { en: "shrimp", vi: "con tôm", bg: "#FCD9C2" },
  { en: "crab", vi: "con cua", bg: "#F8C8BE" },
  { en: "fish", vi: "con cá", bg: "#CDE8F4" },
  { en: "squid", vi: "con mực", bg: "#E3DAF5" },
  { en: "lobster", vi: "tôm hùm", bg: "#F3B9A8" },
  { en: "sea turtle", vi: "rùa biển", bg: "#CFE8C4" },
  { en: "octopus", vi: "bạch tuộc", bg: "#F5C6DA" },
  { en: "whale", vi: "cá voi", bg: "#BFD9F2" },
  { en: "rainbow pearl", vi: "ngọc trai cầu vồng", bg: "#FFF1B8" },
];

export function SeaTierArt({ tier }: { tier: number }) {
  switch (tier) {
    case 0:
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M20 66 C18 36 40 20 50 20 C60 20 82 36 80 66 Z" fill="#F4B6C2" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          {[32, 41, 50, 59, 68].map((x) => (
            <path key={x} d={`M50 64 L${x} ${x === 50 ? 24 : 30}`} stroke="#E07A93" strokeWidth="2.5" strokeLinecap="round" />
          ))}
          <rect x="38" y="64" width="24" height="10" rx="4" fill="#E89AAD" stroke={O} strokeWidth={SW} />
          <Eye x={42} y={50} r={3.4} />
          <Eye x={58} y={50} r={3.4} />
        </svg>
      );
    case 1:
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M14 72 C20 62 36 60 52 64 L84 72 C88 76 84 80 78 80 L20 80 C14 80 12 76 14 72 Z" fill="#B8D98C" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          <circle cx="52" cy="48" r="24" fill="#F2C14E" stroke={O} strokeWidth={SW} />
          <path d="M52 48 m-12 0 a12 12 0 1 1 12 12 a7 7 0 1 1 -6 -9" fill="none" stroke="#C99A1E" strokeWidth="3" strokeLinecap="round" />
          <path d="M80 72 L86 56 M76 72 L78 56" stroke={O} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="86" cy="54" r="3" fill={O} />
          <circle cx="78" cy="54" r="3" fill={O} />
        </svg>
      );
    case 2:
      return (
        <div className="w-full h-full flex items-center justify-center p-[8%]">
          <SeaCreature kind="shrimp" />
        </div>
      );
    case 3:
      return (
        <div className="w-full h-full flex items-center justify-center p-[6%]">
          <SeaCreature kind="crab" />
        </div>
      );
    case 4:
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M70 50 L90 34 L88 66 Z" fill="#4E9FD1" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          <ellipse cx="46" cy="50" rx="32" ry="22" fill="#6FC1DA" stroke={O} strokeWidth={SW} />
          <path d="M40 30 C46 22 56 24 58 30" fill="#4E9FD1" stroke={O} strokeWidth="2.5" />
          <path d="M50 42 C56 48 56 54 50 60" fill="none" stroke="#4E9FD1" strokeWidth="2.5" strokeLinecap="round" />
          <Eye x={28} y={46} />
          <Blush x={30} y={58} />
          <path d="M16 54 q4 3 8 0" fill="none" stroke={O} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 5:
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M50 8 L72 34 L66 60 L34 60 L28 34 Z" fill="#B49AE0" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          {[30, 40, 50, 60, 70].map((x, i) => (
            <path key={x} d={`M${x} 60 C${x + (i % 2 ? 4 : -4)} 74 ${x + (i % 2 ? -4 : 4)} 82 ${x} 92`} fill="none" stroke="#8E6FC8" strokeWidth="5" strokeLinecap="round" />
          ))}
          <Eye x={42} y={46} />
          <Eye x={58} y={46} />
          <Blush x={38} y={54} />
          <Blush x={62} y={54} />
        </svg>
      );
    case 6:
      return (
        <div className="w-full h-full flex items-center justify-center p-[4%]">
          <SeaCreature kind="lobster" />
        </div>
      );
    case 7:
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <ellipse cx="22" cy="64" rx="9" ry="6" fill="#9CCB6A" stroke={O} strokeWidth="2.5" />
          <ellipse cx="78" cy="64" rx="9" ry="6" fill="#9CCB6A" stroke={O} strokeWidth="2.5" />
          <circle cx="82" cy="40" r="11" fill="#9CCB6A" stroke={O} strokeWidth={SW} />
          <path d="M14 58 C14 30 34 20 50 20 C66 20 76 34 76 58 Z" fill="#6FAE4F" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          <path d="M34 30 L44 42 L56 42 L64 30 M44 42 L40 56 M56 42 L60 56" fill="none" stroke="#3F7A34" strokeWidth="2.5" strokeLinejoin="round" />
          <rect x="12" y="56" width="66" height="8" rx="4" fill="#B8D98C" stroke={O} strokeWidth="2.5" />
          <Eye x={85} y={38} r={3} />
        </svg>
      );
    case 8:
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {[18, 32, 46, 60, 74].map((x) => (
            <path key={x} d={`M${x + 4} 56 C${x - 6} 70 ${x + 8} 78 ${x} 90`} fill="none" stroke="#E07A93" strokeWidth="7" strokeLinecap="round" />
          ))}
          <path d="M18 58 C14 26 32 10 50 10 C68 10 86 26 82 58 Z" fill="#F29BB5" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          <Eye x={40} y={40} r={4.5} />
          <Eye x={60} y={40} r={4.5} />
          <Blush x={34} y={50} />
          <Blush x={66} y={50} />
          <path d="M46 50 q4 4 8 0" fill="none" stroke={O} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 9:
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M44 20 C44 10 50 8 50 16 C50 8 56 10 56 20" fill="none" stroke="#6FC1DA" strokeWidth="3" strokeLinecap="round" />
          <path d="M84 52 L96 38 L94 62 Z" fill="#4E7FB8" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          <path d="M8 56 C8 34 28 24 50 24 C72 24 86 38 86 56 C86 72 70 80 48 80 C24 80 8 72 8 56 Z" fill="#6E9BD6" stroke={O} strokeWidth={SW} />
          <path d="M14 62 C30 74 66 76 82 62 C78 74 64 80 48 80 C30 80 18 74 14 62 Z" fill="#DCEBFA" />
          <Eye x={28} y={50} />
          <Blush x={30} y={60} />
          <path d="M54 62 q8 6 16 0" fill="none" stroke={O} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <radialGradient id="pearl" cx="38%" cy="34%" r="70%">
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset=".45" stopColor="#FFE3F0" />
              <stop offset=".75" stopColor="#D8E8FF" />
              <stop offset="1" stopColor="#E7D6FF" />
            </radialGradient>
          </defs>
          <path d="M14 76 C14 56 30 50 50 50 C70 50 86 56 86 76 Z" fill="#F4B6C2" stroke={O} strokeWidth={SW} />
          <circle cx="50" cy="44" r="24" fill="url(#pearl)" stroke={O} strokeWidth={SW} />
          <path d="M38 34 a14 14 0 0 1 12 -6" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" />
          {[
            [18, 22],
            [82, 26],
            [84, 58],
          ].map(([x, y]) => (
            <path key={x} d={`M${x} ${y - 6} l2 4 l4 2 l-4 2 l-2 4 l-2 -4 l-4 -2 l4 -2 z`} fill="#F2C14E" stroke={O} strokeWidth="1.5" />
          ))}
        </svg>
      );
  }
}

/** Rác bị sóng đánh vào bảng (chai nhựa): không gộp được, dọn bằng cách gộp con bên cạnh. */
export function TrashArt() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <path d="M40 14 H60 V24 H40 Z" fill="#4E9FD1" stroke={O} strokeWidth={SW} />
      <path d="M38 24 H62 C70 34 70 40 70 46 V82 C70 86 66 88 62 88 H38 C34 88 30 86 30 82 V46 C30 40 30 34 38 24 Z" fill="#DDF1F7" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      <rect x="30" y="52" width="40" height="16" fill="#9FD3E6" stroke={O} strokeWidth="2.5" />
      <path d="M40 34 V44" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

// ───────────── Rau quả (Ghép 3 vườn rau) ─────────────

export const PRODUCE = [
  { id: "carrot", en: "carrot", vi: "cà rốt", bg: "#FFE3CC" },
  { id: "tomato", en: "tomato", vi: "cà chua", bg: "#FFD6D0" },
  { id: "corn", en: "corn", vi: "bắp", bg: "#FFF1BF" },
  { id: "eggplant", en: "eggplant", vi: "cà tím", bg: "#E8DCF7" },
  { id: "strawberry", en: "strawberry", vi: "dâu tây", bg: "#FCD9E3" },
  { id: "cabbage", en: "cabbage", vi: "bắp cải", bg: "#DDF0D0" },
] as const;

export function ProduceArt({ kind }: { kind: number }) {
  switch (kind) {
    case 0:
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M50 30 C40 16 30 16 30 16 C36 22 42 28 46 32 M50 30 C52 14 58 8 58 8 C58 18 56 26 54 32 M50 30 C62 18 72 20 72 20 C64 26 58 30 54 34" fill="#6FAE4F" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M36 34 C44 28 60 28 66 36 C62 58 54 78 50 90 C44 76 38 56 36 34 Z" fill="#F29A4E" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          <path d="M42 46 h8 M46 60 h8 M48 72 h5" stroke="#C96A2B" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 1:
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="56" r="30" fill="#E8563F" stroke={O} strokeWidth={SW} />
          <path d="M50 28 L42 20 L48 30 L36 30 L48 34 L50 26 L52 34 L64 30 L52 30 L58 20 Z" fill="#6FAE4F" stroke={O} strokeWidth="2" strokeLinejoin="round" />
          <path d="M34 48 a14 14 0 0 1 10 -8" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".8" />
        </svg>
      );
    case 2:
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M50 10 C64 10 68 30 66 52 C64 72 58 84 50 86 C42 84 36 72 34 52 C32 30 36 10 50 10 Z" fill="#F2C94E" stroke={O} strokeWidth={SW} />
          {[22, 34, 46, 58, 70].map((y) => (
            <path key={y} d={`M38 ${y} H62`} stroke="#D9A92F" strokeWidth="2" />
          ))}
          <path d="M50 18 V80" stroke="#D9A92F" strokeWidth="2" />
          <path d="M34 54 C28 70 34 84 50 92 C42 80 40 66 42 56 Z M66 54 C72 70 66 84 50 92 C58 80 60 66 58 56 Z" fill="#7DBA5A" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
      );
    case 3:
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M44 22 C64 26 80 46 76 70 C72 88 50 92 38 80 C26 68 30 50 34 38 C36 30 38 24 44 22 Z" fill="#8457C0" stroke={O} strokeWidth={SW} />
          <path d="M34 26 C40 14 56 14 60 24 C52 22 46 26 44 32 C40 28 36 28 34 26 Z" fill="#6FAE4F" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M48 16 L50 8" stroke={O} strokeWidth="3" strokeLinecap="round" />
          <path d="M44 46 C42 56 44 66 50 72" stroke="#B49AE0" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 4:
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M24 38 C24 30 76 30 76 38 C76 60 62 84 50 88 C38 84 24 60 24 38 Z" fill="#E8456B" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          {[
            [38, 46],
            [50, 44],
            [62, 46],
            [44, 58],
            [56, 58],
            [50, 70],
          ].map(([x, y]) => (
            <ellipse key={`${x}${y}`} cx={x} cy={y} rx="2" ry="3" fill="#FFE7A8" />
          ))}
          <path d="M30 34 L40 22 L46 32 L50 18 L54 32 L60 22 L70 34 Z" fill="#6FAE4F" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="54" r="32" fill="#9CCB6A" stroke={O} strokeWidth={SW} />
          <path d="M50 24 C36 34 32 54 40 72 M50 24 C64 34 68 54 60 72 M50 24 V84" fill="none" stroke="#5E9E3E" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M24 50 C34 44 44 46 50 54 C56 46 66 44 76 50 C70 70 58 80 50 82 C42 80 30 70 24 50 Z" fill="#C4E39C" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
      );
  }
}
