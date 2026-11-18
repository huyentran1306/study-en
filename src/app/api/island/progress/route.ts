import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { API_BASE } from "@/lib/api";
import { mergeStates, normalizeState, summary, type IslandState } from "@/lib/island/state";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Tiến độ Chit Chat Island lưu trong D1 (binding DB, bảng island_progress).
// Định danh = user id của hệ thống tài khoản hiện có (localStorage "studyen-uid").

const UID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_BYTES = 512 * 1024;

interface D1Like {
  prepare(sql: string): { bind(...v: unknown[]): { first<T>(): Promise<T | null>; run(): Promise<unknown> } };
}

async function getDb(): Promise<D1Like | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return ((env as unknown as { DB?: D1Like }).DB as D1Like) || null;
  } catch {
    return null;
  }
}

// Cache trong isolate: user id đã xác minh tồn tại.
const knownUsers = new Map<string, number>();
const KNOWN_TTL = 6 * 60 * 60 * 1000;

/** Chỉ nhận ghi cho user có thật trên máy chủ tài khoản. Nếu máy chủ tài khoản không liên lạc được thì cho qua. */
async function userExists(uid: string): Promise<boolean> {
  // Chỉ khi chạy dev: cho phép id thử nghiệm để test mà không tạo user thật.
  if (process.env.NODE_ENV !== "production" && uid.startsWith("local-test-")) return true;
  const t = knownUsers.get(uid);
  if (t && Date.now() - t < KNOWN_TTL) return true;
  try {
    const res = await fetch(`${API_BASE}/users/${encodeURIComponent(uid)}`, { signal: AbortSignal.timeout(4000) });
    if (res.status === 404) return false;
    const j = (await res.json().catch(() => null)) as { success?: boolean } | null;
    if (j && j.success === false && res.status < 500) return false;
  } catch {
    return true;
  }
  knownUsers.set(uid, Date.now());
  return true;
}

async function readRow(db: D1Like, uid: string): Promise<{ state: IslandState; updatedAt: string } | null> {
  const row = await db.prepare("SELECT data, updated_at FROM island_progress WHERE user_id = ?").bind(uid).first<{ data: string; updated_at: string }>();
  if (!row) return null;
  try {
    return { state: normalizeState(JSON.parse(row.data)), updatedAt: row.updated_at };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get("uid") || "";
  if (!UID_RE.test(uid)) return NextResponse.json({ error: "uid không hợp lệ" }, { status: 400 });
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "Database chưa được cấu hình" }, { status: 503 });
  try {
    const row = await readRow(db, uid);
    return NextResponse.json({ data: row?.state ?? null, updatedAt: row?.updatedAt ?? null }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("island progress GET:", e);
    return NextResponse.json({ error: "Không đọc được tiến độ" }, { status: 500 });
  }
}

async function save(request: NextRequest) {
  const raw = await request.text();
  if (raw.length > MAX_BYTES) return NextResponse.json({ error: "Dữ liệu quá lớn" }, { status: 413 });
  let body: { uid?: string; data?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "JSON không hợp lệ" }, { status: 400 });
  }
  const uid = String(body.uid || "");
  if (!UID_RE.test(uid)) return NextResponse.json({ error: "uid không hợp lệ" }, { status: 400 });
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "Database chưa được cấu hình" }, { status: 503 });
  if (!(await userExists(uid))) return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 403 });

  try {
    const incoming = normalizeState(body.data);
    const existing = await readRow(db, uid);
    const merged = existing ? mergeStates(existing.state, incoming) : incoming;
    merged.owner = uid;
    merged.updatedAt = new Date().toISOString();
    const sum = summary(merged);
    await db
      .prepare(
        `INSERT INTO island_progress (user_id, data, xp, lessons_done, words_count, stars, start_date, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(user_id) DO UPDATE SET
           data = excluded.data, xp = excluded.xp, lessons_done = excluded.lessons_done,
           words_count = excluded.words_count, stars = excluded.stars, start_date = excluded.start_date,
           updated_at = datetime('now')`,
      )
      .bind(uid, JSON.stringify(merged), sum.xp, sum.lessonsDone, sum.wordsCount, sum.stars, merged.startDate)
      .run();
    return NextResponse.json({ data: merged, updatedAt: merged.updatedAt });
  } catch (e) {
    console.error("island progress PUT:", e);
    return NextResponse.json({ error: "Không lưu được tiến độ" }, { status: 500 });
  }
}

export const PUT = save;
export const POST = save;
