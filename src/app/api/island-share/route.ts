import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Ghé đảo bạn bè (bảng island_share, island_notes — migrations/0002).
// - Chủ đảo tự bật chia sẻ; chỉ gửi "ảnh chụp" công khai. Sửa / gỡ cần owner_key (bí mật, chỉ có trên máy chủ đảo).
// - Bạn bè xem bằng mã, để lại lời nhắn tiếng Anh; AI lọc lời nhắn không phù hợp và gợi ý câu tự nhiên hơn.

interface Stmt {
  bind(...v: unknown[]): Stmt;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}
interface D1Like {
  prepare(sql: string): Stmt;
}

const CODE_RE = /^[A-Z0-9]{6}$/;
const KEY_RE = /^[A-Za-z0-9_-]{24,64}$/;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const plain = (v: unknown, max: number) => String(v || "").replace(/[\u0000-\u001f<>{}`"\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

async function env() {
  const { env } = await getCloudflareContext({ async: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return env as any as { DB?: D1Like; AI?: { run: (m: string, i: unknown) => Promise<unknown> } };
}

/** Chỉ giữ các trường công khai của ảnh chụp đảo. */
function cleanSnapshot(x: unknown) {
  const s = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  const n = (v: unknown, max: number) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));
  const pond = (Array.isArray(s.pond) ? s.pond : []).slice(0, 9).map((p) => {
    const q = (p || {}) as Record<string, unknown>;
    return { kind: ["shrimp", "crab", "lobster"].includes(q.kind as string) ? (q.kind as string) : "shrimp", ready: q.ready === true };
  });
  const trophies = (Array.isArray(s.trophies) ? s.trophies : []).filter((t): t is string => typeof t === "string" && /^[a-z0-9-]{1,30}$/.test(t)).slice(0, 20);
  return { level: n(s.level, 99) || 1, garden: n(s.garden, 50), pond, office: s.office === true, trophies, streak: n(s.streak, 9999), stars: n(s.stars, 9999), chapters: n(s.chapters, 13) };
}

function newCode(): string {
  const b = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(b, (x) => ALPHABET[x % ALPHABET.length]).join("");
}

export async function GET(request: NextRequest) {
  const code = (request.nextUrl.searchParams.get("code") || "").toUpperCase();
  if (!CODE_RE.test(code)) return NextResponse.json({ error: "Mã không hợp lệ" }, { status: 400 });
  const { DB } = await env();
  if (!DB) return NextResponse.json({ error: "Database chưa được cấu hình" }, { status: 503 });
  const row = await DB.prepare("SELECT name, snapshot, updated_at FROM island_share WHERE code = ?").bind(code).first<{ name: string; snapshot: string; updated_at: string }>();
  if (!row) return NextResponse.json({ error: "Không tìm thấy đảo với mã này" }, { status: 404 });
  const notes = await DB.prepare("SELECT id, from_name, text, fixed, created_at FROM island_notes WHERE code = ? ORDER BY id DESC LIMIT 30").bind(code).all<{ id: number; from_name: string; text: string; fixed: string; created_at: string }>();
  return NextResponse.json({ code, name: row.name, snapshot: JSON.parse(row.snapshot), updatedAt: row.updated_at, notes: notes.results }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 8000) return NextResponse.json({ error: "Quá lớn" }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "JSON không hợp lệ" }, { status: 400 });
  }
  const { DB, AI } = await env();
  if (!DB) return NextResponse.json({ error: "Database chưa được cấu hình" }, { status: 503 });
  const action = String(body.action || "");
  const code = String(body.code || "").toUpperCase();
  const key = String(body.key || "");

  if (action === "publish") {
    if (!KEY_RE.test(key)) return NextResponse.json({ error: "Khoá không hợp lệ" }, { status: 400 });
    const name = plain(body.name, 30) || "Bạn đảo";
    const snap = JSON.stringify(cleanSnapshot(body.snapshot));
    if (CODE_RE.test(code)) {
      const row = await DB.prepare("SELECT owner_key FROM island_share WHERE code = ?").bind(code).first<{ owner_key: string }>();
      if (row && row.owner_key === key) {
        await DB.prepare("UPDATE island_share SET name = ?, snapshot = ?, updated_at = datetime('now') WHERE code = ?").bind(name, snap, code).run();
        return NextResponse.json({ code });
      }
    }
    for (let i = 0; i < 5; i++) {
      const c = newCode();
      const taken = await DB.prepare("SELECT 1 AS x FROM island_share WHERE code = ?").bind(c).first();
      if (taken) continue;
      await DB.prepare("INSERT INTO island_share (code, owner_key, name, snapshot) VALUES (?, ?, ?, ?)").bind(c, key, name, snap).run();
      return NextResponse.json({ code: c });
    }
    return NextResponse.json({ error: "Thử lại sau" }, { status: 503 });
  }

  if (action === "unpublish") {
    if (!CODE_RE.test(code) || !KEY_RE.test(key)) return NextResponse.json({ error: "Không hợp lệ" }, { status: 400 });
    const row = await DB.prepare("SELECT owner_key FROM island_share WHERE code = ?").bind(code).first<{ owner_key: string }>();
    if (!row || row.owner_key !== key) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    await DB.prepare("DELETE FROM island_notes WHERE code = ?").bind(code).run();
    await DB.prepare("DELETE FROM island_share WHERE code = ?").bind(code).run();
    return NextResponse.json({ ok: true });
  }

  if (action === "note") {
    if (!CODE_RE.test(code)) return NextResponse.json({ error: "Mã không hợp lệ" }, { status: 400 });
    const text = plain(body.text, 200);
    const from = plain(body.from, 24) || "Một người bạn";
    if (text.split(" ").length < 2) return NextResponse.json({ error: "Viết ít nhất vài từ nhé" }, { status: 400 });
    const exists = await DB.prepare("SELECT 1 AS x FROM island_share WHERE code = ?").bind(code).first();
    if (!exists) return NextResponse.json({ error: "Không tìm thấy đảo" }, { status: 404 });
    const count = await DB.prepare("SELECT COUNT(*) AS n FROM island_notes WHERE code = ? AND created_at > datetime('now', '-1 day')").bind(code).first<{ n: number }>();
    if ((count?.n || 0) >= 30) return NextResponse.json({ error: "Đảo này nhận đủ lời nhắn hôm nay rồi, mai quay lại nhé" }, { status: 429 });
    // AI: lọc lời nhắn không phù hợp + gợi ý câu tiếng Anh tự nhiên hơn. AI lỗi thì vẫn nhận (đã giới hạn độ dài).
    let fixed = "";
    try {
      const r = (await AI!.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
        messages: [
          {
            role: "system",
            content:
              'A learner of English leaves a short note on a friend\'s island in a kids-friendly language game. Return JSON {"ok": boolean, "fixed": string}. ok=false if the note is rude, sexual, hateful, bullying, spam, asks for or shares personal contact info (phone, address, social accounts), or links. "fixed": the same note in natural, correct English (same meaning; same text if already fine).',
          },
          { role: "user", content: text },
        ],
        max_tokens: 150,
        temperature: 0,
        response_format: { type: "json_schema", json_schema: { type: "object", properties: { ok: { type: "boolean" }, fixed: { type: "string" } }, required: ["ok", "fixed"] } },
      })) as { response?: unknown };
      const j = (typeof r.response === "string" ? JSON.parse(r.response) : r.response) as { ok?: boolean; fixed?: string } | undefined;
      if (j && j.ok === false) return NextResponse.json({ error: "Lời nhắn này chưa phù hợp. Viết điều gì đó thân thiện về đảo của bạn mình nhé!" }, { status: 422 });
      fixed = plain(j?.fixed, 220);
    } catch (e) {
      console.error("island-share note AI:", e);
    }
    if (/https?:|www\.|@\w/.test(text)) return NextResponse.json({ error: "Lời nhắn không được chứa đường link hay tài khoản." }, { status: 422 });
    const same = fixed.toLowerCase().replace(/[^a-z]/g, "") === text.toLowerCase().replace(/[^a-z]/g, "");
    await DB.prepare("INSERT INTO island_notes (code, from_name, text, fixed) VALUES (?, ?, ?, ?)").bind(code, from, text, same ? "" : fixed).run();
    return NextResponse.json({ ok: true, fixed: same ? "" : fixed });
  }

  return NextResponse.json({ error: "Không rõ thao tác" }, { status: 400 });
}
