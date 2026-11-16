"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import { NPCS, type BuilderItem, type Chapter, type Line, type NpcId, type Word } from "@/lib/island/curriculum";
import { normWords, speak, stopSpeaking } from "@/lib/island/speech";
import { sfx } from "@/lib/island/sfx";
import { Avatar, Character } from "./character";
import { Feedback, cx, shuffle } from "./ui";

function NextBar({ onNext, label = "Tiếp tục", disabled }: { onNext: () => void; label?: string; disabled?: boolean }) {
  return (
    <div className="flex justify-end pt-2">
      <button type="button" className="cci-btn cci-btn-primary cci-btn-big" onClick={onNext} disabled={disabled}>
        {label} <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function StepHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">{title}</h2>
      <p className="font-semibold text-[#6B4A30] mt-1">{desc}</p>
    </div>
  );
}

// ───────────── 1. Từ mới ─────────────

export function WordsStep({ chapter, onNext }: { chapter: Chapter; onNext: () => void }) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  return (
    <div className="flex flex-col gap-5">
      <StepHead title="Từ mới" desc={`${chapter.words.length} từ / cụm từ. Bấm vào thẻ để xem nghĩa và câu ví dụ, bấm loa để nghe.`} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {chapter.words.map((w, i) => {
          const isOpen = open.has(i);
          return (
            <div
              key={w.en}
              role="button"
              tabIndex={0}
              onClick={() => {
                setOpen((s) => new Set(s).add(i));
                speak(w.en, { who: chapter.npc });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpen((s) => new Set(s).add(i));
                  speak(w.en, { who: chapter.npc });
                }
              }}
              className={cx("cci-card p-4 text-left cursor-pointer flex flex-col gap-2 min-h-[150px] transition-colors", isOpen && "!bg-[#FFFDF7]")}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-baloo font-extrabold text-2xl leading-tight">{w.en}</span>
                <button
                  type="button"
                  aria-label={`Nghe ${w.en}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    speak(w.en, { who: chapter.npc, speed: "slow" });
                  }}
                  className="w-9 h-9 shrink-0 rounded-xl border-2 border-[#8B5E3C] bg-[#FBF0D9] flex items-center justify-center"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              {isOpen ? (
                <div className="anim-flip flex flex-col gap-1">
                  <span className="font-extrabold text-[#3F7A34]">{w.vi}</span>
                  <span
                    className="text-[15px] font-semibold text-[#6B4A30] underline decoration-dotted underline-offset-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      speak(w.ex, { who: chapter.npc });
                    }}
                  >
                    “{w.ex}”
                  </span>
                </div>
              ) : (
                <span className="text-sm font-bold text-[#B39B7A] mt-auto">Chạm để lật thẻ</span>
              )}
            </div>
          );
        })}
      </div>
      <NextBar onNext={onNext} label={open.size < chapter.words.length ? `Đã xem ${open.size}/${chapter.words.length} · Tiếp tục` : "Tiếp tục"} />
    </div>
  );
}

// ───────────── 2. Nghe hội thoại mẫu ─────────────

export function DialogueStep({ chapter, onNext }: { chapter: Chapter; onNext: () => void }) {
  const [shown, setShown] = useState(1);
  const [showVi, setShowVi] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const cancel = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);

  const playAll = async () => {
    if (playing) {
      cancel.current = true;
      stopSpeaking();
      setPlaying(false);
      setActive(null);
      return;
    }
    cancel.current = false;
    setPlaying(true);
    for (let i = 0; i < chapter.dialogue.length; i++) {
      if (cancel.current) break;
      setShown((s) => Math.max(s, i + 1));
      setActive(i);
      const l = chapter.dialogue[i];
      await speak(l.en, { who: l.who === "you" ? "bo" : l.who });
      await new Promise((r) => setTimeout(r, 250));
    }
    setPlaying(false);
    setActive(null);
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [shown]);

  useEffect(() => () => stopSpeaking(), []);

  const allShown = shown >= chapter.dialogue.length;

  return (
    <div className="flex flex-col gap-5">
      <StepHead title="Nghe hội thoại mẫu" desc={`Bơ nói chuyện với ${NPCS[chapter.npc].name}. Nghe cả bài, rồi bấm từng câu để nghe lại và nhại theo.`} />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="cci-btn cci-btn-primary" onClick={playAll}>
          {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />} {playing ? "Dừng" : "Phát cả bài"}
        </button>
        <button type="button" className="cci-btn" onClick={() => setShowVi((v) => !v)} aria-pressed={showVi}>
          {showVi ? "Ẩn tiếng Việt" : "Hiện tiếng Việt"}
        </button>
      </div>
      <div className="cci-card p-4 sm:p-5 flex flex-col gap-3 max-h-[55vh] overflow-y-auto">
        {chapter.dialogue.slice(0, shown).map((l, i) => (
          <DialogueLine key={i} line={l} active={active === i} showVi={showVi} />
        ))}
        <div ref={endRef} />
      </div>
      {!allShown && !playing && (
        <button type="button" className="cci-btn self-start" onClick={() => setShown((s) => s + 1)}>
          Câu tiếp theo <ArrowRight className="w-4 h-4" />
        </button>
      )}
      <NextBar onNext={onNext} disabled={!allShown} label={allShown ? "Tiếp tục" : "Nghe hết hội thoại để tiếp tục"} />
    </div>
  );
}

function DialogueLine({ line, active, showVi }: { line: Line; active: boolean; showVi: boolean }) {
  const isYou = line.who === "you";
  const who: NpcId = line.who === "you" ? "bo" : line.who;
  return (
    <div className={cx("flex gap-3 items-end anim-pop", isYou && "flex-row-reverse")}>
      <Avatar who={who} size={44} />
      <button
        type="button"
        onClick={() => speak(line.en, { who })}
        className={cx("text-left max-w-[80%] rounded-[18px] px-4 py-2.5 border-[3px] transition-transform", active && "scale-[1.02]")}
        style={{
          background: isYou ? "#EAF3DC" : "#FFFFFF",
          borderColor: active ? "#F2C14E" : isYou ? "#6FAE4F" : "#8B5E3C",
          borderBottomRightRadius: isYou ? 4 : 18,
          borderBottomLeftRadius: isYou ? 18 : 4,
        }}
      >
        <span className="block text-xs font-extrabold text-[#6B4A30]">{isYou ? "Bơ (bạn)" : NPCS[line.who as keyof typeof NPCS].name}</span>
        <span className="block font-bold text-[17px] leading-snug">{line.en}</span>
        {showVi && <span className="block text-sm font-semibold text-[#6B4A30] mt-0.5">{line.vi}</span>}
      </button>
    </div>
  );
}

// ───────────── 3a. Ghép đôi ─────────────

export function MatchGame({ words, onDone }: { words: Word[]; onDone: (mistakes: number) => void }) {
  const left = useMemo(() => shuffle(words.map((w) => w.en)), [words]);
  const right = useMemo(() => shuffle(words.map((w) => w.vi)), [words]);
  const [sel, setSel] = useState<{ side: "l" | "r"; v: string } | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const enOf = (vi: string) => words.find((w) => w.vi === vi)!.en;

  const pick = (side: "l" | "r", v: string) => {
    const en = side === "l" ? v : enOf(v);
    if (matched.has(en)) return;
    if (side === "l") speak(v);
    if (!sel || sel.side === side) {
      setSel({ side, v });
      return;
    }
    const a = side === "l" ? v : sel.v;
    const b = side === "r" ? v : sel.v;
    if (enOf(b) === a) {
      sfx.correct();
      setMatched((m) => new Set(m).add(a));
      setSel(null);
    } else {
      sfx.wrong();
      setMistakes((n) => n + 1);
      setWrong(v);
      setTimeout(() => setWrong(null), 450);
      setSel(null);
    }
  };

  const done = matched.size === words.length;
  const card = (side: "l" | "r", v: string) => {
    const en = side === "l" ? v : enOf(v);
    const isMatched = matched.has(en);
    const isSel = sel?.side === side && sel.v === v;
    return (
      <button
        key={v}
        type="button"
        onClick={() => pick(side, v)}
        disabled={isMatched}
        className={cx("cci-option !justify-center !text-center min-h-[58px]", isMatched && "is-ok", wrong === v && "is-bad anim-shake")}
        style={isSel ? { borderColor: "#F2C14E", background: "#FFF6DA", boxShadow: "0 4px 0 #D9A92F" } : undefined}
      >
        <span className={cx(side === "l" ? "font-baloo font-extrabold text-[17px]" : "font-bold text-[15px]", "leading-tight")}>{v}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-[#6B4A30]">Chọn một thẻ tiếng Anh rồi chọn nghĩa tiếng Việt tương ứng.</p>
        <span className="cci-chip">
          {matched.size}/{words.length} cặp
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="flex flex-col gap-3">{left.map((v) => card("l", v))}</div>
        <div className="flex flex-col gap-3">{right.map((v) => card("r", v))}</div>
      </div>
      {done && (
        <Feedback ok title="Ghép xong cả bộ!">
          {mistakes === 0 ? "Không sai lần nào. Trí nhớ siêu ghê!" : `Bạn ghép nhầm ${mistakes} lần — không sao, nhầm là cách não ghi nhớ.`}
        </Feedback>
      )}
      <NextBar onNext={() => onDone(mistakes)} disabled={!done} />
    </div>
  );
}

// ───────────── 3b. Xếp câu ─────────────

function tokens(sentence: string): string[] {
  return sentence.split(/\s+/).filter(Boolean);
}

export function BuilderGame({ items, onDone }: { items: BuilderItem[]; onDone: (mistakes: number) => void }) {
  const [i, setI] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  return (
    <BuilderRound
      key={i}
      item={items[i]}
      index={i}
      total={items.length}
      onWrong={() => setMistakes((m) => m + 1)}
      onNext={() => (i + 1 >= items.length ? onDone(mistakes) : setI(i + 1))}
    />
  );
}

function BuilderRound({ item, index, total, onWrong, onNext }: { item: BuilderItem; index: number; total: number; onWrong: () => void; onNext: () => void }) {
  const answer = useMemo(() => tokens(item.en), [item]);
  const pool = useMemo(() => shuffle([...answer.map((w, k) => ({ id: `a${k}`, w })), ...item.decoys.map((w, k) => ({ id: `d${k}`, w }))]), [item, answer]);
  const [placed, setPlaced] = useState<string[]>([]);
  const [state, setState] = useState<"idle" | "ok" | "bad">("idle");
  const [msg, setMsg] = useState("");

  const strip = (s: string) => normWords(s).join(" ");
  const check = () => {
    const built = placed.map((id) => pool.find((t) => t.id === id)!.w).join(" ");
    if (strip(built) === strip(item.en)) {
      setState("ok");
      speak(item.en, { who: "bo" });
      return;
    }
    onWrong();
    setState("bad");
    const usedDecoy = placed.map((id) => pool.find((t) => t.id === id)!).find((t) => t.id.startsWith("d"));
    if (usedDecoy) setMsg(`Thẻ “${usedDecoy.w}” là thẻ bẫy — câu đúng không cần thẻ này.`);
    else if (placed.length < answer.length) setMsg("Câu còn thiếu thẻ. Đọc lại nghĩa tiếng Việt nhé.");
    else setMsg("Đủ thẻ rồi nhưng thứ tự chưa đúng. Nhớ: chủ ngữ → động từ → phần còn lại.");
    setTimeout(() => setState((st) => (st === "bad" ? "idle" : st)), 500);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-[#6B4A30]">
          Xếp thẻ thành câu có nghĩa: <b className="text-[#4A3222]">“{item.vi}”</b>
        </p>
        <span className="cci-chip shrink-0">
          Câu {index + 1}/{total}
        </span>
      </div>
      <div
        className={cx("min-h-[78px] rounded-[20px] p-3 flex flex-wrap gap-2 items-center", state === "bad" && "anim-shake", state === "ok" && "anim-bounce")}
        style={{ background: state === "ok" ? "#EAF3DC" : "#FFFFFF", border: `3px dashed ${state === "ok" ? "#3F7A34" : "#D8BF92"}` }}
      >
        {placed.length === 0 && <span className="text-[#B39B7A] font-bold px-2">Chạm vào thẻ bên dưới để xếp vào đây</span>}
        {placed.map((id) => {
          const t = pool.find((x) => x.id === id)!;
          return (
            <button key={id} type="button" className="cci-tile anim-pop" disabled={state === "ok"} onClick={() => setPlaced((p) => p.filter((x) => x !== id))}>
              {t.w}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2.5 justify-center py-1">
        {pool.map((t) => {
          const used = placed.includes(t.id);
          return (
            <button key={t.id} type="button" className={cx("cci-tile", used && "opacity-25 pointer-events-none")} onClick={() => setPlaced((p) => [...p, t.id])} disabled={state === "ok"}>
              {t.w}
            </button>
          );
        })}
      </div>
      {state === "ok" ? (
        <Feedback ok title="Câu chuẩn!">
          {item.en} — nghe lại và đọc to theo một lần nhé.
        </Feedback>
      ) : (
        msg && (
          <Feedback ok={false} title="Chưa đúng, không sao!">
            {msg}
          </Feedback>
        )
      )}
      <div className="flex justify-between gap-2 pt-2">
        <button type="button" className="cci-btn" onClick={() => (setPlaced([]), setMsg(""))} disabled={state === "ok"}>
          <RotateCcw className="w-4 h-4" /> Làm lại
        </button>
        {state === "ok" ? (
          <button type="button" className="cci-btn cci-btn-primary cci-btn-big" onClick={onNext}>
            Tiếp tục <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button type="button" className="cci-btn cci-btn-primary cci-btn-big" onClick={check} disabled={placed.length === 0}>
            <Check className="w-5 h-5" /> Kiểm tra
          </button>
        )}
      </div>
    </div>
  );
}

// ───────────── 6. Ôn nhanh ─────────────

export function QuickReview({ chapter, onDone }: { chapter: Chapter; onDone: (correctFirst: number, total: number) => void }) {
  const qs = useMemo(() => {
    const picked = shuffle(chapter.words).slice(0, 4);
    return picked.map((w) => ({ w, options: shuffle([w, ...shuffle(chapter.words.filter((x) => x.en !== w.en)).slice(0, 2)]) }));
  }, [chapter]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [firstOk, setFirstOk] = useState(0);
  const [tried, setTried] = useState(false);
  const q = qs[i];
  const solved = picked === q.w.en;

  const choose = (en: string) => {
    if (solved) return;
    setPicked(en);
    if (en === q.w.en) {
      speak(en);
      if (!tried) setFirstOk((n) => n + 1);
    } else {
      setTried(true);
    }
  };

  const next = () => {
    if (i + 1 >= qs.length) onDone(firstOk, qs.length);
    else {
      setI(i + 1);
      setPicked(null);
      setTried(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <StepHead title="Ôn nhanh" desc="4 câu siêu ngắn để khoá từ mới vào trí nhớ. Các từ này sẽ được thêm vào Sổ từ để ôn đúng lúc sắp quên." />
      <div className="cci-card p-5 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <span className="cci-chip">
            Câu {i + 1}/{qs.length}
          </span>
          <span className="text-sm font-bold text-[#6B4A30]">Chọn từ tiếng Anh đúng</span>
        </div>
        <p className="font-baloo font-extrabold text-2xl sm:text-3xl">“{q.w.vi}”</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {q.options.map((o, k) => (
            <button
              key={o.en}
              type="button"
              onClick={() => choose(o.en)}
              className={cx("cci-option", picked === o.en && (o.en === q.w.en ? "is-ok anim-bounce" : "is-bad anim-shake"))}
            >
              <span className="cci-letter">{"ABC"[k]}</span>
              <span className="font-baloo font-extrabold text-[17px]">{o.en}</span>
            </button>
          ))}
        </div>
        {solved && (
          <Feedback ok title="Đúng rồi!">
            “{q.w.ex}”
          </Feedback>
        )}
        {picked && !solved && (
          <Feedback ok={false} title="Chưa đúng">
            “{picked}” nghĩa là “{chapter.words.find((w) => w.en === picked)?.vi}”. Chọn lại nhé!
          </Feedback>
        )}
      </div>
      <NextBar onNext={next} disabled={!solved} label={i + 1 >= qs.length ? "Hoàn thành bài học" : "Tiếp tục"} />
    </div>
  );
}

// ───────────── Chỉ nghe: Ai nói gì? ─────────────

export function ListenOnly({ chapter, onDone }: { chapter: Chapter; onDone: (correctFirst: number, total: number) => void }) {
  const lines = useMemo(() => chapter.dialogue.slice(0, 6), [chapter]);
  const qs = useMemo(
    () =>
      lines.map((l) => ({
        line: l,
        options: shuffle([l.vi, ...shuffle(chapter.dialogue.filter((x) => x.en !== l.en).map((x) => x.vi)).slice(0, 2)]),
      })),
    [lines, chapter],
  );
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const [firstOk, setFirstOk] = useState(0);
  const [talking, setTalking] = useState(false);
  const q = qs[i];
  const who = q.line.who === "you" ? "bo" : q.line.who;
  const solved = picked === q.line.vi;

  const play = (speed: "normal" | "slow" = "normal") => {
    setTalking(true);
    speak(q.line.en, { who, speed }).then(() => setTalking(false));
  };

  useEffect(() => {
    const t = setTimeout(() => play(), 400);
    return () => {
      clearTimeout(t);
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  const choose = (vi: string) => {
    if (solved) return;
    setPicked(vi);
    if (vi === q.line.vi) {
      sfx.correct();
      if (!tried) setFirstOk((n) => n + 1);
    } else {
      setTried(true);
    }
  };

  const next = () => {
    if (i + 1 >= qs.length) onDone(firstOk, qs.length);
    else {
      setI(i + 1);
      setPicked(null);
      setTried(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <StepHead title="Chỉ nghe: Ai nói gì?" desc="Không có chữ cho tới khi bạn trả lời. Nghe kỹ rồi chọn nghĩa đúng." />
      <div className="cci-card p-5 flex flex-col sm:flex-row gap-5 items-center">
        <div className="w-32 sm:w-40 shrink-0 rounded-[20px] flex items-end justify-center pt-3" style={{ background: NPCS[who].bg }}>
          <Character who={who} mood={talking ? "talk" : solved ? "happy" : "idle"} size="100%" />
        </div>
        <div className="flex flex-col gap-3 flex-1 w-full">
          <div className="flex items-center justify-between">
            <span className="cci-chip">
              Câu {i + 1}/{qs.length} · {who === "bo" ? "Bơ" : NPCS[who].name} nói
            </span>
          </div>
          <div className="flex gap-2">
            <button type="button" className="cci-btn cci-btn-primary" onClick={() => play()}>
              <Volume2 className="w-5 h-5" /> Nghe
            </button>
            <button type="button" className="cci-btn" onClick={() => play("slow")}>
              Nghe chậm
            </button>
          </div>
          <div className="rounded-[16px] px-4 py-3 min-h-[56px] flex items-center" style={{ background: "#FFFDF7", border: "2px dashed #D8BF92" }}>
            {picked ? <span className="font-bold text-lg anim-pop">“{q.line.en}”</span> : <span className="text-[#B39B7A] font-bold">Lời thoại bị ẩn · trả lời để xem</span>}
          </div>
        </div>
      </div>
      <div className="grid gap-3">
        {q.options.map((vi, k) => (
          <button key={vi} type="button" onClick={() => choose(vi)} className={cx("cci-option", picked === vi && (vi === q.line.vi ? "is-ok anim-bounce" : "is-bad anim-shake"))}>
            <span className="cci-letter">{"ABC"[k]}</span>
            <span className="font-bold text-[16px]">{vi}</span>
          </button>
        ))}
      </div>
      {picked && !solved && <Feedback ok={false}>Nghe lại một lần nữa (thử “Nghe chậm”) rồi chọn lại nhé.</Feedback>}
      <NextBar onNext={next} disabled={!solved} label={i + 1 >= qs.length ? "Hoàn thành" : "Câu tiếp theo"} />
    </div>
  );
}
