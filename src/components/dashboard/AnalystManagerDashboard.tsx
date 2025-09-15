import React from "react";
import { Button } from "@heroui/button";

import { useLanguage } from "@/contexts/LanguageContext";
import UrgentNotifications from "@/components/UrgentNotifications";
import RequirementOverview from "@/components/RequirementOverview";
import TeamWorkloadPerformance from "@/components/TeamWorkloadPerformanceNew";
import ProjectPipeline from "@/components/ProjectPipeline";
import Calendar from "@/components/calendar";
import ModernQuickStats from "@/components/ModernQuickStats";

export default function AnalystManagerDashboard() {
  const { t, language } = useLanguage();

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
          </div>
        </div>
      </div>
    </div>
  );
}
