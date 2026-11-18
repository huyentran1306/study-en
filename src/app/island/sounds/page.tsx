"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, AudioLines, Ear, Mic, RotateCcw, Snail, Volume2, X } from "lucide-react";
import { Avatar, Character } from "@/components/island/character";
import { BackLink, Feedback, MicButton, Stars, cx, shuffle } from "@/components/island/ui";
import { CHAPTERS } from "@/lib/island/curriculum";
import { SOUND_SETS, soundSetForWeek, type SoundSet } from "@/lib/island/drills";
import { currentChapterId, saveSound, useIsland } from "@/lib/island/progress";
import { normWords, speak, stopSpeaking, useListen } from "@/lib/island/speech";
import { sfx } from "@/lib/island/sfx";
import { useGame } from "@/contexts/game-context";
import { NextStep } from "@/components/island/journey";

interface Q {
  kind: "listen" | "say";
  word: string;
  pair: [string, string];
}

function buildQs(set: SoundSet, withSpeaking: boolean): Q[] {
  const listenQs: Q[] = shuffle([...set.pairs, ...set.pairs])
    .slice(0, 8)
    .map((p) => ({ kind: "listen", word: p[Math.random() < 0.5 ? 0 : 1], pair: p }));
  const sayQs: Q[] = withSpeaking
    ? shuffle(set.pairs)
        .slice(0, 4)
        .map((p, i) => ({ kind: "say", word: p[i % 2], pair: p }))
    : [];
  return [...listenQs, ...sayQs];
}

function Inner() {
  const s = useIsland();
  const { addXP } = useGame();
  const sp = useSearchParams();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const chParam = Number(sp.get("ch"));
  const chId = chParam && CHAPTERS.some((c) => c.id === chParam) ? chParam : currentChapterId(s);
  const week = CHAPTERS.find((c) => c.id === chId)?.week || 1;
  const [setId, setSetId] = useState(soundSetForWeek(week).id);
  const set = SOUND_SETS.find((x) => x.id === setId) || SOUND_SETS[0];

  const { supported, listening, interim, error, listen, stop } = useListen();
  const [qs, setQs] = useState<Q[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState<{ ok: boolean; said?: string; picked?: string } | null>(null);
  const [okCount, setOkCount] = useState(0);
  const [done, setDone] = useState<{ pct: number; xp: number } | null>(null);

  const q = qs?.[idx];

  useEffect(() => {
    if (q?.kind === "listen" && !answer) {
      const t = setTimeout(() => speak(q.word, { who: "kero" }), 350);
      return () => clearTimeout(t);
    }
  }, [q, answer]);
  useEffect(() => () => stopSpeaking(), []);

  const begin = () => {
    setQs(buildQs(set, supported));
    setIdx(0);
    setAnswer(null);
    setOkCount(0);
    setDone(null);
    sfx.whoosh();
  };

  const pick = (w: string) => {
    if (!q || answer) return;
    const ok = w === q.word;
    setAnswer({ ok, picked: w });
    if (ok) setOkCount((n) => n + 1);
  };

  const onMic = async () => {
    if (!q || answer) return;
    if (listening) return stop();
    sfx.micOn();
    const said = await listen();
    if (!said.trim()) return;
    const words = normWords(said);
    // Máy nhận đúng từ mục tiêu (không phải từ còn lại trong cặp) thì tính là đúng.
    const ok = normWords(q.word).every((t) => words.includes(t));
    setAnswer({ ok, said });
    if (ok) setOkCount((n) => n + 1);
  };

  const next = () => {
    if (!qs) return;
    if (idx + 1 >= qs.length) {
      const pct = Math.round((okCount / qs.length) * 100);
      const xp = Math.round(pct / 5) + (pct >= 60 ? 10 : 0);
      saveSound(set.id, pct, xp, chId);
      addXP(xp);
      setDone({ pct, xp });
      if (pct >= 60) sfx.win();
      return;
    }
    sfx.flip();
    setIdx(idx + 1);
    setAnswer(null);
  };

  // ───── Kết quả ─────
  if (qs && done) {
    const stars = done.pct >= 90 ? 3 : done.pct >= 70 ? 2 : done.pct >= 40 ? 1 : 0;
    return (
      <div className="max-w-xl mx-auto px-3 py-8">
        <div className="cci-card-wood !rounded-[28px] p-6 sm:p-8 flex flex-col items-center gap-4 text-center anim-pop">
          <div className="w-36 rounded-[24px] bg-[#D7ECF5] pt-4 flex justify-center">
            <Character who="kero" mood={stars >= 2 ? "happy" : "wave"} size="80%" />
          </div>
          <Stars n={stars} size={44} sound />
          <h1 className="text-3xl font-extrabold leading-tight">{set.title}: {done.pct}%</h1>
          <span className="cci-chip !bg-[#FFF1C7] !text-base">+{done.xp} XP</span>
          {done.pct >= 60 && s.chapters[chId]?.lesson && <span className="cci-chip !bg-[#EAF3DC]">✅ Xong nhiệm vụ Ngày 7 · Chương {chId}</span>}
          <p className="font-semibold text-[#6B4A30]">💡 {set.tip}</p>
          <NextStep />
          <div className="flex gap-2 flex-wrap justify-center">
            <button type="button" className="cci-btn cci-btn-big" onClick={begin}>
              <RotateCcw className="w-5 h-5" /> Chơi lại
            </button>
            <button type="button" className="cci-btn cci-btn-big" onClick={() => setQs(null)}>
              Bộ âm khác
            </button>
            <Link href="/island" className="cci-btn cci-btn-big">
              Về đảo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ───── Đang chơi ─────
  if (qs && q) {
    return (
      <div className="max-w-xl mx-auto px-3 sm:px-6 py-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button type="button" className="cci-btn !min-h-[44px] !w-[44px] !p-0" onClick={() => setQs(null)} aria-label="Thoát">
            <X className="w-5 h-5" />
          </button>
          <div className="flex-1 h-3 rounded-full bg-[#EAD9B8] border-2 border-[#8B5E3C] overflow-hidden">
            <div className="h-full bg-[#6FAE4F]" style={{ width: `${(idx / qs.length) * 100}%` }} />
          </div>
          <span className="text-sm font-extrabold">
            {idx + 1}/{qs.length}
          </span>
        </div>

        <div className="cci-card-wood !rounded-[28px] p-6 flex flex-col items-center gap-4 text-center">
          <span className="cci-chip !text-xs">
            {q.kind === "listen" ? <Ear className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />} {q.kind === "listen" ? "Nghe và chọn từ bạn nghe được" : "Đọc to từ này"}
          </span>
          {q.kind === "listen" ? (
            <>
              <div className="flex gap-2">
                <button type="button" data-sfx="none" className="cci-btn cci-btn-primary !w-[72px] !h-[72px] !rounded-full !p-0" onClick={() => speak(q.word, { who: "kero" })} aria-label="Nghe lại">
                  <Volume2 className="w-8 h-8" />
                </button>
                <button type="button" data-sfx="none" className="cci-btn !w-[72px] !h-[72px] !rounded-full !p-0" onClick={() => speak(q.word, { who: "kero", speed: "slow" })} aria-label="Nghe chậm">
                  <Snail className="w-7 h-7" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full">
                {q.pair.map((w) => {
                  const state = answer ? (w === q.word ? "ok" : w === answer.picked ? "bad" : "") : "";
                  return (
                    <button
                      key={w}
                      type="button"
                      data-sfx="tap"
                      disabled={!!answer}
                      onClick={() => pick(w)}
                      className={cx("cci-btn !min-h-[72px] !text-2xl font-baloo !font-extrabold", state === "ok" && "!bg-[#EAF3DC] !border-[#3F7A34]", state === "bad" && "!bg-[#FDEEDD] !border-[#C96A2B] anim-shake")}
                    >
                      {w}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="font-baloo font-extrabold text-5xl">{q.word}</div>
              <div className="text-sm font-semibold text-[#6B4A30]">Đừng nhầm với “{q.pair[0] === q.word ? q.pair[1] : q.pair[0]}”</div>
              {!answer && <MicButton listening={listening} onClick={onMic} label="bấm rồi đọc" />}
              {listening && interim && <p className="font-semibold text-[#6B4A30]">“{interim}”</p>}
              <button type="button" data-sfx="none" className="text-xs font-extrabold text-[#3F7A34] inline-flex items-center gap-1" onClick={() => speak(q.word, { who: "kero", speed: "slow" })}>
                <Volume2 className="w-3.5 h-3.5" /> Nghe mẫu
              </button>
            </>
          )}
        </div>

        {answer && (
          <Feedback ok={answer.ok} title={answer.ok ? "Chuẩn!" : "Chưa đúng"}>
            {q.kind === "listen" ? (
              <>
                Từ vừa nghe là <b>{q.word}</b>.{" "}
                <button type="button" data-sfx="none" className="underline font-extrabold" onClick={() => speak(`${q.pair[0]}. ${q.pair[1]}.`, { who: "kero", speed: "slow" })}>
                  Nghe so sánh “{q.pair[0]}” – “{q.pair[1]}”
                </button>
              </>
            ) : (
              <>
                Máy nghe được: “{answer.said}”. {!answer.ok && set.tip}
              </>
            )}
          </Feedback>
        )}
        {answer && (
          <button type="button" className="cci-btn cci-btn-primary cci-btn-big" onClick={next}>
            {idx + 1 >= qs.length ? "Xem kết quả" : "Tiếp"} <ArrowRight className="w-5 h-5" />
          </button>
        )}
        {q.kind === "say" && !answer && (
          <button type="button" className="text-xs font-bold text-[#6B4A30] underline self-center" onClick={() => setAnswer({ ok: false, said: "(bỏ qua)" })}>
            Bỏ qua câu này
          </button>
        )}
        {error && <p className="text-xs font-bold text-[#A4521D] text-center">{error}</p>}
      </div>
    );
  }

  // ───── Chọn bộ âm ─────
  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <BackLink />
        <Avatar who="kero" size={52} />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight flex items-center gap-2">
            <AudioLines className="w-7 h-7" /> Phát âm chuẩn
          </h1>
          <p className="font-semibold text-[#6B4A30] text-sm sm:text-base">Những cặp âm người Việt hay nói lẫn. Nghe phân biệt được thì mới nói đúng được.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SOUND_SETS.map((x) => {
          const best = mounted ? s.sounds[x.id] : undefined;
          return (
            <button
              key={x.id}
              type="button"
              onClick={() => setSetId(x.id)}
              className={cx("cci-card p-4 text-left flex flex-col gap-1.5 hover:-translate-y-0.5 transition-transform", setId === x.id && "!border-[#3F7A34] ring-4 ring-[#A8D27A]")}
              aria-pressed={setId === x.id}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-baloo font-extrabold text-lg leading-tight">{x.title}</span>
                {best !== undefined && <span className="text-xs font-extrabold px-2 py-0.5 rounded-full" style={{ background: best >= 60 ? "#EAF3DC" : "#FFF1C7" }}>{best}%</span>}
              </span>
              <span className="text-sm font-semibold text-[#6B4A30]">{x.pairs.map((p) => p.join("/")).join(" · ")}</span>
              {x.id === soundSetForWeek(week).id && <span className="cci-chip !text-[11px] !py-0.5 self-start !bg-[#FFF1C7]">Gợi ý tuần {week}</span>}
            </button>
          );
        })}
      </div>

      <div className="cci-card p-4 sm:p-5 flex flex-col gap-3">
        <div className="font-baloo font-extrabold text-xl">{set.title}</div>
        <p className="font-semibold text-[#6B4A30]">💡 {set.tip}</p>
        <div className="flex flex-wrap gap-2">
          {set.pairs.map((p) => (
            <button key={p.join()} type="button" data-sfx="none" className="cci-btn !min-h-[40px] !text-sm" onClick={() => speak(`${p[0]}. ${p[1]}.`, { who: "kero", speed: "slow" })}>
              <Volume2 className="w-4 h-4" /> {p[0]} – {p[1]}
            </button>
          ))}
        </div>
        <button type="button" className="cci-btn cci-btn-primary cci-btn-big w-full sm:w-auto sm:self-start !whitespace-normal text-center" data-sfx="open" onClick={begin}>
          Bắt đầu · 8 câu nghe{supported ? " + 4 câu nói" : ""} <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default function SoundsPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
