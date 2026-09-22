"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Volume2,
  RotateCcw,
  Loader2,
  ArrowLeft,
  Sparkles,
  Briefcase,
  Coffee,
  MessageSquare,
  GraduationCap,
  Award,
  Play,
  Activity,
  Headphones,
} from "lucide-react";
import Link from "next/link";
import { useSTTRecorder } from "@/hooks/use-stt-recorder";
import { useGame } from "@/contexts/game-context";

const PERSONAS = [
  {
    id: "partner",
    name: "AI Conversation Partner",
    roleTag: "Daily Fluency",
    icon: MessageSquare,
    description: "Đàm thoại tự nhiên, phản xạ đời sống và trao đổi đa chủ đề hàng ngày.",
    gradient: "from-sky-600 to-indigo-600",
    greeting: "Good day! How is everything going with you today? Let's practice speaking naturally!",
  },
  {
    id: "interviewer",
    name: "Job Interviewer",
    roleTag: "Career & Executive",
    icon: Award,
    description: "Mô phỏng phỏng vấn xin việc, trả lời câu hỏi tình huống & kỹ năng chuyên môn.",
    gradient: "from-indigo-600 to-violet-600",
    greeting: "Good morning! Thank you for joining this interview. Could you please introduce yourself and your background?",
  },
  {
    id: "colleague",
    name: "Senior Colleague",
    roleTag: "Workplace & Standup",
    icon: Briefcase,
    description: "Giao tiếp công sở, họp nhanh (standup), thảo luận tiến độ và cộng tác dự án.",
    gradient: "from-emerald-600 to-teal-600",
    greeting: "Hey there! Glad to connect. How is your current project coming along?",
  },
  {
    id: "teacher",
    name: "Executive Speech Coach",
    roleTag: "Pronunciation & Intonation",
    icon: GraduationCap,
    description: "Huấn luyện phát âm, chuẩn hóa ngữ điệu câu và sửa lỗi trực tiếp.",
    gradient: "from-violet-600 to-purple-600",
    greeting: "Hello! I am your speech coach. What topic or speaking scenario would you like to master today?",
  },
  {
    id: "barista",
    name: "Coffee Barista & Travel",
    roleTag: "Situational Small Talk",
    icon: Coffee,
    description: "Order đồ uống, hỏi đường, trao đổi thực tế tại nhà hàng, khách sạn và sân bay.",
    gradient: "from-amber-600 to-orange-600",
    greeting: "Welcome to Artisan Brew! What can I craft for you today?",
  },
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

async function playTTS(text: string) {
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
    return new Promise<void>((resolve) => {
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
    });
  } catch (e) {
    console.error("TTS playback error:", e);
  }
}

async function fetchAIResponse(messages: Message[], role: string): Promise<string> {
  const res = await fetch("/api/voice-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, role }),
  });

  if (!res.ok || !res.body) return "Sorry, I didn't catch that. Could you say that once more?";

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6).trim();
        if (data === "[DONE]") break;
        try {
          const parsed = JSON.parse(data);
          const token = parsed.response || parsed.choices?.[0]?.delta?.content || "";
          fullText += token;
        } catch {
          // skip malformed chunk
        }
      }
    }
  }

  return fullText.trim() || "That is an insightful point. Please tell me more.";
}

/** Dynamic audio waveform visualizer bars */
function AudioWaveform({ active, variant }: { active: boolean; variant: "user" | "ai" }) {
  const bars = [16, 28, 44, 20, 36, 52, 24, 40, 18, 32, 48, 22];
  const color = variant === "user" ? "bg-rose-500" : "bg-indigo-500";

  return (
    <div className="flex items-center justify-center gap-1 h-12 px-4 py-2">
      {bars.map((h, i) => (
        <motion.span
          key={i}
          className={`w-1 rounded-full ${color}`}
          animate={
            active
              ? {
                  height: [8, h, 12, h * 0.8, 10],
                  opacity: [0.6, 1, 0.7, 0.9, 0.6],
                }
              : { height: 6, opacity: 0.3 }
          }
          transition={
            active
              ? {
                  duration: 0.8 + (i % 4) * 0.15,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.05,
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

export default function VoicePage() {
  const { addXP, addCoins } = useGame();
  const [selectedPersona, setSelectedPersona] = useState<(typeof PERSONAS)[0] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);

  const {
    isRecording,
    isTranscribing,
    transcript,
    startRecording,
    stopRecording,
    resetTranscript,
    isSupported,
  } = useSTTRecorder();

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const startConversation = useCallback(async (persona: (typeof PERSONAS)[0]) => {
    setSelectedPersona(persona);
    setMessages([{ role: "assistant", content: persona.greeting }]);
    setIsAISpeaking(true);
    await playTTS(persona.greeting);
    setIsAISpeaking(false);
  }, []);

  const handleUserSpeech = useCallback(
    async (text: string) => {
      if (!text.trim() || !selectedPersona) return;
      resetTranscript();
      setIsProcessing(true);

      const newMessages: Message[] = [...messages, { role: "user", content: text }];
      setMessages(newMessages);
      addXP(5);

      try {
        const aiText = await fetchAIResponse(newMessages, selectedPersona.id);
        const updatedMessages: Message[] = [...newMessages, { role: "assistant", content: aiText }];
        setMessages(updatedMessages);
        setTurnCount((c) => c + 1);
        if ((turnCount + 1) % 3 === 0) addCoins(10);

        setIsAISpeaking(true);
        await playTTS(aiText);
        setIsAISpeaking(false);
      } catch (e) {
        console.error("AI voice response error:", e);
      } finally {
        setIsProcessing(false);
      }
    },
    [messages, selectedPersona, resetTranscript, addXP, addCoins, turnCount]
  );

  useEffect(() => {
    if (transcript && !isRecording && !isProcessing) {
      handleUserSpeech(transcript);
    }
  }, [transcript, isRecording, isProcessing, handleUserSpeech]);

  const handleMicPress = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else if (!isAISpeaking && !isProcessing) {
      startRecording();
    }
  }, [isRecording, isAISpeaking, isProcessing, startRecording, stopRecording]);

  // View: Persona Selection
  if (!selectedPersona) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Về trang chủ
          </Link>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold border border-indigo-500/20">
            <Headphones className="w-3.5 h-3.5" />
            <span>Low-Latency Realtime Speech</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Phòng Luyện Nói Realtime AI
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Đàm thoại bằng giọng nói tự nhiên, không cần gõ phím. Lựa chọn đối tác đàm thoại phù hợp với mục tiêu của bạn để bắt đầu phiên luyện tập.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {PERSONAS.map((persona) => {
            const Icon = persona.icon;
            return (
              <motion.div
                key={persona.id}
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => startConversation(persona)}
                className="cursor-pointer group relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:border-indigo-500/50 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${persona.gradient} flex items-center justify-center text-white shadow-xs`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                      {persona.roleTag}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {persona.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {persona.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <span>Bắt đầu cuộc gọi</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  const isBusy = isAISpeaking || isProcessing || isTranscribing;
  const micActive = isRecording;
  const PersonaIcon = selectedPersona.icon;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 flex flex-col" style={{ height: "calc(100dvh - 84px)" }}>
      {/* Session Top Bar */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
        <button
          onClick={() => {
            setSelectedPersona(null);
            setMessages([]);
            setTurnCount(0);
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Đổi đối tác
        </button>

        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
          <div
            className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${selectedPersona.gradient} flex items-center justify-center text-white`}
          >
            <PersonaIcon className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-foreground">{selectedPersona.name}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="w-3.5 h-3.5 text-indigo-500" />
          <span className="font-semibold tabular-nums">{turnCount}</span> lượt nói
        </div>
      </div>

      {/* Transcript Log Area */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto space-y-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800/80 mb-4 shadow-xs"
      >
        <AnimatePresence>
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? "bg-indigo-600 text-white rounded-br-xs shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800/90 text-foreground border border-slate-200/60 dark:border-slate-700/60 rounded-bl-xs shadow-xs"
                  }`}
                >
                  {!isUser && (
                    <div className="flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      <span>{selectedPersona.name}</span>
                      <button
                        onClick={() => playTTS(msg.content)}
                        className="hover:text-indigo-500 p-0.5 transition-colors"
                        title="Nghe lại câu này"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <p>{msg.content}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Processing Indicator */}
        {(isProcessing || isTranscribing) && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              Đang phân tích và xử lý phản xạ...
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Audio Waveform Equalizer */}
      <div className="mb-3 flex items-center justify-center">
        <AudioWaveform
          active={micActive || isAISpeaking}
          variant={micActive ? "user" : "ai"}
        />
      </div>

      {/* Realtime STT Floating Preview */}
      <AnimatePresence>
        {isRecording && transcript && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="mb-3 px-4 py-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 text-xs text-indigo-700 dark:text-indigo-300 italic text-center"
          >
            &ldquo;{transcript}...&rdquo;
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls: Big Mic Button & Reset */}
      <div className="flex flex-col items-center gap-2 pb-2">
        <motion.button
          type="button"
          onPointerDown={handleMicPress}
          onPointerUp={() => {
            if (isRecording) stopRecording();
          }}
          disabled={isBusy && !isRecording}
          className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
            micActive
              ? "bg-rose-500 text-white shadow-rose-500/30 scale-105 ring-4 ring-rose-500/20"
              : isBusy
              ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/30"
          }`}
          whileTap={!isBusy ? { scale: 0.95 } : {}}
        >
          {isProcessing || isTranscribing ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : micActive ? (
            <MicOff className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </motion.button>

        <p className="text-xs text-muted-foreground font-medium text-center">
          {micActive
            ? "Đang ghi âm... Thả tay để gửi"
            : isAISpeaking
            ? "AI đang phát âm..."
            : isProcessing
            ? "Đang tư duy phản hồi..."
            : "Chạm và giữ để nói (hoặc bấm 1 lần để bật mic)"}
        </p>

        {!isSupported && (
          <p className="text-xs text-rose-500">Trình duyệt chưa cấp quyền hoặc không hỗ trợ Microphone.</p>
        )}

        <button
          type="button"
          onClick={() => {
            setMessages([{ role: "assistant", content: selectedPersona.greeting }]);
            setTurnCount(0);
            resetTranscript();
          }}
          className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="w-3 h-3" /> Làm mới cuộc trò chuyện
        </button>
      </div>
    </div>
  );
}
