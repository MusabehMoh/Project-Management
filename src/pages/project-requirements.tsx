import type {
  ProjectRequirement,
  CreateProjectRequirementRequest,
  ProjectRequirementAttachment,
} from "@/types/projectRequirement";

import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Chip } from "@heroui/chip";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./project-requirements.css";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Skeleton } from "@heroui/skeleton";
import { DatePicker } from "@heroui/date-picker";
import {
  Plus,
  Search,
  MoreVertical,
  ArrowLeft,
  Edit,
  Trash2,
  Send,
  Calendar,
  FileText,
  AlertCircle,
  Upload,
  X,
  Download,
  Eye,
  RotateCcw,
} from "lucide-react";
import { parseDate } from "@internationalized/date";

import { FilePreview } from "@/components/FilePreview";
import { GlobalPagination } from "@/components/GlobalPagination";
import {
  convertTypeToString,
  REQUIREMENT_STATUS,
  REQUIREMENT_PRIORITY,
  REQUIREMENT_TYPE,
} from "@/constants/projectRequirements";
import { PAGE_SIZE_OPTIONS, normalizePageSize } from "@/constants/pagination";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFilePreview } from "@/hooks/useFilePreview";
import { usePermissions } from "@/hooks/usePermissions";
import { useProjectRequirements } from "@/hooks/useProjectRequirements";
import { useRequirementStatus } from "@/hooks/useRequirementStatus";
import { usePriorityLookups } from "@/hooks/usePriorityLookups";
import { usePageTitle } from "@/hooks";
import { projectRequirementsService } from "@/services/api/projectRequirementsService";

// Form data type for creating/editing requirements
// Uses string values for UI components - will be converted to integers before API calls
interface RequirementFormData {
  name: string;
  description: string;
  priority: number; // Integer value matching backend enum
  type: number; // Integer value matching backend enum
  expectedCompletionDate: any;
  attachments: string[];
  uploadedFiles: File[];
  existingAttachments: ProjectRequirementAttachment[];
}

export default function ProjectRequirementsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  // Set page title
  usePageTitle("requirements.projectRequirements");
  const [searchParams] = useSearchParams();

  // Get highlighting parameters from URL
  const highlightRequirementId = searchParams.get("highlightRequirement");
  const scrollToRequirementId = searchParams.get("scrollTo");
  const [highlightedRequirement, setHighlightedRequirement] = useState<
    number | null
  >(highlightRequirementId ? parseInt(highlightRequirementId) : null);

  // Page size state for dynamic pagination
  const [currentPageSize, setCurrentPageSize] = useState(20);

  const {
    requirements,
    stats,
    loading,
    currentPage,
    totalPages,
    totalRequirements,
    createRequirement,
    updateRequirement,
    deleteRequirement,
    sendRequirement,
    updateFilters,
    handlePageChange,
    refreshData,
    uploadAttachments,
    deleteAttachment,
    downloadAttachment,
  } = useProjectRequirements({
    projectId: projectId ? parseInt(projectId) : undefined,
    pageSize: currentPageSize,
    // Preserve user input; we'll show a 'no results' state instead of clearing.
    // onSearchNoResults intentionally left unused to avoid unexpected clearing UX.
    // onSearchNoResults: () => {},
  });

  // Pagination page size options
  const effectivePageSize = normalizePageSize(currentPageSize, 20);

  // Handler for page size change
  const handlePageSizeChange = (newSize: number) => {
    setCurrentPageSize(newSize);
    // Reset to first page when page size changes
    handlePageChange(1);
  };

  const { hasPermission } = usePermissions();

  // Global priority lookups
  const { getPriorityColor, getPriorityLabel, priorityOptions } =
    usePriorityLookups();

  // RequirementStatus hook for dynamic status management
  const { statuses, getRequirementStatusColor, getRequirementStatusName } =
    useRequirementStatus();

  // File preview hook
  const { previewState, previewFile, closePreview, downloadCurrentFile } =
    useFilePreview({
      downloadFunction: downloadAttachment,
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
      await downloadAttachment(
        selectedRequirement?.id || 0,
        attachment.id,
        attachment.originalName,
      );
    }
  };

  // Modal states
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onOpenChange: onCreateOpenChange,
  } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onOpenChange: onEditOpenChange,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure();

  // Form states
  const [selectedRequirement, setSelectedRequirement] =
    useState<ProjectRequirement | null>(null);
  const [requirementToDelete, setRequirementToDelete] =
    useState<ProjectRequirement | null>(null);
  const [formData, setFormData] = useState<RequirementFormData>({
    name: "",
    description: "",
    priority: REQUIREMENT_PRIORITY.MEDIUM,
    type: REQUIREMENT_TYPE.NEW,
    expectedCompletionDate: null,
    attachments: [],
    uploadedFiles: [],
    existingAttachments: [],
  });
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Update filters when search/filter states change (with debouncing)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const newFilters = {
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== null && {
          status: statusFilter.toString(),
        }),
        ...(priorityFilter && { priority: priorityFilter }),
      };

      updateFilters(newFilters);

      // Mark as not initial load after first filter update
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
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

  // Handle highlighting and scrolling for specific requirements
  useEffect(() => {
    if (scrollToRequirementId && requirements.length > 0) {
      const requirementId = parseInt(scrollToRequirementId);

      // Wait a bit for the table to render
      setTimeout(() => {
        const element = document.getElementById(`requirement-${requirementId}`);

        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          // Flash effect
          if (highlightedRequirement === requirementId) {
            element.classList.add("highlight-flash");
            // Let the CSS animation complete naturally, then clean up
            setTimeout(() => {
              setHighlightedRequirement(null);
            }, 4100); // Slightly after animation completes to ensure clean state
          }
        }
      }, 500);
    }
  }, [
    requirements,
    scrollToRequirementId,
    highlightedRequirement,
    setHighlightedRequirement,
  ]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = t("requirements.validation.nameRequired");
    }
    // For ReactQuill, check if content is empty (only contains HTML tags without text)
    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").trim();

    if (!stripHtml(formData.description)) {
      errors.description = t("requirements.validation.descriptionRequired");
    }
    if (!formData.expectedCompletionDate) {
      errors.expectedCompletionDate = t(
        "requirements.validation.expectedDateRequired",
      );
    }

    setValidationErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      priority: REQUIREMENT_PRIORITY.MEDIUM,
      type: REQUIREMENT_TYPE.NEW,
      expectedCompletionDate: null,
      attachments: [],
      uploadedFiles: [],
      existingAttachments: [],
    });
    setValidationErrors({});
    setSelectedRequirement(null);
  };

  const handleCreateRequirement = () => {
    resetForm();
    onCreateOpen();
  };

  const handleEditRequirement = (requirement: ProjectRequirement) => {
    setSelectedRequirement(requirement);

    // Safely parse the expected completion date
    let parsedDate = null;

    if (requirement.expectedCompletionDate) {
      try {
        // Handle different date formats that might come from the backend
        const dateStr = requirement.expectedCompletionDate;

        if (typeof dateStr === "string") {
          // Try to create a Date object first to validate
          const date = new Date(dateStr);

          if (!isNaN(date.getTime())) {
            // Convert to YYYY-MM-DD format for parseDate
            const isoString = date.toISOString().split("T")[0];

            parsedDate = parseDate(isoString);
          }
        }
      } catch {
        // Silently ignore date parsing errors
      }
    }

    setFormData({
      name: requirement.name,
      description: requirement.description,
      priority: requirement.priority,
      type: requirement.type,
      expectedCompletionDate: parsedDate,
      attachments: [],
      uploadedFiles: [],
      existingAttachments: requirement.attachments || [],
    });
    setValidationErrors({});
    onEditOpen();
  };

  const handleDeleteRequirement = (requirement: ProjectRequirement) => {
    setRequirementToDelete(requirement);
    onDeleteOpen();
  };

  const handleSaveRequirement = async (saveAsDraft = true) => {
    if (!validateForm() || !projectId) return;

    try {
      const requestData: CreateProjectRequirementRequest = {
        projectId: parseInt(projectId),
        name: formData.name,
        description: formData.description,
        priority: formData.priority,
        type: formData.type,
        expectedCompletionDate:
          formData.expectedCompletionDate?.toString() || "",
        attachments: formData.attachments,
      };

      let savedRequirement: ProjectRequirement;

      if (selectedRequirement) {
        // When editing, only send status if sending to development
        const updateData = saveAsDraft
          ? requestData
          : { ...requestData, status: 2 };

        savedRequirement = await updateRequirement(selectedRequirement.id, {
          ...updateData,
          id: selectedRequirement.id,
        });
      } else {
        savedRequirement = await createRequirement({
          ...requestData,
          status: saveAsDraft ? 1 : 2, // 1=New/Draft, 2=Approved (send to development)
        });
      }

      // Determine removed attachment IDs (existing on requirement but not in kept list)
      const removedAttachments: number[] =
        selectedRequirement?.attachments
          ?.filter(
            (existing) =>
              !formData.existingAttachments.find(
                (kept) => kept.id === existing.id,
              ),
          )
          .map((a) => a.id) || [];

      // Try bulk sync (uploads + deletes). Falls back if endpoint unsupported.
      const syncResult = await projectRequirementsService.syncAttachments(
        savedRequirement.id,
        formData.uploadedFiles,
        removedAttachments,
      );

      if (syncResult === null) {
        // Fallback path: legacy separate calls
        if (formData.uploadedFiles.length > 0) {
          await uploadAttachments(savedRequirement.id, formData.uploadedFiles);
        }
        for (const removedId of removedAttachments) {
          await deleteAttachment(savedRequirement.id, removedId);
        }
      }

      resetForm();
      if (selectedRequirement) {
        onEditOpenChange();
      } else {
        onCreateOpenChange();
      }
    } catch {
      // Error saving requirement
    }
  };

  const confirmDelete = async () => {
    if (requirementToDelete) {
      try {
        await deleteRequirement(requirementToDelete.id);
        setRequirementToDelete(null);
        onDeleteOpenChange();
      } catch {
        // Error deleting requirement
      }
    }
  };

  const handleRequestApproval = async (requirement: ProjectRequirement) => {
    try {
      await sendRequirement(requirement.id, 2); // 2=Approved status when requesting approval
      await refreshData(); // Refresh the grid to show updated requirement status
      await resetFilters();
    } catch {
      // Error requesting approval
    }
  };

  // ...start development removed

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);

    setFormData((prev) => ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, ...newFiles],
    }));
  };

  const handleRemoveFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((_, i) => i !== index),
    }));
  };

  const handleRemoveExistingAttachment = (attachmentId: number) => {
    setFormData((prev) => ({
      ...prev,
      existingAttachments: prev.existingAttachments.filter(
        (att) => att.id !== attachmentId,
      ),
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Helper function to get status color using RequirementStatus lookup
  const getStatusColor = (status: number) => {
    return getRequirementStatusColor(status);
  };

  // Helper function to get status text using RequirementStatus lookup
  const getStatusText = (status: number) => {
    return getRequirementStatusName(status);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";

    try {
      const date = new Date(dateString);

      if (isNaN(date.getTime())) return "-";

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };

  if (!projectId) {
    navigate("/requirements");

    return null;
  }

  // Always show the page content, even during loading
  // if (loading && requirements.length === 0) {
  //   return (
  //     <DefaultLayout>
  //       <div className="flex justify-center items-center min-h-96">
  //         <Spinner size="lg" label={t("common.loading")} />
  //       </div>
  //     </DefaultLayout>
  //   );
  // }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => navigate("/requirements")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {t("requirements.managementForProject")} {projectId}
              </h1>
              <p className="text-default-500">{t("requirements.subtitle")}</p>
            </div>
          </div>

          {/* Stats Cards */}
          {loading && (isInitialLoad || !stats) ? (
            // Skeleton Loader for Stats - show on initial load or when no stats data
            <div className="grid grid-cols-2 md:grid-cols-7 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="p-3">
                  <div className="text-center">
                    <Skeleton className="h-8 w-12 rounded-md mx-auto mb-2" />
                    <Skeleton className="h-3 w-16 rounded-md mx-auto" />
                  </div>
                </Card>
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-7 gap-5">
              <Card className="p-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {stats.total}
                  </div>
                  <div className="text-xs text-default-500">
                    {t("common.total")}
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-default-500">
                    {stats.draft}
                  </div>
                  <div className="text-xs text-default-500">
                    {getStatusText(REQUIREMENT_STATUS.NEW)}
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">
                    {stats.managerReview || 0}
                  </div>
                  <div className="text-xs text-default-500">
                    {getStatusText(REQUIREMENT_STATUS.MANAGER_REVIEW)}
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {stats.approved}
                  </div>
                  <div className="text-xs text-default-500">
                    {getStatusText(REQUIREMENT_STATUS.APPROVED)}
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">
                    {stats.inDevelopment}
                  </div>
                  <div className="text-xs text-default-500">
                    {getStatusText(REQUIREMENT_STATUS.UNDER_DEVELOPMENT)}
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning">
                    {stats.underTesting}
                  </div>
                  <div className="text-xs text-default-500">
                    {getStatusText(REQUIREMENT_STATUS.UNDER_TESTING)}
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">
                    {stats.completed}
                  </div>
                  <div className="text-xs text-default-500">
                    {getStatusText(REQUIREMENT_STATUS.COMPLETED)}
                  </div>
                </div>
              </Card>
            </div>
          ) : null}
        </div>

        {/* Filters and Search */}
        {loading && (isInitialLoad || requirements.length === 0) ? (
          // Skeleton Loader for Filters - show on initial load or when no data
          <Card>
            <CardBody>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <Skeleton className="h-10 w-full md:max-w-xs rounded-lg" />
                <Skeleton className="h-10 w-full md:max-w-xs rounded-lg" />
                <Skeleton className="h-10 w-full md:max-w-xs rounded-lg" />
                <Skeleton className="h-10 w-32 rounded-lg" />
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <Input
                  className="md:max-w-xs"
                  placeholder={t("requirements.searchRequirements")}
                  startContent={
                    <Search
                      className={`w-4 h-4 ${
                        loading && !isInitialLoad
                          ? "animate-pulse text-primary"
                          : ""
                      }`}
                    />
                  }
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />

                <Select
                  className="md:max-w-xs"
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
                  className="md:max-w-xs"
                  items={[
                    { value: "", label: t("requirements.allPriorities") },
                    ...priorityOptions.map((p) => ({
                      value: p.value.toString(),
                      label: language === "ar" ? p.labelAr : p.label,
                    })),
                  ]}
                  placeholder={t("requirements.filterByPriority")}
                  selectedKeys={
                    priorityFilter ? [priorityFilter.toString()] : []
                  }
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;

                    setPriorityFilter(selectedKey || "");
                  }}
                >
                  {(item) => (
                    <SelectItem key={item.value}>{item.label}</SelectItem>
                  )}
                </Select>

                {hasActiveFilters && (
                  <Button
                    className="min-w-fit"
                    size="lg"
                    startContent={<RotateCcw className="w-4 h-4" />}
                    variant="flat"
                    onPress={resetFilters}
                  >
                    {t("common.reset")}
                  </Button>
                )}

                {/* Page Size Selector */}
                {!loading && totalRequirements > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-default-600">
                      {t("common.show")}:
                    </span>
                    <Select
                      className="w-24"
                      selectedKeys={[effectivePageSize.toString()]}
                      size="sm"
                      onSelectionChange={(keys) => {
                        const newSizeStr = Array.from(keys)[0] as string;

                        if (!newSizeStr) return;
                        const newSize = parseInt(newSizeStr, 10);

                        if (!Number.isNaN(newSize)) {
                          handlePageSizeChange(newSize);
                        }
                      }}
                    >
                      {PAGE_SIZE_OPTIONS.map((opt) => {
                        const val = opt.toString();

                        return (
                          <SelectItem key={val} textValue={val}>
                            {val}
                          </SelectItem>
                        );
                      })}
                    </Select>
                    <span className="text-sm text-default-600">
                      {t("pagination.perPage")}
                    </span>
                  </div>
                )}

                {hasPermission({
                  actions: ["requirements.create"],
                }) ? (
                  <Button
                    className="min-w-fit"
                    color="primary"
                    size="lg"
                    startContent={<Plus className="w-4 h-4" />}
                    onPress={handleCreateRequirement}
                  >
                    {t("requirements.addRequirement")}
                  </Button>
                ) : null}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Requirements Table */}
        <Card>
          <CardBody className="p-0">
            {loading && (isInitialLoad || requirements.length === 0) ? (
              // Skeleton Loader for Table - show on initial load or when no data
              <div className="p-6">
                <div className="space-y-4">
                  {/* Table Header Skeleton */}
                  <div className="grid grid-cols-6 gap-4 pb-4 border-b border-divider">
                    <Skeleton className="h-4 w-32 rounded-md" />
                    <Skeleton className="h-4 w-16 rounded-md" />
                    <Skeleton className="h-4 w-20 rounded-md" />
                    <Skeleton className="h-4 w-16 rounded-md" />
                    <Skeleton className="h-4 w-32 rounded-md" />
                    <Skeleton className="h-4 w-20 rounded-md mx-auto" />
                  </div>
                  {/* Table Rows Skeleton */}
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="grid grid-cols-6 gap-4 py-4 border-b border-divider last:border-b-0"
                    >
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48 rounded-md" />
                        <Skeleton className="h-3 w-64 rounded-md" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-sm" />
                        <Skeleton className="h-4 w-24 rounded-md" />
                      </div>
                      <Skeleton className="h-8 w-8 rounded-md mx-auto" />
                    </div>
                  ))}
                </div>
              </div>
            ) : requirements.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="flex flex-col items-center space-y-5 max-w-lg mx-auto">
                  <div className="w-24 h-24 bg-default-100 dark:bg-default-50 rounded-full flex items-center justify-center">
                    <FileText className="w-12 h-12 text-default-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-default-700">
                      {searchTerm
                        ? t("requirements.noResultsTitle")
                        : t("requirements.emptyState.title")}
                    </h3>
                    <p className="text-default-500 text-sm">
                      {searchTerm
                        ? `${t("requirements.noResultsDescription")}: "${searchTerm}"`
                        : t("requirements.emptyState.description")}
                    </p>
                    {searchTerm && (
                      <div className="flex flex-wrap gap-3 justify-center pt-2">
                        <Button
                          size="sm"
                          startContent={<RotateCcw className="w-4 h-4" />}
                          variant="flat"
                          onPress={() => {
                            setSearchTerm("");
                            updateFilters({});
                          }}
                        >
                          {t("common.reset")}
                        </Button>
                      </div>
                    )}
                  </div>
                  {!searchTerm &&
                  hasPermission({ actions: ["requirements.create"] }) ? (
                    <Button
                      color="primary"
                      startContent={<Plus className="w-4 h-4" />}
                      onPress={handleCreateRequirement}
                    >
                      {t("requirements.emptyState.action")}
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="relative">
                {loading && !isInitialLoad && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="text-sm text-default-500">
                      {t("common.loading")}...
                    </div>
                  </div>
                )}
                <Table aria-label="Requirements table">
                  <TableHeader>
                    <TableColumn className="w-[40%] max-w-[400px]">
                      {t("requirements.requirementName")}
                    </TableColumn>
                    <TableColumn>{t("requirements.type")}</TableColumn>
                    <TableColumn>{t("requirements.priority")}</TableColumn>
                    <TableColumn>{t("requirements.status")}</TableColumn>
                    <TableColumn>
                      {t("requirements.expectedCompletion")}
                    </TableColumn>
                    <TableColumn align="center">
                      {t("common.actions")}
                    </TableColumn>
                  </TableHeader>
                  <TableBody>
                    {requirements
                      .filter((req) => req && req.id)
                      .map((requirement) => (
                        <TableRow
                          key={requirement.id}
                          className={
                            highlightedRequirement === requirement.id
                              ? "highlight-flash"
                              : ""
                          }
                          id={`requirement-${requirement.id}`}
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {requirement.name}
                              </div>
                              <div className="text-sm text-default-500 line-clamp-2">
                                <p
                                  dangerouslySetInnerHTML={{
                                    __html: requirement.description,
                                  }}
                                  className="text-sm leading-relaxed"
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
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
                          </TableCell>
                          <TableCell>
                            <Chip
                              color={getPriorityColor(requirement.priority)}
                              size="sm"
                              variant="flat"
                            >
                              {getPriorityLabel(requirement.priority)}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <Chip
                              color={getStatusColor(requirement.status)}
                              size="sm"
                              variant="flat"
                            >
                              {getStatusText(requirement.status)}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-default-400" />
                              <span>
                                {formatDate(requirement.expectedCompletionDate)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Dropdown>
                              <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu>
                                {hasPermission({
                                  actions: ["requirements.update"],
                                }) ? (
                                  <DropdownItem
                                    key="edit"
                                    startContent={<Edit className="w-4 h-4" />}
                                    onPress={() =>
                                      handleEditRequirement(requirement)
                                    }
                                  >
                                    {t("common.edit")}
                                  </DropdownItem>
                                ) : null}
                                {requirement.status ===
                                REQUIREMENT_STATUS.NEW ? (
                                  hasPermission({
                                    actions: ["requirements.send"],
                                  }) ? (
                                    <DropdownItem
                                      key="send"
                                      startContent={
                                        <Send className="w-4 h-4" />
                                      }
                                      onPress={() =>
                                        handleRequestApproval(requirement)
                                      }
                                    >
                                      {t("requirements.requestApproval")}
                                    </DropdownItem>
                                  ) : null
                                ) : null}
                                {hasPermission({
                                  actions: ["requirements.delete"],
                                }) ? (
                                  <DropdownItem
                                    key="delete"
                                    className="text-danger"
                                    color="danger"
                                    startContent={
                                      <Trash2 className="w-4 h-4" />
                                    }
                                    onPress={() =>
                                      handleDeleteRequirement(requirement)
                                    }
                                  >
                                    {t("common.delete")}
                                  </DropdownItem>
                                ) : null}
                              </DropdownMenu>
                            </Dropdown>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Pagination */}
        {totalRequirements > effectivePageSize && (
          <div className="flex justify-center py-6">
            <GlobalPagination
              className="w-full max-w-md"
              currentPage={currentPage}
              isLoading={loading}
              pageSize={effectivePageSize}
              showInfo={true}
              totalItems={totalRequirements}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateOpen || isEditOpen}
        scrollBehavior="inside"
        size="2xl"
        onOpenChange={
          selectedRequirement ? onEditOpenChange : onCreateOpenChange
        }
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {selectedRequirement
                  ? t("requirements.editRequirement")
                  : t("requirements.newRequirement")}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    isRequired
                    errorMessage={validationErrors.name}
                    isInvalid={!!validationErrors.name}
                    label={t("requirements.requirementName")}
                    placeholder={t("requirements.requirementNamePlaceholder")}
                    value={formData.name}
                    onValueChange={(value) =>
                      setFormData({ ...formData, name: value })
                    }
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {t("requirements.requirementDescription")} *
                    </label>
                    <ReactQuill
                      className="rtl-editor"
                      modules={{
                        toolbar: [
                          ["bold", "italic", "underline"],
                          [{ list: "ordered" }, { list: "bullet" }],
                          ["clean"],
                        ],
                      }}
                      placeholder={t(
                        "requirements.requirementDescriptionPlaceholder",
                      )}
                      style={{
                        borderColor: validationErrors.description
                          ? "#f31260"
                          : undefined,
                      }}
                      theme="snow"
                      value={formData.description}
                      onChange={(value) =>
                        setFormData({ ...formData, description: value })
                      }
                    />
                    {validationErrors.description && (
                      <p className="text-tiny text-danger">
                        {validationErrors.description}
                      </p>
                    )}
                  </div>

                  <Select
                    isRequired
                    label={t("requirements.priority")}
                    placeholder={t("requirements.selectPriority")}
                    selectedKeys={[formData.priority.toString()]}
                    onSelectionChange={(keys) =>
                      setFormData({
                        ...formData,
                        priority: parseInt(Array.from(keys)[0] as string),
                      })
                    }
                  >
                    {priorityOptions.map((priority) => (
                      <SelectItem key={priority.value.toString()}>
                        {language === "ar" ? priority.labelAr : priority.label}
                      </SelectItem>
                    ))}
                  </Select>

                  <Select
                    isRequired
                    label={t("requirements.type")}
                    placeholder={t("requirements.selectType")}
                    selectedKeys={[formData.type.toString()]}
                    onSelectionChange={(keys) =>
                      setFormData({
                        ...formData,
                        type: parseInt(Array.from(keys)[0] as string),
                      })
                    }
                  >
                    <SelectItem key={REQUIREMENT_TYPE.NEW.toString()}>
                      {t("requirements.new")}
                    </SelectItem>
                    <SelectItem
                      key={REQUIREMENT_TYPE.CHANGE_REQUEST.toString()}
                    >
                      {t("requirements.changeRequest")}
                    </SelectItem>
                  </Select>

                  <DatePicker
                    isRequired
                    errorMessage={validationErrors.expectedCompletionDate}
                    isInvalid={!!validationErrors.expectedCompletionDate}
                    label={t("requirements.expectedCompletion")}
                    value={formData.expectedCompletionDate}
                    onChange={(date) =>
                      setFormData({ ...formData, expectedCompletionDate: date })
                    }
                  />

                  {/* File Upload Section */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">
                      {t("requirements.attachments")}
                    </label>

                    {/* File Upload Input */}
                    <div className="border-2 border-dashed border-default-300 rounded-lg p-4 hover:border-default-400 transition-colors">
                      <input
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip,.rar"
                        className="hidden"
                        id="file-upload"
                        type="file"
                        onChange={(e) => handleFileSelect(e.target.files)}
                      />
                      <label
                        className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                        htmlFor="file-upload"
                      >
                        <Upload className="w-8 h-8 text-default-400" />
                        <div className="text-center">
                          <p className="text-sm font-medium text-default-700">
                            {t("requirements.uploadFiles")}
                          </p>
                          <p className="text-xs text-default-500">
                            PDF, DOC, XLS, PPT, Images, ZIP (Max 10MB each)
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Existing Attachments */}
                    {formData.existingAttachments.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-default-700">
                          {t("requirements.existingAttachments")}
                        </h4>
                        {formData.existingAttachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between p-3 bg-default-50 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <FileText className="w-4 h-4 text-default-500" />
                              <div>
                                <p className="text-sm font-medium">
                                  {attachment.originalName}
                                </p>
                                <p className="text-xs text-default-500">
                                  {formatFileSize(attachment.fileSize)} •{" "}
                                  {new Date(
                                    attachment.uploadedAt,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => handleFilePreview(attachment)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => {
                                  downloadAttachment(
                                    selectedRequirement?.id || 0,
                                    attachment.id,
                                    attachment.originalName,
                                  );
                                }}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                isIconOnly
                                color="danger"
                                size="sm"
                                variant="light"
                                onPress={() =>
                                  handleRemoveExistingAttachment(attachment.id)
                                }
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* New Uploaded Files */}
                    {formData.uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-default-700">
                          {t("requirements.newFiles")}
                        </h4>
                        {formData.uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-primary-50 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <FileText className="w-4 h-4 text-primary-500" />
                              <div>
                                <p className="text-sm font-medium">
                                  {file.name}
                                </p>
                                <p className="text-xs text-default-500">
                                  {formatFileSize(file.size)}
                                </p>
                              </div>
                            </div>
                            <Button
                              isIconOnly
                              color="danger"
                              size="sm"
                              variant="light"
                              onPress={() => handleRemoveFile(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t("requirements.cancel")}
                </Button>
                {/* When editing an approved requirement, hide draft/send actions */}
                {!(
                  selectedRequirement &&
                  selectedRequirement.status === REQUIREMENT_STATUS.APPROVED
                ) && (
                  <>
                    <Button
                      color="default"
                      isLoading={loading}
                      onPress={() => handleSaveRequirement(true)}
                    >
                      {t("requirements.saveAsDraft")}
                    </Button>
                    <Button
                      color="primary"
                      isLoading={loading}
                      onPress={() => handleSaveRequirement(false)}
                    >
                      {t("requirements.requestApproval")}
                    </Button>
                  </>
                )}
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
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-danger" />
                  {t("requirements.confirmDelete")}
                </div>
              </ModalHeader>
              <ModalBody>
                <p>{t("requirements.deleteConfirmMessage")}</p>
                {requirementToDelete && (
                  <div className="p-3 bg-default-100 rounded-lg">
                    <div className="font-medium">
                      {requirementToDelete.name}
                    </div>
                    <div className="text-sm text-default-500">
                      {requirementToDelete.description}
                    </div>
                  </div>
                )}
                <p className="text-sm text-default-500">
                  {t("requirements.actionCannotBeUndone")}
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t("common.cancel")}
                </Button>
                <Button
                  color="danger"
                  isLoading={loading}
                  onPress={confirmDelete}
                >
                  {t("common.delete")}
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
    </>
  );
}
