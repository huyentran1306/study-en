"use client";

// Bảng chọn đồ trang trí cho một ô ở Đảo Nhỏ Của Tôi.
import { useEffect, useState } from "react";
import { Shell, Trash2, X } from "lucide-react";
import { cx } from "./ui";
import { DECOR_ITEMS, MINE_LEVEL, decorItem } from "@/lib/island/decor";
import { clearDecor, islandLevel, placeDecor, shells, useIsland } from "@/lib/island/progress";
import { speak } from "@/lib/island/speech";
import { sfx } from "@/lib/island/sfx";

export function DecorPanel({ slot, onClose }: { slot: string; onClose: () => void }) {
  const s = useIsland();
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    const f = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [onClose]);
  const cur = decorItem(s.decor[slot]);
  const money = shells(s);
  const locked = islandLevel(s.xp).level < MINE_LEVEL;
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-3 bg-[#4A3222]/40" onClick={onClose} role="dialog" aria-modal="true" aria-label="Trang trí ô">
      <div className="cci-card-wood w-full max-w-md p-5 flex flex-col gap-3 anim-pop max-h-[88dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#3F7A34]">Đảo Nhỏ Của Tôi · ô {slot.slice(1)}</div>
            <h2 className="text-2xl font-extrabold leading-tight">{cur ? cur.name : "Ô trống"}</h2>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF1C7] border-2 border-[#E6C46A] px-2.5 py-1 font-baloo font-extrabold text-sm">
            <Shell className="w-4 h-4 text-[#C99A1E]" /> {money}
          </span>
          <button type="button" data-sfx="close" onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#F3E6CC]" aria-label="Đóng">
            <X className="w-5 h-5" />
          </button>
        </div>
        {locked ? (
          <p className="font-semibold text-[#6B4A30]">Đảo trang trí mở ở cấp đảo {MINE_LEVEL}. Học thêm để lên cấp nhé.</p>
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-2">
              {DECOR_ITEMS.map((it) => (
                <li key={it.id}>
                  <button
                    type="button"
                    disabled={money < it.cost && cur?.id !== it.id}
                    onClick={() => {
                      const r = placeDecor(slot, it.id);
                      if (r.ok) {
                        sfx.unlock();
                        speak(it.en, { who: "you" });
                        setMsg(`Đã đặt ${it.name.toLowerCase()} (${it.en}).`);
                      } else {
                        sfx.wrong();
                        setMsg(r.reason);
                      }
                    }}
                    className={cx("w-full text-left rounded-[14px] border-2 px-3 py-2 disabled:opacity-50", cur?.id === it.id ? "bg-[#E9F6E1] border-[#6FAE4F]" : "bg-white border-[#EAD9B8] hover:border-[#8B5E3C]")}
                  >
                    <span className="block font-baloo font-extrabold leading-tight">{it.name}</span>
                    <span className="block text-xs font-bold text-[#3F7A34]">{it.en}</span>
                    <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-extrabold text-[#6B4A30]">
                      <Shell className="w-3.5 h-3.5 text-[#C99A1E]" /> {it.cost}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {cur && (
              <button
                type="button"
                className="cci-btn !min-h-[38px] !text-sm self-start"
                onClick={() => {
                  clearDecor(slot);
                  setMsg("Đã dọn ô này.");
                }}
              >
                <Trash2 className="w-4 h-4" /> Dọn ô (không hoàn vỏ sò)
              </button>
            )}
          </>
        )}
        {msg && <p className="text-sm font-bold text-[#2C5A25]">{msg}</p>}
      </div>
    </div>
  );
}
