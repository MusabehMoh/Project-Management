import type {
  ProjectRequirement,
  AssignedProject,
  CreateRequirementTaskRequest,
  ProjectRequirementAttachment,
} from "@/types/projectRequirement";
import type { MemberSearchResult } from "@/types/timeline";
import type { CreateTimelineRequest } from "@/types/timeline";

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import { Chip } from "@heroui/chip";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
} from "@heroui/drawer";
import { Search, Calendar, Code, Eye, Plus, Edit, X } from "lucide-react";

import { FilePreview } from "@/components/FilePreview";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApprovedRequirements } from "@/hooks/useApprovedRequirements";
import useTeamSearch from "@/hooks/useTeamSearch";
import { useTimeline } from "@/hooks/useTimeline";
import { usePermissions } from "@/hooks/usePermissions";
import { useRequirementStatus } from "@/hooks/useRequirementStatus";
import { usePriorityLookups } from "@/hooks/usePriorityLookups";
import { usePageTitle } from "@/hooks";
import { useFilePreview } from "@/hooks/useFilePreview";
import { projectRequirementsService } from "@/services/api/projectRequirementsService";
import TimelineCreateModal from "@/components/timeline/TimelineCreateModal";
import { GlobalPagination } from "@/components/GlobalPagination";
import RequirementDetailsDrawer from "@/components/RequirementDetailsDrawer";
import { PAGE_SIZE_OPTIONS, normalizePageSize } from "@/constants/pagination";
import { REQUIREMENT_STATUS } from "@/constants/projectRequirements";

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
  getStatusColor,
  getStatusText,
  getPriorityColor,
  getPriorityLabel,
  isHighlighted = false,
  cardRef,
}: {
  requirement: ProjectRequirement;
  onViewDetails: (requirement: ProjectRequirement) => void;
  onCreateTask: (requirement: ProjectRequirement) => void;
  onCreateTimeline: (requirement: ProjectRequirement) => void;
  getStatusColor: (
    status: number,
  ) => "warning" | "danger" | "primary" | "secondary" | "success" | "default";
  getStatusText: (status: number) => string;
  getPriorityColor: (
    priority: number,
  ) => "warning" | "danger" | "primary" | "secondary" | "success" | "default";
  getPriorityLabel: (priority: number) => string | undefined;
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
        <div className="flex items-center pt-2 gap-2 mt-auto">
          {hasPermission({
            actions: ["requirements.view"],
          }) && (
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
          )}

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
                  requirement.task ? (
                    <Edit className="w-3 h-3 flex-shrink-0" />
                  ) : (
                    <Plus className="w-3 h-3 flex-shrink-0" />
                  )
                }
                variant="faded"
                onPress={() => onCreateTask(requirement)}
              >
                {requirement.task
                  ? t("common.view") + " Task"
                  : t("common.create") + " Task"}
              </Button>
            )}

          {/* Business Rule: Show Timeline button only if requirement doesn't have task */}
          {!requirement.task &&
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
                  ? t("common.view") + " Timeline"
                  : t("common.create") + " Timeline"}
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

  // Handle file preview with attachment data
  const handleFilePreview = async (
    attachment: ProjectRequirementAttachment,
  ) => {
    try {
      // For previewable files, get the blob URL
      const blob = await projectRequirementsService.downloadAttachment(
        selectedRequirement?.id || 0,
        attachment.id,
      );

      // Create URL for preview
      const url = window.URL.createObjectURL(blob);

      await previewFile(attachment.originalName, url, attachment.fileSize);
    } catch {
      // If preview fails, just download the file
      await projectRequirementsService
        .downloadAttachment(selectedRequirement?.id || 0, attachment.id)
        .then((blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");

          a.href = url;
          a.download = attachment.originalName;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        });
    }
  };

  // Helper function to get status color using RequirementStatus lookup
  const getStatusColor = (status: number) => {
    return getRequirementStatusColor(status);
  };

  // Helper function to get status text using RequirementStatus lookup
  const getStatusText = (status: number) => {
    return getRequirementStatusName(status);
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
  });

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] =
    useState<ProjectRequirement | null>(null);

  // Task creation modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedDeveloper, setSelectedDeveloper] =
    useState<MemberSearchResult | null>(null);
  const [selectedQC, setSelectedQC] = useState<MemberSearchResult | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  // Controlled input values for Autocomplete components (needed by HeroUI Autocomplete)
  const [developerInputValue, setDeveloperInputValue] = useState<string>("");
  const [qcInputValue, setQcInputValue] = useState<string>("");

  // Timeline creation modal state
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [timelineRequirement, setTimelineRequirement] =
    useState<ProjectRequirement | null>(null);

  // Timeline hook for creating timelines
  const { createTimeline, loading: timelineLoading } = useTimeline();

  // Team search hooks for developers and QC
  const {
    employees: developers,
    loading: loadingDevelopers,
    searchEmployees: searchDevelopers,
  } = useTeamSearch({
    minLength: 2,
    maxResults: 15,
  });

  const {
    employees: qcMembers,
    loading: loadingQC,
    searchEmployees: searchQC,
  } = useTeamSearch({
    minLength: 2,
    maxResults: 15,
  });

  // Debug: log team search results to help diagnose autocomplete issues
  // Debug hooks intentionally left out to keep production linting clean.

  // Function to open drawer with requirement details
  const openRequirementDetails = (requirement: ProjectRequirement) => {
    setSelectedRequirement(requirement);
    setIsDrawerOpen(true);
  };

  // Function to open task creation modal
  const openTaskModal = (requirement: ProjectRequirement) => {
    setSelectedRequirement(requirement);
    setIsTaskModalOpen(true);
    // If task exists, pre-populate the form
    if (requirement.task) {
      const existingDev = developers.find(
        (dev) => dev.id === requirement.task?.developerId,
      );
      const existingQC = qcMembers.find(
        (qc) => qc.id === requirement.task?.qcId,
      );

      setSelectedDeveloper(existingDev || null);
      setSelectedQC(existingQC || null);
    }
  };

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
          await projectRequirementsService.updateRequirement(
            timelineRequirement.id,
            {
              id: timelineRequirement.id,
              status: REQUIREMENT_STATUS.UNDER_DEVELOPMENT,
            },
          );
        }

        setIsTimelineModalOpen(false);
        setTimelineRequirement(null);
        // Refresh data to get updated timeline information
        await refreshData();
      }

      return result;
    } catch (error) {
      throw error;
    }
  };

  // Function to handle task creation/update
  const handleTaskSubmit = async () => {
    if (!selectedRequirement) return;

    setIsCreatingTask(true);
    try {
      const taskData: CreateRequirementTaskRequest = {
        requirementId: selectedRequirement.id,
        developerId: selectedDeveloper?.id,
        qcId: selectedQC?.id,
      };

      // Call API to create/update task
      await projectRequirementsService.createRequirementTask(
        selectedRequirement.id,
        taskData,
      );

      // Update requirement status to in_development after task creation
      if (selectedRequirement.status === REQUIREMENT_STATUS.APPROVED) {
        await projectRequirementsService.updateRequirement(
          selectedRequirement.id,
          {
            id: selectedRequirement.id,
            status: REQUIREMENT_STATUS.UNDER_DEVELOPMENT,
          },
        );
      }

      setIsTaskModalOpen(false);
      setSelectedDeveloper(null);
      setSelectedQC(null);
      setDeveloperInputValue("");
      setQcInputValue("");

      // Refresh requirements data to get updated task info
      refreshData();
    } catch {
      // Handle error appropriately
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Function to reset task modal
  const resetTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedDeveloper(null);
    setSelectedQC(null);
    setSelectedRequirement(null);
    setDeveloperInputValue("");
    setQcInputValue("");
  };

  // edit/delete removed; grid is read-only

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
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

  if (loading && requirements.length === 0) {
    return (
      <>
        <div className="flex justify-center items-center min-h-96">
          <Spinner label={t("common.loading")} size="lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Code className="w-6 h-6" />
              {t("requirements.approvedRequirements")}
            </h1>
            <p className="text-default-500">
              {t("requirements.approvedRequirementsSubtitle")}
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardBody>
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
                selectedKeys={
                  filters.projectId ? [String(filters.projectId)] : []
                }
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0] as string;

                  setProjectFilter(val ? Number(val) : undefined);
                }}
              >
                <SelectItem key="">{t("taskPlan.allProjects")}</SelectItem>
                <>
                  {projects?.map((p: AssignedProject) => (
                    <SelectItem key={String(p.id)}>
                      {p.applicationName}
                    </SelectItem>
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
                {(item) => (
                  <SelectItem key={item.value}>{item.label}</SelectItem>
                )}
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
                {(item) => (
                  <SelectItem key={item.value}>{item.label}</SelectItem>
                )}
              </Select>

              {/* Grid-only view (no toggle) */}
            </div>

            {/* Clear Filters - New Row */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 mt-2">
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
          </CardBody>
        </Card>

        {/* Pagination Controls */}
        {requirements.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4">
            <div className="flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
              <span className="text-sm text-default-600">
                {t("common.show")}
              </span>
              <Select
                className="w-20"
                selectedKeys={[normalizePageSize(pageSize, 10).toString()]}
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
                currentPage={currentPage}
                isLoading={loading}
                pageSize={pageSize}
                showInfo={false}
                totalItems={totalRequirements}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        )}

        {/* Requirements Content */}
        {requirements.length === 0 ? (
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
                  getPriorityColor={getPriorityColor}
                  getPriorityLabel={getPriorityLabel}
                  getStatusColor={getStatusColor}
                  getStatusText={getStatusText}
                  isHighlighted={highlightedRequirementId === requirement.id}
                  requirement={requirement}
                  onCreateTask={openTaskModal}
                  onCreateTimeline={openTimelineModal}
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
          <ModalContent>
            {(_onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold">
                    {selectedRequirement?.task
                      ? t("tasks.editTask")
                      : t("tasks.createTask")}
                  </h2>
                  <p className="text-sm text-default-500">
                    {selectedRequirement?.name}
                  </p>
                </ModalHeader>
                <ModalBody>
                  <div className="space-y-4">
                    {/* Developer Selection */}
                    <div>
                      <label className="text-sm font-medium text-default-700 mb-2 block">
                        {t("tasks.developer")}
                      </label>
                      <Autocomplete
                        defaultFilter={() => true}
                        inputValue={developerInputValue}
                        isLoading={loadingDevelopers}
                        menuTrigger="input"
                        placeholder={t("tasks.selectDeveloper")}
                        selectedKey={selectedDeveloper?.id?.toString() || ""}
                        onInputChange={(value) => {
                          setDeveloperInputValue(value);
                          // clear selection if input no longer matches selected
                          if (
                            selectedDeveloper &&
                            value !==
                              `${selectedDeveloper.gradeName} ${selectedDeveloper.fullName}`
                          ) {
                            setSelectedDeveloper(null);
                          }
                          searchDevelopers(value);
                        }}
                        onSelectionChange={(key) => {
                          const developer = developers.find(
                            (dev) => dev.id.toString() === String(key),
                          );

                          setSelectedDeveloper(developer || null);
                        }}
                      >
                        {developers.map((developer) => (
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
                      {selectedDeveloper && (
                        <div className="mt-2">
                          <Chip color="primary" size="sm" variant="flat">
                            {selectedDeveloper.fullName}
                          </Chip>
                        </div>
                      )}
                    </div>

                    {/* QC Selection */}
                    <div>
                      <label className="text-sm font-medium text-default-700 mb-2 block">
                        {t("tasks.qcMember")}
                      </label>
                      <Autocomplete
                        defaultFilter={() => true}
                        inputValue={qcInputValue}
                        isLoading={loadingQC}
                        menuTrigger="input"
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
                        }}
                      >
                        {qcMembers.map((qcMember) => (
                          <AutocompleteItem
                            key={qcMember.id.toString()}
                            textValue={`${qcMember.gradeName} ${qcMember.fullName} ${qcMember.userName} ${qcMember.militaryNumber}`}
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {qcMember.fullName}
                              </span>
                              <span className="text-xs text-default-500">
                                {qcMember.militaryNumber} - {qcMember.gradeName}
                              </span>
                            </div>
                          </AutocompleteItem>
                        ))}
                      </Autocomplete>
                      {selectedQC && (
                        <div className="mt-2">
                          <Chip color="secondary" size="sm" variant="flat">
                            {selectedQC.fullName}
                          </Chip>
                        </div>
                      )}
                    </div>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button
                    color="danger"
                    variant="light"
                    onPress={resetTaskModal}
                  >
                    {t("common.cancel")}
                  </Button>
                  {hasPermission({
                    actions: selectedRequirement?.task
                      ? ["requirements.tasks.update"]
                      : ["requirements.tasks.create"],
                  }) && (
                    <Button
                      color="primary"
                      isDisabled={!selectedDeveloper && !selectedQC}
                      isLoading={isCreatingTask}
                      onPress={handleTaskSubmit}
                    >
                      {selectedRequirement?.task
                        ? t("common.update")
                        : t("common.create")}
                    </Button>
                  )}
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
      </div>
    </>
  );
}
