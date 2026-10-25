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

import { handleV1Route, jsonResponse as v1JsonResponse, authenticateAdmin } from "./v1_routes.js";
import { validateAndGuardAiOutput } from "./admin_stitch_routes.js";
import { validateAndGuard, checkAnswerLeak, logGuardEvent, DEFAULT_GUARD_FALLBACKS } from "./guard.js";
import { handleCheckWorkRead, handleCheckWorkGrade, handleCheckWorkGet, handleCheckWorkHistory } from "./check_work.js";
import { handleTeachBackTranscribe, handleTeachBackGrade, handleTeachBackConfirm } from "./teach_back.js";

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

      // 📷 POST /vision/analyze -> Chụp ảnh bé & phân tích
      if (pathname === "/vision/analyze" && request.method === "POST") {
        let imageBytes = null;
        let mimeType = "image/jpeg";
        let prompt = "Phân tích bức ảnh này của bé: bé đang làm hoạt động gì, biểu cảm và tâm trạng thế nào, có chi tiết an toàn hay lời khuyên nào bổ ích cho phụ huynh không?";
        let childName = "Bé";

        const contentType = request.headers.get("content-type") || "";

        if (contentType.includes("multipart/form-data")) {
          const formData = await request.formData();
          const file = formData.get("image") || formData.get("file");
          if (file && typeof file === "object" && "arrayBuffer" in file) {
            imageBytes = new Uint8Array(await file.arrayBuffer());
            mimeType = file.type || "image/jpeg";
          }
          if (formData.has("prompt")) prompt = String(formData.get("prompt"));
          if (formData.has("childName")) childName = String(formData.get("childName"));
        } else if (contentType.includes("application/json")) {
          const body = await request.json();
          if (body.prompt) prompt = body.prompt;
          if (body.childName) childName = body.childName;

          if (body.image) {
            const base64Clean = body.image.replace(/^data:image\/\w+;base64,/, "");
            const binaryStr = atob(base64Clean);
            imageBytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) imageBytes[i] = binaryStr.charCodeAt(i);
          } else if (body.imageUrl) {
            const imgRes = await fetch(body.imageUrl);
            imageBytes = new Uint8Array(await imgRes.arrayBuffer());
            mimeType = imgRes.headers.get("content-type") || "image/jpeg";
          }
        } else {
          imageBytes = new Uint8Array(await request.arrayBuffer());
          mimeType = contentType || "image/jpeg";
        }

        if (!imageBytes || imageBytes.length === 0) {
          return jsonResponse({ error: "Không tìm thấy dữ liệu hình ảnh để phân tích." }, 400, corsHeaders);
        }

        const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
        const fileId = `child_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
        if (env.IMAGES) {
          await env.IMAGES.put(fileId, imageBytes, {
            httpMetadata: { contentType: mimeType },
          });
        }
        const imageUrl = `${url.origin}/images/${fileId}`;

        let aiAnalysis = "";
        const runVision = async (textPrompt) => {
          return await env.AI.run("@cf/meta/llama-3.2-11b-vision-instruct", {
            prompt: textPrompt,
            image: [...imageBytes],
            max_tokens: 600,
            temperature: 0.2,
          });
        };

        try {
          const finalPrompt = prompt.trim().toLowerCase() === "agree"
            ? "agree"
            : `${prompt}\n(Vui lòng trả lời bằng tiếng Việt thân thiện, tâm lý, xúc tích và rõ ràng).`;
          const visionResponse = await runVision(finalPrompt);
          aiAnalysis = visionResponse.response || visionResponse.description || "";
        } catch (visionErr) {
          if (visionErr.message && visionErr.message.includes("5016")) {
            try {
              // Tự động chấp nhận Meta Llama License
              await runVision("agree");
              const retryVision = await runVision(`${prompt}\n(Vui lòng trả lời bằng tiếng Việt thân thiện, tâm lý, xúc tích và rõ ràng).`);
              aiAnalysis = retryVision.response || retryVision.description || "";
            } catch (retryErr) {
              aiAnalysis = `Không thể phân tích ảnh qua Vision AI: ${retryErr.message}`;
            }
          } else {
            aiAnalysis = `Không thể phân tích ảnh qua Vision AI: ${visionErr.message}`;
          }
        }

        await ensureChildPhotosTable(env.DB);
        const insertResult = await env.DB.prepare(
          "INSERT INTO child_photos (file_id, image_url, prompt, analysis, child_name, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP);"
        ).bind(fileId, imageUrl, prompt, aiAnalysis, childName).run();

        return jsonResponse(
          {
            success: true,
            id: insertResult.meta?.last_row_id || null,
            file_id: fileId,
            image_url: imageUrl,
            child_name: childName,
            prompt,
            analysis: aiAnalysis,
            saved_to_db: true,
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
        const { messages = [], max_tokens = 800, temperature = 0.7, model } = await request.json().catch(() => ({}));
        if (!Array.isArray(messages) || messages.length === 0) {
          return jsonResponse({ error: "Thiếu mảng 'messages'" }, 400, corsHeaders);
        }
        try {
          const chosenModel = model || "@cf/meta/llama-3.1-70b-instruct";
          let response;
          try {
            response = await env.AI.run(chosenModel, { messages, max_tokens, temperature });
          } catch (mErr) {
            console.warn("Primary model error, fallback to llama-3.1-8b-instruct-fp8:", mErr);
            response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fp8", { messages, max_tokens, temperature });
          }
          let rawOutput = response.response || "";
          const promptId = request.headers.get("X-Prompt-Id") || "";
          const sessionId = request.headers.get("X-Session-Id") || "";
          const problemText = request.headers.get("X-Problem-Text") || "";
          const familyId = request.headers.get("X-Family-Id") || "";

          // Phân tích sơ bộ để kiểm tra định dạng và rò rỉ đáp án
          let parsed = null;
          let jsonClean = rawOutput.trim();
          const match = jsonClean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (match) jsonClean = match[1];
          try {
            parsed = JSON.parse(jsonClean);
          } catch (_) {}

          // 1. Nếu định dạng sai (hỏng JSON hoặc thiếu bậc), retry 1 lần với yêu cầu JSON
          if (!parsed || (promptId === "p3_explain" && (!Array.isArray(parsed?.cac_bac) || parsed.cac_bac.length < 3))) {
            try {
              const retryMessages = [
                ...messages,
                { role: "assistant", content: rawOutput },
                { role: "user", content: "Lưu ý: Chỉ trả lời bằng định dạng JSON hợp lệ theo đúng schema, không thêm bất kỳ chữ hay lời dẫn nào ngoài JSON." }
              ];
              const retryResp = await env.AI.run(chosenModel, { messages: retryMessages, max_tokens, temperature: 0.2 }).catch(() => null);
              if (retryResp && retryResp.response) {
                rawOutput = retryResp.response;
                let rClean = rawOutput.trim();
                const m2 = rClean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                if (m2) rClean = m2[1];
                try {
                  parsed = JSON.parse(rClean);
                } catch (_) {}
              }
            } catch (rErr) {
              console.warn("Retry format error:", rErr);
            }
          }

          // 2. Kiểm tra lộ đáp án theo GUARD_RULES
          const context = {
            problem_text: problemText,
            family_id: familyId,
            session_id: sessionId,
          };

          if (parsed) {
            let leakCheck = checkAnswerLeak(promptId, parsed, context);

            // Nếu phát hiện lộ: gọi lại AI một lần với câu nhắc cảnh báo chặt chẽ
            if (leakCheck.leaked) {
              try {
                const retryPrompt = `CẢNH BÁO: Câu hỏi gợi mở cho con tuyệt đối không được chứa đáp án (${leakCheck.leaks.map(l => l.illegalValue).join(", ")}). Hãy soạn lại câu hỏi mở để con tự suy nghĩ và tìm ra câu trả lời. Chỉ trả JSON.`;
                const retryMessages = [
                  ...messages,
                  { role: "assistant", content: rawOutput },
                  { role: "user", content: retryPrompt }
                ];
                const leakRetryResp = await env.AI.run(chosenModel, { messages: retryMessages, max_tokens, temperature: 0.2 }).catch(() => null);
                if (leakRetryResp && leakRetryResp.response) {
                  let rClean = leakRetryResp.response.trim();
                  const m3 = rClean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                  if (m3) rClean = m3[1];
                  let secondParsed = null;
                  try { secondParsed = JSON.parse(rClean); } catch (_) {}
                  if (secondParsed) {
                    const secondCheck = checkAnswerLeak(promptId, secondParsed, context);
                    if (!secondCheck.leaked) {
                      // Tự động soạn lại thành công
                      parsed = secondParsed;
                      rawOutput = JSON.stringify(parsed, null, 2);
                      leakCheck.leaks.forEach(l => {
                        logGuardEvent(env, ctx, {
                          familyId,
                          sessionId,
                          promptId,
                          field: l.field,
                          beforeText: l.beforeText,
                          afterText: "Tự động soạn lại không lộ đáp án",
                          outcome: "regenerated",
                        });
                      });
                    }
                  }
                }
              } catch (lErr) {
                console.warn("Retry leak error:", lErr);
              }
            }
          }

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

          return jsonResponse({
            response: validated.response,
            guarded: validated.guarded,
            error_code: validated.error_code,
            validator: validated.validator,
          }, 200, corsHeaders);
        } catch (err) {
          console.error("AI /chat error:", err);
          return jsonResponse({ error: err.message || "Lỗi gọi mô hình AI" }, 500, corsHeaders);
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
        if (!row) return jsonResponse({ key, value: null, found: false }, 404, corsHeaders);
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
