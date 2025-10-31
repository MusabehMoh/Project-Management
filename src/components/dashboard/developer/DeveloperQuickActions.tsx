import React, { useState, useEffect } from "react";
import {
  today,
  getLocalTimeZone,
  CalendarDate,
  parseDate,
} from "@internationalized/date";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Skeleton } from "@heroui/skeleton";
import { Alert } from "@heroui/alert";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Textarea } from "@heroui/input";
import { DatePicker } from "@heroui/date-picker";
import { Avatar } from "@heroui/avatar";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { addToast } from "@heroui/toast";
import { RefreshCw, AlertTriangle, Code, User, Clock, X } from "lucide-react";

import { useLanguage, Direction } from "@/contexts/LanguageContext";
import { UseAdhocTasks } from "@/hooks/useAdhocTask";
import { useDeveloperQuickActions } from "@/hooks/useDeveloperQuickActionsV2";
import ErrorWithRetry from "@/components/ErrorWithRetry";
import { useTeamSearch } from "@/hooks/useTeamSearch";
import { MemberSearchResult } from "@/types/timeline";
import { validateDateNotInPast } from "@/utils/validation";

// Animated Counter Component
const AnimatedCounter = ({
  value,
  duration = 1000,
}: {
  value: number;
  duration?: number;
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);

      return;
    }

    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const endValue = value;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(
        startValue + (endValue - startValue) * easeOutCubic,
      );

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [value, duration, displayValue]);

  return <span className="tabular-nums">{displayValue}</span>;
};

// CustomAlert Props interface
interface CustomAlertProps {
  title: string;
  children: React.ReactNode;
  variant?: "faded" | "flat" | "solid" | "bordered";
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
  className?: string;
  classNames?: any;
  direction?: Direction;
  description?: string;
}

// Custom Alert Component with dynamic color styling
const CustomAlert = React.forwardRef<HTMLDivElement, CustomAlertProps>(
  (
    {
      title,
      children,
      variant = "faded",
      color = "danger",
      className,
      classNames = {},
      direction,
      ...props
    },
    ref,
  ) => {
    const isRTL = direction === "rtl";

    // Dynamic border color based on the color prop
    const getBorderColor = (color: string) => {
      switch (color) {
        case "success":
          return "before:bg-success";
        case "warning":
          return "before:bg-warning";
        case "danger":
        default:
          return "before:bg-danger";
      }
    };

    return (
      <Alert
        ref={ref}
        classNames={{
          ...classNames,
          base: [
            "bg-default-50 dark:bg-background shadow-sm",
            "border-1 border-default-200 dark:border-default-100",
            "relative before:content-[''] before:absolute before:z-10",
            isRTL
              ? "before:right-0 before:top-[-1px] before:bottom-[-1px] before:w-1"
              : "before:left-0 before:top-[-1px] before:bottom-[-1px] before:w-1",
            isRTL ? "rounded-r-none border-r-0" : "rounded-l-none border-l-0",
            getBorderColor(color),
            classNames.base,
            className,
          ]
            .filter(Boolean)
            .join(" "),
          mainWrapper: [
            "pt-1 flex items-start justify-between",
            classNames.mainWrapper,
          ]
            .filter(Boolean)
            .join(" "),
          iconWrapper: ["dark:bg-transparent", classNames.iconWrapper]
            .filter(Boolean)
            .join(" "),
          title: [
            isRTL ? "text-right" : "text-left",
            "text-sm font-medium",
            classNames.title,
          ]
            .filter(Boolean)
            .join(" "),
          description: [
            isRTL ? "text-right" : "text-left",
            "text-xs text-default-500 mt-1",
            classNames.description,
          ]
            .filter(Boolean)
            .join(" "),
        }}
        color={color}
        dir={direction}
        title={title}
        variant={variant}
        {...props}
      >
        {children}
      </Alert>
    );
  },
);

CustomAlert.displayName = "CustomAlert";

interface DeveloperQuickActionsProps {
  autoRefresh?: boolean;
  className?: string;
  onAssignDeveloper?: (task: any, developerId: string) => void;
  onAssignReviewer?: (pullRequest: any, reviewerId: string) => void;
}

const DeveloperQuickActions: React.FC<DeveloperQuickActionsProps> = ({
  autoRefresh: _autoRefresh = true,
  className = "",
  onAssignDeveloper: _onAssignDeveloper,
  onAssignReviewer: _onAssignReviewer,
}) => {
  const { t, direction } = useLanguage();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isPRModalOpen, setIsPRModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [selectedPR, setSelectedPR] = useState<any>(null);
  const [selectedDevelopers, setSelectedDevelopers] = useState<
    MemberSearchResult[]
  >([]);
  const [developerInputValue, setDeveloperInputValue] = useState<string>("");

  // Use the same team search hook as projects page
  const {
    employees: developerEmployees,
    loading: developerSearchLoading,
    searchEmployees: searchDeveloperEmployees,
    clearResults: clearDeveloperResults,
  } = useTeamSearch({
    minLength: 1,
    maxResults: 20,
    loadInitialResults: false,
  });

  const {
    unassignedTasks,
    almostCompletedTasks,
    overdueTasks,
    availableDevelopers,
    loading,
    refreshing,
    error,
    hasActionsAvailable,
    refresh,
    extendTask,
    assignDeveloper,
  } = useDeveloperQuickActions({
    autoRefresh: false, // Disable auto-refresh to prevent constant loading
    refreshInterval: 30000,
  });

  // Calculate total count of all actions
  const totalActionsCount =
    unassignedTasks.length +
    almostCompletedTasks.length +
    (overdueTasks?.length || 0) +
    availableDevelopers.length;

  if (loading) {
    return (
      <Card
        className={`${className} border-default-200`}
        dir={direction}
        shadow="sm"
      >
        <CardBody className="space-y-6 py-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-1/3 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>

          {/* Tabs skeleton */}
          <div className="flex space-x-4">
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>

          {/* Content skeleton */}
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border border-default-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48 rounded" />
                    <Skeleton className="h-3 w-32 rounded" />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-20 rounded-lg" />
                  <Skeleton className="h-8 w-16 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card
        className={`${className} border-default-200`}
        dir={direction}
        shadow="sm"
      >
        <CardBody className="min-h-[200px]">
          <ErrorWithRetry
            error={error}
            icon={<AlertTriangle className="h-8 w-8 text-default-400" />}
            onRetry={refresh}
          />
        </CardBody>
      </Card>
    );
  }

  // Empty state when no actions are available
  if (!loading && totalActionsCount === 0) {
    return (
      <Card
        className={`${className} border-default-200`}
        dir={direction}
        shadow="sm"
      >
        <CardHeader className="flex items-center justify-between pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-foreground">
                {t("dashboard.myActions") || "My Actions"}
              </h3>
            </div>
            <p className="text-sm text-default-500 mt-1">
              {t("developerDashboard.quickActionsSubtitle") ||
                "Assign tasks and code reviews that need your attention"}
            </p>
          </div>
          <Button
            isIconOnly
            className="text-default-400 hover:text-default-600"
            disabled={refreshing}
            size="sm"
            variant="light"
            onPress={refresh}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </CardHeader>
        <Divider className="bg-default-200" />
        <CardBody className="p-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 bg-success-50 dark:bg-success-100/10 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-10 h-10 text-success-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t("developerQuickActions.noActionsTitle") || "All Clear!"}
            </h3>
            <p className="text-sm text-default-500 max-w-md">
              {t("developerQuickActions.noActionsDescription") ||
                "No actions require your attention at this time. All tasks are assigned and up to date."}
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Modal Components (must be defined before usage to avoid hoisting issues)
  const handleTaskAssign = async () => {
    if (selectedTask && selectedDevelopers.length > 0) {
      try {
        // Assign each developer to the task using the hook function
        for (const developer of selectedDevelopers) {
          await assignDeveloper(selectedTask.id, developer.id.toString());
        }

        // Show success toast
        addToast({
          title:
            t("developerQuickActions.assignmentSuccess") ||
            "Assignment Successful",
          description:
            selectedDevelopers.length === 1
              ? `1 developer assigned to ${selectedTask.title}`
              : `${selectedDevelopers.length} developers assigned to ${selectedTask.title}`,
          color: "success",
          timeout: 4000,
        });

        setIsTaskModalOpen(false);
        setSelectedTask(null);
        setSelectedDevelopers([]);
        setDeveloperInputValue("");
        clearDeveloperResults();
      } catch (error) {
        // Show error toast
        addToast({
          title:
            t("developerQuickActions.assignmentError") || "Assignment Failed",
          description: "Failed to assign developer(s). Please try again.",
          color: "danger",
          timeout: 5000,
        });
      }
    }
  };

  const handlePRAssign = async () => {
    if (selectedPR && selectedDevelopers.length > 0 && _onAssignReviewer) {
      try {
        // Starting code review assignment

        // Assign each reviewer to the PR
        for (const reviewer of selectedDevelopers) {
          await _onAssignReviewer(selectedPR, reviewer.id.toString());
        }

        // Show success toast
        addToast({
          title:
            t("developerQuickActions.reviewAssignmentSuccess") ||
            "Review Assignment Successful",
          description:
            selectedDevelopers.length === 1
              ? `1 reviewer assigned to ${selectedPR.title}`
              : `${selectedDevelopers.length} reviewers assigned to ${selectedPR.title}`,
          color: "success",
          timeout: 4000,
        });

        setIsPRModalOpen(false);
        setSelectedPR(null);
        setSelectedDevelopers([]);
        setDeveloperInputValue("");
        clearDeveloperResults();

        // Refresh the pending code reviews list
        await refresh();
      } catch (error: unknown) {
        // Failed to assign reviewer
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        // Show error toast
        addToast({
          title:
            t("developerQuickActions.reviewAssignmentError") ||
            "Review Assignment Failed",
          description: "Failed to assign reviewer(s). Please try again.",
          color: "danger",
          timeout: 5000,
        });
      }
    }
  };

  const handleTaskCancel = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
    setSelectedDevelopers([]);
    setDeveloperInputValue("");
    clearDeveloperResults();
  };

  const handlePRCancel = () => {
    setIsPRModalOpen(false);
    setSelectedPR(null);
    setSelectedDevelopers([]);
    setDeveloperInputValue("");
    clearDeveloperResults();
  };

  const TaskAssignmentModal = () => {
    return (
      <Modal
        dir={direction}
        isOpen={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
      >
        <ModalContent>
          <ModalHeader>
            {t("developerQuickActions.assignDeveloper") || "Assign Developer"}
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-600 mb-4">
              {t("developerQuickActions.assignDeveloperTo") ||
                "Assign developers to"}
              : {selectedTask?.title}
            </p>

            {/* Selected Developers Display */}
            {selectedDevelopers.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-foreground mb-2">
                  {t("developerQuickActions.selectedDevelopers") ||
                    "Selected Developers"}
                  :
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedDevelopers.map((developer) => (
                    <Chip
                      key={developer.id}
                      color="primary"
                      variant="flat"
                      onClose={() => {
                        setSelectedDevelopers((prev) =>
                          prev.filter((d) => d.id !== developer.id),
                        );
                      }}
                    >
                      {developer.fullName}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            <Autocomplete
              /* Provide a robust filter across multiple fields */
              isClearable
              defaultFilter={(textValue, input) => {
                const q = input.trim().toLowerCase();

                if (!q) return true;

                const v = textValue.toLowerCase();

                return v.includes(q);
              }}
              /* Use defaultItems for built-in filtering to avoid dropdown glitches inside modals */
              defaultItems={developerEmployees.filter(
                (emp) =>
                  !selectedDevelopers.some(
                    (selected) => selected.id === emp.id,
                  ),
              )}
              inputValue={developerInputValue}
              isLoading={developerSearchLoading}
              label={
                t("developerQuickActions.selectDeveloper") ||
                "Select Developers"
              }
              menuTrigger="input"
              placeholder={
                t("developerQuickActions.chooseDeveloper") ||
                "Search and select developers"
              }
              onInputChange={(value) => {
                setDeveloperInputValue(value);
                // Search for developers (server-side), complementing client filter
                searchDeveloperEmployees(value);
              }}
              onSelectionChange={(key) => {
                if (key) {
                  const developer = developerEmployees.find(
                    (d) => d.id.toString() === key,
                  );

                  if (
                    developer &&
                    !selectedDevelopers.some(
                      (selected) => selected.id === developer.id,
                    )
                  ) {
                    setSelectedDevelopers((prev) => [...prev, developer]);
                    // Keep input controlled; clear display text after selection
                    setDeveloperInputValue("");
                  }
                }
              }}
            >
              {(developer) => (
                <AutocompleteItem
                  key={developer.id}
                  /* textValue controls what appears in the input after selection */
                  textValue={`${developer.fullName}`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{developer.fullName}</span>
                    <span className="text-sm text-default-500">
                      {developer.militaryNumber} - {developer.gradeName}
                    </span>
                  </div>
                </AutocompleteItem>
              )}
            </Autocomplete>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={handleTaskCancel}>
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              color="primary"
              disabled={selectedDevelopers.length === 0}
              onPress={handleTaskAssign}
            >
              {t("developerQuickActions.assign") || "Assign"} (
              {selectedDevelopers.length})
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  const TaskExtensionModal = () => {
    const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(null);
    const [extensionReason, setExtensionReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState<{
      date?: string;
      reason?: string;
    }>({});

    // Get minimum date (today)
    const minDate = today(getLocalTimeZone());

    const validateForm = () => {
      const errors: { date?: string; reason?: string } = {};

      if (!selectedDate) {
        errors.date = t("validation.dateRequired") || "Date is required";
      }

      if (!extensionReason.trim()) {
        errors.reason = t("validation.reasonRequired") || "Reason is required";
      }

      setValidationErrors(errors);

      return Object.keys(errors).length === 0;
    };

    const handleExtendTask = async () => {
      if (!validateForm()) {
        return;
      }

      if (!selectedTask || !selectedDate || !extensionReason.trim()) {
        return;
      }

      // Convert CalendarDate to string format
      const dateString = `${selectedDate.year}-${String(selectedDate.month).padStart(2, "0")}-${String(selectedDate.day).padStart(2, "0")}`;

      setIsSubmitting(true);
      try {
        await extendTask(selectedTask.id, dateString, extensionReason);
        addToast({
          title: t("common.success") || "Success",
          description:
            t("common.taskExtended") || "Task deadline extended successfully",
          color: "success",
          timeout: 3000,
        });

        // Reset form and close modal
        setSelectedDate(null);
        setExtensionReason("");
        setValidationErrors({});
        setIsExtendModalOpen(false);
        setSelectedTask(null);
      } catch (error) {
        addToast({
          title: t("common.error") || "Error",
          description:
            error instanceof Error ? error.message : t("common.failedToExtend"),
          color: "danger",
          timeout: 5000,
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleCancel = () => {
      setSelectedDate(null);
      setExtensionReason("");
      setValidationErrors({});
      setIsExtendModalOpen(false);
      setSelectedTask(null);
    };

    return (
      <Modal
        dir={direction}
        isOpen={isExtendModalOpen}
        onOpenChange={setIsExtendModalOpen}
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-semibold">
              {t("common.extendTask") || "Extend Task Deadline"}
            </h3>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-600 mb-4">
              {t("common.taskLabel")} <strong>{selectedTask?.name}</strong>
            </p>
            <p className="text-sm text-default-600 mb-4">
              {t("common.currentDeadline")}{" "}
              <strong>
                {selectedTask?.endDate
                  ? new Date(selectedTask.endDate).toLocaleDateString()
                  : t("common.na")}
              </strong>
            </p>

            <div className="space-y-4">
              <DatePicker
                isRequired
                showMonthAndYearPickers
                description={
                  t("common.selectNewDate") || "Select a new deadline date"
                }
                errorMessage={validationErrors.date}
                isInvalid={!!validationErrors.date}
                label={t("common.newDeadline") || "New Deadline"}
                minValue={minDate}
                value={selectedDate}
                onChange={(date) => {
                  setSelectedDate(date);
                  if (validationErrors.date) {
                    setValidationErrors((prev) => ({
                      ...prev,
                      date: undefined,
                    }));
                  }
                }}
              />

              <Textarea
                isRequired
                errorMessage={validationErrors.reason}
                isInvalid={!!validationErrors.reason}
                label={t("common.reason") || "Reason for Extension"}
                maxRows={6}
                minRows={3}
                placeholder={
                  t("common.reasonPlaceholder") ||
                  "Please provide a reason for extending this task..."
                }
                value={extensionReason}
                onChange={(e) => {
                  setExtensionReason(e.target.value);
                  if (validationErrors.reason) {
                    setValidationErrors((prev) => ({
                      ...prev,
                      reason: undefined,
                    }));
                  }
                }}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              disabled={isSubmitting}
              variant="flat"
              onPress={handleCancel}
            >
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              color="primary"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              onPress={handleExtendTask}
            >
              {t("common.extendDeadline") || "Extend Deadline"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  const AddAdhocTaskModal = () => {
    const { addAdhocTask, loading: isCreating } = UseAdhocTasks();
    const [formData, setFormData] = useState({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      members: [],
    });
    const [selectedMembers, setSelectedMembers] = useState<
      MemberSearchResult[]
    >([]);
    const [employeeInputValue, setEmployeeInputValue] = useState<string>("");
    const [selectedEmployee, setSelectedEmployee] =
      useState<MemberSearchResult | null>(null);
    const [errors, setErrors] = useState<{
      name?: string;
      description?: string;
      startDate?: string;
      endDate?: string;
      members?: string;
    }>({});

    const handleValidateDateNotInPast = (date: any) => {
      return validateDateNotInPast(date);
    };

    const validateForm = () => {
      const newErrors: {
        name?: string;
        description?: string;
        startDate?: string;
        endDate?: string;
        members?: string;
      } = {};

      if (!formData.name.trim()) {
        newErrors.name = t("taskNameRequired") || "Task name is required";
      }
      if (!formData.description.trim()) {
        newErrors.description =
          t("taskDescriptionRequired") || "Task description is required";
      }
      if (!formData.startDate) {
        newErrors.startDate =
          t("taskStartDateRequired") || "Start date is required";
      } else {
        // Validate start date is not in the past
        const startDateValidation = handleValidateDateNotInPast(
          formData.startDate,
        );

        if (startDateValidation !== true) {
          newErrors.startDate = t("common.validation.dateNotInPast");
        }
      }
      if (!formData.endDate) {
        newErrors.endDate = t("taskEndDateRequired") || "End date is required";
      } else {
        // Validate end date is not in the past
        const endDateValidation = handleValidateDateNotInPast(formData.endDate);

        if (endDateValidation !== true) {
          newErrors.endDate = t("common.validation.dateNotInPast");
        }
      }

      if (formData.startDate && formData.endDate) {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);

        if (end < start) {
          newErrors.endDate =
            t("taskValidEndDate") || "End date must be after start date";
        }
      }

      if (selectedMembers.length === 0) {
        newErrors.members =
          t("taskAssigneeRequired") || "At least one assignee is required";
      }

      setErrors(newErrors);

      return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: string, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field as keyof typeof errors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

    const handleEmployeeSelect = (employee: MemberSearchResult) => {
      setSelectedEmployee(employee);
      setEmployeeInputValue(`${employee.gradeName} ${employee.fullName}`);
      if (!selectedMembers.some((user) => user.id === employee.id)) {
        setSelectedMembers([...selectedMembers, employee]);
      }
      setEmployeeInputValue("");
      setSelectedEmployee(null);
    };

    const handleClose = () => {
      setIsAddTaskModalOpen(false);
      setFormData({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        members: [],
      });
      setSelectedMembers([]);
      setErrors({});
      setEmployeeInputValue("");
      setSelectedEmployee(null);
    };

    return (
      <Modal
        isOpen={isAddTaskModalOpen}
        size="2xl"
        onOpenChange={setIsAddTaskModalOpen}
      >
        <ModalContent>
          {(_onClose) => (
            <>
              <ModalHeader className="text-center w-full flex justify-center">
                {t("common.AddAdhocTask") || "Add Adhoc Task"}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t("timeline.treeView.name") || "Task Name"}
                    </label>
                    <Input
                      errorMessage={errors.name}
                      isInvalid={!!errors.name}
                      placeholder={t("timeline.treeView.name") || "Task Name"}
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t("timeline.detailsPanel.description") || "Description"}
                    </label>
                    <Textarea
                      errorMessage={errors.description}
                      isInvalid={!!errors.description}
                      minRows={3}
                      placeholder={
                        t("timeline.detailsPanel.description") || "Description"
                      }
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
                      label={
                        t("timeline.detailsPanel.startDate") || "Start Date"
                      }
                      minValue={today(getLocalTimeZone())}
                      value={
                        formData.startDate
                          ? parseDate(formData.startDate.substring(0, 10))
                          : null
                      }
                      onChange={(date) =>
                        handleInputChange(
                          "startDate",
                          date ? date.toString() : "",
                        )
                      }
                    />

                    <DatePicker
                      isRequired
                      errorMessage={errors.endDate}
                      isInvalid={!!errors.endDate}
                      label={t("timeline.detailsPanel.endDate") || "End Date"}
                      minValue={
                        formData.startDate
                          ? parseDate(formData.startDate.substring(0, 10))
                          : today(getLocalTimeZone())
                      }
                      value={
                        formData.endDate
                          ? parseDate(formData.endDate.substring(0, 10))
                          : null
                      }
                      onChange={(date) =>
                        handleInputChange(
                          "endDate",
                          date ? date.toString() : "",
                        )
                      }
                    />
                  </div>

                  {/* Selected Members Display */}
                  {selectedMembers.length > 0 && (
                    <div
                      style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}
                    >
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
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => {
                                setSelectedMembers(
                                  selectedMembers.filter(
                                    (user) => user.id !== employee.id,
                                  ),
                                );
                              }}
                            >
                              <X size={16} />
                            </Button>
                            <div className="flex flex-col">
                              <span className="text-xs">
                                {employee.gradeName}{" "}
                                {employee.fullName || t("common.none")}
                              </span>
                              <span className="text-xs text-default-400">
                                @{employee.department || t("common.none")}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <label>
                    {t("users.selectEmployee") || "Select Employee"}
                  </label>
                  <Autocomplete
                    isClearable
                    errorMessage={errors.members}
                    inputValue={employeeInputValue}
                    isInvalid={!!errors.members}
                    isLoading={developerSearchLoading}
                    label={t("users.selectEmployee") || "Select Employee"}
                    menuTrigger="input"
                    placeholder={
                      t("users.searchEmployees") || "Search employees"
                    }
                    selectedKey={selectedEmployee?.id.toString()}
                    onInputChange={(value) => {
                      setEmployeeInputValue(value);
                      if (
                        selectedEmployee &&
                        value !==
                          `${selectedEmployee.gradeName} ${selectedEmployee.fullName}`
                      ) {
                        setSelectedEmployee(null);
                      }
                      searchDeveloperEmployees(value);
                      if (errors.members) {
                        setErrors((prev) => ({ ...prev, members: undefined }));
                      }
                    }}
                    onSelectionChange={(key) => {
                      if (key) {
                        const selectedEmployee = developerEmployees.find(
                          (e) => e.id.toString() === key,
                        );

                        if (selectedEmployee) {
                          handleEmployeeSelect(selectedEmployee);
                          setErrors((prev) => ({
                            ...prev,
                            members: undefined,
                          }));
                        }
                      } else {
                        setSelectedEmployee(null);
                        setEmployeeInputValue("");
                      }
                    }}
                  >
                    {developerEmployees.map((employee) => (
                      <AutocompleteItem
                        key={employee.id.toString()}
                        textValue={`${employee.gradeName} ${employee.fullName} ${employee.userName} ${employee.militaryNumber} ${employee.department}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={employee.fullName || t("common.none")}
                            size="sm"
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {employee.gradeName}{" "}
                              {employee.fullName || t("common.none")}
                            </span>
                            <span className="text-sm text-default-500">
                              {employee.militaryNumber || "N/A"}
                            </span>
                            <span className="text-xs text-default-400">
                              @{employee.userName || t("common.none")}
                            </span>
                            <span className="text-xs text-default-400">
                              @{employee.department || t("common.none")}
                            </span>
                          </div>
                        </div>
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>
                </div>
              </ModalBody>
              <ModalFooter className="flex justify-end gap-2">
                <Button color="default" variant="flat" onPress={handleClose}>
                  {t("cancel") || "Cancel"}
                </Button>
                <Button
                  color="primary"
                  isLoading={isCreating}
                  onPress={async () => {
                    if (validateForm()) {
                      const newTask = {
                        name: formData.name,
                        description: formData.description,
                        startDate: formData.startDate,
                        endDate: formData.endDate,
                        priority: 2, // Default to Medium priority
                        assignedMembers: selectedMembers.map((m) =>
                          m.id.toString(),
                        ),
                      };

                      const success = await addAdhocTask(newTask);

                      if (success) {
                        handleClose();
                      }
                    }
                  }}
                >
                  {t("confirm") || "Create Task"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    );
  };

  if (!hasActionsAvailable) {
    return (
      <>
        {null}
        {TaskAssignmentModal()}
      </>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes fadeInOut {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
          }
        `}
      </style>
      <Card
        className={`${className} border-default-200`}
        dir={direction}
        shadow="sm"
      >
        <CardHeader className="flex items-center justify-between pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-foreground">
                {t("dashboard.myActions") || "My Actions"}
              </h3>
              {totalActionsCount > 0 && (
                <Chip
                  className="bg-danger-50 text-danger-600 border border-danger-200 animate-pulse"
                  size="sm"
                  style={{
                    animation: "fadeInOut 2s ease-in-out infinite",
                  }}
                  variant="flat"
                >
                  <AnimatedCounter duration={600} value={totalActionsCount} />
                </Chip>
              )}
            </div>
            <p className="text-sm text-default-500 mt-1">
              {t("developerDashboard.quickActionsSubtitle") ||
                "Assign tasks and code reviews that need your attention"}
            </p>
          </div>
          <Button
            isIconOnly
            className="text-default-400 hover:text-default-600"
            disabled={refreshing}
            size="sm"
            variant="light"
            onPress={refresh}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </CardHeader>

        <Divider className="bg-default-200" />

        <CardBody className="p-6 overflow-hidden">
          {/* Action Buttons and Content */}
          <div className="space-y-4 overflow-hidden">
            {/* Unassigned Tasks Accordion */}
            {unassignedTasks.length > 0 && (
              <div className="space-y-4">
                <Accordion selectionMode="single" variant="splitted">
                  <AccordionItem
                    key="unassigned-tasks"
                    className="border border-default-200 rounded-lg"
                    title={
                      <div className="flex items-center justify-between w-full">
                        <h3 className="text-lg font-semibold text-foreground">
                          {t("developerQuickActions.unassignedTasks") ||
                            "Unassigned Tasks"}
                        </h3>
                        <Chip
                          className="bg-danger-50 text-danger-600"
                          size="sm"
                          variant="flat"
                        >
                          {unassignedTasks.length}
                        </Chip>
                      </div>
                    }
                  >
                    <ScrollShadow
                      className="max-h-64"
                      hideScrollBar={true}
                      size={20}
                    >
                      <div className="space-y-3 pr-2">
                        {unassignedTasks.map((task) => (
                          <CustomAlert
                            key={task.id}
                            description={`${task.projectName} • ${task.requirementName}  • Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                            direction={direction}
                            title={task.title}
                          >
                            <Divider className="bg-default-200 my-3" />
                            <div
                              className={`flex items-center gap-1 ${direction === "rtl" ? "justify-start" : "justify-start"}`}
                            >
                              <Button
                                className="bg-background text-default-700 font-medium border-1 shadow-small"
                                size="sm"
                                startContent={<Code className="w-4 h-4" />}
                                variant="bordered"
                                onPress={() => {
                                  setSelectedTask(task);
                                  setIsTaskModalOpen(true);
                                }}
                              >
                                {t("developerQuickActions.assignTask") ||
                                  "Assign Task"}
                              </Button>
                            </div>
                          </CustomAlert>
                        ))}
                      </div>
                    </ScrollShadow>
                  </AccordionItem>
                </Accordion>
              </div>
            )}

            {/* Overdue Tasks Accordion */}
            {overdueTasks && overdueTasks.length > 0 && (
              <div className="space-y-4">
                <Accordion selectionMode="single" variant="splitted">
                  <AccordionItem
                    key="overdue-tasks"
                    className="border border-default-200 rounded-lg"
                    title={
                      <div className="flex items-center justify-between w-full">
                        <h3 className="text-lg font-semibold text-foreground">
                          {t("developerQuickActions.overdueTasks") ||
                            "Overdue Tasks"}
                        </h3>
                        <Chip
                          className="bg-danger-50 text-danger-600"
                          size="sm"
                          variant="flat"
                        >
                          {overdueTasks?.length || 0}
                        </Chip>
                      </div>
                    }
                  >
                    <ScrollShadow
                      className="max-h-64"
                      hideScrollBar={true}
                      size={20}
                    >
                      <div className="space-y-3 pr-2">
                        {overdueTasks?.map((task) => (
                          <CustomAlert
                            key={task.id}
                            color="danger"
                            description={`${task.projectName} • ${task.assignee?.gradeName} ${task.assignee?.fullName} • ${t("common.progress")}: ${task.progress || 0}% • ${t("common.overdue")} by ${Math.abs(task.daysUntilDeadline)} ${t("completion.days")}`}
                            direction={direction}
                            title={task.name}
                            variant="faded"
                          >
                            <Divider className="bg-default-200 my-3" />
                            <div
                              className={`flex items-center gap-1 ${direction === "rtl" ? "justify-start" : "justify-start"}`}
                            >
                              <Button
                                className="bg-background text-default-700 font-medium border-1 shadow-small"
                                size="sm"
                                startContent={<Clock className="w-4 h-4" />}
                                variant="bordered"
                                onPress={() => {
                                  setSelectedTask(task);
                                  setIsExtendModalOpen(true);
                                }}
                              >
                                {t("common.extendDeadline") ||
                                  "Extend Deadline"}
                              </Button>
                            </div>
                          </CustomAlert>
                        ))}
                      </div>
                    </ScrollShadow>
                  </AccordionItem>
                </Accordion>
              </div>
            )}

            {/* Available Developers Accordion */}
            {availableDevelopers.length > 0 && (
              <div className="space-y-4">
                <Accordion selectionMode="single" variant="splitted">
                  <AccordionItem
                    key="available-developers"
                    className="border border-default-200 rounded-lg"
                    title={
                      <div className="flex items-center justify-between w-full">
                        <h3 className="text-lg font-semibold text-foreground">
                          {t("developerQuickActions.availableDevelopers") ||
                            "Available Team Developers"}
                        </h3>
                        <Chip
                          className="bg-success-50 text-success-600"
                          size="sm"
                          variant="flat"
                        >
                          {availableDevelopers.length}
                        </Chip>
                      </div>
                    }
                  >
                    <ScrollShadow
                      className="max-h-64"
                      hideScrollBar={true}
                      size={20}
                    >
                      <div className="space-y-3 pr-2">
                        {availableDevelopers.map((developer) => (
                          <CustomAlert
                            key={developer.id}
                            color="success"
                            description={`${developer.department}  `}
                            direction={direction}
                            title={`${developer.gradeName} ${developer.fullName}`}
                            variant="faded"
                          >
                            <Divider className="bg-default-200 my-3" />
                            <div
                              className={`flex items-center gap-1 ${direction === "rtl" ? "justify-start" : "justify-start"}`}
                            >
                              <Button
                                className="bg-background text-default-700 font-medium border-1 shadow-small"
                                size="sm"
                                startContent={<User className="w-4 h-4" />}
                                variant="bordered"
                                onPress={() => {
                                  setIsAddTaskModalOpen(true);
                                }}
                              >
                                {t("common.addTask") || "Add Task"}
                              </Button>
                            </div>
                          </CustomAlert>
                        ))}
                      </div>
                    </ScrollShadow>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
      <TaskExtensionModal />
      {TaskAssignmentModal()}
      <AddAdhocTaskModal />
    </>
  );
};

export default DeveloperQuickActions;
