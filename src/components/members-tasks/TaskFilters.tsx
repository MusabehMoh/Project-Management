import { useState, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { DateRangePicker } from "@heroui/date-picker";
import { Switch } from "@heroui/switch";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import { Badge } from "@heroui/badge";
import { parseDate } from "@internationalized/date";
import {
  Search,
  Filter,
  X,
  Users,
  Building2,
  Calendar,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

import { TaskSearchParams, TaskFiltersData } from "@/types/membersTasks";
import { MemberSearchResult, Department } from "@/types/timeline";
import { useLanguage } from "@/contexts/LanguageContext";

interface TaskFiltersProps {
  filters: TaskSearchParams;
  filtersData: TaskFiltersData;
  allEmployees: MemberSearchResult[];
  onFiltersChange: (filters: TaskSearchParams) => void;
  onSearchEmployees: (query: string) => void;
  loading?: boolean;
}

export const TaskFilters = ({
  filters,
  filtersData,
  allEmployees,
  onFiltersChange,
  onSearchEmployees,
  loading = false,
}: TaskFiltersProps) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [employeeInputValue, setEmployeeInputValue] = useState("");
  const [selectedEmployee, setSelectedEmployee] =
    useState<MemberSearchResult | null>(null);

  const handleSearchChange = useCallback(
    (value: string) => {
      onFiltersChange({ ...filters, search: value, page: 1 });
    },
    [filters, onFiltersChange],
  );

  const handleMemberAdd = (employee: MemberSearchResult) => {
    const currentMemberIds = filters.memberIds || [];
    if (!currentMemberIds.includes(employee.id)) {
      onFiltersChange({
        ...filters,
        memberIds: [...currentMemberIds, employee.id],
        page: 1,
      });
    }
    setEmployeeInputValue("");
    setSelectedEmployee(null);
  };

  const handleMemberRemove = (memberId: number) => {
    const currentMemberIds = filters.memberIds || [];
    onFiltersChange({
      ...filters,
      memberIds: currentMemberIds.filter((id) => id !== memberId),
      page: 1,
    });
  };

  const handleDepartmentChange = (selectedKeys: any) => {
    const departmentIds = Array.from(selectedKeys) as string[];
    onFiltersChange({ ...filters, departmentIds, page: 1 });
  };

  const handleStatusChange = (selectedKeys: any) => {
    const statusIds = Array.from(selectedKeys).map((id) => Number(id));
    onFiltersChange({ ...filters, statusIds, page: 1 });
  };

  const handlePriorityChange = (selectedKeys: any) => {
    const priorityIds = Array.from(selectedKeys).map((id) => Number(id));
    onFiltersChange({ ...filters, priorityIds, page: 1 });
  };

  const handleDateRangeChange = (range: any) => {
    if (range?.start && range?.end) {
      onFiltersChange({
        ...filters,
        dateRange: {
          start: range.start.toString(),
          end: range.end.toString(),
        },
        page: 1,
      });
    } else {
      const { dateRange, ...filtersWithoutDate } = filters;
      onFiltersChange(filtersWithoutDate);
    }
  };

  const handleOverdueToggle = (isSelected: boolean) => {
    if (isSelected) {
      onFiltersChange({ ...filters, isOverdue: true, page: 1 });
    } else {
      const { isOverdue, ...filtersWithoutOverdue } = filters;
      onFiltersChange(filtersWithoutOverdue);
    }
  };

  const handleFilterModeToggle = (isSelected: boolean) => {
    onFiltersChange({
      ...filters,
      memberFilterMode: isSelected ? "all" : "any",
      page: 1,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      page: 1,
      limit: filters.limit,
      memberFilterMode: "any",
      sortBy: "startDate",
      sortOrder: "asc",
    });
    setEmployeeInputValue("");
    setSelectedEmployee(null);
  };

  const getSelectedMembers = () => {
    const memberIds = filters.memberIds || [];
    return allEmployees.filter((emp) => memberIds.includes(emp.id));
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.memberIds?.length) count++;
    if (filters.departmentIds?.length) count++;
    if (filters.statusIds?.length) count++;
    if (filters.priorityIds?.length) count++;
    if (filters.dateRange) count++;
    if (filters.isOverdue) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();
  const selectedMembers = getSelectedMembers();

  return (
    <Card className="w-full mb-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              {t("search.filters")}
            </h3>
            {activeFiltersCount > 0 && (
              <Badge color="primary" variant="flat">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button
                size="sm"
                variant="flat"
                color="danger"
                startContent={<RotateCcw className="w-4 h-4" />}
                onPress={clearAllFilters}
              >
                {t("clearAllFilters")}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onPress={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Collapse" : "Expand"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardBody className="pt-0">
        {/* Search Input - Always visible */}
        <div className="mb-4">
          <Input
            placeholder={t("search.placeholder")}
            value={filters.search || ""}
            onChange={(e) => handleSearchChange(e.target.value)}
            startContent={<Search className="w-4 h-4 text-foreground-500" />}
            isClearable
            onClear={() => handleSearchChange("")}
          />
        </div>

        {/* Expandable Filters */}
        {isExpanded && (
          <div className="space-y-6">
            {/* Members Filter */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-foreground-600" />
                <span className="text-sm font-medium text-foreground">
                  {t("filterByAssignees")}
                </span>
                <Switch
                  size="sm"
                  isSelected={filters.memberFilterMode === "all"}
                  onValueChange={handleFilterModeToggle}
                >
                  <span className="text-xs text-foreground-600 ml-2">
                    {filters.memberFilterMode === "all"
                      ? t("allAssigneesMode")
                      : t("anyAssigneeMode")}
                  </span>
                </Switch>
              </div>

              <Autocomplete
                placeholder="Search members..."
                inputValue={employeeInputValue}
                selectedKey={selectedEmployee?.id.toString()}
                onInputChange={(value) => {
                  setEmployeeInputValue(value);
                  onSearchEmployees(value);
                }}
                onSelectionChange={(key) => {
                  if (key) {
                    const employee = allEmployees.find(
                      (emp) => emp.id.toString() === key,
                    );
                    if (employee) {
                      handleMemberAdd(employee);
                    }
                  }
                }}
              >
                {allEmployees.map((employee) => (
                  <AutocompleteItem
                    key={employee.id.toString()}
                    startContent={<Avatar size="sm" name={employee.fullName} />}
                  >
                    {employee.gradeName} {employee.fullName}
                  </AutocompleteItem>
                ))}
              </Autocomplete>

              {/* Selected Members */}
              {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedMembers.map((member) => (
                    <Chip
                      key={member.id}
                      onClose={() => handleMemberRemove(member.id)}
                      startContent={<Avatar size="sm" name={member.fullName} />}
                    >
                      {member.gradeName} {member.fullName}
                    </Chip>
                  ))}
                </div>
              )}
            </div>

            {/* Department Filter */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-foreground-600" />
                <span className="text-sm font-medium text-foreground">
                  {t("filterByDepartment")}
                </span>
              </div>
              <Select
                placeholder={t("selectDepartment")}
                selectionMode="multiple"
                selectedKeys={new Set(filters.departmentIds || [])}
                onSelectionChange={handleDepartmentChange}
              >
                {filtersData.departments.map((dept) => (
                  <SelectItem key={dept.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: dept.color }}
                      />
                      {dept.name}
                    </div>
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-foreground">
                  {t("filterByStatus")}
                </span>
              </div>
              <Select
                placeholder={t("selectStatus")}
                selectionMode="multiple"
                selectedKeys={
                  new Set(filters.statusIds?.map((id) => id.toString()) || [])
                }
                onSelectionChange={handleStatusChange}
              >
                {filtersData.statuses.map((status) => (
                  <SelectItem key={status.id.toString()}>
                    <Chip color={status.color as any} size="sm" variant="flat">
                      {status.label}
                    </Chip>
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Priority Filter */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-foreground">
                  {t("filterByPriority")}
                </span>
              </div>
              <Select
                placeholder={t("selectPriority")}
                selectionMode="multiple"
                selectedKeys={
                  new Set(filters.priorityIds?.map((id) => id.toString()) || [])
                }
                onSelectionChange={handlePriorityChange}
              >
                {filtersData.priorities.map((priority) => (
                  <SelectItem key={priority.id.toString()}>
                    <Chip
                      color={priority.color as any}
                      size="sm"
                      variant="solid"
                    >
                      {priority.label}
                    </Chip>
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Date Range Filter */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-foreground-600" />
                <span className="text-sm font-medium text-foreground">
                  {t("filterByDateRange")}
                </span>
              </div>
              <DateRangePicker
                label="Task date range"
                value={
                  filters.dateRange
                    ? {
                        start: parseDate(filters.dateRange.start),
                        end: parseDate(filters.dateRange.end),
                      }
                    : null
                }
                onChange={handleDateRangeChange}
              />
            </div>

            {/* Overdue Toggle */}
            <div>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-danger" />
                <Switch
                  isSelected={filters.isOverdue || false}
                  onValueChange={handleOverdueToggle}
                >
                  <span className="text-sm font-medium text-foreground ml-2">
                    {t("showOverdueOnly")}
                  </span>
                </Switch>
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};
