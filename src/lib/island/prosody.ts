// Nhịp điệu câu cho "Nói đuổi": từ nào nhấn (từ nội dung), từ nào đọc lướt (từ chức năng), chỗ nào nối âm.
// Quy tắc thô nhưng đúng phần lớn câu giao tiếp ngắn. File thuần.

const FUNCTION_WORDS = new Set(
  "a an the and or but so to of in on at for from with by as is am are was were be been do does did have has had can could will would shall should may might must i you he she it we they me him her us them my your his its our their this that these those there some any not just than then if when what who where how 's 're 've 'll 'd n't".split(" "),
);

export interface ProsodyWord {
  text: string;
  /** Từ nội dung: đọc to, rõ, dài hơn. */
  stress: boolean;
  /** Nối âm với từ sau (phụ âm cuối + nguyên âm đầu): "an‿apple". */
  link: boolean;
}

const bare = (w: string) => w.toLowerCase().replace(/[^a-z']/g, "");

export function prosody(sentence: string): ProsodyWord[] {
  const words = sentence.split(/\s+/).filter(Boolean);
  return words.map((text, i) => {
    const b = bare(text);
    const stress = !!b && !FUNCTION_WORDS.has(b) && !FUNCTION_WORDS.has(b.replace(/'.*$/, "")) && b.length > 1;
    const next = words[i + 1] ? bare(words[i + 1]) : "";
    // Không nối qua dấu câu.
    const endsClean = /[a-z]$/i.test(text);
    const link = endsClean && /[bcdfgklmnprstvxz]$/.test(b) && /^[aeiou]/.test(next) && !/^(u[nst]|one)/.test(next);
    return { text, stress, link };
  });
}
