import React from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";

import DefaultLayout from "@/layouts/default";
import { useLanguage } from "@/contexts/LanguageContext";
import UrgentNotifications from "@/components/UrgentNotifications";
import RequirementOverview from "@/components/RequirementOverview";
import TeamWorkloadPerformance from "@/components/TeamWorkloadPerformanceNew";
import ProjectPipeline from "@/components/ProjectPipeline";
import Calendar from "@/components/Calendar";

export default function IndexPage() {
  const { t, language } = useLanguage();

  return (
    <DefaultLayout>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-success">3</p>
              <p className="text-sm text-default-600">
                {t("dashboard.activeProjects")}
              </p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-primary">8</p>
              <p className="text-sm text-default-600">
                {t("dashboard.totalTasks")}
              </p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-warning">5</p>
              <p className="text-sm text-default-600">
                {t("dashboard.inProgress")}
              </p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-danger">2</p>
              <p className="text-sm text-default-600">
                {t("dashboard.overdue")}
              </p>
            </div>
          </Card>
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
            <Calendar showSidebar={false} maxHeight="500px" />
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
                <UrgentNotifications 
                  maxNotifications={5} 
                  useMockData={true}
                />
              </div>
              
              {/* Requirement Overview Section */}
              <div className="space-y-4">
                <RequirementOverview useMockData={true} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
