import { useState, useEffect, useCallback } from "react";

import {
  Timeline,
  Sprint,
  Task,
  Department,
  CreateTimelineRequest,
  CreateSprintRequest,
  CreateTaskRequest,
  UpdateTimelineRequest,
  UpdateSprintRequest,
  UpdateTaskRequest,
} from "@/types/timeline";
import { timelineApi } from "@/services/api/timelineService";
import { useProjects } from "@/hooks/useProjects";

export function useTimeline(projectId?: number) {
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [currentTimeline, setCurrentTimeline] = useState<Timeline | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    type: "timeline" | "sprint" | "task" | "subtask";
  } | null>(null);

  const { projects } = useProjects();

  // Fetch timelines
  const fetchTimelines = useCallback(
    async (filterProjectId?: number) => {
      try {
        setLoading(true);
        setError(null);

        if (filterProjectId) {
          // Use RESTful API for specific project
          const response =
            await timelineApi.getProjectTimelines(filterProjectId);

          const data = response.data || [];

          setTimelines(data);

          // If we have a specific project ID and found timelines for it, set the first one as current
          if (data.length > 0) {
            setCurrentTimeline(data[0]);
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch timelines",
        );
      } finally {
        setLoading(false);
      }
    },
    [currentTimeline],
  );

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    try {
      const departmentsResponse = await timelineApi.getDepartments();

      setDepartments(departmentsResponse.data || []);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    }
  }, []);

  // Initial load - optimized to prevent infinite loops
  useEffect(() => {
    // Fetch departments if not already loaded
    if (departments.length === 0) {
      fetchDepartments();
    }

    // Only fetch timelines if projectId is provided
    if (projectId) {
      fetchTimelines(projectId);
    }
  }, [projectId]); // Only depend on projectId changes

  // Timeline operations
  const createTimeline = useCallback(
    async (data: CreateTimelineRequest): Promise<Timeline | null> => {
      try {
        setLoading(true);
        setError(null);
        const response = await timelineApi.createTimeline(data);

        if (response.success && response.data) {
          const newTimeline = response.data;

          setTimelines((prev) => [...prev, newTimeline]);
          setCurrentTimeline(newTimeline);

          return newTimeline;
        }

        setError(response.message || "Failed to create timeline");

        return null;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create timeline",
        );

        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateTimeline = useCallback(
    async (data: UpdateTimelineRequest): Promise<Timeline | null> => {
      try {
        setLoading(true);
        setError(null);
        const response = await timelineApi.updateTimeline(
          data.id.toString(),
          data,
        );

        if (response.success && response.data) {
          const updatedTimeline = response.data;

          setTimelines((prev) =>
            prev.map((t) =>
              t.id.toString() === data.id ? updatedTimeline : t,
            ),
          );
          if (currentTimeline?.id.toString() === data.id) {
            setCurrentTimeline(updatedTimeline);
          }

          return updatedTimeline;
        }

        return null;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update timeline",
        );

        return null;
      } finally {
        setLoading(false);
      }
    },
    [currentTimeline],
  );

  const deleteTimeline = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);
        const response = await timelineApi.deleteTimeline(id);

        if (response.success) {
          setTimelines((prev) => prev.filter((t) => t.id.toString() !== id));
          if (currentTimeline?.id.toString() === id) {
            setCurrentTimeline(
              timelines.find((t) => t.id.toString() !== id) || null,
            );
          }

          return true;
        }

        return false;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete timeline",
        );

        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentTimeline, timelines],
  );

  // Sprint operations
  const createSprint = useCallback(
    async (data: CreateSprintRequest): Promise<Sprint | null> => {
      try {
        setError(null);
        const response = await timelineApi.createSprint(data);

        if (response.success && response.data && currentTimeline) {
          const newSprint = response.data;
          const updatedTimeline = {
            ...currentTimeline,
            sprints: [...currentTimeline.sprints, newSprint],
          };

          setCurrentTimeline(updatedTimeline);
          setTimelines((prev) =>
            prev.map((t) =>
              t.id === currentTimeline.id ? updatedTimeline : t,
            ),
          );

          return newSprint;
        }

        return null;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create sprint",
        );

        return null;
      }
    },
    [currentTimeline],
  );

  const updateSprint = useCallback(
    async (data: UpdateSprintRequest): Promise<Sprint | null> => {
      try {
        setError(null);
        const response = await timelineApi.updateSprint(
          data.id.toString(),
          data,
        );

        if (response.success && response.data && currentTimeline) {
          const updatedSprint = response.data;
          const updatedTimeline = {
            ...currentTimeline,
            sprints: currentTimeline.sprints.map((s) =>
              s.id.toString() === data.id ? updatedSprint : s,
            ),
          };

          setCurrentTimeline(updatedTimeline);
          setTimelines((prev) =>
            prev.map((t) =>
              t.id === currentTimeline.id ? updatedTimeline : t,
            ),
          );

          return updatedSprint;
        }

        return null;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update sprint",
        );

        return null;
      }
    },
    [currentTimeline],
  );

  const deleteSprint = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null);
        const response = await timelineApi.deleteSprint(id);

        if (response.success && currentTimeline) {
          const updatedTimeline = {
            ...currentTimeline,
            sprints: currentTimeline.sprints.filter(
              (s) => s.id.toString() !== id,
            ),
          };

          setCurrentTimeline(updatedTimeline);
          setTimelines((prev) =>
            prev.map((t) =>
              t.id === currentTimeline.id ? updatedTimeline : t,
            ),
          );

          return true;
        }

        return false;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete sprint",
        );

        return false;
      }
    },
    [currentTimeline],
  );

  // Task operations
  const createTask = useCallback(
    async (data: CreateTaskRequest): Promise<Task | null> => {
      try {
        setError(null);
        const response = await timelineApi.createTask(data);

        if (response.success && response.data && currentTimeline) {
          const newTask = response.data;
          const updatedTimeline = {
            ...currentTimeline,
            sprints: currentTimeline.sprints.map((s) =>
              s.id.toString() === data.sprintId
                ? { ...s, tasks: [...s.tasks, newTask] }
                : s,
            ),
          };

          setCurrentTimeline(updatedTimeline);
          setTimelines((prev) =>
            prev.map((t) =>
              t.id === currentTimeline.id ? updatedTimeline : t,
            ),
          );

          return newTask;
        }

        return null;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create task");

        return null;
      }
    },
    [currentTimeline],
  );

  const updateTask = useCallback(
    async (data: UpdateTaskRequest): Promise<Task | null> => {
      try {
        setError(null);
        const response = await timelineApi.updateTask(data.id.toString(), data);

        if (response.success && response.data && currentTimeline) {
          const updatedTask = response.data;
          const updatedTimeline = {
            ...currentTimeline,
            sprints: currentTimeline.sprints.map((s) => ({
              ...s,
              tasks: s.tasks.map((t) =>
                t.id.toString() === data.id ? updatedTask : t,
              ),
            })),
          };

          setCurrentTimeline(updatedTimeline);
          setTimelines((prev) =>
            prev.map((t) =>
              t.id === currentTimeline.id ? updatedTimeline : t,
            ),
          );

          return updatedTask;
        }

        return null;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update task");

        return null;
      }
    },
    [currentTimeline],
  );

  const deleteTask = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null);
        const response = await timelineApi.deleteTask(id);

        if (response.success && currentTimeline) {
          const updatedTimeline = {
            ...currentTimeline,
            sprints: currentTimeline.sprints.map((s) => ({
              ...s,
              tasks: s.tasks.filter((t) => t.id.toString() !== id),
            })),
          };

          setCurrentTimeline(updatedTimeline);
          setTimelines((prev) =>
            prev.map((t) =>
              t.id === currentTimeline.id ? updatedTimeline : t,
            ),
          );

          return true;
        }

        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete task");

        return false;
      }
    },
    [currentTimeline],
  );
  // Utility functions
  const selectItem = useCallback(
    (id: string, type: "timeline" | "sprint" | "task") => {
      setSelectedItem({ id, type });
    },
    [],
  );

  const getProjectName = useCallback(
    (projectId: number): string => {
      const project = projects.find((p) => p.id === projectId);

      return project?.applicationName || `Project #${projectId}`;
    },
    [projects],
  );

  return {
    // Data
    timelines,
    currentTimeline,
    departments,
    projects,
    selectedItem,

    // State
    loading,
    error,

    // Timeline operations
    setCurrentTimeline,
    createTimeline,
    updateTimeline,
    deleteTimeline,

    // Sprint operations
    createSprint,
    updateSprint,
    deleteSprint,

    // Task operations
    createTask,
    updateTask,
    deleteTask,
    // Utility functions
    selectItem,
    getProjectName,
    fetchTimelines,
  };
}
