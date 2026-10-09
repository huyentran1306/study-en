/**
 * STANDALONE AI GATEWAY WORKER (CLOUDFLARE)
 * 
 * Đây là mã nguồn 1 con Worker hoàn chỉnh đứng làm "Cổng AI Gateway" dùng chung.
 * Khi deploy lên Cloudflare (ví dụ: https://my-company-ai.trann46698.workers.dev):
 * MỌI APP NGOÀI ĐỀU GỌI ĐƯỢC MÀ KHÔNG CẦN QUẢN LÝ API KEY / TOKEN!
 * 
 * Các Route hỗ trợ:
 * 1. POST /stt          -> Bóc băng âm thanh (OpenAI Whisper)
 * 2. POST /tts          -> Đọc chữ thành tiếng MP3 (Deepgram Aura-2)
 * 3. POST /chat         -> Hội thoại thông minh (Llama 3.3 70B Fast)
 * 4. POST /fix-english  -> Nâng cấp câu văn phong Tech Lead
 * 
 * Cách deploy:
 * 1. Lưu file này vào thư mục riêng với file wrangler.toml:
 *      name = "company-ai-gateway"
 *      main = "index.js"
 *      compatibility_date = "2026-04-24"
 *      [ai]
 *      binding = "AI"
 * 2. Chạy lệnh: npx wrangler deploy
 */

export default {
  async fetch(request, env, ctx) {
    // 1. Cho phép CORS để app từ mọi domain (localhost, domain cty) đều gọi được
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    try {
      // -------------------------------------------------------------
      // ROUTE 1: BÓC BĂNG GIỌNG NÓI MICROPHONE (STT WHISPER)
      // POST /stt | Body: binary audio (audio/webm, audio/wav, ...)
      // -------------------------------------------------------------
      if (pathname === "/stt" && request.method === "POST") {
        const audioBuffer = await request.arrayBuffer();
        const response = await env.AI.run("@cf/openai/whisper", {
          audio: [...new Uint8Array(audioBuffer)],
        });

        return new Response(JSON.stringify({ text: response.text || "" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // -------------------------------------------------------------
      // ROUTE 2: ĐỌC VĂN BẢN THÀNH FILE ÂM THANH (TTS DEEPGRAM)
      // POST /tts | Body JSON: { "text": "Hello Trân" }
      // -------------------------------------------------------------
      if (pathname === "/tts" && request.method === "POST") {
        const { text = "" } = await request.json();
        if (!text) {
          return new Response(JSON.stringify({ error: "Missing text" }), { status: 400 });
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

      // -------------------------------------------------------------
      // ROUTE 3: CHAT & HỘI THOẠI (LLAMA 3.3 70B FAST)
      // POST /chat | Body JSON: { "messages": [{ "role": "user", "content": "Hi" }] }
      // -------------------------------------------------------------
      if (pathname === "/chat" && request.method === "POST") {
        const { messages = [], max_tokens = 500, temperature = 0.7 } = await request.json();
        const response = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
          messages,
          max_tokens,
          temperature,
        });

        return new Response(JSON.stringify({ response: response.response || "" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // -------------------------------------------------------------
      // ROUTE 4: SỬA CÂU & NÂNG CẤP VĂN PHONG TECH LEAD
      // POST /fix-english | Body JSON: { "text": "my draft", "tone": "executive" }
      // -------------------------------------------------------------
      if (pathname === "/fix-english" && request.method === "POST") {
        const { text = "", tone = "executive" } = await request.json();
        const systemPrompt = `You are an elite English coach for Tech Leads. Elevate this sentence with tone "${tone}". Respond ONLY in valid JSON with fields: is_correct (bool), naturalness_score (int 1-10), issues (array of strings in Vietnamese), corrected (string), alternatives (array of 3 strings), explanation (string in Vietnamese).`;

        const response = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Refine: "${text}"` },
          ],
          temperature: 0.2,
          max_tokens: 800,
        });

        const raw = response.response || "";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { corrected: raw };

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Route mặc định: Health check
      return new Response(
        JSON.stringify({
          status: "healthy",
          service: "Company AI Gateway",
          routes: ["POST /stt", "POST /tts", "POST /chat", "POST /fix-english"],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};
