import type { QuickActionStats } from "@/types/quickActions";

import { useState, useEffect } from "react";

import { quickActionsService } from "@/services/api";

interface UseQuickStatsOptions {
  enabled?: boolean;
  refreshInterval?: number; // Auto-refresh interval in milliseconds
}

interface UseQuickStatsResult {
  stats: QuickActionStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useQuickStats(
  options: UseQuickStatsOptions = {},
): UseQuickStatsResult {
  const { enabled = true, refreshInterval } = options;
  const [stats, setStats] = useState<QuickActionStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await quickActionsService.getQuickActionStats();

      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError("Failed to fetch quick action stats");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch stats";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [enabled]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!refreshInterval || !enabled) return;

    const interval = setInterval(fetchStats, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, enabled]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}
