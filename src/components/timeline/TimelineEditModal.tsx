import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { DatePicker } from "@heroui/date-picker";
import { Input, Textarea } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Avatar } from "@heroui/avatar";
import { Slider } from "@heroui/slider";
import { parseDate } from "@internationalized/date";

import { useTimelineFormValidation } from "@/hooks/useTimelineFormValidation";
import { useTimelineToasts } from "@/hooks/useTimelineToasts";
import { useLanguage } from "@/contexts/LanguageContext";
import { Department, MemberSearchResult, WorkItem } from "@/types/timeline";
import useTeamSearch from "@/hooks/useTeamSearch";
import useTaskSearch from "@/hooks/useTaskSearch";

export interface TimelineEditModalFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  departmentId: string;
  statusId: number;
  priorityId: number;
  progress: number;
  notes: string;
  // Optional: include selected members and dependent tasks in payload
  members?: MemberSearchResult[];
  depTasks?: WorkItem[];
  // Convenience: IDs arrays for API payloads that expect IDs
  memberIds?: number[];
  depTaskIds?: (string | number)[];
}

interface TimelineEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TimelineEditModalFormData) => Promise<void>;
  type: "timeline" | "sprint" | "requirement" | "task" | "subtask";
  initialValues: TimelineEditModalFormData;
  departments: Department[];
  statusOptions: Array<{ id: number; label: string; color: string }>;
  priorityOptions: Array<{ id: number; label: string; color: string }>;
  getProgressColor: (
    progress: number,
  ) =>
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "foreground";
  loading?: boolean;
  timelineId?: number;
}

export default function TimelineEditModal({
  isOpen,
  onClose,
  onSubmit,
  type,
  initialValues,
  departments,
  statusOptions,
  priorityOptions,
  getProgressColor,
  loading = false,
  timelineId,
}: TimelineEditModalProps) {
  const [employeeInputValue, setEmployeeInputValue] = useState<string>("");
  // State for selected members
  const [selectedEmployee, setSelectedEmployee] =
    useState<MemberSearchResult | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<MemberSearchResult[]>(
    [],
  );

  const [selectedTasks, setSelectedTasks] = useState<WorkItem[]>([]);
  const [taskInputValue, setTaskInputValue] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<WorkItem | null>(null);
  const { t } = useLanguage();
  const toasts = useTimelineToasts();
  const [formData, setFormData] =
    useState<TimelineEditModalFormData>(initialValues);

  // Use shared validation hook
  const { validateForm, errors, clearError } = useTimelineFormValidation();

  // Update form data when initial values change
  useEffect(() => {
    setFormData(initialValues);
    // Sync chips from initial values (default to empty if undefined)
    setSelectedMembers(initialValues?.members ?? []);
    setSelectedTasks((initialValues?.depTasks as any) ?? []);
  }, [initialValues]);

  // Clear selections when modal closes to avoid stale state on next open
  useEffect(() => {
    if (!isOpen) {
      setSelectedMembers([]);
      setSelectedTasks([]);
      setSelectedEmployee(null);
      setSelectedTask(null);
      setEmployeeInputValue("");
      setTaskInputValue("");
    }
  }, [isOpen]);

  const handleInputChange = (
    field: keyof TimelineEditModalFormData,
    value: any,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for the field being changed
    if (errors[field as keyof typeof errors]) {
      clearError(field as keyof typeof errors);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm(formData)) {
      return; // Don't submit if validation fails
    }

    try {
      // Merge selected members and tasks into payload
      const payload: TimelineEditModalFormData = {
        ...formData,
        members: selectedMembers,
        depTasks: selectedTasks,
        memberIds: selectedMembers.map((m) => m.id),
        depTaskIds: selectedTasks.map((t) => t.id),
      };

      await onSubmit(payload);
      
      // Don't show toasts here - let the parent component handle them
      // to avoid duplicate toasts
      onClose();
    } catch {
      // Show error toast only for form/validation errors
      // API errors should be handled by the parent component
      toasts.onUpdateError();
    }
  };

  const handleClose = () => {
    setFormData(initialValues); // Reset form data on close
    // Also clear chips and inputs
    setSelectedMembers([]);
    setSelectedTasks([]);
    setSelectedEmployee(null);
    setSelectedTask(null);
    setEmployeeInputValue("");
    setTaskInputValue("");
    onClose();
  };
  // Employee search hooks for employees
  const {
    employees: employees,
    loading: employeeSearchLoading,
    searchEmployees: searchEmployees,
  } = useTeamSearch({
    minLength: 1,
    maxResults: 20,
    loadInitialResults: false,
  });

  const {
    workItems: tasks,
    loading: taskSearchLoading,
    searchTasks: searchTasks,
  } = useTaskSearch({
    minLength: 1,
    maxResults: 20,
    loadInitialResults: false,
    timelineId,
  });

  return (
    <Modal
      isOpen={isOpen}
      scrollBehavior="inside"
      size="5xl"
      onClose={handleClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {t("timeline.detailsPanel.edit")} {type?.charAt(0).toUpperCase()}
          {type?.slice(1)}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-3">
            {/* Main Info Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("timeline.treeView.name")}
                </label>
                <Input
                  errorMessage={errors.name}
                  isInvalid={!!errors.name}
                  placeholder={t("timeline.treeView.name")}
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>
              {type !== "timeline" && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t("timeline.detailsPanel.department")}
                  </label>
                  <Select
                    placeholder={t("timeline.detailsPanel.selectDepartment")}
                    selectedKeys={
                      formData.departmentId ? [formData.departmentId] : []
                    }
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;

                      handleInputChange("departmentId", selected || "");
                    }}
                  >
                    {departments.map((dept) => (
                      <SelectItem
                        key={dept.id.toString()}
                        textValue={dept.name}
                      >
                        {dept.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              )}
            </div>

            {/* Dates and Status Section */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <DatePicker
                isRequired
                errorMessage={errors.startDate}
                isInvalid={!!errors.startDate}
                label={t("timeline.detailsPanel.startDate")}
                value={
                  formData.startDate
                    ? parseDate(formData.startDate.substring(0, 10))
                    : null
                }
                onChange={(date) =>
                  handleInputChange("startDate", date ? date.toString() : "")
                }
              />
              <DatePicker
                isRequired
                errorMessage={errors.endDate}
                isInvalid={!!errors.endDate}
                label={t("timeline.detailsPanel.endDate")}
                value={
                  formData.endDate
                    ? parseDate(formData.endDate.substring(0, 10))
                    : null
                }
                onChange={(date) =>
                  handleInputChange("endDate", date ? date.toString() : "")
                }
              />
              {(type === "task" ||
                type === "subtask" ||
                type === "requirement") && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("timeline.detailsPanel.status")}
                    </label>
                    <Select
                      items={statusOptions.map((s) => ({
                        value: s.id.toString(),
                        label: s.label,
                        color: s.color,
                      }))}
                      placeholder={t("timeline.detailsPanel.selectStatus")}
                      selectedKeys={
                        formData.statusId ? [formData.statusId.toString()] : []
                      }
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;

                        handleInputChange(
                          "statusId",
                          selected ? parseInt(selected) : 1,
                        );
                      }}
                    >
                      {(item) => (
                        <SelectItem key={item.value} textValue={item.label}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            {item.label}
                          </div>
                        </SelectItem>
                      )}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("timeline.detailsPanel.priority")}
                    </label>
                    <Select
                      items={priorityOptions.map((p) => ({
                        value: p.id.toString(),
                        label: p.label,
                        color: p.color,
                      }))}
                      placeholder={t("timeline.detailsPanel.selectPriority")}
                      selectedKeys={
                        formData.priorityId
                          ? [formData.priorityId.toString()]
                          : []
                      }
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;

                        handleInputChange(
                          "priorityId",
                          selected ? parseInt(selected) : 2,
                        );
                      }}
                    >
                      {(item) => (
                        <SelectItem key={item.value} textValue={item.label}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            {item.label}
                          </div>
                        </SelectItem>
                      )}
                    </Select>
                  </div>
                </>
              )}
            </div>

            {/* Description Section */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("timeline.detailsPanel.description")}
              </label>
              <Textarea
                minRows={2}
                placeholder={t("timeline.detailsPanel.description")}
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
              />
            </div>

            {(type === "task" ||
              type === "subtask" ||
              type === "requirement") && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Dependent Tasks selection */}
                {(type === "requirement" || type === "task") && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("timeline.selectPredecessors")}
                    </label>
                    <div className="flex flex-wrap gap-1 mb-2 min-h-[24px]">
                      {selectedTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-2 rounded-full bg-default-200 px-2 py-1 text-xs"
                        >
                          <span>{task.name}</span>
                          <button
                            className="text-danger"
                            onClick={() =>
                              setSelectedTasks((prev) =>
                                prev.filter((t) => t.id !== task.id),
                              )
                            }
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <Autocomplete
                      isClearable
                      defaultFilter={() => true}
                      inputValue={taskInputValue}
                      isLoading={taskSearchLoading}
                      label={t("timeline.selectPredecessors")}
                      menuTrigger="input"
                      placeholder={t("timeline.selectPredecessorsPlaceholder")}
                      selectedKey={selectedTask?.id?.toString()}
                      size="sm"
                      onInputChange={(value) => {
                        setTaskInputValue(value);
                        if (selectedTask && value !== `${selectedTask.name}`) {
                          setSelectedTask(null);
                        }
                        searchTasks(value);
                      }}
                      onSelectionChange={(key) => {
                        if (!key) {
                          setSelectedTask(null);
                          setTaskInputValue("");

                          return;
                        }

                        const found = tasks.find(
                          (t) => t.id.toString() === key,
                        );

                        if (found) {
                          setSelectedTasks((prev) =>
                            prev.some((t) => t.id === found.id)
                              ? prev
                              : [...prev, found],
                          );
                          // reset for next pick
                          setSelectedTask(null);
                          setTaskInputValue("");
                        }
                      }}
                    >
                      {tasks.map((task) => (
                        <AutocompleteItem
                          key={task.id.toString()}
                          textValue={`${task.name} ${task.description || ""} ${
                            task.status || ""
                          } ${task.department || ""}`}
                        >
                          <span className="flex items-center gap-3">
                            <span className="flex flex-col">
                              <span className="font-medium">{task.name}</span>
                              <span className="text-xs text-default-500">
                                {task.description || "unknown"}
                              </span>
                            </span>
                          </span>
                        </AutocompleteItem>
                      ))}
                    </Autocomplete>
                  </div>
                )}

                {/* Members selection */}
                {(type === "task" || type === "requirement") && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("users.selectEmployee")}
                    </label>
                    <div className="flex flex-wrap gap-1 mb-2 min-h-[24px]">
                      {selectedMembers.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center gap-2 rounded-full bg-default-200 px-2 py-1 text-xs"
                        >
                          <span>
                            {m.gradeName} {m.fullName}
                          </span>
                          <button
                            className="text-danger"
                            onClick={() =>
                              setSelectedMembers((prev) =>
                                prev.filter((x) => x.id !== m.id),
                              )
                            }
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
                      label={t("users.selectEmployee")}
                      menuTrigger="input"
                      placeholder={t("users.searchEmployees")}
                      selectedKey={selectedEmployee?.id?.toString()}
                      size="sm"
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

                        const found = employees.find(
                          (e) => e.id.toString() === key,
                        );

                        if (found) {
                          setSelectedMembers((prev) =>
                            prev.some((x) => x.id === found.id)
                              ? prev
                              : [...prev, found],
                          );
                          // reset for next pick
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
                              name={employee.fullName || "Unknown"}
                              size="sm"
                            />
                            <span className="flex flex-col">
                              <span className="font-medium">
                                {employee.gradeName}{" "}
                                {employee.fullName || "Unknown User"}
                              </span>
                              <span className="text-xs text-default-500">
                                {employee.militaryNumber || "N/A"}
                              </span>
                              <span className="text-xs text-default-400">
                                @{employee.userName || "unknown"}
                              </span>
                              <span className="text-xs text-default-400">
                                @{employee.department || "unknown"}
                              </span>
                            </span>
                          </span>
                        </AutocompleteItem>
                      ))}
                    </Autocomplete>
                  </div>
                )}
              </div>
            )}

            {/* Progress and Notes Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {(type === "task" ||
                type === "subtask" ||
                type === "requirement") && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium" dir="auto">
                      {t("timeline.detailsPanel.progress")}
                    </label>
                    <span className="text-sm font-medium" dir="ltr">
                      {formData.progress}%
                    </span>
                  </div>
                  <div className="max-w-md" dir="ltr">
                    <Slider
                      color={getProgressColor(formData.progress)}
                      getValue={(value) => `${value}%`}
                      marks={[
                        { value: 0, label: "0%" },
                        { value: 25, label: "25%" },
                        { value: 50, label: "50%" },
                        { value: 75, label: "75%" },
                        { value: 100, label: "100%" },
                      ]}
                      maxValue={100}
                      minValue={0}
                      showTooltip={true}
                      size="md"
                      step={5}
                      value={formData.progress}
                      onChange={(value) =>
                        handleInputChange(
                          "progress",
                          Array.isArray(value) ? value[0] : value,
                        )
                      }
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("timeline.treeView.notes")}
                </label>
                <Textarea
                  minRows={2}
                  placeholder={t("timeline.detailsPanel.additionalNotes")}
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                />
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose}>
            {t("timeline.detailsPanel.cancel")}
          </Button>
          <Button color="primary" isLoading={loading} onPress={handleSubmit}>
            {t("timeline.detailsPanel.saveChanges")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
