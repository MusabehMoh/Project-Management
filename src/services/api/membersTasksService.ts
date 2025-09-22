import type {
  MemberTask,
  TaskSearchParams,
  TasksResponse,
  TaskFiltersData,
  TaskConfigData,
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
  // async getTasks() //params?: TaskSearchParams
  // : Promise<ApiResponse<TasksResponse>> {
  //   const queryParams = new URLSearchParams();

  //   return apiClient.get<TasksResponse>(`${this.baseUrl}?`);
  // }

  /**
   * Get projects assigned to current analyst
   */
  async getTasks(
    taskRequest?: TaskSearchParams
  ): Promise<ApiResponse<TasksResponse>> {
    const params = new URLSearchParams();

    if (taskRequest?.page) {
      params.append("page", taskRequest?.page.toString());
    }

    if (taskRequest?.limit) {
      params.append("limit", taskRequest?.limit.toString());
    }
    if (taskRequest?.search) {
      params.append("search", taskRequest?.search);
    }
    if (taskRequest?.statusId) {
      params.append("status", taskRequest?.statusId.toString());
    }
    if (taskRequest?.priorityId) {
      params.append("priority", taskRequest?.priorityId.toString());
    }

    if (taskRequest?.projectId) {
      params.append("project", taskRequest?.projectId.toString());
    }

    const endpoint = `${this.baseUrl}${params.toString() ? "?" + params.toString() : ""}`;

    return await apiClient.get<TasksResponse>(endpoint);
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
  async exportTasks(
    //filters: TaskSearchParams,
    format: "csv" | "pdf" | "xlsx"
  ): Promise<Blob> {
    const queryParams = new URLSearchParams();

    // Object.entries(filters).forEach(([key, value]) => {
    //   if (value !== undefined && value !== null) {
    //     if (Array.isArray(value)) {
    //       queryParams.append(key, value.join(","));
    //     } else {
    //       queryParams.append(key, value.toString());
    //     }
    //   }
    // });
    queryParams.append("format", format);

    // Using fetch directly for blob response since apiClient expects JSON
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${this.baseUrl}/export?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          Accept:
            format === "pdf"
              ? "application/pdf"
              : format === "csv"
                ? "text/csv"
                : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      }
    );

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
  async updateTask(
    id: string,
    updates: Partial<MemberTask>
  ): Promise<ApiResponse<MemberTask>> {
    return apiClient.patch<MemberTask>(`${this.baseUrl}/${id}`, updates);
  }

  /**
   * Delete task
   */
  async deleteTask(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.baseUrl}/${id}`);
  }

  /*request design */
  async requestDesign(id: string, notes: string): Promise<ApiResponse<void>> {
    // return {
    //   success: true,
    //   data: undefined,
    //   message: "Design request submitted successfully",
    //   timestamp: "15-08-2025",
    // };
    return apiClient.post<void>(`${this.baseUrl}/${id}/request-design`, notes);
  }

  /*change Status */
  async changeStatus(
    id: string,
    typeId: string,
    notes: string
  ): Promise<ApiResponse<void>> {
    // return {
    //   success: true,
    //   data: undefined,
    //   message: "Change Status submitted successfully",
    //   timestamp: "15-08-2025",
    // };
    return apiClient.post<void>(
      `${this.baseUrl}/${id}/change-status/${typeId}`,
      notes
    );
  }

  /* status drop down values and header data */
  async getCurrentTasksConfig(): Promise<ApiResponse<TaskConfigData>> {
    return {
      success: true,
      data: {
        totalTasks: 55,
        inProgressTasks: 15,
        overdueTasks: 4,
        taskStatus: [
          {
            id: 1,
            label: "Not Started",
          },
          {
            id: 2,
            label: "In Progress",
          },
          {
            id: 3,
            label: "Review",
          },
          {
            id: 4,
            label: "Completed",
          },
          {
            id: 5,
            label: "Blocked",
          },
          { id: 6, label: "All" },
        ],
        taskPriority: [
          { id: 1, label: "Low" },
          { id: 2, label: "Medium" },
          { id: 3, label: "High" },
          { id: 4, label: "Critical" },
          { id: 5, label: "All" },
        ],
        projects: [
          { id: "1", name: "E-Commerce Platform" },
          { id: "2", name: "Mobile Banking App" },
          { id: "3", name: "HR Management System" },
          { id: "4", name: "All" },
        ],
      },
      message: "success",
      timestamp: "15-08-2025",
    };
    ///TODO uncomment this when api available and comment above mock data
    //return apiClient.get<TaskConfigData>(`${this.baseUrl}/getTasksConfig`);
  }
}

// Export singleton instance
export const membersTasksService = new MembersTasksService();
