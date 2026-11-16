// Ao Tôm Cua: danh mục giống, giá, thời gian lớn. File thuần (không "use client").
import type { FarmKind } from "./state";

export interface Species {
  kind: FarmKind;
  en: string;
  plural: string;
  vi: string;
  price: number; // vỏ sò
  sell: number; // vỏ sò khi thu hoạch
  hours: number; // thời gian lớn (chưa cho ăn)
  minLevel: number; // cấp đảo cần để mua
  say: { en: string; vi: string }; // câu tiếng Anh khi thu hoạch
}

export const SPECIES: Species[] = [
  {
    kind: "shrimp", en: "shrimp", plural: "shrimp", vi: "Tôm thẻ", price: 20, sell: 45, hours: 8, minLevel: 1,
    say: { en: "Look at these shrimp! They're so fresh.", vi: "Nhìn mẻ tôm này nè! Tươi rói luôn." },
  },
  {
    kind: "crab", en: "crab", plural: "crabs", vi: "Cua biển", price: 40, sell: 95, hours: 20, minLevel: 2,
    say: { en: "What a big crab! How much will you pay for it?", vi: "Con cua to quá! Bạn trả bao nhiêu nào?" },
  },
  {
    kind: "lobster", en: "lobster", plural: "lobsters", vi: "Tôm hùm", price: 90, sell: 230, hours: 40, minLevel: 5,
    say: { en: "Wow, a lobster! That's the best catch of the week.", vi: "Oa, tôm hùm! Mẻ ngon nhất tuần đấy." },
  },
];

export const SPECIES_BY_KIND = Object.fromEntries(SPECIES.map((x) => [x.kind, x])) as Record<FarmKind, Species>;

/** Vỏ sò khởi đầu để mua mẻ giống đầu tiên. */
export const STARTER_SHELLS = 40;
/** Mỗi lần cho ăn rút ngắn 20% thời gian lớn (tối đa 3 lần). */
export const FEED_CUT = 0.2;
export const MAX_FEED = 3;
/** Giá mở rộng ao: 3 → 6 ô, 6 → 9 ô. */
export const EXPAND_COST: Record<number, number> = { 3: 120, 6: 300 };
