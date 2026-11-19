"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { BackLink, cx } from "@/components/island/ui";
import { BeachLocked, GameOver } from "@/components/island/beach-ui";
import { BEACH_LEVEL, arcadeCap, arcadeToday } from "@/lib/island/beach";
import { arcadeReward, islandLevel, today, useIsland } from "@/lib/island/progress";
import { speak } from "@/lib/island/speech";
import { sfx } from "@/lib/island/sfx";

/** Các loại cá: càng hiếm càng nhiều điểm, vùng xanh hẹp hơn và cá giãy mạnh hơn. */
const FISH = [
  { en: "sardine", vi: "cá mòi", pts: 50, w: 30, color: "#9FB8C9", zone: 0.32, wild: 0.6 },
  { en: "mackerel", vi: "cá thu", pts: 80, w: 24, color: "#5E86A8", zone: 0.3, wild: 0.8 },
  { en: "tuna", vi: "cá ngừ", pts: 120, w: 18, color: "#3E5C86", zone: 0.27, wild: 1.0 },
  { en: "salmon", vi: "cá hồi", pts: 150, w: 13, color: "#F29A7E", zone: 0.25, wild: 1.1 },
  { en: "pufferfish", vi: "cá nóc", pts: 200, w: 8, color: "#F2C94E", zone: 0.22, wild: 1.3 },
  { en: "swordfish", vi: "cá kiếm", pts: 300, w: 5, color: "#6E9BD6", zone: 0.19, wild: 1.6 },
  { en: "golden koi", vi: "cá chép vàng", pts: 500, w: 2, color: "#F2A93E", zone: 0.16, wild: 1.9 },
];
type Fish = (typeof FISH)[number];
const CASTS = 5;
const REEL_LIMIT = 12;

function pickFish(): Fish {
  const total = FISH.reduce((n, f) => n + f.w, 0);
  let r = Math.random() * total;
  for (const f of FISH) if ((r -= f.w) < 0) return f;
  return FISH[0];
}

type Phase = "idle" | "wait" | "bite" | "reel" | "caught" | "lost" | "over";

export default function FishingPage() {
  const s = useIsland();
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [cast, setCast] = useState(0);
  const [score, setScore] = useState(0);
  const [catches, setCatches] = useState<Fish[]>([]);
  const [fish, setFish] = useState<Fish | null>(null);
  const [view, setView] = useState({ marker: 0.3, zone: 0.5, prog: 0.35, left: REEL_LIMIT });
  const [result, setResult] = useState<{ shells: number; best: boolean; capped: boolean } | null>(null);
  const holding = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const raf = useRef(0);
  useEffect(() => {
    setMounted(true);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  const finishCast = (got: Fish | null) => {
    cancelAnimationFrame(raf.current);
    const n = cast + 1;
    setCast(n);
    if (got) {
      setScore((x) => x + got.pts);
      setCatches((c) => [...c, got]);
      setPhase("caught");
      sfx.win();
      setTimeout(() => speak(got.en, { who: "you" }), 300);
    } else {
      setPhase("lost");
      sfx.wrong();
    }
  };

  const throwLine = () => {
    if (phase !== "idle" && phase !== "caught" && phase !== "lost") return;
    if (cast >= CASTS) return;
    sfx.splash();
    setPhase("wait");
    const f = pickFish();
    setFish(f);
    timer.current = setTimeout(() => {
      setPhase("bite");
      sfx.tick();
      timer.current = setTimeout(() => finishCast(null), 1200);
    }, 1500 + Math.random() * 3500);
  };

  const hook = () => {
    if (phase === "wait") {
      // Kéo sớm quá: cá sợ chạy mất
      if (timer.current) clearTimeout(timer.current);
      finishCast(null);
      return;
    }
    if (phase !== "bite" || !fish) return;
    if (timer.current) clearTimeout(timer.current);
    setPhase("reel");
    sfx.pop();
    // Vòng kéo cá: giữ vạch trong vùng xanh
    let marker = 0.3,
      vel = 0,
      zone = 0.5,
      prog = 0.35,
      left = REEL_LIMIT;
    let last = performance.now();
    const seed = Math.random() * 10;
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      left -= dt;
      vel += (holding.current ? 2.6 : -2.2) * dt;
      vel *= 0.92;
      marker = Math.max(0, Math.min(1, marker + vel * dt * 2.2));
      if (marker === 0 || marker === 1) vel = 0;
      const t = now / 1000 + seed;
      zone = 0.5 + 0.32 * Math.sin(t * 0.7 * fish.wild) * Math.cos(t * 0.3 * fish.wild + 1);
      const inside = Math.abs(marker - zone) < fish.zone / 2;
      prog = Math.max(0, Math.min(1, prog + (inside ? 0.34 : -0.12) * dt));
      setView({ marker, zone, prog, left });
      if (prog >= 1) return finishCast(fish);
      if (left <= 0 || prog <= 0) return finishCast(null);
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    if (cast >= CASTS && (phase === "caught" || phase === "lost")) {
      const t = setTimeout(() => {
        setPhase("over");
        setResult(arcadeReward("fishing", score));
      }, 1400);
      return () => clearTimeout(t);
    }
  }, [cast, phase, score]);

  const again = () => {
    setCast(0);
    setScore(0);
    setCatches([]);
    setResult(null);
    setPhase("idle");
  };

  const lv = islandLevel(s.xp);
  const best = mounted ? s.arcade.best.fishing || 0 : 0;
  const bobberDip = phase === "bite";
  return (
    <div className="max-w-xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <BackLink href="/island/arcade" label="Bãi biển" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold leading-tight">Câu cá chiều</h1>
          <p className="text-sm font-semibold text-[#6B4A30]">Thả cần, chờ phao chìm thì bấm “Kéo!”, rồi nhấn giữ để giữ dây trong vùng xanh. {CASTS} lần thả mỗi ván.</p>
        </div>
      </div>
      {mounted && lv.level < BEACH_LEVEL ? (
        <BeachLocked level={lv.level} pct={lv.pct} />
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              ["Lần thả", `${Math.min(cast + (phase === "wait" || phase === "bite" || phase === "reel" ? 1 : 0), CASTS)}/${CASTS}`],
              ["Điểm", score],
              ["Kỷ lục", Math.max(best, score)],
              ["Vỏ sò hôm nay", mounted ? `${arcadeToday(s, today())}/${arcadeCap(s)}` : "0/30"],
            ].map(([l, v]) => (
              <div key={l as string} className="clay rounded-[14px] bg-white px-2 py-1.5">
                <div className="font-baloo font-extrabold text-lg leading-none">{v}</div>
                <div className="text-[10px] font-bold text-[#6B4A30] mt-0.5">{l}</div>
              </div>
            ))}
          </div>

          <div className="relative w-full aspect-[4/3] rounded-[24px] overflow-hidden select-none" style={{ border: "3px solid #8B5E3C", boxShadow: "0 5px 0 #8B5E3C", touchAction: "none" }}>
            {/* Trời chiều + biển */}
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,#F7B37A 0%,#F4C6A0 32%,#9FD3E6 46%,#5FB0CF 100%)" }} />
            <div className="absolute left-1/2 -translate-x-1/2 rounded-full" style={{ top: "18%", width: "18%", aspectRatio: "1", background: "#FFE39A", boxShadow: "0 0 40px #FFD27A" }} />
            <div className="absolute inset-x-0" style={{ top: "44%", height: 3, background: "rgba(255,255,255,.6)" }} />
            {/* Cầu tàu */}
            <div className="absolute left-0 bottom-0 w-[38%] h-[22%]" style={{ background: "repeating-linear-gradient(90deg,#C9925C 0 18px,#B98250 18px 36px)", borderTop: "3px solid #8B5E3C" }} />
            {/* Dây + phao */}
            {phase !== "idle" && phase !== "over" && (
              <>
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 75" preserveAspectRatio="none">
                  <path d={`M30 58 Q 50 ${bobberDip ? 52 : 46} 66 ${bobberDip ? 54 : 49}`} stroke="#4A3222" strokeWidth="0.4" fill="none" />
                </svg>
                <div className={cx("absolute w-4 h-6 -translate-x-1/2 rounded-full", phase === "wait" && "anim-floaty")} style={{ left: "66%", top: bobberDip ? "70%" : "63%", background: "linear-gradient(180deg,#E86F5A 50%,#FFFFFF 50%)", border: "2px solid #4A3222", transition: "top .15s" }} />
                {bobberDip && <div className="absolute -translate-x-1/2 font-baloo font-extrabold text-3xl text-white anim-pop" style={{ left: "66%", top: "48%", textShadow: "0 2px 0 #4A3222" }}>!</div>}
              </>
            )}
            {/* Thanh kéo cá */}
            {phase === "reel" && fish && (
              <div data-zone={view.zone.toFixed(3)} data-marker={view.marker.toFixed(3)} className="cci-reel absolute right-3 top-3 bottom-3 w-9 rounded-[12px] bg-white/80 border-2 border-[#4A3222] overflow-hidden" aria-label="Giữ vạch trong vùng xanh">
                <div className="absolute inset-x-0 bg-[#9CCB6A]" style={{ height: `${fish.zone * 100}%`, bottom: `${(view.zone - fish.zone / 2) * 100}%` }} />
                <div className="absolute inset-x-0 h-1.5 bg-[#C8553D]" style={{ bottom: `calc(${view.marker * 100}% - 3px)` }} />
              </div>
            )}
            {phase === "reel" && (
              <div className="absolute left-3 right-16 top-3">
                <div className="h-3 rounded-full bg-white/70 border-2 border-[#4A3222] overflow-hidden">
                  <div className="h-full bg-[#3F7A34]" style={{ width: `${view.prog * 100}%` }} />
                </div>
                <div className="text-xs font-extrabold text-white mt-0.5" style={{ textShadow: "0 1px 0 #4A3222" }}>
                  Giữ vạch đỏ trong vùng xanh · {Math.ceil(view.left)}s
                </div>
              </div>
            )}
            {(phase === "caught" || phase === "lost") && (
              <div className="absolute inset-x-0 top-[12%] flex justify-center px-3">
                {phase === "caught" && catches.length > 0 ? (
                  <button type="button" data-sfx="none" onClick={() => speak(catches[catches.length - 1].en, { who: "you" })} className="rounded-[18px] bg-white border-[3px] border-[#8B5E3C] px-4 py-2 flex items-center gap-3 anim-pop">
                    <FishArt color={catches[catches.length - 1].color} />
                    <span className="text-left">
                      <span className="block font-baloo font-extrabold text-lg leading-tight">
                        {catches[catches.length - 1].en} <Volume2 className="inline w-4 h-4 text-[#3F7A34]" />
                      </span>
                      <span className="block text-xs font-bold text-[#6B4A30]">
                        {catches[catches.length - 1].vi} · +{catches[catches.length - 1].pts}
                      </span>
                    </span>
                  </button>
                ) : (
                  <span className="rounded-[18px] bg-white/90 border-[3px] border-[#8B5E3C] px-4 py-2 font-extrabold anim-pop">Cá chạy mất rồi! Thử lại nhé.</span>
                )}
              </div>
            )}
            {phase === "over" && <GameOver title={`Bắt được ${catches.length}/${CASTS} con`} score={score} result={result} onAgain={again} />}
          </div>

          <div className="flex justify-center">
            {phase === "reel" ? (
              <button
                type="button"
                data-sfx="none"
                className="cci-btn cci-btn-primary cci-btn-big select-none"
                onPointerDown={() => (holding.current = true)}
                onPointerUp={() => (holding.current = false)}
                onPointerLeave={() => (holding.current = false)}
                onPointerCancel={() => (holding.current = false)}
                onKeyDown={(e) => e.key === " " && (holding.current = true)}
                onKeyUp={(e) => e.key === " " && (holding.current = false)}
              >
                Nhấn giữ để kéo
              </button>
            ) : phase === "wait" || phase === "bite" ? (
              <button type="button" data-sfx="none" className={cx("cci-btn cci-btn-big", phase === "bite" && "cci-btn-primary")} onClick={hook}>
                {phase === "bite" ? "Kéo!" : "Chờ phao chìm…"}
              </button>
            ) : phase !== "over" && cast < CASTS ? (
              <button type="button" className="cci-btn cci-btn-primary cci-btn-big" onClick={throwLine}>
                Thả cần
              </button>
            ) : null}
          </div>
          {catches.length > 0 && (
            <p className="text-xs font-semibold text-[#6B4A30] text-center">
              Đã bắt: {catches.map((c) => c.en).join(", ")}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function FishArt({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 60 36" width="54" height="32" aria-hidden>
      <path d="M44 18 L58 6 L56 30 Z" fill={color} stroke="#4A3222" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="26" cy="18" rx="22" ry="13" fill={color} stroke="#4A3222" strokeWidth="2" />
      <circle cx="13" cy="15" r="2.6" fill="#4A3222" />
      <path d="M24 9 q4 9 0 18" stroke="#4A3222" strokeWidth="1.5" fill="none" opacity=".5" />
    </svg>
  );
}
