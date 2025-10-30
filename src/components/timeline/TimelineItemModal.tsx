/**
 * Unified Timeline Item Modal Component
 * Handles both CREATE and EDIT modes for timeline items
 * - Reduces code duplication between TimelineItemCreateModal and TimelineEditModal
 * - Provides shared UI components and validation logic
 * - Supports both create (no initial values) and edit (with initial values) workflows
 */

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
import { parseDate, today, getLocalTimeZone } from "@internationalized/date";

import { useLanguage } from "@/contexts/LanguageContext";
import { Department, MemberSearchResult, WorkItem } from "@/types/timeline";
import useTeamSearch from "@/hooks/useTeamSearch";
import useTaskSearch from "@/hooks/useTaskSearch";
import { useTimelineFormHelpers } from "@/hooks/useTimelineFormHelpers";
import { useTimelineFormValidation } from "@/hooks/useTimelineFormValidation";
import { timelineService } from "@/services/api";

// Export types for use in create/edit modals
export interface TimelineItemModalFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  departmentId: string;
  statusId: number;
  priorityId: number;
  progress: number;
  notes: string;
  members?: MemberSearchResult[];
  depTasks?: WorkItem[];
  memberIds?: number[];
  depTaskIds?: number[];
  typeId?: number;
}

interface TimelineItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TimelineItemModalFormData) => Promise<void>;
  mode: "create" | "edit";
  type: "timeline" | "sprint" | "requirement" | "task" | "subtask";
  departments: Department[];
  loading?: boolean;
  parentName?: string;
  timelineId?: number;
  // Edit mode specific props
  initialValues?: TimelineItemModalFormData;
  statusOptions?: Array<{ id: number; label: string; color: string }>;
  priorityOptions?: Array<{ id: number; label: string; color: string }>;
  getProgressColor?: (
    progress: number,
  ) =>
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "foreground";
}

export default function TimelineItemModal({
  isOpen,
  onClose,
  onSubmit,
  mode,
  type,
  departments,
  loading = false,
  parentName,
  timelineId,
  initialValues,
  statusOptions: editStatusOptions,
  priorityOptions: editPriorityOptions,
  getProgressColor = () => "primary",
}: TimelineItemModalProps) {
  const { t, language } = useLanguage();

  // Use shared helpers and validation
  const {
    statusOptions: createStatusOptions,
    priorityOptions: createPriorityOptions,
  } = useTimelineFormHelpers();

  // Use correct status/priority options based on mode
  const statusOptions =
    mode === "edit" ? editStatusOptions : createStatusOptions;
  const priorityOptions =
    mode === "edit" ? editPriorityOptions : createPriorityOptions;

  // Local form state
  type LocalFormData = Omit<
    TimelineItemModalFormData,
    "startDate" | "endDate"
  > & {
    startDate: any | null;
    endDate: any | null;
  };

  const getInitialFormData = (): LocalFormData => {
    if (mode === "edit" && initialValues) {
      return {
        name: initialValues.name,
        description: initialValues.description,
        startDate: initialValues.startDate
          ? parseDate(initialValues.startDate.substring(0, 10))
          : null,
        endDate: initialValues.endDate
          ? parseDate(initialValues.endDate.substring(0, 10))
          : null,
        departmentId: initialValues.departmentId,
        statusId: initialValues.statusId,
        priorityId: initialValues.priorityId,
        progress: initialValues.progress,
        notes: initialValues.notes,
      };
    }

    return {
      name: "",
      description: "",
      startDate: null,
      endDate: null,
      departmentId: "",
      statusId: 1,
      priorityId: 2,
      progress: 0,
      notes: "",
    };
  };

  const [formData, setFormData] = useState<LocalFormData>(getInitialFormData());

  // Timeline data for validation
  const [timelineData, setTimelineData] = useState<{
    startDate: string;
    endDate: string;
  } | null>(null);

  const { validateForm, errors, clearError } = useTimelineFormValidation({
    requireDepartment: mode === "create",
    timelineStartDate: timelineData?.startDate,
    timelineEndDate: timelineData?.endDate,
    validateTimelineRange: true,
  });

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
  } = useTeamSearch({
    minLength: mode === "create" ? 1 : 0,
    maxResults: mode === "create" ? 20 : 100,
    loadInitialResults: mode === "edit",
  });

  const { workItems: tasks, loading: taskSearchLoading } = useTaskSearch({
    maxResults: 100,
    loadInitialResults: true,
    timelineId,
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
      setSelectedMembers([]);
      setSelectedTasks([]);
      setSelectedEmployee(null);
      setEmployeeInputValue("");

      // Load initial values for edit mode
      if (mode === "edit" && initialValues) {
        loadInitialData();
      }

      // Fetch timeline data for validation if timelineId is provided
      if (timelineId) {
        fetchTimelineData();
      } else {
        setTimelineData(null);
      }
    }
  }, [isOpen, timelineId]);

  // Helper to load initial data for edit mode
  const loadInitialData = async () => {
    if (!initialValues) return;

    // Load members
    if (initialValues?.memberIds && initialValues.memberIds.length > 0) {
      if (initialValues?.members && initialValues.members.length > 0) {
        setSelectedMembers(initialValues.members);
      } else {
        const memberPromises = initialValues.memberIds.map((id) =>
          fetchMemberById(id),
        );
        const members = await Promise.all(memberPromises);
        const validMembers = members.filter(
          (member): member is MemberSearchResult => member !== null,
        );

        setSelectedMembers(validMembers);
      }
    }

    // Load tasks
    if (initialValues?.depTaskIds && initialValues.depTaskIds.length > 0) {
      if (initialValues?.depTasks && initialValues.depTasks.length > 0) {
        setSelectedTasks(initialValues.depTasks);
      } else {
        if (tasks.length > 0) {
          const validTasks = initialValues.depTaskIds
            .map((id) =>
              tasks.find((task) => task.id.toString() === id.toString()),
            )
            .filter(
              (task): task is WorkItem => task !== null && task !== undefined,
            );

          if (validTasks.length === initialValues.depTaskIds.length) {
            setSelectedTasks(validTasks);

            return;
          }
        }
        const taskPromises = initialValues.depTaskIds.map((id) =>
          fetchTaskById(id),
        );
        const fetchedTasks = await Promise.all(taskPromises);
        const validTasks = fetchedTasks.filter(
          (task): task is WorkItem => task !== null,
        );

        setSelectedTasks(validTasks);
      }
    }
  };

  // Fetch member by ID
  const fetchMemberById = async (
    memberId: number,
  ): Promise<MemberSearchResult | null> => {
    try {
      const response = await timelineService.getAllDepartmentEmployees();

      if (response.success && response.data) {
        return response.data.find((emp) => emp.id === memberId) || null;
      }

      return null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching member details:", error);

      return null;
    }
  };

  // Fetch task by ID
  const fetchTaskById = async (taskId: number): Promise<WorkItem | null> => {
    try {
      return {
        id: taskId.toString(),
        name: `Task ${taskId}`,
        description: "Loading...",
        status: "ToDo",
        department: "",
        sprintId: "0",
        startDate: "",
        endDate: "",
        duration: 0,
        progress: 0,
        priority: "Medium",
        members: [],
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching task details:", error);

      return null;
    }
  };

  // Fetch timeline data for validation
  const fetchTimelineData = async () => {
    if (!timelineId) return;

    try {
      const response = await timelineService.getTimeline(timelineId.toString());

      if (response.success && response.data) {
        setTimelineData({
          startDate: response.data.startDate,
          endDate: response.data.endDate,
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching timeline data:", error);
      setTimelineData(null);
    }
  };

  const handleInputChange = (field: keyof LocalFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    debugger;
    if (errors[field as keyof typeof errors]) {
      clearError(field as keyof typeof errors);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm(formData)) return;

    try {
      const payload: TimelineItemModalFormData = {
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
      onClose();
    } catch (error) {
      throw error;
    }
  };

  const handleClose = () => {
    setFormData(getInitialFormData());
    setSelectedMembers([]);
    setSelectedTasks([]);
    setSelectedEmployee(null);
    setEmployeeInputValue("");
    setTimelineData(null);
    onClose();
  };

  const getModalTitle = () => {
    if (mode === "create") {
      return `${t("timeline.treeView.create")} ${type?.charAt(0).toUpperCase()}${type?.slice(1)}`;
    }

    return `${t("timeline.detailsPanel.edit")} ${type?.charAt(0).toUpperCase()}${type?.slice(1)}`;
  };

  const getSubmitButtonText = () => {
    if (mode === "create") {
      return `${t("timeline.treeView.create")} ${type?.charAt(0).toUpperCase()}${type?.slice(1)}`;
    }

    return t("timeline.detailsPanel.saveChanges");
  };

  const shouldShowDepartment = mode === "create" || type !== "timeline";
  const shouldShowStatusAndPriority =
    type === "task" || type === "subtask" || type === "requirement";
  const shouldShowProgress = shouldShowStatusAndPriority;
  const shouldShowMembersAndTasks =
    type === "task" || type === "subtask" || type === "requirement";

  return (
    <Modal
      isOpen={isOpen}
      scrollBehavior="inside"
      size="5xl"
      onClose={handleClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {getModalTitle()}
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
                  {t("timeline.treeView.name")}{" "}
                  {mode === "create" && <span className="text-red-500">*</span>}
                </label>
                <Input
                  errorMessage={errors.name}
                  isInvalid={!!errors.name}
                  placeholder={`Enter ${type} name`}
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>
              {shouldShowDepartment && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t("timeline.detailsPanel.department")}{" "}
                    {mode === "create" && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <Select
                    errorMessage={errors.departmentId}
                    isInvalid={!!errors.departmentId}
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
                label={`${t("timeline.detailsPanel.startDate")} ${mode === "create" ? "*" : ""}`}
                minValue={today(getLocalTimeZone())}
                value={formData.startDate}
                onChange={(date) => handleInputChange("startDate", date)}
              />
              <DatePicker
                isRequired
                errorMessage={errors.endDate}
                isInvalid={!!errors.endDate}
                label={`${t("timeline.detailsPanel.endDate")} ${mode === "create" ? "*" : ""}`}
                minValue={today(getLocalTimeZone())}
                value={formData.endDate}
                onChange={(date) => handleInputChange("endDate", date)}
              />
              {shouldShowStatusAndPriority && statusOptions && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("timeline.detailsPanel.status")}{" "}
                      {mode === "create" && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <Select
                      items={
                        mode === "edit"
                          ? statusOptions.map((s) => ({
                              value: s.id.toString(),
                              label: s.label,
                              color: s.color,
                            }))
                          : statusOptions.map((s) => ({
                              value: s.value.toString(),
                              label: language === "ar" ? s.labelAr : s.labelEn,
                              color: s.color,
                            }))
                      }
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
                  {priorityOptions && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("timeline.detailsPanel.priority")}{" "}
                        {mode === "create" && (
                          <span className="text-red-500">*</span>
                        )}
                      </label>
                      <Select
                        items={
                          mode === "edit"
                            ? priorityOptions.map((p) => ({
                                value: p.id.toString(),
                                label: p.label,
                                color: p.color,
                              }))
                            : priorityOptions.map((p) => ({
                                value: p.value.toString(),
                                label:
                                  language === "ar" ? p.labelAr : p.labelEn,
                                color: p.color,
                              }))
                        }
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
                  )}
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

            {/* Members and Dependent Tasks Section */}
            {shouldShowMembersAndTasks && (
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
                                prev.filter((x) => x.id !== task.id),
                              )
                            }
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <Select
                      disallowEmptySelection={false}
                      isLoading={taskSearchLoading}
                      items={tasks.filter(
                        (task) =>
                          !selectedTasks.some((st) => st.id === task.id),
                      )}
                      placeholder={t("timeline.selectPredecessorsPlaceholder")}
                      selectionMode={mode === "create" ? "multiple" : "single"}
                      onSelectionChange={(keys) => {
                        if (mode === "create") {
                          if (keys === "all") return;
                          const selectedKeys = Array.from(keys);
                          const newSelectedTasks = tasks.filter((task) =>
                            selectedKeys.includes(task.id.toString()),
                          );

                          setSelectedTasks(newSelectedTasks);
                        } else {
                          if (keys === "all") return;
                          const selectedKeys = Array.from(keys);

                          if (selectedKeys.length === 0) return;
                          const key = selectedKeys[0];
                          const found = tasks.find(
                            (t) => t.id.toString() === key,
                          );

                          if (found) {
                            setSelectedTasks((prev) => [...prev, found]);
                          }
                        }
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
                    {mode === "create" ? (
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
                            setSelectedEmployee(null);
                            setEmployeeInputValue("");
                          }
                        }}
                      >
                        {employees.map((employee) => (
                          <AutocompleteItem
                            key={employee.id.toString()}
                            textValue={`${employee.gradeName} ${employee.fullName}`}
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
                    ) : (
                      <Select
                        disallowEmptySelection={false}
                        isLoading={employeeSearchLoading}
                        items={employees.filter(
                          (employee) =>
                            !selectedMembers.some((m) => m.id === employee.id),
                        )}
                        placeholder={t("users.searchEmployees")}
                        selectionMode="single"
                        onSelectionChange={(keys) => {
                          if (keys === "all") return;
                          const selectedKeys = Array.from(keys);

                          if (selectedKeys.length === 0) return;
                          const key = selectedKeys[0];
                          const found = employees.find(
                            (e) => e.id.toString() === key,
                          );

                          if (found) {
                            setSelectedMembers((prev) => [...prev, found]);
                          }
                        }}
                      >
                        {(employee) => (
                          <SelectItem
                            key={employee.id.toString()}
                            textValue={`${employee.gradeName} ${employee.fullName}`}
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
                                  {employee.militaryNumber || t("common.none")}
                                </span>
                              </span>
                            </span>
                          </SelectItem>
                        )}
                      </Select>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Progress and Notes Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {shouldShowProgress && (
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
            {getSubmitButtonText()}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
