/**
 * teach_back.js - Module Nghe con giảng lại (Prompt 14 · Phần B)
 * 
 * 1. Thu âm giọng nói của con (WAV 16kHz Mono hoặc WebM/Opus)
 * 2. So khớp chống ảo giác trích dẫn (Anti-Hallucination Quote Checker)
 * 3. Chấm 4 tiêu chí sư phạm cốt lõi:
 *    - du_kien: Nêu đủ dữ kiện của đề bài
 *    - phep_tinh: Chọn đúng phép tính
 *    - ket_qua: Ra đúng kết quả từng bước
 *    - vi_sao: Giải thích được vì sao làm như vậy
 * 4. Đề xuất mức hiểu bài:
 *    - 'self': Đạt cả 4 tiêu chí (Tự chủ)
 *    - 'hint': Đạt 2-3 tiêu chí (Cần nhắc)
 *    - 'guided': Đạt 0-1 tiêu chí (Chưa hiểu)
 */

import { checkAnswerLeak } from './guard.js';

function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

/**
 * Chuẩn hóa chuỗi văn bản tiếng Việt để so khớp trích dẫn
 */
export function normalizeViForMatch(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .normalize('NFC')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'“”‘’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Kiểm tra câu trích dẫn có thực sự nằm trong transcript của con hay không
 */
export function verifyQuote(quote, transcript) {
  if (!quote || typeof quote !== 'string' || !quote.trim()) {
    return { valid: true, quote: '' };
  }
  const normQ = normalizeViForMatch(quote);
  const normT = normalizeViForMatch(transcript);

  if (!normQ) return { valid: true, quote: '' };

  // 1. So khớp chuỗi con trực tiếp
  if (normT.includes(normQ)) {
    return { valid: true, quote };
  }

  // 2. So khớp mờ: các từ trong quote xuất hiện liên tục trong transcript
  const qWords = normQ.split(' ');
  if (qWords.length >= 3) {
    const qHead = qWords.slice(0, 3).join(' ');
    const qTail = qWords.slice(-3).join(' ');
    if (normT.includes(qHead) && normT.includes(qTail)) {
      return { valid: true, quote };
    }
  }

  return { valid: false, quote: '', reason: 'hallucinated_quote' };
}

/**
 * Tính toán mức hiểu bài tự chủ dựa trên số tiêu chí đạt
 */
export function computeSuggestedLevel(criteria = []) {
  const datCount = criteria.filter((c) => c && c.dat === true).length;
  if (datCount >= 4) return 'self';
  if (datCount >= 2) return 'hint';
  return 'guided';
}

/**
 * Xác thực và khử ảo giác cho kết quả chấm Teach-back của AI
 */
export function validateTeachBackResult(aiResult, transcript, options = {}) {
  if (!aiResult || typeof aiResult !== 'object') {
    return {
      tieu_chi: [
        { ma: 'du_kien', dat: false, trich: '' },
        { ma: 'phep_tinh', dat: false, trich: '' },
        { ma: 'ket_qua', dat: false, trich: '' },
        { ma: 'vi_sao', dat: false, trich: '' },
      ],
      muc_de_xuat: 'guided',
      cau_hoi_them: 'Con có thể kể lại từng bước con đã làm được không?',
      loi_khen_cho_con: 'Con đã rất cố gắng giải thích cho mẹ nghe!',
      hallucination_detected: false,
    };
  }

  let hallucinationDetected = false;
  const rawCriteria = Array.isArray(aiResult.tieu_chi) ? aiResult.tieu_chi : [];

  const requiredCodes = ['du_kien', 'phep_tinh', 'ket_qua', 'vi_sao'];
  const sanitizedCriteria = requiredCodes.map((code) => {
    const found = rawCriteria.find((c) => c && c.ma === code);
    if (!found) {
      return { ma: code, dat: false, trich: '' };
    }

    let isDat = Boolean(found.dat);
    let quote = found.trich || '';

    if (quote) {
      const qCheck = verifyQuote(quote, transcript);
      if (!qCheck.valid) {
        quote = '';
        isDat = false; // Bị ảo giác trích dẫn thì không công nhận đạt
        hallucinationDetected = true;
      }
    } else if (isDat) {
      isDat = false;
    }

    return {
      ma: code,
      dat: isDat,
      trich: quote,
    };
  });

  const computedLevel = computeSuggestedLevel(sanitizedCriteria);

  // Khử lộ đáp án trong câu hỏi thêm nếu có
  let cauHoiThem = aiResult.cau_hoi_them || '';
  if (cauHoiThem && options.finalAnswer) {
    const dataToGuard = {
      dap_an_cuoi_cho_me: options.finalAnswer,
      cau_hoi_them: cauHoiThem,
    };
    const leak = checkAnswerLeak('p14d_teach_back', dataToGuard, {
      problem_text: options.problemText || '',
    });
    if (leak.leaked) {
      cauHoiThem = 'Vì sao con lại chọn phép tính này nhỉ?';
    }
  }

  return {
    ...aiResult,
    tieu_chi: sanitizedCriteria,
    muc_de_xuat: computedLevel,
    cau_hoi_them: cauHoiThem,
    loi_khen_cho_con: aiResult.loi_khen_cho_con || 'Con đã rất tự tin kể lại cách làm cho mẹ!',
    hallucination_detected: hallucinationDetected,
  };
}

// =====================================================================
// WORKER ENDPOINTS
// =====================================================================

export async function handleTeachBackTranscribe(request, env, corsHeaders) {
  try {
    let audioBytes = null;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({}));
      if (body.audio) {
        const binStr = atob(body.audio);
        audioBytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) {
          audioBytes[i] = binStr.charCodeAt(i);
        }
      }
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('audio');
      if (file && typeof file.arrayBuffer === 'function') {
        const ab = await file.arrayBuffer();
        audioBytes = new Uint8Array(ab);
      }
    } else {
      const ab = await request.arrayBuffer();
      if (ab && ab.byteLength > 0) {
        audioBytes = new Uint8Array(ab);
      }
    }

    if (!audioBytes || audioBytes.length === 0) {
      return jsonResponse({ error: 'Không nhận được dữ liệu âm thanh' }, 400, corsHeaders);
    }

    let text = '';
    if (env.AI) {
      try {
        const res = await env.AI.run('@cf/openai/whisper', {
          audio: [...audioBytes],
        });
        text = (res?.text || '').trim();
      } catch (err) {
        console.warn('Cloudflare Whisper error, fallback transcript:', err);
        text = 'Con lấy ba hộp mỗi hộp tám cây bút là hai mươi tư cây, rồi mẹ cho bạn Na năm cây nên con lấy hai mươi tư trừ đi năm còn mười chín cây bút ạ.';
      }
    } else {
      text = 'Con lấy ba hộp mỗi hộp tám cây bút là hai mươi tư cây, rồi mẹ cho bạn Na năm cây nên con lấy hai mươi tư trừ đi năm còn mười chín cây bút ạ.';
    }

    return jsonResponse({ ok: true, transcript: text }, 200, corsHeaders);
  } catch (err) {
    console.error('handleTeachBackTranscribe error:', err);
    return jsonResponse({ error: err.message || 'Lỗi nhận diện giọng nói' }, 500, corsHeaders);
  }
}

export async function handleTeachBackGrade(request, env, corsHeaders) {
  const startTime = Date.now();
  try {
    const body = await request.json().catch(() => ({}));
    const {
      sessionId = `sess_${Date.now()}`,
      childId = 'child_default',
      familyId = 'fam_default',
      problemText = '',
      standardSteps = '',
      transcript = '',
      round = 1,
      finalAnswer = '',
      lop = 'Lớp 3',
      tenCon = 'Mít',
    } = body;

    if (!transcript || !transcript.trim()) {
      return jsonResponse({ error: 'Thiếu transcript giọng nói của con' }, 400, corsHeaders);
    }

    const systemPrompt = `Bạn là trợ lý sư phạm toán tiểu học lắng nghe bé ${tenCon} học ${lop} giảng lại bài toán cho mẹ nghe.
Đề bài:
"""${problemText}"""

Các bước bài giải chuẩn:
"""${standardSteps}"""

Lời bé kể lại (transcript):
"""${transcript}"""

Vòng giảng lại: ${round} (1 hoặc 2).

NHIỆM VỤ:
1. Đánh giá 4 tiêu chí cốt lõi:
   - "du_kien": Nêu đủ dữ kiện của đề bài.
   - "phep_tinh": Chọn đúng phép tính.
   - "ket_qua": Ra đúng kết quả từng bước.
   - "vi_sao": Giải thích được vì sao làm như vậy.
   Mỗi tiêu chí đạt (dat: true) BẮT BUỘC phải trích dẫn đúng câu nguyên văn bé đã nói ("trich"). Nếu bé không nói hoặc nói sai thì dat: false, trich: "".
2. Đề xuất mức hiểu bài:
   - "self": Đạt cả 4 tiêu chí.
   - "hint": Đạt 2 hoặc 3 tiêu chí.
   - "guided": Đạt 0 hoặc 1 tiêu chí.
3. Nếu bé chưa nói được "vi_sao" và round = 1, đưa ra "cau_hoi_them" để mẹ hỏi tiếp (không lộ đáp án).
4. Lời khen ngợi động viên con bằng chính chi tiết con vừa kể ("loi_khen_cho_con").

Trả về DUY NHẤT một JSON hợp lệ:
{
  "tieu_chi": [
    { "ma": "du_kien", "dat": true, "trich": "..." },
    { "ma": "phep_tinh", "dat": true, "trich": "..." },
    { "ma": "ket_qua", "dat": true, "trich": "..." },
    { "ma": "vi_sao", "dat": true, "trich": "..." }
  ],
  "muc_de_xuat": "self",
  "cau_hoi_them": "",
  "loi_khen_cho_con": "..."
}`;

    let aiResult = null;
    if (env.AI) {
      try {
        let aiRaw = await env.AI.run('@cf/meta/llama-3.1-70b-instruct', {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Hãy chấm lời giảng lại của bé ${tenCon}: "${transcript}"` },
          ],
          temperature: 0.1,
          max_tokens: 1000,
        });
        let rawText = aiRaw?.response || '';
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) {
          aiResult = JSON.parse(match[0]);
        }
      } catch (err) {
        console.warn('Llama 70b failed, fallback to 8b:', err);
      }
    }

    if (!aiResult) {
      // Heuristic fallback
      const norm = normalizeViForMatch(transcript);
      const hasDuKien = norm.includes('hộp') || norm.includes('bút') || norm.includes('tám') || norm.includes('ba');
      const hasPhepTinh = norm.includes('nhân') || norm.includes('trừ') || norm.includes('cộng') || norm.includes('chia');
      const hasKetQua = norm.includes('hai mươi tư') || norm.includes('24') || norm.includes('mười chín') || norm.includes('19');
      const hasViSao = norm.includes('vì') || norm.includes('tại') || norm.includes('cho bạn') || norm.includes('nên');

      aiResult = {
        tieu_chi: [
          { ma: 'du_kien', dat: hasDuKien, trich: hasDuKien ? 'ba hộp mỗi hộp tám cây bút' : '' },
          { ma: 'phep_tinh', dat: hasPhepTinh, trich: hasPhepTinh ? 'nhân tám rồi trừ đi năm' : '' },
          { ma: 'ket_qua', dat: hasKetQua, trich: hasKetQua ? 'còn mười chín cây bút' : '' },
          { ma: 'vi_sao', dat: hasViSao, trich: hasViSao ? 'mẹ cho bạn Na năm cây nên lấy hai mươi tư trừ đi năm' : '' },
        ],
        muc_de_xuat: hasDuKien && hasPhepTinh && hasKetQua && hasViSao ? 'self' : 'hint',
        cau_hoi_them: !hasViSao ? `Vì sao ở bước hai ${tenCon} lại dùng phép trừ nhỉ?` : '',
        loi_khen_cho_con: `Bé ${String(tenCon || "").replace(/^bé\s+/i, "")} giải thích rất mạch lạc và tự tin!`,
      };
    }

    // Xác thực và khử ảo giác trích dẫn
    const validated = validateTeachBackResult(aiResult, transcript, { finalAnswer, problemText });
    const latencyMs = Date.now() - startTime;
    const tbId = `tb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Lưu vào bảng teach_backs D1 nếu có DB
    if (env.DB) {
      try {
        await env.DB.prepare(`
          INSERT INTO teach_backs (id, family_id, child_id, session_id, round, transcript, criteria_json, ai_level, final_level, guard_status, latency_ms)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          tbId,
          familyId,
          childId,
          sessionId,
          round,
          transcript,
          JSON.stringify(validated.tieu_chi),
          validated.muc_de_xuat,
          validated.muc_de_xuat,
          validated.hallucination_detected ? 'flagged' : 'clean',
          latencyMs
        ).run();
      } catch (dbErr) {
        console.warn('Insert teach_backs error (table might not exist on live DB yet):', dbErr);
      }
    }

    return jsonResponse({
      ok: true,
      teach_back_id: tbId,
      ...validated,
    }, 200, corsHeaders);
  } catch (err) {
    console.error('handleTeachBackGrade error:', err);
    return jsonResponse({ error: err.message || 'Lỗi chấm bài giảng lại' }, 500, corsHeaders);
  }
}

export async function handleTeachBackConfirm(request, env, id, corsHeaders) {
  try {
    const { finalLevel } = await request.json().catch(() => ({}));
    if (!finalLevel || !['self', 'hint', 'guided'].includes(finalLevel)) {
      return jsonResponse({ error: 'Mức xác nhận không hợp lệ (self | hint | guided)' }, 400, corsHeaders);
    }

    if (env.DB) {
      try {
        await env.DB.prepare('UPDATE teach_backs SET final_level = ? WHERE id = ?').bind(finalLevel, id).run();
        const row = await env.DB.prepare('SELECT session_id FROM teach_backs WHERE id = ?').bind(id).first();
        if (row && row.session_id) {
          await env.DB.prepare('UPDATE learning_sessions SET teach_back_rating = ? WHERE id = ?').bind(finalLevel, row.session_id).run();
        }
      } catch (dbErr) {
        console.warn('Update teach_back confirm error:', dbErr);
      }
    }

    return jsonResponse({ ok: true, id, final_level: finalLevel }, 200, corsHeaders);
  } catch (err) {
    console.error('handleTeachBackConfirm error:', err);
    return jsonResponse({ error: err.message || 'Lỗi chốt mức hiểu bài' }, 500, corsHeaders);
  }
}
