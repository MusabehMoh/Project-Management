import type { User } from "@/types/user";

import { useState, useEffect } from "react";

import { userService } from "@/services/api";

interface UseCurrentUserReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to manage current user data
 * Fetches user data from API and provides loading/error states
 */
export const useCurrentUser = (): UseCurrentUserReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await userService.getCurrentUser();

      if (response.success) {
        setUser(response.data);
      } else {
        throw new Error(response.message || "Failed to fetch user data");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch user data";

      setError(errorMessage);
      console.error("Error fetching current user:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  return {
    user,
    loading,
    error,
    refetch: fetchCurrentUser,
  };
};
