/**
 * src/vision.js
 * Quản lý Vision AI, Model Switching, Neurons Quota, Prompt Whitelist & Safe Image Validation
 * Tuân thủ yêu cầu Đợt 14:
 * - Không lưu ảnh bé vào R2 hay D1 child_photos (bảo vệ quyền riêng tư)
 * - Quản lý hạn mức Neurons Workers AI Free Tier (10,000 neurons/ngày)
 * - Cache prompt KV 5 phút, whitelist prompt_id, fallback template nhúng
 * - Timeout primary 12s, fallback 10s, rate limit 30 req/10 phút/IP
 */

export const MODEL_NEURON_RATES = {
  '@cf/meta/llama-3.2-11b-vision-instruct': { input: 4410, output: 61493 },
  '@cf/meta/llama-4-scout-17b-16e-instruct': { input: 24545, output: 77273 },
  '@cf/mistralai/mistral-small-3.1-24b-instruct': { input: 31876, output: 50488 },
  '@cf/google/gemma-3-12b-it': { input: 31371, output: 50560 },
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast': { input: 26668, output: 204805 },
  '@cf/meta/llama-3.1-8b-instruct': { input: 4410, output: 61493 },
  '@cf/meta/llama-3.1-8b-instruct-fp8': { input: 4410, output: 61493 },
  default: { input: 26668, output: 204805 },
};

export const PROMPT_WHITELIST = ['p1_ocr_v3', 'p1_ocr_v2', 'p1_ocr', 'p5_toy'];

export const DEFAULT_PROMPT_TEMPLATES = {
  p1_ocr_v3: `Bạn là công cụ CHÉP LẠI chữ trong ảnh bài tập tiểu học Việt Nam (sách giáo khoa, phiếu bài tập, vở ô ly; có thể có chữ viết tay của trẻ, của bố mẹ hoặc cô giáo).
Nhìn ảnh và trả về DUY NHẤT một JSON hợp lệ, không markdown, không thêm chữ nào khác:
{"pham_vi": "bai_tap" | "khong_phai_bai_tap" | "nhay_cam" | "anh_mo" | "nhieu_bai", "do_tin_cay": 0.0-1.0, "ly_do": "<tối đa 15 chữ>", "mon_doan": "toan" | "tieng_viet" | "tieng_anh" | "khac", "lop_doan": 1-12 hoặc null, "so_bai": 1, "cac_bai": ["<Câu 1 ...>", "<Câu 2 ...>"], "de_bai": "<đề bài chép nguyên văn>", "bai_lam_cua_con": "<phần trẻ đã viết/điền, không có thì để rỗng>", "cho_khong_chac": ["<chữ hoặc số đọc chưa chắc>"]}

CÁCH CHÉP CHỮ (quan trọng nhất):
- Chép NGUYÊN VĂN từng chữ, từng số, từng dấu thanh như trong ảnh. KHÔNG sửa chính tả, KHÔNG tự điền chỗ trống, KHÔNG giải bài, KHÔNG thêm lời dẫn.
- Giữ nguyên chỗ trống và ký hiệu: "...", "___", "□", "?", các dấu + - × : = > <, phân số dạng a/b, đơn vị (cm, dm, m, kg, g, l, giờ, phút, đồng).
- Bài chính tả tiếng Việt (điền l/n, s/x, ch/tr, d/gi/r, dấu hỏi/ngã, vần...) phải giữ nguyên chỗ cần điền, tuyệt đối không điền giúp.
- Phép tính đặt cột dọc: viết lại thành hàng ngang, vd "345 + 128 = ...".
- Chữ viết tay khó đọc: đoán theo ngữ cảnh bài tiểu học. Nếu vẫn không chắc, viết "[?]" ngay sau chữ đó (vd "Lan có 1[?] cái kẹo") và ghi chữ đó vào "cho_khong_chac". SỐ không chắc thì LUÔN đánh dấu [?], tuyệt đối không bịa số.
- Tách đề và bài làm: phần đề (chữ in, hoặc chữ cô/bố mẹ chép đề vào vở) → "de_bai". Phần trẻ tự viết để trả lời (đáp án đã điền, phép tính, lời giải, đáp án đã khoanh, nét gạch xoá) → "bai_lam_cua_con". KHÔNG đưa bài làm của trẻ vào "de_bai".
- Trong chuỗi JSON: xuống dòng viết là \\n, dấu nháy kép viết là \\".

PHÂN LOẠI:
- "bai_tap": ảnh là trang sách, vở, phiếu bài tập có đề bài đọc được.
- "nhay_cam": có mặt người rõ, giấy tờ riêng tư, bằng lái, CCCD, bạo lực, nội dung người lớn. Khi đó để "de_bai": "" và "bai_lam_cua_con": "".
- "khong_phai_bai_tap": đồ vật gia đình, đồ chơi, thú cưng, màn hình game, phong cảnh.
- "anh_mo": mờ, rung tay, mất góc hoặc thiếu sáng tới mức KHÔNG đọc được phần lớn đề. Nếu chỉ vài chữ khó đọc thì vẫn là "bai_tap" và dùng [?].
- "nhieu_bai": có từ 2 bài tập độc lập trở lên (Bài 1, Bài 2...). Tách từng bài vào "cac_bai", mỗi bài chép nguyên văn như "de_bai". Các ý a), b), c) của CÙNG một bài vẫn tính là 1 bài.`,

  p1_ocr_v2: `Nhìn ảnh và trả về DUY NHẤT một JSON, không thêm chữ nào khác:
{"pham_vi": "bai_tap" | "khong_phai_bai_tap" | "nhay_cam" | "anh_mo" | "nhieu_bai", "do_tin_cay": 0.0-1.0, "ly_do": "<tối đa 15 chữ>", "mon_doan": "toan" | "tieng_viet" | "tieng_anh" | "khac", "lop_doan": 1-12 hoặc null, "so_bai": 1, "cac_bai": ["<Câu 1 ...>", "<Câu 2 ...>"], "de_bai": "<toàn bộ chữ của đề, giữ nguyên số liệu, đúng chính tả>"}

QUY TẮC BẮT BUỘC:
- "bai_tap": chỉ khi ảnh là trang sách, vở, phiếu bài tập có đề bài rõ ràng.
- "nhay_cam": khi có mặt người rõ, giấy tờ riêng tư, bằng lái, cccd, bạo lực, nội dung người lớn. Khi đó để "de_bai": "".
- "khong_phai_bai_tap": đồ vật gia đình, đồ chơi, thú cưng, màn hình game, phong cảnh.
- "anh_mo": ảnh mờ, rung tay, mất góc hoặc thiếu sáng không đọc được.
- "nhieu_bai": có từ 2 bài tập trở lên trong ảnh. Tách rõ từng câu vào "cac_bai".
- Tuyệt đối không tự giải bài toán hay trả lời câu hỏi.`,

  p1_ocr: `Đọc giúp mình toàn bộ chữ trong ảnh bài tập này nhé (chữ in sách hoặc chữ viết tay vở ô ly).
Quy tắc:
- Giữ nguyên tất cả số liệu, phép tính, câu hỏi, các đáp án trắc nghiệm A B C D nếu có.
- Viết lại đúng chính tả tiếng Việt có dấu giúp mình. Nếu nét viết tay bị mờ hoặc dính chữ thì tự sửa đúng chính tả luôn.
- Nếu ảnh có nhiều câu (Câu 1, Câu 2...), hãy tách rõ ràng từng câu.
- Chỉ trả về duy nhất nội dung đề bài đọc được, không thêm lời chào, câu dẫn hay bình luận mở đầu/kết thúc.`,

  p5_toy: `Quan sát kỹ đồ vật mà người trong ảnh đang cầm trên tay hoặc giơ lên phía trước (ví dụ: cây lược/lược chải tóc, cây bút, cái kéo, cây thước kẻ, cái cốc/ly, khối lego, cái bát/chén, cái thìa/muỗng, gấu bông, xe ô tô...). Trả về DUY NHẤT tên đồ vật ngắn gọn bằng tiếng Việt, không thêm câu dẫn.`,
};

// In-memory cache for prompt_studio config (5 minutes TTL)
let cachedPromptStudioConfig = null;
let promptStudioConfigExpiresAt = 0;

// In-memory rate limiting map: ip -> [timestamp] (30 req / 10 min)
const ipRateLimitMap = new Map();

/**
 * Kiểm tra Rate Limit theo IP
 */
export function checkVisionRateLimit(ip) {
  if (!ip) return true;
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxReq = 30;

  let list = ipRateLimitMap.get(ip) || [];
  list = list.filter((ts) => now - ts < windowMs);
  if (list.length >= maxReq) {
    ipRateLimitMap.set(ip, list);
    return false;
  }
  list.push(now);
  ipRateLimitMap.set(ip, list);
  return true;
}

/**
 * Đảm bảo bảng ai_usage tồn tại trong D1
 */
export async function ensureAiUsageTable(db) {
  if (!db) return;
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS ai_usage (
        day TEXT NOT NULL,
        scope TEXT NOT NULL,
        neurons REAL DEFAULT 0,
        calls INTEGER DEFAULT 0,
        PRIMARY KEY (day, scope)
      );
    `).run();
  } catch (err) {
    console.error('ensureAiUsageTable error:', err.message);
  }
}

/**
 * Lấy tổng Neurons đã dùng trong ngày hôm nay (UTC)
 */
export async function getAiUsageToday(db) {
  if (!db) return { total_neurons: 0, ocr_primary_neurons: 0 };
  const today = new Date().toISOString().slice(0, 10);
  try {
    await ensureAiUsageTable(db);
    const sumResult = await db.prepare(
      'SELECT SUM(neurons) as total_neurons FROM ai_usage WHERE day = ?'
    ).bind(today).first();

    const primaryResult = await db.prepare(
      "SELECT neurons as primary_neurons FROM ai_usage WHERE day = ? AND scope = 'ocr_primary'"
    ).bind(today).first();

    return {
      total_neurons: Number(sumResult?.total_neurons) || 0,
      ocr_primary_neurons: Number(primaryResult?.primary_neurons) || 0,
    };
  } catch (err) {
    console.error('getAiUsageToday error:', err.message);
    return { total_neurons: 0, ocr_primary_neurons: 0 };
  }
}

/**
 * Ghi nhận số Neurons tiêu thụ vào ai_usage
 */
export async function recordAiUsage(db, { scope, model, promptLength = 0, outputLength = 0, usage = null, hasImage = false }) {
  if (!db) return;
  const today = new Date().toISOString().slice(0, 10);
  const rates = MODEL_NEURON_RATES[model] || MODEL_NEURON_RATES.default;

  let promptTokens = usage?.prompt_tokens;
  let completionTokens = usage?.completion_tokens;

  if (typeof promptTokens !== 'number') {
    promptTokens = Math.ceil(promptLength / 3) + (hasImage ? 1500 : 0);
  }
  if (typeof completionTokens !== 'number') {
    completionTokens = Math.ceil(outputLength / 3);
  }

  const neurons = (promptTokens * rates.input + completionTokens * rates.output) / 1_000_000;

  try {
    await ensureAiUsageTable(db);
    await db.prepare(`
      INSERT INTO ai_usage (day, scope, neurons, calls)
      VALUES (?, ?, ?, 1)
      ON CONFLICT(day, scope) DO UPDATE SET
        neurons = neurons + excluded.neurons,
        calls = calls + 1;
    `).bind(today, scope, neurons).run();
  } catch (err) {
    console.error('recordAiUsage error:', err.message);
  }
}

/**
 * Xác thực dữ liệu ảnh: dung lượng và định dạng (Magic Bytes & Mime)
 */
export function validateImageBytes(imageBytes, mimeType = '') {
  if (!imageBytes || imageBytes.length === 0) {
    return { valid: false, status: 400, error: 'Không tìm thấy dữ liệu hình ảnh để phân tích.' };
  }

  // 1. Giới hạn 8MB
  const MAX_SIZE = 8 * 1024 * 1024;
  if (imageBytes.length > MAX_SIZE) {
    return { valid: false, status: 413, error: 'image_too_large' };
  }

  // 2. Kiểm tra HEIC / HEIF
  const mimeLower = (mimeType || '').toLowerCase();
  if (mimeLower.includes('heic') || mimeLower.includes('heif')) {
    return {
      valid: false,
      status: 415,
      error: 'unsupported_image_type',
      message: 'Vui lòng chọn ảnh JPG/PNG (HEIC không được hỗ trợ trực tiếp)',
    };
  }

  // Magic bytes check
  // JPEG: 0xFF, 0xD8, 0xFF
  const isJpeg = imageBytes.length >= 3 &&
    imageBytes[0] === 0xff && imageBytes[1] === 0xd8 && imageBytes[2] === 0xff;

  // PNG: 0x89, 0x50, 0x4E, 0x47 (\x89PNG)
  const isPng = imageBytes.length >= 4 &&
    imageBytes[0] === 0x89 && imageBytes[1] === 0x50 && imageBytes[2] === 0x4e && imageBytes[3] === 0x47;

  // WebP: RIFF ... WEBP
  const isWebp = imageBytes.length >= 12 &&
    imageBytes[0] === 0x52 && imageBytes[1] === 0x49 && imageBytes[2] === 0x46 && imageBytes[3] === 0x46 &&
    imageBytes[8] === 0x57 && imageBytes[9] === 0x45 && imageBytes[10] === 0x42 && imageBytes[11] === 0x50;

  // HEIC box check in first 32 bytes (ftypheic, ftypmif1, ftypmsf1, etc.)
  if (imageBytes.length >= 16) {
    const headerStr = Array.from(imageBytes.slice(4, 16)).map((b) => String.fromCharCode(b)).join('');
    if (headerStr.includes('ftyp') && (headerStr.includes('heic') || headerStr.includes('mif1') || headerStr.includes('msf1') || headerStr.includes('heix'))) {
      return {
        valid: false,
        status: 415,
        error: 'unsupported_image_type',
        message: 'Vui lòng chọn ảnh JPG/PNG (HEIC không được hỗ trợ trực tiếp)',
      };
    }
  }

  if (!isJpeg && !isPng && !isWebp) {
    return {
      valid: false,
      status: 415,
      error: 'unsupported_image_type',
      message: 'Vui lòng chọn ảnh JPG/PNG',
    };
  }

  const detectedExt = isPng ? 'png' : isWebp ? 'webp' : 'jpg';
  const detectedMime = isPng ? 'image/png' : isWebp ? 'image/webp' : 'image/jpeg';
  return { valid: true, ext: detectedExt, mimeType: detectedMime };
}

/**
 * Lấy prompt template từ KV hoặc fallback
 */
export async function resolvePromptTemplate({ promptId, clientPrompt, env }) {
  const allowClientPrompt = env?.ALLOW_CLIENT_PROMPT !== undefined
    ? String(env.ALLOW_CLIENT_PROMPT).toLowerCase() === 'true'
    : true;

  // 1. Client chỉ định prompt_id
  if (promptId) {
    if (!PROMPT_WHITELIST.includes(promptId)) {
      return { error: 'unknown_prompt_id', status: 400 };
    }

    // Đọc từ cache KV nếu còn hạn
    const now = Date.now();
    if (cachedPromptStudioConfig && now < promptStudioConfigExpiresAt) {
      const cfgCached = cachedPromptStudioConfig.prompts || cachedPromptStudioConfig;
      const template = cfgCached?.[promptId]?.template;
      if (template) return { template, promptId };
    }

    // Thử đọc từ KV (D1 _kv_store)
    if (env?.DB) {
      try {
        const row = await env.DB.prepare(
          "SELECT value FROM _kv_store WHERE key = 'prompt_studio:config'"
        ).first();
        if (row && row.value) {
          let parsed = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
          if (typeof parsed === 'string') parsed = JSON.parse(parsed);
          cachedPromptStudioConfig = parsed;
          promptStudioConfigExpiresAt = now + 5 * 60 * 1000; // 5 phút TTL
          const cfg = parsed?.prompts || parsed;
          if (cfg?.[promptId]?.template) {
            return { template: cfg[promptId].template, promptId };
          }
        }
      } catch (e) {
        console.warn('Lỗi đọc KV prompt_studio:config:', e.message);
      }
    }

    // Fallback template nhúng sẵn trong worker
    return {
      template: DEFAULT_PROMPT_TEMPLATES[promptId] || DEFAULT_PROMPT_TEMPLATES.p1_ocr_v2,
      promptId,
    };
  }

  // 2. Client không gửi prompt_id
  if (allowClientPrompt) {
    if (clientPrompt && typeof clientPrompt === 'string' && clientPrompt.trim().length > 0) {
      console.warn('legacy_client_prompt: Client used legacy prompt parameter without prompt_id');
      const truncated = clientPrompt.slice(0, 4000);
      return { template: truncated, promptId: 'legacy_client_prompt' };
    }
    // Mặc định p1_ocr_v2
    return { template: DEFAULT_PROMPT_TEMPLATES.p1_ocr_v2, promptId: 'p1_ocr_v2' };
  }

  // Không cho phép client gửi prompt tự do khi ALLOW_CLIENT_PROMPT=false
  return { error: 'missing_prompt_id', status: 400 };
}

/**
 * Thực thi gọi Vision AI với Primary model (12s timeout) và Fallback (10s timeout)
 */
export async function executeVisionAI({ env, imageBytes, prompt, promptId, forceModel = null, forceTimeoutMs = 14000, primaryOnly = false, primaryTimeoutMs = 12000 }) {
  const primaryModel = env.VISION_MODEL_PRIMARY || '@cf/meta/llama-3.2-11b-vision-instruct';
  // Prompt 32 mục 7: model dự phòng KHÁC model chính, để lần đọc thứ 2 thật sự có cơ hội đọc được
  const fallbackModel = env.VISION_MODEL_FALLBACK || '@cf/meta/llama-4-scout-17b-16e-instruct';

  const softLimit = Number(env.AI_DAILY_SOFT_LIMIT || 45000);
  const hardLimit = Number(env.AI_DAILY_HARD_LIMIT || 60000);
  const primaryQuota = Number(env.OCR_PRIMARY_DAILY_NEURONS || 25000);

  // Kiểm tra hạn mức tiêu thụ hôm nay
  const usage = await getAiUsageToday(env.DB);
  if (usage.total_neurons >= hardLimit) {
    return {
      success: false,
      status: 503,
      error: 'ai_quota_low',
      message: 'Hạn mức AI hôm nay đã đạt ngưỡng an toàn, xin vui lòng thử lại ngày mai.',
    };
  }

  // Quyết định dùng model nào
  let directFallback = false;
  if (usage.total_neurons >= softLimit || (promptId !== 'p5_toy' && usage.ocr_primary_neurons >= primaryQuota)) {
    directFallback = true;
  }

  const isToy = promptId === 'p5_toy';
  const maxTokens = isToy ? 64 : 1024;
  const temperature = isToy ? 0.2 : 0;

  // Helper thực thi model với timeout
  // Prompt 32 mục 7: llama-4-scout / gemma-3 / mistral-small nhận ảnh qua messages + image_url (data URL),
  // còn llama-3.2-vision / llava nhận { prompt, image: [bytes] }.
  const usesMessagesFormat = (m) => /llama-4|gemma-3|mistral-small|qwen/i.test(m);
  const toDataUrl = () => {
    let bin = '';
    const bytes = imageBytes instanceof Uint8Array ? imageBytes : new Uint8Array(imageBytes);
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    const mime = bytes[0] === 0x89 ? 'image/png' : (bytes[0] === 0x52 ? 'image/webp' : 'image/jpeg');
    return `data:${mime};base64,${btoa(bin)}`;
  };
  const runModel = async (modelName) => {
    const payload = usesMessagesFormat(modelName)
      ? { messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: toDataUrl() } }] }], max_tokens: maxTokens, temperature }
      : { prompt, image: [...imageBytes], max_tokens: maxTokens, temperature };
    try {
      return await env.AI.run(modelName, payload);
    } catch (err) {
      // Model Meta cần chấp nhận giấy phép lần đầu (lỗi 5016)
      if (err && err.message && err.message.includes('5016')) {
        await env.AI.run(modelName, { prompt: 'agree', image: [...imageBytes] });
        return await env.AI.run(modelName, payload);
      }
      throw err;
    }
  };

  // env.AI.run không hỗ trợ AbortSignal → dùng Promise.race để thật sự ngắt chờ
  const runWithTimeout = (modelName, timeoutMs) => {
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Timeout sau ${timeoutMs}ms khi gọi ${modelName}`)), timeoutMs);
    });
    return Promise.race([runModel(modelName), timeout]).finally(() => clearTimeout(timer));
  };

  const startTime = Date.now();
  let analysis = '';
  let modelUsed = primaryModel;
  let fallbackUsed = false;
  let executionScope = isToy ? 'toy' : 'ocr_primary';

  // Prompt 32 mục 7: gọi thẳng một model chỉ định (lần đọc thứ 2 của chấm vở)
  if (forceModel) {
    try {
      const response = await runWithTimeout(forceModel, forceTimeoutMs);
      analysis = response?.response || response?.description || '';
      const usagePromise = recordAiUsage(env.DB, { scope: 'ocr_fallback', model: forceModel, promptLength: prompt.length, outputLength: analysis.length, hasImage: true }).catch(() => {});
      return { success: true, status: 200, analysis, model: forceModel, fallback_used: true, latency_ms: Date.now() - startTime, usagePromise };
    } catch (forceErr) {
      return { success: false, status: 502, error: 'vision_failed', message: forceErr.message };
    }
  }

  // 1. Thử primary model nếu không bị soft limit
  if (!directFallback) {
    try {
      const response = await runWithTimeout(primaryModel, primaryTimeoutMs);
      analysis = response?.response || response?.description || '';
      modelUsed = primaryModel;
      executionScope = isToy ? 'toy' : 'ocr_primary';
    } catch (primaryErr) {
      console.warn(`Primary vision model (${primaryModel}) thất bại:`, primaryErr.message);
      // Nếu primary và fallback giống nhau, hoặc nơi gọi tự lo lần đọc lại (chấm vở), không gọi tiếp ở đây
      if (primaryModel === fallbackModel || primaryOnly) {
        return {
          success: false,
          status: 502,
          error: 'vision_failed',
          message: primaryErr.message,
        };
      }
      fallbackUsed = true;
    }
  } else {
    fallbackUsed = true;
  }

  // 2. Chuyển sang fallback model nếu cần
  if (fallbackUsed) {
    modelUsed = fallbackModel;
    executionScope = isToy ? 'toy' : 'ocr_fallback';
    try {
      const remainingTime = Math.max(1000, 22000 - (Date.now() - startTime));
      const timeoutMs = Math.min(10000, remainingTime);
      const response = await runWithTimeout(fallbackModel, timeoutMs);
      analysis = response?.response || response?.description || '';
    } catch (fallbackErr) {
      console.error(`Fallback vision model (${fallbackModel}) thất bại:`, fallbackErr.message);
      return {
        success: false,
        status: 502,
        error: 'vision_failed',
        message: fallbackErr.message,
      };
    }
  }

  const latencyMs = Date.now() - startTime;

  // Ghi nhận hạn mức tiêu thụ vào DB bất đồng bộ
  const usagePromise = recordAiUsage(env.DB, {
    scope: executionScope,
    model: modelUsed,
    promptLength: prompt.length,
    outputLength: analysis.length,
    hasImage: true,
  }).catch((e) => console.error('Lỗi lưu ai_usage:', e.message));

  return {
    success: true,
    status: 200,
    analysis,
    model: modelUsed,
    fallback_used: fallbackUsed,
    latency_ms: latencyMs,
    usagePromise,
  };
}
