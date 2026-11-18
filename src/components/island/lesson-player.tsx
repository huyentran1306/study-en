"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, Crown, Ear, Gamepad2, LifeBuoy, Lock, MessageCircle, Mic, Repeat, Sparkles } from "lucide-react";
import { personalizeDeep } from "@/lib/island/me";
import { CHAPTERS, NPCS, getChallenge, getChapter, type Chapter } from "@/lib/island/curriculum";
import { completeChallenge, completeMission, isChallengeUnlocked, isUnlocked, useIsland } from "@/lib/island/progress";
import { useGame } from "@/contexts/game-context";
import { Character } from "./character";
import { BuilderGame, DialogueStep, ListenOnly, MatchGame, QuickReview, WordsStep } from "./lesson-steps";
import { Roleplay, type RpTurn } from "./roleplay";
import { CloseLink, Segments, Stars } from "./ui";
import { sfx } from "@/lib/island/sfx";
import { NextStep } from "./journey";

export type LessonMode = "lesson" | "listen" | "speak" | "challenge";

const STEPS = [
  { key: "words", name: "Từ mới", mins: "2 phút", icon: BookOpen },
  { key: "dialogue", name: "Nghe hội thoại mẫu", mins: "1 phút", icon: Ear },
  { key: "games", name: "Luyện bằng trò chơi", mins: "3 phút", icon: Gamepad2 },
  { key: "roleplay", name: "Nhập vai", mins: "2 phút · nói", icon: MessageCircle },
  { key: "rescue", name: "Câu cứu nguy", mins: "1 phút", icon: LifeBuoy },
  { key: "review", name: "Ôn nhanh", mins: "1 phút", icon: Repeat },
] as const;

function turnsOf(ch: Chapter): RpTurn[] {
  return ch.turns.map((t) => ({ ...t, npc: ch.npc, scene: ch.scene, level: ch.level, ch: ch.id }));
}
function rescueOf(ch: Chapter): RpTurn {
  return {
    npc: ch.npc,
    scene: ch.scene,
    npcLine: ch.rescue.fast,
    npcVi: ch.rescue.fastVi,
    hints: [],
    options: ch.rescue.options,
    rescue: { slow: ch.rescue.slow, slowVi: ch.rescue.slowVi },
  };
}

function starsFor(ratio: number) {
  return ratio >= 0.85 ? 3 : ratio >= 0.55 ? 2 : 1;
}

function fire() {
  import("@/lib/confetti").then((m) => m.fireCelebration()).catch(() => {});
}

interface RewardInfo {
  stars: number;
  xp: number;
  title: string;
  lines: string[];
  npc: Chapter["npc"];
}

export function LessonPlayer({ id, mode: rawMode }: { id: string; mode: LessonMode }) {
  const island = useIsland();
  const { addXP } = useGame();
  const challenge = id.startsWith("c") ? getChallenge(id) : undefined;
  // Thay tên/quê/nghề mẫu bằng Hồ sơ của tôi (chỉ lúc hiển thị; tiến độ vẫn lưu theo nội dung gốc).
  const profile = island.profile;
  const chapter = useMemo(() => (challenge ? undefined : personalizeDeep(getChapter(Number(id)), profile)), [challenge, id, profile]);
  const mode: LessonMode = challenge ? "challenge" : rawMode;

  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [gamePhase, setGamePhase] = useState<"match" | "builder">("match");
  const [score, setScore] = useState({ rp: 0, rpTotal: 3, rescue: 0, review: 0, reviewTotal: 4, rescueOk: false });
  const [reward, setReward] = useState<RewardInfo | null>(null);
  const [rpIdx, setRpIdx] = useState(0);

  const challengeTurns = useMemo<RpTurn[]>(() => {
    if (!challenge) return [];
    return challenge.chapters.flatMap((cid) => {
      const ch = personalizeDeep(getChapter(cid)!, profile);
      const t = turnsOf(ch);
      return [t[0], t[2]];
    });
  }, [challenge, profile]);

  useEffect(() => {
    if (reward) sfx.win();
  }, [reward]);

  if (!chapter && !challenge) {
    return (
      <Center>
        <p className="font-bold">Không tìm thấy bài học này.</p>
        <Link href="/island/path" className="cci-btn cci-btn-primary">
          Về lộ trình
        </Link>
      </Center>
    );
  }

  const locked = challenge ? !isChallengeUnlocked(island, challenge.id) : !isUnlocked(island, chapter!.id);
  if (locked) {
    return (
      <Center>
        <div className="w-16 h-16 rounded-2xl bg-[#F3E4C6] border-[3px] border-[#8B5E3C] flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold">Khu này chưa mở</h1>
        <p className="font-semibold text-[#6B4A30] max-w-md">
          {challenge
            ? "Hoàn thành bài học của tất cả các chương trong cấp này để mở thử thách cuối cấp."
            : "Hoàn thành bài học của chương trước để mở chương này, hoặc làm bài kiểm tra xếp lớp để nhảy cấp."}
        </p>
        <div className="flex gap-2 flex-wrap justify-center">
          <Link href="/island/path" className="cci-btn cci-btn-primary">
            Xem lộ trình
          </Link>
          <Link href="/island/placement" className="cci-btn">
            Kiểm tra xếp lớp
          </Link>
        </div>
      </Center>
    );
  }

  // ───── Hoàn thành ─────
  const finishLesson = (reviewFirst: number, reviewTotal: number) => {
    const ch = chapter!;
    const got = score.rp + (score.rescueOk ? 1 : 0) + reviewFirst;
    const total = score.rpTotal + 1 + reviewTotal;
    const stars = starsFor(got / total);
    const xp = 50 + stars * 10;
    completeMission(ch.id, "lesson", xp, { stars, rescueOk: score.rescueOk });
    addXP(xp);
    fire();
    const nextCh = CHAPTERS.find((c) => c.id === ch.id + 1);
    setReward({
      stars,
      xp,
      npc: ch.npc,
      title: `Xong bài “${ch.title}”!`,
      lines: [
        `Trả lời đúng ngay lần đầu: ${got}/${total}`,
        `${ch.words.length} từ mới đã vào Sổ từ — ngày mai ôn lần đầu`,
        nextCh ? `Đã mở khoá Chương ${nextCh.id}: ${nextCh.title}` : "Bạn đã mở hết các chương!",
      ],
    });
  };

  const finishSimple = (key: "listen" | "speak", got: number, total: number, extra?: { rescueOk?: boolean }) => {
    const ch = chapter!;
    const stars = starsFor(got / total);
    const xp = key === "speak" ? 30 : 20;
    completeMission(ch.id, key, xp, extra?.rescueOk ? { rescueOk: true } : {});
    addXP(xp);
    fire();
    setReward({
      stars,
      xp,
      npc: ch.npc,
      title: key === "speak" ? "Nhập vai bằng giọng nói: xong!" : "Bài nghe không chữ: xong!",
      lines: [
        `Đúng ngay lần đầu: ${got}/${total}`,
        key === "speak" ? "Mẹo: nhại lại câu đúng 2–3 lần, nhấn vào từ khoá để nói tự nhiên hơn." : "Mẹo: nghe lại cả hội thoại khi đi bộ hoặc nấu ăn để quen tai.",
      ],
    });
  };

  // ───── Màn thưởng ─────
  if (reward) {
    return (
      <Shell>
        <div className="max-w-xl mx-auto cci-card-wood !rounded-[28px] p-6 sm:p-8 flex flex-col items-center gap-4 text-center anim-pop">
          <div className="w-40 rounded-[24px] pt-4 flex justify-center" style={{ background: NPCS[reward.npc].bg }}>
            <Character who={reward.npc} mood="happy" size="80%" />
          </div>
          <Stars n={reward.stars} size={44} sound />
          <h1 className="text-3xl font-extrabold leading-tight">{reward.title}</h1>
          <span className="cci-chip !bg-[#FFF1C7] !text-base">
            <Sparkles className="w-4 h-4 text-[#C99A1E]" /> +{reward.xp} XP
          </span>
          <ul className="flex flex-col gap-1.5 font-semibold text-[#6B4A30]">
            {reward.lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <NextStep />
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/island/path" className="cci-btn cci-btn-big">
              Xem lộ trình <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/island" className="cci-btn cci-btn-big">
              Về đảo
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  // ───── Thử thách cuối cấp ─────
  if (challenge) {
    const total = challengeTurns.length;
    if (!started) {
      return (
        <Shell>
          <Intro
            npc="kero"
            kicker={`Thử thách cuối cấp ${challenge.level}`}
            title={challenge.title}
            goal={`${total} lượt nhập vai liên tiếp qua ${challenge.chapters.length} khu của đảo. Không có gợi ý, không có nghĩa tiếng Việt. Sai vẫn không bị trừ điểm — bạn chỉ mất sao.`}
            items={[
              { icon: Crown, name: "Nhập vai không gợi ý", mins: `${total} lượt` },
              { icon: Mic, name: "Khuyến khích tự nói bằng mic", mins: "tuỳ chọn" },
            ]}
            onStart={() => setStarted(true)}
          />
        </Shell>
      );
    }
    return (
      <Shell>
        <TopBar title={`Thử thách · ${challenge.title}`} total={total} current={rpIdx} label={`Lượt ${rpIdx + 1}/${total}`} />
        <Roleplay
          turns={challengeTurns}
          mode="challenge"
          onProgress={setRpIdx}
          onDone={(r) => {
            const stars = starsFor(r.firstTry / r.total);
            const xp = 60 + stars * 20;
            completeChallenge(challenge.id, stars, xp);
            addXP(xp);
            fire();
            setReward({
              stars,
              xp,
              npc: "kero",
              title: `Vượt qua “${challenge.title}”!`,
              lines: [`Đúng ngay lần đầu: ${r.firstTry}/${r.total}`, r.spoke > 0 ? `Bạn đã tự nói ${r.spoke} câu — tuyệt vời!` : "Lần sau thử bấm mic để tự nói nhé!"],
            });
          }}
        />
      </Shell>
    );
  }

  const ch = chapter!;

  // ───── Chỉ nghe ─────
  if (mode === "listen") {
    if (!started)
      return (
        <Shell>
          <Intro
            npc={ch.npc}
            kicker={`Chương ${ch.id} · Nhiệm vụ ngày 2`}
            title="Chỉ nghe: Ai nói gì?"
            goal="Luyện tai không dựa vào chữ. Mỗi câu được đọc 1 lần, bạn có thể nghe lại hoặc nghe chậm."
            items={[{ icon: Ear, name: "6 câu trong hội thoại mẫu", mins: "5 phút" }]}
            onStart={() => setStarted(true)}
          />
        </Shell>
      );
    return (
      <Shell>
        <TopBar title={`Chỉ nghe · ${ch.title}`} total={1} current={0} label="Nghe không chữ" />
        <ListenOnly chapter={ch} onDone={(got, total) => finishSimple("listen", got, total)} />
      </Shell>
    );
  }

  // ───── Nhập vai bằng giọng nói ─────
  if (mode === "speak") {
    const turns = [...turnsOf(ch), rescueOf(ch)];
    if (!started)
      return (
        <Shell>
          <Intro
            npc={ch.npc}
            kicker={`Chương ${ch.id} · Nhiệm vụ ngày 3`}
            title={`Nói chuyện với ${NPCS[ch.npc].name}`}
            goal="Lần này đáp án được giấu đi. Bấm mic và nói câu trả lời — câu mẫu hay câu của riêng bạn đều được, miễn hợp tình huống. Kẹt thì bấm “Hiện 3 lựa chọn”."
            items={[
              { icon: Mic, name: "3 lượt nhập vai bằng giọng nói", mins: "5 phút" },
              { icon: LifeBuoy, name: "1 tình huống cứu nguy", mins: "1 phút" },
            ]}
            onStart={() => setStarted(true)}
          />
        </Shell>
      );
    return (
      <Shell>
        <TopBar title={`Nhập vai nói · ${ch.title}`} total={turns.length} current={rpIdx} label={`Lượt ${rpIdx + 1}/${turns.length}`} />
        <Roleplay turns={turns} mode="speak" onProgress={setRpIdx} onDone={(r) => finishSimple("speak", r.firstTry, r.total, { rescueOk: r.rescueOk })} />
      </Shell>
    );
  }

  // ───── Bài học 10 phút ─────
  if (!started) {
    return (
      <Shell>
        <Intro
          npc={ch.npc}
          kicker={`Chương ${ch.id} · ${ch.place} · Tuần ${ch.week}`}
          title={ch.title}
          goal={ch.goal}
          items={STEPS.map((s) => ({ icon: s.icon, name: s.name === "Nhập vai" ? `Nhập vai với ${NPCS[ch.npc].name}` : s.name, mins: s.mins }))}
          onStart={() => setStarted(true)}
          done={!!island.chapters[ch.id]?.lesson}
        />
      </Shell>
    );
  }

  const cur = STEPS[step];
  const go = () => setStep((s) => s + 1);

  return (
    <Shell>
      <TopBar title={ch.title} total={STEPS.length} current={step} label={`Bước ${step + 1}/6 · ${cur.name}`} />
      {cur.key === "words" && <WordsStep chapter={ch} onNext={go} />}
      {cur.key === "dialogue" && <DialogueStep chapter={ch} onNext={go} />}
      {cur.key === "games" && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold">{gamePhase === "match" ? "Ghép đôi từ & nghĩa" : "Xếp câu bento"}</h2>
            <p className="font-semibold text-[#6B4A30] mt-1">
              {gamePhase === "match" ? "Trò 1/2 · Ghép từ với nghĩa." : "Trò 2/2 · Xếp thẻ thành câu. Cẩn thận thẻ bẫy!"}
            </p>
          </div>
          {gamePhase === "match" ? <MatchGame words={ch.words} onDone={() => setGamePhase("builder")} /> : <BuilderGame items={ch.builder} onDone={go} />}
        </div>
      )}
      {cur.key === "roleplay" && (
        <Roleplay
          turns={turnsOf(ch)}
          mode="choose"
          onDone={(r) => {
            setScore((s) => ({ ...s, rp: r.firstTry, rpTotal: r.total }));
            go();
          }}
        />
      )}
      {cur.key === "rescue" && (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold">Câu cứu nguy</h2>
            <p className="font-semibold text-[#6B4A30] mt-1">Người bản xứ hay nói nhanh. Kỹ năng quan trọng nhất là biết xin nhắc lại một cách lịch sự.</p>
          </div>
          <Roleplay
            turns={[rescueOf(ch)]}
            mode="choose"
            onDone={(r) => {
              setScore((s) => ({ ...s, rescueOk: r.firstTry > 0 }));
              go();
            }}
          />
        </div>
      )}
      {cur.key === "review" && <QuickReview chapter={ch} onDone={finishLesson} />}
    </Shell>
  );
}

// ───────────── Bố cục ─────────────

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-4">{children}</div>;
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">{children}</div>;
}

function TopBar({ title, total, current, label }: { title: string; total: number; current: number; label: string }) {
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <CloseLink href="/island/path" />
      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 flex-1 min-w-0">
        <span className="font-baloo font-extrabold text-lg truncate">{title}</span>
        <Segments total={total} current={current} />
      </div>
      <span className="text-sm font-extrabold text-[#6B4A30] whitespace-nowrap hidden sm:block">{label}</span>
    </div>
  );
}

function Intro({
  npc,
  kicker,
  title,
  goal,
  items,
  onStart,
  done,
}: {
  npc: Chapter["npc"];
  kicker: string;
  title: string;
  goal: string;
  items: { icon: React.ElementType; name: string; mins: string }[];
  onStart: () => void;
  done?: boolean;
}) {
  return (
    <div className="max-w-2xl w-full mx-auto flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <CloseLink href="/island/path" />
        <div>
          <div className="text-xs font-extrabold tracking-[0.08em] uppercase text-[#6B4A30]">{kicker}</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">{title}</h1>
        </div>
      </div>
      <div className="cci-card-wood !rounded-[24px] p-4 sm:p-5 flex items-center gap-4" style={{ background: "#F3E4C6" }}>
        <div className="w-24 sm:w-28 shrink-0">
          <Character who={npc} mood="wave" size="100%" />
        </div>
        <div>
          <div className="text-xs font-extrabold tracking-[0.1em] uppercase text-[#3F7A34]">Sau bài này bạn sẽ</div>
          <p className="font-bold text-[16px] leading-snug mt-1">{goal}</p>
          {done && <span className="cci-chip !bg-[#EAF3DC] !text-[#2C5A25] mt-2">Đã học · học lại để lấy thêm sao</span>}
        </div>
      </div>
      <ol className="flex flex-col gap-2.5">
        {items.map((it, i) => (
          <li key={it.name} className="cci-card !shadow-none !border-2 flex items-center gap-3 px-4 py-3">
            <span className="w-9 h-9 rounded-full border-[3px] border-[#D8BF92] bg-white flex items-center justify-center font-baloo font-extrabold">{i + 1}</span>
            <it.icon className="w-5 h-5 text-[#3F7A34]" />
            <span className="font-baloo font-extrabold text-[17px] flex-1">{it.name}</span>
            <span className="text-sm font-bold text-[#6B4A30]">{it.mins}</span>
          </li>
        ))}
      </ol>
      <button type="button" className="cci-btn cci-btn-primary cci-btn-big w-full" onClick={onStart}>
        Bắt đầu <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}
