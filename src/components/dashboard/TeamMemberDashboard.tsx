import React, { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";

import Calendar from "./calendar";
import MyAssignedTasks from "./team-member/MyAssignedTasks";
import TeamQuickActions from "./team-member/TeamQuickActions";

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

      {/* Quick Actions and My Tasks Section */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        <div className="lg:w-[70%] space-y-4">
          <TeamQuickActions key={refreshKey} onTaskUpdate={handleTaskUpdate} />
        </div>

        <div className="lg:w-[30%] space-y-4">
          <MyAssignedTasks key={refreshKey} />
        </div>
      </div>

      {/* Calendar Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">
          {t("calendar.title")}
        </h2>
        <Calendar maxHeight="600px" showSidebar={true} />
      </div>

      {/* Additional Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card shadow="sm">
          <CardBody className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-default-500">
                {t("teamDashboard.tasksCompleted")}
              </p>
              <p className="text-3xl font-bold text-success">0</p>
              <p className="text-xs text-default-400">
                {t("teamDashboard.thisMonth")}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card shadow="sm">
          <CardBody className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-default-500">
                {t("teamDashboard.averageCompletionTime")}
              </p>
              <p className="text-3xl font-bold text-primary">-</p>
              <p className="text-xs text-default-400">
                {t("teamDashboard.hours")}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card shadow="sm">
          <CardBody className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-default-500">
                {t("teamDashboard.upcomingDeadlines")}
              </p>
              <p className="text-3xl font-bold text-warning">0</p>
              <p className="text-xs text-default-400">
                {t("teamDashboard.nextWeek")}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
