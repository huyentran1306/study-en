// Kiểm tra nói định kỳ (2 tuần một lần): 3 đề cố định để so được với chính mình theo thời gian.
// AI chấm trên thang tuyệt đối gắn với CEFR (khác phiếu nhận xét chấm theo trình độ chương).
import type { Cefr } from "./feedback";
import type { IslandState } from "./state";

export const CHECK_EVERY_DAYS = 14;
export const CHECK_MAX_SEC = 60;
export const CHECK_PREP_SEC = 15;

export interface CheckTask {
  id: "intro" | "past" | "solve";
  en: string;
  vi: string;
  tips: string[];
}

export const CHECK_TASKS: CheckTask[] = [
  {
    id: "intro",
    en: "Introduce yourself. Tell me your name, where you live, what you do, and what you like doing in your free time.",
    vi: "Giới thiệu bản thân: tên, nơi sống, công việc hoặc việc học, và bạn thích làm gì lúc rảnh.",
    tips: ["My name is…", "I live in…", "I work as… / I'm a student at…", "In my free time, I like… because…"],
  },
  {
    id: "past",
    en: "Tell me about something you did last weekend. What happened, who were you with, and how did you feel?",
    vi: "Kể một việc bạn đã làm cuối tuần trước: chuyện gì xảy ra, đi với ai, bạn thấy thế nào.",
    tips: ["Last weekend, I…", "First…, then…, after that…", "It was… because…"],
  },
  {
    id: "solve",
    en: "You ordered an iced coffee, but the staff gave you a hot tea. Talk to the staff and solve the problem.",
    vi: "Bạn gọi cà phê đá nhưng nhân viên đưa trà nóng. Hãy nói với nhân viên và giải quyết chuyện này.",
    tips: ["Excuse me, I think there's a mistake.", "I ordered…, but this is…", "Could you…, please?"],
  },
];

export type CheckSkill = "f" | "a" | "r" | "c";
export const CHECK_SKILLS: { k: CheckSkill; name: string; desc: string }[] = [
  { k: "f", name: "Trôi chảy", desc: "Nói liền mạch, câu dài" },
  { k: "a", name: "Chính xác", desc: "Ngữ pháp, dùng từ đúng" },
  { k: "r", name: "Vốn từ & cấu trúc", desc: "Từ và kiểu câu đa dạng" },
  { k: "c", name: "Mạch lạc", desc: "Đúng đề, có ý chính, lý do, từ nối" },
];

export interface CheckRecord {
  at: string;
  cefr: Cefr;
  f: number;
  a: number;
  r: number;
  c: number;
  /** Từ/phút trung bình, tổng số từ, số lần "ừm/à". */
  wpm: number;
  words: number;
  fillers: number;
}

export interface CheckAI {
  scores: Record<CheckSkill, number>;
  cefr: Cefr;
  praise: string;
  focus: { title: string; tip: string; example: string };
  upgrade: { from: string; to: string } | null;
  notes: Record<CheckTask["id"], string>;
}

export function lastCheck(s: IslandState): CheckRecord | null {
  return s.checks.length ? s.checks[s.checks.length - 1] : null;
}

/** Ngày (yyyy-mm-dd, giờ máy) tới hạn lần kiểm tra kế tiếp; null = chưa làm lần nào (làm ngay được). */
export function nextCheckDay(s: IslandState): string | null {
  const last = lastCheck(s);
  if (!last) return null;
  const d = new Date(last.at);
  d.setDate(d.getDate() + CHECK_EVERY_DAYS);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Tới hạn kiểm tra: chưa làm lần nào (sau khi đã học được vài ngày) hoặc đã đủ 14 ngày. */
export function checkDue(s: IslandState, today: string): boolean {
  const next = nextCheckDay(s);
  if (next === null) return s.studyDays.length >= 1;
  return today >= next;
}
