"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Folder,
  FolderOpen,
  Volume2,
  CheckCircle2,
  Circle,
  Play,
  ArrowRight,
  BookOpen,
  Sparkles,
  Repeat,
  MessageSquare,
  X,
  Share2,
  Flame,
  Award,
  Layers,
  ArrowUpRight,
  FileText,
  User,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DAILY_ROADMAP_DATA, DayPlan, DailyTask } from "@/data/daily-roadmap-data";
import { useGame } from "@/contexts/game-context";

// Chinese HSK 1+2 Dataset matching reference site phamletanthinh.vercel.app/chinese/lessons
interface ChineseLesson {
  id: number;
  lessonNumber: number;
  titleZh: string;
  pinyin: string;
  meaningVi: string;
  totalWords: number;
  knownWords: number;
  tasks: {
    id: string;
    title: string;
    detail: string;
    pinyin?: string;
    meaning?: string;
  }[];
}

const HSK_LESSONS_DATA: ChineseLesson[] = [
  {
    id: 1,
    lessonNumber: 1,
    titleZh: "你叫什么名字?",
    pinyin: "Nǐ jiào shénme míngzi?",
    meaningVi: "Bạn tên là gì?",
    totalWords: 39,
    knownWords: 0,
    tasks: [
      { id: "h1-1", title: "Chào hỏi & Hỏi tên", detail: "你叫什么名字? / 我叫李朋。", pinyin: "Nǐ jiào shénme míngzi? / Wǒ jiào Lǐ Péng.", meaning: "Bạn tên gì? / Tôi tên là Lý Bằng." },
      { id: "h1-2", title: "Đại từ nhân xưng", detail: "你, 我, 他, 她, 我们, 你们", pinyin: "nǐ, wǒ, tā, tā, wǒmen, nǐmen", meaning: "Bạn, tôi, anh ấy, cô ấy, chúng tôi, các bạn" },
      { id: "h1-3", title: "Luyện phát âm thanh mẫu", detail: "b, p, m, f, d, t, n, l", pinyin: "Thanh mẫu cơ bản", meaning: "Luyện phát âm chuẩn pinyin" },
    ],
  },
  {
    id: 2,
    lessonNumber: 2,
    titleZh: "你家都有什么人?",
    pinyin: "Nǐ jiā dōu yǒu shénme rén?",
    meaningVi: "Nhà bạn có những ai?",
    totalWords: 57,
    knownWords: 0,
    tasks: [
      { id: "h2-1", title: "Thành viên gia đình", detail: "爸爸, 妈妈, 哥哥, 姐姐, 弟弟, 妹妹", pinyin: "bàba, māma, gēge, jiějie, dìdi, mèimei", meaning: "Bố, mẹ, anh, chị, em trai, em gái" },
      { id: "h2-2", title: "Lượng từ 口 & 个", detail: "我家有四口人。", pinyin: "Wǒ jiā yǒu sì kǒu rén.", meaning: "Nhà tôi có 4 người." },
    ],
  },
  {
    id: 3,
    lessonNumber: 3,
    titleZh: "这是什么书?",
    pinyin: "Zhè shì shénme shū?",
    meaningVi: "Đây là sách gì?",
    totalWords: 39,
    knownWords: 0,
    tasks: [
      { id: "h3-1", title: "Hỏi đồ vật", detail: "这是什么? / 这是汉语书。", pinyin: "Zhè shì shénme? / Zhè shì Hànyǔ shū.", meaning: "Đây là gì? / Đây là sách tiếng Hán." },
      { id: "h3-2", title: "Chỉ thị 这 & 那", detail: "这 (đây) vs 那 (kia, đó)", pinyin: "zhè vs nà", meaning: "Chỉ vị trí gần và xa" },
    ],
  },
  {
    id: 4,
    lessonNumber: 4,
    titleZh: "你会说汉语吗?",
    pinyin: "Nǐ huì shuō Hànyǔ ma?",
    meaningVi: "Bạn biết nói tiếng Trung không?",
    totalWords: 35,
    knownWords: 0,
    tasks: [
      { id: "h4-1", title: "Trợ động từ 会", detail: "我会说一点儿汉语。", pinyin: "Wǒ huì shuō yìdiǎnr Hànyǔ.", meaning: "Tôi biết nói một chút tiếng Trung." },
      { id: "h4-2", title: "Cấu trúc nghi vấn 吗", detail: "你会写汉字吗?", pinyin: "Nǐ huì xiě hànzì ma?", meaning: "Bạn biết viết chữ Hán không?" },
    ],
  },
  {
    id: 5,
    lessonNumber: 5,
    titleZh: "今天是几月几号?",
    pinyin: "Jīntiān shì jǐ yuè jǐ hào?",
    meaningVi: "Hôm nay là ngày mấy tháng mấy?",
    totalWords: 44,
    knownWords: 0,
    tasks: [
      { id: "h5-1", title: "Ngày tháng & Thứ", detail: "今天是9月15号, 星期三。", pinyin: "Jīntiān shì jiǔ yuè shíwǔ hào, xīngqīsān.", meaning: "Hôm nay là ngày 15 tháng 9, thứ Tư." },
      { id: "h5-2", title: "Hỏi ngày sinh nhật", detail: "你的生日是几月几号?", pinyin: "Nǐ de shēngrì shì jǐ yuè jǐ hào?", meaning: "Sinh nhật của bạn là ngày mấy tháng mấy?" },
      { id: "h5-3", title: "Hôm qua, Hôm nay, Ngày mai", detail: "昨天, 今天, 明天", pinyin: "zuótiān, jīntiān, míngtiān", meaning: "Thời gian biểu trong tuần" },
    ],
  },
  {
    id: 6,
    lessonNumber: 6,
    titleZh: "现在几点了?",
    pinyin: "Xiànzài jǐ diǎn le?",
    meaningVi: "Bây giờ là mấy giờ rồi?",
    totalWords: 48,
    knownWords: 0,
    tasks: [
      { id: "h6-1", title: "Hỏi giờ giấc", detail: "现在八点半。", pinyin: "Xiànzài bā diǎn bàn.", meaning: "Bây giờ là 8 giờ rưỡi." },
      { id: "h6-2", title: "Các mốc thời gian trong ngày", detail: "早上, 中午, 下午, 晚上", pinyin: "zǎoshang, zhōngwǔ, xiàwǔ, wǎnshang", meaning: "Sáng, trưa, chiều, tối" },
    ],
  },
  {
    id: 7,
    lessonNumber: 7,
    titleZh: "苹果多少钱一斤?",
    pinyin: "Píngguǒ duōshao qián yì jīn?",
    meaningVi: "Táo bao nhiêu tiền một cân?",
    totalWords: 44,
    knownWords: 0,
    tasks: [
      { id: "h7-1", title: "Mua sắm & Trả giá", detail: "太贵了, 便宜一点儿吧!", pinyin: "Tài guì le, piányi yìdiǎnr ba!", meaning: "Đắt quá, bớt một chút đi!" },
      { id: "h7-2", title: "Đơn vị tiền tệ", detail: "块 (đồng), 毛 (hào), 分 (xu)", pinyin: "kuài, máo, fēn", meaning: "Cách nói tiền mặt Trung Quốc" },
    ],
  },
  {
    id: 8,
    lessonNumber: 8,
    titleZh: "今天的天气怎么样?",
    pinyin: "Jīntiān de tiānqì zěnmeyàng?",
    meaningVi: "Thời tiết hôm nay thế nào?",
    totalWords: 39,
    knownWords: 0,
    tasks: [
      { id: "h8-1", title: "Miêu tả thời tiết", detail: "今天天气很好, 不冷也不热。", pinyin: "Jīntiān tiānqì hěn hǎo, bù lěng yě bú rè.", meaning: "Hôm nay thời tiết rất đẹp, không lạnh cũng không nóng." },
      { id: "h8-2", title: "Trạng thái mưa nắng", detail: "下雨, 刮风, 晴天", pinyin: "xià yǔ, guā fēng, qíngtiān", meaning: "Trời mưa, gió thổi, trời nắng" },
    ],
  },
  {
    id: 9,
    lessonNumber: 9,
    titleZh: "请问, 医院在哪儿?",
    pinyin: "Qǐngwèn, yīyuàn zài nǎr?",
    meaningVi: "Xin hỏi, bệnh viện ở đâu?",
    totalWords: 44,
    knownWords: 0,
    tasks: [
      { id: "h9-1", title: "Hỏi đường & Phương hướng", detail: "一直往前走, 就在左边。", pinyin: "Yìzhí wǎng qián zǒu, jiù zài zuǒbiān.", meaning: "Đi thẳng về phía trước, ở ngay bên trái." },
      { id: "h9-2", title: "Các địa điểm công cộng", detail: "医院, 学校, 银行, 商店", pinyin: "yīyuàn, xuéxiào, yínháng, shāngdiàn", meaning: "Bệnh viện, trường học, ngân hàng, cửa hàng" },
    ],
  },
  {
    id: 10,
    lessonNumber: 10,
    titleZh: "你在做什么呢?",
    pinyin: "Nǐ zài zuò shénme ne?",
    meaningVi: "Bạn đang làm gì thế?",
    totalWords: 44,
    knownWords: 0,
    tasks: [
      { id: "h10-1", title: "Thì hiện tại tiếp diễn 在...呢", detail: "我在看书呢。", pinyin: "Wǒ zài kàn shū ne.", meaning: "Tôi đang đọc sách." },
      { id: "h10-2", title: "Các hoạt động hàng ngày", detail: "睡觉, 看电影, 做饭, 工作", pinyin: "shuìjiào, kàn diànyǐng, zuò fàn, gōngzuò", meaning: "Ngủ, xem phim, nấu cơm, làm việc" },
    ],
  },
  {
    id: 11,
    lessonNumber: 11,
    titleZh: "你们买了什么?",
    pinyin: "Nǐmen mǎi le shénme?",
    meaningVi: "Các bạn đã mua gì?",
    totalWords: 41,
    knownWords: 0,
    tasks: [
      { id: "h11-1", title: "Trợ từ động thái 了 (đã xong)", detail: "我买了一点儿苹果。", pinyin: "Wǒ mǎi le yìdiǎnr píngguǒ.", meaning: "Tôi đã mua một ít táo." },
    ],
  },
  {
    id: 12,
    lessonNumber: 12,
    titleZh: "他是坐飞机来的",
    pinyin: "Tā shì zuò fēijī lái de",
    meaningVi: "Anh ấy đi máy bay đến",
    totalWords: 45,
    knownWords: 0,
    tasks: [
      { id: "h12-1", title: "Cấu trúc nhấn mạnh 是...的", detail: "我们是坐火车来的。", pinyin: "Wǒmen shì zuò huǒchē lái de.", meaning: "Chúng tôi đến bằng tàu hỏa." },
    ],
  },
];

function LessonsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { username, streak, level, addXP } = useGame();

  // Track switcher: 'en' (Tech Lead 30 Days) vs 'zh' (HSK 1+2 Chinese)
  const [track, setTrack] = useState<"en" | "zh">("en");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(5);
  const [copiedPhrase, setCopiedPhrase] = useState<string | null>(null);

  // Sync with URL query parameter ?open=... or ?track=...
  useEffect(() => {
    const openParam = searchParams.get("open");
    const trackParam = searchParams.get("track");

    if (trackParam === "zh" || openParam === "hsk12") {
      setTrack("zh");
    } else if (trackParam === "en") {
      setTrack("en");
    }

    if (openParam) {
      if (openParam === "hsk12") {
        setSelectedLessonId(5);
      } else {
        const num = parseInt(openParam, 10);
        if (!isNaN(num)) setSelectedLessonId(num);
      }
    }
  }, [searchParams]);

  // Play audio preview
  const playSpeech = (text: string, lang = track === "zh" ? "zh-CN" : "en-US") => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Filter lessons based on search query
  const filteredEnglishLessons = useMemo(() => {
    if (!searchQuery.trim()) return DAILY_ROADMAP_DATA;
    const q = searchQuery.toLowerCase();
    return DAILY_ROADMAP_DATA.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.objectiveVi.toLowerCase().includes(q) ||
        d.targetCallSituation.toLowerCase().includes(q) ||
        d.sprintTitle.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredChineseLessons = useMemo(() => {
    if (!searchQuery.trim()) return HSK_LESSONS_DATA;
    const q = searchQuery.toLowerCase();
    return HSK_LESSONS_DATA.filter(
      (l) =>
        l.titleZh.toLowerCase().includes(q) ||
        l.pinyin.toLowerCase().includes(q) ||
        l.meaningVi.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Selected item details
  const activeEnLesson = useMemo(() => {
    return DAILY_ROADMAP_DATA.find((d) => d.day === selectedLessonId) || DAILY_ROADMAP_DATA[0];
  }, [selectedLessonId]);

  const activeZhLesson = useMemo(() => {
    return HSK_LESSONS_DATA.find((l) => l.id === selectedLessonId) || HSK_LESSONS_DATA[4];
  }, [selectedLessonId]);

  const selectLesson = (id: number) => {
    setSelectedLessonId(id);
    const params = new URLSearchParams(searchParams.toString());
    params.set("open", id.toString());
    params.set("track", track);
    router.replace(`/lessons?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-[#fcf9f5] dark:bg-slate-950 text-[#2d2321] dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      {/* Top Breadcrumb & Actions Bar */}
      <header className="sticky top-0 z-40 bg-[#fcf9f5]/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-[#eedcd5]/80 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Track Switcher & Breadcrumb */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-[#eedcd5] dark:border-slate-800 text-[#78645e] dark:text-slate-300 hover:text-[#991b1b] hover:border-[#991b1b]/40 transition-all shadow-2xs"
            title={isSidebarOpen ? "Thu gọn thanh bên" : "Mở rộng thanh bên"}
          >
            <BookOpen className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 bg-[#f5ebe6] dark:bg-slate-900 p-1 rounded-2xl border border-[#eedcd5] dark:border-slate-800">
            <button
              onClick={() => {
                setTrack("en");
                setSelectedLessonId(1);
              }}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                track === "en"
                  ? "bg-white dark:bg-slate-800 text-[#991b1b] dark:text-red-400 shadow-xs"
                  : "text-[#78645e] dark:text-slate-400 hover:text-foreground"
              )}
            >
              <span className="w-2 h-2 rounded-full bg-[#991b1b]" />
              Tech Lead 30D
            </button>

            <button
              onClick={() => {
                setTrack("zh");
                setSelectedLessonId(5);
              }}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                track === "zh"
                  ? "bg-white dark:bg-slate-800 text-[#991b1b] dark:text-red-400 shadow-xs"
                  : "text-[#78645e] dark:text-slate-400 hover:text-foreground"
              )}
            >
              <span className="font-extrabold text-[11px] text-[#991b1b]">中</span>
              HSK 1+2
            </button>
          </div>
        </div>

        {/* Center: Search pill */}
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-[#a08d87] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              track === "zh"
                ? "Tìm theo Hán tự, pinyin hoặc nghĩa..."
                : "Tìm theo bài học, tình huống hoặc mẫu câu..."
            }
            className="w-full bg-white dark:bg-slate-900 border border-[#ecdcd5] dark:border-slate-800 rounded-full pl-9 pr-4 py-2 text-xs sm:text-sm text-[#2d2321] dark:text-slate-100 placeholder-[#a08d87] focus:outline-none focus:border-[#991b1b]/60 focus:ring-2 focus:ring-[#991b1b]/15 shadow-2xs transition-all"
          />
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/vocab">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex rounded-full border-[#ecdcd5] dark:border-slate-800 bg-white dark:bg-slate-900 text-[#2d2321] dark:text-slate-200 text-xs font-semibold hover:bg-[#faf4ee] dark:hover:bg-slate-800"
            >
              <Plus className="w-3.5 h-3.5 mr-1 text-[#991b1b]" />
              Thêm thẻ
            </Button>
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-[#ecdcd5] dark:border-slate-800 text-xs font-semibold shadow-2xs">
            <User className="w-3.5 h-3.5 text-[#991b1b]" />
            <span className="font-bold text-[#2d2321] dark:text-slate-200">{username || "Trân"}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#fdf0f0] text-[#991b1b] font-bold">
              Lv.{level}
            </span>
          </div>
        </div>
      </header>

      {/* Main Body with Collapsible Sidebar & Grid */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ======================================================== */}
        {/* COLLAPSIBLE LEFT SIDEBAR                                 */}
        {/* ======================================================== */}
        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex-shrink-0 border-r border-[#eedcd5]/80 dark:border-slate-800 bg-[#fcf9f6] dark:bg-slate-900/60 overflow-hidden flex flex-col z-20"
            >
              <div className="w-[300px] h-full flex flex-col p-3.5 space-y-3 overflow-y-auto">
                {/* Category Header Card */}
                <div className="rounded-2xl bg-[#fdf2f2] dark:bg-red-950/30 border border-[#f8dede] dark:border-red-900/40 p-3.5 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-900 border border-[#f4dcd6] flex items-center justify-center text-xl font-black text-[#991b1b] shadow-2xs flex-shrink-0">
                    {track === "zh" ? "学" : "EN"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#991b1b]">
                      {track === "zh" ? "学中文" : "TranTech Talk"}
                    </div>
                    <div className="text-sm font-extrabold text-[#2d2321] dark:text-slate-100 truncate font-heading">
                      {track === "zh" ? "HSK 1+2" : "30 Ngày Call Khách"}
                    </div>
                  </div>
                </div>

                {/* Accordion Item: Kiến thức bài học */}
                <div className="space-y-1">
                  <button
                    onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-900 border border-[#eedcd5]/70 dark:border-slate-800 text-xs font-bold transition-all"
                  >
                    <div className="flex items-center gap-2 text-[#2d2321] dark:text-slate-200">
                      <Folder className="w-4 h-4 text-[#991b1b]" />
                      <span>{track === "zh" ? "Kiến thức HSK" : "Kiến thức Call Khách"}</span>
                      <span className="text-[10px] text-[#78645e] font-normal">
                        ({track === "zh" ? HSK_LESSONS_DATA.length : DAILY_ROADMAP_DATA.length} bài)
                      </span>
                    </div>
                    <ChevronRight
                      className={cn(
                        "w-3.5 h-3.5 text-[#a08d87] transition-transform duration-200",
                        isAccordionOpen && "rotate-90 text-[#991b1b]"
                      )}
                    />
                  </button>

                  {/* Sidebar Lesson Items List */}
                  {isAccordionOpen && (
                    <div className="space-y-1 pl-1 pt-1 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
                      {track === "zh"
                        ? filteredChineseLessons.map((l) => {
                            const isSelected = selectedLessonId === l.id;
                            return (
                              <button
                                key={l.id}
                                onClick={() => selectLesson(l.id)}
                                className={cn(
                                  "w-full text-left p-2 rounded-xl text-xs flex items-center gap-2.5 transition-all",
                                  isSelected
                                    ? "bg-[#fdf0f0] dark:bg-red-950/50 border border-[#f5d5ce] dark:border-red-900/60 shadow-2xs"
                                    : "hover:bg-white/80 dark:hover:bg-slate-900/80 text-[#5c4a45] dark:text-slate-300"
                                )}
                              >
                                <span
                                  className={cn(
                                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                                    isSelected
                                      ? "bg-[#991b1b] text-white"
                                      : "bg-[#fdf0f0] text-[#991b1b]"
                                  )}
                                >
                                  {l.lessonNumber}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-[#2d2321] dark:text-slate-100 truncate">
                                    {l.titleZh}
                                  </div>
                                  <div className="text-[10px] text-[#78645e] dark:text-slate-400 truncate italic">
                                    {l.meaningVi}
                                  </div>
                                </div>
                                <span className="text-[10px] text-[#a08d87] px-1.5 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-[#eedcd5]/60 flex-shrink-0">
                                  0
                                </span>
                              </button>
                            );
                          })
                        : filteredEnglishLessons.map((d) => {
                            const isSelected = selectedLessonId === d.day;
                            return (
                              <button
                                key={d.day}
                                onClick={() => selectLesson(d.day)}
                                className={cn(
                                  "w-full text-left p-2 rounded-xl text-xs flex items-center gap-2.5 transition-all",
                                  isSelected
                                    ? "bg-[#fdf0f0] dark:bg-red-950/50 border border-[#f5d5ce] dark:border-red-900/60 shadow-2xs"
                                    : "hover:bg-white/80 dark:hover:bg-slate-900/80 text-[#5c4a45] dark:text-slate-300"
                                )}
                              >
                                <span
                                  className={cn(
                                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                                    isSelected
                                      ? "bg-[#991b1b] text-white"
                                      : "bg-[#fdf0f0] text-[#991b1b]"
                                  )}
                                >
                                  {d.day}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-[#2d2321] dark:text-slate-100 truncate">
                                    {d.title}
                                  </div>
                                  <div className="text-[10px] text-[#78645e] dark:text-slate-400 truncate italic">
                                    {d.sprintBadge}
                                  </div>
                                </div>
                                <span className="text-[10px] text-[#a08d87] px-1.5 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-[#eedcd5]/60 flex-shrink-0">
                                  0
                                </span>
                              </button>
                            );
                          })}
                    </div>
                  )}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Floating Toggle Button On Sidebar Edge */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-1/2 -translate-y-1/2 z-30 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-[#eedcd5] dark:border-slate-800 shadow-md flex items-center justify-center text-[#78645e] hover:text-[#991b1b] transition-all"
          style={{ left: isSidebarOpen ? "288px" : "8px" }}
          title={isSidebarOpen ? "Đóng thanh bên" : "Mở thanh bên"}
        >
          {isSidebarOpen ? (
            <ChevronLeft className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {/* ======================================================== */}
        {/* MAIN LESSONS GRID & DETAIL DRAWER                        */}
        {/* ======================================================== */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-6">
          {/* Header Banner Card (Exactly as in screenshot) */}
          <div className="rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-[#eedcd5] dark:border-slate-800 p-6 sm:p-8 shadow-xs flex items-center gap-5 sm:gap-6">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-[#fdf0f0] dark:bg-red-950/40 border border-[#f5d5ce] dark:border-red-900/60 flex items-center justify-center text-3xl font-black text-[#991b1b] dark:text-red-400 shadow-2xs flex-shrink-0">
              {track === "zh" ? "学" : "EN"}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#2d2321] dark:text-slate-100 font-heading">
                {track === "zh" ? "Kiến thức HSK 1+2" : "Kiến thức 30 Ngày Call Khách"}
              </h1>
              <p className="text-xs sm:text-sm text-[#78645e] dark:text-slate-400 mt-1">
                {track === "zh"
                  ? `${HSK_LESSONS_DATA.length} bài học · chọn một bài để bắt đầu`
                  : `${DAILY_ROADMAP_DATA.length} bài học thực chiến · chọn một bài để bắt đầu`}
              </p>
            </div>
          </div>

          {/* 2-Column Grid of Lesson Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {track === "zh"
              ? filteredChineseLessons.map((l) => {
                  const isSelected = selectedLessonId === l.id;
                  return (
                    <motion.div
                      key={l.id}
                      whileHover={{ y: -2 }}
                      onClick={() => selectLesson(l.id)}
                      className={cn(
                        "rounded-2xl transition-all duration-200 cursor-pointer p-4 sm:p-5 flex items-center justify-between group select-none",
                        isSelected
                          ? "bg-[#fffbfb] dark:bg-red-950/20 border-2 border-[#b91c1c] shadow-[0_4px_24px_rgba(185,28,28,0.18)]"
                          : "bg-white/95 dark:bg-slate-900/90 border border-[#eedcd5] dark:border-slate-800 hover:border-[#d99f9f] hover:shadow-md"
                      )}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Large Number Box on the left */}
                        <div
                          className={cn(
                            "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black flex-shrink-0 transition-colors",
                            isSelected
                              ? "bg-[#991b1b] text-white shadow-md shadow-red-950/20"
                              : "bg-[#fdf0f0] dark:bg-red-950/40 text-[#991b1b] dark:text-red-400"
                          )}
                        >
                          {l.lessonNumber}
                        </div>

                        {/* Text Information */}
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-[#b91c1c] mb-0.5">
                            BÀI {l.lessonNumber}
                          </div>
                          <h3 className="text-base sm:text-lg font-bold text-[#2d2321] dark:text-slate-100 truncate">
                            {l.titleZh}
                          </h3>
                          <div className="text-xs sm:text-sm text-[#78645e] dark:text-slate-400 truncate italic">
                            {l.meaningVi}
                          </div>
                          <div className="text-[11px] text-[#a08d87] dark:text-slate-500 mt-1">
                            0/{l.totalWords} thuộc
                          </div>
                        </div>
                      </div>

                      {/* Right indicator: Arrow on selected card */}
                      {isSelected ? (
                        <div className="text-[#b91c1c] text-xl font-bold flex-shrink-0 pl-2">
                          →
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playSpeech(l.titleZh, "zh-CN");
                          }}
                          className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-[#78645e] hover:text-[#991b1b] hover:bg-[#fdf0f0] transition-all"
                          title="Phát âm"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      )}
                    </motion.div>
                  );
                })
              : filteredEnglishLessons.map((d) => {
                  const isSelected = selectedLessonId === d.day;
                  return (
                    <motion.div
                      key={d.day}
                      whileHover={{ y: -2 }}
                      onClick={() => selectLesson(d.day)}
                      className={cn(
                        "rounded-2xl transition-all duration-200 cursor-pointer p-4 sm:p-5 flex items-center justify-between group select-none",
                        isSelected
                          ? "bg-[#fffbfb] dark:bg-red-950/20 border-2 border-[#b91c1c] shadow-[0_4px_24px_rgba(185,28,28,0.18)]"
                          : "bg-white/95 dark:bg-slate-900/90 border border-[#eedcd5] dark:border-slate-800 hover:border-[#d99f9f] hover:shadow-md"
                      )}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Large Number Box on the left */}
                        <div
                          className={cn(
                            "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black flex-shrink-0 transition-colors",
                            isSelected
                              ? "bg-[#991b1b] text-white shadow-md shadow-red-950/20"
                              : "bg-[#fdf0f0] dark:bg-red-950/40 text-[#991b1b] dark:text-red-400"
                          )}
                        >
                          {d.day}
                        </div>

                        {/* Text Information */}
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-[#b91c1c] mb-0.5">
                            BÀI {d.day}
                          </div>
                          <h3 className="text-base sm:text-lg font-bold text-[#2d2321] dark:text-slate-100 truncate font-heading">
                            {d.title}
                          </h3>
                          <div className="text-xs sm:text-sm text-[#78645e] dark:text-slate-400 truncate italic">
                            {d.objectiveVi}
                          </div>
                          <div className="text-[11px] text-[#a08d87] dark:text-slate-500 mt-1">
                            0/{d.tasks.length} nhiệm vụ · {d.sprintBadge}
                          </div>
                        </div>
                      </div>

                      {/* Right indicator */}
                      {isSelected ? (
                        <div className="text-[#b91c1c] text-xl font-bold flex-shrink-0 pl-2">
                          →
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playSpeech(d.title, "en-US");
                          }}
                          className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-[#78645e] hover:text-[#991b1b] hover:bg-[#fdf0f0] transition-all"
                          title="Phát âm"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      )}
                    </motion.div>
                  );
                })}
          </div>

          {/* ======================================================== */}
          {/* EXPANDED ACTIVE LESSON STUDY DRAWER                      */}
          {/* ======================================================== */}
          {selectedLessonId && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 rounded-3xl bg-white dark:bg-slate-900 border border-[#eedcd5] dark:border-slate-800 p-6 sm:p-8 shadow-lg space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#eedcd5]/70 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#991b1b] text-white flex items-center justify-center text-xl font-black">
                    {selectedLessonId}
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#991b1b]">
                      Chi tiết bài học {selectedLessonId}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#2d2321] dark:text-slate-100 font-heading">
                      {track === "zh" ? activeZhLesson.titleZh : activeEnLesson.title}
                    </h2>
                    <p className="text-xs text-[#78645e] dark:text-slate-400 italic">
                      {track === "zh" ? activeZhLesson.meaningVi : activeEnLesson.objectiveVi}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      if (track === "zh") {
                        playSpeech(activeZhLesson.titleZh, "zh-CN");
                      } else {
                        playSpeech(activeEnLesson.title, "en-US");
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-[#eedcd5] text-[#991b1b] font-semibold gap-1.5"
                  >
                    <Volume2 className="w-4 h-4" />
                    Nghe mẫu
                  </Button>
                </div>
              </div>

              {/* Tasks List for the Active Lesson */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#78645e]">
                  Nhiệm vụ rèn luyện bài này
                </h4>

                {track === "zh" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {activeZhLesson.tasks.map((task, idx) => (
                      <div
                        key={task.id}
                        className="p-4 rounded-2xl bg-[#fcf9f6] dark:bg-slate-850 border border-[#eedcd5]/80 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#991b1b]">
                            Phần {idx + 1}: {task.title}
                          </span>
                          <button
                            onClick={() => playSpeech(task.detail, "zh-CN")}
                            className="p-1 rounded text-[#78645e] hover:text-[#991b1b]"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-base font-bold text-[#2d2321] dark:text-slate-100">
                          {task.detail}
                        </div>
                        {task.pinyin && (
                          <div className="text-xs text-[#991b1b] font-mono">{task.pinyin}</div>
                        )}
                        {task.meaning && (
                          <div className="text-xs text-[#78645e] italic">{task.meaning}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeEnLesson.tasks.map((t, idx) => (
                      <div
                        key={t.id}
                        className="p-4 sm:p-5 rounded-2xl bg-[#fcf9f6] dark:bg-slate-850 border border-[#eedcd5]/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 max-w-xl">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#fdf0f0] text-[#991b1b]">
                              Nhiệm vụ {idx + 1} · {t.duration}
                            </span>
                            <span className="text-xs font-semibold text-[#2d2321] dark:text-slate-200">
                              {t.title}
                            </span>
                          </div>
                          <p className="text-xs text-[#78645e] dark:text-slate-400">
                            {t.description}
                          </p>
                          {t.keyPhrase && (
                            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#eedcd5]/60 text-xs font-mono text-[#991b1b] flex items-center justify-between gap-2">
                              <span>{t.keyPhrase}</span>
                              <button
                                onClick={() => {
                                  playSpeech(t.keyPhrase || "");
                                }}
                                className="p-1 hover:text-[#991b1b]"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <Link href={t.actionHref}>
                          <Button className="bg-[#991b1b] hover:bg-[#831717] text-white text-xs font-bold rounded-xl gap-1.5 flex-shrink-0 shadow-sm">
                            {t.actionLabel}
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </main>
      </div>
    </div>
  );
}

export default function LessonsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fcf9f5] flex items-center justify-center text-[#991b1b] font-bold text-sm">
          Đang tải phòng học...
        </div>
      }
    >
      <LessonsContent />
    </Suspense>
  );
}
