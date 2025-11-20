import type { ApiResponse } from "@/types/project";

import { apiClient } from "./client";

/**
 * Tasks Service
 * Handles task-related API operations using TasksController
 */
export class TasksService {
  private baseUrl = "/Tasks";

  /**
   * Get task by ID
   * @param taskId - The task ID
   */
  async getTaskById(taskId: number): Promise<ApiResponse<any>> {
    return apiClient.get<any>(`${this.baseUrl}/${taskId}`);
  }

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
    progress?: number,
  ): Promise<ApiResponse<any>> {
    return apiClient.patch<any>(`${this.baseUrl}/${taskId}`, {
      statusId: statusId,
      comment: comment || undefined,
      progress: progress !== undefined ? progress : undefined,
    });
  }

  /**
   * Check if task has a design request and get its details
   * @param taskId - The task ID
   */
  async checkDesignRequest(taskId: number): Promise<
    ApiResponse<{
      hasDesignRequest: boolean;
      designRequestId: number | null;
      hasDesignerTask: boolean;
      designerTaskId: number | null;
    }>
  > {
    return apiClient.get<{
      hasDesignRequest: boolean;
      designRequestId: number | null;
      hasDesignerTask: boolean;
      designerTaskId: number | null;
    }>(`${this.baseUrl}/${taskId}/design-request-check`);
  }

  /**
   * Handle developer completing task without designer
   * @param taskId - The task ID
   * @param completedWithoutDesigner - Whether to mark designer task as completed
   */
  async completeFromDeveloper(
    taskId: number,
    completedWithoutDesigner: boolean,
  ): Promise<ApiResponse<any>> {
    return apiClient.post<any>(
      `${this.baseUrl}/${taskId}/complete-from-developer`,
      {
        completedWithoutDesigner,
      },
    );
  }
}

// Export a singleton instance
export const tasksService = new TasksService();
