import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Skeleton } from "@heroui/skeleton";
import { useNavigate } from "react-router-dom";
import { PenTool, Clock, User } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import ErrorWithRetry from "@/components/ErrorWithRetry";
import { useDraftRequirements } from "@/hooks/useDraftRequirements";

interface PendingRequirementsProps {
  className?: string;
}

export default function PendingRequirements({
  className = "",
}: PendingRequirementsProps) {
  const { t, direction } = useLanguage();
  const navigate = useNavigate();
  const { draftRequirements, loading, error, refresh, total } =
    useDraftRequirements();

  const getPriorityColor = (priority: string | number | null | undefined) => {
    const priorityStr = priority?.toString()?.toLowerCase() || "";

    switch (priorityStr) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "default";
      default:
        return "default";
    }
  };

  const getPriorityText = (priority: string | number | null | undefined) => {
    const priorityStr = priority?.toString()?.toLowerCase() || "";

    switch (priorityStr) {
      case "high":
        return t("priority.high");
      case "medium":
        return t("priority.medium");
      case "low":
        return t("priority.low");
      default:
        return priority?.toString() || t("priority.unknown");
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
      `/approval-requests?highlightRequirement=${requirementId}&scrollTo=${requirementId}`,
    );
  };

  const handleViewAllRequirements = () => {
    navigate("/approval-requests");
  };

  if (loading) {
    return (
      <Card
        className={`${className} border-default-200`}
        dir={direction}
        shadow="sm"
      >
        <CardBody className="p-6 space-y-4">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40 rounded" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>
            <Skeleton className="h-8 w-20 rounded" />
          </div>

          {/* Requirements list skeleton */}
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="p-4 border border-default-200 rounded-lg space-y-3"
              >
                {/* Requirement header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-32 rounded" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-3 w-3/4 rounded" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>

                {/* Requirement metadata */}
                <div className="flex items-center justify-between pt-2 border-t border-default-100">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-3 w-16 rounded" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-3 w-12 rounded" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>

          {/* View all button skeleton */}
          <div className="pt-4 border-t border-default-200">
            <Skeleton className="h-9 w-full rounded" />
          </div>
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

  return (
    <Card
      className={`${className} border-default-200`}
      dir={direction}
      shadow="sm"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-default-600" />
            <h3 className="text-lg font-semibold text-foreground">
              {t("requirements.pendingRequirements")}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Chip
              className="bg-warning-50 text-warning-600"
              size="sm"
              variant="flat"
            >
              {total}
            </Chip>
            {total > 0 && (
              <Button
                size="sm"
                variant="light"
                onPress={handleViewAllRequirements}
              >
                {t("common.viewAll")}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <Divider className="bg-default-200" />

      <CardBody className="p-0">
        {draftRequirements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <PenTool className="w-12 h-12 text-default-300 mb-3" />
            <h4 className="font-medium text-foreground mb-1">
              {t("requirements.noDraftRequirements")}
            </h4>
            <p className="text-sm text-default-500">
              {t("requirements.noDraftRequirementsDesc")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-default-200">
            {draftRequirements.map((requirement) => (
              <div
                key={requirement.id}
                className="p-4 hover:bg-default-50 transition-colors cursor-pointer"
                onClick={() =>
                  handleViewRequirement(requirement.project.id, requirement.id)
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium text-sm text-foreground truncate">
                        {requirement.name}
                      </h5>
                      <Chip
                        color={getPriorityColor(requirement.priority)}
                        size="sm"
                        variant="flat"
                      >
                        {getPriorityText(requirement.priority)}
                      </Chip>
                    </div>

                    <p
                      dangerouslySetInnerHTML={{
                        __html: requirement.description,
                      }}
                      className="text-xs text-default-500 mb-2 line-clamp-2"
                    />

                    <div className="flex items-center gap-4 text-xs text-default-400">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="truncate">
                          {requirement.project.applicationName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(requirement.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <Button
                      className="min-w-0 px-3"
                      color="primary"
                      size="sm"
                      variant="flat"
                      onPress={(e) => {
                        e.stopPropagation();
                        handleViewRequirement(
                          requirement.project.id,
                          requirement.id,
                        );
                      }}
                    >
                      {t("common.view")}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
