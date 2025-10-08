import type { ApiResponse } from "@/types/project";

import { apiClient } from "./client";

export interface CreateDesignRequestDto {
  taskId: number;
  notes?: string;
  assignedToPrsId?: number;
  status?: number;
  dueDate?: string;
}

export interface DesignRequestDto {
  id: number;
  taskId: number;
  notes?: string;
  assignedToPrsId?: number;
  status?: number;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
  assignedToUserName?: string;
}

/**
 * Design Requests Service
 * Handles all design request-related API operations
 */
export class DesignRequestsService {
  private baseUrl = "/DesignRequests";

  /**
   * Get all design requests with pagination and filtering
   */
  async getDesignRequests(
    page: number = 1,
    limit: number = 20,
    taskId?: number,
    assignedToPrsId?: number,
    status?: number,
  ): Promise<
    ApiResponse<{
      data: DesignRequestDto[];
      totalCount: number;
      totalPages: number;
    }>
  > {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (taskId) params.append("taskId", taskId.toString());
    if (assignedToPrsId)
      params.append("assignedToPrsId", assignedToPrsId.toString());
    if (status) params.append("status", status.toString());

    return apiClient.get(`${this.baseUrl}?${params}`);
  }

  /**
   * Get design request by ID
   */
  async getDesignRequestById(
    id: number,
  ): Promise<ApiResponse<DesignRequestDto>> {
    return apiClient.get(`${this.baseUrl}/${id}`);
  }

  /**
   * Get design request by task ID
   */
  async getDesignRequestByTaskId(
    taskId: number,
  ): Promise<ApiResponse<DesignRequestDto | null>> {
    return apiClient.get(`${this.baseUrl}/task/${taskId}`);
  }

  /**
   * Check if a design request exists for a task
   */
  async hasDesignRequestForTask(taskId: number): Promise<ApiResponse<boolean>> {
    return apiClient.get(`${this.baseUrl}/task/${taskId}/exists`);
  }

  /**
   * Create a new design request
   */
  async createDesignRequest(
    designRequest: CreateDesignRequestDto,
  ): Promise<ApiResponse<DesignRequestDto>> {
    return apiClient.post(this.baseUrl, designRequest);
  }

  /**
   * Update an existing design request
   */
  async updateDesignRequest(
    id: number,
    designRequest: Partial<DesignRequestDto>,
  ): Promise<ApiResponse<DesignRequestDto>> {
    return apiClient.put(`${this.baseUrl}/${id}`, designRequest);
  }

  /**
   * Delete a design request
   */
  async deleteDesignRequest(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.baseUrl}/${id}`);
  }
}
export const designRequestsService = new DesignRequestsService();