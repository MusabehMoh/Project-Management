import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Skeleton } from "@heroui/skeleton";
import { Alert } from "@heroui/alert";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Tooltip } from "@heroui/tooltip";
import { RefreshCw, AlertTriangle, CheckCircle, Plus } from "lucide-react";

import { useLanguage, Direction } from "@/contexts/LanguageContext";
import ErrorWithRetry from "@/components/ErrorWithRetry";
import TaskCreateModal from "@/components/members-tasks/TaskCreateModal";
import { qcQuickActionsService } from "@/services/api";

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
        }}
        title={title}
        {...props}
      >
        {children}
      </Alert>
    );
  },
);

CustomAlert.displayName = "CustomAlert";

interface QCQuickActionsProps {
  autoRefresh?: boolean;
  onAssignQC?: (task: any, qcId: string) => void;
}

export default function QCQuickActions({
  autoRefresh: _autoRefresh = false,
  onAssignQC: _onAssignQC,
}: QCQuickActionsProps) {
  const { t, direction } = useLanguage();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tasksNeedingReview, setTasksNeedingReview] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTaskForCreate, setSelectedTaskForCreate] = useState<any>(null);

  // Mock data for tasks needing QC review
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await qcQuickActionsService.getQCQuickActions();

      if (response.success && response.data?.tasksNeedingQCAssignment) {
        setTasksNeedingReview(response.data.tasksNeedingQCAssignment);
      } else {
        throw new Error(response.message || "Failed to fetch QC quick actions");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred while fetching tasks";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTasks();
    setIsRefreshing(false);
  };

  const totalActions = tasksNeedingReview.length;

  if (error) {
    return <ErrorWithRetry error={error} onRetry={fetchTasks} />;
  }

  return (
    <Card className="w-full shadow-medium">
      <CardHeader className="flex flex-col items-start px-6 pt-6 pb-4">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold text-foreground">
              {t("qcDashboard.myActions")}
            </h3>
            {!loading && (
              <Chip
                className="animate-pulse"
                color="danger"
                size="sm"
                variant="flat"
              >
                <AnimatedCounter value={totalActions} />
              </Chip>
            )}
          </div>
          <Button
            isIconOnly
            className="min-w-unit-8 w-unit-8 h-unit-8"
            isLoading={isRefreshing}
            size="sm"
            variant="light"
            onPress={handleRefresh}
          >
            {!isRefreshing && <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-sm text-default-500 mt-2">
          {t("qcDashboard.actionsSubtitle")}
        </p>
      </CardHeader>

      <Divider />

      <CardBody className="px-6 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : totalActions === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <CheckCircle className="w-16 h-16 text-success opacity-60 mb-4" />
            <p className="text-default-500 text-sm">
              {t("qcDashboard.noActions")}
            </p>
          </div>
        ) : (
          <Accordion
            className="px-0"
            itemClasses={{
              trigger: "py-3 cursor-pointer",
              title: "text-base font-medium",
            }}
            variant="light"
          >
            <AccordionItem
              key="needsReview"
              aria-label={t("qcDashboard.needsReview")}
              startContent={<AlertTriangle className="w-5 h-5 text-warning" />}
              title={
                <div className="flex items-center gap-2">
                  <span>{t("qcDashboard.needsReview")}</span>
                  <Chip color="warning" size="sm" variant="flat">
                    {tasksNeedingReview.length}
                  </Chip>
                </div>
              }
            >
              <ScrollShadow hideScrollBar className="max-h-64" size={20}>
                <div className="space-y-3 pb-2">
                  {tasksNeedingReview.map((task) => (
                    <CustomAlert
                      key={task.id}
                      className="mb-3"
                      classNames={{
                        title: direction === "rtl" ? "text-right" : "text-left",
                      }}
                      color="warning"
                      direction={direction}
                      title={
                        <div className="flex items-center justify-between gap-2">
                          <span>{task.taskName}</span>
                          <div className="flex items-center gap-2">
                            <Chip
                              color={
                                task.typeId === 1
                                  ? "primary"
                                  : task.typeId === 2
                                    ? "secondary"
                                    : "warning"
                              }
                              size="sm"
                              variant="bordered"
                            >
                              {task.typeId === 1
                                ? t("tasks.type.timeline")
                                : task.typeId === 2
                                  ? t("tasks.type.changeRequest")
                                  : t("tasks.type.adhoc")}
                            </Chip>
                            <Chip
                              color={
                                task.priority === "high"
                                  ? "danger"
                                  : task.priority === "medium"
                                    ? "warning"
                                    : "default"
                              }
                              size="sm"
                              variant="flat"
                            >
                              {t(`priority.${task.priority}`)}
                            </Chip>
                          </div>
                        </div>
                      }
                    >
                      <div className="space-y-3 text-sm">
                        {/* Project & Requirement */}
                        <div className="text-xs">
                          <span className="text-default-500 font-medium">
                            {t("common.project")}:{" "}
                          </span>
                          <span className="text-default-700">
                            {task.projectName}
                          </span>
                          <span className="text-default-500 font-medium mx-2">
                            • {t("requirements.requirement")}:{" "}
                          </span>
                          <span className="text-default-700">
                            {task.requirementName}
                          </span>
                        </div>

                        <Divider className="bg-default-200 my-3" />

                        {/* Create Task Button */}
                        <Tooltip content={t("task.createTaskHint")}>
                          <Button
                            className="w-full"
                            color="primary"
                            size="sm"
                            startContent={<Plus className="w-4 h-4" />}
                            variant="solid"
                            onPress={() => {
                              setSelectedTaskForCreate(task);
                              setIsCreateModalOpen(true);
                            }}
                          >
                            {t("task.createTask")}
                          </Button>
                        </Tooltip>
                      </div>
                    </CustomAlert>
                  ))}
                </div>
              </ScrollShadow>
            </AccordionItem>
          </Accordion>
        )}
      </CardBody>
      <TaskCreateModal
        isOpen={isCreateModalOpen}
        parentTask={selectedTaskForCreate}
        onOpenChange={setIsCreateModalOpen}
        onTaskCreated={() => {
          fetchTasks(); // Refresh tasks after creating new one
        }}
      />
    </Card>
  );
}
