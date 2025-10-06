import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Skeleton } from "@heroui/skeleton";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Clock, AlertCircle, ChevronRight } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import ErrorWithRetry from "@/components/ErrorWithRetry";
import { useMyAssignedTasks } from "@/hooks/useMyAssignedTasks";

interface MyAssignedTasksProps {
  className?: string;
}

export default function MyAssignedTasks({
  className = "",
}: MyAssignedTasksProps) {
  const { t, direction } = useLanguage();
  const navigate = useNavigate();
  const { tasks, loading, error, refresh, total } = useMyAssignedTasks();

  const getPriorityColor = (priorityId: number | null | undefined) => {
    switch (priorityId) {
      case 3: // High
        return "danger";
      case 2: // Medium
        return "warning";
      case 1: // Low
        return "default";
      default:
        return "default";
    }
  };

  const getPriorityText = (priorityId: number | null | undefined) => {
    switch (priorityId) {
      case 3: // High
        return t("priority.high");
      case 2: // Medium
        return t("priority.medium");
      case 1: // Low
        return t("priority.low");
      default:
        return t("priority.unknown");
    }
  };

  const getStatusColor = (statusId: number | null | undefined) => {
    switch (statusId) {
      case 5: // Completed
        return "success";
      case 2: // In Progress
        return "primary";
      case 1: // ToDo/Pending
        return "warning";
      case 6: // On Hold
        return "danger";
      case 3: // In Review
        return "secondary";
      case 4: // Rework
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusIcon = (statusId: number | null | undefined) => {
    switch (statusId) {
      case 5: // Completed
        return <CheckCircle className="w-4 h-4" />;
      case 2: // In Progress
        return <Clock className="w-4 h-4" />;
      case 6: // On Hold
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (statusId: number | null | undefined) => {
    switch (statusId) {
      case 5: // Completed
        return t("teamDashboard.status.completed");
      case 2: // In Progress
        return t("teamDashboard.status.inProgress");
      case 1: // ToDo
        return t("teamDashboard.status.pending");
      case 6: // On Hold
        return t("teamDashboard.status.blocked");
      case 3: // In Review
        return t("teamDashboard.status.inReview");
      case 4: // Rework
        return t("teamDashboard.status.rework");
      default:
        return t("teamDashboard.status.unknown");
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";

    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleViewTask = (taskId: number) => {
    navigate(`/members-tasks?highlightTask=${taskId}`);
  };

  const handleViewAllTasks = () => {
    navigate("/members-tasks");
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

          {/* Tasks list skeleton */}
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="p-4 border border-default-200 rounded-lg space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-4 w-24 rounded" />
                    </div>
                    <Skeleton className="h-5 w-full rounded" />
                    <Skeleton className="h-4 w-3/4 rounded" />
                  </div>
                </div>
              </div>
            ))}
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
        <CardBody className="p-6">
          <ErrorWithRetry
            error={error}
            onRetry={refresh}
          />
        </CardBody>
      </Card>
    );
  }

  const displayTasks = tasks.slice(0, 5);

  return (
    <Card
      className={`${className} border-default-200`}
      dir={direction}
      shadow="sm"
    >
      <CardHeader className="flex items-center justify-between px-6 py-4">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-foreground">
            {t("teamDashboard.myTasks.title")}
          </h3>
          <p className="text-sm text-default-500">
            {t("teamDashboard.myTasks.showing").replace("{count}", displayTasks.length.toString()).replace("{total}", total.toString())}
          </p>
        </div>
        {total > 5 && (
          <Button
            className="text-primary"
            size="sm"
            variant="light"
            onPress={handleViewAllTasks}
          >
            {t("teamDashboard.myTasks.viewAll")}
          </Button>
        )}
      </CardHeader>

      <Divider />

      <CardBody className="px-6 py-4">
        {displayTasks.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-success opacity-50" />
            <p className="text-default-500 mb-2">
              {t("teamDashboard.myTasks.noTasks")}
            </p>
            <p className="text-sm text-default-400">
              {t("teamDashboard.myTasks.noTasksDesc")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayTasks.map((task: any) => (
              <div
                key={task.id}
                className="group p-4 border border-default-200 rounded-lg hover:border-primary transition-all cursor-pointer hover:shadow-md"
                onClick={() => handleViewTask(task.id)}
              >
                {/* Task Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-1">
                    <Chip
                      className="capitalize"
                      color={getStatusColor(task.statusId)}
                      size="sm"
                      startContent={getStatusIcon(task.statusId)}
                      variant="flat"
                    >
                      {getStatusText(task.statusId)}
                    </Chip>
                    <Chip
                      color={getPriorityColor(task.priorityId)}
                      size="sm"
                      variant="flat"
                    >
                      {getPriorityText(task.priorityId)}
                    </Chip>
                  </div>
                  <ChevronRight className="w-5 h-5 text-default-400 group-hover:text-primary transition-colors" />
                </div>

                {/* Task Title */}
                <h4 className="text-base font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {task.name || t("teamDashboard.myTasks.untitled")}
                </h4>

                {/* Task Details */}
                <div className="flex items-center gap-4 text-sm text-default-500">
                  {task.project?.applicationName && (
                    <span className="flex items-center gap-1">
                      <span className="font-medium">
                        {t("teamDashboard.myTasks.project")}:
                      </span>
                      <span>{task.project.applicationName}</span>
                    </span>
                  )}
                  {task.endDate && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(task.endDate)}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
