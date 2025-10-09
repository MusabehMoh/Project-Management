import { useState, useEffect, useCallback } from "react";

import { designRequestsService, DesignRequestDto } from "@/services/api/designRequestsService";

interface UseDesignRequestsOptions {
  page?: number;
  limit?: number;
  taskId?: number;
  assignedToPrsId?: number;
  status?: number;
  includeTaskDetails?: boolean;
  includeRequirementDetails?: boolean;
  autoFetch?: boolean;
}

interface UseDesignRequestsResult {
  designRequests: DesignRequestDto[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  totalPages: number;
  refetch: () => Promise<void>;
  assignDesignRequest: (id: number, assignedToPrsId: number, notes?: string) => Promise<boolean>;
}

/**
 * Custom hook for fetching and managing design requests
 */
export function useDesignRequests(
  options: UseDesignRequestsOptions = {},
): UseDesignRequestsResult {
  const {
    page = 1,
    limit = 20,
    taskId,
    assignedToPrsId,
    status,
    includeTaskDetails = true,
    includeRequirementDetails = true,
    autoFetch = true,
  } = options;

  const [designRequests, setDesignRequests] = useState<DesignRequestDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchDesignRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await designRequestsService.getDesignRequests(
        page,
        limit,
        taskId,
        assignedToPrsId,
        status,
        includeTaskDetails,
        includeRequirementDetails,
      );

      if (response.success) {
        if (Array.isArray(response.data)) {
          // Handle case where data is directly an array
          setDesignRequests(response.data);
          setTotalCount(response.data.length);
          setTotalPages(1);
        } else if (response.data && response.data.data) {
          // Handle case with pagination wrapper
          const { data, totalCount, totalPages } = response.data as {
            data: DesignRequestDto[];
            totalCount: number;
            totalPages: number;
          };

          setDesignRequests(data);
          setTotalCount(totalCount);
          setTotalPages(totalPages);
        } else {
          setError("Invalid data structure received");
        }
      } else {
        setError(response.message || "Failed to fetch design requests");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch design requests";

      setError(errorMessage);
      console.error("Error fetching design requests:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, taskId, assignedToPrsId, status, includeTaskDetails, includeRequirementDetails]);

  const assignDesignRequest = useCallback(
    async (id: number, assignedToPrsId: number, notes?: string): Promise<boolean> => {
      try {
        const response = await designRequestsService.assignDesignRequest(
          id,
          assignedToPrsId,
          notes,
        );

        if (response.success) {
          // Refresh the list after successful assignment
          await fetchDesignRequests();

          return true;
        }

        return false;
      } catch (err) {
        console.error("Error assigning design request:", err);

        return false;
      }
    },
    [fetchDesignRequests],
  );

  useEffect(() => {
    if (autoFetch) {
      fetchDesignRequests();
    }
  }, [autoFetch, fetchDesignRequests]);

  return {
    designRequests,
    loading,
    error,
    totalCount,
    totalPages,
    refetch: fetchDesignRequests,
    assignDesignRequest,
  };
}
