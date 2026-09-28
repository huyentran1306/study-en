"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame, useTranslation } from "@/contexts/game-context";
import {
  ArrowLeft,
  Zap,
  Trophy,
  Flame,
  Volume2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Layers,
  Code2,
  Briefcase,
  Check,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// ─── Minimal Web Audio Sound Effects ─────────────────────────────
function playChime(type: "correct" | "wrong" | "combo" | "win") {
  if (typeof window === "undefined") return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "correct") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12); // G5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } else if (type === "combo") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.18); // C6
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } else if (type === "wrong") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(240, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(170, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === "win") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch {
    // AudioContext blocked
  }
}

// ═══════════════════════════════════════════════════════════════════
// GAME 1: TECH LEAD RAPID DECISION BLITZ
// ═══════════════════════════════════════════════════════════════════
interface Scenario {
  id: number;
  situation: string;
  contextVi: string;
  category: string;
  options: {
    text: string;
    isCorrect: boolean;
    feedback: string;
  }[];
  keyCollocation: string;
}

const DECISION_SCENARIOS: Scenario[] = [
  {
    id: 1,
    situation: "The client VP insists on adding 3 major features just 4 days before your scheduled MVP release.",
    contextVi: "Khách hàng muốn nhồi thêm 3 tính năng lớn 4 ngày trước ngày bàn giao MVP.",
    category: "Scope Negotiation",
    options: [
      {
        text: "I understand the urgency of these additions. However, introducing them now poses critical regression risks for Friday. We propose shipping the core MVP first, then scheduling these in a dedicated fast-follow sprint next Monday.",
        isCorrect: true,
        feedback: "Xuất sắc! Ngoại giao, đồng cảm nhưng cương quyết bảo vệ tính ổn định (regression risks) kèm phương án khả thi (fast-follow sprint).",
      },
      {
        text: "No way, our sprint is already locked and your team requested this far too late.",
        isCorrect: false,
        feedback: "Quá thô lỗ và mang tính công kích trực diện đối tác.",
      },
      {
        text: "We will try our best to work overnight and push the code directly to production.",
        isCorrect: false,
        feedback: "Thiếu tính chuyên nghiệp, dễ dẫn đến thảm họa sập production.",
      },
      {
        text: "We should cancel the release entirely and wait for next month.",
        isCorrect: false,
        feedback: "Tiêu cực và gây mất niềm tin nơi ban giám đốc đối tác.",
      },
    ],
    keyCollocation: "poses critical regression risks • dedicated fast-follow sprint",
  },
  {
    id: 2,
    situation: "Database latency spikes to P99 > 3000ms during peak business hours. The client is asking for an immediate status update.",
    contextVi: "Database bị quá tải P99 > 3s vào giờ cao điểm, khách yêu cầu báo cáo ngay tình hình.",
    category: "Incident Management",
    options: [
      {
        text: "We don't know why it's slow. Maybe AWS is having an issue, please wait.",
        isCorrect: false,
        feedback: "Đùn đẩy trách nhiệm và thể hiện sự thiếu kiểm soát telemetry.",
      },
      {
        text: "We are actively monitoring elevated latency on the primary DB connection pool. We have isolated the expensive analytical queries and are failing over read operations to replicas to restore baseline performance immediately.",
        isCorrect: true,
        feedback: "Chuẩn phong thái Tech Lead: Có số liệu (elevated latency), đã khoanh vùng (isolated queries) và hành động khẩn cấp (failover to read replicas).",
      },
      {
        text: "The server is very broken right now, our developers are rushing to restart everything.",
        isCorrect: false,
        feedback: "Gây hoang mang không cần thiết và thiếu từ vựng chuyên ngành.",
      },
      {
        text: "Everything looks normal on our laptops, maybe your internet connection is slow.",
        isCorrect: false,
        feedback: "Đổ lỗi cho khách hàng là điều cấm kỵ.",
      },
    ],
    keyCollocation: "isolated expensive queries • failover read operations to replicas",
  },
  {
    id: 3,
    situation: "The product manager asks why the engineering team needs a 2-week technical debt refactoring sprint with zero new UI features.",
    contextVi: "Product Manager thắc mắc vì sao team cần 2 tuần dọn Technical Debt mà không làm tính năng mới nào.",
    category: "Technical Debt",
    options: [
      {
        text: "This architectural hardening directly targets high-risk technical debt. By decoupling the monolithic billing service now, we will reduce regression bugs by 40% and accelerate upcoming feature delivery.",
        isCorrect: true,
        feedback: "Đỉnh cao! Dùng ngôn ngữ kinh doanh (reduce regression by 40%, accelerate upcoming delivery) để bảo vệ quyết định kỹ thuật.",
      },
      {
        text: "Because our old code is horrible and developers hate working with it.",
        isCorrect: false,
        feedback: "Cảm tính cá nhân, không mang lại giá trị thuyết phục cho stakeholder.",
      },
      {
        text: "Refactoring is standard software practice. Every programmer needs to do it.",
        isCorrect: false,
        feedback: "Chung chung, không chỉ rõ ROI (Return on Investment) của 2 tuần refactor.",
      },
      {
        text: "If you don't give us 2 weeks, the whole system will eventually crash.",
        isCorrect: false,
        feedback: "Đe dọa tiêu cực thay vì giải thích trade-off.",
      },
    ],
    keyCollocation: "architectural hardening • decouple monolithic service • accelerate delivery",
  },
  {
    id: 4,
    situation: "During code review, two senior engineers are deadlocked over state management architecture (Redux vs React Query/Zustand).",
    contextVi: "Hai senior dev tranh cãi gay gắt trong PR về việc chọn thư viện State Management.",
    category: "Engineering Leadership",
    options: [
      {
        text: "Let's benchmark both approaches against our bundle size budget and caching requirements. I will facilitate a 20-minute architecture sync today so we can align on trade-offs and reach a consensus.",
        isCorrect: true,
        feedback: "Lãnh đạo xuất sắc: Đưa ra tiêu chí khách quan (benchmark, bundle size, caching) và đóng vai trò điều phối (facilitate alignment).",
      },
      {
        text: "Whoever opened the PR first gets to decide the library.",
        isCorrect: false,
        feedback: "Thiếu tư duy kiến trúc và làm nản lòng thành viên.",
      },
      {
        text: "Stop arguing in comments, just flip a coin and move on.",
        isCorrect: false,
        feedback: "Hời hợt, xem nhẹ chuẩn mực kiến trúc dự án.",
      },
      {
        text: "I will rewrite both implementations myself over the weekend.",
        isCorrect: false,
        feedback: "Micro-management quá đà, làm thui chột tính tự chủ của team.",
      },
    ],
    keyCollocation: "benchmark against budget • facilitate architecture sync • align on trade-offs",
  },
  {
    id: 5,
    situation: "A junior developer accidentally pushed an unmasked API secret key to a public GitHub repo.",
    contextVi: "Junior dev vô tình commit API secret key lên GitHub public.",
    category: "Security & Blameless Post-Mortem",
    options: [
      {
        text: "We must immediately revoke and rotate the compromised credential, audit access logs for anomalous activity, and then conduct a blameless post-mortem to integrate pre-commit secret scanners.",
        isCorrect: true,
        feedback: "Chuẩn quy trình bảo mật: Revoke ngay lập tức, kiểm tra access logs và cải tiến hệ thống bằng pre-commit scanner (Blameless culture).",
      },
      {
        text: "Shame on you, I will report this mistake directly to HR for a penalty.",
        isCorrect: false,
        feedback: "Phá hủy văn hóa an toàn tâm lý (psychological safety) của đội ngũ kỹ sư.",
      },
      {
        text: "Just do a git reset and force push, nobody saw it anyway.",
        isCorrect: false,
        feedback: "Ảo tưởng nguy hiểm! Bot tự động quét key trên GitHub chỉ trong vài giây.",
      },
      {
        text: "Let's keep quiet and hope the hacker doesn't notice.",
        isCorrect: false,
        feedback: "Vi phạm nghiêm trọng đạo đức nghề nghiệp và quy chuẩn bảo mật.",
      },
    ],
    keyCollocation: "revoke and rotate credentials • audit access logs • blameless post-mortem",
  },
];

function DecisionBlitzGame() {
  const { addXP, addCoins } = useGame();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isAnswered, setIsAnswered] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scenario = DECISION_SCENARIOS[currentIndex];

  useEffect(() => {
    if (isAnswered || gameOver) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleTimeOut();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isAnswered, gameOver, currentIndex]);

  const handleTimeOut = () => {
    setIsAnswered(true);
    setSelectedOption(-1);
    setStreak(0);
    playChime("wrong");
  };

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedOption(idx);
    const chosen = scenario.options[idx];

    if (chosen.isCorrect) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      const points = 20 + nextStreak * 5;
      setScore((s) => s + points);
      addXP(points);
      addCoins(Math.floor(points / 3));
      if (nextStreak >= 2) {
        playChime("combo");
      } else {
        playChime("correct");
      }
    } else {
      setStreak(0);
      playChime("wrong");
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < DECISION_SCENARIOS.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(20);
    } else {
      setGameOver(true);
      playChime("win");
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setTimeLeft(20);
    setGameOver(false);
  };

  const playTTS = async (text: string) => {
    setTtsLoading(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang: "en" }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(url);
      audioRef.current.play();
    } catch (e) {
      console.error(e);
    } finally {
      setTtsLoading(false);
    }
  };

  if (gameOver) {
    return (
      <div className="text-center py-12 space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center text-3xl">
          🏆
        </div>
        <div>
          <h3 className="text-2xl font-black text-foreground">Decision Blitz Hoàn Thành!</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Bạn đã rèn luyện phản xạ ra quyết định & đàm phán cấp độ Tech Lead.
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900 text-white max-w-sm mx-auto border border-slate-800 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Executive Score</span>
          <p className="text-4xl font-black text-white">{score} <span className="text-sm font-normal text-slate-400">pts</span></p>
        </div>
        <div className="flex justify-center gap-3">
          <Button onClick={handleRestart} className="btn-pro text-xs font-bold px-6">
            Thử thách lại vòng mới
          </Button>
        </div>
      </div>
    );
  }

  const correctOption = scenario.options.find((o) => o.isCorrect);

  return (
    <div className="space-y-6">
      {/* Top HUD */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground">
            Tình huống {currentIndex + 1} / {DECISION_SCENARIOS.length}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
            {scenario.category}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {streak >= 2 && (
            <div className="flex items-center gap-1 text-xs font-black text-orange-500 animate-pulse">
              <Flame className="w-4 h-4 fill-orange-500" />
              <span>{streak}x STREAK</span>
            </div>
          )}

          {/* Timer countdown ring */}
          <div className="flex items-center gap-1.5">
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs ${
              timeLeft <= 5 ? "border-rose-500 text-rose-500 animate-bounce" : "border-indigo-500 text-indigo-600 dark:text-indigo-400"
            }`}>
              {timeLeft}
            </div>
            <span className="text-[10px] text-muted-foreground font-semibold">giây</span>
          </div>

          <div className="font-extrabold text-sm text-foreground tabular-nums">
            ⭐ {score}
          </div>
        </div>
      </div>

      {/* Scenario Card */}
      <div className="pro-card p-6 border-indigo-500/30 bg-slate-900 text-white space-y-2">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4" />
          <span>Real-world Dilemma (Tình huống thực tế)</span>
        </div>
        <h3 className="text-base sm:text-lg font-bold leading-relaxed text-white">
          &ldquo;{scenario.situation}&rdquo;
        </h3>
        <p className="text-xs text-slate-400 italic">
          Bối cảnh: {scenario.contextVi}
        </p>
      </div>

      {/* Options List */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-muted-foreground block">
          Chọn câu phản hồi chuẩn phong thái Tech Lead nhất:
        </span>
        {scenario.options.map((opt, idx) => {
          let btnClass = "border-border hover:border-indigo-500/60 bg-card text-foreground";
          if (isAnswered) {
            if (opt.isCorrect) {
              btnClass = "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold";
            } else if (selectedOption === idx) {
              btnClass = "border-rose-500 bg-rose-50/20 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 opacity-80";
            } else {
              btnClass = "opacity-40 border-border bg-card text-muted-foreground";
            }
          }

          return (
            <motion.button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={isAnswered}
              className={`w-full text-left p-4 rounded-xl border transition-all text-xs sm:text-sm leading-relaxed flex items-start gap-3 ${btnClass}`}
              whileHover={!isAnswered ? { scale: 1.005 } : {}}
              whileTap={!isAnswered ? { scale: 0.995 } : {}}
            >
              <span className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1">{opt.text}</span>
              {isAnswered && opt.isCorrect && (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Explanation & Next */}
      <AnimatePresence>
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pro-card p-5 space-y-4 border-indigo-500/30 bg-indigo-50/10 dark:bg-indigo-950/20"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                  💡 Executive Debrief (Phân tích chiêu thức)
                </span>
                <p className="text-xs text-foreground leading-relaxed">
                  {selectedOption !== null && selectedOption >= 0
                    ? scenario.options[selectedOption].feedback
                    : "Đã hết thời gian! Hãy xem câu trả lời chuẩn xác bên dưới."}
                </p>
                <div className="mt-2 text-[11px] font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 px-2.5 py-1.5 rounded-lg border border-indigo-500/20 inline-block">
                  Cụm từ then chốt: <strong>{scenario.keyCollocation}</strong>
                </div>
              </div>

              {correctOption && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => playTTS(correctOption.text)}
                  className="rounded-xl text-xs gap-1.5 flex-shrink-0 border-indigo-200 dark:border-indigo-800"
                >
                  {ttsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>Nghe câu chuẩn</span>
                </Button>
              )}
            </div>

            <Button onClick={handleNext} className="btn-pro w-full text-xs font-bold gap-2">
              <span>{currentIndex + 1 < DECISION_SCENARIOS.length ? "Tình huống kế tiếp" : "Xem kết quả chung cuộc"}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// GAME 2: SYNTAX & PHRASE ARCHITECT (Sentence Assembly)
// ═══════════════════════════════════════════════════════════════════
interface SentencePuzzle {
  id: number;
  context: string;
  chunks: string[];
  fullSentence: string;
  vietnamese: string;
}

const SENTENCE_PUZZLES: SentencePuzzle[] = [
  {
    id: 1,
    context: "Đề xuất kiến trúc Caching khi chịu tải cao",
    chunks: [
      "Given the unexpected spike in traffic,",
      "we strongly recommend",
      "implementing distributed caching",
      "to safeguard our primary database.",
    ],
    fullSentence: "Given the unexpected spike in traffic, we strongly recommend implementing distributed caching to safeguard our primary database.",
    vietnamese: "Trước tình hình lượng truy cập tăng vọt bất ngờ, chúng tôi khuyến nghị triển khai caching phân tán để bảo vệ database chính.",
  },
  {
    id: 2,
    context: "Giải thích chiến lược triển khai Canary an toàn",
    chunks: [
      "To mitigate regression risks",
      "during the major release,",
      "we will execute a canary rollout",
      "across five percent of active users.",
    ],
    fullSentence: "To mitigate regression risks during the major release, we will execute a canary rollout across five percent of active users.",
    vietnamese: "Để giảm thiểu rủi ro lỗi trong đợt release lớn, chúng tôi sẽ triển khai canary rollout cho 5% người dùng thực tế.",
  },
  {
    id: 3,
    context: "Bảo vệ đợt Refactor nợ kỹ thuật",
    chunks: [
      "Although this refactoring effort",
      "requires two dedicated sprints,",
      "it will dramatically reduce",
      "our long-term maintenance overhead.",
    ],
    fullSentence: "Although this refactoring effort requires two dedicated sprints, it will dramatically reduce our long-term maintenance overhead.",
    vietnamese: "Dù nỗ lực tái cấu trúc này cần 2 sprint tập trung, nó sẽ giảm đáng kể chi phí bảo trì lâu dài.",
  },
  {
    id: 4,
    context: "Báo cáo tiến độ cô lập sự cố hệ thống",
    chunks: [
      "We have isolated the root cause",
      "to a database connection leak,",
      "and an urgent hotfix",
      "is currently being validated in staging.",
    ],
    fullSentence: "We have isolated the root cause to a database connection leak, and an urgent hotfix is currently being validated in staging.",
    vietnamese: "Chúng tôi đã khoanh vùng nguyên nhân gốc rễ là do rò rỉ kết nối DB, và bản hotfix khẩn cấp đang được nghiệm thu trên môi trường staging.",
  },
  {
    id: 5,
    context: "Đàm phán lịch trình SLA với khách hàng",
    chunks: [
      "In order to adhere to our agreed SLA,",
      "we propose offloading",
      "high-volume analytical workloads",
      "to dedicated read replicas.",
    ],
    fullSentence: "In order to adhere to our agreed SLA, we propose offloading high-volume analytical workloads to dedicated read replicas.",
    vietnamese: "Để tuân thủ đúng cam kết SLA đã thỏa thuận, chúng tôi đề xuất đẩy tải các tác vụ phân tích nặng sang máy chủ bản sao chỉ đọc.",
  },
];

function SyntaxArchitectGame() {
  const { addXP, addCoins } = useGame();
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [assembled, setAssembled] = useState<string[]>([]);
  const [available, setAvailable] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [ttsLoading, setTtsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const puzzle = SENTENCE_PUZZLES[puzzleIndex];

  // Shuffle chunks when puzzle changes
  useEffect(() => {
    const shuffled = [...puzzle.chunks].sort(() => Math.random() - 0.5);
    setAvailable(shuffled);
    setAssembled([]);
    setIsCorrect(null);
  }, [puzzleIndex, puzzle.chunks]);

  const handlePickChunk = (chunk: string, idx: number) => {
    setAssembled((prev) => [...prev, chunk]);
    setAvailable((prev) => prev.filter((_, i) => i !== idx));
    setIsCorrect(null);
  };

  const handleRemoveChunk = (chunk: string, idx: number) => {
    setAvailable((prev) => [...prev, chunk]);
    setAssembled((prev) => prev.filter((_, i) => i !== idx));
    setIsCorrect(null);
  };

  const handleCheck = () => {
    const candidate = assembled.join(" ");
    if (candidate === puzzle.fullSentence) {
      setIsCorrect(true);
      setScore((s) => s + 25);
      addXP(25);
      addCoins(10);
      playChime("combo");
    } else {
      setIsCorrect(false);
      playChime("wrong");
    }
  };

  const handleNext = () => {
    if (puzzleIndex + 1 < SENTENCE_PUZZLES.length) {
      setPuzzleIndex((i) => i + 1);
    } else {
      playChime("win");
    }
  };

  const playTTS = async (text: string) => {
    setTtsLoading(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang: "en" }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(url);
      audioRef.current.play();
    } catch (e) {
      console.error(e);
    } finally {
      setTtsLoading(false);
    }
  };

  const isCompletedAll = puzzleIndex >= SENTENCE_PUZZLES.length - 1 && isCorrect;

  return (
    <div className="space-y-6">
      {/* HUD */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border">
        <div>
          <span className="text-xs font-bold text-muted-foreground">
            Câu trúc {puzzleIndex + 1} / {SENTENCE_PUZZLES.length}
          </span>
          <h4 className="text-xs sm:text-sm font-bold text-foreground mt-0.5">{puzzle.context}</h4>
        </div>
        <div className="text-sm font-extrabold text-foreground tabular-nums">
          ⭐ {score} pts
        </div>
      </div>

      {/* Vietnamese meaning card */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
          Nội dung thông điệp cần truyền tải:
        </span>
        <p className="text-sm font-medium text-foreground leading-relaxed">
          &ldquo;{puzzle.vietnamese}&rdquo;
        </p>
      </div>

      {/* Assembly Area */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-muted-foreground block">
          Khung cấu trúc câu (Bấm để gỡ bỏ cụm từ):
        </span>
        <div className="min-h-[100px] p-4 rounded-2xl bg-card border-2 border-dashed border-indigo-500/30 flex flex-wrap gap-2 items-center">
          {assembled.length === 0 ? (
            <span className="text-xs text-muted-foreground italic">
              Bấm các khối bên dưới theo thứ tự cú pháp chuẩn xác để hoàn chỉnh câu...
            </span>
          ) : (
            assembled.map((chunk, idx) => (
              <motion.button
                key={idx}
                onClick={() => handleRemoveChunk(chunk, idx)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs sm:text-sm shadow-sm hover:bg-rose-600 transition-colors flex items-center gap-1.5"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <span>{chunk}</span>
                <span className="text-[10px] opacity-75">✕</span>
              </motion.button>
            ))
          )}
        </div>
      </div>

      {/* Available Chunks Pool */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-muted-foreground block">
          Các khối từ vựng thành phần (Bấm để lắp vào câu):
        </span>
        <div className="flex flex-wrap gap-2.5">
          {available.map((chunk, idx) => (
            <motion.button
              key={idx}
              onClick={() => handlePickChunk(chunk, idx)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-foreground font-semibold text-xs sm:text-sm hover:border-indigo-500/60 transition-all text-left"
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {chunk}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Action / Result */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setAvailable([...puzzle.chunks].sort(() => Math.random() - 0.5));
            setAssembled([]);
            setIsCorrect(null);
          }}
          className="rounded-xl text-xs gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Làm lại câu này</span>
        </Button>

        {isCorrect === null && (
          <Button
            onClick={handleCheck}
            disabled={assembled.length === 0}
            className="btn-pro text-xs font-bold px-6"
          >
            Kiểm tra cấu trúc câu
          </Button>
        )}

        {isCorrect === false && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-rose-500 font-semibold flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> Thứ tự chưa chuẩn! Hãy thử sắp xếp lại.
            </span>
            <Button onClick={handleCheck} className="btn-pro text-xs font-bold">
              Thử lại
            </Button>
          </div>
        )}

        {isCorrect === true && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => playTTS(puzzle.fullSentence)}
              className="rounded-xl text-xs gap-1.5 border-emerald-500/50 text-emerald-600 dark:text-emerald-400"
            >
              {ttsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>Nghe câu hoàn chỉnh</span>
            </Button>

            {!isCompletedAll ? (
              <Button onClick={handleNext} className="btn-pro text-xs font-bold gap-1.5">
                <span>Câu tiếp theo</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <Check className="w-4 h-4" /> Xuất sắc! Đã hoàn thành toàn bộ bài tập.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// GAME 3: ARCHITECTURE & ACRONYM SPEED SHOWDOWN (45s Sprint)
// ═══════════════════════════════════════════════════════════════════
interface TermChallenge {
  definition: string;
  term: string;
  choices: string[];
}

const TERM_CHALLENGES: TermChallenge[] = [
  {
    definition: "Thiết kế ngắt kết nối tạm thời đến service đang lỗi để tránh gây sập toàn bộ hệ thống",
    term: "Circuit Breaker",
    choices: ["Circuit Breaker", "Deadlock Handler", "Load Balancer", "Reverse Proxy"],
  },
  {
    definition: "Khái niệm chỉ một API thực thi nhiều lần với cùng input vẫn cho ra trạng thái và kết quả duy nhất",
    term: "Idempotency",
    choices: ["Idempotency", "Concurrency", "Polymorphism", "Immutability"],
  },
  {
    definition: "Hiện tượng yêu cầu của dự án liên tục phình to ngoài hợp đồng mà không tăng thêm ngân sách hoặc thời gian",
    term: "Scope Creep",
    choices: ["Scope Creep", "Sprint Backlog", "Burn Down", "Technical Debt"],
  },
  {
    definition: "Chiến lược release phiên bản mới cho một lượng nhỏ người dùng trước khi triển khai toàn diện",
    term: "Canary Deployment",
    choices: ["Canary Deployment", "Blue-Green Release", "Shadow Traffic", "Rolling Update"],
  },
  {
    definition: "Khả năng hệ thống vẫn chạy các tính năng cốt lõi khi các module phụ bị tê liệt",
    term: "Graceful Degradation",
    choices: ["Graceful Degradation", "Failover Cluster", "High Availability", "Fault Isolation"],
  },
  {
    definition: "Độ trễ tối đa của 99% lượng request nhanh nhất, dùng để đo lường trải nghiệm tệ nhất của người dùng",
    term: "P99 Latency",
    choices: ["P99 Latency", "Throughput SLA", "Average Latency", "Error Budget"],
  },
  {
    definition: "Chi phí gánh nặng tương lai phát sinh khi chọn giải pháp code tạm bợ nhanh thay vì thiết kế chuẩn",
    term: "Technical Debt",
    choices: ["Technical Debt", "Legacy Overhead", "Code Bloat", "Deprecation Bug"],
  },
  {
    definition: "Mô hình tách biệt hoàn toàn giữa luồng ghi dữ liệu (Command) và luồng đọc dữ liệu (Query)",
    term: "CQRS",
    choices: ["CQRS", "Event Sourcing", "ACID", "RESTful"],
  },
];

function TerminologySprintGame() {
  const { addXP, addCoins } = useGame();
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [active, setActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const current = TERM_CHALLENGES[index % TERM_CHALLENGES.length];

  useEffect(() => {
    if (!active || gameOver) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setGameOver(true);
          playChime("win");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [active, gameOver]);

  const handleStart = () => {
    setActive(true);
    setGameOver(false);
    setTimeLeft(45);
    setScore(0);
    setStreak(0);
    setIndex(0);
  };

  const handleAnswer = (choice: string) => {
    if (!active || gameOver) return;
    if (choice === current.term) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      const points = 15 + nextStreak * 3;
      setScore((s) => s + points);
      addXP(points);
      addCoins(Math.floor(points / 4));
      setFeedback("correct");
      if (nextStreak >= 3) playChime("combo");
      else playChime("correct");
    } else {
      setStreak(0);
      setFeedback("wrong");
      playChime("wrong");
    }

    setTimeout(() => {
      setFeedback(null);
      setIndex((i) => i + 1);
    }, 400);
  };

  if (!active && !gameOver) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center text-3xl">
          ⚡
        </div>
        <h3 className="text-xl font-bold text-foreground">Architecture Acronym Speed Sprint</h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
          45 giây thử thách phản xạ nhanh các thuật ngữ kiến trúc, mẫu thiết kế và từ viết tắt thường gặp trong các cuộc họp giải pháp quốc tế.
        </p>
        <Button onClick={handleStart} className="btn-pro text-xs font-bold px-8 py-3">
          Bắt đầu Sprint 45s
        </Button>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="text-center py-12 space-y-5">
        <div className="text-5xl">🎯</div>
        <h3 className="text-2xl font-black text-foreground">Hết Giờ! Hoàn Thành Sprint</h3>
        <div className="p-6 rounded-2xl bg-slate-900 text-white max-w-sm mx-auto border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Điểm số đạt được</span>
          <p className="text-4xl font-black text-white">{score} <span className="text-sm font-normal text-slate-400">pts</span></p>
        </div>
        <div className="flex justify-center gap-3">
          <Button onClick={handleStart} className="btn-pro text-xs font-bold px-6">
            Chơi lại lượt mới
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top HUD */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-sm">
            <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
              timeLeft <= 10 ? "border-rose-500 text-rose-500 animate-pulse" : "border-indigo-500 text-indigo-600 dark:text-indigo-400"
            }`}>
              {timeLeft}
            </span>
            <span className="text-xs text-muted-foreground">giây</span>
          </div>

          {streak >= 2 && (
            <div className="flex items-center gap-1 text-xs font-black text-orange-500">
              <Flame className="w-4 h-4 fill-orange-500" />
              <span>{streak}x COMBO</span>
            </div>
          )}
        </div>

        <div className="text-sm font-extrabold text-foreground tabular-nums">
          ⭐ {score} pts
        </div>
      </div>

      {/* Question Card */}
      <motion.div
        key={index}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="pro-card p-6 border-indigo-500/30 bg-slate-900 text-white text-center space-y-2 min-h-[140px] flex flex-col justify-center"
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
          Thuật ngữ kiến trúc tương ứng là gì?
        </span>
        <h3 className="text-base sm:text-lg font-bold leading-relaxed text-white">
          &ldquo;{current.definition}&rdquo;
        </h3>
      </motion.div>

      {/* Choices Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {current.choices.map((choice, i) => (
          <motion.button
            key={i}
            onClick={() => handleAnswer(choice)}
            className="p-4 rounded-xl border border-border bg-card hover:border-indigo-500/60 font-bold text-xs sm:text-sm text-foreground transition-all text-left flex items-center justify-between"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>{choice}</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// GAME 4: EXECUTIVE TRADE-OFF MATCH (Pairs)
// ═══════════════════════════════════════════════════════════════════
const PAIR_DATA = [
  { term: "Circuit Breaker", meaning: "Ngắt tạm thời service lỗi tránh cascade failure", icon: "🛡️" },
  { term: "Graceful Degradation", meaning: "Hạ cấp tính năng phụ giữ service lõi hoạt động", icon: "⚙️" },
  { term: "Technical Debt", meaning: "Gánh nặng sửa đổi do code vội giải pháp tạm thời", icon: "💳" },
  { term: "Scope Creep", meaning: "Yêu cầu phình to ngoài phạm vi thỏa thuận ban đầu", icon: "📈" },
  { term: "Canary Rollout", meaning: "Thử nghiệm version mới trên 5% user thực tế", icon: "🐥" },
  { term: "Idempotent API", meaning: "Gọi nhiều lần cùng payload vẫn cho kết quả duy nhất", icon: "🔁" },
];

function ExecutiveMatchGame() {
  const { addXP, addCoins } = useGame();
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [selectedMeaning, setSelectedMeaning] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [shuffledMeanings, setShuffledMeanings] = useState<string[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const meanings = PAIR_DATA.map((p) => p.meaning).sort(() => Math.random() - 0.5);
    setShuffledMeanings(meanings);
    setMatched(new Set());
    setSelectedTerm(null);
    setSelectedMeaning(null);
  }, []);

  const handleTermClick = (idx: number) => {
    if (matched.has(idx)) return;
    setSelectedTerm(idx);

    if (selectedMeaning !== null) {
      checkMatch(idx, selectedMeaning);
    }
  };

  const handleMeaningClick = (idx: number) => {
    const meaningText = shuffledMeanings[idx];
    const isAlreadyMatched = PAIR_DATA.some(
      (p, i) => matched.has(i) && p.meaning === meaningText
    );
    if (isAlreadyMatched) return;

    setSelectedMeaning(idx);

    if (selectedTerm !== null) {
      checkMatch(selectedTerm, idx);
    }
  };

  const checkMatch = (termIdx: number, meaningIdx: number) => {
    const chosenMeaning = shuffledMeanings[meaningIdx];
    if (PAIR_DATA[termIdx].meaning === chosenMeaning) {
      setMatched((prev) => new Set([...prev, termIdx]));
      setScore((s) => s + 20);
      addXP(20);
      addCoins(5);
      playChime("combo");
    } else {
      playChime("wrong");
    }
    setSelectedTerm(null);
    setSelectedMeaning(null);
  };

  const isComplete = matched.size === PAIR_DATA.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
        <div>
          <span className="text-xs font-bold text-muted-foreground">Tiến độ ghép đôi</span>
          <p className="text-xs sm:text-sm font-bold text-foreground">
            Đã hoàn thành {matched.size} / {PAIR_DATA.length} cặp
          </p>
        </div>
        <div className="text-sm font-extrabold text-foreground tabular-nums">
          ⭐ {score} pts
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Term column */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-muted-foreground block text-center">Thuật ngữ Tech Lead (EN)</span>
          {PAIR_DATA.map((p, idx) => {
            const isMatched = matched.has(idx);
            const isSelected = selectedTerm === idx;
            return (
              <button
                key={idx}
                disabled={isMatched}
                onClick={() => handleTermClick(idx)}
                className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm font-bold transition-all flex items-center justify-between ${
                  isMatched
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 opacity-50"
                    : isSelected
                    ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20"
                    : "bg-card border-border hover:border-indigo-500/50 text-foreground"
                }`}
              >
                <span>{p.term}</span>
                <span>{p.icon}</span>
              </button>
            );
          })}
        </div>

        {/* Meaning column */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-muted-foreground block text-center">Định nghĩa & Ý nghĩa (VI)</span>
          {shuffledMeanings.map((meaning, idx) => {
            const isMatched = PAIR_DATA.some(
              (p, i) => matched.has(i) && p.meaning === meaning
            );
            const isSelected = selectedMeaning === idx;
            return (
              <button
                key={idx}
                disabled={isMatched}
                onClick={() => handleMeaningClick(idx)}
                className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all ${
                  isMatched
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 opacity-50"
                    : isSelected
                    ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20"
                    : "bg-card border-border hover:border-indigo-500/50 text-foreground"
                }`}
              >
                <span>{meaning}</span>
              </button>
            );
          })}
        </div>
      </div>

      {isComplete && (
        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <h4 className="font-bold text-base text-foreground">Ghép đôi hoàn hảo!</h4>
          <p className="text-xs text-muted-foreground">Bạn đã củng cố vững chắc 6 khái niệm kiến trúc quan trọng.</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN ARENA HUB
// ═══════════════════════════════════════════════════════════════════
type GameMode = "decision" | "syntax" | "sprint" | "match";

export default function GamesPage() {
  const [activeMode, setActiveMode] = useState<GameMode | null>(null);

  const gameCards: {
    id: GameMode;
    title: string;
    subtitle: string;
    badge: string;
    icon: string;
    desc: string;
    gradient: string;
  }[] = [
    {
      id: "decision",
      title: "Tech Lead Rapid Decision Blitz",
      subtitle: "Xử lý khủng hoảng & đàm phán",
      badge: "High Stakes",
      icon: "⚡",
      desc: "20 giây đối mặt với các tình huống hóc búa: sập production, khách ép deadline, tranh cãi kiến trúc. Chọn phản hồi chuẩn đẳng cấp Tech Lead.",
      gradient: "from-indigo-600 to-violet-600",
    },
    {
      id: "syntax",
      title: "Syntax & Phrase Architect",
      subtitle: "Lắp ráp câu Collocation kỹ thuật",
      badge: "Structure",
      icon: "🧩",
      desc: "Thay vì sắp xếp từng chữ cái đơn điệu, bạn tái cấu trúc các mệnh đề tiếng Anh kỹ thuật phức hợp (Subordinate clause, SLA, Caching trade-offs).",
      gradient: "from-sky-600 to-indigo-600",
    },
    {
      id: "sprint",
      title: "Architecture Terminology Sprint",
      subtitle: "Đấu trí tốc độ 45 giây",
      badge: "Speed Run",
      icon: "🎯",
      desc: "45 giây phản xạ liên thanh các thuật ngữ P99 Latency, Circuit Breaker, Idempotency, Scope Creep thường xuất hiện trong Solution Call.",
      gradient: "from-amber-500 to-orange-600",
    },
    {
      id: "match",
      title: "Executive Trade-off Match",
      subtitle: "Ghép đôi khái niệm & giải pháp",
      badge: "Tactical",
      icon: "💼",
      desc: "Nối nhanh các thuật ngữ chuyên môn với bản chất giải pháp kiến trúc để củng cố phản xạ liên kết thần kinh.",
      gradient: "from-emerald-600 to-teal-600",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Top back button */}
      <div className="flex items-center gap-3">
        {activeMode ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveMode(null)}
            className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách Arena
          </Button>
        ) : (
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Về trang chủ Dashboard
          </Link>
        )}
      </div>

      {/* Header if not in game */}
      {!activeMode && (
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <span>Executive Arena • Pro Edition</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Tech Lead Language & Decision Arena
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Hệ thống rèn luyện phản xạ ngôn ngữ thực chiến dưới áp lực thời gian. Thay thế các trò chơi con nít đơn giản bằng mô phỏng tình huống đàm phán, kiến trúc và thuật ngữ chuyên sâu.
          </p>
        </div>
      )}

      {/* Game Selector or Active Game */}
      {!activeMode ? (
        <motion.div
          className="grid gap-4 sm:grid-cols-2"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {gameCards.map((g) => (
            <motion.button
              key={g.id}
              onClick={() => setActiveMode(g.id)}
              className="group p-6 rounded-2xl bg-card border border-border text-left shadow-xs hover:border-indigo-500/50 hover:shadow-md transition-all flex flex-col justify-between"
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${g.gradient} flex items-center justify-center text-white text-2xl shadow-xs`}
                  >
                    {g.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                    {g.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {g.title}
                </h3>
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">
                  {g.subtitle}
                </span>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {g.desc}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-border flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <span>Vào phòng rèn luyện</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </motion.button>
          ))}
        </motion.div>
      ) : (
        <motion.div
          className="rounded-2xl bg-card border border-border p-6 shadow-xs"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {activeMode === "decision" && <DecisionBlitzGame />}
          {activeMode === "syntax" && <SyntaxArchitectGame />}
          {activeMode === "sprint" && <TerminologySprintGame />}
          {activeMode === "match" && <ExecutiveMatchGame />}
        </motion.div>
      )}
    </div>
  );
}
