import type {
  MemberTask,
  TaskSearchParams,
  TasksResponse,
  TaskFiltersData,
  TaskConfigData,
  AdhocTask,
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
   * Get all tasks with filtering and pagination
   */
  async getTasks(
    taskRequest?: TaskSearchParams
  ): Promise<ApiResponse<TasksResponse>> {
    const params = new URLSearchParams();

    if (taskRequest?.page) {
      params.append("page", taskRequest.page.toString());
    }

    if (taskRequest?.limit) {
      params.append("limit", taskRequest.limit.toString());
    }
    
    if (taskRequest?.search) {
      params.append("search", taskRequest.search);
    }

    // Member filtering
    if (taskRequest?.memberIds && taskRequest.memberIds.length > 0) {
      params.append("memberIds", taskRequest.memberIds.join(","));
    }
    
    if (taskRequest?.memberFilterMode) {
      params.append("memberFilterMode", taskRequest.memberFilterMode);
    }

    // Department filtering
    if (taskRequest?.departmentIds && taskRequest.departmentIds.length > 0) {
      params.append("departmentIds", taskRequest.departmentIds.join(","));
    }

    // Status filtering (support both new array format and legacy single format)
    if (taskRequest?.statusIds && taskRequest.statusIds.length > 0) {
      params.append("statusIds", taskRequest.statusIds.join(","));
    } else if (taskRequest?.statusId) {
      params.append("statusIds", taskRequest.statusId.toString());
    }

    // Priority filtering (support both new array format and legacy single format)
    if (taskRequest?.priorityIds && taskRequest.priorityIds.length > 0) {
      params.append("priorityIds", taskRequest.priorityIds.join(","));
    } else if (taskRequest?.priorityId) {
      params.append("priorityIds", taskRequest.priorityId.toString());
    }

    if (taskRequest?.projectId) {
      params.append("project", taskRequest.projectId.toString());
    }

    // Overdue filter
    if (taskRequest?.isOverdue) {
      params.append("isOverdue", "true");
    }

    // Date range filtering
    if (taskRequest?.dateRange) {
      params.append("dateRangeStart", taskRequest.dateRange.start);
      params.append("dateRangeEnd", taskRequest.dateRange.end);
    }

    // Sorting
    if (taskRequest?.sortBy) {
      params.append("sortBy", taskRequest.sortBy);
    }
    
    if (taskRequest?.sortOrder) {
      params.append("sortOrder", taskRequest.sortOrder);
    }

    const endpoint = `${this.baseUrl}${params.toString() ? "?" + params.toString() : ""}`;

    const res = await apiClient.get<TasksResponse | ApiResponse<TasksResponse>>(endpoint);

    // If backend already returns ApiResponse shape
    if (res && typeof (res as any).success === 'boolean') {
      return res as ApiResponse<TasksResponse>;
    }

    // Otherwise it's a raw TasksResponse (mock server current behavior)
    const raw = res as unknown as TasksResponse;
    if (raw && Array.isArray(raw.tasks)) {
      return {
        success: true,
        data: raw,
        message: 'ok',
        timestamp: new Date().toISOString(),
        pagination: {
          page: raw.currentPage,
            limit: taskRequest?.limit || raw.tasks.length,
            total: raw.totalCount,
            totalPages: raw.totalPages
        }
      };
    }

    throw new Error('Unexpected tasks response shape');
  }

  /**
   * Get filter data for tasks
   */
  async getFiltersData(): Promise<ApiResponse<TaskFiltersData>> {
    const res = await apiClient.get<TaskFiltersData | any>(`${this.baseUrl}/filters`);
    // Some mock/legacy endpoints might return the raw object instead of ApiResponse shape
    if (res && typeof res.success === 'boolean') {
      return res as ApiResponse<TaskFiltersData>;
    }
    // If the response is the raw filters object
    const maybeRaw = res as unknown as TaskFiltersData;
    if (maybeRaw && Array.isArray(maybeRaw.statuses) && Array.isArray(maybeRaw.priorities)) {
      return {
        success: true,
        data: maybeRaw,
        message: 'ok',
        timestamp: new Date().toISOString()
      };
    }
    throw new Error('Unexpected filters response shape');
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

  ///change assignees
  async changeAssignees(
    taskId: string,
    memberIds: string[],
    notes: string
  ): Promise<ApiResponse<void>> {
    return {
      success: true,
      data: undefined,
      message: "Change Status submitted successfully",
      timestamp: "15-08-2025",
    };
    // return apiClient.post<void>(`${this.baseUrl}/${taskId}/change-assignees`, {
    //   memberIds,
    //   notes,
    // });
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
    await new Promise((resolve) => setTimeout(resolve, 500)); ///TODO remove this line

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

  /* Add adhoc task */
  async addAdhocTask(newTask: AdhocTask): Promise<ApiResponse<void>> {
    return {
      success: true,
      data: undefined,
      message: "Task saved successfully",
      timestamp: "22-08-2025",
    };
    ///TODO uncomment this when api available and comment above mock data
    // return apiClient.post<void>(`${this.baseUrl}/addAdhocTask`, newTask);
  }
}

// Export singleton instance
export const membersTasksService = new MembersTasksService();
