/**
 * src/microStepLocal.js — Prompt 28 A4: "câu hỏi nhỏ hơn" khi con kẹt lần 2.
 * Khi máy chủ trả câu dự phòng chung (không gắn với bậc đang hỏi), app tự soạn câu nhỏ hơn
 * BÁM ĐÚNG bậc đang kẹt và số trong đề, theo kỹ năng của bậc (đọc hiểu, chọn phép tính, tính toán).
 * Không gọi AI.
 */
import { isGenericQuestion } from './step_quality.js'

const OPS = { '+': 'cong', '-': 'tru', '−': 'tru', '–': 'tru', '×': 'nhan', 'x': 'nhan', 'X': 'nhan', '*': 'nhan', ':': 'chia', '÷': 'chia', '/': 'chia' }
const UNIT_RE = '([a-zA-Zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]+(?:\\s[a-zA-Zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]+)?)'

/** Các dữ kiện "số + sự vật" trong đề, kèm cờ "mỗi …" */
export function extractFacts(problemText = '') {
  const text = String(problemText || '')
  const facts = []
  const eachRe = new RegExp(`mỗi\\s+([a-zA-Zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]+)\\s+(?:có\\s+|được\\s+|đựng\\s+)?(\\d+)\\s+${UNIT_RE}`, 'gi')
  let m
  while ((m = eachRe.exec(text))) {
    facts.push({ kind: 'each', group: m[1], num: m[2], unit: m[3].split(' ')[0] === 'quả' || m[3].split(' ')[0] === 'cái' || m[3].split(' ')[0] === 'con' ? m[3].split(' ').slice(0, 2).join(' ') : m[3].split(' ')[0] })
  }
  const numRe = new RegExp(`(\\d+)\\s+${UNIT_RE}`, 'gi')
  while ((m = numRe.exec(text))) {
    if (facts.some((f) => f.num === m[1])) continue
    const unitWords = m[2].split(' ')
    // "5 rổ trứng" → nhóm "rổ", sự vật "trứng"
    facts.push({ kind: 'count', num: m[1], unit: unitWords[0], thing: unitWords[1] || '' })
  }
  return facts
}

function opFromText(s = '') {
  const mm = String(s).match(/(\d+(?:[.,]\d+)?)\s*([+\-−–×xX*:÷/])\s*(\d+(?:[.,]\d+)?)/)
  if (!mm || !OPS[mm[2]]) return null
  return { a: mm[1], op: OPS[mm[2]], b: mm[3] }
}

/**
 * buildLocalMicroStep({ problemText, stepQuestion, stepAnswer, skill, microIndex, childName })
 * → { cau_hoi_nho, ly_do_cho_me, dap_an_cho_me, nguon: 'local' }
 */
export function buildLocalMicroStep({ problemText = '', stepQuestion = '', stepAnswer = '', skill = '', microIndex = 1, childName = 'Con' } = {}) {
  const facts = extractFacts(problemText)
  const idx = Math.max(0, (Number(microIndex) || 1) - 1)
  const sk = String(skill || '')
  const lowerProb = String(problemText || '').toLowerCase()
  const op = opFromText(stepAnswer) || opFromText(stepQuestion)
  let q = ''
  let why = ''

  if (sk === 'tinh_toan' && op) {
    const n = (x) => Number(String(x).replace(',', '.'))
    if (op.op === 'nhan') {
      q = idx === 0
        ? `${op.a} lấy ${op.b} lần nghĩa là cộng ${op.a} mấy lần?`
        : `Con đếm thêm từng ${op.a}: ${op.a}, ${n(op.a) * 2}… đến lần thứ ${op.b} là mấy?`
      why = 'Đổi phép nhân thành cộng lặp lại để con tự tính.'
    } else if (op.op === 'chia') {
      q = idx === 0
        ? `${op.b} nhân mấy thì bằng ${op.a}?`
        : `Con chia ${op.a} que tính thành ${op.b} nhóm đều nhau, mỗi nhóm mấy que?`
      why = 'Dùng bảng nhân để tìm thương.'
    } else if (op.op === 'tru') {
      q = idx === 0
        ? `Từ ${op.a}, con đếm lùi ${op.b} bước thì được số mấy?`
        : `${op.a} bớt đi ${op.b} thì còn nhiều hơn hay ít hơn ${op.a}?`
      why = 'Đếm lùi giúp con hình dung phép trừ.'
    } else if (op.op === 'cong') {
      q = idx === 0
        ? `Từ ${op.a}, con đếm thêm ${op.b} nữa thì được số mấy?`
        : `Gộp ${op.a} và ${op.b} lại thì nhiều hơn hay ít hơn ${op.a}?`
      why = 'Đếm thêm giúp con tự tìm tổng.'
    }
  } else if (sk === 'chon_phep_tinh' || sk === 'tinh_toan') {
    const each = facts.find((f) => f.kind === 'each')
    if (each && idx === 0) {
      q = `Các ${each.group} đều có ${each.num} ${each.unit} bằng nhau, mình gộp lại hay bớt đi?`
      why = 'Nhận ra các nhóm bằng nhau để chọn phép nhân.'
    } else if (/chia đều|chia cho|chia vào|chia thành/.test(lowerProb)) {
      q = 'Chia đều thì mỗi phần nhận bằng nhau, mình làm phép gì?'
      why = 'Gắn "chia đều" với phép chia.'
    } else if (/hết|bớt|cho bạn|bán|ăn|còn lại|mất|tặng/.test(lowerProb)) {
      q = 'Bớt đi thì số còn lại nhiều hơn hay ít hơn lúc đầu?'
      why = 'Gắn hành động "bớt đi" với phép trừ.'
    } else if (/thêm|mua thêm|tất cả|cả hai|gộp/.test(lowerProb)) {
      q = 'Thêm vào thì số mới nhiều hơn hay ít hơn lúc đầu?'
      why = 'Gắn hành động "thêm vào" với phép cộng.'
    }
  }

  if (!q && facts.length) {
    // Đọc hiểu (hoặc chưa rõ kỹ năng): hỏi đúng một dữ kiện của đề
    const ordered = [...facts.filter((f) => f.kind === 'each'), ...facts.filter((f) => f.kind !== 'each')]
    const f = ordered[idx % ordered.length]
    if (f.kind === 'each') {
      q = `Mỗi ${f.group} có mấy ${f.unit}?`
    } else {
      q = `Có mấy ${f.unit}${f.thing ? ' ' + f.thing : ''}?`
    }
    why = 'Tách một dữ kiện nhỏ trong đề để con nắm chắc trước.'
  }

  if (!q) {
    const bySkill = {
      doc_hieu_de: 'Con chỉ vào con số đầu tiên trong đề, số đó nói về cái gì?',
      doc_hieu: 'Con tìm trong đề câu nói về chuyện này, câu đó viết gì?',
      chon_phep_tinh: 'Ở bước này mình thêm vào hay bớt đi?',
      tinh_toan: 'Con dùng que tính làm thử phép tính này xem được mấy?',
      don_vi: 'Đáp số này đếm cái gì, mình ghi đơn vị là gì?',
      kiem_tra_lai: 'Con thử làm ngược lại xem có ra số ban đầu không?',
    }
    q = bySkill[sk] || 'Con nói to bước con đang làm, mình xem tiếp nhé?'
    why = 'Câu nhỏ theo đúng kỹ năng của bậc này.'
  }

  return {
    cau_hoi_nho: q,
    ly_do_cho_me: why,
    dap_an_cho_me: stepAnswer || '',
    micro_index: microIndex,
    nguon: 'local',
    child_name: childName,
  }
}

/** Câu máy chủ trả về có thật sự gắn với bài này không (không phải câu dự phòng chung) */
export function isServerMicroStepGeneric(microStep, problemText = '') {
  const q = microStep?.cau_hoi_nho || microStep?.question || ''
  if (!q) return true
  if (microStep?.is_fallback || microStep?.fallback || microStep?.source === 'fallback') return true
  return isGenericQuestion(q, problemText)
}
