import { apiClient } from "./client";

export interface PipelineProject {
  id: number;
  applicationName: string;
  projectOwner: string;
  description: string;
  status: number;
  priority: string;
  progress: number;
  startDate: string;
  expectedCompletionDate: string;
  budget: number;
}

export interface PipelineStats {
  planning: number;
  inProgress: number;
  completed: number;
}

export interface PipelineResponse {
  success: boolean;
  data: {
    planning: PipelineProject[];
    inProgress: PipelineProject[];
    completed: PipelineProject[];
    stats: PipelineStats;
  };
  message: string;
}

// Pipeline API service
export class PipelineService {
  /**
   * Get projects organized by pipeline stages
   */
  async getPipelineProjects(): Promise<PipelineResponse> {
    try {
      // Get projects and statuses in parallel
      const [projectsResponse, statusesResponse] = await Promise.all([
        apiClient.get<PipelineProject[]>("/projects?limit=100"),
        apiClient.get("/lookups/statuses")
      ]);

      if (projectsResponse.success && statusesResponse.success) {
        const projects = projectsResponse.data;
        
        // Categorize projects by status
        // Status mapping: 1=New(Planning), 2=Delayed(Planning), 3=Under Review(Planning), 4=Under Development(InProgress), 5=Production(Completed)
        const planning = projects.filter(p => [1, 2, 3].includes(p.status));
        const inProgress = projects.filter(p => p.status === 4);
        const completed = projects.filter(p => p.status === 5);

        const stats: PipelineStats = {
          planning: planning.length,
          inProgress: inProgress.length,
          completed: completed.length,
        };

        return {
          success: true,
          data: {
            planning,
            inProgress,
            completed,
            stats,
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
          stats: { planning: 0, inProgress: 0, completed: 0 },
        },
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Export singleton instance
export const pipelineService = new PipelineService();
