import type { ProjectRequirement } from "@/types/projectRequirement";

import { useState, useEffect, useCallback } from "react";

import { projectRequirementsService } from "@/services/api";

interface UseApprovedRequirementsOptions {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseApprovedRequirementsResult {
  requirements: ProjectRequirement[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  refresh: () => Promise<void>;
}

export function useApprovedRequirements(
  options: UseApprovedRequirementsOptions = {},
): UseApprovedRequirementsResult {
  const { limit = 5, autoRefresh = false, refreshInterval = 30000 } = options;
  
  const [requirements, setRequirements] = useState<ProjectRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchRequirements = useCallback(async () => {
    try {
      setError(null);
      
      // Fetch approved requirements from the service
      const result = await projectRequirementsService.getApprovedRequirements({
        limit,
      });
      
      setRequirements(result.data || []);
      setTotalCount(result.totalCount || 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch approved requirements",
      );
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchRequirements();
  }, [fetchRequirements]);

  // Initial load
  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (!loading) {
        fetchRequirements();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loading, fetchRequirements]);

  return {
    requirements,
    loading,
    error,
    totalCount,
    refresh,
  };
}