/**
 * check_work.js - Backend handlers for Tính năng 1: Chấm vở, không sửa hộ (Prompt 14 Phần A)
 *
 * Tuyệt đối tuân thủ cam kết bảo mật:
 * - Không lưu ảnh trên R2, KV, D1 hay server log.
 * - Giới hạn 10 lần đọc ảnh mỗi ngày cho mỗi gia đình.
 * - Chạy kiểm tra phạm vi trước khi gọi OCR.
 * - Máy kiểm tra phép tính đối chiếu kết quả với AI.
 * - Bộ chặn an toàn (guard.js) đảm bảo không lộ đáp án trong câu hỏi gợi mở cho con.
 *
 * Đợt 15 (P0.B):
 * - Prompt đọc vở chỉ có khuôn (không còn số liệu ví dụ) → model không chép lại ví dụ.
 * - Prompt chấm vở dùng ví dụ khác hẳn (chia kẹo), có câu cấm chép số liệu ví dụ.
 * - Bỏ dữ liệu mẫu "3 hộp bút" khi AI lỗi: đọc lỗi → doc_duoc:false; chấm lỗi → 502.
 * - Phát hiện kết quả trùng ví dụ trong prompt → coi là đọc/chấm lỗi.
 * - Sửa thứ tự tham số validateAndGuard/logGuardEvent (trước đây làm grade chỉ trả {check_id, self_fixed}).
 */

import { reconcileWorkCheck } from "./arithmetic.js";
import { validateAndGuard } from "./guard.js";
import { jsonResponse, authenticateSession } from "./v1_routes.js";
import { executeVisionAI } from "./vision.js";

export const READ_RETRY_MESSAGE = "Mình chưa đọc rõ ảnh, mẹ chụp lại giúp nhé";
const GRADE_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

export const DEFAULT_READ_PROMPT = `Quan sát kỹ trang vở bài làm của học sinh tiểu học trong ảnh. Trả về DUY NHẤT một JSON hợp lệ theo KHUÔN sau (các chỗ <...> là hướng dẫn, phải thay bằng nội dung thật đọc được trong ảnh, KHÔNG chép lại chữ trong ngoặc nhọn):
{
  "doc_duoc": true,
  "ly_do": "",
  "de_bai": "<đề bài nếu thấy trong ảnh, không thấy thì để chuỗi rỗng>",
  "cac_dong": [
    { "so": 1, "noi_dung": "<dòng thứ nhất đúng như con viết>", "chac_chan": <số từ 0 đến 1> },
    { "so": 2, "noi_dung": "<dòng thứ hai đúng như con viết>", "chac_chan": <số từ 0 đến 1>, "lua_chon": ["<cách đọc A>", "<cách đọc B>"] }
  ]
}

QUY TẮC BẮT BUỘC:
1. ĐỌC ĐẦY ĐỦ TẤT CẢ CÁC DÒNG trong bài làm của học sinh: bao gồm dòng chữ lời giải (ví dụ: "Số kẹo còn lại là:"), dòng phép tính (ví dụ: "24 + 7 = 31"), và dòng đáp số (ví dụ: "Đáp số: 31 viên kẹo"). Tuyệt đối không chỉ đọc phép tính mà bỏ qua lời giải hay đáp số.
2. Chép ĐÚNG NHƯ TRẺ VIẾT, kể cả chỗ sai chính tả, sai số liệu hay sai phép tính; tuyệt đối không tự sửa lại cho đúng.
2. Mỗi dòng bài giải của trẻ là một phần tử trong "cac_dong", đánh số thứ tự từ 1. Có bao nhiêu dòng thì ghi bấy nhiêu, không thêm dòng không có trong ảnh.
3. "chac_chan" từ 0.0 đến 1.0 đánh giá độ tự tin nét chữ. Nếu có từ chưa chắc chắn mới thêm "lua_chon" (tối đa 2 cách đọc).
4. Cố gắng nhận diện chữ viết tay học sinh (kể cả chữ nguệch ngoạc, bút chì mờ hoặc có nét gạch xoá). Chỉ trả "doc_duoc": false khi ảnh hoàn toàn không có nét chữ hoặc là ảnh đồ vật/người không liên quan đến bài tập.
5. CHỈ TRẢ VỀ DUY NHẤT ĐỐI TƯỢNG JSON, KHÔNG THÊM BẤT KỲ VĂN BẢN NÀO KHÁC.`;

export const DEFAULT_GRADE_PROMPT = `Bạn là trợ lý sư phạm toán tiểu học cho phụ huynh {{xung_ho}} kèm bé {{ten_con}} học {{lop}}.
Đề bài:
"""{{de_bai}}"""

Các dòng bài làm của con:
"""{{cac_dong}}"""

NHIỆM VỤ:
1. Tự giải lại ĐÚNG BÀI TOÁN TRÊN một cách chuẩn xác từng bước ("loi_giai_chuan").
2. So sánh từng dòng bài làm của con với lời giải chuẩn để tìm bước sai đầu tiên (nếu có).
3. Đánh giá kết quả: "dung_het" | "co_buoc_sai" | "chua_xong" | "khong_ro".
4. Phân loại lỗi nếu có: "doc_de" | "chon_phep_tinh" | "tinh_nham" | "thieu_don_vi" | "trinh_bay" | "chua_lam_xong".
5. Viết giải thích ngắn gọn, đồng cảm chỉ dành riêng cho mẹ đọc ("giai_thich_cho_me").
6. Chỉ ra đáp án đúng cho mẹ: "gia_tri_dung_dong_sai" (kết quả đúng của dòng sai) và "dap_an_dung_cho_me" (kết quả cuối cùng của bài).
7. Nêu điểm sáng cụ thể của con để mẹ khen ngợi ("loi_khen_cu_the"). Khi "dung_het", khen điểm làm tốt và không bịa lỗi; khi đó "dong_sai_dau_tien", "loai_loi", "gia_tri_dung_dong_sai" để null.
8. Tạo câu hỏi gợi mở cho con tự phát hiện lỗi sai ("cau_hoi_cho_con"):
   - "muc_1": câu hỏi gợi mở đúng trọng tâm chỗ sai để mẹ đọc to cho con.
   - "muc_2": gợi ý thực tế dùng đồ vật (que tính, kẹo, vẽ hình).
   TUYỆT ĐỐI KHÔNG để lộ "gia_tri_dung_dong_sai" hay "dap_an_dung_cho_me" vào "muc_1" hoặc "muc_2".

Ví dụ dưới đây CHỈ để biết khuôn JSON, là một bài KHÁC (36 cái kẹo chia đều vào 4 túi, con viết "36 : 4 = 8 (cái)"). TUYỆT ĐỐI KHÔNG chép số liệu, câu chữ của ví dụ; mọi giá trị phải lấy từ đề bài và bài làm ở trên.
{
  "ket_qua": "co_buoc_sai",
  "loi_giai_chuan": ["36 : 4 = 9"],
  "dong_sai_dau_tien": 1,
  "loai_loi": "tinh_nham",
  "giai_thich_cho_me": "Con chọn đúng phép chia nhưng tính nhầm kết quả, có thể con đang nhớ nhầm bảng chia 4.",
  "gia_tri_dung_dong_sai": "9",
  "dap_an_dung_cho_me": "9 cái kẹo",
  "loi_khen_cu_the": "Con nhận ra ngay phải chia đều và ghi đơn vị đầy đủ.",
  "cau_hoi_cho_con": {
    "muc_1": "Con thử nhân ngược lại xem: 8 nhân 4 có bằng số kẹo trong đề không?",
    "muc_2": "Mẹ đưa con một nắm hạt đậu, con chia lần lượt vào 4 cái chén, mỗi lượt mỗi chén một hạt, rồi đếm số hạt trong một chén nhé."
  }
}
CHỈ TRẢ VỀ DUY NHẤT ĐỐI TƯỢNG JSON CHO BÀI CỦA CON.`;

/* ---------- Phát hiện model chép lại ví dụ trong prompt ---------- */

const norm = (s) => String(s ?? "").toLowerCase().replace(/\s+/g, " ").trim();

// Dấu hiệu chép khuôn hoặc chép ví dụ cũ (bản prompt 14 có ví dụ 3 hộp bút)
const READ_PLACEHOLDER_HINTS = [
  "đúng như con viết",
  "chép nguyên văn dòng",
  "đề bài nếu thấy trong ảnh",
  "nội dung đề bài nếu có",
  "cách đọc a",
  "số từ 0 đến 1",
];

export function looksLikeReadEcho(readResult) {
  if (!readResult || typeof readResult !== "object") return false;
  const lines = Array.isArray(readResult.cac_dong) ? readResult.cac_dong : [];
  const deBai = norm(readResult.de_bai);
  const lineTexts = lines.map((l) => norm(typeof l === "object" ? l?.noi_dung : l));

  // Đợt 18 · Chặng 0.2: Bộ lọc trùng ví dụ chỉ được loại khi de_bai VÀ cac_dong giống hệt ví dụ hiện tại trong prompt
  const deBaiEcho = !deBai || deBai.includes("<đề bài") || deBai.includes("đề bài nếu thấy trong ảnh");
  const linesAllEcho = lineTexts.length > 0 && lineTexts.every((t) =>
    t.includes("<dòng") || t.includes("dòng thứ") || t.includes("đúng như con viết")
  );
  if (deBaiEcho && linesAllEcho) return true;

  const oldSig = lines.some(
    (l) => l && Number(l.chac_chan) === 0.62 && Array.isArray(l.lua_chon) && l.lua_chon.map(String).join("|") === "29|20"
  );
  if (oldSig) return true;

  if (lineTexts.some((t) => t.includes("<dòng") && t.includes(">"))) return true;
  return false;
}

export function looksLikeGradeEcho(grade, deBai, cacDong) {
  if (!grade || typeof grade !== "object") return false;
  const src = norm(deBai) + " " + cacDong.map((d) => norm(d?.noi_dung ?? d)).join(" ");
  const sol = Array.isArray(grade.loi_giai_chuan) ? grade.loi_giai_chuan.map(norm).join(" | ") : "";
  // Ví dụ mới: 36 : 4 = 9 — chỉ coi là chép khi đề/bài làm không hề có 36 và 4
  if (/36\s*:\s*4\s*=\s*9/.test(sol) && !/\b36\b/.test(src)) return true;
  if (norm(grade.dap_an_dung_cho_me) === "9 cái kẹo" && !src.includes("kẹo")) return true;
  // Ví dụ cũ: 3 hộp bút
  if (/24\s*-\s*5\s*=\s*19/.test(sol) && !/\b24\b|\b8\b/.test(src)) return true;
  return false;
}

/* ---------- Đọc prompt từ Prompt Studio (bỏ qua bản còn ví dụ cũ) ---------- */

const OLD_EXAMPLE_MARKERS = ['"29", "20"', "24 - 5 = 19", "Mẹ cho bạn Na 5 cây"];

async function loadStudioTemplate(env, promptId, fallback) {
  if (!env?.DB) return fallback;
  try {
    const row = await env.DB.prepare("SELECT value FROM _kv_store WHERE key = 'prompt_studio:config'").first();
    if (!row?.value) return fallback;
    let parsed = typeof row.value === "string" ? JSON.parse(row.value) : row.value;
    if (typeof parsed === "string") parsed = JSON.parse(parsed);
    const cfg = parsed?.prompts || parsed;
    const tpl = cfg?.[promptId]?.template;
    if (typeof tpl !== "string" || tpl.length < 50) return fallback;
    if (OLD_EXAMPLE_MARKERS.some((m) => tpl.includes(m))) return fallback; // còn ví dụ cũ → dùng bản mới
    return tpl;
  } catch (e) {
    return fallback;
  }
}

/* ---------- Đọc JSON lỏng từ model ---------- */

export function parseModelJson(text) {
  if (!text) return null;
  if (typeof text === "object") return text;
  let s = String(text).trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1];
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  s = s.slice(start, end + 1);
  try {
    return JSON.parse(s);
  } catch (e) {
    try {
      return JSON.parse(s.replace(/,\s*([}\]])/g, "$1"));
    } catch (e2) {
      try {
        let out = "";
        let inStr = false;
        let esc = false;
        for (let i = 0; i < s.length; i++) {
          const ch = s[i];
          if (!inStr) {
            if (ch === '"') inStr = true;
            out += ch;
            continue;
          }
          if (esc) {
            out += ch;
            esc = false;
            continue;
          }
          if (ch === "\\") {
            out += ch;
            esc = true;
            continue;
          }
          if (ch === '"') {
            let j = i + 1;
            while (j < s.length && /\s/.test(s[j])) j++;
            if (j === s.length || /[,:\]}]/.test(s[j])) {
              inStr = false;
              out += ch;
            } else {
              out += '\\"';
            }
            continue;
          }
          if (ch === "\n") { out += "\\n"; continue; }
          if (ch === "\r") continue;
          out += ch;
        }
        return JSON.parse(out);
      } catch (e3) {
        return null;
      }
    }
  }
}

const GRADE_RESULTS = ["dung_het", "co_buoc_sai", "chua_xong", "khong_ro"];

/** Grade đủ trường chưa (prompt 14 mục 2.4). Trả danh sách trường thiếu. */
export function missingGradeFields(g) {
  const miss = [];
  if (!g || typeof g !== "object") return ["ket_qua"];
  if (!GRADE_RESULTS.includes(g.ket_qua)) miss.push("ket_qua");
  if (!String(g.giai_thich_cho_me || "").trim()) miss.push("giai_thich_cho_me");
  if (!String(g.loi_khen_cu_the || "").trim()) miss.push("loi_khen_cu_the");
  const q = g.cau_hoi_cho_con;
  if (!q || typeof q !== "object" || !String(q.muc_1 || "").trim()) miss.push("cau_hoi_cho_con");
  if (g.ket_qua === "co_buoc_sai") {
    const n = Number(g.dong_sai_dau_tien);
    if (!Number.isInteger(n) || n < 1) miss.push("dong_sai_dau_tien");
    if (!String(g.loai_loi || "").trim()) miss.push("loai_loi");
    if (g.gia_tri_dung_dong_sai == null || String(g.gia_tri_dung_dong_sai).trim() === "") miss.push("gia_tri_dung_dong_sai");
  }
  return miss;
}

/**
 * Lấy family_id an toàn từ request
 */
async function resolveFamilyId(request, env) {
  const session = await authenticateSession(request, env).catch(() => null);
  if (session && session.family_id) return session.family_id;
  const headerFam = request.headers.get("x-family-id");
  if (headerFam) return headerFam.trim();
  return "family_trial";
}

/**
 * 1. POST /api/v1/ai/check-work/read
 */
export async function handleCheckWorkRead(request, env, corsHeaders) {
  const tStart = Date.now();
  const familyId = await resolveFamilyId(request, env);

  // 1.1 Kiểm tra giới hạn 10 lượt đọc ảnh/ngày/gia đình
  if (env.DB) {
    try {
      const todayCountRow = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM work_checks
        WHERE family_id = ? AND date(created_at) = date('now')
      `).bind(familyId).first();

      const quota = 10;
      if (todayCountRow && todayCountRow.count >= quota) {
        return jsonResponse({
          error: "daily_limit_exceeded",
          message: "Hôm nay mẹ đã dùng hết 10 lượt đọc ảnh rồi. Mẹ và bé quay lại vào ngày mai nhé!",
          limit: quota,
          used: todayCountRow.count,
        }, 429, corsHeaders);
      }
    } catch (e) {
      console.warn("[check_work.read] Quota check failed:", e);
    }
  }

  // 1.2 Bóc tách dữ liệu
  let imageBytes = null;
  let childId = "child_default";
  let sessionId = null;
  let problemText = "";
  let recheckOf = null;
  let isSelfieOrObject = false;

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("image") || formData.get("file");
    if (file && typeof file === "object" && "arrayBuffer" in file) {
      imageBytes = new Uint8Array(await file.arrayBuffer());
    }
    if (formData.has("child_id")) childId = String(formData.get("child_id"));
    if (formData.has("session_id")) sessionId = String(formData.get("session_id"));
    if (formData.has("problem_text")) problemText = String(formData.get("problem_text"));
    if (formData.has("recheck_of")) recheckOf = String(formData.get("recheck_of"));
    if (formData.has("is_selfie") && String(formData.get("is_selfie")) === "true") isSelfieOrObject = true;
  } else if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    childId = body.child_id || childId;
    sessionId = body.session_id || null;
    problemText = body.problem_text || "";
    recheckOf = body.recheck_of || null;
    if (body.is_selfie === true) isSelfieOrObject = true;

    if (body.image) {
      const base64Clean = body.image.replace(/^data:image\/\w+;base64,/, "");
      try {
        const binaryStr = atob(base64Clean);
        imageBytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) imageBytes[i] = binaryStr.charCodeAt(i);
      } catch (e) {}
    }
  }

  // 1.3 Kiểm tra luật phạm vi: selfie, đồ vật
  if (isSelfieOrObject) {
    return jsonResponse({
      check_id: `chk_${Date.now()}_rejected`,
      de_bai: problemText,
      cac_dong: [],
      doc_duoc: false,
      ly_do: "không phải bài làm",
    }, 200, corsHeaders);
  }

  // 1.4 Đọc ảnh qua Vision AI (không lưu ảnh vào R2 hay bất kỳ đâu)
  const checkId = `chk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const notRead = (lyDo = READ_RETRY_MESSAGE, extra = {}) =>
    jsonResponse({ check_id: checkId, de_bai: problemText, cac_dong: [], doc_duoc: false, ly_do: lyDo, ...extra }, 200, corsHeaders);

  if (!imageBytes || imageBytes.length === 0) {
    return notRead("Chưa nhận được ảnh, mẹ chụp lại giúp nhé");
  }
  if (!env.AI) {
    return jsonResponse({ error: "ai_unavailable", message: "Máy chủ AI chưa sẵn sàng, mẹ thử lại sau nhé." }, 503, corsHeaders);
  }

  let prompt = await loadStudioTemplate(env, "p14a_read_work", DEFAULT_READ_PROMPT);
  if (problemText) {
    prompt += `\n\nGợi ý: phụ huynh cho biết đề bài là """${problemText.slice(0, 600)}""". Chỉ dùng để hiểu ngữ cảnh, vẫn chép bài làm đúng như con viết.`;
  }

  let readResult = null;
  let modelUsed = null;
  const ai = await executeVisionAI({ env, imageBytes, prompt, promptId: "p14a_read_work" }).catch((e) => ({
    success: false,
    error: "vision_failed",
    message: e?.message,
  }));
  if (ai?.usagePromise) {
    try {
      // không chặn trả lời vì ghi quota
      ai.usagePromise.catch(() => {});
    } catch (e) {}
  }
  if (ai && ai.success) {
    modelUsed = ai.model;
    console.log("[check_work.read] raw model analysis:", ai.analysis);
    readResult = parseModelJson(ai.analysis);
  } else if (ai && ai.status === 503) {
    return jsonResponse({ error: ai.error || "ai_quota_low", message: ai.message }, 503, corsHeaders);
  } else {
    console.warn("[check_work.read] vision failed:", ai?.error, ai?.message);
  }

  let retryCount = 0;
  if (!readResult || readResult.doc_duoc === false || looksLikeReadEcho(readResult)) {
    console.warn("[check_work.read] Lần đọc 1 chưa rõ hoặc lỗi, tự động thử lại 1 lần với prompt chặt hơn...");
    retryCount = 1;
    const retryPrompt = `${prompt}\n\nCHÚ Ý ĐẶC BIỆT: Đọc cẩn thận từng nét chữ học sinh viết trên trang vở. Chép đủ mọi dòng từ lời giải, phép tính đến đáp số. Trả về DUY NHẤT một JSON hợp lệ.`;
    const aiRetry = await executeVisionAI({ env, imageBytes, prompt: retryPrompt, promptId: "p14a_read_work" }).catch((e) => {
      console.warn("[check_work.read] Retry failed:", e?.message);
      return null;
    });
    if (aiRetry && aiRetry.success) {
      console.log("[check_work.read] Retry raw analysis:", aiRetry.analysis);
      const parsedRetry = parseModelJson(aiRetry.analysis);
      if (parsedRetry && parsedRetry.doc_duoc !== false && !looksLikeReadEcho(parsedRetry)) {
        readResult = parsedRetry;
        modelUsed = aiRetry.model || modelUsed;
      }
    }
  }

  if (!readResult) return notRead(READ_RETRY_MESSAGE, { retries: retryCount });
  if (looksLikeReadEcho(readResult)) {
    console.warn("[check_work.read] model chép lại ví dụ trong prompt → coi là đọc lỗi");
    return notRead(READ_RETRY_MESSAGE, { echo_detected: true, retries: retryCount });
  }
  if (readResult.doc_duoc === false) {
    return notRead(readResult.ly_do || READ_RETRY_MESSAGE, { retries: retryCount });
  }

  const lines = (Array.isArray(readResult.cac_dong) ? readResult.cac_dong : [])
    .map((l, i) => {
      if (typeof l === "string") return { so: i + 1, noi_dung: l.trim(), chac_chan: 0.7 };
      if (!l || typeof l !== "object") return null;
      const out = {
        so: Number(l.so) || i + 1,
        noi_dung: String(l.noi_dung ?? "").trim(),
        chac_chan: Math.max(0, Math.min(1, Number(l.chac_chan) || 0.7)),
      };
      if (Array.isArray(l.lua_chon) && l.lua_chon.length) out.lua_chon = l.lua_chon.slice(0, 2).map(String);
      return out;
    })
    .filter((l) => l && l.noi_dung);
  if (lines.length === 0) return notRead();
  const deBai = String(readResult.de_bai || "").trim() || problemText;

  // 1.5 Lưu bản ghi khởi tạo vào work_checks (chỉ lưu text & metadata, KHÔNG LƯU ẢNH)
  if (env.DB) {
    try {
      await env.DB.prepare(`
        INSERT INTO work_checks (
          id, family_id, child_id, session_id, recheck_of, created_at,
          problem_text, lines_json, lines_edited, latency_ms
        ) VALUES (?, ?, ?, ?, ?, datetime('now'), ?, ?, 0, ?)
      `).bind(checkId, familyId, childId, sessionId, recheckOf, deBai, JSON.stringify(lines), Date.now() - tStart).run();
    } catch (e) {
      console.warn("[check_work.read] Insert work_checks failed:", e);
    }
  }

  return jsonResponse({ check_id: checkId, de_bai: deBai, cac_dong: lines, doc_duoc: true, ly_do: "", model: modelUsed }, 200, corsHeaders);
}

/**
 * 2. POST /api/v1/ai/check-work/:id/grade
 */
export async function handleCheckWorkGrade(request, env, checkId, corsHeaders) {
  const tStart = Date.now();
  const familyId = await resolveFamilyId(request, env);
  const body = await request.json().catch(() => ({}));

  const deBai = String(body.de_bai || "");
  const cacDong = Array.isArray(body.cac_dong) ? body.cac_dong : [];
  const linesEdited = body.lines_edited ? 1 : 0;
  const lop = body.lop || "lớp 3";
  const xungHo = body.xung_ho || "mẹ";
  const tenCon = String(body.ten_con || "con").replace(/^(bé|be)\s+/i, "");

  if (cacDong.length === 0) {
    return jsonResponse({ error: "no_lines", message: "Chưa có dòng bài làm nào để chấm." }, 400, corsHeaders);
  }

  let existingCheck = null;
  if (env.DB) {
    try {
      existingCheck = await env.DB.prepare("SELECT * FROM work_checks WHERE id = ?").bind(checkId).first();
    } catch (e) {}
  }

  // 2.1 Chuẩn bị prompt p14b
  const template = await loadStudioTemplate(env, "p14b_check_work", DEFAULT_GRADE_PROMPT);
  const promptText = template
    .replace(/\{\{de_bai\}\}/g, deBai || "(mẹ không nhập đề, hãy suy ra từ bài làm)")
    .replace(/\{\{cac_dong\}\}/g, cacDong.map((d, i) => `Dòng ${d?.so || i + 1}: ${d?.noi_dung ?? d}`).join("\n"))
    .replace(/\{\{lop\}\}/g, lop)
    .replace(/\{\{xung_ho\}\}/g, xungHo)
    .replace(/\{\{ten_con\}\}/g, tenCon);

  if (!env.AI) {
    return jsonResponse({ error: "ai_unavailable", message: "Máy chủ AI chưa sẵn sàng, mẹ thử lại sau nhé." }, 503, corsHeaders);
  }

  const runOnce = async (extraHint = "") => {
    const run = env.AI.run(GRADE_MODEL, {
      messages: [
        { role: "system", content: "Bạn chỉ trả lời bằng một đối tượng JSON hợp lệ, tiếng Việt có dấu." },
        { role: "user", content: promptText + extraHint },
      ],
      temperature: 0.2,
      max_tokens: 1200,
    });
    let timer;
    const timeout = new Promise((_, rej) => {
      timer = setTimeout(() => rej(new Error("grade timeout")), 20000);
    });
    const aiRes = await Promise.race([run, timeout]).finally(() => clearTimeout(timer));
    const text = typeof aiRes === "string" ? aiRes : aiRes?.response ?? "";
    return parseModelJson(text);
  };

  let rawGrade = null;
  let missing = ["ket_qua"];
  try {
    rawGrade = await runOnce();
    if (rawGrade && looksLikeGradeEcho(rawGrade, deBai, cacDong)) rawGrade = null;
    missing = missingGradeFields(rawGrade);
    if (missing.length && Date.now() - tStart < 9000) {
      // Thử lại 1 lần, nhắc rõ trường còn thiếu
      const retry = await runOnce(
        `\n\nLần trước bạn trả thiếu hoặc sai các trường: ${missing.join(", ")}. Hãy trả lại ĐỦ mọi trường, dựa đúng vào bài của con.`
      );
      if (retry && !looksLikeGradeEcho(retry, deBai, cacDong) && missingGradeFields(retry).length < missing.length) {
        rawGrade = retry;
        missing = missingGradeFields(retry);
      }
    }
  } catch (e) {
    console.warn("[check_work.grade] AI grade failed:", e?.message || e);
  }

  if (!rawGrade || missing.length) {
    return jsonResponse(
      {
        error: "grade_incomplete",
        message: "AI chấm chưa xong, mẹ bấm Thử lại giúp mình nhé.",
        missing_fields: missing,
        check_id: checkId,
      },
      502,
      corsHeaders
    );
  }

  // Chuẩn hoá kiểu dữ liệu
  rawGrade.dong_sai_dau_tien = rawGrade.ket_qua === "co_buoc_sai" ? Number(rawGrade.dong_sai_dau_tien) : null;
  if (rawGrade.ket_qua !== "co_buoc_sai") {
    rawGrade.loai_loi = rawGrade.ket_qua === "chua_xong" ? rawGrade.loai_loi || "chua_lam_xong" : null;
    rawGrade.gia_tri_dung_dong_sai = null;
  }
  if (rawGrade.gia_tri_dung_dong_sai != null) rawGrade.gia_tri_dung_dong_sai = String(rawGrade.gia_tri_dung_dong_sai);
  rawGrade.cau_hoi_cho_con = {
    muc_1: String(rawGrade.cau_hoi_cho_con?.muc_1 || ""),
    muc_2: String(rawGrade.cau_hoi_cho_con?.muc_2 || ""),
  };
  if (!Array.isArray(rawGrade.loi_giai_chuan)) rawGrade.loi_giai_chuan = [];

  // 2.2 Máy kiểm tra phép tính
  const reconciled = reconcileWorkCheck({ aiResult: rawGrade, childLines: cacDong });

  // 2.3 Bộ chặn lộ đáp án — chữ ký đúng: validateAndGuard(promptId, responseText, context, env, ctx)
  const guardContext = {
    problem_text: deBai,
    child_lines: cacDong.map((l) => String(l?.noi_dung ?? l)),
    family_id: familyId,
    session_id: existingCheck?.session_id || null,
  };
  const guardOutcome = validateAndGuard("p14b_check_work", JSON.stringify(reconciled), guardContext, env, null);
  const finalResult = guardOutcome?.data && typeof guardOutcome.data === "object" ? guardOutcome.data : reconciled;
  const guardAction = guardOutcome?.guarded ? "fallback" : "pass";

  // 2.4 Tự sửa thành công
  const selfFixed = existingCheck && existingCheck.recheck_of && finalResult.ket_qua === "dung_het" ? 1 : 0;

  // 2.5 Cập nhật work_checks
  const latencyMs = Date.now() - tStart;
  if (env.DB) {
    try {
      await env.DB.prepare(`
        UPDATE work_checks SET
          result = ?, first_wrong_line = ?, error_type = ?, machine_json = ?, ai_uncertain = ?,
          guard_status = ?, self_fixed = ?, lines_edited = ?, lines_json = ?, latency_ms = ?
        WHERE id = ?
      `).bind(
        finalResult.ket_qua,
        finalResult.dong_sai_dau_tien ?? null,
        finalResult.loai_loi ?? null,
        finalResult.machine_json || null,
        finalResult.ai_uncertain ? 1 : 0,
        guardAction,
        selfFixed,
        linesEdited,
        JSON.stringify(cacDong),
        latencyMs,
        checkId
      ).run();
    } catch (e) {
      console.warn("[check_work.grade] DB update failed:", e);
    }
  }

  const { machine_json, ...publicResult } = finalResult;
  return jsonResponse(
    { check_id: checkId, ...publicResult, self_fixed: selfFixed, guard_action: guardAction },
    200,
    corsHeaders
  );
}

/**
 * 3. GET /api/v1/ai/check-work/:id
 */
export async function handleCheckWorkGet(request, env, checkId, corsHeaders) {
  if (!env.DB) {
    return jsonResponse({ error: "DB not available" }, 500, corsHeaders);
  }
  const row = await env.DB.prepare("SELECT * FROM work_checks WHERE id = ?").bind(checkId).first();
  if (!row) {
    return jsonResponse({ error: "not_found", message: "Không tìm thấy bài chấm" }, 404, corsHeaders);
  }
  return jsonResponse({ ok: true, check: row }, 200, corsHeaders);
}

/**
 * 4. GET /api/v1/ai/check-work/history
 */
export async function handleCheckWorkHistory(request, env, corsHeaders) {
  const familyId = await resolveFamilyId(request, env);
  if (!env.DB) {
    return jsonResponse({ ok: true, history: [] }, 200, corsHeaders);
  }
  const rows = await env.DB.prepare(`
    SELECT * FROM work_checks
    WHERE family_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).bind(familyId).all();

  return jsonResponse({ ok: true, history: rows.results || [] }, 200, corsHeaders);
}
