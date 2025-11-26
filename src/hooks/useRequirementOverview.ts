import type { RequirementOverviewData } from "@/services/api/requirementOverviewService";

import { useState, useEffect } from "react";

import { requirementOverviewService } from "@/services/api";

interface UseRequirementOverviewResult {
  data: RequirementOverviewData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch requirement overview data for dashboard
 */
export function useRequirementOverview(): UseRequirementOverviewResult {
  const [data, setData] = useState<RequirementOverviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);

    try {
      const response =
        await requirementOverviewService.getRequirementOverview();

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.message || "Failed to fetch requirement overview");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch requirement overview";

      setError(errorMessage);
      console.error("Error fetching requirement overview:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchOverview,
  };
}
