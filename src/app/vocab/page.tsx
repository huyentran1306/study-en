"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  RotateCcw,
  Volume2,
  Search,
  BookOpen,
  CheckCircle2,
  Star,
  Layers,
  List,
  LayoutGrid,
  Briefcase,
  Handshake,
  Cpu,
  Megaphone,
  TrendingUp,
  Brain,
  Compass,
  Tag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VocabWord } from "@/lib/data";
import { VOCAB_TOPICS } from "@/lib/vocab-topics";
import { useApiVocab } from "@/hooks/use-api-vocab";
import { useGame } from "@/contexts/game-context";
import { getSRCards, sm2Update, saveSRCards } from "@/lib/spaced-repetition";

// Map icon string to Lucide component
const TOPIC_ICON_MAP = {
  Briefcase,
  Handshake,
  Cpu,
  Megaphone,
  TrendingUp,
  Brain,
  Compass,
};

async function playTTS(text: string): Promise<void> {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang: "en" }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    await audio.play();
    return new Promise<void>((resolve) => {
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
    });
  } catch {
    /* ignore */
  }
}

export default function VocabPage() {
  const { addXP, addCoins, activeStudyLanguage, hskLevel } = useGame();
  const [words, setWords] = useApiVocab(
    activeStudyLanguage,
    activeStudyLanguage === "zh" ? hskLevel : undefined
  );

  // Active view: "cards" | "list" | "flashcards"
  const [viewMode, setViewMode] = useState<"cards" | "list" | "flashcards">("cards");

  // Selected topic filter: "all" | topicId
  const [selectedTopicId, setSelectedTopicId] = useState<string>("all");

  // Selected level filter: "all" | "B1" | "B2" | "C1" | "C2"
  const [selectedLevel, setSelectedLevel] = useState<string>("all");

  // Selected status filter: "all" | "unlearned" | "learned" | "starred"
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Search query
  const [searchQuery, setSearchQuery] = useState("");

  // Starred words set (stored locally)
  const [starredIds, setStarredIds] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("lingua_starred_vocab");
        return saved ? new Set(JSON.parse(saved)) : new Set<string>();
      } catch {
        return new Set<string>();
      }
    }
    return new Set<string>();
  });

  // Flashcard mode state
  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Add custom word dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newWord, setNewWord] = useState<{
    word: string;
    meaning: string;
    example: string;
    phonetic: string;
    topicId: string;
    partOfSpeech: "noun" | "verb" | "adjective" | "adverb" | "phrase";
    level: "B1" | "B2" | "C1" | "C2";
  }>({
    word: "",
    meaning: "",
    example: "",
    phonetic: "",
    topicId: "corporate-strategy",
    partOfSpeech: "noun",
    level: "B2",
  });

  // Toggle star
  const toggleStar = useCallback((id: string) => {
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem("lingua_starred_vocab", JSON.stringify(Array.from(next)));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  // Filtered words list
  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      // Topic match
      if (selectedTopicId !== "all") {
        const matchesTopic =
          w.topicId === selectedTopicId ||
          w.category === selectedTopicId ||
          (w.category && w.category.toLowerCase().includes(selectedTopicId.toLowerCase()));
        if (!matchesTopic) return false;
      }

      // Level match
      if (selectedLevel !== "all" && w.level && w.level !== selectedLevel) {
        return false;
      }

      // Status match
      if (statusFilter === "learned" && !w.learned) return false;
      if (statusFilter === "unlearned" && w.learned) return false;
      if (statusFilter === "starred" && !starredIds.has(w.id)) return false;

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inWord = w.word.toLowerCase().includes(q);
        const inMeaning = w.meaning.toLowerCase().includes(q);
        const inExample = w.example.toLowerCase().includes(q);
        const inCollocations = w.collocations?.some((c) => c.toLowerCase().includes(q));
        if (!inWord && !inMeaning && !inExample && !inCollocations) return false;
      }

      return true;
    });
  }, [words, selectedTopicId, selectedLevel, statusFilter, searchQuery, starredIds]);

  // Flashcards deck
  const currentFlashcard = filteredWords[flashcardIdx % Math.max(1, filteredWords.length)];

  // Statistics
  const totalCount = words.length;
  const learnedCount = words.filter((w) => w.learned).length;
  const starredCount = starredIds.size;
  const progressPercent = totalCount > 0 ? Math.round((learnedCount / totalCount) * 100) : 0;

  // Selected topic object (if any)
  const activeTopicObj = useMemo(() => {
    return VOCAB_TOPICS.find((t) => t.id === selectedTopicId);
  }, [selectedTopicId]);

  // Audio trigger
  const handlePlayWordAudio = useCallback(async (word: string, id: string) => {
    setPlayingAudioId(id);
    await playTTS(word);
    setPlayingAudioId(null);
  }, []);

  // Mark learned toggle
  const toggleLearned = useCallback(
    (id: string) => {
      const target = words.find((w) => w.id === id);
      if (target && !target.learned) {
        addXP(10);
        addCoins(5);
      }
      setWords((prev) =>
        prev.map((w) => (w.id === id ? { ...w, learned: !w.learned } : w))
      );
    },
    [words, addXP, addCoins, setWords]
  );

  // SM-2 Spaced Repetition rating
  const handleSM2Rating = useCallback(
    (quality: 0 | 1 | 2 | 3 | 4 | 5) => {
      if (!currentFlashcard) return;
      const allCards = getSRCards();
      let card = allCards.find((c) => c.id === currentFlashcard.id);
      if (!card) {
        card = {
          id: currentFlashcard.id,
          word: currentFlashcard.word,
          meaning: currentFlashcard.meaning,
          phonetic: currentFlashcard.phonetic,
          emoji: currentFlashcard.emoji,
          example: currentFlashcard.example,
          interval: 1,
          repetitions: 0,
          efactor: 2.5,
          nextReview: new Date().toISOString().split("T")[0],
          addedAt: new Date().toISOString(),
        };
        allCards.push(card);
      }

      const updated = sm2Update(card, quality);
      const idx = allCards.findIndex((c) => c.id === card?.id);
      if (idx >= 0) {
        allCards[idx] = updated;
      }
      saveSRCards(allCards);

      if (quality >= 3) {
        addXP(8);
        if (!currentFlashcard.learned) {
          toggleLearned(currentFlashcard.id);
        }
      }

      // Flip back and advance
      setIsFlipped(false);
      setTimeout(() => {
        setFlashcardIdx((prev) => (prev + 1) % filteredWords.length);
      }, 150);
    },
    [currentFlashcard, filteredWords.length, addXP, toggleLearned]
  );

  // Add custom word submit
  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.word || !newWord.meaning) return;

    const created: VocabWord = {
      id: `custom-${Date.now()}`,
      word: newWord.word.trim(),
      meaning: newWord.meaning.trim(),
      example: newWord.example.trim() || `I regularly use the term '${newWord.word}' in professional communication.`,
      phonetic: newWord.phonetic.trim() || undefined,
      topicId: newWord.topicId,
      category: newWord.topicId,
      partOfSpeech: newWord.partOfSpeech,
      level: newWord.level,
      learned: false,
      createdAt: new Date().toISOString(),
    };

    setWords([created, ...words]);
    setNewWord({
      word: "",
      meaning: "",
      example: "",
      phonetic: "",
      topicId: "corporate-strategy",
      partOfSpeech: "noun",
      level: "B2",
    });
    setDialogOpen(false);
    addXP(15);
  };

  return (
    <div className="mx-auto max-w-7xl px-3.5 py-6 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & TELEMETRY
         ───────────────────────────────────────────────────────────── */}
      <div className="pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-foreground">
            Dashboard
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            Vocabulary Hub
          </span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Executive Vocabulary Hub
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
              Kho từ vựng chuyên sâu phân theo 7 chủ đề thương trường, công nghệ và nghệ thuật giao tiếp lãnh đạo. Thiết kế chuẩn thẻ sang trọng và ôn tập ngắt quãng SM-2.
            </p>
          </div>

          {/* Quick Metrics & Add Word Dialog */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                  Thư Viện
                </span>
                <span className="font-extrabold text-foreground">{totalCount} từ</span>
              </div>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                  Đã Thuộc
                </span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  {learnedCount} ({progressPercent}%)
                </span>
              </div>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                  Gắn Sao
                </span>
                <span className="font-extrabold text-amber-500">{starredCount} từ</span>
              </div>
            </div>

            {/* Add Custom Word Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 h-9">
                  <Plus className="w-4 h-4" />
                  <span>Thêm từ mới</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-foreground">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold">Thêm Từ Vựng Vào Kho Cá Nhân</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Lưu lại những từ vựng đắt giá bạn bắt gặp khi đọc sách, email đối tác hoặc tài liệu công việc.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddWord} className="space-y-3.5 pt-2 text-xs">
                  <div>
                    <label className="font-semibold block mb-1">Từ tiếng Anh (*)</label>
                    <Input
                      placeholder="Ví dụ: Leverage, Articulate..."
                      value={newWord.word}
                      onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold block mb-1">Phiên âm IPA</label>
                      <Input
                        placeholder="/ˈliːvərɪdʒ/"
                        value={newWord.phonetic}
                        onChange={(e) => setNewWord({ ...newWord, phonetic: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Cấp độ CEFR</label>
                      <select
                        value={newWord.level}
                        onChange={(e) => setNewWord({ ...newWord, level: e.target.value as "B1" | "B2" | "C1" | "C2" })}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                      >
                        <option value="B1">B1 (Intermediate)</option>
                        <option value="B2">B2 (Upper-Intermediate)</option>
                        <option value="C1">C1 (Advanced)</option>
                        <option value="C2">C2 (Proficient)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Định nghĩa tiếng Việt (*)</label>
                    <Input
                      placeholder="Ý nghĩa súc tích, văn cảnh sử dụng..."
                      value={newWord.meaning}
                      onChange={(e) => setNewWord({ ...newWord, meaning: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Ví dụ thực tế trong công việc</label>
                    <Textarea
                      placeholder="Câu hoàn chỉnh minh họa cách dùng tự nhiên..."
                      rows={2}
                      value={newWord.example}
                      onChange={(e) => setNewWord({ ...newWord, example: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Chủ đề phân loại</label>
                    <select
                      value={newWord.topicId}
                      onChange={(e) => setNewWord({ ...newWord, topicId: e.target.value })}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                    >
                      {VOCAB_TOPICS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.vietnameseName} ({t.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9">
                    Lưu vào thư viện (+15 XP)
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. TOPIC SELECTOR CHIPS & PROGRESS
         ───────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-indigo-500" />
            Chủ Đề Tuyển Chọn (7 Lĩnh Vực)
          </span>
          {activeTopicObj && (
            <span className="text-indigo-600 dark:text-indigo-400 capitalize">
              Đang xem: {activeTopicObj.vietnameseName}
            </span>
          )}
        </div>

        {/* Scrollable Topic Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedTopicId("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2 flex-shrink-0 ${
              selectedTopicId === "all"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tất cả chủ đề</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              selectedTopicId === "all" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}>
              {words.length}
            </span>
          </button>

          {VOCAB_TOPICS.map((topic) => {
            const Icon = TOPIC_ICON_MAP[topic.iconName] || Briefcase;
            const isSelected = selectedTopicId === topic.id;
            const wordsInTopic = words.filter(
              (w) => w.topicId === topic.id || w.category === topic.id
            );
            const topicLearned = wordsInTopic.filter((w) => w.learned).length;

            return (
              <button
                key={topic.id}
                onClick={() => {
                  setSelectedTopicId(topic.id);
                  setFlashcardIdx(0);
                  setIsFlipped(false);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2 flex-shrink-0 ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{topic.vietnameseName}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  {topicLearned}/{wordsInTopic.length || topic.words.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Topic Hero Banner (If topic selected) */}
        {activeTopicObj && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground text-sm">
                  {activeTopicObj.name}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {activeTopicObj.level}
                </span>
              </div>
              <p className="text-muted-foreground">{activeTopicObj.description}</p>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setViewMode("flashcards");
                setFlashcardIdx(0);
                setIsFlipped(false);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Luyện Flashcard 3D chủ đề này</span>
            </Button>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. SEARCH, FILTERS & VIEW MODE SWITCHER
         ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Tìm theo từ, nghĩa, ví dụ hoặc collocation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-foreground text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Badges & View Switcher */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Level Filter */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <option value="all">Mọi cấp độ (All)</option>
            <option value="B1">Cấp độ B1</option>
            <option value="B2">Cấp độ B2</option>
            <option value="C1">Cấp độ C1</option>
            <option value="C2">Cấp độ C2</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="unlearned">Chưa thuộc</option>
            <option value="learned">Đã thành thạo</option>
            <option value="starred">Đã gắn sao ⭐</option>
          </select>

          {/* View Switcher Toggle (Cards vs List vs Flashcards) */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === "cards"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-foreground"
              }`}
              title="Dạng Thẻ Đẹp"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dạng Thẻ</span>
            </button>

            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === "list"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-foreground"
              }`}
              title="Dạng Danh Sách"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Danh Sách</span>
            </button>

            <button
              onClick={() => {
                setViewMode("flashcards");
                setFlashcardIdx(0);
                setIsFlipped(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === "flashcards"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-foreground"
              }`}
              title="Luyện Flashcard SM-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Flashcard SM-2</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. VIEW MODE 1: CARD GRID VIEW (DẠNG THẺ SANG TRỌNG)
         ───────────────────────────────────────────────────────────── */}
      {viewMode === "cards" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Hiển thị <strong>{filteredWords.length}</strong> từ vựng phù hợp
            </span>
          </div>

          {filteredWords.length === 0 ? (
            <div className="pro-card p-12 text-center space-y-3">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="font-bold text-foreground">Không tìm thấy từ vựng nào</h3>
              <p className="text-xs text-muted-foreground">
                Hãy thử đổi từ khóa tìm kiếm hoặc chọn lại bộ lọc chủ đề.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedTopicId("all");
                  setSelectedLevel("all");
                  setStatusFilter("all");
                }}
                className="text-xs"
              >
                Đặt lại bộ lọc
              </Button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredWords.map((word) => {
                const isStarred = starredIds.has(word.id);
                const isPlaying = playingAudioId === word.id;

                return (
                  <motion.div
                    key={word.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="pro-card p-5 flex flex-col justify-between group hover:border-indigo-500/50 bg-white dark:bg-slate-900/90"
                  >
                    <div className="space-y-3">
                      {/* Top Bar: Word, Badges, Audio & Star */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-black tracking-tight text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {word.word}
                            </h3>
                            {word.level && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                                {word.level}
                              </span>
                            )}
                          </div>
                          {word.phonetic && (
                            <span className="text-xs font-mono text-slate-500">
                              {word.phonetic}
                            </span>
                          )}
                        </div>

                        {/* Audio & Star Action Icons */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handlePlayWordAudio(word.word, word.id)}
                            disabled={isPlaying}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                            title="Nghe phát âm bản xứ"
                          >
                            <Volume2
                              className={`w-4 h-4 ${isPlaying ? "text-indigo-600 animate-pulse" : ""}`}
                            />
                          </button>
                          <button
                            onClick={() => toggleStar(word.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition-colors"
                            title={isStarred ? "Bỏ gắn sao" : "Gắn sao từ này"}
                          >
                            <Star
                              className={`w-4 h-4 ${
                                isStarred
                                  ? "text-amber-500 fill-amber-500"
                                  : "text-slate-400"
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Part of speech & Vietnamese definition */}
                      <div className="space-y-1">
                        {word.partOfSpeech && (
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                            {word.partOfSpeech}
                          </span>
                        )}
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                          {word.meaning}
                        </p>
                      </div>

                      {/* English definition (if available) */}
                      {word.definition && (
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {word.definition}
                        </p>
                      )}

                      {/* Real-world Workplace Example */}
                      {word.example && (
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 italic leading-relaxed">
                          &ldquo;{word.example}&rdquo;
                        </div>
                      )}

                      {/* Common Collocations */}
                      {word.collocations && word.collocations.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            Collocations:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {word.collocations.map((col, cIdx) => (
                              <span
                                key={cIdx}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium font-mono"
                              >
                                {col}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action: Learned Status Toggle */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      <button
                        onClick={() => toggleLearned(word.id)}
                        className={`inline-flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-md transition-colors ${
                          word.learned
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-foreground"
                        }`}
                      >
                        <CheckCircle2
                          className={`w-3.5 h-3.5 ${word.learned ? "text-emerald-600" : ""}`}
                        />
                        <span>{word.learned ? "Đã thuộc" : "Đánh dấu đã thuộc"}</span>
                      </button>

                      {word.contextTip && (
                        <span
                          className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium truncate max-w-[120px]"
                          title={word.contextTip}
                        >
                          💡 Tip dùng
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. VIEW MODE 2: COMPACT LIST VIEW
         ───────────────────────────────────────────────────────────── */}
      {viewMode === "list" && (
        <div className="pro-card overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Từ vựng</th>
                  <th className="px-3 py-3">Phiên âm</th>
                  <th className="px-3 py-3">Loại từ</th>
                  <th className="px-3 py-3">Level</th>
                  <th className="px-4 py-3">Định nghĩa tiếng Việt</th>
                  <th className="px-4 py-3">Ví dụ thực tế</th>
                  <th className="px-3 py-3 text-center">Âm thanh</th>
                  <th className="px-4 py-3 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredWords.map((word) => (
                  <tr
                    key={word.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => toggleStar(word.id)}>
                          <Star
                            className={`w-3.5 h-3.5 ${
                              starredIds.has(word.id)
                                ? "text-amber-500 fill-amber-500"
                                : "text-slate-300 dark:text-slate-700"
                            }`}
                          />
                        </button>
                        <span>{word.word}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-500 whitespace-nowrap">
                      {word.phonetic || "—"}
                    </td>
                    <td className="px-3 py-3 uppercase text-[10px] font-bold text-slate-500 whitespace-nowrap">
                      {word.partOfSpeech || "—"}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {word.level ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                          {word.level}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 min-w-[200px]">
                      {word.meaning}
                    </td>
                    <td className="px-4 py-3 italic text-muted-foreground min-w-[250px]">
                      {word.example || "—"}
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => handlePlayWordAudio(word.word, word.id)}
                        className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => toggleLearned(word.id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                          word.learned
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {word.learned ? "Đã thuộc ✓" : "Chưa thuộc"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. VIEW MODE 3: TOPIC FLASHCARD MODE (3D FLIP & SM-2)
         ───────────────────────────────────────────────────────────── */}
      {viewMode === "flashcards" && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Flashcard Header Controls */}
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-muted-foreground">
              Thẻ {flashcardIdx + 1} / {filteredWords.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsFlipped(false);
                  setFlashcardIdx((prev) =>
                    prev > 0 ? prev - 1 : filteredWords.length - 1
                  );
                }}
                className="h-8 px-2 text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsFlipped(false);
                  setFlashcardIdx((prev) => (prev + 1) % filteredWords.length);
                }}
                className="h-8 px-2 text-xs"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {currentFlashcard ? (
            <div className="space-y-6">
              {/* 3D Perspective Flashcard Container */}
              <div
                className="perspective-1000 min-h-[340px] cursor-pointer select-none"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <motion.div
                  className="relative w-full h-full min-h-[340px] rounded-3xl pro-card border-slate-200 dark:border-slate-800 p-8 flex flex-col justify-between shadow-xl transition-all"
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.4 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* FRONT OF CARD */}
                  {!isFlipped ? (
                    <div className="flex flex-col justify-between h-full space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                          {currentFlashcard.level || "B2"}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayWordAudio(currentFlashcard.word, currentFlashcard.id);
                            }}
                            className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:scale-105 transition-transform"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStar(currentFlashcard.id);
                            }}
                            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-amber-500 flex items-center justify-center"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                starredIds.has(currentFlashcard.id)
                                  ? "text-amber-500 fill-amber-500"
                                  : ""
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="text-center py-6 space-y-2">
                        <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
                          {currentFlashcard.word}
                        </h2>
                        {currentFlashcard.phonetic && (
                          <p className="text-base font-mono text-slate-500">
                            {currentFlashcard.phonetic}
                          </p>
                        )}
                        {currentFlashcard.partOfSpeech && (
                          <span className="inline-block text-xs uppercase font-bold text-slate-400 mt-1">
                            ({currentFlashcard.partOfSpeech})
                          </span>
                        )}
                      </div>

                      <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Chạm để lật thẻ xem nghĩa & ví dụ công sở</span>
                      </div>
                    </div>
                  ) : (
                    /* BACK OF CARD */
                    <div
                      className="flex flex-col justify-between h-full space-y-4"
                      style={{ transform: "rotateY(180deg)" }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Định nghĩa & Ngữ cảnh
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayWordAudio(currentFlashcard.word, currentFlashcard.id);
                          }}
                          className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-xl sm:text-2xl font-black text-foreground">
                          {currentFlashcard.meaning}
                        </h3>

                        {currentFlashcard.definition && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {currentFlashcard.definition}
                          </p>
                        )}

                        {currentFlashcard.example && (
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-100 dark:border-slate-800 text-xs italic text-slate-700 dark:text-slate-300">
                            &ldquo;{currentFlashcard.example}&rdquo;
                          </div>
                        )}

                        {currentFlashcard.collocations && currentFlashcard.collocations.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {currentFlashcard.collocations.map((col, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono"
                              >
                                {col}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="text-center text-[11px] text-muted-foreground">
                        Đánh giá mức độ ghi nhớ theo thuật toán SM-2 bên dưới:
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* SM-2 Spaced Repetition Rating Buttons */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground text-center block">
                  Đánh Giá Thuật Toán Ôn Tập Ngắt Quãng (SM-2)
                </span>
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleSM2Rating(1)}
                    className="h-12 flex flex-col items-center justify-center p-1 border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/50"
                  >
                    <span className="text-xs font-bold text-red-600 dark:text-red-400">
                      Chưa nhớ
                    </span>
                    <span className="text-[10px] text-muted-foreground">&lt; 1 phút</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleSM2Rating(2)}
                    className="h-12 flex flex-col items-center justify-center p-1 border-amber-200 dark:border-amber-900/60 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                  >
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      Khó nhớ
                    </span>
                    <span className="text-[10px] text-muted-foreground">1 ngày</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleSM2Rating(4)}
                    className="h-12 flex flex-col items-center justify-center p-1 border-indigo-200 dark:border-indigo-900/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                  >
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      Nhớ tốt
                    </span>
                    <span className="text-[10px] text-muted-foreground">3 ngày</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleSM2Rating(5)}
                    className="h-12 flex flex-col items-center justify-center p-1 border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                  >
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Rất dễ
                    </span>
                    <span className="text-[10px] text-muted-foreground">7 ngày</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="pro-card p-12 text-center">
              <p className="text-xs text-muted-foreground">Không có từ nào để luyện.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
