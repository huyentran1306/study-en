// 5 nhân vật Chit Chat Island, vẽ bằng SVG theo đúng bộ design (Main.dc.html).
import type { NpcId } from "@/lib/island/curriculum";

type Kind = { body: string; belly: string; inner: string; feet: string; ears: "pointy" | "long" | "bumps" | "none"; face: "shiba" | "cat" | "bunny" | "peng" | "frog"; acc: string[] };

const KINDS: Record<NpcId, Kind> = {
  bo: { body: "#E9A15B", belly: "#FFF4E2", inner: "#F7C7A0", feet: "#E9A15B", ears: "pointy", face: "shiba", acc: ["scarf", "sprout"] },
  miso: { body: "#AEB8CB", belly: "#F7F3EC", inner: "#F4B6C2", feet: "#AEB8CB", ears: "pointy", face: "cat", acc: ["apron", "beret"] },
  mallow: { body: "#FBF6EF", belly: "#FFFFFF", inner: "#F4B6C2", feet: "#FBF6EF", ears: "long", face: "bunny", acc: ["flower"] },
  pip: { body: "#3E4A61", belly: "#FBF6EF", inner: "#3E4A61", feet: "#F2A541", ears: "none", face: "peng", acc: ["cap"] },
  kero: { body: "#8CC56A", belly: "#E9F4CF", inner: "#8CC56A", feet: "#8CC56A", ears: "bumps", face: "frog", acc: ["bow"] },
};

export type Mood = "idle" | "wave" | "talk" | "happy";

const S = "#4A3222";

export function Character({
  who,
  mood = "idle",
  size = 120,
  delay = 0,
  className = "",
  shadow = true,
}: {
  who: NpcId;
  mood?: Mood;
  size?: number | string;
  delay?: number;
  className?: string;
  shadow?: boolean;
}) {
  const k = KINDS[who];
  const has = (a: string) => k.acc.includes(a);
  const w = typeof size === "number" ? size : undefined;
  return (
    <div className={`ch-${mood} ${className}`} style={{ width: size, lineHeight: 0 }}>
      <svg viewBox="0 0 120 140" width={w ?? "100%"} height={w ? Math.round((w * 140) / 120) : undefined} aria-hidden="true" style={{ overflow: "visible", display: "block", width: "100%", height: "auto" }}>
        {shadow && <ellipse className="ch-shadow" cx="60" cy="134" rx="28" ry="5" fill={S} opacity="0.16" />}
        <g className="ch-bob" style={{ animationDelay: `${delay}s` }}>
          {k.ears === "pointy" && (
            <g>
              <path d="M24 52 L30 12 L58 36 Z" fill={k.body} stroke={S} strokeWidth="3" strokeLinejoin="round" />
              <path d="M32 42 L34 24 L48 36 Z" fill={k.inner} />
              <path d="M96 52 L90 12 L62 36 Z" fill={k.body} stroke={S} strokeWidth="3" strokeLinejoin="round" />
              <path d="M88 42 L86 24 L72 36 Z" fill={k.inner} />
            </g>
          )}
          {k.ears === "long" && (
            <g>
              <g className="ch-ear-l">
                <ellipse cx="44" cy="20" rx="10" ry="26" fill={k.body} stroke={S} strokeWidth="3" />
                <ellipse cx="44" cy="23" rx="4.5" ry="17" fill={k.inner} />
              </g>
              <g className="ch-ear-r">
                <ellipse cx="76" cy="20" rx="10" ry="26" fill={k.body} stroke={S} strokeWidth="3" />
                <ellipse cx="76" cy="23" rx="4.5" ry="17" fill={k.inner} />
              </g>
            </g>
          )}
          {k.ears === "bumps" && (
            <g>
              <circle cx="38" cy="34" r="15" fill={k.body} stroke={S} strokeWidth="3" />
              <circle cx="82" cy="34" r="15" fill={k.body} stroke={S} strokeWidth="3" />
            </g>
          )}
          <ellipse cx="46" cy="129" rx="10" ry="5.5" fill={k.feet} stroke={S} strokeWidth="3" />
          <ellipse cx="74" cy="129" rx="10" ry="5.5" fill={k.feet} stroke={S} strokeWidth="3" />
          <ellipse cx="60" cy="106" rx="29" ry="25" fill={k.body} stroke={S} strokeWidth="3" />
          <ellipse cx="60" cy="111" rx="18" ry="15" fill={k.belly} />
          {has("apron") && (
            <g>
              <path d="M45 98 H75 V120 Q60 127 45 120 Z" fill="#8B5E3C" stroke={S} strokeWidth="2.5" strokeLinejoin="round" />
              <rect x="53" y="106" width="14" height="8" rx="2" fill="#6E4529" />
            </g>
          )}
          <g className="ch-arm-l">
            <ellipse cx="30" cy="103" rx="7" ry="11" fill={k.body} stroke={S} strokeWidth="3" transform="rotate(30 30 103)" />
          </g>
          <g className="ch-arm-r">
            <ellipse cx="90" cy="103" rx="7" ry="11" fill={k.body} stroke={S} strokeWidth="3" transform="rotate(-30 90 103)" />
          </g>
          <ellipse cx="60" cy="60" rx="40" ry="34" fill={k.body} stroke={S} strokeWidth="3" />
          {k.face === "peng" && <path d="M28 66 Q28 42 48 44 Q60 52 72 44 Q92 42 92 66 Q92 90 60 91 Q28 90 28 66 Z" fill={k.belly} />}
          {k.face === "shiba" && (
            <g>
              <ellipse cx="60" cy="77" rx="24" ry="15" fill={k.belly} />
              <ellipse cx="45" cy="50" rx="4" ry="2.6" fill={k.belly} />
              <ellipse cx="75" cy="50" rx="4" ry="2.6" fill={k.belly} />
            </g>
          )}
          {k.face === "cat" && <path d="M60 29 V38 M51 31 L53 38 M69 31 L67 38" stroke="#8592A8" strokeWidth="3" strokeLinecap="round" fill="none" />}
          {k.face !== "frog" ? (
            <g className="ch-eyes">
              <ellipse cx="45" cy="62" rx="5" ry="6.5" fill="#3A2618" />
              <ellipse cx="75" cy="62" rx="5" ry="6.5" fill="#3A2618" />
              <circle cx="46.8" cy="59.6" r="2" fill="#FFFFFF" />
              <circle cx="76.8" cy="59.6" r="2" fill="#FFFFFF" />
            </g>
          ) : (
            <g className="ch-eyes">
              <circle cx="38" cy="34" r="8" fill="#FFFFFF" />
              <circle cx="82" cy="34" r="8" fill="#FFFFFF" />
              <ellipse cx="39" cy="35" rx="4" ry="5" fill="#3A2618" />
              <ellipse cx="81" cy="35" rx="4" ry="5" fill="#3A2618" />
            </g>
          )}
          <ellipse cx="35" cy="73" rx="7" ry="4.5" fill="#F48FA0" opacity="0.55" />
          <ellipse cx="85" cy="73" rx="7" ry="4.5" fill="#F48FA0" opacity="0.55" />
          {k.face !== "peng" && k.face !== "frog" && <ellipse cx="60" cy="70" rx="3.6" ry="2.6" fill="#3A2618" />}
          {k.face === "peng" && <path d="M52 70 Q60 63 68 70 Q60 78 52 70 Z" fill="#F2A541" stroke={S} strokeWidth="2.5" strokeLinejoin="round" />}
          {k.face !== "peng" && <path d="M54 75 Q57 79 60 75 Q63 79 66 75" fill="none" stroke="#3A2618" strokeWidth="2.2" strokeLinecap="round" />}
          {mood === "talk" && <ellipse className="ch-mouth" cx="60" cy="80" rx="4" ry="3.2" fill="#B5473A" />}
          {has("scarf") && (
            <g>
              <path d="M30 90 Q60 104 90 90 L90 98 Q60 112 30 98 Z" fill="#4C8A3F" stroke={S} strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M72 100 L80 118 L68 115 Z" fill="#4C8A3F" stroke={S} strokeWidth="2.5" strokeLinejoin="round" />
            </g>
          )}
          {has("bow") && (
            <g>
              <path d="M60 95 L47 88 L47 102 Z" fill="#E86F5A" stroke={S} strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M60 95 L73 88 L73 102 Z" fill="#E86F5A" stroke={S} strokeWidth="2.5" strokeLinejoin="round" />
              <circle cx="60" cy="95" r="4" fill="#C4513F" stroke={S} strokeWidth="2" />
            </g>
          )}
          {has("sprout") && <path d="M60 27 Q56 14 64 6 Q72 16 62 27 Z" fill="#6FAE4F" stroke={S} strokeWidth="2.5" strokeLinejoin="round" />}
          {has("beret") && (
            <g>
              <ellipse cx="64" cy="29" rx="22" ry="8" fill="#8B5E3C" stroke={S} strokeWidth="2.5" />
              <circle cx="64" cy="20" r="3.5" fill="#8B5E3C" stroke={S} strokeWidth="2" />
            </g>
          )}
          {has("cap") && (
            <g>
              <path d="M26 42 Q60 6 94 42 Z" fill="#4E7FB8" stroke={S} strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M22 42 Q60 34 98 42 Q60 50 22 42 Z" fill="#3D6797" stroke={S} strokeWidth="2.5" strokeLinejoin="round" />
              <circle cx="60" cy="28" r="4.5" fill="#F2C14E" stroke={S} strokeWidth="2" />
            </g>
          )}
          {has("flower") && (
            <g>
              {[
                [86, 29.5],
                [94, 35.4],
                [91, 44.9],
                [81, 44.9],
                [78, 35.4],
              ].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="5.5" fill="#F4B6C2" stroke={S} strokeWidth="1.8" />
              ))}
              <circle cx="86" cy="38" r="4" fill="#F2C14E" stroke={S} strokeWidth="1.8" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}

/** Ảnh đại diện tròn (chỉ phần đầu). */
export function Avatar({ who, size = 56, bg }: { who: NpcId; size?: number; bg?: string }) {
  const colors: Record<NpcId, string> = { bo: "#DCEFC6", miso: "#F3E1C8", mallow: "#FADDE3", pip: "#D7ECF5", kero: "#E4EFC9" };
  return (
    <div
      className="flex items-end justify-center overflow-hidden rounded-full shrink-0"
      style={{ width: size, height: size, background: bg || colors[who], border: "3px solid #8B5E3C" }}
    >
      <div style={{ width: size * 1.05, marginBottom: -size * 0.42 }}>
        <Character who={who} shadow={false} size="100%" />
      </div>
    </div>
  );
}
