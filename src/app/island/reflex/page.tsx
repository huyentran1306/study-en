"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Flame, Hand, Lightbulb, Mic, RotateCcw, Shuffle, Sparkles, Timer, TrendingDown, Volume2, X, Zap } from "lucide-react";
import { Avatar, Character } from "@/components/island/character";
import { BackLink, Feedback, Stars, WordMarks, cx, shuffle } from "@/components/island/ui";
import { CHAPTERS, NPCS, type Level, type NpcId } from "@/lib/island/curriculum";
import { FILLERS, FILLER_KEYS, FILLER_QS, REFLEX, SWAPS } from "@/lib/island/drills";
import { currentChapterId, isUnlocked, logReflex, recentReflexSec, useIsland, type ReflexMode } from "@/lib/island/progress";
import { ensureMic, normWords, scoreSpeech, speak, stopSpeaking, useListen } from "@/lib/island/speech";
import { sfx } from "@/lib/island/sfx";
import { useGame } from "@/contexts/game-context";
import { NextStep } from "@/components/island/journey";

type Speed = "slow" | "normal" | "fast";
const SPEEDS: { id: Speed; name: string; icon: string; quick: number; swap: number; filler: number }[] = [
  { id: "slow", name: "Thong thả", icon: "🐢", quick: 8, swap: 10, filler: 6 },
  { id: "normal", name: "Vừa", icon: "🐇", quick: 5, swap: 7, filler: 4 },
  { id: "fast", name: "Siêu tốc", icon: "⚡", quick: 3, swap: 5, filler: 3 },
];

const MODES: { id: ReflexMode; title: string; desc: string; icon: React.ElementType; bg: string }[] = [
  { id: "quick", title: "Hỏi nhanh – đáp nhanh", desc: "Cư dân hỏi, bạn đáp ngay. Không có gợi ý, AI chấm theo ý chứ không bắt khớp từng chữ.", icon: Zap, bg: "#FFF1C7" },
  { id: "swap", title: "Thay từ liên tục", desc: "Giữ khung câu, thay từ thật nhanh — để câu khung thành phản xạ tự động.", icon: Shuffle, bg: "#EAF3DC" },
  { id: "filler", title: "Đừng đứng hình", desc: "Câu hỏi khó! Mở miệng trong vài giây bằng câu câu giờ rồi trả lời.", icon: Timer, bg: "#FADDE3" },
];

interface Item {
  mode: ReflexMode;
  ch: number;
  who: NpcId;
  prompt: string;
  promptVi: string;
  speakPrompt: boolean;
  samples: string[];
  kw: string[];
  options: string[];
  correct: number;
  swap?: { frame: string; fill: string; cueVi: string };
}

interface Res {
  ok: boolean;
  ms: number | null;
  said: string;
  timeout?: boolean;
  better?: string;
  note?: string;
  marks?: { word: string; ok: boolean }[];
  filler?: string | null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function lower(s: string) {
  return " " + s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9' ]/g, " ").replace(/\s+/g, " ") + " ";
}

function hasKw(said: string, kw: string[]) {
  const t = lower(said);
  return kw.some((k) => {
    const kk = k.toLowerCase().trim();
    return /^[a-z']+$/.test(kk) ? t.includes(` ${kk} `) : t.includes(kk);
  });
}

function buildItems(mode: ReflexMode, ch: number): Item[] {
  const chapter = CHAPTERS.find((c) => c.id === ch)!;
  const older = CHAPTERS.filter((c) => c.id < ch);
  if (mode === "quick") {
    const own = shuffle(REFLEX[ch] || []).map((q) => ({ q, ch }));
    const review = shuffle(older.flatMap((c) => (REFLEX[c.id] || []).map((q) => ({ q, ch: c.id }))));
    const picked = [...own.slice(0, older.length ? 5 : 8), ...review.slice(0, 3)].slice(0, 8);
    while (picked.length < 8 && own.length > picked.length) picked.push(own[picked.length]);
    return shuffle(picked).map(({ q, ch: src }) => {
      const pool = (REFLEX[src] || []).filter((x) => x !== q).map((x) => x.a[0]);
      const distract = shuffle(pool).slice(0, 2);
      const options = shuffle([q.a[0], ...distract]);
      return {
        mode, ch: src, who: CHAPTERS.find((c) => c.id === src)!.npc, prompt: q.q, promptVi: q.vi, speakPrompt: true,
        samples: q.a, kw: q.kw, options, correct: options.indexOf(q.a[0]),
      };
    });
  }
  if (mode === "swap") {
    const own = (SWAPS[ch] || []).flatMap((f) => f.cues.map((c) => ({ f, c, ch })));
    const review = older.flatMap((o) => (SWAPS[o.id] || []).flatMap((f) => f.cues.map((c) => ({ f, c, ch: o.id }))));
    const picked = [...shuffle(own).slice(0, review.length ? 6 : 8), ...shuffle(review).slice(0, 2)];
    return shuffle(picked).map(({ f, c, ch: src }) => {
      const target = f.frame.replace("___", c.fill);
      const others = shuffle(f.cues.filter((x) => x !== c)).slice(0, 2).map((x) => f.frame.replace("___", x.fill));
      const options = shuffle([target, ...others]);
      return {
        mode, ch: src, who: "kero" as NpcId, prompt: f.frame, promptVi: f.frameVi, speakPrompt: false,
        samples: [target], kw: [], options, correct: options.indexOf(target), swap: { frame: f.frame, fill: c.fill, cueVi: c.vi },
      };
    });
  }
  const level: Level = chapter.level;
  const npcs: NpcId[] = ["miso", "mallow", "pip", "kero"];
  return shuffle(FILLER_QS[level]).slice(0, 5).map((q, i) => {
    const f = FILLERS[Math.floor(Math.random() * FILLERS.length)];
    const good = `${f.en.replace(/\.\.\.$|, \.\.\.$/, "")}... I think...`;
    const options = shuffle([good, "I don't know.", "No."]);
    return {
      mode, ch, who: npcs[i % npcs.length], prompt: q.q, promptVi: q.vi, speakPrompt: true,
      samples: [good], kw: FILLER_KEYS, options, correct: options.indexOf(good),
    };
  });
}

async function aiJudge(item: Item, said: string, level: string): Promise<{ ok: boolean; better: string; note: string } | null> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 4500);
  try {
    const res = await fetch("/api/island-reflex", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: item.prompt, answer: said, samples: item.samples, level }),
      signal: ctl.signal,
    });
    const j = (await res.json()) as { ok?: boolean; better?: string; note?: string; ai?: boolean };
    if (!j.ai || typeof j.ok !== "boolean") return null;
    return { ok: j.ok, better: j.better || "", note: j.note || "" };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function Inner() {
  const s = useIsland();
  const router = useRouter();
  const sp = useSearchParams();
  const { addXP } = useGame();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const chParam = Number(sp.get("ch"));
  const chId = chParam && CHAPTERS.some((c) => c.id === chParam) && isUnlocked(s, chParam) ? chParam : currentChapterId(s);
  const chapter = CHAPTERS.find((c) => c.id === chId)!;

  const { supported, interim, error, listen, abort } = useListen();
  const [mode, setMode] = useState<ReflexMode>("quick");
  const [speed, setSpeed] = useState<Speed>("slow");
  const [useVoice, setUseVoice] = useState(true);
  const [screen, setScreen] = useState<"menu" | "play" | "done">("menu");
  const [items, setItems] = useState<Item[]>([]);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"npc" | "go" | "judge" | "result">("npc");
  const [left, setLeft] = useState(0);
  const [voiced, setVoiced] = useState(false);
  const [results, setResults] = useState<Res[]>([]);
  const [combo, setCombo] = useState(0);
  const [summary, setSummary] = useState<{ ok: number; n: number; avg: number; xp: number; stars: number; prev: number | null } | null>(null);

  const tokenRef = useRef(0);
  const t0Ref = useRef(0);
  const voiceAtRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTickRef = useRef(99);
  const doneRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem("cci-reflex-speed") as Speed | null;
    if (saved && SPEEDS.some((x) => x.id === saved)) setSpeed(saved);
    else setSpeed(chapter.level === "A1" ? "slow" : "normal");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (mounted && !supported) setUseVoice(false);
  }, [mounted, supported]);

  const voice = useVoice && supported;
  const limit = SPEEDS.find((x) => x.id === speed)![mode];

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (nextRef.current) clearTimeout(nextRef.current);
    timerRef.current = null;
    nextRef.current = null;
  }, []);

  useEffect(
    () => () => {
      tokenRef.current++;
      clearTimers();
      stopSpeaking();
    },
    [clearTimers],
  );

  // ───── Một câu ─────
  const finishItem = useCallback(
    async (token: number, item: Item, said: string, opts: { timeout?: boolean; tapIdx?: number } = {}) => {
      if (token !== tokenRef.current || doneRef.current) return;
      doneRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      const ms = opts.timeout ? null : voiceAtRef.current !== null ? Math.max(0, voiceAtRef.current - t0Ref.current) : null;
      let res: Res;
      if (opts.timeout) {
        sfx.timeUp();
        res = { ok: false, ms: null, said: "", timeout: true };
      } else if (opts.tapIdx !== undefined) {
        res = { ok: opts.tapIdx === item.correct, ms, said: item.options[opts.tapIdx] };
      } else if (!said.trim()) {
        res = { ok: false, ms, said: "", note: "Mình chưa nghe rõ — nói to, rõ và gần micro hơn nhé." };
      } else if (item.mode === "swap") {
        const sc = scoreSpeech(said, item.samples[0]);
        res = { ok: sc.score >= 0.75, ms, said, marks: sc.marks };
      } else if (item.mode === "filler") {
        const words = normWords(said).length;
        const used = FILLER_KEYS.find((k) => lower(said).includes(k)) || null;
        res = { ok: !!used && words >= 4, ms, said, filler: used, note: !used ? "Thử mở đầu bằng “Hmm, let me think...” hoặc “Well, ...” nhé." : words < 4 ? "Câu giờ tốt! Giờ nói thêm một ý trả lời nữa nhé." : "" };
      } else {
        setPhase("judge");
        const local = hasKw(said, item.kw) || item.samples.some((x) => scoreSpeech(said, x).score >= 0.6);
        const ai = await aiJudge(item, said, chapter.level);
        if (token !== tokenRef.current) return;
        res = { ok: ai ? ai.ok : local, ms, said, better: ai?.better, note: ai?.note };
      }
      setResults((r) => [...r, res]);
      setPhase("result");
      if (res.ok) {
        setCombo((c) => {
          const n = c + 1;
          if (n >= 2) sfx.combo(n);
          else sfx.correct();
          return n;
        });
      } else {
        setCombo(0);
        if (!res.timeout) sfx.wrong();
      }
      if (item.mode === "swap" || !res.ok) speak(item.samples[0], { who: "you" });
    },
    [chapter.level],
  );

  const startItem = useCallback(
    async (list: Item[], i: number, forceTap = false) => {
      const useMic = voice && !forceTap;
      const token = ++tokenRef.current;
      clearTimers();
      abort();
      doneRef.current = false;
      voiceAtRef.current = null;
      lastTickRef.current = 99;
      setVoiced(false);
      setIdx(i);
      setPhase("npc");
      const item = list[i];
      if (item.speakPrompt) {
        sfx.chirp(item.who);
        await sleep(380);
        if (token !== tokenRef.current) return;
        await speak(item.prompt, { who: item.who });
      } else {
        sfx.flip();
        await sleep(450);
      }
      if (token !== tokenRef.current) return;
      // Bắt đầu đếm ngược
      t0Ref.current = performance.now();
      setLeft(limit);
      setPhase("go");
      timerRef.current = setInterval(() => {
        const remain = limit - (performance.now() - t0Ref.current) / 1000;
        setLeft(Math.max(0, remain));
        if (voiceAtRef.current !== null) return;
        const whole = Math.ceil(remain);
        if (whole < lastTickRef.current && remain > 0) {
          lastTickRef.current = whole;
          sfx.tick(whole <= 3);
        }
        if (remain <= 0) {
          abort();
          finishItem(token, item, "", { timeout: true });
        }
      }, 100);
      if (useMic) {
        sfx.micOn();
        // Nhận diện giọng nói có thể tự dừng khi im lặng → nghe lại cho tới khi hết giờ.
        // Nếu micro hỏng / bị chặn (dừng ngay lập tức nhiều lần) → chuyển sang bấm chọn.
        let quickFails = 0;
        let audioOk = false;
        const watchdog = setTimeout(() => {
          // Micro không chạy (trình duyệt treo) → chuyển sang bấm chọn cho câu này và các câu sau.
          if (!audioOk && token === tokenRef.current && !doneRef.current) {
            abort();
            setUseVoice(false);
          }
        }, 2500);
        while (token === tokenRef.current && !doneRef.current) {
          const started = performance.now();
          const text = await listen({
            onAudio: () => {
              audioOk = true;
              clearTimeout(watchdog);
            },
            onVoice: (t) => {
              if (voiceAtRef.current === null && token === tokenRef.current) {
                voiceAtRef.current = t;
                setVoiced(true);
              }
            },
          });
          if (token !== tokenRef.current || doneRef.current) return;
          if (text.trim() || voiceAtRef.current !== null) {
            finishItem(token, item, text);
            return;
          }
          if ((performance.now() - t0Ref.current) / 1000 >= limit) return;
          if (performance.now() - started < 600 && ++quickFails >= 2) {
            setUseVoice(false);
            return;
          }
        }
      }
    },
    [abort, clearTimers, finishItem, limit, listen, voice],
  );

  const [micMsg, setMicMsg] = useState<string | null>(null);
  const begin = async () => {
    const micOk = voice ? await ensureMic() : false;
    if (voice && !micOk) {
      setUseVoice(false);
      setMicMsg("Không dùng được micro (chưa cho phép hoặc máy không có micro) — chuyển sang chế độ bấm chọn.");
    }
    const list = buildItems(mode, chId);
    setItems(list);
    setResults([]);
    setCombo(0);
    setSummary(null);
    setScreen("play");
    sfx.whoosh();
    startItem(list, 0, !micOk);
  };

  const finishRound = useCallback(() => {
    tokenRef.current++;
    clearTimers();
    abort();
    const n = results.length;
    const ok = results.filter((r) => r.ok).length;
    const times = results.map((r) => r.ms).filter((x): x is number => x !== null && x > 0);
    const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    const ratio = n ? ok / n : 0;
    const stars = ratio >= 0.85 ? 3 : ratio >= 0.6 ? 2 : ratio > 0 ? 1 : 0;
    const prev = recentReflexSec(s);
    const xp = ok * 3 + (ratio >= 0.6 ? 10 : 0) + (avg > 0 && avg < 2500 ? 5 : 0);
    logReflex({ ch: chId, mode, n, ok, avgMs: Math.round(avg), voice }, xp, ratio >= 0.6 ? chId : undefined);
    addXP(xp);
    setSummary({ ok, n, avg, xp, stars, prev });
    setScreen("done");
    if (stars >= 2) import("@/lib/confetti").then((m) => m.fireCelebration()).catch(() => {});
  }, [abort, addXP, chId, clearTimers, mode, results, s, voice]);

  const next = useCallback(() => {
    if (nextRef.current) clearTimeout(nextRef.current);
    nextRef.current = null;
    stopSpeaking();
    if (idx + 1 >= items.length) finishRound();
    else startItem(items, idx + 1);
  }, [finishRound, idx, items, startItem]);

  // Đúng thì tự sang câu tiếp cho nhịp nhanh; sai thì dừng lại để xem câu mẫu.
  const nextFn = useRef(next);
  nextFn.current = next;
  const lastOk = results[results.length - 1]?.ok;
  const curMode = items[idx]?.mode;
  useEffect(() => {
    if (screen !== "play" || phase !== "result" || !lastOk || curMode === "swap") return;
    const t = setTimeout(() => nextFn.current(), 1700);
    return () => clearTimeout(t);
  }, [phase, screen, lastOk, curMode, results.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (screen === "play" && phase === "result" && e.key === "Enter") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, phase, screen]);

  const quit = () => {
    tokenRef.current++;
    clearTimers();
    abort();
    stopSpeaking();
    setScreen("menu");
  };

  const unlocked = CHAPTERS.filter((c) => isUnlocked(s, c.id));
  const runs = useMemo(() => s.reflex.filter((r) => r.voice && r.avgMs > 0 && r.mode !== "swap").slice(-12), [s.reflex]);
  const sec = recentReflexSec(s);

  // ───── Kết quả ─────
  if (screen === "done" && summary) {
    const avgSec = summary.avg / 1000;
    const better = summary.prev !== null && avgSec > 0 && avgSec < summary.prev;
    return (
      <div className="max-w-xl mx-auto px-3 py-6 sm:py-10">
        <div className="cci-card-wood !rounded-[28px] p-6 sm:p-8 flex flex-col items-center gap-4 text-center anim-pop">
          <div className="w-36 rounded-[24px] pt-4 flex justify-center" style={{ background: "#FFF1C7" }}>
            <Character who="kero" mood={summary.stars >= 2 ? "happy" : "wave"} size="80%" />
          </div>
          <Stars n={summary.stars} size={44} sound />
          <h1 className="text-3xl font-extrabold leading-tight">{summary.stars >= 2 ? "Phản xạ quá nhanh!" : "Luyện thêm chút nữa nhé!"}</h1>
          <div className="grid grid-cols-3 gap-2 w-full">
            <Stat label="Đúng ý" value={`${summary.ok}/${summary.n}`} />
            <Stat label="Phản xạ TB" value={avgSec > 0 ? `${avgSec.toFixed(1)}s` : "—"} />
            <Stat label="XP" value={`+${summary.xp}`} />
          </div>
          {summary.prev !== null && avgSec > 0 && (
            <p className={cx("font-bold", better ? "text-[#2C5A25]" : "text-[#6B4A30]")}>
              {better ? `Nhanh hơn ${(summary.prev - avgSec).toFixed(1)} giây so với mấy lượt trước! 🚀` : `Mấy lượt trước bạn đạt ${summary.prev.toFixed(1)} giây — cố gắng mở miệng sớm hơn nhé.`}
            </p>
          )}
          {summary.ok / Math.max(1, summary.n) >= 0.6 && s.chapters[chId]?.lesson && (
            <span className="cci-chip !bg-[#EAF3DC]">✅ Xong nhiệm vụ Ngày 6 · Chương {chId}</span>
          )}
          <NextStep />
          <div className="flex gap-2 flex-wrap justify-center">
            <button type="button" className="cci-btn cci-btn-big" onClick={begin}>
              <RotateCcw className="w-5 h-5" /> Chơi lại
            </button>
            <button type="button" className="cci-btn cci-btn-big" onClick={() => setScreen("menu")}>
              Đổi chế độ
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
  if (screen === "play" && items[idx]) {
    const item = items[idx];
    const res = phase === "result" ? results[results.length - 1] : null;
    const pct = Math.max(0, Math.min(1, left / limit));
    const urgent = left <= 3 && !voiced;
    return (
      <div className="max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button type="button" className="cci-btn !min-h-[44px] !w-[44px] !p-0" onClick={quit} aria-label="Thoát">
            <X className="w-5 h-5" />
          </button>
          <div className="flex gap-1.5 flex-1">
            {items.map((_, i) => {
              const r = results[i];
              const bg = r ? (r.ok ? "#6FAE4F" : "#F2C14E") : i === idx ? "#FBF0D9" : "#EAD9B8";
              return <span key={i} className="h-3 flex-1 rounded-full" style={{ background: bg, border: "2px solid #8B5E3C" }} />;
            })}
          </div>
          <span className={cx("cci-card-wood h-11 px-3 flex items-center gap-1 font-baloo font-extrabold shrink-0", combo >= 2 && "anim-bounce")} title="Chuỗi đúng liên tiếp">
            <Flame className="w-5 h-5" fill={combo >= 2 ? "#F29A4E" : "#EAD9B8"} stroke="#4A3222" /> x{combo}
          </span>
        </div>

        {/* Câu hỏi */}
        <div className="flex items-end gap-3">
          <div className="w-20 sm:w-24 shrink-0 rounded-[20px] pt-2 flex justify-center" style={{ background: NPCS[item.who].bg }}>
            <Character who={item.who} mood={phase === "npc" ? "talk" : res?.ok ? "happy" : "idle"} size="88%" />
          </div>
          <div className="cci-card !rounded-[22px] px-4 py-3 flex-1 min-w-0">
            <span className="cci-chip !text-xs !py-0.5 !rounded-full !bg-[#F3E4C6] mb-1.5">
              {item.mode === "swap" ? "Kero · Thay từ" : `${NPCS[item.who].name} · Chương ${item.ch}`}
            </span>
            {item.swap ? (
              <>
                <div className="font-baloo font-extrabold text-xl sm:text-2xl leading-snug">
                  {item.swap.frame.split("___").map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && <span className="inline-block min-w-[70px] mx-1 px-2 rounded-lg bg-[#FFF1C7] border-2 border-dashed border-[#D9A92F] text-[#A4521D]">{phase === "result" ? item.swap!.fill : "?"}</span>}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-sm font-bold text-[#6B4A30]">Thay bằng:</div>
                <div className="font-baloo font-extrabold text-2xl sm:text-3xl text-[#3F7A34] leading-tight">“{item.swap.cueVi}”</div>
              </>
            ) : (
              <>
                <div className="font-baloo font-extrabold text-xl sm:text-2xl leading-snug">{item.prompt}</div>
                {(phase === "result" || speed === "slow") && <div className="text-sm font-semibold text-[#6B4A30] mt-0.5">{item.promptVi}</div>}
              </>
            )}
            {item.speakPrompt && (
              <button type="button" data-sfx="none" onClick={() => speak(item.prompt, { who: item.who })} className="mt-1.5 text-xs font-extrabold text-[#3F7A34] inline-flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5" /> Nghe lại
              </button>
            )}
          </div>
        </div>

        {/* Đồng hồ */}
        {(phase === "go" || phase === "npc") && (
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="50" fill="#FBF3E2" stroke="#EAD9B8" strokeWidth="12" />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke={voiced ? "#6FAE4F" : urgent ? "#C96A2B" : "#F2C14E"}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 50}
                  strokeDashoffset={2 * Math.PI * 50 * (1 - (phase === "npc" ? 1 : pct))}
                  style={{ transition: "stroke-dashoffset .1s linear" }}
                />
              </svg>
              <div className={cx("absolute inset-0 flex flex-col items-center justify-center font-baloo font-extrabold", urgent && phase === "go" && "anim-bounce")}>
                {phase === "npc" ? (
                  <span className="text-sm text-[#6B4A30]">Nghe...</span>
                ) : voiced ? (
                  <Mic className="w-9 h-9 text-[#3F7A34]" />
                ) : (
                  <span className="text-4xl leading-none" style={{ color: urgent ? "#C96A2B" : "#4A3222" }}>
                    {Math.ceil(left)}
                  </span>
                )}
              </div>
            </div>
            {phase === "go" && voice && (
              <div className="text-center min-h-[52px]">
                <div className="font-extrabold text-[#2C5A25]">{voiced ? "Đang nghe bạn nói..." : "Nói ngay đi! 🎤"}</div>
                <div className="text-[15px] font-semibold text-[#6B4A30]">{interim || (item.mode === "filler" ? "Gợi ý: “Hmm, let me think...”" : " ")}</div>
              </div>
            )}
            {phase === "go" && !voice && (
              <div className="grid gap-2 w-full">
                {item.options.map((o, i) => (
                  <button
                    key={o}
                    type="button"
                    data-sfx="tap"
                    className="cci-btn !justify-start !text-left !min-h-[52px] !text-[16px]"
                    onClick={() => {
                      voiceAtRef.current = performance.now();
                      finishItem(tokenRef.current, item, o, { tapIdx: i });
                    }}
                  >
                    {o}
                  </button>
                ))}
              </div>
            )}
            {phase === "go" && voice && !voiced && (
              <button type="button" className="text-xs font-bold text-[#6B4A30] underline" onClick={() => setUseVoice(false)}>
                Không dùng được micro? Chuyển sang bấm chọn
              </button>
            )}
          </div>
        )}

        {phase === "judge" && (
          <div className="flex flex-col items-center gap-2 py-6">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-3 h-3 rounded-full bg-[#8B5E3C] anim-floaty" style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }} />
              ))}
            </div>
            <div className="font-bold text-[#6B4A30]">Kero đang chấm...</div>
            {interim && <div className="text-[15px] font-semibold">“{interim}”</div>}
          </div>
        )}

        {phase === "result" && res && (
          <div className="flex flex-col gap-3">
            <Feedback ok={res.ok} silent title={res.timeout ? "Hết giờ rồi!" : res.ok ? (res.ms !== null && res.ms < 2000 ? "Siêu nhanh! ⚡" : "Đúng ý!") : "Chưa ổn lắm"}>
              {res.said && !res.marks && <div>Bạn nói: “{res.said}”</div>}
              {res.marks && (
                <div className="my-1">
                  <WordMarks marks={res.marks} />
                </div>
              )}
              {res.ms !== null && <div className="text-sm">Bạn mở miệng sau {(res.ms / 1000).toFixed(1)} giây.</div>}
              {res.filler && <div className="text-sm">Câu câu giờ: “{res.filler}” 👍</div>}
              {res.note && <div className="text-sm mt-1">💡 {res.note}</div>}
              {res.timeout && <div className="text-sm">Không sao! Lần sau thử mở đầu bằng “Hmm, let me think...” để có thêm thời gian.</div>}
            </Feedback>
            {(!res.ok || res.better || item.mode === "swap") && (
              <div className="cci-card px-4 py-3 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-[#C99A1E] shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-extrabold text-[#6B4A30] uppercase tracking-wide">{item.mode === "swap" ? "Câu đúng" : "Có thể nói"}</div>
                  {[...(res.better && res.better !== item.samples[0] ? [res.better] : []), item.samples[0]].map((t) => (
                    <button key={t} type="button" data-sfx="none" onClick={() => speak(t, { who: "you" })} className="block text-left font-baloo font-extrabold text-lg leading-snug">
                      {t} <Volume2 className="inline w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button type="button" className="cci-btn cci-btn-primary cci-btn-big" onClick={next}>
              {idx + 1 >= items.length ? "Xem kết quả" : "Câu tiếp"} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
        {error && <p className="text-xs font-bold text-[#A4521D]">{error}</p>}
      </div>
    );
  }

  // ───── Menu ─────
  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <BackLink />
        <Avatar who="kero" size={52} />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight flex items-center gap-2">
            <Zap className="w-7 h-7 text-[#C99A1E]" /> Ao Phản Xạ
          </h1>
          <p className="font-semibold text-[#6B4A30] text-sm sm:text-base">Giao tiếp thật chỉ cho bạn 2–3 giây để đáp. Luyện ở đây để mở miệng không cần nghĩ.</p>
        </div>
      </div>

      {/* Chương */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {(mounted ? unlocked : CHAPTERS.slice(0, 1)).map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => router.replace(`/island/reflex?ch=${c.id}`)}
            className={cx("cci-btn !min-h-[36px] !text-[13px] !rounded-full shrink-0 !px-3", c.id === chId && "cci-btn-primary")}
          >
            Ch.{c.id} {c.title}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={cx("cci-card p-4 text-left flex flex-col gap-2 transition-transform hover:-translate-y-0.5", mode === m.id && "!border-[#3F7A34] ring-4 ring-[#A8D27A]")}
            aria-pressed={mode === m.id}
          >
            <span className="w-11 h-11 rounded-[14px] border-[3px] border-[#4A3222] flex items-center justify-center" style={{ background: m.bg }}>
              <m.icon className="w-5 h-5" />
            </span>
            <span className="font-baloo font-extrabold text-lg leading-tight">{m.title}</span>
            <span className="text-sm font-semibold text-[#6B4A30] leading-snug">{m.desc}</span>
          </button>
        ))}
      </div>

      <div className="cci-card p-4 flex flex-col sm:flex-row gap-4 sm:items-center">
        <div className="flex-1">
          <div className="text-xs font-extrabold uppercase tracking-wide text-[#6B4A30] mb-1.5">Tốc độ</div>
          <div className="flex gap-2 flex-wrap">
            {SPEEDS.map((x) => (
              <button
                key={x.id}
                type="button"
                className={cx("cci-btn !min-h-[40px] !text-sm", speed === x.id && "cci-btn-primary")}
                onClick={() => {
                  setSpeed(x.id);
                  localStorage.setItem("cci-reflex-speed", x.id);
                }}
              >
                {x.icon} {x.name} · {x[mode]}s
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-extrabold uppercase tracking-wide text-[#6B4A30] mb-1.5">Cách trả lời</div>
          <div className="flex gap-2">
            <button type="button" disabled={mounted && !supported} className={cx("cci-btn !min-h-[40px] !text-sm", voice && "cci-btn-primary")} onClick={() => setUseVoice(true)}>
              <Mic className="w-4 h-4" /> Nói
            </button>
            <button type="button" className={cx("cci-btn !min-h-[40px] !text-sm", !voice && "cci-btn-primary")} onClick={() => setUseVoice(false)}>
              <Hand className="w-4 h-4" /> Bấm chọn
            </button>
          </div>
        </div>
      </div>
      {micMsg && <p className="text-sm font-bold text-[#A4521D] -mt-2">{micMsg}</p>}
      {mounted && !supported && (
        <p className="text-sm font-bold text-[#A4521D] -mt-2">Trình duyệt này chưa hỗ trợ nhận giọng nói (hãy dùng Chrome hoặc Edge để luyện nói). Bạn vẫn có thể chơi bằng cách bấm chọn thật nhanh.</p>
      )}

      <button type="button" className="cci-btn cci-btn-primary cci-btn-big self-center !px-10" data-sfx="open" onClick={begin}>
        <Sparkles className="w-5 h-5" /> Bắt đầu · {mode === "filler" ? 5 : 8} câu
      </button>

      <div className="grid md:grid-cols-[1.3fr_1fr] gap-4">
        <div className="cci-card p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-baloo font-extrabold text-lg flex items-center gap-1.5">
              <TrendingDown className="w-5 h-5" /> Tốc độ phản xạ của bạn
            </span>
            <span className="text-sm font-extrabold text-[#2C5A25]">{mounted && sec !== null ? `TB ${sec.toFixed(1)}s` : ""}</span>
          </div>
          {mounted && runs.length > 0 ? <ReflexChart runs={runs} /> : <p className="text-sm font-semibold text-[#6B4A30]">Chơi vài lượt bằng giọng nói để thấy biểu đồ thời gian phản xạ giảm dần theo tuần. Mục tiêu: dưới 2,5 giây.</p>}
        </div>
        <div className="cci-card p-4 flex flex-col gap-2">
          <span className="font-baloo font-extrabold text-lg">Túi câu câu giờ</span>
          <p className="text-xs font-semibold text-[#6B4A30] -mt-1">Bí ý? Nói một câu này trước — người bản xứ cũng làm vậy.</p>
          <ul className="flex flex-col gap-1">
            {FILLERS.map((f) => (
              <li key={f.en}>
                <button type="button" data-sfx="none" onClick={() => speak(f.en, { who: "you" })} className="text-left w-full rounded-xl px-2 py-1 hover:bg-[#FBF0D9]">
                  <span className="font-extrabold">{f.en}</span> <span className="text-sm font-semibold text-[#6B4A30]">· {f.vi}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ReflexChart({ runs }: { runs: { avgMs: number; at: string; ok: number; n: number }[] }) {
  const max = Math.max(6000, ...runs.map((r) => r.avgMs));
  const W = 320;
  const H = 120;
  const bw = W / Math.max(runs.length, 6);
  const goalY = H - (2500 / max) * H;
  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full h-auto" role="img" aria-label="Biểu đồ thời gian phản xạ các lượt gần đây">
      <line x1="0" x2={W} y1={goalY} y2={goalY} stroke="#6FAE4F" strokeWidth="2" strokeDasharray="6 4" />
      <text x={W - 2} y={goalY - 4} textAnchor="end" fontSize="10" fontWeight="800" fill="#2C5A25">
        mục tiêu 2,5s
      </text>
      {runs.map((r, i) => {
        const h = Math.max(4, (r.avgMs / max) * H);
        const fast = r.avgMs <= 2500;
        return (
          <g key={r.at}>
            <rect x={i * bw + bw * 0.18} y={H - h} width={bw * 0.64} height={h} rx="6" fill={fast ? "#6FAE4F" : "#F2C14E"} stroke="#8B5E3C" strokeWidth="2" />
            <text x={i * bw + bw / 2} y={H + 13} textAnchor="middle" fontSize="10" fontWeight="800" fill="#6B4A30">
              {(r.avgMs / 1000).toFixed(1)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-white border-[3px] border-[#EAD9B8] px-2 py-2">
      <div className="font-baloo font-extrabold text-2xl leading-none">{value}</div>
      <div className="text-xs font-bold text-[#6B4A30] mt-1">{label}</div>
    </div>
  );
}

export default function ReflexPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
