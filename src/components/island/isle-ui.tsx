"use client";

// Giao diện Đảo Luyện trên bản đồ: bảng công trình, thanh dưới khi đang ở Đảo Luyện, lượt giới thiệu lần đầu.
import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, BookHeart, BookOpen, ClipboardList, Construction, Ear, Hourglass, LayoutGrid, Mic2, Phone, Sailboat, Shell, Sparkles, Swords, TreePalm, X } from "lucide-react";
import { Avatar } from "./character";
import { cx } from "./ui";
import { BUILD_BONUS, ISLE, isleSpot, type IsleId, type PracticePick } from "@/lib/island/isle";

export const ISLE_ICON: Record<IsleId, React.ElementType> = {
  call: Phone,
  mission: ClipboardList,
  shadow: Mic2,
  listen: Ear,
  stories: BookOpen,
  mirror: Hourglass,
  lesson: BookHeart,
  visit: Sailboat,
  boss: Swords,
};

/** Bảng nhỏ khi bấm vào công trình: đã dựng thì vào luôn (trang tự chuyển), chưa dựng thì giải thích cách dựng. */
export function IslePanel({ id, built, pick, bossNote, onClose }: { id: IsleId; built: boolean; pick: PracticePick | null; bossNote?: string | null; onClose: () => void }) {
  const sp = isleSpot(id)!;
  const Icon = ISLE_ICON[id];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-3 bg-[#4A3222]/40" onClick={onClose} role="dialog" aria-modal="true" aria-label={sp.place}>
      <div className="cci-card-wood w-full max-w-md p-5 flex flex-col gap-3 anim-pop" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <span className="gem w-14 h-14 shrink-0 rounded-[18px] flex items-center justify-center text-white" style={{ ["--tone" as string]: sp.tone }}>
            {built ? <Icon className="w-7 h-7" /> : <Construction className="w-7 h-7" />}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#3F7A34]">Đảo Luyện · {sp.place}</div>
            <h2 className="text-2xl font-extrabold leading-tight">{sp.feature}</h2>
          </div>
          <button type="button" data-sfx="close" onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#F3E6CC]" aria-label="Đóng">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="font-semibold text-[#4A3222] leading-snug">{sp.pitch}</p>
        {!built && (
          <p className="rounded-[14px] bg-[#FFF1C7] border-2 border-[#E6C46A] px-3 py-2 text-sm font-bold text-[#6B4A30] leading-snug flex items-start gap-2">
            <Construction className="w-4 h-4 shrink-0 mt-0.5 text-[#C96A2B]" />
            <span>
              Công trình đang dựng dở. Thử {sp.feature.toLowerCase()} lần đầu là dựng xong, nhận thêm <b>{BUILD_BONUS} vỏ sò</b>.
            </span>
          </p>
        )}
        {bossNote && <p className="text-sm font-bold text-[#7A3E2C]">{bossNote}</p>}
        {pick?.id === id && (
          <p className="text-sm font-bold text-[#2C5A25] flex items-start gap-1.5">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" /> Gợi ý hôm nay: {pick.why}
          </p>
        )}
        <Link href={sp.href} data-sfx="whoosh" className="cci-btn cci-btn-primary self-stretch justify-center">
          {built ? "Vào luyện" : "Thử ngay"} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

/** Thanh dưới khi máy quay đang ở Đảo Luyện. */
export function IsleBar({ builtCount, pick, onHome }: { builtCount: number; pick: PracticePick | null; onHome: () => void }) {
  const sp = pick ? isleSpot(pick.id) : null;
  const Icon = pick ? ISLE_ICON[pick.id] : Sparkles;
  return (
    <div className="cci-h-bar order-1 hud:absolute hud:left-1/2 hud:-translate-x-1/2 hud:bottom-4 hud:z-10 hud:w-[min(780px,calc(100%-12rem))] flex items-center gap-3 rounded-[24px] clay p-2 pl-2.5">
      <button type="button" data-sfx="whoosh" onClick={onHome} className="shrink-0 flex flex-col items-center justify-center gap-0.5 rounded-[16px] h-[62px] w-[62px] bg-[#F3E6CC] hover:bg-[#EAD9B8] transition-colors" title="Về đảo nhà" aria-label="Về đảo nhà">
        <TreePalm className="w-6 h-6 text-[#3F7A34]" />
        <span className="font-baloo font-extrabold text-[11px] leading-none">Đảo nhà</span>
      </button>
      <div className="flex-1 min-w-0">
        <span className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#3F7A34]">
          <span className="shrink-0">Đảo Luyện · đã dựng {builtCount}/{ISLE.length}</span>
          <Link href="/island/practice" className="normal-case tracking-normal text-[#6B4A30] underline underline-offset-2 inline-flex items-center gap-1 shrink-0 cci-hit relative" aria-label="Xem dạng danh sách" title="Xem dạng danh sách">
            <LayoutGrid className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Xem dạng danh sách</span>
          </Link>
        </span>
        {sp && pick ? (
          <>
            <span className="block font-extrabold text-[15px] sm:text-[16px] leading-snug mt-0.5 line-clamp-2 sm:truncate">
              <span className="hidden sm:inline">Hôm nay nên luyện: </span>
              <span className="sm:hidden">Gợi ý: </span>
              {sp.feature}
            </span>
            <span className="block text-[13px] font-semibold text-[#6B4A30] leading-snug line-clamp-1 sm:line-clamp-2">{pick.why}</span>
          </>
        ) : (
          <span className="block font-extrabold text-[15px] leading-snug mt-0.5">Bấm vào một công trình để luyện.</span>
        )}
      </div>
      {sp && (
        <Link
          href={sp.href}
          data-sfx="whoosh"
          className="gloss shrink-0 flex flex-col items-center justify-center rounded-[18px] h-[62px] px-4 min-w-[104px] text-white hover:-translate-y-0.5 active:translate-y-0.5 transition-transform"
          style={{ background: "linear-gradient(180deg,#5E9E3E,#3F7A34)", border: "3px solid #2C5A25", boxShadow: "0 4px 0 #2C5A25" }}
        >
          <Icon className="w-4 h-4" />
          <span className="font-baloo font-extrabold text-[17px] leading-tight flex items-center gap-1 mt-0.5">
            Đi thôi <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      )}
    </div>
  );
}

export type TourStep = 0 | 1 | 2;

/** Lượt giới thiệu 3 bước, hiện một lần. Bước 2–3 máy quay sang Đảo Luyện (trang tự làm). */
export function IsleTour({ step, pick, has3d, onNext, onDone }: { step: TourStep; pick: PracticePick | null; has3d: boolean; onNext: () => void; onDone: () => void }) {
  const sp = pick ? isleSpot(pick.id) : null;
  const pages = [
    {
      title: "Chào mừng tới Đảo Tám Chuyện!",
      body: "Mỗi ngày bạn chỉ cần làm theo thanh “Hôm nay” ở dưới: 3 bước, khoảng 10 phút. Học xong thì đảo lớn dần.",
    },
    {
      title: "Qua cầu là Đảo Luyện",
      body: has3d
        ? "Mỗi công trình là một cách luyện nói: gọi điện, nói đuổi, nghe nhiều giọng, kể chuyện, thử thách cuối tuần…"
        : "Bấm nút “Luyện” ở thanh công cụ để vào Đảo Luyện: gọi điện, nói đuổi, nghe nhiều giọng, kể chuyện, thử thách cuối tuần…",
    },
    {
      title: "Còn giàn giáo = chưa thử",
      body: `Thử một món lần đầu là công trình được dựng xong, bạn nhận thêm ${BUILD_BONUS} vỏ sò.${sp ? ` Hôm nay gợi ý: ${sp.feature}.` : ""}`,
    },
  ];
  const pg = pages[step];
  return (
    <div className="fixed inset-x-0 bottom-3 hud:bottom-auto hud:top-24 z-[65] flex justify-center px-3 pointer-events-none" role="dialog" aria-label="Giới thiệu Đảo Luyện">
      <div className="pointer-events-auto w-full max-w-md cci-card-wood p-4 flex gap-3 anim-pop">
        <Avatar who="bo" size={52} />
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h2 className="font-baloo font-extrabold text-lg leading-tight flex-1">{pg.title}</h2>
            <span className="flex gap-1" aria-label={`Bước ${step + 1}/3`}>
              {[0, 1, 2].map((i) => (
                <span key={i} className={cx("w-2 h-2 rounded-full", i <= step ? "bg-[#3F7A34]" : "bg-[#E6D6B6]")} />
              ))}
            </span>
          </div>
          <p className="text-sm font-semibold text-[#4A3222] leading-snug">{pg.body}</p>
          <div className="flex items-center gap-2 justify-end">
            <button type="button" data-sfx="close" className="text-xs font-extrabold underline underline-offset-4 text-[#6B4A30] mr-auto" onClick={onDone}>
              Bỏ qua
            </button>
            {step < 2 ? (
              <button type="button" data-sfx="whoosh" className="cci-btn cci-btn-primary !min-h-[40px]" onClick={onNext}>
                Tiếp <ArrowRight className="w-4 h-4" />
              </button>
            ) : sp ? (
              <Link href={sp.href} data-sfx="whoosh" className="cci-btn cci-btn-primary !min-h-[40px]" onClick={onDone}>
                Thử {sp.feature} <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <button type="button" className="cci-btn cci-btn-primary !min-h-[40px]" onClick={onDone}>
                Xong
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Thông báo vừa dựng xong công trình. */
export function BuiltToast({ id, onClose }: { id: IsleId; onClose: () => void }) {
  const sp = isleSpot(id)!;
  useEffect(() => {
    const t = setTimeout(onClose, 5200);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed inset-x-0 top-20 z-[70] flex justify-center px-3 pointer-events-none">
      <div className="pointer-events-auto max-w-md rounded-[20px] px-5 py-2.5 bg-[#3F7A34] text-white font-extrabold border-[3px] border-[#2C5A25] shadow-[0_4px_0_#2C5A25] anim-pop flex items-center gap-2 text-left">
        <Sparkles className="w-4 h-4 shrink-0" />
        <span>
          Đảo Luyện vừa dựng xong {sp.place.toLowerCase()}! <span className="inline-flex items-center gap-0.5 text-[#FFE7A8]">+{BUILD_BONUS} <Shell className="w-4 h-4" /></span>
        </span>
      </div>
    </div>
  );
}
