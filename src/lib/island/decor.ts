// Đảo Nhỏ Của Tôi: 9 ô (lưới 3×3) để tự trang trí bằng vỏ sò.
export type DecorId = "bench" | "lamp" | "pot" | "statue" | "swing" | "flamingo" | "sign" | "snowman";

export interface DecorItem {
  id: DecorId;
  name: string;
  en: string;
  cost: number;
}

export const DECOR_ITEMS: DecorItem[] = [
  { id: "pot", name: "Chậu hoa", en: "flower pot", cost: 30 },
  { id: "sign", name: "Biển chỉ đường", en: "signpost", cost: 40 },
  { id: "bench", name: "Ghế gỗ", en: "wooden bench", cost: 40 },
  { id: "lamp", name: "Đèn đường", en: "street lamp", cost: 50 },
  { id: "flamingo", name: "Hồng hạc", en: "flamingo", cost: 60 },
  { id: "snowman", name: "Người tuyết", en: "snowman", cost: 70 },
  { id: "swing", name: "Xích đu", en: "swing", cost: 80 },
  { id: "statue", name: "Tượng mèo", en: "cat statue", cost: 90 },
];

export const DECOR_SLOTS = ["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8", "d9"] as const;
/** Mở đảo trang trí từ cấp đảo này. */
export const MINE_LEVEL = 2;

export function decorItem(id: string | undefined): DecorItem | undefined {
  return DECOR_ITEMS.find((x) => x.id === id);
}
