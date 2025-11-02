import type { User } from "@/types/user";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { userService } from "@/services/api";
import { impersonationService } from "@/services/api/impersonationService";

type UserContextState = {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setUser: (u: User | null) => void;
  // Impersonation state
  realUserName: string | null;
  isImpersonating: boolean;
  impersonatedUserName: string | null;
  startImpersonation: (userName: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
};

const UserContext = createContext<UserContextState | undefined>(undefined);

// Module-level guard to dedupe /me calls across StrictMode re-mounts
let inflight: Promise<User | null> | null = null;

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [realUserName, setRealUserName] = useState<string | null>(null);
  const [isImpersonating, setIsImpersonating] = useState<boolean>(false);
  const [impersonatedUserName, setImpersonatedUserName] = useState<
    string | null
  >(null);

  const fetchUser = async () => {
    setLoading(true);
    setError(null);

    // Serve from memory if already available
    if (user) {
      setLoading(false);

      return;
    }

    if (inflight) {
      const u = await inflight;

      setUser(u);
      setLoading(false);

      return;
    }

    inflight = (async () => {
      const response = await userService.getCurrentUser();

      if (response.success) {
        return response.data;
      }
      throw new Error(response.message || "Failed to fetch user data");
    })();

    try {
      const u = await inflight;

      setUser(u);

      // If user data includes the real username, set it
      // This would come from the backend UserContext
      if (u) {
        // Extract real username - the backend should provide this
        const realName = (u as any).realUserName || u.userName;

        setRealUserName(realName);
      }

      // Check impersonation status
      const impersonationStatus =
        await impersonationService.getImpersonationStatus();

      if (impersonationStatus.success && impersonationStatus.data) {
        setIsImpersonating(impersonationStatus.data.isImpersonating);
        setRealUserName(impersonationStatus.data.realUserName);
        setImpersonatedUserName(
          impersonationStatus.data.impersonatedUserName || null,
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch user data";

      setError(errorMessage);

      // Development fallback user (kept minimal and silent)
      if (import.meta.env.MODE === "development") {
        const fallback: User = {
          id: 1,
          userName: "sarah.johnson",
          fullName: "Sarah Johnson",
          militaryNumber: "MIL001234",
          gradeName: "Captain",
          department: "IT Department",
          email: "sarah.johnson@organization.mil",
          phone: "+1-555-0101",
          isActive: true,
          roles: [
            {
              id: 1,
              name: "Administrator",
              active: true,
              roleOrder: 1,
              department: {
                id: 1,
                name: "IT",
                color: "#3b82f6",
              },
              actions: [],
            },
          ],
          actions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setUser(fallback);
        setRealUserName("sarah.johnson");
        setError(null);
      }
    } finally {
      inflight = null;
      setLoading(false);
    }
  };

  // Check impersonation status on mount and periodically
  useEffect(() => {
    const checkImpersonation = async () => {
      try {
        const status = await impersonationService.getImpersonationStatus();

        if (status.success && status.data) {
          setIsImpersonating(status.data.isImpersonating);
          setRealUserName(status.data.realUserName);
          setImpersonatedUserName(status.data.impersonatedUserName || null);
        }
      } catch {
        // Silent failure - endpoint may not be available
      }
    };

    checkImpersonation();

    const interval = setInterval(checkImpersonation, 30000000);

    return () => clearInterval(interval);
  }, []);

  const handleStartImpersonation = async (userName: string) => {
    try {
      setLoading(true);
      const response = await impersonationService.startImpersonation(userName);

      if (response.success) {
        inflight = null;
        await fetchUser();
        setIsImpersonating(true);
        setImpersonatedUserName(userName);
      } else {
        throw new Error(response.message || "Failed to start impersonation");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to start impersonation";

      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleStopImpersonation = async () => {
    try {
      setLoading(true);
      const response = await impersonationService.stopImpersonation();

      if (response.success) {
        inflight = null;
        await fetchUser();
        setIsImpersonating(false);
        setImpersonatedUserName(null);
      } else {
        throw new Error(response.message || "Failed to stop impersonation");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to stop impersonation";

      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo<UserContextState>(
    () => ({
      user,
      loading,
      error,
      refetch: fetchUser,
      setUser,
      realUserName,
      isImpersonating,
      impersonatedUserName,
      startImpersonation: handleStartImpersonation,
      stopImpersonation: handleStopImpersonation,
    }),
    [user, loading, error, realUserName, isImpersonating, impersonatedUserName],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext() {
  const ctx = useContext(UserContext);

  if (!ctx) {
    throw new Error("useUserContext must be used within a UserProvider");
  }

  return ctx;
}

export default UserContext;
