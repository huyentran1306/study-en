/**
 * dot15_ai.js · Đợt 15 · Trang AI & nội dung của admin
 * (Prompt Studio, Router sư phạm, Phạm vi đề & ảnh)
 *
 * Gắn vào index.js (chưa gắn, người tích hợp làm):
 *   import { handle as handleDot15Ai } from "./dot15_ai.js";
 *   // trong khối /api/v1/admin/*, sau khi đã có adminSession:
 *   const r = await handleDot15Ai(request, env, ctx, pathname, method, corsHeaders, adminSession);
 *   if (r) return r;
 *
 * Endpoint (mọi đường đều cần phiên admin hợp lệ, trả JSON):
 *   GET  /api/v1/admin/ai/router-stats?days=30
 *        → { ok, days, totalSessions, unassigned, rules: [{ ruleId, sessions, rated, selfSolved }] }
 *          Đếm từ learning_sessions.method_rule_id; tỉ lệ con tự làm = teach_back_rating='self' / số buổi có đánh giá.
 *   GET  /api/v1/admin/ai/prompt-versions?promptId=p3_explain&limit=20
 *        → { ok, versions: [{ id, prompt_id, version, status, note, chars, actor_email, created_at }] }
 *   GET  /api/v1/admin/ai/prompt-versions/:id  → { ok, version: {..., template} }
 *   POST /api/v1/admin/ai/prompt-versions { promptId, template, status:'draft'|'published', note }
 *        → { ok, version } · ghi audit_log. Vai trò editor trở lên.
 *   GET  /api/v1/admin/ai/scope-stats?days=30
 *        → { ok, byCategory: [{category, cnt, overridden_cnt}], recentEvents: [...] } (thay dần cho /db/query)
 *
 * Không gọi AI, chỉ đọc/ghi D1. Mỗi request tối đa 3 truy vấn (gói Free: 50/lần gọi).
 */

function json(data, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

const EDITOR_ROLES = new Set(["superadmin", "admin", "editor"]);
const PROMPT_ID_RE = /^[a-z0-9_]{2,48}$/;

async function ensurePromptVersionsTable(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS prompt_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prompt_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('draft','published')),
      template TEXT NOT NULL,
      note TEXT NULL,
      chars INTEGER NOT NULL DEFAULT 0,
      actor_id TEXT NULL,
      actor_email TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_prompt_versions_pid ON prompt_versions(prompt_id, id)"
  ).run();
}

function isMissingTable(err) {
  return /no such table/i.test(String(err && err.message ? err.message : err));
}

function clampInt(v, min, max, dflt) {
  const n = parseInt(v, 10);
  if (!Number.isFinite(n)) return dflt;
  return Math.max(min, Math.min(max, n));
}

export async function handle(request, env, ctx, pathname, method, corsHeaders = {}, adminSession = null) {
  if (!pathname || !pathname.startsWith("/api/v1/admin/ai/")) return null;
  if (method === "OPTIONS") return null;

  if (!adminSession) {
    return json({ error: { code: "UNAUTHORIZED", message: "Cần đăng nhập quản trị" } }, 401, corsHeaders);
  }
  if (adminSession.locked_at) {
    return json({ error: { code: "SESSION_LOCKED", message: "Phiên quản trị đang khoá, nhập PIN để tiếp tục" } }, 423, corsHeaders);
  }
  if (!env || !env.DB) {
    return json({ error: { code: "NO_DB", message: "Chưa gắn cơ sở dữ liệu D1" } }, 500, corsHeaders);
  }

  const url = new URL(request.url);

  // ------------------------------------------------------------------
  // 1. Router sư phạm: mức dùng và tỉ lệ con tự làm theo luật
  // ------------------------------------------------------------------
  if (pathname === "/api/v1/admin/ai/router-stats" && method === "GET") {
    const days = clampInt(url.searchParams.get("days"), 1, 365, 30);
    const since = new Date(Date.now() - days * 86400000).toISOString();
    try {
      const [byRule, total] = await env.DB.batch([
        env.DB.prepare(`
          SELECT method_rule_id AS ruleId,
                 COUNT(*) AS sessions,
                 SUM(CASE WHEN teach_back_rating IS NOT NULL THEN 1 ELSE 0 END) AS rated,
                 SUM(CASE WHEN teach_back_rating = 'self' THEN 1 ELSE 0 END) AS selfSolved
          FROM learning_sessions
          WHERE started_at >= ? AND method_rule_id IS NOT NULL AND method_rule_id <> ''
          GROUP BY method_rule_id
        `).bind(since),
        env.DB.prepare(`
          SELECT COUNT(*) AS total,
                 SUM(CASE WHEN method_rule_id IS NULL OR method_rule_id = '' THEN 1 ELSE 0 END) AS unassigned
          FROM learning_sessions
          WHERE started_at >= ?
        `).bind(since),
      ]);
      const t = (total.results && total.results[0]) || {};
      return json(
        {
          ok: true,
          days,
          since,
          totalSessions: Number(t.total || 0),
          unassigned: Number(t.unassigned || 0),
          rules: (byRule.results || []).map((r) => ({
            ruleId: r.ruleId,
            sessions: Number(r.sessions || 0),
            rated: Number(r.rated || 0),
            selfSolved: Number(r.selfSolved || 0),
          })),
        },
        200,
        corsHeaders
      );
    } catch (err) {
      if (isMissingTable(err)) {
        return json({ ok: true, days, since, totalSessions: 0, unassigned: 0, rules: [] }, 200, corsHeaders);
      }
      return json({ error: { code: "DB_ERROR", message: err.message } }, 500, corsHeaders);
    }
  }

  // ------------------------------------------------------------------
  // 2. Prompt Studio: lịch sử phiên bản theo từng prompt
  // ------------------------------------------------------------------
  if (pathname === "/api/v1/admin/ai/prompt-versions" && method === "GET") {
    const promptId = String(url.searchParams.get("promptId") || "").trim();
    const limit = clampInt(url.searchParams.get("limit"), 1, 50, 20);
    if (promptId && !PROMPT_ID_RE.test(promptId)) {
      return json({ error: { code: "BAD_PROMPT_ID", message: "Mã prompt không hợp lệ" } }, 400, corsHeaders);
    }
    try {
      await ensurePromptVersionsTable(env);
      const stmt = promptId
        ? env.DB.prepare(`
            SELECT id, prompt_id, version, status, note, chars, actor_email, created_at
            FROM prompt_versions WHERE prompt_id = ? ORDER BY id DESC LIMIT ?
          `).bind(promptId, limit)
        : env.DB.prepare(`
            SELECT p.id, p.prompt_id, p.version, p.status, p.note, p.chars, p.actor_email, p.created_at
            FROM prompt_versions p
            JOIN (SELECT prompt_id, MAX(id) AS mid FROM prompt_versions GROUP BY prompt_id) m ON m.mid = p.id
            ORDER BY p.prompt_id
          `);
      const res = await stmt.all();
      return json({ ok: true, versions: res.results || [] }, 200, corsHeaders);
    } catch (err) {
      if (isMissingTable(err)) return json({ ok: true, versions: [] }, 200, corsHeaders);
      return json({ error: { code: "DB_ERROR", message: err.message } }, 500, corsHeaders);
    }
  }

  const verMatch = pathname.match(/^\/api\/v1\/admin\/ai\/prompt-versions\/(\d+)$/);
  if (verMatch && method === "GET") {
    try {
      await ensurePromptVersionsTable(env);
      const row = await env.DB.prepare(`
        SELECT id, prompt_id, version, status, template, note, chars, actor_email, created_at
        FROM prompt_versions WHERE id = ?
      `).bind(parseInt(verMatch[1], 10)).first();
      if (!row) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy phiên bản" } }, 404, corsHeaders);
      return json({ ok: true, version: row }, 200, corsHeaders);
    } catch (err) {
      if (isMissingTable(err)) return json({ error: { code: "NOT_FOUND", message: "Chưa có phiên bản nào" } }, 404, corsHeaders);
      return json({ error: { code: "DB_ERROR", message: err.message } }, 500, corsHeaders);
    }
  }

  if (pathname === "/api/v1/admin/ai/prompt-versions" && method === "POST") {
    if (!EDITOR_ROLES.has(String(adminSession.role || ""))) {
      return json({ error: { code: "FORBIDDEN", message: "Cần vai trò biên tập trở lên để lưu prompt" } }, 403, corsHeaders);
    }
    const body = await request.json().catch(() => ({}));
    const promptId = String(body.promptId || "").trim();
    const template = typeof body.template === "string" ? body.template : "";
    const status = body.status === "published" ? "published" : "draft";
    const note = String(body.note || "").slice(0, 200);
    if (!PROMPT_ID_RE.test(promptId)) {
      return json({ error: { code: "BAD_PROMPT_ID", message: "Mã prompt không hợp lệ" } }, 400, corsHeaders);
    }
    if (!template.trim()) {
      return json({ error: { code: "EMPTY", message: "Nội dung prompt đang trống" } }, 400, corsHeaders);
    }
    if (template.length > 12000) {
      return json({ error: { code: "TOO_LONG", message: "Prompt dài quá 12.000 ký tự" } }, 400, corsHeaders);
    }
    try {
      await ensurePromptVersionsTable(env);
      const last = await env.DB.prepare(
        "SELECT MAX(version) AS v FROM prompt_versions WHERE prompt_id = ?"
      ).bind(promptId).first();
      const version = Number((last && last.v) || 0) + 1;
      const ip = request.headers.get("CF-Connecting-IP") || "";
      const [ins] = await env.DB.batch([
        env.DB.prepare(`
          INSERT INTO prompt_versions (prompt_id, version, status, template, note, chars, actor_id, actor_email, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(promptId, version, status, template, note || null, template.length, adminSession.member_id || null, adminSession.email || null),
        env.DB.prepare(`
          INSERT INTO audit_log (actor_type, actor_id, action, target_type, target_id, ip, created_at)
          VALUES ('admin', ?, ?, 'prompt', ?, ?, CURRENT_TIMESTAMP)
        `).bind(adminSession.member_id || "", status === "published" ? "PUBLISH_PROMPT" : "SAVE_PROMPT_DRAFT", `${promptId}@v${version}`, ip),
      ]);
      const id = ins && ins.meta ? ins.meta.last_row_id : null;
      return json(
        {
          ok: true,
          version: {
            id,
            prompt_id: promptId,
            version,
            status,
            note: note || null,
            chars: template.length,
            actor_email: adminSession.email || null,
            created_at: new Date().toISOString(),
          },
        },
        201,
        corsHeaders
      );
    } catch (err) {
      return json({ error: { code: "DB_ERROR", message: err.message } }, 500, corsHeaders);
    }
  }

  // ------------------------------------------------------------------
  // 3. Phạm vi đề & ảnh: nhật ký 30 ngày (đọc scope_events)
  // ------------------------------------------------------------------
  if (pathname === "/api/v1/admin/ai/scope-stats" && method === "GET") {
    const days = clampInt(url.searchParams.get("days"), 1, 365, 30);
    const sinceMs = Date.now() - days * 86400000;
    try {
      const [byCat, recent] = await env.DB.batch([
        env.DB.prepare(`
          SELECT category, COUNT(*) AS cnt, SUM(overridden) AS overridden_cnt
          FROM scope_events WHERE created_at >= ? GROUP BY category
        `).bind(sinceMs),
        env.DB.prepare(`
          SELECT id, source, category, action, confidence, reason, grade_guess, subject_guess, child_grade, overridden, created_at
          FROM scope_events ORDER BY created_at DESC LIMIT 30
        `),
      ]);
      return json({ ok: true, days, byCategory: byCat.results || [], recentEvents: recent.results || [] }, 200, corsHeaders);
    } catch (err) {
      if (isMissingTable(err)) return json({ ok: true, days, byCategory: [], recentEvents: [] }, 200, corsHeaders);
      return json({ error: { code: "DB_ERROR", message: err.message } }, 500, corsHeaders);
    }
  }

  return null;
}
