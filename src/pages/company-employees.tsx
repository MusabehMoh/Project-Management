import type {
  CompanyEmployee,
  CompanyEmployeeFormData,
  CreateCompanyEmployeeRequest,
  UpdateCompanyEmployeeRequest,
} from "@/types/companyEmployee";

import React, { useState, useMemo, useCallback } from "react";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
  useDisclosure,
} from "@heroui/react";
import {
  Edit,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";

import { GlobalPagination } from "@/components/GlobalPagination";
import { MoreVerticalIcon } from "@/components/icons";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCompanyEmployees } from "@/hooks";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { translateBackendError } from "@/utils/errorTranslation";
import { PAGE_SIZE_OPTIONS } from "@/constants/pagination";

export default function CompanyEmployeesPage() {
  const { t, language } = useLanguage();
  const direction = language === "ar" ? "rtl" : "ltr";

  const {
    companyEmployees,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    searchQuery,
    setSearchQuery,
    refetch,
    goToPage,
    setPageSize: handlePageSizeChange,
    pageSize,
    createCompanyEmployee,
    updateCompanyEmployee,
    deleteCompanyEmployee,
  } = useCompanyEmployees({ initialLimit: 10 });

  // Modal states
  const {
    isOpen: isCreateModalOpen,
    onOpen: onOpenCreateModal,
    onClose: onCloseCreateModal,
  } = useDisclosure();
  const {
    isOpen: isEditModalOpen,
    onOpen: onOpenEditModal,
    onClose: onCloseEditModal,
  } = useDisclosure();
  const {
    isOpen: isDeleteModalOpen,
    onOpen: onOpenDeleteModal,
    onClose: onCloseDeleteModal,
  } = useDisclosure();
  const {
    isOpen: isViewModalOpen,
    onOpen: onOpenViewModal,
    onClose: onCloseViewModal,
  } = useDisclosure();

  // Custom modal close handlers that clear form
  const handleCloseCreateModal = () => {
    clearForm();
    onCloseCreateModal();
  };

  const handleCloseEditModal = () => {
    clearForm();
    onCloseEditModal();
  };

  // Form states
  const [formData, setFormData] = useState<CompanyEmployeeFormData>({
    userName: "",
    fullName: "",
    gradeName: "",
  });
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] =
    useState<CompanyEmployee | null>(null);

  // Page size state
  const [isOptionOpen, setIsOptionOpen] = useState(false);

  // Use pageSize from hook instead of local calculation
  const effectivePageSize = pageSize;

  // Clear form and validation errors
  const clearForm = () => {
    setFormData({
      userName: "",
      fullName: "",
      gradeName: "",
    });
    setValidationErrors({});
    setSelectedEmployee(null);
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.userName?.trim()) {
      errors.userName = t("companyEmployees.userNameRequired");
    }
    if (!formData.fullName?.trim()) {
      errors.fullName = t("companyEmployees.fullNameRequired");
    }

    setValidationErrors(errors);

    return Object.keys(errors).length === 0;
  };

  // Handle create employee
  const handleCreate = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const createData: CreateCompanyEmployeeRequest = {
        userName: formData.userName,
        fullName: formData.fullName,
        gradeName: formData.gradeName,
      };

      const newEmployee = await createCompanyEmployee(createData);
      
      // If we got here, creation was successful
      if (newEmployee) {
        showSuccessToast(t("companyEmployees.createSuccess"));
        handleCloseCreateModal();
      }
    } catch (err: any) {
      // Only show error if we actually have an error
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("Error creating employee:", err);
      }
      
      // Extract error message from different possible structures
      let errorMessage = "";

      if (err?.data?.error) {
        // API response with error field
        errorMessage = err.data.error;
      } else if (err?.data?.message) {
        // API response with message field
        errorMessage = err.data.message;
      } else if (err?.message) {
        // Error object with message
        errorMessage = err.message;
      } else if (typeof err === "string") {
        // String error
        errorMessage = err;
      } else {
        // Fallback
        errorMessage = "An unexpected error occurred";
      }

      const translatedError = translateBackendError(errorMessage, t);

      showErrorToast(translatedError || t("companyEmployees.createError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit employee
  const handleEdit = (employee: CompanyEmployee) => {
    setSelectedEmployee(employee);
    setFormData({
      userName: employee.userName || "",
      fullName: employee.fullName,
      gradeName: employee.gradeName || "",
    });
    onOpenEditModal();
  };

  // Handle update employee
  const handleUpdate = async () => {
    if (!validateForm() || !selectedEmployee) return;

    setIsSubmitting(true);
    try {
      const updateData: UpdateCompanyEmployeeRequest = {
        userName: formData.userName,
        fullName: formData.fullName,
        gradeName: formData.gradeName,
      };

      const updatedEmployee = await updateCompanyEmployee(
        selectedEmployee.id,
        updateData,
      );
      
      // If we got here, update was successful
      if (updatedEmployee) {
        showSuccessToast(t("companyEmployees.updateSuccess"));
        handleCloseEditModal();
      }
    } catch (err: any) {
      // Only show error if we actually have an error
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("Error updating employee:", err);
      }

      // Extract error message from different possible structures
      let errorMessage = "";

      if (err?.data?.error) {
        errorMessage = err.data.error;
      } else if (err?.data?.message) {
        errorMessage = err.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      } else {
        errorMessage = "An unexpected error occurred";
      }

      const translatedError = translateBackendError(errorMessage, t);

      showErrorToast(translatedError || t("companyEmployees.updateError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle view employee
  const handleView = (employee: CompanyEmployee) => {
    setSelectedEmployee(employee);
    onOpenViewModal();
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (employee: CompanyEmployee) => {
    setSelectedEmployee(employee);
    onOpenDeleteModal();
  };

  // Handle delete employee
  const handleDelete = async () => {
    if (!selectedEmployee) return;

    setIsSubmitting(true);
    try {
      await deleteCompanyEmployee(selectedEmployee.id);
      showSuccessToast(t("companyEmployees.deleteSuccess"));
      onCloseDeleteModal();
      clearForm();
    } catch (err: any) {
      // Only show error if we actually have an error
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("Error deleting employee:", err);
      }

      // Extract error message from different possible structures
      let errorMessage = "";

      if (err?.data?.error) {
        errorMessage = err.data.error;
      } else if (err?.data?.message) {
        errorMessage = err.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      } else {
        errorMessage = "An unexpected error occurred";
      }

      const translatedError = translateBackendError(errorMessage, t);

      showErrorToast(translatedError || t("companyEmployees.deleteError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return "-";

    return dateString.split("T")[0] || "";
  }, []);

  return (
    <>
      <div className={`space-y-6 ${direction}`}>
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t("companyEmployees.title")}
            </h1>
            <p className="text-default-600 mt-2">
              {t("companyEmployees.subtitle")}
            </p>
          </div>

          {/* Actions and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Search */}
              <Input
                className="w-full sm:w-80"
                endContent={
                  searchQuery && (
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => setSearchQuery("")}
                    >
                      <X size={16} />
                    </Button>
                  )
                }
                isClearable={false}
                placeholder={t("companyEmployees.searchEmployees")}
                startContent={<Search className="text-default-400" size={18} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {/* Refresh Button */}
              <Tooltip content={t("common.refresh")}>
                <Button
                  isIconOnly
                  isLoading={loading}
                  variant="bordered"
                  onPress={refetch}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </Tooltip>
            </div>

            {/* Page Size Selector and Add Employee Button */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-end sm:items-center">
              {/* Page Size Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-default-600">
                  {t("common.show")}:
                </span>
                <Select
                  aria-label={t("pagination.perPage")}
                  className="w-24"
                  disallowEmptySelection={true}
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

              {/* Add Employee Button */}
              <Button
                className="w-full sm:w-auto"
                color="primary"
                startContent={<Plus className="w-4 h-4" />}
                onPress={() => {
                  clearForm();
                  onOpenCreateModal();
                }}
              >
                {t("companyEmployees.addEmployee")}
              </Button>
            </div>
          </div>

          {/* Stats */}
          {!loading && totalCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-default-500">
                {t("common.itemsFound").replace(
                  "{count}",
                  totalCount.toString(),
                )}
              </span>
            </div>
          )}
        </div>

        {/* Table */}
        <Card>
          <CardBody className="p-0">
            {loading ? (
              <div className="space-y-4 p-6">
                {/* Table header skeleton */}
                <div className="grid grid-cols-5 gap-4 pb-4 border-b border-default-200">
                  <div className="h-4 bg-default-200 rounded animate-pulse" />
                  <div className="h-4 bg-default-200 rounded animate-pulse" />
                  <div className="h-4 bg-default-200 rounded animate-pulse" />
                  <div className="h-4 bg-default-200 rounded animate-pulse" />
                  <div className="h-4 bg-default-200 rounded animate-pulse" />
                </div>

                {/* Table rows skeleton */}
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-5 gap-4 py-4 border-b border-default-100"
                  >
                    <div className="h-4 bg-default-100 rounded animate-pulse" />
                    <div className="h-4 bg-default-100 rounded animate-pulse" />
                    <div className="h-4 bg-default-100 rounded animate-pulse" />
                    <div className="h-4 bg-default-100 rounded animate-pulse" />
                    <div className="h-4 bg-default-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col justify-center items-center h-40 text-center space-y-4">
                <div className="text-danger text-lg">{error}</div>
                <Button
                  color="primary"
                  startContent={<RefreshCw size={16} />}
                  variant="flat"
                  onPress={refetch}
                >
                  {t("error.retry")}
                </Button>
              </div>
            ) : companyEmployees.length === 0 ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center space-y-4">
                  <User
                    className="mx-auto text-default-400"
                    height={64}
                    width={64}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-default-700">
                      {searchQuery
                        ? t("companyEmployees.noEmployeesFound")
                        : t("companyEmployees.noEmployees")}
                    </h3>
                    <p className="text-default-500 mt-1">
                      {searchQuery
                        ? t("companyEmployees.tryDifferentSearch")
                        : t("companyEmployees.addFirstEmployee")}
                    </p>
                  </div>
                  {!searchQuery && (
                    <Button
                      color="primary"
                      startContent={<Plus size={16} />}
                      onPress={() => {
                        clearForm();
                        onOpenCreateModal();
                      }}
                    >
                      {t("companyEmployees.addEmployee")}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <Table
                aria-label={t("companyEmployees.title")}
              >
                <TableHeader>
                  <TableColumn>{t("companyEmployees.userName")}</TableColumn>
                  <TableColumn>{t("companyEmployees.fullName")}</TableColumn>
                  <TableColumn>{t("companyEmployees.gradeName")}</TableColumn>
                  <TableColumn>{t("companyEmployees.createdAt")}</TableColumn>
                  <TableColumn>{t("companyEmployees.actions")}</TableColumn>
                </TableHeader>
                <TableBody>
                  {companyEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div
                          className={`flex items-center gap-2 ${language === "ar" ? "text-right" : ""}`}
                          dir={language === "ar" ? "rtl" : "ltr"}
                        >
                          <Avatar
                            showFallback
                            name={employee.fullName}
                            size="sm"
                          />
                          <div>
                            <div className="font-medium">
                              {employee.gradeName} {employee.fullName}
                            </div>
                            <div className="text-sm text-default-500">
                              {employee.userName || "-"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{employee.fullName}</span>
                      </TableCell>
                      <TableCell>{employee.gradeName || "-"}</TableCell>
                      <TableCell>{formatDate(employee.createdAt)}</TableCell>
                      <TableCell>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                              <MoreVerticalIcon size={16} />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu aria-label="Employee actions">
                            <DropdownItem
                              key="view"
                              startContent={<Eye className="w-4 h-4" />}
                              onPress={() => handleView(employee)}
                            >
                              {t("companyEmployees.viewEmployee")}
                            </DropdownItem>
                            <DropdownItem
                              key="edit"
                              startContent={<Edit className="w-4 h-4" />}
                              onPress={() => handleEdit(employee)}
                            >
                              {t("companyEmployees.editEmployee")}
                            </DropdownItem>
                            <DropdownItem
                              key="delete"
                              className="text-danger"
                              color="danger"
                              startContent={<Trash2 className="w-4 h-4" />}
                              onPress={() => handleDeleteConfirm(employee)}
                            >
                              {t("companyEmployees.deleteEmployee")}
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
        {totalCount > effectivePageSize && (
          <div className="flex justify-center py-6">
            <GlobalPagination
              className="w-full max-w-md"
              currentPage={currentPage}
              isLoading={loading}
              pageSize={effectivePageSize}
              showInfo={true}
              totalItems={totalCount}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          </div>
        )}

        {/* Create Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          placement="center"
          size="2xl"
          onClose={handleCloseCreateModal}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  {t("companyEmployees.addEmployee")}
                  <p className="text-sm text-default-600 font-normal">
                    {t("companyEmployees.fillEmployeeDetails")}
                  </p>
                </ModalHeader>
                <ModalBody className="gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      isRequired
                      errorMessage={validationErrors.userName}
                      isInvalid={!!validationErrors.userName}
                      label={t("companyEmployees.userName")}
                      placeholder={t("companyEmployees.userNamePlaceholder")}
                      value={formData.userName}
                      onValueChange={(value) =>
                        setFormData({ ...formData, userName: value })
                      }
                    />
                    <Input
                      isRequired
                      errorMessage={validationErrors.fullName}
                      isInvalid={!!validationErrors.fullName}
                      label={t("companyEmployees.fullName")}
                      placeholder={t("companyEmployees.fullNamePlaceholder")}
                      value={formData.fullName}
                      onValueChange={(value) =>
                        setFormData({ ...formData, fullName: value })
                      }
                    />
                    <Input
                      className="md:col-span-2"
                      label={t("companyEmployees.gradeName")}
                      placeholder={t("companyEmployees.gradeNamePlaceholder")}
                      value={formData.gradeName || ""}
                      onValueChange={(value) =>
                        setFormData({ ...formData, gradeName: value })
                      }
                    />
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onClose}>
                    {t("common.cancel")}
                  </Button>
                  <Button
                    color="primary"
                    isLoading={isSubmitting}
                    onPress={handleCreate}
                  >
                    {t("common.create")}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={isEditModalOpen}
          placement="center"
          size="2xl"
          onClose={handleCloseEditModal}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  {t("companyEmployees.editEmployee")}
                  <p className="text-sm text-default-600 font-normal">
                    {t("companyEmployees.updateEmployeeInfo")}
                  </p>
                </ModalHeader>
                <ModalBody className="gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      isRequired
                      errorMessage={validationErrors.userName}
                      isInvalid={!!validationErrors.userName}
                      label={t("companyEmployees.userName")}
                      placeholder={t("companyEmployees.userNamePlaceholder")}
                      value={formData.userName}
                      onValueChange={(value) =>
                        setFormData({ ...formData, userName: value })
                      }
                    />
                    <Input
                      isRequired
                      errorMessage={validationErrors.fullName}
                      isInvalid={!!validationErrors.fullName}
                      label={t("companyEmployees.fullName")}
                      placeholder={t("companyEmployees.fullNamePlaceholder")}
                      value={formData.fullName}
                      onValueChange={(value) =>
                        setFormData({ ...formData, fullName: value })
                      }
                    />
                    <Input
                      className="md:col-span-2"
                      label={t("companyEmployees.gradeName")}
                      placeholder={t("companyEmployees.gradeNamePlaceholder")}
                      value={formData.gradeName || ""}
                      onValueChange={(value) =>
                        setFormData({ ...formData, gradeName: value })
                      }
                    />
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onClose}>
                    {t("common.cancel")}
                  </Button>
                  <Button
                    color="primary"
                    isLoading={isSubmitting}
                    onPress={handleUpdate}
                  >
                    {t("common.update")}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* View Modal */}
        <Modal
          isOpen={isViewModalOpen}
          placement="center"
          size="2xl"
          onClose={onCloseViewModal}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  {t("companyEmployees.viewEmployee")}
                </ModalHeader>
                <ModalBody className="gap-4 pb-6">
                  {selectedEmployee && (
                    <div className="space-y-4">
                      {/* Employee Name Header */}
                      <div className="flex items-center gap-3 pb-4 border-b border-default-200">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">
                            {selectedEmployee.fullName}
                          </h3>
                          <p className="text-sm text-default-500">
                            {selectedEmployee.userName || "-"}
                          </p>
                        </div>
                      </div>

                      {/* Employee Information Grid */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2 border-b border-default-100">
                          <span className="text-sm text-default-600">
                            {t("companyEmployees.id")}
                          </span>
                          <span className="text-sm font-medium">
                            {selectedEmployee.id}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-2 border-b border-default-100">
                          <span className="text-sm text-default-600">
                            {t("companyEmployees.gradeName")}
                          </span>
                          <span className="text-sm font-medium">
                            {selectedEmployee.gradeName || "-"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-2 border-b border-default-100">
                          <span className="text-sm text-default-600">
                            {t("companyEmployees.createdAt")}
                          </span>
                          <span className="text-sm font-medium">
                            {formatDate(selectedEmployee.createdAt)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-2 border-b border-default-100">
                          <span className="text-sm text-default-600">
                            {t("companyEmployees.updatedAt")}
                          </span>
                          <span className="text-sm font-medium">
                            {formatDate(selectedEmployee.updatedAt)}
                          </span>
                        </div>

                        {selectedEmployee.createdBy && (
                          <div className="flex items-center justify-between py-2 border-b border-default-100">
                            <span className="text-sm text-default-600">
                              {t("companyEmployees.createdBy")}
                            </span>
                            <span className="text-sm font-medium">
                              {selectedEmployee.createdBy}
                            </span>
                          </div>
                        )}

                        {selectedEmployee.updatedBy && (
                          <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-default-600">
                              {t("companyEmployees.updatedBy")}
                            </span>
                            <span className="text-sm font-medium">
                              {selectedEmployee.updatedBy}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button color="primary" onPress={onClose}>
                    {t("common.close")}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          placement="center"
          size="md"
          onClose={onCloseDeleteModal}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  {t("companyEmployees.confirmDelete")}
                </ModalHeader>
                <ModalBody>
                  <p>{t("companyEmployees.deleteConfirmMessage")}</p>
                  {selectedEmployee && (
                    <div className="bg-default-100 rounded-lg p-3 mt-2">
                      <p className="font-medium">
                        {selectedEmployee.fullName} (ID: {selectedEmployee.id})
                      </p>
                      <p className="text-sm text-default-600">
                        {selectedEmployee.userName}
                      </p>
                    </div>
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onClose}>
                    {t("common.cancel")}
                  </Button>
                  <Button
                    color="danger"
                    isLoading={isSubmitting}
                    onPress={handleDelete}
                  >
                    {t("common.delete")}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </>
  );
}
