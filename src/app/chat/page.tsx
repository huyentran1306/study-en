"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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
    description: "Casual everyday conversation practice",
    gradient: "from-blue-400 to-cyan-500",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    ring: "ring-blue-400",
    bubbleBg: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/20 border border-blue-100 dark:border-blue-800",
  },
  interviewer: {
    name: "Job Interviewer",
    emoji: "👔",
    description: "Mock interview practice with feedback",
    gradient: "from-amber-400 to-orange-500",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800",
    ring: "ring-amber-400",
    bubbleBg: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800",
  },
  support: {
    name: "Customer Support",
    emoji: "🎧",
    description: "Real-world service scenario practice",
    gradient: "from-purple-400 to-violet-500",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-200 dark:border-purple-800",
    ring: "ring-purple-400",
    bubbleBg: "bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/30 dark:to-violet-900/20 border border-purple-100 dark:border-purple-800",
  },
};

type RoleKey = keyof typeof AI_ROLES;

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleKey>("partner");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, there was an error. Please try again.",
        timestamp: new Date(),
      }]);
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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 shadow-md text-2xl">
              💬
            </span>
            AI Conversation Practice
          </h1>
          <p className="mt-1 text-muted-foreground">
            Choose a practice partner and start chatting! 🚀
          </p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(Object.entries(AI_ROLES) as [RoleKey, (typeof AI_ROLES)[RoleKey]][]).map(([key, role]) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setSelectedRole(key); setMessages([]); }}
              className={cn(
                "rounded-2xl border-2 p-5 text-left transition-all",
                selectedRole === key
                  ? `${role.border} ${role.bg} ring-2 ${role.ring} shadow-md`
                  : "border-border/50 bg-card/80 hover:shadow-sm"
              )}
            >
              <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${role.gradient} shadow-sm text-2xl`}>
                {role.emoji}
              </div>
              <div className="font-bold text-sm">{role.name}</div>
              <div className="text-xs text-muted-foreground mt-1 leading-snug">{role.description}</div>
            </motion.button>
          ))}
        </div>

        {/* Chat Area */}
        <div className="rounded-3xl border-2 border-border/50 bg-card/80 shadow-sm overflow-hidden" style={{ height: "60vh", display: "flex", flexDirection: "column" }}>
          {/* Chat header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${activeRole.gradient} shadow-sm text-xl`}>
                {activeRole.emoji}
              </div>
              <div>
                <div className="font-semibold text-sm">{activeRole.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMessages([])}
              className="gap-1.5 rounded-xl text-muted-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-5" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-muted-foreground py-12">
                <div>
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-5xl mb-4"
                  >
                    {activeRole.emoji}
                  </motion.div>
                  <p className="font-medium text-base">Hi there! I&apos;m your {activeRole.name}.</p>
                  <p className="text-sm mt-1 text-muted-foreground">Say hello or ask a question to start! 👋</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
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
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-lg shadow-sm",
                        message.role === "assistant"
                          ? `bg-gradient-to-br ${activeRole.gradient}`
                          : "bg-gradient-to-br from-violet-400 to-pink-500"
                      )}>
                        {message.role === "assistant" ? activeRole.emoji : "🙋"}
                      </div>

                      {/* Bubble */}
                      <div className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                        message.role === "user"
                          ? "bg-gradient-to-br from-violet-500 to-pink-500 text-white rounded-tr-sm"
                          : `${activeRole.bubbleBg} rounded-tl-sm`
                      )}>
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        <p className={cn("mt-1.5 text-[10px] opacity-60", message.role === "user" ? "text-right" : "text-left")}>
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
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-lg bg-gradient-to-br ${activeRole.gradient} shadow-sm`}>
                      {activeRole.emoji}
                    </div>
                    <div className={`${activeRole.bubbleBg} rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1.5`}>
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="h-2 w-2 rounded-full bg-current opacity-50"
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
          <Separator />
          <div className="p-4">
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message in English..."
                className="min-h-[44px] max-h-32 resize-none rounded-2xl border-border/50"
                rows={1}
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="h-11 w-11 shrink-0 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 shadow-cute"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </motion.div>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
