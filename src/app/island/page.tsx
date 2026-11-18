"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Moon, RotateCcw, Sun, ArrowRight, BookHeart, BookOpen, Briefcase, Fish, Shell, Sprout, Coffee, Flame, Gift, Hammer, Heart, Lock, Map as MapIcon, MessageCircle, Plane, Route, ShoppingBasket, Signpost, Star, Volume2, X, Zap, Flower2 } from "lucide-react";
import { MAP_BG_3D } from "@/components/island/art3d";
import { Avatar, Character } from "@/components/island/character";
import { cx } from "@/components/island/ui";
import { SyncBadge } from "@/components/island/sync-badge";
import { ANIMALS, GardenAnimals, IslandBuilds, BuildPanel } from "@/components/island/garden";
import type { Label3D } from "@/components/island/island3d";
import type { WorldController, WorldState } from "@/components/island/world3d";
import { canWebGL } from "@/components/island/webgl";
import { JourneyPanel } from "@/components/island/journey";
import { Swimmers, type SwimItem } from "@/components/island/pond-scene";
import { AudioToggles } from "@/components/island/audio-controls";
import { FullscreenButton } from "@/components/island/island-chrome";
import { CHAPTERS, MISSIONS, NPCS, PLACES, type NpcId, type SceneId } from "@/lib/island/curriculum";
import { BUILDS, NPC_STORIES } from "@/lib/island/drills";
import { SPRINT_DAYS, sprintInfo, activeSlot, collection, growth, shells, chestOpened, currentChapterId, missionsDone, readyCount, dueWords, duePhrases, friendship, isUnlocked, islandLevel, nextMission, streak, todayPlan, totalStars, useIsland, type PlanStep } from "@/lib/island/progress";
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


const SCENE_NPC: Record<SceneId, NpcId> = { cafe: "miso", market: "mallow", airport: "pip", pond: "kero", tree: "pip" };
const NPC_SCENE: Partial<Record<NpcId, SceneId>> = { miso: "cafe", mallow: "market", pip: "airport", kero: "pond" };

const Island3D = dynamic(() => import("@/components/island/island3d"), {
  ssr: false,
  loading: () => <MapLoading />,
});

function MapLoading() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="rounded-full px-4 py-2 bg-white/85 border-2 border-[#8B5E3C] font-baloo font-extrabold text-[#6B4A30] anim-floaty">Đang dựng đảo…</span>
    </div>
  );
}

type MapMode = "3d" | "2d";
const MODE_KEY = "cci-map-mode";

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
  const [mode, setMode] = useState<MapMode | null>(null);
  const [dusk, setDusk] = useState(false);
  const [talk, setTalk] = useState<{ id: string; i: number } | null>(null);
  const talkCount = useRef<Record<string, number>>({});
  const world = useRef<WorldController | null>(null);
  const router = useRouter();
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(MODE_KEY);
    setMode(saved === "2d" || !canWebGL() ? "2d" : "3d");
    const h = new Date().getHours();
    setDusk(h >= 17 || h < 6);
  }, []);
  useEffect(() => {
    if (!talk) return;
    const t = setTimeout(() => setTalk(null), 5200);
    return () => clearTimeout(t);
  }, [talk]);
  const switchMode = (m: MapMode) => {
    setMode(m);
    localStorage.setItem(MODE_KEY, m);
  };

  const curId = currentChapterId(s);
  const cur = CHAPTERS.find((c) => c.id === curId)!;
  const nm = nextMission(s, curId);
  const plan = todayPlan(s);
  const planDone = plan.filter((p) => p.done).length;
  const sprint = sprintInfo(s);
  const step = plan.find((p) => !p.done) || null;
  const line = keroLine(step, cur.npc, cur.quest, nm);
  const lv = islandLevel(s.xp);
  const due = dueWords(s).length + duePhrases(s).length;
  const sceneUnlocked = (scene: SceneId) => CHAPTERS.some((c) => c.scene === scene && isUnlocked(s, c.id));
  const officeOpen = isUnlocked(s, 9);
  const goHref = step ? step.href : "/island/path";
  const ready = readyCount(s);
  const plotsReady = CHAPTERS.filter((c) => missionsDone(s, c.id) >= MISSIONS.length && !s.garden[String(c.id)]).length;
  const dex = collection(s);
  const pondKids: SwimItem[] = [];
  for (let i = 0; i < s.farm.size; i++) {
    const sl = activeSlot(s, i);
    if (sl) pondKids.push({ id: i, kind: sl.kind, size: sl.kind === "shrimp" ? 15 : sl.kind === "crab" ? 17 : 19, ready: growth(sl).pct >= 1, rare: sl.rare });
  }

  const is3d = mounted && mode === "3d";
  const worldState: WorldState = {
    quest: mounted ? cur.npc : null,
    level: mounted ? lv.level : 1,
    garden: mounted ? Object.keys(s.garden).length : 0,
    pond: pondKids.map((k) => ({ kind: k.kind, ready: k.ready })),
    office: mounted && officeOpen,
    dusk,
  };
  const onPick3d = (id: string | null) => {
    if (!id) return setTalk(null);
    const [kind, key] = id.split(":");
    world.current?.hop(id);
    if (kind === "npc") {
      const who = key as NpcId;
      sfx.chirp(who);
      if (who === "bo") return setPanel("journey");
      const sc = NPC_SCENE[who];
      if (sc) setOpen(sc);
    } else if (kind === "animal") {
      const a = ANIMALS.find((x) => x.id === key);
      if (!a) return;
      const n = talkCount.current[a.id] || 0;
      talkCount.current[a.id] = n + 1;
      const i = n % a.lines.length;
      setTalk({ id: a.id, i });
      sfx.animal(a.id);
      setTimeout(() => speak(a.lines[i].en, { who: a.voice }), a.id === "buffalo" ? 900 : 650);
    } else if (kind === "place") {
      sfx.open();
      if (key === "garden") router.push("/island/garden");
      else if (key === "farm") router.push("/island/farm");
      else if (key === "office") setPanel("office");
      else setOpen(key as SceneId);
    }
  };
  const labels3d: Label3D[] = [];
  if (is3d) {
    labels3d.push({ id: "place:garden", node: <PinBody icon={Sprout} tone="#5E9E3E" label="Vườn Nhiệm Vụ" href="/island/garden" badge={plotsReady > 0 ? plotsReady : null} /> });
    labels3d.push({ id: "place:farm", node: <PinBody icon={Fish} tone="#2F8FB0" label="Ao Tôm Cua" href="/island/farm" badge={ready > 0 ? ready : null} /> });
    for (const sp of SPOTS) labels3d.push({ id: `place:${sp.scene}`, node: <PinBody icon={sp.icon} tone={sp.color} label={sp.label} locked={!sceneUnlocked(sp.scene)} onClick={() => setOpen(sp.scene)} /> });
    labels3d.push({
      id: "place:office",
      node: <PinBody icon={Briefcase} tone="#C96A2B" label={officeOpen ? "Văn phòng Mây" : "???"} locked={!officeOpen} onClick={() => setPanel("office")} title="Văn phòng Mây — luyện Call khách 30 ngày (mở ở cấp B1)" />,
    });
    labels3d.push({
      id: `npc:${cur.npc}`,
      top: true,
      node: (
        <button
          type="button"
          data-sfx="none"
          aria-label={`${NPCS[cur.npc].name} đang có nhiệm vụ cho bạn`}
          onClick={() => onPick3d(`npc:${cur.npc}`)}
          className="cci-hit relative block rounded-[10px] bg-[#F2C14E] border-[2.5px] border-[#4A3222] font-baloo font-extrabold text-[18px] leading-none w-[26px] h-[32px] anim-floaty"
          style={{ boxShadow: "0 3px 0 #4A3222" }}
        >
          !
        </button>
      ),
    });
    if (talk) {
      const a = ANIMALS.find((x) => x.id === talk.id);
      if (a)
        labels3d.push({
          id: `animal:${a.id}`,
          top: true,
          node: (
            <div className="mb-1 w-max max-w-[min(260px,70vw)] rounded-[14px] px-3 py-2 bg-white border-[3px] border-[#8B5E3C] shadow-[0_3px_0_#8B5E3C] anim-pop text-left text-[13px]">
              <div className="font-baloo font-extrabold leading-tight text-[#4A3222]">
                {a.name}: {a.lines[talk.i].en}
              </div>
              <div className="font-semibold text-[#6B4A30] leading-snug text-xs">{a.lines[talk.i].vi}</div>
            </div>
          ),
        });
    }
  }

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
    <div className="max-w-[1320px] mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {/* Biển bao quanh đảo */}
      <div aria-hidden className="cci-ocean" />
      {/* Hoàng hôn: phủ ánh cam tím lên biển */}
      <div aria-hidden className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000" style={{ opacity: is3d && dusk ? 1 : 0, background: "linear-gradient(180deg, rgba(255,150,100,.38) 0%, rgba(240,130,150,.22) 45%, rgba(80,60,150,.28) 100%)" }} />
      {/* Bản đồ 16:10 co theo chiều cao màn hình (trừ navbar, lề và bề dày khối đảo) để luôn thấy trọn khu vườn. */}
      <div className="cci-mapfit relative z-[1] mx-auto w-full mb-8 lg:mb-12 lg:w-[min(100%,calc((100dvh-9rem)*1.6))]">
        {/* ── Bản đồ ── */}
        {mode === "3d" || !mounted ? (
          <div className="cci-map3d relative w-full aspect-[5/4] sm:aspect-[16/10] max-h-[calc(100dvh-4.5rem)] min-h-[240px]" style={{ containerType: "inline-size" }}>
            {is3d ? <Island3D state={worldState} labels={labels3d} onPick={onPick3d} onFail={() => setMode("2d")} apiRef={world} /> : <MapLoading />}
            {is3d && (
              <div className="absolute right-2 bottom-2 hud:right-4 hud:bottom-4 z-[5] flex flex-col gap-1.5">
                <MapCtl label={dusk ? "Chuyển sang ban ngày" : "Ngắm hoàng hôn"} onClick={() => setDusk((d) => !d)} icon={dusk ? Sun : Moon} />
                <MapCtl label="Về góc nhìn ban đầu" onClick={() => world.current?.resetView()} icon={RotateCcw} />
                <MapCtl label="Chuyển sang bản đồ 2D" onClick={() => switchMode("2d")} text="2D" />
              </div>
            )}
          </div>
        ) : (
        <div className="cci-diorama relative w-full overflow-hidden rounded-[22px] sm:rounded-[28px] border-[3px] border-[#8B5E3C]" style={{ aspectRatio: "1280 / 800", containerType: "inline-size", background: "#9CCB6A" }}>
          <div className="absolute right-2 bottom-2 hud:right-4 hud:bottom-4 z-[7]">
            <MapCtl label="Chuyển sang đảo 3D" onClick={() => switchMode("3d")} text="3D" />
          </div>
          <svg viewBox="0 0 1280 800" className="absolute inset-0 w-full h-full" aria-hidden="true" dangerouslySetInnerHTML={{ __html: MAP_BG_3D }} />
          <div aria-hidden className="cci-light" />
          <div aria-hidden className="cci-cloudshade" style={{ top: "18%", width: "26cqw", height: "12cqw", animationDuration: "70s" }} />
          <div aria-hidden className="cci-cloudshade" style={{ top: "58%", width: "20cqw", height: "9cqw", animationDuration: "95s", animationDelay: "-40s" }} />

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
                className="cci-sprite cci-hit absolute hover:scale-105 active:scale-95 transition-transform"
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
          <div className="cci-sprite absolute" style={{ left: P(560, 1280), top: P(384, 800), width: P(86, 1280), zIndex: 3 }}>
            <Character who="bo" mood="idle" size="100%" delay={0.3} />
          </div>

          {/* Heo, rồng, trâu */}
          <GardenAnimals />

          {/* Ao Tôm Cua: con đang nuôi bơi trong hồ */}
          {mounted && pondKids.length > 0 && (
            <div className="absolute" style={{ left: P(26, 1280), top: P(572, 800), width: P(248, 1280), height: P(148, 800), zIndex: 2 }}>
              <Swimmers mode="top" items={pondKids} />
            </div>
          )}
          {/* Ghim địa điểm: cùng một kiểu, chỗ chưa mở thì mờ đi */}
          <Pin x={490} y={244} icon={Sprout} tone="#5E9E3E" label="Vườn Nhiệm Vụ" href="/island/garden" badge={mounted && plotsReady > 0 ? plotsReady : null} />
          <Pin x={182} y={548} icon={Fish} tone="#2F8FB0" label="Ao Tôm Cua" href="/island/farm" badge={mounted && ready > 0 ? ready : null} />
          {SPOTS.map((sp) => {
            const unlocked = mounted ? sceneUnlocked(sp.scene) : true;
            return <Pin key={sp.scene} x={sp.x} y={sp.y} icon={sp.icon} tone={sp.color} label={sp.label} locked={!unlocked} onClick={() => setOpen(sp.scene)} />;
          })}
          <Pin
            x={1022}
            y={592}
            icon={Briefcase}
            tone="#C96A2B"
            label={mounted && officeOpen ? "Văn phòng Mây" : "???"}
            locked={!(mounted && officeOpen)}
            onClick={() => setPanel("office")}
            title="Văn phòng Mây — luyện Call khách 30 ngày (mở ở cấp B1)"
          />
        </div>
        )}

        {/* ── HUD: máy tính đè lên bản đồ (gọn 4 góc), điện thoại xếp dưới bản đồ ── */}
        <div className="flex flex-col gap-3 mt-10 hud:contents">
          {/* Thẻ người chơi */}
          <div className="order-2 hud:absolute hud:left-4 hud:top-4 hud:z-10 self-start flex items-center gap-3 rounded-[22px] clay pl-1.5 pr-2 py-1.5">
            <div className="relative shrink-0">
              <Avatar who="bo" size={50} />
              <span className="absolute -bottom-1 -right-1.5 min-w-[24px] h-[24px] px-1 rounded-full bg-[#F2C14E] border-[2.5px] border-[#4A3222] font-baloo font-extrabold text-[13px] leading-none flex items-center justify-center" title="Cấp đảo">
                {mounted ? lv.level : 1}
              </span>
            </div>
            <div className="flex flex-col gap-1 min-w-0 w-[136px]">
              <span className="font-baloo font-extrabold text-lg leading-none truncate">{mounted ? username || "Bơ" : "Bơ"}</span>
              <div className="h-2.5 rounded-full bg-[#EAD9B8] overflow-hidden">
                <div className="h-full rounded-full bg-[#6FAE4F] transition-all" style={{ width: `${mounted ? lv.pct : 0}%` }} />
              </div>
              <span className="text-[11px] font-bold text-[#6B4A30] leading-none">
                Cấp đảo {mounted ? lv.level : 1} · {mounted ? lv.pct : 0}%
              </span>
            </div>
            <SyncBadge compact />
          </div>

          {/* Thanh công cụ: dọc bên trái trên máy tính, hàng ngang trên điện thoại */}
          <nav className="order-3 hud:absolute hud:left-4 hud:top-[100px] hud:z-10 grid grid-cols-6 hud:grid-cols-1 gap-2 hud:gap-2.5" aria-label="Công cụ học">
            <RailBtn href="/island/words" icon={BookOpen} label="Sổ từ" tone="#3F7A34" badge={mounted && due > 0 ? due : null} />
            <RailBtn href={`/island/reflex?ch=${curId}`} icon={Zap} label="Phản xạ" tone="#D9A92F" />
            <RailBtn href="/island/path" icon={Route} label="Lộ trình" tone="#4E7FB8" />
            <RailBtn href="/island/collection" icon={BookHeart} label="Sưu tập" tone="#C8553D" badge={mounted && dex.claimable ? "!" : null} />
            <RailBtn onClick={() => setPanel("build")} icon={Hammer} label="Xây đảo" tone="#8B5E3C" />
            <RailBtn href="/island/chat" icon={MessageCircle} label="Tám AI" tone="#7A5BC7" />
          </nav>

          {/* Góc phải: chỉ số + cài đặt */}
          <div className="order-1 hud:absolute hud:right-4 hud:top-4 hud:z-10 flex items-center justify-between hud:justify-end gap-2.5">
            <div className="flex items-center gap-3 h-[50px] px-4 rounded-full clay font-baloo font-extrabold text-lg">
              <span className="flex items-center gap-1.5" title="Chuỗi ngày học">
                <Flame className="w-5 h-5" fill="#F29A4E" stroke="#4A3222" /> {mounted ? streak(s) : 0}
              </span>
              <span className="flex items-center gap-1.5" title="Tổng số sao">
                <Star className="w-5 h-5" fill="#F2C14E" stroke="#4A3222" /> {mounted ? totalStars(s) : 0}
              </span>
              <Link href="/island/farm" className="flex items-center gap-1.5 hover:-translate-y-0.5 transition-transform" title="Vỏ sò — tiêu ở Ao Tôm Cua">
                <Shell className="w-5 h-5 text-[#C99A1E]" /> {mounted ? shells(s) : 0}
              </Link>
            </div>
            <div className="flex items-center gap-0.5 h-[50px] px-1 rounded-full clay">
              <AudioToggles flat />
              <span className="hidden md:contents">
                <FullscreenButton flat />
              </span>
            </div>
          </div>

          {/* Thanh dưới: Kero nhắc + hành trình hôm nay + nút đi tiếp */}
          <div className="order-1 hud:absolute hud:left-1/2 hud:-translate-x-1/2 hud:bottom-4 hud:z-10 hud:w-[min(780px,calc(100%-12rem))] flex items-center gap-3 rounded-[24px] clay p-2 pl-2.5">
            <button
              type="button"
              data-sfx="none"
              className="shrink-0 hover:scale-105 transition-transform"
              onClick={() => {
                sfx.chirp("kero");
                setTimeout(() => speak(line.en, { who: "kero" }), 300);
              }}
              aria-label="Nghe Kero nói"
              title="Nghe Kero nói"
            >
              <Avatar who="kero" size={58} />
            </button>
            <button type="button" data-sfx="open" onClick={() => setPanel("journey")} className="flex-1 min-w-0 text-left group" title="Xem hành trình hôm nay">
              <span className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#3F7A34]">
                <MapIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="shrink-0">{mounted && sprint.on ? `Ngày ${sprint.day}/${SPRINT_DAYS} · ` : "Hôm nay "}{mounted ? planDone : 0}/{mounted ? plan.length : 3}</span>
                <span className="flex items-center gap-1 shrink-0">
                  {plan.map((p) => {
                    const ok = mounted && p.done;
                    const isNext = mounted && p === step;
                    return <span key={p.key} className="w-2.5 h-2.5 rounded-full" style={{ background: ok ? "#3F7A34" : isNext ? "#F2C14E" : "#E6D6B6", boxShadow: isNext ? "0 0 0 2px #FFF1C7" : undefined }} />;
                  })}
                  <Gift className={cx("w-3.5 h-3.5 ml-0.5", mounted && planDone === plan.length && !chestOpened(s) ? "text-[#C96A2B] anim-bounce" : "text-[#D8BF92]")} />
                </span>
                <span className="truncate normal-case tracking-normal text-[#6B4A30] group-hover:underline underline-offset-2">{mounted ? (step ? step.title : chestOpened(s) ? "Xong hôm nay 🎉" : "Rương thưởng đang chờ!") : cur.quest.vi}</span>
              </span>
              <span className="block font-extrabold text-[15px] sm:text-[16px] leading-snug mt-0.5 line-clamp-2">{mounted ? line.en : cur.quest.en}</span>
              <span className="block text-[13px] font-semibold text-[#6B4A30] leading-snug truncate">{mounted ? line.vi : cur.quest.vi}</span>
            </button>
            <Link
              href={mounted ? goHref : "#"}
              onClick={(e) => {
                if (mounted && !step) {
                  e.preventDefault();
                  setPanel("journey");
                }
              }}
              data-sfx="whoosh"
              className="gloss shrink-0 flex flex-col items-center justify-center rounded-[18px] h-[62px] px-4 min-w-[112px] text-white hover:-translate-y-0.5 active:translate-y-0.5 transition-transform"
              style={{ background: "linear-gradient(180deg,#5E9E3E,#3F7A34)", border: "3px solid #2C5A25", boxShadow: "0 4px 0 #2C5A25" }}
            >
              <span className="text-[11px] font-bold opacity-90 leading-none">{mounted && step ? `Bước ${planDone + 1}/${plan.length} · ~${step.mins}′` : "Hôm nay"}</span>
              <span className="font-baloo font-extrabold text-[18px] leading-tight flex items-center gap-1 mt-0.5">
                {!mounted ? "Bắt đầu" : step ? "Đi thôi" : chestOpened(s) ? "Xong!" : "Mở rương"}
                {mounted && !step ? <Gift className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </span>
            </Link>
          </div>
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

/** Ghim địa điểm trên bản đồ. Chỗ chưa mở: nền mờ, viền đứt, chữ nhỏ hơn. */
type PinProps = { icon: React.ElementType; tone: string; label: string; locked?: boolean; badge?: number | string | null; href?: string; onClick?: () => void; title?: string };

function Pin({ x, y, ...rest }: PinProps & { x: number; y: number }) {
  return (
    <div className="absolute -translate-x-1/2" style={{ left: P(x, 1280), top: P(y, 800), zIndex: 6 }}>
      <PinBody {...rest} />
    </div>
  );
}

/** Thân ghim (dùng cho cả bản đồ 2D lẫn nhãn nổi trên đảo 3D). */
function PinBody({ icon: Icon, tone, label, locked = false, badge, href, onClick, title }: PinProps) {
  const style: React.CSSProperties = {
    fontSize: locked ? "max(9px, 1.08cqw)" : "max(10px, 1.22cqw)",
    gap: "0.5cqw",
    padding: "0.32cqw 1cqw 0.32cqw 0.32cqw",
    borderRadius: 999,
    background: locked ? "rgba(248,240,222,.88)" : "linear-gradient(180deg,#FFFFFF,#FFF3DA)",
    border: locked ? "2px dashed #B79A6E" : "2.5px solid #4A3222",
    boxShadow: locked ? "none" : "inset 0 2px 0 #fff, 0 3px 0 rgba(74,50,34,.65), 0 9px 12px -4px rgba(40,30,10,.4)",
    color: locked ? "#8B6B48" : "#4A3222",
  };
  const Ico = locked ? Lock : Icon;
  const inner = (
    <>
      <span className={cx("cci-pin-gem flex items-center justify-center rounded-full shrink-0", !locked && "gem")} style={{ width: "2.2cqw", height: "2.2cqw", minWidth: 18, minHeight: 18, background: locked ? "#D5C29C" : undefined, "--tone": tone } as React.CSSProperties}>
        <Ico style={{ width: "1.2cqw", height: "1.2cqw", minWidth: 10, minHeight: 10, color: "#fff" }} strokeWidth={2.6} />
      </span>
      <span className="cci-pin-label">{label}</span>
      {badge != null && (
        <span className="absolute -top-[max(1cqw,6px)] -right-[max(0.9cqw,6px)] min-w-[max(2cqw,17px)] h-[max(2cqw,17px)] px-[max(0.45cqw,3px)] rounded-full bg-[#F2C14E] border-2 border-[#4A3222] flex items-center justify-center anim-bounce leading-none" style={{ fontSize: "max(10px, 1cqw)" }}>
          {badge}
        </span>
      )}
      {!locked && <span aria-hidden className="absolute left-1/2 top-full -translate-x-1/2 w-0 h-0" style={{ borderLeft: "0.55cqw solid transparent", borderRight: "0.55cqw solid transparent", borderTop: "0.65cqw solid #4A3222" }} />}
    </>
  );
  const cls = "cci-pin relative inline-flex items-center whitespace-nowrap font-baloo font-extrabold transition-transform hover:-translate-y-0.5";
  return href ? (
    <Link href={href} data-sfx="open" className={cls} style={style} title={title || label} aria-label={label}>
      {inner}
    </Link>
  ) : (
    <button type="button" data-sfx="open" onClick={onClick} className={cls} style={style} title={title || label} aria-label={label}>
      {inner}
    </button>
  );
}

/** Nút tròn nhỏ ở góc bản đồ (hoàng hôn, góc nhìn, 2D/3D). */
function MapCtl({ label, onClick, icon: Icon, text }: { label: string; onClick: () => void; icon?: React.ElementType; text?: string }) {
  return (
    <button
      type="button"
      data-sfx="tap"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="clay cci-hit relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center gap-0.5 font-baloo font-extrabold text-[12px] text-[#4A3222] hover:-translate-y-0.5 active:translate-y-0.5 transition-transform"
    >
      {Icon && <Icon className="w-4 h-4" strokeWidth={2.6} />}
      {text && !Icon && text}
    </button>
  );
}

/** Ô công cụ trên thanh dọc bên trái. */
function RailBtn({ href, onClick, icon: Icon, label, tone, badge }: { href?: string; onClick?: () => void; icon: React.ElementType; label: string; tone: string; badge?: number | string | null }) {
  const cls = "clay relative flex flex-col items-center justify-center gap-1 rounded-[18px] h-[60px] hud:w-[62px] hover:-translate-y-0.5 active:translate-y-0.5 transition-transform";
  const inner = (
    <>
      <span className="gem w-[30px] h-[30px] rounded-full flex items-center justify-center" style={{ "--tone": tone } as React.CSSProperties}>
        <Icon className="w-4 h-4 text-white" strokeWidth={2.6} />
      </span>
      <span className="font-baloo font-extrabold text-[11px] leading-none text-[#4A3222] whitespace-nowrap">{label}</span>
      {badge != null && <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 rounded-full bg-[#F2C14E] border-2 border-[#4A3222] text-[11px] font-extrabold flex items-center justify-center">{badge}</span>}
    </>
  );
  return href ? (
    <Link href={href} data-sfx="open" className={cls} title={label}>
      {inner}
    </Link>
  ) : (
    <button type="button" data-sfx="open" onClick={onClick} className={cls} title={label}>
      {inner}
    </button>
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
