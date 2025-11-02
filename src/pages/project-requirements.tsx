import type {
  ProjectRequirement,
  CreateProjectRequirementRequest,
  ProjectRequirementAttachment,
} from "@/types/projectRequirement";

import { useState, useEffect, useRef } from "react";
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
import { Textarea } from "@heroui/input";
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
import { ScrollShadow } from "@heroui/scroll-shadow";
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
  Check,
  Clock,
  Play,
} from "lucide-react";
import { parseDate } from "@internationalized/date";

import { FilePreview } from "@/components/FilePreview";
import { GlobalPagination } from "@/components/GlobalPagination";
import {
  convertTypeToString,
  REQUIREMENT_STATUS,
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
import {
  showWarningToast,
  showSuccessToast,
  showErrorToast,
} from "@/utils/toast";
import { getFileUploadConfig } from "@/config/environment";
import { validateDateNotInPast } from "@/utils/dateValidation";

// Form data type for creating/editing requirements
// Uses string values for UI components - will be converted to integers before API calls
interface RequirementFormData {
  name: string;
  description: string;
  priority: number; // Integer value matching backend enum
  type: number; // Integer value matching backend enum
  expectedCompletionDate: any;
  uploadedFiles: File[];
  existingAttachments: ProjectRequirementAttachment[];
}

export default function ProjectRequirementsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  // Wrapper function for validation that passes translation
  const handleValidateDateNotInPast = (
    value: any,
  ): string | true | null | undefined => {
    return validateDateNotInPast(value, t);
  };

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
  const [currentPageSize, setCurrentPageSize] = useState(10);
  const [isOptionOpen, setIsOptionOpen] = useState(false);

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
    downloadAttachment,
  } = useProjectRequirements({
    projectId: projectId ? parseInt(projectId) : undefined,
    pageSize: currentPageSize,
    // Preserve user input; we'll show a 'no results' state instead of clearing.
    // onSearchNoResults intentionally left unused to avoid unexpected clearing UX.
    // onSearchNoResults: () => {},
  });

  // Pagination page size options
  const effectivePageSize = normalizePageSize(currentPageSize, 10);

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
      setFileOperationLoading(true);

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
    } finally {
      setFileOperationLoading(false);
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
  const {
    isOpen: isPostponeOpen,
    onOpen: onPostponeOpen,
    onOpenChange: onPostponeOpenChange,
  } = useDisclosure();
  const {
    isOpen: isUnpostponeOpen,
    onOpen: onUnpostponeOpen,
    onOpenChange: onUnpostponeOpenChange,
  } = useDisclosure();

  // AI Prompt Modal state
  const [isAIPromptOpen, setIsAIPromptOpen] = useState(false);
  const [aiPromptText, setAIPromptText] = useState("");
  const [aiGenerating, setAIGenerating] = useState(false);
  const [aiSessionId] = useState(() => `req-${projectId}-${Date.now()}`); // Unique session per project
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: "user" | "assistant"; content: string; timestamp: number }>
  >([]);

  // Ref for auto-scrolling conversation
  const conversationEndRef = useRef<HTMLDivElement>(null);

  // Form states
  const [selectedRequirement, setSelectedRequirement] =
    useState<ProjectRequirement | null>(null);
  const [requirementToDelete, setRequirementToDelete] =
    useState<ProjectRequirement | null>(null);
  const [requirementToPostpone, setRequirementToPostpone] =
    useState<ProjectRequirement | null>(null);
  const [requirementToUnpostpone, setRequirementToUnpostpone] =
    useState<ProjectRequirement | null>(null);
  const [postponeReason, setPostponeReason] = useState<string>("");
  const [postponeLoading, setPostponeLoading] = useState(false);
  const [unpostponeLoading, setUnpostponeLoading] = useState(false);
  const [fileOperationLoading, setFileOperationLoading] =
    useState<boolean>(false);
  const [formData, setFormData] = useState<RequirementFormData>({
    name: "",
    description: "",
    priority: 0, // No default priority - user must select
    type: 0, // No default type - user must select
    expectedCompletionDate: null,
    uploadedFiles: [],
    existingAttachments: [],
  });
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [hasFileUploadError, setHasFileUploadError] = useState<boolean>(false);
  const [loadingAttachments, setLoadingAttachments] = useState<boolean>(false);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<number[]>(
    [],
  );
  const [isSavingWithAttachments, setIsSavingWithAttachments] =
    useState<boolean>(false);

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

  // Auto-scroll to bottom when conversation history changes
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversationHistory]);

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
    if (!formData.priority || formData.priority === 0) {
      errors.priority = t("requirements.validation.priorityRequired");
    }
    if (!formData.type || formData.type === 0) {
      errors.type = t("requirements.validation.typeRequired");
    }
    if (!formData.expectedCompletionDate) {
      errors.expectedCompletionDate = t(
        "requirements.validation.expectedDateRequired",
      );
    } else {
      // Validate expected completion date is not in the past
      const dateValidation = handleValidateDateNotInPast(
        formData.expectedCompletionDate,
      );

      if (dateValidation !== true) {
        errors.expectedCompletionDate = t("common.validation.dateNotInPast");
      }
    }

    setValidationErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      priority: 0, // No default priority - user must select
      type: 0, // No default type - user must select
      expectedCompletionDate: null,
      uploadedFiles: [],
      existingAttachments: [],
    });
    setValidationErrors({});
    setHasFileUploadError(false);
    setLoadingAttachments(false);
    setSelectedRequirement(null);
    setRemovedAttachmentIds([]);
  };

  const handleCreateRequirement = () => {
    resetForm();
    onCreateOpen();
  };

  const handleEditRequirement = (requirement: ProjectRequirement) => {
    // Set selected requirement immediately from list
    setSelectedRequirement(requirement);
    setLoadingAttachments(true);

    setValidationErrors({});

    // Open modal immediately - don't wait for API
    onEditOpen();

    // Fetch full requirement details with all fields in background
    projectRequirementsService
      .getRequirement(requirement.id)
      .then((fullRequirement) => {
        // Parse the expected completion date from API response
        let parsedDate = null;

        if (fullRequirement.expectedCompletionDate) {
          try {
            const dateStr = fullRequirement.expectedCompletionDate as string;
            const datePart = dateStr.split("T")[0]; // Get YYYY-MM-DD

            parsedDate = parseDate(datePart);
          } catch {
            // Silently ignore date parsing errors
          }
        }

        // Update form data with complete API response
        setFormData((prevFormData) => ({
          ...prevFormData,
          name: fullRequirement.name,
          description: fullRequirement.description,
          priority: fullRequirement.priority,
          type: fullRequirement.type,
          expectedCompletionDate: parsedDate,
          existingAttachments: fullRequirement.attachments || [],
        }));

        setLoadingAttachments(false);
      })
      .catch(() => {
        // Silently fail - modal is already open with basic data
        // User can still work with what's displayed
        setLoadingAttachments(false);
      });
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

    // Set loading state for attachment operations
    setIsSavingWithAttachments(true);

    try {
      const requestData: CreateProjectRequirementRequest = {
        projectId: parseInt(projectId, 10),
        name: formData.name,
        description: formData.description,
        priority: formData.priority,
        type: formData.type,
        expectedCompletionDate:
          formData.expectedCompletionDate?.toString() || "",
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

      const keepAttachmentIds = formData.existingAttachments.map(
        (attachment) => attachment.id,
      );
      const hasAttachmentUploads = formData.uploadedFiles.length > 0;
      const originalAttachmentCount =
        selectedRequirement?.attachments?.length ?? 0;
      const hasAttachmentRemovals =
        removedAttachmentIds.length > 0 ||
        originalAttachmentCount > keepAttachmentIds.length;

      const attachmentErrors: string[] = [];

      if (hasAttachmentUploads || hasAttachmentRemovals) {
        try {
          await uploadAttachments(
            savedRequirement.id,
            formData.uploadedFiles,
            selectedRequirement ? keepAttachmentIds : undefined,
            removedAttachmentIds,
          );
        } catch (error) {
          const errorMsg =
            error instanceof Error
              ? error.message
              : "Failed to process requirement attachments";

          attachmentErrors.push(errorMsg);
        }
      }

      resetForm();

      // Refresh the requirements list to get updated data with attachments AFTER all operations complete
      await refreshData();

      // Show consolidated result message
      if (attachmentErrors.length > 0) {
        // Show warning if some attachments had issues but requirement was saved
        showWarningToast(
          t("requirements.partialSuccess") || "Partially Saved",
          `Requirement saved, but: ${attachmentErrors.join("; ")}`,
        );
      } else {
        // Show success if everything worked
        showSuccessToast(t("requirements.saveSuccess") || "Saved Successfully");
      }

      if (selectedRequirement) {
        onEditOpenChange();
      } else {
        onCreateOpenChange();
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to save requirement";

      showErrorToast(t("requirements.saveError") || "Error", errorMsg);
    } finally {
      // Clear the attachment saving state after all operations complete
      setIsSavingWithAttachments(false);
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

  const handlePostponeRequirement = (requirement: ProjectRequirement) => {
    setRequirementToPostpone(requirement);
    setPostponeReason("");
    onPostponeOpen();
  };

  const handleUnpostponeRequirement = (requirement: ProjectRequirement) => {
    setRequirementToUnpostpone(requirement);
    onUnpostponeOpen();
  };

  const confirmPostpone = async () => {
    if (!requirementToPostpone || !postponeReason.trim()) return;

    setPostponeLoading(true);
    try {
      await projectRequirementsService.postponeRequirement(
        requirementToPostpone.id,
        postponeReason,
      );
      showSuccessToast(t("requirements.postponeSuccess"));
      await refreshData();
      await resetFilters();
      setRequirementToPostpone(null);
      setPostponeReason("");
      onPostponeOpenChange();
    } catch (error) {
      showErrorToast(t("requirements.postponeError"));
      console.error("Error postponing requirement:", error);
    } finally {
      setPostponeLoading(false);
    }
  };

  const confirmUnpostpone = async () => {
    if (!requirementToUnpostpone) return;

    setUnpostponeLoading(true);
    try {
      await projectRequirementsService.unpostponeRequirement(
        requirementToUnpostpone.id,
      );
      showSuccessToast(t("requirements.unpostponeSuccess"));
      await refreshData();
      await resetFilters();
      setRequirementToUnpostpone(null);
      onUnpostponeOpenChange();
    } catch (error) {
      showErrorToast(t("requirements.unpostponeError"));
      console.error("Error unpostponing requirement:", error);
    } finally {
      setUnpostponeLoading(false);
    }
  };

  // AI Generation handler with streaming support
  const handleAIGenerate = async () => {
    if (!aiPromptText.trim()) return;

    setAIGenerating(true);

    try {
      const userMessage = {
        role: "user" as const,
        content: aiPromptText,
        timestamp: Date.now(),
      };

      // Add user message to conversation immediately
      const updatedHistory = [...conversationHistory, userMessage];

      setConversationHistory(updatedHistory);

      // Create a placeholder for streaming response
      const streamingMessage = {
        role: "assistant" as const,
        content: "",
        timestamp: Date.now(),
      };

      setConversationHistory([...updatedHistory, streamingMessage]);

      // Clear input
      setAIPromptText("");

      // Build conversation history for Ollama
      const messages = updatedHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Add context information for the first message
      let systemPrompt = `أنت محلل متطلبات برمجية خبير متخصص في كتابة متطلبات تقنية احترافية. يمكنك التحدث مع المستخدم لفهم احتياجاته بشكل أفضل.

قواعد الرد:
1. إذا سألك المستخدم سؤالاً أو طلب توضيحاً، أجب بشكل مهذب ومفيد دون تكرار الترحيب في كل مرة
2. إذا طلب منك كتابة وصف تقني، اكتبه مباشرة دون مقدمات
3. عند كتابة الوصف التقني:
   - استخدم 3-5 جمل متماسكة
   - ركز على: الهدف، الوظائف الأساسية، المعايير التقنية (APIs, قواعد البيانات، frameworks)، معايير الأداء
   - استخدم مصطلحات تقنية دقيقة
   - لا تكتب عناوين أو أرقام أو نقاط
   - ابدأ مباشرة بالوصف دون كتابة "الوصف:" أو "المتطلب:"
4. اكتب بالعربية الفصحى إذا كان السياق بالعربية، وبالإنجليزية إذا كان بالإنجليزية
5. تذكر المحادثة السابقة واستخدمها لتحسين الوصف - لا تكرر نفس المعلومات
6. يمكنك طلب معلومات إضافية إذا كان السياق غير واضح
7. لا تكرر الترحيب في كل رد - فقط في الرسالة الأولى`;

      // Add project context for first message
      if (messages.length === 1 && (formData.name || projectName)) {
        systemPrompt += `\n\nمعلومات المشروع:`;
        if (projectName) systemPrompt += `\n- المشروع: ${projectName}`;
        if (formData.name)
          systemPrompt += `\n- ${t("requirements.requirementName")}: ${formData.name}`;
      }

      // Call Ollama streaming API directly
      const response = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3.1:8b",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          stream: true,
          options: {
            temperature: 0.5,
            num_predict: 400,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate AI suggestion");
      }

      // Read streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n").filter((line) => line.trim());

          for (const line of lines) {
            try {
              const json = JSON.parse(line);

              if (json.message?.content) {
                fullResponse += json.message.content;

                // Update streaming message in real-time
                setConversationHistory([
                  ...updatedHistory,
                  {
                    ...streamingMessage,
                    content: fullResponse,
                  },
                ]);
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }

      // After streaming completes, save to n8n for memory
      try {
        await fetch(
          import.meta.env.VITE_LLM_N8N_AGENT_WEBHOOK_URL ||
            "http://localhost:5678/webhook/ai-suggest-agent",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              context: userMessage.content,
              response: fullResponse,
              sessionId: aiSessionId,
              saveToMemory: true, // Flag to indicate memory-only save
              field: t("requirements.requirementDescription"),
              previousValues: {
                [t("requirements.requirementName")]: formData.name,
                [t("common.project")]: projectName || "",
              },
            }),
          },
        );
      } catch (memoryError) {
        console.warn("Failed to save to n8n memory:", memoryError);
        // Don't throw - streaming already succeeded
      }
    } catch (error) {
      console.error("AI generation error:", error);
      // Remove failed message and show error
      setConversationHistory(conversationHistory);
    } finally {
      setAIGenerating(false);
    }
  };

  // Clear conversation history
  const handleClearConversation = () => {
    setConversationHistory([]);
    setAIPromptText("");
  };

  // Use AI suggestion in description field
  const handleUseAISuggestion = (content: string) => {
    // Split content by double line breaks (empty lines between paragraphs)
    const paragraphs = content
      .split(/\n\s*\n/) // Split by one or more empty lines
      .map((para) => para.trim())
      .filter((para) => para.length > 0);

    // Wrap each paragraph in <p> tags
    const htmlDescription = paragraphs.map((para) => `<p>${para}</p>`).join("");

    setFormData((prev) => ({
      ...prev,
      description: htmlDescription || `<p>${content}</p>`,
    }));

    // Show success feedback
    showSuccessToast(
      language === "ar"
        ? "تم إضافة الوصف بنجاح"
        : "Description added successfully",
    );

    // Close the modal
    setIsAIPromptOpen(false);
  };

  // ...start development removed

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    // Clear previous error state
    setHasFileUploadError(false);

    // Get file upload configuration
    const { maxFileSizeMB, allowedFileTypes } = getFileUploadConfig();
    const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024; // Convert MB to bytes

    // Arrays to collect rejected files by type
    const emptyFiles: string[] = [];
    const oversizedFiles: string[] = [];
    const invalidTypeFiles: string[] = [];

    const newFiles = Array.from(files).filter((file) => {
      // Check for empty files (0 bytes)
      if (file.size === 0) {
        emptyFiles.push(file.name);
        console.warn(
          `File "${file.name}" has no size (0 bytes) and will be skipped`,
        );

        return false;
      }

      // Check file size
      if (file.size > maxFileSizeBytes) {
        oversizedFiles.push(file.name);
        console.warn(
          `File "${file.name}" exceeds maximum size limit of ${maxFileSizeMB}MB`,
        );

        return false;
      }

      // Check file type
      const fileExtension = file.name.split(".").pop()?.toLowerCase();

      if (!fileExtension || !allowedFileTypes.includes(fileExtension)) {
        invalidTypeFiles.push(file.name);
        console.warn(
          `File "${file.name}" has invalid type. Allowed types: ${allowedFileTypes.join(", ")}`,
        );

        return false;
      }

      return true;
    });

    // Show toast notifications for rejected files
    const allRejectedFiles = [
      ...emptyFiles,
      ...oversizedFiles,
      ...invalidTypeFiles,
    ];

    if (allRejectedFiles.length > 0) {
      setHasFileUploadError(true);
      // Handle empty files
      if (emptyFiles.length > 0) {
        const fileList = emptyFiles.join(", ");
        const message =
          emptyFiles.length === 1
            ? `${fileList}`
            : `${emptyFiles.length} ${t("requirements.validation.filesEmptyError")}: ${fileList}`;

        showWarningToast(t("requirements.validation.fileEmptyError"), message);
      }

      // Handle oversized files
      if (oversizedFiles.length > 0) {
        const fileList = oversizedFiles.join(", ");

        showWarningToast(
          t("requirements.validation.filesSizeTooLarge"),
          fileList,
        );
      }

      // Handle invalid type files
      if (invalidTypeFiles.length > 0) {
        const fileList = invalidTypeFiles.join(", ");
        const allowedTypesStr = allowedFileTypes.join(", ");

        showWarningToast(
          t("requirements.validation.fileTypeNotAllowed")
            .replace("{0}", invalidTypeFiles[0])
            .replace("{1}", allowedTypesStr),
          fileList,
        );
      }

      // Clear error state after 4 seconds (matching toast duration)
      setTimeout(() => {
        setHasFileUploadError(false);
      }, 4000);

      // Don't add any files if there are validation errors
      return;
    }

    // Only add files if all validation passed
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
    // Track the removed attachment ID
    setRemovedAttachmentIds((prev) => [...prev, attachmentId]);
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
                onPress={() => navigate(-1)}
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
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <Input
            className="md:max-w-xs"
            isDisabled={loading && isInitialLoad}
            placeholder={t("requirements.searchRequirements")}
            startContent={
              <Search
                className={`w-4 h-4 ${
                  loading && !isInitialLoad ? "animate-pulse text-primary" : ""
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
            {(item) => <SelectItem key={item.value}>{item.label}</SelectItem>}
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
            {(item) => <SelectItem key={item.value}>{item.label}</SelectItem>}
          </Select>

          {/* Page Size Selector */}
          <div className="flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
            <span className="text-sm text-default-600">
              {t("common.show")}:
            </span>
            <Select
              className="w-24 flex-shrink-0"
              isDisabled={loading && isInitialLoad}
              isOpen={isOptionOpen}
              selectedKeys={[effectivePageSize.toString()]}
              size="sm"
              onOpenChange={setIsOptionOpen}
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
                  <SelectItem
                    key={val}
                    textValue={val}
                    onPress={() => {
                      setIsOptionOpen(false); // Force close when any item is clicked
                    }}
                  >
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
              {t("requirements.requirementsFound").replace(
                "{count}",
                totalRequirements.toString(),
              )}
            </span>
          </div>
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
                                {requirement.status ===
                                  REQUIREMENT_STATUS.NEW ||
                                requirement.status ===
                                  REQUIREMENT_STATUS.MANAGER_REVIEW ||
                                requirement.status ===
                                  REQUIREMENT_STATUS.APPROVED ? (
                                  <DropdownItem
                                    key="postpone"
                                    startContent={<Clock className="w-4 h-4" />}
                                    onPress={() =>
                                      handlePostponeRequirement(requirement)
                                    }
                                  >
                                    {t("requirements.postpone")}
                                  </DropdownItem>
                                ) : null}
                                {requirement.status ===
                                REQUIREMENT_STATUS.POSTPONED ? (
                                  <DropdownItem
                                    key="unpostpone"
                                    startContent={<Play className="w-4 h-4" />}
                                    onPress={() =>
                                      handleUnpostponeRequirement(requirement)
                                    }
                                  >
                                    {t("requirements.unpostpone")}
                                  </DropdownItem>
                                ) : null}
                                {hasPermission({
                                  actions: ["requirements.delete"],
                                }) &&
                                requirement.status !==
                                  REQUIREMENT_STATUS.UNDER_DEVELOPMENT &&
                                requirement.status !==
                                  REQUIREMENT_STATUS.COMPLETED ? (
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
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            resetForm();
          }
          if (selectedRequirement) {
            onEditOpenChange();
          } else {
            onCreateOpenChange();
          }
        }}
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
                        setFormData((prev) => ({ ...prev, name: value }))
                      }
                    />
                    <Select
                      isClearable
                      isRequired
                      errorMessage={validationErrors.priority}
                      isInvalid={!!validationErrors.priority}
                      label={t("requirements.priority")}
                      placeholder={t("requirements.selectPriority")}
                      selectedKeys={
                        formData.priority > 0
                          ? [formData.priority.toString()]
                          : []
                      }
                      onClear={() => {
                        setFormData((prev) => ({
                          ...prev,
                          priority: 0,
                        }));
                      }}
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as string;

                        if (selectedKey) {
                          setFormData((prev) => ({
                            ...prev,
                            priority: parseInt(selectedKey),
                          }));
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:col-span-2">
                    <Select
                      isClearable
                      isRequired
                      errorMessage={validationErrors.type}
                      isInvalid={!!validationErrors.type}
                      label={t("requirements.type")}
                      placeholder={t("requirements.selectType")}
                      selectedKeys={
                        formData.type > 0 ? [formData.type.toString()] : []
                      }
                      onClear={() => {
                        setFormData((prev) => ({
                          ...prev,
                          type: 0,
                        }));
                      }}
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as string;

                        if (selectedKey) {
                          setFormData((prev) => ({
                            ...prev,
                            type: parseInt(selectedKey),
                          }));
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
                        setFormData((prev) => ({
                          ...prev,
                          expectedCompletionDate: date,
                        }))
                      }
                    />
                  </div>

                  {/* Full Width Description Editor with AI Suggestion */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">
                        {t("requirements.requirementDescription")}{" "}
                        <span className="text-danger">*</span>
                      </label>
                      <Tooltip content={t("requirements.aiSuggest")}>
                        <Button
                          isIconOnly
                          color="secondary"
                          size="sm"
                          variant="flat"
                          onPress={() => setIsAIPromptOpen(true)}
                        >
                          <Sparkles className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                    </div>
                    <div className="rounded-lg border border-default-200 overflow-hidden">
                      <div style={{ height: "240px" }}>
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
                            height: "100%",
                            borderColor: validationErrors.description
                              ? "#f31260"
                              : undefined,
                          }}
                          theme="snow"
                          value={formData.description}
                          onChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              description: value,
                            }))
                          }
                        />
                      </div>
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
                        {/* Loading Skeletons */}
                        {loadingAttachments && selectedRequirement && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-default-700 sticky top-0 bg-background py-1">
                              {t("requirements.existingAttachments")}
                            </h4>
                            {[1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between p-2 bg-default-50 rounded-lg"
                              >
                                <div className="flex items-center space-x-2 min-w-0 flex-1">
                                  <Skeleton className="w-4 h-4 rounded" />
                                  <div className="min-w-0 flex-1 space-y-1">
                                    <Skeleton className="h-3 w-32 rounded" />
                                    <Skeleton className="h-2 w-20 rounded" />
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1 flex-shrink-0">
                                  <Skeleton className="w-6 h-6 rounded" />
                                  <Skeleton className="w-6 h-6 rounded" />
                                  <Skeleton className="w-6 h-6 rounded" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Existing Attachments */}
                        {!loadingAttachments &&
                          formData.existingAttachments.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-default-700 sticky top-0 bg-background py-1">
                                {t("requirements.existingAttachments")}
                              </h4>
                              {formData.existingAttachments.map(
                                (attachment) => (
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
                                        isLoading={fileOperationLoading}
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
                                        isLoading={fileOperationLoading}
                                        size="sm"
                                        variant="light"
                                        onPress={() => {
                                          setFileOperationLoading(true);
                                          downloadAttachment(
                                            selectedRequirement?.id || 0,
                                            attachment.id,
                                            attachment.originalName,
                                          ).finally(() =>
                                            setFileOperationLoading(false),
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
                                ),
                              )}
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
                    isLoading={loading || isSavingWithAttachments}
                    onPress={handleUpdateApprovedRequirement}
                  >
                    {t("common.update")}
                  </Button>
                ) : (
                  /* When editing non-approved requirement, show draft/send actions */
                  <>
                    <Button
                      color="default"
                      isLoading={loading || isSavingWithAttachments}
                      onPress={() => handleSaveRequirement(true)}
                    >
                      {t("requirements.saveAsDraft")}
                    </Button>
                    <Button
                      color="primary"
                      isLoading={loading || isSavingWithAttachments}
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

      {/* Postpone Confirmation Modal */}
      <Modal isOpen={isPostponeOpen} onOpenChange={onPostponeOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-warning" />
                  {t("requirements.postponeRequirement")}
                </div>
              </ModalHeader>
              <ModalBody>
                <p>{t("requirements.postponeConfirmMessage")}</p>
                {requirementToPostpone && (
                  <div className="p-3 bg-default-100 rounded-lg mb-4">
                    <div className="font-medium">
                      {requirementToPostpone.name}
                    </div>
                  </div>
                )}
                <Textarea
                  isRequired
                  errorMessage={
                    !postponeReason.trim()
                      ? t("requirements.postponeReasonRequired")
                      : ""
                  }
                  isInvalid={!postponeReason.trim()}
                  label={t("requirements.postponeReason")}
                  minRows={3}
                  placeholder={t("requirements.postponeReason")}
                  value={postponeReason}
                  onChange={(e) => setPostponeReason(e.target.value)}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t("common.cancel")}
                </Button>
                <Button
                  color="warning"
                  isDisabled={!postponeReason.trim()}
                  isLoading={postponeLoading}
                  onPress={confirmPostpone}
                >
                  {t("requirements.postpone")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Unpostpone Confirmation Modal */}
      <Modal isOpen={isUnpostponeOpen} onOpenChange={onUnpostponeOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-success" />
                  {t("requirements.unpostponeRequirement")}
                </div>
              </ModalHeader>
              <ModalBody>
                <p>{t("requirements.unpostponeConfirmMessage")}</p>
                {requirementToUnpostpone && (
                  <div className="p-3 bg-default-100 rounded-lg mb-4">
                    <div className="font-medium">
                      {requirementToUnpostpone.name}
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t("common.cancel")}
                </Button>
                <Button
                  color="primary"
                  isLoading={unpostponeLoading}
                  onPress={confirmUnpostpone}
                >
                  {t("requirements.unpostpone")}
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
        classNames={{
          base: "max-h-[90vh]",
          body: "p-0",
        }}
        isOpen={isAIPromptOpen}
        scrollBehavior="inside"
        size="3xl"
        onOpenChange={(open) => {
          setIsAIPromptOpen(open);
          if (!open) {
            // Don't clear history when closing modal
            setAIPromptText("");
          }
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="border-b border-default-200 px-6 py-4">
                <div className="flex gap-3 items-center">
                  <div className="p-2 bg-secondary-50 dark:bg-secondary-100/10 rounded-lg">
                    <Sparkles className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">
                      {t("requirements.aiSuggest")}
                    </h3>
                    <p className="text-xs text-default-500 font-normal">
                      {language === "ar"
                        ? "محلل متطلبات برمجية ذكي"
                        : "AI Requirements Analyst"}
                    </p>
                  </div>
                  {conversationHistory.length > 0 && (
                    <Button
                      className="me-8"
                      color="danger"
                      size="sm"
                      startContent={<RotateCcw className="w-4 h-4" />}
                      variant="flat"
                      onPress={handleClearConversation}
                    >
                      {t("requirements.clearHistory")}
                    </Button>
                  )}
                </div>
              </ModalHeader>
              <ModalBody className="px-6 py-4">
                <div className="space-y-4">
                  {/* Conversation History */}
                  {conversationHistory.length > 0 ? (
                    <ScrollShadow
                      hideScrollBar
                      className="max-h-[500px]"
                      size={20}
                    >
                      <div className="space-y-3 pr-2">
                        {conversationHistory.map((msg, index) => (
                          <div
                            key={index}
                            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            {msg.role === "assistant" && (
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary-100 dark:bg-secondary-100/20 flex items-center justify-center mt-1">
                                <Sparkles className="w-4 h-4 text-secondary" />
                              </div>
                            )}
                            <div
                              className={`max-w-[75%] ${
                                msg.role === "user"
                                  ? "bg-primary-500 text-white shadow-md"
                                  : "bg-default-100 dark:bg-default-50/10 border border-default-200"
                              } rounded-2xl`}
                              dir={language === "ar" ? "rtl" : "ltr"}
                            >
                              <div className="px-4 py-3">
                                {/* Show breathing animation for empty assistant messages (loading) */}
                                {msg.role === "assistant" && !msg.content ? (
                                  <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                      <div
                                        className="w-2 h-2 bg-secondary rounded-full animate-pulse"
                                        style={{
                                          animationDelay: "0ms",
                                          animationDuration: "1.4s",
                                        }}
                                      />
                                      <div
                                        className="w-2 h-2 bg-secondary rounded-full animate-pulse"
                                        style={{
                                          animationDelay: "200ms",
                                          animationDuration: "1.4s",
                                        }}
                                      />
                                      <div
                                        className="w-2 h-2 bg-secondary rounded-full animate-pulse"
                                        style={{
                                          animationDelay: "400ms",
                                          animationDuration: "1.4s",
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs text-default-400">
                                      {language === "ar"
                                        ? "جاري التفكير..."
                                        : "Thinking..."}
                                    </span>
                                  </div>
                                ) : (
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {msg.content}
                                  </p>
                                )}
                                {/* Only show timestamp if message has content or is from user */}
                                {(msg.content || msg.role === "user") && (
                                  <p
                                    className={`text-xs mt-2 ${
                                      msg.role === "user"
                                        ? "text-white/70"
                                        : "text-default-400"
                                    }`}
                                  >
                                    {new Date(msg.timestamp).toLocaleTimeString(
                                      language === "ar" ? "ar-SA" : "en-US",
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )}
                                  </p>
                                )}
                              </div>
                              {/* Only show "Use This Description" button if message has content */}
                              {msg.role === "assistant" && msg.content && (
                                <div className="border-t border-default-200 px-4 py-2">
                                  <Button
                                    className="text-xs"
                                    color="secondary"
                                    size="sm"
                                    startContent={
                                      <Check className="w-3.5 h-3.5" />
                                    }
                                    variant="flat"
                                    onPress={() =>
                                      handleUseAISuggestion(msg.content)
                                    }
                                  >
                                    {language === "ar"
                                      ? "استخدم هذا الوصف"
                                      : "Use This Description"}
                                  </Button>
                                </div>
                              )}
                            </div>
                            {msg.role === "user" && (
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-100/20 flex items-center justify-center mt-1">
                                <span className="text-sm font-semibold text-primary">
                                  {language === "ar" ? "أ" : "U"}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                        {/* Invisible element for auto-scroll */}
                        <div ref={conversationEndRef} />
                      </div>
                    </ScrollShadow>
                  ) : (
                    <div className="text-center py-8 space-y-3">
                      <div className="w-16 h-16 mx-auto bg-secondary-50 dark:bg-secondary-100/10 rounded-full flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-default-700">
                          {language === "ar"
                            ? "ابدأ محادثة مع المحلل الذكي"
                            : "Start a conversation with AI Analyst"}
                        </p>
                        <p className="text-xs text-default-500 mt-1">
                          {t("requirements.aiPromptDescription")}
                        </p>
                      </div>

                      {/* Show context being used */}
                      {(formData.name || projectName) && (
                        <div className="bg-default-50 dark:bg-default-100/10 p-4 rounded-lg border border-default-200 max-w-md mx-auto">
                          <p className="text-xs text-default-500 mb-2 font-medium text-center">
                            {t("requirements.aiContext")}
                          </p>
                          <div className="space-y-1 text-center">
                            {formData.name && (
                              <p className="text-xs">
                                <span className="font-medium text-default-600">
                                  {t("requirements.requirementName")}:
                                </span>{" "}
                                <span className="text-default-500">
                                  {formData.name}
                                </span>
                              </p>
                            )}
                            {projectName && (
                              <p className="text-xs">
                                <span className="font-medium text-default-600">
                                  {t("common.project")}:
                                </span>{" "}
                                <span className="text-default-500">
                                  {projectName}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Input Area */}
                  <div className="border-t border-default-200 pt-4">
                    <div className="flex gap-2 items-end">
                      <Textarea
                        autoFocus
                        classNames={{
                          input: "text-sm",
                          inputWrapper: "min-h-[44px]",
                        }}
                        maxRows={5}
                        minRows={1}
                        placeholder={
                          conversationHistory.length > 0
                            ? language === "ar"
                              ? "أكمل المحادثة..."
                              : "Continue conversation..."
                            : t("requirements.aiPromptPlaceholder")
                        }
                        value={aiPromptText}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            !e.shiftKey &&
                            aiPromptText.trim()
                          ) {
                            e.preventDefault();
                            handleAIGenerate();
                          }
                        }}
                        onValueChange={setAIPromptText}
                      />
                      <Button
                        isIconOnly
                        className="min-w-unit-10 w-10 h-10 flex-shrink-0"
                        color="secondary"
                        isDisabled={!aiPromptText.trim()}
                        isLoading={aiGenerating}
                        size="sm"
                        onPress={handleAIGenerate}
                      >
                        {!aiGenerating && <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-default-400 mt-2">
                      {language === "ar"
                        ? "اضغط Enter للإرسال • Shift+Enter للسطر الجديد"
                        : "Press Enter to send • Shift+Enter for new line"}
                    </p>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter className="border-t border-default-200 px-6 py-4">
                <Button variant="flat" onPress={onClose}>
                  {t("common.close")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
