"use client";

import { useEffect, useState } from "react";
import { BookOpen, Check, Lightbulb, Lock, Mic, Send, Volume2 } from "lucide-react";
import { Avatar } from "@/components/island/character";
import { BackLink, cx } from "@/components/island/ui";
import { CHAPTERS, NPCS } from "@/lib/island/curriculum";
import { EPISODES, fillPrev, type Episode } from "@/lib/island/life";
import { addMemories, calendarWeek, currentChapterId, saveEpisode, useIsland } from "@/lib/island/progress";
import { askNpc, type Correction } from "@/lib/island/chat-client";
import { aboutLearner } from "@/lib/island/me";
import { speak, useListen } from "@/lib/island/speech";
import { sfx } from "@/lib/island/sfx";
import { useGame } from "@/contexts/game-context";

const short = (a: string) => (a.length > 70 ? a.slice(0, 67).trimEnd() + "…" : a).replace(/[.!?\s]+$/, "");

/** Truyện cư dân: 4 mạch truyện, mỗi tuần mở một tập. Câu trả lời của bạn làm câu chuyện đi tiếp (và cư dân nhớ). */
export default function StoriesPage() {
  const s = useIsland();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState<Episode | null>(null);
  useEffect(() => setMounted(true), []);
  // Nước rút 30 ngày đi nhanh hơn lịch 13 tuần: lấy mốc xa hơn giữa tuần theo lịch và tuần của chương đang học.
  const week = mounted ? Math.max(calendarWeek(s), CHAPTERS.find((c) => c.id === currentChapterId(s))?.week || 1) : 0;

  if (open) return <Play ep={open} onBack={() => setOpen(null)} />;
  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <BackLink href="/island/practice" label="Phòng luyện" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">Chuyện trên đảo</h1>
          <p className="text-sm font-semibold text-[#6B4A30]">Mỗi tuần một tập mới. Cư dân hỏi ý bạn, câu trả lời của bạn quyết định tập sau, và cư dân sẽ nhớ.</p>
        </div>
      </div>
      <ol className="flex flex-col gap-2">
        {EPISODES.map((ep) => {
          const unlocked = mounted && week >= ep.week;
          const done = mounted && !!s.episodes[ep.id];
          return (
            <li key={ep.id}>
              <button
                type="button"
                disabled={!unlocked}
                onClick={() => setOpen(ep)}
                className={cx("w-full text-left clay rounded-[20px] px-3.5 py-3 flex items-center gap-3", unlocked ? "bg-white hover:-translate-y-0.5 transition-transform" : "bg-[#F4EAD6] opacity-60")}
              >
                <Avatar who={ep.npc} size={42} />
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-extrabold text-[#A4521D]">
                    Tuần {ep.week} · {NPCS[ep.npc].name}
                  </span>
                  <span className="block font-baloo font-extrabold text-lg leading-tight">{ep.title}</span>
                  {done && <span className="block text-xs font-semibold text-[#6B4A30] truncate">Bạn trả lời: “{s.episodes[ep.id].answer}”</span>}
                </span>
                {done ? <Check className="w-5 h-5 text-[#3F7A34]" strokeWidth={3} /> : unlocked ? <span className="cci-chip !bg-[#F2C14E] !text-[#4A3222] !text-xs">Mới</span> : <Lock className="w-5 h-5 text-[#8B6B45]" aria-label={`Mở tuần ${ep.week}`} />}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Play({ ep, onBack }: { ep: Episode; onBack: () => void }) {
  const s = useIsland();
  const { addXP } = useGame();
  const prev = ep.prevId ? s.episodes[ep.prevId]?.answer : undefined;
  const lines = ep.lines.map((l) => ({ en: fillPrev(l.en, prev && short(prev)), vi: fillPrev(l.vi, prev && short(prev)) }));
  const [text, setText] = useState(s.episodes[ep.id]?.answer || "");
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<{ reply: string; correction: Correction | null } | null>(null);
  const [vi, setVi] = useState(false);
  const { supported, listening, interim, listen, stop } = useListen();
  const npc = NPCS[ep.npc];
  const ch = CHAPTERS.find((c) => c.npc === ep.npc)!;

  useEffect(() => {
    let alive = true;
    (async () => {
      for (const l of [...lines, ep.question]) {
        if (!alive) return;
        await speak(l.en, { who: ep.npc });
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ep.id]);

  const submit = async () => {
    const a = text.trim();
    if (a.split(/\s+/).length < 2 || busy) return;
    setBusy(true);
    const first = !s.episodes[ep.id];
    saveEpisode(ep.id, a, 15);
    if (first) {
      addXP(15);
      const sa = short(a);
      addMemories(ep.npc, ch.id, [{ fact: ep.memory.fact.replace("{a}", sa), vi: ep.memory.vi.replace("{a}", sa), ask: ep.memory.ask }]);
    }
    const r = await askNpc({
      npc: ep.npc,
      persona: `${npc.role} on Chit Chat Island, a close friend of the learner`,
      topic: ep.title,
      level: ch.level,
      history: [...lines.map((l) => ({ role: "assistant" as const, content: l.en })), { role: "assistant", content: ep.question.en }],
      message: a,
      about: aboutLearner(s.profile),
      mode: "flow",
    });
    setReply({ reply: r.reply, correction: r.offline ? null : r.correction });
    setBusy(false);
    sfx.win();
    speak(r.reply, { who: ep.npc });
  };

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="cci-btn !min-h-[40px] !px-3 !text-sm">
          ← Các tập
        </button>
        <h1 className="text-xl sm:text-2xl font-extrabold leading-tight flex-1 min-w-0 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#C96A2B] shrink-0" /> {ep.title}
        </h1>
      </div>
      <section className="cci-card-wood p-4 flex flex-col gap-2.5">
        {[...lines, ep.question].map((l, k) => (
          <div key={k} className="flex items-end gap-2">
            <Avatar who={ep.npc} size={34} />
            <button type="button" data-sfx="none" onClick={() => speak(l.en, { who: ep.npc })} className={cx("max-w-[85%] text-left rounded-[16px] rounded-bl-[4px] px-3.5 py-2 bg-white border-[3px]", k === lines.length ? "border-[#C96A2B]" : "border-[#8B5E3C]")}>
              <span className="block font-bold leading-snug">
                {l.en} <Volume2 className="inline w-3.5 h-3.5 text-[#3F7A34]" />
              </span>
              {vi && <span className="block text-xs font-semibold text-[#6B4A30]">{l.vi}</span>}
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setVi((v) => !v)} className="self-start text-xs font-extrabold underline underline-offset-4 text-[#6B4A30]">
          <Lightbulb className="inline w-3.5 h-3.5" /> {vi ? "Ẩn" : "Xem"} nghĩa tiếng Việt
        </button>
      </section>

      {!reply ? (
        <section className="flex flex-col gap-2">
          <textarea
            value={listening ? `${text} ${interim}`.trim() : text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            disabled={listening || busy}
            placeholder={`Trả lời ${npc.name} bằng tiếng Anh (1–3 câu)…`}
            className="w-full rounded-[16px] border-[3px] border-[#8B5E3C] bg-white px-3 py-2 font-semibold outline-none focus:border-[#3F7A34] resize-none"
          />
          <div className="flex items-center gap-2">
            {supported && (
              <button
                type="button"
                onClick={async () => {
                  if (listening) return stop();
                  const t = await listen();
                  if (t.trim()) setText((v) => `${v} ${t}`.trim());
                }}
                className={cx("cci-btn !min-h-[42px]", listening && "!bg-[#C96A2B] !text-white")}
              >
                <Mic className="w-4 h-4" /> {listening ? "Dừng" : "Nói"}
              </button>
            )}
            <button type="button" className="cci-btn cci-btn-primary !min-h-[42px]" onClick={submit} disabled={busy || text.trim().split(/\s+/).length < 2}>
              <Send className="w-4 h-4" /> {busy ? `${npc.name} đang đọc…` : `Trả lời ${npc.name}`}
            </button>
          </div>
        </section>
      ) : (
        <section className="flex flex-col gap-2 anim-pop">
          <div className="self-end max-w-[85%] rounded-[16px] rounded-br-[4px] px-3.5 py-2 border-[3px] border-[#6FAE4F] bg-[#EAF3DC] font-bold leading-snug">{text}</div>
          {reply.correction && (
            <div className="self-end max-w-[85%] rounded-[14px] px-3 py-2 bg-[#FDEEDD] border-2 border-[#E0A26E] text-sm">
              <b>Nói tự nhiên hơn:</b> {reply.correction.fixed}
            </div>
          )}
          <div className="flex items-end gap-2">
            <Avatar who={ep.npc} size={34} />
            <div className="max-w-[85%] rounded-[16px] rounded-bl-[4px] px-3.5 py-2 bg-white border-[3px] border-[#8B5E3C] font-bold leading-snug">{reply.reply}</div>
          </div>
          <p className="text-sm font-bold text-[#2C5A25]">💭 {npc.name} sẽ nhớ câu trả lời của bạn, và tập sau sẽ có hồi tiếp!</p>
          <button type="button" className="cci-btn self-start" onClick={onBack}>
            Về danh sách tập
          </button>
        </section>
      )}
    </div>
  );
}
