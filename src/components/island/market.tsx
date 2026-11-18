"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Mic, Shell, Sparkles, Volume2, X } from "lucide-react";
import { Character } from "./character";
import { SeaCreature } from "./farm-art";
import { cx } from "./ui";
import { CUSTOMERS, RARE, SPECIES_BY_KIND, TIP_SPEAK, TIP_TAP } from "@/lib/island/farm-data";
import { NPCS } from "@/lib/island/curriculum";
import { tipCustomer } from "@/lib/island/progress";
import type { FarmKind } from "@/lib/island/state";
import { scoreSpeech, speak, useListen } from "@/lib/island/speech";
import { sfx } from "@/lib/island/sfx";

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export type Catch = { idx: number; kind: FarmKind; rare: boolean; earned: number; done: string };

/**
 * Vớt lên xong: một cư dân ghé chợ hỏi mua bằng tiếng Anh.
 * Nói đúng câu đáp → +50% · chọn đúng → +25% · bán cho Mallow → giá thường.
 */
export function CustomerModal({ c, onClose }: { c: Catch; onClose: () => void }) {
  const sp = SPECIES_BY_KIND[c.kind];
  const item = c.rare ? RARE[c.kind].en : sp.en;
  const itemVi = (c.rare ? RARE[c.kind].vi : sp.vi).toLowerCase();
  const [cu] = useState(() => CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)]);
  const fill = (t: string) => t.split("{itemVi}").join(itemVi).split("{item}").join(item).split("{price}").join(String(c.earned));
  const ask = fill(cu.ask);
  const answer = fill(cu.answer);
  const options = useMemo(() => shuffle([answer, ...cu.wrong.map(fill)]), [answer]); // eslint-disable-line react-hooks/exhaustive-deps
  const { supported, listening, interim, listen, stop } = useListen();
  const [phase, setPhase] = useState<"ask" | "done">("ask");
  const [picked, setPicked] = useState<string | null>(null);
  const [heard, setHeard] = useState<{ text: string; ok: boolean } | null>(null);
  const [tip, setTip] = useState(0);
  const [how, setHow] = useState<"speak" | "tap" | "skip" | "miss">("skip");
  const sayLine = c.rare ? RARE[c.kind].say : sp.say;

  useEffect(() => {
    const t = setTimeout(() => speak(ask, { who: cu.who }), 450);
    return () => clearTimeout(t);
  }, [ask, cu.who]);

  const finish = (rate: number, mode: typeof how) => {
    const got = rate > 0 ? tipCustomer(c.idx, c.done, rate) : 0;
    setTip(got);
    setHow(mode);
    setTimeout(() => {
      setPhase("done");
      if (got > 0) {
        sfx.coin();
        setTimeout(() => sfx.win(), 250);
      }
      setTimeout(() => speak(rate > 0 ? "Thank you so much! Have a nice day!" : sayLine.en, { who: rate > 0 ? cu.who : "mallow" }), 400);
    }, mode === "skip" ? 0 : 900);
  };

  const tap = (o: string) => {
    if (picked || phase !== "ask") return;
    setPicked(o);
    if (o === answer) {
      sfx.correct();
      finish(TIP_TAP, "tap");
    } else {
      sfx.wrong();
      setTimeout(() => finish(0, "miss"), 600);
    }
  };

  const talk = async () => {
    if (listening) return stop();
    sfx.micOn();
    const said = await listen();
    if (!said) return setHeard({ text: "", ok: false });
    const ok = scoreSpeech(said, answer).score >= 0.6;
    setHeard({ text: said, ok });
    if (ok) {
      sfx.correct();
      setPicked(answer);
      finish(TIP_SPEAK, "speak");
    } else sfx.wrong();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-3 bg-[#4A3222]/40" role="dialog" aria-modal="true" aria-label="Khách tới mua">
      <div className="cci-card-wood w-full max-w-md p-5 flex flex-col gap-3 anim-pop max-h-[92dvh] overflow-y-auto">
        {phase === "ask" ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wide text-[#A4521D]">Có khách tới mua!</span>
              <span className="flex items-center gap-1 text-sm font-extrabold">
                <Shell className="w-4 h-4 text-[#C99A1E]" /> +{c.earned}
              </span>
            </div>
            <div className="flex items-end gap-3">
              <div className="w-20 shrink-0">
                <Character who={cu.who} mood="talk" size="100%" />
              </div>
              <button type="button" data-sfx="none" onClick={() => speak(ask, { who: cu.who })} className="flex-1 text-left rounded-[18px] rounded-bl-[4px] bg-white border-[3px] border-[#4A3222] px-3 py-2">
                <span className="block text-[11px] font-extrabold text-[#6B4A30]">{NPCS[cu.who].name}</span>
                <span className="block font-bold leading-snug">
                  {ask} <Volume2 className="inline w-4 h-4 text-[#3F7A34]" />
                </span>
                <span className="block text-xs font-semibold text-[#6B4A30] mt-0.5">{fill(cu.askVi)}</span>
              </button>
              <div className="w-14 shrink-0 mb-1">
                <SeaCreature kind={c.kind} rare={c.rare} />
              </div>
            </div>

            <div className="text-sm font-extrabold text-[#4A3222]">Bạn đáp lại thế nào?</div>
            <div className="flex flex-col gap-2">
              {options.map((o) => {
                const right = picked && o === answer;
                const wrong = picked === o && o !== answer;
                return (
                  <button
                    key={o}
                    type="button"
                    data-sfx="none"
                    disabled={!!picked}
                    onClick={() => tap(o)}
                    className={cx(
                      "text-left rounded-[16px] border-[3px] px-3 py-2 font-bold transition-colors",
                      right ? "border-[#3F7A34] bg-[#EAF3DC]" : wrong ? "border-[#C96A2B] bg-[#FDEEDD] anim-shake" : "border-[#D8BF92] bg-white hover:bg-[#FBF0D9]",
                    )}
                  >
                    {right && <Check className="inline w-4 h-4 mr-1 text-[#3F7A34]" strokeWidth={3} />}
                    {wrong && <X className="inline w-4 h-4 mr-1 text-[#C96A2B]" strokeWidth={3} />}
                    {o}
                  </button>
                );
              })}
            </div>

            {supported && (
              <div className="flex flex-col gap-1.5">
                <button type="button" data-sfx="none" disabled={!!picked} onClick={talk} className={cx("cci-btn cci-btn-primary", listening && "anim-bounce")}>
                  <Mic className="w-5 h-5" /> {listening ? "Đang nghe… nói đi!" : "Nói câu đáp (+50%)"}
                </button>
                {listening && interim && <div className="text-sm font-semibold text-center text-[#6B4A30]">“{interim}”</div>}
                {heard && !heard.ok && (
                  <div className="text-sm font-semibold text-center text-[#A4521D]">
                    {heard.text ? `Mình nghe: “${heard.text}” — chưa khớp, thử lại hoặc chọn câu nhé.` : "Chưa nghe rõ, thử lại hoặc chọn câu nhé."}
                  </div>
                )}
              </div>
            )}
            <div className="text-xs font-semibold text-center text-[#6B4A30]">
              Nói đúng +{Math.round(TIP_SPEAK * 100)}% · chọn đúng +{Math.round(TIP_TAP * 100)}% tiền bán
            </div>
            <button type="button" data-sfx="close" disabled={!!picked} onClick={() => finish(0, "skip")} className="text-sm font-extrabold text-[#6B4A30] underline underline-offset-4 self-center disabled:opacity-40">
              Bán cho Mallow giá thường
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-end gap-2">
              <div className="w-20">
                <Character who={tip > 0 ? cu.who : "mallow"} mood="happy" size="100%" />
              </div>
              <div className="w-24 anim-bounce">
                <SeaCreature kind={c.kind} rare={c.rare} />
              </div>
            </div>
            {c.rare && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F2C14E] border-2 border-[#4A3222] px-3 py-0.5 text-sm font-extrabold">
                <Sparkles className="w-4 h-4" /> Con hiếm · giá gấp đôi
              </span>
            )}
            <h2 className="text-2xl font-extrabold leading-tight">+{c.earned + tip} vỏ sò!</h2>
            {tip > 0 ? (
              <p className="font-bold text-[#3F7A34]">
                Khách bo thêm +{tip} vì bạn {how === "speak" ? "nói tiếng Anh chuẩn" : "đáp đúng"}!
              </p>
            ) : (
              how === "miss" && (
                <p className="text-sm font-semibold text-[#6B4A30]">
                  Câu đúng là: <b>{answer}</b>
                  <button type="button" data-sfx="none" onClick={() => speak(answer, { who: "you" })} className="inline-flex align-middle ml-1">
                    <Volume2 className="w-4 h-4 text-[#3F7A34]" />
                  </button>
                </p>
              )
            )}
            <button type="button" data-sfx="none" onClick={() => speak(sayLine.en, { who: "mallow" })} className="rounded-[16px] px-3 py-2 bg-white border-2 border-[#EAD9B8] text-left">
              <span className="block font-bold leading-snug">
                {sayLine.en} <Volume2 className="inline w-4 h-4 text-[#3F7A34]" />
              </span>
              <span className="block text-sm font-semibold text-[#6B4A30]">{sayLine.vi}</span>
            </button>
            <button type="button" className="cci-btn cci-btn-primary cci-btn-big" onClick={onClose}>
              Tuyệt!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
