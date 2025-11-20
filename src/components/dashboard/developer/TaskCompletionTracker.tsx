import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";
import { Progress } from "@heroui/progress";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Tooltip } from "@heroui/tooltip";
import {
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Code,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { GlobalPagination } from "@/components/GlobalPagination";
import {
  developerQuickActionsService,
  TaskCompletionAnalytics,
} from "@/services/api/developerQuickActionsService";

interface TaskCompletionTrackerProps {
  className?: string;
  developerId?: string;
}

const getStatusColor = (type: "overdue" | "at-risk" | "completed") => {
  switch (type) {
    case "overdue":
      return "danger";
    case "at-risk":
      return "warning";
    case "completed":
      return "success";
    default:
      return "default";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "critical":
      return "danger";
    case "high":
      return "warning";
    case "medium":
      return "primary";
    case "low":
      return "success";
    default:
      return "default";
  }
};

export default function TaskCompletionTracker({
  className = "",
  developerId,
}: TaskCompletionTrackerProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 3;
  const [analytics, setAnalytics] = useState<TaskCompletionAnalytics | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allItems = useMemo(() => {
    if (!analytics) return [];

    return [
      ...analytics.overdueItems.map((item) => ({
        ...item,
        type: "overdue" as const,
      })),
      ...analytics.atRiskItems.map((item) => ({
        ...item,
        type: "at-risk" as const,
      })),
    ].sort((a, b) => {
      if (a.type === "overdue" && b.type !== "overdue") return -1;
      if (a.type !== "overdue" && b.type === "overdue") return 1;

      const aDays =
        a.type === "overdue" ? a.daysOverdue || 0 : a.daysUntilDeadline || 0;
      const bDays =
        b.type === "overdue" ? b.daysOverdue || 0 : b.daysUntilDeadline || 0;

      return a.type === "overdue" ? bDays - aDays : aDays - bDays;
    });
  }, [analytics]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return allItems.slice(startIndex, endIndex);
  }, [allItems, currentPage, pageSize]);

  const totalPages = Math.ceil(allItems.length / pageSize);

  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use real API
        const data =
          await developerQuickActionsService.getTaskCompletionAnalytics();

        setAnalytics(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch task data",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    fetchData();
  }, [developerId]);

  const refresh = async () => {
    setRefreshing(true);
    setError(null);

    try {
      // Use real API
      const data =
        await developerQuickActionsService.getTaskCompletionAnalytics();

      setAnalytics(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to refresh task data",
      );
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <Card className={`${className} border-default-200`} shadow="md">
        <CardBody className="space-y-6 p-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-1/2 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>

          {/* Progress overview skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center space-y-3">
                <Skeleton className="h-16 w-16 mx-auto rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-6 w-8 mx-auto rounded" />
                  <Skeleton className="h-4 w-16 mx-auto rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Chart skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-32 rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>

          {/* Task list skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-40 rounded-lg" />
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border border-default-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-40 rounded" />
                    <Skeleton className="h-3 w-24 rounded" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-3 w-12 rounded" />
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
      <Card className={`${className} border-default-200`} shadow="md">
        <CardBody className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-danger mx-auto mb-4" />
            <p className="font-medium text-foreground mb-2">
              {t("common.error") || "Error"}
            </p>
            <p className="text-sm text-default-500 mb-4">{error}</p>
            <Button size="sm" variant="flat" onPress={refresh}>
              {t("common.retry") || "Retry"}
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!analytics) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"}>
      <Card className="w-full shadow-md border border-default-200">
        <CardHeader className="pb-0">
          <div className="flex justify-between items-center w-full">
            <h3 className="text-lg font-medium">
              {t("developerDashboard.taskCompletion") || "Task Completion"}
            </h3>
            <div className="flex items-center gap-2">
              {allItems.length > 0 && (
                <Chip
                  color={
                    analytics.overdueItems.length > 0 ? "danger" : "warning"
                  }
                  size="sm"
                  variant="flat"
                >
                  {allItems.length}{" "}
                  {t("developerDashboard.needsAttention") || "Need Attention"}
                </Chip>
              )}
              <Button
                isIconOnly
                isLoading={refreshing}
                size="sm"
                variant="ghost"
                onPress={refresh}
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {/* Overall Progress Summary */}
          <div className="mb-4 p-4 bg-default-50 dark:bg-default-100/50 rounded-lg border border-default-200">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-foreground">
                {t("developerDashboard.overallProgress") || "Overall Progress"}
              </span>
              <span className="text-sm text-default-500">
                {analytics.summary.completedTasks} /{" "}
                {analytics.summary.totalTasks}
              </span>
            </div>
            <Progress
              className="mb-2"
              color="success"
              size="sm"
              value={Math.max(0, Math.min(100, analytics.summary.onTimeRate || 0))}
            />
            <div className="flex justify-between text-xs text-default-500">
              <span>
                {Math.max(0, Math.min(100, analytics.summary.onTimeRate || 0))}%{" "}
                {t("developerDashboard.onTime") || "on time"}
              </span>
              {analytics.summary.avgDelayDays > 0 && (
                <span>
                  {t("developerDashboard.avgDelay") || "Avg delay"}:{" "}
                  {analytics.summary.avgDelayDays}{" "}
                  {t("developerDashboard.days") || "days"}
                </span>
              )}
            </div>
          </div>

          {/* Tasks Table */}
          {allItems.length > 0 ? (
            <>
              <Table removeWrapper aria-label="Tasks needing attention">
                <TableHeader>
                  <TableColumn>
                    {t("developerDashboard.task") || "Task"}
                  </TableColumn>
                  <TableColumn>
                    {t("developerDashboard.priority") || "Priority"}
                  </TableColumn>
                  <TableColumn>
                    {t("developerDashboard.status") || "Status"}
                  </TableColumn>
                  <TableColumn>
                    {t("developerDashboard.dueDate") || "Due Date"}
                  </TableColumn>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((item) => (
                    <TableRow 
                      key={`${item.type}-${item.id}`}
                      className="cursor-pointer hover:bg-default-100"
                      onClick={() => navigate(`/timeline?taskId=${item.id}`)}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {item.title}
                          </span>
                          <span className="text-xs text-default-500">
                            {item.projectName} • {item.assignee}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={getPriorityColor(item.priority)}
                          size="sm"
                          variant="flat"
                        >
                          {t(`priority.${item.priority}`) || item.priority}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Tooltip
                          content={
                            item.type === "overdue"
                              ? item.daysOverdue === 1
                                ? t("completion.oneDayOverdue")
                                : t("completion.daysOverdue").replace(
                                    "{days}",
                                    item.daysOverdue?.toString() || "0",
                                  )
                              : item.daysUntilDeadline === 1
                                ? t("completion.oneDayLeft")
                                : t("completion.daysLeft").replace(
                                    "{days}",
                                    item.daysUntilDeadline?.toString() || "0",
                                  )
                          }
                        >
                          <Chip
                            color={getStatusColor(item.type)}
                            size="sm"
                            startContent={
                              item.type === "overdue" ? (
                                <AlertCircle className="w-3 h-3" />
                              ) : (
                                <Clock className="w-3 h-3" />
                              )
                            }
                            variant="flat"
                          >
                            {item.type === "overdue"
                              ? t("developerDashboard.overdue") || "Overdue"
                              : t("developerDashboard.dueSoon") || "Due Soon"}
                          </Chip>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-default-600">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(item.dueDate)}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <GlobalPagination
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalItems={allItems.length}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-success-600 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-foreground mb-2">
                {t("developerDashboard.allTasksOnTrack") ||
                  "All Tasks On Track"}
              </h4>
              <p className="text-sm text-default-500">
                {t("developerDashboard.noOverdueTasks") ||
                  "No overdue or at-risk tasks"}
              </p>
              <div className="mt-4 flex justify-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-success-600" />
                  <span className="text-success-600">
                    {analytics.summary.onTimeCompleted}{" "}
                    {t("developerDashboard.completedOnTime") ||
                      "completed on time"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Code className="w-4 h-4 text-default-500" />
                  <span className="text-default-500">
                    {analytics.summary.completedTasks}{" "}
                    {t("developerDashboard.totalCompleted") ||
                      "total completed"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
