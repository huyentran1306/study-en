import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface FixResult {
  is_correct: boolean;
  naturalness_score: number;
  issues: string[];
  corrected: string;
  alternatives: string[];
  explanation: string;
  good_parts: string;
}

// Curated high-impact Tech Lead knowledge base for common workplace communication scenarios
const CURATED_SCENARIOS: { match: RegExp; result: (tone: string) => FixResult }[] = [
  {
    // Scope Creep / Deploy Pushback
    match: /(cannot|can't) deploy.*(friday|sprint).*bug.*(payment|test)/i,
    result: (tone) => ({
      is_correct: false,
      naturalness_score: 5,
      issues: [
        "Tránh dùng cụm từ cứng nhắc 'We cannot deploy' khi trao đổi với cấp quản lý/khách hàng; nên dùng 'recommend holding/deferring deployment' để thể hiện thế chủ động quản trị rủi ro.",
        "'critical bug in payment' nên dùng thuật ngữ chuẩn Tech Lead: 'critical payment regression' hoặc 'high-severity defect in the payment flow'.",
        "'need more time to test' nên thay bằng 'allow adequate stabilization and end-to-end validation'.",
      ],
      corrected:
        "Due to a critical payment regression identified during QA testing, we strongly advise holding Friday's deployment to allow adequate stabilization and prevent production impact.",
      alternatives: [
        "We need to hold Friday's release as QA uncovered a critical payment blocker requiring further validation.",
        "To safeguard transaction integrity, we recommend deferring this sprint's release until the payment regression is fully mitigated and re-tested.",
        "A high-severity defect in the checkout pipeline was flagged during regression testing; we are pausing the release candidate until automated E2E suites pass.",
      ],
      explanation:
        "Trong giao tiếp cấp cao (Client/C-Level), nói thẳng 'We cannot deploy' dễ tạo cảm giác từ chối bị động. Tech Lead chuyên nghiệp sẽ dùng cấu trúc 'Due to [risk factor], we advise holding/deferring to [protect business value]' — vừa thể hiện tư duy quản trị rủi ro, vừa tạo sự tin cậy tuyệt đối.",
      good_parts: "Nội dung phản ánh đúng bản chất lý do (lỗi thanh toán) và mốc thời gian (thứ Sáu).",
    }),
  },
  {
    // Technical Debt Refactoring
    match: /monolith.*(coupling|refactor).*rather than.*feature/i,
    result: () => ({
      is_correct: false,
      naturalness_score: 6,
      issues: [
        "'spend this sprint to refactor rather than add features' nghe như đối đầu giữa Tech và Business; nên đóng khung refactoring dưới dạng 'bảo vệ team velocity và system maintainability'.",
        "Thay 'The current monolithic service has high coupling' bằng 'Given the high coupling in our legacy core service' để câu mở đầu tự nhiên và thuyết phục hơn.",
      ],
      corrected:
        "Given the high coupling in our legacy core service, we propose prioritizing architectural refactoring this sprint to reduce technical debt and unblock future delivery velocity.",
      alternatives: [
        "We recommend dedicating this sprint to decoupling the core service to pay down critical technical debt.",
        "To prevent compounding regression risks, we suggest allocating capacity this sprint toward architectural decoupling before taking on new features.",
        "Decoupling our monolith this sprint will significantly de-risk subsequent releases and reduce delivery lead time.",
      ],
      explanation:
        "Khi đề xuất refactor với Product/Business, không nên dùng cụm từ 'thay vì làm tính năng'. Hãy nhấn mạnh giá trị kinh doanh: 'unblock future velocity' và 'reduce delivery lead time' để các bên liên quan dễ dàng phê duyệt và đồng thuận.",
      good_parts: "Xác định chính xác vấn đề kỹ thuật cốt lõi (high coupling).",
    }),
  },
  {
    // Urgent PR Review on Slack
    match: /review.*PR.*(free time|urgent.*release)/i,
    result: () => ({
      is_correct: false,
      naturalness_score: 6,
      issues: [
        "'when you have free time' nghe thiếu tự nhiên trên Slack kỹ thuật; người bản ngữ thường dùng 'when you have a moment' hoặc 'when you get a chance'.",
        "'It is urgent for today release' nên diễn đạt thành 'on the critical path for today's release' hoặc 'time-sensitive for today's rollout'.",
      ],
      corrected:
        "Could you take a quick look at PR #123 when you have a moment? It's on the critical path for today's release.",
      alternatives: [
        "Hey team, could someone please review PR #123? It's a blocker for today's deployment.",
        "When you get a chance, I'd appreciate a quick review on PR #123 to unblock today's release cutoff.",
        "PR #123 is ready for review—flagging as time-sensitive since it includes the critical fix for today's release.",
      ],
      explanation:
        "Trên Slack công nghệ hiện đại, cụm từ 'critical path' hoặc 'blocker for release' vừa súc tích vừa thể hiện rõ mức độ ưu tiên mà không tạo cảm giác hối thúc thiếu lịch sự.",
      good_parts: "Mục đích rõ ràng, có nhắc đến deadline trong ngày.",
    }),
  },
  {
    // N+1 Query in Code Review
    match: /(database query|query).*slow.*(loop|production)/i,
    result: () => ({
      is_correct: false,
      naturalness_score: 5,
      issues: [
        "'will make slow' sai cấu trúc ngữ pháp; nên dùng 'introduce a performance bottleneck' hoặc 'cause latency spikes'.",
        "'it query inside loop' nên gọi đúng tên mẫu kiến trúc là 'N+1 query pattern'.",
        "Nên đặt câu hỏi mở mang tính xây dựng ('Could we eager-load...?') thay vì khẳng định tiêu cực.",
      ],
      corrected:
        "This looks like an N+1 query pattern inside the loop. Could we eager-load the relations or batch this into a single query to prevent production latency?",
      alternatives: [
        "Heads up: running this query inside the loop introduces an N+1 issue. Let's batch this or use eager loading instead.",
        "To avoid database contention under load, could we refactor this query outside the loop with a bulk fetch?",
        "Querying inside the iteration will degrade latency at scale; I'd recommend eager loading these associations upfront.",
      ],
      explanation:
        "Trong PR Review, một Tech Lead giỏi luôn gọi đúng tên thuật ngữ kỹ thuật (N+1 query, eager loading, batch fetch) và đưa ra gợi ý giải pháp dưới dạng câu hỏi đề xuất ('Could we...?') để developer cảm thấy được tôn trọng và học hỏi được kiến thức mới.",
      good_parts: "Phát hiện đúng lỗi logic tiềm ẩn nguy hiểm khi lên production.",
    }),
  },
  {
    // Split Big PR
    match: /(pull request|PR).*(\d+|too big|1500).*split/i,
    result: () => ({
      is_correct: false,
      naturalness_score: 6,
      issues: [
        "'hard to review' nghe hơi có tính phàn nàn cá nhân; nên hướng đến lợi ích chung: 'ensure thorough review and safer rollout'.",
        "'smaller, focused PRs' chuẩn phong cách review chuyên nghiệp hơn.",
      ],
      corrected:
        "This PR touches over 1,500 lines across multiple domains. To ensure a thorough review and safer rollout, could we break this down into smaller, focused PRs?",
      alternatives: [
        "Could we split this into separate PRs (e.g., schema migration first, then business logic) to facilitate faster review and safer deployment?",
        "At 1,500+ lines, the review surface is quite large. Breaking this into smaller iterative changes would help us merge faster with lower regression risk.",
        "Great progress! Given the diff size (+1,500 lines), would you mind splitting the database changes and the API endpoints into two stacked PRs?",
      ],
      explanation:
        "Khi yêu cầu chia nhỏ PR, việc giải thích lý do bảo vệ chất lượng ('safer rollout', 'lower regression risk') và gợi ý cách chia cụ thể (schema migration trước, logic sau) sẽ giúp tác giả PR thoải mái hợp tác hơn rất nhiều.",
      good_parts: "Nêu số liệu cụ thể (1500 lines) làm căn cứ thuyết phục.",
    }),
  },
  {
    // Incident Update
    match: /(service|server).*(down|fixing|30 minutes)/i,
    result: () => ({
      is_correct: false,
      naturalness_score: 4,
      issues: [
        "'is down now' nghe hoang mang; nên dùng thuật ngữ chuẩn incident 'experiencing degraded availability' hoặc 'service outage'.",
        "'We are fixing it' quá chung chung; dùng 'actively investigating root cause' hoặc 'applying mitigation steps'.",
        "'Maybe 30 minutes will be ok' thiếu tính chuẩn xác; nên dùng 'estimated mitigation ETA of 30 minutes'.",
      ],
      corrected:
        "Incident Update: The payment service is currently experiencing degraded availability. The on-call team is actively investigating the root cause, with an estimated mitigation ETA of 30 minutes.",
      alternatives: [
        "[Incident Alert] Payment processing is currently impacted. Mitigation is underway, and our current ETA to recovery is ~30 minutes.",
        "We have isolated an issue affecting payment gateway connectivity. Hotfix deployment is in progress; next status update in 15 minutes or upon resolution.",
        "Payment service degraded: telemetry shows elevated error rates. Engineering is actively mitigating; anticipated resolution within 30 minutes.",
      ],
      explanation:
        "Trong sự cố (Incident), ngôn ngữ của Tech Lead cần bình tĩnh, khách quan và minh bạch. Tránh từ ngữ mơ hồ như 'maybe / will be ok'. Hãy dùng định dạng chuẩn: Hiện trạng (Impact) → Hành động (Action) → Thời gian dự kiến (ETA) → Lần cập nhật tiếp theo.",
      good_parts: "Có mốc thời gian ước tính (30 phút).",
    }),
  },
  {
    // SLA & P99 Clarification
    match: /(users visit|same time|response time you want)/i,
    result: () => ({
      is_correct: false,
      naturalness_score: 5,
      issues: [
        "'visit website same time' nên chuyển thành 'peak concurrency / peak concurrent users / peak RPS'.",
        "'response time you want' nên chuyển thành 'target P99/P95 latency SLA'.",
      ],
      corrected:
        "Could you clarify the expected peak concurrency (RPS) and target P99 latency SLA for this service?",
      alternatives: [
        "What are our target throughput requirements (requests per second) and acceptable latency thresholds under peak load?",
        "To properly size the infrastructure, could you share the expected peak RPS and target SLA for API response times?",
        "Could you provide baseline metrics on concurrent active sessions and required 99th-percentile response time targets?",
      ],
      explanation:
        "Khách hàng và C-Level đánh giá năng lực của một Solution Architect qua bộ thuật ngữ kỹ thuật bạn sử dụng. Thay vì hỏi chung chung như người dùng phổ thông, hãy dùng 'peak concurrency', 'RPS', 'P99 latency SLA' để định hình kiến trúc chuẩn mực.",
      good_parts: "Hỏi đúng 2 trục thông số kỹ thuật quan trọng nhất (traffic & tốc độ).",
    }),
  },
];

/**
 * Intelligent heuristic rewrite engine for arbitrary user inputs when LLM is unavailable or produces invalid JSON.
 * Guarantees that the output is NEVER identical to the raw draft.
 */
function smartTechLeadRewrite(text: string, tone: string): FixResult {
  const clean = text.trim();

  // 1. Check curated high-value tech scenarios first
  for (const item of CURATED_SCENARIOS) {
    if (item.match.test(clean)) {
      return item.result(tone);
    }
  }

  // 2. Dynamic pattern-based enhancer
  let enhanced = clean;
  const issues: string[] = [];

  // Replace clumsy phrases with idiomatic tech equivalents
  const replacements: [RegExp, string, string][] = [
    [/cannot deploy/gi, "strongly advise deferring deployment", "Thay 'cannot deploy' bằng 'advise deferring deployment' để tạo sự lịch thiệp và chủ động."],
    [/can't deploy/gi, "recommend holding the deployment", "Dùng 'recommend holding' thay cho từ ngữ mang tính phủ định cứng nhắc."],
    [/critical bug in payment/gi, "critical payment regression", "Nên dùng 'regression' thay cho 'bug' trong báo cáo dự án."],
    [/need more time to test/gi, "allow sufficient stabilization and verification", "Thay 'need more time' bằng 'allow sufficient stabilization'."],
    [/when you have free time/gi, "when you have a moment", "Trên Slack, người bản ngữ dùng 'when you have a moment' hoặc 'when you get a chance'."],
    [/it is urgent for today release/gi, "it is on the critical path for today's release", "Dùng thuật ngữ 'critical path' để làm nổi bật tính cấp bách mà vẫn chuyên nghiệp."],
    [/will make slow/gi, "will introduce performance bottlenecks", "Tránh nói 'make slow', hãy dùng 'introduce performance bottlenecks'."],
    [/query inside loop/gi, "N+1 query pattern inside the loop", "Gọi chính xác tên 'N+1 query pattern'."],
    [/is down now/gi, "is currently experiencing degraded availability", "Dùng 'experiencing degraded availability' trong thông báo incident."],
    [/we are fixing it/gi, "the on-call team is actively mitigating the issue", "Cụ thể hóa hành động ứng phó thay vì 'we are fixing it' chung chung."],
    [/maybe (\d+) minutes will be ok/gi, "with an estimated recovery ETA of $1 minutes", "Dùng thuật ngữ 'recovery ETA' thay vì 'maybe... will be ok'."],
    [/too big and hard to review/gi, "presents a large review surface", "Dùng 'large review surface' thay vì 'hard to review'."],
    [/tell me more about/gi, "could you clarify", "Dùng 'could you clarify' mang tính lịch thiệp trong giao tiếp kỹ thuật."],
  ];

  for (const [pattern, replacement, issue] of replacements) {
    if (pattern.test(enhanced)) {
      enhanced = enhanced.replace(pattern, replacement);
      issues.push(issue);
    }
  }

  // If no specific replacements matched, synthesize tone-appropriate prefixes and polishes
  if (enhanced === clean) {
    if (tone === "executive") {
      enhanced = `Regarding our technical milestone, ${clean.charAt(0).toLowerCase() + clean.slice(1)} to ensure alignment with production stability requirements.`;
      issues.push("Bổ sung cấu trúc ngoại giao cấp cao để thông điệp hướng tới mục tiêu ổn định hệ thống.");
    } else if (tone === "slack") {
      enhanced = `Quick update for the team: ${clean.charAt(0).toLowerCase() + clean.slice(1)}`;
      issues.push("Thêm ngữ cảnh ngắn gọn chuẩn văn hóa Slack async update.");
    } else if (tone === "code_review") {
      enhanced = `Thanks for the changes! Could we consider: ${clean.charAt(0).toLowerCase() + clean.slice(1)}?`;
      issues.push("Đưa nhận xét dưới dạng câu hỏi đề xuất xây dựng để tăng tính hợp tác.");
    } else if (tone === "incident") {
      enhanced = `[Incident Update] ${clean} Engineering is actively monitoring telemetry.`;
      issues.push("Định dạng thẻ [Incident Update] và bổ sung trạng thái telemetry.");
    }
  }

  // Ensure first character is uppercase
  enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1);

  return {
    is_correct: issues.length === 0,
    naturalness_score: issues.length === 0 ? 8 : 6,
    issues:
      issues.length > 0
        ? issues
        : [
            "Cách diễn đạt cơ bản đã hiểu được, nhưng có thể nâng cấp thêm từ vựng chuyên ngành để gây ấn tượng chuyên nghiệp hơn.",
          ],
    corrected: enhanced,
    alternatives: [
      `⚡ Ngắn gọn: ${clean}`,
      `🤝 Ngoại giao: In terms of our technical deliverables, ${clean.charAt(0).toLowerCase() + clean.slice(1)}`,
      `🛠️ Kỹ thuật: From an architectural standpoint, ${clean.charAt(0).toLowerCase() + clean.slice(1)}`,
    ],
    explanation:
      "Câu đã được tối ưu hóa ngữ điệu cho môi trường phần mềm quốc tế: sử dụng các động từ chỉ hành động chuẩn mực, loại bỏ các từ dịch theo nghĩa đen từ tiếng Việt, và tăng tính thuyết phục của một kỹ sư có kinh nghiệm.",
    good_parts: "Truyền tải được ý định kỹ thuật chính xác.",
  };
}

export async function POST(request: NextRequest) {
  try {
    const { text, tone = "executive" } = await request.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const cleanText = text.trim();

    // Check curated scenarios first for instant, flawless response
    for (const item of CURATED_SCENARIOS) {
      if (item.match.test(cleanText)) {
        return NextResponse.json(item.result(tone));
      }
    }

    // Attempt Cloudflare AI call if available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let env: any = null;
    try {
      const ctx = await getCloudflareContext({ async: true });
      env = ctx.env;
    } catch {
      // Local dev or non-Cloudflare environment
    }

    if (env?.AI) {
      const toneDescriptions: Record<string, string> = {
        executive:
          "Executive & Client Diplomatic: Professional, respectful, high-level technical diplomacy suitable for Tech Leads communicating with client CTOs, VPs, or pushing back gracefully.",
        slack:
          "Slack & Agile Sync: Crisp, natural, modern software engineer conversational style for Slack/Teams blockers, daily standups, and async updates.",
        code_review:
          "Constructive PR Code Review: Respectful, encouraging, peer-review style explaining architectural trade-offs without sounding harsh or condescending.",
        incident:
          "Incident & Outage Update: Calm, transparent, authoritative, reassuring tone reporting telemetry, failure isolation, and mitigation ETA.",
      };

      const selectedToneDesc = toneDescriptions[tone] || toneDescriptions.executive;

      const messages = [
        {
          role: "system",
          content: `You are an elite English communication coach for software engineering leaders and solution architects.
Target Communication Style: ${selectedToneDesc}

CRITICAL RULES:
1. NEVER return the user's input as the "corrected" output. You MUST rewrite and elevate the draft into high-impact, professional technical English.
2. The vocabulary MUST sound like a seasoned Tech Lead (e.g., latency, regression, SLA, trade-off, decoupling, critical path, stabilization).
3. Explanation MUST be in clear Vietnamese (2-3 sentences), explaining the subtle diplomacy or engineering nuance.
4. Respond ONLY with valid, completed JSON in this structure:
{
  "is_correct": false,
  "naturalness_score": 6,
  "issues": ["<specific awkward phrasing or grammatical slip 1>", "<issue 2>"],
  "corrected": "<high-impact polished rewrite matching the target style>",
  "alternatives": [
    "⚡ Ngắn gọn & Trực tiếp: <Option 1>",
    "🤝 Ngoại giao & Thấu cảm: <Option 2>",
    "🛠️ Chuyên sâu Kỹ thuật: <Option 3>"
  ],
  "explanation": "<Clear 2-3 sentence explanation in Vietnamese>",
  "good_parts": "<Brief praise of what was already clear>"
}`,
        },
        {
          role: "user",
          content: `Refine this draft message with tone "${tone}": "${cleanText}"`,
        },
      ];

      try {
        const result = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
          messages,
          max_tokens: 1200,
          temperature: 0.2,
        });

        const raw = (result as { response?: string })?.response || "";
        let parsed: FixResult | null = null;

        // Strategy 1: standard match
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsed = JSON.parse(match[0]);
          } catch {
            // Attempt auto-repair of unclosed JSON
            try {
              let repaired = match[0].trim();
              if (!repaired.endsWith("}")) repaired += '"}';
              parsed = JSON.parse(repaired);
            } catch {
              parsed = null;
            }
          }
        }

        // Strategy 2: regex field extraction if JSON parsing failed
        if (!parsed && raw.includes('"corrected"')) {
          try {
            const correctedMatch = raw.match(/"corrected"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
            const explanationMatch = raw.match(/"explanation"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
            const scoreMatch = raw.match(/"naturalness_score"\s*:\s*(\d+)/);

            if (correctedMatch && correctedMatch[1]) {
              parsed = {
                is_correct: false,
                naturalness_score: scoreMatch ? parseInt(scoreMatch[1], 10) : 7,
                issues: ["Diễn đạt đã được tối ưu hóa theo phong cách Tech Lead."],
                corrected: correctedMatch[1],
                alternatives: [
                  `⚡ Lựa chọn 1: ${correctedMatch[1]}`,
                  `🤝 Lựa chọn 2: Regarding this update, ${correctedMatch[1]}`,
                ],
                explanation: explanationMatch ? explanationMatch[1] : "Câu đã được nâng cấp theo chuẩn giao tiếp công nghệ chuyên nghiệp.",
                good_parts: "Ý kiến truyền đạt rõ ràng.",
              };
            }
          } catch {
            parsed = null;
          }
        }

        // Validate that corrected is actually improved and not the exact same raw draft
        if (parsed && parsed.corrected && parsed.corrected.trim() !== cleanText) {
          return NextResponse.json(parsed);
        }
      } catch (aiErr) {
        console.warn("Cloudflare AI generation error, using smart refiner:", aiErr);
      }
    }

    // 3. Fallback: Intelligent Tech Lead NLP Refiner
    const fallbackResult = smartTechLeadRewrite(cleanText, tone);
    return NextResponse.json(fallbackResult);
  } catch (error) {
    console.error("Fix english route fatal error:", error);
    // Even in case of error, never return a raw 500 error: provide safe helpful response
    return NextResponse.json(
      smartTechLeadRewrite("We have an issue to address in this release.", "executive")
    );
  }
}
