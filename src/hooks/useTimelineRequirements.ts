import { useState, useEffect, useCallback } from "react";
import { apiService } from "@/services/api";

export interface TimelineRequirement {
  id: number;
  requirementId: number;
  timelineId?: number;
  status: "pending" | "timeline_created" | "in_progress" | "completed";
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  assignedManager?: number;
  requirement?: {
    id: number;
    name: string;
    description: string;
    priority: "low" | "medium" | "high" | "critical";
    expectedCompletionDate: string;
    status: "draft" | "in-development" | "completed";
    project?: {
      id: number;
      applicationName: string;
      projectOwner: string;
      owningUnit: string;
    };
    createdBy: number;
    assignedAnalyst?: number;
  };
  timeline?: {
    id: number;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    projectId: number;
  };
}

export interface CreateTimelineFromRequirementRequest {
  requirementId: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  assignedManager?: number;
}

export interface TimelineRequirementFilters {
  status: string[];
  priority: string[];
  projectId?: number;
  assignedManager?: number;
}

export interface TimelineRequirementStats {
  total: number;
  pending: number;
  timelineCreated: number;
  inProgress: number;
  completed: number;
}

interface UseTimelineRequirementsOptions {
  pageSize?: number;
  autoLoad?: boolean;
}

export const useTimelineRequirements = (options: UseTimelineRequirementsOptions = {}) => {
  const { pageSize = 20, autoLoad = true } = options;

  // State
  const [timelineRequirements, setTimelineRequirements] = useState<TimelineRequirement[]>([]);
  const [stats, setStats] = useState<TimelineRequirementStats>({
    total: 0,
    pending: 0,
    timelineCreated: 0,
    inProgress: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRequirements, setTotalRequirements] = useState(0);

  // Filters
  const [filters, setFilters] = useState<TimelineRequirementFilters>({
    status: [],
    priority: [],
    projectId: undefined,
    assignedManager: undefined,
  });

  // Load timeline requirements
  const loadTimelineRequirements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });

      if (filters.status.length > 0) {
        params.append("status", filters.status.join(","));
      }
      if (filters.priority.length > 0) {
        params.append("priority", filters.priority.join(","));
      }
      if (filters.projectId) {
        params.append("projectId", filters.projectId.toString());
      }
      if (filters.assignedManager) {
        params.append("assignedManager", filters.assignedManager.toString());
      }

      const response = await apiService.get(`/timeline-requirements?${params.toString()}`);

      if (response.success) {
        setTimelineRequirements(response.data);
        setStats(response.stats);
        setTotalPages(response.pagination.totalPages);
        setTotalRequirements(response.pagination.totalItems);
      } else {
        throw new Error(response.message || "Failed to load timeline requirements");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load timeline requirements";
      setError(errorMessage);
      setTimelineRequirements([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters]);

  // Create timeline from requirement
  const createTimelineFromRequirement = useCallback(async (data: CreateTimelineFromRequirementRequest) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.post("/timeline-requirements/create-timeline", data);

      if (response.success) {
        // Refresh the list to show updated data
        await loadTimelineRequirements();
        return response.data;
      } else {
        throw new Error(response.message || "Failed to create timeline");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create timeline";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadTimelineRequirements]);

  // Update timeline requirement
  const updateTimelineRequirement = useCallback(async (id: number, data: Partial<TimelineRequirement>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.put(`/timeline-requirements/${id}`, data);

      if (response.success) {
        // Update local state
        setTimelineRequirements(prev => 
          prev.map(tr => tr.id === id ? { ...tr, ...response.data } : tr)
        );
        return response.data;
      } else {
        throw new Error(response.message || "Failed to update timeline requirement");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update timeline requirement";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete timeline requirement
  const deleteTimelineRequirement = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.delete(`/timeline-requirements/${id}`);

      if (response.success) {
        // Remove from local state
        setTimelineRequirements(prev => prev.filter(tr => tr.id !== id));
        // Update stats
        setStats(prev => ({ ...prev, total: prev.total - 1 }));
        return true;
      } else {
        throw new Error(response.message || "Failed to delete timeline requirement");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete timeline requirement";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter and pagination handlers
  const updateFilters = useCallback((newFilters: Partial<TimelineRequirementFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshData = useCallback(() => {
    loadTimelineRequirements();
  }, [loadTimelineRequirements]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    if (autoLoad) {
      loadTimelineRequirements();
    }
  }, [loadTimelineRequirements, autoLoad]);

  return {
    // Data
    timelineRequirements,
    stats,
    loading,
    error,

    // Pagination
    currentPage,
    totalPages,
    totalRequirements,
    pageSize,

    // Filters
    filters,

    // Actions
    loadTimelineRequirements,
    createTimelineFromRequirement,
    updateTimelineRequirement,
    deleteTimelineRequirement,
    updateFilters,
    handlePageChange,
    clearError,
    refreshData,
  };
};
