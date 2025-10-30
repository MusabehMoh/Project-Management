import React, { useState } from "react";

import QCQuickActions from "./qc/QCQuickActions";
import ApprovedRequirements from "./ApprovedRequirements";
import DeveloperCalendar from "./calendar";

import { useLanguage } from "@/contexts/LanguageContext";
import ModernQuickStats from "@/components/dashboard/ModernQuickStats";
import { showSuccessToast, showErrorToast } from "@/utils/toast";

export default function QualityControlManagerDashboard() {
  const { t, language } = useLanguage();
  const [refreshKey, setRefreshKey] = useState(0);

  // Handle QC assignment
  const handleAssignQC = async (_task: any, _qcId: string) => {
    try {
      // TODO: Implement actual API call
      // await qcQuickActionsService.assignQC(task.id, qcId);

      // Show success toast
      showSuccessToast(t("qcDashboard.assignQCSuccess"));

      // Refresh the quick actions to show updated data
      setRefreshKey((prev) => prev + 1);
    } catch {
      // Show error toast
      showErrorToast(t("qcDashboard.assignQCError"));
    }
  };

  return (
    <div className={`space-y-8 pb-16 ${language === "ar" ? "rtl" : "ltr"}`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          {t("qcDashboard.title")}
        </h1>
        <p className="text-lg text-default-600">{t("qcDashboard.subtitle")}</p>
      </div>

      {/* Quick Stats */}
      <ModernQuickStats />

      {/* Quick Actions and Pending Tasks Section */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        <div className="lg:w-[70%] space-y-4">
          <QCQuickActions
            key={refreshKey}
            autoRefresh={true}
            onAssignQC={handleAssignQC}
          />
        </div>

        <div className="lg:w-[30%] space-y-4">
          <ApprovedRequirements />
        </div>
      </div>

      {/* QC Team Performance and Calendar */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            {t("qcDashboard.teamPerformance")}
          </h2>
          {/* TODO: Add QC Team Performance component similar to DeveloperWorkloadPerformance */}
          <div className="p-8 text-center text-default-500">
            {t("qcDashboard.performanceComingSoon")}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            {t("calendar.title")}
          </h2>
          <DeveloperCalendar showSidebar={false} />
        </div>
      </div>
    </div>
  );
}
