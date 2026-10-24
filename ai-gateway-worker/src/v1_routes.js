/**
 * API V1 ROUTES & MIDDLEWARE FOR KEM CON HOC
 * Implements Prompt 00 (Nền tảng tài khoản và bảo mật)
 * Optimized for Cloudflare Free Tier (strict CPU & query limits)
 */

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
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return null;

  const tokenHash = await sha256Hex(token);
  const session = await env.DB.prepare(`
    SELECT s.token_hash, s.family_id, s.member_id, s.role, u.email
    FROM auth_sessions s
    JOIN admin_users u ON s.member_id = u.id
    WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP AND s.revoked_at IS NULL
    LIMIT 1
  `).bind(tokenHash).first();

  return session;
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

  // ==========================================================
  // 1. PUBLIC CONFIG (GET /api/v1/config/public)
  // ==========================================================
  if (pathname === "/api/v1/config/public" && method === "GET") {
    try {
      const keys = ["team_prompts_sync:v1", "prompt_studio:ai_config", "app_config:scope_rules"];
      const rows = await env.DB.prepare(`
        SELECT key, value FROM _kv_store WHERE key IN (?, ?, ?)
      `).bind(...keys).all();

      const configMap = {};
      for (const row of rows.results || []) {
        try {
          configMap[row.key] = JSON.parse(row.value);
        } catch {
          configMap[row.key] = row.value;
        }
      }

      return jsonResponse(
        {
          ok: true,
          prompts: configMap["team_prompts_sync:v1"] || null,
          aiConfig: configMap["prompt_studio:ai_config"] || null,
          scopeRules: configMap["app_config:scope_rules"] || null,
          serverTime: new Date().toISOString(),
        },
        200,
        {
          ...corsHeaders,
          "Cache-Control": "public, max-age=600", // Cache 10 mins as required by Free tier rules
        }
      );
    } catch (err) {
      return jsonResponse({ error: { code: "SERVER_ERROR", message: err.message } }, 500, corsHeaders);
    }
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
        const curTime = new Date(current.updated_at).getTime();
        const clientBaseTime = new Date(baseTs).getTime();
        // If server was updated more than 2s after client base timestamp -> Conflict
        if (curTime - clientBaseTime > 2000) {
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

    const body = await request.json().catch(() => ({}));
    const {
      id = "",
      childId = null,
      startedAt = new Date().toISOString(),
      source = "photo",
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
          subject, grade, problem_text, problem_type, method_rule_id,
          steps_total, scope_category, ai_latency_ms, ai_model, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        sessionId,
        session.family_id,
        childId,
        session.member_id,
        startedAt,
        source,
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

    // Cascade delete across all tables
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
    if (!timingSafeEqual(calcHash, admin.pass_hash)) {
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

  return null; // Not handled by V1 router
}
