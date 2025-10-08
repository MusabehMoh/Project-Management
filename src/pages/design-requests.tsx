import type { ProjectRequirement } from "@/types/projectRequirement";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Avatar } from "@heroui/avatar";
import { addToast } from "@heroui/toast";
import {
  CheckCircle,
  Clock,
  LayoutGrid,
  LayoutList,
  FileText,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { usePermissions } from "@/hooks/usePermissions";
import { formatDateTime } from "@/utils/dateFormatter";
import { MemberSearchResult } from "@/types";
import {
  designRequestsService,
  projectRequirementsService,
  membersTasksService,
} from "@/services/api";
import { DesignRequestDto } from "@/services/api/designRequestsService";
import { GlobalPagination } from "@/components/GlobalPagination";
import { normalizePageSize } from "@/constants/pagination";
import RequirementDetailsDrawer from "@/components/RequirementDetailsDrawer";
import { useTeamSearch } from "@/hooks/useTeamSearch";

export function DesignRequestsPage() {
  const { t, language } = useLanguage();

  // We're importing usePermissions to maintain the hook call pattern
  usePermissions(); // Call hook without using its return value

  // State for design requests
  const [designRequests, setDesignRequests] = useState<DesignRequestDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<number | undefined>(
    undefined,
  );

  // Selected design request for modal
  const [selectedRequest, setSelectedRequest] =
    useState<DesignRequestDto | null>(null);

  // Modal state
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [designerId, setDesignerId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);

  // Designer selection state for autocomplete
  const [selectedDesigner, setSelectedDesigner] =
    useState<MemberSearchResult | null>(null);
  const [designerInputValue, setDesignerInputValue] = useState<string>("");

  // View type (grid or list)
  const [viewType, setViewType] = useState<"grid" | "list">("grid");

  // Requirement details drawer state
  const [isRequirementDrawerOpen, setIsRequirementDrawerOpen] = useState(false);
  // Requirement state
  const [selectedRequirement, setSelectedRequirement] =
    useState<ProjectRequirement | null>(null);

  const [requirementLoading, setRequirementLoading] = useState(false);

  // Team search for designer selection
  const {
    employees: designers,
    loading: designersLoading,
    searchEmployees: searchDesigners,
  } = useTeamSearch({
    minLength: 1,
    maxResults: 20,
    loadInitialResults: false, // Don't load users on page load
  });

  // Fetch design requests
  const fetchDesignRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await designRequestsService.getDesignRequests(
        currentPage,
        pageSize,
        undefined,
        undefined,
        statusFilter,
        true, // Include task details
        true, // Include requirement details
      );

      if (response.success) {
        if (Array.isArray(response.data)) {
          // Handle case where data is directly an array
          setDesignRequests(response.data);
          setTotalCount(response.data.length);
          setTotalPages(1);
        } else if (response.data && response.data.data) {
          // Handle case with pagination wrapper
          const { data, totalCount, totalPages } = response.data as {
            data: DesignRequestDto[];
            totalCount: number;
            totalPages: number;
          };

          setDesignRequests(data);
          setTotalCount(totalCount);
          setTotalPages(totalPages);
        } else {
          // No valid data structure found
          setError("Invalid data structure received");
        }
      } else {
        setError(response.message || t("designRequests.errorLoading"));
      }
    } catch {
      setError(t("designRequests.errorLoading"));
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, statusFilter, t]);

  // Load design requests on mount and when dependencies change
  useEffect(() => {
    fetchDesignRequests();
  }, [fetchDesignRequests]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string | null) => {
    setStatusFilter(value ? parseInt(value) : undefined);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  // Handle assigning a design request
  const handleAssign = (request: DesignRequestDto) => {
    setSelectedRequest(request);
    setDesignerId(null);
    setNotes("");
    setModalError(null);
    setSelectedDesigner(null);
    setDesignerInputValue("");
    onOpen();
  };

  // Handle assign submit
  const handleAssignSubmit = async () => {
    if (!selectedRequest || !designerId) {
      setModalError(t("designRequests.designerRequired"));

      return;
    }

    setAssignLoading(true);
    setModalError(null);

    try {
      const response = await designRequestsService.assignDesignRequest(
        selectedRequest.id,
        designerId,
        notes,
      );

      if (response.success) {
        addToast({
          title: t("designRequests.assignSuccess"),
          color: "success",
        });

        onClose();
        fetchDesignRequests(); // Refresh the list
      } else {
        setModalError(response.message || t("designRequests.assignError"));
      }
    } catch (err) {
      setModalError(t("designRequests.assignError"));
    } finally {
      setAssignLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";

    return formatDateTime(dateString, { language });
  };

  // Get status text
  const getStatusText = (status?: number) => {
    switch (status) {
      case 1:
        return t("designRequests.unassigned");
      case 2:
        return t("designRequests.assigned");
      case 3:
        return t("completed");
      default:
        return t("designRequests.unassigned");
    }
  };

  // Get status color
  const getStatusColor = (
    status?: number,
  ): "warning" | "success" | "danger" | "primary" | "secondary" | "default" => {
    switch (status) {
      case 1:
        return "warning";
      case 2:
        return "primary";
      case 3:
        return "success";
      default:
        return "default";
    }
  };

  // Handle view requirement details
  const handleViewDetails = async (request: DesignRequestDto) => {
    if (!request || !request.taskId) return;

    setRequirementLoading(true);

    try {
      // Check if the request already has requirement details
      if (request.requirementDetails) {
        // If we already have requirement details from the API, use them
        setSelectedRequirement(request.requirementDetails);
        setIsRequirementDrawerOpen(true);
      }
      // If we have task details with a requirement ID but no requirement details
      else if (request.task?.requirementId || request.task?.requirement?.id) {
        // Get the requirement ID either directly or from the nested requirement object
        const requirementId =
          request.task.requirementId ||
          (request.task.requirement?.id
            ? parseInt(request.task.requirement.id)
            : undefined);

        if (requirementId) {
          // Get the requirement details using the task's requirement ID
          const reqResponse =
            await projectRequirementsService.getRequirementById(requirementId);

          if (reqResponse.success && reqResponse.data) {
            setSelectedRequirement(reqResponse.data);
            setIsRequirementDrawerOpen(true);
          } else {
            addToast({
              title: t("designRequests.errorRequirementNotFound"),
              color: "danger",
            });
          }
        } else {
          addToast({
            title: t("designRequests.errorTaskNotFound"),
            color: "danger",
          });
        }
      }
      // If we don't have any requirement info, fetch task details first
      else {
        // Get task details to find the requirement ID
        const taskResponse = await membersTasksService.getTaskById(
          request.taskId.toString(),
        );

        if (taskResponse.success && taskResponse.data?.requirement?.id) {
          // Now get the requirement details
          const reqResponse =
            await projectRequirementsService.getRequirementById(
              parseInt(taskResponse.data.requirement.id),
            );

          if (reqResponse.success && reqResponse.data) {
            setSelectedRequirement(reqResponse.data);
            setIsRequirementDrawerOpen(true);
          } else {
            addToast({
              title: t("designRequests.errorRequirementNotFound"),
              color: "danger",
            });
          }
        } else {
          addToast({
            title: t("designRequests.errorTaskNotFound"),
            color: "danger",
          });
        }
      }
    } catch {
      addToast({
        title: t("designRequests.errorLoadingDetails"),
        color: "danger",
      });
    } finally {
      setRequirementLoading(false);
    }
  };

  // Get requirement status text
  const getRequirementStatusText = (status: number) => {
    switch (status) {
      case 1:
        return t("requirements.status.new");
      case 2:
        return t("requirements.status.underStudy");
      case 3:
        return t("requirements.status.underDevelopment");
      case 4:
        return t("requirements.status.underTesting");
      case 5:
        return t("requirements.status.completed");
      case 6:
        return t("requirements.status.approved");
      default:
        return t("requirements.status.unknown");
    }
  };

  // Get requirement priority text
  const getRequirementPriorityText = (priority: number) => {
    switch (priority) {
      case 1:
        return t("priority.low");
      case 2:
        return t("priority.medium");
      case 3:
        return t("priority.high");
      case 4:
        return t("priority.critical");
      default:
        return t("priority.unknown");
    }
  };

  // Get requirement priority color
  const getRequirementPriorityColor = (
    priority: number,
  ): "warning" | "success" | "danger" | "primary" | "secondary" | "default" => {
    switch (priority) {
      case 1:
        return "success";
      case 2:
        return "primary";
      case 3:
        return "warning";
      case 4:
        return "danger";
      default:
        return "default";
    }
  };

  // Render Grid View
  const renderGridView = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="h-64 animate-pulse">
              <CardBody className="bg-default-100" />
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Card className="w-full">
          <CardBody className="text-center text-danger">{error}</CardBody>
        </Card>
      );
    }

    if (!designRequests || designRequests.length === 0) {
      return (
        <Card className="w-full">
          <CardBody className="text-center">
            {t("designRequests.noRequests")}
          </CardBody>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {designRequests.map((request) => (
          <Card key={request.id} className="overflow-hidden">
            <CardHeader className="flex justify-between items-center">
              <h3 className="text-lg font-semibold truncate flex-1">
                {request.taskId} -{" "}
                {request.assignedToUserName || t("designRequests.unassigned")}
              </h3>
              <Chip
                color={getStatusColor(request.status)}
                size="sm"
                variant="flat"
              >
                {getStatusText(request.status)}
              </Chip>
            </CardHeader>

            <CardBody>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    {formatDate(request.createdAt)}
                  </span>
                </div>

                {request.notes && (
                  <div
                    className={`mt-2 text ${language === "ar" ? "text-right" : "text-left"}`}
                  >
                    <h4 className="text-sm font-semibold">
                      {t("designRequests.notes")}:
                    </h4>
                    <p className="text-sm mt-1">{request.notes}</p>
                  </div>
                )}

                {request.assignedToUserName && (
                  <div className="mt-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">
                      {request.assignedToUserName}
                    </span>
                  </div>
                )}
              </div>
            </CardBody>

            <CardFooter className="flex flex-col gap-2">
              <div className="flex gap-2 w-full">
                <Button
                  className="flex-1"
                  color="secondary"
                  startContent={<FileText size={16} />}
                  variant="flat"
                  onClick={() => handleViewDetails(request)}
                >
                  {t("designRequests.viewDetails")}
                </Button>

                {request.status === 1 && (
                  <Button
                    className="flex-1"
                    color="primary"
                    variant="flat"
                    onClick={() => handleAssign(request)}
                  >
                    {t("designRequests.assign")}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  // Render List View
  const renderListView = () => {
    if (error) {
      return (
        <Card className="w-full">
          <CardBody className="text-center text-danger">{error}</CardBody>
        </Card>
      );
    }

    if (!designRequests || designRequests.length === 0) {
      return (
        <Card className="w-full">
          <CardBody className="text-center">
            {t("designRequests.noRequests")}
          </CardBody>
        </Card>
      );
    }

    return (
      <Table aria-label="Design Requests Table">
        <TableHeader>
          <TableColumn>{t("designRequests.taskName")}</TableColumn>
          <TableColumn>{t("designRequests.requestDate")}</TableColumn>
          <TableColumn>{t("designRequests.status")}</TableColumn>
          <TableColumn>{t("designRequests.notes")}</TableColumn>
          <TableColumn>{t("actions")}</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={t("designRequests.noRequests")}
          isLoading={loading}
          loadingContent={t("designRequests.loadingRequests")}
        >
          {designRequests &&
            designRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>Task ID: {request.taskId}</TableCell>
                <TableCell>{formatDate(request.createdAt)}</TableCell>
                <TableCell>
                  <Chip
                    color={getStatusColor(request.status)}
                    size="sm"
                    variant="flat"
                  >
                    {getStatusText(request.status)}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs truncate">
                    {request.notes || "-"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      color="secondary"
                      size="sm"
                      startContent={<FileText size={16} />}
                      variant="flat"
                      onClick={() => handleViewDetails(request)}
                    >
                      {t("designRequests.viewDetails")}
                    </Button>

                    {request.status === 1 && (
                      <Button
                        color="primary"
                        size="sm"
                        variant="flat"
                        onClick={() => handleAssign(request)}
                      >
                        {t("designRequests.assign")}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("designRequests.title")}</h1>
          <p className="text-default-500">{t("designRequests.subtitle")}</p>
        </div>

        <div className="flex gap-3 items-center">
          <Select
            aria-label={t("filter")}
            className="w-40"
            label={t("filter")}
            selectedKeys={
              statusFilter !== undefined ? [statusFilter.toString()] : []
            }
            onChange={handleStatusFilterChange}
          >
            <SelectItem key="" value="">
              {t("designRequests.filter.all")}
            </SelectItem>
            <SelectItem key="1" value="1">
              {t("designRequests.filter.unassigned")}
            </SelectItem>
            <SelectItem key="2" value="2">
              {t("designRequests.filter.assigned")}
            </SelectItem>
          </Select>

          <Button
            isIconOnly
            aria-label="Grid View"
            color={viewType === "grid" ? "primary" : "default"}
            variant="flat"
            onClick={() => setViewType("grid")}
          >
            <LayoutGrid size={20} />
          </Button>

          <Button
            isIconOnly
            aria-label="List View"
            color={viewType === "list" ? "primary" : "default"}
            variant="flat"
            onClick={() => setViewType("list")}
          >
            <LayoutList size={20} />
          </Button>
        </div>
      </div>

      {/* Render content based on view type */}
      {loading ? (
        <Card className="w-full">
          <CardBody className="text-center">
            {t("designRequests.loadingRequests")}
          </CardBody>
        </Card>
      ) : viewType === "grid" ? (
        renderGridView()
      ) : (
        renderListView()
      )}

      {/* Pagination */}
      <div className="mt-8 flex justify-center">
        <GlobalPagination
          currentPage={currentPage}
          pageSize={normalizePageSize(pageSize, 10)}
          totalItems={totalCount}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Assign Modal */}
      <Modal isOpen={isOpen} size="2xl" onClose={onClose}>
        <ModalContent className="max-h-[90vh]">
          <ModalHeader className="text-center">
            {t("designRequests.assignTo")}
          </ModalHeader>

          <ModalBody className="overflow-y-auto">
            <div className="space-y-6">
              {/* Assignment Controls - Moved to top for better UX */}
              <div className="space-y-4">
                <div>
                  <Autocomplete
                    isClearable
                    isLoading={designersLoading}
                    label={t("designRequests.selectDesigner")}
                    menuTrigger="input"
                    placeholder={t("designRequests.selectDesigner")}
                    selectedKey={selectedDesigner?.id.toString()}
                    inputValue={designerInputValue}
                    // Disable client-side filtering; we already filter on the server
                    defaultFilter={(_textValue, _input) => true}
                    onInputChange={(value) => {
                      setDesignerInputValue(value);
                      if (
                        selectedDesigner &&
                        value !==
                          `${selectedDesigner.gradeName} ${selectedDesigner.fullName}`
                      ) {
                        setSelectedDesigner(null);
                        setDesignerId(null);
                      }
                      searchDesigners(value);
                      if (modalError) {
                        setModalError(null);
                      }
                    }}
                    onSelectionChange={(key) => {
                      if (key) {
                        const selectedDesigner = designers.find(
                          (d) => d.id.toString() === key,
                        );

                        if (selectedDesigner) {
                          setSelectedDesigner(selectedDesigner);
                          setDesignerId(selectedDesigner.id);
                          setDesignerInputValue(
                            `${selectedDesigner.gradeName} ${selectedDesigner.fullName}`,
                          );
                          setModalError(null);
                        }
                      } else {
                        setSelectedDesigner(null);
                        setDesignerId(null);
                        setDesignerInputValue("");
                      }
                    }}
                  >
                    {designers.map((designer) => (
                      <AutocompleteItem
                        key={designer.id.toString()}
                        // Include username, military number, and department to improve matching
                        textValue={`${designer.gradeName} ${designer.fullName} ${designer.userName} ${designer.militaryNumber} ${designer.department}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={designer.fullName || "Unknown"}
                            size="sm"
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {designer.gradeName}{" "}
                              {designer.fullName || "Unknown User"}
                            </span>
                            <span className="text-sm text-default-500">
                              {designer.militaryNumber || "N/A"}
                            </span>
                            <span className="text-xs text-default-400">
                              @{designer.userName || "unknown"}
                            </span>
                            <span className="text-xs text-default-400">
                              @{designer.department || "unknown"}
                            </span>
                          </div>
                        </div>
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>
                  {modalError && (
                    <div className="text-danger text-sm mt-1">{modalError}</div>
                  )}
                </div>

                <div>
                  <Textarea
                    label={t("designRequests.assignmentNotes")}
                    minRows={3}
                    placeholder={t("designRequests.assignmentNotesPlaceholder")}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Task Details Section - Moved below controls */}
              <div className="border border-default-200 rounded-lg p-4 bg-default-50/50 dark:bg-default-100/50 max-h-80 overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4 text-default-900 dark:text-default-100">
                  {t("taskDetails")}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column - Task Info */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-default-600 dark:text-default-400">
                        {t("designRequests.taskName")}
                      </label>
                      <p className="text-sm text-default-900 dark:text-default-100 mt-1">
                        {selectedRequest?.task?.name ||
                          t("common.notAvailable")}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-default-600 dark:text-default-400">
                        {t("designRequests.requestDate")}
                      </label>
                      <p className="text-sm text-default-900 dark:text-default-100 mt-1">
                        {formatDate(selectedRequest?.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Right Column - Status & Priority */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-default-600 dark:text-default-400">
                        {t("status")}
                      </label>
                      <div className="mt-1">
                        {selectedRequest?.task?.statusId && (
                          <Chip
                            color={getStatusColor(
                              selectedRequest.task.statusId,
                            )}
                            size="sm"
                            variant="flat"
                          >
                            {getStatusText(selectedRequest.task.statusId)}
                          </Chip>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-default-600 dark:text-default-400">
                        {t("priority")}
                      </label>
                      <div className="mt-1">
                        {selectedRequest?.task?.priorityId && (
                          <Chip
                            color={getRequirementPriorityColor(
                              selectedRequest.task.priorityId,
                            )}
                            size="sm"
                            variant="solid"
                          >
                            {getRequirementPriorityText(
                              selectedRequest.task.priorityId,
                            )}
                          </Chip>
                        )}
                      </div>
                    </div>

                    {selectedRequest?.task?.dueDate && (
                      <div>
                        <label className="text-sm font-medium text-default-600 dark:text-default-400">
                          {t("dashboard.dueDate")}
                        </label>
                        <p className="text-sm text-default-900 dark:text-default-100 mt-1">
                          {formatDate(selectedRequest.task.dueDate)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Full Width Task Description */}
                {selectedRequest?.task?.description && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-default-600 dark:text-default-400">
                      {t("requirements.description")}
                    </label>
                    <div className="mt-1 p-2 bg-default-100/50 dark:bg-default-200/20 rounded-md">
                      <p className="text-sm text-default-900 dark:text-default-100 leading-relaxed whitespace-pre-wrap">
                        {selectedRequest.task.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Request Notes */}
                {selectedRequest?.notes && (
                  <div className="mt-4 pt-4 border-t border-default-200">
                    <label className="text-sm font-medium text-default-600 dark:text-default-400">
                      {t("designRequests.notes")}
                    </label>
                    <div className="mt-1 max-h-16 overflow-y-auto p-2 bg-default-100/50 dark:bg-default-200/20 rounded-md">
                      <p className="text-sm text-default-900 dark:text-default-100 leading-relaxed whitespace-pre-wrap">
                        {selectedRequest.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button color="default" variant="flat" onPress={onClose}>
              {t("cancel")}
            </Button>
            <Button
              color="primary"
              isLoading={assignLoading}
              onPress={handleAssignSubmit}
            >
              {t("designRequests.assign")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Requirement Details Drawer */}
      <RequirementDetailsDrawer
        getPriorityColor={getRequirementPriorityColor}
        getPriorityLabel={getRequirementPriorityText}
        getStatusColor={getRequirementPriorityColor}
        getStatusText={getRequirementStatusText}
        isOpen={isRequirementDrawerOpen}
        requirement={selectedRequirement}
        onOpenChange={setIsRequirementDrawerOpen}
      />
    </div>
  );
}

// Export DesignRequestsPage as the default export
export default DesignRequestsPage;
