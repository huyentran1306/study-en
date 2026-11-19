"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Gift, Mic, PartyPopper, Volume2 } from "lucide-react";
import { BackLink, cx } from "@/components/island/ui";
import { FESTIVALS, FEST_BONUS, activeSeason, daysBetween, nextSeason } from "@/lib/island/festival";
import { festDone, today, useIsland } from "@/lib/island/progress";
import { scoreSpeech, speak, useListen } from "@/lib/island/speech";
import { canRecord, startRecording, transcribe } from "@/lib/island/voice";
import { sfx } from "@/lib/island/sfx";

const fmt = (d: string) => d.split("-").reverse().slice(0, 2).map(Number).join("/");

export default function FestivalPage() {
  const s = useIsland();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const day = mounted ? today() : "2026-01-01";
  const season = mounted ? activeSeason(day) : null;
  const upcoming = mounted ? nextSeason(day) : null;
  const fest = season?.fest || upcoming?.fest || FESTIVALS[0];
  const rec = season ? s.fest[season.key] || {} : {};
  const badges = Object.entries(s.fest).filter(([, v]) => v.words && v.speak);

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <BackLink href="/island?view=fest" label="Đảo Lễ Hội" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold leading-tight">Đảo Lễ Hội</h1>
          <p className="text-sm font-semibold text-[#6B4A30]">Mỗi mùa lễ: 10 từ mới và 3 lời chúc bằng tiếng Anh. Mỗi phần xong được {FEST_BONUS} vỏ sò.</p>
        </div>
      </div>

      {mounted && (
        <section className="rounded-[22px] px-4 py-3 flex items-center gap-3" style={{ background: season ? "linear-gradient(135deg,#FFE3D6,#FFF1C7)" : "#F3E6CC", border: "3px solid #E0A26E" }}>
          <PartyPopper className="w-8 h-8 text-[#C96A2B] shrink-0" />
          <div className="flex-1 min-w-0">
            {season ? (
              <>
                <div className="font-baloo font-extrabold text-xl leading-tight">
                  Mùa {fest.name} · {fest.en}
                </div>
                <div className="text-sm font-bold text-[#6B4A30]">Còn {daysBetween(day, season.to) + 1} ngày (tới {fmt(season.to)})</div>
              </>
            ) : (
              <>
                <div className="font-baloo font-extrabold text-xl leading-tight">Đảo đang chuẩn bị mùa {upcoming!.fest.name}</div>
                <div className="text-sm font-bold text-[#6B4A30]">Mở sau {daysBetween(day, upcoming!.from)} ngày ({fmt(upcoming!.from)}). Học trước từ vựng bên dưới được, thưởng tính khi vào mùa.</div>
              </>
            )}
          </div>
        </section>
      )}

      <WordsPart key={`w-${fest.id}`} fest={fest} done={!!rec.words} onPass={() => season && festDone(season.key, "words") && sfx.win()} canReward={!!season} />
      <SpeakPart key={`s-${fest.id}`} fest={fest} done={!!rec.speak} onPass={() => season && festDone(season.key, "speak") && sfx.win()} canReward={!!season} />

      {badges.length > 0 && (
        <section className="cci-card-wood p-4 flex flex-col gap-2">
          <h2 className="font-baloo font-extrabold text-lg">Huy hiệu mùa lễ</h2>
          <ul className="flex flex-wrap gap-2">
            {badges.map(([k]) => {
              const f = FESTIVALS.find((x) => k.startsWith(x.id));
              return (
                <li key={k} className="inline-flex items-center gap-1.5 rounded-full bg-[#F2C14E] border-2 border-[#4A3222] px-3 py-1 font-extrabold text-sm">
                  <Gift className="w-4 h-4" /> {f?.name} {k.slice(-4)}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function WordsPart({ fest, done, onPass, canReward }: { fest: (typeof FESTIVALS)[number]; done: boolean; onPass: () => void; canReward: boolean }) {
  const [quiz, setQuiz] = useState<{ i: number; right: number; picked: number | null } | null>(null);
  const qs = useMemo(
    () =>
      [...fest.words]
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
        .map((w) => ({ w, options: [w.vi, ...fest.words.filter((x) => x.en !== w.en).sort(() => Math.random() - 0.5).slice(0, 2).map((x) => x.vi)].sort(() => Math.random() - 0.5) })),
    [fest],
  );
  const q = quiz ? qs[quiz.i] : null;
  return (
    <section className="cci-card-wood p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="font-baloo font-extrabold text-lg flex-1">1. Học 10 từ mùa lễ</h2>
        {done && <span className="text-sm font-extrabold text-[#2C5A25] inline-flex items-center gap-1"><Check className="w-4 h-4" strokeWidth={3} /> Đã xong</span>}
      </div>
      <ul className="grid grid-cols-2 gap-2">
        {fest.words.map((w) => (
          <li key={w.en}>
            <button type="button" data-sfx="none" onClick={() => speak(w.en, { who: "you" })} className="w-full text-left rounded-[14px] bg-white border-2 border-[#EAD9B8] hover:border-[#8B5E3C] px-3 py-2">
              <span className="block font-extrabold leading-tight">
                {w.en} <Volume2 className="inline w-3.5 h-3.5 text-[#3F7A34]" />
              </span>
              <span className="block text-xs font-semibold text-[#6B4A30]">{w.vi}</span>
            </button>
          </li>
        ))}
      </ul>
      {!quiz && (
        <button type="button" className="cci-btn cci-btn-primary self-start" onClick={() => setQuiz({ i: 0, right: 0, picked: null })}>
          Làm bài 5 câu {canReward && !done ? `(+${FEST_BONUS} vỏ sò)` : ""}
        </button>
      )}
      {quiz && q && (
        <div className="rounded-[16px] bg-[#FFFBF2] border-2 border-[#E6CF9A] p-3 flex flex-col gap-2">
          <div className="text-xs font-extrabold text-[#6B4A30]">Câu {quiz.i + 1}/5 · “{q.w.en}” nghĩa là gì?</div>
          {q.options.map((o, k) => (
            <button
              key={o}
              type="button"
              data-sfx="none"
              disabled={quiz.picked !== null}
              onClick={() => {
                const ok = o === q.w.vi;
                if (ok) sfx.correct();
                else sfx.wrong();
                setQuiz({ ...quiz, picked: k, right: quiz.right + (ok ? 1 : 0) });
                setTimeout(() => {
                  if (quiz.i + 1 >= qs.length) {
                    const total = quiz.right + (ok ? 1 : 0);
                    if (total >= 4) onPass();
                    setQuiz({ i: qs.length, right: total, picked: null });
                  } else setQuiz({ i: quiz.i + 1, right: quiz.right + (ok ? 1 : 0), picked: null });
                }, 700);
              }}
              className={cx("text-left rounded-[12px] border-2 px-3 py-2 font-bold", quiz.picked === null ? "bg-white border-[#E6CF9A]" : o === q.w.vi ? "bg-[#E9F6E1] border-[#6FAE4F]" : quiz.picked === k ? "bg-[#FDEEDD] border-[#E0A26E]" : "bg-white border-[#EFE3CC] opacity-60")}
            >
              {o}
            </button>
          ))}
        </div>
      )}
      {quiz && !q && (
        <p className="font-bold" role="status">
          Đúng {quiz.right}/5. {quiz.right >= 4 ? "Giỏi quá!" : "Ôn lại thẻ rồi làm lại nhé (cần đúng 4 câu)."}{" "}
          <button type="button" className="underline underline-offset-4" onClick={() => setQuiz(null)}>
            Làm lại
          </button>
        </p>
      )}
    </section>
  );
}

function SpeakPart({ fest, done, onPass, canReward }: { fest: (typeof FESTIVALS)[number]; done: boolean; onPass: () => void; canReward: boolean }) {
  const { supported, listening, listen, stop } = useListen();
  const [ok, setOk] = useState<boolean[]>(fest.phrases.map(() => false));
  const [heard, setHeard] = useState<string[]>(fest.phrases.map(() => ""));
  const [busy, setBusy] = useState<number | null>(null);
  const check = (k: number, said: string) => {
    const good = scoreSpeech(said, fest.phrases[k].en).score >= 0.6;
    setHeard((h) => h.map((x, i) => (i === k ? said : x)));
    if (good) sfx.correct();
    else sfx.wrong();
    setOk((o) => {
      const n = o.map((x, i) => (i === k ? x || good : x));
      if (n.every(Boolean) && !o.every(Boolean)) onPass();
      return n;
    });
  };
  const say = async (k: number) => {
    if (busy !== null) return;
    setBusy(k);
    try {
      if (supported) {
        if (listening) return stop();
        check(k, await listen());
      } else if (canRecord()) {
        const r = await startRecording(8000);
        await new Promise((res) => setTimeout(res, 4000));
        const t = await transcribe((await r.stop()).blob);
        check(k, t.text);
      }
    } finally {
      setBusy(null);
    }
  };
  return (
    <section className="cci-card-wood p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="font-baloo font-extrabold text-lg flex-1">2. Nói lời chúc {canReward && !done ? `(+${FEST_BONUS} vỏ sò)` : ""}</h2>
        {done && <span className="text-sm font-extrabold text-[#2C5A25] inline-flex items-center gap-1"><Check className="w-4 h-4" strokeWidth={3} /> Đã xong</span>}
      </div>
      <ul className="flex flex-col gap-2">
        {fest.phrases.map((p, k) => (
          <li key={p.en} className={cx("rounded-[14px] border-2 px-3 py-2 flex items-center gap-2", ok[k] ? "bg-[#E9F6E1] border-[#9CC77F]" : "bg-white border-[#EAD9B8]")}>
            <button type="button" data-sfx="none" onClick={() => speak(p.en, { who: "you" })} className="flex-1 min-w-0 text-left">
              <span className="block font-extrabold leading-snug">
                {p.en} <Volume2 className="inline w-3.5 h-3.5 text-[#3F7A34]" />
              </span>
              <span className="block text-xs font-semibold text-[#6B4A30]">{p.vi}</span>
              {heard[k] && !ok[k] && <span className="block text-xs font-bold text-[#A4521D]">Mình nghe: “{heard[k]}”, thử lại nhé</span>}
            </button>
            {ok[k] ? (
              <Check className="w-6 h-6 text-[#3F7A34] shrink-0" strokeWidth={3} />
            ) : (
              <button type="button" className={cx("cci-btn !min-h-[40px] !px-3 shrink-0", busy === k && "!bg-[#C96A2B] !text-white")} onClick={() => say(k)} disabled={busy !== null && busy !== k} aria-label={`Nói: ${p.en}`}>
                <Mic className="w-4 h-4" /> {busy === k ? "Đang nghe" : "Nói"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
