"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame, useTranslation } from "@/contexts/game-context";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

interface RolePlayScenario {
  id: string;
  title: string;
  titleVi: string;
  emoji: string;
  gradient: string;
  setting: string;
  settingVi: string;
  npcName: string;
  npcEmoji: string;
  npcRole: string;
  playerRole: string;
  openingLine: string;
  openingLineVi: string;
  suggestedResponses: string[];
  vocabulary: { word: string; meaning: string }[];
}

const SCENARIOS: RolePlayScenario[] = [
  {
    id: "restaurant",
    title: "🍕 At the Restaurant",
    titleVi: "🍕 Tại nhà hàng",
    emoji: "🍕",
    gradient: "from-red-300 to-orange-400",
    setting: "You're at a cozy Italian restaurant. The waiter comes to your table.",
    settingVi: "Bạn đang ở một nhà hàng Ý ấm cúng. Người phục vụ đến bàn của bạn.",
    npcName: "Marco",
    npcEmoji: "🧑‍🍳",
    npcRole: "Waiter",
    playerRole: "Customer",
    openingLine: "Good evening! Welcome to Bella Italia. Here's the menu. Can I get you something to drink first?",
    openingLineVi: "Chào buổi tối! Chào mừng đến Bella Italia. Đây là thực đơn. Tôi có thể mang đồ uống cho bạn trước không?",
    suggestedResponses: [
      "I'd like a glass of water, please.",
      "What do you recommend?",
      "Can I see the specials?",
      "I'll have an orange juice.",
    ],
    vocabulary: [
      { word: "Menu", meaning: "Thực đơn" },
      { word: "Order", meaning: "Gọi món" },
      { word: "Recommend", meaning: "Gợi ý" },
      { word: "Delicious", meaning: "Ngon" },
    ],
  },
  {
    id: "school",
    title: "🏫 First Day at School",
    titleVi: "🏫 Ngày đầu tiên đi học",
    emoji: "🏫",
    gradient: "from-blue-300 to-indigo-400",
    setting: "It's your first day at a new school. A friendly classmate comes to say hello.",
    settingVi: "Đây là ngày đầu tiên ở trường mới. Một bạn cùng lớp thân thiện đến chào bạn.",
    npcName: "Emma",
    npcEmoji: "👧",
    npcRole: "Classmate",
    playerRole: "New Student",
    openingLine: "Hey! You must be the new student. I'm Emma! What's your name? Where are you from?",
    openingLineVi: "Này! Bạn hẳn là học sinh mới. Mình là Emma! Bạn tên gì? Bạn đến từ đâu?",
    suggestedResponses: [
      "Hi Emma! I'm [name]. Nice to meet you!",
      "I'm from Vietnam. Is this a big school?",
      "Hello! Can you show me around?",
      "Thanks! What's your favorite subject?",
    ],
    vocabulary: [
      { word: "Introduce", meaning: "Giới thiệu" },
      { word: "Classmate", meaning: "Bạn cùng lớp" },
      { word: "Subject", meaning: "Môn học" },
      { word: "Friendly", meaning: "Thân thiện" },
    ],
  },
  {
    id: "meeting",
    title: "🤝 Meeting Friends",
    titleVi: "🤝 Gặp gỡ bạn bè",
    emoji: "🤝",
    gradient: "from-green-300 to-teal-400",
    setting: "You're at a park and meet a group of friendly people having a picnic.",
    settingVi: "Bạn đang ở công viên và gặp một nhóm người thân thiện đang dã ngoại.",
    npcName: "Jake",
    npcEmoji: "🧑",
    npcRole: "Friendly stranger",
    playerRole: "Park visitor",
    openingLine: "Hey there! We're having a picnic. Would you like to join us? We have plenty of food!",
    openingLineVi: "Chào bạn! Chúng mình đang dã ngoại. Bạn muốn tham gia không? Chúng mình có nhiều đồ ăn lắm!",
    suggestedResponses: [
      "Sure, that sounds fun! Thanks for inviting me!",
      "What kind of food do you have?",
      "I'd love to! I brought some snacks too!",
      "That's so kind of you! What's the occasion?",
    ],
    vocabulary: [
      { word: "Join", meaning: "Tham gia" },
      { word: "Invite", meaning: "Mời" },
      { word: "Occasion", meaning: "Dịp" },
      { word: "Generous", meaning: "Hào phóng" },
    ],
  },
];

interface ChatMessage {
  sender: "npc" | "player";
  text: string;
}

function RolePlayChat({ scenario, onBack }: { scenario: RolePlayScenario; onBack: () => void }) {
  const { addXP, addCoins, language, username } = useGame();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: "npc", text: scenario.openingLine },
  ]);
  const [input, setInput] = useState("");
  const [messageCount, setMessageCount] = useState(0);
  const [showVocab, setShowVocab] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const NPC_RESPONSES = [
    "That's great! Tell me more!",
    "Interesting! I like that.",
    "Oh really? That sounds wonderful!",
    "Haha, you're so funny!",
    "That's a very good point!",
    "I totally agree with you!",
    "Wow, I didn't know that!",
    "You speak English very well!",
    "Let me think about that... Yes, I agree!",
    "That's so cool! What else?",
  ];

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { sender: "player", text: text.trim() }]);
    setInput("");
    setMessageCount((c) => c + 1);
    addXP(5);

    if ((messageCount + 1) % 3 === 0) {
      addCoins(5);
    }

    // NPC auto-reply
    setTimeout(() => {
      const response = NPC_RESPONSES[Math.floor(Math.random() * NPC_RESPONSES.length)];
      setMessages((prev) => [...prev, { sender: "npc", text: response }]);
    }, 1000 + Math.random() * 1000);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <motion.button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        whileHover={{ x: -3 }}
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </motion.button>

      {/* Scenario info */}
      <div className={`rounded-3xl bg-gradient-to-r ${scenario.gradient} text-white p-4 mb-4 shadow-lg`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{scenario.npcEmoji}</span>
          <div>
            <p className="font-bold">{scenario.npcName} ({scenario.npcRole})</p>
            <p className="text-xs opacity-80">
              {language === "vi" ? scenario.settingVi : scenario.setting}
            </p>
          </div>
        </div>
      </div>

      {/* Vocab toggle */}
      <motion.button
        onClick={() => setShowVocab(!showVocab)}
        className="mb-3 text-sm font-medium text-kawaii-purple hover:text-kawaii-pink transition-colors"
      >
        📝 {showVocab ? "Hide" : "Show"} Vocabulary
      </motion.button>

      <AnimatePresence>
        {showVocab && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2">
              {scenario.vocabulary.map((v) => (
                <div key={v.word} className="bg-kawaii-purple/10 rounded-xl px-3 py-2 text-sm">
                  <span className="font-bold">{v.word}</span> — <span className="text-muted-foreground">{v.meaning}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat */}
      <div
        ref={chatRef}
        className="h-72 overflow-y-auto mb-4 space-y-3 rounded-3xl bg-white/50 dark:bg-gray-800/50 backdrop-blur p-4 border border-kawaii-purple/10"
      >
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex ${msg.sender === "player" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                msg.sender === "player"
                  ? "bg-gradient-kawaii text-white rounded-br-sm"
                  : "bg-white dark:bg-gray-700 shadow-sm rounded-bl-sm"
              }`}
            >
              <p className="text-xs font-bold mb-1 opacity-70">
                {msg.sender === "npc" ? scenario.npcName : username}
              </p>
              <p className="text-sm">{msg.text}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Suggested responses */}
      <div className="flex flex-wrap gap-2 mb-3">
        {scenario.suggestedResponses.map((resp, idx) => (
          <motion.button
            key={idx}
            onClick={() => sendMessage(resp)}
            className="text-xs px-3 py-1.5 rounded-full bg-kawaii-purple/10 hover:bg-kawaii-purple/20 font-medium transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {resp}
          </motion.button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          placeholder="Type your response..."
          className="flex-1 px-4 py-3 rounded-2xl bg-white/60 dark:bg-gray-800/60 border-2 border-transparent focus:border-kawaii-purple focus:outline-none"
        />
        <motion.button
          onClick={() => sendMessage(input)}
          disabled={!input.trim()}
          className="p-3 rounded-2xl bg-gradient-kawaii text-white shadow-kawaii disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Send className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}

export default function RolePlayPage() {
  const { language } = useGame();
  const t = useTranslation();
  const [activeScenario, setActiveScenario] = useState<RolePlayScenario | null>(null);

  if (activeScenario) {
    return <RolePlayChat scenario={activeScenario} onBack={() => setActiveScenario(null)} />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-2">
        <span className="bg-gradient-kawaii bg-clip-text text-transparent">
          🎭 {t.roleplay}
        </span>
      </h1>
      <p className="text-muted-foreground mb-6 text-sm">
        {language === "vi"
          ? "Luyện tiếng Anh trong các tình huống thực tế!"
          : "Practice English in real-life scenarios!"}
      </p>

      <div className="space-y-4">
        {SCENARIOS.map((scenario) => (
          <motion.button
            key={scenario.id}
            onClick={() => setActiveScenario(scenario)}
            className={`w-full p-6 rounded-3xl bg-gradient-to-r ${scenario.gradient} text-white text-left shadow-lg`}
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-4">
              <motion.span
                className="text-4xl"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {scenario.emoji}
              </motion.span>
              <div>
                <h3 className="text-lg font-bold">
                  {language === "vi" ? scenario.titleVi : scenario.title}
                </h3>
                <p className="text-sm opacity-80">
                  {language === "vi" ? scenario.settingVi : scenario.setting}
                </p>
                <div className="flex gap-2 mt-2">
                  {scenario.vocabulary.slice(0, 3).map((v) => (
                    <span key={v.word} className="text-xs bg-white/20 rounded-full px-2 py-0.5">
                      {v.word}
                    </span>
                  ))}
                </div>
              </div>
            </div>
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
