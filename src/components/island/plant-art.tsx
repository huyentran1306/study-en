"use client";

import type { Plant } from "@/lib/island/garden-data";

const O = "#4A3222";
const LEAF = "#6FAE4F";
const LEAF_D = "#3F7A34";

function Leaf({ x, y, s = 1, flip = false }: { x: number; y: number; s?: number; flip?: boolean }) {
  const d = flip ? -1 : 1;
  return (
    <path
      d={`M${x} ${y} C${x + d * 10 * s} ${y - 12 * s} ${x + d * 22 * s} ${y - 6 * s} ${x + d * 24 * s} ${y + 2 * s} C${x + d * 14 * s} ${y + 6 * s} ${x + d * 6 * s} ${y + 4 * s} ${x} ${y} Z`}
      fill={LEAF}
      stroke={O}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
  );
}

/**
 * Cây trong Vườn Nhiệm Vụ. stage = số nhiệm vụ đã xong của tuần (0..7).
 * 0 hạt · 1–2 mầm · 3–4 cây non · 5–6 nụ · 7 ra hoa / ra quả.
 */
export function PlantArt({ plant, stage }: { plant: Plant; stage: number }) {
  const st = Math.max(0, Math.min(7, stage));
  const stemTop = [92, 76, 68, 58, 50, 44, 40, 34][st];
  return (
    <svg viewBox="0 0 100 112" className="w-full h-auto overflow-visible">
      <ellipse cx="50" cy="104" rx="36" ry="7" fill="#000" opacity=".1" />
      <g className={st === 7 ? "ch-bob" : "tree"}>
        {/* Thân */}
        {st >= 1 && plant.shape !== "root" && <path d={`M50 98 V${stemTop}`} stroke={LEAF_D} strokeWidth="4" strokeLinecap="round" />}
        {st >= 1 && plant.shape === "root" && <path d={`M50 96 V${Math.max(stemTop, 62)}`} stroke={LEAF_D} strokeWidth="4" strokeLinecap="round" />}
        {/* Lá */}
        {st >= 1 && st <= 2 && (
          <>
            <Leaf x={50} y={stemTop + 4} s={st === 1 ? 0.6 : 0.85} />
            <Leaf x={50} y={stemTop + 4} s={st === 1 ? 0.6 : 0.85} flip />
          </>
        )}
        {st >= 3 && plant.shape !== "root" && (
          <>
            <Leaf x={50} y={86} s={st >= 5 ? 1.1 : 0.95} />
            <Leaf x={50} y={86} s={st >= 5 ? 1.1 : 0.95} flip />
            <Leaf x={50} y={stemTop + 14} s={0.8} />
            <Leaf x={50} y={stemTop + 14} s={0.8} flip />
          </>
        )}
        {st >= 3 && plant.shape === "root" && (
          <>
            <Leaf x={50} y={74} s={st >= 5 ? 1.15 : 0.95} />
            <Leaf x={50} y={74} s={st >= 5 ? 1.15 : 0.95} flip />
            <path d={`M50 74 C46 ${60 - st * 2} 52 ${54 - st * 2} 50 ${50 - st * 2}`} fill="none" stroke={LEAF_D} strokeWidth="4" strokeLinecap="round" />
            <Leaf x={50} y={60 - st} s={0.75} />
            <Leaf x={50} y={60 - st} s={0.75} flip />
          </>
        )}
        {/* Nụ */}
        {(st === 5 || st === 6) && plant.shape !== "root" && (
          <>
            <ellipse cx="50" cy={stemTop - 5} rx={st === 5 ? 6 : 8} ry={st === 5 ? 8 : 10} fill={st === 6 ? plant.color : "#9CCB6A"} stroke={O} strokeWidth="2.5" />
            <path d={`M44 ${stemTop} q6 -6 12 0`} fill={LEAF} stroke={O} strokeWidth="2" />
          </>
        )}
        {/* Thành quả */}
        {st === 7 && <Bloom plant={plant} top={stemTop} />}
      </g>
      {/* Đất */}
      <path d="M14 104 C14 92 30 88 50 88 C70 88 86 92 86 104 Z" fill="#9B6B45" stroke={O} strokeWidth="3" strokeLinejoin="round" />
      <path d="M28 96 h4 M60 94 h5 M44 99 h3" stroke="#7A5236" strokeWidth="2.5" strokeLinecap="round" />
      {st === 0 && <ellipse cx="50" cy="88" rx="6" ry="4" fill="#C98D5C" stroke={O} strokeWidth="2.5" />}
      {st >= 6 && plant.shape === "root" && (
        <path d={`M38 90 C40 ${st === 7 ? 80 : 84} 60 ${st === 7 ? 80 : 84} 62 90 Z`} fill={plant.color} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function Bloom({ plant, top }: { plant: Plant; top: number }) {
  if (plant.shape === "flower") {
    const petals = plant.en === "lavender" ? 0 : 6;
    if (!petals)
      return (
        <g>
          {[-8, 0, 8].map((dx, i) => (
            <g key={dx}>
              <path d={`M${50 + dx} ${top + 30} V${top - 4 + i * 2}`} stroke={LEAF_D} strokeWidth="3" />
              {[0, 1, 2, 3, 4].map((j) => (
                <ellipse key={j} cx={50 + dx} cy={top - 2 + i * 2 + j * 6} rx="4.5" ry="3.5" fill={j % 2 ? plant.color2 : plant.color} stroke={O} strokeWidth="1.8" />
              ))}
            </g>
          ))}
        </g>
      );
    return (
      <g>
        {Array.from({ length: petals }).map((_, i) => {
          const a = (i / petals) * Math.PI * 2;
          return <ellipse key={i} cx={50 + Math.cos(a) * 9} cy={top - 6 + Math.sin(a) * 9} rx="8" ry="6" transform={`rotate(${(a * 180) / Math.PI} ${50 + Math.cos(a) * 9} ${top - 6 + Math.sin(a) * 9})`} fill={plant.color} stroke={O} strokeWidth="2" />;
        })}
        <circle cx="50" cy={top - 6} r="6" fill={plant.color2} stroke={O} strokeWidth="2" />
        <path className="sparkle" d={`M74 ${top - 18} l2 -5 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 z`} fill="#F2C14E" stroke={O} strokeWidth="1.2" />
      </g>
    );
  }
  if (plant.shape === "tall") {
    if (plant.en === "corn")
      return (
        <g>
          <path d={`M50 ${top + 6} C40 ${top} 40 ${top - 20} 50 ${top - 26} C60 ${top - 20} 60 ${top} 50 ${top + 6} Z`} fill={plant.color} stroke={O} strokeWidth="2.5" />
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M44 ${top - 18 + i * 6} h12`} stroke="#D9B030" strokeWidth="2" />
          ))}
          <path d={`M50 ${top + 8} C38 ${top + 4} 34 ${top - 10} 38 ${top - 16} C42 ${top - 6} 46 ${top} 50 ${top + 8} Z`} fill={plant.color2} stroke={O} strokeWidth="2.2" />
          <path d={`M50 ${top + 8} C62 ${top + 4} 66 ${top - 10} 62 ${top - 16} C58 ${top - 6} 54 ${top} 50 ${top + 8} Z`} fill={plant.color2} stroke={O} strokeWidth="2.2" />
        </g>
      );
    return (
      <g>
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <ellipse key={i} cx={50 + Math.cos(a) * 13} cy={top - 8 + Math.sin(a) * 13} rx="7" ry="4" transform={`rotate(${(a * 180) / Math.PI} ${50 + Math.cos(a) * 13} ${top - 8 + Math.sin(a) * 13})`} fill={plant.color} stroke={O} strokeWidth="1.8" />;
        })}
        <circle cx="50" cy={top - 8} r="10" fill={plant.color2} stroke={O} strokeWidth="2.2" />
        <circle cx="47" cy={top - 10} r="1.4" fill="#4A3222" />
        <circle cx="53" cy={top - 10} r="1.4" fill="#4A3222" />
        <path d={`M46 ${top - 5} q4 3 8 0`} fill="none" stroke="#4A3222" strokeWidth="1.6" strokeLinecap="round" />
      </g>
    );
  }
  if (plant.shape === "fruit") {
    const big = plant.en === "pumpkin" || plant.en === "watermelon";
    if (big)
      return (
        <g>
          <circle cx="50" cy={top + 10} r="16" fill={LEAF} stroke={O} strokeWidth="2.5" />
          <ellipse cx="50" cy="84" rx="20" ry="13" fill={plant.color} stroke={O} strokeWidth="2.8" />
          {plant.en === "pumpkin" ? (
            <>
              <path d="M42 73 C38 80 38 90 42 96 M58 73 C62 80 62 90 58 96 M50 71 V97" fill="none" stroke="#C96A2B" strokeWidth="2" />
              <path d="M50 71 q2 -6 6 -6" fill="none" stroke={LEAF_D} strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <path d="M36 78 C44 74 44 94 36 90 M50 72 C46 80 46 90 50 97 M64 78 C56 74 56 94 64 90" fill="none" stroke={plant.color2} strokeWidth="3" />
          )}
        </g>
      );
    const spots: [number, number][] = [
      [38, top + 6],
      [62, top + 4],
      [50, top - 6],
      [46, top + 18],
      [58, top + 18],
    ];
    return (
      <g>
        <circle cx="50" cy={top + 6} r="20" fill={LEAF} stroke={O} strokeWidth="2.5" />
        <circle cx="36" cy={top + 14} r="11" fill={LEAF} stroke={O} strokeWidth="2.5" />
        <circle cx="64" cy={top + 14} r="11" fill={LEAF} stroke={O} strokeWidth="2.5" />
        {spots.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={plant.en === "coffee plant" ? 4 : 6} fill={plant.color} stroke={O} strokeWidth="2" />
            {plant.en === "strawberry" && <circle cx={x - 1.5} cy={y - 1} r="0.9" fill={plant.color2} />}
          </g>
        ))}
      </g>
    );
  }
  // root: lá xum xuê, củ lộ khỏi đất (vẽ ở phần đất)
  return (
    <g>
      <Leaf x={50} y={64} s={1.2} />
      <Leaf x={50} y={64} s={1.2} flip />
      <path className="sparkle" d="M76 52 l2 -5 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 z" fill="#F2C14E" stroke={O} strokeWidth="1.2" />
    </g>
  );
}
