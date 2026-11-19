// Đảo Lễ Hội: mở theo mùa (Halloween, Giáng sinh, Tết, Trung thu). Mỗi mùa: 10 từ + 3 lời chúc để nói.
export type FestId = "halloween" | "christmas" | "tet" | "midautumn";

export interface Festival {
  id: FestId;
  name: string;
  en: string;
  words: { en: string; vi: string }[];
  phrases: { en: string; vi: string }[];
}

export const FESTIVALS: Festival[] = [
  {
    id: "christmas",
    name: "Giáng sinh",
    en: "Christmas",
    words: [
      { en: "Christmas tree", vi: "cây thông Noel" },
      { en: "present", vi: "món quà" },
      { en: "Santa Claus", vi: "ông già Noel" },
      { en: "snowman", vi: "người tuyết" },
      { en: "reindeer", vi: "tuần lộc" },
      { en: "stocking", vi: "chiếc tất treo quà" },
      { en: "ornament", vi: "đồ trang trí cây thông" },
      { en: "carol", vi: "bài hát mừng Giáng sinh" },
      { en: "wrapping paper", vi: "giấy gói quà" },
      { en: "Christmas Eve", vi: "đêm Giáng sinh" },
    ],
    phrases: [
      { en: "Merry Christmas and a happy New Year!", vi: "Giáng sinh vui vẻ và năm mới hạnh phúc!" },
      { en: "What are you doing for Christmas?", vi: "Giáng sinh này bạn làm gì?" },
      { en: "Thank you for the lovely present!", vi: "Cảm ơn bạn vì món quà thật dễ thương!" },
    ],
  },
  {
    id: "tet",
    name: "Tết Nguyên Đán",
    en: "Lunar New Year",
    words: [
      { en: "Lunar New Year", vi: "Tết Nguyên Đán" },
      { en: "lucky money", vi: "tiền lì xì" },
      { en: "red envelope", vi: "bao lì xì" },
      { en: "peach blossom", vi: "hoa đào" },
      { en: "apricot blossom", vi: "hoa mai" },
      { en: "fireworks", vi: "pháo hoa" },
      { en: "family reunion", vi: "đoàn tụ gia đình" },
      { en: "sticky rice cake", vi: "bánh chưng" },
      { en: "New Year's Eve", vi: "đêm giao thừa" },
      { en: "wish", vi: "lời chúc" },
    ],
    phrases: [
      { en: "Happy Lunar New Year!", vi: "Chúc mừng năm mới!" },
      { en: "I wish you good health and lots of luck.", vi: "Chúc bạn nhiều sức khoẻ và may mắn." },
      { en: "We visit our grandparents during Tet.", vi: "Dịp Tết nhà mình đi thăm ông bà." },
    ],
  },
  {
    id: "halloween",
    name: "Halloween",
    en: "Halloween",
    words: [
      { en: "pumpkin", vi: "quả bí ngô" },
      { en: "costume", vi: "bộ hoá trang" },
      { en: "ghost", vi: "con ma" },
      { en: "witch", vi: "phù thuỷ" },
      { en: "bat", vi: "con dơi" },
      { en: "candy", vi: "kẹo" },
      { en: "trick or treat", vi: "cho kẹo hay bị ghẹo" },
      { en: "spooky", vi: "rùng rợn" },
      { en: "haunted house", vi: "nhà ma" },
      { en: "jack-o'-lantern", vi: "đèn bí ngô" },
    ],
    phrases: [
      { en: "Trick or treat!", vi: "Cho kẹo hay bị ghẹo!" },
      { en: "What are you dressing up as?", vi: "Bạn hoá trang thành gì?" },
      { en: "Your costume is so cool!", vi: "Bộ hoá trang của bạn ngầu quá!" },
    ],
  },
  {
    id: "midautumn",
    name: "Tết Trung thu",
    en: "Mid-Autumn Festival",
    words: [
      { en: "Mid-Autumn Festival", vi: "Tết Trung thu" },
      { en: "mooncake", vi: "bánh trung thu" },
      { en: "lantern", vi: "đèn lồng" },
      { en: "full moon", vi: "trăng rằm" },
      { en: "lion dance", vi: "múa lân" },
      { en: "star lantern", vi: "đèn ông sao" },
      { en: "harvest", vi: "mùa gặt" },
      { en: "celebrate", vi: "ăn mừng" },
      { en: "parade", vi: "đoàn rước đèn" },
      { en: "tea", vi: "trà" },
    ],
    phrases: [
      { en: "Happy Mid-Autumn Festival!", vi: "Trung thu vui vẻ!" },
      { en: "Would you like some mooncake?", vi: "Bạn ăn bánh trung thu không?" },
      { en: "The moon is so bright tonight!", vi: "Trăng đêm nay sáng quá!" },
    ],
  },
];

/** Ngày Tết âm lịch và Trung thu (dương lịch) từng năm. */
const TET: Record<number, string> = { 2026: "2026-02-17", 2027: "2027-02-06", 2028: "2028-01-26", 2029: "2029-02-13", 2030: "2030-02-03", 2031: "2031-01-23" };
const MID: Record<number, string> = { 2026: "2026-09-25", 2027: "2027-09-15", 2028: "2028-10-03", 2029: "2029-09-22", 2030: "2030-09-12", 2031: "2031-10-01" };

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const shift = (day: string, n: number) => {
  const [y, m, d] = day.split("-").map(Number);
  return ymd(new Date(y, m - 1, d + n));
};

/** Các mùa lễ trong một năm: [bắt đầu, kết thúc] (yyyy-mm-dd, tính cả hai đầu). */
function windows(year: number): { id: FestId; year: number; from: string; to: string }[] {
  const out: { id: FestId; year: number; from: string; to: string }[] = [
    { id: "halloween", year, from: `${year}-10-15`, to: `${year}-11-05` },
    { id: "christmas", year, from: `${year}-11-15`, to: `${year + 1}-01-05` },
  ];
  if (TET[year]) out.push({ id: "tet", year, from: shift(TET[year], -21), to: shift(TET[year], 7) });
  if (MID[year]) out.push({ id: "midautumn", year, from: shift(MID[year], -14), to: shift(MID[year], 3) });
  return out;
}

export interface Season {
  fest: Festival;
  key: string;
  from: string;
  to: string;
}

const mk = (w: { id: FestId; year: number; from: string; to: string }): Season => ({ fest: FESTIVALS.find((f) => f.id === w.id)!, key: `${w.id}-${w.year}`, from: w.from, to: w.to });

/** Mùa lễ đang diễn ra (nếu có). */
export function activeSeason(day: string): Season | null {
  const y = Number(day.slice(0, 4));
  const all = [...windows(y - 1), ...windows(y)];
  const w = all.find((x) => x.from <= day && day <= x.to);
  return w ? mk(w) : null;
}

/** Mùa lễ sắp tới gần nhất. */
export function nextSeason(day: string): Season {
  const y = Number(day.slice(0, 4));
  const all = [...windows(y), ...windows(y + 1)].filter((x) => x.from > day).sort((a, b) => (a.from < b.from ? -1 : 1));
  return mk(all[0]);
}

export function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

/** Vỏ sò thưởng mỗi phần lễ hội (học từ, nói lời chúc). */
export const FEST_BONUS = 30;
