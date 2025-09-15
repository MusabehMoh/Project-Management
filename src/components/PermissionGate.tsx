import type { PermissionCheck } from "@/utils/permissions";

import { ReactNode } from "react";

import { usePermissions } from "@/hooks/usePermissions";

interface PermissionGateProps {
  children: ReactNode;
  permission?: PermissionCheck;
  role?: string;
  roles?: string[];
  action?: string;
  actions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}

/**
 * Permission Gate Component - Enhanced version
 * Controls access to UI elements based on user permissions
 *
 * Examples:
 * <PermissionGate adminOnly>
 *   <AdminPanel />
 * </PermissionGate>
 *
 * <PermissionGate role="Administrator">
 *   <UserManagement />
 * </PermissionGate>
 *
 * <PermissionGate action="Create User">
 *   <CreateUserButton />
 * </PermissionGate>
 *
 * <PermissionGate permission={{ roles: ["Admin", "Manager"], requireAll: false }}>
 *   <SomeComponent />
 * </PermissionGate>
 */
export const PermissionGate = ({
  children,
  permission,
  role,
  roles,
  action,
  actions,
  requireAll = false,
  fallback = null,
  adminOnly = false,
  superAdminOnly = false,
}: PermissionGateProps) => {
  const {
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAction,
    hasAnyAction,
    isAdmin,
    isSuperAdmin,
    loading,
  } = usePermissions();

  // Show loading state or nothing while checking permissions
  if (loading) {
    return <>{fallback}</>;
  }

  // Check for super admin only
  if (superAdminOnly) {
    return isSuperAdmin() ? <>{children}</> : <>{fallback}</>;
  }

  // Check for admin only
  if (adminOnly) {
    return isAdmin() ? <>{children}</> : <>{fallback}</>;
  }

  // Use custom permission object
  if (permission) {
    return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
  }

  // Check single role
  if (role) {
    return hasRole(role) ? <>{children}</> : <>{fallback}</>;
  }

  // Check multiple roles
  if (roles && roles.length > 0) {
    const hasRequiredRoles = requireAll
      ? roles.every((r) => hasRole(r))
      : hasAnyRole(roles);

    return hasRequiredRoles ? <>{children}</> : <>{fallback}</>;
  }

  // Check single action
  if (action) {
    return hasAction(action) ? <>{children}</> : <>{fallback}</>;
  }

  // Check multiple actions
  if (actions && actions.length > 0) {
    const hasRequiredActions = requireAll
      ? actions.every((a) => hasAction(a))
      : hasAnyAction(actions);

    return hasRequiredActions ? <>{children}</> : <>{fallback}</>;
  }

  // If no permission checks specified, render children
  return <>{children}</>;
};

/**
 * Access Denied Component
 */
export const AccessDenied = () => {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="text-6xl mb-4">🔒</div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
      <p className="text-default-600">
        You don't have permission to access this resource.
      </p>
    </div>
  );
};
