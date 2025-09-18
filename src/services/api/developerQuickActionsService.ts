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

class DeveloperQuickActionsService {
  async getQuickActions(): Promise<DeveloperQuickAction[]> {
    const response = await apiClient.get<DeveloperQuickAction[]>(
      "/developer-quick-actions",
    );

    if (!response.success) {
      throw new Error(
        response.message || "Failed to fetch developer quick actions",
      );
    }

    return response.data;
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
    const response = await apiClient.patch(`/tasks/${taskId}`, { status });

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
