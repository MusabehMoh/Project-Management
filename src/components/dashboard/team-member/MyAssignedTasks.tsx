import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Skeleton } from "@heroui/skeleton";
import { useNavigate } from "react-router-dom";
import { ListTodo, Clock, User } from "lucide-react";

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
                {/* Task header */}
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

                {/* Task metadata */}
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
            <ListTodo className="w-5 h-5 text-default-600" />
            <h3 className="text-lg font-semibold text-foreground">
              {t("teamDashboard.myTasks.title")}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Chip
              className="bg-primary-50 text-primary-600"
              size="sm"
              variant="flat"
            >
              {total}
            </Chip>
            {total > 0 && (
              <Button
                size="sm"
                variant="light"
                onPress={handleViewAllTasks}
              >
                {t("common.viewAll")}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <Divider className="bg-default-200" />

      <CardBody className="p-0">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ListTodo className="w-12 h-12 text-default-300 mb-3" />
            <h4 className="font-medium text-foreground mb-1">
              {t("teamDashboard.myTasks.noTasks")}
            </h4>
            <p className="text-sm text-default-500">
              {t("teamDashboard.myTasks.noTasksDesc")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-default-200">
            {tasks.map((task: any) => (
              <div
                key={task.id}
                className="p-4 hover:bg-default-50 transition-colors cursor-pointer"
                onClick={() => handleViewTask(task.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium text-sm text-foreground truncate">
                        {task.name || t("teamDashboard.myTasks.untitled")}
                      </h5>
                      <Chip
                        color={getPriorityColor(task.priorityId)}
                        size="sm"
                        variant="flat"
                      >
                        {getPriorityText(task.priorityId)}
                      </Chip>
                    </div>

                    <p className="text-xs text-default-500 mb-2">
                      {getStatusText(task.statusId)}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-default-400">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="truncate">
                          {task.project?.applicationName ||
                            t("teamDashboard.myTasks.noProject")}
                        </span>
                      </div>
                      {task.endDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(task.endDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <Button
                      className="min-w-0 px-3"
                      color="primary"
                      size="sm"
                      variant="flat"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewTask(task.id);
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
