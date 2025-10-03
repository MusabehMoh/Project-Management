import { useCallback, useMemo } from "react";

import { useOptimizedSearch, SearchResult } from "./useOptimizedSearch";

import { timelineService } from "@/services/api";
import { MemberSearchResult } from "@/types/timeline";

export interface EmployeeSearchOptions {
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

/**
 * Optimized employee search hook with performance enhancements
 *
 * Features:
 * - Debounced search (300ms default)
 * - Result caching (5 minutes)
 * - Request cancellation
 * - Minimum search length (2 characters default)
 * - Limited results to prevent UI lag (via API limit)
 * - Optional initial results loading
 *
 * @param options - Configuration options for the search behavior
 * @returns Search state and control functions
 *
 * @example
 * ```tsx
 * const { employees, loading, searchEmployees } = useTeamSearch({
 *   minLength: 3,
 *   maxResults: 20,
 *   loadInitialResults: true
 * });
 * ```
 */
export function useTeamSearch(options: EmployeeSearchOptions = {}) {
  const config: Required<EmployeeSearchOptions> = {
    minLength: 2,
    debounceMs: 300,
    maxResults: 25,
    loadInitialResults: false,
    initialResultsLimit: 15,
    ...options,
  };

  // Transform employee search API call to match SearchResult format
  const searchEmployeesApi = useCallback(
    async (query: string, limit?: number): Promise<SearchResult[]> => {
      try {
        // Pass the limit directly to the API call
        // Backend service handles result limiting for optimal performance
        const response = await timelineService.searchAllMembers(query, limit);

        if (!response.success) {
          throw new Error(response.message || "Failed to search employees");
        }

        const results = response.data || [];

        // Transform MemberSearchResult to SearchResult format
        return results.map(
          (employee): SearchResult => ({
            id: employee.id,
            value: employee.userName,
            label: employee.fullName,
            secondary: `${employee.militaryNumber} - ${employee.gradeName}`,
            metadata: employee, // Store original employee data
          }),
        );
      } catch (error) {
        console.error("Employee search error:", error);
        throw error;
      }
    },
    // Include the search method in dependencies for proper hook behavior
    // If timelineService is a stable module import, this ensures proper tracking
    [timelineService.searchAllMembers],
  );

  const {
    results: searchResults,
    loading,
    error,
    search: searchEmployees,
    clearResults,
    clearCache,
    loadInitialResults: triggerLoadInitialResults,
  } = useOptimizedSearch(searchEmployeesApi, {
    minLength: config.minLength,
    debounceMs: config.debounceMs,
    maxResults: config.maxResults,
    loadInitialResults: config.loadInitialResults,
    initialResultsLimit: config.initialResultsLimit,
    cacheMs: 5 * 60 * 1000, // 5 minutes cache
  });

  // Memoized transformation back to MemberSearchResult for efficient re-renders
  const employees = useMemo<MemberSearchResult[]>(
    () => searchResults.map((result) => result.metadata as MemberSearchResult),
    [searchResults],
  );

  return {
    /** Transformed employee results ready for consumption */
    employees,
    /** Raw search results in SearchResult format */
    searchResults,
    /** Loading state indicator */
    loading,
    /** Error object if search fails */
    error,
    /** Function to trigger employee search */
    searchEmployees,
    /** Function to clear current search results */
    clearResults,
    /** Function to clear the search cache */
    clearCache,
    /** Function to load initial popular results */
    loadInitialResults: triggerLoadInitialResults,
  };
}

export default useTeamSearch;