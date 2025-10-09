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
  Palette,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { GlobalPagination } from "@/components/GlobalPagination";

interface DesignerWorkload {
  designerId: string;
  designerName: string;
  currentProjects: number;
  completedDesigns: number;
  averageDesignTime: number;
  efficiency: number;
  workloadPercentage: number;
  skills: string[];
  currentTasks: string[];
  availableHours: number;
  status: string;
}

interface TeamPerformanceMetrics {
  totalDesigners: number;
  activeDesigners: number;
  averageEfficiency: number;
  totalDesignsCompleted: number;
  totalDesignsInProgress: number;
  averageDesignCompletionTime: number;
  revisionsCompleted: number;
  averageRevisionTime: number;
  assetsDelivered: number;
  prototypesCreated: number;
}

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

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
  const [designers, setDesigners] = useState<DesignerWorkload[]>([]);
  const [metrics, setMetrics] = useState<TeamPerformanceMetrics | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    pageSize: 5,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("efficiency");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Mock data for designers
  const mockDesigners: DesignerWorkload[] = [
    {
      designerId: "1",
      designerName: "Layla Ahmad",
      currentProjects: 3,
      completedDesigns: 45,
      averageDesignTime: 8.5,
      efficiency: 94,
      workloadPercentage: 75,
      skills: ["UI/UX", "Figma", "Adobe XD"],
      currentTasks: ["Landing Page", "Mobile App", "Logo Design"],
      availableHours: 10,
      status: "available",
    },
    {
      designerId: "2",
      designerName: "Yusuf Ibrahim",
      currentProjects: 5,
      completedDesigns: 52,
      averageDesignTime: 7.2,
      efficiency: 88,
      workloadPercentage: 90,
      skills: ["Graphic Design", "Illustrator", "Photoshop"],
      currentTasks: ["Brand Identity", "Marketing Materials"],
      availableHours: 4,
      status: "busy",
    },
    {
      designerId: "3",
      designerName: "Noor Saleh",
      currentProjects: 2,
      completedDesigns: 38,
      averageDesignTime: 9.0,
      efficiency: 82,
      workloadPercentage: 55,
      skills: ["Motion Graphics", "After Effects", "Premiere"],
      currentTasks: ["Video Intro", "Animated Banner"],
      availableHours: 18,
      status: "available",
    },
    {
      designerId: "4",
      designerName: "Maha Khalid",
      currentProjects: 4,
      completedDesigns: 61,
      averageDesignTime: 6.8,
      efficiency: 92,
      workloadPercentage: 80,
      skills: ["Web Design", "UI/UX", "Prototyping"],
      currentTasks: ["Dashboard Design", "E-commerce Site"],
      availableHours: 8,
      status: "available",
    },
  ];

  const mockMetrics: TeamPerformanceMetrics = {
    totalDesigners: 4,
    activeDesigners: 4,
    averageEfficiency: 89,
    totalDesignsCompleted: 196,
    totalDesignsInProgress: 14,
    averageDesignCompletionTime: 7.9,
    revisionsCompleted: 78,
    averageRevisionTime: 2.1,
    assetsDelivered: 142,
    prototypesCreated: 35,
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const fetchData = async (page: number = 1) => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      let filteredDesigners = [...mockDesigners];

      // Apply status filter
      if (statusFilter) {
        filteredDesigners = filteredDesigners.filter(
          (designer) => designer.status === statusFilter,
        );
      }

      // Apply search filter
      if (searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase();
        filteredDesigners = filteredDesigners.filter(
          (designer) =>
            designer.designerName.toLowerCase().includes(searchLower) ||
            designer.skills.some((skill) =>
              skill.toLowerCase().includes(searchLower),
            ) ||
            designer.currentTasks.some((task) =>
              task.toLowerCase().includes(searchLower),
            ),
        );
      }

      // Apply sorting
      filteredDesigners.sort((a, b) => {
        let aValue: any, bValue: any;

        switch (sortBy) {
          case "efficiency":
            aValue = a.efficiency;
            bValue = b.efficiency;
            break;
          case "workload":
            aValue = a.workloadPercentage;
            bValue = b.workloadPercentage;
            break;
          case "name":
            aValue = a.designerName;
            bValue = b.designerName;
            break;
          case "projects":
            aValue = a.currentProjects;
            bValue = b.currentProjects;
            break;
          case "completed":
            aValue = a.completedDesigns;
            bValue = b.completedDesigns;
            break;
          default:
            aValue = a.efficiency;
            bValue = b.efficiency;
        }

        if (typeof aValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (sortOrder === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Apply pagination
      const startIndex = (page - 1) * pagination.pageSize;
      const endIndex = startIndex + pagination.pageSize;
      const paginatedDesigners = filteredDesigners.slice(startIndex, endIndex);

      setDesigners(paginatedDesigners);
      setMetrics(mockMetrics);
      setPagination({
        currentPage: page,
        pageSize: pagination.pageSize,
        totalItems: filteredDesigners.length,
        totalPages: Math.ceil(filteredDesigners.length / pagination.pageSize),
        hasNextPage: endIndex < filteredDesigners.length,
        hasPreviousPage: page > 1,
      });
    } catch (err) {
      console.error("Error fetching designer data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, sortBy, sortOrder]);

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
                aria-label="Filter by status"
                className="max-w-xs"
                placeholder={t("common.filterByStatus") || "Filter by status"}
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
                aria-label="Sort by"
                className="max-w-xs"
                placeholder={t("common.sortBy") || "Sort by"}
                selectedKeys={[sortBy]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setSortBy(selected);
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
            <div className="mb-6 p-4 bg-default-50 dark:bg-default-100/50 rounded-lg border border-default-200">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">
                    {metrics.averageEfficiency.toFixed(1)}%
                  </div>
                  <div className="text-xs text-default-500">
                    {t("common.avgEfficiency") || "Avg Efficiency"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {metrics.totalDesignsCompleted}
                  </div>
                  <div className="text-xs text-default-500">
                    {t("designerDashboard.designsCompleted") ||
                      "Designs Completed"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning">
                    {metrics.averageDesignCompletionTime.toFixed(1)}h
                  </div>
                  <div className="text-xs text-default-500">
                    {t("designerDashboard.avgDesignTime") || "Avg Design Time"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">
                    {metrics.prototypesCreated}
                  </div>
                  <div className="text-xs text-default-500">
                    {t("designerDashboard.prototypesCreated") ||
                      "Prototypes Created"}
                  </div>
                </div>
              </div>
            </div>
          )}

          <Table removeWrapper aria-label="Designer workload performance">
            <TableHeader>
              <TableColumn>
                {t("designerDashboard.designer") || "Designer"}
              </TableColumn>
              <TableColumn>
                {t("common.workload") || "Workload"}
              </TableColumn>
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
                <TableRow key={designer.designerId}>
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
                        <div className="flex flex-wrap gap-1 mt-1">
                          {designer.skills.slice(0, 2).map((skill) => (
                            <Chip
                              key={skill}
                              className="text-xs"
                              size="sm"
                              variant="flat"
                            >
                              {skill}
                            </Chip>
                          ))}
                          {designer.skills.length > 2 && (
                            <Tooltip
                              content={designer.skills.slice(2).join(", ")}
                            >
                              <Chip
                                className="text-xs"
                                size="sm"
                                variant="flat"
                              >
                                +{designer.skills.length - 2}
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
                          {designer.currentProjects}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-success" />
                        <span className="text-sm text-success">
                          {designer.completedDesigns}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getStatusColor(designer.status)}
                      size="sm"
                      variant="flat"
                    >
                      {t(`status.${designer.status}`) ||
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
              onPageChange={(page) => fetchData(page)}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
