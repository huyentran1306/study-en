"use client";

import { useEffect, useState } from "react";
import { Expand, Lock, Plus, Shell, Sparkles, Utensils, Volume2, X } from "lucide-react";
import { Avatar, Character } from "@/components/island/character";
import { BackLink, cx } from "@/components/island/ui";
import { SeaCreature } from "@/components/island/farm-art";
import { NextStep } from "@/components/island/journey";
import { EXPAND_COST, MAX_FEED, SPECIES, SPECIES_BY_KIND } from "@/lib/island/farm-data";
import { activeSlot, buySeed, expandPond, feedSlot, food, growth, harvestSlot, islandLevel, shells, useIsland } from "@/lib/island/progress";
import type { FarmKind } from "@/lib/island/state";
import { speak } from "@/lib/island/speech";
import { sfx } from "@/lib/island/sfx";

function fmtLeft(mins: number) {
  if (mins <= 0) return "Đã lớn!";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `còn ${h} giờ ${m > 0 ? `${m} phút` : ""}` : `còn ${m} phút`;
}

const STAGE = ["Giống", "Đang lớn", "Sắp lớn", "Thu hoạch được"];

export default function FarmPage() {
  const s = useIsland();
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0);
  const [picker, setPicker] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [catchInfo, setCatchInfo] = useState<{ kind: FarmKind; earned: number } | null>(null);

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3200);
    return () => clearTimeout(t);
  }, [msg]);

  const wallet = mounted ? shells(s) : 0;
  const feedLeft = mounted ? food(s) : 0;
  const lv = islandLevel(s.xp).level;
  const size = s.farm.size;
  const expandCost = EXPAND_COST[size];
  const firstEmpty = Array.from({ length: size }).findIndex((_, i) => !activeSlot(s, i));

  const buy = (kind: FarmKind, idx: number) => {
    const r = buySeed(kind, idx);
    if (r.ok) {
      sfx.coin();
      setTimeout(() => sfx.splash(), 180);
      setMsg({ ok: true, text: `Đã thả ${SPECIES_BY_KIND[kind].vi} xuống ao!` });
      setPicker(null);
    } else {
      sfx.wrong();
      setMsg({ ok: false, text: r.reason });
    }
  };

  const feed = (idx: number) => {
    const r = feedSlot(idx);
    if (r.ok) {
      sfx.feed();
      setMsg({ ok: true, text: "Măm măm! Lớn nhanh hơn 20%." });
    } else {
      sfx.wrong();
      setMsg({ ok: false, text: r.reason });
    }
  };

  const harvest = (idx: number) => {
    const r = harvestSlot(idx);
    if (r.ok) {
      sfx.win();
      setTimeout(() => sfx.coin(), 500);
      setCatchInfo({ kind: r.kind, earned: r.earned });
      setTimeout(() => speak(SPECIES_BY_KIND[r.kind].say.en, { who: "mallow" }), 700);
    } else {
      sfx.wrong();
      setMsg({ ok: false, text: r.reason });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <BackLink />
        <Avatar who="mallow" size={52} />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">Ao Tôm Cua</h1>
          <p className="font-semibold text-[#6B4A30] text-sm sm:text-base">Học để kiếm vỏ sò và thức ăn → mua giống, thả ao, chăm cho lớn rồi thu hoạch bán lấy lời.</p>
        </div>
      </div>

      {/* Ví */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="cci-card px-4 py-3 flex items-center gap-3" style={{ background: "#FFF1C7" }}>
          <Shell className="w-8 h-8 text-[#C99A1E]" />
          <div>
            <div className="font-baloo font-extrabold text-3xl leading-none">{wallet}</div>
            <div className="text-sm font-bold text-[#6B4A30]">Vỏ sò</div>
          </div>
        </div>
        <div className="cci-card px-4 py-3 flex items-center gap-3" style={{ background: "#EAF3DC" }}>
          <Utensils className="w-8 h-8 text-[#3F7A34]" />
          <div>
            <div className="font-baloo font-extrabold text-3xl leading-none">{feedLeft}</div>
            <div className="text-sm font-bold text-[#6B4A30]">Thức ăn</div>
          </div>
        </div>
        <div className="cci-card px-4 py-3 col-span-2 sm:col-span-1 text-sm font-semibold text-[#6B4A30] leading-snug">
          <div className="font-baloo font-extrabold text-[#4A3222] text-base mb-0.5">Học là có lộc 🌱</div>
          +1 vỏ sò mỗi 2 XP · +2 thức ăn mỗi nhiệm vụ tuần · +1 mỗi lượt phản xạ / việc trong chat · +1 mỗi 5 lần ôn thẻ
        </div>
      </div>

      {/* Ao */}
      <section className="rounded-[28px] p-3 sm:p-5 relative overflow-hidden" style={{ background: "linear-gradient(180deg,#BFE6F2,#8CCBE0)", border: "3px solid #4E8FA8", boxShadow: "0 6px 0 #4E8FA8" }}>
        <div className="absolute inset-0 pointer-events-none opacity-40" style={{ backgroundImage: "radial-gradient(ellipse at 20% 30%, #fff 0 6%, transparent 7%), radial-gradient(ellipse at 70% 70%, #fff 0 4%, transparent 5%), radial-gradient(ellipse at 85% 20%, #fff 0 3%, transparent 4%)" }} />
        <div className="relative flex items-center justify-between mb-3">
          <span className="font-baloo font-extrabold text-xl text-[#1F4E5F]">Ao nuôi · {size} ô</span>
          <span className="text-xs font-bold text-[#1F4E5F]">Cho ăn tối đa {MAX_FEED} lần mỗi mẻ</span>
        </div>
        <div className="relative grid grid-cols-3 gap-2.5 sm:gap-4">
          {Array.from({ length: size }).map((_, i) => {
            const sl = mounted ? activeSlot(s, i) : null;
            if (!sl)
              return (
                <button
                  key={i}
                  type="button"
                  data-sfx="open"
                  onClick={() => setPicker(i)}
                  className="aspect-square rounded-[20px] border-[3px] border-dashed border-white/80 bg-white/20 hover:bg-white/35 flex flex-col items-center justify-center gap-1 text-[#1F4E5F] font-extrabold transition-colors"
                >
                  <Plus className="w-7 h-7" />
                  <span className="text-sm">Thả giống</span>
                </button>
              );
            const sp = SPECIES_BY_KIND[sl.kind];
            const g = growth(sl);
            const ready = g.pct >= 1;
            const stage = ready ? 3 : g.pct >= 0.66 ? 2 : g.pct >= 0.25 ? 1 : 0;
            return (
              <div key={i} className={cx("aspect-square rounded-[20px] bg-white/45 border-[3px] p-2 flex flex-col items-center justify-between", ready ? "border-[#F2C14E] shadow-[0_0_0_4px_rgba(242,193,78,.45)]" : "border-white/80")}>
                <div className="w-full flex items-center justify-between text-[11px] font-extrabold text-[#1F4E5F]">
                  <span>{sp.vi}</span>
                  <span>{STAGE[stage]}</span>
                </div>
                <div className="flex-1 flex items-center justify-center w-full">
                  <div style={{ width: `${45 + 45 * g.pct}%` }} className={cx(ready && "anim-bounce")}>
                    <SeaCreature kind={sl.kind} />
                  </div>
                </div>
                <div className="w-full flex flex-col gap-1">
                  <div className="h-2 rounded-full bg-white/70 overflow-hidden">
                    <div className="h-full" style={{ width: `${g.pct * 100}%`, background: ready ? "#F2C14E" : "#6FAE4F" }} />
                  </div>
                  {ready ? (
                    <button type="button" data-sfx="none" onClick={() => harvest(i)} className="cci-btn cci-btn-primary !min-h-[34px] !text-[13px] !px-2">
                      <Sparkles className="w-4 h-4" /> Thu hoạch +{sp.sell}
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="flex-1 text-[11px] font-bold text-[#1F4E5F] truncate">{fmtLeft(g.minsLeft)}</span>
                      <button
                        type="button"
                        data-sfx="none"
                        disabled={sl.boost >= MAX_FEED}
                        onClick={() => feed(i)}
                        className="cci-btn !min-h-[30px] !text-[12px] !px-2"
                        title={`Cho ăn (${sl.boost}/${MAX_FEED})`}
                      >
                        <Utensils className="w-3.5 h-3.5" /> {sl.boost}/{MAX_FEED}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {expandCost && (
          <button
            type="button"
            data-sfx="none"
            onClick={() => {
              const r = expandPond();
              if (r.ok) {
                sfx.unlock();
                setMsg({ ok: true, text: `Ao đã rộng ${size + 3} ô!` });
              } else {
                sfx.wrong();
                setMsg({ ok: false, text: r.reason });
              }
            }}
            className="relative mt-3 w-full rounded-[18px] border-[3px] border-white/80 bg-white/30 hover:bg-white/45 py-2.5 font-extrabold text-[#1F4E5F] flex items-center justify-center gap-2"
          >
            <Expand className="w-4 h-4" /> Mở rộng ao lên {size + 3} ô · {expandCost} vỏ sò
          </button>
        )}
      </section>

      {/* Chợ giống */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Avatar who="mallow" size={40} />
          <h2 className="text-xl sm:text-2xl font-extrabold">Chợ giống của Mallow</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {SPECIES.map((sp) => {
            const locked = lv < sp.minLevel;
            return (
              <div key={sp.kind} className={cx("cci-card p-4 flex flex-col gap-2", locked && "opacity-70")}>
                <div className="flex items-center gap-3">
                  <div className="w-16 shrink-0">
                    <SeaCreature kind={sp.kind} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-baloo font-extrabold text-lg leading-tight">{sp.vi}</div>
                    <button type="button" data-sfx="none" onClick={() => speak(`a ${sp.en}. Two ${sp.plural}.`, { who: "mallow" })} className="text-sm font-extrabold text-[#3F7A34] inline-flex items-center gap-1">
                      {sp.en} <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-sm font-semibold text-[#6B4A30] leading-snug">
                  Giá giống <b>{sp.price}</b> vỏ sò · lớn trong {sp.hours} giờ · bán được <b>{sp.sell}</b>
                </div>
                <button
                  type="button"
                  data-sfx="none"
                  disabled={!mounted || locked || firstEmpty < 0}
                  onClick={() => buy(sp.kind, firstEmpty)}
                  className="cci-btn cci-btn-primary !min-h-[42px]"
                >
                  {locked ? (
                    <>
                      <Lock className="w-4 h-4" /> Mở ở đảo cấp {sp.minLevel}
                    </>
                  ) : firstEmpty < 0 ? (
                    "Ao đầy rồi"
                  ) : (
                    <>
                      <Shell className="w-4 h-4" /> Mua & thả · {sp.price}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <NextStep />

      {msg && (
        <div className="fixed inset-x-0 top-20 z-[70] flex justify-center px-3 pointer-events-none">
          <div className={cx("max-w-md rounded-[20px] px-4 py-2 font-extrabold border-[3px] anim-pop", msg.ok ? "bg-[#3F7A34] text-white border-[#2C5A25]" : "bg-[#FDEEDD] text-[#A4521D] border-[#C96A2B]")}>{msg.text}</div>
        </div>
      )}

      {/* Chọn giống cho ô trống */}
      {picker !== null && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-3 bg-[#4A3222]/40" onClick={() => setPicker(null)} role="dialog" aria-modal="true" aria-label="Chọn giống">
          <div className="cci-card-wood w-full max-w-md p-5 flex flex-col gap-3 anim-pop" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <Avatar who="mallow" size={48} />
              <div className="flex-1">
                <h2 className="text-xl font-extrabold leading-tight">Thả giống gì nào?</h2>
                <p className="text-sm font-semibold text-[#6B4A30]">Bạn có {wallet} vỏ sò</p>
              </div>
              <button type="button" onClick={() => setPicker(null)} className="cci-btn !min-h-[40px] !w-[40px] !p-0" aria-label="Đóng" data-sfx="close">
                <X className="w-5 h-5" />
              </button>
            </div>
            {SPECIES.map((sp) => {
              const locked = lv < sp.minLevel;
              return (
                <button
                  key={sp.kind}
                  type="button"
                  data-sfx="none"
                  disabled={locked || wallet < sp.price}
                  onClick={() => buy(sp.kind, picker)}
                  className="flex items-center gap-3 rounded-[18px] border-[3px] border-[#8B5E3C] bg-white px-3 py-2 hover:bg-[#FBF0D9] disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="w-12 shrink-0">
                    <SeaCreature kind={sp.kind} />
                  </div>
                  <span className="flex-1">
                    <span className="block font-baloo font-extrabold leading-tight">
                      {sp.vi} · <span className="text-[#3F7A34]">{sp.en}</span>
                    </span>
                    <span className="block text-xs font-semibold text-[#6B4A30]">{locked ? `Mở ở đảo cấp ${sp.minLevel}` : `${sp.hours} giờ · bán ${sp.sell}`}</span>
                  </span>
                  <span className="font-baloo font-extrabold flex items-center gap-1">
                    <Shell className="w-4 h-4 text-[#C99A1E]" /> {sp.price}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Thu hoạch */}
      {catchInfo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-[#4A3222]/40" onClick={() => setCatchInfo(null)} role="dialog" aria-modal="true" aria-label="Thu hoạch">
          <div className="cci-card-wood w-full max-w-sm p-6 flex flex-col items-center gap-3 text-center anim-pop" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-end gap-2">
              <div className="w-20">
                <Character who="mallow" mood="happy" size="100%" />
              </div>
              <div className="w-24 anim-bounce">
                <SeaCreature kind={catchInfo.kind} />
              </div>
            </div>
            <h2 className="text-2xl font-extrabold">+{catchInfo.earned} vỏ sò!</h2>
            <button type="button" data-sfx="none" onClick={() => speak(SPECIES_BY_KIND[catchInfo.kind].say.en, { who: "mallow" })} className="rounded-[16px] px-3 py-2 bg-white border-2 border-[#EAD9B8] text-left">
              <span className="block font-bold leading-snug">
                {SPECIES_BY_KIND[catchInfo.kind].say.en} <Volume2 className="inline w-4 h-4 text-[#3F7A34]" />
              </span>
              <span className="block text-sm font-semibold text-[#6B4A30]">{SPECIES_BY_KIND[catchInfo.kind].say.vi}</span>
            </button>
            <button type="button" className="cci-btn cci-btn-primary cci-btn-big" onClick={() => setCatchInfo(null)}>
              Tuyệt!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
