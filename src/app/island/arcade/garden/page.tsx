"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Flag, Infinity as InfinityIcon, Sparkles, Timer } from "lucide-react";
import { BackLink, cx } from "@/components/island/ui";
import { PRODUCE, ProduceArt } from "@/components/island/arcade-art";
import { BeachLocked, GameOver } from "@/components/island/beach-ui";
import { BEACH_LEVEL, arcadeCap, arcadeToday } from "@/lib/island/beach";
import { H, W, adjacent, newGrid, trySwap, type Cell, type Grid } from "@/lib/island/arcade/garden";
import { arcadeReward, islandLevel, today, useIsland } from "@/lib/island/progress";
import { speak } from "@/lib/island/speech";
import { sfx } from "@/lib/island/sfx";

type Mode = "relax" | "timed";
const TIME = 90;

export default function GardenMatchPage() {
  const s = useIsland();
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>("relax");
  const [grid, setGrid] = useState<Grid | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [popping, setPopping] = useState<Set<number>>(new Set());
  const [shake, setShake] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(TIME);
  const [over, setOver] = useState(false);
  const [result, setResult] = useState<{ shells: number; best: boolean; capped: boolean } | null>(null);
  const [floats, setFloats] = useState<{ id: number; text: string; x: number; y: number }[]>([]);
  const gridRef = useRef<Grid | null>(null);
  gridRef.current = grid;
  const scoreRef = useRef(0);
  scoreRef.current = score;

  useEffect(() => {
    setMounted(true);
    setGrid(newGrid());
  }, []);

  const end = useCallback(() => {
    setOver(true);
    setResult(arcadeReward("garden", scoreRef.current));
    sfx.timeUp();
  }, []);

  // Đếm giờ (chế độ 90 giây)
  useEffect(() => {
    if (mode !== "timed" || over || !mounted) return;
    if (left <= 0) {
      end();
      return;
    }
    const t = setTimeout(() => setLeft((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [mode, left, over, mounted, end]);

  const restart = (m: Mode = mode) => {
    if (!over && scoreRef.current > 0) arcadeReward("garden", scoreRef.current);
    setMode(m);
    setGrid(newGrid());
    setScore(0);
    setLeft(TIME);
    setOver(false);
    setResult(null);
    setSel(null);
  };

  const floatText = (text: string, at: number) => {
    const id = Math.random();
    setFloats((f) => [...f, { id, text, x: ((at % W) + 0.5) * (100 / W), y: (Math.floor(at / W) + 0.5) * (100 / H) }]);
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1100);
  };

  const swap = async (a: number, b: number) => {
    const g = gridRef.current;
    if (!g || busy || over) return;
    const res = trySwap(g, a, b);
    if (!res.ok) {
      setShake([a, b]);
      sfx.wrong();
      setTimeout(() => setShake([]), 520);
      return;
    }
    setBusy(true);
    const wait = (ms: number) => new Promise<void>((r) => setTimeout(() => r(), ms));
    for (const st of res.steps) {
      setPopping(new Set(st.cleared));
      if (st.cleared.length) {
        if (st.combo > 1) sfx.combo(st.combo);
        else sfx.pop();
        const kind = st.kind >= 0 ? PRODUCE[st.kind] : null;
        if (kind) floatText(`${kind.en} ×${st.count}${st.combo > 1 ? ` · combo ×${st.combo}` : ""}`, st.cleared[Math.floor(st.cleared.length / 2)]);
        if (kind && (st.combo === 3 || st.count >= 6)) speak(kind.en, { who: "you" });
        await wait(190);
      }
      setPopping(new Set());
      setGrid(st.grid);
      setScore((x) => x + st.gained);
      await wait(260);
    }
    if (res.special) {
      sfx.star();
      floatText(res.special === "rainbow" ? "Rainbow!" : "Stripe!", b);
    }
    setBusy(false);
  };

  // Chạm chọn rồi chạm ô bên cạnh, hoặc vuốt từ một ô
  const down = useRef<{ i: number; x: number; y: number } | null>(null);
  const onDown = (i: number, e: React.PointerEvent) => {
    down.current = { i, x: e.clientX, y: e.clientY };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = down.current;
    if (!d) return;
    const dx = e.clientX - d.x,
      dy = e.clientY - d.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
    down.current = null;
    const r = Math.floor(d.i / W),
      c = d.i % W;
    const to = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? (c < W - 1 ? d.i + 1 : -1) : c > 0 ? d.i - 1 : -1) : dy > 0 ? (r < H - 1 ? d.i + W : -1) : r > 0 ? d.i - W : -1;
    setSel(null);
    if (to >= 0) swap(d.i, to);
  };
  const onUp = (i: number) => {
    if (!down.current) return;
    down.current = null;
    if (sel === null) return setSel(i);
    if (sel === i) return setSel(null);
    if (adjacent(sel, i)) {
      const a = sel;
      setSel(null);
      swap(a, i);
    } else setSel(i);
  };

  const lv = islandLevel(s.xp);
  const best = mounted ? s.arcade.best.garden || 0 : 0;
  const cap = mounted ? arcadeCap(s) : 30;
  const got = mounted ? arcadeToday(s, today()) : 0;

  return (
    <div className="max-w-xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <BackLink href="/island/arcade" label="Bãi biển" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold leading-tight">Ghép 3 vườn rau</h1>
          <p className="text-sm font-semibold text-[#6B4A30]">Đổi chỗ hai ô cạnh nhau. Ghép 4 ra ô sọc, ghép 5 ra ô cầu vồng.</p>
        </div>
      </div>

      {mounted && lv.level < BEACH_LEVEL ? (
        <BeachLocked level={lv.level} pct={lv.pct} />
      ) : (
        <>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-full border-2 border-[#D8BF92] bg-white p-0.5" role="tablist" aria-label="Chế độ chơi">
              {(
                [
                  ["relax", "Thư giãn", InfinityIcon],
                  ["timed", "90 giây", Timer],
                ] as const
              ).map(([m, label, Icon]) => (
                <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => mode !== m && restart(m)} className={cx("rounded-full px-3 py-1 text-sm font-extrabold inline-flex items-center gap-1 whitespace-nowrap", mode === m ? "bg-[#3F7A34] text-white" : "text-[#4A3222]")}>
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>
            {mode === "relax" && !over && (
              <button type="button" className="cci-btn !min-h-[36px] !px-3 !text-sm ml-auto" onClick={end} disabled={busy}>
                <Flag className="w-4 h-4" /> <span className="hidden sm:inline">Nghỉ & nhận vỏ sò</span>
                <span className="sm:hidden">Nghỉ tay</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Stat label="Điểm" value={score} />
            <Stat label={mode === "timed" ? "Còn lại" : "Kỷ lục"} value={mode === "timed" ? `${left}s` : Math.max(best, score)} warn={mode === "timed" && left <= 10} />
            <Stat label="Vỏ sò hôm nay" value={`${got}/${cap}`} />
          </div>

          <div
            className="relative w-full max-w-[460px] mx-auto aspect-square rounded-[24px] p-[2%] select-none overflow-hidden"
            style={{ background: "linear-gradient(180deg,#B9DE8E,#8CC266)", border: "3px solid #4F8A3A", boxShadow: "0 5px 0 #4F8A3A", touchAction: "none" }}
            onPointerMove={onMove}
            aria-label="Vườn ghép 3"
          >
            <div className="relative w-full h-full" style={{ containerType: "inline-size" }}>
              {grid?.map((cell, i) => (
                <CellView key={cell.id} cell={cell} i={i} selected={sel === i} popping={popping.has(i)} shaking={shake.includes(i)} onDown={onDown} onUp={onUp} />
              ))}
              {floats.map((f) => (
                <span key={f.id} className="g3-float absolute pointer-events-none whitespace-nowrap font-baloo font-extrabold text-[#4A3222] rounded-full bg-white/90 border-2 border-[#4A3222] px-2 py-0.5 z-10" style={{ left: `${f.x}%`, top: `${f.y}%`, fontSize: "clamp(11px, 3.4cqw, 16px)" }}>
                  {f.text}
                </span>
              ))}
            </div>
            {over && <GameOver title={mode === "timed" ? "Hết giờ" : "Nghỉ tay"} score={score} result={result} onAgain={() => restart()} />}
          </div>
          <p className="text-xs font-semibold text-[#6B4A30] text-center flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Mỗi lần nổ hiện tên tiếng Anh: {PRODUCE.map((p) => p.en).join(", ")}.
          </p>
        </>
      )}
    </div>
  );
}

function CellView({ cell, i, selected, popping, shaking, onDown, onUp }: { cell: Cell; i: number; selected: boolean; popping: boolean; shaking: boolean; onDown: (i: number, e: React.PointerEvent) => void; onUp: (i: number) => void }) {
  const r = Math.floor(i / W),
    c = i % W;
  const kind = cell.k >= 0 ? PRODUCE[cell.k] : null;
  return (
    <button
      type="button"
      data-sfx="none"
      aria-label={kind ? `${kind.en} (${kind.vi})${cell.s ? " đặc biệt" : ""}` : "cầu vồng"}
      onPointerDown={(e) => onDown(i, e)}
      onPointerUp={() => onUp(i)}
      className="absolute p-[1.5%] transition-[top,left] duration-200"
      style={{ width: `${100 / W}%`, height: `${100 / H}%`, left: `${(c * 100) / W}%`, top: `${(r * 100) / H}%` }}
    >
      <span
        key={`${cell.id}-${cell.drop || 0}`}
        className={cx("relative block w-full h-full rounded-[22%]", cell.drop ? "g3-drop" : "", popping && "g3-out", shaking && "g3-shake")}
        style={{ ["--d" as string]: cell.drop || 0, background: kind ? kind.bg : "#FFFFFF", border: selected ? "3px solid #F2C14E" : "2px solid rgba(74,50,34,.55)", boxShadow: selected ? "0 0 0 3px #4A3222" : "0 2px 0 rgba(74,50,34,.35)" }}
      >
        {cell.s === "rainbow" ? (
          <span className="absolute inset-[14%] rounded-full g3-rainbow border-2 border-[#4A3222]" />
        ) : (
          <span className="absolute inset-[8%]">
            <ProduceArt kind={cell.k} />
          </span>
        )}
        {(cell.s === "row" || cell.s === "col") && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-[22%] pointer-events-none"
            style={{ backgroundImage: `repeating-linear-gradient(${cell.s === "row" ? "0deg" : "90deg"}, rgba(255,255,255,.75) 0 3px, transparent 3px 9px)`, boxShadow: "inset 0 0 0 2px #F2C14E" }}
          />
        )}
      </span>
    </button>
  );
}

function Stat({ label, value, warn = false }: { label: string; value: number | string; warn?: boolean }) {
  return (
    <div className={cx("clay rounded-[16px] bg-white px-3 py-2 text-center", warn && "!bg-[#FFE3D6]")}>
      <div className="font-baloo font-extrabold text-xl leading-none">{value}</div>
      <div className="text-[11px] font-bold text-[#6B4A30] mt-0.5">{label}</div>
    </div>
  );
}
