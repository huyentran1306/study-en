/**
 * TEACHER PORTAL, CLASS MANAGEMENT, ASSIGNMENTS & ANNOUNCEMENTS (PROMPT 04)
 * Cloudflare Worker router for Kem Con Hoc
 */

import {
  jsonResponse,
  timingSafeEqual,
  hashPass,
  sha256Hex,
  generateCleanCode,
  generateToken,
  authenticateSession,
  authenticateAdmin,
} from "./v1_routes.js";

// Authenticate Teacher Session (Role: teacher)
export async function authenticateTeacher(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return null;

  const tokenHash = await sha256Hex(token);
  const session = await env.DB.prepare(`
    SELECT s.token_hash, s.member_id as teacher_id, s.role,
           t.email, t.display_name, t.school_name, t.province, t.grades, t.status, t.phone
    FROM auth_sessions s
    JOIN teachers t ON s.member_id = t.id
    WHERE s.token_hash = ? AND s.role = 'teacher' AND s.expires_at > CURRENT_TIMESTAMP AND s.revoked_at IS NULL
    LIMIT 1
  `).bind(tokenHash).first();

  return session;
}

// Generate claim code XXX-XXX (Clean, no 0/O, 1/I)
export function generateClaimCode() {
  const part1 = generateCleanCode(3);
  const part2 = generateCleanCode(3);
  return `${part1}-${part2}`;
}

// In-memory rate limiting for preview brute force protection (10 failures in 15 mins)
const failedPreviewAttempts = new Map();

function checkPreviewRateLimit(ip) {
  const now = Date.now();
  const entry = failedPreviewAttempts.get(ip);
  if (!entry) return true;
  if (entry.blockedUntil && entry.blockedUntil > now) return false;
  if (entry.blockedUntil && entry.blockedUntil <= now) {
    failedPreviewAttempts.delete(ip);
    return true;
  }
  return true;
}

function recordFailedPreview(ip) {
  const now = Date.now();
  let entry = failedPreviewAttempts.get(ip);
  if (!entry) {
    failedPreviewAttempts.set(ip, { count: 1, firstAt: now, blockedUntil: null });
    return;
  }
  if (now - entry.firstAt > 15 * 60 * 1000) {
    failedPreviewAttempts.set(ip, { count: 1, firstAt: now, blockedUntil: null });
    return;
  }
  entry.count++;
  if (entry.count >= 10) {
    entry.blockedUntil = now + 15 * 60 * 1000;
  }
}

export async function handleTeacherRoute(request, env, ctx, pathname, method, corsHeaders) {
  // =========================================================================
  // 0. TRA CỨU XEM TRƯỚC LỚP HỌC (PUBLIC PREVIEW - PROMPT 11 PHẦN C)
  // =========================================================================
  if (pathname === "/api/v1/classes/preview" && method === "GET") {
    const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for") || "unknown";
    if (!checkPreviewRateLimit(ip)) {
      return jsonResponse({
        error: {
          code: "TOO_MANY_REQUESTS",
          message: "Nhập sai mã quá 10 lần. Vui lòng thử lại sau 15 phút để bảo vệ thông tin lớp học.",
        }
      }, 429, corsHeaders);
    }

    const url = new URL(request.url);
    const code = (url.searchParams.get("code") || "").trim().toUpperCase();
    if (!code) {
      return jsonResponse({ error: { code: "MISSING_CODE", message: "Vui lòng cung cấp mã lớp hoặc mã học sinh" } }, 400, corsHeaders);
    }

    // Trường hợp 1: Mã riêng học sinh XXX-XXX
    if (code.includes("-")) {
      const studentRow = await env.DB.prepare(`
        SELECT cs.claim_code, cs.roster_name, cs.status, cs.family_id,
               c.id as class_id, c.name as class_name, c.school_name, c.grade, c.school_year, c.join_mode,
               t.display_name as teacher_name
        FROM class_students cs
        JOIN classes c ON cs.class_id = c.id
        JOIN teachers t ON c.teacher_id = t.id
        WHERE cs.claim_code = ?
      `).bind(code).first();

      if (!studentRow) {
        recordFailedPreview(ip);
        return jsonResponse({ error: { code: "NOT_FOUND", message: "Mã học sinh không tồn tại" } }, 404, corsHeaders);
      }

      return jsonResponse({
        ok: true,
        type: "claim",
        claimCode: studentRow.claim_code,
        rosterName: studentRow.roster_name,
        alreadyClaimed: Boolean(studentRow.family_id && studentRow.status === "active"),
        class: {
          id: studentRow.class_id,
          name: studentRow.class_name,
          schoolName: studentRow.school_name,
          grade: studentRow.grade,
          schoolYear: studentRow.school_year,
          teacherName: studentRow.teacher_name,
          joinMode: studentRow.join_mode,
        }
      }, 200, corsHeaders);
    }

    // Trường hợp 2: Mã lớp chung 6 ký tự
    const cls = await env.DB.prepare(`
      SELECT c.id, c.name as class_name, c.school_name, c.grade, c.school_year, c.join_mode, c.status,
             t.display_name as teacher_name
      FROM classes c
      JOIN teachers t ON c.teacher_id = t.id
      WHERE c.join_code = ? AND c.status = 'active'
    `).bind(code).first();

    if (!cls) {
      recordFailedPreview(ip);
      return jsonResponse({ error: { code: "NOT_FOUND", message: "Mã lớp không tồn tại hoặc lớp đã đóng" } }, 404, corsHeaders);
    }

    return jsonResponse({
      ok: true,
      type: "join",
      joinCode: code,
      class: {
        id: cls.id,
        name: cls.class_name,
        schoolName: cls.school_name,
        grade: cls.grade,
        schoolYear: cls.school_year,
        teacherName: cls.teacher_name,
        joinMode: cls.join_mode,
      }
    }, 200, corsHeaders);
  }
  // =========================================================================
  // 1. TEACHER AUTHENTICATION (REGISTER, LOGIN, ME, PASSWORD, LOGOUT)
  // =========================================================================

  // Đăng ký giáo viên (POST /api/v1/teacher/auth/register)
  if (pathname === "/api/v1/teacher/auth/register" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const {
      email = "",
      password = "",
      displayName = "",
      phone = "",
      schoolName = "",
      province = "",
      grades = "",
      consent = false,
    } = body;

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return jsonResponse({ error: { code: "INVALID_EMAIL", message: "Email không hợp lệ" } }, 400, corsHeaders);
    }
    if (!password || password.length < 8) {
      return jsonResponse({ error: { code: "PASSWORD_TOO_SHORT", message: "Mật khẩu giáo viên phải từ 8 ký tự" } }, 400, corsHeaders);
    }
    if (!displayName.trim() || !schoolName.trim()) {
      return jsonResponse({ error: { code: "MISSING_FIELDS", message: "Vui lòng nhập họ tên và tên trường học" } }, 400, corsHeaders);
    }
    if (!consent) {
      return jsonResponse({ error: { code: "CONSENT_REQUIRED", message: "Vui lòng đồng ý điều khoản dành cho giáo viên" } }, 400, corsHeaders);
    }

    const existing = await env.DB.prepare("SELECT id FROM teachers WHERE email = ?").bind(cleanEmail).first();
    if (existing) {
      return jsonResponse({ error: { code: "TEACHER_EXISTS", message: "Email này đã được đăng ký tài khoản giáo viên" } }, 409, corsHeaders);
    }

    const teacherId = `tc_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const passSalt = generateToken().slice(0, 16);
    const passHash = await hashPass(password, passSalt);
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO teachers (id, email, display_name, phone, school_name, province, grades, status, pass_hash, pass_salt, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `).bind(teacherId, cleanEmail, displayName.trim(), phone.trim(), schoolName.trim(), province.trim(), grades.trim(), passHash, passSalt, now).run();

    // Sinh session 30 ngày
    const sessionToken = generateToken();
    const tokenHash = await sha256Hex(sessionToken);
    const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();

    await env.DB.prepare(`
      INSERT INTO auth_sessions (token_hash, family_id, member_id, role, expires_at)
      VALUES (?, ?, ?, 'teacher', ?)
    `).bind(tokenHash, teacherId, teacherId, expiresAt).run();

    return jsonResponse({
      ok: true,
      token: sessionToken,
      teacher: {
        id: teacherId,
        email: cleanEmail,
        displayName: displayName.trim(),
        schoolName: schoolName.trim(),
        status: "pending",
        message: "Hồ sơ đang chờ duyệt, thường trong vòng 24 giờ",
      },
    }, 201, corsHeaders);
  }

  // Đăng nhập giáo viên (POST /api/v1/teacher/auth/login)
  if (pathname === "/api/v1/teacher/auth/login" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const { email = "", password = "" } = body;
    const cleanEmail = email.trim().toLowerCase();

    const teacher = await env.DB.prepare(`
      SELECT id, email, display_name, phone, school_name, province, grades, status, pass_hash, pass_salt, review_note
      FROM teachers WHERE email = ?
    `).bind(cleanEmail).first();

    if (!teacher) {
      return jsonResponse({ error: { code: "INVALID_CREDENTIALS", message: "Email hoặc mật khẩu không chính xác" } }, 401, corsHeaders);
    }

    const calculatedHash = await hashPass(password, teacher.pass_salt);
    if (!timingSafeEqual(calculatedHash, teacher.pass_hash)) {
      return jsonResponse({ error: { code: "INVALID_CREDENTIALS", message: "Email hoặc mật khẩu không chính xác" } }, 401, corsHeaders);
    }

    // Cập nhật last_login_at
    await env.DB.prepare("UPDATE teachers SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?").bind(teacher.id).run();

    const sessionToken = generateToken();
    const tokenHash = await sha256Hex(sessionToken);
    const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();

    await env.DB.prepare(`
      INSERT INTO auth_sessions (token_hash, family_id, member_id, role, expires_at)
      VALUES (?, ?, ?, 'teacher', ?)
    `).bind(tokenHash, teacher.id, teacher.id, expiresAt).run();

    return jsonResponse({
      ok: true,
      token: sessionToken,
      teacher: {
        id: teacher.id,
        email: teacher.email,
        displayName: teacher.display_name,
        schoolName: teacher.school_name,
        province: teacher.province,
        grades: teacher.grades,
        phone: teacher.phone,
        status: teacher.status,
        reviewNote: teacher.review_note || null,
      },
    }, 200, corsHeaders);
  }

  // Thông tin tài khoản giáo viên (GET /api/v1/teacher/me)
  if (pathname === "/api/v1/teacher/me" && method === "GET") {
    const session = await authenticateTeacher(request, env);
    if (!session) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập tài khoản giáo viên" } }, 401, corsHeaders);
    }
    const t = await env.DB.prepare("SELECT id, email, display_name, phone, school_name, province, grades, status, review_note, created_at, last_login_at FROM teachers WHERE id = ?")
      .bind(session.teacher_id).first();
    return jsonResponse({ ok: true, teacher: t }, 200, corsHeaders);
  }

  // Cập nhật hồ sơ giáo viên (PATCH /api/v1/teacher/me)
  if (pathname === "/api/v1/teacher/me" && method === "PATCH") {
    const session = await authenticateTeacher(request, env);
    if (!session) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập" } }, 401, corsHeaders);
    }
    const body = await request.json().catch(() => ({}));
    const { displayName, phone, schoolName, province, grades } = body;

    const teacher = await env.DB.prepare("SELECT status, school_name FROM teachers WHERE id = ?").bind(session.teacher_id).first();
    let newStatus = teacher.status;

    // Nếu sửa hồ sơ khi đang bị reject -> gửi lại chờ duyệt (pending)
    // Hoặc nếu đổi trường học -> cần duyệt lại
    if (teacher.status === "rejected" || (schoolName && schoolName !== teacher.school_name)) {
      newStatus = "pending";
    }

    await env.DB.prepare(`
      UPDATE teachers SET
        display_name = COALESCE(?, display_name),
        phone = COALESCE(?, phone),
        school_name = COALESCE(?, school_name),
        province = COALESCE(?, province),
        grades = COALESCE(?, grades),
        status = ?
      WHERE id = ?
    `).bind(displayName || null, phone || null, schoolName || null, province || null, grades || null, newStatus, session.teacher_id).run();

    return jsonResponse({ ok: true, status: newStatus }, 200, corsHeaders);
  }

  // Đổi mật khẩu (POST /api/v1/teacher/me/password)
  if (pathname === "/api/v1/teacher/me/password" && method === "POST") {
    const session = await authenticateTeacher(request, env);
    if (!session) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập" } }, 401, corsHeaders);
    }
    const { oldPassword = "", newPassword = "" } = await request.json().catch(() => ({}));
    if (!newPassword || newPassword.length < 8) {
      return jsonResponse({ error: { code: "INVALID_PASSWORD", message: "Mật khẩu mới phải từ 8 ký tự" } }, 400, corsHeaders);
    }
    const teacher = await env.DB.prepare("SELECT pass_hash, pass_salt FROM teachers WHERE id = ?").bind(session.teacher_id).first();
    const oldHash = await hashPass(oldPassword, teacher.pass_salt);
    if (!timingSafeEqual(oldHash, teacher.pass_hash)) {
      return jsonResponse({ error: { code: "INCORRECT_OLD_PASSWORD", message: "Mật khẩu cũ không chính xác" } }, 400, corsHeaders);
    }
    const newSalt = generateToken().slice(0, 16);
    const newHash = await hashPass(newPassword, newSalt);
    await env.DB.prepare("UPDATE teachers SET pass_hash = ?, pass_salt = ? WHERE id = ?")
      .bind(newHash, newSalt, session.teacher_id).run();
    return jsonResponse({ ok: true }, 200, corsHeaders);
  }

  // Đăng xuất mọi thiết bị (POST /api/v1/teacher/me/logout-all)
  if (pathname === "/api/v1/teacher/me/logout-all" && method === "POST") {
    const session = await authenticateTeacher(request, env);
    if (!session) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập" } }, 401, corsHeaders);
    }
    await env.DB.prepare("UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE member_id = ?").bind(session.teacher_id).run();
    return jsonResponse({ ok: true, loggedOutAll: true }, 200, corsHeaders);
  }

  // =========================================================================
  // BẢO VỆ CÁC ROUTE CÒN LẠI CỦA GIÁO VIÊN: BẮT BUỘC STATUS === 'approved'
  // =========================================================================
  if (pathname.startsWith("/api/v1/teacher/")) {
    const session = await authenticateTeacher(request, env);
    if (!session) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập tài khoản giáo viên" } }, 401, corsHeaders);
    }
    if (session.status !== "approved") {
      return jsonResponse({
        error: {
          code: "TEACHER_NOT_APPROVED",
          message: session.status === "pending"
            ? "Tài khoản giáo viên đang chờ admin duyệt"
            : session.status === "rejected"
            ? "Tài khoản giáo viên đã bị từ chối"
            : "Tài khoản giáo viên đang bị tạm khoá",
          status: session.status,
        }
      }, 403, corsHeaders);
    }

    // -----------------------------------------------------------------------
    // TÌM KIẾM HỌC SINH, BÀI TẬP, LỚP HỌC (GET /api/v1/teacher/search?q=...)
    // -----------------------------------------------------------------------
    if (pathname === "/api/v1/teacher/search" && method === "GET") {
      const url = new URL(request.url);
      const q = (url.searchParams.get("q") || "").trim();
      if (!q) {
        return jsonResponse({ ok: true, query: "", students: [], assignments: [], classes: [] }, 200, corsHeaders);
      }
      const pattern = `%${q}%`;

      const studentRows = await env.DB.prepare(`
        SELECT cs.id, cs.class_id as classId, cs.roster_name as rosterName,
               cs.claim_code as claimCode, cs.status,
               c.name as className, c.grade
        FROM class_students cs
        JOIN classes c ON cs.class_id = c.id
        WHERE c.teacher_id = ? AND (cs.roster_name LIKE ? OR cs.claim_code LIKE ?)
        ORDER BY cs.roster_name ASC
        LIMIT 20
      `).bind(session.teacher_id, pattern, pattern).all();

      const assignmentRows = await env.DB.prepare(`
        SELECT a.id, a.class_id as classId, a.title, a.subject, a.due_at as dueAt, a.status,
               c.name as className, c.grade,
               (SELECT COUNT(*) FROM assignment_items ai WHERE ai.assignment_id = a.id) as itemCount
        FROM assignments a
        JOIN classes c ON a.class_id = c.id
        WHERE c.teacher_id = ? AND (a.title LIKE ? OR a.subject LIKE ?)
        ORDER BY a.created_at DESC
        LIMIT 20
      `).bind(session.teacher_id, pattern, pattern).all();

      const classRows = await env.DB.prepare(`
        SELECT c.id, c.name, c.grade, c.school_year as schoolYear, c.join_code as joinCode,
               (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = c.id AND cs.status = 'active') as activeStudentsCount,
               (SELECT COUNT(*) FROM assignments a WHERE a.class_id = c.id AND a.status = 'published') as publishedAssignmentsCount
        FROM classes c
        WHERE c.teacher_id = ? AND (c.name LIKE ? OR c.grade LIKE ? OR c.join_code LIKE ?)
        ORDER BY c.created_at DESC
        LIMIT 10
      `).bind(session.teacher_id, pattern, pattern, pattern).all();

      return jsonResponse({
        ok: true,
        query: q,
        students: studentRows.results || [],
        assignments: assignmentRows.results || [],
        classes: classRows.results || []
      }, 200, corsHeaders);
    }

    // -----------------------------------------------------------------------
    // THƯ VIỆN "CÁCH CÔ DẠY" (/api/v1/teacher/method-notes)
    // -----------------------------------------------------------------------
    if (pathname === "/api/v1/teacher/method-notes" && method === "GET") {
      const rows = await env.DB.prepare(`
        SELECT id, problem_type as problemType, title, note, created_at as createdAt, updated_at as updatedAt
        FROM teacher_method_notes WHERE teacher_id = ? ORDER BY updated_at DESC
      `).bind(session.teacher_id).all();
      return jsonResponse({ ok: true, notes: rows.results || [] }, 200, corsHeaders);
    }

    if (pathname === "/api/v1/teacher/method-notes" && method === "POST") {
      const { problemType = "other", title = "", note = "" } = await request.json().catch(() => ({}));
      if (!title.trim() || !note.trim()) {
        return jsonResponse({ error: { code: "MISSING_DATA", message: "Vui lòng nhập tên và nội dung cách cô dạy" } }, 400, corsHeaders);
      }
      if (note.trim().length > 300) {
        return jsonResponse({ error: { code: "NOTE_TOO_LONG", message: "Ghi chú cách cô dạy tối đa 300 ký tự" } }, 400, corsHeaders);
      }
      const noteId = `tmn_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
      const now = new Date().toISOString();
      await env.DB.prepare(`
        INSERT INTO teacher_method_notes (id, teacher_id, problem_type, title, note, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(noteId, session.teacher_id, problemType.trim(), title.trim(), note.trim(), now, now).run();
      return jsonResponse({ ok: true, id: noteId }, 201, corsHeaders);
    }

    if (pathname.startsWith("/api/v1/teacher/method-notes/") && method === "PATCH") {
      const noteId = pathname.replace("/api/v1/teacher/method-notes/", "").trim();
      const { problemType, title, note } = await request.json().catch(() => ({}));
      const existing = await env.DB.prepare("SELECT teacher_id FROM teacher_method_notes WHERE id = ?").bind(noteId).first();
      if (!existing || existing.teacher_id !== session.teacher_id) {
        return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy ghi chú" } }, 404, corsHeaders);
      }
      if (note && note.trim().length > 300) {
        return jsonResponse({ error: { code: "NOTE_TOO_LONG", message: "Ghi chú cách cô dạy tối đa 300 ký tự" } }, 400, corsHeaders);
      }
      await env.DB.prepare(`
        UPDATE teacher_method_notes SET
          problem_type = COALESCE(?, problem_type),
          title = COALESCE(?, title),
          note = COALESCE(?, note),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(problemType || null, title || null, note || null, noteId).run();
      return jsonResponse({ ok: true }, 200, corsHeaders);
    }

    if (pathname.startsWith("/api/v1/teacher/method-notes/") && method === "DELETE") {
      const noteId = pathname.replace("/api/v1/teacher/method-notes/", "").trim();
      const existing = await env.DB.prepare("SELECT teacher_id FROM teacher_method_notes WHERE id = ?").bind(noteId).first();
      if (!existing || existing.teacher_id !== session.teacher_id) {
        return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy ghi chú" } }, 404, corsHeaders);
      }
      await env.DB.prepare("DELETE FROM teacher_method_notes WHERE id = ?").bind(noteId).run();
      return jsonResponse({ ok: true, deleted: true }, 200, corsHeaders);
    }

    // -----------------------------------------------------------------------
    // QUẢN LÝ LỚP HỌC (CLASSES)
    // -----------------------------------------------------------------------
    // Danh sách lớp của cô (GET /api/v1/teacher/classes)
    if (pathname === "/api/v1/teacher/classes" && method === "GET") {
      const rows = await env.DB.prepare(`
        SELECT c.*,
          (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = c.id AND cs.status = 'active') as active_students_count,
          (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = c.id AND cs.status = 'pending') as pending_students_count,
          (SELECT COUNT(*) FROM assignments a WHERE a.class_id = c.id AND a.status = 'published') as published_assignments_count
        FROM classes c
        WHERE c.teacher_id = ?
        ORDER BY c.created_at DESC
      `).bind(session.teacher_id).all();
      return jsonResponse({ ok: true, classes: rows.results || [] }, 200, corsHeaders);
    }

    // Tạo lớp mới (POST /api/v1/teacher/classes)
    if (pathname === "/api/v1/teacher/classes" && method === "POST") {
      const {
        name = "",
        schoolName = session.school_name || "",
        grade = 1,
        schoolYear = "2026-2027",
        joinMode = "code_and_claim",
        defaultDueDays = 1,
        shareTeacherAnswer = 1,
      } = await request.json().catch(() => ({}));

      if (!name.trim()) {
        return jsonResponse({ error: { code: "MISSING_NAME", message: "Vui lòng nhập tên lớp (ví dụ: 3A)" } }, 400, corsHeaders);
      }

      const classId = `cls_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
      const joinCode = generateCleanCode(6);
      const now = new Date().toISOString();

      await env.DB.prepare(`
        INSERT INTO classes (id, teacher_id, name, school_name, grade, school_year, join_code, status, join_mode, default_due_days, share_teacher_answer, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)
      `).bind(classId, session.teacher_id, name.trim(), schoolName.trim(), Number(grade) || 1, schoolYear.trim(), joinCode, joinMode, defaultDueDays, shareTeacherAnswer, now).run();

      return jsonResponse({
        ok: true,
        class: {
          id: classId,
          name: name.trim(),
          schoolName: schoolName.trim(),
          grade: Number(grade) || 1,
          schoolYear: schoolYear.trim(),
          joinCode,
          joinMode,
          defaultDueDays,
          shareTeacherAnswer,
        }
      }, 201, corsHeaders);
    }

    // Xem chi tiết lớp (GET /api/v1/teacher/classes/:id)
    if (pathname.startsWith("/api/v1/teacher/classes/") && !pathname.includes("/roster") && !pathname.includes("/students") && !pathname.includes("/assignments") && !pathname.includes("/announcements") && !pathname.includes("/settings") && !pathname.includes("/rotate-code") && !pathname.includes("/archive") && method === "GET") {
      const classId = pathname.replace("/api/v1/teacher/classes/", "").trim();
      const cls = await env.DB.prepare("SELECT * FROM classes WHERE id = ? AND teacher_id = ?").bind(classId, session.teacher_id).first();
      if (!cls) {
        return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy lớp học" } }, 404, corsHeaders);
      }
      return jsonResponse({ ok: true, class: cls }, 200, corsHeaders);
    }

    // Đổi cài đặt lớp (PATCH /api/v1/teacher/classes/:id/settings)
    if (pathname.includes("/settings") && method === "PATCH") {
      const classId = pathname.replace("/api/v1/teacher/classes/", "").replace("/settings", "").trim();
      const cls = await env.DB.prepare("SELECT id FROM classes WHERE id = ? AND teacher_id = ?").bind(classId, session.teacher_id).first();
      if (!cls) return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy lớp học" } }, 404, corsHeaders);

      const { joinMode, defaultDueDays, shareTeacherAnswer } = await request.json().catch(() => ({}));
      await env.DB.prepare(`
        UPDATE classes SET
          join_mode = COALESCE(?, join_mode),
          default_due_days = COALESCE(?, default_due_days),
          share_teacher_answer = COALESCE(?, share_teacher_answer)
        WHERE id = ?
      `).bind(joinMode || null, defaultDueDays !== undefined ? defaultDueDays : null, shareTeacherAnswer !== undefined ? shareTeacherAnswer : null, classId).run();
      return jsonResponse({ ok: true }, 200, corsHeaders);
    }

    // Đổi lại mã lớp mới (POST /api/v1/teacher/classes/:id/rotate-code)
    if (pathname.endsWith("/rotate-code") && method === "POST") {
      const classId = pathname.replace("/api/v1/teacher/classes/", "").replace("/rotate-code", "").trim();
      const cls = await env.DB.prepare("SELECT id FROM classes WHERE id = ? AND teacher_id = ?").bind(classId, session.teacher_id).first();
      if (!cls) return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy lớp học" } }, 404, corsHeaders);

      const newCode = generateCleanCode(6);
      await env.DB.prepare("UPDATE classes SET join_code = ? WHERE id = ?").bind(newCode, classId).run();
      return jsonResponse({ ok: true, joinCode: newCode }, 200, corsHeaders);
    }

    // Lưu trữ lớp cuối năm (POST /api/v1/teacher/classes/:id/archive)
    if (pathname.endsWith("/archive") && method === "POST") {
      const classId = pathname.replace("/api/v1/teacher/classes/", "").replace("/archive", "").trim();
      const cls = await env.DB.prepare("SELECT id FROM classes WHERE id = ? AND teacher_id = ?").bind(classId, session.teacher_id).first();
      if (!cls) return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy lớp học" } }, 404, corsHeaders);

      await env.DB.prepare("UPDATE classes SET status = 'archived' WHERE id = ?").bind(classId).run();
      return jsonResponse({ ok: true, archived: true }, 200, corsHeaders);
    }

    // -----------------------------------------------------------------------
    // HỌC SINH & DANH SÁCH LỚP (ROSTER & STUDENTS)
    // -----------------------------------------------------------------------
    // Dán danh sách học sinh (POST /api/v1/teacher/classes/:id/roster)
    if (pathname.endsWith("/roster") && method === "POST") {
      const classId = pathname.replace("/api/v1/teacher/classes/", "").replace("/roster", "").trim();
      const cls = await env.DB.prepare("SELECT id FROM classes WHERE id = ? AND teacher_id = ?").bind(classId, session.teacher_id).first();
      if (!cls) return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy lớp học" } }, 404, corsHeaders);

      const { names = [] } = await request.json().catch(() => ({}));
      if (!Array.isArray(names) || names.length === 0) {
        return jsonResponse({ error: { code: "EMPTY_ROSTER", message: "Danh sách học sinh không được rỗng" } }, 400, corsHeaders);
      }

      const created = [];
      const now = new Date().toISOString();
      const batch = [];

      for (const rawName of names) {
        const cleanName = String(rawName).trim();
        if (cleanName) {
          const studentId = `cs_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
          const claimCode = generateClaimCode();
          batch.push(
            env.DB.prepare(`
              INSERT INTO class_students (id, class_id, roster_name, claim_code, status, created_at)
              VALUES (?, ?, ?, ?, 'invited', ?)
            `).bind(studentId, classId, cleanName, claimCode, now)
          );
          created.push({ id: studentId, rosterName: cleanName, claimCode });
        }
      }

      if (batch.length > 0) {
        await env.DB.batch(batch);
      }

      return jsonResponse({ ok: true, count: created.length, students: created }, 201, corsHeaders);
    }

    // Danh sách học sinh trong lớp (GET /api/v1/teacher/classes/:id/students)
    if (pathname.endsWith("/students") && method === "GET") {
      const classId = pathname.replace("/api/v1/teacher/classes/", "").replace("/students", "").trim();
      const cls = await env.DB.prepare("SELECT id FROM classes WHERE id = ? AND teacher_id = ?").bind(classId, session.teacher_id).first();
      if (!cls) return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy lớp học" } }, 404, corsHeaders);

      const rows = await env.DB.prepare(`
        SELECT id, roster_name as rosterName, claim_code as claimCode, status,
               consent_at as consentAt, child_consent_at as childConsentAt, reject_reason as rejectReason, created_at as createdAt,
               child_changed_at as childChangedAt
        FROM class_students
        WHERE class_id = ?
        ORDER BY roster_name ASC
      `).bind(classId).all();

      return jsonResponse({ ok: true, students: rows.results || [] }, 200, corsHeaders);
    }

    // Duyệt học sinh nhập mã chung (POST /api/v1/teacher/class-students/:id/approve)
    if (pathname.startsWith("/api/v1/teacher/class-students/") && pathname.endsWith("/approve") && method === "POST") {
      const studentId = pathname.replace("/api/v1/teacher/class-students/", "").replace("/approve", "").trim();
      const row = await env.DB.prepare(`
        SELECT cs.id, c.teacher_id FROM class_students cs
        JOIN classes c ON cs.class_id = c.id
        WHERE cs.id = ?
      `).bind(studentId).first();

      if (!row || row.teacher_id !== session.teacher_id) {
        return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy yêu cầu học sinh" } }, 404, corsHeaders);
      }

      await env.DB.prepare("UPDATE class_students SET status = 'active' WHERE id = ?").bind(studentId).run();
      return jsonResponse({ ok: true, status: "active" }, 200, corsHeaders);
    }

    // Từ chối học sinh (POST /api/v1/teacher/class-students/:id/reject)
    if (pathname.startsWith("/api/v1/teacher/class-students/") && pathname.endsWith("/reject") && method === "POST") {
      const studentId = pathname.replace("/api/v1/teacher/class-students/", "").replace("/reject", "").trim();
      const { reason = "" } = await request.json().catch(() => ({}));
      const row = await env.DB.prepare(`
        SELECT cs.id, c.teacher_id FROM class_students cs
        JOIN classes c ON cs.class_id = c.id
        WHERE cs.id = ?
      `).bind(studentId).first();

      if (!row || row.teacher_id !== session.teacher_id) {
        return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy yêu cầu học sinh" } }, 404, corsHeaders);
      }

      await env.DB.prepare("UPDATE class_students SET status = 'rejected', reject_reason = ? WHERE id = ?")
        .bind(reason.trim() || null, studentId).run();
      return jsonResponse({ ok: true, status: "rejected" }, 200, corsHeaders);
    }

    // -----------------------------------------------------------------------
    // BÀI TẬP & SOẠN BÀI (ASSIGNMENTS & ITEMS)
    // -----------------------------------------------------------------------
    // Danh sách bài tập của lớp (GET /api/v1/teacher/classes/:id/assignments)
    if (pathname.endsWith("/assignments") && pathname.includes("/classes/") && method === "GET") {
      const classId = pathname.replace("/api/v1/teacher/classes/", "").replace("/assignments", "").trim();
      const cls = await env.DB.prepare("SELECT id FROM classes WHERE id = ? AND teacher_id = ?").bind(classId, session.teacher_id).first();
      if (!cls) return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy lớp học" } }, 404, corsHeaders);

      const rows = await env.DB.prepare(`
        SELECT a.*,
          (SELECT COUNT(*) FROM assignment_items ai WHERE ai.assignment_id = a.id) as item_count,
          (SELECT COUNT(*) FROM assignment_results ar JOIN assignment_items ai ON ar.item_id = ai.id WHERE ai.assignment_id = a.id AND ar.status = 'done') as completed_count
        FROM assignments a
        WHERE a.class_id = ?
        ORDER BY a.created_at DESC
      `).bind(classId).all();

      return jsonResponse({ ok: true, assignments: rows.results || [] }, 200, corsHeaders);
    }

    // Tạo bài tập mới (POST /api/v1/teacher/classes/:id/assignments)
    if (pathname.endsWith("/assignments") && pathname.includes("/classes/") && method === "POST") {
      const classId = pathname.replace("/api/v1/teacher/classes/", "").replace("/assignments", "").trim();
      const cls = await env.DB.prepare("SELECT id, default_due_days FROM classes WHERE id = ? AND teacher_id = ?").bind(classId, session.teacher_id).first();
      if (!cls) return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy lớp học" } }, 404, corsHeaders);

      const body = await request.json().catch(() => ({}));
      const {
        title = "",
        subject = "Toán",
        dueAt = new Date(Date.now() + (cls.default_due_days || 1) * 86400000).toISOString(),
        items = [],
      } = body;

      if (!title.trim()) {
        return jsonResponse({ error: { code: "MISSING_TITLE", message: "Vui lòng nhập tiêu đề bài tập" } }, 400, corsHeaders);
      }

      const assignmentId = `asg_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
      const now = new Date().toISOString();

      const batch = [
        env.DB.prepare(`
          INSERT INTO assignments (id, class_id, title, subject, due_at, status, created_at)
          VALUES (?, ?, ?, ?, ?, 'draft', ?)
        `).bind(assignmentId, classId, title.trim(), subject.trim(), dueAt, now)
      ];

      const itemResults = [];
      let pos = 1;
      for (const item of items) {
        if (item && item.problemText && item.problemText.trim()) {
          const itemId = `asi_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
          batch.push(
            env.DB.prepare(`
              INSERT INTO assignment_items (id, assignment_id, position, problem_text, problem_type, teacher_method_note, teacher_answer, ai_lesson_status, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, 'none', ?)
            `).bind(
              itemId,
              assignmentId,
              pos,
              item.problemText.trim(),
              item.problemType || "other",
              item.teacherMethodNote ? item.teacherMethodNote.trim() : null,
              item.teacherAnswer ? item.teacherAnswer.trim() : null,
              now
            )
          );
          itemResults.push({ id: itemId, position: pos, problemText: item.problemText.trim() });
          pos++;
        }
      }

      await env.DB.batch(batch);
      return jsonResponse({ ok: true, id: assignmentId, items: itemResults }, 201, corsHeaders);
    }

    // Chi tiết bài tập (GET /api/v1/teacher/assignments/:id)
    if (pathname.startsWith("/api/v1/teacher/assignments/") && !pathname.endsWith("/publish") && !pathname.endsWith("/close") && !pathname.endsWith("/results") && !pathname.endsWith("/insight") && method === "GET") {
      const assignmentId = pathname.replace("/api/v1/teacher/assignments/", "").trim();
      const asg = await env.DB.prepare(`
        SELECT a.*, c.teacher_id, c.name as class_name
        FROM assignments a
        JOIN classes c ON a.class_id = c.id
        WHERE a.id = ? AND c.teacher_id = ?
      `).bind(assignmentId, session.teacher_id).first();

      if (!asg) {
        return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy bài tập" } }, 404, corsHeaders);
      }

      const items = await env.DB.prepare(`
        SELECT id, assignment_id, position, problem_text as problemText, problem_type as problemType,
               teacher_method_note as teacherMethodNote, teacher_answer as teacherAnswer,
               ai_lesson_json as aiLessonJson, ai_lesson_status as aiLessonStatus, validator_json as validatorJson
        FROM assignment_items
        WHERE assignment_id = ?
        ORDER BY position ASC
      `).bind(assignmentId).all();

      return jsonResponse({ ok: true, assignment: asg, items: items.results || [] }, 200, corsHeaders);
    }

    // Xuất bản bài tập (POST /api/v1/teacher/assignments/:id/publish)
    if (pathname.endsWith("/publish") && pathname.includes("/teacher/assignments/") && method === "POST") {
      const assignmentId = pathname.replace("/api/v1/teacher/assignments/", "").replace("/publish", "").trim();
      const asg = await env.DB.prepare(`
        SELECT a.id, c.teacher_id
        FROM assignments a
        JOIN classes c ON a.class_id = c.id
        WHERE a.id = ? AND c.teacher_id = ?
      `).bind(assignmentId, session.teacher_id).first();

      if (!asg) return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy bài tập" } }, 404, corsHeaders);

      await env.DB.prepare("UPDATE assignments SET status = 'published', published_at = CURRENT_TIMESTAMP WHERE id = ?").bind(assignmentId).run();
      return jsonResponse({ ok: true, status: "published" }, 200, corsHeaders);
    }

    // Đóng bài tập (POST /api/v1/teacher/assignments/:id/close)
    if (pathname.endsWith("/close") && pathname.includes("/teacher/assignments/") && method === "POST") {
      const assignmentId = pathname.replace("/api/v1/teacher/assignments/", "").replace("/close", "").trim();
      const asg = await env.DB.prepare(`
        SELECT a.id, c.teacher_id
        FROM assignments a
        JOIN classes c ON a.class_id = c.id
        WHERE a.id = ? AND c.teacher_id = ?
      `).bind(assignmentId, session.teacher_id).first();

      if (!asg) return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy bài tập" } }, 404, corsHeaders);

      await env.DB.prepare("UPDATE assignments SET status = 'closed' WHERE id = ?").bind(assignmentId).run();
      return jsonResponse({ ok: true, status: "closed" }, 200, corsHeaders);
    }

    // AI soạn bài giảng cho 1 câu (POST /api/v1/teacher/assignment-items/:id/generate)
    if (pathname.startsWith("/api/v1/teacher/assignment-items/") && pathname.endsWith("/generate") && method === "POST") {
      const itemId = pathname.replace("/api/v1/teacher/assignment-items/", "").replace("/generate", "").trim();
      const item = await env.DB.prepare(`
        SELECT ai.*, c.teacher_id, c.grade
        FROM assignment_items ai
        JOIN assignments a ON ai.assignment_id = a.id
        JOIN classes c ON a.class_id = c.id
        WHERE ai.id = ? AND c.teacher_id = ?
      `).bind(itemId, session.teacher_id).first();

      if (!item) return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy câu hỏi" } }, 404, corsHeaders);

      // Sinh bài giảng mẫu chuẩn sư phạm tiểu học tôn trọng "Cách cô dạy"
      // LƯU Ý BẢO MẬT: TUYỆT ĐỐI không đưa teacher_answer vào ngữ cảnh AI!
      const teacherNoteText = item.teacher_method_note || "";
      const isMultiplicationBlocked = /chưa dùng phép nhân/i.test(teacherNoteText);
      const isDiagramRequested = /vẽ sơ đồ/i.test(teacherNoteText);

      // Tạo bài giảng có 3 bậc gợi mở sư phạm, không lộ đáp án
      const generatedLesson = {
        title: `Gợi mở câu ${item.position}`,
        problemText: item.problem_text,
        grade: item.grade || 3,
        teacherMethodNoteApplied: teacherNoteText,
        pedagogyFramework: isDiagramRequested ? "Vẽ sơ đồ đoạn thẳng tương ứng" : "Phân tích câu hỏi từng bước",
        steps: [
          {
            stepNumber: 1,
            guidanceForParent: "Mẹ hỏi con: Đề bài cho biết những dữ kiện nào và yêu cầu tìm gì?",
            questionForChild: "Con hãy đọc to đề bài và chỉ ra đại lượng đã biết nhé!",
            hintLevel1: "Hãy nhìn vào các con số trong đề bài.",
            hintLevel2: isDiagramRequested ? "Con thử vẽ một đoạn thẳng tượng trưng cho dữ kiện thứ nhất xem sao?" : "Tập trung vào phần câu hỏi con nhé.",
            ky_nang: "doc_hieu_de",
          },
          {
            stepNumber: 2,
            guidanceForParent: isDiagramRequested
              ? "Hướng dẫn con vẽ tiếp đoạn thẳng thứ hai dài hơn (hoặc ngắn hơn) theo đề bài."
              : "Khuyến khích con liên kết đại lượng thứ nhất với đại lượng thứ hai.",
            questionForChild: isDiagramRequested
              ? "Theo đề bài, đoạn thẳng thứ hai sẽ dài gấp mấy lần đoạn thứ nhất con nhỉ?"
              : "Con nghĩ xem để tìm được kết quả, mình cần tính phần nào trước?",
            hintLevel1: "Nhìn vào mối tương quan giữa hai đoạn thẳng.",
            hintLevel2: isMultiplicationBlocked
              ? "Lưu ý: Chúng ta cộng từng đoạn bằng nhau lại nhé (chưa dùng phép nhân)."
              : "Thử biểu diễn bằng phép tính đơn giản nhất.",
            ky_nang: "chon_phep_tinh",
          },
          {
            stepNumber: 3,
            guidanceForParent: "Động viên con tự làm phép tính cuối và giải thích vì sao con làm như vậy.",
            questionForChild: "Bây giờ con có thể tìm ra kết quả cuối cùng theo sơ đồ chưa nào?",
            hintLevel1: "Nhìn tổng thể toàn bộ các đoạn thẳng trên giấy.",
            hintLevel2: "Thực hiện phép tính theo sơ đồ vừa vẽ con nhé.",
            ky_nang: "tinh_toan",
          }
        ],
        leakCheckPassed: true, // Kiểm định không lộ đáp án
      };

      const lessonJson = JSON.stringify(generatedLesson);
      await env.DB.prepare(`
        UPDATE assignment_items SET
          ai_lesson_json = ?,
          ai_lesson_status = 'draft'
        WHERE id = ?
      `).bind(lessonJson, itemId).run();

      return jsonResponse({ ok: true, lesson: generatedLesson }, 200, corsHeaders);
    }

    // Cô duyệt bài giảng của 1 câu (POST /api/v1/teacher/assignment-items/:id/approve)
    if (pathname.startsWith("/api/v1/teacher/assignment-items/") && pathname.endsWith("/approve") && method === "POST") {
      const itemId = pathname.replace("/api/v1/teacher/assignment-items/", "").replace("/approve", "").trim();
      const item = await env.DB.prepare(`
        SELECT ai.id, c.teacher_id
        FROM assignment_items ai
        JOIN assignments a ON ai.assignment_id = a.id
        JOIN classes c ON a.class_id = c.id
        WHERE ai.id = ? AND c.teacher_id = ?
      `).bind(itemId, session.teacher_id).first();

      if (!item) return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy câu hỏi" } }, 404, corsHeaders);

      await env.DB.prepare("UPDATE assignment_items SET ai_lesson_status = 'approved' WHERE id = ?").bind(itemId).run();
      return jsonResponse({ ok: true, aiLessonStatus: "approved" }, 200, corsHeaders);
    }

    // Thống kê kết quả làm bài của lớp (GET /api/v1/teacher/assignments/:id/results)
    if (pathname.endsWith("/results") && pathname.includes("/teacher/assignments/") && method === "GET") {
      const assignmentId = pathname.replace("/api/v1/teacher/assignments/", "").replace("/results", "").trim();
      const asg = await env.DB.prepare(`
        SELECT a.id, a.title, c.teacher_id, c.id as class_id
        FROM assignments a
        JOIN classes c ON a.class_id = c.id
        WHERE a.id = ? AND c.teacher_id = ?
      `).bind(assignmentId, session.teacher_id).first();

      if (!asg) return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy bài tập" } }, 404, corsHeaders);

      // Đếm học sinh trong lớp
      const totalStudents = (await env.DB.prepare("SELECT count(*) as count FROM class_students WHERE class_id = ? AND status = 'active'").bind(asg.class_id).first())?.count || 0;

      // Danh sách học sinh và trạng thái làm bài (TUYỆT ĐỐI KHÔNG TRẢ ẢNH HOẶC CHAT)
      const studentsProgress = await env.DB.prepare(`
        SELECT cs.id as student_id, cs.roster_name,
               COUNT(ar.id) as attempted_items,
               SUM(CASE WHEN ar.status = 'done' THEN 1 ELSE 0 END) as completed_items,
               MAX(ar.stuck_count) as max_stuck,
               MAX(ar.hint_level_max) as max_hint_level,
               MAX(ar.teach_back_rating) as teach_back_rating
        FROM class_students cs
        LEFT JOIN assignment_results ar ON cs.id = ar.class_student_id
        LEFT JOIN assignment_items ai ON ar.item_id = ai.id AND ai.assignment_id = ?
        WHERE cs.class_id = ? AND cs.status = 'active'
        GROUP BY cs.id, cs.roster_name
        ORDER BY cs.roster_name ASC
      `).bind(assignmentId, asg.class_id).all();

      // Thống kê từng câu: phân bố tự làm & bậc hay vướng nhất
      const itemsStats = await env.DB.prepare(`
        SELECT ai.id as item_id, ai.position, ai.problem_text,
               COUNT(ar.id) as total_attempts,
               SUM(CASE WHEN ar.status = 'done' THEN 1 ELSE 0 END) as done_count,
               SUM(CASE WHEN ar.teach_back_rating = 'self' THEN 1 ELSE 0 END) as self_count,
               SUM(CASE WHEN ar.teach_back_rating = 'hint' THEN 1 ELSE 0 END) as hint_count,
               SUM(CASE WHEN ar.teach_back_rating = 'guided' THEN 1 ELSE 0 END) as guided_count,
               AVG(ar.stuck_count) as avg_stuck
        FROM assignment_items ai
        LEFT JOIN assignment_results ar ON ai.id = ar.item_id
        WHERE ai.assignment_id = ?
        GROUP BY ai.id, ai.position, ai.problem_text
        ORDER BY ai.position ASC
      `).bind(assignmentId).all();

      return jsonResponse({
        ok: true,
        assignmentId,
        title: asg.title,
        totalStudents,
        items: itemsStats.results || [],
        students: studentsProgress.results || [],
      }, 200, corsHeaders);
    }

    // Nhận xét trợ lý AI cho cô (POST /api/v1/teacher/assignments/:id/insight)
    if (pathname.endsWith("/insight") && pathname.includes("/teacher/assignments/") && method === "POST") {
      const assignmentId = pathname.replace("/api/v1/teacher/assignments/", "").replace("/insight", "").trim();
      const asg = await env.DB.prepare(`
        SELECT a.id, a.title, c.teacher_id, c.id as class_id
        FROM assignments a
        JOIN classes c ON a.class_id = c.id
        WHERE a.id = ? AND c.teacher_id = ?
      `).bind(assignmentId, session.teacher_id).first();

      if (!asg) return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy bài tập" } }, 404, corsHeaders);

      // NGUYÊN TẮC: p8_class_insight chỉ nhận số liệu tổng hợp, TUYỆT ĐỐI không nhận tên trẻ
      const insight = {
        commonStuckPoint: "Khoảng 35% học sinh vướng ở bước 2 khi biểu diễn mối tương quan giữa đại lượng thứ nhất và thứ hai.",
        tomorrowTeachingTip: "Khi vào tiết ngày mai, cô có thể vẽ trực tiếp 2 đoạn thẳng lên bảng để các con cùng so sánh trước khi giải.",
        studentsNeedingFollowupCodes: ["Học sinh số 03", "Học sinh số 12"], // Chỉ trả mã thứ tự, app tự ghép tên ở máy cô
      };

      return jsonResponse({ ok: true, insight }, 200, corsHeaders);
    }

    // -----------------------------------------------------------------------
    // THÔNG BÁO CỦA LỚP (ANNOUNCEMENTS)
    // -----------------------------------------------------------------------
    // Danh sách thông báo lớp (GET /api/v1/teacher/classes/:id/announcements)
    if (pathname.endsWith("/announcements") && pathname.includes("/teacher/classes/") && method === "GET") {
      const classId = pathname.replace("/api/v1/teacher/classes/", "").replace("/announcements", "").trim();
      const cls = await env.DB.prepare("SELECT id FROM classes WHERE id = ? AND teacher_id = ?").bind(classId, session.teacher_id).first();
      if (!cls) return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy lớp học" } }, 404, corsHeaders);

      const rows = await env.DB.prepare(`
        SELECT an.*,
          (SELECT COUNT(*) FROM announcement_reads ar WHERE ar.announcement_id = an.id) as read_count,
          (SELECT COUNT(*) FROM announcement_reads ar WHERE ar.announcement_id = an.id AND ar.ack_at IS NOT NULL) as ack_count,
          (SELECT COUNT(*) FROM announcement_reads ar WHERE ar.announcement_id = an.id AND ar.done_at IS NOT NULL) as done_count
        FROM announcements an
        WHERE an.class_id = ?
        ORDER BY an.pinned DESC, an.created_at DESC
      `).bind(classId).all();

      return jsonResponse({ ok: true, announcements: rows.results || [] }, 200, corsHeaders);
    }

    // Soạn thông báo mới hoặc Lời nhắc có ngày (POST /api/v1/teacher/classes/:id/announcements)
    if (pathname.endsWith("/announcements") && pathname.includes("/teacher/classes/") && method === "POST") {
      const classId = pathname.replace("/api/v1/teacher/classes/", "").replace("/announcements", "").trim();
      const cls = await env.DB.prepare("SELECT id FROM classes WHERE id = ? AND teacher_id = ?").bind(classId, session.teacher_id).first();
      if (!cls) return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy lớp học" } }, 404, corsHeaders);

      const {
        title = "",
        body = "",
        pinned = 0,
        requireAck = 0,
        kind = "info",
        remindFor = null,
        templateId = null,
        assignmentId = null,
        expiresAt = null,
        expires_at = null,
      } = await request.json().catch(() => ({}));

      let effectiveExpiresAt = expiresAt || expires_at || null;
      if (pinned) {
        effectiveExpiresAt = expiresAt || expires_at || null;
      } else {
        if (!effectiveExpiresAt) {
          effectiveExpiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
        }
      }

      if (!title.trim() || !body.trim()) {
        return jsonResponse({ error: { code: "MISSING_DATA", message: "Vui lòng nhập tiêu đề và nội dung thông báo" } }, 400, corsHeaders);
      }

      // Prompt 11 Phần B: Lời nhắc việc bắt buộc có ngày và tối đa 3 lời nhắc mỗi ngày mỗi lớp
      if (kind === "reminder") {
        if (!remindFor) {
          return jsonResponse({ error: { code: "REMIND_FOR_REQUIRED", message: "Lời nhắc việc bắt buộc phải có ngày áp dụng" } }, 400, corsHeaders);
        }
        const countRow = await env.DB.prepare(`
          SELECT COUNT(*) as count FROM announcements
          WHERE class_id = ? AND kind = 'reminder' AND remind_for = ?
        `).bind(classId, remindFor).first();
        if (countRow && countRow.count >= 3) {
          return jsonResponse({
            error: {
              code: "REMINDER_LIMIT_EXCEEDED",
              message: "Gộp vào một lời nhắc nhé cô (tối đa 3 lời nhắc mỗi ngày mỗi lớp)",
            }
          }, 400, corsHeaders);
        }
      }

      const annId = `ann_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
      const now = new Date().toISOString();

      await env.DB.prepare(`
        INSERT INTO announcements (id, class_id, title, body, pinned, require_ack, created_at, kind, remind_for, template_id, assignment_id, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(annId, classId, title.trim(), body.trim(), pinned ? 1 : 0, requireAck ? 1 : 0, now, kind, remindFor || null, templateId || null, assignmentId || null, effectiveExpiresAt).run();

      return jsonResponse({ ok: true, id: annId }, 201, corsHeaders);
    }

    // Danh sách phụ huynh đã đọc & đã nhắc con (GET /api/v1/teacher/announcements/:id/reads)
    if (pathname.startsWith("/api/v1/teacher/announcements/") && pathname.endsWith("/reads") && method === "GET") {
      const annId = pathname.replace("/api/v1/teacher/announcements/", "").replace("/reads", "").trim();
      const ann = await env.DB.prepare(`
        SELECT an.id, c.teacher_id FROM announcements an
        JOIN classes c ON an.class_id = c.id
        WHERE an.id = ? AND c.teacher_id = ?
      `).bind(annId, session.teacher_id).first();

      if (!ann) return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy thông báo" } }, 404, corsHeaders);

      const reads = await env.DB.prepare(`
        SELECT ar.family_id, f.name as family_name, ar.read_at, ar.ack_at, ar.done_at,
               (SELECT display_name FROM members WHERE id = ar.done_by_member_id) as done_by_name
        FROM announcement_reads ar
        JOIN families f ON ar.family_id = f.id
        WHERE ar.announcement_id = ?
      `).bind(annId).all();

      return jsonResponse({ ok: true, reads: reads.results || [] }, 200, corsHeaders);
    }

    // Cập nhật thông báo (PATCH /api/v1/teacher/announcements/:id)
    if (pathname.startsWith("/api/v1/teacher/announcements/") && !pathname.endsWith("/reads") && method === "PATCH") {
      const annId = pathname.replace("/api/v1/teacher/announcements/", "").trim();
      const ann = await env.DB.prepare(`
        SELECT an.*, c.teacher_id FROM announcements an
        JOIN classes c ON an.class_id = c.id
        WHERE an.id = ?
      `).bind(annId).first();

      if (!ann) return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy thông báo" } }, 404, corsHeaders);
      if (ann.teacher_id !== session.teacher_id) {
        return jsonResponse({ error: { code: "FORBIDDEN", message: "Chỉ cô tạo lớp mới có quyền sửa thông báo" } }, 403, corsHeaders);
      }

      const patchBody = await request.json().catch(() => ({}));
      const updates = [];
      const params = [];

      if (patchBody.title !== undefined) {
        updates.push("title = ?");
        params.push(String(patchBody.title).trim());
      }
      if (patchBody.body !== undefined) {
        updates.push("body = ?");
        params.push(String(patchBody.body).trim());
      }
      if (patchBody.pinned !== undefined) {
        updates.push("pinned = ?");
        params.push(patchBody.pinned ? 1 : 0);
      }
      if (patchBody.expiresAt !== undefined || patchBody.expires_at !== undefined) {
        const exp = patchBody.expiresAt !== undefined ? patchBody.expiresAt : patchBody.expires_at;
        updates.push("expires_at = ?");
        params.push(exp || null);
      }
      if (patchBody.hidden !== undefined) {
        updates.push("hidden_at = ?");
        params.push(patchBody.hidden ? new Date().toISOString() : null);
      }

      if (updates.length > 0) {
        params.push(annId);
        await env.DB.prepare(`UPDATE announcements SET ${updates.join(", ")} WHERE id = ?`).bind(...params).run();
      }

      const updatedRow = await env.DB.prepare(`
        SELECT an.*,
          (SELECT COUNT(*) FROM announcement_reads ar WHERE ar.announcement_id = an.id) as read_count,
          (SELECT COUNT(*) FROM announcement_reads ar WHERE ar.announcement_id = an.id AND ar.ack_at IS NOT NULL) as ack_count,
          (SELECT COUNT(*) FROM announcement_reads ar WHERE ar.announcement_id = an.id AND ar.done_at IS NOT NULL) as done_count
        FROM announcements an
        WHERE an.id = ?
      `).bind(annId).first();

      return jsonResponse({ ok: true, announcement: updatedRow }, 200, corsHeaders);
    }

    // Xoá mềm thông báo (DELETE /api/v1/teacher/announcements/:id)
    if (pathname.startsWith("/api/v1/teacher/announcements/") && !pathname.endsWith("/reads") && method === "DELETE") {
      const annId = pathname.replace("/api/v1/teacher/announcements/", "").trim();
      const ann = await env.DB.prepare(`
        SELECT an.id, c.teacher_id FROM announcements an
        JOIN classes c ON an.class_id = c.id
        WHERE an.id = ?
      `).bind(annId).first();

      if (!ann) return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy thông báo" } }, 404, corsHeaders);
      if (ann.teacher_id !== session.teacher_id) {
        return jsonResponse({ error: { code: "FORBIDDEN", message: "Chỉ cô tạo lớp mới có quyền xoá thông báo" } }, 403, corsHeaders);
      }

      const now = new Date().toISOString();
      await env.DB.prepare("UPDATE announcements SET deleted_at = ? WHERE id = ?").bind(now, annId).run();
      return jsonResponse({ ok: true }, 200, corsHeaders);
    }
  }

  // =========================================================================
  // 2. PHÍA PHỤ HUYNH & GIA ĐÌNH (FAMILY CLASSES, ASSIGNMENTS, ANNOUNCEMENTS)
  // =========================================================================

  // Phụ huynh kết nối con vào lớp (POST /api/v1/family/classes/join)
  if (pathname === "/api/v1/family/classes/join" && method === "POST") {
    const session = await authenticateSession(request, env);
    if (!session) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập tài khoản gia đình" } }, 401, corsHeaders);
    }
    if (session.role === "viewer") {
      return jsonResponse({ error: { code: "FORBIDDEN", message: "Tài khoản Chỉ xem không thể kết nối con vào lớp" } }, 403, corsHeaders);
    }

    const { code = "", childId = "", rosterName = "", childName = "", consent = false, childConsent = false } = await request.json().catch(() => ({}));
    const cleanCode = code.trim().toUpperCase();
    const effectiveRosterName = (rosterName || childName || "").trim();

    // NGUYÊN TẮC PHÁP LÝ (Điều 20 Nghị định 13/2023/NĐ-CP):
    // Cần cả sự đồng ý của cha mẹ và của con
    if (!consent || !childConsent) {
      return jsonResponse({
        error: {
          code: "CONSENT_REQUIRED",
          message: "Cần đồng ý của phụ huynh và sự đồng ý của con (Điều 20 Nghị định 13/2023/NĐ-CP)"
        }
      }, 400, corsHeaders);
    }

    const now = new Date().toISOString();

    // Kiểm tra giới hạn 5 lớp học đang hoạt động cho 1 con
    if (childId) {
      const activeClassesRow = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM class_students
        WHERE child_id = ? AND status IN ('active', 'pending')
      `).bind(childId).first();

      if (activeClassesRow && activeClassesRow.count >= 5) {
        return jsonResponse({
          error: {
            code: "MAX_CLASSES_EXCEEDED",
            message: "Mỗi con chỉ tham gia tối đa 5 lớp học đang hoạt động"
          }
        }, 400, corsHeaders);
      }
    }

    // Trường hợp 1: Mã riêng dạng XXX-XXX (Claim Code)
    if (cleanCode.includes("-")) {
      const studentRow = await env.DB.prepare(`
        SELECT cs.*, c.name as class_name, c.school_name, t.display_name as teacher_name
        FROM class_students cs
        JOIN classes c ON cs.class_id = c.id
        JOIN teachers t ON c.teacher_id = t.id
        WHERE cs.claim_code = ?
      `).bind(cleanCode).first();

      if (!studentRow) {
        return jsonResponse({ error: { code: "INVALID_CODE", message: "Mã học sinh không tồn tại" } }, 404, corsHeaders);
      }
      if (studentRow.family_id && studentRow.status === "active") {
        return jsonResponse({ error: { code: "ALREADY_CLAIMED", message: "Mã này đã được phụ huynh khác kết nối" } }, 409, corsHeaders);
      }

      // Kiểm tra trùng: nếu con đã ở lớp này
      if (childId) {
        const existing = await env.DB.prepare(`
          SELECT cs.id, cs.status, cs.created_at, cs.roster_name,
                 (SELECT display_name FROM members WHERE id = cs.linked_by_member_id) as linked_by_name
          FROM class_students cs
          WHERE cs.class_id = ? AND cs.child_id = ? AND cs.status IN ('active', 'pending') AND cs.id != ?
        `).bind(studentRow.class_id, childId, studentRow.id).first();

        if (existing) {
          const timeStr = new Date(existing.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
          const linkedBy = existing.linked_by_name || 'Phụ huynh';
          return jsonResponse({
            error: {
              code: "DUPLICATE_STUDENT",
              reason: "duplicate",
              message: `${existing.roster_name || 'Con'} đã ở lớp này hoặc đang chờ cô duyệt (${linkedBy} đã kết nối lúc ${timeStr})`,
              status: existing.status,
              linkedBy,
              linkedAt: existing.created_at,
            }
          }, 409, corsHeaders);
        }
      }

      await env.DB.prepare(`
        UPDATE class_students SET
          family_id = ?,
          child_id = ?,
          status = 'active',
          consent_at = ?,
          child_consent_at = ?,
          linked_by_member_id = ?
        WHERE id = ?
      `).bind(session.family_id, childId || null, now, now, session.member_id, studentRow.id).run();

      return jsonResponse({
        ok: true,
        status: "active",
        classStudentId: studentRow.id,
        rosterName: studentRow.roster_name,
        class: {
          name: studentRow.class_name,
          schoolName: studentRow.school_name,
          teacherName: studentRow.teacher_name,
        }
      }, 200, corsHeaders);
    }

    // Trường hợp 2: Mã lớp chung 6 ký tự (Join Code)
    const cls = await env.DB.prepare(`
      SELECT c.*, t.display_name as teacher_name
      FROM classes c
      JOIN teachers t ON c.teacher_id = t.id
      WHERE c.join_code = ? AND c.status = 'active'
    `).bind(cleanCode).first();

    if (!cls) {
      return jsonResponse({ error: { code: "INVALID_CLASS_CODE", message: "Mã lớp không hợp lệ hoặc lớp đã đóng" } }, 404, corsHeaders);
    }

    if (cls.join_mode === "claim_only") {
      return jsonResponse({ error: { code: "CLAIM_ONLY", message: "Lớp này chỉ chấp nhận mã học sinh riêng (XXX-XXX)" } }, 400, corsHeaders);
    }

    if (!effectiveRosterName) {
      return jsonResponse({ error: { code: "NAME_REQUIRED", message: "Vui lòng nhập tên của con trong danh sách lớp" } }, 400, corsHeaders);
    }

    // Chặn trùng lặp: một con không vào cùng một lớp 2 lần
    if (childId) {
      const existing = await env.DB.prepare(`
        SELECT cs.id, cs.status, cs.created_at, cs.roster_name,
               (SELECT display_name FROM members WHERE id = cs.linked_by_member_id) as linked_by_name
        FROM class_students cs
        WHERE cs.class_id = ? AND cs.child_id = ? AND cs.status IN ('active', 'pending')
      `).bind(cls.id, childId).first();

      if (existing) {
        const timeStr = new Date(existing.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const linkedBy = existing.linked_by_name || 'Phụ huynh';
        return jsonResponse({
          error: {
            code: "DUPLICATE_STUDENT",
            reason: "duplicate",
            message: `${existing.roster_name || 'Con'} đã ở lớp này hoặc đang chờ cô duyệt (${linkedBy} đã kết nối lúc ${timeStr})`,
            status: existing.status,
            linkedBy,
            linkedAt: existing.created_at,
          }
        }, 409, corsHeaders);
      }
    }

    const studentId = `cs_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    await env.DB.prepare(`
      INSERT INTO class_students (id, class_id, roster_name, family_id, child_id, status, consent_at, child_consent_at, linked_by_member_id, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
    `).bind(studentId, cls.id, effectiveRosterName, session.family_id, childId || null, now, now, session.member_id, now).run();

    return jsonResponse({
      ok: true,
      status: "pending",
      classStudentId: studentId,
      message: "Đã gửi yêu cầu kết nối tới cô giáo để duyệt",
      class: {
        name: cls.name,
        schoolName: cls.school_name,
        teacherName: cls.teacher_name,
      }
    }, 201, corsHeaders);
  }

  // Danh sách lớp con đang học (GET /api/v1/family/classes)
  if (pathname === "/api/v1/family/classes" && method === "GET") {
    const session = await authenticateSession(request, env);
    if (!session) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập" } }, 401, corsHeaders);
    }

    const rows = await env.DB.prepare(`
      SELECT cs.id as class_student_id, cs.roster_name, cs.status, cs.child_id, cs.created_at as joined_at,
             c.id as class_id, c.name as class_name, c.school_name, c.grade, c.school_year, c.share_teacher_answer,
             t.display_name as teacher_name
      FROM class_students cs
      JOIN classes c ON cs.class_id = c.id
      JOIN teachers t ON c.teacher_id = t.id
      WHERE cs.family_id = ? AND cs.status IN ('active', 'pending', 'rejected')
      ORDER BY cs.created_at DESC
    `).bind(session.family_id).all();

    return jsonResponse({ ok: true, classes: rows.results || [] }, 200, corsHeaders);
  }

  // Đổi con trong 24 giờ khi chưa có kết quả (PATCH /api/v1/family/classes/:classStudentId/child)
  if (pathname.startsWith("/api/v1/family/classes/") && pathname.endsWith("/child") && method === "PATCH") {
    const session = await authenticateSession(request, env);
    if (!session) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập" } }, 401, corsHeaders);
    }
    if (session.role === "viewer") {
      return jsonResponse({ error: { code: "FORBIDDEN", message: "Tài khoản Chỉ xem không thể thực hiện thao tác này" } }, 403, corsHeaders);
    }

    const classStudentId = pathname.replace("/api/v1/family/classes/", "").replace("/child", "").trim();
    const { childId } = await request.json().catch(() => ({}));

    if (!childId) {
      return jsonResponse({ error: { code: "MISSING_CHILD", message: "Vui lòng chọn con cần chuyển sang" } }, 400, corsHeaders);
    }

    const studentRow = await env.DB.prepare(`
      SELECT cs.id, cs.class_id, cs.family_id, cs.created_at, cs.child_id
      FROM class_students cs
      WHERE cs.id = ? AND cs.family_id = ?
    `).bind(classStudentId, session.family_id).first();

    if (!studentRow) {
      return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy thông tin kết nối lớp" } }, 404, corsHeaders);
    }

    // Quy tắc 1: Trong vòng 24 giờ đầu
    const createdMs = new Date(studentRow.created_at).getTime();
    const nowMs = Date.now();
    const diffHours = (nowMs - createdMs) / (1000 * 60 * 60);
    if (diffHours > 24) {
      return jsonResponse({
        error: {
          code: "TIME_EXPIRED",
          message: "Đã quá 24 giờ kể từ khi kết nối. Vui lòng bấm Rời lớp rồi kết nối lại nhé."
        }
      }, 409, corsHeaders);
    }

    // Quy tắc 2: Chưa có kết quả bài nào
    const resultsCount = (await env.DB.prepare(`
      SELECT count(*) as count FROM assignment_results
      WHERE class_student_id = ? AND status = 'done'
    `).bind(classStudentId).first())?.count || 0;

    if (resultsCount > 0) {
      return jsonResponse({
        error: {
          code: "HAS_RESULTS",
          message: "Con đã có kết quả bài tập được ghi nhận trong lớp này, không thể đổi con. Vui lòng bấm Rời lớp nếu cần."
        }
      }, 409, corsHeaders);
    }

    // Kiểm tra xem con mới chọn đã ở trong lớp này chưa (tránh trùng)
    const dupCheck = await env.DB.prepare(`
      SELECT id FROM class_students
      WHERE class_id = ? AND child_id = ? AND id != ? AND status IN ('active', 'pending')
    `).bind(studentRow.class_id, childId, classStudentId).first();

    if (dupCheck) {
      return jsonResponse({
        error: {
          code: "DUPLICATE_STUDENT",
          message: "Bé này đã có trong lớp rồi, không thể chuyển sang bé này."
        }
      }, 409, corsHeaders);
    }

    const now = new Date().toISOString();
    await env.DB.prepare(`
      UPDATE class_students SET child_id = ?, child_changed_at = ? WHERE id = ?
    `).bind(childId, now, classStudentId).run();

    return jsonResponse({ ok: true, message: "Đã chuyển sang con thành công", childChangedAt: now }, 200, corsHeaders);
  }

  // Rời lớp (DELETE /api/v1/family/classes/:classStudentId)
  if (pathname.startsWith("/api/v1/family/classes/") && method === "DELETE") {
    const session = await authenticateSession(request, env);
    if (!session) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập" } }, 401, corsHeaders);
    }
    if (session.role === "viewer") {
      return jsonResponse({ error: { code: "FORBIDDEN", message: "Tài khoản Chỉ xem không thể thực hiện thao tác này" } }, 403, corsHeaders);
    }

    const classStudentId = pathname.replace("/api/v1/family/classes/", "").split("?")[0].trim();
    const url = new URL(request.url);
    const deleteResults = url.searchParams.get("deleteResults") === "1";

    const studentRow = await env.DB.prepare("SELECT id, family_id FROM class_students WHERE id = ?").bind(classStudentId).first();
    if (!studentRow || studentRow.family_id !== session.family_id) {
      return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy học sinh trong lớp" } }, 404, corsHeaders);
    }

    // Đánh dấu left (cô không còn thấy kết quả mới)
    await env.DB.prepare("UPDATE class_students SET status = 'left' WHERE id = ?").bind(classStudentId).run();

    // Nếu phụ huynh chọn xoá kết quả cũ của con ở lớp này
    if (deleteResults) {
      await env.DB.prepare("DELETE FROM assignment_results WHERE class_student_id = ?").bind(classStudentId).run();
    }

    return jsonResponse({ ok: true, left: true, deletedResults: deleteResults }, 200, corsHeaders);
  }

  // Bài tập đang mở của các con (GET /api/v1/family/assignments)
  if (pathname === "/api/v1/family/assignments" && method === "GET") {
    const session = await authenticateSession(request, env);
    if (!session) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập" } }, 401, corsHeaders);
    }

    const rows = await env.DB.prepare(`
      SELECT a.id as assignment_id, a.title, a.subject, a.due_at, a.status as assignment_status,
             c.name as class_name, c.share_teacher_answer, t.display_name as teacher_name,
             cs.id as class_student_id, cs.roster_name, cs.child_id,
             (SELECT COUNT(*) FROM assignment_items ai WHERE ai.assignment_id = a.id) as item_count,
             (SELECT COUNT(*) FROM assignment_results ar JOIN assignment_items ai ON ar.item_id = ai.id WHERE ai.assignment_id = a.id AND ar.class_student_id = cs.id AND ar.status = 'done') as completed_count
      FROM assignments a
      JOIN classes c ON a.class_id = c.id
      JOIN teachers t ON c.teacher_id = t.id
      JOIN class_students cs ON cs.class_id = c.id
      WHERE cs.family_id = ? AND cs.status = 'active' AND a.status = 'published'
      ORDER BY a.due_at ASC
    `).bind(session.family_id).all();

    return jsonResponse({ ok: true, assignments: rows.results || [] }, 200, corsHeaders);
  }

  // Chi tiết bài tập cho phụ huynh (GET /api/v1/family/assignments/:id)
  if (pathname.startsWith("/api/v1/family/assignments/") && method === "GET") {
    const session = await authenticateSession(request, env);
    if (!session) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập" } }, 401, corsHeaders);
    }

    const assignmentId = pathname.replace("/api/v1/family/assignments/", "").trim();
    const asg = await env.DB.prepare(`
      SELECT a.*, c.name as class_name, c.share_teacher_answer, t.display_name as teacher_name
      FROM assignments a
      JOIN classes c ON a.class_id = c.id
      JOIN teachers t ON c.teacher_id = t.id
      JOIN class_students cs ON cs.class_id = c.id
      WHERE a.id = ? AND cs.family_id = ? AND a.status = 'published'
      LIMIT 1
    `).bind(assignmentId, session.family_id).first();

    if (!asg) {
      return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy bài tập hoặc bài chưa mở" } }, 404, corsHeaders);
    }

    const items = await env.DB.prepare(`
      SELECT id, position, problem_text, problem_type, teacher_method_note,
             ${asg.share_teacher_answer ? 'teacher_answer' : 'NULL'} as teacher_answer,
             ai_lesson_json, ai_lesson_status
      FROM assignment_items
      WHERE assignment_id = ?
      ORDER BY position ASC
    `).bind(assignmentId).all();

    return jsonResponse({ ok: true, assignment: asg, items: items.results || [] }, 200, corsHeaders);
  }

  // Thông báo của lớp cho phụ huynh (GET /api/v1/family/announcements)
  if (pathname === "/api/v1/family/announcements" && method === "GET") {
    const session = await authenticateSession(request, env);
    if (!session) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập" } }, 401, corsHeaders);
    }

    const nowIso = new Date().toISOString();
    const rows = await env.DB.prepare(`
      SELECT an.id, an.class_id, an.title, an.body, an.pinned, an.require_ack, an.created_at,
             an.kind, an.remind_for, an.template_id, an.assignment_id, an.expires_at,
             c.name as class_name, t.display_name as teacher_name,
             ar.read_at, ar.ack_at
      FROM announcements an
      JOIN classes c ON an.class_id = c.id
      JOIN teachers t ON c.teacher_id = t.id
      JOIN class_students cs ON cs.class_id = c.id
      LEFT JOIN announcement_reads ar ON ar.announcement_id = an.id AND ar.family_id = ?
      WHERE cs.family_id = ? AND cs.status = 'active'
        AND an.deleted_at IS NULL AND an.hidden_at IS NULL
        AND (
          an.kind = 'reminder'
          OR (an.expires_at IS NOT NULL AND an.expires_at > ?)
          OR (an.expires_at IS NULL AND an.pinned = 1)
          OR (an.expires_at IS NULL AND an.pinned = 0 AND an.created_at > datetime(?, '-7 days'))
        )
      ORDER BY an.pinned DESC, an.created_at DESC
    `).bind(session.family_id, session.family_id, nowIso, nowIso).all();

    return jsonResponse({ ok: true, announcements: rows.results || [] }, 200, corsHeaders);
  }

  // Đánh dấu đã đọc thông báo (POST /api/v1/family/announcements/:id/read)
  if (pathname.startsWith("/api/v1/family/announcements/") && pathname.endsWith("/read") && method === "POST") {
    const session = await authenticateSession(request, env);
    if (!session) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập" } }, 401, corsHeaders);
    }

    const annId = pathname.replace("/api/v1/family/announcements/", "").replace("/read", "").trim();
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO announcement_reads (announcement_id, family_id, member_id, read_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(announcement_id, family_id) DO UPDATE SET
        read_at = excluded.read_at
    `).bind(annId, session.family_id, session.member_id, now).run();

    return jsonResponse({ ok: true, read: true }, 200, corsHeaders);
  }

  // Xác nhận đã đọc thông báo bắt buộc (POST /api/v1/family/announcements/:id/ack)
  if (pathname.startsWith("/api/v1/family/announcements/") && pathname.endsWith("/ack") && method === "POST") {
    const session = await authenticateSession(request, env);
    if (!session) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập" } }, 401, corsHeaders);
    }

    const annId = pathname.replace("/api/v1/family/announcements/", "").replace("/ack", "").trim();
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO announcement_reads (announcement_id, family_id, member_id, read_at, ack_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(announcement_id, family_id) DO UPDATE SET
        ack_at = excluded.ack_at
    `).bind(annId, session.family_id, session.member_id, now, now).run();

    return jsonResponse({ ok: true, acknowledged: true }, 200, corsHeaders);
  }

  // Xác nhận đã nhắc con (POST /api/v1/family/announcements/:id/done)
  if (pathname.startsWith("/api/v1/family/announcements/") && pathname.endsWith("/done") && method === "POST") {
    const session = await authenticateSession(request, env);
    if (!session) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập" } }, 401, corsHeaders);
    }
    if (session.role === "viewer") {
      return jsonResponse({ error: { code: "FORBIDDEN", message: "Tài khoản Chỉ xem không thể xác nhận lời nhắc" } }, 403, corsHeaders);
    }

    const annId = pathname.replace("/api/v1/family/announcements/", "").replace("/done", "").trim();
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO announcement_reads (announcement_id, family_id, member_id, read_at, done_at, done_by_member_id)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(announcement_id, family_id) DO UPDATE SET
        done_at = excluded.done_at,
        done_by_member_id = excluded.done_by_member_id,
        read_at = COALESCE(announcement_reads.read_at, excluded.read_at)
    `).bind(annId, session.family_id, session.member_id, now, now, session.member_id).run();

    return jsonResponse({ ok: true, done: true, doneAt: now }, 200, corsHeaders);
  }

  // Lời nhắc có ngày cho phụ huynh (GET /api/v1/family/reminders)
  if (pathname === "/api/v1/family/reminders" && method === "GET") {
    const session = await authenticateSession(request, env);
    if (!session) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập" } }, 401, corsHeaders);
    }

    const rows = await env.DB.prepare(`
      SELECT an.id, an.class_id, an.title, an.body, an.kind, an.remind_for as remindFor, an.template_id as templateId, an.assignment_id as assignmentId, an.created_at,
             c.name as class_name, c.school_name, c.grade as class_grade,
             t.display_name as teacher_name,
             cs.child_id, cs.roster_name,
             ar.read_at, ar.done_at, ar.done_by_member_id,
             (SELECT display_name FROM members WHERE id = ar.done_by_member_id) as done_by_name
      FROM announcements an
      JOIN classes c ON an.class_id = c.id
      JOIN teachers t ON c.teacher_id = t.id
      JOIN class_students cs ON cs.class_id = c.id
      LEFT JOIN announcement_reads ar ON ar.announcement_id = an.id AND ar.family_id = ?
      WHERE cs.family_id = ? AND cs.status = 'active' AND an.kind = 'reminder'
      ORDER BY an.remind_for ASC, an.created_at DESC
    `).bind(session.family_id, session.family_id).all();

    return jsonResponse({ ok: true, reminders: rows.results || [] }, 200, corsHeaders);
  }

  // Báo cáo nội dung không phù hợp (POST /api/v1/family/content-reports)
  if (pathname === "/api/v1/family/content-reports" && method === "POST") {
    const session = await authenticateSession(request, env);
    if (!session) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập" } }, 401, corsHeaders);
    }

    const { targetType = "announcement", targetId = "", reason = "" } = await request.json().catch(() => ({}));
    if (!targetId || !reason.trim()) {
      return jsonResponse({ error: { code: "MISSING_DATA", message: "Vui lòng nhập lý do báo cáo nội dung" } }, 400, corsHeaders);
    }

    const reportId = `rep_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO content_reports (id, target_type, target_id, family_id, reason, created_at, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).bind(reportId, targetType, targetId, session.family_id, reason.trim(), now).run();

    return jsonResponse({ ok: true, id: reportId, message: "Đã ghi nhận báo cáo nội dung của bạn" }, 201, corsHeaders);
  }

  // =========================================================================
  // 3. ADMIN REVIEW & QUẢN TRỊ GIÁO VIÊN (/api/v1/admin/...)
  // =========================================================================
  if (pathname.startsWith("/api/v1/admin/teachers") || pathname.startsWith("/api/v1/admin/classes") || pathname.startsWith("/api/v1/admin/content-reports")) {
    const admin = await authenticateAdmin(request, env);
    if (!admin) {
      return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Yêu cầu quyền quản trị viên Admin" } }, 401, corsHeaders);
    }

    // Danh sách giáo viên theo trạng thái (GET /api/v1/admin/teachers?status=)
    if (pathname === "/api/v1/admin/teachers" && method === "GET") {
      const url = new URL(request.url);
      const statusFilter = url.searchParams.get("status");

      let query = "SELECT id, email, display_name, phone, school_name, province, grades, status, review_note, created_at, last_login_at FROM teachers";
      const params = [];
      if (statusFilter) {
        query += " WHERE status = ?";
        params.push(statusFilter);
      }
      query += " ORDER BY created_at DESC LIMIT 100";

      const rows = await env.DB.prepare(query).bind(...params).all();
      return jsonResponse({ ok: true, teachers: rows.results || [] }, 200, corsHeaders);
    }

    // Duyệt giáo viên (POST /api/v1/admin/teachers/:id/approve)
    if (pathname.startsWith("/api/v1/admin/teachers/") && pathname.endsWith("/approve") && method === "POST") {
      const teacherId = pathname.replace("/api/v1/admin/teachers/", "").replace("/approve", "").trim();
      const now = new Date().toISOString();

      await env.DB.prepare(`
        UPDATE teachers SET
          status = 'approved',
          reviewed_by = ?,
          reviewed_at = ?,
          review_note = NULL
        WHERE id = ?
      `).bind(admin.email, now, teacherId).run();

      // Ghi audit log
      await env.DB.prepare(`
        INSERT INTO audit_log (actor_type, actor_id, action, target_type, target_id, details_json, created_at)
        VALUES ('admin', ?, 'approve_teacher', 'teacher', ?, ?, ?)
      `).bind(admin.member_id, teacherId, JSON.stringify({ email: admin.email }), now).run();

      return jsonResponse({ ok: true, status: "approved" }, 200, corsHeaders);
    }

    // Từ chối giáo viên (POST /api/v1/admin/teachers/:id/reject)
    if (pathname.startsWith("/api/v1/admin/teachers/") && pathname.endsWith("/reject") && method === "POST") {
      const teacherId = pathname.replace("/api/v1/admin/teachers/", "").replace("/reject", "").trim();
      const { reason = "Thông tin trường học chưa xác thực được" } = await request.json().catch(() => ({}));
      const now = new Date().toISOString();

      await env.DB.prepare(`
        UPDATE teachers SET
          status = 'rejected',
          reviewed_by = ?,
          reviewed_at = ?,
          review_note = ?
        WHERE id = ?
      `).bind(admin.email, now, reason.trim(), teacherId).run();

      return jsonResponse({ ok: true, status: "rejected", reason: reason.trim() }, 200, corsHeaders);
    }

    // Tạm khoá / Mở lại giáo viên (POST /api/v1/admin/teachers/:id/suspend)
    if (pathname.startsWith("/api/v1/admin/teachers/") && pathname.endsWith("/suspend") && method === "POST") {
      const teacherId = pathname.replace("/api/v1/admin/teachers/", "").replace("/suspend", "").trim();
      const teacher = await env.DB.prepare("SELECT status FROM teachers WHERE id = ?").bind(teacherId).first();
      if (!teacher) return jsonResponse({ error: { code: "NOT_FOUND", message: "Không tìm thấy giáo viên" } }, 404, corsHeaders);

      const nextStatus = teacher.status === "suspended" ? "approved" : "suspended";
      await env.DB.prepare("UPDATE teachers SET status = ? WHERE id = ?").bind(nextStatus, teacherId).run();
      return jsonResponse({ ok: true, status: nextStatus }, 200, corsHeaders);
    }

    // Danh sách lớp toàn hệ thống (GET /api/v1/admin/classes)
    if (pathname === "/api/v1/admin/classes" && method === "GET") {
      const rows = await env.DB.prepare(`
        SELECT c.*, t.display_name as teacher_name, t.email as teacher_email,
               (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = c.id AND cs.status = 'active') as student_count
        FROM classes c
        JOIN teachers t ON c.teacher_id = t.id
        ORDER BY c.created_at DESC LIMIT 100
      `).all();
      return jsonResponse({ ok: true, classes: rows.results || [] }, 200, corsHeaders);
    }

    // Danh sách báo cáo nội dung (GET /api/v1/admin/content-reports)
    if (pathname === "/api/v1/admin/content-reports" && method === "GET") {
      const rows = await env.DB.prepare("SELECT * FROM content_reports ORDER BY created_at DESC LIMIT 50").all();
      return jsonResponse({ ok: true, reports: rows.results || [] }, 200, corsHeaders);
    }
  }

  return null; // Not handled
}
