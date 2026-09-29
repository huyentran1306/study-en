"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  // Phase 1: Weeks 1 - 4
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
    title: "Thuyết trình High-Level Architecture Walkthrough",
    focusVi: "Cách dẫn dắt khách hàng đi qua sơ đồ hệ thống (API Gateway, Event Bus, Microservices) mạch lạc theo cấu trúc Top-Down.",
    keySkills: ["Top-down technical storytelling", "Connecting architecture to business KPIs", "Transition words during screen share"],
    deliverable: "Thực chiến Roleplay với AI CTO Alexander Vance.",
    practiceLink: {
      label: "Roleplay: Solution Architecture Defense",
      href: "/roleplay?scenario=builtin-solution-architecture",
      type: "roleplay",
    },
  },

  // Phase 2: Weeks 5 - 8
  {
    week: 5,
    phase: 2,
    phaseTitle: "Tháng 2: Architecture Defense & Diplomatic Pushback",
    phaseBadge: "Nghệ thuật bảo vệ giải pháp & Đàm phán ngoại giao",
    title: "Phân tích Đánh đổi Kỹ thuật (Technical Trade-Offs)",
    focusVi: "Sử dụng ma trận Trade-off để giải thích tại sao chọn REST vs gRPC, SQL vs NoSQL, hoặc Serverless vs Kubernetes EKS.",
    keySkills: ["CAP theorem trade-offs in plain English", "Explaining latency vs operational overhead", "Justifying tech stack choices"],
    deliverable: "Luyện bài hội thoại Shadowing chuyên sâu: gRPC vs REST vs GraphQL.",
    practiceLink: {
      label: "Luyện Shadowing: gRPC vs REST vs GraphQL",
      href: "/shadowing?tab=dialogues&dialogue=grpc-vs-rest-api",
      type: "shadowing",
    },
  },
  {
    week: 6,
    phase: 2,
    phaseTitle: "Tháng 2: Architecture Defense & Diplomatic Pushback",
    phaseBadge: "Nghệ thuật bảo vệ giải pháp & Đàm phán ngoại giao",
    title: "Ngoại giao từ chối Scope Creep & Bảo vệ Deadline",
    focusVi: "Kỹ năng 'Nói Không' khéo léo nhưng vững vàng khi khách hàng đòi nhét thêm tính năng vào deadline cố định mà không tăng ngân sách.",
    keySkills: ["The 'Yes, and...' diplomatic formula", "De-scoping lower priority backlog items", "Protecting team capacity and SLA"],
    deliverable: "Roleplay trực tiếp xử lý tình huống đòi thêm tính năng gấp với Rachel Adams (VP of Product).",
    practiceLink: {
      label: "Roleplay: Scope Creep & Deadline Defense",
      href: "/roleplay?scenario=builtin-tradeoff-pushback",
      type: "roleplay",
    },
  },
  {
    week: 7,
    phase: 2,
    phaseTitle: "Tháng 2: Architecture Defense & Diplomatic Pushback",
    phaseBadge: "Nghệ thuật bảo vệ giải pháp & Đàm phán ngoại giao",
    title: "Tối ưu hóa Chi phí Cloud (FinOps) & Cân đối Hiệu năng",
    focusVi: "Cách trình bày bài toán chi phí hạ tầng AWS/GCP trước C-Level: giải thích giải pháp tiết kiệm (Spot, Autoscaling, Redis Caching) vẫn giữ vững SLA P99.",
    keySkills: ["FinOps vocabulary & metrics", "Explaining P99 latency impact", "Balancing cost vs reliability"],
    deliverable: "Roleplay với David Sterling (Head of Infrastructure) về bài toán cắt giảm chi phí Cloud.",
    practiceLink: {
      label: "Roleplay: Cloud Infrastructure & FinOps",
      href: "/roleplay?scenario=builtin-cloud-cost-finops",
      type: "roleplay",
    },
  },
  {
    week: 8,
    phase: 2,
    phaseTitle: "Tháng 2: Architecture Defense & Diplomatic Pushback",
    phaseBadge: "Nghệ thuật bảo vệ giải pháp & Đàm phán ngoại giao",
    title: "Chiến lược Di chuyển Đám mây (Strangler-Fig Migration)",
    focusVi: "Cách bảo vệ lộ trình bóc tách hệ thống cũ (Monolith) sang Microservices theo từng giai đoạn an toàn, không gián đoạn dịch vụ và có kế hoạch rollback.",
    keySkills: ["Strangler-fig pattern walkthrough", "Zero-downtime database cutover", "Compensating transactions & Saga pattern"],
    deliverable: "Luyện bài Shadowing hội thoại: Cloud Migration & Strangler-fig Pattern.",
    practiceLink: {
      label: "Luyện Shadowing: Cloud Migration & Strangler",
      href: "/shadowing?tab=dialogues&dialogue=cloud-migration-strangler",
      type: "shadowing",
    },
  },

  // Phase 3: Weeks 9 - 12
  {
    week: 9,
    phase: 3,
    phaseTitle: "Tháng 3: Crisis Management & Executive Pitching",
    phaseBadge: "Quản lý khủng hoảng & Đàm phán cấp cao",
    title: "Ứng phó Sự cố Khẩn cấp (High-Severity Incident Triage)",
    focusVi: "Giữ bình tĩnh, điều phối cuộc gọi khẩn cấp khi hệ thống production bị gián đoạn, trấn an khách hàng quốc tế và cập nhật tiến độ cách 20 phút.",
    keySkills: ["Emergency bridge call etiquette", "Isolating failure domains", "Clear and calm executive updates"],
    deliverable: "Luyện bài Shadowing hội thoại: High-Severity Outage & Incident RCA Call.",
    practiceLink: {
      label: "Luyện Shadowing: Outage & Incident Triage",
      href: "/shadowing?tab=dialogues&dialogue=incident-outage-rca",
      type: "shadowing",
    },
  },
  {
    week: 10,
    phase: 3,
    phaseTitle: "Tháng 3: Crisis Management & Executive Pitching",
    phaseBadge: "Quản lý khủng hoảng & Đàm phán cấp cao",
    title: "Trình bày Báo cáo Nguyên nhân Gốc rễ (Blameless RCA)",
    focusVi: "Thuyết trình báo cáo Post-Mortem chuyên nghiệp: nguyên nhân kỹ thuật, tại sao hệ thống giám sát không cảnh báo sớm, và các biện pháp phòng ngừa triệt để.",
    keySkills: ["Blameless culture communication", "5-Whys methodology presentation", "Actionable remediation milestones"],
    deliverable: "Roleplay thuyết trình RCA với Marcus Vance (VP of Engineering).",
    practiceLink: {
      label: "Roleplay: Incident Post-Mortem & RCA",
      href: "/roleplay?scenario=builtin-incident-triage",
      type: "roleplay",
    },
  },
  {
    week: 11,
    phase: 3,
    phaseTitle: "Tháng 3: Crisis Management & Executive Pitching",
    phaseBadge: "Quản lý khủng hoảng & Đàm phán cấp cao",
    title: "Bảo mật Doanh nghiệp, Dữ liệu PII & Chuẩn SOC2",
    focusVi: "Cách thảo luận và cam kết với CISO/An ninh mạng về bảo mật dữ liệu, mã hóa tại chỗ (at rest) và khi truyền tải (in transit), tuân thủ GDPR và SOC2 Type II.",
    keySkills: ["Enterprise compliance vocabulary", "Data residency & pseudonymization", "Answering audit checklists fluently"],
    deliverable: "Luyện bài Shadowing hội thoại: Enterprise Security & SOC2 Compliance.",
    practiceLink: {
      label: "Luyện Shadowing: Security & SOC2",
      href: "/shadowing?tab=dialogues&dialogue=security-soc2-compliance",
      type: "shadowing",
    },
  },
  {
    week: 12,
    phase: 3,
    phaseTitle: "Tháng 3: Crisis Management & Executive Pitching",
    phaseBadge: "Quản lý khủng hoảng & Đàm phán cấp cao",
    title: "Executive Pitching & Chốt Thỏa thuận Cấp cao",
    focusVi: "Hoàn thiện phong thái tự tin của một Tech Lead đẳng cấp quốc tế: chốt SLA, thống nhất roadmap dài hạn và xây dựng lòng tin tuyệt đối với khách hàng.",
    keySkills: ["Executive presence & body language on camera", "Handling tough counter-arguments", "Securing final stakeholder buy-in"],
    deliverable: "Thực hiện cuộc gọi mô phỏng tổng kết 90 ngày với AI Mentor.",
    practiceLink: {
      label: "Mở Voice Studio 1-on-1",
      href: "/voice",
      type: "roleplay",
    },
  },
];

// --- TECH LEAD GOLDEN FORMULAS ---
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
    categoryLabel: "Mua 5s suy nghĩ (Không ngập ngừng)",
    title: "Khi bị hỏi câu hóc búa, cần thời gian tư duy",
    sentence: "That is a very insightful point. Let me walk you through how our architecture handles that edge case.",
    highlightWords: ["insightful point", "walk you through", "edge case"],
    viMeaning: "Đó là một điểm rất sắc bén. Hãy để tôi giải thích cách kiến trúc của chúng tôi xử lý trường hợp đặc biệt đó.",
    proTip: "Dùng câu này giúp bạn có ngay 4-5 giây để sắp xếp ý trong đầu mà người nghe vẫn cảm thấy bạn cực kỳ tự tin và tôn trọng câu hỏi của họ.",
  },
  {
    id: "f2",
    category: "thinking-time",
    categoryLabel: "Mua 5s suy nghĩ (Không ngập ngừng)",
    title: "Khi cần tra cứu số liệu hoặc kiểm tra lại sơ đồ",
    sentence: "Before I dive into the implementation specifics, may I clarify the exact throughput requirement on your end?",
    highlightWords: ["implementation specifics", "may I clarify", "throughput requirement"],
    viMeaning: "Trước khi đi sâu vào chi tiết triển khai kỹ thuật, tôi có thể làm rõ yêu cầu băng thông cụ thể phía bạn được không?",
    proTip: "Chuyển thế chủ động bằng cách hỏi ngược lại về chỉ số, giúp bạn có thời gian định hình phương án.",
  },
  {
    id: "f3",
    category: "pushback",
    categoryLabel: "Từ chối khéo léo (Diplomatic Pushback)",
    title: "Từ chối thêm tính năng sát ngày release (Scope Creep)",
    sentence: "I completely understand the strategic value of this feature. However, our current sprint velocity is fully committed to core stability. If we introduce this now, we risk compromising our 99.9% uptime SLA.",
    highlightWords: ["strategic value", "sprint velocity", "fully committed", "compromising", "uptime SLA"],
    viMeaning: "Tôi hoàn toàn hiểu giá trị chiến lược của tính năng này. Tuy nhiên, năng suất sprint hiện tại đã dồn hết cho sự ổn định cốt lõi. Nếu đưa thêm tính năng này vào lúc này, chúng ta sẽ mạo hiểm cam kết SLA 99.9%.",
    proTip: "Công thức: Khen ngợi ý tưởng -> Nêu giới hạn khách quan (Sprint Velocity/SLA) -> Đưa ra giải pháp thay thế (Phase 2). Khách hàng sẽ không thể bắt bẻ.",
  },
  {
    id: "f4",
    category: "pushback",
    categoryLabel: "Từ chối khéo léo (Diplomatic Pushback)",
    title: "Đề xuất phương án tối ưu thay vì làm theo yêu cầu rủi ro",
    sentence: "Technically that is achievable; however, from a Total Cost of Ownership perspective, the maintenance overhead might outweigh the benefits. Here is an alternative we strongly recommend...",
    highlightWords: ["achievable", "Total Cost of Ownership", "maintenance overhead", "outweigh the benefits", "alternative"],
    viMeaning: "Về mặt kỹ thuật điều này làm được; tuy nhiên, xét từ góc độ Tổng chi phí sở hữu (TCO), công sức bảo trì có thể lớn hơn lợi ích mang lại. Đây là phương án thay thế chúng tôi đặc biệt khuyến nghị...",
    proTip: "Thay vì nói 'No, it's bad', hãy dùng 'From a TCO perspective' để nâng tầm cuộc thảo luận từ code lên mức chiến lược đầu tư.",
  },
  {
    id: "f5",
    category: "incident",
    categoryLabel: "Xử lý khủng hoảng & Sự cố (Incident)",
    title: "Trấn an khách hàng khi xảy ra Outage khẩn cấp",
    sentence: "We have isolated the failure domain to the payment webhook service. Our engineering team rolled back the latest release, and telemetry indicates traffic is stabilizing. I will provide another sync in twenty minutes.",
    highlightWords: ["isolated the failure domain", "rolled back", "telemetry indicates", "stabilizing", "sync in twenty minutes"],
    viMeaning: "Chúng tôi đã cô lập được phạm vi lỗi nằm ở dịch vụ webhook thanh toán. Đội ngũ kỹ thuật đã rollback bản phát hành mới nhất, và dữ liệu giám sát cho thấy lưu lượng đang ổn định trở lại. Tôi sẽ cập nhật tiếp sau 20 phút.",
    proTip: "3 nguyên tắc vàng khi họp sự cố: 1. Nêu rõ đã cô lập lỗi ở đâu; 2. Đã làm gì để khắc phục ngay; 3. Cam kết thời gian cập nhật tiếp theo cụ thể.",
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

export default function TechLeadPage() {
  const [completedWeeks, setCompletedWeeks] = useState<number[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load completed weeks from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tran_tech_lead_completed_weeks");
      if (saved) {
        setCompletedWeeks(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

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

  const playFormulaAudio = (formula: Formula) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setPlayingId(formula.id);

    const utterance = new SpeechSynthesisUtterance(formula.sentence);
    utterance.lang = "en-US";
    utterance.rate = 0.95;

    // Pick natural voice if available
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

  const filteredFormulas =
    activeCategory === "all"
      ? GOLDEN_FORMULAS
      : GOLDEN_FORMULAS.filter((f) => f.category === activeCategory);

  const completionPercent = Math.round((completedWeeks.length / 12) * 100);

  return (
    <div className="mx-auto max-w-6xl px-3.5 py-6 sm:px-6 sm:py-8 space-y-8 sm:space-y-12">
      {/* HERO COMMAND HEADER */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 p-6 sm:p-10 shadow-2xl text-white"
      >
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-semibold text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Chương trình chuyên biệt cho Trân · Developer Leader & Solution Architect</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Tech Lead 90-Day{" "}
              <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent">
                Solution Call Mastery
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Xóa bỏ rào cản 3 giây dịch nhẩm tiếng Việt trong đầu. Rèn luyện phản xạ dẫn dắt giải pháp kỹ thuật, đàm phán ngoại giao và bảo vệ kiến trúc tự tin trước khách hàng quốc tế trong 12 tuần tới.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/shadowing?tab=dialogues">
                <Button className="bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/25 text-xs sm:text-sm gap-2">
                  <Play className="w-4 h-4" />
                  Luyện Shadowing Solution Call
                </Button>
              </Link>
              <Link href="/roleplay">
                <Button
                  variant="outline"
                  className="rounded-xl border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2.5 text-xs sm:text-sm"
                >
                  <MessageSquare className="w-4 h-4 mr-2 text-sky-400" />
                  Mô phỏng Call với AI CTO
                </Button>
              </Link>
            </div>
          </div>

          {/* Progress KPI Card */}
          <div className="w-full lg:w-80 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Tiến độ 12 tuần</span>
              <span className="text-xs font-bold text-sky-400">{completedWeeks.length} / 12 Tuần</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-white">Hoàn thành</span>
                <span className="text-sky-300 font-bold">{completionPercent}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden border border-slate-700/60">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercent}%` }}
                  transition={{ duration: 0.6 }}
                  className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                <div className="text-lg font-extrabold text-white">{completedWeeks.length}</div>
                <div className="text-[11px] text-slate-400 font-medium">Tuần hoàn thành</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                <div className="text-lg font-extrabold text-amber-400">8</div>
                <div className="text-[11px] text-slate-400 font-medium">Mẫu câu phản xạ</div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* DAILY 15-MINUTE BLUEPRINT BANNER */}
      <section className="rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-600/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Công thức luyện tập 15 phút mỗi ngày cho Dev Lead
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold">
                  Thực dụng & Tối ưu thời gian
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                Không cần học ngữ pháp rườm rà. Tập trung tối đa vào 3 hoạt động phản xạ cao:
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4">
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
              1
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">5 phút: Luyện Shadowing</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Nhại theo 1 lượt đối thoại Call Solution để cơ miệng quen nhịp nối âm & ngữ điệu tự nhiên.
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
              2
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">5 phút: Đọc to 2 Mẫu câu phản xạ</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Đọc to thành tiếng mẫu câu Diplomatic Pushback hoặc Buying Thinking Time bên dưới.
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
              3
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">5 phút: Roleplay 1 lượt với AI CTO</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Gõ hoặc nói phản hồi bảo vệ kiến trúc, nghe AI phản biện để thử thách sự bình tĩnh.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TECH LEAD GOLDEN FORMULAS SECTION */}
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
                    onClick={() => playFormulaAudio(item)}
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

      {/* 12-WEEK ROADMAP CURRICULUM */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-foreground flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-500" />
            Lộ trình 12 tuần làm chủ tiếng Anh cho Tech Lead
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Được chia thành 3 giai đoạn rõ rệt, kết nối trực tiếp với các bài Shadowing và kịch bản mô phỏng AI Call.
          </p>
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
    </div>
  );
}
