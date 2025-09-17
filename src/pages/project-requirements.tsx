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
import { DatePicker } from "@heroui/date-picker";
import { Divider } from "@heroui/divider";
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
} from "lucide-react";
import { parseDate } from "@internationalized/date";

import DefaultLayout from "@/layouts/default";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useProjectRequirements } from "@/hooks/useProjectRequirements";
import { GlobalPagination } from "@/components/GlobalPagination";

import type {
  ProjectRequirement,
  CreateProjectRequirementRequest,
  ProjectRequirementAttachment,
} from "@/types/projectRequirement";

// Form data type for creating/editing requirements
interface RequirementFormData {
  name: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  type: "new" | "change request";
  expectedCompletionDate: any;
  attachments: string[];
  uploadedFiles: File[];
  existingAttachments: ProjectRequirementAttachment[];
}

export default function ProjectRequirementsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  
  // Get highlighting parameters from URL
  const highlightRequirementId = searchParams.get('highlightRequirement');
  const scrollToRequirementId = searchParams.get('scrollTo');
  const [highlightedRequirement, setHighlightedRequirement] = useState<number | null>(
    highlightRequirementId ? parseInt(highlightRequirementId) : null
  );

  const {
    requirements,
    stats,
    loading,
    error,
    currentPage,
    totalPages,
    totalRequirements,
    pageSize,
    filters,
    loadRequirements,
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
    pageSize: 20,
  });

  const { hasPermission } = usePermissions();

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
    priority: "medium",
    type: "new",
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
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");

  // Update filters when search/filter states change (with debouncing)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const newFilters = {
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
      };

      updateFilters(newFilters);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, priorityFilter, updateFilters]);

  // Handle highlighting and scrolling for specific requirements
  useEffect(() => {
    if (scrollToRequirementId && requirements.length > 0) {
      const requirementId = parseInt(scrollToRequirementId);
      // Wait a bit for the table to render
      setTimeout(() => {
        const element = document.getElementById(`requirement-${requirementId}`);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          
          // Flash effect
          if (highlightedRequirement === requirementId) {
            element.classList.add('highlight-flash');
            setTimeout(() => {
              element.classList.remove('highlight-flash');
              setHighlightedRequirement(null);
            }, 3000); // Remove highlight after 3 seconds
          }
        }
      }, 500);
    }
  }, [requirements, scrollToRequirementId, highlightedRequirement, setHighlightedRequirement]);

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
      priority: "medium",
      type: "new",
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
    setFormData({
      name: requirement.name,
      description: requirement.description,
      priority: requirement.priority,
      type: requirement.type,
      expectedCompletionDate: parseDate(requirement.expectedCompletionDate),
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
        savedRequirement = await updateRequirement(selectedRequirement.id, {
          ...requestData,
          id: selectedRequirement.id,
          status: saveAsDraft ? "draft" : "in_development",
        });
      } else {
        savedRequirement = await createRequirement(requestData);
      }

      // Upload new files if any
      if (formData.uploadedFiles.length > 0) {
        await uploadAttachments(savedRequirement.id, formData.uploadedFiles);
      }

      // Handle removed existing attachments
      const removedAttachments =
        selectedRequirement?.attachments?.filter(
          (existing) =>
            !formData.existingAttachments.find(
              (kept) => kept.id === existing.id,
            ),
        ) || [];

      for (const removed of removedAttachments) {
        await deleteAttachment(savedRequirement.id, removed.id);
      }

      resetForm();
      if (selectedRequirement) {
        onEditOpenChange();
      } else {
        onCreateOpenChange();
      }
    } catch (err) {
      console.error("Error saving requirement:", err);
    }
  };

  const handleSendToDevelopment = async () => {
    await handleSaveRequirement(false);
    // Ensure stats and list refresh after sending to development
    try {
      await refreshData();
    } catch (e) {
      // ignore
    }
  };

  const confirmDelete = async () => {
    if (requirementToDelete) {
      try {
        await deleteRequirement(requirementToDelete.id);
        setRequirementToDelete(null);
        onDeleteOpenChange();
      } catch (err) {
        console.error("Error deleting requirement:", err);
      }
    }
  };

  const handleSendRequirement = async (requirement: ProjectRequirement) => {
    try {
      await sendRequirement(requirement.id);
    } catch (err) {
      console.error("Error sending requirement:", err);
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
      case "approved":
        return "primary";
      case "in-development":
        return "secondary";
      case "completed":
        return "success";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
    <DefaultLayout>
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
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
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
                    {t("requirements.draft")}
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {stats.approved}
                  </div>
                  <div className="text-xs text-default-500">
                    {t("requirements.approved")}
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">
                    {stats.inDevelopment}
                  </div>
                  <div className="text-xs text-default-500">
                    {t("requirements.inDevelopment")}
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">
                    {stats.completed}
                  </div>
                  <div className="text-xs text-default-500">
                    {t("requirements.completed")}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Filters and Search */}
        <Card>
          <CardBody>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <Input
                className="md:max-w-xs"
                placeholder={t("requirements.searchRequirements")}
                startContent={<Search className="w-4 h-4" />}
                value={searchTerm}
                onValueChange={setSearchTerm}
              />

              <Select
                className="md:max-w-xs"
                placeholder={t("requirements.filterByStatus")}
                selectedKeys={statusFilter ? [statusFilter] : []}
                onSelectionChange={(keys) =>
                  setStatusFilter((Array.from(keys)[0] as string) || "")
                }
              >
                <SelectItem key="">{t("requirements.allStatuses")}</SelectItem>
                <SelectItem key="draft">{t("requirements.draft")}</SelectItem>
                <SelectItem key="in-development">
                  {t("requirements.inDevelopment")}
                </SelectItem>
                <SelectItem key="completed">
                  {t("requirements.completed")}
                </SelectItem>
              </Select>

              <Select
                className="md:max-w-xs"
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

        {/* Requirements Table */}
        <Card>
          <CardBody className="p-0">
            {requirements.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-24 h-24 bg-default-100 rounded-full flex items-center justify-center">
                    <FileText className="w-12 h-12 text-default-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-default-700">
                      {t("requirements.emptyState.title")}
                    </h3>
                    <p className="text-default-500">
                      {t("requirements.emptyState.description")}
                    </p>
                  </div>
                  {hasPermission({
                    actions: ["requirements.create"],
                  }) ? (
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
              <Table aria-label="Requirements table">
                <TableHeader>
                  <TableColumn>{t("requirements.requirementName")}</TableColumn>
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
                  {requirements.map((requirement) => (
                    <TableRow 
                      key={requirement.id}
                      id={`requirement-${requirement.id}`}
                      className={highlightedRequirement === requirement.id ? 'highlight-flash' : ''}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{requirement.name}</div>
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
                            requirement.type === "new" ? "success" : "warning"
                          }
                          size="sm"
                          variant="flat"
                        >
                          {requirement.type === "new"
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
                          {t(`requirements.${requirement.priority}`)}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={getStatusColor(requirement.status)}
                          size="sm"
                          variant="flat"
                        >
                          {t(
                            `requirements.${requirement.status.replace("-", "")}`,
                          )}
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
                            {requirement.status === "draft" ? (
                              hasPermission({
                                actions: ["requirements.send"],
                              }) ? (
                                <DropdownItem
                                  key="send"
                                  startContent={<Send className="w-4 h-4" />}
                                  onPress={() =>
                                    handleSendRequirement(requirement)
                                  }
                                >
                                  {t("requirements.sendToDevelopment")}
                                </DropdownItem>
                              ) : null
                            ) : null}
                            {/* start development action removed */}
                            {hasPermission({
                              actions: ["requirements.delete"],
                            }) ? (
                              <DropdownItem
                                key="delete"
                                className="text-danger"
                                color="danger"
                                startContent={<Trash2 className="w-4 h-4" />}
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
            )}
          </CardBody>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <GlobalPagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={totalRequirements}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
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
                    selectedKeys={[formData.priority]}
                    onSelectionChange={(keys) =>
                      setFormData({
                        ...formData,
                        priority: Array.from(keys)[0] as any,
                      })
                    }
                  >
                    <SelectItem key="high">{t("requirements.high")}</SelectItem>
                    <SelectItem key="medium">
                      {t("requirements.medium")}
                    </SelectItem>
                    <SelectItem key="low">{t("requirements.low")}</SelectItem>
                  </Select>

                  <Select
                    isRequired
                    label={t("requirements.type")}
                    placeholder={t("requirements.selectType")}
                    selectedKeys={[formData.type]}
                    onSelectionChange={(keys) =>
                      setFormData({
                        ...formData,
                        type: Array.from(keys)[0] as any,
                      })
                    }
                  >
                    <SelectItem key="new">{t("requirements.new")}</SelectItem>
                    <SelectItem key="change request">
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
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip,.rar"
                        onChange={(e) => handleFileSelect(e.target.files)}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center justify-center space-y-2"
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
                                size="sm"
                                variant="light"
                                color="danger"
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
                              size="sm"
                              variant="light"
                              color="danger"
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
                  selectedRequirement.status === "approved"
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
                      onPress={async () => {
                        if (
                          selectedRequirement &&
                          selectedRequirement.status === "draft"
                        ) {
                          try {
                            await handleSendRequirement(selectedRequirement);
                            // Close edit modal when send succeeds
                            onEditOpenChange();
                          } catch (err) {
                            // error already logged in handler
                          }
                        } else {
                          await handleSendToDevelopment();
                        }
                      }}
                    >
                      {t("requirements.sendToDevelopment")}
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
    </DefaultLayout>
  );
}
