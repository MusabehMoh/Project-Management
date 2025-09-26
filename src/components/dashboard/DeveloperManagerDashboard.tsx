import React, { useState } from "react";
import { Button } from "@heroui/button";

import { useLanguage } from "@/contexts/LanguageContext";
import { developerQuickActionsService } from "@/services/api/developerQuickActionsService";
import ModernQuickStats from "@/components/ModernQuickStats";
import DeveloperQuickActions from "@/components/dashboard/developer/DeveloperQuickActions";
import DeveloperWorkloadPerformance from "@/components/dashboard/developer/DeveloperWorkloadPerformance";
import CodeReviewTracker from "@/components/dashboard/developer/CodeReviewTracker";
import DeploymentPipeline from "@/components/dashboard/developer/DeploymentPipeline";
import DeveloperCalendar from "@/components/calendar";
import SprintProgress from "@/components/dashboard/developer/SprintProgress";
import ApprovedRequirements from "@/components/ApprovedRequirements";
import TaskCompletionTracker from "@/components/dashboard/developer/TaskCompletionTracker";
import DHtmlGanttChart from "@/components/dashboard/developer/DHtmlGanttChart";

export default function DeveloperManagerDashboard() {
  const { t, language } = useLanguage();
  const [refreshKey, setRefreshKey] = useState(0);

  // Handle task assignment
  const handleAssignDeveloper = async (task: any, developerId: string) => {
    try {
      await developerQuickActionsService.assignDeveloper(task.id, developerId);

      // Refresh the quick actions to show updated data
      setRefreshKey((prev) => prev + 1);
    } catch {
      // Handle error silently for now
    }
  };

  // Handle code review assignment
  const handleAssignReviewer = async (pullRequest: any, reviewerId: string) => {
    try {
      await developerQuickActionsService.assignReviewer(
        pullRequest.id,
        reviewerId,
      );

      setRefreshKey((prev) => prev + 1);
    } catch {
      // Handle error silently for now
    }
  };

  return (
    <div className={`space-y-8 pb-16 ${language === "ar" ? "rtl" : "ltr"}`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          {t("developerDashboard.title") || "Developer Management Dashboard"}
        </h1>
        <p className="text-lg text-default-600">
          {t("developerDashboard.subtitle") ||
            "Manage development teams, code reviews, and deployments"}
        </p>

        <div className="flex gap-4 justify-center">
          <Button color="primary" size="lg">
            {t("developerDashboard.newSprint") || "New Sprint"}
          </Button>
          <Button size="lg" variant="bordered">
            {t("developerDashboard.createRelease") || "Create Release"}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <ModernQuickStats />

      {/* Quick Actions and Pending Code Reviews Section */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        <div className="lg:w-[70%] space-y-4">
          <DeveloperQuickActions
            key={refreshKey}
            autoRefresh={true}
            onAssignDeveloper={handleAssignDeveloper}
            onAssignReviewer={handleAssignReviewer}
          />
        </div>

        <div className="lg:w-[30%] space-y-4">
          <ApprovedRequirements />
        </div>
      </div>

      {/* Developer Workload and Calendar */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            {t("developerDashboard.teamWorkload") ||
              "Development Team Workload"}
          </h2>
          <DeveloperWorkloadPerformance />
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            {t("calendar.title") || "Calendar"}
          </h2>
          <DeveloperCalendar maxHeight="500px" showSidebar={false} />
        </div>
      </div>

      {/* Deployment Pipeline and Gantt Chart Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column - Deployment Pipeline and Gantt Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              {t("developerDashboard.deploymentPipeline") ||
                "Deployment Pipeline"}
            </h2>
            <DeploymentPipeline />
          </div>

          {/* DHTMLX Gantt Chart Section */}
          <div className="space-y-4">
            <DHtmlGanttChart height="400px" useMockData={true} />
          </div>

          {/* Task Completion Tracking */}
          <div className="space-y-4">
            <TaskCompletionTracker useMockData={true} />
          </div>
        </div>

        {/* Side Column - Sprint Progress and Code Reviews */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Sprint Progress Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                {t("developerDashboard.sprintProgress") || "Sprint Progress"}
              </h2>
              <SprintProgress useMockData={true} />
            </div>

            {/* Code Review Tracker Section */}
            <div className="space-y-4">
              <CodeReviewTracker useMockData={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
