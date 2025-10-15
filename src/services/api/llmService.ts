import type { ApiResponse } from "./types";

interface LLMSuggestionRequest {
  context: string;
  field: string;
  previousValues?: Record<string, string>;
  maxTokens?: number;
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
  baseUrl: import.meta.env.VITE_LLM_API_URL || "http://localhost:11434",
  model: import.meta.env.VITE_LLM_MODEL || "mistral:7b-instruct",
  temperature: 0.3, // Lower = more consistent/deterministic
  maxTokens: 150,
  timeout: 10000, // 10 second timeout
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
      const timeoutId = setTimeout(
        () => controller.abort(),
        LLM_CONFIG.timeout,
      );

      const response = await fetch(`${LLM_CONFIG.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ollamaRequest),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.statusText}`);
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
