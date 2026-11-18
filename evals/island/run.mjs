// Bộ kiểm thử AI của Đảo Tám Chuyện: chạy các câu mẫu qua API thật, chấm tự động.
// Dùng sau mỗi lần sửa prompt / đổi mô hình:  npm run eval:island  (mặc định http://localhost:3000)
//   BASE=https://... npm run eval:island       chạy với máy chủ khác
//   npm run eval:island -- chat memory          chỉ chạy vài nhóm
import { CASES } from "./cases.mjs";

const BASE = process.env.BASE || "http://localhost:3000";
const only = process.argv.slice(2);
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

async function call(path, body) {
  const t = Date.now();
  const r = await fetch(BASE + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, j, ms: Date.now() - t };
}

let pass = 0;
let fail = 0;
const slow = [];
for (const c of CASES) {
  if (only.length && !only.includes(c.group)) continue;
  let res;
  try {
    res = await call(c.path, c.body);
  } catch (e) {
    res = { status: 0, j: { error: String(e) }, ms: 0 };
  }
  const problems = [];
  if (res.j.offline) problems.push("AI offline / sai định dạng");
  else problems.push(...c.check(res.j, res.status, { norm }).filter(Boolean));
  if (res.ms > 8000) slow.push(`${c.name} ${res.ms}ms`);
  if (problems.length) {
    fail++;
    console.log(`FAIL [${c.group}] ${c.name}\n     → ${problems.join("; ")}\n     ${JSON.stringify(res.j).slice(0, 300)}`);
  } else {
    pass++;
    console.log(`ok   [${c.group}] ${c.name} (${res.ms}ms)`);
  }
}
console.log(`\n${pass} đạt, ${fail} trượt${slow.length ? ` · chậm: ${slow.join(", ")}` : ""}`);
process.exit(fail ? 1 : 0);
