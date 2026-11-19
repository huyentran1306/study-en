"use client";

// Giao diện Đảo Cát Vui: bảng ô đất (xây / nâng cấp / khai hoang), thẻ kết thúc ván mini game, khoá cấp.
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpCircle, Gamepad2, IceCreamCone, Library, Lock, RotateCcw, Shell, Shovel, TreePalm, Trophy, Volleyball, X } from "lucide-react";
import { cx } from "./ui";
import { BEACH_LEVEL, BUILD_KINDS, PLOTS, buildKind, plotStatus, upgradeCost, type BuildType } from "@/lib/island/beach";
import { buildPlot, clearPlot, islandLevel, shells, upgradePlot, useIsland } from "@/lib/island/progress";
import { sfx } from "@/lib/island/sfx";

export const BUILD_ICON: Record<BuildType, React.ElementType> = { icecream: IceCreamCone, library: Library, coconut: TreePalm, volley: Volleyball };

export const PLOT_NAME: Record<string, string> = { p1: "Ô đất 1", p2: "Ô đất 2", p3: "Ô đất 3", p4: "Ô đất 4" };

function useEsc(onClose: () => void) {
  useEffect(() => {
    const f = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [onClose]);
}

/** Bảng một ô đất. */
export function PlotPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const s = useIsland();
  const [msg, setMsg] = useState<string | null>(null);
  useEsc(onClose);
  const level = islandLevel(s.xp).level;
  const spec = PLOTS.find((p) => p.id === id)!;
  const st = plotStatus(s, level, id);
  const money = shells(s);
  const plot = s.plots[id];
  const k = buildKind(plot?.t);
  const act = (r: { ok: true } | { ok: false; reason: string }, okMsg: string) => {
    if (r.ok) {
      sfx.unlock();
      setMsg(okMsg);
      import("@/lib/confetti").then((c) => c.fireCelebration()).catch(() => {});
    } else {
      sfx.wrong();
      setMsg(r.reason);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-3 bg-[#4A3222]/40" onClick={onClose} role="dialog" aria-modal="true" aria-label={PLOT_NAME[id]}>
      <div className="cci-card-wood w-full max-w-md p-5 flex flex-col gap-3 anim-pop max-h-[90dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#C96A2B]">Đảo Cát Vui · {PLOT_NAME[id]}</div>
            <h2 className="text-2xl font-extrabold leading-tight">{k ? `${k.name} · bậc ${plot!.lv}` : st === "wild" ? "Đất hoang" : st === "locked" ? "Chưa mở" : "Đất trống"}</h2>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF1C7] border-2 border-[#E6C46A] px-2.5 py-1 font-baloo font-extrabold text-sm" title="Vỏ sò của bạn">
            <Shell className="w-4 h-4 text-[#C99A1E]" /> {money}
          </span>
          <button type="button" data-sfx="close" onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#F3E6CC]" aria-label="Đóng">
            <X className="w-5 h-5" />
          </button>
        </div>

        {st === "locked" && (
          <p className="font-semibold text-[#6B4A30] flex items-start gap-2">
            <Lock className="w-4 h-4 mt-1 shrink-0" /> Ô này mở ở cấp đảo {spec.level}. Bạn đang ở cấp {level}, học thêm để lên cấp nhé.
          </p>
        )}

        {st === "wild" && (
          <>
            <p className="font-semibold text-[#6B4A30]">Cỏ dại và đá còn đầy. Khai hoang xong là xây được công trình.</p>
            <button type="button" className="cci-btn cci-btn-primary justify-center" disabled={money < spec.clear} onClick={() => act(clearPlot(id), "Đã khai hoang xong! Giờ chọn công trình để xây nhé.")}>
              <Shovel className="w-4 h-4" /> Khai hoang · {spec.clear} vỏ sò
            </button>
          </>
        )}

        {st === "empty" && (
          <>
            <p className="text-sm font-semibold text-[#6B4A30]">Chọn công trình. Mỗi ngày bạn học, công trình làm ra vỏ sò, kèm một ưu đãi nhỏ.</p>
            <ul className="flex flex-col gap-2">
              {BUILD_KINDS.map((b) => {
                const Icon = BUILD_ICON[b.id];
                return (
                  <li key={b.id} className="rounded-[16px] bg-white border-2 border-[#EAD9B8] p-2.5 flex items-center gap-3">
                    <span className="gem w-11 h-11 shrink-0 rounded-[14px] flex items-center justify-center text-white" style={{ ["--tone" as string]: b.tone }}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-baloo font-extrabold leading-tight">
                        {b.name} <span className="text-xs font-bold text-[#3F7A34]">{b.en}</span>
                      </span>
                      <span className="block text-xs font-semibold text-[#6B4A30] leading-snug">
                        +{b.income[0]} vỏ sò/ngày học · {b.perk(1)}
                      </span>
                    </span>
                    <button type="button" className={cx("cci-btn !min-h-[38px] !px-3 !text-sm shrink-0", money >= b.cost && "cci-btn-primary")} disabled={money < b.cost} onClick={() => act(buildPlot(id, b.id), `Đã xây ${b.name.toLowerCase()}!`)}>
                      Xây · {b.cost}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {st === "built" && k && plot && (
          <>
            <div className="rounded-[16px] bg-white border-2 border-[#EAD9B8] p-3 flex flex-col gap-1">
              <span className="text-sm font-bold">Thu nhập: +{k.income[plot.lv - 1]} vỏ sò mỗi ngày học</span>
              <span className="text-sm font-bold">Ưu đãi: {k.perk(plot.lv)}</span>
              <span className="flex gap-1 mt-1" aria-label={`Bậc ${plot.lv}/3`}>
                {[1, 2, 3].map((i) => (
                  <span key={i} className={cx("h-2 flex-1 rounded-full", i <= plot.lv ? "bg-[#6FAE4F]" : "bg-[#EAD9B8]")} />
                ))}
              </span>
            </div>
            {plot.lv < 3 ? (
              <button type="button" className={cx("cci-btn justify-center", money >= upgradeCost(k, plot.lv + 1) && "cci-btn-primary")} disabled={money < upgradeCost(k, plot.lv + 1)} onClick={() => act(upgradePlot(id), `Đã nâng ${k.name.toLowerCase()} lên bậc ${plot.lv + 1}!`)}>
                <ArrowUpCircle className="w-4 h-4" /> Nâng lên bậc {plot.lv + 1} · {upgradeCost(k, plot.lv + 1)} vỏ sò (+{k.income[plot.lv]}/ngày)
              </button>
            ) : (
              <p className="text-sm font-bold text-[#2C5A25]">Đã nâng cấp tối đa.</p>
            )}
          </>
        )}
        {msg && <p className="text-sm font-bold text-[#2C5A25]">{msg}</p>}
      </div>
    </div>
  );
}

/** Màn chưa đủ cấp để vào Đảo Cát Vui. */
export function BeachLocked({ level, pct }: { level: number; pct: number }) {
  return (
    <div className="cci-card-wood p-5 flex flex-col gap-3 items-center text-center">
      <Lock className="w-8 h-8 text-[#8B6B48]" />
      <h2 className="text-xl font-extrabold">Đảo Cát Vui mở ở cấp đảo {BEACH_LEVEL}</h2>
      <p className="font-semibold text-[#6B4A30]">
        Bạn đang ở cấp {level} ({pct}%). Mỗi cấp cần 250 XP: học bài, ôn thẻ, tám chuyện đều được XP.
      </p>
      <Link href="/island" className="cci-btn cci-btn-primary">
        Về đảo học tiếp <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

/** Thẻ kết thúc ván: điểm, kỷ lục, vỏ sò nhận được. */
export function GameOver({ title, score, result, onAgain }: { title: string; score: number; result: { shells: number; best: boolean; capped: boolean } | null; onAgain: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-3 bg-[#FBF3E2]/80 backdrop-blur-[2px] rounded-[inherit]">
      <div className="cci-card-wood w-full max-w-xs p-5 flex flex-col items-center gap-2 text-center anim-pop">
        <div className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#C96A2B]">{title}</div>
        <div className="font-baloo font-extrabold text-4xl leading-none">{score}</div>
        <div className="text-sm font-bold text-[#6B4A30]">điểm</div>
        {result?.best && (
          <div className="inline-flex items-center gap-1 rounded-full bg-[#F2C14E] border-2 border-[#4A3222] px-3 py-0.5 text-sm font-extrabold">
            <Trophy className="w-4 h-4" /> Kỷ lục mới!
          </div>
        )}
        {result && (
          <div className="font-baloo font-extrabold text-lg inline-flex items-center gap-1 text-[#2C5A25]">
            +{result.shells} <Shell className="w-5 h-5 text-[#C99A1E]" />
          </div>
        )}
        {result?.capped && <p className="text-xs font-semibold text-[#6B4A30]">Đã chạm trần vỏ sò mini game hôm nay. Chơi tiếp vẫn vui, mai nhận tiếp nhé!</p>}
        <div className="flex gap-2 mt-1">
          <button type="button" className="cci-btn cci-btn-primary" onClick={onAgain}>
            <RotateCcw className="w-4 h-4" /> Chơi lại
          </button>
          <Link href="/island/arcade" className="cci-btn">
            Bãi biển
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Thanh dưới khi máy quay đang ở Đảo Cát Vui. */
export function BeachBar({ open, level, got, cap, income, onHome }: { open: boolean; level: number; got: number; cap: number; income: number; onHome: () => void }) {
  return (
    <div className="cci-h-bar order-1 hud:absolute hud:left-1/2 hud:-translate-x-1/2 hud:bottom-4 hud:z-10 hud:w-[min(780px,calc(100%-12rem))] flex items-center gap-3 rounded-[24px] clay p-2 pl-2.5">
      <button type="button" data-sfx="whoosh" onClick={onHome} className="shrink-0 flex flex-col items-center justify-center gap-0.5 rounded-[16px] h-[62px] w-[62px] bg-[#F3E6CC] hover:bg-[#EAD9B8] transition-colors" title="Về đảo nhà" aria-label="Về đảo nhà">
        <TreePalm className="w-6 h-6 text-[#3F7A34]" />
        <span className="font-baloo font-extrabold text-[11px] leading-none">Đảo nhà</span>
      </button>
      <div className="flex-1 min-w-0">
        <span className="block text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#C96A2B]">Đảo Cát Vui</span>
        {open ? (
          <>
            <span className="block font-extrabold text-[15px] sm:text-[16px] leading-snug mt-0.5 truncate">Chơi game, xây công trình</span>
            <span className="block text-[13px] font-semibold text-[#6B4A30] leading-snug truncate">
              Trò chơi hôm nay {got}/{cap} vỏ sò · công trình +{income}
            </span>
          </>
        ) : (
          <>
            <span className="block font-extrabold text-[15px] sm:text-[16px] leading-snug mt-0.5">Mở ở cấp đảo {BEACH_LEVEL}</span>
            <span className="block text-[13px] font-semibold text-[#6B4A30] leading-snug truncate">Bạn đang ở cấp {level}. Học thêm để mở cầu nhé!</span>
          </>
        )}
      </div>
      {open && (
        <Link
          href="/island/arcade"
          data-sfx="whoosh"
          className="gloss shrink-0 flex flex-col items-center justify-center rounded-[18px] h-[62px] px-4 min-w-[104px] text-white hover:-translate-y-0.5 active:translate-y-0.5 transition-transform"
          style={{ background: "linear-gradient(180deg,#F29A4E,#C96A2B)", border: "3px solid #A4521D", boxShadow: "0 4px 0 #A4521D" }}
        >
          <Gamepad2 className="w-4 h-4" />
          <span className="font-baloo font-extrabold text-[17px] leading-tight flex items-center gap-1 mt-0.5">
            Chơi <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      )}
    </div>
  );
}
