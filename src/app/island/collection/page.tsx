"use client";

import { useEffect, useState } from "react";
import { BookHeart, Gift, Heart, Lock, Shell, Sparkles, Volume2 } from "lucide-react";
import { Avatar } from "@/components/island/character";
import { BackLink, cx } from "@/components/island/ui";
import { SeaCreature } from "@/components/island/farm-art";
import { PlantArt } from "@/components/island/plant-art";
import { BuildArt } from "@/components/island/garden";
import { NextStep } from "@/components/island/journey";
import { CHAPTERS, NPCS, type NpcId } from "@/lib/island/curriculum";
import { BUILDS, FRIEND_LEVELS, NPC_STORIES, type BuildId } from "@/lib/island/drills";
import { RARE, SPECIES } from "@/lib/island/farm-data";
import { PLANT_BY_CH } from "@/lib/island/garden-data";
import { DEX_MILESTONES, claimDex, collection, useIsland } from "@/lib/island/progress";
import { speak } from "@/lib/island/speech";
import { sfx } from "@/lib/island/sfx";

const BUILD_EN: Record<BuildId, string> = {
  flowers: "a flower bed",
  bench: "a wooden bench",
  mailbox: "a mailbox",
  lanterns: "a string of lanterns",
  boat: "a little boat",
  windmill: "a windmill",
  balloon: "a hot-air balloon",
  arch: "a festival arch",
};

const HIDE = { filter: "brightness(0)", opacity: 0.16 } as const;

function Section({ title, sub, have, total, children }: { title: string; sub: string; have: number; total: number; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold leading-tight">{title}</h2>
          <p className="text-sm font-semibold text-[#6B4A30]">{sub}</p>
        </div>
        <span className="font-baloo font-extrabold text-lg shrink-0">
          {have}/{total}
        </span>
      </div>
      {children}
    </section>
  );
}

function Entry({ have, art, en, vi, hint, extra, rare }: { have: boolean; art: React.ReactNode; en: string; vi: string; hint: string; extra?: string; rare?: boolean }) {
  return (
    <button
      type="button"
      data-sfx={have ? "pop" : "none"}
      disabled={!have}
      onClick={() => speak(en, { who: "pip" })}
      className={cx(
        "relative rounded-[20px] border-[3px] p-2.5 flex flex-col items-center gap-1 text-center transition-transform",
        have ? (rare ? "bg-[#FFF6D8] border-[#F2C14E] hover:-translate-y-0.5" : "bg-white border-[#D8BF92] hover:-translate-y-0.5") : "bg-[#F6EEDC] border-dashed border-[#D8BF92] cursor-default",
      )}
    >
      {rare && have && <Sparkles className="absolute top-1.5 right-1.5 w-4 h-4 text-[#D9A92F]" />}
      <div className="w-full aspect-[5/4] flex items-center justify-center">
        <div className="w-[78%]" style={have ? undefined : HIDE}>
          {art}
        </div>
      </div>
      {have ? (
        <>
          <span className="font-baloo font-extrabold leading-tight text-[15px] inline-flex items-center gap-1">
            {en} <Volume2 className="w-3.5 h-3.5 text-[#3F7A34] shrink-0" />
          </span>
          <span className="text-xs font-semibold text-[#6B4A30] leading-tight">
            {vi}
            {extra ? ` · ${extra}` : ""}
          </span>
        </>
      ) : (
        <>
          <span className="font-baloo font-extrabold text-[#B79A6E] inline-flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" /> ???
          </span>
          <span className="text-[11px] font-semibold text-[#9C7E58] leading-tight">{hint}</span>
        </>
      )}
    </button>
  );
}

export default function CollectionPage() {
  const s = useIsland();
  const [mounted, setMounted] = useState(false);
  const [got, setGot] = useState<number | null>(null);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (got === null) return;
    const t = setTimeout(() => setGot(null), 3000);
    return () => clearTimeout(t);
  }, [got]);

  const c = collection(s);
  const g = c.groups;
  const count = (o: Record<string, boolean>) => (mounted ? Object.values(o).filter(Boolean).length : 0);
  const have = mounted ? c.have : 0;
  const next = c.next;
  const prev = s.farm.dexClaimed > 0 ? DEX_MILESTONES[s.farm.dexClaimed - 1].n : 0;
  const pct = next ? Math.min(1, (have - prev) / (next.n - prev)) : 1;

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <BackLink />
        <span className="w-[52px] h-[52px] rounded-[16px] border-[3px] border-[#4A3222] bg-[#F7C6CF] flex items-center justify-center shrink-0">
          <BookHeart className="w-7 h-7" />
        </span>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">Sổ sưu tập</h1>
          <p className="font-semibold text-[#6B4A30] text-sm sm:text-base">Mỗi món là một từ và một câu tiếng Anh. Chạm vào món đã có để nghe đọc.</p>
        </div>
      </div>

      {/* Mốc thưởng */}
      <div className="cci-card p-4 flex flex-col sm:flex-row sm:items-center gap-3" style={{ background: "#FFF9EE" }}>
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-baloo font-extrabold text-2xl">
              {have}
              <span className="text-base text-[#6B4A30]">/{c.total} món</span>
            </span>
            <span className="text-sm font-bold text-[#6B4A30]">{next ? `Mốc ${next.n} món: +${next.reward} vỏ sò` : "Đã nhận hết các mốc thưởng!"}</span>
          </div>
          <div className="h-3 rounded-full bg-[#EAD9B8] border-2 border-[#8B5E3C] overflow-hidden">
            <div className="h-full bg-[#F2C14E] transition-all" style={{ width: `${(mounted ? pct : 0) * 100}%` }} />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {DEX_MILESTONES.map((m, i) => (
              <span key={m.n} className={cx("text-[11px] font-extrabold rounded-full px-2 py-0.5 border-2", i < s.farm.dexClaimed ? "bg-[#3F7A34] text-white border-[#3F7A34]" : have >= m.n && mounted ? "bg-[#F2C14E] border-[#4A3222]" : "bg-white border-[#EAD9B8] text-[#6B4A30]")}>
                {m.n} món · +{m.reward}
              </span>
            ))}
          </div>
        </div>
        {mounted && c.claimable && (
          <button
            type="button"
            data-sfx="none"
            onClick={() => {
              const r = claimDex();
              if (r.ok) {
                sfx.unlock();
                setTimeout(() => sfx.coin(), 300);
                setGot(r.reward);
                import("@/lib/confetti").then((m) => m.fireCelebration()).catch(() => {});
              }
            }}
            className="cci-btn cci-btn-primary anim-bounce shrink-0"
          >
            <Gift className="w-5 h-5" /> Nhận +{next?.reward} vỏ sò
          </button>
        )}
      </div>

      <Section title="Hải sản" sub="Vớt lên ở Ao Tôm Cua · con hiếm hay gặp hơn khi giữ chuỗi ngày học" have={count(g.sea)} total={6}>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {SPECIES.flatMap((sp) => [
            { key: sp.kind, sp, rare: false },
            { key: `${sp.kind}-rare`, sp, rare: true },
          ]).map(({ key, sp, rare }) => (
            <Entry
              key={key}
              have={mounted && g.sea[key]}
              rare={rare}
              art={<SeaCreature kind={sp.kind} rare={rare} />}
              en={rare ? `a ${RARE[sp.kind].en}` : `a ${sp.en}`}
              vi={rare ? RARE[sp.kind].vi : sp.vi}
              extra={`×${s.farm.caught[key] || 0}`}
              hint={rare ? "Con hiếm" : `Nuôi và vớt ${sp.vi.toLowerCase()}`}
            />
          ))}
        </div>
      </Section>

      <Section title="Vườn Nhiệm Vụ" sub="Xong đủ 7 nhiệm vụ của tuần rồi thu hoạch luống" have={count(g.plant)} total={CHAPTERS.length}>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2.5">
          {CHAPTERS.map((ch) => {
            const p = PLANT_BY_CH[ch.id];
            if (!p) return null;
            return (
              <Entry
                key={ch.id}
                have={mounted && g.plant[String(ch.id)]}
                art={<PlantArt plant={p} stage={7} />}
                en={`${p.article ? p.article + " " : ""}${p.en}`}
                vi={p.vi}
                hint={`Luống tuần ${ch.id}`}
              />
            );
          })}
        </div>
      </Section>

      <Section title="Truyện bạn bè" sub="Thân hơn với cư dân (thêm tim) để nghe họ kể chuyện" have={count(g.story)} total={Object.keys(g.story).length}>
        <div className="grid sm:grid-cols-2 gap-3">
          {(Object.keys(NPC_STORIES) as NpcId[]).map((npc) => (
            <div key={npc} className="cci-card p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Avatar who={npc} size={40} />
                <span className="font-baloo font-extrabold text-lg">{NPCS[npc].name}</span>
              </div>
              <ol className="flex flex-col gap-1.5">
                {(NPC_STORIES[npc] || []).map((st, i) => {
                  const open = mounted && g.story[`${npc}:${i}`];
                  return (
                    <li key={i}>
                      {open ? (
                        <button type="button" data-sfx="none" onClick={() => speak(st.en, { who: npc })} className="w-full text-left rounded-[14px] bg-[#FBF3E2] px-3 py-1.5">
                          <span className="block text-sm font-bold leading-snug">
                            {st.en} <Volume2 className="inline w-3.5 h-3.5 text-[#3F7A34]" />
                          </span>
                          <span className="block text-xs font-semibold text-[#6B4A30]">{st.vi}</span>
                        </button>
                      ) : (
                        <div className="rounded-[14px] border-2 border-dashed border-[#EAD9B8] px-3 py-1.5 text-xs font-bold text-[#9C7E58] flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" /> Mở khi đủ {i + 1} <Heart className="w-3 h-3" fill="#E86F5A" stroke="#4A3222" /> ({FRIEND_LEVELS[i + 1]} điểm thân thiết)
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Công trình trên đảo" sub="Lên cấp đảo bằng XP để xây thêm" have={count(g.build)} total={BUILDS.length}>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {BUILDS.map((b) => (
            <Entry key={b.id} have={mounted && g.build[b.id]} art={<BuildArt id={b.id} />} en={BUILD_EN[b.id]} vi={b.name} hint={`Đảo cấp ${b.lv}`} />
          ))}
        </div>
      </Section>

      <NextStep />

      {got !== null && (
        <div className="fixed inset-x-0 top-20 z-[70] flex justify-center px-3 pointer-events-none">
          <div className="rounded-[20px] px-4 py-2 font-extrabold border-[3px] anim-pop bg-[#3F7A34] text-white border-[#2C5A25] inline-flex items-center gap-2">
            <Shell className="w-5 h-5" /> +{got} vỏ sò từ Sổ sưu tập!
          </div>
        </div>
      )}
    </div>
  );
}
