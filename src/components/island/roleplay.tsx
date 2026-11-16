"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Eye, Keyboard, LifeBuoy, Volume2, Zap } from "lucide-react";
import { NPCS, RESCUE_BAG, type NpcId, type Option, type SceneId } from "@/lib/island/curriculum";
import { scoreSpeech, speak, stopSpeaking, useListen } from "@/lib/island/speech";
import { sfx } from "@/lib/island/sfx";
import { Scene } from "./scene";
import { Bubble, Feedback, MicButton, SpeakButtons, WordMarks, cx, shuffle } from "./ui";

export interface RpTurn {
  npc: NpcId;
  scene: SceneId;
  npcLine: string;
  npcVi: string;
  hints: string[];
  options: Option[];
  rescue?: { slow: string; slowVi: string };
}

export type RpMode = "choose" | "speak" | "challenge";

export interface RpResult {
  firstTry: number;
  total: number;
  rescueOk: boolean;
  spoke: number;
}

const LETTERS = ["A", "B", "C", "D"];

export function Roleplay({ turns, mode, onDone, onProgress }: { turns: RpTurn[]; mode: RpMode; onDone: (r: RpResult) => void; onProgress?: (i: number) => void }) {
  const [idx, setIdx] = useState(0);
  const stats = useRef<RpResult>({ firstTry: 0, total: turns.length, rescueOk: false, spoke: 0 });

  const next = () => {
    if (idx + 1 >= turns.length) onDone(stats.current);
    else {
      setIdx(idx + 1);
      onProgress?.(idx + 1);
    }
  };

  return (
    <TurnView
      key={idx}
      turn={turns[idx]}
      mode={mode}
      onSolved={(firstTry, spoken) => {
        if (firstTry) stats.current.firstTry++;
        if (spoken) stats.current.spoke++;
        if (turns[idx].rescue) stats.current.rescueOk = true;
      }}
      onNext={next}
      last={idx + 1 >= turns.length}
    />
  );
}

function TurnView({ turn, mode, onSolved, onNext, last }: { turn: RpTurn; mode: RpMode; onSolved: (firstTry: boolean, spoken: boolean) => void; onNext: () => void; last: boolean }) {
  const options = useMemo(() => shuffle(turn.options), [turn]);
  const isRescue = !!turn.rescue;
  const [picked, setPicked] = useState<number | null>(null);
  const [tries, setTries] = useState(0);
  const [solved, setSolved] = useState(false);
  const [badIdx, setBadIdx] = useState<number | null>(null);
  const [heard, setHeard] = useState<{ text: string; marks?: { word: string; ok: boolean }[]; matched: boolean } | null>(null);
  const [showOptions, setShowOptions] = useState(mode !== "speak");
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState("");
  const { supported, listening, interim, error, listen, stop } = useListen();
  const [npcTalking, setNpcTalking] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (picked !== null || heard) feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [picked, badIdx, heard, solved]);

  const playNpc = (speed: "fast" | "normal" | "slow" = isRescue ? "fast" : "normal", text = turn.npcLine) => {
    setNpcTalking(true);
    speak(text, { who: turn.npc, speed }).then(() => setNpcTalking(false));
  };

  useEffect(() => {
    sfx.chirp(turn.npc);
    const t = setTimeout(() => playNpc(), 450);
    return () => {
      clearTimeout(t);
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (i: number, spoken = false) => {
    if (solved) return;
    const opt = options[i];
    setPicked(i);
    if (opt.ok) {
      setSolved(true);
      setBadIdx(null);
      onSolved(tries === 0, spoken);
      if (isRescue && turn.rescue) {
        setTimeout(() => playNpc("slow", turn.rescue!.slow), 500);
      } else {
        speak(opt.en, { who: "you" });
      }
    } else {
      setTries((t) => t + 1);
      setBadIdx(i);
    }
  };

  const handleSpeech = (text: string) => {
    if (!text.trim()) return;
    let best = -1;
    let bestScore = 0;
    options.forEach((o, i) => {
      const sc = scoreSpeech(text, o.en).score;
      if (sc > bestScore) {
        bestScore = sc;
        best = i;
      }
    });
    const correctIdx = options.findIndex((o) => o.ok);
    if (best >= 0 && bestScore >= 0.6) {
      setHeard({ text, marks: scoreSpeech(text, options[best].en).marks, matched: true });
      setShowOptions(true);
      choose(best, true);
    } else {
      setTries((t) => t + 1);
      setHeard({ text, marks: scoreSpeech(text, options[correctIdx].en).marks, matched: false });
    }
  };

  const onMic = async () => {
    if (listening) return stop();
    const text = await listen();
    handleSpeech(text);
  };

  const correct = options.find((o) => o.ok)!;
  const npcMood = solved ? "happy" : npcTalking ? "talk" : "idle";
  const boMood = solved ? "happy" : listening ? "talk" : "idle";
  const hideText = isRescue && !solved;
  const showVi = mode !== "challenge";

  return (
    <div className="flex flex-col gap-0">
      <div className="mx-auto w-full" style={{ maxWidth: "min(100%, calc(50vh * 1.6))" }}>
        <Scene scene={turn.scene} npc={turn.npc} npcMood={npcMood} boMood={boMood} className="rounded-[26px] border-[3px] border-[#8B5E3C]" />
      </div>

      <div className="relative z-10 -mt-6 sm:-mt-10 mx-auto w-full max-w-3xl px-1">
        <Bubble who={turn.npc}>
          {hideText ? (
            <div className="flex flex-col gap-2">
              <p className="text-lg sm:text-xl font-extrabold leading-snug flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#C96A2B]" /> {NPCS[turn.npc].name} nói nhanh quá, không nghe kịp!
              </p>
              <p className="text-[15px] font-semibold text-[#6B4A30]">Không có chữ ở bước này. Nghe lại nếu muốn, rồi chọn câu cứu nguy phù hợp nhất.</p>
              <div>
                <button type="button" className="cci-btn !min-h-[38px] !px-3 !text-sm" onClick={() => playNpc("fast")}>
                  <Volume2 className="w-4 h-4" /> Nghe lại
                </button>
              </div>
            </div>
          ) : isRescue && turn.rescue ? (
            <div className="flex flex-col gap-2">
              <p className="text-lg sm:text-xl font-extrabold leading-snug">{turn.rescue.slow}</p>
              <SpeakButtons text={turn.rescue.slow} who={turn.npc} vi={turn.rescue.slowVi} />
              <p className="text-sm font-semibold text-[#6B4A30]">
                Lúc nãy {NPCS[turn.npc].name} nói: <em>“{turn.npcLine}”</em>
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-lg sm:text-xl font-extrabold leading-snug">{turn.npcLine}</p>
              <SpeakButtons text={turn.npcLine} who={turn.npc} vi={turn.npcVi} showVi={showVi} />
            </div>
          )}
        </Bubble>
      </div>

      <div className="mx-auto w-full max-w-5xl mt-4 cci-card-wood !rounded-[26px] p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-baloo font-extrabold text-lg sm:text-xl">{isRescue ? "Bạn sẽ nói gì?" : "Bạn trả lời thế nào?"}</span>
          {mode !== "challenge" && !isRescue && turn.hints.length > 0 && (
            <>
              <span className="text-sm font-bold text-[#6B4A30]">Từ gợi ý:</span>
              {turn.hints.map((h) => (
                <span key={h} className="cci-chip">
                  {h}
                </span>
              ))}
            </>
          )}
          {mode === "challenge" && <span className="cci-chip !bg-[#FDEEDD]">Thử thách · không gợi ý</span>}
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          <div className="flex-1 min-w-0">
            {showOptions ? (
              <div className={cx("grid gap-3", "md:grid-cols-3")}>
                {options.map((o, i) => (
                  <button
                    key={o.en}
                    type="button"
                    onClick={() => choose(i)}
                    className={cx(
                      "cci-option",
                      solved && o.ok && "is-ok anim-bounce",
                      badIdx === i && "is-bad anim-shake",
                      solved && !o.ok && "opacity-60",
                    )}
                    disabled={solved}
                  >
                    <span className="cci-letter">{LETTERS[i]}</span>
                    <span className="min-w-0">
                      <span className="block font-baloo font-extrabold text-[17px] leading-tight">{o.en}</span>
                      {showVi && (solved || mode === "choose" || badIdx === i) && <span className="block text-sm font-semibold text-[#6B4A30] mt-0.5">{o.vi}</span>}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="font-semibold text-[15px]">
                  Bấm mic và <b>nói câu trả lời của bạn</b> thành tiếng. Mình sẽ chấm từng từ.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="cci-btn !min-h-[40px] !text-sm" onClick={() => setShowOptions(true)}>
                    <Eye className="w-4 h-4" /> Hiện 3 lựa chọn
                  </button>
                  <button type="button" className="cci-btn !min-h-[40px] !text-sm" onClick={() => setTyping((t) => !t)}>
                    <Keyboard className="w-4 h-4" /> Gõ thay vì nói
                  </button>
                </div>
              </div>
            )}
            {typing && !solved && (
              <form
                className="flex gap-2 mt-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSpeech(typed);
                  setTyped("");
                }}
              >
                <input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder="Gõ câu trả lời bằng tiếng Anh..."
                  className="flex-1 min-w-0 rounded-[14px] border-[3px] border-[#8B5E3C] bg-white px-3 h-11 font-semibold outline-none focus:border-[#3F7A34]"
                  autoFocus
                />
                <button className="cci-btn cci-btn-primary" type="submit">
                  Gửi
                </button>
              </form>
            )}
          </div>
          {!solved && (
            <div className="flex md:flex-col items-center justify-center gap-3 md:pl-2">
              {supported ? (
                <MicButton listening={listening} onClick={onMic} label={mode === "speak" ? "bấm để nói" : "hoặc tự nói"} />
              ) : (
                mode === "speak" &&
                !typing && (
                  <button type="button" className="cci-btn" onClick={() => setTyping(true)}>
                    <Keyboard className="w-4 h-4" /> Gõ câu trả lời
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {mode === "speak" && !supported && (
          <p className="text-sm font-semibold text-[#A4521D]">Trình duyệt này chưa hỗ trợ nhận giọng nói. Hãy dùng Chrome hoặc Safari, hoặc gõ câu trả lời.</p>
        )}
        {listening && interim && <p className="font-semibold text-[#6B4A30]">“{interim}”</p>}
        {error && <p className="text-sm font-bold text-[#A4521D]">{error}</p>}

        {heard && (
          <div className="flex flex-col gap-2 anim-pop">
            <div className="text-sm font-bold text-[#6B4A30]">
              Mình nghe được: <span className="text-[#4A3222]">“{heard.text}”</span>
            </div>
            {heard.marks && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#6B4A30]">
                  {heard.matched ? "Chấm từng từ" : "Câu gợi ý — từ xanh là bạn đã nói được"}
                </span>
                <WordMarks marks={heard.marks} />
              </div>
            )}
            {!heard.matched && <p className="text-sm font-semibold">Chưa khớp lựa chọn nào. Thử nói lại chậm và rõ hơn nhé — không bị trừ điểm đâu!</p>}
          </div>
        )}

        {picked !== null && (
          <Feedback ok={options[picked].ok} title={options[picked].ok ? (tries === 0 ? "Chuẩn rồi!" : "Đúng rồi!") : undefined}>
            {options[picked].why}
            {!options[picked].ok && mode !== "challenge" && tries >= 2 && (
              <span className="block mt-1">
                Gợi ý: <b>{correct.en}</b>
              </span>
            )}
          </Feedback>
        )}

        {solved && isRescue && (
          <div className="rounded-[18px] p-4 flex flex-col gap-2" style={{ background: "#FFF4E2", border: "2px dashed #D8BF92" }}>
            <div className="font-baloo font-extrabold text-lg flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-[#C96A2B]" /> Túi câu cứu nguy
            </div>
            <ul className="grid sm:grid-cols-2 gap-2">
              {RESCUE_BAG.map((r) => (
                <li key={r.en}>
                  <button type="button" onClick={() => speak(r.en.replace("...", ""), { who: "bo" })} className="w-full text-left flex items-start gap-2 rounded-xl px-3 py-2 bg-white border-2 border-[#EAD9B8] hover:border-[#8B5E3C]">
                    <Volume2 className="w-4 h-4 mt-0.5 shrink-0 text-[#3F7A34]" />
                    <span>
                      <span className="block font-bold">{r.en}</span>
                      <span className="block text-sm text-[#6B4A30] font-semibold">{r.vi}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {solved && (
          <div className="flex justify-end">
            <button type="button" className="cci-btn cci-btn-primary cci-btn-big" onClick={onNext} autoFocus>
              {last ? "Hoàn thành" : "Tiếp tục"} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
        <div ref={feedbackRef} aria-hidden className="h-0" />
      </div>
    </div>
  );
}
