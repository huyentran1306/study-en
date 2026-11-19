"use client";

// Tiến độ Chit Chat Island: lưu ngay trong trình duyệt (localStorage) để dùng offline,
// và đồng bộ lên máy chủ (D1, /api/island/progress) khi người dùng đã đăng nhập.
import { useSyncExternalStore } from "react";
import { CHAPTERS, CHALLENGES, TOTAL_WEEKS, MISSIONS, missionHref, type Chapter, type MissionKey, type NpcId, type Word } from "./curriculum";
import { cleanField, lenientWords, mePhrases } from "./me";
import { setLenientWords } from "./speech";
import { BUILDS, FRIEND_LEVELS, NPC_STORIES, PHRASE_EXTRAS, SOUND_SETS } from "./drills";
import { EXPAND_COST, FEED_CUT, MAX_FEED, RARE_SELL, SPECIES_BY_KIND, STARTER_SHELLS, rareChance } from "./farm-data";
import { isDuplicate } from "./memory";
import { BUILD_BONUS, isleSpot } from "./isle";
import { PIECES_PER_CHEST, quizPieces, quizShells } from "./harbor-quiz";
import { checkDue, type CheckRecord } from "./checkpoint";
import { FEST_BONUS } from "./festival";
import { MINE_LEVEL, decorItem } from "./decor";
import { ARCADE, PLOTS, arcadeCap, buildKind, libraryFood, plotIncome, plotStatus, upgradeCost } from "./beach";
import type { ChatReport, ErrorTag } from "./feedback";
import { MAX_MEMORIES, MAX_MIRROR, MAX_REPORTS, type MirrorTake, freshState, mergeStates, normalizeState, sameContent, todayStr, type Memory, type ChapterProgress, type IslandState, type FarmKind, type FarmSlot, type PhraseCard, type Profile, type ReflexRun, type WordCard } from "./state";

export type { Profile, Sprint } from "./state";
export type { ChapterProgress, IslandState, Memory, MirrorTake, PhraseCard, ReflexMode, ReflexRun, WordCard } from "./state";

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
  setLenientWords(lenientWords(cache!.profile));
  return cache!;
}

/** Ghi vào trình duyệt; push=true thì hẹn đẩy lên máy chủ. */
function persist(next: IslandState, push: boolean) {
  cache = next;
  setLenientWords(lenientWords(next.profile));
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* hết dung lượng hoặc chế độ riêng tư — bỏ qua */
  }
  listeners.forEach((l) => l());
  if (push) schedulePush();
}

function save(next: IslandState) {
  next = sprintHook(load(), next);
  persist({ ...next, updatedAt: new Date().toISOString() }, true);
}

function update(fn: (s: IslandState) => IslandState) {
  save(fn(load()));
}

/** Đảo Luyện: lần đầu thử một tính năng thì dựng công trình tương ứng. */
function withBuilt(s: IslandState, id: string): IslandState {
  if (s.built[id] || !isleSpot(id)) return s;
  return { ...s, built: { ...s.built, [id]: new Date().toISOString() } };
}

/** Đánh dấu đã thử tính năng (Gọi điện, Phòng nghe, Nói đuổi...). Trả về true nếu vừa dựng xong công trình. */
export function markBuilt(id: string): boolean {
  const s = load();
  if (s.built[id] || !isleSpot(id)) return false;
  save(withBuilt(s, id));
  return true;
}

function markStudy(s: IslandState): IslandState {
  const t = today();
  if (s.studyDays.includes(t)) return s;
  return { ...applyFreeze(s, t), studyDays: [...s.studyDays, t].slice(-400) };
}

/** Thẻ giữ chuỗi: học lại sau 1–2 ngày nghỉ thì tự dùng thẻ đắp vào những ngày bị lỡ (nếu đủ thẻ). */
function applyFreeze(s: IslandState, t: string): IslandState {
  const covered = new Set([...s.studyDays, ...s.freeze.used]);
  const last = [...covered].filter((d) => d < t).sort().pop();
  if (!last) return s;
  const gap: string[] = [];
  for (let d = addDays(last, 1); d < t && gap.length <= 3; d = addDays(d, 1)) gap.push(d);
  const left = s.freeze.bought - s.freeze.used.length;
  if (!gap.length || gap.length > 2 || gap.length > left) return s;
  return { ...s, freeze: { ...s.freeze, used: [...s.freeze.used, ...gap].slice(-60) } };
}

export const FREEZE_COST = 60;
export const FREEZE_MAX = 3;

export function freezesLeft(s: IslandState): number {
  return Math.max(0, s.freeze.bought - s.freeze.used.length);
}

/** Mua thẻ giữ chuỗi bằng vỏ sò (giữ tối đa 3 thẻ). */
export function buyFreeze(): boolean {
  const s = load();
  if (shells(s) < FREEZE_COST || freezesLeft(s) >= FREEZE_MAX) return false;
  save({ ...s, farm: { ...s.farm, spent: s.farm.spent + FREEZE_COST }, freeze: { ...s.freeze, bought: s.freeze.bought + 1 } });
  return true;
}

/** Xong nhiệm vụ hỏi thông tin / thử thách: giữ số sao cao nhất. Trả về true nếu là lần đầu. */
export function finishMission(id: string, stars: number, xp: number, trophy?: string): boolean {
  const s = load();
  const prev = s.missions[id];
  const at = new Date().toISOString();
  const missions = { ...s.missions, [id]: { stars: Math.max(prev?.stars || 0, stars), at: prev?.at || at } };
  const trophies = trophy && !s.trophies[trophy] ? { ...s.trophies, [trophy]: at } : s.trophies;
  save(withBuilt(markStudy({ ...s, missions, trophies, xp: s.xp + (prev ? Math.round(xp / 3) : xp) }), trophy ? "boss" : "mission"));
  return !prev;
}

/** Thử ngoài đời: đánh dấu đã làm + câu đã nói. */
export function doRealLife(id: string, note: string, xp: number) {
  update((s) => (s.reallife[id] ? { ...s, reallife: { ...s.reallife, [id]: { ...s.reallife[id], note: cleanField(note, 300) } } } : markStudy({ ...s, reallife: { ...s.reallife, [id]: { at: new Date().toISOString(), note: cleanField(note, 300) } }, xp: s.xp + xp })));
}

/** Truyện cư dân: lưu câu trả lời của bạn cho một tập. */
export function saveEpisode(id: string, answer: string, xp: number) {
  update((s) => withBuilt(markStudy({ ...s, episodes: { ...s.episodes, [id]: { at: s.episodes[id]?.at || new Date().toISOString(), answer: cleanField(answer, 300) } }, xp: s.xp + (s.episodes[id] ? 0 : xp) }), "stories"));
}

/** Bài học của tôi: thêm các câu về cuộc sống của bạn vào Sổ câu. Trả về số câu mới. */
export function addLifePhrases(list: { en: string; vi: string }[]): number {
  const s = load();
  const phrases = { ...s.phrases };
  let n = 0;
  for (const p of list.slice(0, 12)) {
    const en = cleanField(p.en, 300);
    if (!en || phrases[en]) continue;
    phrases[en] = { en, vi: cleanField(p.vi, 300), ch: 0, box: 1, due: today(), seen: 0, kind: "life" };
    n++;
  }
  if (n) save({ ...s, phrases });
  return n;
}

/** Gương thời gian: lưu số liệu một lần ghi âm. */
export function addMirror(t: MirrorTake, xp: number) {
  update((s) => withBuilt(markStudy({ ...s, mirror: [...s.mirror.filter((x) => x.at !== t.at), t].slice(-MAX_MIRROR), xp: s.xp + xp }), "mirror"));
}

export function setShareCode(code: string | undefined) {
  update((s) => (code ? withBuilt({ ...s, shareCode: code }, "visit") : { ...s, shareCode: code }));
}

export type DailyStep = "mission" | "review" | "reflex" | "chat" | "unit";

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

/** Đọc trạng thái hiện tại ngoài React (trong effect, sự kiện) — tránh bản rỗng lúc vừa hydrate. */
export function getIsland(): IslandState {
  return load();
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

/** Đủ 5 lượt trong một buổi Tám AI (dùng cho ngày tổng kết của chế độ nước rút). */
export function markChatDone() {
  update((s) => markDaily(s, "chat"));
}

/** Lưu Hồ sơ của tôi và sinh lại các thẻ câu "nói về tôi". */
export function saveProfile(p: Omit<Profile, "at">) {
  update((s) => {
    const profile: Profile = {
      name: cleanField(p.name, 40),
      hometown: cleanField(p.hometown, 40),
      job: cleanField(p.job, 50).replace(/^(a|an|the)\s+/i, ""),
      jobVi: cleanField(p.jobVi, 50),
      hobby: cleanField(p.hobby, 50),
      hobbyVi: cleanField(p.hobbyVi, 50),
      at: new Date().toISOString(),
    };
    const phrases = { ...s.phrases };
    const old: Record<string, PhraseCard> = {};
    for (const k of Object.keys(phrases)) {
      if (phrases[k].kind === "me") {
        old[k] = phrases[k];
        delete phrases[k];
      }
    }
    for (const m of mePhrases(profile)) {
      if (!phrases[m.en]) phrases[m.en] = old[m.en] || { ...m, ch: 0, box: 1, due: today(), seen: 0, kind: "me" };
    }
    return { ...s, profile, phrases };
  });
}

const MAX_FIXES = 150;

/** Sổ lỗi sai: lưu câu AI vừa sửa thành một thẻ ôn "nói lại câu đúng". Trả về true nếu là thẻ mới. */
export function addFix(said: string, fixed: string, note: string, ch: number, tag?: ErrorTag): boolean {
  const en = fixed.replace(/\s+/g, " ").trim().slice(0, 300);
  const was = said.replace(/\s+/g, " ").trim().slice(0, 300);
  if (!en || !was || en.split(" ").length > 30) return false;
  const s = load();
  if (s.phrases[en]) return false;
  const phrases = { ...s.phrases };
  const fixes = Object.values(phrases).filter((x) => x.kind === "fix");
  if (fixes.length >= MAX_FIXES) {
    // Hết chỗ: bỏ thẻ đã thuộc nhất.
    const drop = fixes.sort((a, b) => b.box - a.box || (a.due < b.due ? -1 : 1))[0];
    delete phrases[drop.en];
  }
  phrases[en] = { en, vi: note.trim().slice(0, 300), ch, box: 1, due: today(), seen: 0, kind: "fix", said: was, ...(tag ? { tag } : {}) };
  save({ ...s, phrases });
  return true;
}

export function fixCards(s: IslandState): PhraseCard[] {
  return Object.values(s.phrases).filter((p) => p.kind === "fix");
}

/** Người học vừa nói đúng một câu từng sai: đẩy thẻ Sổ lỗi sai lên một hộp (không tính là bước "ôn" trong ngày). */
export function praiseFix(en: string) {
  update((s) => {
    const card = s.phrases[en];
    if (!card || card.kind !== "fix") return s;
    const box = Math.min(card.box + 1, INTERVALS.length - 1);
    return { ...s, phrases: { ...s.phrases, [en]: { ...card, box, due: addDays(today(), INTERVALS[box]) } } };
  });
}

/** Lưu phiếu nhận xét (cùng một cuộc trò chuyện thì ghi đè bản cũ theo khoá at). */
export function saveReport(r: ChatReport) {
  update((s) => ({ ...s, reports: [...s.reports.filter((x) => x.at !== r.at), r].sort((p, q) => (p.at < q.at ? -1 : 1)).slice(-MAX_REPORTS) }));
}

/** Cư dân ghi nhớ vài chuyện người học vừa kể. Trả về các chuyện mới thật sự được lưu. */
export function addMemories(npc: NpcId, ch: number, items: { fact: string; vi: string; ask: string }[]): Memory[] {
  const s = load();
  const at = new Date().toISOString();
  const added: Memory[] = [];
  const all = [...s.memories];
  items.slice(0, 3).forEach((it, i) => {
    const fact = cleanField(it.fact, 160);
    const ask = cleanField(it.ask, 160);
    if (!fact || !ask || isDuplicate(all, fact)) return;
    const m: Memory = { id: `${at}#${i}`, npc, ch, fact, vi: cleanField(it.vi, 160), ask, at };
    all.push(m);
    added.push(m);
  });
  if (added.length) save({ ...s, memories: all.slice(-MAX_MEMORIES) });
  return added;
}

/** Cư dân đã hỏi lại chuyện này. */
export function markMemoryUsed(id: string) {
  update((s) => ({ ...s, memories: s.memories.map((m) => (m.id === id && !m.gone && !m.used ? { ...m, used: new Date().toISOString() } : m)) }));
}

/** Xoá một chuyện (hoặc tất cả khi id = null): xoá nội dung, giữ khoá để không sống lại khi đồng bộ. */
export function forgetMemory(id: string | null) {
  update((s) => ({ ...s, memories: s.memories.map((m) => (id === null || m.id === id ? { id: m.id, npc: m.npc, ch: m.ch, fact: "", vi: "", ask: "", at: m.at, gone: true } : m)) }));
}

/** Bật chế độ nước rút 30 ngày (tính ngày 1 từ hôm nay). */
export function startSprint() {
  update((s) => ({ ...s, sprint: { on: true, start: today(), at: new Date().toISOString(), ...(s.sprint?.doneAt ? { doneAt: s.sprint.doneAt } : {}) } }));
}

/** Quay về nhịp 13 tuần. */
export function stopSprint() {
  update((s) => (s.sprint ? { ...s, sprint: { ...s.sprint, on: false, at: new Date().toISOString() } } : s));
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

/** 3 chìa khoá của một chương: phải xong cả 3 thì chương sau mới mở (trừ khi bài kiểm tra xếp lớp đã mở sẵn). */
export const KEY_MISSIONS = ["lesson", "speak", "chat"] as const;
export const KEY_NAMES: Record<(typeof KEY_MISSIONS)[number], string> = { lesson: "Bài học", speak: "Nhập vai bằng giọng", chat: "Tám chuyện AI" };

export function chapterKeys(s: IslandState, chapterId: number) {
  const p = s.chapters[chapterId] || {};
  const have = KEY_MISSIONS.filter((k) => !!p[k]);
  return { have, missing: KEY_MISSIONS.filter((k) => !p[k]), all: have.length === KEY_MISSIONS.length };
}

/** Câu báo về chương kế tiếp sau khi xong một chìa khoá: đã mở, hay còn thiếu gì. null = không cần báo. */
export function unlockNote(s: IslandState, chapterId: number): string | null {
  const next = CHAPTERS.find((c) => c.id === chapterId + 1);
  if (!next || next.id <= s.unlockedUpTo) return null;
  const k = chapterKeys(s, chapterId);
  return k.all ? `Đã mở khoá Chương ${next.id}: ${next.title}` : `Còn ${k.missing.length} chìa khoá để mở Chương ${next.id}: ${k.missing.map((m) => KEY_NAMES[m]).join(", ")}`;
}

export function isUnlocked(s: IslandState, chapterId: number): boolean {
  return chapterId <= s.unlockedUpTo || chapterKeys(s, chapterId - 1).all;
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
  const set = new Set([...s.studyDays, ...s.freeze.used]);
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

// ───────────── Nước rút 30 ngày ─────────────
// 13 chương × 2 ngày (A: bài học + chỉ nghe + phản xạ · B: nhập vai nói + tám AI + phát âm + ôn thẻ)
// + 3 ngày thử thách sau mỗi chặng + 1 ngày tổng kết = 30 ngày, khoảng 25 phút mỗi ngày.

export interface SprintUnit {
  day: number;
  kind: "a" | "b" | "challenge" | "final";
  ch?: number;
  cid?: string;
  title: string;
}

const A_KEYS: MissionKey[] = ["lesson", "listen", "reflex"];
const B_KEYS: MissionKey[] = ["speak", "chat", "sound", "review"];

export const SPRINT_UNITS: SprintUnit[] = (() => {
  const out: SprintUnit[] = [];
  for (const c of CHALLENGES) {
    for (const id of c.chapters) {
      const ch = CHAPTERS.find((x) => x.id === id);
      if (!ch) continue;
      out.push({ day: out.length + 1, kind: "a", ch: id, title: `${ch.title} · học & nghe` });
      out.push({ day: out.length + 1, kind: "b", ch: id, title: `${ch.title} · nói & tám` });
    }
    out.push({ day: out.length + 1, kind: "challenge", cid: c.id, title: `Thử thách: ${c.title}` });
  }
  out.push({ day: out.length + 1, kind: "final", title: "Ngày tổng kết" });
  return out;
})();

export const SPRINT_DAYS = SPRINT_UNITS.length;

export function sprintUnitDone(s: IslandState, u: SprintUnit): boolean {
  if (u.kind === "final") return !!s.sprint?.doneAt;
  if (u.kind === "challenge") return !!s.challenges[u.cid!]?.done;
  const p = s.chapters[u.ch!] || {};
  return (u.kind === "a" ? A_KEYS : B_KEYS).every((k) => p[k]);
}

function sprintFirstOpen(s: IslandState): number {
  return SPRINT_UNITS.findIndex((u) => !sprintUnitDone(s, u));
}

/** Sau mỗi thay đổi: nếu chặng của hôm nay vừa xong thì ghi vào nhật ký ngày (để bảng hành trình giữ nguyên chặng đó tới hết ngày). */
function sprintHook(prev: IslandState, next: IslandState): IslandState {
  if (!next.sprint?.on) return next;
  const fo = sprintFirstOpen(prev);
  if (fo < 0) return next;
  const u = SPRINT_UNITS[fo];
  if (u.kind === "final") {
    const log = next.daily[today()] || [];
    if (["review", "reflex", "chat"].every((k) => log.includes(k))) next = { ...next, sprint: { ...next.sprint, doneAt: today() } };
  }
  return sprintUnitDone(next, u) ? markDaily(next, "unit") : next;
}

export function sprintInfo(s: IslandState) {
  const on = !!s.sprint?.on;
  const fo = sprintFirstOpen(s);
  const doneToday = (s.daily[today()] || []).includes("unit");
  const idx = fo < 0 ? SPRINT_DAYS - 1 : doneToday ? Math.max(0, fo - 1) : fo;
  const unitsDone = fo < 0 ? SPRINT_DAYS : fo;
  const calDay = s.sprint ? Math.min(SPRINT_DAYS, Math.max(1, daysBetween(s.sprint.start, today()) + 1)) : 1;
  return {
    on,
    /** Chặng đang hiện hôm nay (1..30). */
    day: idx + 1,
    unit: SPRINT_UNITS[idx],
    unitsDone,
    calDay,
    /** Số ngày chậm so với lịch (0 = đang theo kịp hoặc vượt). */
    behind: Math.max(0, calDay - 1 - unitsDone),
    ahead: Math.max(0, unitsDone - calDay),
    doneToday: doneToday || fo < 0,
    finished: fo < 0,
  };
}

function sprintPlan(s: IslandState): PlanStep[] {
  const log = s.daily[today()] || [];
  const u = sprintInfo(s).unit;
  const nWords = dueWords(s).length;
  const nPhrases = duePhrases(s).length;
  const reviewDaily = (title: string): PlanStep => ({
    key: "review",
    title,
    desc: nWords + nPhrases > 0 ? `${nWords} từ · ${nPhrases} câu đang chờ` : "Nhìn tiếng Việt → nói tiếng Anh",
    href: nPhrases > 0 || nWords === 0 ? "/island/phrases" : "/island/words",
    done: log.includes("review"),
    mins: 4,
  });
  const reflexDaily: PlanStep = { key: "reflex", title: "Ao Phản Xạ", desc: "8 câu hỏi nhanh — mở miệng trong vài giây", href: "/island/reflex", done: log.includes("reflex"), mins: 4 };
  if (u.kind === "final") {
    return [reviewDaily("Ôn câu khung & lỗi sai"), reflexDaily, { key: "chat", title: "Tám chuyện tự do 5 lượt", desc: "Chọn chủ đề bạn thích nhất", href: "/island/chat", done: log.includes("chat"), mins: 8 }];
  }
  if (u.kind === "challenge") {
    const c = CHALLENGES.find((x) => x.id === u.cid)!;
    return [{ key: "challenge", title: `Thử thách: ${c.title}`, desc: c.subtitle, href: `/island/lesson/${c.id}`, done: !!s.challenges[c.id]?.done, mins: 10 }, reviewDaily("Ôn câu khung & lỗi sai"), reflexDaily];
  }
  const ch = CHAPTERS.find((c) => c.id === u.ch)!;
  const p = s.chapters[ch.id] || {};
  const steps: PlanStep[] = (u.kind === "a" ? A_KEYS : B_KEYS).map((k) => {
    const m = MISSIONS.find((x) => x.key === k)!;
    return { key: k, title: m.title, desc: `Chương ${ch.id} · ${ch.title}`, href: missionHref(k, ch.id), done: !!p[k], mins: m.mins };
  });
  if (u.kind === "a" && (nWords + nPhrases > 0 || log.includes("review"))) steps.push(reviewDaily("Ôn thẻ đến hạn"));
  return steps;
}

export interface PlanStep {
  key: string;
  title: string;
  desc: string;
  href: string;
  done: boolean;
  mins: number;
}

/** Các bước hôm nay. Nhịp 13 tuần: nhiệm vụ tuần → ôn thẻ đến hạn → Ao Phản Xạ. Nước rút: 3–4 chặng của ngày. */
// ───────────── Phút nói mỗi ngày ─────────────

/** Mục tiêu nói tiếng Anh mỗi ngày (giây). */
export const TALK_GOAL = 600;

/** Cộng thời gian đã nói (giây). Gọi từ sự kiện "cci-spoke" do micro phát ra. */
export function addTalk(sec: number) {
  if (!(sec > 0)) return;
  const s = load();
  const t = today();
  save({ ...s, talk: { ...s.talk, [t]: Math.min(86_400, Math.round((s.talk[t] || 0) + Math.min(120, sec))) } });
}

export function talkToday(s: IslandState): number {
  return s.talk[today()] || 0;
}

if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  window.addEventListener("cci-spoke", (e) => addTalk(Number((e as CustomEvent).detail) || 0));
}

/** Bước "Nói đủ 10 phút": gợi ý một cách luyện nói, đổi theo ngày. */
function talkStep(s: IslandState, curId: number): PlanStep {
  const sec = talkToday(s);
  const opts = [
    { name: "Gọi điện với cư dân", href: "/island/call" },
    { name: "Tám chuyện bằng giọng", href: `/island/chat?ch=${curId}` },
    { name: "Nói đuổi", href: "/island/shadow" },
    { name: "Ao Phản Xạ", href: `/island/reflex?ch=${curId}` },
  ];
  const d = new Date();
  const o = opts[Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000) % opts.length];
  const left = Math.max(0, Math.ceil((TALK_GOAL - sec) / 60));
  return {
    key: "talk",
    title: `Nói đủ ${TALK_GOAL / 60} phút`,
    desc: sec >= TALK_GOAL ? `Đã nói ${Math.round(sec / 60)} phút hôm nay` : `Đã nói ${Math.floor(sec / 60)} phút, còn ${left} phút · thử ${o.name}`,
    href: o.href,
    done: sec >= TALK_GOAL,
    mins: left || 10,
  };
}

/** Ngày tới hạn kiểm tra nói: thay bước Ao Phản Xạ bằng bài kiểm tra (khỏi thêm bước). */
function withCheck(s: IslandState, steps: PlanStep[]): PlanStep[] {
  const t = today();
  const doneToday = s.checks.some((c) => c.at.slice(0, 10) === t || new Date(c.at).toLocaleDateString("sv") === t);
  if (!checkDue(s, t) && !doneToday) return steps;
  const step: PlanStep = { key: "check", title: "Kiểm tra nói 2 tuần", desc: "3 đề nói 45 giây, AI chấm trình độ, so với lần trước", href: "/island/checkpoint", done: doneToday, mins: 5 };
  const i = steps.findIndex((p) => p.key === "reflex");
  return i >= 0 ? steps.map((p, k) => (k === i ? step : p)) : [...steps, step];
}

export function todayPlan(s: IslandState): PlanStep[] {
  return withCheck(s, basePlan(s));
}

function basePlan(s: IslandState): PlanStep[] {
  if (s.sprint?.on) return [...sprintPlan(s), talkStep(s, currentChapterId(s))];
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
    talkStep(s, curId),
  ];
}

/** Bước kế tiếp chưa làm hôm nay (null = xong cả 3). */
export function nextPlanStep(s: IslandState): PlanStep | null {
  return todayPlan(s).find((p) => !p.done) || null;
}

export function chestOpened(s: IslandState): boolean {
  return (s.daily[today()] || []).includes("chest");
}

/** Mở rương khi xong cả 4 bước: +30 XP, mỗi ngày một lần. Trả về true nếu vừa mở. */
export function openChest(): boolean {
  const s = load();
  if (chestOpened(s) || todayPlan(s).some((p) => !p.done)) return false;
  save(markDaily({ ...s, xp: s.xp + 30 }, "chest"));
  return true;
}

// ───────────── Ao Tôm Cua: học → vỏ sò & thức ăn → nuôi → thu hoạch ─────────────

/** Vỏ sò hiện có: 1 vỏ sò cho mỗi 2 XP học tập + tiền bán hải sản − tiền đã tiêu. */
export function shells(s: IslandState): number {
  return Math.max(0, STARTER_SHELLS + Math.floor(s.xp / 2) + s.farm.earned + Object.keys(s.built).length * BUILD_BONUS + s.arcade.earned + plotIncome(s) + quizShells(s) + festShells(s) - s.farm.spent);
}

/** Thức ăn kiếm được từ việc học (nhiệm vụ, phản xạ, nhiệm vụ chat, ôn thẻ). */
export function foodEarned(s: IslandState): number {
  let missions = 0;
  for (const c of Object.values(s.chapters)) for (const m of MISSIONS) if (c[m.key]) missions++;
  const reviews = Object.values(s.words).reduce((a, w) => a + w.seen, 0) + Object.values(s.phrases).reduce((a, p) => a + p.seen, 0);
  return 3 + missions * 2 + s.reflex.length + Object.keys(s.chatTasks).length + Math.floor(reviews / 5);
}

export function food(s: IslandState): number {
  return Math.max(0, foodEarned(s) + libraryFood(s) - s.farm.foodUsed);
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

export function buySeed(kind: FarmKind, idx: number): { ok: true; rare: boolean } | { ok: false; reason: string } {
  const s = load();
  const sp = SPECIES_BY_KIND[kind];
  if (idx < 0 || idx >= s.farm.size) return { ok: false, reason: "Ô ao không hợp lệ." };
  if (activeSlot(s, idx)) return { ok: false, reason: "Ô này đang nuôi rồi." };
  if (islandLevel(s.xp).level < sp.minLevel) return { ok: false, reason: `Cần đảo cấp ${sp.minLevel} để nuôi ${sp.vi}.` };
  if (shells(s) < sp.price) return { ok: false, reason: `Chưa đủ vỏ sò (cần ${sp.price}). Học thêm để kiếm nhé!` };
  const rare = Math.random() < rareChance(streak(s));
  const slot: FarmSlot = { kind, at: new Date().toISOString(), boost: 0 };
  if (rare) slot.rare = true;
  save({ ...s, farm: { ...s.farm, spent: s.farm.spent + sp.price, slots: { ...s.farm.slots, [String(idx)]: slot } } });
  return { ok: true, rare };
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

/** Giá bán một con (con hiếm gấp đôi). */
export function sellPrice(slot: Pick<FarmSlot, "kind" | "rare">): number {
  return SPECIES_BY_KIND[slot.kind].sell * (slot.rare ? RARE_SELL : 1);
}

export function harvestSlot(idx: number): { ok: true; earned: number; kind: FarmKind; rare: boolean; done: string } | { ok: false; reason: string } {
  const s = load();
  const sl = activeSlot(s, idx);
  if (!sl) return { ok: false, reason: "Ô này đang trống." };
  if (growth(sl).pct < 1) return { ok: false, reason: "Chưa lớn, chờ thêm chút nhé." };
  const earned = sellPrice(sl);
  const done = new Date().toISOString();
  const key = sl.rare ? `${sl.kind}-rare` : sl.kind;
  save(markStudy({ ...s, farm: { ...s.farm, earned: s.farm.earned + earned, caught: { ...s.farm.caught, [key]: (s.farm.caught[key] || 0) + 1 }, slots: { ...s.farm.slots, [String(idx)]: { ...sl, done } } } }));
  return { ok: true, earned, kind: sl.kind, rare: !!sl.rare, done };
}

/** Bán mẻ vừa vớt cho khách ở chợ: thưởng thêm theo tỉ lệ (mỗi mẻ một lần). Trả về số vỏ sò thưởng. */
export function tipCustomer(idx: number, done: string, rate: number): number {
  const s = load();
  const sl = s.farm.slots[String(idx)];
  if (!sl || sl.done !== done || sl.tipped || rate <= 0) return 0;
  const tip = Math.round(sellPrice(sl) * Math.min(0.5, rate));
  save({ ...s, farm: { ...s.farm, earned: s.farm.earned + tip, slots: { ...s.farm.slots, [String(idx)]: { ...sl, tipped: true } } } });
  return tip;
}

export function expandPond(): FarmResult {
  const s = load();
  const cost = EXPAND_COST[s.farm.size];
  if (!cost) return { ok: false, reason: "Ao đã rộng tối đa." };
  if (shells(s) < cost) return { ok: false, reason: `Cần ${cost} vỏ sò để mở rộng ao.` };
  save({ ...s, farm: { ...s.farm, spent: s.farm.spent + cost, size: s.farm.size + 3 } });
  return { ok: true };
}

// ───────────── Sổ sưu tập ─────────────

export type DexGroup = "sea" | "plant" | "story" | "build";
export const DEX_MILESTONES = [
  { n: 5, reward: 40 },
  { n: 10, reward: 60 },
  { n: 20, reward: 100 },
  { n: 30, reward: 150 },
  { n: 40, reward: 200 },
];

/** Những gì đã sưu tập được: hải sản đã vớt, cây đã thu hoạch, truyện bạn bè đã mở, công trình đã xây. */
export function collection(s: IslandState) {
  const sea: Record<string, boolean> = {};
  for (const k of ["shrimp", "crab", "lobster"] as FarmKind[]) {
    sea[k] = (s.farm.caught[k] || 0) > 0;
    sea[`${k}-rare`] = (s.farm.caught[`${k}-rare`] || 0) > 0;
  }
  const plant: Record<string, boolean> = {};
  for (const c of CHAPTERS) plant[String(c.id)] = !!s.garden[String(c.id)];
  const story: Record<string, boolean> = {};
  for (const [npc, list] of Object.entries(NPC_STORIES)) {
    const h = friendship(s, npc as NpcId).hearts;
    (list || []).forEach((_, i) => (story[`${npc}:${i}`] = i < h));
  }
  const lv = islandLevel(s.xp).level;
  const build: Record<string, boolean> = {};
  for (const b of BUILDS) build[b.id] = lv >= b.lv;
  const groups = { sea, plant, story, build };
  let have = 0;
  let total = 0;
  for (const g of Object.values(groups))
    for (const v of Object.values(g)) {
      total++;
      if (v) have++;
    }
  const next = DEX_MILESTONES[s.farm.dexClaimed] ?? null;
  return { groups, have, total, next, claimable: !!next && have >= next.n };
}

/** Nhận thưởng mốc sưu tập kế tiếp. */
export function claimDex(): { ok: true; reward: number } | { ok: false; reason: string } {
  const s = load();
  const c = collection(s);
  if (!c.next) return { ok: false, reason: "Đã nhận hết các mốc thưởng." };
  if (!c.claimable) return { ok: false, reason: `Cần ${c.next.n} món để nhận thưởng.` };
  save({ ...s, farm: { ...s.farm, earned: s.farm.earned + c.next.reward, dexClaimed: s.farm.dexClaimed + 1 } });
  return { ok: true, reward: c.next.reward };
}

// ───────────── Vườn Nhiệm Vụ: mỗi chương một luống, mỗi nhiệm vụ cây lớn thêm ─────────────

export const GARDEN_BONUS = 30;

/** Thu hoạch luống của chương (đủ 7/7 nhiệm vụ): +30 vỏ sò, mỗi luống một lần. */
export function harvestPlot(chapterId: number): FarmResult {
  const s = load();
  if (s.garden[String(chapterId)]) return { ok: false, reason: "Luống này đã thu hoạch rồi." };
  if (missionsDone(s, chapterId) < MISSIONS.length) return { ok: false, reason: `Cần xong đủ ${MISSIONS.length} nhiệm vụ của tuần.` };
  save(markStudy({ ...s, garden: { ...s.garden, [String(chapterId)]: new Date().toISOString() }, farm: { ...s.farm, earned: s.farm.earned + GARDEN_BONUS } }));
  return { ok: true };
}

// ───────────── Đảo Cát Vui: mini game + ô đất ─────────────

/** Kết thúc một ván mini game: lưu kỷ lục, đổi điểm ra vỏ sò (có trần mỗi ngày). */
export function arcadeReward(game: string, score: number): { shells: number; best: boolean; capped: boolean } {
  const s = load();
  const g = ARCADE.find((x) => x.id === game);
  if (!g) return { shells: 0, best: false, capped: false };
  const t = today();
  const used = s.arcade.day === t ? s.arcade.today : 0;
  const cap = arcadeCap(s);
  const raw = Math.floor(Math.max(0, score) / g.per);
  const give = Math.max(0, Math.min(raw, cap - used));
  const prevBest = s.arcade.best[game] || 0;
  const best = score > prevBest;
  save({ ...s, arcade: { earned: s.arcade.earned + give, day: t, today: used + give, best: best ? { ...s.arcade.best, [game]: Math.round(score) } : s.arcade.best } });
  return { shells: give, best, capped: raw > give };
}

export function clearPlot(id: string): FarmResult {
  const s = load();
  const spec = PLOTS.find((p) => p.id === id);
  if (!spec) return { ok: false, reason: "Ô đất không hợp lệ." };
  if (plotStatus(s, islandLevel(s.xp).level, id) !== "wild") return { ok: false, reason: "Ô này không cần khai hoang." };
  if (shells(s) < spec.clear) return { ok: false, reason: `Cần ${spec.clear} vỏ sò để khai hoang.` };
  save({ ...s, farm: { ...s.farm, spent: s.farm.spent + spec.clear }, plots: { ...s.plots, [id]: { lv: 0, at: "", bank: 0, cleared: true } } });
  return { ok: true };
}

export function buildPlot(id: string, type: string): FarmResult {
  const s = load();
  const k = buildKind(type);
  if (!k) return { ok: false, reason: "Công trình không hợp lệ." };
  if (plotStatus(s, islandLevel(s.xp).level, id) !== "empty") return { ok: false, reason: "Ô này chưa xây được." };
  if (shells(s) < k.cost) return { ok: false, reason: `Cần ${k.cost} vỏ sò để xây ${k.name.toLowerCase()}.` };
  const prev = s.plots[id];
  save({ ...s, farm: { ...s.farm, spent: s.farm.spent + k.cost }, plots: { ...s.plots, [id]: { t: k.id, lv: 1, at: new Date().toISOString(), bank: 0, ...(prev?.cleared ? { cleared: true } : {}) } } });
  return { ok: true };
}

export function upgradePlot(id: string): FarmResult {
  const s = load();
  const p = s.plots[id];
  const k = buildKind(p?.t);
  if (!p || !k) return { ok: false, reason: "Ô này chưa có công trình." };
  if (p.lv >= 3) return { ok: false, reason: "Đã nâng cấp tối đa." };
  const cost = upgradeCost(k, p.lv + 1);
  if (shells(s) < cost) return { ok: false, reason: `Cần ${cost} vỏ sò để nâng cấp.` };
  // Chốt thu nhập (và thức ăn) của bậc cũ tới hết hôm nay; bậc mới tính từ ngày mai (không đếm trùng hôm nay).
  const one = { ...s, plots: { [id]: p } };
  const bank = plotIncome(one);
  const food = k.id === "library" ? libraryFood(one) : p.food;
  save({ ...s, farm: { ...s.farm, spent: s.farm.spent + cost }, plots: { ...s.plots, [id]: { ...p, lv: p.lv + 1, at: `${addDays(today(), 1)}T00:00:00`, bank, ...(food ? { food } : {}) } } });
  return { ok: true };
}

// ───────────── Câu đố của Thuyền trưởng Rái ─────────────

/** Lưu kết quả câu đố hôm nay (giữ lần tốt nhất). Trả về true nếu lần này vừa được mảnh bản đồ. */
export function finishQuiz(score: number): { gotPiece: boolean; shells: number } {
  const s = load();
  const t = today();
  const prev = s.quiz.days[t] || 0;
  const next = Math.max(prev, Math.max(0, Math.min(5, Math.round(score))));
  save(markStudy({ ...s, quiz: { ...s.quiz, days: { ...s.quiz.days, [t]: next } } }));
  return { gotPiece: prev < 4 && next >= 4, shells: (next - prev) * 3 };
}

export function openTreasure(): FarmResult {
  const s = load();
  if (quizPieces(s).have < PIECES_PER_CHEST) return { ok: false, reason: `Cần đủ ${PIECES_PER_CHEST} mảnh bản đồ.` };
  save({ ...s, quiz: { ...s.quiz, chests: s.quiz.chests + 1 } });
  return { ok: true };
}

// ───────────── Kiểm tra nói định kỳ ─────────────

export function saveCheck(rec: CheckRecord) {
  update((s) => markStudy({ ...s, checks: [...s.checks.filter((c) => c.at !== rec.at), rec].slice(-24), xp: s.xp + 40 }));
}

/** Trước khi đăng xuất: đẩy nốt phần tiến độ chưa lưu lên máy chủ (để không mất). */
export async function flushIsland(): Promise<void> {
  if (typeof window === "undefined" || !currentUid() || !dirty) return;
  try {
    await pushNow();
  } catch {
    /* mất mạng: tiến độ vẫn nằm trong máy cho tới lần đăng nhập sau */
  }
}

// ───────────── Bạn bè, lễ hội, trang trí ─────────────

/** Ghi nhớ đảo bạn bè vừa ghé (hiện trên bản đồ biển). */
export function addFriend(code: string, name: string) {
  const s = load();
  if (!/^[A-Z0-9]{6,10}$/.test(code) || code === s.shareCode) return;
  const at = new Date().toISOString();
  save({ ...s, friends: [...s.friends.filter((f) => f.code !== code), { code, name: cleanField(name, 30) || "Bạn", at }].slice(-12) });
}

export function festShells(s: IslandState): number {
  return Object.values(s.fest).reduce((n, f) => n + (f.words ? FEST_BONUS : 0) + (f.speak ? FEST_BONUS : 0), 0);
}

/** Xong một phần của mùa lễ (học từ / nói lời chúc). Trả về true nếu lần đầu xong phần đó. */
export function festDone(key: string, part: "words" | "speak"): boolean {
  const s = load();
  if (s.fest[key]?.[part]) return false;
  save(markStudy({ ...s, xp: s.xp + 20, fest: { ...s.fest, [key]: { ...s.fest[key], [part]: new Date().toISOString() } } }));
  return true;
}

export function placeDecor(slot: string, item: string): FarmResult {
  const s = load();
  const it = decorItem(item);
  if (!it || !/^d\d$/.test(slot)) return { ok: false, reason: "Món này không hợp lệ." };
  if (islandLevel(s.xp).level < MINE_LEVEL) return { ok: false, reason: `Đảo trang trí mở ở cấp đảo ${MINE_LEVEL}.` };
  if (s.decor[slot] === item) return { ok: true };
  if (shells(s) < it.cost) return { ok: false, reason: `Cần ${it.cost} vỏ sò.` };
  save({ ...s, farm: { ...s.farm, spent: s.farm.spent + it.cost }, decor: { ...s.decor, [slot]: item } });
  return { ok: true };
}

export function clearDecor(slot: string) {
  update((s) => {
    const decor = { ...s.decor };
    delete decor[slot];
    return { ...s, decor };
  });
}
