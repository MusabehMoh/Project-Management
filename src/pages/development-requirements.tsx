import type {
  ProjectRequirement,
  AssignedProject,
} from "@/types/projectRequirement";

import React, { useState } from "react";

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
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Spinner } from "@heroui/spinner";
import {
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  AlertCircle,
  Code,
} from "lucide-react";
import { RefreshIcon } from "@/components/icons";

import DefaultLayout from "@/layouts/default";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDevelopmentRequirements } from "@/hooks/useDevelopmentRequirements";

import { GlobalPagination } from "@/components/GlobalPagination";

// Form data type for editing requirements
interface RequirementFormData {
  name: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "draft" | "in_development" | "completed";
}

export default function DevelopmentRequirementsPage() {
  const { t } = useLanguage();

  const {
    requirements,
    loading,
    error,
    currentPage,
    totalPages,
    totalRequirements,
    pageSize,
    filters,
    updateRequirement,
    deleteRequirement,
    updateFilters,
    handlePageChange,
  handlePageSizeChange,
    clearError,
    refreshData,
  projects,
  setProjectFilter,
  } = useDevelopmentRequirements({
    pageSize: 20,
  });

  // Modal states
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
    status: "in_development",
  });
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

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

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = t("requirements.validation.nameRequired");
    }

    if (!formData.description.trim()) {
      errors.description = t("requirements.validation.descriptionRequired");
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      priority: "medium",
      status: "in_development",
    });
    setValidationErrors({});
    setSelectedRequirement(null);
  };

  const handleEditRequirement = (requirement: ProjectRequirement) => {
    setSelectedRequirement(requirement);
    setFormData({
      name: requirement.name,
      description: requirement.description,
      priority: requirement.priority,
      status:
        requirement.status === "in-development"
          ? "in_development"
          : (requirement.status as "draft" | "in_development" | "completed"),
    });
    setValidationErrors({});
    onEditOpen();
  };

  const handleDeleteRequirement = (requirement: ProjectRequirement) => {
    setRequirementToDelete(requirement);
    onDeleteOpen();
  };

  const handleSaveRequirement = async () => {
    if (!validateForm() || !selectedRequirement) return;

    try {
      await updateRequirement(selectedRequirement.id, {
        ...formData,
        id: selectedRequirement.id,
      });

      resetForm();
      onEditOpenChange();
    } catch {
      // Error handled by hook
    }
  };

  const confirmDelete = async () => {
    if (requirementToDelete) {
      try {
        await deleteRequirement(requirementToDelete.id);
        setRequirementToDelete(null);
        onDeleteOpenChange();
      } catch {
        // Error handled by hook
      }
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
      case "in_development":
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

  if (loading && requirements.length === 0) {
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center min-h-96">
          <Spinner size="lg" label={t("common.loading")} />
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Code className="w-6 h-6" />
              {t("requirements.developmentRequirements")}
            </h1>
            <p className="text-default-500">
              {t("requirements.developmentRequirementsSubtitle")}
            </p>
          </div>

          {/* Stats Card */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                  <Code className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary">
                    {totalRequirements}
                  </div>
                  <div className="text-sm text-default-500">
                    {t("requirements.totalInDevelopment")}
                  </div>
                </div>
              </div>
              <Chip color="secondary" variant="flat">
                {t("requirements.inDevelopment")}
              </Chip>
            </div>
          </Card>
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
                className="md:w-100"
              />

              {/* Project filter dropdown - appears before Priority */}
              <Select
                placeholder={t("taskPlan.filterByProject")}
                className="md:w-86"
                selectedKeys={filters.projectId ? [String(filters.projectId)] : []}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0] as string;
                  setProjectFilter(val ? Number(val) : undefined);
                }}
              >
                <SelectItem key="">{t("taskPlan.allProjects")}</SelectItem>
                {projects?.map((p: AssignedProject) => (
                  <SelectItem key={String(p.id)}>{p.applicationName}</SelectItem>
                ))}
              </Select>

              <Select
                placeholder={t("requirements.filterByPriority")}
                className="md:w-40"
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

              {/* Page size selector (like projects page) */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-default-600">{t("common.show")}</span>
                <Select
                  className="w-20"
                  size="sm"
                  selectedKeys={[pageSize.toString()]}
                  onSelectionChange={(keys) => {
                    const newSize = parseInt(Array.from(keys)[0] as string);
                    handlePageSizeChange(newSize);
                  }}
                >
                  <SelectItem key="10">10</SelectItem>
                  <SelectItem key="20">20</SelectItem>
                  <SelectItem key="50">50</SelectItem>
                  <SelectItem key="100">100</SelectItem>
                </Select>
                <span className="text-sm text-default-600">{t("pagination.perPage")}</span>
              </div>
              {/* Reset filters button */}
              <div>
                <Button
                  isIconOnly
                  variant="bordered"
                  onPress={() => {
                    // Clear local UI filters
                    setSearchTerm("");
                    setPriorityFilter("");
                    // Clear hook/server filters
                    updateFilters({});
                    // Clear project filter if set
                    setProjectFilter(undefined);
                    // Refresh data
                    refreshData();
                  }}
                >
                  <RefreshIcon />
                </Button>
              </div>
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
                    <Code className="w-12 h-12 text-default-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-default-700">
                      {t("requirements.noDevelopmentRequirements")}
                    </h3>
                    <p className="text-default-500">
                      {t("requirements.noDevelopmentRequirementsDesc")}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <Table aria-label="Development requirements table">
                <TableHeader>
                  <TableColumn>{t("requirements.requirementName")}</TableColumn>
                  <TableColumn>{t("requirements.project")}</TableColumn>
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
                        <div className="text-sm">
                          {requirement.project?.applicationName || "N/A"}
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
                          {t(`requirements.${requirement.status.replace("-", "")}`)}
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
            isLoading={loading}
            showInfo={true}
          />
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onOpenChange={onEditOpenChange}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {t("requirements.editRequirement")}
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
                    <textarea
                      className="w-full p-3 border border-default-200 rounded-lg resize-none"
                      rows={4}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder={t("requirements.requirementDescriptionPlaceholder")}
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

                  <Select
                    label={t("requirements.status")}
                    placeholder={t("requirements.selectStatus")}
                    selectedKeys={[formData.status]}
                    onSelectionChange={(keys) =>
                      setFormData({
                        ...formData,
                        status: Array.from(keys)[0] as any,
                      })
                    }
                    isRequired
                  >
                    <SelectItem key="draft">{t("requirements.draft")}</SelectItem>
                    <SelectItem key="in_development">
                      {t("requirements.inDevelopment")}
                    </SelectItem>
                    <SelectItem key="completed">
                      {t("requirements.completed")}
                    </SelectItem>
                  </Select>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t("requirements.cancel")}
                </Button>
                <Button
                  color="primary"
                  onPress={handleSaveRequirement}
                  isLoading={loading}
                >
                  {t("requirements.save")}
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
