/**
 * SM-2 Spaced Repetition Algorithm
 * Each card has: interval, repetitions, efactor, nextReview
 */

export interface SRCard {
  id: string;
  word: string;
  meaning: string;
  phonetic?: string;
  emoji?: string;
  example?: string;
  interval: number;       // days until next review
  repetitions: number;    // number of successful reviews
  efactor: number;        // ease factor (starts at 2.5)
  nextReview: string;     // ISO date string
  addedAt: string;
}

/**
 * SM-2 update: quality 0-5 (0-2 = forgot, 3-5 = remembered)
 */
export function sm2Update(card: SRCard, quality: 0 | 1 | 2 | 3 | 4 | 5): SRCard {
  let { interval, repetitions, efactor } = card;

  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * efactor);
    repetitions++;
  } else {
    repetitions = 0;
    interval = 1;
  }

  efactor = Math.max(1.3, efactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    ...card,
    interval,
    repetitions,
    efactor,
    nextReview: nextReview.toISOString().split("T")[0],
  };
}

export function isDue(card: SRCard): boolean {
  const today = new Date().toISOString().split("T")[0];
  return card.nextReview <= today;
}

const SR_KEY = "studyen-sr-cards";

export function getSRCards(): SRCard[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SR_KEY) || "[]");
  } catch { return []; }
}

export function saveSRCards(cards: SRCard[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SR_KEY, JSON.stringify(cards));
}

export function addSRCard(word: { id: string; word: string; meaning: string; phonetic?: string; emoji?: string; example?: string }) {
  const cards = getSRCards();
  if (cards.find(c => c.id === word.id)) return; // already added
  const newCard: SRCard = {
    ...word,
    interval: 1,
    repetitions: 0,
    efactor: 2.5,
    nextReview: new Date().toISOString().split("T")[0],
    addedAt: new Date().toISOString(),
  };
  saveSRCards([...cards, newCard]);
}

export function getDueCards(): SRCard[] {
  return getSRCards().filter(isDue);
}
