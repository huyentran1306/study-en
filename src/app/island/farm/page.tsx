"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookHeart, Expand, Lock, Plus, Shell, Sparkles, Utensils, Volume2, X } from "lucide-react";
import { Avatar } from "@/components/island/character";
import { BackLink, cx } from "@/components/island/ui";
import { SeaCreature } from "@/components/island/farm-art";
import { PondBackdrop, Swimmers, type SwimItem } from "@/components/island/pond-scene";
import { NextStep } from "@/components/island/journey";
import { EXPAND_COST, MAX_FEED, RARE, SPECIES, SPECIES_BY_KIND } from "@/lib/island/farm-data";
import { CustomerModal, type Catch } from "@/components/island/market";
import { activeSlot, buySeed, expandPond, feedSlot, food, growth, harvestSlot, islandLevel, sellPrice, shells, useIsland } from "@/lib/island/progress";
import type { FarmKind, FarmSlot } from "@/lib/island/state";
import { speak } from "@/lib/island/speech";
import { sfx } from "@/lib/island/sfx";

function fmtLeft(mins: number) {
  if (mins <= 0) return "Đã lớn!";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `còn ${h} giờ ${m > 0 ? `${m} phút` : ""}` : `còn ${m} phút`;
}

const nameEn = (sl: FarmSlot) => (sl.rare ? RARE[sl.kind].en : SPECIES_BY_KIND[sl.kind].en);

const STAGE = ["Giống", "Đang lớn", "Sắp lớn", "Thu hoạch được"];

export default function FarmPage() {
  const s = useIsland();
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0);
  const [picker, setPicker] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [catchInfo, setCatchInfo] = useState<Catch | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [lure, setLure] = useState<{ id: number; n: number } | null>(null);
  const [leaving, setLeaving] = useState<number | null>(null);

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

  const swimItems: SwimItem[] = [];
  for (let i = 0; i < size; i++) {
    const sl = mounted ? activeSlot(s, i) : null;
    if (!sl) continue;
    const pct = growth(sl).pct;
    const base = sl.kind === "shrimp" ? [8, 6] : sl.kind === "crab" ? [10, 7] : [12, 8];
    swimItems.push({
      id: i,
      kind: sl.kind,
      size: base[0] + base[1] * pct,
      ready: pct >= 1,
      leaving: leaving === i,
      rare: sl.rare,
      label: pct >= 1 ? `${nameEn(sl)}! Vớt mình lên đi!` : `I'm a ${nameEn(sl)}! · ${Math.round(pct * 100)}%`,
    });
  }
  const alive = swimItems.length;

  const pickCreature = (i: number) => {
    const sl = activeSlot(s, i);
    if (!sl) return;
    setSel(i);
    sfx.splash();
    speak(`a ${nameEn(sl)}`, { who: "mallow" });
  };

  const buy = (kind: FarmKind, idx: number) => {
    const r = buySeed(kind, idx);
    if (r.ok) {
      sfx.coin();
      setTimeout(() => sfx.splash(), 180);
      if (r.rare) setTimeout(() => sfx.unlock(), 500);
      setMsg({ ok: true, text: r.rare ? `Ồ! Là ${RARE[kind].vi} hiếm — bán được giá gấp đôi!` : `Đã thả ${SPECIES_BY_KIND[kind].vi} xuống ao!` });
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
      setSel(idx);
      setLure((l) => ({ id: idx, n: (l?.n ?? 0) + 1 }));
      setMsg({ ok: true, text: "Măm măm! Lớn nhanh hơn 20%." });
    } else {
      sfx.wrong();
      setMsg({ ok: false, text: r.reason });
    }
  };

  const harvest = (idx: number) => {
    // Con nhảy khỏi mặt nước trước, rồi mới vào giỏ.
    setLeaving(idx);
    sfx.splash();
    setTimeout(() => {
      setLeaving(null);
      const r = harvestSlot(idx);
      if (r.ok) {
        sfx.coin();
        setSel(null);
        setCatchInfo({ idx, kind: r.kind, rare: r.rare, earned: r.earned, done: r.done });
      } else {
        sfx.wrong();
        setMsg({ ok: false, text: r.reason });
      }
    }, 650);
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <BackLink />
        <Avatar who="mallow" size={52} />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">Ao Tôm Cua</h1>
          <p className="font-semibold text-[#6B4A30] text-sm sm:text-base">Học để kiếm vỏ sò và thức ăn → mua giống, thả ao, chăm cho lớn rồi vớt lên bán cho khách.</p>
        </div>
        <Link href="/island/collection" className="cci-btn !min-h-[40px] !px-3 shrink-0" title="Sổ sưu tập" data-sfx="open">
          <BookHeart className="w-4 h-4 text-[#C8553D]" /> <span className="hidden sm:inline">Sổ sưu tập</span>
        </Link>
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

      {/* Ao: nước thật, tôm cua bơi qua lại */}
      <section className="rounded-[28px] overflow-hidden" style={{ border: "3px solid #4E8FA8", boxShadow: "0 6px 0 #4E8FA8" }}>
        <div className="relative aspect-[5/4] sm:aspect-[16/9] overflow-hidden [--swim-scale:1.5] sm:[--swim-scale:1]" data-sfx-scope="off">
          <PondBackdrop />
          {mounted && <Swimmers mode="side" items={swimItems} selected={sel} lure={lure} onPick={pickCreature} />}
          <div className="absolute left-3 top-[9%] sm:top-[8%] flex items-center gap-2 pointer-events-none">
            <span className="rounded-full bg-white/85 border-2 border-[#4E8FA8] px-3 py-1 font-baloo font-extrabold text-[#1F4E5F] text-sm sm:text-base">
              Ao nuôi · {alive}/{size} con
            </span>
          </div>
          {mounted && alive === 0 && (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="rounded-[20px] bg-white/90 border-[3px] border-[#4E8FA8] px-4 py-3 text-center max-w-xs anim-pop">
                <div className="font-baloo font-extrabold text-lg text-[#1F4E5F] leading-tight">Ao đang trống trơn</div>
                <p className="text-sm font-semibold text-[#6B4A30] mb-2">Mua giống ở chợ của Mallow rồi thả xuống, tụi nhỏ sẽ bơi quanh ao.</p>
                <button type="button" data-sfx="open" onClick={() => setPicker(Math.max(0, firstEmpty))} className="cci-btn cci-btn-primary !min-h-[40px]">
                  <Plus className="w-4 h-4" /> Thả giống
                </button>
              </div>
            </div>
          )}
          {mounted && alive > 0 && (
            <div className="absolute right-3 top-[9%] sm:top-[8%] hidden sm:block pointer-events-none text-xs font-extrabold text-[#1F4E5F] bg-white/70 rounded-full px-2.5 py-1">
              Chạm vào con để nghe tên tiếng Anh
            </div>
          )}
        </div>

        <div className="bg-[#E6F5FA] border-t-[3px] border-[#4E8FA8] p-3 sm:p-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2">
            <span className="font-baloo font-extrabold text-lg text-[#1F4E5F] leading-tight">Lồng nuôi</span>
            <span className="text-xs font-bold text-[#1F4E5F]">Cho ăn tối đa {MAX_FEED} lần mỗi mẻ · mỗi lần lớn nhanh hơn 20%</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Array.from({ length: size }).map((_, i) => {
              const sl = mounted ? activeSlot(s, i) : null;
              if (!sl)
                return (
                  <button
                    key={i}
                    type="button"
                    data-sfx="open"
                    onClick={() => setPicker(i)}
                    className="min-h-[104px] rounded-[18px] border-[3px] border-dashed border-[#8CC3D6] bg-white/50 hover:bg-white flex flex-col items-center justify-center gap-1 text-[#1F4E5F] font-extrabold transition-colors"
                  >
                    <Plus className="w-6 h-6" />
                    <span className="text-sm">Thả giống</span>
                  </button>
                );
              const sp = SPECIES_BY_KIND[sl.kind];
              const g = growth(sl);
              const ready = g.pct >= 1;
              const stage = ready ? 3 : g.pct >= 0.66 ? 2 : g.pct >= 0.25 ? 1 : 0;
              return (
                <div
                  key={i}
                  onClick={() => setSel(i)}
                  className={cx(
                    "rounded-[18px] bg-white border-[3px] p-2.5 flex flex-col gap-1.5 cursor-pointer transition-shadow",
                    ready ? "border-[#F2C14E] shadow-[0_0_0_3px_rgba(242,193,78,.4)]" : sel === i ? "border-[#4E8FA8] shadow-[0_0_0_3px_rgba(78,143,168,.3)]" : "border-[#CFE6EE]",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-10 shrink-0">
                      <SeaCreature kind={sl.kind} rare={sl.rare} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={cx("font-baloo font-extrabold leading-tight truncate", sl.rare && "text-[#A4521D]")}>{sl.rare ? `✨ ${RARE[sl.kind].vi}` : sp.vi}</div>
                      <div className="text-[11px] font-bold text-[#1F4E5F] leading-tight">{ready ? STAGE[3] : `${STAGE[stage]} · ${fmtLeft(g.minsLeft)}`}</div>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-[#DCEFF5] overflow-hidden">
                    <div className="h-full transition-all" style={{ width: `${g.pct * 100}%`, background: ready ? "#F2C14E" : "#6FAE4F" }} />
                  </div>
                  {ready ? (
                    <button type="button" data-sfx="none" disabled={leaving !== null} onClick={(e) => (e.stopPropagation(), harvest(i))} className="cci-btn cci-btn-primary !min-h-[34px] !text-[13px] !px-2">
                      <Sparkles className="w-4 h-4" /> Vớt lên +{sellPrice(sl)}
                    </button>
                  ) : (
                    <button
                      type="button"
                      data-sfx="none"
                      disabled={sl.boost >= MAX_FEED}
                      onClick={(e) => (e.stopPropagation(), feed(i))}
                      className="cci-btn !min-h-[34px] !text-[13px] !px-2"
                      title={`Cho ăn (${sl.boost}/${MAX_FEED})`}
                    >
                      <Utensils className="w-3.5 h-3.5" /> {sl.boost >= MAX_FEED ? "No rồi" : "Cho ăn"} {sl.boost}/{MAX_FEED}
                    </button>
                  )}
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
              className="w-full rounded-[18px] border-[3px] border-[#8CC3D6] bg-white/60 hover:bg-white py-2.5 font-extrabold text-[#1F4E5F] flex items-center justify-center gap-2"
            >
              <Expand className="w-4 h-4" /> Mở rộng ao lên {size + 3} ô · {expandCost} vỏ sò
            </button>
          )}
        </div>
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
          <div className="cci-card-wood w-full max-w-md p-5 flex flex-col gap-3 anim-pop max-h-[92dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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

      {/* Vớt lên → khách tới mua */}
      {catchInfo && <CustomerModal c={catchInfo} onClose={() => setCatchInfo(null)} />}
    </div>
  );
}
