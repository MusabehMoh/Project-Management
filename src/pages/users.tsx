import type {
  User,
  Action,
  CreateUserRequest,
  UpdateUserRequest,
  EmployeeSearchResult,
} from "@/types/user";

import { useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Avatar } from "@heroui/avatar";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Spinner } from "@heroui/spinner";
import { Switch } from "@heroui/switch";
import { CheckboxGroup, Checkbox } from "@heroui/checkbox";
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
  PlusIcon,
  EditIcon,
  DeleteIcon,
  MoreVerticalIcon,
  SearchIcon,
} from "@/components/icons";
import { GlobalPagination } from "@/components/GlobalPagination";
import { useUsers, useRoles, useActions } from "@/hooks/useUsers";
import { useEmployeeSearch } from "@/hooks/useEmployeeSearch";

export default function UsersPage() {
  const { t, language } = useLanguage();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure();

  // Use the users hook for data management
  const {
    users,
    loading,
    error,
    filters,
    pagination,
    loadUsers,
    createUser,
    updateUser,
    deleteUser,
    updateFilters,
  } = useUsers();

  const { roles } = useRoles();
  const { actions, actionsByCategory } = useActions();

  // Use optimized employee search
  const {
    employees: employeeOptions,
    loading: employeeSearchLoading,
    searchEmployees,
    clearResults: clearEmployeeResults,
  } = useEmployeeSearch({
    minLength: 2,
    debounceMs: 300,
    maxResults: 25,
    loadInitialResults: false,
  });

  // Form state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeSearchResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<number | null>(null); // Single role
  const [selectedAdditionalActions, setSelectedAdditionalActions] = useState<
    number[]
  >([]); // Additional actions only
  const [isVisible, setIsVisible] = useState(true);

  // Helper functions for role and action management
  const getSelectedRoleData = () => {
    return roles.find((r) => r.id === selectedRole);
  };

  const getRoleDefaultActions = () => {
    const roleData = getSelectedRoleData();

    return roleData?.actions || [];
  };

  const getAvailableAdditionalActions = () => {
    const roleDefaultActionIds = getRoleDefaultActions().map((a) => a.id);

    return actions.filter(
      (action) => !roleDefaultActionIds.includes(action.id),
    );
  };

  const getAllUserActions = () => {
    const defaultActions = getRoleDefaultActions();
    const additionalActions = actions.filter((a) =>
      selectedAdditionalActions.includes(a.id),
    );

    return [...defaultActions, ...additionalActions];
  };

  // Handle employee selection
  const handleEmployeeSelect = (employee: EmployeeSearchResult) => {
    setSelectedEmployee(employee);
    clearEmployeeResults(); // Clear search results after selection
  };

  // Status helpers
  const getStatusText = (isVisible: boolean) => {
    return isVisible ? t("users.isVisible") : t("common.inactive");
  };

  const getStatusColor = (isVisible: boolean) => {
    return isVisible ? "success" : "default";
  };

  // Handle user operations
  const handleAddUser = async () => {
    setSelectedUser(null);
    setSelectedEmployee(null);
    setSelectedRole(null);
    setSelectedAdditionalActions([]);
    setIsVisible(true);
    setIsEditing(false);

    // Clear any previous search results
    clearEmployeeResults();

    onOpen();
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setSelectedEmployee(
      user.employee
        ? {
            id: user.employee.id,
            userName: user.employee.userName,
            militaryNumber: user.employee.militaryNumber,
            fullName: user.employee.fullName,
            gradeName: user.employee.gradeName,
            statusId: user.employee.statusId,
          }
        : null,
    );

    // Set single role
    const userRole = user.roles?.[0]; // Take first role as primary

    setSelectedRole(userRole?.id || null);

    // Set additional actions (exclude role's default actions)
    const roleDefaultActions = userRole?.actions?.map((a) => a.id) || [];
    const userActions = user.actions?.map((a) => a.id) || [];
    const additionalActions = userActions.filter(
      (actionId) => !roleDefaultActions.includes(actionId),
    );

    setSelectedAdditionalActions(additionalActions);

    setIsVisible(user.isVisible);
    setIsEditing(true);
    onOpen();
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    onDeleteOpen();
  };

  const handleSaveUser = async () => {
    if (!selectedEmployee || !selectedRole) return;

    try {
      // Get role's default actions
      const selectedRoleData = roles.find((r) => r.id === selectedRole);
      const roleDefaultActions =
        selectedRoleData?.actions?.map((a) => a.id) || [];

      // Combine role's default actions with additional selected actions
      const allUserActions = [
        ...roleDefaultActions,
        ...selectedAdditionalActions,
      ];

      const userData = {
        userName: selectedEmployee.userName,
        prsId: selectedEmployee.id,
        isVisible,
        roleIds: [selectedRole], // Single role in array
        actionIds: allUserActions,
      };

      if (isEditing && selectedUser) {
        await updateUser({
          id: selectedUser.id,
          ...userData,
        } as UpdateUserRequest);
      } else {
        await createUser(userData as CreateUserRequest);
      }

      onOpenChange();
      resetForm();
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedUser) {
      try {
        await deleteUser(selectedUser.id);
        onDeleteOpenChange();
        setSelectedUser(null);
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const resetForm = () => {
    setSelectedUser(null);
    setSelectedEmployee(null);
    setSelectedRole(null);
    setSelectedAdditionalActions([]);
    setIsVisible(true);
    clearEmployeeResults(); // Clear any search results
  };

  // Filter handlers
  const handleSearch = (value: string) => {
    console.log("🔍 Frontend search triggered with value:", value);
    // Use the new search field that searches both fullName and militaryNumber
    // Clear all other filters to avoid conflicts
    updateFilters({
      search: value || undefined, // Only set if value is not empty
      fullName: undefined,
      militaryNumber: undefined,
      userName: undefined,
      roleId: filters.roleId, // Keep role filter
      isVisible: filters.isVisible, // Keep visibility filter
      statusId: filters.statusId, // Keep status filter
    });
  };

  const handleRoleFilter = (roleId: string) => {
    updateFilters({
      ...filters,
      roleId: roleId ? parseInt(roleId) : undefined,
    });
  };

  const handleStatusFilter = (status: string) => {
    updateFilters({
      ...filters,
      isVisible: status === "all" ? undefined : status === "active",
    });
  };


  // Pagination page size options
  const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];
  const effectivePageSize = PAGE_SIZE_OPTIONS.includes(pagination.limit)
    ? pagination.limit
    : 20;

  // Handler for page size change
  const handlePageSizeChange = (newSize: number) => {
    // Always go to first page when page size changes
    loadUsers(1, newSize);
  };

  return (
    <DefaultLayout>
      <div className={`space-y-6 ${language === "ar" ? "rtl" : "ltr"}`}>
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t("users.title")}
            </h1>
            <p className="text-default-600 mt-2">{t("users.subtitle")}</p>
          </div>

          {/* Actions and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Search */}
              <Input
                className="w-full sm:w-80"
                placeholder={t("users.searchEmployees")}
                startContent={
                  <SearchIcon className="text-default-400" size={18} />
                }
                value={filters.search || ""}
                onChange={(e) => handleSearch(e.target.value)}
              />

              {/* Role Filter */}
              <Select
                aria-label={t("users.roles")}
                className="w-full sm:w-48"
                placeholder={t("users.roles")}
                selectedKeys={filters.roleId ? [filters.roleId.toString()] : []}
                onSelectionChange={(keys) => {
                  const roleId = Array.from(keys)[0] as string;
                  handleRoleFilter(roleId);
                }}
              >
                <SelectItem key="all" textValue={t("common.all")}> 
                  {t("common.all")}
                </SelectItem>
                <>
                  {roles.map((role) => (
                    <SelectItem key={role.id.toString()} textValue={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </>
              </Select>

              {/* Status Filter */}
              <Select
                aria-label={t("users.status")}
                className="w-full sm:w-32"
                placeholder={t("users.status")}
                selectedKeys={
                  filters.isVisible === undefined
                    ? ["all"]
                    : filters.isVisible
                      ? ["active"]
                      : ["inactive"]
                }
                onSelectionChange={(keys) => {
                  const status = Array.from(keys)[0] as string;
                  handleStatusFilter(status);
                }}
              >
                <SelectItem key="all" textValue={t("common.all")}> 
                  {t("common.all")}
                </SelectItem>
                <SelectItem key="active" textValue={t("users.activeUsers")}> 
                  {t("users.activeUsers")}
                </SelectItem>
                <SelectItem key="inactive" textValue={t("users.inactiveUsers")}> 
                  {t("users.inactiveUsers")}
                </SelectItem>
              </Select>
            </div>

            {/* Page Size Selector */}
            {!loading && pagination.total > 0 && (
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
            {/* Add User Button */}
            <Button
              className="w-full sm:w-auto"
              color="primary"
              startContent={<PlusIcon />}
              onPress={handleAddUser}
            >
              {t("users.addUser")}
            </Button>
          </div>
        </div>


        {/* Users Table */}
        <Card>
          <CardBody className="p-0">
            {/* Results info */}
            {!loading && pagination.total > 0 && (
              <div className="text-sm text-default-600 px-4 pt-4">
                {t("pagination.showing")} {((pagination.page - 1) * pagination.limit) + 1} {t("pagination.to")} {Math.min(pagination.page * pagination.limit, pagination.total)} {t("pagination.of")} {pagination.total} {t("users.totalUsers")}
              </div>
            )}
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Spinner size="lg" />
              </div>
            ) : error ? (
              <div className="flex justify-center items-center h-40 text-danger">
                {error}
              </div>
            ) : (
              <Table aria-label="Users table">
                <TableHeader>
                  <TableColumn className="min-w-[200px]">
                    {t("users.userName")}
                  </TableColumn>
                  <TableColumn className="min-w-[200px]">
                    {t("users.fullName")}
                  </TableColumn>
                  <TableColumn className="min-w-[120px]">
                    {t("users.militaryNumber")}
                  </TableColumn>
                  <TableColumn className="min-w-[100px]">
                    {t("users.gradeName")}
                  </TableColumn>
                  <TableColumn className="min-w-[150px]">
                    {t("users.roles")}
                  </TableColumn>
                  <TableColumn className="min-w-[100px]">
                    {t("users.status")}
                  </TableColumn>
                  <TableColumn className="min-w-[80px]">
                    {t("users.actions")}
                  </TableColumn>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            className="flex-shrink-0"
                            name={user.employee?.fullName || user.userName}
                            size="sm"
                          />
                          <div className="flex flex-col">
                            <p className="font-semibold">{user.userName}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">
                          {user.employee?.fullName || "N/A"}
                        </p>
                      </TableCell>
                      <TableCell>
                        {user.employee?.militaryNumber || "N/A"}
                      </TableCell>
                      <TableCell>{user.employee?.gradeName || "N/A"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles?.slice(0, 1).map(
                            (
                              role, // Show only primary role
                            ) => (
                              <Chip
                                key={role.id}
                                color="primary"
                                size="sm"
                                variant="flat"
                              >
                                {role.name}
                              </Chip>
                            ),
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={getStatusColor(user.isVisible)}
                          size="sm"
                          variant="flat"
                        >
                          {getStatusText(user.isVisible)}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                              <MoreVerticalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu>
                            <DropdownItem
                              key="edit"
                              startContent={<EditIcon className="h-4 w-4" />}
                              onPress={() => handleEditUser(user)}
                            >
                              {t("users.editUser")}
                            </DropdownItem>
                            <DropdownItem
                              key="delete"
                              className="text-danger"
                              color="danger"
                              startContent={<DeleteIcon className="h-4 w-4" />}
                              onPress={() => handleDeleteUser(user)}
                            >
                              {t("users.deleteUser")}
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
        {pagination.total > effectivePageSize && (
          <div className="flex justify-center py-6">
            <GlobalPagination
              className="w-full max-w-md"
              currentPage={pagination.page}
              isLoading={loading}
              pageSize={effectivePageSize}
              showInfo={false}
              totalItems={pagination.total}
              totalPages={pagination.totalPages}
              onPageChange={(page) => loadUsers(page, effectivePageSize)}
            />
          </div>
        )}

        {/* Add/Edit User Modal */}
        <Modal
          isOpen={isOpen}
          scrollBehavior="inside"
          size="2xl"
          onOpenChange={onOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  {isEditing ? t("users.editUser") : t("users.addUser")}
                </ModalHeader>
                <ModalBody>
                  <div className="space-y-4">
                    {/* Employee Selection */}
                    <div>
                      <Autocomplete
                        isClearable
                        isRequired
                        isLoading={employeeSearchLoading}
                        items={employeeOptions}
                        label={t("users.selectEmployee")}
                        menuTrigger="input"
                        placeholder={t("users.searchEmployees")}
                        selectedKey={selectedEmployee?.id.toString()}
                        onInputChange={searchEmployees}
                        onSelectionChange={(key) => {
                          if (key) {
                            const employee = employeeOptions.find(
                              (e) => e.id.toString() === key,
                            );

                            if (employee) {
                              handleEmployeeSelect(employee);
                            }
                          }
                        }}
                      >
                        {employeeOptions.map((employee) => (
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
                    </div>

                    {/* Selected Employee Details */}
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

                    {/* User Status */}
                    <div className="flex items-center gap-3">
                      <Switch
                        isSelected={isVisible}
                        size="sm"
                        onValueChange={setIsVisible}
                      >
                        {t("users.isVisible")}
                      </Switch>
                    </div>

                    {/* Role Selection (Single Role) */}
                    <div>
                      <Select
                        isRequired
                        aria-label={t("users.assignRoles")}
                        label={t("users.assignRoles")}
                        placeholder={t("roles.selectRole")}
                        selectedKeys={
                          selectedRole
                            ? new Set([selectedRole.toString()])
                            : new Set()
                        }
                        onSelectionChange={(keys) => {
                          const selectedKeys = Array.from(keys);
                          const roleId = selectedKeys[0] as string;

                          setSelectedRole(roleId ? parseInt(roleId) : null);
                          // Reset additional actions when role changes
                          setSelectedAdditionalActions([]);
                        }}
                      >
                        {roles.map((role) => (
                          <SelectItem
                            key={role.id.toString()}
                            textValue={role.name}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{role.name}</span>
                              <span className="text-small text-default-500">
                                {role.actions?.length || 0}{" "}
                                {t("actions.defaultActions")}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </Select>
                    </div>

                    {/* Selected Role Default Actions (Read-only) */}
                    {selectedRole && (
                      <div>
                        <p className="text-small text-default-500 mb-2">
                          {t("actions.defaultActionsForRole")} &quot;
                          {getSelectedRoleData()?.name}&quot;
                        </p>
                        <Card className="bg-default-50">
                          <CardBody className="py-3">
                            <div className="flex flex-wrap gap-2">
                              {getRoleDefaultActions().map((action) => (
                                <Chip
                                  key={action.id}
                                  color="success"
                                  size="sm"
                                  startContent={
                                    <span className="text-success">✓</span>
                                  }
                                  variant="flat"
                                >
                                  {action.name}
                                </Chip>
                              ))}
                            </div>
                            <p className="text-tiny text-default-500 mt-2">
                              {t("actions.defaultActionsNote")}
                            </p>
                          </CardBody>
                        </Card>
                      </div>
                    )}

                    {/* Additional Action Selection */}
                    {selectedRole &&
                      getAvailableAdditionalActions().length > 0 && (
                        <div>
                          <p className="text-small text-default-500 mb-2">
                            {t("users.assignAdditionalActions")}
                          </p>
                          <div className="space-y-3 max-h-48 overflow-y-auto border border-default-200 rounded-lg p-3 bg-default-50">
                            {Object.entries(
                              getAvailableAdditionalActions().reduce(
                                (acc, action) => {
                                  if (!acc[action.categoryName]) {
                                    acc[action.categoryName] = [];
                                  }
                                  acc[action.categoryName].push(action);

                                  return acc;
                                },
                                {} as { [categoryName: string]: Action[] },
                              ),
                            ).map(([category, categoryActions]) => (
                              <div
                                key={category}
                                className="bg-white rounded-md p-3 shadow-sm"
                              >
                                <p className="font-medium text-small mb-2 text-primary">
                                  {category}
                                </p>
                                <CheckboxGroup
                                  classNames={{
                                    wrapper: "gap-1",
                                  }}
                                  value={selectedAdditionalActions.map(String)}
                                  onValueChange={(value) =>
                                    setSelectedAdditionalActions(
                                      value.map(Number),
                                    )
                                  }
                                >
                                  {categoryActions.slice(0, 5).map((action) => (
                                    <Checkbox
                                      key={action.id}
                                      size="sm"
                                      value={action.id.toString()}
                                    >
                                      <div>
                                        <p className="text-small">
                                          {action.name}
                                        </p>
                                        <p className="text-tiny text-default-500">
                                          {action.description}
                                        </p>
                                      </div>
                                    </Checkbox>
                                  ))}
                                  {categoryActions.length > 5 && (
                                    <p className="text-tiny text-default-400 mt-2">
                                      +{categoryActions.length - 5} more actions
                                      available
                                    </p>
                                  )}
                                </CheckboxGroup>
                              </div>
                            ))}
                            <div className="text-center pt-2">
                              <p className="text-tiny text-default-500">
                                {t("actions.scrollToSeeMore")} •{" "}
                                {getAvailableAdditionalActions().length}{" "}
                                {t("actions.totalAvailable")}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Summary of All Permissions */}
                    {selectedRole && (
                      <div>
                        <p className="text-small text-default-500 mb-2">
                          {t("users.permissionsSummary")}
                        </p>
                        <Card className="bg-primary-50 border border-primary-200">
                          <CardBody className="py-3">
                            <div className="space-y-2">
                              <div>
                                <p className="text-small font-medium text-primary">
                                  {t("roles.role")}:{" "}
                                  {getSelectedRoleData()?.name}
                                </p>
                              </div>
                              <div>
                                <p className="text-tiny text-default-600">
                                  {t("actions.totalActions")}:{" "}
                                  {getAllUserActions().length}
                                </p>
                                <p className="text-tiny text-default-600">
                                  {t("actions.defaultFromRole")}:{" "}
                                  {getRoleDefaultActions().length}
                                </p>
                                <p className="text-tiny text-default-600">
                                  {t("actions.additionalSelected")}:{" "}
                                  {selectedAdditionalActions.length}
                                </p>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      </div>
                    )}
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    {t("common.cancel")}
                  </Button>
                  <Button
                    color="primary"
                    isDisabled={!selectedEmployee || !selectedRole}
                    onPress={handleSaveUser}
                  >
                    {isEditing ? t("common.save") : t("users.addUser")}
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
                  {t("users.confirmDelete")}
                </ModalHeader>
                <ModalBody>
                  <p>{t("users.deleteConfirmMessage")}</p>
                  {selectedUser && (
                    <p className="font-semibold">
                      {selectedUser.employee?.fullName || selectedUser.userName}
                    </p>
                  )}
                  <p className="text-small text-danger">
                    {t("projects.actionCannotBeUndone")}
                  </p>
                </ModalBody>
                <ModalFooter>
                  <Button color="default" variant="light" onPress={onClose}>
                    {t("common.cancel")}
                  </Button>
                  <Button color="danger" onPress={handleConfirmDelete}>
                    {t("users.deleteUser")}
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
