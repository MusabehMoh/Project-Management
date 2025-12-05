import type {
  ProjectRequirement,
  AssignedProject,
  CreateRequirementTaskRequest,
} from "@/types/projectRequirement";
import type { MemberSearchResult } from "@/types/timeline";
import type { CreateTimelineRequest } from "@/types/timeline";

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { DatePicker } from "@heroui/date-picker";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { Textarea } from "@heroui/input";
import {
  Search,
  Calendar,
  Code,
  Eye,
  Plus,
  Edit,
  X,
  Info,
  CornerUpLeft,
} from "lucide-react";
import { parseDate, today, getLocalTimeZone } from "@internationalized/date";
// Import ReactQuill for rich text editing
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import { FilePreview } from "@/components/FilePreview";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApprovedRequirements } from "@/hooks/useApprovedRequirements";
import useTeamSearchByDepartment from "@/hooks/useTeamSearchByDepartment";
import { useTimeline } from "@/hooks/useTimeline";
import { usePermissions } from "@/hooks/usePermissions";
import { useRequirementStatus } from "@/hooks/useRequirementStatus";
import { usePriorityLookups } from "@/hooks/usePriorityLookups";
import { usePageTitle } from "@/hooks";
import { useFilePreview } from "@/hooks/useFilePreview";
import { useRequirementDetails } from "@/hooks/useRequirementDetails";
import { projectRequirementsService } from "@/services/api/projectRequirementsService";
import TimelineCreateModal from "@/components/timeline/TimelineCreateModal";
import { GlobalPagination } from "@/components/GlobalPagination";
import RequirementDetailsDrawer from "@/components/RequirementDetailsDrawer";
import { PAGE_SIZE_OPTIONS, normalizePageSize } from "@/constants/pagination";
import { REQUIREMENT_STATUS } from "@/constants/projectRequirements";
import {
  createTimelineToasts,
  showSuccessToast,
  showErrorToast,
} from "@/utils/toast";

// Format date helper
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// RequirementCard component
const RequirementCard = ({
  requirement,
  onViewDetails,
  onCreateTask,
  onCreateTimeline,
  onReturn,
  getStatusColor,
  getStatusText,
  getPriorityColor,
  getPriorityLabel,
  convertTypeToString,
  isHighlighted = false,
  cardRef,
}: {
  requirement: ProjectRequirement;
  onViewDetails: (requirement: ProjectRequirement) => void;
  onCreateTask: (requirement: ProjectRequirement) => void;
  onCreateTimeline: (requirement: ProjectRequirement) => void;
  onReturn: (requirement: ProjectRequirement) => void;
  getStatusColor: (
    status: number,
  ) => "warning" | "danger" | "primary" | "secondary" | "success" | "default";
  getStatusText: (status: number) => string;
  getPriorityColor: (
    priority: number,
  ) => "warning" | "danger" | "primary" | "secondary" | "success" | "default";
  getPriorityLabel: (priority: number) => string | undefined;
  convertTypeToString: (type: number) => string;
  isHighlighted?: boolean;
  cardRef?: (element: HTMLDivElement | null) => void;
}) => {
  const { hasPermission } = usePermissions();
  const { t } = useLanguage();

  // Using the formatDate function defined above

  return (
    <Card
      ref={cardRef}
      className={`h-full flex flex-col transition-all duration-1000 ease-out ${
        isHighlighted ? "ring-1 ring-primary/60 bg-primary-50/20 shadow-md" : ""
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start w-full gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground truncate">
              {requirement.name}
            </h3>
            <p className="text-sm text-default-500 line-clamp-2 mt-1">
              {requirement.project?.applicationName || "N/A"}
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end flex-shrink-0">
            <Chip
              color={getPriorityColor(requirement.priority)}
              size="sm"
              variant="flat"
            >
              {getPriorityLabel(requirement.priority) ||
                t(`requirements.priority.${requirement.priority}`)}
            </Chip>
            <Chip
              color={getStatusColor(requirement.status)}
              size="sm"
              variant="flat"
            >
              {getStatusText(requirement.status)}
            </Chip>
            {requirement.type && (
              <Chip
                color={
                  convertTypeToString(requirement.type) === "new"
                    ? "success"
                    : "warning"
                }
                size="sm"
                variant="flat"
              >
                {convertTypeToString(requirement.type) === "new"
                  ? t("requirements.new")
                  : t("requirements.changeRequest")}
              </Chip>
            )}
          </div>
        </div>
      </CardHeader>

      <CardBody className="pt-0 flex-1 flex flex-col">
        <div className="space-y-4 flex-1">
          <div className="bg-default-50 dark:bg-default-100/10 p-3 rounded-lg">
            <p
              dangerouslySetInnerHTML={{
                __html: requirement.description,
              }}
              className="text-sm line-clamp-4"
            />
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-default-400" />
            <span className="text-sm">
              {formatDate(requirement.expectedCompletionDate)}
            </span>
          </div>
        </div>

        {/* Detail, Task, and Timeline Creation Buttons */}
        <div className="space-y-2 pt-2 mt-auto">
          <div className="flex items-center gap-2">
            {
              <Button
                className="flex-1"
                color="default"
                size="sm"
                startContent={<Eye className="w-3 h-3 flex-shrink-0" />}
                variant="faded"
                onPress={() => onViewDetails(requirement)}
              >
                {t("common.viewDetails")}
              </Button>
            }

            {/* Business Rule: Show Task button only if requirement doesn't have timeline */}
            {!requirement.timeline &&
              hasPermission({
                actions: ["requirements.tasks.create"],
              }) && (
                <Button
                  className="flex-1"
                  color="default"
                  size="sm"
                  startContent={
                    requirement.requirementTask ? (
                      <Edit className="w-3 h-3 flex-shrink-0" />
                    ) : (
                      <Plus className="w-3 h-3 flex-shrink-0" />
                    )
                  }
                  variant="faded"
                  onPress={() => onCreateTask(requirement)}
                >
                  {requirement.requirementTask
                    ? t("tasks.viewTask")
                    : t("tasks.createTask")}
                </Button>
              )}

            {/* Business Rule: Show Timeline button only if requirement doesn't have task */}
            {!requirement.requirementTask &&
              hasPermission({
                actions: ["requirements.timelines.create"],
              }) && (
                <Button
                  className="flex-1"
                  color="default"
                  size="sm"
                  startContent={
                    requirement.timeline ? (
                      <Edit className="w-3 h-3 flex-shrink-0" />
                    ) : (
                      <Plus className="w-3 h-3 flex-shrink-0" />
                    )
                  }
                  variant="faded"
                  onPress={() => onCreateTimeline(requirement)}
                >
                  {requirement.timeline
                    ? t("timeline.viewTimeline")
                    : t("timeline.createTimeline")}
                </Button>
              )}
          </div>

          {/* Business Rule: Show Return button only for approved requirements */}
          {requirement.status === REQUIREMENT_STATUS.APPROVED && (
            <Button
              className="w-full"
              color="default"
              size="sm"
              startContent={
                <CornerUpLeft className="w-3 h-3 flex-shrink-0 text-danger" />
              }
              variant="faded"
              onPress={() => onReturn(requirement)}
            >
              {t("requirements.return")}
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

// Form data type for editing requirements
// interface RequirementFormData {
//   name: string;
//   description: string;
//   priority: "low" | "medium" | "high" | "critical";
//   status: "draft" | "in_development" | "completed";
// }

export default function DevelopmentRequirementsPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [searchParams] = useSearchParams();

  // Initialize toast helpers
  const toasts = createTimelineToasts(t);

  // Refs for scrolling and highlighting
  const requirementRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [highlightedRequirementId, setHighlightedRequirementId] = useState<
    number | null
  >(null);

  // Set page title
  usePageTitle("requirements.approvedRequirements");

  // Global priority lookups
  const { getPriorityColor, getPriorityLabel, priorityOptions } =
    usePriorityLookups();

  // RequirementStatus hook for dynamic status management
  const { statuses, getRequirementStatusColor, getRequirementStatusName } =
    useRequirementStatus();

  // File preview hook
  const { previewState, closePreview, downloadCurrentFile } = useFilePreview({
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

  // Note: file preview and download handlers are provided by useFilePreview hook

  // Helper function to get status color using RequirementStatus lookup
  const getStatusColor = (status: number) => {
    return getRequirementStatusColor(status);
  };

  // Helper function to get status text using RequirementStatus lookup
  const getStatusText = (status: number) => {
    return getRequirementStatusName(status);
  };

  // Helper function to convert requirement type to string
  const convertTypeToString = (type: number): string => {
    return type === 1 ? "new" : "changeRequest";
  };

  // Grid-only view

  const {
    requirements,
    loading,
    currentPage,
    totalPages,
    totalRequirements,
    pageSize,
    filters,
    // updateRequirement, deleteRequirement removed (read-only grid)
    updateFilters,
    handlePageChange,
    handlePageSizeChange,
    refreshData,
    projects,
    setProjectFilter,
  } = useApprovedRequirements({
    pageSize: 20,
    initialFilters: {
      status: REQUIREMENT_STATUS.APPROVED.toString(),
    },
  });

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRequirementId, setSelectedRequirementId] = useState<
    number | undefined
  >(undefined);

  // Task creation modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedDevelopers, setSelectedDevelopers] = useState<
    MemberSearchResult[]
  >([]);
  const [selectedQC, setSelectedQC] = useState<MemberSearchResult | null>(null);
  const [selectedDesigner, setSelectedDesigner] =
    useState<MemberSearchResult | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Fetch requirement details when drawer opens OR task modal is open
  const { requirement: selectedRequirement } = useRequirementDetails({
    requirementId:
      isDrawerOpen || isTaskModalOpen ? selectedRequirementId : undefined,
    enabled: isDrawerOpen || isTaskModalOpen,
  });
  // Task description and dates
  const [taskDescription, setTaskDescription] = useState<string>("");
  // Developer dates (shared across all developers)
  const [developerStartDate, setDeveloperStartDate] = useState<any>(null);
  const [developerEndDate, setDeveloperEndDate] = useState<any>(null);
  // QC dates
  const [qcStartDate, setQcStartDate] = useState<any>(null);
  const [qcEndDate, setQcEndDate] = useState<any>(null);
  // Designer dates
  const [designerStartDate, setDesignerStartDate] = useState<any>(null);
  const [designerEndDate, setDesignerEndDate] = useState<any>(null);
  // Controlled input values for Autocomplete components (needed by HeroUI Autocomplete)
  const [developerInputValue, setDeveloperInputValue] = useState<string>("");
  const [qcInputValue, setQcInputValue] = useState<string>("");
  const [designerInputValue, setDesignerInputValue] = useState<string>("");

  // Date validation error states
  const [dateValidationErrors, setDateValidationErrors] = useState<{
    developer?: string;
    qc?: string;
    designer?: string;
  }>({});

  // Timeline creation modal state
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [timelineRequirement, setTimelineRequirement] =
    useState<ProjectRequirement | null>(null);
  const [isOptionOpen, setIsOptionOpen] = useState(false);

  // Return modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [requirementToReturn, setRequirementToReturn] =
    useState<ProjectRequirement | null>(null);
  const [returnReason, setReturnReason] = useState<string>("");
  const [isReturning, setIsReturning] = useState(false);

  // Timeline hook for creating timelines
  const { createTimeline, loading: timelineLoading } = useTimeline({
    skipProjectsFetch: true, // Projects already loaded
  });

  const {
    employees: developers,
    loading: loadingDevelopers,
    searchEmployees: searchDevelopers,
  } = useTeamSearchByDepartment({
    departmentId: 2, // development Department
    minLength: 1,
    maxResults: 100,
    loadInitialResults: true, // Load all developers initially (used heavily)
    initialResultsLimit: 100,
  });
  const {
    employees: qcMembers,
    loading: loadingQC,
    searchEmployees: searchQC,
  } = useTeamSearchByDepartment({
    departmentId: 5, // QC Department
    minLength: 1,
    maxResults: 100,
    // Only search when user types to avoid redundant q="" calls
    loadInitialResults: true,
    initialResultsLimit: 100,
  });
  const {
    employees: designers,
    loading: loadingDesigners,
    searchEmployees: searchDesigners,
  } = useTeamSearchByDepartment({
    departmentId: 3, // Design Department
    minLength: 1,
    maxResults: 100,
    // Only search when user types to avoid redundant q="" calls
    loadInitialResults: true,
    initialResultsLimit: 100,
  });

  // Debug: log team search results to help diagnose autocomplete issues
  // Debug hooks intentionally left out to keep production linting clean.

  // Date validation functions
  const validateDateRange = (startDate: any, endDate: any): string | null => {
    if (!startDate || !endDate) return null;

    const start = new Date(startDate.toString());
    const end = new Date(endDate.toString());

    if (start > end) {
      return t("tasks.validation.startDateMustBeBeforeEndDate");
    }

    return null;
  };

  const validateAllDates = (): boolean => {
    const errors: { developer?: string; qc?: string; designer?: string } = {};
    let hasErrors = false;

    // Validate developer dates - required if developers are selected
    if (selectedDevelopers.length > 0) {
      if (!developerStartDate || !developerEndDate) {
        errors.developer = t("tasks.validation.bothDatesRequired");
        hasErrors = true;
      } else {
        const error = validateDateRange(developerStartDate, developerEndDate);

        if (error) {
          errors.developer = error;
          hasErrors = true;
        }
      }
    }

    // Validate QC dates - required if QC is selected
    if (selectedQC) {
      if (!qcStartDate || !qcEndDate) {
        errors.qc = t("tasks.validation.bothDatesRequired");
        hasErrors = true;
      } else {
        const error = validateDateRange(qcStartDate, qcEndDate);

        if (error) {
          errors.qc = error;
          hasErrors = true;
        }
      }
    }

    // Validate designer dates - required if designer is selected
    if (selectedDesigner) {
      if (!designerStartDate || !designerEndDate) {
        errors.designer = t("tasks.validation.bothDatesRequired");
        hasErrors = true;
      } else {
        const error = validateDateRange(designerStartDate, designerEndDate);

        if (error) {
          errors.designer = error;
          hasErrors = true;
        }
      }
    }

    setDateValidationErrors(errors);

    return !hasErrors;
  };

  // Validate dates whenever selections or dates change
  useEffect(() => {
    if (isTaskModalOpen) {
      validateAllDates();
    }
  }, [
    selectedDevelopers,
    selectedQC,
    developerStartDate,
    developerEndDate,
    qcStartDate,
    qcEndDate,
    isTaskModalOpen,
    t, // Include t in dependencies since it's used in validation messages
  ]);

  // Function to open drawer with requirement details
  const openRequirementDetails = (requirement: ProjectRequirement) => {
    setSelectedRequirementId(requirement.id);
    setIsDrawerOpen(true);
  };

  // Function to open return modal
  const openReturnModal = (requirement: ProjectRequirement) => {
    setRequirementToReturn(requirement);
    setReturnReason("");
    setIsReturnModalOpen(true);
  };

  // Removed fetchMemberById: we use backend data from approved-requirements to prefill selections

  // Function to open task creation modal
  const openTaskModal = async (requirement: ProjectRequirement) => {
    setSelectedRequirementId(requirement.id);
    setIsTaskModalOpen(true);

    // Clear any previous validation errors
    setDateValidationErrors({});

    // Pre-populate description with requirement description
    setTaskDescription(requirement.description || "");

    // Reset all fields initially - will be populated by useEffect when selectedRequirement loads
    setSelectedDevelopers([]);
    setSelectedQC(null);
    setSelectedDesigner(null);

    // Set default dates for new tasks
    const todayDate = today(getLocalTimeZone());
    const tomorrowDate = todayDate.add({ days: 1 });

    // Calculate end date: use tomorrow if expectedCompletionDate is in the past
    let defaultEndDate = null;

    if (requirement.expectedCompletionDate) {
      const expectedDate = parseDate(
        requirement.expectedCompletionDate.split("T")[0],
      );

      defaultEndDate =
        expectedDate.compare(todayDate) < 0 ? tomorrowDate : expectedDate;
    }

    setDeveloperStartDate(todayDate);
    setDeveloperEndDate(defaultEndDate);
    setQcStartDate(todayDate);
    setQcEndDate(defaultEndDate);
    setDesignerStartDate(todayDate);
    setDesignerEndDate(defaultEndDate);
    setDeveloperInputValue("");
    setQcInputValue("");
    setDesignerInputValue("");
  };

  // Effect to populate task form when selectedRequirement is loaded
  useEffect(() => {
    if (!isTaskModalOpen || !selectedRequirement?.requirementTask) {
      return;
    }

    const task = selectedRequirement.requirementTask;

    // Always reset selections first to clear any previous data
    setSelectedDevelopers([]);
    setSelectedQC(null);
    setSelectedDesigner(null);
    setDeveloperInputValue("");
    setQcInputValue("");
    setDesignerInputValue("");
    setDeveloperStartDate(null);
    setDeveloperEndDate(null);
    setQcStartDate(null);
    setQcEndDate(null);
    setDesignerStartDate(null);
    setDesignerEndDate(null);

    // Pre-populate developer
    if (task.developer) {
      setSelectedDevelopers([
        {
          id: task.developer.id,
          userName: task.developer.userName,
          militaryNumber: task.developer.militaryNumber,
          fullName: task.developer.fullName,
          gradeName: task.developer.gradeName || "",
          statusId: 0,
          department: "Development",
        },
      ]);
    }

    // Pre-populate QC
    if (task.qc) {
      setSelectedQC({
        id: task.qc.id,
        userName: task.qc.userName,
        militaryNumber: task.qc.militaryNumber,
        fullName: task.qc.fullName,
        gradeName: task.qc.gradeName || "",
        statusId: 0,
        department: "QC",
      });

      // Set QC input display
      setQcInputValue(`${task.qc.gradeName || ""} ${task.qc.fullName}`);
    }

    // Pre-populate Designer
    if (task.designer) {
      setSelectedDesigner({
        id: task.designer.id,
        userName: task.designer.userName,
        militaryNumber: task.designer.militaryNumber,
        fullName: task.designer.fullName,
        gradeName: task.designer.gradeName || "",
        statusId: 0,
        department: "Design",
      });

      // Set designer input display
      setDesignerInputValue(
        `${task.designer.gradeName || ""} ${task.designer.fullName}`,
      );
    }

    // Pre-populate task description
    setTaskDescription(
      task.description || selectedRequirement.description || "",
    );

    // Parse developer dates
    if (task.developerStartDate) {
      setDeveloperStartDate(parseDate(task.developerStartDate.split("T")[0]));
    }
    if (task.developerEndDate) {
      setDeveloperEndDate(parseDate(task.developerEndDate.split("T")[0]));
    }

    // Parse QC dates
    if (task.qcStartDate) {
      setQcStartDate(parseDate(task.qcStartDate.split("T")[0]));
    }
    if (task.qcEndDate) {
      setQcEndDate(parseDate(task.qcEndDate.split("T")[0]));
    }

    // Parse designer dates
    if (task.designerStartDate) {
      setDesignerStartDate(parseDate(task.designerStartDate.split("T")[0]));
    }
    if (task.designerEndDate) {
      setDesignerEndDate(parseDate(task.designerEndDate.split("T")[0]));
    }
  }, [isTaskModalOpen, selectedRequirement]);

  // Function to handle timeline creation or navigation
  const openTimelineModal = (requirement: ProjectRequirement) => {
    if (requirement.timeline) {
      // If timeline exists, navigate to timeline details page
      navigate(
        `/timeline?projectId=${requirement.project?.id}&timelineId=${requirement.timeline.id}&requirementId=${requirement.id}`,
      );
    } else {
      // If no timeline exists, open creation modal
      setTimelineRequirement(requirement);
      setIsTimelineModalOpen(true);
    }
  };

  // Function to handle timeline creation submission
  const handleTimelineCreate = async (
    data: CreateTimelineRequest,
  ): Promise<any> => {
    try {
      const timelineData = {
        ...data,
        projectRequirementId: timelineRequirement?.id,
      };
      const result = await createTimeline(timelineData);

      if (result) {
        // Update requirement status to in_development after timeline creation
        if (timelineRequirement?.status === REQUIREMENT_STATUS.APPROVED) {
          await projectRequirementsService.updateRequirementStatus(
            timelineRequirement.id,
            REQUIREMENT_STATUS.UNDER_DEVELOPMENT,
          );
        }

        setIsTimelineModalOpen(false);
        setTimelineRequirement(null);

        // Show success toast
        toasts.timelineCreated();

        // Add a small delay for smooth user experience before redirect
        setTimeout(() => {
          navigate(
            `/timeline?projectId=${timelineRequirement?.project?.id}&timelineId=${result.id}&requirementId=${timelineRequirement?.id}`,
          );
        }, 1000); // 1 second delay
      }

      return result;
    } catch (error) {
      throw error;
    }
  };

  // Function to handle task creation/update
  const handleTaskSubmit = async () => {
    if (!selectedRequirement) return;

    // Validate dates before submission
    if (!validateAllDates()) {
      return; // Stop submission if validation fails
    }

    setIsCreatingTask(true);
    try {
      const taskData: CreateRequirementTaskRequest = {
        requirementId: selectedRequirement.id,
        developerIds: selectedDevelopers.map((d) => d.id),
        qcId: selectedQC?.id,
        designerId: selectedDesigner?.id,
        description: taskDescription,
        developerStartDate: developerStartDate?.toString(),
        developerEndDate: developerEndDate?.toString(),
        qcStartDate: qcStartDate?.toString(),
        qcEndDate: qcEndDate?.toString(),
        designerStartDate: designerStartDate?.toString(),
        designerEndDate: designerEndDate?.toString(),
      };

      const isUpdate = Boolean(selectedRequirement.requirementTask);

      // Call API to create/update task
      await projectRequirementsService.createRequirementTask(
        selectedRequirement.id,
        taskData,
      );

      // Update requirement status to in_development after task creation
      if (selectedRequirement.status === REQUIREMENT_STATUS.APPROVED) {
        await projectRequirementsService.updateRequirementStatus(
          selectedRequirement.id,
          REQUIREMENT_STATUS.UNDER_DEVELOPMENT,
        );
      }

      // Show success toast based on operation type
      if (isUpdate) {
        toasts.taskUpdated();
      } else {
        toasts.taskCreated();
      }

      setIsTaskModalOpen(false);
      setSelectedDevelopers([]);
      setSelectedQC(null);
      setSelectedDesigner(null);
      setDeveloperInputValue("");
      setQcInputValue("");
      setDesignerInputValue("");

      // Refresh requirements data to get updated task info
      refreshData();
    } catch (error) {
      // Show error toast based on operation type
      const isUpdate = Boolean(selectedRequirement.requirementTask);

      if (isUpdate) {
        toasts.taskUpdateError();
      } else {
        toasts.taskCreateError();
      }

      // eslint-disable-next-line no-console
      console.error("Task operation failed:", error);
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Function to handle requirement return
  const handleReturnSubmit = async (onClose: () => void) => {
    if (!requirementToReturn || !returnReason.trim()) return;

    setIsReturning(true);
    try {
      await projectRequirementsService.returnRequirement(
        requirementToReturn.id,
        returnReason,
      );

      showSuccessToast(t("requirements.returnSuccess"));

      // Close modals
      onClose();
      setIsReturnModalOpen(false);
      setIsTaskModalOpen(false);
      setRequirementToReturn(null);
      setReturnReason("");

      // Refresh requirements data
      refreshData();
    } catch (error) {
      showErrorToast(t("requirements.returnError"));
      // eslint-disable-next-line no-console
      console.error("Error returning requirement:", error);
    } finally {
      setIsReturning(false);
    }
  };

  // Function to reset task modal
  const resetTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedDevelopers([]);
    setSelectedQC(null);
    setSelectedDesigner(null);
    setSelectedRequirementId(undefined);
    setTaskDescription("");
    setDeveloperStartDate(null);
    setDeveloperEndDate(null);
    setQcStartDate(null);
    setQcEndDate(null);
    setDesignerStartDate(null);
    setDesignerEndDate(null);
    setDeveloperInputValue("");
    setQcInputValue("");
    setDesignerInputValue("");
    setDateValidationErrors({});
  };

  // edit/delete removed; grid is read-only

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | null>(
    REQUIREMENT_STATUS.APPROVED,
  );
  const [priorityFilter, setPriorityFilter] = useState<string>("");

  // Update filters when search/filter states change (with debouncing)
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      const newFilters = {
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== null && {
          status: statusFilter.toString(),
        }),
        ...(priorityFilter && { priority: priorityFilter }),
      };

      updateFilters(newFilters);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, priorityFilter, updateFilters]);

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter(null);
    setPriorityFilter("");
    updateFilters({});
    setProjectFilter(undefined);
  };

  // Check if any filters are active
  const hasActiveFilters =
    searchTerm || statusFilter !== null || priorityFilter || filters.projectId;

  // Auto-scroll and highlight functionality
  useEffect(() => {
    const highlightRequirement = searchParams.get("highlightRequirement");
    const scrollTo = searchParams.get("scrollTo");

    if (highlightRequirement && scrollTo && requirements.length > 0) {
      const requirementId = parseInt(highlightRequirement, 10);
      const scrollToId = parseInt(scrollTo, 10);

      // Set highlighted requirement
      setHighlightedRequirementId(requirementId);

      // Scroll to the requirement after a short delay to ensure DOM is ready
      setTimeout(() => {
        const element = requirementRefs.current[scrollToId];

        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          // Remove highlight after 5 seconds for a more subtle fade
          setTimeout(() => {
            setHighlightedRequirementId(null);
          }, 5000);
        }
      }, 500);
    }
  }, [searchParams, requirements, setHighlightedRequirementId]);

  // edit/delete handlers removed - grid is read-only

  // (Helpers are defined within RequirementCard where needed)

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {t("requirements.approvedRequirements")}
            </h1>
            <p className="text-default-500">
              {t("requirements.approvedRequirementsSubtitle")}
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <Input
            className="md:w-120"
            placeholder={t("requirements.searchRequirements")}
            startContent={<Search className="w-4 h-4" />}
            value={searchTerm}
            onValueChange={setSearchTerm}
          />

          <Select
            className="md:w-90"
            placeholder={t("taskPlan.filterByProject")}
            selectedKeys={filters.projectId ? [String(filters.projectId)] : []}
            onSelectionChange={(keys) => {
              const val = Array.from(keys)[0] as string;

              setProjectFilter(val ? Number(val) : undefined);
            }}
          >
            <SelectItem key="">{t("taskPlan.allProjects")}</SelectItem>
            <>
              {projects?.map((p: AssignedProject) => (
                <SelectItem key={String(p.id)}>{p.applicationName}</SelectItem>
              ))}
            </>
          </Select>

          <Select
            className="md:w-43"
            items={[
              { value: "", label: t("requirements.allStatuses") },
              ...(statuses || []).map((status) => ({
                value: status.value.toString(),
                label: language === "ar" ? status.nameAr : status.nameEn,
              })),
            ]}
            placeholder={t("requirements.filterByStatus")}
            selectedKeys={
              statusFilter !== null ? [statusFilter.toString()] : []
            }
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0] as string;

              setStatusFilter(selectedKey ? parseInt(selectedKey) : null);
            }}
          >
            {(item) => <SelectItem key={item.value}>{item.label}</SelectItem>}
          </Select>

          <Select
            className="md:w-43"
            items={[
              { value: "", label: t("requirements.allPriorities") },
              ...priorityOptions.map((p) => ({
                value: p.value.toString(),
                label: language === "ar" ? p.labelAr : p.label,
              })),
            ]}
            placeholder={t("requirements.filterByPriority")}
            selectedKeys={priorityFilter ? [priorityFilter.toString()] : []}
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0] as string;

              setPriorityFilter(selectedKey || "");
            }}
          >
            {(item) => <SelectItem key={item.value}>{item.label}</SelectItem>}
          </Select>

          {/* Grid-only view (no toggle) */}
        </div>

        {/* Clear Filters - New Row */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <Button
              color="secondary"
              size="sm"
              startContent={<X size={16} />}
              variant="flat"
              onPress={resetFilters}
            >
              {t("requirements.clearFilters")}
            </Button>
            <span className="text-sm text-default-500">
              {t("requirements.requirementsFound").replace(
                "{count}",
                totalRequirements.toString(),
              )}
            </span>
          </div>
        )}

        {/* Pagination Controls */}
        {requirements.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4">
            <div className="flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
              <span className="text-sm text-default-600">
                {t("common.show")}
              </span>
              <Select
                className="w-20"
                disallowEmptySelection={true}
                isOpen={isOptionOpen}
                selectedKeys={[normalizePageSize(pageSize, 10).toString()]}
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
          </div>
        )}

        {/* Requirements Content */}
        {loading && requirements.length === 0 ? (
          /* Skeleton Loader for Requirements Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="h-full flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start w-full gap-3">
                    <div className="flex-1 min-w-0">
                      <Skeleton className="h-6 w-3/4 rounded-md mb-1" />
                      <Skeleton className="h-4 w-1/2 rounded-md" />
                    </div>
                    <div className="flex flex-col gap-2 items-end flex-shrink-0">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  </div>
                </CardHeader>

                <CardBody className="pt-0 flex-1 flex flex-col">
                  <div className="space-y-4 flex-1">
                    <div className="bg-default-50 dark:bg-default-100/10 p-3 rounded-lg">
                      <Skeleton className="h-4 w-full rounded-md mb-2" />
                      <Skeleton className="h-4 w-4/5 rounded-md mb-2" />
                      <Skeleton className="h-4 w-3/5 rounded-md" />
                    </div>

                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-sm" />
                      <Skeleton className="h-4 w-24 rounded-md" />
                    </div>
                  </div>

                  <div className="flex items-center pt-2 gap-2 mt-auto">
                    <Skeleton className="h-8 flex-1 rounded-md" />
                    <Skeleton className="h-8 flex-1 rounded-md" />
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : requirements.length === 0 ? (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-24 h-24 bg-default-100 rounded-full flex items-center justify-center">
                    <Code className="w-12 h-12 text-default-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-default-700">
                      {t("requirements.noApprovedRequirements")}
                    </h3>
                    <p className="text-default-500">
                      {t("requirements.noApprovedRequirementsDesc")}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <>
            {/* Grid View */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requirements.map((requirement) => (
                <RequirementCard
                  key={requirement.id}
                  cardRef={(element) => {
                    if (element) {
                      requirementRefs.current[requirement.id] = element;
                    }
                  }}
                  convertTypeToString={convertTypeToString}
                  getPriorityColor={getPriorityColor}
                  getPriorityLabel={getPriorityLabel}
                  getStatusColor={getStatusColor}
                  getStatusText={getStatusText}
                  isHighlighted={highlightedRequirementId === requirement.id}
                  requirement={requirement}
                  onCreateTask={openTaskModal}
                  onCreateTimeline={openTimelineModal}
                  onReturn={openReturnModal}
                  onViewDetails={openRequirementDetails}
                />
              ))}
            </div>

            {/* Grid-only UI (list view removed) */}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <GlobalPagination
              currentPage={currentPage}
              isLoading={loading}
              pageSize={pageSize}
              showInfo={true}
              totalItems={totalRequirements}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {/* Requirement Details Drawer */}
        <RequirementDetailsDrawer
          getPriorityColor={getPriorityColor}
          getPriorityLabel={getPriorityLabel}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
          isOpen={isDrawerOpen}
          requirement={selectedRequirement}
          showTaskTimelineButtons={true}
          onCreateTask={openTaskModal}
          onCreateTimeline={openTimelineModal}
          onOpenChange={setIsDrawerOpen}
          onReturn={openReturnModal}
        />

        {/* Task Creation/Edit Modal */}
        <Modal
          isOpen={isTaskModalOpen}
          size="2xl"
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              resetTaskModal();
            }
          }}
        >
          <ModalContent className="max-h-[90vh]">
            {(_onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">
                      {selectedRequirement?.requirementTask
                        ? t("tasks.editTask")
                        : t("tasks.createTask")}
                    </h2>
                    <Popover placement="bottom">
                      <PopoverTrigger>
                        <Button
                          isIconOnly
                          className="text-default-400 hover:text-default-600"
                          size="sm"
                          variant="light"
                        >
                          <Info className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <div className="px-1 py-2">
                          <div className="text-small font-bold">
                            {t("common.info")}
                          </div>
                          <div className="text-tiny text-default-600 max-w-xs">
                            {t("tasks.assignmentNoteInfo")}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </ModalHeader>
                <ModalBody className="overflow-y-auto flex-1">
                  <div className="mb-4">
                    <label className="text-sm font-medium text-default-700">
                      {t("tasks.taskName")}
                    </label>
                    <p className="text-sm text-default-500 mt-1">
                      {selectedRequirement?.name}
                    </p>
                  </div>
                  <div className="space-y-4">
                    {/* Task Description */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-default-700">
                        {t("tasks.description")}
                      </label>
                      <div className="rounded-lg border border-default-200 overflow-hidden">
                        <div style={{ height: "150px" }}>
                          <ReactQuill
                            className={language === "ar" ? "rtl-editor" : ""}
                            modules={{
                              toolbar: [
                                ["bold", "italic", "underline"],
                                [{ list: "ordered" }, { list: "bullet" }],
                                ["clean"],
                              ],
                            }}
                            placeholder={t("tasks.taskDescriptionPlaceholder")}
                            style={{
                              height: "100%",
                            }}
                            theme="snow"
                            value={taskDescription || ""}
                            onChange={setTaskDescription}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="p-3 bg-default-50 rounded-lg">
                      <p className="text-xs text-default-600">
                        {t("tasks.assignmentNote")}
                      </p>
                    </div>

                    {/* Developer Selection */}
                    <div>
                      <label className="text-sm font-medium text-default-700 mb-2 block">
                        {t("tasks.developer")}{" "}
                        <span className="text-danger">*</span>
                      </label>
                      <Autocomplete
                        defaultFilter={() => true}
                        inputValue={developerInputValue}
                        isLoading={loadingDevelopers}
                        placeholder={t("tasks.selectDeveloper")}
                        onInputChange={(value) => {
                          setDeveloperInputValue(value);
                          searchDevelopers(value);
                        }}
                        onSelectionChange={(key) => {
                          const developer = developers.find(
                            (dev) => dev.id.toString() === String(key),
                          );

                          if (
                            developer &&
                            !selectedDevelopers.find(
                              (d) => d.id === developer.id,
                            )
                          ) {
                            setSelectedDevelopers([
                              ...selectedDevelopers,
                              developer,
                            ]);
                            setDeveloperInputValue("");
                          }
                        }}
                      >
                        {developers
                          .filter(
                            (dev) =>
                              !selectedDevelopers.find(
                                (sd) => sd.id === dev.id,
                              ),
                          )
                          .map((developer) => (
                            <AutocompleteItem
                              key={developer.id.toString()}
                              textValue={`${developer.gradeName} ${developer.fullName} ${developer.userName} ${developer.militaryNumber}`}
                            >
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {developer.fullName}
                                </span>
                                <span className="text-xs text-default-500">
                                  {developer.militaryNumber} -{" "}
                                  {developer.gradeName}
                                </span>
                              </div>
                            </AutocompleteItem>
                          ))}
                      </Autocomplete>
                      {selectedDevelopers.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {selectedDevelopers.map((developer) => (
                            <Chip
                              key={developer.id}
                              color="primary"
                              size="sm"
                              variant="flat"
                              onClose={() => {
                                setSelectedDevelopers(
                                  selectedDevelopers.filter(
                                    (d) => d.id !== developer.id,
                                  ),
                                );
                              }}
                            >
                              {developer.fullName}
                            </Chip>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Developer Dates - Applied to all selected developers */}
                    {selectedDevelopers.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-default-700">
                          {t("tasks.developerDates")}{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <p className="text-xs text-default-500 mb-2">
                          {t("tasks.sharedDatesNote")}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <DatePicker
                            label={t("tasks.startDate")}
                            //minValue={today(getLocalTimeZone())}
                            value={developerStartDate}
                            onChange={(date) => {
                              setDeveloperStartDate(date);
                              // Clear validation error when user changes date
                              if (dateValidationErrors.developer) {
                                setDateValidationErrors((prev) => ({
                                  ...prev,
                                  developer: undefined,
                                }));
                              }
                            }}
                          />
                          <DatePicker
                            label={t("tasks.endDate")}
                            //minValue={today(getLocalTimeZone())}
                            value={developerEndDate}
                            onChange={(date) => {
                              setDeveloperEndDate(date);
                              // Clear validation error when user changes date
                              if (dateValidationErrors.developer) {
                                setDateValidationErrors((prev) => ({
                                  ...prev,
                                  developer: undefined,
                                }));
                              }
                            }}
                          />
                        </div>
                        {dateValidationErrors.developer && (
                          <p className="text-xs text-danger mt-1">
                            {dateValidationErrors.developer}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Expected End Date Display (Optional reference) */}
                    {selectedDevelopers.length > 0 &&
                      selectedRequirement?.expectedCompletionDate && (
                        <div className="p-3 bg-default-50 dark:bg-default-100/20 rounded-lg border border-default-200">
                          <p className="text-xs text-default-600">
                            <span className="font-medium">
                              {t("requirements.expectedCompletion")}:
                            </span>{" "}
                            {formatDate(
                              selectedRequirement.expectedCompletionDate,
                            )}
                          </p>
                          <p className="text-xs text-default-500 mt-1">
                            {t("tasks.expectedEndDateReference")}
                          </p>
                        </div>
                      )}

                    {/* QC Selection */}
                    <div>
                      <label className="text-sm font-medium text-default-700 mb-2 block">
                        {t("tasks.qcMember")}
                      </label>
                      <Autocomplete
                        defaultFilter={() => true}
                        inputValue={qcInputValue}
                        isLoading={loadingQC}
                        menuTrigger="focus"
                        placeholder={t("tasks.selectQC")}
                        selectedKey={selectedQC?.id?.toString() || ""}
                        onInputChange={(value) => {
                          setQcInputValue(value);
                          if (
                            selectedQC &&
                            value !==
                              `${selectedQC.gradeName} ${selectedQC.fullName}`
                          ) {
                            setSelectedQC(null);
                          }
                          searchQC(value);
                        }}
                        onSelectionChange={(key) => {
                          const qc = qcMembers.find(
                            (member) => member.id.toString() === String(key),
                          );

                          setSelectedQC(qc || null);
                          // Reset input and search to show all members
                          if (qc) {
                            setQcInputValue("");
                            searchQC("");
                          }
                        }}
                      >
                        {qcMembers.map((qcMember) => (
                          <AutocompleteItem
                            key={qcMember.id.toString()}
                            textValue={`${qcMember.gradeName} ${qcMember.fullName} ${qcMember.userName} ${qcMember.militaryNumber}`}
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {qcMember.gradeName} {qcMember.fullName}
                              </span>
                              <span className="text-xs text-default-500">
                                {qcMember.militaryNumber} - {qcMember.gradeName}
                              </span>
                            </div>
                          </AutocompleteItem>
                        ))}
                      </Autocomplete>
                      {selectedQC && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Chip
                            color="primary"
                            size="sm"
                            variant="flat"
                            onClose={() => {
                              setSelectedQC(null);
                              setQcInputValue("");
                              searchQC(""); // Reset search to show all QC members
                              setQcStartDate(null);
                              setQcEndDate(null);
                              // Clear validation errors for QC
                              setDateValidationErrors((prev) => ({
                                ...prev,
                                qc: undefined,
                              }));
                            }}
                          >
                            {selectedQC.fullName}
                          </Chip>
                        </div>
                      )}
                    </div>

                    {/* QC Dates */}
                    {selectedQC && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <DatePicker
                            label={t("tasks.startDate")}
                            //minValue={today(getLocalTimeZone())}
                            value={qcStartDate}
                            onChange={(date) => {
                              setQcStartDate(date);
                              // Clear validation error when user changes date
                              if (dateValidationErrors.qc) {
                                setDateValidationErrors((prev) => ({
                                  ...prev,
                                  qc: undefined,
                                }));
                              }
                            }}
                          />
                          <DatePicker
                            label={t("tasks.endDate")}
                            //minValue={today(getLocalTimeZone())}
                            value={qcEndDate}
                            onChange={(date) => {
                              setQcEndDate(date);
                              // Clear validation error when user changes date
                              if (dateValidationErrors.qc) {
                                setDateValidationErrors((prev) => ({
                                  ...prev,
                                  qc: undefined,
                                }));
                              }
                            }}
                          />
                        </div>
                        {dateValidationErrors.qc && (
                          <p className="text-xs text-danger mt-1">
                            {dateValidationErrors.qc}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Designer Selection */}
                    <div>
                      <label className="text-sm font-medium text-default-700 mb-2 block">
                        {t("tasks.designer")}
                      </label>
                      <Autocomplete
                        defaultFilter={() => true}
                        inputValue={designerInputValue}
                        isLoading={loadingDesigners}
                        menuTrigger="focus"
                        placeholder={t("tasks.selectDesigner")}
                        selectedKey={selectedDesigner?.id?.toString() || ""}
                        onInputChange={(value) => {
                          setDesignerInputValue(value);
                          if (
                            selectedDesigner &&
                            value !==
                              `${selectedDesigner.gradeName} ${selectedDesigner.fullName}`
                          ) {
                            setSelectedDesigner(null);
                          }
                          searchDesigners(value);
                        }}
                        onSelectionChange={(key) => {
                          const designer = designers.find(
                            (member) => member.id.toString() === String(key),
                          );

                          setSelectedDesigner(designer || null);
                          // Reset input and search to show all members
                          if (designer) {
                            setDesignerInputValue("");
                            searchDesigners("");
                          }
                        }}
                      >
                        {designers.map((designer) => (
                          <AutocompleteItem
                            key={designer.id.toString()}
                            textValue={`${designer.gradeName} ${designer.fullName} ${designer.userName} ${designer.militaryNumber}`}
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {designer.gradeName} {designer.fullName}
                              </span>
                              <span className="text-xs text-default-500">
                                {designer.militaryNumber} - {designer.gradeName}
                              </span>
                            </div>
                          </AutocompleteItem>
                        ))}
                      </Autocomplete>
                      {selectedDesigner && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Chip
                            color="primary"
                            size="sm"
                            variant="flat"
                            onClose={() => {
                              setSelectedDesigner(null);
                              setDesignerInputValue("");
                              searchDesigners(""); // Reset search to show all designers
                              setDesignerStartDate(null);
                              setDesignerEndDate(null);
                              // Clear validation errors for designer
                              setDateValidationErrors((prev) => ({
                                ...prev,
                                designer: undefined,
                              }));
                            }}
                          >
                            {selectedDesigner.fullName}
                          </Chip>
                        </div>
                      )}
                    </div>

                    {/* Designer Dates */}
                    {selectedDesigner && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <DatePicker
                            label={t("tasks.startDate")}
                            //minValue={today(getLocalTimeZone())}
                            value={designerStartDate}
                            onChange={(date) => {
                              setDesignerStartDate(date);
                              // Clear validation error when user changes date
                              if (dateValidationErrors.designer) {
                                setDateValidationErrors((prev) => ({
                                  ...prev,
                                  designer: undefined,
                                }));
                              }
                            }}
                          />
                          <DatePicker
                            label={t("tasks.endDate")}
                            //minValue={today(getLocalTimeZone())}
                            value={designerEndDate}
                            onChange={(date) => {
                              setDesignerEndDate(date);
                              // Clear validation error when user changes date
                              if (dateValidationErrors.designer) {
                                setDateValidationErrors((prev) => ({
                                  ...prev,
                                  designer: undefined,
                                }));
                              }
                            }}
                          />
                        </div>
                        {dateValidationErrors.designer && (
                          <p className="text-xs text-danger mt-1">
                            {dateValidationErrors.designer}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </ModalBody>
                <ModalFooter className="flex flex-col gap-2 flex-shrink-0">
                  {selectedDevelopers.length === 0 &&
                    !selectedQC &&
                    !selectedDesigner && (
                      <p className="text-xs text-danger text-center w-full">
                        {t("tasks.selectAtLeastOne")}
                      </p>
                    )}
                  <div className="flex justify-end gap-2 w-full">
                    <Button
                      color="danger"
                      variant="light"
                      onPress={resetTaskModal}
                    >
                      {t("common.cancel")}
                    </Button>
                    {hasPermission({
                      actions: selectedRequirement?.requirementTask
                        ? ["requirements.tasks.update"]
                        : ["requirements.tasks.create"],
                    }) && (
                      <Button
                        color="primary"
                        isDisabled={selectedDevelopers.length === 0}
                        isLoading={isCreatingTask}
                        onPress={handleTaskSubmit}
                      >
                        {selectedRequirement?.requirementTask
                          ? t("common.update")
                          : t("common.create")}
                      </Button>
                    )}
                  </div>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Timeline Creation Modal */}
        {hasPermission({
          actions: ["requirements.timelines.create"],
        }) && (
          <TimelineCreateModal
            initialDescription={timelineRequirement?.description}
            initialName={timelineRequirement?.name}
            isOpen={isTimelineModalOpen}
            loading={timelineLoading}
            projectId={timelineRequirement?.project?.id}
            onCreateTimeline={handleTimelineCreate}
            onOpenChange={setIsTimelineModalOpen}
          />
        )}

        {/* File Preview Modal */}
        <FilePreview
          previewState={previewState}
          onClose={closePreview}
          onDownload={downloadCurrentFile}
        />

        {/* Return Requirement Modal */}
        <Modal
          isOpen={isReturnModalOpen}
          size="lg"
          onOpenChange={(open) => {
            setIsReturnModalOpen(open);
            if (!open) {
              setRequirementToReturn(null);
              setReturnReason("");
            }
          }}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex items-center gap-2">
                  <CornerUpLeft className="w-5 h-5 text-danger" />
                  <span>{t("requirements.returnRequirement")}</span>
                </ModalHeader>
                <ModalBody>
                  <p className="text-default-600 mb-4">
                    {t("requirements.returnConfirmation")}
                  </p>
                  <Textarea
                    isRequired
                    label={t("requirements.returnReason")}
                    maxRows={6}
                    minRows={3}
                    placeholder={t("requirements.returnReasonPlaceholder")}
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                  />
                </ModalBody>
                <ModalFooter>
                  <Button
                    variant="light"
                    onPress={() => {
                      onClose();
                      setRequirementToReturn(null);
                      setReturnReason("");
                    }}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    color="default"
                    isDisabled={!returnReason.trim()}
                    isLoading={isReturning}
                    startContent={
                      <CornerUpLeft className="w-4 h-4 text-danger" />
                    }
                    onPress={() => handleReturnSubmit(onClose)}
                  >
                    {t("requirements.return")}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </>
  );
}
