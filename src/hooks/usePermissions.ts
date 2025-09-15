import { useMemo } from "react";

import { useCurrentUser } from "./useCurrentUser";

import {
  hasPermission,
  hasRole,
  hasAction,
  isAdmin,
  isSuperAdmin,
  hasAnyRole,
  hasAllRoles,
  hasAnyAction,
  hasAllActions,
  Permissions,
  type PermissionCheck,
} from "@/utils/permissions";

/**
 * Custom hook for checking user permissions
 * Can be used in any component to conditionally render content based on user permissions
 */
export const usePermissions = () => {
  const { user, loading } = useCurrentUser();

  const permissionChecker = useMemo(
    () => ({
      // Main permission checker
      hasPermission: (check: PermissionCheck) => hasPermission(user, check),

      // Role checkers
      hasRole: (roleName: string) => hasRole(user, roleName),
      hasAnyRole: (roleNames: string[]) => hasAnyRole(user, roleNames),
      hasAllRoles: (roleNames: string[]) => hasAllRoles(user, roleNames),

      // Action checkers
      hasAction: (actionName: string) => hasAction(user, actionName),
      hasAnyAction: (actionNames: string[]) => hasAnyAction(user, actionNames),
      hasAllActions: (actionNames: string[]) =>
        hasAllActions(user, actionNames),

      // Convenience checkers
      isAdmin: () => isAdmin(user),
      isSuperAdmin: () => isSuperAdmin(user),

      // Quick access to common permissions
      can: {
        // User management
        manageUsers: () => hasPermission(user, Permissions.USER_MANAGEMENT),
        createUser: () => hasPermission(user, Permissions.USER_CREATE),
        editUser: () => hasPermission(user, Permissions.USER_EDIT),
        deleteUser: () => hasPermission(user, Permissions.USER_DELETE),

        // Project management
        manageProjects: () =>
          hasPermission(user, Permissions.PROJECT_MANAGEMENT),
        createProject: () => hasPermission(user, Permissions.PROJECT_CREATE),
        editProject: () => hasPermission(user, Permissions.PROJECT_EDIT),
        deleteProject: () => hasPermission(user, Permissions.PROJECT_DELETE),
        viewProject: () => hasPermission(user, Permissions.PROJECT_VIEW),

        // Role management
        manageRoles: () => hasPermission(user, Permissions.ROLE_MANAGEMENT),

        // System administration
        systemAdmin: () => hasPermission(user, Permissions.SYSTEM_ADMIN),

        // Department management
        manageDepartments: () =>
          hasPermission(user, Permissions.DEPARTMENT_MANAGEMENT),

        // Timeline management
        manageTimeline: () =>
          hasPermission(user, Permissions.TIMELINE_MANAGEMENT),

        // Task management
        manageTasks: () => hasPermission(user, Permissions.TASK_MANAGEMENT),
        createTask: () => hasPermission(user, Permissions.TASK_CREATE),
        editTask: () => hasPermission(user, Permissions.TASK_EDIT),
        deleteTask: () => hasPermission(user, Permissions.TASK_DELETE),
        viewTask: () => hasPermission(user, Permissions.TASK_VIEW),
      },
    }),
    [user],
  );

  return {
    user,
    loading,
    ...permissionChecker,
  };
};
