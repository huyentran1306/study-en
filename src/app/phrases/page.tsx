"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Loader2, CheckCircle2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGame } from "@/contexts/game-context";
import Link from "next/link";

const PHRASE_CATEGORIES = [
  {
    id: "greeting",
    emoji: "👋",
    label: "Chào hỏi",
    gradient: "from-kawaii-sky to-blue-400",
    phrases: [
      { en: "How's it going?", vn: "Dạo này thế nào?" },
      { en: "What's up?", vn: "Có gì mới không?" },
      { en: "Long time no see!", vn: "Lâu quá không gặp!" },
      { en: "Good to see you again!", vn: "Vui được gặp lại bạn!" },
      { en: "How have you been?", vn: "Bạn dạo này ra sao?" },
      { en: "Nice to meet you!", vn: "Rất vui được gặp bạn!" },
      { en: "I've heard a lot about you.", vn: "Tôi nghe nói nhiều về bạn." },
      { en: "Make yourself at home.", vn: "Cứ tự nhiên như ở nhà mình." },
    ],
  },
  {
    id: "agreeing",
    emoji: "👍",
    label: "Đồng ý",
    gradient: "from-kawaii-mint to-green-400",
    phrases: [
      { en: "Absolutely!", vn: "Hoàn toàn đồng ý!" },
      { en: "That makes total sense.", vn: "Điều đó hoàn toàn có lý." },
      { en: "I couldn't agree more.", vn: "Tôi hoàn toàn đồng ý." },
      { en: "You're right about that.", vn: "Bạn đúng về điều đó." },
      { en: "Exactly my thoughts!", vn: "Đúng là điều tôi nghĩ!" },
      { en: "That's a good point.", vn: "Đó là một điểm hay." },
      { en: "Fair enough.", vn: "Khá hợp lý." },
      { en: "I'm with you on this.", vn: "Tôi đồng quan điểm với bạn." },
    ],
  },
  {
    id: "disagreeing",
    emoji: "🤔",
    label: "Không đồng ý",
    gradient: "from-kawaii-pink to-rose-400",
    phrases: [
      { en: "I see your point, but...", vn: "Tôi hiểu ý bạn, nhưng..." },
      { en: "I'm not so sure about that.", vn: "Tôi không chắc về điều đó." },
      { en: "With all due respect...", vn: "Với tất cả sự tôn trọng..." },
      { en: "I beg to differ.", vn: "Tôi không đồng ý." },
      { en: "That's one way to look at it.", vn: "Đó là một cách nhìn nhận." },
      { en: "I have a different perspective.", vn: "Tôi có quan điểm khác." },
      { en: "I'm afraid I disagree.", vn: "Tôi e rằng tôi không đồng ý." },
      { en: "Actually, I think...", vn: "Thực ra, tôi nghĩ..." },
    ],
  },
  {
    id: "asking_help",
    emoji: "🙋",
    label: "Nhờ giúp đỡ",
    gradient: "from-kawaii-yellow to-amber-400",
    phrases: [
      { en: "Could you do me a favor?", vn: "Bạn có thể giúp tôi một việc không?" },
      { en: "Would you mind...?", vn: "Bạn có phiền... không?" },
      { en: "Could you help me out?", vn: "Bạn có thể giúp tôi không?" },
      { en: "Do you have a minute?", vn: "Bạn có một phút không?" },
      { en: "Sorry to bother you, but...", vn: "Xin lỗi đã làm phiền, nhưng..." },
      { en: "I was wondering if you could...", vn: "Tôi không biết bạn có thể... không?" },
      { en: "Is it possible to...?", vn: "Có thể... không?" },
      { en: "I could use some help.", vn: "Tôi cần một chút giúp đỡ." },
    ],
  },
  {
    id: "small_talk",
    emoji: "💬",
    label: "Small Talk",
    gradient: "from-kawaii-purple to-violet-400",
    phrases: [
      { en: "What do you do for fun?", vn: "Bạn thường làm gì cho vui?" },
      { en: "How's your day going?", vn: "Ngày hôm nay của bạn thế nào?" },
      { en: "Have any plans for the weekend?", vn: "Cuối tuần có kế hoạch gì không?" },
      { en: "The weather's been crazy lately.", vn: "Thời tiết dạo này thật kỳ lạ." },
      { en: "Did you catch the game last night?", vn: "Bạn có xem trận đấu tối qua không?" },
      { en: "I've been so busy lately.", vn: "Tôi bận rộn lắm dạo này." },
      { en: "Any good recommendations?", vn: "Có gợi ý hay nào không?" },
      { en: "What have you been up to?", vn: "Gần đây bạn làm gì vậy?" },
    ],
  },
  {
    id: "workplace",
    emoji: "💼",
    label: "Công sở",
    gradient: "from-blue-400 to-indigo-500",
    phrases: [
      { en: "Let's circle back on this.", vn: "Hãy quay lại chủ đề này sau." },
      { en: "Can we get on a call?", vn: "Chúng ta có thể gọi điện không?" },
      { en: "I'll follow up on that.", vn: "Tôi sẽ theo dõi vấn đề đó." },
      { en: "That's outside my bandwidth.", vn: "Điều đó nằm ngoài khả năng của tôi." },
      { en: "Let me get back to you on that.", vn: "Để tôi phản hồi bạn sau nhé." },
      { en: "We're on the same page.", vn: "Chúng ta đang hiểu nhau rồi." },
      { en: "What's the deadline for this?", vn: "Deadline cho việc này là khi nào?" },
      { en: "I'll keep you posted.", vn: "Tôi sẽ cập nhật cho bạn." },
    ],
  },
  {
    id: "phone_calls",
    emoji: "📞",
    label: "Điện thoại",
    gradient: "from-emerald-400 to-teal-500",
    phrases: [
      { en: "Is this a good time to talk?", vn: "Bây giờ có tiện nói chuyện không?" },
      { en: "I'll put you on hold for a moment.", vn: "Để tôi giữ máy một lúc." },
      { en: "Sorry, you're breaking up.", vn: "Xin lỗi, bạn nghe không rõ." },
      { en: "Could you speak up a bit?", vn: "Bạn có thể nói to hơn một chút không?" },
      { en: "I'll transfer you to...", vn: "Tôi sẽ chuyển máy cho..." },
      { en: "Can I take a message?", vn: "Tôi có thể nhắn lại không?" },
      { en: "I'll call you right back.", vn: "Tôi sẽ gọi lại ngay." },
      { en: "I'm losing signal.", vn: "Tôi đang mất sóng." },
    ],
  },
  {
    id: "transitions",
    emoji: "🔄",
    label: "Chuyển chủ đề",
    gradient: "from-orange-400 to-pink-400",
    phrases: [
      { en: "By the way...", vn: "Nhân tiện..." },
      { en: "Speaking of which...", vn: "Nói về điều đó..." },
      { en: "That reminds me...", vn: "Điều đó nhắc tôi nhớ..." },
      { en: "On a different note...", vn: "Chuyển sang chủ đề khác..." },
      { en: "Anyway...", vn: "Dù sao đi nữa..." },
      { en: "Getting back to the main point...", vn: "Quay lại điểm chính..." },
      { en: "While we're on the topic...", vn: "Khi đang nói về chủ đề này..." },
      { en: "Before I forget...", vn: "Trước khi tôi quên..." },
    ],
  },
];

export default function PhrasesPage() {
  const { addXP, addCoins } = useGame();
  const [selectedCat, setSelectedCat] = useState(PHRASE_CATEGORIES[0].id);
  const [ttsLoading, setTtsLoading] = useState<string | null>(null);
  const [practiced, setPracticed] = useState<Set<string>>(new Set());
  const [quizMode, setQuizMode] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const category = PHRASE_CATEGORIES.find((c) => c.id === selectedCat)!;

  const playTTS = async (phrase: string) => {
    setTtsLoading(phrase);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: phrase, lang: "en" }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(url);
      audioRef.current.play();
    } catch (e) {
      console.error(e);
    } finally {
      setTtsLoading(null);
    }
  };

  const markPracticed = (phrase: string) => {
    if (!practiced.has(phrase)) {
      setPracticed((prev) => new Set([...prev, phrase]));
      addXP(3);
      if (practiced.size % 5 === 4) addCoins(10);
    }
  };

  const quizPhrase = category.phrases[quizIndex % category.phrases.length];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">← Quay lại</Link>
      <h1 className="text-2xl font-bold mb-1">
        <span className="bg-gradient-kawaii bg-clip-text text-transparent">💬 Phrases Bank</span>
      </h1>
      <p className="text-muted-foreground text-sm mb-4">
        Hơn 500+ câu giao tiếp thực tế — nghe phát âm chuẩn và luyện tập ngay
      </p>

      {/* Stats */}
      <div className="flex gap-3 mb-5">
        <Badge variant="outline" className="rounded-full gap-1">
          <Star className="w-3 h-3" /> {practiced.size} đã luyện
        </Badge>
        <Badge variant="outline" className="rounded-full">+3 XP mỗi phrase</Badge>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {PHRASE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setSelectedCat(cat.id); setQuizMode(false); setQuizIndex(0); setShowAnswer(false); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all ${
              selectedCat === cat.id
                ? `bg-gradient-to-r ${cat.gradient} text-white shadow-md`
                : "bg-white/60 dark:bg-gray-800/60 text-muted-foreground hover:text-foreground border border-gray-200/50"
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Mode toggle */}
      <div className="flex gap-3 mb-5">
        <button
          onClick={() => setQuizMode(false)}
          className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all ${!quizMode ? "bg-kawaii-purple text-white" : "bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 text-muted-foreground"}`}
        >
          📖 Học
        </button>
        <button
          onClick={() => { setQuizMode(true); setQuizIndex(0); setShowAnswer(false); }}
          className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all ${quizMode ? "bg-kawaii-pink text-white" : "bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 text-muted-foreground"}`}
        >
          🎯 Quiz
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!quizMode ? (
          <motion.div key="learn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3">
            {category.phrases.map((phrase, i) => (
              <motion.div
                key={phrase.en}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center justify-between bg-white/60 dark:bg-gray-800/60 backdrop-blur rounded-2xl px-5 py-4 border transition-all ${
                  practiced.has(phrase.en) ? "border-green-300/50 bg-green-50/40" : "border-gray-200/40"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{phrase.en}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{phrase.vn}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  {practiced.has(phrase.en) && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  <button
                    onClick={async () => { await playTTS(phrase.en); markPracticed(phrase.en); }}
                    className="p-2 rounded-xl hover:bg-kawaii-sky/20 transition-colors"
                  >
                    {ttsLoading === phrase.en
                      ? <Loader2 className="w-5 h-5 animate-spin text-kawaii-sky" />
                      : <Volume2 className="w-5 h-5 text-kawaii-sky" />
                    }
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur rounded-3xl p-8 border border-kawaii-purple/20 shadow-sm text-center">
              <p className="text-xs text-muted-foreground mb-2">{quizIndex + 1} / {category.phrases.length}</p>
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-r ${category.gradient} text-white text-3xl mb-4`}>
                {category.emoji}
              </div>
              <p className="text-lg font-bold mb-2">{quizPhrase.vn}</p>
              <p className="text-sm text-muted-foreground mb-6">Câu tiếng Anh là gì?</p>

              {!showAnswer ? (
                <button
                  onClick={() => { setShowAnswer(true); playTTS(quizPhrase.en); markPracticed(quizPhrase.en); }}
                  className="w-full py-3 bg-gradient-kawaii text-white font-bold rounded-2xl"
                >
                  Xem đáp án & Nghe
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-200/40">
                    <p className="font-bold text-green-700 dark:text-green-300">{quizPhrase.en}</p>
                  </div>
                  <button
                    onClick={() => { setQuizIndex((i) => i + 1); setShowAnswer(false); }}
                    className="w-full py-3 bg-gradient-kawaii text-white font-bold rounded-2xl"
                  >
                    Tiếp theo →
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
