import React from "react";

import DefaultLayout from "@/layouts/default";
import AnalystManagerDashboard from "@/components/dashboard/AnalystManagerDashboard";
import { usePermissions } from "@/hooks/usePermissions";

export default function IndexPage() {
  const { hasAnyRole, loading: userLoading } = usePermissions();

  // Show loading state while user data is being fetched
  if (userLoading) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </DefaultLayout>
    );
  }

  // Check if user has Analyst Department Manager role
  const hasAccess = hasAnyRole(["Analyst Department Manager", "Administrator"]);

  return (
    <DefaultLayout>
      {hasAccess ? <AnalystManagerDashboard /> : <div />}
    </DefaultLayout>
  );
}
