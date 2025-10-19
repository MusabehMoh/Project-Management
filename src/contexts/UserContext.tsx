import type { User } from "@/types/user";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { userService } from "@/services/api";

type UserContextState = {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setUser: (u: User | null) => void;
};

const UserContext = createContext<UserContextState | undefined>(undefined);

// Module-level guard to dedupe /me calls across StrictMode re-mounts
let inflight: Promise<User | null> | null = null;

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
              actions: [],
            },
          ],
          actions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setUser(fallback);
        setError(null);
      }
    } finally {
      inflight = null;
      setLoading(false);
    }
  };

  useEffect(() => {
    //fetchUser();
  }, []);

  const value = useMemo<UserContextState>(
    () => ({ user, loading, error, refetch: fetchUser, setUser }),
    [user, loading, error],
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
