import type { RequirementHistoryDto } from "@/types/projectRequirement";

import { useState, useEffect } from "react";

import { projectRequirementsService } from "@/services/api";

interface UseRequirementHistoryOptions {
  requirementId: number | undefined;
  enabled?: boolean;
}

interface UseRequirementHistoryResult {
  history: RequirementHistoryDto[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRequirementHistory(
  options: UseRequirementHistoryOptions,
): UseRequirementHistoryResult {
  const { requirementId, enabled = true } = options;
  const [history, setHistory] = useState<RequirementHistoryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequirementHistory = async () => {
    if (!requirementId || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const response =
        await projectRequirementsService.getRequirementStatusHistory(
          requirementId,
        );

      if (response.success && response.data) {
        setHistory(response.data);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch requirement history";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirementHistory();
  }, [requirementId, enabled]);

  return {
    history,
    loading,
    error,
    refetch: fetchRequirementHistory,
  };
}
