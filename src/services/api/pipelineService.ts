import { apiClient } from "./client";

export interface PipelineProject {
  id: number;
  applicationName: string;
  projectOwner: string;
  owningUnit: string;
  status: number;
  statusName: string;
  statusNameAr: string;
  requirementsCount: number;
  completedRequirements: number;
  lastActivity: string;
}

export interface PipelineResponse {
  success: boolean;
  data: {
    planning: PipelineProject[];
    inProgress: PipelineProject[];
    completed: PipelineProject[];
    statusLookups: Array<{
      Code: number;
      Value: string;
      Name: string;
      NameAr: string;
    }>;
  };
  message: string;
}

// Pipeline API service
export class PipelineService {
  /**
   * Get projects organized by pipeline stages with requirements data
   */
  async getPipelineProjects(): Promise<PipelineResponse> {
    try {
      // Use the new quick-actions endpoint
      const response = await apiClient.get<PipelineResponse["data"]>(
        "/quick-actions/pipeline-projects",
      );

      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: "Pipeline projects retrieved successfully",
        };
      }

      throw new Error("Failed to fetch pipeline data");
    } catch (error) {
      return {
        success: false,
        data: {
          planning: [],
          inProgress: [],
          completed: [],
          statusLookups: [],
        },
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Export singleton instance
export const pipelineService = new PipelineService();
