"use client";

import { useEffect, useMemo, useState } from "react";
import { Ear, Headphones, Play, RotateCcw, Volume2 } from "lucide-react";
import { BackLink, WordMarks, cx, shuffle } from "@/components/island/ui";
import { CHAPTERS, type Turn } from "@/lib/island/curriculum";
import { isUnlocked, useIsland } from "@/lib/island/progress";
import { ACCENTS, playVoice, stopVoice, type AccentId } from "@/lib/island/voice";
import { playNoise, stopNoise, type NoiseKind } from "@/lib/island/noise";
import { scoreSpeech } from "@/lib/island/speech";
import { sfx } from "@/lib/island/sfx";
import { useGame } from "@/contexts/game-context";

type Mode = "reply" | "dictation";
type Item = { turn: Turn; ch: number; voice: string; options: { en: string; ok: boolean }[] };
const ROUND = 6;
const SPEEDS = [
  { v: 0.8, vi: "Chậm" },
  { v: 1, vi: "Thường" },
  { v: 1.2, vi: "Nhanh" },
];
const NOISES: { v: NoiseKind; vi: string }[] = [
  { v: "off", vi: "Yên tĩnh" },
  { v: "cafe", vi: "Quán cà phê" },
  { v: "airport", vi: "Sân bay" },
];

/** Phòng nghe: nghe giọng Mỹ/Anh/Úc, đổi tốc độ, thêm tiếng ồn — rồi chọn câu đáp hoặc chép chính tả. */
export default function ListenPage() {
  const s = useIsland();
  const { addXP } = useGame();
  const [mounted, setMounted] = useState(false);
  const [accent, setAccent] = useState<AccentId | "mix">("mix");
  const [speed, setSpeed] = useState(1);
  const [noise, setNoise] = useState<NoiseKind>("off");
  const [mode, setMode] = useState<Mode>("reply");
  const [items, setItems] = useState<Item[] | null>(null);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const [dict, setDict] = useState<{ score: number; marks: { word: string; ok: boolean }[] } | null>(null);
  const [score, setScore] = useState(0);
  const [plays, setPlays] = useState(0);
  useEffect(() => setMounted(true), []);
  useEffect(() => () => (stopNoise(), stopVoice()), []);

  const pool = useMemo(() => (mounted ? CHAPTERS.filter((c) => isUnlocked(s, c.id)) : []), [mounted, s]);

  const start = () => {
    const voices = accent === "mix" ? ACCENTS.flatMap((a) => [...a.voices]) : [...ACCENTS.find((a) => a.id === accent)!.voices];
    const turns = shuffle(pool.flatMap((c) => c.turns.map((t) => ({ t, ch: c.id })))).slice(0, ROUND);
    setItems(turns.map(({ t, ch }) => ({ turn: t, ch, voice: voices[Math.floor(Math.random() * voices.length)], options: shuffle(t.options.map((o) => ({ en: o.en, ok: o.ok }))) })));
    setI(0);
    setScore(0);
    reset();
    playNoise(noise);
    sfx.unlock();
  };
  const reset = () => {
    setPicked(null);
    setTyped("");
    setDict(null);
    setPlays(0);
  };
  const item = items?.[i];
  const play = async () => {
    if (!item) return;
    setPlays((p) => p + 1);
    await playVoice(item.turn.npcLine, item.voice, { rate: speed });
  };
  useEffect(() => {
    if (item) {
      const t = setTimeout(play, 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, items]);

  const answered = mode === "reply" ? picked !== null : dict !== null;
  const next = () => {
    if (!items) return;
    if (i + 1 >= items.length) {
      stopNoise();
      setI(items.length);
      const xp = 5 + score * 2;
      addXP(xp);
      sfx.win();
      return;
    }
    setI(i + 1);
    reset();
  };
  const choose = (k: number) => {
    if (picked !== null || !item) return;
    setPicked(k);
    const ok = item.options[k].ok;
    if (ok) setScore((x) => x + 1);
    (ok ? sfx.correct : sfx.wrong)();
  };
  const check = () => {
    if (!item || !typed.trim()) return;
    const r = scoreSpeech(typed, item.turn.npcLine);
    setDict(r);
    if (r.score >= 0.8) setScore((x) => x + 1);
    (r.score >= 0.8 ? sfx.correct : sfx.wrong)();
  };

  const Seg = <T extends string | number>({ value, set, opts, label }: { value: T; set: (v: T) => void; opts: { v: T; vi: string }[]; label: string }) => (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap rounded-full bg-white border-2 border-[#E6CF9A] p-0.5">
      {opts.map((o) => (
        <button key={String(o.v)} type="button" role="radio" aria-checked={value === o.v} onClick={() => set(o.v)} className={cx("px-3 py-1 rounded-full text-sm font-extrabold", value === o.v ? "bg-[#3F7A34] text-white" : "text-[#6B4A30]")}>
          {o.vi}
        </button>
      ))}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <BackLink href="/island/practice" label="Phòng luyện" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">Phòng nghe</h1>
          <p className="text-sm font-semibold text-[#6B4A30]">Ngoài đời không ai nói chậm và rõ như sách. Tập nghe nhiều giọng, nhiều tốc độ, có cả tiếng ồn.</p>
        </div>
      </div>

      {!items || i >= items.length ? (
        <section className="cci-card-wood p-4 sm:p-5 flex flex-col gap-3">
          {items && i >= items.length && (
            <div className="rounded-[18px] bg-[#EAF3DC] border-[3px] border-[#3F7A34] px-4 py-3 font-extrabold text-[#2C5A25] anim-pop">
              Xong lượt nghe: đúng {score}/{items.length}. +{5 + score * 2} XP. {score < items.length / 2 ? "Thử giảm tốc độ hoặc tắt tiếng ồn rồi nghe lại nhé." : "Tăng độ khó lên thử xem!"}
            </div>
          )}
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-24 text-sm font-extrabold">Giọng</span>
              <Seg value={accent} set={setAccent} label="Giọng" opts={[{ v: "mix", vi: "Trộn" }, ...ACCENTS.map((a) => ({ v: a.id, vi: a.vi }))]} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-24 text-sm font-extrabold">Tốc độ</span>
              <Seg value={speed} set={setSpeed} label="Tốc độ" opts={SPEEDS} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-24 text-sm font-extrabold">Tiếng ồn</span>
              <Seg value={noise} set={setNoise} label="Tiếng ồn" opts={NOISES} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-24 text-sm font-extrabold">Kiểu bài</span>
              <Seg
                value={mode}
                set={setMode}
                label="Kiểu bài"
                opts={[
                  { v: "reply", vi: "Chọn câu đáp" },
                  { v: "dictation", vi: "Chép chính tả" },
                ]}
              />
            </div>
          </div>
          <button type="button" className="cci-btn cci-btn-primary cci-btn-big self-start" onClick={start} disabled={!pool.length}>
            <Headphones className="w-5 h-5" /> {items ? "Nghe lượt mới" : `Bắt đầu (${ROUND} câu)`}
          </button>
          <p className="text-xs font-semibold text-[#6B4A30]">Câu lấy từ các chương bạn đã mở. Nên đeo tai nghe.</p>
        </section>
      ) : (
        item && (
          <section className="cci-card-wood p-4 sm:p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm font-extrabold text-[#6B4A30]">
              <span>
                Câu {i + 1}/{items.length} · Chương {item.ch}
              </span>
              <span>Đúng {score}</span>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={play} className="w-16 h-16 rounded-full bg-[#3F7A34] text-white flex items-center justify-center border-[3px] border-[#2C5A25] shrink-0" aria-label="Nghe">
                {plays ? <RotateCcw className="w-7 h-7" /> : <Play className="w-7 h-7" />}
              </button>
              <div className="text-sm font-semibold text-[#6B4A30]">
                <Ear className="inline w-4 h-4" /> {mode === "reply" ? "Nghe rồi chọn câu đáp phù hợp nhất." : "Nghe rồi gõ lại đúng câu bạn nghe được."} Đã nghe {plays} lần.
              </div>
            </div>

            {mode === "reply" ? (
              <div className="flex flex-col gap-2">
                {item.options.map((o, k) => (
                  <button
                    key={k}
                    type="button"
                    disabled={picked !== null}
                    onClick={() => choose(k)}
                    className={cx(
                      "text-left rounded-[16px] border-[3px] px-3 py-2 font-bold bg-white",
                      picked === null ? "border-[#D8BF92] hover:border-[#8B5E3C]" : o.ok ? "border-[#3F7A34] bg-[#EAF3DC]" : picked === k ? "border-[#C96A2B] bg-[#FDEEDD]" : "border-[#E6CF9A] opacity-60",
                    )}
                  >
                    {o.en}
                  </button>
                ))}
              </div>
            ) : (
              <form
                className="flex flex-col gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  check();
                }}
              >
                <input value={typed} onChange={(e) => setTyped(e.target.value)} disabled={!!dict} placeholder="Gõ câu bạn nghe được…" autoComplete="off" className="h-12 rounded-[16px] border-[3px] border-[#8B5E3C] bg-white px-4 font-semibold outline-none focus:border-[#3F7A34]" />
                {!dict && (
                  <button type="submit" className="cci-btn cci-btn-primary self-start" disabled={!typed.trim()}>
                    Kiểm tra
                  </button>
                )}
                {dict && <WordMarks marks={dict.marks} />}
              </form>
            )}

            {answered && (
              <div className="rounded-[16px] bg-white border-2 border-[#E6CF9A] px-3 py-2">
                <div className="font-extrabold leading-snug">
                  {item.turn.npcLine}{" "}
                  <button type="button" onClick={() => playVoice(item.turn.npcLine, item.voice, { rate: 0.8 })} aria-label="Nghe chậm">
                    <Volume2 className="inline w-4 h-4 text-[#3F7A34]" />
                  </button>
                </div>
                <div className="text-sm font-semibold text-[#6B4A30]">{item.turn.npcVi}</div>
              </div>
            )}
            {answered && (
              <button type="button" className="cci-btn cci-btn-primary self-start" onClick={next}>
                {i + 1 >= items.length ? "Xem kết quả" : "Câu tiếp"}
              </button>
            )}
          </section>
        )
      )}
    </div>
  );
}
