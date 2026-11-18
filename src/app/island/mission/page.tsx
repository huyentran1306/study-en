"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Star } from "lucide-react";
import { Avatar } from "@/components/island/character";
import { BackLink, cx } from "@/components/island/ui";
import { MissionPlay } from "@/components/island/mission-play";
import { MISSIONS, missionById } from "@/lib/island/missions";
import { isUnlocked, useIsland } from "@/lib/island/progress";

function Inner() {
  const s = useIsland();
  const router = useRouter();
  const sp = useSearchParams();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const id = sp.get("id");
  const m = id ? missionById(id) : undefined;

  if (m && !m.boss)
    return (
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <MissionPlay key={m.id} m={m} onExit={() => router.replace("/island/mission")} />
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <BackLink href="/island?view=isle" label="Đảo Luyện" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">Nhiệm vụ hỏi thông tin</h1>
          <p className="text-sm font-semibold text-[#6B4A30]">Cư dân giữ vài thông tin. Hỏi đúng câu để lấy được, rồi điền vào phiếu. Không có lựa chọn sẵn, không đoán được!</p>
        </div>
      </div>
      <ul className="grid sm:grid-cols-2 gap-3">
        {MISSIONS.map((x) => {
          const open = mounted && isUnlocked(s, x.ch);
          const stars = mounted ? s.missions[x.id]?.stars || 0 : 0;
          return (
            <li key={x.id}>
              <button
                type="button"
                disabled={!open}
                onClick={() => router.push(`/island/mission?id=${x.id}`)}
                className={cx("w-full text-left clay rounded-[22px] p-3.5 flex items-center gap-3 transition-transform", open ? "hover:-translate-y-0.5 bg-white" : "opacity-60 bg-[#F4EAD6]")}
              >
                <Avatar who={x.npc} size={46} />
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-extrabold text-[#A4521D]">
                    Chương {x.ch} · {x.level}
                  </span>
                  <span className="block font-baloo font-extrabold text-lg leading-tight">{x.title}</span>
                  <span className="flex gap-0.5 mt-0.5" aria-label={`${stars} sao`}>
                    {[1, 2, 3].map((i) => (
                      <Star key={i} className={cx("w-4 h-4", i <= stars ? "fill-[#F2C14E] text-[#C99A1E]" : "text-[#D8BF92]")} />
                    ))}
                  </span>
                </span>
                {!open && <Lock className="w-5 h-5 text-[#8B6B45]" aria-label={`Mở khi tới chương ${x.ch}`} />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function MissionPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
