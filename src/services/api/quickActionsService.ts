import { apiClient } from "./client";

import {
  QuickActionData,
  QuickActionStats,
  OverdueItem,
  PendingApproval,
  TeamMember,
  QuickActionApiResponse,
  AvailableMembersResponse,
} from "@/types/quickActions";

// Quick Actions API endpoints
const ENDPOINTS = {
  QUICK_ACTIONS: "/quick-actions",
  QUICK_ACTIONS_STATS: "/quick-actions/stats",
  OVERDUE_ITEMS: "/quick-actions/overdue",
  PENDING_APPROVALS: "/quick-actions/pending-approvals",
  TEAM_MEMBERS: "/quick-actions/team-members",
  APPROVE_STATUS: (id: number) => `/quick-actions/approve/${id}`,
  ASSIGN_TASK: (taskId: number) => `/quick-actions/assign-task/${taskId}`,
} as const;

export class QuickActionsService {
  /**
   * Get all quick actions data including stats and available actions
   */
  async getQuickActions(): Promise<QuickActionApiResponse<QuickActionData>> {
    return apiClient.get<QuickActionData>(ENDPOINTS.QUICK_ACTIONS);
  }

  /**
   * Get quick action statistics
   */
  async getQuickActionStats(): Promise<
    QuickActionApiResponse<QuickActionStats>
  > {
    return apiClient.get<QuickActionStats>(ENDPOINTS.QUICK_ACTIONS_STATS);
  }

  /**
   * Get overdue items that need attention
   */
  async getOverdueItems(): Promise<QuickActionApiResponse<OverdueItem[]>> {
    return apiClient.get<OverdueItem[]>(ENDPOINTS.OVERDUE_ITEMS);
  }

  /**
   * Get pending approvals
   */
  async getPendingApprovals(): Promise<
    QuickActionApiResponse<PendingApproval[]>
  > {
    return apiClient.get<PendingApproval[]>(ENDPOINTS.PENDING_APPROVALS);
  }

  /**
   * Get team members with workload info
   */
  async getTeamMembers(): Promise<QuickActionApiResponse<TeamMember[]>> {
    return apiClient.get<TeamMember[]>(ENDPOINTS.TEAM_MEMBERS);
  }

  /**
   * Approve a status change
   */
  async approveStatusChange(
    id: number,
    approved: boolean,
    comments?: string,
  ): Promise<QuickActionApiResponse<void>> {
    return apiClient.post<void>(ENDPOINTS.APPROVE_STATUS(id), {
      approved,
      comments,
    });
  }

  /**
   * Assign a task to a team member
   */
  async assignTask(
    taskId: number,
    assigneeId: number,
    priority?: "high" | "medium" | "low",
  ): Promise<QuickActionApiResponse<void>> {
    return apiClient.post<void>(ENDPOINTS.ASSIGN_TASK(taskId), {
      assigneeId,
      priority,
    });
  }

  /**
   * Mark an action as completed or dismissed
   */
  async dismissAction(actionId: string): Promise<QuickActionApiResponse<void>> {
    return apiClient.post<void>(
      `${ENDPOINTS.QUICK_ACTIONS}/${actionId}/dismiss`,
    );
  }

  /**
   * Refresh quick actions data
   */
  async refreshActions(): Promise<QuickActionApiResponse<QuickActionData>> {
    return apiClient.post<QuickActionData>(
      `${ENDPOINTS.QUICK_ACTIONS}/refresh`,
    );
  }

  /**
   * Get unassigned projects
   */
  async getUnassignedProjects(): Promise<QuickActionApiResponse<any[]>> {
    return apiClient.get<any[]>(
      `${ENDPOINTS.QUICK_ACTIONS}/unassigned-projects`,
    );
  }

  /**
   * Get projects without requirements
   */
  async getProjectsWithoutRequirements(): Promise<
    QuickActionApiResponse<any[]>
  > {
    return apiClient.get<any[]>(
      `${ENDPOINTS.QUICK_ACTIONS}/projects-without-requirements`,
    );
  }

  /**
   * Get available team members (RGIS business logic)
   */
  async getAvailableMembers(): Promise<
    QuickActionApiResponse<AvailableMembersResponse>
  > {
    return apiClient.get<AvailableMembersResponse>(
      `${ENDPOINTS.QUICK_ACTIONS}/available-members`,
    );
  }

  /**
   * Assign analyst to project
   */
  async assignAnalyst(
    projectId: number,
    analystId: string,
  ): Promise<QuickActionApiResponse<void>> {
    return apiClient.post<void>(`${ENDPOINTS.QUICK_ACTIONS}/assign-analyst`, {
      projectId,
      analystId,
    });
  }
}

// Export singleton instance
export const quickActionsService = new QuickActionsService();
