"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { VocabWord, SAMPLE_VOCABULARY } from "@/lib/data";
import { getVocab, addVocab, updateVocabProgress, getStoredUserId, ApiVocab } from "@/lib/api";

// Map API vocab → VocabWord format
function mapApiVocab(v: ApiVocab): VocabWord {
  return {
    id: v.id,
    word: v.word,
    meaning: v.meaning,
    example: v.example || "",
    phonetic: v.phonetic || "",
    emoji: v.emoji || "📖",
    category: v.category,
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
export function useApiVocab(language?: string): [VocabWord[], React.Dispatch<React.SetStateAction<VocabWord[]>>] {
  const [words, setWordsLocal] = useState<VocabWord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const prevWordsRef = useRef<VocabWord[]>([]);

  // Load vocab from API on mount (or when language filter changes)
  useEffect(() => {
    setLoaded(false);
    const userId = getStoredUserId();
    getVocab(userId || undefined, { limit: 200, language: language || undefined })
      .then((apiWords) => {
        const mapped = apiWords.map(mapApiVocab);
        setWordsLocal(mapped);
        prevWordsRef.current = mapped;
        setLoaded(true);
      })
      .catch(() => {
        // Fallback to sample vocab if API fails
        setWordsLocal(SAMPLE_VOCABULARY);
        prevWordsRef.current = SAMPLE_VOCABULARY;
        setLoaded(true);
      });
  }, [language]);

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
