import { useState, useEffect } from "react";
import { designerWorkloadService } from "@/services/api";
import type {
  DesignerWorkloadDto,
  TeamMetricsDto,
  GetDesignerWorkloadParams,
} from "@/services/api/designerWorkloadService";

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface UseDesignerWorkloadResult {
  designers: DesignerWorkloadDto[];
  metrics: TeamMetricsDto | null;
  pagination: PaginationInfo;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  fetchPage: (page: number) => Promise<void>;
}

interface UseDesignerWorkloadOptions extends GetDesignerWorkloadParams {
  enabled?: boolean;
}

export function useDesignerWorkload(
  options: UseDesignerWorkloadOptions = {},
): UseDesignerWorkloadResult {
  const { enabled = true, ...params } = options;

  const [designers, setDesigners] = useState<DesignerWorkloadDto[]>([]);
  const [metrics, setMetrics] = useState<TeamMetricsDto | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    pageSize: params.pageSize || 5,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDesignerWorkload = async (page?: number) => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch workload data
      const workloadResponse = await designerWorkloadService.getDesignerWorkload({
        ...params,
        page: page || params.page || 1,
      });

      setDesigners(workloadResponse.designers);
      setPagination(workloadResponse.pagination);

      // Fetch team metrics
      const metricsData = await designerWorkloadService.getTeamMetrics();
      setMetrics(metricsData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch designer workload";
      setError(errorMessage);
      console.error("Error fetching designer workload:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPage = async (page: number) => {
    await fetchDesignerWorkload(page);
  };

  const refetch = async () => {
    await fetchDesignerWorkload(pagination.currentPage);
  };

  useEffect(() => {
    fetchDesignerWorkload();
  }, [
    enabled,
    params.page,
    params.pageSize,
    params.searchQuery,
    params.statusFilter,
    params.sortBy,
    params.sortOrder,
  ]);

  return {
    designers,
    metrics,
    pagination,
    loading,
    error,
    refetch,
    fetchPage,
  };
}
