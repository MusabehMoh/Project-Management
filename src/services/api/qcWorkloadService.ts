import { apiClient } from "@/services/api";

// DTOs matching backend .NET API
export interface QcWorkloadDto {
  prsId: number;
  qcName: string;
  gradeName: string;
  currentTasksCount: number;
  completedTasksCount: number;
  averageTaskCompletionTime: number;
  efficiency: number;
  workloadPercentage: number;
  availableHours: number;
  status: string;
  skills?: string[]; // Additional frontend property
}

export interface QcTeamMetricsDto {
  totalQcMembers: number;
  activeQcMembers: number;
  averageEfficiency: number;
  totalTasksCompleted: number;
  totalTasksInProgress: number;
  averageTaskCompletionTime: number;
}

export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface QcWorkloadResponse {
  qcMembers: QcWorkloadDto[];
  pagination: PaginationInfo;
}

// Legacy interface names for compatibility
export interface QCWorkload extends QcWorkloadDto {
  qcId: number; // Alias for prsId
}

export interface QCTeamPerformanceMetrics extends QcTeamMetricsDto {}

export interface QCWorkloadFilters {
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface QCWorkloadResponse {
  qcMembers: QCWorkload[];
  metrics: QCTeamPerformanceMetrics;
  pagination: PaginationInfo;
  filters: QCWorkloadFilters;
}

export interface QCTestMetrics {
  totalTests: number;
  pendingTests: number;
  averageTestTime: number;
  passRate: number;
  testsThisWeek: number;
  criticalTests: number;
  testsByStatus: {
    passed: number;
    failed: number;
    pending: number;
    blocked: number;
  };
  topTesters: Array<{
    name: string;
    testsCompleted: number;
    averageTime: number;
  }>;
}

export interface QCTeamWorkload {
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

export interface QCCapacityPlanning {
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
  qcMemberAvailability: Array<{
    qcId: string;
    name: string;
    hoursAvailable: number;
    hoursAllocated: number;
  }>;
}

export interface QCBurnoutAnalysis {
  overallRisk: string;
  highRiskMembers: Array<{
    qcId: string;
    name: string;
    riskLevel: string;
    workloadPercentage: number;
    overtimeHours: number;
    stressIndicators: string[];
    recommendations: string[];
  }>;
  mediumRiskMembers: Array<{
    qcId: string;
    name: string;
    riskLevel: string;
    workloadPercentage: number;
    overtimeHours: number;
    stressIndicators: string[];
    recommendations: string[];
  }>;
  lowRiskMembers: Array<{
    qcId: string;
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

export interface QCSkillsMatrix {
  qcMembers: Array<{
    qcId: string;
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
    qcMembers: string[];
    estimatedTime: string;
  }>;
}

export interface QCProductivityTrends {
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
  qcMemberTrends: Array<{
    qcId: string;
    name: string;
    monthlyTasksCompleted: number[];
    efficiencyTrend: number[];
  }>;
  insights: string[];
}

export interface QCTest {
  testId: string;
  title: string;
  author: string;
  authorId: string;
  project: string;
  feature: string;
  createdAt: string;
  testCases: number;
  priority: string;
  assignedTesters: string[];
  status: string;
  ageInHours: number;
}

class QcWorkloadService {
  /**
   * Get QC workload performance data with pagination and filtering
   */
  async getQcWorkload(params?: {
    page?: number;
    pageSize?: number;
    searchQuery?: string;
    statusFilter?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<QcWorkloadResponse> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.pageSize)
      queryParams.append("pageSize", params.pageSize.toString());
    if (params?.searchQuery)
      queryParams.append("searchQuery", params.searchQuery);
    if (params?.statusFilter)
      queryParams.append("statusFilter", params.statusFilter);
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const url = `/qc/workload${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await apiClient.get(url);

    // Handle both wrapped (ApiResponse) and direct responses
    let data: any;

    if (response.success !== undefined) {
      // Wrapped response format
      if (!response.success) {
        throw new Error(
          response.message || "Failed to fetch QC workload performance data",
        );
      }
      data = response.data;
    } else {
      // Direct response format (QC controller returns data directly)
      data = response;
    }

    // Handle both PascalCase (backend) and camelCase (future-proofing)
    const qcMembers = (data.qcMembers || data.QcMembers || []).map(
      (member: any) => ({
        prsId: member.prsId || member.PrsId,
        qcName: member.qcName || member.QcName,
        gradeName: member.gradeName || member.GradeName,
        currentTasksCount: member.currentTasksCount || member.CurrentTasksCount,
        completedTasksCount:
          member.completedTasksCount || member.CompletedTasksCount,
        averageTaskCompletionTime:
          member.averageTaskCompletionTime || member.AverageTaskCompletionTime,
        efficiency: member.efficiency || member.Efficiency,
        workloadPercentage:
          member.workloadPercentage || member.WorkloadPercentage,
        availableHours: member.availableHours || member.AvailableHours,
        status: member.status || member.Status, // Mock skills for now
      }),
    );

    const pagination = data.pagination || data.Pagination || {};

    return {
      qcMembers,
      pagination: {
        currentPage: pagination.currentPage || pagination.CurrentPage || 1,
        pageSize: pagination.pageSize || pagination.PageSize || 5,
        totalItems: pagination.totalItems || pagination.TotalItems || 0,
        totalPages: pagination.totalPages || pagination.TotalPages || 1,
      },
    };
  }

  /**
   * Get QC team metrics
   */
  async getQcTeamMetrics(): Promise<QcTeamMetricsDto> {
    const response = await apiClient.get("/qc/metrics");

    // Handle both wrapped (ApiResponse) and direct responses
    let data: any;

    if (response.success !== undefined) {
      // Wrapped response format
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch QC team metrics");
      }
      data = response.data;
    } else {
      // Direct response format (QC controller returns data directly)
      data = response;
    }

    // Handle both PascalCase (backend) and camelCase (future-proofing)
    return {
      totalQcMembers: data.totalQcMembers || data.TotalQcMembers || 0,
      activeQcMembers: data.activeQcMembers || data.ActiveQcMembers || 0,
      averageEfficiency: data.averageEfficiency || data.AverageEfficiency || 0,
      totalTasksCompleted:
        data.totalTasksCompleted || data.TotalTasksCompleted || 0,
      totalTasksInProgress:
        data.totalTasksInProgress || data.TotalTasksInProgress || 0,
      averageTaskCompletionTime:
        data.averageTaskCompletionTime || data.AverageTaskCompletionTime || 0,
    };
  }

  // Legacy method for backward compatibility
  async getWorkloadData(params?: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    status?: string;
    search?: string;
  }): Promise<QCWorkloadResponse> {
    const workloadResponse = await this.getQcWorkload({
      page: params?.page,
      pageSize: params?.pageSize,
      searchQuery: params?.search,
      statusFilter: params?.status,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
    });

    const metrics = await this.getQcTeamMetrics();

    // Convert to legacy interface
    const qcMembers: QCWorkload[] = workloadResponse.qcMembers.map(
      (member) => ({
        ...member,
        qcId: member.prsId,
        currentTasks: member.currentTasksCount,
        completedTasks: member.completedTasksCount,
        averageTaskTime: member.averageTaskCompletionTime,
        currentProjects: [],
        busyUntil: undefined,
        department: "Quality Assurance",
        militaryNumber: "",
        email: "",
        phone: "",
      }),
    );

    return {
      qcMembers,
      metrics: {
        totalQcMembers: metrics.totalQcMembers,
        activeQcMembers: metrics.activeQcMembers,
        averageEfficiency: metrics.averageEfficiency,
        totalTasksCompleted: metrics.totalTasksCompleted,
        totalTasksInProgress: metrics.totalTasksInProgress,
        averageTaskCompletionTime: metrics.averageTaskCompletionTime,
      },
      pagination: workloadResponse.pagination,
      filters: {
        status: params?.status,
        search: params?.search,
        sortBy: params?.sortBy,
        sortOrder: params?.sortOrder,
      },
    };
  }

  /**
   * Get QC test metrics
   */
  async getTestMetrics(): Promise<QCTestMetrics> {
    const response = await apiClient.get("/qc-workload/tests/metrics");

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch QC test metrics");
    }

    return response.data as QCTestMetrics;
  }

  /**
   * Get individual QC member performance
   */
  async getQCMemberPerformance(qcId: string): Promise<any> {
    const response = await apiClient.get(`/qc-workload/performance/${qcId}`);

    if (!response.success) {
      throw new Error(
        response.message || "Failed to fetch QC member performance",
      );
    }

    return response.data;
  }

  /**
   * Update QC member workload
   */
  async updateWorkload(
    qcId: string,
    workloadData: Partial<QCWorkload>,
  ): Promise<any> {
    const response = await apiClient.patch(
      `/qc-workload/${qcId}`,
      workloadData,
    );

    if (!response.success) {
      throw new Error(response.message || "Failed to update QC workload");
    }

    return response.data;
  }

  /**
   * Get QC team workload data
   */
  async getTeamWorkload(): Promise<{
    teams: QCTeamWorkload[];
    overview: {
      totalTeams: number;
      totalQCMembers: number;
      averageTeamEfficiency: number;
      overloadedMembers: number;
      underutilizedMembers: number;
    };
  }> {
    const response = await apiClient.get("/qc-workload/teams");

    if (!response.success) {
      throw new Error(
        response.message || "Failed to fetch QC team workload data",
      );
    }

    return response.data as {
      teams: QCTeamWorkload[];
      overview: {
        totalTeams: number;
        totalQCMembers: number;
        averageTeamEfficiency: number;
        overloadedMembers: number;
        underutilizedMembers: number;
      };
    };
  }

  /**
   * Get QC capacity planning data
   */
  async getCapacityPlanning(): Promise<QCCapacityPlanning> {
    const response = await apiClient.get("/qc-workload/capacity-planning");

    if (!response.success) {
      throw new Error(
        response.message || "Failed to fetch QC capacity planning data",
      );
    }

    return response.data as QCCapacityPlanning;
  }

  /**
   * Get QC burnout analysis
   */
  async getBurnoutAnalysis(): Promise<QCBurnoutAnalysis> {
    const response = await apiClient.get("/qc-workload/burnout-analysis");

    if (!response.success) {
      throw new Error(
        response.message || "Failed to fetch QC burnout analysis data",
      );
    }

    return response.data as QCBurnoutAnalysis;
  }

  /**
   * Assign test to QC member
   */
  async assignTest(testData: {
    qcId: string;
    testId: string;
    priority: string;
    estimatedHours: number;
  }): Promise<any> {
    const response = await apiClient.post("/qc-workload/assign-test", testData);

    if (!response.success) {
      throw new Error(response.message || "Failed to assign test");
    }

    return response.data;
  }

  /**
   * Get QC skills matrix
   */
  async getSkillsMatrix(): Promise<QCSkillsMatrix> {
    const response = await apiClient.get("/qc-workload/skills-matrix");

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch QC skills matrix");
    }

    return response.data as QCSkillsMatrix;
  }

  /**
   * Get QC productivity trends
   */
  async getProductivityTrends(): Promise<QCProductivityTrends> {
    const response = await apiClient.get("/qc-workload/productivity-trends");

    if (!response.success) {
      throw new Error(
        response.message || "Failed to fetch QC productivity trends",
      );
    }

    return response.data as QCProductivityTrends;
  }

  /**
   * Get pending QC tests
   */
  async getPendingTests(): Promise<{
    tests: QCTest[];
    summary: {
      totalPending: number;
      criticalPending: number;
      averageAge: number;
      overdueTests: number;
    };
  }> {
    const response = await apiClient.get("/qc-workload/tests/pending");

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch pending QC tests");
    }

    return response.data as {
      tests: QCTest[];
      summary: {
        totalPending: number;
        criticalPending: number;
        averageAge: number;
        overdueTests: number;
      };
    };
  }

  /**
   * Complete QC test
   */
  async completeTest(testId: string, results: any): Promise<any> {
    const response = await apiClient.post(
      `/qc-workload/tests/${testId}/complete`,
      { results },
    );

    if (!response.success) {
      throw new Error(response.message || "Failed to complete test");
    }

    return response.data;
  }

  /**
   * Report test failure
   */
  async reportTestFailure(
    testId: string,
    issues: string[],
    severity: string,
  ): Promise<any> {
    const response = await apiClient.post(
      `/qc-workload/tests/${testId}/report-failure`,
      { issues, severity },
    );

    if (!response.success) {
      throw new Error(response.message || "Failed to report test failure");
    }

    return response.data;
  }
}

export const qcWorkloadService = new QcWorkloadService();
