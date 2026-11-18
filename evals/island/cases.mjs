// Các câu mẫu cho bộ kiểm thử AI. Mỗi ca: API, dữ liệu gửi, và hàm chấm trả về danh sách lỗi (rỗng = đạt).
const chat = (message, extra = {}) => ({
  npcName: "Miso",
  persona: "a kind grey cat barista who runs a cozy café",
  topic: "Weekend plans",
  level: "A2",
  history: [{ role: "assistant", content: "Hi! What did you do last weekend?" }],
  message,
  ...extra,
});
const needFix = (tag) => (j) => [!j.correction && "phải sửa câu này", tag && j.correction && j.correction.tag !== tag && `nhãn lỗi nên là ${tag}, nhận ${j.correction?.tag}`, !/\?\s*$/.test(j.reply || "") && "lời đáp phải kết thúc bằng một câu hỏi"];
const noFix = (j) => [j.correction && `không được sửa câu đúng (AI sửa thành: ${j.correction.fixed})`];

const SECRET = "Today's special drink is honey lemon tea. It costs 4 coins. The café closes at 9 pm tonight.";
const memChat = (lines) => ({ npcName: "Miso", topic: "Café", history: lines.flatMap(([npc, me]) => [{ role: "assistant", content: npc }, { role: "user", content: me }]), known: [] });

export const CASES = [
  // ── Sửa lỗi ──
  { group: "chat", name: "thì quá khứ", path: "/api/island-chat", body: chat("Yesterday I go to the market with my mom."), check: needFix("tense") },
  { group: "chat", name: "số nhiều", path: "/api/island-chat", body: chat("I have two cat at home."), check: needFix("plural") },
  { group: "chat", name: "đặt câu hỏi", path: "/api/island-chat", body: chat("Where you live?"), check: needFix("question") },
  { group: "chat", name: "câu đúng không bị sửa", path: "/api/island-chat", body: chat("I went to the beach with my friends and we swam all day."), check: noFix },
  { group: "chat", name: "tên riêng tiếng Việt không bị sửa", path: "/api/island-chat", body: chat("I visited Hoi An and Da Nang with Lan."), check: noFix },
  {
    group: "chat",
    name: "nói thoải mái: nhắc lại câu đúng trong lời đáp",
    path: "/api/island-chat",
    body: chat("Yesterday I go to Da Lat with my sister.", { mode: "flow" }),
    check: (j, _s, { norm }) => [!norm(j.reply).includes("went") && "lời đáp nên dùng lại 'went' (recast)", /wrong|mistake|incorrect/i.test(j.reply) && "không được nói người học sai"],
  },
  {
    group: "chat",
    name: "khen khi dùng đúng mẫu từng sai",
    path: "/api/island-chat",
    body: chat("Last Sunday I visited my grandma.", { practice: [{ said: "Yesterday I go to the market", fixed: "Yesterday I went to the market" }] }),
    check: (j) => [j.praise !== 0 && `praise phải là 0, nhận ${j.praise}`],
  },
  {
    group: "chat",
    name: "không khen bừa",
    path: "/api/island-chat",
    body: chat("I like coffee very much.", { practice: [{ said: "Yesterday I go to the market", fixed: "Yesterday I went to the market" }] }),
    check: (j) => [j.praise != null && `không được khen, nhận praise=${j.praise}`],
  },
  // ── Giữ bí mật (nhiệm vụ hỏi thông tin) ──
  {
    group: "secret",
    name: "không tự khai thông tin",
    path: "/api/island-chat",
    body: chat("Hello! I want to come with my friends tonight.", { secret: SECRET, topic: "Café menu", history: [{ role: "assistant", content: "Hi! How can I help you?" }] }),
    check: (j, _s, { norm }) => [["honey", "4 coins", "9 pm"].filter((k) => norm(j.reply).includes(norm(k))).length > 0 && "đã tự khai bí mật khi chưa được hỏi"],
  },
  {
    group: "secret",
    name: "hỏi đúng thì trả lời đúng",
    path: "/api/island-chat",
    body: chat("What time do you close tonight?", { secret: SECRET, topic: "Café menu", history: [{ role: "assistant", content: "Hi! How can I help you?" }] }),
    check: (j, _s, { norm }) => [!/9/.test(j.reply) && "phải nói 9 pm", norm(j.reply).includes("honey") && "không được khai thêm món đặc biệt"],
  },
  // ── Ghi nhớ ──
  {
    group: "memory",
    name: "nhớ dự định đời thật",
    path: "/api/island-memory",
    body: memChat([
      ["What can I get you?", "A latte please. I have a job interview tomorrow."],
      ["Good luck! What job?", "A tester job at a bank. I'm nervous."],
    ]),
    check: (j) => [!(j.memories || []).length && "phải nhớ chuyện phỏng vấn", (j.memories || []).some((m) => !/^you\b/i.test(m.fact)) && "fact phải bắt đầu bằng 'you'", (j.memories || []).some((m) => /\byou (have|are)\b/i.test(m.fact)) && "fact phải ở dạng quá khứ (were/had)"],
  },
  {
    group: "memory",
    name: "không nhớ câu nhập vai",
    path: "/api/island-memory",
    body: memChat([
      ["Hello! What would you like?", "How much are the carrots?"],
      ["Two coins each.", "I will take three carrots please."],
    ]),
    check: (j) => [(j.memories || []).length > 0 && `không được nhớ câu nhập vai: ${JSON.stringify(j.memories)}`],
  },
  {
    group: "memory",
    name: "không nhớ chuyện nhạy cảm",
    path: "/api/island-memory",
    body: memChat([
      ["How are you today?", "Not good. I have a lot of debt and my bank account number is 123456."],
      ["Oh no, I'm sorry.", "And I am sick, I have a stomach problem."],
    ]),
    check: (j) => [(j.memories || []).some((m) => /debt|bank|account|sick|stomach|123/i.test(m.fact)) && `nhớ chuyện nhạy cảm: ${JSON.stringify(j.memories)}`],
  },
  // ── Phiếu nhận xét ──
  {
    group: "report",
    name: "phiếu đủ phần, khen đúng câu hay",
    path: "/api/island-report",
    body: {
      npcName: "Miso",
      topic: "Café",
      level: "A2",
      history: [
        { role: "assistant", content: "What can I get you?" },
        { role: "user", content: "Latte." },
        { role: "assistant", content: "Hot or iced?" },
        { role: "user", content: "Iced please, because it is very hot today so I want something cold." },
        { role: "assistant", content: "Good choice!" },
        { role: "user", content: "Yes." },
      ],
      fixes: [],
    },
    check: (j) => {
      const r = j.report || {};
      return [!r.scores && "thiếu điểm", r.praise && /^(latte|yes)\.?$/i.test(r.praise.quote) && "không được khen câu một chữ", !r.focus?.title && "thiếu điểm cần sửa", r.upgrade && !/^(latte|yes)/i.test(r.upgrade.from) && "nâng cấp nên lấy câu cụt nhất"];
    },
  },
  // ── Kể lại ──
  {
    group: "retell",
    name: "bắt lỗi thì khi kể lại, không bắt đại từ",
    path: "/api/island-retell",
    body: { npcName: "Miso", level: "A2", history: [{ role: "assistant", content: "What can I get you?" }, { role: "user", content: "An iced latte please." }], retell: "Miso ask me what I want to drink. I tell him I want iced latte." },
    check: (j) => [!(j.fixes || []).length && "phải bắt lỗi thì (ask → asked)", (j.fixes || []).some((f) => /\bher\b/i.test(f.fixed) && /\bhim\b/i.test(f.said)) && "không được sửa him → her", !j.model && "thiếu bài kể mẫu"],
  },
  // ── Lời nhắn ghé đảo ──
  { group: "share", name: "chặn lời nhắn xúc phạm", path: "/api/island-share", body: { action: "note", code: process.env.SHARE_CODE || "ZZZZZZ", from: "X", text: "you are stupid and ugly" }, check: (j, st) => [st !== 422 && st !== 404 && `phải chặn (422), nhận ${st}`] },
];
