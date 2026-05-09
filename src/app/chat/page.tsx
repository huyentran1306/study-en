"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, RotateCcw, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Mascot } from "@/components/mascot";
import { useGame } from "@/contexts/game-context";
import { useSTTRecorder } from "@/hooks/use-stt-recorder";

const CHAT_WORKER_URL = "https://llm-chat-app-template.trann46698.workers.dev/api/chat";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const AI_ROLES = {
  partner: {
    name: "Conversation Partner",
    emoji: "��",
    description: "Casual chat practice",
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
  teacher: {
    name: "English Teacher",
    emoji: "📚",
    description: "Grammar & vocabulary",
    gradient: "from-kawaii-mint to-green-400",
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
  const abortRef = useRef<AbortController | null>(null);
  const { addXP, addCoins } = useGame();

  const {
    isRecording,
    isTranscribing,
    transcript: sttTranscript,
    startRecording,
    stopRecording,
    resetTranscript: resetSTT,
    isSupported: isMicSupported,
  } = useSTTRecorder();

  useEffect(() => {
    if (sttTranscript) {
      setInput(sttTranscript);
      resetSTT();
    }
  }, [sttTranscript, resetSTT]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async () => {
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

    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(CHAT_WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
          role: selectedRole,
        }),
      });

      if (!response.ok) throw new Error("Request failed");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data) as { response?: string };
              if (parsed.response) {
                accumulatedText += parsed.response;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: accumulatedText } : m
                  )
                );
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }
      }

      addXP(5);
      const msgCount = messages.filter(m => m.role === "user").length + 1;
      if (msgCount % 5 === 0) addCoins(10);
      setMascotMood("excited");
      setTimeout(() => setMascotMood("happy"), 2000);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Sorry, there was an error. Please try again." }
              : m
          )
        );
        setMascotMood("happy");
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [input, isLoading, messages, selectedRole, addXP, addCoins]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleMicClick = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
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
              Chat with AI & earn XP! Speak or type in English ✨
            </p>
          </div>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
        <div
          className="rounded-3xl bg-white/70 dark:bg-gray-800/70 backdrop-blur shadow-kawaii overflow-hidden"
          style={{ height: "55vh", display: "flex", flexDirection: "column" }}
        >
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
                  <span className="text-xs text-muted-foreground">Online · Llama 3.1</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setMessages([]); abortRef.current?.abort(); }}
              className="gap-1.5 rounded-xl"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
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
                  <p className="text-sm mt-1 text-muted-foreground">
                    Type or 🎤 speak to start! Earn 5 XP per message.
                  </p>
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
                      <div className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-lg shadow-lg",
                        message.role === "assistant"
                          ? `bg-gradient-to-br ${activeRole.gradient}`
                          : "bg-gradient-kawaii"
                      )}>
                        {message.role === "assistant" ? activeRole.emoji : "🙋"}
                      </div>
                      <div className={cn(
                        "max-w-[75%] rounded-3xl px-4 py-3 text-sm shadow-sm",
                        message.role === "user"
                          ? "bg-gradient-kawaii text-white rounded-tr-lg"
                          : "bg-white dark:bg-gray-700 border border-kawaii-purple/10 rounded-tl-lg"
                      )}>
                        {message.content ? (
                          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        ) : (
                          <div className="flex items-center gap-1.5 py-1">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="h-2 w-2 rounded-full bg-kawaii-purple"
                                animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                              />
                            ))}
                          </div>
                        )}
                        <p className={cn("mt-1 text-[10px] opacity-60", message.role === "user" ? "text-right" : "text-left")}>
                          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-kawaii-purple/10">
            <AnimatePresence>
              {(isRecording || isTranscribing) && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="mb-2 flex items-center justify-center"
                >
                  <Badge className={cn(
                    "rounded-full px-3 py-1 text-xs gap-1.5",
                    isRecording ? "bg-red-100 text-red-600" : "bg-kawaii-purple/20 text-kawaii-purple"
                  )}>
                    {isRecording ? (
                      <>
                        <motion.div
                          className="h-2 w-2 rounded-full bg-red-500"
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                        />
                        Recording... Click stop when done
                      </>
                    ) : (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Transcribing speech...
                      </>
                    )}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-2">
              {isMicSupported && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleMicClick}
                    disabled={isTranscribing || isLoading}
                    className={cn(
                      "h-11 w-11 shrink-0 rounded-2xl border-2 transition-all",
                      isRecording
                        ? "border-red-400 bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-950"
                        : "border-kawaii-purple/30 hover:border-kawaii-purple/60"
                    )}
                    title={isRecording ? "Stop recording" : "Record voice"}
                  >
                    {isRecording ? (
                      <Square className="h-4 w-4 fill-current" />
                    ) : isTranscribing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                </motion.div>
              )}

              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRecording ? "🎤 Recording... click stop when done" : "Type or speak in English..."}
                disabled={isRecording || isTranscribing}
                className="min-h-[44px] max-h-32 resize-none rounded-2xl border-kawaii-purple/20 bg-white/50 dark:bg-gray-800/50"
                rows={1}
              />

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading || isRecording || isTranscribing}
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
              💡 5 XP per message • Bonus coins every 5 messages • 🎤 AI voice input
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
