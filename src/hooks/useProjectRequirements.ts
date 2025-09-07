import type {
  ProjectRequirement,
  AssignedProject,
  CreateProjectRequirementRequest,
  UpdateProjectRequirementRequest,
  ProjectRequirementFilters,
  ProjectRequirementStats,
} from "@/types/projectRequirement";

import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";

import { projectRequirementsService } from "@/services/api/projectRequirementsService";

interface UseProjectRequirementsProps {
  projectId?: number;
  initialFilters?: ProjectRequirementFilters;
  pageSize?: number;
}

export function useProjectRequirements({
  projectId,
  initialFilters = {},
  pageSize = 20,
}: UseProjectRequirementsProps = {}) {
  const [requirements, setRequirements] = useState<ProjectRequirement[]>([]);
  const [assignedProjects, setAssignedProjects] = useState<AssignedProject[]>([]);
  const [stats, setStats] = useState<ProjectRequirementStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track in-flight request by key to prevent duplicate calls with same params (e.g., StrictMode)
  const inFlightKeyRef = useRef<string | null>(null);
  // Separate in-flight tracker for assigned projects to avoid duplicate calls (e.g. StrictMode + re-renders)
  const assignedInFlightKeyRef = useRef<string | null>(null);

  // Pagination for requirements
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRequirements, setTotalRequirements] = useState(0);

  // Pagination for assigned projects
  const [assignedProjectsCurrentPage, setAssignedProjectsCurrentPage] = useState(1);
  const [assignedProjectsTotalPages, setAssignedProjectsTotalPages] = useState(1);
  const [totalAssignedProjects, setTotalAssignedProjects] = useState(0);
  const [assignedProjectsPageSize, setAssignedProjectsPageSize] = useState(pageSize);
  // Assigned projects filters
  const [assignedProjectsSearch, setAssignedProjectsSearch] = useState("");
  const [assignedProjectsProjectId, setAssignedProjectsProjectId] = useState<number | undefined>(undefined);

  // Filters
  const [filters, setFilters] = useState<ProjectRequirementFilters>(initialFilters);

  /**
   * Load assigned projects for the current analyst
   */
  const loadAssignedProjects = useCallback(
    async (userId?: number) => {
      const key = `${userId || "current"}|${assignedProjectsCurrentPage}|${assignedProjectsPageSize}|${assignedProjectsSearch}|${assignedProjectsProjectId || "all"}`;
      if (assignedInFlightKeyRef.current === key) {
        return; // prevent duplicate identical request
      }
      assignedInFlightKeyRef.current = key;
      setLoading(true);
      setError(null);

      try {
        const result = await projectRequirementsService.getAssignedProjects(
          userId,
          {
            page: assignedProjectsCurrentPage,
            limit: assignedProjectsPageSize,
            search: assignedProjectsSearch || undefined,
            projectId: assignedProjectsProjectId,
          },
        );

        setAssignedProjects(result.data);
        setAssignedProjectsTotalPages(result.pagination.totalPages);
        setTotalAssignedProjects(result.pagination.total);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to load assigned projects";

        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
  assignedInFlightKeyRef.current = null;
      }
    },
  [assignedProjectsCurrentPage, assignedProjectsPageSize, assignedProjectsSearch, assignedProjectsProjectId],
  );

  /**
   * Load requirements for a specific project
   */
  const loadRequirements = useCallback(async () => {
    if (!projectId) return;
    const key = `${projectId}|${currentPage}|${pageSize}|${JSON.stringify(filters)}`;
    if (inFlightKeyRef.current === key) {
      // Duplicate call with identical params; skip
      return;
    }
    inFlightKeyRef.current = key;

    setLoading(true);
    setError(null);

    try {
      const result = await projectRequirementsService.getProjectRequirements(projectId, {
        ...filters,
        page: currentPage,
        limit: pageSize,
      });

      setRequirements(result.data);
      setTotalPages(result.pagination.totalPages);
      setTotalRequirements(result.pagination.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load requirements";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      inFlightKeyRef.current = null;
    }
  }, [projectId, filters, currentPage, pageSize]);

  /**
   * Load requirement statistics
   */
  const loadStats = useCallback(async () => {
    if (!projectId) return;

    try {
      const projectStats = await projectRequirementsService.getRequirementStats(projectId);
      setStats(projectStats);
    } catch (err) {
      console.error("Failed to load requirement stats:", err);
    }
  }, [projectId]);

  /**
   * Create a new requirement
   */
  const createRequirement = useCallback(
    async (data: CreateProjectRequirementRequest) => {
      if (!projectId) throw new Error("Project ID is required");

      setLoading(true);
      try {
        const newRequirement = await projectRequirementsService.createRequirement(projectId, data);
        setRequirements((prev) => [newRequirement, ...prev]);
        await loadStats(); // Refresh stats
        toast.success("Requirement created successfully");
        return newRequirement;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to create requirement";
        toast.error(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [projectId, loadStats]
  );

  /**
   * Update an existing requirement
   */
  const updateRequirement = useCallback(
    async (requirementId: number, data: UpdateProjectRequirementRequest) => {
      setLoading(true);
      try {
        const updatedRequirement = await projectRequirementsService.updateRequirement(
          requirementId,
          data
        );

        setRequirements((prev) =>
          prev.map((req) => (req.id === requirementId ? updatedRequirement : req))
        );
        await loadStats(); // Refresh stats
        toast.success("Requirement updated successfully");
        return updatedRequirement;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to update requirement";
        toast.error(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadStats]
  );

  /**
   * Delete a requirement
   */
  const deleteRequirement = useCallback(
    async (requirementId: number) => {
      setLoading(true);
      try {
        await projectRequirementsService.deleteRequirement(requirementId);
        setRequirements((prev) => prev.filter((req) => req.id !== requirementId));
        await loadStats(); // Refresh stats
        toast.success("Requirement deleted successfully");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to delete requirement";
        toast.error(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadStats]
  );

  /**
   * Send requirement to development manager
   */
  const sendRequirement = useCallback(
    async (requirementId: number) => {
      setLoading(true);
      try {
        const updatedRequirement = await projectRequirementsService.sendRequirement(requirementId);
        setRequirements((prev) =>
          prev.map((req) => (req.id === requirementId ? updatedRequirement : req))
        );
        await loadStats(); // Refresh stats
        toast.success("Requirement sent to development successfully");
        return updatedRequirement;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to send requirement";
        toast.error(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadStats]
  );

  /**
   * Update filters and reset to first page
   */
  const updateFilters = useCallback((newFilters: ProjectRequirementFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  /**
   * Handle assigned projects page change
   */
  const handleAssignedProjectsPageChange = useCallback((page: number) => {
    setAssignedProjectsCurrentPage(page);
  }, []);

  /**
   * Handle assigned projects page size change
   */
  const handleAssignedProjectsPageSizeChange = useCallback((size: number) => {
    setAssignedProjectsCurrentPage(1);
    setAssignedProjectsPageSize(size);
  }, []);

  /**
   * Handle assigned projects search change
   */
  const handleAssignedProjectsSearchChange = useCallback((value: string) => {
    setAssignedProjectsCurrentPage(1);
    setAssignedProjectsSearch(value);
  }, []);

  /**
   * Handle assigned projects project filter change
   */
  const handleAssignedProjectsProjectIdChange = useCallback((projectId?: number) => {
    setAssignedProjectsCurrentPage(1);
    setAssignedProjectsProjectId(projectId);
  }, []);

  /**
   * Handle page change
   */
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  /**
   * Handle page size change
   */
  const handlePageSizeChange = useCallback((_size: number) => {
    setCurrentPage(1);
    // pageSize is handled by parent component through props
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refresh all data
   */
  const refreshData = useCallback(async () => {
    if (projectId) {
      await Promise.all([loadRequirements(), loadStats()]);
    } else {
      await loadAssignedProjects();
    }
  }, [projectId, loadRequirements, loadStats, loadAssignedProjects]);

  // Single orchestrating effect to avoid duplicate fetches
  useEffect(() => {
    if (!projectId) return;

    loadRequirements();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, JSON.stringify(filters), currentPage, pageSize]);

  // Effect for assigned projects pagination
  useEffect(() => {
    if (projectId) return; // Only for assigned projects view

    loadAssignedProjects();
  }, [assignedProjectsCurrentPage, assignedProjectsPageSize, loadAssignedProjects, projectId]);

  return {
    // Data
    requirements,
    assignedProjects,
    stats,
    loading,
    error,

    // Pagination for requirements
    currentPage,
    totalPages,
    totalRequirements,
    pageSize,

    // Pagination for assigned projects
    assignedProjectsCurrentPage,
    assignedProjectsTotalPages,
    totalAssignedProjects,
    assignedProjectsPageSize,
  assignedProjectsSearch,
  assignedProjectsProjectId,

    // Filters
    filters,

    // Actions
    loadAssignedProjects,
    loadRequirements,
    createRequirement,
    updateRequirement,
    deleteRequirement,
    sendRequirement,
    updateFilters,
    handlePageChange,
    handlePageSizeChange,
    handleAssignedProjectsPageChange,
    handleAssignedProjectsPageSizeChange,
  handleAssignedProjectsSearchChange,
  handleAssignedProjectsProjectIdChange,
    clearError,
    refreshData,
  };
}
