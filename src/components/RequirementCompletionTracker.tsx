import React, { useState, useMemo } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
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
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useRequirementCompletion } from "@/hooks/useRequirementCompletion";
import { GlobalPagination } from "@/components/GlobalPagination";

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

// Get priority color
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "danger";
    case "medium":
      return "warning";
    case "low":
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
        <CardBody className="flex items-center justify-center py-8">
          <Spinner size="lg" />
          <p className="mt-4 text-default-500">
            {t("completion.loading") || "Loading completion data..."}
          </p>
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
              {t("completion.error") || "Error"}
            </p>
            <p className="text-sm text-default-500 mb-4">{error}</p>
            <Button size="sm" variant="flat" onPress={refresh}>
              {t("completion.retry") || "Retry"}
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const getDaysText = (days: number, type: "overdue" | "remaining") => {
    if (days === 1) {
      return type === "overdue"
        ? t("completion.oneDayOverdue") || "1 day overdue"
        : t("completion.oneDayLeft") || "1 day left";
    }

    return type === "overdue"
      ? `${days} ${t("completion.days") || "days"} ${t("completion.overdue") || "overdue"}`
      : `${days} ${t("completion.days") || "days"} ${t("completion.daysLeft") || "left"}`;
  };

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"}>
      <Card className="w-full shadow-md border border-default-200">
        <CardHeader className="pb-0">
          <div className="flex justify-between items-center w-full">
            <h3 className="text-lg font-medium">
              {t("completion.title") || "Requirement Completion"}
            </h3>
            <div className="flex items-center gap-2">
              {allItems.length > 0 && (
                <Chip
                  size="sm"
                  variant="flat"
                  color={
                    analytics.overdueItems.length > 0 ? "danger" : "warning"
                  }
                >
                  {allItems.length}{" "}
                  {t("completion.needsAttention") || "Need Attention"}
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
                {t("completion.overall") || "Overall Progress"}
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
                {analytics.summary.onTimeRate}%{" "}
                {t("completion.onTime") || "on time"}
              </span>
              {analytics.summary.avgDelayDays > 0 && (
                <span>
                  {t("completion.avgDelay") || "Avg delay"}:{" "}
                  {analytics.summary.avgDelayDays}{" "}
                  {t("completion.days") || "days"}
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
                  <TableColumn>
                    {t("completion.requirement") || "Requirement"}
                  </TableColumn>
                  <TableColumn>
                    {t("completion.priority") || "Priority"}
                  </TableColumn>
                  <TableColumn>
                    {t("completion.status") || "Status"}
                  </TableColumn>
                  <TableColumn>
                    {t("completion.dueDate") || "Due Date"}
                  </TableColumn>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((item) => (
                    <TableRow key={`${item.type}-${item.id}`}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {item.name}
                          </span>
                          <span className="text-xs text-default-500">
                            {item.projectName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={getPriorityColor(item.priority)}
                          size="sm"
                          variant="flat"
                        >
                          {t(`completion.priority.${item.priority}`) ||
                            t(`priority.${item.priority}`) ||
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
                              ? t("completion.overdue") || "Overdue"
                              : t("completion.dueSoon") || "Due Soon"}
                          </Chip>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-default-600">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(item.expectedDate)}</span>
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
                {t("completion.allOnTrack") || "All Requirements On Track"}
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
                    {t("completion.completedOnTime") || "completed on time"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-default-500">
                    {analytics.summary.completedRequirements}{" "}
                    {t("completion.totalCompleted") || "total completed"}
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
