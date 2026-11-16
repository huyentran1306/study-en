"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, Briefcase, Check, Fish, Coffee, Flame, Gift, Hammer, Heart, Lock, Map as MapIcon, MessageCircle, Plane, Route, ShoppingBasket, Signpost, Star, Volume2, X, Zap, Flower2 } from "lucide-react";
import { MAP_BG } from "@/components/island/art";
import { Avatar, Character } from "@/components/island/character";
import { cx } from "@/components/island/ui";
import { SyncBadge } from "@/components/island/sync-badge";
import { GardenAnimals, IslandBuilds, BuildPanel } from "@/components/island/garden";
import { JourneyPanel } from "@/components/island/journey";
import { SeaCreature } from "@/components/island/farm-art";
import type { FarmKind } from "@/lib/island/state";
import { AudioToggles } from "@/components/island/audio-controls";
import { FullscreenButton } from "@/components/island/island-chrome";
import { CHAPTERS, MISSIONS, NPCS, PLACES, type NpcId, type SceneId } from "@/lib/island/curriculum";
import { BUILDS, NPC_STORIES } from "@/lib/island/drills";
import { activeSlot, chestOpened, currentChapterId, readyCount, dueWords, duePhrases, friendship, isUnlocked, islandLevel, nextMission, streak, todayPlan, totalStars, useIsland, type PlanStep } from "@/lib/island/progress";
import { speak } from "@/lib/island/speech";
import { sfx } from "@/lib/island/sfx";
import { DAILY_ROADMAP_DATA } from "@/data/daily-roadmap-data";
import { useGame } from "@/contexts/game-context";

const P = (v: number, of: number) => `${(v / of) * 100}%`;

const SPOTS: { scene: SceneId; label: string; x: number; y: number; icon: React.ElementType; color: string }[] = [
  { scene: "cafe", label: "Quán Miso", x: 250, y: 424, icon: Coffee, color: "#3F7A34" },
  { scene: "tree", label: "Cây Anh Đào", x: 640, y: 300, icon: Flower2, color: "#E07A93" },
  { scene: "airport", label: "Sân Bay Mây", x: 1054, y: 228, icon: Plane, color: "#3F7A34" },
  { scene: "market", label: "Chợ Cà Rốt", x: 1036, y: 470, icon: ShoppingBasket, color: "#3F7A34" },
  { scene: "pond", label: "Trạm Hỏi Đường", x: 330, y: 592, icon: Signpost, color: "#3F7A34" },
];

const RESIDENTS: { who: NpcId; x: number; y: number; w: number; delay: number; scene: SceneId }[] = [
  { who: "miso", x: 336, y: 330, w: 70, delay: 0.2, scene: "cafe" },
  { who: "mallow", x: 884, y: 362, w: 70, delay: 0.5, scene: "market" },
  { who: "pip", x: 900, y: 142, w: 66, delay: 0.9, scene: "airport" },
  { who: "kero", x: 388, y: 520, w: 66, delay: 0, scene: "pond" },
];

const POND_POS: [number, number][] = [
  [20, 606],
  [238, 604],
  [84, 644],
  [200, 650],
];

const SCENE_NPC: Record<SceneId, NpcId> = { cafe: "miso", market: "mallow", airport: "pip", pond: "kero", tree: "pip" };

/** Lời Kero gợi ý theo bước tiếp theo của hành trình hôm nay. */
function keroLine(step: PlanStep | null, npc: NpcId, quest: { en: string; vi: string }, mission: string | null) {
  const n = NPCS[npc].name;
  if (!step) return { en: "You finished today's journey. See you tomorrow!", vi: "Bạn xong hành trình hôm nay rồi. Mai gặp lại nhé!" };
  if (step.key === "review") return { en: "Some words are about to slip away. Let's review!", vi: "Vài câu sắp “bay” khỏi trí nhớ rồi. Ôn nhanh thôi!" };
  if (step.key === "reflex") return { en: "Quick! Can you answer in three seconds?", vi: "Nhanh nào! Bạn trả lời được trong 3 giây không?" };
  switch (mission) {
    case "lesson":
      return quest;
    case "listen":
      return { en: "Today, just listen. Can you understand without any text?", vi: "Hôm nay chỉ nghe thôi. Bạn có hiểu được khi không có chữ không?" };
    case "speak":
      return { en: `Ready? Answer ${n} with your own voice this time!`, vi: `Sẵn sàng chưa? Lần này trả lời ${n} bằng chính giọng của bạn nhé!` };
    case "chat":
      return { en: `${n} wants to chat. Just talk, no options!`, vi: `${n} muốn tám chuyện với bạn. Nói tự do, không có lựa chọn!` };
    case "review":
      return { en: "Time to review your words and phrases!", vi: "Đến giờ ôn từ và câu khung rồi!" };
    case "reflex":
      return { en: "Let's train your reflexes at the pond!", vi: "Ra Ao Phản Xạ luyện phản xạ thôi!" };
    case "sound":
      return { en: "Ship or sheep? Let's train your ears!", vi: "Ship hay sheep? Luyện tai và phát âm nào!" };
    default:
      return { en: "Great week! Let's move on to the next adventure.", vi: "Một tuần tuyệt vời! Sang chuyến phiêu lưu tiếp theo thôi." };
  }
}

export default function IslandMapPage() {
  const s = useIsland();
  const { username } = useGame();
  const [open, setOpen] = useState<SceneId | null>(null);
  const [panel, setPanel] = useState<"journey" | "build" | "office" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const curId = currentChapterId(s);
  const cur = CHAPTERS.find((c) => c.id === curId)!;
  const nm = nextMission(s, curId);
  const plan = todayPlan(s);
  const planDone = plan.filter((p) => p.done).length;
  const step = plan.find((p) => !p.done) || null;
  const line = keroLine(step, cur.npc, cur.quest, nm);
  const lv = islandLevel(s.xp);
  const due = dueWords(s).length + duePhrases(s).length;
  const sceneUnlocked = (scene: SceneId) => CHAPTERS.some((c) => c.scene === scene && isUnlocked(s, c.id));
  const officeOpen = isUnlocked(s, 9);
  const goHref = step ? step.href : "/island/path";
  const ready = readyCount(s);
  const pondKids = Array.from({ length: s.farm.size }, (_, i) => activeSlot(s, i)?.kind).filter((k): k is FarmKind => !!k).slice(0, POND_POS.length);

  // Báo khi đảo vừa mở thêm món mới (so với lần trước thấy).
  useEffect(() => {
    if (!mounted) return;
    const seen = Number(localStorage.getItem("cci-build-seen") || "0");
    if (lv.level > seen) {
      const fresh = BUILDS.filter((b) => b.lv > seen && b.lv <= lv.level);
      localStorage.setItem("cci-build-seen", String(lv.level));
      if (seen > 0 && fresh.length) {
        setToast(fresh.length <= 2 ? `Đảo vừa có thêm: ${fresh.map((b) => b.name).join(" và ")}!` : `Đảo vừa có thêm ${fresh.length} món mới: ${fresh[0].name}, ${fresh[1].name}...`);
        sfx.unlock();
      }
    }
  }, [mounted, lv.level]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="max-w-[1320px] mx-auto px-2 sm:px-4 py-3 sm:py-5">
      {/* Bản đồ 16:10 co theo chiều cao màn hình (trừ navbar 4rem + lề) để luôn thấy trọn khu vườn. */}
      <div className="cci-mapfit relative mx-auto w-full lg:w-[min(100%,calc((100dvh-6.5rem)*1.6))]">
        {/* ── Bản đồ ── */}
        <div className="relative w-full overflow-hidden rounded-[22px] sm:rounded-[28px] border-[3px] border-[#8B5E3C]" style={{ aspectRatio: "1280 / 800", containerType: "inline-size", background: "#9CCB6A" }}>
          <svg viewBox="0 0 1280 800" className="absolute inset-0 w-full h-full" aria-hidden="true" dangerouslySetInnerHTML={{ __html: MAP_BG }} />

          {/* Đồ xây đảo (mở theo cấp) */}
          {mounted && <IslandBuilds level={lv.level} />}

          {/* Máy bay kéo băng rôn */}
          <div aria-hidden className="absolute left-0 pointer-events-none" style={{ top: P(250, 800), animation: "fly 18s linear infinite", zIndex: 5 }}>
            <div className="flex items-center" style={{ animation: "floaty 2s ease-in-out infinite" }}>
              <span className="px-[1.2cqw] py-[0.3cqw] rounded-[0.8cqw] bg-white border-2 border-[#8B5E3C] font-baloo font-extrabold whitespace-nowrap" style={{ fontSize: "max(9px, 1.1cqw)" }}>
                Welcome to Chit Chat Island!
              </span>
              <svg viewBox="0 0 64 40" style={{ width: "5cqw" }}>
                <path d="M6 22 Q6 14 16 14 H48 Q60 14 60 22 Q60 28 50 28 H16 Q6 28 6 22 Z" fill="#FFFFFF" stroke="#4A3222" strokeWidth="2.5" />
                <path d="M10 14 L4 2 H14 L22 14 Z" fill="#E86F5A" stroke="#4A3222" strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M28 22 L40 38 H48 L42 22 Z" fill="#4E7FB8" stroke="#4A3222" strokeWidth="2.5" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Cư dân: bấm để chào và mở khu của họ */}
          {RESIDENTS.map((r) => {
            const hasQuest = r.who === cur.npc;
            return (
              <button
                key={r.who}
                type="button"
                data-sfx="none"
                aria-label={`${NPCS[r.who].name} — ${NPCS[r.who].role}`}
                className="absolute hover:scale-105 active:scale-95 transition-transform"
                style={{ left: P(r.x, 1280), top: P(r.y, 800), width: P(r.w, 1280), zIndex: 3 }}
                onClick={() => {
                  sfx.chirp(r.who);
                  setOpen(r.scene);
                }}
              >
                {hasQuest && (
                  <span
                    className="absolute left-1/2 -translate-x-1/2 rounded-[0.6cqw] bg-[#F2C14E] border-2 border-[#4A3222] font-baloo font-extrabold flex items-center justify-center anim-floaty"
                    style={{ top: "-2.6cqw", width: "2.4cqw", height: "3cqw", fontSize: "max(10px, 1.8cqw)", boxShadow: "0 3px 0 #4A3222" }}
                  >
                    !
                  </span>
                )}
                <Character who={r.who} mood={hasQuest ? "wave" : "idle"} size="100%" delay={r.delay} />
              </button>
            );
          })}
          {/* Bơ ở quảng trường */}
          <div className="absolute" style={{ left: P(560, 1280), top: P(384, 800), width: P(86, 1280), zIndex: 3 }}>
            <Character who="bo" mood="idle" size="100%" delay={0.3} />
          </div>

          {/* Heo, rồng, trâu */}
          <GardenAnimals />

          {/* Ao Tôm Cua: con đang nuôi bơi trong hồ */}
          {mounted &&
            pondKids.map((k, i) => (
              <div key={i} aria-hidden className="absolute pointer-events-none anim-floaty" style={{ left: P(POND_POS[i][0], 1280), top: P(POND_POS[i][1], 800), width: P(44, 1280), zIndex: 2, animationDelay: `${i * 0.5}s` }}>
                <SeaCreature kind={k} />
              </div>
            ))}
          <Link
            href="/island/farm"
            data-sfx="open"
            className="absolute -translate-x-1/2 inline-flex items-center whitespace-nowrap font-baloo font-extrabold hover:-translate-y-0.5 transition-transform"
            style={{ left: P(176, 1280), top: P(540, 800), zIndex: 6, fontSize: "max(10px, 1.33cqw)", gap: "0.6cqw", padding: "0.7cqw 1.25cqw", borderRadius: "1.1cqw", border: "3px solid #4E8FA8", background: "#E6F5FA", boxShadow: "0 4px 0 #4E8FA8" }}
          >
            <Fish style={{ width: "max(12px, 1.4cqw)", height: "max(12px, 1.4cqw)", color: "#2F7A93" }} />
            Ao Tôm Cua
            {mounted && ready > 0 && (
              <span className="absolute -top-[1.2cqw] -right-[1.2cqw] min-w-[2.2cqw] h-[2.2cqw] px-[0.5cqw] rounded-full bg-[#F2C14E] border-2 border-[#4A3222] flex items-center justify-center anim-bounce" style={{ fontSize: "max(9px, 1.1cqw)" }}>
                {ready}
              </span>
            )}
          </Link>

          {/* Nhãn địa điểm */}
          {SPOTS.map((sp) => {
            const unlocked = mounted ? sceneUnlocked(sp.scene) : true;
            const Icon = unlocked ? sp.icon : Lock;
            return (
              <button
                key={sp.scene}
                type="button"
                data-sfx="open"
                onClick={() => setOpen(sp.scene)}
                className="absolute -translate-x-1/2 inline-flex items-center whitespace-nowrap font-baloo font-extrabold hover:-translate-y-0.5 transition-transform"
                style={{
                  left: P(sp.x, 1280),
                  top: P(sp.y, 800),
                  zIndex: 6,
                  fontSize: "max(10px, 1.33cqw)",
                  gap: "0.6cqw",
                  padding: "0.7cqw 1.25cqw",
                  borderRadius: "1.1cqw",
                  border: "3px solid #8B5E3C",
                  background: "#FBF0D9",
                  boxShadow: "0 4px 0 #8B5E3C",
                  opacity: unlocked ? 1 : 0.85,
                }}
              >
                <Icon style={{ width: "max(12px, 1.4cqw)", height: "max(12px, 1.4cqw)", color: unlocked ? sp.color : "#8B5E3C" }} />
                {sp.label}
              </button>
            );
          })}
          {/* Văn phòng Mây: lộ trình 30 ngày Call khách (mở ở B1) */}
          <div className="absolute -translate-x-1/2" style={{ left: P(1022, 1280), top: P(560, 800), zIndex: 6 }}>
            <button
              type="button"
              data-sfx="open"
              onClick={() => setPanel("office")}
              className="inline-flex items-center whitespace-nowrap font-baloo font-extrabold anim-floaty"
              style={{ fontSize: "max(10px, 1.33cqw)", gap: "0.6cqw", padding: "0.7cqw 1.25cqw", borderRadius: "1.1cqw", border: "3px solid #8B5E3C", background: mounted && officeOpen ? "#FFF1C7" : "#FBF0D9", boxShadow: "0 4px 0 #8B5E3C" }}
              title="Văn phòng Mây — luyện Call khách 30 ngày (mở ở cấp B1)"
            >
              {mounted && officeOpen ? <Briefcase style={{ width: "max(12px, 1.4cqw)", height: "max(12px, 1.4cqw)", color: "#A4521D" }} /> : <Lock style={{ width: "max(12px, 1.4cqw)", height: "max(12px, 1.4cqw)" }} />}
              {mounted && officeOpen ? "Văn phòng Mây" : "???"}
            </button>
          </div>
        </div>

        {/* ── HUD: trên máy tính nằm đè lên bản đồ, trên điện thoại xếp dưới bản đồ ── */}
        <div className="grid gap-3 mt-3 sm:grid-cols-2 hud:contents">
          {/* Hồ sơ */}
          <div className="hud:absolute hud:left-5 hud:top-5 flex flex-col gap-2.5 hud:z-10">
            <div className="cci-card-wood flex items-center gap-3 pl-2 pr-4 py-2">
              <Avatar who="bo" size={52} />
              <div className="flex flex-col gap-1 w-40">
                <div className="flex justify-between items-baseline">
                  <span className="font-baloo font-extrabold text-xl leading-none truncate max-w-[100px]">{mounted ? username || "Bơ" : "Bơ"}</span>
                  <span className="text-xs font-extrabold text-[#6B4A30]">Lv {mounted ? lv.level : 1}</span>
                </div>
                <div className="h-3 rounded-full bg-[#EAD9B8] border-2 border-[#8B5E3C] overflow-hidden">
                  <div className="h-full bg-[#6FAE4F]" style={{ width: `${mounted ? lv.pct : 0}%` }} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link href="/island/words" className="cci-btn cci-btn-primary !min-h-[40px] !text-[15px] !px-3">
                <BookOpen className="w-4 h-4" /> Sổ từ
                {mounted && due > 0 && <span className="ml-0.5 rounded-full bg-[#F2C14E] text-[#4A3222] text-xs px-1.5 py-0.5">{due}</span>}
              </Link>
              <Link href={`/island/reflex?ch=${curId}`} className="cci-btn !min-h-[40px] !text-[15px] !px-3">
                <Zap className="w-4 h-4 text-[#C99A1E]" /> Phản xạ
              </Link>
              <Link href="/island/path" className="cci-btn !min-h-[40px] !text-[15px] !px-3">
                <Route className="w-4 h-4" /> Lộ trình
              </Link>
            </div>
            <SyncBadge className="self-start" />
          </div>

          {/* Chỉ số */}
          <div className="hud:absolute hud:right-5 hud:top-5 flex gap-2.5 items-start sm:justify-end hud:z-10">
            <div className="cci-card-wood flex items-center gap-2 h-[46px] px-3.5" title="Chuỗi ngày học · tổng số sao">
              <Flame className="w-5 h-5" fill="#F29A4E" stroke="#4A3222" />
              <span className="font-baloo font-extrabold text-lg">{mounted ? streak(s) : 0}</span>
              <span className="w-0.5 h-5 bg-[#EAD9B8] mx-1" />
              <Star className="w-5 h-5" fill="#F2C14E" stroke="#4A3222" />
              <span className="font-baloo font-extrabold text-lg">{mounted ? totalStars(s) : 0}</span>
            </div>
            <button type="button" data-sfx="open" onClick={() => setPanel("build")} className="cci-btn !w-[46px] !h-[46px] !min-h-0 !p-0" aria-label="Đảo của bạn" title="Đảo của bạn — xây thêm bằng XP">
              <Hammer className="w-5 h-5" />
            </button>
            <Link href="/island/chat" className="cci-btn !w-[46px] !h-[46px] !min-h-0 !p-0" aria-label="Tám chuyện với AI" title="Tám chuyện với AI">
              <MessageCircle className="w-5 h-5" />
            </Link>
            <AudioToggles />
            <span className="hidden md:contents">
              <FullscreenButton />
            </span>
          </div>

          {/* Hành trình hôm nay */}
          <button
            type="button"
            data-sfx="open"
            onClick={() => setPanel("journey")}
            className="hud:absolute hud:left-5 hud:bottom-5 hud:w-[290px] hud:z-10 cci-card-wood px-4 py-3 flex flex-col gap-1.5 text-left hover:-translate-y-0.5 transition-transform"
          >
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-[0.1em] uppercase text-[#3F7A34]">
              <MapIcon className="w-3.5 h-3.5" /> Hành trình hôm nay · {mounted ? planDone : 0}/3
            </div>
            <div className="font-baloo font-extrabold text-lg leading-tight">
              {mounted ? (step ? step.title : chestOpened(s) ? "Xong hôm nay! 🎉" : "Mở rương thưởng!") : cur.quest.vi}
            </div>
            <div className="flex items-center gap-1.5">
              {plan.map((p, i) => {
                const ok = mounted && p.done;
                const isNext = mounted && p === step;
                return (
                  <span key={p.key} className="flex items-center gap-1.5">
                    <span
                      className="w-[24px] h-[24px] rounded-full inline-flex items-center justify-center text-[11px] font-extrabold"
                      style={{ background: ok ? "#3F7A34" : "#FFF", color: ok ? "#fff" : "#6B4A30", border: `3px solid ${ok ? "#3F7A34" : isNext ? "#F2C14E" : "#D8BF92"}` }}
                    >
                      {ok ? <Check className="w-3 h-3" strokeWidth={4} /> : i + 1}
                    </span>
                    {i < 2 && <span className="w-3 h-0.5 bg-[#D8BF92]" />}
                  </span>
                );
              })}
              <Gift className={cx("w-5 h-5 ml-1", mounted && planDone === 3 && !chestOpened(s) ? "text-[#C96A2B] anim-bounce" : "text-[#D8BF92]")} />
              <span className="text-[12px] font-bold text-[#6B4A30] ml-auto truncate">Ch.{cur.id} · Tuần {cur.week}</span>
            </div>
          </button>

          {/* Kero gợi ý */}
          <div className="hud:absolute hud:left-[330px] hud:right-[150px] hud:bottom-5 hud:max-w-[580px] hud:z-10 cci-card-wood px-3.5 py-3 flex gap-3 items-center sm:col-span-2 hud:col-span-1">
            <button type="button" data-sfx="none" onClick={() => { sfx.chirp("kero"); setTimeout(() => speak(line.en, { who: "kero" }), 300); }} aria-label="Nghe Kero nói">
              <Avatar who="kero" size={64} />
            </button>
            <div className="min-w-0 flex-1">
              <span className="cci-chip !text-xs !py-0.5 !rounded-full">Kero · Hướng dẫn viên</span>
              <div className="text-[17px] font-extrabold leading-snug mt-1">{mounted ? line.en : cur.quest.en}</div>
              <div className="text-sm font-semibold text-[#6B4A30]">{mounted ? line.vi : cur.quest.vi}</div>
            </div>
          </div>

          {/* Nút chính: dẫn tới bước tiếp theo của hành trình */}
          <Link
            href={mounted ? goHref : "#"}
            onClick={(e) => {
              if (mounted && !step) {
                e.preventDefault();
                setPanel("journey");
              }
            }}
            data-sfx="whoosh"
            className="hud:absolute hud:right-6 hud:bottom-6 hud:z-10 sm:col-span-2 hud:col-span-1 flex hud:flex-col items-center justify-center gap-2 hud:gap-0.5 rounded-[20px] hud:rounded-full h-14 hud:w-[100px] hud:h-[100px] text-white font-baloo font-extrabold text-lg hud:text-[14px] leading-tight text-center"
            style={{ background: "#3F7A34", border: "4px solid #2C5A25", boxShadow: "0 5px 0 #2C5A25" }}
          >
            {mounted && !step ? <Gift className="w-7 h-7" /> : <MessageCircle className="w-7 h-7" />}
            {!mounted ? "Bắt đầu" : step ? `Bước ${planDone + 1}/3` : chestOpened(s) ? "Hôm nay xong" : "Mở rương"}
          </Link>
        </div>
      </div>

      {toast && (
        <div className="fixed inset-x-0 top-20 z-[70] flex justify-center px-3 pointer-events-none">
          <button type="button" data-sfx="open" onClick={() => setPanel("build")} className="pointer-events-auto max-w-md rounded-[20px] px-5 py-2.5 bg-[#3F7A34] text-white font-extrabold border-[3px] border-[#2C5A25] shadow-[0_4px_0_#2C5A25] anim-pop flex items-center gap-2 text-left">
            <Hammer className="w-4 h-4 shrink-0" /> {toast}
          </button>
        </div>
      )}

      {/* ── Bảng chi tiết ── */}
      {open && <PlacePanel scene={open} onClose={() => setOpen(null)} />}
      {panel === "journey" && <JourneyPanel onClose={() => setPanel(null)} />}
      {panel === "build" && <BuildPanel level={lv.level} pct={lv.pct} onClose={() => setPanel(null)} />}
      {panel === "office" && <OfficePanel open={officeOpen} onClose={() => setPanel(null)} />}
    </div>
  );
}

function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
}

function PlacePanel({ scene, onClose }: { scene: SceneId; onClose: () => void }) {
  const s = useIsland();
  const chapters = CHAPTERS.filter((c) => c.scene === scene);
  const resident = SCENE_NPC[scene];
  const fr = friendship(s, resident);
  const stories = NPC_STORIES[resident] || [];
  useEscape(onClose);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-3 bg-[#4A3222]/40" onClick={onClose} role="dialog" aria-modal="true" aria-label={PLACES[scene].name}>
      <div className="cci-card-wood w-full max-w-lg p-5 flex flex-col gap-4 anim-pop max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <Avatar who={resident} size={60} />
          <div className="flex-1">
            <h2 className="text-2xl font-extrabold leading-tight">{PLACES[scene].name}</h2>
            <p className="font-semibold text-[#6B4A30]">
              {NPCS[resident].name} · {NPCS[resident].role}
            </p>
          </div>
          <button type="button" onClick={onClose} className="cci-btn !min-h-[40px] !w-[40px] !p-0" aria-label="Đóng" data-sfx="close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Độ thân thiết */}
        <div className="rounded-[18px] px-4 py-3 bg-[#FFF9EE] border-[3px] border-[#F4B6C2] flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="font-baloo font-extrabold">Thân thiết với {NPCS[resident].name}</span>
            <span className="flex gap-0.5 ml-auto" aria-label={`${fr.hearts}/5 tim`}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Heart key={i} className="w-4 h-4" fill={i <= fr.hearts ? "#E86F5A" : "#EAD9B8"} stroke="#4A3222" />
              ))}
            </span>
          </div>
          <p className="text-xs font-semibold text-[#6B4A30]">
            {fr.next !== null ? `Còn ${fr.next - fr.points} điểm nữa để ${NPCS[resident].name} kể thêm một chuyện. Học bài, chat và luyện phản xạ ở khu này để thân hơn.` : "Hai bạn đã là bạn thân nhất!"}
          </p>
          <ul className="flex flex-col gap-1.5">
            {stories.map((st, i) =>
              i < fr.hearts ? (
                <li key={i}>
                  <button type="button" data-sfx="none" onClick={() => speak(st.en, { who: resident })} className="w-full text-left rounded-xl px-3 py-2 bg-white border-2 border-[#EAD9B8] hover:border-[#8B5E3C]">
                    <span className="font-bold text-[15px] leading-snug block">
                      {st.en} <Volume2 className="inline w-3.5 h-3.5 text-[#3F7A34]" />
                    </span>
                    <span className="text-xs font-semibold text-[#6B4A30]">{st.vi}</span>
                  </button>
                </li>
              ) : (
                <li key={i} className="rounded-xl px-3 py-2 bg-white/60 border-2 border-dashed border-[#EAD9B8] text-xs font-bold text-[#B39B7A] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Chuyện thứ {i + 1} · mở ở {i + 1} tim
                </li>
              ),
            )}
          </ul>
        </div>

        {chapters.length > 0 && (
          <ul className="flex flex-col gap-2.5">
            {chapters.map((c) => {
              const unlocked = isUnlocked(s, c.id);
              const p = s.chapters[c.id];
              return (
                <li key={c.id}>
                  <Link
                    href={unlocked ? `/island/lesson/${c.id}` : "/island/path"}
                    className={cx("flex items-center gap-3 rounded-[18px] border-[3px] px-4 py-3 bg-white", unlocked ? "border-[#8B5E3C] hover:bg-[#FBF0D9]" : "border-[#D8BF92] opacity-70")}
                  >
                    <span className="cci-chip !text-xs">{c.level}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-baloo font-extrabold text-[17px] leading-tight">
                        Chương {c.id} · {c.title}
                      </span>
                      <span className="block text-sm font-semibold text-[#6B4A30]">
                        Tuần {c.week} · {c.subtitle}
                      </span>
                    </span>
                    {!unlocked ? (
                      <Lock className="w-5 h-5 text-[#8B5E3C]" />
                    ) : p?.lesson ? (
                      <span className="flex">
                        {[0, 1, 2].map((i) => (
                          <Star key={i} className="w-4 h-4" fill={i < (p.stars || 0) ? "#F2C14E" : "#EAD9B8"} stroke="#4A3222" />
                        ))}
                      </span>
                    ) : (
                      <span className="cci-chip !bg-[#FFF1C7] !text-xs">Học</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-xs font-semibold text-[#6B4A30]">Mỗi tuần có {MISSIONS.length} nhiệm vụ ngắn — mở “Lộ trình” để xem chi tiết.</p>
      </div>
    </div>
  );
}

/** Văn phòng Mây: cầu nối sang lộ trình 30 ngày Call khách (tiếng Anh công sở, sau khi xong nền tảng B1). */
function OfficePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEscape(onClose);
  const [doneDays, setDoneDays] = useState<number[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tran_daily_roadmap_completed");
      if (raw) setDoneDays((JSON.parse(raw) as number[]).filter((n) => typeof n === "number"));
    } catch {
      /* bỏ qua */
    }
  }, []);
  const nextDay = DAILY_ROADMAP_DATA.find((d) => !doneDays.includes(d.day)) || DAILY_ROADMAP_DATA[DAILY_ROADMAP_DATA.length - 1];
  const golden = nextDay.tasks.find((t) => t.keyPhrase);
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-3 bg-[#4A3222]/40" onClick={onClose} role="dialog" aria-modal="true" aria-label="Văn phòng Mây">
      <div className="cci-card-wood w-full max-w-lg p-5 flex flex-col gap-4 anim-pop max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-[14px] border-[3px] border-[#4A3222] bg-[#FFF1C7] flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </span>
          <div className="flex-1">
            <h2 className="text-2xl font-extrabold leading-tight">Văn phòng Mây</h2>
            <p className="font-semibold text-[#6B4A30] text-sm">Lộ trình 30 ngày Call khách · tiếng Anh công sở</p>
          </div>
          <button type="button" onClick={onClose} className="cci-btn !min-h-[40px] !w-[40px] !p-0" aria-label="Đóng" data-sfx="close">
            <X className="w-5 h-5" />
          </button>
        </div>
        {!open && (
          <div className="rounded-[18px] px-4 py-3 bg-[#FFF9EE] border-[3px] border-dashed border-[#D9A92F] text-sm font-bold text-[#6B4A30]">
            🔒 Khu này mở khi bạn tới cấp B1 (Chương 9). Nền giao tiếp hằng ngày vững rồi thì họp với khách sẽ dễ hơn nhiều. Nếu bạn đã đi làm và cần ngay, vẫn có thể vào trước.
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 rounded-full bg-[#EAD9B8] border-2 border-[#8B5E3C] overflow-hidden">
            <div className="h-full bg-[#6FAE4F]" style={{ width: `${(doneDays.length / 30) * 100}%` }} />
          </div>
          <span className="text-sm font-extrabold">{doneDays.length}/30 ngày</span>
        </div>
        <div className="rounded-[18px] px-4 py-3 bg-white border-[3px] border-[#EAD9B8] flex flex-col gap-1">
          <div className="text-xs font-extrabold uppercase tracking-wide text-[#3F7A34]">
            Ngày {nextDay.day} · {nextDay.sprintBadge}
          </div>
          <div className="font-baloo font-extrabold text-lg leading-tight">{nextDay.title}</div>
          <div className="text-sm font-semibold text-[#6B4A30]">{nextDay.objectiveVi}</div>
          {golden?.keyPhrase && (
            <button type="button" data-sfx="none" onClick={() => speak(golden.keyPhrase!, { who: "pip" })} className="mt-1.5 text-left rounded-xl px-3 py-2 bg-[#F4FAEC] border-2 border-[#A8D27A]">
              <span className="block text-xs font-extrabold text-[#2C5A25]">Câu vàng hôm nay</span>
              <span className="block font-bold leading-snug">
                {golden.keyPhrase} <Volume2 className="inline w-3.5 h-3.5 text-[#3F7A34]" />
              </span>
              {golden.keyPhraseVi && <span className="block text-xs font-semibold text-[#6B4A30]">{golden.keyPhraseVi}</span>}
            </button>
          )}
        </div>
        <Link href={`/lessons?open=${nextDay.day}`} className={cx("cci-btn cci-btn-big", open && "cci-btn-primary")} data-sfx="whoosh">
          {open ? "Vào học Ngày " + nextDay.day : "Vẫn vào học trước"} →
        </Link>
      </div>
    </div>
  );
}
