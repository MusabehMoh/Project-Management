import React, { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";
import { Progress } from "@heroui/progress";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Avatar } from "@heroui/avatar";
import { Tooltip } from "@heroui/tooltip";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useLanguage } from "@/contexts/LanguageContext";
import { GlobalPagination } from "@/components/GlobalPagination";
import { useQcWorkload } from "@/hooks/useQcWorkload";

interface QCWorkloadPerformanceProps {
  className?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "available":
      return "success";
    case "light":
      return "primary";
    case "busy":
      return "warning";
    case "overloaded":
      return "danger";
    case "blocked":
      return "danger";
    case "on-leave":
      return "default";
    default:
      return "default";
  }
};

export default function QCWorkloadPerformance({
  className = "",
}: QCWorkloadPerformanceProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Handle QC member click to navigate to tasks page with assignee filter
  const handleQCMemberClick = (qcId: number, qcName: string) => {
    navigate("/tasks", {
      state: {
        assigneeId: qcId,
        assigneeName: qcName,
      },
    });
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Use custom hook for QC workload data
  const { qcMembers, loading, error, pagination, refetch, fetchPage } =
    useQcWorkload({
      searchQuery,
      statusFilter,
      sortOrder,
    });

  // Since we don't have refreshing state from the hook, track it locally
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Clear search function
  const clearSearch = () => {
    setSearchQuery("");
  };

  if (loading) {
    return (
      <Card className={`${className} border-default-200`} shadow="md">
        <CardBody className="space-y-6 p-6">
          {/* Header with filters skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <Skeleton className="h-7 w-1/2 rounded-lg" />
            <div className="flex space-x-2">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
          </div>

          {/* Performance metrics skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <Skeleton className="h-8 w-16 mx-auto rounded-lg" />
                <Skeleton className="h-4 w-20 mx-auto rounded" />
              </div>
            ))}
          </div>

          {/* Table skeleton */}
          <div className="space-y-2">
            {/* Table header */}
            <div className="grid grid-cols-4 gap-4 p-3 bg-default-100 rounded-lg">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>

            {/* Table rows */}
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-4 gap-4 p-3 border-b border-default-200"
              >
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-24 rounded" />
                </div>
                <Skeleton className="h-4 w-12 rounded" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-4 w-16 rounded" />
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

  // Empty state when no QC members found
  if (!loading && qcMembers.length === 0) {
    return (
      <div dir={language === "ar" ? "rtl" : "ltr"}>
        <Card className="w-full shadow-md border border-default-200">
          <CardHeader className="pb-0">
            <div className="flex flex-col gap-4 w-full">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">
                  {t("qcDashboard.teamPerformance") || "QC Team Performance"}
                </h3>
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

              {/* Search and Filter Controls */}
              <div className="flex gap-3 items-center">
                <div className="relative">
                  <Input
                    className="max-w-xs"
                    endContent={
                      searchQuery && (
                        <Button
                          isIconOnly
                          className="min-w-unit-6 w-6 h-6"
                          size="sm"
                          variant="light"
                          onPress={clearSearch}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )
                    }
                    placeholder={
                      t("qcDashboard.searchQCMembers") || "Search QC members..."
                    }
                    startContent={
                      <Search className="w-4 h-4 text-default-400" />
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Select
                  aria-label={
                    t("qcDashboard.filterByStatus") || "Filter by status"
                  }
                  className="max-w-xs"
                  placeholder={
                    t("qcDashboard.filterByStatus") || "Filter by status"
                  }
                  selectedKeys={statusFilter ? [statusFilter] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;

                    setStatusFilter(selected || "");
                  }}
                >
                  <SelectItem key="">
                    {t("common.allStatus") || "All Status"}
                  </SelectItem>
                  <SelectItem key="available">
                    {t("qcDashboard.status.available") || "Available"}
                  </SelectItem>
                  <SelectItem key="light">
                    {t("qcDashboard.status.light") || "Light"}
                  </SelectItem>
                  <SelectItem key="busy">
                    {t("qcDashboard.status.busy") || "Busy"}
                  </SelectItem>
                  <SelectItem key="overloaded">
                    {t("qcDashboard.status.overloaded") || "Overloaded"}
                  </SelectItem>
                </Select>

                <Button
                  size="sm"
                  variant="flat"
                  onPress={() => {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  }}
                >
                  {sortOrder === "asc"
                    ? `↑ ${t("common.ascending") || "Asc"}`
                    : `↓ ${t("common.descending") || "Desc"}`}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-default-100 dark:bg-default-50/10 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-10 h-10 text-default-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery || statusFilter
                  ? t("qcDashboard.noQCMembersFound") || "No QC Members Found"
                  : t("qcDashboard.noTeamMembers") || "No Team Members"}
              </h3>
              <p className="text-sm text-default-500 max-w-md mb-4">
                {searchQuery || statusFilter
                  ? t("qcDashboard.noQCMembersFoundDescription") ||
                    "No QC members match your current filters. Try adjusting your search or filters."
                  : t("qcDashboard.noTeamMembersDescription") ||
                    "No team members found in the quality control department."}
              </p>
              {(searchQuery || statusFilter) && (
                <Button
                  size="sm"
                  startContent={<X className="w-4 h-4" />}
                  variant="flat"
                  onPress={() => {
                    setSearchQuery("");
                    setStatusFilter("");
                  }}
                >
                  {t("common.clearFilters") || "Clear Filters"}
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"}>
      <Card className="w-full shadow-md border border-default-200">
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">
                {t("qcDashboard.teamPerformance") || "QC Team Performance"}
              </h3>
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

            {/* Search and Filter Controls */}
            <div className="flex gap-3 items-center">
              <div className="relative">
                <Input
                  className="max-w-xs"
                  endContent={
                    searchQuery && (
                      <Button
                        isIconOnly
                        className="min-w-unit-6 w-6 h-6"
                        size="sm"
                        variant="light"
                        onPress={clearSearch}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )
                  }
                  placeholder={
                    t("qcDashboard.searchQCMembers") || "Search QC members..."
                  }
                  startContent={<Search className="w-4 h-4 text-default-400" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select
                aria-label={
                  t("qcDashboard.filterByStatus") || "Filter by status"
                }
                className="max-w-xs"
                placeholder={
                  t("qcDashboard.filterByStatus") || "Filter by status"
                }
                selectedKeys={statusFilter ? [statusFilter] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;

                  setStatusFilter(selected || "");
                }}
              >
                <SelectItem key="">
                  {t("common.allStatus") || "All Status"}
                </SelectItem>
                <SelectItem key="available">
                  {t("qcDashboard.status.available") || "Available"}
                </SelectItem>
                <SelectItem key="light">
                  {t("qcDashboard.status.light") || "Light"}
                </SelectItem>
                <SelectItem key="busy">
                  {t("qcDashboard.status.busy") || "Busy"}
                </SelectItem>
                <SelectItem key="overloaded">
                  {t("qcDashboard.status.overloaded") || "Overloaded"}
                </SelectItem>
              </Select>

              <Button
                size="sm"
                variant="flat"
                onPress={() => {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                }}
              >
                {sortOrder === "asc"
                  ? `↑ ${t("common.ascending") || "Asc"}`
                  : `↓ ${t("common.descending") || "Desc"}`}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {/* QC Members Table */}
          <Table removeWrapper aria-label="QC workload performance">
            <TableHeader>
              <TableColumn>
                {t("qcDashboard.qcMember") || "QC Member"}
              </TableColumn>
              <TableColumn>
                {t("qcDashboard.workload") || "Workload"}
              </TableColumn>
              <TableColumn>
                {t("qcDashboard.efficiency") || "Efficiency"}
              </TableColumn>
              <TableColumn>
                {t("qcDashboard.currentTasks") || "Tasks"}
              </TableColumn>
              <TableColumn>{t("qcDashboard.status") || "Status"}</TableColumn>
            </TableHeader>
            <TableBody>
              {qcMembers.map((qcMember) => (
                <TableRow key={qcMember.prsId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        className="flex-shrink-0"
                        name={qcMember.qcName}
                        size="sm"
                      />
                      <div className="flex flex-col">
                        <Button
                          className="p-0 h-auto font-medium text-sm text-left justify-start hover:underline"
                          variant="light"
                          onPress={() =>
                            handleQCMemberClick(qcMember.prsId, qcMember.qcName)
                          }
                        >
                          {qcMember.gradeName} {qcMember.qcName}
                        </Button>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {qcMember.skills &&
                            qcMember.skills.slice(0, 2).map((skill: string) => (
                              <Chip
                                key={skill}
                                className="text-xs"
                                size="sm"
                                variant="flat"
                              >
                                {skill}
                              </Chip>
                            ))}
                          {qcMember.skills && qcMember.skills.length > 2 && (
                            <Tooltip
                              content={qcMember.skills.slice(2).join(", ")}
                            >
                              <Chip
                                className="text-xs"
                                size="sm"
                                variant="flat"
                              >
                                +{qcMember.skills.length - 2}
                              </Chip>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Progress
                        color={
                          qcMember.workloadPercentage > 90
                            ? "danger"
                            : qcMember.workloadPercentage > 75
                              ? "warning"
                              : "success"
                        }
                        size="sm"
                        value={qcMember.workloadPercentage}
                      />
                      <span className="text-xs text-default-500">
                        {qcMember.workloadPercentage}% •{" "}
                        {t(`qcDashboard.status.${qcMember.status}`) ||
                          qcMember.status.replace("-", " ")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {qcMember.efficiency >= 85 ? (
                          <TrendingUp className="w-4 h-4 text-success" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-danger" />
                        )}
                        <span
                          className={`font-medium text-sm ${
                            qcMember.efficiency >= 85
                              ? "text-success"
                              : qcMember.efficiency >= 70
                                ? "text-warning"
                                : "text-danger"
                          }`}
                        >
                          {qcMember.efficiency}%
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-default-400" />
                        <span className="text-sm">
                          {qcMember.currentTasksCount}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-success" />
                        <span className="text-sm text-success">
                          {qcMember.completedTasksCount}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Tooltip
                      content={
                        qcMember.status
                          ? t(`qcDashboard.status.${qcMember.status}`) ||
                            qcMember.status.replace("-", " ")
                          : "Available"
                      }
                    >
                      <Chip
                        color={getStatusColor(qcMember.status)}
                        size="sm"
                        variant="flat"
                      >
                        {t(`qcDashboard.status.${qcMember.status}`) ||
                          qcMember.status.replace("-", " ")}
                      </Chip>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>

        {/* Global Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center p-4 border-t border-default-200">
            <GlobalPagination
              currentPage={pagination.currentPage}
              pageSize={pagination.pageSize}
              totalItems={pagination.totalCount}
              totalPages={pagination.totalPages}
              onPageChange={(page) => fetchPage(page)}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
