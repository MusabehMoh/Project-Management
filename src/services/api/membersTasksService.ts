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
  private baseUrl = "/MembersTasks";

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
  /**
   * Get all tasks with filtering and pagination
   * @param taskRequest - Optional search parameters
   */
  async getTasks(
    taskRequest?: TaskSearchParams,
  ): Promise<ApiResponse<TasksResponse>> {
    const params = new URLSearchParams({
      page: taskRequest?.page?.toString() || "1",
      limit: taskRequest?.limit?.toString() || "20",
    });

    // Add optional filters if provided
    if (taskRequest?.projectId) {
      params.append("projectId", taskRequest.projectId.toString());
    }

    // Handle status filter - prefer single statusId but support array too
    if (taskRequest?.statusId) {
      params.append("status", taskRequest.statusId.toString());
    } else if (taskRequest?.statusIds?.length) {
      params.append("status", taskRequest.statusIds[0].toString());
    }

    // Handle priority filter - prefer single priorityId but support array too
    if (taskRequest?.priorityId) {
      params.append("priority", taskRequest.priorityId.toString());
    } else if (taskRequest?.priorityIds?.length) {
      params.append("priority", taskRequest.priorityIds[0].toString());
    }

    const endpoint = `${this.baseUrl}?${params.toString()}`;
    const res = await apiClient.get<any>(endpoint);

    // Handle standard ApiResponse format
    if (res && typeof res.success === "boolean") {
      const data = res.data;
      const pagination = res.pagination;

      // Case 1: ApiResponse with array data that needs to be normalized
      if (Array.isArray(data)) {
        const normalized: TasksResponse = {
          tasks: data as MemberTask[],
          totalCount:
            pagination?.total || (pagination as any)?.totalCount || data.length,
          totalPages: pagination?.totalPages || 1,
          currentPage: pagination?.page || 1,
          hasNextPage: pagination
            ? pagination.page < (pagination.totalPages || 1)
            : false,
          hasPrevPage: pagination ? pagination.page > 1 : false,
        };

        return {
          success: true,
          data: normalized,
          message: res.message || "ok",
          timestamp: new Date().toISOString(),
        };
      }

      // Case 2: ApiResponse already contains a well-formed TasksResponse
      if (data && Array.isArray(data.tasks)) {
        return res as ApiResponse<TasksResponse>;
      }
    }

    // Case 3: Direct TasksResponse (not wrapped in ApiResponse)
    // The compiler doesn't know res might be a TasksResponse directly
    const rawResponse = res as unknown as { tasks?: MemberTask[] };

    if (rawResponse && Array.isArray(rawResponse.tasks)) {
      return {
        success: true,
        data: rawResponse as TasksResponse,
        message: "ok",
        timestamp: new Date().toISOString(),
      };
    }

    throw new Error("Unexpected tasks response shape from backend");
  }

  /**
   * Get filter data for tasks
   */
  async getFiltersData(): Promise<ApiResponse<TaskFiltersData>> {
    const res = await apiClient.get<TaskFiltersData | any>(
      `${this.baseUrl}/filters`,
    );

    // Some mock/legacy endpoints might return the raw object instead of ApiResponse shape
    if (res && typeof res.success === "boolean") {
      return res as ApiResponse<TaskFiltersData>;
    }
    // If the response is the raw filters object
    const maybeRaw = res as unknown as TaskFiltersData;

    if (
      maybeRaw &&
      Array.isArray(maybeRaw.statuses) &&
      Array.isArray(maybeRaw.priorities)
    ) {
      return {
        success: true,
        data: maybeRaw,
        message: "ok",
        timestamp: new Date().toISOString(),
      };
    }
    throw new Error("Unexpected filters response shape");
  }

  /**
   * Export tasks in specified format
   */
  async exportTasks(
    //filters: TaskSearchParams,
    format: "csv" | "pdf" | "xlsx",
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
      },
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
    updates: Partial<MemberTask>,
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

  /**
   * Change task assignees
   * @param taskId - ID of the task to change assignees for
   * @param memberIds - Array of member IDs to assign
   * @param notes - Optional notes about the assignment
   */
  async changeAssignees(
    taskId: string,
    memberIds: string[],
    notes: string,
  ): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`${this.baseUrl}/${taskId}/change-assignees`, {
      memberIds,
      notes,
    });
  }

  /*change Status */
  async changeStatus(
    id: string,
    typeId: string,
    notes: string,
  ): Promise<ApiResponse<void>> {
    // return {
    //   success: true,
    //   data: undefined,
    //   message: "Change Status submitted successfully",
    //   timestamp: "15-08-2025",
    // };
    return apiClient.post<void>(
      `${this.baseUrl}/${id}/change-status/${typeId}`,
      notes,
    );
  }

  /**
   * Update task status
   * @param taskId - The task ID
   * @param newStatus - The new status string
   */
  async updateTaskStatus(
    taskId: number,
    newStatus: string,
  ): Promise<ApiResponse<void>> {
    return apiClient.put<void>(`${this.baseUrl}/${taskId}/status`, {
      status: newStatus,
    });
  }

  /* status drop down values and header data */
  async getCurrentTasksConfig(): Promise<ApiResponse<TaskConfigData>> {
    // Call real endpoint
    const res = await apiClient.get<
      TaskConfigData | ApiResponse<TaskConfigData>
    >(`${this.baseUrl}/getTasksConfig`);

    // If backend already wraps in ApiResponse
    if (res && typeof (res as any).success === "boolean") {
      return res as ApiResponse<TaskConfigData>;
    }

    // Otherwise treat as raw TaskConfigData
    const raw = res as unknown as TaskConfigData;

    if (
      raw &&
      Array.isArray(raw.taskStatus) &&
      Array.isArray(raw.taskPriority) &&
      Array.isArray(raw.projects)
    ) {
      return {
        success: true,
        data: raw,
        message: "ok",
        timestamp: new Date().toISOString(),
      };
    }

    throw new Error("Unexpected task config response shape");
  }

  /**
   * Add an adhoc task
   */
  async addAdhocTask(newTask: AdhocTask): Promise<ApiResponse<void>> {
    // Transform the frontend AdhocTask to match backend CreateAdHocTaskDto
    const taskData = {
      name: newTask.name,
      description: newTask.description,
      startDate: newTask.startDate,
      endDate: newTask.endDate,
      assignedMembers: newTask.assignedMembers.map((id) => parseInt(id)),
    };

    return apiClient.post<void>(`/tasks/adhoc`, taskData);
  }

  /**
   * Get the next upcoming deadline for the current user
   */
  async getNextDeadline(): Promise<ApiResponse<MemberTask | null>> {
    try {
      const res = await apiClient.get<MemberTask | null>(
        `${this.baseUrl}/next-deadline`,
      );

      // Handle standard ApiResponse format
      if (res && typeof res.success === "boolean") {
        return res as ApiResponse<MemberTask | null>;
      }

      // If response is the raw task object
      const maybeTask = res as unknown as MemberTask;

      if (maybeTask && maybeTask.id) {
        return {
          success: true,
          data: maybeTask,
          message: "ok",
          timestamp: new Date().toISOString(),
        };
      }

      // No upcoming deadline
      return {
        success: true,
        data: null,
        message: "No upcoming deadlines found",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: "Failed to fetch next deadline",
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Export singleton instance
export const membersTasksService = new MembersTasksService();
