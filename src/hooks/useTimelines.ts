import { useState, useEffect, useCallback } from "react";

import {
  Timeline,
  Sprint,
  Task,
  Subtask,
  Department,
  TimelineFilters,
  CreateTimelineRequest,
  CreateSprintRequest,
  CreateTaskRequest,
  UpdateTimelineRequest,
  UpdateSprintRequest,
  UpdateTaskRequest,
  UpdateSubtaskRequest,
} from "@/types/timeline";
import { timelineService } from "@/services/api";

export const useTimelines = (projectId?: number) => {
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [selectedTimeline, setSelectedTimeline] = useState<Timeline | null>(
    null,
  );
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filters, setFilters] = useState<TimelineFilters>({
    departments: [],
    members: [],
    status: [],
    priority: [],
    search: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data - only trigger when projectId changes
  const loadTimelines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [timelinesResponse, departmentsResponse] = await Promise.all([
        projectId
          ? timelineService.getProjectTimelines(projectId)
          : Promise.resolve({ data: [] }),
        timelineService.getDepartments(),
      ]);

      setTimelines(timelinesResponse.data || []);
      setDepartments(departmentsResponse.data || []);

      // Keep the currently selected timeline if one exists; otherwise select the first.
      // Also realign the selectedTimeline reference to the freshly fetched object.
      setSelectedTimeline((prev) => {
        if (!prev) {
          return timelinesResponse.data?.[0] ?? null;
        }

        const match = (timelinesResponse.data || []).find(
          (t) => t.id === prev.id,
        );

        return match ?? prev;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load timelines");
    } finally {
      setLoading(false);
    }
  }, [projectId]); // ✅ Only depend on projectId; selected is handled via functional set

  useEffect(() => {
    loadTimelines();
  }, [projectId]); // ✅ Only reload when projectId changes

  // Timeline CRUD operations
  const createTimeline = async (
    data: CreateTimelineRequest,
  ): Promise<Timeline | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await timelineService.createTimeline(data);
      const newTimeline = response.data;

      setTimelines((prev) => [newTimeline, ...prev]);
      setSelectedTimeline(newTimeline);

      return newTimeline;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create timeline",
      );

      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateTimeline = async (
    data: UpdateTimelineRequest,
  ): Promise<Timeline | null> => {
    try {
      setLoading(true);
      setError(null);
      const targetId = String(data.id);
      const response = await timelineService.updateTimeline(targetId, data);

      if (response.data) {
        // Refresh timelines to get updated data
        await loadTimelines();
      }

      return response.data;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update timeline",
      );

      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteTimeline = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await timelineService.deleteTimeline(id);

      if (response.success) {
        setTimelines((prev) => prev.filter((t) => t.id.toString() !== id));

        if (selectedTimeline?.id.toString() === id) {
          const remaining = timelines.filter((t) => t.id.toString() !== id);

          setSelectedTimeline(remaining.length > 0 ? remaining[0] : null);
        }
      }

      return response.success;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete timeline",
      );

      return false;
    } finally {
      setLoading(false);
    }
  };

  // Sprint CRUD operations
  const createSprint = async (
    data: CreateSprintRequest,
  ): Promise<Sprint | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await timelineService.createSprint(data);

      if (response.data) {
        // Refresh the timeline to get updated data
        const timelineResponse = await timelineService.getTimeline(
          data.timelineId,
        );

        if (timelineResponse.data) {
          setTimelines((prev) =>
            prev.map((t) =>
              t.id.toString() === data.timelineId ? timelineResponse.data : t,
            ),
          );

          if (selectedTimeline?.id.toString() === data.timelineId) {
            setSelectedTimeline(timelineResponse.data);
          }
        }
      }

      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create sprint");

      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateSprint = async (
    data: UpdateSprintRequest,
  ): Promise<Sprint | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await timelineService.updateSprint(data.id, data);

      if (response.data) {
        // Refresh timelines to get updated data
        await loadTimelines();
      }

      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update sprint");

      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteSprint = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await timelineService.deleteSprint(id);

      if (response.success) {
        // Refresh timelines to get updated data
        await loadTimelines();
      }

      return response.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete sprint");

      return false;
    } finally {
      setLoading(false);
    }
  };

  const moveTaskToSprint = async (
    id: string,
    targetSprintId: string,
  ): Promise<Task | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await timelineService.moveTaskToSprint(
        id,
        targetSprintId,
      );

      if (response.data) {
        // Refresh timelines to get updated data
        await loadTimelines();
      }

      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to move task");

      return null;
    } finally {
      setLoading(false);
    }
  };

  // Task CRUD operations
  const createTask = async (data: CreateTaskRequest): Promise<Task | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await timelineService.createTask(data);

      if (response.data) {
        // Refresh timelines to get updated data
        await loadTimelines();
      }

      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");

      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (data: UpdateTaskRequest): Promise<Task | null> => {
    try {
      setLoading(true);
      setError(null);
      const targetId = String(data.id);
      const response = await timelineService.updateTask(targetId, data);

      if (response.data) {
        // Refresh timelines to get updated data
        await loadTimelines();
      }

      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");

      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await timelineService.deleteTask(id);

      if (response.success) {
        // Refresh timelines to get updated data
        await loadTimelines();
      }

      return response.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");

      return false;
    } finally {
      setLoading(false);
    }
  };

  const moveTask = async (
    id: string,
    moveDays: number,
  ): Promise<Task | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await timelineService.moveTask(id, moveDays);

      if (response.data) {
        // Refresh timelines to get updated data
        await loadTimelines();
      }

      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to move task");

      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateSubtask = async (
    data: UpdateSubtaskRequest,
  ): Promise<Subtask | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await timelineService.updateSubtask(data.id, data);

      if (response.data) {
        // Refresh timelines to get updated data
        await loadTimelines();
      }

      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update subtask");

      return null;
    } finally {
      setLoading(false);
    }
  };

  // Filter functions
  const applyFilters = useCallback((newFilters: Partial<TimelineFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      departments: [],
      members: [],
      status: [],
      priority: [],
      search: "",
    });
  }, []);

  // Get filtered timelines (filtering is mainly handled in views; keep raw list here)
  const filteredTimelines = timelines;

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh data
  const refreshData = useCallback(() => {
    loadTimelines();
  }, [loadTimelines]);

  return {
    // Data
    timelines: filteredTimelines,
    allTimelines: timelines,
    selectedTimeline,
    departments,
    filters,
    loading,
    error,

    // Timeline operations
    createTimeline,
    updateTimeline,
    deleteTimeline,
    setSelectedTimeline,

    // Sprint operations
    createSprint,
    updateSprint,
    deleteSprint,

    // Task operations
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    moveTaskToSprint,

    // Subtask operations
    updateSubtask,

    // Filter operations
    applyFilters,
    clearFilters,

    // Utility functions
    clearError,
    refreshData,
    loadTimelines,
  };
};
