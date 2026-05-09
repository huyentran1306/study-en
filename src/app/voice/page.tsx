"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, RotateCcw, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSTTRecorder } from "@/hooks/use-stt-recorder";
import { useGame } from "@/contexts/game-context";

const PERSONAS = [
  {
    id: "partner",
    name: "Conversation Partner",
    emoji: "🗣️",
    description: "Casual everyday chat",
    gradient: "from-sky-400 to-blue-500",
    greeting: "Hey! How's your day going? I'm here to practice English with you!",
  },
  {
    id: "barista",
    name: "Coffee Shop Barista",
    emoji: "☕",
    description: "Order drinks, make small talk",
    gradient: "from-amber-400 to-orange-500",
    greeting: "Welcome! What can I get for you today? We have lots of great drinks on the menu!",
  },
  {
    id: "colleague",
    name: "Work Colleague",
    emoji: "💼",
    description: "Workplace small talk",
    gradient: "from-green-400 to-emerald-500",
    greeting: "Oh hey! Glad I ran into you. How's the project coming along?",
  },
  {
    id: "interviewer",
    name: "Job Interviewer",
    emoji: "👔",
    description: "Mock interview practice",
    gradient: "from-purple-400 to-violet-500",
    greeting: "Good morning! Thank you for coming in today. Please tell me a bit about yourself.",
  },
  {
    id: "teacher",
    name: "English Teacher",
    emoji: "📚",
    description: "Learn while chatting",
    gradient: "from-pink-400 to-rose-500",
    greeting: "Hello! I'm so happy to practice English with you today. What topic would you like to talk about?",
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

async function fetchAIResponse(
  messages: Message[],
  role: string
): Promise<string> {
  const res = await fetch("/api/voice-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, role }),
  });

  if (!res.ok || !res.body) return "Sorry, I didn't catch that. Could you say it again?";

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
        } catch { /* skip */ }
      }
    }
  }

  return fullText.trim() || "That's interesting! Tell me more.";
}

export default function VoicePage() {
  const { addXP, addCoins } = useGame();
  const [selectedPersona, setSelectedPersona] = useState<typeof PERSONAS[0] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);

  const { isRecording, isTranscribing, transcript, startRecording, stopRecording, resetTranscript, isSupported } = useSTTRecorder();

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const startConversation = useCallback(async (persona: typeof PERSONAS[0]) => {
    setSelectedPersona(persona);
    setMessages([{ role: "assistant", content: persona.greeting }]);
    setIsAISpeaking(true);
    await playTTS(persona.greeting);
    setIsAISpeaking(false);
  }, []);

  // When STT produces a transcript, send it to AI
  useEffect(() => {
    if (transcript && !isRecording && !isProcessing) {
      handleUserSpeech(transcript);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, isRecording]);

  const handleUserSpeech = useCallback(async (text: string) => {
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
      console.error("AI response error:", e);
    } finally {
      setIsProcessing(false);
    }
  }, [messages, selectedPersona, resetTranscript, addXP, addCoins, turnCount]);

  const handleMicPress = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else if (!isAISpeaking && !isProcessing) {
      startRecording();
    }
  }, [isRecording, isAISpeaking, isProcessing, startRecording, stopRecording]);

  if (!selectedPersona) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/">
            <motion.div className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" whileHover={{ x: -3 }}>
              <ArrowLeft className="w-4 h-4" /> Back
            </motion.div>
          </Link>
        </div>
        <h1 className="text-2xl font-bold mb-1">
          <span className="bg-gradient-kawaii bg-clip-text text-transparent">🎙️ Full Voice Mode</span>
        </h1>
        <p className="text-muted-foreground mb-8 text-sm">
          Speak naturally with AI — no typing needed! Choose your practice partner.
        </p>
        <div className="grid gap-4">
          {PERSONAS.map((persona) => (
            <motion.button
              key={persona.id}
              onClick={() => startConversation(persona)}
              className={`p-5 rounded-3xl bg-gradient-to-r ${persona.gradient} text-white text-left shadow-lg`}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="flex items-center gap-4">
                <motion.span className="text-4xl" animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                  {persona.emoji}
                </motion.span>
                <div>
                  <p className="font-bold text-lg">{persona.name}</p>
                  <p className="text-sm opacity-80">{persona.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  const isBusy = isAISpeaking || isProcessing || isTranscribing;
  const micActive = isRecording;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 flex flex-col" style={{ height: "calc(100dvh - 80px)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <motion.button
          onClick={() => { setSelectedPersona(null); setMessages([]); setTurnCount(0); }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          whileHover={{ x: -3 }}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </motion.button>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${selectedPersona.gradient} text-white text-sm font-medium shadow`}>
          <span>{selectedPersona.emoji}</span>
          <span>{selectedPersona.name}</span>
        </div>
        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <span>🔄 {turnCount} turns</span>
        </div>
      </div>

      {/* Chat area */}
      <div ref={chatRef} className="flex-1 overflow-y-auto space-y-3 rounded-3xl bg-white/50 dark:bg-gray-800/50 backdrop-blur p-4 border border-kawaii-purple/10 mb-4">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${msg.role === "user" ? "bg-gradient-kawaii text-white rounded-br-sm" : "bg-white dark:bg-gray-700 shadow-sm rounded-bl-sm"}`}>
                {msg.role === "assistant" && (
                  <p className="text-xs font-bold mb-1 opacity-60">{selectedPersona.emoji} {selectedPersona.name}</p>
                )}
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {(isProcessing || isTranscribing) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl bg-white dark:bg-gray-700 shadow-sm rounded-bl-sm">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div key={i} className="w-2 h-2 rounded-full bg-kawaii-purple/50" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* AI Speaking indicator */}
        {isAISpeaking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-kawaii-sky/20 text-sm text-kawaii-sky font-medium">
              <Volume2 className="w-4 h-4 animate-pulse" />
              AI is speaking...
            </div>
          </motion.div>
        )}
      </div>

      {/* Current transcript preview */}
      <AnimatePresence>
        {isRecording && transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3 px-4 py-2 rounded-2xl bg-kawaii-purple/10 text-sm italic text-muted-foreground"
          >
            🎤 {transcript}...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mic button */}
      <div className="flex flex-col items-center gap-3 pb-2">
        <motion.button
          onPointerDown={handleMicPress}
          onPointerUp={() => { if (isRecording) stopRecording(); }}
          disabled={isBusy && !isRecording}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all ${
            micActive
              ? "bg-gradient-to-br from-rose-400 to-pink-500 scale-110"
              : isBusy
              ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
              : "bg-gradient-kawaii hover:scale-105"
          }`}
          animate={micActive ? { scale: [1.1, 1.15, 1.1] } : {}}
          transition={{ duration: 0.8, repeat: Infinity }}
          whileTap={!isBusy ? { scale: 0.95 } : {}}
        >
          {isProcessing || isTranscribing ? (
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          ) : micActive ? (
            <MicOff className="w-8 h-8 text-white" />
          ) : (
            <Mic className="w-8 h-8 text-white" />
          )}
        </motion.button>

        <p className="text-sm text-muted-foreground text-center">
          {micActive ? "🔴 Recording... tap to stop" : isBusy ? "⏳ Please wait..." : "🎤 Tap to speak"}
        </p>

        {!isSupported && (
          <p className="text-xs text-rose-500">Microphone not supported in this browser</p>
        )}

        <motion.button
          onClick={() => { setMessages([{ role: "assistant", content: selectedPersona.greeting }]); setTurnCount(0); resetTranscript(); }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          whileHover={{ scale: 1.05 }}
        >
          <RotateCcw className="w-3 h-3" /> Start over
        </motion.button>
      </div>
    </div>
  );
}
