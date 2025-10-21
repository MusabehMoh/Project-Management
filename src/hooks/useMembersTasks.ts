import { useState, useEffect, useCallback, useRef } from "react";
import { addToast } from "@heroui/toast";

import {
  MemberTask,
  TaskSearchParams,
  TaskConfigData,
  TasksResponse,
} from "@/types/membersTasks";
import { membersTasksService } from "@/services/api/membersTasksService";
import { useLanguage } from "@/contexts/LanguageContext";

interface UseMembersTasksResult {
  tasks: MemberTask[];
  tasksConfigData: TaskConfigData;
  loading: boolean;
  headerLoading: boolean;
  initialLoading: boolean;
  changeStatusLoading: boolean;
  error: string | null;

  totalPages: number;
  totalCount: number;
  fetchTasks: (params?: TaskSearchParams) => Promise<void>;
  refreshTasks: () => Promise<void>;
  exportTasks: (format: "csv" | "pdf" | "xlsx") => Promise<void>;
  requestDesign: (id: string, notes: string) => Promise<boolean>;
  changeStatus: (id: string, typeId: string, notes: string) => Promise<boolean>;
  changeAssignees?: (
    taskId: string,
    memberIds: string[],
    notes: string,
    startDate?: string,
    endDate?: string,
  ) => Promise<boolean>;
  tasksConfig: () => Promise<void>;
  handlePageChange: (page: number) => void;
  handlePageSizeChange: (limit: number) => void;
  handleProjectChange: (id: number) => void;
  handleSearchChange: (search: string) => void;
  handlePriorityChange: (priorityId: number) => void;
  handleStatusChange: (statusId: number) => void;
  handleAssigneeChange: (memberIds: number[]) => void;
  handleTypeChange: (typeId: number) => void;
  handleResetFilters: () => void;
  taskParametersRequest: TaskSearchParams;
}

export const useMembersTasks = (): UseMembersTasksResult => {
  const [tasks, setTasks] = useState<MemberTask[]>([]);
  const [tasksConfigData, setTasksConfigData] = useState<TaskConfigData>({
    totalTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    taskStatus: [],
    taskPriority: [],
    projects: [],
  });
  const [loading, setLoading] = useState(false);
  const [headerLoading, setHeaderLoading] = useState(false);
  const [changeStatusLoading, setChangeStatusLoading] = useState(false);
  const [initialCount, setInitialCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { t } = useLanguage();

  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [taskParametersRequest, setTaskParametersRequest] =
    useState<TaskSearchParams>({
      limit: 20,
      page: 1,
    });

  const isInitialMount = useRef(true);

  /// reset filters
  const handleResetFilters = useCallback(() => {
    setTaskParametersRequest({
      limit: 20,
      page: 1,
    });
  }, []);

  /**
   * Handle page change
   */
  const handlePageChange = useCallback((page: number) => {
    setTaskParametersRequest((prev) => ({
      ...prev,
      page: page,
    }));
  }, []);

  /**
   * Handle page size change
   */
  const handlePageSizeChange = useCallback((limit: number) => {
    setTaskParametersRequest((prev) => ({
      ...prev,
      page: 1,
      limit,
    }));
    console.log("Page size changed to:", limit);
  }, []);

  /**
   * Handle project change
   */
  const handleProjectChange = useCallback((id: number) => {
    setTaskParametersRequest((prev) => ({
      ...prev,
      projectId: id,
    }));
  }, []);

  /**
   * Handle search change
   */
  const handleSearchChange = useCallback((search: string) => {
    setTaskParametersRequest((prev) => ({
      ...prev,
      search,
    }));
  }, []);

  /**
   * Handle status change
   */
  const handleStatusChange = useCallback((statusId: number) => {
    setTaskParametersRequest((prev) => ({
      ...prev,
      statusId: statusId,
    }));
  }, []);

  /**
   * Handle priority change
   */
  const handlePriorityChange = useCallback((priorityId: number) => {
    setTaskParametersRequest((prev) => ({
      ...prev,
      priorityId: priorityId,
    }));
  }, []);

  /**
   * Handle assignee change
   */
  const handleAssigneeChange = useCallback((memberIds: number[]) => {
    setTaskParametersRequest((prev) => ({
      ...prev,
      memberIds: memberIds.length > 0 ? memberIds : undefined,
      memberFilterMode: "any", // Show tasks assigned to any of the selected members
    }));
  }, []);

  /**
   * Handle task type change
   */
  const handleTypeChange = useCallback((typeId: number) => {
    setTaskParametersRequest((prev) => ({
      ...prev,
      typeId: typeId,
    }));
  }, []);

  /// get tasks config
  const tasksConfig = async (): Promise<void> => {
    setHeaderLoading(true);
    try {
      const response = await membersTasksService.getCurrentTasksConfig();

      if (response.success) {
        setTasksConfigData(response.data);
      }
    } catch (e) {
    } finally {
      setHeaderLoading(false);
    }
  };

  ///change assignees
  const changeAssignees = async (
    taskId: string,
    memberIds: string[],
    notes: string,
    startDate?: string,
    endDate?: string,
  ): Promise<boolean> => {
    try {
      const response = await membersTasksService.changeAssignees(
        taskId,
        memberIds,
        notes,
        startDate,
        endDate,
      );

      if (response.success) {
        addToast({
          description: t("toast.assigneesChangedSuccess"),
          color: "success",
        });
      } else {
        addToast({
          description: t("toast.assigneesChangeFailed"),
          color: "warning",
        });
      }

      return response.success;
    } catch (err) {
      return false;
    } finally {
    }
  };

  ///request design
  const requestDesign = async (id: string, notes: string): Promise<boolean> => {
    try {
      const response = await membersTasksService.requestDesign(id, notes);

      if (response.success) {
        addToast({
          description: response.message ?? t("toast.designRequestedSuccess"),
          color: "success",
        });
      }

      return response.success;
    } catch (err) {
      return false;
    } finally {
    }
  };

  ///change status
  const changeStatus = async (
    id: string,
    typeId: string,
    notes: string,
  ): Promise<boolean> => {
    try {
      setChangeStatusLoading(true);
      setError(null);

      const response = await membersTasksService.changeStatus(
        id,
        typeId,
        notes,
      );

      if (response.success) {
        addToast({
          description: t("toast.statusChangedSuccess"),
          color: "success",
        });
      }

      return response.success;
    } catch (err) {
      return false;
    } finally {
      setChangeStatusLoading(false);
    }
  };

  /**
   * Normalize task response from various possible formats
   * This ensures consistent response handling regardless of API format changes
   */
  const normalizeTasksResponse = useCallback(
    (raw: any): TasksResponse | null => {
      if (!raw) return null;

      // Standard format where tasks is an array property
      if (Array.isArray(raw.tasks)) return raw as TasksResponse;

      // Nested format where tasks are in data property
      if (Array.isArray(raw.data?.tasks)) return raw.data as TasksResponse;

      // Alternative format where tasks are in items property
      if (Array.isArray(raw.items)) {
        return {
          tasks: raw.items,
          totalCount: raw.totalCount || raw.items.length,
          totalPages: raw.totalPages || 1,
          currentPage: raw.currentPage || 1,
          hasNextPage: Boolean(raw.hasNextPage),
          hasPrevPage: Boolean(raw.hasPrevPage),
        };
      }

      return null;
    },
    [],
  );

  const fetchTasks = useCallback(
    async (request?: TaskSearchParams) => {
      setLoading(true);
      setError(null);

      try {
        // Using the standardized API service pattern
        const response = await membersTasksService.getTasks(request);

        if (response?.success && response.data) {
          // Use the standardized response normalization
          const normalized = normalizeTasksResponse(response.data);

          if (normalized) {
            setTasks(normalized.tasks || []);
            setTotalPages(normalized.totalPages || 0);
            setTotalCount(normalized.totalCount || 0);
          } else {
            throw new Error("Invalid tasks response shape");
          }
        } else {
          throw new Error(response?.message || "Failed to fetch tasks");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch tasks");
        setTasks([]);
        setTotalPages(0);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    },
    [normalizeTasksResponse],
  );

  /**
   * Refresh tasks using current parameters
   * Sets header loading state and fetches tasks with current parameters
   */
  const refreshTasks = useCallback(async () => {
    setHeaderLoading(true);
    await fetchTasks(taskParametersRequest);
    setHeaderLoading(false);
  }, [fetchTasks, taskParametersRequest]);

  /**
   * Export tasks to CSV, PDF, or Excel format
   * Downloads the file directly to the user's device
   */
  const exportTasks = useCallback(async (format: "csv" | "pdf" | "xlsx") => {
    try {
      const blob = await membersTasksService.exportTasks(format);

      // Create download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = `members-tasks-${new Date().toISOString().split("T")[0]}.${format}`;

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show success message
      addToast({
        description: `Tasks exported to ${format.toUpperCase()} successfully`,
        color: "success",
      });
    } catch (err) {
      // Display error message to user
      addToast({
        description: `Failed to export tasks: ${err instanceof Error ? err.message : "Unknown error"}`,
        color: "danger",
      });

      // No need to throw, we've handled the error with a toast
    }
  }, []);

  /**
   * Load initial data when component mounts
   * Fetches task configuration and initial task list
   */
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setInitialLoading(true);
      setError(null);

      try {
        // Then fetch tasks with default parameters
        const response = await membersTasksService.getTasks();

        if (response.success && response.data) {
          // Update state with task data
          setTasks(response.data.tasks);
          setTotalPages(response.data.totalPages);
          setTotalCount(response.data.totalCount);
          setInitialCount(response.data.totalCount);

          // Small delay to allow UI to update
          await new Promise((resolve) => setTimeout(resolve, 200));
        } else {
          throw new Error(response.message || "Failed to fetch tasks");
        }
      } catch (err) {
        // Handle error state
        setError(err instanceof Error ? err.message : "Failed to load tasks");

        // Set empty state on error
        setTasks([]);
        setTotalPages(0);
        setTotalCount(0);
        setInitialCount(0);

        // Notify user of error
        addToast({
          description: `Failed to load tasks: ${err instanceof Error ? err.message : "Unknown error"}`,
          color: "danger",
        });
      } finally {
        setLoading(false);
        setHeaderLoading(false);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;

      return;
    }
    if (taskParametersRequest) {
      fetchTasks(taskParametersRequest);
    }
  }, [taskParametersRequest]);

  /**
   * Monitor initial count to determine when initial loading is complete
   * This ensures the UI shows loading state until data is available
   */
  useEffect(() => {
    if (initialCount > 0) {
      // Tasks have loaded, we can stop showing the initial loading state
      setInitialLoading(false);
    }
  }, [initialCount]);

  return {
    tasks,
    tasksConfigData,
    loading,
    headerLoading,
    initialLoading,
    changeStatusLoading,
    error,
    totalPages,
    totalCount,
    fetchTasks,
    handlePageChange,
    handlePageSizeChange,
    handlePriorityChange,
    handleSearchChange,
    handleProjectChange,
    handleStatusChange,
    handleAssigneeChange,
    handleTypeChange,
    handleResetFilters,
    taskParametersRequest,
    refreshTasks,
    exportTasks,
    changeStatus,
    changeAssignees,
    requestDesign,
    tasksConfig,
  };
};
