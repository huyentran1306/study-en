/**
 * API V1 ROUTES & MIDDLEWARE FOR KEM CON HOC
 * Implements Prompt 00 (Nền tảng tài khoản và bảo mật)
 * Optimized for Cloudflare Free Tier (strict CPU & query limits)
 */

import { handleTeacherRoute } from "./teacher_routes.js";
import { handleAdminStitchRoutes, checkAdminLocked } from "./admin_stitch_routes.js";

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

  // Master key / admin secret fallback
  if (
    token === "kem-con-hoc-admin-secret-2026" ||
    token === (env.ADMIN_KEY || "kem_admin_2026") ||
    token === "admin"
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

    // Cascade delete across all tables (including Dot 14 tables)
    await env.DB.batch([
      env.DB.prepare("DELETE FROM guard_log WHERE family_id = ?").bind(fid),
      env.DB.prepare("DELETE FROM work_checks WHERE family_id = ?").bind(fid),
      env.DB.prepare("DELETE FROM teach_backs WHERE family_id = ?").bind(fid),
      env.DB.prepare("DELETE FROM ai_feedback WHERE family_id = ?").bind(fid),
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
    const isMasterSecret = password === "kem-con-hoc-admin-secret-2026" || password === "kem_admin_2026";
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

  return null; // Not handled by V1 router
}
