import type { CalendarDate } from "@internationalized/date";

import { parseDate } from "@internationalized/date";
import { useEffect, useRef, useState } from "react";
import React from "react";
import { Button } from "@heroui/button";
import { Search, ChevronDown, X, AlertTriangle } from "lucide-react";
import { Card, CardBody } from "@heroui/card";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Select, SelectItem } from "@heroui/select";
import { DatePicker } from "@heroui/date-picker";
import { RefreshCw, Grid3X3, List, BarChart3 } from "lucide-react";
import {
  Autocomplete,
  AutocompleteItem,
  Avatar,
  Checkbox,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Skeleton,
  Textarea,
} from "@heroui/react";
import { useLocation } from "react-router-dom";

import { TaskCard } from "@/components/members-tasks/TaskCard";
import { TaskListView } from "@/components/members-tasks/TaskListView";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { TaskGridSkeleton } from "@/components/members-tasks/TaskGridSkeleton";
import { useMembersTasks } from "@/hooks/useMembersTasks";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePriorityLookups } from "@/hooks/usePriorityLookups";
import { useTaskStatusLookups } from "@/hooks/useTaskLookups";
import { MemberTask, TaskStatus } from "@/types/membersTasks";
import { ProjectRequirement } from "@/types/projectRequirement";
import GlobalPagination from "@/components/GlobalPagination";
import AddAdhocTask from "@/components/AddAdhocTask";
import { PAGE_SIZE_OPTIONS, normalizePageSize } from "@/constants/pagination";
import DHTMLXGantt from "@/components/timeline/GanttChart/dhtmlx/DhtmlxGantt";
import { usePermissions } from "@/hooks/usePermissions";
import useTeamSearch from "@/hooks/useTeamSearch";
import { MemberSearchResult } from "@/types/timeline";
import { membersTasksService } from "@/services/api/membersTasksService";
import { tasksService } from "@/services/api/tasksService";
import { getFileUploadConfig } from "@/config/environment";
import {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
} from "@/utils/toast";
import { useFilePreview } from "@/hooks/useFilePreview";
import { FilePreview } from "@/components/FilePreview";
import { projectRequirementsService } from "@/services/api";
import { RoleIds } from "@/constants/roles";
import { isTransitionAllowed } from "@/utils/kanbanRoleConfig";
import TaskDetailsDrawer from "@/components/TaskDetailsDrawer";

export default function MembersTasksPage() {
  const { t, language } = useLanguage();
  const location = useLocation();

  // Global priority lookups
  const { getPriorityColor, getPriorityLabel, priorityOptions } =
    usePriorityLookups();

  // TaskStatus hook for dynamic status management
  const { statusOptions, getStatusLabel } = useTaskStatusLookups();

  // Get all projects directly for the dropdown
  const [projects, setProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Team members for assignee filtering
  const { teamMembers, loading: teamMembersLoading } = useTeamMembers();

  // Load all projects when component initializes
  useEffect(() => {
    const loadProjects = async () => {
      setProjectsLoading(true);
      try {
        const result = await projectRequirementsService.getAllProjects({
          limit: 100, // Get a reasonable number of projects
        });

        setProjects(result.data || []);
      } catch (error) {
        console.error("Failed to load projects", error);
      } finally {
        setProjectsLoading(false);
      }
    };

    loadProjects();
  }, []);

  const [selectedTask, setSelectedTask] = useState<MemberTask | null>(null);
  const [viewType, setViewType] = useState<"grid" | "list" | "gantt">("grid");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isOptionOpen, setIsOptionOpen] = useState(false);
  const { hasAnyRoleById, loading: userLoading, user } = usePermissions();

  // Add state for full requirement details
  const [fullRequirement, setFullRequirement] =
    useState<ProjectRequirement | null>(null);
  const [loadingRequirement, setLoadingRequirement] = useState(false);

  // File preview hook
  const { previewState, previewFile, closePreview, downloadCurrentFile } =
    useFilePreview({
      downloadFunction: (requirementId, attachmentId, filename) =>
        projectRequirementsService
          .downloadAttachment(requirementId, attachmentId)
          .then((blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");

            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }),
    });

  // File handling functions
  const handleFilePreview = async (attachment: any) => {
    if (
      fullRequirement &&
      attachment?.originalName &&
      typeof attachment.originalName === "string"
    ) {
      await previewFile(
        attachment.originalName,
        attachment.url,
        attachment.size,
      );
    }
  };

  const handleFileDownload = async (attachment: any) => {
    if (fullRequirement) {
      try {
        const blob = await projectRequirementsService.downloadAttachment(
          fullRequirement.id,
          attachment.id,
        );
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = attachment.originalName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error("Download failed:", error);
      }
    }
  };

  // Task attachment handlers
  const handleTaskFilePreview = async (attachment: any) => {
    try {
      const blob = await membersTasksService.downloadTaskAttachment(
        attachment.id,
      );
      const url = window.URL.createObjectURL(blob);

      await previewFile(attachment.originalName, url, attachment.fileSize);
    } catch (error) {
      console.error("Task attachment preview failed:", error);
    }
  };

  const handleTaskFileDownload = async (attachment: any) => {
    try {
      const blob = await membersTasksService.downloadTaskAttachment(
        attachment.id,
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = attachment.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Task attachment download failed:", error);
    }
  };

  const handleTaskFileUpload = async (taskId: number, files: File[]) => {
    // Get file upload configuration
    const { maxFileSizeMB, allowedFileTypes } = getFileUploadConfig();

    debugger;
    const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024; // Convert MB to bytes

    // Arrays to collect rejected files by type
    const emptyFiles: string[] = [];
    const oversizedFiles: string[] = [];
    const invalidTypeFiles: string[] = [];

    const validFiles = files.filter((file) => {
      // Check for empty files (0 bytes)
      if (file.size === 0) {
        emptyFiles.push(file.name);
        console.warn(
          `File "${file.name}" has no size (0 bytes) and will be skipped`,
        );

        return false;
      }

      // Check file size
      if (file.size > maxFileSizeBytes) {
        oversizedFiles.push(file.name);
        console.warn(
          `File "${file.name}" exceeds maximum size limit of ${maxFileSizeMB}MB`,
        );

        return false;
      }

      // Check file type
      const fileExtension = file.name.split(".").pop()?.toLowerCase();

      if (!fileExtension || !allowedFileTypes.includes(fileExtension)) {
        invalidTypeFiles.push(file.name);
        console.warn(
          `File "${file.name}" has invalid type. Allowed types: ${allowedFileTypes.join(", ")}`,
        );

        return false;
      }

      return true;
    });

    // Show toast notifications for rejected files
    const allRejectedFiles = [
      ...emptyFiles,
      ...oversizedFiles,
      ...invalidTypeFiles,
    ];

    if (allRejectedFiles.length > 0) {
      // Handle empty files
      if (emptyFiles.length > 0) {
        const fileList = emptyFiles.join(", ");
        const message =
          emptyFiles.length === 1
            ? `${fileList}`
            : `${emptyFiles.length} ${t("requirements.validation.filesEmptyError")}: ${fileList}`;

        showWarningToast(t("requirements.validation.fileEmptyError"), message);
      }

      // Handle oversized files
      if (oversizedFiles.length > 0) {
        const fileList = oversizedFiles.join(", ");

        showWarningToast(
          t("requirements.validation.filesSizeTooLarge"),
          fileList,
        );
      }

      // Handle invalid type files
      if (invalidTypeFiles.length > 0) {
        const fileList = invalidTypeFiles.join(", ");
        const allowedTypesStr = allowedFileTypes.join(", ");

        showWarningToast(
          t("requirements.validation.fileTypeNotAllowed")
            .replace("{0}", invalidTypeFiles[0])
            .replace("{1}", allowedTypesStr),
          fileList,
        );
      }

      // Don't upload any files if there are validation errors
      if (validFiles.length === 0) {
        return;
      }
    }

    // Upload valid files
    for (const file of validFiles) {
      try {
        const result = await membersTasksService.uploadTaskAttachment(
          taskId,
          file,
        );

        if (result.success) {
          showSuccessToast(t("requirements.uploadSuccess"));
        } else {
          showErrorToast(t("requirements.uploadError"));
        }
      } catch (error) {
        console.error("Upload failed:", error);
        showErrorToast(t("requirements.uploadError"));
      }
    }
  };

  const handleTaskFileDelete = async (attachment: any) => {
    const confirmMessage = t("taskDetails.confirmDeleteAttachment").replace(
      "{fileName}",
      attachment.originalName,
    );
    const confirmed = window.confirm(confirmMessage);

    if (!confirmed) return;

    try {
      const result = await membersTasksService.deleteTaskAttachment(
        attachment.id,
      );

      if (result.success) {
        showSuccessToast(t("taskDetails.attachmentDeleted"));
        // Refresh the task details to update the attachments list
        if (selectedTask) {
          // Trigger a refresh of the task details drawer
          setIsDrawerOpen(false);
          setTimeout(() => setIsDrawerOpen(true), 100);
        }
      } else {
        showErrorToast(t("taskDetails.attachmentDeleteError"));
      }
    } catch (error) {
      console.error("Attachment deletion failed:", error);
      showErrorToast(t("taskDetails.attachmentDeleteError"));
    }
  };

  const {
    tasks,
    loading,
    initialLoading,
    changeStatusLoading,
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
    handleAssigneeChange,
    handleTypeChange,
    handleResetFilters,
    taskParametersRequest,
    refreshTasks,
    exportTasks,
    changeStatus,
    requestDesign,
    changeAssignees,
  } = useMembersTasks();

  const topAnchorRef = useRef<HTMLDivElement | null>(null);

  // Handle navigation state for assignee filtering (from developer dashboard)
  const [shouldScrollToTop, setShouldScrollToTop] = useState(false);

  useEffect(() => {
    const state = location.state as {
      assigneeId?: number;
      assigneeName?: string;
    };

    if (state?.assigneeId) {
      // Set the assignee filter to the developer that was clicked
      handleAssigneeChange([state.assigneeId]);
      // Mark that we should scroll to top after tasks load
      setShouldScrollToTop(true);
    }
  }, [location.state, handleAssigneeChange]);

  // Scroll to top when tasks finish loading after assignee filter change
  useEffect(() => {
    if (shouldScrollToTop && !loading && !initialLoading) {
      topAnchorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setShouldScrollToTop(false);
    }
  }, [shouldScrollToTop, loading, initialLoading]);

  const [isRequestDesignModalOpend, setIsRequestDesignModalOpend] =
    useState(false);
  const [isRequestDesignConfirmModalOpen, setIsRequestDesignConfirmModalOpen] =
    useState(false);
  const [isChangeAssigneesModalOpened, setIsChangeAssigneesModalOpened] =
    useState(false);
  const [isChangeStatusModalOpend, setIsChangeStatusModalOpend] =
    useState(false);
  const [notes, setNotes] = useState("");
  const [modalError, setModalError] = useState(false);
  const [assigneeModalError, setAssigneeModalError] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(null);

  // Design request confirmation modal states (same as Kanban)
  const [isDesignRequestConfirmModalOpen, setIsDesignRequestConfirmModalOpen] =
    useState(false);
  const [designRequestInfo, setDesignRequestInfo] = useState<{
    hasDesignRequest: boolean;
    hasDesignerTask: boolean;
    designerTaskId: number | null;
  } | null>(null);
  const [completedWithoutDesigner, setCompletedWithoutDesigner] =
    useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    taskId: string;
    newStatusId: number;
    notes: string;
  } | null>(null);

  const [selectedMembers, setSelectedMembers] = useState<MemberSearchResult[]>(
    [],
  );
  const [employeeInputValue, setEmployeeInputValue] = useState<string>("");
  // State for selected members
  const [selectedEmployee, setSelectedEmployee] =
    useState<MemberSearchResult | null>(null);

  // State for task dates using CalendarDate
  const [taskStartDate, setTaskStartDate] = useState<CalendarDate | null>(null);
  const [taskEndDate, setTaskEndDate] = useState<CalendarDate | null>(null);

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
    10,
  );

  // Search and filter states (local)
  const [searchTerm, setSearchTerm] = useState(
    taskParametersRequest?.search ?? "",
  );

  const [searchValue, setSearchValue] = useState(
    taskParametersRequest?.search ?? "",
  );

  // Update search when searchTerm changes
  useEffect(() => {
    handleSearchChange(searchTerm);
  }, [searchTerm, handleSearchChange]);

  const isTeamManager = hasAnyRoleById([
    RoleIds.ANALYST_DEPARTMENT_MANAGER,
    RoleIds.ADMINISTRATOR,
    RoleIds.QUALITY_CONTROL_MANAGER,
    RoleIds.DESIGNER_MANAGER,
    RoleIds.DEVELOPMENT_MANAGER,
  ]);

  // Get user role IDs for kanban permissions
  const userRoleIds = user?.roles?.map((role) => role.id) || [];

  // Filter status options based on role permissions for the current task
  const filteredStatusOptions = React.useMemo(() => {
    if (!selectedTask || !statusOptions) return statusOptions || [];

    const currentStatusId = selectedTask.statusId;

    return statusOptions.filter((status) => {
      const targetStatusId = parseInt(status.key);

      // Allow the current status to always be shown
      if (targetStatusId === currentStatusId) return true;

      // Check if transition is allowed based on user roles
      return isTransitionAllowed(userRoleIds, currentStatusId, targetStatusId);
    });
  }, [selectedTask, statusOptions, userRoleIds]);

  const handleChangeAssigneesSubmit = async () => {
    if (typeof changeAssignees === "function") {
      if (selectedMembers.length === 0) {
        setAssigneeModalError(true);

        return;
      } else {
        // Convert CalendarDate to ISO string format (YYYY-MM-DD)
        const startDateString = taskStartDate
          ? taskStartDate.toString()
          : undefined;
        const endDateString = taskEndDate ? taskEndDate.toString() : undefined;

        const success = await changeAssignees(
          selectedTask?.id ?? "0",
          selectedMembers.map((member) => member.id.toString()),
          notes ?? "",
          startDateString,
          endDateString,
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

  const handleRequestDesignSubmit = () => {
    // Close the first modal and open the confirmation modal
    setIsRequestDesignModalOpend(false);
    setIsRequestDesignConfirmModalOpen(true);
  };

  const handleRequestDesignConfirm = async () => {
    const success = await requestDesign(selectedTask?.id ?? "0", notes ?? "");

    if (success) {
      setIsRequestDesignConfirmModalOpen(false);
      setNotes("");
      // Refresh the task list to get updated hasDesignRequest status
      handleRefresh();
    } else {
      setModalError(true);
    }
  };

  // Handler for design request confirmation modal (same as Kanban)
  const handleConfirmDesignRequestAction = async () => {
    if (!pendingStatusChange) return;

    try {
      // Call the complete-from-developer API
      const result = await tasksService.completeFromDeveloper(
        parseInt(pendingStatusChange.taskId),
        completedWithoutDesigner,
      );

      if (result.success) {
        // Show success message
        if (completedWithoutDesigner) {
          showSuccessToast(t("teamDashboard.kanban.designerTaskCompleted"));
        } else {
          showSuccessToast(t("teamDashboard.kanban.designRequestDeleted"));
        }

        // Execute the status change
        const success = await changeStatus(
          pendingStatusChange.taskId,
          `${pendingStatusChange.newStatusId}`,
          pendingStatusChange.notes,
        );

        if (success) {
          // Close modal and refresh
          setIsDesignRequestConfirmModalOpen(false);
          setPendingStatusChange(null);
          setDesignRequestInfo(null);
          setCompletedWithoutDesigner(false);
          setNotes("");
          handleRefresh();
        } else {
          setModalError(true);
        }
      } else {
        showErrorToast(t("teamDashboard.kanban.actionFailed"));
      }
    } catch (error) {
      console.error("Error confirming design request action:", error);
      showErrorToast(t("teamDashboard.kanban.actionFailed"));
    }
  };

  const handleChangeStatusSubmit = async () => {
    if (!selectedTask || !selectedStatus) return;

    const newStatusId = selectedStatus.id;
    const currentStatusId = selectedTask.statusId;

    // Check if moving to "In Review" status from "To Do" or "In Progress"
    if (
      newStatusId === 3 &&
      (currentStatusId === 1 || currentStatusId === 2)
    ) {
      try {
        // Check if task has a design request
        const designCheckResult =
          await tasksService.checkDesignRequest(parseInt(selectedTask.id));

        if (designCheckResult.success && designCheckResult.data) {
          setDesignRequestInfo(designCheckResult.data);

          // If there's a design request, show confirmation modal
          if (designCheckResult.data.hasDesignRequest) {
            // Store the pending status change
            setPendingStatusChange({
              taskId: selectedTask.id.toString(),
              newStatusId: newStatusId,
              notes: notes ?? "",
            });

            // Close the status change modal
            setIsChangeStatusModalOpend(false);

            // Open the design request confirmation modal
            setIsDesignRequestConfirmModalOpen(true);

            return; // Don't proceed with status change yet
          }
        }
      } catch (error) {
        console.error("Error checking design request:", error);
        // Continue with normal status change if check fails
      }
    }

    // Normal status change (no design request check needed or passed)
    const success = await changeStatus(
      selectedTask?.id ?? "0",
      `${newStatusId}`,
      notes ?? "",
    );

    if (success) {
      setIsChangeStatusModalOpend(false);
      setNotes("");
      handleRefresh();
    } else {
      setModalError(true);
    }
  };

  const handleTaskClick = async (task: MemberTask) => {
    console.log("MembersTasksPage: Task clicked:", task.id, task.name);

    // Set the selected task immediately
    setSelectedTask(task);

    // Fetch full requirement details if available
    if (task.requirement?.id) {
      setLoadingRequirement(true);
      try {
        // Get the full requirement details by ID
        const requirement = await projectRequirementsService.getRequirement(
          parseInt(task.requirement.id),
        );

        setFullRequirement(requirement);
      } catch (error) {
        console.error("Failed to fetch requirement details:", error);
        setFullRequirement(null);
      } finally {
        setLoadingRequirement(false);
      }
    } else {
      setFullRequirement(null);
    }

    // Open drawer immediately rather than using setTimeout
    setIsDrawerOpen(true);

    console.log(
      "MembersTasksPage: Drawer state set to open for task:",
      task.id,
    );
  };

  const handleChangeAssignees = (task: MemberTask) => {
    // Implement the logic to change assignees here
    if (isDrawerOpen) setIsDrawerOpen(false);
    setSelectedTask(task);
    setIsChangeAssigneesModalOpened(true);
    // Parse dates using parseDate from @internationalized/date
    setTaskStartDate(
      task.startDate ? parseDate(task.startDate.split("T")[0]) : null,
    );
    setTaskEndDate(task.endDate ? parseDate(task.endDate.split("T")[0]) : null);
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
      id: task.statusId,
      label: getStatusText(task.statusId),
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
    // Only allow one selection - replace any existing selection
    setSelectedMembers([employee]);
    setEmployeeInputValue("");
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
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, handleSearchChange, taskParametersRequest]);

  // Reset all filters
  const resetAllFilters = () => {
    setSearchTerm("");
    handleResetFilters();
  };

  // Check if any filters are active
  const hasActiveFilters =
    searchTerm ||
    taskParametersRequest.statusId !== undefined ||
    taskParametersRequest.priorityId !== undefined ||
    taskParametersRequest.projectId !== undefined ||
    taskParametersRequest.typeId !== undefined ||
    (taskParametersRequest.memberIds &&
      taskParametersRequest.memberIds.length > 0);

  const handleRefresh = () => refreshTasks();

  // Helper function to get status color using TaskStatus lookup
  const getTaskStatusColor = (
    status: number,
  ): "success" | "primary" | "warning" | "danger" | "default" | "secondary" => {
    switch (status) {
      case 1: // To Do
        return "default";
      case 2: // In Progress
        return "primary";
      case 3: // In Review
        return "warning";
      case 4: // Rework
        return "danger";
      case 5: // Completed
        return "success";
      case 6: // On Hold
        return "secondary";
      default:
        return "default";
    }
  };

  // Helper function to get status text using TaskStatus lookup
  const getStatusText = (status: number) => {
    return getStatusLabel(status.toString());
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

  return (
    <>
      <div ref={topAnchorRef} className="w-full max-w-full">
        {/* Header */}
        <div className="pb-4 mb-6 border-b border-divider">
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
              {/* Add Adhoc Task Button */}
              {hasAnyRoleById([
                RoleIds.ANALYST_DEPARTMENT_MANAGER,
                RoleIds.DEVELOPMENT_MANAGER,
                RoleIds.QUALITY_CONTROL_MANAGER,
                RoleIds.DESIGNER_MANAGER,
                RoleIds.ADMINISTRATOR,
              ]) && <AddAdhocTask onSuccess={handleRefresh} />}

              {/* Refresh Button */}
              <Button
                isLoading={loading}
                startContent={<RefreshCw className="w-4 h-4" />}
                variant="flat"
                onPress={handleRefresh}
              />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          {/* Search and Filter Controls - All in one responsive row */}
          <div className="flex flex-col lg:flex-row gap-3 w-full">
            {/* Search Input */}
            <div className="flex-1 min-w-[200px] max-w-full lg:max-w-md">
              <Input
                className="w-full"
                placeholder={t("requirements.searchRequirements")}
                startContent={<Search className="w-5 h-5" />}
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
            </div>

            {/* Project Filter */}
            <div className="flex-1 min-w-[180px]">
              <Select
                className="w-full"
                isLoading={projectsLoading}
                items={[
                  { value: "", label: t("taskPlan.allProjects") },
                  ...(projects?.map((p) => ({
                    value: String(p.id),
                    label: p.applicationName,
                  })) || []),
                ]}
                placeholder={t("taskPlan.filterByProject")}
                selectedKeys={
                  taskParametersRequest.projectId
                    ? [String(taskParametersRequest.projectId)]
                    : []
                }
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0] as string;

                  handleProjectChange(val ? Number(val) : 0);
                }}
              >
                {(item) => (
                  <SelectItem key={item.value}>{item.label}</SelectItem>
                )}
              </Select>
            </div>

            {/* Assignee Filter */}
            <div className="flex-1 min-w-[180px]">
              <Autocomplete
                className="w-full"
                defaultItems={teamMembers}
                isLoading={teamMembersLoading}
                placeholder={t("tasks.filterByAssignees")}
                selectedKey={
                  taskParametersRequest.memberIds &&
                  taskParametersRequest.memberIds.length > 0
                    ? taskParametersRequest.memberIds[0].toString()
                    : ""
                }
                onSelectionChange={(key) => {
                  const selectedMemberId = key
                    ? parseInt(key.toString())
                    : null;

                  if (selectedMemberId) {
                    handleAssigneeChange([selectedMemberId]);
                  } else {
                    handleAssigneeChange([]);
                  }
                }}
              >
                {(member) => (
                  <AutocompleteItem
                    key={member.id.toString()}
                    textValue={`${member.gradeName} ${member.fullName}`}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar name={member.fullName} size="sm" />
                      <div className="flex flex-col">
                        <span className="text-small font-medium">
                          {member.gradeName} {member.fullName}
                        </span>
                        <span className="text-tiny text-default-400">
                          {member.militaryNumber}
                        </span>
                      </div>
                    </div>
                  </AutocompleteItem>
                )}
              </Autocomplete>
            </div>

            {/* Status Filter */}
            <div className="flex-1 min-w-[180px]">
              <Select
                className="w-full"
                items={[
                  { value: "", label: t("requirements.allStatuses") },
                  ...statusOptions.map((status) => ({
                    value: status.key,
                    label: status.label,
                  })),
                ]}
                placeholder={t("requirements.filterByStatus")}
                selectedKeys={
                  taskParametersRequest.statusId
                    ? [taskParametersRequest.statusId.toString()]
                    : []
                }
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  const newStatusFilter =
                    selectedKey && selectedKey !== ""
                      ? parseInt(selectedKey)
                      : null;

                  if (newStatusFilter !== null) {
                    handleStatusChange(newStatusFilter);
                  } else {
                    const hasOtherFilters =
                      searchTerm ||
                      taskParametersRequest.priorityId ||
                      taskParametersRequest.projectId ||
                      (taskParametersRequest.memberIds &&
                        taskParametersRequest.memberIds.length > 0);

                    if (hasOtherFilters) {
                      fetchTasks();
                    } else {
                      handleResetFilters();
                    }
                  }
                }}
              >
                {(item) => (
                  <SelectItem key={item.value}>{item.label}</SelectItem>
                )}
              </Select>
            </div>

            {/* Priority Filter */}
            <div className="flex-1 min-w-[180px]">
              <Select
                className="w-full"
                items={[
                  { value: "", label: t("requirements.allPriorities") },
                  ...priorityOptions.map((p) => ({
                    value: p.value.toString(),
                    label: language === "ar" ? p.labelAr : p.label,
                  })),
                ]}
                placeholder={t("requirements.filterByPriority")}
                selectedKeys={
                  taskParametersRequest.priorityId
                    ? [taskParametersRequest.priorityId.toString()]
                    : []
                }
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  const newPriorityFilter =
                    selectedKey && selectedKey !== ""
                      ? parseInt(selectedKey)
                      : null;

                  if (newPriorityFilter !== null) {
                    handlePriorityChange(newPriorityFilter);
                  } else {
                    const hasOtherFilters =
                      searchTerm ||
                      taskParametersRequest.statusId ||
                      taskParametersRequest.projectId ||
                      (taskParametersRequest.memberIds &&
                        taskParametersRequest.memberIds.length > 0);

                    if (hasOtherFilters) {
                      fetchTasks();
                    } else {
                      handleResetFilters();
                    }
                  }
                }}
              >
                {(item) => (
                  <SelectItem key={item.value}>{item.label}</SelectItem>
                )}
              </Select>
            </div>

            {/* Type Filter */}
            <div className="flex-1 min-w-[180px]">
              <Select
                className="w-full"
                items={[
                  { value: "", label: t("tasks.allTypes") },
                  { value: "1", label: t("tasks.type.timeline") },
                  { value: "2", label: t("tasks.type.changeRequest") },
                  { value: "3", label: t("tasks.type.adhoc") },
                ]}
                placeholder={t("tasks.filterByType")}
                selectedKeys={
                  taskParametersRequest.typeId
                    ? [taskParametersRequest.typeId.toString()]
                    : []
                }
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  const newTypeFilter =
                    selectedKey && selectedKey !== ""
                      ? parseInt(selectedKey)
                      : null;

                  if (newTypeFilter !== null) {
                    handleTypeChange(newTypeFilter);
                  } else {
                    const hasOtherFilters =
                      searchTerm ||
                      taskParametersRequest.statusId ||
                      taskParametersRequest.priorityId ||
                      taskParametersRequest.projectId ||
                      (taskParametersRequest.memberIds &&
                        taskParametersRequest.memberIds.length > 0);

                    if (hasOtherFilters) {
                      fetchTasks();
                    } else {
                      handleResetFilters();
                    }
                  }
                }}
              >
                {(item) => (
                  <SelectItem key={item.value}>{item.label}</SelectItem>
                )}
              </Select>
            </div>
          </div>

          {/* Active Filters display row - Count, Clear button, and chips all on same line */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  className="bg-purple-100 text-purple-700 hover:bg-purple-200"
                  endContent={<X className="ml-1" size={16} />}
                  size="sm"
                  onPress={resetAllFilters}
                >
                  {t("requirements.clearFilters")}
                </Button>
                <span className="text-sm text-default-600">
                  {t("tasks.tasksFound").replace(
                    "{count}",
                    totalCount.toString(),
                  )}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-default-600">
                {searchTerm && (
                  <Chip color="primary" size="sm" variant="flat">
                    {t("common.search")}: &quot;{searchTerm}&quot;
                  </Chip>
                )}
                {taskParametersRequest.projectId && projects && (
                  <Chip color="secondary" size="sm" variant="flat">
                    {t("project")}:{" "}
                    {
                      projects.find(
                        (p) => p.id === taskParametersRequest.projectId,
                      )?.applicationName
                    }
                  </Chip>
                )}
                {taskParametersRequest.statusId && (
                  <Chip color="warning" size="sm" variant="flat">
                    {t("status")}:{" "}
                    {
                      statusOptions.find(
                        (s) =>
                          s.key === taskParametersRequest.statusId!.toString(),
                      )?.label
                    }
                  </Chip>
                )}
                {taskParametersRequest.priorityId && (
                  <Chip color="danger" size="sm" variant="flat">
                    {t("requirements.priority")}:{" "}
                    {
                      priorityOptions.find(
                        (p) => p.value === taskParametersRequest.priorityId,
                      )?.label
                    }
                  </Chip>
                )}
                {taskParametersRequest.memberIds &&
                  taskParametersRequest.memberIds.length > 0 &&
                  teamMembers && (
                    <Chip color="success" size="sm" variant="flat">
                      {t("common.assignee")}:{" "}
                      {
                        teamMembers.find(
                          (m) => m.id === taskParametersRequest.memberIds![0],
                        )?.fullName
                      }
                    </Chip>
                  )}
                {taskParametersRequest.typeId && (
                  <Chip color="default" size="sm" variant="flat">
                    {t("common.type")}:{" "}
                    {taskParametersRequest.typeId === 1
                      ? t("tasks.type.timeline")
                      : taskParametersRequest.typeId === 2
                        ? t("tasks.type.changeRequest")
                        : t("tasks.type.adhoc")}
                  </Chip>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pagination Controls - Moved below tabs */}

        {/* Controls */}
        {loading ? (
          <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
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
          <div className="w-full flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
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
                {t("pagination.showing")} {tasks?.length || 0}{" "}
                {t("pagination.of")} {totalCount} {t("common.tasks")}
              </span>
            </div>

            {/* Page Size Selector - Now on same line as tabs */}
            {!initialLoading && (tasks?.length || 0) > 0 && (
              <div className="flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
                <span className="text-sm text-default-600">
                  {t("common.show")}
                </span>
                <Select
                  aria-label={t("pagination.itemsPerPage")}
                  className="w-20"
                  disallowEmptySelection={true}
                  isOpen={isOptionOpen}
                  selectedKeys={[
                    normalizePageSize(effectivePageSize, 10).toString(),
                  ]}
                  size="sm"
                  onOpenChange={setIsOptionOpen}
                  onSelectionChange={(keys) => {
                    const newSize = parseInt(Array.from(keys)[0] as string);

                    handlePageSizeChange(newSize);
                  }}
                >
                  {PAGE_SIZE_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.toString()}
                      textValue={opt.toString()}
                      onPress={() => {
                        setIsOptionOpen(false); // Force close when any item is clicked
                      }}
                    >
                      {opt}
                    </SelectItem>
                  ))}
                </Select>
                <span className="text-sm text-default-600">
                  {t("pagination.perPage")}
                </span>
              </div>
            )}
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
        ) : (tasks?.length || 0) === 0 ? (
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
                    getPriorityColor={getPriorityColor}
                    getPriorityLabel={getPriorityLabel}
                    getStatusColor={getTaskStatusColor}
                    getStatusText={getStatusText}
                    isTeamManager={isTeamManager}
                    task={task}
                    onChangeAssignees={handleChangeAssignees}
                    onChangeStatus={handleChangeStatus}
                    onClick={handleTaskClick}
                    onRequestDesign={handleRequestDesign}
                    onTaskComplete={handleRefresh}
                    onTaskCreated={handleRefresh}
                  />
                ))}
              </div>
            )}
            {viewType === "list" && (
              <div className="mb-8">
                <TaskListView
                  getPriorityColor={getPriorityColor}
                  getPriorityLabel={getPriorityLabel}
                  getStatusColor={getTaskStatusColor}
                  getStatusText={getStatusText}
                  tasks={tasks}
                  onTaskClick={handleTaskClick}
                />
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

        {/* Task Details Drawer */}
        <TaskDetailsDrawer
          fullRequirement={fullRequirement}
          getPriorityColor={getPriorityColor}
          getPriorityLabel={getPriorityLabel}
          getStatusText={getStatusText}
          getTaskStatusColor={getTaskStatusColor}
          isOpen={isDrawerOpen}
          loadingRequirement={loadingRequirement}
          selectedTask={selectedTask}
          onChangeAssignees={handleChangeAssignees}
          onChangeStatus={handleChangeStatus}
          onFileDelete={handleTaskFileDelete}
          onFileDownload={handleTaskFileDownload}
          onFilePreview={handleTaskFilePreview}
          onFileUpload={handleTaskFileUpload}
          onOpenChange={setIsDrawerOpen}
          onRequestDesign={handleRequestDesign}
        />

        {/* Change Assignees Modal */}
        <Modal
          isOpen={isChangeAssigneesModalOpened}
          scrollBehavior="inside"
          size="2xl"
          onOpenChange={setIsChangeAssigneesModalOpened}
        >
          <ModalContent>
            {(_onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  {t("changeAssignees")}
                  {modalError && (
                    <p className="text-sm text-danger font-normal">
                      {t("common.unexpectedError")}
                    </p>
                  )}
                </ModalHeader>

                <ModalBody>
                  <div className="space-y-4">
                    {/* Task Name */}
                    <Input
                      readOnly
                      label={t("tasks.taskName")}
                      value={selectedTask?.name ?? ""}
                    />

                    {/* Current Assignees Display */}
                    {selectedTask?.assignedMembers &&
                      selectedTask.assignedMembers.length > 0 && (
                        <div className="space-y-2 p-3 bg-default-50 rounded-lg border border-default-200">
                          <span className="text-sm font-medium text-default-700">
                            {t("tasks.currentAssignees")}:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {selectedTask.assignedMembers.map((assignee) => (
                              <Chip
                                key={assignee.id}
                                color="primary"
                                variant="flat"
                              >
                                {assignee.gradeName} {assignee.fullName || ""}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Selected New Assignee Display */}
                    {selectedMembers.length > 0 && (
                      <div className="space-y-2 p-3 bg-primary-50 dark:bg-primary-100/10 rounded-lg border border-primary-200">
                        <Chip
                          color="primary"
                          variant="flat"
                          onClose={() => setSelectedMembers([])}
                        >
                          {selectedMembers[0].gradeName}{" "}
                          {selectedMembers[0].fullName || ""}
                        </Chip>
                      </div>
                    )}

                    {/* Add Assignee */}
                    <Autocomplete
                      isClearable
                      defaultFilter={(_textValue, _input) => true}
                      errorMessage={
                        assigneeModalError ? t("users.selectAtLeastOne") : ""
                      }
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
                        if (assigneeModalError) {
                          setAssigneeModalError(false);
                        }
                      }}
                      onSelectionChange={(key) => {
                        if (key) {
                          const selectedEmployee = employees.find(
                            (e) => e.id.toString() === key,
                          );

                          if (selectedEmployee) {
                            handleEmployeeSelect(selectedEmployee);
                            setAssigneeModalError(false);
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
                            <Avatar name={employee.fullName || ""} size="sm" />
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {employee.gradeName} {employee.fullName || ""}
                              </span>
                              <span className="text-sm text-default-500">
                                {employee.militaryNumber || ""}
                              </span>
                              <span className="text-xs text-default-400">
                                @{employee.userName || ""}
                              </span>
                              <span className="text-xs text-default-400">
                                @{employee.department || ""}
                              </span>
                            </div>
                          </div>
                        </AutocompleteItem>
                      ))}
                    </Autocomplete>

                    {/* Start Date and End Date in one row */}
                    <div className="grid grid-cols-2 gap-4">
                      <DatePicker
                        label={t("tasks.startDate")}
                        value={taskStartDate}
                        onChange={(date) => setTaskStartDate(date)}
                      />

                      <DatePicker
                        label={t("tasks.endDate")}
                        value={taskEndDate}
                        onChange={(date) => setTaskEndDate(date)}
                      />
                    </div>

                    {/* Notes */}
                    <Textarea
                      label={t("timeline.treeView.notes")}
                      placeholder={t("timeline.treeView.notes")}
                      value={notes}
                      onChange={(e: any) => setNotes(e.target.value)}
                    />
                  </div>
                </ModalBody>

                <ModalFooter>
                  <Button
                    color="danger"
                    variant="light"
                    onPress={() => {
                      setIsChangeAssigneesModalOpened(false);
                      setModalError(false);
                      setAssigneeModalError(false);
                    }}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    color="primary"
                    isLoading={changeStatusLoading}
                    onPress={handleChangeAssigneesSubmit}
                  >
                    {t("confirm")}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Request Design Modal */}
        <Modal
          isOpen={isRequestDesignModalOpend}
          scrollBehavior="inside"
          size="md"
          onOpenChange={setIsRequestDesignModalOpend}
        >
          <ModalContent>
            {(_onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  {t("requestDesign")}
                  {modalError && (
                    <p className="text-sm text-danger font-normal">
                      {t("common.unexpectedError")}
                    </p>
                  )}
                </ModalHeader>

                <ModalBody>
                  <div className="space-y-4">
                    <Input
                      readOnly
                      label={t("tasks.taskName")}
                      value={selectedTask?.name ?? ""}
                    />

                    <Textarea
                      label={t("timeline.treeView.notes")}
                      placeholder={t("timeline.treeView.notes")}
                      value={notes}
                      onChange={(e: any) => setNotes(e.target.value)}
                    />
                  </div>
                </ModalBody>

                <ModalFooter>
                  <Button
                    color="danger"
                    variant="light"
                    onPress={() => {
                      setIsRequestDesignModalOpend(false);
                      setModalError(false);
                    }}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    color="primary"
                    disabled={selectedTask?.hasDesignRequest}
                    onPress={handleRequestDesignSubmit}
                  >
                    {t("confirm")}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Request Design Confirmation Modal */}
        <Modal
          isOpen={isRequestDesignConfirmModalOpen}
          scrollBehavior="inside"
          size="md"
          onOpenChange={setIsRequestDesignConfirmModalOpen}
        >
          <ModalContent>
            {(_onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  {t("requestDesign")} - {t("confirm")}
                  {modalError && (
                    <p className="text-sm text-danger font-normal">
                      {t("common.unexpectedError")}
                    </p>
                  )}
                </ModalHeader>

                <ModalBody>
                  <div className="space-y-4">
                    <div className="p-3 bg-warning-50 dark:bg-warning-100/10 border border-warning-200 rounded-lg">
                      <p className="text-sm text-warning-700 dark:text-warning-600">
                        {t("requestDesignConfirmation")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        {t("tasks.taskName")}:
                      </p>
                      <p className="text-sm text-default-600">
                        {selectedTask?.name ?? ""}
                      </p>
                    </div>

                    {notes && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          {t("timeline.treeView.notes")}:
                        </p>
                        <p className="text-sm text-default-600">{notes}</p>
                      </div>
                    )}
                  </div>
                </ModalBody>

                <ModalFooter>
                  <Button
                    color="danger"
                    variant="light"
                    onPress={() => {
                      setIsRequestDesignConfirmModalOpen(false);
                      setModalError(false);
                    }}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    color="primary"
                    isLoading={changeStatusLoading}
                    onPress={handleRequestDesignConfirm}
                  >
                    {t("confirm")}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Change Status Modal */}
        <Modal
          isOpen={isChangeStatusModalOpend}
          scrollBehavior="inside"
          size="md"
          onOpenChange={setIsChangeStatusModalOpend}
        >
          <ModalContent>
            {(_onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  {t("changeStatus")}
                  {modalError && (
                    <p className="text-sm text-danger font-normal">
                      {t("common.unexpectedError")}
                    </p>
                  )}
                </ModalHeader>

                <ModalBody>
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
                          {selectedStatus
                            ? selectedStatus.label
                            : t("selectStatus")}
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu
                        aria-label="Select task status"
                        onAction={(key) => {
                          const status = filteredStatusOptions?.find(
                            (s) => s.key === key,
                          );

                          if (status)
                            setSelectedStatus({
                              id: parseInt(status.key),
                              label: status.label,
                            });
                        }}
                      >
                        {filteredStatusOptions?.map((status) => (
                          <DropdownItem key={status.key}>
                            {status.label}
                          </DropdownItem>
                        ))}
                      </DropdownMenu>
                    </Dropdown>

                    {/* Notes */}
                    <Textarea
                      label={t("timeline.treeView.notes")}
                      placeholder={t("timeline.treeView.notes")}
                      value={notes}
                      onChange={(e: any) => setNotes(e.target.value)}
                    />
                  </div>
                </ModalBody>

                <ModalFooter>
                  <Button
                    color="danger"
                    variant="light"
                    onPress={() => {
                      setIsChangeStatusModalOpend(false);
                      setModalError(false);
                    }}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    color="primary"
                    isLoading={changeStatusLoading}
                    onPress={() => {
                      handleChangeStatusSubmit();
                    }}
                  >
                    {t("confirm")}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* <TaskDetailsModal
          isOpen={isDetailsOpen}
          task={selectedTask}
          onClose={onDetailsClose}
        /> */}

        {/* Design Request Confirmation Modal (same as Kanban) */}
        <Modal
          isOpen={isDesignRequestConfirmModalOpen}
          scrollBehavior="inside"
          size="md"
          onOpenChange={() => {
            setIsDesignRequestConfirmModalOpen(false);
            setPendingStatusChange(null);
            setDesignRequestInfo(null);
            setCompletedWithoutDesigner(false);
          }}
        >
          <ModalContent>
            {(_onClose) => (
              <>
                <ModalHeader className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  <span>{t("teamDashboard.kanban.designRequestWarning")}</span>
                </ModalHeader>

                <ModalBody>
                  <div className="space-y-4">
                    <p className="text-default-600">
                      {designRequestInfo?.hasDesignerTask
                        ? t(
                            "teamDashboard.kanban.designRequestWithDesignerMessage",
                          )
                        : t(
                            "teamDashboard.kanban.designRequestWithoutDesignerMessage",
                          )}
                    </p>

                    {designRequestInfo?.hasDesignerTask && (
                      <Checkbox
                        isSelected={completedWithoutDesigner}
                        onValueChange={setCompletedWithoutDesigner}
                      >
                        {t("teamDashboard.kanban.completedWithoutDesigner")}
                      </Checkbox>
                    )}
                  </div>
                </ModalBody>

                <ModalFooter>
                  <Button
                    color="danger"
                    variant="light"
                    onPress={() => {
                      setIsDesignRequestConfirmModalOpen(false);
                      setPendingStatusChange(null);
                      setDesignRequestInfo(null);
                      setCompletedWithoutDesigner(false);
                    }}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    color="primary"
                    onPress={handleConfirmDesignRequestAction}
                  >
                    {t("common.confirm")}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* File Preview Modal */}
        <FilePreview
          previewState={previewState}
          onClose={closePreview}
          onDownload={downloadCurrentFile}
        />
      </div>
    </>
  );
}
