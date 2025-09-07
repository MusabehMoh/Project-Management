import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { DatePicker } from "@heroui/date-picker";
import { Spinner } from "@heroui/spinner";
import { Divider } from "@heroui/divider";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  ArrowLeft,
  Edit,
  Trash2,
  Send,
  Calendar,
  FileText,
  AlertCircle,
} from "lucide-react";
import { parseDate } from "@internationalized/date";

import DefaultLayout from "@/layouts/default";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProjectRequirements } from "@/hooks/useProjectRequirements";
import { GlobalPagination } from "@/components/GlobalPagination";
import type {
  ProjectRequirement,
  CreateProjectRequirementRequest,
} from "@/types/projectRequirement";

// Form data type for creating/editing requirements
interface RequirementFormData {
  name: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  expectedCompletionDate: any;
  attachments: string[];
}

export default function ProjectRequirementsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

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
    clearError,
    refreshData,
  } = useProjectRequirements({
    projectId: projectId ? parseInt(projectId) : undefined,
    pageSize: 20,
  });

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
    expectedCompletionDate: null,
    attachments: [],
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
      expectedCompletionDate: null,
      attachments: [],
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
      expectedCompletionDate: parseDate(requirement.expectedCompletionDate),
      attachments: [],
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
        expectedCompletionDate:
          formData.expectedCompletionDate?.toString() || "",
        attachments: formData.attachments,
      };

      if (selectedRequirement) {
        await updateRequirement(selectedRequirement.id, {
          ...requestData,
          id: selectedRequirement.id,
          status: saveAsDraft ? "draft" : "in_development",
        });
      } else {
        await createRequirement(requestData);
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
      case "pending":
        return "warning";
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
              variant="light"
              size="sm"
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                placeholder={t("requirements.searchRequirements")}
                startContent={<Search className="w-4 h-4" />}
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="md:max-w-xs"
              />

              <Select
                placeholder={t("requirements.filterByStatus")}
                className="md:max-w-xs"
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
                placeholder={t("requirements.filterByPriority")}
                className="md:max-w-xs"
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

              <Button
                color="primary"
                startContent={<Plus className="w-4 h-4" />}
                onPress={handleCreateRequirement}
                size="lg"
                className="min-w-fit"
              >
                {t("requirements.addRequirement")}
              </Button>
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
                  <Button
                    color="primary"
                    startContent={<Plus className="w-4 h-4" />}
                    onPress={handleCreateRequirement}
                  >
                    {t("requirements.emptyState.action")}
                  </Button>
                </div>
              </div>
            ) : (
              <Table aria-label="Requirements table">
                <TableHeader>
                  <TableColumn>{t("requirements.requirementName")}</TableColumn>
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
                    <TableRow key={requirement.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{requirement.name}</div>
                          <div className="text-sm text-default-500 line-clamp-2">
                            {requirement.description}
                          </div>
                        </div>
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
                            <DropdownItem
                              key="edit"
                              startContent={<Edit className="w-4 h-4" />}
                              onPress={() => handleEditRequirement(requirement)}
                            >
                              {t("common.edit")}
                            </DropdownItem>
                            {requirement.status === "draft" ? (
                              <DropdownItem
                                key="send"
                                startContent={<Send className="w-4 h-4" />}
                                onPress={() =>
                                  handleSendRequirement(requirement)
                                }
                              >
                                {t("requirements.sendToDevelopment")}
                              </DropdownItem>
                            ) : null}
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
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalRequirements}
            pageSize={pageSize}
          />
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateOpen || isEditOpen}
        onOpenChange={
          selectedRequirement ? onEditOpenChange : onCreateOpenChange
        }
        size="2xl"
        scrollBehavior="inside"
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
                    label={t("requirements.requirementName")}
                    placeholder={t("requirements.requirementNamePlaceholder")}
                    value={formData.name}
                    onValueChange={(value) =>
                      setFormData({ ...formData, name: value })
                    }
                    isInvalid={!!validationErrors.name}
                    errorMessage={validationErrors.name}
                    isRequired
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {t("requirements.requirementDescription")} *
                    </label>
                    <ReactQuill
                      theme="snow"
                      value={formData.description}
                      onChange={(value) =>
                        setFormData({ ...formData, description: value })
                      }
                      placeholder={t(
                        "requirements.requirementDescriptionPlaceholder",
                      )}
                      modules={{
                        toolbar: [
                          ["bold", "italic", "underline"],
                          [{ list: "ordered" }, { list: "bullet" }],
                          ["clean"],
                        ],
                      }}
                      style={{
                        borderColor: validationErrors.description
                          ? "#f31260"
                          : undefined,
                      }}
                    />
                    {validationErrors.description && (
                      <p className="text-tiny text-danger">
                        {validationErrors.description}
                      </p>
                    )}
                  </div>

                  <Select
                    label={t("requirements.priority")}
                    placeholder={t("requirements.selectPriority")}
                    selectedKeys={[formData.priority]}
                    onSelectionChange={(keys) =>
                      setFormData({
                        ...formData,
                        priority: Array.from(keys)[0] as any,
                      })
                    }
                    isRequired
                  >
                    <SelectItem key="high">{t("requirements.high")}</SelectItem>
                    <SelectItem key="medium">
                      {t("requirements.medium")}
                    </SelectItem>
                    <SelectItem key="low">{t("requirements.low")}</SelectItem>
                  </Select>

                  <DatePicker
                    label={t("requirements.expectedCompletion")}
                    value={formData.expectedCompletionDate}
                    onChange={(date) =>
                      setFormData({ ...formData, expectedCompletionDate: date })
                    }
                    isInvalid={!!validationErrors.expectedCompletionDate}
                    errorMessage={validationErrors.expectedCompletionDate}
                    isRequired
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t("requirements.cancel")}
                </Button>
                <Button
                  color="default"
                  onPress={() => handleSaveRequirement(true)}
                  isLoading={loading}
                >
                  {t("requirements.saveAsDraft")}
                </Button>
                <Button
                  color="primary"
                  onPress={handleSendToDevelopment}
                  isLoading={loading}
                >
                  {t("requirements.sendToDevelopment")}
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
                  onPress={confirmDelete}
                  isLoading={loading}
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
