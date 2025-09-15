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

      // Fallback to mock data in case of error during development
      if (import.meta.env.MODE === "development") {
        console.warn(
          "Using fallback user data due to API error:",
          errorMessage,
        );
        setUser({
          id: 1,
          userName: "sarah.johnson",
          fullName: "Sarah Johnson",
          militaryNumber: "MIL001234",
          gradeName: "Captain",
          department: "IT Department",
          email: "sarah.johnson@organization.mil",
          phone: "+1-555-0101",
          isVisible: true,
          roles: [
            {
              id: 1,
              name: "Administrator",
              active: true,
              roleOrder: 1,
              actions: [],
            },
          ],
          actions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setError(null); // Clear error since we have fallback data
      }
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
