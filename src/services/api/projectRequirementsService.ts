import type {
  ProjectRequirement,
  AssignedProject,
  CreateProjectRequirementRequest,
  UpdateProjectRequirementRequest,
  ProjectRequirementFilters,
  ProjectRequirementStats,
  CreateRequirementTaskRequest,
  RequirementTask,
  ProjectRequirementAttachment,
} from "@/types/projectRequirement";

import { apiClient, API_CONFIG } from "./client";

const ENDPOINTS = {
  ASSIGNED_PROJECTS: "/project-requirements/assigned-projects",
  PROJECT_REQUIREMENTS: () => `/project-requirements`,
  PROJECT_REQUIREMENTS_BY_PROJECT: (projectId: number) =>
    `/project-requirements/projects/${projectId}/requirements`,
  REQUIREMENT_BY_ID: (requirementId: number) =>
    `/project-requirements/${requirementId}`,
  SEND_REQUIREMENT: (requirementId: number) =>
    `/project-requirements/requirements/${requirementId}/send`,
  REQUIREMENT_STATS: (projectId: number) =>
    `/project-requirements/projects/${projectId}/stats`,
  DEVELOPMENT_REQUIREMENTS: "/project-requirements/development-requirements",
  DRAFT_REQUIREMENTS: "/project-requirements/draft-requirements",
  APPROVED_REQUIREMENTS: "/project-requirements/approved-requirements",
  PENDING_APPROVAL_REQUIREMENTS:
    "/project-requirements/pending-approval-requirements",
  APPROVE_REQUIREMENT: (requirementId: number) =>
    `/project-requirements/requirements/${requirementId}/approve`,
  CREATE_REQUIREMENT_TASK: (requirementId: number) =>
    `/project-requirements/requirements/${requirementId}/tasks`,
  UPLOAD_ATTACHMENT: (requirementId: number) =>
    `/project-requirements/requirements/${requirementId}/attachments`,
  DELETE_ATTACHMENT: (requirementId: number, attachmentId: number) =>
    `/project-requirements/requirements/${requirementId}/attachments/${attachmentId}`,
  DOWNLOAD_ATTACHMENT: (requirementId: number, attachmentId: number) =>
    `/project-requirements/requirements/${requirementId}/attachments/${attachmentId}/download`,
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

    // Always add projectId as a filter parameter
    params.append("projectId", projectId.toString());

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }
    const endpoint = `${ENDPOINTS.PROJECT_REQUIREMENTS()}?${params.toString()}`;

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
      ENDPOINTS.PROJECT_REQUIREMENTS_BY_PROJECT(projectId),
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
  async deleteRequirement(
    requirementId: number,
  ): Promise<ProjectRequirement | null> {
    try {
      const result = await apiClient.delete<ProjectRequirement>(
        ENDPOINTS.REQUIREMENT_BY_ID(requirementId),
      );

      // For 204 No Content responses, result.data will be null
      return result.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send requirement to development manager
   */
  async sendRequirement(
    requirementId: number,
    status?: number,
  ): Promise<ProjectRequirement> {
    const result = await apiClient.post<ProjectRequirement>(
      ENDPOINTS.SEND_REQUIREMENT(requirementId),
      status ? { status } : undefined,
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
   * Get all requirements with status "draft"
   */
  async getDraftRequirements(
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
      ? `${ENDPOINTS.DRAFT_REQUIREMENTS}?${params.toString()}`
      : ENDPOINTS.DRAFT_REQUIREMENTS;

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
   * Get approved requirements (requirements that have been approved and are ready for development)
   */
  async getApprovedRequirements(
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
      ? `${ENDPOINTS.APPROVED_REQUIREMENTS}?${params.toString()}`
      : ENDPOINTS.APPROVED_REQUIREMENTS;

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
   * Get pending approval requirements (requirements waiting for manager approval)
   */
  async getPendingApprovalRequirements(
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
      ? `${ENDPOINTS.PENDING_APPROVAL_REQUIREMENTS}?${params.toString()}`
      : ENDPOINTS.PENDING_APPROVAL_REQUIREMENTS;

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
   * Approve a requirement
   */
  async approveRequirement(requirementId: number): Promise<void> {
    await apiClient.post<void>(ENDPOINTS.APPROVE_REQUIREMENT(requirementId));
  }

  /**
   * Create task for a requirement
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

  /**
   * Upload attachments for a requirement
   */
  async uploadAttachments(
    requirementId: number,
    files: File[],
  ): Promise<ProjectRequirementAttachment[]> {
    if (files.length === 0) return [];
    const formData = new FormData();
    // Use plural key matching new backend multi-file support.

    for (const f of files) {
      formData.append("files", f);
    }
    try {
      const result = await apiClient.post<ProjectRequirementAttachment[]>(
        ENDPOINTS.UPLOAD_ATTACHMENT(requirementId),
        formData,
      );
      // When backend returns single object for legacy, normalize
      const data = result.data as any;

      if (Array.isArray(data)) return data;

      if (data && typeof data === "object") return [data];

      return [];
    } catch (e: any) {
      throw new Error(
        e?.message || "Failed to upload attachments in batch request",
      );
    }
  }

  /**
   * Sync attachments: upload new files & remove specified attachment IDs in one request.
   * Falls back silently if endpoint not supported.
   */
  async syncAttachments(
    requirementId: number,
    newFiles: File[],
    removeIds: number[],
  ): Promise<ProjectRequirementAttachment[] | null> {
    // If nothing to do, short circuit
    if (newFiles.length === 0 && removeIds.length === 0) return [];

    const formData = new FormData();

    for (const f of newFiles) {
      formData.append("files", f);
    }
    if (removeIds.length > 0) {
      formData.append("removeIds", removeIds.join(","));
    }
    try {
      const result = await apiClient.post<ProjectRequirementAttachment[]>(
        ENDPOINTS.UPLOAD_ATTACHMENT(requirementId) + "/sync",
        formData,
      );

      return result.data;
    } catch {
      // Endpoint might not exist (older backend); return null to allow fallback
      return null;
    }
  }

  /**
   * Delete an attachment from a requirement
   */
  async deleteAttachment(
    requirementId: number,
    attachmentId: number,
  ): Promise<void> {
    await apiClient.delete(
      ENDPOINTS.DELETE_ATTACHMENT(requirementId, attachmentId),
    );
  }

  /**
   * Download an attachment
   */
  async downloadAttachment(
    requirementId: number,
    attachmentId: number,
  ): Promise<Blob> {
    // Build full URL using configured API base (avoid hitting the front-end dev server and getting index.html)
    const path = ENDPOINTS.DOWNLOAD_ATTACHMENT(requirementId, attachmentId);
    const base = API_CONFIG.BASE_URL.replace(/\/$/, "");
    // BASE_URL typically already ends with /api, endpoints start without /api
    const url = `${base}${path}`;

    // Authorization (mirror apiClient behavior)
    const token = localStorage.getItem("authToken");
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    const headerInit: Record<string, string> = { Accept: "*/*" };

    if (authHeader.Authorization) {
      headerInit["Authorization"] = authHeader.Authorization;
    }
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: headerInit,
    });

    if (!response.ok) {
      let serverMessage = "";

      try {
        const ct = response.headers.get("content-type") || "";

        if (ct.includes("application/json")) {
          const data = await response.json();

          serverMessage = data?.message || data?.error?.message || "";
        }
      } catch {
        /* ignore */
      }

      throw new Error(serverMessage || `Download failed (${response.status})`);
    }

    const contentType = response.headers.get("content-type") || "";

    // Guard: if we accidentally received HTML (e.g., login page) treat as error
    if (contentType.includes("text/html")) {
      const peek = await response.text().catch(() => "");
      const snippet = peek.slice(0, 120).replace(/\s+/g, " ");

      throw new Error(
        `Unexpected HTML response while downloading file. Likely wrong base URL or auth redirect. Snippet: ${snippet}`,
      );
    }

    const blob = await response.blob();

    // Optional sanity check: empty blob
    if (blob.size === 0) {
      throw new Error("Downloaded file is empty");
    }

    return blob;
  }
}

export const projectRequirementsService = new ProjectRequirementsService();
