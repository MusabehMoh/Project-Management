import { apiClient } from "./client";

import {
  Project,
  User,
  OwningUnit,
  ApiResponse,
  ProjectFilters,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectStats,
} from "@/types/project";

// Projects API endpoints
const ENDPOINTS = {
  PROJECTS: "/projects",
  PROJECT_BY_ID: (id: number) => `/projects/${id}`,
  PROJECT_STATS: "/projects/stats",
  PROJECT_SEARCH: "/projects/search",
  SEND_PROJECT: (id: number) => `/projects/${id}/send`,
} as const;

// Projects API service
export class ProjectsApiService {
  /**
   * Get all projects with optional filtering and pagination
   */
  async getProjects(
    filters?: ProjectFilters,
    page: number = 1,
    limit: number = 20,
  ): Promise<ApiResponse<Project[]>> {
    const queryParams = new URLSearchParams();

    // Add pagination
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());

    // Add filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `${ENDPOINTS.PROJECTS}?${queryParams.toString()}`;

    return apiClient.get<Project[]>(endpoint);
  }

  /**
   * Get a single project by ID
   */
  async getProjectById(id: number): Promise<ApiResponse<Project>> {
    return apiClient.get<Project>(ENDPOINTS.PROJECT_BY_ID(id));
  }

  /**
   * Create a new project
   */
  async createProject(
    projectData: CreateProjectRequest,
  ): Promise<ApiResponse<Project>> {
    return apiClient.post<Project>(ENDPOINTS.PROJECTS, projectData);
  }

  /**
   * Update an existing project
   */
  async updateProject(
    projectData: UpdateProjectRequest,
  ): Promise<ApiResponse<Project>> {
    const { id, ...updateData } = projectData;

    return apiClient.put<Project>(ENDPOINTS.PROJECT_BY_ID(id), updateData);
  }

  /**
   * Delete a project
   */
  async deleteProject(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(ENDPOINTS.PROJECT_BY_ID(id));
  }

  /**
   * Get project statistics
   */
  async getProjectStats(): Promise<ApiResponse<ProjectStats>> {
    return apiClient.get<ProjectStats>(ENDPOINTS.PROJECT_STATS);
  }

  /**
   * Send project for review
   */
  async sendProject(id: number): Promise<ApiResponse<Project>> {
    return apiClient.post<Project>(ENDPOINTS.SEND_PROJECT(id));
  }

  /**
   * Search projects by text
   */
  async searchProjects(query: string): Promise<ApiResponse<Project[]>> {
    const queryParams = new URLSearchParams({ q: query });
    const endpoint = `${ENDPOINTS.PROJECT_SEARCH}?${queryParams.toString()}`;

    return apiClient.get<Project[]>(endpoint);
  }

  /**
   * Bulk operations
   */
  async bulkDeleteProjects(ids: number[]): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`${ENDPOINTS.PROJECTS}/bulk-delete`, { ids });
  }

  async bulkUpdateProjectStatus(
    ids: number[],
    status: Project["status"],
  ): Promise<ApiResponse<void>> {
    return apiClient.patch<void>(`${ENDPOINTS.PROJECTS}/bulk-status`, {
      ids,
      status,
    });
  }

  /**
   * Get users for project assignments
   */
  async getProjectUsers(): Promise<ApiResponse<User[]>> {
    return apiClient.get<User[]>("/users");
  }

  /**
   * Get owning units for project assignments
   */
  async getOwningUnits(): Promise<ApiResponse<OwningUnit[]>> {
    return apiClient.get<OwningUnit[]>("/units");
  }

  /**
   * Get team members for a project (members who have tasks in this project)
   */
  async getProjectTeamMembers(projectId: number): Promise<
    ApiResponse<
      Array<{
        id: number;
        fullName: string;
        gradeName: string;
        militaryNumber: string;
        avatar?: string | null;
      }>
    >
  > {
    return apiClient.get(`/projects/${projectId}/team-members`);
  }

  /**
   * Get all projects with timelines and their team members in a single call
   */
  async getProjectsWithTimelinesAndTeam(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<
    ApiResponse<
      Array<{
        id: number;
        applicationName: string;
        status: number;
        statusName: string;
        startDate: string;
        expectedCompletionDate: string | null;
        budget: number | null;
        progress: number;
        hasTimeline: boolean;
        timelineCount: number;
        taskCount: number;
        teamMembers: Array<{
          id: number;
          fullName: string;
          gradeName: string;
          militaryNumber: string;
          avatar?: string | null;
        }>;
      }>
    >
  > {
    const params: any = { page, limit };

    if (search) {
      params.search = search;
    }

    return apiClient.get("/projects/with-timelines-and-team", { params });
  }
}

// Export singleton instance
export const projectsApi = new ProjectsApiService();
