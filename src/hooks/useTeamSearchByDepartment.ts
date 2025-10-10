import { useCallback, useMemo } from "react";

import { useOptimizedSearch, SearchResult } from "./useOptimizedSearch";

import { timelineService } from "@/services/api";
import { MemberSearchResult } from "@/types/timeline";

export interface DepartmentEmployeeSearchOptions {
  /** Department ID to filter by */
  departmentId: number;
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
 * Optimized employee search hook filtered by department
 *
 * Features:
 * - Debounced search (300ms default)
 * - Result caching (5 minutes)
 * - Request cancellation
 * - Minimum search length (1 character default)
 * - Limited results to prevent UI lag (via API limit)
 * - Optional initial results loading
 * - Filters by specific department ID
 *
 * @param options - Configuration options including departmentId
 * @returns Search state and control functions
 *
 * @example
 * ```tsx
 * const { employees, loading, searchEmployees } = useTeamSearchByDepartment({
 *   departmentId: 3, // Design Department
 *   minLength: 1,
 *   maxResults: 20,
 *   loadInitialResults: false
 * });
 * ```
 */
export function useTeamSearchByDepartment(
  options: DepartmentEmployeeSearchOptions,
) {
  const config = {
    minLength: 1,
    debounceMs: 300,
    maxResults: 20,
    loadInitialResults: false,
    initialResultsLimit: 15,
    ...options,
  };

  // Transform employee search API call to match SearchResult format
  const searchEmployeesApi = useCallback(
    async (query: string, limit?: number): Promise<SearchResult[]> => {
      try {
        // Call the department-specific search endpoint
        const response = await timelineService.searchMembersByDepartment(
          query,
          config.departmentId,
          limit,
        );

        if (!response.success) {
          throw new Error(response.message || "Failed to search employees");
        }

        const results = response.data || [];

        // Transform MemberSearchResult to SearchResult format
        return results.map(
          (employee: MemberSearchResult): SearchResult => ({
            id: employee.id,
            value: employee.userName,
            label: employee.fullName,
            secondary: `${employee.militaryNumber} - ${employee.gradeName}`,
            metadata: employee, // Store original employee data
          }),
        );
      } catch (error) {
        console.error("Department employee search error:", error);
        throw error;
      }
    },
    [config.departmentId],
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
    /** Transformed employee results filtered by department */
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

export default useTeamSearchByDepartment;
