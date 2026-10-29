/**
 * ai-gateway-worker/src/safety.js
 * 
 * Quản trị An toàn AI, Minh bạch & Phản hồi Phụ huynh (Đợt 14 Phần C):
 * 1. POST /api/v1/ai-feedback: Phụ huynh báo câu hỏi AI chưa hợp lý
 * 2. GET /api/v1/safety/summary: Báo cáo số liệu an toàn tổng quan (tỷ lệ chặn, số lần can thiệp)
 * 3. GET /api/v1/safety/log: Nhật ký chi tiết guard_log & ai_feedback cho Admin / Phụ huynh
 * 4. POST /api/v1/safety/test-guard: Thử nghiệm kiểm tra rò rỉ đáp án trực tiếp
 * 5. POST /api/v1/admin/ai-feedback/:id/close: Đóng phản hồi
 */

import { checkAnswerLeak } from './guard.js';
import { authenticateSession } from './v1_routes.js';

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

/**
 * 1. Phụ huynh báo câu hỏi AI chưa hợp
 */
export async function handleAiFeedbackCreate(request, env, corsHeaders) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      familyId = 'anonymous',
      sessionId = 'sess_' + Date.now(),
      promptId = 'p3_explain',
      step = 1,
      reason = 'too_hard',
      note = '',
      questionText = '',
    } = body;

    const VALID_REASONS = ['leak', 'too_hard', 'wrong', 'teacher_way'];
    const safeReason = VALID_REASONS.includes(reason) ? reason : 'too_hard';
    const id = 'fb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

    if (env.DB) {
      await env.DB.prepare(`
        INSERT INTO ai_feedback (id, family_id, session_id, prompt_id, step, reason, note, question_text, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')
      `).bind(id, familyId, sessionId, promptId, step, safeReason, note || '', questionText || '').run();
    }

    return json({
      ok: true,
      id,
      message: 'Cảm ơn phụ huynh đã đóng góp! AI sẽ ghi nhận để đặt câu hỏi khéo léo hơn.',
    }, 200, corsHeaders);
  } catch (err) {
    console.error('handleAiFeedbackCreate error:', err);
    return json({ ok: false, error: err.message }, 500, corsHeaders);
  }
}

/**
 * 2. Báo cáo thống kê an toàn AI (Summary)
 */
export async function handleSafetySummary(request, env, corsHeaders) {
  try {
    // Đợt 15: chỉ số liệu của CHÍNH gia đình đang đăng nhập, theo khoảng ?range=7d|30d (mặc định 7 ngày)
    const session = env.DB ? await authenticateSession(request, env).catch(() => null) : null;
    const famId = session?.family_id || null;
    const rangeParam = new URL(request.url).searchParams.get('range') || '7d';
    const days = Math.max(1, Math.min(90, parseInt(rangeParam, 10) || 7));
    const since = `-${days} days`;
    let guardStats = { total: 0, fallbacks: 0, regenerated: 0, leaked: 0 };
    let feedbackStats = { total: 0, open: 0, byReason: {} };
    let workStats = { total: 0, self_fixed: 0 };
    let teachStats = { total: 0, self_level: 0 };

    if (env.DB && famId) {
      // Guard events
      const gRow = await env.DB.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN outcome = 'fallback' THEN 1 ELSE 0 END) as fallbacks,
          SUM(CASE WHEN outcome = 'regenerated' THEN 1 ELSE 0 END) as regenerated,
          SUM(CASE WHEN outcome = 'leaked' THEN 1 ELSE 0 END) as leaked
        FROM guard_log
        WHERE family_id = ? AND created_at >= datetime('now', ?)
      `).bind(famId, since).first().catch(() => null);

      if (gRow) {
        guardStats = {
          total: Number(gRow.total || 0),
          fallbacks: Number(gRow.fallbacks || 0),
          regenerated: Number(gRow.regenerated || 0),
          leaked: Number(gRow.leaked || 0),
        };
      }

      // Feedback stats
      const fbTotal = await env.DB.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_cnt
        FROM ai_feedback
        WHERE family_id = ? AND created_at >= datetime('now', ?)
      `).bind(famId, since).first().catch(() => null);

      const fbReasons = await env.DB.prepare(`
        SELECT reason, COUNT(*) as cnt FROM ai_feedback
        WHERE family_id = ? AND created_at >= datetime('now', ?) GROUP BY reason
      `).bind(famId, since).all().catch(() => ({ results: [] }));

      const byReason = {};
      (fbReasons?.results || []).forEach((r) => {
        byReason[r.reason] = Number(r.cnt);
      });

      feedbackStats = {
        total: Number(fbTotal?.total || 0),
        open: Number(fbTotal?.open_cnt || 0),
        byReason,
      };

      // Work checks stats
      const wRow = await env.DB.prepare(`
        SELECT COUNT(*) as total, SUM(CASE WHEN self_fixed = 1 THEN 1 ELSE 0 END) as fixed
        FROM work_checks
        WHERE family_id = ? AND created_at >= datetime('now', ?)
      `).bind(famId, since).first().catch(() => null);
      if (wRow) {
        workStats = { total: Number(wRow.total || 0), self_fixed: Number(wRow.fixed || 0) };
      }

      // Teach-backs stats
      const tRow = await env.DB.prepare(`
        SELECT COUNT(*) as total, SUM(CASE WHEN final_level = 'self' OR (final_level IS NULL AND ai_level = 'self') THEN 1 ELSE 0 END) as s_cnt
        FROM teach_backs
        WHERE family_id = ? AND created_at >= datetime('now', ?)
      `).bind(famId, since).first().catch(() => null);
      if (tRow) {
        teachStats = { total: Number(tRow.total || 0), self_level: Number(tRow.s_cnt || 0) };
      }
    }

      // Đợt 18 · Chặng 3: Thẻ An toàn AI (số thật từ guard_log và learning_events)
      // Prompt 32 mục 3: nối với sự kiện THẬT (guard_log, ai_calls, teach_backs, learning_events)
      const d18Row = famId ? await env.DB.prepare(`
        SELECT 
          SUM(CASE WHEN outcome = 'sua_phep_tinh' THEN 1 ELSE 0 END) as math_fixed,
          SUM(CASE WHEN outcome IN ('sua_bac', 'regenerated', 'fallback', 'chan_an_toan', 'sua_bac_chung_chung') THEN 1 ELSE 0 END) as steps_guarded,
          SUM(CASE WHEN outcome = 'xin_dap_an' THEN 1 ELSE 0 END) as answer_requests
        FROM guard_log
        WHERE family_id = ? AND created_at >= datetime('now', ?)
      `).bind(famId, since).first().catch(() => null) : null;

      // Câu nhỏ hơn: mỗi lần /api/v1/ai/micro-step trả thành công
      const microRow = famId ? await env.DB.prepare(`
        SELECT COUNT(*) as cnt FROM ai_calls
        WHERE family_id = ? AND endpoint = '/api/v1/ai/micro-step' AND ok = 1 AND created_at >= datetime('now', ?)
      `).bind(famId, since).first().catch(() => null) : null;

      // Gấu nghe con: trả lời bằng giọng (learning_events.voice_verdict) + lượt giảng lại (teach_backs)
      const d18Events = famId ? await env.DB.prepare(`
        SELECT 
          SUM(COALESCE(micro_steps, 0)) as micro_steps,
          SUM(CASE WHEN voice_verdict IS NOT NULL THEN 1 ELSE 0 END) as voice_count
        FROM learning_events
        WHERE family_id = ? AND created_at >= datetime('now', ?)
      `).bind(famId, since).first().catch(() => null) : null;

      var dot18Safety = {
        phep_tinh_sai_da_bat: Number(d18Row?.math_fixed || 0),
        bac_bo_chan_sua_lai: Number(d18Row?.steps_guarded || 0),
        cau_nho_hon_da_tao: Math.max(Number(microRow?.cnt || 0), Number(d18Events?.micro_steps || 0)),
        so_lan_gau_nghe_con: Number(d18Events?.voice_count || 0) + Number(teachStats.total || 0),
        xin_dap_an_da_chan: Number(d18Row?.answer_requests || 0),
      };

    const totalGuardActions = guardStats.fallbacks + guardStats.regenerated;
    const safeRate = guardStats.total > 0
      ? (((guardStats.total - guardStats.leaked) / guardStats.total) * 100).toFixed(1)
      : '100.0';

    return json({
      ok: true,
      scope: famId ? 'family' : 'none',
      range_days: days,
      safe_rate_percent: Number(safeRate),
      total_guard_interventions: totalGuardActions,
      guard_events: guardStats,
      feedback: feedbackStats,
      work_checks: workStats,
      teach_backs: teachStats,
      dot18_safety: typeof dot18Safety !== 'undefined' ? dot18Safety : { phep_tinh_sai_da_bat: 0, bac_bo_chan_sua_lai: 0, cau_nho_hon_da_tao: 0, so_lan_gau_nghe_con: 0, xin_dap_an_da_chan: 0 },
      four_layer_safety: [
        { layer: 1, name: 'Prompt Sư phạm Socratic', status: 'active', desc: 'Không giải bài hộ, chia 3 bậc gợi ý' },
        { layer: 2, name: 'Bộ chặn rò rỉ đáp án (Guard Module)', status: 'active', desc: 'Kiểm tra số chữ/số nguyên, thay thế tự động nếu lộ' },
        { layer: 3, name: 'Máy tính độc lập & Khử ảo giác', status: 'active', desc: 'Shunting-yard parser & Anti-hallucination quote checker' },
        { layer: 4, name: 'Quyền chốt của Phụ huynh', status: 'active', desc: 'Mẹ luôn là người duyệt & chốt mức hiểu bài cuối cùng' },
      ],
    }, 200, corsHeaders);
  } catch (err) {
    console.error('handleSafetySummary error:', err);
    return json({ ok: false, error: err.message }, 500, corsHeaders);
  }
}

/**
 * 3. Nhật ký sự kiện bảo vệ & phản hồi phụ huynh (Log)
 */
export async function handleSafetyLog(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(100, Math.max(5, parseInt(url.searchParams.get('limit') || '50', 10)));
    const familyId = url.searchParams.get('familyId');

    let guardLogs = [];
    let feedbacks = [];

    if (env.DB) {
      if (familyId) {
        const gRes = await env.DB.prepare(`
          SELECT id, family_id, session_id, prompt_id, field, before_text, after_text, outcome, created_at
          FROM guard_log WHERE family_id = ? ORDER BY created_at DESC LIMIT ?
        `).bind(familyId, limit).all().catch(() => ({ results: [] }));
        guardLogs = gRes.results || [];

        const fRes = await env.DB.prepare(`
          SELECT id, family_id, session_id, prompt_id, step, reason, note, question_text, status, created_at, closed_by
          FROM ai_feedback WHERE family_id = ? ORDER BY created_at DESC LIMIT ?
        `).bind(familyId, limit).all().catch(() => ({ results: [] }));
        feedbacks = fRes.results || [];
      } else {
        const gRes = await env.DB.prepare(`
          SELECT id, family_id, session_id, prompt_id, field, before_text, after_text, outcome, created_at
          FROM guard_log ORDER BY created_at DESC LIMIT ?
        `).bind(limit).all().catch(() => ({ results: [] }));
        guardLogs = gRes.results || [];

        const fRes = await env.DB.prepare(`
          SELECT id, family_id, session_id, prompt_id, step, reason, note, question_text, status, created_at, closed_by
          FROM ai_feedback ORDER BY created_at DESC LIMIT ?
        `).bind(limit).all().catch(() => ({ results: [] }));
        feedbacks = fRes.results || [];
      }
    }

    return json({
      ok: true,
      guard_logs: guardLogs,
      feedbacks: feedbacks,
    }, 200, corsHeaders);
  } catch (err) {
    console.error('handleSafetyLog error:', err);
    return json({ ok: false, error: err.message }, 500, corsHeaders);
  }
}

/**
 * 4. Thử nghiệm kiểm tra Guard (Test Tool cho Admin)
 */
export async function handleSafetyTestGuard(request, env, corsHeaders) {
  try {
    const body = await request.json().catch(() => ({}));
    const { promptId = 'p3_explain', data = {}, context = {} } = body;
    // Chuẩn hoá data nếu truyền ở dạng phẳng (Prompt 23 - Chặng 4.1)
    if (!data.cac_bac && !data.steps) {
      const qText = data.cau_hoi || (typeof data.cau_hoi_cho_con === 'string' ? data.cau_hoi_cho_con : data.cau_hoi_cho_con?.muc_1) || data.cau_hoi_them || data.text || '';
      data.cac_bac = [{
        cau_hoi: qText,
        dap_an_cho_me: data.dap_an_cuoi_cho_me || data.dap_an_cho_me || '',
        goi_y: { muc_1_do_vat: '', muc_2_hinh_ve: '' }
      }];
    }
    const result = checkAnswerLeak(promptId, data, context);
    return json({ ok: true, result }, 200, corsHeaders);
  } catch (err) {
    return json({ ok: false, error: err.message }, 500, corsHeaders);
  }
}

/**
 * 5. Admin đóng phản hồi
 */
export async function handleAiFeedbackClose(request, env, id, corsHeaders) {
  try {
    if (env.DB) {
      await env.DB.prepare(`
        UPDATE ai_feedback SET status = 'closed', closed_by = 'admin' WHERE id = ?
      `).bind(id).run();
    }
    return json({ ok: true, id, status: 'closed' }, 200, corsHeaders);
  } catch (err) {
    return json({ ok: false, error: err.message }, 500, corsHeaders);
  }
}
