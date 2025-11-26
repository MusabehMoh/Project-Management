import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Skeleton } from "@heroui/skeleton";
import { Alert } from "@heroui/alert";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { RefreshCw, CheckCircle, Plus } from "lucide-react";

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
        color={color as any}
        dir={direction}
        title={title}
        variant="faded"
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
    <>
      <style>
        {`
          @keyframes fadeInOut {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
          }
        `}
      </style>
      <Card className="w-full shadow-medium border-default-200" dir={direction}>
        <CardHeader className="flex items-center justify-between pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-foreground">
                {t("qcDashboard.myActions")}
              </h3>
              {!loading && totalActions > 0 && (
                <Chip
                  className="bg-danger-50 text-danger-600 border border-danger-200"
                  size="sm"
                  style={{
                    animation: "fadeInOut 2s ease-in-out infinite",
                  }}
                  variant="flat"
                >
                  <AnimatedCounter duration={600} value={totalActions} />
                </Chip>
              )}
            </div>
            <p className="text-sm text-default-500 mt-1">
              {t("qcDashboard.actionsSubtitle")}
            </p>
          </div>
          <Button
            isIconOnly
            className="text-default-400 hover:text-default-600"
            disabled={isRefreshing}
            size="sm"
            variant="light"
            onPress={handleRefresh}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </CardHeader>

        <Divider className="bg-default-200" />

        <CardBody className="py-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : totalActions === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="w-16 h-16 text-success opacity-60 mb-4" />
              <p className="text-default-500 text-sm">
                {t("qcDashboard.noActions")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Accordion selectionMode="single" variant="splitted">
                <AccordionItem
                  key="needsReview"
                  className="border border-default-200 rounded-lg"
                  title={
                    <div className="flex items-center justify-between w-full">
                      <h3 className="text-lg font-semibold text-foreground">
                        {t("qcDashboard.needsReview")}
                      </h3>
                      <Chip
                        className="bg-danger-50 text-danger-600"
                        size="sm"
                        variant="flat"
                      >
                        {tasksNeedingReview.length}
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
                      {tasksNeedingReview.map((task) => (
                        <CustomAlert
                          key={task.id}
                          color="danger"
                          description={`${task.projectName} • ${task.requirementName}`}
                          direction={direction}
                          title={task.taskName}
                        >
                          <Divider className="bg-default-200 my-3" />

                          <div
                            className={`flex items-center gap-1 ${direction === "rtl" ? "justify-start" : "justify-start"}`}
                          >
                            <Button
                              className="bg-background text-default-700 font-medium border-1 shadow-small"
                              size="sm"
                              startContent={<Plus className="w-4 h-4" />}
                              variant="bordered"
                              onPress={() => {
                                setSelectedTaskForCreate(task);
                                setIsCreateModalOpen(true);
                              }}
                            >
                              {t("tasks.assignQC")}
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
    </>
  );
}
