"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { BackLink, cx } from "@/components/island/ui";
import { BeachLocked, GameOver } from "@/components/island/beach-ui";
import { BEACH_LEVEL, arcadeCap, arcadeToday } from "@/lib/island/beach";
import { CHAPTERS } from "@/lib/island/curriculum";
import { arcadeReward, getIsland, islandLevel, today, useIsland } from "@/lib/island/progress";
import { speak } from "@/lib/island/speech";
import { sfx } from "@/lib/island/sfx";

type Card = { k: number; pair: number; text: string; en: boolean };
const PAIRS = 8;

/** 8 cặp từ: ưu tiên từ trong Sổ từ (đang ôn), thiếu thì lấy từ các chương đầu. */
function makeDeck(): { cards: Card[]; words: { en: string; vi: string }[] } {
  const s = getIsland();
  const mine = Object.values(s.words).map((w) => ({ en: w.en, vi: w.vi }));
  const pool = [...mine, ...CHAPTERS.slice(0, 4).flatMap((c) => c.words.map((w) => ({ en: w.en, vi: w.vi })))];
  const seen = new Set<string>();
  const uniq = pool.filter((w) => w.en.length <= 18 && w.vi.length <= 26 && !seen.has(w.en) && seen.add(w.en));
  const words = uniq.sort(() => Math.random() - 0.5).slice(0, PAIRS);
  const cards = words.flatMap((w, i) => [
    { k: 0, pair: i, text: w.en, en: true },
    { k: 0, pair: i, text: w.vi, en: false },
  ]);
  return { cards: cards.sort(() => Math.random() - 0.5).map((c, k) => ({ ...c, k })), words };
}

export default function MemoryPage() {
  const s = useIsland();
  const [mounted, setMounted] = useState(false);
  const [deck, setDeck] = useState<Card[]>([]);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [t0, setT0] = useState(0);
  const [secs, setSecs] = useState(0);
  const [result, setResult] = useState<{ shells: number; best: boolean; capped: boolean } | null>(null);
  const [score, setScore] = useState(0);

  const reset = () => {
    setDeck(makeDeck().cards);
    setOpen([]);
    setMatched(new Set());
    setMoves(0);
    setT0(0);
    setSecs(0);
    setResult(null);
    setScore(0);
  };
  useEffect(() => {
    setMounted(true);
    reset();
  }, []);
  const done = deck.length > 0 && matched.size === PAIRS;
  useEffect(() => {
    if (!t0 || done) return;
    const t = setInterval(() => setSecs(Math.round((Date.now() - t0) / 1000)), 500);
    return () => clearInterval(t);
  }, [t0, done]);

  const flip = (k: number) => {
    const c = deck[k];
    if (!c || open.includes(k) || matched.has(c.pair) || open.length >= 2 || done) return;
    if (!t0) setT0(Date.now());
    sfx.flip();
    const next = [...open, k];
    setOpen(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next.map((i) => deck[i]);
      if (a.pair === b.pair) {
        setTimeout(() => {
          setMatched((m) => {
            const n = new Set(m);
            n.add(a.pair);
            if (n.size === PAIRS) {
              const sec = Math.round((Date.now() - (t0 || Date.now())) / 1000);
              const sc = Math.max(100, 1200 - (moves + 1 - PAIRS) * 40 - sec * 4);
              setScore(sc);
              setResult(arcadeReward("memory", sc));
              sfx.win();
            }
            return n;
          });
          setOpen([]);
          sfx.correct();
          speak((a.en ? a : b).text, { who: "you" });
        }, 350);
      } else setTimeout(() => setOpen([]), 900);
    }
  };

  const lv = islandLevel(s.xp);
  const best = mounted ? s.arcade.best.memory || 0 : 0;
  return (
    <div className="max-w-xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <BackLink href="/island/arcade" label="Bãi biển" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold leading-tight">Lật thẻ trí nhớ</h1>
          <p className="text-sm font-semibold text-[#6B4A30]">Lật 2 thẻ: từ tiếng Anh và nghĩa của nó là một cặp. Càng ít lượt, càng nhanh, càng nhiều điểm.</p>
        </div>
      </div>
      {mounted && lv.level < BEACH_LEVEL ? (
        <BeachLocked level={lv.level} pct={lv.pct} />
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              ["Lượt", moves],
              ["Giây", secs],
              ["Kỷ lục", Math.max(best, score)],
              ["Vỏ sò hôm nay", mounted ? `${arcadeToday(s, today())}/${arcadeCap(s)}` : "0/30"],
            ].map(([l, v]) => (
              <div key={l as string} className="clay rounded-[14px] bg-white px-2 py-1.5">
                <div className="font-baloo font-extrabold text-lg leading-none">{v}</div>
                <div className="text-[10px] font-bold text-[#6B4A30] mt-0.5">{l}</div>
              </div>
            ))}
          </div>
          <div className="relative grid grid-cols-4 gap-2 p-2 rounded-[22px]" style={{ background: "linear-gradient(180deg,#E3DAF5,#C9B8EC)", border: "3px solid #8E5BB5", boxShadow: "0 5px 0 #8E5BB5" }}>
            {deck.map((c, k) => {
              const up = open.includes(k) || matched.has(c.pair);
              return (
                <button
                  key={k}
                  type="button"
                  data-sfx="none"
                  onClick={() => flip(k)}
                  aria-label={up ? c.text : "Thẻ úp"}
                  className={cx("aspect-[3/4] rounded-[14px] border-[2.5px] flex items-center justify-center p-1 text-center transition-transform active:scale-95", up ? "bg-white border-[#8B5E3C]" : "border-[#6B3FA6]", matched.has(c.pair) && "opacity-60")}
                  style={up ? undefined : { background: "repeating-linear-gradient(45deg,#B49AE0 0 8px,#A387D6 8px 16px)" }}
                >
                  {up && <span className={cx("font-extrabold leading-tight break-words", c.en ? "font-baloo text-[15px] text-[#4A3222]" : "text-[12px] text-[#6B4A30]")}>{c.text}</span>}
                </button>
              );
            })}
            {done && <GameOver title={`Xong trong ${moves} lượt, ${secs} giây`} score={score} result={result} onAgain={reset} />}
          </div>
          <button type="button" className="cci-btn self-center !min-h-[38px] !text-sm" onClick={reset}>
            <RotateCcw className="w-4 h-4" /> Xáo lại
          </button>
        </>
      )}
    </div>
  );
}
