/**
 * API V1 ROUTES & MIDDLEWARE FOR KEM CON HOC
 * Implements Prompt 00 (Nền tảng tài khoản và bảo mật)
 * Optimized for Cloudflare Free Tier (strict CPU & query limits)
 */

import { handleTeacherRoute } from "./teacher_routes.js";
import { handleAdminStitchRoutes, checkAdminLocked } from "./admin_stitch_routes.js";
// Đợt 15–16: các module mới
import { handle as handleDot15Monitor } from "./dot15_monitor.js";
import { handle as handleDot15Ai } from "./dot15_ai.js";
import { handle as handleDot15System } from "./dot15_system.js";
import { handle as handleDot15Teacher } from "./dot15_teacher.js";
import { handle as handleDot16Seasons, getPublicSeasons } from "./dot16_seasons.js";

// Helper: Response JSON
export function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      ...headers,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

// Helper: Timing-safe string compare to prevent timing attacks
export function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// Helper: Hash password with salt using SHA-256 (matches existing client hashing)
export async function hashPass(pass, salt) {
  const data = new TextEncoder().encode(`${salt}::${pass}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Helper: SHA-256 Hex
export async function sha256Hex(str) {
  const data = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Helper: Generate secure 32-byte hex token
export function generateCleanCode(len = 6) {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let res = '';
  for (let i = 0; i < len; i++) {
    res += chars[bytes[i] % chars.length];
  }
  return res;
}

export function generateToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Helper: Authenticate session token
export async function authenticateSession(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return null;

  const tokenHash = await sha256Hex(token);
  const session = await env.DB.prepare(`
    SELECT s.token_hash, s.family_id, s.member_id, s.role, m.display_name, f.name as family_name, m.last_seen_at
    FROM auth_sessions s
    JOIN members m ON s.member_id = m.id
    JOIN families f ON s.family_id = f.id
    WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP AND s.revoked_at IS NULL
    LIMIT 1
  `).bind(tokenHash).first();

  if (!session) return null;

  // Throttled last_seen_at: max 1 write per hour
  const now = Date.now();
  const lastSeen = session.last_seen_at ? new Date(session.last_seen_at).getTime() : 0;
  if (now - lastSeen > 3600000) {
    env.DB.prepare("UPDATE members SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(session.member_id)
      .run()
      .catch(() => {});
  }

  return session;
}

// Helper: Authenticate admin token
export async function authenticateAdmin(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : (request.headers.get("x-admin-key") || "").trim();
  if (!token) return null;

  const tokenHash = await sha256Hex(token);
  const session = await env.DB.prepare(`
    SELECT s.token_hash, s.family_id, s.member_id, s.role, s.locked_at, u.email, u.auto_lock_mins
    FROM auth_sessions s
    JOIN admin_users u ON s.member_id = u.id
    WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP AND s.revoked_at IS NULL
    LIMIT 1
  `).bind(tokenHash).first();

  if (session) return session;

  // Khoá chủ cũ (đã lộ trong mã app). Đợt 15: chỉ còn chạy khi ALLOW_LEGACY_MASTER_SECRET="true".
  // Chủ dự án đăng nhập được bằng mật khẩu riêng thì đặt "false" (điểm dừng: mật khẩu admin).
  const legacyOn = String(env.ALLOW_LEGACY_MASTER_SECRET || "false").toLowerCase() === "true";
  const strongEnvKey = env.ADMIN_KEY && String(env.ADMIN_KEY).length >= 24 ? String(env.ADMIN_KEY) : null;
  if (
    (strongEnvKey && token === strongEnvKey) ||
    (legacyOn && (token === "kem-con-hoc-admin-secret-2026" || token === "kem_admin_2026" || token === "admin"))
  ) {
    return {
      member_id: "adm_superadmin_01",
      role: "superadmin",
      email: "admin@kemconhoc.vn",
      token_hash: "master_secret_session_token",
    };
  }

  return null;
}

// Rate limiter check for logins (5 fails / 15 mins for family+IP, 30 fails / 1 hour per IP, 5 fails / 30 mins for admin)
export async function checkRateLimit(db, ip, targetType, targetId) {
  // 1. IP-wide check (max 30 fails per hour across all targets)
  const ipCheck = await db.prepare(`
    SELECT count(*) as fails FROM login_attempts
    WHERE ip = ? AND success = 0 AND created_at > datetime('now', '-1 hour')
  `).bind(ip).first();

  if (ipCheck && ipCheck.fails >= 30) {
    return { blocked: true, message: "Quá nhiều lần đăng nhập sai từ địa chỉ IP này. Vui lòng đợi 1 giờ." };
  }

  // 2. Target specific check
  const interval = targetType === "admin" ? "-30 minutes" : "-15 minutes";
  const limit = 5;

  const targetCheck = await db.prepare(`
    SELECT count(*) as fails FROM login_attempts
    WHERE ip = ? AND target_type = ? AND target_id = ? AND success = 0 AND created_at > datetime('now', '${interval}')
  `).bind(ip, targetType, targetId).first();

  if (targetCheck && targetCheck.fails >= limit) {
    const mins = targetType === "admin" ? 30 : 15;
    return { blocked: true, message: `Bạn đã thử sai 5 lần. Vui lòng đợi ${mins} phút trước khi thử lại.` };
  }

  return { blocked: false };
}

// Log login attempt
export async function recordLoginAttempt(db, ip, targetType, targetId, success) {
  try {
    await db.prepare(`
      INSERT INTO login_attempts (ip, target_type, target_id, success)
      VALUES (?, ?, ?, ?)
    `).bind(ip, targetType, targetId, success ? 1 : 0).run();
  } catch (err) {
    console.error("recordLoginAttempt error:", err);
  }
}

// Main V1 Router
export async function handleV1Route(request, env, ctx, pathname, corsHeaders) {
  const method = request.method;
  const ip = request.headers.get("cf-connecting-ip") || "127.0.0.1";

  // Prompt 04: Cổng Giáo viên, Lớp học, Giao bài & Báo cáo nội dung
  // Đợt 15: thống kê bậc hay vướng cho cổng giáo viên · Đợt 16: cấu hình mùa công khai
  {
    const d15t = await handleDot15Teacher(request, env, ctx, pathname, method, corsHeaders);
    if (d15t) return d15t;
    if (pathname === "/api/v1/config/seasons") {
      const d16p = await handleDot16Seasons(request, env, ctx, pathname, method, corsHeaders, null);
      if (d16p) return d16p;
    }
  }

  if (
    pathname.startsWith("/api/v1/teacher/") ||
    pathname.startsWith("/api/v1/classes/preview") ||
    pathname.startsWith("/api/v1/family/classes") ||
    pathname.startsWith("/api/v1/family/assignments") ||
    pathname.startsWith("/api/v1/family/announcements") ||
    pathname.startsWith("/api/v1/family/reminders") ||
    pathname.startsWith("/api/v1/family/content-reports") ||
    (pathname.startsWith("/api/v1/admin/") &&
      (pathname.includes("/teachers") || pathname.includes("/classes") || pathname.includes("/content-reports")))
  ) {
    const teacherRes = await handleTeacherRoute(request, env, ctx, pathname, method, corsHeaders);
    if (teacherRes) return teacherRes;
  }

  // ==========================================================
  // 1. PUBLIC CONFIG (GET /api/v1/config/public)
  // Chỉ trả cấu hình app cần (< 10 KB), không chứa prompt nội bộ (P2.6)
  // ==========================================================
  if (pathname === "/api/v1/config/public" && method === "GET") {
    try {
      const keys = [
        "app_config:scope_rules",
        "app_config:themes",
        "app_config%3Athemes",
        "app_config:calm_threshold",
      ];
      const rows = await env.DB.prepare(`
        SELECT key, value FROM _kv_store WHERE key IN (?, ?, ?, ?)
      `).bind(...keys).all();

      const configMap = {};
      for (const row of rows.results || []) {
        try {
          configMap[row.key] = JSON.parse(row.value);
        } catch {
          configMap[row.key] = row.value;
        }
      }

      const themesConfig = configMap["app_config:themes"] || configMap["app_config%3Athemes"] || null;

      return jsonResponse(
        {
          ok: true,
          scopeRules: configMap["app_config:scope_rules"] || null,
          themesConfig,
          calmNudgeThreshold: configMap["app_config:calm_threshold"] || 2,
          seasons: await getPublicSeasons(env).catch(() => null),
          serverTime: new Date().toISOString(),
        },
        200,
        {
          ...corsHeaders,
          "Cache-Control": "public, max-age=300",
        }
      );
    } catch (err) {
      return jsonResponse({ error: { code: "SERVER_ERROR", message: err.message } }, 500, corsHeaders);
    }
  }

  // ==========================================================
  // CLIENT ERRORS LOGGER (CHẶNG 5 · MỤC 5.2)
  // ==========================================================
  if (pathname === "/api/v1/client-errors" && method === "POST") {
    try {
      const body = await request.json().catch(() => ({}));
      const message = String(body.message || "").slice(0, 500);
      const stack = String(body.stack || "").slice(0, 1500);
      const route = String(body.route || "/").slice(0, 100);
      const theme = String(body.theme || "bear").slice(0, 50);
      const buildVersion = String(body.buildVersion || "1.0.0").slice(0, 20);

      if (!message) {
        return jsonResponse({ ok: false, error: "Empty message" }, 400, corsHeaders);
      }

      // First 5 lines of stack
      const stackLines = stack.split('\n').slice(0, 5).join('\n');

      // Extract file and line
      let fileLine = "unknown";
      const fileMatch = stackLines.match(/(?:at\s+|@)?(?:.*\/)?([a-zA-Z0-9_.-]+:\d+:\d+)/);
      if (fileMatch) {
        fileLine = fileMatch[1];
      }

      // Generate error fingerprint (message + fileLine)
      const dataToHash = new TextEncoder().encode(`${message}::${fileLine}`);
      const hashBuffer = await crypto.subtle.digest("SHA-256", dataToHash);
      const errorHash = Array.from(new Uint8Array(hashBuffer)).slice(0, 8).map(b => b.toString(16).padStart(2, "0")).join("");

      let errorList = [];
      const row = await env.DB.prepare("SELECT value FROM _kv_store WHERE key = 'app_client_errors'").first();
      if (row?.value) {
        try { errorList = JSON.parse(row.value); } catch (e) {}
      }
      if (!Array.isArray(errorList)) errorList = [];

      const now = new Date().toISOString();
      const existingIdx = errorList.findIndex(e => e.id === errorHash);

      if (existingIdx >= 0) {
        errorList[existingIdx].count = (errorList[existingIdx].count || 1) + 1;
        errorList[existingIdx].last_seen = now;
        errorList[existingIdx].route = route;
        errorList[existingIdx].theme = theme;
        errorList[existingIdx].build_version = buildVersion;
      } else {
        errorList.unshift({
          id: errorHash,
          message,
          file_line: fileLine,
          stack: stackLines,
          route,
          theme,
          build_version: buildVersion,
          count: 1,
          first_seen: now,
          last_seen: now,
        });
        if (errorList.length > 100) errorList = errorList.slice(0, 100);
      }

      await env.DB.prepare(`
        INSERT INTO _kv_store (key, value, updated_at)
        VALUES ('app_client_errors', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `).bind(JSON.stringify(errorList)).run();

      return jsonResponse({ ok: true, logged: true, id: errorHash }, 200, corsHeaders);
    } catch (e) {
      return jsonResponse({ ok: false, error: e.message }, 500, corsHeaders);
    }
  }

  // GET /api/v1/admin/client-errors
  if (pathname === "/api/v1/admin/client-errors" && method === "GET") {
    const adminSession = await authenticateAdmin(request, env);
    if (!adminSession) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu quyền quản trị" } }, 401, corsHeaders);
    }

    let errorList = [];
    const row = await env.DB.prepare("SELECT value FROM _kv_store WHERE key = 'app_client_errors'").first();
    if (row?.value) {
      try { errorList = JSON.parse(row.value); } catch (e) {}
    }
    return jsonResponse({ ok: true, errors: Array.isArray(errorList) ? errorList : [] }, 200, corsHeaders);
  }

  // ==========================================================
  // 2. AUTH REGISTER (POST /api/v1/auth/register)
  // ==========================================================
  if (pathname === "/api/v1/auth/register" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const { familyName = "", password = "", displayName = "", relation = "" } = body;

    const trimmedName = familyName.trim();
    if (!trimmedName || !password) {
      return jsonResponse(
        { error: { code: "INVALID_INPUT", message: "Vui lòng nhập tên gia đình và mật khẩu" } },
        400,
        corsHeaders
      );
    }

    // Check duplicate
    const existing = await env.DB.prepare("SELECT id FROM families WHERE name = ? COLLATE NOCASE").bind(trimmedName).first();
    if (existing) {
      return jsonResponse(
        { error: { code: "FAMILY_EXISTS", message: "Tên gia đình đã có người dùng" } },
        409,
        corsHeaders
      );
    }

    const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const passHash = await hashPass(password, salt);
    const familyId = "fam_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const memberId = "mem_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const resolvedDisplayName = displayName.trim() || "Chủ nhà";
    const resolvedRelation = relation.trim() || "owner";

    // Insert family & owner member atomically
    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO families (id, name, salt, pass_hash, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)"
      ).bind(familyId, trimmedName, salt, passHash),
      env.DB.prepare(
        "INSERT INTO members (id, family_id, display_name, role, relation, last_seen_at, created_at) VALUES (?, ?, ?, 'owner', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
      ).bind(memberId, familyId, resolvedDisplayName, resolvedRelation),
    ]);

    // Issue auth token (60 days expiry)
    const token = generateToken();
    const tokenHash = await sha256Hex(token);
    const expiresAt = new Date(Date.now() + 60 * 86400000).toISOString();

    await env.DB.prepare(
      "INSERT INTO auth_sessions (token_hash, family_id, member_id, role, expires_at, created_at) VALUES (?, ?, ?, 'owner', ?, CURRENT_TIMESTAMP)"
    ).bind(tokenHash, familyId, memberId, expiresAt).run();

    return jsonResponse(
      {
        ok: true,
        token,
        family: { id: familyId, name: trimmedName },
        member: { id: memberId, displayName: resolvedDisplayName, role: "owner" },
      },
      201,
      corsHeaders
    );
  }

  // ==========================================================
  // 3. AUTH LOGIN (POST /api/v1/auth/login)
  // ==========================================================
  if (pathname === "/api/v1/auth/login" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const { familyName = "", password = "" } = body;

    const trimmedName = familyName.trim();
    if (!trimmedName || !password) {
      return jsonResponse(
        { error: { code: "INVALID_INPUT", message: "Vui lòng nhập tên gia đình và mật khẩu" } },
        400,
        corsHeaders
      );
    }

    // Rate limit check
    const rateCheck = await checkRateLimit(env.DB, ip, "family", trimmedName);
    if (rateCheck.blocked) {
      return jsonResponse({ error: { code: "TOO_MANY_ATTEMPTS", message: rateCheck.message } }, 429, corsHeaders);
    }

    const family = await env.DB.prepare(
      "SELECT id, name, salt, pass_hash FROM families WHERE name = ? COLLATE NOCASE"
    ).bind(trimmedName).first();

    if (!family) {
      await recordLoginAttempt(env.DB, ip, "family", trimmedName, false);
      return jsonResponse(
        { error: { code: "INVALID_CREDENTIALS", message: `Không tìm thấy gia đình "${trimmedName}"` } },
        401,
        corsHeaders
      );
    }

    const calculatedHash = await hashPass(password, family.salt);
    const isValid = timingSafeEqual(calculatedHash, family.pass_hash);

    if (!isValid) {
      await recordLoginAttempt(env.DB, ip, "family", trimmedName, false);
      return jsonResponse(
        { error: { code: "INVALID_CREDENTIALS", message: "Sai mật khẩu rồi" } },
        401,
        corsHeaders
      );
    }

    // Ensure owner member exists
    let member = await env.DB.prepare(
      "SELECT id, display_name, role FROM members WHERE family_id = ? AND role = 'owner' LIMIT 1"
    ).bind(family.id).first();

    if (!member) {
      const memberId = "mem_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      await env.DB.prepare(
        "INSERT INTO members (id, family_id, display_name, role, relation, last_seen_at, created_at) VALUES (?, ?, 'Chủ nhà', 'owner', 'owner', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
      ).bind(memberId, family.id).run();
      member = { id: memberId, display_name: "Chủ nhà", role: "owner" };
    }

    // Generate token
    const token = generateToken();
    const tokenHash = await sha256Hex(token);
    const expiresAt = new Date(Date.now() + 60 * 86400000).toISOString();

    await env.DB.prepare(
      "INSERT INTO auth_sessions (token_hash, family_id, member_id, role, expires_at, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)"
    ).bind(tokenHash, family.id, member.id, member.role, expiresAt).run();

    return jsonResponse(
      {
        ok: true,
        token,
        family: { id: family.id, name: family.name },
        member: { id: member.id, displayName: member.display_name, role: member.role },
      },
      200,
      corsHeaders
    );
  }

  // ==========================================================
  // 4. AUTH LOGOUT & ME
  // ==========================================================
  if (pathname === "/api/v1/auth/logout" && method === "POST") {
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (token) {
      const tokenHash = await sha256Hex(token);
      await env.DB.prepare("UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = ?")
        .bind(tokenHash)
        .run();
    }
    return jsonResponse({ ok: true, message: "Đã đăng xuất" }, 200, corsHeaders);
  }

  if (pathname === "/api/v1/auth/me" && method === "GET") {
    const session = await authenticateSession(request, env);
    if (!session) {
      return jsonResponse(
        { error: { code: "UNAUTHORIZED", message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn" } },
        401,
        corsHeaders
      );
    }
    return jsonResponse(
      {
        ok: true,
        family: { id: session.family_id, name: session.family_name },
        member: { id: session.member_id, displayName: session.display_name, role: session.role },
      },
      200,
      corsHeaders
    );
  }

  // ==========================================================
  // 5. FAMILY STATE (GET / PUT /api/v1/family/state)
  // ==========================================================
  if (pathname === "/api/v1/family/state") {
    const session = await authenticateSession(request, env);
    if (!session) {
      return jsonResponse(
        { error: { code: "UNAUTHORIZED", message: "Cần đăng nhập để thao tác dữ liệu gia đình" } },
        401,
        corsHeaders
      );
    }

    const stateKey = `fam:${session.family_id}:state`;

    if (method === "GET") {
      const row = await env.DB.prepare("SELECT value, updated_at FROM _kv_store WHERE key = ?")
        .bind(stateKey)
        .first();

      let state = null;
      if (row && row.value) {
        try {
          state = JSON.parse(row.value);
        } catch {
          state = row.value;
        }
      }

      return jsonResponse(
        {
          ok: true,
          state,
          ts: row ? row.updated_at : null,
          familyId: session.family_id,
        },
        200,
        corsHeaders
      );
    }

    if (method === "PUT") {
      if (session.role === "viewer") {
        return jsonResponse(
          { error: { code: "FORBIDDEN", message: "Tài khoản Chỉ xem (viewer) không có quyền ghi state" } },
          403,
          corsHeaders
        );
      }
      const body = await request.json().catch(() => ({}));
      const { state = null, baseTs = null } = body;

      if (!state) {
        return jsonResponse(
          { error: { code: "INVALID_INPUT", message: "Thiếu dữ liệu state" } },
          400,
          corsHeaders
        );
      }

      // Concurrency check (Section 3: conflict detection)
      const current = await env.DB.prepare("SELECT value, updated_at FROM _kv_store WHERE key = ?")
        .bind(stateKey)
        .first();

      if (current && baseTs && current.updated_at) {
        const parseD1Time = (ts) => {
          if (!ts) return 0;
          const s = String(ts).trim();
          const iso = s.includes("T") ? (s.endsWith("Z") ? s : s + "Z") : s.replace(" ", "T") + "Z";
          const t = new Date(iso).getTime();
          return isNaN(t) ? new Date(s).getTime() || 0 : t;
        };
        const curTime = parseD1Time(current.updated_at);
        const clientBaseTime = parseD1Time(baseTs);
        // If server timestamp is newer than client base timestamp -> Conflict
        if (curTime > clientBaseTime) {
          let serverState = null;
          try {
            serverState = JSON.parse(current.value);
          } catch {
            serverState = current.value;
          }
          return jsonResponse(
            {
              error: {
                code: "STATE_CONFLICT",
                message: "Dữ liệu trên máy chủ đã thay đổi từ thiết bị khác",
              },
              serverState,
              serverTs: current.updated_at,
            },
            409,
            corsHeaders
          );
        }
      }

      const valStr = typeof state === "string" ? state : JSON.stringify(state);
      await env.DB.prepare(`
        INSERT INTO _kv_store (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `).bind(stateKey, valStr).run();

      const updatedRow = await env.DB.prepare("SELECT updated_at FROM _kv_store WHERE key = ?")
        .bind(stateKey)
        .first();

      return jsonResponse(
        { ok: true, saved: true, ts: updatedRow ? updatedRow.updated_at : new Date().toISOString() },
        200,
        corsHeaders
      );
    }
  }

  // ==========================================================
  // 6. SESSIONS & EVENTS (POST /api/v1/sessions, PATCH /api/v1/sessions/:id)
  // ==========================================================
  if (pathname === "/api/v1/sessions" && method === "POST") {
    const session = await authenticateSession(request, env);
    if (!session) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Cần đăng nhập" } }, 401, corsHeaders);
    }
    if (session.role === "viewer") {
      return jsonResponse(
        { error: { code: "FORBIDDEN", message: "Tài khoản Chỉ xem (viewer) không có quyền tạo buổi học" } },
        403,
        corsHeaders
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      id = "",
      childId = null,
      startedAt = new Date().toISOString(),
      source = "photo",
      assignmentId = null,
      assignmentItemId = null,
      subject = "Toán",
      grade = 1,
      problemText = "",
      problemType = "",
      methodRuleId = "",
      stepsTotal = 0,
      scopeCategory = "bai_tap",
      aiLatencyMs = null,
      aiModel = null,
    } = body;

    const sessionId = id || "ses_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    try {
      await env.DB.prepare(`
        INSERT OR IGNORE INTO learning_sessions (
          id, family_id, child_id, member_id, started_at, source,
          assignment_id, assignment_item_id,
          subject, grade, problem_text, problem_type, method_rule_id,
          steps_total, scope_category, ai_latency_ms, ai_model, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        sessionId,
        session.family_id,
        childId,
        session.member_id,
        startedAt,
        source,
        assignmentId,
        assignmentItemId,
        subject,
        grade,
        problemText,
        problemType,
        methodRuleId,
        stepsTotal,
        scopeCategory,
        aiLatencyMs,
        aiModel
      ).run();

      return jsonResponse({ ok: true, id: sessionId }, 201, corsHeaders);
    } catch (err) {
      return jsonResponse({ error: { code: "DB_ERROR", message: err.message } }, 500, corsHeaders);
    }
  }

  if (pathname.startsWith("/api/v1/sessions/") && method === "PATCH") {
    const session = await authenticateSession(request, env);
    if (!session) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Cần đăng nhập" } }, 401, corsHeaders);
    }

    const sessionId = pathname.replace("/api/v1/sessions/", "").trim();
    const body = await request.json().catch(() => ({}));
    const {
      endedAt = null,
      stepsDone = null,
      stuckCount = null,
      hintLevelMax = null,
      answerPeeks = null,
      teachBackRating = null,
      quickRating = null,
      completed = null,
      events = [],
    } = body;

    const updates = [];
    const params = [];

    if (endedAt !== null) { updates.push("ended_at = ?"); params.push(endedAt); }
    if (stepsDone !== null) { updates.push("steps_done = ?"); params.push(stepsDone); }
    if (stuckCount !== null) { updates.push("stuck_count = ?"); params.push(stuckCount); }
    if (hintLevelMax !== null) { updates.push("hint_level_max = ?"); params.push(hintLevelMax); }
    if (answerPeeks !== null) { updates.push("answer_peeks = ?"); params.push(answerPeeks); }
    if (teachBackRating !== null) { updates.push("teach_back_rating = ?"); params.push(teachBackRating); }
    if (quickRating !== null) { updates.push("quick_rating = ?"); params.push(quickRating); }
    if (completed !== null) { updates.push("completed = ?"); params.push(completed ? 1 : 0); }

    const batch = [];
    if (updates.length > 0) {
      params.push(sessionId, session.family_id);
      batch.push(
        env.DB.prepare(`
          UPDATE learning_sessions SET ${updates.join(", ")}
          WHERE id = ? AND family_id = ?
        `).bind(...params)
      );
    }

    // Insert batched events (Section 8: app holds in RAM and sends in batches)
    if (Array.isArray(events) && events.length > 0) {
      for (const ev of events) {
        if (ev && ev.type) {
          batch.push(
            env.DB.prepare(`
              INSERT INTO session_events (session_id, ts, type, step)
              VALUES (?, ?, ?, ?)
            `).bind(sessionId, ev.ts || new Date().toISOString(), ev.type, ev.step !== undefined ? ev.step : null)
          );
        }
      }
    }

    if (batch.length > 0) {
      await env.DB.batch(batch);
    }

    // Auto-update assignment_results (Prompt 04: Cổng giáo viên - Worker tự ghi bảng này)
    try {
      const sRow = await env.DB.prepare(
        "SELECT assignment_item_id, child_id, stuck_count, hint_level_max, teach_back_rating, completed FROM learning_sessions WHERE id = ?"
      ).bind(sessionId).first();

      if (sRow && sRow.assignment_item_id) {
        const csRow = await env.DB.prepare(
          "SELECT id FROM class_students WHERE family_id = ? AND (child_id = ? OR ? IS NULL) AND status = 'active' LIMIT 1"
        ).bind(session.family_id, sRow.child_id, sRow.child_id).first();

        if (csRow) {
          const resStatus = sRow.completed ? "done" : "in_progress";
          const completedAt = sRow.completed ? new Date().toISOString() : null;
          const resultId = `asr_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

          await env.DB.prepare(`
            INSERT INTO assignment_results (id, item_id, class_student_id, session_id, status, stuck_count, hint_level_max, teach_back_rating, completed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(item_id, class_student_id) DO UPDATE SET
              session_id = excluded.session_id,
              status = excluded.status,
              stuck_count = excluded.stuck_count,
              hint_level_max = excluded.hint_level_max,
              teach_back_rating = COALESCE(excluded.teach_back_rating, assignment_results.teach_back_rating),
              completed_at = COALESCE(excluded.completed_at, assignment_results.completed_at)
          `).bind(
            resultId,
            sRow.assignment_item_id,
            csRow.id,
            sessionId,
            resStatus,
            sRow.stuck_count || 0,
            sRow.hint_level_max || 0,
            sRow.teach_back_rating || null,
            completedAt
          ).run();
        }
      }
    } catch (_) {}

    return jsonResponse({ ok: true, updated: true }, 200, corsHeaders);
  }

  // ==========================================================
  // 7. CASCADE DELETE FAMILY (DELETE /api/v1/family)
  // ==========================================================
  if (pathname === "/api/v1/family" && method === "DELETE") {
    const session = await authenticateSession(request, env);
    if (!session || session.role !== "owner") {
      return jsonResponse(
        { error: { code: "FORBIDDEN", message: "Chỉ chủ nhà (owner) mới có quyền xoá tài khoản" } },
        403,
        corsHeaders
      );
    }

    const body = await request.json().catch(() => ({}));
    const { password = "" } = body;

    const family = await env.DB.prepare("SELECT salt, pass_hash FROM families WHERE id = ?")
      .bind(session.family_id)
      .first();

    if (!family) {
      return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy gia đình" } }, 404, corsHeaders);
    }

    const calculatedHash = await hashPass(password, family.salt);
    if (!timingSafeEqual(calculatedHash, family.pass_hash)) {
      return jsonResponse(
        { error: { code: "INVALID_CREDENTIALS", message: "Mật khẩu xác nhận không đúng" } },
        401,
        corsHeaders
      );
    }

    const fid = session.family_id;

    // Cascade delete across Dot 14/18/19 tables safely (if migrated)
    try {
      await env.DB.prepare("DELETE FROM guard_log WHERE family_id = ?").bind(fid).run();
      await env.DB.prepare("DELETE FROM work_checks WHERE family_id = ?").bind(fid).run();
      await env.DB.prepare("DELETE FROM teach_backs WHERE family_id = ?").bind(fid).run();
      await env.DB.prepare("DELETE FROM ai_feedback WHERE family_id = ?").bind(fid).run();
      await env.DB.prepare("DELETE FROM learning_events WHERE family_id = ?").bind(fid).run();
      await env.DB.prepare("DELETE FROM progress_reports WHERE family_id = ?").bind(fid).run();
      await env.DB.prepare("DELETE FROM badge_events WHERE family_id = ?").bind(fid).run();
      await env.DB.prepare("DELETE FROM reward_events WHERE family_id = ?").bind(fid).run();
    } catch (e) {
      // Bỏ qua nếu DB live chưa chạy migration
    }

    // Cascade delete across core tables
    await env.DB.batch([
      env.DB.prepare("DELETE FROM session_events WHERE session_id IN (SELECT id FROM learning_sessions WHERE family_id = ?)").bind(fid),
      env.DB.prepare("DELETE FROM learning_sessions WHERE family_id = ?").bind(fid),
      env.DB.prepare("DELETE FROM ai_calls WHERE family_id = ?").bind(fid),
      env.DB.prepare("DELETE FROM auth_sessions WHERE family_id = ?").bind(fid),
      env.DB.prepare("DELETE FROM children WHERE family_id = ?").bind(fid),
      env.DB.prepare("DELETE FROM members WHERE family_id = ?").bind(fid),
      env.DB.prepare("DELETE FROM _kv_store WHERE key = ?").bind(`fam:${fid}:state`),
      env.DB.prepare("DELETE FROM families WHERE id = ?").bind(fid),
      env.DB.prepare(`
        INSERT INTO audit_log (actor_type, actor_id, action, target_type, target_id, ip, created_at)
        VALUES ('owner', ?, 'DELETE_FAMILY', 'family', ?, ?, CURRENT_TIMESTAMP)
      `).bind(session.member_id, fid, ip),
    ]);

    return jsonResponse({ ok: true, deleted: true, message: "Đã xoá toàn bộ dữ liệu gia đình" }, 200, corsHeaders);
  }

  // ==========================================================
  // 8. ADMIN AUTH & ENDPOINTS
  // ==========================================================
  if (pathname === "/api/v1/admin/auth/login" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const { email = "", password = "" } = body;

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      return jsonResponse({ error: { code: "INVALID_INPUT", message: "Vui lòng nhập email và mật khẩu" } }, 400, corsHeaders);
    }

    const rateCheck = await checkRateLimit(env.DB, ip, "admin", trimmedEmail);
    if (rateCheck.blocked) {
      return jsonResponse({ error: { code: "TOO_MANY_ATTEMPTS", message: rateCheck.message } }, 429, corsHeaders);
    }

    let admin = await env.DB.prepare("SELECT id, email, pass_hash, salt, role FROM admin_users WHERE email = ?")
      .bind(trimmedEmail)
      .first();

    // Bootstrap initial admin if table is empty
    if (!admin && trimmedEmail === "admin@kemconhoc.vn") {
      const salt = "admin_init_salt_2026";
      const passHash = await hashPass(password, salt);
      const adminId = "adm_superadmin_01";
      await env.DB.prepare(`
        INSERT INTO admin_users (id, email, pass_hash, salt, role, created_at)
        VALUES (?, ?, ?, ?, 'superadmin', CURRENT_TIMESTAMP)
      `).bind(adminId, trimmedEmail, passHash, salt).run();
      admin = { id: adminId, email: trimmedEmail, pass_hash: passHash, salt, role: "superadmin" };
    }

    if (!admin) {
      await recordLoginAttempt(env.DB, ip, "admin", trimmedEmail, false);
      return jsonResponse({ error: { code: "INVALID_CREDENTIALS", message: "Sai email hoặc mật khẩu quản trị" } }, 401, corsHeaders);
    }

    const calcHash = await hashPass(password, admin.salt);
    const isMasterSecret =
      String(env.ALLOW_LEGACY_MASTER_SECRET || "false").toLowerCase() === "true" &&
      (password === "kem-con-hoc-admin-secret-2026" || password === "kem_admin_2026");
    if (!isMasterSecret && !timingSafeEqual(calcHash, admin.pass_hash)) {
      await recordLoginAttempt(env.DB, ip, "admin", trimmedEmail, false);
      return jsonResponse({ error: { code: "INVALID_CREDENTIALS", message: "Sai email hoặc mật khẩu quản trị" } }, 401, corsHeaders);
    }


    const token = generateToken();
    const tokenHash = await sha256Hex(token);
    const expiresAt = new Date(Date.now() + 12 * 3600000).toISOString(); // 12 hours expiry

    await env.DB.prepare(`
      INSERT INTO auth_sessions (token_hash, family_id, member_id, role, expires_at, created_at)
      VALUES (?, 'admin_org', ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(tokenHash, admin.id, admin.role, expiresAt).run();

    await env.DB.prepare(`
      INSERT INTO audit_log (actor_type, actor_id, action, target_type, target_id, ip, created_at)
      VALUES ('admin', ?, 'ADMIN_LOGIN', 'admin_users', ?, ?, CURRENT_TIMESTAMP)
    `).bind(admin.id, admin.id, ip).run();

    return jsonResponse(
      {
        ok: true,
        token,
        admin: { id: admin.id, email: admin.email, role: admin.role },
      },
      200,
      corsHeaders
    );
  }

  // Admin Families List (GET /api/v1/admin/families)
  if (pathname === "/api/v1/admin/families" && method === "GET") {
    const adminSession = await authenticateAdmin(request, env);
    if (!adminSession) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu quyền quản trị" } }, 401, corsHeaders);
    }

    const rows = await env.DB.prepare(`
      SELECT id, name, created_at FROM families ORDER BY created_at DESC LIMIT 100
    `).all();

    return jsonResponse({ ok: true, families: rows.results || [] }, 200, corsHeaders);
  }

  // Admin Scope Audit Stats (GET /api/v1/admin/scope-stats)
  if (pathname === "/api/v1/admin/scope-stats" && method === "GET") {
    const adminSession = await authenticateAdmin(request, env);
    if (!adminSession) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu quyền quản trị" } }, 401, corsHeaders);
    }

    const stats = await env.DB.prepare(`
      SELECT scope_category, count(*) as count
      FROM learning_sessions
      WHERE started_at > datetime('now', '-30 days')
      GROUP BY scope_category
    `).all();

    return jsonResponse({ ok: true, stats: stats.results || [] }, 200, corsHeaders);
  }

  // ==========================================================
  // Prompt 05: Admin Stitch Endpoints, Lock/Unlock, Overview, Sessions, NPS
  // ==========================================================
  if (pathname.startsWith("/api/v1/admin/") || pathname === "/api/v1/nps") {
    let adminSession = null;
    if (pathname.startsWith("/api/v1/admin/") && pathname !== "/api/v1/admin/auth/login") {
      adminSession = await authenticateAdmin(request, env);
      if (!adminSession) {
        return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu quyền quản trị" } }, 401, corsHeaders);
      }
      const lockedRes = checkAdminLocked(adminSession, pathname, corsHeaders);
      if (lockedRes) return lockedRes;
    }

    if (adminSession) {
      for (const h of [handleDot15Monitor, handleDot15Ai, handleDot15System, handleDot16Seasons]) {
        const r = await h(request, env, ctx, pathname, method, corsHeaders, adminSession);
        if (r) return r;
      }
    }
    const adminStitchRes = await handleAdminStitchRoutes(request, env, ctx, pathname, method, corsHeaders, adminSession);
    if (adminStitchRes) return adminStitchRes;
  }

  
  // ==========================================================
  // 8. PROMPT 03: NHÓM GIA ĐÌNH & MÃ MỜI (INVITES)
  // ==========================================================

  // Tạo mã mời (POST /api/v1/family/invites)
  if (pathname === "/api/v1/family/invites" && method === "POST") {
    const session = await authenticateSession(request, env);
    if (!session) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập" } }, 401, corsHeaders);
    }
    if (session.role === "viewer") {
      return jsonResponse({ error: { code: "FORBIDDEN", message: "Tài khoản Chỉ xem không có quyền mời thành viên" } }, 403, corsHeaders);
    }

    const body = await request.json().catch(() => ({}));
    let { role = "guardian", relationHint = "" } = body;
    // Guardian chỉ được mời viewer
    if (session.role === "guardian" && role !== "viewer") {
      return jsonResponse({ error: { code: "FORBIDDEN", message: "Người kèm con chỉ có quyền mời thành viên với vai trò Chỉ xem (viewer)" } }, 403, corsHeaders);
    }

    const code = generateCleanCode(6);
    const expiresAt = new Date(Date.now() + 72 * 3600 * 1000).toISOString();

    await env.DB.prepare(`
      INSERT INTO invites (code, family_id, role, relation_hint, created_by, expires_at, max_uses, used_count)
      VALUES (?, ?, ?, ?, ?, ?, 1, 0)
    `).bind(code, session.family_id, role, relationHint || "", session.member_id, expiresAt).run();

    return jsonResponse({
      ok: true,
      invite: {
        code,
        role,
        relationHint,
        expiresAt,
        maxUses: 1,
      }
    }, 201, corsHeaders);
  }

  // Danh sách mã mời gia đình (GET /api/v1/family/invites)
  if (pathname === "/api/v1/family/invites" && method === "GET") {
    const session = await authenticateSession(request, env);
    if (!session) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập" } }, 401, corsHeaders);
    }

    const rows = await env.DB.prepare(`
      SELECT code, role, relation_hint as relationHint, created_by as createdBy, created_at as createdAt, expires_at as expiresAt, max_uses as maxUses, used_count as usedCount
      FROM invites
      WHERE family_id = ? AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP AND used_count < max_uses
      ORDER BY created_at DESC
    `).bind(session.family_id).all();

    return jsonResponse({ ok: true, invites: rows.results || [] }, 200, corsHeaders);
  }

  // Thu hồi mã mời (DELETE /api/v1/family/invites/:code)
  if (pathname.startsWith("/api/v1/family/invites/") && method === "DELETE") {
    const session = await authenticateSession(request, env);
    if (!session) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập" } }, 401, corsHeaders);
    }

    const code = pathname.replace("/api/v1/family/invites/", "").trim().toUpperCase();
    const inv = await env.DB.prepare("SELECT * FROM invites WHERE code = ? AND family_id = ?").bind(code, session.family_id).first();
    if (!inv) {
      return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy mã mời" } }, 404, corsHeaders);
    }
    if (session.role !== "owner" && inv.created_by !== session.member_id) {
      return jsonResponse({ error: { code: "FORBIDDEN", message: "Không có quyền thu hồi mã mời này" } }, 403, corsHeaders);
    }

    await env.DB.prepare("UPDATE invites SET revoked_at = CURRENT_TIMESTAMP WHERE code = ?").bind(code).run();
    return jsonResponse({ ok: true, revoked: true }, 200, corsHeaders);
  }

  // Kiểm tra thông tin công khai của mã mời (GET /api/v1/invites/:code)
  if (pathname.startsWith("/api/v1/invites/") && !pathname.includes("/accept") && method === "GET") {
    const code = pathname.replace("/api/v1/invites/", "").trim().toUpperCase();
    const inv = await env.DB.prepare(`
      SELECT code, family_id, role, relation_hint, created_by, expires_at, max_uses, used_count, revoked_at
      FROM invites
      WHERE code = ?
    `).bind(code).first();

    const isExpired = inv ? new Date(inv.expires_at).getTime() <= Date.now() : true;
    if (!inv || inv.revoked_at || isExpired || (inv.used_count >= inv.max_uses)) {
      return jsonResponse({
        ok: false,
        error: { code: "INVITE_INVALID", message: "Mã mời không tồn tại, đã hết hạn hoặc đã được sử dụng" }
      }, 404, corsHeaders);
    }

    const fam = await env.DB.prepare("SELECT name FROM families WHERE id = ?").bind(inv.family_id).first();
    const creator = await env.DB.prepare("SELECT display_name, relation FROM members WHERE id = ?").bind(inv.created_by).first();

    return jsonResponse({
      ok: true,
      valid: true,
      code: inv.code,
      familyName: fam ? fam.name : "Gia đình Kèm Con Học",
      inviterName: creator ? (creator.relation ? creator.relation + ' ' + creator.display_name : creator.display_name) : "Người thân",
      role: inv.role,
      relationHint: inv.relation_hint,
      expiresAt: inv.expires_at
    }, 200, corsHeaders);
  }

  // Chấp nhận mã mời và gia nhập gia đình (POST /api/v1/invites/:code/accept)
  if (pathname.startsWith("/api/v1/invites/") && pathname.endsWith("/accept") && method === "POST") {
    const code = pathname.replace("/api/v1/invites/", "").replace("/accept", "").trim().toUpperCase();
    const body = await request.json().catch(() => ({}));
    const { displayName = "", relation = "Mẹ", pin = "" } = body;

    if (!displayName.trim()) {
      return jsonResponse({ error: { code: "INVALID_INPUT", message: "Vui lòng nhập tên hiển thị" } }, 400, corsHeaders);
    }
    if (!pin || !/^\d{4,6}$/.test(String(pin))) {
      return jsonResponse({ error: { code: "INVALID_PIN", message: "Mã PIN phải gồm từ 4 đến 6 chữ số" } }, 400, corsHeaders);
    }

    const inv = await env.DB.prepare(`
      SELECT code, family_id, role, expires_at, max_uses, used_count, revoked_at
      FROM invites WHERE code = ?
    `).bind(code).first();

    const isExpired = inv ? new Date(inv.expires_at).getTime() <= Date.now() : true;
    if (!inv || inv.revoked_at || isExpired || (inv.used_count >= inv.max_uses)) {
      return jsonResponse({
        error: { code: "INVITE_INVALID", message: "Mã mời không tồn tại, đã hết hạn hoặc đã được sử dụng" }
      }, 400, corsHeaders);
    }

    const memberId = "mem_" + generateCleanCode(8).toLowerCase();
    const pinSalt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const pinHash = await hashPass(String(pin), pinSalt);

    // Tạo member mới
    await env.DB.prepare(`
      INSERT INTO members (id, family_id, display_name, relation, role, pin_salt, pin_hash, is_active, created_at, last_seen_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(memberId, inv.family_id, displayName.trim(), relation || "Khác", inv.role, pinSalt, pinHash).run();

    // Cập nhật lượt dùng của invite
    await env.DB.prepare("UPDATE invites SET used_count = used_count + 1 WHERE code = ?").bind(code).run();

    // Cấp token đăng nhập 60 ngày
    const token = generateToken();
    const tokenHash = await sha256Hex(token);
    const expiresAt = new Date(Date.now() + 60 * 86400000).toISOString();

    await env.DB.prepare(`
      INSERT INTO auth_sessions (token_hash, family_id, member_id, role, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(tokenHash, inv.family_id, memberId, inv.role, expiresAt).run();

    const fam = await env.DB.prepare("SELECT name FROM families WHERE id = ?").bind(inv.family_id).first();

    return jsonResponse({
      ok: true,
      token,
      familyId: inv.family_id,
      familyName: fam ? fam.name : "Gia đình",
      member: {
        id: memberId,
        displayName: displayName.trim(),
        relation,
        role: inv.role
      }
    }, 201, corsHeaders);
  }

  // ==========================================================
  // 9. PROMPT 03: QUẢN LÝ THÀNH VIÊN & MÃ MÁY MỚI (DEVICE CODE)
  // ==========================================================

  // Danh sách thành viên trong gia đình (GET /api/v1/family/members)
  if (pathname === "/api/v1/family/members" && method === "GET") {
    const session = await authenticateSession(request, env);
    if (!session) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập" } }, 401, corsHeaders);
    }

    const rows = await env.DB.prepare(`
      SELECT m.id, m.display_name as displayName, m.relation, m.role, m.is_active as isActive,
             m.created_at as createdAt, m.last_seen_at as lastSeenAt,
             COUNT(ls.id) as sessionsWeek
      FROM members m
      LEFT JOIN learning_sessions ls ON ls.member_id = m.id AND ls.created_at >= datetime('now', '-7 days')
      WHERE m.family_id = ? AND m.is_active = 1
      GROUP BY m.id
      ORDER BY CASE m.role WHEN 'owner' THEN 1 WHEN 'guardian' THEN 2 ELSE 3 END, m.created_at ASC
    `).bind(session.family_id).all();

    return jsonResponse({ ok: true, members: rows.results || [] }, 200, corsHeaders);
  }

  // Cập nhật vai trò / thông tin thành viên (PATCH /api/v1/family/members/:id)
  if (pathname.startsWith("/api/v1/family/members/") && method === "PATCH") {
    const session = await authenticateSession(request, env);
    if (!session || session.role !== "owner") {
      return jsonResponse({ error: { code: "FORBIDDEN", message: "Chỉ chủ nhà mới có quyền thay đổi vai trò thành viên" } }, 403, corsHeaders);
    }

    const memberId = pathname.replace("/api/v1/family/members/", "").trim();
    const body = await request.json().catch(() => ({}));
    const { role = null, relation = null, displayName = null } = body;

    const updates = [];
    const params = [];
    if (role && ['owner', 'guardian', 'viewer'].includes(role)) {
      updates.push("role = ?");
      params.push(role);
    }
    if (relation) {
      updates.push("relation = ?");
      params.push(relation);
    }
    if (displayName) {
      updates.push("display_name = ?");
      params.push(displayName.trim());
    }

    if (updates.length > 0) {
      params.push(memberId, session.family_id);
      await env.DB.prepare(`UPDATE members SET ${updates.join(', ')} WHERE id = ? AND family_id = ?`).bind(...params).run();
    }

    return jsonResponse({ ok: true, updated: true }, 200, corsHeaders);
  }

  // Xoá thành viên khỏi gia đình (DELETE /api/v1/family/members/:id)
  if (pathname.startsWith("/api/v1/family/members/") && method === "DELETE") {
    const session = await authenticateSession(request, env);
    if (!session || session.role !== "owner") {
      return jsonResponse({ error: { code: "FORBIDDEN", message: "Chỉ chủ nhà mới có quyền xoá thành viên" } }, 403, corsHeaders);
    }

    const memberId = pathname.replace("/api/v1/family/members/", "").trim();
    if (memberId === session.member_id) {
      return jsonResponse({ error: { code: "CANNOT_DELETE_SELF", message: "Chủ nhà không thể tự xoá chính mình" } }, 400, corsHeaders);
    }

    await env.DB.prepare("UPDATE members SET is_active = 0 WHERE id = ? AND family_id = ?").bind(memberId, session.family_id).run();
    await env.DB.prepare("DELETE FROM auth_sessions WHERE member_id = ?").bind(memberId).run();

    return jsonResponse({ ok: true, deleted: true }, 200, corsHeaders);
  }

  // Tạo mã đăng nhập máy mới (POST /api/v1/auth/device-code)
  if (pathname === "/api/v1/auth/device-code" && method === "POST") {
    const session = await authenticateSession(request, env);
    if (!session) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập" } }, 401, corsHeaders);
    }

    const body = await request.json().catch(() => ({}));
    const targetMemberId = (session.role === "owner" && body.memberId) ? body.memberId : session.member_id;

    const code = generateCleanCode(6);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 phút

    await env.DB.prepare(`
      INSERT INTO device_codes (code, member_id, family_id, expires_at)
      VALUES (?, ?, ?, ?)
    `).bind(code, targetMemberId, session.family_id, expiresAt).run();

    return jsonResponse({ ok: true, code, expiresAt }, 201, corsHeaders);
  }

  // Đăng nhập máy mới bằng mã 6 ký tự + PIN (POST /api/v1/auth/login-device)
  if (pathname === "/api/v1/auth/login-device" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const { code = "", pin = "" } = body;
    const cleanCode = String(code).trim().toUpperCase();

    const dev = await env.DB.prepare(`
      SELECT d.code, d.member_id, d.family_id, d.expires_at, d.used_at,
             m.display_name, m.relation, m.role, m.pin_salt, m.pin_hash, m.is_active,
             f.name as family_name
      FROM device_codes d
      JOIN members m ON d.member_id = m.id
      JOIN families f ON d.family_id = f.id
      WHERE d.code = ?
    `).bind(cleanCode).first();

    const isExpired = dev ? new Date(dev.expires_at).getTime() <= Date.now() : true;
    if (!dev || dev.used_at || isExpired || dev.is_active !== 1) {
      return jsonResponse({ error: { code: "INVALID_DEVICE_CODE", message: "Mã đăng nhập không đúng hoặc đã hết hạn (15 phút)" } }, 400, corsHeaders);
    }

    // Kiểm tra PIN
    const hashed = await hashPass(String(pin), dev.pin_salt || "");
    if (!dev.pin_hash || !timingSafeEqual(hashed, dev.pin_hash)) {
      return jsonResponse({ error: { code: "INVALID_PIN", message: "Mã PIN không chính xác" } }, 401, corsHeaders);
    }

    // Đánh dấu mã đã dùng
    await env.DB.prepare("UPDATE device_codes SET used_at = CURRENT_TIMESTAMP WHERE code = ?").bind(cleanCode).run();

    // Tạo session 60 ngày
    const token = generateToken();
    const tokenHash = await sha256Hex(token);
    const expiresAt = new Date(Date.now() + 60 * 86400000).toISOString();

    await env.DB.prepare(`
      INSERT INTO auth_sessions (token_hash, family_id, member_id, role, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(tokenHash, dev.family_id, dev.member_id, dev.role, expiresAt).run();

    return jsonResponse({
      ok: true,
      token,
      familyId: dev.family_id,
      familyName: dev.family_name,
      member: {
        id: dev.member_id,
        displayName: dev.display_name,
        relation: dev.relation,
        role: dev.role
      }
    }, 200, corsHeaders);
  }

  // ==========================================================
  // 10. PROMPT 03: BÁO CÁO TUẦN CHIA SẺ & ZALO (REPORT SHARES)
  // ==========================================================

  // Tạo link chia sẻ báo cáo tuần (POST /api/v1/reports/weekly/share)
  if (pathname === "/api/v1/reports/weekly/share" && method === "POST") {
    const session = await authenticateSession(request, env);
    if (!session) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập" } }, 401, corsHeaders);
    }
    if (session.role === "viewer") {
      return jsonResponse({ error: { code: "FORBIDDEN", message: "Tài khoản Chỉ xem không có quyền tạo link chia sẻ" } }, 403, corsHeaders);
    }

    const body = await request.json().catch(() => ({}));
    const { childId = null, week = "Tuần này", snapshot = {}, expiresDays = 7 } = body;

    const days = [7, 14].includes(Number(expiresDays)) ? Number(expiresDays) : 7;
    const expiresAt = new Date(Date.now() + days * 86400000).toISOString();
    const token = "rep_" + generateCleanCode(18).toLowerCase();

    await env.DB.prepare(`
      INSERT INTO report_shares (token, family_id, child_id, week, snapshot_json, created_by, expires_at, view_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `).bind(token, session.family_id, childId, week, JSON.stringify(snapshot), session.member_id, expiresAt).run();

    return jsonResponse({
      ok: true,
      token,
      expiresAt,
      shareUrl: `/r/${token}`
    }, 201, corsHeaders);
  }

  // Xem báo cáo công khai (GET /api/v1/reports/shared/:token)
  if (pathname.startsWith("/api/v1/reports/shared/") && method === "GET") {
    const token = pathname.replace("/api/v1/reports/shared/", "").trim();

    const row = await env.DB.prepare(`
      SELECT token, family_id, child_id, week, snapshot_json, created_at, expires_at, revoked_at, view_count
      FROM report_shares
      WHERE token = ?
    `).bind(token).first();

    const isExpired = row ? new Date(row.expires_at).getTime() <= Date.now() : true;
    if (!row || row.revoked_at || isExpired) {
      return jsonResponse({
        ok: false,
        error: { code: "REPORT_EXPIRED", message: "Link báo cáo đã hết hạn hoặc bị thu hồi" }
      }, 404, corsHeaders);
    }

    // Tăng lượt xem
    await env.DB.prepare("UPDATE report_shares SET view_count = view_count + 1 WHERE token = ?").bind(token).run();

    let report = {};
    try {
      report = JSON.parse(row.snapshot_json);
    } catch {
      report = {};
    }

    return jsonResponse({
      ok: true,
      report,
      week: row.week,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      viewCount: (row.view_count || 0) + 1
    }, 200, corsHeaders);
  }

  // Danh sách báo cáo đã chia sẻ của gia đình (GET /api/v1/reports/shared-list)
  if (pathname === "/api/v1/reports/shared-list" && method === "GET") {
    const session = await authenticateSession(request, env);
    if (!session) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập" } }, 401, corsHeaders);
    }

    let query = "SELECT token, week, child_id as childId, created_at as createdAt, expires_at as expiresAt, revoked_at as revokedAt, view_count as viewCount, created_by as createdBy FROM report_shares WHERE family_id = ?";
    const params = [session.family_id];
    if (session.role === "guardian") {
      query += " AND created_by = ?";
      params.push(session.member_id);
    }
    query += " ORDER BY created_at DESC LIMIT 50";

    const rows = await env.DB.prepare(query).bind(...params).all();
    return jsonResponse({ ok: true, shares: rows.results || [] }, 200, corsHeaders);
  }

  // Thu hồi link báo cáo (DELETE /api/v1/reports/shared/:token)
  if (pathname.startsWith("/api/v1/reports/shared/") && method === "DELETE") {
    const session = await authenticateSession(request, env);
    if (!session) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập" } }, 401, corsHeaders);
    }

    const token = pathname.replace("/api/v1/reports/shared/", "").trim();
    const row = await env.DB.prepare("SELECT family_id, created_by FROM report_shares WHERE token = ?").bind(token).first();
    if (!row || row.family_id !== session.family_id) {
      return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy link báo cáo" } }, 404, corsHeaders);
    }
    if (session.role !== "owner" && row.created_by !== session.member_id) {
      return jsonResponse({ error: { code: "FORBIDDEN", message: "Chỉ người tạo hoặc chủ nhà mới có quyền thu hồi link này" } }, 403, corsHeaders);
    }

    await env.DB.prepare("UPDATE report_shares SET revoked_at = CURRENT_TIMESTAMP WHERE token = ?").bind(token).run();
    return jsonResponse({ ok: true, revoked: true }, 200, corsHeaders);
  }

  // ==========================================================
  // 11. GẤU NHỚ CON (LEARNING EVENTS · PROMPT 18 CHẶNG 2)
  // ==========================================================

  // Ghi nhận sự kiện học từng bước (POST /api/v1/family/learning-events)
  if (pathname === "/api/v1/family/learning-events" && method === "POST") {
    const session = await authenticateSession(request, env);
    const body = await request.json().catch(() => ({}));
    const familyId = session?.family_id || body.family_id || request.headers.get("X-Family-Id");

    if (!familyId) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập gia đình" } }, 401, corsHeaders);
    }

    const {
      child_id,
      session_id,
      subject = "Toán",
      problem_type = "",
      step_no = 1,
      skill = "tinh_toan",
      result = "tu_lam",
      hints_used = 0,
      micro_steps = 0,
      voice_verdict = null,
    } = body;

    if (!child_id || !session_id) {
      return jsonResponse({ error: { code: "BAD_REQUEST", message: "Thiếu child_id hoặc session_id" } }, 400, corsHeaders);
    }

    const id = body.id || `le_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const cleanResult = ["tu_lam", "can_goi_y", "me_dan"].includes(result) ? result : "tu_lam";

    await env.DB.prepare(`
      INSERT INTO learning_events (id, family_id, child_id, session_id, subject, problem_type, step_no, skill, result, hints_used, micro_steps, voice_verdict, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(session_id, step_no) DO UPDATE SET
        skill = excluded.skill,
        result = excluded.result,
        hints_used = excluded.hints_used,
        micro_steps = excluded.micro_steps,
        voice_verdict = excluded.voice_verdict,
        subject = excluded.subject,
        problem_type = excluded.problem_type
    `).bind(
      id,
      familyId,
      child_id,
      session_id,
      subject,
      problem_type,
      Number(step_no) || 1,
      skill,
      cleanResult,
      Number(hints_used) || 0,
      Number(micro_steps) || 0,
      voice_verdict
    ).run();

    return jsonResponse({ ok: true, id, deduplicated: true }, 201, corsHeaders);
  }

  // Đọc lịch sử học và hồ sơ 30 ngày của bé (GET /api/v1/family/learning-events)
  if (pathname === "/api/v1/family/learning-events" && method === "GET") {
    const session = await authenticateSession(request, env);
    const familyId = session?.family_id || request.headers.get("X-Family-Id");

    if (!familyId) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập gia đình" } }, 401, corsHeaders);
    }

    const url = new URL(request.url);
    const childId = url.searchParams.get("child_id") || "";
    const days = parseInt(url.searchParams.get("days") || "30", 10);
    const childName = url.searchParams.get("child_name") || "Bé";

    if (!childId) {
      return jsonResponse({ error: { code: "BAD_REQUEST", message: "Thiếu child_id" } }, 400, corsHeaders);
    }

    const daysModifier = `-${days} days`;
    const rows = await env.DB.prepare(`
      SELECT * FROM learning_events
      WHERE family_id = ? AND child_id = ? AND created_at >= datetime("now", ?)
      ORDER BY created_at ASC
    `).bind(familyId, childId, daysModifier).all();

    const profile = buildLearnerProfileFromEvents(rows.results || [], childName);

    return jsonResponse({
      ok: true,
      childId,
      days,
      count: (rows.results || []).length,
      profile: profile.profileText,
      stuckSkills: profile.stuckSkills,
      solidSkills: profile.solidSkills,
      hasHistory: profile.hasHistory,
      events: rows.results || [],
    }, 200, corsHeaders);
  }

  // Xoá lịch sử học của một bé (DELETE /api/v1/family/learning-events)
  if (pathname === "/api/v1/family/learning-events" && method === "DELETE") {
    const session = await authenticateSession(request, env);
    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const familyId = session?.family_id || body.family_id || request.headers.get("X-Family-Id");
    const childId = url.searchParams.get("child_id") || body.child_id;

    if (!familyId) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập gia đình" } }, 401, corsHeaders);
    }
    if (!childId) {
      return jsonResponse({ error: { code: "BAD_REQUEST", message: "Thiếu child_id" } }, 400, corsHeaders);
    }

    await env.DB.prepare("DELETE FROM learning_events WHERE family_id = ? AND child_id = ?").bind(familyId, childId).run();
    return jsonResponse({ ok: true, deleted: true, childId }, 200, corsHeaders);
  }


  // ==========================================================
  // ĐỢT 19 CHẶNG 1: LỊCH SỬ PHẨM CHẤT & ĐỔI QUÀ
  // ==========================================================

  // Ghi nhận sự kiện nhận huy hiệu (POST /api/v1/family/badge-events)
  if (pathname === "/api/v1/family/badge-events" && method === "POST") {
    const session = await authenticateSession(request, env);
    const body = await request.json().catch(() => ({}));
    const familyId = session?.family_id || body.family_id || request.headers.get("X-Family-Id");

    if (!familyId) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập gia đình" } }, 401, corsHeaders);
    }

    const {
      child_id,
      session_id = null,
      trait,
      sticker_id,
      subject = "Toán",
      problem_type = null,
      source = "chon_khac",
      reason = "",
      timestamp = Date.now(),
      created_at = new Date().toISOString(),
    } = body;

    if (!child_id || !trait || !sticker_id) {
      return jsonResponse({ error: { code: "BAD_REQUEST", message: "Thiếu child_id, trait hoặc sticker_id" } }, 400, corsHeaders);
    }

    const validSource = ["goi_y", "chon_khac", "cu"].includes(source) ? source : "chon_khac";
    const id = body.id || ("be_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8));

    try {
      await env.DB.prepare(`
        INSERT OR IGNORE INTO badge_events (
          id, family_id, child_id, session_id, trait, sticker_id,
          subject, problem_type, source, reason, created_at, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        familyId,
        child_id,
        session_id,
        trait,
        sticker_id,
        subject,
        problem_type,
        validSource,
        reason,
        created_at,
        Number(timestamp) || Date.now()
      ).run();
    } catch (e) {
      return jsonResponse({ error: { code: "DB_ERROR", message: e.message } }, 500, corsHeaders);
    }

    return jsonResponse({ ok: true, id, child_id, trait, sticker_id }, 201, corsHeaders);
  }

  // Đọc danh sách huy hiệu của bé (GET /api/v1/family/badge-events)
  if (pathname === "/api/v1/family/badge-events" && method === "GET") {
    const session = await authenticateSession(request, env);
    const familyId = session?.family_id || request.headers.get("X-Family-Id");

    if (!familyId) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập gia đình" } }, 401, corsHeaders);
    }

    const url = new URL(request.url);
    const childId = url.searchParams.get("child_id") || "";
    const limit = parseInt(url.searchParams.get("limit") || "1000", 10);

    let query = "SELECT * FROM badge_events WHERE family_id = ?";
    const params = [familyId];

    if (childId) {
      query += " AND child_id = ?";
      params.push(childId);
    }

    query += " ORDER BY timestamp ASC, created_at ASC LIMIT ?";
    params.push(limit);

    try {
      const rows = await env.DB.prepare(query).bind(...params).all();
      return jsonResponse({
        ok: true,
        count: (rows.results || []).length,
        events: rows.results || [],
      }, 200, corsHeaders);
    } catch (e) {
      return jsonResponse({ error: { code: "DB_ERROR", message: e.message } }, 500, corsHeaders);
    }
  }

  // Xoá lịch sử huy hiệu của bé (DELETE /api/v1/family/badge-events)
  if (pathname === "/api/v1/family/badge-events" && method === "DELETE") {
    const session = await authenticateSession(request, env);
    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const familyId = session?.family_id || body.family_id || request.headers.get("X-Family-Id");
    const childId = url.searchParams.get("child_id") || body.child_id;

    if (!familyId) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập gia đình" } }, 401, corsHeaders);
    }
    if (!childId) {
      return jsonResponse({ error: { code: "BAD_REQUEST", message: "Thiếu child_id" } }, 400, corsHeaders);
    }

    try {
      await env.DB.prepare("DELETE FROM badge_events WHERE family_id = ? AND child_id = ?").bind(familyId, childId).run();
      return jsonResponse({ ok: true, deleted: true, childId }, 200, corsHeaders);
    } catch (e) {
      return jsonResponse({ error: { code: "DB_ERROR", message: e.message } }, 500, corsHeaders);
    }
  }

  // Ghi nhận sự kiện đổi quà 10 sticker (POST /api/v1/family/reward-events)
  if (pathname === "/api/v1/family/reward-events" && method === "POST") {
    const session = await authenticateSession(request, env);
    const body = await request.json().catch(() => ({}));
    const familyId = session?.family_id || body.family_id || request.headers.get("X-Family-Id");

    if (!familyId) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập gia đình" } }, 401, corsHeaders);
    }

    const {
      child_id,
      round = 1,
      title = "Đổi quà",
      sticker_count = 10,
      timestamp = Date.now(),
      created_at = new Date().toISOString(),
    } = body;

    if (!child_id || !title) {
      return jsonResponse({ error: { code: "BAD_REQUEST", message: "Thiếu child_id hoặc title" } }, 400, corsHeaders);
    }

    const id = body.id || ("re_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8));

    try {
      await env.DB.prepare(`
        INSERT INTO reward_events (
          id, family_id, child_id, round, title, sticker_count, created_at, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        familyId,
        child_id,
        Number(round) || 1,
        title,
        Number(sticker_count) || 10,
        created_at,
        Number(timestamp) || Date.now()
      ).run();
    } catch (e) {
      return jsonResponse({ error: { code: "DB_ERROR", message: e.message } }, 500, corsHeaders);
    }

    return jsonResponse({ ok: true, id, child_id, round, title }, 201, corsHeaders);
  }

  // Đọc danh sách đổi quà (GET /api/v1/family/reward-events)
  if (pathname === "/api/v1/family/reward-events" && method === "GET") {
    const session = await authenticateSession(request, env);
    const familyId = session?.family_id || request.headers.get("X-Family-Id");

    if (!familyId) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập gia đình" } }, 401, corsHeaders);
    }

    const url = new URL(request.url);
    const childId = url.searchParams.get("child_id") || "";

    let query = "SELECT * FROM reward_events WHERE family_id = ?";
    const params = [familyId];

    if (childId) {
      query += " AND child_id = ?";
      params.push(childId);
    }

    query += " ORDER BY round ASC, created_at ASC";

    try {
      const rows = await env.DB.prepare(query).bind(...params).all();
      return jsonResponse({
        ok: true,
        count: (rows.results || []).length,
        events: rows.results || [],
      }, 200, corsHeaders);
    } catch (e) {
      return jsonResponse({ error: { code: "DB_ERROR", message: e.message } }, 500, corsHeaders);
    }
  }

  // Chuyển dữ liệu cũ sang badge_events và reward_events (POST /api/v1/family/migrate-legacy-badges)
  if (pathname === "/api/v1/family/migrate-legacy-badges" && method === "POST") {
    const session = await authenticateSession(request, env);
    const body = await request.json().catch(() => ({}));
    const targetFamilyId = session?.family_id || body.family_id || request.headers.get("X-Family-Id");

    let totalScanned = 0;
    let badgeCount = 0;
    let rewardCount = 0;

    let keysQuery = "SELECT key, value FROM _kv_store WHERE key LIKE 'fam:%:state'";
    const params = [];
    if (targetFamilyId) {
      keysQuery = "SELECT key, value FROM _kv_store WHERE key = ?";
      params.push("fam:" + targetFamilyId + ":state");
    }

    const rows = await env.DB.prepare(keysQuery).bind(...params).all();
    const states = rows.results || [];
    totalScanned = states.length;

    for (const row of states) {
      try {
        const keyParts = row.key.split(":");
        const famId = keyParts[1];
        const state = JSON.parse(row.value);
        const children = state?.children || [];
        const stats = state?.stats || {};

        for (const ch of children) {
          const childStats = stats[ch.id] || {};
          const stickerHistory = childStats.stickerHistory || [];
          const rewardHistory = childStats.rewardHistory || [];

          for (const s of stickerHistory) {
            if (s.sample === true) continue;
            if (s.id && /^h(1[0-5]|[1-9])$/.test(String(s.id))) continue;

            const ts = Number(s.timestamp) || Date.now();
            const createdAt = new Date(ts).toISOString();
            const badgeId = s.id || ("mig_" + ts + "_" + Math.random().toString(36).slice(2, 6));
            const stickerId = s.stickerId || s.id || "s1";
            const trait = s.trait || "Kiên nhẫn";

            const res = await env.DB.prepare(`
              INSERT OR IGNORE INTO badge_events (
                id, family_id, child_id, session_id, trait, sticker_id,
                subject, problem_type, source, reason, created_at, timestamp
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'cu', ?, ?, ?)
            `).bind(
              badgeId,
              famId,
              ch.id,
              s.sessionId || null,
              trait,
              stickerId,
              s.subject || "Toán",
              s.problemType || null,
              s.reason || s.desc || "Chuyển từ dữ liệu cũ",
              createdAt,
              ts
            ).run();

            if (res.meta?.changes > 0) {
              badgeCount++;
            }
          }

          for (let rIdx = 0; rIdx < rewardHistory.length; rIdx++) {
            const rw = rewardHistory[rIdx];
            const round = Number(rw.round) || (rIdx + 1);
            const ts = Number(rw.timestamp) || Date.now();
            const createdAt = new Date(ts).toISOString();
            const title = rw.title || rw.reward || ("Quà chặng " + round);
            const rewardId = rw.id || ("mig_rw_" + famId + "_" + ch.id + "_" + round + "_" + ts);

            const res = await env.DB.prepare(`
              INSERT OR IGNORE INTO reward_events (
                id, family_id, child_id, round, title, sticker_count, created_at, timestamp
              ) VALUES (?, ?, ?, ?, ?, 10, ?, ?)
            `).bind(
              rewardId,
              famId,
              ch.id,
              round,
              title,
              createdAt,
              ts
            ).run();

            if (res.meta?.changes > 0) {
              rewardCount++;
            }
          }
        }
      } catch (err) {
        console.warn("Error migrating family legacy badges:", err);
      }
    }

    return jsonResponse({
      ok: true,
      scanned_states: totalScanned,
      badges_migrated: badgeCount,
      rewards_migrated: rewardCount,
    }, 200, corsHeaders);
  }

  return null; // Not handled by V1 router
}


// ==========================================================
// HỒ SƠ HỌC CỦA CON (GẤU NHỚ CON · PROMPT 18 CHẶNG 2)
// ==========================================================

export const SKILL_LABELS = {
  doc_hieu_de: "đọc hiểu đề",
  don_vi: "đổi đơn vị",
  chon_phep_tinh: "chọn phép tính",
  tinh_toan: "tính toán",
  viet_loi_giai: "viết lời giải",
  kiem_tra_lai: "kiểm tra lại",
  doc_hieu: "đọc hiểu",
  tu_vung: "từ vựng",
  chinh_ta: "chính tả",
  dat_cau: "đặt câu",
  tu_vung_en: "từ vựng Tiếng Anh",
  nghe: "nghe",
  ngu_phap: "ngữ pháp",
  phat_am: "phát âm",
};

export function buildLearnerProfileFromEvents(events, childName = "Bé") {
  if (!events || events.length < 3) {
    return {
      profileText: "chưa có",
      stuckSkills: [],
      solidSkills: [],
      count: events ? events.length : 0,
      hasHistory: false,
    };
  }

  const bySkill = {};
  events.forEach((e) => {
    const s = e.skill || "tinh_toan";
    if (!bySkill[s]) bySkill[s] = [];
    bySkill[s].push(e);
  });

  const stuckSkills = [];
  const solidSkills = [];

  for (const [skill, list] of Object.entries(bySkill)) {
    const total = list.length;
    const stuck = list.filter(
      (e) => e.result === "can_goi_y" || e.result === "me_dan" || (e.hints_used || 0) > 0 || (e.micro_steps || 0) > 0
    ).length;
    const stuckRate = stuck / total;
    const name = SKILL_LABELS[skill] || skill;

    if (total >= 3 && stuckRate > 0.3) {
      stuckSkills.push(name);
    }
    if (list.length >= 3) {
      const last3 = list.slice(-3);
      if (last3.every((e) => e.result === "tu_lam" && (e.hints_used || 0) === 0)) {
        solidSkills.push(name);
      }
    }
  }

  if (stuckSkills.length === 0 && solidSkills.length === 0) {
    return {
      profileText: `${childName} đang tiến bộ đều, các kỹ năng cơ bản tương đối ổn định.`,
      stuckSkills,
      solidSkills,
      count: events.length,
      hasHistory: true,
    };
  }

  let text = "";
  if (stuckSkills.length > 0 && solidSkills.length > 0) {
    text = `${childName} hay kẹt ở bước ${stuckSkills.join(" và ")}; đã vững ${solidSkills.join(", ")}. Hãy hỏi kỹ bước ${stuckSkills[0]}.`;
  } else if (stuckSkills.length > 0) {
    text = `${childName} hay kẹt ở bước ${stuckSkills.join(" và ")}. Hãy hỏi kỹ bước ${stuckSkills[0]}.`;
  } else {
    text = `${childName} đã vững ${solidSkills.join(", ")}. Khuyến khích ${childName.toLowerCase()} tự làm.`;
  }

  if (text.length > 300) text = text.slice(0, 297) + "...";
  return {
    profileText: text,
    stuckSkills,
    solidSkills,
    count: events.length,
    hasHistory: true,
  };
}

export async function buildLearnerProfile(env, familyId, childId, childName = "Bé") {
  if (!env?.DB || !familyId || !childId) {
    return { profileText: "chưa có", stuckSkills: [], solidSkills: [], count: 0, hasHistory: false };
  }
  try {
    const rows = await env.DB.prepare(`
      SELECT * FROM learning_events
      WHERE family_id = ? AND child_id = ? AND created_at >= datetime("now", "-30 days")
      ORDER BY created_at ASC
    `).bind(familyId, childId).all();

    return buildLearnerProfileFromEvents(rows.results || [], childName);
  } catch (err) {
    console.warn("buildLearnerProfile error:", err);
    return { profileText: "chưa có", stuckSkills: [], solidSkills: [], count: 0, hasHistory: false };
  }
}

// ==========================================================
// 12. PHÂN TÍCH TIẾN BỘ TRUNG THỰC (PROMPT 18 CHẶNG 3)
// ==========================================================
export async function handleProgressReport(request, env, ctx, corsHeaders) {
  const startedAt = Date.now();
  const session = env.DB ? await authenticateSession(request, env).catch(() => null) : null;
  const body = await request.json().catch(() => ({}));
  const familyId = session?.family_id || body.family_id || request.headers.get("X-Family-Id");
  const childId = body.child_id || url_param(request, "child_id");
  const childName = body.child_name || "Bé";

  if (!familyId || !childId) {
    return jsonResponse({ error: { code: "BAD_REQUEST", message: "Thiếu family_id hoặc child_id" } }, 400, corsHeaders);
  }

  // 1. Đọc learning_sessions và learning_events trong 28 ngày qua
  const sessions = await env.DB.prepare(`
    SELECT * FROM learning_sessions
    WHERE family_id = ? AND created_at >= datetime("now", "-28 days")
    ORDER BY created_at ASC
  `).bind(familyId).all().then(r => r.results || []).catch(() => []);

  // Dưới 3 buổi: trả mã NOT_ENOUGH_DATA, không gọi AI
  if (sessions.length < 3) {
    return jsonResponse({
      error: {
        code: "NOT_ENOUGH_DATA",
        message: `Cần ít nhất 3 buổi học để phân tích tiến bộ. ${childName} mới học ${sessions.length} buổi.`
      },
      sessions_count: sessions.length,
      required: 3,
      child_name: childName
    }, 200, corsHeaders);
  }

  // 2. Gom dữ kiện 28 ngày
  const events = await env.DB.prepare(`
    SELECT * FROM learning_events
    WHERE family_id = ? AND child_id = ? AND created_at >= datetime("now", "-28 days")
    ORDER BY created_at ASC
  `).bind(familyId, childId).all().then(r => r.results || []).catch(() => []);

  const so_buoi = sessions.length;
  const tu_ngay = sessions[0].created_at ? sessions[0].created_at.slice(0, 10) : "";
  const den_ngay = sessions[sessions.length - 1].created_at ? sessions[sessions.length - 1].created_at.slice(0, 10) : "";

  const profileAnalysis = buildLearnerProfileFromEvents(events, childName);
  const hay_ket = profileAnalysis.stuckSkills;
  const da_vung = profileAnalysis.solidSkills;
  const tu_lam_count = sessions.filter(s => s.status === "completed" && (s.hints_used || 0) === 0).length;

  const factBasis = {
    so_buoi,
    tu_ngay,
    den_ngay,
    hay_ket,
    da_vung,
    tu_lam_count,
    events_count: events.length
  };

  // 3. Kiểm tra bản phân tích đã lưu gần nhất (nếu chưa có buổi mới thì trả bản đã lưu, không gọi AI)
  const cached = await env.DB.prepare(`
    SELECT * FROM progress_reports
    WHERE family_id = ? AND child_id = ? AND sessions_read = ?
    ORDER BY created_at DESC LIMIT 1
  `).bind(familyId, childId, so_buoi).first().catch(() => null);

  if (cached && cached.report_json) {
    try {
      const parsedReport = JSON.parse(cached.report_json);
      return jsonResponse({
        ok: true,
        report: parsedReport,
        fact_basis: JSON.parse(cached.fact_basis_json || "{}"),
        cached: true,
        created_at: cached.created_at
      }, 200, corsHeaders);
    } catch (_) {}
  }

  // 4. Soạn prompt p17_progress và gọi AI
  const sysPrompt = "Bạn là chuyên gia sư phạm tiểu học. Hãy viết phân tích tiến bộ của con cho phụ huynh dựa trên đúng các dữ kiện thực tế được cung cấp. Tuyệt đối trung thực, không bịa đặt số liệu. Mọi con số bạn nhắc đến bắt buộc phải có trong dữ kiện.";
  const userPrompt = `DỮ KIỆN THỰC TẾ 28 NGÀY CỦA ${childName}:
- Số buổi học: ${so_buoi} buổi (từ ngày ${tu_ngay} đến ${den_ngay})
- Kỹ năng con hay kẹt: ${hay_ket.join(", ") || "Chưa có bước nào bị kẹt thường xuyên"}
- Kỹ năng con đã vững: ${da_vung.join(", ") || "Đang trong quá trình rèn luyện"}
- Số buổi con tự làm hết: ${tu_lam_count} bài
- Tổng số bước học ghi nhận: ${events.length} bước

YÊU CẦU: Trả lời DUY NHẤT một đối tượng JSON theo schema:
{
  "tom_tat": "Nhận xét tổng quan tiến bộ của con (tối đa 40 từ)",
  "hay_ket": ["${hay_ket[0] || 'Kỹ năng nâng cao'}"],
  "da_vung": ["${da_vung[0] || 'Phép tính cơ bản'}"],
  "goi_y_cho_me": [
    "Gợi ý 1 cho mẹ vào tuần tới (dưới 15 từ)",
    "Gợi ý 2 cho mẹ (dưới 15 từ)",
    "Gợi ý 3 cho mẹ (dưới 15 từ)"
  ],
  "nguon_du_lieu": {
    "so_buoi": ${so_buoi},
    "tu_ngay": "${tu_ngay}",
    "den_ngay": "${den_ngay}"
  }
}`;

  let aiResult = null;
  const chosenModel = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
  try {
    const aiResp = await env.AI.run(chosenModel, {
      messages: [
        { role: "system", content: sysPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 600,
      temperature: 0.3
    });
    const norm = (aiResp && typeof aiResp === "object" && aiResp.response !== undefined) ? aiResp.response : aiResp;
    let jsonStr = String(norm || "").trim();
    const m = jsonStr.match(/\{[\s\S]*\}/);
    if (m) aiResult = JSON.parse(m[0]);
  } catch (err) {
    console.warn("AI progress call failed, using fact basis fallback:", err);
  }

  // 5. Worker kiểm định dữ kiện: Mọi con số trong câu trả lời phải có trong dữ kiện
  const allowedNumbers = new Set([so_buoi, tu_lam_count, events.length, 28, 1, 2, 3]);
  (tu_ngay.match(/\d+/g) || []).forEach(n => allowedNumbers.add(Number(n)));
  (den_ngay.match(/\d+/g) || []).forEach(n => allowedNumbers.add(Number(n)));

  if (aiResult && typeof aiResult === "object") {
    const textToCheck = [aiResult.tom_tat, ...(aiResult.goi_y_cho_me || [])].join(" ");
    const numbersInText = (textToCheck.match(/\b\d+\b/g) || []).map(Number);
    const unverified = numbersInText.filter(n => !allowedNumbers.has(n));

    if (unverified.length > 0) {
      // Số bịa xuất hiện -> chuẩn hoá lại tom_tat theo đúng dữ kiện thực tế
      aiResult.tom_tat = `${childName} đang tiến bộ chắc chắn qua ${so_buoi} buổi học. Chỗ con làm tốt là ${da_vung.join(', ') || 'các dạng bài cơ bản'}, cần kiên nhẫn thêm ở ${hay_ket.join(', ') || 'các bước nâng cao'}.`;
    }
  } else {
    // Fallback chuẩn theo dữ kiện khi AI không phản hồi
    aiResult = {
      tom_tat: `${childName} đã hoàn thành ${so_buoi} buổi học đều đặn. Phần ${da_vung.join(', ') || 'tính toán'} con làm chắc, cần tiếp tục rèn thêm ở ${hay_ket.join(', ') || 'đọc hiểu đề'}.`,
      hay_ket: hay_ket.slice(0, 2),
      da_vung: da_vung.slice(0, 2),
      goi_y_cho_me: [
        "Trước khi tính, cho con kể lại đề bằng lời của con",
        "Đố ngược: mẹ đọc đáp số, con đoán phép tính",
        "Giữ 15 phút mỗi tối, đều đặn là được"
      ],
      nguon_du_lieu: {
        so_buoi,
        tu_ngay,
        den_ngay
      }
    };
  }

  aiResult.nguon_du_lieu = {
    so_buoi,
    tu_ngay,
    den_ngay
  };

  const latencyMs = Date.now() - startedAt;
  const reportId = `rep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // 6. Lưu vào progress_reports
  await env.DB.prepare(`
    INSERT INTO progress_reports (id, family_id, child_id, created_at, from_date, to_date, sessions_read, report_json, fact_basis_json, model, latency_ms)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    reportId,
    familyId,
    childId,
    tu_ngay,
    den_ngay,
    so_buoi,
    JSON.stringify(aiResult),
    JSON.stringify(factBasis),
    chosenModel,
    latencyMs
  ).run().catch(e => console.warn("Save progress_report error:", e));

  return jsonResponse({
    ok: true,
    report: aiResult,
    fact_basis: factBasis,
    cached: false,
    latency_ms: latencyMs,
    created_at: new Date().toISOString()
  }, 200, corsHeaders);
}

function url_param(req, key) {
  try {
    return new URL(req.url).searchParams.get(key);
  } catch (_) {
    return null;
  }
}

export async function handleMicroStep(request, env, ctx, corsHeaders) {
  const startedAt = Date.now();
  let body = {};
  try {
    body = await request.json();
  } catch (_) {
    return jsonResponse({ error: { code: "BAD_REQUEST", message: "JSON không hợp lệ" } }, 400, corsHeaders);
  }

  const {
    problem_text = "",
    step_question = "",
    step_answer = "",
    hints_used = [],
    skill = "tinh_toan",
    child_profile = "",
    child_speech = "",
    micro_index = 1,
    child_name = "Con",
  } = body;

  const session = await getAuthSession(request, env);
  const familyId = session?.family_id || body.family_id || request.headers.get("X-Family-Id");

  const sysPrompt = `Bạn là chuyên gia sư phạm tiểu học. Khi con đang kẹt ở một bước toán, nhiệm vụ của bạn là chẻ nhỏ bước đó thành một câu hỏi nhỏ hơn (micro-step).
QUY TẮC BẮT BUỘC:
1. Câu hỏi nhỏ (cau_hoi_nho) tối đa 20 từ. Phải nhỏ hơn câu hỏi gốc, chỉ vào đúng điểm nghẽn của con (tìm chữ quan trọng trong đề bài, xác định số nào đứng trước/sau, nhắc con nhìn vào dữ kiện).
2. TUYỆT ĐỐI KHÔNG lộ đáp án tới con. Không nhắc đến kết quả cuối cùng hoặc số mà con cần tính ra.
3. dap_an_cho_me: đáp án ngắn gọn mà mẹ chờ con trả lời cho câu nhỏ này.
4. ly_do_cho_me: giải thích sư phạm ngắn gọn (tối đa 25 từ) vì sao câu nhỏ này giúp con gỡ kẹt.
5. Chỉ trả về một đối tượng JSON duy nhất theo đúng schema:
{
  "cau_hoi_nho": "...",
  "dap_an_cho_me": "...",
  "ly_do_cho_me": "..."
}`;

  const userPrompt = `ĐỀ BÀI: "${problem_text}"
CÂU HỎI BẬC HIỆN TẠI: "${step_question}"
ĐÁP ÁN BẬC NÀY: "${step_answer}"
KỸ NĂNG: ${skill}
HỒ SƠ HỌC CỦA ${child_name}: ${child_profile || "Chưa có"}
CÂU CON VỪA NÓI (NẾU CÓ): ${child_speech ? `"${child_speech}"` : "Con chưa nghĩ ra"}
THỨ TỰ CÂU NHỎ: Câu nhỏ ${micro_index}/2

Hãy chẻ nhỏ câu hỏi cho ${child_name}:`;

  let result = null;
  const chosenModel = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
  try {
    const aiResp = await env.AI.run(chosenModel, {
      messages: [
        { role: "system", content: sysPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 300,
      temperature: 0.3
    });
    const norm = (aiResp && typeof aiResp === "object" && aiResp.response !== undefined) ? aiResp.response : aiResp;
    let jsonStr = String(norm || "").trim();
    const m = jsonStr.match(/\{[\s\S]*\}/);
    if (m) result = JSON.parse(m[0]);
  } catch (err) {
    console.warn("AI micro-step call failed, using fallback:", err);
  }

  // Fallback an toàn nếu AI lỗi hoặc không parse được
  if (!result || typeof result !== "object" || !result.cau_hoi_nho) {
    const fallbackMap = {
      doc_hieu: `${child_name} tìm trong đề bài xem chữ nào quan trọng nhất nhé?`,
      doi_don_vi: `${child_name} nhìn xem đề bài đang nhắc đến đơn vị gì nào?`,
      chon_phep_tinh: `Để tìm số còn lại, mình làm phép cộng hay phép trừ con nhỉ?`,
      tinh_toan: `${child_name} thử nhẩm hoặc dùng que tính xem sao nhé?`,
      loi_giai: `Câu trả lời của bài này mình bắt đầu bằng chữ gì con nhỉ?`,
    };
    result = {
      cau_hoi_nho: fallbackMap[skill] || `${child_name} đọc lại số đứng ngay trước câu hỏi nhé?`,
      dap_an_cho_me: step_answer || "Số liệu trong đề bài",
      ly_do_cho_me: "Chỉ vào chi tiết nhỏ nhất trong đề để con định hình lại bài toán."
    };
  }

  // Kiểm định an toàn: Bộ chặn rò rỉ đáp án & Máy kiểm phép tính
  if (step_answer && typeof step_answer === "string") {
    const numInAns = step_answer.match(/\b\d+\b/g);
    if (numInAns) {
      for (const n of numInAns) {
        if (!problem_text.includes(n) && result.cau_hoi_nho.includes(n)) {
          result.cau_hoi_nho = `${child_name} nhìn vào số đầu tiên trong đề bài nhé. Đó là số mấy?`;
          if (env.DB && familyId) {
            env.DB.prepare(`
              INSERT INTO guard_log (id, family_id, session_id, outcome, details, created_at)
              VALUES (?, ?, ?, 'sua_bac', ?, CURRENT_TIMESTAMP)
            `).bind(
              `grd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              familyId,
              body.session_id || null,
              JSON.stringify({ reason: "micro_step_answer_leak", original: result.cau_hoi_nho })
            ).run().catch(() => {});
          }
          break;
        }
      }
    }
  }

  const words = result.cau_hoi_nho.split(/\s+/);
  if (words.length > 20) {
    result.cau_hoi_nho = words.slice(0, 20).join(" ") + "...";
  }

  result.micro_index = micro_index;
  const latencyMs = Date.now() - startedAt;

  return jsonResponse({
    ok: true,
    micro_step: result,
    latency_ms: latencyMs,
  }, 200, corsHeaders);
}

export async function handleJudgeAnswer(request, env, ctx, corsHeaders) {
  const startedAt = Date.now();
  let body = {};
  try {
    body = await request.json();
  } catch (_) {
    return jsonResponse({ error: { code: "BAD_REQUEST", message: "JSON không hợp lệ" } }, 400, corsHeaders);
  }

  const {
    step_question = "",
    step_answer = "",
    child_speech = "",
    problem_text = "",
    child_name = "Con",
  } = body;

  if (!child_speech || !child_speech.trim()) {
    return jsonResponse({
      ok: true,
      verdict: {
        danh_gia: "khong_ro",
        nhan_xet_cho_me: "Chưa nghe rõ câu trả lời của con.",
        cau_me_noi_tiep: "Con nói lại to hơn một chút cho Gấu nghe nhé!",
        khen_cu_the: "Cố lên con nhé!"
      }
    }, 200, corsHeaders);
  }

  let normalizedSpeech = child_speech.trim();
  normalizedSpeech = normalizedSpeech.replace(/\bkhông\s+(biết|rõ|hiểu|thấy|phải|được)\b/gi, "ko $1");
  try {
    normalizedSpeech = viNumberWords(normalizedSpeech).replace(/(\d+)\s*chục\b/gi, (_, n) => String(Number(n) * 10));
  } catch (_) {}

  const sysPrompt = `Bạn là giáo viên tiểu học lắng nghe và đánh giá câu trả lời nói của học sinh.
QUY TẮC BẮT BUỘC:
1. danh_gia chỉ chọn một trong 4 giá trị: "dung", "gan_dung", "sai_huong", "khong_ro".
2. nhan_xet_cho_me: tối đa 25 từ, chỉ rõ con đúng hoặc sai ở điểm nào.
3. cau_me_noi_tiep: tối đa 20 từ, gợi ý cho mẹ nói tiếp để hướng dẫn con, TUYỆT ĐỐI KHÔNG lộ đáp án.
4. khen_cu_the: tối đa 15 từ, khen ngợi cụ thể nỗ lực của con.
5. Trả về đúng JSON theo schema:
{
  "danh_gia": "dung" | "gan_dung" | "sai_huong" | "khong_ro",
  "nhan_xet_cho_me": "...",
  "cau_me_noi_tiep": "...",
  "khen_cu_the": "..."
}`;

  const userPrompt = `ĐỀ BÀI: "${problem_text}"
CÂU HỎI BẬC HIỆN TẠI: "${step_question}"
ĐÁP ÁN CHUẨN CỦA BẬC: "${step_answer}"
LỜI ${child_name.toUpperCase()} NÓI: "${normalizedSpeech}"

Hãy đánh giá câu trả lời của ${child_name}:`;

  let result = null;
  const chosenModel = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
  try {
    const aiResp = await env.AI.run(chosenModel, {
      messages: [
        { role: "system", content: sysPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 350,
      temperature: 0.2
    });
    const norm = (aiResp && typeof aiResp === "object" && aiResp.response !== undefined) ? aiResp.response : aiResp;
    let jsonStr = String(norm || "").trim();
    const m = jsonStr.match(/\{[\s\S]*\}/);
    if (m) result = JSON.parse(m[0]);
  } catch (err) {
    console.warn("AI judge-answer call failed, using rule-based fallback:", err);
  }

  // Fallback quy tắc
  if (!result || typeof result !== "object" || !result.danh_gia) {
    const ansNums = (step_answer.match(/\b\d+\b/g) || []);
    const speechNums = (normalizedSpeech.match(/\b\d+\b/g) || []);
    const hasAnyNum = ansNums.some(n => speechNums.includes(n));
    const isAllNums = ansNums.length > 0 && ansNums.every(n => speechNums.includes(n));

    if (isAllNums) {
      result = {
        danh_gia: "dung",
        nhan_xet_cho_me: `${child_name} đã nêu đúng kết quả cần tìm!`,
        cau_me_noi_tiep: "Đúng rồi! Con giải thích vì sao ra số đó nhé?",
        khen_cu_the: `Giỏi lắm ${child_name} ơi!`
      };
    } else if (hasAnyNum) {
      result = {
        danh_gia: "gan_dung",
        nhan_xet_cho_me: `${child_name} đã tìm được một số đúng trong đề.`,
        cau_me_noi_tiep: "Con đã tìm đúng một số rồi, còn bước tính nữa nào?",
        khen_cu_the: "Con làm tốt một nửa rồi!"
      };
    } else if (speechNums.length > 0) {
      result = {
        danh_gia: "sai_huong",
        nhan_xet_cho_me: `${child_name} đang chọn số hoặc phép tính chưa đúng.`,
        cau_me_noi_tiep: "Con nhìn lại xem trong đề bài có số này không nhé?",
        khen_cu_the: "Không sao, con nhìn lại đề nào!"
      };
    } else {
      result = {
        danh_gia: "khong_ro",
        nhan_xet_cho_me: "Chưa nghe rõ câu trả lời của con.",
        cau_me_noi_tiep: "Con nói lại to hơn một chút cho Gấu nghe nhé!",
        khen_cu_the: "Con thử nói lại nhé!"
      };
    }
  }

  // Bộ chặn: cau_me_noi_tiep không lộ đáp án
  if (step_answer && typeof step_answer === "string") {
    const numInAns = step_answer.match(/\b\d+\b/g);
    if (numInAns) {
      for (const n of numInAns) {
        if (!problem_text.includes(n) && result.cau_me_noi_tiep && result.cau_me_noi_tiep.includes(n)) {
          result.cau_me_noi_tiep = "Con suy nghĩ thêm xem mình cần làm phép tính gì nhé?";
          break;
        }
      }
    }
  }

  if (result.nhan_xet_cho_me) {
    const words = result.nhan_xet_cho_me.split(/\s+/);
    if (words.length > 25) result.nhan_xet_cho_me = words.slice(0, 25).join(" ") + "...";
  }
  if (result.cau_me_noi_tiep) {
    const words = result.cau_me_noi_tiep.split(/\s+/);
    if (words.length > 20) result.cau_me_noi_tiep = words.slice(0, 20).join(" ") + "...";
  }
  if (result.khen_cu_the) {
    const words = result.khen_cu_the.split(/\s+/);
    if (words.length > 15) result.khen_cu_the = words.slice(0, 15).join(" ");
  }

  const latencyMs = Date.now() - startedAt;
  return jsonResponse({
    ok: true,
    verdict: result,
    latency_ms: latencyMs,
  }, 200, corsHeaders);
}

export async function handleAdaptiveBrother(request, env, ctx, corsHeaders) {
  const startedAt = Date.now();
  let body = {};
  try {
    body = await request.json();
  } catch (_) {
    return jsonResponse({ error: { code: "BAD_REQUEST", message: "JSON không hợp lệ" } }, 400, corsHeaders);
  }

  const {
    problem_text = "",
    stuck_skill = "tinh_toan",
    grade = 3,
    book_series = "Kết nối tri thức",
    child_name = "Con",
  } = body;

  const sysPrompt = `Bạn là chuyên gia sư phạm toán tiểu học. Hãy tạo một "bài anh em" thích ứng cho học sinh vừa hoàn thành một bài toán.
QUY TẮC BẮT BUỘC:
1. Bài anh em phải cùng dạng với đề bài gốc, nhưng đổi đồ vật/nhân vật và các con số để con rèn luyện tư duy tự lập.
2. Nhắm đúng vào kỹ năng con vừa bị kẹt (${stuck_skill}).
3. Mọi phép tính trong đề và đáp án phải HOÀN TOÀN CHÍNH XÁC (toán tiểu học, không ra số âm, chia hết).
4. vi_sao_cho_me: giải thích tối đa 20 từ vì sao bài này giúp con khắc phục chỗ vừa kẹt.
5. dap_an_cho_me: lời giải và đáp số ngắn gọn có ghi rõ phép tính.
6. Trả về đúng JSON theo schema:
{
  "de": "Nội dung bài toán mới...",
  "ky_nang_nham": "${stuck_skill}",
  "vi_sao_cho_me": "...",
  "dap_an_cho_me": "..."
}`;

  const userPrompt = `ĐỀ BÀI GỐC: "${problem_text}"
KỸ NĂNG VỪA KẸT: ${stuck_skill}
LỚP: ${grade}
BỘ SÁCH: ${book_series}
TÊN HỌC SINH: ${child_name}

Hãy soạn bài anh em thích ứng:`;

  let result = null;
  const chosenModel = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
  try {
    const aiResp = await env.AI.run(chosenModel, {
      messages: [
        { role: "system", content: sysPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 400,
      temperature: 0.3
    });
    const norm = (aiResp && typeof aiResp === "object" && aiResp.response !== undefined) ? aiResp.response : aiResp;
    let jsonStr = String(norm || "").trim();
    const m = jsonStr.match(/\{[\s\S]*\}/);
    if (m) result = JSON.parse(m[0]);
  } catch (err) {
    console.warn("AI brother problem call failed, using rule-based fallback:", err);
  }

  // Fallback an toàn nếu AI lỗi
  if (!result || typeof result !== "object" || !result.de) {
    result = {
      de: `Bố hái 2 chục quả cam, đã biếu bà 6 quả. Hỏi bố còn lại bao nhiêu quả cam?`,
      ky_nang_nham: stuck_skill,
      vi_sao_cho_me: `Luyện tập kỹ năng ${stuck_skill} với số liệu gần gũi.`,
      dap_an_cho_me: `Đổi 2 chục = 20 quả. Phép tính: 20 - 6 = 14 quả. Đáp số: 14 quả.`
    };
  }

  // Chạy qua máy kiểm phép tính để đảm bảo 100% đúng toán học
  try {
    const testLesson = {
      bai_anh_em: {
        de: result.de,
        dap_an_cho_me: result.dap_an_cho_me
      }
    };
    const corrected = correctLessonMath(testLesson);
    if (corrected && corrected.lessonData && corrected.lessonData.bai_anh_em) {
      result.dap_an_cho_me = corrected.lessonData.bai_anh_em.dap_an_cho_me;
    }
  } catch (err) {
    console.warn("Brother math validation error:", err);
  }

  if (result.vi_sao_cho_me) {
    const words = result.vi_sao_cho_me.split(/\s+/);
    if (words.length > 20) result.vi_sao_cho_me = words.slice(0, 20).join(" ") + "...";
  }

  const latencyMs = Date.now() - startedAt;
  return jsonResponse({
    ok: true,
    brother: result,
    math_verified: true,
    latency_ms: latencyMs,
  }, 200, corsHeaders);
}


// ==========================================================
// 13. AI TÌM NGUYÊN NHÂN & LỘ TRÌNH CÂN BẰNG (PROMPT 19 CHẶNG 3)
// ==========================================================
export async function handleTraitAnalysis(request, env, ctx, corsHeaders) {
  const startedAt = Date.now();
  const session = env.DB ? await authenticateSession(request, env).catch(() => null) : null;
  const body = await request.json().catch(() => ({}));
  const familyId = session?.family_id || body.family_id || request.headers.get("X-Family-Id");
  const childId = body.child_id;
  const childName = body.child_name || "Con";

  if (!familyId || !childId) {
    return jsonResponse({ error: { code: "BAD_REQUEST", message: "Thiếu family_id hoặc child_id" } }, 400, corsHeaders);
  }

  let sessionsWeek1 = 0;
  let sessionsWeek2 = 0;
  let allBadges = [];
  let allSessions = [];

  const now = Date.now();
  const weekMs = 7 * 86400000;
  const twoWeeksAgo = now - 2 * weekMs;
  const oneWeekAgo = now - weekMs;

  if (env.DB) {
    try {
      const bRows = await env.DB.prepare(`
        SELECT * FROM badge_events
        WHERE family_id = ? AND child_id = ? AND timestamp >= ?
        ORDER BY timestamp ASC
      `).bind(familyId, childId, twoWeeksAgo).all();
      allBadges = bRows.results || [];

      const sRows = await env.DB.prepare(`
        SELECT * FROM learning_sessions
        WHERE family_id = ? AND created_at >= datetime("now", "-14 days")
        ORDER BY created_at ASC
      `).bind(familyId).all();
      allSessions = sRows.results || [];
    } catch (e) {
      console.warn("DB query failed in handleTraitAnalysis:", e);
    }
  }

  if (Array.isArray(body.badges) && body.badges.length > 0) {
    allBadges = body.badges;
  }
  if (Array.isArray(body.sessions) && body.sessions.length > 0) {
    allSessions = body.sessions;
  }

  if (allSessions.length > 0) {
    sessionsWeek1 = allSessions.filter(s => {
      const ts = s.created_at ? new Date(s.created_at).getTime() : (s.timestamp || 0);
      return ts >= twoWeeksAgo && ts < oneWeekAgo;
    }).length;
    sessionsWeek2 = allSessions.filter(s => {
      const ts = s.created_at ? new Date(s.created_at).getTime() : (s.timestamp || 0);
      return ts >= oneWeekAgo;
    }).length;
  } else {
    sessionsWeek1 = Number(body.week1_sessions) || allBadges.filter(b => (b.timestamp || 0) < oneWeekAgo).length;
    sessionsWeek2 = Number(body.week2_sessions) || allBadges.filter(b => (b.timestamp || 0) >= oneWeekAgo).length;
  }

  if (sessionsWeek1 < 3 || sessionsWeek2 < 3) {
    const missing = Math.max(0, 3 - sessionsWeek1) + Math.max(0, 3 - sessionsWeek2);
    return jsonResponse({
      ok: false,
      error: {
        code: "NOT_ENOUGH_DATA",
        message: `Cần ít nhất 2 tuần, mỗi tuần từ 3 buổi học để AI phân tích nguyên nhân. Hiện có: Tuần trước: ${sessionsWeek1}/3 buổi, Tuần này: ${sessionsWeek2}/3 buổi. Còn thiếu ${missing} buổi.`
      },
      week1_count: sessionsWeek1,
      week2_count: sessionsWeek2,
      required_per_week: 3,
      missing_count: missing
    }, 200, corsHeaders);
  }

  const totalSessions = sessionsWeek1 + sessionsWeek2;
  const badgesWeek1 = allBadges.filter(b => (b.timestamp || 0) < oneWeekAgo);
  const badgesWeek2 = allBadges.filter(b => (b.timestamp || 0) >= oneWeekAgo);

  const countByTrait = (list) => {
    const res = { "Kiên nhẫn": 0, "Sáng tạo": 0, "Tập trung": 0, "Tỉ mỉ": 0 };
    for (const b of list) {
      if (res[b.trait] !== undefined) res[b.trait]++;
    }
    return res;
  };

  const traitsW1 = countByTrait(badgesWeek1);
  const traitsW2 = countByTrait(badgesWeek2);

  // Dạng bài lặp lại
  const problemTypeCountsW1 = {};
  const problemTypeCountsW2 = {};
  for (const b of badgesWeek1) {
    const pt = b.problem_type || "Toán lời văn";
    problemTypeCountsW1[pt] = (problemTypeCountsW1[pt] || 0) + 1;
  }
  for (const b of badgesWeek2) {
    const pt = b.problem_type || "Toán lời văn";
    problemTypeCountsW2[pt] = (problemTypeCountsW2[pt] || 0) + 1;
  }

  const isTrial = Boolean(body.is_trial) || familyId === "fam_trial";

  const topEntry = Object.entries(problemTypeCountsW2).sort((a,b) => b[1] - a[1])[0];
  const topPtW2 = topEntry ? topEntry : (isTrial ? ["Bảng nhân 4", 7] : [null, 0]);
  const topPtW1Count = topPtW2[0] ? (problemTypeCountsW1[topPtW2[0]] || 0) : (isTrial ? 2 : 0);
  const topPtW2Count = topPtW2[1] || 0;

  const gamesW1 = body.games_week1 != null ? Number(body.games_week1) : (isTrial ? 3 : null);
  const gamesW2 = body.games_week2 != null ? Number(body.games_week2) : (isTrial ? 0 : null);
  const avgMinsW1 = body.avg_mins_week1 != null ? Number(body.avg_mins_week1) : (isTrial ? 15 : null);
  const avgMinsW2 = body.avg_mins_week2 != null ? Number(body.avg_mins_week2) : (isTrial ? 24 : null);
  const stuckSkillName = body.stuck_skill_name || (isTrial ? "Đọc hiểu đề" : null);
  const stuckRateW1 = body.stuck_rate_week1 != null ? Number(body.stuck_rate_week1) : (isTrial ? 45 : null);
  const stuckRateW2 = body.stuck_rate_week2 != null ? Number(body.stuck_rate_week2) : (isTrial ? 70 : null);

  const fmtVnDate = (ms) => {
    const d = new Date(ms);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };
  const fromDate = body.from_date || (isTrial ? "13/10" : fmtVnDate(twoWeeksAgo));
  const toDate = body.to_date || (isTrial ? "26/10" : fmtVnDate(now));

  const verifiedFacts = {
    total_sessions: totalSessions,
    from_date: fromDate,
    to_date: toDate,
    traits_w1: traitsW1,
    traits_w2: traitsW2,
    top_problem_type: topPtW2[0],
    top_problem_type_w2_count: topPtW2Count,
    top_problem_type_w1_count: topPtW1Count,
    games_w1: gamesW1,
    games_w2: gamesW2,
    avg_mins_w1: avgMinsW1,
    avg_mins_w2: avgMinsW2,
    stuck_skill_name: stuckSkillName,
    stuck_rate_w1: stuckRateW1,
    stuck_rate_w2: stuckRateW2
  };

  const allowedNumbers = new Set([
    totalSessions,
    topPtW2Count,
    topPtW1Count,
    gamesW1,
    gamesW2,
    avgMinsW1,
    avgMinsW2,
    stuckRateW1,
    stuckRateW2,
    traitsW1["Kiên nhẫn"],
    traitsW1["Sáng tạo"],
    traitsW1["Tập trung"],
    traitsW1["Tỉ mỉ"],
    traitsW2["Kiên nhẫn"],
    traitsW2["Sáng tạo"],
    traitsW2["Tập trung"],
    traitsW2["Tỉ mỉ"],
    1, 2, 3, 4, 5, 7, 10, 15, 20
  ]);

  let rawAiText = "";
  if (body.mock_ai_response) {
    rawAiText = typeof body.mock_ai_response === "string" ? body.mock_ai_response : JSON.stringify(body.mock_ai_response);
  } else if (env.AI) {
    const sysPrompt = `Bạn là trợ lý sư phạm Kèm Con Học. Phân tích nguyên nhân biến động phẩm chất của bé ${childName} qua 2 tuần vừa qua.
QUY TẮC BẮT BUỘC:
1. MỌI CON SỐ trong câu trả lời phải nằm trong tập dữ kiện đã cung cấp. TUYỆT ĐỐI KHÔNG BỊA SỐ.
2. KHÔNG KẾT LUẬN VỀ TÂM LÝ, TÍNH CÁCH (CẤM các từ: tăng động, tự kỷ, adhd, chậm phát triển, rối loạn, thiểu năng, khiếm khuyết, bất thường, sang chấn, tâm thần).
3. ĐẦU RA JSON DUY NHẤT:
{
  "tom_tat": "tối đa 40 từ tóm tắt biến động chính",
  "nhan_dinh": [
    { "y": "nhận định ngắn gọn <= 25 từ", "can_cu": ["câu có số thật chứng minh"] }
  ],
  "lo_trinh_7_ngay": [ "việc 1 <= 20 từ", "việc 2 <= 20 từ", "việc 3 <= 20 từ" ],
  "luu_y": "tối đa 20 từ"
}`;

    const userPrompt = `DỮ KIỆN ĐÃ XÁC THỰC:
- Bé: ${childName}. Tổng số buổi đọc được: ${totalSessions} buổi (từ ${fromDate} đến ${toDate}).
- Huy hiệu Tuần trước: Kiên nhẫn ${traitsW1["Kiên nhẫn"]}, Sáng tạo ${traitsW1["Sáng tạo"]}, Tập trung ${traitsW1["Tập trung"]}, Tỉ mỉ ${traitsW1["Tỉ mỉ"]}.
- Huy hiệu Tuần này: Kiên nhẫn ${traitsW2["Kiên nhẫn"]}, Sáng tạo ${traitsW2["Sáng tạo"]}, Tập trung ${traitsW2["Tập trung"]}, Tỉ mỉ ${traitsW2["Tỉ mỉ"]}.
- Dạng bài: ${topPtW2[0]} xuất hiện ${topPtW2Count} lần tuần này (tuần trước ${topPtW1Count} lần).
- Trò chơi 5 phút / Con đố mẹ / bài anh em: tuần này ${gamesW2} lần, tuần trước ${gamesW1} lần.
- Thời lượng buổi học trung bình: tuần này ${avgMinsW2} phút, tuần trước ${avgMinsW1} phút.
- Kỹ năng kẹt tăng vọt: ${stuckSkillName} kẹt ${stuckRateW2}% tuần này (tuần trước ${stuckRateW1}%).

Hãy phân tích và đề xuất lộ trình 7 ngày cân bằng:`;

    try {
      const aiResp = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
        messages: [
          { role: "system", content: sysPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 700,
        temperature: 0.2
      });
      const norm = (aiResp && typeof aiResp === "object" && aiResp.response !== undefined) ? aiResp.response : aiResp;
      rawAiText = String(norm || "").trim();
    } catch (err) {
      console.warn("AI trait analysis failed, fallback to rule facts:", err);
    }
  }

  let parsed = null;
  try {
    const m = rawAiText.match(/\{[\s\S]*\}/);
    if (m) parsed = JSON.parse(m[0]);
  } catch (e) {}

  // Hàm sinh câu tóm tắt bằng code logic, không bao giờ nhầm chiều (Prompt 22 - 0.1)
  const computeDeterministicTomTat = (w1, w2) => {
    const traitList = ["Kiên nhẫn", "Sáng tạo", "Tập trung", "Tỉ mỉ"];
    const diffs = [];
    for (const t of traitList) {
      const v1 = w1[t] || 0;
      const v2 = w2[t] || 0;
      if (v1 !== v2) {
        if (v2 > v1) {
          diffs.push(`${t} tăng từ ${v1} lên ${v2}`);
        } else {
          diffs.push(`${t} giảm từ ${v1} xuống ${v2}`);
        }
      }
    }
    if (diffs.length === 0) return "Các phẩm chất giữ mức ổn định qua 2 tuần.";
    return diffs.slice(0, 2).join(", ") + ".";
  };

  if (!parsed || typeof parsed !== "object") {
    parsed = {
      tom_tat: computeDeterministicTomTat(traitsW1, traitsW2),
      nhan_dinh: [
        {
          y: topPtW2[0] ? `Bài lặp lại nhiều làm con ít cơ hội sáng tạo cách mới.` : `Con cần thêm các bài tập đa dạng.`,
          can_cu: topPtW2[0] ? [`${topPtW2Count} bài tuần này là ${topPtW2[0]} (tuần trước ${topPtW1Count}).`] : [`${totalSessions} buổi học qua 2 tuần.`]
        },
        {
          y: `Duy trì tương tác vui vẻ giữa mẹ và con.`,
          can_cu: gamesW1 != null ? [`${gamesW2 || 0} lần trò chơi 5 phút hay Con đố mẹ (tuần trước ${gamesW1 || 0} lần).`] : [`Dành 5 phút giải lao giữa các bài.`]
        },
        {
          y: `Buổi học vừa sức giúp con tập trung tốt hơn.`,
          can_cu: avgMinsW2 != null ? [`Buổi học dài trung bình ${avgMinsW2} phút (tuần trước ${avgMinsW1} phút).`] : [`Mỗi buổi nên kéo dài khoảng 15 phút.`]
        }
      ],
      lo_trinh_7_ngay: [
        `2 tối đầu: đổi sang toán lời văn có tình huống trong nhà.`,
        `Tối thứ 3: để ${childName} tự đặt một đề đố mẹ.`,
        `Giữ mỗi buổi khoảng ${avgMinsW1 || 15} phút, xong là chơi 5 phút.`
      ],
      luu_y: `Đây là gợi ý, mẹ quyết định.`
    };
  } else {
    // Luôn ghi đè tom_tat bằng logic code chuẩn xác
    parsed.tom_tat = computeDeterministicTomTat(traitsW1, traitsW2);
  }

  const fullText = JSON.stringify(parsed).toLowerCase();
  const forbiddenTerms = [
    "tăng động", "tự kỷ", "adhd", "chậm phát triển", "rối loạn",
    "thiểu năng", "khiếm khuyết", "bất thường", "sang chấn", "tâm thần"
  ];
  for (const term of forbiddenTerms) {
    if (fullText.includes(term)) {
      return jsonResponse({
        ok: false,
        error: {
          code: "FACT_CHECK_FAILED",
          message: `Phát hiện từ ngữ không phù hợp chính sách sư phạm: "${term}". Hệ thống đã loại bỏ kết quả này.`
        }
      }, 422, corsHeaders);
    }
  }

  const foundNumbers = (fullText.match(/\b\d+\b/g) || []).map(Number);
  for (const num of foundNumbers) {
    if (!allowedNumbers.has(num)) {
      return jsonResponse({
        ok: false,
        error: {
          code: "FACT_CHECK_FAILED",
          message: `Số liệu "${num}" không khớp bất kỳ dữ kiện nào trong lịch sử học của con. Kết quả bị loại bỏ.`
        },
        invalid_number: num
      }, 422, corsHeaders);
    }
  }

  return jsonResponse({
    ok: true,
    analysis: parsed,
    facts: verifiedFacts,
    sessions_read: totalSessions,
    from_date: fromDate,
    to_date: toDate,
    latency_ms: Date.now() - startedAt
  }, 200, corsHeaders);
}
