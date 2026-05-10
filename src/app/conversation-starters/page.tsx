"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
      <h1 className="text-2xl font-bold mb-1">
        <span className="bg-gradient-kawaii bg-clip-text text-transparent">🗣️ Conversation Starters</span>
      </h1>
      <p className="text-muted-foreground text-sm mb-6">Không biết bắt đầu nói gì? AI gợi ý những câu mở đầu tự nhiên nhất!</p>

      {/* Situation picker */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {SITUATIONS.map((s) => (
          <motion.button
            key={s.id}
            onClick={() => { setSelected(s); setResult(null); }}
            className={`text-left p-3 rounded-2xl border-2 transition-all ${
              selected.id === s.id
                ? "border-kawaii-purple bg-kawaii-lavender/10"
                : "border-gray-200/50 bg-white/60 dark:bg-gray-800/60 hover:border-kawaii-purple/40"
            }`}
            whileHover={{ scale: 1.02 }}
          >
            <span className="text-xl mr-2">{s.emoji}</span>
            <span className="text-xs font-medium">{s.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Optional context */}
      <div className="mb-4">
        <label className="text-sm font-semibold mb-1 block">Thêm chi tiết (không bắt buộc)</label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="VD: Tôi đang ở sự kiện tech startup, đối phương đang đứng một mình..."
          rows={2}
          className="w-full rounded-2xl border border-gray-200/60 bg-white/60 dark:bg-gray-800/60 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-kawaii-purple/40"
        />
      </div>

      <button
        onClick={generate}
        disabled={loading}
        className="w-full py-4 bg-gradient-kawaii text-white font-bold rounded-2xl text-base mb-6 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...</> : "✨ Gợi ý câu mở đầu"}
      </button>

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
                    className={`rounded-2xl border-2 overflow-hidden transition-all ${
                      activeOpener === opener.text
                        ? "border-kawaii-purple"
                        : "border-gray-200/50"
                    }`}
                  >
                    <div
                      className="p-4 bg-white/60 dark:bg-gray-800/60 cursor-pointer"
                      onClick={() => setActiveOpener(activeOpener === opener.text ? null : opener.text)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium flex-1">&ldquo;{opener.text}&rdquo;</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge className={`text-xs rounded-full ${TONE_COLORS[opener.tone] || "bg-gray-100 text-gray-600"}`}>
                            {opener.tone}
                          </Badge>
                          <button
                            onClick={(e) => { e.stopPropagation(); speak(opener.text); }}
                            className="p-1.5 rounded-full bg-kawaii-lavender/20 hover:bg-kawaii-lavender/40"
                          >
                            <Volume2 className={`w-3.5 h-3.5 ${playingText === opener.text ? "text-kawaii-purple animate-pulse" : ""}`} />
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
                          <div className="px-4 pb-3 pt-1 bg-kawaii-lavender/5 text-sm text-muted-foreground italic">
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
            <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl p-4 border border-gray-200/40">
              <h2 className="font-bold text-sm mb-3">🔄 Câu tiếp theo để duy trì cuộc trò chuyện</h2>
              <ul className="space-y-2">
                {result.follow_ups.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <button
                      onClick={() => speak(q)}
                      className="mt-0.5 p-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-kawaii-lavender/30 shrink-0"
                    >
                      <Volume2 className={`w-3 h-3 ${playingText === q ? "text-kawaii-purple animate-pulse" : ""}`} />
                    </button>
                    <span>&ldquo;{q}&rdquo;</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Common responses */}
            {result.common_responses.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4">
                <h2 className="font-bold text-sm mb-2 text-blue-700 dark:text-blue-300">🗨️ Đối phương thường trả lời:</h2>
                <ul className="space-y-1">
                  {result.common_responses.map((r, i) => (
                    <li key={i} className="text-sm text-blue-700 dark:text-blue-200">&ldquo;{r}&rdquo;</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tips */}
            <div className="bg-gradient-to-br from-kawaii-yellow/20 to-kawaii-pink/10 rounded-2xl p-4">
              <h2 className="font-bold text-sm mb-2">📌 Tips</h2>
              <ul className="space-y-1">
                {result.tips.map((tip, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-kawaii-yellow">•</span> {tip}
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
