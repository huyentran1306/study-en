/**
 * CLIENT SDK DÙNG CHO APP NGOÀI GỌI TRỰC TIẾP GATEWAY AI & DATABASE D1
 * 
 * 🌐 Gateway URL đã deploy: https://ai-gateway-worker.trann46698.workers.dev
 * 
 * Cách dùng:
 * 1. Copy file này vào app ngoài (React, Next.js, Vue, Node.js...).
 * 2. Gọi trực tiếp các hàm:
 *    - aiGateway.chat([...])
 *    - aiGateway.fixEnglish(text, tone)
 *    - aiGateway.transcribe(audioBlob)
 *    - aiGateway.speak(text)
 *    - aiGateway.dbQuery(sql, params)
 *    - aiGateway.dbExecute(sql, params)
 *    - aiGateway.dbGet(key)
 *    - aiGateway.dbSet(key, value)
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface FixEnglishResult {
  is_correct: boolean;
  naturalness_score: number;
  issues: string[];
  corrected: string;
  alternatives: string[];
  explanation: string;
  good_parts?: string;
}

export class AIGatewayClient {
  private gatewayUrl: string;

  constructor(gatewayUrl = "https://ai-gateway-worker.trann46698.workers.dev") {
    this.gatewayUrl = gatewayUrl.replace(/\/$/, "");
  }

  // =========================================================================
  // 1. NHÓM TÍNH NĂNG AI
  // =========================================================================

  /**
   * Chat và trả lời câu hỏi với Llama 3.3 70B Fast
   */
  async chat(messages: ChatMessage[], options?: { maxTokens?: number; temperature?: number }): Promise<string> {
    const res = await fetch(`${this.gatewayUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        max_tokens: options?.maxTokens || 800,
        temperature: options?.temperature ?? 0.7,
      }),
    });

    if (!res.ok) throw new Error(`Chat failed: ${res.statusText}`);
    const data = await res.json() as { response?: string };
    return data.response || "";
  }

  /**
   * Sửa câu tiếng Anh chuẩn Tech Lead / C-Level
   */
  async fixEnglish(
    text: string,
    tone: "executive" | "slack" | "code_review" | "incident" = "executive"
  ): Promise<FixEnglishResult> {
    const res = await fetch(`${this.gatewayUrl}/fix-english`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, tone }),
    });

    if (!res.ok) throw new Error(`Fix English failed: ${res.statusText}`);
    return res.json() as Promise<FixEnglishResult>;
  }

  /**
   * Bóc băng giọng nói từ microphone thành text (OpenAI Whisper)
   */
  async transcribe(audioData: Blob | ArrayBuffer): Promise<string> {
    const body = audioData instanceof Blob ? await audioData.arrayBuffer() : audioData;
    const res = await fetch(`${this.gatewayUrl}/stt`, {
      method: "POST",
      headers: { "Content-Type": "audio/webm" },
      body,
    });

    if (!res.ok) throw new Error(`STT failed: ${res.statusText}`);
    const data = await res.json() as { text?: string };
    return data.text || "";
  }

  /**
   * Đọc văn bản tiếng Anh thành file âm thanh MP3 (Deepgram Aura-2)
   */
  async speak(text: string): Promise<Blob> {
    const res = await fetch(`${this.gatewayUrl}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) throw new Error(`TTS failed: ${res.statusText}`);
    return res.blob();
  }

  // =========================================================================
  // 2. NHÓM TÍNH NĂNG DATABASE D1 SQLITE
  // =========================================================================

  /**
   * Thực hiện truy vấn SELECT trên D1 Database
   */
  async dbQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
    const res = await fetch(`${this.gatewayUrl}/db/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, params }),
    });

    if (!res.ok) throw new Error(`DB Query failed: ${res.statusText}`);
    const data = await res.json() as { results?: T[] };
    return data.results || [];
  }

  /**
   * Thực thi lệnh INSERT, UPDATE, DELETE, CREATE TABLE trên D1 Database
   */
  async dbExecute(query: string, params: any[] = []): Promise<any> {
    const res = await fetch(`${this.gatewayUrl}/db/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, params }),
    });

    if (!res.ok) throw new Error(`DB Execute failed: ${res.statusText}`);
    return res.json();
  }

  /**
   * Lưu nhanh dữ liệu Key-Value vào D1 (tự động serialize JSON)
   */
  async dbSet(key: string, value: any): Promise<boolean> {
    const res = await fetch(`${this.gatewayUrl}/db/kv/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });

    if (!res.ok) throw new Error(`DB Set failed: ${res.statusText}`);
    const data = await res.json() as { success?: boolean };
    return !!data.success;
  }

  /**
   * Lấy nhanh dữ liệu Key-Value từ D1 (tự động deserialize JSON)
   */
  async dbGet<T = any>(key: string): Promise<T | null> {
    const res = await fetch(`${this.gatewayUrl}/db/kv/${encodeURIComponent(key)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`DB Get failed: ${res.statusText}`);
    const data = await res.json() as { value?: T };
    return data.value ?? null;
  }

  /**
   * Xem danh sách tất cả các bảng trong D1
   */
  async dbTables(): Promise<string[]> {
    const res = await fetch(`${this.gatewayUrl}/db/tables`);
    if (!res.ok) throw new Error(`DB Tables failed: ${res.statusText}`);
    const data = await res.json() as { tables?: string[] };
    return data.tables || [];
  }

  // =========================================================================
  // 3. NHÓM TÍNH NĂNG VISION AI & LƯU ẢNH BÉ (R2 STORAGE + LLAMA 3.2 VISION)
  // =========================================================================

  /**
   * Chụp hình bé & phân tích hoạt động, cảm xúc bằng Vision AI
   * Tự động lưu ảnh vào Cloudflare R2 và lưu kết quả vào D1 Database.
   */
  async analyzeChildPhoto(
    image: Blob | File | string,
    prompt?: string,
    childName?: string
  ): Promise<{
    success: boolean;
    id: number;
    file_id: string;
    image_url: string;
    child_name: string;
    prompt: string;
    analysis: string;
    saved_to_db: boolean;
  }> {
    if (typeof image === "string") {
      const isUrl = image.startsWith("http");
      const res = await fetch(`${this.gatewayUrl}/vision/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isUrl ? { imageUrl: image, prompt, childName } : { image, prompt, childName }),
      });
      if (!res.ok) throw new Error(`Vision analyze failed: ${res.statusText}`);
      return res.json();
    }

    const formData = new FormData();
    formData.append("image", image);
    if (prompt) formData.append("prompt", prompt);
    if (childName) formData.append("childName", childName);

    const res = await fetch(`${this.gatewayUrl}/vision/analyze`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error(`Vision analyze failed: ${res.statusText}`);
    return res.json();
  }

  /**
   * Lấy lịch sử danh sách ảnh của bé đã phân tích từ D1 Database
   */
  async getChildPhotos(limit = 20): Promise<Array<{
    id: number;
    file_id: string;
    image_url: string;
    prompt: string;
    analysis: string;
    child_name: string;
    created_at: string;
  }>> {
    const res = await fetch(`${this.gatewayUrl}/child-photos?limit=${limit}`);
    if (!res.ok) throw new Error(`Get child photos failed: ${res.statusText}`);
    const data = await res.json() as { photos?: any[] };
    return data.photos || [];
  }

  // =========================================================================
  // 4. NHÓM TÍNH NĂNG SINH ẢNH AI & TÌM KIẾM VECTORIZE (RAG)
  // =========================================================================

  /**
   * Tạo ảnh nghệ thuật từ văn bản (Flux 1 Schnell / SDXL)
   * Tự động lưu vào Cloudflare R2 và trả về URL ảnh công khai.
   */
  async generateImage(
    prompt: string,
    style: "pixar" | "anime" | "photorealistic" = "pixar"
  ): Promise<{ success: boolean; image_url: string; file_id: string; prompt: string }> {
    const res = await fetch(`${this.gatewayUrl}/images/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, style }),
    });

    if (!res.ok) throw new Error(`Image generation failed: ${res.statusText}`);
    return res.json();
  }

  /**
   * Đánh chỉ mục văn bản/bài học vào Vector Database (Cloudflare Vectorize)
   */
  async indexVectorDocument(text: string, id?: string, metadata: Record<string, any> = {}): Promise<any> {
    const res = await fetch(`${this.gatewayUrl}/search/index`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, text, metadata }),
    });

    if (!res.ok) throw new Error(`Index document failed: ${res.statusText}`);
    return res.json();
  }

  /**
   * Tìm kiếm ngữ nghĩa bằng câu hỏi tự nhiên (Vector Semantic Search)
   */
  async searchVector(query: string, topK = 5): Promise<Array<{ id: string; score: number; text: string; metadata: any }>> {
    const res = await fetch(`${this.gatewayUrl}/search/vector`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, topK }),
    });

    if (!res.ok) throw new Error(`Vector search failed: ${res.statusText}`);
    const data = await res.json() as { results?: any[] };
    return data.results || [];
  }

  /**
   * Bóc tách chữ tiếng Anh từ ảnh chụp tài liệu/bài tập (OCR)
   */
  async extractTextFromImage(image: Blob | File): Promise<string> {
    const formData = new FormData();
    formData.append("image", image);

    const res = await fetch(`${this.gatewayUrl}/vision/ocr`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error(`OCR failed: ${res.statusText}`);
    const data = await res.json() as { extracted_text?: string };
    return data.extracted_text || "";
  }
}

// Export một instance mặc định
export const aiGateway = new AIGatewayClient();
