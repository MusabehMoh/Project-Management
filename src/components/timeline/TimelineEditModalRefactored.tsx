import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  DatePicker,
  Slider,
} from "@heroui/react";
import { parseDate } from "@internationalized/date";

import {
  MemberAutocomplete,
  TaskAutocomplete,
  DepartmentSelect,
  StatusSelect,
  PrioritySelect,
} from "./shared";

import { useTimelineFormHelpers, useTimelineFormValidation } from "@/hooks";
import { useLanguage } from "@/contexts/LanguageContext";
import { Department, MemberSearchResult, WorkItem } from "@/types/timeline";

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
  members?: MemberSearchResult[];
  depTasks?: WorkItem[];
  memberIds?: number[];
  depTaskIds?: (string | number)[];
}

interface TimelineEditModalRefactoredProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TimelineEditModalFormData) => Promise<void>;
  type: "timeline" | "sprint" | "requirement" | "task" | "subtask";
  initialValues: TimelineEditModalFormData;
  departments: Department[];
  loading?: boolean;
  timelineId?: number;
}

/**
 * Refactored TimelineEditModal demonstrating the use of shared utilities
 * This version eliminates hundreds of lines of duplicate code by using:
 * - useTimelineFormHelpers for status/priority options and color mapping
 * - useTimelineFormValidation for consistent form validation
 * - Shared form components (StatusSelect, PrioritySelect, DepartmentSelect)
 * - Shared autocomplete components (MemberAutocomplete, TaskAutocomplete)
 */
export default function TimelineEditModalRefactored({
  isOpen,
  onClose,
  onSubmit,
  type,
  initialValues,
  departments,
  loading = false,
  timelineId,
}: TimelineEditModalRefactoredProps) {
  const { t } = useLanguage();

  // Use shared form helpers - replaces all the duplicate color mapping and option creation
  const { statusOptions, priorityOptions, getProgressColor } =
    useTimelineFormHelpers(departments);

  // Use shared validation - replaces duplicate validation logic
  const { errors, validateForm, clearError, clearAllErrors } =
    useTimelineFormValidation({
      requireName: true,
      requireStartDate: true,
      requireEndDate: true,
      minNameLength: 2,
    });

  const [formData, setFormData] =
    useState<TimelineEditModalFormData>(initialValues);

  // Simplified member/task state using shared components
  const [selectedMembers, setSelectedMembers] = useState<MemberSearchResult[]>(
    [],
  );
  const [selectedTasks, setSelectedTasks] = useState<WorkItem[]>([]);

  // Update form data when initial values change
  useEffect(() => {
    setFormData(initialValues);
    clearAllErrors();
    setSelectedMembers(initialValues?.members ?? []);
    setSelectedTasks((initialValues?.depTasks as any) ?? []);
  }, [initialValues, clearAllErrors]);

  // Clear selections when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedMembers([]);
      setSelectedTasks([]);
    }
  }, [isOpen]);

  const handleInputChange = (
    field: keyof TimelineEditModalFormData,
    value: any,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearError(field as any);
  };

  const handleSubmit = async () => {
    if (!validateForm(formData)) {
      return;
    }

    try {
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
      // Error handling
    }
  };

  const handleClose = () => {
    setFormData(initialValues);
    clearAllErrors();
    setSelectedMembers([]);
    setSelectedTasks([]);
    onClose();
  };

  // Simplified member/task handlers using shared components
  const handleMemberSelect = (member: MemberSearchResult) => {
    if (!selectedMembers.some((m) => m.id === member.id)) {
      setSelectedMembers((prev) => [...prev, member]);
    }
  };

  const handleMemberRemove = (memberId: number) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  const handleTaskSelect = (task: WorkItem) => {
    if (!selectedTasks.some((t) => t.id === task.id)) {
      setSelectedTasks((prev) => [...prev, task]);
    }
  };

  const handleTaskRemove = (taskId: string | number) => {
    setSelectedTasks((prev) => prev.filter((t) => t.id !== taskId));
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
          {t("timeline.detailsPanel.edit")} {type?.charAt(0).toUpperCase()}
          {type?.slice(1)}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-3">
            {/* Main Info Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Input
                  errorMessage={errors.name}
                  isInvalid={!!errors.name}
                  label={t("timeline.treeView.name")}
                  placeholder={t("timeline.treeView.name")}
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>
              {type !== "timeline" && (
                <DepartmentSelect
                  departments={departments}
                  selectedDepartmentId={formData.departmentId}
                  onSelectionChange={(departmentId) =>
                    handleInputChange("departmentId", departmentId)
                  }
                />
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
                  {/* Simplified status select using shared component */}
                  <StatusSelect
                    selectedStatusId={formData.statusId}
                    statusOptions={statusOptions}
                    onSelectionChange={(statusId) =>
                      handleInputChange("statusId", statusId)
                    }
                  />
                  {/* Simplified priority select using shared component */}
                  <PrioritySelect
                    priorityOptions={priorityOptions}
                    selectedPriorityId={formData.priorityId}
                    onSelectionChange={(priorityId) =>
                      handleInputChange("priorityId", priorityId)
                    }
                  />
                </>
              )}
            </div>

            {/* Description Section */}
            <div>
              <Textarea
                label={t("timeline.detailsPanel.description")}
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
                {/* Simplified task selection using shared component */}
                {(type === "requirement" || type === "task") && (
                  <TaskAutocomplete
                    selectedTasks={selectedTasks}
                    timelineId={timelineId}
                    onTaskRemove={handleTaskRemove}
                    onTaskSelect={handleTaskSelect}
                  />
                )}

                {/* Simplified member selection using shared component */}
                {(type === "task" || type === "requirement") && (
                  <MemberAutocomplete
                    selectedMembers={selectedMembers}
                    onMemberRemove={handleMemberRemove}
                    onMemberSelect={handleMemberSelect}
                  />
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
                <Textarea
                  label={t("timeline.treeView.notes")}
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