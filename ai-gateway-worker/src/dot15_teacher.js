/**
 * Đợt 15 · Chặng 5: số liệu "bậc hay vướng" cho tab Kết quả của cổng giáo viên.
 *
 *   GET /api/v1/teacher/assignments/:id/step-stats
 *
 * Chỉ trả số đếm tổng hợp theo bậc (không tên trẻ, không bài làm, không ảnh).
 * Nguồn 1: session_events loại "con bí / mở gợi ý" có ghi bậc (step).
 * Nguồn 2 (khi chưa có sự kiện): assignment_results.hint_level_max (bậc gợi ý cao nhất mẹ phải mở).
 * Không gọi AI, chỉ 2 đến 3 câu SELECT nhỏ trên D1.
 *
 * Cách nối (chủ dự án làm, trong v1_routes.js trước dòng gọi handleTeacherRoute):
 *   import { handle as handleDot15Teacher } from "./dot15_teacher.js";
 *   const d15 = await handleDot15Teacher(request, env, ctx, pathname, method, corsHeaders);
 *   if (d15) return d15;
 */
import { authenticateTeacher } from "./teacher_routes.js";

const STUCK_EVENT_TYPES = ["stuck", "step_stuck", "step_hint", "hint", "con_bi"];

function json(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function stepLabelsFromLesson(raw) {
  try {
    const lesson = typeof raw === "string" ? JSON.parse(raw) : raw;
    const steps = Array.isArray(lesson?.steps) ? lesson.steps : [];
    const map = {};
    for (const s of steps) {
      const n = Number(s.stepNumber ?? s.step ?? s.index);
      const label = String(s.title || s.label || s.name || "").trim();
      if (n && label) map[n] = label.slice(0, 40);
    }
    return map;
  } catch {
    return {};
  }
}

export async function handle(request, env, ctx, pathname, method, corsHeaders) {
  const m = pathname.match(/^\/api\/v1\/teacher\/assignments\/([^/]+)\/step-stats$/);
  if (!m || method !== "GET") return null;

  const session = await authenticateTeacher(request, env);
  if (!session) {
    return json({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập tài khoản giáo viên" } }, 401, corsHeaders);
  }
  if (session.status && session.status !== "approved") {
    return json({ error: { code: "FORBIDDEN", message: "Tài khoản giáo viên chưa được duyệt" } }, 403, corsHeaders);
  }

  const assignmentId = decodeURIComponent(m[1]).trim();
  const asg = await env.DB.prepare(`
    SELECT a.id, a.title FROM assignments a
    JOIN classes c ON a.class_id = c.id
    WHERE a.id = ? AND c.teacher_id = ?
  `).bind(assignmentId, session.teacher_id).first();
  if (!asg) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy bài tập" } }, 404, corsHeaders);

  // Nhãn bậc lấy từ bài giảng đã duyệt (nếu bài giảng có tiêu đề từng bậc)
  const itemRows = (await env.DB.prepare(
    "SELECT id, position, ai_lesson_json FROM assignment_items WHERE assignment_id = ? ORDER BY position ASC"
  ).bind(assignmentId).all()).results || [];
  const labelsByPos = {};
  for (const it of itemRows) labelsByPos[it.position] = stepLabelsFromLesson(it.ai_lesson_json);

  let rows = [];
  let source = "events";
  try {
    const placeholders = STUCK_EVENT_TYPES.map(() => "?").join(",");
    rows = (await env.DB.prepare(`
      SELECT ai.position AS position, se.step AS step, COUNT(*) AS count
      FROM session_events se
      JOIN learning_sessions ls ON se.session_id = ls.id
      JOIN assignment_items ai ON ls.assignment_item_id = ai.id
      WHERE ai.assignment_id = ? AND se.type IN (${placeholders}) AND se.step IS NOT NULL AND se.step > 0
      GROUP BY ai.position, se.step
    `).bind(assignmentId, ...STUCK_EVENT_TYPES).all()).results || [];
  } catch {
    rows = [];
  }

  if (rows.length === 0) {
    source = "hint_level";
    try {
      rows = (await env.DB.prepare(`
        SELECT ai.position AS position, ar.hint_level_max AS step, COUNT(*) AS count
        FROM assignment_results ar
        JOIN assignment_items ai ON ar.item_id = ai.id
        WHERE ai.assignment_id = ? AND ar.hint_level_max IS NOT NULL AND ar.hint_level_max > 0
        GROUP BY ai.position, ar.hint_level_max
      `).bind(assignmentId).all()).results || [];
    } catch {
      rows = [];
    }
  }

  const total = {};
  const perItem = {};
  for (const r of rows) {
    const step = Number(r.step);
    const pos = Number(r.position);
    const c = Number(r.count) || 0;
    if (!step || !c) continue;
    total[step] = (total[step] || 0) + c;
    perItem[pos] = perItem[pos] || {};
    perItem[pos][step] = (perItem[pos][step] || 0) + c;
  }

  const toList = (obj, labels = {}) => {
    const keys = Object.keys(obj).map(Number);
    const max = Math.max(4, ...keys, 0);
    const out = [];
    for (let s = 1; s <= max; s++) out.push({ step: s, label: labels[s] || null, count: obj[s] || 0 });
    return out;
  };

  const items = itemRows.map((it) => ({
    position: it.position,
    steps: toList(perItem[it.position] || {}, labelsByPos[it.position] || {}),
  }));
  const singleLabels = itemRows.length === 1 ? (labelsByPos[itemRows[0].position] || {}) : {};

  return json({
    ok: true,
    assignmentId,
    title: asg.title,
    source: rows.length ? source : "none",
    steps: rows.length ? toList(total, singleLabels) : [],
    items: rows.length ? items : [],
  }, 200, corsHeaders);
}
