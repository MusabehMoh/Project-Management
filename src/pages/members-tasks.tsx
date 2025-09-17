import { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
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
  Calendar,
  Clock,
} from "lucide-react";
import {
  Chip,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Input,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
} from "@heroui/react";

import { TaskCard } from "@/components/members-tasks/TaskCard";
import { TaskListView } from "@/components/members-tasks/TaskListView";
import { TaskGanttView } from "@/components/members-tasks/TaskGanttView";
import { TaskFilters } from "@/components/members-tasks/TaskFilters";
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
    changeStatus,
    requestDesign,
  } = useMembersTasks(mockDepartments);

  const { language } = useLanguage();

  const [isRequestDesignModalOpend, setIsRequestDesignModalOpend] =
    useState(false);
  const [notes, setNotes] = useState("");
  const [requestDesignError, setRequestDesignError] = useState(false);

  const handleRequestDesignSubmit = async () => {
    console.log("Request Design for:", selectedTask?.name);
    console.log("Notes:", notes);

    const success = await requestDesign(selectedTask?.id ?? "0", notes ?? "");

    if (success) {
      setIsRequestDesignModalOpend(false);
      setNotes("");
      console.log("--->>> success is true");
    } else {
      setRequestDesignError(true);
    }
  };

  // Debug logging
  console.log("MembersTasksPage - tasks:", tasks?.length, tasks);
  console.log("MembersTasksPage - loading:", loading);
  console.log("MembersTasksPage - error:", error);
  console.log("MembersTasksPage - filters:", filters);

  const handleTaskClick = (task: MemberTask) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  const handleRequestDesign = (task: MemberTask) => {
    if (isDrawerOpen) {
      setIsDrawerOpen(false);
    }
    setSelectedTask(task);
    setIsRequestDesignModalOpend(true);
    setRequestDesignError(false);
    setNotes("");
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

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const mapColor = (color?: string) => {
    switch (color) {
      case "success":
      case "danger":
      case "primary":
      case "secondary":
      case "warning":
        return color;
      default:
        return "default";
    }
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
                        t.status.label.toLowerCase().includes("progress")
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

        {/* Page Size Selector here*/}

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
              aria-label="Sort tasks"
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
                    onRequestDesign={handleRequestDesign}
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
        {/* Requirement Details Drawer */}
        <Drawer
          isOpen={isDrawerOpen}
          placement={language === "en" ? "left" : "right"}
          size="lg"
          onOpenChange={setIsDrawerOpen}
        >
          <DrawerContent
          // className={`min-h-[400px] transition-all duration-200 hover:shadow-lg
          //   ${
          //     selectedTask?.isOverdue
          //       ? "border-l-4 border-l-danger-500 bg-white dark:bg-danger-900/20"
          //       : `border-l-4 border-l-${selectedTask?.status.color as any}-500 bg-white dark:bg-${selectedTask?.status.color as any}-900/20`
          //   }`}
          >
            <DrawerHeader className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold">{selectedTask?.name}</h2>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedTask?.department?.color }}
                />
                <span className="text-sm text-foreground-600">
                  {selectedTask?.department?.name}
                </span>
                {selectedTask?.isOverdue && (
                  <Badge color="danger" size="sm" variant="flat">
                    {t("overdueTask")}
                  </Badge>
                )}
              </div>
            </DrawerHeader>
            <DrawerBody>
              {selectedTask && (
                <div className="space-y-6">
                  {/* Status and Priority */}
                  <div className="flex justify-between gap-8">
                    {/* Column 1: Priority */}
                    <div className="flex flex-col items-start gap-1">
                      <h4 className="text-md">{t("priority")}</h4>
                      <Chip
                        color={mapColor(selectedTask.priority.color)}
                        size="sm"
                        variant="solid"
                      >
                        {t(`${selectedTask.priority.label}`)}
                      </Chip>
                    </div>

                    {/* Column 2: Status */}
                    <div className="flex flex-col items-start gap-1">
                      <h4 className="text-md">{t("status")}</h4>
                      <Chip
                        color={mapColor(selectedTask.status.color)}
                        size="sm"
                        variant="flat"
                      >
                        {`${selectedTask.status.label.replace("-", "")}`}
                      </Chip>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {t("requirements.description")}
                    </h3>
                    <div className="bg-default-50 dark:bg-default-100/10 p-4 rounded-lg">
                      <p
                        dangerouslySetInnerHTML={{
                          __html: selectedTask.description,
                        }}
                        className="text-sm leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-start">
                    {/* Start Date */}
                    <div>
                      <h3 className="text-md mb-2">{t("startDate")}</h3>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-default-400" />
                        <span className="text-sm">
                          {formatDate(selectedTask.startDate)}
                        </span>
                      </div>
                    </div>

                    {/* Expected Completion Date */}
                    <div>
                      <h3 className="text-md mb-2">
                        {t("requirements.expectedCompletion")}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-default-400" />
                        <span className="text-sm">
                          {formatDate(selectedTask.endDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expected Completion Date */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-foreground-500" />
                    <p className="text-lg ">{t("estimatedTime")}</p>
                    <p className="text-md font-semibold text-foreground ">
                      {selectedTask.estimatedTime}h
                    </p>
                  </div>

                  {/* project & requirement */}
                  <div className="mt-3 pt-3 pb-3 border-t border-b border-divider">
                    <div className="flex flex-col gap-4">
                      {/* Project */}
                      <div className="flex flex-col gap-1">
                        <span className="font-md">{t("project")}</span>
                        <span className="font-md">
                          {selectedTask.project.name}
                        </span>
                      </div>

                      {/* Requirement */}
                      <div className="flex flex-col gap-1">
                        <span className="font-md">{t("requirement")}</span>
                        <span className="font-md">
                          {selectedTask.requirement.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* buttons */}
                  <div className="mt-3 pt-3 flex flex-col gap-3">
                    {/* Row 2 */}
                    <div className="flex gap-3">
                      <Button
                        className="flex-1"
                        color="primary"
                        size="sm"
                        variant="flat"
                        onPress={() => handleRequestDesign(selectedTask)}
                      >
                        {t("requestDesign")}
                      </Button>

                      <Button
                        className="flex-1"
                        color="success"
                        size="sm"
                        variant="flat"
                        onPress={() => {}} ///TODO
                      >
                        {t("changeStatus")}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </DrawerBody>
            <DrawerFooter>
              <Button
                color="danger"
                variant="light"
                onPress={() => setIsDrawerOpen(false)}
              >
                {t("common.close")}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* Request Design Modal */}
        <Modal
          isOpen={isRequestDesignModalOpend}
          onOpenChange={setIsRequestDesignModalOpend}
        >
          <ModalContent className="p-6 rounded-lg max-w-md">
            <ModalHeader className="flex flex-col items-center">
              {requestDesignError && (
                <h4 className="font-medium" style={{ color: "#ef4444" }}>
                  {t("common.unexpectedError")}
                </h4>
              )}
              <h2 className="text-lg font-semibold">{t("requestDesign")}</h2>
            </ModalHeader>
            <div className="space-y-4">
              <Input value={selectedTask?.name ?? ""} readOnly />
              <Textarea
                placeholder={t("timeline.treeView.notes")}
                value={notes}
                onChange={(e: any) => setNotes(e.target.value)}
              />
            </div>
            <ModalFooter>
              <Button
                color="default"
                size="md"
                variant="flat"
                onPress={() => setIsRequestDesignModalOpend(false)} /// also clear erro here
              >
                {t("cancel")}
              </Button>
              <Button
                color="primary"
                size="md"
                variant="flat"
                onPress={handleRequestDesignSubmit}
              >
                {t("confirm")}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        {/* <TaskDetailsModal
          isOpen={isDetailsOpen}
          task={selectedTask}
          onClose={onDetailsClose}
        /> */}
      </div>
    </DefaultLayout>
  );
}
