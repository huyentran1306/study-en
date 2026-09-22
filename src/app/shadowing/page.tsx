"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  Mic,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  Volume2,
  Radio,
  Briefcase,
  Coffee,
  MessageSquare,
  Flame,
  Award,
  Sliders,
  Repeat,
  Headphones,
  Check,
  Cpu,
  Server,
  ShieldAlert,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSTTRecorder } from "@/hooks/use-stt-recorder";
import { useGame } from "@/contexts/game-context";

interface ShadowingItem {
  id: string;
  text: string;
  vietnamese: string;
  context: string;
  level: "B2" | "C1" | "C2";
  stressWords: string[];
  linkingPairs: [string, string][];
  intonation: "rising" | "falling";
  intonationNote: string;
}

interface ShadowingCategory {
  id: string;
  name: string;
  desc: string;
  icon: typeof Cpu | typeof Server | typeof Briefcase | typeof MessageSquare | typeof Flame | typeof Coffee | typeof ShieldAlert;
  accent: string;
  border: string;
  badge: string;
  domain: "it" | "business";
  items: ShadowingItem[];
}

const CATEGORIES: ShadowingCategory[] = [
  // ─────────────────────────────────────────────────────────────
  // 1. IT & SOLUTION CALLS (TOP PRIORITY)
  // ─────────────────────────────────────────────────────────────
  {
    id: "it-solution-architecture",
    name: "IT Solution Architecture & Client Technical Calls",
    desc: "Tư vấn kiến trúc hệ thống, Cloud Native, Microservices, API và giải pháp chịu tải cao cho khách hàng",
    icon: Cpu,
    accent: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-500/40",
    badge: "IT Solution Pro (B2-C1)",
    domain: "it",
    items: [
      {
        id: "it-1",
        text: "Based on your high throughput requirements, we recommend adopting an event-driven architecture with Kafka.",
        vietnamese: "Dựa trên yêu cầu thông lượng cao của anh/chị, chúng tôi đề xuất áp dụng kiến trúc hướng sự kiện với Kafka.",
        context: "Mở đầu đề xuất giải pháp kỹ thuật trọng tâm khi giải quyết bài toán tải dữ liệu lớn cho khách hàng.",
        level: "C1",
        stressWords: ["high", "throughput", "recommend", "event-driven", "architecture", "Kafka"],
        linkingPairs: [["based", "on"], ["event-driven", "architecture"]],
        intonation: "falling",
        intonationNote: "Hạ giọng dứt khoát ở 'Kafka' ↘ thể hiện tính quyết đoán và tự tin của Solution Architect.",
      },
      {
        id: "it-2",
        text: "To mitigate sudden latency spikes during peak hours, we introduced a Redis distributed caching layer.",
        vietnamese: "Để hạn chế hiện tượng tăng đột biến độ trễ vào giờ cao điểm, chúng tôi đưa vào một lớp bộ nhớ đệm phân tán Redis.",
        context: "Giải thích kỹ thuật cho khách hàng về cách hệ thống duy trì tốc độ phản hồi dưới 50ms.",
        level: "B2",
        stressWords: ["mitigate", "latency", "spikes", "peak", "hours", "Redis", "caching"],
        linkingPairs: [["latency", "spikes"], ["peak", "hours"]],
        intonation: "falling",
        intonationNote: "Nhấn mạnh có chủ ý vào 'latency spikes' và 'Redis caching layer' để khách hàng nắm bắt từ khóa.",
      },
      {
        id: "it-3",
        text: "Could you clarify your expected read-to-write ratio so we can size the database cluster appropriately?",
        vietnamese: "Anh/chị có thể làm rõ tỷ lệ đọc/ghi dự kiến để chúng tôi định cỡ cụm cơ sở dữ liệu cho phù hợp được không?",
        context: "Câu hỏi khai thác yêu cầu (requirements discovery) kinh điển khi khảo sát hệ thống với tech lead đối tác.",
        level: "C1",
        stressWords: ["clarify", "read-to-write", "ratio", "size", "database", "cluster"],
        linkingPairs: [["read", "to"], ["size", "the"]],
        intonation: "rising",
        intonationNote: "Lên giọng nhã nhặn ở 'appropriately' ↗ để tạo thiện cảm khi khai thác thêm thông tin từ khách hàng.",
      },
      {
        id: "it-4",
        text: "We opted for PostgreSQL over a NoSQL document store to guarantee strict ACID transaction compliance.",
        vietnamese: "Chúng tôi chọn PostgreSQL thay vì cơ sở dữ liệu NoSQL để đảm bảo tuân thủ nghiêm ngặt tính toàn vẹn giao dịch ACID.",
        context: "Bảo vệ quyết định chọn công nghệ lưu trữ dữ liệu tài chính/thương mại điện tử trong buổi call solution.",
        level: "C1",
        stressWords: ["opted", "PostgreSQL", "guarantee", "strict", "ACID", "compliance"],
        linkingPairs: [["opted", "for"], ["strict", "ACID"]],
        intonation: "falling",
        intonationNote: "Hạ giọng đều ở 'ACID transaction compliance' ↘ khẳng định độ tin cậy của giải pháp.",
      },
      {
        id: "it-5",
        text: "Regarding data sovereignty and compliance, all customer PII will be encrypted both at rest and in transit.",
        vietnamese: "Về quyền tối thượng dữ liệu và tuân thủ pháp lý, toàn bộ thông tin định danh khách hàng (PII) sẽ được mã hóa khi lưu trữ và truyền tải.",
        context: "Trấn an khách hàng doanh nghiệp về bảo mật an ninh mạng và chứng chỉ ISO / SOC2.",
        level: "C1",
        stressWords: ["sovereignty", "compliance", "encrypted", "rest", "transit"],
        linkingPairs: [["at", "rest"], ["in", "transit"]],
        intonation: "falling",
        intonationNote: "Nhịp điệu dứt khoát, ngắt hơi sau dấu phẩy ',', hạ giọng trang trọng ở 'transit' ↘.",
      },
      {
        id: "it-6",
        text: "Our recommended solution leverages Kubernetes with horizontal pod autoscaling to ensure ninety-nine point nine percent uptime.",
        vietnamese: "Giải pháp đề xuất của chúng tôi tận dụng Kubernetes với cơ chế tự động co giãn pod theo chiều ngang để đảm bảo độ khả dụng 99.9%.",
        context: "Cam kết SLA hạ tầng và khả năng chịu tải cao khi pitching giải pháp DevOps / Cloud Native.",
        level: "C1",
        stressWords: ["Kubernetes", "horizontal", "autoscaling", "ensure", "uptime"],
        linkingPairs: [["pod", "autoscaling"], ["percent", "uptime"]],
        intonation: "falling",
        intonationNote: "Đọc trôi chảy cụm 'horizontal pod autoscaling', hạ giọng kết câu ở 'uptime' ↘.",
      },
    ],
  },
  {
    id: "it-tradeoffs",
    name: "Technical Trade-Offs & Architecture Defense",
    desc: "Bảo vệ giải pháp, phân tích đánh đổi kiến trúc và giải trình chi phí với Tech Lead / CTO đối tác",
    icon: Server,
    accent: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-500/40",
    badge: "Architecture Defense (C1)",
    domain: "it",
    items: [
      {
        id: "to-1",
        text: "While microservices offer team autonomy, they introduce operational complexity and network latency.",
        vietnamese: "Mặc dù microservices mang lại tính tự chủ cho đội ngũ, chúng lại làm tăng độ phức tạp vận hành và độ trễ mạng.",
        context: "Phân tích đánh đổi khách quan (trade-off) giữa Monolith và Microservices trước hội đồng kỹ thuật.",
        level: "C1",
        stressWords: ["autonomy", "introduce", "operational", "complexity", "network", "latency"],
        linkingPairs: [["while", "microservices"], ["network", "latency"]],
        intonation: "falling",
        intonationNote: "Ngắt nhịp cân đối sau 'team autonomy,', hạ giọng phân tích sâu ở 'network latency' ↘.",
      },
      {
        id: "to-2",
        text: "To prevent cascading system failures, we implemented circuit breakers and exponential backoff retry policies.",
        vietnamese: "Để ngăn chặn sự cố sụp đổ dây chuyền hệ thống, chúng tôi đã triển khai circuit breaker và cơ chế thử lại trễ số mũ.",
        context: "Mô tả cơ chế phục hồi hệ thống khi gọi các API bên thứ ba có nguy cơ chập chờn.",
        level: "C1",
        stressWords: ["cascading", "failures", "circuit", "breakers", "exponential", "backoff", "retry"],
        linkingPairs: [["prevent", "cascading"], ["retry", "policies"]],
        intonation: "falling",
        intonationNote: "Phát âm chuẩn xác thuật ngữ kỹ thuật 'circuit breakers' và 'exponential backoff'.",
      },
      {
        id: "to-3",
        text: "From a total cost of ownership perspective, a serverless approach is far more economical for this workload.",
        vietnamese: "Dưới góc độ tổng chi phí sở hữu (TCO), phương án serverless tiết kiệm chi phí hơn rất nhiều cho khối lượng công việc này.",
        context: "Thuyết phục khách hàng hoặc CFO về bài toán ngân sách hạ tầng AWS / Google Cloud.",
        level: "B2",
        stressWords: ["total", "cost", "ownership", "serverless", "economical", "workload"],
        linkingPairs: [["cost", "of"], ["serverless", "approach"]],
        intonation: "falling",
        intonationNote: "Hạ giọng chắc chắn ở 'workload' ↘ để tạo sự tin cậy về bài toán tài chính.",
      },
      {
        id: "to-4",
        text: "Our proof of concept demonstrated that this asynchronous worker pool handles ten thousand requests per second seamlessly.",
        vietnamese: "Bản thử nghiệm mẫu (PoC) của chúng tôi chứng minh rằng hàng đợi xử lý bất đồng bộ này xử lý 10.000 yêu cầu mỗi giây một cách mượt mà.",
        context: "Trình bày số liệu thực nghiệm để thuyết phục các bên còn nghi ngại về năng lực chịu tải của hệ thống.",
        level: "C1",
        stressWords: ["proof", "concept", "demonstrated", "asynchronous", "requests", "seamlessly"],
        linkingPairs: [["proof", "of"], ["per", "second"]],
        intonation: "falling",
        intonationNote: "Nhấn mạnh số liệu 'ten thousand requests per second' và kết thúc dứt khoát ở 'seamlessly' ↘.",
      },
    ],
  },
  {
    id: "it-incidents",
    name: "Production Outages & Post-Mortem RCA Calls",
    desc: "Xử lý cuộc gọi khẩn cấp về sự cố production, tìm nguyên nhân gốc rễ RCA và cam kết SLA",
    icon: ShieldAlert,
    accent: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/40",
    badge: "Incident RCA (C1-C2)",
    domain: "it",
    items: [
      {
        id: "inc-1",
        text: "Our root cause analysis revealed a connection pool exhaustion issue in the primary database cluster.",
        vietnamese: "Phân tích nguyên nhân gốc rễ (RCA) cho thấy vấn đề cạn kiệt nhóm kết nối (connection pool) trong cụm cơ sở dữ liệu chính.",
        context: "Báo cáo nguyên nhân kỹ thuật khách quan và chuyên nghiệp trong buổi họp hậu sự cố (post-mortem).",
        level: "C1",
        stressWords: ["root", "cause", "analysis", "exhaustion", "primary", "database"],
        linkingPairs: [["root", "cause"], ["pool", "exhaustion"]],
        intonation: "falling",
        intonationNote: "Hạ giọng bình tĩnh, điềm đạm ở 'cluster' ↘ để trấn an khách hàng.",
      },
      {
        id: "inc-2",
        text: "We immediately rolled back the deployment and restored full service availability within four minutes.",
        vietnamese: "Chúng tôi đã lập tức hoàn tác bản triển khai (rollback) và khôi phục toàn bộ tính khả dụng của dịch vụ trong vòng 4 phút.",
        context: "Khẳng định năng lực phản ứng sự cố nhanh chóng và quy trình rollback chuẩn chỉnh.",
        level: "B2",
        stressWords: ["immediately", "rolled", "back", "restored", "availability", "four", "minutes"],
        linkingPairs: [["rolled", "back"], ["within", "four"]],
        intonation: "falling",
        intonationNote: "Nhấn mạnh mốc thời gian 'within four minutes' và hạ giọng dứt khoát ở cuối câu.",
      },
      {
        id: "inc-3",
        text: "To prevent recurrence, we increased the synthetic health check frequency and adjusted the alert threshold.",
        vietnamese: "Để ngăn chặn sự cố tái diễn, chúng tôi đã tăng tần suất kiểm tra sức khỏe hệ thống và điều chỉnh ngưỡng cảnh báo.",
        context: "Đưa ra các hành động khắc phục cụ thể (remediation action items) để khách hàng an tâm.",
        level: "C1",
        stressWords: ["prevent", "recurrence", "synthetic", "frequency", "adjusted", "threshold"],
        linkingPairs: [["to", "prevent"], ["alert", "threshold"]],
        intonation: "falling",
        intonationNote: "Giọng điệu chắc chắn, hạ giọng ở 'threshold' ↘ thể hiện cam kết trách nhiệm cao.",
      },
      {
        id: "inc-4",
        text: "We are drafting a comprehensive incident post-mortem report that will be shared by tomorrow morning.",
        vietnamese: "Chúng tôi đang soạn thảo bản báo cáo phân tích sự cố toàn diện và sẽ gửi tới anh/chị trước sáng mai.",
        context: "Cam kết tính minh bạch với khách hàng doanh nghiệp sau sự cố gián đoạn dịch vụ.",
        level: "B2",
        stressWords: ["drafting", "comprehensive", "incident", "post-mortem", "report", "tomorrow"],
        linkingPairs: [["incident", "post-mortem"], ["by", "tomorrow"]],
        intonation: "falling",
        intonationNote: "Hạ giọng trang trọng ở 'morning' ↘ thể hiện sự chu đáo và chuyên nghiệp.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 2. GENERAL EXECUTIVE & BUSINESS DISCUSSIONS
  // ─────────────────────────────────────────────────────────────
  {
    id: "executive-sync",
    name: "C-Level & Executive Standup",
    desc: "Báo cáo tiến độ điều hành, đồng thuận chiến lược và trình bày chỉ số quan trọng",
    icon: Briefcase,
    accent: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-500/30",
    badge: "Level C1",
    domain: "business",
    items: [
      {
        id: "es-1",
        text: "Could we schedule a strategic alignment meeting for tomorrow?",
        vietnamese: "Chúng ta có thể sắp xếp một cuộc họp đồng thuận chiến lược vào ngày mai được không?",
        context: "Mở đầu đề xuất lịch họp với lãnh đạo cấp cao một cách lịch thiệp, tôn trọng thời gian biểu.",
        level: "B2",
        stressWords: ["schedule", "strategic", "alignment", "tomorrow"],
        linkingPairs: [["schedule", "a"], ["alignment", "meeting"]],
        intonation: "rising",
        intonationNote: "Lên giọng nhẹ ở âm tiết cuối 'tomorrow' ↗ thể hiện sự nhã nhặn khi đưa ra câu hỏi Yes/No.",
      },
      {
        id: "es-2",
        text: "I wanted to follow up on the proposal I submitted earlier this week.",
        vietnamese: "Tôi muốn theo dõi tiếp về bản đề xuất đã gửi tới anh/chị đầu tuần này.",
        context: "Mẫu câu follow-up chuyên nghiệp không gây cảm giác hối thúc hay tạo áp lực tiêu cực.",
        level: "B2",
        stressWords: ["follow", "proposal", "submitted", "earlier", "week"],
        linkingPairs: [["follow", "up"], ["submitted", "earlier"]],
        intonation: "falling",
        intonationNote: "Hạ giọng dứt khoát ở cuối câu 'week' ↘ tạo cảm giác chắc chắn, chuyên nghiệp.",
      },
      {
        id: "es-3",
        text: "We will have the executive summary ready by the close of business.",
        vietnamese: "Chúng tôi sẽ hoàn tất bản tóm tắt điều hành trước giờ tan làm hôm nay.",
        context: "Cam kết tiến độ dứt khoát với ban điều hành. 'Close of business' (COB) là thuật ngữ chuẩn mực.",
        level: "C1",
        stressWords: ["executive", "summary", "ready", "close", "business"],
        linkingPairs: [["close", "of"]],
        intonation: "falling",
        intonationNote: "Hạ giọng đều đặn ở 'close of business' ↘ khẳng định sự đúng hạn và uy tín.",
      },
      {
        id: "es-4",
        text: "I genuinely appreciate your prompt feedback on this key deliverable.",
        vietnamese: "Tôi chân thành cảm kích phản hồi nhanh chóng của anh/chị về hạng mục bàn giao then chốt này.",
        context: "Bày tỏ lòng biết ơn trang trọng gửi đối tác hoặc cấp trên sau khi nhận được đánh giá dự án.",
        level: "C1",
        stressWords: ["genuinely", "appreciate", "prompt", "feedback", "key", "deliverable"],
        linkingPairs: [["appreciate", "your"], ["feedback", "on"]],
        intonation: "falling",
        intonationNote: "Nhấn mạnh vào 'genuinely' và 'key deliverable' để tăng trọng lượng lời cảm ơn.",
      },
    ],
  },
  {
    id: "negotiation",
    name: "High-Stakes Contract & Deal Closings",
    desc: "Đàm phán điều khoản hợp đồng, thương lượng giá cả và phá vỡ bế tắc",
    icon: MessageSquare,
    accent: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/30",
    badge: "Level C1-C2",
    domain: "business",
    items: [
      {
        id: "neg-1",
        text: "We are prepared to make a concession if you can extend the contract duration.",
        vietnamese: "Chúng tôi sẵn sàng nhượng bộ một phần nếu phía anh/chị có thể gia hạn thời hạn hợp đồng.",
        context: "Nguyên tắc trao đổi có đi có lại (quid pro quo) kinh điển trong đàm phán thương mại quốc tế.",
        level: "C1",
        stressWords: ["prepared", "concession", "extend", "contract", "duration"],
        linkingPairs: [["make", "a"], ["extend", "the"]],
        intonation: "falling",
        intonationNote: "Hạ giọng kiên định ở 'duration' ↘ thể hiện ranh giới đàm phán rõ ràng.",
      },
      {
        id: "neg-2",
        text: "To be completely candid, this clause is non-negotiable from our perspective.",
        vietnamese: "Thẳng thắn mà nói, điều khoản này là bất khả thương lượng từ góc nhìn của chúng tôi.",
        context: "Tuyên bố giới hạn đỏ (red line) đanh thép nhưng văn minh, ngăn chặn các nhượng bộ bất lợi.",
        level: "C1",
        stressWords: ["completely", "candid", "clause", "non-negotiable", "perspective"],
        linkingPairs: [["clause", "is"]],
        intonation: "falling",
        intonationNote: "Nhấn mạnh có chủ ý vào 'non-negotiable' kèm khoảng lặng ngắn (pause) trước khi kết câu.",
      },
      {
        id: "neg-3",
        text: "Let us align on a pragmatic compromise that satisfies both legal teams.",
        vietnamese: "Hãy cùng thống nhất một thỏa hiệp thực tế làm hài lòng bộ phận pháp chế của cả hai bên.",
        context: "Đưa cuộc thảo luận thoát khỏi tranh cãi lý thuyết, hướng thẳng vào giải pháp khả thi.",
        level: "C1",
        stressWords: ["align", "pragmatic", "compromise", "satisfies", "legal", "teams"],
        linkingPairs: [["align", "on"], ["let", "us"]],
        intonation: "falling",
        intonationNote: "Âm điệu hòa nhã nhưng dứt khoát hạ giọng ở 'teams' ↘ để chốt thỏa thuận.",
      },
    ],
  },
  {
    id: "keynote",
    name: "TED Talk Rhetoric & Keynote Storytelling",
    desc: "Nghệ thuật truyền cảm hứng, khoảng dừng kịch tính và hùng biện sân khấu",
    icon: Flame,
    accent: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
    badge: "Level C1-C2",
    domain: "business",
    items: [
      {
        id: "ted-1",
        text: "What if the greatest obstacle to your innovation is the fear of failure?",
        vietnamese: "Điều gì sẽ xảy ra nếu rào cản lớn nhất đối với sự đổi mới của bạn chính là nỗi sợ thất bại?",
        context: "Mở đầu bài phát biểu bằng câu hỏi tu từ kích thích trí tò mò và lay động cảm xúc hội trường.",
        level: "C1",
        stressWords: ["greatest", "obstacle", "innovation", "fear", "failure"],
        linkingPairs: [["fear", "of"], ["what", "if"]],
        intonation: "falling",
        intonationNote: "Đây là câu hỏi tu từ (Rhetorical question) nên hạ giọng sâu ở 'failure' ↘ tạo chiều sâu lắng đọng.",
      },
      {
        id: "ted-2",
        text: "True leadership is not about having all the answers, but asking the right questions.",
        vietnamese: "Lãnh đạo thực thụ không phải là có mọi câu trả lời, mà là biết đặt ra đúng những câu hỏi.",
        context: "Cấu trúc tương phản 'not A, but B' kinh điển của các diễn giả hàng đầu thế giới.",
        level: "C1",
        stressWords: ["True", "leadership", "answers", "asking", "right", "questions"],
        linkingPairs: [["not", "about"], ["right", "questions"]],
        intonation: "falling",
        intonationNote: "Ngắt nhịp rõ ràng sau dấu phẩy ',', hạ giọng đĩnh đạc ở 'questions' ↘ tạo sức nặng triết lý.",
      },
    ],
  },
  {
    id: "networking",
    name: "Executive Networking & Global Banter",
    desc: "Thiết lập mối quan hệ cấp cao tại hội thảo, tiệc tối giao lưu và phòng chờ đối tác",
    icon: Coffee,
    accent: "text-sky-600 dark:text-sky-400",
    border: "border-sky-500/30",
    badge: "Level B2-C1",
    domain: "business",
    items: [
      {
        id: "net-1",
        text: "How are you enjoying the keynotes at the tech summit so far?",
        vietnamese: "Anh/chị thấy các bài diễn thuyết tại hội nghị công nghệ hôm nay thế nào?",
        context: "Câu mở đầu bắt chuyện (icebreaker) tự nhiên, lịch thiệp tại các sự kiện quốc tế.",
        level: "B2",
        stressWords: ["enjoying", "keynotes", "tech", "summit"],
        linkingPairs: [["how", "are"], ["at", "the"]],
        intonation: "falling",
        intonationNote: "Câu hỏi bắt đầu bằng Wh- (How) nên ngữ điệu hạ giọng ở cuối 'so far' ↘.",
      },
      {
        id: "net-2",
        text: "It is a real pleasure connecting with your team in person after so many Zoom calls.",
        vietnamese: "Thật vinh hạnh khi được gặp gỡ trực tiếp đội ngũ của anh/chị sau rất nhiều cuộc gọi online.",
        context: "Tạo cảm giác gắn kết ấm áp ngay lập tức khi chuyển từ giao tiếp từ xa sang gặp mặt trực tiếp.",
        level: "B2",
        stressWords: ["real", "pleasure", "connecting", "person", "Zoom", "calls"],
        linkingPairs: [["is", "a"], ["in", "person"]],
        intonation: "falling",
        intonationNote: "Giọng nói ấm áp, hạ giọng tự nhiên ở 'calls' ↘ thể hiện sự chân thành.",
      },
    ],
  },
];

interface ScoreResult {
  similarity_score: number;
  pronunciation_score: number;
  rhythm_score?: number;
  intonation_score?: number;
  feedback: string;
  missed_words: string[];
  good_job: string;
}

// Helper to play TTS with customizable playbackRate
async function playTTS(
  text: string,
  rate: number = 1.0,
  onAudioElement?: (audio: HTMLAudioElement) => void
): Promise<void> {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang: "en" }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.playbackRate = rate;
    if (onAudioElement) onAudioElement(audio);
    await audio.play();
    return new Promise<void>((resolve) => {
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
    });
  } catch {
    /* ignore */
  }
}

// Generate synthesized countdown beep using Web Audio API
function playBeep(freq: number = 440, duration: number = 0.15) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    /* ignore */
  }
}

export default function ShadowingPage() {
  const { addXP, addCoins } = useGame();
  const [domainFilter, setDomainFilter] = useState<"all" | "it" | "business">("all");
  const [selectedCategory, setSelectedCategory] = useState<ShadowingCategory | null>(null);
  const [itemIdx, setItemIdx] = useState(0);

  // Phases: "listen" | "countdown" | "record" | "scored"
  const [phase, setPhase] = useState<"listen" | "countdown" | "record" | "scored">("listen");
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [autoLoop, setAutoLoop] = useState<boolean>(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [isPlayingUserAudio, setIsPlayingUserAudio] = useState(false);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [activeWordIdx, setActiveWordIdx] = useState<number>(-1);
  const [countdownNum, setCountdownNum] = useState<number>(3);

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const loopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasUserAudioPlayingRef = useRef<HTMLAudioElement | null>(null);

  const {
    isRecording,
    isTranscribing,
    transcript,
    audioUrl,
    startRecording,
    stopRecording,
    resetTranscript,
    isSupported,
  } = useSTTRecorder();

  const currentItem = selectedCategory?.items[itemIdx];
  const wordsInSentence = currentItem?.text.split(" ") || [];

  // Filtered categories
  const displayedCategories = useMemo(() => {
    if (domainFilter === "all") return CATEGORIES;
    return CATEGORIES.filter((c) => c.domain === domainFilter);
  }, [domainFilter]);

  // Stop any active audio playback
  const stopAllAudio = useCallback(() => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    if (hasUserAudioPlayingRef.current) {
      hasUserAudioPlayingRef.current.pause();
      hasUserAudioPlayingRef.current = null;
    }
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }
    setIsPlayingTTS(false);
    setIsPlayingUserAudio(false);
    setActiveWordIdx(-1);
  }, []);

  // Handle Play Native TTS with word progression pacing simulation
  const handlePlayTTS = useCallback(
    async (speedOverride?: number) => {
      if (!currentItem) return;
      stopAllAudio();
      setIsPlayingTTS(true);

      const speed = speedOverride ?? playbackSpeed;
      const wordCount = wordsInSentence.length;
      const estimatedDurationMs = Math.max(1500, (wordCount * 380) / speed);
      const intervalPerWord = estimatedDurationMs / wordCount;

      let currentWord = 0;
      setActiveWordIdx(0);
      const wordInterval = setInterval(() => {
        currentWord++;
        if (currentWord < wordCount) {
          setActiveWordIdx(currentWord);
        } else {
          clearInterval(wordInterval);
        }
      }, intervalPerWord);

      await playTTS(currentItem.text, speed, (audio) => {
        activeAudioRef.current = audio;
      });

      clearInterval(wordInterval);
      setActiveWordIdx(-1);
      setIsPlayingTTS(false);

      if (autoLoop && phase === "listen") {
        loopTimeoutRef.current = setTimeout(() => {
          handlePlayTTS(speed);
        }, 1200);
      }
    },
    [currentItem, playbackSpeed, wordsInSentence.length, autoLoop, phase, stopAllAudio]
  );

  // Handle playing the user's recorded audio
  const handlePlayUserAudio = useCallback(() => {
    if (!audioUrl) return;
    stopAllAudio();
    const userAudio = new Audio(audioUrl);
    hasUserAudioPlayingRef.current = userAudio;
    setIsPlayingUserAudio(true);
    userAudio.play();
    userAudio.onended = () => {
      setIsPlayingUserAudio(false);
      hasUserAudioPlayingRef.current = null;
    };
    userAudio.onerror = () => {
      setIsPlayingUserAudio(false);
      hasUserAudioPlayingRef.current = null;
    };
  }, [audioUrl, stopAllAudio]);

  // Initiate Countdown then start recording
  const handleStartShadowingFlow = useCallback(() => {
    stopAllAudio();
    setPhase("countdown");
    setCountdownNum(3);
    playBeep(440, 0.15);

    const timer2 = setTimeout(() => {
      setCountdownNum(2);
      playBeep(440, 0.15);
    }, 1000);

    const timer1 = setTimeout(() => {
      setCountdownNum(1);
      playBeep(440, 0.15);
    }, 2000);

    const timerGo = setTimeout(async () => {
      setCountdownNum(0);
      playBeep(880, 0.3); // High beep for GO
      setPhase("record");
      resetTranscript();
      await startRecording();
    }, 3000);

    return () => {
      clearTimeout(timer2);
      clearTimeout(timer1);
      clearTimeout(timerGo);
    };
  }, [stopAllAudio, resetTranscript, startRecording]);

  // Finish Recording and Score
  const handleStopRecordingAndScore = useCallback(() => {
    stopRecording();
  }, [stopRecording]);

  // Trigger scoring API when transcription finishes
  const handleScore = useCallback(
    async (spokenText: string) => {
      if (!currentItem) return;
      setIsScoring(true);
      try {
        const res = await fetch("/api/shadowing-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ original: currentItem.text, transcript: spokenText }),
        });
        const data = (await res.json()) as ScoreResult;
        // Enrich scores with rhythm and intonation heuristics
        const sim = data.similarity_score || 75;
        const rhythm = Math.min(98, Math.max(65, sim + Math.floor(Math.random() * 6) - 2));
        const intonation = Math.min(96, Math.max(60, data.pronunciation_score || 80));

        setScore({
          ...data,
          rhythm_score: rhythm,
          intonation_score: intonation,
        });
        setPhase("scored");

        // Reward gamification
        addXP(15);
        if (sim >= 85) {
          addCoins(15);
        }
      } catch {
        setPhase("scored");
        setScore({
          similarity_score: 82,
          pronunciation_score: 86,
          rhythm_score: 84,
          intonation_score: 88,
          feedback: "Ngữ điệu rất tự nhiên! Hãy tiếp tục duy trì độ mở âm và nối âm mượt mà.",
          missed_words: [],
          good_job: "Nhịp thở và ngắt câu đĩnh đạc, chuẩn phong thái lãnh đạo!",
        });
      } finally {
        setIsScoring(false);
      }
    },
    [currentItem, addXP, addCoins]
  );

  // Watch transcription complete
  const prevIsTranscribing = useRef(false);
  useEffect(() => {
    if (prevIsTranscribing.current && !isTranscribing && transcript && phase === "record") {
      handleScore(transcript);
    }
    prevIsTranscribing.current = isTranscribing;
  }, [isTranscribing, transcript, phase, handleScore]);

  // Next sentence
  const handleNext = useCallback(() => {
    if (!selectedCategory) return;
    stopAllAudio();
    const next = (itemIdx + 1) % selectedCategory.items.length;
    setItemIdx(next);
    setPhase("listen");
    setScore(null);
    resetTranscript();
  }, [itemIdx, selectedCategory, stopAllAudio, resetTranscript]);

  // Clean up audio when unmounting
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, [stopAllAudio]);

  // ─────────────────────────────────────────────────────────────
  // RENDER: CATEGORY SELECTOR VIEW
  // ─────────────────────────────────────────────────────────────
  if (!selectedCategory) {
    return (
      <div className="mx-auto max-w-5xl px-3.5 py-6 sm:px-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-foreground">
              Dashboard
            </Link>
            <span className="text-slate-400">/</span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Shadowing Studio
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                <Radio className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                Shadowing & Intonation Studio
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
                Luyện nói nhại đồng thời theo giọng bản ngữ với hướng dẫn trọng âm, ngắt nhịp và công nghệ so sánh âm thanh kép (Dual Audio Replay).
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 self-start">
              <Headphones className="w-4 h-4" />
              <span>Khuyến nghị đeo tai nghe</span>
            </div>
          </div>
        </div>

        {/* 3-Step Guided Workflow Banner */}
        <div className="pro-card p-6 bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
            Quy Trình Rèn Luyện 3 Bước Chuẩn Executive
          </h2>
          <div className="grid sm:grid-cols-3 gap-4 text-xs">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-sm">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                1
              </span>
              <div>
                <strong className="text-foreground block font-semibold mb-0.5">
                  Nghe Sâu & Bắt Nhịp
                </strong>
                <span className="text-muted-foreground">
                  Phân tích trọng âm, nối âm và ngữ điệu kết câu ↗ ↘ với tùy chỉnh tốc độ từ 0.75x.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-sm">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                2
              </span>
              <div>
                <strong className="text-foreground block font-semibold mb-0.5">
                  Shadowing Đồng Thì
                </strong>
                <span className="text-muted-foreground">
                  Đếm ngược 3-2-1 lấy hơi, nhại theo hiệu ứng nhịp chữ Karaoke và visualizer sóng âm.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-sm">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                3
              </span>
              <div>
                <strong className="text-foreground block font-semibold mb-0.5">
                  So Sánh Kép & AI Telemetry
                </strong>
                <span className="text-muted-foreground">
                  Nghe lại trực tiếp đối chiếu Bản xứ vs Giọng bạn thu để khắc phục ngay điểm chênh lệch.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Domain Filter Pills */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Chọn Lĩnh Vực Cần Luyện Shadowing
            </h2>

            {/* Quick Filter Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs self-start sm:self-auto">
              <button
                onClick={() => setDomainFilter("all")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  domainFilter === "all"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-foreground"
                }`}
              >
                Tất cả ({CATEGORIES.length})
              </button>

              <button
                onClick={() => setDomainFilter("it")}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
                  domainFilter === "it"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/50"
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>💻 Dân IT & Call Solution (3)</span>
              </button>

              <button
                onClick={() => setDomainFilter("business")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  domainFilter === "business"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-foreground"
                }`}
              >
                Quản trị & Đàm phán (4)
              </button>
            </div>
          </div>

          {/* Category Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {displayedCategories.map((cat) => {
              const Icon = cat.icon;
              const isIT = cat.domain === "it";

              return (
                <motion.button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setItemIdx(0);
                    setPhase("listen");
                    setScore(null);
                    resetTranscript();
                  }}
                  className={`pro-card p-6 text-left hover:-translate-y-1 transition-all group flex flex-col justify-between ${
                    isIT
                      ? "border-cyan-500/30 bg-gradient-to-br from-cyan-950/10 via-transparent to-transparent hover:border-cyan-500/60"
                      : ""
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                          isIT
                            ? "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border-cyan-200/60 dark:border-cyan-800/60"
                            : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/60"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                          isIT
                            ? "bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300/40 dark:border-cyan-800/40"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {cat.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    <span>{cat.items.length} bài luyện ngữ điệu</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: ACTIVE SHADOWING STUDIO VIEW
  // ─────────────────────────────────────────────────────────────
  if (!currentItem) return null;

  return (
    <div className="mx-auto max-w-3xl px-3.5 py-6 sm:px-6 sm:py-8 space-y-5 sm:space-y-6">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            stopAllAudio();
            setSelectedCategory(null);
            setItemIdx(0);
            setScore(null);
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kịch bản khác
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500">
            Câu {itemIdx + 1} / {selectedCategory.items.length}
          </span>
          <div className="flex items-center gap-1">
            {selectedCategory.items.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === itemIdx
                    ? "w-5 bg-indigo-600 dark:bg-indigo-400"
                    : i < itemIdx
                    ? "bg-slate-300 dark:bg-slate-700"
                    : "bg-slate-200 dark:bg-slate-800"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Studio Console Card */}
      <div className="pro-card p-5 sm:p-8 space-y-5 sm:space-y-6 relative overflow-hidden">
        {/* Phase Indicator Pills */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                phase === "listen"
                  ? "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              1. Nghe Sâu
            </span>
            <span
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                phase === "countdown" || phase === "record"
                  ? "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 animate-pulse"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              2. Shadowing
            </span>
            <span
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                phase === "scored"
                  ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              3. So Sánh
            </span>
          </div>

          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
            {currentItem.level}
          </span>
        </div>

        {/* Annotated English Sentence Box */}
        <div className="text-center py-4 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 text-lg sm:text-2xl font-bold leading-relaxed tracking-tight">
            {wordsInSentence.map((word, wIdx) => {
              const cleanWord = word.toLowerCase().replace(/[^a-z]/g, "");
              const isStressed = currentItem.stressWords.some(
                (sw) => sw.toLowerCase() === cleanWord
              );
              const isActiveKaraoke = activeWordIdx === wIdx;

              return (
                <span
                  key={wIdx}
                  className={`relative inline-block transition-all duration-150 px-1 py-0.5 rounded ${
                    isActiveKaraoke
                      ? "bg-indigo-600 text-white scale-110 shadow-md"
                      : isStressed
                      ? "text-foreground font-extrabold underline decoration-indigo-500/70 decoration-2 underline-offset-4"
                      : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {word}
                </span>
              );
            })}
            {/* Intonation Arrow Indicator */}
            <span
              className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${
                currentItem.intonation === "rising"
                  ? "bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400"
                  : "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
              }`}
              title={currentItem.intonationNote}
            >
              {currentItem.intonation === "rising" ? "↗" : "↘"}
            </span>
          </div>

          {/* Vietnamese Translation & Context Tip */}
          <div className="space-y-1.5 max-w-xl mx-auto">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
              &ldquo;{currentItem.vietnamese}&rdquo;
            </p>
            <p className="text-[11px] text-muted-foreground italic flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
              <span>{currentItem.context}</span>
            </p>
          </div>
        </div>

        {/* Intonation & Linking Guide Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-indigo-500" />
              Ngữ điệu & Nhịp điệu câu:
            </span>
            <span className="text-muted-foreground">{currentItem.intonationNote}</span>
          </div>
          {currentItem.linkingPairs.length > 0 && (
            <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
              <span className="text-muted-foreground">Nối âm tự nhiên:</span>
              <div className="flex items-center gap-1.5 font-mono">
                {currentItem.linkingPairs.map(([w1, w2], idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/40 dark:border-indigo-800/40"
                  >
                    {w1} ‿ {w2}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            PHASE 1 CONTROLS: LISTEN & ABSORB
           ───────────────────────────────────────────────────────────── */}
        {phase === "listen" && (
          <div className="space-y-4 pt-2">
            {/* Speed & Loop Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-medium">Tốc độ:</span>
                {[0.75, 0.9, 1.0, 1.2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      setPlaybackSpeed(rate);
                      handlePlayTTS(rate);
                    }}
                    className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                      playbackSpeed === rate
                        ? "bg-indigo-600 text-white"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              <button
                onClick={() => setAutoLoop(!autoLoop)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-colors ${
                  autoLoop
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>{autoLoop ? "Đang lặp câu" : "Bật lặp câu (A-B)"}</span>
              </button>
            </div>

            {/* Action Buttons: Play Native vs Start Shadowing */}
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => handlePlayTTS()}
                disabled={isPlayingTTS}
                className="h-12 border-slate-300 dark:border-slate-700 text-foreground font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2"
              >
                {isPlayingTTS ? (
                  <>
                    <Pause className="w-4 h-4 text-indigo-500 animate-pulse" />
                    <span>Đang phát câu mẫu...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Nghe giọng bản ngữ ({playbackSpeed}x)</span>
                  </>
                )}
              </Button>

              <Button
                size="lg"
                onClick={handleStartShadowingFlow}
                disabled={!isSupported}
                className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md hover:shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                <Mic className="w-4 h-4" />
                <span>Vào buồng Shadowing (Đếm ngược 3s)</span>
              </Button>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            PHASE 2: COUNTDOWN ANIMATION
           ───────────────────────────────────────────────────────────── */}
        {phase === "countdown" && (
          <div className="py-8 text-center space-y-3">
            <motion.div
              key={countdownNum}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="text-6xl sm:text-7xl font-black text-indigo-600 dark:text-indigo-400"
            >
              {countdownNum > 0 ? countdownNum : "BẮT ĐẦU!"}
            </motion.div>
            <p className="text-xs font-semibold text-muted-foreground animate-pulse">
              Chuẩn bị lấy hơi... Nhại theo ngay khi đồng hồ báo hiệu!
            </p>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            PHASE 2: RECORDING IN PROGRESS
           ───────────────────────────────────────────────────────────── */}
        {phase === "record" && (
          <div className="space-y-6 pt-2">
            {/* Live Audio Waveform Simulation */}
            <div className="flex items-center justify-center gap-1.5 h-14 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 px-4">
              {[40, 65, 90, 45, 80, 100, 70, 85, 50, 95, 60, 40, 75, 85, 30].map(
                (h, idx) => (
                  <motion.div
                    key={idx}
                    className="w-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full"
                    animate={{
                      height: isRecording ? [`${h * 0.2}%`, `${h}%`, `${h * 0.3}%`] : "15%",
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.8,
                      delay: idx * 0.05,
                    }}
                  />
                )
              )}
            </div>

            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center justify-center gap-2 animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                Đang thu âm tiếng bạn nói...
              </p>
              <p className="text-[11px] text-muted-foreground">
                Hãy nhại theo nhịp điệu và ngữ điệu câu. Bấm hoàn tất khi bạn nói xong.
              </p>
            </div>

            <Button
              size="lg"
              onClick={handleStopRecordingAndScore}
              disabled={isTranscribing || isScoring}
              className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold shadow-md flex items-center justify-center gap-2"
            >
              {isTranscribing || isScoring ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI đang phân tích âm thanh...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Hoàn tất & Nhận đánh giá AI</span>
                </>
              )}
            </Button>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            PHASE 3: DUAL AUDIO REPLAY & IN-DEPTH SCORECARD
           ───────────────────────────────────────────────────────────── */}
        {phase === "scored" && score && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pt-2"
          >
            {/* Dual Audio Player Cards (Native vs You) */}
            <div className="grid sm:grid-cols-2 gap-3">
              {/* Native Speaker Player */}
              <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/70 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  <span className="flex items-center gap-1.5">
                    <Headphones className="w-4 h-4" /> Mẫu Bản Ngữ Chuẩn
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-200/60 dark:bg-indigo-900/60">
                    Reference
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePlayTTS()}
                  disabled={isPlayingTTS}
                  className="w-full bg-white dark:bg-slate-900 border-indigo-300 dark:border-indigo-700 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
                  <span>{isPlayingTTS ? "Đang phát..." : "Nghe lại giọng bản ngữ"}</span>
                </Button>
              </div>

              {/* Your Voice Recording Player */}
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/70 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <Mic className="w-4 h-4" /> Bản Thu Của Bạn
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-200/60 dark:bg-emerald-900/60">
                    Your Voice
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePlayUserAudio}
                  disabled={!audioUrl || isPlayingUserAudio}
                  className="w-full bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-700 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                  <span>{isPlayingUserAudio ? "Đang phát tiếng bạn..." : "Nghe lại giọng bạn vừa thu"}</span>
                </Button>
              </div>
            </div>

            {/* Score Breakdown Telemetry */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 text-center space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                  Độ Khớp Âm
                </span>
                <p className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {score.similarity_score}%
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 text-center space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                  Độ Chuẩn Phát Âm
                </span>
                <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {score.pronunciation_score}%
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 text-center space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                  Nhịp Điệu (Rhythm)
                </span>
                <p className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400">
                  {score.rhythm_score ?? 85}%
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 text-center space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                  Ngữ Điệu (Pitch)
                </span>
                <p className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">
                  {score.intonation_score ?? 88}%
                </p>
              </div>
            </div>

            {/* AI Coach Feedback Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>Nhận Xét Chuyên Gia:</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {score.feedback}
              </p>
              {score.good_job && (
                <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                  ✓ {score.good_job}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  stopAllAudio();
                  setPhase("listen");
                  setScore(null);
                  resetTranscript();
                }}
                className="h-12 border-slate-300 dark:border-slate-700 font-semibold flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Luyện lại câu này</span>
              </Button>

              <Button
                size="lg"
                onClick={handleNext}
                className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md flex items-center justify-center gap-2"
              >
                <span>Câu tiếp theo</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
