"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookHeart, Check, MessageCircle, RefreshCw, Sparkles, Volume2 } from "lucide-react";
import { Avatar } from "@/components/island/character";
import { BackLink, cx } from "@/components/island/ui";
import { aboutLearner, hasProfile } from "@/lib/island/me";
import { recentFacts } from "@/lib/island/memory";
import { TAG_VI, topTags } from "@/lib/island/feedback";
import { addLifePhrases, currentChapterId, fixCards, markBuilt, useIsland } from "@/lib/island/progress";
import { CHAPTERS } from "@/lib/island/curriculum";
import { speak } from "@/lib/island/speech";
import { sfx } from "@/lib/island/sfx";

type Lesson = { title: string; phrases: { en: string; vi: string }[]; dialogue: { who: "friend" | "you"; en: string; vi: string }[]; task: string };
const KEY = "cci-my-lesson";

/** Bài học của tôi: AI soạn bài từ hồ sơ + chuyện cư dân nhớ (lưu trong máy, soạn lại khi muốn). */
export default function MyLessonPage() {
  const s = useIsland();
  const [mounted, setMounted] = useState(false);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [added, setAdded] = useState<number | null>(null);
  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLesson(JSON.parse(raw) as Lesson);
    } catch {
      /* bỏ qua */
    }
  }, []);

  const facts = mounted ? recentFacts(s.memories, 8) : [];
  const can = mounted && (hasProfile(s.profile) || facts.length > 0);
  const level = CHAPTERS.find((c) => c.id === currentChapterId(s))?.level || "A2";

  const build = async () => {
    setBusy(true);
    setErr(null);
    setAdded(null);
    try {
      const weak = topTags(fixCards(s), 1)[0];
      const r = await fetch("/api/island-mylesson", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ about: aboutLearner(s.profile), facts, level, weak: weak && weak.count >= 2 ? TAG_VI[weak.tag] : "" }) });
      const j = (await r.json()) as { lesson?: Lesson | null };
      if (!j.lesson) throw new Error("offline");
      setLesson(j.lesson);
      markBuilt("lesson");
      localStorage.setItem(KEY, JSON.stringify(j.lesson));
      sfx.win();
    } catch {
      setErr("AI đang bận, thử lại sau một chút nhé.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <BackLink href="/island?view=isle" label="Đảo Luyện" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">Bài học của tôi</h1>
          <p className="text-sm font-semibold text-[#6B4A30]">Bài học soạn riêng từ cuộc sống của bạn: hồ sơ và những chuyện bạn đã kể với cư dân. Luyện đúng những câu bạn sẽ nói ngoài đời.</p>
        </div>
      </div>

      {mounted && !can && (
        <div className="cci-card-wood p-4 font-semibold">
          Kero chưa biết gì về bạn để soạn bài. Hãy điền{" "}
          <Link href="/island/me" className="font-extrabold underline">
            Hồ sơ của tôi
          </Link>{" "}
          hoặc{" "}
          <Link href="/island/chat" className="font-extrabold underline">
            tám chuyện
          </Link>{" "}
          với cư dân về cuộc sống của bạn trước nhé.
        </div>
      )}

      {can && (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={cx("cci-btn", !lesson && "cci-btn-primary cci-btn-big gloss")} onClick={build} disabled={busy}>
            {lesson ? <RefreshCw className={cx("w-4 h-4", busy && "animate-spin")} /> : <Sparkles className="w-5 h-5" />} {busy ? "Kero đang soạn bài…" : lesson ? "Soạn bài mới" : "Soạn bài cho tôi"}
          </button>
          {facts.length > 0 && <span className="text-xs font-semibold text-[#6B4A30]">Dựa trên hồ sơ + {facts.length} chuyện bạn đã kể.</span>}
        </div>
      )}
      {err && <p className="text-sm font-bold text-[#A4521D]">{err}</p>}

      {lesson && (
        <>
          <section className="cci-card-wood p-4 sm:p-5 flex flex-col gap-3">
            <h2 className="text-xl font-extrabold leading-tight flex items-center gap-2">
              <BookHeart className="w-5 h-5 text-[#C96A2B]" /> {lesson.title}
            </h2>
            <ul className="flex flex-col gap-2">
              {lesson.phrases.map((p) => (
                <li key={p.en}>
                  <button type="button" data-sfx="none" onClick={() => speak(p.en, { who: "you" })} className="w-full text-left rounded-[16px] bg-white border-2 border-[#E6CF9A] px-3 py-2 hover:bg-[#FFFBF2]">
                    <span className="block font-baloo font-extrabold text-[17px] leading-tight">
                      {p.en} <Volume2 className="inline w-4 h-4 text-[#3F7A34]" />
                    </span>
                    <span className="block text-sm font-semibold text-[#6B4A30]">{p.vi}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="cci-btn cci-btn-primary"
                onClick={() => {
                  setAdded(addLifePhrases(lesson.phrases));
                  sfx.coin();
                }}
                disabled={added !== null}
              >
                {added !== null ? <Check className="w-4 h-4" /> : null} {added !== null ? `Đã thêm ${added} câu mới vào Sổ câu` : "Thêm vào Sổ câu để ôn"}
              </button>
              {added !== null && (
                <Link href="/island/phrases" className="cci-btn" data-sfx="whoosh">
                  Luyện ngay
                </Link>
              )}
            </div>
          </section>

          {lesson.dialogue.length > 0 && (
            <section className="cci-card p-4 flex flex-col gap-2">
              <h2 className="font-baloo font-extrabold text-lg">Hội thoại mẫu</h2>
              {lesson.dialogue.map((d, k) => (
                <div key={k} className={cx("flex items-end gap-2", d.who === "you" && "flex-row-reverse")}>
                  <Avatar who={d.who === "you" ? "bo" : "kero"} size={30} />
                  <button type="button" data-sfx="none" onClick={() => speak(d.en, { who: d.who === "you" ? "you" : "kero" })} className={cx("max-w-[80%] text-left rounded-[16px] px-3 py-2 border-[3px]", d.who === "you" ? "bg-[#EAF3DC] border-[#6FAE4F]" : "bg-white border-[#8B5E3C]")}>
                    <span className="block font-bold leading-snug">{d.en}</span>
                    <span className="block text-xs font-semibold text-[#6B4A30]">{d.vi}</span>
                  </button>
                </div>
              ))}
            </section>
          )}

          <section className="rounded-[20px] border-[3px] border-[#E0A26E] bg-[#FFF6EA] p-4 flex flex-wrap items-center gap-3">
            <span className="flex-1 min-w-0 font-bold">🎯 {lesson.task}</span>
            <Link href={`/island/chat?ch=${CHAPTERS.find((c) => c.npc === "kero")?.id || 4}`} className="cci-btn cci-btn-primary" data-sfx="whoosh">
              <MessageCircle className="w-4 h-4" /> Tám với Kero
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
