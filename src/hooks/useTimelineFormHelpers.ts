import { useMemo } from "react";

import { useTaskLookups } from "./useTaskLookups";
import { usePriorityLookups } from "./usePriorityLookups";

import { useLanguage } from "@/contexts/LanguageContext";
import { Department } from "@/types/timeline";

export interface StatusOption {
  id: number;
  key: string;
  label: string;
  labelEn: string;
  labelAr: string;
  color: string;
  value: number;
}

export interface PriorityOption {
  id: number;
  key: string;
  label: string;
  labelEn: string;
  labelAr: string;
  color: string;
  value: number;
}

export interface DepartmentOption {
  id: string;
  name: string;
  color: string;
}

/**
 * Consolidated hook for timeline form helpers including status, priority, and color mapping
 * Combines and standardizes the logic from useTaskLookups, usePriorityLookups, and color mapping functions
 */
export function useTimelineFormHelpers(departments: Department[] = []) {
  const { language } = useLanguage();
  const { taskStatuses, taskPriorities } = useTaskLookups();
  const { priorityOptions: globalPriorityOptions } = usePriorityLookups();

  // Centralized color mapping functions
  const getStatusColorFromValue = (value: number): string => {
    switch (value) {
      case 1:
        return "#6b7280"; // gray - To Do
      case 2:
        return "#3b82f6"; // blue - In Progress
      case 3:
        return "#f59e0b"; // yellow/orange - In Review
      case 4:
        return "#ef4444"; // red - Rework
      case 5:
        return "#10b981"; // green - Completed
      case 6:
        return "#8b5cf6"; // purple - On Hold
      default:
        return "#6b7280"; // default gray
    }
  };

  const getPriorityColorFromValue = (value: number): string => {
    switch (value) {
      case 1:
        return "#10b981"; // green - Low
      case 2:
        return "#f59e0b"; // yellow - Medium
      case 3:
        return "#ef4444"; // red - High
      case 4:
        return "#dc2626"; // dark red - Critical
      default:
        return "#6b7280"; // default gray
    }
  };

  // Hero UI color mapping for chips and components
  const getStatusColor = (
    statusId: number,
  ): "warning" | "danger" | "primary" | "secondary" | "success" | "default" => {
    const colorMap: {
      [key: string]:
        | "warning"
        | "danger"
        | "primary"
        | "secondary"
        | "success"
        | "default";
    } = {
      "#6b7280": "default",
      "#3b82f6": "primary",
      "#f59e0b": "warning",
      "#ef4444": "danger",
      "#10b981": "success",
      "#8b5cf6": "secondary",
    };
    const hexColor = getStatusColorFromValue(statusId);

    return colorMap[hexColor] || "default";
  };

  const getPriorityColor = (
    priorityId: number,
  ): "warning" | "danger" | "primary" | "secondary" | "success" | "default" => {
    const colorMap: {
      [key: string]:
        | "warning"
        | "danger"
        | "primary"
        | "secondary"
        | "success"
        | "default";
    } = {
      "#10b981": "success",
      "#f59e0b": "warning",
      "#ef4444": "danger",
      "#dc2626": "danger",
    };
    const hexColor = getPriorityColorFromValue(priorityId);

    return colorMap[hexColor] || "default";
  };

  // Progress color mapping
  const getProgressColor = (
    progress: number,
  ): "success" | "warning" | "danger" | "primary" => {
    if (progress >= 80) return "success";
    if (progress >= 50) return "warning";
    if (progress >= 20) return "primary";

    return "danger";
  };

  // Language-aware name getters
  const getStatusName = (statusId: number): string => {
    const status = taskStatuses?.find((s) => s.value === statusId);

    return status
      ? language === "ar"
        ? status.nameAr
        : status.name
      : `Status ${statusId}`;
  };

  const getPriorityName = (priorityId: number): string => {
    // Try task priorities first, then global priorities
    const taskPriority = taskPriorities?.find((p) => p.value === priorityId);

    if (taskPriority) {
      return language === "ar" ? taskPriority.nameAr : taskPriority.name;
    }

    const globalPriority = globalPriorityOptions.find(
      (p) => p.value === priorityId,
    );

    if (globalPriority) {
      return language === "ar" ? globalPriority.labelAr : globalPriority.label;
    }

    return `Priority ${priorityId}`;
  };

  // Department helpers
  const getDepartmentColor = (departmentId: string | number): string => {
    const dept = departments.find(
      (d) => d.id.toString() === departmentId.toString(),
    );

    return dept?.color || "#6b7280";
  };

  const getDepartmentName = (departmentId: string | number): string => {
    const dept = departments.find(
      (d) => d.id.toString() === departmentId.toString(),
    );

    return dept?.name || "Unknown";
  };

  // Standardized options for forms
  const statusOptions = useMemo((): StatusOption[] => {
    return (
      taskStatuses?.map((status) => ({
        id: status.value,
        key: status.value.toString(),
        label: language === "ar" ? status.nameAr : status.name,
        labelEn: status.name,
        labelAr: status.nameAr,
        color: getStatusColorFromValue(status.value),
        value: status.value,
      })) || []
    );
  }, [taskStatuses, language]);

  const priorityOptions = useMemo((): PriorityOption[] => {
    // Use task priorities if available, otherwise fall back to global priorities
    const options =
      taskPriorities?.length > 0
        ? taskPriorities.map((priority) => ({
            id: priority.value,
            key: priority.value.toString(),
            label: language === "ar" ? priority.nameAr : priority.name,
            labelEn: priority.name,
            labelAr: priority.nameAr,
            color: getPriorityColorFromValue(priority.value),
            value: priority.value,
          }))
        : globalPriorityOptions.map((priority) => ({
            id: priority.value,
            key: priority.value.toString(),
            label: language === "ar" ? priority.labelAr : priority.label,
            labelEn: priority.label,
            labelAr: priority.labelAr,
            color: priority.color,
            value: priority.value,
          }));

    return options || [];
  }, [taskPriorities, globalPriorityOptions, language]);

  const departmentOptions = useMemo((): DepartmentOption[] => {
    return departments.map((dept) => ({
      id: dept.id.toString(),
      name: dept.name,
      color: dept.color,
    }));
  }, [departments]);

  return {
    // Color mapping functions
    getStatusColorFromValue,
    getPriorityColorFromValue,
    getStatusColor,
    getPriorityColor,
    getProgressColor,

    // Name getters
    getStatusName,
    getPriorityName,
    getDepartmentColor,
    getDepartmentName,

    // Standardized options for forms
    statusOptions,
    priorityOptions,
    departmentOptions,
  };
}
