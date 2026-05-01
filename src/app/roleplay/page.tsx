"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame, useTranslation } from "@/contexts/game-context";
import { ArrowLeft, Send } from "lucide-react";
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

interface ChatMessage { sender: "npc" | "player"; text: string; }

const EN_NPC_RESPONSES = [
  "That's great! Tell me more!", "Interesting! I like that.",
  "Oh really? That sounds wonderful!", "Haha, you're so funny!",
  "That's a very good point!", "I totally agree with you!",
  "Wow, I didn't know that!", "You speak English very well!",
  "Let me think... Yes, I agree!", "That's so cool! What else?",
];

const ZH_NPC_RESPONSES = [
  "真的吗？很有意思！", "哦，是吗？太棒了！",
  "我完全同意你的看法！", "你说得很对！",
  "哇，我不知道这个！", "你的中文说得很好！",
  "让我想想…是的，我同意！", "太好了！还有呢？",
  "非常有趣！请继续说。", "好的，我明白了！",
];

function RolePlayChat({ scenario, onBack }: { scenario: RolePlayScenario; onBack: () => void }) {
  const { addXP, addCoins, language, username, activeStudyLanguage } = useGame();
  const isZh = activeStudyLanguage === "zh";
  const suggestedResponses: string[] = JSON.parse(scenario.suggested_responses || "[]");
  const vocabList: { word: string; meaning: string }[] = JSON.parse(scenario.vocabulary || "[]");
  const npcResponses = isZh ? ZH_NPC_RESPONSES : EN_NPC_RESPONSES;

  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: "npc", text: scenario.opening_line },
  ]);
  const [input, setInput] = useState("");
  const [messageCount, setMessageCount] = useState(0);
  const [showVocab, setShowVocab] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { sender: "player", text: text.trim() }]);
    setInput("");
    setMessageCount((c) => c + 1);
    addXP(5);
    if ((messageCount + 1) % 3 === 0) addCoins(5);
    setTimeout(() => {
      const response = npcResponses[Math.floor(Math.random() * npcResponses.length)];
      setMessages((prev) => [...prev, { sender: "npc", text: response }]);
    }, 900 + Math.random() * 800);
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
              <p className="text-sm">{msg.text}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {suggestedResponses.map((resp, idx) => (
          <motion.button key={idx} onClick={() => sendMessage(resp)} className="text-xs px-3 py-1.5 rounded-full bg-kawaii-purple/10 hover:bg-kawaii-purple/20 font-medium transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {resp}
          </motion.button>
        ))}
      </div>

      <div className="flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage(input)} placeholder={isZh ? "输入你的回应..." : "Type your response..."} className="flex-1 px-4 py-3 rounded-2xl bg-white/60 dark:bg-gray-800/60 border-2 border-transparent focus:border-kawaii-purple focus:outline-none" />
        <motion.button onClick={() => sendMessage(input)} disabled={!input.trim()} className="p-3 rounded-2xl bg-gradient-kawaii text-white shadow-kawaii disabled:opacity-50" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Send className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}

export default function RolePlayPage() {
  const { language, activeStudyLanguage } = useGame();
  const t = useTranslation();
  const isZh = activeStudyLanguage === "zh";
  const [scenarios, setScenarios] = useState<RolePlayScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeScenario, setActiveScenario] = useState<RolePlayScenario | null>(null);

  useEffect(() => {
    setLoading(true);
    setActiveScenario(null);
    fetch(`${WORKER_BASE}/api/roleplay?language=${activeStudyLanguage}&limit=20`)
      .then((r) => r.json())
      .then((res) => setScenarios(Array.isArray(res) ? res : (res.data || [])))
      .catch(() => setScenarios([]))
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
