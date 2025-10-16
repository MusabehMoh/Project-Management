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
import { Tooltip } from "@heroui/tooltip";
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
  Sparkles,
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
import { useProjectDetails } from "@/hooks/useProjectDetails";
import { projectRequirementsService } from "@/services/api/projectRequirementsService";
import { showWarningToast } from "@/utils/toast";

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

  // Fetch project details
  const { projectName } = useProjectDetails({ projectId });

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

  // AI Prompt Modal state
  const [isAIPromptOpen, setIsAIPromptOpen] = useState(false);
  const [aiPromptText, setAIPromptText] = useState("");
  const [aiGenerating, setAIGenerating] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: "user" | "assistant"; content: string; timestamp: number }>
  >([]);

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
  const [hasFileUploadError, setHasFileUploadError] = useState<boolean>(false);

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
    setHasFileUploadError(false);
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

  const handleSaveRequirement = async (
    saveAsDraft = true,
    preserveStatus = false,
  ) => {
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
        // When editing, only send status if not preserving current status and sending to development
        const updateData = preserveStatus
          ? requestData
          : { ...requestData, status: saveAsDraft ? 1 : 2 };

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

      // Refresh the requirements list to get updated data with attachments
      await refreshData();

      if (selectedRequirement) {
        onEditOpenChange();
      } else {
        onCreateOpenChange();
      }
    } catch {
      // Error saving requirement
    }
  };

  const handleUpdateApprovedRequirement = async () => {
    await handleSaveRequirement(true, true);
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

  // AI Generation handler with conversation history
  const handleAIGenerate = async () => {
    if (!aiPromptText.trim()) return;

    setAIGenerating(true);

    try {
      const userMessage = {
        role: "user" as const,
        content: aiPromptText,
        timestamp: Date.now(),
      };

      // Call n8n webhook with conversation history
      const response = await fetch(
        import.meta.env.VITE_LLM_N8N_WEBHOOK_URL ||
          "http://localhost:5678/webhook/ai-suggest",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            context: aiPromptText,
            field: t("requirements.requirementDescription"),
            previousValues: {
              [t("requirements.requirementName")]: formData.name,
              [t("common.project")]: projectName || "",
            },
            maxTokens: 300, // Longer description
            conversationHistory, // Send conversation history
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to generate AI suggestion");
      }

      const data = await response.json();

      if (data.success && data.data?.suggestion) {
        const aiSuggestion = data.data.suggestion;

        // Convert plain text to HTML for ReactQuill
        const htmlDescription = `<p>${aiSuggestion}</p>`;

        setFormData({
          ...formData,
          description: htmlDescription,
        });

        // Update conversation history
        const assistantMessage = {
          role: "assistant" as const,
          content: aiSuggestion,
          timestamp: Date.now(),
        };

        setConversationHistory([
          ...conversationHistory,
          userMessage,
          assistantMessage,
        ]);

        setAIPromptText(""); // Clear input but keep modal open
      }
    } catch (error) {
      console.error("AI generation error:", error);
      // You can add toast notification here
    } finally {
      setAIGenerating(false);
    }
  };

  // Clear conversation history
  const handleClearConversation = () => {
    setConversationHistory([]);
    setAIPromptText("");
  };

  // ...start development removed

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    // Clear previous error state
    setHasFileUploadError(false);

    // Filter out files with no size (0 bytes) and collect their names
    const emptyFiles: string[] = [];
    const newFiles = Array.from(files).filter((file) => {
      if (file.size === 0) {
        emptyFiles.push(file.name);
        console.warn(
          `File "${file.name}" has no size (0 bytes) and will be skipped`,
        );

        return false;
      }

      return true;
    });

    // Show toast notification and set error state if any files were rejected
    if (emptyFiles.length > 0) {
      setHasFileUploadError(true);
      const fileList = emptyFiles.join(", ");
      const message =
        emptyFiles.length === 1
          ? `${fileList}`
          : `${emptyFiles.length} ${t("requirements.validation.filesEmptyError")}: ${fileList}`;

      showWarningToast(t("requirements.validation.fileEmptyError"), message);

      // Clear error state after 4 seconds (matching toast duration)
      setTimeout(() => {
        setHasFileUploadError(false);
      }, 4000);
    }

    // If all files were empty, don't add anything
    if (newFiles.length === 0) {
      console.warn("All selected files were empty or had no size");

      return;
    }

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                  {projectName ||
                    `${t("requirements.managementForProject")} ${projectId}`}
                </h1>
                <p className="text-default-500">{t("requirements.subtitle")}</p>
              </div>
            </div>

            {/* Add Requirement Button */}
            {hasPermission({
              actions: ["requirements.create"],
            }) ? (
              <Button
                className="sm:min-w-fit"
                color="primary"
                size="lg"
                startContent={<Plus className="w-4 h-4" />}
                onPress={handleCreateRequirement}
              >
                {t("requirements.addRequirement")}
              </Button>
            ) : null}
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
        <Card>
          <CardBody>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <Input
                className="md:max-w-xs"
                isDisabled={loading && isInitialLoad}
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
                isDisabled={loading && isInitialLoad}
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
                isDisabled={loading && isInitialLoad}
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

              {/* Page Size Selector */}
              <div className="flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
                <span className="text-sm text-default-600">
                  {t("common.show")}:
                </span>
                <Select
                  className="w-24 flex-shrink-0"
                  isDisabled={loading && isInitialLoad}
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
            </div>

            {/* Clear Filters */}
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
                                }) &&
                                requirement.status !==
                                  REQUIREMENT_STATUS.UNDER_DEVELOPMENT &&
                                requirement.status !==
                                  REQUIREMENT_STATUS.UNDER_TESTING &&
                                requirement.status !==
                                  REQUIREMENT_STATUS.COMPLETED ? (
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
        scrollBehavior="outside"
        size="4xl"
        onOpenChange={
          selectedRequirement ? onEditOpenChange : onCreateOpenChange
        }
      >
        <ModalContent className="max-h-[90vh]">
          {(onClose) => (
            <>
              <ModalHeader className="flex-shrink-0">
                {selectedRequirement
                  ? t("requirements.editRequirement")
                  : t("requirements.newRequirement")}
              </ModalHeader>
              <ModalBody className="flex-1 overflow-y-auto px-6">
                <div className="space-y-6">
                  {/* Top Row - Basic Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                    <Select
                      label={t("requirements.priority")}
                      selectedKeys={[formData.priority.toString()]}
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as string;

                        if (selectedKey) {
                          setFormData({
                            ...formData,
                            priority: parseInt(selectedKey),
                          });
                        }
                      }}
                    >
                      {priorityOptions.map((priority) => (
                        <SelectItem key={priority.value.toString()}>
                          {language === "ar"
                            ? priority.labelAr
                            : priority.label}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  <div  className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:col-span-2">
                    <Select
                      label={t("requirements.type")}
                      selectedKeys={[formData.type.toString()]}
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as string;

                        if (selectedKey) {
                          setFormData({
                            ...formData,
                            type: parseInt(selectedKey),
                          });
                        }
                      }}
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
                      minValue={parseDate(
                        new Date().toISOString().split("T")[0],
                      )}
                      value={formData.expectedCompletionDate}
                      onChange={(date) =>
                        setFormData({
                          ...formData,
                          expectedCompletionDate: date,
                        })
                      }
                    />
                  </div>

                  {/* Full Width Description Editor with AI Suggestion */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">
                        {t("requirements.requirementDescription")} *
                      </label>
                      <Tooltip content={t("requirements.aiSuggest")}>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          color="secondary"
                          onPress={() => setIsAIPromptOpen(true)}
                        >
                          <Sparkles className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                    </div>
                    <div className="min-h-[240px]">
                      <ReactQuill
                        className={language === "ar" ? "rtl-editor" : ""}
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
                          height: "200px",
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
                    </div>
                    {validationErrors.description && (
                      <p className="text-tiny text-danger">
                        {validationErrors.description}
                      </p>
                    )}
                  </div>

                  {/* File Attachments Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* File Upload Area */}
                    <div className="space-y-4">
                      <label className="text-sm font-medium text-foreground">
                        {t("requirements.attachments")}
                      </label>

                      {/* File Upload Input */}
                      <div
                        className={`border-2 border-dashed rounded-lg p-3 hover:border-default-400 transition-colors ${
                          hasFileUploadError
                            ? "border-danger"
                            : "border-default-300"
                        }`}
                      >
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
                          <Upload className="w-6 h-6 text-default-400" />
                          <div className="text-center">
                            <p className="text-sm font-medium text-default-700">
                              {t("requirements.uploadFiles")}
                            </p>
                            <p className="text-xs text-default-500">
                              PDF, DOC, XLS, PPT, Images, ZIP
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Attachments List */}
                    <div className="space-y-4">
                      {/* Existing & New Attachments in Scrollable Area */}
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {/* Existing Attachments */}
                        {formData.existingAttachments.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-default-700 sticky top-0 bg-background py-1">
                              {t("requirements.existingAttachments")}
                            </h4>
                            {formData.existingAttachments.map((attachment) => (
                              <div
                                key={attachment.id}
                                className="flex items-center justify-between p-2 bg-default-50 rounded-lg"
                              >
                                <div className="flex items-center space-x-2 min-w-0 flex-1">
                                  <FileText className="w-4 h-4 text-default-500 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">
                                      {attachment.originalName}
                                    </p>
                                    <p className="text-xs text-default-500">
                                      {formatFileSize(attachment.fileSize)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1 flex-shrink-0">
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={() =>
                                      handleFilePreview(attachment)
                                    }
                                  >
                                    <Eye className="w-3 h-3" />
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
                                    <Download className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    isIconOnly
                                    color="danger"
                                    size="sm"
                                    variant="light"
                                    onPress={() =>
                                      handleRemoveExistingAttachment(
                                        attachment.id,
                                      )
                                    }
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* New Uploaded Files */}
                        {formData.uploadedFiles.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-default-700 sticky top-0 bg-background py-1">
                              {t("requirements.newFiles")}
                            </h4>
                            {formData.uploadedFiles.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-primary-50 rounded-lg"
                              >
                                <div className="flex items-center space-x-2 min-w-0 flex-1">
                                  <FileText className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">
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
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter className="flex-shrink-0">
                <Button variant="light" onPress={onClose}>
                  {t("requirements.cancel")}
                </Button>
                {/* When editing an approved requirement, show update button */}
                {selectedRequirement &&
                selectedRequirement.status === REQUIREMENT_STATUS.APPROVED ? (
                  <Button
                    color="primary"
                    isLoading={loading}
                    onPress={handleUpdateApprovedRequirement}
                  >
                    {t("common.update")}
                  </Button>
                ) : (
                  /* When editing non-approved requirement, show draft/send actions */
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
                  </div>
                )}
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

      {/* AI Prompt Modal */}
      <Modal
        isOpen={isAIPromptOpen}
        onOpenChange={(open) => {
          setIsAIPromptOpen(open);
          if (!open) {
            // Don't clear history when closing modal
            setAIPromptText("");
          }
        }}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex gap-2 items-center justify-between">
                <div className="flex gap-2 items-center">
                  <Sparkles className="w-5 h-5 text-secondary" />
                  <span>{t("requirements.aiSuggest")}</span>
                </div>
                {conversationHistory.length > 0 && (
                  <Button
                    size="sm"
                    variant="light"
                    color="danger"
                    startContent={<Trash2 className="w-4 h-4" />}
                    onPress={handleClearConversation}
                  >
                    {t("requirements.clearHistory")}
                  </Button>
                )}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  {/* Conversation History */}
                  {conversationHistory.length > 0 && (
                    <div className="space-y-3 max-h-64 overflow-y-auto border border-default-200 rounded-lg p-3">
                      <p className="text-xs text-default-500 font-medium mb-2">
                        {t("requirements.conversationHistory")}
                      </p>
                      {conversationHistory.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              msg.role === "user"
                                ? "bg-secondary-50 dark:bg-secondary-100/10 text-secondary-900 dark:text-secondary-100"
                                : "bg-default-100 dark:bg-default-50/10"
                            }`}
                            dir={language === "ar" ? "rtl" : "ltr"}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-xs text-default-400 mt-1">
                              {new Date(msg.timestamp).toLocaleTimeString(
                                language === "ar" ? "ar-SA" : "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-sm text-default-600">
                    {conversationHistory.length > 0
                      ? t("requirements.aiContinuePrompt")
                      : t("requirements.aiPromptDescription")}
                  </p>

                  <Input
                    autoFocus
                    label={t("requirements.aiPromptLabel")}
                    placeholder={t("requirements.aiPromptPlaceholder")}
                    value={aiPromptText}
                    onValueChange={setAIPromptText}
                    description={t("requirements.aiPromptExample")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && aiPromptText.trim()) {
                        e.preventDefault();
                        handleAIGenerate();
                      }
                    }}
                  />

                  {/* Show context being used */}
                  {conversationHistory.length === 0 && (
                    <div className="bg-default-50 dark:bg-default-100/10 p-3 rounded-lg">
                      <p className="text-xs text-default-500 mb-1">
                        {t("requirements.aiContext")}
                      </p>
                      <div className="space-y-1">
                        {formData.name && (
                          <p className="text-sm">
                            <span className="font-medium">
                              {t("requirements.requirementName")}:
                            </span>{" "}
                            {formData.name}
                          </p>
                        )}
                        {projectName && (
                          <p className="text-sm">
                            <span className="font-medium">
                              {t("common.project")}:
                            </span>{" "}
                            {projectName}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {conversationHistory.length > 0
                    ? t("common.close")
                    : t("common.cancel")}
                </Button>
                <Button
                  color="secondary"
                  startContent={
                    !aiGenerating && <Sparkles className="w-4 h-4" />
                  }
                  isLoading={aiGenerating}
                  isDisabled={!aiPromptText.trim()}
                  onPress={handleAIGenerate}
                >
                  {t("requirements.generate")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
