import type { TaskCommentDto, TaskHistoryDto, TaskAttachmentDto } from "@/types/membersTasks";

import { useState, useEffect } from "react";

import { membersTasksService } from "@/services/api/membersTasksService";

interface UseTaskActivityOptions {
  taskId: number | undefined;
  enabled?: boolean;
}

interface UseTaskActivityResult {
  comments: TaskCommentDto[];
  history: TaskHistoryDto[];
  attachments: TaskAttachmentDto[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTaskActivity(
  options: UseTaskActivityOptions,
): UseTaskActivityResult {
  const { taskId, enabled = true } = options;
  const [comments, setComments] = useState<TaskCommentDto[]>([]);
  const [history, setHistory] = useState<TaskHistoryDto[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachmentDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTaskActivity = async () => {
    if (!taskId || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch comments, history, and attachments in parallel
      const [commentsResponse, historyResponse, attachmentsResponse] = await Promise.all([
        membersTasksService.getTaskComments(taskId),
        membersTasksService.getTaskHistory(taskId),
        membersTasksService.getTaskAttachments(taskId),
      ]);

      if (commentsResponse.success && commentsResponse.data) {
        setComments(commentsResponse.data);
      }

      if (historyResponse.success && historyResponse.data) {
        setHistory(historyResponse.data);
      }

      if (attachmentsResponse.success && attachmentsResponse.data) {
        setAttachments(attachmentsResponse.data);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch task activity";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskActivity();
  }, [taskId, enabled]);

  return {
    comments,
    history,
    attachments,
    loading,
    error,
    refetch: fetchTaskActivity,
  };
}
