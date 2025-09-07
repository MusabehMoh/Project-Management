import type {
  ProjectDetails,
  SystemAttachment,
  SystemDeveloper,
  SystemTechnology,
  Technology,
  TechnologyCategory,
  CreateAttachmentRequest,
  CreateDeveloperRequest,
  CreateTechnologyRequest,
  CreateTechnologyCategoryRequest,
  CreateTechnologyItemRequest,
  ApiResponse,
} from "@/types/projectDetails";

import { apiClient } from "./client";

const ENDPOINTS = {
  PROJECT_DETAILS: (projectId: number) => `/projects/${projectId}/details`,
  ATTACHMENTS: (projectId: number) => `/projects/${projectId}/attachments`,
  ATTACHMENT_BY_ID: (projectId: number, attachmentId: number) =>
    `/projects/${projectId}/attachments/${attachmentId}`,
  DEVELOPERS: (projectId: number) => `/projects/${projectId}/developers`,
  DEVELOPER_BY_ID: (projectId: number, developerId: number) =>
    `/projects/${projectId}/developers/${developerId}`,
  TECHNOLOGIES: (projectId: number) => `/projects/${projectId}/technologies`,
  TECHNOLOGY_BY_ID: (projectId: number, techId: number) =>
    `/projects/${projectId}/technologies/${techId}`,
  TECHNOLOGY_CATEGORIES: "/technology-categories",
  TECHNOLOGY_ITEMS: "/technologies",
} as const;

export class ProjectDetailsApiService {
  // Project Details
  async getProjectDetails(
    projectId: number,
  ): Promise<ApiResponse<ProjectDetails>> {
    return apiClient.get<ProjectDetails>(ENDPOINTS.PROJECT_DETAILS(projectId));
  }

  // Attachments
  async getAttachments(
    projectId: number,
  ): Promise<ApiResponse<SystemAttachment[]>> {
    return apiClient.get<SystemAttachment[]>(ENDPOINTS.ATTACHMENTS(projectId));
  }

  async createAttachment(
    data: CreateAttachmentRequest,
  ): Promise<ApiResponse<SystemAttachment>> {
    return apiClient.post<SystemAttachment>(
      ENDPOINTS.ATTACHMENTS(data.systemId),
      data,
    );
  }

  async deleteAttachment(
    projectId: number,
    attachmentId: number,
  ): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(
      ENDPOINTS.ATTACHMENT_BY_ID(projectId, attachmentId),
    );
  }

  async downloadAttachment(
    projectId: number,
    attachmentId: number,
  ): Promise<Blob> {
    const response = await fetch(
      `${ENDPOINTS.ATTACHMENT_BY_ID(projectId, attachmentId)}/download`,
    );

    return response.blob();
  }

  // Developers
  async getDevelopers(
    projectId: number,
  ): Promise<ApiResponse<SystemDeveloper[]>> {
    return apiClient.get<SystemDeveloper[]>(ENDPOINTS.DEVELOPERS(projectId));
  }

  async addDeveloper(
    data: CreateDeveloperRequest,
  ): Promise<ApiResponse<SystemDeveloper>> {
    return apiClient.post<SystemDeveloper>(
      ENDPOINTS.DEVELOPERS(data.systemId),
      data,
    );
  }

  async removeDeveloper(
    projectId: number,
    developerId: number,
  ): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(
      ENDPOINTS.DEVELOPER_BY_ID(projectId, developerId),
    );
  }

  // Technologies
  async getTechnologies(
    projectId: number,
  ): Promise<ApiResponse<SystemTechnology[]>> {
    return apiClient.get<SystemTechnology[]>(ENDPOINTS.TECHNOLOGIES(projectId));
  }

  async addTechnology(
    data: CreateTechnologyRequest,
  ): Promise<ApiResponse<SystemTechnology>> {
    return apiClient.post<SystemTechnology>(
      ENDPOINTS.TECHNOLOGIES(data.systemId),
      data,
    );
  }

  async removeTechnology(
    projectId: number,
    technologyId: number,
  ): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(
      ENDPOINTS.TECHNOLOGY_BY_ID(projectId, technologyId),
    );
  }

  // Technology Categories
  async getTechnologyCategories(): Promise<ApiResponse<TechnologyCategory[]>> {
    return apiClient.get<TechnologyCategory[]>(ENDPOINTS.TECHNOLOGY_CATEGORIES);
  }

  async createTechnologyCategory(
    data: CreateTechnologyCategoryRequest,
  ): Promise<ApiResponse<TechnologyCategory>> {
    return apiClient.post<TechnologyCategory>(
      ENDPOINTS.TECHNOLOGY_CATEGORIES,
      data,
    );
  }

  async updateTechnologyCategory(
    id: number,
    data: Partial<CreateTechnologyCategoryRequest>,
  ): Promise<ApiResponse<TechnologyCategory>> {
    return apiClient.put<TechnologyCategory>(
      `${ENDPOINTS.TECHNOLOGY_CATEGORIES}/${id}`,
      data,
    );
  }

  async deleteTechnologyCategory(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${ENDPOINTS.TECHNOLOGY_CATEGORIES}/${id}`);
  }

  // Technology Items
  async getTechnologyItems(): Promise<ApiResponse<Technology[]>> {
    return apiClient.get<Technology[]>(ENDPOINTS.TECHNOLOGY_ITEMS);
  }

  async createTechnology(
    data: CreateTechnologyItemRequest,
  ): Promise<ApiResponse<Technology>> {
    return apiClient.post<Technology>(ENDPOINTS.TECHNOLOGY_ITEMS, data);
  }

  async updateTechnology(
    id: number,
    data: Partial<CreateTechnologyItemRequest>,
  ): Promise<ApiResponse<Technology>> {
    return apiClient.put<Technology>(
      `${ENDPOINTS.TECHNOLOGY_ITEMS}/${id}`,
      data,
    );
  }

  async deleteTechnology(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${ENDPOINTS.TECHNOLOGY_ITEMS}/${id}`);
  }
}
