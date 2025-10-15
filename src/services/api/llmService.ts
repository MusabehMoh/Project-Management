// ApiResponse type (generic response structure)
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface LLMSuggestionRequest {
  context: string;
  field: string;
  previousValues?: Record<string, string>;
  maxTokens?: number;
  conversationHistory?: ConversationMessage[]; // NEW: Support conversation history
}

interface LLMSuggestionResponse {
  suggestion: string;
  confidence: number;
}

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream: boolean;
  options: {
    temperature: number;
    top_p: number;
    max_tokens?: number;
  };
}

interface OllamaGenerateResponse {
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
}

const LLM_CONFIG = {
  // n8n webhook URL (use n8n if USE_N8N=true, else direct Ollama)
  useN8N: import.meta.env.VITE_LLM_USE_N8N === "true",
  n8nWebhookUrl:
    import.meta.env.VITE_LLM_N8N_WEBHOOK_URL ||
    "http://localhost:5678/webhook/ai-suggest",
  // Direct Ollama config (fallback)
  baseUrl: import.meta.env.VITE_LLM_API_URL || "http://localhost:11434",
  model: import.meta.env.VITE_LLM_MODEL || "mistral:7b-instruct",
  temperature: 0.3, // Lower = more consistent/deterministic
  maxTokens: 150,
  timeout: 15000, // 15 second timeout (n8n + Ollama needs more time)
};

export const llmService = {
  /**
   * Get AI-powered suggestion for a form field
   */
  async getSuggestion(
    request: LLMSuggestionRequest,
  ): Promise<ApiResponse<LLMSuggestionResponse>> {
    try {
      // Check if LLM is enabled
      if (import.meta.env.VITE_LLM_ENABLED !== "true") {
        return {
          success: false,
          message: "LLM service is disabled",
          data: null,
        };
      }

      // Use n8n workflow or direct Ollama based on config
      if (LLM_CONFIG.useN8N) {
        return await this.getSuggestionViaN8N(request);
      } else {
        return await this.getSuggestionViaOllama(request);
      }
    } catch (error) {
      console.error("Error getting LLM suggestion:", error);

      if (error instanceof Error && error.name === "AbortError") {
        return {
          success: false,
          message: "Request timeout - LLM took too long to respond",
          data: null,
        };
      }

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to get LLM suggestion",
        data: null,
      };
    }
  },

  /**
   * Get suggestion via n8n workflow
   */
  async getSuggestionViaN8N(
    request: LLMSuggestionRequest,
  ): Promise<ApiResponse<LLMSuggestionResponse>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LLM_CONFIG.timeout);

    try {
      const response = await fetch(LLM_CONFIG.n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: request.context,
          field: request.field,
          previousValues: request.previousValues,
          maxTokens: request.maxTokens || LLM_CONFIG.maxTokens,
          conversationHistory: request.conversationHistory || [], // NEW: Send conversation history
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`n8n workflow error: ${response.statusText}`);
      }

      const data: ApiResponse<LLMSuggestionResponse> = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  },

  /**
   * Get suggestion directly from Ollama
   */
  async getSuggestionViaOllama(
    request: LLMSuggestionRequest,
  ): Promise<ApiResponse<LLMSuggestionResponse>> {
    const prompt = this.buildPrompt(request);

    const ollamaRequest: OllamaGenerateRequest = {
      model: LLM_CONFIG.model,
      prompt,
      stream: false,
      options: {
        temperature: LLM_CONFIG.temperature,
        top_p: 0.9,
        max_tokens: request.maxTokens || LLM_CONFIG.maxTokens,
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LLM_CONFIG.timeout);

    try {
      const response = await fetch(`${LLM_CONFIG.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ollamaRequest),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data: OllamaGenerateResponse = await response.json();

      return {
        success: true,
        data: {
          suggestion: data.response.trim(),
          confidence: 0.85,
        },
        message: "Suggestion generated successfully",
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  },

  /**
   * Build optimized prompt for form field suggestion
   */
  buildPrompt(request: LLMSuggestionRequest): string {
    const { context, field, previousValues } = request;

    let prompt = `You are an AI assistant helping with project management task creation. Based on the context below, suggest a concise and relevant value for the requested field.

Context: ${context}`;

    if (previousValues && Object.keys(previousValues).length > 0) {
      prompt += `\n\nAlready filled fields:`;
      Object.entries(previousValues).forEach(([key, value]) => {
        prompt += `\n- ${key}: ${value}`;
      });
    }

    prompt += `\n\nField to suggest: ${field}\n\nProvide only the suggested value, no explanation or extra text. Keep it brief and professional.`;

    return prompt;
  },

  /**
   * Check if Ollama service is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${LLM_CONFIG.baseUrl}/api/tags`, {
        method: "GET",
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch (error) {
      console.error("LLM health check failed:", error);
      return false;
    }
  },

  /**
   * Get list of available models
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${LLM_CONFIG.baseUrl}/api/tags`);
      if (!response.ok) return [];

      const data = await response.json();
      return data.models?.map((m: { name: string }) => m.name) || [];
    } catch (error) {
      console.error("Error fetching models:", error);
      return [];
    }
  },
};
