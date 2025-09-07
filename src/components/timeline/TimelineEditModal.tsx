import { useState, useEffect } from "react";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Avatar } from "@heroui/avatar";
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
import { Slider } from "@heroui/slider";
import { parseDate } from "@internationalized/date";
import { X } from "lucide-react";

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
  const [formData, setFormData] =
    useState<TimelineEditModalFormData>(initialValues);

  // Add validation errors state
  const [errors, setErrors] = useState<{
    name?: string;
    startDate?: string;
    endDate?: string;
  }>({});

  // Update form data when initial values change
  useEffect(() => {
    setFormData(initialValues);
    setErrors({}); // Clear errors when initial values change
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

  // Validation function
  const validateForm = () => {
    const newErrors: typeof errors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = t("validation.nameRequired");
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t("validation.nameMinLength");
    }

    // Start date validation
    if (!formData.startDate) {
      newErrors.startDate = t("validation.startDateRequired");
    }

    // End date validation
    if (!formData.endDate) {
      newErrors.endDate = t("validation.endDateRequired");
    } else if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (start >= end) {
        newErrors.endDate = t("validation.endDateAfterStart");
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    field: keyof TimelineEditModalFormData,
    value: any,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for the field being changed
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
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
      onClose();
    } catch {
      // TODO: surface error to user via toast if needed
    }
  };

  const handleClose = () => {
    setFormData(initialValues); // Reset form data on close
    setErrors({}); // Clear errors on close
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
  });

  // Handle tasks selection
  const handleTaskSelect = (task: WorkItem) => {
    setSelectedTask(task);
    setTaskInputValue(task.name);
    if (!selectedTasks.some((item) => item.id === task.id)) {
      setSelectedTasks([...selectedTasks, task]);
    }
    // After adding to chips, reset the dropdown input/selection for next pick
    resetTaskDropDown();
  };

  // Handle employee selection
  const handleEmployeeSelect = (employee: MemberSearchResult) => {
    setSelectedEmployee(employee);
    setEmployeeInputValue(`${employee.gradeName} ${employee.fullName}`);
    if (!selectedMembers.some((user) => user.id === employee.id)) {
      setSelectedMembers([...selectedMembers, employee]);
    }
    // After adding to chips, reset the dropdown input/selection for next pick
    resetUserDropDown();
  };

  const resetUserDropDown = () => {
    // Only reset the dropdown input and current selection, keep selected chips
    setEmployeeInputValue("");
    setSelectedEmployee(null);
  };

  const resetTaskDropDown = () => {
    // Only reset the dropdown input and current selection, keep selected chips
    setTaskInputValue("");
    setSelectedTask(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      scrollBehavior="inside"
      size="2xl"
      onClose={handleClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {t("timeline.detailsPanel.edit")} {type?.charAt(0).toUpperCase()}
          {type?.slice(1)}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
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

            <div>
              <label className="block text-sm font-medium mb-2">
                {t("timeline.detailsPanel.description")}
              </label>
              <Textarea
                minRows={3}
                placeholder={t("timeline.detailsPanel.description")}
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            {type !== "timeline" && (
              <div>
                <label className="block text-sm font-medium mb-2">
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
                    <SelectItem key={dept.id.toString()} textValue={dept.name}>
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
            )}

            {(type === "task" ||
              type === "subtask" ||
              type === "requirement") && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("timeline.detailsPanel.status")}
                  </label>
                  <Select
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
                    {statusOptions.map((status) => (
                      <SelectItem
                        key={status.id.toString()}
                        textValue={status.label}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: status.color }}
                          />
                          {status.label}
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("timeline.detailsPanel.priority")}
                  </label>
                  <Select
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
                    {priorityOptions.map((priority) => (
                      <SelectItem
                        key={priority.id.toString()}
                        textValue={priority.label}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: priority.color }}
                          />
                          {priority.label}
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
            )}

            {(type === "requirement" || type === "task") && (
              <div>
                <div style={{ height: "12px" }} />
                {/* Users Drop down */}
                {/* Tags Display */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {selectedTasks.map((task, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        background: "#e0e0e0",
                        padding: "5px 10px",
                        borderRadius: "20px",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <X
                          size={24} // optional size
                          color="red" // optional color
                          style={{ cursor: "pointer" }} // show pointer on hover
                          onClick={() => {
                            setSelectedTasks(
                              selectedTasks.filter(
                                (item) => item.id !== task.id,
                              ),
                            );
                          }}
                        />

                        <div className="flex flex-col">
                          <span className="text-xs">{task.name}</span>

                          <span className="text-xs text-default-400">
                            @{task.description || "unknown"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <label>{t("timeline.selectPredecessors")}</label>
                <Autocomplete
                  label={t("timeline.selectPredecessors")}
                  placeholder={t("timeline.selectPredecessorsPlaceholder")}
                  inputValue={taskInputValue}
                  // Disable client-side filtering; we already filter on the server
                  defaultFilter={(textValue, input) => true}
                  onInputChange={(value) => {
                    setTaskInputValue(value);
                    // Clear selection if input doesn't match the selected owner
                    if (selectedTask && value !== `${selectedTask.name}`) {
                      setSelectedTask(null);
                      // setFormData({ ...formData, projectOwner: 0 });
                    }
                    // Clear validation error when user starts typing

                    // if (validationErrors.projectOwner) {
                    //   setValidationErrors({ ...validationErrors, projectOwner: undefined });
                    // }

                    // Search for "tasks"
                    searchTasks(value);
                  }}
                  selectedKey={selectedTask?.id.toString()}
                  onSelectionChange={(key) => {
                    if (key) {
                      const selectedTask = tasks.find(
                        (e) => e.id.toString() === key,
                      );

                      if (selectedTask) {
                        handleTaskSelect(selectedTask);
                      }
                    } else {
                      // Clear selection
                      setSelectedTask(null);
                      setTaskInputValue("");
                      // setFormData({ ...formData, projectOwner: 0 });
                    }

                    // Clear validation error when user selects
                    // if (validationErrors.projectOwner) {
                    //   setValidationErrors({ ...validationErrors, projectOwner: undefined });
                    // }
                  }}
                  isLoading={taskSearchLoading}
                  isInvalid={false}
                  errorMessage={"test error message"}
                  isClearable
                  menuTrigger="input"
                >
                  {tasks.map((task) => (
                    <AutocompleteItem
                      key={task.id.toString()}
                      // Include multiple fields so built-in filters (if enabled) can still match
                      textValue={`${task.name} ${task.description || ""} ${task.status || ""} ${task.department || ""}`}
                    >
                      <div className="flex items-center gap-3">
                        {/* <Avatar name={task.name} size="sm" /> */}
                        <div className="flex flex-col">
                          <span className="font-medium">{task.name}</span>
                          <span className="text-sm text-default-500">
                            {task.description || "unknown"}
                          </span>
                          <span className="text-xs text-default-400">
                            @{task.duration || "unknown"}
                          </span>
                          <span className="text-xs text-default-400">
                            @{task.status || "unknown"}
                          </span>
                        </div>
                      </div>
                    </AutocompleteItem>
                  ))}
                </Autocomplete>
              </div>
            )}

            {/* search members */}

            {(type === "task" || type === "requirement") && (
              <div>
                <div style={{ height: "12px" }} />
                {/* Users Drop down */}
                {/* Tags Display */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {selectedMembers.map((employee, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        background: "#e0e0e0",
                        padding: "5px 10px",
                        borderRadius: "20px",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <X
                          size={24} // optional size
                          color="red" // optional color
                          style={{ cursor: "pointer" }} // show pointer on hover
                          onClick={() => {
                            setSelectedMembers(
                              selectedMembers.filter(
                                (user) => user.id !== employee.id,
                              ),
                            );
                          }}
                        />

                        <div className="flex flex-col">
                          <span className="text-xs">
                            {employee.gradeName}{" "}
                            {employee.fullName || "Unknown User"}
                          </span>

                          <span className="text-xs text-default-400">
                            @{employee.department || "unknown"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <label>{t("users.selectEmployee")}</label>
                <Autocomplete
                  label={t("users.selectEmployee")}
                  placeholder={t("users.searchEmployees")}
                  inputValue={employeeInputValue}
                  // Disable client-side filtering; we already filter on the server
                  defaultFilter={(textValue, input) => true}
                  onInputChange={(value) => {
                    setEmployeeInputValue(value);
                    // Clear selection if input doesn't match the selected owner
                    if (
                      selectedEmployee &&
                      value !==
                        `${selectedEmployee.gradeName} ${selectedEmployee.fullName}`
                    ) {
                      setSelectedEmployee(null);
                      // setFormData({ ...formData, projectOwner: 0 });
                    }
                    // Clear validation error when user starts typing

                    // if (validationErrors.projectOwner) {
                    //   setValidationErrors({ ...validationErrors, projectOwner: undefined });
                    // }

                    // Search for "employees"
                    searchEmployees(value);
                  }}
                  selectedKey={selectedEmployee?.id.toString()}
                  onSelectionChange={(key) => {
                    if (key) {
                      const selectedEmployee = employees.find(
                        (e) => e.id.toString() === key,
                      );

                      if (selectedEmployee) {
                        handleEmployeeSelect(selectedEmployee);
                      }
                    } else {
                      // Clear selection
                      setSelectedEmployee(null);
                      setEmployeeInputValue("");
                      // setFormData({ ...formData, projectOwner: 0 });
                    }

                    // Clear validation error when user selects
                    // if (validationErrors.projectOwner) {
                    //   setValidationErrors({ ...validationErrors, projectOwner: undefined });
                    // }
                  }}
                  isLoading={employeeSearchLoading}
                  isInvalid={false}
                  errorMessage={"test error message"}
                  isClearable
                  menuTrigger="input"
                >
                  {employees.map((employee) => (
                    <AutocompleteItem
                      key={employee.id.toString()}
                      // Include username, military number, and department to improve matching
                      textValue={`${employee.gradeName} ${employee.fullName} ${employee.userName} ${employee.militaryNumber} ${employee.department}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={employee.fullName || "Unknown"}
                          size="sm"
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {employee.gradeName}{" "}
                            {employee.fullName || "Unknown User"}
                          </span>
                          <span className="text-sm text-default-500">
                            {employee.militaryNumber || "N/A"}
                          </span>
                          <span className="text-xs text-default-400">
                            @{employee.userName || "unknown"}
                          </span>
                          <span className="text-xs text-default-400">
                            @{employee.department || "unknown"}
                          </span>
                        </div>
                      </div>
                    </AutocompleteItem>
                  ))}
                </Autocomplete>
              </div>
            )}
            {(type === "task" ||
              type === "subtask" ||
              type === "requirement") && (
              <div>
                <div className="flex items-center justify-between mb-2">
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
              <label className="block text-sm font-medium mb-2">
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
