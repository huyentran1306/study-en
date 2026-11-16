// Cảnh hội thoại 1280×800: nền + nhân vật + tiền cảnh (quầy).
// Quán Miso và Sân Bay Mây dùng nguyên hình trong design; Chợ, Hồ Kero, Cây Anh Đào vẽ theo cùng phong cách.
import type { ReactNode } from "react";
import type { NpcId, SceneId } from "@/lib/island/curriculum";
import { AIRPORT_BG, AIRPORT_FG, CAFE_BG, CAFE_FG } from "./art";
import { Character, type Mood } from "./character";

const S = "#4A3222";

const LAYOUT: Record<SceneId, { npc: [number, number, number]; bo: [number, number, number] }> = {
  cafe: { npc: [800, 262, 150], bo: [292, 330, 176] },
  airport: { npc: [830, 186, 130], bo: [300, 330, 170] },
  market: { npc: [830, 262, 150], bo: [292, 330, 176] },
  pond: { npc: [840, 318, 150], bo: [292, 330, 176] },
  tree: { npc: [800, 336, 160], bo: [330, 346, 170] },
};

function Raw({ html }: { html: string }) {
  return <g dangerouslySetInnerHTML={{ __html: html }} />;
}

function MarketBg() {
  return (
    <g>
      <rect width="1280" height="800" fill="#DDF0F5" />
      <g className="drift">
        <ellipse cx="200" cy="90" rx="60" ry="20" fill="#fff" />
        <ellipse cx="230" cy="76" rx="30" ry="20" fill="#fff" />
      </g>
      <g style={{ animation: "drift 14s ease-in-out infinite reverse" }}>
        <ellipse cx="1040" cy="70" rx="56" ry="18" fill="#fff" />
        <ellipse cx="1010" cy="60" rx="26" ry="18" fill="#fff" />
      </g>
      {[60, 170, 300, 1180, 1250].map((x, i) => (
        <g key={i} transform={`translate(${x} ${300 + (i % 2) * 20})`}>
          <g className="tree" style={{ animationDelay: `-${i}s` }}>
            <rect x="-7" y="20" width="14" height="26" rx="4" fill="#8B5E3C" stroke={S} strokeWidth="2.5" />
            <circle r="44" fill="#5E9B4C" stroke={S} strokeWidth="3" />
            <circle cx="-10" cy="-8" r="28" fill="#74B05A" />
          </g>
        </g>
      ))}
      <rect y="360" width="1280" height="440" fill="#9CCB6A" />
      <path d="M0 360 Q320 330 640 360 T1280 356 V380 H0 Z" fill="#86B856" />
      <ellipse cx="380" cy="640" rx="230" ry="42" fill="#86B856" />
      <path d="M0 470 Q640 430 1280 470" fill="none" stroke="#EBD5A2" strokeWidth="70" strokeLinecap="round" />
      {/* Cột và mái sọc của sạp */}
      <rect x="640" y="150" width="16" height="300" fill="#8B5E3C" stroke={S} strokeWidth="3" />
      <rect x="1214" y="150" width="16" height="300" fill="#8B5E3C" stroke={S} strokeWidth="3" />
      <g stroke={S} strokeWidth="3" strokeLinejoin="round">
        {Array.from({ length: 8 }).map((_, i) => (
          <path key={i} d={`M${620 + i * 80} 120 h80 v70 q-40 26 -80 0 z`} fill={i % 2 ? "#FFFFFF" : "#F4B6C2"} />
        ))}
      </g>
      <rect x="610" y="104" width="660" height="22" rx="8" fill="#E89AAD" stroke={S} strokeWidth="3" />
      {/* Cờ dây */}
      <path d="M40 60 Q300 120 560 70" fill="none" stroke={S} strokeWidth="2" />
      {[90, 170, 250, 330, 410, 490].map((x, i) => (
        <path key={x} d={`M${x} ${74 + Math.sin(i) * 8 + i * 3} l14 28 l14 -26 z`} fill={["#F2C14E", "#F4B6C2", "#8CC56A", "#9BD6E6"][i % 4]} stroke={S} strokeWidth="2" />
      ))}
      {/* Biển giá */}
      <g transform="translate(1110 220)">
        <rect width="96" height="64" rx="10" fill="#3E5A47" stroke="#8B5E3C" strokeWidth="6" />
        <text x="48" y="42" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="24" fill="#FFF9EE">$2</text>
      </g>
    </g>
  );
}

function MarketFg() {
  return (
    <g>
      <rect x="620" y="440" width="640" height="150" rx="8" fill="#A86A4A" stroke={S} strokeWidth="3" />
      <g fill="#B97B57" stroke={S} strokeWidth="2.5">
        <rect x="644" y="466" width="180" height="98" rx="8" />
        <rect x="844" y="466" width="180" height="98" rx="8" />
        <rect x="1044" y="466" width="190" height="98" rx="8" />
      </g>
      <rect x="606" y="420" width="668" height="26" rx="6" fill="#C9925C" stroke={S} strokeWidth="3" />
      {/* Thùng cà rốt */}
      <g transform="translate(650 360)">
        <rect width="150" height="62" rx="6" fill="#C9925C" stroke={S} strokeWidth="3" />
        {[18, 46, 74, 102, 130].map((x) => (
          <g key={x}>
            <path d={`M${x - 10} 6 L${x} 54 L${x + 10} 6 Z`} fill="#F29A4E" stroke={S} strokeWidth="2.5" strokeLinejoin="round" transform={`rotate(180 ${x} 10)`} />
            <path d={`M${x} -2 q-8 -14 -2 -22 M${x} -2 q8 -14 2 -22`} stroke="#5E9B4C" strokeWidth="4" strokeLinecap="round" fill="none" />
          </g>
        ))}
      </g>
      {/* Thùng táo */}
      <g transform="translate(1080 370)">
        <rect width="140" height="52" rx="6" fill="#C9925C" stroke={S} strokeWidth="3" />
        {[24, 58, 92, 122, 40, 76, 108].map((x, i) => (
          <circle key={i} cx={x} cy={i < 4 ? 4 : -14} r="16" fill="#E86F5A" stroke={S} strokeWidth="2.5" />
        ))}
      </g>
    </g>
  );
}

function PondBg() {
  return (
    <g>
      <rect width="1280" height="800" fill="#DDF0F5" />
      <g className="drift">
        <ellipse cx="560" cy="80" rx="64" ry="20" fill="#fff" />
        <ellipse cx="590" cy="66" rx="30" ry="20" fill="#fff" />
      </g>
      {[80, 210, 1000, 1130, 1240].map((x, i) => (
        <g key={i} transform={`translate(${x} ${250 + (i % 2) * 24})`}>
          <g className="tree" style={{ animationDelay: `-${i * 0.7}s` }}>
            <rect x="-7" y="20" width="14" height="30" rx="4" fill="#8B5E3C" stroke={S} strokeWidth="2.5" />
            <circle r="48" fill={i === 3 ? "#F4B6C2" : "#5E9B4C"} stroke={S} strokeWidth="3" />
            <circle cx="-12" cy="-10" r="30" fill={i === 3 ? "#F7C9D2" : "#74B05A"} />
          </g>
        </g>
      ))}
      <rect y="320" width="1280" height="480" fill="#9CCB6A" />
      <path d="M0 320 Q400 296 800 322 T1280 316 V340 H0 Z" fill="#86B856" />
      {/* Hồ */}
      <ellipse cx="560" cy="640" rx="430" ry="130" fill="#7DBFD3" stroke="#6AA8BC" strokeWidth="8" />
      <ellipse cx="560" cy="634" rx="404" ry="112" fill="#9BD6E6" />
      <ellipse className="ripple" cx="420" cy="620" rx="40" ry="14" fill="none" stroke="#fff" strokeWidth="3" />
      <ellipse className="ripple" cx="700" cy="660" rx="34" ry="12" fill="none" stroke="#fff" strokeWidth="3" style={{ animationDelay: "1.4s" }} />
      {[
        [300, 600],
        [620, 700],
        [820, 610],
        [480, 690],
      ].map(([x, y], i) => (
        <g key={i}>
          <path d={`M${x} ${y} a26 16 0 1 0 30 -8 l-16 8z`} fill="#6FAE4F" stroke={S} strokeWidth="2.5" />
          {i % 2 === 0 && <circle cx={x + 10} cy={y - 8} r="8" fill="#F4B6C2" stroke={S} strokeWidth="2" />}
        </g>
      ))}
      {/* Cây cói */}
      {[170, 196, 960, 986].map((x, i) => (
        <g key={x}>
          <path d={`M${x} 600 V${520 - (i % 2) * 20}`} stroke="#5E9B4C" strokeWidth="5" strokeLinecap="round" />
          <rect x={x - 6} y={500 - (i % 2) * 20} width="12" height="34" rx="6" fill="#8B5E3C" stroke={S} strokeWidth="2" />
        </g>
      ))}
      {/* Cầu gỗ */}
      <g stroke={S} strokeWidth="3">
        <rect x="900" y="520" width="200" height="34" rx="6" fill="#C9925C" />
        <path d="M940 520 V554 M980 520 V554 M1020 520 V554 M1060 520 V554" />
        <rect x="910" y="554" width="12" height="40" fill="#8B5E3C" />
        <rect x="1076" y="554" width="12" height="40" fill="#8B5E3C" />
      </g>
      {/* Biển chỉ đường */}
      <g transform="translate(1150 330)">
        <rect x="-6" y="0" width="12" height="150" rx="4" fill="#8B5E3C" stroke={S} strokeWidth="3" />
        <path d="M-80 20 H50 L68 38 L50 56 H-80 Z" fill="#FBF0D9" stroke={S} strokeWidth="3" strokeLinejoin="round" />
        <text x="-14" y="46" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="20" fill={S}>CAFÉ</text>
        <path d="M80 70 H-50 L-68 88 L-50 106 H80 Z" fill="#FBF0D9" stroke={S} strokeWidth="3" strokeLinejoin="round" />
        <text x="14" y="96" textAnchor="middle" fontFamily="Baloo 2, sans-serif" fontWeight="800" fontSize="20" fill={S}>MARKET</text>
      </g>
    </g>
  );
}

function TreeBg() {
  return (
    <g>
      <rect width="1280" height="800" fill="#E3F2F7" />
      <g className="drift">
        <ellipse cx="180" cy="100" rx="64" ry="20" fill="#fff" />
        <ellipse cx="210" cy="86" rx="30" ry="20" fill="#fff" />
      </g>
      <rect y="380" width="1280" height="420" fill="#9CCB6A" />
      <path d="M0 380 Q320 352 640 380 T1280 372 V396 H0 Z" fill="#86B856" />
      {/* Cây anh đào lớn */}
      <path d="M600 420 Q610 300 625 230 L655 230 Q670 300 680 420 Q660 410 640 414 Q620 410 600 420 Z" fill="#8B5E3C" stroke={S} strokeWidth="3" strokeLinejoin="round" />
      <g className="sakura">
        <circle cx="500" cy="220" r="80" fill="#E89AAD" stroke={S} strokeWidth="3" />
        <circle cx="790" cy="214" r="86" fill="#E89AAD" stroke={S} strokeWidth="3" />
        <circle cx="560" cy="140" r="100" fill="#F4B6C2" stroke={S} strokeWidth="3" />
        <circle cx="730" cy="130" r="104" fill="#F4B6C2" stroke={S} strokeWidth="3" />
        <circle cx="640" cy="80" r="92" fill="#F4B6C2" stroke={S} strokeWidth="3" />
        <circle cx="640" cy="220" r="96" fill="#F4B6C2" />
        <circle cx="580" cy="196" r="70" fill="#F4B6C2" />
        <circle cx="710" cy="196" r="70" fill="#F4B6C2" />
        <circle cx="610" cy="70" r="36" fill="#F7C9D2" />
        <circle cx="520" cy="130" r="30" fill="#F7C9D2" />
        <circle cx="740" cy="100" r="34" fill="#F7C9D2" />
        <circle cx="600" cy="230" r="6" fill="#fff" className="sparkle" />
        <circle cx="720" cy="170" r="5" fill="#fff" className="sparkle" style={{ animationDelay: ".6s" }} />
      </g>
      {/* Đèn lồng */}
      {[
        [470, 270],
        [810, 266],
        [690, 290],
      ].map(([x, y], i) => (
        <g key={i} className="lamp" style={{ transformOrigin: `${x}px ${y - 40}px`, animationDelay: `-${i}s` }}>
          <path d={`M${x} ${y - 40} V${y - 14}`} stroke={S} strokeWidth="2" />
          <rect x={x - 16} y={y - 14} width="32" height="40" rx="12" fill="#F2C14E" stroke={S} strokeWidth="2.5" />
          <ellipse cx={x} cy={y + 6} rx="22" ry="26" fill="#F2C14E" opacity="0.25" className="glow" />
        </g>
      ))}
      {/* Khăn picnic */}
      <g transform="translate(640 600)">
        <path d="M-430 -40 L380 -40 L460 110 L-500 110 Z" fill="#FFF4F6" stroke={S} strokeWidth="3" strokeLinejoin="round" />
        <g fill="#F4B6C2" opacity="0.85">
          {Array.from({ length: 10 }).map((_, i) => (
            <path key={i} d={`M${-430 + i * 81} -40 L${-430 + i * 81 + 40} -40 L${-500 + i * 96 + 48} 110 L${-500 + i * 96} 110 Z`} />
          ))}
        </g>
        {/* Giỏ picnic */}
        <g transform="translate(-30 -10)">
          <path d="M-40 0 H40 L32 46 H-32 Z" fill="#C9925C" stroke={S} strokeWidth="3" strokeLinejoin="round" />
          <path d="M-30 0 Q0 -40 30 0" fill="none" stroke={S} strokeWidth="4" />
        </g>
        <g transform="translate(70 10)">
          <rect x="-14" y="-6" width="28" height="30" rx="5" fill="#FFF9EE" stroke={S} strokeWidth="2.5" />
          <path d="M-20 34 h40 l-6 -10 h-28 z" fill="#F7C9D2" stroke={S} strokeWidth="2" />
        </g>
      </g>
    </g>
  );
}

function Petals() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      {[12, 30, 48, 66, 84].map((l, i) => (
        <span key={l} className="petal" style={{ left: `${l}%`, top: 0, background: i % 2 ? "#F7C9D2" : "#F4B6C2", animationDelay: `${i * 1.6}s`, animationDuration: `${7 + i}s` }} />
      ))}
    </div>
  );
}

const pct = (v: number, of: number) => `${(v / of) * 100}%`;

export function Scene({
  scene,
  npc,
  npcMood = "idle",
  boMood = "idle",
  showBo = true,
  children,
  className = "",
}: {
  scene: SceneId;
  npc: NpcId;
  npcMood?: Mood;
  boMood?: Mood;
  showBo?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  const L = LAYOUT[scene];
  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={{ aspectRatio: "1280 / 800" }}>
      <svg viewBox="0 0 1280 800" className="absolute inset-0 w-full h-full" aria-hidden="true">
        {scene === "cafe" && <Raw html={CAFE_BG} />}
        {scene === "airport" && <Raw html={AIRPORT_BG} />}
        {scene === "market" && <MarketBg />}
        {scene === "pond" && <PondBg />}
        {scene === "tree" && <TreeBg />}
      </svg>
      <div className="absolute" style={{ left: pct(L.npc[0], 1280), top: pct(L.npc[1], 800), width: pct(L.npc[2], 1280) }}>
        <Character who={npc} mood={npcMood} size="100%" delay={0.2} />
      </div>
      {(scene === "cafe" || scene === "airport" || scene === "market") && (
        <svg viewBox="0 0 1280 800" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
          {scene === "cafe" && <Raw html={CAFE_FG} />}
          {scene === "airport" && <Raw html={AIRPORT_FG} />}
          {scene === "market" && <MarketFg />}
        </svg>
      )}
      {showBo && (
        <div className="absolute" style={{ left: pct(L.bo[0], 1280), top: pct(L.bo[1], 800), width: pct(L.bo[2], 1280) }}>
          <Character who="bo" mood={boMood} size="100%" delay={0.4} />
        </div>
      )}
      {scene === "tree" && <Petals />}
      {children}
    </div>
  );
}
