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

// ───────────── Con hiếm ─────────────

/** Mỗi loài có một biến thể hiếm, bán giá gấp đôi. */
export const RARE: Record<FarmKind, { en: string; vi: string; say: { en: string; vi: string } }> = {
  shrimp: { en: "golden shrimp", vi: "Tôm vàng", say: { en: "A golden shrimp! It's shining like the sun.", vi: "Tôm vàng! Nó sáng lấp lánh như mặt trời." } },
  crab: { en: "blue crab", vi: "Cua xanh", say: { en: "A blue crab? I've never seen one before!", vi: "Cua xanh á? Mình chưa thấy con nào luôn!" } },
  lobster: { en: "purple lobster", vi: "Tôm hùm tím", say: { en: "A purple lobster! Only one in a hundred is purple.", vi: "Tôm hùm tím! Trăm con mới có một con tím đấy." } },
};
export const RARE_SELL = 2;
/** Tỉ lệ ra con hiếm: 8% + 1% mỗi ngày học liên tiếp, tối đa 20%. */
export function rareChance(streak: number) {
  return Math.min(0.2, 0.08 + 0.01 * Math.max(0, streak));
}

// ───────────── Khách đến chợ mua hải sản ─────────────

export interface Customer {
  who: "miso" | "pip" | "kero" | "mallow";
  ask: string; // {item} {price}
  askVi: string;
  answer: string;
  wrong: string[];
}

/** Khách hỏi mua; người chơi nói (hoặc chọn) câu đáp đúng để bán được giá cao hơn. */
export const CUSTOMERS: Customer[] = [
  { who: "miso", ask: "Hi! Can I have this {item}, please?", askVi: "Chào! Cho mình con {itemVi} này nhé?", answer: "Sure! Here you are.", wrong: ["No, thank you.", "I'm from Vietnam."] },
  { who: "pip", ask: "How much is this {item}?", askVi: "Con {itemVi} này bao nhiêu?", answer: "It's {price} shells.", wrong: ["It's very big.", "I'm fine, thanks."] },
  { who: "kero", ask: "Is this {item} fresh?", askVi: "Con {itemVi} này tươi không?", answer: "Yes, I caught it this morning!", wrong: ["Yes, it's cheap.", "No, I'm hungry."] },
  { who: "miso", ask: "Can I pay with shells?", askVi: "Mình trả bằng vỏ sò được không?", answer: "Of course! That's {price} shells, please.", wrong: ["I like shells.", "Yes, it's a shrimp."] },
  { who: "pip", ask: "Do you have a bigger one?", askVi: "Bạn có con nào to hơn không?", answer: "Sorry, this is the biggest one today.", wrong: ["Yes, I'm bigger.", "It's in the kitchen."] },
  { who: "kero", ask: "Could you put it in a bag for me?", askVi: "Bạn bỏ vào túi giúp mình được không?", answer: "Sure, here's your bag.", wrong: ["Sure, I'm a bag.", "No, it's Monday."] },
  { who: "miso", ask: "I'd like two, please. Is that okay?", askVi: "Mình muốn lấy hai con. Được không?", answer: "Sorry, I only have one today.", wrong: ["Yes, I'm two.", "Okay, see you yesterday."] },
  { who: "pip", ask: "Wow, it looks delicious! How do you cook it?", askVi: "Trông ngon quá! Bạn nấu nó thế nào?", answer: "I usually steam it with lemongrass.", wrong: ["I usually go to school.", "It's my favorite color."] },
  { who: "kero", ask: "Can you give me a discount?", askVi: "Bạn bớt giá cho mình được không?", answer: "Okay, just for you. Ten shells off!", wrong: ["Okay, ten o'clock.", "I can swim."] },
  { who: "mallow", ask: "I need it for a party tonight. Is it enough for four people?", askVi: "Mình cần cho bữa tiệc tối nay. Đủ cho bốn người không?", answer: "Yes, it's enough for four people.", wrong: ["Yes, I'm four years old.", "No, the party is blue."] },
];
/** Thưởng thêm khi bán cho khách: nói đúng +50%, chọn đúng +25%. */
export const TIP_SPEAK = 0.5;
export const TIP_TAP = 0.25;
