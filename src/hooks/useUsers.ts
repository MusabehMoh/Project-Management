import type {
  User,
  Role,
  Action,
  Employee,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilters,
  UserStats,
  UserClaims,
  EmployeeSearchResult,
} from "@/types/user";

import { useState, useEffect, useCallback } from "react";

import { userService, roleService, actionService } from "@/services/api";

// Use the configured services (mock or real based on environment)

/**
 * Custom hook for user management operations
 */
export const useUsers = (initialFilters?: UserFilters) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UserFilters>(initialFilters || {});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Load users from API
  const loadUsers = useCallback(
    async (page = 1, limit = 10) => {
      try {
        setLoading(true);
        setError(null);

        const response = await userService.getUsers(filters, page, limit);

        if (response.success) {
          setUsers(response.data);
          if (response.pagination) {
            setPagination(response.pagination);
          }
        } else {
          throw new Error(response.message || "Failed to load users");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load users";

        setError(errorMessage);
        console.error("Error loading users:", err);
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  // Create user
  const createUser = useCallback(
    async (userData: CreateUserRequest) => {
      try {
        setLoading(true);
        setError(null);

        const response = await userService.createUser(userData);

        if (response.success) {
          await loadUsers(pagination.page, pagination.limit);

          return response.data;
        } else {
          throw new Error(response.message || "Failed to create user");
        }
      } catch (err) {
        // Don't set global error state for create operations - let the component handle it
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadUsers, pagination],
  );

  // Update user
  const updateUser = useCallback(
    async (userData: UpdateUserRequest) => {
      try {
        setLoading(true);
        setError(null);

        const response = await userService.updateUser(userData);

        if (response.success) {
          await loadUsers(pagination.page, pagination.limit);

          return response.data;
        } else {
          throw new Error(response.message || "Failed to update user");
        }
      } catch (err) {
        // Don't set global error state for update operations - let the component handle it
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadUsers, pagination],
  );

  // Delete user
  const deleteUser = useCallback(
    async (id: number) => {
      try {
        setLoading(true);
        setError(null);

        const response = await userService.deleteUser(id);

        if (response.success) {
          await loadUsers(pagination.page, pagination.limit);
        } else {
          throw new Error(response.message || "Failed to delete user");
        }
      } catch (err) {
        // Don't set global error state for delete operations - let the component handle it
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadUsers, pagination],
  );

  // Search employees
  const searchEmployees = useCallback(
    async (query: string): Promise<EmployeeSearchResult[]> => {
      try {
        const response = await userService.searchEmployees(query);

        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.message || "Failed to search employees");
        }
      } catch (err) {
        console.error("Error searching employees:", err);

        return [];
      }
    },
    [],
  );

  // Get employee details
  const getEmployeeDetails = useCallback(
    async (identifier: string): Promise<Employee | null> => {
      try {
        const response = await userService.getEmployeeDetails(identifier);

        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.message || "Failed to get employee details");
        }
      } catch (err) {
        console.error("Error getting employee details:", err);

        return null;
      }
    },
    [],
  );

  // Update filters
  const updateFilters = useCallback((newFilters: UserFilters) => {
    setFilters(newFilters);
  }, []);

  // Load users when filters change
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return {
    users,
    loading,
    error,
    filters,
    pagination,
    loadUsers,
    createUser,
    updateUser,
    deleteUser,
    searchEmployees,
    getEmployeeDetails,
    updateFilters,
  };
};

/**
 * Custom hook for role management
 */
export const useRoles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Debug logging
      if (import.meta.env.VITE_ENABLE_CONSOLE_LOGS === "true") {
        console.log("🔧 roleService type:", roleService.constructor.name);
        console.log("🔧 roleService:", roleService);
      }

      const response = await roleService.getRoles();

      if (response.success) {
        setRoles(response.data);
      } else {
        throw new Error(response.message || "Failed to load roles");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load roles";

      setError(errorMessage);
      console.error("Error loading roles:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  return {
    roles,
    loading,
    error,
    loadRoles,
  };
};

/**
 * Custom hook for action management
 */
export const useActions = () => {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadActions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Debug logging
      if (import.meta.env.VITE_ENABLE_CONSOLE_LOGS === "true") {
        console.log("🔧 actionService type:", actionService.constructor.name);
        console.log("🔧 actionService:", actionService);
      }

      const response = await actionService.getActions();

      if (response.success) {
        setActions(response.data);
      } else {
        throw new Error(response.message || "Failed to load actions");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load actions";

      setError(errorMessage);
      console.error("Error loading actions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Group actions by category
  const actionsByCategory = useCallback(() => {
    return actions.reduce(
      (acc, action) => {
        // Helper function to get category from action
        const getActionCategory = (action: Action) => {
          // First try categoryName, then category, then extract from name
          if (action.categoryName) {
            return action.categoryName;
          }
          if ((action as any).category) {
            return (action as any).category;
          }
          // Extract category from action name (e.g., "users.create" -> "Users")
          if (action.name && action.name.includes(".")) {
            const prefix = action.name.split(".")[0];

            return prefix.charAt(0).toUpperCase() + prefix.slice(1);
          }

          return "Uncategorized";
        };

        const category = getActionCategory(action);

        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(action);

        return acc;
      },
      {} as { [categoryName: string]: Action[] },
    );
  }, [actions]);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  return {
    actions,
    actionsByCategory: actionsByCategory(),
    loading,
    error,
    loadActions,
  };
};

/**
 * Custom hook for user statistics
 */
export const useUserStats = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await userService.getUserStats();

      if (response.success) {
        setStats(response.data);
      } else {
        throw new Error(response.message || "Failed to load user statistics");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load user statistics";

      setError(errorMessage);
      console.error("Error loading user statistics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    loadStats,
  };
};

/**
 * Custom hook for user authentication and permissions
 */
export const useAuth = () => {
  const [userClaims, setUserClaims] = useState<UserClaims | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current user claims
  const loadUserClaims = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await userService.getCurrentUserClaims();

      if (response.success) {
        setUserClaims(response.data);
      } else {
        throw new Error(response.message || "Failed to load user claims");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load user claims";

      setError(errorMessage);
      console.error("Error loading user claims:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if user has permission
  const hasPermission = useCallback(
    (action: string, resource?: string) => {
      if (!userClaims) return false;

      // Check if user has the specific action
      if (userClaims.actions.includes(action)) return true;

      // Check if user has admin role
      if (userClaims.roles.includes("Administrator")) return true;

      // Check specific permission
      if (resource) {
        const permission = userClaims.permissions.find(
          (p) => p.action === action && p.resource === resource,
        );

        return permission?.allowed || false;
      }

      return false;
    },
    [userClaims],
  );

  // Check if user has role
  const hasRole = useCallback(
    (roleName: string) => {
      return userClaims?.roles.includes(roleName) || false;
    },
    [userClaims],
  );

  useEffect(() => {
    loadUserClaims();
  }, [loadUserClaims]);

  return {
    userClaims,
    loading,
    error,
    hasPermission,
    hasRole,
    loadUserClaims,
  };
};
