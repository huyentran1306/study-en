/**
 * STANDALONE AI & DATABASE GATEWAY WORKER (CLOUDFLARE)
 * 
 * ĐÃ DEPLOY VÀ ĐANG CHẠY TRỰC TIẾP TẠI:
 * 🌐 https://ai-gateway-worker.trann46698.workers.dev
 * 
 * Database D1 đã bind: ai-gateway-db (binding: env.DB)
 * AI đã bind: Cloudflare Workers AI (binding: env.AI)
 * 
 * -----------------------------------------------------------------------------
 * DANH SÁCH CÁC ROUTE CÓ THỂ GỌI TRỰC TIẾP TỪ BẤT KỲ APP NGOÀI NÀO:
 * -----------------------------------------------------------------------------
 * 1. 🎤 STT:          POST /stt          (Gửi binary audio -> nhận { text })
 * 2. 🔊 TTS:          POST /tts          (Gửi { text } -> nhận binary audio/mpeg)
 * 3. 🧠 Chat AI:      POST /chat         (Gửi { messages: [...] } -> nhận { response })
 * 4. ✍️ Sửa câu:      POST /fix-english  (Gửi { text, tone } -> nhận JSON đánh giá & câu sửa)
 * 5. 💾 DB Query:     POST /db/query     (Gửi { query: "SELECT...", params: [] } -> nhận { results })
 * 6. 💾 DB Execute:   POST /db/execute   (Gửi { query: "INSERT/UPDATE/CREATE...", params: [] })
 * 7. 💾 DB Batch:     POST /db/batch     (Gửi { statements: [...] })
 * 8. 🔑 DB Key-Value: GET  /db/kv/:key   (Lấy nhanh dữ liệu theo key)
 * 9. 🔑 DB Key-Value: POST /db/kv/:key   (Lưu nhanh dữ liệu { value: ... } theo key)
 * 10. 📊 DB Tables:   GET  /db/tables    (Xem danh sách các bảng trong database)
 */

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Preflight CORS: Cho phép gọi từ mọi domain (localhost, web cá nhân, app cty, mobile)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      // =====================================================================
      // 1. CÁC ROUTE TRÍ TUỆ NHÂN TẠO (AI)
      // =====================================================================

      // 🎤 STT: Nhận diện giọng nói từ file âm thanh (OpenAI Whisper)
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

      // 🔊 TTS: Đọc văn bản thành giọng đọc tự nhiên (Deepgram Aura-2)
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

      // 🧠 CHAT: Trò chuyện và xử lý logic với Meta Llama 3.3 70B
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

      // ✍️ FIX ENGLISH: Nâng cấp câu chuẩn phong cách Tech Lead
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
      // 2. CÁC ROUTE DATABASE D1 (SQLITE CLOUD)
      // =====================================================================

      // 💾 DB QUERY: SELECT (trả về danh sách bản ghi)
      if (pathname === "/db/query" && request.method === "POST") {
        const { query = "", params = [] } = await request.json().catch(() => ({}));
        if (!query) {
          return jsonResponse({ error: "Thiếu trường 'query'" }, 400, corsHeaders);
        }

        const stmt = env.DB.prepare(query);
        const boundStmt = params.length > 0 ? stmt.bind(...params) : stmt;
        const result = await boundStmt.all();

        return jsonResponse(result, 200, corsHeaders);
      }

      // 💾 DB EXECUTE: INSERT, UPDATE, DELETE, CREATE TABLE
      if (pathname === "/db/execute" && request.method === "POST") {
        const { query = "", params = [] } = await request.json().catch(() => ({}));
        if (!query) {
          return jsonResponse({ error: "Thiếu trường 'query'" }, 400, corsHeaders);
        }

        const stmt = env.DB.prepare(query);
        const boundStmt = params.length > 0 ? stmt.bind(...params) : stmt;
        const result = await boundStmt.run();

        return jsonResponse(result, 200, corsHeaders);
      }

      // 💾 DB BATCH: Thực thi nhiều lệnh SQL trong một transaction
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

      // 📊 DB TABLES: Xem danh sách các bảng hiện có
      if (pathname === "/db/tables" && request.method === "GET") {
        const result = await env.DB.prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%';"
        ).all();
        return jsonResponse({ tables: result.results.map((r) => r.name) }, 200, corsHeaders);
      }

      // 🔑 DB KV STORE: Lấy nhanh dữ liệu theo key (GET /db/kv/:key)
      if (pathname.startsWith("/db/kv/") && request.method === "GET") {
        const key = pathname.replace("/db/kv/", "");
        await ensureKvTable(env.DB);
        const row = await env.DB.prepare("SELECT value, updated_at FROM _kv_store WHERE key = ?").bind(key).first();
        if (!row) {
          return jsonResponse({ key, value: null, found: false }, 404, corsHeaders);
        }
        let parsed = row.value;
        try {
          parsed = JSON.parse(row.value);
        } catch {}
        return jsonResponse({ key, value: parsed, updated_at: row.updated_at, found: true }, 200, corsHeaders);
      }

      // 🔑 DB KV STORE: Lưu nhanh dữ liệu theo key (POST /db/kv/:key)
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
      // 3. ROUTE MẶC ĐỊNH: HEALTH CHECK & HƯỚNG DẪN API (GET /)
      // =====================================================================
      return jsonResponse(
        {
          service: "Cloudflare AI & D1 Database Gateway",
          owner: "Huyen Tran (trann46698)",
          status: "online",
          version: "1.0.0",
          gateway_url: "https://ai-gateway-worker.trann46698.workers.dev",
          routes: {
            ai: [
              "POST /stt          -> Whisper Speech-to-Text (gửi binary audio)",
              "POST /tts          -> Deepgram Aura-2 Text-to-Speech (gửi { text })",
              "POST /chat         -> Llama 3.3 70B Fast (gửi { messages })",
              "POST /fix-english  -> Tech Lead English Polish (gửi { text, tone })",
            ],
            database: [
              "POST /db/query     -> SQL SELECT query (gửi { query, params })",
              "POST /db/execute   -> SQL INSERT/UPDATE/DELETE/CREATE (gửi { query, params })",
              "POST /db/batch     -> Batch SQL transactions (gửi { statements })",
              "GET  /db/tables    -> Xem danh sách các bảng trong DB",
              "GET  /db/kv/:key   -> Lấy dữ liệu Key-Value",
              "POST /db/kv/:key   -> Lưu dữ liệu Key-Value (gửi { value })",
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

// Helper trả về JSON có CORS
function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      ...headers,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

// Helper tự động khởi tạo bảng _kv_store nếu chưa có
async function ensureKvTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS _kv_store (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `).run();
}
