"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, Eye, MessageSquareQuote, RotateCcw, Volume2, X } from "lucide-react";
import { Character } from "@/components/island/character";
import { BackLink, Feedback, MicButton, WordMarks, cx, shuffle } from "@/components/island/ui";
import { CHAPTERS } from "@/lib/island/curriculum";
import { backfillPhrases, completeMission, currentChapterId, duePhrases, gradePhrase, today, useIsland, type PhraseCard } from "@/lib/island/progress";
import { scoreSpeech, speak, stopSpeaking, useListen } from "@/lib/island/speech";
import { sfx } from "@/lib/island/sfx";
import { useGame } from "@/contexts/game-context";
import { NextStep } from "@/components/island/journey";

const BOX_LABEL = ["Mới", "Mới học", "Đang nhớ", "Khá nhớ", "Nhớ tốt", "Rất nhớ", "Thuộc lòng"];

function Inner() {
  const s = useIsland();
  const { addXP } = useGame();
  const sp = useSearchParams();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    backfillPhrases();
  }, []);

  const all = Object.values(s.phrases);
  const due = duePhrases(s);
  const chParam = Number(sp.get("ch"));
  const missionCh = chParam && s.chapters[chParam]?.lesson ? chParam : currentChapterId(s);

  const [session, setSession] = useState<PhraseCard[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [attempt, setAttempt] = useState<{ said: string; score: number; marks: { word: string; ok: boolean }[] } | null>(null);
  const [stats, setStats] = useState({ ok: 0, again: 0 });
  const [finished, setFinished] = useState(false);
  const [filter, setFilter] = useState<number | "all">("all");
  const { supported, listening, interim, error, listen, stop } = useListen();

  const start = (cards: PhraseCard[], limit = 12) => {
    setSession(shuffle(cards).slice(0, limit));
    setIdx(0);
    setRevealed(false);
    setAttempt(null);
    setStats({ ok: 0, again: 0 });
    setFinished(false);
  };

  const card = session?.[idx];

  const grade = (ok: boolean) => {
    if (!session || !card) return;
    gradePhrase(card.en, ok);
    setStats((st) => ({ ok: st.ok + (ok ? 1 : 0), again: st.again + (ok ? 0 : 1) }));
    stopSpeaking();
    if (idx + 1 >= session.length) {
      setFinished(true);
      sfx.win();
      if (s.chapters[missionCh]?.lesson && !s.chapters[missionCh]?.review) {
        completeMission(missionCh, "review", 15);
        addXP(15);
      }
    } else {
      sfx.flip();
      setIdx(idx + 1);
      setRevealed(false);
      setAttempt(null);
    }
  };

  const onMic = async () => {
    if (!card) return;
    if (listening) return stop();
    sfx.micOn();
    const said = await listen();
    if (!said.trim()) return;
    const r = scoreSpeech(said, card.en);
    setAttempt({ said, ...r });
    setRevealed(true);
    speak(card.en, { who: "you" });
  };

  useEffect(() => () => stopSpeaking(), []);

  const listed = useMemo(() => all.filter((p) => filter === "all" || p.ch === filter).sort((a, b) => a.ch - b.ch || a.box - b.box), [all, filter]);
  const chapters = CHAPTERS.filter((c) => all.some((p) => p.ch === c.id));

  // ───── Xong phiên ─────
  if (session && finished) {
    return (
      <div className="max-w-xl mx-auto px-3 py-8 flex flex-col items-center gap-4 text-center">
        <div className="w-36 rounded-[24px] bg-[#EAF3DC] pt-4 flex justify-center">
          <Character who="pip" mood="happy" size="80%" />
        </div>
        <h1 className="text-3xl font-extrabold">Ôn xong {session.length} câu khung!</h1>
        <p className="font-semibold text-[#6B4A30]">
          Nói được: {stats.ok} · Cần ôn lại: {stats.again}. Câu nói được sẽ giãn lịch ôn, câu chưa được sẽ quay lại sớm.
        </p>
        <NextStep />
        <div className="flex gap-2 flex-wrap justify-center">
          <button type="button" className="cci-btn cci-btn-big" onClick={() => setSession(null)}>
            Về Sổ câu
          </button>
          <Link href={`/island/reflex?ch=${missionCh}`} className="cci-btn cci-btn-big">
            Thử Ao Phản Xạ
          </Link>
        </div>
      </div>
    );
  }

  // ───── Đang ôn ─────
  if (session && card) {
    const passed = attempt && attempt.score >= 0.8;
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

        <div className="cci-card-wood !rounded-[28px] min-h-[220px] p-6 flex flex-col items-center justify-center gap-3 text-center">
          <span className="cci-chip !text-xs">
            Chương {card.ch} · {BOX_LABEL[card.box]}
          </span>
          <span className="text-sm font-bold text-[#6B4A30]">Nói câu này bằng tiếng Anh:</span>
          <span className="font-baloo font-extrabold text-2xl sm:text-3xl leading-tight">“{card.vi}”</span>
          {revealed && (
            <div className="anim-flip flex flex-col items-center gap-1">
              {attempt ? <WordMarks marks={attempt.marks} /> : <span className="font-baloo font-extrabold text-xl text-[#3F7A34]">{card.en}</span>}
              <button type="button" data-sfx="none" className="text-xs font-extrabold text-[#3F7A34] inline-flex items-center gap-1 mt-1" onClick={() => speak(card.en, { who: "you" })}>
                <Volume2 className="w-3.5 h-3.5" /> Nghe câu chuẩn
              </button>
            </div>
          )}
        </div>

        {attempt && (
          <Feedback ok={!!passed} title={passed ? "Nói chuẩn rồi!" : "Gần đúng rồi"}>
            Bạn nói: “{attempt.said}” · khớp {Math.round(attempt.score * 100)}%{!passed && ". Nghe câu chuẩn rồi nói lại, hoặc tự chấm bên dưới."}
          </Feedback>
        )}

        {!revealed && (
          <div className="flex flex-col items-center gap-3">
            {supported && <MicButton listening={listening} onClick={onMic} label="bấm rồi nói cả câu" />}
            {listening && interim && <p className="font-semibold text-[#6B4A30]">“{interim}”</p>}
            <button
              type="button"
              className="cci-btn"
              data-sfx="flip"
              onClick={() => {
                setRevealed(true);
                speak(card.en, { who: "you" });
              }}
            >
              <Eye className="w-4 h-4" /> {supported ? "Bí quá, xem đáp án" : "Nghĩ xong, xem đáp án"}
            </button>
          </div>
        )}

        {revealed && (
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="cci-btn cci-btn-big !border-[#C96A2B] !shadow-[0_4px_0_#C96A2B] !bg-[#FDEEDD]" data-sfx="none" onClick={() => grade(false)}>
              <RotateCcw className="w-5 h-5" /> Chưa nói được
            </button>
            <button type="button" className="cci-btn cci-btn-primary cci-btn-big" data-sfx="coin" onClick={() => grade(true)}>
              <Check className="w-5 h-5" /> {passed ? "Tiếp" : "Nói được"}
            </button>
          </div>
        )}
        {revealed && attempt && !passed && supported && (
          <button type="button" className="cci-btn self-center" onClick={onMic}>
            Thử nói lại
          </button>
        )}
        {error && <p className="text-xs font-bold text-[#A4521D] text-center">{error}</p>}
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
            <MessageSquareQuote className="w-7 h-7" /> Sổ câu khung
          </h1>
          <p className="font-semibold text-[#6B4A30] text-sm sm:text-base">Nhìn tiếng Việt → nói ngay cả câu tiếng Anh. Câu khung là “phao cứu sinh” khi nói chuyện thật.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Stat label="Câu trong sổ" value={mounted ? all.length : 0} />
        <Stat label="Đến hạn hôm nay" value={mounted ? due.length : 0} accent />
        <Stat label="Nói thuộc lòng" value={mounted ? all.filter((p) => p.box >= 4).length : 0} />
      </div>

      {mounted && all.length === 0 ? (
        <Feedback ok={false} silent title="Sổ câu đang trống">
          Học xong bài học đầu tiên để các câu hay nhất của bài tự vào sổ.{" "}
          <Link className="underline font-extrabold" href="/island/lesson/1">
            Học Chương 1
          </Link>
        </Feedback>
      ) : (
        <div className="cci-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <div className="font-baloo font-extrabold text-xl">{mounted && due.length > 0 ? `Có ${due.length} câu cần ôn hôm nay` : "Hôm nay không có câu đến hạn 🎉"}</div>
            <p className="text-sm font-semibold text-[#6B4A30]">Khoảng 3–5 phút. Bấm micro và nói cả câu — Pip chấm từng từ cho bạn.</p>
          </div>
          {mounted && due.length > 0 ? (
            <button type="button" className="cci-btn cci-btn-primary cci-btn-big" data-sfx="open" onClick={() => start(due)}>
              Ôn ngay <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button type="button" className="cci-btn cci-btn-big" data-sfx="open" onClick={() => start(all, 8)} disabled={!mounted || all.length === 0}>
              Luyện thêm 8 câu
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
            {chapters.map((c) => (
              <button key={c.id} type="button" className={cx("cci-btn !min-h-[38px] !text-sm !rounded-full", filter === c.id && "cci-btn-primary")} onClick={() => setFilter(c.id)}>
                Ch.{c.id} {c.title}
              </button>
            ))}
          </div>
          <ul className="grid sm:grid-cols-2 gap-3">
            {listed.map((p) => (
              <li key={p.en} className="cci-card !shadow-none !border-2 px-4 py-3 flex items-start gap-3">
                <button type="button" data-sfx="none" onClick={() => speak(p.en, { who: "you" })} className="w-9 h-9 shrink-0 rounded-xl border-2 border-[#8B5E3C] bg-[#FBF0D9] flex items-center justify-center" aria-label={`Nghe ${p.en}`}>
                  <Volume2 className="w-4 h-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="font-baloo font-extrabold text-[17px] leading-tight">{p.en}</div>
                  <div className="text-sm font-semibold text-[#6B4A30]">{p.vi}</div>
                  <div className="flex items-center gap-1 mt-1.5" title={BOX_LABEL[p.box]}>
                    {[1, 2, 3, 4, 5, 6].map((b) => (
                      <span key={b} className="w-4 h-1.5 rounded-full" style={{ background: b <= p.box ? "#6FAE4F" : "#EAD9B8" }} />
                    ))}
                    <span className="text-[11px] font-bold text-[#6B4A30] ml-1">{p.due <= today() ? "đến hạn" : `ôn ${p.due.slice(8, 10)}/${p.due.slice(5, 7)}`}</span>
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

export default function PhrasesPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
