"use client";

// Giao diện Đảo Phố Cảng (A2) và Bản đồ biển trên bản đồ đảo.
import { ArrowRight, Anchor, Compass, Hotel, Lock, Mail, Stethoscope, TreePalm, Utensils } from "lucide-react";
import { cx } from "./ui";
import { CHAPTERS } from "@/lib/island/curriculum";
import { ISLANDS, type HarborPlace, type HarborPlaceId, type IslandId } from "@/lib/island/harbor";

export const HARBOR_ICON: Record<HarborPlaceId, React.ElementType> = { hotel: Hotel, restaurant: Utensils, post: Mail, clinic: Stethoscope };

const BAR = "cci-h-bar order-1 hud:absolute hud:left-1/2 hud:-translate-x-1/2 hud:bottom-4 hud:z-10 hud:w-[min(780px,calc(100%-12rem))] flex items-center gap-3 rounded-[24px] clay p-2 pl-2.5";

function HomeBtn({ onHome }: { onHome: () => void }) {
  return (
    <button type="button" data-sfx="whoosh" onClick={onHome} className="shrink-0 flex flex-col items-center justify-center gap-0.5 rounded-[16px] h-[62px] w-[62px] bg-[#F3E6CC] hover:bg-[#EAD9B8] transition-colors" title="Về đảo nhà" aria-label="Về đảo nhà">
      <TreePalm className="w-6 h-6 text-[#3F7A34]" />
      <span className="font-baloo font-extrabold text-[11px] leading-none">Đảo nhà</span>
    </button>
  );
}

/** Thanh dưới khi đang ở Đảo Phố Cảng. quest: địa điểm của chương đang học (nếu là chương A2). */
export function HarborBar({ open, quest, onHome, onQuest }: { open: boolean; quest: HarborPlace | null; onHome: () => void; onQuest: () => void }) {
  const ch = quest ? CHAPTERS.find((c) => c.id === quest.ch) : null;
  return (
    <div className={BAR}>
      <HomeBtn onHome={onHome} />
      <div className="flex-1 min-w-0">
        <span className="block text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#4E7FB8]">Đảo Phố Cảng · A2</span>
        {!open ? (
          <>
            <span className="block font-extrabold text-[15px] sm:text-[16px] leading-snug mt-0.5">Mây còn phủ kín đảo</span>
            <span className="block text-[13px] font-semibold text-[#6B4A30] leading-snug line-clamp-2">Học xong 4 chương A1 là phà bắt đầu chạy.</span>
          </>
        ) : ch && quest ? (
          <>
            <span className="block font-extrabold text-[15px] sm:text-[16px] leading-snug mt-0.5 truncate">
              Chương {ch.id} · {ch.title}
            </span>
            <span className="block text-[13px] font-semibold text-[#6B4A30] leading-snug truncate">Bài tuần này ở {quest.name}.</span>
          </>
        ) : (
          <>
            <span className="block font-extrabold text-[15px] sm:text-[16px] leading-snug mt-0.5">Sân bay, nhà hàng, gọi điện, đi khám</span>
            <span className="block text-[13px] font-semibold text-[#6B4A30] leading-snug truncate">Bấm vào một công trình để ôn chương đó.</span>
          </>
        )}
      </div>
      {open && quest && (
        <button
          type="button"
          data-sfx="whoosh"
          onClick={onQuest}
          className="gloss shrink-0 flex flex-col items-center justify-center rounded-[18px] h-[62px] px-4 min-w-[104px] text-white hover:-translate-y-0.5 active:translate-y-0.5 transition-transform"
          style={{ background: "linear-gradient(180deg,#6E9BD6,#4E7FB8)", border: "3px solid #3D6797", boxShadow: "0 4px 0 #3D6797" }}
        >
          <Anchor className="w-4 h-4" />
          <span className="font-baloo font-extrabold text-[17px] leading-tight flex items-center gap-1 mt-0.5">
            Tới nơi <ArrowRight className="w-4 h-4" />
          </span>
        </button>
      )}
    </div>
  );
}

/** Thanh dưới trên Bản đồ biển: chọn đảo để ghé. */
export function ChartBar({ unlocked, onGo, onHome }: { unlocked: Record<IslandId, boolean>; onGo: (id: IslandId) => void; onHome: () => void }) {
  return (
    <div className={BAR}>
      <HomeBtn onHome={onHome} />
      <div className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#4E7FB8]">
          <Compass className="w-3.5 h-3.5" /> Bản đồ biển
        </span>
        <div className="flex gap-1.5 mt-1 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
          {ISLANDS.map((i) => (
            <button
              key={i.id}
              type="button"
              data-sfx="whoosh"
              onClick={() => onGo(i.id)}
              className={cx("shrink-0 rounded-full px-3 py-1 text-[13px] font-extrabold border-2 inline-flex items-center gap-1", unlocked[i.id] ? "bg-white border-[#8B5E3C] text-[#4A3222]" : "bg-[#F3E6CC] border-dashed border-[#B79A6E] text-[#8B6B48]")}
            >
              {!unlocked[i.id] && <Lock className="w-3 h-3" />}
              {i.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
