import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Chip,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
} from "@heroui/react";
import { Search, Filter, X, Download, Eye, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePermissions } from "@/hooks/usePermissions";
import { usePageTitle } from "@/hooks/usePageTitle";
import { usePriorityLookups } from "@/hooks/usePriorityLookups";
import { useRequirementStatus } from "@/hooks/useRequirementStatus";
import { useFilePreview } from "@/hooks/useFilePreview";
import { GlobalPagination } from "@/components/GlobalPagination";
import { FilePreview } from "@/components/FilePreview";
import { PAGE_SIZE_OPTIONS, normalizePageSize } from "@/constants/pagination";
import type { 
  ProjectRequirement, 
  ProjectRequirementAttachment
} from "@/types/projectRequirement";
import { projectRequirementsService } from "@/services/api";

// Format date helper
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Hook for managing pending approval requirements
const usePendingApprovalRequirements = ({
  initialPageSize = 20,
}: {
  initialPageSize?: number;
}) => {
  const [requirements, setRequirements] = useState<ProjectRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRequirements, setTotalRequirements] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      
      // Use the dedicated getPendingApprovalRequirements method
      const result = await projectRequirementsService.getPendingApprovalRequirements({
        page: currentPage,
        limit: pageSize,
        ...filters,
      });

      if (result?.data) {
        setRequirements(result.data);
        setTotalRequirements(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      }
    } catch {
      // Handle error appropriately
      setRequirements([]);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters: Record<string, string>) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const refreshData = () => {
    fetchRequirements();
  };

  useEffect(() => {
    fetchRequirements();
  }, [currentPage, pageSize, filters]);

  return {
    requirements,
    loading,
    currentPage,
    totalPages,
    totalRequirements,
    pageSize,
    filters,
    updateFilters,
    handlePageChange,
    handlePageSizeChange,
    refreshData,
  };
};

// RequirementCard component
const RequirementCard = ({
  requirement,
  onViewDetails,
  onApprove,
  getStatusColor,
  getStatusText,
  getPriorityColor,
  getPriorityLabel,
  isHighlighted = false,
  cardRef,
}: {
  requirement: ProjectRequirement;
  onViewDetails: (requirement: ProjectRequirement) => void;
  onApprove: (requirement: ProjectRequirement) => void;
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
            <h3 className="text-lg font-semibold text-foreground mb-1 line-clamp-2">
              {requirement.name}
            </h3>
            <p className="text-sm text-default-500 line-clamp-1">
              {requirement.project?.applicationName || t("common.unknownProject")}
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end flex-shrink-0">
            <Chip
              color={getStatusColor(requirement.status)}
              size="sm"
              variant="flat"
            >
              {getStatusText(requirement.status)}
            </Chip>
            <Chip
              color={getPriorityColor(requirement.priority)}
              size="sm"
              variant="dot"
            >
              {getPriorityLabel(requirement.priority)}
            </Chip>
          </div>
        </div>
      </CardHeader>

      <CardBody className="pt-0 flex-1 flex flex-col">
        <div className="space-y-4 flex-1">
          <p className="text-sm text-default-600 line-clamp-3">
            {requirement.description || t("requirements.noDescription")}
          </p>

          <div className="flex items-center gap-2 text-xs text-default-500">
            <span>{t("requirements.created")}: {formatDate(requirement.createdAt)}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center pt-2 gap-2 mt-auto">
          <Button
            color="primary"
            size="sm"
            variant="flat"
            onPress={() => onViewDetails(requirement)}
          >
            <Eye size={16} />
            {t("common.viewDetails")}
          </Button>

          {/* Approve button - only for users with permission */}
          {hasPermission({
            actions: ["requirements.approve"],
          }) && (
            <Button
              color="success"
              size="sm"
              variant="solid"
              onPress={() => onApprove(requirement)}
            >
              <Check size={16} />
              {t("requirements.approve")}
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default function ApprovalRequestsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [searchParams] = useSearchParams();

  // Refs for scrolling and highlighting
  const requirementRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [highlightedRequirementId, setHighlightedRequirementId] = useState<
    number | null
  >(null);

  // Set page title
  usePageTitle("requirements.approvalRequests");

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
      const blob = await projectRequirementsService.downloadAttachment(
        selectedRequirement?.id || 0,
        attachment.id,
      );
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

  // Use the hook for pending approval requirements
  const {
    requirements,
    loading,
    currentPage,
    totalPages,
    totalRequirements,
    pageSize,
    filters,
    updateFilters,
    handlePageChange,
    handlePageSizeChange,
    refreshData,
  } = usePendingApprovalRequirements({
    initialPageSize: 20,
  });

  // Drawer state for requirement details
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] =
    useState<ProjectRequirement | null>(null);

  // Approval modal state
  const { isOpen: isApprovalModalOpen, onOpen: onApprovalModalOpen, onOpenChange: onApprovalModalOpenChange } = useDisclosure();
  const [requirementToApprove, setRequirementToApprove] = useState<ProjectRequirement | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  // Function to open drawer with requirement details
  const openRequirementDetails = (requirement: ProjectRequirement) => {
    setSelectedRequirement(requirement);
    setIsDrawerOpen(true);
  };

  // Function to open approval modal
  const openApprovalModal = (requirement: ProjectRequirement) => {
    setRequirementToApprove(requirement);
    onApprovalModalOpen();
  };

  // Function to handle requirement approval
  const handleApprovalSubmit = async () => {
    if (!requirementToApprove) return;

    setIsApproving(true);
    try {
      // Use the new approve API method
      await projectRequirementsService.approveRequirement(requirementToApprove.id);

      onApprovalModalOpenChange();
      setRequirementToApprove(null);
      
      // Refresh requirements data
      refreshData();
    } catch {
      // Handle error appropriately - could show toast notification
    } finally {
      setIsApproving(false);
    }
  };

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

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setPriorityFilter("");
    updateFilters({});
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || priorityFilter;

  // Auto-scroll and highlight functionality
  useEffect(() => {
    const highlightRequirement = searchParams.get("highlightRequirement");
    const scrollTo = searchParams.get("scrollTo");

    if (highlightRequirement && scrollTo && requirements.length > 0) {
      const requirementId = parseInt(highlightRequirement, 10);
      const scrollToId = parseInt(scrollTo, 10);

      setHighlightedRequirementId(requirementId);

      setTimeout(() => {
        const element = requirementRefs.current[scrollToId];
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 500);
    }
  }, [searchParams, requirements, setHighlightedRequirementId]);

  if (loading && requirements.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spinner label={t("common.loading")} size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("requirements.approvalRequests")}
            </h1>
            <p className="text-default-500">
              {t("requirements.approvalRequestsSubtitle")}
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardBody className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  className="flex-1"
                  placeholder={t("requirements.searchRequirements")}
                  startContent={<Search className="text-default-400" size={20} />}
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                
                <Select
                  className="sm:w-48"
                  placeholder={t("requirements.filterByPriority")}
                  selectedKeys={priorityFilter ? [priorityFilter] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setPriorityFilter(selected || "");
                  }}
                >
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {hasActiveFilters && (
                <div className="flex items-center gap-2">
                  <Button
                    color="default"
                    size="sm"
                    startContent={<X size={16} />}
                    variant="flat"
                    onPress={resetFilters}
                  >
                    Clear Filters
                  </Button>
                  <span className="text-sm text-default-500">
                    {totalRequirements} requirements found
                  </span>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Requirements Grid */}
        {requirements.length === 0 ? (
          <Card>
            <CardBody className="py-16">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-default-100 rounded-full flex items-center justify-center">
                  <Filter className="text-default-400" size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {t("requirements.noApprovalRequests")}
                  </h3>
                  <p className="text-default-500">
                    {t("requirements.noApprovalRequestsDesc")}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requirements.map((requirement) => (
              <RequirementCard
                key={requirement.id}
                cardRef={(element) => {
                  requirementRefs.current[requirement.id] = element;
                }}
                getPriorityColor={getPriorityColor}
                getPriorityLabel={getPriorityLabel}
                getStatusColor={getStatusColor}
                getStatusText={getStatusText}
                isHighlighted={highlightedRequirementId === requirement.id}
                requirement={requirement}
                onApprove={openApprovalModal}
                onViewDetails={openRequirementDetails}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <GlobalPagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={totalRequirements}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {/* Page Size Selector */}
        <div className="flex items-center justify-center gap-2">
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

        {/* Requirement Details Drawer */}
        <Drawer
          isOpen={isDrawerOpen}
          placement="right"
          size="lg"
          onOpenChange={setIsDrawerOpen}
        >
          <DrawerContent>
            {(onClose) => (
              <>
                <DrawerHeader className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold">
                    {selectedRequirement?.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Chip
                      color={getStatusColor(selectedRequirement?.status || 0)}
                      size="sm"
                      variant="flat"
                    >
                      {getStatusText(selectedRequirement?.status || 0)}
                    </Chip>
                    <Chip
                      color={getPriorityColor(selectedRequirement?.priority || 0)}
                      size="sm"
                      variant="dot"
                    >
                      {getPriorityLabel(selectedRequirement?.priority || 0)}
                    </Chip>
                  </div>
                </DrawerHeader>
                <DrawerBody>
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">{t("requirements.requirementDescription")}</h3>
                      <p className="text-default-600 leading-relaxed whitespace-pre-wrap">
                        {selectedRequirement?.description || t("requirements.noDescription")}
                      </p>
                    </div>

                    {/* Project Information */}
                    {selectedRequirement?.project && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">{t("requirements.projectInfo")}</h3>
                        <div className="space-y-2">
                                <div>
                                  <span className="font-medium">{t("requirements.project")}: </span>
                                  <span className="text-default-600">
                                    {selectedRequirement.project.applicationName}
                                  </span>
                                </div>
                        </div>
                      </div>
                    )}

                    {/* Attachments */}
                    {selectedRequirement?.attachments && selectedRequirement.attachments.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">{t("requirements.attachments")}</h3>
                        <div className="grid gap-2">
                          {selectedRequirement.attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="flex items-center justify-between p-3 border border-divider rounded-lg hover:bg-default-50"
                            >
                              <div className="flex items-center gap-3">
                                <div className="text-default-600">
                                  {attachment.originalName}
                                </div>
                                <div className="text-sm text-default-400">
                                  {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  onPress={() => handleFilePreview(attachment)}
                                >
                                  <Eye size={16} />
                                </Button>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  onPress={() => handleFilePreview(attachment)}
                                >
                                  <Download size={16} />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </DrawerBody>
                <DrawerFooter>
                  <Button color="default" variant="flat" onPress={onClose}>
                    Close
                  </Button>
                  {hasPermission({ actions: ["requirements.approve"] }) && (
                    <Button
                      color="success"
                      onPress={() => {
                        onClose();
                        if (selectedRequirement) {
                          openApprovalModal(selectedRequirement);
                        }
                      }}
                    >
                      <Check size={16} />
                      {t("requirements.approve")}
                    </Button>
                  )}
                </DrawerFooter>
              </>
            )}
          </DrawerContent>
        </Drawer>

        {/* Approval Confirmation Modal */}
        <Modal
          isOpen={isApprovalModalOpen}
          size="md"
          onOpenChange={onApprovalModalOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  {t("requirements.approveRequirement")}
                </ModalHeader>
                <ModalBody>
                  <div className="space-y-4">
                    <p>
                      Are you sure you want to approve the requirement "{requirementToApprove?.name}"?
                    </p>
                    <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
                      <p className="text-sm text-warning-800">
                        This will change the status to "Approved" and make it available for development assignment.
                      </p>
                    </div>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="default" variant="flat" onPress={onClose}>
                    {t("requirements.cancel")}
                  </Button>
                  <Button
                    color="success"
                    isLoading={isApproving}
                    onPress={handleApprovalSubmit}
                  >
                    {t("requirements.approve")}
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