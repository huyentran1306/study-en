"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Brain, CheckCircle2, AlertCircle, Volume2, Radio } from "lucide-react";

export type MascotMood = "happy" | "thinking" | "excited" | "cheering" | "shocked" | "sleeping";

interface MascotProps {
  mood?: MascotMood;
  size?: "sm" | "md" | "lg" | "xl";
  message?: string;
  onClick?: () => void;
  className?: string;
  animate?: boolean;
}

const coachingMessages: Record<MascotMood, string[]> = {
  happy: [
    "Sẵn sàng luyện phản xạ cùng bạn.",
    "Mỗi ngày một chủ đề để tự tin giao tiếp.",
    "Chú ý ngữ điệu và trọng âm từ nhé.",
    "Luyện nói đều đặn tạo nên sự lưu loát.",
  ],
  thinking: [
    "Đang phân tích ngữ cảnh câu nói...",
    "Đang gợi ý cách diễn đạt tự nhiên...",
    "Đang xử lý âm học...",
    "Đang kiểm tra từ vựng chuyên môn...",
  ],
  excited: [
    "Cách diễn đạt rất chuẩn bản xứ!",
    "Phát âm chính xác và tự nhiên!",
    "Từ vựng áp dụng rất chuẩn ngữ cảnh!",
    "Tốc độ phản xạ đang cải thiện rõ rệt!",
  ],
  cheering: [
    "Duy trì nhịp độ rèn luyện tuyệt vời!",
    "Gần đạt mốc mục tiêu hôm nay rồi!",
    "Tiếp tục phát huy nhé!",
    "Tự tin hơn qua từng câu nói!",
  ],
  shocked: [
    "Lưu ý lỗi ngữ pháp nhỏ ở câu vừa rồi nhé.",
    "Hãy thử cách diễn đạt tự nhiên hơn.",
    "Kiểm tra lại thì hoặc giới từ nhé!",
    "Không sao, sai sót giúp ta nhớ lâu hơn.",
  ],
  sleeping: [
    "AI Coach ở chế độ chờ.",
    "Bấm mic hoặc nhập tin nhắn để bắt đầu.",
    "Sẵn sàng khi bạn bước vào bài học.",
  ],
};

const sizeConfig = {
  sm: { container: "w-12 h-12", icon: "w-5 h-5", ring: "p-1.5" },
  md: { container: "w-16 h-16", icon: "w-7 h-7", ring: "p-2" },
  lg: { container: "w-24 h-24", icon: "w-10 h-10", ring: "p-3" },
  xl: { container: "w-32 h-32", icon: "w-14 h-14", ring: "p-4" },
};

export function Mascot({
  mood = "happy",
  size = "md",
  message,
  onClick,
  className = "",
  animate = true,
}: MascotProps) {
  const [showMessage, setShowMessage] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");

  const currentSize = sizeConfig[size] || sizeConfig.md;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      const list = coachingMessages[mood] || coachingMessages.happy;
      const randomMsg = list[Math.floor(Math.random() * list.length)];
      setCurrentMessage(randomMsg);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    }
  };

  const getMoodVisual = () => {
    switch (mood) {
      case "thinking":
        return {
          icon: Brain,
          gradient: "from-purple-600 via-indigo-600 to-blue-600",
          glow: "rgba(99, 102, 241, 0.5)",
          label: "Analyzing",
        };
      case "excited":
        return {
          icon: Sparkles,
          gradient: "from-emerald-500 via-teal-500 to-cyan-500",
          glow: "rgba(16, 185, 129, 0.5)",
          label: "Mastery",
        };
      case "cheering":
        return {
          icon: CheckCircle2,
          gradient: "from-amber-500 via-orange-500 to-rose-500",
          glow: "rgba(245, 158, 11, 0.5)",
          label: "Consistent",
        };
      case "shocked":
        return {
          icon: AlertCircle,
          gradient: "from-rose-500 to-orange-500",
          glow: "rgba(244, 63, 94, 0.5)",
          label: "Review",
        };
      case "sleeping":
        return {
          icon: Radio,
          gradient: "from-slate-600 to-slate-700",
          glow: "rgba(100, 116, 139, 0.2)",
          label: "Standby",
        };
      case "happy":
      default:
        return {
          icon: Volume2,
          gradient: "from-indigo-600 via-indigo-500 to-sky-500",
          glow: "rgba(99, 102, 241, 0.4)",
          label: "AI Mentor",
        };
    }
  };

  const visual = getMoodVisual();
  const IconComponent = visual.icon;

  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      {/* Speech / Coaching Bubble */}
      {(showMessage || message) && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="absolute -top-14 z-50 whitespace-nowrap rounded-xl bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 px-3.5 py-1.5 text-xs font-semibold shadow-xl border border-slate-700/50 dark:border-slate-200"
        >
          {message || currentMessage}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-slate-900/95 dark:bg-white/95" />
        </motion.div>
      )}

      {/* Holographic AI Core Button */}
      <motion.button
        type="button"
        onClick={handleClick}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className={`relative ${currentSize.container} rounded-2xl flex items-center justify-center p-0.5 cursor-pointer focus:outline-none`}
        style={{
          boxShadow: `0 0 25px ${visual.glow}`,
        }}
      >
        {/* Animated outer ring */}
        {animate && mood === "thinking" ? (
          <motion.div
            className={`absolute inset-0 rounded-2xl bg-gradient-to-tr ${visual.gradient} opacity-75 blur-xs`}
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
        ) : (
          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-tr ${visual.gradient} opacity-80`} />
        )}

        {/* Inner glass core */}
        <div className="relative w-full h-full rounded-[14px] bg-slate-950/40 backdrop-blur-md flex items-center justify-center border border-white/20">
          <IconComponent className={`${currentSize.icon} text-white drop-shadow-sm`} />

          {/* Micro status pulse dot */}
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                mood === "thinking"
                  ? "bg-purple-400"
                  : mood === "excited"
                  ? "bg-emerald-400"
                  : "bg-indigo-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                mood === "thinking"
                  ? "bg-purple-500"
                  : mood === "excited"
                  ? "bg-emerald-500"
                  : "bg-indigo-500"
              }`}
            />
          </span>
        </div>
      </motion.button>
    </div>
  );
}

export const AICoach = Mascot;
export default Mascot;
