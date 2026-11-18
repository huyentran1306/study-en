"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Check, ChevronLeft, Languages, Lightbulb, Mic, Snail, Star, Volume2, X } from "lucide-react";
import { NPCS, type NpcId } from "@/lib/island/curriculum";
import { speak } from "@/lib/island/speech";
import { sfx } from "@/lib/island/sfx";

export function cx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

export function BackLink({ href = "/island", label = "Về đảo" }: { href?: string; label?: string }) {
  return (
    <Link href={href} className="cci-btn !min-h-[40px] !px-3 !text-sm" aria-label={label}>
      <ChevronLeft className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

export function CloseLink({ href = "/island" }: { href?: string }) {
  return (
    <Link href={href} className="cci-btn !min-h-[44px] !w-[44px] !p-0" aria-label="Thoát">
      <X className="w-5 h-5" />
    </Link>
  );
}

/** Thanh tiến độ dạng đoạn (như "Câu 2/5" trong design). */
export function Segments({ total, current, results }: { total: number; current: number; results?: ("ok" | "bad" | undefined)[] }) {
  return (
    <div className="flex gap-1.5 flex-1 max-w-xs">
      {Array.from({ length: total }).map((_, i) => {
        const r = results?.[i];
        const bg = i < current ? (r === "bad" ? "#F2C14E" : "#6FAE4F") : i === current ? "#F2C14E" : "#EAD9B8";
        return <span key={i} className="h-3 flex-1 rounded-full" style={{ background: bg, border: "2px solid #8B5E3C" }} />;
      })}
    </div>
  );
}

export function Stars({ n, size = 28, sound = false }: { n: number; size?: number; sound?: boolean }) {
  useEffect(() => {
    if (!sound) return;
    const ts = Array.from({ length: n }).map((_, i) => setTimeout(() => sfx.star(i), 250 + i * 260));
    return () => ts.forEach(clearTimeout);
  }, [n, sound]);
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <Star key={i} style={{ width: size, height: size }} className={cx(i < n ? "anim-pop" : "")} fill={i < n ? "#F2C14E" : "#EAD9B8"} stroke="#4A3222" strokeWidth={1.6} />
      ))}
    </div>
  );
}

export function SpeakButtons({ text, who, vi, showVi = true }: { text: string; who?: NpcId | "you"; vi?: string; showVi?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="cci-btn !min-h-[38px] !px-3 !text-sm" onClick={() => speak(text, { who })}>
          <Volume2 className="w-4 h-4" /> Nghe
        </button>
        <button type="button" className="cci-btn !min-h-[38px] !px-3 !text-sm" onClick={() => speak(text, { who, speed: "slow" })}>
          <Snail className="w-4 h-4" /> Nghe chậm
        </button>
        {vi && showVi && (
          <button type="button" className="cci-btn !min-h-[38px] !px-3 !text-sm" onClick={() => setOpen((o) => !o)} aria-pressed={open}>
            <Languages className="w-4 h-4" /> {open ? "Ẩn nghĩa" : "Xem nghĩa"}
          </button>
        )}
      </div>
      {open && vi && <p className="text-[15px] font-semibold text-[#6B4A30] anim-pop">{vi}</p>}
    </div>
  );
}

/** Bong bóng lời thoại của NPC. */
export function Bubble({ who, children, sub }: { who: NpcId; children: ReactNode; sub?: string }) {
  const npc = NPCS[who];
  return (
    <div className="cci-card !rounded-[22px] px-4 py-3 sm:px-5 sm:py-4 relative">
      <span className="cci-chip !text-xs !py-0.5 !rounded-full !bg-[#F3E4C6] mb-1.5">
        {npc.name} · {sub || npc.role}
      </span>
      {children}
    </div>
  );
}

/** Thẻ góp ý: xanh (đúng) hoặc cam (chưa đúng). */
export function Feedback({ ok, title, children, silent }: { ok: boolean; title?: string; children: ReactNode; silent?: boolean }) {
  useEffect(() => {
    if (!silent) (ok ? sfx.correct : sfx.wrong)();
  }, [ok, silent]);
  return (
    <div
      className={cx("rounded-[18px] px-4 py-3 flex gap-3 items-start anim-pop", ok ? "anim-bounce" : "")}
      style={{ background: ok ? "#EAF3DC" : "#FDEEDD", border: `3px solid ${ok ? "#3F7A34" : "#C96A2B"}` }}
      role="status"
    >
      <span
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white"
        style={{ background: ok ? "#3F7A34" : "#C96A2B" }}
      >
        {ok ? <Check className="w-5 h-5" strokeWidth={3} /> : <Lightbulb className="w-5 h-5" />}
      </span>
      <div className="min-w-0">
        <div className="font-baloo font-extrabold text-lg leading-tight" style={{ color: ok ? "#2C5A25" : "#A4521D" }}>
          {title || (ok ? "Chuẩn rồi!" : "Gần đúng rồi, thử lại nhé")}
        </div>
        <div className="text-[15px] font-semibold leading-snug mt-0.5">{children}</div>
      </div>
    </div>
  );
}

export function MicButton({ listening, onClick, disabled, label = "hoặc tự nói" }: { listening: boolean; onClick: () => void; disabled?: boolean; label?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="relative w-[72px] h-[72px] rounded-full flex items-center justify-center text-white disabled:opacity-50"
        style={{ background: listening ? "#C96A2B" : "#3F7A34", border: `3px solid ${listening ? "#A4521D" : "#2C5A25"}`, boxShadow: `0 4px 0 ${listening ? "#A4521D" : "#2C5A25"}` }}
        aria-label={listening ? "Dừng ghi âm" : "Bấm để nói"}
      >
        {listening && <span className="absolute inset-0 rounded-full mic-ring" style={{ background: "#C96A2B" }} />}
        {listening ? (
          <span className="relative flex items-center gap-1 h-7">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="wave-bar w-1.5 h-7 rounded bg-white" style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
          </span>
        ) : (
          <Mic className="w-8 h-8 relative" />
        )}
      </button>
      <span className="text-xs font-extrabold text-[#2C5A25]">{listening ? "đang nghe..." : label}</span>
    </div>
  );
}

/** Hiện câu mẫu, tô xanh các từ đã nói đúng, cam các từ bị thiếu. */
export function WordMarks({ marks }: { marks: { word: string; ok: boolean }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {marks.map((m, i) => (
        <span
          key={i}
          className="px-2 py-0.5 rounded-lg font-baloo font-extrabold text-[17px]"
          style={{ background: m.ok ? "#EAF3DC" : "#FDEEDD", color: m.ok ? "#2C5A25" : "#A4521D", border: `2px solid ${m.ok ? "#6FAE4F" : "#E0A26E"}` }}
        >
          {m.word}
        </span>
      ))}
    </div>
  );
}

export function SectionTitle({ kicker, title, right }: { kicker?: string; title: string; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        {kicker && <div className="text-xs font-extrabold tracking-[0.1em] uppercase text-[#3F7A34]">{kicker}</div>}
        <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">{title}</h2>
      </div>
      {right}
    </div>
  );
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
