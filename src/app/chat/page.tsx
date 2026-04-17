"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Mascot } from "@/components/mascot";
import { useGame } from "@/contexts/game-context";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const AI_ROLES = {
  partner: {
    name: "Friendly Partner",
    emoji: "😊",
    description: "Casual conversation practice",
    gradient: "from-kawaii-sky to-blue-400",
  },
  interviewer: {
    name: "Job Interviewer",
    emoji: "👔",
    description: "Mock interview practice",
    gradient: "from-kawaii-yellow to-amber-400",
  },
  support: {
    name: "Customer Support",
    emoji: "🎧",
    description: "Real-world scenarios",
    gradient: "from-kawaii-purple to-violet-400",
  },
};

type RoleKey = keyof typeof AI_ROLES;

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleKey>("partner");
  const [mascotMood, setMascotMood] = useState<"happy" | "thinking" | "excited">("happy");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addXP, addCoins } = useGame();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setMascotMood("thinking");
    
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
          role: selectedRole,
        }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || data.error || "Sorry, I couldn't respond.",
        timestamp: new Date(),
      }]);
      // Reward XP for conversation
      addXP(5);
      if (messages.length > 0 && messages.length % 5 === 0) {
        addCoins(10);
      }
      setMascotMood("excited");
      setTimeout(() => setMascotMood("happy"), 2000);
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, there was an error. Please try again.",
        timestamp: new Date(),
      }]);
      setMascotMood("happy");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const activeRole = AI_ROLES[selectedRole];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-4">
          <Mascot mood={mascotMood} size="md" />
          <div>
            <h1 className="text-2xl font-bold">
              <span className="bg-gradient-kawaii bg-clip-text text-transparent">
                💬 AI Chat Practice
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Practice conversations & earn XP! ✨
            </p>
          </div>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-3 gap-3">
          {(Object.entries(AI_ROLES) as [RoleKey, (typeof AI_ROLES)[RoleKey]][]).map(([key, role]) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setSelectedRole(key); setMessages([]); }}
              className={cn(
                "rounded-2xl p-4 text-left transition-all border-2",
                selectedRole === key
                  ? "bg-white/80 dark:bg-gray-800/80 border-kawaii-purple/50 shadow-kawaii"
                  : "bg-white/50 dark:bg-gray-800/50 border-transparent hover:border-kawaii-purple/30"
              )}
            >
              <motion.div 
                className={`mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${role.gradient} shadow-lg text-2xl`}
                animate={selectedRole === key ? { rotate: [0, -5, 5, 0] } : {}}
                transition={{ duration: 0.5 }}
              >
                {role.emoji}
              </motion.div>
              <div className="font-bold text-sm">{role.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{role.description}</div>
            </motion.button>
          ))}
        </div>

        {/* Chat Area */}
        <div className="rounded-3xl bg-white/70 dark:bg-gray-800/70 backdrop-blur shadow-kawaii overflow-hidden" style={{ height: "55vh", display: "flex", flexDirection: "column" }}>
          {/* Chat header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-kawaii-purple/10">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${activeRole.gradient} shadow-lg text-xl`}>
                {activeRole.emoji}
              </div>
              <div>
                <div className="font-semibold text-sm">{activeRole.name}</div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-kawaii-mint animate-pulse" />
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMessages([])}
                className="gap-1.5 rounded-xl"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            </motion.div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center py-12">
                <div>
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-5xl mb-4"
                  >
                    {activeRole.emoji}
                  </motion.div>
                  <p className="font-medium">Hi! I&apos;m your {activeRole.name}.</p>
                  <p className="text-sm mt-1 text-muted-foreground">Say hello to start chatting! 👋</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={cn("flex gap-3", message.role === "user" ? "flex-row-reverse" : "")}
                    >
                      {/* Avatar */}
                      <div className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-lg shadow-lg",
                        message.role === "assistant"
                          ? `bg-gradient-to-br ${activeRole.gradient}`
                          : "bg-gradient-kawaii"
                      )}>
                        {message.role === "assistant" ? activeRole.emoji : "🙋"}
                      </div>

                      {/* Bubble */}
                      <div className={cn(
                        "max-w-[75%] rounded-3xl px-4 py-3 text-sm shadow-sm",
                        message.role === "user"
                          ? "bg-gradient-kawaii text-white rounded-tr-lg"
                          : "bg-white dark:bg-gray-700 border border-kawaii-purple/10 rounded-tl-lg"
                      )}>
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        <p className={cn("mt-1 text-[10px] opacity-60", message.role === "user" ? "text-right" : "text-left")}>
                          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-lg bg-gradient-to-br ${activeRole.gradient} shadow-lg`}>
                      {activeRole.emoji}
                    </div>
                    <div className="bg-white dark:bg-gray-700 border border-kawaii-purple/10 rounded-3xl rounded-tl-lg px-5 py-4 flex items-center gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="h-2 w-2 rounded-full bg-kawaii-purple"
                          animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-kawaii-purple/10">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message in English..."
                className="min-h-[44px] max-h-32 resize-none rounded-2xl border-kawaii-purple/20 bg-white/50 dark:bg-gray-800/50"
                rows={1}
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="h-11 w-11 shrink-0 rounded-2xl bg-gradient-kawaii shadow-kawaii"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <Send className="h-4 w-4 text-white" />
                  )}
                </Button>
              </motion.div>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground text-center">
              💡 Earn 5 XP per message • Bonus coins every 5 messages!
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
