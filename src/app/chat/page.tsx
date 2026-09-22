"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Loader2,
  RotateCcw,
  Mic,
  Square,
  Volume2,
  Sparkles,
  Award,
  Briefcase,
  GraduationCap,
  MessageSquare,
  Wand2,
  CornerDownLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Mascot, MascotMood } from "@/components/mascot";
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
    name: "General Fluency Partner",
    roleTag: "Daily English",
    icon: MessageSquare,
    description: "Luyện phản xạ giao tiếp tự nhiên và linh hoạt về đời sống, tin tức và sở thích.",
    gradient: "from-sky-600 to-indigo-600",
  },
  interviewer: {
    name: "Senior Job Interviewer",
    roleTag: "Career Prep",
    icon: Award,
    description: "Phỏng vấn thử nghiệm, đặt câu hỏi hành vi (STAR) và đánh giá độ tự tin.",
    gradient: "from-indigo-600 to-violet-600",
  },
  colleague: {
    name: "Workplace Colleague",
    roleTag: "Office Standup",
    icon: Briefcase,
    description: "Trao đổi công việc, họp dự án, viết phản hồi email và đàm phán ý kiến.",
    gradient: "from-emerald-600 to-teal-600",
  },
  teacher: {
    name: "Speech & Grammar Mentor",
    roleTag: "Language Coach",
    icon: GraduationCap,
    description: "Chỉ ra lỗi diễn đạt, giải thích ngữ pháp và gợi ý cách dùng từ chuẩn C1.",
    gradient: "from-purple-600 to-pink-600",
  },
};

type RoleKey = keyof typeof AI_ROLES;

const STARTER_PROMPTS = [
  "Can you ask me a common job interview question?",
  "Let's roleplay a standup meeting where I report project updates.",
  "How can I sound more polite when disagreeing in a business meeting?",
  "Let's discuss the future of AI and technology.",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleKey>("partner");
  const [coachMood, setCoachMood] = useState<MascotMood>("happy");
  const [ttsPlayingId, setTtsPlayingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { addXP, addCoins } = useGame();

  const {
    isRecording,
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

  const playTTS = async (text: string, msgId: string) => {
    if (ttsPlayingId === msgId) return;
    setTtsPlayingId(msgId);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang: "en" }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setTtsPlayingId(null);
      };
    } catch {
      setTtsPlayingId(null);
    }
  };

  const sendMessage = useCallback(
    async (overrideText?: string) => {
      const textToSend = (overrideText || input).trim();
      if (!textToSend || isLoading) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: textToSend,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);
      setCoachMood("thinking");

      const assistantId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
        },
      ]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(CHAT_WORKER_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            role: selectedRole,
          }),
        });

        if (!response.ok || !response.body) throw new Error("Request failed");

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
                // skip
              }
            }
          }
        }

        addXP(5);
        const msgCount = messages.filter((m) => m.role === "user").length + 1;
        if (msgCount % 5 === 0) addCoins(10);
        setCoachMood("excited");
        setTimeout(() => setCoachMood("happy"), 2500);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: "Xin lỗi, đã xảy ra lỗi kết nối. Bạn hãy thử lại câu vừa rồi nhé.",
                  }
                : m
            )
          );
          setCoachMood("happy");
        }
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [input, isLoading, messages, selectedRole, addXP, addCoins]
  );

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
  const ActiveIcon = activeRole.icon;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header & AI Coach Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <Mascot mood={coachMood} size="md" />
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-1">
              <span>{activeRole.roleTag}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Phòng Luyện Hội Thoại & Đàm Phán AI
            </h1>
            <p className="text-xs text-muted-foreground">
              Tương tác trực tiếp bằng văn bản hoặc giọng nói. Tích lũy 5 XP cho mỗi phản hồi đàm thoại.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMessages([]);
              abortRef.current?.abort();
            }}
            className="rounded-xl border-slate-200 dark:border-slate-700 text-xs font-semibold gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Làm mới hội thoại
          </Button>
        </div>
      </div>

      {/* Role Selector Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.entries(AI_ROLES) as [RoleKey, (typeof AI_ROLES)[RoleKey]][]).map(
          ([key, role]) => {
            const isSel = selectedRole === key;
            const Icon = role.icon;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelectedRole(key);
                  setMessages([]);
                }}
                className={`p-3.5 text-left rounded-xl border transition-all flex flex-col justify-between ${
                  isSel
                    ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500/60 shadow-xs ring-1 ring-indigo-500/20"
                    : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-white bg-gradient-to-tr ${role.gradient} shadow-xs`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSel && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                    )}
                  </div>
                  <div className="text-xs font-bold text-foreground line-clamp-1">{role.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                    {role.description}
                  </div>
                </div>
              </button>
            );
          }
        )}
      </div>

      {/* Main Chat Interface */}
      <div
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col"
        style={{ height: "58vh" }}
      >
        {/* Active Role Status Bar */}
        <div className="px-5 py-3 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${activeRole.gradient} flex items-center justify-center text-white`}
            >
              <ActiveIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                {activeRole.name}
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <div className="text-[10px] text-muted-foreground font-medium">Llama 3.1 Neural Engine</div>
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">
            {messages.length} tin nhắn
          </span>
        </div>

        {/* Scrollable Message Feed */}
        <ScrollArea className="flex-1 p-4 sm:p-5" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${activeRole.gradient} flex items-center justify-center text-white shadow-sm`}
              >
                <ActiveIcon className="w-6 h-6" />
              </div>
              <div className="max-w-md">
                <h4 className="text-base font-bold text-foreground">
                  Bắt đầu buổi đối thoại với {activeRole.name}
                </h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Nhập tin nhắn hoặc bấm vào một trong các câu hỏi gợi ý bên dưới để bắt đầu luyện phản xạ.
                </p>
              </div>

              {/* Starter Prompt Chips */}
              <div className="flex flex-wrap gap-2 justify-center max-w-lg pt-2">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-700 text-xs font-medium transition-colors text-left"
                  >
                    &ldquo;{prompt}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {messages.map((message) => {
                  const isUser = message.role === "user";
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold shadow-xs",
                          isUser
                            ? "bg-indigo-600 text-white"
                            : `bg-gradient-to-tr ${activeRole.gradient} text-white`
                        )}
                      >
                        {isUser ? "You" : <ActiveIcon className="w-4 h-4" />}
                      </div>

                      <div
                        className={cn(
                          "max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-xs leading-relaxed",
                          isUser
                            ? "bg-indigo-600 text-white rounded-tr-xs"
                            : "bg-slate-100 dark:bg-slate-800 text-foreground border border-slate-200/60 dark:border-slate-700 rounded-tl-xs"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>

                        {/* Assistant message audio playback */}
                        {!isUser && message.content && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => playTTS(message.content, message.id)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:opacity-80 transition-opacity"
                            >
                              <Volume2
                                className={cn(
                                  "w-3.5 h-3.5",
                                  ttsPlayingId === message.id && "animate-pulse"
                                )}
                              />
                              {ttsPlayingId === message.id ? "Đang phát âm..." : "Nghe phát âm chuẩn"}
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {isLoading && (
                <div className="flex gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${activeRole.gradient} flex items-center justify-center text-white`}
                  >
                    <ActiveIcon className="w-4 h-4" />
                  </div>
                  <div className="rounded-2xl rounded-tl-xs bg-slate-100 dark:bg-slate-800 px-4 py-3 text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                    Đang phân tích và tạo câu trả lời phản xạ...
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/70 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {isMicSupported && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleMicClick}
                className={cn(
                  "h-10 w-10 shrink-0 rounded-xl transition-all",
                  isRecording
                    ? "bg-rose-500 text-white hover:bg-rose-600 border-rose-500 animate-pulse"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
                title={isRecording ? "Dừng ghi âm" : "Ghi âm nói tiếng Anh"}
              >
                {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập phản hồi bằng tiếng Anh (hoặc bấm mic để nói)..."
              disabled={isLoading}
              className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-foreground transition-all"
            />

            <Button
              type="button"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="btn-pro h-10 px-4 rounded-xl shrink-0 gap-1.5 text-xs font-semibold"
            >
              <span>Gửi</span>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
