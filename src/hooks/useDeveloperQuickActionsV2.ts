import { useState, useEffect, useCallback } from "react";

import {
  developerQuickActionsServiceV2 as developerQuickActionsService,
  type UnassignedTask,
  type AlmostCompletedTask,
  type AvailableDeveloper,
} from "@/services/api/developerQuickActionsServiceV2";

interface UseDeveloperQuickActionsResult {
  unassignedTasks: UnassignedTask[];
  almostCompletedTasks: AlmostCompletedTask[];
  availableDevelopers: AvailableDeveloper[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  hasActionsAvailable: boolean;
  refresh: () => Promise<void>;
  extendTask: (
    taskId: number,
    newEndDate: string,
    reason: string,
  ) => Promise<void>;
  assignDeveloper: (taskId: string, developerId: string) => Promise<void>;
}

interface UseDeveloperQuickActionsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useDeveloperQuickActions(
  options: UseDeveloperQuickActionsOptions = {},
): UseDeveloperQuickActionsResult {
  const { autoRefresh = false, refreshInterval = 30000 } = options;

  const [unassignedTasks, setUnassignedTasks] = useState<UnassignedTask[]>([]);
  const [almostCompletedTasks, setAlmostCompletedTasks] = useState<
    AlmostCompletedTask[]
  >([]);
  const [availableDevelopers, setAvailableDevelopers] = useState<
    AvailableDeveloper[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      // Make actual API call to get all developer quick actions
      const response = await developerQuickActionsService.getQuickActions();

      setUnassignedTasks(response.unassignedTasks);
      setAlmostCompletedTasks(response.almostCompletedTasks);
      setAvailableDevelopers(response.availableDevelopers);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch developer quick actions",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
  }, [fetchData]);

  const extendTask = useCallback(
    async (taskId: number, newEndDate: string, reason: string) => {
      try {
        // Make actual API call to extend task
        await developerQuickActionsService.extendTask(
          taskId,
          newEndDate,
          reason,
        );

        // Refresh data after successful extension
        await refresh();
      } catch (error) {
        // Re-throw error to be handled by the component
        throw error;
      }
    },
    [refresh],
  );

  const assignDeveloper = useCallback(
    async (taskId: string, developerId: string) => {
      try {
        // Make actual API call to assign developer
        await developerQuickActionsService.assignDeveloper(taskId, developerId);

        // Refresh data after successful assignment
        await refresh();
      } catch (error) {
        // Re-throw error to be handled by the component
        throw error;
      }
    },
    [refresh],
  );

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (!loading) {
        refresh();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loading, refresh]);

  const hasActionsAvailable =
    unassignedTasks.length > 0 ||
    almostCompletedTasks.length > 0 ||
    availableDevelopers.length > 0;

  return {
    unassignedTasks,
    almostCompletedTasks,
    availableDevelopers,
    loading,
    refreshing,
    error,
    hasActionsAvailable,
    refresh,
    extendTask,
    assignDeveloper,
  };
}
