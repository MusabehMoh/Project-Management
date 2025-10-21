import type {
  ProjectRequirement,
  UpdateProjectRequirementRequest,
  ProjectRequirementFilters,
  AssignedProject,
} from "@/types/projectRequirement";

import { useState, useEffect, useCallback, useRef } from "react";
import { addToast } from "@heroui/toast";

import { projectRequirementsService } from "@/services/api/projectRequirementsService";

interface UseApprovedRequirementsProps {
  initialFilters?: ProjectRequirementFilters;
  pageSize?: number;
}

export function useApprovedRequirements({
  initialFilters = {},
  pageSize = 20,
}: UseApprovedRequirementsProps = {}) {
  const [requirements, setRequirements] = useState<ProjectRequirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track in-flight request by key to prevent duplicate calls
  const inFlightKeyRef = useRef<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRequirements, setTotalRequirements] = useState(0);
  const [pageSizeState, setPageSizeState] = useState<number>(pageSize);

  // Filters
  const [filters, setFilters] = useState<ProjectRequirementFilters>({
    ...initialFilters,
  });

  // Projects state (for project filter dropdown)
  const [projects, setProjects] = useState<AssignedProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Track if projects have been loaded
  const projectsLoadedRef = useRef(false);
  const projectsLoadingRef = useRef(false);

  /**
   * Load ALL projects without pagination for dropdown
   */
  const loadAllProjects = useCallback(async () => {
    // If already loading or already loaded, skip
    if (projectsLoadingRef.current || projectsLoadedRef.current) return;

    projectsLoadingRef.current = true;
    setLoadingProjects(true);
    try {
      // Fetch with a very high limit to get all projects
      // Or if your API supports it, add a parameter to fetch all
      const result = await projectRequirementsService.getAllProjects({
        page: 1,
        limit: 1000, // High limit to get all projects
      });

      setProjects(result.data);
      projectsLoadedRef.current = true;
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("Failed to load projects:", err);
      }
      // Don't show toast for projects loading failure as it's not critical
    } finally {
      projectsLoadingRef.current = false;
      setLoadingProjects(false);
    }
  }, []);

  // Load projects once when hook initializes
  useEffect(() => {
    loadAllProjects();
  }, []); // Empty dependency array - load only once

  /**
   * Load approved requirements
   */
  const loadRequirements = useCallback(async () => {
    const key = `${currentPage}|${pageSizeState}|${JSON.stringify(filters)}`;

    if (inFlightKeyRef.current === key) {
      return; // prevent duplicate identical request
    }

    inFlightKeyRef.current = key;
    setLoading(true);
    setError(null);

    try {
      const result = await projectRequirementsService.getApprovedRequirements({
        ...filters,
        page: currentPage,
        limit: pageSizeState,
      });

      setRequirements(result.data);
      setTotalPages(result.pagination.totalPages);
      setTotalRequirements(result.pagination.total);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to load approved requirements";

      setError(errorMessage);
      addToast({
        title: "Error",
        description: errorMessage,
        color: "danger",
      });
    } finally {
      setLoading(false);
      inFlightKeyRef.current = null;
    }
  }, [filters, currentPage, pageSizeState]);

  // Load requirements when filters or pagination changes
  // Use a separate effect to avoid double-loading on mount
  const requirementsKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const key = `${currentPage}|${pageSizeState}|${JSON.stringify(filters)}`;

    // Only load if the key has changed
    if (requirementsKeyRef.current !== key) {
      requirementsKeyRef.current = key;
      loadRequirements();
    }
  }, [filters, currentPage, pageSizeState, loadRequirements]);

  /**
   * Update an existing requirement
   */
  const updateRequirement = useCallback(
    async (requirementId: number, data: UpdateProjectRequirementRequest) => {
      setLoading(true);
      try {
        const updatedRequirement =
          await projectRequirementsService.updateRequirement(
            requirementId,
            data,
          );

        setRequirements((prev) =>
          prev.map((req) =>
            req.id === requirementId ? updatedRequirement : req,
          ),
        );

        addToast({
          title: "Success",
          description: "Requirement updated successfully",
          color: "success",
        });

        return updatedRequirement;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update requirement";

        addToast({
          title: "Error",
          description: errorMessage,
          color: "danger",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Delete a requirement
   */
  const deleteRequirement = useCallback(async (requirementId: number) => {
    setLoading(true);
    try {
      await projectRequirementsService.deleteRequirement(requirementId);
      setRequirements((prev) => prev.filter((req) => req.id !== requirementId));

      addToast({
        title: "Success",
        description: "Requirement deleted successfully",
        color: "success",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete requirement";

      addToast({
        title: "Error",
        description: errorMessage,
        color: "danger",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update filters and reset to first page
   */
  const updateFilters = useCallback((newFilters: ProjectRequirementFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  /**
   * Set project filter (used by UI dropdown). Accepts undefined to clear filter.
   */
  const setProjectFilter = useCallback(
    (projectId?: number) => {
      updateFilters({ ...(filters || {}), projectId });
    },
    [filters, updateFilters],
  );

  /**
   * Handle page change
   */
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refresh data
   */
  const refreshData = useCallback(async () => {
    await loadRequirements();
  }, [loadRequirements]);

  return {
    // Data
    requirements,
    loading,
    error,
    // Projects for dropdown
    projects,
    loadingProjects,

    // Pagination
    currentPage,
    totalPages,
    totalRequirements,
    pageSize: pageSizeState,
    handlePageSizeChange,

    // Filters
    filters,
    setProjectFilter,

    // Actions
    loadRequirements,
    updateRequirement,
    deleteRequirement,
    updateFilters,
    handlePageChange,
    clearError,
    refreshData,
  };
}
