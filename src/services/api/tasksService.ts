import type { ApiResponse } from "@/types/project";
import { apiClient } from "./client";

/**
 * Tasks Service
 * Handles task-related API operations using TasksController
 */
export class TasksService {
  private baseUrl = "/Tasks";

  /**
   * Update task status using PATCH endpoint
   * This creates a task status history record and updates the task
   * @param taskId - The task ID
   * @param statusId - The new status ID (1-6)
   * @param comment - Optional comment for the status change
   * @param progress - Optional progress percentage (0-100)
   */
  async updateTaskStatus(
    taskId: number,
    statusId: number,
    comment?: string,
    progress?: number
  ): Promise<ApiResponse<any>> {
    return apiClient.patch<any>(`${this.baseUrl}/${taskId}`, {
      statusId: statusId,
      comment: comment || undefined,
      progress: progress !== undefined ? progress : undefined,
    });
  }
}

// Export a singleton instance
export const tasksService = new TasksService();
