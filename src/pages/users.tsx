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
import { Skeleton } from "@heroui/skeleton";
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
import { X } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { usePermissions } from "@/hooks/usePermissions";
import { createGeneralToasts } from "@/utils/toast";
import {
  PlusIcon,
  EditIcon,
  DeleteIcon,
  MoreVerticalIcon,
  SearchIcon,
  UserIcon,
} from "@/components/icons";
import { GlobalPagination } from "@/components/GlobalPagination";
import { useUsers, useRoles, useActions } from "@/hooks/useUsers";
import { useImpersonation } from "@/hooks/useImpersonation";
import { ApiError } from "@/services/api/client";
import { translateBackendError } from "@/utils/errorTranslation";
import { useEmployeeSearch } from "@/hooks/useEmployeeSearch";
import { usePageTitle } from "@/hooks";
import { PAGE_SIZE_OPTIONS, normalizePageSize } from "@/constants/pagination";
import { APP_CONFIG } from "@/config/environment";

export default function UsersPage() {
  const { t, language } = useLanguage();
  const { hasPermission } = usePermissions();
  const { startImpersonation } = useImpersonation();

  // Toast helpers
  const toasts = createGeneralToasts(t);

  // Set page title
  usePageTitle("users.title");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure();
  const {
    isOpen: isActionsModalOpen,
    onOpen: onActionsModalOpen,
    onOpenChange: onActionsModalOpenChange,
  } = useDisclosure();

  // Impersonation modal
  const {
    isOpen: isImpersonationOpen,
    onOpen: onImpersonationOpen,
    onOpenChange: onImpersonationOpenChange,
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
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeSearchResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<number | null>(null); // Single role
  const [selectedAdditionalActions, setSelectedAdditionalActions] = useState<
    number[]
  >([]); // Additional actions only
  const [isActive, setisActive] = useState(true);
  const [actionSearchQuery, setActionSearchQuery] = useState("");
  const [selectedActionCategory, setSelectedActionCategory] =
    useState<string>("all");

  // Operation loading states
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [isOptionOpen, setIsOptionOpen] = useState(false);

  // Impersonation state
  const [impersonatingUser, setImpersonatingUser] = useState<User | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);

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

  // Helper function to get category from action
  const getActionCategory = (action: Action) => {
    // First try categoryName, then category, then extract from name
    if (action.categoryName) {
      return action.categoryName;
    }
    if ((action as any).category) {
      return (action as any).category;
    }
    // Extract category from action name (e.g., "users.create" -> "Users")
    if (action.name && action.name.includes(".")) {
      const prefix = action.name.split(".")[0];

      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }

    return "Uncategorized";
  };

  // Filter actions based on search and category
  const getFilteredAdditionalActions = () => {
    let filteredActions = getAvailableAdditionalActions();

    // Filter by search query
    if (actionSearchQuery.trim()) {
      const query = actionSearchQuery.toLowerCase();

      filteredActions = filteredActions.filter(
        (action) =>
          action.name?.toLowerCase().includes(query) ||
          (action.description &&
            action.description.toLowerCase().includes(query)) ||
          (action.categoryName &&
            action.categoryName.toLowerCase().includes(query)),
      );
    }

    // Filter by category
    if (selectedActionCategory !== "all") {
      filteredActions = filteredActions.filter(
        (action) => getActionCategory(action) === selectedActionCategory,
      );
    }

    return filteredActions;
  };

  // Get unique categories from available actions
  const getActionCategories = () => {
    const availableActions = getAvailableAdditionalActions();
    const categories = [
      ...new Set(availableActions.map((action) => getActionCategory(action))),
    ];

    return categories.sort();
  };

  // Handle bulk selection for a category
  const handleCategoryBulkSelection = (
    categoryName: string,
    selectAll: boolean,
  ) => {
    const categoryActions = getAvailableAdditionalActions().filter(
      (action) => getActionCategory(action) === categoryName,
    );
    const categoryActionIds = categoryActions.map((action) => action.id);

    if (selectAll) {
      // Add all category actions that aren't already selected
      const newActions = categoryActionIds.filter(
        (id) => !selectedAdditionalActions.includes(id),
      );

      setSelectedAdditionalActions([
        ...selectedAdditionalActions,
        ...newActions,
      ]);
    } else {
      // Remove all category actions
      setSelectedAdditionalActions(
        selectedAdditionalActions.filter(
          (id) => !categoryActionIds.includes(id),
        ),
      );
    }
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
  const getStatusText = (isActive: boolean) => {
    return isActive ? t("users.isActive") : t("common.inactive");
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "success" : "default";
  };

  // Handle user operations
  const handleAddUser = async () => {
    setSelectedUser(null);
    setSelectedEmployee(null);
    setSelectedRole(null);
    setSelectedAdditionalActions([]);
    setisActive(true);
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
    // Use current role data instead of userRole.actions to ensure consistency
    const roleData = roles.find((r) => r.id === userRole?.id);
    const roleDefaultActions = roleData?.actions?.map((a) => a.id) || [];
    const userActions = user.actions?.map((a) => a.id) || [];
    const additionalActions = userActions.filter(
      (actionId) => !roleDefaultActions.includes(actionId),
    );

    setSelectedAdditionalActions(additionalActions);

    setisActive(user.isActive);
    setIsEditing(true);
    onOpen();
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    onDeleteOpen();
  };

  const handleImpersonateUser = (user: User) => {
    setImpersonatingUser(user);
    onImpersonationOpen();
  };

  const handleSaveUser = async () => {
    if (!selectedEmployee || !selectedRole) return;

    try {
      setIsSavingUser(true);

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
        isActive,
        roleIds: [selectedRole], // Single role in array
        actionIds: allUserActions,
      };

      if (isEditing && selectedUser) {
        await updateUser({
          id: selectedUser.id,
          ...userData,
        } as UpdateUserRequest);
        toasts.updateSuccess();
      } else {
        await createUser(userData as CreateUserRequest);
        toasts.createSuccess();
      }

      onOpenChange();
      resetForm();
    } catch (error) {
      // Extract error message from the error object
      let errorMessage: string | undefined;

      // Check if it's an ApiError with detailed error info
      if (error instanceof ApiError && error.data?.error) {
        errorMessage = translateBackendError(error.data.error, t);
      } else if (error instanceof ApiError && error.data?.message) {
        errorMessage = translateBackendError(error.data.message, t);
      } else if (error instanceof Error) {
        errorMessage = translateBackendError(error.message, t);
      }

      if (isEditing) {
        toasts.updateError(errorMessage);
      } else {
        toasts.createError(errorMessage);
      }
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedUser) {
      try {
        setIsDeletingUser(true);
        await deleteUser(selectedUser.id);
        toasts.deleteSuccess();
        onDeleteOpenChange();
        setSelectedUser(null);
      } catch (error) {
        // Extract error message from the error object
        let errorMessage: string | undefined;

        // Check if it's an ApiError with detailed error info
        if (error instanceof ApiError && error.data?.error) {
          errorMessage = translateBackendError(error.data.error, t);
        } else if (error instanceof ApiError && error.data?.message) {
          errorMessage = translateBackendError(error.data.message, t);
        } else if (error instanceof Error) {
          errorMessage = translateBackendError(error.message, t);
        }

        toasts.deleteError(errorMessage);
      } finally {
        setIsDeletingUser(false);
      }
    }
  };

  const resetForm = () => {
    setSelectedUser(null);
    setSelectedEmployee(null);
    setSelectedRole(null);
    setSelectedAdditionalActions([]);
    setisActive(true);
    setActionSearchQuery("");
    setSelectedActionCategory("all");
    clearEmployeeResults(); // Clear any search results
  };

  // Filter handlers
  const handleSearch = (value: string) => {
    // Use the new search field that searches both fullName and militaryNumber
    // Clear all other filters to avoid conflicts
    updateFilters({
      search: value || undefined, // Only set if value is not empty
      fullName: undefined,
      militaryNumber: undefined,
      userName: undefined,
      roleId: filters.roleId, // Keep role filter
      isActive: filters.isActive, // Keep visibility filter
      statusId: filters.statusId, // Keep status filter
    });
  };

  const handleRoleFilter = (roleId: string) => {
    updateFilters({
      ...filters,
      roleId: roleId && roleId !== "all" ? parseInt(roleId) : undefined,
    });
  };

  const handleStatusFilter = (status: string) => {
    updateFilters({
      ...filters,
      isActive: status === "all" ? undefined : status === "active",
    });
  };

  // Reset all filters
  const resetFilters = () => {
    updateFilters({
      search: undefined,
      fullName: undefined,
      militaryNumber: undefined,
      userName: undefined,
      roleId: undefined,
      isActive: undefined,
      statusId: undefined,
    });
  };

  // Check if any filters are active
  const hasActiveFilters =
    filters.search || filters.roleId || filters.isActive !== undefined;

  // Pagination page size options
  const effectivePageSize = normalizePageSize(pagination.limit, 10);

  // Handler for page size change
  const handlePageSizeChange = (newSize: number) => {
    // Always go to first page when page size changes
    loadUsers(1, newSize);
  };

  const handleConfirmImpersonation = async () => {
    if (!impersonatingUser) return;

    try {
      setIsImpersonating(true);
      await startImpersonation(impersonatingUser.userName);
      toasts.createSuccess(t("users.impersonateSuccess"));
      onImpersonationOpenChange();
      setImpersonatingUser(null);
      // Refresh the whole page after impersonation
      setTimeout(() => {
        window.location.href = APP_CONFIG.basename;
      }, 500);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to start impersonation";

      toasts.createError(errorMessage);
    } finally {
      setIsImpersonating(false);
    }
  };

  return (
    <>
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
                className="w-full sm:w-64"
                disallowEmptySelection={false}
                placeholder={t("users.filterByRole")}
                selectedKeys={filters.roleId ? [filters.roleId.toString()] : []}
                onSelectionChange={(keys) => {
                  const keysArray = Array.from(keys);
                  // If no selection (user deselected), reset to "all"
                  const roleId =
                    keysArray.length === 0 ? "all" : (keysArray[0] as string);

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
                className="w-full sm:w-52"
                disallowEmptySelection={false}
                placeholder={t("users.filterByStatus")}
                selectedKeys={
                  filters.isActive === undefined
                    ? []
                    : filters.isActive
                      ? ["active"]
                      : ["inactive"]
                }
                onSelectionChange={(keys) => {
                  const keysArray = Array.from(keys);
                  // If no selection (user deselected), reset to "all"
                  const status =
                    keysArray.length === 0 ? "all" : (keysArray[0] as string);

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
            )}
            {/* Add User Button */}
            {hasPermission({ actions: ["users.create"] }) && (
              <Button
                className="w-full sm:w-auto"
                color="primary"
                startContent={<PlusIcon />}
                onPress={handleAddUser}
              >
                {t("users.addUser")}
              </Button>
            )}
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 -mt-2">
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
                {t("users.usersFound").replace(
                  "{count}",
                  pagination.total.toString(),
                )}
              </span>
            </div>
          )}
        </div>

        {/* Users Table */}
        <Card>
          <CardBody className="p-0">
            {loading ? (
              <div className="space-y-4 p-6">
                {/* Table header skeleton */}
                <div className="grid grid-cols-7 gap-4 pb-4 border-b border-default-200">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                </div>

                {/* Table rows skeleton */}
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-7 gap-4 py-4 border-b border-default-100"
                  >
                    {/* Username with avatar */}
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-24 rounded" />
                    </div>

                    {/* Full name */}
                    <Skeleton className="h-4 w-32 rounded" />

                    {/* Military number */}
                    <Skeleton className="h-4 w-20 rounded" />

                    {/* Grade */}
                    <Skeleton className="h-4 w-16 rounded" />

                    {/* Roles */}
                    <Skeleton className="h-6 w-20 rounded-full" />

                    {/* Status */}
                    <Skeleton className="h-6 w-16 rounded-full" />

                    {/* Actions */}
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col justify-center items-center h-40 text-center space-y-4">
                <div className="text-danger text-lg">{error}</div>
                <Button
                  color="primary"
                  startContent={<SearchIcon size={16} />}
                  variant="flat"
                  onPress={() => loadUsers(pagination.page, pagination.limit)}
                >
                  {t("error.retry")}
                </Button>
              </div>
            ) : users.length === 0 ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center space-y-4">
                  <SearchIcon
                    className="mx-auto text-default-400"
                    height={64}
                    width={64}
                  />
                  <div>
                    <p className="text-lg text-default-600">
                      {hasActiveFilters
                        ? t("users.noUsersFound") ||
                          "No users found matching your search"
                        : t("users.noUsersAvailable") || "No users available"}
                    </p>
                    <p className="text-sm text-default-500">
                      {hasActiveFilters
                        ? t("users.tryDifferentSearch") ||
                          "Try adjusting your search terms or filters."
                        : t("users.createFirstUser") ||
                          "Start by creating your first user."}
                    </p>
                  </div>
                  {!hasActiveFilters &&
                    hasPermission({ actions: ["users.create"] }) && (
                      <Button
                        color="primary"
                        startContent={<PlusIcon />}
                        onPress={onOpen}
                      >
                        {t("users.addUser")}
                      </Button>
                    )}
                </div>
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
                          color={getStatusColor(user.isActive)}
                          size="sm"
                          variant="flat"
                        >
                          {getStatusText(user.isActive)}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        {(hasPermission({
                          actions: ["users.update"],
                        }) ||
                          hasPermission({
                            actions: ["users.delete"],
                          })) && (
                          <Dropdown>
                            <DropdownTrigger>
                              <Button
                                isIconOnly
                                aria-label={t("common.actions")}
                                size="sm"
                                variant="light"
                              >
                                <MoreVerticalIcon className="h-4 w-4" />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                              {hasPermission({
                                actions: ["users.update"],
                              }) ? (
                                <DropdownItem
                                  key="edit"
                                  startContent={
                                    <EditIcon className="h-4 w-4" />
                                  }
                                  textValue={t("users.editUser")}
                                  onPress={() => handleEditUser(user)}
                                >
                                  {t("users.editUser")}
                                </DropdownItem>
                              ) : null}
                              {hasPermission({
                                actions: ["users.update"],
                              }) ? (
                                <DropdownItem
                                  key="impersonate"
                                  startContent={
                                    <UserIcon className="h-4 w-4" />
                                  }
                                  textValue={t("users.impersonate")}
                                  onPress={() => handleImpersonateUser(user)}
                                >
                                  {t("users.impersonate")}
                                </DropdownItem>
                              ) : null}
                              {hasPermission({
                                actions: ["users.delete"],
                              }) ? (
                                <DropdownItem
                                  key="delete"
                                  className="text-danger"
                                  color="danger"
                                  startContent={
                                    <DeleteIcon className="h-4 w-4" />
                                  }
                                  textValue={t("users.deleteUser")}
                                  onPress={() => handleDeleteUser(user)}
                                >
                                  {t("users.deleteUser")}
                                </DropdownItem>
                              ) : null}
                            </DropdownMenu>
                          </Dropdown>
                        )}
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
              showInfo={true}
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
          size="3xl"
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
                            textValue={`${employee.fullName} (${employee.militaryNumber}) - ${employee.gradeName}`}
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
                    </div>{" "}
                    {/* Selected Employee Details */}
                    {selectedEmployee && (
                      <Card>
                        <CardBody>
                          <div className="grid grid-cols-2 gap-4">
                            <div
                              className={
                                language === "ar" ? "text-right" : "text-left"
                              }
                              dir={language === "ar" ? "rtl" : "ltr"}
                            >
                              <p className="text-small text-default-500">
                                {t("users.fullName")}
                              </p>
                              <p className="font-medium">
                                {selectedEmployee.fullName}
                              </p>
                            </div>
                            <div
                              className={
                                language === "ar" ? "text-right" : "text-left"
                              }
                              dir={language === "ar" ? "rtl" : "ltr"}
                            >
                              <p className="text-small text-default-500">
                                {t("users.userName")}
                              </p>
                              <p className="font-medium">
                                {selectedEmployee.userName}
                              </p>
                            </div>
                            <div
                              className={
                                language === "ar" ? "text-right" : "text-left"
                              }
                              dir={language === "ar" ? "rtl" : "ltr"}
                            >
                              <p className="text-small text-default-500">
                                {t("users.militaryNumber")}
                              </p>
                              <p className="font-medium">
                                {selectedEmployee.militaryNumber}
                              </p>
                            </div>
                            <div
                              className={
                                language === "ar" ? "text-right" : "text-left"
                              }
                              dir={language === "ar" ? "rtl" : "ltr"}
                            >
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
                        isSelected={isActive}
                        size="sm"
                        onValueChange={setisActive}
                      >
                        {t("users.isActive")}
                      </Switch>
                    </div>
                    {/* Role Selection (Single Role) */}
                    <div>
                      <Select
                        isRequired
                        aria-label={t("users.assignRoles")}
                        label={t("users.assignRoles")}
                        placeholder={t("roles.selectRole")}
                        scrollShadowProps={{
                          isEnabled: true,
                        }}
                        selectedKeys={
                          selectedRole
                            ? new Set([selectedRole.toString()])
                            : new Set()
                        }
                        onSelectionChange={(keys) => {
                          const selectedKeys = Array.from(keys);
                          const roleId = selectedKeys[0] as string;

                          const newRoleId = roleId ? parseInt(roleId) : null;

                          setSelectedRole(newRoleId);

                          // Reset additional actions when role changes
                          setSelectedAdditionalActions([]);
                        }}
                      >
                        {roles.map((role) => (
                          <SelectItem
                            key={role.id.toString()}
                            textValue={`${role.name} - ${role.actions?.length || 0} ${t("actions.defaultActions")}`}
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
                        <Card className="bg-default-50 border border-default-200">
                          <CardBody className="py-3">
                            {/* Group role default actions by category */}
                            {Object.entries(
                              getRoleDefaultActions().reduce(
                                (acc, action) => {
                                  const category = getActionCategory(action);

                                  if (!acc[category]) {
                                    acc[category] = [];
                                  }

                                  acc[category].push(action);

                                  return acc;
                                },
                                {} as { [categoryName: string]: Action[] },
                              ),
                            ).map(([category, categoryActions]) => (
                              <div key={category} className="mb-3 last:mb-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-medium text-default-700 uppercase tracking-wider">
                                    {category}
                                  </span>
                                  <Chip
                                    color="success"
                                    size="sm"
                                    variant="flat"
                                  >
                                    {categoryActions.length}
                                  </Chip>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {categoryActions.map((action) => (
                                    <Chip
                                      key={action.id}
                                      color="success"
                                      size="sm"
                                      startContent={
                                        <span className="text-success">✓</span>
                                      }
                                      variant="flat"
                                    >
                                      {action.description}
                                    </Chip>
                                  ))}
                                </div>
                              </div>
                            ))}
                            <p className="text-tiny text-default-600 mt-3 pt-2 border-t border-default-200">
                              {t("actions.defaultActionsNote")}
                            </p>
                          </CardBody>
                        </Card>
                      </div>
                    )}
                    {/* Additional Action Selection - Improved UX */}
                    {selectedRole &&
                      getAvailableAdditionalActions().length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-small text-default-500">
                              {t("users.assignAdditionalActions")}
                            </p>
                            <Button
                              color="primary"
                              size="sm"
                              variant="flat"
                              onPress={onActionsModalOpen}
                            >
                              {selectedAdditionalActions.length > 0
                                ? `${selectedAdditionalActions.length} ${t("actions.selected")}`
                                : t("actions.selectActions")}
                            </Button>
                          </div>

                          {/* Selected Actions Display */}
                          {selectedAdditionalActions.length > 0 && (
                            <Card className="bg-default-50 border border-default-200">
                              <CardBody className="py-3">
                                {/* Group additional actions by category */}
                                {Object.entries(
                                  actions
                                    .filter((action) =>
                                      selectedAdditionalActions.includes(
                                        action.id,
                                      ),
                                    )
                                    .reduce(
                                      (acc, action) => {
                                        const category =
                                          getActionCategory(action);

                                        if (!acc[category]) {
                                          acc[category] = [];
                                        }

                                        acc[category].push(action);

                                        return acc;
                                      },
                                      {} as {
                                        [categoryName: string]: Action[];
                                      },
                                    ),
                                ).map(([category, categoryActions]) => (
                                  <div
                                    key={category}
                                    className="mb-3 last:mb-0"
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-xs font-medium text-default-700 uppercase tracking-wider">
                                        {category}
                                      </span>
                                      <Chip
                                        color="success"
                                        size="sm"
                                        variant="flat"
                                      >
                                        {categoryActions.length}
                                      </Chip>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {categoryActions.map((action) => (
                                        <Chip
                                          key={action.id}
                                          color="success"
                                          size="sm"
                                          variant="flat"
                                          onClose={() => {
                                            setSelectedAdditionalActions(
                                              selectedAdditionalActions.filter(
                                                (id) => id !== action.id,
                                              ),
                                            );
                                          }}
                                        >
                                          {action.description}
                                        </Chip>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                                <p className="text-tiny text-default-600 mt-3 pt-2 border-t border-default-200">
                                  {selectedAdditionalActions.length}{" "}
                                  {t("actions.additionalActionsSelected")}
                                </p>
                              </CardBody>
                            </Card>
                          )}

                          {/* No additional actions selected */}
                          {selectedAdditionalActions.length === 0 && (
                            <Card className="bg-default-100 border border-default-200">
                              <CardBody className="py-3 text-center">
                                <p className="text-small text-default-500">
                                  {t("actions.noAdditionalActionsSelected")}
                                </p>
                                <p className="text-tiny text-default-400 mt-1">
                                  {getAvailableAdditionalActions().length}{" "}
                                  {t("actions.totalAvailable")}
                                </p>
                              </CardBody>
                            </Card>
                          )}
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
                    isLoading={isSavingUser}
                    onPress={handleSaveUser}
                  >
                    {isEditing ? t("common.save") : t("users.addUser")}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Actions Selection Modal */}
        <Modal
          isOpen={isActionsModalOpen}
          scrollBehavior="inside"
          size="3xl"
          onOpenChange={onActionsModalOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  <h3>{t("actions.selectAdditionalActions")}</h3>
                  <p className="text-small text-default-500 font-normal">
                    {t("actions.selectAdditionalActionsDescription")}
                  </p>
                </ModalHeader>
                <ModalBody>
                  <div className="space-y-4">
                    {/* Search and Filter Controls */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input
                        className="flex-1"
                        placeholder={t("actions.searchActions")}
                        startContent={
                          <SearchIcon className="text-default-400" size={18} />
                        }
                        value={actionSearchQuery}
                        onChange={(e) => setActionSearchQuery(e.target.value)}
                      />
                      <Select
                        aria-label={t("actions.allCategories")}
                        className="w-full sm:w-48"
                        placeholder={t("actions.allCategories")}
                        selectedKeys={[selectedActionCategory]}
                        onSelectionChange={(keys) => {
                          const category = Array.from(keys)[0] as string;

                          setSelectedActionCategory(category || "all");
                        }}
                      >
                        <SelectItem key="all" textValue={t("common.all")}>
                          {t("common.all")}
                        </SelectItem>
                        {getActionCategories().map((category) => (
                          <SelectItem key={category} textValue={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        color={(() => {
                          const allAvailableIds =
                            getFilteredAdditionalActions().map((a) => a.id);
                          const allSelected =
                            selectedAdditionalActions.length ===
                              allAvailableIds.length &&
                            allAvailableIds.length > 0;

                          return allSelected ? "danger" : "primary";
                        })()}
                        size="sm"
                        variant="flat"
                        onPress={() => {
                          const allAvailableIds =
                            getFilteredAdditionalActions().map((a) => a.id);
                          const allSelected =
                            selectedAdditionalActions.length ===
                              allAvailableIds.length &&
                            allAvailableIds.length > 0;

                          if (allSelected) {
                            // Clear all selections
                            setSelectedAdditionalActions([]);
                          } else {
                            // Select all available actions
                            const newSelections = allAvailableIds.filter(
                              (id) => !selectedAdditionalActions.includes(id),
                            );

                            setSelectedAdditionalActions([
                              ...selectedAdditionalActions,
                              ...newSelections,
                            ]);
                          }
                        }}
                      >
                        {(() => {
                          const allAvailableIds =
                            getFilteredAdditionalActions().map((a) => a.id);
                          const allSelected =
                            selectedAdditionalActions.length ===
                              allAvailableIds.length &&
                            allAvailableIds.length > 0;

                          return allSelected
                            ? t("actions.clearAll")
                            : t("actions.selectAll");
                        })()}
                      </Button>
                    </div>

                    {/* Actions List by Category */}
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {Object.entries(
                        getFilteredAdditionalActions().reduce(
                          (acc, action) => {
                            const category = getActionCategory(action);

                            if (!acc[category]) {
                              acc[category] = [];
                            }
                            acc[category].push(action);

                            return acc;
                          },
                          {} as { [categoryName: string]: Action[] },
                        ),
                      ).map(([category, categoryActions]) => {
                        const selectedInCategory = categoryActions.filter(
                          (action) =>
                            selectedAdditionalActions.includes(action.id),
                        ).length;

                        const allSelected =
                          selectedInCategory === categoryActions.length;
                        const someSelected = selectedInCategory > 0;

                        return (
                          <Card
                            key={category}
                            className="border border-default-200"
                          >
                            <CardBody className="p-4">
                              {/* Category Header */}
                              <div className="flex items-center justify-between mb-4 pb-3 border-b border-default-100">
                                <div className="flex items-center gap-3">
                                  <h4 className="text-medium font-semibold text-foreground">
                                    {category}
                                  </h4>
                                  <Chip
                                    color={someSelected ? "success" : "default"}
                                    size="sm"
                                    variant="flat"
                                  >
                                    {selectedInCategory}/
                                    {categoryActions.length}
                                  </Chip>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    color={allSelected ? "danger" : "primary"}
                                    size="sm"
                                    variant="flat"
                                    onPress={() =>
                                      handleCategoryBulkSelection(
                                        category,
                                        !allSelected,
                                      )
                                    }
                                  >
                                    {allSelected
                                      ? t("actions.deselectAll")
                                      : t("actions.selectAll")}
                                  </Button>
                                </div>
                              </div>

                              {/* Actions Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {categoryActions.map((action) => (
                                  <Card
                                    key={action.id}
                                    isPressable
                                    className={`cursor-pointer transition-all ${
                                      selectedAdditionalActions.includes(
                                        action.id,
                                      )
                                        ? "bg-default-50"
                                        : "bg-default-50 border-default-200 hover:bg-default-100"
                                    }`}
                                    onPress={() => {
                                      if (
                                        selectedAdditionalActions.includes(
                                          action.id,
                                        )
                                      ) {
                                        setSelectedAdditionalActions(
                                          selectedAdditionalActions.filter(
                                            (id) => id !== action.id,
                                          ),
                                        );
                                      } else {
                                        setSelectedAdditionalActions([
                                          ...selectedAdditionalActions,
                                          action.id,
                                        ]);
                                      }
                                    }}
                                  >
                                    <CardBody className="p-3">
                                      <div className="flex items-start gap-3">
                                        <div
                                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                            selectedAdditionalActions.includes(
                                              action.id,
                                            )
                                              ? "bg-success border-success"
                                              : "border-default-300"
                                          }`}
                                        >
                                          {selectedAdditionalActions.includes(
                                            action.id,
                                          ) && (
                                            <span className="text-white text-xs">
                                              ✓
                                            </span>
                                          )}
                                        </div>
                                        <div
                                          className={`flex-1 min-w-0 ${language === "ar" ? "text-right" : ""}`}
                                        >
                                          <p className="font-medium text-small text-foreground">
                                            {action.description}
                                          </p>
                                        </div>
                                      </div>
                                    </CardBody>
                                  </Card>
                                ))}
                              </div>
                            </CardBody>
                          </Card>
                        );
                      })}

                      {getFilteredAdditionalActions().length === 0 && (
                        <Card className="border border-default-200">
                          <CardBody className="p-8 text-center">
                            <p className="text-default-500">
                              {actionSearchQuery.trim() ||
                              selectedActionCategory !== "all"
                                ? t("actions.noActionsFound")
                                : t("actions.noAdditionalActionsAvailable")}
                            </p>
                          </CardBody>
                        </Card>
                      )}
                    </div>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    {t("common.cancel")}
                  </Button>
                  <Button color="primary" onPress={onClose}>
                    {t("actions.confirmSelection")} (
                    {selectedAdditionalActions.length})
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
                  <Button
                    color="danger"
                    isLoading={isDeletingUser}
                    onPress={handleConfirmDelete}
                  >
                    {t("users.deleteUser")}
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
                  {impersonatingUser && (
                    <div className="flex items-center gap-3 p-3 bg-warning-50 rounded-lg">
                      <Avatar
                        name={
                          impersonatingUser.employee?.fullName ||
                          impersonatingUser.userName
                        }
                        size="sm"
                      />
                      <div>
                        <p className="font-semibold">
                          {impersonatingUser.employee?.fullName ||
                            impersonatingUser.userName}
                        </p>
                        <p className="text-small text-default-500">
                          @{impersonatingUser.userName}
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
    </>
  );
}
