import React, { useState } from "react";

import Calendar from "./calendar";
import TeamQuickActions from "./team-member/TeamQuickActions";
import TeamKanbanBoard from "./team-member/TeamKanbanBoard";

import { useLanguage } from "@/contexts/LanguageContext";
import ModernQuickStats from "@/components/dashboard/ModernQuickStats";

export default function TeamMemberDashboard() {
  const { t, language } = useLanguage();
  const [refreshKey, setRefreshKey] = useState(0);

  // Handle task status update from TeamQuickActions only
  // Kanban board handles its own updates internally, no need to refresh
  const handleQuickActionsUpdate = async (
    taskId: number,
    newStatus: string,
  ) => {
    try {
      console.log("Quick Actions updating task:", {
        taskId,
        newStatus,
      });

      // Refresh TeamQuickActions, MyAssignedTasks, MyNextDeadline, and Kanban
      setRefreshKey((prev) => prev + 1);

      console.log(`Successfully updated task ${taskId} to status ${newStatus}`);
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  // Handle Kanban drag-and-drop updates (no refresh needed for other components)
  const handleKanbanUpdate = async (taskId: number, newStatus: string) => {
    console.log("Kanban updating task:", {
      taskId,
      newStatus,
    });
    // Kanban updates its own state optimistically, no need to refresh anything
  };

  return (
    <div className={`space-y-8 pb-16 ${language === "ar" ? "rtl" : "ltr"}`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          {t("teamDashboard.title")}
        </h1>
        <p className="text-lg text-default-600">
          {t("teamDashboard.subtitle")}
        </p>
      </div>

      {/* Quick Stats */}
      <ModernQuickStats />

      {/* Kanban Board - Full Width */}
      <TeamKanbanBoard onTaskUpdate={handleKanbanUpdate} />

      {/* Quick Actions (50%) and Calendar (50%) */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamQuickActions
          key={refreshKey}
          onTaskUpdate={handleQuickActionsUpdate}
        />
        <Calendar maxHeight="600px" showSidebar={false} />
      </div> */}

      {/* Calendar - Full Width */}
      <Calendar maxHeight="600px" showSidebar={false} />
    </div>
  );
}
