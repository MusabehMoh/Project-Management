import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { DatePicker } from "@heroui/date-picker";
import { Select, SelectItem } from "@heroui/select";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Avatar } from "@heroui/avatar";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { Info } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { MemberTask } from "@/types/membersTasks";
import { MemberSearchResult } from "@/types/timeline";
import { timelineApiService } from "@/services/api/timelineService";
import useTeamSearchByDepartment from "@/hooks/useTeamSearchByDepartment";
import useTaskSearch from "@/hooks/useTaskSearch";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import { validateDateNotInPast } from "@/utils/dateValidation";
import { getLocalTimeZone, today } from "@internationalized/date";
interface TaskCreateModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  parentTask: MemberTask & { sprintId?: string; timelineId?: string };
  loading?: boolean;
  onTaskCreated?: () => void;
}
export default function TaskCreateModal({
  isOpen,
  onOpenChange,
  parentTask,
  loading = false,
  onTaskCreated,
}: TaskCreateModalProps) {
  const { t } = useLanguage();

  // Wrapper function for validation that passes translation
  const handleValidateDateNotInPast = (
    value: any,
  ): string | true | null | undefined => {
    return validateDateNotInPast(value, t);
  };

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    startDate: any; // CalendarDate | null
    endDate: any; // CalendarDate | null
    priority: number;
    assignedMembers: string[];
    departmentId?: number;
    projectId?: string;
    requirementId?: number;
    parentTaskId?: string;
  }>({
    name: "",
    description: "",
    startDate: null,
    endDate: null,
    priority: 2, // Medium priority default
    assignedMembers: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Members/Tasks selection state
  const [employeeInputValue, setEmployeeInputValue] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] =
    useState<MemberSearchResult | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<MemberSearchResult[]>(
    [],
  );
  const [selectedTasks, setSelectedTasks] = useState<any[]>([]);

  // Search hooks
  const {
    employees,
    loading: employeeSearchLoading,
    searchEmployees,
  } = useTeamSearchByDepartment({
    departmentId: 5, // qc Department
    minLength: 1,
    maxResults: 100,
    loadInitialResults: true, // Load all qc initially
    initialResultsLimit: 100,
  });
  const { workItems: tasks, loading: taskSearchLoading } = useTaskSearch({
    maxResults: 100,
    loadInitialResults: true,
  });

  // Update form data when parent task changes
  useEffect(() => {
    if (isOpen && parentTask) {
      setFormData((prev) => ({
        ...prev,
        departmentId: parentTask.department?.id
          ? Number(parentTask.department.id)
          : undefined,
        projectId: parentTask.project?.id || "",
        requirementId: parentTask.requirement?.id
          ? Number(parentTask.requirement.id)
          : undefined,
        parentTaskId: parentTask.id,
      }));
      // Set the parent task as the default selected task (predecessor)
      setSelectedTasks([
        {
          id: parentTask.id,
          name: parentTask.name,
          description: parentTask.description || "",
        },
      ]);
    }
  }, [isOpen, parentTask]);
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for the field being changed
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = t("validation.nameRequired");
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t("validation.nameMinLength");
    }
    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = t("validation.descriptionRequired");
    }
    // Start date validation
    if (!formData.startDate) {
      newErrors.startDate = t("validation.startDateRequired");
    } else {
      // Validate start date is not in the past
      const startDateValidation = handleValidateDateNotInPast(
        formData.startDate,
      );

      if (startDateValidation !== true) {
        newErrors.startDate = t("common.validation.dateNotInPast");
      }
    }

    // End date validation
    if (!formData.endDate) {
      newErrors.endDate = t("validation.endDateRequired");
    } else {
      // Validate end date is not in the past
      const endDateValidation = handleValidateDateNotInPast(formData.endDate);

      if (endDateValidation !== true) {
        newErrors.endDate = t("common.validation.dateNotInPast");
      }
    }

    // Check if end date is after start date (only if both dates exist and are valid)
    if (
      formData.startDate &&
      formData.endDate &&
      !newErrors.startDate &&
      !newErrors.endDate
    ) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (start >= end) {
        newErrors.endDate = t("validation.endDateAfterStart");
      }
    }
    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    try {
      const taskData = {
        sprintId: parentTask.sprintId || null,
        timelineId: parentTask.timelineId || null,
        name: formData.name,
        description: formData.description,
        startDate: formData.startDate!.toString(),
        endDate: formData.endDate!.toString(),
        departmentId: "5",
        statusId: 1, // Default status for new tasks
        priorityId: formData.priority,
        progress: 0,
        memberIds: selectedMembers.map((m) => m.id),
        depTaskIds: selectedTasks.map((t) => Number(t.id)),
        notes: "",
      };
      const result = await timelineApiService.createTask(taskData);

      if (result.success) {
        showSuccessToast(t("task.create.success"));
        onTaskCreated?.();
        // Reset form
        setFormData({
          name: "",
          description: "",
          startDate: null,
          endDate: null,
          priority: 2,
          assignedMembers: [],
        });
        setErrors({});
        onOpenChange(false);
      } else {
        showErrorToast(t("task.create.failedToCreate"));
        setErrors({ general: t("task.create.failedToCreate") });
      }
    } catch {
      showErrorToast(t("task.create.failedToCreate"));
      setErrors({ general: t("task.create.failedToCreate") });
    }
  };
  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      startDate: null,
      endDate: null,
      priority: 2,
      assignedMembers: [],
    });
    setErrors({});
    // Reset selections
    setSelectedMembers([]);
    setSelectedTasks([]);
    setSelectedEmployee(null);
    setEmployeeInputValue("");
    onOpenChange(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      scrollBehavior="inside"
      size="5xl"
      onClose={handleClose}
      onOpenChange={onOpenChange}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{t("task.create.title")}</h2>
            <Popover placement="bottom">
              <PopoverTrigger>
                <Button
                  isIconOnly
                  className="text-default-400 hover:text-default-600"
                  size="sm"
                  variant="light"
                >
                  <Info className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <div className="px-1 py-2">
                  <div className="text-small font-bold">{t("common.info")}</div>
                  <div className="text-tiny text-default-600 max-w-xs">
                    {t("task.create.taskInfo")}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <p className="text-sm text-default-500 font-normal">
            {t("task.create.subtitle")}
          </p>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {errors.general && (
              <div className="p-3 text-sm text-danger bg-danger-50 rounded-lg">
                {errors.general}
              </div>
            )}
            <Input
              isRequired
              errorMessage={errors.name}
              isInvalid={!!errors.name}
              label={t("task.create.taskName")}
              placeholder={t("task.create.taskNamePlaceholder")}
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePicker
                isRequired
                errorMessage={errors.startDate}
                isInvalid={!!errors.startDate}
                label={t("task.create.startDate")}
                minValue={today(getLocalTimeZone())}
                value={formData.startDate}
                onChange={(date) => handleInputChange("startDate", date)}
              />
              <DatePicker
                isRequired
                errorMessage={errors.endDate}
                isInvalid={!!errors.endDate}
                label={t("task.create.endDate")}
                minValue={today(getLocalTimeZone())}
                value={formData.endDate}
                onChange={(date) => handleInputChange("endDate", date)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label={t("task.create.priority")}
                selectedKeys={[formData.priority.toString()]}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;

                  if (selectedKey) {
                    handleInputChange("priority", parseInt(selectedKey));
                  }
                }}
              >
                <SelectItem key="1">{t("priority.low")}</SelectItem>
                <SelectItem key="2">{t("priority.medium")}</SelectItem>
                <SelectItem key="3">{t("priority.high")}</SelectItem>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("task.create.description")}
              </label>
              <div
                dangerouslySetInnerHTML={{
                  __html: formData.description || "",
                }}
                contentEditable
                className="w-full min-h-[80px] p-3 border border-default-200 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                onInput={(e) =>
                  setFormData({
                    ...formData,
                    description: e.currentTarget.innerHTML,
                  })
                }
              />
            </div>

            {/* Dependent Tasks selection */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("timeline.selectPredecessors")}
              </label>
              <Select
                isDisabled={true} // Parent task is pre-selected and disabled
                isLoading={taskSearchLoading}
                items={tasks}
                label={t("timeline.selectPredecessors")}
                placeholder={t("timeline.selectPredecessorsPlaceholder")}
                selectedKeys={selectedTasks.map((task) => task.id.toString())}
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
                  <SelectItem key={task.id.toString()} textValue={task.name}>
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

                  const found = employees.find((e) => e.id.toString() === key);

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
                    textValue={`${employee.gradeName} ${employee.fullName}    `}
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
                      </span>
                    </span>
                  </AutocompleteItem>
                ))}
              </Autocomplete>
            </div>

            <div className="p-3 text-sm text-info bg-info-50 rounded-lg">
              {t("task.create.qcAssignmentNote")}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            isDisabled={loading}
            variant="light"
            onPress={handleClose}
          >
            {t("task.create.cancel")}
          </Button>
          <Button
            color="primary"
            isDisabled={loading}
            isLoading={loading}
            onPress={handleSave}
          >
            {t("task.createTask")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
