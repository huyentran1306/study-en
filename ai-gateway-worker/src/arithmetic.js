/**
 * arithmetic.js - Máy kiểm tra phép tính (Prompt 14 · Phần A Mục 2.5)
 * 
 * Kiểm tra các phép tính trong bài làm của học sinh và lời giải chuẩn của AI:
 * - Hỗ trợ các toán tử: +, -, x, ×, *, :, /, ÷, ngoặc đơn ()
 * - Hỗ trợ số nguyên và số thập phân (dấu phẩy hoặc dấu chấm: 2,5 hay 2.5)
 * - Tự viết bộ phân tích cú pháp (parser) không dùng hàm eval() nguy hiểm
 * - Bỏ qua các đơn vị đo, danh từ đi kèm: (cây), cây bút, cm, kg...
 * - Kết quả: status 'dung' | 'sai' | 'khong_kiem_duoc'
 */

export function checkArithmetic(line) {
  if (!line || typeof line !== 'string') {
    return { status: 'khong_kiem_duoc', isArithmetic: false, isCorrect: false };
  }
  const equalIdx = line.indexOf('=');
  if (equalIdx === -1) {
    return { status: 'khong_kiem_duoc', isArithmetic: false, isCorrect: false };
  }

  const leftRaw = line.slice(0, equalIdx);
  const rightRaw = line.slice(equalIdx + 1);

  // Trích xuất số ở vế phải (số đầu tiên ngay sau dấu =)
  const rMatch = rightRaw.match(/([\d]+(?:[\,\.][\d]+)?)/);
  if (!rMatch) {
    return { status: 'khong_kiem_duoc', isArithmetic: false, isCorrect: false };
  }
  const rVal = Number(rMatch[1].replace(',', '.'));
  if (isNaN(rVal)) {
    return { status: 'khong_kiem_duoc', isArithmetic: false, isCorrect: false };
  }

  // Trích xuất biểu thức ở vế trái (bao gồm cả số, toán tử, ngoặc đơn)
  const lMatch = leftRaw.match(/([\(\)\d\s\,\.\+\-\x\*\×\:\/\÷]+)$/i);
  if (!lMatch) {
    return { status: 'khong_kiem_duoc', isArithmetic: false, isCorrect: false };
  }
  const lExpr = lMatch[1].trim();

  // Chuẩn hóa toán tử về chuẩn toán học máy tính
  let s = lExpr.replace(/×/g, '*').replace(/x/gi, '*').replace(/÷/g, '/').replace(/:/g, '/');

  // Tokenize
  const regex = /([\d]+(?:[\,\.][\d]+)?|\+|\-|\*|\/|\(|\))/g;
  let m;
  const tokens = [];
  while ((m = regex.exec(s)) !== null) {
    let t = m[0];
    if (t === '(' || t === ')' || t === '+' || t === '-' || t === '*' || t === '/') {
      tokens.push(t);
    } else {
      if (t.includes(',')) t = t.replace(',', '.');
      const num = Number(t);
      if (isNaN(num)) return { status: 'khong_kiem_duoc', isArithmetic: false, isCorrect: false, error: 'malformed' };
      tokens.push(num);
    }
  }

  // Cần ít nhất 3 tokens (ví dụ: a + b)
  if (tokens.length < 3) {
    return { status: 'khong_kiem_duoc', isArithmetic: false, isCorrect: false, error: 'too_few_tokens' };
  }

  // Kiểm tra không có hai toán tử liên tiếp (ngoại trừ dấu ngoặc)
  const opsList = ['+', '-', '*', '/'];
  for (let i = 0; i < tokens.length - 1; i++) {
    if (opsList.includes(tokens[i]) && opsList.includes(tokens[i + 1])) {
      return { status: 'khong_kiem_duoc', isArithmetic: false, isCorrect: false, error: 'double_operator' };
    }
  }
  // Không được kết thúc hoặc bắt đầu bằng toán tử nhị phân
  if (opsList.includes(tokens[0]) || opsList.includes(tokens[tokens.length - 1])) {
    return { status: 'khong_kiem_duoc', isArithmetic: false, isCorrect: false, error: 'leading_or_trailing_operator' };
  }

  // Thuật toán Shunting-yard chuyển biểu thức trung tố thành hậu tố (RPN)
  const output = [];
  const ops = [];
  const prec = { '+': 1, '-': 1, '*': 2, '/': 2 };

  for (const t of tokens) {
    if (typeof t === 'number') {
      output.push(t);
    } else if (t === '(') {
      ops.push(t);
    } else if (t === ')') {
      let foundOpen = false;
      while (ops.length > 0) {
        const top = ops.pop();
        if (top === '(') {
          foundOpen = true;
          break;
        }
        output.push(top);
      }
      if (!foundOpen) {
        return { status: 'khong_kiem_duoc', isArithmetic: false, isCorrect: false, error: 'unmatched_close_paren' };
      }
    } else if (prec[t]) {
      while (ops.length > 0 && ops[ops.length - 1] !== '(' && prec[ops[ops.length - 1]] >= prec[t]) {
        output.push(ops.pop());
      }
      ops.push(t);
    } else {
      return { status: 'khong_kiem_duoc', isArithmetic: false, isCorrect: false, error: 'unknown_token' };
    }
  }

  while (ops.length > 0) {
    const top = ops.pop();
    if (top === '(' || top === ')') {
      return { status: 'khong_kiem_duoc', isArithmetic: false, isCorrect: false, error: 'unmatched_open_paren' };
    }
    output.push(top);
  }

  // Tính toán kết quả biểu thức RPN bằng ngăn xếp (Stack)
  const stack = [];
  for (const item of output) {
    if (typeof item === 'number') {
      stack.push(item);
    } else {
      if (stack.length < 2) {
        return { status: 'khong_kiem_duoc', isArithmetic: false, isCorrect: false, error: 'stack_underflow' };
      }
      const b = stack.pop();
      const a = stack.pop();
      if (item === '+') stack.push(a + b);
      else if (item === '-') stack.push(a - b);
      else if (item === '*') stack.push(a * b);
      else if (item === '/') {
        if (b === 0) {
          return { status: 'khong_kiem_duoc', isArithmetic: false, isCorrect: false, error: 'division_by_zero' };
        }
        stack.push(a / b);
      }
    }
  }

  if (stack.length !== 1) {
    return { status: 'khong_kiem_duoc', isArithmetic: false, isCorrect: false, error: 'invalid_eval' };
  }
  const lVal = stack[0];

  const isCorrect = Math.abs(lVal - rVal) < 1e-6;
  return {
    status: isCorrect ? 'dung' : 'sai',
    isArithmetic: true,
    isCorrect,
    left: lVal,
    right: rVal,
    computed: lVal,
    stated: rVal,
    expression: `${lExpr} = ${rMatch[1]}`,
  };
}

/**
 * Đối chiếu kết quả giữa AI và Máy kiểm tra phép tính (Spec 2.5)
 */
export function reconcileWorkCheck({ aiResult, childLines = [] }) {
  if (!aiResult || typeof aiResult !== 'object') return aiResult;

  // 1. Kiểm tra từng dòng của con
  const childChecks = childLines.map((line, idx) => {
    const content = typeof line === 'object' ? line.noi_dung : line;
    const res = checkArithmetic(content);
    return { lineIndex: idx + 1, ...res };
  });

  // 2. Kiểm tra từng biểu thức trong lời giải chuẩn của AI
  const aiSolutionChecks = (aiResult.loi_giai_chuan || []).map((step, idx) => {
    const res = checkArithmetic(step);
    return { stepIndex: idx + 1, ...res };
  });

  let aiUncertain = 0;
  let overridden = false;
  let reconciled = { ...aiResult };

  // Trường hợp 3: Lời giải của AI có biểu thức sai -> đánh dấu ai_chua_chac
  const hasAiMathError = aiSolutionChecks.some(c => c.status === 'sai');
  if (hasAiMathError) {
    aiUncertain = 1;
  }

  // Tìm dòng đầu tiên con tính nhầm toán học
  const firstChildMathError = childChecks.find(c => c.status === 'sai');

  // Trường hợp 1: Dòng con tính sai nhưng AI nói đúng hết
  if (firstChildMathError && reconciled.ket_qua === 'dung_het') {
    overridden = true;
    reconciled.ket_qua = 'co_buoc_sai';
    reconciled.dong_sai_dau_tien = firstChildMathError.lineIndex;
    reconciled.loai_loi = 'tinh_nham';
    reconciled.gia_tri_dung_dong_sai = String(firstChildMathError.left);
    reconciled.giai_thich_cho_me = `Máy kiểm tra phát hiện dòng ${firstChildMathError.lineIndex} có phép tính chưa chính xác (${firstChildMathError.expression}).`;
    reconciled.cau_hoi_cho_con = {
      muc_1: `Con tính lại phép tính ở dòng ${firstChildMathError.lineIndex} nhé?`,
      muc_2: 'Con dùng que tính hoặc nháp để kiểm tra lại phép tính này nhé.',
    };
  }

  // Trường hợp 2: AI nói sai ở dòng k, nhưng máy kiểm tra dòng k thấy phép tính tự thân đúng hoặc dòng không có phép tính
  if (reconciled.dong_sai_dau_tien) {
    const flaggedCheck = childChecks.find(c => c.lineIndex === reconciled.dong_sai_dau_tien);
    const noOtherMathErrors = !childChecks.some(c => c.status === 'sai');

    // Nếu dòng bị AI gán lỗi thực ra là đúng toán học hoặc là dòng không có phép tính (đáp số), và toàn bài không có dòng nào tính sai
    if (flaggedCheck && (flaggedCheck.status === 'dung' || flaggedCheck.status === 'khong_kiem_duoc') && noOtherMathErrors) {
      if (reconciled.loai_loi === 'chon_phep_tinh') {
        // Hợp lệ, giữ nguyên lỗi logic
      } else {
        // AI nhầm lẫn: ghi đè thành đúng hết
        overridden = true;
        aiUncertain = 1;
        reconciled.ket_qua = 'dung_het';
        reconciled.dong_sai_dau_tien = null;
        reconciled.loai_loi = null;
        reconciled.giai_thich_cho_me = 'Máy kiểm tra thấy các phép tính của con đều chính xác.';
      }
    }
  }

  reconciled.machine_json = JSON.stringify({
    childChecks,
    aiSolutionChecks,
    overridden,
  });
  reconciled.ai_uncertain = aiUncertain;

  return reconciled;
}
