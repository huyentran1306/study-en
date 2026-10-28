/**
 * Chuẩn hoá đầu ra từ Workers AI (hỗ trợ cả chuỗi JSON, đối tượng JSON, hay phản hồi rỗng/null)
 * Đảm bảo luôn trả về { rawOutput: string, parsed: object | null }
 * Tuyệt đối không bao giờ throw lỗi khi rawOutput là object, null hoặc undefined.
 */
export function normalizeAiResponse(response) {
  if (response === null || response === undefined) {
    return { rawOutput: "", parsed: null };
  }
  let raw = response.response !== undefined ? response.response : response;
  if (raw === null || raw === undefined) {
    return { rawOutput: "", parsed: null };
  }
  if (typeof raw === "object") {
    try {
      return { rawOutput: JSON.stringify(raw, null, 2), parsed: raw };
    } catch (_) {
      return { rawOutput: String(raw), parsed: null };
    }
  }

  const str = String(raw).trim();
  if (!str) {
    return { rawOutput: "", parsed: null };
  }

  let jsonClean = str;
  const match = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) jsonClean = match[1].trim();

  let parsed = null;
  try {
    parsed = JSON.parse(jsonClean);
  } catch (_) {
    const start = jsonClean.indexOf("{");
    const end = jsonClean.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        parsed = JSON.parse(jsonClean.slice(start, end + 1));
      } catch (_) {
        try {
          parsed = JSON.parse(jsonClean.slice(start, end + 1).replace(/,\s*([}\]])/g, "$1"));
        } catch (_) {}
      }
    }
  }
  return { rawOutput: str, parsed };
}

/**
 * ADVANCED AI, VECTORIZE, R2 & D1 GATEWAY WORKER (VERSION 3.0.0)
 * 
 * 🌐 Live URL: https://ai-gateway-worker.trann46698.workers.dev
 * 
 * BỘ TÍNH NĂNG CAO CẤP TÍCH HỢP:
 * -------------------------------------------------------------------------
 * 1. 🔍 VECTOR SEARCH & RAG:
 *    - POST /search/index          -> Đánh chỉ mục văn bản/bài học vào Vector Database
 *    - POST /search/vector         -> Tìm kiếm ngữ nghĩa bằng câu hỏi tự nhiên (Vectorize)
 * 
 * 2. 🎨 AI IMAGE GENERATION:
 *    - POST /images/generate       -> Tạo ảnh nghệ thuật từ text prompt (Flux 1 / SDXL Lightning)
 * 
 * 3. 📷 VISION AI & OCR:
 *    - POST /vision/analyze        -> Phân tích ảnh chụp bé (cảm xúc, hoạt động, lời khuyên)
 *    - POST /vision/ocr            -> Bóc tách chữ tiếng Anh từ ảnh chụp tài liệu/bài tập
 *    - GET  /images/:id            -> Hiển thị ảnh trực tiếp từ R2 (cho thẻ <img>)
 *    - GET  /child-photos          -> Lịch sử ảnh bé & phân tích
 * 
 * 4. 🎤 STT & 🔊 TTS:
 *    - POST /stt                   -> Whisper Bóc băng giọng nói
 *    - POST /tts                   -> Deepgram Aura-2 Đọc giọng bản xứ
 * 
 * 5. 🧠 LLM CHAT & COACH:
 *    - POST /chat                  -> Llama 3.3 70B Fast
 *    - POST /fix-english           -> Sửa câu chuẩn Tech Lead
 * 
 * 6. 💾 D1 DATABASE (SQLITE CLOUD):
 *    - POST /db/query | POST /db/execute | GET /db/kv/:key | POST /db/kv/:key
 */

import { handleV1Route, jsonResponse as v1JsonResponse, authenticateAdmin, authenticateSession, buildLearnerProfile, handleProgressReport, handleMicroStep, handleJudgeAnswer, handleAdaptiveBrother, handleTraitAnalysis } from "./v1_routes.js";
import { checkVisionRateLimit, validateImageBytes, resolvePromptTemplate, executeVisionAI } from "./vision.js";
import { validateAndGuardAiOutput } from "./admin_stitch_routes.js";
import { validateAndGuard, checkAnswerLeak, logGuardEvent, DEFAULT_GUARD_FALLBACKS, SKILL_SAFE_QUESTIONS } from "./guard.js";
import { validateAllLessonMath, correctLessonMath } from "./arithmetic.js";
import { handleCheckWorkRead, handleCheckWorkGrade, handleCheckWorkGet, handleCheckWorkHistory } from "./check_work.js";
import { handleTeachBackTranscribe, handleTeachBackGrade, handleTeachBackConfirm } from "./teach_back.js";
import {
  estimateTokens,
  sha256Hex,
  logAiCall,
  handleTokenStats,
  buildCacheKey,
  fetchFromLessonCache,
  storeInLessonCache,
  checkFamilyQuota
} from "./dot20_token.js";
import {
  handleAiFeedbackCreate,
  handleSafetySummary,
  handleSafetyLog,
  handleSafetyTestGuard,
  handleAiFeedbackClose,
} from "./safety.js";

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const isAllowedOrigin =
      !origin ||
      origin === "https://kem-con-hoc-5xf.pages.dev" ||
      /^https:\/\/[a-z0-9-]+\.kem-con-hoc-5xf\.pages\.dev$/.test(origin) ||
      origin === "http://localhost:5173" ||
      origin === "http://localhost:3000";

    const corsHeaders = {
      "Access-Control-Allow-Origin": isAllowedOrigin && origin ? origin : "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Prompt-Id, X-Session-Id, X-Problem-Text, X-Family-Id",
      "Access-Control-Max-Age": "86400",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    if (env.DB && ctx && typeof ctx.waitUntil === 'function') {
      ctx.waitUntil(ensureDot14Tables(env.DB));
    }

    // =====================================================================
    // 0a. 📝 CHẤM VỞ, KHÔNG SỬA HỘ (Prompt 14 Phần A)
    // =====================================================================
    if (pathname.startsWith("/api/v1/ai/check-work/")) {
      if (pathname === "/api/v1/ai/check-work/read" && request.method === "POST") {
        return await handleCheckWorkRead(request, env, corsHeaders);
      }
      if (pathname.match(/^\/api\/v1\/ai\/check-work\/[^\/]+\/grade$/) && request.method === "POST") {
        const id = pathname.split("/")[5];
        return await handleCheckWorkGrade(request, env, id, corsHeaders);
      }
      if (pathname === "/api/v1/ai/check-work/history" && request.method === "GET") {
        return await handleCheckWorkHistory(request, env, corsHeaders);
      }
      if (pathname.match(/^\/api\/v1\/ai\/check-work\/[^\/]+$/) && request.method === "GET") {
        const id = pathname.split("/")[5];
        return await handleCheckWorkGet(request, env, id, corsHeaders);
      }
    }

    // =====================================================================
    // 0c. 📊 PHÂN TÍCH TIẾN BỘ TRUNG THỰC (Prompt 17/18 Chặng 3)
    // =====================================================================
    if (pathname === "/api/v1/ai/progress" && request.method === "POST") {
      return await handleProgressReport(request, env, ctx, corsHeaders);
    }

    // =====================================================================
    // 0d. 🪜 CÂU HỎI NHỎ HƠN (Prompt 18 Chặng 4)
    // =====================================================================
    if (pathname === "/api/v1/ai/micro-step" && request.method === "POST") {
      return await handleMicroStep(request, env, ctx, corsHeaders);
    }

    // =====================================================================
    // 0e. 🎙 GẤU NGHE CON TRẢ LỜI (Prompt 18 Chặng 5)
    // =====================================================================
    if (pathname === "/api/v1/ai/judge-answer" && request.method === "POST") {
      return await handleJudgeAnswer(request, env, ctx, corsHeaders);
    }

    // =====================================================================
    // 0f. 🎯 BÀI ANH EM THÍCH ỨNG (Prompt 18 Chặng 6)
    // =====================================================================
    if (pathname === "/api/v1/ai/brother" && request.method === "POST") {
      return await handleAdaptiveBrother(request, env, ctx, corsHeaders);
    }

    // =====================================================================
    // 0g. 🧭 AI TÌM NGUYÊN NHÂN & LỘ TRÌNH CÂN BẰNG (Đợt 19 Chặng 3)
    // =====================================================================
    if (pathname === "/api/v1/ai/trait-analysis" && request.method === "POST") {
      return await handleTraitAnalysis(request, env, ctx, corsHeaders);
    }

    // =====================================================================
    // 0h. ⚡️ HOÀN TRẢ LƯỢT SOẠN TRƯỚC BỊ HUỶ (Đợt 23V)
    // =====================================================================
    if (pathname === "/api/v1/ai/cancel-prefetch" && request.method === "POST") {
      try {
        const body = await request.json().catch(() => ({}));
        let familyId = body.family_id || request.headers.get("X-Family-Id") || "";
        const authSession = await authenticateSession(request, env).catch(() => null);
        if (authSession && authSession.family_id) familyId = authSession.family_id;
        if (familyId && env.DB) {
          await env.DB.prepare(`
            UPDATE ai_calls SET status = 'cancelled'
            WHERE family_id = ? AND (status = 'prefetch' OR id = (
              SELECT id FROM ai_calls WHERE family_id = ? ORDER BY created_at DESC LIMIT 1
            ))
          `).bind(familyId, familyId).run().catch(() => {});
        }
        return jsonResponse({ ok: true, cancelled: true }, 200, corsHeaders);
      } catch (err) {
        return jsonResponse({ ok: false, error: err.message }, 500, corsHeaders);
      }
    }

    // =====================================================================
    // 0i. 💾 LƯU BÀI ĐÃ GHÉP VÀO LESSON_CACHE (Đợt 23V)
    // =====================================================================
    if (pathname === "/api/v1/ai/cache-lesson" && request.method === "POST") {
      try {
        const body = await request.json().catch(() => ({}));
        const { problemText, grade, bookSeries, subject, childProfileHash = "none", lessonObj, promptVersion = "v3" } = body;
        if (env.DB && problemText && lessonObj) {
          const cacheKey = await buildCacheKey({
            problemText,
            grade,
            bookSeries,
            subject,
            promptVersion,
            childProfileHash,
            systemContent: "",
          });
          await storeInLessonCache(env, {
            cacheKey,
            problemText,
            grade,
            bookSeries,
            subject,
            promptVersion,
            childProfileHash,
            lessonObj,
            tokensSaved: 1950,
          });
          return jsonResponse({ ok: true, cached: true, cacheKey }, 200, corsHeaders);
        }
        return jsonResponse({ ok: false, message: "Missing required fields" }, 400, corsHeaders);
      } catch (err) {
        return jsonResponse({ ok: false, error: err.message }, 500, corsHeaders);
      }
    }

    // =====================================================================
    // 0b. 🎓 NGHE CON GIẢNG LẠI (Prompt 14 Phần B)
    // =====================================================================
    if (pathname.startsWith("/api/v1/ai/teach-back/")) {
      if (pathname === "/api/v1/ai/teach-back/transcribe" && request.method === "POST") {
        return await handleTeachBackTranscribe(request, env, corsHeaders);
      }
      if (pathname === "/api/v1/ai/teach-back/grade" && request.method === "POST") {
        return await handleTeachBackGrade(request, env, corsHeaders);
      }
      if (pathname.match(/^\/api\/v1\/ai\/teach-back\/[^\/]+\/confirm$/) && request.method === "POST") {
        const id = pathname.split("/")[5];
        return await handleTeachBackConfirm(request, env, id, corsHeaders);
      }
    }

    // =====================================================================
    // 0c. 🛡️ AN TOÀN AI & PHỤ HUYNH PHẢN HỒI (Prompt 14 Phần C)
    // =====================================================================
    if (pathname === "/api/v1/ai-feedback" && request.method === "POST") {
      return await handleAiFeedbackCreate(request, env, corsHeaders);
    }
    if (pathname === "/api/v1/safety/summary" && request.method === "GET") {
      return await handleSafetySummary(request, env, corsHeaders);
    }
    if (pathname === "/api/v1/safety/log" && request.method === "GET") {
      return await handleSafetyLog(request, env, corsHeaders);
    }
    if (pathname === "/api/v1/safety/test-guard" && request.method === "POST") {
      return await handleSafetyTestGuard(request, env, corsHeaders);
    }
    if (pathname.match(/^\/api\/v1\/admin\/ai-feedback\/[^\/]+\/close$/) && request.method === "POST") {
      const id = pathname.split("/")[5];
      return await handleAiFeedbackClose(request, env, id, corsHeaders);
    }

    // =====================================================================
    // 0. 🔐 API V1 PLATFORM ROUTES (Prompt 00: Auth, RBAC, Sessions, State)
    // =====================================================================
    if (pathname.startsWith("/api/v1/")) {
      const v1Res = await handleV1Route(request, env, ctx, pathname, corsHeaders);
      if (v1Res) return v1Res;
    }

    try {
      // =====================================================================
      // 1. 🎨 AI IMAGE GENERATION (FLUX 1 / SDXL LIGHTNING)
      // =====================================================================
      if (pathname === "/images/generate" && request.method === "POST") {
        const { prompt = "", style = "photorealistic", num_steps = 4 } = await request.json().catch(() => ({}));
        if (!prompt) {
          return jsonResponse({ error: "Thiếu trường 'prompt' để tạo ảnh" }, 400, corsHeaders);
        }

        // Tinh chỉnh prompt theo phong cách mong muốn
        const enhancedPrompt = `${prompt}, high quality, beautiful lighting, ${style === "anime" ? "anime illustration, vibrant" : style === "pixar" ? "3D pixar style animated character, cute, smooth render" : "highly detailed, professional photography"}`;

        let rawImage = null;
        try {
          rawImage = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", {
            prompt: enhancedPrompt,
            steps: Math.min(num_steps, 8),
          });
        } catch {
          rawImage = await env.AI.run("@cf/bytedance/stable-diffusion-xl-lightning", {
            prompt: enhancedPrompt,
            num_steps: Math.min(num_steps, 8),
          });
        }

        let imageBytes = null;
        if (rawImage && typeof rawImage === "object" && rawImage.image) {
          const binaryStr = atob(rawImage.image);
          imageBytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) imageBytes[i] = binaryStr.charCodeAt(i);
        } else if (typeof rawImage === "string") {
          const binaryStr = atob(rawImage);
          imageBytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) imageBytes[i] = binaryStr.charCodeAt(i);
        } else {
          imageBytes = new Uint8Array(await new Response(rawImage).arrayBuffer());
        }

        const fileId = `ai_gen_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
        if (env.IMAGES) {
          await env.IMAGES.put(fileId, imageBytes, {
            httpMetadata: { contentType: "image/jpeg" },
          });
        }

        const imageUrl = `${url.origin}/images/${fileId}`;
        return jsonResponse(
          {
            success: true,
            file_id: fileId,
            image_url: imageUrl,
            prompt,
            enhanced_prompt: enhancedPrompt,
          },
          200,
          corsHeaders
        );
      }

      // =====================================================================
      // 2. 🔍 VECTORIZE: TÌM KIẾM NGỮ NGHĨA AI (SEMANTIC VECTOR SEARCH & RAG)
      // =====================================================================

      // POST /search/index -> Đưa văn bản vào Vector Database
      if (pathname === "/search/index" && request.method === "POST") {
        const { id, text = "", metadata = {} } = await request.json().catch(() => ({}));
        if (!text) {
          return jsonResponse({ error: "Thiếu trường 'text' để index" }, 400, corsHeaders);
        }

        const docId = id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        // 1. Sinh vector 768 chiều từ text bằng BGE Base
        const embeddingRes = await env.AI.run("@cf/baai/bge-base-en-v1.5", {
          text: [text],
        });
        const vectorValues = embeddingRes.data[0];

        // 2. Lưu vào Cloudflare Vectorize
        if (env.VECTORIZE) {
          await env.VECTORIZE.upsert([
            {
              id: docId,
              values: vectorValues,
              metadata: {
                text: text.slice(0, 1000), // Lưu preview text
                ...metadata,
              },
            },
          ]);
        }

        return jsonResponse(
          {
            success: true,
            id: docId,
            indexed_text: text,
            dimensions: vectorValues.length,
          },
          200,
          corsHeaders
        );
      }

      // POST /search/vector -> Tìm kiếm bằng ngữ nghĩa câu hỏi
      if (pathname === "/search/vector" && request.method === "POST") {
        const { query = "", topK = 5 } = await request.json().catch(() => ({}));
        if (!query) {
          return jsonResponse({ error: "Thiếu trường 'query' để tìm kiếm" }, 400, corsHeaders);
        }

        // 1. Sinh vector từ câu hỏi query
        const embeddingRes = await env.AI.run("@cf/baai/bge-base-en-v1.5", {
          text: [query],
        });
        const queryVector = embeddingRes.data[0];

        // 2. Tìm kiếm các vector gần nhất trong Vectorize theo Cosine Distance
        let matches = [];
        if (env.VECTORIZE) {
          const searchResult = await env.VECTORIZE.query(queryVector, {
            topK: Math.min(topK, 20),
            returnMetadata: "all",
          });
          matches = searchResult.matches || [];
        }

        return jsonResponse(
          {
            query,
            total_results: matches.length,
            results: matches.map((m) => ({
              id: m.id,
              score: Math.round(m.score * 10000) / 10000,
              text: m.metadata?.text || "",
              metadata: m.metadata || {},
            })),
          },
          200,
          corsHeaders
        );
      }

      // =====================================================================
      // 3. 📷 VISION AI, OCR & ẢNH BÉ (LLAMA 3.2 VISION + R2 + D1)
      // =====================================================================

      // 📷 POST /vision/analyze -> Đọc đề từ ảnh bài tập (p1_ocr*) / nhận diện đồ chơi (p5_toy)
      // Không lưu ảnh (R2 / child_photos). Prompt lấy phía server theo prompt_id. Có hạn mức neurons.
      if (pathname === "/vision/analyze" && request.method === "POST") {
        const ip = request.headers.get("CF-Connecting-IP") || "";
        if (!checkVisionRateLimit(ip)) {
          return jsonResponse({ success: false, error: "rate_limited" }, 429, corsHeaders);
        }

        let imageBytes = null;
        let mimeType = "";
        let clientPrompt = "";
        let promptId = "";
        const contentType = request.headers.get("content-type") || "";

        if (contentType.includes("multipart/form-data")) {
          const formData = await request.formData();
          const file = formData.get("image") || formData.get("file");
          if (file && typeof file === "object" && "arrayBuffer" in file) {
            imageBytes = new Uint8Array(await file.arrayBuffer());
            mimeType = file.type || "";
          }
          if (formData.has("prompt_id")) promptId = String(formData.get("prompt_id")).trim();
          if (formData.has("prompt")) clientPrompt = String(formData.get("prompt"));
        } else if (contentType.includes("application/json")) {
          const body = await request.json();
          if (body.prompt_id || body.promptId) promptId = String(body.prompt_id || body.promptId).trim();
          if (body.prompt) clientPrompt = String(body.prompt);
          if (body.image) {
            const base64Clean = String(body.image).replace(/^data:image\/\w+;base64,/, "");
            const binaryStr = atob(base64Clean);
            imageBytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) imageBytes[i] = binaryStr.charCodeAt(i);
          }
        } else {
          imageBytes = new Uint8Array(await request.arrayBuffer());
          mimeType = contentType;
        }

        const check = validateImageBytes(imageBytes, mimeType);
        if (!check.valid) {
          return jsonResponse({ success: false, error: check.error, message: check.message }, check.status, corsHeaders);
        }

        const resolved = await resolvePromptTemplate({ promptId, clientPrompt, env });
        if (resolved.error) {
          return jsonResponse({ success: false, error: resolved.error }, resolved.status || 400, corsHeaders);
        }

        const result = await executeVisionAI({ env, imageBytes, prompt: resolved.template, promptId: resolved.promptId });
        if (result.usagePromise) ctx.waitUntil(result.usagePromise);

        if (!result.success) {
          return jsonResponse({ success: false, error: result.error, message: result.message }, result.status || 502, corsHeaders);
        }

        return jsonResponse(
          {
            success: true,
            analysis: result.analysis,
            model: result.model,
            fallback_used: result.fallback_used,
            latency_ms: result.latency_ms,
          },
          200,
          corsHeaders
        );
      }

      // 📝 POST /vision/ocr -> Trích xuất văn bản từ ảnh chụp tài liệu/bài tập
      if (pathname === "/vision/ocr" && request.method === "POST") {
        let imageBytes = null;
        const contentType = request.headers.get("content-type") || "";

        if (contentType.includes("multipart/form-data")) {
          const formData = await request.formData();
          const file = formData.get("image") || formData.get("file");
          if (file && typeof file === "object" && "arrayBuffer" in file) {
            imageBytes = new Uint8Array(await file.arrayBuffer());
          }
        } else {
          imageBytes = new Uint8Array(await request.arrayBuffer());
        }

        if (!imageBytes || imageBytes.length === 0) {
          return jsonResponse({ error: "Không tìm thấy file ảnh" }, 400, corsHeaders);
        }

        const ocrPrompt = "Extract all text, paragraphs, and words from this image accurately. Preserve formatting where possible.";
        let extractedText = "";
        try {
          const visionResponse = await env.AI.run("@cf/meta/llama-3.2-11b-vision-instruct", {
            prompt: ocrPrompt,
            image: [...imageBytes],
            max_tokens: 1200,
          });
          extractedText = visionResponse.response || "";
        } catch (ocrErr) {
          if (ocrErr.message && ocrErr.message.includes("5016")) {
            try {
              await env.AI.run("@cf/meta/llama-3.2-11b-vision-instruct", {
                prompt: "agree",
                image: [...imageBytes],
              });
              const retryVision = await env.AI.run("@cf/meta/llama-3.2-11b-vision-instruct", {
                prompt: ocrPrompt,
                image: [...imageBytes],
                max_tokens: 1200,
              });
              extractedText = retryVision.response || "";
            } catch (rErr) {
              return jsonResponse({ error: rErr.message }, 500, corsHeaders);
            }
          } else {
            return jsonResponse({ error: ocrErr.message }, 500, corsHeaders);
          }
        }

        return jsonResponse(
          {
            success: true,
            extracted_text: extractedText,
          },
          200,
          corsHeaders
        );
      }

      // 🖼️ GET & HEAD /images/:id -> Render ảnh từ R2
      if (pathname.startsWith("/images/") && (request.method === "GET" || request.method === "HEAD")) {
        const fileId = pathname.replace("/images/", "");
        if (!env.IMAGES) return new Response("R2 not configured", { status: 500, headers: corsHeaders });

        const object = await env.IMAGES.get(fileId);
        if (!object) return new Response("Image not found", { status: 404, headers: corsHeaders });

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        const mime = fileId.endsWith(".png") ? "image/png" : fileId.endsWith(".webp") ? "image/webp" : "image/jpeg";
        headers.set("Content-Type", object.httpMetadata?.contentType || mime);
        headers.set("Access-Control-Allow-Origin", "*");
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
        return new Response(object.body, { headers });
      }

      // 👶 GET /child-photos -> Danh sách ảnh bé
      if (pathname === "/child-photos" && request.method === "GET") {
        await ensureChildPhotosTable(env.DB);
        const limit = Number(url.searchParams.get("limit")) || 20;
        const result = await env.DB.prepare(
          "SELECT id, file_id, image_url, prompt, analysis, child_name, created_at FROM child_photos ORDER BY id DESC LIMIT ?;"
        ).bind(limit).all();

        return jsonResponse({ photos: result.results }, 200, corsHeaders);
      }

      // =====================================================================
      // 4. 🎤 STT, 🔊 TTS, 🧠 CHAT & ✍️ FIX ENGLISH
      // =====================================================================
      if (pathname === "/stt" && request.method === "POST") {
        const audioBuffer = await request.arrayBuffer();
        if (!audioBuffer || audioBuffer.byteLength === 0) {
          return jsonResponse({ error: "Chưa gửi dữ liệu audio" }, 400, corsHeaders);
        }
        const response = await env.AI.run("@cf/openai/whisper", { audio: [...new Uint8Array(audioBuffer)] });
        return jsonResponse({ text: response.text || "" }, 200, corsHeaders);
      }

      if (pathname === "/tts" && request.method === "POST") {
        const { text = "" } = await request.json().catch(() => ({}));
        if (!text) return jsonResponse({ error: "Thiếu trường 'text'" }, 400, corsHeaders);
        const audio = await env.AI.run("@cf/deepgram/aura-2-en", { text });
        return new Response(audio, {
          headers: { ...corsHeaders, "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=3600" },
        });
      }

      if (pathname === "/chat" && request.method === "POST") {
        const { messages = [], max_tokens: reqMaxTokens = 800, temperature = 0.7, model } = await request.json().catch(() => ({}));
        if (!Array.isArray(messages) || messages.length === 0) {
          return jsonResponse({ error: "Thiếu mảng 'messages'" }, 400, corsHeaders);
        }
        // P0.A: ngân sách thời gian tổng ~25 giây; các lần soạn lại chỉ chạy khi còn đủ thời gian
        const chatStartedAt = Date.now();
        const CHAT_BUDGET_MS = 25000;
        const timeLeft = () => CHAT_BUDGET_MS - (Date.now() - chatStartedAt);
        const max_tokens = Math.max(64, Math.min(Number(reqMaxTokens) || 800, 1600));
        const promptId = request.headers.get("X-Prompt-Id") || "";
        const sessionId = request.headers.get("X-Session-Id") || "";
        const problemText = request.headers.get("X-Problem-Text") || "";
        let familyId = request.headers.get("X-Family-Id") || "";
        if (familyId) {
          try { familyId = decodeURIComponent(familyId); } catch (_) {}
        }
        const childId = request.headers.get("X-Child-Id") || "";

        // Đợt 23T Mục 5: Lấy family_id từ phiên Bearer token thay vì chỉ tin header
        try {
          const authSession = await authenticateSession(request, env);
          if (authSession && authSession.family_id) {
            familyId = authSession.family_id;
          }
        } catch (_) {}

        // Đợt 18 · Chặng 2: Hồ sơ con cho AI (Gấu nhớ con {{ho_so_con}})
        let childProfile = null;
        let profile_ms = 0;
        for (let m of messages) {
          if (typeof m.content === "string" && m.content.includes("{{ho_so_con}}")) {
            let profileText = "chưa có";
            if (familyId && childId) {
              const pStart = Date.now();
              childProfile = await buildLearnerProfile(env, familyId, childId);
              profile_ms = Date.now() - pStart;
              profileText = childProfile.profileText || "chưa có";
            }
            m.content = m.content.replace(/\{\{ho_so_con\}\}/g, profileText);
          }
        }

        // Đợt 20 · Chặng 1 & Đợt 23V: Kiểm tra bộ nhớ bài giảng (lesson_cache) & hạn mức gia đình
        const isExplain = promptId === "p3_explain" || promptId === "p3_explain_v2" || promptId === "p3_explain_v3";
        const isPrefetch = request.headers.get("X-Prefetch") === "1" || request.headers.get("X-Prefetch") === "true";
        const bypassCache = request.headers.get("X-Bypass-Cache") === "1" || request.headers.get("X-Bypass-Cache") === "true";
        let rawProblem = problemText ? decodeURIComponent(problemText) : "";
        if (!rawProblem) {
          for (let m of messages) {
            if (typeof m.content === "string") {
              const match = m.content.match(/Đề bài:\s*"""?([\s\S]*?)"""?/i) || m.content.match(/Bài đang học:\s*"([\s\S]*?)"/i);
              if (match) {
                rawProblem = match[1].trim();
                break;
              }
              if (m.content.includes("Đề bài:")) {
                rawProblem = m.content;
                break;
              }
            }
          }
        }
        const rawGrade = request.headers.get("X-Grade") || "";
        const grade = rawGrade.includes("%") ? decodeURIComponent(rawGrade) : rawGrade;
        const rawBook = request.headers.get("X-Book-Series") || "";
        const bookSeries = rawBook.includes("%") ? decodeURIComponent(rawBook) : rawBook;
        const rawSubject = request.headers.get("X-Subject") || "";
        const subject = rawSubject.includes("%") ? decodeURIComponent(rawSubject) : rawSubject;
        const childProfileHash = childId ? await sha256Hex(childId) : "none";

        let systemContent = "";
        for (let m of messages) {
          if (m.role === "system" && typeof m.content === "string") {
            systemContent = m.content;
            break;
          }
        }

        let cacheKey = null;

        let cache_ms = 0;
        if (isExplain && rawProblem) {
          cacheKey = await buildCacheKey({
            problemText: rawProblem,
            grade,
            bookSeries,
            subject,
            promptVersion: promptId === "p3_explain_v3" ? "v3r28" : (promptId === "p3_explain_v2" ? "v2" : "v1"),
            childProfileHash,
            systemContent,
          });

          if (!bypassCache) {
            const cStart = Date.now();
            const cachedLesson = await fetchFromLessonCache(env, cacheKey);
            cache_ms = Date.now() - cStart;
            if (cachedLesson) {
              const elapsed = Date.now() - chatStartedAt;
              await logAiCall(env, {
                family_id: familyId,
                session_id: sessionId,
                endpoint: "/chat",
                prompt_id: promptId,
                prompt_version: promptId === "p3_explain_v3" ? "v3r28" : (promptId === "p3_explain_v2" ? "v2" : "v1"),
                model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
                tokens_in: 0,
                tokens_out: 0,
                latency_ms: elapsed,
                ms: elapsed,
                ok: 1,
                status: "cache_hit",
                cache_hit: 1,
                estimated: 0,
              });

              return jsonResponse({
                response: cachedLesson,
                guarded: false,
                error_code: null,
                cached: true,
                validator: { ok: true, cached: true },
                timing: {
                  profile_ms,
                  cache_ms,
                  ai_ms: 0,
                  check_ms: 0,
                  total_ms: elapsed,
                },
              }, 200, corsHeaders);
            }
          }

          // Kiểm tra hạn mức 30 bài/ngày/gia đình
          if (familyId) {
            const quota = await checkFamilyQuota(env, familyId);
            if (!quota.allowed) {
              return jsonResponse({
                error: "quota_exceeded",
                message: "Gia đình đã dùng hết 30 lượt soạn bài hôm nay để bảo vệ mắt và thời gian của bé. Mẹ và bé hãy cùng ôn lại các bài đã lưu nhé!",
              }, 429, corsHeaders);
            }
          }
        }

        try {
          // Chỉ nhận id model Workers AI hợp lệ (@cf/...), tên khác (vd "cloudflare-llama-3.3-70b") quy về mặc định
          const chosenModel = typeof model === "string" && model.startsWith("@cf/") ? model : "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
          let response;
          const aiStart = Date.now();
          try {
            response = await env.AI.run(chosenModel, { messages, max_tokens, temperature });
          } catch (mErr) {
            console.warn("Primary model error, retrying once before fallback:", mErr);
            await new Promise(r => setTimeout(r, 600));
            try {
              response = await env.AI.run(chosenModel, { messages, max_tokens, temperature });
            } catch (retryErr) {
              console.warn("Retry failed, fallback to llama-3.1-8b-instruct-fp8:", retryErr);
              response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fp8", { messages, max_tokens, temperature });
            }
          }
          const ai_ms = Date.now() - aiStart;
          const normalized = normalizeAiResponse(response);
          let rawOutput = normalized.rawOutput;
          let parsed = normalized.parsed;

// Headers đã được đọc ở đầu /chat

          // 1. Nếu định dạng sai (hỏng JSON hoặc thiếu bậc), retry 1 lần với yêu cầu JSON
          if ((!parsed || ((promptId === "p3_explain" || promptId === "p3_explain_v2" || promptId === "p3_explain_v3") && (!Array.isArray(parsed?.cac_bac) || parsed.cac_bac.length < 3))) && timeLeft() > 12000) {
            try {
              const retryMessages = [
                ...messages,
                { role: "assistant", content: rawOutput },
                { role: "user", content: "Lưu ý: Chỉ trả lời bằng định dạng JSON hợp lệ theo đúng schema, không thêm bất kỳ chữ hay lời dẫn nào ngoài JSON." }
              ];
              const retryResp = await env.AI.run(chosenModel, { messages: retryMessages, max_tokens, temperature: 0.2 }).catch(() => null);
              if (retryResp) {
                const rNorm = normalizeAiResponse(retryResp);
                if (rNorm.parsed) {
                  rawOutput = rNorm.rawOutput;
                  parsed = rNorm.parsed;
                }
              }
            } catch (rErr) {
              console.warn("Retry format error:", rErr);
            }
          }

          let guardOutcomeAction = null;
          // 2. Kiểm tra lộ đáp án theo GUARD_RULES
          const context = {
            problem_text: rawProblem || problemText,
            family_id: familyId,
            session_id: sessionId,
          };

          if (parsed) {
            let leakCheck = checkAnswerLeak(promptId, parsed, context);

            // Đợt 23V: Chỉ gọi AI soạn lại RIÊNG bậc bị lộ (max_tokens ~200), không viết lại cả bài
            if (leakCheck.leaked && Array.isArray(parsed?.cac_bac) && leakCheck.leaks?.length > 0) {
              for (const leak of leakCheck.leaks) {
                const sIdx = leak.step_idx;
                if (typeof sIdx === "number" && parsed.cac_bac[sIdx]) {
                  const badStep = parsed.cac_bac[sIdx];
                  let stepFixed = false;
                  if (timeLeft() > 6000) {
                    try {
                      const stepRetryMessages = [
                        { role: "system", content: "Bạn là chuyên gia sư phạm tiểu học. Chỉ trả lời bằng đúng 1 JSON object viết liền 1 dòng, không có chữ dẫn." },
                        { role: "user", content: `Bậc ${sIdx + 1} của bài toán bị lộ đáp án (${leak.illegalValue}). Đề bài: "${rawProblem || problemText}". Hãy soạn lại RIÊNG bậc này với câu hỏi gợi mở KHÔNG chứa đáp án. Chỉ trả đúng 1 JSON object: {"cau_hoi":"...","ky_nang":"${badStep.ky_nang || 'doc_hieu_de'}","dap_an_cho_me":"${badStep.dap_an_cho_me || ''}","goi_y":{"muc_1_do_vat":"...","muc_2_hinh_ve":"..."}}` }
                      ];
                      const stepRetryResp = await env.AI.run(chosenModel, { messages: stepRetryMessages, max_tokens: 200, temperature: 0.2 }).catch(() => null);
                      if (stepRetryResp) {
                        const stepNorm = normalizeAiResponse(stepRetryResp);
                        if (stepNorm.parsed && stepNorm.parsed.cau_hoi) {
                          const testCheck = checkAnswerLeak(promptId, { dap_an_cuoi_cho_me: parsed.dap_an_cuoi_cho_me, cac_bac: [stepNorm.parsed] }, context);
                          if (!testCheck.leaked) {
                            parsed.cac_bac[sIdx] = {
                              ...badStep,
                              cau_hoi: stepNorm.parsed.cau_hoi,
                              goi_y: stepNorm.parsed.goi_y || badStep.goi_y,
                              ky_nang: stepNorm.parsed.ky_nang || badStep.ky_nang,
                            };
                            stepFixed = true;
                            logGuardEvent(env, ctx, {
                              familyId,
                              sessionId,
                              promptId,
                              field: leak.field,
                              beforeText: leak.beforeText,
                              afterText: "Tự động soạn lại riêng bậc không lộ đáp án",
                              outcome: "sua_bac",
                            });
                            guardOutcomeAction = "sua_bac";
                          }
                        }
                      }
                    } catch (sErr) {
                      console.warn("Single-step leak retry error:", sErr);
                    }
                  }
                  // Vẫn lộ hoặc hết giờ: dùng câu an toàn CHỈ CHO RIÊNG BẬC ĐÓ
                  if (!stepFixed) {
                    const kyNang = badStep.ky_nang || 'default';
                    badStep.cau_hoi = SKILL_SAFE_QUESTIONS[kyNang] || DEFAULT_GUARD_FALLBACKS['cac_bac[].cau_hoi'] || "Con thử nói cách suy nghĩ của con ở bước này nhé?";
                    badStep.goi_y = {
                      muc_1_do_vat: DEFAULT_GUARD_FALLBACKS['cac_bac[].goi_y.muc_1_do_vat'] || "Con đếm xem có bao nhiêu nhóm đồ vật nào?",
                      muc_2_hinh_ve: DEFAULT_GUARD_FALLBACKS['cac_bac[].goi_y.muc_2_hinh_ve'] || "Vẽ sơ đồ đoạn thẳng để dễ nhìn hơn nhé."
                    };
                    logGuardEvent(env, ctx, {
                      familyId,
                      sessionId,
                      promptId,
                      field: leak.field,
                      beforeText: leak.beforeText,
                      afterText: badStep.cau_hoi,
                      outcome: "chan_an_toan",
                    });
                  }
                }
              }
              rawOutput = (promptId === "p3_explain_v3" || promptId === "p3_extra_v3" || promptId === "p3_fix_steps_v3") ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
            }
          }

          // 3. Đợt 23V: Máy kiểm phép tính - sửa trực tiếp bằng code (correctLessonMath), bỏ gọi AI viết lại cả bài
          if ((promptId === "p3_explain" || promptId === "p3_explain_v2" || promptId === "p3_explain_v3") && parsed) {
            let mathCheck = validateAllLessonMath(parsed);
            if (mathCheck.hasError) {
              const corrected = correctLessonMath(parsed);
              parsed = corrected.lessonData;
              rawOutput = (promptId === "p3_explain_v3" || promptId === "p3_extra_v3" || promptId === "p3_fix_steps_v3") ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
              corrected.changes.forEach((ch) => {
                logGuardEvent(env, ctx, {
                  familyId,
                  sessionId,
                  promptId,
                  field: ch.field,
                  beforeText: ch.expr,
                  afterText: ch.correction,
                  outcome: "sua_phep_tinh",
                });
                guardOutcomeAction = "sua_phep_tinh";
              });
              mathCheck = validateAllLessonMath(parsed);
            }

            if (parsed && typeof parsed === "object") {
              parsed.math_verified = {
                count: mathCheck.verifiedCount,
                calculations: mathCheck.calculations,
                summary: mathCheck.summary,
              };
              rawOutput = (promptId === "p3_explain_v3" || promptId === "p3_extra_v3" || promptId === "p3_fix_steps_v3") ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
            }
          }

          const checkStart = Date.now();
          const validated = await validateAndGuard(promptId, rawOutput, context, env, ctx);

          // Cập nhật validator_json vào learning_sessions nếu có sessionId
          if (sessionId && env.DB) {
            try {
              await env.DB.prepare("UPDATE learning_sessions SET validator_json = ? WHERE id = ?")
                .bind(JSON.stringify(validated.validator), sessionId)
                .run();
            } catch (vErr) {
              console.warn("Update session validator error:", vErr);
            }
          }

          // Đợt 20 · Chặng 1: Lưu bài vào lesson_cache & ghi log ai_calls đo token (fix steps không lưu cache)
          if (isExplain && cacheKey && validated.response && promptId !== "p3_fix_steps_v3") {
            await storeInLessonCache(env, {
              cacheKey,
              problemText: rawProblem,
              grade,
              bookSeries,
              subject,
              promptVersion: promptId === "p3_explain_v3" ? "v3r28" : (promptId === "p3_explain_v2" ? "v2" : "v1"),
              childProfileHash,
              lessonObj: validated.response,
              tokensSaved: 1950,
            });
          }
          const check_ms = Date.now() - checkStart;

          const elapsed = Date.now() - chatStartedAt;
          const timing = {
            profile_ms,
            cache_ms,
            ai_ms,
            check_ms,
            total_ms: elapsed,
          };

          await logAiCall(env, {
            family_id: familyId,
            session_id: sessionId,
            endpoint: "/chat",
            prompt_id: promptId || "p3_explain_v2",
            prompt_version: promptId === "p3_explain_v3" ? "v3r28" : (promptId === "p3_explain_v2" ? "v2" : "v1"),
            model: chosenModel,
            tokens_in: estimateTokens(JSON.stringify(messages)),
            tokens_out: estimateTokens(rawOutput),
            latency_ms: elapsed,
            ms: elapsed,
            ok: 1,
            status: isPrefetch ? "prefetch" : "ok",
            error_code: guardOutcomeAction,
            cache_hit: 0,
            estimated: 1,
          });

          return jsonResponse({
            response: validated.response,
            guarded: validated.guarded,
            error_code: validated.error_code,
            validator: validated.validator,
            timing,
          }, 200, corsHeaders);
        } catch (err) {
          console.error("AI /chat error:", err);
          const elapsed = Date.now() - chatStartedAt;
          await logAiCall(env, {
            family_id: familyId,
            session_id: sessionId,
            endpoint: "/chat",
            prompt_id: promptId || "p3_explain_v2",
            prompt_version: promptId === "p3_explain_v2" ? "v2" : "v1",
            model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
            tokens_in: estimateTokens(JSON.stringify(messages)),
            tokens_out: 0,
            latency_ms: elapsed,
            ms: elapsed,
            ok: 0,
            status: "error",
            error_code: err?.message || "ai_service_error",
            cache_hit: 0,
            estimated: 1,
          }).catch(() => {});
          return jsonResponse({ error: "ai_service_error", message: err?.message || "Gấu đang bận một chút, mẹ bấm Thử lại nhé." }, 503, corsHeaders);
        }
      }

      if (pathname === "/fix-english" && request.method === "POST") {
        const { text = "", tone = "executive", model } = await request.json().catch(() => ({}));
        if (!text) return jsonResponse({ error: "Thiếu trường 'text'" }, 400, corsHeaders);

        const systemPrompt = `You are an elite English coach for Tech Leads. Elevate this sentence with tone "${tone}". Respond ONLY in valid JSON:
{ "is_correct": false, "naturalness_score": 6, "issues": ["..."], "corrected": "...", "alternatives": ["..."], "explanation": "...", "good_parts": "..." }`;

        try {
          const chosenModel = model || "@cf/meta/llama-3.1-70b-instruct";
          let response;
          try {
            response = await env.AI.run(chosenModel, {
              messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `Refine: "${text}"` }],
              temperature: 0.2,
              max_tokens: 1000,
            });
          } catch (mErr) {
            console.warn("Primary model error in fix-english, fallback to llama-3.1-8b-instruct-fp8:", mErr);
            response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fp8", {
              messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `Refine: "${text}"` }],
              temperature: 0.2,
              max_tokens: 1000,
            });
          }

          const raw = response.response || "";
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { corrected: raw };
          return jsonResponse(data, 200, corsHeaders);
        } catch (err) {
          console.error("AI /fix-english error:", err);
          return jsonResponse({ error: err.message || "Lỗi gọi mô hình AI" }, 500, corsHeaders);
        }
      }

      // =====================================================================
      // 5. 💾 D1 DATABASE (SQLITE) — PROTECTED (P2.9)
      // =====================================================================
      if (pathname.startsWith("/db/")) {
        const adminSession = await authenticateAdmin(request, env);
        if (!adminSession) {
          return jsonResponse({ error: "Unauthorized: Yêu cầu quyền Quản trị viên (Authorization: Bearer <ADMIN_TOKEN>)" }, 401, corsHeaders);
        }
      }

      if (pathname === "/db/query" && request.method === "POST") {
        const { query = "", params = [] } = await request.json().catch(() => ({}));
        if (!query) return jsonResponse({ error: "Thiếu trường 'query'" }, 400, corsHeaders);
        const stmt = env.DB.prepare(query);
        const boundStmt = params.length > 0 ? stmt.bind(...params) : stmt;
        const result = await boundStmt.all();
        return jsonResponse(result, 200, corsHeaders);
      }

      if (pathname === "/db/execute" && request.method === "POST") {
        const { query = "", params = [] } = await request.json().catch(() => ({}));
        if (!query) return jsonResponse({ error: "Thiếu trường 'query'" }, 400, corsHeaders);
        const stmt = env.DB.prepare(query);
        const boundStmt = params.length > 0 ? stmt.bind(...params) : stmt;
        const result = await boundStmt.run();
        return jsonResponse(result, 200, corsHeaders);
      }

      if (pathname === "/db/tables" && request.method === "GET") {
        const result = await env.DB.prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%';"
        ).all();
        return jsonResponse({ tables: result.results.map((r) => r.name) }, 200, corsHeaders);
      }

      if (pathname.startsWith("/db/kv/") && request.method === "GET") {
        const rawKey = pathname.replace("/db/kv/", "");
        const key = decodeURIComponent(rawKey);
        await ensureKvTable(env.DB);
        const row = await env.DB.prepare(
          "SELECT key, value, updated_at FROM _kv_store WHERE key = ? OR key = ? ORDER BY updated_at DESC LIMIT 1"
        ).bind(key, rawKey).first();
        if (!row) return jsonResponse({ key, value: null, found: false }, 200, corsHeaders);
        let parsed = row.value;
        try { parsed = JSON.parse(row.value); } catch {}
        return jsonResponse({ key: row.key, value: parsed, updated_at: row.updated_at, found: true }, 200, corsHeaders);
      }

      if (pathname.startsWith("/db/kv/") && request.method === "POST") {
        const rawKey = pathname.replace("/db/kv/", "");
        const key = decodeURIComponent(rawKey);
        const encodedKey = encodeURIComponent(key);
        const body = await request.json().catch(() => ({}));
        const valStr = typeof body.value === "string" ? body.value : JSON.stringify(body.value !== undefined ? body.value : body);
        await ensureKvTable(env.DB);
        await env.DB.prepare(
          "INSERT INTO _kv_store (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP"
        ).bind(key, valStr).run();
        if (encodedKey !== key) {
          await env.DB.prepare(
            "INSERT INTO _kv_store (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP"
          ).bind(encodedKey, valStr).run();
        }
        return jsonResponse({ success: true, key, saved: true }, 200, corsHeaders);
      }

      // =====================================================================
      // 6. HEALTH CHECK & API SITEMAP (GET /)
      // =====================================================================
      return jsonResponse(
        {
          service: "Advanced Cloudflare AI, Vectorize, R2 & D1 Gateway",
          owner: "Huyen Tran (trann46698)",
          status: "online",
          version: "3.0.0",
          gateway_url: "https://ai-gateway-worker.trann46698.workers.dev",
          modules: {
            "1_AI_IMAGE_GENERATION": [
              "POST /images/generate     -> Tạo ảnh nghệ thuật từ mô tả văn bản (Flux 1 / SDXL)"
            ],
            "2_VECTOR_SEARCH_RAG": [
              "POST /search/index        -> Đánh chỉ mục bài học/tài liệu vào Vector Database",
              "POST /search/vector       -> Tìm kiếm ngữ nghĩa thông minh bằng câu hỏi tự nhiên"
            ],
            "3_VISION_AND_IMAGES": [
              "POST /vision/analyze      -> Chụp ảnh bé & AI phân tích hoạt động, cảm xúc (lưu R2 + D1)",
              "POST /vision/ocr          -> Bóc tách chữ tiếng Anh từ ảnh chụp tài liệu/bài tập",
              "GET  /images/:id          -> Hiển thị ảnh trực tiếp từ R2 (cho thẻ <img>)",
              "GET  /child-photos        -> Xem album lịch sử ảnh bé & lời khuyên AI"
            ],
            "4_VOICE_AND_CHAT": [
              "POST /stt                 -> Bóc băng âm thanh thành text (OpenAI Whisper)",
              "POST /tts                 -> Đọc văn bản thành giọng MP3 bản xứ (Deepgram Aura-2)",
              "POST /chat                -> Hội thoại thông minh (Llama 3.3 70B Fast)",
              "POST /fix-english         -> Nâng cấp câu chuẩn Tech Lead"
            ],
            "5_D1_DATABASE": [
              "POST /db/query            -> SQL SELECT query",
              "POST /db/execute          -> SQL INSERT/UPDATE/DELETE/CREATE",
              "GET  /db/tables           -> Xem danh sách các bảng trong D1",
              "GET  /db/kv/:key          -> Lấy dữ liệu Key-Value",
              "POST /db/kv/:key          -> Lưu dữ liệu Key-Value"
            ]
          }
        },
        200,
        corsHeaders
      );
    } catch (err) {
      return jsonResponse({ error: err.message, stack: err.stack }, 500, corsHeaders);
    }
  },

  // Cron Trigger: Nightly cleanup of technical data (Prompt 00 Section 10 & Prompt 14 Section 1.2)
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      try {
        await env.DB.prepare("DELETE FROM login_attempts WHERE created_at < datetime('now', '-7 days')").run();
        await env.DB.prepare("DELETE FROM auth_sessions WHERE (expires_at < datetime('now', '-30 days') OR revoked_at < datetime('now', '-30 days'))").run();
        await env.DB.prepare("DELETE FROM ai_calls WHERE created_at < datetime('now', '-90 days')").run();
        // Dot 14: Giữ nhật ký guard_log 30 ngày rồi tự xoá
        await env.DB.prepare("DELETE FROM guard_log WHERE created_at < datetime('now', '-30 days')").run();
      } catch (err) {
        console.error("Scheduled cleanup error:", err);
      }
    })());
  },
};

function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
  });
}

async function ensureDot14Tables(db) {
  if (!db) return;
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS guard_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id TEXT,
        session_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        prompt_id TEXT,
        field TEXT,
        before_text TEXT,
        after_text TEXT,
        outcome TEXT CHECK(outcome IN ('regenerated','fallback','leaked'))
      );
    `).run();
    await db.prepare("CREATE INDEX IF NOT EXISTS idx_guard_log_family_created ON guard_log(family_id, created_at);").run();
  } catch (_) {}
}

async function ensureKvTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS _kv_store (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `).run();
}

async function ensureChildPhotosTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS child_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id TEXT,
      image_url TEXT,
      prompt TEXT,
      analysis TEXT,
      child_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `).run();
}
