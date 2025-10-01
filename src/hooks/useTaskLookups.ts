import { useState, useEffect, useCallback } from "react";

import { LookupDto } from "@/types/timeline";
import { lookupServiceInstance } from "@/services/api";
export interface LookupOptions {
  useCache?: boolean;
  refreshOnMount?: boolean;
}
export interface TaskStatusOptions {
  key: string;
  label: string;
  color: string;
}
export interface TaskPriorityOptions {
  key: string;
  label: string;
  color: string;
  icon?: string;
}
// Helper function to map status values to colors
function getStatusColorFromValue(value: number): string {
  switch (value) {
    case 1: // To Do
      return "#6b7280"; // gray
    case 2: // In Progress
      return "#3b82f6"; // blue
    case 3: // In Review
      return "#f59e0b"; // yellow/orange
    case 4: // Rework
      return "#ef4444"; // red
    case 5: // Completed
      return "#10b981"; // green
    case 6: // On Hold
      return "#8b5cf6"; // purple
    default:
      return "#6b7280"; // default gray
  }
}
// Helper function to map priority values to colors
function getPriorityColorFromValue(value: number): string {
  switch (value) {
    case 1: // Low
      return "#10b981"; // green
    case 2: // Medium
      return "#f59e0b"; // yellow
    case 3: // High
      return "#ef4444"; // red
    case 4: // Critical
      return "#dc2626"; // dark red
    default:
      return "#6b7280"; // default gray
  }
}
export function useTaskStatusLookups(options: LookupOptions = {}) {
  const [taskStatuses, setTaskStatuses] = useState<LookupDto[]>([]);
  const [statusOptions, setStatusOptions] = useState<TaskStatusOptions[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchTaskStatuses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await lookupServiceInstance.getTaskStatuses();

      if (response.success) {
        setTaskStatuses(response.data);
        // Convert LookupDto to options format for UI components
        const options = response.data.map((status: LookupDto) => ({
          key: status.value.toString(),
          label: status.name,
          color: getStatusColorFromValue(status.value),
        }));

        setStatusOptions(options);
      } else {
        setError(response.message || "Unknown error");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch task statuses",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  const getStatusByKey = useCallback(
    (key: string) => {
      return taskStatuses.find(
        (status: LookupDto) => status.value.toString() === key,
      );
    },
    [taskStatuses],
  );
  const getStatusLabel = useCallback(
    (key: string) => {
      const status = getStatusByKey(key);

      return status?.name || key;
    },
    [getStatusByKey],
  );
  const getStatusColor = useCallback(
    (key: string) => {
      const status = getStatusByKey(key);

      return status ? getStatusColorFromValue(status.value) : "default";
    },
    [getStatusByKey],
  );

  useEffect(() => {
    if (options.refreshOnMount !== false) {
      fetchTaskStatuses();
    }
  }, [fetchTaskStatuses, options.refreshOnMount]);

  return {
    taskStatuses,
    statusOptions,
    loading,
    error,
    refetch: fetchTaskStatuses,
    getStatusByKey,
    getStatusLabel,
    getStatusColor,
  };
}
export function useTaskPriorityLookups(options: LookupOptions = {}) {
  const [taskPriorities, setTaskPriorities] = useState<LookupDto[]>([]);
  const [priorityOptions, setPriorityOptions] = useState<TaskPriorityOptions[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchTaskPriorities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await lookupServiceInstance.getTaskPriorities();

      if (response.success) {
        setTaskPriorities(response.data);
        // Convert LookupDto to options format for UI components
        const options = response.data.map((priority: LookupDto) => ({
          key: priority.value.toString(),
          label: priority.name,
          color: getPriorityColorFromValue(priority.value),
        }));

        setPriorityOptions(options);
      } else {
        setError(response.message || "Unknown error");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch task priorities",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  const getPriorityByKey = useCallback(
    (key: string) => {
      return taskPriorities.find(
        (priority: LookupDto) => priority.value.toString() === key,
      );
    },
    [taskPriorities],
  );
  const getPriorityLabel = useCallback(
    (key: string) => {
      const priority = getPriorityByKey(key);

      return priority?.name || key;
    },
    [getPriorityByKey],
  );
  const getPriorityColor = useCallback(
    (key: string) => {
      const priority = getPriorityByKey(key);

      return priority ? getPriorityColorFromValue(priority.value) : "default";
    },
    [getPriorityByKey],
  );
  const getPriorityIcon = useCallback((_key: string) => {
    return undefined;
  }, []);

  useEffect(() => {
    if (options.refreshOnMount !== false) {
      fetchTaskPriorities();
    }
  }, [fetchTaskPriorities, options.refreshOnMount]);

  return {
    taskPriorities,
    priorityOptions,
    loading,
    error,
    refetch: fetchTaskPriorities,
    getPriorityByKey,
    getPriorityLabel,
    getPriorityColor,
    getPriorityIcon,
  };
}
// Combined hook for both status and priority lookups
export function useTaskLookups(options: LookupOptions = {}) {
  const statusLookups = useTaskStatusLookups(options);
  const priorityLookups = useTaskPriorityLookups(options);
  const loading = statusLookups.loading || priorityLookups.loading;
  const error = statusLookups.error || priorityLookups.error;
  const refetchAll = useCallback(async () => {
    await Promise.all([statusLookups.refetch(), priorityLookups.refetch()]);
  }, [statusLookups.refetch, priorityLookups.refetch]);

  return {
    // Status related
    taskStatuses: statusLookups.taskStatuses,
    statusOptions: statusLookups.statusOptions,
    getStatusByKey: statusLookups.getStatusByKey,
    getStatusLabel: statusLookups.getStatusLabel,
    getStatusColor: statusLookups.getStatusColor,
    // Priority related
    taskPriorities: priorityLookups.taskPriorities,
    priorityOptions: priorityLookups.priorityOptions,
    getPriorityByKey: priorityLookups.getPriorityByKey,
    getPriorityLabel: priorityLookups.getPriorityLabel,
    getPriorityColor: priorityLookups.getPriorityColor,
    getPriorityIcon: priorityLookups.getPriorityIcon,
    // Combined
    loading,
    error,
    refetchAll,
  };
}
