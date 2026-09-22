"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame, translations } from "@/contexts/game-context";
import { Sparkles, Briefcase, MessageSquare, GraduationCap, Clock, Flame, Zap, ArrowRight, Check } from "lucide-react";

type OnboardingStep = "name" | "goal" | "cadence" | "complete";

const GOAL_OPTIONS = [
  {
    id: "career",
    icon: Briefcase,
    title: "Sự nghiệp & Công sở",
    desc: "Phỏng vấn xin việc, họp dự án, đàm phán và viết email chuyên nghiệp.",
  },
  {
    id: "fluency",
    icon: MessageSquare,
    title: "Giao tiếp đời sống & Du lịch",
    desc: "Phản xạ nhanh, nói không khựng, tự tin trò chuyện với người bản xứ.",
  },
  {
    id: "academic",
    icon: GraduationCap,
    title: "Học thuật & Chứng chỉ",
    desc: "Nâng cao vốn từ vựng B2-C1, chuẩn hóa phát âm và ngữ pháp chuyên sâu.",
  },
];

const CADENCE_OPTIONS = [
  { id: "15", time: "15 phút", label: "Tiêu chuẩn", desc: "Duy trì phản xạ đều đặn mỗi ngày", icon: Clock },
  { id: "25", time: "25 phút", label: "Tập trung", desc: "Tăng tốc độ lưu loát và vốn từ", icon: Zap, popular: true },
  { id: "40", time: "40 phút", label: "Chuyên sâu", desc: "Đột phá khả năng đàm thoại thực chiến", icon: Flame },
];

export function OnboardingFlow() {
  const { setLanguage, setUsername, completeOnboarding, language, setPetType } = useGame();
  const [step, setStep] = useState<OnboardingStep>("name");
  const [name, setName] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("career");
  const [selectedCadence, setSelectedCadence] = useState("25");

  const handleNameSubmit = () => {
    if (name.trim()) {
      setUsername(name.trim());
      setStep("goal");
    }
  };

  const handleGoalSubmit = () => {
    setStep("cadence");
  };

  const handleCadenceSubmit = () => {
    setPetType("cat"); // Default companion backend
    setStep("complete");
    setTimeout(() => {
      completeOnboarding(name.trim(), ["en"]);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 z-50 overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 rounded-full bg-sky-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 relative z-10">
        {/* Step indicator */}
        {step !== "complete" && (
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Thiết lập mục tiêu · Bước {step === "name" ? "1" : step === "goal" ? "2" : "3"}/3
              </span>
            </div>
            <div className="flex gap-1.5">
              {(["name", "goal", "cadence"] as const).map((s, idx) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step === s
                      ? "w-6 bg-indigo-600"
                      : (s === "name" && (step === "goal" || step === "cadence")) ||
                        (s === "goal" && step === "cadence")
                      ? "w-3 bg-indigo-400 dark:bg-indigo-700"
                      : "w-3 bg-slate-200 dark:bg-slate-700"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Name & Language */}
          {step === "name" && (
            <motion.div
              key="name"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Chào mừng bạn đến với LinguaPro
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Để cá nhân hóa lộ trình và các phản hồi AI, xin vui lòng cho biết tên của bạn.
                </p>
              </div>

              {/* Language toggle */}
              <div className="flex gap-2">
                {(["vi", "en"] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      language === lang
                        ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                        : "border-slate-200 dark:border-slate-700 text-slate-500 hover:text-foreground"
                    }`}
                  >
                    {lang === "vi" ? "🇻🇳 Tiếng Việt" : "🇬🇧 English"}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Tên của bạn
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                  placeholder="Ví dụ: Hoàng Long, Minh Thư..."
                  maxLength={25}
                  className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-foreground"
                  autoFocus
                />
              </div>

              <button
                type="button"
                onClick={handleNameSubmit}
                disabled={!name.trim()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm hover:shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Tiếp tục
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Step 2: Goal Selection */}
          {step === "goal" && (
            <motion.div
              key="goal"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Mục tiêu trọng tâm của bạn?
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5">
                  LinguaPro sẽ ưu tiên các tình huống và từ vựng phù hợp với nhu cầu của bạn.
                </p>
              </div>

              <div className="space-y-3">
                {GOAL_OPTIONS.map((g) => {
                  const Icon = g.icon;
                  const isSel = selectedGoal === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedGoal(g.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                        isSel
                          ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500/60 shadow-xs"
                          : "bg-white dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isSel
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-foreground">{g.title}</h4>
                          {isSel && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{g.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleGoalSubmit}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm hover:shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                Tiếp tục
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Step 3: Daily Target Cadence */}
          {step === "cadence" && (
            <motion.div
              key="cadence"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Cam kết thời lượng hàng ngày
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Duy trì nhịp độ ngắn nhưng đều đặn là bí quyết giúp người đi làm làm chủ phản xạ tiếng Anh.
                </p>
              </div>

              <div className="space-y-3">
                {CADENCE_OPTIONS.map((c) => {
                  const Icon = c.icon;
                  const isSel = selectedCadence === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCadence(c.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                        isSel
                          ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500/60 shadow-xs"
                          : "bg-white dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            isSel
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-foreground">{c.time} / ngày</h4>
                            {c.popular && (
                              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                Đề xuất
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{c.desc}</p>
                        </div>
                      </div>
                      {isSel && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleCadenceSubmit}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm hover:shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                Hoàn tất & Bước vào Studio
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Step 4: Initializing Complete */}
          {step === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 text-center space-y-4"
            >
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 animate-pulse">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  Không gian học tập đã sẵn sàng, {name}!
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Đang khởi tạo bài học cá nhân hóa và bảng điều khiển phản xạ...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
export default OnboardingFlow;
