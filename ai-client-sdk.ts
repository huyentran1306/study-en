/**
 * AI CLIENT SDK - DÙNG CHO APP NGOÀI GỌI CÁC DỊCH VỤ AI CỦA CLOUDFLARE
 * 
 * Hướng dẫn sử dụng:
 * 1. Copy file này vào thư mục dự án của app mới (src/lib/ai-client.ts hoặc tương tự).
 * 2. Cài đặt biến môi trường hoặc truyền trực tiếp cấu hình.
 * 3. Gọi các hàm: transcribeAudio, generateSpeech, chatWithLlama, fixEnglish.
 */

export interface AIClientConfig {
  /**
   * Account ID lấy từ Cloudflare Dashboard (chuỗi 32 ký tự).
   * Lấy tại: https://dash.cloudflare.com/
   */
  accountId?: string;

  /**
   * API Token tạo từ Cloudflare Dashboard với quyền Workers AI (Read).
   * Lấy tại: https://dash.cloudflare.com/profile/api-tokens
   */
  apiToken?: string;

  /**
   * Hoặc dùng link Worker STT dựng sẵn không cần Token:
   */
  sttWorkerUrl?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface FixEnglishResponse {
  is_correct: boolean;
  naturalness_score: number;
  issues: string[];
  corrected: string;
  alternatives: string[];
  explanation: string;
  good_parts: string;
}

export class CloudflareAIClient {
  private accountId: string;
  private apiToken: string;
  private sttWorkerUrl: string;

  constructor(config?: AIClientConfig) {
    this.accountId = config?.accountId || process.env.CLOUDFLARE_ACCOUNT_ID || "";
    this.apiToken = config?.apiToken || process.env.CLOUDFLARE_API_TOKEN || "";
    this.sttWorkerUrl = config?.sttWorkerUrl || "https://steep-boat-9faa.trann46698.workers.dev/";
  }

  /**
   * Helper gọi Cloudflare Workers AI REST API trực tiếp từ app ngoài
   */
  private async runModel<T = any>(modelName: string, body: any, isBinary = false): Promise<T> {
    if (!this.accountId || !this.apiToken) {
      throw new Error(
        "Thiếu CLOUDFLARE_ACCOUNT_ID hoặc CLOUDFLARE_API_TOKEN. Vui lòng cấu hình trước khi gọi từ app ngoài."
      );
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/${modelName}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiToken}`,
    };

    if (!isBinary) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: isBinary ? body : JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Cloudflare AI API Error [${response.status}]: ${errText}`);
    }

    return response as unknown as T;
  }

  // =========================================================================
  // 1. STT: BÓC BĂNG GIỌNG NÓI TỪ MICROPHONE THÀNH TEXT (OPENAI WHISPER)
  // =========================================================================
  /**
   * Nhận diện giọng nói từ file audio Blob hoặc ArrayBuffer.
   * Mặc định gọi qua Worker STT dựng sẵn (KHÔNG CẦN TOKEN).
   */
  async transcribeAudio(audioData: Blob | ArrayBuffer): Promise<string> {
    // Cách 1: Gọi qua Worker STT dựng sẵn (Miễn phí, 0 cần Token)
    try {
      const body = audioData instanceof Blob ? await audioData.arrayBuffer() : audioData;
      const res = await fetch(this.sttWorkerUrl, {
        method: "POST",
        headers: { "Content-Type": "audio/webm" },
        body,
      });

      if (res.ok) {
        const json = (await res.json()) as { response?: { text?: string } };
        return json.response?.text || "";
      }
    } catch (e) {
      console.warn("Worker STT fallback sang Direct API Token nếu có...");
    }

    // Cách 2: Fallback sang REST API chính thức nếu có Token
    if (this.accountId && this.apiToken) {
      const body = audioData instanceof Blob ? await audioData.arrayBuffer() : audioData;
      const res = await this.runModel<Response>("@cf/openai/whisper", body, true);
      const json = await (res as unknown as Response).json() as { result?: { text?: string } };
      return json.result?.text || "";
    }

    throw new Error("Không thể bóc băng âm thanh. Kiểm tra kết nối mạng hoặc cấu hình API Token.");
  }

  // =========================================================================
  // 2. TTS: TẠO GIỌNG NÓI BẢN XỨ TỪ TEXT (DEEPGRAM AURA-2)
  // =========================================================================
  /**
   * Tạo file âm thanh (MP3 audio Blob) từ đoạn văn bản tiếng Anh.
   */
  async generateSpeech(text: string): Promise<Blob> {
    const res = await this.runModel<Response>("@cf/deepgram/aura-2-en", { text });
    return (res as unknown as Response).blob();
  }

  // =========================================================================
  // 3. LLM CHAT: HỘI THOẠI & TRẢ LỜI CÂU HỎI (LLAMA 3.3 70B FAST)
  // =========================================================================
  /**
   * Gọi mô hình Meta Llama 3.3 70B Instruct để chat, trả lời câu hỏi, nhập vai.
   */
  async chatWithLlama(
    messages: ChatMessage[],
    options?: { maxTokens?: number; temperature?: number }
  ): Promise<string> {
    const res = await this.runModel<Response>("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages,
      max_tokens: options?.maxTokens || 800,
      temperature: options?.temperature ?? 0.7,
    });

    const json = await (res as unknown as Response).json() as { result?: { response?: string } };
    return json.result?.response || "";
  }

  // =========================================================================
  // 4. FIX ENGLISH: NÂNG CẤP VĂN PHONG TECH LEAD / CLIENT / SLACK
  // =========================================================================
  /**
   * Sửa câu tiếng Anh theo phong cách chuyên nghiệp chuẩn Tech Lead.
   * @param text Đoạn tiếng Anh cần sửa
   * @param tone Phong cách: 'executive' (khách hàng/CTO), 'slack' (chat nội bộ), 'code_review', 'incident'
   */
  async fixEnglish(
    text: string,
    tone: "executive" | "slack" | "code_review" | "incident" = "executive"
  ): Promise<FixEnglishResponse> {
    const systemPrompt = `You are an elite English communication coach for software engineering leaders and solution architects.
Target Tone: ${tone}.
Elevate the user's rough draft into high-impact, professional technical English.
Respond ONLY with valid JSON in this exact schema:
{
  "is_correct": false,
  "naturalness_score": 6,
  "issues": ["Issue 1 in Vietnamese", "Issue 2 in Vietnamese"],
  "corrected": "Elevated sentence",
  "alternatives": ["⚡ Option 1", "🤝 Option 2", "🛠️ Option 3"],
  "explanation": "Clear explanation in Vietnamese",
  "good_parts": "Brief praise in Vietnamese"
}`;

    const rawResponse = await this.chatWithLlama(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Refine this draft: "${text}"` },
      ],
      { temperature: 0.2, maxTokens: 1000 }
    );

    const match = rawResponse.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as FixEnglishResponse;
    }

    throw new Error("Không thể phân tích kết quả JSON từ mô hình AI.");
  }
}

// Export một instance mặc định tiện dùng nhanh
export const defaultAIClient = new CloudflareAIClient();
