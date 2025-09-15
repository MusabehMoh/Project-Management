import { useState, useCallback, useRef, useEffect } from "react";

import {
  GlobalSearchService,
  GlobalSearchResult,
  GlobalSearchOptions,
} from "@/services/globalSearchService";

interface UseGlobalSearchOptions {
  debounceMs?: number;
  minLength?: number;
}

interface UseGlobalSearchReturn {
  results: GlobalSearchResult[];
  loading: boolean;
  error: string | null;
  search: (options: GlobalSearchOptions) => Promise<void>;
  clearResults: () => void;
  suggestions: string[];
  getSuggestions: (query: string) => void;
}

export function useGlobalSearch(
  options: UseGlobalSearchOptions = {},
): UseGlobalSearchReturn {
  const { debounceMs = 300, minLength = 2 } = options;

  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  const search = useCallback(
    async (searchOptions: GlobalSearchOptions) => {
      const { query } = searchOptions;

      // Clear previous timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Abort previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Don't search if query is too short
      if (!query || query.trim().length < minLength) {
        setResults([]);
        setError(null);

        return;
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      const performSearch = async () => {
        try {
          setLoading(true);
          setError(null);

          const searchResults = await GlobalSearchService.search(searchOptions);

          // Check if request was aborted
          if (abortControllerRef.current?.signal.aborted) {
            return;
          }

          setResults(searchResults);
        } catch (err) {
          // Don't set error if request was aborted
          if (abortControllerRef.current?.signal.aborted) {
            return;
          }

          setError(err instanceof Error ? err.message : "Search failed");
          setResults([]);
        } finally {
          setLoading(false);
        }
      };

      // Debounce the search
      debounceTimeoutRef.current = setTimeout(performSearch, debounceMs);
    },
    [debounceMs, minLength],
  );

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    setSuggestions([]);
  }, []);

  const getSuggestions = useCallback((query: string) => {
    const searchSuggestions = GlobalSearchService.getSuggestions(query, 10);

    setSuggestions(searchSuggestions);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clearResults,
    suggestions,
    getSuggestions,
  };
}

export default useGlobalSearch;
