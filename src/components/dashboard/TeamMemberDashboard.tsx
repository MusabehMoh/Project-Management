import React, { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";

import Calendar from "./calendar";
import MyAssignedTasks from "./team-member/MyAssignedTasks";
import TeamQuickActions from "./team-member/TeamQuickActions";
import MyNextDeadline from "./team-member/MyNextDeadline";
import TeamKanbanBoard from "./team-member/TeamKanbanBoard";

import { useLanguage } from "@/contexts/LanguageContext";
import ModernQuickStats from "@/components/ModernQuickStats";

export default function TeamMemberDashboard() {
  const { t, language } = useLanguage();
  const [refreshKey, setRefreshKey] = useState(0);

  // Handle task status update from TeamQuickActions only
  // Kanban board handles its own updates internally, no need to refresh
  const handleQuickActionsUpdate = async (taskId: number, newStatus: string) => {
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

      {/* Grid Layout: Quick Actions with Calendar on left, My Tasks on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Actions + Calendar (70%) */}
        <div className="lg:col-span-2 space-y-6">
          <TeamQuickActions key={refreshKey} onTaskUpdate={handleQuickActionsUpdate} />
          <Calendar maxHeight="600px" showSidebar={false} />
        </div>

        {/* Right Column: My Assigned Tasks + Next Deadline (30%) */}
        <div className="lg:col-span-1 space-y-6">
          <MyAssignedTasks key={refreshKey} />
          <MyNextDeadline key={refreshKey} />
        </div>
      </div>
    </div>
  );
}
