import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { quickActionsService } from "@/services/api";
import { usePermissions } from "@/hooks/usePermissions";
import {
  QuickAction,
  QuickActionData,
  QuickActionStats,
  QuickActionType,
} from "@/types/quickActions";

export interface UseQuickActionsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseQuickActionsReturn {
  // Data
  quickActionsData: QuickActionData | null;
  stats: QuickActionStats | null;
  actions: QuickAction[];
  unassignedProjects: any[]; // Add unassigned projects list
  projectsWithoutRequirements: any[]; // Add projects without requirements list
  availableMembers: any[]; // Add available members list

  // Loading states
  loading: boolean;
  refreshing: boolean;
  error: string | null;

  // Actions
  refresh: () => Promise<void>;
  handleAction: (action: QuickAction) => void;

  // Utilities
  getActionCount: (actionType: QuickActionType) => number;
  hasActionsAvailable: boolean;
  priorityActions: QuickAction[];
}

export const useQuickActions = (
  options: UseQuickActionsOptions = {},
): UseQuickActionsReturn => {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
  } = options;

  const navigate = useNavigate();
  const { can } = usePermissions();

  // State
  const [quickActionsData, setQuickActionsData] =
    useState<QuickActionData | null>(null);
  const [stats, setStats] = useState<QuickActionStats | null>(null);
  const [unassignedProjects, setUnassignedProjects] = useState<any[]>([]);
  const [projectsWithoutRequirements, setProjectsWithoutRequirements] =
    useState<any[]>([]);
  const [availableMembers, setAvailableMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate available actions based on permissions and data
  const generateActions = useCallback(
    (statsData: QuickActionStats): QuickAction[] => {
      const actions: QuickAction[] = [];

      // Review Requirements
      if (statsData.pendingRequirements > 0) {
        actions.push({
          id: "review-requirements",
          title: "quickActions.reviewRequirements",
          description: "quickActions.reviewRequirementsDesc",
          icon: "document-check",
          priority: "high",
          count: statsData.pendingRequirements,
          action: "REVIEW_REQUIREMENTS",
          variant: "warning",
          permissions: ["projects.manage"],
          href: "/project-requirements?status=pending",
        });
      }

      // Unassigned Projects
      if (statsData.unassignedProjects > 0) {
        actions.push({
          id: "unassigned-projects",
          title: "quickActions.unassignedProjects",
          description: "quickActions.unassignedProjectsDesc",
          icon: "user-plus",
          priority: "high",
          count: statsData.unassignedProjects,
          action: "ASSIGN_PROJECTS",
          variant: "secondary",
          permissions: ["projects.manage"],
          href: "/projects?filter=unassigned",
        });
      }

      // Projects Without Requirements
      if (statsData.projectsWithoutRequirements > 0) {
        actions.push({
          id: "projects-without-requirements",
          title: "quickActions.projectsWithoutRequirements",
          description: "quickActions.projectsWithoutRequirementsDesc",
          icon: "document-plus",
          priority: "high",
          count: statsData.projectsWithoutRequirements,
          action: "ADD_REQUIREMENTS",
          variant: "warning",
          permissions: ["projects.manage"],
        });
      }

      // Available Members
      if (statsData.availableMembers > 0) {
        actions.push({
          id: "available-members",
          title: "quickActions.availableMembers",
          description: "quickActions.availableMembersDesc",
          icon: "users",
          priority: "medium",
          count: statsData.availableMembers,
          action: "ASSIGN_AVAILABLE_MEMBERS",
          variant: "success",
          permissions: ["projects.manage"],
        });
      }

      // View Overdue Items
      if (statsData.overdueItems > 0) {
        actions.push({
          id: "view-overdue",
          title: "quickActions.overdueItems",
          description: "quickActions.overdueItemsDesc",
          icon: "exclamation-triangle",
          priority: "high",
          count: statsData.overdueItems,
          action: "VIEW_OVERDUE",
          variant: "danger",
        });
      }

      return actions.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };

        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    },
    [],
  );

  // Load quick actions data
  const loadQuickActions = useCallback(async () => {
    try {
      setError(null);

      const [
        actionsResponse,
        statsResponse,
        unassignedResponse,
        withoutRequirementsResponse,
        availableMembersResponse,
      ] = await Promise.all([
        quickActionsService.getQuickActions(),
        quickActionsService.getQuickActionStats(),
        quickActionsService.getUnassignedProjects(),
        quickActionsService.getProjectsWithoutRequirements(),
        quickActionsService.getAvailableMembers(),
      ]);

      if (actionsResponse.success && actionsResponse.data) {
        setQuickActionsData(actionsResponse.data);
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      if (unassignedResponse.success && unassignedResponse.data) {
        setUnassignedProjects(unassignedResponse.data);
      } else {
        setUnassignedProjects([]);
      }

      if (
        withoutRequirementsResponse.success &&
        withoutRequirementsResponse.data
      ) {
        setProjectsWithoutRequirements(withoutRequirementsResponse.data);
      } else {
        setProjectsWithoutRequirements([]);
      }

      if (availableMembersResponse.success && availableMembersResponse.data) {
        setAvailableMembers(availableMembersResponse.data);
      } else {
        setAvailableMembers([]);
      }
    } catch (err) {
      setError("Failed to load quick actions data");
      setStats(null);
      setUnassignedProjects([]);
      setProjectsWithoutRequirements([]);
      setAvailableMembers([]);
    }
  }, []);

  // Refresh all data
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadQuickActions();
    } finally {
      setRefreshing(false);
    }
  }, [loadQuickActions]);

  // Handle action clicks
  const handleAction = useCallback(
    (action: QuickAction) => {
      if (action.isDisabled) return;

      if (action.onClick) {
        action.onClick();
      } else if (action.href) {
        navigate(action.href);
      } else {
        // Handle specific action types
        switch (action.action) {
          case "ASSIGN_TASKS":
            navigate("/tasks?filter=unassigned");
            break;
          case "ASSIGN_PROJECTS":
            navigate("/projects?filter=unassigned");
            break;
          case "APPROVE_STATUS":
            navigate("/approvals");
            break;
          case "VIEW_OVERDUE":
            navigate("/overdue");
            break;
          default:
            break;
        }
      }
    },
    [navigate],
  );

  // Computed values
  const actions = stats ? generateActions(stats) : [];
  const getActionCount = useCallback(
    (actionType: QuickActionType) => {
      const action = actions.find((a) => a.action === actionType);

      return action?.count || 0;
    },
    [actions],
  );

  const hasActionsAvailable = actions.length > 0;
  const priorityActions = actions.filter(
    (action) => action.priority === "high",
  );

  // Initial load
  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      try {
        await loadQuickActions();
      } finally {
        setLoading(false);
      }
    };

    initialLoad();
  }, [loadQuickActions]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh]);

  return {
    // Data
    quickActionsData,
    stats,
    actions,
    unassignedProjects,
    projectsWithoutRequirements,
    availableMembers,

    // Loading states
    loading,
    refreshing,
    error,

    // Actions
    refresh,
    handleAction,

    // Utilities
    getActionCount,
    hasActionsAvailable,
    priorityActions,
  };
};
