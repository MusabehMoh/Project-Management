import type {
  RequirementCompletionAnalytics,
  RequirementCompletionMetrics,
} from "@/services/requirementCompletionService";

import { useState, useEffect, useCallback } from "react";

import { requirementCompletionService } from "@/services/requirementCompletionService";

interface UseRequirementCompletionOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  initialPeriod?: "week" | "month" | "quarter" | "year";
  analystId?: number;
}

interface UseRequirementCompletionReturn {
  // Data
  analytics: RequirementCompletionAnalytics | null;
  metrics: RequirementCompletionMetrics | null;

  // Loading states
  loading: boolean;
  analyticsLoading: boolean;
  metricsLoading: boolean;
  refreshing: boolean;

  // Error states
  error: string | null;
  analyticsError: string | null;
  metricsError: string | null;

  // Actions
  refresh: () => Promise<void>;
  refreshAnalytics: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  changePeriod: (
    period: "week" | "month" | "quarter" | "year",
  ) => Promise<void>;
  changeAnalyst: (analystId?: number) => Promise<void>;

  // Current state
  currentPeriod: "week" | "month" | "quarter" | "year";
  currentAnalystId?: number;
}

export function useRequirementCompletion(
  options: UseRequirementCompletionOptions = {},
): UseRequirementCompletionReturn {
  const {
    autoRefresh = true,
    refreshInterval = 300000, // 5 minutes
    initialPeriod = "month",
    analystId,
  } = options;

  // State
  const [analytics, setAnalytics] =
    useState<RequirementCompletionAnalytics | null>(null);
  const [metrics, setMetrics] = useState<RequirementCompletionMetrics | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<
    "week" | "month" | "quarter" | "year"
  >(initialPeriod);
  const [currentAnalystId, setCurrentAnalystId] = useState<number | undefined>(
    analystId,
  );

  // Fetch analytics data
  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setAnalyticsLoading(true);
      }
      setAnalyticsError(null);

      const data = await requirementCompletionService.getCompletionAnalytics();

      setAnalytics(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch analytics";

      setAnalyticsError(errorMessage);
      setError(errorMessage);
    } finally {
      setAnalyticsLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  }, []);

  // Fetch metrics data
  const fetchMetrics = useCallback(
    async (
      period: "week" | "month" | "quarter" | "year" = currentPeriod,
      analystIdParam?: number,
      isRefresh = false,
    ) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setMetricsLoading(true);
        }
        setMetricsError(null);

        const data = await requirementCompletionService.getCompletionMetrics(
          period,
          analystIdParam ?? currentAnalystId,
        );

        setMetrics(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch metrics";

        setMetricsError(errorMessage);
        setError(errorMessage);
      } finally {
        setMetricsLoading(false);
        if (isRefresh) {
          setRefreshing(false);
        }
      }
    },
    [currentPeriod, currentAnalystId],
  );

  // Refresh both analytics and metrics
  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      await Promise.all([
        fetchAnalytics(true),
        fetchMetrics(currentPeriod, currentAnalystId, true),
      ]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to refresh data";

      setError(errorMessage);
    } finally {
      setRefreshing(false);
    }
  }, [fetchAnalytics, fetchMetrics, currentPeriod, currentAnalystId]);

  // Refresh only analytics
  const refreshAnalytics = useCallback(async () => {
    await fetchAnalytics(true);
  }, [fetchAnalytics]);

  // Refresh only metrics
  const refreshMetrics = useCallback(async () => {
    await fetchMetrics(currentPeriod, currentAnalystId, true);
  }, [fetchMetrics, currentPeriod, currentAnalystId]);

  // Change period and fetch new metrics
  const changePeriod = useCallback(
    async (period: "week" | "month" | "quarter" | "year") => {
      setCurrentPeriod(period);
      await fetchMetrics(period, currentAnalystId);
    },
    [fetchMetrics, currentAnalystId],
  );

  // Change analyst and fetch new metrics
  const changeAnalyst = useCallback(
    async (newAnalystId?: number) => {
      setCurrentAnalystId(newAnalystId);
      await fetchMetrics(currentPeriod, newAnalystId);
    },
    [fetchMetrics, currentPeriod],
  );

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);

      try {
        await Promise.all([
          fetchAnalytics(),
          fetchMetrics(currentPeriod, currentAnalystId),
        ]);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load completion data";

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []); // Only run once on mount

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh]);

  return {
    // Data
    analytics,
    metrics,

    // Loading states
    loading,
    analyticsLoading,
    metricsLoading,
    refreshing,

    // Error states
    error,
    analyticsError,
    metricsError,

    // Actions
    refresh,
    refreshAnalytics,
    refreshMetrics,
    changePeriod,
    changeAnalyst,

    // Current state
    currentPeriod,
    currentAnalystId,
  };
}
