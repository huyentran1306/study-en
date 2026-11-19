// Kiểu dữ liệu + chuẩn hoá + gộp tiến độ Chit Chat Island.
// File thuần (không "use client") để dùng chung cho trình duyệt và API máy chủ.
import type { Word } from "./curriculum";
import { CEFR, asTag, type ChatReport, type Cefr, type ErrorTag } from "./feedback";

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
  /** "fix" = câu AI đã sửa cho bạn (Sổ lỗi sai) · "me" = câu nói về chính bạn (từ Hồ sơ) · "life" = từ Bài học của tôi. */
  kind?: "fix" | "me" | "life";
  /** Với thẻ "fix": câu bạn đã nói sai. */
  said?: string;
  /** Với thẻ "fix": loại lỗi (thì, mạo từ...). */
  tag?: ErrorTag;
}

/** Hồ sơ của người học: dùng để thay tên/quê/nghề/sở thích mẫu bằng thông tin thật. Tất cả là tiếng Anh, trừ *Vi. */
export interface Profile {
  name: string;
  hometown: string;
  /** Nghề, không kèm mạo từ: "software tester". */
  job: string;
  jobVi: string;
  /** Sở thích dạng V-ing: "playing badminton". */
  hobby: string;
  hobbyVi: string;
  at: string;
}

/** Chế độ nước rút 30 ngày. */
export interface Sprint {
  on: boolean;
  start: string; // YYYY-MM-DD
  at: string; // ISO lần bật/tắt gần nhất
  doneAt?: string; // ngày hoàn thành ngày 30
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
  rare?: boolean; // con hiếm (tôm vàng, cua xanh, tôm hùm tím) — bán giá gấp đôi
  tipped?: boolean; // đã bán cho khách ở chợ (nhận tiền thưởng một lần)
}

export interface FarmState {
  earned: number; // vỏ sò kiếm từ bán hải sản
  spent: number; // vỏ sò đã tiêu
  foodUsed: number;
  size: number; // số ô ao: 3 / 6 / 9
  slots: Record<string, FarmSlot>;
  caught: Record<string, number>; // số con đã vớt theo loại: "shrimp", "shrimp-rare"...
  dexClaimed: number; // số mốc thưởng Sổ sưu tập đã nhận
}

/** "Cư dân nhớ bạn": một chuyện người học kể khi tám chuyện, để lần sau cư dân hỏi lại. */
export interface Memory {
  /** Khoá gộp: ISO lúc lưu + "#" + thứ tự. */
  id: string;
  /** Cư dân đã nghe chuyện này. */
  npc: string;
  /** Chương của cuộc trò chuyện (để mở lại đúng cư dân). */
  ch: number;
  /** Tiếng Anh, ngôi thứ hai, dùng được sau "Last time you told me ...": "you were planning a trip to Da Lat". */
  fact: string;
  /** Tiếng Việt: "bạn định đi Đà Lạt cuối tuần". */
  vi: string;
  /** Câu hỏi lại lần sau: "Did you go? How was it?" */
  ask: string;
  at: string;
  /** Lúc cư dân đã hỏi lại (mỗi chuyện chỉ hỏi một lần). */
  used?: string;
  /** Người học đã xoá: giữ khoá, xoá nội dung, để bản ở máy khác không làm nó sống lại. */
  gone?: boolean;
}

/** Một lần ghi âm "Gương thời gian" (âm thanh để trong máy, chỉ số liệu + lời được đồng bộ). */
/** Ô đất trên Đảo Cát Vui. bank/food: vỏ sò, thức ăn đã làm ra ở các bậc trước (tính tới lần nâng cấp gần nhất). */
export interface PlotState {
  t?: string;
  lv: number;
  at: string;
  bank: number;
  food?: number;
  cleared?: boolean;
}

/** Mini game: tổng vỏ sò đã nhận, số nhận trong ngày (để có trần), kỷ lục từng trò. */
export interface ArcadeState {
  earned: number;
  day: string;
  today: number;
  best: Record<string, number>;
}

export interface MirrorTake {
  at: string;
  text: string;
  words: number;
  wpm: number;
  pauses: number;
  fillers: number;
  sentenceLen: number;
  tenses: string[];
  secs: number;
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
  /** Vườn Nhiệm Vụ: chương → lúc thu hoạch luống (ISO). */
  garden: Record<string, string>;
  placement?: { level: string; score: number; at: string };
  profile?: Profile;
  /** Những chuyện cư dân nhớ về bạn. */
  memories: Memory[];
  /** Phiếu nhận xét sau các cuộc trò chuyện (gọn, để xem tiến bộ). */
  reports: ChatReport[];
  /** Nhiệm vụ hỏi thông tin + thử thách cuối tuần đã qua: id → sao, lúc. */
  missions: Record<string, { stars: number; at: string }>;
  /** Cúp từ thử thách cuối tuần: id → lúc nhận. */
  trophies: Record<string, string>;
  /** Thẻ giữ chuỗi: đã mua (bought), các ngày đã dùng thẻ để giữ chuỗi (used). Còn lại = bought - used.length. */
  freeze: { bought: number; used: string[] };
  /** Thử ngoài đời: id → lúc làm + câu đã nói. */
  reallife: Record<string, { at: string; note: string }>;
  /** Truyện cư dân nhiều tuần: tập → lúc xem + câu trả lời của bạn. */
  episodes: Record<string, { at: string; answer: string }>;
  /** Gương thời gian. */
  mirror: MirrorTake[];
  /** Đảo Luyện: công trình đã dựng (lần đầu thử tính năng) → lúc dựng. */
  built: Record<string, string>;
  /** Đảo Cát Vui: ô đất → công trình. */
  plots: Record<string, PlotState>;
  arcade: ArcadeState;
  /** Mã chia sẻ đảo cho bạn bè ghé thăm (rỗng = chưa chia sẻ). */
  shareCode?: string;
  sprint?: Sprint;
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
export const MAX_MEMORIES = 80;
export const MAX_REPORTS = 60;
export const MAX_MIRROR = 24;

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function freshState(): IslandState {
  return { startDate: todayStr(), unlockedUpTo: 1, chapters: {}, challenges: {}, words: {}, xp: 0, studyDays: [], chatTurns: 0, phrases: {}, reflex: [], chatTasks: {}, sounds: {}, daily: {}, farm: { earned: 0, spent: 0, foodUsed: 0, size: 3, slots: {}, caught: {}, dexClaimed: 0 }, garden: {}, memories: [], reports: [], missions: {}, trophies: {}, freeze: { bought: 0, used: [] }, reallife: {}, episodes: {}, mirror: [], built: {}, plots: {}, arcade: { earned: 0, day: "", today: 0, best: {} } };
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
    farm: { earned: 0, spent: 0, foodUsed: 0, size: 3, slots: {}, caught: {}, dexClaimed: 0 },
    garden: {},
    memories: [],
    reports: [],
    missions: {},
    trophies: {},
    freeze: { bought: 0, used: [] },
    reallife: {},
    episodes: {},
    mirror: [],
    built: {},
    plots: {},
    arcade: { earned: 0, day: "", today: 0, best: {} },
  };
  {
    const iso = (v: unknown) => typeof v === "string" && !Number.isNaN(Date.parse(v));
    const key = (k: string) => /^[a-z0-9-]{1,40}$/.test(k);
    const plain = (v: unknown, max: number) => str(v, max).replace(/[\u0000-\u001f<>{}]/g, "").trim();
    if (x.missions && typeof x.missions === "object") {
      for (const [k, v] of Object.entries(x.missions as Record<string, unknown>)) {
        const m = v as Record<string, unknown>;
        if (key(k) && m && iso(m.at)) out.missions[k] = { stars: num(m.stars, 0, 3), at: (m.at as string).slice(0, 40) };
      }
    }
    if (x.trophies && typeof x.trophies === "object") {
      for (const [k, v] of Object.entries(x.trophies as Record<string, unknown>)) if (key(k) && iso(v)) out.trophies[k] = (v as string).slice(0, 40);
    }
    if (x.freeze && typeof x.freeze === "object") {
      const f = x.freeze as Record<string, unknown>;
      out.freeze = { bought: num(f.bought, 0, 999), used: Array.isArray(f.used) ? (f.used.map(date).filter(Boolean) as string[]).slice(-60) : [] };
    }
    if (x.reallife && typeof x.reallife === "object") {
      for (const [k, v] of Object.entries(x.reallife as Record<string, unknown>)) {
        const m = v as Record<string, unknown>;
        if (key(k) && m && iso(m.at)) out.reallife[k] = { at: (m.at as string).slice(0, 40), note: plain(m.note, 300) };
      }
    }
    if (x.built && typeof x.built === "object") {
      for (const [k, v] of Object.entries(x.built as Record<string, unknown>)) if (key(k) && iso(v)) out.built[k] = (v as string).slice(0, 40);
    }
    if (x.plots && typeof x.plots === "object") {
      for (const [k, v] of Object.entries(x.plots as Record<string, unknown>)) {
        const m = v as Record<string, unknown>;
        if (!/^p[1-9]$/.test(k) || !m || typeof m !== "object") continue;
        const t = typeof m.t === "string" && /^[a-z]{2,20}$/.test(m.t) ? m.t : undefined;
        if (t && !iso(m.at)) continue;
        out.plots[k] = { lv: num(m.lv, 0, 3), at: iso(m.at) ? (m.at as string).slice(0, 40) : "", bank: num(m.bank, 0, 1_000_000), ...(t ? { t } : {}), ...(m.food ? { food: num(m.food, 0, 1_000_000) } : {}), ...(m.cleared ? { cleared: true } : {}) };
        if (t && out.plots[k].lv < 1) out.plots[k].lv = 1;
      }
    }
    if (x.arcade && typeof x.arcade === "object") {
      const a = x.arcade as Record<string, unknown>;
      out.arcade = { earned: num(a.earned, 0, 10_000_000), day: date(a.day) || "", today: num(a.today, 0, 10_000), best: {} };
      if (a.best && typeof a.best === "object") for (const [k, v] of Object.entries(a.best as Record<string, unknown>)) if (key(k)) out.arcade.best[k] = num(v, 0, 100_000_000);
    }
    if (x.episodes && typeof x.episodes === "object") {
      for (const [k, v] of Object.entries(x.episodes as Record<string, unknown>)) {
        const m = v as Record<string, unknown>;
        if (key(k) && m && iso(m.at)) out.episodes[k] = { at: (m.at as string).slice(0, 40), answer: plain(m.answer, 300) };
      }
    }
    if (Array.isArray(x.mirror)) {
      for (const v of x.mirror.slice(-MAX_MIRROR)) {
        const m = v as Record<string, unknown>;
        if (!m || !iso(m.at)) continue;
        out.mirror.push({
          at: (m.at as string).slice(0, 40),
          text: plain(m.text, 1200),
          words: num(m.words, 0, 5000),
          wpm: num(m.wpm, 0, 400),
          pauses: num(m.pauses, 0, 500),
          fillers: num(m.fillers, 0, 500),
          sentenceLen: Math.max(0, Math.min(200, Number(m.sentenceLen) || 0)),
          tenses: Array.isArray(m.tenses) ? m.tenses.filter((t): t is string => typeof t === "string").map((t) => t.slice(0, 40)).slice(0, 8) : [],
          secs: num(m.secs, 0, 600),
        });
      }
    }
    if (typeof x.shareCode === "string" && /^[A-Z0-9]{6,10}$/.test(x.shareCode)) out.shareCode = x.shareCode;
    // Đảo Luyện ra đời sau: ai đã chơi các tính năng này từ trước thì coi như đã dựng công trình.
    const first = (list: string[]) => list.filter(iso).sort()[0];
    const backfill: Record<string, string | undefined> = {
      mission: first(Object.entries(out.missions).filter(([k]) => k.startsWith("m-")).map(([, v]) => v.at)),
      boss: first([...Object.entries(out.missions).filter(([k]) => k.startsWith("b-")).map(([, v]) => v.at), ...Object.values(out.trophies)]),
      stories: first(Object.values(out.episodes).map((e) => e.at)),
      mirror: first(out.mirror.map((m) => m.at)),
      visit: out.shareCode ? (iso(x.updatedAt) ? (x.updatedAt as string).slice(0, 40) : `${out.startDate}T00:00:00.000Z`) : undefined,
    };
    for (const [k, v] of Object.entries(backfill)) if (v && !out.built[k]) out.built[k] = v;
  }
  if (Array.isArray(x.reports)) {
    for (const v of x.reports.slice(-MAX_REPORTS)) {
      if (!v || typeof v !== "object") continue;
      const r = v as Record<string, unknown>;
      if (typeof r.at !== "string" || Number.isNaN(Date.parse(r.at))) continue;
      out.reports.push({
        at: r.at.slice(0, 40),
        ch: num(r.ch, 0, 999),
        npc: str(r.npc, 12).toLowerCase().replace(/[^a-z]/g, ""),
        mode: r.mode === "fix" ? "fix" : "flow",
        f: num(r.f, 1, 5, 3),
        a: num(r.a, 1, 5, 3),
        r: num(r.r, 1, 5, 3),
        i: num(r.i, 1, 5, 3),
        cefr: CEFR.includes(r.cefr as Cefr) ? (r.cefr as Cefr) : "A1",
        turns: num(r.turns, 0, 999),
        words: num(r.words, 0, 9999),
      });
    }
  }
  if (Array.isArray(x.memories)) {
    const iso = (v: unknown) => typeof v === "string" && !Number.isNaN(Date.parse(v));
    const txt = (v: unknown, max: number) => str(v, max).replace(/["\\\u0000-\u001f<>{}]/g, "").trim();
    for (const v of x.memories.slice(-MAX_MEMORIES)) {
      if (!v || typeof v !== "object") continue;
      const m = v as Record<string, unknown>;
      if (typeof m.id !== "string" || !m.id || !iso(m.at)) continue;
      const mem: Memory = { id: m.id.slice(0, 60), npc: txt(m.npc, 12), ch: num(m.ch, 0, 999), fact: "", vi: "", ask: "", at: (m.at as string).slice(0, 40) };
      if (m.gone === true) mem.gone = true;
      else {
        mem.fact = txt(m.fact, 160);
        mem.vi = txt(m.vi, 160);
        mem.ask = txt(m.ask, 160);
        if (!mem.fact || !mem.ask) continue;
        if (iso(m.used)) mem.used = (m.used as string).slice(0, 40);
      }
      out.memories.push(mem);
    }
  }
  if (x.garden && typeof x.garden === "object") {
    for (const [k, v] of Object.entries(x.garden as Record<string, unknown>)) {
      if (/^\d{1,3}$/.test(k) && typeof v === "string" && !Number.isNaN(Date.parse(v))) out.garden[k] = v.slice(0, 40);
    }
  }
  if (x.farm && typeof x.farm === "object") {
    const f = x.farm as Record<string, unknown>;
    out.farm = { earned: num(f.earned, 0, 10_000_000), spent: num(f.spent, 0, 10_000_000), foodUsed: num(f.foodUsed, 0, 1_000_000), size: [3, 6, 9].includes(f.size as number) ? (f.size as number) : 3, slots: {}, caught: {}, dexClaimed: num(f.dexClaimed, 0, 50) };
    if (f.caught && typeof f.caught === "object") {
      for (const [k, v] of Object.entries(f.caught as Record<string, unknown>)) if (/^(shrimp|crab|lobster)(-rare)?$/.test(k)) out.farm.caught[k] = num(v, 0, 100_000);
    }
    if (f.slots && typeof f.slots === "object") {
      for (const [k, v] of Object.entries(f.slots as Record<string, unknown>)) {
        if (!/^[0-8]$/.test(k) || !v || typeof v !== "object") continue;
        const sl = v as Record<string, unknown>;
        if (!FARM_KINDS.includes(sl.kind as FarmKind) || typeof sl.at !== "string" || Number.isNaN(Date.parse(sl.at))) continue;
        const slot: FarmSlot = { kind: sl.kind as FarmKind, at: sl.at.slice(0, 40), boost: num(sl.boost, 0, 3) };
        if (typeof sl.done === "string" && !Number.isNaN(Date.parse(sl.done))) slot.done = sl.done.slice(0, 40);
        if (sl.rare === true) slot.rare = true;
        if (sl.tipped === true) slot.tipped = true;
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
      if (w.kind === "fix" || w.kind === "me" || w.kind === "life") out.phrases[en].kind = w.kind;
      if (w.kind === "fix" && str(w.said, 300)) out.phrases[en].said = str(w.said, 300);
      if (w.kind === "fix" && asTag(w.tag)) out.phrases[en].tag = asTag(w.tag);
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
  if (x.profile && typeof x.profile === "object") {
    const p = x.profile as Record<string, unknown>;
    const clean = (v: unknown) => str(v, 60).replace(/["\\\u0000-\u001f<>{}]/g, "").trim();
    const prof: Profile = { name: clean(p.name), hometown: clean(p.hometown), job: clean(p.job), jobVi: clean(p.jobVi), hobby: clean(p.hobby), hobbyVi: clean(p.hobbyVi), at: typeof p.at === "string" && !Number.isNaN(Date.parse(p.at)) ? p.at.slice(0, 40) : "" };
    if (prof.at && (prof.name || prof.hometown || prof.job || prof.hobby)) out.profile = prof;
  }
  if (x.sprint && typeof x.sprint === "object") {
    const p = x.sprint as Record<string, unknown>;
    const start = date(p.start);
    if (start && typeof p.at === "string" && !Number.isNaN(Date.parse(p.at))) {
      out.sprint = { on: p.on === true, start, at: p.at.slice(0, 40) };
      if (date(p.doneAt)) out.sprint.doneAt = p.doneAt as string;
    }
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
    let pick = !x ? y : !y ? x : slotVer(x) > slotVer(y) ? x : slotVer(y) > slotVer(x) ? y : { ...x, boost: Math.max(x.boost, y.boost) };
    // Cùng một mẻ (cùng lúc thả): đã bán cho khách ở máy nào thì coi như đã bán.
    if (pick && x && y && x.at === y.at && (x.tipped || y.tipped)) pick = { ...pick, tipped: true };
    if (pick) farmSlots[k] = pick;
  }
  const farm: FarmState = {
    earned: Math.max(a.farm.earned, b.farm.earned),
    spent: Math.max(a.farm.spent, b.farm.spent),
    foodUsed: Math.max(a.farm.foodUsed, b.farm.foodUsed),
    size: Math.max(a.farm.size, b.farm.size),
    slots: farmSlots,
    caught: Object.fromEntries([...new Set([...Object.keys(a.farm.caught), ...Object.keys(b.farm.caught)])].map((k) => [k, Math.max(a.farm.caught[k] || 0, b.farm.caught[k] || 0)])),
    dexClaimed: Math.max(a.farm.dexClaimed, b.farm.dexClaimed),
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
    garden: (() => {
      const g: Record<string, string> = { ...b.garden };
      for (const [k, v] of Object.entries(a.garden)) if (!g[k] || v < g[k]) g[k] = v;
      return g;
    })(),
    memories: mergeMemories(a.memories, b.memories),
    missions: (() => {
      const o: IslandState["missions"] = { ...a.missions };
      for (const [k, v] of Object.entries(b.missions)) {
        const x = o[k];
        o[k] = !x ? v : { stars: Math.max(x.stars, v.stars), at: x.at < v.at ? x.at : v.at };
      }
      return o;
    })(),
    trophies: (() => {
      const o = { ...a.trophies };
      for (const [k, v] of Object.entries(b.trophies)) if (!o[k] || v < o[k]) o[k] = v;
      return o;
    })(),
    freeze: { bought: Math.max(a.freeze.bought, b.freeze.bought), used: Array.from(new Set([...a.freeze.used, ...b.freeze.used])).sort().slice(-60) },
    reallife: { ...b.reallife, ...a.reallife },
    episodes: { ...b.episodes, ...a.episodes },
    plots: (() => {
      const o: Record<string, PlotState> = { ...a.plots };
      const rank = (p: PlotState) => (p.t ? 1000 : 0) + p.lv * 100 + (p.cleared ? 1 : 0);
      for (const [k, v] of Object.entries(b.plots)) {
        const x = o[k];
        if (!x || rank(v) > rank(x) || (rank(v) === rank(x) && v.bank > x.bank)) o[k] = v;
      }
      return o;
    })(),
    arcade: (() => {
      const best = { ...a.arcade.best };
      for (const [k, v] of Object.entries(b.arcade.best)) best[k] = Math.max(best[k] || 0, v);
      const day = a.arcade.day > b.arcade.day ? a.arcade.day : b.arcade.day;
      const today = Math.max(a.arcade.day === day ? a.arcade.today : 0, b.arcade.day === day ? b.arcade.today : 0);
      return { earned: Math.max(a.arcade.earned, b.arcade.earned), day, today, best };
    })(),
    built: (() => {
      const o = { ...a.built };
      for (const [k, v] of Object.entries(b.built)) if (!o[k] || v < o[k]) o[k] = v;
      return o;
    })(),
    mirror: (() => {
      const by = new Map<string, MirrorTake>();
      for (const t of [...a.mirror, ...b.mirror]) by.set(t.at, t);
      return Array.from(by.values())
        .sort((p, q) => (p.at < q.at ? -1 : 1))
        .slice(-MAX_MIRROR);
    })(),
    reports: (() => {
      const by = new Map<string, ChatReport>();
      for (const r of [...a.reports, ...b.reports]) by.set(r.at, r);
      return Array.from(by.values())
        .sort((p, q) => (p.at < q.at ? -1 : 1))
        .slice(-MAX_REPORTS);
    })(),
  };
  if (placement) out.placement = placement;
  const profile = [a.profile, b.profile].filter(Boolean).sort((p, q) => (p!.at < q!.at ? 1 : -1))[0];
  if (profile) out.profile = profile;
  const sprint = [a.sprint, b.sprint].filter(Boolean).sort((p, q) => (p!.at < q!.at ? 1 : -1))[0];
  if (sprint) {
    const doneAt = [a.sprint?.doneAt, b.sprint?.doneAt].filter(Boolean).sort()[0];
    out.sprint = doneAt && sprint.start <= doneAt ? { ...sprint, doneAt } : sprint;
  }
  if (ra || rb) out.planResetAt = ra >= rb ? ra : rb;
  if (a.shareCode || b.shareCode) out.shareCode = a.shareCode || b.shareCode;
  if (a.owner || b.owner) out.owner = a.owner || b.owner;
  if (updatedAt) out.updatedAt = updatedAt;
  return out;
}

function mergeMemories(a: Memory[], b: Memory[]): Memory[] {
  const by = new Map<string, Memory>();
  for (const m of [...a, ...b]) {
    const o = by.get(m.id);
    if (!o) by.set(m.id, m);
    else if (o.gone || m.gone) by.set(m.id, o.gone ? o : m);
    else {
      const used = [o.used, m.used].filter(Boolean).sort()[0];
      by.set(m.id, used ? { ...o, used } : o);
    }
  }
  return Array.from(by.values())
    .sort((p, q) => (p.at < q.at ? -1 : p.at > q.at ? 1 : p.id < q.id ? -1 : 1))
    .slice(-MAX_MEMORIES);
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
