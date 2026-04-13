"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Check,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Volume2,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { VocabWord, SAMPLE_VOCABULARY, CATEGORY_COLORS } from "@/lib/data";

const CARD_GRADIENTS = [
  "from-violet-400 via-purple-400 to-fuchsia-400",
  "from-blue-400 via-cyan-400 to-teal-400",
  "from-pink-400 via-rose-400 to-red-300",
  "from-amber-400 via-orange-400 to-yellow-300",
  "from-green-400 via-emerald-400 to-teal-400",
  "from-indigo-400 via-violet-400 to-purple-400",
  "from-rose-400 via-pink-400 to-fuchsia-400",
  "from-sky-400 via-blue-400 to-indigo-400",
];

export default function VocabPage() {
  const [words, setWords] = useLocalStorage<VocabWord[]>("vocabulary", SAMPLE_VOCABULARY);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newWord, setNewWord] = useState({ word: "", meaning: "", example: "", phonetic: "", emoji: "" });
  const [dialogOpen, setDialogOpen] = useState(false);

  const learnedCount = words.filter((w) => w.learned).length;
  const progress = words.length > 0 ? (learnedCount / words.length) * 100 : 0;

  const filteredWords = words.filter(
    (w) =>
      w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.meaning.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentWord = words[currentIndex % words.length];
  const cardGradient = CARD_GRADIENTS[currentIndex % CARD_GRADIENTS.length];

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev + 1) % words.length), 100);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev - 1 + words.length) % words.length), 100);
  };

  const toggleLearned = (id: string) => {
    setWords(words.map((w) => (w.id === id ? { ...w, learned: !w.learned } : w)));
  };

  const deleteWord = (id: string) => {
    setWords(words.filter((w) => w.id !== id));
    if (currentIndex >= words.length - 1) {
      setCurrentIndex(Math.max(0, words.length - 2));
    }
  };

  const addWord = () => {
    if (!newWord.word.trim() || !newWord.meaning.trim()) return;
    const word: VocabWord = {
      id: Date.now().toString(),
      word: newWord.word.trim(),
      meaning: newWord.meaning.trim(),
      example: newWord.example.trim(),
      phonetic: newWord.phonetic.trim() || undefined,
      emoji: newWord.emoji.trim() || "📝",
      learned: false,
      createdAt: new Date().toISOString(),
    };
    setWords([word, ...words]);
    setNewWord({ word: "", meaning: "", example: "", phonetic: "", emoji: "" });
    setDialogOpen(false);
  };

  const speakWord = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 shadow-md text-2xl">
                📚
              </span>
              Vocabulary Builder
            </h1>
            <p className="mt-1 text-muted-foreground">
              Master new words with cute illustrated flashcards ✨
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button className="gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white shadow-cute">
                  <Plus className="h-4 w-4" />
                  Add Word
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>✨ Add New Word</DialogTitle>
                <DialogDescription>
                  Add a new vocabulary word with an emoji illustration
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Emoji (e.g., 🌟)"
                    value={newWord.emoji}
                    onChange={(e) => setNewWord({ ...newWord, emoji: e.target.value })}
                    className="w-24 text-center text-lg"
                  />
                  <Input
                    placeholder="Word (e.g., Eloquent)"
                    value={newWord.word}
                    onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                    className="flex-1"
                  />
                </div>
                <Input
                  placeholder="Phonetic (e.g., /ˈeləkwənt/)"
                  value={newWord.phonetic}
                  onChange={(e) => setNewWord({ ...newWord, phonetic: e.target.value })}
                />
                <Textarea
                  placeholder="Meaning"
                  value={newWord.meaning}
                  onChange={(e) => setNewWord({ ...newWord, meaning: e.target.value })}
                />
                <Textarea
                  placeholder="Example sentence"
                  value={newWord.example}
                  onChange={(e) => setNewWord({ ...newWord, example: e.target.value })}
                />
                <Button onClick={addWord} className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white">
                  Add Word 🎉
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Progress */}
        <div className="rounded-2xl border border-border/50 bg-card/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="font-medium flex items-center gap-1.5">
              🎓 Learning Progress
            </span>
            <span className="font-bold text-primary">
              {learnedCount}/{words.length} mastered
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {progress === 100 ? "🏆 Amazing! You've mastered all words!" : `Keep going! ${words.length - learnedCount} more to master 💪`}
          </p>
        </div>

        <Tabs defaultValue="flashcards" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl h-12">
            <TabsTrigger value="flashcards" className="rounded-xl gap-2">🃏 Flashcards</TabsTrigger>
            <TabsTrigger value="list" className="rounded-xl gap-2">📋 Word List</TabsTrigger>
          </TabsList>

          {/* Flashcards Tab */}
          <TabsContent value="flashcards" className="space-y-6">
            {words.length > 0 && currentWord ? (
              <>
                <div className="flex items-center justify-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handlePrev}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-border/50 bg-card/80 shadow-sm hover:shadow-md transition-all"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </motion.button>

                  {/* Flashcard */}
                  <div
                    className="perspective-1000 w-full max-w-sm cursor-pointer"
                    onClick={handleFlip}
                  >
                    <motion.div
                      className="relative h-80 w-full"
                      style={{ transformStyle: "preserve-3d" }}
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.6, type: "spring", stiffness: 80 }}
                    >
                      {/* Front - with emoji illustration */}
                      <div
                        className={`absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br ${cardGradient} p-8 shadow-cute-lg text-white`}
                        style={{ backfaceVisibility: "hidden" }}
                      >
                        {/* Word count */}
                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium">
                          {currentIndex + 1} / {words.length}
                        </div>

                        {/* Emoji illustration */}
                        <motion.div
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="text-6xl mb-4 drop-shadow-md"
                        >
                          {currentWord.emoji || "📝"}
                        </motion.div>

                        <h2 className="text-3xl font-extrabold drop-shadow-sm text-center">
                          {currentWord.word}
                        </h2>

                        {currentWord.phonetic && (
                          <p className="mt-2 text-white/80 text-sm font-medium">
                            {currentWord.phonetic}
                          </p>
                        )}

                        {currentWord.category && (
                          <div className="mt-3 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium">
                            {currentWord.category}
                          </div>
                        )}

                        <button
                          className="mt-4 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            speakWord(currentWord.word);
                          }}
                        >
                          <Volume2 className="h-4 w-4" />
                          Listen
                        </button>

                        <p className="absolute bottom-4 text-white/60 text-xs">
                          Tap to reveal meaning ✨
                        </p>
                      </div>

                      {/* Back - meaning */}
                      <div
                        className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-card border-2 border-border/50 p-8 shadow-cute-lg"
                        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                      >
                        <Sparkles className="mb-3 h-6 w-6 text-primary" />
                        <p className="text-center text-lg font-semibold leading-snug">
                          {currentWord.meaning}
                        </p>
                        {currentWord.example && (
                          <>
                            <Separator className="my-4 w-3/4" />
                            <p className="text-center text-sm italic text-muted-foreground leading-relaxed">
                              &ldquo;{currentWord.example}&rdquo;
                            </p>
                          </>
                        )}
                        <p className="absolute bottom-4 text-muted-foreground text-xs">
                          Tap to go back
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleNext}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-border/50 bg-card/80 shadow-sm hover:shadow-md transition-all"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </motion.button>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center gap-3">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      onClick={() => toggleLearned(currentWord.id)}
                      className={`gap-2 rounded-2xl px-6 ${currentWord.learned
                        ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md"
                        : "bg-secondary text-secondary-foreground"}`}
                    >
                      <Check className="h-4 w-4" />
                      {currentWord.learned ? "Mastered! 🏆" : "Mark as Learned"}
                    </Button>
                  </motion.div>
                  <Button variant="ghost" onClick={handleNext} className="gap-2 rounded-2xl">
                    <RotateCcw className="h-4 w-4" />
                    Skip
                  </Button>
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                <div className="text-6xl mb-4">📚</div>
                <p className="font-medium">No vocabulary words yet. Add some to get started!</p>
              </div>
            )}
          </TabsContent>

          {/* Word List Tab */}
          <TabsContent value="list" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search words..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <AnimatePresence>
                {filteredWords.map((word, idx) => (
                  <motion.div
                    key={word.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <div className="rounded-2xl border border-border/50 bg-card/80 hover:shadow-sm transition-all">
                      <CardContent className="flex items-center gap-3 p-4">
                        {/* Emoji illustration */}
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-pink-100 dark:from-violet-900/30 dark:to-pink-900/30 text-2xl">
                          {word.emoji || "📝"}
                        </div>

                        <button
                          className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl hover:bg-secondary transition-colors"
                          onClick={() => speakWord(word.word)}
                        >
                          <Volume2 className="h-4 w-4 text-muted-foreground" />
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold">{word.word}</span>
                            {word.phonetic && (
                              <span className="text-xs text-muted-foreground">
                                {word.phonetic}
                              </span>
                            )}
                            {word.category && (
                              <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${CATEGORY_COLORS[word.category] || "bg-gray-100 text-gray-600"}`}>
                                {word.category}
                              </span>
                            )}
                            {word.learned && (
                              <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 text-xs rounded-full">
                                ✓ Learned
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-0.5">
                            {word.meaning}
                          </p>
                        </div>

                        <div className="flex gap-1 shrink-0">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${word.learned ? "bg-green-500/10 text-green-500" : "hover:bg-secondary text-muted-foreground"}`}
                            onClick={() => toggleLearned(word.id)}
                          >
                            <Check className="h-4 w-4" />
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-colors"
                            onClick={() => deleteWord(word.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </CardContent>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredWords.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                <div className="text-5xl mb-3">🔍</div>
                <p className="text-sm">No words found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
