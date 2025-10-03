import { apiClient } from "@/services/api";

export interface DeveloperTask {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "todo" | "in-progress" | "review" | "testing" | "done";
  assigneeId: string;
  assigneeName: string;
  projectId: string;
  projectName: string;
  estimatedHours: number;
  actualHours: number;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  type: "feature" | "bug" | "improvement" | "refactor";
  complexity: "simple" | "medium" | "complex";
  tags: string[];
}

export interface PullRequest {
  id: string;
  title: string;
  description: string;
  author: string;
  authorId: string;
  reviewers: string[];
  status: "open" | "approved" | "changes-requested" | "merged" | "closed";
  createdAt: string;
  updatedAt: string;
  mergedAt?: string;
  repository: string;
  branch: string;
  targetBranch: string;
  linesAdded: number;
  linesDeleted: number;
  filesChanged: number;
  comments: number;
  priority: "low" | "medium" | "high" | "critical";
}

export interface DeveloperQuickAction {
  id: string;
  type: "task_assignment" | "code_review" | "deployment" | "bug_fix";
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "in-progress" | "completed";
  assignedTo?: string;
  dueDate: string;
  project: string;
  estimatedTime: string;
  createdAt: string;
  data: {
    task?: DeveloperTask;
    pullRequest?: PullRequest;
    deployment?: any;
  };
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

class DeveloperQuickActionsService {
  async getQuickActions(): Promise<{
    unassignedTasks: any[];
    almostCompletedTasks: AlmostCompletedTask[];
    availableDevelopers: any[];
  }> {
    const response = await apiClient.get<{
      unassignedTasks: any[];
      almostCompletedTasks: AlmostCompletedTask[];
      availableDevelopers: any[];
    }>("/developer-quick-actions");

    if (!response.success) {
      throw new Error(
        response.message || "Failed to fetch developer quick actions",
      );
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
    const response = await apiClient.post("/developer-quick-actions/assign", {
      taskId,
      developerId,
      action: "assign_developer",
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to assign developer");
    }
  }

  async assignReviewer(
    pullRequestId: string,
    reviewerId: string,
  ): Promise<void> {
    const response = await apiClient.post("/developer-quick-actions/review", {
      pullRequestId,
      reviewerId,
      action: "assign_reviewer",
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to assign reviewer");
    }
  }

  async updateTaskStatus(
    taskId: string,
    status: DeveloperTask["status"],
  ): Promise<void> {
    // Map frontend status to backend TaskStatus enum
    const statusMapping: Record<DeveloperTask["status"], number> = {
      todo: 1, // ToDo
      "in-progress": 2, // InProgress
      review: 3, // InReview
      testing: 4, // Rework (assuming testing maps to rework)
      done: 5, // Completed
    };

    const response = await apiClient.patch(`/tasks/${taskId}`, {
      StatusId: statusMapping[status] || 1,
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to update task status");
    }
  }

  async getTeamAvailability(): Promise<any> {
    const response = await apiClient.get("/developer-team/availability");

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch team availability");
    }

    return response.data;
  }
}

export const developerQuickActionsService = new DeveloperQuickActionsService();
