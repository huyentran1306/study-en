/**
 * chatSafety.js — Prompt 32 mục 1: "Hỏi thêm AI" an toàn và đọc được.
 * Dùng chung cho app (src/chatSafety.js) và Worker (src/chat_safety.js). Không gọi AI.
 *  - isAnswerRequest: nhận ra ý xin đáp án / giải hộ / cho con chép (luật trong code).
 *  - refusalReply: câu từ chối ấm áp + một câu hỏi gợi mở bám đúng bài đang học.
 *  - flattenJsonReply: nếu model trả chuỗi JSON thì lấy các trường chữ ghép thành câu.
 *  - hasBrokenVietnamese: phát hiện chữ vỡ dấu kiểu "hoỌc", "mề" ghép sai.
 */

const ANSWER_PATTERNS = [
  /(cho|đưa|ghi|nói|viết|gửi|bảo)\s+(con|bé|cháu|mình|mẹ|bố|tôi|em)?\s*(cái\s+)?(đáp\s*án|đáp\s*số|kết\s*quả|lời\s*giải|bài\s*giải)/i,
  /(đáp\s*án|đáp\s*số|kết\s*quả)\s*(của\s+)?(bài|câu|phép)?\s*(này|đó|kia)?\s*(là\s*)?(bao\s*nhiêu|mấy|gì|là\s*số\s*mấy)/i,
  /(giải|làm)\s+(hộ|giùm|giúp|dùm|luôn)/i,
  /(giải|làm)\s+(bài|câu)\s+(này|đó)\s+(hộ|giùm|giúp|dùm|luôn|cho)/i,
  /(cho|để)\s+(con|bé|cháu)\s+chép/i,
  /chép\s+(lại|vào|luôn)?\s*(đáp|kết|lời)/i,
  /ghi\s+(luôn|sẵn)\s+(số|kết\s*quả|đáp)/i,
  /(bằng|ra)\s+(bao\s*nhiêu|mấy)\s*(vậy|thế|ạ)?\s*\??\s*$/i,
  /\b(answer|solve it|give me the answer)\b/i,
]

export function isAnswerRequest(text = '') {
  const t = String(text || '').trim()
  if (!t) return false
  return ANSWER_PATTERNS.some((re) => re.test(t))
}

/**
 * Câu từ chối + câu hỏi gợi mở. `hintQuestion` là câu bám đúng bài đang học (app tạo từ các bậc của bài).
 * Không có thì dùng câu chung, không chứa số.
 */
export function refusalReply({ hintQuestion = '', ho = 'bố mẹ', childName = 'con' } = {}) {
  const Ho = String(ho || 'bố mẹ').charAt(0).toUpperCase() + String(ho || 'bố mẹ').slice(1)
  const q = String(hintQuestion || '').trim()
  const ask = q
    ? `${Ho} thử hỏi ${childName === 'con' ? 'con' : childName}: "${q.replace(/^["“]|["”]$/g, '')}"`
    : `${Ho} thử hỏi con: "Đề bài cho mình biết những gì, và mình cần tìm gì?"`
  return `Gấu không đưa đáp số để con chép đâu ạ, con tự tìm ra thì mới nhớ lâu. ${ask}`
}

function collectStrings(v, out) {
  if (v == null) return
  if (typeof v === 'string') {
    const s = v.trim()
    if (!s) return
    // bỏ giá trị kiểu mã: bat_dau_bang_cau_hoi, CPA
    if (/^[a-z0-9]+(_[a-z0-9]+)+$/i.test(s)) {
      if (s.split('_').length >= 4) out.push(s.replace(/_/g, ' '))
      return
    }
    out.push(s)
  } else if (Array.isArray(v)) {
    v.forEach((x) => collectStrings(x, out))
  } else if (typeof v === 'object') {
    Object.values(v).forEach((x) => collectStrings(x, out))
  }
}

/** Nếu `text` là (hoặc chứa) JSON thì ghép các trường chữ thành câu; luôn bỏ dấu { } " _ thô. */
export function flattenJsonReply(text = '') {
  let s = String(text || '').trim()
  if (!s) return ''
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) s = fence[1].trim()
  const a = s.indexOf('{')
  const b = s.lastIndexOf('}')
  if (a >= 0 && b > a) {
    try {
      const obj = JSON.parse(s.slice(a, b + 1))
      const parts = []
      collectStrings(obj, parts)
      const joined = parts
        .map((p) => p.replace(/\s+/g, ' ').trim())
        .filter((p) => p.length > 3 && !/^\d+$/.test(p))
        .map((p) => (/[.!?…]$/.test(p) ? p : p + '.'))
        .join(' ')
      if (joined) s = (s.slice(0, a) + ' ' + joined + ' ' + s.slice(b + 1)).trim()
    } catch (_) {
      // không phải JSON hợp lệ: bỏ ký tự thô bên dưới
    }
  }
  return s
    .replace(/[{}[\]"`]/g, '')
    .replace(/([a-zà-ỹđ])_([a-zà-ỹđ])/gi, '$1 $2')
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** Chữ hoa nằm giữa từ ("hoỌc"), dấu thanh rời, hoặc âm tiết bị tách ("Bắ c") → coi là vỡ dấu */
export function hasBrokenVietnamese(text = '') {
  const s = String(text || '').normalize('NFC')
  const isUpper = (c) => c !== c.toLowerCase() && c === c.toUpperCase()
  const isLower = (c) => c !== c.toUpperCase() && c === c.toLowerCase()
  for (const w of s.split(/[^\p{L}]+/u)) {
    if (w.length < 3) continue
    const chars = [...w]
    const hasLower = chars.some(isLower)
    // chữ hoa nằm giữa một từ có chữ thường ("hoỌc", "thẤng"); bỏ qua từ viết hoa toàn bộ (CPA, SGK)
    if (hasLower && chars.slice(1).some(isUpper)) return true
  }
  // dấu thanh rời không gắn được vào chữ nào
  if (/[̀-ͯ]/.test(s)) return true
  // âm tiết bị tách đôi: phụ âm đứng một mình như "Bắ c", "vị t"
  if (/(^|\s)[bcdđghklmnpqrstvx](?=\s|[.,!?]|$)/u.test(s)) return true
  return false
}

/** Câu trả lời cuối cùng để hiện trong bong bóng: văn bản thường, không JSON thô */
export function cleanChatReply(text = '') {
  return flattenJsonReply(text)
}
