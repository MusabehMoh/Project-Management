import React, { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";

import Calendar from "./calendar";
import MyAssignedTasks from "./team-member/MyAssignedTasks";
import TeamQuickActions from "./team-member/TeamQuickActions";
import MyNextDeadline from "./team-member/MyNextDeadline";

import { useLanguage } from "@/contexts/LanguageContext";
import ModernQuickStats from "@/components/ModernQuickStats";

export default function TeamMemberDashboard() {
  const { t, language } = useLanguage();
  const [refreshKey, setRefreshKey] = useState(0);

  // Handle task status update from Quick Actions
  const handleTaskUpdate = async (taskId: number, newStatus: string) => {
    try {
      console.log("Updating task:", {
        taskId,
        newStatus,
      });

      // Refresh the components to show updated data
      setRefreshKey((prev) => prev + 1);

      console.log(`Successfully updated task ${taskId} to status ${newStatus}`);
    } catch (error) {
      console.error("Failed to update task:", error);
    }
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

      {/* Grid Layout: Quick Actions with Calendar on left, My Tasks on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Actions + Calendar (70%) */}
        <div className="lg:col-span-2 space-y-6">
          <TeamQuickActions key={refreshKey} onTaskUpdate={handleTaskUpdate} />
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
