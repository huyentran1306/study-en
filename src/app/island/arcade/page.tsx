"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Fish, Gamepad2, Layers, Lock, Shell, Shovel, Sprout, Trophy } from "lucide-react";
import { BackLink, cx } from "@/components/island/ui";
import { SeaTierArt, ProduceArt } from "@/components/island/arcade-art";
import { BUILD_ICON, BeachLocked, PLOT_NAME, PlotPanel } from "@/components/island/beach-ui";
import { ARCADE, BEACH_LEVEL, PLOTS, arcadeCap, arcadeToday, buildKind, plotIncomeToday, plotStatus, type BuildType } from "@/lib/island/beach";
import { islandLevel, shells, today, useIsland } from "@/lib/island/progress";

/** Đảo Cát Vui: quầy trò chơi + 4 ô đất tự chọn xây. */
export default function BeachPage() {
  const s = useIsland();
  const [mounted, setMounted] = useState(false);
  const [plot, setPlot] = useState<string | null>(null);
  useEffect(() => setMounted(true), []);
  const lv = islandLevel(s.xp);
  const t = today();
  const cap = mounted ? arcadeCap(s) : 30;
  const got = mounted ? arcadeToday(s, t) : 0;
  const income = mounted ? plotIncomeToday(s, t) : 0;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <BackLink href="/island?view=beach" label="Đảo Cát Vui" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">Đảo Cát Vui</h1>
          <p className="text-sm font-semibold text-[#6B4A30]">Chơi vài ván xả stress, xây công trình kiếm vỏ sò mỗi ngày học.</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full clay bg-white px-3 py-1.5 font-baloo font-extrabold" title="Vỏ sò của bạn">
          <Shell className="w-4 h-4 text-[#C99A1E]" /> {mounted ? shells(s) : 0}
        </span>
      </div>

      {mounted && lv.level < BEACH_LEVEL ? (
        <BeachLocked level={lv.level} pct={lv.pct} />
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-[#C96A2B]" />
              <h2 className="font-baloo font-extrabold text-xl">Quầy trò chơi</h2>
              <span className="ml-auto text-xs sm:text-sm font-bold text-[#6B4A30]">
                Vỏ sò từ trò chơi hôm nay: <b>{got}/{cap}</b>
              </span>
            </div>
            <ul className="grid sm:grid-cols-2 gap-3">
              {ARCADE.map((g) => (
                <li key={g.id}>
                  <Link href={g.href} data-sfx="whoosh" className="clay rounded-[22px] bg-white p-3.5 flex gap-3 items-center hover:-translate-y-0.5 transition-transform h-full">
                    <span className="w-16 h-16 shrink-0 rounded-[18px] p-1.5 grid grid-cols-2 gap-0.5" style={{ background: g.id === "merge" ? "#CDE8F4" : "#DDF0D0", border: "2.5px solid #8B5E3C" }}>
                      {g.id === "merge" ? [0, 2, 3, 9].map((t) => <SeaTierArt key={t} tier={t} />) : [0, 1, 4, 2].map((k) => <ProduceArt key={k} kind={k} />)}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-baloo font-extrabold text-lg leading-tight">{g.title}</span>
                      <span className="block text-sm font-semibold text-[#6B4A30] leading-snug">{g.desc}</span>
                      <span className="mt-1 inline-flex items-center gap-1 text-xs font-extrabold text-[#C96A2B]">
                        <Trophy className="w-3.5 h-3.5" /> Kỷ lục: {mounted ? s.arcade.best[g.id] || 0 : 0}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
              {[
                { icon: Fish, title: "Câu cá chiều", desc: "Chạm đúng lúc để kéo cần, cá hiếm thỉnh thoảng mới ra." },
                { icon: Layers, title: "Lật thẻ trí nhớ", desc: "Lật 2 thẻ cho trùng cặp, lấy từ Sổ từ của bạn." },
              ].map((g) => (
                <li key={g.title} className="rounded-[22px] border-[3px] border-dashed border-[#D8BF92] p-3.5 flex gap-3 items-center opacity-80">
                  <span className="w-16 h-16 shrink-0 rounded-[18px] bg-[#F3E6CC] flex items-center justify-center">
                    <g.icon className="w-7 h-7 text-[#8B6B48]" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-baloo font-extrabold text-lg leading-tight text-[#6B4A30]">{g.title}</span>
                    <span className="block text-sm font-semibold text-[#8B6B48] leading-snug">{g.desc}</span>
                    <span className="mt-1 inline-block text-[11px] font-extrabold rounded-full px-2 py-0.5 bg-[#F3E6CC] text-[#8B5E3C]">Sắp có</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-[#3F7A34]" />
              <h2 className="font-baloo font-extrabold text-xl">Ô đất của bạn</h2>
              <span className="ml-auto text-xs sm:text-sm font-bold text-[#6B4A30]">
                Công trình làm ra hôm nay: <b>+{income}</b>
                {mounted && !s.studyDays.includes(t) && " (học một bài là có)"}
              </span>
            </div>
            <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {PLOTS.map((p) => {
                const st = mounted ? plotStatus(s, lv.level, p.id) : "locked";
                const ps = s.plots[p.id];
                const k = buildKind(ps?.t);
                const Icon = k ? BUILD_ICON[k.id as BuildType] : st === "wild" ? Shovel : st === "locked" ? Lock : Sprout;
                return (
                  <li key={p.id}>
                    <button type="button" data-sfx="open" onClick={() => setPlot(p.id)} className={cx("w-full h-full rounded-[22px] p-3 flex flex-col items-center text-center gap-1.5 transition-transform hover:-translate-y-0.5", k ? "clay bg-white" : "border-[3px] border-dashed border-[#D8BF92] bg-[#FFF8EA]")}>
                      <span className={cx("w-14 h-14 rounded-[18px] flex items-center justify-center", k ? "gem text-white" : "bg-[#F3E6CC] text-[#8B6B48]")} style={k ? { ["--tone" as string]: k.tone } : undefined}>
                        <Icon className="w-7 h-7" />
                      </span>
                      <span className="font-baloo font-extrabold leading-tight">{k ? k.name : PLOT_NAME[p.id]}</span>
                      <span className="text-xs font-semibold text-[#6B4A30] leading-snug">
                        {k ? `Bậc ${ps!.lv} · +${k.income[ps!.lv - 1]}/ngày học` : st === "locked" ? `Mở ở cấp ${p.level}` : st === "wild" ? `Khai hoang · ${p.clear} vỏ sò` : "Đất trống · bấm để xây"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
      {plot && <PlotPanel id={plot} onClose={() => setPlot(null)} />}
    </div>
  );
}
