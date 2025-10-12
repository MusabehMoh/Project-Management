import React, { useState, useMemo } from "react";
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
  Calendar,
  AlertCircle,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useRequirementCompletion } from "@/hooks/useRequirementCompletion";
import { GlobalPagination } from "@/components/GlobalPagination";
import ErrorWithRetry from "@/components/ErrorWithRetry";
import { formatDateTime } from "@/utils/dateFormatter";
import { usePriorityLookups } from "@/hooks/usePriorityLookups";

interface RequirementCompletionTrackerProps {
  className?: string;
  useMockData?: boolean;
  analystId?: number;
}

// Get status color based on completion status
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

export default function RequirementCompletionTracker({
  className = "",
  useMockData = false,
  analystId,
}: RequirementCompletionTrackerProps) {
  const { t, language } = useLanguage();

  // Global priority lookups
  const { getPriorityColor, getPriorityLabel } = usePriorityLookups();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 3; // Show only 3 records per page

  const { analytics, loading, refreshing, error, refresh } =
    useRequirementCompletion({
      autoRefresh: !useMockData,
      refreshInterval: 300000, // 5 minutes
      analystId,
    });

  // Combine overdue and at-risk items for the table
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
      // Sort by urgency: overdue first, then by days
      if (a.type === "overdue" && b.type !== "overdue") return -1;
      if (a.type !== "overdue" && b.type === "overdue") return 1;

      const aDays = a.type === "overdue" ? a.daysOverdue : a.daysUntilDeadline;
      const bDays = b.type === "overdue" ? b.daysOverdue : b.daysUntilDeadline;

      return a.type === "overdue" ? bDays - aDays : aDays - bDays;
    });
  }, [analytics]);

  // Paginated data
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return allItems.slice(startIndex, endIndex);
  }, [allItems, currentPage, pageSize]);

  // Calculate pagination info
  const totalPages = Math.ceil(allItems.length / pageSize);

  // Reset to first page when data changes
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  if (loading) {
    return (
      <Card className={`${className} border-default-200`} shadow="md">
        <CardBody className="p-6 space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 rounded" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>
            <Skeleton className="h-8 w-24 rounded" />
          </div>

          {/* Stats grid skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <Skeleton className="h-8 w-12 mx-auto rounded" />
                <Skeleton className="h-4 w-16 mx-auto rounded" />
              </div>
            ))}
          </div>

          {/* Progress bars skeleton */}
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-4 w-12 rounded" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
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
        <CardBody className="min-h-[200px]">
          <ErrorWithRetry error={error} onRetry={refresh} />
        </CardBody>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  const getDaysText = (days: number, type: "overdue" | "remaining") => {
    if (days === 1) {
      return type === "overdue"
        ? t("completion.oneDayOverdue")
        : t("completion.oneDayLeft");
    }

    return type === "overdue"
      ? `${days} ${t("completion.days")} ${t("completion.overdue")}`
      : `${days} ${t("completion.days")} ${t("completion.daysLeft")}`;
  };

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"}>
      <Card className="w-full shadow-md border border-default-200">
        <CardHeader className="pb-0">
          <div className="flex justify-between items-center w-full">
            <h3 className="text-lg font-medium">{t("completion.title")}</h3>
            <div className="flex items-center gap-2">
              {allItems.length > 0 && (
                <Chip
                  color={
                    analytics.overdueItems.length > 0 ? "danger" : "warning"
                  }
                  size="sm"
                  variant="flat"
                >
                  {allItems.length} {t("completion.needsAttention")}
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
                {t("completion.overall")}
              </span>
              <span className="text-sm text-default-500">
                {analytics.summary.completedRequirements} /{" "}
                {analytics.summary.totalRequirements}
              </span>
            </div>
            <Progress
              className="mb-2"
              color="success"
              size="sm"
              value={analytics.summary.onTimeRate}
            />
            <div className="flex justify-between text-xs text-default-500">
              <span>
                {analytics.summary.onTimeRate}% {t("completion.onTime")}
              </span>
              {analytics.summary.avgDelayDays > 0 && (
                <span>
                  {t("completion.avgDelay")}: {analytics.summary.avgDelayDays}{" "}
                  {t("completion.days")}
                </span>
              )}
            </div>
          </div>

          {/* Requirements Table */}
          {allItems.length > 0 ? (
            <>
              <Table
                removeWrapper
                aria-label="Requirements needing attention"
                className="w-full"
              >
                <TableHeader>
                  <TableColumn>{t("completion.requirement")}</TableColumn>
                  <TableColumn>{t("completion.priority")}</TableColumn>
                  <TableColumn>{t("completion.status")}</TableColumn>
                  <TableColumn>{t("completion.dueDate")}</TableColumn>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((item, index) => (
                    <TableRow
                      key={`${item.type}-${item.id || `fallback-${index}`}`}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {item.requirementTitle}
                          </span>
                          <span className="text-xs text-default-500">
                            {item.projectName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={getPriorityColor(
                            parseInt(item.priority.toString()),
                          )}
                          size="sm"
                          variant="flat"
                        >
                          {getPriorityLabel(
                            parseInt(item.priority.toString()),
                          ) ||
                            t(`completion.priority.${item.priority}`) ||
                            item.priority}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Tooltip
                          content={
                            item.type === "overdue"
                              ? getDaysText(item.daysOverdue, "overdue")
                              : getDaysText(item.daysUntilDeadline, "remaining")
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
                              ? t("completion.overdue")
                              : t("completion.dueSoon")}
                          </Chip>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-default-600">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {formatDateTime(item.expectedCompletionDate, {
                              showTime: false,
                              language,
                            })}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
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
            /* Empty State */
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-success-600 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-foreground mb-2">
                {t("completion.allOnTrack")}
              </h4>
              <p className="text-sm text-default-500">
                {t("completion.noOverdue") ||
                  "No overdue or at-risk requirements"}
              </p>
              <div className="mt-4 flex justify-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-success-600" />
                  <span className="text-success-600">
                    {analytics.summary.onTimeCompleted}{" "}
                    {t("completion.completedOnTime")}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-default-500">
                    {analytics.summary.completedRequirements}{" "}
                    {t("completion.totalCompleted")}
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
