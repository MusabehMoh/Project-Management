import React, { useState, useEffect, useMemo } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Progress } from "@heroui/progress";
import { Skeleton } from "@heroui/skeleton";
import { Tooltip } from "@heroui/tooltip";
import { Select, SelectItem } from "@heroui/select";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Filter, X } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import {
  teamWorkloadService,
  type TeamMemberMetrics,
} from "@/services/api/teamWorkloadService";
import { GlobalPagination } from "@/components/GlobalPagination";

// Get performance color based on score
const getPerformanceColor = (score: number) => {
  if (score >= 80) return "success";
  if (score >= 60) return "warning";

  return "danger";
};

// Format busy until date for tooltip
const formatBusyUntil = (
  busyUntil: string | undefined,
  t: (key: string) => string,
) => {
  if (!busyUntil) return "";

  const busyDate = new Date(busyUntil);
  const now = new Date();
  const diffTime = busyDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return t("team.busyUntilToday");
  if (diffDays === 1) return t("team.busyUntilTomorrow");
  if (diffDays <= 7) {
    return t("team.busyUntilDays").replace("{days}", diffDays.toString());
  }

  return t("team.busyUntilDate").replace(
    "{date}",
    busyDate.toLocaleDateString(),
  );
};

const TeamWorkloadPerformance: React.FC = () => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [teamData, setTeamData] = useState<TeamMemberMetrics[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    department: "",
    busyStatus: "",
    performanceRange: "",
  });

  // Get unique departments for filter
  const departments = useMemo(() => {
    const depts = Array.from(
      new Set(teamData.map((member) => member.department)),
    );

    return depts.sort();
  }, [teamData]);

  // Filter team data based on current filters
  const filteredTeamData = useMemo(() => {
    return teamData.filter((member) => {
      // Search filter (name or department)
      if (
        filters.search &&
        !member.fullName.toLowerCase().includes(filters.search.toLowerCase()) &&
        !member.department.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      // Department filter
      if (filters.department && member.department !== filters.department) {
        return false;
      }

      // Busy status filter
      if (filters.busyStatus && member.busyStatus !== filters.busyStatus) {
        return false;
      }

      // Performance range filter
      if (filters.performanceRange) {
        const performance = member.metrics.performance;

        switch (filters.performanceRange) {
          case "excellent":
            return performance >= 90;

          case "good":
            return performance >= 70 && performance < 90;

          case "average":
            return performance >= 50 && performance < 70;

          case "poor":
            return performance < 50;

          default:
            return true;
        }
      }

      return true;
    });
  }, [teamData, filters]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return filteredTeamData.slice(startIndex, endIndex);
  }, [filteredTeamData, currentPage, pageSize]);

  // Calculate pagination info
  const totalPages = Math.ceil(filteredTeamData.length / pageSize);
  const totalItems = filteredTeamData.length;

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: "",
      department: "",
      busyStatus: "",
      performanceRange: "",
    });
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some((value) => value !== "");

  useEffect(() => {
    const fetchTeamWorkloadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await teamWorkloadService.getTeamWorkloadPerformance();

        if (response.success) {
          setTeamData(response.data);
        } else {
          throw new Error("Failed to fetch team workload data");
        }
      } catch (err) {
        console.error("Error loading team workload data:", err);
        setError("An error occurred while loading team workload data");
        setTeamData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamWorkloadData();
  }, []);

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"}>
      <Card className="w-full shadow-md border border-default-200">
        <CardHeader className="pb-0">
          <div className="flex justify-between items-center w-full">
            <h3 className="text-lg font-medium">
              {t("dashboard.teamWorkload")}
            </h3>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Chip
                  color="primary"
                  size="sm"
                  variant="flat"
                  onClose={resetFilters}
                >
                  {filteredTeamData.length} / {teamData.length}{" "}
                  {t("team.filtered")}
                </Chip>
              )}
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                onPress={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {/* Filter Panel */}
          {showFilters && (
            <div className="mb-4 p-4 bg-default-50 dark:bg-default-100/50 rounded-lg border border-default-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search Filter */}
                <Input
                  isClearable
                  label={t("team.search")}
                  placeholder={t("team.searchPlaceholder")}
                  size="sm"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  onClear={() => setFilters({ ...filters, search: "" })}
                />

                {/* Department Filter */}
                <Select
                  label={t("team.department")}
                  placeholder={t("team.allDepartments")}
                  selectedKeys={filters.department ? [filters.department] : []}
                  size="sm"
                  onSelectionChange={(keys) => {
                    const value = (Array.from(keys)[0] as string) || "";

                    setFilters({ ...filters, department: value });
                  }}
                >
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </Select>

                {/* Busy Status Filter */}
                <Select
                  label={t("team.busyStatus")}
                  placeholder={t("team.allStatuses")}
                  selectedKeys={filters.busyStatus ? [filters.busyStatus] : []}
                  size="sm"
                  onSelectionChange={(keys) => {
                    const value = (Array.from(keys)[0] as string) || "";

                    setFilters({ ...filters, busyStatus: value });
                  }}
                >
                  <SelectItem key="busy">{t("team.busy")}</SelectItem>
                  <SelectItem key="available">{t("team.available")}</SelectItem>
                </Select>

                {/* Performance Range Filter */}
                <Select
                  label={t("team.performanceRange")}
                  placeholder={t("team.allPerformance")}
                  selectedKeys={
                    filters.performanceRange ? [filters.performanceRange] : []
                  }
                  size="sm"
                  onSelectionChange={(keys) => {
                    const value = (Array.from(keys)[0] as string) || "";

                    setFilters({ ...filters, performanceRange: value });
                  }}
                >
                  <SelectItem key="excellent">
                    {t("team.excellent")} (90%+)
                  </SelectItem>
                  <SelectItem key="good">{t("team.good")} (70-89%)</SelectItem>
                  <SelectItem key="average">
                    {t("team.average")} (50-69%)
                  </SelectItem>
                  <SelectItem key="poor">{t("team.poor")} (&lt;50%)</SelectItem>
                </Select>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <div className="mt-3 flex justify-end">
                  <Button
                    color="default"
                    size="sm"
                    startContent={<X className="w-4 h-4" />}
                    variant="flat"
                    onPress={resetFilters}
                  >
                    {t("team.clearFilters")}
                  </Button>
                </div>
              )}
            </div>
          )}
          {loading ? (
            <div className="space-y-4">
              {/* Header metrics skeleton */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center space-y-2">
                  <Skeleton className="h-8 w-16 mx-auto rounded" />
                  <Skeleton className="h-4 w-20 mx-auto rounded" />
                </div>
                <div className="text-center space-y-2">
                  <Skeleton className="h-8 w-16 mx-auto rounded" />
                  <Skeleton className="h-4 w-24 mx-auto rounded" />
                </div>
                <div className="text-center space-y-2">
                  <Skeleton className="h-8 w-16 mx-auto rounded" />
                  <Skeleton className="h-4 w-28 mx-auto rounded" />
                </div>
              </div>
              
              {/* Table skeleton */}
              <div className="space-y-3">
                {/* Table header */}
                <div className="grid grid-cols-4 gap-4 pb-3 border-b border-default-200">
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-4 w-20 rounded" />
                </div>
                
                {/* Table rows */}
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="grid grid-cols-4 gap-4 py-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-20 rounded" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-4 w-12 rounded" />
                    <Skeleton className="h-4 w-14 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="text-center text-danger py-4">{error}</div>
          ) : filteredTeamData.length === 0 ? (
            <div className="text-center text-default-500 py-4">
              {hasActiveFilters ? t("team.noFilterResults") : t("table.noData")}
            </div>
          ) : (
            <>
              {/* Results info and page size selector */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div className="text-sm text-default-600">
                  {t("pagination.showing")} {(currentPage - 1) * pageSize + 1}{" "}
                  {t("pagination.to")}{" "}
                  {Math.min(currentPage * pageSize, totalItems)}{" "}
                  {t("pagination.of")} {totalItems} {t("team.members")}
                </div>

                {/* Page Size Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-default-600">
                    {t("common.show")}:
                  </span>
                  <Select
                    className="w-20"
                    selectedKeys={[pageSize.toString()]}
                    size="sm"
                    onSelectionChange={(keys) => {
                      const newSize = parseInt(Array.from(keys)[0] as string);

                      handlePageSizeChange(newSize);
                    }}
                  >
                    <SelectItem key="5">5</SelectItem>
                    <SelectItem key="10">10</SelectItem>
                    <SelectItem key="15">15</SelectItem>
                    <SelectItem key="20">20</SelectItem>
                  </Select>
                  <span className="text-sm text-default-600">
                    {t("pagination.perPage")}
                  </span>
                </div>
              </div>

              <Table
                removeWrapper
                aria-label="Team workload and performance table"
              >
                <TableHeader>
                  <TableColumn>{t("team.member")}</TableColumn>
                  <TableColumn>{t("team.department")}</TableColumn>
                  <TableColumn className="text-center">
                    {t("team.total")}
                  </TableColumn>
                  <TableColumn className="text-center">
                    {t("team.inProgress")}
                  </TableColumn>
                  <TableColumn className="text-center">
                    {t("team.completed")}
                  </TableColumn>
                  <TableColumn>{t("team.performance")}</TableColumn>
                  <TableColumn>{t("team.busy")}</TableColumn>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((member) => (
                    <TableRow key={member.userId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{member.fullName}</div>
                          <div className="text-xs text-default-500">
                            {member.gradeName}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {member.department}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {member.metrics.totalRequirements}
                      </TableCell>
                      <TableCell className="text-center">
                        {member.metrics.inProgress}
                      </TableCell>
                      <TableCell className="text-center">
                        {member.metrics.completed}
                      </TableCell>
                      <TableCell>
                        <Tooltip
                          showArrow
                          content={`${t("team.performance")}: ${member.metrics.performance}%`}
                        >
                          <Progress
                            className="w-full cursor-help"
                            color={getPerformanceColor(
                              member.metrics.performance,
                            )}
                            showValueLabel={false}
                            size="sm"
                            value={member.metrics.performance}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {member.busyStatus === "busy" ? (
                          <Tooltip
                            showArrow
                            content={formatBusyUntil(member.busyUntil, t)}
                          >
                            <span className="text-danger font-semibold cursor-help">
                              {t("team.busy")}
                            </span>
                          </Tooltip>
                        ) : (
                          <span className="text-success font-semibold">
                            {t("team.available")}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center py-4">
                  <GlobalPagination
                    currentPage={currentPage}
                    isLoading={loading}
                    pageSize={pageSize}
                    showInfo={false}
                    totalItems={totalItems}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default TeamWorkloadPerformance;
