import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
} from "@heroui/drawer";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Avatar } from "@heroui/avatar";
import { addToast } from "@heroui/toast";
import {
  CheckCircle,
  Clock,
  Calendar,
  LayoutGrid,
  LayoutList,
  FileText,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { usePermissions } from "@/hooks/usePermissions";
import { formatDateTime } from "@/utils/dateFormatter";
import { MemberSearchResult } from "@/types";
import { designRequestsService } from "@/services/api";
import { DesignRequestDto } from "@/services/api/designRequestsService";
import { GlobalPagination } from "@/components/GlobalPagination";
import { normalizePageSize } from "@/constants/pagination";
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
        // API returns: { success: true, data: DesignRequestDto[], pagination: { total, totalPages, ... } }
        if (Array.isArray(response.data)) {
          setDesignRequests(response.data);
          
          // Check if pagination info exists in response
          if (response.pagination) {
            setTotalCount(response.pagination.total || response.data.length);
            setTotalPages(response.pagination.totalPages || 1);
          } else {
            // Fallback if no pagination
            setTotalCount(response.data.length);
            setTotalPages(1);
          }
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
    setNotes("");
    setModalError(null);
    setSelectedDesigner(null);
    setDesignerInputValue("");
    onOpen();
  };

  // Handle assign submit
  const handleAssignSubmit = async () => {
    if (!selectedRequest || !selectedDesigner?.id) {
      setModalError(t("designRequests.designerRequired"));

      return;
    }

    setAssignLoading(true);
    setModalError(null);

    try {
      const response = await designRequestsService.assignDesignRequest(
        selectedRequest.id,
        selectedDesigner.id,
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
    } catch {
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
    setSelectedRequest(request);
    setIsRequirementDrawerOpen(true);
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
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-default-100 dark:bg-default-50/10 p-6 mb-4">
            <FileText className="w-12 h-12 text-default-400" />
          </div>
          <p className="text-lg font-medium text-default-600 dark:text-default-400">
            {t("designRequests.noRequests")}
          </p>
          <p className="text-sm text-default-400 mt-1">
            {t("designRequests.noRequestsDescription")}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {designRequests.map((request) => (
          <Card
            key={request.id}
            className="border border-default-200"
            shadow="sm"
          >
            <CardHeader className="flex flex-col items-start gap-3 pb-3">
              <div className="flex justify-between items-start w-full gap-3">
                <div className="flex-1">
                  <p className="text-xs text-default-500 mb-1">
                    {t("designRequests.taskName")}
                  </p>
                  <h3 className="text-base font-semibold text-default-700 line-clamp-2">
                    {request.task?.name || `Task #${request.taskId}`}
                  </h3>
                </div>
                <Chip
                  color={getStatusColor(request.status)}
                  size="sm"
                  variant="flat"
                  classNames={{
                    content: "text-xs font-medium px-1",
                  }}
                >
                  {getStatusText(request.status)}
                </Chip>
              </div>
            </CardHeader>

            <div className="px-4">
              <div className="border-t border-default-200" />
            </div>

            <CardBody className="space-y-4 pt-3">
              {/* Request Information */}
              <div className="space-y-3">
                {/* Request Date */}
                <div>
                  <p className="text-xs text-default-500 mb-1">
                    {t("designRequests.requestDate")}
                  </p>
                  <Chip
                    size="sm"
                    variant="flat"
                    startContent={<Clock className="w-3 h-3" />}
                    classNames={{
                      base: "bg-default-100 border-none",
                      content: "text-xs text-default-700",
                    }}
                  >
                    {formatDate(request.createdAt)}
                  </Chip>
                </div>

                {/* Assigned Designer */}
                {request.assignedToUserName && (
                  <div>
                    <p className="text-xs text-default-500 mb-1">
                      {t("designRequests.assignedTo")}
                    </p>
                    <Chip
                      size="sm"
                      variant="flat"
                      startContent={<CheckCircle className="w-3 h-3" />}
                      classNames={{
                        base: "bg-success-50 dark:bg-success-100/10 border-none",
                        content: "text-xs text-success-700 dark:text-success-600 font-medium",
                      }}
                    >
                      {request.assignedToUserName}
                    </Chip>
                  </div>
                )}

                {/* Project & Requirement */}
                {request.requirementDetails && (
                  <>
                    <div className="border-t border-default-100 pt-3" />
                    <div>
                      <p className="text-xs text-default-500 mb-1">
                        {t("common.project")}
                      </p>
                      <Chip
                        size="sm"
                        variant="flat"
                        classNames={{
                          base: "bg-primary-50 dark:bg-primary-100/10 border-none",
                          content: "text-xs text-primary-700 dark:text-primary-600 font-medium",
                        }}
                      >
                        {request.requirementDetails.projectName ||
                          t("common.unknownProject")}
                      </Chip>
                    </div>
                    <div>
                      <p className="text-xs text-default-500 mb-1">
                        {t("requirements.requirement")}
                      </p>
                      <p className="text-sm text-default-700 line-clamp-1">
                        {request.requirementDetails.name}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardBody>

            <div className="px-4">
              <div className="border-t border-default-200" />
            </div>

            <CardFooter className="pt-3">
              <div className="flex gap-2 w-full">
                <Button
                  className="flex-1"
                  size="sm"
                  startContent={<FileText size={16} />}
                  variant="bordered"
                  onPress={() => handleViewDetails(request)}
                >
                  {t("designRequests.viewDetails")}
                </Button>

                {request.status === 1 && (
                  <Button
                    className="flex-1"
                    color="primary"
                    size="sm"
                    variant="flat"
                    onPress={() => handleAssign(request)}
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
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-default-100 dark:bg-default-50/10 p-6 mb-4">
            <FileText className="w-12 h-12 text-default-400" />
          </div>
          <p className="text-lg font-medium text-default-600 dark:text-default-400">
            {t("designRequests.noRequests")}
          </p>
          <p className="text-sm text-default-400 mt-1">
            {t("designRequests.noRequestsDescription")}
          </p>
        </div>
      );
    }

    return (
      <Table aria-label="Design Requests Table">
        <TableHeader>
          <TableColumn>{t("designRequests.taskName")}</TableColumn>
          <TableColumn>{t("designRequests.requestDate")}</TableColumn>
          <TableColumn>{t("designRequests.status")}</TableColumn>
          <TableColumn>{t("designRequests.notes")}</TableColumn>
          <TableColumn>{t("common.actions")}</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={t("designRequests.noRequests")}
          isLoading={loading}
          loadingContent={t("designRequests.loadingRequests")}
        >
          {designRequests &&
            designRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>{request.task?.name || `Task ID: ${request.taskId}`}</TableCell>
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
                      size="sm"
                      startContent={<FileText size={16} />}
                      variant="bordered"
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
          {/* Items Per Page Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-default-600 whitespace-nowrap">
              {t("pagination.itemsPerPage")}:
            </span>
            <Select
              aria-label={t("pagination.itemsPerPage")}
              className="w-20"
              selectedKeys={new Set([pageSize.toString()])}
              size="sm"
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                if (selectedKey) {
                  handlePageSizeChange(parseInt(selectedKey));
                }
              }}
            >
              <SelectItem key="5">5</SelectItem>
              <SelectItem key="10">10</SelectItem>
              <SelectItem key="20">20</SelectItem>
              <SelectItem key="50">50</SelectItem>
            </Select>
          </div>

          {/* Status Filter */}
          <Select
            aria-label={t("common.filter")}
            className="w-40"
            label={t("common.filter")}
            selectedKeys={
              statusFilter !== undefined ? new Set([statusFilter.toString()]) : new Set()
            }
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0] as string;
              handleStatusFilterChange(selectedKey || null);
            }}
          >
            <SelectItem key="">
              {t("designRequests.filter.all")}
            </SelectItem>
            <SelectItem key="1">
              {t("designRequests.filter.unassigned")}
            </SelectItem>
            <SelectItem key="2">
              {t("designRequests.filter.assigned")}
            </SelectItem>
          </Select>

          {/* View Type Buttons */}
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
      {totalCount > 0 && totalPages > 1 && (
        <div className="mt-8">
          <div className="flex justify-center">
            <GlobalPagination
              currentPage={currentPage}
              pageSize={normalizePageSize(pageSize, 10)}
              totalItems={totalCount}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      )}

      {/* Assign Modal */}
      <Modal isOpen={isOpen} size="lg" onClose={onClose}>
        <ModalContent>
          <ModalHeader className="border-b border-default-200">
            {selectedRequest?.assignedToUserName
              ? t("designRequests.assignedDesigner")
              : t("designRequests.assignTo")}
          </ModalHeader>

          <ModalBody className="py-6">
            <div className="space-y-5">
              {/* Show assigned designer info if there is one */}
              {selectedRequest?.assignedToUserName && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-default-100/50 dark:bg-default-50/5">
                  <Avatar
                    className="flex-shrink-0"
                    name={selectedRequest.assignedToUserName}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-default-900 dark:text-default-100 truncate">
                      {selectedRequest.assignedToUserName}
                    </p>
                    <p className="text-xs text-default-500">
                      {formatDate(
                        (selectedRequest as any).assignedAt ||
                          selectedRequest.createdAt,
                      )}
                    </p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                </div>
              )}

              {/* Assignment Controls - Only show if not assigned */}
              {!selectedRequest?.assignedToUserName && (
                <div className="space-y-4">
                  <div>
                    <Autocomplete
                      label={t("designRequests.selectDesignerForAssignment")}
                      defaultFilter={() => true}
                      inputValue={designerInputValue}
                      isLoading={designersLoading}
                      menuTrigger="input"
                      placeholder={t("tasks.selectDesigner")}
                      selectedKey={selectedDesigner?.id?.toString() || ""}
                      value={
                        selectedDesigner
                          ? `${selectedDesigner.gradeName} ${selectedDesigner.fullName}`
                          : designerInputValue
                      }
                      onInputChange={(value) => {
                        setDesignerInputValue(value);
                        // clear selection if input no longer matches selected
                        if (selectedDesigner) {
                          const expectedValue = `${selectedDesigner.gradeName} ${selectedDesigner.fullName}`;

                          if (value !== expectedValue) {
                            setSelectedDesigner(null);
                          }
                        }
                        searchDesigners(value);
                      }}
                      onSelectionChange={(key) => {
                        const designer = designers.find(
                          (member) => member.id.toString() === String(key),
                        );

                        setSelectedDesigner(designer || null);
                        // Set the display value when a designer is selected
                        if (designer) {
                          setDesignerInputValue(
                            `${designer.gradeName} ${designer.fullName}`,
                          );
                        }
                      }}
                    >
                      {designers.map((designer) => (
                        <AutocompleteItem
                          key={designer.id.toString()}
                          textValue={`${designer.gradeName} ${designer.fullName} ${designer.userName} ${designer.militaryNumber}`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar
                              alt={designer.fullName}
                              className="flex-shrink-0"
                              size="sm"
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {designer.fullName}
                              </span>
                              <span className="text-xs text-default-500">
                                {designer.militaryNumber} - {designer.gradeName}
                              </span>
                            </div>
                          </div>
                        </AutocompleteItem>
                      ))}
                    </Autocomplete>
                    {modalError && (
                      <p className="text-danger text-sm mt-1">{modalError}</p>
                    )}
                  </div>

                  <div>
                    <Textarea
                      label={t("designRequests.assignmentNotes")}
                      minRows={3}
                      placeholder={t(
                        "designRequests.assignmentNotesPlaceholder",
                      )}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Task Details Section - Minimalist */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-default-100">
                  <span className="text-default-500">{t("designRequests.taskName")}</span>
                  <span className="font-medium text-default-900 dark:text-default-100">
                    {selectedRequest?.task?.name || t("common.notAvailable")}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-default-100">
                  <span className="text-default-500">{t("designRequests.requestDate")}</span>
                  <span className="text-default-900 dark:text-default-100">
                    {formatDate(selectedRequest?.createdAt)}
                  </span>
                </div>

                {selectedRequest?.task?.statusId && (
                  <div className="flex items-center justify-between py-2 border-b border-default-100">
                    <span className="text-default-500">{t("status")}</span>
                    <Chip
                      color={getStatusColor(selectedRequest.task.statusId)}
                      size="sm"
                      variant="flat"
                    >
                      {getStatusText(selectedRequest.status)}
                    </Chip>
                  </div>
                )}

                {selectedRequest?.task?.priorityId && (
                  <div className="flex items-center justify-between py-2 border-b border-default-100">
                    <span className="text-default-500">{t("priority")}</span>
                    <Chip
                      color={getRequirementPriorityColor(selectedRequest.task.priorityId)}
                      size="sm"
                      variant="flat"
                    >
                      {getRequirementPriorityText(selectedRequest.task.priorityId)}
                    </Chip>
                  </div>
                )}

                {selectedRequest?.task?.dueDate && (
                  <div className="flex items-center justify-between py-2 border-b border-default-100">
                    <span className="text-default-500">{t("dashboard.dueDate")}</span>
                    <span className="text-default-900 dark:text-default-100">
                      {formatDate(selectedRequest.task.dueDate)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </ModalBody>

          <ModalFooter className="border-t border-default-200">
            <Button variant="flat" onPress={onClose}>
              {t("common.cancel")}
            </Button>
            <Button
              color="primary"
              isLoading={assignLoading}
              variant="flat"
              onPress={handleAssignSubmit}
            >
              {t("designRequests.assign")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Task Details Drawer */}
      <Drawer
        isOpen={isRequirementDrawerOpen}
        onOpenChange={setIsRequirementDrawerOpen}
      >
        <DrawerContent>
          <DrawerHeader className="text-center">
            {t("taskDetails")}
          </DrawerHeader>

          <DrawerBody className="overflow-y-auto">
            {selectedRequest?.task && (
              <div className="space-y-6">
                {/* Task Header */}
                <div className="border-b border-default-200 pb-4">
                  <h2 className="text-xl font-bold text-default-900 dark:text-default-100 mb-2">
                    {selectedRequest.task.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip
                      size="sm"
                      variant="flat"
                      className="bg-default-100 dark:bg-default-100/10 border-none"
                      startContent={<Clock className="w-3 h-3" />}
                    >
                      <span className="text-xs">
                        {formatDate(selectedRequest.createdAt)}
                      </span>
                    </Chip>
                    <Chip
                      size="sm"
                      variant="flat"
                      className="bg-default-100 dark:bg-default-100/10 border-none"
                    >
                      <span className="text-xs">Task ID: {selectedRequest.taskId}</span>
                    </Chip>
                  </div>
                </div>

                {/* Task Status and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-default-600 dark:text-default-400 mb-2 block">
                      {t("status")}
                    </label>
                    {selectedRequest.task.statusId && (
                      <Chip
                        color={getStatusColor(selectedRequest.task.statusId)}
                        size="sm"
                        variant="flat"
                      >
                        {getStatusText(selectedRequest.task.statusId)}
                      </Chip>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-default-600 dark:text-default-400 mb-2 block">
                      {t("priority")}
                    </label>
                    {selectedRequest.task.priorityId && (
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

                {/* Task Description */}
                {selectedRequest.task.description && (
                  <div>
                    <label className="text-sm font-medium text-default-600 dark:text-default-400 mb-2 block">
                      {t("requirements.description")}
                    </label>
                    <div className="p-3 bg-default-50 dark:bg-default-100/50 rounded-lg">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: selectedRequest.task.description,
                        }}
                        className="text-sm text-default-900 dark:text-default-100 leading-relaxed"
                      />
                    </div>
                  </div>
                )}

                {/* Task Metadata */}
                <div className="space-y-3">
                  {selectedRequest.task.dueDate && (
                    <div>
                      <label className="text-xs text-default-500 mb-1.5 block">
                        {t("dashboard.dueDate")}
                      </label>
                      <Chip
                        size="sm"
                        variant="flat"
                        className="bg-warning-50 dark:bg-warning-100/10 border-none"
                        startContent={<Calendar className="w-3 h-3" />}
                      >
                        <span className="text-xs text-warning-700 dark:text-warning-600">
                          {formatDate(selectedRequest.task.dueDate)}
                        </span>
                      </Chip>
                    </div>
                  )}

                  {selectedRequest.task.requirementId && (
                    <div>
                      <label className="text-xs text-default-500 mb-1.5 block">
                        {t("requirements.requirementId")}
                      </label>
                      <Chip
                        size="sm"
                        variant="flat"
                        className="bg-secondary-50 dark:bg-secondary-100/10 border-none"
                      >
                        <span className="text-xs text-secondary-700 dark:text-secondary-600">
                          {selectedRequest.task.requirementId}
                        </span>
                      </Chip>
                    </div>
                  )}
                </div>

                {/* Assignment Information */}
                {selectedRequest.assignedToUserName && (
                  <div className="border-t border-default-200 pt-4">
                    <label className="text-xs text-default-500 mb-2 block">
                      {t("designRequests.assignedTo")}
                    </label>
                    <div className="flex items-center gap-3">
                      <Avatar
                        className="flex-shrink-0"
                        name={selectedRequest.assignedToUserName}
                        size="sm"
                      />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-default-900 dark:text-default-100">
                          {selectedRequest.assignedToUserName}
                        </span>
                        <span className="text-xs text-default-500">
                          {formatDate(
                            (selectedRequest as any).assignedAt ||
                              selectedRequest.createdAt,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Request Notes */}
                {selectedRequest.notes && (
                  <div className="border-t border-default-200 pt-4">
                    <label className="text-sm font-medium text-default-600 dark:text-default-400 mb-2 block">
                      {t("designRequests.notes")}
                    </label>
                    <div className="p-3 bg-default-50 dark:bg-default-100/50 rounded-lg">
                      <p className="text-sm text-default-900 dark:text-default-100 leading-relaxed whitespace-pre-wrap">
                        {selectedRequest.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DrawerBody>

          <DrawerFooter>
            <Button
              color="default"
              variant="flat"
              onPress={() => setIsRequirementDrawerOpen(false)}
            >
              {t("common.close")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

// Export DesignRequestsPage as the default export
export default DesignRequestsPage;
