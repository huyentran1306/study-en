// Vườn Nhiệm Vụ: cây của từng chương (tuần). File thuần.
export type PlantShape = "root" | "fruit" | "flower" | "tall";

export interface Plant {
  ch: number;
  en: string;
  article: string;
  vi: string;
  shape: PlantShape;
  color: string; // màu hoa / quả
  color2: string; // màu phụ (nhuỵ, đốm)
  say: { en: string; vi: string };
}

export const PLANTS: Plant[] = [
  { ch: 1, en: "carrot", article: "a", vi: "Cà rốt", shape: "root", color: "#F2913D", color2: "#6FAE4F", say: { en: "I grew a carrot! Carrots are good for your eyes.", vi: "Mình trồng được củ cà rốt! Cà rốt tốt cho mắt lắm." } },
  { ch: 2, en: "coffee plant", article: "a", vi: "Cây cà phê", shape: "fruit", color: "#C8553D", color2: "#7A2E22", say: { en: "Fresh coffee beans for Miso's café!", vi: "Hạt cà phê tươi cho quán của Miso!" } },
  { ch: 3, en: "tomato", article: "a", vi: "Cà chua", shape: "fruit", color: "#E8483A", color2: "#3F7A34", say: { en: "These tomatoes are red and juicy.", vi: "Mấy quả cà chua này đỏ và mọng nước." } },
  { ch: 4, en: "sunflower", article: "a", vi: "Hướng dương", shape: "tall", color: "#F2C14E", color2: "#7A5236", say: { en: "The sunflower always turns to the sun.", vi: "Hoa hướng dương luôn quay về phía mặt trời." } },
  { ch: 5, en: "lavender", article: "", vi: "Oải hương", shape: "flower", color: "#A98BE0", color2: "#7B5CC4", say: { en: "Lavender smells so nice and calm.", vi: "Oải hương thơm dịu và dễ chịu quá." } },
  { ch: 6, en: "strawberry", article: "a", vi: "Dâu tây", shape: "fruit", color: "#E8485A", color2: "#F7E07A", say: { en: "Sweet strawberries for dessert!", vi: "Dâu tây ngọt để làm món tráng miệng!" } },
  { ch: 7, en: "tulip", article: "a", vi: "Tulip", shape: "flower", color: "#F07AA0", color2: "#C94F7A", say: { en: "What a lovely pink tulip!", vi: "Bông tulip hồng xinh quá!" } },
  { ch: 8, en: "ginger", article: "", vi: "Gừng", shape: "root", color: "#D9B36C", color2: "#6FAE4F", say: { en: "Ginger tea helps when you have a sore throat.", vi: "Trà gừng giúp đỡ đau họng đấy." } },
  { ch: 9, en: "rose", article: "a", vi: "Hoa hồng", shape: "flower", color: "#E0475A", color2: "#A82F40", say: { en: "A red rose for a good friend.", vi: "Một bông hồng đỏ tặng người bạn tốt." } },
  { ch: 10, en: "pumpkin", article: "a", vi: "Bí ngô", shape: "fruit", color: "#F28C28", color2: "#3F7A34", say: { en: "Let's make pumpkin soup together!", vi: "Cùng nấu súp bí ngô nhé!" } },
  { ch: 11, en: "corn", article: "", vi: "Ngô", shape: "tall", color: "#F5D547", color2: "#9CC46A", say: { en: "The corn grew taller than me!", vi: "Cây ngô cao hơn cả mình rồi!" } },
  { ch: 12, en: "watermelon", article: "a", vi: "Dưa hấu", shape: "fruit", color: "#4E9F4A", color2: "#2F6B2C", say: { en: "A big watermelon for a hot summer day.", vi: "Một quả dưa hấu to cho ngày hè nóng nực." } },
  { ch: 13, en: "lotus", article: "a", vi: "Hoa sen", shape: "flower", color: "#F7A8C4", color2: "#F2C14E", say: { en: "The lotus blooms beautifully. You did it!", vi: "Hoa sen nở thật đẹp. Bạn làm được rồi!" } },
];

export const PLANT_BY_CH = Object.fromEntries(PLANTS.map((p) => [p.ch, p])) as Record<number, Plant>;
