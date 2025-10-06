import { useState, useEffect } from "react";
import { membersTasksService } from "@/services/api";
import type { MemberTask } from "@/types/membersTasks";

interface UseTeamQuickActionsResult {
  actions: MemberTask[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  updateTaskStatus: (
    taskId: number,
    newStatus: string,
  ) => Promise<void>;
}

/**
 * Hook to fetch quick actions (tasks) for team members
 */
export function useTeamQuickActions(): UseTeamQuickActionsResult {
  const [actions, setActions] = useState<MemberTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchActions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await membersTasksService.getTasks({
        page: 1,
        limit: 5, // Get top 5 tasks for quick actions
        // The API automatically filters by current user
      });

      if (response.success && response.data) {
        // Filter for tasks that need action (statusId !== 5 which is "Completed")
        const actionableTasks =
          response.data.tasks?.filter(
            (task) => task.statusId !== 5,
          ) || [];

        setActions(actionableTasks);
      } else {
        throw new Error("Failed to fetch quick actions");
      }
    } catch (err) {
      console.error("Error fetching team quick actions:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to fetch quick actions"),
      );
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      // Call the API to update task status
      await membersTasksService.updateTaskStatus(taskId, newStatus);
      
      // Refresh the actions list
      await fetchActions();
    } catch (err) {
      console.error("Error updating task status:", err);
      throw err;
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  return {
    actions,
    loading,
    error,
    refresh: fetchActions,
    updateTaskStatus,
  };
}
