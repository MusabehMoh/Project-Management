import { apiClient } from "./client";

import {
  TaskStatusLookup,
  TaskPriorityLookup,
  LookupDto,
} from "@/types/timeline";
import { ApiResponse } from "@/types/project";

export class LookupService {
  private baseUrl = "/lookups";

  // Generic lookup method for new API
  async getByCode(code: string): Promise<ApiResponse<LookupDto[]>> {
    return apiClient.get<LookupDto[]>(`${this.baseUrl}/code/${code}`);
  }

  // Task Status Lookups
  async getTaskStatuses(): Promise<ApiResponse<TaskStatusLookup[]>> {
    return apiClient.get<TaskStatusLookup[]>(`${this.baseUrl}/task-statuses`);
  }

  async getTaskStatusById(id: string): Promise<ApiResponse<TaskStatusLookup>> {
    return apiClient.get<TaskStatusLookup>(
      `${this.baseUrl}/task-statuses/${id}`,
    );
  }

  async createTaskStatus(
    data: Omit<TaskStatusLookup, "id">,
  ): Promise<ApiResponse<TaskStatusLookup>> {
    return apiClient.post<TaskStatusLookup>(
      `${this.baseUrl}/task-statuses`,
      data,
    );
  }

  async updateTaskStatus(
    id: string,
    data: Partial<TaskStatusLookup>,
  ): Promise<ApiResponse<TaskStatusLookup>> {
    return apiClient.put<TaskStatusLookup>(
      `${this.baseUrl}/task-statuses/${id}`,
      data,
    );
  }

  async deleteTaskStatus(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.baseUrl}/task-statuses/${id}`);
  }

  // Task Priority Lookups
  async getTaskPriorities(): Promise<ApiResponse<TaskPriorityLookup[]>> {
    return apiClient.get<TaskPriorityLookup[]>(
      `${this.baseUrl}/task-priorities`,
    );
  }

  async getTaskPriorityById(
    id: string,
  ): Promise<ApiResponse<TaskPriorityLookup>> {
    return apiClient.get<TaskPriorityLookup>(
      `${this.baseUrl}/task-priorities/${id}`,
    );
  }

  async createTaskPriority(
    data: Omit<TaskPriorityLookup, "id">,
  ): Promise<ApiResponse<TaskPriorityLookup>> {
    return apiClient.post<TaskPriorityLookup>(
      `${this.baseUrl}/task-priorities`,
      data,
    );
  }

  async updateTaskPriority(
    id: string,
    data: Partial<TaskPriorityLookup>,
  ): Promise<ApiResponse<TaskPriorityLookup>> {
    return apiClient.put<TaskPriorityLookup>(
      `${this.baseUrl}/task-priorities/${id}`,
      data,
    );
  }

  async deleteTaskPriority(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.baseUrl}/task-priorities/${id}`);
  }
}

export const lookupService = new LookupService();
