"use client";

// Vườn của đảo: các con vật (heo, rồng, trâu) bấm vào sẽ kêu và nói tiếng Anh,
// và các món "xây đảo" mở dần theo cấp XP.
import { useEffect, useState } from "react";
import { Hammer, Lock, X } from "lucide-react";
import type { NpcId } from "@/lib/island/curriculum";
import { BUILDS, type BuildId } from "@/lib/island/drills";
import { speak } from "@/lib/island/speech";
import { sfx } from "@/lib/island/sfx";
import { cx } from "./ui";

const O = "#4A3222"; // màu viền
const P = (v: number, of: number) => `${(v / of) * 100}%`;

// ───────────── Con vật ─────────────

export type AnimalId = "pig" | "dragon" | "buffalo";

export const ANIMALS: { id: AnimalId; name: string; x: number; y: number; w: number; voice: NpcId; lines: { en: string; vi: string }[] }[] = [
  {
    id: "pig", name: "Heo Ủn", x: 470, y: 492, w: 74, voice: "mallow",
    lines: [
      { en: "Oink! I'm Un the pig. I love sweet potatoes!", vi: "Ụt ịt! Mình là heo Ủn. Mình mê khoai lang lắm!" },
      { en: "Do you want to play in the mud with me?", vi: "Bạn có muốn nghịch bùn với mình không?" },
      { en: "I'm a little hungry. What's for lunch?", vi: "Mình hơi đói. Trưa nay ăn gì nhỉ?" },
      { en: "Practice every day, and you'll get better. Oink!", vi: "Luyện mỗi ngày là sẽ giỏi lên. Ụt ịt!" },
    ],
  },
  {
    id: "dragon", name: "Rồng Bông", x: 792, y: 222, w: 92, voice: "pip",
    lines: [
      { en: "Hi! I'm Bong, a baby dragon. I can fly... a little!", vi: "Chào! Mình là rồng con Bông. Mình bay được... một chút!" },
      { en: "Don't worry, I only breathe warm air. No fire!", vi: "Đừng lo, mình chỉ thổi hơi ấm thôi. Không có lửa đâu!" },
      { en: "Mistakes are okay. Even dragons fall sometimes.", vi: "Sai cũng không sao. Rồng cũng có lúc bị ngã mà." },
      { en: "Wow, your English is getting better every day!", vi: "Oa, tiếng Anh của bạn mỗi ngày một tốt hơn!" },
    ],
  },
  {
    id: "buffalo", name: "Trâu Mộc", x: 676, y: 540, w: 104, voice: "kero",
    lines: [
      { en: "Moo... I'm Moc the buffalo. Slow and steady wins the race.", vi: "Ò... Mình là trâu Mộc. Chậm mà chắc." },
      { en: "I work in the rice field every morning.", vi: "Sáng nào mình cũng ra đồng làm việc." },
      { en: "Take a deep breath, then speak slowly and clearly.", vi: "Hít một hơi thật sâu, rồi nói chậm và rõ nhé." },
      { en: "Ten minutes a day is better than two hours once a week.", vi: "Mười phút mỗi ngày tốt hơn hai tiếng mỗi tuần." },
    ],
  },
];

function Pig() {
  return (
    <svg viewBox="0 0 120 112" className="w-full h-auto overflow-visible">
      <ellipse className="ch-shadow" cx="60" cy="106" rx="34" ry="5" fill="#000" opacity=".13" />
      <g className="ch-bob">
        <path d="M100 66 q12 -4 8 -13 q-7 -4 -8 4" fill="none" stroke={O} strokeWidth="3" strokeLinecap="round" />
        <rect x="34" y="82" width="13" height="19" rx="6" fill="#F4A7B9" stroke={O} strokeWidth="3" />
        <rect x="73" y="82" width="13" height="19" rx="6" fill="#F4A7B9" stroke={O} strokeWidth="3" />
        <ellipse cx="60" cy="72" rx="42" ry="29" fill="#F8BBD0" stroke={O} strokeWidth="3" />
        <path d="M34 30 L27 9 L52 22 Z" fill="#F48FB1" stroke={O} strokeWidth="3" strokeLinejoin="round" />
        <path d="M86 30 L93 9 L68 22 Z" fill="#F48FB1" stroke={O} strokeWidth="3" strokeLinejoin="round" />
        <circle cx="60" cy="48" r="28" fill="#F8BBD0" stroke={O} strokeWidth="3" />
        <g className="ch-eyes">
          <circle cx="48" cy="43" r="3.8" fill={O} />
          <circle cx="72" cy="43" r="3.8" fill={O} />
          <circle cx="49.3" cy="41.6" r="1.2" fill="#fff" />
          <circle cx="73.3" cy="41.6" r="1.2" fill="#fff" />
        </g>
        <ellipse cx="40" cy="55" rx="5.5" ry="3.2" fill="#F06292" opacity=".45" />
        <ellipse cx="80" cy="55" rx="5.5" ry="3.2" fill="#F06292" opacity=".45" />
        <ellipse cx="60" cy="58" rx="13" ry="9" fill="#F48FB1" stroke={O} strokeWidth="3" />
        <ellipse cx="55.5" cy="58" rx="2.2" ry="3.2" fill={O} />
        <ellipse cx="64.5" cy="58" rx="2.2" ry="3.2" fill={O} />
      </g>
    </svg>
  );
}

function Buffalo() {
  return (
    <svg viewBox="0 0 140 114" className="w-full h-auto overflow-visible">
      <ellipse className="ch-shadow" cx="70" cy="108" rx="44" ry="5" fill="#000" opacity=".13" />
      <g className="ch-bob">
        <path d="M114 70 q14 6 10 20" fill="none" stroke={O} strokeWidth="3" strokeLinecap="round" />
        <path d="M121 88 l6 8 l-9 -1 z" fill="#4E5966" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
        {[30, 50, 82, 102].map((x) => (
          <rect key={x} x={x} y="84" width="13" height="20" rx="5" fill="#66717E" stroke={O} strokeWidth="3" />
        ))}
        <ellipse cx="70" cy="74" rx="48" ry="27" fill="#7D8A99" stroke={O} strokeWidth="3" />
        <path d="M44 40 C24 36 16 18 28 8 C30 22 40 28 52 30 Z" fill="#F3E4C6" stroke={O} strokeWidth="3" strokeLinejoin="round" />
        <path d="M96 40 C116 36 124 18 112 8 C110 22 100 28 88 30 Z" fill="#F3E4C6" stroke={O} strokeWidth="3" strokeLinejoin="round" />
        <ellipse cx="40" cy="48" rx="10" ry="5.5" fill="#66717E" stroke={O} strokeWidth="3" transform="rotate(-20 40 48)" />
        <ellipse cx="100" cy="48" rx="10" ry="5.5" fill="#66717E" stroke={O} strokeWidth="3" transform="rotate(20 100 48)" />
        <circle cx="70" cy="48" r="27" fill="#8C99A8" stroke={O} strokeWidth="3" />
        <path d="M62 23 q8 -8 16 0" fill="none" stroke={O} strokeWidth="3" strokeLinecap="round" />
        <circle cx="96" cy="34" r="5" fill="#F4B6C2" stroke={O} strokeWidth="2.5" />
        <circle cx="96" cy="34" r="1.8" fill="#F2C14E" />
        <g className="ch-eyes">
          <circle cx="60" cy="43" r="3.8" fill={O} />
          <circle cx="80" cy="43" r="3.8" fill={O} />
          <circle cx="61.3" cy="41.6" r="1.2" fill="#fff" />
          <circle cx="81.3" cy="41.6" r="1.2" fill="#fff" />
        </g>
        <ellipse cx="70" cy="60" rx="16" ry="10.5" fill="#C9B8A6" stroke={O} strokeWidth="3" />
        <ellipse cx="64.5" cy="60" rx="2.3" ry="3.2" fill={O} />
        <ellipse cx="75.5" cy="60" rx="2.3" ry="3.2" fill={O} />
      </g>
    </svg>
  );
}

function Dragon() {
  return (
    <svg viewBox="0 0 130 124" className="w-full h-auto overflow-visible">
      <ellipse cx="65" cy="120" rx="22" ry="4" fill="#000" opacity=".1" />
      <g className="anim-floaty">
        <path d="M86 92 C110 98 120 82 112 70 C108 80 100 84 88 82 Z" fill="#6BC48F" stroke={O} strokeWidth="3" strokeLinejoin="round" />
        <path d="M112 70 l6 -6 l1 9 z" fill="#E86F5A" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
        <path className="wing-l" d="M42 62 L12 40 L22 62 L8 66 L36 76 Z" fill="#F2C14E" stroke={O} strokeWidth="3" strokeLinejoin="round" />
        <path className="wing-r" d="M88 62 L118 40 L108 62 L122 66 L94 76 Z" fill="#F2C14E" stroke={O} strokeWidth="3" strokeLinejoin="round" />
        <ellipse cx="65" cy="84" rx="26" ry="24" fill="#6BC48F" stroke={O} strokeWidth="3" />
        <ellipse cx="65" cy="88" rx="15" ry="16" fill="#FFF1C7" stroke={O} strokeWidth="2.5" />
        <path d="M54 82 h22 M53 90 h24 M56 98 h18" stroke="#E0C58A" strokeWidth="2" />
        <ellipse cx="50" cy="106" rx="7" ry="5" fill="#5AAE7C" stroke={O} strokeWidth="3" />
        <ellipse cx="80" cy="106" rx="7" ry="5" fill="#5AAE7C" stroke={O} strokeWidth="3" />
        <path d="M50 26 L44 8 L58 21 Z" fill="#F2C14E" stroke={O} strokeWidth="3" strokeLinejoin="round" />
        <path d="M80 26 L86 8 L72 21 Z" fill="#F2C14E" stroke={O} strokeWidth="3" strokeLinejoin="round" />
        <path d="M56 24 L60 14 L65 23 L70 14 L74 24" fill="#E86F5A" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
        <ellipse cx="65" cy="46" rx="29" ry="24" fill="#6BC48F" stroke={O} strokeWidth="3" />
        <path d="M50 58 C40 60 33 54 28 58" fill="none" stroke="#E86F5A" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M80 58 C90 60 97 54 102 58" fill="none" stroke="#E86F5A" strokeWidth="2.5" strokeLinecap="round" />
        <g className="ch-eyes">
          <circle cx="53" cy="43" r="5" fill={O} />
          <circle cx="77" cy="43" r="5" fill={O} />
          <circle cx="54.8" cy="41" r="1.8" fill="#fff" />
          <circle cx="78.8" cy="41" r="1.8" fill="#fff" />
        </g>
        <ellipse cx="44" cy="52" rx="5" ry="3" fill="#F06292" opacity=".4" />
        <ellipse cx="86" cy="52" rx="5" ry="3" fill="#F06292" opacity=".4" />
        <ellipse cx="65" cy="56" rx="13" ry="8" fill="#8FD6A8" stroke={O} strokeWidth="3" />
        <circle cx="60.5" cy="55" r="1.8" fill={O} />
        <circle cx="69.5" cy="55" r="1.8" fill={O} />
      </g>
    </svg>
  );
}

const ANIMAL_ART: Record<AnimalId, () => React.ReactElement> = { pig: Pig, dragon: Dragon, buffalo: Buffalo };

/** Các con vật trong vườn. Bấm để nghe chúng nói (mỗi lần một câu khác). */
export function GardenAnimals() {
  const [talk, setTalk] = useState<{ id: AnimalId; i: number } | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!talk) return;
    const t = setTimeout(() => setTalk(null), 5200);
    return () => clearTimeout(t);
  }, [talk]);

  return (
    <>
      {ANIMALS.map((a) => {
        const Art = ANIMAL_ART[a.id];
        const line = talk?.id === a.id ? a.lines[talk.i] : null;
        return (
          <div key={a.id} className="absolute" style={{ left: P(a.x, 1280), top: P(a.y, 800), width: P(a.w, 1280), zIndex: line ? 20 : 2 }}>
            {line && (
              <div
                className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 w-max max-w-[260px] rounded-[14px] px-3 py-2 bg-white border-[3px] border-[#8B5E3C] shadow-[0_3px_0_#8B5E3C] anim-pop text-left"
                style={{ fontSize: "max(11px, 1.05cqw)" }}
              >
                <div className="font-baloo font-extrabold leading-tight text-[#4A3222]">{line.en}</div>
                <div className="font-semibold text-[#6B4A30] leading-snug">{line.vi}</div>
              </div>
            )}
            <button
              type="button"
              data-sfx="none"
              aria-label={`${a.name} — bấm để nghe`}
              title={a.name}
              className="block w-full hover:scale-105 active:scale-95 transition-transform"
              onClick={() => {
                const n = counts[a.id] || 0;
                const i = n % a.lines.length;
                setCounts((c) => ({ ...c, [a.id]: n + 1 }));
                setTalk({ id: a.id, i });
                sfx.animal(a.id);
                setTimeout(() => speak(a.lines[i].en, { who: a.voice }), a.id === "buffalo" ? 900 : 650);
              }}
            >
              <Art />
            </button>
          </div>
        );
      })}
    </>
  );
}

// ───────────── Đồ xây đảo ─────────────

const BUILD_POS: Record<BuildId, { x: number; y: number; w: number; cls?: string }> = {
  flowers: { x: 352, y: 196, w: 78 },
  bench: { x: 84, y: 494, w: 74 },
  mailbox: { x: 106, y: 372, w: 38 },
  lanterns: { x: 420, y: 316, w: 132 },
  boat: { x: 118, y: 594, w: 78, cls: "anim-floaty" },
  windmill: { x: 1112, y: 360, w: 82 },
  balloon: { x: 456, y: 6, w: 64, cls: "anim-floaty" },
  arch: { x: 958, y: 498, w: 128 },
};

export function BuildArt({ id }: { id: BuildId }) {
  switch (id) {
    case "flowers":
      return (
        <svg viewBox="0 0 80 44" className="w-full h-auto overflow-visible">
          <ellipse cx="40" cy="38" rx="38" ry="7" fill="#7A5236" stroke={O} strokeWidth="2.5" />
          {[
            [14, "#F4B6C2"],
            [30, "#F2C14E"],
            [46, "#E86F5A"],
            [62, "#B9A6F2"],
          ].map(([x, c], i) => (
            <g key={i} className="tree" style={{ animationDelay: `${i * 0.4}s` }}>
              <path d={`M${x} 36 V${20 + (i % 2) * 4}`} stroke="#3F7A34" strokeWidth="3" />
              <ellipse cx={(x as number) - 5} cy={28} rx="4" ry="2.5" fill="#6FAE4F" />
              {[0, 72, 144, 216, 288].map((r) => (
                <circle key={r} cx={(x as number) + 5 * Math.cos((r * Math.PI) / 180)} cy={18 + (i % 2) * 4 + 5 * Math.sin((r * Math.PI) / 180)} r="4" fill={c as string} stroke={O} strokeWidth="1.5" />
              ))}
              <circle cx={x as number} cy={18 + (i % 2) * 4} r="3" fill="#FFF1C7" stroke={O} strokeWidth="1.5" />
            </g>
          ))}
        </svg>
      );
    case "bench":
      return (
        <svg viewBox="0 0 80 50" className="w-full h-auto overflow-visible">
          <ellipse cx="40" cy="46" rx="34" ry="4" fill="#000" opacity=".12" />
          <rect x="8" y="8" width="64" height="9" rx="3" fill="#B07A4F" stroke={O} strokeWidth="3" />
          <rect x="6" y="24" width="68" height="9" rx="3" fill="#C98D5C" stroke={O} strokeWidth="3" />
          <path d="M14 33 V45 M66 33 V45 M16 17 V24 M64 17 V24" stroke={O} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case "mailbox":
      return (
        <svg viewBox="0 0 40 70" className="w-full h-auto overflow-visible">
          <rect x="16" y="30" width="8" height="38" rx="2" fill="#8B5E3C" stroke={O} strokeWidth="2.5" />
          <path d="M4 32 V18 a16 14 0 0 1 32 0 V32 Z" fill="#E86F5A" stroke={O} strokeWidth="3" />
          <rect x="10" y="20" width="14" height="4" rx="2" fill={O} />
          <path d="M32 10 V-4 H42 V3 H32" fill="#F2C14E" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
      );
    case "lanterns":
      return (
        <svg viewBox="0 0 140 50" className="w-full h-auto overflow-visible">
          <path d="M4 6 Q70 34 136 6" fill="none" stroke={O} strokeWidth="2.5" />
          {[22, 48, 74, 100, 120].map((x, i) => {
            const y = 6 + 28 * (1 - Math.pow((x - 70) / 66, 2)) * 0.95;
            const c = ["#E86F5A", "#F2C14E", "#E86F5A", "#F2C14E", "#E86F5A"][i];
            return (
              <g key={x} className="glow" style={{ animationDelay: `${i * 0.3}s` }}>
                <path d={`M${x} ${y - 2} v4`} stroke={O} strokeWidth="2" />
                <ellipse cx={x} cy={y + 10} rx="7" ry="9" fill={c} stroke={O} strokeWidth="2.5" />
                <path d={`M${x - 4} ${y + 2} h8 M${x - 4} ${y + 18} h8`} stroke={O} strokeWidth="2.5" strokeLinecap="round" />
              </g>
            );
          })}
        </svg>
      );
    case "boat":
      return (
        <svg viewBox="0 0 80 60" className="w-full h-auto overflow-visible">
          <path d="M38 6 V40" stroke={O} strokeWidth="3" />
          <path d="M40 8 L64 36 H40 Z" fill="#FFFFFF" stroke={O} strokeWidth="3" strokeLinejoin="round" />
          <path d="M36 12 L18 36 H36 Z" fill="#F4B6C2" stroke={O} strokeWidth="3" strokeLinejoin="round" />
          <path d="M6 40 H74 L64 54 H16 Z" fill="#C98D5C" stroke={O} strokeWidth="3" strokeLinejoin="round" />
        </svg>
      );
    case "windmill":
      return (
        <svg viewBox="0 0 80 110" className="w-full h-auto overflow-visible">
          <ellipse cx="40" cy="106" rx="24" ry="4" fill="#000" opacity=".12" />
          <path d="M26 104 L32 40 H48 L54 104 Z" fill="#FBF0D9" stroke={O} strokeWidth="3" strokeLinejoin="round" />
          <path d="M28 42 L40 26 L52 42 Z" fill="#E86F5A" stroke={O} strokeWidth="3" strokeLinejoin="round" />
          <rect x="35" y="84" width="10" height="20" rx="4" fill="#8B5E3C" stroke={O} strokeWidth="2.5" />
          <g className="spin">
            {[0, 90, 180, 270].map((r) => (
              <path key={r} d="M40 38 L43 6 L52 8 L46 38 Z" fill="#FFF1C7" stroke={O} strokeWidth="2.5" strokeLinejoin="round" transform={`rotate(${r} 40 38)`} />
            ))}
            <circle cx="40" cy="38" r="4" fill="#F2C14E" stroke={O} strokeWidth="2.5" />
          </g>
        </svg>
      );
    case "balloon":
      return (
        <svg viewBox="0 0 64 96" className="w-full h-auto overflow-visible">
          <path d="M32 4 C6 4 2 32 14 48 L24 62 H40 L50 48 C62 32 58 4 32 4 Z" fill="#E86F5A" stroke={O} strokeWidth="3" strokeLinejoin="round" />
          <path d="M32 4 C22 14 22 44 26 62 M32 4 C42 14 42 44 38 62" fill="none" stroke="#F2C14E" strokeWidth="5" />
          <path d="M26 62 L24 76 M38 62 L40 76" stroke={O} strokeWidth="2" />
          <rect x="21" y="74" width="22" height="16" rx="3" fill="#C98D5C" stroke={O} strokeWidth="3" />
        </svg>
      );
    case "arch":
      return (
        <svg viewBox="0 0 130 100" className="w-full h-auto overflow-visible">
          <path d="M14 98 V46 A51 44 0 0 1 116 46 V98" fill="none" stroke="#8B5E3C" strokeWidth="9" />
          <path d="M14 98 V46 A51 44 0 0 1 116 46 V98" fill="none" stroke="#6FAE4F" strokeWidth="4" strokeDasharray="2 10" />
          {Array.from({ length: 11 }).map((_, i) => {
            const t = Math.PI - (i / 10) * Math.PI;
            const x = 65 + 51 * Math.cos(t);
            const y = 46 - 44 * Math.sin(t);
            return <circle key={i} className="sparkle" style={{ animationDelay: `${i * 0.15}s` }} cx={x} cy={y} r="5" fill={["#F4B6C2", "#F2C14E", "#E86F5A"][i % 3]} stroke={O} strokeWidth="1.5" />;
          })}
        </svg>
      );
  }
}

/** Vẽ các món đã mở theo cấp đảo lên bản đồ. */
export function IslandBuilds({ level }: { level: number }) {
  return (
    <>
      {BUILDS.filter((b) => level >= b.lv).map((b) => {
        const pos = BUILD_POS[b.id];
        return (
          <div key={b.id} className={cx("absolute pointer-events-none anim-pop", pos.cls)} style={{ left: P(pos.x, 1280), top: P(pos.y, 800), width: P(pos.w, 1280), zIndex: 1 }} title={b.name}>
            <BuildArt id={b.id} />
          </div>
        );
      })}
    </>
  );
}

/** Bảng "Đảo của bạn": các món đã mở / sắp mở. */
export function BuildPanel({ level, pct, onClose }: { level: number; pct: number; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const next = BUILDS.find((b) => b.lv > level);
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-3 bg-[#4A3222]/40" onClick={onClose} role="dialog" aria-modal="true" aria-label="Đảo của bạn">
      <div className="cci-card-wood w-full max-w-2xl p-5 flex flex-col gap-4 anim-pop max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-[14px] border-[3px] border-[#4A3222] bg-[#E4EFC9] flex items-center justify-center">
            <Hammer className="w-6 h-6" />
          </span>
          <div className="flex-1">
            <h2 className="text-2xl font-extrabold leading-tight">Đảo của bạn · Cấp {level}</h2>
            <p className="font-semibold text-[#6B4A30] text-sm">{next ? `Cấp ${next.lv} sẽ mở: ${next.name}. Học đều mỗi ngày để kiếm XP!` : "Bạn đã xây xong cả hòn đảo. Tuyệt vời!"}</p>
          </div>
          <button type="button" onClick={onClose} className="cci-btn !min-h-[40px] !w-[40px] !p-0" aria-label="Đóng" data-sfx="close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>
          <div className="flex justify-between text-xs font-extrabold text-[#6B4A30] mb-1">
            <span>Cấp {level}</span>
            <span>{pct}% → cấp {level + 1}</span>
          </div>
          <div className="h-3 rounded-full bg-[#EAD9B8] border-2 border-[#8B5E3C] overflow-hidden">
            <div className="h-full bg-[#6FAE4F]" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {BUILDS.map((b) => {
            const open = level >= b.lv;
            return (
              <li key={b.id} className={cx("rounded-[18px] border-[3px] p-3 flex flex-col items-center gap-1.5 text-center", open ? "border-[#6FAE4F] bg-[#F4FAEC]" : "border-[#EAD9B8] bg-white")}>
                <div className={cx("w-16 h-16 [&_svg]:!w-full [&_svg]:!h-full", !open && "grayscale opacity-40")}>
                  <BuildArt id={b.id} />
                </div>
                <div className="font-baloo font-extrabold leading-tight text-[15px]">{b.name}</div>
                <div className="text-[11px] font-bold text-[#6B4A30] leading-snug">{open ? b.desc : <span className="inline-flex items-center gap-1"><Lock className="w-3 h-3" /> Cấp {b.lv}</span>}</div>
              </li>
            );
          })}
        </ul>
        <p className="text-xs font-semibold text-[#6B4A30]">Mẹo: bấm vào heo Ủn, rồng Bông và trâu Mộc trong vườn để nghe chúng nói tiếng Anh!</p>
      </div>
    </div>
  );
}
