import type { MemberTask } from "@/types/membersTasks";

import { useState, useEffect } from "react";

import { membersTasksService } from "@/services/api";

interface UseMyNextDeadlineResult {
  task: MemberTask | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch the next upcoming deadline task for the current user
 */
export function useMyNextDeadline(): UseMyNextDeadlineResult {
  const [task, setTask] = useState<MemberTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNextDeadline = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await membersTasksService.getNextDeadline();

      if (response.success) {
        setTask(response.data || null);
      } else {
        throw new Error(response.message || "Failed to fetch next deadline");
      }
    } catch (err) {
      console.error("Error fetching next deadline:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to fetch next deadline"),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNextDeadline();
  }, []);

  return {
    task,
    loading,
    error,
    refresh: fetchNextDeadline,
  };
}
