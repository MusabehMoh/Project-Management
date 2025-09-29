import { apiClient } from "./api/client";

export interface RequirementCompletionAnalytics {
  summary: {
    totalRequirements: number;
    completedRequirements: number;
    onTimeCompleted: number;
    lateCompleted: number;
    overdueRequirements: number;
    atRiskRequirements: number;
    onTimeRate: number;
    avgDelayDays: number;
  };
  byPriority: {
    high: {
      total: number;
      onTime: number;
      late: number;
      overdue: number;
    };
    medium: {
      total: number;
      onTime: number;
      late: number;
      overdue: number;
    };
    low: {
      total: number;
      onTime: number;
      late: number;
      overdue: number;
    };
  };
  monthlyTrend: Array<{
    month: string;
    total: number;
    onTime: number;
    onTimeRate: number;
  }>;
  overdueItems: Array<{
    id: number;
    name: string;
    priority: string;
    expectedDate: string;
    daysOverdue: number;
    assignedAnalyst?: number;
    projectName?: string;
  }>;
  atRiskItems: Array<{
    id: number;
    name: string;
    priority: string;
    expectedDate: string;
    daysUntilDeadline: number;
    assignedAnalyst?: number;
    projectName?: string;
  }>;
}

export interface RequirementCompletionMetrics {
  period: string;
  startDate: string;
  endDate: string;
  totalRequirements: number;
  completedRequirements: number;
  onTimeCompleted: number;
  completionRate: number;
  onTimeRate: number;
}

class RequirementCompletionService {
  /**
   * Get requirement completion analytics
   */
  async getCompletionAnalytics(): Promise<RequirementCompletionAnalytics> {
    const response = await apiClient.get<RequirementCompletionAnalytics>(
      "/requirement-completion/analytics",
    );

    if (!response.success || !response.data) {
      throw new Error(
        response.message || "Failed to fetch completion analytics",
      );
    }

    return response.data;
  }

  /**
   * Get completion metrics for specific period/analyst
   */
  async getCompletionMetrics(
    period: "week" | "month" | "quarter" | "year" = "month",
    analystId?: number,
  ): Promise<RequirementCompletionMetrics> {
    const params = new URLSearchParams();

    params.append("period", period);
    if (analystId) {
      params.append("analystId", analystId.toString());
    }

    const response = await apiClient.get<RequirementCompletionMetrics>(
      `/requirement-completion/metrics?${params.toString()}`,
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to fetch completion metrics");
    }

    return response.data;
  }
}

export const requirementCompletionService = new RequirementCompletionService();
