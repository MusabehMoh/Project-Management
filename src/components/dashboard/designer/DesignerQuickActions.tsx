import React, { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Alert } from "@heroui/alert";
import { Divider } from "@heroui/divider";
import { RefreshCw, Palette, CheckCircle, Clock } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";

// Mock data for Designer Quick Actions
const mockDesignTasks = [
  {
    id: "1",
    name: "Landing Page Redesign",
    project: "E-Commerce Platform",
    priority: "high",
    status: "in-progress",
    dueDate: "2025-10-15",
  },
  {
    id: "2",
    name: "Mobile App UI Kit",
    project: "Admin Panel",
    priority: "medium",
    status: "review",
    dueDate: "2025-10-20",
  },
  {
    id: "3",
    name: "Brand Guidelines Document",
    project: "Marketing Website",
    priority: "low",
    status: "pending",
    dueDate: "2025-10-25",
  },
];

// Animated Counter Component
const AnimatedCounter = ({
  value,
  duration = 1000,
}: {
  value: number;
  duration?: number;
}) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
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
    }: any,
    ref: any,
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
        case "primary":
          return "before:bg-primary";
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

export default function DesignerQuickActions() {
  const { t, language, direction } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "primary";
      default:
        return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "in-progress":
        return "primary";
      case "review":
        return "warning";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48 rounded-lg" />
        </CardHeader>
        <CardBody className="space-y-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="border-default-200" dir={direction} shadow="sm">
      <CardHeader className="flex items-center justify-between pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-foreground">
              {t("designerDashboard.quickActions") || "Quick Actions"}
            </h3>
            {mockDesignTasks.length > 0 && (
              <Chip
                className="bg-danger-50 text-danger-600 border border-danger-200"
                size="sm"
                variant="flat"
              >
                <AnimatedCounter duration={600} value={mockDesignTasks.length} />
              </Chip>
            )}
          </div>
          <p className="text-sm text-default-500 mt-1">
            {t("designerDashboard.quickActionsSubtitle") ||
              "Design tasks that need your attention"}
          </p>
        </div>
        <Button
          isIconOnly
          className="text-default-400 hover:text-default-600"
          disabled={refreshing}
          size="sm"
          variant="light"
          onPress={handleRefresh}
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </Button>
      </CardHeader>

      <Divider className="bg-default-200" />

      <CardBody className="p-6 overflow-hidden">
        <div className="space-y-4 overflow-hidden">
          <ScrollShadow className="max-h-[500px]" hideScrollBar>
            <Accordion
              className="px-0"
              selectionMode="single"
              variant="splitted"
            >
              {mockDesignTasks.map((task) => (
                <AccordionItem
                  key={task.id}
                  className="border border-default-200 rounded-lg mb-2"
                  title={
                    <div className="flex items-center justify-between w-full pr-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-medium text-sm truncate">
                          {task.name}
                        </span>
                        <Chip
                          color={getPriorityColor(task.priority)}
                          size="sm"
                          variant="flat"
                        >
                          {task.priority}
                        </Chip>
                      </div>
                      <Chip
                        color={getStatusColor(task.status)}
                        size="sm"
                        variant="dot"
                      >
                        {task.status}
                      </Chip>
                    </div>
                  }
                >
                  <CustomAlert color="primary" direction={direction}>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-default-600">
                        <Palette size={16} />
                        <span>{task.project}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-default-600">
                        <Clock size={16} />
                        <span>
                          {t("common.dueDate") || "Due Date"}: {task.dueDate}
                        </span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          className="shadow-small"
                          color="primary"
                          size="sm"
                          variant="bordered"
                        >
                          <CheckCircle size={16} />
                          {t("common.markComplete") || "Mark Complete"}
                        </Button>
                        <Button
                          className="shadow-small"
                          size="sm"
                          variant="bordered"
                        >
                          {t("common.viewDetails") || "View Details"}
                        </Button>
                      </div>
                    </div>
                  </CustomAlert>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollShadow>
        </div>
      </CardBody>
    </Card>
  );
}
