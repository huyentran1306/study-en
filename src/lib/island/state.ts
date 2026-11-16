// Kiểu dữ liệu + chuẩn hoá + gộp tiến độ Chit Chat Island.
// File thuần (không "use client") để dùng chung cho trình duyệt và API máy chủ.
import type { Word } from "./curriculum";

export interface ChapterProgress {
  lesson?: boolean;
  listen?: boolean;
  speak?: boolean;
  chat?: boolean;
  review?: boolean;
  stars?: number;
  rescueOk?: boolean;
  /** Ngày 6: Ao Phản Xạ. */
  reflex?: boolean;
  /** Ngày 7: Phát âm. */
  sound?: boolean;
  doneAt?: string;
}

export interface WordCard extends Word {
  ch: number;
  box: number; // 0..6 (Leitner)
  due: string; // YYYY-MM-DD
  seen: number;
}

/** Câu khung để ôn kiểu "nghe tiếng Việt → nói tiếng Anh". */
export interface PhraseCard {
  en: string;
  vi: string;
  ch: number;
  box: number;
  due: string;
  seen: number;
}

export type ReflexMode = "quick" | "swap" | "filler";

/** Một lượt luyện Ao Phản Xạ (để vẽ biểu đồ tiến bộ). */
export interface ReflexRun {
  at: string; // ISO, dùng làm khoá khi gộp
  ch: number;
  mode: ReflexMode;
  n: number;
  ok: number;
  /** Thời gian phản xạ trung bình (ms), 0 nếu không đo được. */
  avgMs: number;
  /** true = trả lời bằng giọng nói; false = bấm chọn. */
  voice: boolean;
}

export type FarmKind = "shrimp" | "crab" | "lobster";
export const FARM_KINDS: FarmKind[] = ["shrimp", "crab", "lobster"];

/** Một ô trong ao nuôi. done = lúc thu hoạch (ô trống lại). */
export interface FarmSlot {
  kind: FarmKind;
  at: string; // ISO lúc thả giống
  boost: number; // số lần cho ăn (0..3)
  done?: string; // ISO lúc thu hoạch
}

export interface FarmState {
  earned: number; // vỏ sò kiếm từ bán hải sản
  spent: number; // vỏ sò đã tiêu
  foodUsed: number;
  size: number; // số ô ao: 3 / 6 / 9
  slots: Record<string, FarmSlot>;
}

export interface IslandState {
  startDate: string;
  unlockedUpTo: number;
  chapters: Record<string, ChapterProgress>;
  challenges: Record<string, { done: boolean; stars: number }>;
  words: Record<string, WordCard>;
  xp: number;
  studyDays: string[];
  chatTurns: number;
  phrases: Record<string, PhraseCard>;
  reflex: ReflexRun[];
  /** Nhiệm vụ chat đã xong: khoá "chương:thứ tự". */
  chatTasks: Record<string, boolean>;
  /** Điểm cao nhất (%) của từng bộ âm phát âm. */
  sounds: Record<string, number>;
  /** Nhật ký "Hành trình hôm nay": ngày → các bước đã xong (mission, review, reflex, chest). */
  daily: Record<string, string[]>;
  /** Ao nuôi tôm cua. */
  farm: FarmState;
  placement?: { level: string; score: number; at: string };
  /** Thời điểm người dùng bấm "bắt đầu lại kế hoạch" (ISO) — để ngày bắt đầu mới thắng khi gộp. */
  planResetAt?: string;
  /** user_id mà dữ liệu này thuộc về (undefined = khách, chưa đăng nhập). */
  owner?: string;
  /** Lần thay đổi gần nhất (ISO). */
  updatedAt?: string;
}

const MISSION_KEYS = ["lesson", "listen", "speak", "chat", "review", "reflex", "sound", "rescueOk"] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_WORDS = 3000;
const MAX_RUNS = 400;
const REFLEX_MODES: ReflexMode[] = ["quick", "swap", "filler"];

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function freshState(): IslandState {
  return { startDate: todayStr(), unlockedUpTo: 1, chapters: {}, challenges: {}, words: {}, xp: 0, studyDays: [], chatTurns: 0, phrases: {}, reflex: [], chatTasks: {}, sounds: {}, daily: {}, farm: { earned: 0, spent: 0, foodUsed: 0, size: 3, slots: {} } };
}

const num = (v: unknown, min: number, max: number, def = 0) => {
  const n = typeof v === "number" && Number.isFinite(v) ? v : def;
  return Math.min(max, Math.max(min, Math.round(n)));
};
const str = (v: unknown, max = 200) => (typeof v === "string" ? v.slice(0, max) : "");
const date = (v: unknown) => (typeof v === "string" && DATE_RE.test(v) ? v : undefined);

/** Ép dữ liệu bất kỳ (từ localStorage hoặc từ mạng) về đúng cấu trúc, bỏ phần rác. */
export function normalizeState(input: unknown): IslandState {
  const base = freshState();
  if (!input || typeof input !== "object") return base;
  const x = input as Record<string, unknown>;
  const out: IslandState = {
    startDate: date(x.startDate) || base.startDate,
    unlockedUpTo: num(x.unlockedUpTo, 1, 99, 1),
    chapters: {},
    challenges: {},
    words: {},
    xp: num(x.xp, 0, 10_000_000),
    studyDays: Array.isArray(x.studyDays) ? (x.studyDays.map(date).filter(Boolean) as string[]).slice(-400) : [],
    chatTurns: num(x.chatTurns, 0, 1_000_000),
    phrases: {},
    reflex: [],
    chatTasks: {},
    sounds: {},
    daily: {},
    farm: { earned: 0, spent: 0, foodUsed: 0, size: 3, slots: {} },
  };
  if (x.farm && typeof x.farm === "object") {
    const f = x.farm as Record<string, unknown>;
    out.farm = { earned: num(f.earned, 0, 10_000_000), spent: num(f.spent, 0, 10_000_000), foodUsed: num(f.foodUsed, 0, 1_000_000), size: [3, 6, 9].includes(f.size as number) ? (f.size as number) : 3, slots: {} };
    if (f.slots && typeof f.slots === "object") {
      for (const [k, v] of Object.entries(f.slots as Record<string, unknown>)) {
        if (!/^[0-8]$/.test(k) || !v || typeof v !== "object") continue;
        const sl = v as Record<string, unknown>;
        if (!FARM_KINDS.includes(sl.kind as FarmKind) || typeof sl.at !== "string" || Number.isNaN(Date.parse(sl.at))) continue;
        const slot: FarmSlot = { kind: sl.kind as FarmKind, at: sl.at.slice(0, 40), boost: num(sl.boost, 0, 3) };
        if (typeof sl.done === "string" && !Number.isNaN(Date.parse(sl.done))) slot.done = sl.done.slice(0, 40);
        out.farm.slots[k] = slot;
      }
    }
  }
  if (x.daily && typeof x.daily === "object") {
    const keys = Object.keys(x.daily as object).filter((k) => DATE_RE.test(k)).sort().slice(-21);
    for (const k of keys) {
      const v = (x.daily as Record<string, unknown>)[k];
      if (Array.isArray(v)) out.daily[k] = v.filter((t): t is string => typeof t === "string" && /^[a-z]{1,12}$/.test(t)).slice(0, 10);
    }
  }
  if (x.phrases && typeof x.phrases === "object") {
    for (const [k, v] of Object.entries(x.phrases as Record<string, unknown>).slice(0, MAX_WORDS)) {
      if (!v || typeof v !== "object") continue;
      const w = v as Record<string, unknown>;
      const en = str(w.en, 300) || k.slice(0, 300);
      out.phrases[en] = { en, vi: str(w.vi, 300), ch: num(w.ch, 0, 999), box: num(w.box, 0, 6, 1), due: date(w.due) || base.startDate, seen: num(w.seen, 0, 1_000_000) };
    }
  }
  if (Array.isArray(x.reflex)) {
    for (const v of x.reflex.slice(-MAX_RUNS)) {
      if (!v || typeof v !== "object") continue;
      const r = v as Record<string, unknown>;
      if (typeof r.at !== "string" || Number.isNaN(Date.parse(r.at))) continue;
      const mode = REFLEX_MODES.includes(r.mode as ReflexMode) ? (r.mode as ReflexMode) : "quick";
      const n = num(r.n, 0, 100);
      out.reflex.push({ at: r.at.slice(0, 40), ch: num(r.ch, 0, 999), mode, n, ok: Math.min(n, num(r.ok, 0, 100)), avgMs: num(r.avgMs, 0, 60_000), voice: r.voice === true });
    }
  }
  if (x.chatTasks && typeof x.chatTasks === "object") {
    for (const [k, v] of Object.entries(x.chatTasks as Record<string, unknown>)) if (/^\d{1,3}:\d$/.test(k) && v === true) out.chatTasks[k] = true;
  }
  if (x.sounds && typeof x.sounds === "object") {
    for (const [k, v] of Object.entries(x.sounds as Record<string, unknown>)) if (/^[a-z0-9-]{1,20}$/.test(k)) out.sounds[k] = num(v, 0, 100);
  }
  if (x.chapters && typeof x.chapters === "object") {
    for (const [k, v] of Object.entries(x.chapters as Record<string, unknown>)) {
      if (!/^\d{1,3}$/.test(k) || !v || typeof v !== "object") continue;
      const c = v as Record<string, unknown>;
      const cp: ChapterProgress = {};
      for (const m of MISSION_KEYS) if (c[m] === true) cp[m] = true;
      if (c.stars !== undefined) cp.stars = num(c.stars, 0, 3);
      if (date(c.doneAt)) cp.doneAt = c.doneAt as string;
      out.chapters[k] = cp;
    }
  }
  if (x.challenges && typeof x.challenges === "object") {
    for (const [k, v] of Object.entries(x.challenges as Record<string, unknown>)) {
      if (!/^c\d{1,2}$/.test(k) || !v || typeof v !== "object") continue;
      const c = v as Record<string, unknown>;
      out.challenges[k] = { done: c.done === true, stars: num(c.stars, 0, 3) };
    }
  }
  if (x.words && typeof x.words === "object") {
    for (const [k, v] of Object.entries(x.words as Record<string, unknown>).slice(0, MAX_WORDS)) {
      if (!v || typeof v !== "object") continue;
      const w = v as Record<string, unknown>;
      const en = str(w.en) || k.slice(0, 200);
      out.words[en] = { en, vi: str(w.vi), ex: str(w.ex, 400), ch: num(w.ch, 0, 999), box: num(w.box, 0, 6, 1), due: date(w.due) || base.startDate, seen: num(w.seen, 0, 1_000_000) };
    }
  }
  if (x.placement && typeof x.placement === "object") {
    const p = x.placement as Record<string, unknown>;
    const at = date(p.at);
    if (at) out.placement = { level: str(p.level, 4), score: num(p.score, 0, 100), at };
  }
  if (typeof x.planResetAt === "string" && !Number.isNaN(Date.parse(x.planResetAt))) out.planResetAt = x.planResetAt;
  if (typeof x.owner === "string" && x.owner) out.owner = x.owner.slice(0, 128);
  if (typeof x.updatedAt === "string" && !Number.isNaN(Date.parse(x.updatedAt))) out.updatedAt = x.updatedAt;
  return out;
}

/**
 * Gộp hai bản tiến độ (vd. điện thoại + máy tính). Quy tắc: không bao giờ làm mất thành tích —
 * nhiệm vụ đã xong thì giữ, sao/xp/mở khoá lấy lớn nhất, thẻ từ lấy bản được ôn nhiều hơn.
 */
export function mergeStates(a: IslandState, b: IslandState): IslandState {
  const chapters: Record<string, ChapterProgress> = {};
  for (const k of new Set([...Object.keys(a.chapters), ...Object.keys(b.chapters)])) {
    const x = a.chapters[k] || {};
    const y = b.chapters[k] || {};
    const c: ChapterProgress = {};
    for (const m of MISSION_KEYS) if (x[m] || y[m]) c[m] = true;
    const stars = Math.max(x.stars || 0, y.stars || 0);
    if (stars) c.stars = stars;
    const doneAt = [x.doneAt, y.doneAt].filter(Boolean).sort()[0];
    if (doneAt) c.doneAt = doneAt;
    chapters[k] = c;
  }
  const challenges: IslandState["challenges"] = {};
  for (const k of new Set([...Object.keys(a.challenges), ...Object.keys(b.challenges)])) {
    const x = a.challenges[k];
    const y = b.challenges[k];
    challenges[k] = { done: !!(x?.done || y?.done), stars: Math.max(x?.stars || 0, y?.stars || 0) };
  }
  const words: Record<string, WordCard> = {};
  for (const k of new Set([...Object.keys(a.words), ...Object.keys(b.words)])) {
    const x = a.words[k];
    const y = b.words[k];
    if (!x || !y) words[k] = (x || y)!;
    else if (x.seen !== y.seen) words[k] = x.seen > y.seen ? x : y;
    else words[k] = x.due >= y.due ? x : y;
  }
  const phrases: Record<string, PhraseCard> = {};
  for (const k of new Set([...Object.keys(a.phrases), ...Object.keys(b.phrases)])) {
    const x = a.phrases[k];
    const y = b.phrases[k];
    if (!x || !y) phrases[k] = (x || y)!;
    else if (x.seen !== y.seen) phrases[k] = x.seen > y.seen ? x : y;
    else phrases[k] = x.due >= y.due ? x : y;
  }
  const runs = new Map<string, ReflexRun>();
  for (const r of [...a.reflex, ...b.reflex]) runs.set(r.at, r);
  const reflex = Array.from(runs.values()).sort((p, q) => (p.at < q.at ? -1 : 1)).slice(-MAX_RUNS);
  const sounds: Record<string, number> = { ...a.sounds };
  for (const [k, v] of Object.entries(b.sounds)) sounds[k] = Math.max(sounds[k] || 0, v);
  const daily: Record<string, string[]> = {};
  for (const k of Array.from(new Set([...Object.keys(a.daily), ...Object.keys(b.daily)])).sort().slice(-21)) {
    daily[k] = Array.from(new Set([...(a.daily[k] || []), ...(b.daily[k] || [])]));
  }
  const slotVer = (x?: FarmSlot) => (x ? (x.done && x.done > x.at ? x.done : x.at) : "");
  const farmSlots: Record<string, FarmSlot> = {};
  for (const k of new Set([...Object.keys(a.farm.slots), ...Object.keys(b.farm.slots)])) {
    const x = a.farm.slots[k];
    const y = b.farm.slots[k];
    const pick = !x ? y : !y ? x : slotVer(x) > slotVer(y) ? x : slotVer(y) > slotVer(x) ? y : { ...x, boost: Math.max(x.boost, y.boost) };
    if (pick) farmSlots[k] = pick;
  }
  const farm: FarmState = {
    earned: Math.max(a.farm.earned, b.farm.earned),
    spent: Math.max(a.farm.spent, b.farm.spent),
    foodUsed: Math.max(a.farm.foodUsed, b.farm.foodUsed),
    size: Math.max(a.farm.size, b.farm.size),
    slots: farmSlots,
  };
  const placement = [a.placement, b.placement].filter(Boolean).sort((p, q) => (p!.at < q!.at ? 1 : -1))[0];
  const updatedAt = [a.updatedAt, b.updatedAt].filter(Boolean).sort().pop();
  // Ngày bắt đầu: nếu có người bấm "bắt đầu lại" thì bản đặt lại gần nhất thắng, không thì lấy ngày sớm nhất.
  const ra = a.planResetAt || "";
  const rb = b.planResetAt || "";
  const startDate = ra || rb ? (ra >= rb ? a.startDate : b.startDate) : a.startDate < b.startDate ? a.startDate : b.startDate;
  const out: IslandState = {
    startDate,
    unlockedUpTo: Math.max(a.unlockedUpTo, b.unlockedUpTo),
    chapters,
    challenges,
    words,
    xp: Math.max(a.xp, b.xp),
    studyDays: Array.from(new Set([...a.studyDays, ...b.studyDays])).sort().slice(-400),
    chatTurns: Math.max(a.chatTurns, b.chatTurns),
    phrases,
    reflex,
    chatTasks: { ...a.chatTasks, ...b.chatTasks },
    sounds,
    daily,
    farm,
  };
  if (placement) out.placement = placement;
  if (ra || rb) out.planResetAt = ra >= rb ? ra : rb;
  if (a.owner || b.owner) out.owner = a.owner || b.owner;
  if (updatedAt) out.updatedAt = updatedAt;
  return out;
}

/** So sánh nội dung (bỏ qua updatedAt) để biết có cần ghi lại không. */
export function sameContent(a: IslandState, b: IslandState): boolean {
  return stable({ ...a, updatedAt: undefined, owner: undefined }) === stable({ ...b, updatedAt: undefined, owner: undefined });
}

function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.keys(v as object)
      .filter((k) => (v as Record<string, unknown>)[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stable((v as Record<string, unknown>)[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v);
}

export function summary(s: IslandState) {
  return {
    xp: s.xp,
    lessonsDone: Object.values(s.chapters).filter((c) => c.lesson).length,
    wordsCount: Object.keys(s.words).length,
    stars: Object.values(s.chapters).reduce((n, c) => n + (c.stars || 0), 0) + Object.values(s.challenges).reduce((n, c) => n + c.stars, 0),
  };
}
