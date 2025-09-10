import { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { useDisclosure } from "@heroui/modal";
import { Pagination } from "@heroui/pagination";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Select, SelectItem } from "@heroui/select";
import { Badge } from "@heroui/badge";
import {
  FileDown,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Grid3X3,
  List,
  BarChart3,
} from "lucide-react";

import { TaskCard } from "@/components/members-tasks/TaskCard";
import { TaskListView } from "@/components/members-tasks/TaskListView";
import { TaskGanttView } from "@/components/members-tasks/TaskGanttView";
import { TaskFilters } from "@/components/members-tasks/TaskFilters";
import { TaskDetailsModal } from "@/components/members-tasks/TaskDetailsModal";
import { TaskGridSkeleton } from "@/components/members-tasks/TaskGridSkeleton";
import DefaultLayout from "@/layouts/default";
import { useMembersTasks } from "@/hooks/useMembersTasks";
import { useLanguage } from "@/contexts/LanguageContext";
import { MemberTask } from "@/types/membersTasks";
import { Department } from "@/types/timeline";

// Mock departments - in real app, this would come from context or API
const mockDepartments: Department[] = [
  { id: "1", name: "Engineering", color: "#3b82f6" },
  { id: "2", name: "Design", color: "#8b5cf6" },
  { id: "3", name: "Marketing", color: "#10b981" },
  { id: "4", name: "Sales", color: "#f59e0b" },
  { id: "5", name: "HR", color: "#ef4444" },
  { id: "6", name: "Operations", color: "#6366f1" },
];

export default function MembersTasksPage() {
  const { t } = useLanguage();
  const [selectedTask, setSelectedTask] = useState<MemberTask | null>(null);
  const [viewType, setViewType] = useState<"grid" | "list" | "gantt">("grid");
  const {
    isOpen: isDetailsOpen,
    onOpen: onDetailsOpen,
    onClose: onDetailsClose,
  } = useDisclosure();

  const {
    tasks,
    loading,
    error,
    totalPages,
    currentPage,
    totalCount,
    filters,
    setFilters,
    fetchTasks,
    refreshTasks,
    exportTasks,
    searchEmployees,
    filtersData,
    allEmployees,
  } = useMembersTasks(mockDepartments);

  // Debug logging
  console.log("MembersTasksPage - tasks:", tasks?.length, tasks);
  console.log("MembersTasksPage - loading:", loading);
  console.log("MembersTasksPage - error:", error);
  console.log("MembersTasksPage - filters:", filters);

  const handleTaskClick = (task: MemberTask) => {
    setSelectedTask(task);
    onDetailsOpen();
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleSortChange = (keys: any) => {
    const sortValue = Array.from(keys)[0] as string;
    const [sortBy, sortOrder] = sortValue.split("-");

    setFilters({
      ...filters,
      sortBy: sortBy as any,
      sortOrder: sortOrder as "asc" | "desc",
      page: 1,
    });
  };

  const handleExport = async (format: "csv" | "pdf" | "excel") => {
    try {
      await exportTasks(format);
    } catch (error) {
      console.error("Export failed:", error);
      // In real app, show toast notification
    }
  };

  const handleRefresh = () => {
    refreshTasks();
  };

  const getActiveFiltersCount = () => {
    let count = 0;

    if (filters.search) count++;
    if (filters.memberIds?.length) count++;
    if (filters.departmentIds?.length) count++;
    if (filters.statusIds?.length) count++;
    if (filters.priorityIds?.length) count++;
    if (filters.dateRange) count++;
    if (filters.isOverdue) count++;

    return count;
  };

  const getSortLabel = () => {
    const sortLabel =
      filters.sortBy === "name"
        ? "Name"
        : filters.sortBy === "startDate"
          ? "Start Date"
          : filters.sortBy === "endDate"
            ? "End Date"
            : filters.sortBy === "priority"
              ? "Priority"
              : filters.sortBy === "progress"
                ? "Progress"
                : "Date";

    return `${sortLabel} (${filters.sortOrder === "asc" ? "A-Z" : "Z-A"})`;
  };

  return (
    <DefaultLayout>
      <div className="w-full max-w-full px-6 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t("membersTasksDashboard")}
              </h1>
              <p className="text-foreground-600 mt-1">{t("tasksOverview")}</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Export Dropdown */}
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    startContent={<FileDown className="w-4 h-4" />}
                    variant="flat"
                  >
                    {t("exportTasks")}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Export options">
                  <DropdownItem
                    key="csv"
                    startContent={<FileSpreadsheet className="w-4 h-4" />}
                    onPress={() => handleExport("csv")}
                  >
                    {t("exportAsCSV")}
                  </DropdownItem>
                  <DropdownItem
                    key="excel"
                    startContent={<FileSpreadsheet className="w-4 h-4" />}
                    onPress={() => handleExport("excel")}
                  >
                    {t("exportAsExcel")}
                  </DropdownItem>
                  <DropdownItem
                    key="pdf"
                    startContent={<FileText className="w-4 h-4" />}
                    onPress={() => handleExport("pdf")}
                  >
                    {t("exportAsPDF")}
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>

              {/* Refresh Button */}
              <Button
                isLoading={loading}
                startContent={<RefreshCw className="w-4 h-4" />}
                variant="flat"
                onPress={handleRefresh}
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4">
            <Card className="flex-1 min-w-[200px]">
              <CardBody className="flex flex-row items-center gap-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                  <Grid3X3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-foreground-600">Total Tasks</p>
                  <p className="text-xl font-bold text-foreground">
                    {totalCount}
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card className="flex-1 min-w-[200px]">
              <CardBody className="flex flex-row items-center gap-3">
                <div className="p-2 bg-warning-100 dark:bg-warning-900/20 rounded-lg">
                  <RefreshCw className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-foreground-600">In Progress</p>
                  <p className="text-xl font-bold text-foreground">
                    {
                      tasks.filter((t) =>
                        t.status.label.toLowerCase().includes("progress"),
                      ).length
                    }
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card className="flex-1 min-w-[200px]">
              <CardBody className="flex flex-row items-center gap-3">
                <div className="p-2 bg-danger-100 dark:bg-danger-900/20 rounded-lg">
                  <FileText className="w-5 h-5 text-danger" />
                </div>
                <div>
                  <p className="text-sm text-foreground-600">Overdue</p>
                  <p className="text-xl font-bold text-foreground">
                    {tasks.filter((t) => t.isOverdue).length}
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <TaskFilters
          allEmployees={allEmployees}
          filters={filters}
          filtersData={filtersData}
          loading={loading}
          onFiltersChange={setFilters}
          onSearchEmployees={searchEmployees}
        />

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-content2 rounded-lg p-1">
              <Button
                className="min-w-unit-16"
                color={viewType === "grid" ? "primary" : "default"}
                size="sm"
                startContent={<Grid3X3 className="w-4 h-4" />}
                variant={viewType === "grid" ? "solid" : "light"}
                onPress={() => setViewType("grid")}
              >
                Grid
              </Button>
              <Button
                className="min-w-unit-16"
                color={viewType === "list" ? "primary" : "default"}
                size="sm"
                startContent={<List className="w-4 h-4" />}
                variant={viewType === "list" ? "solid" : "light"}
                onPress={() => setViewType("list")}
              >
                List
              </Button>
              <Button
                className="min-w-unit-16"
                color={viewType === "gantt" ? "primary" : "default"}
                size="sm"
                startContent={<BarChart3 className="w-4 h-4" />}
                variant={viewType === "gantt" ? "solid" : "light"}
                onPress={() => setViewType("gantt")}
              >
                Gantt
              </Button>
            </div>

            {/* Active Filters Display */}
            {getActiveFiltersCount() > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground-600">
                  {t("activeFilters")}:
                </span>
                <Badge color="primary" variant="flat">
                  {getActiveFiltersCount()}
                </Badge>
              </div>
            )}

            {/* Results Count */}
            <div className="text-sm text-foreground-600">
              Showing {tasks.length} of {totalCount} tasks
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground-600">Sort by:</span>
            <Select
              className="min-w-[180px]"
              selectedKeys={[`${filters.sortBy}-${filters.sortOrder}`]}
              size="sm"
              onSelectionChange={handleSortChange}
            >
              <SelectItem key="name-asc">Name (A-Z)</SelectItem>
              <SelectItem key="name-desc">Name (Z-A)</SelectItem>
              <SelectItem key="startDate-asc">Start Date (Earliest)</SelectItem>
              <SelectItem key="startDate-desc">Start Date (Latest)</SelectItem>
              <SelectItem key="endDate-asc">End Date (Earliest)</SelectItem>
              <SelectItem key="endDate-desc">End Date (Latest)</SelectItem>
              <SelectItem key="priority-desc">
                Priority (High to Low)
              </SelectItem>
              <SelectItem key="priority-asc">Priority (Low to High)</SelectItem>
              <SelectItem key="progress-desc">
                Progress (High to Low)
              </SelectItem>
              <SelectItem key="progress-asc">Progress (Low to High)</SelectItem>
            </Select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-6">
            <CardBody className="text-center py-8">
              <p className="text-danger text-lg font-medium">
                {t("errorLoadingTasks")}
              </p>
              <p className="text-foreground-600 mt-2">{error}</p>
              <Button
                className="mt-4"
                color="danger"
                variant="flat"
                onPress={handleRefresh}
              >
                Try Again
              </Button>
            </CardBody>
          </Card>
        )}

        {/* Tasks Views */}
        {loading ? (
          <TaskGridSkeleton />
        ) : tasks.length === 0 ? (
          <Card>
            <CardBody className="text-center py-16">
              <Grid3X3 className="w-16 h-16 text-foreground-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {t("noTasksFound")}
              </h3>
              <p className="text-foreground-600 mb-6">
                {t("adjustFiltersMessage")}
              </p>
              <Button
                color="primary"
                variant="flat"
                onPress={() => setFilters({ page: 1, limit: filters.limit })}
              >
                Clear Filters
              </Button>
            </CardBody>
          </Card>
        ) : (
          <>
            {/* Grid View */}
            {viewType === "grid" && (
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
                style={{ alignItems: "start" }}
              >
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={handleTaskClick}
                  />
                ))}
              </div>
            )}

            {/* List View */}
            {viewType === "list" && (
              <div className="mb-8">
                <TaskListView tasks={tasks} onTaskClick={handleTaskClick} />
              </div>
            )}

            {/* Gantt View */}
            {viewType === "gantt" && (
              <div className="mb-8">
                <TaskGanttView tasks={tasks} onTaskClick={handleTaskClick} />
              </div>
            )}

            {/* Pagination - Only show for grid and list views */}
            {(viewType === "grid" || viewType === "list") && totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination
                  showControls
                  showShadow
                  page={currentPage}
                  total={totalPages}
                  onChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}

        {/* Task Details Modal */}
        <TaskDetailsModal
          isOpen={isDetailsOpen}
          task={selectedTask}
          onClose={onDetailsClose}
        />
      </div>
    </DefaultLayout>
  );
}
