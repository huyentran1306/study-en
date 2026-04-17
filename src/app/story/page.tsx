"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame, useTranslation } from "@/contexts/game-context";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

interface StoryChoice {
  text: string;
  nextScene: number;
  xp: number;
}

interface StoryScene {
  id: number;
  character: string;
  characterEmoji: string;
  dialogue: string;
  dialogueVi: string;
  vocab: string;
  vocabMeaning: string;
  choices: StoryChoice[];
  background: string;
}

const STORIES = [
  {
    id: "cafe",
    title: "☕ The Magic Café",
    titleVi: "☕ Quán cà phê phép thuật",
    emoji: "☕",
    gradient: "from-amber-300 to-orange-400",
    scenes: [
      {
        id: 0,
        character: "Barista Luna",
        characterEmoji: "👩‍🍳",
        dialogue: "Welcome to the Magic Café! Would you like to order something?",
        dialogueVi: "Chào mừng đến Quán Cà Phê Phép Thuật! Bạn muốn gọi gì không?",
        vocab: "Welcome",
        vocabMeaning: "Chào mừng",
        background: "from-amber-100 to-orange-100",
        choices: [
          { text: "Yes, I'd like a coffee, please!", nextScene: 1, xp: 5 },
          { text: "What do you recommend?", nextScene: 2, xp: 10 },
        ],
      },
      {
        id: 1,
        character: "Barista Luna",
        characterEmoji: "👩‍🍳",
        dialogue: "Great choice! Here's your magical latte. It will make you feel energetic!",
        dialogueVi: "Lựa chọn tuyệt vời! Đây là ly latte phép thuật. Nó sẽ khiến bạn cảm thấy tràn đầy năng lượng!",
        vocab: "Energetic",
        vocabMeaning: "Tràn đầy năng lượng",
        background: "from-yellow-100 to-amber-100",
        choices: [
          { text: "Thank you! It smells delicious!", nextScene: 3, xp: 5 },
          { text: "Can I also get a cookie?", nextScene: 4, xp: 10 },
        ],
      },
      {
        id: 2,
        character: "Barista Luna",
        characterEmoji: "👩‍🍳",
        dialogue: "I recommend our special Starlight Smoothie! It's made with enchanted berries.",
        dialogueVi: "Tôi khuyên bạn nên thử Smoothie Ánh Sao đặc biệt! Nó được làm từ quả mọng phép thuật.",
        vocab: "Recommend",
        vocabMeaning: "Khuyên, gợi ý",
        background: "from-purple-100 to-indigo-100",
        choices: [
          { text: "That sounds amazing! I'll try it!", nextScene: 3, xp: 10 },
          { text: "What are enchanted berries?", nextScene: 4, xp: 15 },
        ],
      },
      {
        id: 3,
        character: "Barista Luna",
        characterEmoji: "👩‍🍳",
        dialogue: "You're such a wonderful customer! Here's a loyalty card. Come back anytime! 🌟",
        dialogueVi: "Bạn là khách hàng tuyệt vời! Đây là thẻ thành viên. Hãy quay lại bất cứ lúc nào! 🌟",
        vocab: "Wonderful",
        vocabMeaning: "Tuyệt vời",
        background: "from-pink-100 to-rose-100",
        choices: [
          { text: "Thank you! See you tomorrow! 💜", nextScene: -1, xp: 10 },
        ],
      },
      {
        id: 4,
        character: "Barista Luna",
        characterEmoji: "👩‍🍳",
        dialogue: "Of course! Our cookies are baked with a sprinkle of fairy dust. They're absolutely delightful!",
        dialogueVi: "Tất nhiên! Bánh quy của chúng tôi được nướng với một chút bụi tiên. Chúng hoàn toàn tuyệt diệu!",
        vocab: "Delightful",
        vocabMeaning: "Tuyệt diệu, thú vị",
        background: "from-green-100 to-emerald-100",
        choices: [
          { text: "I'll take two cookies! 🍪", nextScene: 3, xp: 10 },
        ],
      },
    ] as StoryScene[],
  },
  {
    id: "adventure",
    title: "🏰 The Lost Castle",
    titleVi: "🏰 Lâu đài bị mất",
    emoji: "🏰",
    gradient: "from-purple-300 to-indigo-400",
    scenes: [
      {
        id: 0,
        character: "Knight Rex",
        characterEmoji: "🤴",
        dialogue: "Brave adventurer! I need your help. The magic crystal is lost in the castle!",
        dialogueVi: "Nhà thám hiểm dũng cảm! Tôi cần sự giúp đỡ của bạn. Pha lê phép thuật bị thất lạc trong lâu đài!",
        vocab: "Brave",
        vocabMeaning: "Dũng cảm",
        background: "from-slate-100 to-gray-200",
        choices: [
          { text: "I'll help you find it!", nextScene: 1, xp: 5 },
          { text: "Tell me more about the crystal.", nextScene: 2, xp: 10 },
        ],
      },
      {
        id: 1,
        character: "Fairy Guide",
        characterEmoji: "🧚",
        dialogue: "The castle has two paths. The left path goes through the garden. The right path goes through the library.",
        dialogueVi: "Lâu đài có hai con đường. Đường bên trái đi qua vườn. Đường bên phải đi qua thư viện.",
        vocab: "Path",
        vocabMeaning: "Con đường",
        background: "from-green-100 to-teal-100",
        choices: [
          { text: "Let's go through the garden! 🌻", nextScene: 3, xp: 10 },
          { text: "The library sounds interesting! 📚", nextScene: 4, xp: 10 },
        ],
      },
      {
        id: 2,
        character: "Knight Rex",
        characterEmoji: "🤴",
        dialogue: "The crystal has the power to protect our village. Without it, we are vulnerable.",
        dialogueVi: "Pha lê có sức mạnh bảo vệ làng của chúng tôi. Không có nó, chúng tôi dễ bị tổn thương.",
        vocab: "Protect",
        vocabMeaning: "Bảo vệ",
        background: "from-blue-100 to-sky-100",
        choices: [
          { text: "Don't worry, I'll find it!", nextScene: 1, xp: 10 },
        ],
      },
      {
        id: 3,
        character: "Garden Sprite",
        characterEmoji: "🌸",
        dialogue: "The flowers whisper that the crystal is hidden in the tallest tower. You're getting closer!",
        dialogueVi: "Những bông hoa thì thầm rằng pha lê được giấu ở tháp cao nhất. Bạn đang đến gần rồi!",
        vocab: "Whisper",
        vocabMeaning: "Thì thầm",
        background: "from-pink-100 to-rose-100",
        choices: [
          { text: "To the tower! ⬆️", nextScene: 5, xp: 15 },
        ],
      },
      {
        id: 4,
        character: "Library Owl",
        characterEmoji: "🦉",
        dialogue: "The ancient books say: 'The crystal glows where moonlight touches the highest stone.'",
        dialogueVi: "Sách cổ nói: 'Pha lê phát sáng nơi ánh trăng chạm vào viên đá cao nhất.'",
        vocab: "Ancient",
        vocabMeaning: "Cổ xưa",
        background: "from-amber-100 to-yellow-100",
        choices: [
          { text: "The tower! Let's go! 🏃", nextScene: 5, xp: 15 },
        ],
      },
      {
        id: 5,
        character: "Knight Rex",
        characterEmoji: "🤴",
        dialogue: "You found the crystal! 💎 You are a true hero! The village is safe thanks to you!",
        dialogueVi: "Bạn đã tìm thấy pha lê! 💎 Bạn là anh hùng thực sự! Ngôi làng an toàn nhờ bạn!",
        vocab: "Hero",
        vocabMeaning: "Anh hùng",
        background: "from-yellow-100 to-amber-100",
        choices: [
          { text: "It was an incredible adventure! 🌟", nextScene: -1, xp: 20 },
        ],
      },
    ] as StoryScene[],
  },
];

export default function StoryPage() {
  const { addXP, addCoins, language } = useGame();
  const t = useTranslation();
  const [activeStory, setActiveStory] = useState<number | null>(null);
  const [currentScene, setCurrentScene] = useState(0);
  const [totalXP, setTotalXP] = useState(0);

  const handleChoice = (choice: StoryChoice) => {
    setTotalXP((prev) => prev + choice.xp);
    if (choice.nextScene === -1) {
      // Story complete
      addXP(totalXP + choice.xp);
      addCoins(Math.floor((totalXP + choice.xp) / 3));
      setActiveStory(null);
      setCurrentScene(0);
      setTotalXP(0);
    } else {
      setCurrentScene(choice.nextScene);
    }
  };

  if (activeStory !== null) {
    const story = STORIES[activeStory];
    const scene = story.scenes.find((s) => s.id === currentScene)!;

    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.button
          onClick={() => { setActiveStory(null); setCurrentScene(0); setTotalXP(0); }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          whileHover={{ x: -3 }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to stories
        </motion.button>

        <AnimatePresence mode="wait">
          <motion.div
            key={scene.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className={`rounded-3xl bg-gradient-to-br ${scene.background} dark:from-gray-800/80 dark:to-gray-900/80 p-6 shadow-kawaii border-2 border-kawaii-purple/10`}
          >
            {/* Character */}
            <div className="flex items-center gap-3 mb-6">
              <motion.span
                className="text-4xl"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {scene.characterEmoji}
              </motion.span>
              <div>
                <p className="font-bold">{scene.character}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>XP earned: {totalXP}</span>
                </div>
              </div>
            </div>

            {/* Dialogue */}
            <motion.div
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-5 mb-4 shadow-sm"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
            >
              <p className="text-lg leading-relaxed mb-2">{scene.dialogue}</p>
              {language === "vi" && (
                <p className="text-sm text-muted-foreground italic">{scene.dialogueVi}</p>
              )}
            </motion.div>

            {/* Vocab highlight */}
            <div className="bg-kawaii-purple/10 rounded-2xl px-4 py-3 mb-6 flex items-center gap-3">
              <span className="text-lg">📝</span>
              <div>
                <span className="font-bold text-kawaii-purple">{scene.vocab}</span>
                <span className="text-muted-foreground"> — {scene.vocabMeaning}</span>
              </div>
            </div>

            {/* Choices */}
            <div className="space-y-2">
              {scene.choices.map((choice, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => handleChoice(choice)}
                  className="w-full text-left p-4 rounded-2xl bg-white/60 dark:bg-gray-700/60 hover:bg-kawaii-purple/10 transition-all font-medium flex items-center justify-between group"
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>{choice.text}</span>
                  <span className="flex items-center gap-1 text-xs text-kawaii-purple opacity-0 group-hover:opacity-100 transition-opacity">
                    +{choice.xp} XP <ArrowRight className="w-3 h-3" />
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-6">
        <span className="bg-gradient-kawaii bg-clip-text text-transparent">
          📖 {t.story}
        </span>
      </h1>

      <div className="grid gap-4 sm:grid-cols-2">
        {STORIES.map((story, idx) => (
          <motion.button
            key={story.id}
            onClick={() => setActiveStory(idx)}
            className={`p-6 rounded-3xl bg-gradient-to-br ${story.gradient} text-white text-left shadow-lg`}
            whileHover={{ scale: 1.03, y: -5 }}
            whileTap={{ scale: 0.97 }}
          >
            <motion.span
              className="text-5xl block mb-3"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {story.emoji}
            </motion.span>
            <h3 className="text-xl font-bold mb-1">
              {language === "vi" ? story.titleVi : story.title}
            </h3>
            <p className="text-sm opacity-80">{story.scenes.length} scenes</p>
          </motion.button>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link href="/">
          <motion.span className="text-sm text-muted-foreground hover:text-kawaii-purple" whileHover={{ scale: 1.05 }}>
            ← Back to Home
          </motion.span>
        </Link>
      </div>
    </div>
  );
}
