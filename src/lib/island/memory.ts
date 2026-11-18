// "Cư dân nhớ bạn": chọn chuyện cũ để cư dân hỏi lại, soạn câu mở đầu.
// File thuần (không "use client") — dùng chung cho trang và kiểm thử.
import type { Memory, PhraseCard } from "./state";

export type { Memory } from "./state";

/** Phải cách ít nhất ngần này mới gọi là "lần trước". */
export const RECALL_MIN_MS = 3 * 3600_000;
/** Chuyện quá cũ thì thôi không hỏi nữa. */
export const RECALL_MAX_MS = 21 * 86400_000;

export function liveMemories(list: Memory[]): Memory[] {
  return list.filter((m) => !m.gone);
}

/** Chuyện chưa hỏi lại, đủ cũ để hỏi. Ưu tiên cư dân đã nghe chuyện; sameOnly=true thì chỉ lấy của cư dân đó. */
export function pickRecall(list: Memory[], npc: string, now = Date.now(), sameOnly = false): Memory | null {
  const ok = liveMemories(list)
    .filter((m) => !m.used)
    .filter((m) => {
      const age = now - Date.parse(m.at);
      return age >= RECALL_MIN_MS && age <= RECALL_MAX_MS;
    })
    .sort((a, b) => (a.at < b.at ? 1 : -1));
  return ok.find((m) => m.npc === npc) || (sameOnly ? null : ok[0] || null);
}

/** Câu mở đầu của cư dân khi hỏi lại chuyện cũ. heardBy = tên cư dân đã nghe (khác người đang nói thì là "nghe kể lại"). */
export function recallOpener(m: Memory, speakerName: string, heardByName: string): string {
  const fact = m.fact.replace(/[.!?\s]+$/, "");
  if (heardByName === speakerName) return `Hey, welcome back! Last time you told me ${fact}. ${m.ask}`;
  return `Hi there! ${heardByName} told me ${fact}. ${m.ask}`;
}

export function recallNoteVi(m: Memory, speakerName: string, heardByName: string): string {
  const vi = m.vi.replace(/[.!?\s]+$/, "");
  return heardByName === speakerName ? `${speakerName} còn nhớ lần trước bạn kể: ${vi}.` : `${heardByName} đã kể với ${speakerName}: ${vi}.`;
}

/** Vài chuyện gần nhất (tiếng Anh) để đưa cho AI làm bối cảnh. */
export function recentFacts(list: Memory[], n = 5): string[] {
  return liveMemories(list)
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, n)
    .map((m) => m.fact);
}

/** Hai lỗi sai để cư dân "gài" lại trong cuộc trò chuyện: ưu tiên thẻ đến hạn, chưa thuộc. */
export function practiceFixes(fixes: PhraseCard[], today: string, n = 2): { said: string; fixed: string }[] {
  return fixes
    .filter((f) => f.said)
    .sort((a, b) => Number(b.due <= today) - Number(a.due <= today) || a.box - b.box || (a.due < b.due ? -1 : 1))
    .slice(0, n)
    .map((f) => ({ said: f.said!, fixed: f.en }));
}

const STOP = new Set("you your were was had have has are is am a an the to of with at in on for and this that just going coming up planning".split(" "));
const words = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9' ]/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w)));

/** Hai chuyện gần như là một (trùng phần lớn từ có nghĩa). */
export function sameFact(a: string, b: string): boolean {
  const x = words(a);
  const y = words(b);
  if (!x.size || !y.size) return a.trim().toLowerCase() === b.trim().toLowerCase();
  let both = 0;
  x.forEach((w) => y.has(w) && both++);
  return both / Math.min(x.size, y.size) >= 0.75;
}

/** Bỏ chuyện trùng với chuyện đã nhớ. */
export function isDuplicate(list: Memory[], fact: string): boolean {
  return liveMemories(list).some((m) => sameFact(m.fact, fact));
}
