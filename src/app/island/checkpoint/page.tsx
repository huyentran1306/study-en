"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Mic, RotateCcw, Square, TrendingUp, Volume2 } from "lucide-react";
import { BackLink, cx } from "@/components/island/ui";
import { Avatar } from "@/components/island/character";
import { CHECK_MAX_SEC, CHECK_PREP_SEC, CHECK_SKILLS, CHECK_TASKS, checkDue, lastCheck, nextCheckDay, type CheckAI, type CheckRecord } from "@/lib/island/checkpoint";
import { saveCheck, today, useIsland } from "@/lib/island/progress";
import { speak } from "@/lib/island/speech";
import { canRecord, speechStats, startRecording, transcribe, type Transcript } from "@/lib/island/voice";
import { sfx } from "@/lib/island/sfx";
import { useGame } from "@/contexts/game-context";

type Phase = "intro" | "prep" | "rec" | "busy" | "review" | "grading" | "result" | "error";
type Rec = Awaited<ReturnType<typeof startRecording>>;

const fmtDay = (d: string) => {
  const [y, m, dd] = d.split("-");
  return `${Number(dd)}/${Number(m)}/${y}`;
};

export default function CheckpointPage() {
  const s = useIsland();
  const { addXP } = useGame();
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>("intro");
  const [i, setI] = useState(0);
  const [clock, setClock] = useState(0);
  const [lvl, setLvl] = useState(0);
  const [answers, setAnswers] = useState<(Transcript | null)[]>([null, null, null]);
  const [ai, setAi] = useState<CheckAI | null>(null);
  const [rec, setRec] = useState<CheckRecord | null>(null);
  const [prev, setPrev] = useState<CheckRecord | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const recRef = useRef<Rec | null>(null);
  useEffect(() => setMounted(true), []);

  const task = CHECK_TASKS[i];
  const due = mounted && checkDue(s, today());
  const last = mounted ? lastCheck(s) : null;
  const next = mounted ? nextCheckDay(s) : null;

  // Đồng hồ chuẩn bị / ghi âm
  useEffect(() => {
    if (phase !== "prep" && phase !== "rec") return;
    const t = setInterval(() => {
      setClock((c) => c + 1);
      if (phase === "rec" && recRef.current) setLvl(recRef.current.level());
    }, phase === "rec" ? 200 : 1000);
    return () => clearInterval(t);
  }, [phase]);
  useEffect(() => {
    if (phase === "prep" && clock >= CHECK_PREP_SEC) beginRec();
    if (phase === "rec" && clock >= CHECK_MAX_SEC * 5) stopRec();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clock, phase]);

  const startTask = (k: number) => {
    setI(k);
    setClock(0);
    setPhase("prep");
    setTimeout(() => speak(CHECK_TASKS[k].en, { who: "bo" }), 250);
  };

  const beginRec = async () => {
    try {
      recRef.current = await startRecording(CHECK_MAX_SEC * 1000 + 500);
      sfx.micOn();
      setClock(0);
      setPhase("rec");
    } catch {
      setErr("Không mở được micro. Hãy cho phép trang dùng micro rồi thử lại.");
      setPhase("error");
    }
  };

  const stopRec = async () => {
    const r = recRef.current;
    if (!r) return;
    recRef.current = null;
    sfx.micOff();
    setPhase("busy");
    const audio = await r.stop();
    const t = await transcribe(audio.blob);
    if (t.offline) {
      setErr("Không gửi được bản ghi âm (mạng hoặc máy chủ đang bận). Thử ghi lại nhé.");
      setPhase("error");
      return;
    }
    setAnswers((a) => a.map((x, k) => (k === i ? t : x)));
    setPhase("review");
  };

  const grade = async (all: (Transcript | null)[]) => {
    setPhase("grading");
    const ts = all.map((t) => t || { text: "", words: [], duration: 0 });
    try {
      const res = await fetch("/api/island-checkpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: CHECK_TASKS.map((t, k) => ({ id: t.id, text: ts[k].text, sec: Math.round(ts[k].duration) })) }),
      });
      const j = (await res.json()) as { result?: CheckAI | null; error?: string };
      if (!j.result) throw new Error(j.error || "offline");
      const stats = ts.map((t) => speechStats(t));
      const words = stats.reduce((n, x) => n + x.words, 0);
      const wpmPts = stats.filter((x) => x.words >= 5);
      const record: CheckRecord = {
        at: new Date().toISOString(),
        cefr: j.result.cefr,
        f: j.result.scores.f,
        a: j.result.scores.a,
        r: j.result.scores.r,
        c: j.result.scores.c,
        wpm: wpmPts.length ? Math.round(wpmPts.reduce((n, x) => n + x.wpm, 0) / wpmPts.length) : 0,
        words,
        fillers: stats.reduce((n, x) => n + x.fillers, 0),
      };
      setPrev(lastCheck(s));
      saveCheck(record);
      addXP(40);
      sfx.win();
      import("@/lib/confetti").then((c) => c.fireCelebration()).catch(() => {});
      setAi(j.result);
      setRec(record);
      setPhase("result");
    } catch (e) {
      setErr((e as Error).message === "Too short" ? "Các câu trả lời còn quá ngắn để chấm. Hãy nói dài hơn một chút nhé." : "AI đang bận, chưa chấm được. Bài nói của bạn vẫn còn đây, thử chấm lại sau ít phút.");
      setPhase("error");
    }
  };

  const nextTask = () => {
    if (i + 1 < CHECK_TASKS.length) startTask(i + 1);
    else grade(answers);
  };

  const cefrIdx = (c: string) => ["A1", "A2", "B1", "B2"].indexOf(c);

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <BackLink href="/island/progress" label="Tiến bộ" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold leading-tight">Kiểm tra nói 2 tuần</h1>
          <p className="text-sm font-semibold text-[#6B4A30]">3 đề cố định, mỗi đề nói tối đa {CHECK_MAX_SEC} giây. Cùng đề mỗi lần nên so được bạn đã giỏi lên bao nhiêu.</p>
        </div>
      </div>

      {phase === "intro" && (
        <div className="cci-card-wood p-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Avatar who="bo" size={56} />
            <p className="font-bold leading-snug">Tìm chỗ yên tĩnh, nói to và tự nhiên. Không cần hoàn hảo, cứ nói nhiều nhất có thể!</p>
          </div>
          <ol className="flex flex-col gap-1.5">
            {CHECK_TASKS.map((t, k) => (
              <li key={t.id} className="rounded-[14px] bg-white border-2 border-[#EAD9B8] px-3 py-2 text-sm font-semibold">
                <b>Đề {k + 1}.</b> {t.vi}
              </li>
            ))}
          </ol>
          {mounted && last && (
            <p className="text-sm font-bold text-[#2C5A25]">
              Lần trước ({fmtDay(new Date(last.at).toLocaleDateString("sv"))}): {last.cefr} · {last.wpm} từ/phút. {due ? "Đã tới hạn kiểm tra lại." : next ? `Lần kế tiếp: ${fmtDay(next)} (làm sớm cũng được).` : ""}
            </p>
          )}
          {mounted && !canRecord() ? (
            <p className="text-sm font-bold text-[#A4521D]">Trình duyệt này không ghi âm được. Hãy mở bằng Chrome, Safari hoặc Edge và cho phép micro.</p>
          ) : (
            <button type="button" className="cci-btn cci-btn-primary cci-btn-big self-start" onClick={() => startTask(0)}>
              <Mic className="w-5 h-5" /> Bắt đầu
            </button>
          )}
        </div>
      )}

      {(phase === "prep" || phase === "rec" || phase === "busy" || phase === "review") && task && (
        <div className="cci-card-wood p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#4E7FB8]">
              Đề {i + 1}/{CHECK_TASKS.length}
            </span>
            <span className="flex gap-1 ml-auto" aria-hidden>
              {CHECK_TASKS.map((_, k) => (
                <span key={k} className={cx("w-2.5 h-2.5 rounded-full", k < i ? "bg-[#3F7A34]" : k === i ? "bg-[#F2C14E]" : "bg-[#E6D6B6]")} />
              ))}
            </span>
          </div>
          <div className="rounded-[16px] bg-white border-2 border-[#CFE0F0] px-3 py-2.5">
            <p className="font-extrabold leading-snug">
              {task.en}{" "}
              <button type="button" data-sfx="none" onClick={() => speak(task.en, { who: "bo" })} aria-label="Nghe đề">
                <Volume2 className="inline w-4 h-4 text-[#3F7A34]" />
              </button>
            </p>
            <p className="text-sm font-semibold text-[#6B4A30] mt-0.5">{task.vi}</p>
          </div>

          {phase === "prep" && (
            <>
              <div className="flex flex-wrap gap-1.5">
                {task.tips.map((t) => (
                  <span key={t} className="cci-chip !text-xs">
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-baloo font-extrabold text-3xl tabular-nums w-14 text-center">{Math.max(0, CHECK_PREP_SEC - clock)}</span>
                <span className="flex-1 text-sm font-semibold text-[#6B4A30]">giây chuẩn bị, sau đó tự ghi âm.</span>
                <button type="button" className="cci-btn cci-btn-primary" onClick={beginRec}>
                  <Mic className="w-4 h-4" /> Nói ngay
                </button>
              </div>
            </>
          )}

          {phase === "rec" && (
            <div className="flex items-center gap-3">
              <span className="relative w-14 h-14 rounded-full bg-[#C8553D] flex items-center justify-center text-white shrink-0" style={{ boxShadow: `0 0 0 ${4 + Math.round(lvl * 14)}px rgba(200,85,61,.25)` }}>
                <Mic className="w-6 h-6" />
              </span>
              <div className="flex-1">
                <div className="font-baloo font-extrabold text-2xl tabular-nums">{Math.floor(clock / 5)}s / {CHECK_MAX_SEC}s</div>
                <div className="h-2 rounded-full bg-[#EAD9B8] overflow-hidden mt-1">
                  <div className="h-full bg-[#C8553D]" style={{ width: `${Math.min(100, (clock / 5 / CHECK_MAX_SEC) * 100)}%` }} />
                </div>
              </div>
              <button type="button" className="cci-btn cci-btn-primary shrink-0" onClick={stopRec}>
                <Square className="w-4 h-4" /> Xong
              </button>
            </div>
          )}

          {phase === "busy" && <p className="font-bold text-[#6B4A30]">Đang nghe lại bài nói của bạn…</p>}

          {phase === "review" && (
            <>
              <div className="rounded-[14px] bg-[#FFFBF2] border-2 border-dashed border-[#E6CF9A] px-3 py-2">
                <div className="text-xs font-extrabold text-[#6B4A30]">Máy nghe được:</div>
                <p className="font-semibold leading-snug">{answers[i]?.text || <i className="text-[#A4521D]">(chưa nghe thấy gì)</i>}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button type="button" className="cci-btn" onClick={() => startTask(i)}>
                  <RotateCcw className="w-4 h-4" /> Ghi lại
                </button>
                <button type="button" className="cci-btn cci-btn-primary" onClick={nextTask} disabled={!answers[i]?.text}>
                  {i + 1 < CHECK_TASKS.length ? "Đề tiếp theo" : "Nộp bài cho AI chấm"} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {phase === "grading" && (
        <div className="cci-card-wood p-5 flex items-center gap-3">
          <Avatar who="bo" size={48} />
          <p className="font-bold">AI đang chấm 3 bài nói của bạn…</p>
        </div>
      )}

      {phase === "error" && (
        <div className="cci-card-wood p-5 flex flex-col gap-3">
          <p className="font-bold text-[#A4521D]">{err}</p>
          <div className="flex gap-2">
            {answers.every(Boolean) && (
              <button type="button" className="cci-btn cci-btn-primary" onClick={() => grade(answers)}>
                Chấm lại
              </button>
            )}
            <button type="button" className="cci-btn" onClick={() => startTask(i)}>
              <RotateCcw className="w-4 h-4" /> Ghi lại đề {i + 1}
            </button>
          </div>
        </div>
      )}

      {phase === "result" && ai && rec && (
        <div className="cci-card-wood p-5 flex flex-col gap-3 anim-pop">
          <div className="flex items-center gap-3">
            <div className="w-20 h-20 rounded-[22px] bg-[#3F7A34] text-white flex flex-col items-center justify-center shrink-0">
              <span className="font-baloo font-extrabold text-3xl leading-none">{ai.cefr}</span>
              <span className="text-[10px] font-bold opacity-90">trình độ nói</span>
            </div>
            <div className="flex-1 min-w-0">
              {prev ? (
                <p className="font-extrabold leading-snug">
                  Lần trước {prev.cefr} → lần này {ai.cefr}
                  {cefrIdx(ai.cefr) > cefrIdx(prev.cefr) ? " · Lên trình! 🎉" : cefrIdx(ai.cefr) === cefrIdx(prev.cefr) ? " · Giữ vững" : ""}
                </p>
              ) : (
                <p className="font-extrabold leading-snug">Đây là mốc đầu tiên. 2 tuần nữa làm lại để so nhé!</p>
              )}
              <p className="text-sm font-semibold text-[#6B4A30] mt-0.5">
                {rec.words} từ · {rec.wpm} từ/phút · {rec.fillers} lần “ừm/à”
                {prev ? ` (lần trước ${prev.wpm} từ/phút)` : ""}
              </p>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-2">
            {CHECK_SKILLS.map((k) => {
              const v = rec[k.k];
              const d = prev ? v - prev[k.k] : 0;
              return (
                <li key={k.k} className="rounded-[14px] bg-white border-2 border-[#EAD9B8] px-3 py-2">
                  <div className="text-xs font-bold text-[#6B4A30]">{k.name}</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-baloo font-extrabold text-xl">{v}/5</span>
                    {prev && d !== 0 && <span className="text-xs font-extrabold" style={{ color: d > 0 ? "#2C5A25" : "#A4521D" }}>{d > 0 ? `▲ +${d}` : `▼ ${d}`}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="text-sm font-bold text-[#2C5A25] flex items-start gap-1.5">
            <Check className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={3} /> {ai.praise}
          </p>
          <div className="rounded-[14px] bg-[#FFF1C7] border-2 border-[#E6C46A] px-3 py-2">
            <div className="font-extrabold text-sm">Tập trung tiếp theo: {ai.focus.title}</div>
            <p className="text-sm font-semibold leading-snug">{ai.focus.tip}</p>
            <button type="button" data-sfx="none" onClick={() => speak(ai.focus.example, { who: "bo" })} className="text-sm font-extrabold text-[#2C5A25] mt-0.5 text-left">
              <Volume2 className="inline w-4 h-4" /> {ai.focus.example}
            </button>
          </div>
          {ai.upgrade && (
            <div className="rounded-[14px] bg-white border-2 border-[#9CC77F] px-3 py-2 text-sm">
              <div className="font-extrabold">Nói hay hơn:</div>
              <p className="font-semibold text-[#A4521D] line-through decoration-[#C96A2B]/60">{ai.upgrade.from}</p>
              <button type="button" data-sfx="none" onClick={() => speak(ai.upgrade!.to, { who: "bo" })} className="font-extrabold text-left">
                {ai.upgrade.to} <Volume2 className="inline w-4 h-4 text-[#3F7A34]" />
              </button>
            </div>
          )}
          <details className="text-sm">
            <summary className="font-extrabold cursor-pointer">Nhận xét từng đề</summary>
            <ul className="mt-1 flex flex-col gap-1">
              {CHECK_TASKS.map((t, k) => (
                <li key={t.id}>
                  <b>Đề {k + 1}:</b> {ai.notes[t.id]} <span className="text-[#6B4A30]">· “{answers[k]?.text?.slice(0, 120)}{(answers[k]?.text?.length || 0) > 120 ? "…" : ""}”</span>
                </li>
              ))}
            </ul>
          </details>
          <Link href="/island/progress" className="cci-btn cci-btn-primary self-start">
            <TrendingUp className="w-4 h-4" /> Xem tiến bộ của tôi
          </Link>
        </div>
      )}
    </div>
  );
}
