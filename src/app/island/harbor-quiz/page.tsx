"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Eye, Gift, Lock, Map as MapIcon, RotateCcw, Shell, Volume2, X } from "lucide-react";
import { BackLink, cx } from "@/components/island/ui";
import { OttoAvatar } from "@/components/island/otto";
import { harborOpen, OTTO } from "@/lib/island/harbor";
import { CHEST_BONUS, PIECES_PER_CHEST, QUIZ_LEN, QUIZ_TITLE, dailyQuiz, quizPieces, sameSentence, type Question } from "@/lib/island/harbor-quiz";
import { finishQuiz, isUnlocked, openTreasure, today, useIsland } from "@/lib/island/progress";
import { speak } from "@/lib/island/speech";
import { sfx } from "@/lib/island/sfx";
import { useGame } from "@/contexts/game-context";

type Verdict = { ok: boolean; note: string; model: string } | null;

export default function HarborQuizPage() {
  const s = useIsland();
  const { addXP } = useGame();
  const [mounted, setMounted] = useState(false);
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [built, setBuilt] = useState<number[]>([]);
  const [showText, setShowText] = useState(false);
  const [done, setDone] = useState<{ gotPiece: boolean; shells: number; score: number } | null>(null);
  const [started, setStarted] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => setMounted(true), []);

  const day = mounted ? today() : "";
  const qs = useMemo(() => (mounted ? dailyQuiz(s, day, isUnlocked) : []), [mounted, day]); // eslint-disable-line react-hooks/exhaustive-deps
  const q: Question | undefined = qs[i];
  const open = mounted && harborOpen(s);
  const pieces = mounted ? quizPieces(s).have : 0;
  const todayBest = mounted ? s.quiz.days[day] : undefined;

  const say = (text: string, speed: "slow" | "normal" | "fast" = "normal") => speak(text, { who: OTTO.voice, speed });

  // Câu mới: Rái tự đọc (câu nghe)
  useEffect(() => {
    if (!started || !q || verdict) return;
    setShowText(false);
    if (q.kind === "reply") setTimeout(() => say(q.say), 300);
    if (q.kind === "catch") setTimeout(() => say(q.fast, "fast"), 300);
    if (q.kind === "riddle") setTimeout(() => say(q.q), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, started]);

  const judge = (ok: boolean, note: string, model: string) => {
    setVerdict({ ok, note, model });
    if (ok) {
      setRight((r) => r + 1);
      sfx.correct();
    } else sfx.wrong();
    setTimeout(() => say(model, "normal"), 350);
  };

  const choose = (idx: number) => {
    if (!q || verdict) return;
    setPicked(idx);
    if (q.kind === "reply" || q.kind === "catch") {
      const o = q.options[idx];
      const good = q.options.find((x) => x.ok)!;
      judge(o.ok, o.why, good.en);
      if (q.kind === "catch") setTimeout(() => say(q.slow, "slow"), 2200);
    } else if (q.kind === "word") {
      const ok = q.options[idx] === q.answer;
      judge(ok, ok ? `Đúng rồi: “${q.answer}” = ${q.clue}.` : `Từ đúng là “${q.answer}” (${q.clue}).`, q.sentence.replace("____", q.answer));
    } else if (q.kind === "riddle") {
      const ok = q.options[idx].en === q.answer;
      judge(ok, ok ? `Chính xác: ${q.answer} (${q.answerVi})!` : `Đáp án là ${q.answer} (${q.answerVi}).`, `It's ${q.answer}!`);
    }
  };

  const checkOrder = () => {
    if (!q || q.kind !== "order" || verdict) return;
    const said = built.map((k) => q.tiles[k]).join(" ");
    const ok = sameSentence(said, q.answer);
    judge(ok, ok ? "Câu xếp chuẩn rồi!" : `Câu đúng: “${q.answer}”`, q.answer);
  };

  const next = () => {
    setVerdict(null);
    setPicked(null);
    setBuilt([]);
    if (i + 1 >= qs.length) {
      const score = right;
      const r = finishQuiz(score);
      if (score > 0) addXP(score * 4);
      if (r.gotPiece) sfx.unlock();
      else sfx.win();
      setDone({ ...r, score });
      return;
    }
    setI(i + 1);
  };

  const restart = () => {
    setI(0);
    setRight(0);
    setDone(null);
    setStarted(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <BackLink href="/island?view=harbor" label="Đảo Phố Cảng" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold leading-tight">Câu đố của Thuyền trưởng Rái</h1>
          <p className="text-sm font-semibold text-[#6B4A30]">Mỗi ngày 5 câu từ các bài A2. Đúng từ 4 câu được 1 mảnh bản đồ kho báu.</p>
        </div>
      </div>

      {mounted && !open ? (
        <div className="cci-card-wood p-5 flex flex-col items-center gap-3 text-center">
          <Lock className="w-8 h-8 text-[#8B6B48]" />
          <p className="font-bold">Đảo Phố Cảng còn mây phủ. Qua thử thách cuối cấp A1 «Ngày đầu trên đảo» là phà bắt đầu chạy.</p>
          <Link href="/island/path" className="cci-btn cci-btn-primary">
            Về Lộ trình <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <>
          {/* Bản đồ kho báu */}
          <div className="clay rounded-[20px] bg-white p-3 flex items-center gap-3">
            <MapIcon className="w-6 h-6 text-[#C96A2B] shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-baloo font-extrabold leading-tight">
                Mảnh bản đồ {Math.min(pieces, PIECES_PER_CHEST)}/{PIECES_PER_CHEST}
                {mounted && s.quiz.chests > 0 && <span className="text-xs font-bold text-[#6B4A30]"> · đã mở {s.quiz.chests} rương</span>}
              </div>
              <div className="flex gap-1 mt-1" aria-hidden>
                {Array.from({ length: PIECES_PER_CHEST }, (_, k) => (
                  <span key={k} className={cx("h-2.5 flex-1 rounded-full", k < pieces ? "bg-[#F2C14E]" : "bg-[#EAD9B8]")} />
                ))}
              </div>
            </div>
            {pieces >= PIECES_PER_CHEST && (
              <button
                type="button"
                className="cci-btn cci-btn-primary !min-h-[40px] shrink-0"
                onClick={() => {
                  const r = openTreasure();
                  if (r.ok) {
                    sfx.win();
                    setMsg(`Mở rương kho báu! +${CHEST_BONUS} vỏ sò. Rương mới đã nằm ở bến phà.`);
                    import("@/lib/confetti").then((c) => c.fireCelebration()).catch(() => {});
                  }
                }}
              >
                <Gift className="w-4 h-4" /> Mở rương
              </button>
            )}
          </div>
          {msg && <p className="text-sm font-bold text-[#2C5A25] text-center">{msg}</p>}

          {!started && !done && (
            <div className="cci-card-wood p-5 flex flex-col items-center gap-3 text-center">
              <OttoAvatar size={72} />
              <p className="font-bold leading-snug">“Ahoy! Five quick puzzles for today. Ready?”</p>
              <p className="text-sm font-semibold text-[#6B4A30]">Nghe rồi đáp · Đoán từ · Xếp câu · Bắt thông tin · Câu đố vui</p>
              {todayBest !== undefined && <p className="text-sm font-bold text-[#2C5A25]">Hôm nay bạn đã đúng {todayBest}/{QUIZ_LEN}. Làm lại để luyện thêm, giữ kết quả tốt nhất.</p>}
              <button type="button" className="cci-btn cci-btn-primary cci-btn-big" onClick={restart}>
                {todayBest !== undefined ? "Làm lại" : "Bắt đầu"} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {started && !done && q && (
            <div className="cci-card-wood p-4 sm:p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#4E7FB8]">
                  Câu {i + 1}/{qs.length} · {QUIZ_TITLE[q.kind]}
                </span>
                <span className="flex gap-1 ml-auto" aria-hidden>
                  {qs.map((_, k) => (
                    <span key={k} className={cx("w-2.5 h-2.5 rounded-full", k < i ? "bg-[#3F7A34]" : k === i ? "bg-[#F2C14E]" : "bg-[#E6D6B6]")} />
                  ))}
                </span>
              </div>

              <div className="flex items-start gap-3">
                <OttoAvatar size={48} />
                <div className="flex-1 min-w-0 rounded-[16px] bg-white border-2 border-[#CFE0F0] px-3 py-2">
                  {q.kind === "reply" && (
                    <>
                      <p className="text-sm font-bold text-[#6B4A30]">Rái nói gì đó với bạn. Nghe rồi chọn câu đáp hợp nhất.</p>
                      <Listen onPlay={() => say(q.say)} onSlow={() => say(q.say, "slow")} />
                      <TextReveal show={showText} onShow={() => setShowText(true)} en={q.say} vi={q.sayVi} />
                    </>
                  )}
                  {q.kind === "catch" && (
                    <>
                      <p className="text-sm font-bold text-[#6B4A30]">Rái nói rất nhanh, không có chữ. Bạn sẽ làm gì?</p>
                      <Listen onPlay={() => say(q.fast, "fast")} />
                      {verdict && <TextReveal show en={q.fast} vi={q.fastVi} onShow={() => {}} />}
                    </>
                  )}
                  {q.kind === "word" && (
                    <>
                      <p className="text-sm font-bold text-[#6B4A30]">Điền từ nghĩa là “{q.clue}”:</p>
                      <p className="font-extrabold text-lg leading-snug">{verdict ? q.sentence.replace("____", q.answer) : q.sentence}</p>
                    </>
                  )}
                  {q.kind === "order" && (
                    <>
                      <p className="text-sm font-bold text-[#6B4A30]">Xếp lại thành câu tiếng Anh:</p>
                      <p className="font-extrabold leading-snug">“{q.vi}”</p>
                    </>
                  )}
                  {q.kind === "riddle" && (
                    <>
                      <p className="font-extrabold text-lg leading-snug">
                        {q.q}{" "}
                        <button type="button" data-sfx="none" onClick={() => say(q.q)} aria-label="Nghe lại">
                          <Volume2 className="inline w-4 h-4 text-[#3F7A34]" />
                        </button>
                      </p>
                      <TextReveal show={showText} onShow={() => setShowText(true)} vi={q.qVi} label="Xem nghĩa" />
                    </>
                  )}
                </div>
              </div>

              {/* Lựa chọn */}
              {(q.kind === "reply" || q.kind === "catch" || q.kind === "riddle" || q.kind === "word") && (
                <ul className="flex flex-col gap-2">
                  {(q.kind === "word" ? q.options.map((o) => ({ en: o, vi: "", ok: o === q.answer })) : q.kind === "riddle" ? q.options.map((o) => ({ ...o, ok: o.en === q.answer })) : q.options).map((o, k) => {
                    const isRight = o.ok;
                    return (
                      <li key={k}>
                        <button
                          type="button"
                          data-sfx="none"
                          disabled={!!verdict}
                          onClick={() => choose(k)}
                          className={cx(
                            "w-full text-left rounded-[16px] border-[3px] px-3.5 py-2.5 font-bold leading-snug transition-colors",
                            !verdict && "bg-white border-[#E6CF9A] hover:border-[#8B5E3C]",
                            verdict && isRight && "bg-[#E9F6E1] border-[#6FAE4F]",
                            verdict && !isRight && picked === k && "bg-[#FDEEDD] border-[#E0A26E]",
                            verdict && !isRight && picked !== k && "bg-white border-[#EFE3CC] opacity-60",
                          )}
                        >
                          {o.en}
                          {o.vi && (verdict || q.kind === "riddle") && <span className="block text-xs font-semibold text-[#6B4A30]">{o.vi}</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {q.kind === "order" && (
                <div className="flex flex-col gap-2">
                  <div className="min-h-[52px] rounded-[16px] border-[3px] border-dashed border-[#D8BF92] bg-white px-2 py-2 flex flex-wrap gap-1.5">
                    {built.map((k, n) => (
                      <button key={`${k}-${n}`} type="button" data-sfx="tap" disabled={!!verdict} onClick={() => setBuilt((b) => b.filter((_, m) => m !== n))} className="rounded-[10px] bg-[#FFF1C7] border-2 border-[#C99A1E] px-2.5 py-1 font-bold">
                        {q.tiles[k]}
                      </button>
                    ))}
                    {!built.length && <span className="text-sm font-semibold text-[#B39B7A] self-center px-1">Chạm các ô bên dưới theo thứ tự…</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {q.tiles.map((t, k) =>
                      built.includes(k) ? (
                        <span key={k} className="rounded-[10px] border-2 border-dashed border-[#E6D6B6] px-2.5 py-1 font-bold text-transparent select-none">
                          {t}
                        </span>
                      ) : (
                        <button key={k} type="button" data-sfx="tap" disabled={!!verdict} onClick={() => setBuilt((b) => [...b, k])} className="rounded-[10px] bg-white border-2 border-[#8B5E3C] px-2.5 py-1 font-bold hover:bg-[#FBF0D9]">
                          {t}
                        </button>
                      ),
                    )}
                  </div>
                  {!verdict && (
                    <div className="flex gap-2">
                      <button type="button" className="cci-btn !min-h-[40px]" onClick={() => setBuilt([])} disabled={!built.length}>
                        <RotateCcw className="w-4 h-4" /> Xếp lại
                      </button>
                      <button type="button" className="cci-btn cci-btn-primary !min-h-[40px]" onClick={checkOrder} disabled={built.length !== q.tiles.length}>
                        <Check className="w-4 h-4" /> Kiểm tra
                      </button>
                    </div>
                  )}
                </div>
              )}

              {verdict && (
                <div className={cx("rounded-[16px] px-3 py-2.5 flex items-start gap-2", verdict.ok ? "bg-[#E9F6E1]" : "bg-[#FDEEDD]")} role="status">
                  {verdict.ok ? <Check className="w-5 h-5 text-[#3F7A34] shrink-0 mt-0.5" strokeWidth={3} /> : <X className="w-5 h-5 text-[#C96A2B] shrink-0 mt-0.5" strokeWidth={3} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold leading-snug">{verdict.note}</p>
                    <button type="button" data-sfx="none" onClick={() => say(verdict.model)} className="text-sm font-extrabold text-[#2C5A25] mt-1 inline-flex items-center gap-1 text-left">
                      <Volume2 className="w-4 h-4 shrink-0" /> {verdict.model}
                    </button>
                  </div>
                  <button type="button" className="cci-btn cci-btn-primary !min-h-[40px] shrink-0" onClick={next}>
                    {i + 1 >= qs.length ? "Xem kết quả" : "Tiếp"} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {done && (
            <div className="cci-card-wood p-5 flex flex-col items-center gap-2 text-center anim-pop">
              <OttoAvatar size={72} />
              <div className="font-baloo font-extrabold text-3xl">
                {done.score}/{QUIZ_LEN}
              </div>
              <p className="font-bold">{done.score >= 4 ? "“Great job, sailor!”" : done.score >= 2 ? "“Not bad! Try again tomorrow.”" : "“Don't give up. The sea is big!”"}</p>
              {done.shells > 0 && (
                <p className="font-baloo font-extrabold text-lg text-[#2C5A25] inline-flex items-center gap-1">
                  +{done.shells} <Shell className="w-5 h-5 text-[#C99A1E]" />
                </p>
              )}
              {done.gotPiece && (
                <p className="inline-flex items-center gap-1 rounded-full bg-[#F2C14E] border-2 border-[#4A3222] px-3 py-1 font-extrabold">
                  <MapIcon className="w-4 h-4" /> Nhận 1 mảnh bản đồ kho báu!
                </p>
              )}
              {!done.gotPiece && done.score < 4 && <p className="text-sm font-semibold text-[#6B4A30]">Đúng từ 4 câu để nhận mảnh bản đồ. Làm lại được, giữ kết quả tốt nhất.</p>}
              <div className="flex gap-2 mt-1">
                <button type="button" className="cci-btn" onClick={restart}>
                  <RotateCcw className="w-4 h-4" /> Làm lại
                </button>
                <Link href="/island?view=harbor" className="cci-btn cci-btn-primary">
                  Về bến cảng
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Listen({ onPlay, onSlow }: { onPlay: () => void; onSlow?: () => void }) {
  return (
    <div className="flex gap-2 mt-1.5">
      <button type="button" data-sfx="none" onClick={onPlay} className="cci-btn !min-h-[38px] !px-3 !text-sm">
        <Volume2 className="w-4 h-4" /> Nghe
      </button>
      {onSlow && (
        <button type="button" data-sfx="none" onClick={onSlow} className="cci-btn !min-h-[38px] !px-3 !text-sm">
          Nghe chậm
        </button>
      )}
    </div>
  );
}

function TextReveal({ show, onShow, en, vi, label = "Hiện chữ" }: { show: boolean; onShow: () => void; en?: string; vi: string; label?: string }) {
  if (!show)
    return (
      <button type="button" data-sfx="none" onClick={onShow} className="mt-1.5 text-xs font-extrabold text-[#6B4A30] underline underline-offset-4 inline-flex items-center gap-1">
        <Eye className="w-3.5 h-3.5" /> {label}
      </button>
    );
  return (
    <div className="mt-1.5">
      {en && <p className="font-bold leading-snug">{en}</p>}
      <p className="text-xs font-semibold text-[#6B4A30]">{vi}</p>
    </div>
  );
}
