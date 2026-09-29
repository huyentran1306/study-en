"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame, useTranslation } from "@/contexts/game-context";
import {
  ArrowLeft,
  Send,
  Loader2,
  BookOpen,
  Briefcase,
  Layers,
  Sparkles,
  User,
  Bot,
  Compass,
  ArrowRight,
  Mic,
  Volume2,
  Square,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSTTRecorder } from "@/hooks/use-stt-recorder";
import { cn } from "@/lib/utils";

const WORKER_BASE = process.env.NEXT_PUBLIC_WORKER_URL || "https://d1-template.trann46698.workers.dev";

interface RolePlayScenario {
  id: string;
  language: string;
  title: string;
  title_vi: string;
  emoji: string;
  gradient: string;
  setting: string;
  setting_vi: string;
  npc_name: string;
  npc_emoji: string;
  npc_role: string;
  player_role: string;
  opening_line: string;
  opening_line_vi: string;
  suggested_responses: string; // JSON
  vocabulary: string; // JSON
}

const BUILTIN_EN_SCENARIOS: RolePlayScenario[] = [
  {
    id: "builtin-solution-architecture",
    language: "en",
    title: "Client Solution Architecture Defense",
    title_vi: "Bảo vệ giải pháp kiến trúc với CTO đối tác",
    emoji: "🖥️",
    gradient: "from-cyan-600 to-indigo-600",
    setting: "High-stakes technical alignment call defending a microservices & event-driven architecture against latency and consistency skepticism",
    setting_vi: "Cuộc họp kỹ thuật cấp cao bảo vệ kiến trúc Microservices và Event-driven trước CTO và hội đồng thẩm định đối tác",
    npc_name: "Alexander Vance",
    npc_emoji: "👨‍💼",
    npc_role: "Client CTO",
    player_role: "Lead Solution Architect (Trân)",
    opening_line: "Good morning Trân. We reviewed your initial architecture proposal. While we appreciate the scalability of Kafka and microservices, our board is deeply concerned about distributed transaction complexity and data consistency. How do you justify this approach over keeping our current monolith?",
    opening_line_vi: "Chào buổi sáng Trân. Chúng tôi đã xem qua đề xuất kiến trúc ban đầu. Mặc dù đánh giá cao tính mở rộng của Kafka và microservices, ban điều hành rất lo ngại về độ phức tạp của giao dịch phân tán và tính nhất quán dữ liệu. Bạn giải trình thế nào về phương án này so với việc giữ nguyên monolith?",
    suggested_responses: JSON.stringify([
      "Good morning Alex. Continuing to scale the monolith creates a single point of failure under peak load.",
      "Rather than complex two-phase commits, we advocate the Saga pattern coordinated via domain events.",
      "We will adopt a phased Strangler-fig approach, ensuring zero downtime and continuous rollback capability.",
      "From a five-year TCO perspective, decoupled services reduce maintenance costs and operational bottlenecks.",
    ]),
    vocabulary: JSON.stringify([
      { word: "single point of failure", meaning: "điểm lỗi đơn có thể làm sập toàn bộ hệ thống" },
      { word: "Saga pattern", meaning: "mô hình điều phối giao dịch phân tán qua domain events" },
      { word: "Strangler-fig pattern", meaning: "bóc tách dần monolith thành microservices không gây downtime" },
      { word: "compensating transaction", meaning: "giao dịch bù trừ tự động khi có bước thất bại" },
    ]),
  },
  {
    id: "builtin-incident-triage",
    language: "en",
    title: "Production Outage & Incident RCA Call",
    title_vi: "Xử lý khủng hoảng sự cố & Báo cáo RCA khẩn cấp",
    emoji: "🚨",
    gradient: "from-rose-600 to-amber-600",
    setting: "Emergency triage bridge call explaining root cause analysis and immediate rollback safeguards after a payment service disruption",
    setting_vi: "Cuộc họp khẩn cấp giải trình nguyên nhân gốc rễ RCA và quy trình khắc phục sau khi cổng thanh toán bị gián đoạn",
    npc_name: "Marcus Vance",
    npc_emoji: "👨‍💻",
    npc_role: "VP of Engineering",
    player_role: "Tech Lead & SRE (Trân)",
    opening_line: "Trân, our payment gateway error rate surged past 30% during the flash sale, and we lost significant checkout volume. The executive team is demanding an immediate post-mortem. What happened, and how do we ensure it never happens again?",
    opening_line_vi: "Trân, tỷ lệ lỗi cổng thanh toán tăng vọt hơn 30% trong đợt flash sale vừa qua khiến chúng ta mất lượng lớn đơn hàng. Ban lãnh đạo đang yêu cầu báo cáo hậu sự cố ngay lập tức. Chuyện gì đã xảy ra và làm thế nào để đảm bảo không bao giờ tái diễn?",
    suggested_responses: JSON.stringify([
      "We completed the root cause analysis. An unindexed promotional query triggered database connection pool exhaustion.",
      "Our SRE squad executed an automated rollback within four minutes to restore service availability.",
      "We have isolated promotional read queries onto an independent Redis distributed caching layer.",
      "We will publish the formal post-mortem with CloudWatch telemetry and remediation milestones by 2 PM.",
    ]),
    vocabulary: JSON.stringify([
      { word: "root cause analysis (RCA)", meaning: "phân tích nguyên nhân gốc rễ của sự cố kỹ thuật" },
      { word: "connection pool exhaustion", meaning: "cạn kiệt cổng kết nối cơ sở dữ liệu làm treo hệ thống" },
      { word: "circuit breaker", meaning: "cơ chế tự động ngắt kết nối lỗi để bảo vệ hệ thống cốt lõi" },
      { word: "post-mortem report", meaning: "báo cáo tổng kết và phân tích bài học sau sự cố" },
    ]),
  },
  {
    id: "builtin-tradeoff-pushback",
    language: "en",
    title: "Diplomatic Pushback: Scope Creep & Deadline Defense",
    title_vi: "Đàm phán từ chối Scope Creep & Bảo vệ Deadline",
    emoji: "🛡️",
    gradient: "from-amber-600 to-indigo-600",
    setting: "High-stakes stakeholder meeting diplomatically pushing back against aggressive scope creep while defending team velocity and delivery deadlines",
    setting_vi: "Họp đàm phán với Giám đốc sản phẩm đối tác, khéo léo từ chối phát sinh tính năng (Scope Creep) để bảo vệ chất lượng và deadline của team",
    npc_name: "Rachel Adams",
    npc_emoji: "👩‍💼",
    npc_role: "Global Product Director",
    player_role: "Dev Lead & Solution Architect (Trân)",
    opening_line: "Trân, our marketing VP just decided that we must include an AI recommendation engine and real-time streaming notifications in the upcoming release. Our launch date of October 15th cannot move. Can your team squeeze this in without pushing the deadline?",
    opening_line_vi: "Trân này, Phó Chủ tịch Marketing của chúng tôi vừa quyết định rằng chúng ta bắt buộc phải thêm công cụ gợi ý bằng AI và thông báo real-time vào bản phát hành sắp tới. Ngày ra mắt 15/10 không thể lùi. Team của bạn có thể cố gắng nhét thêm tính năng này mà không trễ hạn không?",
    suggested_responses: JSON.stringify([
      "I understand the strategic value of AI recommendations, Rachel. However, our sprint velocity is 100% committed to core checkout stability.",
      "If we introduce real-time streaming now without proper load testing, we risk compromising our 99.9% uptime SLA.",
      "I propose a phased rollout: we hit the October 15th milestone with core checkout, then ship AI recommendations in Sprint 14.",
      "Alternatively, we could swap out the secondary reporting dashboard to free up capacity for the recommendation engine.",
    ]),
    vocabulary: JSON.stringify([
      { word: "scope creep", meaning: "hiện tượng yêu cầu phát sinh không kiểm soát ngoài thỏa thuận ban đầu" },
      { word: "sprint velocity", meaning: "tốc độ hoàn thành công việc của đội ngũ trong một kỳ sprint" },
      { word: "phased rollout", meaning: "triển khai phân kỳ theo từng giai đoạn an toàn" },
      { word: "trade-off matrix", meaning: "ma trận phân tích được-mất khi ra quyết định kỹ thuật" },
    ]),
  },
  {
    id: "builtin-tough-client-deadline",
    language: "en",
    title: "Tough Client: Unreasonable 24h Deadline & Escalation",
    title_vi: "Xử lý Khách hàng gắt gao ép Deadline 24h & Dọa cắt hợp đồng",
    emoji: "🔥",
    gradient: "from-rose-600 via-orange-600 to-amber-700",
    setting: "Emergency late-afternoon escalation call where a demanding foreign client CEO insists on deploying untested features to production within 24 hours.",
    setting_vi: "Cuộc họp leo thang căng thẳng khi CEO đối tác ngoại quốc đòi phát hành gấp tính năng chưa qua kiểm thử trong 24 giờ và dọa phạt hợp đồng.",
    npc_name: "Jonathan Sterling",
    npc_emoji: "😡",
    npc_role: "Demanding Client CEO",
    player_role: "Lead Solution Architect (Trân)",
    opening_line: "Trân, our board just decided we cannot wait until next week. We promised our investors a demo by tomorrow morning at 9 AM EST. I don't care if QA hasn't finished testing; just deploy the code to production tonight or we will reconsider our vendor agreement.",
    opening_line_vi: "Trân này, hội đồng quản trị của chúng tôi vừa quyết định không thể chờ đến tuần sau. Chúng tôi đã hứa với các nhà đầu tư bản demo vào 9h sáng mai theo giờ EST. Tôi không quan tâm QA đã test xong hay chưa; cứ đẩy code lên production tối nay hoặc chúng tôi sẽ xem xét lại hợp đồng.",
    suggested_responses: JSON.stringify([
      "I hear your urgency regarding the investor demo, Jonathan. Deploying unverified code directly to production carries an immediate risk of system outage.",
      "To protect your live customers while satisfying the investors, we can deploy the build to an isolated Staging demo environment with synthetic data tonight.",
      "This guarantees a flawless demo for your investors at 9 AM without risking the payment and transaction integrity of active production users.",
      "If we must show live data, I can enable a feature flag restricted exclusively to investor accounts with zero exposure to the general public.",
    ]),
    vocabulary: JSON.stringify([
      { word: "synthetic data", meaning: "dữ liệu giả lập an toàn để demo không ảnh hưởng dữ liệu thật" },
      { word: "feature flag / toggle", meaning: "công tắc bật/tắt tính năng chỉ định cho từng nhóm người dùng" },
      { word: "staging environment", meaning: "môi trường kiểm thử có cấu hình y hệt production" },
      { word: "vendor agreement", meaning: "hợp đồng dịch vụ nhà cung cấp kỹ thuật" },
    ]),
  },
  {
    id: "builtin-cloud-cost-finops",
    language: "en",
    title: "Cloud Infrastructure & FinOps Architecture Review",
    title_vi: "Tối ưu hóa chi phí Cloud (FinOps) & Cân đối hiệu năng",
    emoji: "⚡",
    gradient: "from-emerald-600 to-teal-700",
    setting: "Technical FinOps alignment call balancing high availability against infrastructure spend reduction demands from executive leadership",
    setting_vi: "Họp rà soát kiến trúc hạ tầng Cloud, tối ưu hóa chi phí vận hành (FinOps) nhưng vẫn đảm bảo cam kết SLA P99",
    npc_name: "David Sterling",
    npc_emoji: "👨‍💻",
    npc_role: "Head of Infrastructure",
    player_role: "Dev Lead & Architect (Trân)",
    opening_line: "Trân, our AWS cloud expenditure spiked by 40% after the last deployment. The CFO is mandating an immediate 25% cost reduction without degrading our 150-millisecond P99 latency SLA. What is your architectural plan to achieve this?",
    opening_line_vi: "Trân, hóa đơn AWS của chúng ta vừa tăng vọt 40% sau đợt triển khai vừa rồi. Giám đốc tài chính CFO yêu cầu cắt giảm ngay 25% chi phí nhưng không được làm giảm cam kết SLA P99 dưới 150ms. Phương án kiến trúc của bạn là gì?",
    suggested_responses: JSON.stringify([
      "We audited our telemetry: our Kubernetes node pools are over-provisioned during off-peak hours.",
      "We can transition asynchronous batch workers to EC2 Spot Instances with Karpenter autoscaling to save 30%.",
      "By placing Redis distributed caching in front of high-frequency read queries, we dramatically slash database IOPS costs.",
      "This proposal cuts approximately 28% of monthly infrastructure expenditure while keeping P99 latency well under 120ms.",
    ]),
    vocabulary: JSON.stringify([
      { word: "P99 latency", meaning: "thời gian phản hồi của 99% người dùng nhanh nhất (chỉ số vàng SLA)" },
      { word: "over-provisioned", meaning: "cấp phát dư thừa tài nguyên phần cứng gây lãng phí chi phí" },
      { word: "FinOps", meaning: "phương pháp quản lý tài chính và tối ưu chi phí hạ tầng Cloud" },
      { word: "spot instances", meaning: "máy chủ nhàn rỗi giá rẻ của cloud provider tiết kiệm tới 70-90%" },
    ]),
  },
  {
    id: "builtin-interview",
    language: "en",
    title: "Executive Job Interview",
    title_vi: "Phỏng vấn tuyển dụng vị trí cấp cao",
    emoji: "💼",
    gradient: "from-indigo-600 to-sky-600",
    setting: "In-depth behavioral interview at an international technology firm",
    setting_vi: "Phỏng vấn năng lực chuyên sâu tại tập đoàn công nghệ đa quốc gia",
    npc_name: "David Vance",
    npc_emoji: "👔",
    npc_role: "VP of Engineering",
    player_role: "Senior Candidate",
    opening_line: "Thank you for joining our interview today. To start off, could you walk me through a major engineering leadership challenge you overcame in your recent role?",
    opening_line_vi: "Cảm ơn bạn đã tham gia buổi phỏng vấn hôm nay. Trước hết, bạn có thể chia sẻ về một thách thức lãnh đạo kỹ thuật mà bạn đã giải quyết gần đây không?",
    suggested_responses: JSON.stringify([
      "Certainly. In my last project, we had to re-architect our data pipeline under tight deadlines.",
      "I led a cross-functional team of eight engineers through a complex cloud migration.",
      "Our main hurdle was resolving cross-team dependencies while maintaining 99.9% uptime.",
      "I focused heavily on aligning stakeholders and setting clear weekly milestones.",
    ]),
    vocabulary: JSON.stringify([
      { word: "cross-functional", meaning: "đa phòng ban / liên chức năng" },
      { word: "stakeholder alignment", meaning: "sự thống nhất từ các bên liên quan" },
      { word: "scalability", meaning: "khả năng mở rộng hệ thống" },
      { word: "trade-off", meaning: "sự đánh đổi kỹ thuật" },
    ]),
  },
  {
    id: "builtin-office",
    language: "en",
    title: "Sprint Alignment & Standup",
    title_vi: "Họp rà soát tiến độ dự án (Sprint Standup)",
    emoji: "📊",
    gradient: "from-slate-700 to-slate-900",
    setting: "Monday morning cross-team sync discussing deliverables and blockers",
    setting_vi: "Họp đầu tuần trao đổi về các đầu việc quan trọng và tháo gỡ điểm nghẽn",
    npc_name: "Sarah Jenkins",
    npc_emoji: "👩‍💼",
    npc_role: "Product Lead",
    player_role: "Project Contributor",
    opening_line: "Good morning team. Let's do a quick alignment. What are your key focus areas for this sprint and are there any blockers?",
    opening_line_vi: "Chào buổi sáng cả đội. Hãy điểm nhanh tiến độ nhé. Trọng tâm của bạn tuần này là gì và có điểm nghẽn nào không?",
    suggested_responses: JSON.stringify([
      "I'm finalizing the API specifications today and anticipate no major blockers.",
      "We're currently waiting on security sign-off before deploying to staging.",
      "My main priority is optimizing query latency for the reporting dashboard.",
      "Everything is on track to meet the Friday release milestone.",
    ]),
    vocabulary: JSON.stringify([
      { word: "blocker", meaning: "rào cản / điểm nghẽn tiến độ" },
      { word: "deliverable", meaning: "kết quả bàn giao dự án" },
      { word: "on track", meaning: "đúng tiến độ đề ra" },
      { word: "sign-off", meaning: "sự phê duyệt chính thức" },
    ]),
  },
  {
    id: "builtin-coffee",
    language: "en",
    title: "Coffee Sync & Networking",
    title_vi: "Gặp gỡ trao đổi thân mật tại quán cafe",
    emoji: "☕",
    gradient: "from-amber-600 to-orange-600",
    setting: "Informal chat with a colleague or industry peer over morning coffee",
    setting_vi: "Trò chuyện thân mật với đồng nghiệp hoặc đối tác trong giờ nghỉ",
    npc_name: "Marcus Cole",
    npc_emoji: "☕",
    npc_role: "Industry Peer",
    player_role: "Professional",
    opening_line: "Hey! Glad we could catch up before the morning meetings start. How have things been on your side this quarter?",
    opening_line_vi: "Chào bạn! Rất vui được gặp nhau trước giờ họp sáng. Tình hình bên bạn quý này thế nào rồi?",
    suggested_responses: JSON.stringify([
      "It has been a whirlwind, but we recently shipped our new product update.",
      "Pretty busy! We're expanding into new client accounts across Southeast Asia.",
      "Keeping up with the new tech stack has been both fun and demanding.",
      "Things are going well. How is your team handling the current roadmap?",
    ]),
    vocabulary: JSON.stringify([
      { word: "catch up", meaning: "gặp gỡ cập nhật tình hình" },
      { word: "whirlwind", meaning: "bận rộn dồn dập" },
      { word: "ship a feature", meaning: "phát hành tính năng mới" },
      { word: "roadmap", meaning: "lộ trình phát triển" },
    ]),
  },
  {
    id: "builtin-phone",
    language: "en",
    title: "Vendor Negotiation Call",
    title_vi: "Đàm phán hợp đồng nhà cung cấp",
    emoji: "📞",
    gradient: "from-emerald-600 to-teal-700",
    setting: "Negotiating service terms and annual licensing with an enterprise vendor",
    setting_vi: "Thương lượng điều khoản và chi phí dịch vụ với đối tác cung cấp phần mềm",
    npc_name: "Elena Rostova",
    npc_emoji: "📞",
    npc_role: "Enterprise Account Director",
    player_role: "Procurement Lead",
    opening_line: "Hello, this is Elena following up on our enterprise proposal. We'd love to review the contract terms and see where we can align.",
    opening_line_vi: "Xin chào, tôi là Elena liên hệ theo đề xuất doanh nghiệp. Chúng tôi muốn xem xét các điều khoản và tìm tiếng nói chung.",
    suggested_responses: JSON.stringify([
      "We've reviewed the proposal, but the licensing tiers are slightly above our budget.",
      "Can we explore a volume discount if we commit to a two-year agreement?",
      "We'd like to understand what dedicated support SLAs are included in tier 1.",
      "If we can align on net-60 payment terms, we are ready to move forward.",
    ]),
    vocabulary: JSON.stringify([
      { word: "volume discount", meaning: "chiết khấu số lượng lớn" },
      { word: "commitment", meaning: "cam kết thời hạn hợp đồng" },
      { word: "SLA", meaning: "cam kết chất lượng dịch vụ (Service Level Agreement)" },
      { word: "terms", meaning: "điều khoản thanh toán" },
    ]),
  },
];

interface ChatMessage { sender: "npc" | "player"; text: string; isLoading?: boolean; }

async function fetchNPCResponse(scenario: RolePlayScenario, history: ChatMessage[], userMessage: string, language: string): Promise<string> {
  try {
    const res = await fetch("/api/npc-response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario, history, userMessage, language }),
    });
    const data = await res.json() as { message: string };
    return data.message || "That's a very valid point. Let's explore that further.";
  } catch {
    return "Understood. How would you propose addressing the next steps?";
  }
}

async function playRoleplayTTS(text: string) {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang: "en" }),
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
      return;
    }
  } catch {
    /* fallback to speech synthesis */
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    window.speechSynthesis.speak(u);
  }
}

function RolePlayChat({ scenario, onBack }: { scenario: RolePlayScenario; onBack: () => void }) {
  const { addXP, addCoins, username, activeStudyLanguage } = useGame();
  const isZh = activeStudyLanguage === "zh";
  const suggestedResponses: string[] = JSON.parse(scenario.suggested_responses || "[]");
  const vocabList: { word: string; meaning: string }[] = JSON.parse(scenario.vocabulary || "[]");

  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: "npc", text: scenario.opening_line },
  ]);
  const [input, setInput] = useState("");
  const [showVocab, setShowVocab] = useState(false);
  const [isNPCLoading, setIsNPCLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const {
    isRecording,
    isTranscribing,
    transcript,
    startRecording,
    stopRecording,
    resetTranscript,
  } = useSTTRecorder();

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const handleVoiceToggle = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      resetTranscript();
      await startRecording();
    }
  };

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isNPCLoading) return;
    const userMsg: ChatMessage = { sender: "player", text: text.trim() };
    const currentHistory = [...messages, userMsg];
    setMessages(currentHistory);
    setInput("");
    addXP(5);
    addCoins(1);

    setIsNPCLoading(true);
    setMessages((prev) => [...prev, { sender: "npc", text: "", isLoading: true }]);

    const npcText = await fetchNPCResponse(scenario, currentHistory, text.trim(), activeStudyLanguage);

    setMessages((prev) => {
      const withoutLoading = prev.filter((m) => !m.isLoading);
      return [...withoutLoading, { sender: "npc", text: npcText }];
    });
    setIsNPCLoading(false);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Thoát kịch bản
        </button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowVocab(!showVocab)}
          className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold gap-1.5"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
          {showVocab ? "Ẩn thuật ngữ" : "Xem thuật ngữ hữu ích"}
        </Button>
      </div>

      {/* Scenario Header HUD */}
      <div className="pro-card p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/10 text-lg font-bold">
            {scenario.npc_name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">{scenario.npc_name}</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/20">
                {scenario.npc_role}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {scenario.title_vi || scenario.title} · Bạn đóng vai: <strong className="text-white">{scenario.player_role}</strong>
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 max-w-xs sm:text-right italic">
          &ldquo;{scenario.setting}&rdquo;
        </div>
      </div>

      {/* Vocabulary Drawer */}
      <AnimatePresence>
        {showVocab && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pro-card p-5 bg-slate-50 dark:bg-slate-850/70 border-indigo-500/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3">
                Thuật ngữ & Thành ngữ ngữ cảnh nên áp dụng:
              </h4>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {vocabList.map((v) => (
                  <div key={v.word} className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-xs">
                    <span className="font-bold text-foreground">{v.word}</span>
                    <span className="text-slate-400 mx-1.5">—</span>
                    <span className="text-muted-foreground">{v.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Thread Container */}
      <div
        ref={chatRef}
        className="h-[380px] overflow-y-auto space-y-4 p-5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-xs"
      >
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-2.5 ${msg.sender === "player" ? "justify-end" : "justify-start"}`}
          >
            {msg.sender === "npc" && (
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 text-xs font-bold flex-shrink-0 mt-1 border border-slate-200/80 dark:border-slate-700">
                <Bot className="w-3.5 h-3.5 text-indigo-500" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed space-y-1.5 ${
                msg.sender === "player"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-foreground border border-slate-200/60 dark:border-slate-700/60"
              }`}
            >
              {msg.isLoading ? (
                <div className="flex items-center gap-1.5 py-1">
                  <span className="text-xs text-muted-foreground">Đang phản hồi...</span>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                </div>
              ) : (
                <>
                  <div>{msg.text}</div>
                  {msg.sender === "npc" && (
                    <div className="pt-1 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => playRoleplayTTS(msg.text)}
                        className="text-[10px] text-muted-foreground hover:text-indigo-500 flex items-center gap-1 transition-colors"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Nghe giọng AI</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {msg.sender === "player" && (
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold flex-shrink-0 mt-1 border border-indigo-200/60 dark:border-indigo-800/60">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Suggested Quick Responses */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold text-muted-foreground block">Gợi ý phản hồi nhanh (Click để gửi):</span>
        <div className="flex flex-wrap gap-2">
          {suggestedResponses.map((resp, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(resp)}
              disabled={isNPCLoading}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 transition-colors disabled:opacity-50 text-left"
            >
              {resp}
            </button>
          ))}
        </div>
      </div>

      {/* Input Console with Voice Dictation */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={handleVoiceToggle}
          disabled={isNPCLoading}
          variant="outline"
          className={cn(
            "h-11 w-11 p-0 rounded-xl flex-shrink-0 transition-all",
            isRecording
              ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-600 animate-pulse"
              : isTranscribing
              ? "bg-amber-100 dark:bg-amber-950 text-amber-600 border-amber-300"
              : "border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
          title={isRecording ? "Dừng ghi âm" : "Nói bằng giọng nói"}
        >
          {isRecording ? (
            <Square className="w-4 h-4 fill-current" />
          ) : isTranscribing ? (
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          ) : (
            <Mic className="w-4 h-4 text-indigo-500" />
          )}
        </Button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          disabled={isNPCLoading || isRecording}
          placeholder={
            isRecording
              ? "Đang lắng nghe giọng Trân..."
              : isTranscribing
              ? "Đang chuyển giọng nói thành văn bản..."
              : isZh
              ? "输入你的回应..."
              : "Nhập hoặc chạm mic để nói..."
          }
          className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
        />

        <Button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isNPCLoading || isRecording}
          className="btn-pro h-11 px-4 sm:px-5 rounded-xl gap-2 flex-shrink-0"
        >
          {isNPCLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span className="hidden sm:inline">Gửi</span>
        </Button>
      </div>
    </div>
  );
}

export default function RolePlayPage() {
  const { language, activeStudyLanguage } = useGame();
  const t = useTranslation();
  const isZh = activeStudyLanguage === "zh";
  const [dbScenarios, setDbScenarios] = useState<RolePlayScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeScenario, setActiveScenario] = useState<RolePlayScenario | null>(null);

  const scenarios = isZh ? dbScenarios : [...BUILTIN_EN_SCENARIOS, ...dbScenarios];

  useEffect(() => {
    setLoading(true);
    setActiveScenario(null);
    fetch(`${WORKER_BASE}/api/roleplay?language=${activeStudyLanguage}&limit=20`)
      .then((r) => r.json())
      .then((res) => setDbScenarios(Array.isArray(res) ? res : (res.data || [])))
      .catch(() => setDbScenarios([]))
      .finally(() => setLoading(false));
  }, [activeStudyLanguage]);

  if (activeScenario) {
    return <RolePlayChat scenario={activeScenario} onBack={() => setActiveScenario(null)} />;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-foreground">
            Dashboard
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Situational Roleplay</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
          <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Situational Roleplay & Negotiation Lab
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Nhập vai hội thoại tình huống thực tế: phỏng vấn tuyển dụng, đàm phán hợp đồng, họp dự án cùng AI.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200/60 dark:border-slate-700" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {scenarios.map((scenario) => {
            const vocabList: { word: string; meaning: string }[] = JSON.parse(scenario.vocabulary || "[]");
            return (
              <motion.button
                key={scenario.id}
                onClick={() => setActiveScenario(scenario)}
                className="pro-card p-6 text-left hover:-translate-y-1 transition-all group flex flex-col justify-between"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm border border-indigo-200/60 dark:border-indigo-800/60">
                        {scenario.npc_name?.[0] || "A"}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">{scenario.npc_name}</div>
                        <div className="text-[10px] text-muted-foreground">{scenario.npc_role}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      Vai: {scenario.player_role}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-foreground mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {language === "vi" && scenario.title_vi ? scenario.title_vi : scenario.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {language === "vi" && scenario.setting_vi ? scenario.setting_vi : scenario.setting}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {vocabList.slice(0, 3).map((v) => (
                      <span key={v.word} className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
                        {v.word}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <span>Bắt đầu phiên nhập vai</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
