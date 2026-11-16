"use client";

// Tiến độ Chit Chat Island: lưu ngay trong trình duyệt (localStorage) để dùng offline,
// và đồng bộ lên máy chủ (D1, /api/island/progress) khi người dùng đã đăng nhập.
import { useSyncExternalStore } from "react";
import { CHAPTERS, CHALLENGES, TOTAL_WEEKS, MISSIONS, type Chapter, type MissionKey, type NpcId, type Word } from "./curriculum";
import { FRIEND_LEVELS, PHRASE_EXTRAS, SOUND_SETS } from "./drills";
import { EXPAND_COST, FEED_CUT, MAX_FEED, SPECIES_BY_KIND, STARTER_SHELLS } from "./farm-data";
import { freshState, mergeStates, normalizeState, sameContent, todayStr, type ChapterProgress, type IslandState, type FarmKind, type FarmSlot, type PhraseCard, type ReflexRun, type WordCard } from "./state";

export type { ChapterProgress, IslandState, PhraseCard, ReflexMode, ReflexRun, WordCard } from "./state";

const KEY = "cci-progress-v1";
const UID_KEY = "studyen-uid";

/** Khoảng cách ôn (ngày) theo hộp Leitner. */
const INTERVALS = [0, 1, 2, 4, 7, 15, 30];

export const today = todayStr;

function addDays(date: string, n: number): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + n);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) / 86400000);
}

const fresh = freshState;

let cache: IslandState | null = null;
const listeners = new Set<() => void>();

function load(): IslandState {
  if (cache) return cache;
  if (typeof window === "undefined") return fresh();
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? normalizeState(JSON.parse(raw)) : fresh();
  } catch {
    cache = fresh();
  }
  return cache!;
}

/** Ghi vào trình duyệt; push=true thì hẹn đẩy lên máy chủ. */
function persist(next: IslandState, push: boolean) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* hết dung lượng hoặc chế độ riêng tư — bỏ qua */
  }
  listeners.forEach((l) => l());
  if (push) schedulePush();
}

function save(next: IslandState) {
  persist({ ...next, updatedAt: new Date().toISOString() }, true);
}

function update(fn: (s: IslandState) => IslandState) {
  save(fn(load()));
}

function markStudy(s: IslandState): IslandState {
  const t = today();
  return s.studyDays.includes(t) ? s : { ...s, studyDays: [...s.studyDays, t].slice(-400) };
}

export type DailyStep = "mission" | "review" | "reflex";

function markDaily(s: IslandState, step: DailyStep | "chest"): IslandState {
  const t = today();
  const cur = s.daily[t] || [];
  if (cur.includes(step)) return s;
  const daily = { ...s.daily, [t]: [...cur, step] };
  const keys = Object.keys(daily).sort();
  for (const k of keys.slice(0, Math.max(0, keys.length - 21))) delete daily[k];
  return { ...s, daily };
}

// ───────────── Đồng bộ máy chủ ─────────────

export type SyncStatus = "idle" | "guest" | "syncing" | "synced" | "offline" | "error";
let syncState: { status: SyncStatus; at?: string } = { status: "idle" };
const syncListeners = new Set<() => void>();

function setSync(status: SyncStatus, at?: string) {
  syncState = { status, at: at ?? syncState.at };
  syncListeners.forEach((l) => l());
}

function currentUid(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(UID_KEY);
  } catch {
    return null;
  }
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let inflight = false;
let dirty = false;
let pulling = false;
let lastSyncAt = 0;
let lastUid: string | null = null;

function schedulePush() {
  if (!currentUid()) return;
  dirty = true;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => pushNow(), 1500);
}

async function pushNow(keepalive = false): Promise<void> {
  const uid = currentUid();
  if (!uid) return setSync("guest");
  if (inflight) {
    dirty = true;
    return;
  }
  inflight = true;
  dirty = false;
  setSync("syncing");
  let ok = false;
  try {
    const res = await fetch("/api/island/progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, data: { ...load(), owner: uid } }),
      keepalive,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = (await res.json()) as { data: unknown };
    const server = normalizeState(j.data);
    // Gộp thêm những thay đổi phát sinh trong lúc đang gửi.
    const latest = load();
    const merged = mergeStates(latest, server);
    merged.owner = uid;
    if (!sameContent(merged, latest) || latest.owner !== uid) persist(merged, false);
    lastSyncAt = Date.now();
    ok = true;
    setSync("synced", new Date().toISOString());
  } catch {
    dirty = true;
    setSync(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error");
  } finally {
    inflight = false;
    if (ok && dirty) schedulePush();
  }
}

/** Kéo tiến độ từ máy chủ về, gộp với bản trong máy, rồi đẩy bản gộp lên nếu khác. */
export async function syncIsland(): Promise<void> {
  if (typeof window === "undefined") return;
  const uid = currentUid();
  lastUid = uid;
  if (!uid) {
    // Đã đăng xuất: không để lộ tiến độ của tài khoản trước cho khách.
    const local = load();
    if (local.owner) persist(fresh(), false);
    return setSync("guest");
  }
  if (pulling) return;
  pulling = true;
  setSync("syncing");
  try {
    const res = await fetch(`/api/island/progress?uid=${encodeURIComponent(uid)}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = (await res.json()) as { data: unknown | null };
    let local = load();
    // Dữ liệu trong máy thuộc tài khoản khác → không trộn vào tài khoản này.
    if (local.owner && local.owner !== uid) local = fresh();
    const server = j.data ? normalizeState(j.data) : null;
    const merged = server ? mergeStates(local, server) : local;
    merged.owner = uid;
    persist(merged, false);
    lastSyncAt = Date.now();
    if (!server || !sameContent(merged, server)) {
      pulling = false;
      await pushNow();
    } else {
      setSync("synced", new Date().toISOString());
    }
  } catch {
    setSync(!navigator.onLine ? "offline" : "error");
  } finally {
    pulling = false;
  }
}

let started = false;
function startSync() {
  if (started || typeof window === "undefined") return;
  started = true;
  backfillPhrases();
  syncIsland();
  window.addEventListener("focus", () => {
    if (Date.now() - lastSyncAt > 20_000 || syncState.status === "error" || syncState.status === "offline") syncIsland();
  });
  window.addEventListener("online", () => syncIsland());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && dirty && currentUid()) {
      if (pushTimer) clearTimeout(pushTimer);
      pushNow(true);
    }
  });
  window.addEventListener("storage", (e) => {
    if (e.key === UID_KEY) syncIsland();
  });
  // Đăng nhập / đăng xuất trong cùng tab không bắn sự kiện storage → kiểm tra định kỳ.
  setInterval(() => {
    if (currentUid() !== lastUid) syncIsland();
  }, 4000);
}

const SERVER_SNAPSHOT = fresh();
const SERVER_SYNC = { status: "idle" as SyncStatus };

export function useIsland(): IslandState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      startSync();
      const onStorage = (e: StorageEvent) => {
        if (e.key === KEY) {
          cache = null;
          cb();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(cb);
        window.removeEventListener("storage", onStorage);
      };
    },
    load,
    () => SERVER_SNAPSHOT,
  );
}

export function useSyncStatus(): { status: SyncStatus; at?: string } {
  return useSyncExternalStore(
    (cb) => {
      syncListeners.add(cb);
      return () => syncListeners.delete(cb);
    },
    () => syncState,
    () => SERVER_SYNC,
  );
}

// ───────────── Hành động ─────────────

export function completeMission(chapterId: number, key: MissionKey, xp: number, extra: Partial<ChapterProgress> = {}) {
  update((s) => {
    const prev = s.chapters[chapterId] || {};
    const ch: ChapterProgress = { ...prev, ...extra, [key]: true };
    if (key === "lesson") {
      ch.stars = Math.max(prev.stars || 0, extra.stars || 0);
      ch.doneAt = prev.doneAt || today();
    }
    let next: IslandState = markDaily({ ...s, xp: s.xp + xp, chapters: { ...s.chapters, [chapterId]: ch } }, "mission");
    if (key === "review") next = markDaily(next, "review");
    if (key === "reflex") next = markDaily(next, "reflex");
    if (key === "lesson") {
      next.unlockedUpTo = Math.max(next.unlockedUpTo, Math.min(chapterId + 1, CHAPTERS.length));
      const chapter = CHAPTERS.find((c) => c.id === chapterId);
      if (chapter) next = addPhrases(addWords(next, chapterId, chapter.words), chapter);
    }
    return markStudy(next);
  });
}

export function completeChallenge(id: string, stars: number, xp: number) {
  update((s) =>
    markStudy({
      ...s,
      xp: s.xp + xp,
      challenges: { ...s.challenges, [id]: { done: true, stars: Math.max(stars, s.challenges[id]?.stars || 0) } },
    }),
  );
}

function addWords(s: IslandState, ch: number, words: Word[]): IslandState {
  const map = { ...s.words };
  for (const w of words) {
    if (!map[w.en]) map[w.en] = { ...w, ch, box: 1, due: addDays(today(), 1), seen: 0 };
  }
  return { ...s, words: map };
}

/** Câu khung của một chương: câu trả lời đúng trong nhập vai, câu ghép, câu cứu nguy, câu nêu ý kiến. */
export function phrasesOf(ch: Chapter): { en: string; vi: string }[] {
  const list: { en: string; vi: string }[] = [];
  for (const t of ch.turns) {
    const o = t.options.find((x) => x.ok);
    if (o) list.push({ en: o.en, vi: o.vi });
  }
  for (const b of ch.builder) list.push({ en: b.en, vi: b.vi });
  const r = ch.rescue.options.find((x) => x.ok);
  if (r) list.push({ en: r.en, vi: r.vi });
  for (const e of PHRASE_EXTRAS[ch.id] || []) list.push(e);
  const seen = new Set<string>();
  return list.filter((x) => (seen.has(x.en) ? false : (seen.add(x.en), true)));
}

function addPhrases(s: IslandState, ch: Chapter): IslandState {
  let changed = false;
  const map = { ...s.phrases };
  for (const p of phrasesOf(ch)) {
    if (!map[p.en]) {
      map[p.en] = { ...p, ch: ch.id, box: 1, due: addDays(today(), 1), seen: 0 };
      changed = true;
    }
  }
  return changed ? { ...s, phrases: map } : s;
}

/** Bổ sung câu khung cho các chương đã học xong trước khi có tính năng này. */
export function backfillPhrases() {
  const s = load();
  let next = s;
  for (const c of CHAPTERS) if (s.chapters[c.id]?.lesson) next = addPhrases(next, c);
  if (next !== s) save(next);
}

export function gradePhrase(en: string, remembered: boolean) {
  update((s) => {
    const card = s.phrases[en];
    if (!card) return s;
    const box = remembered ? Math.min(card.box + 1, INTERVALS.length - 1) : 1;
    const due = remembered ? addDays(today(), INTERVALS[box]) : today();
    return markStudy(markDaily({ ...s, phrases: { ...s.phrases, [en]: { ...card, box, due, seen: card.seen + 1 } } }, "review"));
  });
}

/** Lưu một lượt Ao Phản Xạ; cộng XP; đánh dấu nhiệm vụ ngày 6 nếu đạt. */
export function logReflex(run: Omit<ReflexRun, "at">, xp: number, missionCh?: number) {
  update((s) => {
    let next: IslandState = markDaily({ ...s, xp: s.xp + xp, reflex: [...s.reflex, { ...run, at: new Date().toISOString() }].slice(-400) }, "reflex");
    if (missionCh && s.chapters[missionCh]?.lesson && !s.chapters[missionCh]?.reflex) {
      next = markDaily({ ...next, chapters: { ...next.chapters, [missionCh]: { ...next.chapters[missionCh], reflex: true } } }, "mission");
    }
    return markStudy(next);
  });
}

/** Đánh dấu một nhiệm vụ trong phòng chat; trả về true nếu vừa hoàn thành đủ cả bộ. */
export function markChatTask(ch: number, idx: number, total: number, bonusXp: number): boolean {
  const s = load();
  const key = `${ch}:${idx}`;
  if (s.chatTasks[key]) return false;
  const tasks = { ...s.chatTasks, [key]: true };
  const all = Array.from({ length: total }).every((_, i) => tasks[`${ch}:${i}`]);
  save(markStudy({ ...s, chatTasks: tasks, xp: s.xp + (all ? bonusXp : 0) }));
  return all;
}

/** Lưu điểm phát âm; đánh dấu nhiệm vụ ngày 7 nếu đạt từ 60%. */
export function saveSound(setId: string, pct: number, xp: number, missionCh?: number) {
  update((s) => {
    let next: IslandState = { ...s, xp: s.xp + xp, sounds: { ...s.sounds, [setId]: Math.max(s.sounds[setId] || 0, pct) } };
    if (pct >= 60 && missionCh && s.chapters[missionCh]?.lesson && !s.chapters[missionCh]?.sound) {
      next = markDaily({ ...next, chapters: { ...next.chapters, [missionCh]: { ...next.chapters[missionCh], sound: true } } }, "mission");
    }
    return markStudy(next);
  });
}

export function gradeWord(en: string, remembered: boolean) {
  update((s) => {
    const card = s.words[en];
    if (!card) return s;
    const box = remembered ? Math.min(card.box + 1, INTERVALS.length - 1) : 1;
    const due = remembered ? addDays(today(), INTERVALS[box]) : today();
    return markStudy(markDaily({ ...s, words: { ...s.words, [en]: { ...card, box, due, seen: card.seen + 1 } } }, "review"));
  });
}

export function addChatTurn() {
  update((s) => markStudy({ ...s, chatTurns: s.chatTurns + 1 }));
}

export function applyPlacement(level: string, score: number) {
  const upTo = level === "B1" ? 9 : level === "A2" ? 5 : 1;
  update((s) => ({ ...s, unlockedUpTo: Math.max(s.unlockedUpTo, upTo), placement: { level, score, at: today() } }));
}

export function restartPlan() {
  update((s) => ({ ...s, startDate: today(), planResetAt: new Date().toISOString() }));
}

/** Xoá tiến độ trong máy này (bản trên máy chủ không bị xoá, sẽ được gộp lại ở lần đồng bộ sau). */
export function resetIsland() {
  save(fresh());
}

// ───────────── Tính toán ─────────────

export function isUnlocked(s: IslandState, chapterId: number): boolean {
  return chapterId <= s.unlockedUpTo || !!s.chapters[chapterId - 1]?.lesson;
}

export function isChallengeUnlocked(s: IslandState, id: string): boolean {
  const c = CHALLENGES.find((x) => x.id === id);
  return !!c && c.chapters.every((ch) => s.chapters[ch]?.lesson);
}

/** Chương nên học tiếp: chương mở khoá đầu tiên chưa xong bài học. */
export function currentChapterId(s: IslandState): number {
  for (const c of CHAPTERS) {
    if (isUnlocked(s, c.id) && !s.chapters[c.id]?.lesson) return c.id;
  }
  // Đã xong hết bài học → chương đầu tiên còn nhiệm vụ chưa xong
  for (const c of CHAPTERS) {
    const p = s.chapters[c.id] || {};
    if (MISSIONS.some((m) => !p[m.key])) return c.id;
  }
  return CHAPTERS[CHAPTERS.length - 1].id;
}

/** Tuần theo lịch (tính từ ngày bắt đầu). */
export function calendarWeek(s: IslandState): number {
  return Math.min(TOTAL_WEEKS, Math.max(1, Math.floor(daysBetween(s.startDate, today()) / 7) + 1));
}

export function weekStartDate(s: IslandState, week: number): string {
  return addDays(s.startDate, (week - 1) * 7);
}

export function missionsDone(s: IslandState, chapterId: number): number {
  const p = s.chapters[chapterId] || {};
  return MISSIONS.filter((m) => p[m.key]).length;
}

export function nextMission(s: IslandState, chapterId: number): MissionKey | null {
  const p = s.chapters[chapterId] || {};
  const m = MISSIONS.find((x) => !p[x.key]);
  return m ? m.key : null;
}

export function dueWords(s: IslandState): WordCard[] {
  const t = today();
  return Object.values(s.words).filter((w) => w.due <= t);
}

export function duePhrases(s: IslandState): PhraseCard[] {
  const t = today();
  return Object.values(s.phrases).filter((p) => p.due <= t);
}

/** Thời gian phản xạ trung bình (giây) của N lượt nói gần nhất, null nếu chưa có. */
export function recentReflexSec(s: IslandState, n = 5): number | null {
  const runs = s.reflex.filter((r) => r.voice && r.avgMs > 0 && r.mode !== "swap").slice(-n);
  if (!runs.length) return null;
  return runs.reduce((a, r) => a + r.avgMs, 0) / runs.length / 1000;
}

/** Độ thân thiết với một cư dân: điểm, số tim (0–5), điểm cần cho tim kế tiếp. */
export function friendship(s: IslandState, npc: NpcId): { points: number; hearts: number; next: number | null } {
  let points = 0;
  for (const c of CHAPTERS) {
    if (c.npc !== npc) continue;
    const p = s.chapters[c.id] || {};
    points += (p.lesson ? 3 : 0) + (p.listen ? 1 : 0) + (p.speak ? 2 : 0) + (p.chat ? 3 : 0) + (p.reflex ? 2 : 0) + (p.sound ? 1 : 0) + (p.review ? 1 : 0);
    for (let i = 0; i < 3; i++) if (s.chatTasks[`${c.id}:${i}`]) points += 1;
    points += Math.min(5, s.reflex.filter((r) => r.ch === c.id).length);
  }
  let hearts = 0;
  for (let i = 1; i < FRIEND_LEVELS.length; i++) if (points >= FRIEND_LEVELS[i]) hearts = i;
  return { points, hearts, next: hearts < 5 ? FRIEND_LEVELS[hearts + 1] : null };
}

export function totalStars(s: IslandState): number {
  return (
    Object.values(s.chapters).reduce((a, c) => a + (c.stars || 0), 0) +
    Object.values(s.challenges).reduce((a, c) => a + (c.stars || 0), 0)
  );
}

export function islandLevel(xp: number): { level: number; pct: number } {
  const per = 250;
  return { level: Math.floor(xp / per) + 1, pct: Math.round(((xp % per) / per) * 100) };
}

export function streak(s: IslandState): number {
  const set = new Set(s.studyDays);
  let n = 0;
  let d = today();
  if (!set.has(d)) d = addDays(d, -1);
  while (set.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/** 5 kỹ năng, tính theo % mục tiêu 3 tháng. */
export function skills(s: IslandState) {
  const chs = Object.values(s.chapters);
  const n = CHAPTERS.length;
  const words = Object.values(s.words);
  const totalWords = CHAPTERS.reduce((a, c) => a + c.words.length, 0);
  const pct = (x: number, of: number) => Math.min(100, Math.round((x / of) * 100));
  return [
    { key: "listen", name: "Nghe", pct: pct(chs.filter((c) => c.listen).length + chs.filter((c) => c.lesson).length, n * 2) },
    { key: "speak", name: "Nói", pct: pct(chs.filter((c) => c.speak).length, n) },
    { key: "vocab", name: "Từ vựng", pct: pct(words.filter((w) => w.box >= 3).length, totalWords) },
    { key: "rescue", name: "Phản xạ cứu nguy", pct: pct(chs.filter((c) => c.rescueOk).length, n) },
    { key: "chat", name: "Hội thoại tự do", pct: pct(chs.filter((c) => c.chat).length, n) },
    { key: "reflex", name: "Tốc độ phản xạ", pct: reflexPct(s) },
    { key: "sound", name: "Phát âm", pct: pct(Object.values(s.sounds).reduce((a, v) => a + v, 0), SOUND_SETS.length * 100) },
  ];
}

/** 6 giây trở lên = 0%, 1,5 giây = 100%. */
function reflexPct(s: IslandState): number {
  const sec = recentReflexSec(s);
  if (sec === null) return 0;
  return Math.max(0, Math.min(100, Math.round(((6 - sec) / 4.5) * 100)));
}

// ───────────── Hành trình hôm nay ─────────────

export interface PlanStep {
  key: DailyStep;
  title: string;
  desc: string;
  href: string;
  done: boolean;
  mins: number;
}

/** 3 bước mỗi ngày, theo thứ tự nên làm: nhiệm vụ tuần → ôn thẻ đến hạn → Ao Phản Xạ. */
export function todayPlan(s: IslandState): PlanStep[] {
  const log = s.daily[today()] || [];
  const curId = currentChapterId(s);
  const ch = CHAPTERS.find((c) => c.id === curId)!;
  const nm = nextMission(s, curId);
  const m = MISSIONS.find((x) => x.key === nm);
  const missionHrefFor = (key: MissionKey) =>
    key === "lesson" ? `/island/lesson/${curId}` : key === "listen" ? `/island/lesson/${curId}?mode=listen` : key === "speak" ? `/island/lesson/${curId}?mode=speak` : key === "chat" ? `/island/chat?ch=${curId}` : key === "review" ? `/island/words?ch=${curId}` : key === "reflex" ? `/island/reflex?ch=${curId}` : `/island/sounds?ch=${curId}`;
  const nWords = dueWords(s).length;
  const nPhrases = duePhrases(s).length;
  return [
    {
      key: "mission",
      title: m ? `Ngày ${m.day} · ${m.title}` : "Ôn lại chương bất kỳ",
      desc: m ? `Chương ${ch.id} · ${ch.title}` : "Tuần này xong hết nhiệm vụ rồi — luyện thêm cho chắc!",
      href: m ? missionHrefFor(m.key) : "/island/path",
      done: log.includes("mission"),
      mins: m?.mins || 5,
    },
    {
      key: "review",
      title: nPhrases > 0 ? "Ôn câu khung đến hạn" : nWords > 0 ? "Ôn sổ từ đến hạn" : "Ôn nhanh 8 câu khung",
      desc: nWords + nPhrases > 0 ? `${nWords} từ · ${nPhrases} câu đang chờ` : "Nhìn tiếng Việt → nói tiếng Anh",
      href: nPhrases > 0 || nWords === 0 ? "/island/phrases" : "/island/words",
      done: log.includes("review"),
      mins: 4,
    },
    {
      key: "reflex",
      title: "Ao Phản Xạ",
      desc: "8 câu hỏi nhanh — mở miệng trong vài giây",
      href: `/island/reflex?ch=${curId}`,
      done: log.includes("reflex"),
      mins: 3,
    },
  ];
}

/** Bước kế tiếp chưa làm hôm nay (null = xong cả 3). */
export function nextPlanStep(s: IslandState): PlanStep | null {
  return todayPlan(s).find((p) => !p.done) || null;
}

export function chestOpened(s: IslandState): boolean {
  return (s.daily[today()] || []).includes("chest");
}

/** Mở rương khi xong cả 3 bước: +30 XP, mỗi ngày một lần. Trả về true nếu vừa mở. */
export function openChest(): boolean {
  const s = load();
  if (chestOpened(s) || todayPlan(s).some((p) => !p.done)) return false;
  save(markDaily({ ...s, xp: s.xp + 30 }, "chest"));
  return true;
}

// ───────────── Ao Tôm Cua: học → vỏ sò & thức ăn → nuôi → thu hoạch ─────────────

/** Vỏ sò hiện có: 1 vỏ sò cho mỗi 2 XP học tập + tiền bán hải sản − tiền đã tiêu. */
export function shells(s: IslandState): number {
  return Math.max(0, STARTER_SHELLS + Math.floor(s.xp / 2) + s.farm.earned - s.farm.spent);
}

/** Thức ăn kiếm được từ việc học (nhiệm vụ, phản xạ, nhiệm vụ chat, ôn thẻ). */
export function foodEarned(s: IslandState): number {
  let missions = 0;
  for (const c of Object.values(s.chapters)) for (const m of MISSIONS) if (c[m.key]) missions++;
  const reviews = Object.values(s.words).reduce((a, w) => a + w.seen, 0) + Object.values(s.phrases).reduce((a, p) => a + p.seen, 0);
  return 3 + missions * 2 + s.reflex.length + Object.keys(s.chatTasks).length + Math.floor(reviews / 5);
}

export function food(s: IslandState): number {
  return Math.max(0, foodEarned(s) - s.farm.foodUsed);
}

/** Tiến độ lớn của một ô (0..1) và số phút còn lại. */
export function growth(slot: FarmSlot, now = Date.now()): { pct: number; minsLeft: number } {
  const sp = SPECIES_BY_KIND[slot.kind];
  const total = sp.hours * 3600_000 * (1 - FEED_CUT * Math.min(MAX_FEED, slot.boost));
  const elapsed = now - Date.parse(slot.at);
  const pct = Math.max(0, Math.min(1, elapsed / total));
  return { pct, minsLeft: Math.max(0, Math.ceil((total - elapsed) / 60000)) };
}

export function activeSlot(s: IslandState, idx: number): FarmSlot | null {
  const sl = s.farm.slots[String(idx)];
  return sl && !sl.done ? sl : null;
}

export function readyCount(s: IslandState): number {
  let n = 0;
  for (let i = 0; i < s.farm.size; i++) {
    const sl = activeSlot(s, i);
    if (sl && growth(sl).pct >= 1) n++;
  }
  return n;
}

export type FarmResult = { ok: true } | { ok: false; reason: string };

export function buySeed(kind: FarmKind, idx: number): FarmResult {
  const s = load();
  const sp = SPECIES_BY_KIND[kind];
  if (idx < 0 || idx >= s.farm.size) return { ok: false, reason: "Ô ao không hợp lệ." };
  if (activeSlot(s, idx)) return { ok: false, reason: "Ô này đang nuôi rồi." };
  if (islandLevel(s.xp).level < sp.minLevel) return { ok: false, reason: `Cần đảo cấp ${sp.minLevel} để nuôi ${sp.vi}.` };
  if (shells(s) < sp.price) return { ok: false, reason: `Chưa đủ vỏ sò (cần ${sp.price}). Học thêm để kiếm nhé!` };
  save({ ...s, farm: { ...s.farm, spent: s.farm.spent + sp.price, slots: { ...s.farm.slots, [String(idx)]: { kind, at: new Date().toISOString(), boost: 0 } } } });
  return { ok: true };
}

export function feedSlot(idx: number): FarmResult {
  const s = load();
  const sl = activeSlot(s, idx);
  if (!sl) return { ok: false, reason: "Ô này đang trống." };
  if (sl.boost >= MAX_FEED) return { ok: false, reason: "No căng bụng rồi, để nó lớn nhé!" };
  if (growth(sl).pct >= 1) return { ok: false, reason: "Đã lớn rồi — thu hoạch thôi!" };
  if (food(s) < 1) return { ok: false, reason: "Hết thức ăn. Làm một nhiệm vụ học để nhận thêm!" };
  save({ ...s, farm: { ...s.farm, foodUsed: s.farm.foodUsed + 1, slots: { ...s.farm.slots, [String(idx)]: { ...sl, boost: sl.boost + 1 } } } });
  return { ok: true };
}

export function harvestSlot(idx: number): { ok: true; earned: number; kind: FarmKind } | { ok: false; reason: string } {
  const s = load();
  const sl = activeSlot(s, idx);
  if (!sl) return { ok: false, reason: "Ô này đang trống." };
  if (growth(sl).pct < 1) return { ok: false, reason: "Chưa lớn, chờ thêm chút nhé." };
  const earned = SPECIES_BY_KIND[sl.kind].sell;
  save(markStudy({ ...s, farm: { ...s.farm, earned: s.farm.earned + earned, slots: { ...s.farm.slots, [String(idx)]: { ...sl, done: new Date().toISOString() } } } }));
  return { ok: true, earned, kind: sl.kind };
}

export function expandPond(): FarmResult {
  const s = load();
  const cost = EXPAND_COST[s.farm.size];
  if (!cost) return { ok: false, reason: "Ao đã rộng tối đa." };
  if (shells(s) < cost) return { ok: false, reason: `Cần ${cost} vỏ sò để mở rộng ao.` };
  save({ ...s, farm: { ...s.farm, spent: s.farm.spent + cost, size: s.farm.size + 3 } });
  return { ok: true };
}
