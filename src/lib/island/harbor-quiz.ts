// Câu đố của Thuyền trưởng Rái (Đảo Phố Cảng): mỗi ngày 5 câu, lấy từ các chương A2 đã mở.
// Đúng từ 4 câu → 1 mảnh bản đồ kho báu; đủ 7 mảnh mở được rương ở bến phà.
import { CHAPTERS, type Chapter } from "./curriculum";
import type { IslandState } from "./state";

export const QUIZ_LEN = 5;
export const PIECE_SCORE = 4;
export const PIECES_PER_CHEST = 7;
export const CHEST_BONUS = 100;
/** Vỏ sò mỗi câu đúng (tính theo lần làm tốt nhất trong ngày). */
export const SHELL_PER_RIGHT = 3;

export type Question =
  | { kind: "reply"; ch: number; say: string; sayVi: string; options: { en: string; vi: string; ok: boolean; why: string }[] }
  | { kind: "word"; ch: number; clue: string; sentence: string; answer: string; options: string[] }
  | { kind: "order"; ch: number; vi: string; answer: string; tiles: string[] }
  | { kind: "catch"; ch: number; fast: string; fastVi: string; slow: string; options: { en: string; vi: string; ok: boolean; why: string }[] }
  | { kind: "riddle"; q: string; qVi: string; answer: string; answerVi: string; options: { en: string; vi: string }[] };

export const QUIZ_TITLE: Record<Question["kind"], string> = {
  reply: "Nghe rồi đáp",
  word: "Đoán từ còn thiếu",
  order: "Xếp lại câu",
  catch: "Bắt thông tin",
  riddle: "Câu đố vui",
};

/** Câu đố vui tiếng Anh (dân gian) theo chủ đề bến cảng, bưu điện, đi lại. */
const RIDDLES: { q: string; qVi: string; answer: string; answerVi: string; wrong: [string, string][] }[] = [
  { q: "What has hands but can't clap?", qVi: "Cái gì có tay mà không vỗ tay được?", answer: "a clock", answerVi: "cái đồng hồ", wrong: [["a crab", "con cua"], ["a glove", "cái găng tay"]] },
  { q: "What can travel around the world while staying in a corner?", qVi: "Cái gì đi khắp thế giới mà vẫn nằm ở một góc?", answer: "a stamp", answerVi: "con tem", wrong: [["a plane", "máy bay"], ["a map", "tấm bản đồ"]] },
  { q: "What gets wetter the more it dries?", qVi: "Cái gì càng lau khô thì càng ướt?", answer: "a towel", answerVi: "cái khăn tắm", wrong: [["the sea", "biển"], ["an umbrella", "cái ô"]] },
  { q: "What has a neck but no head?", qVi: "Cái gì có cổ mà không có đầu?", answer: "a bottle", answerVi: "cái chai", wrong: [["a giraffe", "hươu cao cổ"], ["a shirt", "cái áo"]] },
  { q: "What has many keys but can't open a door?", qVi: "Cái gì có nhiều phím (chìa) mà không mở được cửa?", answer: "a piano", answerVi: "cây đàn piano", wrong: [["a hotel", "khách sạn"], ["a lock", "ổ khoá"]] },
  { q: "What has one eye but can't see?", qVi: "Cái gì có một mắt (lỗ) mà không nhìn được?", answer: "a needle", answerVi: "cây kim", wrong: [["a pirate", "cướp biển"], ["a camera", "máy ảnh"]] },
  { q: "What goes up but never comes down?", qVi: "Cái gì đi lên mà không bao giờ đi xuống?", answer: "your age", answerVi: "tuổi của bạn", wrong: [["a balloon", "bóng bay"], ["a plane", "máy bay"]] },
  { q: "What has a bed but never sleeps?", qVi: "Cái gì có giường (lòng) mà không bao giờ ngủ?", answer: "a river", answerVi: "dòng sông", wrong: [["a hotel", "khách sạn"], ["a cat", "con mèo"]] },
];

/** Số ngẫu nhiên lặp lại được theo chuỗi (cùng ngày → cùng bộ câu). */
function seeded(seedText: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const pick = <T,>(arr: T[], rnd: () => number): T => arr[Math.floor(rnd() * arr.length)];

/** Tách câu thành ô chữ (giữ dấu câu dính với từ cuối). */
export function tilesOf(sentence: string): string[] {
  return sentence.trim().split(/\s+/);
}

function wordQ(ch: Chapter, rnd: () => number): Question | null {
  const w = shuffle(ch.words, rnd).find((x) => new RegExp(`\\b${x.en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(x.ex));
  if (!w) return null;
  const sentence = w.ex.replace(new RegExp(`\\b${w.en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"), "____");
  const pool = CHAPTERS.filter((c) => c.level === ch.level).flatMap((c) => c.words.map((x) => x.en)).filter((x) => x !== w.en);
  const wrong = shuffle([...new Set(pool)], rnd).slice(0, 3);
  return { kind: "word", ch: ch.id, clue: w.vi, sentence, answer: w.en, options: shuffle([w.en, ...wrong], rnd) };
}

/** Bộ 5 câu của một ngày, từ các chương A2 đã mở. */
export function dailyQuiz(s: IslandState, day: string, isUnlocked: (s: IslandState, id: number) => boolean): Question[] {
  const pool = CHAPTERS.filter((c) => c.level === "A2" && isUnlocked(s, c.id));
  const chs = pool.length ? pool : CHAPTERS.filter((c) => c.level === "A2").slice(0, 1);
  const rnd = seeded(`harbor-${day}`);
  const qs: Question[] = [];
  // 1. Nghe rồi đáp
  {
    const ch = pick(chs, rnd);
    const t = pick(ch.turns, rnd);
    qs.push({ kind: "reply", ch: ch.id, say: t.npcLine, sayVi: t.npcVi, options: shuffle(t.options, rnd) });
  }
  // 2. Đoán từ
  {
    const order = shuffle(chs, rnd);
    for (const ch of order) {
      const q = wordQ(ch, rnd);
      if (q) {
        qs.push(q);
        break;
      }
    }
  }
  // 3. Xếp câu (câu của bạn trong hội thoại hoặc câu xếp sẵn của bài)
  {
    const ch = pick(chs, rnd);
    const cands = [...ch.builder.map((b) => ({ en: b.en, vi: b.vi })), ...ch.dialogue.filter((l) => l.who === "you").map((l) => ({ en: l.en, vi: l.vi }))].filter((x) => {
      const n = tilesOf(x.en).length;
      return n >= 3 && n <= 8;
    });
    const c = pick(cands, rnd);
    qs.push({ kind: "order", ch: ch.id, vi: c.vi, answer: c.en, tiles: shuffle(tilesOf(c.en), rnd) });
  }
  // 4. Bắt thông tin khi người ta nói nhanh
  {
    const ch = pick(chs, rnd);
    qs.push({ kind: "catch", ch: ch.id, fast: ch.rescue.fast, fastVi: ch.rescue.fastVi, slow: ch.rescue.slow, options: shuffle(ch.rescue.options, rnd) });
  }
  // 5. Câu đố vui
  {
    const r = pick(RIDDLES, rnd);
    qs.push({ kind: "riddle", q: r.q, qVi: r.qVi, answer: r.answer, answerVi: r.answerVi, options: shuffle([{ en: r.answer, vi: r.answerVi }, ...r.wrong.map(([en, vi]) => ({ en, vi }))], rnd) });
  }
  return qs;
}

/** So câu xếp: bỏ qua hoa/thường và khoảng trắng thừa. */
export function sameSentence(a: string, b: string): boolean {
  const n = (x: string) => x.toLowerCase().replace(/\s+/g, " ").trim();
  return n(a) === n(b);
}

export function quizPieces(s: IslandState): { have: number; earnedTotal: number } {
  const earnedTotal = Object.values(s.quiz.days).filter((v) => v >= PIECE_SCORE).length;
  return { have: Math.max(0, earnedTotal - s.quiz.chests * PIECES_PER_CHEST), earnedTotal };
}

/** Vỏ sò từ câu đố (cộng vào tổng vỏ sò). */
export function quizShells(s: IslandState): number {
  return Object.values(s.quiz.days).reduce((t, v) => t + v * SHELL_PER_RIGHT, 0) + s.quiz.chests * CHEST_BONUS;
}
