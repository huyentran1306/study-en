// Đảo Phố Cảng (A2 · "Đảo Đi Đây Đó"): đảo xa phía sau đảo nhà, đi bằng phà.
// Mỗi chương A2 (5–8) có một địa điểm trên đảo. Mở khi qua thử thách cuối cấp A1 (nhập vai không gợi ý).
import { CHAPTERS, type NpcId } from "./curriculum";
import type { IslandState } from "./state";

export const HARBOR_FIRST_CHAPTER = 5;

export type HarborPlaceId = "hotel" | "restaurant" | "post" | "clinic";

export interface HarborPlace {
  id: HarborPlaceId;
  ch: number;
  name: string;
  en: string;
  tone: string;
}

export const HARBOR_PLACES: HarborPlace[] = [
  { id: "hotel", ch: 5, name: "Khách sạn Hải Âu", en: "Seagull Hotel", tone: "#4E7FB8" },
  { id: "restaurant", ch: 6, name: "Nhà hàng Bến Cảng", en: "Harbor Restaurant", tone: "#C96A2B" },
  { id: "post", ch: 7, name: "Bưu điện", en: "Post Office", tone: "#C8553D" },
  { id: "clinic", ch: 8, name: "Phòng khám & nhà thuốc", en: "Clinic & Pharmacy", tone: "#3F9E6E" },
];

export function harborPlace(id: string): HarborPlace | undefined {
  return HARBOR_PLACES.find((p) => p.id === id);
}

export function harborPlaceOfChapter(ch: number): HarborPlace | undefined {
  return HARBOR_PLACES.find((p) => p.ch === ch);
}

/** Cư dân của chương ở địa điểm (lấy từ giáo trình). */
export function placeNpc(p: HarborPlace): NpcId {
  return CHAPTERS.find((c) => c.id === p.ch)!.npc;
}

/** Thuyền trưởng Rái: cư dân mới ở bến phà, nói câu đi lại, du lịch (A2). */
export const OTTO = {
  id: "otto",
  name: "Thuyền trưởng Rái",
  voice: "pip" as NpcId,
  lines: [
    { en: "Ahoy! Welcome to Harbor Town. Where are you heading today?", vi: "Chào nhé! Chào mừng tới Phố Cảng. Hôm nay bạn định đi đâu?" },
    { en: "The ferry leaves every hour. Don't miss it!", vi: "Phà chạy mỗi tiếng một chuyến. Đừng lỡ chuyến nhé!" },
    { en: "Can I see your ticket, please?", vi: "Cho mình xem vé của bạn nhé?" },
    { en: "The hotel is just across the square, next to the restaurant.", vi: "Khách sạn ở ngay bên kia quảng trường, cạnh nhà hàng." },
    { en: "Feeling seasick? The pharmacy is on the left.", vi: "Say sóng hả? Nhà thuốc ở bên trái đó." },
  ],
};

export type IslandId = "home" | "isle" | "beach" | "harbor" | "city";

/** Các đảo trên bản đồ biển. */
export const ISLANDS: { id: IslandId; name: string; tag: string }[] = [
  { id: "home", name: "Đảo Nhà", tag: "A1" },
  { id: "isle", name: "Đảo Luyện", tag: "Luyện nói" },
  { id: "beach", name: "Đảo Cát Vui", tag: "Mini game" },
  { id: "harbor", name: "Đảo Phố Cảng", tag: "A2" },
  { id: "city", name: "Thành Phố Mây", tag: "B1 · sắp có" },
];

/** Thử thách cuối cấp A1 mở Đảo Phố Cảng; thử thách A2 sẽ mở Thành Phố Mây. */
export const HARBOR_CHALLENGE = "c1";
export const CITY_CHALLENGE = "c2";

/**
 * Đảo Phố Cảng mở theo năng lực: qua thử thách cuối cấp A1.
 * Ai đã học bài A2 đầu tiên (từ trước khi có luật này) thì giữ đảo đang mở.
 */
export function harborOpen(s: IslandState): boolean {
  return !!s.challenges[HARBOR_CHALLENGE]?.done || !!s.chapters[HARBOR_FIRST_CHAPTER]?.lesson;
}
