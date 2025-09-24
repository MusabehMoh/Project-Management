import { useState, useEffect, useCallback } from "react";

import {
  developerQuickActionsService,
  type DeveloperQuickAction,
} from "@/services/api/developerQuickActionsService";

interface UnassignedTask {
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

interface AvailableDeveloper {
  userId: string;
  fullName: string;
  department: string;
  gradeName: string;
  totalTasks: number;
  currentWorkload: "low" | "medium" | "high";
  skills: string[];
  availability: "available" | "busy" | "away";
}

interface UseDeveloperQuickActionsResult {
  unassignedTasks: UnassignedTask[];
  pendingCodeReviews: PendingCodeReview[];
  availableDevelopers: AvailableDeveloper[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  hasActionsAvailable: boolean;
  refresh: () => Promise<void>;
}

interface UseDeveloperQuickActionsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useDeveloperQuickActions(
  options: UseDeveloperQuickActionsOptions = {}
): UseDeveloperQuickActionsResult {
  const { autoRefresh = true, refreshInterval = 30000 } = options;
  
  const [unassignedTasks, setUnassignedTasks] = useState<UnassignedTask[]>([]);
  const [pendingCodeReviews, setPendingCodeReviews] = useState<PendingCodeReview[]>([]);
  const [availableDevelopers, setAvailableDevelopers] = useState<AvailableDeveloper[]>([]);
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
      description: "Improve search performance by optimizing SQL queries and adding indexes",
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

  const mockAvailableDevelopers: AvailableDeveloper[] = [
    {
      userId: "dev-3",
      fullName: "Omar Khalil",
      department: "Frontend Development",
      gradeName: "Senior Developer",
      totalTasks: 3,
      currentWorkload: "medium",
      skills: ["React", "TypeScript", "Next.js"],
      availability: "available",
    },
    {
      userId: "dev-4",
      fullName: "Fatima Nasser", 
      department: "Backend Development",
      gradeName: "Lead Developer",
      totalTasks: 2,
      currentWorkload: "low",
      skills: ["Node.js", "Python", "PostgreSQL"],
      availability: "available",
    },
    {
      userId: "dev-5",
      fullName: "Hassan Ali",
      department: "Full Stack Development", 
      gradeName: "Developer",
      totalTasks: 1,
      currentWorkload: "low",
      skills: ["Vue.js", "Express.js", "MongoDB"],
      availability: "available",
    },
  ];

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use mock data for now
      setUnassignedTasks(mockUnassignedTasks);
      setPendingCodeReviews(mockPendingCodeReviews);
      setAvailableDevelopers(mockAvailableDevelopers);
      
      // In real implementation, would call:
      // const actions = await developerQuickActionsService.getQuickActions();
      // const teamAvailability = await developerQuickActionsService.getTeamAvailability();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch developer quick actions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
  }, [fetchData]);

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
    pendingCodeReviews.length > 0 || 
    availableDevelopers.length > 0;

  return {
    unassignedTasks,
    pendingCodeReviews,
    availableDevelopers,
    loading,
    refreshing,
    error,
    hasActionsAvailable,
    refresh,
  };
}