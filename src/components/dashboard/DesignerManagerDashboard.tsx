import React from "react";

import DesignerQuickActions from "./designer/DesignerQuickActions";
import DesignerWorkloadPerformance from "./designer/DesignerWorkloadPerformance";
import Calendar from "./calendar";

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
        <p className="text-xl text-default-600">
          {t("designerDashboard.subtitle")}
        </p>
      </div>

      {/* Quick Actions and Calendar Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <DesignerQuickActions />
        
        {/* Calendar */}
        <Calendar showSidebar={false} />
      </div>

      {/* Workload Performance - Full Width */}
      <DesignerWorkloadPerformance />
    </div>
  );
}
