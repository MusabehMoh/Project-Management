import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Textarea } from "@heroui/textarea";
import { DatePicker } from "@heroui/date-picker";
import { Divider } from "@heroui/divider";

import { useLanguage } from "@/contexts/LanguageContext";
import { useTimelineRequirements, type TimelineRequirement, type CreateTimelineFromRequirementRequest } from "@/hooks/useTimelineRequirements";
import { GlobalPagination } from "@/components/GlobalPagination";
import { SearchIcon, PlusIcon, EyeIcon, EditIcon, DeleteIcon, MoreVerticalIcon, CalendarIcon, ClockIcon } from "@/components/icons";

// Priority color mapping
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "critical": return "danger";
    case "high": return "warning";
    case "medium": return "primary";
    case "low": return "default";
    default: return "default";
  }
};

// Status color mapping
const getStatusColor = (status: string) => {
  switch (status) {
    case "pending": return "warning";
    case "timeline_created": return "primary";
    case "in_progress": return "secondary";
    case "completed": return "success";
    default: return "default";
  }
};

// Create Timeline Modal Form Data
interface CreateTimelineFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  assignedManager?: number;
}

export default function TimelinePlanningPage() {
  const { t, direction } = useLanguage();
  const navigate = useNavigate();

  // Timeline requirements hook
  const {
    timelineRequirements,
    stats,
    loading,
    error,
    currentPage,
    totalPages,
    totalRequirements,
    pageSize,
    filters,
    createTimelineFromRequirement,
    updateTimelineRequirement,
    deleteTimelineRequirement,
    updateFilters,
    handlePageChange,
    clearError,
    refreshData,
  } = useTimelineRequirements({ pageSize: 20 });

  // Modal states
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onOpenChange: onCreateOpenChange } = useDisclosure();
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onOpenChange: onDetailsOpenChange } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange } = useDisclosure();

  // Form states
  const [selectedRequirement, setSelectedRequirement] = useState<TimelineRequirement | null>(null);
  const [requirementToDelete, setRequirementToDelete] = useState<TimelineRequirement | null>(null);
  const [createTimelineData, setCreateTimelineData] = useState<CreateTimelineFormData>({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    assignedManager: undefined,
  });

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Filtered and searched data
  const filteredRequirements = useMemo(() => {
    let filtered = timelineRequirements;

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tr => 
        tr.requirement?.name.toLowerCase().includes(term) ||
        tr.requirement?.description.toLowerCase().includes(term) ||
        tr.requirement?.project?.applicationName.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(tr => tr.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter && priorityFilter !== "all") {
      filtered = filtered.filter(tr => tr.requirement?.priority === priorityFilter);
    }

    return filtered;
  }, [timelineRequirements, searchTerm, statusFilter, priorityFilter]);

  // Handle create timeline
  const handleCreateTimeline = (requirement: TimelineRequirement) => {
    if (!requirement.requirement) return;

    setSelectedRequirement(requirement);
    setCreateTimelineData({
      name: `Timeline for ${requirement.requirement.name}`,
      description: requirement.requirement.description,
      startDate: "",
      endDate: requirement.requirement.expectedCompletionDate,
      assignedManager: undefined,
    });
    onCreateOpen();
  };

  // Handle view details
  const handleViewDetails = (requirement: TimelineRequirement) => {
    setSelectedRequirement(requirement);
    onDetailsOpen();
  };

  // Handle edit timeline (navigate to timeline editor)
  const handleEditTimeline = (requirement: TimelineRequirement) => {
    if (requirement.timelineId) {
      navigate(`/timeline/${requirement.timelineId}`);
    }
  };

  // Handle delete
  const handleDeleteClick = (requirement: TimelineRequirement) => {
    setRequirementToDelete(requirement);
    onDeleteOpen();
  };

  // Submit create timeline
  const handleSubmitCreateTimeline = async () => {
    if (!selectedRequirement || !selectedRequirement.requirement) return;

    try {
      const data: CreateTimelineFromRequirementRequest = {
        requirementId: selectedRequirement.requirementId,
        name: createTimelineData.name,
        description: createTimelineData.description,
        startDate: createTimelineData.startDate,
        endDate: createTimelineData.endDate,
        assignedManager: createTimelineData.assignedManager,
      };

      await createTimelineFromRequirement(data);
      onCreateOpenChange();
      setSelectedRequirement(null);
      
      // Show success message or navigate to timeline
      // You can add notification here
    } catch (error) {
      // Error is handled by the hook
      console.error("Failed to create timeline:", error);
    }
  };

  // Submit delete
  const handleSubmitDelete = async () => {
    if (!requirementToDelete) return;

    try {
      await deleteTimelineRequirement(requirementToDelete.id);
      onDeleteOpenChange();
      setRequirementToDelete(null);
    } catch (error) {
      console.error("Failed to delete requirement:", error);
    }
  };

  // Stats cards
  const renderStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">{t("timelinePlanning.stats.total")}</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-400 rounded-lg">
              <CalendarIcon className="w-6 h-6" />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">{t("timelinePlanning.stats.pending")}</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
            <div className="p-3 bg-orange-400 rounded-lg">
              <ClockIcon className="w-6 h-6" />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">{t("timelinePlanning.stats.created")}</p>
              <p className="text-2xl font-bold">{stats.timelineCreated}</p>
            </div>
            <div className="p-3 bg-purple-400 rounded-lg">
              <PlusIcon className="w-6 h-6" />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100">{t("timelinePlanning.stats.inProgress")}</p>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
            </div>
            <div className="p-3 bg-teal-400 rounded-lg">
              <EditIcon className="w-6 h-6" />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">{t("timelinePlanning.stats.completed")}</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
            <div className="p-3 bg-green-400 rounded-lg">
              <CheckIcon className="w-6 h-6" />
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );

  // Filters and search
  const renderFiltersAndSearch = () => (
    <Card className="mb-6">
      <CardBody className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Input
            placeholder={t("timelinePlanning.search.placeholder")}
            startContent={<SearchIcon className="w-4 h-4 text-default-400" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            isClearable
            onClear={() => setSearchTerm("")}
          />

          <Select
            placeholder={t("timelinePlanning.filters.status")}
            selectedKeys={statusFilter ? [statusFilter] : []}
            onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
          >
            <SelectItem key="all">{t("common.all")}</SelectItem>
            <SelectItem key="pending">{t("timelinePlanning.status.pending")}</SelectItem>
            <SelectItem key="timeline_created">{t("timelinePlanning.status.created")}</SelectItem>
            <SelectItem key="in_progress">{t("timelinePlanning.status.inProgress")}</SelectItem>
            <SelectItem key="completed">{t("timelinePlanning.status.completed")}</SelectItem>
          </Select>

          <Select
            placeholder={t("timelinePlanning.filters.priority")}
            selectedKeys={priorityFilter ? [priorityFilter] : []}
            onSelectionChange={(keys) => setPriorityFilter(Array.from(keys)[0] as string)}
          >
            <SelectItem key="all">{t("common.all")}</SelectItem>
            <SelectItem key="critical">{t("requirements.priority.critical")}</SelectItem>
            <SelectItem key="high">{t("requirements.priority.high")}</SelectItem>
            <SelectItem key="medium">{t("requirements.priority.medium")}</SelectItem>
            <SelectItem key="low">{t("requirements.priority.low")}</SelectItem>
          </Select>

          <Button
            color="primary"
            variant="flat"
            onClick={refreshData}
            isLoading={loading}
          >
            {t("common.refresh")}
          </Button>
        </div>
      </CardBody>
    </Card>
  );

  return (
    <div className={`p-6 max-w-full ${direction === "rtl" ? "rtl" : "ltr"}`}>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {t("timelinePlanning.title")}
        </h1>
        <p className="text-default-600">
          {t("timelinePlanning.description")}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-danger-200 bg-danger-50">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-danger-600">{error}</p>
              <Button size="sm" variant="light" onPress={clearError}>
                {t("common.dismiss")}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Stats Cards */}
      {renderStatsCards()}

      {/* Filters and Search */}
      {renderFiltersAndSearch()}

      {/* Main Table */}
      <Card>
        <CardHeader className="pb-3">
          <h2 className="text-xl font-semibold">
            {t("timelinePlanning.table.title")} ({filteredRequirements.length})
          </h2>
        </CardHeader>
        <CardBody className="p-0">
          <Table
            aria-label="Timeline requirements table"
            className="min-h-[400px]"
            classNames={{
              wrapper: "shadow-none",
              th: "bg-default-100 text-default-700 font-semibold",
              td: "py-4",
            }}
          >
            <TableHeader>
              <TableColumn>{t("timelinePlanning.table.requirement")}</TableColumn>
              <TableColumn>{t("timelinePlanning.table.project")}</TableColumn>
              <TableColumn>{t("timelinePlanning.table.priority")}</TableColumn>
              <TableColumn>{t("timelinePlanning.table.status")}</TableColumn>
              <TableColumn>{t("timelinePlanning.table.expectedDate")}</TableColumn>
              <TableColumn>{t("timelinePlanning.table.actions")}</TableColumn>
            </TableHeader>
            <TableBody
              items={filteredRequirements}
              isLoading={loading}
              loadingContent={t("common.loading")}
              emptyContent={t("timelinePlanning.table.empty")}
            >
              {(requirement) => (
                <TableRow key={requirement.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">
                        {requirement.requirement?.name}
                      </p>
                      <p className="text-sm text-default-500 line-clamp-2">
                        {requirement.requirement?.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {requirement.requirement?.project?.applicationName}
                      </p>
                      <p className="text-sm text-default-500">
                        {requirement.requirement?.project?.owningUnit}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getPriorityColor(requirement.requirement?.priority || "medium")}
                      size="sm"
                      variant="flat"
                    >
                      {t(`requirements.priority.${requirement.requirement?.priority || "medium"}`)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getStatusColor(requirement.status)}
                      size="sm"
                      variant="flat"
                    >
                      {t(`timelinePlanning.status.${requirement.status}`)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {requirement.requirement?.expectedCompletionDate}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {requirement.status === "pending" && (
                        <Button
                          color="primary"
                          size="sm"
                          startContent={<PlusIcon />}
                          onPress={() => handleCreateTimeline(requirement)}
                        >
                          {t("timelinePlanning.actions.createTimeline")}
                        </Button>
                      )}
                      
                      {requirement.status === "timeline_created" && requirement.timelineId && (
                        <Button
                          color="secondary"
                          size="sm"
                          startContent={<EditIcon />}
                          onPress={() => handleEditTimeline(requirement)}
                        >
                          {t("timelinePlanning.actions.editTimeline")}
                        </Button>
                      )}

                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly size="sm" variant="light">
                            <MoreVerticalIcon />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                          onAction={(key) => {
                            if (key === "view") {
                              handleViewDetails(requirement);
                            } else if (key === "delete") {
                              handleDeleteClick(requirement);
                            }
                          }}
                        >
                          <DropdownItem key="view" startContent={<EyeIcon />}>
                            {t("common.view")}
                          </DropdownItem>
                          <DropdownItem 
                            key="delete" 
                            className="text-danger" 
                            color="danger"
                            startContent={<DeleteIcon />}
                          >
                            {t("common.delete")}
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="p-4 border-t border-divider">
            <GlobalPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </CardBody>
      </Card>

      {/* Create Timeline Modal */}
      <Modal 
        isOpen={isCreateOpen} 
        onOpenChange={onCreateOpenChange}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <h3 className="text-xl font-semibold">
                  {t("timelinePlanning.modals.createTimeline.title")}
                </h3>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  {/* Requirement Info */}
                  {selectedRequirement?.requirement && (
                    <Card className="bg-default-50">
                      <CardBody className="p-4">
                        <h4 className="font-medium mb-2">
                          {t("timelinePlanning.modals.createTimeline.sourceRequirement")}
                        </h4>
                        <p className="text-sm font-medium">
                          {selectedRequirement.requirement.name}
                        </p>
                        <p className="text-sm text-default-600 mt-1">
                          {selectedRequirement.requirement.description}
                        </p>
                      </CardBody>
                    </Card>
                  )}

                  <Input
                    label={t("timelinePlanning.modals.createTimeline.name")}
                    placeholder={t("timelinePlanning.modals.createTimeline.namePlaceholder")}
                    value={createTimelineData.name}
                    onChange={(e) => setCreateTimelineData(prev => ({ 
                      ...prev, 
                      name: e.target.value 
                    }))}
                    isRequired
                  />

                  <Textarea
                    label={t("timelinePlanning.modals.createTimeline.description")}
                    placeholder={t("timelinePlanning.modals.createTimeline.descriptionPlaceholder")}
                    value={createTimelineData.description}
                    onChange={(e) => setCreateTimelineData(prev => ({ 
                      ...prev, 
                      description: e.target.value 
                    }))}
                    rows={3}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="date"
                      label={t("timelinePlanning.modals.createTimeline.startDate")}
                      value={createTimelineData.startDate}
                      onChange={(e) => setCreateTimelineData(prev => ({ 
                        ...prev, 
                        startDate: e.target.value 
                      }))}
                      isRequired
                    />

                    <Input
                      type="date"
                      label={t("timelinePlanning.modals.createTimeline.endDate")}
                      value={createTimelineData.endDate}
                      onChange={(e) => setCreateTimelineData(prev => ({ 
                        ...prev, 
                        endDate: e.target.value 
                      }))}
                      isRequired
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  {t("common.cancel")}
                </Button>
                <Button 
                  color="primary" 
                  onPress={handleSubmitCreateTimeline}
                  isLoading={loading}
                  isDisabled={!createTimelineData.name || !createTimelineData.startDate || !createTimelineData.endDate}
                >
                  {t("timelinePlanning.modals.createTimeline.create")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Details Modal */}
      <Modal 
        isOpen={isDetailsOpen} 
        onOpenChange={onDetailsOpenChange}
        size="3xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <h3 className="text-xl font-semibold">
                  {t("timelinePlanning.modals.details.title")}
                </h3>
              </ModalHeader>
              <ModalBody>
                {selectedRequirement && (
                  <div className="space-y-6">
                    {/* Requirement Details */}
                    <div>
                      <h4 className="font-semibold mb-3">
                        {t("timelinePlanning.modals.details.requirement")}
                      </h4>
                      <Card className="bg-default-50">
                        <CardBody className="p-4 space-y-3">
                          <div>
                            <p className="text-sm text-default-600">
                              {t("requirements.name")}
                            </p>
                            <p className="font-medium">
                              {selectedRequirement.requirement?.name}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-default-600">
                              {t("requirements.description")}
                            </p>
                            <p>{selectedRequirement.requirement?.description}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-default-600">
                                {t("requirements.priority")}
                              </p>
                              <Chip
                                color={getPriorityColor(selectedRequirement.requirement?.priority || "medium")}
                                size="sm"
                                variant="flat"
                              >
                                {t(`requirements.priority.${selectedRequirement.requirement?.priority || "medium"}`)}
                              </Chip>
                            </div>
                            <div>
                              <p className="text-sm text-default-600">
                                {t("requirements.expectedDate")}
                              </p>
                              <p>{selectedRequirement.requirement?.expectedCompletionDate}</p>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </div>

                    {/* Project Details */}
                    {selectedRequirement.requirement?.project && (
                      <div>
                        <h4 className="font-semibold mb-3">
                          {t("timelinePlanning.modals.details.project")}
                        </h4>
                        <Card className="bg-default-50">
                          <CardBody className="p-4 space-y-3">
                            <div>
                              <p className="text-sm text-default-600">
                                {t("projects.applicationName")}
                              </p>
                              <p className="font-medium">
                                {selectedRequirement.requirement.project.applicationName}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-default-600">
                                  {t("projects.projectOwner")}
                                </p>
                                <p>{selectedRequirement.requirement.project.projectOwner}</p>
                              </div>
                              <div>
                                <p className="text-sm text-default-600">
                                  {t("projects.owningUnit")}
                                </p>
                                <p>{selectedRequirement.requirement.project.owningUnit}</p>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      </div>
                    )}

                    {/* Timeline Details */}
                    {selectedRequirement.timeline && (
                      <div>
                        <h4 className="font-semibold mb-3">
                          {t("timelinePlanning.modals.details.timeline")}
                        </h4>
                        <Card className="bg-default-50">
                          <CardBody className="p-4 space-y-3">
                            <div>
                              <p className="text-sm text-default-600">
                                {t("timeline.name")}
                              </p>
                              <p className="font-medium">
                                {selectedRequirement.timeline.name}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-default-600">
                                {t("timeline.description")}
                              </p>
                              <p>{selectedRequirement.timeline.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-default-600">
                                  {t("timeline.startDate")}
                                </p>
                                <p>{selectedRequirement.timeline.startDate}</p>
                              </div>
                              <div>
                                <p className="text-sm text-default-600">
                                  {t("timeline.endDate")}
                                </p>
                                <p>{selectedRequirement.timeline.endDate}</p>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      </div>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  {t("common.close")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <h3 className="text-xl font-semibold text-danger">
                  {t("timelinePlanning.modals.delete.title")}
                </h3>
              </ModalHeader>
              <ModalBody>
                <p>
                  {t("timelinePlanning.modals.delete.message")}
                </p>
                {requirementToDelete?.requirement && (
                  <Card className="bg-danger-50 border border-danger-200">
                    <CardBody className="p-3">
                      <p className="font-medium text-danger-800">
                        {requirementToDelete.requirement.name}
                      </p>
                    </CardBody>
                  </Card>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  {t("common.cancel")}
                </Button>
                <Button 
                  color="danger" 
                  onPress={handleSubmitDelete}
                  isLoading={loading}
                >
                  {t("common.delete")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
