
export const SKILL_SAFE_QUESTIONS = {
  doc_hieu_de: "Con đọc lại đề xem bài toán cho biết gì và hỏi gì nào?",
  chon_phep_tinh: "Để tìm kết quả bước này, con nghĩ nên dùng phép cộng, trừ, nhân hay chia?",
  tinh_toan: "Con thử đặt tính hoặc tính nhẩm từng bước xem ra bao nhiêu nào?",
  don_vi: "Sau khi tính xong, đơn vị của kết quả bước này là gì con nhỉ?",
  viet_loi_giai: "Con hãy viết câu lời giải cho phép tính này nhé!",
  kiem_tra_lai: "Con thử kiểm tra lại xem kết quả bước này đã hợp lý chưa nào?",
  doc_hieu: "Con đọc kỹ lại đoạn văn để tìm chi tiết này nhé.",
  tu_vung: "Từ này có nghĩa là gì trong ngữ cảnh câu văn con nhỉ?",
  chinh_ta: "Con chú ý các nét chữ và dấu thanh để viết cho chuẩn nhé.",
  dat_cau: "Con hãy thử dùng từ này để đặt một câu hoàn chỉnh nào!",
  tu_vung_en: "Can you recall the meaning of this word?",
  ngu_phap: "Let's check the grammar rule for this sentence.",
  phat_am: "Listen carefully and practice saying this word out loud.",
  default: "Con thử nói cách suy nghĩ của con ở bước này nhé?",
};
/**
 * guard.js - Lõi An Toàn AI & Chặn Lộ Đáp Án (Prompt 14 · Đợt 4)
 * 
 * Các tính năng chính:
 * 1. viNumberWords(text): Chuẩn hóa và nhận diện số tiếng Việt từ 0 đến 10.000,
 *    xử lý các biến thể: "mốt", "tư", "lăm", "linh", "lẻ", "hăm".
 * 2. GUARD_RULES: Cấu hình quy tắc chặn lộ đáp án riêng cho từng prompt.
 * 3. checkAnswerLeak: Soát xét rò rỉ số hoặc cụm từ đáp án vào câu con thấy/nghe.
 * 4. validateAndGuard: Bộ chặn tích hợp retry và fallback, ghi nhật ký guard_log.
 */

// Bảng từ số đơn vị và thành phần trong tiếng Việt
export const VI_UNITS = {
  'không': 0,
  'một': 1, 'mốt': 1,
  'hai': 2,
  'ba': 3,
  'bốn': 4, 'tư': 4,
  'năm': 5, 'lăm': 5,
  'sáu': 6,
  'bảy': 7, 'bẩy': 7,
  'tám': 8,
  'chín': 9,
};

const VI_WORD_SET = new Set([
  'không', 'một', 'mốt', 'hai', 'hăm', 'ba', 'bốn', 'tư',
  'năm', 'lăm', 'sáu', 'bảy', 'bẩy', 'tám', 'chín',
  'mười', 'mươi', 'trăm', 'nghìn', 'ngàn', 'vạn', 'linh', 'lẻ'
]);

// Cụm từ thông dụng cần bảo vệ không bị chuyển thành số nhầm
export const PROTECTED_PHRASES = [
  'ba mẹ', 'ba má', 'cha mẹ', 'ba bề bốn bên',
  'năm nay', 'năm ngoái', 'năm tới', 'sang năm', 'mỗi năm', 'hằng năm', 'năm học',
  'ngày mốt', 'mốt thời trang', 'mốt mới',
  'bốn phương', 'tám chuyện'
];

// Regex Unicode phát hiện từ vựng số liên tiếp
const VI_WORD_REGEX = /(?<!\p{L})(?:không|một|mốt|hai|hăm|ba|bốn|tư|năm|lăm|sáu|bảy|bẩy|tám|chín|mười|mươi|trăm|nghìn|ngàn|vạn|linh|lẻ)(?:\s+(?:không|một|mốt|hai|hăm|ba|bốn|tư|năm|lăm|sáu|bảy|bẩy|tám|chín|mười|mươi|trăm|nghìn|ngàn|vạn|linh|lẻ))*(?!\p{L})/giu;

/**
 * Phân tích một cụm từ thuần số tiếng Việt (0 đến 10.000) thành số nguyên.
 * Trả về số nguyên hoặc null nếu không phải cụm từ số hợp lệ.
 */
export function parseViNumberPhrase(phrase) {
  if (!phrase || typeof phrase !== 'string') return null;
  const raw = phrase.trim().toLowerCase();
  if (!raw) return null;

  if (raw === 'mười nghìn' || raw === 'mười ngàn' || raw === 'một vạn') return 10000;
  if (raw === 'không') return 0;
  if (VI_UNITS[raw] !== undefined) return VI_UNITS[raw];
  if (raw === 'mười') return 10;
  if (raw === 'hai mươi' || raw === 'hăm') return 20;

  const tokens = raw.split(/\s+/);
  for (const t of tokens) {
    if (!VI_WORD_SET.has(t)) return null;
  }

  let thousands = 0;
  let hundreds = 0;
  let tens = 0;
  let units = 0;
  let curTokens = [...tokens];

  // 1. Phần nghìn / ngàn
  const ngIdx = curTokens.findIndex(t => t === 'nghìn' || t === 'ngàn');
  if (ngIdx > 0) {
    const leftThous = curTokens.slice(0, ngIdx).join(' ');
    const tVal = parseViNumberPhrase(leftThous);
    if (tVal !== null && tVal > 0 && tVal <= 9) {
      thousands = tVal * 1000;
      curTokens = curTokens.slice(ngIdx + 1);
    } else {
      return null;
    }
  }

  // 2. Phần trăm
  const trIdx = curTokens.findIndex(t => t === 'trăm');
  if (trIdx >= 0) {
    const leftHund = curTokens.slice(0, trIdx).join(' ');
    if (leftHund === 'không') {
      hundreds = 0;
    } else {
      const hVal = parseViNumberPhrase(leftHund);
      if (hVal !== null && hVal >= 1 && hVal <= 9) {
        hundreds = hVal * 100;
      } else {
        return null;
      }
    }
    curTokens = curTokens.slice(trIdx + 1);
  }

  // 3. Phần chục và đơn vị còn lại
  if (curTokens.length > 0) {
    if (curTokens[0] === 'linh' || curTokens[0] === 'lẻ') {
      if (curTokens.length === 2 && VI_UNITS[curTokens[1]] !== undefined) {
        units = VI_UNITS[curTokens[1]];
      } else {
        return null;
      }
    } else if (curTokens[0] === 'mười') {
      tens = 10;
      if (curTokens.length === 2 && VI_UNITS[curTokens[1]] !== undefined) {
        units = VI_UNITS[curTokens[1]];
      } else if (curTokens.length === 1) {
        units = 0;
      } else {
        return null;
      }
    } else {
      const mIdx = curTokens.findIndex(t => t === 'mươi');
      if (mIdx === 1) {
        const dVal = VI_UNITS[curTokens[0]];
        if (dVal !== undefined && dVal >= 2 && dVal <= 9) {
          tens = dVal * 10;
          if (curTokens.length === 3 && VI_UNITS[curTokens[2]] !== undefined) {
            units = VI_UNITS[curTokens[2]];
          } else if (curTokens.length === 2) {
            units = 0;
          } else {
            return null;
          }
        } else {
          return null;
        }
      } else if (curTokens[0] === 'hăm') {
        tens = 20;
        if (curTokens.length === 2 && VI_UNITS[curTokens[1]] !== undefined) {
          units = VI_UNITS[curTokens[1]];
        } else if (curTokens.length === 1) {
          units = 0;
        } else {
          return null;
        }
      } else if (curTokens.length === 2) {
        // Dạng nói tắt: "hai lăm" (25), "hai tư" (24), "hai mốt" (21), "ba lăm" (35), "bốn lăm" (45)
        const dVal = VI_UNITS[curTokens[0]];
        const uVal = VI_UNITS[curTokens[1]];
        if (dVal !== undefined && dVal >= 2 && dVal <= 9 && uVal !== undefined) {
          tens = dVal * 10;
          units = uVal;
        } else {
          return null;
        }
      } else if (curTokens.length === 1 && VI_UNITS[curTokens[0]] !== undefined) {
        units = VI_UNITS[curTokens[0]];
      } else {
        return null;
      }
    }
  }

  return thousands + hundreds + tens + units;
}

/**
 * viNumberWords(text): Chuẩn hóa chuỗi văn bản, biến các cụm số chữ tiếng Việt thành số dạng chữ số.
 * Hỗ trợ từ 0 đến 10.000.
 */
export function viNumberWords(text) {
  if (typeof text === 'number') {
    return numberToViWords(text);
  }
  if (!text || typeof text !== 'string') return text;

  // Bảo vệ các thành ngữ/từ ghép không phải số
  const protectedMatches = [];
  let safeText = text;
  PROTECTED_PHRASES.forEach((phrase) => {
    const reg = new RegExp(`(?<!\\p{L})${phrase}(?!\\p{L})`, 'giu');
    safeText = safeText.replace(reg, (match) => {
      const key = `__PROT_${protectedMatches.length}__`;
      protectedMatches.push({ key, original: match });
      return key;
    });
  });

  // Tìm và chuyển đổi các cụm từ số
  let converted = safeText.replace(VI_WORD_REGEX, (match) => {
    const parsed = parseViNumberPhrase(match);
    return parsed !== null ? String(parsed) : match;
  });

  // Khôi phục các cụm từ được bảo vệ
  protectedMatches.forEach(({ key, original }) => {
    converted = converted.replace(new RegExp(key, 'g'), original);
  });

  return converted;
}

// Chuyển số nguyên từ 0 - 10.000 thành chữ tiếng Việt chuẩn
export function numberToViWords(n) {
  if (typeof n !== 'number' || isNaN(n)) return '';
  n = Math.floor(n);
  if (n < 0 || n > 10000) return String(n);
  if (n === 10000) return 'mười nghìn';
  if (n === 0) return 'không';

  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  let res = [];

  const thousands = Math.floor(n / 1000);
  const remainder1 = n % 1000;
  if (thousands > 0) {
    res.push(digits[thousands] + ' nghìn');
  }

  const hundreds = Math.floor(remainder1 / 100);
  const remainder2 = remainder1 % 100;
  if (hundreds > 0 || (thousands > 0 && remainder2 > 0)) {
    res.push(digits[hundreds] + ' trăm');
  }

  const tens = Math.floor(remainder2 / 10);
  const units = remainder2 % 10;

  if (tens > 1) {
    res.push(digits[tens] + ' mươi');
    if (units === 1) res.push('mốt');
    else if (units === 4) res.push('tư');
    else if (units === 5) res.push('lăm');
    else if (units > 0) res.push(digits[units]);
  } else if (tens === 1) {
    res.push('mười');
    if (units === 5) res.push('lăm');
    else if (units > 0) res.push(digits[units]);
  } else if (tens === 0 && (thousands > 0 || hundreds > 0) && units > 0) {
    res.push('linh ' + (units === 4 ? 'tư' : digits[units]));
  } else if (tens === 0 && units > 0) {
    res.push(units === 4 ? 'tư' : digits[units]);
  }

  return res.join(' ');
}

viNumberWords.parse = parseViNumberPhrase;
viNumberWords.toWords = numberToViWords;

/**
 * Trích xuất tất cả số (dạng số nguyên) từ một đoạn văn bản hoặc mảng văn bản.
 */
export function extractNumbers(input) {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.flatMap(extractNumbers);
  }
  const str = String(input);
  const normalized = viNumberWords(str);
  const nums = new Set();
  (normalized.match(/\b\d+\b/g) || []).forEach((n) => nums.add(Number(n)));

  // Bắt các dạng số kèm đơn vị chữ trong tiếng Việt: "3 chục", "2 trăm", "1 tá"
  const chucRegex = /(\d+)\s*(?:chục|mươi)/gi;
  let m;
  while ((m = chucRegex.exec(str)) !== null) {
    const val = Number(m[1]);
    nums.add(val * 10);
    nums.add(val);
  }
  if (/(?:^|[^\d\p{L}])chục(?!\p{L})/iu.test(str)) nums.add(10);

  const tramRegex = /(\d+)\s*trăm/gi;
  while ((m = tramRegex.exec(str)) !== null) {
    const val = Number(m[1]);
    nums.add(val * 100);
    nums.add(val);
  }
  const nghinRegex = /(\d+)\s*(?:nghìn|ngàn)/gi;
  while ((m = nghinRegex.exec(str)) !== null) {
    const val = Number(m[1]);
    nums.add(val * 1000);
    nums.add(val);
  }
  if (/(?:^|[^\p{L}])tá(?!\p{L})/iu.test(str)) nums.add(12);

  return [...nums];
}

/**
 * Bảng cấu hình bộ chặn lộ đáp án (GUARD_RULES) theo đặc tả 1.1:
 * - answer: Các trường chứa đáp án
 * - child: Các trường con nghe/thấy được hoặc mẹ có thể đọc to
 * - allowedFrom: Nguồn dữ liệu số được phép xuất hiện (không tính là lộ)
 */
export const GUARD_RULES = {
  p3_explain: {
    answer: ["dap_an_cuoi_cho_me", "cac_bac[].dap_an_cho_me"],
    child: ["cac_bac[].cau_hoi", "cac_bac[].goi_y.*", "loi_khen", "cac_bac[].ly_do_cho_me"],
    allowedFrom: ["problem_text"],
  },
  p3_explain_v2: {
    answer: ['dap_an_cuoi_cho_me', 'cac_bac[].dap_an_cho_me'],
    child: ['cac_bac[].cau_hoi', 'cac_bac[].goi_y.*', 'loi_khen', 'cac_bac[].ly_do_cho_me'],
    allowedFrom: ['problem_text'],
  },
  p3_explain_v3: {
    answer: ['dap_an_cuoi_cho_me', 'cac_bac[].dap_an_cho_me'],
    child: ['cac_bac[].cau_hoi', 'cac_bac[].goi_y.*'],
    allowedFrom: ['problem_text'],
  },
  p3_fix_steps_v3: {
    answer: ['dap_an_cuoi_cho_me', 'cac_bac[].dap_an_cho_me'],
    child: ['cac_bac[].cau_hoi', 'cac_bac[].goi_y.*'],
    allowedFrom: ['problem_text'],
  },
  p3_extra_v3: {
    answer: ['cac_bac[].dap_an_cho_me', 'dap_an_cuoi_cho_me'],
    child: ['cac_bac[].ly_do_cho_me', 'bai_anh_em.de', 'tro_choi_5_phut', 'con_day_lai_me'],
    allowedFrom: ['problem_text'],
  },
  p14b_check_work: {
    answer: ['dap_an_dung_cho_me', 'gia_tri_dung_dong_sai'],
    child: ['cau_hoi_cho_con.muc_1', 'cau_hoi_cho_con.muc_2', 'loi_khen_cu_the'],
    allowedFrom: ['problem_text', 'child_lines'],
  },
  p14d_teach_back: {
    answer: ['dap_an_cuoi_cho_me', 'cac_bac[].dap_an_cho_me'],
    child: ['cau_hoi_them', 'loi_khen_cho_con'],
    allowedFrom: ['problem_text', 'transcript'],
  },
  p4_chat: {
    answer: ['dap_an'],
    child: ['cau_tra_loi', 'goi_y'],
    allowedFrom: ['problem_text'],
  },
  p6_practice: {
    answer: ['dap_an_cho_me'],
    child: ['cau_hoi', 'huong_dan'],
    allowedFrom: ['problem_text'],
  },
  p8_calm_phrase: {
    answer: [],
    child: ['cau_an_ui'],
    allowedFrom: [],
  },
};

/**
 * Danh sách câu an toàn dự phòng khi phát hiện lộ đáp án (fallback presets)
 */
export const DEFAULT_GUARD_FALLBACKS = {
  'cac_bac[].cau_hoi': 'Con thử nói cách làm bước này nhé?',
  'cac_bac[].goi_y.muc_1_do_vat': 'Con đếm xem có bao nhiêu nhóm đồ vật nào?',
  'cac_bac[].goi_y.muc_2_hinh_ve': 'Vẽ sơ đồ đoạn thẳng để dễ nhìn hơn nhé.',
  'cac_bac[].ly_do_cho_me': 'Hỏi gợi mở để con tự khám phá cách làm.',
  'loi_khen': 'Con làm rất tốt, cùng tiếp tục nào!',
  'cau_hoi_cho_con.muc_1': 'Con thử tính lại dòng này theo cách của con nhé?',
  'cau_hoi_cho_con.muc_2': 'Con dùng que tính hoặc kẹo để kiểm tra lại nhé.',
  'loi_khen_cu_the': 'Dòng đầu tiên con trình bày rất cẩn thận.',
  'cau_hoi_them': 'Vì sao con lại làm phép tính này hả con?',
  'loi_khen_cho_con': 'Con kể lại rất rõ ràng, mẹ rất vui!',
  'default': 'Con thử tự suy nghĩ và giải thích cho mẹ nghe nhé?',
};

function getFieldValues(obj, path) {
  if (!obj || typeof obj !== 'object') return [];
  const results = [];

  function traverse(cur, segments, curPath) {
    if (cur === null || cur === undefined) return;
    if (segments.length === 0) {
      if (typeof cur === 'string' || typeof cur === 'number') {
        results.push({ value: String(cur), path: curPath, parent: null, key: '' });
      }
      return;
    }

    const [head, ...tail] = segments;

    if (head.endsWith('[]')) {
      const prop = head.slice(0, -2);
      const arr = prop ? cur[prop] : cur;
      if (Array.isArray(arr)) {
        arr.forEach((item, idx) => {
          traverse(item, tail, `${curPath}${prop ? '.' + prop : ''}[${idx}]`);
        });
      }
    } else if (head === '*') {
      if (typeof cur === 'object') {
        Object.keys(cur).forEach((k) => {
          traverse(cur[k], tail, `${curPath}.${k}`);
        });
      }
    } else {
      if (tail.length === 0) {
        if (cur[head] !== undefined) {
          results.push({ value: String(cur[head]), path: `${curPath}.${head}`, parent: cur, key: head });
        }
      } else {
        traverse(cur[head], tail, `${curPath}.${head}`);
      }
    }
  }

  traverse(obj, path.split('.'), '');
  return results;
}

/**
 * checkAnswerLeak(promptId, data, context)
 * Kiểm tra xem data có làm lộ đáp án vào các trường con nghe/thấy được hay không.
 */
// Prompt 32 (sau deploy): câu hỏi đưa lựa chọn "nhiều lên hay ít đi" không phải lộ đáp án "ít đi".
// Cụm đáp án đứng cạnh "hay/hoặc" là một phương án con được chọn, không bị coi là lộ.
function isOfferedChoice(questionLower, phrase) {
  const esc = String(phrase).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(hay|hoặc)\\s+${esc}|${esc}\\s*,?\\s+(hay|hoặc)\\s`, "i").test(questionLower);
}

export function checkAnswerLeak(promptId, data, context = {}) {
  // Đợt 18 · Chặng 0.4: Bộ chặn cho p3_explain / p3_explain_v2 sửa đúng bậc, bớt bắt nhầm
  if (promptId === "p3_explain" || promptId === "p3_explain_v2" || promptId === "p3_explain_v3" || promptId === "p3_fix_steps_v3") {
    const problemText = String(context.problem_text || "");
    const allowedNumbers = new Set(extractNumbers(problemText));
    const problemLower = problemText.toLowerCase();

    const finalAnsNumbers = new Set(
      extractNumbers(data.dap_an_cuoi_cho_me || "").filter((n) => !allowedNumbers.has(n))
    );

    let rawSteps = Array.isArray(data.cac_bac) ? data.cac_bac : Array.isArray(data.steps) ? data.steps : [];
    if (rawSteps.length === 0) {
      const singleText = data.cau_hoi || (typeof data.cau_hoi_cho_con === 'string' ? data.cau_hoi_cho_con : data.cau_hoi_cho_con?.muc_1) || data.cau_hoi_them || data.text || '';
      if (singleText) {
        rawSteps = [{
          cau_hoi: singleText,
          dap_an_cho_me: data.dap_an_cuoi_cho_me || data.dap_an_cho_me || '',
        }];
      }
    }
    const steps = rawSteps;
    
    // Cụm từ đáp án ngắn (2-6 từ, hỗ trợ cả cụm có số)
    const answerPhrases = [];
    // Prompt 32: nhớ cụm từ đến từ đâu (-1 = đáp số cuối, i = đáp án bậc i) để bậc sau được nhắc kết quả bậc trước
    const answerPhraseSrc = [];
    [data.dap_an_cuoi_cho_me, ...(steps.map(s => s?.dap_an_cho_me || s?.answerForParent))].forEach((v, vi) => {
      const trimmed = String(v || "").trim().toLowerCase();
      if (!trimmed) return;
      const normTrimmed = viNumberWords(trimmed).toLowerCase();
      const words = trimmed.split(/\s+/);
      if (words.length >= 2 && words.length <= 6) {
        if (!problemLower.includes(trimmed)) {
          answerPhrases.push(trimmed);
          answerPhraseSrc.push(vi - 1);
        }
        if (normTrimmed !== trimmed && !problemLower.includes(normTrimmed)) {
          answerPhrases.push(normTrimmed);
          answerPhraseSrc.push(vi - 1);
        }
      }
    });
    const finalPhrases = new Set(answerPhrases.filter((_, k) => answerPhraseSrc[k] === -1));
    let leaked = false;
    const leakReasons = [];
    const leaks = [];

    // Prompt 31 (sửa gốc của 28 A3): kết quả trung gian của các bậc TRƯỚC được phép nhắc ở bậc sau
    // (ví dụ bậc 4 "Có 30 quả, làm bánh hết 8 quả…" sau khi bậc 3 tính ra 30). Trước đây coi là lộ đáp án
    // và thay cả câu bằng câu an toàn chung chung ("Để tìm kết quả bước này…") → câu hỏi nhạt hẳn.
    const earlierResults = new Set();
    steps.forEach((step, idx) => {
      if (!step || typeof step !== "object") return;
      const stepNo = idx + 1;
      const kyNang = step.ky_nang || null;

      const stepAnsText = step.dap_an_cho_me || step.answerForParent || "";
      const stepAnsNumbers = new Set(
        extractNumbers(stepAnsText).filter((n) => !allowedNumbers.has(n) && !earlierResults.has(n))
      );
      // Chỉ coi là lộ đáp án khi cau_hoi hoặc goi_y chứa đáp số cuối HOẶC kết quả của chính bậc đó
      const forbiddenForStep = new Set([...finalAnsNumbers, ...stepAnsNumbers]);
      // Đáp số cuối vẫn bị cấm, trừ khi nó đã là kết quả của một bậc trước
      earlierResults.forEach((n) => forbiddenForStep.delete(n));
      extractNumbers(stepAnsText).forEach((n) => { if (!finalAnsNumbers.has(n)) earlierResults.add(n); });

      const qText = step.cau_hoi || step.questionForChild || "";
      if (qText) {
        const normQ = viNumberWords(String(qText));
        forbiddenForStep.forEach((ansNum) => {
          const reg = new RegExp(`\\b${ansNum}\\b`);
          if (reg.test(normQ)) {
            leaked = true;
            leakReasons.push(`Bậc ${stepNo} lộ số đáp án ${ansNum} trong câu hỏi`);
            leaks.push({
              field: "cac_bac[].cau_hoi",
              path: `cac_bac[${idx}].cau_hoi`,
              parent: step,
              key: step.cau_hoi !== undefined ? "cau_hoi" : "questionForChild",
              step_idx: idx,
              step_no: stepNo,
              ky_nang: kyNang,
              illegalValue: String(ansNum),
              beforeText: qText,
            });
          }
        });

        // Prompt 32: bỏ qua cụm là đáp án của bậc TRƯỚC (kết quả trung gian), trừ khi nó cũng là đáp số cuối
        answerPhrases.filter((ph, k) => answerPhraseSrc[k] === -1 || answerPhraseSrc[k] >= idx || finalPhrases.has(ph)).forEach((phrase) => {
          if (normQ.toLowerCase().includes(phrase) && !isOfferedChoice(normQ.toLowerCase(), phrase)) {
            leaked = true;
            leakReasons.push(`Bậc ${stepNo} lộ cụm từ đáp án "${phrase}" trong câu hỏi`);
            leaks.push({
              field: "cac_bac[].cau_hoi",
              path: `cac_bac[${idx}].cau_hoi`,
              parent: step,
              key: step.cau_hoi !== undefined ? "cau_hoi" : "questionForChild",
              step_idx: idx,
              step_no: stepNo,
              ky_nang: kyNang,
              illegalValue: phrase,
              beforeText: qText,
            });
          }
        });
      }

      const h1Text = step.goi_y?.muc_1_do_vat || step.hintLevel1 || "";
      if (h1Text) {
        const normH1 = viNumberWords(String(h1Text));
        forbiddenForStep.forEach((ansNum) => {
          const reg = new RegExp(`\\b${ansNum}\\b`);
          if (reg.test(normH1)) {
            leaked = true;
            leakReasons.push(`Bậc ${stepNo} lộ số đáp án ${ansNum} trong gợi ý 1`);
            leaks.push({
              field: "cac_bac[].goi_y.muc_1_do_vat",
              path: `cac_bac[${idx}].goi_y.muc_1_do_vat`,
              parent: step.goi_y || step,
              key: step.goi_y ? "muc_1_do_vat" : "hintLevel1",
              step_idx: idx,
              step_no: stepNo,
              ky_nang: kyNang,
              illegalValue: String(ansNum),
              beforeText: h1Text,
            });
          }
        });
      }

      const h2Text = step.goi_y?.muc_2_hinh_ve || step.hintLevel2 || "";
      if (h2Text) {
        const normH2 = viNumberWords(String(h2Text));
        forbiddenForStep.forEach((ansNum) => {
          const reg = new RegExp(`\\b${ansNum}\\b`);
          if (reg.test(normH2)) {
            leaked = true;
            leakReasons.push(`Bậc ${stepNo} lộ số đáp án ${ansNum} trong gợi ý 2`);
            leaks.push({
              field: "cac_bac[].goi_y.muc_2_hinh_ve",
              path: `cac_bac[${idx}].goi_y.muc_2_hinh_ve`,
              parent: step.goi_y || step,
              key: step.goi_y ? "muc_2_hinh_ve" : "hintLevel2",
              step_idx: idx,
              step_no: stepNo,
              ky_nang: kyNang,
              illegalValue: String(ansNum),
              beforeText: h2Text,
            });
          }
        });
      }

      const lyDoText = step.ly_do_cho_me || "";
      if (lyDoText) {
        const normL = viNumberWords(String(lyDoText));
        forbiddenForStep.forEach((ansNum) => {
          const reg = new RegExp(`\\b${ansNum}\\b`);
          if (reg.test(normL)) {
            leaked = true;
            leakReasons.push(`Bậc ${stepNo} lộ số đáp án ${ansNum} trong lý do cho mẹ`);
            leaks.push({
              field: "cac_bac[].ly_do_cho_me",
              path: `cac_bac[${idx}].ly_do_cho_me`,
              parent: step,
              key: "ly_do_cho_me",
              step_idx: idx,
              step_no: stepNo,
              ky_nang: kyNang,
              illegalValue: String(ansNum),
              beforeText: lyDoText,
            });
          }
        });
      }
    });

    return { leaked, leakReasons, leaks };
  }

  // Đợt 23V: Bộ chặn cho p3_extra_v3 (ly_do_cho_me và bai_anh_em không được chứa đáp số bài gốc)
  if (promptId === "p3_extra_v3") {
    const problemText = String(context.problem_text || "");
    const allowedNumbers = new Set(extractNumbers(problemText));

    // Thu thập các số đáp án bị cấm
    const forbiddenNumbers = new Set(
      extractNumbers(context.final_answer || context.dap_an_cuoi_cho_me || "").filter((n) => !allowedNumbers.has(n))
    );
    // Tính nhẩm phép tính trong đề (vd: "15 - 6 = ?" -> đáp số 9)
    if (problemText) {
      const matchSub = problemText.match(/(\d+)\s*[-−]\s*(\d+)/);
      if (matchSub) {
        const a = parseInt(matchSub[1], 10);
        const b = parseInt(matchSub[2], 10);
        if (!isNaN(a) && !isNaN(b)) {
          const diff = a - b;
          if (!allowedNumbers.has(diff)) forbiddenNumbers.add(diff);
        }
      }
      const matchAdd = problemText.match(/(\d+)\s*\+\s*(\d+)/);
      if (matchAdd) {
        const a = parseInt(matchAdd[1], 10);
        const b = parseInt(matchAdd[2], 10);
        if (!isNaN(a) && !isNaN(b)) {
          const sum = a + b;
          if (!allowedNumbers.has(sum)) forbiddenNumbers.add(sum);
        }
      }
      const matchMul = problemText.match(/(\d+)\s*[x*×]\s*(\d+)/);
      if (matchMul) {
        const a = parseInt(matchMul[1], 10);
        const b = parseInt(matchMul[2], 10);
        if (!isNaN(a) && !isNaN(b)) {
          const prod = a * b;
          if (!allowedNumbers.has(prod)) forbiddenNumbers.add(prod);
        }
      }
    }

    let leaked = false;
    const leakReasons = [];
    const leaks = [];

    // 1. Kiểm tra ly_do_cho_me của từng bậc
    const steps = Array.isArray(data?.cac_bac) ? data.cac_bac : [];
    steps.forEach((step, idx) => {
      if (!step || typeof step !== "object") return;
      const lyDo = step.ly_do_cho_me || "";
      if (lyDo) {
        const normLyDo = viNumberWords(String(lyDo));
        forbiddenNumbers.forEach((ansNum) => {
          if (new RegExp(`\\b${ansNum}\\b`).test(normLyDo)) {
            leaked = true;
            leakReasons.push(`Lý do bậc ${idx + 1} chứa đáp số ${ansNum}`);
            leaks.push({
              field: "cac_bac[].ly_do_cho_me",
              path: `cac_bac[${idx}].ly_do_cho_me`,
              parent: step,
              key: "ly_do_cho_me",
              step_idx: idx,
              illegalValue: String(ansNum),
              beforeText: lyDo,
            });
            step.ly_do_cho_me = "Hỏi gợi mở để con tự khám phá cách làm.";
          }
        });
      }
    });

    // 2. Kiểm tra bai_anh_em
    const bro = data?.bai_anh_em;
    if (bro) {
      const broDe = typeof bro === "string" ? bro : (bro.de || bro.text || "");
      if (broDe) {
        const normBro = viNumberWords(String(broDe));
        forbiddenNumbers.forEach((ansNum) => {
          if (new RegExp(`\\b${ansNum}\\b`).test(normBro)) {
            leaked = true;
            leakReasons.push(`Bài anh em chứa đáp số ${ansNum} của bài gốc`);
            leaks.push({
              field: "bai_anh_em.de",
              path: "bai_anh_em.de",
              parent: bro,
              key: typeof bro === "object" && bro.de ? "de" : "text",
              illegalValue: String(ansNum),
              beforeText: broDe,
            });
            const safeReplacement = normBro.replace(new RegExp(`\\b${ansNum}\\b`, 'g'), String(ansNum + 2));
            if (typeof bro === "object") {
              bro.de = safeReplacement;
            } else {
              data.bai_anh_em = safeReplacement;
            }
          }
        });
      }
    }

    return { leaked, leakReasons, leaks, sanitizedData: data };
  }

  const rule = GUARD_RULES[promptId];
  if (!rule) return { leaked: false, leakReasons: [], leaks: [] };

  // 1. Tập hợp các số được phép từ allowedFrom
  const allowedNumbers = new Set();
  const allowedPhrases = [];

  rule.allowedFrom.forEach((srcKey) => {
    const srcVal = context[srcKey];
    if (srcVal) {
      extractNumbers(srcVal).forEach((num) => allowedNumbers.add(num));
      if (typeof srcVal === 'string') {
        allowedPhrases.push(srcVal.toLowerCase());
      } else if (Array.isArray(srcVal)) {
        srcVal.forEach(s => allowedPhrases.push(String(s).toLowerCase()));
      }
    }
  });

  // 2. Trích xuất đáp án từ các trường answer
  const answerNumbers = new Set();
  const answerPhrases = [];

  rule.answer.forEach((ansPath) => {
    const vals = getFieldValues(data, ansPath);
    vals.forEach(({ value }) => {
      extractNumbers(value).forEach((num) => {
        // Chỉ coi là đáp án cấm nếu số đó KHÔNG có trong nguồn allowedFrom
        if (!allowedNumbers.has(num)) {
          answerNumbers.add(num);
        }
      });

      // Nếu đáp án là cụm từ ngắn (2-4 từ, ví dụ "ít đi", "nhiều hơn", "chia đều")
      const trimmed = value.trim().toLowerCase();
      const words = trimmed.split(/\s+/);
      if (words.length >= 2 && words.length <= 4 && !/^\d+$/.test(words[0])) {
        // Kiểm tra xem cụm từ này đã có trong đề bài chưa
        const alreadyInAllowed = allowedPhrases.some(p => p.includes(trimmed));
        if (!alreadyInAllowed) {
          answerPhrases.push(trimmed);
        }
      }
    });
  });

  if (answerNumbers.size === 0 && answerPhrases.length === 0) {
    return { leaked: false, leakReasons: [], leaks: [] };
  }

  // 3. Quét các trường child con nghe/thấy được
  let leaked = false;
  const leakReasons = [];
  const leaks = [];

  rule.child.forEach((childPattern) => {
    const childFields = getFieldValues(data, childPattern);
    childFields.forEach((item) => {
      const rawText = item.value;
      const normalizedText = viNumberWords(rawText);

      // Kiểm tra rò rỉ số đáp án
      answerNumbers.forEach((ansNum) => {
        const numRegex = new RegExp(`\\b${ansNum}\\b`);
        if (numRegex.test(normalizedText)) {
          leaked = true;
          leakReasons.push(`Trường ${item.path || childPattern} lộ số đáp án ${ansNum}`);
          leaks.push({
            field: childPattern,
            path: item.path,
            parent: item.parent,
            key: item.key,
            illegalValue: String(ansNum),
            beforeText: rawText,
          });
        }
      });

      // Kiểm tra rò rỉ cụm từ đáp án
      answerPhrases.forEach((phrase) => {
        if (normalizedText.toLowerCase().includes(phrase)) {
          leaked = true;
          leakReasons.push(`Trường ${item.path || childPattern} lộ cụm từ đáp án "${phrase}"`);
          leaks.push({
            field: childPattern,
            path: item.path,
            parent: item.parent,
            key: item.key,
            illegalValue: phrase,
            beforeText: rawText,
          });
        }
      });
    });
  });

  return { leaked, leakReasons, leaks };
}

/**
 * Ghi lại nhật ký vào bảng guard_log
 */
export async function logGuardEvent(env, ctx, { familyId, sessionId, promptId, field, beforeText, afterText, outcome }) {
  if (!env || !env.DB) return;
  const sql = `
    INSERT INTO guard_log (family_id, session_id, prompt_id, field, before_text, after_text, outcome)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const task = env.DB.prepare(sql).bind(
    familyId || null,
    sessionId || null,
    promptId || '',
    (field || '').slice(0, 100),
    (beforeText || '').slice(0, 200),
    (afterText || '').slice(0, 200),
    outcome
  ).run().catch((e) => {
    console.warn('logGuardEvent error:', e?.message || e);
  });

  if (ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(task);
  } else {
    await task;
  }
}

/**
 * validateAndGuard(promptId, responseText, context, env, ctx)
 * Bộ chặn chính cho mọi prompt, xử lý retry và thay thế câu an toàn.
 */
export function validateAndGuard(promptId, responseText, context = {}, env = null, ctx = null) {
  if (!responseText) {
    return {
      response: responseText,
      guarded: false,
      validator: { status: 'Lỗi định dạng', detail: 'Phản hồi rỗng', timestamp: new Date().toISOString() },
    };
  }

  // 1. Phân tích cú pháp JSON
  let jsonStr = responseText.trim();
  const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) jsonStr = match[1];

  let data;
  try {
    data = JSON.parse(jsonStr);
  } catch (err) {
    return {
      response: responseText,
      guarded: true,
      error_code: 'AI_FORMAT',
      validator: {
        status: 'Lỗi định dạng',
        detail: 'Phản hồi không phải JSON hợp lệ: ' + (err?.message || ''),
        timestamp: new Date().toISOString(),
      },
    };
  }

  // 2. Kiểm tra tính hợp lệ cơ bản của schema
  if (promptId === 'p3_explain') {
    if (!Array.isArray(data.cac_bac) || data.cac_bac.length < 3) {
      return {
        response: responseText,
        guarded: true,
        error_code: 'AI_FORMAT',
        validator: {
          status: 'Lỗi định dạng',
          detail: 'Thiếu các bậc gợi mở (yêu cầu từ 3 bậc trở lên)',
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  // 3. Kiểm tra lộ đáp án theo GUARD_RULES
  const check = checkAnswerLeak(promptId, data, context);

  if (!check.leaked) {
    return {
      response: (promptId === 'p3_explain_v3' || promptId === 'p3_extra_v3' || promptId === 'p3_fix_steps_v3') ? JSON.stringify(data) : JSON.stringify(data, null, 2),
      data,
      guarded: false,
      validator: {
        status: 'Đạt',
        detail: 'Không phát hiện rò rỉ đáp án',
        timestamp: new Date().toISOString(),
      },
    };
  }

  // 4. Nếu có rò rỉ: áp dụng câu dự phòng an toàn (fallback)
  const fallbacks = DEFAULT_GUARD_FALLBACKS;

  check.leaks.forEach((leak) => {
    let fallbackText = '';
    if (leak.key === 'cau_hoi' || leak.key === 'questionForChild') {
      if (leak.ky_nang && SKILL_SAFE_QUESTIONS[leak.ky_nang]) {
        fallbackText = SKILL_SAFE_QUESTIONS[leak.ky_nang];
      } else {
        fallbackText = DEFAULT_GUARD_FALLBACKS['cac_bac[].cau_hoi'] || DEFAULT_GUARD_FALLBACKS.default;
      }
    } else if (leak.key === 'muc_1_do_vat' || leak.key === 'hintLevel1') {
      fallbackText = DEFAULT_GUARD_FALLBACKS['cac_bac[].goi_y.muc_1_do_vat'] || 'Con đếm xem có bao nhiêu nhóm đồ vật nào?';
    } else if (leak.key === 'muc_2_hinh_ve' || leak.key === 'hintLevel2') {
      fallbackText = DEFAULT_GUARD_FALLBACKS['cac_bac[].goi_y.muc_2_hinh_ve'] || 'Vẽ sơ đồ đoạn thẳng để dễ nhìn hơn nhé.';
    } else if (leak.key === 'ly_do_cho_me') {
      fallbackText = DEFAULT_GUARD_FALLBACKS['cac_bac[].ly_do_cho_me'] || 'Hỏi gợi mở để con tự khám phá cách làm.';
    } else {
      fallbackText = fallbacks[leak.field] || fallbacks[leak.path] || fallbacks['default'];
    }
    if (leak.parent && leak.key) {
      leak.parent[leak.key] = fallbackText;
    }
    // Ghi nhật ký vào guard_log nếu có env
    if (env) {
      logGuardEvent(env, ctx, {
        familyId: context.family_id || null,
        sessionId: context.session_id || null,
        promptId,
        field: leak.field,
        beforeText: leak.beforeText,
        afterText: fallbackText,
        outcome: 'fallback',
      });
    }
  });

  return {
    response: (promptId === 'p3_explain_v3' || promptId === 'p3_extra_v3' || promptId === 'p3_fix_steps_v3') ? JSON.stringify(data) : JSON.stringify(data, null, 2),
    data,
    guarded: true,
    validator: {
      status: 'Đã chặn',
      detail: check.leakReasons.join('; '),
      timestamp: new Date().toISOString(),
    },
  };
}
