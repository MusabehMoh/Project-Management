import type {
  ProjectRequirement,
  AssignedProject,
  CreateRequirementTaskRequest,
} from "@/types/projectRequirement";
import type { MemberSearchResult } from "@/types/timeline";
import type { CreateTimelineRequest } from "@/types/timeline";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Search,
  Calendar,
  Code,
  Eye,
  Users,
  Paperclip,
  Download,
  Plus,
  Edit,
} from "lucide-react";

import { RefreshIcon } from "@/components/icons";

import { useLanguage } from "@/contexts/LanguageContext";
import { useDevelopmentRequirements } from "@/hooks/useDevelopmentRequirements";
import useTeamSearch from "@/hooks/useTeamSearch";
import { useTimeline } from "@/hooks/useTimeline";
import { usePermissions } from "@/hooks/usePermissions";
import { useRequirementStatus } from "@/hooks/useRequirementStatus";
import { usePageTitle } from "@/hooks";
import { projectRequirementsService } from "@/services/api/projectRequirementsService";
import TimelineCreateModal from "@/components/timeline/TimelineCreateModal";
import { GlobalPagination } from "@/components/GlobalPagination";
import { PAGE_SIZE_OPTIONS, normalizePageSize } from "@/constants/pagination";

// Utility functions for color mapping
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "danger";
    case "medium":
      return "warning";
    case "low":
      return "success";
    default:
      return "default";
  }
};

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
}: {
  requirement: ProjectRequirement;
  onViewDetails: (requirement: ProjectRequirement) => void;
  onCreateTask: (requirement: ProjectRequirement) => void;
  onCreateTimeline: (requirement: ProjectRequirement) => void;
  getStatusColor: (
    status: string | number,
  ) => "warning" | "danger" | "primary" | "secondary" | "success" | "default";
  getStatusText: (status: string | number) => string;
}) => {
  const { hasPermission } = usePermissions();
  const { t } = useLanguage();

  // Using the formatDate function defined above

  return (
    <Card className="h-full flex flex-col">
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
              {t(`requirements.${requirement.priority}`)}
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
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  // Set page title
  usePageTitle("requirements.developmentRequirements");

  // Requirement status hook for status management
  const { getRequirementStatusColor } = useRequirementStatus();

  // Helper function to convert string status to numeric code
  const convertStatusToCode = (status: string): number => {
    switch (status.toLowerCase()) {
      case "draft":
        return 1; // New
      case "approved":
        return 2; // Under Study
      case "in-development":
      case "in_development":
        return 3; // Under Development
      case "testing":
        return 4; // Under Testing
      case "completed":
        return 5; // Completed
      default:
        return 1; // Default to New
    }
  };

  // Helper function to get status color (handles both string and numeric)
  const getStatusColor = (
    status: string | number,
  ): "warning" | "danger" | "primary" | "secondary" | "success" | "default" => {
    if (typeof status === "string") {
      return getRequirementStatusColor(convertStatusToCode(status));
    }

    return getRequirementStatusColor(status);
  };

  // Helper function to get status text (handles both string and numeric)
  const getStatusText = (status: string | number): string => {
    if (typeof status === "string") {
      const statusCode = convertStatusToCode(status);

      return t(`requirementStatus.${statusCode}`);
    }

    return t(`requirementStatus.${status}`);
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
  } = useDevelopmentRequirements({
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
        if (timelineRequirement?.status === "approved") {
          await projectRequirementsService.updateRequirement(
            timelineRequirement.id,
            {
              id: timelineRequirement.id,
              status: "in_development",
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
      if (selectedRequirement.status === "approved") {
        await projectRequirementsService.updateRequirement(
          selectedRequirement.id,
          {
            id: selectedRequirement.id,
            status: "in_development",
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
  const [priorityFilter, setPriorityFilter] = useState<string>("");

  // Update filters when search/filter states change (with debouncing)
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      const newFilters = {
        ...(searchTerm && { search: searchTerm }),
        ...(priorityFilter && { priority: priorityFilter }),
      };

      updateFilters(newFilters);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, priorityFilter, updateFilters]);

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
              {t("requirements.developmentRequirements")}
            </h1>
            <p className="text-default-500">
              {t("requirements.developmentRequirementsSubtitle")}
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardBody>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <Input
                className="md:w-100"
                placeholder={t("requirements.searchRequirements")}
                startContent={<Search className="w-4 h-4" />}
                value={searchTerm}
                onValueChange={setSearchTerm}
              />

              {/* Project filter dropdown - appears before Priority */}
              <Select
                className="md:w-86"
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
                className="md:w-40"
                placeholder={t("requirements.filterByPriority")}
                selectedKeys={priorityFilter ? [priorityFilter] : []}
                onSelectionChange={(keys) =>
                  setPriorityFilter((Array.from(keys)[0] as string) || "")
                }
              >
                <SelectItem key="">
                  {t("requirements.allPriorities")}
                </SelectItem>
                <SelectItem key="high">{t("requirements.high")}</SelectItem>
                <SelectItem key="medium">{t("requirements.medium")}</SelectItem>
                <SelectItem key="low">{t("requirements.low")}</SelectItem>
              </Select>

              {/* Grid-only view (no toggle) */}

              {/* Page size selector */}
              <div className="flex items-center gap-2">
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

              {/* Reset filters button */}
              <div>
                <Button
                  isIconOnly
                  variant="bordered"
                  onPress={() => {
                    // Clear local UI filters
                    setSearchTerm("");
                    setPriorityFilter("");
                    // Clear hook/server filters
                    updateFilters({});
                    // Clear project filter if set
                    setProjectFilter(undefined);
                    // Refresh data
                    refreshData();
                  }}
                >
                  <RefreshIcon />
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

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
                      {t("requirements.noDevelopmentRequirements")}
                    </h3>
                    <p className="text-default-500">
                      {t("requirements.noDevelopmentRequirementsDesc")}
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
                  getStatusColor={getStatusColor}
                  getStatusText={getStatusText}
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
        <Drawer
          isOpen={isDrawerOpen}
          placement="right"
          size="lg"
          onOpenChange={setIsDrawerOpen}
        >
          <DrawerContent>
            <DrawerHeader className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold">
                {selectedRequirement?.name}
              </h2>
              <p className="text-sm text-default-500">
                {selectedRequirement?.project?.applicationName || "N/A"}
              </p>
            </DrawerHeader>
            <DrawerBody>
              {selectedRequirement && (
                <div className="space-y-6">
                  {/* Status and Priority */}
                  <div className="flex gap-4">
                    <Chip
                      color={getPriorityColor(selectedRequirement.priority)}
                      size="sm"
                      variant="flat"
                    >
                      {t(`requirements.${selectedRequirement.priority}`)}
                    </Chip>
                    <Chip
                      color={getStatusColor(selectedRequirement.status)}
                      size="sm"
                      variant="flat"
                    >
                      {getStatusText(selectedRequirement.status)}
                    </Chip>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {t("requirements.description")}
                    </h3>
                    <div className="bg-default-50 dark:bg-default-100/10 p-4 rounded-lg">
                      <p
                        dangerouslySetInnerHTML={{
                          __html: selectedRequirement.description,
                        }}
                        className="text-sm leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Expected Completion Date */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {t("requirements.expectedCompletion")}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-default-400" />
                      <span className="text-sm">
                        {formatDate(selectedRequirement.expectedCompletionDate)}
                      </span>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-default-600 mb-1">
                        {t("requirements.id")}
                      </h4>
                      <p className="text-sm">{selectedRequirement.id}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-default-600 mb-1">
                        {t("requirements.created")}
                      </h4>
                      <p className="text-sm">
                        {selectedRequirement.createdAt
                          ? formatDate(selectedRequirement.createdAt)
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Analysts Team */}
                  {selectedRequirement.project?.analysts && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <Users className="w-5 h-5 text-default-400" />
                        {t("projects.analysts")}
                      </h3>
                      <div className="bg-default-50 dark:bg-default-100/10 p-4 rounded-lg">
                        <div className="flex flex-wrap gap-2">
                          {selectedRequirement.project.analysts
                            .split(", ")
                            .map((analyst, index) => (
                              <Chip
                                key={index}
                                color="secondary"
                                size="sm"
                                variant="flat"
                              >
                                {analyst}
                              </Chip>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Attachments */}
                  {selectedRequirement.attachments &&
                    selectedRequirement.attachments.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                          <Paperclip className="w-5 h-5 text-default-400" />
                          {t("requirements.attachments")}
                        </h3>
                        <div className="space-y-2">
                          {selectedRequirement.attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="flex items-center justify-between p-3 bg-default-50 dark:bg-default-100/10 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <Paperclip className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    {attachment.originalName}
                                  </p>
                                  <p className="text-xs text-default-500">
                                    {(
                                      attachment.fileSize /
                                      1024 /
                                      1024
                                    ).toFixed(2)}{" "}
                                    MB
                                  </p>
                                </div>
                              </div>
                              {hasPermission({
                                actions: ["requirements.attachments.download"],
                              }) && (
                                <Button
                                  color="primary"
                                  size="sm"
                                  startContent={
                                    <Download className="w-4 h-4" />
                                  }
                                  variant="light"
                                >
                                  {t("projects.downloadFile")}
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
      </div>
    </>
  );
}
