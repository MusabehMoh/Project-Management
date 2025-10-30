import { useState, useEffect } from "react";

import {
  qcWorkloadService,
  QcWorkloadDto,
  QcTeamMetricsDto,
} from "@/services/api/qcWorkloadService";
import { showErrorToast } from "@/utils/toast";

interface UseQcWorkloadOptions {
  enabled?: boolean;
  searchQuery?: string;
  statusFilter?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface UseQcWorkloadResult {
  qcMembers: QcWorkloadDto[];
  metrics: QcTeamMetricsDto | null;
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  };
  refetch: () => Promise<void>;
  fetchPage: (pageNumber: number) => Promise<void>;
}

export function useQcWorkload(
  options: UseQcWorkloadOptions = {},
): UseQcWorkloadResult {
  const {
    enabled = true,
    searchQuery = "",
    statusFilter = "",
    sortBy = "Name",
    sortOrder = "asc",
  } = options;

  const [qcMembers, setQcMembers] = useState<QcWorkloadDto[]>([]);
  const [metrics, setMetrics] = useState<QcTeamMetricsDto | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 5,
  });

  const fetchQcWorkload = async (page: number = 1) => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const [workloadResponse, metricsResponse] = await Promise.all([
        qcWorkloadService.getQcWorkload({
          page,
          pageSize: pagination.pageSize,
          searchQuery: searchQuery || undefined,
          statusFilter: statusFilter || undefined,
          sortBy,
          sortOrder,
        }),
        qcWorkloadService.getQcTeamMetrics(),
      ]);

      // Handle both PascalCase (backend) and camelCase (future-proofing)
      const members = workloadResponse.qcMembers || [];
      const paginationInfo = workloadResponse.pagination;

      setQcMembers(members);
      setMetrics(metricsResponse);

      if (paginationInfo) {
        setPagination({
          currentPage: paginationInfo.currentPage || page,
          totalPages: paginationInfo.totalPages || 1,
          totalCount: paginationInfo.totalItems || 0,
          pageSize: paginationInfo.pageSize || 5,
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch QC workload data";

      setError(errorMessage);

      showErrorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchPage = async (pageNumber: number) => {
    await fetchQcWorkload(pageNumber);
  };

  useEffect(() => {
    fetchQcWorkload();
  }, [enabled, searchQuery, statusFilter, sortBy, sortOrder]);

  return {
    qcMembers,
    metrics,
    loading,
    error,
    pagination,
    refetch: () => fetchQcWorkload(pagination.currentPage),
    fetchPage,
  };
}
