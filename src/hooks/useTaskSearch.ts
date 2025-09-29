import { useCallback } from "react";

import { useOptimizedSearch, SearchResult } from "./useOptimizedSearch";

import { timelineService } from "@/services/api";
import { WorkItem } from "@/types/timeline";

export interface TaskSearchOptions {
  /** Minimum characters before triggering search */
  minLength?: number;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Maximum number of results to return */
  maxResults?: number;
  /** Load initial popular employees when component mounts */
  loadInitialResults?: boolean;
  /** Initial results limit */
  initialResultsLimit?: number;
}

export function useTaskSearch(options: TaskSearchOptions = {}) {
  const defaultOptions: TaskSearchOptions = {
    minLength: 2,
    debounceMs: 300,
    maxResults: 25,
    loadInitialResults: false,
    initialResultsLimit: 15,
  };

  const config = { ...defaultOptions, ...options };

  // Transform employee search API call to match SearchResult format
  const searchTasksApi = useCallback(
    async (query: string, limit?: number): Promise<SearchResult[]> => {
      console.log("--->>>>>>> start api call");
      try {
        const response = await timelineService.searchTasks(query);

        if (response.success) {
          console.log("--->>>>>>> api success");
          const results = response.data || [];
          const limitedResults = limit ? results.slice(0, limit) : results;

          console.log(results);
          console.log(limitedResults);

          // Transform EmployeeSearchResult to SearchResult format
          return limitedResults.map(
            (task): SearchResult => ({
              id: task.id,
              value: task.description ?? "Empty",
              label: task.name,
              secondary: task.status,
              metadata: task, // Store original task data
            }),
          );
        } else {
          throw new Error(response.message || "Failed to search tasks");
        }
      } catch (error) {
        console.error("task search error:", error);
        throw error;
      }
    },
    [],
  );

  const {
    results: searchResults,
    loading,
    error,
    search: searchTasks,
    clearResults,
    clearCache,
    loadInitialResults,
  } = useOptimizedSearch(searchTasksApi, {
    minLength: config.minLength,
    debounceMs: config.debounceMs,
    maxResults: config.maxResults,
    loadInitialResults: config.loadInitialResults,
    initialResultsLimit: config.initialResultsLimit,
    cacheMs: 5 * 60 * 1000, // 5 minutes cache
  });

  // Transform back toTaskSearchResult for easier consumption
  const workItems: WorkItem[] = searchResults.map(
    (result) => result.metadata as WorkItem,
  );

  return {
    workItems,
    searchResults,
    loading,
    error,
    searchTasks,
    clearResults,
    clearCache,
    loadInitialResults,
  };
}

export default useTaskSearch;
