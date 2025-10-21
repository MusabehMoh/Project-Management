import type { User } from "@/types/user";

import { useQuery } from "@tanstack/react-query";

import { userService } from "@/services/api";

interface UseCurrentUserReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to manage current user data
 * Uses React Query for caching and automatic deduplication
 * Backend already caches for 15 minutes, frontend caches for 5 minutes
 */
export const useCurrentUser = (): UseCurrentUserReturn => {
  const {
    data: user,
    isLoading,
    error,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: ["currentUser"], // Unique cache key for deduplication
    queryFn: async () => {
      const response = await userService.getCurrentUser();

      if (response.success) {
        return response.data;
      }
      throw new Error(response.message || "Failed to fetch user data");
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
    retry: 1, // Retry once on failure
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });

  return {
    user: user || null,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch: async () => {
      await queryRefetch();
    },
  };
};
