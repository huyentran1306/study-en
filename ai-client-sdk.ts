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
}

// Export một instance mặc định
export const aiGateway = new AIGatewayClient();
