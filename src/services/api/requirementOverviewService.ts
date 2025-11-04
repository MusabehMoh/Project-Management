import { apiClient } from "./client";

export interface NewRequirementsData {
  count: number;
}

export interface OngoingRequirementsData {
  count: number;
}

export interface RequirementOverviewData {
  newRequirements: NewRequirementsData;
  ongoingRequirements: OngoingRequirementsData;
  activeRequirements: number;
  pendingApprovals: number;
}

/**
 * Service for fetching requirement overview data for dashboard
 */
class RequirementOverviewService {
  /**
   * Get requirement overview statistics
   */
  async getRequirementOverview() {
    return apiClient.get<RequirementOverviewData>("/project-requirements/overview");
  }
}

export const requirementOverviewService = new RequirementOverviewService();
