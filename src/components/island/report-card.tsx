"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpRight, ClipboardCheck, RefreshCw, Target, ThumbsUp, Volume2 } from "lucide-react";
import { SKILLS, TAG_VI, type ChatMetrics, type ErrorTag, type ReportAI, type SkillKey } from "@/lib/island/feedback";
import { speak } from "@/lib/island/speech";
import { cx } from "./ui";

export type ReportView = { ai: ReportAI | null; metrics: ChatMetrics; loading: boolean; offline: boolean; turnsAt: number };

/** Phiếu nhận xét sau cuộc trò chuyện: số liệu, 4 tiêu chí, điểm sáng, một điều cần sửa, nâng cấp câu. */
export function ReportCard({
  view,
  npcName,
  trend,
  tags,
  turns,
  praiseLine,
  onRefresh,
}: {
  view: ReportView;
  npcName: string;
  trend: Record<SkillKey, number>;
  tags: { tag: ErrorTag; count: number }[];
  turns: number;
  /** Câu được khen đã sửa lỗi (nếu câu gốc có lỗi). */
  praiseLine?: string;
  onRefresh: () => void;
}) {
  const { ai, metrics: m } = view;
  const more = turns - view.turnsAt;
  return (
    <section className="self-stretch rounded-[22px] border-[3px] border-[#8B5E3C] bg-white px-3.5 sm:px-4 py-3 flex flex-col gap-3 anim-pop" aria-label="Phiếu nhận xét">
      <div className="flex items-center gap-2 flex-wrap">
        <ClipboardCheck className="w-5 h-5 text-[#3F7A34] shrink-0" />
        <h2 className="font-baloo font-extrabold text-lg leading-tight flex-1 min-w-0">Phiếu nhận xét của {npcName}</h2>
        {ai && (
          <span className="text-xs font-extrabold rounded-full px-2.5 py-1 bg-[#EAF3DC] border-2 border-[#6FAE4F] text-[#2C5A25]" title="Mức CEFR ước lượng cho riêng buổi này">
            Buổi này ~{ai.cefr}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          [m.turns, "lượt nói"],
          [m.avgWords, "từ / câu"],
          [m.checked ? `${m.natural}/${m.checked}` : "–", "câu tự nhiên"],
        ].map(([v, l]) => (
          <div key={l as string} className="rounded-[14px] bg-[#FBF3E2] px-1 py-1.5">
            <div className="font-baloo font-extrabold text-xl leading-none">{v}</div>
            <div className="text-[11px] font-bold text-[#6B4A30] mt-0.5">{l}</div>
          </div>
        ))}
      </div>

      {view.loading && (
        <p className="text-sm font-bold text-[#6B4A30] flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" /> {npcName} đang viết nhận xét…
        </p>
      )}
      {!view.loading && !ai && (
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-[#A4521D] flex-1 min-w-0">AI đang bận nên chưa viết được nhận xét. Số liệu ở trên vẫn đúng.</p>
          <button type="button" className="cci-btn !min-h-[36px] !text-sm" onClick={onRefresh}>
            Thử lại
          </button>
        </div>
      )}

      {ai && (
        <>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            {SKILLS.map((sk) => {
              const v = ai.scores[sk.key];
              const t = trend[sk.key];
              return (
                <li key={sk.key} className="flex items-center gap-2" title={sk.hint}>
                  <span className="w-[86px] shrink-0 text-sm font-extrabold">{sk.vi}</span>
                  <span className="flex gap-1" aria-label={`${v} trên 5`}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className={cx("w-4 h-4 rounded-full border-2", i <= v ? "bg-[#F2C14E] border-[#C99A1E]" : "bg-[#F4EAD6] border-[#E6CF9A]")} />
                    ))}
                  </span>
                  {t !== 0 && (
                    <span className={cx("text-xs font-extrabold inline-flex items-center", t > 0 ? "text-[#2C5A25]" : "text-[#A4521D]")} title="So với các buổi gần đây">
                      {t > 0 ? <ArrowUp className="w-3.5 h-3.5" strokeWidth={3} /> : <ArrowDown className="w-3.5 h-3.5" strokeWidth={3} />}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="rounded-[16px] bg-[#EAF3DC] border-2 border-[#9CC77F] px-3 py-2">
            <div className="text-xs font-extrabold text-[#2C5A25] flex items-center gap-1">
              <ThumbsUp className="w-3.5 h-3.5" /> Điểm sáng
            </div>
            {ai.praise.quote && <div className="font-extrabold leading-snug">“{praiseLine || ai.praise.quote}”</div>}
            <div className="text-sm font-semibold text-[#2C5A25] leading-snug">{ai.praise.vi}</div>
          </div>

          <div className="rounded-[16px] bg-[#FFF6EA] border-2 border-[#E0A26E] px-3 py-2">
            <div className="text-xs font-extrabold text-[#A4521D] flex items-center gap-1">
              <Target className="w-3.5 h-3.5" /> Lần sau tập trung vào
            </div>
            <div className="font-extrabold leading-snug">{ai.focus.title}</div>
            <div className="text-sm font-semibold text-[#6B4A30] leading-snug">{ai.focus.tip}</div>
            {ai.focus.example && (
              <button type="button" data-sfx="none" onClick={() => speak(ai.focus.example, { who: "you" })} className="mt-1 text-left font-extrabold text-[15px] text-[#4A3222]">
                {ai.focus.example} <Volume2 className="inline w-3.5 h-3.5 text-[#3F7A34]" />
              </button>
            )}
          </div>

          {ai.upgrade && (
            <div className="rounded-[16px] bg-[#EAF5FB] border-2 border-[#9CCBE0] px-3 py-2">
              <div className="text-xs font-extrabold text-[#24566B] flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> Nâng cấp câu trả lời: nói dài hơn một chút
              </div>
              <div className="text-sm font-semibold text-[#6B4A30] leading-snug">Bạn nói: “{ai.upgrade.from}”</div>
              <button type="button" data-sfx="none" onClick={() => speak(ai.upgrade!.to, { who: "you" })} className="text-left font-extrabold leading-snug text-[#24566B]">
                {ai.upgrade.to} <Volume2 className="inline w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </>
      )}

      {tags.length > 0 && (
        <div className="text-[13px] font-semibold text-[#6B4A30] leading-snug">
          Lỗi bạn hay gặp nhất (cả Sổ lỗi sai):{" "}
          {tags.map((t, i) => (
            <span key={t.tag}>
              {i > 0 && " · "}
              <b className="text-[#4A3222]">{TAG_VI[t.tag]}</b> ({t.count})
            </span>
          ))}
          .{" "}
          <Link href="/island/phrases?fix=1" data-sfx="whoosh" className="font-extrabold underline underline-offset-2">
            Luyện lại
          </Link>
        </div>
      )}

      {more >= 2 && !view.loading && (
        <button type="button" className="cci-btn !min-h-[38px] !text-sm self-start" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4" /> Chấm lại cả {turns} lượt
        </button>
      )}
    </section>
  );
}
