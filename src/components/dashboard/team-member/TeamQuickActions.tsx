import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Skeleton } from "@heroui/skeleton";
import { Select, SelectItem } from "@heroui/select";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Alert } from "@heroui/alert";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { addToast } from "@heroui/toast";
import { CheckCircle, RefreshCw, AlertTriangle, Play, Pause } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useTeamQuickActions } from "@/hooks/useTeamQuickActions";

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

// Custom Alert Component
const CustomAlert = React.forwardRef<
  HTMLDivElement,
  {
    title: string;
    description?: string;
    children?: React.ReactNode;
    variant?: string;
    color?: string;
    className?: string;
    direction?: string;
  }
>(
  (
    {
      title,
      description,
      children,
      variant = "faded",
      color = "danger",
      className = "",
      direction = "ltr",
    },
    ref,
  ) => {
    const getBorderColor = (color: string) => {
      switch (color) {
        case "success":
          return "before:bg-success";
        case "warning":
          return "before:bg-warning";
        case "primary":
          return "before:bg-primary";
        case "danger":
        default:
          return "before:bg-danger";
      }
    };

    const isRTL = direction === "rtl";

    return (
      <div
        ref={ref}
        className={`relative p-4 rounded-lg border border-default-200 bg-default-50 ${className}
          before:content-[''] before:absolute before:${isRTL ? "right" : "left"}-0 before:top-0 before:bottom-0 before:w-1 before:rounded-${isRTL ? "r" : "l"}-lg ${getBorderColor(color)}`}
      >
        <div className={`${isRTL ? "pr-3" : "pl-3"}`}>
          <h4 className="text-sm font-semibold text-foreground mb-1">
            {title}
          </h4>
          {description && (
            <p className="text-xs text-default-500">{description}</p>
          )}
          {children}
        </div>
      </div>
    );
  },
);

interface TeamQuickActionsProps {
  className?: string;
  onTaskUpdate?: (taskId: number, newStatus: string) => Promise<void>;
}

export default function TeamQuickActions({
  className = "",
  onTaskUpdate,
}: TeamQuickActionsProps) {
  const { t, direction } = useLanguage();
  const { actions, loading, error, refresh, updateTaskStatus } =
    useTeamQuickActions();

  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  const getPriorityColor = (priorityId: number | null | undefined) => {
    switch (priorityId) {
      case 3: // High
        return "danger";
      case 2: // Medium
        return "warning";
      case 1: // Low
        return "default";
      default:
        return "default";
    }
  };

  const getPriorityText = (priorityId: number | null | undefined) => {
    switch (priorityId) {
      case 3: // High
        return t("priority.high");
      case 2: // Medium
        return t("priority.medium");
      case 1: // Low
        return t("priority.low");
      default:
        return t("priority.unknown");
    }
  };

  const getStatusColor = (statusId: number | null | undefined) => {
    switch (statusId) {
      case 5: // Completed
        return "success";
      case 2: // In Progress
        return "primary";
      case 1: // ToDo/Pending
        return "warning";
      case 6: // On Hold
        return "danger";
      case 3: // In Review
        return "secondary";
      case 4: // Rework
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusText = (statusId: number | null | undefined) => {
    switch (statusId) {
      case 5: // Completed
        return t("teamDashboard.status.completed");
      case 2: // In Progress
        return t("teamDashboard.status.inProgress");
      case 1: // ToDo
        return t("teamDashboard.status.pending");
      case 6: // On Hold
        return t("teamDashboard.status.blocked");
      case 3: // In Review
        return t("teamDashboard.status.inReview");
      case 4: // Rework
        return t("teamDashboard.status.rework");
      default:
        return t("teamDashboard.status.unknown");
    }
  };

  const handleStartTask = (task: any) => {
    setSelectedTask(task);
    setSelectedStatus("In Progress");
    setIsUpdateModalOpen(true);
  };

  const handlePauseTask = (task: any) => {
    setSelectedTask(task);
    setSelectedStatus("Pending");
    setIsUpdateModalOpen(true);
  };

  const handleCompleteTask = (task: any) => {
    setSelectedTask(task);
    setSelectedStatus("Completed");
    setIsUpdateModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedTask || !selectedStatus) return;

    setIsUpdating(true);

    try {
      await updateTaskStatus(selectedTask.id, selectedStatus);

      addToast({
        title: t("teamDashboard.quickActions.updateSuccess"),
        description: t("teamDashboard.quickActions.updateSuccessDesc"),
        color: "success",
      });

      if (onTaskUpdate) {
        await onTaskUpdate(selectedTask.id, selectedStatus);
      }

      setIsUpdateModalOpen(false);
      await refresh();
    } catch (err) {
      console.error("Failed to update task:", err);
      addToast({
        title: t("teamDashboard.quickActions.updateError"),
        description: t("teamDashboard.quickActions.updateErrorDesc"),
        color: "danger",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const statusOptions = [
    { value: "Pending", label: t("teamDashboard.status.pending") },
    { value: "In Progress", label: t("teamDashboard.status.inProgress") },
    { value: "In Review", label: t("teamDashboard.status.inReview") },
    { value: "Rework", label: t("teamDashboard.status.rework") },
    { value: "Completed", label: t("teamDashboard.status.completed") },
    { value: "On Hold", label: t("teamDashboard.status.blocked") },
  ];

  if (loading) {
    return (
      <Card
        className={`${className} border-default-200`}
        dir={direction}
        shadow="sm"
      >
        <CardHeader className="px-6 py-4">
          <div className="space-y-2 w-full">
            <Skeleton className="h-6 w-48 rounded" />
            <Skeleton className="h-4 w-64 rounded" />
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="px-6 py-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-4 border border-default-200 rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-3/4 rounded" />
                </div>
              </div>
            </div>
          ))}
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
            {t("common.error")}
          </p>
          <p className="text-sm text-default-500 mb-4">{error.message}</p>
          <Button size="sm" variant="flat" onPress={refresh}>
            {t("common.retry")}
          </Button>
        </CardBody>
      </Card>
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
                {t("teamDashboard.quickActions.title")}
              </h3>
              {actions.length > 0 && (
                <Chip
                  className="bg-primary-50 text-primary-600 border border-primary-200 animate-pulse"
                  size="sm"
                  style={{
                    animation: "fadeInOut 2s ease-in-out infinite",
                  }}
                  variant="flat"
                >
                  <AnimatedCounter duration={600} value={actions.length} />
                </Chip>
              )}
            </div>
            <p className="text-sm text-default-500 mt-1">
              {t("teamDashboard.quickActions.subtitle")}
            </p>
          </div>
          <Button
            isIconOnly
            className="text-default-400 hover:text-default-600"
            disabled={loading}
            size="sm"
            variant="light"
            onPress={refresh}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>

        <Divider className="bg-default-200" />

        <CardBody className="p-6 overflow-hidden">
          {actions.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-success opacity-50" />
              <p className="text-default-500 mb-2">
                {t("teamDashboard.quickActions.noActions")}
              </p>
              <p className="text-sm text-default-400">
                {t("teamDashboard.quickActions.noActionsDesc")}
              </p>
            </div>
          ) : (
            <div className="space-y-4 overflow-hidden">
              <Accordion selectionMode="single" variant="splitted">
                <AccordionItem
                  key="my-tasks"
                  className="border border-default-200 rounded-lg"
                  title={
                    <div className="flex items-center justify-between w-full">
                      <h3 className="text-lg font-semibold text-foreground">
                        {t("teamDashboard.quickActions.myActiveTasks")}
                      </h3>
                      <Chip
                        className="bg-primary-50 text-primary-600"
                        size="sm"
                        variant="flat"
                      >
                        {actions.length}
                      </Chip>
                    </div>
                  }
                >
                  <ScrollShadow
                    className="max-h-96"
                    hideScrollBar={true}
                    size={20}
                  >
                    <div className="space-y-3 pr-2">
                      {actions.map((action: any) => (
                        <CustomAlert
                          key={action.id}
                          color={
                            action.statusId === 2
                              ? "primary"
                              : action.statusId === 1
                                ? "warning"
                                : "danger"
                          }
                          description={
                            action.project?.applicationName
                              ? `${action.project.applicationName} • ${getStatusText(action.statusId)}`
                              : getStatusText(action.statusId)
                          }
                          direction={direction}
                          title={action.name || t("teamDashboard.quickActions.untitled")}
                          variant="faded"
                        >
                          <div className="flex items-center gap-2 mt-3 mb-3">
                            <Chip
                              color={getPriorityColor(action.priorityId)}
                              size="sm"
                              variant="flat"
                            >
                              {getPriorityText(action.priorityId)}
                            </Chip>
                            <Chip
                              className="capitalize"
                              color={getStatusColor(action.statusId)}
                              size="sm"
                              variant="flat"
                            >
                              {getStatusText(action.statusId)}
                            </Chip>
                          </div>

                          <Divider className="bg-default-200 my-3" />

                          <div className="flex items-center gap-2">
                            {action.statusId !== 2 && (
                              <Button
                                className="bg-background text-default-700 font-medium border-1 shadow-small"
                                size="sm"
                                startContent={<Play className="w-4 h-4" />}
                                variant="bordered"
                                onPress={() => handleStartTask(action)}
                              >
                                {t("teamDashboard.quickActions.start")}
                              </Button>
                            )}
                            {action.statusId === 2 && (
                              <>
                                <Button
                                  className="bg-background text-warning-600 font-medium border-1 border-warning-200 shadow-small"
                                  size="sm"
                                  startContent={<Pause className="w-4 h-4" />}
                                  variant="bordered"
                                  onPress={() => handlePauseTask(action)}
                                >
                                  {t("teamDashboard.quickActions.pause")}
                                </Button>
                                <Button
                                  className="bg-background text-success-600 font-medium border-1 border-success-200 shadow-small"
                                  size="sm"
                                  startContent={<CheckCircle className="w-4 h-4" />}
                                  variant="bordered"
                                  onPress={() => handleCompleteTask(action)}
                                >
                                  {t("teamDashboard.quickActions.complete")}
                                </Button>
                              </>
                            )}
                          </div>
                        </CustomAlert>
                      ))}
                    </div>
                  </ScrollShadow>
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Update Status Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        scrollBehavior="inside"
        onClose={() => !isUpdating && setIsUpdateModalOpen(false)}
      >
        <ModalContent>
          <ModalHeader>
            {t("teamDashboard.quickActions.updateTaskStatus")}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-default-500 mb-1">
                  {t("teamDashboard.quickActions.taskName")}
                </p>
                <p className="font-semibold">{selectedTask?.name}</p>
              </div>
              <Select
                isRequired
                label={t("teamDashboard.quickActions.newStatus")}
                placeholder={t("teamDashboard.quickActions.selectStatus")}
                selectedKeys={selectedStatus ? [selectedStatus] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;

                  setSelectedStatus(selected);
                }}
              >
                {statusOptions.map((option) => (
                  <SelectItem key={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              isDisabled={isUpdating}
              variant="light"
              onPress={() => setIsUpdateModalOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              color="primary"
              isDisabled={!selectedStatus}
              isLoading={isUpdating}
              onPress={handleUpdateStatus}
            >
              {t("common.update")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
