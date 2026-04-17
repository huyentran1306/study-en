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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { VocabWord, SAMPLE_VOCABULARY } from "@/lib/data";
import { Mascot } from "@/components/mascot";
import { useGame } from "@/contexts/game-context";

const CARD_GRADIENTS = [
  "from-kawaii-purple to-violet-400",
  "from-kawaii-sky to-blue-400",
  "from-kawaii-pink to-rose-400",
  "from-kawaii-mint to-emerald-400",
  "from-kawaii-yellow to-amber-400",
];

export default function VocabPage() {
  const [words, setWords] = useLocalStorage<VocabWord[]>("vocabulary", SAMPLE_VOCABULARY);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newWord, setNewWord] = useState({ word: "", meaning: "", example: "", phonetic: "", emoji: "" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mascotMood, setMascotMood] = useState<"happy" | "excited" | "thinking">("happy");
  const { addXP, addCoins } = useGame();

  const learnedCount = words.filter((w) => w.learned).length;
  const progress = words.length > 0 ? (learnedCount / words.length) * 100 : 0;

  const filteredWords = words.filter(
    (w) =>
      w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.meaning.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentWord = words[currentIndex % words.length];
  const cardGradient = CARD_GRADIENTS[currentIndex % CARD_GRADIENTS.length];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    setMascotMood("thinking");
    setTimeout(() => setMascotMood("happy"), 1000);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev + 1) % words.length), 100);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev - 1 + words.length) % words.length), 100);
  };

  const toggleLearned = (id: string) => {
    const word = words.find((w) => w.id === id);
    if (word && !word.learned) {
      addXP(10);
      addCoins(5);
      setMascotMood("excited");
      setTimeout(() => setMascotMood("happy"), 2000);
    }
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
    addXP(5);
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
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Mascot mood={mascotMood} size="md" />
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span className="bg-gradient-kawaii bg-clip-text text-transparent">
                  📚 Vocabulary Builder
                </span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Learn words with cute flashcards! ✨
              </p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="gap-2 rounded-2xl bg-gradient-kawaii text-white shadow-kawaii">
                    <Plus className="h-4 w-4" />
                    Add Word
                  </Button>
                </motion.div>
              }
            />
            <DialogContent className="rounded-3xl border-kawaii-purple/20">
              <DialogHeader>
                <DialogTitle className="text-xl">✨ Add New Word</DialogTitle>
                <DialogDescription>
                  Add a new vocabulary word with an emoji!
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="🌟"
                    value={newWord.emoji}
                    onChange={(e) => setNewWord({ ...newWord, emoji: e.target.value })}
                    className="w-20 text-center text-2xl rounded-2xl"
                  />
                  <Input
                    placeholder="Word"
                    value={newWord.word}
                    onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                    className="flex-1 rounded-2xl"
                  />
                </div>
                <Input
                  placeholder="Phonetic (optional)"
                  value={newWord.phonetic}
                  onChange={(e) => setNewWord({ ...newWord, phonetic: e.target.value })}
                  className="rounded-2xl"
                />
                <Textarea
                  placeholder="Meaning"
                  value={newWord.meaning}
                  onChange={(e) => setNewWord({ ...newWord, meaning: e.target.value })}
                  className="rounded-2xl"
                />
                <Textarea
                  placeholder="Example sentence"
                  value={newWord.example}
                  onChange={(e) => setNewWord({ ...newWord, example: e.target.value })}
                  className="rounded-2xl"
                />
                <Button onClick={addWord} className="w-full rounded-2xl bg-gradient-kawaii text-white">
                  Add Word 🎉
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Progress Bar */}
        <div className="rounded-3xl bg-white/70 dark:bg-gray-800/70 backdrop-blur p-5 shadow-kawaii">
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="font-medium flex items-center gap-1.5">
              🎓 Learning Progress
            </span>
            <span className="font-bold text-kawaii-purple">
              {learnedCount}/{words.length} mastered
            </span>
          </div>
          <div className="h-4 w-full rounded-full bg-kawaii-purple/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-kawaii"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="flashcards" className="w-full">
          <TabsList className="w-full rounded-2xl bg-white/70 dark:bg-gray-800/70 p-1">
            <TabsTrigger value="flashcards" className="flex-1 rounded-xl data-[state=active]:bg-gradient-kawaii data-[state=active]:text-white">
              🎴 Flashcards
            </TabsTrigger>
            <TabsTrigger value="list" className="flex-1 rounded-xl data-[state=active]:bg-gradient-kawaii data-[state=active]:text-white">
              📋 Word List
            </TabsTrigger>
          </TabsList>

          {/* Flashcards Tab */}
          <TabsContent value="flashcards" className="mt-6">
            {words.length > 0 ? (
              <div className="flex flex-col items-center gap-6">
                {/* Flashcard */}
                <div 
                  className="relative w-full max-w-md aspect-[4/3] cursor-pointer perspective-1000"
                  onClick={handleFlip}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${currentIndex}-${isFlipped}`}
                      initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${cardGradient} p-6 flex flex-col items-center justify-center text-white shadow-kawaii-lg`}
                    >
                      {!isFlipped ? (
                        <>
                          <span className="text-6xl mb-4">{currentWord?.emoji || "📝"}</span>
                          <h2 className="text-3xl font-bold text-center">{currentWord?.word}</h2>
                          {currentWord?.phonetic && (
                            <p className="text-white/80 mt-2">{currentWord.phonetic}</p>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="mt-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              speakWord(currentWord?.word || "");
                            }}
                          >
                            <Volume2 className="h-6 w-6" />
                          </Button>
                          <p className="text-white/60 text-sm mt-4">Tap to flip ✨</p>
                        </>
                      ) : (
                        <>
                          <p className="text-xl font-medium text-center mb-4">{currentWord?.meaning}</p>
                          {currentWord?.example && (
                            <p className="text-white/80 text-center italic text-sm">
                              &ldquo;{currentWord.example}&rdquo;
                            </p>
                          )}
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-4">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePrev}
                      className="h-12 w-12 rounded-full border-2 border-kawaii-purple/30"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                  </motion.div>
                  
                  <span className="text-lg font-medium text-muted-foreground">
                    {currentIndex + 1} / {words.length}
                  </span>
                  
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleNext}
                      className="h-12 w-12 rounded-full border-2 border-kawaii-purple/30"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </motion.div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => currentWord && toggleLearned(currentWord.id)}
                      className={`gap-2 rounded-2xl ${
                        currentWord?.learned 
                          ? "bg-kawaii-mint text-white" 
                          : "bg-white/70 dark:bg-gray-800/70 text-foreground border-2 border-kawaii-mint/30"
                      }`}
                    >
                      <Check className="h-4 w-4" />
                      {currentWord?.learned ? "Mastered! 🎉" : "Mark as Learned"}
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      onClick={() => setIsFlipped(false)}
                      className="gap-2 rounded-2xl border-2 border-kawaii-purple/30"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </Button>
                  </motion.div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Mascot mood="thinking" size="lg" message="No words yet! Add some! 📚" />
                <p className="text-muted-foreground mt-4">Start building your vocabulary!</p>
              </div>
            )}
          </TabsContent>

          {/* Word List Tab */}
          <TabsContent value="list" className="mt-6">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search words..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-2xl bg-white/70 dark:bg-gray-800/70"
                />
              </div>

              {/* Word Grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredWords.map((word, idx) => (
                  <motion.div
                    key={word.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`rounded-2xl bg-white/70 dark:bg-gray-800/70 p-4 shadow-kawaii border-2 ${
                      word.learned ? "border-kawaii-mint/50" : "border-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{word.emoji || "📝"}</span>
                        <div>
                          <h3 className="font-bold text-lg">{word.word}</h3>
                          <p className="text-sm text-muted-foreground">{word.meaning}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-kawaii-sky/20"
                          onClick={() => speakWord(word.word)}
                        >
                          <Volume2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-full ${word.learned ? "text-kawaii-mint" : ""}`}
                          onClick={() => toggleLearned(word.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-500"
                          onClick={() => deleteWord(word.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {word.example && (
                      <p className="mt-2 text-xs text-muted-foreground italic pl-12">
                        &ldquo;{word.example}&rdquo;
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>

              {filteredWords.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No words found 😅</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
