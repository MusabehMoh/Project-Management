import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";
import { Progress } from "@heroui/progress";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Input, Textarea } from "@heroui/input";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Avatar } from "@heroui/avatar";
import { DatePicker } from "@heroui/date-picker";
import { parseDate } from "@internationalized/date";
import type { CalendarDate } from "@internationalized/date";
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
  Code,
  X,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { GlobalPagination } from "@/components/GlobalPagination";
import {
  developerQuickActionsService,
  TaskCompletionAnalytics,
} from "@/services/api/developerQuickActionsService";
import { membersTasksService, projectRequirementsService } from "@/services/api";
import { MemberTask } from "@/types/membersTasks";
import { ProjectRequirement } from "@/types/projectRequirement";
import TaskDetailsDrawer from "@/components/TaskDetailsDrawer";
import { FilePreview } from "@/components/FilePreview";
import { useFilePreview } from "@/hooks/useFilePreview";
import { usePriorityLookups } from "@/hooks/usePriorityLookups";
import { useTaskStatusLookups } from "@/hooks/useTaskLookups";
import { showSuccessToast, showErrorToast, showWarningToast } from "@/utils/toast";
import { getFileUploadConfig } from "@/config/environment";
import { useTeamSearchByDepartment } from "@/hooks/useTeamSearchByDepartment";
import { MemberSearchResult } from "@/types/timeline";
import { usePermissions } from "@/hooks/usePermissions";
import { useMembersTasks } from "@/hooks/useMembersTasks";

interface TaskCompletionTrackerProps {
  className?: string;
  developerId?: string;
}

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

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "critical":
      return "danger";
    case "high":
      return "warning";
    case "medium":
      return "primary";
    case "low":
      return "success";
    default:
      return "default";
  }
};

export default function TaskCompletionTracker({
  className = "",
  developerId,
}: TaskCompletionTrackerProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { user } = usePermissions();

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 3;
  const [analytics, setAnalytics] = useState<TaskCompletionAnalytics | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MemberTask | null>(null);
  const [fullRequirement, setFullRequirement] = useState<ProjectRequirement | null>(null);
  const [loadingRequirement, setLoadingRequirement] = useState(false);
  const [isDeleteAttachmentModalOpen, setIsDeleteAttachmentModalOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<any>(null);
  const [deleteAttachmentLoading, setDeleteAttachmentLoading] = useState(false);

  // Modal state for change assignees
  const [isChangeAssigneesModalOpened, setIsChangeAssigneesModalOpened] = useState(false);
  const [notes, setNotes] = useState("");
  const [modalError, setModalError] = useState(false);
  const [assigneeModalError, setAssigneeModalError] = useState(false);
  const [startDateError, setStartDateError] = useState<string | null>(null);
  const [endDateError, setEndDateError] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<MemberSearchResult[]>([]);
  const [employeeInputValue, setEmployeeInputValue] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<MemberSearchResult | null>(null);
  const [taskStartDate, setTaskStartDate] = useState<CalendarDate | null>(null);
  const [taskEndDate, setTaskEndDate] = useState<CalendarDate | null>(null);

  // Hooks for drawer functionality
  const { getPriorityColor, getPriorityLabel } = usePriorityLookups();
  const { getStatusLabel } = useTaskStatusLookups();

  // Get useMembersTasks hook for changeAssignees function
  const { changeAssignees, refreshTasks } = useMembersTasks();

  // Employee search hook
  const {
    employees,
    loading: employeeSearchLoading,
    searchEmployees,
  } = useTeamSearchByDepartment({
    departmentId: user?.roles?.[0]?.department?.id
      ? Number(user.roles[0].department.id)
      : 4, // Development Department
    minLength: 1,
    maxResults: 20,
    loadInitialResults: true,
    initialResultsLimit: 20,
  });

  // File preview hook
  const { previewState, previewFile, closePreview, downloadCurrentFile } = useFilePreview({
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
      if (a.type === "overdue" && b.type !== "overdue") return -1;
      if (a.type !== "overdue" && b.type === "overdue") return 1;

      const aDays =
        a.type === "overdue" ? a.daysOverdue || 0 : a.daysUntilDeadline || 0;
      const bDays =
        b.type === "overdue" ? b.daysOverdue || 0 : b.daysUntilDeadline || 0;

      return a.type === "overdue" ? bDays - aDays : aDays - bDays;
    });
  }, [analytics]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return allItems.slice(startIndex, endIndex);
  }, [allItems, currentPage, pageSize]);

  const totalPages = Math.ceil(allItems.length / pageSize);

  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use real API
        const data =
          await developerQuickActionsService.getTaskCompletionAnalytics();

        setAnalytics(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch task data",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    fetchData();
  }, [developerId]);

  const refresh = async () => {
    setRefreshing(true);
    setError(null);

    try {
      // Use real API
      const data =
        await developerQuickActionsService.getTaskCompletionAnalytics();

      setAnalytics(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to refresh task data",
      );
    } finally {
      setRefreshing(false);
    }
  };

  // Task click handler - fetch full task details and open drawer
  const handleTaskClick = async (taskId: string) => {
    try {
      // Fetch full task details
      const response = await membersTasksService.getTaskById(taskId);
      if (response.success && response.data) {
        const task = response.data;
        setSelectedTask(task);

        // Fetch full requirement details if available
        if (task.requirement?.id) {
          setLoadingRequirement(true);
          try {
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

        // Open drawer
        setIsDrawerOpen(true);
      }
    } catch (error) {
      console.error("Failed to fetch task details:", error);
      showErrorToast(t("common.error"));
    }
  };

  // File handling functions
  const handleFilePreview = async (attachment: any) => {
    if (fullRequirement && attachment?.originalName && typeof attachment.originalName === "string") {
      await previewFile(attachment.originalName, attachment.url, attachment.size);
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
      const blob = await membersTasksService.downloadTaskAttachment(attachment.id);
      const url = window.URL.createObjectURL(blob);
      await previewFile(attachment.originalName, url, attachment.fileSize);
    } catch (error) {
      console.error("Task attachment preview failed:", error);
    }
  };

  const handleTaskFileDownload = async (attachment: any) => {
    try {
      const blob = await membersTasksService.downloadTaskAttachment(attachment.id);
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
    const { maxFileSizeMB, allowedFileTypes } = getFileUploadConfig();
    const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

    const emptyFiles: string[] = [];
    const oversizedFiles: string[] = [];
    const invalidTypeFiles: string[] = [];

    const validFiles = files.filter((file) => {
      if (file.size === 0) {
        emptyFiles.push(file.name);
        return false;
      }
      if (file.size > maxFileSizeBytes) {
        oversizedFiles.push(file.name);
        return false;
      }
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      if (!fileExtension || !allowedFileTypes.includes(fileExtension)) {
        invalidTypeFiles.push(file.name);
        return false;
      }
      return true;
    });

    if (emptyFiles.length > 0) {
      const fileList = emptyFiles.join(", ");
      const message = emptyFiles.length === 1 ? `${fileList}` : `${emptyFiles.length} ${t("requirements.validation.filesEmptyError")}: ${fileList}`;
      showWarningToast(t("requirements.validation.fileEmptyError"), message);
    }
    if (oversizedFiles.length > 0) {
      showWarningToast(t("requirements.validation.filesSizeTooLarge"), oversizedFiles.join(", "));
    }
    if (invalidTypeFiles.length > 0) {
      const allowedTypesStr = allowedFileTypes.join(", ");
      showWarningToast(
        t("requirements.validation.fileTypeNotAllowed")
          .replace("{0}", invalidTypeFiles[0])
          .replace("{1}", allowedTypesStr),
        invalidTypeFiles.join(", "),
      );
    }

    if (validFiles.length === 0) return;

    let uploadedCount = 0;
    for (const file of validFiles) {
      try {
        const result = await membersTasksService.uploadTaskAttachment(taskId, file);
        if (result.success) {
          uploadedCount++;
          showSuccessToast(t("requirements.uploadSuccess"));
        } else {
          showErrorToast(t("requirements.uploadError"));
        }
      } catch (error) {
        console.error("Upload failed:", error);
        showErrorToast(t("requirements.uploadError"));
      }
    }

    if (uploadedCount > 0) {
      const currentTask = selectedTask;
      setIsDrawerOpen(false);
      setTimeout(() => {
        setSelectedTask(currentTask);
        setIsDrawerOpen(true);
      }, 100);
    }
  };

  const handleTaskFileDelete = async (attachment: any) => {
    setAttachmentToDelete(attachment);
    setIsDeleteAttachmentModalOpen(true);
  };

  const confirmDeleteAttachment = async () => {
    if (!attachmentToDelete) return;
    setDeleteAttachmentLoading(true);
    try {
      const result = await membersTasksService.deleteTaskAttachment(attachmentToDelete.id);
      if (result.success) {
        showSuccessToast(t("taskDetails.attachmentDeleted"));
        setIsDeleteAttachmentModalOpen(false);
        setAttachmentToDelete(null);
        const currentTask = selectedTask;
        setIsDrawerOpen(false);
        setTimeout(() => {
          setSelectedTask(currentTask);
          setIsDrawerOpen(true);
        }, 100);
      } else {
        showErrorToast(t("taskDetails.attachmentDeleteError"));
      }
    } catch (error) {
      console.error("Attachment deletion failed:", error);
      showErrorToast(t("taskDetails.attachmentDeleteError"));
    } finally {
      setDeleteAttachmentLoading(false);
    }
  };

  // Placeholder handlers for actions not needed in this view
  // These close the drawer - users should use the members-tasks page for full management
  const handleChangeAssignees = (task: MemberTask) => {
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

  const handleChangeStatus = (task: MemberTask) => {
    setIsDrawerOpen(false);
    // Navigate to members-tasks page with the task pre-selected
    navigate(`/members-tasks`);
  };

  const handleRequestDesign = (task: MemberTask) => {
    setIsDrawerOpen(false);
    // Navigate to members-tasks page with the task pre-selected
    navigate(`/members-tasks`);
  };

  const handleChangeAssigneesSubmit = async () => {
    if (typeof changeAssignees === "function") {
      // Reset previous errors
      setAssigneeModalError(false);
      setStartDateError(null);
      setEndDateError(null);

      // Validate assignees
      if (selectedMembers.length === 0) {
        setAssigneeModalError(true);
        return;
      }

      // Validate end date is after start date if both are provided
      if (taskStartDate && taskEndDate) {
        const start = new Date(taskStartDate.toString());
        const end = new Date(taskEndDate.toString());

        if (end <= start) {
          setEndDateError(t("validation.endDateAfterStart"));
          return;
        }
      }

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
        setTaskStartDate(null);
        setTaskEndDate(null);
        setStartDateError(null);
        setEndDateError(null);
        await refresh(); // Refresh the analytics data
      } else {
        setModalError(true);
      }
    } else {
      setModalError(true);
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

  const getTaskStatusColor = (status: number): "success" | "primary" | "warning" | "danger" | "default" | "secondary" => {
    switch (status) {
      case 1: return "default";
      case 2: return "primary";
      case 3: return "warning";
      case 4: return "danger";
      case 5: return "success";
      case 6: return "secondary";
      default: return "default";
    }
  };

  const getStatusText = (status: number) => {
    return getStatusLabel(status.toString());
  };

  // Helper function to convert string priority to number for getPriorityColor
  const getPriorityColorFromString = (priority: string): "success" | "primary" | "warning" | "danger" | "default" | "secondary" => {
    switch (priority) {
      case "critical":
        return "danger";
      case "high":
        return "warning";
      case "medium":
        return "primary";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Card className={`${className} border-default-200`} shadow="md">
        <CardBody className="space-y-6 p-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-1/2 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>

          {/* Progress overview skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center space-y-3">
                <Skeleton className="h-16 w-16 mx-auto rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-6 w-8 mx-auto rounded" />
                  <Skeleton className="h-4 w-16 mx-auto rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Chart skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-32 rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>

          {/* Task list skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-40 rounded-lg" />
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border border-default-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-40 rounded" />
                    <Skeleton className="h-3 w-24 rounded" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-3 w-12 rounded" />
                </div>
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

  if (!analytics) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"}>
      <Card className="w-full shadow-md border border-default-200">
        <CardHeader className="pb-0">
          <div className="flex justify-between items-center w-full">
            <h3 className="text-lg font-medium">
              {t("developerDashboard.taskCompletion") || "Task Completion"}
            </h3>
            <div className="flex items-center gap-2">
              {allItems.length > 0 && (
                <Chip
                  color={
                    analytics.overdueItems.length > 0 ? "danger" : "warning"
                  }
                  size="sm"
                  variant="flat"
                >
                  {allItems.length}{" "}
                  {t("developerDashboard.needsAttention") || "Need Attention"}
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
          <div className="mb-4 space-y-3">
            {/* Overall Completion Progress */}
            <div className="p-4 bg-default-50 dark:bg-default-100/50 rounded-lg border border-default-200">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-foreground">
                  {t("developerDashboard.overallCompletion") || "Overall Completion"}
                </span>
                <span className="text-sm text-default-500">
                  {analytics.summary.completedTasks} /{" "}
                  {analytics.summary.totalTasks}
                </span>
              </div>
              <Progress
                className="mb-2"
                color="primary"
                size="sm"
                value={
                  analytics.summary.totalTasks > 0
                    ? Math.round(
                        (analytics.summary.completedTasks /
                          analytics.summary.totalTasks) *
                          100
                      )
                    : 0
                }
              />
              <div className="flex justify-between text-xs text-default-500">
                <span>
                  {analytics.summary.totalTasks > 0
                    ? Math.round(
                        (analytics.summary.completedTasks /
                          analytics.summary.totalTasks) *
                          100
                      )
                    : 0}
                  % {t("developerDashboard.completed") || "completed"}
                </span>
                <span>
                  {analytics.summary.totalTasks - analytics.summary.completedTasks}{" "}
                  {t("developerDashboard.remaining") || "remaining"}
                </span>
              </div>
            </div>

            {/* On-Time Completion Progress */}
            <div className="p-4 bg-success-50 dark:bg-success-100/10 rounded-lg border border-success-200 dark:border-success-500/20">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-foreground">
                  {t("developerDashboard.onTimeProgress") || "On-Time Performance"}
                </span>
                <span className="text-sm text-default-500">
                  {analytics.summary.onTimeCompleted} /{" "}
                  {analytics.summary.completedTasks}
                </span>
              </div>
              <Progress
                className="mb-2"
                color="success"
                size="sm"
                value={Math.max(
                  0,
                  Math.min(100, analytics.summary.onTimeRate || 0),
                )}
              />
              <div className="flex justify-between text-xs text-default-500">
                <span>
                  {Math.max(0, Math.min(100, analytics.summary.onTimeRate || 0))}%{" "}
                  {t("developerDashboard.onTime") || "on time"}
                </span>
                {analytics.summary.avgDelayDays > 0 && (
                  <span>
                    {t("developerDashboard.avgDelay") || "Avg delay"}:{" "}
                    {analytics.summary.avgDelayDays}{" "}
                    {t("developerDashboard.days") || "days"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tasks Table */}
          {allItems.length > 0 ? (
            <>
              <Table removeWrapper aria-label="Tasks needing attention">
                <TableHeader>
                  <TableColumn>
                    {t("developerDashboard.task") || "Task"}
                  </TableColumn>
                  <TableColumn>
                    {t("developerDashboard.priority") || "Priority"}
                  </TableColumn>
                  <TableColumn>
                    {t("developerDashboard.status") || "Status"}
                  </TableColumn>
                  <TableColumn>
                    {t("developerDashboard.dueDate") || "Due Date"}
                  </TableColumn>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((item) => (
                    <TableRow
                      key={`${item.type}-${item.id}`}
                      className="cursor-pointer hover:bg-default-100"
                      onClick={() => handleTaskClick(item.id)}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {item.title}
                          </span>
                          <span className="text-xs text-default-500">
                            {item.projectName} • {item.assignee}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={getPriorityColorFromString(item.priority)}
                          size="sm"
                          variant="flat"
                        >
                          {t(`priority.${item.priority}`) || item.priority}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Tooltip
                          content={
                            item.type === "overdue"
                              ? item.daysOverdue === 1
                                ? t("completion.oneDayOverdue")
                                : t("completion.daysOverdue").replace(
                                    "{days}",
                                    item.daysOverdue?.toString() || "0",
                                  )
                              : item.daysUntilDeadline === 1
                                ? t("completion.oneDayLeft")
                                : t("completion.daysLeft").replace(
                                    "{days}",
                                    item.daysUntilDeadline?.toString() || "0",
                                  )
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
                              ? t("developerDashboard.overdue") || "Overdue"
                              : t("developerDashboard.dueSoon") || "Due Soon"}
                          </Chip>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-default-600">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(item.dueDate)}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

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
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-success-600 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-foreground mb-2">
                {t("developerDashboard.allTasksOnTrack") ||
                  "All Tasks On Track"}
              </h4>
              <p className="text-sm text-default-500">
                {t("developerDashboard.noOverdueTasks") ||
                  "No overdue or at-risk tasks"}
              </p>
              <div className="mt-4 flex justify-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-success-600" />
                  <span className="text-success-600">
                    {analytics.summary.onTimeCompleted}{" "}
                    {t("developerDashboard.completedOnTime") ||
                      "completed on time"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Code className="w-4 h-4 text-default-500" />
                  <span className="text-default-500">
                    {analytics.summary.completedTasks}{" "}
                    {t("developerDashboard.totalCompleted") ||
                      "total completed"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

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
        onFileDownload={handleFileDownload}
        onFilePreview={handleTaskFilePreview}
        onFileUpload={handleTaskFileUpload}
        onOpenChange={setIsDrawerOpen}
        onRequestDesign={handleRequestDesign}
      />

      {/* Delete Attachment Confirmation Modal */}
      <Modal
        isOpen={isDeleteAttachmentModalOpen}
        size="md"
        onOpenChange={setIsDeleteAttachmentModalOpen}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {t("taskDetails.deleteAttachment")}
              </ModalHeader>

              <ModalBody>
                <p>{t("taskDetails.deleteAttachmentConfirm")}</p>
              </ModalBody>

              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  {t("common.cancel")}
                </Button>
                <Button
                  color="danger"
                  isLoading={deleteAttachmentLoading}
                  onPress={confirmDeleteAttachment}
                >
                  {t("common.delete")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

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

                  {/* Priority */}
                  <Input
                    readOnly
                    label={t("requirements.priority")}
                    value={getPriorityLabel(selectedTask?.priorityId ?? 0)}
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
                    menuTrigger="focus"
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
                        const selectedEmp = employees.find(
                          (e) => e.id.toString() === key,
                        );

                        if (selectedEmp) {
                          handleEmployeeSelect(selectedEmp);
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
                        textValue={`${employee.gradeName} ${employee.fullName}`}
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
                          </div>
                        </div>
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>

                  {/* Start Date and End Date in one row */}
                  <div className="grid grid-cols-2 gap-4">
                    <DatePicker
                      errorMessage={startDateError}
                      isInvalid={!!startDateError}
                      label={t("tasks.startDate")}
                      value={taskStartDate}
                      onChange={(date) => {
                        setTaskStartDate(date);
                        if (startDateError) setStartDateError(null);
                      }}
                    />

                    <DatePicker
                      errorMessage={endDateError}
                      isInvalid={!!endDateError}
                      label={t("tasks.endDate")}
                      value={taskEndDate}
                      onChange={(date) => {
                        setTaskEndDate(date);
                        if (endDateError) setEndDateError(null);
                      }}
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
                    setStartDateError(null);
                    setEndDateError(null);
                  }}
                >
                  {t("cancel")}
                </Button>
                <Button
                  color="primary"
                  isLoading={loading}
                  onPress={handleChangeAssigneesSubmit}
                >
                  {t("confirm")}
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
  );
}
