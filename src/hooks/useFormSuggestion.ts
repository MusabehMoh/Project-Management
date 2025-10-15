import { useState, useCallback, useEffect } from "react";
import { llmService } from "@/services/api/llmService";

interface UseFormSuggestionOptions {
  field: string;
  context: string;
  previousValues?: Record<string, string>;
  autoSuggest?: boolean;
  debounceMs?: number;
}

interface UseFormSuggestionResult {
  suggestion: string;
  loading: boolean;
  error: string | null;
  isLLMAvailable: boolean;
  getSuggestion: () => Promise<void>;
  clearSuggestion: () => void;
  applySuggestion: () => string;
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

  // Check LLM availability on mount
  useEffect(() => {
    const checkAvailability = async () => {
      const available = await llmService.checkHealth();
      setIsLLMAvailable(available);
    };
    checkAvailability();
  }, []);

  const getSuggestion = useCallback(async () => {
    if (!options.field || !options.context) {
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
      const result = await llmService.getSuggestion({
        field: options.field,
        context: options.context,
        previousValues: options.previousValues,
      });

      if (result.success && result.data) {
        setSuggestion(result.data.suggestion);
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
  }, [
    options.field,
    options.context,
    options.previousValues,
    isLLMAvailable,
  ]);

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

  return {
    suggestion,
    loading,
    error,
    isLLMAvailable,
    getSuggestion,
    clearSuggestion,
    applySuggestion,
  };
}
