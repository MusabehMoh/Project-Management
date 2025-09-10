import type {
  ProjectRequirement,
  UpdateProjectRequirementRequest,
  ProjectRequirementFilters,
} from "@/types/projectRequirement";

import { useState, useEffect, useCallback, useRef } from "react";
import { addToast } from "@heroui/toast";

import { projectRequirementsService } from "@/services/api/projectRequirementsService";
import { useProjectRequirements } from "@/hooks/useProjectRequirements";

interface UseDevelopmentRequirementsProps {
  initialFilters?: ProjectRequirementFilters;
  pageSize?: number;
}

export function useDevelopmentRequirements({
  initialFilters = {},
  pageSize = 20,
}: UseDevelopmentRequirementsProps = {}) {
  const [requirements, setRequirements] = useState<ProjectRequirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track in-flight request by key to prevent duplicate calls
  const inFlightKeyRef = useRef<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRequirements, setTotalRequirements] = useState(0);
  // Manage page size locally so UI can change it
  const [pageSizeState, setPageSizeState] = useState<number>(pageSize);

  // Filters
  const [filters, setFilters] = useState<ProjectRequirementFilters>({
    ...initialFilters,
    status: "approved", // Always filter by approved status
  });

  // Projects (for project filter dropdown)
  const { assignedProjects: projects, loadAssignedProjects } =
    useProjectRequirements();

  // Load projects when hook initializes (for dropdown)
  useEffect(() => {
    // Best-effort load; the underlying hook handles its own loading guard
    loadAssignedProjects();
  }, [loadAssignedProjects]);

  /**
   * Load development requirements
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
      const result =
        await projectRequirementsService.getDevelopmentRequirements({
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
          : "Failed to load development requirements";

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
    setFilters({
      ...newFilters,
      status: "approved", // Always maintain approved status filter
    });
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

  // Load requirements when filters or pagination changes
  useEffect(() => {
    loadRequirements();
  }, [loadRequirements]);

  return {
    // Data
    requirements,
    loading,
    error,
    // Projects for dropdown
    projects,

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
