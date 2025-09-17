import React, { useState } from "react";
import { Button } from "@heroui/button";
import { useDisclosure } from "@heroui/modal";
import { useNavigate } from "react-router-dom";
import { addToast } from "@heroui/toast";

import { useLanguage } from "@/contexts/LanguageContext";
import { quickActionsService } from "@/services/api";
import UrgentNotifications from "@/components/UrgentNotifications";
import RequirementOverview from "@/components/RequirementOverview";
import TeamWorkloadPerformance from "@/components/TeamWorkloadPerformanceNew";
import ProjectPipeline from "@/components/ProjectPipeline";
import Calendar from "@/components/calendar";
import ModernQuickStats from "@/components/ModernQuickStats";
import QuickActions from "@/components/QuickActions";
import PendingRequirements from "@/components/PendingRequirements";

export default function AnalystManagerDashboard() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  // Handle project editing from Quick Actions
  const handleEditProject = (project: any) => {
    // Navigate to projects page and trigger edit modal
    navigate(`/projects?edit=${project.id}`);
  };

  // Handle analyst assignment
  const handleAssignAnalyst = async (project: any, analystId: string) => {
    try {
      console.log("Assigning analyst:", { projectId: project.id, analystId, projectName: project.applicationName });
      
      const response = await quickActionsService.assignAnalyst(project.id, analystId);
      
      console.log("Assignment response:", response);
      
      // Refresh the quick actions to show updated data
      setRefreshKey((prev) => prev + 1);
      
      // You could add a success toast notification here
      console.log(`Successfully assigned analyst ${analystId} to project ${project.applicationName}`);
    } catch (error) {
      console.error("Failed to assign analyst:", error);
      // You could add an error toast notification here
    }
  };

  return (
    <div className={`space-y-8 pb-16 ${language === "ar" ? "rtl" : "ltr"}`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          {t("dashboard.title")}
        </h1>
        <p className="text-lg text-default-600">{t("dashboard.subtitle")}</p>

        <div className="flex gap-4 justify-center">
          <Button color="primary" size="lg">
            {t("dashboard.newProject")}
          </Button>
          <Button size="lg" variant="bordered">
            {t("dashboard.importData")}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <ModernQuickStats />

      {/* Quick Actions Banner */}
      <QuickActions
        key={refreshKey}
        autoRefresh={true}
        className="mb-6"
        onAssignAnalyst={handleAssignAnalyst}
      />

      {/* Team Workload Performance and Calendar */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            {t("dashboard.teamWorkload")}
          </h2>
          <TeamWorkloadPerformance />
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            {t("calendar.title")}
          </h2>
          <Calendar maxHeight="500px" showSidebar={false} />
        </div>
      </div>

      {/* Project Pipeline Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column - Project Pipeline */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            {t("dashboard.projectPipeline")}
          </h2>
          <ProjectPipeline />
        </div>

        {/* Side Column - Urgent Notifications and Requirement Overview */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Updates Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                {t("dashboard.updates")}
              </h2>
              <UrgentNotifications maxNotifications={5} useMockData={true} />
            </div>

            {/* Requirement Overview Section */}
            <div className="space-y-4">
              <RequirementOverview useMockData={true} />
            </div>

            {/* Pending Requirements Section */}
            <div className="space-y-4">
              <PendingRequirements />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
