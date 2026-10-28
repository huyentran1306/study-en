/**
 * dot16_seasons.js · Đợt 16 · Cấu hình 3 bộ giao diện theo mùa (Noel, Tết, Tết Thiếu nhi)
 *
 * Gắn vào worker (chưa gắn, người tích hợp làm):
 *   import { handle as handleDot16Seasons, getPublicSeasons } from "./dot16_seasons.js";
 *   // 1) Công khai, TRƯỚC bước kiểm phiên admin:
 *   if (pathname === "/api/v1/config/seasons") {
 *     const r = await handleDot16Seasons(request, env, ctx, pathname, method, corsHeaders, null);
 *     if (r) return r;
 *   }
 *   // 2) Trong khối /api/v1/admin/*, sau khi đã có adminSession:
 *   const r16 = await handleDot16Seasons(request, env, ctx, pathname, method, corsHeaders, adminSession);
 *   if (r16) return r16;
 *   // 3) Trong GET /api/v1/config/public (v1_routes.js) thêm trường:
 *   //    seasons: await getPublicSeasons(env),
 *
 * Endpoint:
 *   GET /api/v1/config/seasons            → { ok, seasons }            (công khai, cache 5 phút)
 *   GET /api/v1/admin/seasons             → { ok, seasons, usage, updatedAt }  (mọi vai trò admin)
 *        usage = số gia đình đang dùng từng bộ { noel, tet, thieunhi } (đếm từ state gia đình trong _kv_store)
 *   PUT /api/v1/admin/seasons { seasons } → { ok, seasons }  · vai trò superadmin/admin/editor · ghi audit_log
 *
 * Lưu tại _kv_store key "app_config:seasons". Không gọi AI. Mỗi request tối đa 3 truy vấn D1.
 * Không cần migration: bảng _kv_store và audit_log đã có.
 */

const KV_KEY = "app_config:seasons";
const EDITOR_ROLES = new Set(["superadmin", "admin", "editor"]);
const SEASONAL_IDS = ["noel", "tet", "thieunhi"];

/* Ngày mùng 1 Tết mặc định (chủ dự án đối chiếu lịch âm Việt Nam trước khi chốt) */
const DEFAULT_TET_DATES = {
  2027: "2027-02-06",
  2028: "2028-01-26",
  2029: "2029-02-13",
  2030: "2030-02-03",
  2031: "2031-01-23",
};

const DEFAULT_SEASONS = {
  noel: { enabled: true, start: "12-01", end: "12-31" },
  tet: { enabled: true, daysBefore: 8, daysAfter: 9, dates: { ...DEFAULT_TET_DATES } },
  thieunhi: { enabled: true, start: "05-25", end: "06-07" },
};

function json(data, status = 200, corsHeaders = {}, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", ...extra },
  });
}

function validMD(s) {
  const m = /^(\d{2})-(\d{2})$/.exec(String(s || ""));
  if (!m) return false;
  const mo = +m[1];
  const d = +m[2];
  return mo >= 1 && mo <= 12 && d >= 1 && d <= 31;
}

function isIsoDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ""));
  if (!m) return false;
  const dt = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return dt.getUTCFullYear() === +m[1] && dt.getUTCMonth() === +m[2] - 1 && dt.getUTCDate() === +m[3];
}

/* Cùng quy tắc với src/seasons/seasonLogic.js normalizeSeasonsConfig ở app */
export function normalizeSeasons(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const out = {};
  for (const id of ["noel", "thieunhi"]) {
    const d = DEFAULT_SEASONS[id];
    const r = src[id] && typeof src[id] === "object" ? src[id] : {};
    out[id] = {
      enabled: r.enabled === undefined ? d.enabled : Boolean(r.enabled),
      start: validMD(r.start) ? r.start : d.start,
      end: validMD(r.end) ? r.end : d.end,
    };
  }
  const d = DEFAULT_SEASONS.tet;
  const r = src.tet && typeof src.tet === "object" ? src.tet : {};
  const dates = { ...d.dates };
  if (r.dates && typeof r.dates === "object") {
    for (const [y, v] of Object.entries(r.dates)) {
      if (!/^\d{4}$/.test(y)) continue;
      if (v === null || v === "") delete dates[y];
      else if (isIsoDate(v) && String(v).slice(0, 4) === y) dates[y] = v;
    }
  }
  const clampInt = (v, def, max) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n >= 0 && n <= max ? n : def;
  };
  out.tet = {
    enabled: r.enabled === undefined ? d.enabled : Boolean(r.enabled),
    daysBefore: clampInt(r.daysBefore, d.daysBefore, 30),
    daysAfter: clampInt(r.daysAfter, d.daysAfter, 30),
    dates,
  };
  return out;
}

async function ensureKv(env) {
  await env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS _kv_store (key TEXT PRIMARY KEY, value TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)"
  ).run();
}

async function readRow(env) {
  try {
    return await env.DB.prepare("SELECT value, updated_at FROM _kv_store WHERE key = ? OR key = ? ORDER BY updated_at DESC LIMIT 1")
      .bind(KV_KEY, encodeURIComponent(KV_KEY))
      .first();
  } catch (e) {
    return null;
  }
}

/* Dùng cho GET /api/v1/config/public: luôn trả cấu hình đủ trường (mặc định nếu admin chưa lưu) */
export async function getPublicSeasons(env) {
  const row = await readRow(env);
  let raw = null;
  if (row && row.value) {
    try {
      raw = JSON.parse(row.value);
    } catch (e) {
      raw = null;
    }
  }
  return normalizeSeasons(raw);
}

/* Số gia đình đang dùng từng bộ theo mùa (đọc trường theme trong state gia đình) */
async function countUsage(env) {
  const usage = { noel: 0, tet: 0, thieunhi: 0 };
  try {
    const rows = await env.DB.prepare(`
      SELECT theme, COUNT(DISTINCT k) AS n FROM (
        SELECT REPLACE(REPLACE(key, '%3A', ':'), '%3a', ':') AS k,
               COALESCE(json_extract(value, '$.state.theme'), json_extract(value, '$.theme')) AS theme
        FROM _kv_store
        WHERE key LIKE '%fam%state%' AND json_valid(value)
      ) WHERE theme IN ('noel', 'tet', 'thieunhi') GROUP BY theme
    `).all();
    for (const r of rows.results || []) {
      if (SEASONAL_IDS.includes(r.theme)) usage[r.theme] = Number(r.n) || 0;
    }
    return usage;
  } catch (e) {
    return null;
  }
}

export async function handle(request, env, ctx, pathname, method, corsHeaders, adminSession) {
  // Công khai: khung mùa cho app gia đình
  if (pathname === "/api/v1/config/seasons" && method === "GET") {
    const seasons = await getPublicSeasons(env);
    return json({ ok: true, seasons }, 200, corsHeaders, { "Cache-Control": "public, max-age=300" });
  }

  if (pathname !== "/api/v1/admin/seasons") return null;
  if (!adminSession) {
    return json({ error: { code: "UNAUTHORIZED", message: "Cần đăng nhập quản trị" } }, 401, corsHeaders);
  }

  if (method === "GET") {
    const row = await readRow(env);
    let raw = null;
    if (row && row.value) {
      try {
        raw = JSON.parse(row.value);
      } catch (e) {
        raw = null;
      }
    }
    const usage = await countUsage(env);
    return json({ ok: true, seasons: normalizeSeasons(raw), usage, updatedAt: row ? row.updated_at : null }, 200, corsHeaders);
  }

  if (method === "PUT" || method === "POST") {
    if (!EDITOR_ROLES.has(String(adminSession.role || ""))) {
      return json({ error: { code: "FORBIDDEN", message: "Vai trò này không được sửa bộ theo mùa" } }, 403, corsHeaders);
    }
    const body = await request.json().catch(() => ({}));
    if (!body || typeof body.seasons !== "object" || body.seasons === null) {
      return json({ error: { code: "BAD_BODY", message: "Thiếu trường seasons" } }, 400, corsHeaders);
    }
    const seasons = normalizeSeasons(body.seasons);
    const valueStr = JSON.stringify(seasons);
    if (valueStr.length > 4000) {
      return json({ error: { code: "TOO_LARGE", message: "Cấu hình quá dài" } }, 400, corsHeaders);
    }
    try {
      await ensureKv(env);
      const ip = request.headers.get("CF-Connecting-IP") || "";
      await env.DB.batch([
        env.DB.prepare(
          "INSERT INTO _kv_store (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP"
        ).bind(KV_KEY, valueStr),
        env.DB.prepare(`
          INSERT INTO audit_log (actor_type, actor_id, action, target_type, target_id, ip, created_at)
          VALUES ('admin', ?, 'UPDATE_SEASONS', 'config', ?, ?, CURRENT_TIMESTAMP)
        `).bind(adminSession.member_id || "", KV_KEY, ip),
      ]);
      return json({ ok: true, seasons }, 200, corsHeaders);
    } catch (e) {
      return json({ error: { code: "SERVER_ERROR", message: "Không lưu được cấu hình bộ theo mùa" } }, 500, corsHeaders);
    }
  }

  return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không hỗ trợ" } }, 405, corsHeaders);
}
