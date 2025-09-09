import type { ProjectRequirement } from "@/types/projectRequirement";

import { useState, useEffect, useCallback, useRef } from "react";

import {
  taskPlanService,
  type TaskPlanFilters,
} from "@/services/api/taskPlanService";

interface UseTaskPlanProps {
  pageSize?: number;
  initialFilters?: TaskPlanFilters;
}

export function useTaskPlan({
  pageSize = 20,
  initialFilters = {},
}: UseTaskPlanProps = {}) {
  const [requirements, setRequirements] = useState<ProjectRequirement[]>([]);
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRequirements, setTotalRequirements] = useState(0);
  const [filters, setFilters] = useState<TaskPlanFilters>(initialFilters);
  const [pageSizeState, setPageSizeState] = useState(pageSize);

  const inFlightKeyRef = useRef<string | null>(null);

  const loadRequirements = useCallback(async () => {
    const key = `${currentPage}|${pageSizeState}|${JSON.stringify(filters)}`;

    if (inFlightKeyRef.current === key) return;
    inFlightKeyRef.current = key;

    setLoading(true);
    setError(null);
    try {
      const result = await taskPlanService.getTaskPlanRequirements({
        page: currentPage,
        limit: pageSizeState,
        filters,
      });

      setRequirements(result.data);
      setTotalPages(result.pagination.totalPages);
      setTotalRequirements(result.pagination.total);

      const uniqueProjects = new Map<number, { id: number; name: string }>();

      result.data.forEach((req) => {
        if (req.project) {
          uniqueProjects.set(req.project.id, {
            id: req.project.id,
            name: req.project.applicationName || `Project ${req.project.id}`,
          });
        }
      });
      setProjects(Array.from(uniqueProjects.values()));
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load task plan requirements";

      setError(message);
    } finally {
      setLoading(false);
      inFlightKeyRef.current = null;
    }
  }, [currentPage, pageSizeState, filters]);

  const updateFilters = useCallback((newFilters: TaskPlanFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const refreshData = useCallback(async () => {
    await loadRequirements();
  }, [loadRequirements]);

  useEffect(() => {
    loadRequirements();
  }, [loadRequirements, currentPage, pageSizeState, filters]);

  return {
    requirements,
    projects,
    loading,
    error,
    currentPage,
    totalPages,
    totalRequirements,
    pageSize: pageSizeState,
    filters,
    updateFilters,
    handlePageChange,
    handlePageSizeChange,
    clearError,
    refreshData,
  };
}
