/**
 * src/stepQuality.js — Prompt 28 A3: máy kiểm chất lượng các bậc câu hỏi do AI soạn.
 * Phát hiện: bậc chung chung (dùng được cho mọi đề), bậc lặp nguyên câu hỏi của đề,
 * bài 2 phép tính mà thiếu bậc. Không gọi AI; chỉ chỉ ra bậc cần soạn lại.
 */

const STOP = new Set([
  'con', 'các', 'của', 'là', 'và', 'thì', 'mà', 'có', 'không', 'được', 'cho', 'một', 'những', 'này', 'đó',
  'nào', 'gì', 'bao', 'nhiêu', 'mấy', 'hỏi', 'nhé', 'nhỉ', 'nha', 'xem', 'thử', 'hãy', 'ra', 'vào', 'với',
  'lại', 'đi', 'đã', 'sẽ', 'đang', 'bài', 'đề', 'toán', 'câu', 'số', 'như', 'thế', 'mình', 'em', 'bạn',
  'ở', 'trong', 'trên', 'dưới', 'khi', 'nếu', 'để', 'vì', 'sao', 'phép', 'tính', 'bằng', 'tất', 'cả',
  'còn', 'mẹ', 'bố', 'ạ', 'ơi', 'hả', 'biết', 'tìm', 'làm', 'nói', 'đọc', 'kết', 'quả', 'ban', 'đầu',
])

const GENERIC_PATTERNS = [
  /đề\s*(bài)?\s*(cho|đã cho)\s*(ta|mình|con)?\s*biết\s*(những\s*)?(gì|điều gì|số nào|những gì)/i,
  /(đề\s*(bài)?|bài\s*toán)\s*(hỏi|yêu cầu)\s*(gì|điều gì|mình làm gì)/i,
  /cho\s*biết\s*gì\s*(và|,)\s*hỏi\s*gì/i,
  /^\s*(con\s*)?(hãy\s*)?đọc\s*(lại|kỹ|to)?\s*(đề|bài)(\s*bài)?\s*(xem|nhé|nha|nào|đi)?/i,
  /^\s*con\s*(thử\s*)?(nghĩ|suy nghĩ)\s*(xem|thêm)?\s*(nào|nhé|nha)?\s*[?.!]?\s*$/i,
  /con\s*thấy\s*(đề|bài)\s*(bài|toán)?\s*(này)?\s*(thế nào|ra sao)/i,
]

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[“”"'‘’.,!?;:()[\]{}…\-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function words(s) {
  return norm(s).split(' ').filter(Boolean)
}

function contentWords(s) {
  return words(s).filter((w) => !STOP.has(w) && (w.length >= 2 || /\d/.test(w)))
}

/** Câu hỏi của đề: câu bắt đầu bằng "Hỏi" hoặc kết thúc bằng "?" (lấy câu cuối cùng) */
export function extractProblemQuestion(ocr) {
  const text = String(ocr || '').trim()
  if (!text) return ''
  const parts = text.split(/(?<=[.?!])\s+/).map((x) => x.trim()).filter(Boolean)
  const hoi = parts.filter((x) => /^hỏi\b/i.test(x) || /\?$/.test(x))
  return hoi.length ? hoi[hoi.length - 1] : ''
}

/** Đếm sơ bộ số phép tính của bài toán lời văn (0, 1, 2 hoặc 3) dựa trên số lượng số trong đề */
export function estimateOperationCount(ocr) {
  const t = String(ocr || '').toLowerCase()
  const nums = (t.match(/\d+(?:[.,]\d+)?/g) || []).length
  if (nums === 0) return 0
  if (nums <= 2) return 1
  return nums >= 4 ? 3 : 2
}

/** Câu hỏi chung chung: khớp mẫu "đề cho biết gì, hỏi gì", hoặc không nhắc số/sự vật nào của đề */
export function isGenericQuestion(q, ocr) {
  const question = String(q || '').trim()
  if (!question) return true
  if (GENERIC_PATTERNS.some((re) => re.test(question))) return true
  const probWords = new Set(contentWords(ocr))
  if (probWords.size === 0) return false
  const qWords = contentWords(question)
  const hasNumber = /\d/.test(question)
  const overlap = qWords.filter((w) => probWords.has(w)).length
  return !hasNumber && overlap === 0
}

/** Bậc lặp gần nguyên câu hỏi của đề (bỏ chữ "Hỏi") */
export function repeatsProblemQuestion(q, ocr) {
  const pq = extractProblemQuestion(ocr).replace(/^hỏi\s*/i, '')
  if (!pq) return false
  const a = new Set(words(pq).filter((w) => w !== 'con'))
  const b = new Set(words(q).filter((w) => w !== 'con'))
  if (a.size < 3 || b.size === 0) return false
  let inter = 0
  for (const w of b) if (a.has(w)) inter++
  const union = new Set([...a, ...b]).size
  return inter / union >= 0.6
}

/**
 * auditSteps(cacBac, ocr, mon) → { issues: [{ idx, kind, text }], minSteps, ok }
 * kind: 'generic' | 'repeat_question' | 'missing_steps'
 */
export function auditSteps(cacBac = [], ocr = '', mon = 'Toán') {
  const steps = Array.isArray(cacBac) ? cacBac : []
  const issues = []
  const isMath = !mon || /toán/i.test(mon)
  steps.forEach((b, idx) => {
    const q = b?.cau_hoi || b?.question || b?.q || ''
    if (isGenericQuestion(q, ocr)) {
      issues.push({ idx, kind: 'generic', text: `Bậc ${idx + 1} chung chung, không bám số và sự vật của đề` })
    } else if (repeatsProblemQuestion(q, ocr)) {
      issues.push({ idx, kind: 'repeat_question', text: `Bậc ${idx + 1} lặp lại câu hỏi của đề, phải hỏi phép tính cụ thể` })
    }
  })
  // Prompt 32 mục 6: bậc "chọn phép tính" không được nói hộ tên phép tính (trừ khi chữ đó có sẵn trong đề)
  const probLower = String(ocr || '').toLowerCase()
  steps.forEach((b, idx) => {
    const sk = b?.ky_nang || b?.skill
    if (sk !== 'chon_phep_tinh') return
    const q = String(b?.cau_hoi || b?.question || b?.q || '').toLowerCase()
    const named = (q.match(/(^|[^\p{L}])(cộng|trừ|nhân|chia)(?![\p{L}])/gu) || []).map((x) => x.replace(/[^\p{L}]/gu, ''))
    const leaks = named.filter((w) => !new RegExp(`(^|[^\\p{L}])${w}(?![\\p{L}])`, 'u').test(probLower))
    if (leaks.length && !issues.some((i) => i.idx === idx)) {
      issues.push({ idx, kind: 'names_operation', text: `Bậc ${idx + 1} là bậc chọn phép tính nhưng nói hộ chữ "${leaks[0]}"` })
    }
  })
  const exprOps = countSolutionOperations(steps)
  const ops = isMath ? Math.max(estimateOperationCount(ocr), exprOps) : 0
  const minSteps = ops >= 3 ? 5 : ops === 2 ? 4 : 3
  if (isMath && steps.length < minSteps) {
    issues.push({ idx: steps.length, kind: 'missing_steps', text: `Bài ${ops} phép tính cần ít nhất ${minSteps} bậc, hiện có ${steps.length}` })
  }
  // Mỗi phép tính của lời giải phải có ít nhất một bậc tính riêng
  const calcSteps = steps.filter(isCalcStep).length
  if (isMath && ops >= 1 && calcSteps < ops) {
    issues.push({ idx: steps.length, kind: 'missing_calc', text: `Lời giải có ${ops} phép tính nhưng chỉ có ${calcSteps} bậc tính, thiếu bậc tính cho phép còn lại` })
  }
  return { issues, minSteps, ops, ok: issues.length === 0 }
}

/** Bậc tính: kỹ năng tinh_toan, hoặc câu hỏi có "a phép b" / "bằng mấy" */
function isCalcStep(b) {
  const sk = b?.ky_nang || b?.skill
  if (sk === 'tinh_toan') return true
  const q = String(b?.cau_hoi || b?.question || b?.q || '')
  return /\d+\s*(nhân|chia|cộng|trừ|bớt|thêm|[×x:÷+\-−])\s*\d+/i.test(q) && /(bằng|còn|được|là)\s*(mấy|bao nhiêu)/i.test(q)
}

/** Đếm số phép tính khác nhau trong đáp án các bậc ("6 × 5 = 30", "30 − 8 = 22") */
export function countSolutionOperations(steps = []) {
  const seen = new Set()
  for (const b of steps) {
    const t = String(b?.dap_an_cho_me || b?.answerForParent || b?.answer || '')
    for (const m of t.matchAll(/(\d+(?:[.,]\d+)?)\s*([×xX*:÷/+\-−–])\s*(\d+(?:[.,]\d+)?)/g)) seen.add(`${m[1]}${m[2]}${m[3]}`)
  }
  return seen.size
}

/** Số lỗi để so sánh bản trước/sau khi sửa */
export function issueScore(audit) {
  return (audit?.issues || []).length
}

/**
 * Prompt 32 mục 2: đoán nhãn dạng bài từ chính đề đang đọc (khi chưa có dang_bai từ AI).
 * "Toán có lời văn · một phép trừ" | "… · hai bước tính" | "Phép tính" | "Tiếng Việt" | "Tiếng Anh"
 */
export function guessProblemType(text = '') {
  const t = String(text || '').trim()
  if (!t) return 'Toán có lời văn'
  const lower = t.toLowerCase()
  const enWords = (t.match(/\b(the|is|are|my|your|choose|what|this|name|answer)\b/gi) || []).length
  if (enWords >= 2) return 'Tiếng Anh'
  if (/(điền|chính tả|l hay n|s hay x|ch hay tr|gạch chân|từ ngữ|đặt câu|đoạn văn|bài đọc)/i.test(lower) && !/\d+\s*[+\-−×x:÷]\s*\d+/.test(lower)) return 'Tiếng Việt'
  const hasWords = /[a-zà-ỹđ]{3,}/i.test(lower.replace(/tính|đặt|kết quả/g, ''))
  if (!hasWords || /^\s*(tính|đặt tính)/i.test(lower)) return 'Phép tính'
  const ops = estimateOperationCount(t)
  if (ops >= 3) return 'Toán có lời văn · ba bước tính'
  if (ops === 2) return 'Toán có lời văn · hai bước tính'
  let op = ''
  if (/chia\s*(đều|cho|vào|thành)|mỗi\s+\S+\s+(có|được)\s+mấy/.test(lower)) op = 'chia'
  else if (/mỗi\s+\S+\s+(có\s+|được\s+|đựng\s+)?\d+/.test(lower)) op = 'nhân'
  else if (/(bớt|bán|cho bạn|cho em|cho anh|cho chị|còn lại|còn bao nhiêu|ăn|mất|hết|tặng|bay đi|rời|đi mất|ít hơn)/.test(lower)) op = 'trừ'
  else if (/(thêm|tất cả|cả hai|gộp|tổng|nhiều hơn|mua thêm|được thêm)/.test(lower)) op = 'cộng'
  return op ? `Toán có lời văn · một phép ${op}` : 'Toán có lời văn'
}
