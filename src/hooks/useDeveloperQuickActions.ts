import { useState, useEffect, useCallback } from "react";

import {
  developerQuickActionsServiceV2 as developerQuickActionsService,
  type UnassignedTask,
  type AlmostCompletedTask,
  type AvailableDeveloper,
} from "@/services/api/developerQuickActionsServiceV2";

interface PendingCodeReview {
  id: string;
  title: string;
  description: string;
  author: string;
  authorId: string;
  repository: string;
  branch: string;
  priority: "low" | "medium" | "high" | "critical";
  linesAdded: number;
  linesDeleted: number;
  filesChanged: number;
  createdAt: string;
  dueDate?: string;
}

interface UseDeveloperQuickActionsResult {
  unassignedTasks: UnassignedTask[];
  almostCompletedTasks: AlmostCompletedTask[];
  overdueTasks: AlmostCompletedTask[];
  availableDevelopers: AvailableDeveloper[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  hasActionsAvailable: boolean;
  refresh: () => Promise<void>;
  extendTask: (
    taskId: number,
    newEndDate: string,
    reason: string,
  ) => Promise<void>;
}

interface UseDeveloperQuickActionsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useDeveloperQuickActions(
  options: UseDeveloperQuickActionsOptions = {},
): UseDeveloperQuickActionsResult {
  const { autoRefresh = true, refreshInterval = 30000 } = options;

  const [unassignedTasks, setUnassignedTasks] = useState<UnassignedTask[]>([]);
  const [pendingCodeReviews, setPendingCodeReviews] = useState<
    PendingCodeReview[]
  >([]);
  const [almostCompletedTasks, setAlmostCompletedTasks] = useState<
    AlmostCompletedTask[]
  >([]);
  const [overdueTasks, setOverdueTasks] = useState<
    AlmostCompletedTask[]
  >([]);
  const [availableDevelopers, setAvailableDevelopers] = useState<
    AvailableDeveloper[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data for development
  const mockUnassignedTasks: UnassignedTask[] = [
    {
      id: "task-1",
      title: "Implement user authentication system",
      description: "Create JWT-based authentication with refresh tokens",
      priority: "high",
      status: "todo",
      projectId: "proj-1",
      projectName: "E-Commerce Platform",
      estimatedHours: 16,
      dueDate: "2025-09-30",
      type: "feature",
      complexity: "medium",
      tags: ["authentication", "security"],
      owningUnit: "Development Team A",
    },
    {
      id: "task-2",
      title: "Fix payment gateway timeout issues",
      description: "Resolve timeout issues with Stripe payment processing",
      priority: "critical",
      status: "todo",
      projectId: "proj-1",
      projectName: "E-Commerce Platform",
      estimatedHours: 8,
      dueDate: "2025-09-26",
      type: "bug",
      complexity: "medium",
      tags: ["payment", "stripe", "timeout"],
      owningUnit: "Development Team B",
    },
    {
      id: "task-3",
      title: "Optimize database queries for product search",
      description:
        "Improve search performance by optimizing SQL queries and adding indexes",
      priority: "medium",
      status: "todo",
      projectId: "proj-2",
      projectName: "Product Catalog System",
      estimatedHours: 12,
      dueDate: "2025-10-05",
      type: "improvement",
      complexity: "complex",
      tags: ["database", "performance", "search"],
      owningUnit: "Development Team A",
    },
  ];

  const mockPendingCodeReviews: PendingCodeReview[] = [
    {
      id: "pr-1",
      title: "Add order tracking functionality",
      description: "Implement real-time order tracking with WebSocket updates",
      author: "Ahmed Ali",
      authorId: "dev-1",
      repository: "ecommerce-backend",
      branch: "feature/order-tracking",
      priority: "high",
      linesAdded: 245,
      linesDeleted: 12,
      filesChanged: 8,
      createdAt: "2025-09-23T10:30:00Z",
      dueDate: "2025-09-25",
    },
    {
      id: "pr-2",
      title: "Refactor user authentication middleware",
      description: "Improve code structure and add better error handling",
      author: "Sara Hassan",
      authorId: "dev-2",
      repository: "ecommerce-api",
      branch: "refactor/auth-middleware",
      priority: "medium",
      linesAdded: 89,
      linesDeleted: 156,
      filesChanged: 4,
      createdAt: "2025-09-22T14:20:00Z",
      dueDate: "2025-09-26",
    },
  ];

  const mockAlmostCompletedTasks: AlmostCompletedTask[] = [
    {
      id: 101,
      treeId: "task-101",
      name: "Complete user dashboard implementation",
      description: "Finalize the user dashboard with all required components",
      startDate: "2025-09-20",
      endDate: "2025-09-25",
      duration: 5,
      projectName: "E-Commerce Platform",
      sprintName: "Sprint 3",
      assigneeName: "Ahmed Ali",
      statusId: 2, // in-progress
      priorityId: 2, // high
      progress: 85,
      daysUntilDeadline: 1,
      isOverdue: false,
      estimatedHours: 40,
      actualHours: 34,
      departmentName: "Frontend Team",
    },
    {
      id: 102,
      treeId: "task-102",
      name: "API integration testing",
      description: "Complete integration testing for payment API endpoints",
      startDate: "2025-09-18",
      endDate: "2025-09-24",
      duration: 6,
      projectName: "Payment Gateway",
      sprintName: "Sprint 2",
      assignee: {
        id: 2,
        userName: "sara.hassan",
        militaryNumber: "23456",
        fullName: "Sara Hassan",
        gradeName: "Lieutenant",
        statusId: 1,
        department: "Development"
      },
      statusId: 3, // review
      priorityId: 3, // critical
      progress: 90,
      daysUntilDeadline: 0,
      isOverdue: true,
      estimatedHours: 24,
      actualHours: 26,
      departmentName: "Backend Team",
    },
    {
      id: 103,
      treeId: "task-103",
      name: "Database migration scripts",
      description: "Prepare and test database migration scripts for production",
      startDate: "2025-09-21",
      endDate: "2025-09-26",
      duration: 5,
      projectName: "System Upgrade",
      sprintName: "Sprint 1",
      assigneeName: "Omar Khalil",
      statusId: 2, // in-progress
      priorityId: 2, // high
      progress: 75,
      daysUntilDeadline: 2,
      isOverdue: false,
      estimatedHours: 32,
      actualHours: 28,
      departmentName: "DevOps Team",
    },
  ];
  const mockAvailableDevelopers: AvailableDeveloper[] = [
    {
      id: 3,
      fullName: "Omar Khalil",
      gradeName: "Senior Developer",
      email: "omar.khalil@company.com",
      department: "Frontend Development",
      departmentId: 1,
      militaryNumber: "12345",
      currentTasksCount: 3,
      totalCapacity: 5,
      availableCapacity: 2,
    },
    {
      id: 4,
      fullName: "Fatima Nasser",
      gradeName: "Lead Developer",
      email: "fatima.nasser@company.com",
      department: "Backend Development",
      departmentId: 2,
      militaryNumber: "23456",
      currentTasksCount: 2,
      totalCapacity: 5,
      availableCapacity: 3,
    },
    {
      id: 5,
      fullName: "Hassan Ali",
      gradeName: "Developer",
      email: "hassan.ali@company.com",
      department: "Full Stack Development",
      departmentId: 3,
      militaryNumber: "34567",
      currentTasksCount: 1,
      totalCapacity: 5,
      availableCapacity: 4,
    },
  ];

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      // Make actual API call to get all developer quick actions
      const response = await developerQuickActionsService.getQuickActions();

      setUnassignedTasks(response.unassignedTasks);
      setAlmostCompletedTasks(response.almostCompletedTasks);
      setOverdueTasks(response.overdueTasks);
      setAvailableDevelopers(response.availableDevelopers);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch developer quick actions",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
  }, [fetchData]);

  const extendTask = useCallback(
    async (taskId: number, newEndDate: string, _reason: string) => {
      try {
        // In real implementation, would call:
        // await developerQuickActionsService.extendTask(taskId, newEndDate, reason);

        // Update the local state to reflect the change
        setAlmostCompletedTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  endDate: newEndDate,
                  daysUntilDeadline: Math.ceil(
                    (new Date(newEndDate).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24),
                  ),
                  isOverdue: false,
                }
              : task,
          ),
        );

        // Refresh data to get updated information
        await refresh();
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : "Failed to extend task",
        );
      }
    },
    [refresh],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        refresh();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, refresh]);

  const hasActionsAvailable =
    unassignedTasks.length > 0 ||
    almostCompletedTasks.length > 0 ||
    (overdueTasks?.length || 0) > 0 ||
    availableDevelopers.length > 0;

  return {
    unassignedTasks,
    almostCompletedTasks,
    overdueTasks,
    availableDevelopers,
    loading,
    refreshing,
    error,
    hasActionsAvailable,
    refresh,
    extendTask,
  };
}
