import type { ApiResponse } from "@/types/project";

import { apiClient, HttpMethod } from "./client";

export interface QCQuickActionsResponse {
  tasksNeedingQCAssignment: QCQuickActionTask[];
  totalCount: number;
}

export interface QCQuickActionTask {
  id: number;
  taskName: string;
  description: string;
  typeId: number;
  projectId: number;
  projectName: string;
  requirementId: number;
  requirementName: string;
  hasNoDependentTasks: boolean;
  priority: string;
  priorityId: number;
  statusId: number;
  completedDate: string;
  startDate: string;
  endDate: string;
  developer: string;
  developerId: number;
  estimatedHours: number;
  actualHours: number;
  progress: number;
  assignedMembers: Array<{
    id: number;
    name: string;
  }>;
}

export interface AssignQCRequest {
  QCMemberIds: string[];
  Notes?: string;
  StartDate?: string;
  EndDate?: string;
}

/**
 * QC Quick Actions Service
 * Handles QC dashboard quick actions API operations
 */
export class QCQuickActionsService {
  private baseUrl = "/qc-quick-actions";

  /**
   * Get QC quick actions data including tasks that need QC assignment
   */
  async getQCQuickActions(): Promise<ApiResponse<QCQuickActionsResponse>> {
    return apiClient.request<QCQuickActionsResponse>(
      this.baseUrl,
      HttpMethod.GET,
    );
  }

  /**
   * Assign QC member(s) to a task
   */
  async assignQCToTask(
    taskId: number,
    request: AssignQCRequest,
  ): Promise<ApiResponse<{ message: string; taskId: number }>> {
    return apiClient.request<{ message: string; taskId: number }>(
      `${this.baseUrl}/${taskId}/assign-qc`,
      HttpMethod.POST,
      request,
    );
  }
}

// Export singleton instance
export const qcQuickActionsService = new QCQuickActionsService();
