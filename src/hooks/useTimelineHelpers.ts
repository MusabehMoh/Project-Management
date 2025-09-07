import { Department } from "@/types/timeline";

export interface StatusOption {
  id: number;
  name: string;
  label: string;
  color: string;
}

export interface PriorityOption {
  id: number;
  name: string;
  label: string;
  color: string;
}

export const STATUS_OPTIONS: StatusOption[] = [
  { id: 1, name: "not-started", label: "Not Started", color: "#6B7280" },
  { id: 2, name: "in-progress", label: "In Progress", color: "#3B82F6" },
  { id: 3, name: "on-hold", label: "On Hold", color: "#F59E0B" },
  { id: 4, name: "completed", label: "Completed", color: "#10B981" },
  { id: 5, name: "cancelled", label: "Cancelled", color: "#EF4444" },
];

export const PRIORITY_OPTIONS: PriorityOption[] = [
  { id: 1, name: "low", label: "Low", color: "#6B7280" },
  { id: 2, name: "medium", label: "Medium", color: "#3B82F6" },
  { id: 3, name: "high", label: "High", color: "#F59E0B" },
  { id: 4, name: "critical", label: "Critical", color: "#EF4444" },
];

export const useTimelineHelpers = (departments: Department[]) => {
  const getStatusColor = (statusId?: string | number) => {
    const status = STATUS_OPTIONS.find(
      (s) => s.id.toString() === statusId?.toString(),
    );

    switch (status?.name) {
      case "completed":
        return "success";
      case "in-progress":
        return "primary";
      case "on-hold":
        return "warning";
      case "not-started":
        return "default";
      case "cancelled":
        return "danger";
      default:
        return "default";
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 76) return "success";
    if (progress >= 51) return "warning";
    if (progress >= 26) return "primary";

    return "danger";
  };

  const getPriorityColor = (priorityId?: string | number) => {
    const priority = PRIORITY_OPTIONS.find(
      (p) => p.id.toString() === priorityId?.toString(),
    );

    switch (priority?.name) {
      case "critical":
        return "danger";
      case "high":
        return "warning";
      case "medium":
        return "primary";
      case "low":
        return "default";
      default:
        return "default";
    }
  };

  const getDepartmentColor = (departmentId?: string | number) => {
    const dept = departments.find(
      (d) => d.id.toString() === departmentId?.toString(),
    );

    return dept?.color || "#6B7280";
  };

  const getStatusName = (statusId?: string | number) => {
    const status = STATUS_OPTIONS.find(
      (s) => s.id.toString() === statusId?.toString(),
    );

    return status?.label || status?.name || statusId;
  };

  const getPriorityName = (priorityId?: string | number) => {
    const priority = PRIORITY_OPTIONS.find(
      (p) => p.id.toString() === priorityId?.toString(),
    );

    return priority?.label || priority?.name || priorityId;
  };

  const getDepartmentName = (departmentId?: string | number) => {
    const dept = departments.find(
      (d) => d.id.toString() === departmentId?.toString(),
    );

    return dept?.name || departmentId;
  };

  const getStatusById = (statusId?: string | number) => {
    return STATUS_OPTIONS.find((s) => s.id.toString() === statusId?.toString());
  };

  const getPriorityById = (priorityId?: string | number) => {
    return PRIORITY_OPTIONS.find(
      (p) => p.id.toString() === priorityId?.toString(),
    );
  };

  return {
    getStatusColor,
    getProgressColor,
    getPriorityColor,
    getDepartmentColor,
    getStatusName,
    getPriorityName,
    getDepartmentName,
    getStatusById,
    getPriorityById,
    STATUS_OPTIONS,
    PRIORITY_OPTIONS,
  };
};
