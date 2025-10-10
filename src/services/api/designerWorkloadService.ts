import { apiClient } from "./client";

// DTOs
export interface DesignerWorkloadDto {
  prsId: number;
  designerName: string;
  gradeName: string;
  currentTasksCount: number;
  completedTasksCount: number;
  averageTaskCompletionTime: number; // in hours
  efficiency: number; // percentage
  workloadPercentage: number; // percentage
  availableHours: number;
  status: string; // available, busy, blocked, on-leave
}

export interface TeamMetricsDto {
  totalDesigners: number;
  activeDesigners: number;
  averageEfficiency: number; // percentage
  totalTasksCompleted: number;
  totalTasksInProgress: number;
  averageTaskCompletionTime: number; // in hours
}

export interface GetDesignerWorkloadParams {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  statusFilter?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface DesignerWorkloadResponse {
  designers: DesignerWorkloadDto[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

class DesignerWorkloadService {
  private readonly baseUrl = "/designers";

  /**
   * Get designer workload data with pagination and filters
   */
  async getDesignerWorkload(
    params: GetDesignerWorkloadParams = {},
  ): Promise<DesignerWorkloadResponse> {
    const {
      page = 1,
      pageSize = 5,
      searchQuery = "",
      statusFilter = "",
      sortBy = "efficiency",
      sortOrder = "desc",
    } = params;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(searchQuery && { search: searchQuery }),
      ...(statusFilter && { status: statusFilter }),
      sortBy,
      sortOrder,
    });

    const response = await apiClient.get<DesignerWorkloadResponse>(
      `${this.baseUrl}/workload?${queryParams}`,
    );

    return response.data;
  }

  /**
   * Get team-level metrics for design department
   */
  async getTeamMetrics(): Promise<TeamMetricsDto> {
    const response = await apiClient.get<TeamMetricsDto>(
      `${this.baseUrl}/metrics`,
    );

    return response.data;
  }
}

export const designerWorkloadService = new DesignerWorkloadService();
