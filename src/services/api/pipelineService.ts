import { apiClient } from "./client";

export interface PipelineProject {
  id: number;
  applicationName: string;
  projectOwner: string;
  owningUnit: string;
  status: number;
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
      // Get assigned projects which already includes requirements count
      const assignedProjectsResponse = await apiClient.get<PipelineProject[]>(
        "/project-requirements/assigned-projects?limit=200",
      );

      if (assignedProjectsResponse.success) {
        const projects = assignedProjectsResponse.data;

        // Categorize projects by status
        // Status mapping: 1=New(Planning), 2=Delayed(Planning), 3=Under Review(Planning), 4=Under Development(InProgress), 5=Production(Completed)
        const planning = projects.filter((p) => [1, 2, 3].includes(p.status));
        const inProgress = projects.filter((p) => p.status === 4);
        const completed = projects.filter((p) => p.status === 5);

        return {
          success: true,
          data: {
            planning,
            inProgress,
            completed,
          },
          message: "Pipeline projects retrieved successfully",
        };
      }

      throw new Error("Failed to fetch pipeline data");
    } catch (error) {
      console.error("Pipeline service error:", error);

      return {
        success: false,
        data: {
          planning: [],
          inProgress: [],
          completed: [],
        },
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Export singleton instance
export const pipelineService = new PipelineService();
