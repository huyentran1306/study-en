"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookHeart, BookOpen, Check, ClipboardList, Construction, Ear, Flame, Hourglass, Mic2, Phone, Shield, Sparkles, Swords, Users, type LucideIcon } from "lucide-react";
import { BackLink, cx } from "@/components/island/ui";
import { CHAPTERS } from "@/lib/island/curriculum";
import { EPISODES, REAL_LIFE } from "@/lib/island/life";
import { MISSIONS, bossOpen, weeklyBoss } from "@/lib/island/missions";
import { FREEZE_COST, FREEZE_MAX, buyFreeze, calendarWeek, currentChapterId, doRealLife, freezesLeft, shells, streak, useIsland } from "@/lib/island/progress";
import { sfx } from "@/lib/island/sfx";
import { BUILD_BONUS, builtCount, ISLE, suggestPractice, type IsleId } from "@/lib/island/isle";
import { useGame } from "@/contexts/game-context";

type Card = { id: IsleId; href: string; icon: LucideIcon; tone: string; title: string; desc: string; badge?: string | null };

/** Phòng luyện: tất cả cách luyện nói nâng cao ở một chỗ + thẻ giữ chuỗi + Thử ngoài đời. */
export default function PracticeHub() {
  const s = useIsland();
  const { addXP } = useGame();
  const [mounted, setMounted] = useState(false);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    setMounted(true);
    localStorage.setItem("cci-isle-visited", "1");
  }, []);

  const cur = CHAPTERS.find((c) => c.id === currentChapterId(s))!;
  const week = mounted ? Math.max(calendarWeek(s), cur.week) : 1;
  const newEp = mounted ? EPISODES.filter((e) => e.week <= week && !s.episodes[e.id]).length : 0;
  const missionsLeft = mounted ? MISSIONS.filter((m) => m.ch <= s.unlockedUpTo && !s.missions[m.id]).length : 0;
  const boss = weeklyBoss();
  const rl = REAL_LIFE.find((r) => r.ch === cur.id) || REAL_LIFE[0];
  const rlDone = mounted ? s.reallife[rl.id] : undefined;

  const cards: Card[] = [
    { id: "call", href: "/island/call", icon: Phone, tone: "#2F5D50", title: "Gọi điện", desc: "Chỉ giọng nói, không chữ, được ngắt lời. Đo phản xạ và tốc độ nói.", badge: null },
    { id: "mission", href: "/island/mission", icon: ClipboardList, tone: "#C96A2B", title: "Nhiệm vụ hỏi thông tin", desc: "Cư dân giữ bí mật, bạn phải hỏi đúng để lấy được.", badge: missionsLeft ? `${missionsLeft} mới` : null },
    { id: "boss", href: "/island/boss", icon: Swords, tone: "#7A3E2C", title: "Thử thách cuối tuần", desc: `Tuần này: ${boss.title}. 4 phút, nhận cúp hiếm.`, badge: mounted && bossOpen() ? "Đang mở" : null },
    { id: "stories", href: "/island/stories", icon: BookOpen, tone: "#8E5BB5", title: "Chuyện trên đảo", desc: "Mỗi tuần một tập. Câu trả lời của bạn làm câu chuyện đi tiếp.", badge: newEp ? `${newEp} tập mới` : null },
    { id: "listen", href: "/island/listen", icon: Ear, tone: "#2F8FB0", title: "Phòng nghe", desc: "Giọng Mỹ, Anh, Úc; nhanh, chậm; có tiếng ồn quán cà phê." },
    { id: "shadow", href: "/island/shadow", icon: Mic2, tone: "#3F7A34", title: "Nói đuổi", desc: "Bắt chước nhịp câu: trọng âm, nối âm. Máy chấm từng từ." },
    { id: "mirror", href: "/island/mirror", icon: Hourglass, tone: "#B5893A", title: "Gương thời gian", desc: "Ghi âm ngày 1, 30, 90 rồi nghe lại xem mình khác thế nào.", badge: mounted && !s.mirror.length ? "Ghi ngày 1" : null },
    { id: "lesson", href: "/island/my-lesson", icon: BookHeart, tone: "#C9506B", title: "Bài học của tôi", desc: "AI soạn bài từ chính cuộc sống của bạn." },
    { id: "visit", href: "/island/visit", icon: Users, tone: "#5A6FC9", title: "Ghé đảo bạn bè", desc: "Chia sẻ mã đảo, ghé thăm và để lại lời nhắn bằng tiếng Anh." },
  ];

  const pick = mounted ? suggestPractice(s, week) : null;
  // Gợi ý hôm nay lên đầu danh sách.
  if (pick) cards.sort((a, b) => Number(b.id === pick.id) - Number(a.id === pick.id));
  const left = mounted ? freezesLeft(s) : 0;
  const money = mounted ? shells(s) : 0;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <BackLink href="/island?view=isle" label="Đảo Luyện" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">Phòng luyện</h1>
          <p className="text-sm font-semibold text-[#6B4A30]">
            Luyện thêm ngoài lộ trình mỗi ngày. Đã dựng {mounted ? builtCount(s) : 0}/{ISLE.length} công trình trên Đảo Luyện: thử món mới lần đầu được thêm {BUILD_BONUS} vỏ sò.
          </p>
        </div>
      </div>

      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((c) => (
          <li key={c.href}>
            <Link href={c.href} data-sfx="whoosh" className={cx("clay rounded-[22px] p-3.5 flex items-start gap-3 bg-white hover:-translate-y-0.5 transition-transform h-full", pick?.id === c.id && "ring-[3px] ring-[#6FAE4F] ring-offset-2 ring-offset-[#FBF3E2]")}>
              <span className="gem w-12 h-12 shrink-0 rounded-[16px] flex items-center justify-center text-white" style={{ ["--tone" as string]: c.tone }}>
                <c.icon className="w-6 h-6" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2 flex-wrap">
                  <span className="font-baloo font-extrabold text-lg leading-tight">{c.title}</span>
                  {c.badge && <span className="text-[11px] font-extrabold rounded-full px-2 py-0.5 bg-[#F2C14E] text-[#4A3222]">{c.badge}</span>}
                  {mounted && !s.built[c.id] && (
                    <span className="text-[11px] font-extrabold rounded-full px-2 py-0.5 bg-[#F3E6CC] text-[#8B5E3C] inline-flex items-center gap-1">
                      <Construction className="w-3 h-3" /> Chưa thử · +{BUILD_BONUS} vỏ sò
                    </span>
                  )}
                </span>
                {pick?.id === c.id && (
                  <span className="mt-0.5 mb-1 text-[12px] font-extrabold text-[#2C5A25] flex items-start gap-1 leading-snug">
                    <Sparkles className="w-3.5 h-3.5 shrink-0 mt-px" /> Gợi ý hôm nay: {pick.why}
                  </span>
                )}
                <span className="block text-sm font-semibold text-[#6B4A30] leading-snug">{c.desc}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Thử ngoài đời */}
      <section className="rounded-[24px] border-[3px] border-[#E0A26E] bg-[#FFF6EA] p-4 flex flex-col gap-2.5">
        <div className="text-xs font-extrabold tracking-[0.12em] uppercase text-[#A4521D]">Thử ngoài đời · Chương {rl.ch}</div>
        <p className="font-extrabold text-lg leading-snug">{rl.task}</p>
        <p className="text-sm font-semibold text-[#6B4A30]">
          Câu mẫu: <i>{rl.example}</i>
        </p>
        {rlDone ? (
          <p className="text-sm font-bold text-[#2C5A25] flex items-center gap-1.5">
            <Check className="w-4 h-4" strokeWidth={3} /> Bạn đã làm! {rlDone.note && `Bạn đã nói: “${rlDone.note}”`}
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Bạn đã nói câu gì? (không bắt buộc)" className="flex-1 min-w-0 h-11 rounded-[14px] border-[3px] border-[#D8BF92] bg-white px-3 font-semibold outline-none focus:border-[#3F7A34]" />
            <button
              type="button"
              className="cci-btn cci-btn-primary !min-h-[44px]"
              onClick={() => {
                doRealLife(rl.id, note, 20);
                addXP(20);
                sfx.win();
                import("@/lib/confetti").then((c) => c.fireCelebration()).catch(() => {});
              }}
            >
              Mình làm rồi! +20 XP
            </button>
          </div>
        )}
        <p className="text-xs font-semibold text-[#6B4A30]">Đã làm {mounted ? Object.keys(s.reallife).length : 0}/{REAL_LIFE.length} thử thách ngoài đời. Dùng tiếng Anh thật một lần đáng giá hơn mười bài tập.</p>
      </section>

      {/* Thẻ giữ chuỗi */}
      <section className="cci-card-wood p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <span className="gem w-12 h-12 shrink-0 rounded-[16px] flex items-center justify-center text-white" style={{ ["--tone" as string]: "#2F8FB0" }}>
          <Shield className="w-6 h-6" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-baloo font-extrabold text-lg leading-tight flex items-center gap-2">
            Thẻ giữ chuỗi · còn {left}/{FREEZE_MAX}
            <span className="text-sm font-bold text-[#C96A2B] inline-flex items-center gap-0.5">
              <Flame className="w-4 h-4" /> {mounted ? streak(s) : 0} ngày
            </span>
          </div>
          <p className="text-sm font-semibold text-[#6B4A30] leading-snug">Bận quá lỡ 1–2 ngày? Thẻ tự đắp vào những ngày đó khi bạn quay lại học, chuỗi ngày không bị mất trắng.</p>
          {msg && <p className="text-sm font-bold text-[#2C5A25]">{msg}</p>}
        </div>
        <button
          type="button"
          className={cx("cci-btn shrink-0", money >= FREEZE_COST && left < FREEZE_MAX && "cci-btn-primary")}
          disabled={money < FREEZE_COST || left >= FREEZE_MAX}
          onClick={() => {
            if (buyFreeze()) {
              sfx.coin();
              setMsg("Đã mua 1 thẻ giữ chuỗi!");
            }
          }}
        >
          Mua · {FREEZE_COST} vỏ sò
        </button>
      </section>
    </div>
  );
}
