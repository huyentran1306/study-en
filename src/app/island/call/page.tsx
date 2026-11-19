"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Captions, Lightbulb, Mic, Phone, PhoneOff, RotateCcw, Square, Volume2 } from "lucide-react";
import { Avatar, Character } from "@/components/island/character";
import { BackLink, cx } from "@/components/island/ui";
import { ReportCard, type ReportView } from "@/components/island/report-card";
import { CHAPTERS, NPCS, type NpcId } from "@/lib/island/curriculum";
import { aboutLearner, personalizeDeep } from "@/lib/island/me";
import { addChatTurn, addFix, completeMission, currentChapterId, fixCards, getIsland, markBuilt, markChatDone, markMemoryUsed, saveReport, today, unlockNote, useIsland, type Memory } from "@/lib/island/progress";
import { pickRecall, practiceFixes, recallOpener, recentFacts } from "@/lib/island/memory";
import { chatMetrics, topTags, trend } from "@/lib/island/feedback";
import { askNpc, fetchReport, rememberChat, type Correction, type Turn } from "@/lib/island/chat-client";
import { NPC_VOICE, canRecord, playVoice, speechStats, startRecording, stopVoice, transcribe, type SpeechStats } from "@/lib/island/voice";
import { adaptLevel } from "@/lib/island/adapt";
import { sfx } from "@/lib/island/sfx";
import { useGame } from "@/contexts/game-context";

type Phase = "ready" | "npc" | "you" | "rec" | "think" | "ended";
type Line = Turn & { correction?: Correction | null };
const GOAL = 5;
const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

function Inner() {
  const s = useIsland();
  const sp = useSearchParams();
  const { addXP } = useGame();
  const chParam = Number(sp.get("ch"));
  const chId = chParam && CHAPTERS.some((c) => c.id === chParam) ? chParam : currentChapterId(s);
  const raw = CHAPTERS.find((c) => c.id === chId)!;
  const ch = useMemo(() => personalizeDeep(raw, s.profile), [raw, s.profile]);
  const who: NpcId = ch.npc;
  const npc = NPCS[who];
  const voice = NPC_VOICE[who];

  const [phase, setPhase] = useState<Phase>("ready");
  const [lines, setLines] = useState<Line[]>([]);
  const [subs, setSubs] = useState(false);
  const [hint, setHint] = useState(false);
  const [secs, setSecs] = useState(0);
  const [level, setLevel] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [report, setReport] = useState<ReportView | null>(null);
  const [recall, setRecall] = useState<Memory | null>(null);
  const supported = useRef(true);
  const rec = useRef<Awaited<ReturnType<typeof startRecording>> | null>(null);
  const npcDoneAt = useRef(0);
  const reactions = useRef<number[]>([]);
  const stats = useRef<SpeechStats[]>([]);
  const barge = useRef(0);
  const startedAt = useRef(0);
  const practice = useRef<{ said: string; fixed: string }[]>([]);
  const ended = useRef(false);
  const rewarded = useRef(false);

  useEffect(() => {
    supported.current = canRecord();
    return () => {
      ended.current = true;
      stopVoice();
      rec.current?.cancel();
    };
  }, []);

  // Đồng hồ cuộc gọi
  useEffect(() => {
    if (phase === "ready" || phase === "ended") return;
    const t = setInterval(() => setSecs((performance.now() - startedAt.current) / 1000), 500);
    return () => clearInterval(t);
  }, [phase]);

  // Sóng âm khi đang nói
  useEffect(() => {
    if (phase !== "rec") return setLevel(0);
    let raf = 0;
    const tick = () => {
      setLevel(rec.current?.level() || 0);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const say = async (text: string) => {
    setPhase("npc");
    await playVoice(text, voice, { fallbackWho: who });
    if (ended.current) return;
    npcDoneAt.current = performance.now();
    setPhase((p) => (p === "npc" ? "you" : p));
  };

  const start = async () => {
    sfx.unlock();
    ended.current = false;
    startedAt.current = performance.now();
    setSecs(0);
    setLines([]);
    setReport(null);
    reactions.current = [];
    stats.current = [];
    barge.current = 0;
    rewarded.current = false;
    const st = getIsland();
    practice.current = practiceFixes(fixCards(st), today());
    const m = pickRecall(st.memories, who);
    setRecall(m);
    const opener = m ? recallOpener(m, npc.name, NPCS[m.npc as NpcId]?.name || m.npc) : ch.chat.opener;
    setLines([{ role: "assistant", content: opener }]);
    await say(opener);
  };

  const onMic = async () => {
    if (phase === "rec") return send();
    if (phase === "think" || phase === "ready" || phase === "ended") return;
    if (phase === "npc") {
      // Ngắt lời cư dân như nói chuyện thật.
      stopVoice();
      barge.current++;
    } else if (npcDoneAt.current) reactions.current.push(performance.now() - npcDoneAt.current);
    setNote(null);
    try {
      rec.current = await startRecording(30_000);
      setPhase("rec");
    } catch {
      setNote("Không mở được micro. Hãy cho phép trình duyệt dùng micro rồi thử lại.");
      setPhase("you");
    }
  };

  const send = async () => {
    const r = rec.current;
    rec.current = null;
    if (!r) return;
    setPhase("think");
    const audio = await r.stop();
    if (audio.ms < 500) {
      setNote("Hơi ngắn, bạn nói lại nhé.");
      return setPhase("you");
    }
    const tr = await transcribe(audio.blob);
    if (ended.current) return;
    if (!tr.text) {
      setNote(tr.offline ? "Mạng chập chờn, chưa nghe được. Thử lại nhé." : null);
      return say(tr.offline ? "Sorry, the line is bad. Can you say that again?" : "Sorry, I didn't catch that. Could you say it again?");
    }
    stats.current.push(speechStats(tr));
    const history = lines.map(({ role, content }) => ({ role, content }));
    const mine = lines.filter((l) => l.role === "user").length + 1;
    if (recall && mine === 1) markMemoryUsed(recall.id);
    setLines((l) => [...l, { role: "user", content: tr.text }]);
    addChatTurn();
    const data = await askNpc({
      npc: who,
      persona: `${ch.chat.persona}. You are talking on the PHONE, so keep it short and natural`,
      topic: ch.chat.topic,
      level: ch.level,
      history,
      message: tr.text,
      about: aboutLearner(s.profile),
      memories: recentFacts(s.memories),
      practice: practice.current,
      mode: "flow",
      adapt: adaptLevel(s),
    });
    if (ended.current) return;
    if (!data.offline && data.correction?.fixed) addFix(tr.text, data.correction.fixed, data.correction.note || "", ch.id, data.correction.tag);
    setLines((l) => [...l.slice(0, -1), { role: "user", content: tr.text, correction: data.offline ? undefined : data.correction }, { role: "assistant", content: data.reply }]);
    if (mine >= GOAL && !rewarded.current) {
      rewarded.current = true;
      markChatDone();
      addXP(25);
      sfx.coin();
      // Cuộc gọi đủ lượt cũng tính là chìa khoá "Tám chuyện AI" của chương đang học.
      const isl = getIsland();
      if (isl.chapters[ch.id]?.lesson && !isl.chapters[ch.id]?.chat) completeMission(ch.id, "chat", 0);
      const note = unlockNote(getIsland(), ch.id);
      setNote(`Đủ ${GOAL} lượt, +25 XP!${note ? ` ${note}.` : ""} Nói tiếp hoặc cúp máy để xem nhận xét.`);
    }
    await say(data.reply);
  };

  const hangUp = async () => {
    ended.current = true;
    stopVoice();
    rec.current?.cancel();
    rec.current = null;
    setPhase("ended");
    sfx.pop?.();
    const mine = lines.filter((l) => l.role === "user");
    if (mine.length < 2) return;
    markBuilt("call");
    const metrics = chatMetrics(mine.map((l) => ({ content: l.content, checked: l.correction !== undefined, corrected: !!l.correction })));
    const at = new Date().toISOString();
    setReport({ ai: null, metrics, loading: true, offline: false, turnsAt: mine.length });
    const history = lines.map(({ role, content }) => ({ role, content }));
    rememberChat(who, ch.id, ch.chat.topic, history, recentFacts(getIsland().memories, 12));
    const ai = await fetchReport({ npc: who, topic: ch.chat.topic, level: ch.level, history, fixes: mine.filter((l) => l.correction).map((l) => ({ said: l.content, fixed: l.correction!.fixed, tag: l.correction!.tag })) });
    setReport({ ai, metrics, loading: false, offline: !ai, turnsAt: mine.length });
    if (ai) saveReport({ at, ch: ch.id, npc: who, mode: "flow", f: ai.scores.fluency, a: ai.scores.accuracy, r: ai.scores.range, i: ai.scores.interaction, cefr: ai.cefr, turns: metrics.turns, words: Math.round(metrics.avgWords * 10) });
  };

  const lastNpc = [...lines].reverse().find((l) => l.role === "assistant")?.content || "";
  const suggestion = ch.turns.map((t) => t.options.find((o) => o.ok)!)[Math.min(lines.filter((l) => l.role === "user").length, ch.turns.length - 1)];
  const avgReact = reactions.current.length ? reactions.current.reduce((a, b) => a + b, 0) / reactions.current.length / 1000 : 0;
  const avgWpm = stats.current.length ? Math.round(stats.current.reduce((a, b) => a + b.wpm, 0) / stats.current.length) : 0;
  const fillers = stats.current.reduce((a, b) => a + b.fillers, 0);
  const fixes = lines.filter((l) => l.role === "user" && l.correction);
  const status =
    phase === "npc" ? `${npc.name} đang nói… (bấm mic để ngắt lời)` : phase === "you" ? "Đến lượt bạn: bấm mic rồi nói" : phase === "rec" ? "Đang nghe bạn nói… bấm lần nữa để gửi" : phase === "think" ? `${npc.name} đang nghe…` : "";

  if (!supported.current && phase === "ready") {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-4">
        <BackLink href="/island?view=isle" label="Đảo Luyện" />
        <div className="cci-card-wood p-5 font-semibold">
          Trình duyệt này chưa cho ghi âm nên chưa gọi điện được. Bạn thử bằng Chrome hoặc Safari mới, hoặc{" "}
          <Link href={`/island/chat?ch=${ch.id}`} className="font-extrabold underline">
            tám chuyện bằng chữ
          </Link>
          .
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <BackLink href="/island?view=isle" label="Đảo Luyện" />
        <h1 className="text-lg sm:text-2xl font-extrabold leading-tight flex-1 min-w-0">Gọi điện với {npc.name}</h1>
      </div>

      {/* Màn hình cuộc gọi */}
      <section className="rounded-[28px] border-[3px] border-[#4A3222] px-4 py-5 flex flex-col items-center gap-3 text-white" style={{ background: "linear-gradient(180deg,#2F5D50,#1E3B33)" }} aria-live="polite">
        <div className="text-sm font-bold opacity-80">{phase === "ready" ? `Chủ đề: ${ch.chat.topic}` : phase === "ended" ? `Đã kết thúc · ${fmt(secs)}` : fmt(secs)}</div>
        <div className={cx("relative w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center", phase === "npc" && "anim-floaty")} style={{ background: npc.bg, boxShadow: phase === "npc" ? "0 0 0 8px rgba(255,255,255,.18), 0 0 0 16px rgba(255,255,255,.08)" : "0 0 0 6px rgba(255,255,255,.1)" }}>
          <div className="w-[80%]">
            <Character who={who} mood={phase === "npc" ? "talk" : "happy"} size="100%" />
          </div>
        </div>
        <div className="font-baloo font-extrabold text-2xl">{npc.name}</div>
        <div className="text-sm font-bold min-h-[20px] text-center opacity-90">{status}</div>

        {subs && lastNpc && phase !== "ready" && (
          <div className="w-full rounded-[16px] bg-white/12 px-3 py-2 text-center font-bold leading-snug" style={{ background: "rgba(255,255,255,.12)" }}>
            {lastNpc}
          </div>
        )}
        {hint && suggestion && phase !== "ready" && phase !== "ended" && (
          <div className="w-full rounded-[16px] px-3 py-2 text-center text-sm font-bold leading-snug text-[#4A3222] bg-[#FFF1C7]">
            Gợi ý: {suggestion.en} <span className="font-semibold text-[#6B4A30]">({suggestion.vi})</span>
          </div>
        )}
        {note && <div className="text-sm font-bold text-[#FFE08A] text-center">{note}</div>}

        {phase === "ready" ? (
          <button type="button" data-sfx="none" onClick={start} className="mt-2 w-20 h-20 rounded-full bg-[#3FA34D] border-4 border-white/70 flex items-center justify-center shadow-lg" aria-label={`Gọi ${npc.name}`}>
            <Phone className="w-9 h-9" />
          </button>
        ) : phase === "ended" ? (
          <button type="button" onClick={start} className="mt-2 cci-btn !bg-white !text-[#2F5D50]">
            <RotateCcw className="w-4 h-4" /> Gọi lại
          </button>
        ) : (
          <div className="mt-1 flex items-center justify-center gap-5">
            <button type="button" onClick={() => setSubs((v) => !v)} className={cx("w-12 h-12 rounded-full flex items-center justify-center border-2 border-white/40", subs ? "bg-white text-[#2F5D50]" : "bg-white/10")} aria-pressed={subs} aria-label="Phụ đề" title="Phụ đề">
              <Captions className="w-5 h-5" />
            </button>
            <button
              type="button"
              data-sfx="none"
              onClick={onMic}
              disabled={phase === "think"}
              className={cx("relative w-20 h-20 rounded-full flex items-center justify-center border-4 border-white/70 transition-transform", phase === "rec" ? "bg-[#E0583B]" : "bg-[#3FA34D]", phase === "think" && "opacity-60")}
              style={phase === "rec" ? { boxShadow: `0 0 0 ${6 + level * 18}px rgba(224,88,59,.35)` } : undefined}
              aria-label={phase === "rec" ? "Gửi câu vừa nói" : "Nói"}
            >
              {phase === "rec" ? <Square className="w-8 h-8" fill="currentColor" /> : <Mic className="w-9 h-9" />}
            </button>
            <button type="button" onClick={() => setHint((v) => !v)} className={cx("w-12 h-12 rounded-full flex items-center justify-center border-2 border-white/40", hint ? "bg-white text-[#2F5D50]" : "bg-white/10")} aria-pressed={hint} aria-label="Gợi ý câu nói" title="Gợi ý">
              <Lightbulb className="w-5 h-5" />
            </button>
          </div>
        )}
        {phase !== "ready" && phase !== "ended" && (
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => lastNpc && say(lastNpc)} disabled={phase !== "you"} className="text-sm font-bold underline underline-offset-4 disabled:opacity-40 inline-flex items-center gap-1">
              <Volume2 className="w-4 h-4" /> Nghe lại
            </button>
            <button type="button" onClick={hangUp} className="w-12 h-12 rounded-full bg-[#D9433A] flex items-center justify-center border-2 border-white/50" aria-label="Cúp máy">
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        )}
      </section>

      {phase === "ready" && (
        <p className="text-sm font-semibold text-[#6B4A30] text-center">
          Cuộc gọi chỉ có giọng nói, không có chữ như ngoài đời. Bí thì bật <b>phụ đề</b> hoặc <b>gợi ý</b>. Bấm mic khi {npc.name} đang nói để ngắt lời, hoàn toàn bình thường!
        </p>
      )}

      {phase === "ended" && (
        <>
          <section className="cci-card-wood p-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            {[
              [fmt(secs), "thời lượng"],
              [avgReact ? `${avgReact.toFixed(1)}s` : "–", "phản xạ TB"],
              [avgWpm || "–", "từ / phút"],
              [fillers, "ừm, à…"],
            ].map(([v, l]) => (
              <div key={l as string} className="rounded-[14px] bg-white px-1 py-2">
                <div className="font-baloo font-extrabold text-xl leading-none">{v}</div>
                <div className="text-[11px] font-bold text-[#6B4A30] mt-1">{l}</div>
              </div>
            ))}
            <p className="col-span-full text-xs font-semibold text-[#6B4A30]">
              Phản xạ là thời gian từ lúc {npc.name} nói xong tới lúc bạn bấm nói. Người bản xứ thường đáp trong khoảng 1–2 giây.{barge.current > 0 && ` Bạn đã ngắt lời ${barge.current} lần, rất tự nhiên!`}
            </p>
          </section>
          {report ? (
            <ReportCard view={report} npcName={npc.name} turns={report.turnsAt} trend={report.ai ? trend(s.reports.slice(0, -1), report.ai.scores) : { fluency: 0, accuracy: 0, range: 0, interaction: 0 }} tags={topTags(fixCards(s)).filter((t) => t.count >= 2)} onRefresh={hangUp} />
          ) : (
            <p className="text-sm font-bold text-[#6B4A30] text-center">Nói ít nhất 2 câu để nhận phiếu nhận xét.</p>
          )}
          {fixes.length > 0 && (
            <section className="rounded-[18px] border-[3px] border-[#E0A26E] bg-[#FFF6EA] px-4 py-3 flex flex-col gap-1.5">
              <h2 className="font-baloo font-extrabold text-lg">Lỗi trong cuộc gọi: {fixes.length} câu</h2>
              {fixes.map((l, i) => (
                <div key={i} className="text-sm leading-snug">
                  <span className="block font-semibold text-[#A4521D] line-through decoration-[#C96A2B]/60">{l.content}</span>
                  <span className="block font-extrabold">{l.correction!.fixed}</span>
                </div>
              ))}
            </section>
          )}
          <details className="cci-card p-3">
            <summary className="font-extrabold cursor-pointer">Xem lại lời thoại</summary>
            <ul className="mt-2 flex flex-col gap-1.5">
              {lines.map((l, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  {l.role === "assistant" ? <Avatar who={who} size={24} /> : <span className="w-6 text-center font-extrabold">Bạn</span>}
                  <span className="font-semibold leading-snug">{l.content}</span>
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </div>
  );
}

export default function CallPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
