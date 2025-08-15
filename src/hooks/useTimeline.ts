import { useState, useEffect, useCallback } from 'react';
import { 
  Timeline,
  Sprint,
  Task,
  Subtask,
  Department,
  Resource,
  CreateTimelineRequest,
  CreateSprintRequest,
  CreateTaskRequest,
  CreateSubtaskRequest,
  UpdateTimelineRequest,
  UpdateSprintRequest,
  UpdateTaskRequest,
  UpdateSubtaskRequest
} from '@/types/timeline';
import { timelineApi } from '@/services/api/timelineService';
import { useProjects } from '@/hooks/useProjects';

export function useTimeline(projectId?: number) {
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [currentTimeline, setCurrentTimeline] = useState<Timeline | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<{ id: string; type: 'timeline' | 'sprint' | 'task' | 'subtask' } | null>(null);

  const { projects } = useProjects();

  // Fetch timelines
  const fetchTimelines = useCallback(async (filterProjectId?: number) => {
    try {
      setLoading(true);
      setError(null);
      
      let data;
      if (filterProjectId) {
        // Use RESTful API for specific project
        const response = await timelineApi.getProjectTimelines(filterProjectId);
        data = response.data || [];
      } else {
        // Fallback to TimelineService for all timelines
        data = await timelineApi.getTimelines();
      }
      
      setTimelines(data);
      
      // If we have a specific project ID and found timelines for it, set the first one as current
      if (filterProjectId && data.length > 0) {
        setCurrentTimeline(data[0]);
      } else if (!filterProjectId && data.length > 0 && !currentTimeline) {
        setCurrentTimeline(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch timelines');
    } finally {
      setLoading(false);
    }
  }, [currentTimeline]);

  // Fetch departments and resources
  const fetchDepartmentsAndResources = useCallback(async () => {
    try {
      const [departmentsResponse, resourcesResponse] = await Promise.all([
        timelineApi.getDepartments(),
        timelineApi.getResources()
      ]);
      setDepartments(departmentsResponse.data || []);
      setResources(resourcesResponse.data || []);
    } catch (err) {
      console.error('Failed to fetch departments and resources:', err);
    }
  }, []);

  // Initial load - optimized to prevent infinite loops
  useEffect(() => {
    // Fetch departments and resources if not already loaded
    if (departments.length === 0 || resources.length === 0) {
      fetchDepartmentsAndResources();
    }
    
    // Only fetch timelines if projectId is provided
    if (projectId) {
      fetchTimelines(projectId);
    }
  }, [projectId]); // Only depend on projectId changes

  // Timeline operations
  const createTimeline = useCallback(async (data: CreateTimelineRequest): Promise<Timeline | null> => {
    try {
      setLoading(true);
      setError(null);
      const newTimeline = await timelineApi.createTimeline(data);
      setTimelines(prev => [...prev, newTimeline]);
      setCurrentTimeline(newTimeline);
      return newTimeline;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create timeline');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTimeline = useCallback(async (data: UpdateTimelineRequest): Promise<Timeline | null> => {
    try {
      setLoading(true);
      setError(null);
      const updatedTimeline = await timelineApi.updateTimeline(data);
      if (updatedTimeline) {
        setTimelines(prev => prev.map(t => t.id === data.id ? updatedTimeline : t));
        if (currentTimeline?.id === data.id) {
          setCurrentTimeline(updatedTimeline);
        }
      }
      return updatedTimeline;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update timeline');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentTimeline]);

  const deleteTimeline = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const success = await timelineApi.deleteTimeline(id);
      if (success) {
        setTimelines(prev => prev.filter(t => t.id !== id));
        if (currentTimeline?.id === id) {
          setCurrentTimeline(timelines.find(t => t.id !== id) || null);
        }
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete timeline');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentTimeline, timelines]);

  // Sprint operations
  const createSprint = useCallback(async (data: CreateSprintRequest): Promise<Sprint | null> => {
    try {
      setError(null);
      const newSprint = await timelineApi.createSprint(data);
      if (newSprint && currentTimeline) {
        const updatedTimeline = { 
          ...currentTimeline, 
          sprints: [...currentTimeline.sprints, newSprint] 
        };
        setCurrentTimeline(updatedTimeline);
        setTimelines(prev => prev.map(t => t.id === currentTimeline.id ? updatedTimeline : t));
      }
      return newSprint;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sprint');
      return null;
    }
  }, [currentTimeline]);

  const updateSprint = useCallback(async (data: UpdateSprintRequest): Promise<Sprint | null> => {
    try {
      setError(null);
      const updatedSprint = await timelineApi.updateSprint(data);
      if (updatedSprint && currentTimeline) {
        const updatedTimeline = {
          ...currentTimeline,
          sprints: currentTimeline.sprints.map(s => s.id === data.id ? updatedSprint : s)
        };
        setCurrentTimeline(updatedTimeline);
        setTimelines(prev => prev.map(t => t.id === currentTimeline.id ? updatedTimeline : t));
      }
      return updatedSprint;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update sprint');
      return null;
    }
  }, [currentTimeline]);

  const deleteSprint = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await timelineApi.deleteSprint(id);
      if (success && currentTimeline) {
        const updatedTimeline = {
          ...currentTimeline,
          sprints: currentTimeline.sprints.filter(s => s.id !== id)
        };
        setCurrentTimeline(updatedTimeline);
        setTimelines(prev => prev.map(t => t.id === currentTimeline.id ? updatedTimeline : t));
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete sprint');
      return false;
    }
  }, [currentTimeline]);

  // Task operations
  const createTask = useCallback(async (data: CreateTaskRequest): Promise<Task | null> => {
    try {
      setError(null);
      const newTask = await timelineApi.createTask(data);
      if (newTask && currentTimeline) {
        const updatedTimeline = {
          ...currentTimeline,
          sprints: currentTimeline.sprints.map(s => 
            s.id === data.sprintId 
              ? { ...s, tasks: [...s.tasks, newTask] }
              : s
          )
        };
        setCurrentTimeline(updatedTimeline);
        setTimelines(prev => prev.map(t => t.id === currentTimeline.id ? updatedTimeline : t));
      }
      return newTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      return null;
    }
  }, [currentTimeline]);

  const updateTask = useCallback(async (data: UpdateTaskRequest): Promise<Task | null> => {
    try {
      setError(null);
      const updatedTask = await timelineApi.updateTask(data);
      if (updatedTask && currentTimeline) {
        const updatedTimeline = {
          ...currentTimeline,
          sprints: currentTimeline.sprints.map(s => ({
            ...s,
            tasks: s.tasks.map(t => t.id === data.id ? updatedTask : t)
          }))
        };
        setCurrentTimeline(updatedTimeline);
        setTimelines(prev => prev.map(t => t.id === currentTimeline.id ? updatedTimeline : t));
      }
      return updatedTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      return null;
    }
  }, [currentTimeline]);

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await timelineApi.deleteTask(id);
      if (success && currentTimeline) {
        const updatedTimeline = {
          ...currentTimeline,
          sprints: currentTimeline.sprints.map(s => ({
            ...s,
            tasks: s.tasks.filter(t => t.id !== id)
          }))
        };
        setCurrentTimeline(updatedTimeline);
        setTimelines(prev => prev.map(t => t.id === currentTimeline.id ? updatedTimeline : t));
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      return false;
    }
  }, [currentTimeline]);

  // Subtask operations
  const createSubtask = useCallback(async (data: CreateSubtaskRequest): Promise<Subtask | null> => {
    try {
      setError(null);
      const newSubtask = await timelineApi.createSubtask(data);
      if (newSubtask && currentTimeline) {
        const updatedTimeline = {
          ...currentTimeline,
          sprints: currentTimeline.sprints.map(s => ({
            ...s,
            tasks: s.tasks.map(t => 
              t.id === data.taskId 
                ? { ...t, subtasks: [...t.subtasks, newSubtask] }
                : t
            )
          }))
        };
        setCurrentTimeline(updatedTimeline);
        setTimelines(prev => prev.map(t => t.id === currentTimeline.id ? updatedTimeline : t));
      }
      return newSubtask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subtask');
      return null;
    }
  }, [currentTimeline]);

  const updateSubtask = useCallback(async (data: UpdateSubtaskRequest): Promise<Subtask | null> => {
    try {
      setError(null);
      const updatedSubtask = await timelineApi.updateSubtask(data);
      if (updatedSubtask && currentTimeline) {
        const updatedTimeline = {
          ...currentTimeline,
          sprints: currentTimeline.sprints.map(s => ({
            ...s,
            tasks: s.tasks.map(t => ({
              ...t,
              subtasks: t.subtasks.map(st => st.id === data.id ? updatedSubtask : st)
            }))
          }))
        };
        setCurrentTimeline(updatedTimeline);
        setTimelines(prev => prev.map(t => t.id === currentTimeline.id ? updatedTimeline : t));
      }
      return updatedSubtask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subtask');
      return null;
    }
  }, [currentTimeline]);

  const deleteSubtask = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await timelineApi.deleteSubtask(id);
      if (success && currentTimeline) {
        const updatedTimeline = {
          ...currentTimeline,
          sprints: currentTimeline.sprints.map(s => ({
            ...s,
            tasks: s.tasks.map(t => ({
              ...t,
              subtasks: t.subtasks.filter(st => st.id !== id)
            }))
          }))
        };
        setCurrentTimeline(updatedTimeline);
        setTimelines(prev => prev.map(t => t.id === currentTimeline.id ? updatedTimeline : t));
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subtask');
      return false;
    }
  }, [currentTimeline]);

  // Utility functions
  const selectItem = useCallback((id: string, type: 'timeline' | 'sprint' | 'task' | 'subtask') => {
    setSelectedItem({ id, type });
  }, []);

  const getProjectName = useCallback((projectId: number): string => {
    const project = projects.find(p => p.id === projectId);
    return project?.applicationName || `Project #${projectId}`;
  }, [projects]);

  return {
    // Data
    timelines,
    currentTimeline,
    departments,
    resources,
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
    
    // Subtask operations
    createSubtask,
    updateSubtask,
    deleteSubtask,
    
    // Utility functions
    selectItem,
    getProjectName,
    fetchTimelines
  };
}
