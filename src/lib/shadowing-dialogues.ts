export interface DialogueTurn {
  id: string;
  turnIndex: number;
  speaker: "client" | "architect";
  speakerName: string;
  speakerRole: string;
  avatar: string;
  text: string;
  vietnamese: string;
  keyTerms: string[];
  intonationNote: string;
  linkingTips?: string[];
}

export interface ShadowingDialogue {
  id: string;
  title: string;
  subtitle: string;
  categoryName: string;
  level: "B2" | "C1" | "C2";
  domain: "it-cloud" | "it-incident" | "it-tradeoffs" | "it-security" | "it-api" | "it-kickoff";
  durationMinutes: number;
  totalTurns: number;
  clientName: string;
  clientRole: string;
  clientCompany: string;
  architectRole: string;
  context: string;
  learningObjectives: string[];
  keyTechnicalTerms: { term: string; meaning: string }[];
  turns: DialogueTurn[];
}

export const SHADOWING_DIALOGUES: ShadowingDialogue[] = [
  // ─────────────────────────────────────────────────────────────
  // 1. CLOUD MIGRATION & DECONSTRUCTING THE MONOLITH
  // ─────────────────────────────────────────────────────────────
  {
    id: "dialogue-cloud-migration",
    title: "Cloud Migration & Deconstructing the Monolithic Core",
    subtitle: "Tư vấn chuyển dịch hệ thống Monolith 10 năm tuổi sang Microservices trên AWS",
    categoryName: "Cloud Native Architecture",
    level: "C1",
    domain: "it-cloud",
    durationMinutes: 8,
    totalTurns: 8,
    clientName: "Marcus Vance",
    clientRole: "VP of Engineering",
    clientCompany: "FinTech Prime Corp (New York)",
    architectRole: "Trân — Lead Solutions Architect",
    context:
      "Khách hàng sở hữu một hệ thống core ngân hàng dạng monolith đã vận hành 10 năm, đang gặp tắc nghẽn nghiêm trọng khi số người dùng đồng thời vượt quá 50,000. Marcus muốn lắng nghe phương án di dời an toàn không gây downtime.",
    learningObjectives: [
      "Luyện cách trình bày Strangler-fig Pattern một cách tự tin và thuyết phục",
      "Giải thích cơ chế Saga Pattern & Event-driven với Apache Kafka",
      "Cam kết bảo đảm tính toàn vẹn dữ liệu (Data Consistency) và Zero Downtime",
      "Rèn luyện ngữ điệu đĩnh đạc, hạ giọng dứt khoát khi trả lời câu hỏi hóc búa của VP",
    ],
    keyTechnicalTerms: [
      { term: "Strangler-fig Pattern", meaning: "Mô hình bóc tách dần lõi monolith thành các service độc lập mà không cần tắt hệ thống" },
      { term: "Bounded Context", meaning: "Ranh giới nghiệp vụ độc lập trong thiết kế kiến trúc Domain-Driven Design" },
      { term: "Saga Pattern", meaning: "Mô hình điều phối giao dịch phân tán kèm bù trừ tự động (compensating transactions)" },
      { term: "Zero-downtime Cutover", meaning: "Chuyển đổi lưu lượng thực tế sang hệ thống mới với độ trễ 0s và không mất kết nối" },
    ],
    turns: [
      {
        id: "cm-1",
        turnIndex: 1,
        speaker: "client",
        speakerName: "Marcus Vance",
        speakerRole: "VP of Engineering",
        avatar: "👨‍💼",
        text: "Thanks for jumping on the call today, Trân. As you know, our legacy monolithic backend is hitting severe CPU throttling during market open. What is your proposed architectural migration roadmap?",
        vietnamese:
          "Cảm ơn Trân đã tham gia cuộc gọi hôm nay. Như bạn biết đấy, hệ thống backend monolith cũ của chúng tôi đang bị bóp nghẽn CPU nghiêm trọng vào giờ mở phiên giao dịch. Lộ trình di chuyển kiến trúc mà bạn đề xuất là gì?",
        keyTerms: ["legacy", "monolithic", "CPU throttling", "migration roadmap"],
        intonationNote: "Khách hàng đặt vấn đề với giọng điệu nghiêm túc, nhấn vào 'CPU throttling' và lên giọng nhẹ ở 'roadmap?'",
      },
      {
        id: "cm-2",
        turnIndex: 2,
        speaker: "architect",
        speakerName: "Trân (You)",
        speakerRole: "Lead Solutions Architect",
        avatar: "👩‍💻",
        text: "Good morning Marcus. Absolutely. Given your peak load of fifty thousand concurrent traders, attempting a big-bang rewrite is far too risky. We recommend adopting a phased Strangler-fig pattern to gradually extract domain boundaries into decoupled microservices on Amazon EKS.",
        vietnamese:
          "Chào buổi sáng Marcus. Rất sẵn lòng. Với lượng tải đỉnh 50.000 nhà giao dịch đồng thời của anh, việc đập đi viết lại toàn bộ là quá rủi ro. Chúng tôi đề xuất áp dụng mô hình Strangler-fig theo từng giai đoạn để bóc tách dần các ranh giới nghiệp vụ thành các microservices độc lập trên Amazon EKS.",
        keyTerms: ["concurrent traders", "big-bang rewrite", "Strangler-fig pattern", "decoupled microservices", "Amazon EKS"],
        intonationNote: "Hạ giọng điềm đạm ở 'too risky' ↘, nhấn mạnh các từ khóa kiến trúc 'Strangler-fig pattern' và 'Amazon EKS'.",
        linkingTips: ["Good morning", "Given your", "We recommend adopting a"],
      },
      {
        id: "cm-3",
        turnIndex: 3,
        speaker: "client",
        speakerName: "Marcus Vance",
        speakerRole: "VP of Engineering",
        avatar: "👨‍💼",
        text: "That approach makes strategic sense. However, our executive board is extremely apprehensive about data consistency. How do you plan to handle distributed transactions across both the legacy database and the new services?",
        vietnamese:
          "Cách tiếp cận đó rất hợp lý về mặt chiến lược. Tuy nhiên, ban điều hành của chúng tôi cực kỳ lo ngại về tính nhất quán của dữ liệu. Bạn dự định xử lý các giao dịch phân tán giữa cơ sở dữ liệu cũ và các dịch vụ mới như thế nào?",
        keyTerms: ["strategic sense", "apprehensive", "data consistency", "distributed transactions"],
        intonationNote: "Nhấn mạnh từ 'extremely apprehensive' thể hiện nỗi lo của ban lãnh đạo, kết thúc bằng câu hỏi mở.",
      },
      {
        id: "cm-4",
        turnIndex: 4,
        speaker: "architect",
        speakerName: "Trân (You)",
        speakerRole: "Lead Solutions Architect",
        avatar: "👩‍💻",
        text: "That is a very pertinent concern, Marcus. Rather than relying on two-phase commits which introduce heavy network lockups, we will implement the Saga pattern coordinated via an Apache Kafka event backbone. Each microservice publishes domain events, guaranteeing eventual consistency and automated compensating transactions if any downstream step fails.",
        vietnamese:
          "Đó là một mối bận tâm rất xác đáng, Marcus. Thay vì phụ thuộc vào cơ chế commit 2 pha (2PC) vốn gây nghẽn mạng nặng nề, chúng tôi sẽ triển khai mô hình Saga được điều phối qua trục sự kiện Apache Kafka. Mỗi microservice sẽ phát đi các domain event, bảo đảm tính nhất quán cuối cùng và tự động thực thi các giao dịch bù trừ nếu có bước nào phía sau gặp sự cố.",
        keyTerms: ["two-phase commits", "Saga pattern", "Apache Kafka", "event backbone", "eventual consistency", "compensating transactions"],
        intonationNote: "Tỏ rõ sự đồng cảm ở 'pertinent concern', sau đó giải thích dứt khoát cơ chế 'compensating transactions' ↘.",
        linkingTips: ["That is a", "pertinent concern", "coordinated via an"],
      },
      {
        id: "cm-5",
        turnIndex: 5,
        speaker: "client",
        speakerName: "Marcus Vance",
        speakerRole: "VP of Engineering",
        avatar: "👨‍💼",
        text: "That sounds robust. What about deployment frequency and release risk? Right now, our maintenance windows require bringing the platform offline for three hours every Sunday night.",
        vietnamese:
          "Nghe có vẻ rất vững chắc. Thế còn tần suất triển khai và rủi ro phát hành thì sao? Hiện tại, các khung giờ bảo trì đòi hỏi chúng tôi phải ngắt kết nối hệ thống trong ba tiếng mỗi tối Chủ nhật.",
        keyTerms: ["robust", "deployment frequency", "release risk", "maintenance windows", "offline"],
        intonationNote: "Khách hàng tỏ ra hài lòng ở câu đầu ('That sounds robust') nhưng đặt tiếp bài toán nhức nhối về downtime bảo trì.",
      },
      {
        id: "cm-6",
        turnIndex: 6,
        speaker: "architect",
        speakerName: "Trân (You)",
        speakerRole: "Lead Solutions Architect",
        avatar: "👩‍💻",
        text: "We will eliminate maintenance windows altogether. By establishing an automated GitOps delivery pipeline with ArgoCD and Istio service mesh, we will utilize blue-green deployments paired with automated canary analysis. Traffic will only shift to the new pods once synthetic health probes verify zero error rates.",
        vietnamese:
          "Chúng tôi sẽ loại bỏ hoàn toàn các khung giờ bảo trì ngoại tuyến. Bằng cách thiết lập quy trình phân phối GitOps tự động hóa với ArgoCD và Istio service mesh, chúng tôi sẽ sử dụng kỹ thuật blue-green kết hợp phân tích canary tự động. Lưu lượng chỉ được điều hướng sang các pod mới khi các bài kiểm tra sức khỏe giả lập xác nhận tỷ lệ lỗi bằng không.",
        keyTerms: ["eliminate maintenance windows", "GitOps", "ArgoCD", "Istio service mesh", "blue-green deployments", "canary analysis"],
        intonationNote: "Khẳng định tự tin 'eliminate maintenance windows altogether', ngắt nhịp sau dấu phẩy, kết câu dứt khoát ở 'zero error rates' ↘.",
        linkingTips: ["eliminate maintenance", "paired with automated", "zero error rates"],
      },
      {
        id: "cm-7",
        turnIndex: 7,
        speaker: "client",
        speakerName: "Marcus Vance",
        speakerRole: "VP of Engineering",
        avatar: "👨‍💼",
        text: "That would be a massive game changer for our business reputation. Can your team prepare an end-to-end architecture blueprint and a two-week proof of concept timeline before our steering committee meeting on Thursday?",
        vietnamese:
          "Đó thực sự sẽ là bước ngoặt lớn làm thay đổi diện mạo uy tín doanh nghiệp của chúng tôi. Đội ngũ của bạn có thể chuẩn bị một bản thiết kế kiến trúc toàn diện và lộ trình thử nghiệm PoC hai tuần trước cuộc họp hội đồng quản trị vào thứ Năm không?",
        keyTerms: ["game changer", "architecture blueprint", "proof of concept", "steering committee"],
        intonationNote: "Tông giọng phấn khởi và kỳ vọng, lên giọng lịch sự ở cuối câu hỏi mời gọi hợp tác 'on Thursday? ↗'.",
      },
      {
        id: "cm-8",
        turnIndex: 8,
        speaker: "architect",
        speakerName: "Trân (You)",
        speakerRole: "Lead Solutions Architect",
        avatar: "👩‍💻",
        text: "Consider it done, Marcus. We will assemble the target state architecture diagram, data synchronization model, and milestone breakdown in a comprehensive briefing pack and deliver it to your inbox by Wednesday at noon.",
        vietnamese:
          "Anh cứ yên tâm, Marcus. Chúng tôi sẽ tổng hợp sơ đồ kiến trúc mục tiêu, mô hình đồng bộ hóa dữ liệu và phân bổ các cột mốc dự án vào một bộ hồ sơ tóm tắt toàn diện và gửi tới hòm thư của anh trước 12 giờ trưa thứ Tư.",
        keyTerms: ["Consider it done", "target state architecture", "data synchronization", "milestone breakdown", "briefing pack"],
        intonationNote: "Dứt khoát, chuyên nghiệp và mang lại cảm giác an tâm tuyệt đối với 'Consider it done' và hạ giọng ở 'noon' ↘.",
        linkingTips: ["Consider it done", "assemble the", "deliver it to your"],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 2. HIGH-SEVERITY OUTAGE & INCIDENT POST-MORTEM CALL
  // ─────────────────────────────────────────────────────────────
  {
    id: "dialogue-incident-rca",
    title: "High-Severity Outage Triage & Incident Post-Mortem Call",
    subtitle: "Xử lý cuộc họp khẩn cấp với CTO khi hệ thống thanh toán gặp sự cố nghẽn kết nối",
    categoryName: "Incident Response & SRE",
    level: "C1",
    domain: "it-incident",
    durationMinutes: 7,
    totalTurns: 8,
    clientName: "David Sterling",
    clientRole: "Chief Technology Officer (CTO)",
    clientCompany: "OmniRetail Global (London)",
    architectRole: "Trân — Principal SRE & Infrastructure Lead",
    context:
      "Vào lúc 2:00 sáng, cổng thanh toán chính của OmniRetail bị sập độ khả dụng còn 12%, gây thất thoát hàng triệu bảng Anh trong đợt giảm giá Black Friday. David triệu tập cuộc họp khẩn cấp để đòi hỏi giải trình kỹ thuật và biện pháp phòng ngừa.",
    learningObjectives: [
      "Luyện cách trình bày nguyên nhân gốc rễ (RCA) với thái độ điềm đạm, không đổ lỗi",
      "Khẳng định tốc độ xử lý sự cố (MTTR) và quy trình hoàn tác (Automated Rollback)",
      "Trình bày giải pháp phòng ngừa: Circuit Breakers, Connection Pooling, và Adaptive Rate Limiting",
      "Sử dụng giọng điệu vững chãi, bình tĩnh để xoa dịu khủng hoảng của CTO",
    ],
    keyTechnicalTerms: [
      { term: "Connection Pool Exhaustion", meaning: "Tình trạng cạn kiệt các cổng kết nối sẵn có tới cơ sở dữ liệu do truy vấn chậm" },
      { term: "Cascading Failure", meaning: "Sự cố sập đổ dây chuyền lan truyền từ service này sang toàn bộ hệ sinh thái" },
      { term: "Mean Time to Recovery (MTTR)", meaning: "Thời gian trung bình để khôi phục dịch vụ sau khi xảy ra sự cố" },
      { term: "Circuit Breaker Pattern", meaning: "Ngắt tạm thời các kết nối lỗi để bảo vệ hệ thống không bị quá tải" },
    ],
    turns: [
      {
        id: "ir-1",
        turnIndex: 1,
        speaker: "client",
        speakerName: "David Sterling",
        speakerRole: "Chief Technology Officer",
        avatar: "👨‍💻",
        text: "Trân, our checkout service experienced a twenty-minute outage during our peak Black Friday flash sale. The board is demanding an immediate explanation. What happened, and why was our failover mechanism so slow to respond?",
        vietnamese:
          "Trân, dịch vụ thanh toán của chúng ta vừa bị sập 20 phút ngay giữa đợt bán hàng chớp nhoáng Black Friday. Hội đồng quản trị đang đòi hỏi một lời giải thích ngay lập tức. Chuyện gì đã xảy ra, và tại sao cơ chế dự phòng failover lại phản hồi chậm chạp như vậy?",
        keyTerms: ["checkout service", "outage", "flash sale", "failover mechanism"],
        intonationNote: "Giọng căng thẳng, tốc độ nhanh, nhấn mạnh vào 'immediate explanation' và 'slow to respond'.",
      },
      {
        id: "ir-2",
        turnIndex: 2,
        speaker: "architect",
        speakerName: "Trân (You)",
        speakerRole: "Principal SRE & Infrastructure Lead",
        avatar: "👩‍💻",
        text: "I completely understand the frustration, David. We have finalized the root cause analysis. The disruption was triggered by database connection pool exhaustion, caused by an unindexed query introduced in yesterday's promotional catalog update.",
        vietnamese:
          "Tôi hoàn toàn thấu hiểu sự bức xúc này, David. Chúng tôi đã hoàn tất phân tích nguyên nhân gốc rễ. Sự cố bị kích hoạt bởi tình trạng cạn kiệt kết nối cơ sở dữ liệu (connection pool exhaustion), bắt nguồn từ một truy vấn chưa được đánh chỉ mục trong bản cập nhật danh mục khuyến mãi ngày hôm qua.",
        keyTerms: ["root cause analysis", "database connection pool exhaustion", "unindexed query", "promotional catalog"],
        intonationNote: "Bình tĩnh, điềm đạm, hạ giọng trấn an ở 'understand the frustration' và nêu rõ sự thật kỹ thuật khách quan.",
        linkingTips: ["I completely", "finalized the", "caused by an"],
      },
      {
        id: "ir-3",
        turnIndex: 3,
        speaker: "client",
        speakerName: "David Sterling",
        speakerRole: "Chief Technology Officer",
        avatar: "👨‍💻",
        text: "An unindexed query took down the entire checkout pipeline? Why didn't our circuit breakers isolate the promotional service before it impacted core payment transactions?",
        vietnamese:
          "Một câu truy vấn không index mà đánh sập toàn bộ luồng thanh toán sao? Tại sao các circuit breaker của chúng ta không cô lập dịch vụ khuyến mãi trước khi nó gây ảnh hưởng tới các giao dịch thanh toán cốt lõi?",
        keyTerms: ["unindexed query", "checkout pipeline", "circuit breakers", "isolate", "payment transactions"],
        intonationNote: "Ngạc nhiên và chất vấn gay gắt, lên giọng chất vấn ở 'core payment transactions? ↗'.",
      },
      {
        id: "ir-4",
        turnIndex: 4,
        speaker: "architect",
        speakerName: "Trân (You)",
        speakerRole: "Principal SRE & Infrastructure Lead",
        avatar: "👩‍💻",
        text: "Because both services shared the same physical RDS read-replica cluster. The lingering queries starved the worker threads, creating a cascading backlog. The moment alerts fired, our SRE team executed an automated rollback script and cleared hung threads within four minutes.",
        vietnamese:
          "Bởi vì cả hai dịch vụ đều dùng chung cụm máy chủ RDS read-replica vật lý. Các truy vấn bị treo đã làm cạn kiệt các luồng xử lý (worker threads), tạo nên hiện tượng tắc nghẽn dây chuyền. Ngay khi cảnh báo phát ra, đội ngũ SRE đã lập tức kích hoạt script hoàn tác tự động và giải phóng các luồng bị treo trong vòng bốn phút.",
        keyTerms: ["physical RDS read-replica", "lingering queries", "cascading backlog", "automated rollback", "within four minutes"],
        intonationNote: "Giải thích logic mạch lạc, nhấn mạnh mốc thời gian phản ứng nhanh 'within four minutes' ↘.",
        linkingTips: ["Because both", "moment alerts fired", "within four minutes"],
      },
      {
        id: "ir-5",
        turnIndex: 5,
        speaker: "client",
        speakerName: "David Sterling",
        speakerRole: "Chief Technology Officer",
        avatar: "👨‍💻",
        text: "I appreciate the rapid rollback, but we cannot afford a single repeat of this incident. What structural safeguards are we putting in place today to guarantee this never recurs?",
        vietnamese:
          "Tôi ghi nhận việc rollback nhanh chóng, nhưng chúng ta không thể để xảy ra thêm bất kỳ lần nào tương tự. Những biện pháp rào chắn cấu trúc nào đang được áp dụng ngay hôm nay để đảm bảo sự cố này không bao giờ tái diễn?",
        keyTerms: ["rapid rollback", "cannot afford", "structural safeguards", "guarantee"],
        intonationNote: "Tông giọng dịu lại ở phần ghi nhận nhưng cương quyết đòi hỏi cam kết chắc chắn ở vế sau.",
      },
      {
        id: "ir-6",
        turnIndex: 6,
        speaker: "architect",
        speakerName: "Trân (You)",
        speakerRole: "Principal SRE & Infrastructure Lead",
        avatar: "👩‍💻",
        text: "We are deploying three immediate remediation controls. First, we have decoupled the promotional read traffic onto a dedicated caching tier with Redis Cluster. Second, we tightened query execution timeouts from thirty seconds down to two seconds. Third, we established a strict database connection quota per service.",
        vietnamese:
          "Chúng tôi đang triển khai ba chốt kiểm soát khắc phục ngay lập tức. Thứ nhất, chúng tôi đã tách rời lưu lượng đọc khuyến mãi sang một tầng bộ nhớ đệm riêng biệt với Redis Cluster. Thứ hai, siết chặt thời gian chờ thực thi truy vấn từ ba mươi giây xuống còn hai giây. Thứ ba, thiết lập hạn mức kết nối cơ sở dữ liệu nghiêm ngặt cho từng service riêng rẽ.",
        keyTerms: ["remediation controls", "decoupled", "Redis Cluster", "execution timeouts", "connection quota"],
        intonationNote: "Cấu trúc 1-2-3 rõ ràng: 'First...', 'Second...', 'Third...', nhịp nói đĩnh đạc và đáng tin cậy.",
        linkingTips: ["We are deploying", "onto a dedicated", "down to two seconds"],
      },
      {
        id: "ir-7",
        turnIndex: 7,
        speaker: "client",
        speakerName: "David Sterling",
        speakerRole: "Chief Technology Officer",
        avatar: "👨‍💻",
        text: "That is exactly the level of architectural rigor I expected. When will the formal post-mortem document and action item tracker be ready for our executive briefing?",
        vietnamese:
          "Đó chính xác là mức độ chặt chẽ về kiến trúc mà tôi mong đợi. Khi nào thì bản tài liệu phân tích hậu sự cố chính thức và bảng theo dõi hành động khắc phục sẽ sẵn sàng cho cuộc họp ban điều hành?",
        keyTerms: ["architectural rigor", "formal post-mortem", "action item tracker", "executive briefing"],
        intonationNote: "Thể hiện sự an tâm và hài lòng với giải pháp của Trân.",
      },
      {
        id: "ir-8",
        turnIndex: 8,
        speaker: "architect",
        speakerName: "Trân (You)",
        speakerRole: "Principal SRE & Infrastructure Lead",
        avatar: "👩‍💻",
        text: "The full incident post-mortem report, complete with telemetry charts and root cause timelines, will be published to the leadership portal within two hours. We will also host a thirty-minute retrospective with all squad leads tomorrow morning.",
        vietnamese:
          "Toàn bộ báo cáo phân tích sự cố hoàn chỉnh, kèm theo các biểu đồ dữ liệu đo từ xa và dòng thời gian nguyên nhân gốc rễ, sẽ được phát hành lên cổng thông tin lãnh đạo trong vòng hai giờ tới. Chúng tôi cũng sẽ tổ chức buổi họp rút kinh nghiệm hồi tưởng 30 phút với tất cả các trưởng nhóm vào sáng mai.",
        keyTerms: ["incident post-mortem report", "telemetry charts", "root cause timelines", "leadership portal", "retrospective"],
        intonationNote: "Chốt buổi họp bằng cam kết thời gian minh bạch: 'within two hours' và 'tomorrow morning' ↘.",
        linkingTips: ["full incident", "within two hours", "tomorrow morning"],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 3. ARCHITECTURE TRADE-OFFS DEFENSE: SERVERLESS VS KUBERNETES
  // ─────────────────────────────────────────────────────────────
  {
    id: "dialogue-tradeoffs-defense",
    title: "Technical Trade-Offs Defense: Serverless vs Kubernetes",
    subtitle: "Tranh biện kiến trúc và bảo vệ phương án tối ưu chi phí hạ tầng (TCO) trước Tech Board",
    categoryName: "Architecture Trade-offs",
    level: "C1",
    domain: "it-tradeoffs",
    durationMinutes: 7,
    totalTurns: 8,
    clientName: "Sarah Jenkins",
    clientRole: "Head of Cloud Infrastructure",
    clientCompany: "StreamHub Media (San Francisco)",
    architectRole: "Trân — Principal Enterprise Architect",
    context:
      "Sarah đang chịu áp lực cắt giảm 35% chi phí hạ tầng đám mây trên AWS. Ban lãnh đạo muốn chuyển tất cả sang Serverless (AWS Lambda), nhưng đội ngũ kỹ thuật lo ngại về hiện tượng Cold Start và chi phí khi tải cao.",
    learningObjectives: [
      "Luyện kỹ năng phân tích đa chiều (trade-off matrix): Cost vs Latency vs Operational Overhead",
      "Bảo vệ mô hình kiến trúc lai (Hybrid Architecture: Container EKS cho core workload, Lambda cho bursty events)",
      "Sử dụng các cấu trúc câu phản biện ngoại giao: 'While X is true, we must consider Y'",
      "Hạ giọng chắc nịch khi đưa ra số liệu thực nghiệm PoC",
    ],
    keyTechnicalTerms: [
      { term: "Total Cost of Ownership (TCO)", meaning: "Tổng chi phí sở hữu bao gồm chi phí hạ tầng, nhân sự vận hành và rủi ro" },
      { term: "Cold Start Latency", meaning: "Độ trễ khởi động container ban đầu khi gọi hàm serverless chưa được làm ấm" },
      { term: "Provisioned Concurrency", meaning: "Cơ chế giữ sẵn các instance serverless luôn ấm để loại bỏ cold start" },
      { term: "Hybrid Workload Model", meaning: "Mô hình kết hợp linh hoạt giữa container chạy liên tục và serverless chạy theo sự kiện" },
    ],
    turns: [
      {
        id: "to-1",
        turnIndex: 1,
        speaker: "client",
        speakerName: "Sarah Jenkins",
        speakerRole: "Head of Cloud Infrastructure",
        avatar: "👩‍💼",
        text: "Trân, our CFO wants us to migrate our entire video encoding and metadata pipeline to pure serverless with AWS Lambda to eliminate idle EC2 server costs. Do you support this direction?",
        vietnamese:
          "Trân, giám đốc tài chính CFO muốn chúng ta chuyển toàn bộ luồng mã hóa video và siêu dữ liệu sang thuần serverless với AWS Lambda để loại bỏ chi phí máy chủ EC2 chạy không tải. Bạn có ủng hộ định hướng này không?",
        keyTerms: ["pure serverless", "AWS Lambda", "idle EC2 server costs", "support this direction"],
        intonationNote: "Sarah đặt câu hỏi trực diện để thăm dò quan điểm chuyên môn của Solution Architect.",
      },
      {
        id: "to-2",
        turnIndex: 2,
        speaker: "architect",
        speakerName: "Trân (You)",
        speakerRole: "Principal Enterprise Architect",
        avatar: "👩‍💻",
        text: "While a pure serverless model is enticing from an administrative standpoint, adopting it blindly across all workloads would actually inflate your total cost of ownership and severely degrade video streaming latency.",
        vietnamese:
          "Mặc dù mô hình thuần serverless rất hấp dẫn dưới góc độ quản trị vận hành, việc áp dụng mù quáng nó cho mọi khối lượng công việc thực chất sẽ làm đội phồng tổng chi phí sở hữu (TCO) và làm suy giảm nghiêm trọng độ trễ truyền phát video.",
        keyTerms: ["enticing", "administrative standpoint", "adopting it blindly", "total cost of ownership", "streaming latency"],
        intonationNote: "Mở đầu lịch thiệp bằng 'While...', sau đó khẳng định quan điểm sắc bén ở 'inflate your total cost' ↘.",
        linkingTips: ["While a pure", "enticing from an", "total cost of ownership"],
      },
      {
        id: "to-3",
        turnIndex: 3,
        speaker: "client",
        speakerName: "Sarah Jenkins",
        speakerRole: "Head of Cloud Infrastructure",
        avatar: "👩‍💼",
        text: "How could it inflate costs? Serverless only charges for execution duration, whereas our Kubernetes clusters run twenty-four-seven regardless of incoming traffic.",
        vietnamese:
          "Làm sao nó có thể làm đội chi phí được? Serverless chỉ tính tiền theo thời gian thực thi, trong khi các cụm Kubernetes của chúng ta chạy 24/7 bất kể lưu lượng truy cập đầu vào ra sao.",
        keyTerms: ["inflate costs", "execution duration", "Kubernetes clusters", "twenty-four-seven"],
        intonationNote: "Sarah chất vấn với câu hỏi 'How could it...?', nhấn mạnh sự so sánh giữa tính tiền theo giây và chạy 24/7.",
      },
      {
        id: "to-4",
        turnIndex: 4,
        speaker: "architect",
        speakerName: "Trân (You)",
        speakerRole: "Principal Enterprise Architect",
        avatar: "👩‍💻",
        text: "For unpredictable, bursty traffic like user notifications, Lambda is indeed ninety percent cheaper. However, video transcoding is compute-heavy and sustained. At your current volume of two million minutes per month, Lambda execution charges become three times more expensive than reserved EC2 instances on Kubernetes.",
        vietnamese:
          "Đối với các lưu lượng bất thường, đột biến như thông báo người dùng, Lambda quả thực rẻ hơn đến 90%. Tuy nhiên, việc chuyển mã video là tác vụ ngốn tài nguyên tính toán nặng và diễn ra liên tục. Với khối lượng hiện tại của anh/chị là hai triệu phút mỗi tháng, chi phí thực thi Lambda sẽ đắt gấp ba lần so với các máy chủ EC2 đặt trước (Reserved Instances) trên Kubernetes.",
        keyTerms: ["bursty traffic", "compute-heavy", "sustained", "transcoding", "reserved EC2 instances"],
        intonationNote: "Đưa ra bằng chứng số liệu cụ thể: 'ninety percent cheaper', 'two million minutes', 'three times more expensive'.",
        linkingTips: ["bursty traffic", "compute-heavy and", "three times more"],
      },
      {
        id: "to-5",
        turnIndex: 5,
        speaker: "client",
        speakerName: "Sarah Jenkins",
        speakerRole: "Head of Cloud Infrastructure",
        avatar: "👩‍💼",
        text: "What about the cold start penalty? If we use provisioned concurrency to eliminate cold starts for our playback APIs, doesn't that cancel out the cost savings anyway?",
        vietnamese:
          "Thế còn bài toán độ trễ khởi động nguội (cold start) thì sao? Nếu chúng ta dùng provisioned concurrency để triệt tiêu cold start cho các API phát video, chẳng phải điều đó cũng triệt tiêu luôn khoản tiết kiệm chi phí sao?",
        keyTerms: ["cold start penalty", "provisioned concurrency", "playback APIs", "cancel out"],
        intonationNote: "Sarah đồng tình với lập luận và chỉ ra thêm một nhược điểm chí mạng của serverless.",
      },
      {
        id: "to-6",
        turnIndex: 6,
        speaker: "architect",
        speakerName: "Trân (You)",
        speakerRole: "Principal Enterprise Architect",
        avatar: "👩‍💻",
        text: "Precisely, Sarah. That is why we recommend a pragmatic hybrid architecture. We keep steady-state, latency-critical APIs on EKS with Karpenter autoscaling, while delegating sporadic webhooks and thumbnail generation to ephemeral Lambda functions.",
        vietnamese:
          "Chính xác là như vậy, Sarah. Đó là lý do tại sao chúng tôi đề xuất một kiến trúc lai thực dụng. Chúng ta giữ các API quan trọng về độ trễ, có tải ổn định trên EKS với cơ chế tự co giãn Karpenter, đồng thời ủy thác các webhook rải rác và tác vụ tạo ảnh đại diện thumbnail cho các hàm Lambda ngắn hạn.",
        keyTerms: ["pragmatic hybrid architecture", "steady-state", "latency-critical", "Karpenter autoscaling", "ephemeral Lambda"],
        intonationNote: "Khen ngợi đối tác 'Precisely, Sarah', sau đó đưa ra kết luận giải pháp kiến trúc lai thanh thoát.",
        linkingTips: ["Precisely Sarah", "recommend a pragmatic", "while delegating"],
      },
      {
        id: "to-7",
        turnIndex: 7,
        speaker: "client",
        speakerName: "Sarah Jenkins",
        speakerRole: "Head of Cloud Infrastructure",
        avatar: "👩‍💼",
        text: "That strikes the ideal balance between performance and financial efficiency. Could you summarize this trade-off matrix in a two-page executive slide deck for the CFO?",
        vietnamese:
          "Đó quả là điểm cân bằng lý tưởng giữa hiệu năng và hiệu quả tài chính. Bạn có thể tóm tắt ma trận đánh đổi này trong một bản slide hai trang dành cho CFO không?",
        keyTerms: ["ideal balance", "financial efficiency", "trade-off matrix", "executive slide deck"],
        intonationNote: "Hài lòng và chốt yêu cầu tài liệu thuyết trình trước CFO.",
      },
      {
        id: "dialogue-to-8",
        turnIndex: 8,
        speaker: "architect",
        speakerName: "Trân (You)",
        speakerRole: "Principal Enterprise Architect",
        avatar: "👩‍💻",
        text: "With pleasure. I will include a detailed side-by-side cost projection modeling both five-year TCO and latency SLA guarantees, ready for your review by four PM today.",
        vietnamese:
          "Rất hân hạnh. Tôi sẽ đưa vào bảng so sánh chi phí chi tiết mô phỏng tổng chi phí TCO trong 5 năm cùng các cam kết SLA về độ trễ, sẵn sàng để chị xem xét trước 4 giờ chiều nay.",
        keyTerms: ["With pleasure", "cost projection", "five-year TCO", "latency SLA guarantees"],
        intonationNote: "Nồng nhiệt, chu đáo 'With pleasure' và chốt mốc bàn giao đúng giờ 'by four PM today' ↘.",
        linkingTips: ["With pleasure", "side-by-side", "by four PM today"],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 4. ENTERPRISE SECURITY & SOC2 COMPLIANCE
  // ─────────────────────────────────────────────────────────────
  {
    id: "dialogue-security-compliance",
    title: "Enterprise Security, PII Data Residency & SOC2 Audit",
    subtitle: "Thẩm định kiến trúc an ninh mạng, mã hóa dữ liệu nhạy cảm và tuân thủ GDPR với CISO",
    categoryName: "Security & Compliance",
    level: "C1",
    domain: "it-security",
    durationMinutes: 8,
    totalTurns: 8,
    clientName: "Elena Rostova",
    clientRole: "Chief Information Security Officer (CISO)",
    clientCompany: "HealthTech Global Alliance (Geneva)",
    architectRole: "Trân — Lead Security Solutions Architect",
    context:
      "Tập đoàn công nghệ y tế chuẩn bị mở rộng sang thị trường Châu Âu và Bắc Mỹ, bắt buộc phải đạt chứng chỉ SOC2 Type II và tuân thủ luật bảo vệ dữ liệu GDPR/HIPAA. Elena rà soát từng chi tiết kiến trúc bảo mật.",
    learningObjectives: [
      "Luyện cách trình bày các chuẩn mã hóa: AES-256 Envelope Encryption, AWS KMS, TLS 1.3",
      "Giải thích kiến trúc Zero-Trust và phân quyền truy cập tối thiểu (Principle of Least Privilege)",
      "Trình bày chiến lược khoanh vùng dữ liệu (Data Residency) theo từng quốc gia",
      "Phong thái bảo mật đĩnh đạc, từ ngữ chính xác, không dùng từ mơ hồ",
    ],
    keyTechnicalTerms: [
      { term: "PII (Personally Identifiable Information)", meaning: "Thông tin định danh cá nhân nhạy cảm cần được bảo vệ nghiêm ngặt" },
      { term: "Envelope Encryption", meaning: "Mã hóa phong bì: dữ liệu được mã hóa bằng khóa riêng, sau đó khóa đó được mã hóa bằng Master Key" },
      { term: "Zero-Trust Architecture", meaning: "Kiến trúc không tin tưởng bất kỳ ai, luôn xác thực và ủy quyền ở mọi yêu cầu" },
      { term: "Data Sovereignty", meaning: "Chủ quyền dữ liệu: dữ liệu phải được lưu trữ và xử lý trong biên giới quốc gia quy định" },
    ],
    turns: [
      {
        id: "sec-1",
        turnIndex: 1,
        speaker: "client",
        speakerName: "Elena Rostova",
        speakerRole: "CISO",
        avatar: "👩‍💼",
        text: "Good morning Trân. As we prepare for our SOC2 Type Two audit, our legal counsel has raised serious flags regarding patient telemetry data. How does your proposed cloud topology enforce strict data residency and encryption?",
        vietnamese:
          "Chào buổi sáng Trân. Khi chúng tôi chuẩn bị cho đợt kiểm toán SOC2 Type II, cố vấn pháp lý đã cảnh báo nghiêm trọng về dữ liệu đo từ xa của bệnh nhân. Cấu trúc mạng đám mây mà bạn đề xuất thực thi nghiêm ngặt quyền lưu trữ dữ liệu tại chỗ và mã hóa như thế nào?",
        keyTerms: ["SOC2 Type Two audit", "legal counsel", "telemetry data", "data residency", "encryption"],
        intonationNote: "Tông giọng trang trọng, kỹ lưỡng của CISO, nhấn mạnh 'serious flags' và 'strict data residency'.",
      },
      {
        id: "sec-2",
        turnIndex: 2,
        speaker: "architect",
        speakerName: "Trân (You)",
        speakerRole: "Lead Security Solutions Architect",
        avatar: "👩‍💻",
        text: "Thank you for raising this early, Elena. Our architecture is built on a Zero-Trust framework with multi-region tenancy. All patient health records originating in the EU are permanently pinned to our Frankfurt region, ensuring complete compliance with GDPR data sovereignty mandates.",
        vietnamese:
          "Cảm ơn Elena đã nêu vấn đề này từ sớm. Kiến trúc của chúng tôi được xây dựng trên nền tảng Zero-Trust với mô hình đa vùng độc lập. Toàn bộ hồ sơ sức khỏe bệnh nhân bắt nguồn từ Liên minh Châu Âu sẽ được neo cố định vĩnh viễn tại vùng Frankfurt, bảo đảm tuân thủ trọn vẹn các quy định về chủ quyền dữ liệu theo GDPR.",
        keyTerms: ["Zero-Trust framework", "multi-region tenancy", "permanently pinned", "GDPR", "data sovereignty mandates"],
        intonationNote: "Trang trọng, điềm tĩnh, hạ giọng khẳng định ở 'data sovereignty mandates' ↘.",
        linkingTips: ["Thank you for", "built on a", "pinned to our"],
      },
      {
        id: "sec-3",
        turnIndex: 3,
        speaker: "client",
        speakerName: "Elena Rostova",
        speakerRole: "CISO",
        avatar: "👩‍💼",
        text: "What about data at rest and in transit? Are cryptographic keys managed by AWS or under our exclusive customer-managed control?",
        vietnamese:
          "Thế còn dữ liệu lưu trữ tại chỗ và khi truyền tải thì sao? Các khóa mật mã được quản lý bởi AWS hay thuộc quyền kiểm soát độc quyền của khách hàng (Customer-Managed Keys)?",
        keyTerms: ["data at rest", "in transit", "cryptographic keys", "customer-managed control"],
        intonationNote: "Câu hỏi kỹ thuật mang tính then chốt đối với các chứng chỉ bảo mật cấp cao.",
      },
      {
        id: "sec-4",
        turnIndex: 4,
        speaker: "architect",
        speakerName: "Trân (You)",
        speakerRole: "Lead Security Solutions Architect",
        avatar: "👩‍💻",
        text: "You retain one hundred percent key sovereignty. We utilize AWS Key Management Service with Customer Managed Keys and annual automated rotation. Data at rest is encrypted via AES-two-fifty-six envelope encryption, while all internal microservice calls require mutual TLS one-point-three with ephemeral certificates.",
        vietnamese:
          "Phía chị giữ trọn vẹn 100% chủ quyền khóa. Chúng tôi sử dụng dịch vụ AWS KMS với khóa do khách hàng quản lý (CMK) và cơ chế tự động xoay vòng khóa hàng năm. Dữ liệu khi lưu trữ được mã hóa phong bì chuẩn AES-256, trong khi mọi cuộc gọi microservice nội bộ đều bắt buộc dùng mTLS 1.3 với chứng chỉ ngắn hạn.",
        keyTerms: ["key sovereignty", "Customer Managed Keys", "envelope encryption", "mutual TLS", "ephemeral certificates"],
        intonationNote: "Phát âm chuẩn xác các thuật ngữ 'Customer Managed Keys', 'AES-256 envelope encryption', 'mutual TLS 1.3'.",
        linkingTips: ["You retain one", "Data at rest is", "ephemeral certificates"],
      },
      {
        id: "sec-5",
        turnIndex: 5,
        speaker: "client",
        speakerName: "Elena Rostova",
        speakerRole: "CISO",
        avatar: "👩‍💼",
        text: "How do you enforce access segregation? Our auditors will examine whether database administrators have any backdoor access to unmasked customer identifiers.",
        vietnamese:
          "Bạn thực thi việc phân tách quyền truy cập như thế nào? Các kiểm toán viên sẽ kiểm tra xem liệu các quản trị viên cơ sở dữ liệu (DBA) có quyền truy cập cửa sau vào các định danh khách hàng chưa được che giấu hay không.",
        keyTerms: ["access segregation", "auditors", "backdoor access", "unmasked customer identifiers"],
        intonationNote: "Elena hỏi với giọng thận trọng về nguy cơ rò rỉ dữ liệu từ nội bộ.",
      },
      {
        id: "sec-6",
        turnIndex: 6,
        speaker: "architect",
        speakerName: "Trân (You)",
        speakerRole: "Lead Security Solutions Architect",
        avatar: "👩‍💻",
        text: "We follow the principle of least privilege rigorously. All database columns containing sensitive PII are dynamically masked using column-level encryption. Even DBAs with root access only see deterministic salted hashes. Furthermore, every data query triggers an immutable audit log streamed directly to AWS CloudTrail and Datadog SIEM.",
        vietnamese:
          "Chúng tôi tuân thủ nghiêm ngặt nguyên tắc đặc quyền tối thiểu. Tất cả các cột cơ sở dữ liệu chứa thông tin nhạy cảm PII đều được che dấu động bằng mã hóa cấp cột. Ngay cả các quản trị viên DBA có quyền root cũng chỉ nhìn thấy các chuỗi băm kèm muối (salted hashes). Hơn nữa, mỗi truy vấn dữ liệu đều tạo ra nhật ký kiểm toán bất biến được truyền thẳng về AWS CloudTrail và hệ thống giám sát Datadog SIEM.",
        keyTerms: ["least privilege", "dynamically masked", "column-level encryption", "salted hashes", "immutable audit log", "CloudTrail"],
        intonationNote: "Khẳng định chắc nịch 'least privilege rigorously', giải thích cơ chế che giấu dữ liệu thuyết phục.",
        linkingTips: ["principle of least", "dynamically masked", "immutable audit log"],
      },
      {
        id: "sec-7",
        turnIndex: 7,
        speaker: "client",
        speakerName: "Elena Rostova",
        speakerRole: "CISO",
        avatar: "👩‍💼",
        text: "Excellent. This aligns flawlessly with our compliance framework. Can you supply the SOC2 security matrix and data flow diagrams for our compliance committee meeting next Tuesday?",
        vietnamese:
          "Tuyệt vời. Điều này hoàn toàn ăn khớp với khung tuân thủ của chúng tôi. Bạn có thể cung cấp ma trận an ninh SOC2 và sơ đồ luồng dữ liệu cho cuộc họp ủy ban tuân thủ vào thứ Ba tới không?",
        keyTerms: ["aligns flawlessly", "compliance framework", "SOC2 security matrix", "data flow diagrams"],
        intonationNote: "Tông giọng chuyển sang tán thưởng 'Excellent', bày tỏ sự hài lòng tuyệt đối.",
      },
      {
        id: "sec-8",
        turnIndex: 8,
        speaker: "architect",
        speakerName: "Trân (You)",
        speakerRole: "Lead Security Solutions Architect",
        avatar: "👩‍💻",
        text: "It will be my pleasure, Elena. I will personally review the SOC2 artifact package with our lead security engineer and deliver the finalized diagrams and threat model to your team by Monday morning.",
        vietnamese:
          "Rất hân hạnh được hỗ trợ chị, Elena. Cá nhân tôi sẽ cùng kỹ sư trưởng bảo mật rà soát lại gói tài liệu SOC2 và bàn giao các sơ đồ hoàn thiện cùng mô hình phân tích mối đe dọa (threat model) cho đội ngũ của chị trước sáng thứ Hai.",
        keyTerms: ["pleasure", "SOC2 artifact package", "threat model", "Monday morning"],
        intonationNote: "Khép lại cuộc gọi bằng sự cam kết trách nhiệm cao nhất: 'personally review' và 'by Monday morning' ↘.",
        linkingTips: ["It will be my", "personally review", "threat model to your"],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 5. HIGH-PERFORMANCE API PROTOCOL: gRPC VS REST VS GRAPHQL
  // ─────────────────────────────────────────────────────────────
  {
    id: "dialogue-api-contracts",
    title: "High-Performance API Protocol & Microservices Contract Negotiation",
    subtitle: "Thảo luận lựa chọn chuẩn giao tiếp giữa các services nội bộ và đối tác: gRPC vs REST",
    categoryName: "API & Distributed Systems",
    level: "C1",
    domain: "it-api",
    durationMinutes: 7,
    totalTurns: 8,
    clientName: "Liam O'Connor",
    clientRole: "Principal Backend Lead",
    clientCompany: "NexaPay Global (Dublin)",
    architectRole: "Trân — Distributed Systems Architect",
    context:
      "NexaPay đang nâng cấp hệ thống xử lý giao dịch xuyên biên giới. Liam băn khoăn liệu có nên chuyển đổi toàn bộ giao tiếp giữa 30 microservices từ JSON REST sang gRPC hay không để đạt SLA độ trễ dưới 15ms.",
    learningObjectives: [
      "Thuyết trình về lợi thế của gRPC: Protocol Buffers, HTTP/2 multiplexing, nhị phân hóa dữ liệu",
      "Xử lý vấn đề tương thích ngược (Backward Compatibility) và Schema Registry",
      "Phân định rõ ràng: gRPC cho East-West (nội bộ), REST/GraphQL cho North-South (cổng ra bên ngoài)",
      "Luyện cách phát âm các thuật ngữ phân tán một cách mượt mà và lưu loát",
    ],
    keyTechnicalTerms: [
      { term: "Protocol Buffers (Protobuf)", meaning: "Cơ chế tuần tự hóa dữ liệu dạng nhị phân siêu nhẹ của Google, nhanh gấp 5-10 lần JSON" },
      { term: "HTTP/2 Multiplexing", meaning: "Khả năng truyền nhiều yêu cầu và phản hồi đồng thời trên một kết nối TCP duy nhất" },
      { term: "East-West Traffic", meaning: "Lưu lượng giao tiếp giữa các dịch vụ nội bộ bên trong cụm máy chủ" },
      { term: "Schema Registry", meaning: "Kho lưu trữ và kiểm soát tính tương thích của cấu trúc dữ liệu qua các phiên bản" },
    ],
    turns: [
      {
        id: "api-1",
        turnIndex: 1,
        speaker: "client",
        speakerName: "Liam O'Connor",
        speakerRole: "Principal Backend Lead",
        avatar: "👨‍💻",
        text: "Hi Trân. With our current JSON REST payload sizes, our inter-service latency is hovering around eighty milliseconds during market spikes. We are considering migrating all internal communication to gRPC. Is the engineering overhead truly justified?",
        vietnamese:
          "Chào Trân. Với kích thước dữ liệu JSON REST hiện tại, độ trễ giao tiếp giữa các service của chúng tôi đang dao động quanh mức 80ms trong các đợt biến động thị trường. Chúng tôi đang cân nhắc chuyển toàn bộ giao tiếp nội bộ sang gRPC. Liệu chi phí công sức kỹ thuật bỏ ra có thực sự xứng đáng?",
        keyTerms: ["JSON REST payload", "inter-service latency", "eighty milliseconds", "gRPC", "engineering overhead"],
        intonationNote: "Tông giọng thực tế của một Tech Lead giàu kinh nghiệm, nhấn mạnh 'eighty milliseconds' và 'truly justified?' ↗.",
      },
      {
        id: "api-2",
        turnIndex: 2,
        speaker: "architect",
        speakerName: "Trân (You)",
        speakerRole: "Distributed Systems Architect",
        avatar: "👩‍💻",
        text: "Hi Liam. For your specific SLA of sub-fifteen milliseconds, migrating to gRPC is not just justified—it is essential. By replacing verbose JSON serialization with compact Protocol Buffers, you immediately slash network payload sizes by sixty to seventy percent.",
        vietnamese:
          "Chào Liam. Đối với cam kết SLA đặc thù dưới 15ms của anh, việc chuyển sang gRPC không chỉ xứng đáng mà là điều thiết yếu. Bằng cách thay thế việc tuần tự hóa JSON cồng kềnh bằng Protocol Buffers nhị phân siêu gọn, anh sẽ lập tức cắt giảm 60 đến 70% kích thước gói tin mạng.",
        keyTerms: ["sub-fifteen milliseconds", "not just justified—it is essential", "Protocol Buffers", "slash network payload sizes"],
        intonationNote: "Khẳng định mạnh mẽ 'not just justified—it is essential', nhấn mạnh con số ấn tượng 'sixty to seventy percent' ↘.",
        linkingTips: ["For your specific", "sub-fifteen milliseconds", "slash network"],
      },
      {
        id: "api-3",
        turnIndex: 3,
        speaker: "client",
        speakerName: "Liam O'Connor",
        speakerRole: "Principal Backend Lead",
        avatar: "👨‍💻",
        text: "That payload reduction is compelling. But what about transport efficiency? How does gRPC handle connection contention when five thousand concurrent checkout requests hit our payment gateways?",
        vietnamese:
          "Mức giảm kích thước đó rất thuyết phục. Nhưng còn hiệu quả truyền tải thì sao? gRPC xử lý tình trạng nghẽn kết nối như thế nào khi có 5.000 yêu cầu thanh toán đồng thời dội vào các cổng thanh toán?",
        keyTerms: ["payload reduction", "transport efficiency", "connection contention", "five thousand concurrent checkout requests"],
        intonationNote: "Đặt câu hỏi kỹ thuật hóc búa về tầng mạng Transport Layer và tắc nghẽn kết nối (contention).",
      },
      {
        id: "api-4",
        turnIndex: 4,
        speaker: "architect",
        speakerName: "Trân (You)",
        speakerRole: "Distributed Systems Architect",
        avatar: "👩‍💻",
        text: "gRPC runs natively on HTTP/2, unlocking true bidirectional multiplexing over persistent TCP connections. Instead of opening and tearing down hundreds of HTTP/1.1 connections—which triggers TLS handshake overhead—multiple requests and streaming responses travel asynchronously over a single persistent pipe.",
        vietnamese:
          "gRPC chạy nguyên bản trên nền tảng HTTP/2, mở ra khả năng ghép kênh đa hướng (multiplexing) thực sự trên các kết nối TCP duy trì liên tục. Thay vì phải liên tục mở và đóng hàng trăm kết nối HTTP/1.1 vốn gây hao tổn bắt tay TLS, nhiều yêu cầu và luồng phản hồi truyền bất đồng bộ trên một đường ống bền vững duy nhất.",
        keyTerms: ["HTTP/2", "bidirectional multiplexing", "persistent TCP", "TLS handshake overhead", "single persistent pipe"],
        intonationNote: "Giải thích cơ chế phân tầng mạng mượt mà, nhấn mạnh 'bidirectional multiplexing' và 'single persistent pipe' ↘.",
        linkingTips: ["runs natively on", "TLS handshake overhead", "single persistent pipe"],
      },
      {
        id: "api-5",
        turnIndex: 5,
        speaker: "client",
        speakerName: "Liam O'Connor",
        speakerRole: "Principal Backend Lead",
        avatar: "👨‍💻",
        text: "What about public consumers and third-party merchant integrations? Our external partners do not have the infrastructure to consume raw gRPC binary endpoints.",
        vietnamese:
          "Thế còn những người dùng công cộng và các tích hợp đối tác thương mại bên ngoài thì sao? Các đối tác bên ngoài không có sẵn hạ tầng để tiếp nhận các cổng gRPC nhị phân thô.",
        keyTerms: ["public consumers", "third-party merchant integrations", "raw gRPC binary endpoints"],
        intonationNote: "Liam chỉ ra bài toán thực tế về khả năng tương thích của các đối tác bên thứ ba.",
      },
      {
        id: "api-6",
        turnIndex: 6,
        speaker: "architect",
        speakerName: "Trân (You)",
        speakerRole: "Distributed Systems Architect",
        avatar: "👩‍💻",
        text: "We will adopt a decoupled ingress topology. For all East-West traffic between your internal microservices, we mandate high-throughput gRPC. For North-South traffic facing external merchants, our Envoy API Gateway automatically transcodes inbound JSON REST requests into backend gRPC calls with zero code changes required.",
        vietnamese:
          "Chúng tôi sẽ áp dụng cấu trúc phân tách cổng vào (ingress topology). Đối với toàn bộ lưu lượng East-West nội bộ giữa các microservices, chúng ta bắt buộc dùng gRPC thông lượng cao. Đối với lưu lượng North-South hướng ra ngoài cho các đối tác, Envoy API Gateway sẽ tự động chuyển mã (transcode) các yêu cầu JSON REST thành các cuộc gọi gRPC nội bộ mà không cần sửa một dòng mã nguồn nào.",
        keyTerms: ["ingress topology", "East-West traffic", "North-South traffic", "Envoy API Gateway", "transcodes", "zero code changes"],
        intonationNote: "Phân biệt rành mạch giữa 'East-West' và 'North-South', cam kết 'zero code changes required' ↘.",
        linkingTips: ["We will adopt a", "East-West traffic", "zero code changes"],
      },
      {
        id: "api-7",
        turnIndex: 7,
        speaker: "client",
        speakerName: "Liam O'Connor",
        speakerRole: "Principal Backend Lead",
        avatar: "👨‍💻",
        text: "That dual-layer strategy solves our friction completely. Could your team demonstrate this in a working benchmark harness comparing latency percentiles under load?",
        vietnamese:
          "Chiến lược hai lớp đó giải quyết hoàn toàn điểm nghẽn cọ xát của chúng tôi. Đội ngũ của bạn có thể minh họa điều này trong một bộ kiểm thử chuẩn so sánh các phân vị độ trễ (latency percentiles) khi chịu tải không?",
        keyTerms: ["dual-layer strategy", "friction completely", "working benchmark harness", "latency percentiles"],
        intonationNote: "Liam hào hứng và đề xuất một bài kiểm thử thực tế benchmark.",
      },
      {
        id: "api-8",
        turnIndex: 8,
        speaker: "architect",
        speakerName: "Trân (You)",
        speakerRole: "Distributed Systems Architect",
        avatar: "👩‍💻",
        text: "Absolutely, Liam. We will spin up a Locust load test benchmarking p95 and p99 latency curves for both JSON and gRPC, and walk your backend team through the live metrics dashboard this Friday morning.",
        vietnamese:
          "Chắc chắn rồi, Liam. Chúng tôi sẽ khởi dựng một bài kiểm thử tải Locust đo đạc các đường cong độ trễ p95 và p99 cho cả JSON và gRPC, đồng thời hướng dẫn đội ngũ backend của anh qua bảng số liệu trực quan vào sáng thứ Sáu này.",
        keyTerms: ["Locust load test", "p95 and p99 latency curves", "live metrics dashboard", "Friday morning"],
        intonationNote: "Khẳng định chắc chắn 'Absolutely, Liam', nhấn mạnh các chỉ số 'p95 and p99 latency curves' và chốt hẹn vào thứ Sáu ↘.",
        linkingTips: ["Absolutely Liam", "benchmarking p95", "Friday morning"],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 6. GLOBAL CLIENT KICKOFF & SCOPE DISCOVERY CALL
  // ─────────────────────────────────────────────────────────────
  {
    id: "dialogue-global-kickoff",
    title: "Global Client Kickoff, Requirements Discovery & SLA Alignment",
    subtitle: "Họp khởi động dự án mới, khai thác yêu cầu phi chức năng và chốt cam kết chất lượng dịch vụ SLA",
    categoryName: "Client Discovery & Kickoff",
    level: "B2",
    domain: "it-kickoff",
    durationMinutes: 7,
    totalTurns: 8,
    clientName: "Rachel Adams",
    clientRole: "Global Product Director",
    clientCompany: "CloudScale SaaS (Singapore)",
    architectRole: "Trân — Lead Technical Consultant",
    context:
      "Buổi họp chính thức đầu tiên giữa đại diện cấp cao của khách hàng và Trân để định hình phạm vi công việc dự án, xác lập chỉ số KPI kỹ thuật và thống nhất quy trình phối hợp Agile quốc tế.",
    learningObjectives: [
      "Luyện cách chào hỏi mở đầu cuộc họp chuyên nghiệp, tạo dựng niềm tin ban đầu",
      "Khai thác các yêu cầu phi chức năng (NFRs): Throughput, RTO/RPO, Concurrent Users",
      "Chốt cam kết thời gian hoàn thành giai đoạn thử nghiệm PoC và nghiệm thu",
      "Ngữ điệu tự nhiên, lịch thiệp, tạo bầu không khí hợp tác cởi mở",
    ],
    keyTechnicalTerms: [
      { term: "Non-Functional Requirements (NFRs)", meaning: "Các yêu cầu về chất lượng hệ thống như độ tin cậy, bảo mật, khả năng mở rộng" },
      { term: "Service Level Agreement (SLA)", meaning: "Cam kết mức độ dịch vụ giữa nhà cung cấp giải pháp và khách hàng" },
      { term: "RTO / RPO", meaning: "Thời gian phục hồi mục tiêu (RTO) và Điểm phục hồi dữ liệu mục tiêu (RPO)" },
      { term: "Milestone Acceptance Criteria", meaning: "Tiêu chí nghiệm thu các cột mốc hoàn thành dự án" },
    ],
    turns: [
      {
        id: "ko-1",
        turnIndex: 1,
        speaker: "client",
        speakerName: "Rachel Adams",
        speakerRole: "Global Product Director",
        avatar: "👩‍💼",
        text: "Welcome everyone to our kickoff call. Trân, we are thrilled to collaborate on scaling our multi-tenant SaaS platform. To ensure both organizations are completely aligned, what is your approach for defining our technical foundation?",
        vietnamese:
          "Chào mừng mọi người đã tham gia cuộc gọi khởi động hôm nay. Trân, chúng tôi rất vui mừng được hợp tác trong việc mở rộng nền tảng SaaS đa người thuê (multi-tenant) này. Để bảo đảm cả hai bên hoàn toàn thống nhất, phương pháp tiếp cận của bạn trong việc xác lập nền tảng kỹ thuật là gì?",
        keyTerms: ["kickoff call", "thrilled to collaborate", "multi-tenant SaaS", "completely aligned", "technical foundation"],
        intonationNote: "Tông giọng niềm nở, nồng hậu, đặt câu hỏi cởi mở để người phụ trách kỹ thuật trình bày.",
      },
      {
        id: "ko-2",
        turnIndex: 2,
        speaker: "architect",
        speakerName: "Trân (You)",
        speakerRole: "Lead Technical Consultant",
        avatar: "👩‍💻",
        text: "Thank you Rachel, and the pleasure is entirely ours. Our discovery framework begins by isolating your non-functional requirements—specifically your peak queries per second, target recovery time objectives, and data residency boundaries across your Southeast Asian hubs.",
        vietnamese:
          "Cảm ơn chị Rachel, niềm vinh hạnh hoàn toàn thuộc về chúng tôi. Khung làm việc khảo sát của chúng tôi bắt đầu bằng việc khoanh vùng các yêu cầu phi chức năng của bên chị—cụ thể là lượng truy vấn đỉnh mỗi giây (QPS), thời gian phục hồi mục tiêu (RTO) và các ranh giới lưu trữ dữ liệu tại các trung tâm Đông Nam Á.",
        keyTerms: ["pleasure is entirely ours", "discovery framework", "non-functional requirements", "queries per second", "recovery time objectives"],
        intonationNote: "Phong thái lịch thiệp, giọng điệu ấm áp và tự tin, kết thúc câu rõ ràng, dứt khoát ↘.",
        linkingTips: ["pleasure is entirely", "discovery framework", "queries per second"],
      },
      {
        id: "ko-3",
        turnIndex: 3,
        speaker: "client",
        speakerName: "Rachel Adams",
        speakerRole: "Global Product Director",
        avatar: "👩‍💼",
        text: "That hits our top priorities spot-on. We are projecting ten million active devices connecting concurrently by Q3. Can your proposed architecture deliver ninety-nine point nine-nine percent availability at that scale?",
        vietnamese:
          "Điều đó đánh trúng phóc các ưu tiên hàng đầu của chúng tôi. Chúng tôi đang dự phóng mười triệu thiết bị hoạt động kết nối đồng thời vào Quý 3. Kiến trúc đề xuất của bạn có thể mang lại độ khả dụng 99.99% ở quy mô đó không?",
        keyTerms: ["priorities spot-on", "ten million active devices", "connecting concurrently", "ninety-nine point nine-nine percent availability"],
        intonationNote: "Nhấn mạnh vào con số quy mô lớn 'ten million active devices' và mốc SLA '99.99%'.",
      },
      {
        id: "ko-4",
        turnIndex: 4,
        speaker: "architect",
        speakerName: "Trân (You)",
        speakerRole: "Lead Technical Consultant",
        avatar: "👩‍💻",
        text: "Yes, without hesitation. By architecting an active-active multi-region topology on AWS, backed by DynamoDB global tables and Route 53 latency-based routing, we guarantee automatic regional failover within thirty seconds, comfortably fulfilling four-nines availability.",
        vietnamese:
          "Vâng, hoàn toàn có thể mà không cần ngần ngại. Bằng cách thiết kế kiến trúc đa vùng hoạt động song song (active-active) trên AWS, được hỗ trợ bởi bảng toàn cầu DynamoDB và định tuyến theo độ trễ Route 53, chúng tôi bảo đảm chuyển dự phòng vùng tự động trong vòng 30 giây, đáp ứng mượt mà độ khả dụng bốn số 9.",
        keyTerms: ["without hesitation", "active-active multi-region", "DynamoDB global tables", "automatic regional failover", "four-nines availability"],
        intonationNote: "Khẳng định tràn đầy tự tin 'Yes, without hesitation', nhịp nói đĩnh đạc giải thích cấu trúc active-active.",
        linkingTips: ["without hesitation", "active-active multi-region", "within thirty seconds"],
      },
      {
        id: "ko-5",
        turnIndex: 5,
        speaker: "client",
        speakerName: "Rachel Adams",
        speakerRole: "Global Product Director",
        avatar: "👩‍💼",
        text: "That provides immense confidence to our executive sponsors. How will our internal product managers and engineering squads coordinate with your architecture team on a weekly basis?",
        vietnamese:
          "Điều đó đem lại sự tin tưởng to lớn cho các nhà bảo trợ dự án cấp cao của chúng tôi. Các giám đốc sản phẩm và đội ngũ kỹ thuật nội bộ của chúng tôi sẽ phối hợp với đội kiến trúc của bạn hàng tuần như thế nào?",
        keyTerms: ["immense confidence", "executive sponsors", "product managers", "coordinate", "weekly basis"],
        intonationNote: "Tông giọng phấn khởi, chuyển sang thảo luận phương thức cộng tác thực tế hàng tuần.",
      },
      {
        id: "ko-6",
        turnIndex: 6,
        speaker: "architect",
        speakerName: "Trân (You)",
        speakerRole: "Lead Technical Consultant",
        avatar: "👩‍💻",
        text: "We embed directly into your rhythm. We propose a weekly thirty-minute sprint alignment call, a shared Slack technical channel for real-time unblocking, and a collaborative Jira milestone board to track architectural deliverables and risk items transparently.",
        vietnamese:
          "Chúng tôi sẽ hòa mình trực tiếp vào nhịp làm việc của anh chị. Chúng tôi đề xuất một cuộc gọi đồng bộ sprint 30 phút hàng tuần, một kênh Slack kỹ thuật chung để tháo gỡ vướng mắc theo thời gian thực, và bảng quản lý Jira cộng tác để theo dõi các đầu việc kiến trúc và các mục rủi ro một cách minh bạch.",
        keyTerms: ["embed directly into your rhythm", "sprint alignment call", "shared Slack channel", "Jira milestone board", "transparently"],
        intonationNote: "Thân thiện, rõ ràng, đưa ra giải pháp vận hành liền mạch giúp khách hàng cảm thấy dễ chịu.",
        linkingTips: ["embed directly", "sprint alignment", "track architectural"],
      },
      {
        id: "ko-7",
        turnIndex: 7,
        speaker: "client",
        speakerName: "Rachel Adams",
        speakerRole: "Global Product Director",
        avatar: "👩‍💼",
        text: "That structure sounds seamless and disciplined. What is the immediate next deliverable for our teams to formally kick off Phase One?",
        vietnamese:
          "Quy trình đó nghe rất mượt mà và kỷ luật. Đầu việc bàn giao ngay trước mắt để các đội chính thức khởi động Giai đoạn 1 là gì?",
        keyTerms: ["seamless and disciplined", "immediate next deliverable", "formally kick off", "Phase One"],
        intonationNote: "Rachel thể hiện sự sẵn sàng bắt tay vào làm việc ngay.",
      },
      {
        id: "ko-8",
        turnIndex: 8,
        speaker: "architect",
        speakerName: "Trân (You)",
        speakerRole: "Lead Technical Consultant",
        avatar: "👩‍💻",
        text: "We will dispatch the Project Charter and Technical Discovery questionnaire by five PM today. Once you review and sign off, we will commence our deep-dive architecture workshops first thing next Monday.",
        vietnamese:
          "Chúng tôi sẽ gửi Bản điều lệ dự án (Project Charter) và Bảng câu hỏi khảo sát kỹ thuật trước 5 giờ chiều nay. Sau khi chị xem xét và phê duyệt, chúng ta sẽ bắt đầu các buổi hội thảo kiến trúc chuyên sâu vào đầu giờ sáng thứ Hai tới.",
        keyTerms: ["Project Charter", "Technical Discovery questionnaire", "sign off", "deep-dive architecture workshops", "Monday"],
        intonationNote: "Chốt buổi họp tràn đầy năng lượng tích cực và kế hoạch hành động cụ thể: 'first thing next Monday' ↘.",
        linkingTips: ["Project Charter", "review and sign off", "next Monday"],
      },
    ],
  },
];

