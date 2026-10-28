/**
 * Đợt 15 · Chặng 3 · Nhóm trang "Hệ thống" của admin
 * Gọi: const r = await handle(request, env, ctx, pathname, method, corsHeaders, adminSession); if (r) return r;
 *
 *  POST /api/v1/admin/sql              (superadmin) chỉ MỘT câu SELECT / WITH…SELECT, tự thêm LIMIT 200, chờ tối đa 5 giây, ghi audit_log
 *  GET  /api/v1/admin/infra-usage      hạn mức thật: neuron Workers AI hôm nay (ai_usage), lượt gọi AI (ai_calls), dung lượng D1, lỗi phía người dùng
 *  GET  /api/v1/admin/report-shares    số link báo cáo đã chia sẻ (report_shares), null nếu chưa có bảng
 *  GET  /api/v1/admin/zalo-status      trạng thái 4 bước kết nối Zalo OA (chỉ trả có/không, không trả khoá)
 *  GET  /api/v1/admin/audit-logs2      nhật ký thao tác có lọc: actor, action, from, to, q
 *  GET  /api/v1/admin/safety-summary   số liệu an toàn toàn hệ thống từ guard_log / ai_feedback / work_checks (null nếu chưa có bảng)
 *  GET  /api/v1/admin/model-config     đọc tham số mô hình (dùng chung khoá prompt_studio:ai_config)
 *  PUT  /api/v1/admin/model-config     (superadmin, editor) lưu tham số mô hình, ghi audit_log trước/sau
 *  POST /api/v1/admin/auth/auto-lock   quản trị viên tự đặt số phút tự khoá màn hình của mình
 *
 * Không xoá, không gọi AI. Mọi số không đọc được trả null để giao diện hiện "·".
 */
import { authenticateAdmin } from "./v1_routes.js";

const PATHS = new Set([
  "/api/v1/admin/sql",
  "/api/v1/admin/infra-usage",
  "/api/v1/admin/report-shares",
  "/api/v1/admin/zalo-status",
  "/api/v1/admin/audit-logs2",
  "/api/v1/admin/safety-summary",
  "/api/v1/admin/model-config",
  "/api/v1/admin/auth/auto-lock",
]);

const AI_NEURON_DAILY_LIMIT = 10000; // Workers AI gói Free
const D1_SIZE_LIMIT_BYTES = 500 * 1024 * 1024; // 500 MB mỗi database (gói Free)
const SQL_MAX_ROWS = 200;
const SQL_TIMEOUT_MS = 5000;

function json(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...(corsHeaders || {}) },
  });
}
function err(code, message, status, corsHeaders) {
  return json({ ok: false, error: { code, message } }, status, corsHeaders);
}
function hasRole(session, roles) {
  return Boolean(session && roles.includes(session.role));
}
async function tableExists(db, name) {
  try {
    const r = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").bind(name).first();
    return Boolean(r);
  } catch (e) {
    return false;
  }
}
async function writeAudit(env, request, session, action, targetType, targetId, details) {
  const ip = request.headers.get("CF-Connecting-IP") || null;
  const detailsStr = details ? JSON.stringify(details).slice(0, 4000) : null;
  try {
    await env.DB.prepare(
      "INSERT INTO audit_log (actor_type, actor_id, action, target_type, target_id, details_json, ip, created_at) VALUES ('admin', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)"
    ).bind(session?.member_id || "unknown", action, targetType, targetId, detailsStr, ip).run();
  } catch (e) {
    // Bảng cũ có thể chưa có cột details_json
    try {
      await env.DB.prepare(
        "INSERT INTO audit_log (actor_type, actor_id, action, target_type, target_id, ip, created_at) VALUES ('admin', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)"
      ).bind(session?.member_id || "unknown", action, targetType, targetId, ip).run();
    } catch (e2) {
      console.warn("dot15 audit_log error:", e2?.message);
    }
  }
}

/* ---------------- Kiểm tra SQL chỉ đọc ---------------- */
/** Bỏ chú thích, thay nội dung chuỗi bằng khoảng trắng để kiểm từ khoá; trả { code, masked } */
export function stripSql(sql) {
  let code = "";
  let masked = "";
  let i = 0;
  const s = String(sql || "");
  while (i < s.length) {
    const c = s[i];
    const n = s[i + 1];
    if (c === "-" && n === "-") {
      while (i < s.length && s[i] !== "\n") i++;
      code += " ";
      masked += " ";
      continue;
    }
    if (c === "/" && n === "*") {
      const end = s.indexOf("*/", i + 2);
      i = end === -1 ? s.length : end + 2;
      code += " ";
      masked += " ";
      continue;
    }
    if (c === "'" || c === '"' || c === "`" || c === "[") {
      const close = c === "[" ? "]" : c;
      let j = i + 1;
      while (j < s.length) {
        if (s[j] === close) {
          if (close !== "]" && s[j + 1] === close) {
            j += 2;
            continue;
          }
          break;
        }
        j++;
      }
      const piece = s.slice(i, Math.min(j + 1, s.length));
      code += piece;
      // tên cột trong "..." / [...] / `...` vẫn giữ để kiểm; chỉ che chuỗi '...'
      masked += c === "'" ? "'" + " ".repeat(Math.max(0, piece.length - 2)) + (j < s.length ? "'" : "") : piece;
      i = j + 1;
      continue;
    }
    code += c;
    masked += c;
    i++;
  }
  return { code, masked };
}

const FORBIDDEN = [
  "PRAGMA", "ATTACH", "DETACH", "INSERT", "UPDATE", "DELETE", "CREATE", "DROP", "ALTER", "VACUUM",
  "REINDEX", "ANALYZE", "BEGIN", "COMMIT", "ROLLBACK", "SAVEPOINT", "RELEASE", "TRUNCATE", "GRANT", "LOAD_EXTENSION",
];

/** Trả { ok, sql, limited } hoặc { ok:false, message } */
export function validateReadOnlySql(input) {
  const raw = String(input || "");
  if (!raw.trim()) return { ok: false, message: "Chưa nhập câu lệnh" };
  if (raw.length > 5000) return { ok: false, message: "Câu lệnh quá dài (tối đa 5.000 ký tự)" };
  const { code, masked } = stripSql(raw);
  let body = code.trim();
  let m = masked.trim();
  // bỏ dấu ; ở cuối (chỉ một câu)
  while (m.endsWith(";")) {
    m = m.slice(0, -1).trim();
    body = body.replace(/;\s*$/, "").trim();
  }
  if (!m) return { ok: false, message: "Chưa nhập câu lệnh" };
  if (m.includes(";")) return { ok: false, message: "Chỉ được chạy một câu lệnh (có dấu ; ở giữa)" };
  const upper = m.toUpperCase();
  if (!/^(SELECT|WITH)\b/.test(upper)) return { ok: false, message: "Chỉ nhận câu SELECT (hoặc WITH … SELECT)" };
  for (const w of FORBIDDEN) {
    if (new RegExp(`\\b${w}\\b`).test(upper)) return { ok: false, message: `Không được dùng ${w} trong SQL Studio` };
  }
  if (/\bREPLACE\s+INTO\b/.test(upper)) return { ok: false, message: "Không được dùng REPLACE INTO" };
  if (/\bWITH\b/.test(upper.slice(0, 5)) && !/\bSELECT\b/.test(upper)) return { ok: false, message: "WITH phải kết thúc bằng SELECT" };
  let limited = false;
  // LIMIT phải nằm ở cấp ngoài cùng (không tính LIMIT trong truy vấn con)
  let depth = 0;
  let top = "";
  for (const ch of upper) {
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    else if (depth === 0) top += ch;
    if (ch === "(" || ch === ")") top += " ";
  }
  if (!/\bLIMIT\b/.test(top)) {
    body = `${body}\nLIMIT ${SQL_MAX_ROWS}`;
    limited = true;
  }
  return { ok: true, sql: body, limited };
}

const SECRET_COLS = /^(pass_hash|pin_hash|salt|pin_salt|pass_salt|token_hash|token|secret|api_key)$/i;

async function handleSql(request, env, corsHeaders, session) {
  if (!hasRole(session, ["superadmin"])) return err("FORBIDDEN", "Chỉ superadmin được dùng SQL Studio", 403, corsHeaders);
  const body = await request.json().catch(() => ({}));
  const q = typeof body.sql === "string" ? body.sql : typeof body.query === "string" ? body.query : "";
  const v = validateReadOnlySql(q);
  if (!v.ok) {
    await writeAudit(env, request, session, "SQL_REJECTED", "d1", null, { sql: q.slice(0, 500), reason: v.message });
    return err("SQL_NOT_ALLOWED", v.message, 400, corsHeaders);
  }
  const t0 = Date.now();
  let timer;
  try {
    const run = env.DB.prepare(v.sql).all();
    const timeout = new Promise((_, rej) => {
      timer = setTimeout(() => rej(new Error("TIMEOUT")), SQL_TIMEOUT_MS);
    });
    const res = await Promise.race([run, timeout]);
    clearTimeout(timer);
    const ms = Date.now() - t0;
    const all = Array.isArray(res?.results) ? res.results : [];
    const truncated = all.length > SQL_MAX_ROWS;
    const rows = all.slice(0, SQL_MAX_ROWS).map((r) => {
      const o = {};
      for (const k of Object.keys(r || {})) o[k] = SECRET_COLS.test(k) ? "[đã ẩn]" : r[k];
      return o;
    });
    const columns = rows.length ? Object.keys(rows[0]) : [];
    await writeAudit(env, request, session, "SQL_QUERY", "d1", null, { sql: q.slice(0, 500), rows: rows.length, ms });
    return json({ ok: true, columns, rows, ms, limited: v.limited, truncated, maxRows: SQL_MAX_ROWS }, 200, corsHeaders);
  } catch (e) {
    clearTimeout(timer);
    const ms = Date.now() - t0;
    const isTimeout = e?.message === "TIMEOUT";
    await writeAudit(env, request, session, isTimeout ? "SQL_TIMEOUT" : "SQL_ERROR", "d1", null, { sql: q.slice(0, 500), ms });
    return err(isTimeout ? "SQL_TIMEOUT" : "SQL_ERROR", isTimeout ? `Quá ${SQL_TIMEOUT_MS / 1000} giây, đã dừng chờ` : String(e?.message || "Lỗi D1").slice(0, 300), isTimeout ? 504 : 400, corsHeaders);
  }
}

/* ---------------- Hạ tầng ---------------- */
async function handleInfra(env, corsHeaders) {
  const today = new Date().toISOString().slice(0, 10);
  const out = {
    ok: true,
    day: today,
    aiNeurons: null, // { used, limit }
    aiCalls: null, // { total, failed }
    d1Size: null, // { bytes, limit }
    clientErrors: null, // { total, last24h }
    workerRequests: null, // chưa có bộ đếm thật
    d1RowsWritten: null, // chưa có bộ đếm thật
    checkedAt: new Date().toISOString(),
  };
  try {
    const sizeRes = await env.DB.prepare("SELECT 1 AS ok").run();
    const bytes = Number(sizeRes?.meta?.size_after);
    if (Number.isFinite(bytes) && bytes > 0) out.d1Size = { bytes, limit: D1_SIZE_LIMIT_BYTES };
  } catch (e) {}
  if (await tableExists(env.DB, "ai_usage")) {
    try {
      const r = await env.DB.prepare("SELECT SUM(neurons) AS n, SUM(calls) AS c FROM ai_usage WHERE day = ?").bind(today).first();
      out.aiNeurons = { used: Math.round(Number(r?.n || 0)), limit: AI_NEURON_DAILY_LIMIT, calls: Number(r?.c || 0) };
    } catch (e) {}
  }
  if (await tableExists(env.DB, "ai_calls")) {
    try {
      const r = await env.DB.prepare(
        "SELECT COUNT(*) AS total, SUM(CASE WHEN ok = 0 THEN 1 ELSE 0 END) AS failed FROM ai_calls WHERE created_at >= date('now')"
      ).first();
      out.aiCalls = { total: Number(r?.total || 0), failed: Number(r?.failed || 0) };
    } catch (e) {}
  }
  if (await tableExists(env.DB, "work_checks")) {
    try {
      const r = await env.DB.prepare(
        "SELECT COUNT(*) AS total, SUM(CASE WHEN lines_json IS NOT NULL AND lines_json != '[]' THEN 1 ELSE 0 END) AS ok_count FROM work_checks"
      ).first();
      const tot = Number(r?.total || 0);
      const ok = Number(r?.ok_count || 0);
      const rate = tot > 0 ? Math.round((ok / tot) * 100) : 100;
      out.workChecks = { total: tot, ok: ok, rate };
    } catch (e) {}
  }
  try {
    const row = await env.DB.prepare("SELECT value FROM _kv_store WHERE key = 'app_client_errors'").first();
    if (row) {
      let list = [];
      try {
        list = JSON.parse(row.value || "[]");
      } catch (e) {}
      if (Array.isArray(list)) {
        const since = Date.now() - 24 * 3600 * 1000;
        const last24h = list.filter((x) => new Date(x?.last_seen || x?.ts || x?.created_at || 0).getTime() >= since).length;
        out.clientErrors = { total: list.length, last24h };
      }
    } else {
      out.clientErrors = { total: 0, last24h: 0 };
    }
  } catch (e) {}
  return json(out, 200, corsHeaders);
}

async function handleReportShares(env, corsHeaders) {
  if (!(await tableExists(env.DB, "report_shares"))) return json({ ok: true, total: null, last7d: null, views: null }, 200, corsHeaders);
  try {
    const r = await env.DB.prepare(
      "SELECT COUNT(*) AS total, SUM(CASE WHEN created_at >= datetime('now','-7 days') THEN 1 ELSE 0 END) AS last7d, SUM(COALESCE(view_count,0)) AS views FROM report_shares"
    ).first();
    return json({ ok: true, total: Number(r?.total || 0), last7d: Number(r?.last7d || 0), views: Number(r?.views || 0) }, 200, corsHeaders);
  } catch (e) {
    return json({ ok: true, total: null, last7d: null, views: null }, 200, corsHeaders);
  }
}

async function handleZaloStatus(env, corsHeaders) {
  let cfg = null;
  try {
    const row = await env.DB.prepare("SELECT value FROM _kv_store WHERE key = 'app_config:zalo'").first();
    if (row?.value) cfg = JSON.parse(row.value);
  } catch (e) {}
  const templates = Array.isArray(cfg?.templates)
    ? cfg.templates.map((t) => ({ id: String(t.id || ""), status: String(t.status || "none") }))
    : [];
  const out = {
    ok: true,
    oaConnected: Boolean(cfg?.oa_id || cfg?.oaId),
    templates,
    keysSet: Boolean(env.ZALO_APP_ID && (env.ZALO_SECRET_KEY || env.ZALO_APP_SECRET)),
    testSentAt: cfg?.test_sent_at || cfg?.testSentAt || null,
    configured: Boolean(cfg),
  };
  return json(out, 200, corsHeaders);
}

async function handleAuditLogs2(request, env, corsHeaders) {
  const url = new URL(request.url);
  const actor = (url.searchParams.get("actor") || "").trim();
  const action = (url.searchParams.get("action") || "").trim();
  const from = (url.searchParams.get("from") || "").trim();
  const to = (url.searchParams.get("to") || "").trim();
  const q = (url.searchParams.get("q") || "").trim();
  const limit = Math.max(1, Math.min(500, parseInt(url.searchParams.get("limit") || "300", 10) || 300));
  const where = [];
  const binds = [];
  if (actor) {
    where.push("a.actor_id = ?");
    binds.push(actor);
  }
  if (action) {
    where.push("a.action = ?");
    binds.push(action);
  }
  // from/to: "YYYY-MM-DD" (ngày UTC) hoặc "YYYY-MM-DD HH:MM:SS" (UTC, trình duyệt đã đổi từ giờ địa phương)
  const full = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?/;
  if (full.test(from)) {
    where.push("a.created_at >= ?");
    binds.push(from.replace("T", " ").slice(0, 19));
  } else if (/^\d{4}-\d{2}-\d{2}/.test(from)) {
    where.push("a.created_at >= ?");
    binds.push(from.slice(0, 10) + " 00:00:00");
  }
  if (full.test(to)) {
    where.push("a.created_at <= ?");
    binds.push(to.replace("T", " ").slice(0, 19));
  } else if (/^\d{4}-\d{2}-\d{2}/.test(to)) {
    where.push("a.created_at <= ?");
    binds.push(to.slice(0, 10) + " 23:59:59");
  }
  if (q) {
    where.push("(a.target_id LIKE ? OR a.target_type LIKE ? OR a.action LIKE ?)");
    binds.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const run = async (withDetails) => {
    const cols = withDetails ? "a.details_json," : "";
    return env.DB.prepare(
      `SELECT a.id, a.actor_type, a.actor_id, a.action, a.target_type, a.target_id, ${cols} a.ip, a.created_at, u.email AS actor_email
       FROM audit_log a LEFT JOIN admin_users u ON u.id = a.actor_id
       ${whereSql} ORDER BY a.created_at DESC, a.id DESC LIMIT ?`
    ).bind(...binds, limit).all();
  };
  let res;
  try {
    res = await run(true);
  } catch (e) {
    try {
      res = await run(false);
    } catch (e2) {
      return json({ ok: true, logs: [], actors: [], actions: [], note: "Chưa có bảng nhật ký" }, 200, corsHeaders);
    }
  }
  let actors = [];
  let actions = [];
  try {
    const a1 = await env.DB.prepare(
      "SELECT DISTINCT a.actor_id AS id, u.email AS email FROM audit_log a LEFT JOIN admin_users u ON u.id = a.actor_id ORDER BY a.actor_id LIMIT 100"
    ).all();
    actors = a1.results || [];
    const a2 = await env.DB.prepare("SELECT DISTINCT action FROM audit_log ORDER BY action LIMIT 200").all();
    actions = (a2.results || []).map((r) => r.action);
  } catch (e) {}
  const logs = (res.results || []).map((r) => {
    let details = null;
    if (r.details_json) {
      try {
        details = JSON.parse(r.details_json);
      } catch (e) {
        details = r.details_json;
      }
    }
    const { details_json, ...rest } = r;
    return { ...rest, details };
  });
  return json({ ok: true, logs, actors, actions }, 200, corsHeaders);
}

async function handleSafetySummary(env, corsHeaders) {
  const out = { ok: true, rangeDays: 7, guard: null, feedback: null, workChecks: null };
  if (await tableExists(env.DB, "guard_log")) {
    try {
      const g = await env.DB.prepare(
        `SELECT COUNT(*) AS total,
          SUM(CASE WHEN outcome='fallback' THEN 1 ELSE 0 END) AS fallbacks,
          SUM(CASE WHEN outcome='regenerated' THEN 1 ELSE 0 END) AS regenerated,
          SUM(CASE WHEN outcome='leaked' THEN 1 ELSE 0 END) AS leaked
         FROM guard_log WHERE created_at >= datetime('now','-7 days')`
      ).first();
      out.guard = {
        total: Number(g?.total || 0),
        fallbacks: Number(g?.fallbacks || 0),
        regenerated: Number(g?.regenerated || 0),
        leaked: Number(g?.leaked || 0),
      };
    } catch (e) {}
  }
  if (await tableExists(env.DB, "ai_feedback")) {
    try {
      const f = await env.DB.prepare(
        "SELECT COUNT(*) AS total, SUM(CASE WHEN status='open' THEN 1 ELSE 0 END) AS open_cnt FROM ai_feedback"
      ).first();
      out.feedback = { total: Number(f?.total || 0), open: Number(f?.open_cnt || 0) };
    } catch (e) {}
  }
  if (await tableExists(env.DB, "work_checks")) {
    try {
      const w = await env.DB.prepare(
        "SELECT COUNT(*) AS total, SUM(CASE WHEN self_fixed = 1 THEN 1 ELSE 0 END) AS fixed FROM work_checks WHERE created_at >= datetime('now','-7 days')"
      ).first();
      out.workChecks = { total: Number(w?.total || 0), selfFixed: Number(w?.fixed || 0) };
    } catch (e) {}
  }
  return json(out, 200, corsHeaders);
}

const MODEL_KEYS = ["model", "temperature", "max_tokens", "timeout_ms", "parent_comment_words"];
async function readAiConfig(env) {
  try {
    const row = await env.DB.prepare("SELECT value FROM _kv_store WHERE key = 'prompt_studio:ai_config'").first();
    if (row?.value) {
      const v = JSON.parse(row.value);
      if (v && typeof v === "object") return v;
    }
  } catch (e) {}
  return null;
}
async function handleModelConfigGet(env, corsHeaders) {
  const cfg = await readAiConfig(env);
  const pick = {};
  if (cfg) for (const k of MODEL_KEYS) if (cfg[k] !== undefined) pick[k] = cfg[k];
  return json({ ok: true, config: cfg ? pick : null }, 200, corsHeaders);
}
async function handleModelConfigPut(request, env, corsHeaders, session) {
  if (!hasRole(session, ["superadmin", "editor"])) return err("FORBIDDEN", "Cần vai trò superadmin hoặc editor", 403, corsHeaders);
  const body = await request.json().catch(() => ({}));
  const next = {};
  if (typeof body.model === "string" && /^[\w.\-]{2,60}$/.test(body.model)) next.model = body.model;
  const t = Number(body.temperature);
  if (Number.isFinite(t) && t >= 0 && t <= 1) next.temperature = Math.round(t * 100) / 100;
  const mt = parseInt(body.max_tokens, 10);
  if (Number.isFinite(mt) && mt >= 256 && mt <= 8192) next.max_tokens = mt;
  const to = parseInt(body.timeout_ms, 10);
  if (Number.isFinite(to) && to >= 5000 && to <= 60000) next.timeout_ms = to;
  const pw = parseInt(body.parent_comment_words, 10);
  if (Number.isFinite(pw) && pw >= 50 && pw <= 400) next.parent_comment_words = pw;
  if (!Object.keys(next).length) return err("INVALID_INPUT", "Không có tham số hợp lệ để lưu", 400, corsHeaders);
  const cur = (await readAiConfig(env)) || {};
  const before = {};
  for (const k of Object.keys(next)) before[k] = cur[k] ?? null;
  const merged = { ...cur, ...next };
  await env.DB.prepare(
    "INSERT INTO _kv_store (key, value, updated_at) VALUES ('prompt_studio:ai_config', ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP"
  ).bind(JSON.stringify(merged)).run();
  await writeAudit(env, request, session, "UPDATE_MODEL_CONFIG", "app_config", "prompt_studio:ai_config", { before, after: next });
  const pick = {};
  for (const k of MODEL_KEYS) if (merged[k] !== undefined) pick[k] = merged[k];
  return json({ ok: true, config: pick }, 200, corsHeaders);
}

async function handleAutoLock(request, env, corsHeaders, session) {
  const body = await request.json().catch(() => ({}));
  const mins = parseInt(body.mins, 10);
  if (![5, 10, 15, 30, 60].includes(mins)) return err("INVALID_INPUT", "Số phút không hợp lệ", 400, corsHeaders);
  const before = session.auto_lock_mins ?? null;
  try {
    await env.DB.prepare("UPDATE admin_users SET auto_lock_mins = ? WHERE id = ?").bind(mins, session.member_id).run();
  } catch (e) {
    return err("UPDATE_FAILED", "Chưa lưu được (bảng quản trị viên chưa có cột tự khoá)", 500, corsHeaders);
  }
  await writeAudit(env, request, session, "SET_AUTO_LOCK", "admin_users", session.member_id, { before: { auto_lock_mins: before }, after: { auto_lock_mins: mins } });
  return json({ ok: true, autoLockMins: mins }, 200, corsHeaders);
}

export async function handle(request, env, ctx, pathname, method, corsHeaders, adminSession) {
  if (!PATHS.has(pathname)) return null;
  if (!env?.DB) return err("NO_DB", "Chưa gắn cơ sở dữ liệu", 500, corsHeaders);
  let session = adminSession;
  if (!session) {
    try {
      session = await authenticateAdmin(request, env);
    } catch (e) {
      session = null;
    }
  }
  if (!session) return err("UNAUTHORIZED", "Yêu cầu quyền quản trị", 401, corsHeaders);
  const staff = ["superadmin", "editor"];

  if (pathname === "/api/v1/admin/sql" && method === "POST") return handleSql(request, env, corsHeaders, session);
  if (pathname === "/api/v1/admin/infra-usage" && method === "GET") {
    if (!hasRole(session, staff)) return err("FORBIDDEN", "Không có quyền xem hạ tầng", 403, corsHeaders);
    return handleInfra(env, corsHeaders);
  }
  if (pathname === "/api/v1/admin/report-shares" && method === "GET") {
    if (!hasRole(session, staff)) return err("FORBIDDEN", "Không có quyền", 403, corsHeaders);
    return handleReportShares(env, corsHeaders);
  }
  if (pathname === "/api/v1/admin/zalo-status" && method === "GET") {
    if (!hasRole(session, staff)) return err("FORBIDDEN", "Không có quyền", 403, corsHeaders);
    return handleZaloStatus(env, corsHeaders);
  }
  if (pathname === "/api/v1/admin/audit-logs2" && method === "GET") {
    if (!hasRole(session, staff)) return err("FORBIDDEN", "Không có quyền xem nhật ký thao tác", 403, corsHeaders);
    return handleAuditLogs2(request, env, corsHeaders);
  }
  if (pathname === "/api/v1/admin/safety-summary" && method === "GET") return handleSafetySummary(env, corsHeaders);
  if (pathname === "/api/v1/admin/model-config" && method === "GET") {
    if (!hasRole(session, staff)) return err("FORBIDDEN", "Không có quyền", 403, corsHeaders);
    return handleModelConfigGet(env, corsHeaders);
  }
  if (pathname === "/api/v1/admin/model-config" && method === "PUT") return handleModelConfigPut(request, env, corsHeaders, session);
  if (pathname === "/api/v1/admin/auth/auto-lock" && method === "POST") return handleAutoLock(request, env, corsHeaders, session);
  return err("METHOD_NOT_ALLOWED", "Phương thức không hỗ trợ", 405, corsHeaders);
}

export default { handle };
