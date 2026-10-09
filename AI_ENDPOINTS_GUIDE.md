# 📘 Hướng Dẫn Sử Dụng & Danh Sách Endpoints AI (Cloudflare Workers AI)

Tài liệu này tổng hợp toàn bộ các Endpoint AI đang hoạt động trong hệ thống của **Huyền Trân** (`trann46698`), bao gồm cả dịch vụ không cần key và cách tích hợp vào ứng dụng mới của công ty.

---

## 🚀 1. STT Whisper (Bóc băng âm thanh từ Micro ra Text)

Worker serverless độc lập chạy trên **OpenAI Whisper** của Cloudflare.  
👉 **Không cần API Key, gọi trực tiếp từ bất kỳ frontend hay backend nào!**

* **Endpoint URL:** `https://steep-boat-9faa.trann46698.workers.dev/`
* **HTTP Method:** `POST`
* **Request Headers:**
  * `Content-Type: audio/webm` *(hoặc `audio/wav`, `audio/mpeg`)*
* **Request Body:** Dữ liệu nhị phân (Binary stream / ArrayBuffer / Blob) của file âm thanh thu từ microphone.
* **Response Format:**
  ```json
  {
    "response": {
      "text": "Based on your high throughput requirements, we recommend adopting an event-driven architecture."
    }
  }
  ```

### 💻 Code Mẫu (JavaScript / TypeScript):
```ts
async function transcribeSpeech(audioBlob: Blob): Promise<string> {
  const response = await fetch("https://steep-boat-9faa.trann46698.workers.dev/", {
    method: "POST",
    headers: {
      "Content-Type": "audio/webm",
    },
    body: audioBlob,
  });

  if (!response.ok) {
    throw new Error(`STT failed with status ${response.status}`);
  }

  const data = await response.json() as { response?: { text?: string } };
  return data.response?.text || "";
}
```

### 💻 Code Mẫu (C# / .NET 8):
```csharp
using var httpClient = new HttpClient();
using var fileContent = new ByteArrayContent(audioBytes);
fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("audio/webm");

var response = await httpClient.PostAsync("https://steep-boat-9faa.trann46698.workers.dev/", fileContent);
var json = await response.Content.ReadAsStringAsync();
Console.WriteLine(json);
```

---

## 🔊 2. TTS (Text-to-Speech — Deepgram Aura-2 Giọng Đọc Chuẩn Native)

Chuyển đổi văn bản tiếng Anh thành giọng đọc tự nhiên của người bản xứ (phù hợp đọc mẫu phát âm, bot hội thoại).

* **Endpoint:** `https://<DOMAIN_APP_CUA_BAN>/api/tts`
* **HTTP Method:** `POST`
* **Request Headers:**
  * `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "text": "For our 500k DAU loyalty platform, we packaged the dynamic rule engine as an in-process NuGet library.",
    "lang": "en"
  }
  ```
* **Response Format:** Binary stream `audio/mpeg` (File MP3 có thể phát trực tiếp).

### 💻 Code Mẫu (JavaScript / Web Audio):
```ts
async function playSpeech(text: string) {
  const res = await fetch("https://<DOMAIN_APP_CUA_BAN>/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, lang: "en" }),
  });

  const blob = await res.blob();
  const audioUrl = URL.createObjectURL(blob);
  const audio = new Audio(audioUrl);
  audio.play();
}
```

---

## ✍️ 3. Fix My English & Tech Lead Writing Co-pilot

Phân tích lỗi ngữ pháp, nâng cấp câu tiếng Anh thô thành chuẩn Tech Lead / C-Level, kèm giải thích tiếng Việt và 3 phương án diễn đạt.

* **Endpoint:** `https://<DOMAIN_APP_CUA_BAN>/api/fix-english`
* **HTTP Method:** `POST`
* **Request Headers:**
  * `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "text": "We change partition key to userId and add Redis L1 cache so RU cost reduce 70%",
    "tone": "executive"
  }
  ```
  * **Các giá trị `tone` hỗ trợ:**
    * `"executive"`: Client / C-Level (Ngoại giao, đàm phán, bảo vệ giải pháp).
    * `"slack"`: Slack & Standup (Ngắn gọn, tự nhiên, súc tích).
    * `"code_review"`: PR Code Review (Góp ý kỹ thuật xây dựng).
    * `"incident"`: Incident Update (Báo cáo sự cố khẩn, SLA, ETA).
* **Response Format:**
  ```json
  {
    "is_correct": false,
    "naturalness_score": 6,
    "issues": [
      "RU cost reduce 70% sai ngữ pháp; chuẩn Tech Lead nên dùng slashed Request Unit consumption by 70%."
    ],
    "corrected": "By re-partitioning our Cosmos DB collections by userId and introducing an L1 Redis cache, we slashed Request Unit consumption by 70% and eliminated 429 throttling exceptions.",
    "alternatives": [
      "⚡ Ngắn gọn & Trực tiếp: Re-aligning partition key on userId dropped Cosmos DB RU overhead by 70%.",
      "🤝 Ngoại giao: To mitigate hot partitions, keying on userId yielded a 70% RU reduction.",
      "🛠️ Chuyên sâu Kỹ thuật: Through partition key optimization and tiered caching, we achieved a 70% drop in RU spend."
    ],
    "explanation": "Khi báo cáo tối ưu chi phí hạ tầng với CTO, kết hợp số liệu phần trăm cụ thể kèm thuật ngữ chuẩn xác tạo độ tin cậy vượt trội.",
    "good_parts": "Nêu chuẩn xác nguyên nhân kỹ thuật và kết quả đo lường."
  }
  ```

---

## 🎭 4. NPC Roleplay Response (Llama 3.3 70B Fast)

Hội thoại nhập vai thông minh với Client CTO, Enterprise Architect, Product Manager.

* **Endpoint:** `https://<DOMAIN_APP_CUA_BAN>/api/npc-response`
* **HTTP Method:** `POST`
* **Request Headers:**
  * `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "scenario": {
      "npc_name": "Marcus Sterling",
      "npc_role": "Principal Enterprise Architect",
      "setting": "Technical Architecture Review"
    },
    "history": [
      { "sender": "npc", "text": "Why did you choose an in-process NuGet package over a microservice?" }
    ],
    "userMessage": "Under peak flash sales with 500k DAUs, network hops and JSON serialization would introduce unacceptable latency.",
    "language": "en"
  }
  ```
* **Response Format:**
  ```json
  {
    "message": "That is a valid concern regarding the network serialization overhead. How do you plan to handle rule cache invalidation across distributed pods?"
  }
  ```

---

## ⚡ 5. Cách Sử Dụng Cho App Mới của Công Ty

### Trường hợp A: App mới cũng deploy trên Cloudflare Workers / Pages (Khuyên dùng)
👉 **Hoàn toàn KHÔNG CẦN KEY hay TOKEN:**
1. Thêm vào `wrangler.jsonc` (hoặc `wrangler.toml`):
   ```jsonc
   "ai": {
     "binding": "AI"
   }
   ```
2. Trong code backend, gọi trực tiếp thông qua `env.AI`:
   ```ts
   // LLM Llama 3.3 70B:
   const res = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", { messages });
   // TTS Deepgram:
   const audio = await env.AI.run("@cf/deepgram/aura-2-en", { text: "Hello" });
   // STT Whisper:
   const transcript = await env.AI.run("@cf/openai/whisper", { audio: audioBuffer });
   ```

### Trường hợp B: App mới chạy trên Server ngoài (Docker, AKS, AWS, On-premise)
1. Đăng nhập [dash.cloudflare.com](https://dash.cloudflare.com) ➔ **My Profile** ➔ **API Tokens** ➔ Tạo token quyền `Workers AI (Read)`.
2. Lấy `Account ID` tại trang chủ Dashboard.
3. Gọi qua REST API:
   ```bash
   curl https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast \
     -H "Authorization: Bearer <API_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"messages": [{"role": "user", "content": "Hello"}]}'
   ```

---

## 💰 6. Chính Sách Chi Phí & Quota Miễn Phí
* **Mỗi ngày được tặng 10.000 Neurons MIỄN PHÍ** (tự động reset sau 24h lúc 00:00 UTC).
* Nếu dùng hết 10.000 Neurons:
  * **Tài khoản Free:** Tạm dừng gọi, **không tự động trừ tiền**.
  * **Tài khoản Paid ($5/tháng):** Tính phí vượt mức chỉ **$0.011 / 1.000 Neurons** (siêu rẻ, chỉ bằng 1/10 OpenAI).

---

## 🔗 7. Links Quản Lý Nhanh
* **Cloudflare Dashboard:** [dash.cloudflare.com](https://dash.cloudflare.com)
* **Kiểm tra mức dùng Neurons:** [Workers AI Dashboard](https://dash.cloudflare.com/?to=/:account/ai/workers-ai)
* **Quản lý API Tokens:** [API Tokens Console](https://dash.cloudflare.com/profile/api-tokens)
* **Worker D1 Database Template:** `https://d1-template.trann46698.workers.dev`
