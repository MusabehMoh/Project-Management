import type {
  TaskCommentDto,
  TaskHistoryDto,
  TaskAttachmentDto,
} from "@/types/membersTasks";

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
  attachmentsLoading: boolean;
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
  const [attachmentsLoading, setAttachmentsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTaskActivity = async () => {
    if (!taskId || !enabled) return;

    setLoading(true);
    setAttachmentsLoading(true);
    setError(null);

    try {
      // Fetch fast data (comments and history) first
      const [commentsResponse, historyResponse] = await Promise.all([
        membersTasksService.getTaskComments(taskId),
        membersTasksService.getTaskHistory(taskId),
      ]);

      if (commentsResponse.success && commentsResponse.data) {
        setComments(commentsResponse.data);
      }

      if (historyResponse.success && historyResponse.data) {
        setHistory(historyResponse.data);
      }

      // Mark fast data as loaded
      setLoading(false);

      // Fetch attachments separately (slower)
      const attachmentsResponse =
        await membersTasksService.getTaskAttachments(taskId);

      if (attachmentsResponse.success && attachmentsResponse.data) {
        setAttachments(attachmentsResponse.data);
      }

      setAttachmentsLoading(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch task activity";

      setError(errorMessage);
      setLoading(false);
      setAttachmentsLoading(false);
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
    attachmentsLoading,
    error,
    refetch: fetchTaskActivity,
  };
}
