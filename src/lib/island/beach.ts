// Đảo Cát Vui: đảo nhỏ bên trái đảo nhà, mở ở cấp đảo 3.
// Có quầy trò chơi (mini game xả stress, thưởng vỏ sò có trần mỗi ngày) và 4 ô đất để tự chọn xây công trình.
// Công trình cho vỏ sò mỗi ngày bạn học + một ưu đãi nhỏ; nâng cấp 3 bậc.
import type { IslandState } from "./state";

export const BEACH_LEVEL = 3;

// ───────────── Mini game ─────────────

export type ArcadeId = "merge" | "garden" | "memory" | "fishing";

export interface ArcadeGame {
  id: ArcadeId;
  href: string;
  title: string;
  en: string;
  desc: string;
  tone: string;
  /** Bao nhiêu điểm thì được 1 vỏ sò. */
  per: number;
}

export const ARCADE: ArcadeGame[] = [
  { id: "merge", href: "/island/arcade/merge", title: "Ghép sinh vật biển", en: "Sea Merge", desc: "Vuốt để gộp hai con giống nhau, nuôi từ con sò lên tới cá voi.", tone: "#2F8FB0", per: 150 },
  { id: "garden", href: "/island/arcade/garden", title: "Ghép 3 vườn rau", en: "Garden Match", desc: "Đổi chỗ rau quả, đủ 3 cái giống nhau thì nổ. Có chế độ thư giãn không giới hạn.", tone: "#5E9E3E", per: 250 },
  { id: "memory", href: "/island/arcade/memory", title: "Lật thẻ trí nhớ", en: "Memory Cards", desc: "Lật 2 thẻ cho trùng cặp từ tiếng Anh với nghĩa, lấy từ Sổ từ của bạn.", tone: "#8E5BB5", per: 40 },
  { id: "fishing", href: "/island/arcade/fishing", title: "Câu cá chiều", en: "Sunset Fishing", desc: "Thả cần, chờ phao chìm thì kéo, giữ dây trong vùng xanh để bắt cá hiếm.", tone: "#2F8FB0", per: 30 },
];

/** Trần vỏ sò từ mini game mỗi ngày (chưa tính Quầy kem). */
export const ARCADE_CAP = 30;

// ───────────── Công trình trên ô đất ─────────────

export type BuildType = "icecream" | "library" | "coconut" | "volley";

export interface BuildKind {
  id: BuildType;
  name: string;
  en: string;
  tone: string;
  cost: number;
  /** Vỏ sò mỗi ngày học, theo bậc 1..3. */
  income: [number, number, number];
  /** Ưu đãi (tiếng Việt), theo bậc. */
  perk: (lv: number) => string;
}

export const BUILD_KINDS: BuildKind[] = [
  { id: "icecream", name: "Quầy kem", en: "ice cream stand", tone: "#E07A93", cost: 80, income: [3, 5, 7], perk: (lv) => `Trần vỏ sò mini game mỗi ngày +${lv * 10}` },
  { id: "library", name: "Thư viện nhỏ", en: "little library", tone: "#4E7FB8", cost: 100, income: [2, 4, 6], perk: (lv) => `+${lv} thức ăn cho ao mỗi ngày học` },
  { id: "coconut", name: "Vườn dừa", en: "coconut grove", tone: "#6FAE4F", cost: 120, income: [6, 10, 14], perk: () => "Thu nhập vỏ sò cao nhất" },
  { id: "volley", name: "Sân bóng chuyền", en: "volleyball court", tone: "#F29A4E", cost: 60, income: [4, 7, 10], perk: () => "Rẻ, xây nhanh, cư dân ra chơi" },
];

export function buildKind(id: string | undefined): BuildKind | undefined {
  return BUILD_KINDS.find((b) => b.id === id);
}

/** Giá nâng lên bậc lv (2 hoặc 3). */
export function upgradeCost(k: BuildKind, toLv: number): number {
  return Math.round(k.cost * (toLv === 2 ? 1.5 : 2.5));
}

export interface PlotSpec {
  id: string;
  /** Cấp đảo cần có. */
  level: number;
  /** Vỏ sò khai hoang (0 = mở sẵn). */
  clear: number;
}

export const PLOTS: PlotSpec[] = [
  { id: "p1", level: 3, clear: 0 },
  { id: "p2", level: 3, clear: 0 },
  { id: "p3", level: 5, clear: 80 },
  { id: "p4", level: 7, clear: 150 },
];

export type PlotStatus = "locked" | "wild" | "empty" | "built";

export function plotStatus(s: IslandState, level: number, id: string): PlotStatus {
  const spec = PLOTS.find((p) => p.id === id)!;
  const p = s.plots[id];
  if (p?.t) return "built";
  if (level < spec.level) return "locked";
  if (spec.clear > 0 && !p?.cleared) return "wild";
  return "empty";
}

function localDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Số ngày học kể từ ngày (giờ máy) của mốc fromIso, tính cả ngày đó. */
function daysBetween(days: string[], fromIso: string): number {
  const from = localDay(fromIso);
  if (!from) return 0;
  return days.filter((d) => d >= from).length;
}

/** Tổng vỏ sò công trình đã làm ra (cộng dồn qua các bậc). */
export function plotIncome(s: IslandState): number {
  let total = 0;
  for (const p of Object.values(s.plots)) {
    const k = buildKind(p.t);
    if (!k) continue;
    total += p.bank + k.income[Math.max(0, Math.min(2, p.lv - 1))] * daysBetween(s.studyDays, p.at);
  }
  return total;
}

/** Vỏ sò công trình làm ra hôm nay (nếu hôm nay đã học). Vừa nâng cấp hôm nay thì bậc mới tính từ mai. */
export function plotIncomeToday(s: IslandState, today: string): number {
  if (!s.studyDays.includes(today)) return 0;
  let n = 0;
  for (const p of Object.values(s.plots)) {
    const k = buildKind(p.t);
    if (!k) continue;
    const lv = localDay(p.at) > today ? p.lv - 1 : p.lv;
    if (lv >= 1) n += k.income[Math.min(2, lv - 1)];
  }
  return n;
}

/** Thức ăn thêm cho ao từ Thư viện nhỏ. */
export function libraryFood(s: IslandState): number {
  let n = 0;
  for (const p of Object.values(s.plots)) if (p.t === "library") n += (p.food || 0) + p.lv * daysBetween(s.studyDays, p.at);
  return n;
}

export function arcadeCap(s: IslandState): number {
  let bonus = 0;
  for (const p of Object.values(s.plots)) if (p.t === "icecream") bonus += p.lv * 10;
  return ARCADE_CAP + bonus;
}

/** Vỏ sò đã nhận từ mini game hôm nay. */
export function arcadeToday(s: IslandState, today: string): number {
  return s.arcade.day === today ? s.arcade.today : 0;
}
