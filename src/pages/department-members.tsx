import type {
  DepartmentMember,
  AddDepartmentMemberRequest,
} from "@/types/department";
import type { EmployeeSearchResult } from "@/types/user";

import { useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Avatar } from "@heroui/avatar";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Skeleton } from "@heroui/skeleton";
import { Select, SelectItem } from "@heroui/select";
import { Tooltip } from "@heroui/tooltip";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { RefreshCw, User } from "lucide-react";

import { X } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import {
  DeleteIcon,
  MoreVerticalIcon,
  SearchIcon,
  PlusIcon,
  UserIcon,
} from "@/components/icons";
import { GlobalPagination } from "@/components/GlobalPagination";
import { useCurrentUserDepartmentMembers } from "@/hooks/useCurrentUserDepartmentMembers";
import { useEmployeeSearch } from "@/hooks/useEmployeeSearch";
import { useImpersonation } from "@/hooks/useImpersonation";
import { usePageTitle } from "@/hooks";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import { translateBackendError } from "@/utils/errorTranslation";
import { APP_CONFIG } from "@/config/environment";
import { PAGE_SIZE_OPTIONS } from "@/constants/pagination";

export default function DepartmentMembersPage() {
  const { t, language } = useLanguage();
  const { startImpersonation } = useImpersonation();

  // Set page title
  usePageTitle("departmentMembers.title");

  // Modal states
  const {
    isOpen: isMemberModalOpen,
    onOpen: onMemberModalOpen,
    onOpenChange: onMemberModalOpenChange,
  } = useDisclosure();
  const {
    isOpen: isDeleteMemberOpen,
    onOpen: onDeleteMemberOpen,
    onOpenChange: onDeleteMemberOpenChange,
  } = useDisclosure();

  // Impersonation modal
  const {
    isOpen: isImpersonationOpen,
    onOpen: onImpersonationOpen,
    onOpenChange: onImpersonationOpenChange,
  } = useDisclosure();

  // Member management state
  const [deletingMember, setDeletingMember] = useState<DepartmentMember | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeSearchResult | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isDeletingMember, setIsDeletingMember] = useState(false);

  // Impersonation state
  const [impersonatingMember, setImpersonatingMember] =
    useState<DepartmentMember | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);

  // Page size state
  const [isOptionOpen, setIsOptionOpen] = useState(false);

  // Form state for adding members
  const [memberForm, setMemberForm] = useState<
    Partial<AddDepartmentMemberRequest>
  >({
    prsId: undefined,
    userName: "",
    fullName: "",
  });

  // Use custom hook for current user's department members
  const {
    members,
    loading: membersLoading,
    error,
    totalPages,
    totalCount,
    departmentName,
    departmentId,
    pageSize,
    setPageSize,
    addMember,
    removeMember,
    refetch,
  } = useCurrentUserDepartmentMembers(currentPage, 10, searchTerm);

  // Use optimized employee search hook
  const {
    employees,
    loading: employeesLoading,
    searchEmployees,
    clearResults,
  } = useEmployeeSearch({
    minLength: 3,
    maxResults: 20,
    loadInitialResults: false,
  });

  // Member handlers
  const handleAddMember = () => {
    setMemberForm({
      prsId: undefined,
      userName: "",
      fullName: "",
    });
    setSelectedEmployee(null);
    clearResults();
    onMemberModalOpen();
  };

  const handleDeleteMember = (member: DepartmentMember) => {
    setDeletingMember(member);
    onDeleteMemberOpen();
  };

  const confirmDeleteMember = async () => {
    if (deletingMember) {
      try {
        setIsDeletingMember(true);
        await removeMember(deletingMember.id);
        showSuccessToast(t("departmentMembers.removeSuccess"));
        onDeleteMemberOpenChange();
        setDeletingMember(null);
        refetch();
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.error("Failed to remove member:", error);

        const errorMessage =
          error?.data?.error ||
          error?.message ||
          t("departmentMembers.removeError");

        const translatedError = translateBackendError(errorMessage, t);

        showErrorToast(translatedError);
      } finally {
        setIsDeletingMember(false);
      }
    }
  };

  const submitMemberForm = async () => {
    if (!departmentId) return;

    try {
      setIsAddingMember(true);
      await addMember({
        departmentId: departmentId,
        prsId: memberForm.prsId,
        userName: memberForm.userName,
        fullName: memberForm.fullName,
        role: "member", // Default role for new members
      });
      showSuccessToast(t("departmentMembers.addSuccess"));
      onMemberModalOpenChange();
      setSelectedEmployee(null);
      clearResults();
      refetch();
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("Failed to save member:", error);

      const errorMessage =
        error?.data?.error || error?.message || t("departmentMembers.addError");

      const translatedError = translateBackendError(errorMessage, t);

      showErrorToast(translatedError);
    } finally {
      setIsAddingMember(false);
    }
  };

  // Handle employee selection
  const handleEmployeeSelect = (employee: EmployeeSearchResult) => {
    setSelectedEmployee(employee);
    setMemberForm({
      ...memberForm,
      prsId: employee.id,
      userName: employee.userName,
      fullName: employee.fullName,
    });
  };

  // Impersonation handlers
  const handleImpersonateMember = (member: DepartmentMember) => {
    setImpersonatingMember(member);
    onImpersonationOpen();
  };

  const handleConfirmImpersonation = async () => {
    if (!impersonatingMember) return;

    try {
      setIsImpersonating(true);
      await startImpersonation(impersonatingMember.user.userName);
      showSuccessToast(t("users.impersonateSuccess"));
      onImpersonationOpenChange();
      setImpersonatingMember(null);
      // Refresh the whole page after impersonation
      setTimeout(() => {
        window.location.href = APP_CONFIG.basename;
      }, 500);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to start impersonation";

      showErrorToast(errorMessage);
    } finally {
      setIsImpersonating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">
          {t("departmentMembers.title")}
        </h1>
        <p className="text-default-500">
          {departmentName
            ? t("departmentMembers.subtitleWithDepartment", {
                department: departmentName,
              })
            : t("departmentMembers.subtitle")}
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search */}
          <Input
            className="sm:max-w-xs"
            endContent={
              searchTerm && (
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => setSearchTerm("")}
                >
                  <X size={16} />
                </Button>
              )
            }
            isClearable={false}
            placeholder={t("departmentMembers.searchPlaceholder")}
            startContent={<SearchIcon size={18} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Refresh Button */}
          <Tooltip content={t("common.refresh")}>
            <Button
              isIconOnly
              isLoading={membersLoading}
              variant="bordered"
              onPress={refetch}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </Tooltip>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto">
          {/* Page Size Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select
              aria-label={t("pagination.itemsPerPage")}
              className="w-20"
              isOpen={isOptionOpen}
              selectedKeys={[pageSize.toString()]}
              size="sm"
              onClose={() => setIsOptionOpen(false)}
              onOpenChange={setIsOptionOpen}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                if (selectedKey) {
                  setPageSize(parseInt(selectedKey));
                  setCurrentPage(1);
                  setIsOptionOpen(false);
                }
              }}
            >
              {PAGE_SIZE_OPTIONS.map((val) => {
                return (
                  <SelectItem
                    key={val.toString()}
                    textValue={val.toString()}
                    onPress={() => {
                      setIsOptionOpen(false);
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

          {/* Add Member Button */}
          <Button
            className="w-full sm:w-auto"
            color="primary"
            startContent={<PlusIcon size={16} />}
            onPress={handleAddMember}
          >
            {t("departmentMembers.addMember")}
          </Button>
        </div>
      </div>

      {/* Stats */}
      {!membersLoading && totalCount > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-default-500">
            {t("common.itemsFound").replace(
              "{count}",
              totalCount.toString(),
            )}
          </span>
        </div>
      )}

      {/* Members Table */}
      <Card>
        <CardBody className="p-0">
          {membersLoading ? (
            <Table aria-label="Loading department members table">
              <TableHeader>
                <TableColumn>{t("departmentMembers.fullName")}</TableColumn>
                <TableColumn>
                  {t("departmentMembers.militaryNumber")}
                </TableColumn>
                <TableColumn>{t("departmentMembers.gradeName")}</TableColumn>
                <TableColumn>{t("departmentMembers.joinDate")}</TableColumn>
                <TableColumn>{t("departmentMembers.actions")}</TableColumn>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`member-skeleton-${index}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24 rounded" />
                          <Skeleton className="h-3 w-16 rounded" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20 rounded" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16 rounded" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20 rounded" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8 rounded" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : error ? (
            <div className="text-center text-danger p-8">{error}</div>
          ) : !departmentId ? (
            <div className="text-center p-8 text-default-500">
              {t("departmentMembers.noDepartmentAssigned")}
            </div>
          ) : members.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center space-y-4">
                <User
                  className="mx-auto text-default-400"
                  height={64}
                  width={64}
                />
                <div>
                  <h3 className="text-lg font-semibold text-default-700">
                    {searchTerm
                      ? t("departmentMembers.noMembersFound")
                      : t("departmentMembers.noMembers")}
                  </h3>
                  <p className="text-default-500 mt-1">
                    {searchTerm
                      ? t("departmentMembers.tryDifferentSearch")
                      : t("departmentMembers.addFirstMember")}
                  </p>
                </div>
                {!searchTerm && (
                  <Button
                    color="primary"
                    startContent={<PlusIcon size={16} />}
                    onPress={handleAddMember}
                  >
                    {t("departmentMembers.addMember")}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <Table aria-label="Department members table">
              <TableHeader>
                <TableColumn>{t("departmentMembers.fullName")}</TableColumn>
                <TableColumn>
                  {t("departmentMembers.militaryNumber")}
                </TableColumn>
                <TableColumn>{t("departmentMembers.gradeName")}</TableColumn>
                <TableColumn>{t("departmentMembers.joinDate")}</TableColumn>
                <TableColumn>{t("departmentMembers.actions")}</TableColumn>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div
                        className={`flex items-center gap-2 ${language === "ar" ? "text-right" : ""}`}
                        dir={language === "ar" ? "rtl" : "ltr"}
                      >
                        <Avatar
                          showFallback
                          name={member.user.fullName}
                          size="sm"
                        />
                        <div>
                          <div className="font-medium">
                           {member.user.fullName}
                          </div>
                          <div className="text-sm text-default-500">
                            {member.user.userName}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={language === "ar" ? "text-right block" : ""}
                        dir={language === "ar" ? "rtl" : "ltr"}
                      >
                        {member.user.militaryNumber}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={language === "ar" ? "text-right block" : ""}
                        dir={language === "ar" ? "rtl" : "ltr"}
                      >
                        {member.user.gradeName}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(member.joinDate).toLocaleDateString("en-US")}
                    </TableCell>
                    <TableCell>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly size="sm" variant="light">
                            <MoreVerticalIcon size={16} />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Member actions">
                          <DropdownItem
                            key="impersonate"
                            startContent={<UserIcon className="h-4 w-4" />}
                            textValue={t("users.impersonate")}
                            onPress={() => handleImpersonateMember(member)}
                          >
                            {t("users.impersonate")}
                          </DropdownItem>

                          <DropdownItem
                            key="remove"
                            className="text-danger"
                            color="danger"
                            startContent={<DeleteIcon size={16} />}
                            onPress={() => handleDeleteMember(member)}
                          >
                            {t("departmentMembers.removeMember")}
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
      {totalCount > pageSize && (
        <div className="flex justify-center py-6">
          <GlobalPagination
            className="w-full max-w-md"
            currentPage={currentPage}
            isLoading={membersLoading}
            pageSize={pageSize}
            showInfo={true}
            totalItems={totalCount}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Add Member Modal */}
      <Modal
        isOpen={isMemberModalOpen}
        placement="top-center"
        onOpenChange={onMemberModalOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {t("departmentMembers.addMember")}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-2">
                  <Autocomplete
                    isClearable
                    isLoading={employeesLoading}
                    items={employees}
                    label={t("departmentMembers.selectEmployee")}
                    menuTrigger="input"
                    placeholder={t("departmentMembers.searchPlaceholder")}
                    selectedKey={selectedEmployee?.id.toString()}
                    onInputChange={searchEmployees}
                    onSelectionChange={(key) => {
                      if (key) {
                        const employee = employees.find(
                          (e) => e.id.toString() === key,
                        );

                        if (employee) {
                          handleEmployeeSelect(employee);
                        }
                      }
                    }}
                  >
                    {employees.map((employee) => (
                      <AutocompleteItem
                        key={employee.id.toString()}
                        textValue={`${employee.gradeName} (${employee.fullName})`}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar
                            showFallback
                            name={employee.fullName}
                            size="sm"
                          />
                          <div className="flex flex-col">
                            <span className="text-small">
                              {employee.gradeName} {employee.fullName}
                            </span>
                            <span className="text-tiny text-default-400">
                              {employee.militaryNumber} • @{employee.userName}
                            </span>
                          </div>
                        </div>
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>

                  {/* Selected Employee Details */}
                  {selectedEmployee && (
                    <Card>
                      <CardBody>
                        <div
                          className="grid grid-cols-2 gap-4"
                          dir={language === "ar" ? "rtl" : "ltr"}
                        >
                          <div>
                            <p className="text-small font-medium text-default-500">
                              {t("departmentMembers.fullName")}
                            </p>
                            <p className="text-small">
                              {selectedEmployee.fullName}
                            </p>
                          </div>
                          <div>
                            <p className="text-small font-medium text-default-500">
                              {t("departmentMembers.userName")}
                            </p>
                            <p className="text-small">
                              @{selectedEmployee.userName}
                            </p>
                          </div>
                          <div>
                            <p className="text-small font-medium text-default-500">
                              {t("departmentMembers.militaryNumber")}
                            </p>
                            <p className="text-small">
                              {selectedEmployee.militaryNumber}
                            </p>
                          </div>
                          <div>
                            <p className="text-small font-medium text-default-500">
                              {t("departmentMembers.gradeName")}
                            </p>
                            <p className="text-small">
                              {selectedEmployee.gradeName}
                            </p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  isDisabled={isAddingMember}
                  variant="flat"
                  onPress={onClose}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  color="primary"
                  isDisabled={!selectedEmployee || isAddingMember}
                  isLoading={isAddingMember}
                  onPress={submitMemberForm}
                >
                  {t("departmentMembers.addMember")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Member Confirmation Modal */}
      <Modal
        isOpen={isDeleteMemberOpen}
        onOpenChange={onDeleteMemberOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {t("departmentMembers.confirmRemove")}
              </ModalHeader>
              <ModalBody>
                <p>
                  {t("departmentMembers.confirmRemoveMessage", {
                    member: deletingMember?.user.fullName || "",
                  })}
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="default"
                  isDisabled={isDeletingMember}
                  variant="light"
                  onPress={onClose}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  color="danger"
                  isLoading={isDeletingMember}
                  onPress={confirmDeleteMember}
                >
                  {t("departmentMembers.removeMember")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Impersonation Confirmation Modal */}
      <Modal
        isOpen={isImpersonationOpen}
        onOpenChange={onImpersonationOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {t("users.confirmImpersonate")}
              </ModalHeader>
              <ModalBody>
                <p>{t("users.impersonateWarning")}</p>
                {impersonatingMember && (
                  <div className="flex items-center gap-3 p-3 bg-warning-50 rounded-lg">
                    <Avatar
                      name={impersonatingMember.user.fullName}
                      size="sm"
                    />
                    <div>
                      <p className="font-semibold">
                        {impersonatingMember.user.fullName}
                      </p>
                      <p className="text-small text-default-500">
                        {impersonatingMember.user.userName}
                      </p>
                    </div>
                  </div>
                )}
                <p className="text-small text-warning">
                  {t("users.impersonateNote")}
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  {t("common.cancel")}
                </Button>
                <Button
                  color="warning"
                  isLoading={isImpersonating}
                  onPress={handleConfirmImpersonation}
                >
                  {t("users.confirmImpersonate")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
