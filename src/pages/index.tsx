import React from "react";

import DeveloperManagerDashboard from "@/components/dashboard/DeveloperManagerDashboard";
import LoadingLogo from "@/components/LoadingLogo";
import { usePermissions } from "@/hooks/usePermissions";
import { usePageTitle } from "@/hooks";
import AnalystManagerDashboard from "@/components/dashboard/AnalystManagerDashboard";
import TeamMemberDashboard from "@/components/dashboard/TeamMemberDashboard";
import DesignerManagerDashboard from "@/components/dashboard/DesignerManagerDashboard";
import { RoleIds } from "@/constants/roles";

export default function IndexPage() {
  const { hasAnyRoleById, loading: userLoading } = usePermissions();

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
  const hasAnalystRole = hasAnyRoleById([RoleIds.ANALYST_DEPARTMENT_MANAGER]);
  const hasDevManagerRole = hasAnyRoleById([RoleIds.DEVELOPMENT_MANAGER]);
  const hasDesignerManagerRole = hasAnyRoleById([RoleIds.DESIGNER_MANAGER]);

  // Check if user is a team member (QC, Developer, Designer)
  const isTeamMember = hasAnyRoleById([
    RoleIds.QUALITY_CONTROL_TEAM_MEMBER,
    RoleIds.SOFTWARE_DEVELOPER,
    RoleIds.ANALYST,
    RoleIds.DESIGNER_TEAM_MEMBER,
  ]);

  return (
    <>
      {hasAnalystRole ? <AnalystManagerDashboard /> : <div />}
      {hasDevManagerRole ? <DeveloperManagerDashboard /> : <div />}
      {hasDesignerManagerRole ? <DesignerManagerDashboard /> : <div />}
      {isTeamMember ? <TeamMemberDashboard /> : <div />}
    </>
  );
}
