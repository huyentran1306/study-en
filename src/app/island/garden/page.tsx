"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Check, Ear, Lock, MessageCircle, Mic, Repeat, Shell, Sparkles, Sprout, Volume2, X, Zap, AudioLines } from "lucide-react";
import { Avatar, Character } from "@/components/island/character";
import { BackLink, cx } from "@/components/island/ui";
import { PlantArt } from "@/components/island/plant-art";
import { NextStep } from "@/components/island/journey";
import { CHAPTERS, MISSIONS, missionHref, type Chapter } from "@/lib/island/curriculum";
import { PLANT_BY_CH, type Plant } from "@/lib/island/garden-data";
import { GARDEN_BONUS, currentChapterId, harvestPlot, isUnlocked, missionsDone, useIsland } from "@/lib/island/progress";
import { speak } from "@/lib/island/speech";
import { sfx } from "@/lib/island/sfx";

const MISSION_ICON = { lesson: BookOpen, listen: Ear, speak: Mic, chat: MessageCircle, review: Repeat, reflex: Zap, sound: AudioLines } as const;
const STAGE_NAME = ["Hạt giống", "Nảy mầm", "Nảy mầm", "Cây non", "Cây non", "Ra nụ", "Sắp nở", "Thu hoạch được"];

function plantName(p: Plant) {
  return `${p.article ? p.article + " " : ""}${p.en}`;
}

export default function GardenPage() {
  const s = useIsland();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [reward, setReward] = useState<Plant | null>(null);
  useEffect(() => setMounted(true), []);

  const curId = currentChapterId(s);
  const harvested = Object.keys(s.garden).length;
  const total = MISSIONS.length;

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <BackLink />
        <Avatar who="mallow" size={52} />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight flex items-center gap-2">
            <Sprout className="w-7 h-7 text-[#3F7A34]" /> Vườn Nhiệm Vụ
          </h1>
          <p className="font-semibold text-[#6B4A30] text-sm sm:text-base">Mỗi tuần một luống. Xong nhiệm vụ nào, cây lớn thêm một chút — đủ {total}/{total} là ra hoa, thu hoạch được.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="cci-card px-4 py-3" style={{ background: "#EAF3DC" }}>
          <div className="font-baloo font-extrabold text-3xl leading-none">{mounted ? harvested : 0}/13</div>
          <div className="text-sm font-bold text-[#6B4A30] mt-1">Luống đã thu hoạch</div>
        </div>
        <div className="cci-card px-4 py-3" style={{ background: "#FFF1C7" }}>
          <div className="font-baloo font-extrabold text-3xl leading-none">
            {mounted ? missionsDone(s, curId) : 0}/{total}
          </div>
          <div className="text-sm font-bold text-[#6B4A30] mt-1">Luống tuần này ({PLANT_BY_CH[curId]?.vi})</div>
        </div>
        <div className="cci-card px-4 py-3 col-span-2 sm:col-span-1 text-sm font-semibold text-[#6B4A30] leading-snug">
          <div className="font-baloo font-extrabold text-[#4A3222] text-base mb-0.5">Thu hoạch = +{GARDEN_BONUS} vỏ sò 🐚</div>
          Dùng vỏ sò để mua giống ở Ao Tôm Cua. Bấm vào luống để xem còn thiếu nhiệm vụ nào.
        </div>
      </div>

      {/* Các luống */}
      <section className="rounded-[28px] p-3 sm:p-5" style={{ background: "linear-gradient(180deg,#B9DD8A,#9CCB6A)", border: "3px solid #6E9F45", boxShadow: "0 6px 0 #6E9F45" }}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {CHAPTERS.map((c) => {
            const plant = PLANT_BY_CH[c.id];
            const unlocked = !mounted || isUnlocked(s, c.id);
            const n = mounted ? missionsDone(s, c.id) : 0;
            const done = !!s.garden[String(c.id)];
            const ready = n >= total && !done;
            const isCur = mounted && c.id === curId;
            return (
              <button
                key={c.id}
                type="button"
                data-sfx="open"
                onClick={() => setOpen(c.id)}
                className={cx(
                  "relative rounded-[22px] bg-[#FBF3E2] border-[3px] p-2.5 flex flex-col items-center gap-1 text-center hover:-translate-y-0.5 transition-transform",
                  ready ? "border-[#F2C14E] shadow-[0_0_0_4px_rgba(242,193,78,.5)]" : isCur ? "border-[#3F7A34]" : "border-[#8B5E3C]",
                  !unlocked && "opacity-75",
                )}
              >
                <span className="absolute left-2 top-2 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-white border-2 border-[#EAD9B8]">Tuần {c.week}</span>
                {done && <span className="absolute right-2 top-2 w-6 h-6 rounded-full bg-[#3F7A34] text-white flex items-center justify-center"><Check className="w-3.5 h-3.5" strokeWidth={3.5} /></span>}
                {ready && <span className="absolute right-2 top-2 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-[#F2C14E] border-2 border-[#4A3222] anim-bounce">Thu hoạch!</span>}
                <div className={cx("w-[78%] mt-3", !unlocked && "grayscale")}>
                  {unlocked ? <PlantArt plant={plant} stage={n} /> : <LockedPlot />}
                </div>
                <div className="font-baloo font-extrabold leading-tight text-[15px]">{plant.vi}</div>
                <div className="text-[12px] font-bold text-[#3F7A34] -mt-0.5">{plant.en}</div>
                <div className="flex gap-1 mt-0.5" aria-label={`${n}/${total} nhiệm vụ`}>
                  {MISSIONS.map((m, i) => (
                    <span key={m.key} className="w-2.5 h-2.5 rounded-full border-2" style={{ background: i < n ? "#6FAE4F" : "#fff", borderColor: i < n ? "#3F7A34" : "#D8BF92" }} />
                  ))}
                </div>
                <div className="text-[11px] font-bold text-[#6B4A30]">{!unlocked ? "Chưa mở" : done ? "Đã thu hoạch" : STAGE_NAME[Math.min(7, n)]}</div>
              </button>
            );
          })}
        </div>
      </section>

      <NextStep />

      {open !== null && (
        <PlotPanel
          ch={CHAPTERS.find((c) => c.id === open)!}
          onClose={() => setOpen(null)}
          onHarvest={(p) => {
            setOpen(null);
            setReward(p);
          }}
        />
      )}

      {reward && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-[#4A3222]/40" onClick={() => setReward(null)} role="dialog" aria-modal="true" aria-label="Thu hoạch">
          <div className="cci-card-wood w-full max-w-sm p-6 flex flex-col items-center gap-3 text-center anim-pop max-h-[92dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-end gap-2">
              <div className="w-20">
                <Character who="mallow" mood="happy" size="100%" />
              </div>
              <div className="w-28 anim-bounce">
                <PlantArt plant={reward} stage={7} />
              </div>
            </div>
            <h2 className="text-2xl font-extrabold flex items-center gap-2">
              <Shell className="w-6 h-6 text-[#C99A1E]" /> +{GARDEN_BONUS} vỏ sò!
            </h2>
            <button type="button" data-sfx="none" onClick={() => speak(reward.say.en, { who: "mallow" })} className="rounded-[16px] px-3 py-2 bg-white border-2 border-[#EAD9B8] text-left">
              <span className="block font-bold leading-snug">
                {reward.say.en} <Volume2 className="inline w-4 h-4 text-[#3F7A34]" />
              </span>
              <span className="block text-sm font-semibold text-[#6B4A30]">{reward.say.vi}</span>
            </button>
            <div className="flex gap-2 flex-wrap justify-center">
              <Link href="/island/farm" className="cci-btn cci-btn-primary">
                Ra Ao Tôm Cua
              </Link>
              <button type="button" className="cci-btn" onClick={() => setReward(null)}>
                Ở lại vườn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LockedPlot() {
  return (
    <svg viewBox="0 0 100 112" className="w-full h-auto">
      <path d="M14 104 C14 92 30 88 50 88 C70 88 86 92 86 104 Z" fill="#B89270" stroke="#4A3222" strokeWidth="3" />
      {[22, 40, 60, 78].map((x) => (
        <rect key={x} x={x - 3} y="62" width="6" height="40" rx="2" fill="#C98D5C" stroke="#4A3222" strokeWidth="2" />
      ))}
      <path d="M16 74 H84 M16 88 H84" stroke="#8B5E3C" strokeWidth="4" />
    </svg>
  );
}

function PlotPanel({ ch, onClose, onHarvest }: { ch: Chapter; onClose: () => void; onHarvest: (p: Plant) => void }) {
  const s = useIsland();
  const plant = PLANT_BY_CH[ch.id];
  const unlocked = isUnlocked(s, ch.id);
  const p = s.chapters[ch.id] || {};
  const n = missionsDone(s, ch.id);
  const done = !!s.garden[String(ch.id)];
  const firstTodo = MISSIONS.find((m) => !p[m.key]);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-3 bg-[#4A3222]/40" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Luống ${plant.vi}`}>
      <div className="cci-card-wood w-full max-w-lg p-5 flex flex-col gap-3 anim-pop max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="w-20 shrink-0 rounded-[16px] bg-[#EAF3DC] p-1">{unlocked ? <PlantArt plant={plant} stage={n} /> : <LockedPlot />}</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-extrabold uppercase tracking-wide text-[#3F7A34]">
              Tuần {ch.week} · Chương {ch.id} · {ch.title}
            </div>
            <h2 className="text-2xl font-extrabold leading-tight">{plant.vi}</h2>
            <button type="button" data-sfx="none" onClick={() => speak(`${plantName(plant)}.`, { who: "mallow" })} className="text-sm font-extrabold text-[#3F7A34] inline-flex items-center gap-1">
              {plantName(plant)} <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <button type="button" onClick={onClose} className="cci-btn !min-h-[40px] !w-[40px] !p-0" aria-label="Đóng" data-sfx="close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!unlocked ? (
          <div className="rounded-[16px] px-4 py-3 bg-[#FFF9EE] border-2 border-dashed border-[#D9A92F] text-sm font-bold text-[#6B4A30] flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0" /> Luống này mở khi bạn học tới tuần {ch.week}. Học xong bài học của chương trước để mở.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 rounded-full bg-[#EAD9B8] border-2 border-[#8B5E3C] overflow-hidden">
                <div className="h-full bg-[#6FAE4F]" style={{ width: `${(n / MISSIONS.length) * 100}%` }} />
              </div>
              <span className="text-sm font-extrabold">
                {n}/{MISSIONS.length}
              </span>
            </div>
            <ul className="flex flex-col gap-2">
              {MISSIONS.map((m) => {
                const ok = !!p[m.key];
                const canDo = m.key === "lesson" || !!p.lesson;
                const Icon = MISSION_ICON[m.key];
                const isNext = !ok && m === firstTodo;
                return (
                  <li key={m.key}>
                    <Link
                      href={canDo ? missionHref(m.key, ch.id) : "#"}
                      onClick={(e) => !canDo && e.preventDefault()}
                      data-sfx="whoosh"
                      className={cx(
                        "flex items-center gap-3 rounded-[16px] border-2 px-3 py-2 bg-white",
                        ok ? "border-[#A8D27A] bg-[#F4FAEC]" : isNext ? "border-[#F2C14E] shadow-[0_3px_0_#D9A92F]" : canDo ? "border-[#D8BF92] hover:border-[#8B5E3C]" : "border-[#EAD9B8] opacity-60 cursor-not-allowed",
                      )}
                    >
                      <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: ok ? "#3F7A34" : "#FBF3E2", border: `3px solid ${ok ? "#3F7A34" : "#D8BF92"}`, color: ok ? "#fff" : "#4A3222" }}>
                        {ok ? <Check className="w-4 h-4" strokeWidth={3.5} /> : <Icon className="w-4 h-4" />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-baloo font-extrabold leading-tight">
                          Ngày {m.day} · {m.title}
                        </span>
                        <span className="block text-xs font-semibold text-[#6B4A30] truncate">{ok ? "Xong — cây đã lớn thêm" : canDo ? `+1 giai đoạn cho cây · ~${m.mins} phút` : "Mở sau khi học xong bài học ngày 1"}</span>
                      </span>
                      {!ok && canDo && <ArrowRight className="w-4 h-4 shrink-0" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
            {done ? (
              <div className="rounded-[16px] px-4 py-3 bg-[#EAF3DC] border-2 border-[#6FAE4F] text-sm font-bold text-[#2C5A25]">✅ Đã thu hoạch luống này. Cây vẫn ở lại làm đẹp vườn!</div>
            ) : n >= MISSIONS.length ? (
              <button
                type="button"
                data-sfx="none"
                className="cci-btn cci-btn-primary cci-btn-big anim-bounce"
                onClick={() => {
                  const r = harvestPlot(ch.id);
                  if (r.ok) {
                    sfx.win();
                    setTimeout(() => sfx.coin(), 450);
                    setTimeout(() => speak(plant.say.en, { who: "mallow" }), 700);
                    onHarvest(plant);
                  } else setErr(r.reason);
                }}
              >
                <Sparkles className="w-5 h-5" /> Thu hoạch · +{GARDEN_BONUS} vỏ sò
              </button>
            ) : (
              firstTodo && (
                <Link href={missionHref(firstTodo.key, ch.id)} className="cci-btn cci-btn-primary" data-sfx="whoosh">
                  Làm nhiệm vụ tiếp theo: {firstTodo.title} <ArrowRight className="w-4 h-4" />
                </Link>
              )
            )}
            {err && <p className="text-sm font-bold text-[#A4521D]">{err}</p>}
          </>
        )}
      </div>
    </div>
  );
}
