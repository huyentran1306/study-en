"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, Lightbulb, ListChecks, Mic, NotebookPen, Send, Sparkles, Volume2, X, Zap } from "lucide-react";
import { Avatar } from "@/components/island/character";
import { BackLink, cx } from "@/components/island/ui";
import { CHAPTERS, NPCS, RESCUE_BAG, type NpcId } from "@/lib/island/curriculum";
import { aboutLearner, personalizeDeep } from "@/lib/island/me";
import { addChatTurn, addFix, fixCards, forgetMemory, saveReport, markChatDone, markMemoryUsed, completeMission, currentChapterId, getIsland, isUnlocked, markChatTask, praiseFix, today, unlockNote, useIsland, type Memory } from "@/lib/island/progress";
import { pickRecall, practiceFixes, recallNoteVi, recallOpener, recentFacts } from "@/lib/island/memory";
import { FIX_MODE_KEY, TAG_VI, chatMetrics, defaultFixMode, ideaCount, isRepair, topTags, trend, type ErrorTag, type FixMode, type ReportAI } from "@/lib/island/feedback";
import { ReportCard, type ReportView } from "@/components/island/report-card";
import { fetchReport, rememberChat } from "@/lib/island/chat-client";
import { ADAPT_VI, adaptLevel } from "@/lib/island/adapt";
import { RetellCard } from "@/components/island/retell";
import { CHAT_TASKS } from "@/lib/island/drills";
import { sfx } from "@/lib/island/sfx";
import { speak, stopSpeaking, useListen } from "@/lib/island/speech";
import { useGame } from "@/contexts/game-context";
import { NextStep } from "@/components/island/journey";

interface ChatMsg {
  id: number;
  role: "user" | "assistant";
  content: string;
  correction?: { fixed: string; note: string; tag?: ErrorTag } | null;
  checked?: boolean;
  /** Câu này sửa được một lỗi cũ trong Sổ lỗi sai. */
  praised?: { said: string; fixed: string };
  /** Số ý trong câu (câu + từ nối): 3 = trả lời đủ ý chính + lý do + chi tiết. */
  ideas?: number;
  /** Câu "cứu nguy": xin nhắc lại, hỏi nghĩa... */
  repair?: boolean;
}

const GOAL = 5;

const npcName = (id: string) => NPCS[id as NpcId]?.name || id;

function Inner() {
  const s = useIsland();
  const router = useRouter();
  const sp = useSearchParams();
  const { addXP } = useGame();
  const chParam = Number(sp.get("ch"));
  const chId = chParam && CHAPTERS.some((c) => c.id === chParam) ? chParam : currentChapterId(s);
  const rawCh = CHAPTERS.find((c) => c.id === chId)!;
  const profile = s.profile;
  const ch = useMemo(() => personalizeDeep(rawCh, profile), [rawCh, profile]);
  const npc = NPCS[ch.npc];

  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const [turns, setTurns] = useState(0);
  const [rewarded, setRewarded] = useState(false);
  const [twistOn, setTwistOn] = useState(false);
  const [taskToast, setTaskToast] = useState<string | null>(null);
  const plan = CHAT_TASKS[ch.id];
  const { supported, listening, interim, error, listen, stop } = useListen();
  const endRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(1);
  // Cư dân nhớ bạn: chuyện cũ đang được hỏi lại, các lỗi cũ đang "gài", số câu đã gửi đi để ghi nhớ.
  const [recall, setRecall] = useState<Memory | null>(null);
  // Cách sửa lỗi (lưu theo máy) + phiếu nhận xét của cuộc trò chuyện này.
  const [savedMode, setSavedMode] = useState<FixMode | null>(null);
  const mode: FixMode = savedMode || defaultFixMode(ch.level);
  const [report, setReport] = useState<ReportView | null>(null);
  const convAt = useRef("");
  // Cư dân nói khó (luyện cứu nguy) + thưởng nói dài / hỏi lại khéo (tối đa 3 lần mỗi cuộc).
  const [tricky, setTricky] = useState(false);
  const bonus = useRef({ long: 0, repair: 0 });
  const adapt = adaptLevel(s);
  const msgsRef = useRef<ChatMsg[]>([]);
  msgsRef.current = msgs;
  const rememberedUpTo = useRef(0);
  const practice = useRef<{ said: string; fixed: string }[]>([]);

  useEffect(() => {
    if (!taskToast) return;
    const t = setTimeout(() => setTaskToast(null), 2600);
    return () => clearTimeout(t);
  }, [taskToast]);

  const lowerText = (t: string) => " " + t.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9' ]/g, " ").replace(/\s+/g, " ") + " ";
  const checkTasks = (text: string) => {
    if (!plan) return;
    const t = lowerText(text);
    plan.tasks.forEach((task, i) => {
      if (s.chatTasks[`${ch.id}:${i}`]) return;
      const hit = task.kw.some((k) => {
        const kk = k.toLowerCase();
        return /^[a-z']+$/.test(kk.trim()) ? t.includes(` ${kk.trim()} `) : t.includes(kk);
      });
      if (!hit) return;
      const all = markChatTask(ch.id, i, plan.tasks.length, 20);
      if (all) {
        sfx.win();
        addXP(20);
        setTaskToast("Hoàn thành cả 3 nhiệm vụ! +20 XP 🎉");
      } else {
        sfx.coin();
        setTaskToast(`Xong: ${task.vi} ✓`);
      }
    });
  };

  /** Gửi phần trò chuyện mới (ít nhất 2 câu của bạn) cho cư dân ghi nhớ. */
  const remember = (who: NpcId, chId: number, topic: string, list: ChatMsg[], toast: boolean) => {
    const mine = list.filter((m) => m.role === "user").length;
    if (mine - rememberedUpTo.current < 2) return;
    rememberedUpTo.current = mine;
    const known = recentFacts(getIsland().memories, 12);
    rememberChat(who, chId, topic, list.map((m) => ({ role: m.role, content: m.content })), known).then((added) => {
      if (toast && added.length) setTaskToast(`💭 ${NPCS[who].name} sẽ nhớ: ${added[0].vi}`);
    });
  };

  useEffect(() => {
    const st = getIsland();
    const m = pickRecall(st.memories, ch.npc);
    const opener = m ? recallOpener(m, npc.name, npcName(m.npc)) : ch.chat.opener;
    setRecall(m);
    practice.current = practiceFixes(fixCards(st), today());
    rememberedUpTo.current = 0;
    convAt.current = new Date().toISOString();
    bonus.current = { long: 0, repair: 0 };
    setReport(null);
    setMsgs([{ id: 0, role: "assistant", content: opener }]);
    setTurns(0);
    setRewarded(false);
    const t = setTimeout(() => speak(opener, { who: ch.npc }), 400);
    return () => {
      clearTimeout(t);
      stopSpeaking();
      // Rời cuộc trò chuyện (đổi chủ đề, thoát trang): cư dân ghi nhớ phần chưa gửi.
      remember(ch.npc, ch.id, ch.chat.topic, msgsRef.current, false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ch, twistOn]);

  useEffect(() => {
    const v = localStorage.getItem(FIX_MODE_KEY);
    if (v === "flow" || v === "fix") setSavedMode(v);
  }, []);
  const chooseMode = (m: FixMode) => {
    setSavedMode(m);
    localStorage.setItem(FIX_MODE_KEY, m);
  };

  /** Chấm phiếu nhận xét cho cả cuộc trò chuyện tới giờ. */
  const makeReport = async (list: ChatMsg[]) => {
    const mine = list.filter((m) => m.role === "user");
    if (mine.length < 2) return;
    const metrics = chatMetrics(mine.map((m) => ({ content: m.content, checked: m.checked, corrected: !!m.correction })));
    const at = convAt.current;
    setReport({ ai: null, metrics, loading: true, offline: false, turnsAt: mine.length });
    const ai: ReportAI | null = await fetchReport({
      npc: ch.npc,
      topic: ch.chat.topic,
      level: ch.level,
      history: list.map((m) => ({ role: m.role, content: m.content })),
      fixes: mine.filter((m) => m.correction).map((m) => ({ said: m.content, fixed: m.correction!.fixed, tag: m.correction!.tag })),
    });
    if (convAt.current !== at) return; // đã sang cuộc trò chuyện khác
    setReport({ ai, metrics, loading: false, offline: !ai, turnsAt: mine.length });
    if (ai) {
      saveReport({ at, ch: ch.id, npc: ch.npc, mode, f: ai.scores.fluency, a: ai.scores.accuracy, r: ai.scores.range, i: ai.scores.interaction, cefr: ai.cefr, turns: metrics.turns, words: Math.round(metrics.avgWords * 10) });
      sfx.win();
    }
  };

  /** Bỏ qua chuyện cũ: cư dân quên luôn và mở lời như bình thường. */
  const skipRecall = () => {
    if (!recall) return;
    forgetMemory(recall.id);
    setRecall(null);
    stopSpeaking();
    setMsgs([{ id: 0, role: "assistant", content: ch.chat.opener }]);
    speak(ch.chat.opener, { who: ch.npc });
  };

  useEffect(() => {
    // Chỉ cuộn khung tin nhắn, không kéo cả trang (trên điện thoại thấp, ô nhập vẫn nằm yên).
    const box = endRef.current?.parentElement;
    box?.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  const fixes = msgs.filter((m) => m.role === "user" && m.correction);
  const suggestions = useMemo(() => ch.turns.map((t) => t.options.find((o) => o.ok)!.en), [ch]);
  const unlockedChapters = CHAPTERS.filter((c) => isUnlocked(s, c.id));

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    const ideas = ideaCount(content);
    const repair = isRepair(content);
    const userMsg: ChatMsg = { id: idRef.current++, role: "user", content, ideas, repair };
    if (ideas >= 3 && bonus.current.long < 3) {
      bonus.current.long++;
      addXP(5);
      sfx.coin();
      setTaskToast("🔥 Nói 3 ý liền: ý chính + lý do + chi tiết! +5 XP");
    } else if (repair && bonus.current.repair < 3) {
      bonus.current.repair++;
      addXP(3);
      sfx.coin();
      setTaskToast("🛟 Hỏi lại khéo lắm! Không hiểu thì hỏi, đó là kỹ năng cứu nguy.");
    }
    const history = msgs.map((m) => ({ role: m.role, content: m.content }));
    setMsgs((m) => [...m, userMsg]);
    setInput("");
    setBusy(true);
    addChatTurn();
    checkTasks(content);
    const nTurns = turns + 1;
    setTurns(nTurns);
    if (recall && nTurns === 1) markMemoryUsed(recall.id);
    const sentPractice = practice.current;
    try {
      const res = await fetch("/api/island-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          npcName: npc.name,
          persona: ch.chat.persona,
          topic: ch.chat.topic,
          level: ch.level,
          history,
          message: content,
          twist: twistOn && plan ? plan.twist.instruction : undefined,
          about: aboutLearner(profile),
          memories: recentFacts(s.memories),
          practice: sentPractice,
          mode,
          adapt,
          tricky,
        }),
      });
      const data = (await res.json()) as { reply: string; correction: { fixed: string; note: string; tag?: ErrorTag } | null; praise?: number | null; offline?: boolean };
      setOffline(!!data.offline);
      if (!data.offline && data.correction?.fixed) addFix(content, data.correction.fixed, data.correction.note || "", ch.id, data.correction.tag);
      const won = typeof data.praise === "number" ? sentPractice[data.praise] : undefined;
      if (!data.offline && won) {
        // Câu từng sai giờ nói đúng: đẩy thẻ Sổ lỗi sai lên, không "gài" câu này nữa trong cuộc trò chuyện.
        praiseFix(won.fixed);
        practice.current = practice.current.filter((p) => p !== won);
        sfx.coin();
        setTaskToast("🎯 Câu từng nói sai, giờ bạn nói đúng rồi!");
        setMsgs((m) => m.map((x) => (x.id === userMsg.id ? { ...x, praised: won } : x)));
      }
      setMsgs((m) => [
        ...m.map((x) => (x.id === userMsg.id ? { ...x, correction: data.offline ? undefined : data.correction, checked: !data.offline } : x)),
        { id: idRef.current++, role: "assistant", content: data.reply },
      ]);
      // Ghi nhớ sớm ở lượt 3 (phòng khi đóng tab), rồi mỗi 5 lượt.
      const full: ChatMsg[] = [...msgs, { ...userMsg, correction: data.offline ? undefined : data.correction, checked: !data.offline }, { id: -1, role: "assistant", content: data.reply }];
      if (nTurns === 3 || nTurns % GOAL === 0) remember(ch.npc, ch.id, ch.chat.topic, full, true);
      // Đủ 5 lượt: tự chấm phiếu nhận xét (một lần; sau đó người học bấm "Chấm lại").
      if (nTurns === GOAL && !data.offline) makeReport(full);
      speak(data.reply, { who: ch.npc });
    } catch {
      setOffline(true);
      setMsgs((m) => [...m, { id: idRef.current++, role: "assistant", content: "Sorry, I didn't catch that. Could you say it again?" }]);
    } finally {
      setBusy(false);
    }
    if (nTurns >= GOAL && !rewarded) {
      setRewarded(true);
      markChatDone();
      if (s.chapters[ch.id]?.lesson && !s.chapters[ch.id]?.chat) {
        completeMission(ch.id, "chat", 30);
        addXP(30);
        import("@/lib/confetti").then((m) => m.fireCelebration()).catch(() => {});
        const note = unlockNote(getIsland(), ch.id);
        if (note) setTaskToast(note);
      }
    }
  };

  const onMic = async () => {
    if (listening) return stop();
    const text = await listen();
    if (text.trim()) send(text);
  };

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-4 h-[calc(100dvh-3.5rem-2rem)] md:h-[calc(100dvh-4rem-1rem)] min-h-[560px]">
      {/* Đầu trang */}
      <div className="flex items-center gap-3">
        <BackLink />
        <Avatar who={ch.npc} size={50} />
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-2xl font-extrabold leading-tight">Tám chuyện với {npc.name}</h1>
          <p className="text-[13px] sm:text-sm font-semibold text-[#6B4A30] leading-snug line-clamp-2">
            Chủ đề: {ch.chat.topic} · {ch.level}
          </p>
        </div>
        <div className="cci-card-wood px-3 h-11 flex items-center gap-1.5 shrink-0" title="Số lượt bạn đã nói">
          {turns >= GOAL ? <Check className="w-5 h-5 text-[#3F7A34]" strokeWidth={3} /> : <Sparkles className="w-4 h-4 text-[#C99A1E]" />}
          <span className="font-baloo font-extrabold">
            {Math.min(turns, GOAL)}/{GOAL}
          </span>
        </div>
      </div>

      {/* Chọn chủ đề */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {unlockedChapters.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => router.replace(`/island/chat?ch=${c.id}`)}
            className={cx("cci-btn !min-h-[36px] !text-[13px] !rounded-full shrink-0 !px-3", c.id === ch.id && "cci-btn-primary")}
          >
            Ch.{c.id} {c.chat.topic}
          </button>
        ))}
      </div>

      {/* Nhiệm vụ trong cuộc trò chuyện */}
      {plan && (
        <div className="cci-card !shadow-none !border-2 px-3 py-2.5 flex flex-col gap-2">
          <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 sm:flex-wrap sm:overflow-visible">
            <span className="font-baloo font-extrabold flex items-center gap-1.5 shrink-0">
              <ListChecks className="w-4 h-4" /> Nhiệm vụ
            </span>
            {plan.tasks.map((t, i) => {
              const ok = !!s.chatTasks[`${ch.id}:${i}`];
              return (
                <span key={t.vi} className={cx("text-[13px] font-bold px-2.5 py-1 rounded-full border-2 inline-flex items-center gap-1 shrink-0 whitespace-nowrap", ok ? "bg-[#EAF3DC] border-[#6FAE4F] text-[#2C5A25]" : "bg-white border-[#D8BF92] text-[#6B4A30]")}>
                  {ok ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <span className="w-3 h-3 rounded-full border-2 border-[#D8BF92]" />}
                  {t.vi}
                </span>
              );
            })}
          </div>
          <label className="flex items-start gap-2 text-[13px] font-bold text-[#6B4A30] cursor-pointer select-none leading-snug">
            <input type="checkbox" checked={twistOn} onChange={(e) => setTwistOn(e.target.checked)} className="w-4 h-4 mt-0.5 shrink-0 accent-[#3F7A34]" />
            <span>
              <Zap className="inline w-3.5 h-3.5 -mt-0.5 text-[#C99A1E]" /> Tình huống bất ngờ: <span className="font-semibold">{plan.twist.vi}</span>
            </span>
          </label>
        </div>
      )}
      {taskToast && (
        <div className="fixed inset-x-0 top-20 z-50 flex justify-center px-3 pointer-events-none">
          <div className="max-w-md rounded-[20px] px-4 py-2 bg-[#3F7A34] text-white font-extrabold border-[3px] border-[#2C5A25] shadow-[0_4px_0_#2C5A25] anim-pop">{taskToast}</div>
        </div>
      )}

      {/* Tin nhắn */}
      <div className="cci-card flex-1 min-h-[260px] overflow-y-auto p-3 sm:p-4 flex flex-col gap-3">
        {recall && (
          <div className="flex items-start gap-2 rounded-xl px-3 py-2 bg-[#EAF5FB] border-2 border-[#9CCBE0] text-[13px] font-bold text-[#24566B] anim-pop">
            <span className="shrink-0" aria-hidden>
              💭
            </span>
            <span className="flex-1 min-w-0 leading-snug">
              {recallNoteVi(recall, npc.name, npcName(recall.npc))}{" "}
              <Link href="/island/me#memories" className="underline underline-offset-2 font-extrabold">
                Cư dân nhớ gì về bạn?
              </Link>
            </span>
            {turns === 0 && (
              <button type="button" onClick={skipRecall} className="shrink-0 -m-1 p-1 rounded-full hover:bg-white/70" aria-label="Quên chuyện này, mở lời như bình thường" title="Quên chuyện này">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        <div className="text-center text-xs font-bold text-[#6B4A30] bg-[#FBF3E2] rounded-xl px-3 py-2 flex flex-col items-center gap-1.5">
          <div role="radiogroup" aria-label="Cách sửa lỗi" className="inline-flex rounded-full bg-white border-2 border-[#E6CF9A] p-0.5">
            {(
              [
                ["flow", "Nói thoải mái"],
                ["fix", "Sửa ngay"],
              ] as [FixMode, string][]
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={mode === k}
                onClick={() => chooseMode(k)}
                className={cx("px-3 py-1 rounded-full text-xs font-extrabold transition-colors", mode === k ? "bg-[#3F7A34] text-white" : "text-[#6B4A30] hover:bg-[#FBF3E2]")}
              >
                {label}
              </button>
            ))}
          </div>
          <span>
            {mode === "flow"
              ? `Cứ nói tự nhiên, đừng sợ sai. ${npc.name} sẽ khéo nhắc lại câu đúng trong lời đáp, còn lỗi được gom vào phiếu nhận xét sau ${GOAL} lượt.`
              : `Nói tự do bằng tiếng Anh. Câu nào chưa tự nhiên, ${npc.name} sửa ngay dưới câu của bạn.`}
            {!s.chapters[ch.id]?.lesson && " (Học xong bài học chương này để tính nhiệm vụ ngày 4.)"}
          </span>
          <span className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
              <input type="checkbox" checked={tricky} onChange={(e) => setTricky(e.target.checked)} className="w-4 h-4 accent-[#3F7A34]" />
              🛟 {npc.name} thỉnh thoảng dùng từ khó (tập hỏi lại khi không hiểu)
            </label>
            {adapt !== 0 && <span className="text-[#2C5A25]">· {ADAPT_VI[adapt]}</span>}
          </span>
        </div>
        {msgs.map((m) =>
          m.role === "assistant" ? (
            <div key={m.id} className="flex items-end gap-2 anim-pop">
              <Avatar who={ch.npc} size={36} />
              <div className="max-w-[80%] rounded-[18px] rounded-bl-[4px] px-4 py-2.5 bg-white border-[3px] border-[#8B5E3C]">
                <p className="font-bold text-[16px] leading-snug">{m.content}</p>
                <button type="button" onClick={() => speak(m.content, { who: ch.npc })} className="mt-1 text-xs font-extrabold text-[#3F7A34] inline-flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5" /> Nghe lại
                </button>
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex flex-col items-end gap-1.5 anim-pop">
              <div className="max-w-[80%] rounded-[18px] rounded-br-[4px] px-4 py-2.5 border-[3px] border-[#6FAE4F] bg-[#EAF3DC]">
                <p className="font-bold text-[16px] leading-snug">{m.content}</p>
              </div>
              {((m.ideas || 0) >= 2 || m.repair) && (
                <span className="text-xs font-extrabold text-[#A4521D] inline-flex items-center gap-2">
                  {(m.ideas || 0) >= 3 ? "🔥 3 ý liền" : (m.ideas || 0) >= 2 ? "🔥 Câu có ý" : null}
                  {m.repair && <span className="text-[#24566B]">🛟 Cứu nguy</span>}
                </span>
              )}
              {m.praised && (
                <div className="max-w-[85%] rounded-[14px] px-3 py-1.5 bg-[#FFF4CC] border-2 border-[#E2B93B] text-[13px] font-bold text-[#6B4A10] leading-snug">
                  🎯 Lần trước bạn nói <span className="line-through decoration-[#C96A2B]/70">{m.praised.said}</span>, giờ đã nói đúng!
                </div>
              )}
              {mode === "flow" ? null : m.correction ? (
                <div className="max-w-[85%] rounded-[14px] px-3 py-2 bg-[#FDEEDD] border-2 border-[#E0A26E]">
                  <div className="text-xs font-extrabold text-[#A4521D] flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5" /> Nói tự nhiên hơn{m.correction.tag && m.correction.tag !== "other" ? ` · ${TAG_VI[m.correction.tag]}` : ""}:
                  </div>
                  <button type="button" onClick={() => speak(m.correction!.fixed, { who: "bo" })} className="text-left font-extrabold text-[15px] text-[#4A3222]">
                    {m.correction.fixed} <Volume2 className="inline w-3.5 h-3.5" />
                  </button>
                  {m.correction.note && <div className="text-[13px] font-semibold text-[#6B4A30]">{m.correction.note}</div>}
                </div>
              ) : (
                m.checked && (
                  <span className="text-xs font-extrabold text-[#2C5A25] inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" strokeWidth={3} /> Câu tự nhiên
                  </span>
                )
              )}
            </div>
          ),
        )}
        {busy && (
          <div className="flex items-end gap-2">
            <Avatar who={ch.npc} size={36} />
            <div className="rounded-[18px] px-4 py-3 bg-white border-[3px] border-[#8B5E3C] flex gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-2 h-2 rounded-full bg-[#8B5E3C] anim-floaty" style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }} />
              ))}
            </div>
          </div>
        )}
        {turns >= GOAL && (
          <div className="self-center text-center rounded-[16px] px-4 py-2 bg-[#EAF3DC] border-2 border-[#3F7A34] font-bold text-[#2C5A25] anim-pop">
            🎉 Xong {GOAL} lượt! Bạn có thể tám tiếp bao lâu tuỳ thích.
          </div>
        )}
        {turns >= GOAL && !report && !busy && (
          <button type="button" className="cci-btn cci-btn-primary self-center" onClick={() => makeReport(msgs)}>
            Xem phiếu nhận xét
          </button>
        )}
        {report && (
          <ReportCard
            view={report}
            npcName={npc.name}
            turns={turns}
            trend={report.ai ? trend(s.reports.filter((r) => r.at !== convAt.current), report.ai.scores) : { fluency: 0, accuracy: 0, range: 0, interaction: 0 }}
            tags={topTags(fixCards(s)).filter((t) => t.count >= 2)}
            praiseLine={(() => {
              const q = report.ai?.praise.quote.toLowerCase().replace(/[.!?]+$/, "");
              const hit = q ? fixes.find((m) => m.content.toLowerCase().includes(q)) : undefined;
              return hit?.correction?.fixed;
            })()}
            onRefresh={() => makeReport(msgs)}
          />
        )}
        {report?.ai && <RetellCard key={convAt.current} npcName={npc.name} level={ch.level} history={msgs.map((m) => ({ role: m.role, content: m.content }))} onDone={(sc) => sc >= 3 && addXP(15)} />}
        {turns >= GOAL && fixes.length > 0 && (
          <div className="self-stretch rounded-[18px] border-[3px] border-[#E0A26E] bg-[#FFF6EA] px-4 py-3 flex flex-col gap-2 anim-pop">
            <div className="font-baloo font-extrabold text-lg leading-tight flex items-center gap-2">
              <NotebookPen className="w-5 h-5 text-[#A4521D]" /> {mode === "flow" ? `Lỗi trong buổi: ${fixes.length} câu` : `Tổng kết: ${fixes.length} câu cần nói lại`}
            </div>
            <ul className="flex flex-col gap-1.5">
              {fixes.map((m) => (
                <li key={m.id} className="text-sm leading-snug">
                  <span className="block font-semibold text-[#A4521D] line-through decoration-[#C96A2B]/60">{m.content}</span>
                  <button type="button" data-sfx="none" onClick={() => speak(m.correction!.fixed, { who: "you" })} className="text-left font-extrabold">
                    {m.correction!.fixed} <Volume2 className="inline w-3.5 h-3.5 text-[#3F7A34]" />
                  </button>
                  {m.correction!.note && (
                    <span className="block text-[13px] font-semibold text-[#6B4A30]">
                      {m.correction!.tag && m.correction!.tag !== "other" && <b className="text-[#A4521D]">{TAG_VI[m.correction!.tag]}: </b>}
                      {m.correction!.note}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <Link href="/island/phrases?fix=1" data-sfx="whoosh" className="cci-btn cci-btn-primary self-start">
              Luyện nói lại {fixes.length} câu này
            </Link>
            <span className="text-xs font-semibold text-[#6B4A30]">Các câu này đã vào Sổ lỗi sai và sẽ quay lại đúng lúc bạn sắp quên.</span>
          </div>
        )}
        {turns >= GOAL && <NextStep />}
        <div ref={endRef} />
      </div>

      {offline && (
        <p className="text-xs font-bold text-[#A4521D] -mt-2">AI đang tạm ngoại tuyến nên {npc.name} trả lời bằng câu mẫu và chưa sửa lỗi được. Bạn vẫn có thể luyện nói tiếp.</p>
      )}

      {/* Gợi ý */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 items-center">
        <span className="text-xs font-extrabold text-[#6B4A30] shrink-0">Bí câu?</span>
        {[...suggestions, RESCUE_BAG[0].en].map((t) => (
          <button key={t} type="button" onClick={() => setInput(t)} className="cci-chip shrink-0 !text-[13px] hover:bg-[#EAD9B8]">
            {t}
          </button>
        ))}
      </div>

      {/* Ô nhập */}
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
            onClick={onMic}
            className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-white"
            style={{ background: listening ? "#C96A2B" : "#3F7A34", border: `3px solid ${listening ? "#A4521D" : "#2C5A25"}`, boxShadow: `0 3px 0 ${listening ? "#A4521D" : "#2C5A25"}` }}
            aria-label={listening ? "Dừng ghi âm" : "Nói"}
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
        <input
          value={listening ? interim : input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={listening ? "Đang nghe..." : "Gõ hoặc bấm mic để nói…"}
          className="flex-1 min-w-0 h-12 rounded-[16px] border-[3px] border-[#8B5E3C] bg-white px-4 font-semibold outline-none focus:border-[#3F7A34]"
          disabled={listening}
        />
        <button type="submit" className="cci-btn cci-btn-primary !h-12 !w-12 !p-0 shrink-0" disabled={busy || !input.trim()} aria-label="Gửi">
          <Send className="w-5 h-5" />
        </button>
      </form>
      {error && <p className="text-xs font-bold text-[#A4521D] -mt-2">{error}</p>}
    </div>
  );
}

export default function IslandChatPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
