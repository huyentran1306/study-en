"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, X, MessageSquare, Heart, Terminal, Compass, Award } from "lucide-react";

interface AppItem {
  id: string;
  name: string;
  tag: string;
  desc: string;
  href: string;
  isExternal: boolean;
  accent: string;
  accentBg: string;
  icon: string;
  pills: string[];
  particles: { char: string; x: string; s: string; d: string; delay: string; sw: string }[];
  loaderMsg: string;
}

const APPS: AppItem[] = [
  {
    id: "study-en",
    name: "Study-En",
    tag: "Tech Lead · AI Roleplay · Pronunciation",
    desc: "Nâng cấp câu tiếng Anh chuẩn Tech Lead/C-Level, luyện phản xạ phỏng vấn nhập vai CTO và luyện phát âm bản ngữ với Deepgram Aura-2.",
    href: "/tech-lead",
    isExternal: false,
    accent: "#4f46e5",
    accentBg: "#eef2ff",
    icon: "💻",
    pills: ["✍️ Fix My English", "🎭 NPC Battle Arena", "🎙️ Whisper STT"],
    particles: [
      { char: "{ }", x: "15%", s: "14px", d: "6.8s", delay: "-1.2s", sw: "16px" },
      { char: "</>", x: "35%", s: "16px", d: "8.2s", delay: "-3.5s", sw: "-14px" },
      { char: "⚡", x: "55%", s: "13px", d: "7.1s", delay: "-2.0s", sw: "18px" },
      { char: "λ", x: "75%", s: "15px", d: "9.0s", delay: "-5.1s", sw: "-12px" },
      { char: "✦", x: "88%", s: "12px", d: "6.5s", delay: "-0.6s", sw: "10px" },
    ],
    loaderMsg: "Đang nạp Tech Lead Writing Co-pilot & Roleplay Arena...",
  },
  {
    id: "di-dau-ai",
    name: "Đi Đâu AI",
    tag: "Multimodal AI · Lịch Trình Du Lịch · Maps",
    desc: "Trích xuất thông minh từ ảnh chụp màn hình review (TikTok/FB/Insta), tối ưu hóa lộ trình di chuyển theo bản đồ và đồng bộ 1-click Google Calendar.",
    href: "https://di-dau-ai.trann46698.workers.dev",
    isExternal: true,
    accent: "#ea580c",
    accentBg: "#fff7ed",
    icon: "✈️",
    pills: ["📸 Multimodal Inbox", "🗺️ Route Optimizer", "🔄 Replan My Day"],
    particles: [
      { char: "✈️", x: "12%", s: "16px", d: "6.2s", delay: "-0.8s", sw: "18px" },
      { char: "📍", x: "32%", s: "14px", d: "7.5s", delay: "-2.4s", sw: "-16px" },
      { char: "☀️", x: "58%", s: "12px", d: "8.0s", delay: "-4.2s", sw: "14px" },
      { char: "✦", x: "78%", s: "15px", d: "6.9s", delay: "-1.5s", sw: "-12px" },
      { char: "🏝️", x: "90%", s: "13px", d: "8.5s", delay: "-5.0s", sw: "16px" },
    ],
    loaderMsg: "Đang kết nối Cloudflare Workers AI & Trợ lý du lịch...",
  },
  {
    id: "study-certificate",
    name: "Study Certificate",
    tag: "Microsoft Azure · AI Exams · Mock Tests",
    desc: "Ngân hàng câu hỏi trắc nghiệm & đề thi thử thực chiến chứng chỉ Microsoft Azure & AI (AI-900, AZ-104, AZ-204, AZ-305) kèm giải thích chi tiết.",
    href: "https://huyentran1306.github.io/study-certificate/",
    isExternal: true,
    accent: "#0284c7",
    accentBg: "#f0f9ff",
    icon: "🎓",
    pills: ["📜 15+ Chứng Chỉ", "⏱️ Thi Thử Bấm Giờ", "📊 Theo Dõi Tiến Độ"],
    particles: [
      { char: "🎓", x: "18%", s: "14px", d: "7.2s", delay: "-1.4s", sw: "12px" },
      { char: "★", x: "42%", s: "15px", d: "8.4s", delay: "-3.8s", sw: "-14px" },
      { char: "🛡️", x: "62%", s: "13px", d: "6.7s", delay: "-2.1s", sw: "16px" },
      { char: "✦", x: "82%", s: "16px", d: "7.8s", delay: "-4.5s", sw: "-10px" },
      { char: "☁️", x: "92%", s: "12px", d: "8.9s", delay: "-0.5s", sw: "14px" },
    ],
    loaderMsg: "Đang nạp ngân hàng đề thi chứng chỉ quốc tế Azure & AI...",
  },
];

const SPEECH_LINES = [
  "Xin chào, mình là Huyền Trân! ✨",
  "Hôm nay bạn muốn học tiếng Anh, lên lịch vi vu hay luyện đề thi? 🌸",
  "Cùng bắt đầu buổi học thật nhiều năng lượng nha! 🚀",
  "Học đi, vì tương lai của bạn xứng đáng tốt hơn! 💖",
];

export default function StudyHubPage() {
  const [mascotText, setMascotText] = useState("");
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // App Loader State
  const [loaderState, setLoaderState] = useState<{
    active: boolean;
    title: string;
    msg: string;
    emoji: string;
    accent: string;
    url: string;
    isExternal: boolean;
  }>({
    active: false,
    title: "",
    msg: "",
    emoji: "✨",
    accent: "#4f46e5",
    url: "",
    isExternal: false,
  });

  // Floating widget state
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<1 | 2>(1);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("");

  // Typewriter effect
  useEffect(() => {
    const fullText = SPEECH_LINES[lineIdx];

    const timer = setTimeout(() => {
      if (!isDeleting) {
        setMascotText(fullText.slice(0, charIdx + 1));
        setCharIdx((prev) => prev + 1);

        if (charIdx + 1 === fullText.length) {
          setTimeout(() => setIsDeleting(true), 2500);
        }
      } else {
        setMascotText(fullText.slice(0, charIdx - 1));
        setCharIdx((prev) => prev - 1);

        if (charIdx - 1 === 0) {
          setIsDeleting(false);
          setLineIdx((prev) => (prev + 1) % SPEECH_LINES.length);
        }
      }
    }, isDeleting ? 25 : 55);

    return () => clearTimeout(timer);
  }, [charIdx, isDeleting, lineIdx]);

  const handleCardClick = (e: React.MouseEvent, app: AppItem) => {
    e.preventDefault();
    setLoaderState({
      active: true,
      title: app.name,
      msg: app.loaderMsg,
      emoji: app.icon,
      accent: app.accent,
      url: app.href,
      isExternal: app.isExternal,
    });

    setTimeout(() => {
      if (app.isExternal) {
        window.open(app.href, "_blank");
        setLoaderState((prev) => ({ ...prev, active: false }));
      } else {
        window.location.href = app.href;
      }
    }, 700);
  };

  const handleFeedbackSubmit = () => {
    if (!feedbackText.trim()) return;
    setFeedbackStatus("Cảm ơn bạn! Lời nhắn đã được lưu lại ♡");
    setTimeout(() => {
      setFeedbackText("");
      setFeedbackStatus("");
      setWidgetOpen(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#fbf9f5] text-[#1e293b] font-sans relative overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {/* AMBIENT BACKGROUND GLOWS */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute w-[450px] h-[450px] rounded-full bg-indigo-100/60 blur-[90px] -top-20 -left-20 animate-pulse" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-amber-100/60 blur-[90px] top-[15%] -right-20 animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-sky-100/50 blur-[100px] -bottom-24 left-[20%] animate-pulse" style={{ animationDelay: "4s" }} />
      </div>

      <main className="relative z-10 max-w-[1140px] mx-auto px-6 pt-12 pb-24 flex flex-col min-h-screen">
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12">
          <div className="max-w-[620px]">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50/80 border border-indigo-200/50 px-3.5 py-1.5 rounded-full mb-3.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600 shadow-[0_0_8px_#4f46e5]" />
              <span>Hệ Sinh Thái Học Tập & AI</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-slate-900 leading-tight mb-3">
              <span className="bg-gradient-to-r from-indigo-600 via-orange-500 to-sky-600 bg-clip-text text-transparent">
                Huyền Trân
              </span>{" "}
              thích học ✨
            </h1>
            <p className="text-[15.5px] text-slate-500 leading-relaxed font-normal">
              Học đi, không phải do ai ép, mà vì tương lai của bạn xứng đáng tốt hơn.
            </p>
          </div>

          {/* MASCOT SPEECH BALLOON */}
          <div className="inline-flex items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-full shadow-[0_8px_24px_-6px_rgba(30,41,59,0.08)] border border-slate-200/60 self-start md:self-center transition-transform hover:-translate-y-0.5">
            <div className="relative w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-100 to-amber-100 flex items-center justify-center text-xl shrink-0 shadow-sm">
              <span className="absolute inset-[-3px] rounded-full border-2 border-indigo-400 opacity-30 animate-ping" />
              <span>👩‍💻</span>
            </div>
            <div className="text-[13.5px] text-slate-700 font-semibold min-w-[200px] max-w-[280px]">
              <span className="text-slate-900">{mascotText}</span>
              <span className="inline-block w-[2px] h-[14px] bg-indigo-600 ml-0.5 align-middle animate-pulse" />
            </div>
          </div>
        </header>

        {/* 3 HERO APP CARDS GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 mt-2">
          {APPS.map((app) => (
            <div
              key={app.id}
              onClick={(e) => handleCardClick(e, app)}
              className="group flex flex-col bg-white rounded-3xl overflow-hidden shadow-[0_14px_34px_-10px_rgba(30,41,59,0.08)] border border-slate-200/70 hover:shadow-[0_24px_48px_-12px_rgba(30,41,59,0.16)] hover:-translate-y-2 transition-all duration-300 cursor-pointer select-none relative"
            >
              {/* STAGE & PARTICLES */}
              <div
                className="h-[200px] relative overflow-hidden flex items-center justify-center border-b border-black/[0.04]"
                style={{ backgroundColor: app.accentBg }}
              >
                {/* Top Accent Band */}
                <span
                  className="absolute top-0 inset-x-0 h-1 group-hover:h-1.5 transition-all duration-300 z-10"
                  style={{ backgroundColor: app.accent }}
                />

                {/* Subtle radial shade */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.85)_0%,transparent_70%)] pointer-events-none z-[2]" />

                {/* Floating Particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
                  {app.particles.map((p, pIdx) => (
                    <span
                      key={pIdx}
                      className="absolute text-sm font-semibold opacity-0 animate-bounce"
                      style={{
                        left: p.x,
                        bottom: "-20px",
                        fontSize: p.s,
                        color: app.accent,
                        animation: `particleRise ${p.d} infinite linear`,
                        animationDelay: p.delay,
                      }}
                    >
                      {p.char}
                    </span>
                  ))}
                </div>

                {/* Center Badge */}
                <div className="relative z-[3] group-hover:scale-110 transition-transform duration-300 ease-out flex items-center justify-center">
                  <div className="w-[72px] h-[72px] rounded-2xl bg-white flex items-center justify-center text-3xl shadow-[0_10px_24px_-4px_rgba(0,0,0,0.08)] border border-black/[0.04] relative">
                    <div
                      className="absolute inset-[-6px] rounded-[24px] opacity-20 blur-md group-hover:opacity-40 transition-opacity"
                      style={{ backgroundColor: app.accent }}
                    />
                    <span>{app.icon}</span>
                  </div>
                </div>
              </div>

              {/* CARD CONTENT */}
              <div className="p-6 flex flex-col flex-1 bg-white">
                <div
                  className="text-[11.5px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"
                  style={{ color: app.accent }}
                >
                  <span>{app.tag}</span>
                </div>

                <div className="text-[21px] font-extrabold text-slate-900 tracking-tight mb-2.5 flex items-center justify-between">
                  <span>{app.name}</span>
                  <span className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-slate-500 text-xs transition-all duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </div>

                <p className="text-[13.5px] text-slate-500 leading-relaxed mb-5 flex-1">
                  {app.desc}
                </p>

                {/* PILLS */}
                <div className="flex flex-wrap gap-1.5 mt-auto pt-3.5 border-t border-dashed border-slate-200">
                  {app.pills.map((pill, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-slate-100/80 text-slate-600"
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* FOOTER */}
        <footer className="mt-16 text-center text-xs text-slate-400">
          <p>Thiết kế bởi <strong className="text-slate-600">Huyền Trân</strong> · Hệ thống Cloudflare Edge & Vercel AI Serverless · 2026</p>
        </footer>
      </main>

      {/* =====================================================================
          APP LOADER FULLSCREEN MODAL
          ===================================================================== */}
      {loaderState.active && (
        <div className="fixed inset-0 z-[9999] bg-white/85 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="w-36 h-36 rounded-full bg-white shadow-2xl flex items-center justify-center text-5xl relative mb-6">
            <div
              className="absolute inset-[-12px] rounded-full border-4 border-slate-100 border-t-transparent animate-spin"
              style={{ borderTopColor: loaderState.accent }}
            />
            <span>{loaderState.emoji}</span>
          </div>
          <div className="text-lg font-bold text-slate-900 mb-1.5">
            Đang mở {loaderState.title}...
          </div>
          <p className="text-sm text-slate-500 animate-pulse">{loaderState.msg}</p>
        </div>
      )}

      {/* =====================================================================
          FLOATING BOTTOM WIDGET
          ===================================================================== */}
      <div className="fixed bottom-6 right-6 z-50">
        {!widgetOpen ? (
          <button
            onClick={() => setWidgetOpen(true)}
            className="flex items-center gap-2 bg-white text-slate-800 px-4 py-2.5 rounded-full shadow-lg border border-slate-200/80 hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-xs font-bold"
          >
            <span>💬</span>
            <span>Nhắn cho Trân</span>
            <span className="text-slate-400">›</span>
          </button>
        ) : (
          <div className="w-[310px] h-[370px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 flex flex-col relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setWidgetOpen(false)}
              className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center text-sm"
            >
              ✕
            </button>
            <div className="text-sm font-bold text-slate-900 mb-0.5">Huyền Trân's Studio ✨</div>
            <div className="text-[11.5px] text-slate-500 mb-3.5">Study-En · Đi Đâu AI · Study Certificate</div>

            <div className="flex bg-slate-100 p-1 rounded-full mb-3.5 gap-1">
              <button
                onClick={() => setActiveTab(1)}
                className={`flex-1 py-1 text-[11px] font-bold rounded-full transition-all ${
                  activeTab === 1 ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                💬 Góp ý
              </button>
              <button
                onClick={() => setActiveTab(2)}
                className={`flex-1 py-1 text-[11px] font-bold rounded-full transition-all ${
                  activeTab === 2 ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                🌸 Giới thiệu
              </button>
            </div>

            {activeTab === 1 ? (
              <div className="flex flex-col flex-1">
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Bạn có ý tưởng hay đề xuất tính năng mới cho các app không? Nhắn tại đây nhé..."
                  className="w-full flex-1 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 resize-none focus:outline-none focus:border-indigo-500 mb-2.5"
                />
                {feedbackStatus ? (
                  <div className="text-center text-xs font-semibold text-emerald-600 py-1.5">
                    {feedbackStatus}
                  </div>
                ) : (
                  <button
                    onClick={handleFeedbackSubmit}
                    disabled={!feedbackText.trim()}
                    className="w-full bg-slate-900 text-white text-xs font-bold py-2.5 rounded-full hover:bg-slate-800 disabled:opacity-40 transition-all"
                  >
                    Gửi lời nhắn
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col flex-1 text-xs text-slate-600 leading-relaxed justify-between">
                <div>
                  <p className="mb-2">
                    <strong>Huyền Trân</strong> — Yêu thích xây dựng những sản phẩm AI vừa thông minh, vừa có tính thẩm mỹ và cảm xúc.
                  </p>
                  <p>Trang Hub kết nối các web app và công cụ chạy trên nền tảng Cloudflare Edge AI & Vercel thế hệ mới.</p>
                </div>
                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
                  Made with ❤️ in Saigon
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes particleRise {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          20% {
            opacity: 0.8;
          }
          80% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-220px) rotate(180deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
