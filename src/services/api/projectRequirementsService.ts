import type {
  ProjectRequirement,
  AssignedProject,
  CreateProjectRequirementRequest,
  UpdateProjectRequirementRequest,
  ProjectRequirementFilters,
  ProjectRequirementStats,
  CreateRequirementTaskRequest,
  RequirementTask,
} from "@/types/projectRequirement";

import { apiClient } from "./client";

const ENDPOINTS = {
  ASSIGNED_PROJECTS: "/project-requirements/assigned-projects",
  PROJECT_REQUIREMENTS: (projectId: number) =>
    `/project-requirements/projects/${projectId}/requirements`,
  REQUIREMENT_BY_ID: (requirementId: number) =>
    `/project-requirements/requirements/${requirementId}`,
  SEND_REQUIREMENT: (requirementId: number) =>
    `/project-requirements/requirements/${requirementId}/send`,
  REQUIREMENT_STATS: (projectId: number) =>
    `/project-requirements/projects/${projectId}/stats`,
  DEVELOPMENT_REQUIREMENTS: "/project-requirements/development-requirements",
  CREATE_REQUIREMENT_TASK: (requirementId: number) =>
    `/project-requirements/requirements/${requirementId}/tasks`,
};

class ProjectRequirementsService {
  /**
   * Get projects assigned to current analyst
   */
  async getAssignedProjects(
    userId?: number,
    options?: {
      page?: number;
      limit?: number;
      search?: string;
      projectId?: number;
    },
  ): Promise<{
    data: AssignedProject[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams();

    if (userId) {
      params.append("userId", userId.toString());
    }

    if (options?.page) {
      params.append("page", options.page.toString());
    }

    if (options?.limit) {
      params.append("limit", options.limit.toString());
    }
    if (options?.search) {
      params.append("search", options.search);
    }
    if (options?.projectId) {
      params.append("projectId", options.projectId.toString());
    }

    const endpoint = `${ENDPOINTS.ASSIGNED_PROJECTS}${params.toString() ? "?" + params.toString() : ""}`;
    // ApiResponse<AssignedProject[]> shape: { success, data, pagination? }
    const result = await apiClient.get<AssignedProject[]>(endpoint);

    return {
      data: result.data ?? [],
      pagination: result.pagination ?? {
        page: options?.page ?? 1,
        limit: options?.limit ?? 20,
        total: (result.data ?? []).length,
        totalPages: 1,
      },
    };
  }

  /**
   * Get requirements for a specific project
   */
  async getProjectRequirements(
    projectId: number,
    filters?: ProjectRequirementFilters & {
      page?: number;
      limit?: number;
    },
  ): Promise<{
    data: ProjectRequirement[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }
    const endpoint = params.toString()
      ? `${ENDPOINTS.PROJECT_REQUIREMENTS(projectId)}?${params.toString()}`
      : ENDPOINTS.PROJECT_REQUIREMENTS(projectId);

    // ApiResponse<ProjectRequirement[]> shape: { success, data, pagination? }
    const result = await apiClient.get<ProjectRequirement[]>(endpoint);

    return {
      data: result.data ?? [],
      pagination: result.pagination ?? {
        page: (filters as any)?.page ?? 1,
        limit: (filters as any)?.limit ?? 20,
        total: (result.data ?? []).length,
        totalPages: 1,
      },
    };
  }

  /**
   * Create a new requirement for a project
   */
  async createRequirement(
    projectId: number,
    data: CreateProjectRequirementRequest,
  ): Promise<ProjectRequirement> {
    const result = await apiClient.post<ProjectRequirement>(
      ENDPOINTS.PROJECT_REQUIREMENTS(projectId),
      data,
    );

    return result.data;
  }

  /**
   * Update an existing requirement
   */
  async updateRequirement(
    requirementId: number,
    data: UpdateProjectRequirementRequest,
  ): Promise<ProjectRequirement> {
    const result = await apiClient.put<ProjectRequirement>(
      ENDPOINTS.REQUIREMENT_BY_ID(requirementId),
      data,
    );

    return result.data;
  }

  /**
   * Delete a requirement
   */
  async deleteRequirement(requirementId: number): Promise<ProjectRequirement> {
    const result = await apiClient.delete<ProjectRequirement>(
      ENDPOINTS.REQUIREMENT_BY_ID(requirementId),
    );

    return result.data as ProjectRequirement;
  }

  /**
   * Send requirement to development manager
   */
  async sendRequirement(requirementId: number): Promise<ProjectRequirement> {
    const result = await apiClient.post<ProjectRequirement>(
      ENDPOINTS.SEND_REQUIREMENT(requirementId),
    );

    return result.data;
  }

  /**
   * Get requirement statistics for a project
   */
  async getRequirementStats(
    projectId: number,
  ): Promise<ProjectRequirementStats> {
    const result = await apiClient.get<ProjectRequirementStats>(
      ENDPOINTS.REQUIREMENT_STATS(projectId),
    );

    return result.data;
  }

  /**
   * Get all requirements with status "in development"
   */
  async getDevelopmentRequirements(
    filters?: ProjectRequirementFilters & {
      page?: number;
      limit?: number;
    },
  ): Promise<{
    data: ProjectRequirement[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }

    const endpoint = params.toString()
      ? `${ENDPOINTS.DEVELOPMENT_REQUIREMENTS}?${params.toString()}`
      : ENDPOINTS.DEVELOPMENT_REQUIREMENTS;

    const result = await apiClient.get<ProjectRequirement[]>(endpoint);

    return {
      data: result.data ?? [],
      pagination: result.pagination ?? {
        page: (filters as any)?.page ?? 1,
        limit: (filters as any)?.limit ?? 20,
        total: (result.data ?? []).length,
        totalPages: 1,
      },
    };
  }

  /**
   * Create a task for a requirement
   */
  async createRequirementTask(
    requirementId: number,
    data: CreateRequirementTaskRequest,
  ): Promise<RequirementTask> {
    const result = await apiClient.post<RequirementTask>(
      ENDPOINTS.CREATE_REQUIREMENT_TASK(requirementId),
      data,
    );

    return result.data;
  }
}

export const projectRequirementsService = new ProjectRequirementsService();
