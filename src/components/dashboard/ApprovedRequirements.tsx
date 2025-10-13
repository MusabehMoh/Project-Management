import type { ProjectRequirement } from "@/types/projectRequirement";

import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Skeleton } from "@heroui/skeleton";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Clock, User } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import ErrorWithRetry from "@/components/ErrorWithRetry";
import { useApprovedRequirements } from "@/hooks/useApprovedRequirements";
interface ApprovedRequirementsProps {
  className?: string;
}

export default function ApprovedRequirements({
  className = "",
}: ApprovedRequirementsProps) {
  const { t, direction } = useLanguage();
  const navigate = useNavigate();

  // Current hook usage - filter by status = 3 (Approved) only
  const { requirements, loading, error, refreshData, totalRequirements } =
    useApprovedRequirements({
      pageSize: 5,
      initialFilters: { status: "3" }, // Filter by Approved status only
    });
  const totalCount = totalRequirements;
  const refresh = refreshData;

  const getPriorityColor = (priority: string | number | undefined) => {
    const value = typeof priority === "string" ? priority : String(priority);

    switch (value) {
      case "3":
      case "high":
        return "danger";
      case "2":
      case "medium":
        return "warning";
      case "1":
      case "low":
        return "success";
      case "4":
      case "critical":
        return "danger";
      default:
        return "default";
    }
  };

  const getPriorityText = (priority: string | number | undefined) => {
    const value = typeof priority === "string" ? priority : String(priority);

    switch (value) {
      case "3":
      case "high":
        return t("priority.high");
      case "2":
      case "medium":
        return t("priority.medium");
      case "1":
      case "low":
        return t("priority.low");
      case "4":
      case "critical":
        return t("priority.critical");
      default:
        return value ?? "";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleViewRequirement = (projectId: number, requirementId: number) => {
    navigate(
      `/development-requirements?highlightRequirement=${requirementId}&scrollTo=${requirementId}`,
    );
  };

  const handleViewAllRequirements = () => {
    navigate("/development-requirements");
  };

  if (loading) {
    return (
      <Card
        className={`${className} border-default-200`}
        dir={direction}
        shadow="sm"
      >
        <CardBody className="space-y-4 p-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-2/3 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>

          {/* Requirements list skeleton */}
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="p-3 border border-default-200 rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-1/2 rounded" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-3/4 rounded" />
                <div className="flex space-x-2">
                  <Skeleton className="h-3 w-16 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Footer skeleton */}
          <Skeleton className="h-10 w-full rounded-lg" />
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card
        className={`${className} border-default-200`}
        dir={direction}
        shadow="sm"
      >
        <CardBody className="min-h-[200px]">
          <ErrorWithRetry error={error} onRetry={refresh} />
        </CardBody>
      </Card>
    );
  }

  const listEmpty = !Array.isArray(requirements) || requirements.length === 0;

  return (
    <Card
      className={`${className} border-default-200`}
      dir={direction}
      shadow="sm"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <h3 className="font-semibold text-foreground">
              {t("developerDashboard.approvedRequirements")}
            </h3>
            <Chip color="success" size="sm" variant="flat">
              {totalCount}
            </Chip>
          </div>
          <Button
            className="text-xs"
            color="primary"
            size="sm"
            variant="light"
            onPress={handleViewAllRequirements}
          >
            {t("common.viewAll")}
          </Button>
        </div>
      </CardHeader>

      <CardBody className="pt-0">
        {listEmpty ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="w-12 h-12 text-default-300 mb-3" />
            <p className="text-default-500 text-center">
              {t("developerDashboard.noApprovedRequirements")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requirements.map(
              (requirement: ProjectRequirement, index: number) => (
                <div key={requirement.id}>
                  <div
                    className="flex items-start justify-between p-3 rounded-lg bg-default-50 hover:bg-default-100 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      handleViewRequirement(
                        requirement.project?.id || 0,
                        requirement.id,
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleViewRequirement(
                          requirement.project?.id || 0,
                          requirement.id,
                        );
                      }
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm text-foreground truncate">
                          {requirement.name}
                        </p>
                        <Chip
                          color={getPriorityColor(requirement.priority)}
                          size="sm"
                          variant="flat"
                        >
                          {getPriorityText(requirement.priority)}
                        </Chip>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-default-400">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span className="truncate">
                            {requirement.project?.applicationName ||
                              t("common.unknownProject")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {formatDate(requirement.expectedCompletionDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <Button
                        className="min-w-0 px-3"
                        color="primary"
                        size="sm"
                        variant="flat"
                        onPress={() =>
                          handleViewRequirement(
                            requirement.project?.id || 0,
                            requirement.id,
                          )
                        }
                      >
                        {t("common.view")}
                      </Button>
                    </div>
                  </div>

                  {index < requirements.length - 1 && (
                    <Divider className="my-2" />
                  )}
                </div>
              ),
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
