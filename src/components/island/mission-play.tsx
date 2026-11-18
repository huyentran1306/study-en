"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ClipboardList, Lightbulb, Mic, Send, Timer, Volume2, X } from "lucide-react";
import { Avatar } from "./character";
import { cx } from "./ui";
import { NPCS } from "@/lib/island/curriculum";
import { askNpc, type Turn } from "@/lib/island/chat-client";
import { checkFact, secretFor, starsFor, type Mission } from "@/lib/island/missions";
import { addChatTurn, finishMission, useIsland } from "@/lib/island/progress";
import { aboutLearner } from "@/lib/island/me";
import { speak, stopSpeaking, useListen } from "@/lib/island/speech";
import { sfx } from "@/lib/island/sfx";
import { useGame } from "@/contexts/game-context";

/** Chơi một nhiệm vụ hỏi thông tin (hoặc thử thách cuối tuần có đồng hồ). */
export function MissionPlay({ m, onExit }: { m: Mission; onExit: () => void }) {
  const s = useIsland();
  const { addXP } = useGame();
  const npc = NPCS[m.npc];
  const [msgs, setMsgs] = useState<Turn[]>([{ role: "assistant", content: m.opener }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean> | null>(null);
  const [tries, setTries] = useState(0);
  const [won, setWon] = useState(false);
  const [hint, setHint] = useState(0);
  const [left, setLeft] = useState(m.boss?.seconds || 0);
  const [lost, setLost] = useState(false);
  const { supported, listening, interim, listen, stop } = useListen();
  const endRef = useRef<HTMLDivElement>(null);
  const t0 = useRef(performance.now());

  useEffect(() => {
    const t = setTimeout(() => speak(m.opener, { who: m.npc }), 300);
    return () => {
      clearTimeout(t);
      stopSpeaking();
    };
  }, [m]);
  useEffect(() => {
    const box = endRef.current?.parentElement;
    box?.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);
  // Đồng hồ thử thách
  useEffect(() => {
    if (!m.boss || won || lost) return;
    const t = setInterval(() => {
      const l = Math.max(0, Math.round(m.boss!.seconds - (performance.now() - t0.current) / 1000));
      setLeft(l);
      if (l <= 0) {
        setLost(true);
        sfx.pop?.();
      }
    }, 500);
    return () => clearInterval(t);
  }, [m, won, lost]);

  const over = won || lost;
  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy || over) return;
    const history = msgs;
    setMsgs((x) => [...x, { role: "user", content }]);
    setInput("");
    setBusy(true);
    addChatTurn();
    const r = await askNpc({ npc: m.npc, persona: m.persona, topic: m.topic, level: m.level, history, message: content, secret: secretFor(m), about: aboutLearner(s.profile), mode: "flow" });
    setMsgs((x) => [...x, { role: "assistant", content: r.reply }]);
    setBusy(false);
    speak(r.reply, { who: m.npc });
  };

  const submit = () => {
    if (over) return;
    const res = Object.fromEntries(m.facts.map((f) => [f.key, checkFact(f, answers[f.key] || "")]));
    const n = tries + 1;
    setTries(n);
    setChecked(res);
    if (Object.values(res).every(Boolean)) {
      const stars = starsFor(n);
      const xp = m.boss ? 40 : 20;
      setWon(true);
      finishMission(m.id, stars, xp, m.boss?.trophy);
      addXP(xp);
      sfx.win();
      import("@/lib/confetti").then((c) => c.fireCelebration()).catch(() => {});
    } else sfx.pop?.();
  };

  const correct = checked ? Object.values(checked).filter(Boolean).length : 0;
  return (
    <div className="flex flex-col gap-3">
      <div className="cci-card-wood p-3 sm:p-4 flex items-start gap-3">
        <Avatar who={m.npc} size={52} />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-extrabold tracking-[0.1em] uppercase text-[#A4521D]">{m.boss ? "Thử thách cuối tuần" : "Nhiệm vụ hỏi thông tin"} · {m.level}</div>
          <h1 className="text-xl sm:text-2xl font-extrabold leading-tight">{m.title}</h1>
          <p className="text-sm font-semibold text-[#6B4A30] leading-snug mt-0.5">{m.brief}</p>
        </div>
        <button type="button" onClick={onExit} className="shrink-0 w-10 h-10 rounded-full hover:bg-white/60 flex items-center justify-center" aria-label="Thoát">
          <X className="w-5 h-5" />
        </button>
      </div>
      {m.boss && (
        <div className="flex items-center gap-2" aria-live="polite">
          <Timer className={cx("w-5 h-5 shrink-0", left <= 30 ? "text-[#D9433A]" : "text-[#6B4A30]")} />
          <div className="flex-1 h-3 rounded-full bg-[#F4EAD6] border-2 border-[#E6CF9A] overflow-hidden">
            <div className="h-full transition-[width] duration-500" style={{ width: `${(left / m.boss.seconds) * 100}%`, background: left <= 30 ? "#D9433A" : "#F2C14E" }} />
          </div>
          <span className="font-baloo font-extrabold w-12 text-right">
            {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
          </span>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-[1fr_300px]">
        {/* Trò chuyện */}
        <div className="flex flex-col gap-2 min-w-0">
          <div className="cci-card h-[340px] md:h-[400px] overflow-y-auto p-3 flex flex-col gap-2.5">
            {msgs.map((x, i) =>
              x.role === "assistant" ? (
                <div key={i} className="flex items-end gap-2">
                  <Avatar who={m.npc} size={32} />
                  <div className="max-w-[82%] rounded-[16px] rounded-bl-[4px] px-3.5 py-2 bg-white border-[3px] border-[#8B5E3C]">
                    <p className="font-bold leading-snug">{x.content}</p>
                    <button type="button" onClick={() => speak(x.content, { who: m.npc })} className="text-xs font-extrabold text-[#3F7A34] inline-flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5" /> Nghe lại
                    </button>
                  </div>
                </div>
              ) : (
                <div key={i} className="self-end max-w-[82%] rounded-[16px] rounded-br-[4px] px-3.5 py-2 border-[3px] border-[#6FAE4F] bg-[#EAF3DC] font-bold leading-snug">
                  {x.content}
                </div>
              ),
            )}
            {busy && <div className="text-sm font-bold text-[#6B4A30]">{npc.name} đang trả lời…</div>}
            <div ref={endRef} />
          </div>
          {hint > 0 && !over && (
            <div className="flex flex-wrap gap-1.5">
              {m.hints.slice(0, hint + 1).map((h) => (
                <button key={h} type="button" onClick={() => setInput(h)} className="cci-chip !text-[13px]">
                  {h}
                </button>
              ))}
            </div>
          )}
          <form
            className="flex gap-2 items-center"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            {supported && (
              <button
                type="button"
                disabled={over}
                onClick={async () => {
                  if (listening) return stop();
                  const t = await listen();
                  if (t.trim()) send(t);
                }}
                className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-white"
                style={{ background: listening ? "#C96A2B" : "#3F7A34", border: `3px solid ${listening ? "#A4521D" : "#2C5A25"}` }}
                aria-label={listening ? "Dừng" : "Nói"}
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
            <input
              value={listening ? interim : input}
              onChange={(e) => setInput(e.target.value)}
              disabled={listening || over}
              placeholder={over ? "Đã kết thúc" : `Hỏi ${npc.name} bằng tiếng Anh…`}
              className="flex-1 min-w-0 h-11 rounded-[14px] border-[3px] border-[#8B5E3C] bg-white px-3 font-semibold outline-none focus:border-[#3F7A34]"
            />
            <button type="submit" className="cci-btn cci-btn-primary !h-11 !w-11 !p-0 shrink-0" disabled={busy || !input.trim() || over} aria-label="Gửi">
              <Send className="w-5 h-5" />
            </button>
            <button type="button" className="cci-btn !h-11 !w-11 !p-0 shrink-0" onClick={() => setHint((h) => Math.min(h + 1, m.hints.length - 1))} disabled={over} aria-label="Gợi ý câu hỏi" title="Gợi ý câu hỏi">
              <Lightbulb className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Phiếu */}
        <form
          className="rounded-[20px] border-[3px] border-dashed border-[#8B5E3C] bg-[#FFFBF2] p-3 flex flex-col gap-2.5 self-start"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          aria-label="Phiếu ghi chú"
        >
          <h2 className="font-baloo font-extrabold text-lg flex items-center gap-1.5">
            <ClipboardList className="w-5 h-5" /> Phiếu ghi chú
          </h2>
          {m.facts.map((f) => {
            const ok = checked?.[f.key];
            return (
              <label key={f.key} className="flex flex-col gap-1">
                <span className="text-sm font-extrabold">{f.label}</span>
                <span className="relative">
                  <input
                    value={answers[f.key] || ""}
                    onChange={(e) => {
                      setAnswers((a) => ({ ...a, [f.key]: e.target.value }));
                      setChecked((c) => (c ? { ...c, [f.key]: false } : c));
                    }}
                    disabled={over && !lost}
                    className={cx("w-full h-10 rounded-[12px] border-[3px] bg-white px-3 pr-9 font-semibold outline-none", ok ? "border-[#3F7A34]" : checked ? "border-[#E0A26E]" : "border-[#D8BF92] focus:border-[#3F7A34]")}
                  />
                  {checked && <span className="absolute right-2.5 top-1/2 -translate-y-1/2">{ok ? <Check className="w-5 h-5 text-[#3F7A34]" strokeWidth={3} /> : <X className="w-5 h-5 text-[#C96A2B]" strokeWidth={3} />}</span>}
                </span>
                {(won || lost) && <span className="text-xs font-bold text-[#6B4A30]">Đáp án: {f.value}</span>}
              </label>
            );
          })}
          {!over && (
            <button type="submit" className="cci-btn cci-btn-primary" disabled={!m.facts.some((f) => (answers[f.key] || "").trim())}>
              Nộp phiếu
            </button>
          )}
          {checked && !over && <p className="text-sm font-bold text-[#A4521D]">Đúng {correct}/{m.facts.length}. Hỏi lại {npc.name} những ô còn sai nhé (đừng đoán!).</p>}
        </form>
      </div>

      {won && (
        <div className="rounded-[20px] border-[3px] border-[#3F7A34] bg-[#EAF3DC] px-4 py-3 flex flex-wrap items-center gap-3 anim-pop">
          <span className="text-2xl" aria-hidden>
            {"⭐".repeat(starsFor(tries))}
          </span>
          <span className="font-extrabold text-[#2C5A25] flex-1 min-w-0">
            {m.boss ? `Vượt thử thách! Bạn nhận cúp "${m.boss.trophyVi}" và +40 XP.` : "Lấy đủ thông tin! +20 XP."} {tries === 1 ? "Đúng hết ngay lần đầu!" : `Nộp ${tries} lần.`}
          </span>
          <button type="button" className="cci-btn" onClick={onExit}>
            Xong
          </button>
        </div>
      )}
      {lost && (
        <div className="rounded-[20px] border-[3px] border-[#D9433A] bg-[#FDEEDD] px-4 py-3 flex flex-wrap items-center gap-3 anim-pop">
          <span className="font-extrabold text-[#A4521D] flex-1 min-w-0">Hết giờ! Xem đáp án ở phiếu rồi thử lại: lần này hỏi gọn hơn, và nhớ xin nói chậm khi không nghe kịp.</span>
          <button type="button" className="cci-btn cci-btn-primary" onClick={onExit}>
            Thử lại
          </button>
        </div>
      )}
    </div>
  );
}
