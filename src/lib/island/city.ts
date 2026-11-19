// Thành Phố Mây (B1 · "Đảo Kết Bạn"): đảo xa phía sau bên phải. Mỗi chương B1 (9–13) có một địa điểm.
// Mở khi qua thử thách cuối cấp A2; ai đã học bài B1 đầu tiên thì giữ đảo đang mở.
import type { IslandState } from "./state";

export const CITY_FIRST_CHAPTER = 9;
export const CITY_CHALLENGE = "c2";

export type CityPlaceId = "teahouse" | "cinema" | "bookshop" | "mall" | "tower";

export interface CityPlace {
  id: CityPlaceId;
  ch: number;
  name: string;
  tone: string;
}

export const CITY_PLACES: CityPlace[] = [
  { id: "teahouse", ch: 9, name: "Quán trà chiều", tone: "#3F7A34" },
  { id: "cinema", ch: 10, name: "Rạp chiếu phim", tone: "#C8553D" },
  { id: "bookshop", ch: 11, name: "Nhà sách kể chuyện", tone: "#8E5BB5" },
  { id: "mall", ch: 12, name: "Quầy chăm sóc khách hàng", tone: "#C96A2B" },
  { id: "tower", ch: 13, name: "Toà nhà Mây (phỏng vấn)", tone: "#4E7FB8" },
];

export function cityPlace(id: string): CityPlace | undefined {
  return CITY_PLACES.find((p) => p.id === id);
}

export function cityPlaceOfChapter(ch: number): CityPlace | undefined {
  return CITY_PLACES.find((p) => p.ch === ch);
}

export function cityOpen(s: IslandState): boolean {
  return !!s.challenges[CITY_CHALLENGE]?.done || !!s.chapters[CITY_FIRST_CHAPTER]?.lesson;
}
