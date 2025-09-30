import { useEffect, useState } from "react";
import React from "react";
import { Button } from "@heroui/button";
import { Search, ChevronDown, X } from "lucide-react";
import { Card, CardBody } from "@heroui/card";
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
  Autocomplete,
  AutocompleteItem,
  Avatar,
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
  Skeleton,
  Textarea,
} from "@heroui/react";

import { TaskCard } from "@/components/members-tasks/TaskCard";
import { TaskListView } from "@/components/members-tasks/TaskListView";
import { TaskGridSkeleton } from "@/components/members-tasks/TaskGridSkeleton";
import { useMembersTasks } from "@/hooks/useMembersTasks";
import { useLanguage } from "@/contexts/LanguageContext";
import { MemberTask, TaskStatus } from "@/types/membersTasks";
import GlobalPagination from "@/components/GlobalPagination";
import { PAGE_SIZE_OPTIONS, normalizePageSize } from "@/constants/pagination";
import DHTMLXGantt from "@/components/timeline/GanttChart/dhtmlx/DhtmlxGantt";
import { usePermissions } from "@/hooks/usePermissions";
import useTeamSearch from "@/hooks/useTeamSearch";
import { MemberSearchResult } from "@/types/timeline";

export default function MembersTasksPage() {
  const { t } = useLanguage();

  const [selectedTask, setSelectedTask] = useState<MemberTask | null>(null);
  const [viewType, setViewType] = useState<"grid" | "list" | "gantt">("grid");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { hasAnyRole, loading: userLoading } = usePermissions();

  const {
    tasks,
    tasksConfigData,
    loading,
    headerLoading,
    initialLoading,
    error,
    totalPages,
    totalCount,
    fetchTasks,
    handlePageChange,
    handlePageSizeChange,
    handlePriorityChange,
    handleSearchChange,
    handleProjectChange,
    handleStatusChange,
    handleResetFilters,
    taskParametersRequest,
    refreshTasks,
    exportTasks,
    changeStatus,
    requestDesign,
    changeAssignees,
  } = useMembersTasks();

  const { language } = useLanguage();

  const [isRequestDesignModalOpend, setIsRequestDesignModalOpend] =
    useState(false);
  const [isChangeAssigneesModalOpened, setIsChangeAssigneesModalOpened] =
    useState(false);
  const [isChangeStatusModalOpend, setIsChangeStatusModalOpend] =
    useState(false);
  const [notes, setNotes] = useState("");
  const [modalError, setModalError] = useState(false);
  const [assigneeModalError, setAssigneeModalError] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(null);

  const [selectedMembers, setSelectedMembers] = useState<MemberSearchResult[]>(
    []
  );
  const [employeeInputValue, setEmployeeInputValue] = useState<string>("");
  // State for selected members
  const [selectedEmployee, setSelectedEmployee] =
    useState<MemberSearchResult | null>(null);
  // Employee search hooks for employees
  const {
    employees: employees,
    loading: employeeSearchLoading,
    searchEmployees: searchEmployees,
  } = useTeamSearch({
    minLength: 1,
    maxResults: 20,
    loadInitialResults: false,
  });

  const effectivePageSize = normalizePageSize(
    taskParametersRequest.limit ?? 10,
    10
  );

  // Search and filter states (local)
  const [searchTerm, setSearchTerm] = useState(
    taskParametersRequest?.search ?? ""
  );
  const [statusFilter, setStatusFilter] = useState<number | null>(
    taskParametersRequest?.statusId || null
  );
  const [priorityFilter, setPriorityFilter] = useState<number | null>(
    taskParametersRequest?.priorityId || null
  );
  const [projectFilter, setProjectFilter] = useState<number | null>(
    taskParametersRequest?.projectId || null
  );

  const [searchValue, setSearchValue] = useState(
    taskParametersRequest?.search ?? ""
  );

  const isTeamManager = hasAnyRole([
    "Analyst Department Manager",
    "Administrator",
  ]);

  console.log("isTeamManager", isTeamManager);

  const handleChangeAssigneesSubmit = async () => {
    if (typeof changeAssignees === "function") {
      if (selectedMembers.length === 0) {
        setAssigneeModalError(true);

        return;
      } else {
        const success = await changeAssignees(
          selectedTask?.id ?? "0",
          selectedMembers.map((member) => member.id.toString()),
          notes ?? ""
        );

        if (success) {
          setIsChangeAssigneesModalOpened(false);
          setNotes("");
          handleRefresh();
        } else {
          setModalError(true);
        }
      }
    } else {
      setModalError(true);
    }
  };

  const handleRequestDesignSubmit = async () => {
    const success = await requestDesign(selectedTask?.id ?? "0", notes ?? "");

    if (success) {
      setIsRequestDesignModalOpend(false);
      setNotes("");
      handleRefresh();
    } else {
      setModalError(true);
    }
  };

  const handleChangeStatusSubmit = async () => {
    const success = await changeStatus(
      selectedTask?.id ?? "0",
      `${selectedStatus?.id ?? 3}`,
      notes ?? ""
    );

    if (success) {
      setIsChangeStatusModalOpend(false);
      setNotes("");
      handleRefresh();
    } else {
      setModalError(true);
    }
  };

  const handleTaskClick = (task: MemberTask) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  const handleChangeAssignees = (task: MemberTask) => {
    // Implement the logic to change assignees here
    if (isDrawerOpen) setIsDrawerOpen(false);
    setSelectedTask(task);
    setIsChangeAssigneesModalOpened(true);
    resetUserDropDown();
    setModalError(false);
    setAssigneeModalError(false);
    setNotes("");
  };

  const handleRequestDesign = (task: MemberTask) => {
    if (isDrawerOpen) setIsDrawerOpen(false);
    setSelectedTask(task);
    setIsRequestDesignModalOpend(true);
    setModalError(false);
    setNotes("");
  };

  const handleChangeStatus = (task: MemberTask) => {
    if (isDrawerOpen) setIsDrawerOpen(false);
    setSelectedTask(task);
    setSelectedStatus({
      id: selectedTask?.status.id ?? 2,
      label: selectedTask?.status.label ?? "In Progress",
    });
    setIsChangeStatusModalOpend(true);
    setModalError(false);
    setNotes("");
  };

  const handleExport = async (format: "csv" | "pdf" | "xlsx") => {
    try {
      await exportTasks(format);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  // Handle employee selection
  const handleEmployeeSelect = (employee: MemberSearchResult) => {
    setSelectedEmployee(employee);
    setEmployeeInputValue("");
    if (!selectedMembers.some((user) => user.id === employee.id)) {
      setSelectedMembers([...selectedMembers, employee]);
    }
    setSelectedEmployee(null);
  };

  const resetUserDropDown = () => {
    // Only reset the dropdown input and current selection, keep selected chips
    setEmployeeInputValue("");
    setSelectedEmployee(null);
    setSelectedMembers([]);
    setSelectedEmployee(null);
  };

  // Update filters when search/filter states change (with debouncing)
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Update search if it's different
      if (searchTerm !== (taskParametersRequest?.search ?? "")) {
        handleSearchChange(searchTerm);
      }

      // Update status filter
      if (statusFilter !== (taskParametersRequest?.statusId || null)) {
        if (statusFilter !== null) {
          handleStatusChange(statusFilter);
        } else {
          // If status filter is reset to null, we need to refresh with other filters
          const hasOtherFilters = searchTerm || priorityFilter !== null || projectFilter !== null;
          if (hasOtherFilters) {
            // Trigger a refresh that maintains other filters but clears status
            fetchTasks();
          } else {
            handleResetFilters();
          }
        }
      }

      // Update priority filter
      if (priorityFilter !== (taskParametersRequest?.priorityId || null)) {
        if (priorityFilter !== null) {
          handlePriorityChange(priorityFilter);
        } else {
          // If priority filter is reset to null, refresh with other filters
          const hasOtherFilters = searchTerm || statusFilter !== null || projectFilter !== null;
          if (hasOtherFilters) {
            fetchTasks();
          } else {
            handleResetFilters();
          }
        }
      }

      // Update project filter
      if (projectFilter !== (taskParametersRequest?.projectId || null)) {
        if (projectFilter !== null) {
          handleProjectChange(projectFilter);
        } else {
          // If project filter is reset to null, refresh with other filters
          const hasOtherFilters = searchTerm || statusFilter !== null || priorityFilter !== null;
          if (hasOtherFilters) {
            fetchTasks();
          } else {
            handleResetFilters();
          }
        }
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [
    searchTerm,
    statusFilter,
    priorityFilter,
    projectFilter,
    handleSearchChange,
    handleStatusChange,
    handlePriorityChange,
    handleProjectChange,
    taskParametersRequest,
  ]);
  }, [searchTerm, statusFilter, priorityFilter, projectFilter, handleSearchChange, handleStatusChange, handlePriorityChange, handleProjectChange, handleResetFilters, fetchTasks, taskParametersRequest]);

  // Reset all filters
  const resetAllFilters = () => {
    setSearchTerm("");
    setStatusFilter(null);
    setPriorityFilter(null);
    setProjectFilter(null);
    handleResetFilters();
  };

  // Check if any filters are active
  const hasActiveFilters =
    searchTerm ||
    statusFilter !== null ||
    priorityFilter !== null ||
    projectFilter !== null;

  const handleRefresh = () => refreshTasks();

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

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

  return (
    <>
      <div className="w-full max-w-full">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md pb-4 mb-6 border-b border-divider">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-2">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {isTeamManager
                  ? t("teamMembersTasksDashboard")
                  : t("membersTasksDashboard")}
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
                    onPress={() => handleExport("xlsx")}
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
                {t("common.refresh")}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        {headerLoading ? (
          // Skeleton Loader
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="transition-all">
                <CardBody className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-lg" />{" "}
                  {/* icon placeholder */}
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-7 w-24 rounded-md text-center" />{" "}
                    {/* label */}
                    <div className="flex justify-center">
                      <Skeleton className="h-6 w-10 rounded-md" />{" "}
                      {/* number */}
                    </div>
                    {/* number */}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="transition-all hover:shadow-lg">
              <CardBody className="flex items-center gap-3">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                  <Grid3X3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-foreground-600">
                    {t("totalTasks")}
                  </p>
                  <p className="text-2xl text-center font-bold">
                    {tasksConfigData.totalTasks}
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card className="transition-all hover:shadow-lg">
              <CardBody className="flex items-center gap-3">
                <div className="p-3 bg-warning-100 dark:bg-warning-900/20 rounded-lg">
                  <RefreshCw className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-foreground-600">
                    {t("inProgress")}
                  </p>
                  <p className="text-2xl text-center font-bold">
                    {tasksConfigData.inProgressTasks}
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card className="transition-all hover:shadow-lg">
              <CardBody className="flex items-center gap-3">
                <div className="p-3 bg-danger-100 dark:bg-danger-900/20 rounded-lg">
                  <FileText className="w-6 h-6 text-danger" />
                </div>
                <div>
                  <p className="text-sm text-foreground-600">{t("overdue")}</p>
                  <p className="text-2xl text-center font-bold">
                    {tasksConfigData.overdueTasks}
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        {!initialLoading && (
          <Card>
            <CardBody>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <Input
                  className="md:w-120"
                  placeholder={t("common.search") + "..."}
                  startContent={<Search className="w-4 h-4" />}
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />

                <Select
                  className="md:w-90"
                  placeholder={t("project")}
                  selectedKeys={projectFilter ? [String(projectFilter)] : []}
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0] as string;
                    const newProjectFilter = val && val !== "" ? Number(val) : null;
                    setProjectFilter(newProjectFilter);
                  }}
                >
                  <SelectItem key="">{t("project")}</SelectItem>
                  {(tasksConfigData.projects ?? []).map((project) => (
                    <SelectItem
                      key={String(project.id)}
                      value={String(project.id)}
                    >
                      {project.name}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  className="md:w-43"
                  placeholder={t("status")}
                  selectedKeys={
                    statusFilter !== null ? [statusFilter.toString()] : []
                  }
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    const newStatusFilter = selectedKey && selectedKey !== "" ? parseInt(selectedKey) : null;
                    setStatusFilter(newStatusFilter);
                  }}
                >
                  <SelectItem key="">{t("status")}</SelectItem>
                  {(tasksConfigData.taskStatus ?? []).map((status) => (
                    <SelectItem
                      key={String(status.id)}
                      value={String(status.id)}
                    >
                      {status.label}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  className="md:w-43"
                  placeholder={t("priority")}
                  selectedKeys={
                    priorityFilter !== null ? [priorityFilter.toString()] : []
                  }
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    setPriorityFilter(
                      selectedKey ? parseInt(selectedKey) : null
                    );
                    const newPriorityFilter = selectedKey && selectedKey !== "" ? parseInt(selectedKey) : null;
                    setPriorityFilter(newPriorityFilter);
                  }}
                >
                  <SelectItem key="">{t("priority")}</SelectItem>
                  {(tasksConfigData.taskPriority ?? []).map((priority) => (
                    <SelectItem
                      key={String(priority.id)}
                      value={String(priority.id)}
                    >
                      {priority.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Clear Filters - New Row */}
              {hasActiveFilters && (
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    color="danger"
                    size="sm"
                    startContent={<X size={16} />}
                    variant="flat"
                    onPress={resetAllFilters}
                  >
                    {t("requirements.clearFilters")}
                  </Button>
                  <span className="text-sm text-default-500">
                    {t("pagination.showing")} {totalCount}{" "}
                    {t("pagination.items")}
                  </span>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Pagination Controls */}
        {!initialLoading && tasks.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4">
            <div className="flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
              <span className="text-sm text-default-600">
                {t("common.show")}
              </span>
              <Select
                className="w-20"
                selectedKeys={[
                  normalizePageSize(effectivePageSize, 10).toString(),
                ]}
                size="sm"
                onSelectionChange={(keys) => {
                  const newSize = parseInt(Array.from(keys)[0] as string);
                  handlePageSizeChange(newSize);
                }}
              >
                {PAGE_SIZE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.toString()} textValue={opt.toString()}>
                    {opt}
                  </SelectItem>
                ))}
              </Select>
              <span className="text-sm text-default-600">
                {t("pagination.perPage")}
              </span>
            </div>

            {totalPages > 1 && (
              <GlobalPagination
                currentPage={taskParametersRequest.page || 1}
                isLoading={loading}
                pageSize={effectivePageSize}
                showInfo={false}
                totalItems={totalCount}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        )}

        {/* Controls */}
        {loading ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              {/* Skeleton for View Toggle */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-16 rounded-full" />{" "}
                {/* Grid button */}
                <Skeleton className="h-8 w-16 rounded-full" />{" "}
                {/* List button */}
                <Skeleton className="h-8 w-16 rounded-full" />{" "}
                {/* Gantt button */}
              </div>

              {/* Skeleton for "Showing X of Y tasks" */}
              <Skeleton className="h-4 w-40 rounded-md" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="flex items-center bg-content2 rounded-full p-1">
                {(["grid", "list", "gantt"] as const).map((type) => (
                  <Button
                    key={type}
                    className="rounded-full px-3"
                    color={viewType === type ? "primary" : "default"}
                    size="sm"
                    startContent={
                      type === "grid" ? (
                        <Grid3X3 className="w-4 h-4" />
                      ) : type === "list" ? (
                        <List className="w-4 h-4" />
                      ) : (
                        <BarChart3 className="w-4 h-4" />
                      )
                    }
                    variant={viewType === type ? "solid" : "light"}
                    onPress={() => setViewType(type)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>

              <span className="text-sm text-foreground-600">
                {t("pagination.showing")} {tasks.length} {t("pagination.of")}{" "}
                {totalCount} {t("common.tasks")}
              </span>
            </div>
          </div>
        )}

        {/* Error */}
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

        {/* Tasks */}
        {loading ? (
          <TaskGridSkeleton />
        ) : tasks.length === 0 ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-default-100 rounded-full flex items-center justify-center">
                  <Grid3X3 className="w-10 h-10 text-default-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-default-700 mb-2">
                    {t("noTasksFound")}
                  </h3>
                  <p className="text-default-500 text-sm mb-4">
                    {t("adjustFiltersMessage")}
                  </p>
                </div>
                {hasActiveFilters && (
                  <Button
                    color="danger"
                    size="sm"
                    variant="flat"
                    onPress={resetAllFilters}
                  >
                    {t("requirements.clearFilters")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {viewType === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    isTeamManager={isTeamManager}
                    task={task}
                    onChangeAssignees={handleChangeAssignees}
                    onChangeStatus={handleChangeStatus}
                    onClick={handleTaskClick}
                    onRequestDesign={handleRequestDesign}
                  />
                ))}
              </div>
            )}
            {viewType === "list" && (
              <div className="mb-8">
                <TaskListView tasks={tasks} onTaskClick={handleTaskClick} />
              </div>
            )}
            {viewType === "gantt" && (
              <DHTMLXGantt tasks={tasks} onTaskClick={handleTaskClick} />
            )}

            {!loading && totalCount > taskParametersRequest.limit! && (
              <div className="flex justify-center py-6">
                <GlobalPagination
                  className="w-full max-w-md"
                  currentPage={taskParametersRequest.page!}
                  isLoading={loading}
                  pageSize={taskParametersRequest.limit!}
                  showInfo={false}
                  totalItems={totalCount}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
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
                    {isTeamManager ? (
                      <div className="flex gap-3">
                        <Button
                          className="flex-1"
                          color="default"
                          size="sm"
                          variant="solid"
                          onPress={() => handleChangeAssignees(selectedTask!)}
                        >
                          {t("changeAssignees")}
                        </Button>
                      </div>
                    ) : (
                      /* Member */
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
                          onPress={() => handleChangeStatus(selectedTask)}
                        >
                          {t("changeStatus")}
                        </Button>
                      </div>
                    )}
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

        {/* Change Assignees Modal */}
        <Modal
          isOpen={isChangeAssigneesModalOpened}
          size="2xl"
          onOpenChange={setIsChangeAssigneesModalOpened}
        >
          <ModalContent className="p-6 rounded-lg max-w-3xl h-[420px]">
            <ModalHeader className="flex flex-col items-center">
              {modalError && (
                <h4 className="font-medium" style={{ color: "#ef4444" }}>
                  {t("common.unexpectedError")}
                </h4>
              )}
              <h2 className="text-lg font-semibold">{t("changeAssignees")}</h2>
            </ModalHeader>

            {/* Body */}
            <div className="space-y-4">
              <Input readOnly value={selectedTask?.name ?? ""} />

              {/* Tags Display */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {selectedMembers.map((employee, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: "#e0e0e0",
                      padding: "5px 10px",
                      borderRadius: "20px",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <X
                        color="red"
                        size={24}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setSelectedMembers(
                            selectedMembers.filter(
                              (user) => user.id !== employee.id
                            )
                          );
                        }}
                      />
                      <div className="flex flex-col">
                        <span className="text-xs">
                          {employee.gradeName}{" "}
                          {employee.fullName || "Unknown User"}
                        </span>
                        <span className="text-xs text-default-400">
                          @{employee.department || "unknown"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <label>{t("users.selectEmployee")}</label>
              <Autocomplete
                isClearable
                defaultFilter={(textValue, input) => true}
                errorMessage="You must choose one at least"
                inputValue={employeeInputValue}
                isInvalid={assigneeModalError}
                isLoading={employeeSearchLoading}
                label={t("users.selectEmployee")}
                menuTrigger="input"
                placeholder={t("users.searchEmployees")}
                selectedKey={selectedEmployee?.id.toString()}
                onInputChange={(value) => {
                  setEmployeeInputValue(value);
                  if (
                    selectedEmployee &&
                    value !==
                      `${selectedEmployee.gradeName} ${selectedEmployee.fullName}`
                  ) {
                    setSelectedEmployee(null);
                  }
                  searchEmployees(value);
                  if (modalError) {
                    setModalError(false); // clear error on typing
                  }
                }}
                onSelectionChange={(key) => {
                  if (key) {
                    const selectedEmployee = employees.find(
                      (e) => e.id.toString() === key
                    );

                    if (selectedEmployee) {
                      handleEmployeeSelect(selectedEmployee);
                      setModalError(false); // clear error on selection
                    }
                  } else {
                    setSelectedEmployee(null);
                    setEmployeeInputValue("");
                  }
                }}
              >
                {employees.map((employee) => (
                  <AutocompleteItem
                    key={employee.id.toString()}
                    textValue={`${employee.gradeName} ${employee.fullName} ${employee.userName} ${employee.militaryNumber} ${employee.department}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={employee.fullName || "Unknown"} size="sm" />
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {employee.gradeName}{" "}
                          {employee.fullName || "Unknown User"}
                        </span>
                        <span className="text-sm text-default-500">
                          {employee.militaryNumber || "N/A"}
                        </span>
                        <span className="text-xs text-default-400">
                          @{employee.userName || "unknown"}
                        </span>
                        <span className="text-xs text-default-400">
                          @{employee.department || "unknown"}
                        </span>
                      </div>
                    </div>
                  </AutocompleteItem>
                ))}
              </Autocomplete>

              <Textarea
                placeholder={t("timeline.treeView.notes")}
                value={notes}
                onChange={(e: any) => setNotes(e.target.value)}
              />
            </div>
            {/* end Body */}

            <ModalFooter>
              <Button
                color="default"
                size="md"
                variant="flat"
                onPress={() => {
                  setIsChangeAssigneesModalOpened(false);
                  setModalError(false); // clear error here too
                }}
              >
                {t("cancel")}
              </Button>
              <Button
                color="primary"
                size="md"
                variant="flat"
                onPress={handleChangeAssigneesSubmit}
              >
                {t("confirm")}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Request Design Modal */}
        <Modal
          isOpen={isRequestDesignModalOpend}
          onOpenChange={setIsRequestDesignModalOpend}
        >
          <ModalContent className="p-6 rounded-lg max-w-md">
            <ModalHeader className="flex flex-col items-center">
              {modalError && (
                <h4 className="font-medium" style={{ color: "#ef4444" }}>
                  {t("common.unexpectedError")}
                </h4>
              )}
              <h2 className="text-lg font-semibold">{t("requestDesign")}</h2>
            </ModalHeader>
            <div className="space-y-4">
              <Input readOnly value={selectedTask?.name ?? ""} />
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

        {/*change status modal */}
        <Modal
          isOpen={isChangeStatusModalOpend}
          onOpenChange={setIsChangeStatusModalOpend}
        >
          <ModalContent className="p-6 rounded-lg max-w-md">
            <ModalHeader className="flex flex-col items-center">
              {modalError && (
                <h4 className="font-medium" style={{ color: "#ef4444" }}>
                  {t("common.unexpectedError")}
                </h4>
              )}
              <h2 className="text-lg font-semibold">{t("changeStatus")}</h2>
            </ModalHeader>

            <div className="space-y-4">
              {/* Task Name */}
              <Input readOnly value={selectedTask?.name ?? ""} />

              {/* Dropdown with TaskStatus */}
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    className="w-full justify-between"
                    endContent={<ChevronDown className="w-4 h-4" />}
                    variant="flat"
                  >
                    {selectedStatus ? selectedStatus.label : t("selectStatus")}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Select task status"
                  onAction={(key) => {
                    const status = tasksConfigData.taskStatus?.find(
                      (s) => s.id.toString() === key
                    );

                    if (status) setSelectedStatus(status);
                  }}
                >
                  {tasksConfigData.taskStatus?.map((status) => (
                    <DropdownItem key={status.id.toString()}>
                      {status.label}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>

              {/* Notes */}
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
                onPress={() => setIsChangeStatusModalOpend(false)} /// also clear erro here
              >
                {t("cancel")}
              </Button>
              <Button
                color="primary"
                //isDisabled={!selectedStatus}
                size="md"
                variant="flat"
                onPress={() => {
                  handleChangeStatusSubmit();
                }}
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
    </>
  );
}
