import React, { useState, useEffect } from "react";
import { today, getLocalTimeZone, CalendarDate } from "@internationalized/date";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";
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
import { Accordion, AccordionItem } from "@heroui/accordion";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { addToast } from "@heroui/toast";
import { RefreshCw, AlertTriangle, Code, User, Clock } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useDeveloperQuickActions } from "@/hooks/useDeveloperQuickActionsV2";
import { useTeamSearch } from "@/hooks/useTeamSearch";
import { MemberSearchResult } from "@/types/timeline";

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

// Custom Alert Component with dynamic color styling
const CustomAlert = React.forwardRef(
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
  autoRefresh = true,
  className = "",
  onAssignDeveloper,
  onAssignReviewer,
}) => {
  const { t, direction } = useLanguage();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isPRModalOpen, setIsPRModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
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
    availableDevelopers.length;

  if (loading) {
    return (
      <Card
        className={`${className} border-default-200`}
        dir={direction}
        shadow="sm"
      >
        <CardBody className="flex items-center justify-center py-8">
          <Spinner color="default" size="md" />
          <p className="mt-3 text-default-500">
            {t("common.loading") || "Loading..."}
          </p>
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
        <CardBody className="text-center py-6">
          <AlertTriangle className="h-8 w-8 text-default-400 mx-auto mb-3" />
          <p className="font-medium text-foreground mb-2">
            {t("common.error") || "Error"}
          </p>
          <p className="text-sm text-default-500 mb-4">{error}</p>
          <Button size="sm" variant="flat" onPress={refresh}>
            {t("common.retry") || "Retry"}
          </Button>
        </CardBody>
      </Card>
    );
  }

  if (!hasActionsAvailable) {
    return (
      <>
        {null}
        <TaskAssignmentModal />
        <CodeReviewAssignmentModal />
      </>
    );
  }

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
    if (selectedPR && selectedDevelopers.length > 0 && onAssignReviewer) {
      try {
        console.log(
          "DeveloperQuickActions: Starting code review assignment...",
          {
            prId: selectedPR.id,
            reviewerIds: selectedDevelopers.map((d) => d.id.toString()),
            prTitle: selectedPR.title,
          },
        );

        // Assign each reviewer to the PR
        for (const reviewer of selectedDevelopers) {
          await onAssignReviewer(selectedPR, reviewer.id.toString());
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
      } catch (error) {
        console.error(
          "DeveloperQuickActions: Failed to assign reviewer:",
          error,
        );

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

  const TaskExtensionModal = () => {
    const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(null);
    const [extensionReason, setExtensionReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get minimum date (today)
    const minDate = today(getLocalTimeZone());

    const handleExtendTask = async () => {
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
        setIsExtendModalOpen(false);
        setSelectedTask(null);
      } catch (error) {
        addToast({
          title: t("common.error") || "Error",
          description:
            error instanceof Error ? error.message : "Failed to extend task",
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
              Task: <strong>{selectedTask?.name}</strong>
            </p>
            <p className="text-sm text-default-600 mb-4">
              Current Deadline:{" "}
              <strong>
                {selectedTask?.endDate
                  ? new Date(selectedTask.endDate).toLocaleDateString()
                  : "N/A"}
              </strong>
            </p>

            <div className="space-y-4">
              <DatePicker
                isRequired
                showMonthAndYearPickers
                description={
                  t("common.selectNewDate") || "Select a new deadline date"
                }
                label={t("common.newDeadline") || "New Deadline"}
                minValue={minDate}
                value={selectedDate}
                onChange={setSelectedDate}
              />

              <Textarea
                isRequired
                label={t("common.reason") || "Reason for Extension"}
                maxRows={6}
                minRows={3}
                placeholder={
                  t("common.reasonPlaceholder") ||
                  "Please provide a reason for extending this task..."
                }
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
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
              disabled={
                !selectedDate || !extensionReason.trim() || isSubmitting
              }
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

  const TaskAssignmentModal = () => (
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
            isClearable
            inputValue={developerInputValue}
            isLoading={developerSearchLoading}
            items={developerEmployees.filter(
              (emp) =>
                !selectedDevelopers.some((selected) => selected.id === emp.id),
            )}
            label={
              t("developerQuickActions.selectDeveloper") || "Select Developers"
            }
            menuTrigger="input"
            placeholder={
              t("developerQuickActions.chooseDeveloper") ||
              "Search and select developers"
            }
            onInputChange={(value) => {
              setDeveloperInputValue(value);
              // Search for developers
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
                  setDeveloperInputValue("");
                }
              }
            }}
          >
            {(developer) => (
              <AutocompleteItem
                key={developer.id}
                textValue={`${developer.fullName} - ${developer.militaryNumber}`}
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

  const CodeReviewAssignmentModal = () => (
    <Modal
      dir={direction}
      isOpen={isPRModalOpen}
      onOpenChange={setIsPRModalOpen}
    >
      <ModalContent>
        <ModalHeader>
          {t("developerQuickActions.assignReviewer") || "Assign Reviewer"}
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-default-600 mb-4">
            {t("developerQuickActions.assignReviewerTo") ||
              "Assign reviewers to"}
            : {selectedPR?.title}
          </p>

          {/* Selected Developers Display */}
          {selectedDevelopers.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-foreground mb-2">
                {t("developerQuickActions.selectedReviewers") ||
                  "Selected Reviewers"}
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
            isClearable
            inputValue={developerInputValue}
            isLoading={developerSearchLoading}
            items={developerEmployees.filter(
              (emp) =>
                !selectedDevelopers.some((selected) => selected.id === emp.id),
            )}
            label={
              t("developerQuickActions.selectReviewer") || "Select Reviewers"
            }
            menuTrigger="input"
            placeholder={
              t("developerQuickActions.chooseReviewer") ||
              "Search and select reviewers"
            }
            onInputChange={(value) => {
              setDeveloperInputValue(value);
              // Search for developers
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
                  setDeveloperInputValue("");
                }
              }
            }}
          >
            {(developer) => (
              <AutocompleteItem
                key={developer.id}
                textValue={`${developer.fullName} - ${developer.militaryNumber}`}
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
          <Button variant="flat" onPress={handlePRCancel}>
            {t("common.cancel") || "Cancel"}
          </Button>
          <Button
            color="primary"
            disabled={selectedDevelopers.length === 0}
            onPress={handlePRAssign}
          >
            {t("developerQuickActions.assign") || "Assign"} (
            {selectedDevelopers.length})
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

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
                            description={`${task.projectName} • ${task.owningUnit} • ${task.estimatedHours}h • Due: ${new Date(task.dueDate).toLocaleDateString()}`}
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

            {/* Almost Completed Tasks Accordion */}
            {almostCompletedTasks.length > 0 && (
              <div className="space-y-4">
                <Accordion selectionMode="single" variant="splitted">
                  <AccordionItem
                    key="almost-completed-tasks"
                    className="border border-default-200 rounded-lg"
                    title={
                      <div className="flex items-center justify-between w-full">
                        <h3 className="text-lg font-semibold text-foreground">
                          {t("developerQuickActions.almostCompletedTasks") ||
                            "Almost Completed Tasks"}
                        </h3>
                        <Chip
                          className="bg-warning-50 text-warning-600"
                          size="sm"
                          variant="flat"
                        >
                          {almostCompletedTasks.length}
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
                        {almostCompletedTasks.map((task) => (
                          <CustomAlert
                            key={task.id}
                            color={task.isOverdue ? "danger" : "warning"}
                            description={`${task.projectName} • ${task.sprintName} • ${task.assigneeName || "Unassigned"} • Progress: ${task.progress || 0}% • ${task.isOverdue ? "Overdue" : `Due in ${task.daysUntilDeadline} days`}`}
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
                                {t("common.extend") || "Extend Deadline"}
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
                            key={developer.userId}
                            color="success"
                            description={`${developer.department} • ${developer.gradeName} • ${developer.totalTasks} tasks • ${developer.skills.join(", ")}`}
                            direction={direction}
                            title={developer.fullName}
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
                                  // Navigate to team workload page or developer details
                                  window.location.href = `/team-workload`;
                                }}
                              >
                                {t("common.viewDetails") || "View Details"}
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
      <TaskAssignmentModal />
      <CodeReviewAssignmentModal />
    </>
  );
};

export default DeveloperQuickActions;
