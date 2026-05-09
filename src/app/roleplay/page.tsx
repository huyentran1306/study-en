"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame, useTranslation } from "@/contexts/game-context";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import Link from "next/link";

const WORKER_BASE = process.env.NEXT_PUBLIC_WORKER_URL || "https://d1-template.trann46698.workers.dev";

interface RolePlayScenario {
  id: string;
  language: string;
  title: string;
  title_vi: string;
  emoji: string;
  gradient: string;
  setting: string;
  setting_vi: string;
  npc_name: string;
  npc_emoji: string;
  npc_role: string;
  player_role: string;
  opening_line: string;
  opening_line_vi: string;
  suggested_responses: string; // JSON
  vocabulary: string; // JSON
}

// Built-in real-life scenarios for daily communication
const BUILTIN_EN_SCENARIOS: RolePlayScenario[] = [
  {
    id: "builtin-coffee",
    language: "en",
    title: "Ordering at a Coffee Shop",
    title_vi: "Gọi đồ tại quán cà phê",
    emoji: "☕",
    gradient: "from-amber-400 to-orange-500",
    setting: "You're at a busy coffee shop ordering your morning drink",
    setting_vi: "Bạn đang ở quán cà phê gọi đồ uống buổi sáng",
    npc_name: "Emma",
    npc_emoji: "☕",
    npc_role: "Barista",
    player_role: "Customer",
    opening_line: "Good morning! Welcome to Bean & Brew. What can I get started for you today?",
    opening_line_vi: "Chào buổi sáng! Chào mừng đến Bean & Brew. Tôi có thể phục vụ gì cho bạn?",
    suggested_responses: JSON.stringify(["I'd like a large latte, please.", "What's your most popular drink?", "Can I get a caramel macchiato to go?", "Do you have any seasonal specials?"]),
    vocabulary: JSON.stringify([{ word: "latte", meaning: "espresso + steamed milk" }, { word: "to go", meaning: "take away" }, { word: "oat milk", meaning: "plant-based milk" }, { word: "venti", meaning: "large size" }]),
  },
  {
    id: "builtin-office",
    language: "en",
    title: "Workplace Small Talk",
    title_vi: "Nói chuyện tại văn phòng",
    emoji: "💼",
    gradient: "from-green-400 to-emerald-500",
    setting: "Monday morning by the office coffee machine",
    setting_vi: "Sáng thứ Hai cạnh máy pha cà phê văn phòng",
    npc_name: "Mark",
    npc_emoji: "👔",
    npc_role: "Colleague",
    player_role: "Coworker",
    opening_line: "Hey! How was your weekend? Did you do anything fun?",
    opening_line_vi: "Này! Cuối tuần của bạn thế nào? Bạn có làm gì vui không?",
    suggested_responses: JSON.stringify(["It was great, I went hiking!", "Not much, just relaxed at home.", "I had a really busy weekend actually.", "Pretty good! How about yours?"]),
    vocabulary: JSON.stringify([{ word: "catch up", meaning: "reconnect, talk about recent events" }, { word: "swamped", meaning: "very busy" }, { word: "deadline", meaning: "due date" }, { word: "heading out", meaning: "leaving" }]),
  },
  {
    id: "builtin-phone",
    language: "en",
    title: "Making a Phone Reservation",
    title_vi: "Đặt bàn qua điện thoại",
    emoji: "📱",
    gradient: "from-sky-400 to-blue-500",
    setting: "Calling a restaurant to make a dinner reservation",
    setting_vi: "Gọi điện cho nhà hàng để đặt bàn ăn tối",
    npc_name: "Sophie",
    npc_emoji: "📞",
    npc_role: "Restaurant Host",
    player_role: "Customer",
    opening_line: "Good afternoon, The Olive Garden, this is Sophie speaking. How may I help you today?",
    opening_line_vi: "Chiều tốt lành, Nhà hàng The Olive Garden, tôi là Sophie. Tôi có thể giúp gì cho bạn?",
    suggested_responses: JSON.stringify(["I'd like to make a reservation for tonight.", "Do you have any tables available for two?", "We're a party of four for Saturday evening.", "What time do you close?"]),
    vocabulary: JSON.stringify([{ word: "reservation", meaning: "booking in advance" }, { word: "party of", meaning: "group of people" }, { word: "available", meaning: "free, open" }, { word: "hold on", meaning: "wait a moment" }]),
  },
  {
    id: "builtin-interview",
    language: "en",
    title: "Job Interview Practice",
    title_vi: "Luyện phỏng vấn xin việc",
    emoji: "👔",
    gradient: "from-purple-400 to-violet-500",
    setting: "A job interview at a tech company",
    setting_vi: "Phỏng vấn xin việc tại công ty công nghệ",
    npc_name: "David",
    npc_emoji: "🎯",
    npc_role: "Hiring Manager",
    player_role: "Job Candidate",
    opening_line: "Thanks for coming in today. Please, have a seat. Can you start by telling me a little about yourself?",
    opening_line_vi: "Cảm ơn bạn đã đến hôm nay. Mời ngồi. Bạn có thể giới thiệu đôi chút về bản thân không?",
    suggested_responses: JSON.stringify(["Sure! I'm a software developer with 3 years of experience.", "I've been working in marketing for the past two years.", "I recently graduated and I'm looking for my first role.", "I have a background in data analysis."]),
    vocabulary: JSON.stringify([{ word: "strengths", meaning: "things you're good at" }, { word: "experience", meaning: "work history" }, { word: "opportunity", meaning: "chance, opening" }, { word: "motivated", meaning: "enthusiastic, driven" }]),
  },
  {
    id: "builtin-doctor",
    language: "en",
    title: "At the Doctor's Office",
    title_vi: "Tại phòng khám bác sĩ",
    emoji: "🏥",
    gradient: "from-pink-400 to-rose-500",
    setting: "Visiting the doctor about not feeling well",
    setting_vi: "Đến gặp bác sĩ vì không khỏe",
    npc_name: "Dr. Chen",
    npc_emoji: "👨‍⚕️",
    npc_role: "Doctor",
    player_role: "Patient",
    opening_line: "Hello, come on in. So what brings you in today? How can I help you?",
    opening_line_vi: "Xin chào, mời vào. Vậy hôm nay bạn đến vì vấn đề gì? Tôi có thể giúp gì cho bạn?",
    suggested_responses: JSON.stringify(["I've had a headache for two days.", "I have a sore throat and a fever.", "I've been feeling very tired lately.", "I think I might have caught a cold."]),
    vocabulary: JSON.stringify([{ word: "symptoms", meaning: "signs of illness" }, { word: "prescription", meaning: "doctor's medicine order" }, { word: "allergic to", meaning: "having a bad reaction to" }, { word: "dosage", meaning: "amount of medicine" }]),
  },
];

interface ChatMessage { sender: "npc" | "player"; text: string; isLoading?: boolean; }

async function fetchNPCResponse(scenario: RolePlayScenario, history: ChatMessage[], userMessage: string, language: string): Promise<string> {
  try {
    const res = await fetch("/api/npc-response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario, history, userMessage, language }),
    });
    const data = await res.json() as { message: string };
    return data.message || "That's interesting! Tell me more.";
  } catch {
    return "That's great! Tell me more.";
  }
}

function RolePlayChat({ scenario, onBack }: { scenario: RolePlayScenario; onBack: () => void }) {
  const { addXP, addCoins, language, username, activeStudyLanguage } = useGame();
  const isZh = activeStudyLanguage === "zh";
  const suggestedResponses: string[] = JSON.parse(scenario.suggested_responses || "[]");
  const vocabList: { word: string; meaning: string }[] = JSON.parse(scenario.vocabulary || "[]");

  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: "npc", text: scenario.opening_line },
  ]);
  const [input, setInput] = useState("");
  const [messageCount, setMessageCount] = useState(0);
  const [showVocab, setShowVocab] = useState(false);
  const [isNPCLoading, setIsNPCLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isNPCLoading) return;
    const userMsg: ChatMessage = { sender: "player", text: text.trim() };
    const currentHistory = [...messages, userMsg];
    setMessages(currentHistory);
    setInput("");
    setMessageCount((c) => c + 1);
    addXP(5);
    if ((messageCount + 1) % 3 === 0) addCoins(5);

    // Show loading indicator
    setIsNPCLoading(true);
    setMessages((prev) => [...prev, { sender: "npc", text: "", isLoading: true }]);

    const npcText = await fetchNPCResponse(scenario, currentHistory, text.trim(), activeStudyLanguage);

    setMessages((prev) => {
      const withoutLoading = prev.filter((m) => !m.isLoading);
      return [...withoutLoading, { sender: "npc", text: npcText }];
    });
    setIsNPCLoading(false);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <motion.button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4" whileHover={{ x: -3 }}>
        <ArrowLeft className="w-4 h-4" /> Back
      </motion.button>
      <div className={`rounded-3xl bg-gradient-to-r ${scenario.gradient} text-white p-4 mb-4 shadow-lg`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{scenario.npc_emoji}</span>
          <div>
            <p className="font-bold">{scenario.npc_name} ({scenario.npc_role})</p>
            <p className="text-xs opacity-80">{language === "vi" && scenario.setting_vi ? scenario.setting_vi : scenario.setting}</p>
          </div>
        </div>
      </div>

      <motion.button onClick={() => setShowVocab(!showVocab)} className="mb-3 text-sm font-medium text-kawaii-purple hover:text-kawaii-pink transition-colors">
        📝 {showVocab ? "Hide" : "Show"} Vocabulary
      </motion.button>

      <AnimatePresence>
        {showVocab && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-4 overflow-hidden">
            <div className="grid grid-cols-2 gap-2">
              {vocabList.map((v) => (
                <div key={v.word} className="bg-kawaii-purple/10 rounded-xl px-3 py-2 text-sm">
                  <span className="font-bold">{v.word}</span> — <span className="text-muted-foreground">{v.meaning}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={chatRef} className="h-72 overflow-y-auto mb-4 space-y-3 rounded-3xl bg-white/50 dark:bg-gray-800/50 backdrop-blur p-4 border border-kawaii-purple/10">
        {messages.map((msg, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex ${msg.sender === "player" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${msg.sender === "player" ? "bg-gradient-kawaii text-white rounded-br-sm" : "bg-white dark:bg-gray-700 shadow-sm rounded-bl-sm"}`}>
              <p className="text-xs font-bold mb-1 opacity-70">{msg.sender === "npc" ? scenario.npc_name : username}</p>
              {msg.isLoading ? (
                <div className="flex gap-1.5 py-1">
                  {[0,1,2].map((i) => (
                    <motion.div key={i} className="w-2 h-2 rounded-full bg-kawaii-purple/40" animate={{ y: [0,-4,0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }} />
                  ))}
                </div>
              ) : (
                <p className="text-sm">{msg.text}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {suggestedResponses.map((resp, idx) => (
          <motion.button key={idx} onClick={() => sendMessage(resp)} disabled={isNPCLoading} className="text-xs px-3 py-1.5 rounded-full bg-kawaii-purple/10 hover:bg-kawaii-purple/20 font-medium transition-colors disabled:opacity-50" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {resp}
          </motion.button>
        ))}
      </div>

      <div className="flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage(input)} disabled={isNPCLoading} placeholder={isZh ? "输入你的回应..." : "Type your response..."} className="flex-1 px-4 py-3 rounded-2xl bg-white/60 dark:bg-gray-800/60 border-2 border-transparent focus:border-kawaii-purple focus:outline-none disabled:opacity-60" />
        <motion.button onClick={() => sendMessage(input)} disabled={!input.trim() || isNPCLoading} className="p-3 rounded-2xl bg-gradient-kawaii text-white shadow-kawaii disabled:opacity-50" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          {isNPCLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </motion.button>
      </div>
    </div>
  );
}

export default function RolePlayPage() {
  const { language, activeStudyLanguage } = useGame();
  const t = useTranslation();
  const isZh = activeStudyLanguage === "zh";
  const [dbScenarios, setDbScenarios] = useState<RolePlayScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeScenario, setActiveScenario] = useState<RolePlayScenario | null>(null);

  // Merge built-in + DB scenarios (built-in first for EN, DB for ZH)
  const scenarios = isZh ? dbScenarios : [...BUILTIN_EN_SCENARIOS, ...dbScenarios];

  useEffect(() => {
    setLoading(true);
    setActiveScenario(null);
    fetch(`${WORKER_BASE}/api/roleplay?language=${activeStudyLanguage}&limit=20`)
      .then((r) => r.json())
      .then((res) => setDbScenarios(Array.isArray(res) ? res : (res.data || [])))
      .catch(() => setDbScenarios([]))
      .finally(() => setLoading(false));
  }, [activeStudyLanguage]);

  if (activeScenario) {
    return <RolePlayChat scenario={activeScenario} onBack={() => setActiveScenario(null)} />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-2">
        <span className="bg-gradient-kawaii bg-clip-text text-transparent">
          🎭 {isZh ? "角色扮演" : t.roleplay}
        </span>
      </h1>
      <p className="text-muted-foreground mb-6 text-sm">
        {isZh ? "在真实场景中练习中文！" : language === "vi" ? "Luyện tiếng Anh trong các tình huống thực tế!" : "Practice in real-life scenarios!"}
      </p>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-3xl bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse" />
          ))}
        </div>
      ) : scenarios.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-3">🎭</p>
          <p>No scenarios yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {scenarios.map((scenario) => {
            const vocabList: { word: string; meaning: string }[] = JSON.parse(scenario.vocabulary || "[]");
            return (
              <motion.button
                key={scenario.id}
                onClick={() => setActiveScenario(scenario)}
                className={`w-full p-6 rounded-3xl bg-gradient-to-r ${scenario.gradient} text-white text-left shadow-lg`}
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-4">
                  <motion.span className="text-4xl" animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                    {scenario.emoji}
                  </motion.span>
                  <div>
                    <h3 className="text-lg font-bold">{language === "vi" && scenario.title_vi ? scenario.title_vi : scenario.title}</h3>
                    <p className="text-sm opacity-80">{language === "vi" && scenario.setting_vi ? scenario.setting_vi : scenario.setting}</p>
                    <div className="flex gap-2 mt-2">
                      {vocabList.slice(0, 3).map((v) => (
                        <span key={v.word} className="text-xs bg-white/20 rounded-full px-2 py-0.5">{v.word}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/"><motion.span className="text-sm text-muted-foreground hover:text-kawaii-purple" whileHover={{ scale: 1.05 }}>← Back to Home</motion.span></Link>
      </div>
    </div>
  );
}
