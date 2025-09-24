import React, { useState, useCallback, useEffect } from "react";

import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";
import { Alert } from "@heroui/alert";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { addToast } from "@heroui/toast";
import {
  RefreshCw,
  AlertTriangle,
  Code,
  GitPullRequest,
  User,
} from "lucide-react";

import { useDeveloperQuickActions } from "@/hooks/useDeveloperQuickActions";
import { useTeamSearch } from "@/hooks/useTeamSearch";
import { MemberSearchResult } from "@/types/timeline";

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 1000 }: { value: number; duration?: number }) => {
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
      const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutCubic);
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [value, duration, displayValue]);

  return (
    <span className="tabular-nums">
      {displayValue}
    </span>
  );
};

// Custom Alert Component with dynamic color styling
const CustomAlert = React.forwardRef(
  (
    {title, children, variant = "faded", color = "danger", className, classNames = {}, direction, ...props},
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
            isRTL ? "before:right-0 before:top-[-1px] before:bottom-[-1px] before:w-1" : "before:left-0 before:top-[-1px] before:bottom-[-1px] before:w-1",
            isRTL ? "rounded-r-none border-r-0" : "rounded-l-none border-l-0",
            getBorderColor(color),
            classNames.base,
            className,
          ].filter(Boolean).join(" "),
          mainWrapper: ["pt-1 flex items-start justify-between", classNames.mainWrapper].filter(Boolean).join(" "),
          iconWrapper: ["dark:bg-transparent", classNames.iconWrapper].filter(Boolean).join(" "),
          title: [isRTL ? "text-right" : "text-left", "text-sm font-medium", classNames.title].filter(Boolean).join(" "),
          description: [isRTL ? "text-right" : "text-left", "text-xs text-default-500 mt-1", classNames.description].filter(Boolean).join(" "),
        }}
        color={color}
        title={title}
        variant={variant}
        dir={direction}
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
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [selectedPR, setSelectedPR] = useState<any>(null);
  const [selectedDevelopers, setSelectedDevelopers] = useState<MemberSearchResult[]>([]);
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
    pendingCodeReviews,
    availableDevelopers,
    loading,
    refreshing,
    error,
    hasActionsAvailable,
    refresh,
  } = useDeveloperQuickActions({
    autoRefresh: false, // Disable auto-refresh to prevent constant loading
    refreshInterval: 30000,
  });

  // Calculate total count of all actions
  const totalActionsCount = unassignedTasks.length + pendingCodeReviews.length + availableDevelopers.length;

  if (loading) {
    return (
      <Card className={`${className} border-default-200`} shadow="sm" dir={direction}>
        <CardBody className="flex items-center justify-center py-8">
          <Spinner color="default" size="md" />
          <p className="mt-3 text-default-500">{t("common.loading") || "Loading..."}</p>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${className} border-default-200`} shadow="sm" dir={direction}>
        <CardBody className="text-center py-6">
          <AlertTriangle className="h-8 w-8 text-default-400 mx-auto mb-3" />
          <p className="font-medium text-foreground mb-2">{t("common.error") || "Error"}</p>
          <p className="text-sm text-default-500 mb-4">{error}</p>
          <Button
            size="sm"
            variant="flat"
            onPress={refresh}
          >
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
    if (selectedTask && selectedDevelopers.length > 0 && onAssignDeveloper) {
      try {
        console.log("DeveloperQuickActions: Starting task assignment...", {
          taskId: selectedTask.id,
          developerIds: selectedDevelopers.map(d => d.id.toString()),
          taskTitle: selectedTask.title,
        });
        
        // Assign each developer to the task
        for (const developer of selectedDevelopers) {
          await onAssignDeveloper(selectedTask, developer.id.toString());
        }
        
        console.log("DeveloperQuickActions: Task assignment completed, refreshing data...");
        
        // Show success toast
        addToast({
          title: t("developerQuickActions.assignmentSuccess") || "Assignment Successful",
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
        
        // Refresh the unassigned tasks list
        await refresh();
        
        console.log("DeveloperQuickActions: Data refreshed successfully");
      } catch (error) {
        console.error("DeveloperQuickActions: Failed to assign developer:", error);
        
        // Show error toast
        addToast({
          title: t("developerQuickActions.assignmentError") || "Assignment Failed",
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
        console.log("DeveloperQuickActions: Starting code review assignment...", {
          prId: selectedPR.id,
          reviewerIds: selectedDevelopers.map(d => d.id.toString()),
          prTitle: selectedPR.title,
        });
        
        // Assign each reviewer to the PR
        for (const reviewer of selectedDevelopers) {
          await onAssignReviewer(selectedPR, reviewer.id.toString());
        }
        
        // Show success toast
        addToast({
          title: t("developerQuickActions.reviewAssignmentSuccess") || "Review Assignment Successful",
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
        console.error("DeveloperQuickActions: Failed to assign reviewer:", error);
        
        // Show error toast
        addToast({
          title: t("developerQuickActions.reviewAssignmentError") || "Review Assignment Failed",
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

  const TaskAssignmentModal = () => (
    <Modal
      isOpen={isTaskModalOpen}
      onOpenChange={setIsTaskModalOpen}
      dir={direction}
    >
      <ModalContent>
        <ModalHeader>
          {t("developerQuickActions.assignDeveloper") || "Assign Developer"}
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-default-600 mb-4">
            {t("developerQuickActions.assignDeveloperTo") || "Assign developers to"}: {selectedTask?.title}
          </p>
          
          {/* Selected Developers Display */}
          {selectedDevelopers.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-foreground mb-2">
                {t("developerQuickActions.selectedDevelopers") || "Selected Developers"}:
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedDevelopers.map((developer) => (
                  <Chip
                    key={developer.id}
                    color="primary"
                    variant="flat"
                    onClose={() => {
                      setSelectedDevelopers(prev => prev.filter(d => d.id !== developer.id));
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
            items={developerEmployees.filter(emp => !selectedDevelopers.some(selected => selected.id === emp.id))}
            label={t("developerQuickActions.selectDeveloper") || "Select Developers"}
            placeholder={t("developerQuickActions.chooseDeveloper") || "Search and select developers"}
            inputValue={developerInputValue}
            isLoading={developerSearchLoading}
            menuTrigger="input"
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

                if (developer && !selectedDevelopers.some(selected => selected.id === developer.id)) {
                  setSelectedDevelopers(prev => [...prev, developer]);
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
          <Button
            variant="flat"
            onPress={handleTaskCancel}
          >
            {t("common.cancel") || "Cancel"}
          </Button>
          <Button
            color="primary"
            onPress={handleTaskAssign}
            disabled={selectedDevelopers.length === 0}
          >
            {t("developerQuickActions.assign") || "Assign"} ({selectedDevelopers.length})
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

  const CodeReviewAssignmentModal = () => (
    <Modal
      isOpen={isPRModalOpen}
      onOpenChange={setIsPRModalOpen}
      dir={direction}
    >
      <ModalContent>
        <ModalHeader>
          {t("developerQuickActions.assignReviewer") || "Assign Reviewer"}
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-default-600 mb-4">
            {t("developerQuickActions.assignReviewerTo") || "Assign reviewers to"}: {selectedPR?.title}
          </p>
          
          {/* Selected Developers Display */}
          {selectedDevelopers.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-foreground mb-2">
                {t("developerQuickActions.selectedReviewers") || "Selected Reviewers"}:
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedDevelopers.map((developer) => (
                  <Chip
                    key={developer.id}
                    color="primary"
                    variant="flat"
                    onClose={() => {
                      setSelectedDevelopers(prev => prev.filter(d => d.id !== developer.id));
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
            items={developerEmployees.filter(emp => !selectedDevelopers.some(selected => selected.id === emp.id))}
            label={t("developerQuickActions.selectReviewer") || "Select Reviewers"}
            placeholder={t("developerQuickActions.chooseReviewer") || "Search and select reviewers"}
            inputValue={developerInputValue}
            isLoading={developerSearchLoading}
            menuTrigger="input"
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

                if (developer && !selectedDevelopers.some(selected => selected.id === developer.id)) {
                  setSelectedDevelopers(prev => [...prev, developer]);
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
          <Button
            variant="flat"
            onPress={handlePRCancel}
          >
            {t("common.cancel") || "Cancel"}
          </Button>
          <Button
            color="primary"
            onPress={handlePRAssign}
            disabled={selectedDevelopers.length === 0}
          >
            {t("developerQuickActions.assign") || "Assign"} ({selectedDevelopers.length})
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
      <Card className={`${className} border-default-200`} shadow="sm" dir={direction}>
        <CardHeader className="flex items-center justify-between pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-foreground">
                {t("developerDashboard.quickActions") || "Developer Actions"}
              </h3>
              {totalActionsCount > 0 && (
                <Chip 
                  size="sm" 
                  variant="flat" 
                  className="bg-danger-50 text-danger-600 border border-danger-200 animate-pulse"
                  style={{
                    animation: 'fadeInOut 2s ease-in-out infinite'
                  }}
                >
                  <AnimatedCounter value={totalActionsCount} duration={600} />
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
            size="sm"
            variant="light"
            className="text-default-400 hover:text-default-600"
            disabled={refreshing}
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
                    title={
                      <div className="flex items-center justify-between w-full">
                        <h3 className="text-lg font-semibold text-foreground">
                          {t("developerQuickActions.unassignedTasks") || "Unassigned Tasks"}
                        </h3>
                        <Chip size="sm" variant="flat" className="bg-danger-50 text-danger-600">
                          {unassignedTasks.length}
                        </Chip>
                      </div>
                    }
                    className="border border-default-200 rounded-lg"
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
                            title={task.title}
                            description={`${task.projectName} • ${task.owningUnit} • ${task.estimatedHours}h • Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                            direction={direction}
                          >
                            <Divider className="bg-default-200 my-3" />
                            <div className={`flex items-center gap-1 ${direction === "rtl" ? "justify-start" : "justify-start"}`}>
                              <Button
                                className="bg-background text-default-700 font-medium border-1 shadow-small"
                                size="sm"
                                variant="bordered"
                                startContent={<Code className="w-4 h-4" />}
                                onPress={() => {
                                  setSelectedTask(task);
                                  setIsTaskModalOpen(true);
                                }}
                              >
                                {t("developerQuickActions.assignTask") || "Assign Task"}
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

            {/* Pending Code Reviews Accordion */}
            {pendingCodeReviews.length > 0 && (
              <div className="space-y-4">
                <Accordion selectionMode="single" variant="splitted">
                  <AccordionItem
                    key="pending-code-reviews"
                    title={
                      <div className="flex items-center justify-between w-full">
                        <h3 className="text-lg font-semibold text-foreground">
                          {t("developerQuickActions.pendingCodeReviews") || "Pending Code Reviews"}
                        </h3>
                        <Chip size="sm" variant="flat" className="bg-warning-50 text-warning-600">
                          {pendingCodeReviews.length}
                        </Chip>
                      </div>
                    }
                    className="border border-default-200 rounded-lg"
                  >
                    <ScrollShadow 
                      className="max-h-64" 
                      hideScrollBar={true}
                      size={20}
                    >
                      <div className="space-y-3 pr-2">
                        {pendingCodeReviews.map((pr) => (
                          <CustomAlert
                            key={pr.id}
                            title={pr.title}
                            description={`${pr.author} • ${pr.repository} • +${pr.linesAdded}/-${pr.linesDeleted} • ${pr.filesChanged} files`}
                            direction={direction}
                            variant="faded"
                            color="warning"
                          >
                            <Divider className="bg-default-200 my-3" />
                            <div className={`flex items-center gap-1 ${direction === "rtl" ? "justify-start" : "justify-start"}`}>
                              <Button
                                className="bg-background text-default-700 font-medium border-1 shadow-small"
                                size="sm"
                                variant="bordered"
                                startContent={<GitPullRequest className="w-4 h-4" />}
                                onPress={() => {
                                  setSelectedPR(pr);
                                  setIsPRModalOpen(true);
                                }}
                              >
                                {t("developerQuickActions.assignReviewer") || "Assign Reviewer"}
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
                    title={
                      <div className="flex items-center justify-between w-full">
                        <h3 className="text-lg font-semibold text-foreground">
                          {t("developerQuickActions.availableDevelopers") || "Available Team Developers"}
                        </h3>
                        <Chip size="sm" variant="flat" className="bg-success-50 text-success-600">
                          {availableDevelopers.length}
                        </Chip>
                      </div>
                    }
                    className="border border-default-200 rounded-lg"
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
                            title={developer.fullName}
                            description={`${developer.department} • ${developer.gradeName} • ${developer.totalTasks} tasks • ${developer.skills.join(", ")}`}
                            direction={direction}
                            variant="faded"
                            color="success"
                          >
                            <Divider className="bg-default-200 my-3" />
                            <div className={`flex items-center gap-1 ${direction === "rtl" ? "justify-start" : "justify-start"}`}>
                              <Button
                                className="bg-background text-default-700 font-medium border-1 shadow-small"
                                size="sm"
                                variant="bordered"
                                startContent={<User className="w-4 h-4" />}
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
      <TaskAssignmentModal />
      <CodeReviewAssignmentModal />
    </>
  );
};

export default DeveloperQuickActions;