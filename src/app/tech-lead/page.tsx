"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Shield,
  Terminal,
  Cpu,
  Clock,
  CheckCircle2,
  Circle,
  Play,
  Volume2,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  Zap,
  Flame,
  ArrowUpRight,
  Layers,
  Repeat,
  MessageSquare,
  AlertTriangle,
  Lightbulb,
  Award,
  BookOpen,
  Star,
  TrendingUp,
  BarChart3,
  Calendar,
  CheckSquare,
  Target,
  FileText,
  RotateCcw,
  Sparkle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DAILY_ROADMAP_DATA, DayPlan, DailyTask } from "@/data/daily-roadmap-data";

// --- 12-WEEK ROADMAP DATA ---
interface WeekPlan {
  week: number;
  phase: 1 | 2 | 3;
  phaseTitle: string;
  phaseBadge: string;
  title: string;
  focusVi: string;
  keySkills: string[];
  deliverable: string;
  practiceLink: {
    label: string;
    href: string;
    type: "shadowing" | "roleplay" | "starters";
  };
}

const WEEKS_DATA: WeekPlan[] = [
  {
    week: 1,
    phase: 1,
    phaseTitle: "Tháng 1: Foundation & Discovery Calls",
    phaseBadge: "Phản xạ kiến trúc & Khai thác yêu cầu",
    title: "Chuẩn hoá phát âm thuật ngữ IT & Giới thiệu năng lực team",
    focusVi: "Xóa bỏ thói quen dịch nhẩm, phát âm chuẩn các từ dễ sai (architecture, microservices, asynchronous, latency) và giới thiệu cấu trúc hệ thống lưu loát.",
    keySkills: ["Self & Team Introduction as Lead", "Pronunciation of core IT lexicon", "Setting meeting agenda with foreign clients"],
    deliverable: "Thực hành bài hội thoại Kickoff & Discovery Call với Global Product Director.",
    practiceLink: {
      label: "Luyện Shadowing: Client Kickoff Call",
      href: "/shadowing?tab=dialogues&dialogue=client-kickoff-discovery",
      type: "shadowing",
    },
  },
  {
    week: 2,
    phase: 1,
    phaseTitle: "Tháng 1: Foundation & Discovery Calls",
    phaseBadge: "Phản xạ kiến trúc & Khai thác yêu cầu",
    title: "NFR Discovery & Khai thác các chỉ số phi chức năng",
    focusVi: "Cách đặt câu hỏi làm rõ P99 Latency, Concurrent Users, Throughput, RTO/RPO và yêu cầu tuân thủ dữ liệu mà không bị lúng túng.",
    keySkills: ["Clarifying ambiguous requirements", "Non-functional requirements (NFRs)", "Asking probing questions politely"],
    deliverable: "Luyện 12 mẫu câu System Design & NFRs trong Speech Lab.",
    practiceLink: {
      label: "Luyện câu: System Design & NFRs",
      href: "/shadowing?tab=sentences&category=it-system-design",
      type: "shadowing",
    },
  },
  {
    week: 3,
    phase: 1,
    phaseTitle: "Tháng 1: Foundation & Discovery Calls",
    phaseBadge: "Phản xạ kiến trúc & Khai thác yêu cầu",
    title: "Giao tiếp Agile, Báo cáo Blocker & Code Review",
    focusVi: "Báo cáo tiến độ Sprint ngắn gọn, giải thích Technical Debt, và đưa ra feedback trong Pull Request một cách chuyên nghiệp.",
    keySkills: ["Daily standup updates without fluff", "Flagging blockers diplomatically", "Constructive PR code reviews"],
    deliverable: "Luyện 12 câu Agile Standup & PR review phản xạ nhanh.",
    practiceLink: {
      label: "Luyện câu: Daily Agile & Code Review",
      href: "/shadowing?tab=sentences&category=it-daily-agile",
      type: "shadowing",
    },
  },
  {
    week: 4,
    phase: 1,
    phaseTitle: "Tháng 1: Foundation & Discovery Calls",
    phaseBadge: "Phản xạ kiến trúc & Khai thác yêu cầu",
    title: "Phỏng vấn giải pháp kỹ thuật & Thuyết trình sơ đồ luồng",
    focusVi: "Thuyết trình sơ đồ hệ thống CapitaStar, luồng xác thực OAuth2 / JWT, và phân tách trách nhiệm giữa các microservices.",
    keySkills: ["Diagram walkthrough vocabulary", "Explaining auth flows & tokens", "Presenting data boundaries"],
    deliverable: "Kịch bản mô phỏng Solution Architecture Interview 1-on-1 với AI CTO.",
    practiceLink: {
      label: "Mô phỏng: Architecture Defense Call",
      href: "/roleplay?scenario=builtin-solution-architecture",
      type: "roleplay",
    },
  },
  {
    week: 5,
    phase: 2,
    phaseTitle: "Tháng 2: System Design & Deep Dive",
    phaseBadge: "Bảo vệ kiến trúc & Đàm phán ngoại giao",
    title: "Mô hình xử lý phân tán, Event-Driven & Message Brokers",
    focusVi: "Giải thích các khái niệm Kafka, RabbitMQ, Outbox Pattern, At-least-once delivery và Dead Letter Queue bằng tiếng Anh trôi chảy.",
    keySkills: ["Explaining async messaging", "Dealing with message loss & idempotency", "Guaranteed delivery trade-offs"],
    deliverable: "Luyện tập bộ câu hỏi Event-Driven Architecture.",
    practiceLink: {
      label: "Luyện câu: System Design Deep Dive",
      href: "/shadowing?tab=sentences&category=it-system-design",
      type: "shadowing",
    },
  },
  {
    week: 6,
    phase: 2,
    phaseTitle: "Tháng 2: System Design & Deep Dive",
    phaseBadge: "Bảo vệ kiến trúc & Đàm phán ngoại giao",
    title: "Chiến lược Caching & Tối ưu CSDL quy mô triệu người dùng",
    focusVi: "Phân tích Redis Distributed Caching, Cache Invalidation, Thundering Herd problem, CQRS & Read Replicas.",
    keySkills: ["Explaining cache-aside patterns", "Database read-write splitting", "NFR optimization arguments"],
    deliverable: "Thực hành bài hội thoại bảo vệ kiến trúc Caching với khách hàng Singapore.",
    practiceLink: {
      label: "Luyện Shadowing: Caching Defense",
      href: "/shadowing?tab=dialogues&dialogue=client-kickoff-discovery",
      type: "shadowing",
    },
  },
  {
    week: 7,
    phase: 2,
    phaseTitle: "Tháng 2: System Design & Deep Dive",
    phaseBadge: "Bảo vệ kiến trúc & Đàm phán ngoại giao",
    title: "Diplomatic Pushback: Từ chối yêu cầu phi thực tế và Scope Creep",
    focusVi: "Kỹ năng từ chối khách hàng mà không làm phật lòng: dùng công thức 'Yes, if...', đưa ra các phương án đánh đổi (trade-offs) thay vì nói 'No' cụt ngủn.",
    keySkills: ["Diplomatic disagreement", "Managing scope creep without conflict", "Framing engineering cost & risk"],
    deliverable: "Thực hành kịch bản đàm phán Scope Creep với Client Product Owner.",
    practiceLink: {
      label: "Mô phỏng AI: Scope Creep Negotiation",
      href: "/roleplay?scenario=builtin-solution-architecture",
      type: "roleplay",
    },
  },
  {
    week: 8,
    phase: 2,
    phaseTitle: "Tháng 2: System Design & Deep Dive",
    phaseBadge: "Bảo vệ kiến trúc & Đàm phán ngoại giao",
    title: "Bảo vệ Legacy Migration & Strangler Fig Pattern",
    focusVi: "Thuyết phục khách hàng chi ngân sách cho việc chuyển đổi Monolith sang Microservices theo lộ trình an toàn từng phần.",
    keySkills: ["Presenting migration roadmaps", "Risk mitigation phrasing", "Strangler Fig pattern advocacy"],
    deliverable: "Luyện tập bài hội thoại bảo vệ lộ trình di trú hệ thống.",
    practiceLink: {
      label: "Luyện Shadowing: Solution Walkthrough",
      href: "/shadowing?tab=dialogues&dialogue=client-kickoff-discovery",
      type: "shadowing",
    },
  },
  {
    week: 9,
    phase: 3,
    phaseTitle: "Tháng 3: Crisis Management & Executive Influence",
    phaseBadge: "Ứng phó sự cố & Bản lĩnh C-Level",
    title: "Quản lý sự cố trực tiếp (Incident Triage & War Room Comms)",
    focusVi: "Dẫn dắt cuộc họp khẩn cấp khi hệ thống bị sập: thông báo trạng thái, giữ bình tĩnh cho stakeholder và định hướng điều tra.",
    keySkills: ["War room leadership", "Calm and objective communication", "Stakeholder containment"],
    deliverable: "Kịch bản mô phỏng War Room Outage với AI VP of Engineering.",
    practiceLink: {
      label: "Mô phỏng AI: Outage Incident War Room",
      href: "/roleplay?scenario=builtin-solution-architecture",
      type: "roleplay",
    },
  },
  {
    week: 10,
    phase: 3,
    phaseTitle: "Tháng 3: Crisis Management & Executive Influence",
    phaseBadge: "Ứng phó sự cố & Bản lĩnh C-Level",
    title: "Post-Mortem & Phân tích nguyên nhân gốc rễ (Blameless RCA)",
    focusVi: "Trình bày báo cáo sự cố không đổ lỗi: giải thích nguyên nhân gốc rễ, lỗ hổng quy trình và biện pháp phòng ngừa dài hạn.",
    keySkills: ["Blameless retrospective language", "Root cause explanation", "Preventive action commitments"],
    deliverable: "Luyện 10 mẫu câu Post-Mortem và RCA chuyên nghiệp.",
    practiceLink: {
      label: "Luyện câu: Incident & Blameless RCA",
      href: "/shadowing?tab=sentences&category=it-system-design",
      type: "shadowing",
    },
  },
  {
    week: 11,
    phase: 3,
    phaseTitle: "Tháng 3: Crisis Management & Executive Influence",
    phaseBadge: "Ứng phó sự cố & Bản lĩnh C-Level",
    title: "Kỹ thuật 'Mua thời gian suy nghĩ' khi gặp câu hỏi hóc búa",
    focusVi: "Làm chủ 8 mẫu câu phản xạ để có 5-10 giây suy nghĩ mạch lạc khi đối tác hỏi bất ngờ, xóa bỏ âm 'uh... um...' gây thiếu tự tin.",
    keySkills: ["Stalling gracefully without hesitation", "Clarifying complex questions", "Buying thinking time formulas"],
    deliverable: "Thực hành toàn bộ bộ công thức phản xạ tức thì bên dưới.",
    practiceLink: {
      label: "Thực hành ngay bộ công thức phản xạ",
      href: "#golden-formulas",
      type: "starters",
    },
  },
  {
    week: 12,
    phase: 3,
    phaseTitle: "Tháng 3: Crisis Management & Executive Influence",
    phaseBadge: "Ứng phó sự cố & Bản lĩnh C-Level",
    title: "Executive Presence & Thuyết trình Chiến lược Công nghệ",
    focusVi: "Tổng kết năng lực: nói ngắn gọn, thuyết phục ở tầm nhìn kinh doanh (business value) thay vì chỉ chi tiết kỹ thuật thuần túy.",
    keySkills: ["Executive presence", "Translating tech to business ROI", "Confident wrap-up & next steps"],
    deliverable: "Thử thách Call 15 phút tổng kết với AI CTO đánh giá toàn diện.",
    practiceLink: {
      label: "Thử thách tổng kết: AI CTO Review",
      href: "/roleplay?scenario=builtin-solution-architecture",
      type: "roleplay",
    },
  },
];

// --- GOLDEN FORMULAS ---
interface Formula {
  id: string;
  category: "thinking-time" | "pushback" | "incident" | "clarifying" | "architecture";
  categoryLabel: string;
  title: string;
  sentence: string;
  highlightWords: string[];
  viMeaning: string;
  proTip: string;
}

const GOLDEN_FORMULAS: Formula[] = [
  {
    id: "f1",
    category: "thinking-time",
    categoryLabel: "Mua thời gian suy nghĩ (Thinking Time)",
    title: "Khi khách hàng hỏi một câu hỏi kiến trúc bất ngờ",
    sentence: "That's a very fair point. Let me pull up the technical context and break down the options for you in just a second.",
    highlightWords: ["fair point", "pull up", "break down", "options"],
    viMeaning: "Đó là một điểm hoàn toàn xác đáng. Cho phép tôi mở nhanh tài liệu kỹ thuật và phân tích các phương án cho anh/chị ngay sau đây.",
    proTip: "Dùng câu này thay vì 'uh... wait a minute'. Vừa thể hiện sự tôn trọng vừa cho bạn 5-7 giây sắp xếp luồng suy nghĩ bằng tiếng Anh.",
  },
  {
    id: "f2",
    category: "thinking-time",
    categoryLabel: "Mua thời gian suy nghĩ (Thinking Time)",
    title: "Khi cần tính toán hoặc kiểm tra lại với team",
    sentence: "From an engineering perspective, that is definitely feasible; however, I want to double-check the database throughput constraints before committing to a hard timeline.",
    highlightWords: ["engineering perspective", "feasible", "double-check", "throughput constraints", "committing"],
    viMeaning: "Về mặt kỹ thuật điều này hoàn toàn khả thi; tuy nhiên, tôi muốn kiểm tra lại giới hạn băng thông CSDL trước khi chốt một mốc thời gian cụ thể.",
    proTip: "Giúp bạn tránh bị ép deadline ngay trên cuộc gọi mà vẫn tỏ ra là một Lead cẩn trọng, am hiểu hệ thống.",
  },
  {
    id: "f3",
    category: "pushback",
    categoryLabel: "Từ chối khéo & Đàm phán (Diplomatic Pushback)",
    title: "Khi khách hàng đòi thêm tính năng sát ngày release (Scope Creep)",
    sentence: "We can certainly incorporate this requirement into our roadmap; however, doing so within the current sprint would directly jeopardize our scheduled release date. Would you prefer we prioritize this over the payment flow, or queue it for Sprint Two?",
    highlightWords: ["incorporate", "jeopardize", "scheduled release", "prioritize over", "queue it"],
    viMeaning: "Chúng tôi chắc chắn có thể đưa yêu cầu này vào kế hoạch; tuy nhiên, thực hiện nó ngay trong sprint này sẽ ảnh hưởng trực tiếp đến ngày phát hành dự kiến. Anh/chị muốn ưu tiên tính năng này hơn luồng thanh toán hay đưa vào Sprint tiếp theo?",
    proTip: "Quy tắc vàng: Không bao giờ nói 'No'. Hãy đưa cho khách hàng quyền lựa chọn đánh đổi (Trade-off).",
  },
  {
    id: "f4",
    category: "pushback",
    categoryLabel: "Từ chối khéo & Đàm phán (Diplomatic Pushback)",
    title: "Khi khách hàng đề xuất giải pháp kỹ thuật có rủi ro cao",
    sentence: "While that approach solves the immediate bottleneck, our primary concern is that it introduces significant technical debt and tightly couples our services. A more resilient alternative would be using an asynchronous message queue.",
    highlightWords: ["immediate bottleneck", "technical debt", "tightly couples", "resilient alternative", "asynchronous"],
    viMeaning: "Mặc dù hướng tiếp cận đó giải quyết được nghẽn cổ chai trước mắt, mối lo ngại lớn nhất của chúng tôi là nó tạo ra nợ kỹ thuật lớn và làm các dịch vụ phụ thuộc chặt chẽ vào nhau. Một giải pháp bền bỉ hơn là sử dụng hàng đợi thông điệp bất đồng bộ.",
    proTip: "Thừa nhận giải pháp của đối tác trước ('While that approach...'), sau đó phân tích rủi ro dài hạn để bảo vệ kiến trúc.",
  },
  {
    id: "f5",
    category: "incident",
    categoryLabel: "Xử lý khủng hoảng & Sự cố (Incident)",
    title: "Khi hệ thống sập và khách hàng đang hoảng loạn",
    sentence: "We have fully isolated the issue to our primary authentication cluster. Our squad is currently executing the rollback procedure, and I will share a live status update in our Slack channel every fifteen minutes until full recovery.",
    highlightWords: ["fully isolated", "authentication cluster", "executing rollback", "status update", "full recovery"],
    viMeaning: "Chúng tôi đã cô lập hoàn toàn sự cố ở cụm xác thực chính. Team đang tiến hành quy trình rollback, và tôi sẽ cập nhật trạng thái trực tiếp trên kênh Slack mỗi 15 phút cho đến khi phục hồi hoàn toàn.",
    proTip: "Bình tĩnh, rõ ràng và có cam kết thời gian cập nhật cụ thể (mỗi 15 phút). Khách hàng cần sự an tâm hơn là lời xin lỗi rối rít.",
  },
  {
    id: "f6",
    category: "incident",
    categoryLabel: "Xử lý khủng hoảng & Sự cố (Incident)",
    title: "Giải thích nguyên nhân trong báo cáo Post-Mortem (RCA)",
    sentence: "The root cause was an unindexed query triggering database connection pool exhaustion. To prevent recurrence, we have added strict query timeouts and isolated analytical traffic to read replicas.",
    highlightWords: ["root cause", "connection pool exhaustion", "prevent recurrence", "isolated analytical traffic", "read replicas"],
    viMeaning: "Nguyên nhân gốc rễ là do một truy vấn chưa đánh index làm cạn kiệt cổng kết nối CSDL. Để ngăn ngừa tái diễn, chúng tôi đã đặt giới hạn timeout nghiêm ngặt và tách luồng phân tích dữ liệu sang các bản sao read replica.",
    proTip: "Tránh đổ lỗi cá nhân (blameless). Luôn tập trung vào cơ chế kỹ thuật phòng ngừa (safeguards) để xây dựng niềm tin dài hạn.",
  },
  {
    id: "f7",
    category: "clarifying",
    categoryLabel: "Làm rõ yêu cầu mập mờ (Clarifying)",
    title: "Làm rõ khi khách hàng nói 'Tôi muốn hệ thống Real-time'",
    sentence: "Just to ensure we are strictly aligned on expectations, when you mention real-time processing, are we targeting sub-second latency or is eventual consistency within a few seconds acceptable?",
    highlightWords: ["strictly aligned", "real-time processing", "sub-second latency", "eventual consistency"],
    viMeaning: "Để đảm bảo chúng ta hoàn toàn thống nhất về kỳ vọng, khi bạn nhắc đến xử lý thời gian thực, mục tiêu là độ trễ dưới một giây hay tính nhất quán sau vài giây là chấp nhận được?",
    proTip: "Câu hỏi này phân định đẳng cấp của một Lead Architect. Nó giúp tiết kiệm hàng trăm giờ code sai hướng cho cả team.",
  },
  {
    id: "f8",
    category: "architecture",
    categoryLabel: "Bảo vệ kiến trúc & Đánh đổi (Architecture)",
    title: "Thuyết phục khách hàng đầu tư vào Refactor & Giảm Tech Debt",
    sentence: "Investing three days into refactoring this legacy data layer now will prevent recurring regressions and boost our squad's delivery velocity by at least twenty-five percent next quarter.",
    highlightWords: ["refactoring", "legacy data layer", "recurring regressions", "delivery velocity"],
    viMeaning: "Đầu tư ba ngày để tái cấu trúc tầng dữ liệu cũ này ngay bây giờ sẽ ngăn chặn các lỗi tái diễn và tăng tốc độ bàn giao của team ít nhất 25% trong quý tới.",
    proTip: "Khách hàng không muốn trả tiền cho 'clean code', họ chỉ muốn trả tiền cho 'tốc độ giao hàng nhanh hơn và ít bug hơn'. Hãy dùng công thức ROI này!",
  },
];

// Post-Call Reflection entry interface
interface CallReflection {
  id: string;
  date: string;
  meetingTitle: string;
  rating: number; // 1-5
  highlight: string;
  stumbledPoint: string;
  aiTip: string;
}

export default function TechLeadPage() {
  const [activeTab, setActiveTab] = useState<"daily" | "assessment" | "formulas" | "weeks">("daily");
  
  // Daily roadmap state
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [activeSprintFilter, setActiveSprintFilter] = useState<number | "all">("all");
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  
  // Weekly roadmap state
  const [completedWeeks, setCompletedWeeks] = useState<number[]>([]);
  
  // Formulas state
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Assessment & Reflection Log state
  const [reflections, setReflections] = useState<CallReflection[]>([]);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [rating, setRating] = useState(4);
  const [highlight, setHighlight] = useState("");
  const [stumbledPoint, setStumbledPoint] = useState("");
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  // Sync tab with URL query if provided
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "daily" || tabParam === "assessment" || tabParam === "formulas" || tabParam === "weeks") {
        setActiveTab(tabParam);
      }
      const dayParam = params.get("day");
      if (dayParam) {
        const d = parseInt(dayParam, 10);
        if (!isNaN(d) && d >= 1 && d <= 30) {
          setSelectedDayNumber(d);
        }
      }
    }
  }, []);

  // Load completed days & weeks & reflections from localStorage
  useEffect(() => {
    try {
      const savedDays = localStorage.getItem("tran_tech_lead_completed_days");
      if (savedDays) {
        const parsed: number[] = JSON.parse(savedDays);
        setCompletedDays(parsed);
        // Default selected day to the earliest unfinished day
        const firstUnfinished = DAILY_ROADMAP_DATA.find((d) => !parsed.includes(d.day));
        if (firstUnfinished) {
          setSelectedDayNumber(firstUnfinished.day);
        }
      }

      const savedWeeks = localStorage.getItem("tran_tech_lead_completed_weeks");
      if (savedWeeks) {
        setCompletedWeeks(JSON.parse(savedWeeks));
      }

      const savedReflections = localStorage.getItem("tran_tech_lead_call_reflections");
      if (savedReflections) {
        setReflections(JSON.parse(savedReflections));
      } else {
        // Pre-populate with realistic example reflection if none exists
        const defaultInitial: CallReflection[] = [
          {
            id: "ref-sample-1",
            date: "Hôm qua",
            meetingTitle: "Weekly Architecture Sync (Singapore Client)",
            rating: 4,
            highlight: "Trình bày luồng Redis distributed cache và CQRS rất tự tin, khách gật đầu đồng ý.",
            stumbledPoint: "Lúc khách hỏi dồn về budget infra Azure Cosmos DB bị đứng hình mất 4 giây dịch nhẩm.",
            aiTip: "Lần tới hãy dùng ngay mẫu câu: 'That's a valid financial concern. Let me pull up our tier breakdown and run the exact DTU estimates for you right now.' để vừa chuyên nghiệp vừa làm chủ 5 giây suy nghĩ.",
          },
        ];
        setReflections(defaultInitial);
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleDay = (day: number) => {
    setCompletedDays((prev) => {
      const next = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day];
      try {
        localStorage.setItem("tran_tech_lead_completed_days", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const toggleWeek = (week: number) => {
    setCompletedWeeks((prev) => {
      const next = prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week];
      try {
        localStorage.setItem("tran_tech_lead_completed_weeks", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const playPhraseAudio = (phraseText: string, id: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setPlayingId(id);

    const utterance = new SpeechSynthesisUtterance(phraseText);
    utterance.lang = "en-US";
    utterance.rate = 0.93;

    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(
      (v) => (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha")) && v.lang.startsWith("en")
    );
    if (premiumVoice) utterance.voice = premiumVoice;

    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);
    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Save new post-call reflection
  const handleSaveReflection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim()) return;

    setIsSubmittingLog(true);

    // Generate pragmatic AI tip based on what was stumbled
    let advice = "Tập trung áp dụng mẫu câu Buying Thinking Time để giữ quyền kiểm soát nhịp hội thoại.";
    const lower = (stumbledPoint || "").toLowerCase();
    if (lower.includes("budget") || lower.includes("tiền") || lower.includes("chi phí")) {
      advice = "Khi bị hỏi dồn về chi phí, hãy hướng trọng tâm sang ROI: 'While this tier carries an initial overhead, it eliminates recurring failover costs by 40%.'";
    } else if (lower.includes("deadline") || lower.includes("tiến độ") || lower.includes("kịp không")) {
      advice = "Dùng kỹ thuật Diplomatic Trade-off: 'We can hit the target date if we decouple feature X into phase two.' Không bao giờ nhận bừa hoặc từ chối cụt ngủn.";
    } else if (lower.includes("dịch nhẩm") || lower.includes("từ vựng") || lower.includes("đứng hình") || lower.includes("quên từ")) {
      advice = "Để trị chứng dịch nhẩm, hãy duy trì thói quen đọc to 3 câu Shadowing mỗi sáng trước khi mở laptop để cơ miệng 'ấm' sẵn sàng.";
    } else if (lower.includes("ngắt lời") || lower.includes("chèn câu")) {
      advice = "Chèn câu lịch thiệp: 'Excuse me for jumping in, but I'd like to clarify a key architectural detail before we move forward.'";
    }

    const newEntry: CallReflection = {
      id: "ref-" + Date.now(),
      date: new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
      meetingTitle: meetingTitle.trim(),
      rating,
      highlight: highlight.trim() || "Hoàn thành buổi trao đổi suôn sẻ.",
      stumbledPoint: stumbledPoint.trim() || "Chưa có vấp váp đáng kể.",
      aiTip: advice,
    };

    const nextList = [newEntry, ...reflections];
    setReflections(nextList);
    try {
      localStorage.setItem("tran_tech_lead_call_reflections", JSON.stringify(nextList));
    } catch {
      // ignore
    }

    // Reset inputs
    setMeetingTitle("");
    setHighlight("");
    setStumbledPoint("");
    setRating(4);
    setIsSubmittingLog(false);
  };

  const filteredDays = useMemo(() => {
    if (activeSprintFilter === "all") return DAILY_ROADMAP_DATA;
    return DAILY_ROADMAP_DATA.filter((d) => d.sprint === activeSprintFilter);
  }, [activeSprintFilter]);

  const selectedDayData = useMemo(() => {
    return DAILY_ROADMAP_DATA.find((d) => d.day === selectedDayNumber) || DAILY_ROADMAP_DATA[0];
  }, [selectedDayNumber]);

  const filteredFormulas = useMemo(() => {
    if (activeCategory === "all") return GOLDEN_FORMULAS;
    return GOLDEN_FORMULAS.filter((f) => f.category === activeCategory);
  }, [activeCategory]);

  const daysPercent = Math.round((completedDays.length / 30) * 100);
  const weeksPercent = Math.round((completedWeeks.length / 12) * 100);

  return (
    <div className="mx-auto max-w-6xl px-3.5 py-6 sm:px-6 sm:py-8 space-y-8">
      {/* EXECUTIVE COMMAND HERO BANNER */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-indigo-900/50 p-6 sm:p-10 shadow-2xl text-white"
      >
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-semibold text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Chương trình chuyên biệt cho Trân · Tech Lead & Solution Architect</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Tech Lead Client Call{" "}
              <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent">
                Fluency Suite
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Giải pháp thực chiến xóa tan cảm giác lúng túng khi call với khách nước ngoài. Lộ trình micro-learning 15 phút mỗi ngày, nhật ký tự rút kinh nghiệm sau mỗi buổi họp và bộ phản xạ bảo vệ kiến trúc tự tin.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                onClick={() => setActiveTab("daily")}
                className="bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/25 text-xs sm:text-sm gap-2"
              >
                <Calendar className="w-4 h-4" />
                Vào Lộ trình 30 Ngày hôm nay
              </Button>
              <Button
                variant="outline"
                onClick={() => setActiveTab("assessment")}
                className="rounded-xl border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2.5 text-xs sm:text-sm gap-2"
              >
                <BarChart3 className="w-4 h-4 text-sky-400" />
                Đánh giá độ lưu loát & Nhật ký Call
              </Button>
            </div>
          </div>

          {/* TELEMETRY KPI CARD */}
          <div className="w-full lg:w-80 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Tiến độ 30 Ngày Sprint</span>
              <span className="text-xs font-bold text-sky-400">{completedDays.length} / 30 Ngày</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-white">Hoàn thành Sprint</span>
                <span className="text-sky-300 font-bold">{daysPercent}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden border border-slate-700/60">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${daysPercent}%` }}
                  transition={{ duration: 0.6 }}
                  className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                <div className="text-lg font-extrabold text-white">{completedDays.length}</div>
                <div className="text-[11px] text-slate-400 font-medium">Ngày đã check-in</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                <div className="text-lg font-extrabold text-emerald-400">{reflections.length}</div>
                <div className="text-[11px] text-slate-400 font-medium">Cuộc call đã log</div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* EXECUTIVE NAVIGATION TABS */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("daily")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all",
            activeTab === "daily"
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700"
              : "text-slate-600 dark:text-slate-400 hover:text-foreground"
          )}
        >
          <Calendar className="w-4 h-4 text-indigo-500" />
          <span>Sprint 30 Ngày Call Khách</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 font-semibold">
            {completedDays.length}/30
          </span>
        </button>

        <button
          onClick={() => setActiveTab("assessment")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all",
            activeTab === "assessment"
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700"
              : "text-slate-600 dark:text-slate-400 hover:text-foreground"
          )}
        >
          <BarChart3 className="w-4 h-4 text-sky-500" />
          <span>Đánh giá Lưu Loát & Nhật Ký Call</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-300 font-semibold">
            {reflections.length} log
          </span>
        </button>

        <button
          onClick={() => setActiveTab("formulas")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all",
            activeTab === "formulas"
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700"
              : "text-slate-600 dark:text-slate-400 hover:text-foreground"
          )}
        >
          <Zap className="w-4 h-4 text-amber-500" />
          <span>8 Mẫu Câu Phản Xạ Cứu Cánh</span>
        </button>

        <button
          onClick={() => setActiveTab("weeks")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all",
            activeTab === "weeks"
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700"
              : "text-slate-600 dark:text-slate-400 hover:text-foreground"
          )}
        >
          <Award className="w-4 h-4 text-emerald-500" />
          <span>Lộ Trình 12 Tuần Dài Hạn</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 font-semibold">
            {completedWeeks.length}/12
          </span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: 30-DAY DAILY SPRINT
      ========================================================================= */}
      {activeTab === "daily" && (
        <div className="space-y-8">
          {/* TODAY'S SPOTLIGHT FOCUS CARD */}
          <section className="rounded-3xl bg-gradient-to-br from-indigo-900/90 via-slate-900 to-slate-950 border border-indigo-700/50 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-lg bg-indigo-500/30 border border-indigo-400/40 text-xs font-bold text-indigo-300">
                    Hôm nay của bạn · Ngày {selectedDayData.day} / 30
                  </span>
                  <span className="text-xs text-sky-300 font-medium">{selectedDayData.sprintBadge}</span>
                  {completedDays.includes(selectedDayData.day) && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn thành
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {selectedDayData.title}
                </h2>

                <p className="text-sm text-slate-300 leading-relaxed">
                  <strong className="text-indigo-300 font-semibold">Tình huống thực tế: </strong>
                  {selectedDayData.targetCallSituation}
                </p>

                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {selectedDayData.objectiveVi}
                </p>
              </div>

              {/* Complete Action Button */}
              <div className="flex-shrink-0 flex flex-col items-start md:items-end gap-2">
                <Button
                  onClick={() => toggleDay(selectedDayData.day)}
                  className={cn(
                    "font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition-all gap-2",
                    completedDays.includes(selectedDayData.day)
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                  )}
                >
                  {completedDays.includes(selectedDayData.day) ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Đã hoàn thành ngày này
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-4 h-4" /> Check-in hoàn thành 15 phút hôm nay
                    </>
                  )}
                </Button>
                <span className="text-[11px] text-slate-400">
                  {completedDays.includes(selectedDayData.day) ? "Click để hủy đánh dấu nếu cần" : "Mỗi ngày 15 phút đều đặn tạo nên sự lưu loát"}
                </span>
              </div>
            </div>

            {/* 3 Micro-tasks for the selected day */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-indigo-800/50 relative z-10">
              {selectedDayData.tasks.map((task, tIdx) => (
                <div
                  key={task.id}
                  className="rounded-2xl bg-slate-900/80 border border-indigo-900/60 p-4 flex flex-col justify-between space-y-3 hover:border-indigo-400/50 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300">
                        Nhiệm vụ {tIdx + 1} · {task.duration}
                      </span>
                      <span className="text-[11px] text-slate-400 uppercase font-semibold">
                        {task.type}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-white">{task.title}</h4>

                    <p className="text-xs text-slate-300 leading-relaxed">{task.description}</p>

                    {/* Key phrase if present */}
                    {task.keyPhrase && (
                      <div className="rounded-xl bg-slate-950/80 border border-indigo-900/80 p-3 space-y-1.5 mt-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider">
                            Mẫu câu vàng:
                          </span>
                          <button
                            onClick={() => playPhraseAudio(task.keyPhrase!, task.id)}
                            className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                          >
                            <Volume2 className={cn("w-3.5 h-3.5", playingId === task.id && "animate-pulse text-sky-400")} />
                            {playingId === task.id ? "Đang phát..." : "Nghe mẫu"}
                          </button>
                        </div>
                        <p className="text-xs text-slate-200 font-medium italic">
                          &ldquo;{task.keyPhrase}&rdquo;
                        </p>
                        {task.keyPhraseVi && (
                          <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                            {task.keyPhraseVi}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <Link href={task.actionHref}>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full text-xs font-bold rounded-xl h-8 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 gap-1.5"
                      >
                        {task.actionLabel}
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SPRINT FILTERS & 30-DAY TIMELINE */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-500" />
                  Toàn bộ 30 ngày luyện phản xạ Call Khách
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Chọn bất kỳ ngày nào để xem chi tiết hoặc lọc theo từng Sprint kỹ năng.
                </p>
              </div>

              {/* Sprint Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full -mx-1 px-1 touch-pan-x scrollbar-none">
                {[
                  { id: "all", label: "Tất cả 30 ngày" },
                  { id: 1, label: "Sprint 1: Discovery & Standup" },
                  { id: 2, label: "Sprint 2: Architecture & .NET" },
                  { id: 3, label: "Sprint 3: Pushback & Trade-off" },
                  { id: 4, label: "Sprint 4: Crisis & C-Level" },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSprintFilter(s.id as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                      activeSprintFilter === s.id
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 30 Days Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredDays.map((dayItem) => {
                const isCompleted = completedDays.includes(dayItem.day);
                const isSelected = selectedDayNumber === dayItem.day;

                return (
                  <div
                    key={dayItem.day}
                    onClick={() => setSelectedDayNumber(dayItem.day)}
                    className={cn(
                      "rounded-2xl border p-4 cursor-pointer transition-all flex flex-col justify-between space-y-3 relative overflow-hidden",
                      isSelected && "ring-2 ring-indigo-500 shadow-md",
                      isCompleted
                        ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80"
                        : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-indigo-400"
                    )}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center",
                              isCompleted
                                ? "bg-emerald-600 text-white"
                                : "bg-indigo-600 text-white"
                            )}
                          >
                            {dayItem.day}
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            Ngày {dayItem.day}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDay(dayItem.day);
                          }}
                          className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              <span className="text-emerald-600 dark:text-emerald-400">Xong</span>
                            </>
                          ) : (
                            <>
                              <Circle className="w-4 h-4 text-slate-400 hover:text-indigo-500" />
                              <span className="text-slate-400">Check</span>
                            </>
                          )}
                        </button>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-foreground line-clamp-1">
                        {dayItem.title}
                      </h4>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {dayItem.targetCallSituation}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                        {dayItem.tasks.length} bài tập (15p)
                      </span>
                      <span className="text-slate-400 hover:text-foreground font-semibold flex items-center gap-0.5">
                        {isSelected ? "Đang chọn" : "Xem chi tiết"} &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: CLIENT CALL FLUENCY ASSESSMENT & POST-CALL LOG
      ========================================================================= */}
      {activeTab === "assessment" && (
        <div className="space-y-8">
          {/* MATURE ADULT SELF-EVALUATION RADAR & 4 PILLARS */}
          <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200/60 dark:border-sky-800 text-[11px] font-bold text-sky-600 dark:text-sky-300">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Tiêu chuẩn đánh giá phản xạ dành riêng cho Tech Lead</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground mt-2 tracking-tight">
                Chỉ số sẵn sàng khi Call với Khách Nước Ngoài (Readiness Score)
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                Người lớn đi làm không cần thi cử ngữ pháp. Thước đo thành công duy nhất là: <strong className="text-foreground">khách hiểu đúng giải pháp, tin tưởng năng lực lead của bạn, và cuộc họp đạt kết quả</strong>.
              </p>
            </div>

            {/* 4 Core Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    1. Tốc độ nói & Giảm ngập ngừng (Speech Flow)
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Mục tiêu: 110 - 130 WPM</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full w-[78%]" />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Tránh khoảng lặng chết (dead silence &gt; 3 giây). Biết dùng các filler từ chêm tự nhiên như <em>&ldquo;Let me walk you through...&rdquo;</em> thay vì ngập ngừng im lặng.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-sky-500" />
                    2. Thuật ngữ kiến trúc chuẩn xác (Tech Lexicon)
                  </span>
                  <span className="text-xs font-bold text-sky-600 dark:text-sky-400">Mục tiêu: Tự nhiên 85%+</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full w-[85%]" />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Phát âm chuẩn xác và phản xạ không cần dịch các từ cốt lõi: <em>asynchronous, idempotent, eventual consistency, backpressure, latency, throughput</em>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    3. Ngoại giao & Từ chối mềm mỏng (Diplomatic Pushback)
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Mục tiêu: Đàm phán tự tin</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[74%]" />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Không nói &ldquo;No, we cannot do it&rdquo;. Thay vào đó luôn đưa ra đánh đổi: <em>&ldquo;We can certainly support that, provided we shift scope X to next sprint.&rdquo;</em>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    4. Bản lĩnh dưới áp lực (Under-Pressure Comms)
                  </span>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Mục tiêu: Vững vàng 80%+</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full w-[80%]" />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Khi khách hàng đặt câu hỏi dồn dập hoặc hệ thống gặp sự cố, giữ phong thái điềm tĩnh và chủ động điều phối thông tin.
                </p>
              </div>
            </div>
          </section>

          {/* POST-CALL REFLECTION JOURNAL FORM */}
          <section className="rounded-3xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/60 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Nhật Ký Tự Rút Kinh Nghiệm Sau Mỗi Buổi Call (Post-Call Debrief)
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Dành đúng 2 phút ghi lại sau cuộc họp để AI phân tích và đưa ra giải pháp khắc phục điểm bạn vừa lúng túng.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveReflection} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Tên cuộc họp / Khách hàng:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Daily Standup với Product Director Úc, hoặc Architecture Review CapitaStar..."
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Độ tự tin của bạn hôm nay:
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 rounded-md hover:scale-110 transition-transform"
                      >
                        <Star
                          className={cn(
                            "w-6 h-6",
                            star <= rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-300 dark:text-slate-750"
                          )}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 ml-2">
                      {rating}/5 Sao
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Điểm bạn đã làm tốt (câu nói mượt mà, khách hài lòng):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="VD: Nói được cơ chế caching Redis không vấp, mở đầu cuộc họp tự tin..."
                    value={highlight}
                    onChange={(e) => setHighlight(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Điểm bị vấp hoặc lúng túng (câu hỏi bị đứng hình):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="VD: Lúc khách hỏi dồn về chi phí infra Azure Cosmos DB bị đứng hình mất 5 giây dịch nhẩm..."
                    value={stumbledPoint}
                    onChange={(e) => setStumbledPoint(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={isSubmittingLog || !meetingTitle.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl gap-2 shadow-md shadow-indigo-600/25"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Lưu & Nhận lời khuyên cải thiện cho lần call tới
                </Button>
              </div>
            </form>
          </section>

          {/* RECENT CALL LOGS TIMELINE */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-extrabold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              Lịch sử rút kinh nghiệm các cuộc call ({reflections.length})
            </h3>

            <div className="space-y-3.5">
              {reflections.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3 hover:border-indigo-300 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {entry.date}
                      </span>
                      <h4 className="text-sm font-bold text-foreground">{entry.meetingTitle}</h4>
                    </div>

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "w-3.5 h-3.5",
                            star <= entry.rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-300 dark:text-slate-700"
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                        ✓ Điểm sáng:
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">{entry.highlight}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                      <span className="font-bold text-amber-700 dark:text-amber-400 block mb-1">
                        ⚠ Điểm cần khắc phục:
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">{entry.stumbledPoint}</span>
                    </div>
                  </div>

                  {/* AI Tip */}
                  <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-900/50 flex items-start gap-2.5 text-xs">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-indigo-700 dark:text-indigo-300">
                        Lời khuyên cho cuộc call tiếp theo:{" "}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">{entry.aiTip}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: GOLDEN FORMULAS (MẪU CÂU PHẢN XẠ)
      ========================================================================= */}
      {activeTab === "formulas" && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-foreground flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Bộ công thức phản xạ tức thì (Golden Formulas)
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Những mẫu câu &ldquo;cứu cánh&rdquo; đẳng cấp khi họp giải pháp, từ chối yêu cầu và xử lý sự cố.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 max-w-full -mx-1 px-1 touch-pan-x scrollbar-none">
              {[
                { id: "all", label: "Tất cả" },
                { id: "thinking-time", label: "⏳ Mua thời gian" },
                { id: "pushback", label: "🛡️ Từ chối khéo" },
                { id: "incident", label: "🚨 Sự cố Outage" },
                { id: "clarifying", label: "🔍 Làm rõ yêu cầu" },
                { id: "architecture", label: "🧱 Bảo vệ kiến trúc" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                    activeCategory === tab.id
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFormulas.map((item) => {
              const isPlaying = playingId === item.id;
              const isCopied = copiedId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:border-indigo-400/60 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                        {item.categoryLabel}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">{item.title}</span>
                    </div>

                    {/* Sentence */}
                    <div className="text-sm sm:text-base font-semibold text-foreground leading-relaxed pl-3 border-l-2 border-indigo-500">
                      &ldquo;{item.sentence}&rdquo;
                    </div>

                    {/* Vietnamese Meaning */}
                    <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl">
                      <span className="font-semibold text-indigo-500 mr-1.5">Nghĩa tiếng Việt:</span>
                      {item.viMeaning}
                    </div>

                    {/* Pro Tip */}
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40 flex items-start gap-2">
                      <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong className="font-semibold">Mẹo thực chiến: </strong>
                        {item.proTip}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => playPhraseAudio(item.sentence, item.id)}
                      className={cn(
                        "text-xs font-semibold rounded-lg gap-1.5 h-8",
                        isPlaying && "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 border-indigo-400"
                      )}
                    >
                      <Volume2 className={cn("w-3.5 h-3.5", isPlaying && "animate-pulse text-indigo-500")} />
                      {isPlaying ? "Đang phát mẫu..." : "Nghe phát âm chuẩn"}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(item.sentence, item.id)}
                      className="text-xs text-muted-foreground hover:text-foreground h-8 gap-1"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* =========================================================================
          TAB 4: 12-WEEK STRATEGIC ROADMAP
      ========================================================================= */}
      {activeTab === "weeks" && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-foreground flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-500" />
                Lộ trình 12 tuần làm chủ tiếng Anh cho Tech Lead
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Được chia thành 3 giai đoạn chiến lược, kết nối trực tiếp với các bài Shadowing và kịch bản mô phỏng AI Call.
              </p>
            </div>
            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800">
              Hoàn thành {completedWeeks.length} / 12 tuần ({weeksPercent}%)
            </div>
          </div>

          {/* Phases Iteration */}
          {[1, 2, 3].map((phaseNum) => {
            const phaseWeeks = WEEKS_DATA.filter((w) => w.phase === phaseNum);
            const phaseInfo = phaseWeeks[0];

            return (
              <div
                key={phaseNum}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-5"
              >
                {/* Phase Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800 gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {phaseInfo.phaseTitle}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-foreground mt-0.5">
                      {phaseInfo.phaseBadge}
                    </h3>
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    {phaseNum === 1 ? "Tuần 1 - 4" : phaseNum === 2 ? "Tuần 5 - 8" : "Tuần 9 - 12"}
                  </div>
                </div>

                {/* Weeks Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {phaseWeeks.map((weekItem) => {
                    const isDone = completedWeeks.includes(weekItem.week);

                    return (
                      <div
                        key={weekItem.week}
                        className={cn(
                          "rounded-2xl border p-4 sm:p-5 transition-all flex flex-col justify-between space-y-4",
                          isDone
                            ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80"
                            : "bg-slate-50/50 dark:bg-slate-850/50 border-slate-200/70 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                        )}
                      >
                        <div className="space-y-3">
                          {/* Header & Checkbox */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-md bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                                {weekItem.week}
                              </span>
                              <span className="text-xs font-bold text-foreground">Tuần {weekItem.week}</span>
                            </div>

                            <button
                              onClick={() => toggleWeek(weekItem.week)}
                              className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md transition-colors"
                            >
                              {isDone ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                  <span className="text-emerald-600 dark:text-emerald-400">Đã xong</span>
                                </>
                              ) : (
                                <>
                                  <Circle className="w-4 h-4 text-slate-400 hover:text-indigo-500" />
                                  <span className="text-slate-500 hover:text-foreground">Đánh dấu xong</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Title */}
                          <h4 className="text-sm font-bold text-foreground">{weekItem.title}</h4>

                          {/* Focus Vietnamese */}
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {weekItem.focusVi}
                          </p>

                          {/* Key Skills Pills */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {weekItem.keySkills.map((skill, sIdx) => (
                              <span
                                key={sIdx}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Launch Practice Button */}
                        <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-[11px] text-muted-foreground font-medium">Bài tập thực hành:</span>
                          <Link href={weekItem.practiceLink.href}>
                            <Button
                              size="sm"
                              className="text-xs font-bold rounded-xl h-8 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                              {weekItem.practiceLink.type === "shadowing" ? (
                                <Repeat className="w-3.5 h-3.5" />
                              ) : (
                                <MessageSquare className="w-3.5 h-3.5" />
                              )}
                              {weekItem.practiceLink.label}
                              <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
