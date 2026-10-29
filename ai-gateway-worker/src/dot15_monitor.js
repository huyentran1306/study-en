/**
 * ĐỢT 15 · CHẶNG 3 · NHÓM "THEO DÕI" (Tổng quan, Gia đình, Buổi học & AI, Báo cáo & NPS)
 * Các endpoint đọc số liệu thật từ D1 cho admin. Nguyên tắc: không bịa số;
 * không có dữ liệu thì trả null để giao diện hiện "·" hoặc trạng thái trống.
 *
 * GET /api/v1/admin/overview-stats?range=today|7d|30d
 * GET /api/v1/admin/families-stats
 * GET /api/v1/admin/family-detail?id=<familyId>
 * GET /api/v1/admin/sessions-stats
 * GET /api/v1/admin/session-detail?id=<sessionId>
 * GET /api/v1/admin/nps-summary
 * GET /api/v1/admin/peak-hours?days=30        (giờ Việt Nam, UTC+7)
 */

function json(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...(corsHeaders || {}), "Content-Type": "application/json; charset=utf-8" },
  });
}

const RANGE_SQL = { today: "-1 day", "7d": "-7 days", "30d": "-30 days" };

// Chạy một truy vấn, lỗi (bảng/cột chưa có) thì trả về giá trị mặc định thay vì làm hỏng cả trang
async function safeFirst(env, sql, params = []) {
  try {
    return await env.DB.prepare(sql).bind(...params).first();
  } catch (e) {
    return null;
  }
}
async function safeAll(env, sql, params = []) {
  try {
    const r = await env.DB.prepare(sql).bind(...params).all();
    return r?.results || [];
  } catch (e) {
    return [];
  }
}

const num = (v) => (v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));
const pct = (part, total) => (total > 0 ? Math.round((Number(part || 0) / total) * 100) : null);

// Thời lượng thật: chỉ tính khi có ended_at sau started_at (không tự gán 60 giây)
const DURATION_SQL = `CASE WHEN s.ended_at IS NOT NULL AND s.ended_at <> '' AND julianday(s.ended_at) > julianday(s.started_at)
  THEN CAST(round((julianday(s.ended_at) - julianday(s.started_at)) * 86400) AS INTEGER) ELSE NULL END`;

const SELF_SQL = `(s.teach_back_rating IN ('self','tu_lam','done') OR s.quick_rating IN ('self','tu_lam'))`;

function validatorStatus(raw) {
  if (!raw) return null;
  try {
    const v = typeof raw === "string" ? JSON.parse(raw) : raw;
    return v?.status || null;
  } catch (e) {
    return null;
  }
}

export async function handle(request, env, ctx, pathname, method, corsHeaders, adminSession) {
  const ROUTES = [
    "/api/v1/admin/overview-stats",
    "/api/v1/admin/families-stats",
    "/api/v1/admin/family-detail",
    "/api/v1/admin/sessions-stats",
    "/api/v1/admin/session-detail",
    "/api/v1/admin/nps-summary",
    "/api/v1/admin/peak-hours",
  ];
  if (!ROUTES.includes(pathname)) return null;
  if (method !== "GET") return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Chỉ hỗ trợ GET" } }, 405, corsHeaders);
  if (!adminSession) return json({ error: { code: "UNAUTHORIZED", message: "Yêu cầu quyền quản trị" } }, 401, corsHeaders);
  if (adminSession.locked_at) {
    return json({ error: { code: "SESSION_LOCKED", message: "Phiên quản trị đang bị khoá. Vui lòng nhập mã PIN để tiếp tục" } }, 423, corsHeaders);
  }

  const url = new URL(request.url);
  const isSupport = adminSession.role === "support";

  /* ---------------- Tổng quan ---------------- */
  if (pathname === "/api/v1/admin/overview-stats") {
    const range = RANGE_SQL[url.searchParams.get("range")] ? url.searchParams.get("range") : "7d";
    const since = RANGE_SQL[range];

    const fam = await safeFirst(env, "SELECT count(*) AS total FROM families");
    const activeFam = await safeFirst(env, "SELECT count(DISTINCT family_id) AS n FROM learning_sessions WHERE datetime(started_at) >= datetime('now', ?)", [since]);
    const kids = await safeFirst(env, "SELECT count(*) AS total FROM children");
    // Gói 41: hồ sơ con của app gia đình nằm trong state đồng bộ (_kv_store, key "fam:<id>:state"),
    // bảng children thường trống nên trước đây "Học sinh" luôn ra null. Đếm số con trong state của các gia đình còn tồn tại.
    // Value có 2 dạng: state trực tiếp ({ children: [...] }) hoặc bản cũ { ts, state: { children: [...] } }.
    const kidsKv = await safeFirst(
      env,
      `SELECT COALESCE(SUM(n), 0) AS total FROM (
         SELECT COALESCE(json_array_length(value, '$.children'), json_array_length(value, '$.state.children'), 0) AS n
         FROM _kv_store
         WHERE key LIKE 'fam:%:state' AND json_valid(value)
           AND substr(key, 5, length(key) - 10) IN (SELECT id FROM families)
       )`
    );
    const activeKids = await safeFirst(env, "SELECT count(DISTINCT child_id) AS n FROM learning_sessions WHERE child_id IS NOT NULL AND child_id <> '' AND datetime(started_at) >= datetime('now', ?)", [since]);
    const ses = await safeFirst(
      env,
      `SELECT count(*) AS total, avg(${DURATION_SQL}) AS avgSec, count(${DURATION_SQL}) AS timed
       FROM learning_sessions s WHERE datetime(s.started_at) >= datetime('now', ?)`,
      [since]
    );
    const now = await safeFirst(env, "SELECT count(*) AS n FROM learning_sessions WHERE datetime(started_at) >= datetime('now','-30 minutes') AND (ended_at IS NULL OR ended_at = '')");
    const self = await safeFirst(
      env,
      `SELECT count(*) AS rated, sum(CASE WHEN ${SELF_SQL} THEN 1 ELSE 0 END) AS selfCount
       FROM learning_sessions s WHERE datetime(s.started_at) >= datetime('now', ?) AND (s.teach_back_rating IS NOT NULL OR s.quick_rating IS NOT NULL)`,
      [since]
    );
    const subjects = await safeAll(
      env,
      "SELECT subject, count(*) AS count FROM learning_sessions WHERE subject IS NOT NULL AND subject <> '' AND datetime(started_at) >= datetime('now', ?) GROUP BY subject ORDER BY count DESC",
      [since]
    );
    const leak = await safeFirst(
      env,
      `SELECT count(validator_json) AS checked,
        sum(CASE WHEN validator_json LIKE '%"status":"Đã chặn"%' THEN 1 ELSE 0 END) AS blocked,
        sum(CASE WHEN validator_json LIKE '%"status":"Lọt"%' THEN 1 ELSE 0 END) AS leaked
       FROM learning_sessions WHERE datetime(started_at) >= datetime('now', ?)`,
      [since]
    );

    // Độ trễ AI 24 giờ: chỉ có số khi có cuộc gọi thật
    const calls = await safeFirst(env, "SELECT count(latency_ms) AS n FROM ai_calls WHERE latency_ms IS NOT NULL AND datetime(created_at) >= datetime('now','-1 day')");
    let medianLatencyMs = null;
    let p95LatencyMs = null;
    const nCalls = Number(calls?.n || 0);
    if (nCalls > 0) {
      const at = async (q) =>
        num(
          (await safeFirst(
            env,
            "SELECT latency_ms FROM ai_calls WHERE latency_ms IS NOT NULL AND datetime(created_at) >= datetime('now','-1 day') ORDER BY latency_ms ASC LIMIT 1 OFFSET ?",
            [Math.min(nCalls - 1, Math.floor((nCalls - 1) * q))]
          ))?.latency_ms
        );
      medianLatencyMs = await at(0.5);
      p95LatencyMs = await at(0.95);
    }

    const pendingTeachers = await safeFirst(env, "SELECT count(*) AS n FROM teachers WHERE status = 'pending'");
    const contentReports = await safeFirst(env, "SELECT count(*) AS n FROM content_reports WHERE status = 'pending'");

    const recent = await safeAll(
      env,
      `SELECT s.id, s.family_id, s.child_id, s.subject, s.grade, s.problem_text, s.started_at, s.ended_at,
              ${DURATION_SQL} AS duration_seconds, s.teach_back_rating, s.quick_rating, s.validator_json, s.completed,
              f.name AS family_name, c.name AS child_name
       FROM learning_sessions s
       LEFT JOIN families f ON s.family_id = f.id
       LEFT JOIN children c ON s.child_id = c.id
       ORDER BY datetime(s.started_at) DESC LIMIT 10`
    );

    const totalSessions = Number(ses?.total || 0);
    return json(
      {
        ok: true,
        range,
        metrics: {
          totalFamilies: num(fam?.total),
          activeFamilies: num(activeFam?.n),
          // Lấy số lớn nhất trong: bảng children, hồ sơ con trong state, số con đã có buổi học trong kỳ
          totalStudents: (() => {
            const best = Math.max(Number(kids?.total || 0), Number(kidsKv?.total || 0), Number(activeKids?.n || 0));
            return best > 0 ? best : null;
          })(),
          activeStudents: num(activeKids?.n),
          totalSessions,
          avgMinutes: Number(ses?.timed || 0) > 0 && ses?.avgSec != null ? Math.round((ses.avgSec / 60) * 10) / 10 : null,
          activeSessionsNow: num(now?.n),
          selfRelianceRate: pct(self?.selfCount, Number(self?.rated || 0)),
          ratedSessions: Number(self?.rated || 0),
        },
        subjects,
        aiHealth: {
          totalCalls24h: nCalls,
          medianLatencyMs,
          p95LatencyMs,
          checkedSessions: Number(leak?.checked || 0),
          blockedLeaks: Number(leak?.checked || 0) > 0 ? Number(leak?.blocked || 0) : null,
          leakedCount: Number(leak?.checked || 0) > 0 ? Number(leak?.leaked || 0) : null,
        },
        pendingTasks: {
          pendingTeachers: num(pendingTeachers?.n),
          contentReports: num(contentReports?.n),
        },
        recentSessions: recent.map((r) => ({
          ...r,
          problem_text: isSupport ? null : r.problem_text,
          validator_status: validatorStatus(r.validator_json),
          validator_json: undefined,
        })),
      },
      200,
      corsHeaders
    );
  }

  /* ---------------- Gia đình: danh sách + chỉ số ---------------- */
  if (pathname === "/api/v1/admin/families-stats") {
    const families = await safeAll(
      env,
      `SELECT f.id, f.name, f.created_at,
        (SELECT count(*) FROM members m WHERE m.family_id = f.id) AS member_count,
        (SELECT count(*) FROM children c WHERE c.family_id = f.id) AS child_count,
        (SELECT count(*) FROM learning_sessions s WHERE s.family_id = f.id) AS session_count,
        (SELECT max(s.started_at) FROM learning_sessions s WHERE s.family_id = f.id) AS last_session_at,
        (SELECT max(m.last_seen_at) FROM members m WHERE m.family_id = f.id) AS last_seen_at
       FROM families f ORDER BY f.created_at DESC LIMIT 500`
    );

    // Chỉ số 7 ngày, tính trên các gia đình có buổi học trong 7 ngày
    const perFam = await safeAll(
      env,
      `SELECT s.family_id,
              count(DISTINCT date(datetime(s.started_at, '+7 hours'))) AS days,
              sum(${DURATION_SQL}) AS secs,
              count(${DURATION_SQL}) AS timed
       FROM learning_sessions s
       WHERE datetime(s.started_at) >= datetime('now','-7 days')
       GROUP BY s.family_id`
    );
    const activeCount = perFam.length;
    const avgDays = activeCount > 0 ? Math.round((perFam.reduce((a, r) => a + Number(r.days || 0), 0) / activeCount) * 10) / 10 : null;
    const timedFams = perFam.filter((r) => Number(r.timed || 0) > 0);
    const avgMinutesWeek = timedFams.length > 0 ? Math.round(timedFams.reduce((a, r) => a + Number(r.secs || 0), 0) / 60 / timedFams.length) : null;

    const famCount = await safeFirst(env, "SELECT count(*) AS n FROM families");
    const total = famCount ? Number(famCount.n || 0) : families.length;
    const seen7 = await safeFirst(
      env,
      "SELECT count(DISTINCT family_id) AS n FROM members WHERE last_seen_at IS NOT NULL AND datetime(last_seen_at) >= datetime('now','-7 days')"
    );
    const openedPct = total > 0 && seen7 ? pct(seen7.n, total) : null;

    return json(
      {
        ok: true,
        families,
        summary: {
          totalFamilies: total,
          activeFamilies7d: activeCount,
          avgStudyDays7d: avgDays,
          avgMinutesPerWeek: avgMinutesWeek,
          openedApp7dPct: openedPct,
        },
      },
      200,
      corsHeaders
    );
  }

  /* ---------------- Gia đình: chi tiết ---------------- */
  if (pathname === "/api/v1/admin/family-detail") {
    const id = (url.searchParams.get("id") || "").trim();
    if (!id) return json({ error: { code: "BAD_REQUEST", message: "Thiếu mã gia đình" } }, 400, corsHeaders);
    const family = await safeFirst(env, "SELECT id, name, created_at FROM families WHERE id = ?", [id]);
    if (!family) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy gia đình" } }, 404, corsHeaders);

    const members = await safeAll(env, "SELECT id, display_name, role, relation, last_seen_at, created_at FROM members WHERE family_id = ? ORDER BY created_at ASC", [id]);

    // Các con: ưu tiên bảng children; nếu trống thì đọc từ trạng thái đồng bộ của gia đình
    let children = (await safeAll(env, "SELECT * FROM children WHERE family_id = ?", [id])).map((c) => ({
      id: c.id,
      name: c.name || c.display_name || null,
      grade: c.grade ?? null,
      source: "d1",
    }));
    if (children.length === 0) {
      const st = await safeFirst(env, "SELECT value FROM _kv_store WHERE key = ?", [`fam:${id}:state`]);
      try {
        const state = st?.value ? JSON.parse(st.value) : null;
        const list = Array.isArray(state?.children) ? state.children : Array.isArray(state?.S?.children) ? state.S.children : [];
        children = list.map((c) => ({ id: c.id, name: c.name || null, grade: c.grade ?? null, emoji: c.emoji || null, source: "sync" }));
      } catch (e) {}
    }

    const sessions = await safeAll(
      env,
      `SELECT s.id, s.child_id, s.subject, s.grade, s.problem_text, s.started_at, ${DURATION_SQL} AS duration_seconds,
              s.teach_back_rating, s.quick_rating, s.completed, c.name AS child_name
       FROM learning_sessions s LEFT JOIN children c ON s.child_id = c.id
       WHERE s.family_id = ? ORDER BY datetime(s.started_at) DESC LIMIT 10`,
      [id]
    );
    const totals = await safeFirst(
      env,
      `SELECT count(*) AS total, sum(${DURATION_SQL}) AS secs, count(${DURATION_SQL}) AS timed FROM learning_sessions s WHERE s.family_id = ?`,
      [id]
    );
    const classes = await safeAll(
      env,
      `SELECT cs.id AS link_id, cs.roster_name, cs.status, cs.child_id, cl.id AS class_id, cl.name AS class_name, cl.grade,
              cl.school_name, t.display_name AS teacher_name
       FROM class_students cs
       JOIN classes cl ON cs.class_id = cl.id
       LEFT JOIN teachers t ON cl.teacher_id = t.id
       WHERE cs.family_id = ?
       ORDER BY cs.created_at DESC`,
      [id]
    );

    return json(
      {
        ok: true,
        family,
        members,
        children,
        sessions: sessions.map((s) => ({ ...s, problem_text: isSupport ? null : s.problem_text })),
        totals: {
          sessions: Number(totals?.total || 0),
          minutes: Number(totals?.timed || 0) > 0 ? Math.round(Number(totals.secs || 0) / 60) : null,
        },
        classes,
      },
      200,
      corsHeaders
    );
  }

  /* ---------------- Buổi học & AI: chỉ số kiểm định ---------------- */
  if (pathname === "/api/v1/admin/sessions-stats") {
    const r = await safeFirst(
      env,
      `SELECT count(*) AS total,
        count(validator_json) AS checked,
        sum(CASE WHEN validator_json LIKE '%"status":"Đã chặn"%' THEN 1 ELSE 0 END) AS blocked,
        sum(CASE WHEN validator_json LIKE '%"status":"Lọt"%' THEN 1 ELSE 0 END) AS leaked,
        sum(CASE WHEN validator_json LIKE '%"status":"Cảnh báo"%' THEN 1 ELSE 0 END) AS warned
       FROM learning_sessions`
    );
    const reports = await safeFirst(env, "SELECT count(*) AS n FROM content_reports WHERE status = 'pending'");
    const checked = Number(r?.checked || 0);
    const leaked = Number(r?.leaked || 0);
    return json(
      {
        ok: true,
        total: Number(r?.total || 0),
        checked,
        blocked: checked > 0 ? Number(r?.blocked || 0) : null,
        leaked: checked > 0 ? leaked : null,
        warned: checked > 0 ? Number(r?.warned || 0) : null,
        passRate: checked > 0 ? pct(checked - leaked, checked) : null,
        pendingContentReports: num(reports?.n),
      },
      200,
      corsHeaders
    );
  }

  /* ---------------- Buổi học & AI: chi tiết (chịu được cả 2 kiểu cột session_events) ---------------- */
  if (pathname === "/api/v1/admin/session-detail") {
    const id = (url.searchParams.get("id") || "").trim();
    if (!id) return json({ error: { code: "BAD_REQUEST", message: "Thiếu mã buổi học" } }, 400, corsHeaders);
    const session = await safeFirst(
      env,
      `SELECT s.*, f.name AS family_name, c.name AS child_name
       FROM learning_sessions s LEFT JOIN families f ON s.family_id = f.id LEFT JOIN children c ON s.child_id = c.id
       WHERE s.id = ?`,
      [id]
    );
    if (!session) return json({ error: { code: "NOT_FOUND", message: "Không tìm thấy buổi học" } }, 404, corsHeaders);
    if (isSupport) {
      session.problem_text = null;
      session.ai_output_json = null;
    }
    const raw = await safeAll(env, "SELECT * FROM session_events WHERE session_id = ? LIMIT 500", [id]);
    const events = raw
      .map((e) => ({
        id: e.id ?? null,
        type: e.event_type || e.type || null,
        step: e.step_index ?? e.step ?? null,
        at: e.created_at || e.ts || null,
      }))
      .sort((a, b) => String(a.at || "").localeCompare(String(b.at || "")));
    return json({ ok: true, session, events }, 200, corsHeaders);
  }

  /* ---------------- Báo cáo & NPS ---------------- */
  if (pathname === "/api/v1/admin/nps-summary") {
    const s = await safeFirst(
      env,
      `SELECT count(*) AS total, avg(score) AS avgScore,
        sum(CASE WHEN score >= 9 THEN 1 ELSE 0 END) AS promoters,
        sum(CASE WHEN score BETWEEN 7 AND 8 THEN 1 ELSE 0 END) AS passives,
        sum(CASE WHEN score <= 6 THEN 1 ELSE 0 END) AS detractors,
        sum(CASE WHEN comment IS NOT NULL AND trim(comment) <> '' THEN 1 ELSE 0 END) AS withComment
       FROM nps_responses`
    );
    const total = Number(s?.total || 0);
    let tagStats = [];
    if (total > 0) {
      const rows = await safeAll(env, "SELECT tags FROM nps_responses WHERE tags IS NOT NULL AND trim(tags) <> '' LIMIT 5000");
      const counts = new Map();
      for (const r of rows) {
        let list = [];
        const raw = String(r.tags || "").trim();
        if (raw.startsWith("[")) {
          try {
            list = JSON.parse(raw);
          } catch (e) {}
        } else list = raw.split(/[,;|]/);
        const uniq = new Set(list.map((t) => String(t || "").trim()).filter(Boolean));
        uniq.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1));
      }
      tagStats = [...counts.entries()]
        .map(([tag, count]) => ({ tag, count, pct: pct(count, total) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    }
    const recentFeedback = await safeAll(
      env,
      `SELECT n.id, n.score, n.tags, n.comment, n.created_at, f.name AS family_name
       FROM nps_responses n LEFT JOIN families f ON n.family_id = f.id
       ORDER BY n.created_at DESC LIMIT 20`
    );
    const promoters = Number(s?.promoters || 0);
    const detractors = Number(s?.detractors || 0);
    return json(
      {
        ok: true,
        totalResponses: total,
        npsScore: total > 0 ? Math.round(((promoters - detractors) / total) * 100) : null,
        avgScore: total > 0 && s?.avgScore != null ? Math.round(Number(s.avgScore) * 10) / 10 : null,
        promoters: total > 0 ? promoters : null,
        passives: total > 0 ? Number(s?.passives || 0) : null,
        detractors: total > 0 ? detractors : null,
        commentPct: pct(s?.withComment, total),
        tagStats,
        recentFeedback,
      },
      200,
      corsHeaders
    );
  }

  /* ---------------- Bản đồ khung giờ (giờ Việt Nam) ---------------- */
  if (pathname === "/api/v1/admin/peak-hours") {
    const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get("days") || "30", 10) || 30));
    const cells = await safeAll(
      env,
      `SELECT CAST(strftime('%w', datetime(started_at, '+7 hours')) AS INTEGER) AS dow,
              CAST(strftime('%H', datetime(started_at, '+7 hours')) AS INTEGER) AS hour,
              count(*) AS count
       FROM learning_sessions
       WHERE started_at IS NOT NULL AND datetime(started_at) IS NOT NULL AND datetime(started_at) >= datetime('now', ?)
       GROUP BY dow, hour`,
      [`-${days} days`]
    );
    const total = cells.reduce((a, c) => a + Number(c.count || 0), 0);
    return json({ ok: true, days, timezone: "Asia/Ho_Chi_Minh", total, cells }, 200, corsHeaders);
  }

  return null;
}

export default { handle };
