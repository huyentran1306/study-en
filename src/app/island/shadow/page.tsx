"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Mic, Square, Volume2 } from "lucide-react";
import { BackLink, WordMarks, cx, shuffle } from "@/components/island/ui";
import { CHAPTERS } from "@/lib/island/curriculum";
import { isUnlocked, markBuilt, phrasesOf, useIsland } from "@/lib/island/progress";
import { personalize } from "@/lib/island/me";
import { prosody } from "@/lib/island/prosody";
import { NPC_VOICE, canRecord, playVoice, speechStats, startRecording, stopVoice, transcribe } from "@/lib/island/voice";
import { scoreSpeech, useListen } from "@/lib/island/speech";
import { sfx } from "@/lib/island/sfx";
import { useGame } from "@/contexts/game-context";

type Result = { acc: number; wpm: number; marks: { word: string; ok: boolean }[]; said: string };

/** Nói đuổi cả câu: nghe mẫu → nói theo ngay → chấm từ đúng + tốc độ. Hiện trọng âm (chữ đậm) và nối âm (‿). */
export default function ShadowPage() {
  const s = useIsland();
  const { addXP } = useGame();
  const [mounted, setMounted] = useState(false);
  const [list, setList] = useState<{ en: string; vi: string }[]>([]);
  const [i, setI] = useState(0);
  const [rate, setRate] = useState(1);
  const [rec, setRec] = useState<Awaited<ReturnType<typeof startRecording>> | null>(null);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const [best, setBest] = useState<number[]>([]);
  const { supported: webSpeech, listening, listen, stop } = useListen();
  useEffect(() => setMounted(true), []);
  useEffect(() => () => stopVoice(), []);

  const pool = useMemo(() => {
    if (!mounted) return [];
    return CHAPTERS.filter((c) => isUnlocked(s, c.id))
      .flatMap((c) => phrasesOf(c))
      .map((p) => ({ en: personalize(p.en, s.profile), vi: personalize(p.vi, s.profile) }))
      .filter((p) => p.en.split(" ").length >= 4 && p.en.split(" ").length <= 14);
  }, [mounted, s]);
  useEffect(() => {
    if (pool.length && !list.length) setList(shuffle(pool).slice(0, 8));
  }, [pool, list.length]);

  const cur = list[i];
  const marks = cur ? prosody(cur.en) : [];
  const model = () => cur && playVoice(cur.en, NPC_VOICE.you, { rate, fallbackWho: "you" });

  const grade = (said: string, wpm: number) => {
    if (!cur) return;
    const r = scoreSpeech(said, cur.en);
    setRes({ acc: r.score, wpm, marks: r.marks, said });
    markBuilt("shadow");
    const total = Math.round(r.score * 100);
    setBest((b) => {
      const n = [...b];
      n[i] = Math.max(n[i] || 0, total);
      return n;
    });
    if (r.score >= 0.8) {
      sfx.correct();
      addXP(3);
    } else sfx.wrong();
  };

  const onMic = async () => {
    if (busy) return;
    if (canRecord()) {
      if (rec) {
        setBusy(true);
        const audio = await rec.stop();
        setRec(null);
        const t = await transcribe(audio.blob);
        setBusy(false);
        if (t.text) grade(t.text, speechStats(t).wpm);
        else setRes({ acc: 0, wpm: 0, marks: [], said: t.offline ? "(mạng chập chờn, thử lại)" : "(chưa nghe rõ)" });
        return;
      }
      stopVoice();
      setRes(null);
      try {
        setRec(await startRecording(15_000));
      } catch {
        setRes({ acc: 0, wpm: 0, marks: [], said: "(không mở được micro)" });
      }
      return;
    }
    if (webSpeech) {
      if (listening) return stop();
      setRes(null);
      const t = await listen();
      if (t.trim()) grade(t, 0);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <BackLink href="/island?view=isle" label="Đảo Luyện" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">Nói đuổi</h1>
          <p className="text-sm font-semibold text-[#6B4A30]">Nghe câu mẫu rồi nói theo ngay, bắt chước cả nhịp: từ in đậm nhấn mạnh, từ nhỏ đọc lướt, dấu ‿ là nối âm.</p>
        </div>
      </div>

      {cur ? (
        <section className="cci-card-wood p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between text-sm font-extrabold text-[#6B4A30]">
            <span>
              Câu {i + 1}/{list.length}
            </span>
            <div role="radiogroup" aria-label="Tốc độ mẫu" className="inline-flex rounded-full bg-white border-2 border-[#E6CF9A] p-0.5">
              {[
                [0.8, "Chậm"],
                [1, "Thường"],
              ].map(([v, l]) => (
                <button key={v} type="button" role="radio" aria-checked={rate === v} onClick={() => setRate(v as number)} className={cx("px-3 py-0.5 rounded-full text-xs font-extrabold", rate === v ? "bg-[#3F7A34] text-white" : "")}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[22px] sm:text-[26px] leading-snug font-baloo" aria-label={cur.en}>
            {marks.map((w, k) => (
              <span key={k}>
                <span className={w.stress ? "font-extrabold text-[#2C5A25]" : "font-semibold text-[#8B6B45]"}>{w.text}</span>
                {w.link ? <span className="text-[#C96A2B] font-extrabold">‿</span> : " "}
              </span>
            ))}
          </p>
          <p className="text-sm font-semibold text-[#6B4A30] -mt-2">{cur.vi}</p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={model} className="cci-btn">
              <Volume2 className="w-5 h-5" /> Nghe mẫu
            </button>
            <button
              type="button"
              data-sfx="none"
              onClick={onMic}
              disabled={busy}
              className={cx("w-16 h-16 rounded-full flex items-center justify-center text-white border-[3px]", rec || listening ? "bg-[#E0583B] border-[#A4521D]" : "bg-[#3F7A34] border-[#2C5A25]", busy && "opacity-60")}
              aria-label={rec || listening ? "Dừng và chấm" : "Nói theo"}
            >
              {rec || listening ? <Square className="w-7 h-7" fill="currentColor" /> : <Mic className="w-7 h-7" />}
            </button>
            <span className="text-sm font-bold text-[#6B4A30]">{busy ? "Đang chấm…" : rec || listening ? "Đang nghe… bấm lần nữa để chấm" : "Bấm mic rồi nói theo"}</span>
          </div>
          {res && (
            <div className="rounded-[16px] bg-white border-2 border-[#E6CF9A] px-3 py-2 flex flex-col gap-2 anim-pop">
              <div className="flex flex-wrap gap-3 text-sm font-extrabold">
                <span className={res.acc >= 0.8 ? "text-[#2C5A25]" : "text-[#A4521D]"}>Đúng từ: {Math.round(res.acc * 100)}%</span>
                {res.wpm > 0 && (
                  <span className="text-[#24566B]">
                    Tốc độ: {res.wpm} từ/phút {res.wpm < 90 ? "(hơi chậm, nói liền hơi hơn)" : res.wpm > 190 ? "(hơi nhanh)" : "(tự nhiên)"}
                  </span>
                )}
              </div>
              {res.marks.length > 0 && <WordMarks marks={res.marks} />}
              <div className="text-xs font-semibold text-[#6B4A30]">Máy nghe được: “{res.said}”</div>
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              className="cci-btn cci-btn-primary"
              onClick={() => {
                setRes(null);
                if (i + 1 < list.length) setI(i + 1);
                else {
                  sfx.win();
                  setList(shuffle(pool).slice(0, 8));
                  setI(0);
                  setBest([]);
                }
              }}
            >
              {i + 1 < list.length ? "Câu tiếp" : "Lượt mới"} <ChevronRight className="w-4 h-4" />
            </button>
            {best.length > 0 && <span className="self-center text-xs font-bold text-[#6B4A30]">Điểm cao nhất lượt này: {best.filter(Boolean).join(" · ")}</span>}
          </div>
        </section>
      ) : (
        <p className="cci-card p-4 font-semibold">{mounted ? "Chưa có câu nào: học bài đầu tiên trên đảo trước nhé." : "Đang tải…"}</p>
      )}
    </div>
  );
}
