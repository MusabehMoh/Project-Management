import { apiClient } from "@/services/api";

export interface UnassignedTask {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "todo" | "in-progress" | "review" | "testing" | "done";
  projectId: string;
  projectName: string;
  estimatedHours: number;
  dueDate: string;
  type: "feature" | "bug" | "improvement" | "refactor";
  complexity: "simple" | "medium" | "complex";
  tags: string[];
  owningUnit?: string;
}

export interface AlmostCompletedTask {
  id: number;
  treeId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  duration: number;
  projectName: string;
  sprintName: string;
  assigneeName?: string;
  statusId: number;
  priorityId: number;
  progress?: number;
  daysUntilDeadline: number;
  isOverdue: boolean;
  estimatedHours?: number;
  actualHours?: number;
  departmentName?: string;
}

export interface AvailableDeveloper {
  id: number;
  fullName: string;
  gradeName: string;
  email: string;
  department: string;
  departmentId: number;
  militaryNumber: string;
  currentTasksCount: number;
  totalCapacity: number;
  availableCapacity: number;
}

export interface DeveloperQuickActionsResponse {
  unassignedTasks: UnassignedTask[];
  almostCompletedTasks: AlmostCompletedTask[];
  availableDevelopers: AvailableDeveloper[];
}

class DeveloperQuickActionsServiceV2 {
  async getQuickActions(): Promise<DeveloperQuickActionsResponse> {
    const response = await apiClient.get<{
      success: boolean;
      data: DeveloperQuickActionsResponse;
      message: string;
    }>("/developer-quick-actions");

    if (!response.success) {
      throw new Error(
        response.message || "Failed to fetch developer quick actions",
      );
    }

    // Add defensive check for response.data and provide defaults
    const data = response.data || {
      unassignedTasks: [],
      almostCompletedTasks: [],
      availableDevelopers: [],
    };

    // Ensure all required properties exist with defaults
    return {
      unassignedTasks: data.unassignedTasks || [],
      almostCompletedTasks: data.almostCompletedTasks || [],
      availableDevelopers: data.availableDevelopers || [],
    };
  }

  async getUnassignedTasks(): Promise<UnassignedTask[]> {
    const response = await apiClient.get<UnassignedTask[]>(
      "/developer-quick-actions/unassigned-tasks",
    );

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch unassigned tasks");
    }

    return response.data;
  }

  async getAlmostCompletedTasks(): Promise<AlmostCompletedTask[]> {
    const response = await apiClient.get<AlmostCompletedTask[]>(
      "/developer-quick-actions/almost-completed-tasks",
    );

    if (!response.success) {
      throw new Error(
        response.message || "Failed to fetch almost completed tasks",
      );
    }

    return response.data;
  }

  async getAvailableDevelopers(): Promise<AvailableDeveloper[]> {
    const response = await apiClient.get<AvailableDeveloper[]>(
      "/developer-quick-actions/available-developers",
    );

    if (!response.success) {
      throw new Error(
        response.message || "Failed to fetch available developers",
      );
    }

    return response.data;
  }

  async extendTask(
    taskId: number,
    newEndDate: string,
    extensionReason: string,
    additionalHours?: number,
  ): Promise<void> {
    const response = await apiClient.post(
      "/developer-quick-actions/extend-task",
      {
        taskId,
        newEndDate,
        extensionReason,
        additionalHours,
      },
    );

    if (!response.success) {
      throw new Error(response.message || "Failed to extend task deadline");
    }
  }

  async assignDeveloper(taskId: string, developerId: string): Promise<void> {
    const response = await apiClient.post(
      "/developer-quick-actions/assign-developer",
      {
        taskId,
        developerId,
      },
    );

    if (!response.success) {
      throw new Error(response.message || "Failed to assign developer");
    }
  }
}

export const developerQuickActionsServiceV2 =
  new DeveloperQuickActionsServiceV2();
