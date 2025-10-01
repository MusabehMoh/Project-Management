import { differenceInDays, parseISO, format } from "date-fns";

import { apiClient } from "./client";

import { ApiResponse } from "@/types/project";
import {
  Timeline,
  Sprint,
  Task,
  Department,
  CreateTimelineRequest,
  CreateSprintRequest,
  CreateTaskRequest,
  UpdateTimelineRequest,
  UpdateSprintRequest,
  UpdateTaskRequest,
  MemberSearchResult,
  WorkItem,
} from "@/types/timeline";

// Timeline API endpoints
const ENDPOINTS = {
  TIMELINES: "/timelines",
  TIMELINE_BY_ID: (id: string) => `/timelines/${id}`,
  PROJECT_TIMELINES: (projectId: number) => `/projects/${projectId}/timelines`,
  SPRINTS: (timelineId: string) => `/timelines/${timelineId}/sprints`,
  SPRINT_TASKS: (sprintId: string) => `/timelines/sprints/${sprintId}/tasks`,
  REQUIREMENTS: (sprintId: string) => `/sprints/${sprintId}/requirements`,
  TASKS: "/tasks", // For direct task operations
  TASK_BY_ID: (id: string) => `/tasks/${id}`,
  DEPARTMENTS: "/departments/all",
  RESOURCES: "/timelines/resources",
} as const;

// Timeline API Service Class
export class TimelineApiService {
  /**
   * Get all timelines for a project
   */
  async getProjectTimelines(
    projectId: number,
  ): Promise<ApiResponse<Timeline[]>> {
    return apiClient.get<Timeline[]>(ENDPOINTS.PROJECT_TIMELINES(projectId));
  }

  /**
   * Get all projects that have timelines
   */
  async getProjectsWithTimelines(): Promise<
    ApiResponse<
      Array<{ projectId: number; timelineCount: number; timelines: Timeline[] }>
    >
  > {
    return apiClient.get<
      Array<{
        projectId: number;
        timelineCount: number;
        timelines: Timeline[];
      }>
    >("/projects/with-timelines");
  }

  /**
   * Search all members added to our system by username, military number, or full name
   */
  async searchAllMembers(
    query: string,
  ): Promise<ApiResponse<MemberSearchResult[]>> {
    console.log("----> real API Reached");
    const params = new URLSearchParams({ q: query });

    return apiClient.get<MemberSearchResult[]>(
      `/employees/searchUsers?${params}`,
    ); ///TODO change endpoit path
  }

  /**
   * Get all department employees (without requiring search query)
   */
  async getAllDepartmentEmployees(): Promise<
    ApiResponse<MemberSearchResult[]>
  > {
    console.log("----> Getting all department employees");

    return apiClient.get<MemberSearchResult[]>("/employees");
  }

  /**
   * Search all members added to our system by username, military number, or full name
   */
  async searchTasks(
    query: string,
    timelineId?: number,
  ): Promise<ApiResponse<WorkItem[]>> {
    const params = new URLSearchParams({ query: query });
    
    if (timelineId) {
      params.append("timelineId", timelineId.toString());
    }

    return apiClient.get<WorkItem[]>(`/tasks/searchTasks?${params}`);
  }
  /**
   * Get departments
   */
  async getDepartments(): Promise<ApiResponse<Department[]>> {
    return apiClient.get<Department[]>(ENDPOINTS.DEPARTMENTS);
  }

  /**
   * Create a new timeline
   */
  async createTimeline(
    data: CreateTimelineRequest,
  ): Promise<ApiResponse<Timeline>> {
    return apiClient.post<Timeline>(ENDPOINTS.TIMELINES, data);
  }

  /**
   * Get timeline by ID
   */
  async getTimeline(id: string): Promise<ApiResponse<Timeline>> {
    return apiClient.get<Timeline>(ENDPOINTS.TIMELINE_BY_ID(id));
  }

  /**
   * Update timeline
   */
  async updateTimeline(
    id: string,
    data: UpdateTimelineRequest,
  ): Promise<ApiResponse<Timeline>> {
    return apiClient.put<Timeline>(ENDPOINTS.TIMELINE_BY_ID(id), data);
  }

  /**
   * Delete timeline
   */
  async deleteTimeline(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(ENDPOINTS.TIMELINE_BY_ID(id));
  }

  // Sprint operations
  async createSprint(data: CreateSprintRequest): Promise<ApiResponse<Sprint>> {
    return apiClient.post<Sprint>(ENDPOINTS.SPRINTS(data.timelineId), data);
  }

  async updateSprint(
    id: string,
    data: UpdateSprintRequest,
  ): Promise<ApiResponse<Sprint>> {
    return apiClient.put<Sprint>(`/sprints/${id}`, data);
  }

  async deleteSprint(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/sprints/${id}`);
  }

  // Task operations
  /**
   * delete sprint , requirement , task , subtask
   */
  async deleteEntity(id: string, type: string): Promise<ApiResponse<void>> {
    console.log("---->> delete Entity API Call");

    return apiClient.delete<void>(`/entity/${id}/${type}`);
  }

  /**
   * update sprint , requirement , task , subtask
   */
  async updateEntity(
    id: string,
    type: string,
    data: any,
  ): Promise<ApiResponse<void>> {
    console.log("---->> update Entity API Call");
    console.log(data);

    return apiClient.put<any>(`/entity/${id}/${type}`, data);
  }
  async createTask(data: CreateTaskRequest): Promise<ApiResponse<Task>> {
    // Use the new sprint-based endpoint for creating tasks
    return apiClient.post<Task>(ENDPOINTS.TASKS, data);
  }

  async updateTask(
    id: string,
    data: UpdateTaskRequest,
  ): Promise<ApiResponse<Task>> {
    return apiClient.put<Task>(ENDPOINTS.TASK_BY_ID(id), data);
  }

  async moveTask(id: string, moveDays: number): Promise<ApiResponse<Task>> {
    return apiClient.post<Task>(`/tasks/${id}/move`, { moveDays });
  }

  async moveTaskToSprint(
    id: string,
    targetSprintId: string,
  ): Promise<ApiResponse<Task>> {
    return apiClient.post<Task>(`/tasks/${id}/move-to-sprint`, {
      targetSprintId,
    });
  }

  async deleteTask(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/tasks/${id}`);
  }

  // Subtask operations
  async updateSubtask(id: string, data: any): Promise<ApiResponse<any>> {
    return apiClient.put<any>(`/subtasks/${id}`, data);
  }
}

// Create and export timeline API instance
export const timelineApi = new TimelineApiService();

// Mock departments
export const mockDepartments: Department[] = [
  {
    id: "1",
    name: "Engineering",
    color: "#3B82F6",
    description: "Software Engineering Department",
  },
  {
    id: "2",
    name: "Design",
    color: "#8B5CF6",
    description: "UI/UX Design Department",
  },
  {
    id: "3",
    name: "QA",
    color: "#10B981",
    description: "Quality Assurance Department",
  },
  {
    id: "4",
    name: "DevOps",
    color: "#F59E0B",
    description: "DevOps and Infrastructure",
  },
  {
    id: "5",
    name: "Product",
    color: "#EF4444",
    description: "Product Management",
  },
  {
    id: "6",
    name: "Research",
    color: "#6366F1",
    description: "Research and Development",
  },
];

// Helper function to calculate duration
const calculateDuration = (startDate: string, endDate: string): number => {
  return differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;
};

// Helper function to recalculate parent dates based on children
const recalculateParentDates = (
  items: any[],
): { startDate: string; endDate: string } => {
  if (items.length === 0) {
    return {
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
    };
  }

  const dates = items.map((item) => ({
    start: parseISO(item.startDate),
    end: parseISO(item.endDate),
  }));

  const earliestStart = new Date(
    Math.min(...dates.map((d) => d.start.getTime())),
  );
  const latestEnd = new Date(Math.max(...dates.map((d) => d.end.getTime())));

  return {
    startDate: format(earliestStart, "yyyy-MM-dd"),
    endDate: format(latestEnd, "yyyy-MM-dd"),
  };
};

// Export singleton instance
export const timelineApiService = new TimelineApiService();
