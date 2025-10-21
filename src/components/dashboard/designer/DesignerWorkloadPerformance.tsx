import React, { useState, useEffect } from "react";
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
import {
  CheckCircle,
  Clock,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  X,
  Palette,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { GlobalPagination } from "@/components/GlobalPagination";
import { useDesignerWorkload } from "@/hooks";

const getStatusColor = (status: string) => {
  switch (status) {
    case "available":
      return "success";
    case "busy":
      return "warning";
    case "blocked":
      return "danger";
    case "on-leave":
      return "default";
    default:
      return "default";
  }
};

export default function DesignerWorkloadPerformance() {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("efficiency");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [refreshing, setRefreshing] = useState(false);

  // Debounce search query to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Use the custom hook to fetch designer workload data
  const { designers, metrics, pagination, loading, error, refetch, fetchPage } =
    useDesignerWorkload({
      page: 1,
      pageSize: 5,
      searchQuery: debouncedSearchQuery,
      statusFilter,
      sortBy,
      sortOrder,
    });

  const clearSearch = () => {
    setSearchQuery("");
  };

  const refresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <Card className="border-default-200" shadow="md">
        <CardBody className="space-y-6 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <Skeleton className="h-7 w-1/2 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <Skeleton className="h-8 w-16 mx-auto rounded-lg" />
                <Skeleton className="h-4 w-20 mx-auto rounded" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"}>
      <Card className="w-full shadow-md border border-default-200">
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Palette className="text-primary" size={20} />
                <h3 className="text-lg font-medium">
                  {t("designerDashboard.teamPerformance") || "Team Performance"}
                </h3>
              </div>
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

            <div className="flex gap-3 items-center">
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
                  t("designerDashboard.searchDesigners") ||
                  "Search designers..."
                }
                startContent={<Search className="w-4 h-4 text-default-400" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <Select
                disableAnimation
                aria-label="Filter by status"
                className="max-w-xs"
                placeholder={t("common.filterByStatus") || "Filter by status"}
                popoverProps={{
                  placement: "bottom-start",
                }}
                scrollShadowProps={{
                  isEnabled: false,
                }}
                selectedKeys={
                  statusFilter ? new Set([statusFilter]) : new Set()
                }
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;

                  setStatusFilter(selected || "");
                }}
              >
                <SelectItem key="">
                  {t("common.allStatus") || "All Status"}
                </SelectItem>
                <SelectItem key="available">
                  {t("status.available") || "Available"}
                </SelectItem>
                <SelectItem key="busy">{t("status.busy") || "Busy"}</SelectItem>
                <SelectItem key="blocked">
                  {t("status.blocked") || "Blocked"}
                </SelectItem>
                <SelectItem key="on-leave">
                  {t("status.onLeave") || "On Leave"}
                </SelectItem>
              </Select>

              <Select
                disableAnimation
                aria-label="Sort by"
                className="max-w-xs"
                placeholder={t("common.sortBy") || "Sort by"}
                popoverProps={{
                  placement: "bottom-start",
                }}
                scrollShadowProps={{
                  isEnabled: false,
                }}
                selectedKeys={new Set([sortBy])}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;

                  if (selected) {
                    setSortBy(selected);
                  }
                }}
              >
                <SelectItem key="efficiency">
                  {t("common.efficiency") || "Efficiency"}
                </SelectItem>
                <SelectItem key="workload">
                  {t("common.workload") || "Workload"}
                </SelectItem>
                <SelectItem key="name">{t("common.name") || "Name"}</SelectItem>
                <SelectItem key="projects">
                  {t("common.currentProjects") || "Current Projects"}
                </SelectItem>
                <SelectItem key="completed">
                  {t("common.completed") || "Completed"}
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
          {metrics && (
            <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Average Efficiency */}
              <div className="flex-1 bg-default-100 dark:bg-default-50/5 rounded-lg px-3 py-2 border border-default-200">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-default-700 dark:text-default-600">
                    {metrics.averageEfficiency.toFixed(1)}%
                  </span>
                  <span className="text-xs text-default-500">
                    {t("common.avgEfficiency")}
                  </span>
                </div>
              </div>

              {/* Tasks Completed */}
              <div className="flex-1 bg-default-100 dark:bg-default-50/5 rounded-lg px-3 py-2 border border-default-200">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-default-700 dark:text-default-600">
                    {metrics.totalTasksCompleted}
                  </span>
                  <span className="text-xs text-default-500">
                    {t("designerDashboard.designsCompleted")}
                  </span>
                </div>
              </div>

              {/* Average Task Time */}
              <div className="flex-1 bg-default-100 dark:bg-default-50/5 rounded-lg px-3 py-2 border border-default-200">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-default-700 dark:text-default-600">
                    {metrics.averageTaskCompletionTime.toFixed(1)}h
                  </span>
                  <span className="text-xs text-default-500">
                    {t("designerDashboard.avgDesignTime")}
                  </span>
                </div>
              </div>

              {/* Tasks In Progress */}
              <div className="flex-1 bg-default-100 dark:bg-default-50/5 rounded-lg px-3 py-2 border border-default-200">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-default-700 dark:text-default-600">
                    {metrics.totalTasksInProgress}
                  </span>
                  <span className="text-xs text-default-500">
                    {t("common.inProgress")}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Table removeWrapper aria-label="Designer workload performance">
            <TableHeader>
              <TableColumn>
                {t("designerDashboard.designer") || "Designer"}
              </TableColumn>
              <TableColumn>{t("common.workload") || "Workload"}</TableColumn>
              <TableColumn>
                {t("common.efficiency") || "Efficiency"}
              </TableColumn>
              <TableColumn>
                {t("designerDashboard.projects") || "Projects"}
              </TableColumn>
              <TableColumn>{t("common.status") || "Status"}</TableColumn>
            </TableHeader>
            <TableBody>
              {designers.map((designer) => (
                <TableRow key={designer.prsId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        className="flex-shrink-0"
                        name={designer.designerName}
                        size="sm"
                      />
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {designer.designerName}
                        </span>
                        <span className="text-xs text-default-500">
                          {designer.gradeName}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Progress
                        color={
                          designer.workloadPercentage > 90
                            ? "danger"
                            : designer.workloadPercentage > 75
                              ? "warning"
                              : "success"
                        }
                        size="sm"
                        value={designer.workloadPercentage}
                      />
                      <span className="text-xs text-default-500">
                        {designer.workloadPercentage}% •{" "}
                        {designer.availableHours}h available
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {designer.efficiency >= 85 ? (
                          <TrendingUp className="w-4 h-4 text-success" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-danger" />
                        )}
                        <span
                          className={`font-medium text-sm ${
                            designer.efficiency >= 85
                              ? "text-success"
                              : designer.efficiency >= 70
                                ? "text-warning"
                                : "text-danger"
                          }`}
                        >
                          {designer.efficiency}%
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-default-400" />
                        <span className="text-sm">
                          {designer.currentTasksCount}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-success" />
                        <span className="text-sm text-success">
                          {designer.completedTasksCount}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getStatusColor(designer.status.toLowerCase())}
                      size="sm"
                      variant="flat"
                    >
                      {t(`status.${designer.status.toLowerCase()}`) ||
                        designer.status.replace("-", " ")}
                    </Chip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>

        {pagination.totalPages > 1 && (
          <div className="flex justify-center p-4 border-t border-default-200">
            <GlobalPagination
              currentPage={pagination.currentPage}
              pageSize={pagination.pageSize}
              totalItems={pagination.totalItems}
              totalPages={pagination.totalPages}
              onPageChange={(page) => fetchPage(page)}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
