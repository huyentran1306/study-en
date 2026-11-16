"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, BookOpen, Check, RotateCcw, Volume2, X } from "lucide-react";
import { Character } from "@/components/island/character";
import { BackLink, Feedback, cx, shuffle } from "@/components/island/ui";
import { CHAPTERS } from "@/lib/island/curriculum";
import { completeMission, currentChapterId, dueWords, gradeWord, today, useIsland, type WordCard } from "@/lib/island/progress";
import { speak } from "@/lib/island/speech";
import { useGame } from "@/contexts/game-context";
import { NextStep } from "@/components/island/journey";

const BOX_LABEL = ["Mới", "Mới học", "Đang nhớ", "Khá nhớ", "Nhớ tốt", "Rất nhớ", "Thuộc lòng"];

function Inner() {
  const s = useIsland();
  const { addXP } = useGame();
  const sp = useSearchParams();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const all = Object.values(s.words);
  const due = dueWords(s);
  const chParam = Number(sp.get("ch"));
  const missionCh = chParam && s.chapters[chParam]?.lesson ? chParam : currentChapterId(s);

  const [session, setSession] = useState<WordCard[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ ok: 0, again: 0 });
  const [finished, setFinished] = useState(false);
  const [filter, setFilter] = useState<number | "all">("all");

  const startSession = (cards: WordCard[], limit = 20) => {
    setSession(shuffle(cards).slice(0, limit));
    setIdx(0);
    setFlipped(false);
    setStats({ ok: 0, again: 0 });
    setFinished(false);
  };

  const grade = (ok: boolean) => {
    if (!session) return;
    const card = session[idx];
    gradeWord(card.en, ok);
    setStats((st) => ({ ok: st.ok + (ok ? 1 : 0), again: st.again + (ok ? 0 : 1) }));
    if (idx + 1 >= session.length) {
      setFinished(true);
      if (s.chapters[missionCh]?.lesson && !s.chapters[missionCh]?.review) {
        completeMission(missionCh, "review", 15);
        addXP(15);
      }
    } else {
      setIdx(idx + 1);
      setFlipped(false);
    }
  };

  useEffect(() => {
    if (session && !finished && session[idx]) speak(session[idx].en);
  }, [session, idx, finished]);

  const listed = useMemo(() => all.filter((w) => filter === "all" || w.ch === filter).sort((a, b) => a.ch - b.ch || a.box - b.box), [all, filter]);
  const chaptersWithWords = CHAPTERS.filter((c) => all.some((w) => w.ch === c.id));

  // ───── Phiên ôn ─────
  if (session) {
    if (finished) {
      return (
        <div className="max-w-xl mx-auto px-3 py-8 flex flex-col items-center gap-4 text-center">
          <div className="w-36 rounded-[24px] bg-[#E4EFC9] pt-4 flex justify-center">
            <Character who="kero" mood="happy" size="80%" />
          </div>
          <h1 className="text-3xl font-extrabold">Ôn xong {session.length} thẻ!</h1>
          <p className="font-semibold text-[#6B4A30]">
            Nhớ: {stats.ok} · Cần ôn lại: {stats.again}. Thẻ “Quên” sẽ quay lại sớm, thẻ “Nhớ” được giãn lịch ôn.
          </p>
          <NextStep />
          <div className="flex gap-2 flex-wrap justify-center">
            <button type="button" className="cci-btn cci-btn-big" onClick={() => setSession(null)}>
              Về Sổ từ
            </button>
            <Link href="/island/path" className="cci-btn cci-btn-big">
              Lộ trình
            </Link>
          </div>
        </div>
      );
    }
    const card = session[idx];
    return (
      <div className="max-w-xl mx-auto px-3 sm:px-6 py-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button type="button" className="cci-btn !min-h-[44px] !w-[44px] !p-0" onClick={() => setSession(null)} aria-label="Thoát">
            <X className="w-5 h-5" />
          </button>
          <div className="flex-1 h-3 rounded-full bg-[#EAD9B8] border-2 border-[#8B5E3C] overflow-hidden">
            <div className="h-full bg-[#6FAE4F]" style={{ width: `${(idx / session.length) * 100}%` }} />
          </div>
          <span className="text-sm font-extrabold">
            {idx + 1}/{session.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setFlipped(true)}
          className="cci-card-wood !rounded-[28px] min-h-[300px] p-6 flex flex-col items-center justify-center gap-3 text-center"
        >
          <span className="cci-chip !text-xs">
            Chương {card.ch} · {BOX_LABEL[card.box]}
          </span>
          <span className="font-baloo font-extrabold text-4xl leading-tight">{card.en}</span>
          {flipped ? (
            <div className="anim-flip flex flex-col gap-2 items-center">
              <span className="text-xl font-extrabold text-[#3F7A34]">{card.vi}</span>
              <span className="font-semibold text-[#6B4A30]">“{card.ex}”</span>
            </div>
          ) : (
            <span className="text-sm font-bold text-[#B39B7A]">Nhớ nghĩa chưa? Chạm để lật thẻ</span>
          )}
        </button>
        <div className="flex justify-center gap-2">
          <button type="button" className="cci-btn" onClick={() => speak(card.en, { speed: "slow" })}>
            <Volume2 className="w-4 h-4" /> Nghe
          </button>
          <button type="button" className="cci-btn" onClick={() => speak(card.ex)}>
            <Volume2 className="w-4 h-4" /> Nghe câu ví dụ
          </button>
        </div>
        {flipped ? (
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="cci-btn cci-btn-big !border-[#C96A2B] !shadow-[0_4px_0_#C96A2B] !bg-[#FDEEDD]" onClick={() => grade(false)}>
              <RotateCcw className="w-5 h-5" /> Quên rồi
            </button>
            <button type="button" className="cci-btn cci-btn-primary cci-btn-big" onClick={() => grade(true)}>
              <Check className="w-5 h-5" /> Nhớ
            </button>
          </div>
        ) : (
          <button type="button" className="cci-btn cci-btn-primary cci-btn-big" onClick={() => setFlipped(true)}>
            Lật thẻ
          </button>
        )}
      </div>
    );
  }

  // ───── Tổng quan ─────
  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <BackLink />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight flex items-center gap-2">
            <BookOpen className="w-7 h-7" /> Sổ từ
          </h1>
          <p className="font-semibold text-[#6B4A30] text-sm sm:text-base">Ôn đúng lúc sắp quên · thẻ nhớ tốt sẽ giãn lịch ôn 1 → 30 ngày.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Stat label="Từ trong sổ" value={mounted ? all.length : 0} />
        <Stat label="Đến hạn hôm nay" value={mounted ? due.length : 0} accent />
        <Stat label="Đã nhớ tốt" value={mounted ? all.filter((w) => w.box >= 4).length : 0} />
      </div>

      {mounted && all.length === 0 ? (
        <Feedback ok={false} silent title="Sổ từ đang trống">
          Học xong bài học đầu tiên để 6 từ mới tự động vào sổ.{" "}
          <Link className="underline font-extrabold" href="/island/lesson/1">
            Học Chương 1
          </Link>
        </Feedback>
      ) : (
        <div className="cci-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <div className="font-baloo font-extrabold text-xl">{mounted && due.length > 0 ? `Có ${due.length} thẻ cần ôn hôm nay` : "Hôm nay không có thẻ đến hạn 🎉"}</div>
            <p className="text-sm font-semibold text-[#6B4A30]">
              {mounted && due.length > 0 ? "Khoảng 3–5 phút. Lật thẻ, tự chấm thật lòng: nhớ hay quên." : "Bạn vẫn có thể luyện thêm ngẫu nhiên vài thẻ cho chắc."}
            </p>
          </div>
          {mounted && due.length > 0 ? (
            <button type="button" className="cci-btn cci-btn-primary cci-btn-big" onClick={() => startSession(due)}>
              Ôn ngay <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button type="button" className="cci-btn cci-btn-big" onClick={() => startSession(all, 10)} disabled={!mounted || all.length === 0}>
              Luyện thêm 10 thẻ
            </button>
          )}
        </div>
      )}

      {mounted && all.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={cx("cci-btn !min-h-[38px] !text-sm !rounded-full", filter === "all" && "cci-btn-primary")} onClick={() => setFilter("all")}>
              Tất cả
            </button>
            {chaptersWithWords.map((c) => (
              <button key={c.id} type="button" className={cx("cci-btn !min-h-[38px] !text-sm !rounded-full", filter === c.id && "cci-btn-primary")} onClick={() => setFilter(c.id)}>
                Ch.{c.id} {c.title}
              </button>
            ))}
          </div>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {listed.map((w) => (
              <li key={w.en} className="cci-card !shadow-none !border-2 px-4 py-3 flex items-start gap-3">
                <button type="button" onClick={() => speak(w.en)} className="w-9 h-9 shrink-0 rounded-xl border-2 border-[#8B5E3C] bg-[#FBF0D9] flex items-center justify-center" aria-label={`Nghe ${w.en}`}>
                  <Volume2 className="w-4 h-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="font-baloo font-extrabold text-[17px] leading-tight">{w.en}</div>
                  <div className="text-sm font-semibold text-[#6B4A30]">{w.vi}</div>
                  <div className="flex items-center gap-1 mt-1.5" title={BOX_LABEL[w.box]}>
                    {[1, 2, 3, 4, 5, 6].map((b) => (
                      <span key={b} className="w-4 h-1.5 rounded-full" style={{ background: b <= w.box ? "#6FAE4F" : "#EAD9B8" }} />
                    ))}
                    <span className="text-[11px] font-bold text-[#6B4A30] ml-1">{w.due <= today() ? "đến hạn" : `ôn ${w.due.slice(8, 10)}/${w.due.slice(5, 7)}`}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="cci-card px-4 py-3" style={accent ? { background: "#FFF1C7" } : undefined}>
      <div className="font-baloo font-extrabold text-3xl leading-none">{value}</div>
      <div className="text-sm font-bold text-[#6B4A30] mt-1">{label}</div>
    </div>
  );
}

export default function WordsPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
