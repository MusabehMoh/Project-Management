import type { ProjectRequirement } from "@/types/projectRequirement";

import { useState, useEffect } from "react";

import { projectRequirementsService } from "@/services/api";

interface UseDraftRequirementsResult {
  draftRequirements: ProjectRequirement[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  total: number;
}

export function useDraftRequirements(): UseDraftRequirementsResult {
  const [draftRequirements, setDraftRequirements] = useState<
    ProjectRequirement[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const loadDraftRequirements = async () => {
    try {
      setLoading(true);
      setError(null);

      const result =
        await projectRequirementsService.getPendingApprovalRequirements({
          limit: 5, // Show first 5 draft requirements
          page: 1,
          ...filters,
        });

      setDraftRequirements(result.data || []);
      setTotal(result.pagination?.total || 0);
    } catch (err) {
      console.error("Error loading draft requirements:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load draft requirements",
      );
      setDraftRequirements([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await loadDraftRequirements();
  };

  useEffect(() => {
    loadDraftRequirements();
  }, []);

  return {
    draftRequirements,
    loading,
    error,
    refresh,
    total,
  };
}
