import { apiClient } from "./client";

// Team workload API endpoints
const ENDPOINTS = {
  TEAM_WORKLOAD_PERFORMANCE: "/project-requirements/team-workload-performance",
} as const;

export interface TeamMemberMetrics {
  userId: number;
  fullName: string;
  department: string;
  gradeName: string;
  busyStatus: "busy" | "available";
  busyUntil?: string; // ISO date string when user will be available again
  metrics: {
    totalRequirements: number;
    draft: number;
    inProgress: number;
    completed: number;
    performance: number;
  };
}

export interface TeamWorkloadResponse {
  success: boolean;
  data: TeamMemberMetrics[];
  message: string;
}

// Team workload API service
export class TeamWorkloadService {
  /**
   * Get team workload and performance metrics
   */
  async getTeamWorkloadPerformance(): Promise<TeamWorkloadResponse> {
    return apiClient.get<TeamMemberMetrics[]>(
      ENDPOINTS.TEAM_WORKLOAD_PERFORMANCE,
    );
  }
}

// Export singleton instance
export const teamWorkloadService = new TeamWorkloadService();
