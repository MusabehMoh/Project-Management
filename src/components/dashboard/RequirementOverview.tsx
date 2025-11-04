import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Progress } from "@heroui/progress";
import { Skeleton } from "@heroui/skeleton";

import { useLanguage } from "@/contexts/LanguageContext";
import { useRequirementOverview } from "@/hooks";

interface RequirementOverviewProps {
  useMockData?: boolean; // Kept for backward compatibility but ignored
}

export const RequirementOverview: React.FC<RequirementOverviewProps> = () => {
  const { t, language } = useLanguage();
  const { data, loading, error } = useRequirementOverview();

  // Use real data from API
  const requirementsData = data || {
    newRequirements: { count: 0 },
    ongoingRequirements: { count: 0 },
    activeRequirements: 0,
    pendingApprovals: 0,
  };

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"}>
      <Card className="w-full shadow-md border border-default-200">
        <CardHeader className="pb-0">
          <h3 className="text-lg font-medium text-foreground">
            {t("dashboard.requirementOverview")}
          </h3>
        </CardHeader>

        <CardBody className="px-4 py-3">
          {loading ? (
            /* Loading skeleton */
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Skeleton className="h-4 w-3/4 rounded-md mb-2" />
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-3/4 rounded-md mb-2" />
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              </div>
              <div className="border-l border-default-200 pl-4 flex flex-col justify-center">
                <div className="text-center mb-3">
                  <Skeleton className="h-4 w-20 mx-auto rounded-md mb-2" />
                  <Skeleton className="h-8 w-16 mx-auto rounded-md" />
                </div>
                <Divider />
                <div className="text-center mt-3">
                  <Skeleton className="h-4 w-24 mx-auto rounded-md mb-2" />
                  <Skeleton className="h-8 w-12 mx-auto rounded-md" />
                </div>
              </div>
            </div>
          ) : error ? (
            /* Error state */
            <div className="text-center py-4 text-danger">
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            /* Data display */
          <div
            className="grid grid-cols-2 gap-4"
            dir={language === "ar" ? "rtl" : "ltr"}
          >
            {/* Left column - vertical graphs */}
            <div className="space-y-4">
              {/* New Requirements - Simple count display */}
              <div className="text-center py-2">
                <p className="text-sm font-medium mb-1">
                  {t("requirements.new")}
                </p>
                <p className="text-3xl font-bold text-success">
                  {requirementsData.newRequirements.count}
                </p>
              </div>

              {/* Ongoing Requirements - Simple count display */}
              <div className="text-center py-2">
                <p className="text-sm font-medium mb-1">
                  {t("requirements.ongoing")}
                </p>
                <p className="text-3xl font-bold text-warning">
                  {requirementsData.ongoingRequirements.count}
                </p>
              </div>
            </div>

            {/* Right column - count stats */}
            <div
              className={`${language === "ar" ? "border-r pe-4" : "border-l ps-4"} border-default-200 flex flex-col justify-center`}
            >
              {/* Active Requirements */}
              <div className="text-center mb-3">
                <p className="text-sm font-medium">
                  {t("requirements.active")}
                </p>
                <p className="text-2xl font-bold text-primary">
                  {requirementsData.activeRequirements}
                </p>
              </div>

              <Divider />

              {/* Pending Approvals */}
              <div className="text-center mt-3">
                <p className="text-sm font-medium">
                  {t("requirements.pendingApprovals")}
                </p>
                <p className="text-2xl font-bold text-warning">
                  {requirementsData.pendingApprovals}
                </p>
              </div>
            </div>
          </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default RequirementOverview;
