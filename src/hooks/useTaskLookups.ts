import { useState, useEffect, useCallback } from "react";

import { TaskStatusLookup, TaskPriorityLookup } from "@/types/timeline";
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

export function useTaskStatusLookups(options: LookupOptions = {}) {
  const [taskStatuses, setTaskStatuses] = useState<TaskStatusLookup[]>([]);
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

        // Convert to options format for UI components
        const options = response.data.map((status: TaskStatusLookup) => ({
          key: status.key,
          label: status.label,
          color: status.color,
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
        (status: TaskStatusLookup) => status.key === key,
      );
    },
    [taskStatuses],
  );

  const getStatusLabel = useCallback(
    (key: string) => {
      const status = getStatusByKey(key);

      return status?.label || key;
    },
    [getStatusByKey],
  );

  const getStatusColor = useCallback(
    (key: string) => {
      const status = getStatusByKey(key);

      return status?.color || "default";
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
  const [taskPriorities, setTaskPriorities] = useState<TaskPriorityLookup[]>(
    [],
  );
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

        // Convert to options format for UI components
        const options = response.data.map((priority: TaskPriorityLookup) => ({
          key: priority.key,
          label: priority.label,
          color: priority.color,
          icon: priority.icon,
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
        (priority: TaskPriorityLookup) => priority.key === key,
      );
    },
    [taskPriorities],
  );

  const getPriorityLabel = useCallback(
    (key: string) => {
      const priority = getPriorityByKey(key);

      return priority?.label || key;
    },
    [getPriorityByKey],
  );

  const getPriorityColor = useCallback(
    (key: string) => {
      const priority = getPriorityByKey(key);

      return priority?.color || "default";
    },
    [getPriorityByKey],
  );

  const getPriorityIcon = useCallback(
    (key: string) => {
      const priority = getPriorityByKey(key);

      return priority?.icon;
    },
    [getPriorityByKey],
  );

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
