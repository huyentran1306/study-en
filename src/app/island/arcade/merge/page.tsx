"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Volume2, Waves } from "lucide-react";
import { BackLink, cx } from "@/components/island/ui";
import { SEA_TIERS, SeaTierArt, TrashArt } from "@/components/island/arcade-art";
import { BeachLocked, GameOver } from "@/components/island/beach-ui";
import { BEACH_LEVEL, arcadeCap, arcadeToday } from "@/lib/island/beach";
import { MAX_TIER, SIZE, TIDE_EVERY, TRASH, move, newGame, validGame, type Dir, type MergeGame, type Tile } from "@/lib/island/arcade/merge";
import { arcadeReward, islandLevel, today, useIsland } from "@/lib/island/progress";
import { speak } from "@/lib/island/speech";
import { sfx } from "@/lib/island/sfx";

const SAVE_KEY = "cci-merge-game";

export default function SeaMergePage() {
  const s = useIsland();
  const [mounted, setMounted] = useState(false);
  const [game, setGame] = useState<MergeGame | null>(null);
  const [ghosts, setGhosts] = useState<Tile[]>([]);
  const [word, setWord] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [result, setResult] = useState<{ shells: number; best: boolean; capped: boolean } | null>(null);
  const gameRef = useRef<MergeGame | null>(null);
  gameRef.current = game;
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      const g = raw ? JSON.parse(raw) : null;
      setGame(validGame(g) && !g.over ? g : newGame());
    } catch {
      setGame(newGame());
    }
  }, []);
  useEffect(() => {
    if (game) localStorage.setItem(SAVE_KEY, JSON.stringify(game));
  }, [game]);

  const finish = useCallback((g: MergeGame) => {
    setResult(arcadeReward("merge", g.score));
    sfx.timeUp();
  }, []);

  const doMove = useCallback(
    (dir: Dir) => {
      const g = gameRef.current;
      if (!g || g.over) return;
      const r = move(g, dir);
      if (!r.moved) return;
      setGhosts(r.ghosts);
      setTimeout(() => setGhosts([]), 130);
      setGame(r.game);
      if (r.made.length) sfx.pop();
      if (r.cleaned) {
        sfx.coin();
        setNote(`Dọn ${r.cleaned} chai rác! +${r.cleaned * 24}`);
      } else if (r.tide) {
        sfx.splash();
        setNote("Sóng triều đẩy rác vào! Gộp con bên cạnh để dọn.");
      }
      const best = Math.max(...r.made, -1);
      if (best > g.top) {
        setWord(best);
        setTimeout(() => speak(SEA_TIERS[best].en, { who: "you" }), 150);
      }
      if (r.game.over) setTimeout(() => finish(r.game), 450);
    },
    [finish],
  );

  // Bàn phím
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", a: "left", d: "right", w: "up", s: "down" };
      const d = map[e.key];
      if (!d) return;
      e.preventDefault();
      doMove(d);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doMove]);

  // Vuốt
  const start = useRef<{ x: number; y: number } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY };
  };
  const onUp = (e: React.PointerEvent) => {
    const st = start.current;
    start.current = null;
    if (!st) return;
    const dx = e.clientX - st.x,
      dy = e.clientY - st.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    doMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
  };

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(null), 2600);
    return () => clearTimeout(t);
  }, [note]);

  const restart = () => {
    const g = gameRef.current;
    if (g && !g.over && g.score > 0 && !result) arcadeReward("merge", g.score);
    setResult(null);
    setWord(null);
    setGame(newGame());
  };

  const lv = islandLevel(s.xp);
  const best = mounted ? s.arcade.best.merge || 0 : 0;
  const cap = mounted ? arcadeCap(s) : 30;
  const got = mounted ? arcadeToday(s, today()) : 0;

  return (
    <div className="max-w-xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <BackLink href="/island/arcade" label="Bãi biển" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold leading-tight">Ghép sinh vật biển</h1>
          <p className="text-sm font-semibold text-[#6B4A30]">Vuốt (hoặc phím mũi tên) để dồn. Hai con giống nhau chạm nhau thì gộp lên bậc mới.</p>
        </div>
      </div>

      {mounted && lv.level < BEACH_LEVEL ? (
        <BeachLocked level={lv.level} pct={lv.pct} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Điểm" value={game?.score ?? 0} />
            <Stat label="Kỷ lục" value={Math.max(best, game?.score ?? 0)} />
            <Stat label="Vỏ sò hôm nay" value={`${got}/${cap}`} />
          </div>

          <div className="flex items-center gap-2 min-h-[44px]">
            {word !== null ? (
              <button type="button" data-sfx="none" onClick={() => speak(SEA_TIERS[word].en, { who: "you" })} className="flex-1 min-w-0 rounded-[14px] bg-white border-2 border-[#9CC77F] px-3 py-1.5 text-left anim-pop flex items-center gap-2">
                <span className="w-8 h-8 shrink-0">
                  <SeaTierArt tier={word} />
                </span>
                <span className="min-w-0">
                  <span className="block font-extrabold leading-tight truncate">
                    Mới: {SEA_TIERS[word].en} <Volume2 className="inline w-3.5 h-3.5 text-[#3F7A34]" />
                  </span>
                  <span className="block text-xs font-semibold text-[#6B4A30]">{SEA_TIERS[word].vi}</span>
                </span>
              </button>
            ) : (
              <span className="flex-1 text-xs font-semibold text-[#6B4A30] flex items-center gap-1.5">
                <Waves className="w-4 h-4 shrink-0 text-[#2F8FB0]" /> Cứ {TIDE_EVERY} lượt có sóng đẩy chai rác vào. Gộp con ngay cạnh để dọn.
              </span>
            )}
            <button type="button" className="cci-btn !min-h-[40px] !px-3 !text-sm shrink-0" onClick={restart}>
              <Plus className="w-4 h-4" /> Ván mới
            </button>
          </div>

          <div
            ref={boardRef}
            onPointerDown={onDown}
            onPointerUp={onUp}
            onPointerCancel={() => (start.current = null)}
            className="relative w-full max-w-[460px] mx-auto aspect-square rounded-[24px] p-[2.5%] select-none"
            style={{ background: "linear-gradient(180deg,#8FD0E3,#5FB0CF)", border: "3px solid #2F7F9E", boxShadow: "0 5px 0 #2F7F9E", touchAction: "none" }}
            aria-label="Bảng ghép sinh vật biển"
          >
            <div className="relative w-full h-full" style={{ containerType: "inline-size" }}>
              {Array.from({ length: SIZE * SIZE }, (_, i) => (
                <div key={i} className="absolute rounded-[14px] bg-white/30" style={cellStyle(Math.floor(i / SIZE), i % SIZE)} />
              ))}
              {[...ghosts, ...(game?.tiles || [])].map((t) => (
                <TileView key={`${t.id}`} t={t} />
              ))}
            </div>
            {game?.over && <GameOver title="Hết nước đi" score={game.score} result={result} onAgain={restart} />}
          </div>
          {note && <p className="text-center text-sm font-bold text-[#2C5A25] anim-pop">{note}</p>}

          <details className="rounded-[16px] bg-white/70 border-2 border-[#EAD9B8] px-3 py-2">
            <summary className="font-extrabold text-sm cursor-pointer">Các bậc sinh vật ({MAX_TIER + 1})</summary>
            <ul className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
              {SEA_TIERS.map((t, i) => (
                <li key={t.en} className="flex flex-col items-center text-center">
                  <span className="w-10 h-10 rounded-[10px] p-0.5" style={{ background: t.bg }}>
                    <SeaTierArt tier={i} />
                  </span>
                  <span className="text-[11px] font-extrabold leading-tight mt-0.5">{t.en}</span>
                  <span className="text-[10px] font-semibold text-[#6B4A30] leading-tight">{t.vi}</span>
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </div>
  );
}

const GAP = 2.2; // % khoảng cách giữa các ô
function cellStyle(r: number, c: number): React.CSSProperties {
  const size = (100 - GAP * (SIZE - 1)) / SIZE;
  return { width: `${size}%`, height: `${size}%`, left: `${c * (size + GAP)}%`, top: `${r * (size + GAP)}%` };
}

function TileView({ t }: { t: Tile }) {
  const trash = t.v === TRASH;
  const tier = SEA_TIERS[Math.max(0, t.v)];
  return (
    <div className="absolute transition-[left,top] duration-[120ms] ease-out" style={{ ...cellStyle(t.r, t.c), zIndex: t.merged ? 3 : 2 }}>
      <div
        className={cx("w-full h-full rounded-[14px] flex flex-col items-center justify-center overflow-hidden", t.merged && "mg-pop", t.fresh && "mg-in")}
        style={{ background: trash ? "#E7EEF0" : tier.bg, border: "2.5px solid #8B5E3C", boxShadow: "0 3px 0 rgba(139,94,60,.55)" }}
      >
        <div className="w-[68%] h-[68%]">{trash ? <TrashArt /> : <SeaTierArt tier={t.v} />}</div>
        <span className="font-baloo font-extrabold leading-none text-[#4A3222] truncate max-w-full px-1" style={{ fontSize: "clamp(8px, 2.6cqw, 13px)" }}>
          {trash ? "trash" : tier.en}
        </span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="clay rounded-[16px] bg-white px-3 py-2 text-center">
      <div className="font-baloo font-extrabold text-xl leading-none">{value}</div>
      <div className="text-[11px] font-bold text-[#6B4A30] mt-0.5">{label}</div>
    </div>
  );
}
