/**
 * AI, DATABASE (D1) & IMAGE STORAGE (R2) GATEWAY WORKER
 * 
 * 🌐 Live URL: https://ai-gateway-worker.trann46698.workers.dev
 * 
 * Các dịch vụ tích hợp:
 * 1. 🎤 STT (OpenAI Whisper):             POST /stt
 * 2. 🔊 TTS (Deepgram Aura-2):           POST /tts
 * 3. 🧠 LLM Chat (Meta Llama 3.3 70B):   POST /chat
 * 4. ✍️ Fix English (Tech Lead Coach):   POST /fix-english
 * 5. 📷 Vision AI (Phân tích ảnh bé):    POST /vision/analyze
 * 6. 🖼️ Lưu trữ ảnh R2:                  POST /images/upload  | GET /images/:id
 * 7. 👶 Lịch sử ảnh & phân tích:        GET  /child-photos
 * 8. 💾 Database D1 SQL Query:           POST /db/query       | POST /db/execute
 * 9. 🔑 Key-Value Store D1:              GET  /db/kv/:key     | POST /db/kv/:key
 */

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      // =====================================================================
      // 1. VISION AI & LƯU TRỮ HÌNH ẢNH (CHỤP HÌNH BÉ & PHÂN TÍCH)
      // =====================================================================

      // 📷 POST /vision/analyze
      // Nhận ảnh (binary, formData hoặc JSON base64/imageUrl) -> Lưu R2 -> Phân tích bằng Llama 3.2 Vision -> Lưu D1
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
            // Base64 string
            const base64Clean = body.image.replace(/^data:image\/\w+;base64,/, "");
            const binaryStr = atob(base64Clean);
            imageBytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
              imageBytes[i] = binaryStr.charCodeAt(i);
            }
          } else if (body.imageUrl) {
            // Fetch từ URL
            const imgRes = await fetch(body.imageUrl);
            imageBytes = new Uint8Array(await imgRes.arrayBuffer());
            mimeType = imgRes.headers.get("content-type") || "image/jpeg";
          }
        } else {
          // Binary trực tiếp trong request body
          imageBytes = new Uint8Array(await request.arrayBuffer());
          mimeType = contentType || "image/jpeg";
        }

        if (!imageBytes || imageBytes.length === 0) {
          return jsonResponse({ error: "Không tìm thấy dữ liệu hình ảnh để phân tích." }, 400, corsHeaders);
        }

        // 1. Lưu ảnh vào R2 Storage
        const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
        const fileId = `child_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
        if (env.IMAGES) {
          await env.IMAGES.put(fileId, imageBytes, {
            httpMetadata: { contentType: mimeType },
          });
        }
        const imageUrl = `${url.origin}/images/${fileId}`;

        // 2. Gọi Vision AI (Llama 3.2 11B Vision Instruct của Cloudflare)
        let aiAnalysis = "";
        try {
          const visionResponse = await env.AI.run("@cf/meta/llama-3.2-11b-vision-instruct", {
            prompt: `${prompt}\n(Vui lòng trả lời bằng tiếng Việt thân thiện, tâm lý và chi tiết).`,
            image: [...imageBytes],
            max_tokens: 1000,
          });
          aiAnalysis = visionResponse.response || visionResponse.description || "";
        } catch (visionErr) {
          console.error("Vision AI error:", visionErr);
          aiAnalysis = `Không thể phân tích ảnh qua Vision AI: ${visionErr.message}`;
        }

        // 3. Tự động lưu thông tin & kết quả vào D1 Database
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

      // 🖼️ GET /images/:id -> Xem hoặc tải ảnh trực tiếp từ R2 (cho thẻ <img src="...">)
      if (pathname.startsWith("/images/") && request.method === "GET") {
        const fileId = pathname.replace("/images/", "");
        if (!env.IMAGES) {
          return new Response("R2 Storage not configured", { status: 500, headers: corsHeaders });
        }

        const object = await env.IMAGES.get(fileId);
        if (!object) {
          return new Response("Image not found", { status: 404, headers: corsHeaders });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("Access-Control-Allow-Origin", "*");
        headers.set("Cache-Control", "public, max-age=31536000, immutable");

        return new Response(object.body, { headers });
      }

      // 🖼️ POST /images/upload -> Chỉ upload ảnh lên R2 lấy link (không cần phân tích AI)
      if (pathname === "/images/upload" && request.method === "POST") {
        const contentType = request.headers.get("content-type") || "image/jpeg";
        let imageBytes = null;

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
          return jsonResponse({ error: "No image data" }, 400, corsHeaders);
        }

        const fileId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
        await env.IMAGES.put(fileId, imageBytes, {
          httpMetadata: { contentType: "image/jpeg" },
        });

        return jsonResponse(
          {
            success: true,
            file_id: fileId,
            image_url: `${url.origin}/images/${fileId}`,
          },
          200,
          corsHeaders
        );
      }

      // 👶 GET /child-photos -> Lấy danh sách lịch sử ảnh của bé và kết quả phân tích AI từ D1
      if (pathname === "/child-photos" && request.method === "GET") {
        await ensureChildPhotosTable(env.DB);
        const limit = Number(url.searchParams.get("limit")) || 20;
        const result = await env.DB.prepare(
          "SELECT id, file_id, image_url, prompt, analysis, child_name, created_at FROM child_photos ORDER BY id DESC LIMIT ?;"
        ).bind(limit).all();

        return jsonResponse({ photos: result.results }, 200, corsHeaders);
      }

      // =====================================================================
      // 2. CÁC ROUTE AI KHÁC (STT, TTS, CHAT, FIX ENGLISH)
      // =====================================================================

      // 🎤 STT: Nhận diện giọng nói từ âm thanh (OpenAI Whisper)
      if (pathname === "/stt" && request.method === "POST") {
        const audioBuffer = await request.arrayBuffer();
        if (!audioBuffer || audioBuffer.byteLength === 0) {
          return jsonResponse({ error: "Chưa gửi dữ liệu audio" }, 400, corsHeaders);
        }

        const response = await env.AI.run("@cf/openai/whisper", {
          audio: [...new Uint8Array(audioBuffer)],
        });

        return jsonResponse({ text: response.text || "" }, 200, corsHeaders);
      }

      // 🔊 TTS: Đọc văn bản thành file âm thanh MP3 (Deepgram Aura-2)
      if (pathname === "/tts" && request.method === "POST") {
        const { text = "" } = await request.json().catch(() => ({}));
        if (!text) {
          return jsonResponse({ error: "Thiếu trường 'text'" }, 400, corsHeaders);
        }

        const audio = await env.AI.run("@cf/deepgram/aura-2-en", { text });
        return new Response(audio, {
          headers: {
            ...corsHeaders,
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, max-age=3600",
          },
        });
      }

      // 🧠 CHAT: Llama 3.3 70B Fast
      if (pathname === "/chat" && request.method === "POST") {
        const { messages = [], max_tokens = 800, temperature = 0.7 } = await request.json().catch(() => ({}));
        if (!Array.isArray(messages) || messages.length === 0) {
          return jsonResponse({ error: "Thiếu mảng 'messages'" }, 400, corsHeaders);
        }

        const response = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
          messages,
          max_tokens,
          temperature,
        });

        return jsonResponse({ response: response.response || "" }, 200, corsHeaders);
      }

      // ✍️ FIX ENGLISH: Nâng cấp câu chuẩn Tech Lead
      if (pathname === "/fix-english" && request.method === "POST") {
        const { text = "", tone = "executive" } = await request.json().catch(() => ({}));
        if (!text) {
          return jsonResponse({ error: "Thiếu trường 'text'" }, 400, corsHeaders);
        }

        const systemPrompt = `You are an elite English coach for Tech Leads. Elevate this sentence with tone "${tone}". Respond ONLY in valid JSON with fields: is_correct (bool), naturalness_score (int 1-10), issues (array of strings in Vietnamese), corrected (string), alternatives (array of 3 strings), explanation (string in Vietnamese), good_parts (string in Vietnamese).`;

        const response = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Refine: "${text}"` },
          ],
          temperature: 0.2,
          max_tokens: 1000,
        });

        const raw = response.response || "";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { corrected: raw };

        return jsonResponse(data, 200, corsHeaders);
      }

      // =====================================================================
      // 3. DATABASE D1 (SQLITE CLOUD) ROUTES
      // =====================================================================

      // 💾 DB QUERY: SELECT
      if (pathname === "/db/query" && request.method === "POST") {
        const { query = "", params = [] } = await request.json().catch(() => ({}));
        if (!query) return jsonResponse({ error: "Thiếu trường 'query'" }, 400, corsHeaders);

        const stmt = env.DB.prepare(query);
        const boundStmt = params.length > 0 ? stmt.bind(...params) : stmt;
        const result = await boundStmt.all();
        return jsonResponse(result, 200, corsHeaders);
      }

      // 💾 DB EXECUTE: INSERT, UPDATE, DELETE, CREATE TABLE
      if (pathname === "/db/execute" && request.method === "POST") {
        const { query = "", params = [] } = await request.json().catch(() => ({}));
        if (!query) return jsonResponse({ error: "Thiếu trường 'query'" }, 400, corsHeaders);

        const stmt = env.DB.prepare(query);
        const boundStmt = params.length > 0 ? stmt.bind(...params) : stmt;
        const result = await boundStmt.run();
        return jsonResponse(result, 200, corsHeaders);
      }

      // 💾 DB BATCH: Nhiều lệnh SQL trong transaction
      if (pathname === "/db/batch" && request.method === "POST") {
        const { statements = [] } = await request.json().catch(() => ({}));
        if (!Array.isArray(statements) || statements.length === 0) {
          return jsonResponse({ error: "Thiếu mảng 'statements'" }, 400, corsHeaders);
        }

        const prepared = statements.map((s) => {
          const stmt = env.DB.prepare(s.query);
          return s.params && s.params.length > 0 ? stmt.bind(...s.params) : stmt;
        });

        const results = await env.DB.batch(prepared);
        return jsonResponse({ success: true, results }, 200, corsHeaders);
      }

      // 📊 DB TABLES: Xem danh sách các bảng
      if (pathname === "/db/tables" && request.method === "GET") {
        const result = await env.DB.prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%';"
        ).all();
        return jsonResponse({ tables: result.results.map((r) => r.name) }, 200, corsHeaders);
      }

      // 🔑 DB KV STORE: GET /db/kv/:key
      if (pathname.startsWith("/db/kv/") && request.method === "GET") {
        const key = pathname.replace("/db/kv/", "");
        await ensureKvTable(env.DB);
        const row = await env.DB.prepare("SELECT value, updated_at FROM _kv_store WHERE key = ?").bind(key).first();
        if (!row) return jsonResponse({ key, value: null, found: false }, 404, corsHeaders);
        let parsed = row.value;
        try { parsed = JSON.parse(row.value); } catch {}
        return jsonResponse({ key, value: parsed, updated_at: row.updated_at, found: true }, 200, corsHeaders);
      }

      // 🔑 DB KV STORE: POST /db/kv/:key
      if (pathname.startsWith("/db/kv/") && request.method === "POST") {
        const key = pathname.replace("/db/kv/", "");
        const body = await request.json().catch(() => ({}));
        const valStr = typeof body.value === "string" ? body.value : JSON.stringify(body.value !== undefined ? body.value : body);
        await ensureKvTable(env.DB);
        await env.DB.prepare(
          "INSERT INTO _kv_store (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP"
        ).bind(key, valStr).run();

        return jsonResponse({ success: true, key, saved: true }, 200, corsHeaders);
      }

      // =====================================================================
      // 4. HEALTH CHECK & API DOCS (GET /)
      // =====================================================================
      return jsonResponse(
        {
          service: "Cloudflare AI, R2 Storage & D1 Database Gateway",
          owner: "Huyen Tran (trann46698)",
          status: "online",
          version: "2.0.0",
          gateway_url: "https://ai-gateway-worker.trann46698.workers.dev",
          features: {
            child_vision_ai: [
              "POST /vision/analyze -> Upload ảnh bé & phân tích tâm lý, biểu cảm, hoạt động (lưu R2 + D1)",
              "GET  /child-photos   -> Xem danh sách lịch sử ảnh bé và kết quả phân tích AI",
              "GET  /images/:id     -> Hiển thị ảnh trực tiếp từ R2 (cho thẻ <img>)",
              "POST /images/upload  -> Upload ảnh lấy link R2 mà không phân tích",
            ],
            ai: [
              "POST /stt            -> Bóc băng âm thanh thành text (OpenAI Whisper)",
              "POST /tts            -> Đọc văn bản thành MP3 (Deepgram Aura-2)",
              "POST /chat           -> Hội thoại thông minh (Llama 3.3 70B)",
              "POST /fix-english    -> Sửa văn phong chuẩn Tech Lead",
            ],
            database: [
              "POST /db/query       -> SELECT SQL query",
              "POST /db/execute     -> INSERT/UPDATE/DELETE/CREATE SQL",
              "POST /db/batch       -> Chạy nhiều lệnh SQL transaction",
              "GET  /db/tables      -> Xem các bảng trong D1",
              "GET  /db/kv/:key     -> Lấy Key-Value",
              "POST /db/kv/:key     -> Lưu Key-Value",
            ],
          },
        },
        200,
        corsHeaders
      );
    } catch (err) {
      return jsonResponse({ error: err.message, stack: err.stack }, 500, corsHeaders);
    }
  },
};

function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      ...headers,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
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
