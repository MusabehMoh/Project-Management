import { useState, useEffect } from "react";
import { membersTasksService } from "@/services/api";
import type { MemberTask } from "@/types/membersTasks";

interface UseMyAssignedTasksResult {
  tasks: MemberTask[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  total: number;
}

/**
 * Hook to fetch tasks assigned to the current user
 */
export function useMyAssignedTasks(): UseMyAssignedTasksResult {
  const [tasks, setTasks] = useState<MemberTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await membersTasksService.getTasks({
        page: 1,
        limit: 10, // Get top 10 tasks for dashboard
        // The API automatically filters by current user for non-admin/non-manager roles
      });

      if (response.success && response.data) {
        setTasks(response.data.tasks || []);
        setTotal(response.data.totalCount || 0);
      } else {
        throw new Error("Failed to fetch tasks");
      }
    } catch (err) {
      console.error("Error fetching my assigned tasks:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to fetch tasks"),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return {
    tasks,
    loading,
    error,
    refresh: fetchTasks,
    total,
  };
}
