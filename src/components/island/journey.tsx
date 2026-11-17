"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Gift, Map as MapIcon, X } from "lucide-react";
import { SPRINT_DAYS, chestOpened, openChest, sprintInfo, todayPlan, useIsland } from "@/lib/island/progress";
import { useGame } from "@/contexts/game-context";
import { sfx } from "@/lib/island/sfx";
import { cx } from "./ui";

function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

function ChestButton({ big }: { big?: boolean }) {
  const { addXP } = useGame();
  const [opened, setOpened] = useState(false);
  return (
    <button
      type="button"
      data-sfx="none"
      onClick={() => {
        if (openChest()) {
          sfx.unlock();
          addXP(30);
          setOpened(true);
          import("@/lib/confetti").then((m) => m.fireCelebration()).catch(() => {});
        }
      }}
      className={cx("cci-btn cci-btn-primary anim-bounce", big && "cci-btn-big")}
    >
      <Gift className="w-5 h-5" /> {opened ? "+30 XP!" : "Mở rương thưởng hôm nay"}
    </button>
  );
}

/** Nút "Bước tiếp theo" đặt ở cuối mỗi màn kết quả — dẫn người học sang việc kế tiếp trong ngày. */
export function NextStep({ className = "" }: { className?: string }) {
  const s = useIsland();
  const mounted = useMounted();
  if (!mounted) return null;
  const plan = todayPlan(s);
  const done = plan.filter((p) => p.done).length;
  const next = plan.find((p) => !p.done);
  const sp = sprintInfo(s);
  const n = plan.length;
  return (
    <div className={cx("w-full rounded-[20px] border-[3px] border-dashed border-[#D9A92F] bg-[#FFF9EE] px-4 py-3 flex flex-col sm:flex-row items-center gap-3 text-left", className)}>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-extrabold uppercase tracking-wide text-[#A4521D]">{sp.on ? `Nước rút · Ngày ${sp.day}/${SPRINT_DAYS}` : "Hành trình hôm nay"} · {done}/{n}</div>
        <div className="font-baloo font-extrabold text-lg leading-tight">
          {next ? `Tiếp theo: ${next.title}` : chestOpened(s) ? `Xong cả ${n} bước hôm nay! Mai gặp lại nhé 🌙` : `Xong cả ${n} bước — rương thưởng đang chờ!`}
        </div>
        {next && <div className="text-sm font-semibold text-[#6B4A30]">{next.desc} · ~{next.mins} phút</div>}
      </div>
      {next ? (
        <Link href={next.href} className="cci-btn cci-btn-primary shrink-0" data-sfx="whoosh">
          Đi tiếp <ArrowRight className="w-4 h-4" />
        </Link>
      ) : !chestOpened(s) ? (
        <ChestButton />
      ) : (
        <Link href="/island" className="cci-btn shrink-0">
          Về đảo
        </Link>
      )}
    </div>
  );
}

/** Bảng "Hành trình hôm nay" trên bản đồ: 3 bước có thứ tự + rương thưởng. */
export function JourneyPanel({ onClose }: { onClose: () => void }) {
  const s = useIsland();
  const plan = todayPlan(s);
  const done = plan.filter((p) => p.done).length;
  const firstOpen = plan.findIndex((p) => !p.done);
  const sp = sprintInfo(s);
  const n = plan.length;
  const mins = plan.reduce((a, p) => a + p.mins, 0);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-3 bg-[#4A3222]/40" onClick={onClose} role="dialog" aria-modal="true" aria-label="Hành trình hôm nay">
      <div className="cci-card-wood w-full max-w-lg p-5 flex flex-col gap-4 anim-pop" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-[14px] border-[3px] border-[#4A3222] bg-[#FFF1C7] flex items-center justify-center">
            <MapIcon className="w-6 h-6" />
          </span>
          <div className="flex-1">
            <h2 className="text-2xl font-extrabold leading-tight">{sp.on ? `Nước rút · Ngày ${sp.day}/${SPRINT_DAYS}` : "Hành trình hôm nay"}</h2>
            <p className="font-semibold text-[#6B4A30] text-sm">
              {n} bước · khoảng {mins} phút · làm theo thứ tự nhé
              {sp.on && sp.behind > 0 ? ` · đang chậm ${sp.behind} ngày` : ""}
            </p>
          </div>
          <button type="button" onClick={onClose} className="cci-btn !min-h-[40px] !w-[40px] !p-0" aria-label="Đóng" data-sfx="close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="h-3 rounded-full bg-[#EAD9B8] border-2 border-[#8B5E3C] overflow-hidden">
          <div className="h-full bg-[#6FAE4F] transition-all" style={{ width: `${(done / n) * 100}%` }} />
        </div>
        <ol className="flex flex-col gap-2.5">
          {plan.map((p, i) => {
            const isNext = i === firstOpen;
            return (
              <li key={p.key}>
                <Link
                  href={p.href}
                  data-sfx="whoosh"
                  className={cx(
                    "flex items-center gap-3 rounded-[18px] border-[3px] px-4 py-3 bg-white transition-transform hover:-translate-y-0.5",
                    p.done ? "border-[#6FAE4F] bg-[#F4FAEC]" : isNext ? "border-[#F2C14E] shadow-[0_4px_0_#D9A92F]" : "border-[#EAD9B8]",
                  )}
                >
                  <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-baloo font-extrabold" style={{ background: p.done ? "#3F7A34" : isNext ? "#F2C14E" : "#FBF3E2", color: p.done ? "#fff" : "#4A3222", border: "3px solid " + (p.done ? "#3F7A34" : "#D8BF92") }}>
                    {p.done ? <Check className="w-4 h-4" strokeWidth={3.5} /> : i + 1}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-baloo font-extrabold leading-tight">{p.title}</span>
                    <span className="block text-xs font-semibold text-[#6B4A30]">{p.desc}</span>
                  </span>
                  <span className="text-xs font-bold text-[#6B4A30] shrink-0">{p.done ? "Xong" : `~${p.mins}′`}</span>
                  {!p.done && <ArrowRight className="w-4 h-4 shrink-0" />}
                </Link>
              </li>
            );
          })}
        </ol>
        <div className="flex items-center gap-3 rounded-[18px] px-4 py-3" style={{ background: "#FFF9EE", border: "3px dashed #D9A92F" }}>
          <Gift className="w-8 h-8 text-[#C96A2B] shrink-0" />
          <div className="flex-1 text-sm font-bold text-[#6B4A30]">{chestOpened(s) ? "Đã mở rương hôm nay. Giữ chuỗi ngày học để đảo ngày càng đẹp!" : `Xong cả ${n} bước để mở rương: +30 XP, xây đảo nhanh hơn.`}</div>
          {done === n && !chestOpened(s) && <ChestButton />}
        </div>
        {sp.on && sp.doneToday && !sp.finished && (
          <Link href="/island/path" data-sfx="whoosh" className="cci-btn self-center">
            Còn sức? Học vượt chặng ngày mai <ArrowRight className="w-4 h-4" />
          </Link>
        )}
        {!sp.on && (
          <Link href="/island/path" data-sfx="whoosh" className="text-sm font-extrabold text-[#A4521D] underline underline-offset-4 self-center">
            ⚡ Muốn nhanh hơn? Bật Nước rút 30 ngày ở trang Lộ trình
          </Link>
        )}
        <Link href="/island/garden" data-sfx="whoosh" className="text-sm font-extrabold text-[#2C5A25] underline underline-offset-4 self-center">
          🌱 Mỗi nhiệm vụ tuần làm cây trong Vườn Nhiệm Vụ lớn thêm — xem vườn
        </Link>
      </div>
    </div>
  );
}
