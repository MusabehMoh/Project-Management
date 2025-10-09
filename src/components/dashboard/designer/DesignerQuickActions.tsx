import React, { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { ScrollShadow } from "@heroui/scroll-shadow";
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

// Custom Alert Component
const CustomAlert = ({
  children,
  color = "default",
}: {
  children: React.ReactNode;
  color?: "default" | "primary" | "warning" | "danger" | "success";
}) => {
  const borderColors = {
    default: "border-default-300",
    primary: "border-primary",
    warning: "border-warning",
    danger: "border-danger",
    success: "border-success",
  };

  return (
    <div
      className={`border-l-4 ${borderColors[color]} bg-default-50 dark:bg-default-100/50 p-3 rounded-r-lg`}
    >
      {children}
    </div>
  );
};

export default function DesignerQuickActions() {
  const { t, language } = useLanguage();
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
    <Card className="w-full" dir={language === "ar" ? "rtl" : "ltr"}>
      <CardHeader className="flex justify-between items-center pb-3">
        <div className="flex items-center gap-2">
          <Palette className="text-primary" size={20} />
          <h3 className="text-lg font-semibold">
            {t("designerDashboard.quickActions") || "Quick Actions"}
          </h3>
          <Chip color="primary" size="sm" variant="flat">
            <AnimatedCounter value={mockDesignTasks.length} />
          </Chip>
        </div>
        <Button
          isIconOnly
          isLoading={refreshing}
          size="sm"
          variant="light"
          onPress={handleRefresh}
        >
          <RefreshCw className={refreshing ? "animate-spin" : ""} size={16} />
        </Button>
      </CardHeader>
      <CardBody className="px-3">
        <ScrollShadow className="max-h-[500px]" hideScrollBar>
          <Accordion
            className="px-0"
            selectionMode="multiple"
            variant="splitted"
          >
            {mockDesignTasks.map((task) => (
              <AccordionItem
                key={task.id}
                className="mb-2"
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
                <CustomAlert color="primary">
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
                      <Button size="sm" variant="bordered">
                        {t("common.viewDetails") || "View Details"}
                      </Button>
                    </div>
                  </div>
                </CustomAlert>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollShadow>
      </CardBody>
    </Card>
  );
}
