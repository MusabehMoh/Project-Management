import React from "react";

import DesignerQuickActions from "./designer/DesignerQuickActions";
import DesignerWorkloadPerformance from "./designer/DesignerWorkloadPerformance";
import Calendar from "./calendar";
import ModernQuickStats from "@/components/dashboard/ModernQuickStats";

import { useLanguage } from "@/contexts/LanguageContext";

export default function DesignerManagerDashboard() {
  const { t, language } = useLanguage();

  return (
    <div className={`space-y-8 pb-16 ${language === "ar" ? "rtl" : "ltr"}`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          {t("designerDashboard.title")}
        </h1>
        <p className="text-lg text-default-600">
          {t("designerDashboard.subtitle")}
        </p>
      </div>

      {/* Quick Stats */}
      <ModernQuickStats />

      {/* Quick Actions and Calendar Section */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        <div className="lg:w-[50%] space-y-4">
          <DesignerQuickActions />
        </div>

        <div className="lg:w-[50%] space-y-4">
          <Calendar showSidebar={false} />
        </div>
      </div>

      {/* Workload Performance - Full Width */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">
          {t("designerDashboard.teamPerformance")}
        </h2>
        <DesignerWorkloadPerformance />
      </div>
    </div>
  );
}
