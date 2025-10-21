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
      ...(searchQuery && { searchQuery }),
      ...(statusFilter && { statusFilter }),
      sortBy,
      sortOrder,
    });

    const response = await apiClient.get<any>(
      `${this.baseUrl}/workload?${queryParams}`,
    );

    // The API returns data directly (not wrapped in ApiResponse for this endpoint)
    const data: any = response.data || response;

    // Handle both PascalCase (C#) and camelCase responses
    const designers = data.designers || data.Designers || [];
    const paginationData = data.pagination || data.Pagination || {};

    return {
      designers,
      pagination: {
        currentPage:
          paginationData.currentPage || paginationData.CurrentPage || 1,
        pageSize: paginationData.pageSize || paginationData.PageSize || 5,
        totalItems: paginationData.totalItems || paginationData.TotalItems || 0,
        totalPages: paginationData.totalPages || paginationData.TotalPages || 0,
        hasNextPage:
          paginationData.hasNextPage !== undefined
            ? paginationData.hasNextPage
            : (paginationData.currentPage || paginationData.CurrentPage || 1) <
              (paginationData.totalPages || paginationData.TotalPages || 0),
        hasPreviousPage:
          paginationData.hasPreviousPage !== undefined
            ? paginationData.hasPreviousPage
            : (paginationData.currentPage || paginationData.CurrentPage || 1) >
              1,
      },
    };
  }

  /**
   * Get team-level metrics for design department
   */
  async getTeamMetrics(): Promise<TeamMetricsDto> {
    const response = await apiClient.get<any>(`${this.baseUrl}/metrics`);

    // The API returns data directly
    const data: any = response.data || response;

    // Handle both PascalCase (C#) and camelCase responses
    return {
      totalDesigners: data.totalDesigners || data.TotalDesigners || 0,
      activeDesigners: data.activeDesigners || data.ActiveDesigners || 0,
      averageEfficiency: data.averageEfficiency || data.AverageEfficiency || 0,
      totalTasksCompleted:
        data.totalTasksCompleted || data.TotalTasksCompleted || 0,
      totalTasksInProgress:
        data.totalTasksInProgress || data.TotalTasksInProgress || 0,
      averageTaskCompletionTime:
        data.averageTaskCompletionTime || data.AverageTaskCompletionTime || 0,
    };
  }
}

export const designerWorkloadService = new DesignerWorkloadService();
