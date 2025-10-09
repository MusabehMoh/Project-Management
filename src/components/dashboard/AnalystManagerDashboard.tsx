import React, { useState } from "react";
import { Button } from "@heroui/button";
import { useNavigate } from "react-router-dom";

import UrgentNotifications from "./UrgentNotifications";
import RequirementOverview from "./RequirementOverview";
import TeamWorkloadPerformance from "./TeamWorkloadPerformanceNew";
import ProjectPipeline from "./ProjectPipeline";
import Calendar from "./calendar";
import PendingRequirements from "./PendingRequirements";
import RequirementCompletionTracker from "./RequirementCompletionTracker";

import { useLanguage } from "@/contexts/LanguageContext";
import { quickActionsService } from "@/services/api";
import ModernQuickStats from "@/components/dashboard/ModernQuickStats";
import QuickActions from "@/components/QuickActions";

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
      console.log("Assigning analyst:", {
        projectId: project.id,
        analystId,
        projectName: project.applicationName,
      });

      const response = await quickActionsService.assignAnalyst(
        project.id,
        analystId,
      );

      console.log("Assignment response:", response);

      // Refresh the quick actions to show updated data
      setRefreshKey((prev) => prev + 1);

      // You could add a success toast notification here
      console.log(
        `Successfully assigned analyst ${analystId} to project ${project.applicationName}`,
      );
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

      {/* Quick Actions and Pending Requirements Section */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        <div className="lg:w-[70%] space-y-4">
          <QuickActions
            key={refreshKey}
            autoRefresh={true}
            onAssignAnalyst={handleAssignAnalyst}
          />
        </div>

        <div className="lg:w-[30%] space-y-4">
          <PendingRequirements />
        </div>
      </div>

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
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              {t("dashboard.projectPipeline")}
            </h2>
            <ProjectPipeline />
          </div>

          {/* Requirement Completion Tracking */}
          <div className="space-y-4">
            <RequirementCompletionTracker useMockData={true} />
          </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}
