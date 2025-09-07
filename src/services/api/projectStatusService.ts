import { apiClient } from "./client";

import { ApiResponse } from "@/types/project";

export interface ProjectStatus {
  id: number;
  nameEn: string;
  nameAr: string;
  code: number;
  isActive: boolean;
  order: number;
}

// Real API Project Status Service
export class ProjectStatusService {
  /**
   * Get all project phases from API
   */
  async getProjectStatus(): Promise<ApiResponse<ProjectStatus[]>> {
    return apiClient.get<ProjectStatus[]>("/lookups/statuses");
  }
}

// Export the service instance
export const projectStatusService = new ProjectStatusService();
