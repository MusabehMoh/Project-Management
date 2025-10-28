import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { CheckboxGroup, Checkbox } from "@heroui/checkbox";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Avatar } from "@heroui/avatar";
import { useState, useEffect } from "react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useTeamSearch } from "@/hooks/useTeamSearch";
import {
  TimelineFilters as ITimelineFilters,
  Department,
  TaskStatus,
  TaskPriority,
  MemberSearchResult,
} from "@/types/timeline";

interface TimelineFiltersProps {
  filters: ITimelineFilters;
  departments: Department[];
  onFiltersChange: (filters: Partial<ITimelineFilters>) => void;
  onClearFilters: () => void;
}

export default function TimelineFilters({
  filters,
  departments,
  onFiltersChange,
  onClearFilters,
}: TimelineFiltersProps) {
  const { t } = useLanguage();

  // Employee search for member filtering
  const [employeeInputValue, setEmployeeInputValue] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] =
    useState<MemberSearchResult | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<MemberSearchResult[]>(
    [],
  );
  const {
    employees,
    loading: employeeSearchLoading,
    searchEmployees,
  } = useTeamSearch({
    minLength: 1,
    maxResults: 20,
  });

  // Effect to sync selectedMembers with filters.members when filters change externally
  useEffect(() => {
    if (filters.members.length === 0) {
      setSelectedMembers([]);
    }
  }, [filters.members]);

  // Clear selected members when filters are cleared
  useEffect(() => {
    const isEmpty =
      filters.departments.length === 0 &&
      filters.members.length === 0 &&
      filters.status.length === 0 &&
      filters.priority.length === 0;

    if (isEmpty) {
      setSelectedMembers([]);
      setEmployeeInputValue("");
      setSelectedEmployee(null);
    }
  }, [filters]);

  const statusOptions: { key: TaskStatus; label: string; color: any }[] = [
    {
      key: "not-started",
      label: t("timeline.filters.notStarted"),
      color: "default",
    },
    {
      key: "in-progress",
      label: t("timeline.filters.inProgress"),
      color: "primary",
    },
    {
      key: "completed",
      label: t("timeline.filters.completed"),
      color: "success",
    },
    { key: "on-hold", label: t("timeline.filters.onHold"), color: "warning" },
    {
      key: "cancelled",
      label: t("timeline.filters.cancelled"),
      color: "danger",
    },
  ];

  const priorityOptions: { key: TaskPriority; label: string; color: any }[] = [
    { key: "low", label: t("timeline.filters.low"), color: "default" },
    { key: "medium", label: t("timeline.filters.medium"), color: "primary" },
    { key: "high", label: t("timeline.filters.high"), color: "warning" },
    { key: "critical", label: t("timeline.filters.critical"), color: "danger" },
  ];

  const handleDepartmentChange = (selectedDepts: string[]) => {
    onFiltersChange({ departments: selectedDepts });
  };

  const handleAddMember = (member: MemberSearchResult) => {
    if (!selectedMembers.some((m) => m.id === member.id)) {
      const newMembers = [...selectedMembers, member];

      setSelectedMembers(newMembers);

      const memberIds = newMembers.map((m) => m.id.toString());

      onFiltersChange({ members: memberIds });
    }
  };

  const handleRemoveMember = (memberId: string) => {
    const newSelectedMembers = selectedMembers.filter(
      (m) => m.id.toString() !== memberId,
    );

    setSelectedMembers(newSelectedMembers);
    const newMemberIds = newSelectedMembers.map((m) => m.id.toString());

    onFiltersChange({ members: newMemberIds });
  };

  const handleStatusChange = (selectedStatus: string[]) => {
    onFiltersChange({ status: selectedStatus as TaskStatus[] });
  };

  const handlePriorityChange = (selectedPriorities: string[]) => {
    onFiltersChange({ priority: selectedPriorities as TaskPriority[] });
  };

  const hasActiveFilters =
    filters.departments.length > 0 ||
    selectedMembers.length > 0 ||
    filters.status.length > 0 ||
    filters.priority.length > 0;

  return (
    <div className="space-y-6">
      {/* Member Search */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {t("timeline.filters.assignedUsers")}
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-2 rounded-full bg-success-100 px-3 py-1 text-xs"
            >
              <span>
                {member.gradeName} {member.fullName}
              </span>
              <button
                className="text-danger"
                onClick={() => handleRemoveMember(member.id.toString())}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <Autocomplete
          isClearable
          defaultFilter={() => true}
          inputValue={employeeInputValue}
          isLoading={employeeSearchLoading}
          label={t("timeline.filters.searchUsers")}
          menuTrigger="input"
          placeholder={t("users.searchEmployees")}
          selectedKey={selectedEmployee?.id?.toString()}
          onInputChange={(value) => {
            setEmployeeInputValue(value);
            if (
              selectedEmployee &&
              value !==
                `${selectedEmployee.gradeName} ${selectedEmployee.fullName}`
            ) {
              setSelectedEmployee(null);
            }
            searchEmployees(value);
          }}
          onSelectionChange={(key) => {
            if (!key) {
              setSelectedEmployee(null);
              setEmployeeInputValue("");

              return;
            }
            const found = employees.find((e) => e.id.toString() === key);

            if (found) {
              handleAddMember(found);
              // Reset for next pick
              setSelectedEmployee(null);
              setEmployeeInputValue("");
            }
          }}
        >
          {employees.map((employee) => (
            <AutocompleteItem
              key={employee.id.toString()}
              textValue={`${employee.gradeName} ${employee.fullName} ${employee.userName} ${employee.militaryNumber} ${employee.department}`}
            >
              <span className="flex items-center gap-3">
                <Avatar
                  name={employee.fullName || t("common.none")}
                  size="sm"
                />
                <span className="flex flex-col">
                  <span className="font-medium">
                    {employee.gradeName} {employee.fullName || t("common.none")}
                  </span>
                  <span className="text-xs text-default-500">
                    {employee.militaryNumber || "N/A"}
                  </span>
                  <span className="text-xs text-default-400">
                    @{employee.userName || t("common.none")}
                  </span>
                  <span className="text-xs text-default-400">
                    {employee.department || t("common.none")}
                  </span>
                </span>
              </span>
            </AutocompleteItem>
          ))}
        </Autocomplete>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-default-700">
              {t("timeline.filters.activeFilters")}
            </p>
            <Button
              color="danger"
              size="sm"
              variant="light"
              onPress={onClearFilters}
            >
              {t("timeline.filters.clearAll")}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.departments.map((dept) => (
              <Chip
                key={dept}
                color="primary"
                size="sm"
                variant="flat"
                onClose={() =>
                  handleDepartmentChange(
                    filters.departments.filter((d) => d !== dept),
                  )
                }
              >
                {t("timeline.filters.dept")}:{" "}
                {departments.find((d) => d.id === dept)?.name || dept}
              </Chip>
            ))}
            {selectedMembers.map((member) => (
              <Chip
                key={member.id.toString()}
                color="success"
                size="sm"
                variant="flat"
                onClose={() => handleRemoveMember(member.id.toString())}
              >
                {t("timeline.filters.member")}: {member.fullName}
              </Chip>
            ))}
            {filters.status.map((status) => (
              <Chip
                key={status}
                color={
                  statusOptions.find((s) => s.key === status)?.color ||
                  "default"
                }
                size="sm"
                variant="flat"
                onClose={() =>
                  handleStatusChange(filters.status.filter((s) => s !== status))
                }
              >
                {t("timeline.filters.status")}:{" "}
                {statusOptions.find((s) => s.key === status)?.label || status}
              </Chip>
            ))}
            {filters.priority.map((priority) => (
              <Chip
                key={priority}
                color={
                  priorityOptions.find((p) => p.key === priority)?.color ||
                  "default"
                }
                size="sm"
                variant="flat"
                onClose={() =>
                  handlePriorityChange(
                    filters.priority.filter((p) => p !== priority),
                  )
                }
              >
                {t("timeline.filters.priority")}:{" "}
                {priorityOptions.find((p) => p.key === priority)?.label ||
                  priority}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Departments */}
        <div>
          <p className="text-sm font-medium text-default-700 mb-3">
            {t("timeline.filters.departments")}
          </p>
          <CheckboxGroup
            className="gap-2"
            value={filters.departments}
            onValueChange={handleDepartmentChange}
          >
            {departments.map((dept) => (
              <Checkbox
                key={dept.id}
                classNames={{
                  label: "text-sm",
                }}
                value={dept.id.toString()}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: dept.color }}
                  />
                  <span>{dept.name}</span>
                  {dept.description && (
                    <span className="text-xs text-default-500">
                      ({dept.description})
                    </span>
                  )}
                </div>
              </Checkbox>
            ))}
          </CheckboxGroup>
        </div>

        {/* Status */}
        <div>
          <p className="text-sm font-medium text-default-700 mb-3">
            {t("timeline.filters.taskStatus")}
          </p>
          <CheckboxGroup
            className="gap-2"
            value={filters.status}
            onValueChange={handleStatusChange}
          >
            {statusOptions.map((status) => (
              <Checkbox
                key={status.key}
                classNames={{
                  label: "text-sm",
                }}
                value={status.key}
              >
                <div className="flex items-center gap-2">
                  <Chip
                    className="min-w-0"
                    color={status.color}
                    size="sm"
                    variant="flat"
                  >
                    {status.label}
                  </Chip>
                </div>
              </Checkbox>
            ))}
          </CheckboxGroup>
        </div>

        {/* Priority */}
        <div>
          <p className="text-sm font-medium text-default-700 mb-3">
            {t("timeline.filters.taskPriority")}
          </p>
          <CheckboxGroup
            className="gap-2"
            value={filters.priority}
            onValueChange={handlePriorityChange}
          >
            {priorityOptions.map((priority) => (
              <Checkbox
                key={priority.key}
                classNames={{
                  label: "text-sm",
                }}
                value={priority.key}
              >
                <div className="flex items-center gap-2">
                  <Chip
                    className="min-w-0"
                    color={priority.color}
                    size="sm"
                    variant="flat"
                  >
                    {priority.label}
                  </Chip>
                </div>
              </Checkbox>
            ))}
          </CheckboxGroup>
        </div>
      </div>
    </div>
  );
}
