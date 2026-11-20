// Phiếu nhận xét sau mỗi cuộc trò chuyện + phân loại lỗi + hai chế độ sửa lỗi.
// File thuần (không "use client") — dùng chung cho trang, API và kiểm thử.
import type { PhraseCard } from "./state";

/** Loại lỗi (AI gắn nhãn khi sửa câu). */
export const ERROR_TAGS = ["tense", "article", "preposition", "word_order", "word_choice", "agreement", "plural", "question", "missing_word", "other"] as const;
export type ErrorTag = (typeof ERROR_TAGS)[number];

export const TAG_VI: Record<ErrorTag, string> = {
  tense: "Thì động từ",
  article: "Mạo từ a / an / the",
  preposition: "Giới từ",
  word_order: "Trật tự từ",
  word_choice: "Chọn từ",
  agreement: "Chủ ngữ – động từ",
  plural: "Số ít / số nhiều",
  question: "Cách đặt câu hỏi",
  missing_word: "Thiếu từ",
  other: "Khác",
};

export function asTag(v: unknown): ErrorTag | undefined {
  return ERROR_TAGS.includes(v as ErrorTag) ? (v as ErrorTag) : undefined;
}

const englishTokens = (text: string) => text.toLowerCase().match(/[a-z0-9]+/g)?.join(" ") ?? "";

/** Bỏ đề xuất chỉ lặp một câu đúng trong lượt có nhiều câu, hoặc chỉ sửa dấu câu. */
export function isMeaningfulCorrection(said: string, fixed: string, note = ""): boolean {
  const source = englishTokens(said);
  const target = englishTokens(fixed);
  if (!source || !target || source === target) return false;
  const explanation = note.trim().replace(/[.!…]+$/, "").trim();
  if (/^(?:(?:câu (?:này )?)?(?:đã đúng|đúng rồi|đúng ngữ pháp|đã tự nhiên|tự nhiên rồi)|already (?:correct|natural)|no (?:correction|change) needed)$/iu.test(explanation)) return false;
  return !said.split(/[.!?]+(?:\s+|$)/).some((sentence) => englishTokens(sentence) === target);
}

/** "flow" = Nói thoải mái (cư dân nhắc lại câu đúng trong lời đáp, lỗi gom cuối buổi) · "fix" = Sửa ngay dưới từng câu. */
export type FixMode = "flow" | "fix";
export const FIX_MODE_KEY = "cci-fix-mode";

/** Chưa chọn thì: A1–A2 nói thoải mái cho bạo dạn, B1 sửa ngay cho chính xác. */
export function defaultFixMode(level: string): FixMode {
  return level === "B1" || level === "B2" ? "fix" : "flow";
}

/** 4 tiêu chí nói theo khung CEFR. */
export const SKILLS = [
  { key: "fluency", vi: "Trôi chảy", hint: "Nói thành câu dài, ít ngắt quãng" },
  { key: "accuracy", vi: "Chính xác", hint: "Ngữ pháp đúng" },
  { key: "range", vi: "Vốn từ", hint: "Từ và cấu trúc đa dạng" },
  { key: "interaction", vi: "Tương tác", hint: "Đáp đúng ý, hỏi lại, giữ mạch chuyện" },
] as const;
export type SkillKey = (typeof SKILLS)[number]["key"];
export const CEFR = ["A1", "A2", "B1", "B2"] as const;
export type Cefr = (typeof CEFR)[number];

/** Phần AI chấm (trả về từ /api/island-report). */
export interface ReportAI {
  scores: Record<SkillKey, number>; // 1..5
  cefr: Cefr;
  praise: { quote: string; vi: string };
  focus: { title: string; tip: string; example: string };
  upgrade: { from: string; to: string } | null;
}

/** Số liệu đếm được, không cần AI. */
export interface ChatMetrics {
  turns: number;
  avgWords: number;
  longest: number;
  natural: number; // số câu không bị sửa
  checked: number; // số câu đã được AI xem
}

/** Bản lưu gọn trong tiến độ (để vẽ đường tiến bộ). */
export interface ChatReport {
  at: string;
  ch: number;
  npc: string;
  mode: FixMode;
  f: number;
  a: number;
  r: number;
  i: number;
  cefr: Cefr;
  turns: number;
  words: number; // trung bình từ / lượt, nhân 10 để giữ số nguyên
}

const wordCount = (s: string) => s.trim().split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length;

export function chatMetrics(lines: { content: string; checked?: boolean; corrected?: boolean }[]): ChatMetrics {
  const counts = lines.map((l) => wordCount(l.content));
  const turns = lines.length;
  const checked = lines.filter((l) => l.checked).length;
  return {
    turns,
    avgWords: turns ? Math.round((counts.reduce((a, b) => a + b, 0) / turns) * 10) / 10 : 0,
    longest: counts.length ? Math.max(...counts) : 0,
    natural: lines.filter((l) => l.checked && !l.corrected).length,
    checked,
  };
}

/** Loại lỗi hay gặp nhất (trên toàn bộ Sổ lỗi sai). */
export function topTags(fixes: PhraseCard[], n = 3): { tag: ErrorTag; count: number }[] {
  const by = new Map<ErrorTag, number>();
  for (const f of fixes) {
    const t = asTag(f.tag);
    if (t && t !== "other") by.set(t, (by.get(t) || 0) + 1);
  }
  return Array.from(by.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

/** So với trung bình 3 phiếu gần nhất trước đó: +1 tăng, -1 giảm, 0 như cũ / chưa đủ dữ liệu. */
export function trend(history: ChatReport[], cur: Record<SkillKey, number>): Record<SkillKey, number> {
  const prev = history.slice(-3);
  const out = { fluency: 0, accuracy: 0, range: 0, interaction: 0 } as Record<SkillKey, number>;
  if (!prev.length) return out;
  const avg = (k: "f" | "a" | "r" | "i") => prev.reduce((s, r) => s + r[k], 0) / prev.length;
  const map: [SkillKey, "f" | "a" | "r" | "i"][] = [
    ["fluency", "f"],
    ["accuracy", "a"],
    ["range", "r"],
    ["interaction", "i"],
  ];
  for (const [k, short] of map) {
    const d = cur[k] - avg(short);
    out[k] = d >= 0.5 ? 1 : d <= -0.5 ? -1 : 0;
  }
  return out;
}

// ───────────── Nói dài hơn & cứu nguy ─────────────

const LINKERS = /\b(because|so|but|and then|then|when|if|although|also|for example|actually)\b/gi;

/** Số "ý" trong một lượt nói: số câu + số từ nối (because, so, but...). 3 ý = trả lời đủ "ý chính + lý do + chi tiết". */
export function ideaCount(text: string): number {
  const sentences = text.split(/[.!?]+/).map((x) => x.trim()).filter((x) => x.split(/\s+/).length >= 2).length;
  const links = (text.match(LINKERS) || []).length;
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < 6) return Math.min(1, sentences);
  return Math.max(1, sentences + links);
}

/** Câu người học dùng để "cứu nguy" khi không hiểu: xin nhắc lại, hỏi nghĩa, xin nói chậm. */
const REPAIR_RE = /\b(could|can|would) you (please )?(say|repeat|explain|speak|talk)|say (that|it) again|what does .{1,30} mean|what do you mean|what is ['"“]?\w+['"”]?\?|(more )?slowly|pardon|i don'?t (understand|get it)|sorry\?|what was that|one more time/i;

export function isRepair(text: string): boolean {
  return REPAIR_RE.test(text);
}
