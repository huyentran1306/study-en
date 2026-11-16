// Nội dung học của Chit Chat Island — lộ trình 3 tháng (13 tuần), A1 → A2 → B1.
// Mỗi tuần = 1 chương. Mỗi chương có 1 bài học 10 phút gồm 6 bước:
// Từ mới → Nghe hội thoại mẫu → Luyện bằng trò chơi → Nhập vai → Câu cứu nguy → Ôn nhanh.

export type NpcId = "bo" | "miso" | "mallow" | "pip" | "kero";
export type SceneId = "cafe" | "market" | "airport" | "pond" | "tree";
export type Level = "A1" | "A2" | "B1";

export interface Word {
  en: string;
  vi: string;
  ex: string;
}

export interface Line {
  who: NpcId | "you";
  en: string;
  vi: string;
}

export interface Option {
  en: string;
  vi: string;
  ok: boolean;
  /** Giải thích bằng tiếng Việt: vì sao đúng / vì sao chưa đúng. */
  why: string;
}

export interface Turn {
  npcLine: string;
  npcVi: string;
  hints: string[];
  options: Option[];
}

export interface Rescue {
  /** Câu NPC nói rất nhanh, không hiện chữ. */
  fast: string;
  fastVi: string;
  options: Option[];
  /** NPC nói lại chậm và dễ hơn sau khi bạn dùng câu cứu nguy. */
  slow: string;
  slowVi: string;
}

export interface BuilderItem {
  en: string;
  vi: string;
  decoys: string[];
}

export interface Chapter {
  id: number;
  level: Level;
  week: number;
  title: string;
  subtitle: string;
  place: string;
  npc: NpcId;
  scene: SceneId;
  goal: string;
  quest: { en: string; vi: string };
  words: Word[];
  dialogue: Line[];
  turns: Turn[];
  rescue: Rescue;
  builder: BuilderItem[];
  chat: { opener: string; openerVi: string; topic: string; persona: string };
}

export interface Challenge {
  id: string; // "c1" | "c2" | "c3"
  level: Level;
  week: number;
  title: string;
  subtitle: string;
  chapters: number[];
}

export const NPCS: Record<NpcId, { name: string; role: string; bg: string; pitch: number; rate: number }> = {
  bo: { name: "Bơ", role: "Bạn — chú shiba mới đến đảo", bg: "#DCEFC6", pitch: 1.15, rate: 1 },
  miso: { name: "Miso", role: "Chủ quán cà phê", bg: "#F3E1C8", pitch: 1.05, rate: 0.95 },
  mallow: { name: "Mallow", role: "Cô bán rau ở chợ", bg: "#FADDE3", pitch: 1.3, rate: 0.95 },
  pip: { name: "Pip", role: "Nhân viên sân bay", bg: "#D7ECF5", pitch: 1.0, rate: 0.95 },
  kero: { name: "Kero", role: "Hướng dẫn viên", bg: "#E4EFC9", pitch: 0.85, rate: 0.92 },
};

export const PLACES: Record<SceneId, { name: string; color: string }> = {
  cafe: { name: "Quán Miso", color: "#F3E1C8" },
  market: { name: "Chợ Cà Rốt", color: "#FADDE3" },
  airport: { name: "Sân Bay Mây", color: "#D7ECF5" },
  pond: { name: "Hồ Kero", color: "#DDF0F5" },
  tree: { name: "Cây Anh Đào", color: "#FCE4EA" },
};

export const LEVELS: { id: Level; name: string; desc: string; weeks: string }[] = [
  { id: "A1", name: "Đảo Làm Quen", desc: "Chào hỏi, gọi món, mua sắm, hỏi đường", weeks: "Tuần 1–4" },
  { id: "A2", name: "Đảo Đi Đây Đó", desc: "Sân bay, nhà hàng, gọi điện, đi khám", weeks: "Tuần 5–8" },
  { id: "B1", name: "Đảo Kết Bạn", desc: "Small talk, rủ rê, kể chuyện, phàn nàn, phỏng vấn", weeks: "Tuần 9–13" },
];

/** Túi câu cứu nguy — dùng khi không nghe rõ hoặc không hiểu. */
export const RESCUE_BAG: { en: string; vi: string }[] = [
  { en: "Sorry, could you say that again?", vi: "Xin lỗi, bạn nói lại được không?" },
  { en: "Could you speak a bit more slowly, please?", vi: "Bạn nói chậm hơn một chút được không?" },
  { en: "Sorry, what does that mean?", vi: "Xin lỗi, cái đó nghĩa là gì?" },
  { en: "Do you mean...?", vi: "Ý bạn là... phải không?" },
  { en: "Could you write that down for me?", vi: "Bạn viết ra giúp mình được không?" },
  { en: "So..., right?", vi: "Vậy là..., đúng không? (kiểm tra lại ý)" },
];

export const CHAPTERS: Chapter[] = [
  // ───────────────────────── A1 · Đảo Làm Quen ─────────────────────────
  {
    id: 1,
    level: "A1",
    week: 1,
    title: "Chào hỏi & giới thiệu",
    subtitle: "Tên, quê, nghề, sở thích",
    place: "Cây Anh Đào",
    npc: "pip",
    scene: "tree",
    goal: "Chào hỏi, nói tên, quê, nghề nghiệp và hỏi lại người khác.",
    quest: { en: "Pip is having a picnic under the cherry tree. Go say hi!", vi: "Pip đang picnic dưới cây anh đào. Qua chào bạn ấy nhé!" },
    words: [
      { en: "Nice to meet you", vi: "Rất vui được gặp bạn", ex: "Hi, I'm Bơ. Nice to meet you!" },
      { en: "be from", vi: "đến từ", ex: "I'm from Vietnam." },
      { en: "hometown", vi: "quê nhà", ex: "My hometown is Da Nang." },
      { en: "work as", vi: "làm nghề", ex: "I work as a designer." },
      { en: "hobby", vi: "sở thích", ex: "My hobby is cooking." },
      { en: "What about you?", vi: "Còn bạn thì sao?", ex: "I love music. What about you?" },
    ],
    dialogue: [
      { who: "pip", en: "Hi there! I'm Pip. What's your name?", vi: "Chào bạn! Mình là Pip. Bạn tên gì?" },
      { who: "you", en: "Hi, Pip! I'm Bơ. Nice to meet you.", vi: "Chào Pip! Mình là Bơ. Rất vui được gặp bạn." },
      { who: "pip", en: "Nice to meet you too. Where are you from?", vi: "Mình cũng rất vui được gặp bạn. Bạn đến từ đâu?" },
      { who: "you", en: "I'm from Vietnam. My hometown is Da Nang.", vi: "Mình đến từ Việt Nam. Quê mình ở Đà Nẵng." },
      { who: "pip", en: "Cool! What do you do?", vi: "Hay quá! Bạn làm nghề gì?" },
      { who: "you", en: "I work as a designer. What about you?", vi: "Mình là nhà thiết kế. Còn bạn thì sao?" },
      { who: "pip", en: "I work at the airport. I love planes!", vi: "Mình làm ở sân bay. Mình mê máy bay lắm!" },
    ],
    turns: [
      {
        npcLine: "Hi there! I'm Pip. What's your name?",
        npcVi: "Chào bạn! Mình là Pip. Bạn tên gì?",
        hints: ["I'm...", "Nice to meet you"],
        options: [
          { en: "Hi, Pip! I'm Bơ. Nice to meet you.", vi: "Chào Pip! Mình là Bơ. Rất vui được gặp bạn.", ok: true, why: "Tự nhiên và lịch sự: chào lại, nói tên, thêm “Nice to meet you”." },
          { en: "My name Bơ.", vi: "Tên mình Bơ.", ok: false, why: "Thiếu động từ “is”. Nói đúng: “My name is Bơ.” hoặc gọn hơn “I'm Bơ.”" },
          { en: "What's your name?", vi: "Bạn tên gì?", ok: false, why: "Pip vừa giới thiệu tên rồi, giờ đến lượt bạn nói tên mình." },
        ],
      },
      {
        npcLine: "Nice to meet you too. Where are you from?",
        npcVi: "Mình cũng rất vui được gặp bạn. Bạn đến từ đâu?",
        hints: ["I'm from...", "hometown"],
        options: [
          { en: "I'm from Vietnam. My hometown is Da Nang.", vi: "Mình đến từ Việt Nam. Quê mình ở Đà Nẵng.", ok: true, why: "Chuẩn! “be from + nơi chốn”, rồi kể thêm quê để câu chuyện có chất liệu." },
          { en: "I from Vietnam.", vi: "Mình từ Việt Nam.", ok: false, why: "Thiếu “am”. Câu đúng: “I'm from Vietnam.” Người Việt rất hay quên động từ “to be” ở đây." },
          { en: "I'm Vietnam.", vi: "Mình là nước Việt Nam.", ok: false, why: "“I'm Vietnam” nghĩa là “tôi là nước Việt Nam” 😄 Cần “from”: I'm from Vietnam. Hoặc dùng quốc tịch: I'm Vietnamese." },
        ],
      },
      {
        npcLine: "Cool! So, what do you do?",
        npcVi: "Hay quá! Vậy bạn làm nghề gì?",
        hints: ["I work as...", "What about you?"],
        options: [
          { en: "I work as a designer. What about you?", vi: "Mình là nhà thiết kế. Còn bạn thì sao?", ok: true, why: "Trả lời rồi hỏi lại bằng “What about you?” giúp cuộc trò chuyện tiếp tục." },
          { en: "I'm doing my homework.", vi: "Mình đang làm bài tập.", ok: false, why: "“What do you do?” là hỏi nghề nghiệp, không phải hỏi bạn đang làm gì lúc này." },
          { en: "I work as designer.", vi: "Mình làm nghề nhà thiết kế.", ok: false, why: "Thiếu mạo từ “a”: “I work as a designer.” Trước nghề nghiệp số ít luôn có a/an." },
        ],
      },
    ],
    rescue: {
      fast: "So how long have you been living here on the island, then?",
      fastVi: "Vậy bạn sống ở đảo này được bao lâu rồi?",
      options: [
        { en: "Sorry, could you say that again?", vi: "Xin lỗi, bạn nói lại được không?", ok: true, why: "Câu cứu nguy chuẩn nhất: lịch sự, rõ ràng. Người bản xứ sẽ vui vẻ nói lại." },
        { en: "What?", vi: "Hả?", ok: false, why: "“What?” một mình nghe khá cộc. Thêm “Sorry, what was that?” sẽ nhẹ nhàng hơn nhiều." },
        { en: "Yes, yes.", vi: "Vâng, vâng.", ok: false, why: "Giả vờ hiểu khiến cuộc trò chuyện đi sai hướng. Cứ hỏi lại, không ai cười bạn đâu!" },
      ],
      slow: "Sure! How long have you lived on the island?",
      slowVi: "Được chứ! Bạn sống ở đảo bao lâu rồi?",
    },
    builder: [
      { en: "I'm from Vietnam.", vi: "Mình đến từ Việt Nam.", decoys: ["am", "in"] },
      { en: "I work as a designer.", vi: "Mình là nhà thiết kế.", decoys: ["an", "is"] },
    ],
    chat: {
      opener: "Hi! I'm Pip. Nice to meet you! Where are you from?",
      openerVi: "Chào! Mình là Pip. Rất vui được gặp bạn! Bạn đến từ đâu?",
      topic: "Giới thiệu bản thân",
      persona: "a cheerful penguin who works at the island airport, meeting the learner for the first time at a picnic",
    },
  },
  {
    id: 2,
    level: "A1",
    week: 2,
    title: "Quán cà phê",
    subtitle: "Gọi món, chọn size, trả tiền",
    place: "Quán Miso",
    npc: "miso",
    scene: "cafe",
    goal: "Gọi đồ uống, chọn size, dùng tại quán hay mang đi và hỏi giá.",
    quest: { en: "Miso is waiting at the café. Let's go say hi!", vi: "Miso đang đợi ở quán cà phê. Mình qua chào nhé!" },
    words: [
      { en: "Can I get...?", vi: "Cho mình... được không?", ex: "Can I get a latte, please?" },
      { en: "size", vi: "cỡ (ly)", ex: "What size would you like?" },
      { en: "large", vi: "cỡ lớn", ex: "A large one, please." },
      { en: "to go", vi: "mang đi", ex: "Is that for here or to go?" },
      { en: "How much is it?", vi: "Bao nhiêu tiền vậy?", ex: "Sorry, how much is it?" },
      { en: "Here you go.", vi: "Gửi bạn đây.", ex: "Here you go. Thank you!" },
    ],
    dialogue: [
      { who: "miso", en: "Hi there! What can I get for you today?", vi: "Chào bạn! Hôm nay bạn muốn dùng gì?" },
      { who: "you", en: "Can I get a latte, please?", vi: "Cho mình một ly latte nhé?" },
      { who: "miso", en: "Sure! What size would you like?", vi: "Được! Bạn muốn cỡ nào?" },
      { who: "you", en: "A large one, please.", vi: "Cho mình ly lớn nhé." },
      { who: "miso", en: "For here or to go?", vi: "Dùng ở đây hay mang đi?" },
      { who: "you", en: "To go, please. How much is it?", vi: "Mang đi nhé. Bao nhiêu tiền vậy?" },
      { who: "miso", en: "That's three dollars.", vi: "Ba đô nhé." },
      { who: "you", en: "Here you go. Thank you!", vi: "Gửi bạn. Cảm ơn nhé!" },
    ],
    turns: [
      {
        npcLine: "Hi there! What can I get for you today?",
        npcVi: "Chào bạn! Hôm nay bạn muốn dùng gì?",
        hints: ["Can I get...", "please", "latte"],
        options: [
          { en: "Can I get a latte, please?", vi: "Cho mình một ly latte nhé?", ok: true, why: "Mẫu câu gọi món tự nhiên nhất: Can I get + món + please." },
          { en: "Give me coffee.", vi: "Đưa tôi cà phê.", ok: false, why: "Đúng ngữ pháp nhưng nghe như ra lệnh. Thêm “Can I get... please?” sẽ dễ thương hơn." },
          { en: "I am a latte.", vi: "Tôi là một ly latte.", ok: false, why: "“I am a latte” nghĩa là bạn chính là ly latte 😄 Gọi món dùng “Can I get...” hoặc “I'd like...”." },
        ],
      },
      {
        npcLine: "Sure! What size would you like?",
        npcVi: "Được! Bạn muốn cỡ nào?",
        hints: ["small", "large", "one"],
        options: [
          { en: "A large one, please.", vi: "Cho mình ly lớn nhé.", ok: true, why: "“one” thay cho “latte” để khỏi lặp từ. Rất tự nhiên!" },
          { en: "Large size is big.", vi: "Cỡ lớn thì to.", ok: false, why: "Câu này chỉ mô tả “cỡ lớn thì to”, chưa trả lời bạn muốn cỡ nào." },
          { en: "I would like large.", vi: "Tôi muốn lớn.", ok: false, why: "Gần đúng! Thêm mạo từ: “I'd like a large, please.” hoặc “A large one, please.”" },
        ],
      },
      {
        npcLine: "For here or to go?",
        npcVi: "Dùng ở đây hay mang đi?",
        hints: ["to go", "for here"],
        options: [
          { en: "To go, please.", vi: "Mang đi nhé.", ok: true, why: "Câu hỏi lựa chọn → chọn một: “To go, please.” hoặc “For here, please.”" },
          { en: "I go.", vi: "Tôi đi.", ok: false, why: "“I go” là “tôi đi”, không phải “mang đi”. Nói “To go, please.”" },
          { en: "Yes, please.", vi: "Vâng, làm ơn.", ok: false, why: "Câu hỏi có hai lựa chọn (here hay to go), nên “Yes” không trả lời được." },
        ],
      },
    ],
    rescue: {
      fast: "That'll be four-fifty. Would you like to add a cookie today?",
      fastVi: "Tổng là 4 đô 50. Bạn có muốn thêm một cái bánh quy không?",
      options: [
        { en: "Could you speak a bit more slowly, please?", vi: "Bạn nói chậm hơn một chút được không?", ok: true, why: "Khi người ta nói quá nhanh, xin nói chậm lại là hoàn toàn bình thường và lịch sự." },
        { en: "Huh?", vi: "Hả?", ok: false, why: "“Huh?” nghe khá suồng sã với người lạ. Dùng một câu cứu nguy đầy đủ nhé." },
        { en: "No English.", vi: "Không biết tiếng Anh.", ok: false, why: "Đừng bỏ cuộc! Bạn hiểu được mà — chỉ cần xin nói chậm lại thôi." },
      ],
      slow: "Sure. It's four dollars and fifty cents. Do you want a cookie too?",
      slowVi: "Được. 4 đô 50 xu. Bạn có muốn thêm bánh quy không?",
    },
    builder: [
      { en: "Can I get a latte, please?", vi: "Cho mình một ly latte nhé?", decoys: ["give", "an"] },
      { en: "How much is it?", vi: "Bao nhiêu tiền vậy?", decoys: ["many", "are"] },
    ],
    chat: {
      opener: "Welcome to Miso's Café! What would you like to drink today?",
      openerVi: "Chào mừng đến quán Miso! Hôm nay bạn muốn uống gì?",
      topic: "Gọi đồ uống ở quán cà phê",
      persona: "a kind grey cat barista who runs a cozy café; the learner is the customer ordering drinks and snacks",
    },
  },
  {
    id: 3,
    level: "A1",
    week: 3,
    title: "Chợ Cà Rốt",
    subtitle: "Số đếm, hỏi giá, mặc cả nhẹ",
    place: "Chợ Cà Rốt",
    npc: "mallow",
    scene: "market",
    goal: "Hỏi giá, mua theo số lượng, xin giảm giá và kết thúc lượt mua.",
    quest: { en: "Mallow has fresh carrots today. Let's go shopping!", vi: "Hôm nay Mallow có cà rốt tươi. Đi chợ thôi!" },
    words: [
      { en: "How much are...?", vi: "... bao nhiêu tiền?", ex: "How much are these carrots?" },
      { en: "each", vi: "mỗi cái", ex: "They're two dollars each." },
      { en: "a bag of", vi: "một túi", ex: "Can I have a bag of apples?" },
      { en: "fresh", vi: "tươi", ex: "These carrots are very fresh." },
      { en: "discount", vi: "giảm giá", ex: "Can I get a discount?" },
      { en: "That's all.", vi: "Vậy thôi / Đủ rồi.", ex: "That's all, thank you." },
    ],
    dialogue: [
      { who: "mallow", en: "Good morning! Fresh carrots today!", vi: "Chào buổi sáng! Cà rốt tươi đây!" },
      { who: "you", en: "Good morning! How much are these carrots?", vi: "Chào buổi sáng! Cà rốt này bao nhiêu tiền?" },
      { who: "mallow", en: "They're two dollars each.", vi: "Mỗi củ hai đô." },
      { who: "you", en: "Can I have three, please?", vi: "Cho mình ba củ nhé?" },
      { who: "mallow", en: "Sure! Anything else?", vi: "Được! Bạn cần gì nữa không?" },
      { who: "you", en: "A bag of apples, please. Can I get a discount?", vi: "Một túi táo nhé. Bớt cho mình chút được không?" },
      { who: "mallow", en: "Hmm... okay! Ten dollars for everything.", vi: "Ừm... được thôi! Tất cả mười đô." },
      { who: "you", en: "Great! That's all, thank you.", vi: "Tuyệt! Vậy thôi, cảm ơn nhé." },
    ],
    turns: [
      {
        npcLine: "Good morning! Fresh carrots today!",
        npcVi: "Chào buổi sáng! Cà rốt tươi đây!",
        hints: ["How much are...", "these"],
        options: [
          { en: "Good morning! How much are these carrots?", vi: "Chào buổi sáng! Cà rốt này bao nhiêu tiền?", ok: true, why: "Chào lại rồi hỏi giá. “carrots” số nhiều nên dùng “are”." },
          { en: "How much is these carrots?", vi: "Cà rốt này bao nhiêu tiền?", ok: false, why: "“carrots” là số nhiều nên dùng “are”: How much are these carrots?" },
          { en: "How many money?", vi: "Bao nhiêu tiền?", ok: false, why: "Tiền không đếm được nên không dùng “many”. Hỏi giá: “How much is it?” / “How much are they?”" },
        ],
      },
      {
        npcLine: "They're two dollars each.",
        npcVi: "Mỗi củ hai đô.",
        hints: ["Can I have...", "three"],
        options: [
          { en: "Can I have three, please?", vi: "Cho mình ba củ nhé?", ok: true, why: "“Can I have + số lượng + please?” — gọn, lịch sự." },
          { en: "I want three carrot.", vi: "Tôi muốn ba củ cà rốt.", ok: false, why: "Thiếu “s” số nhiều: three carrots. Và “Can I have...” nghe lịch sự hơn “I want”." },
          { en: "Two dollars each, please.", vi: "Mỗi củ hai đô, làm ơn.", ok: false, why: "Bạn chỉ lặp lại giá thôi. Hãy nói số lượng muốn mua." },
        ],
      },
      {
        npcLine: "Sure! That's six dollars. Anything else?",
        npcVi: "Được! Sáu đô. Bạn cần gì nữa không?",
        hints: ["That's all", "thank you"],
        options: [
          { en: "No, that's all. Thank you!", vi: "Không, vậy thôi. Cảm ơn nhé!", ok: true, why: "“That's all” là câu cố định để kết thúc lượt mua." },
          { en: "No, I'm all.", vi: "Không, tôi là tất cả.", ok: false, why: "Không có câu “I'm all”. Câu cố định là “That's all.” = Vậy thôi." },
          { en: "Anything else.", vi: "Còn gì nữa.", ok: false, why: "Lặp lại câu hỏi của Mallow chưa phải câu trả lời. Nói “That's all, thanks!” nếu đã đủ." },
        ],
      },
    ],
    rescue: {
      fast: "Those ones are four for five, or two-fifty each if you just want one.",
      fastVi: "Loại kia mua bốn củ thì năm đô, hoặc hai đô rưỡi một củ nếu bạn chỉ lấy một.",
      options: [
        { en: "Sorry, did you say four for five dollars?", vi: "Xin lỗi, bạn nói bốn củ năm đô phải không?", ok: true, why: "Nhắc lại con số để xác nhận — kỹ năng cực kỳ quan trọng khi mua bán." },
        { en: "Okay, five dollars each.", vi: "Được, mỗi củ năm đô.", ok: false, why: "Đoán bừa có thể khiến bạn trả sai tiền. Hãy hỏi lại cho chắc." },
        { en: "Speak Vietnamese, please.", vi: "Nói tiếng Việt đi.", ok: false, why: "Mallow không biết tiếng Việt đâu 😄 Hãy xin nhắc lại bằng tiếng Anh." },
      ],
      slow: "Yes! Four carrots for five dollars. Or two dollars fifty for one.",
      slowVi: "Đúng rồi! Bốn củ năm đô. Hoặc hai đô rưỡi một củ.",
    },
    builder: [
      { en: "How much are these carrots?", vi: "Cà rốt này bao nhiêu tiền?", decoys: ["is", "many"] },
      { en: "That's all, thank you.", vi: "Vậy thôi, cảm ơn nhé.", decoys: ["it's", "for"] },
    ],
    chat: {
      opener: "Hi! Welcome to my carrot stand. What are you looking for today?",
      openerVi: "Chào! Chào mừng đến sạp cà rốt. Hôm nay bạn tìm gì nào?",
      topic: "Đi chợ, hỏi giá",
      persona: "a sweet white bunny who sells vegetables and fruit at the market; the learner is a customer asking prices and buying things",
    },
  },
  {
    id: 4,
    level: "A1",
    week: 4,
    title: "Hỏi đường",
    subtitle: "Đi thẳng, rẽ, bên cạnh, đối diện",
    place: "Trạm Hỏi Đường",
    npc: "kero",
    scene: "pond",
    goal: "Hỏi đường, hiểu chỉ dẫn và xác nhận lại đường đi.",
    quest: { en: "Lost? Kero the guide is by the pond.", vi: "Lạc đường à? Hướng dẫn viên Kero đang ở bên hồ." },
    words: [
      { en: "Excuse me", vi: "Xin lỗi (khi bắt chuyện)", ex: "Excuse me, where is the café?" },
      { en: "go straight", vi: "đi thẳng", ex: "Go straight for two minutes." },
      { en: "turn left", vi: "rẽ trái", ex: "Turn left at the pond." },
      { en: "next to", vi: "bên cạnh", ex: "The café is next to the cherry tree." },
      { en: "opposite", vi: "đối diện", ex: "The market is opposite the airport." },
      { en: "far", vi: "xa", ex: "Is it far from here?" },
    ],
    dialogue: [
      { who: "you", en: "Excuse me, how do I get to the café?", vi: "Xin lỗi, đi đến quán cà phê thế nào ạ?" },
      { who: "kero", en: "Go straight and turn left at the pond.", vi: "Đi thẳng rồi rẽ trái ở hồ nước." },
      { who: "you", en: "Turn left at the pond?", vi: "Rẽ trái ở hồ nước ạ?" },
      { who: "kero", en: "Yes! The café is next to the big cherry tree.", vi: "Đúng rồi! Quán ở bên cạnh cây anh đào lớn." },
      { who: "you", en: "Is it far from here?", vi: "Có xa đây không ạ?" },
      { who: "kero", en: "No, it's about five minutes on foot.", vi: "Không, đi bộ khoảng năm phút thôi." },
      { who: "you", en: "Thank you so much!", vi: "Cảm ơn nhiều ạ!" },
      { who: "kero", en: "You're welcome! Have a nice day.", vi: "Không có gì! Chúc một ngày tốt lành." },
    ],
    turns: [
      {
        npcLine: "Hello! You look lost. Can I help you?",
        npcVi: "Chào bạn! Trông bạn như bị lạc. Mình giúp gì được không?",
        hints: ["How do I get to...?", "the café"],
        options: [
          { en: "Yes, please! How do I get to the café?", vi: "Vâng! Đi đến quán cà phê thế nào ạ?", ok: true, why: "“How do I get to + nơi?” là cách hỏi đường tự nhiên nhất." },
          { en: "Where café?", vi: "Quán cà phê đâu?", ok: false, why: "Thiếu động từ và mạo từ. Câu đúng: “Where is the café?”" },
          { en: "I am lost the café.", vi: "Tôi lạc quán cà phê.", ok: false, why: "Sai cấu trúc. Nói: “I'm looking for the café.” (Mình đang tìm quán cà phê.)" },
        ],
      },
      {
        npcLine: "Go straight and turn left at the pond.",
        npcVi: "Đi thẳng rồi rẽ trái ở hồ nước.",
        hints: ["Turn left...?", "Is it far?"],
        options: [
          { en: "Turn left at the pond? Is it far from here?", vi: "Rẽ trái ở hồ ạ? Có xa đây không?", ok: true, why: "Nhắc lại chỉ dẫn để kiểm tra là mẹo hay! Rồi hỏi thêm khoảng cách." },
          { en: "Turn right at the pond, okay.", vi: "Rẽ phải ở hồ, được.", ok: false, why: "Kero nói “turn left” (rẽ trái), không phải “right”. Nghe kỹ nhé!" },
          { en: "Go straight is far?", vi: "Đi thẳng là xa?", ok: false, why: "Sai ngữ pháp. Hỏi khoảng cách: “Is it far from here?”" },
        ],
      },
      {
        npcLine: "Not far. It's next to the big cherry tree.",
        npcVi: "Không xa. Nó ở bên cạnh cây anh đào lớn.",
        hints: ["Thank you", "so much"],
        options: [
          { en: "Great, thank you so much!", vi: "Tuyệt, cảm ơn nhiều ạ!", ok: true, why: "Cảm ơn người chỉ đường thật ấm áp. “so much” nhấn mạnh sự biết ơn." },
          { en: "Thank you very much the tree.", vi: "Cảm ơn cái cây nhiều.", ok: false, why: "Thừa “the tree”. Chỉ cần “Thank you so much!”" },
          { en: "Okay, bye.", vi: "Ừ, bye.", ok: false, why: "Không sai, nhưng hơi cụt. Hãy cảm ơn Kero trước: “Thank you so much!”" },
        ],
      },
    ],
    rescue: {
      fast: "Take the second right after the bridge, then it's on your left, opposite the bakery.",
      fastVi: "Qua cầu thì rẽ phải ở ngã thứ hai, rồi nó nằm bên tay trái, đối diện tiệm bánh.",
      options: [
        { en: "Sorry, could you repeat the last part?", vi: "Xin lỗi, bạn nhắc lại đoạn cuối được không?", ok: true, why: "Khi chỉ hổng một phần, hỏi lại đúng phần đó sẽ nhanh và rõ hơn." },
        { en: "I know, I know.", vi: "Biết rồi, biết rồi.", ok: false, why: "Giả vờ hiểu rồi đi lạc thì còn mệt hơn. Hỏi lại thôi!" },
        { en: "Repeat!", vi: "Nhắc lại!", ok: false, why: "Câu mệnh lệnh cụt lủn nghe thiếu lịch sự. Thêm “Could you... please?”" },
      ],
      slow: "Sure! After the bridge, take the second right. It's on your left, opposite the bakery.",
      slowVi: "Được! Qua cầu, rẽ phải ở ngã thứ hai. Nó ở bên trái, đối diện tiệm bánh.",
    },
    builder: [
      { en: "How do I get to the café?", vi: "Đi đến quán cà phê thế nào?", decoys: ["go", "where"] },
      { en: "Is it far from here?", vi: "Có xa đây không?", decoys: ["it's", "to"] },
    ],
    chat: {
      opener: "Hi! I'm Kero, the island guide. Where do you want to go today?",
      openerVi: "Chào! Mình là Kero, hướng dẫn viên của đảo. Hôm nay bạn muốn đi đâu?",
      topic: "Hỏi đường quanh đảo",
      persona: "a friendly frog tour guide who knows every path on the island (café, market, airport, pond, cherry tree, bakery, bridge); give simple directions",
    },
  },

  // ───────────────────────── A2 · Đảo Đi Đây Đó ─────────────────────────
  {
    id: 5,
    level: "A2",
    week: 5,
    title: "Sân bay & khách sạn",
    subtitle: "Check-in, chọn ghế, hành lý",
    place: "Sân Bay Mây",
    npc: "pip",
    scene: "airport",
    goal: "Làm thủ tục bay, chọn ghế, gửi hành lý và nghe thông báo cổng bay.",
    quest: { en: "Time to travel! Pip is at the check-in counter.", vi: "Đến lúc đi du lịch rồi! Pip đang ở quầy check-in." },
    words: [
      { en: "passport", vi: "hộ chiếu", ex: "May I see your passport, please?" },
      { en: "boarding pass", vi: "thẻ lên máy bay", ex: "Here's your boarding pass." },
      { en: "aisle seat", vi: "ghế cạnh lối đi", ex: "Can I have an aisle seat?" },
      { en: "luggage", vi: "hành lý", ex: "Do you have any luggage to check in?" },
      { en: "gate", vi: "cổng (ra máy bay)", ex: "Your flight leaves from gate 3." },
      { en: "reservation", vi: "việc đặt chỗ trước", ex: "I have a reservation under the name Bơ." },
    ],
    dialogue: [
      { who: "pip", en: "Good morning! May I see your passport, please?", vi: "Chào buổi sáng! Cho tôi xem hộ chiếu được không?" },
      { who: "you", en: "Sure, here you go.", vi: "Vâng, gửi anh." },
      { who: "pip", en: "Thank you. Window or aisle seat?", vi: "Cảm ơn. Ghế cửa sổ hay lối đi?" },
      { who: "you", en: "A window seat, please.", vi: "Cho tôi ghế cửa sổ." },
      { who: "pip", en: "Do you have any luggage to check in?", vi: "Bạn có hành lý ký gửi không?" },
      { who: "you", en: "Yes, just this one suitcase.", vi: "Có, chỉ một vali này thôi." },
      { who: "pip", en: "Here's your boarding pass. Gate 3.", vi: "Thẻ lên máy bay của bạn đây. Cổng 3." },
      { who: "you", en: "Thanks! What time does boarding start?", vi: "Cảm ơn! Mấy giờ bắt đầu lên máy bay?" },
      { who: "pip", en: "At ten fifteen. Have a nice flight!", vi: "Lúc 10 giờ 15. Chúc chuyến bay vui vẻ!" },
    ],
    turns: [
      {
        npcLine: "Good morning! May I see your passport, please?",
        npcVi: "Chào buổi sáng! Cho tôi xem hộ chiếu được không?",
        hints: ["Sure", "Here you go"],
        options: [
          { en: "Sure, here you go.", vi: "Vâng, gửi anh.", ok: true, why: "Khi đưa đồ cho ai đó, “Here you go” là câu tự nhiên nhất." },
          { en: "Yes, you may see.", vi: "Vâng, anh được phép xem.", ok: false, why: "Đúng ngữ pháp nhưng nghe như “tôi cho phép”, rất cứng. Nói “Sure, here you go.”" },
          { en: "I have passport.", vi: "Tôi có hộ chiếu.", ok: false, why: "Thiếu “a” và bạn chưa đưa hộ chiếu. Nói: “Sure, here you go.”" },
        ],
      },
      {
        npcLine: "Thank you. Would you like a window or an aisle seat?",
        npcVi: "Cảm ơn. Bạn muốn ghế cửa sổ hay ghế lối đi?",
        hints: ["window", "aisle", "please"],
        options: [
          { en: "A window seat, please.", vi: "Cho tôi ghế cửa sổ.", ok: true, why: "Câu hỏi lựa chọn → chọn một và thêm “please”." },
          { en: "Yes, I would like.", vi: "Vâng, tôi muốn.", ok: false, why: "Câu hỏi “A hay B” không trả lời bằng Yes. Chọn một: “A window seat, please.”" },
          { en: "I like window.", vi: "Tôi thích cửa sổ.", ok: false, why: "“I like” = thích nói chung. Ở đây dùng “I'd like a window seat” = tôi muốn." },
        ],
      },
      {
        npcLine: "Do you have any luggage to check in?",
        npcVi: "Bạn có hành lý ký gửi không?",
        hints: ["just", "suitcase"],
        options: [
          { en: "Yes, just this one suitcase.", vi: "Có, chỉ một vali này thôi.", ok: true, why: "Trả lời Yes + nói rõ số lượng để nhân viên dễ xử lý." },
          { en: "Yes, I have two luggages.", vi: "Có, tôi có hai hành lý.", ok: false, why: "“luggage” không đếm được, không thêm “s”. Nói “two bags” hoặc “two pieces of luggage”." },
          { en: "I check in yesterday.", vi: "Tôi check-in hôm qua.", ok: false, why: "Sai thì và lạc đề. Pip đang hỏi bạn có hành lý ký gửi không." },
        ],
      },
    ],
    rescue: {
      fast: "Just so you know, your flight's been moved to gate twelve and boarding starts at nine forty-five.",
      fastVi: "Bạn lưu ý: chuyến bay đã chuyển sang cổng 12 và bắt đầu lên máy bay lúc 9 giờ 45.",
      options: [
        { en: "Sorry, which gate did you say?", vi: "Xin lỗi, bạn nói cổng số mấy?", ok: true, why: "Hỏi lại thông tin quan trọng (cổng, giờ) — người đi du lịch giỏi cũng luôn làm vậy." },
        { en: "Okay, gate three.", vi: "Được, cổng ba.", ok: false, why: "Nghe nhầm cổng có thể lỡ chuyến bay! Hãy hỏi lại." },
        { en: "I don't understand anything.", vi: "Tôi chẳng hiểu gì cả.", ok: false, why: "Bi quan quá 😄 Hỏi lại đúng phần bạn cần: “Which gate did you say?”" },
      ],
      slow: "Gate twelve. One, two. Boarding starts at nine forty-five.",
      slowVi: "Cổng 12. Một, hai. Lên máy bay lúc 9 giờ 45.",
    },
    builder: [
      { en: "A window seat, please.", vi: "Cho tôi ghế cửa sổ.", decoys: ["an", "sit"] },
      { en: "Which gate did you say?", vi: "Bạn nói cổng số mấy?", decoys: ["what", "does"] },
    ],
    chat: {
      opener: "Hello! Welcome to the Cloud Hotel. Do you have a reservation?",
      openerVi: "Xin chào! Chào mừng đến khách sạn Mây. Bạn đã đặt phòng chưa?",
      topic: "Nhận phòng khách sạn",
      persona: "a polite penguin receptionist at the Cloud Hotel next to the island airport; the learner is checking in (name, nights, breakfast, Wi-Fi, room problems)",
    },
  },
  {
    id: 6,
    level: "A2",
    week: 6,
    title: "Nhà hàng & đặt bàn",
    subtitle: "Đặt bàn, gọi món chính, tính tiền",
    place: "Quán Miso (buổi tối)",
    npc: "miso",
    scene: "cafe",
    goal: "Nói về đặt bàn, nhờ gợi ý món, hỏi thành phần và xin hoá đơn.",
    quest: { en: "At night, Miso's café becomes a little restaurant!", vi: "Buổi tối, quán Miso biến thành nhà hàng nhỏ!" },
    words: [
      { en: "book a table", vi: "đặt bàn", ex: "I booked a table for two." },
      { en: "a table for two", vi: "bàn cho hai người", ex: "A table for two, please." },
      { en: "recommend", vi: "gợi ý, giới thiệu", ex: "What do you recommend?" },
      { en: "allergic to", vi: "bị dị ứng với", ex: "I'm allergic to nuts." },
      { en: "delicious", vi: "rất ngon", ex: "The soup was delicious!" },
      { en: "the bill", vi: "hoá đơn (tính tiền)", ex: "Could we have the bill, please?" },
    ],
    dialogue: [
      { who: "miso", en: "Good evening! Do you have a reservation?", vi: "Chào buổi tối! Bạn có đặt bàn trước không?" },
      { who: "you", en: "Yes, I booked a table for two. The name is Bơ.", vi: "Có, mình đặt bàn cho hai người. Tên là Bơ." },
      { who: "miso", en: "Right this way. Here's the menu.", vi: "Mời đi lối này. Thực đơn đây ạ." },
      { who: "you", en: "What do you recommend?", vi: "Bạn gợi ý món nào?" },
      { who: "miso", en: "The fish soup is really good tonight.", vi: "Tối nay món súp cá rất ngon." },
      { who: "you", en: "Sounds great. I'm allergic to nuts. Is that okay?", vi: "Nghe hay đấy. Mình dị ứng hạt. Món đó được không?" },
      { who: "miso", en: "No nuts at all. Don't worry!", vi: "Không có chút hạt nào. Đừng lo!" },
      { who: "you", en: "Perfect. Two fish soups, please.", vi: "Tuyệt. Cho hai súp cá nhé." },
    ],
    turns: [
      {
        npcLine: "Good evening! Do you have a reservation?",
        npcVi: "Chào buổi tối! Bạn có đặt bàn trước không?",
        hints: ["booked", "a table for two"],
        options: [
          { en: "Yes, I booked a table for two. The name is Bơ.", vi: "Có, mình đặt bàn cho hai người. Tên là Bơ.", ok: true, why: "Đủ thông tin: đã đặt (booked), số người (for two), tên đặt bàn." },
          { en: "Yes, I reserve two.", vi: "Có, tôi đặt hai.", ok: false, why: "Thiếu thì quá khứ và tân ngữ. Nói: “I booked a table for two.”" },
          { en: "Yes, two people is me.", vi: "Có, hai người là tôi.", ok: false, why: "Câu không rõ nghĩa. Mẫu chuẩn: “a table for two” = bàn cho hai người." },
        ],
      },
      {
        npcLine: "Here's the menu. Are you ready to order?",
        npcVi: "Thực đơn đây. Bạn gọi món được chưa?",
        hints: ["Not yet", "What do you recommend?"],
        options: [
          { en: "Not yet. What do you recommend?", vi: "Chưa ạ. Bạn gợi ý món nào?", ok: true, why: "Nhờ gợi ý vừa lịch sự vừa giúp bạn có thêm thông tin về món." },
          { en: "What do you recommend me?", vi: "Bạn gợi ý tôi gì?", ok: false, why: "“recommend” không đi thẳng với “me” như vậy. Nói: “What do you recommend?”" },
          { en: "Yes, I am ready order.", vi: "Vâng, tôi sẵn sàng gọi.", ok: false, why: "Thiếu “to”: “I'm ready to order.”" },
        ],
      },
      {
        npcLine: "How was everything?",
        npcVi: "Mọi thứ thế nào ạ?",
        hints: ["delicious", "the bill"],
        options: [
          { en: "It was delicious! Could we have the bill, please?", vi: "Ngon lắm! Cho bọn mình xin hoá đơn nhé?", ok: true, why: "Khen món + xin hoá đơn lịch sự bằng “Could we have...?”." },
          { en: "It was delicious! Give me money.", vi: "Ngon lắm! Đưa tôi tiền.", ok: false, why: "Bạn mới là người trả tiền mà 😄 Xin hoá đơn: “Could we have the bill, please?”" },
          { en: "Everything is delicious, I pay.", vi: "Mọi thứ ngon, tôi trả.", ok: false, why: "Bữa ăn đã xong nên dùng “was”. Và nói rõ: “Could we have the bill, please?”" },
        ],
      },
    ],
    rescue: {
      fast: "Tonight's special is a slow-roasted pumpkin risotto with a hint of truffle.",
      fastVi: "Món đặc biệt tối nay là cơm risotto bí đỏ nướng chậm, thoang thoảng nấm truffle.",
      options: [
        { en: "Sorry, what's a risotto?", vi: "Xin lỗi, risotto là món gì?", ok: true, why: "Hỏi nghĩa từ lạ: “What's a ___?” — người phục vụ rất vui được giải thích." },
        { en: "I'll have that.", vi: "Cho tôi món đó.", ok: false, why: "Gọi món mà không biết là gì thì hơi liều 😄 Hỏi trước đã." },
        { en: "Too difficult.", vi: "Khó quá.", ok: false, why: "Đừng ngại! Hỏi nghĩa từ bạn chưa biết là chuyện rất bình thường." },
      ],
      slow: "It's an Italian rice dish. Tonight it's made with pumpkin.",
      slowVi: "Đó là món cơm kiểu Ý. Tối nay làm với bí đỏ.",
    },
    builder: [
      { en: "What do you recommend?", vi: "Bạn gợi ý món nào?", decoys: ["me", "does"] },
      { en: "Could we have the bill, please?", vi: "Cho bọn mình xin hoá đơn nhé?", decoys: ["give", "pay"] },
    ],
    chat: {
      opener: "Good evening! Welcome to Miso's. Do you have a reservation tonight?",
      openerVi: "Chào buổi tối! Chào mừng đến nhà hàng Miso. Tối nay bạn có đặt bàn không?",
      topic: "Đi ăn nhà hàng",
      persona: "a grey cat who runs a small evening restaurant; menu: fish soup, pumpkin risotto, chicken curry, salad, cakes; the learner is a guest",
    },
  },
  {
    id: 7,
    level: "A2",
    week: 7,
    title: "Gọi điện & hẹn lịch",
    subtitle: "Đặt lịch, đổi giờ, để lại lời nhắn",
    place: "Cây Anh Đào",
    npc: "kero",
    scene: "tree",
    goal: "Gọi điện giới thiệu mình, hỏi lịch trống, chốt hoặc dời lịch hẹn.",
    quest: { en: "Call Kero to book an island tour!", vi: "Gọi cho Kero để đặt tour quanh đảo!" },
    words: [
      { en: "This is ... (speaking)", vi: "Tôi là... (khi nghe/gọi điện)", ex: "Hi, this is Bơ." },
      { en: "available", vi: "rảnh, còn chỗ", ex: "When are you available?" },
      { en: "Are you free on...?", vi: "Bạn có rảnh vào...?", ex: "Are you free on Saturday?" },
      { en: "How about...?", vi: "... thì sao?", ex: "How about Sunday at nine?" },
      { en: "That works for me.", vi: "Giờ đó ổn với mình.", ex: "Sunday at nine? That works for me." },
      { en: "reschedule", vi: "dời lịch", ex: "Can we reschedule to Monday?" },
    ],
    dialogue: [
      { who: "kero", en: "Hello, Kero's Island Tours. Kero speaking.", vi: "Alo, Tour Đảo Kero đây. Kero nghe." },
      { who: "you", en: "Hi Kero, this is Bơ. I'd like to book a tour.", vi: "Chào Kero, mình là Bơ. Mình muốn đặt một tour." },
      { who: "kero", en: "Sure! When are you available?", vi: "Được! Khi nào bạn rảnh?" },
      { who: "you", en: "Are you free on Saturday morning?", vi: "Sáng thứ Bảy bạn có rảnh không?" },
      { who: "kero", en: "Sorry, Saturday is full. How about Sunday at nine?", vi: "Xin lỗi, thứ Bảy kín rồi. Chủ nhật lúc 9 giờ thì sao?" },
      { who: "you", en: "Sunday at nine works for me.", vi: "Chủ nhật 9 giờ ổn với mình." },
      { who: "kero", en: "Great! See you then.", vi: "Tuyệt! Hẹn gặp bạn lúc đó." },
    ],
    turns: [
      {
        npcLine: "Hello, Kero's Island Tours. Kero speaking.",
        npcVi: "Alo, Tour Đảo Kero đây. Kero nghe.",
        hints: ["This is...", "I'd like to..."],
        options: [
          { en: "Hi Kero, this is Bơ. I'd like to book a tour.", vi: "Chào Kero, mình là Bơ. Mình muốn đặt một tour.", ok: true, why: "Trên điện thoại: “This is + tên”, rồi nói ngay mục đích cuộc gọi." },
          { en: "Hi, I am Bơ speaking.", vi: "Chào, tôi là Bơ đang nói.", ok: false, why: "Gần đúng! Nhưng qua điện thoại người ta nói “This is Bơ.” chứ không nói “I am Bơ speaking”." },
          { en: "Who are you?", vi: "Bạn là ai?", ok: false, why: "Kero đã giới thiệu rồi, câu này nghe khá thô. Hãy giới thiệu bạn: “This is Bơ.”" },
        ],
      },
      {
        npcLine: "Sure! When are you available?",
        npcVi: "Được! Khi nào bạn rảnh?",
        hints: ["Are you free on...?", "Saturday"],
        options: [
          { en: "Are you free on Saturday morning?", vi: "Sáng thứ Bảy bạn có rảnh không?", ok: true, why: "Đề xuất thời gian bằng câu hỏi — lịch sự và linh hoạt." },
          { en: "I am free in Saturday.", vi: "Tôi rảnh vào thứ Bảy.", ok: false, why: "Với thứ trong tuần dùng “on”: on Saturday." },
          { en: "Available is Saturday.", vi: "Rảnh là thứ Bảy.", ok: false, why: "Sai trật tự. Nói: “I'm available on Saturday.”" },
        ],
      },
      {
        npcLine: "Sorry, Saturday is full. How about Sunday at nine?",
        npcVi: "Xin lỗi, thứ Bảy kín lịch rồi. Chủ nhật lúc 9 giờ thì sao?",
        hints: ["works for me", "See you then"],
        options: [
          { en: "Sunday at nine works for me. See you then!", vi: "Chủ nhật 9 giờ ổn với mình. Hẹn gặp nhé!", ok: true, why: "“That works for me” = giờ đó ổn — cụm rất hay dùng khi chốt lịch." },
          { en: "Sunday at nine is work.", vi: "Chủ nhật 9 giờ là làm việc.", ok: false, why: "“is work” sai. Cụm cố định: “That works for me.”" },
          { en: "How about no?", vi: "Hay là không?", ok: false, why: "Từ chối kiểu này nghe kỳ và thô. Nếu không được: “Sorry, I can't make it. How about Monday?”" },
        ],
      },
    ],
    rescue: {
      fast: "Okay, so I've pencilled you in for the twenty-third, but give us a call if anything changes.",
      fastVi: "Được, mình ghi tạm cho bạn ngày 23 nhé, có gì thay đổi thì gọi lại cho bọn mình.",
      options: [
        { en: "Sorry, could you repeat the date?", vi: "Xin lỗi, bạn nhắc lại ngày được không?", ok: true, why: "Thông tin quan trọng nhất là ngày hẹn — hỏi lại đúng phần đó." },
        { en: "Pencil? I don't have a pencil.", vi: "Bút chì? Tôi không có bút chì.", ok: false, why: "“pencil someone in” = ghi lịch tạm, không liên quan bút chì 😄" },
        { en: "Okay, bye!", vi: "Ok, tạm biệt!", ok: false, why: "Cúp máy khi chưa rõ ngày hẹn là rủi ro. Hãy hỏi lại ngày." },
      ],
      slow: "Sure. Your tour is on the twenty-third. Call us if you need to change it.",
      slowVi: "Được. Tour của bạn vào ngày 23. Gọi cho bọn mình nếu cần đổi nhé.",
    },
    builder: [
      { en: "Are you free on Saturday?", vi: "Thứ Bảy bạn có rảnh không?", decoys: ["in", "available"] },
      { en: "That works for me.", vi: "Giờ đó ổn với mình.", decoys: ["is", "work"] },
    ],
    chat: {
      opener: "Hello, Kero's Island Tours. Kero speaking. How can I help you?",
      openerVi: "Alo, Tour Đảo Kero nghe. Mình giúp gì được bạn?",
      topic: "Gọi điện đặt lịch",
      persona: "a frog who runs island tours, answering the phone; help the learner book, change or cancel a tour (days, times, number of people)",
    },
  },
  {
    id: 8,
    level: "A2",
    week: 8,
    title: "Đi khám & nhà thuốc",
    subtitle: "Triệu chứng, thuốc, cách dùng",
    place: "Tiệm thuốc thảo mộc",
    npc: "mallow",
    scene: "market",
    goal: "Mô tả triệu chứng, nói đã bị bao lâu và hiểu cách dùng thuốc.",
    quest: { en: "Feeling sick? Mallow also sells herbal medicine.", vi: "Thấy mệt à? Mallow cũng bán thuốc thảo mộc đấy." },
    words: [
      { en: "headache", vi: "đau đầu", ex: "I have a headache." },
      { en: "sore throat", vi: "đau họng", ex: "I have a sore throat." },
      { en: "fever", vi: "sốt", ex: "Do you have a fever?" },
      { en: "since", vi: "từ (khi)", ex: "I've felt sick since yesterday." },
      { en: "twice a day", vi: "hai lần một ngày", ex: "Take it twice a day." },
      { en: "prescription", vi: "đơn thuốc", ex: "Do I need a prescription?" },
    ],
    dialogue: [
      { who: "mallow", en: "Hi! You don't look well. What's wrong?", vi: "Chào! Trông bạn không khoẻ. Bạn bị sao vậy?" },
      { who: "you", en: "I have a headache and a sore throat.", vi: "Mình bị đau đầu và đau họng." },
      { who: "mallow", en: "Oh no. Do you have a fever?", vi: "Ôi. Bạn có sốt không?" },
      { who: "you", en: "A little. I've felt sick since yesterday.", vi: "Hơi hơi. Mình thấy mệt từ hôm qua." },
      { who: "mallow", en: "Take this medicine twice a day, after meals.", vi: "Uống thuốc này hai lần một ngày, sau bữa ăn." },
      { who: "you", en: "Do I need a prescription?", vi: "Mình có cần đơn thuốc không?" },
      { who: "mallow", en: "No, you don't. Get some rest!", vi: "Không cần đâu. Nghỉ ngơi nhé!" },
    ],
    turns: [
      {
        npcLine: "Hi! You don't look well. What's wrong?",
        npcVi: "Chào! Trông bạn không khoẻ. Bạn bị sao vậy?",
        hints: ["I have...", "headache"],
        options: [
          { en: "I have a headache and a sore throat.", vi: "Mình bị đau đầu và đau họng.", ok: true, why: "Mô tả bệnh dùng “I have a/an + triệu chứng”." },
          { en: "I am headache.", vi: "Tôi là cơn đau đầu.", ok: false, why: "“I am headache” = tôi là cơn đau đầu 😄 Nói: “I have a headache.”" },
          { en: "My head is hurting me very much ache.", vi: "Đầu tôi đau nhức lắm.", ok: false, why: "Lộn xộn. Gọn và tự nhiên: “I have a headache.” hoặc “My head hurts.”" },
        ],
      },
      {
        npcLine: "Oh no. How long have you felt like this?",
        npcVi: "Ôi. Bạn bị như vậy bao lâu rồi?",
        hints: ["since", "yesterday"],
        options: [
          { en: "Since yesterday morning.", vi: "Từ sáng hôm qua.", ok: true, why: "“Since + mốc thời gian” trả lời gọn cho câu hỏi “bao lâu rồi”." },
          { en: "From yesterday until now.", vi: "Từ hôm qua đến giờ.", ok: false, why: "Hiểu được nhưng dài và hơi “dịch từ tiếng Việt”. Người bản xứ nói “Since yesterday.”" },
          { en: "Two days ago.", vi: "Hai ngày trước.", ok: false, why: "“ago” chỉ thời điểm, không trả lời “bao lâu rồi”. Dùng “For two days.” hoặc “Since...”." },
        ],
      },
      {
        npcLine: "Take this medicine twice a day, after meals.",
        npcVi: "Uống thuốc này hai lần một ngày, sau bữa ăn.",
        hints: ["Twice a day...", "Got it"],
        options: [
          { en: "Twice a day after meals. Got it, thank you!", vi: "Hai lần một ngày sau bữa ăn. Mình nhớ rồi, cảm ơn!", ok: true, why: "Nhắc lại cách dùng thuốc để chắc chắn mình nhớ đúng — rất an toàn." },
          { en: "Two times one day before eat.", vi: "Hai lần một ngày trước khi ăn.", ok: false, why: "Bạn nghe nhầm “after” thành “before”. Và “twice a day” tự nhiên hơn." },
          { en: "Thanks, I drink it all now.", vi: "Cảm ơn, tôi uống hết luôn.", ok: false, why: "Đừng uống hết một lần! Mallow nói hai lần một ngày." },
        ],
      },
    ],
    rescue: {
      fast: "Take one tablet every eight hours, but never on an empty stomach, okay?",
      fastVi: "Uống một viên mỗi tám tiếng, nhưng đừng bao giờ uống lúc bụng đói nhé?",
      options: [
        { en: "Sorry, could you write that down for me?", vi: "Xin lỗi, bạn viết ra giúp mình được không?", ok: true, why: "Với thông tin quan trọng như liều thuốc, xin viết ra là cách an toàn và rất bình thường." },
        { en: "Okay, I'll take eight.", vi: "Được, tôi uống tám viên.", ok: false, why: "Nguy hiểm! “every eight hours” là mỗi 8 tiếng, không phải 8 viên." },
        { en: "Yes, empty.", vi: "Vâng, rỗng.", ok: false, why: "Giả vờ hiểu với thuốc men rất rủi ro. Hãy hỏi lại hoặc xin viết ra." },
      ],
      slow: "Of course. One tablet every eight hours. Always eat something first.",
      slowVi: "Tất nhiên. Một viên mỗi tám tiếng. Luôn ăn chút gì trước nhé.",
    },
    builder: [
      { en: "I have a headache.", vi: "Mình bị đau đầu.", decoys: ["am", "an"] },
      { en: "Do I need a prescription?", vi: "Mình có cần đơn thuốc không?", decoys: ["does", "needs"] },
    ],
    chat: {
      opener: "Hi! You don't look well today. What's wrong?",
      openerVi: "Chào! Hôm nay trông bạn không khoẻ. Bạn bị sao vậy?",
      topic: "Đi khám, mua thuốc",
      persona: "a caring bunny who runs an herbal medicine shop; ask about symptoms and how long, give simple safe advice (rest, water, see a doctor if serious)",
    },
  },

  // ───────────────────────── B1 · Đảo Kết Bạn ─────────────────────────
  {
    id: 9,
    level: "B1",
    week: 9,
    title: "Small talk & sở thích",
    subtitle: "Bắt chuyện, giữ câu chuyện tiếp diễn",
    place: "Cây Anh Đào",
    npc: "pip",
    scene: "tree",
    goal: "Bắt chuyện tự nhiên, nói về sở thích và luôn hỏi lại để câu chuyện không bị “chết”.",
    quest: { en: "Pip wants to hang out under the cherry tree again.", vi: "Pip lại rủ bạn ra cây anh đào tám chuyện." },
    words: [
      { en: "How's it going?", vi: "Dạo này thế nào?", ex: "Hey! How's it going?" },
      { en: "be into", vi: "mê, rất thích", ex: "I'm really into photography." },
      { en: "in my free time", vi: "lúc rảnh", ex: "In my free time, I go hiking." },
      { en: "these days", vi: "dạo này", ex: "I'm busy these days." },
      { en: "Sounds fun!", vi: "Nghe vui đấy!", ex: "A boat trip? Sounds fun!" },
      { en: "by the way", vi: "nhân tiện", ex: "By the way, do you like coffee?" },
    ],
    dialogue: [
      { who: "pip", en: "Hey Bơ! How's it going?", vi: "Chào Bơ! Dạo này thế nào?" },
      { who: "you", en: "Pretty good, thanks! How was your weekend?", vi: "Khá ổn, cảm ơn! Cuối tuần của bạn thế nào?" },
      { who: "pip", en: "Great! I went hiking. What do you do in your free time?", vi: "Tuyệt! Mình đi leo núi. Lúc rảnh bạn hay làm gì?" },
      { who: "you", en: "I'm really into photography these days.", vi: "Dạo này mình rất mê chụp ảnh." },
      { who: "pip", en: "Sounds fun! What do you like taking photos of?", vi: "Nghe vui đấy! Bạn thích chụp gì?" },
      { who: "you", en: "Mostly flowers and the sea. By the way, want to see some?", vi: "Chủ yếu là hoa và biển. Nhân tiện, bạn muốn xem vài tấm không?" },
      { who: "pip", en: "Sure, I'd love to!", vi: "Có chứ, mình rất muốn!" },
    ],
    turns: [
      {
        npcLine: "Hey Bơ! How's it going?",
        npcVi: "Chào Bơ! Dạo này thế nào?",
        hints: ["Pretty good", "How was your...?"],
        options: [
          { en: "Pretty good, thanks! How was your weekend?", vi: "Khá ổn, cảm ơn! Cuối tuần của bạn thế nào?", ok: true, why: "Trả lời ngắn rồi hỏi lại — bí quyết để small talk không bị “chết”." },
          { en: "I'm going to the market.", vi: "Mình đang đi chợ.", ok: false, why: "“How's it going?” là “dạo này thế nào”, không hỏi bạn đi đâu." },
          { en: "Fine.", vi: "Ổn.", ok: false, why: "Không sai, nhưng cụt lủn khiến cuộc trò chuyện dừng lại. Thêm một câu hỏi ngược lại nhé." },
        ],
      },
      {
        npcLine: "Great! I went hiking. What do you do in your free time?",
        npcVi: "Tuyệt! Mình đi leo núi. Lúc rảnh bạn hay làm gì?",
        hints: ["I'm into...", "these days"],
        options: [
          { en: "I'm really into photography these days.", vi: "Dạo này mình rất mê chụp ảnh.", ok: true, why: "“be into” là cách nói sở thích rất tự nhiên trong giao tiếp hằng ngày." },
          { en: "I am interesting in photography.", vi: "Mình thú vị trong chụp ảnh.", ok: false, why: "Lỗi kinh điển: “interesting” = thú vị. Cảm thấy thích dùng “interested in” hoặc “into”." },
          { en: "My free time is photography.", vi: "Thời gian rảnh của tôi là chụp ảnh.", ok: false, why: "Sai cấu trúc. Nói: “In my free time, I take photos.”" },
        ],
      },
      {
        npcLine: "Sounds fun! What do you like taking photos of?",
        npcVi: "Nghe vui đấy! Bạn thích chụp gì?",
        hints: ["Mostly...", "want to see some?"],
        options: [
          { en: "Mostly flowers and the sea. Want to see some?", vi: "Chủ yếu là hoa và biển. Bạn muốn xem vài tấm không?", ok: true, why: "Trả lời cụ thể + mời tương tác — câu chuyện sẽ tiếp tục tự nhiên." },
          { en: "I like taking photos of.", vi: "Mình thích chụp.", ok: false, why: "Thiếu đối tượng chụp. Nói cụ thể: “Mostly flowers and the sea.”" },
          { en: "Yes, I like.", vi: "Có, mình thích.", ok: false, why: "Câu hỏi “What...?” cần nội dung cụ thể, không trả lời Yes/No." },
        ],
      },
    ],
    rescue: {
      fast: "Oh nice! Have you ever tried long-exposure shots of the night sky?",
      fastVi: "Hay đấy! Bạn đã bao giờ thử chụp phơi sáng bầu trời đêm chưa?",
      options: [
        { en: "Sorry, what do you mean by “long-exposure”?", vi: "Xin lỗi, “long-exposure” nghĩa là gì?", ok: true, why: "Hỏi đúng từ mình chưa hiểu: “What do you mean by ___?”" },
        { en: "Yes, of course.", vi: "Có, tất nhiên.", ok: false, why: "Giả vờ biết rồi bị hỏi tiếp thì càng khó 😄" },
        { en: "What is night?", vi: "Đêm là gì?", ok: false, why: "Bạn biết “night” mà! Hỏi đúng từ bạn chưa hiểu: “long-exposure”." },
      ],
      slow: "It's when the camera takes a photo very slowly, so you can see lots of stars.",
      slowVi: "Là khi máy ảnh chụp thật chậm, nên bạn thấy được rất nhiều sao.",
    },
    builder: [
      { en: "I'm really into photography.", vi: "Mình rất mê chụp ảnh.", decoys: ["interesting", "in"] },
      { en: "How was your weekend?", vi: "Cuối tuần của bạn thế nào?", decoys: ["were", "did"] },
    ],
    chat: {
      opener: "Hey! How's it going? Did you do anything fun this week?",
      openerVi: "Chào! Dạo này thế nào? Tuần này bạn có làm gì vui không?",
      topic: "Small talk, sở thích",
      persona: "a friendly penguin friend chatting casually about hobbies, weekends, food, music and travel; share small details about yourself too",
    },
  },
  {
    id: 10,
    level: "B1",
    week: 10,
    title: "Rủ rê & từ chối khéo",
    subtitle: "Nhận lời, từ chối, hẹn dịp khác",
    place: "Chợ Cà Rốt",
    npc: "mallow",
    scene: "market",
    goal: "Rủ bạn đi chơi, từ chối lịch sự kèm lý do và đề xuất thời gian khác.",
    quest: { en: "Mallow is planning a trip to the night market.", vi: "Mallow đang lên kế hoạch đi chợ đêm." },
    words: [
      { en: "Do you want to...?", vi: "Bạn có muốn...?", ex: "Do you want to grab dinner?" },
      { en: "I'd love to", vi: "Mình rất muốn", ex: "I'd love to, thanks!" },
      { en: "I'm afraid...", vi: "Mình e là...", ex: "I'm afraid I can't make it." },
      { en: "maybe another time", vi: "để dịp khác nhé", ex: "Sorry, maybe another time?" },
      { en: "Sounds perfect!", vi: "Nghe hoàn hảo!", ex: "Saturday? Sounds perfect!" },
      { en: "Let me know", vi: "Báo mình nhé", ex: "Let me know if anything changes." },
    ],
    dialogue: [
      { who: "mallow", en: "Hey! Do you want to go to the night market on Friday?", vi: "Này! Thứ Sáu bạn có muốn đi chợ đêm không?" },
      { who: "you", en: "I'd love to, but I'm afraid I'm busy on Friday.", vi: "Mình rất muốn, nhưng e là thứ Sáu mình bận." },
      { who: "mallow", en: "Oh, that's okay. How about Saturday?", vi: "Ồ, không sao. Thứ Bảy thì sao?" },
      { who: "you", en: "Saturday sounds perfect! What time?", vi: "Thứ Bảy thì quá hợp! Mấy giờ?" },
      { who: "mallow", en: "Let's meet at six by the fountain.", vi: "Gặp nhau lúc 6 giờ ở đài phun nước nhé." },
      { who: "you", en: "Great. Let me know if anything changes.", vi: "Tuyệt. Có gì thay đổi thì báo mình nhé." },
    ],
    turns: [
      {
        npcLine: "Hey! Do you want to go to the night market on Friday?",
        npcVi: "Này! Thứ Sáu bạn có muốn đi chợ đêm không?",
        hints: ["I'd love to, but...", "I'm afraid"],
        options: [
          { en: "I'd love to, but I'm afraid I'm busy on Friday.", vi: "Mình rất muốn, nhưng e là thứ Sáu mình bận.", ok: true, why: "Từ chối khéo = tỏ ra thích lời mời + lý do ngắn gọn." },
          { en: "No. I don't want.", vi: "Không. Tôi không muốn.", ok: false, why: "Quá thẳng, dễ làm bạn buồn. Dùng “I'd love to, but...” cho mềm mỏng." },
          { en: "I'm afraid of the night market.", vi: "Tôi sợ chợ đêm.", ok: false, why: "“afraid of” = sợ cái gì đó 😄 Từ chối lịch sự là “I'm afraid I can't”." },
        ],
      },
      {
        npcLine: "Oh, that's okay. How about Saturday?",
        npcVi: "Ồ, không sao. Thứ Bảy thì sao?",
        hints: ["sounds perfect", "What time?"],
        options: [
          { en: "Saturday sounds perfect! What time?", vi: "Thứ Bảy thì quá hợp! Mấy giờ?", ok: true, why: "Nhận lời nhiệt tình + hỏi chi tiết để chốt hẹn." },
          { en: "Saturday is sound good.", vi: "Thứ Bảy là nghe tốt.", ok: false, why: "Bỏ “is”: “Saturday sounds good.” — “sound” ở đây là động từ." },
          { en: "How about Saturday?", vi: "Thứ Bảy thì sao?", ok: false, why: "Bạn chỉ lặp lại câu hỏi của Mallow. Hãy nhận lời hoặc đề xuất ngày khác." },
        ],
      },
      {
        npcLine: "Let's meet at six by the fountain.",
        npcVi: "Gặp nhau lúc 6 giờ ở đài phun nước nhé.",
        hints: ["Let me know", "if anything changes"],
        options: [
          { en: "Great! Let me know if anything changes.", vi: "Tuyệt! Có gì thay đổi thì báo mình nhé.", ok: true, why: "Chốt hẹn thân thiện, mở đường cho việc liên lạc lại." },
          { en: "Okay, I will meet you at the six.", vi: "Được, gặp bạn lúc sáu giờ.", ok: false, why: "Không dùng “the” trước giờ: “at six”." },
          { en: "Let me know where is the fountain.", vi: "Cho tôi biết đài phun nước ở đâu.", ok: false, why: "Câu hỏi gián tiếp không đảo ngữ: “where the fountain is”. Mà Mallow vừa nói rồi đấy!" },
        ],
      },
    ],
    rescue: {
      fast: "Actually, Hana might tag along too. You don't mind, do you?",
      fastVi: "À, có thể Hana cũng đi cùng. Bạn không phiền chứ?",
      options: [
        { en: "Sorry, what does “tag along” mean?", vi: "Xin lỗi, “tag along” nghĩa là gì?", ok: true, why: "Hỏi nghĩa cụm từ lạ trước khi trả lời — đặc biệt với câu “Do you mind?”." },
        { en: "Yes, I mind.", vi: "Có, tôi phiền.", ok: false, why: "Cẩn thận! Với “Do you mind?”, trả lời “Yes” nghĩa là bạn KHÔNG đồng ý. Hỏi nghĩa trước đã." },
        { en: "Who is Tag?", vi: "Tag là ai?", ok: false, why: "“tag along” là cụm động từ = đi cùng, không phải tên người 😄" },
      ],
      slow: "It means “come with us”. My friend Hana wants to come too. Is that okay?",
      slowVi: "Nghĩa là “đi cùng”. Bạn mình là Hana cũng muốn đi. Được không?",
    },
    builder: [
      { en: "I'd love to, but I'm busy.", vi: "Mình rất muốn, nhưng mình bận.", decoys: ["like", "not"] },
      { en: "Saturday sounds perfect!", vi: "Thứ Bảy thì quá hợp!", decoys: ["is", "sound"] },
    ],
    chat: {
      opener: "Hey! A few of us are going to the night market this weekend. Do you want to come?",
      openerVi: "Này! Cuối tuần này bọn mình đi chợ đêm. Bạn có muốn đi không?",
      topic: "Rủ rê & từ chối khéo",
      persona: "a cheerful bunny friend who keeps inviting the learner to things (night market, movie, picnic, karaoke); react kindly when they accept or decline",
    },
  },
  {
    id: 11,
    level: "B1",
    week: 11,
    title: "Kể chuyện đã xảy ra",
    subtitle: "Thì quá khứ, từ nối câu chuyện",
    place: "Hồ Kero",
    npc: "kero",
    scene: "pond",
    goal: "Kể lại một chuyện đã xảy ra bằng thì quá khứ và từ nối: first, then, suddenly, in the end.",
    quest: { en: "Kero loves stories. Tell him about your trip!", vi: "Kero mê nghe chuyện. Kể cho cậu ấy về chuyến đi của bạn nhé!" },
    words: [
      { en: "Guess what!", vi: "Đoán xem!", ex: "Guess what! I saw a whale!" },
      { en: "What happened?", vi: "Chuyện gì đã xảy ra?", ex: "You look excited! What happened?" },
      { en: "first", vi: "đầu tiên", ex: "First, we sailed around the island." },
      { en: "then", vi: "sau đó", ex: "Then, we stopped for lunch." },
      { en: "suddenly", vi: "bỗng nhiên", ex: "Suddenly, it started to rain." },
      { en: "in the end", vi: "cuối cùng", ex: "In the end, we had a great time." },
    ],
    dialogue: [
      { who: "kero", en: "You look excited! What happened?", vi: "Trông bạn hào hứng thế! Có chuyện gì vậy?" },
      { who: "you", en: "Guess what! I saw a whale yesterday!", vi: "Đoán xem! Hôm qua mình thấy cá voi đấy!" },
      { who: "kero", en: "No way! Where were you?", vi: "Không thể nào! Lúc đó bạn ở đâu?" },
      { who: "you", en: "I was on a boat trip. First, we sailed around the island.", vi: "Mình đi tàu. Đầu tiên, bọn mình đi vòng quanh đảo." },
      { who: "you", en: "Then, suddenly, a huge whale jumped out of the water!", vi: "Rồi bỗng nhiên, một con cá voi khổng lồ nhảy lên khỏi mặt nước!" },
      { who: "kero", en: "Wow! Did you take a photo?", vi: "Wow! Bạn có chụp ảnh không?" },
      { who: "you", en: "I tried, but in the end my phone fell into the sea!", vi: "Mình đã thử, nhưng cuối cùng điện thoại rơi xuống biển!" },
    ],
    turns: [
      {
        npcLine: "You look excited! What happened?",
        npcVi: "Trông bạn hào hứng thế! Có chuyện gì vậy?",
        hints: ["Guess what!", "saw", "yesterday"],
        options: [
          { en: "Guess what! I saw a whale yesterday!", vi: "Đoán xem! Hôm qua mình thấy cá voi đấy!", ok: true, why: "“Guess what!” mở đầu câu chuyện thật hấp dẫn; “saw” là quá khứ của “see”." },
          { en: "I see a whale yesterday.", vi: "Hôm qua tôi thấy cá voi.", ok: false, why: "Có “yesterday” thì động từ chia quá khứ: see → saw." },
          { en: "What happened?", vi: "Chuyện gì đã xảy ra?", ok: false, why: "Kero đang hỏi bạn đó! Hãy kể: “Guess what! I saw...”" },
        ],
      },
      {
        npcLine: "No way! Where were you?",
        npcVi: "Không thể nào! Lúc đó bạn ở đâu?",
        hints: ["I was on...", "First,"],
        options: [
          { en: "I was on a boat trip. First, we sailed around the island.", vi: "Mình đi tàu. Đầu tiên, bọn mình đi vòng quanh đảo.", ok: true, why: "Đúng thì quá khứ và dùng “First” để bắt đầu chuỗi sự việc." },
          { en: "I am on a boat trip.", vi: "Tôi đang đi tàu.", ok: false, why: "Chuyện đã qua nên dùng “was”." },
          { en: "I was go on a boat trip.", vi: "Tôi đã đi tàu.", ok: false, why: "Thừa “go”. Nói “I went on a boat trip.” hoặc “I was on a boat trip.”" },
        ],
      },
      {
        npcLine: "Wow! Did you take a photo?",
        npcVi: "Wow! Bạn có chụp ảnh không?",
        hints: ["I tried, but...", "in the end"],
        options: [
          { en: "I tried, but in the end my phone fell into the sea!", vi: "Mình đã thử, nhưng cuối cùng điện thoại rơi xuống biển!", ok: true, why: "Kết chuyện bằng “in the end” + một chi tiết bất ngờ — người nghe sẽ thích lắm!" },
          { en: "Yes, I didn't.", vi: "Có, tôi không.", ok: false, why: "Mâu thuẫn: “Yes” rồi lại “didn't”. Chọn: “No, I didn't.” hoặc kể chi tiết hơn." },
          { en: "I tried, but my phone falled into the sea.", vi: "Tôi đã thử nhưng điện thoại rơi xuống biển.", ok: false, why: "“fall” là động từ bất quy tắc: fall → fell (không phải “falled”)." },
        ],
      },
    ],
    rescue: {
      fast: "That reminds me of the time I got stranded on Turtle Rock during a storm!",
      fastVi: "Chuyện đó làm mình nhớ lần mình bị mắc kẹt trên Đá Rùa giữa cơn bão!",
      options: [
        { en: "Sorry, you got what on Turtle Rock?", vi: "Xin lỗi, bạn bị gì trên Đá Rùa cơ?", ok: true, why: "Lặp lại phần nghe được + “what” để hỏi đúng chỗ bị hổng. Rất tự nhiên!" },
        { en: "Cool story.", vi: "Chuyện hay đấy.", ok: false, why: "Kero chưa kể xong mà 😄 Hỏi lại để tham gia vào câu chuyện." },
        { en: "Turtle Rock is a rock.", vi: "Đá Rùa là hòn đá.", ok: false, why: "Lạc đề rồi. Hỏi lại phần chưa hiểu: “You got what?”" },
      ],
      slow: "I got stranded. That means I was stuck there and couldn't leave!",
      slowVi: "Mình bị mắc kẹt. Nghĩa là mình kẹt ở đó và không thể rời đi!",
    },
    builder: [
      { en: "I saw a whale yesterday.", vi: "Hôm qua mình thấy cá voi.", decoys: ["see", "seen"] },
      { en: "What happened next?", vi: "Chuyện gì xảy ra tiếp theo?", decoys: ["happen", "did"] },
    ],
    chat: {
      opener: "Hi! You look like you have a story. What happened this week?",
      openerVi: "Chào! Trông bạn như có chuyện muốn kể. Tuần này có chuyện gì vậy?",
      topic: "Kể chuyện đã xảy ra",
      persona: "a curious frog who loves stories; ask follow-up questions (where, who, then what, how did you feel) so the learner keeps telling the story in the past tense",
    },
  },
  {
    id: 12,
    level: "B1",
    week: 12,
    title: "Phàn nàn & xử lý sự cố",
    subtitle: "Phàn nàn lịch sự, đề xuất giải pháp",
    place: "Quán Miso",
    npc: "miso",
    scene: "cafe",
    goal: "Phàn nàn nhẹ nhàng, giải thích rõ vấn đề và chọn cách giải quyết.",
    quest: { en: "Uh-oh, Miso made the wrong drink. Let's sort it out nicely.", vi: "Ối, Miso làm nhầm đồ uống rồi. Mình cùng giải quyết nhẹ nhàng nhé." },
    words: [
      { en: "I'm afraid there's a problem", vi: "Mình e là có chút vấn đề", ex: "I'm afraid there's a problem with my order." },
      { en: "I ordered...", vi: "Mình đã gọi...", ex: "I ordered a hot latte." },
      { en: "instead", vi: "thay vào đó", ex: "Could I have tea instead?" },
      { en: "refund", vi: "hoàn tiền", ex: "Could I get a refund, please?" },
      { en: "on the house", vi: "quán mời (miễn phí)", ex: "The cookie is on the house!" },
      { en: "No worries", vi: "Không sao đâu", ex: "No worries, these things happen." },
    ],
    dialogue: [
      { who: "you", en: "Excuse me, I'm afraid there's a problem with my order.", vi: "Xin lỗi, mình e là đồ mình gọi có chút vấn đề." },
      { who: "miso", en: "Oh no! What's wrong?", vi: "Ôi không! Có chuyện gì vậy?" },
      { who: "you", en: "I ordered a hot latte, but this one is iced.", vi: "Mình gọi latte nóng, nhưng ly này là đá." },
      { who: "miso", en: "I'm so sorry! I'll make you a new one right away.", vi: "Thành thật xin lỗi! Mình làm ly mới ngay." },
      { who: "you", en: "Thank you. Could I have it to go instead?", vi: "Cảm ơn. Cho mình mang đi được không?" },
      { who: "miso", en: "Of course. And the cookie is on the house!", vi: "Tất nhiên. Và bánh quy là quán mời nhé!" },
      { who: "you", en: "That's so kind. No worries, these things happen.", vi: "Bạn tốt quá. Không sao đâu, chuyện thường mà." },
    ],
    turns: [
      {
        npcLine: "Is everything okay with your drink?",
        npcVi: "Đồ uống của bạn ổn chứ?",
        hints: ["I'm afraid...", "I ordered..."],
        options: [
          { en: "I'm afraid there's a problem. I ordered a hot latte, but this one is iced.", vi: "Mình e là có chút vấn đề. Mình gọi latte nóng, nhưng ly này là đá.", ok: true, why: "Phàn nàn kiểu lịch sự: mở đầu nhẹ nhàng + nói rõ vấn đề cụ thể." },
          { en: "Your coffee is bad. I am angry.", vi: "Cà phê của bạn dở. Tôi giận.", ok: false, why: "Quá gay gắt, chưa nói rõ vấn đề. Dùng “I'm afraid there's a problem...”." },
          { en: "I order hot latte, this is cold latte.", vi: "Tôi gọi latte nóng, đây là latte lạnh.", ok: false, why: "Thiếu thì quá khứ và mạo từ: “I ordered a hot latte, but this one is iced.”" },
        ],
      },
      {
        npcLine: "I'm so sorry! Would you like a new one or a refund?",
        npcVi: "Thành thật xin lỗi! Bạn muốn ly mới hay hoàn tiền?",
        hints: ["A new one", "instead", "to go"],
        options: [
          { en: "A new one, please. Could I have it to go instead?", vi: "Cho mình ly mới nhé. Mình mang đi được không?", ok: true, why: "Chọn rõ một phương án và thêm yêu cầu nhỏ bằng “Could I...?”." },
          { en: "Yes, please.", vi: "Vâng, làm ơn.", ok: false, why: "Câu hỏi lựa chọn, không trả lời “Yes”. Chọn: “A new one, please.”" },
          { en: "Refund me the money now!", vi: "Trả tiền lại cho tôi ngay!", ok: false, why: "Có thể xin hoàn tiền, nhưng hãy lịch sự: “Could I get a refund, please?”" },
        ],
      },
      {
        npcLine: "Here's your hot latte. And the cookie is on the house!",
        npcVi: "Latte nóng của bạn đây. Bánh quy là quán mời nhé!",
        hints: ["That's so kind", "No worries"],
        options: [
          { en: "Thank you, that's so kind! No worries, these things happen.", vi: "Cảm ơn, bạn tốt quá! Không sao đâu, chuyện thường mà.", ok: true, why: "Cảm ơn và cho đối phương “bậc thang” — giữ quan hệ thật đẹp." },
          { en: "On the house? I don't want to go on the roof.", vi: "Trên mái nhà? Tôi không muốn lên mái.", ok: false, why: "“on the house” = quán mời, miễn phí. Không liên quan mái nhà 😄" },
          { en: "Okay. Next time don't make mistake.", vi: "Được. Lần sau đừng làm sai.", ok: false, why: "Gay gắt khi Miso đã xin lỗi và tặng bánh. Hãy cảm ơn: “That's so kind!”" },
        ],
      },
    ],
    rescue: {
      fast: "Sorry, our espresso machine's acting up, so it might take a few extra minutes. Is that alright?",
      fastVi: "Xin lỗi, máy pha espresso đang trục trặc nên có thể mất thêm vài phút. Bạn đợi được không?",
      options: [
        { en: "So it'll take a few more minutes, right?", vi: "Vậy là mất thêm vài phút, đúng không?", ok: true, why: "Nói lại theo ý mình hiểu + “right?” để kiểm tra — chiến thuật của người giao tiếp giỏi." },
        { en: "The machine is acting in a movie?", vi: "Cái máy đang đóng phim à?", ok: false, why: "“acting up” = trục trặc, không phải đóng phim 😄" },
        { en: "No problem, bye!", vi: "Không sao, tạm biệt!", ok: false, why: "Bạn đồng ý mà chưa chắc nội dung. Hãy kiểm tra lại: “So..., right?”" },
      ],
      slow: "Yes, exactly. The machine has a small problem, so please wait a few minutes.",
      slowVi: "Đúng vậy. Máy có chút trục trặc, nên bạn đợi vài phút nhé.",
    },
    builder: [
      { en: "I'm afraid there's a problem.", vi: "Mình e là có chút vấn đề.", decoys: ["scared", "are"] },
      { en: "Could I get a refund, please?", vi: "Cho mình xin hoàn tiền nhé?", decoys: ["give", "money"] },
    ],
    chat: {
      opener: "Hi, welcome back! Is everything okay with your order today?",
      openerVi: "Chào, bạn quay lại rồi! Đồ bạn gọi hôm nay ổn chứ?",
      topic: "Phàn nàn & xử lý sự cố",
      persona: "a grey cat café owner; the learner has a problem (wrong drink, cold food, wrong bill, long wait). Apologise, ask what happened and offer solutions",
    },
  },
  {
    id: 13,
    level: "B1",
    week: 13,
    title: "Phỏng vấn & công sở",
    subtitle: "Kinh nghiệm, điểm mạnh, hỏi lại",
    place: "Sân Bay Mây",
    npc: "pip",
    scene: "airport",
    goal: "Giới thiệu kinh nghiệm, nói điểm mạnh và đặt câu hỏi lại khi phỏng vấn.",
    quest: { en: "Sân Bay Mây is hiring! Pip will interview you.", vi: "Sân Bay Mây đang tuyển người! Pip sẽ phỏng vấn bạn." },
    words: [
      { en: "experience", vi: "kinh nghiệm", ex: "I have two years of experience." },
      { en: "strength", vi: "điểm mạnh", ex: "My biggest strength is patience." },
      { en: "I'm good at...", vi: "Mình giỏi...", ex: "I'm good at solving problems." },
      { en: "deal with", vi: "xử lý, đối phó với", ex: "I can deal with difficult customers." },
      { en: "team player", vi: "người làm việc nhóm tốt", ex: "I'm a real team player." },
      { en: "a typical day", vi: "một ngày làm việc điển hình", ex: "What does a typical day look like?" },
    ],
    dialogue: [
      { who: "pip", en: "Thanks for coming in. Can you tell me a little about yourself?", vi: "Cảm ơn bạn đã đến. Bạn giới thiệu một chút về bản thân nhé?" },
      { who: "you", en: "Sure. I've worked in customer service for two years.", vi: "Vâng. Mình đã làm chăm sóc khách hàng được hai năm." },
      { who: "pip", en: "What would you say is your biggest strength?", vi: "Bạn nghĩ điểm mạnh lớn nhất của mình là gì?" },
      { who: "you", en: "I'm good at staying calm and dealing with problems.", vi: "Mình giỏi giữ bình tĩnh và xử lý vấn đề." },
      { who: "pip", en: "Great. Do you have any questions for us?", vi: "Tốt lắm. Bạn có câu hỏi nào cho chúng tôi không?" },
      { who: "you", en: "Yes. What does a typical day look like here?", vi: "Có ạ. Một ngày làm việc ở đây thường như thế nào?" },
      { who: "pip", en: "Good question! Let me tell you.", vi: "Câu hỏi hay! Để tôi kể bạn nghe." },
    ],
    turns: [
      {
        npcLine: "Thanks for coming in. Can you tell me a little about yourself?",
        npcVi: "Cảm ơn bạn đã đến. Bạn giới thiệu một chút về bản thân nhé?",
        hints: ["I've worked...", "for two years"],
        options: [
          { en: "Sure. I've worked in customer service for two years.", vi: "Vâng. Mình đã làm chăm sóc khách hàng được hai năm.", ok: true, why: "Kinh nghiệm kéo dài đến hiện tại → hiện tại hoàn thành: “I've worked... for...”." },
          { en: "I am work in customer service two years.", vi: "Tôi làm chăm sóc khách hàng hai năm.", ok: false, why: "Sai thì: “I've worked in customer service for two years.”" },
          { en: "I was born in 1999 and I like rice.", vi: "Tôi sinh năm 1999 và thích ăn cơm.", ok: false, why: "Phỏng vấn nên tập trung vào kinh nghiệm làm việc, không kể đời tư 😄" },
        ],
      },
      {
        npcLine: "What would you say is your biggest strength?",
        npcVi: "Bạn nghĩ điểm mạnh lớn nhất của mình là gì?",
        hints: ["I'm good at...", "dealing with"],
        options: [
          { en: "I'm good at staying calm and dealing with problems.", vi: "Mình giỏi giữ bình tĩnh và xử lý vấn đề.", ok: true, why: "Nêu điểm mạnh cụ thể, gắn với công việc. Sau “good at” là V-ing." },
          { en: "I'm good at stay calm.", vi: "Tôi giỏi giữ bình tĩnh.", ok: false, why: "Sau “good at” động từ thêm -ing: “good at staying calm”." },
          { en: "I have no weakness.", vi: "Tôi không có điểm yếu.", ok: false, why: "Nghe kiêu và không trả lời câu hỏi về điểm mạnh." },
        ],
      },
      {
        npcLine: "Great. Do you have any questions for us?",
        npcVi: "Tốt lắm. Bạn có câu hỏi nào cho chúng tôi không?",
        hints: ["What does...look like?", "a typical day"],
        options: [
          { en: "Yes. What does a typical day look like here?", vi: "Có ạ. Một ngày làm việc ở đây thường như thế nào?", ok: true, why: "Luôn có một câu hỏi lại khi phỏng vấn — cho thấy bạn thật sự quan tâm." },
          { en: "No. When do I get money?", vi: "Không. Khi nào tôi nhận tiền?", ok: false, why: "Hỏi lương ngay lúc này nghe thiếu tinh tế. Hỏi về công việc trước." },
          { en: "What is typical day like here look?", vi: "Ngày điển hình ở đây trông thế nào?", ok: false, why: "Lẫn hai cấu trúc. Chọn một: “What's a typical day like?” hoặc “What does a typical day look like?”" },
        ],
      },
    ],
    rescue: {
      fast: "We'd need you to be flexible with shifts, including the occasional red-eye. Would that be an issue?",
      fastVi: "Bạn cần linh hoạt ca làm, đôi khi có cả chuyến bay đêm. Như vậy có vấn đề gì không?",
      options: [
        { en: "Just to check, do you mean night shifts?", vi: "Cho mình xác nhận lại, ý bạn là ca đêm phải không?", ok: true, why: "Đoán nghĩa + xác nhận (“Do you mean...?”) — rất chuyên nghiệp khi phỏng vấn." },
        { en: "My eyes are not red.", vi: "Mắt tôi không đỏ.", ok: false, why: "“red-eye” = chuyến bay đêm, không phải mắt đỏ 😄" },
        { en: "Yes, issue.", vi: "Vâng, vấn đề.", ok: false, why: "Trả lời mơ hồ khi phỏng vấn là điểm trừ. Hãy xác nhận lại ý trước." },
      ],
      slow: "Yes, exactly. Sometimes you'd work on late-night flights. Is that okay?",
      slowVi: "Đúng vậy. Thỉnh thoảng bạn sẽ làm các chuyến bay đêm. Được chứ?",
    },
    builder: [
      { en: "I'm good at dealing with problems.", vi: "Mình giỏi xử lý vấn đề.", decoys: ["deal", "in"] },
      { en: "I've worked here for two years.", vi: "Mình đã làm ở đây được hai năm.", decoys: ["since", "work"] },
    ],
    chat: {
      opener: "Hello, thanks for coming in today. Could you start by telling me a little about yourself?",
      openerVi: "Xin chào, cảm ơn bạn đã đến hôm nay. Bạn bắt đầu bằng việc giới thiệu bản thân nhé?",
      topic: "Phỏng vấn xin việc",
      persona: "a professional but kind penguin hiring manager at Cloud Airport interviewing the learner (experience, strengths, weaknesses, teamwork, a difficult situation, questions for us)",
    },
  },
];

export const CHALLENGES: Challenge[] = [
  { id: "c1", level: "A1", week: 4, title: "Ngày đầu trên đảo", subtitle: "Nhập vai 4 cảnh, không gợi ý", chapters: [1, 2, 3, 4] },
  { id: "c2", level: "A2", week: 8, title: "Chuyến du lịch", subtitle: "Sân bay → nhà hàng → gọi điện → nhà thuốc", chapters: [5, 6, 7, 8] },
  { id: "c3", level: "B1", week: 13, title: "Bữa tiệc của đảo", subtitle: "Tám chuyện cả bữa tiệc, không gợi ý", chapters: [9, 10, 11, 12, 13] },
];

export const TOTAL_WEEKS = 13;

export function getChapter(id: number): Chapter | undefined {
  return CHAPTERS.find((c) => c.id === id);
}

export function getChallenge(id: string): Challenge | undefined {
  return CHALLENGES.find((c) => c.id === id);
}

/** Mỗi tuần có 7 nhiệm vụ ngắn, mỗi ngày một nhiệm vụ (~5–10 phút/ngày). */
export const MISSIONS = [
  { key: "lesson", day: 1, title: "Bài học 10 phút", desc: "Từ mới → nghe mẫu → trò chơi → nhập vai → câu cứu nguy → ôn nhanh", mins: 10 },
  { key: "listen", day: 2, title: "Chỉ nghe: Ai nói gì?", desc: "Nghe hội thoại không có chữ, đoán nghĩa rồi mới xem lời", mins: 5 },
  { key: "speak", day: 3, title: "Nhập vai bằng giọng nói", desc: "Nói câu trả lời thành tiếng, chấm từng từ", mins: 7 },
  { key: "chat", day: 4, title: "Tám chuyện với AI", desc: "5 lượt nói chuyện tự do theo chủ đề tuần, sửa lỗi ngay dưới câu", mins: 8 },
  { key: "review", day: 5, title: "Ôn sổ từ & câu khung", desc: "Lật thẻ từ hoặc nghe tiếng Việt → nói câu tiếng Anh, ôn đúng lúc sắp quên", mins: 5 },
  { key: "reflex", day: 6, title: "Ao Phản Xạ", desc: "Đồng hồ đếm ngược: NPC hỏi, bạn đáp ngay bằng giọng nói — đo tốc độ phản xạ", mins: 4 },
  { key: "sound", day: 7, title: "Phát âm chuẩn", desc: "Nghe phân biệt cặp âm dễ lẫn (ship/sheep, three/tree...) rồi tự nói", mins: 5 },
] as const;

export type MissionKey = (typeof MISSIONS)[number]["key"];

export function missionHref(key: MissionKey, chapterId: number): string {
  switch (key) {
    case "lesson":
      return `/island/lesson/${chapterId}`;
    case "listen":
      return `/island/lesson/${chapterId}?mode=listen`;
    case "speak":
      return `/island/lesson/${chapterId}?mode=speak`;
    case "chat":
      return `/island/chat?ch=${chapterId}`;
    case "review":
      return `/island/words?ch=${chapterId}`;
    case "reflex":
      return `/island/reflex?ch=${chapterId}`;
    case "sound":
      return `/island/sounds?ch=${chapterId}`;
  }
}

/** Câu hỏi kiểm tra xếp lớp: 4 câu A1, 4 câu A2, 4 câu B1. */
export const PLACEMENT: { level: Level; q: string; qVi: string; options: string[]; answer: number }[] = [
  { level: "A1", q: "“Where are you from?”", qVi: "Chọn câu trả lời đúng", options: ["I'm from Vietnam.", "I from Vietnam.", "I'm Vietnam from."], answer: 0 },
  { level: "A1", q: "At a café: “What can I get for you?”", qVi: "Chọn câu tự nhiên nhất", options: ["Give me tea.", "Can I get a green tea, please?", "I am a green tea."], answer: 1 },
  { level: "A1", q: "“How much ___ these apples?”", qVi: "Điền vào chỗ trống", options: ["is", "are", "be"], answer: 1 },
  { level: "A1", q: "“Is it far from here?” — “No, it's ___ to the bank.”", qVi: "Điền vào chỗ trống", options: ["next", "near of", "beside of"], answer: 0 },
  { level: "A2", q: "“Window or aisle seat?”", qVi: "Chọn câu trả lời đúng", options: ["Yes, please.", "I like window.", "An aisle seat, please."], answer: 2 },
  { level: "A2", q: "“How long have you had this cough?”", qVi: "Chọn câu trả lời đúng", options: ["Two days ago.", "Since Monday.", "From Monday to now."], answer: 1 },
  { level: "A2", q: "On the phone: “Who's calling, please?”", qVi: "Chọn câu tự nhiên nhất", options: ["This is Lan.", "I am Lan speaking now.", "Me Lan."], answer: 0 },
  { level: "A2", q: "“I ___ a table for two at 7 pm.”", qVi: "Điền vào chỗ trống", options: ["booking", "have booked", "am book"], answer: 1 },
  { level: "B1", q: "A friend invites you, but you're busy. Best reply:", qVi: "Chọn cách từ chối khéo nhất", options: ["No, I don't want.", "I'd love to, but I'm afraid I can't make it.", "I'm afraid of it."], answer: 1 },
  { level: "B1", q: "“I'm really interested ___ photography.”", qVi: "Điền vào chỗ trống", options: ["on", "at", "in"], answer: 2 },
  { level: "B1", q: "“Do you mind if I open the window?” — You agree. You say:", qVi: "Chọn câu trả lời đúng", options: ["Yes, I do.", "No, not at all.", "Yes, I mind."], answer: 1 },
  { level: "B1", q: "Your soup is cold. Best way to complain:", qVi: "Chọn câu lịch sự nhất", options: ["This soup is bad!", "Excuse me, I'm afraid my soup is a bit cold.", "You make cold soup."], answer: 1 },
];
