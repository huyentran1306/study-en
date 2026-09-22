"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { VocabWord, SAMPLE_VOCABULARY } from "@/lib/data";
import { getVocab, addVocab, updateVocabProgress, getStoredUserId, ApiVocab } from "@/lib/api";

// Map API vocab → VocabWord format with fallback to enriched metadata
function mapApiVocab(v: ApiVocab): VocabWord {
  const match = SAMPLE_VOCABULARY.find(
    (sw) => sw.id === v.id || sw.word.toLowerCase() === v.word.toLowerCase()
  );
  return {
    id: v.id,
    word: v.word,
    meaning: v.meaning,
    definition: match?.definition,
    example: v.example || match?.example || "",
    phonetic: v.phonetic || match?.phonetic || "",
    emoji: v.emoji || match?.emoji || "📖",
    category: v.category || match?.category || match?.topicId || "general",
    topicId: match?.topicId || (v.category ? v.category : undefined),
    partOfSpeech: match?.partOfSpeech,
    level: match?.level || "B2",
    collocations: match?.collocations,
    contextTip: match?.contextTip,
    starred: match?.starred || false,
    learned: v.status === "known",
    createdAt: v.created_at,
  };
}

// Map VocabWord → status for API
function statusFromWord(w: VocabWord): "known" | "unknown" | "learning" {
  return w.learned ? "known" : "learning";
}

/**
 * Drop-in replacement for useLocalStorage<VocabWord[]>("vocabulary", SAMPLE_VOCABULARY)
 * Returns [words, setWords] with the same interface, but backed by the API.
 */
export function useApiVocab(language?: string, hskLevel?: number): [VocabWord[], React.Dispatch<React.SetStateAction<VocabWord[]>>] {
  const [words, setWordsLocal] = useState<VocabWord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const prevWordsRef = useRef<VocabWord[]>([]);

  // Load vocab from API on mount (or when language/hskLevel filter changes)
  useEffect(() => {
    setLoaded(false);
    const userId = getStoredUserId();
    getVocab(userId || undefined, { limit: 200, language: language || undefined, hsk_level: (language === 'zh' && hskLevel) ? hskLevel : undefined })
      .then((apiWords) => {
        if (!apiWords || apiWords.length === 0) {
          setWordsLocal(SAMPLE_VOCABULARY);
          prevWordsRef.current = SAMPLE_VOCABULARY;
        } else {
          const mapped = apiWords.map(mapApiVocab);
          // Merge in any sample topic words not yet in apiWords so user has full catalog
          const existingWordSet = new Set(mapped.map((w) => w.word.toLowerCase()));
          const missingSamples = SAMPLE_VOCABULARY.filter(
            (sw) => !existingWordSet.has(sw.word.toLowerCase())
          );
          const combined = [...mapped, ...missingSamples];
          setWordsLocal(combined);
          prevWordsRef.current = combined;
        }
        setLoaded(true);
      })
      .catch(() => {
        // Fallback to sample vocab if API fails
        setWordsLocal(SAMPLE_VOCABULARY);
        prevWordsRef.current = SAMPLE_VOCABULARY;
        setLoaded(true);
      });
  }, [language, hskLevel]);

  // Intercept setWords to detect changes and sync to API
  const setWords = useCallback<React.Dispatch<React.SetStateAction<VocabWord[]>>>((updater) => {
    setWordsLocal((prev) => {
      const next = typeof updater === "function" ? (updater as (prev: VocabWord[]) => VocabWord[])(prev) : updater;
      const userId = getStoredUserId();
      if (userId && loaded) {
        syncChangesToApi(prev, next, userId);
      }
      prevWordsRef.current = next;
      return next;
    });
  }, [loaded]);

  return [words, setWords];
}

// Detect changed words and sync status + new words to API
async function syncChangesToApi(prev: VocabWord[], next: VocabWord[], userId: string) {
  try {
    for (const nextWord of next) {
      const prevWord = prev.find((w) => w.id === nextWord.id);
      if (!prevWord) {
        // New word added by user — push to API
        try {
          await addVocab({
            word: nextWord.word,
            meaning: nextWord.meaning,
            example: nextWord.example,
            phonetic: nextWord.phonetic,
            emoji: nextWord.emoji,
            category: nextWord.category || "general",
            created_by: userId,
          });
        } catch {/* word may already exist */}
      } else if (prevWord.learned !== nextWord.learned) {
        // Learned status changed — update progress
        try {
          await updateVocabProgress(userId, nextWord.id, statusFromWord(nextWord));
        } catch {/* noop */}
      }
    }
    // Deletions: words in prev but not in next — we don't delete system words
  } catch {/* silent fail */}
}
