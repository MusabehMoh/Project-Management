import { ReactNode } from "react";

import { useAuth } from "@/hooks/useUsers";

interface PermissionGateProps {
  action: string;
  resource?: string;
  role?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Permission Gate Component
 * Controls access to UI elements based on user permissions
 */
export const PermissionGate = ({
  action,
  resource,
  role,
  children,
  fallback = null,
}: PermissionGateProps) => {
  const { hasPermission, hasRole } = useAuth();

  // Check role-based access
  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  // Check permission-based access
  if (!hasPermission(action, resource)) {
    return <>{fallback}</>;
  }

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
