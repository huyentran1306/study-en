// "Hồ sơ của tôi": thay tên / quê / nghề / sở thích mẫu trong bài (Bơ, Lan, Da Nang, designer, cooking)
// bằng thông tin thật của người học, để luyện đúng những câu sẽ nói ngoài đời.
// File thuần (không "use client") — chỉ biến đổi chuỗi lúc hiển thị, không đổi khoá lưu trữ.
import type { Profile } from "./state";

export type { Profile } from "./state";

/** Bỏ ký tự có thể làm hỏng JSON / HTML; cắt ngắn. */
export function cleanField(v: string, max = 60): string {
  return v.replace(/["\\\u0000-\u001f<>{}]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function withArticle(job: string): string {
  const j = job.trim().replace(/^(a|an|the)\s+/i, "");
  if (!j) return "";
  return `${/^[aeiou]/i.test(j) ? "an" : "a"} ${j}`;
}

export function hasProfile(p?: Profile | null): p is Profile {
  return !!p && !!(p.name || p.hometown || p.job || p.hobby);
}

/** Thay thông tin mẫu trong một chuỗi (tiếng Anh lẫn phần dịch tiếng Việt). */
export function personalize(text: string, p?: Profile | null): string {
  if (!hasProfile(p)) return text;
  let s = text;
  if (p.name) s = s.replace(/Lan Tran/g, p.name).replace(/\bLan\b/g, p.name).replace(/Bơ/g, p.name);
  if (p.hometown) s = s.replace(/Da Nang/g, p.hometown).replace(/Đà Nẵng/g, p.hometown);
  if (p.job) {
    const job = p.job.replace(/^(a|an|the)\s+/i, "");
    s = s.replace(/\ban? designer\b/g, withArticle(job)).replace(/\bdesigner\b/g, job).replace(/nhà thiết kế/g, p.jobVi || job);
  }
  if (p.hobby) s = s.replace(/My hobby is cooking/g, `My hobby is ${p.hobby}`).replace(/Sở thích của mình là nấu ăn/g, `Sở thích của mình là ${p.hobbyVi || p.hobby}`);
  return s;
}

/** Thay thông tin mẫu trong cả một cấu trúc dữ liệu (chương, câu hỏi phản xạ...). */
export function personalizeDeep<T>(data: T, p?: Profile | null): T {
  if (!hasProfile(p)) return data;
  try {
    return JSON.parse(personalize(JSON.stringify(data), p)) as T;
  } catch {
    return data;
  }
}

/** Các câu "nói về tôi" sinh từ hồ sơ — đưa vào Sổ câu để ôn. */
export function mePhrases(p: Profile): { en: string; vi: string }[] {
  const out: { en: string; vi: string }[] = [];
  if (p.name) {
    out.push({ en: `Hi, I'm ${p.name}. Nice to meet you.`, vi: `Chào, mình là ${p.name}. Rất vui được gặp bạn.` });
    out.push({ en: `Hi, this is ${p.name}.`, vi: `(Gọi điện) Chào, mình là ${p.name} đây.` });
  }
  if (p.hometown) {
    out.push({ en: `I'm from ${p.hometown}.`, vi: `Mình đến từ ${p.hometown}.` });
    out.push({ en: `My hometown is ${p.hometown}.`, vi: `Quê mình ở ${p.hometown}.` });
  }
  if (p.job) {
    out.push({ en: `I work as ${withArticle(p.job)}.`, vi: `Mình làm nghề ${p.jobVi || p.job}.` });
    out.push({ en: `I've worked as ${withArticle(p.job)} for a few years.`, vi: `Mình làm ${p.jobVi || p.job} được vài năm rồi.` });
  }
  if (p.hobby) {
    out.push({ en: `My hobby is ${p.hobby}.`, vi: `Sở thích của mình là ${p.hobbyVi || p.hobby}.` });
    out.push({ en: `In my free time, I like ${p.hobby}.`, vi: `Lúc rảnh mình thích ${p.hobbyVi || p.hobby}.` });
    out.push({ en: `I'm really into ${p.hobby}. What about you?`, vi: `Mình rất mê ${p.hobbyVi || p.hobby}. Còn bạn thì sao?` });
  }
  return out;
}

/** Mô tả ngắn về người học để đưa cho AI đóng vai cư dân. */
export function aboutLearner(p?: Profile | null): string {
  if (!hasProfile(p)) return "";
  const bits: string[] = [];
  if (p.name) bits.push(`name: ${p.name}`);
  if (p.hometown) bits.push(`from: ${p.hometown}`);
  if (p.job) bits.push(`job: ${p.job}`);
  if (p.hobby) bits.push(`hobby: ${p.hobby}`);
  return bits.join("; ");
}

/** Các từ riêng (tên, quê) mà máy nhận giọng tiếng Anh hay nghe sai — khi chấm sẽ không bắt lỗi. */
export function lenientWords(p?: Profile | null): string[] {
  if (!hasProfile(p)) return [];
  return `${p.name} ${p.hometown}`.split(/\s+/).filter(Boolean);
}
