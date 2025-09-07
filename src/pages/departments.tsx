import type {
  Department,
  DepartmentMember,
  CreateDepartmentRequest,
  AddDepartmentMemberRequest,
} from "@/types/department";
import type { EmployeeSearchResult } from "@/types/user";

import { useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Avatar } from "@heroui/avatar";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Spinner } from "@heroui/spinner";
import { Switch } from "@heroui/switch";
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

import DefaultLayout from "@/layouts/default";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  EditIcon,
  DeleteIcon,
  MoreVerticalIcon,
  SearchIcon,
  UsersIcon,
} from "@/components/icons";
import { GlobalPagination } from "@/components/GlobalPagination";
import { useDepartments, useDepartmentMembers } from "@/hooks/useDepartments";
import { useEmployeeSearch } from "@/hooks/useEmployeeSearch";

// Import test utility for debugging
export default function DepartmentsPage() {
  const { t, language } = useLanguage();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure();
  const {
    isOpen: isMembersOpen,
    onOpen: onMembersOpen,
    onOpenChange: onMembersOpenChange,
  } = useDisclosure();
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

  // Department state
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null,
  );
  const [deletingDepartment, setDeletingDepartment] =
    useState<Department | null>(null);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Member management state
  // Removed unused editingMember state
  const [deletingMember, setDeletingMember] = useState<DepartmentMember | null>(
    null,
  );
  const [memberCurrentPage, setMemberCurrentPage] = useState(1);
  const [memberListSearchTerm, setMemberListSearchTerm] = useState(""); // For filtering existing members
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeSearchResult | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Form states
  const [departmentForm, setDepartmentForm] = useState<CreateDepartmentRequest>(
    {
      name: "",
      nameAr: "",
      description: "",
      status: "active",
    },
  );

  const [memberForm, setMemberForm] = useState<
    Partial<AddDepartmentMemberRequest>
  >({
    userId: undefined,
    userName: "",
    fullName: "",
  });

  // Filters for departments
  const filters = {
    search: searchTerm,
    status: statusFilter === "all" ? undefined : statusFilter,
  };

  const {
    departments,
    loading,
    error,
    totalPages,
    updateDepartment,
    deleteDepartment,
  } = useDepartments(filters, currentPage, 10);

  const {
    members,
    loading: membersLoading,
    totalPages: memberTotalPages,
    addMember,
    removeMember,
  } = useDepartmentMembers(
    selectedDepartment?.id || 0,
    memberCurrentPage,
    10,
    memberListSearchTerm,
  );

  // Use optimized employee search hook
  const {
    employees,
    loading: employeesLoading,
    searchEmployees,
    clearResults,
  } = useEmployeeSearch({
    minLength: 1,
    maxResults: 20,
    loadInitialResults: false,
  });

  const handleDeleteDepartment = (department: Department) => {
    setDeletingDepartment(department);
    onDeleteOpen();
  };

  const handleViewMembers = (department: Department) => {
    setSelectedDepartment(department);
    setMemberCurrentPage(1);
    setSelectedEmployee(null);
    clearResults();
    onMembersOpen();
  };

  const confirmDeleteDepartment = async () => {
    if (deletingDepartment) {
      try {
        await deleteDepartment(deletingDepartment.id);
        onDeleteOpenChange();
        setDeletingDepartment(null);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to delete department:", error);
      }
    }
  };

  const submitDepartmentForm = async () => {
    try {
      if (editingDepartment) {
        await updateDepartment({
          id: editingDepartment.id,
          ...departmentForm,
        });
        onOpenChange();
        setEditingDepartment(null);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to update department:", error);
    }
  };

  // Member handlers
  const handleAddMember = () => {
    setShowManualEntry(false);
    setMemberForm({
      userId: undefined,
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
        await removeMember(deletingMember.id);
        onDeleteMemberOpenChange();
        setDeletingMember(null);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to remove member:", error);
      }
    }
  };

  const submitMemberForm = async () => {
    if (!selectedDepartment) return;

    try {
      await addMember({
        departmentId: selectedDepartment.id,
        userId: memberForm.userId,
        userName: memberForm.userName,
        fullName: memberForm.fullName,
        role: "member", // Default role for new members
      });
      onMemberModalOpenChange();
      setSelectedEmployee(null);
      clearResults();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to save member:", error);
    }
  };

  // Handle employee selection
  const handleEmployeeSelect = (employee: EmployeeSearchResult) => {
    setSelectedEmployee(employee);
    setMemberForm({
      ...memberForm,
      userId: employee.id,
      userName: employee.userName,
      fullName: employee.fullName,
    });
  };

  const renderDepartmentStatus = (status: string) => {
    return (
      <Chip
        color={status === "active" ? "success" : "default"}
        size="sm"
        variant="flat"
      >
        {t(`departments.${status}`)}
      </Chip>
    );
  };

  return (
    <DefaultLayout>
      <div className="flex flex-col gap-6 p-4">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-foreground">
            {t("departments.title")}
          </h1>
          <p className="text-default-500">{t("departments.subtitle")}</p>
        </div>

        {/* Statistics Cards */}

        {/* Departments Table */}
        <Card>
          <CardBody className="p-0">
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <Spinner size="lg" />
              </div>
            ) : error ? (
              <div className="text-center text-danger p-8">{error}</div>
            ) : departments.length === 0 ? (
              <div className="text-center p-8 text-default-500">
                {t("departments.noDepartmentsFound")}
              </div>
            ) : (
              <Table aria-label="Departments table">
                <TableHeader>
                  <TableColumn>{t("departments.name")}</TableColumn>
                  <TableColumn>{t("departments.status")}</TableColumn>
                  <TableColumn>{t("departments.memberCount")}</TableColumn>
                  <TableColumn>{t("departments.updatedAt")}</TableColumn>
                  <TableColumn>{t("departments.actions")}</TableColumn>
                </TableHeader>
                <TableBody>
                  {departments.map((department) => (
                    <TableRow key={department.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{department.name}</div>
                          {department.nameAr && (
                            <div className="text-sm text-default-500">
                              {department.nameAr}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {renderDepartmentStatus(department.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UsersIcon size={16} />
                          {department.memberCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        {department.updatedAt
                          ? new Date(department.updatedAt).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                              <MoreVerticalIcon size={16} />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu aria-label="Department actions">
                            <DropdownItem
                              key="members"
                              startContent={<UsersIcon size={16} />}
                              onPress={() => handleViewMembers(department)}
                            >
                              {t("departments.viewMembers")}
                            </DropdownItem>

                            <DropdownItem
                              key="delete"
                              className="text-danger"
                              color="danger"
                              startContent={<DeleteIcon size={16} />}
                              onPress={() => handleDeleteDepartment(department)}
                            >
                              {t("departments.deleteDepartment")}
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
          <div className="flex justify-center">
            <GlobalPagination
              currentPage={currentPage}
              pageSize={10}
              totalItems={0}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* Delete Department Confirmation Modal */}
        <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  {t("departments.confirmDelete")}
                </ModalHeader>
                <ModalBody>
                  <p>
                    {t("departments.deleteConfirmMessage")}{" "}
                    <strong>{deletingDepartment?.name}</strong>?
                  </p>
                  <p className="text-sm text-warning">
                    {t("departments.deleteWarning")}
                  </p>
                </ModalBody>
                <ModalFooter>
                  <Button color="default" variant="light" onPress={onClose}>
                    {t("common.cancel")}
                  </Button>
                  <Button color="danger" onPress={confirmDeleteDepartment}>
                    {t("common.delete")}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Department Members Modal */}
        <Modal
          isOpen={isMembersOpen}
          scrollBehavior="inside"
          size="5xl"
          onOpenChange={onMembersOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  <div>
                    {selectedDepartment?.name} -{" "}
                    {t("departments.members.title")}
                  </div>
                  <div className="text-sm font-normal text-default-500">
                    {selectedDepartment?.nameAr}
                  </div>
                </ModalHeader>
                <ModalBody>
                  {/* Members Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 items-center justify-between mb-4">
                    <Input
                      className="sm:max-w-xs"
                      placeholder={t("departments.members.searchPlaceholder")}
                      startContent={<SearchIcon size={18} />}
                      value={memberListSearchTerm}
                      onChange={(e) => setMemberListSearchTerm(e.target.value)}
                    />
                    <Button color="primary" onPress={handleAddMember}>
                      {t("departments.members.addMember")}
                    </Button>
                  </div>

                  {/* Members Table */}
                  {membersLoading ? (
                    <div className="flex justify-center items-center p-8">
                      <Spinner size="lg" />
                    </div>
                  ) : members.length === 0 ? (
                    <div className="text-center p-8 text-default-500">
                      {t("departments.members.noMembersFound")}
                    </div>
                  ) : (
                    <Table aria-label="Department members table">
                      <TableHeader>
                        <TableColumn>
                          {t("departments.members.fullName")}
                        </TableColumn>
                        <TableColumn>
                          {t("departments.members.militaryNumber")}
                        </TableColumn>
                        <TableColumn>
                          {t("departments.members.gradeName")}
                        </TableColumn>
                        <TableColumn>
                          {t("departments.members.joinedAt")}
                        </TableColumn>
                        <TableColumn>{t("departments.actions")}</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {members.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
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
                                    @{member.user.userName}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{member.user.militaryNumber}</TableCell>
                            <TableCell>{member.user.gradeName}</TableCell>
                            <TableCell>
                              {new Date(member.joinedAt).toLocaleDateString(
                                language === "ar" ? "ar-SA" : "en-US",
                              )}
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
                                    key="remove"
                                    className="text-danger"
                                    color="danger"
                                    startContent={<DeleteIcon size={16} />}
                                    onPress={() => handleDeleteMember(member)}
                                  >
                                    {t("departments.members.removeMember")}
                                  </DropdownItem>
                                </DropdownMenu>
                              </Dropdown>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}

                  {/* Members Pagination */}
                  {memberTotalPages > 1 && (
                    <div className="flex justify-center mt-4">
                      <GlobalPagination
                        currentPage={memberCurrentPage}
                        pageSize={10}
                        totalItems={0}
                        totalPages={memberTotalPages}
                        onPageChange={setMemberCurrentPage}
                      />
                    </div>
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button color="default" onPress={onClose}>
                    {t("common.close")}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Add/Edit Member Modal */}
        <Modal
          isOpen={isMemberModalOpen}
          placement="top-center"
          onOpenChange={onMemberModalOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  {t("departments.members.addMember")}
                </ModalHeader>
                <ModalBody>
                  <div className="flex items-center gap-2">
                    <Switch
                      isSelected={!showManualEntry}
                      onValueChange={(value) => {
                        // value=true means using search mode; false means manual entry
                        const useSearch = value;

                        setShowManualEntry(!useSearch);

                        // Reset form and selection whenever mode changes to avoid stale validation/state
                        setMemberForm({
                          userId: undefined,
                          userName: "",
                          fullName: "",
                        });
                        setSelectedEmployee(null);
                        clearResults();
                      }}
                    />
                    <span>{t("departments.members.searchEmployee")}</span>
                  </div>

                  {!showManualEntry ? (
                    <div className="space-y-2">
                      <Autocomplete
                        isClearable
                        isLoading={employeesLoading}
                        items={employees}
                        label={t("departments.members.selectEmployee")}
                        menuTrigger="input"
                        placeholder={t("departments.members.searchPlaceholder")}
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
                            textValue={`${employee.fullName} (${employee.militaryNumber})`}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {employee.fullName}
                              </span>
                              <span className="text-small text-default-500">
                                {employee.militaryNumber} • {employee.gradeName}
                              </span>
                            </div>
                          </AutocompleteItem>
                        ))}
                      </Autocomplete>

                      {/* Selected Employee Details - Same as Users Page */}
                      {selectedEmployee && (
                        <Card>
                          <CardBody>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-small text-default-500">
                                  {t("users.fullName")}
                                </p>
                                <p className="font-medium">
                                  {selectedEmployee.fullName}
                                </p>
                              </div>
                              <div>
                                <p className="text-small text-default-500">
                                  {t("users.userName")}
                                </p>
                                <p className="font-medium">
                                  {selectedEmployee.userName}
                                </p>
                              </div>
                              <div>
                                <p className="text-small text-default-500">
                                  {t("users.militaryNumber")}
                                </p>
                                <p className="font-medium">
                                  {selectedEmployee.militaryNumber}
                                </p>
                              </div>
                              <div>
                                <p className="text-small text-default-500">
                                  {t("users.gradeName")}
                                </p>
                                <p className="font-medium">
                                  {selectedEmployee.gradeName}
                                </p>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      )}

                      <div className="text-center text-sm text-default-500">
                        {t("departments.members.employeeNotFound")}
                        <Button
                          className="ml-2"
                          color="primary"
                          size="sm"
                          variant="light"
                          onPress={() => setShowManualEntry(true)}
                        >
                          {t("departments.members.manualEntry")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Input
                        label={t("departments.members.userName")}
                        placeholder={t("departments.members.userName")}
                        value={memberForm.userName}
                        variant="bordered"
                        onChange={(e) =>
                          setMemberForm({
                            ...memberForm,
                            userName: e.target.value,
                          })
                        }
                      />
                      <Input
                        label={t("departments.members.fullName")}
                        placeholder={t("departments.members.fullName")}
                        value={memberForm.fullName}
                        variant="bordered"
                        onChange={(e) =>
                          setMemberForm({
                            ...memberForm,
                            fullName: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="flat" onPress={onClose}>
                    {t("common.cancel")}
                  </Button>
                  <Button
                    color="primary"
                    isDisabled={!memberForm.fullName?.trim()}
                    onPress={submitMemberForm}
                  >
                    {t("common.add")}
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
                  {t("departments.members.confirmRemove")}
                </ModalHeader>
                <ModalBody>
                  <p>
                    {t("departments.members.removeConfirmMessage")}{" "}
                    <strong>{deletingMember?.user.fullName}</strong>?
                  </p>
                </ModalBody>
                <ModalFooter>
                  <Button color="default" variant="light" onPress={onClose}>
                    {t("common.cancel")}
                  </Button>
                  <Button color="danger" onPress={confirmDeleteMember}>
                    {t("common.remove")}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </DefaultLayout>
  );
}
