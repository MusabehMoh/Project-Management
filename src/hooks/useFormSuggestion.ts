import { useState, useCallback, useEffect } from "react";

import { llmService } from "@/services/api/llmService";
import {
  conversationHistoryService,
  type ConversationMessage,
} from "@/services/conversationHistoryService";

interface UseFormSuggestionOptions {
  field: string;
  context: string;
  previousValues?: Record<string, string>;
  autoSuggest?: boolean;
  debounceMs?: number;
  contextId?: string; // NEW: Unique ID for conversation context (e.g., "requirement-123")
}

interface UseFormSuggestionResult {
  suggestion: string;
  loading: boolean;
  error: string | null;
  isLLMAvailable: boolean;
  conversationHistory: ConversationMessage[]; // NEW: Current conversation history
  getSuggestion: (userPrompt?: string) => Promise<void>;
  clearSuggestion: () => void;
  applySuggestion: () => string;
  clearHistory: () => void; // NEW: Clear conversation history
}

/**
 * Custom hook for AI-powered form field suggestions
 *
 * @example
 * ```tsx
 * const { suggestion, loading, getSuggestion } = useFormSuggestion({
 *   field: "taskDescription",
 *   context: "Software development task",
 *   previousValues: { title: "Implement OAuth2", priority: "High" }
 * });
 * ```
 */
export function useFormSuggestion(
  options: UseFormSuggestionOptions,
): UseFormSuggestionResult {
  const [suggestion, setSuggestion] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLLMAvailable, setIsLLMAvailable] = useState<boolean>(false);
  const [conversationHistory, setConversationHistory] = useState<
    ConversationMessage[]
  >([]);

  const contextId = options.contextId || "default";

  // Load conversation history on mount
  useEffect(() => {
    const history = conversationHistoryService.getMessages(contextId);

    setConversationHistory(history);
  }, [contextId]);

  // Check LLM availability on mount
  useEffect(() => {
    const checkAvailability = async () => {
      const available = await llmService.checkHealth();

      setIsLLMAvailable(available);
    };

    checkAvailability();
  }, []);

  const getSuggestion = useCallback(
    async (userPrompt?: string) => {
      const promptToUse = userPrompt || options.context;

      if (!options.field || !promptToUse) {
        setError("Field and context are required");

        return;
      }

      if (!isLLMAvailable) {
        setError("LLM service is not available");

        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Add user message to history
        if (userPrompt) {
          conversationHistoryService.addUserMessage(contextId, userPrompt);
        }

        // Get current conversation history
        const currentHistory =
          conversationHistoryService.getMessages(contextId);

        const result = await llmService.getSuggestion({
          field: options.field,
          context: promptToUse,
          previousValues: options.previousValues,
          conversationHistory: currentHistory, // Send history to API
        });

        if (result.success && result.data) {
          const aiResponse = result.data.suggestion;

          setSuggestion(aiResponse);

          // Add assistant message to history
          conversationHistoryService.addAssistantMessage(contextId, aiResponse);

          // Update local state
          const updatedHistory =
            conversationHistoryService.getMessages(contextId);

          setConversationHistory(updatedHistory);
        } else {
          setError(result.message || "Failed to get suggestion");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get suggestion";

        setError(errorMessage);
        console.error("Error getting LLM suggestion:", err);
      } finally {
        setLoading(false);
      }
    },
    [
      options.field,
      options.context,
      options.previousValues,
      isLLMAvailable,
      contextId,
    ],
  );

  // Auto-suggest on mount if enabled
  useEffect(() => {
    if (options.autoSuggest && isLLMAvailable) {
      getSuggestion();
    }
  }, [options.autoSuggest, isLLMAvailable, getSuggestion]);

  const clearSuggestion = useCallback(() => {
    setSuggestion("");
    setError(null);
  }, []);

  const applySuggestion = useCallback(() => {
    return suggestion;
  }, [suggestion]);

  const clearHistory = useCallback(() => {
    conversationHistoryService.clearHistory(contextId);
    setConversationHistory([]);
  }, [contextId]);

  return {
    suggestion,
    loading,
    error,
    isLLMAvailable,
    conversationHistory,
    getSuggestion,
    clearSuggestion,
    applySuggestion,
    clearHistory,
  };
}
