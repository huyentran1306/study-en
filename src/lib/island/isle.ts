// Đảo Luyện: đảo nhỏ nối với đảo nhà bằng cây cầu gỗ. Mỗi cách luyện ở Phòng luyện là một công trình.
// Công trình còn giàn giáo cho tới khi bạn thử tính năng đó lần đầu → dựng xong, nhận vỏ sò.
import { EPISODES } from "./life";
import { MISSIONS, bossOpen, weeklyBoss } from "./missions";
import type { IslandState } from "./state";

export type IsleId = "call" | "mission" | "boss" | "stories" | "listen" | "shadow" | "mirror" | "lesson" | "visit";

export interface IsleSpot {
  id: IsleId;
  href: string;
  /** Tên công trình trên đảo. */
  place: string;
  /** Tên tính năng (trùng Phòng luyện). */
  feature: string;
  tone: string;
  /** Một câu: vào đây làm gì. */
  pitch: string;
}

export const ISLE: IsleSpot[] = [
  { id: "call", href: "/island/call", place: "Bốt điện thoại", feature: "Gọi điện", tone: "#C8553D", pitch: "Gọi cho cư dân, chỉ dùng giọng nói, không chữ." },
  { id: "mission", href: "/island/mission", place: "Bảng tin", feature: "Nhiệm vụ hỏi thông tin", tone: "#C96A2B", pitch: "Cư dân giữ bí mật, bạn hỏi đúng thì mới lấy được." },
  { id: "shadow", href: "/island/shadow", place: "Sân khấu", feature: "Nói đuổi", tone: "#3F7A34", pitch: "Nói đuổi theo câu mẫu, tập trọng âm và nối âm." },
  { id: "listen", href: "/island/listen", place: "Hải đăng", feature: "Phòng nghe", tone: "#2F8FB0", pitch: "Nghe giọng Mỹ, Anh, Úc, có cả tiếng ồn thật." },
  { id: "stories", href: "/island/stories", place: "Lều kể chuyện", feature: "Chuyện trên đảo", tone: "#8E5BB5", pitch: "Mỗi tuần một tập, câu trả lời của bạn làm truyện đi tiếp." },
  { id: "mirror", href: "/island/mirror", place: "Giếng gương", feature: "Gương thời gian", tone: "#B5893A", pitch: "Ghi âm ngày 1, 30, 90 rồi nghe lại mình đã khác ra sao." },
  { id: "lesson", href: "/island/my-lesson", place: "Lớp học nhỏ", feature: "Bài học của tôi", tone: "#C9506B", pitch: "AI soạn bài từ chính cuộc sống của bạn." },
  { id: "visit", href: "/island/visit", place: "Bến thuyền", feature: "Ghé đảo bạn bè", tone: "#5A6FC9", pitch: "Chèo thuyền sang đảo bạn bè, để lại lời nhắn." },
  { id: "boss", href: "/island/boss", place: "Đấu trường", feature: "Thử thách cuối tuần", tone: "#7A3E2C", pitch: "Chỉ mở Thứ 7 và Chủ nhật: 4 phút, thắng nhận cúp." },
];

/** Vỏ sò thưởng khi dựng xong một công trình. */
export const BUILD_BONUS = 20;

export function isleSpot(id: string): IsleSpot | undefined {
  return ISLE.find((x) => x.id === id);
}

export function builtCount(s: IslandState): number {
  return ISLE.filter((x) => s.built[x.id]).length;
}

export interface PracticePick {
  id: IsleId;
  /** Lý do ngắn, tiếng Việt. */
  why: string;
}

function dayIndex(d: Date): number {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}

/**
 * "Hôm nay nên luyện gì": một gợi ý duy nhất, đổi theo ngày.
 * Thứ tự ưu tiên: thử thách cuối tuần đang mở → tập truyện mới → công trình chưa dựng → món hợp với điểm yếu gần đây.
 */
export function suggestPractice(s: IslandState, week: number, now = new Date()): PracticePick {
  const boss = weeklyBoss(now);
  if (bossOpen(now) && boss.boss && !s.trophies[boss.boss.trophy]) return { id: "boss", why: `Thử thách cuối tuần đang mở: ${boss.title}.` };
  if (EPISODES.some((e) => e.week <= week && !s.episodes[e.id])) return { id: "stories", why: "Có tập truyện mới đang chờ bạn." };
  const order: IsleId[] = ["call", "mission", "shadow", "listen", "mirror", "lesson", "stories", "visit"];
  const fresh = order.find((id) => !s.built[id]);
  if (fresh) return { id: fresh, why: "Bạn chưa thử món này. Thử lần đầu để dựng công trình, nhận thêm vỏ sò." };
  // Đã thử hết: dựa vào phiếu nhận xét gần nhất.
  const last = s.reports.slice(-3);
  const avg = (k: "f" | "a" | "r" | "i") => (last.length ? last.reduce((t, r) => t + r[k], 0) / last.length : 3);
  const missionsLeft = MISSIONS.some((m) => m.ch <= s.unlockedUpTo && !s.missions[m.id]);
  const pool: PracticePick[] = [];
  if (avg("f") < 3) pool.push({ id: "call", why: "Gần đây bạn nói còn ngập ngừng. Gọi điện giúp phản xạ nhanh hơn." }, { id: "shadow", why: "Nói đuổi giúp câu nói trôi và đúng nhịp hơn." });
  if (avg("a") < 3) pool.push({ id: "lesson", why: "Ôn lại lỗi sai gần đây trong một bài học soạn riêng cho bạn." });
  if (avg("i") < 3 && missionsLeft) pool.push({ id: "mission", why: "Tập đặt câu hỏi để lấy đúng thông tin." });
  if (!pool.length) {
    pool.push({ id: "call", why: "Một cuộc gọi ngắn giữ phản xạ nói mỗi ngày." }, { id: "listen", why: "Đổi giọng, đổi tốc độ để tai quen tiếng Anh thật." }, { id: "shadow", why: "Năm phút nói đuổi cho miệng quen nhịp tiếng Anh." });
    if (missionsLeft) pool.push({ id: "mission", why: "Còn nhiệm vụ hỏi thông tin chưa làm." });
  }
  return pool[dayIndex(now) % pool.length];
}
