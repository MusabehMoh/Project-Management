import type { User } from "@/types/user";

export interface PermissionCheck {
  roles?: readonly string[];
  actions?: readonly string[];
  requireAll?: boolean; // If true, user must have ALL specified roles/actions. If false, user needs ANY of them.
}

/**
 * Check if user has specific permission based on roles or actions
 */
export const hasPermission = (
  user: User | null,
  permission: PermissionCheck,
): boolean => {
  if (!user) return false;

  const { roles = [], actions = [], requireAll = false } = permission;

  // If no specific permissions required, allow access
  if (roles.length === 0 && actions.length === 0) return true;

  const userRoles = user.roles?.map((role) => role.name) || [];
  const userActions = user.actions?.map((action) => action.name) || [];

  // Check roles
  let hasRequiredRoles = true;

  if (roles.length > 0) {
    if (requireAll) {
      hasRequiredRoles = roles.every((role) => userRoles.includes(role));
    } else {
      hasRequiredRoles = roles.some((role) => userRoles.includes(role));
    }
  }

  // Check actions
  let hasRequiredActions = true;

  if (actions.length > 0) {
    if (requireAll) {
      hasRequiredActions = actions.every((action) =>
        userActions.includes(action),
      );
    } else {
      hasRequiredActions = actions.some((action) =>
        userActions.includes(action),
      );
    }
  }

  // If both roles and actions are specified
  if (roles.length > 0 && actions.length > 0) {
    if (requireAll) {
      return hasRequiredRoles && hasRequiredActions;
    } else {
      return hasRequiredRoles || hasRequiredActions;
    }
  }

  // If only roles specified
  if (roles.length > 0) {
    return hasRequiredRoles;
  }

  // If only actions specified
  if (actions.length > 0) {
    return hasRequiredActions;
  }

  return false;
};

/**
 * Quick check for specific role
 */
export const hasRole = (user: User | null, roleName: string): boolean => {
  return hasPermission(user, { roles: [roleName] });
};

/**
 * Quick check for specific action
 */
export const hasAction = (user: User | null, actionName: string): boolean => {
  return hasPermission(user, { actions: [actionName] });
};

/**
 * Check if user is admin (has Administrator role)
 */
export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, "Administrator");
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (user: User | null, roleNames: string[]): boolean => {
  return hasPermission(user, { roles: roleNames, requireAll: false });
};

/**
 * Check if user has all of the specified roles
 */
export const hasAllRoles = (
  user: User | null,
  roleNames: string[],
): boolean => {
  return hasPermission(user, { roles: roleNames, requireAll: true });
};

/**
 * Check if user has any of the specified actions
 */
export const hasAnyAction = (
  user: User | null,
  actionNames: string[],
): boolean => {
  return hasPermission(user, { actions: actionNames, requireAll: false });
};

/**
 * Check if user has all of the specified actions
 */
export const hasAllActions = (
  user: User | null,
  actionNames: string[],
): boolean => {
  return hasPermission(user, { actions: actionNames, requireAll: true });
};

/**
 * Quick check for specific role by ID
 */
export const hasRoleById = (user: User | null, roleId: number): boolean => {
  if (!user) return false;

  return user.roles?.some((role) => role.id === roleId) || false;
};

/**
 * Check if user has any of the specified role IDs
 */
export const hasAnyRoleById = (
  user: User | null,
  roleIds: number[],
): boolean => { 
  if (!user) return false;

  return roleIds.some((roleId) => hasRoleById(user, roleId));
};

/**
 * Check if user has all of the specified role IDs
 */
export const hasAllRolesById = (
  user: User | null,
  roleIds: number[],
): boolean => {
  if (!user) return false;

  return roleIds.every((roleId) => hasRoleById(user, roleId));
};

/**
 * Quick check for specific action by ID
 */
export const hasActionById = (user: User | null, actionId: number): boolean => {
  if (!user) return false;

  return user.actions?.some((action) => action.id === actionId) || false;
};

/**
 * Check if user has any of the specified action IDs
 */
export const hasAnyActionById = (
  user: User | null,
  actionIds: number[],
): boolean => {
  if (!user) return false;

  return actionIds.some((actionId) => hasActionById(user, actionId));
};

/**
 * Check if user has all of the specified action IDs
 */
export const hasAllActionsById = (
  user: User | null,
  actionIds: number[],
): boolean => {
  if (!user) return false;

  return actionIds.every((actionId) => hasActionById(user, actionId));
};

/**
 * Alias to check permissions using object-literal style at call-sites.
 * Example: asPermission(currentUser, { actions: ["projects.create"] })
 */
export const asPermission = (
  user: User | null,
  permission: PermissionCheck,
): boolean => {
  return hasPermission(user, permission);
};

/**
 * Common permission presets for easy use
 */
export const Permissions = {
  // Admin permissions
  ADMIN: { roles: ["Administrator", "Admin"] },
  SUPER_ADMIN: { roles: ["Super Administrator", "SuperAdmin"] },

  // User management permissions
  USER_MANAGEMENT: { actions: ["User Management", "Manage Users"] },
  USER_CREATE: { actions: ["Create User", "Add User", "users.create"] },
  USER_READ: { actions: ["View User", "Read User", "users.read"] },
  USER_UPDATE: { actions: ["Edit User", "Update User", "users.update"] },
  USER_DELETE: { actions: ["Delete User", "Remove User", "users.delete"] },
  USER_FULL_ACCESS: {
    actions: [
      "User Management",
      "Manage Users",
      "users.create",
      "users.read",
      "users.update",
      "users.delete",
    ],
  },

  // Project permissions
  PROJECT_MANAGEMENT: { actions: ["Project Management", "Manage Projects"] },
  PROJECT_CREATE: {
    actions: ["Create Project", "Add Project", "projects.create"],
  },
  PROJECT_READ: { actions: ["View Project", "Read Project", "projects.read"] },
  PROJECT_UPDATE: {
    actions: ["Edit Project", "Update Project", "projects.update"],
  },
  PROJECT_DELETE: {
    actions: ["Delete Project", "Remove Project", "projects.delete"],
  },
  PROJECT_VIEW: { actions: ["View Project", "Read Project", "projects.read"] },

  // Role management permissions
  ROLE_MANAGEMENT: { actions: ["Role Management", "Manage Roles"] },

  // System permissions
  SYSTEM_ADMIN: { actions: ["System Administration", "System Admin"] },

  // Department permissions
  DEPARTMENT_MANAGEMENT: {
    actions: ["Department Management", "Manage Departments"],
  },

  // Timeline permissions
  TIMELINE_MANAGEMENT: { actions: ["Timeline Management", "Manage Timeline"] },

  // Task permissions
  TASK_MANAGEMENT: { actions: ["Task Management", "Manage Tasks"] },
  TASK_CREATE: { actions: ["Create Task", "Add Task"] },
  TASK_EDIT: { actions: ["Edit Task", "Update Task"] },
  TASK_DELETE: { actions: ["Delete Task", "Remove Task"] },
  TASK_VIEW: { actions: ["View Task", "Read Task"] },
} as const;
