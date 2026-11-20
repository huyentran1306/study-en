"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Calendar, KeyRound, TrendingUp, Check, ChevronDown, Coffee, Crown, Ear, Flame, Hand, Lock, MessageCircle, Mic, Plane, Repeat, ShoppingBasket, Signpost, Star, Stethoscope, Phone, Utensils, PartyPopper, Frown, Briefcase, Feather, Zap, AudioLines, MessageSquareQuote, Fish, Sprout, BookHeart } from "lucide-react";
import { Avatar } from "@/components/island/character";
import { BackLink, cx } from "@/components/island/ui";
import { AccountMenu, SyncBadge } from "@/components/island/sync-badge";
import { ProfileCard, SprintCard } from "@/components/island/sprint";
import { CHALLENGES, CHAPTERS, LEVELS, MISSIONS, NPCS, TOTAL_WEEKS, missionHref, type Level } from "@/lib/island/curriculum";
import {
  calendarWeek,
  collection,
  currentChapterId,
  duePhrases,
  food,
  recentReflexSec,
  shells,
  isChallengeUnlocked,
  isUnlocked,
  KEY_MISSIONS,
  KEY_NAMES,
  missionsDone,
  restartPlan,
  skills,
  streak,
  totalStars,
  useIsland,
  weekStartDate,
} from "@/lib/island/progress";
import { usePlayerName } from "@/components/island/player-name";

const CH_ICON: Record<number, React.ElementType> = {
  1: Hand, 2: Coffee, 3: ShoppingBasket, 4: Signpost, 5: Plane, 6: Utensils, 7: Phone, 8: Stethoscope,
  9: Feather, 10: PartyPopper, 11: BookOpen, 12: Frown, 13: Briefcase,
};
const CH_BG: Record<string, string> = { cafe: "#F3E1C8", market: "#FADDE3", airport: "#D7ECF5", pond: "#E4EFC9", tree: "#FCE4EA" };
const MISSION_ICON = { lesson: BookOpen, listen: Ear, speak: Mic, chat: MessageCircle, review: Repeat, reflex: Zap, sound: AudioLines } as const;

function fmt(d: string) {
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
}

export default function IslandPathPage() {
  const s = useIsland();
  const playerName = usePlayerName(s);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const curId = currentChapterId(s);
  const cur = CHAPTERS.find((c) => c.id === curId)!;
  const [level, setLevel] = useState<Level>("A1");
  const [openId, setOpenId] = useState<number | null>(null);
  useEffect(() => {
    if (mounted) {
      setLevel(cur.level);
      setOpenId(curId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const calWeek = calendarWeek(s);
  const lessonsDone = CHAPTERS.filter((c) => s.chapters[c.id]?.lesson).length;
  const allMissions = CHAPTERS.reduce((a, c) => a + missionsDone(s, c.id), 0);
  const planPct = Math.round((allMissions / (CHAPTERS.length * MISSIONS.length)) * 100);
  const levelChapters = CHAPTERS.filter((c) => c.level === level);
  const levelPct = Math.round((levelChapters.reduce((a, c) => a + missionsDone(s, c.id), 0) / (levelChapters.length * MISSIONS.length)) * 100);
  const lvl = LEVELS.find((l) => l.id === level)!;
  const levelOpen = (l: Level) => CHAPTERS.some((c) => c.level === l && isUnlocked(s, c.id));
  const challenge = CHALLENGES.find((c) => c.level === level)!;
  const behind = cur.week < calWeek;
  const reflexSec = recentReflexSec(s);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-5">
      {/* Đầu trang */}
      <div className="flex items-center gap-3">
        <BackLink />
        <span className="hidden sm:block shrink-0">
          <Avatar who="bo" size={52} />
        </span>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight truncate">Chào {mounted ? playerName || "bạn" : "bạn"}!</h1>
          <p className="font-semibold text-[#6B4A30] text-sm sm:text-base">{mounted && s.sprint?.on ? "Nước rút: hôm nay học khoảng 25 phút nhé." : "Dành khoảng 25–30 phút cho bài học, ôn lại và luyện nói."}</p>
          <span className="mt-1 flex items-center gap-2">
            <SyncBadge />
            <AccountMenu hideGuest />
          </span>
        </div>
        <div className="cci-card-wood flex items-center gap-1.5 px-3 h-11 shrink-0" title="Chuỗi ngày học">
          <Flame className="w-5 h-5" fill="#F29A4E" stroke="#4A3222" />
          <span className="font-baloo font-extrabold text-lg">{mounted ? streak(s) : 0}</span>
        </div>
      </div>

      {/* Nước rút 30 ngày + Hồ sơ của tôi */}
      <SprintCard mounted={mounted} />
      <ProfileCard mounted={mounted} />

      {/* Kế hoạch 3 tháng */}
      <div className="grid md:grid-cols-[1.4fr_1fr] gap-4">
        <div className="rounded-[26px] p-5 text-white flex items-center gap-5" style={{ background: "#3F7A34", border: "3px solid #2C5A25", boxShadow: "0 6px 0 #2C5A25" }}>
          <Ring pct={mounted ? planPct : 0} label={`${mounted ? calWeek : 1}/${TOTAL_WEEKS}`} sub="tuần" />
          <div className="min-w-0">
            <div className="text-xs font-extrabold tracking-[0.12em] uppercase text-[#F2C14E]">Kế hoạch 13 tuần · Chủ đề A1–B1</div>
            <div className="font-baloo font-extrabold text-2xl leading-tight mt-0.5">
              Tuần {mounted ? calWeek : 1}: Chương {cur.id} · {cur.title}
            </div>
            <p className="text-[15px] font-semibold text-white/85 mt-1">
              {mounted && behind
                ? `Bạn đang chậm ${calWeek - cur.week} tuần so với lịch — không sao, cứ đều đặn mỗi ngày một nhiệm vụ.`
                : "13 tuần · mỗi tuần 1 tình huống giao tiếp · mỗi ngày 1 nhiệm vụ ngắn (7 ngày/tuần)."}
            </p>
            <div className="text-xs font-bold text-white/75 mt-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Bắt đầu {mounted ? fmt(s.startDate) : "--/--"} ·{" "}
              <button
                type="button"
                className="underline"
                onClick={() => {
                  if (confirm("Đặt lại ngày bắt đầu kế hoạch là hôm nay? Tiến độ học vẫn giữ nguyên.")) restartPlan();
                }}
              >
                bắt đầu lại từ hôm nay
              </button>
            </div>
          </div>
        </div>
        <div className="cci-card p-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-baloo font-extrabold text-lg">Đã luyện</span>
            <span className="text-sm font-bold text-[#6B4A30] flex items-center gap-1">
              <Star className="w-4 h-4" fill="#F2C14E" stroke="#4A3222" /> {mounted ? totalStars(s) : 0} sao · {mounted ? lessonsDone : 0}/13 bài
            </span>
          </div>
          {skills(s).map((k) => (
            <div key={k.key} className="flex items-center gap-2">
              <span className="w-[128px] text-sm font-bold shrink-0">{k.name}</span>
              <div className="flex-1 h-3 rounded-full bg-[#EAD9B8] border-2 border-[#8B5E3C] overflow-hidden">
                <div className="h-full bg-[#6FAE4F] transition-all" style={{ width: `${mounted ? k.pct : 0}%` }} />
              </div>
              <span className="w-9 text-right text-xs font-extrabold text-[#6B4A30]">{mounted ? k.pct : 0}%</span>
            </div>
          ))}
          <Link href="/island/progress" data-sfx="whoosh" className="cci-btn cci-btn-primary !min-h-[40px] self-start mt-1">
            <TrendingUp className="w-4 h-4" /> Tiến bộ của tôi: phút nói, điểm nói, CEFR
          </Link>
        </div>
      </div>

      <section className="cci-card p-4 sm:p-5 flex flex-col gap-3">
        <h2 className="font-baloo font-extrabold text-xl sm:text-2xl">Sau 13 tuần, bạn muốn nói được gì?</h2>
        <ol className="grid gap-2 sm:grid-cols-3 text-sm">
          <li className="rounded-2xl bg-[#FBF0D9] p-3"><b>Tuần 4</b><p>Giới thiệu trong 30–45 giây, gọi món và hỏi lại khi chưa nghe rõ.</p></li>
          <li className="rounded-2xl bg-[#EAF3DC] p-3"><b>Tuần 8</b><p>Xử lý một tình huống du lịch hoặc đổi lịch qua ít nhất 4 lượt nói.</p></li>
          <li className="rounded-2xl bg-[#EAF4FA] p-3"><b>Tuần 13</b><p>Kể chuyện trong 1 phút, hỏi tiếp hoặc xử lý một tình huống bất ngờ bằng tiếng Anh.</p></li>
        </ol>
        <p className="text-sm font-semibold text-[#6B4A30]">Lấy mốc nói đầu tiên trong tuần 1 rồi làm lại cùng ba đề mỗi hai tuần. Xem mình diễn đạt đủ ý, hỏi tiếp và cần ít gợi ý hơn ra sao.</p>
        <Link href="/island/checkpoint" className="cci-btn self-start !min-h-[40px]"><Mic className="w-4 h-4" /> Kiểm tra nói</Link>
      </section>

      {/* Luyện thêm mỗi ngày */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <PracticeCard href="/island/garden" icon={Sprout} bg="#EAF3DC" title="Vườn Nhiệm Vụ" desc={mounted ? `Luống tuần này: ${missionsDone(s, curId)}/${MISSIONS.length} nhiệm vụ · ${Object.keys(s.garden).length}/13 luống đã thu hoạch` : "Mỗi nhiệm vụ làm cây lớn thêm"} />
        <PracticeCard href={`/island/reflex?ch=${curId}`} icon={Zap} bg="#FFF1C7" title="Ao Phản Xạ" desc={mounted && reflexSec !== null ? `Phản xạ trung bình ${reflexSec.toFixed(1)} giây · càng thấp càng giỏi` : "NPC hỏi, bạn có vài giây để đáp — đo tốc độ phản xạ"} />
        <PracticeCard href={`/island/vocabulary?ch=${curId}`} icon={BookOpen} bg="#FFF1C7" title="Cụm từ giao tiếp" desc="Nhớ 3 cụm theo tình huống và đặt câu của riêng bạn." />
        <PracticeCard href="/island/phrases" icon={MessageSquareQuote} bg="#EAF3DC" title="Sổ câu khung" desc={mounted ? `${Object.keys(s.phrases).length} câu · ${duePhrases(s).length} câu đến hạn ôn` : "Nghe tiếng Việt → nói ngay câu tiếng Anh"} />
        <PracticeCard href={`/island/sounds?ch=${curId}`} icon={AudioLines} bg="#D7ECF5" title="Phát âm chuẩn" desc="Cặp âm người Việt hay lẫn: ship/sheep, three/tree, âm cuối -s, -ed" />
        <PracticeCard href="/island/collection" icon={BookHeart} bg="#FBE3E7" title="Sổ sưu tập" desc={mounted ? `${collection(s).have}/${collection(s).total} món · hải sản, cây, truyện bạn bè, công trình` : "Gom hải sản, cây, truyện bạn bè — mỗi món một câu tiếng Anh"} />
        <PracticeCard href="/island/farm" icon={Fish} bg="#E6F5FA" title="Ao Tôm Cua" desc={mounted ? `${shells(s)} vỏ sò · ${food(s)} thức ăn — học để nuôi ao lớn hơn` : "Học để kiếm vỏ sò, nuôi tôm cua"} />
      </div>

      {/* Chọn cấp */}
      <div className="flex flex-wrap items-center gap-2">
        {LEVELS.map((l) => {
          const open = !mounted || levelOpen(l.id);
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => setLevel(l.id)}
              className={cx("cci-btn !rounded-full !min-h-[42px]", level === l.id && "cci-btn-primary")}
            >
              {l.id} {!open && <Lock className="w-3.5 h-3.5" />}
            </button>
          );
        })}
        <Link href="/island/placement" className="ml-auto font-extrabold text-[#2C5A25] underline underline-offset-4">
          Kiểm tra xếp lớp
        </Link>
      </div>

      <div className="cci-card p-4 flex items-center gap-4">
        <Ring pct={mounted ? levelPct : 0} label={level} small />
        <div>
          <div className="text-xs font-extrabold tracking-[0.1em] uppercase text-[#3F7A34]">
            {lvl.weeks} · {mounted ? levelPct : 0}%
          </div>
          <div className="font-baloo font-extrabold text-xl leading-tight">{lvl.name}</div>
          <div className="text-sm font-semibold text-[#6B4A30]">{lvl.desc}</div>
        </div>
      </div>

      {/* Danh sách chương (mỗi chương = 1 tuần) */}
      <ol className="flex flex-col gap-3.5">
        {levelChapters.map((c) => {
          const unlocked = !mounted || isUnlocked(s, c.id);
          const p = s.chapters[c.id] || {};
          const nDone = missionsDone(s, c.id);
          const isCur = mounted && c.id === curId;
          const isOpen = openId === c.id;
          const Icon = CH_ICON[c.id] || BookOpen;
          const status = !unlocked ? "Chưa mở" : nDone === MISSIONS.length ? "Xong" : p.lesson || isCur ? "Đang học" : "Sắp tới";
          return (
            <li key={c.id} className={cx("cci-card !p-0 overflow-hidden", isCur && "!border-[#3F7A34]", !unlocked && "opacity-75")}>
              <button type="button" onClick={() => setOpenId(isOpen ? null : c.id)} className="w-full flex items-center gap-3 sm:gap-4 p-4 text-left" aria-expanded={isOpen}>
                <span className="w-14 h-14 rounded-[16px] border-[3px] border-[#4A3222] flex items-center justify-center shrink-0" style={{ background: CH_BG[c.scene] }}>
                  {unlocked ? <Icon className="w-7 h-7" /> : <Lock className="w-6 h-6" />}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2 text-xs font-extrabold text-[#6B4A30]">
                    Tuần {c.week} · Chương {c.id}
                    {mounted && <span className="font-bold">· từ {fmt(weekStartDate(s, c.week))}</span>}
                  </span>
                  <span className="block font-baloo font-extrabold text-xl leading-tight">{c.title}</span>
                  <span className="block text-sm font-semibold text-[#6B4A30] truncate">
                    {c.subtitle} · cùng {NPCS[c.npc].name}
                  </span>
                  {mounted && unlocked && (
                    <span className="mt-1 flex items-center gap-1 flex-wrap" aria-label="Chìa khoá mở chương sau">
                      {KEY_MISSIONS.map((k) => (
                        <span key={k} className={cx("inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[11px] font-extrabold border", p[k] ? "bg-[#E9F6E1] border-[#9CC77F] text-[#2C5A25]" : "bg-white border-[#E6CF9A] text-[#8B6B48]")}>
                          <KeyRound className="w-3 h-3" /> {KEY_NAMES[k]}
                        </span>
                      ))}
                    </span>
                  )}
                  {mounted && !unlocked && <span className="mt-1 block text-xs font-bold text-[#8B6B48]">Mở khi Chương {c.id - 1} đủ 3 chìa khoá</span>}
                  <span className="mt-1.5 flex items-center gap-2">
                    <span className="flex-1 max-w-[240px] h-2.5 rounded-full bg-[#EAD9B8] overflow-hidden">
                      <span className="block h-full bg-[#6FAE4F]" style={{ width: `${(nDone / MISSIONS.length) * 100}%` }} />
                    </span>
                    <span className="text-xs font-extrabold text-[#6B4A30]">{nDone}/{MISSIONS.length}</span>
                    {p.stars ? (
                      <span className="flex">
                        {[0, 1, 2].map((i) => (
                          <Star key={i} className="w-3.5 h-3.5" fill={i < (p.stars || 0) ? "#F2C14E" : "#EAD9B8"} stroke="#4A3222" />
                        ))}
                      </span>
                    ) : null}
                  </span>
                </span>
                <span className="flex flex-col items-end gap-2 shrink-0">
                  <span
                    className="text-xs font-extrabold px-2.5 py-1 rounded-full"
                    style={{
                      background: status === "Xong" ? "#3F7A34" : status === "Đang học" ? "#F2C14E" : "#EAD9B8",
                      color: status === "Xong" ? "#fff" : "#4A3222",
                    }}
                  >
                    {status}
                  </span>
                  <ChevronDown className={cx("w-5 h-5 transition-transform", isOpen && "rotate-180")} />
                </span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 flex flex-col gap-2 anim-pop">
                  <p className="text-sm font-semibold text-[#6B4A30] px-1">🎯 {c.goal}</p>
                  {MISSIONS.map((m) => {
                    const ok = !!p[m.key];
                    const MIcon = MISSION_ICON[m.key];
                    const canDo = unlocked && (m.key === "lesson" || p.lesson);
                    return (
                      <Link
                        key={m.key}
                        href={canDo ? missionHref(m.key, c.id) : "#"}
                        onClick={(e) => !canDo && e.preventDefault()}
                        className={cx(
                          "flex items-center gap-3 rounded-[16px] border-2 px-3 py-2.5 bg-white",
                          canDo ? "border-[#D8BF92] hover:border-[#8B5E3C]" : "border-[#EAD9B8] opacity-60 cursor-not-allowed",
                        )}
                      >
                        <span
                          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: ok ? "#3F7A34" : "#FBF3E2", border: `3px solid ${ok ? "#3F7A34" : "#D8BF92"}`, color: ok ? "#fff" : "#4A3222" }}
                        >
                          {ok ? <Check className="w-4 h-4" strokeWidth={3.5} /> : <MIcon className="w-4 h-4" />}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-baloo font-extrabold leading-tight">
                            Ngày {m.day} · {m.title}
                          </span>
                          <span className="block text-xs font-semibold text-[#6B4A30] truncate">{canDo ? m.desc : "Mở sau khi học xong bài học ngày 1"}</span>
                        </span>
                        <span className="text-xs font-bold text-[#6B4A30] shrink-0">{m.mins} phút</span>
                        {canDo && <ArrowRight className="w-4 h-4 shrink-0" />}
                      </Link>
                    );
                  })}
                </div>
              )}
            </li>
          );
        })}

        {/* Thử thách cuối cấp */}
        {(() => {
          const ok = mounted && isChallengeUnlocked(s, challenge.id);
          const res = s.challenges[challenge.id];
          return (
            <li>
              <Link
                href={ok ? `/island/lesson/${challenge.id}` : "#"}
                onClick={(e) => !ok && e.preventDefault()}
                className="flex items-center gap-4 p-4 rounded-[22px]"
                style={{ background: "#FFF9EE", border: "3px dashed #D9A92F" }}
              >
                <span className="w-14 h-14 rounded-[16px] border-[3px] border-[#4A3222] bg-[#FFF1C7] flex items-center justify-center shrink-0">
                  {ok ? <Crown className="w-7 h-7" /> : <Lock className="w-6 h-6" />}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-extrabold text-[#6B4A30]">Thử thách cuối cấp · Tuần {challenge.week}</span>
                  <span className="block font-baloo font-extrabold text-xl leading-tight">{challenge.title}</span>
                  <span className="block text-sm font-semibold text-[#6B4A30]">{ok ? challenge.subtitle : "Mở khi học xong bài học của tất cả chương trong cấp"}</span>
                </span>
                {res?.done ? (
                  <span className="flex">
                    {[0, 1, 2].map((i) => (
                      <Star key={i} className="w-5 h-5" fill={i < res.stars ? "#F2C14E" : "#EAD9B8"} stroke="#4A3222" />
                    ))}
                  </span>
                ) : (
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-[#EAD9B8]">Cuối cấp</span>
                )}
              </Link>
            </li>
          );
        })()}
      </ol>

      <div className="cci-card p-4 sm:p-5 flex flex-col gap-2">
        <h2 className="text-xl font-extrabold">Cách luyện để dùng được tiếng Anh</h2>
        <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[15px] font-semibold text-[#6B4A30] list-disc pl-5">
          <li>Mỗi ngày học một nhiệm vụ ngắn, ôn cụm từ và dành khoảng 10 phút để tự nói.</li>
          <li>Luôn bấm “Nghe” rồi nói to theo — miệng phải quen, không chỉ mắt.</li>
          <li>Ngày 3 và ngày 4 là quan trọng nhất: tự nói, không nhìn đáp án.</li>
          <li>Không nghe kịp? Dùng câu cứu nguy — đó cũng là kỹ năng giao tiếp.</li>
          <li>Ôn Sổ từ khi có thẻ đến hạn; thẻ nhớ tốt sẽ giãn dần 1 → 30 ngày.</li>
          <li>Cuối mỗi cấp làm thử thách không gợi ý để biết mình thật sự nói được.</li>
          <li>Ao Phản Xạ: mục tiêu là mở miệng trong 2–3 giây. Bí thì dùng câu câu giờ “Hmm, let me think...”.</li>
          <li>Mỗi tuần thử một cuộc nói chuyện ngắn ngoài đời hoặc ghi âm một lượt nói tự do. Dùng ít nhất một cụm mới.</li>
        </ul>
      </div>
    </div>
  );
}

function Ring({ pct, label, sub, small }: { pct: number; label: string; sub?: string; small?: boolean }) {
  const size = small ? 64 : 92;
  const r = small ? 26 : 38;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={small ? "#EAD9B8" : "#2C5A25"} strokeWidth={small ? 8 : 10} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#F2C14E"
          strokeWidth={small ? 8 : 10}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="font-baloo font-extrabold" style={{ fontSize: small ? 18 : 22 }}>
          {label}
        </span>
        {sub && <span className="text-[11px] font-bold opacity-80 mt-0.5">{sub}</span>}
      </div>
    </div>
  );
}

function PracticeCard({ href, icon: Icon, bg, title, desc }: { href: string; icon: React.ElementType; bg: string; title: string; desc: string }) {
  return (
    <Link href={href} className="cci-card p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-transform">
      <span className="w-12 h-12 rounded-[14px] border-[3px] border-[#4A3222] flex items-center justify-center shrink-0" style={{ background: bg }}>
        <Icon className="w-6 h-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-baloo font-extrabold text-lg leading-tight">{title}</span>
        <span className="block text-xs font-semibold text-[#6B4A30] leading-snug">{desc}</span>
      </span>
      <ArrowRight className="w-4 h-4 shrink-0" />
    </Link>
  );
}
