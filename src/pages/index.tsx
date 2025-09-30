import React from "react";

import AnalystManagerDashboard from "@/components/dashboard/AnalystManagerDashboard";
import DeveloperManagerDashboard from "@/components/dashboard/DeveloperManagerDashboard";
import LoadingLogo from "@/components/LoadingLogo";
import { usePermissions } from "@/hooks/usePermissions";
import { usePageTitle } from "@/hooks";

export default function IndexPage() {
  const { hasAnyRole, loading: userLoading } = usePermissions();

  // Set page title
  usePageTitle("home.title", { fallback: "Dashboard" });

  // Show loading state while user data is being fetched
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingLogo />
      </div>
    );
  }

  // Check if user has Analyst Department Manager role
  const hasAccess = hasAnyRole(["Analyst Department Manager", "Administrator"]);
  const hasDevManagerRole = hasAnyRole(["Developer Manager", "Administrator"]);

  return (
    <>
      {hasAccess ? <AnalystManagerDashboard /> : <div />}
      {/* {hasDevManagerRole ? <DeveloperManagerDashboard /> : <div />} */}
    </>
  );
}
