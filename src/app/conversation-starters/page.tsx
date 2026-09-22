"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const SITUATIONS = [
  { emoji: "☕", id: "coffee_shop", label: "Gặp người lạ ở quán cafe", en: "Meeting a stranger at a coffee shop" },
  { emoji: "💼", id: "networking", label: "Networking sự kiện chuyên nghiệp", en: "Professional networking event" },
  { emoji: "🤝", id: "new_colleague", label: "Đồng nghiệp mới đầu tiên", en: "First day with a new colleague" },
  { emoji: "✈️", id: "travel", label: "Gặp người nước ngoài khi du lịch", en: "Meeting a foreigner while traveling" },
  { emoji: "🎓", id: "class", label: "Bạn cùng lớp đầu tiên", en: "First-time classmate" },
  { emoji: "👔", id: "interview", label: "Phỏng vấn xin việc", en: "Job interview small talk" },
  { emoji: "🎉", id: "party", label: "Gặp bạn bè của bạn bè", en: "Friend of a friend at a party" },
  { emoji: "🏠", id: "neighbor", label: "Hàng xóm mới chuyển đến", en: "New neighbor moving in" },
];

interface StarterResult {
  openers: Array<{ text: string; tone: string; why: string }>;
  follow_ups: string[];
  tips: string[];
  common_responses: string[];
  cultural_note?: string;
}

const TONE_COLORS: Record<string, string> = {
  friendly: "bg-green-100 text-green-700",
  professional: "bg-blue-100 text-blue-700",
  casual: "bg-yellow-100 text-yellow-700",
  formal: "bg-purple-100 text-purple-700",
  warm: "bg-pink-100 text-pink-700",
  curious: "bg-orange-100 text-orange-700",
};

export default function ConversationStartersPage() {
  const [selected, setSelected] = useState(SITUATIONS[0]);
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StarterResult | null>(null);
  const [playingText, setPlayingText] = useState<string | null>(null);
  const [activeOpener, setActiveOpener] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/conversation-starter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation: selected.en, context }),
      });
      const data = await res.json() as StarterResult;
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const speak = async (text: string) => {
    setPlayingText(text);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: "en" }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => setPlayingText(null);
    } catch {
      setPlayingText(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">← Quay lại</Link>
      <div className="pb-4 border-b border-slate-200/80 dark:border-slate-800 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Conversation Starters & Networking Openers
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1">
          Không biết bắt đầu thế nào? AI gợi ý những câu mở đầu tự nhiên, tinh tế cho từng bối cảnh.
        </p>
      </div>

      {/* Situation picker */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {SITUATIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => { setSelected(s); setResult(null); }}
            className={`text-left p-3.5 rounded-xl border text-xs font-semibold transition-all ${
              selected.id === s.id
                ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-foreground hover:border-indigo-500/50"
            }`}
          >
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Optional context */}
      <div className="mb-4">
        <label className="text-sm font-semibold mb-1 block">Thêm chi tiết (không bắt buộc)</label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="VD: Tôi đang ở sự kiện networking của công ty, đối phương là đối tác tiềm năng..."
          rows={2}
          className="w-full rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs sm:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <Button
        onClick={generate}
        disabled={loading}
        className="btn-pro w-full py-3.5 text-xs sm:text-sm font-bold mb-6 gap-2"
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang tổng hợp...</> : "Gợi ý câu mở đầu phù hợp"}
      </Button>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Openers */}
            <div>
              <h2 className="font-bold text-sm mb-3 text-muted-foreground uppercase tracking-wide">💬 Câu mở đầu gợi ý</h2>
              <div className="space-y-3">
                {result.openers.map((opener, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`pro-card overflow-hidden transition-all ${
                      activeOpener === opener.text
                        ? "border-indigo-600 ring-2 ring-indigo-500/20"
                        : "border-slate-200/80 dark:border-slate-800"
                    }`}
                  >
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => setActiveOpener(activeOpener === opener.text ? null : opener.text)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium flex-1 text-foreground">&ldquo;{opener.text}&rdquo;</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge className={`text-[10px] rounded-md ${TONE_COLORS[opener.tone] || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                            {opener.tone}
                          </Badge>
                          <button
                            onClick={(e) => { e.stopPropagation(); speak(opener.text); }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400"
                          >
                            <Volume2 className={`w-3.5 h-3.5 ${playingText === opener.text ? "animate-pulse" : ""}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <AnimatePresence>
                      {activeOpener === opener.text && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-3 pt-1 bg-slate-50 dark:bg-slate-850 text-xs text-muted-foreground italic border-t border-slate-100 dark:border-slate-800">
                            💡 {opener.why}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Follow-ups */}
            <div className="pro-card p-5 space-y-3">
              <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Câu tiếp theo để duy trì cuộc trò chuyện</h2>
              <ul className="space-y-2">
                {result.follow_ups.map((q, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm">
                    <button
                      onClick={() => speak(q)}
                      className="mt-0.5 p-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 shrink-0"
                    >
                      <Volume2 className={`w-3 h-3 ${playingText === q ? "animate-pulse" : ""}`} />
                    </button>
                    <span className="text-foreground">&ldquo;{q}&rdquo;</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Common responses */}
            {result.common_responses.length > 0 && (
              <div className="pro-card p-5 space-y-2 border-indigo-500/20">
                <h2 className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Đối phương thường phản hồi:</h2>
                <ul className="space-y-1.5">
                  {result.common_responses.map((r, i) => (
                    <li key={i} className="text-xs sm:text-sm text-foreground italic">&ldquo;{r}&rdquo;</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tips */}
            <div className="pro-card p-5 space-y-2">
              <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Chiến lược ghi điểm:</h2>
              <ul className="space-y-1.5">
                {result.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {result.cultural_note && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 text-sm text-amber-700 dark:text-amber-300">
                🌍 <strong>Văn hóa:</strong> {result.cultural_note}
              </div>
            )}

            <button
              onClick={generate}
              className="w-full py-3 border-2 border-kawaii-purple text-kawaii-purple font-bold rounded-2xl hover:bg-kawaii-lavender/10"
            >
              🔄 Gợi ý khác
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
