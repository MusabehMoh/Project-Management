import { queryClient } from "@/config/queryClient";

/**
 * Cache invalidation utilities for React Query
 * Used to invalidate cached data when backend data changes
 */
export class CacheInvalidationService {
  /**
   * Invalidate current user cache
   * Call this after user profile/role updates
   */
  static invalidateCurrentUser(): void {
    queryClient.invalidateQueries({
      queryKey: ["currentUser"],
    });
  }

  /**
   * Invalidate all user-related caches
   */
  static invalidateAllUserCaches(): void {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const queryKey = query.queryKey;

        return (
          Array.isArray(queryKey) &&
          (queryKey[0] === "currentUser" ||
            queryKey[0] === "users" ||
            queryKey[0] === "user")
        );
      },
    });
  }

  /**
   * Invalidate specific user cache by ID
   */
  static invalidateUserById(userId: number): void {
    queryClient.invalidateQueries({
      queryKey: ["user", userId],
    });
  }

  /**
   * Invalidate users list cache
   */
  static invalidateUsersList(): void {
    queryClient.invalidateQueries({
      queryKey: ["users"],
    });
  }

  /**
   * Clear all caches (useful for logout)
   */
  static clearAllCaches(): void {
    queryClient.clear();
  }
}

/**
 * Convenience functions for common cache invalidation scenarios
 */

export const invalidateCurrentUser = () =>
  CacheInvalidationService.invalidateCurrentUser();

export const invalidateAllUserCaches = () =>
  CacheInvalidationService.invalidateAllUserCaches();

export const invalidateUserById = (userId: number) =>
  CacheInvalidationService.invalidateUserById(userId);

export const invalidateUsersList = () =>
  CacheInvalidationService.invalidateUsersList();

export const clearAllCaches = () => CacheInvalidationService.clearAllCaches();
