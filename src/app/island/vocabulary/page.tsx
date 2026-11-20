"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, BookOpen, Check, Lightbulb, Mic, Volume2 } from "lucide-react";
import { Avatar } from "@/components/island/character";
import { BackLink, cx } from "@/components/island/ui";
import { CHAPTERS, NPCS } from "@/lib/island/curriculum";
import { currentChapterId, isUnlocked, reviewSpeakingChunk, today, useIsland } from "@/lib/island/progress";
import { speak, stopSpeaking, useListen } from "@/lib/island/speech";
import { includesSpeakingChunk, vocabularyFor, VOCABULARY_COUNT, type SpeakingChunk } from "@/lib/island/vocabulary";

interface Session {
  chapter: number;
  cards: SpeakingChunk[];
  index: number;
  remembered: number;
}

function Practice() {
  const state = useIsland();
  const params = useSearchParams();
  const [selected, setSelected] = useState<number>();
  const [session, setSession] = useState<Session>();
  const [previewIndex, setPreviewIndex] = useState<number>();
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<"remembered" | "review" | null>(null);
  const { supported, listening, interim, error, listen, stop } = useListen();
  const unlocked = CHAPTERS.filter((chapter) => isUnlocked(state, chapter.id));
  const requested = selected ?? Number(params.get("ch"));
  const chapter = unlocked.find((item) => item.id === (session?.chapter ?? requested)) ?? CHAPTERS.find((item) => item.id === currentChapterId(state))!;
  const deck = vocabularyFor(chapter.id);
  const todayDate = today();
  const due = (item: SpeakingChunk) => Boolean(state.words[item.en] && state.words[item.en].due <= todayDate);
  const fresh = (item: SpeakingChunk) => !state.words[item.en];
  const available = [...deck.filter(due), ...deck.filter(fresh)];
  const card = session?.cards[session.index];
  const introductions = session?.cards.filter(fresh) ?? [];
  const preview = previewIndex === undefined ? undefined : introductions[previewIndex];

  useEffect(() => () => stopSpeaking(), []);

  function start() {
    const cards = (available.length ? available : deck).slice(0, 3);
    setSession({ chapter: chapter.id, cards, index: 0, remembered: 0 });
    setPreviewIndex(cards.some(fresh) ? 0 : undefined);
    setAnswer("");
    setResult(null);
  }

  function next() {
    if (!session || !card || !result) return;
    const remembered = result === "remembered";
    stopSpeaking();
    reviewSpeakingChunk(session.chapter, card.en, remembered);
    setSession({ ...session, index: session.index + 1, remembered: session.remembered + Number(remembered) });
    setAnswer("");
    setResult(null);
  }

  async function record() {
    if (listening) {
      stop();
      return;
    }
    const transcript = await listen();
    if (transcript.trim()) setAnswer(transcript.trim());
  }

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-4">
      <header className="flex items-center gap-3">
        <BackLink href="/island/words" label="Sổ từ" />
        <h1 className="font-baloo text-2xl sm:text-3xl font-extrabold leading-tight">Cụm từ giao tiếp</h1>
      </header>

      {!session ? (
        <>
          <section className="cci-card-wood p-4 sm:p-6 flex flex-col gap-4">
            <div className="flex gap-3 items-start">
              <Avatar who={chapter.npc} size={54} />
              <div>
                <h2 className="font-baloo font-extrabold text-xl sm:text-2xl leading-tight">Nhớ một cụm, tự nói một câu</h2>
                <p className="font-semibold text-[#6B4A30] mt-1">Nghe mẫu một lượt với cụm mới. Sau đó nhìn tình huống và tự nói hoặc gõ một câu dùng cụm đó.</p>
              </div>
            </div>
            <label className="flex flex-col gap-1 font-bold">
              Tình huống
              <select value={chapter.id} onChange={(e) => setSelected(Number(e.target.value))} className="min-h-12 w-full rounded-2xl bg-white px-3 border-2 border-[#8B5E3C] font-bold text-[#4A3222]">
                {unlocked.map((item) => <option key={item.id} value={item.id}>Chương {item.id} · {item.title}</option>)}
              </select>
            </label>
            <p className="text-sm font-bold text-[#6B4A30]">{deck.filter(fresh).length} cụm mới · {deck.filter(due).length} đến hạn · {VOCABULARY_COUNT} cụm trong lộ trình</p>
            <button type="button" className="cci-btn cci-btn-primary self-start" onClick={start}>
              Luyện {Math.min(available.length || deck.length, 3)} cụm <ArrowRight className="w-4 h-4" />
            </button>
          </section>
          <p className="text-sm font-semibold text-[#6B4A30]">Bạn có thể dùng bất kỳ câu nào chứa cụm đang luyện.</p>
        </>
      ) : preview && previewIndex !== undefined ? (
        <section className="cci-card-wood p-4 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <span className="cci-chip !text-xs">Làm quen cụm mới</span>
            <span className="font-extrabold text-sm">{previewIndex + 1}/{introductions.length}</span>
          </div>
          <div className="rounded-2xl bg-[#EAF3DC] border-2 border-[#6FAE4F] p-4">
            <h2 className="font-baloo text-2xl font-extrabold">{preview.en}</h2>
            <p className="font-semibold text-[#6B4A30]">{preview.vi}</p>
            <p className="font-bold mt-2">{preview.ex}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" data-sfx="none" className="cci-btn" onClick={() => speak(preview.ex, { who: chapter.npc, speed: "slow" })}><Volume2 className="w-4 h-4" /> Nghe câu mẫu</button>
            <button type="button" className="cci-btn cci-btn-primary" onClick={() => {
              stopSpeaking();
              setPreviewIndex(previewIndex + 1 < introductions.length ? previewIndex + 1 : undefined);
            }}>{previewIndex + 1 < introductions.length ? "Cụm mới tiếp theo" : "Tự đặt câu"} <ArrowRight className="w-4 h-4" /></button>
          </div>
        </section>
      ) : card ? (
        <section className="cci-card-wood p-4 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="cci-chip !text-xs">{chapter.title}</span>
            <span className="ml-auto font-extrabold text-sm" aria-label="Tiến độ lượt luyện">{session.index + 1}/{session.cards.length}</span>
          </div>
          <div>
            <h2 className="font-baloo font-extrabold text-2xl leading-tight">{card.prompt}</h2>
            <p className="mt-1 text-sm font-semibold text-[#6B4A30]">Cụm cần nhớ có nghĩa là “{card.vi}”.</p>
          </div>
          {result ? (
            <>
              <div className={cx("rounded-2xl px-4 py-3 border-2", result === "remembered" ? "bg-[#EAF3DC] border-[#6FAE4F]" : "bg-[#FFF2D2] border-[#C49A48]")} role="status">
                <p className="font-bold">{result === "remembered" ? "Bạn đã dùng đúng cụm!" : "Thử nói theo mẫu rồi đổi chi tiết cho hợp với bạn."}</p>
                <p className="font-baloo text-xl font-extrabold mt-1">{card.en}</p>
                <p className="text-sm font-semibold text-[#6B4A30]">{card.ex}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" data-sfx="none" className="cci-btn" onClick={() => speak(card.ex, { who: chapter.npc, speed: "slow" })}><Volume2 className="w-4 h-4" /> Nghe câu mẫu</button>
                <button type="button" className="cci-btn cci-btn-primary" onClick={next}>{session.index + 1 === session.cards.length ? "Xong lượt luyện" : "Cụm tiếp theo"} <ArrowRight className="w-4 h-4" /></button>
              </div>
            </>
          ) : (
            <form className="flex flex-col gap-3" onSubmit={(event) => {
              event.preventDefault();
              if (answer.trim() && !listening) setResult(includesSpeakingChunk(answer, card.en) ? "remembered" : "review");
            }}>
              <label className="flex flex-col gap-1 font-bold">
                Câu của bạn
                <textarea value={listening ? interim || answer : answer} onChange={(event) => setAnswer(event.target.value)} disabled={listening} maxLength={300} rows={2} placeholder="Nói hoặc gõ bằng tiếng Anh…" className="border-2 border-[#8B5E3C] rounded-2xl px-3 py-2 bg-white" />
              </label>
              {error && <p className="text-sm font-bold text-[#A4521D]" role="status">{error} Bạn có thể gõ câu bên trên.</p>}
              <div className="flex flex-wrap gap-2">
                {supported && <button type="button" className="cci-btn" onClick={record}><Mic className="w-4 h-4" /> {listening ? "Dừng nghe" : "Bấm để nói"}</button>}
                <button type="submit" className="cci-btn cci-btn-primary" disabled={!answer.trim() || listening}>Kiểm tra cụm từ</button>
                <button type="button" className="cci-btn" disabled={listening} onClick={() => setResult("review")}><Lightbulb className="w-4 h-4" /> Xem mẫu</button>
              </div>
            </form>
          )}
        </section>
      ) : (
        <section className="cci-card-wood p-4 sm:p-6 flex flex-col gap-4">
          <h2 className="font-baloo font-extrabold text-2xl flex items-center gap-2"><Check className="text-[#3F7A34]" /> Xong lượt luyện!</h2>
          <p className="font-semibold text-[#6B4A30]">Bạn tự dùng đúng {session.remembered}/{session.cards.length} cụm trong lượt này. Sổ từ đã cập nhật lịch ôn.</p>
          <p className="font-semibold">Thử dùng ít nhất một cụm vừa học trong cuộc trò chuyện với {NPCS[chapter.npc].name}.</p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/island/chat?ch=${chapter.id}`} className="cci-btn cci-btn-primary">Tám với {NPCS[chapter.npc].name} <ArrowRight className="w-4 h-4" /></Link>
            <button type="button" className="cci-btn" onClick={() => setSession(undefined)}>Luyện thêm</button>
            <Link href="/island/words" className="cci-btn"><BookOpen className="w-4 h-4" /> Xem Sổ từ</Link>
          </div>
        </section>
      )}
    </div>
  );
}

export default function VocabularyPage() {
  return <Suspense fallback={null}><Practice /></Suspense>;
}
