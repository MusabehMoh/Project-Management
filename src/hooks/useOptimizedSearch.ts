import { useState, useEffect, useCallback, useRef } from "react";

export interface SearchResult {
  id: string | number;
  value: string;
  label: string;
  secondary?: string;
  metadata?: any;
}

export interface SearchOptions {
  /** Minimum characters before triggering search */
  minLength?: number;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Maximum number of results to return */
  maxResults?: number;
  /** Cache results for this many milliseconds */
  cacheMs?: number;
  /** Load initial results when component mounts */
  loadInitialResults?: boolean;
  /** Initial results limit */
  initialResultsLimit?: number;
}

interface CacheEntry {
  data: SearchResult[];
  timestamp: number;
}

const DEFAULT_OPTIONS: Required<SearchOptions> = {
  minLength: 2,
  debounceMs: 300,
  maxResults: 50,
  cacheMs: 5 * 60 * 1000, // 5 minutes
  loadInitialResults: false,
  initialResultsLimit: 20,
};

/**
 * Optimized search hook with debouncing, caching, and performance optimizations
 *
 * @example
 * ```tsx
 * const {
 *   results,
 *   loading,
 *   search,
 *   clearResults
 * } = useOptimizedSearch(searchEmployees, {
 *   minLength: 2,
 *   debounceMs: 300,
 *   maxResults: 50
 * });
 * ```
 */
export function useOptimizedSearch<T extends SearchResult = SearchResult>(
  searchFunction: (query: string, limit?: number) => Promise<T[]>,
  options: SearchOptions = {},
) {
  const config = { ...DEFAULT_OPTIONS, ...options };

  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache for storing search results
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  // Clear cache periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const cache = cacheRef.current;

      for (const [key, entry] of cache.entries()) {
        if (now - entry.timestamp > config.cacheMs) {
          cache.delete(key);
        }
      }
    }, config.cacheMs);

    return () => clearInterval(interval);
  }, [config.cacheMs]);

  const loadInitialResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const initialResults = await searchFunction(
        "",
        config.initialResultsLimit,
      );

      setResults(initialResults.slice(0, config.maxResults));

      // Cache initial results
      cacheRef.current.set("", {
        data: initialResults,
        timestamp: Date.now(),
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load initial results";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [searchFunction, config.initialResultsLimit, config.maxResults]);

  // Load initial results if requested
  useEffect(() => {
    if (config.loadInitialResults) {
      loadInitialResults();
    }
  }, [config.loadInitialResults, loadInitialResults]);

  const performSearch = useCallback(
    async (query: string) => {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        setError(null);

        // Check cache first
        const cacheKey = query.toLowerCase().trim();
        const cached = cacheRef.current.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < config.cacheMs) {
          setResults(cached.data.slice(0, config.maxResults) as T[]);
          setLoading(false);

          return;
        }

        // Perform search
        const searchResults = await searchFunction(query, config.maxResults);

        // Check if request was aborted
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        const limitedResults = searchResults.slice(0, config.maxResults);

        setResults(limitedResults);

        // Cache results
        cacheRef.current.set(cacheKey, {
          data: limitedResults,
          timestamp: Date.now(),
        });
      } catch (err) {
        // Don't show error if request was aborted
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        const errorMessage =
          err instanceof Error ? err.message : "Search failed";

        setError(errorMessage);
        setResults([]);
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [searchFunction, config.maxResults, config.cacheMs],
  );

  const search = useCallback(
    (query: string) => {
      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // If query is empty and we have initial results, show them
      if (!query.trim()) {
        if (config.loadInitialResults) {
          loadInitialResults();
        } else {
          setResults([]);
        }

        return;
      }

      // If query is too short, clear results
      if (query.trim().length < config.minLength) {
        setResults([]);
        setError(null);

        return;
      }

      // Debounce the search
      debounceTimeoutRef.current = setTimeout(() => {
        performSearch(query.trim());
      }, config.debounceMs);
    },
    [
      performSearch,
      config.minLength,
      config.debounceMs,
      config.loadInitialResults,
      loadInitialResults,
    ],
  );

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);

    // Cancel ongoing search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
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
    clearCache,
    loadInitialResults,
  };
}

export default useOptimizedSearch;
