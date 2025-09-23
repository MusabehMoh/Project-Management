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
  department?: string;
  militaryNumber?: string;
  gradeName?: string;
  email?: string;
  phone?: string;
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

export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface WorkloadFilters {
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface WorkloadResponse {
  developers: DeveloperWorkload[];
  metrics: TeamPerformanceMetrics;
  pagination: PaginationInfo;
  filters: WorkloadFilters;
}

export interface CodeReviewMetrics {
  totalReviews: number;
  pendingReviews: number;
  averageReviewTime: number;
  approvalRate: number;
  reviewsThisWeek: number;
  criticalReviews: number;
  reviewsByStatus: {
    approved: number;
    needsChanges: number;
    pending: number;
    rejected: number;
  };
  topReviewers: Array<{
    name: string;
    reviewsCompleted: number;
    averageTime: number;
  }>;
}

export interface TeamWorkload {
  teamId: string;
  teamName: string;
  totalMembers: number;
  activeMembers: number;
  averageWorkload: number;
  totalTasks: number;
  completedTasks: number;
  efficiency: number;
  members: Array<{
    id: string;
    name: string;
    workload: number;
  }>;
}

export interface CapacityPlanning {
  currentSprint: {
    sprintName: string;
    totalCapacity: number;
    allocatedCapacity: number;
    remainingCapacity: number;
    utilizationRate: number;
  };
  nextSprint: {
    sprintName: string;
    estimatedCapacity: number;
    plannedAllocation: number;
    projectedUtilization: number;
  };
  weeklyCapacity: Array<{
    week: string;
    capacity: number;
    allocated: number;
    utilization: number;
  }>;
  developerAvailability: Array<{
    developerId: string;
    name: string;
    hoursAvailable: number;
    hoursAllocated: number;
  }>;
}

export interface BurnoutAnalysis {
  overallRisk: string;
  highRiskDevelopers: Array<{
    developerId: string;
    name: string;
    riskLevel: string;
    workloadPercentage: number;
    overtimeHours: number;
    stressIndicators: string[];
    recommendations: string[];
  }>;
  mediumRiskDevelopers: Array<{
    developerId: string;
    name: string;
    riskLevel: string;
    workloadPercentage: number;
    overtimeHours: number;
    stressIndicators: string[];
    recommendations: string[];
  }>;
  lowRiskDevelopers: Array<{
    developerId: string;
    name: string;
    riskLevel: string;
    workloadPercentage: number;
    overtimeHours: number;
    stressIndicators: string[];
    recommendations: string[];
  }>;
  teamMetrics: {
    averageWorkload: number;
    averageOvertimeHours: number;
    burnoutRiskScore: number;
    recommendedActions: string[];
  };
}

export interface SkillsMatrix {
  developers: Array<{
    developerId: string;
    name: string;
    skills: Record<
      string,
      {
        level: number;
        experience: string;
      }
    >;
  }>;
  skillGaps: Array<{
    skill: string;
    currentLevel: number;
    requiredLevel: number;
    gap: number;
  }>;
  trainingRecommendations: Array<{
    skill: string;
    priority: string;
    developers: string[];
    estimatedTime: string;
  }>;
}

export interface ProductivityTrends {
  monthlyTrends: Array<{
    month: string;
    tasksCompleted: number;
    efficiency: number;
    velocity: number;
  }>;
  weeklyTrends: Array<{
    week: string;
    velocity: number;
    burndown: number;
  }>;
  developerTrends: Array<{
    developerId: string;
    name: string;
    monthlyTasksCompleted: number[];
    efficiencyTrend: number[];
  }>;
  insights: string[];
}

export interface CodeReview {
  reviewId: string;
  title: string;
  author: string;
  authorId: string;
  repository: string;
  branch: string;
  createdAt: string;
  linesAdded: number;
  linesDeleted: number;
  filesChanged: number;
  priority: string;
  assignedReviewers: string[];
  status: string;
  ageInHours: number;
}

class DeveloperWorkloadService {
  /**
   * Get developer workload performance data with pagination and filtering
   */
  async getWorkloadData(params?: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    status?: string;
    search?: string;
  }): Promise<WorkloadResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.pageSize) queryParams.append("pageSize", params.pageSize.toString());
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.search) queryParams.append("search", params.search);

    const url = `/developer-workload${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await apiClient.get(url);

    if (!response.success) {
      throw new Error(
        response.message || "Failed to fetch workload performance data",
      );
    }

    return response.data as WorkloadResponse;
  }

  /**
   * Get code review metrics
   */
  async getCodeReviewMetrics(): Promise<CodeReviewMetrics> {
    const response = await apiClient.get("/developer-workload/code-reviews/metrics");

    if (!response.success) {
      throw new Error(
        response.message || "Failed to fetch code review metrics",
      );
    }

    return response.data as CodeReviewMetrics;
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
  ): Promise<any> {
    const response = await apiClient.patch(
      `/developer-workload/${developerId}`,
      workloadData,
    );

    if (!response.success) {
      throw new Error(response.message || "Failed to update workload");
    }

    return response.data;
  }

  /**
   * Get team workload data
   */
  async getTeamWorkload(): Promise<{
    teams: TeamWorkload[];
    overview: {
      totalTeams: number;
      totalDevelopers: number;
      averageTeamEfficiency: number;
      overloadedDevelopers: number;
      underutilizedDevelopers: number;
    };
  }> {
    const response = await apiClient.get("/developer-workload/teams");

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch team workload data");
    }

    return response.data as {
      teams: TeamWorkload[];
      overview: {
        totalTeams: number;
        totalDevelopers: number;
        averageTeamEfficiency: number;
        overloadedDevelopers: number;
        underutilizedDevelopers: number;
      };
    };
  }

  /**
   * Get capacity planning data
   */
  async getCapacityPlanning(): Promise<CapacityPlanning> {
    const response = await apiClient.get("/developer-workload/capacity-planning");

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch capacity planning data");
    }

    return response.data as CapacityPlanning;
  }

  /**
   * Get burnout analysis
   */
  async getBurnoutAnalysis(): Promise<BurnoutAnalysis> {
    const response = await apiClient.get("/developer-workload/burnout-analysis");

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch burnout analysis data");
    }

    return response.data as BurnoutAnalysis;
  }

  /**
   * Assign task to developer
   */
  async assignTask(taskData: {
    developerId: string;
    taskId: string;
    priority: string;
    estimatedHours: number;
  }): Promise<any> {
    const response = await apiClient.post("/developer-workload/assign-task", taskData);

    if (!response.success) {
      throw new Error(response.message || "Failed to assign task");
    }

    return response.data;
  }

  /**
   * Get skills matrix
   */
  async getSkillsMatrix(): Promise<SkillsMatrix> {
    const response = await apiClient.get("/developer-workload/skills-matrix");

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch skills matrix");
    }

    return response.data as SkillsMatrix;
  }

  /**
   * Get productivity trends
   */
  async getProductivityTrends(): Promise<ProductivityTrends> {
    const response = await apiClient.get("/developer-workload/productivity-trends");

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch productivity trends");
    }

    return response.data as ProductivityTrends;
  }

  /**
   * Get pending code reviews
   */
  async getPendingCodeReviews(): Promise<{
    reviews: CodeReview[];
    summary: {
      totalPending: number;
      criticalPending: number;
      averageAge: number;
      overdueReviews: number;
    };
  }> {
    const response = await apiClient.get("/developer-workload/code-reviews/pending");

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch pending code reviews");
    }

    return response.data as {
      reviews: CodeReview[];
      summary: {
        totalPending: number;
        criticalPending: number;
        averageAge: number;
        overdueReviews: number;
      };
    };
  }

  /**
   * Approve code review
   */
  async approveCodeReview(reviewId: string, comment?: string): Promise<any> {
    const response = await apiClient.post(
      `/developer-workload/code-reviews/${reviewId}/approve`,
      { comment },
    );

    if (!response.success) {
      throw new Error(response.message || "Failed to approve code review");
    }

    return response.data;
  }

  /**
   * Request changes in code review
   */
  async requestChanges(
    reviewId: string,
    comment: string,
    changes?: string[],
  ): Promise<any> {
    const response = await apiClient.post(
      `/developer-workload/code-reviews/${reviewId}/request-changes`,
      { comment, changes },
    );

    if (!response.success) {
      throw new Error(response.message || "Failed to request changes");
    }

    return response.data;
  }
}

export const developerWorkloadService = new DeveloperWorkloadService();
