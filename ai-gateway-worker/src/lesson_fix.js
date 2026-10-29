/**
 * lesson_fix.js — Prompt 32 mục 4 + 6: kiểm và "sửa đúng chỗ" bài v3 NGAY TRÊN MÁY CHỦ, trước khi lưu lesson_cache.
 * - Máy kiểm (step_quality.js): bậc chung chung, lặp câu hỏi đề, thiếu bậc, thiếu bậc tính, bậc chọn phép tính nói hộ.
 * - Có lỗi → 1 lần gọi AI NGẮN chỉ trả các bậc cần thay / chèn (không viết lại cả bài), trần thời gian ~6 giây.
 * - Quá trần hoặc bản sửa không tốt hơn → giữ bài trước khi sửa, gắn cờ đã kiểm, ghi log.
 * - Bài lưu cache là bài ĐÃ kiểm/sửa, nên lần sau trúng cache không phải sửa lại.
 */
import { auditSteps, issueScore } from "./step_quality.js";
import { checkAnswerLeak } from "./guard.js";

const DEFAULT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

function extractJsonObject(text) {
  const s = String(text || "");
  const a = s.indexOf("{");
  const b = s.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch (_) { return null; }
}

function buildFixMessages(problemText, steps, audit) {
  const compact = steps.map((b, i) => ({ vi_tri: i + 1, cau_hoi: b.cau_hoi, ky_nang: b.ky_nang, dap_an_cho_me: b.dap_an_cho_me }));
  const sys = `Bạn là trợ lý sư phạm tiểu học. Sửa ĐÚNG CHỖ bộ câu hỏi dẫn dắt dưới đây, KHÔNG viết lại cả bài.
ĐỀ BÀI: """${problemText}"""
CÁC BẬC HIỆN TẠI: ${JSON.stringify(compact)}
LỖI CẦN SỬA: ${audit.issues.map((i) => i.text).join("; ")}
QUY TẮC: mỗi bậc là một bước nhỏ của chính đề, nhắc đúng số và sự vật trong đề; mỗi phép tính của lời giải có một bậc tính riêng ("tinh_toan") hỏi kết quả với số cụ thể; bậc "chon_phep_tinh" KHÔNG viết chữ cộng/trừ/nhân/chia (hỏi "nhiều lên hay ít đi", "con làm phép gì?"); không câu chung chung; không lộ đáp số cuối; câu hỏi ≤ 20 chữ, gợi ý ≤ 15 chữ.
ĐẦU RA: JSON 1 dòng chỉ gồm các bậc cần THAY hoặc CHÈN:
{"sua":[{"vi_tri":3,"loai":"thay","cau_hoi":"...","ky_nang":"tinh_toan","dap_an_cho_me":"...","goi_y":{"muc_1_do_vat":"...","muc_2_hinh_ve":"..."}},{"vi_tri":3,"loai":"chen_sau","cau_hoi":"...","ky_nang":"tinh_toan","dap_an_cho_me":"...","goi_y":{"muc_1_do_vat":"...","muc_2_hinh_ve":"..."}}]}
"vi_tri" là số thứ tự bậc hiện tại (bắt đầu từ 1). CHỈ TRẢ VỀ CHUỖI JSON ĐÓ.`;
  return [
    { role: "system", content: sys },
    { role: "user", content: "Chỉ trả JSON các bậc cần thay hoặc chèn." },
  ];
}

function applyPatch(steps, patch) {
  const list = Array.isArray(patch?.sua) ? patch.sua : [];
  const out = steps.map((b) => ({ ...b }));
  // thay trước, chèn sau (từ vị trí cao xuống thấp để không lệch chỉ số)
  for (const p of list) {
    const i = Number(p?.vi_tri) - 1;
    if (p?.loai === "thay" && out[i] && p.cau_hoi) {
      out[i] = { ...out[i], cau_hoi: p.cau_hoi, ky_nang: p.ky_nang || out[i].ky_nang, dap_an_cho_me: p.dap_an_cho_me || out[i].dap_an_cho_me, goi_y: p.goi_y || out[i].goi_y };
    }
  }
  const inserts = list.filter((p) => p?.loai !== "thay" && p?.cau_hoi).sort((a, b) => Number(b.vi_tri) - Number(a.vi_tri));
  for (const p of inserts) {
    const i = Math.max(0, Math.min(out.length, Number(p.vi_tri) || out.length));
    out.splice(i, 0, { cau_hoi: p.cau_hoi, ky_nang: p.ky_nang || "tinh_toan", dap_an_cho_me: p.dap_an_cho_me || "", goi_y: p.goi_y || {} });
  }
  return out.slice(0, 6);
}

/**
 * fixLessonSteps(env, { lesson, problemText, subject, model, timeoutMs, context })
 * → { lesson, checked, fixed, timedOut, before, after, ms }
 */
export async function fixLessonSteps(env, { lesson, problemText, subject = "Toán", model = DEFAULT_MODEL, timeoutMs = 6000, context = {} } = {}) {
  const started = Date.now();
  const steps = Array.isArray(lesson?.cac_bac) ? lesson.cac_bac : [];
  const before = auditSteps(steps, problemText, subject || "Toán");
  const result = { lesson, checked: true, fixed: false, timedOut: false, before, after: before, ms: 0 };
  if (before.ok || !steps.length || timeoutMs < 1500) {
    result.ms = Date.now() - started;
    return result;
  }
  const call = env.AI.run(model, { messages: buildFixMessages(problemText, steps, before), max_tokens: 450, temperature: 0.2 })
    .then((r) => extractJsonObject(r && typeof r === "object" && r.response !== undefined ? (typeof r.response === "string" ? r.response : JSON.stringify(r.response)) : r))
    .catch(() => null);
  const patch = await Promise.race([call, new Promise((res) => setTimeout(() => res("__timeout__"), timeoutMs))]);
  if (patch === "__timeout__") {
    result.timedOut = true;
    result.ms = Date.now() - started;
    return result;
  }
  if (!patch) {
    result.ms = Date.now() - started;
    return result;
  }
  const newSteps = applyPatch(steps, patch);
  const after = auditSteps(newSteps, problemText, subject || "Toán");
  const leak = checkAnswerLeak("p3_fix_steps_v3", { dap_an_cuoi_cho_me: lesson.dap_an_cuoi_cho_me, cac_bac: newSteps }, context);
  if (issueScore(after) < issueScore(before) && !leak.leaked) {
    result.lesson = { ...lesson, cac_bac: newSteps };
    result.fixed = true;
    result.after = after;
  }
  result.ms = Date.now() - started;
  return result;
}
