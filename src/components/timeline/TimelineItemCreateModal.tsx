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

import { useLanguage } from "@/contexts/LanguageContext";
import { Department, MemberSearchResult, WorkItem } from "@/types/timeline";
import useTeamSearch from "@/hooks/useTeamSearch";
import useTaskSearch from "@/hooks/useTaskSearch";
import { useTimelineFormHelpers } from "@/hooks/useTimelineFormHelpers";
import { useTimelineFormValidation } from "@/hooks/useTimelineFormValidation";

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
  depTaskIds?: number[];
  // TypeId is automatically set to TaskTypes.TimeLine (1) on the backend
  typeId?: number;
}

interface TimelineItemCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TimelineItemCreateModalFormData) => Promise<void>;
  type: "sprint" | "requirement" | "task" | "subtask";
  departments: Department[];
  loading?: boolean;
  parentName?: string;
  timelineId?: number;
}

export default function TimelineItemCreateModal({
  isOpen,
  onClose,
  onSubmit,
  type,
  departments,
  loading = false,
  parentName,
  timelineId,
}: TimelineItemCreateModalProps) {
  const { t, language } = useLanguage();

  // Use shared helpers and validation
  const { statusOptions, priorityOptions } = useTimelineFormHelpers();
  const { validateForm, errors, clearError } = useTimelineFormValidation();

  // Helper functions to map between numeric IDs and string keys
  // Status and priority now use direct value mapping

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
  const [selectedTasks, setSelectedTasks] = useState<WorkItem[]>([]);

  // Search hooks
  const {
    employees,
    loading: employeeSearchLoading,
    searchEmployees,
  } = useTeamSearch({ minLength: 1, maxResults: 20 });
  const { workItems: tasks, loading: taskSearchLoading } = useTaskSearch({
    maxResults: 100,
    loadInitialResults: true,
    timelineId,
  });

  // Reset form data when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
      // Reset selections
      setSelectedMembers([]);
      setSelectedTasks([]);
      setSelectedEmployee(null);
      setEmployeeInputValue("");
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof LocalFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for the field being changed
    if (errors[field as keyof typeof errors]) {
      clearError(field as keyof typeof errors);
    }
  };

  const handleSubmit = async () => {
    // Convert form data for validation
    const validationData = {
      name: formData.name,
      startDate: formData.startDate?.toString() || "",
      endDate: formData.endDate?.toString() || "",
    };

    if (!validateForm(validationData)) {
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
        depTaskIds: selectedTasks.map((t) => Number(t.id)),
      };

      await onSubmit(payload);

      // Don't show toasts here - let the parent component handle them
      // to avoid duplicate toasts
      onClose();
    } catch (error) {
      // Re-throw error to let parent component handle toasts
      throw error;
    }
  };

  const handleClose = () => {
    setFormData(getInitialFormData()); // Reset form data on close
    setSelectedMembers([]);
    setSelectedTasks([]);
    setSelectedEmployee(null);
    setEmployeeInputValue("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      scrollBehavior="inside"
      size="5xl"
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
                  placeholder={`Enter ${type} name`}
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>
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
                    <SelectItem key={dept.id.toString()} textValue={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>

            {/* Dates and Status Section */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
                        value: s.value.toString(),
                        label: language === "ar" ? s.labelAr : s.labelEn,
                        color: s.color,
                      }))}
                      placeholder={t("timeline.detailsPanel.selectStatus")}
                      selectedKeys={
                        formData.statusId ? [formData.statusId.toString()] : []
                      }
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as string;
                        const statusValue = selectedKey
                          ? parseInt(selectedKey)
                          : 1;

                        handleInputChange("statusId", statusValue);
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
                        value: p.value.toString(),
                        label: language === "ar" ? p.labelAr : p.labelEn,
                        color: p.color,
                      }))}
                      placeholder={t("timeline.detailsPanel.selectPriority")}
                      selectedKeys={
                        formData.priorityId
                          ? [formData.priorityId.toString()]
                          : []
                      }
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as string;
                        const priorityValue = selectedKey
                          ? parseInt(selectedKey)
                          : 2;

                        handleInputChange("priorityId", priorityValue);
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
                placeholder={`Enter ${type} description`}
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
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t("timeline.selectPredecessors")}
                  </label>
                  <Select
                    isLoading={taskSearchLoading}
                    items={tasks}
                    label={t("timeline.selectPredecessors")}
                    placeholder={t("timeline.selectPredecessorsPlaceholder")}
                    selectedKeys={selectedTasks.map((task) =>
                      task.id.toString(),
                    )}
                    selectionMode="multiple"
                    onSelectionChange={(keys) => {
                      if (keys === "all") return;

                      const selectedKeys = Array.from(keys);
                      const newSelectedTasks = tasks.filter((task) =>
                        selectedKeys.includes(task.id.toString()),
                      );

                      setSelectedTasks(newSelectedTasks);
                    }}
                  >
                    {(task) => (
                      <SelectItem
                        key={task.id.toString()}
                        textValue={task.name}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex flex-col">
                            <span className="font-medium">{task.name}</span>
                            <span className="text-xs text-default-500">
                              {task.description || t("common.none")}
                            </span>
                          </span>
                        </div>
                      </SelectItem>
                    )}
                  </Select>
                </div>

                {/* Members selection */}
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
                            name={employee.fullName || t("common.none")}
                            size="sm"
                          />
                          <span className="flex flex-col">
                            <span className="font-medium">
                              {employee.gradeName}{" "}
                              {employee.fullName || t("common.none")}
                            </span>
                            <span className="text-xs text-default-500">
                              {employee.militaryNumber || "N/A"}
                            </span>
                            <span className="text-xs text-default-400">
                              @{employee.userName || t("common.none")}
                            </span>
                            <span className="text-xs text-default-400">
                              @{employee.department || t("common.none")}
                            </span>
                          </span>
                        </span>
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            {t("timeline.treeView.create")} {type?.charAt(0).toUpperCase()}
            {type?.slice(1)}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
