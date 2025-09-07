import type {
  MemberTask,
  TaskSearchParams,
  TasksResponse,
  TaskFiltersData,
} from "@/types/membersTasks";
import type { ApiResponse } from "@/types/project";

import { apiClient, API_CONFIG } from "./client";

/**
 * Members Tasks Service
 * Handles all members tasks-related API operations
 */
export class MembersTasksService {
  private baseUrl = "/members-tasks";

  /**
   * Get all tasks with filtering and pagination
   */
  async getTasks(params?: TaskSearchParams): Promise<ApiResponse<TasksResponse>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            queryParams.append(key, value.join(','));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
    }

    return apiClient.get<TasksResponse>(`${this.baseUrl}?${queryParams.toString()}`);
  }

  /**
   * Get filter data for tasks
   */
  async getFiltersData(): Promise<ApiResponse<TaskFiltersData>> {
    return apiClient.get<TaskFiltersData>(`${this.baseUrl}/filters`);
  }

  /**
   * Export tasks in specified format
   */
  async exportTasks(filters: TaskSearchParams, format: 'csv' | 'pdf' | 'excel'): Promise<Blob> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          queryParams.append(key, value.join(','));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });
    queryParams.append('format', format);

    // Using fetch directly for blob response since apiClient expects JSON
    const response = await fetch(`${API_CONFIG.BASE_URL}${this.baseUrl}/export?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/octet-stream',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  /**
   * Get task by ID
   */
  async getTaskById(id: string): Promise<ApiResponse<MemberTask>> {
    return apiClient.get<MemberTask>(`${this.baseUrl}/${id}`);
  }

  /**
   * Update task
   */
  async updateTask(id: string, updates: Partial<MemberTask>): Promise<ApiResponse<MemberTask>> {
    return apiClient.patch<MemberTask>(`${this.baseUrl}/${id}`, updates);
  }

  /**
   * Delete task
   */
  async deleteTask(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.baseUrl}/${id}`);
  }
}

// Export singleton instance
export const membersTasksService = new MembersTasksService();
