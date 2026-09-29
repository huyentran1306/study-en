"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sparkles,
  PhoneCall,
  Volume2,
  Mic,
  BookOpen,
  Gamepad2,
  Trophy,
  Award,
  Layers,
  Wand2,
  Zap,
  Repeat,
  MessageSquare,
  ShieldCheck,
  Moon,
  Sun,
  Languages,
  ArrowRight,
} from "lucide-react";
import { useGame } from "@/contexts/game-context";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { soundFX } from "@/lib/sound-fx";

interface CommandItem {
  id: string;
  title: string;
  description: string;
  category: "Tech Lead 90D" | "Call & Shadowing" | "Công cụ & Luyện tập" | "Đấu trường & Game" | "Tác vụ nhanh";
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  badge?: string;
  shortcut?: string;
  keywords?: string[];
  action: () => void;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { activeStudyLanguage, setActiveStudyLanguage } = useGame();
  const { theme, setTheme } = useTheme();

  // Listen for global custom event or keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => {
          const next = !prev;
          if (next) soundFX.open();
          return next;
        });
      }
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => {
      setIsOpen(true);
      soundFX.open();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleCustomOpen);
    };
  }, [isOpen]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Command items definition
  const items: CommandItem[] = useMemo(() => [
    // Tech Lead
    {
      id: "tech-lead",
      title: "Lộ trình Tech Lead 90 Ngày (Sprint Pro)",
      description: "Chương trình chuyên sâu: Kiến trúc, đàm phán, push-back deadline & giải pháp",
      category: "Tech Lead 90D",
      icon: ShieldCheck,
      iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
      badge: "HOT",
      keywords: ["tech lead", "90d", "solution", "architect", "roadmap", "lo trinh", "pro"],
      action: () => router.push("/tech-lead"),
    },

    // Call & Shadowing
    {
      id: "shadowing",
      title: "Shadowing Call Solution & Meeting",
      description: "Luyện nhại hội thoại kiến trúc dài, call họp khách hàng & bảo vệ giải pháp",
      category: "Call & Shadowing",
      icon: PhoneCall,
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      keywords: ["shadowing", "call", "meeting", "nhai", "giao tiep", "solution", "khach hang"],
      action: () => router.push("/shadowing"),
    },
    {
      id: "roleplay",
      title: "AI Roleplay Call 1-1",
      description: "Thực hành giả lập cuộc gọi với Client, CTO, PM & Tech Interviewer",
      category: "Call & Shadowing",
      icon: MessageSquare,
      iconBg: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
      keywords: ["roleplay", "dong vai", "ai call", "interview", "cto", "pm"],
      action: () => router.push("/roleplay"),
    },
    {
      id: "voice",
      title: "Voice Realtime Call",
      description: "Đàm thoại tiếng Anh phản xạ trực tiếp bằng giọng nói 2 chiều thời gian thực",
      category: "Call & Shadowing",
      icon: Mic,
      iconBg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
      keywords: ["voice", "giong noi", "realtime", "noi truc tiep", "dam thoai"],
      action: () => router.push("/voice"),
    },
    {
      id: "story",
      title: "IT Situational Stories",
      description: "Nghe hiểu và phản xạ qua các câu chuyện sự cố & quyết định kiến trúc thực chiến",
      category: "Call & Shadowing",
      icon: Layers,
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      keywords: ["story", "cau chuyen", "tinh huong", "su co", "architecture stories"],
      action: () => router.push("/story"),
    },

    // Công cụ & Luyện tập
    {
      id: "fix-english",
      title: "Tone Polisher (Slack, Email, PR & Incident)",
      description: "Chuốt câu tiếng Anh từ thô sang chuẩn mực ngoại giao & tự tin của Tech Lead",
      category: "Công cụ & Luyện tập",
      icon: Wand2,
      iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      badge: "PRO",
      keywords: ["fix english", "slack", "email", "pr", "incident", "tone", "chua cau"],
      action: () => router.push("/fix-english"),
    },
    {
      id: "speed-speaking",
      title: "Speed Speaking Sprint",
      description: "Thử thách phản xạ nói nhanh theo nhịp 60 giây, giảm độ trễ ngập ngừng",
      category: "Công cụ & Luyện tập",
      icon: Zap,
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      keywords: ["speed", "speaking", "phan xa nhanh", "sprint", "toc do"],
      action: () => router.push("/speed-speaking"),
    },
    {
      id: "phrases",
      title: "Tech Phrasebook & Golden Patterns",
      description: "Sổ tay mẫu câu vàng cho Standup, Push-back deadline, RCA & Tranh luận kỹ thuật",
      category: "Công cụ & Luyện tập",
      icon: BookOpen,
      iconBg: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
      keywords: ["phrasebook", "mau cau", "tu dien", "idioms", "tech phrases"],
      action: () => router.push("/phrases"),
    },
    {
      id: "chat",
      title: "AI Mentor Partner",
      description: "Trợ lý chuyên gia IT sẵn sàng giải đáp ngữ pháp, phát âm và văn phong công nghệ",
      category: "Công cụ & Luyện tập",
      icon: Sparkles,
      iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      keywords: ["chat", "mentor", "ai tro ly", "hoi dap"],
      action: () => router.push("/chat"),
    },
    {
      id: "pronunciation",
      title: "Speech Lab & Pronunciation",
      description: "Phân tích âm vị IPA, trọng âm và độ mượt của từ vựng công nghệ khó",
      category: "Công cụ & Luyện tập",
      icon: Volume2,
      iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      keywords: ["pronunciation", "phat am", "ipa", "speech lab", "trong am"],
      action: () => router.push("/pronunciation"),
    },
    {
      id: "review",
      title: "Spaced Review (SRS)",
      description: "Ôn tập thông minh ngắt quãng những từ và mẫu câu bạn cần củng cố",
      category: "Công cụ & Luyện tập",
      icon: Repeat,
      iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      keywords: ["review", "on tap", "flashcards", "srs", "spaced repetition"],
      action: () => router.push("/review"),
    },

    // Đấu trường & Games
    {
      id: "games",
      title: "Game Arena (Đấu trường Minigames)",
      description: "Thử thách Buzzword Clash, Syntax Speedrun & Code Reviewer Blitz",
      category: "Đấu trường & Game",
      icon: Gamepad2,
      iconBg: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
      keywords: ["games", "arena", "tro choi", "dau truong", "buzzword", "syntax"],
      action: () => router.push("/games"),
    },
    {
      id: "vocab",
      title: "Thư viện Từ vựng IT & Solution",
      description: "Kho 500+ từ vựng chuyên ngành phân loại theo Cloud, DevOps, Database, AI",
      category: "Đấu trường & Game",
      icon: BookOpen,
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      keywords: ["vocab", "tu vung", "dictionary", "tu dien it"],
      action: () => router.push("/vocab"),
    },
    {
      id: "leaderboard",
      title: "Bảng xếp hạng (Leaderboard)",
      description: "Xem vị trí xếp hạng điểm XP và chuỗi ngày rèn luyện cùng các thành viên khác",
      category: "Đấu trường & Game",
      icon: Trophy,
      iconBg: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
      keywords: ["leaderboard", "bang xep hang", "top", "xp", "rank"],
      action: () => router.push("/leaderboard"),
    },
    {
      id: "achievements",
      title: "Chứng chỉ & Danh hiệu (Achievements)",
      description: "Bộ sưu tập huy hiệu Tech Lead, chuỗi ngày streak và danh hiệu mở khóa",
      category: "Đấu trường & Game",
      icon: Award,
      iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
      keywords: ["achievements", "huy hieu", "chung chi", "danh hieu"],
      action: () => router.push("/achievements"),
    },

    // Quick Actions
    {
      id: "switch-en",
      title: "Đổi giáo trình học sang Tiếng Anh 🇬🇧",
      description: activeStudyLanguage === "en" ? "Đang chọn Tiếng Anh" : "Chuyển toàn bộ dữ liệu & bài học sang English",
      category: "Tác vụ nhanh",
      icon: Languages,
      iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
      badge: activeStudyLanguage === "en" ? "ĐANG DÙNG" : undefined,
      keywords: ["english", "tieng anh", "switch language", "en"],
      action: () => {
        setActiveStudyLanguage("en");
        setIsOpen(false);
      },
    },
    {
      id: "switch-zh",
      title: "Đổi giáo trình học sang Tiếng Trung 🇨🇳",
      description: activeStudyLanguage === "zh" ? "Đang chọn Tiếng Trung" : "Chuyển dữ liệu học sang 中文 (Tiếng Trung)",
      category: "Tác vụ nhanh",
      icon: Languages,
      iconBg: "bg-red-500/10 text-red-600 dark:text-red-400",
      badge: activeStudyLanguage === "zh" ? "ĐANG DÙNG" : undefined,
      keywords: ["chinese", "tieng trung", "zh", "zhongwen"],
      action: () => {
        setActiveStudyLanguage("zh");
        setIsOpen(false);
      },
    },
    {
      id: "toggle-theme",
      title: theme === "dark" ? "Chuyển sang giao diện Sáng (Light Mode)" : "Chuyển sang giao diện Tối (Dark Mode)",
      description: "Thay đổi phong cách màu sắc hiển thị của ứng dụng",
      category: "Tác vụ nhanh",
      icon: theme === "dark" ? Sun : Moon,
      iconBg: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
      keywords: ["theme", "dark", "light", "toi", "sang", "mode"],
      action: () => {
        setTheme(theme === "dark" ? "light" : "dark");
        setIsOpen(false);
      },
    },
  ], [activeStudyLanguage, router, setActiveStudyLanguage, setTheme, theme]);

  // Filter items
  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase().trim();
    return items.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchCategory || matchKeywords;
    });
  }, [items, query]);

  // Handle arrow key navigation
  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      soundFX.click();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      soundFX.click();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        soundFX.select();
        filteredItems[selectedIndex].action();
        setIsOpen(false);
      }
    }
  };

  const handleSelectItem = (item: CommandItem) => {
    soundFX.select();
    item.action();
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 sm:px-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden z-10 flex flex-col max-h-[75vh]"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <Search className="w-5 h-5 text-indigo-500 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyNavigation}
                placeholder="Tìm nhanh bài học, chức năng, mẫu câu hoặc phím tắt... (VD: call, tech lead, slack)"
                autoFocus
                className="w-full bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-hidden"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-xs px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-muted-foreground hover:text-foreground"
                >
                  Xóa
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 text-[11px] font-mono text-muted-foreground bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200/80 dark:border-slate-700">
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div className="overflow-y-auto p-2 space-y-1 divide-y divide-slate-100 dark:divide-slate-800/40">
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-medium text-foreground">Không tìm thấy kết quả phù hợp</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Thử tìm với từ khóa khác như &quot;lead&quot;, &quot;call&quot;, &quot;voice&quot;, &quot;slack&quot;, &quot;speed&quot;...
                  </p>
                </div>
              ) : (
                filteredItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        "group flex items-center justify-between gap-3 p-2.5 rounded-xl cursor-pointer transition-all",
                        isSelected
                          ? "bg-indigo-50/90 dark:bg-indigo-950/40 text-foreground"
                          : "hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                            item.iconBg
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs sm:text-sm text-foreground truncate">
                              {item.title}
                            </span>
                            {item.badge && (
                              <span
                                className={cn(
                                  "text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0",
                                  item.badge === "PRO" || item.badge === "HOT"
                                    ? "bg-indigo-600 text-white shadow-xs"
                                    : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="hidden md:inline-block text-[10px] font-medium text-muted-foreground/80 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                          {item.category}
                        </span>
                        <ArrowRight
                          className={cn(
                            "w-4 h-4 text-muted-foreground/50 transition-transform",
                            isSelected && "text-indigo-600 dark:text-indigo-400 translate-x-0.5"
                          )}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Bar */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px] text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded-md border border-slate-200/80 dark:border-slate-700 font-mono text-[10px]">
                    ↑
                  </kbd>
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded-md border border-slate-200/80 dark:border-slate-700 font-mono text-[10px]">
                    ↓
                  </kbd>
                  <span className="ml-1">Điều hướng</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded-md border border-slate-200/80 dark:border-slate-700 font-mono text-[10px]">
                    ↵
                  </kbd>
                  <span className="ml-1">Chọn</span>
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>TranTech Command Hub</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Global trigger function to open command palette from any button */
export function triggerCommandPalette() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  }
}
