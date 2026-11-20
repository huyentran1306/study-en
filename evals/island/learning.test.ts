import assert from "node:assert/strict";
import { test } from "node:test";
import { CHAPTERS } from "../../src/lib/island/curriculum";
import { isMeaningfulCorrection } from "../../src/lib/island/feedback";
import {
  addFix,
  completeMission,
  currentChapterId,
  fixCards,
  getIsland,
  isUnlocked,
  reviewSpeakingChunk,
  saveEpisode,
  today,
  todayPlan,
} from "../../src/lib/island/progress";
import { freshState, mergeStates, normalizeState } from "../../src/lib/island/state";
import { includesSpeakingChunk, vocabularyFor, VOCABULARY_COUNT } from "../../src/lib/island/vocabulary";

test("today keeps the completed chapter and chapter 2 needs three keys", () => {
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, "window", { configurable: true, value: {} });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) },
  });
  completeMission(1, "lesson", 70);
  assert.equal(isUnlocked(getIsland(), 2), false);
  assert.equal(currentChapterId(getIsland()), 1);
  completeMission(1, "speak", 0);
  assert.equal(isUnlocked(getIsland(), 2), false);
  completeMission(1, "chat", 0);
  assert.equal(isUnlocked(getIsland(), 2), true);
  assert.equal(currentChapterId(getIsland()), 2);

  const reloaded = normalizeState(JSON.parse(storage.get("cci-progress-v1")!));
  const completed = todayPlan(reloaded)[0];
  assert.ok(completed.done);
  assert.equal(completed.href, "/island/lesson/1");
  assert.match(completed.desc, /^Chương 1/);

  const word = vocabularyFor(1)[0];
  reviewSpeakingChunk(1, word.en, true);
  const firstGrade = getIsland().words[word.en];
  assert.ok(firstGrade.due > today());
  reviewSpeakingChunk(1, word.en, true);
  assert.deepEqual(getIsland().words[word.en], firstGrade);
  reviewSpeakingChunk(1, word.en, false);
  assert.equal(getIsland().words[word.en].due, today());
  assert.equal(todayPlan(getIsland()).find((entry) => entry.key === "review")?.done, true);

  assert.equal(addFix("No whipped cream, please. How much does it cost?", "How much does it cost?", "đã đúng", 2), false);
  assert.equal(addFix("How much it cost?", "How much does it cost?", "Thêm does.", 2, "question"), true);
  assert.equal(fixCards(getIsland()).length, 1);
  assert.equal(saveEpisode("miso-1", "Sea Breeze Café", 15, { reply: "That's a lovely name!" }), true);
  assert.equal(saveEpisode("miso-1", "Other name", 15, { reply: "Sounds good!" }), false);
  assert.equal(normalizeState(getIsland()).episodes["miso-1"].reply, "That's a lovely name!");
});

test("migration keeps placement and completed chapters while correcting accidental chapter grants", () => {
  const prior = { ...freshState(), rulesV: 2, unlockedUpTo: 2, chapters: { 1: { lesson: true } }, daily: { [today()]: ["mission"] } };
  const repaired = normalizeState(prior);
  assert.equal(isUnlocked(repaired, 2), false);
  assert.equal(todayPlan(repaired)[0].title, "Nhiệm vụ đã hoàn thành");
  assert.equal(isUnlocked(normalizeState({ ...prior, chapters: { ...prior.chapters, 2: { lesson: true } } }), 2), true);
  const placed = normalizeState({ ...prior, placement: { level: "A2", score: 85, at: today() } });
  assert.equal(isUnlocked(placed, 5), true);
  const at = "2026-11-19T08:00:00.000Z";
  const legacy = { ...repaired, episodes: { one: { at, answer: "Sea Breeze Café" } } };
  const updated = { ...repaired, episodes: { one: { ...legacy.episodes.one, reply: "Great name!" } } };
  assert.equal(mergeStates(legacy, updated).episodes.one.reply, "Great name!");
  assert.equal(mergeStates(updated, legacy).episodes.one.reply, "Great name!");
});

test("chat ignores unchanged excerpts but saves real corrections", () => {
  assert.equal(isMeaningfulCorrection("No whipped cream, please. How much does it cost?", "How much does it cost?"), false);
  assert.equal(isMeaningfulCorrection("Can I get a latte?", "can I get a latte!"), false);
  assert.equal(isMeaningfulCorrection("Yes please!", "Certainly!", "Câu này đã đúng."), false);
  assert.equal(isMeaningfulCorrection("I want latte to go. How much it cost?", "I want a latte to go. How much does it cost?"), true);
});

test("all 13 situations have unique chunks and examples that pass retrieval", () => {
  const vocabulary = CHAPTERS.flatMap((ch) => {
    const deck = vocabularyFor(ch.id);
    assert.equal(deck.length, 6);
    return deck;
  });
  assert.equal(vocabulary.length, VOCABULARY_COUNT);
  assert.equal(new Set(vocabulary.map((item) => item.en.toLowerCase())).size, VOCABULARY_COUNT);
  for (const item of vocabulary) assert.ok(includesSpeakingChunk(item.ex, item.en), item.en);
  assert.ok(includesSpeakingChunk("I am really into cooking!", "I’m really into"));
  assert.equal(includesSpeakingChunk("How about yourself?", "How about you"), false);
});
