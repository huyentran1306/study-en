/**
 * AI & DATABASE GATEWAY WORKER (CLOUDFLARE)
 * 
 * Cung cấp API trọn gói cho mọi ứng dụng cá nhân / bên ngoài:
 * - 🎤 STT (OpenAI Whisper): POST /stt
 * - 🔊 TTS (Deepgram Aura-2): POST /tts
 * - 🧠 LLM Chat (Meta Llama 3.3 70B): POST /chat
 * - ✍️ Tech Lead Writing: POST /fix-english
 * - 💾 Database D1 SQL Query: POST /db/query
 * - 💾 Database D1 SQL Execute: POST /db/execute
 * - 💾 Key-Value Store: GET /db/kv/:key | POST /db/kv/:key
 * - 📊 Database Tables: GET /db/tables
 */

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Xử lý Preflight CORS cho tất cả browser requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      // =====================================================================
      // 1. AI ROUTES
      // =====================================================================

      // 🎤 STT: Nhận diện giọng nói từ file âm thanh
      if (pathname === "/stt" && request.method === "POST") {
        const audioBuffer = await request.arrayBuffer();
        if (!audioBuffer || audioBuffer.byteLength === 0) {
          return jsonResponse({ error: "No audio data provided" }, 400, corsHeaders);
        }

        const response = await env.AI.run("@cf/openai/whisper", {
          audio: [...new Uint8Array(audioBuffer)],
        });

        return jsonResponse({ text: response.text || "" }, 200, corsHeaders);
      }

      // 🔊 TTS: Đọc văn bản thành giọng nói MP3
      if (pathname === "/tts" && request.method === "POST") {
        const { text = "" } = await request.json().catch(() => ({}));
        if (!text) {
          return jsonResponse({ error: "Missing 'text' parameter" }, 400, corsHeaders);
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

      // 🧠 LLM CHAT: Hội thoại thông minh với Llama 3.3 70B
      if (pathname === "/chat" && request.method === "POST") {
        const { messages = [], max_tokens = 800, temperature = 0.7 } = await request.json().catch(() => ({}));
        if (!Array.isArray(messages) || messages.length === 0) {
          return jsonResponse({ error: "Missing or invalid 'messages' array" }, 400, corsHeaders);
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
          return jsonResponse({ error: "Missing 'text' parameter" }, 400, corsHeaders);
        }

        const systemPrompt = `You are an elite English coach for Tech Leads. Elevate this sentence with tone "${tone}". Respond ONLY in valid JSON matching this schema:
{
  "is_correct": false,
  "naturalness_score": 6,
  "issues": ["Issue 1 in Vietnamese", "Issue 2 in Vietnamese"],
  "corrected": "Elevated sentence",
  "alternatives": ["⚡ Option 1", "🤝 Option 2", "🛠️ Option 3"],
  "explanation": "Clear explanation in Vietnamese",
  "good_parts": "Brief praise in Vietnamese"
}`;

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
      // 2. DATABASE (D1 SQLITE) ROUTES
      // =====================================================================

      // 💾 DB QUERY: SELECT (trả về danh sách records)
      if (pathname === "/db/query" && request.method === "POST") {
        const { query = "", params = [] } = await request.json().catch(() => ({}));
        if (!query) {
          return jsonResponse({ error: "Missing 'query' parameter" }, 400, corsHeaders);
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
          return jsonResponse({ error: "Missing 'query' parameter" }, 400, corsHeaders);
        }

        const stmt = env.DB.prepare(query);
        const boundStmt = params.length > 0 ? stmt.bind(...params) : stmt;
        const result = await boundStmt.run();

        return jsonResponse(result, 200, corsHeaders);
      }

      // 💾 DB BATCH: Thực thi nhiều câu SQL trong 1 transaction
      if (pathname === "/db/batch" && request.method === "POST") {
        const { statements = [] } = await request.json().catch(() => ({}));
        if (!Array.isArray(statements) || statements.length === 0) {
          return jsonResponse({ error: "Missing 'statements' array" }, 400, corsHeaders);
        }

        const prepared = statements.map((s) => {
          const stmt = env.DB.prepare(s.query);
          return s.params && s.params.length > 0 ? stmt.bind(...s.params) : stmt;
        });

        const results = await env.DB.batch(prepared);
        return jsonResponse({ success: true, results }, 200, corsHeaders);
      }

      // 📊 DB TABLES: Xem danh sách các bảng trong database
      if (pathname === "/db/tables" && request.method === "GET") {
        const result = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%';").all();
        return jsonResponse({ tables: result.results.map((r) => r.name) }, 200, corsHeaders);
      }

      // 🔑 DB KV STORE: GET /db/kv/:key
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
      // 3. HEALTH CHECK & API DOCS (GET /)
      // =====================================================================
      return jsonResponse(
        {
          service: "Cloudflare AI & D1 Database Gateway",
          owner: "Huyen Tran (trann46698)",
          status: "online",
          version: "1.0.0",
          routes: {
            ai: [
              "POST /stt          -> Whisper Speech-to-Text (send binary audio)",
              "POST /tts          -> Deepgram Aura-2 Text-to-Speech (send { text })",
              "POST /chat         -> Llama 3.3 70B Fast (send { messages })",
              "POST /fix-english  -> Tech Lead English Polish (send { text, tone })",
            ],
            database: [
              "POST /db/query     -> SQL SELECT query (send { query, params })",
              "POST /db/execute   -> SQL INSERT/UPDATE/DELETE/CREATE (send { query, params })",
              "POST /db/batch     -> Batch SQL transactions (send { statements })",
              "GET  /db/tables    -> List tables in D1",
              "GET  /db/kv/:key   -> Get Key-Value data",
              "POST /db/kv/:key   -> Save Key-Value data (send { value })",
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

// Helper JSON response
function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      ...headers,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

// Helper tự động tạo bảng Key-Value nếu chưa tồn tại
async function ensureKvTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS _kv_store (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `).run();
}
