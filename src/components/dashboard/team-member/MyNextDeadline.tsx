import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Progress } from "@heroui/progress";
import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";
import { Calendar, Clock } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useMyNextDeadline } from "@/hooks/useMyNextDeadline";

interface MyNextDeadlineProps {
  className?: string;
}

export default function MyNextDeadline({
  className = "",
}: MyNextDeadlineProps) {
  const { t, direction } = useLanguage();
  const { task, loading, error } = useMyNextDeadline();

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";

    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysUntilDeadline = (endDate: string | null | undefined) => {
    if (!endDate) return null;

    const today = new Date();
    const deadline = new Date(endDate);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const getDeadlineColor = (days: number | null) => {
    if (days === null) return "default";
    if (days < 0) return "danger"; // Overdue
    if (days <= 3) return "danger"; // 3 days or less
    if (days <= 7) return "warning"; // 1 week or less

    return "success"; // More than 1 week
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 70) return "success";  // Green: 70-100%
    if (progress >= 40) return "warning";  // Yellow: 40-69%

    return "danger";  // Red: 0-39%
  };

  if (loading) {
    return (
      <Card
        className={`${className} border-default-200`}
        dir={direction}
        shadow="sm"
      >
        <CardBody className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-32 rounded" />
          </div>
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </CardBody>
      </Card>
    );
  }

  if (error || !task) {
    return (
      <Card
        className={`${className} border-default-200`}
        dir={direction}
        shadow="sm"
      >
        <CardBody className="p-4">
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <Calendar className="w-8 h-8 text-default-300 mb-2" />
            <p className="text-sm text-default-500">
              {t("teamDashboard.nextDeadline.noDeadline")}
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  const daysUntil = getDaysUntilDeadline(task.endDate);
  const deadlineColor = getDeadlineColor(daysUntil);
  const progress = task.progress || 0;

  return (
    <Card
      className={`${className} border-default-200`}
      dir={direction}
      shadow="sm"
    >
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-default-600" />
          <h3 className="text-sm font-semibold text-foreground">
            {t("teamDashboard.nextDeadline.title")}
          </h3>
        </div>
      </CardHeader>

      <CardBody className="px-4 pb-4 pt-2 space-y-3">
        {/* Task Name */}
        <p className="text-sm font-medium text-foreground line-clamp-2">
          {task.name || t("teamDashboard.nextDeadline.untitled")}
        </p>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-default-500">
              {t("teamDashboard.nextDeadline.progress")}
            </span>
            <span className="font-medium text-foreground">{progress}%</span>
          </div>
          <Progress
            aria-label="Task progress"
            color={getProgressColor(progress)}
            size="sm"
            value={progress}
          />
        </div>

        {/* Deadline Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-default-500">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(task.endDate)}</span>
          </div>
          {daysUntil !== null && (
            <Chip
              className="text-xs"
              color={deadlineColor}
              size="sm"
              variant="flat"
            >
              {daysUntil < 0
                ? `${Math.abs(daysUntil)}d ${t("teamDashboard.nextDeadline.overdue")}`
                : daysUntil === 0
                  ? t("teamDashboard.nextDeadline.today")
                  : daysUntil === 1
                    ? t("teamDashboard.nextDeadline.tomorrow")
                    : `${daysUntil}d ${t("teamDashboard.nextDeadline.left")}`}
            </Chip>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
