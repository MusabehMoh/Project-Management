import React, { useState } from "react";

import DeveloperQuickActions from "./developer/DeveloperQuickActions";
import DeveloperWorkloadPerformance from "./developer/DeveloperWorkloadPerformance";
import ApprovedRequirements from "./ApprovedRequirements";
import TaskCompletionTracker from "./developer/TaskCompletionTracker";
import DHtmlGanttChart from "./developer/DHtmlGanttChart";
import DeveloperCalendar from "./calendar";

import { useLanguage } from "@/contexts/LanguageContext";
import { developerQuickActionsService } from "@/services/api/developerQuickActionsService";
import ModernQuickStats from "@/components/dashboard/ModernQuickStats";

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
          {t("developerDashboard.title")}
        </h1>
        <p className="text-lg text-default-600">
          {t("developerDashboard.subtitle")}
        </p>
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
            {t("developerDashboard.teamWorkload")}
          </h2>
          <DeveloperWorkloadPerformance />
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            {t("calendar.title")}
          </h2>
          <DeveloperCalendar showSidebar={false} />
        </div>
      </div>

      {/* Full Width Project Timeline Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">
          {t("developerDashboard.projectTimeline")}
        </h2>
        <DHtmlGanttChart height="400px" />
      </div>

      {/* Task Completion Only */}
      <div className="space-y-6">
        <div className="space-y-4">
          <TaskCompletionTracker useMockData={true} />
        </div>
      </div>
    </div>
  );
}
