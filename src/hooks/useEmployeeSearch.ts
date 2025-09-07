import type { EmployeeSearchResult } from "@/types/user";

import { useCallback } from "react";

import { useOptimizedSearch, SearchResult } from "./useOptimizedSearch";

import { userService } from "@/services/api";

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
 * - Limited results to prevent UI lag
 * - Optional initial results loading
 *
 * @example
 * ```tsx
 * const {
 *   employees,
 *   loading,
 *   searchEmployees,
 *   clearResults
 * } = useEmployeeSearch({
 *   minLength: 2,
 *   maxResults: 20,
 *   loadInitialResults: true
 * });
 *
 * // In your component
 * <Autocomplete onInputChange={searchEmployees}>
 *   {employees.map(employee => (
 *     <AutocompleteItem key={employee.id}>{employee.fullName}</AutocompleteItem>
 *   ))}
 * </Autocomplete>
 * ```
 */
export function useEmployeeSearch(options: EmployeeSearchOptions = {}) {
  const defaultOptions: EmployeeSearchOptions = {
    minLength: 2,
    debounceMs: 300,
    maxResults: 25,
    loadInitialResults: false,
    initialResultsLimit: 15,
  };

  const config = { ...defaultOptions, ...options };

  // Transform employee search API call to match SearchResult format
  const searchEmployeesApi = useCallback(
    async (query: string, limit?: number): Promise<SearchResult[]> => {
      try {
        const response = await userService.searchEmployees(query);

        if (response.success) {
          const results = response.data || [];
          const limitedResults = limit ? results.slice(0, limit) : results;

          // Transform EmployeeSearchResult to SearchResult format
          return limitedResults.map(
            (employee): SearchResult => ({
              id: employee.id,
              value: employee.userName,
              label: employee.fullName,
              secondary: `${employee.militaryNumber} - ${employee.gradeName}`,
              metadata: employee, // Store original employee data
            }),
          );
        } else {
          throw new Error(response.message || "Failed to search employees");
        }
      } catch (error) {
        console.error("Employee search error:", error);
        throw error;
      }
    },
    [],
  );

  const {
    results: searchResults,
    loading,
    error,
    search: searchEmployees,
    clearResults,
    clearCache,
    loadInitialResults,
  } = useOptimizedSearch(searchEmployeesApi, {
    minLength: config.minLength,
    debounceMs: config.debounceMs,
    maxResults: config.maxResults,
    loadInitialResults: config.loadInitialResults,
    initialResultsLimit: config.initialResultsLimit,
    cacheMs: 5 * 60 * 1000, // 5 minutes cache
  });

  // Transform back to EmployeeSearchResult for easier consumption
  const employees: EmployeeSearchResult[] = searchResults.map(
    (result) => result.metadata as EmployeeSearchResult,
  );

  return {
    employees,
    searchResults, // Also provide the SearchResult format if needed
    loading,
    error,
    searchEmployees,
    clearResults,
    clearCache,
    loadInitialResults,
  };
}

export default useEmployeeSearch;
