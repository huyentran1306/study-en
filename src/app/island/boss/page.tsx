"use client";

import { useEffect, useState } from "react";
import { Lock, Swords, Trophy } from "lucide-react";
import { Avatar } from "@/components/island/character";
import { BackLink, cx } from "@/components/island/ui";
import { MissionPlay } from "@/components/island/mission-play";
import { BOSSES, bossOpen, weeklyBoss } from "@/lib/island/missions";
import { useIsland } from "@/lib/island/progress";

const DAY_VI = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

export default function BossPage() {
  const s = useIsland();
  const [now, setNow] = useState<Date | null>(null);
  const [run, setRun] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => setNow(new Date()), []);
  if (!now) return null;
  const boss = weeklyBoss(now);
  const open = bossOpen(now);
  const daysToSat = (6 - now.getDay() + 7) % 7;

  if (playing && open)
    return (
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <MissionPlay
          key={run}
          m={boss}
          onExit={() => {
            setPlaying(false);
            setRun((r) => r + 1);
          }}
        />
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <BackLink href="/island?view=isle" label="Đảo Luyện" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">Thử thách cuối tuần</h1>
          <p className="text-sm font-semibold text-[#6B4A30]">Mỗi Thứ 7 và Chủ nhật có một tình huống khó: 4 phút, cư dân đang vội hoặc bực. Qua được thì nhận cúp hiếm cho đảo.</p>
        </div>
      </div>

      <section className="rounded-[26px] border-[3px] border-[#4A3222] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 text-white" style={{ background: "linear-gradient(135deg,#7A3E2C,#4A2A3F)" }}>
        <Avatar who={boss.npc} size={64} />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-extrabold tracking-[0.12em] uppercase opacity-80">Tuần này · {boss.level}</div>
          <h2 className="text-2xl font-extrabold leading-tight">{boss.title}</h2>
          <p className="text-sm font-semibold opacity-90 leading-snug">{boss.brief}</p>
          {s.trophies[boss.boss!.trophy] && <p className="text-sm font-extrabold text-[#FFE08A] mt-1">Bạn đã có cúp “{boss.boss!.trophyVi}”. Chơi lại để luyện thêm!</p>}
        </div>
        {open ? (
          <button type="button" className="cci-btn cci-btn-primary cci-btn-big shrink-0" onClick={() => setPlaying(true)}>
            <Swords className="w-5 h-5" /> Vào trận
          </button>
        ) : (
          <div className="shrink-0 rounded-[18px] bg-white/15 px-4 py-3 text-center font-extrabold">
            <Lock className="w-5 h-5 mx-auto mb-1" />
            Mở {daysToSat === 1 ? "ngày mai" : `sau ${daysToSat} ngày`}
            <div className="text-xs font-semibold opacity-80">{DAY_VI[6]} và {DAY_VI[0]}</div>
          </div>
        )}
      </section>

      <section className="cci-card-wood p-4 flex flex-col gap-3">
        <h2 className="font-baloo font-extrabold text-xl flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#C99A1E]" /> Tủ cúp
        </h2>
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {BOSSES.map((b) => {
            const has = !!s.trophies[b.boss!.trophy];
            return (
              <li key={b.id} className={cx("rounded-[18px] border-2 px-2 py-3 text-center", has ? "bg-[#FFF4CC] border-[#E2B93B]" : "bg-white/60 border-dashed border-[#D8BF92]")}>
                <Trophy className={cx("w-8 h-8 mx-auto", has ? "text-[#C99A1E] fill-[#F2C14E]" : "text-[#D8BF92]")} />
                <div className="text-sm font-extrabold mt-1">{has ? b.boss!.trophyVi : "???"}</div>
                <div className="text-[11px] font-semibold text-[#6B4A30]">{b.title}</div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
