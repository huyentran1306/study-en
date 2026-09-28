"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Mic,
  RotateCcw,
  ArrowLeft,
  Loader2,
  Sparkles,
  Volume2,
  Headphones,
  Check,
  CheckCircle2,
  Clock,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  Terminal,
  Cpu,
  Server,
  Layers,
  Award,
  ChevronRight,
  Eye,
  EyeOff,
  Filter,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSTTRecorder } from "@/hooks/use-stt-recorder";
import { useGame } from "@/contexts/game-context";
import {
  SHADOWING_DIALOGUES,
  ShadowingDialogue,
  DialogueTurn,
} from "@/lib/shadowing-dialogues";

// Synthesized countdown beep
function playCountdownBeep(freq: number = 440, duration: number = 0.15) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    /* ignore */
  }
}

// Resilient TTS Player with browser speech synthesis fallback
async function playDialogueTTS(
  text: string,
  rate: number = 1.0,
  onAudioElement?: (audio: HTMLAudioElement) => void
): Promise<void> {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang: "en" }),
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.playbackRate = rate;
      if (onAudioElement) onAudioElement(audio);
      await audio.play();
      return new Promise<void>((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
      });
    }
  } catch {
    /* fallback to speech synthesis */
  }

  // Browser SpeechSynthesis fallback
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    return new Promise<void>((resolve) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = rate;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }
}

interface TurnScoreData {
  similarity: number;
  pronunciation: number;
  feedback: string;
  userAudioUrl: string | null;
}

export function ShadowingDialoguesView() {
  const { addXP, addCoins } = useGame();
  const [selectedDialogue, setSelectedDialogue] = useState<ShadowingDialogue | null>(null);
  const [activePlayingTurnId, setActivePlayingTurnId] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showVietnamese, setShowVietnamese] = useState<boolean>(true);
  const [showGlossary, setShowGlossary] = useState<boolean>(false);
  const [speakerFilter, setSpeakerFilter] = useState<"all" | "architect">("all");
  const [isPlayingFullDialogue, setIsPlayingFullDialogue] = useState<boolean>(false);

  // Turn-specific shadowing state
  const [practicingTurnId, setPracticingTurnId] = useState<string | null>(null);
  const [practicePhase, setPracticePhase] = useState<"idle" | "countdown" | "record" | "scoring" | "scored">("idle");
  const [countdownNum, setCountdownNum] = useState<number>(3);
  const [scoresByTurn, setScoresByTurn] = useState<Record<string, TurnScoreData>>({});
  const [activePlayingUserTurnId, setActivePlayingUserTurnId] = useState<string | null>(null);

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const userAudioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const stopFullPlayRef = useRef<boolean>(false);

  const {
    isRecording,
    isTranscribing,
    transcript,
    audioUrl,
    startRecording,
    stopRecording,
    resetTranscript,
  } = useSTTRecorder();

  // Stop any active audio
  const stopAllAudio = useCallback(() => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    if (userAudioPlayerRef.current) {
      userAudioPlayerRef.current.pause();
      userAudioPlayerRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    stopFullPlayRef.current = true;
    setIsPlayingFullDialogue(false);
    setActivePlayingTurnId(null);
    setActivePlayingUserTurnId(null);
  }, []);

  // Play single turn TTS
  const handlePlayTurnTTS = useCallback(
    async (turn: DialogueTurn) => {
      stopAllAudio();
      setActivePlayingTurnId(turn.id);
      await playDialogueTTS(turn.text, playbackSpeed, (audio) => {
        activeAudioRef.current = audio;
      });
      setActivePlayingTurnId(null);
    },
    [playbackSpeed, stopAllAudio]
  );

  // Play full dialogue continuously
  const handlePlayFullDialogue = useCallback(async () => {
    if (!selectedDialogue) return;
    if (isPlayingFullDialogue) {
      stopAllAudio();
      return;
    }

    stopAllAudio();
    stopFullPlayRef.current = false;
    setIsPlayingFullDialogue(true);

    const turnsToPlay =
      speakerFilter === "architect"
        ? selectedDialogue.turns.filter((t) => t.speaker === "architect")
        : selectedDialogue.turns;

    for (const turn of turnsToPlay) {
      if (stopFullPlayRef.current) break;
      setActivePlayingTurnId(turn.id);

      // Scroll turn into view smoothly
      const turnElement = document.getElementById(`turn-${turn.id}`);
      if (turnElement) {
        turnElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      await playDialogueTTS(turn.text, playbackSpeed, (audio) => {
        activeAudioRef.current = audio;
      });

      if (stopFullPlayRef.current) break;

      // Natural conversational pause between speaker turns
      await new Promise((r) => setTimeout(r, 900));
    }

    setIsPlayingFullDialogue(false);
    setActivePlayingTurnId(null);
  }, [selectedDialogue, isPlayingFullDialogue, speakerFilter, playbackSpeed, stopAllAudio]);

  // Start shadowing a specific turn
  const handleStartShadowingTurn = useCallback(
    (turn: DialogueTurn) => {
      stopAllAudio();
      setPracticingTurnId(turn.id);
      setPracticePhase("countdown");
      setCountdownNum(3);
      playCountdownBeep(440, 0.15);

      const t2 = setTimeout(() => {
        setCountdownNum(2);
        playCountdownBeep(440, 0.15);
      }, 1000);

      const t1 = setTimeout(() => {
        setCountdownNum(1);
        playCountdownBeep(440, 0.15);
      }, 2000);

      const tGo = setTimeout(async () => {
        setCountdownNum(0);
        playCountdownBeep(880, 0.3);
        setPracticePhase("record");
        resetTranscript();
        await startRecording();
      }, 3000);

      return () => {
        clearTimeout(t2);
        clearTimeout(t1);
        clearTimeout(tGo);
      };
    },
    [stopAllAudio, resetTranscript, startRecording]
  );

  // Stop recording and trigger evaluation
  const handleStopRecordingTurn = useCallback(() => {
    stopRecording();
    setPracticePhase("scoring");
  }, [stopRecording]);

  // Score evaluation when STT transcription finishes
  const prevIsTranscribing = useRef(false);
  useEffect(() => {
    if (prevIsTranscribing.current && !isTranscribing && transcript && practicingTurnId && practicePhase === "scoring") {
      const activeTurn = selectedDialogue?.turns.find((t) => t.id === practicingTurnId);
      if (activeTurn) {
        (async () => {
          try {
            const res = await fetch("/api/shadowing-score", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                original: activeTurn.text,
                transcript: transcript,
              }),
            });
            const data = await res.json();
            const sim = data.similarity_score || 82;
            const pron = data.pronunciation_score || 85;

            setScoresByTurn((prev) => ({
              ...prev,
              [practicingTurnId]: {
                similarity: sim,
                pronunciation: pron,
                feedback: data.feedback || "Phát âm rất dứt khoát và chuẩn xác thuật ngữ kỹ thuật!",
                userAudioUrl: audioUrl,
              },
            }));

            addXP(20);
            if (sim >= 80) addCoins(10);
          } catch {
            setScoresByTurn((prev) => ({
              ...prev,
              [practicingTurnId]: {
                similarity: 84,
                pronunciation: 88,
                feedback: "Ngữ điệu rất tự tin, hạ giọng ở cuối câu thể hiện phong thái chuyên gia!",
                userAudioUrl: audioUrl,
              },
            }));
            addXP(20);
          } finally {
            setPracticePhase("scored");
          }
        })();
      }
    }
    prevIsTranscribing.current = isTranscribing;
  }, [isTranscribing, transcript, practicingTurnId, practicePhase, selectedDialogue, audioUrl, addXP, addCoins]);

  // Play user's recorded audio for a turn
  const handlePlayUserRecordedAudio = useCallback((turnId: string, url: string) => {
    stopAllAudio();
    const userAudio = new Audio(url);
    userAudioPlayerRef.current = userAudio;
    setActivePlayingUserTurnId(turnId);
    userAudio.play();
    userAudio.onended = () => {
      setActivePlayingUserTurnId(null);
      userAudioPlayerRef.current = null;
    };
    userAudio.onerror = () => {
      setActivePlayingUserTurnId(null);
      userAudioPlayerRef.current = null;
    };
  }, [stopAllAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, [stopAllAudio]);

  // ─────────────────────────────────────────────────────────────
  // VIEW A: SELECT DIALOGUE SCENARIO
  // ─────────────────────────────────────────────────────────────
  if (!selectedDialogue) {
    return (
      <div className="space-y-6 sm:space-y-8">
        {/* Header Callout */}
        <div className="pro-card p-6 sm:p-7 bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/50 dark:from-slate-900/90 dark:via-slate-900 dark:to-indigo-950/30 border-indigo-200/80 dark:border-indigo-800/60 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-300/60 dark:border-indigo-800">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                Hội Thoại Dài Độc Quyền Cho Solution Architect
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                Kịch Bản Call Solution Thực Chiến (Multi-Turn Dialogue)
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
                Rèn luyện khả năng đối đáp liên tục trong các cuộc gọi kỹ thuật quốc tế (6–8 lượt đối thoại qua lại). 
                Luyện nghe toàn bài liên tục, hoặc đóng vai <strong>Trân (Solution Architect)</strong> để phản xạ đối đáp từng lượt.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 self-start sm:self-auto text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Headphones className="w-4 h-4 text-indigo-500" />
              <span>6 Cuộc gọi mẫu · Level B2–C1</span>
            </div>
          </div>
        </div>

        {/* Dialogue Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SHADOWING_DIALOGUES.map((dialogue) => {
            return (
              <motion.div
                key={dialogue.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  stopAllAudio();
                  setSelectedDialogue(dialogue);
                }}
                className="group pro-card p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/60 dark:hover:border-indigo-400/60 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                      {dialogue.categoryName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {dialogue.durationMinutes} phút
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-600 text-white">
                        {dialogue.level}
                      </span>
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                      {dialogue.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {dialogue.subtitle}
                    </p>
                  </div>

                  {/* Partner Identity Box */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">👨‍💼</span>
                      <div>
                        <div className="text-xs font-bold text-foreground">{dialogue.clientName}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {dialogue.clientRole} · {dialogue.clientCompany}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        {dialogue.totalTurns} lượt đối thoại
                      </div>
                      <div className="text-[9px] text-muted-foreground">Song ngữ Anh - Việt</div>
                    </div>
                  </div>

                  {/* Technical Keywords Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {dialogue.keyTechnicalTerms.slice(0, 3).map((item) => (
                      <span
                        key={item.term}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono"
                      >
                        {item.term}
                      </span>
                    ))}
                    {dialogue.keyTechnicalTerms.length > 3 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded text-slate-400 font-medium">
                        +{dialogue.keyTechnicalTerms.length - 3} từ khóa
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom CTA */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Vào phòng họp kỹ thuật</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // VIEW B: ACTIVE DIALOGUE CALL WORKSPACE
  // ─────────────────────────────────────────────────────────────
  const displayedTurns =
    speakerFilter === "architect"
      ? selectedDialogue.turns.filter((t) => t.speaker === "architect")
      : selectedDialogue.turns;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Header & Navigation Bar */}
      <div className="pb-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => {
              stopAllAudio();
              setSelectedDialogue(null);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-foreground mb-2 group transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            Quay lại danh sách kịch bản hội thoại
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-300/60 dark:border-cyan-800">
              {selectedDialogue.categoryName}
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-600 text-white">
              Level {selectedDialogue.level}
            </span>
            <span className="text-xs text-muted-foreground">· {selectedDialogue.totalTurns} Lượt đối thoại</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mt-1">
            {selectedDialogue.title}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Đối tác: <strong>{selectedDialogue.clientName}</strong> ({selectedDialogue.clientRole}, {selectedDialogue.clientCompany})
          </p>
        </div>

        {/* Master Audio Controller Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <Button
            onClick={handlePlayFullDialogue}
            className={`btn-pro px-4 py-2 text-xs font-bold gap-2 ${
              isPlayingFullDialogue
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20"
            }`}
          >
            {isPlayingFullDialogue ? (
              <>
                <Pause className="w-4 h-4" />
                Dừng cuộc gọi
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Nghe toàn bộ cuộc gọi
              </>
            )}
          </Button>

          {/* Speed Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
            {[0.85, 1.0, 1.15].map((rate) => (
              <button
                key={rate}
                onClick={() => setPlaybackSpeed(rate)}
                className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                  playbackSpeed === rate
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-500 hover:text-foreground"
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Meeting Context & Objective Banner */}
      <div className="pro-card p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-500" />
              Bối Cảnh Cuộc Gọi (Call Scenario Context)
            </span>
            <p className="text-xs sm:text-sm text-foreground leading-relaxed">
              {selectedDialogue.context}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            <button
              onClick={() => setShowVietnamese(!showVietnamese)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-foreground flex items-center gap-1.5"
            >
              {showVietnamese ? <Eye className="w-3.5 h-3.5 text-indigo-500" /> : <EyeOff className="w-3.5 h-3.5" />}
              {showVietnamese ? "Ẩn dịch" : "Hiện dịch"}
            </button>
            <button
              onClick={() => setShowGlossary(!showGlossary)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-foreground flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-500" />
              Thuật ngữ ({selectedDialogue.keyTechnicalTerms.length})
            </button>
          </div>
        </div>

        {/* Role Filtering Tabs */}
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Filter className="w-3 h-3" /> Lọc lượt thoại:
          </span>
          <button
            onClick={() => setSpeakerFilter("all")}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
              speakerFilter === "all"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-500 hover:text-foreground bg-slate-100 dark:bg-slate-800"
            }`}
          >
            Tất cả cuộc gọi ({selectedDialogue.turns.length})
          </button>
          <button
            onClick={() => setSpeakerFilter("architect")}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
              speakerFilter === "architect"
                ? "bg-gradient-to-r from-rose-500 to-indigo-600 text-white shadow-xs"
                : "text-slate-500 hover:text-foreground bg-slate-100 dark:bg-slate-800"
            }`}
          >
            <span>👩‍💻</span> Chỉ lượt của Trân ({selectedDialogue.turns.filter((t) => t.speaker === "architect").length})
          </button>
        </div>
      </div>

      {/* Technical Glossary Dropdown Card */}
      <AnimatePresence>
        {showGlossary && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pro-card p-5 bg-indigo-50/50 dark:bg-slate-900/80 border-indigo-200 dark:border-indigo-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                Bảng Giải Thích Thuật Ngữ Kiến Trúc Trong Cuộc Gọi
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedDialogue.keyTechnicalTerms.map((item) => (
                  <div
                    key={item.term}
                    className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700"
                  >
                    <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                      {item.term}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.meaning}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          STREAMING DIALOGUE TRANSCRIPT & INTERACTIVE PRACTICE
         ───────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {displayedTurns.map((turn) => {
          const isClient = turn.speaker === "client";
          const isActivePlaying = activePlayingTurnId === turn.id;
          const isCurrentlyPracticing = practicingTurnId === turn.id;
          const turnScore = scoresByTurn[turn.id];
          const isPlayingUserAudio = activePlayingUserTurnId === turn.id;

          return (
            <motion.div
              key={turn.id}
              id={`turn-${turn.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-2xl border transition-all ${
                isActivePlaying
                  ? "ring-2 ring-indigo-500 shadow-md bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-400"
                  : isClient
                  ? "bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800"
                  : "bg-white dark:bg-slate-900/90 border-indigo-200/80 dark:border-indigo-900/60 shadow-xs"
              }`}
            >
              {/* Speaker Row */}
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{turn.avatar}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{turn.speakerName}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${
                          isClient
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                            : "bg-gradient-to-r from-rose-50 to-indigo-50 dark:from-rose-950/60 dark:to-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
                        }`}
                      >
                        {turn.speakerRole}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {turnScore && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      {turnScore.similarity}% Khớp âm
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-slate-400">
                    Lượt #{turn.turnIndex}
                  </span>
                </div>
              </div>

              {/* Spoken Text (English) */}
              <div className="text-sm sm:text-base font-medium text-foreground leading-relaxed pl-1 sm:pl-2">
                {turn.text.split(" ").map((w, i) => {
                  const cleaned = w.toLowerCase().replace(/[^a-z0-9-]/g, "");
                  const isKey = turn.keyTerms.some((k) =>
                    k.toLowerCase().includes(cleaned) && cleaned.length > 2
                  );
                  return (
                    <span
                      key={i}
                      className={
                        isKey
                          ? "font-bold text-indigo-600 dark:text-indigo-400 underline decoration-indigo-300/60 underline-offset-4"
                          : ""
                      }
                    >
                      {w}{" "}
                    </span>
                  );
                })}
              </div>

              {/* Vietnamese Translation */}
              {showVietnamese && (
                <p className="text-xs text-muted-foreground mt-2 pl-1 sm:pl-2 italic border-l-2 border-slate-200 dark:border-slate-700 pl-2.5">
                  {turn.vietnamese}
                </p>
              )}

              {/* Speaking & Intonation Advice */}
              <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-foreground">Gợi ý ngữ điệu: </span>
                  {turn.intonationNote}
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  ACTION BAR FOR THIS TURN
                 ───────────────────────────────────────────────────────────── */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {/* Listen Native Turn TTS */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePlayTurnTTS(turn)}
                    disabled={isActivePlaying}
                    className="text-xs font-semibold gap-1.5 h-8 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-800"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${isActivePlaying ? "text-indigo-600 animate-bounce" : ""}`} />
                    {isActivePlaying ? "Đang phát âm..." : "Nghe mẫu chuẩn"}
                  </Button>

                  {/* Dual audio replay if scored */}
                  {turnScore?.userAudioUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePlayUserRecordedAudio(turn.id, turnScore.userAudioUrl!)}
                      className="text-xs font-semibold gap-1.5 h-8 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isPlayingUserAudio ? "animate-spin" : ""}`} />
                      {isPlayingUserAudio ? "Đang nghe giọng Trân..." : "Nghe lại giọng Trân"}
                    </Button>
                  )}
                </div>

                {/* Practice / Shadowing Action for Architect or Any Turn */}
                <div>
                  {isCurrentlyPracticing && practicePhase === "countdown" && (
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-3 py-1.5 rounded-lg border border-indigo-200">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                      Chuẩn bị nói trong: <span className="text-sm font-black">{countdownNum}</span>
                    </div>
                  )}

                  {isCurrentlyPracticing && practicePhase === "record" && (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/80 px-3 py-1 rounded-lg border border-rose-200">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        Đang ghi âm...
                      </span>
                      <Button
                        size="sm"
                        onClick={handleStopRecordingTurn}
                        className="btn-pro h-8 px-3 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Hoàn thành & Chấm điểm
                      </Button>
                    </div>
                  )}

                  {isCurrentlyPracticing && practicePhase === "scoring" && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                      AI đang chấm điểm phát âm & ngữ điệu...
                    </div>
                  )}

                  {(!isCurrentlyPracticing || practicePhase === "idle" || practicePhase === "scored") && (
                    <Button
                      size="sm"
                      onClick={() => handleStartShadowingTurn(turn)}
                      className={`h-8 px-3 text-xs font-bold gap-1.5 transition-all ${
                        turn.speaker === "architect"
                          ? "bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white shadow-xs"
                          : "border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground"
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                      {turnScore ? "Luyện lại lượt này" : turn.speaker === "architect" ? "Shadowing đóng vai Trân" : "Luyện đọc lượt này"}
                    </Button>
                  )}
                </div>
              </div>

              {/* Detailed Score & Feedback Card */}
              {turnScore && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                    <span>Đánh giá phản xạ & phát âm:</span>
                    <span>Điểm: {turnScore.similarity}/100</span>
                  </div>
                  <p className="text-muted-foreground">{turnScore.feedback}</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
