import { apiClient } from "@/services/api";

export interface DeveloperWorkload {
  developerId: string;
  developerName: string;
  currentTasks: number;
  completedTasks: number;
  averageTaskTime: number;
  efficiency: number;
  workloadPercentage: number;
  skills: string[];
  currentProjects: string[];
  availableHours: number;
  status: "available" | "busy" | "blocked" | "on-leave";
}

export interface TeamPerformanceMetrics {
  totalDevelopers: number;
  activeDevelopers: number;
  averageEfficiency: number;
  totalTasksCompleted: number;
  totalTasksInProgress: number;
  averageTaskCompletionTime: number;
  codeReviewsCompleted: number;
  averageReviewTime: number;
  bugsFixed: number;
  featuresDelivered: number;
}

export interface CodeReviewMetrics {
  totalReviews: number;
  pendingReviews: number;
  averageReviewTime: number;
  approvalRate: number;
  reviewsThisWeek: number;
  criticalReviews: number;
}

class DeveloperWorkloadService {
  /**
   * Get developer workload performance data
   */
  async getWorkloadData(): Promise<{
    developers: DeveloperWorkload[];
    metrics: TeamPerformanceMetrics;
  }> {
    const response = await apiClient.get("/developer-workload/performance");

    if (!response.success) {
      throw new Error(
        response.message || "Failed to fetch workload performance data",
      );
    }

    return response.data;
  }

  /**
   * Get code review metrics
   */
  async getCodeReviewMetrics(): Promise<CodeReviewMetrics> {
    const response = await apiClient.get("/code-reviews/metrics");

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch code review metrics");
    }

    return response.data;
  }

  /**
   * Get individual developer performance
   */
  async getDeveloperPerformance(developerId: string): Promise<any> {
    const response = await apiClient.get(
      `/developer-workload/performance/${developerId}`,
    );

    if (!response.success) {
      throw new Error(
        response.message || "Failed to fetch developer performance",
      );
    }

    return response.data;
  }

  /**
   * Update developer workload
   */
  async updateWorkload(
    developerId: string,
    workloadData: Partial<DeveloperWorkload>,
  ): Promise<void> {
    const response = await apiClient.patch(
      `/developer-workload/${developerId}`,
      workloadData,
    );

    if (!response.success) {
      throw new Error(response.message || "Failed to update workload");
    }

    return response.data;
  }
}

export const developerWorkloadService = new DeveloperWorkloadService();
