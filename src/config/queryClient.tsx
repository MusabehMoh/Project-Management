import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactNode } from "react";

// Configure React Query client with appropriate caching strategies
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // User data doesn't change frequently, so we can cache it for longer
      staleTime: 1000 * 60 * 15, // 15 minutes - data considered fresh
      gcTime: 1000 * 60 * 30, // 30 minutes - cache garbage collection time (previously cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 401/403 errors (authentication/authorization issues)
        if (
          error?.response?.status === 401 ||
          error?.response?.status === 403
        ) {
          return false;
        }

        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Network-first approach for user data
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      // Automatically invalidate related queries after mutations
      onSuccess: () => {
        // This will be handled per mutation
      },
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools
          buttonPosition="bottom-right"
          initialIsOpen={false}
          position="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}

// Export the query client for use in other parts of the app
export { queryClient };

// Query keys for consistent cache management
export const queryKeys = {
  // User queries
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (filters?: any) => [...queryKeys.users.lists(), { filters }] as const,
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.users.details(), id] as const,
    current: () => [...queryKeys.users.all, "current"] as const,
    currentClaims: () => [...queryKeys.users.all, "current", "claims"] as const,
    stats: () => [...queryKeys.users.all, "stats"] as const,
  },

  // Employee queries
  employees: {
    all: ["employees"] as const,
    search: (query: string) =>
      [...queryKeys.employees.all, "search", query] as const,
    details: (identifier: string) =>
      [...queryKeys.employees.all, "details", identifier] as const,
  },

  // Role queries
  roles: {
    all: ["roles"] as const,
    lists: () => [...queryKeys.roles.all, "list"] as const,
    detail: (id: number) => [...queryKeys.roles.all, "detail", id] as const,
  },

  // Action queries
  actions: {
    all: ["actions"] as const,
    lists: () => [...queryKeys.actions.all, "list"] as const,
    byCategory: (category: string) =>
      [...queryKeys.actions.all, "category", category] as const,
  },
} as const;

// Cache invalidation utilities
export const cacheUtils = {
  // Invalidate all user-related queries
  invalidateUser: (userId?: number) => {
    if (userId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.detail(userId),
      });
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    queryClient.invalidateQueries({ queryKey: queryKeys.users.stats() });
  },

  // Invalidate current user data (important for permission changes)
  invalidateCurrentUser: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.current() });
    queryClient.invalidateQueries({
      queryKey: queryKeys.users.currentClaims(),
    });

    // Also remove from cache to force immediate refetch
    queryClient.removeQueries({ queryKey: queryKeys.users.current() });
    queryClient.removeQueries({ queryKey: queryKeys.users.currentClaims() });
  },

  // Optimistically update current user cache
  setCurrentUserCache: (userData: any) => {
    queryClient.setQueryData(queryKeys.users.current(), userData);
  },

  // Get cached current user data
  getCurrentUserCache: () => {
    return queryClient.getQueryData(queryKeys.users.current());
  },

  // Prefetch user data
  prefetchUser: async (userId: number) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.users.detail(userId),
      // We'd need to import userService here, but let's handle this in the hook
    });
  },
};

// Hook for managing cache invalidation when user permissions change
export const usePermissionChangeHandler = () => {
  const handlePermissionChange = (userId?: number) => {
    if (userId) {
      // Invalidate specific user cache
      cacheUtils.invalidateUser(userId);
    }
    // Always invalidate current user cache when permissions change
    cacheUtils.invalidateCurrentUser();
  };

  return { handlePermissionChange };
};
