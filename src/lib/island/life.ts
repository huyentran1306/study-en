// "Thử ngoài đời" (nhiệm vụ thật mỗi tuần) và "Truyện cư dân" (4 mạch truyện, mỗi tuần một tập).
// File thuần (không "use client").
import type { NpcId } from "./curriculum";

export interface RealLife {
  id: string;
  ch: number;
  /** Việc cần làm ngoài đời (tiếng Việt). */
  task: string;
  /** Câu mẫu có thể dùng. */
  example: string;
}

export const REAL_LIFE: RealLife[] = [
  { id: "rl-1", ch: 1, task: "Tự giới thiệu bằng tiếng Anh với một người (đồng nghiệp, bạn bè, hoặc ghi âm gửi cho chính mình).", example: "Hi, I'm Lan. I'm a tester from Saigon. Nice to meet you!" },
  { id: "rl-2", ch: 2, task: "Gọi đồ uống bằng tiếng Anh ở một quán (hoặc tự nói to khi gọi món trên app).", example: "Can I have an iced latte, please? To go." },
  { id: "rl-3", ch: 3, task: "Hỏi giá một món đồ bằng tiếng Anh (ở chợ, cửa hàng, hoặc với bạn bè).", example: "Excuse me, how much is this?" },
  { id: "rl-4", ch: 4, task: "Chỉ đường cho ai đó bằng tiếng Anh, hoặc mở bản đồ và tự nói đường từ nhà tới chỗ làm.", example: "Go straight, then turn left at the bridge. It's next to the bakery." },
  { id: "rl-5", ch: 5, task: "Gửi một tin nhắn tiếng Anh hỏi về phòng khách sạn / homestay (có thể nhắn thử cho bạn bè).", example: "Hi, do you have a room for two nights? Is breakfast included?" },
  { id: "rl-6", ch: 6, task: "Đọc thực đơn một nhà hàng bằng tiếng Anh và nói to món bạn sẽ gọi.", example: "I'd like the chicken curry, please. Not too spicy." },
  { id: "rl-7", ch: 7, task: "Gọi điện hoặc nhắn tin bằng tiếng Anh để hẹn lịch (với bạn bè, hoặc đóng vai với người thân).", example: "Are you free on Saturday? How about 8 am?" },
  { id: "rl-8", ch: 8, task: "Kể với ai đó bằng tiếng Anh: hôm nay bạn thấy trong người thế nào.", example: "I have a headache, so I'm going to rest early tonight." },
  { id: "rl-9", ch: 9, task: "Bắt chuyện xã giao 3 câu bằng tiếng Anh với một người (đồng nghiệp nước ngoài, nhóm học, game online…).", example: "How was your weekend? Did you do anything fun?" },
  { id: "rl-10", ch: 10, task: "Rủ một người đi đâu đó bằng tiếng Anh, hoặc từ chối khéo một lời mời.", example: "I'd love to, but I'm busy tonight. Maybe next time?" },
  { id: "rl-11", ch: 11, task: "Kể lại một chuyện đã xảy ra tuần này bằng tiếng Anh (nói với ai đó hoặc ghi âm 1 phút).", example: "Last Sunday, I went to a night market. First, we ate…, then…" },
  { id: "rl-12", ch: 12, task: "Viết một tin nhắn phàn nàn lịch sự bằng tiếng Anh (đơn hàng giao trễ, đồ bị lỗi…).", example: "Hi, my order arrived late and one item is missing. Could you help me?" },
  { id: "rl-13", ch: 13, task: "Trả lời to câu “Tell me about yourself” trong 1 phút như đang phỏng vấn.", example: "I'm a software tester with three years of experience. I enjoy…" },
];

export interface Episode {
  id: string;
  npc: NpcId;
  /** Tuần mở (theo lịch 13 tuần). */
  week: number;
  title: string;
  /** Lời cư dân; {prev} = câu trả lời của bạn ở tập trước cùng mạch truyện. */
  lines: { en: string; vi: string }[];
  question: { en: string; vi: string };
  /** Mạch truyện + tập trước (để điền {prev}). */
  arc: string;
  prevId?: string;
  /** Cư dân ghi nhớ câu trả lời (dạng "you ..."): {a} = câu trả lời. */
  memory: { fact: string; vi: string; ask: string };
}

export const EPISODES: Episode[] = [
  {
    id: "ep-miso-1", npc: "miso", week: 1, arc: "miso", title: "Quán thứ hai của Miso",
    lines: [
      { en: "Can I tell you a secret? I want to open a second café on the other side of the island!", vi: "Kể bạn nghe bí mật nhé? Mình muốn mở quán thứ hai ở bên kia đảo!" },
      { en: "But I can't think of a name. I need your help.", vi: "Mà mình nghĩ mãi không ra tên. Mình cần bạn giúp." },
    ],
    question: { en: "What should I call my new café? And why?", vi: "Mình nên đặt tên quán mới là gì? Vì sao?" },
    memory: { fact: "you suggested a name for my new café: \"{a}\"", vi: "bạn gợi ý tên quán mới: \"{a}\"", ask: "I'm still thinking about your name idea. Do you have any more ideas?" },
  },
  {
    id: "ep-mallow-1", npc: "mallow", week: 2, arc: "mallow", title: "Chiếc xe tải mơ ước",
    lines: [
      { en: "I'm saving money for a little truck for the market. I have half the money now!", vi: "Mình đang để dành tiền mua xe tải nhỏ chở hàng. Giờ có một nửa rồi!" },
      { en: "I can't decide the colour. Orange like carrots? Or green like lettuce?", vi: "Mình phân vân màu xe. Cam như cà rốt? Hay xanh như rau xà lách?" },
    ],
    question: { en: "What colour should my truck be? Why?", vi: "Xe nên màu gì? Vì sao?" },
    memory: { fact: "you told me my truck should be {a}", vi: "bạn khuyên xe tải của Mallow nên: {a}", ask: "I'm getting closer to buying the truck! Do you remember your colour idea?" },
  },
  {
    id: "ep-pip-1", npc: "pip", week: 3, arc: "pip", title: "Pip học tiếng Việt",
    lines: [
      { en: "Xin chào! I'm learning Vietnamese, but it's so hard. The tones!", vi: "Xin chào! Mình đang học tiếng Việt mà khó quá. Mấy cái dấu!" },
      { en: "You're learning my language, so I'm learning yours. Fair, right?", vi: "Bạn học tiếng của mình thì mình học tiếng của bạn. Công bằng ha?" },
    ],
    question: { en: "Teach me one useful Vietnamese word. What does it mean in English?", vi: "Dạy mình một từ tiếng Việt hữu ích đi. Nghĩa tiếng Anh là gì?" },
    memory: { fact: "you taught me a Vietnamese word: {a}", vi: "bạn dạy Pip một từ tiếng Việt: {a}", ask: "I practised the Vietnamese word you taught me every day! Can you teach me another one?" },
  },
  {
    id: "ep-kero-1", npc: "kero", week: 4, arc: "kero", title: "Nhật ký tiếng Anh",
    lines: [
      { en: "Every night I write three sentences in my English diary.", vi: "Tối nào mình cũng viết ba câu vào nhật ký tiếng Anh." },
      { en: "Tonight I don't know what to write about. Maybe… you?", vi: "Tối nay mình không biết viết gì. Hay là… viết về bạn?" },
    ],
    question: { en: "Tell me one good thing that happened to you this week.", vi: "Kể mình nghe một điều vui xảy ra với bạn tuần này." },
    memory: { fact: "you told me a good thing from your week: {a}", vi: "bạn kể một điều vui trong tuần: {a}", ask: "I wrote about your good news in my diary! Has anything else good happened since then?" },
  },
  {
    id: "ep-miso-2", npc: "miso", week: 5, arc: "miso", prevId: "ep-miso-1", title: "Món đầu tiên",
    lines: [
      { en: "Good news! The new café will be called “{prev}”. Thanks to you!", vi: "Tin vui! Quán mới sẽ tên là “{prev}”. Nhờ bạn đó!" },
      { en: "Now I need one special drink for the opening day.", vi: "Giờ mình cần một món đặc biệt cho ngày khai trương." },
    ],
    question: { en: "What special drink should I make? What's in it?", vi: "Mình nên pha món gì đặc biệt? Có gì trong đó?" },
    memory: { fact: "you invented a special drink for my new café: {a}", vi: "bạn nghĩ ra món đặc biệt cho quán mới: {a}", ask: "I tried making your special drink! Want to know how it tasted?" },
  },
  {
    id: "ep-mallow-2", npc: "mallow", week: 6, arc: "mallow", prevId: "ep-mallow-1", title: "Chuyến xe đầu tiên",
    lines: [
      { en: "I did it! I bought the truck. You said: “{prev}”. I listened!", vi: "Mình làm được rồi! Mua được xe rồi. Bạn bảo: “{prev}”. Mình nghe theo đó!" },
      { en: "Tomorrow is my first drive. I'm a little scared.", vi: "Mai là lần đầu mình lái. Hơi sợ chút." },
    ],
    question: { en: "Where should I drive first? Give me one piece of advice.", vi: "Mình nên lái tới đâu đầu tiên? Cho mình một lời khuyên." },
    memory: { fact: "you gave me advice for my first drive: {a}", vi: "bạn khuyên Mallow trước chuyến lái đầu: {a}", ask: "My first drive went well, thanks to your advice! Have you ever driven a car?" },
  },
  {
    id: "ep-pip-2", npc: "pip", week: 7, arc: "pip", prevId: "ep-pip-1", title: "Từ tiếng Việt ở sân bay",
    lines: [
      { en: "I used your word “{prev}” with a Vietnamese passenger today. She smiled so much!", vi: "Hôm nay mình dùng từ “{prev}” với một hành khách người Việt. Cô ấy cười tươi lắm!" },
      { en: "Now I want to learn a whole sentence.", vi: "Giờ mình muốn học nguyên một câu." },
    ],
    question: { en: "How do I say “Have a nice trip!” in Vietnamese? When do people say it?", vi: "“Have a nice trip!” nói bằng tiếng Việt thế nào? Người ta nói khi nào?" },
    memory: { fact: "you taught me how to wish someone a nice trip in Vietnamese: {a}", vi: "bạn dạy Pip câu chúc thượng lộ bình an: {a}", ask: "I say your Vietnamese sentence to passengers every day! Should I learn one more?" },
  },
  {
    id: "ep-kero-2", npc: "kero", week: 8, arc: "kero", prevId: "ep-kero-1", title: "Trang nhật ký về bạn",
    lines: [
      { en: "Last time you told me: “{prev}”. I wrote it in my diary.", vi: "Lần trước bạn kể: “{prev}”. Mình đã viết vào nhật ký." },
      { en: "Today I want to write about your English. You've changed a lot!", vi: "Hôm nay mình muốn viết về tiếng Anh của bạn. Bạn tiến bộ nhiều lắm!" },
    ],
    question: { en: "What's one thing you can do in English now that you couldn't do before?", vi: "Có điều gì giờ bạn làm được bằng tiếng Anh mà trước đây chưa làm được?" },
    memory: { fact: "you told me what you can now do in English: {a}", vi: "bạn kể điều giờ đã làm được bằng tiếng Anh: {a}", ask: "I read your diary page again today. What else can you do in English now?" },
  },
  {
    id: "ep-miso-3", npc: "miso", week: 9, arc: "miso", prevId: "ep-miso-2", title: "Ngày khai trương",
    lines: [
      { en: "The new café opens next week! Your drink, “{prev}”, is on the menu.", vi: "Tuần sau quán mới khai trương! Món “{prev}” của bạn có trong thực đơn." },
      { en: "But I have to give a short speech, and I'm so nervous…", vi: "Mà mình phải phát biểu ngắn, hồi hộp quá…" },
    ],
    question: { en: "Can you give me one tip for my opening speech?", vi: "Cho mình một mẹo để phát biểu khai trương nhé?" },
    memory: { fact: "you gave me a tip for my opening speech: {a}", vi: "bạn cho Miso mẹo phát biểu khai trương: {a}", ask: "I used your speech tip at the opening and everyone clapped! Do you get nervous when you speak in public?" },
  },
  {
    id: "ep-mallow-3", npc: "mallow", week: 10, arc: "mallow", prevId: "ep-mallow-2", title: "Xe hỏng giữa đường",
    lines: [
      { en: "Oh no! My truck broke down on the way to the market. All my carrots are in the back!", vi: "Thôi xong! Xe hỏng giữa đường ra chợ. Cà rốt chất đầy thùng sau!" },
      { en: "Remember your advice, “{prev}”? I need more advice now!", vi: "Nhớ lời khuyên “{prev}” của bạn không? Giờ mình cần thêm lời khuyên!" },
    ],
    question: { en: "What should I do now? Give me two ideas.", vi: "Giờ mình nên làm gì? Cho mình hai ý." },
    memory: { fact: "you helped me when my truck broke down: {a}", vi: "bạn giúp Mallow lúc xe hỏng: {a}", ask: "Your ideas saved my carrots last time! Have you ever had a problem like that?" },
  },
  {
    id: "ep-pip-3", npc: "pip", week: 11, arc: "pip", prevId: "ep-pip-2", title: "Bài phát biểu ở sân bay",
    lines: [
      { en: "Big news: I'm Employee of the Month! I have to give a speech… in English AND Vietnamese.", vi: "Tin lớn: mình là Nhân viên của tháng! Phải phát biểu… bằng cả tiếng Anh LẪN tiếng Việt." },
      { en: "I'll start with your sentence: “{prev}”.", vi: "Mình sẽ mở đầu bằng câu của bạn: “{prev}”." },
    ],
    question: { en: "How do you stop feeling nervous before speaking? Tell me what you do.", vi: "Bạn làm gì để bớt run trước khi nói? Kể mình nghe." },
    memory: { fact: "you told me how you stop feeling nervous before speaking: {a}", vi: "bạn kể cách bớt run trước khi nói: {a}", ask: "My speech went great, I tried your trick! Did you use it recently too?" },
  },
  {
    id: "ep-kero-3", npc: "kero", week: 12, arc: "kero", prevId: "ep-kero-2", title: "Trang cuối cuốn nhật ký",
    lines: [
      { en: "My diary is almost full. The last page is for you.", vi: "Cuốn nhật ký sắp kín rồi. Trang cuối dành cho bạn." },
      { en: "You once told me: “{prev}”. I'm so proud of you, friend.", vi: "Bạn từng kể: “{prev}”. Mình tự hào về bạn lắm." },
    ],
    question: { en: "What will you do next with your English? Tell me your plan.", vi: "Tiếp theo bạn sẽ làm gì với tiếng Anh? Kể mình nghe kế hoạch nhé." },
    memory: { fact: "you told me your next plan for your English: {a}", vi: "bạn kể kế hoạch tiếp theo với tiếng Anh: {a}", ask: "How is your English plan going? Tell me everything!" },
  },
];

/** Điền câu trả lời tập trước vào lời cư dân (chưa trả lời thì dùng câu chung chung). */
export function fillPrev(text: string, prev?: string): string {
  return text.replace(/\{prev\}/g, prev ? prev.replace(/[.!?\s]+$/, "") : "your idea");
}
