import type {
  ProjectRequirement,
  AssignedProject,
  RequirementTask,
  CreateRequirementTaskRequest,
} from "@/types/projectRequirement";

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
import { Search, Calendar, Code, Eye, Users, Paperclip, Download, Plus, Edit } from "lucide-react";
import { RefreshIcon } from "@/components/icons";

import DefaultLayout from "@/layouts/default";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDevelopmentRequirements } from "@/hooks/useDevelopmentRequirements";
import useTeamSearch from "@/hooks/useTeamSearch";
import { useTimeline } from "@/hooks/useTimeline";
import type { MemberSearchResult } from "@/types/timeline";
import type { CreateTimelineRequest } from "@/types/timeline";
import { projectRequirementsService } from "@/services/api/projectRequirementsService";
import TimelineCreateModal from "@/components/timeline/TimelineCreateModal";

import { GlobalPagination } from "@/components/GlobalPagination";

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

const getStatusColor = (status: string) => {
  switch (status) {
    case "draft":
      return "default";
    case "in_development":
    case "in-development":
      return "secondary";
    case "completed":
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
}: { 
  requirement: ProjectRequirement;
  onViewDetails: (requirement: ProjectRequirement) => void;
  onCreateTask: (requirement: ProjectRequirement) => void;
  onCreateTimeline: (requirement: ProjectRequirement) => void;
}) => {
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
              {t(`requirements.${requirement.status.replace("-", "")}`)}
            </Chip>
          </div>
        </div>
      </CardHeader>

      <CardBody className="pt-0 flex-1 flex flex-col">
        <div className="space-y-4 flex-1">
          <div className="bg-default-50 dark:bg-default-100/10 p-3 rounded-lg">
            <p className="text-sm line-clamp-4">{requirement.description}</p>
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
            <Button
              size="sm"
              variant="flat"
              color="primary"
              startContent={<Eye className="w-4 h-4" />}
              onPress={() => onViewDetails(requirement)}
              className="flex-1"
            >
              {t("common.viewDetails")}
            </Button>
            
            {/* Business Rule: Show Task button only if requirement doesn't have timeline */}
            {!requirement.timeline && (
              <Button
                size="sm"
                variant="flat"
                color={requirement.task ? "warning" : "success"}
                startContent={requirement.task ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                onPress={() => onCreateTask(requirement)}
                className="flex-1"
              >
                {requirement.task ? t("common.view") + " Task" : t("common.create") + " Task"}
              </Button>
            )}
            
            {/* Business Rule: Show Timeline button only if requirement doesn't have task */}
            {!requirement.task && (
              <Button
                size="sm"
                variant="flat"
                color={requirement.timeline ? "primary" : "secondary"}
                startContent={<Calendar className="w-4 h-4" />}
                onPress={() => onCreateTimeline(requirement)}
                className="flex-1"
              >
                {requirement.timeline ? t("common.view") + " Timeline" : t("common.create") + " Timeline"}
              </Button>
            )}
          </div>
      </CardBody>
    </Card>
  );
};

// Form data type for editing requirements
interface RequirementFormData {
  name: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "draft" | "in_development" | "completed";
}

export default function DevelopmentRequirementsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  // Grid-only view

  const {
    requirements,
    loading,
    error,
    currentPage,
    totalPages,
    totalRequirements,
    pageSize,
    filters,
  // updateRequirement, deleteRequirement removed (read-only grid)
    updateFilters,
    handlePageChange,
    handlePageSizeChange,
    clearError,
    refreshData,
    projects,
    setProjectFilter,
  } = useDevelopmentRequirements({
    pageSize: 20,
  });

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<ProjectRequirement | null>(null);

  // Task creation modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedDeveloper, setSelectedDeveloper] = useState<MemberSearchResult | null>(null);
  const [selectedQC, setSelectedQC] = useState<MemberSearchResult | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  // Controlled input values for Autocomplete components (needed by HeroUI Autocomplete)
  const [developerInputValue, setDeveloperInputValue] = useState<string>("");
  const [qcInputValue, setQcInputValue] = useState<string>("");

  // Timeline creation modal state
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [timelineRequirement, setTimelineRequirement] = useState<ProjectRequirement | null>(null);

  // Timeline hook for creating timelines
  const { createTimeline, loading: timelineLoading } = useTimeline();

  // Team search hooks for developers and QC
  const {
    employees: developers,
    loading: loadingDevelopers,
    searchEmployees: searchDevelopers,
    searchResults: developerResults,
  } = useTeamSearch({
    minLength: 2,
    maxResults: 15,
  });

  const {
    employees: qcMembers,
    loading: loadingQC,
    searchEmployees: searchQC,
    searchResults: qcResults,
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
      const existingDev = developers.find(dev => dev.id === requirement.task?.developerId);
      const existingQC = qcMembers.find(qc => qc.id === requirement.task?.qcId);
      setSelectedDeveloper(existingDev || null);
      setSelectedQC(existingQC || null);
    }
  };

  // Function to handle timeline creation or navigation
  const openTimelineModal = (requirement: ProjectRequirement) => {
    if (requirement.timeline) {
      // If timeline exists, navigate to timeline details page
      navigate(`/timeline?projectId=${requirement.project?.id}&timelineId=${requirement.timeline.id}&requirementId=${requirement.id}`);
    } else {
      // If no timeline exists, open creation modal
      setTimelineRequirement(requirement);
      setIsTimelineModalOpen(true);
    }
  };

  // Function to handle timeline creation submission
  const handleTimelineCreate = async (data: CreateTimelineRequest): Promise<any> => {
    try {
      const timelineData = {
        ...data,
        projectRequirementId: timelineRequirement?.id,
      };
      const result = await createTimeline(timelineData);
      if (result) {
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

      setIsTaskModalOpen(false);
      setSelectedDeveloper(null);
      setSelectedQC(null);
      setDeveloperInputValue("");
      setQcInputValue("");

      // Refresh requirements data to get updated task info
      refreshData();
    } catch (error) {
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
      <DefaultLayout>
        <div className="flex justify-center items-center min-h-96">
          <Spinner size="lg" label={t("common.loading")} />
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
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

          {/* Stats Card */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                  <Code className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary">
                    {totalRequirements}
                  </div>
                  <div className="text-sm text-default-500">
                    {t("requirements.totalInDevelopment")}
                  </div>
                </div>
              </div>
              <Chip color="secondary" variant="flat">
                {t("requirements.inDevelopment")}
              </Chip>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardBody>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <Input
                placeholder={t("requirements.searchRequirements")}
                startContent={<Search className="w-4 h-4" />}
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="md:w-100"
              />

              {/* Project filter dropdown - appears before Priority */}
              <Select
                placeholder={t("taskPlan.filterByProject")}
                className="md:w-86"
                selectedKeys={filters.projectId ? [String(filters.projectId)] : []}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0] as string;
                  setProjectFilter(val ? Number(val) : undefined);
                }}
              >
                <SelectItem key="">{t("taskPlan.allProjects")}</SelectItem>
                {projects?.map((p: AssignedProject) => (
                  <SelectItem key={String(p.id)}>{p.applicationName}</SelectItem>
                ))}
              </Select>

              <Select
                placeholder={t("requirements.filterByPriority")}
                className="md:w-40"
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
                <span className="text-sm text-default-600">{t("common.show")}</span>
                <Select
                  className="w-20"
                  size="sm"
                  selectedKeys={[pageSize.toString()]}
                  onSelectionChange={(keys) => {
                    const newSize = parseInt(Array.from(keys)[0] as string);
                    handlePageSizeChange(newSize);
                  }}
                >
                  <SelectItem key="10">10</SelectItem>
                  <SelectItem key="20">20</SelectItem>
                  <SelectItem key="50">50</SelectItem>
                  <SelectItem key="100">100</SelectItem>
                </Select>
                <span className="text-sm text-default-600">{t("pagination.perPage")}</span>
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
                  requirement={requirement}
                  onViewDetails={openRequirementDetails}
                  onCreateTask={openTaskModal}
                  onCreateTimeline={openTimelineModal}
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
          onOpenChange={setIsDrawerOpen}
          size="lg"
          placement="right"
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
                      {t(`requirements.${selectedRequirement.status.replace("-", "")}`)}
                    </Chip>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {t("requirements.description")}
                    </h3>
                    <div className="bg-default-50 dark:bg-default-100/10 p-4 rounded-lg">
                      <p className="text-sm leading-relaxed">
                        {selectedRequirement.description}
                      </p>
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
                        {selectedRequirement.createdAt ? formatDate(selectedRequirement.createdAt) : "N/A"}
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
                          {selectedRequirement.project.analysts.split(', ').map((analyst, index) => (
                            <Chip
                              key={index}
                              size="sm"
                              variant="flat"
                              color="secondary"
                            >
                              {analyst}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Attachments */}
                  {selectedRequirement.attachments && selectedRequirement.attachments.length > 0 && (
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
                                  {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="light"
                              color="primary"
                              startContent={<Download className="w-4 h-4" />}
                            >
                              {t("projects.downloadFile")}
                            </Button>
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
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              resetTaskModal();
            }
          }} 
          size="2xl"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold">
                    {selectedRequirement?.task ? t("tasks.editTask") : t("tasks.createTask")}
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
                        menuTrigger="input"
                        defaultFilter={() => true}
                        inputValue={developerInputValue}
                        placeholder={t("tasks.selectDeveloper")}
                        selectedKey={selectedDeveloper?.id?.toString() || ""}
                        onInputChange={(value) => {
                          setDeveloperInputValue(value);
                          // clear selection if input no longer matches selected
                          if (
                            selectedDeveloper &&
                            value !== `${selectedDeveloper.gradeName} ${selectedDeveloper.fullName}`
                          ) {
                            setSelectedDeveloper(null);
                          }
                          searchDevelopers(value);
                        }}
                        onSelectionChange={(key) => {
                          const developer = developers.find(dev => dev.id.toString() === String(key));
                          setSelectedDeveloper(developer || null);
                        }}
                        isLoading={loadingDevelopers}
                      >
                        {developers.map((developer) => (
                          <AutocompleteItem
                            key={developer.id.toString()}
                            value={developer.id.toString()}
                            textValue={`${developer.gradeName} ${developer.fullName} ${developer.userName} ${developer.militaryNumber}`}
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{developer.fullName}</span>
                              <span className="text-xs text-default-500">
                                {developer.militaryNumber} - {developer.gradeName}
                              </span>
                            </div>
                          </AutocompleteItem>
                        ))}
                      </Autocomplete>
                      {selectedDeveloper && (
                        <div className="mt-2">
                          <Chip size="sm" color="primary" variant="flat">
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
                        menuTrigger="input"
                        defaultFilter={() => true}
                        inputValue={qcInputValue}
                        placeholder={t("tasks.selectQC")}
                        selectedKey={selectedQC?.id?.toString() || ""}
                        onInputChange={(value) => {
                          setQcInputValue(value);
                          if (
                            selectedQC &&
                            value !== `${selectedQC.gradeName} ${selectedQC.fullName}`
                          ) {
                            setSelectedQC(null);
                          }
                          searchQC(value);
                        }}
                        onSelectionChange={(key) => {
                          const qc = qcMembers.find(member => member.id.toString() === String(key));
                          setSelectedQC(qc || null);
                        }}
                        isLoading={loadingQC}
                      >
                        {qcMembers.map((qcMember) => (
                          <AutocompleteItem
                            key={qcMember.id.toString()}
                            value={qcMember.id.toString()}
                            textValue={`${qcMember.gradeName} ${qcMember.fullName} ${qcMember.userName} ${qcMember.militaryNumber}`}
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{qcMember.fullName}</span>
                              <span className="text-xs text-default-500">
                                {qcMember.militaryNumber} - {qcMember.gradeName}
                              </span>
                            </div>
                          </AutocompleteItem>
                        ))}
                      </Autocomplete>
                      {selectedQC && (
                        <div className="mt-2">
                          <Chip size="sm" color="secondary" variant="flat">
                            {selectedQC.fullName}
                          </Chip>
                        </div>
                      )}
                    </div>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={resetTaskModal}>
                    {t("common.cancel")}
                  </Button>
                  <Button 
                    color="primary" 
                    onPress={handleTaskSubmit}
                    isLoading={isCreatingTask}
                    isDisabled={!selectedDeveloper && !selectedQC}
                  >
                    {selectedRequirement?.task ? t("common.update") : t("common.create")}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Timeline Creation Modal */}
        <TimelineCreateModal
          isOpen={isTimelineModalOpen}
          onOpenChange={setIsTimelineModalOpen}
          onCreateTimeline={handleTimelineCreate}
          projectId={timelineRequirement?.project?.id}
          loading={timelineLoading}
          initialName={timelineRequirement?.name}
          initialDescription={timelineRequirement?.description}
        />
      </div>

    </DefaultLayout>
  );
}
