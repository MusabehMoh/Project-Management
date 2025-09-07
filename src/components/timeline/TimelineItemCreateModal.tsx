import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { DatePicker } from "@heroui/date-picker";
import { Select, SelectItem } from "@heroui/select";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Avatar } from "@heroui/avatar";
import { Slider } from "@heroui/slider";

import { useLanguage } from "@/contexts/LanguageContext";
import { Department, MemberSearchResult, WorkItem } from "@/types/timeline";
import useTeamSearch from "@/hooks/useTeamSearch";
import useTaskSearch from "@/hooks/useTaskSearch";

export interface TimelineItemCreateModalFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  departmentId: string;
  statusId: number;
  priorityId: number;
  progress: number;
  notes: string;
  // Optional selections on create
  members?: MemberSearchResult[];
  depTasks?: WorkItem[];
  memberIds?: number[];
  depTaskIds?: (string | number)[];
}

interface TimelineItemCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TimelineItemCreateModalFormData) => Promise<void>;
  type: "sprint" | "requirement" | "task" | "subtask";
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
  parentName?: string;
}

export default function TimelineItemCreateModal({
  isOpen,
  onClose,
  onSubmit,
  type,
  departments,
  statusOptions,
  priorityOptions,
  getProgressColor,
  loading = false,
  parentName,
}: TimelineItemCreateModalProps) {
  const { t } = useLanguage();

  // Local form state uses DatePicker values for dates; we'll convert to strings on submit
  type LocalFormData = Omit<
    TimelineItemCreateModalFormData,
    "startDate" | "endDate"
  > & {
    startDate: any | null;
    endDate: any | null;
  };

  const getInitialFormData = (): LocalFormData => ({
    name: "",
    description: "",
    startDate: null,
    endDate: null,
    departmentId: "",
    statusId: 1, // Default status
    priorityId: 2, // Default priority
    progress: 0,
    notes: "",
  });

  const [formData, setFormData] = useState<LocalFormData>(getInitialFormData());

  // Members/Tasks selection state
  const [employeeInputValue, setEmployeeInputValue] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] =
    useState<MemberSearchResult | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<MemberSearchResult[]>(
    [],
  );
  const [taskInputValue, setTaskInputValue] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<WorkItem | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<WorkItem[]>([]);

  // Search hooks
  const {
    employees,
    loading: employeeSearchLoading,
    searchEmployees,
  } = useTeamSearch({ minLength: 1, maxResults: 20 });
  const {
    workItems: tasks,
    loading: taskSearchLoading,
    searchTasks,
  } = useTaskSearch({ minLength: 1, maxResults: 20 });

  // Add validation errors state
  const [errors, setErrors] = useState<{
    name?: string;
    startDate?: string;
    endDate?: string;
  }>({});

  // Reset form data when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
      setErrors({}); // Clear errors when modal opens
  // Reset selections
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
      const start = new Date(formData.startDate.toString());
      const end = new Date(formData.endDate.toString());

      if (start >= end) {
        newErrors.endDate = t("validation.endDateAfterStart");
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof LocalFormData, value: any) => {
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
      const payload: TimelineItemCreateModalFormData = {
        name: formData.name,
        description: formData.description,
        startDate: formData.startDate!.toString(),
        endDate: formData.endDate!.toString(),
        departmentId: formData.departmentId,
        statusId: formData.statusId,
        priorityId: formData.priorityId,
        progress: formData.progress,
        notes: formData.notes,
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
    setFormData(getInitialFormData()); // Reset form data on close
    setErrors({}); // Clear errors on close
    setSelectedMembers([]);
    setSelectedTasks([]);
    setSelectedEmployee(null);
    setSelectedTask(null);
    setEmployeeInputValue("");
    setTaskInputValue("");
    onClose();
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
          {t("timeline.treeView.create")} {type?.charAt(0).toUpperCase()}
          {type?.slice(1)}
          {parentName && (
            <span className="text-sm text-default-500">in {parentName}</span>
          )}
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
                placeholder={`Enter ${type} name`}
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
                placeholder={`Enter ${type} description`}
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
                value={formData.startDate}
                onChange={(date) => handleInputChange("startDate", date)}
              />

              <DatePicker
                isRequired
                errorMessage={errors.endDate}
                isInvalid={!!errors.endDate}
                label={t("timeline.detailsPanel.endDate")}
                value={formData.endDate}
                onChange={(date) => handleInputChange("endDate", date)}
              />
            </div>

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

            {(type === "task" ||
              type === "subtask" ||
              type === "requirement") && (
              <div className="space-y-4">
                {/* Dependent Tasks selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("timeline.selectPredecessors")}
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-2 rounded-full bg-default-200 px-3 py-1 text-xs"
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

                      const found = tasks.find((t) => t.id.toString() === key);

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
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="font-medium">{task.name}</span>
                            <span className="text-xs text-default-500">
                              {task.description || "unknown"}
                            </span>
                          </div>
                        </div>
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>
                </div>

                {/* Members selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("users.selectEmployee")}
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedMembers.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-2 rounded-full bg-default-200 px-3 py-1 text-xs"
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
                            <span className="text-xs text-default-500">
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
            {t("timeline.treeView.create")} {type?.charAt(0).toUpperCase()}
            {type?.slice(1)}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
