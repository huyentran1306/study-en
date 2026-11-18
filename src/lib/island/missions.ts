// Nhiệm vụ "hỏi ra thông tin" (information gap) và Thử thách cuối tuần.
// Cư dân giữ vài thông tin bí mật; người học phải HỎI đúng để lấy được, rồi điền vào phiếu. Thắng = lấy đúng thông tin.
// File thuần (không "use client").
import type { NpcId } from "./curriculum";

export interface Fact {
  key: string;
  /** Ô trên phiếu (tiếng Việt). */
  label: string;
  /** Đáp án hiển thị sau khi nộp. */
  value: string;
  /** Các cách viết được chấp nhận (so sánh sau khi bỏ dấu cách, dấu câu, chữ hoa). */
  accept: string[];
  /** Câu tiếng Anh đưa cho AI. */
  en: string;
}

export interface Mission {
  id: string;
  ch: number;
  npc: NpcId;
  level: "A1" | "A2" | "B1";
  title: string;
  /** Bối cảnh + việc cần làm (tiếng Việt). */
  brief: string;
  persona: string;
  topic: string;
  opener: string;
  facts: Fact[];
  /** Gợi ý câu hỏi mẫu (hiện khi bí). */
  hints: string[];
  /** Màn thử thách cuối tuần: giới hạn thời gian + cư dân đang bực / vội. */
  boss?: { seconds: number; mood: string; trophy: string; trophyVi: string };
}

export const MISSIONS: Mission[] = [
  {
    id: "m-menu",
    ch: 2,
    npc: "miso",
    level: "A1",
    title: "Thực đơn hôm nay",
    brief: "Bạn muốn rủ bạn bè đến quán Miso tối nay. Hỏi Miso: món đặc biệt hôm nay, giá bao nhiêu, quán đóng cửa lúc mấy giờ.",
    persona: "a kind grey cat barista who runs a cozy café",
    topic: "Today's café menu",
    opener: "Hi there! Welcome to my café. How can I help you?",
    facts: [
      { key: "special", label: "Món đặc biệt hôm nay", value: "honey lemon tea", accept: ["honeylemon", "lemonhoney"], en: "Today's special drink is honey lemon tea." },
      { key: "price", label: "Giá món đó (đồng xu)", value: "4 coins", accept: ["4", "four"], en: "It costs 4 coins." },
      { key: "close", label: "Giờ đóng cửa", value: "9 pm", accept: ["9", "nine", "21"], en: "The café closes at 9 pm tonight." },
    ],
    hints: ["What's the special today?", "How much is it?", "What time do you close?"],
  },
  {
    id: "m-market",
    ch: 3,
    npc: "mallow",
    level: "A1",
    title: "Đi chợ hộ Kero",
    brief: "Kero nhờ bạn đi chợ. Hỏi Mallow: một hộp dâu giá bao nhiêu, hôm nay loại quả nào đang giảm giá, và chợ giao hàng vào thứ mấy.",
    persona: "a sweet white bunny who sells vegetables and fruit at the market",
    topic: "Shopping for fruit",
    opener: "Good morning! Fresh fruit today! What are you looking for?",
    facts: [
      { key: "berry", label: "Giá một hộp dâu (đồng xu)", value: "6 coins", accept: ["6", "six"], en: "A box of strawberries is 6 coins." },
      { key: "sale", label: "Quả đang giảm giá", value: "mangoes", accept: ["mango"], en: "Mangoes are on sale today, two for 5 coins." },
      { key: "delivery", label: "Ngày giao hàng", value: "Thursday", accept: ["thursday", "thu", "thứ5", "thu5"], en: "The market delivers to your home on Thursday." },
    ],
    hints: ["How much is a box of strawberries?", "Is anything on sale today?", "Do you deliver? Which day?"],
  },
  {
    id: "m-bakery",
    ch: 4,
    npc: "kero",
    level: "A1",
    title: "Tìm tiệm bánh",
    brief: "Bạn mới đến đảo và muốn mua bánh mì sáng mai. Hỏi Kero: tiệm bánh ở đâu, đi bộ mất bao lâu, mấy giờ mở cửa.",
    persona: "a friendly frog tour guide who knows every path on the island",
    topic: "Finding the bakery",
    opener: "Hello, traveller! Do you need help finding something?",
    facts: [
      { key: "where", label: "Tiệm bánh nằm ở đâu", value: "next to the bridge", accept: ["bridge", "cầu", "cau"], en: "The bakery is next to the old bridge." },
      { key: "walk", label: "Đi bộ mất bao lâu", value: "10 minutes", accept: ["10", "ten"], en: "It's a 10-minute walk from here." },
      { key: "open", label: "Giờ mở cửa", value: "7 am", accept: ["7", "seven"], en: "It opens at 7 am." },
    ],
    hints: ["Where is the bakery?", "How long does it take to walk there?", "What time does it open?"],
  },
  {
    id: "m-hotel",
    ch: 5,
    npc: "pip",
    level: "A2",
    title: "Nhận phòng khách sạn",
    brief: "Bạn vừa đến Khách sạn Mây. Hỏi Pip: số phòng của bạn, bữa sáng phục vụ từ mấy giờ, và mật khẩu Wi-Fi.",
    persona: "a polite penguin receptionist at the Cloud Hotel next to the island airport",
    topic: "Checking in at a hotel",
    opener: "Good evening, welcome to the Cloud Hotel! Do you have a reservation?",
    facts: [
      { key: "room", label: "Số phòng", value: "204", accept: ["204", "twohundredfour", "twoohfour"], en: "The learner's room is number 204, on the second floor." },
      { key: "breakfast", label: "Bữa sáng bắt đầu lúc", value: "6:30", accept: ["630", "6:30", "sixthirty", "halfpastsix"], en: "Breakfast is from 6:30 to 9:30 am." },
      { key: "wifi", label: "Mật khẩu Wi-Fi", value: "cloud123", accept: ["cloud123", "cloudonetwothree"], en: "The Wi-Fi password is cloud123 (spell it if asked: c-l-o-u-d-1-2-3)." },
    ],
    hints: ["Which room am I in?", "What time is breakfast?", "What's the Wi-Fi password? Can you spell it?"],
  },
  {
    id: "m-dinner",
    ch: 6,
    npc: "miso",
    level: "A2",
    title: "Đặt món cho bạn ăn chay",
    brief: "Bạn đi ăn tối với một người bạn ăn chay. Hỏi Miso: món chính nào không có thịt, món tráng miệng hôm nay, và phải chờ bao lâu.",
    persona: "a grey cat who runs a small evening restaurant; menu: fish soup, pumpkin risotto, chicken curry, salad, cakes",
    topic: "Ordering dinner for a vegetarian friend",
    opener: "Good evening! Table for two? Here's the menu.",
    facts: [
      { key: "veggie", label: "Món chính không có thịt", value: "pumpkin risotto", accept: ["pumpkin", "risotto", "bíđỏ", "biđo"], en: "The only vegetarian main dish is the pumpkin risotto." },
      { key: "dessert", label: "Tráng miệng hôm nay", value: "mango cake", accept: ["mango"], en: "Today's dessert is mango cake." },
      { key: "wait", label: "Thời gian chờ", value: "15 minutes", accept: ["15", "fifteen", "quarter"], en: "The food takes about 15 minutes tonight." },
    ],
    hints: ["Do you have any vegetarian dishes?", "What's for dessert today?", "How long will the food take?"],
  },
  {
    id: "m-tour",
    ch: 7,
    npc: "kero",
    level: "A2",
    title: "Gọi điện đặt tour",
    brief: "Bạn gọi cho Kero để đặt tour vòng quanh đảo. Hỏi: tour đi vào ngày nào, mấy giờ xuất phát, giá mỗi người.",
    persona: "a frog who runs island tours, answering the phone",
    topic: "Booking a tour by phone",
    opener: "Hello, Kero's Island Tours, Kero speaking. How can I help?",
    facts: [
      { key: "day", label: "Ngày đi tour", value: "Saturday", accept: ["saturday", "sat", "thứ7", "thu7"], en: "The next island tour is on Saturday." },
      { key: "time", label: "Giờ xuất phát", value: "8 am", accept: ["8", "eight"], en: "It starts at 8 am at the airport gate." },
      { key: "price", label: "Giá mỗi người (đồng xu)", value: "12 coins", accept: ["12", "twelve"], en: "It costs 12 coins per person, lunch included." },
    ],
    hints: ["When is the next tour?", "What time does it start?", "How much is it per person?"],
  },
  {
    id: "m-pharmacy",
    ch: 8,
    npc: "mallow",
    level: "A2",
    title: "Mua thuốc ho",
    brief: "Bạn bị ho mấy hôm nay. Hỏi Mallow: nên dùng thuốc gì, uống mấy lần một ngày, và cần tránh thứ gì.",
    persona: "a caring bunny who runs an herbal medicine shop; give simple safe advice",
    topic: "Buying cough medicine",
    opener: "Hello! You don't look very well. What's the matter?",
    facts: [
      { key: "name", label: "Tên thuốc", value: "honey ginger syrup", accept: ["ginger", "gừng", "gung"], en: "For a cough, she recommends honey ginger syrup." },
      { key: "times", label: "Uống mấy lần một ngày", value: "3 times", accept: ["3", "three"], en: "Take it three times a day, after meals." },
      { key: "avoid", label: "Cần tránh", value: "cold drinks", accept: ["cold", "ice", "lạnh", "lanh", "đá", "da"], en: "Avoid cold drinks and ice." },
    ],
    hints: ["What do you recommend for a cough?", "How often should I take it?", "Is there anything I should avoid?"],
  },
  {
    id: "m-pip",
    ch: 9,
    npc: "pip",
    level: "B1",
    title: "Làm quen với Pip",
    brief: "Bạn muốn chọn quà sinh nhật cho Pip. Tám chuyện để biết: sở thích của Pip, món ăn Pip thích nhất, và nước Pip vừa đi du lịch.",
    persona: "a friendly penguin friend chatting casually; do not give these facts straight away, chat naturally",
    topic: "Getting to know Pip",
    opener: "Hey! Nice weather today, isn't it? What have you been up to?",
    facts: [
      { key: "hobby", label: "Sở thích của Pip", value: "photography", accept: ["photo", "camera", "chụpảnh", "chupanh"], en: "Pip's hobby is photography; he takes photos of sunsets." },
      { key: "food", label: "Món Pip thích nhất", value: "fish tacos", accept: ["taco"], en: "Pip's favourite food is fish tacos." },
      { key: "trip", label: "Nước Pip vừa đi", value: "Japan", accept: ["japan", "nhật", "nhat"], en: "Pip just came back from a trip to Japan." },
    ],
    hints: ["What do you like doing in your free time?", "What's your favourite food?", "Have you travelled anywhere recently?"],
  },
];

export const BOSSES: Mission[] = [
  {
    id: "b-luggage",
    ch: 5,
    npc: "pip",
    level: "A2",
    title: "Hành lý thất lạc",
    brief: "Vali của bạn không ra băng chuyền! Pip ở quầy đang rất bận và hơi cáu. Lịch sự, giữ bình tĩnh, và lấy cho được: mã hồ sơ, khi nào vali được giao, và bạn được bồi thường gì.",
    persona: "a busy, stressed penguin at the airport lost-luggage desk",
    topic: "Lost luggage at the airport",
    opener: "Next! Yes, yes, what's the problem? Quickly please, it's very busy.",
    facts: [
      { key: "claim", label: "Mã hồ sơ", value: "LX58", accept: ["lx58", "lx-58", "lxfiftyeight"], en: "The claim number is LX58." },
      { key: "when", label: "Khi nào vali được giao", value: "tomorrow morning", accept: ["tomorrow"], en: "The suitcase will be delivered to the hotel tomorrow morning." },
      { key: "gift", label: "Bồi thường", value: "a free taxi voucher", accept: ["taxi"], en: "As compensation, the learner gets a free taxi voucher." },
    ],
    hints: ["Excuse me, my suitcase didn't arrive.", "Could you give me the claim number, please?", "When will I get it back?", "Is there any compensation?"],
    boss: { seconds: 240, mood: "You are stressed and answer short and a bit fast. You become friendlier when the learner is polite (please, sorry, thank you) or patient.", trophy: "trophy-suitcase", trophyVi: "Vali vàng" },
  },
  {
    id: "b-rain",
    ch: 4,
    npc: "kero",
    level: "A2",
    title: "Lạc đường dưới mưa",
    brief: "Trời đổ mưa to, bạn lạc ở phía bắc đảo. Kero đang vội về nhà và nói nhanh. Hỏi cho được: chỗ trú mưa gần nhất, đi xe buýt số mấy, và chuyến cuối lúc mấy giờ.",
    persona: "a frog tour guide in a hurry in the heavy rain",
    topic: "Lost in the rain",
    opener: "Whoa, what a storm! I'm in a real hurry, sorry. What do you need?",
    facts: [
      { key: "shelter", label: "Chỗ trú mưa", value: "the lighthouse", accept: ["lighthouse", "hảiđăng", "haidang"], en: "The nearest shelter is the old lighthouse, two minutes away." },
      { key: "bus", label: "Xe buýt số", value: "7", accept: ["7", "seven"], en: "Bus number 7 goes back to the café." },
      { key: "last", label: "Chuyến cuối lúc", value: "10 pm", accept: ["10", "ten", "22"], en: "The last bus is at 10 pm." },
    ],
    hints: ["Sorry, where can I wait out the rain?", "Which bus goes to the café?", "What time is the last bus?", "Could you speak more slowly, please?"],
    boss: { seconds: 240, mood: "You are in a hurry and speak fast with short sentences. Slow down and explain when the learner asks you to repeat or speak slowly.", trophy: "trophy-umbrella", trophyVi: "Ô cầu vồng" },
  },
  {
    id: "b-rush",
    ch: 12,
    npc: "miso",
    level: "B1",
    title: "Quán đông nghẹt",
    brief: "Quán Miso đông nghẹt, bạn đặt bàn sinh nhật mà bị lỡ. Miso đang rối. Hỏi cho được: phải chờ bao lâu, món nào hết rồi, và Miso đề xuất món gì thay.",
    persona: "a grey cat café owner on a crazy busy day; the learner's birthday table booking was lost",
    topic: "A busy café and a lost booking",
    opener: "Oh no, it's so busy today! Sorry, sorry. Did you have a booking?",
    facts: [
      { key: "wait", label: "Thời gian chờ bàn", value: "20 minutes", accept: ["20", "twenty"], en: "A table will be free in about 20 minutes." },
      { key: "soldout", label: "Món đã hết", value: "croissants", accept: ["croissant"], en: "The croissants are sold out." },
      { key: "instead", label: "Món đề xuất thay", value: "banana bread", accept: ["banana"], en: "Miso suggests the banana bread instead, with a free candle for the birthday." },
    ],
    hints: ["I booked a table for a birthday, but…", "How long do we have to wait?", "Is anything sold out?", "What would you recommend instead?"],
    boss: { seconds: 240, mood: "You are flustered and apologise a lot, and you talk fast. Offer solutions when the learner stays calm and asks clearly.", trophy: "trophy-cake", trophyVi: "Bánh kem pha lê" },
  },
  {
    id: "b-party",
    ch: 10,
    npc: "mallow",
    level: "B1",
    title: "Tiệc bất ngờ cho Kero",
    brief: "Mallow đang lén tổ chức tiệc bất ngờ cho Kero, nói thì thầm và hay đổi ý. Hỏi cho được: tiệc vào ngày nào, ở đâu, và bạn cần mang gì.",
    persona: "an excited bunny secretly planning a surprise party for Kero, whispering and changing details",
    topic: "Planning a surprise party",
    opener: "Psst! Come here, come here! Can you keep a secret?",
    facts: [
      { key: "day", label: "Ngày tổ chức", value: "Friday", accept: ["friday", "fri", "thứ6", "thu6"], en: "The surprise party is on Friday evening (first you say Thursday, then correct yourself: Friday)." },
      { key: "place", label: "Địa điểm", value: "under the cherry tree", accept: ["cherry", "anhđào", "anhdao"], en: "It's under the cherry tree." },
      { key: "bring", label: "Bạn cần mang gì", value: "a cake", accept: ["cake", "bánh", "banh"], en: "The learner should bring a cake." },
    ],
    hints: ["When is the party?", "Wait, is it Thursday or Friday?", "Where is it going to be?", "What should I bring?"],
    boss: { seconds: 240, mood: "You whisper, get excited, and sometimes give a wrong detail and then correct yourself. Confirm details when the learner checks them.", trophy: "trophy-balloon", trophyVi: "Bóng bay vàng" },
  },
];

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFC")
    .replace(/[\s.,:;!?'"’\-–_/()]+/g, "");

export function checkFact(f: Fact, answer: string): boolean {
  const a = norm(answer);
  if (!a) return false;
  return f.accept.some((x) => {
    const n = norm(x);
    // Số phải đứng riêng: "4" không khớp "14".
    return /^\d+$/.test(n) ? new RegExp(`(^|\\D)${n}(\\D|$)`).test(a) : a.includes(n);
  });
}

export function missionById(id: string): Mission | undefined {
  return [...MISSIONS, ...BOSSES].find((m) => m.id === id);
}

/** Thử thách cuối tuần mở vào Thứ 7 và Chủ nhật. */
export function bossOpen(d = new Date()): boolean {
  const w = d.getDay();
  return w === 0 || w === 6;
}

/** Thử thách của tuần này (xoay vòng theo số tuần). */
export function weeklyBoss(d = new Date()): Mission {
  const week = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000 + 3) / 7);
  return BOSSES[week % BOSSES.length];
}

/** Gói thông tin bí mật + tâm trạng thành chỉ dẫn cho AI. */
export function secretFor(m: Mission): string {
  return m.facts.map((f) => f.en).join(" ") + (m.boss ? ` Mood: ${m.boss.mood}` : "");
}

/** Sao: nộp đúng hết lần đầu = 3, lần hai = 2, sau đó = 1. */
export function starsFor(tries: number): number {
  return tries <= 1 ? 3 : tries === 2 ? 2 : 1;
}
