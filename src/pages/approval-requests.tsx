import type {
  ProjectRequirement,
  ProjectRequirementAttachment,
} from "@/types/projectRequirement";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tooltip,
  ScrollShadow,
  Textarea,
} from "@heroui/react";
import { Search, Filter, X, Eye, Check, CornerUpLeft } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import LoadingLogo from "@/components/LoadingLogo";
import { usePermissions } from "@/hooks/usePermissions";
import { usePageTitle } from "@/hooks/usePageTitle";
import { usePriorityLookups } from "@/hooks/usePriorityLookups";
import { useRequirementStatus } from "@/hooks/useRequirementStatus";
import { useFilePreview } from "@/hooks/useFilePreview";
import { useRequirementDetails } from "@/hooks/useRequirementDetails";
import { GlobalPagination } from "@/components/GlobalPagination";
import { FilePreview } from "@/components/FilePreview";
import RequirementDetailsDrawer from "@/components/RequirementDetailsDrawer";
import { PAGE_SIZE_OPTIONS, normalizePageSize } from "@/constants/pagination";
import { projectRequirementsService } from "@/services/api";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import "./approval-requests.css";

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

  // Track in-flight requests to prevent duplicates
  const inFlightRef = useRef<string | null>(null);
  // Track the state key to know when to refetch
  const stateKeyRef = useRef<string | null>(null);

  const fetchRequirements = useCallback(async () => {
    const key = JSON.stringify({ currentPage, pageSize, filters });

    // If we're already fetching this exact state, return early
    if (inFlightRef.current === key) {
      return;
    }

    inFlightRef.current = key;
    setLoading(true);

    try {
      // Use the dedicated getPendingApprovalRequirements method
      const result =
        await projectRequirementsService.getPendingApprovalRequirements({
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
      inFlightRef.current = null;
    }
  }, [currentPage, pageSize, filters]);

  const updateFilters = useCallback((newFilters: Record<string, string>) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  }, []);

  const refreshData = useCallback(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  // Use a key-based ref to track when state actually changes
  useEffect(() => {
    const key = JSON.stringify({ currentPage, pageSize, filters });

    // Only fetch if the key has changed
    if (stateKeyRef.current !== key) {
      stateKeyRef.current = key;
      fetchRequirements();
    }
  }, [currentPage, pageSize, filters, fetchRequirements]);

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
  onReturn,
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
  onReturn: (requirement: ProjectRequirement) => void;
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
  const { t, language } = useLanguage();

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
              {requirement.project?.applicationName ||
                t("common.unknownProject")}
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end flex-shrink-0">
            <Chip
              color={getPriorityColor(requirement.priority)}
              size="sm"
              variant="flat"
            >
              {getPriorityLabel(requirement.priority)}
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
        <div className="space-y-2 flex-1">
          <ScrollShadow hideScrollBar className="h-[4.5rem]" isEnabled={false}>
            <p
              dangerouslySetInnerHTML={{
                __html:
                  requirement.description || t("requirements.noDescription"),
              }}
              className="text-sm text-default-600 leading-relaxed mb-0"
            />
          </ScrollShadow>

          <div className="space-y-1 text-xs text-default-500">
            <div className="flex items-center gap-2">
              <span>
                {t("requirements.created")}: {formatDate(requirement.createdAt)}
              </span>
            </div>
            {requirement.sender && (
              <div className="flex items-center gap-2">
                <span>
                  {t("requirements.sentBy")}: {requirement.sender.gradeName}{" "}
                  {requirement.sender.fullName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-2 gap-2 mt-auto">
          <Tooltip content={t("common.viewDetails")}>
            <Button
              isIconOnly
              size="sm"
              variant="bordered"
              onPress={() => onViewDetails(requirement)}
            >
              <Eye size={16} />
            </Button>
          </Tooltip>

          <div className="flex gap-2">
            {/* Return button */}
            <Button
              size="sm"
              variant="bordered"
              onPress={() => onReturn(requirement)}
            >
              <CornerUpLeft className="text-danger" size={16} />
              {t("requirements.return")}
            </Button>

            {/* Approve button */}
            <Button
              size="sm"
              variant="bordered"
              onPress={() => onApprove(requirement)}
            >
              <Check className="text-success" size={16} />
              {t("requirements.approve")}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default function ApprovalRequestsPage() {
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
  const [selectedRequirementId, setSelectedRequirementId] = useState<
    number | undefined
  >(undefined);
  const [isOptionOpen, setIsOptionOpen] = useState(false);

  // Fetch requirement details when drawer opens
  const { requirement: selectedRequirement } = useRequirementDetails({
    requirementId: isDrawerOpen ? selectedRequirementId : undefined,
    enabled: isDrawerOpen,
  });

  // Approval modal state
  const {
    isOpen: isApprovalModalOpen,
    onOpen: onApprovalModalOpen,
    onOpenChange: onApprovalModalOpenChange,
  } = useDisclosure();
  const [requirementToApprove, setRequirementToApprove] =
    useState<ProjectRequirement | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  // Return modal state
  const {
    isOpen: isReturnModalOpen,
    onOpen: onReturnModalOpen,
    onOpenChange: onReturnModalOpenChange,
  } = useDisclosure();
  const [requirementToReturn, setRequirementToReturn] =
    useState<ProjectRequirement | null>(null);
  const [returnReason, setReturnReason] = useState<string>("");
  const [isReturning, setIsReturning] = useState(false);

  // Function to open drawer with requirement details
  const openRequirementDetails = (requirement: ProjectRequirement) => {
    setSelectedRequirementId(requirement.id);
    setIsDrawerOpen(true);
  };

  // Function to open approval modal
  const openApprovalModal = (requirement: ProjectRequirement) => {
    setRequirementToApprove(requirement);
    onApprovalModalOpen();
  };

  // Function to open return modal
  const openReturnModal = (requirement: ProjectRequirement) => {
    setRequirementToReturn(requirement);
    setReturnReason("");
    onReturnModalOpen();
  };

  // Function to handle requirement approval
  const handleApprovalSubmit = async () => {
    if (!requirementToApprove) return;

    setIsApproving(true);
    try {
      // Use the new approve API method
      await projectRequirementsService.approveRequirement(
        requirementToApprove.id,
      );

      // Show success toast
      showSuccessToast(t("requirements.approveSuccess"));

      onApprovalModalOpenChange();
      setRequirementToApprove(null);

      // Refresh requirements data
      refreshData();
    } catch {
      // Show error toast
      showErrorToast(t("requirements.approveError"));
    } finally {
      setIsApproving(false);
    }
  };

  // Function to handle requirement return
  const handleReturnSubmit = async () => {
    if (!requirementToReturn || !returnReason.trim()) return;

    setIsReturning(true);
    try {
      // Use the new return API method
      await projectRequirementsService.returnRequirement(
        requirementToReturn.id,
        returnReason,
      );

      // Show success toast
      showSuccessToast(t("requirements.returnSuccess"));

      onReturnModalOpenChange();
      setRequirementToReturn(null);
      setReturnReason("");

      // Refresh requirements data
      refreshData();
    } catch {
      // Show error toast
      showErrorToast(t("requirements.returnError"));
    } finally {
      setIsReturning(false);
    }
  };

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
  };

  // Check if any filters are active
  const hasActiveFilters =
    searchTerm || statusFilter !== null || priorityFilter;

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

          // Flash effect
          element.classList.add("highlight-flash");
          // Let the CSS animation complete naturally, then clean up
          setTimeout(() => {
            setHighlightedRequirementId(null);
            element.classList.remove("highlight-flash");
          }, 4100); // Slightly after animation completes to ensure clean state
        }
      }, 500);
    }
  }, [searchParams, requirements]);

  if (loading && requirements.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingLogo showText size="lg" text={t("common.loading")} />
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
        <div className="flex flex-col gap-4 filters-section">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
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
                    {language === "ar" ? option.labelAr : option.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Page Size Selector */}
            {!loading && totalRequirements > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-default-600">
                  {t("common.show")}:
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
            )}
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
                {t("tasks.tasksFound").replace(
                  "{count}",
                  totalRequirements.toString(),
                )}
              </span>
            </div>
          )}
        </div>

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
                onReturn={openReturnModal}
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

        {/* Requirement Details Drawer */}
        <RequirementDetailsDrawer
          getPriorityColor={getPriorityColor}
          getPriorityLabel={getPriorityLabel}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
          isOpen={isDrawerOpen}
          requirement={selectedRequirement}
          showApprovalButton={true}
          onApprove={openApprovalModal}
          onOpenChange={setIsDrawerOpen}
        />

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
                      {t("requirements.approveConfirmMessage").replace(
                        "{name}",
                        requirementToApprove?.name || "",
                      )}
                    </p>
                    <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
                      <p className="text-sm text-warning-800">
                        {t("requirements.approveWarningMessage")}
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
                    variant="flat"
                    onPress={handleApprovalSubmit}
                  >
                    <Check size={16} />
                    {t("requirements.approve")}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Return Confirmation Modal */}
        <Modal
          isOpen={isReturnModalOpen}
          size="md"
          onOpenChange={onReturnModalOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <CornerUpLeft className="w-5 h-5 text-warning" />
                    {t("requirements.returnRequirement")}
                  </div>
                </ModalHeader>
                <ModalBody>
                  <div className="space-y-4">
                    <p>
                      {t("requirements.returnConfirmMessage").replace(
                        "{name}",
                        requirementToReturn?.name || "",
                      )}
                    </p>
                    <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
                      <p className="text-sm text-warning-800">
                        {t("requirements.returnToAnalyst")}
                      </p>
                    </div>
                    <Textarea
                      isRequired
                      label={t("requirements.returnReason")}
                      minRows={3}
                      placeholder={t("requirements.returnReasonPlaceholder")}
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                    />
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="default" variant="flat" onPress={onClose}>
                    {t("requirements.cancel")}
                  </Button>
                  <Button
                    color="danger"
                    isDisabled={!returnReason.trim()}
                    isLoading={isReturning}
                    variant="flat"
                    onPress={handleReturnSubmit}
                  >
                    <CornerUpLeft size={16} />
                    {t("requirements.return")}
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
