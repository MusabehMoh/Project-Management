import { useState, useEffect, useCallback } from 'react';
import { 
  Timeline, 
  Sprint, 
  Task, 
  Subtask, 
  Resource, 
  Department,
  TimelineFilters,
  CreateTimelineRequest,
  CreateSprintRequest,
  CreateTaskRequest,
  CreateSubtaskRequest,
  UpdateTimelineRequest,
  UpdateSprintRequest,
  UpdateTaskRequest,
  UpdateSubtaskRequest
} from '@/types/timeline';
import { timelineService } from '@/services/api';

export const useTimelines = (projectId?: number) => {
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [selectedTimeline, setSelectedTimeline] = useState<Timeline | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [filters, setFilters] = useState<TimelineFilters>({
    departments: [],
    resources: [],
    status: [],
    priority: [],
    search: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  const loadTimelines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [timelinesResponse, departmentsResponse, resourcesResponse] = await Promise.all([
        projectId ? timelineService.getProjectTimelines(projectId) : Promise.resolve({ data: [] }),
        timelineService.getDepartments(),
        timelineService.getResources()
      ]);

      setTimelines(timelinesResponse.data || []);
      setDepartments(departmentsResponse.data || []);
      setResources(resourcesResponse.data || []);
      
      // Select first timeline if available
      if (timelinesResponse.data && timelinesResponse.data.length > 0 && !selectedTimeline) {
        setSelectedTimeline(timelinesResponse.data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timelines');
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedTimeline]);

  useEffect(() => {
    loadTimelines();
  }, [loadTimelines]);

  // Timeline CRUD operations
  const createTimeline = async (data: CreateTimelineRequest): Promise<Timeline | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await timelineService.createTimeline(data);
      const newTimeline = response.data;
      setTimelines(prev => [newTimeline, ...prev]);
      setSelectedTimeline(newTimeline);
      
      return newTimeline;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create timeline');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateTimeline = async (data: UpdateTimelineRequest): Promise<Timeline | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await timelineService.updateTimeline(data.id, data);
      if (response.data) {
        setTimelines(prev => 
          prev.map(t => t.id === data.id ? response.data : t)
        );
        
        if (selectedTimeline?.id === data.id) {
          setSelectedTimeline(response.data);
        }
      }
      
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update timeline');
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
        setTimelines(prev => prev.filter(t => t.id !== id));
        
        if (selectedTimeline?.id === id) {
          const remaining = timelines.filter(t => t.id !== id);
          setSelectedTimeline(remaining.length > 0 ? remaining[0] : null);
        }
      }
      
      return response.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete timeline');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Sprint CRUD operations
  const createSprint = async (data: CreateSprintRequest): Promise<Sprint | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await timelineService.createSprint(data);
      if (response.data) {
        // Refresh the timeline to get updated data
        const timelineResponse = await timelineService.getTimeline(data.timelineId);
        if (timelineResponse.data) {
          setTimelines(prev => 
            prev.map(t => t.id === data.timelineId ? timelineResponse.data : t)
          );
          
          if (selectedTimeline?.id === data.timelineId) {
            setSelectedTimeline(timelineResponse.data);
          }
        }
      }
      
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sprint');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateSprint = async (data: UpdateSprintRequest): Promise<Sprint | null> => {
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
      setError(err instanceof Error ? err.message : 'Failed to update sprint');
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
      setError(err instanceof Error ? err.message : 'Failed to delete sprint');
      return false;
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
      setError(err instanceof Error ? err.message : 'Failed to create task');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (data: UpdateTaskRequest): Promise<Task | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await timelineService.updateTask(data.id, data);
      if (response.data) {
        // Refresh timelines to get updated data
        await loadTimelines();
      }
      
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
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
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Subtask CRUD operations
  const createSubtask = async (data: CreateSubtaskRequest): Promise<Subtask | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await timelineService.createSubtask(data);
      if (response.data) {
        // Refresh timelines to get updated data
        await loadTimelines();
      }
      
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subtask');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateSubtask = async (data: UpdateSubtaskRequest): Promise<Subtask | null> => {
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
      setError(err instanceof Error ? err.message : 'Failed to update subtask');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteSubtask = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await timelineService.deleteSubtask(id);
      if (response.success) {
        // Refresh timelines to get updated data
        await loadTimelines();
      }
      
      return response.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subtask');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Filter functions
  const applyFilters = useCallback((newFilters: Partial<TimelineFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      departments: [],
      resources: [],
      status: [],
      priority: [],
      search: ''
    });
  }, []);

  // Get filtered timelines
  const filteredTimelines = timelines.filter(timeline => {
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesTimeline = timeline.name.toLowerCase().includes(searchLower) ||
                             timeline.description?.toLowerCase().includes(searchLower);
      
      const matchesSprints = timeline.sprints.some(sprint =>
        sprint.name.toLowerCase().includes(searchLower) ||
        sprint.description?.toLowerCase().includes(searchLower)
      );
      
      const matchesTasks = timeline.sprints.some(sprint =>
        sprint.tasks.some(task =>
          task.name.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower)
        )
      );
      
      if (!matchesTimeline && !matchesSprints && !matchesTasks) {
        return false;
      }
    }

    // Apply department filter
    if (filters.departments.length > 0) {
      const hasMatchingDepartment = timeline.sprints.some(sprint =>
        filters.departments.includes(sprint.department || '') ||
        sprint.tasks.some(task =>
          filters.departments.includes(task.department || '') ||
          task.subtasks.some(subtask =>
            filters.departments.includes(subtask.department || '')
          )
        )
      );
      
      if (!hasMatchingDepartment) {
        return false;
      }
    }

    // Apply resource filter
    if (filters.resources.length > 0) {
      const hasMatchingResource = timeline.sprints.some(sprint =>
        sprint.resources?.some(r => filters.resources.includes(r)) ||
        sprint.tasks.some(task =>
          task.resources?.some(r => filters.resources.includes(r)) ||
          task.subtasks.some(subtask =>
            subtask.resources?.some(r => filters.resources.includes(r))
          )
        )
      );
      
      if (!hasMatchingResource) {
        return false;
      }
    }

    // Apply status filter
    if (filters.status.length > 0) {
      const hasMatchingStatus = timeline.sprints.some(sprint =>
        sprint.tasks.some(task =>
          filters.status.includes(task.status) ||
          task.subtasks.some(subtask => filters.status.includes(subtask.status))
        )
      );
      
      if (!hasMatchingStatus) {
        return false;
      }
    }

    // Apply priority filter
    if (filters.priority.length > 0) {
      const hasMatchingPriority = timeline.sprints.some(sprint =>
        sprint.tasks.some(task =>
          filters.priority.includes(task.priority) ||
          task.subtasks.some(subtask => filters.priority.includes(subtask.priority))
        )
      );
      
      if (!hasMatchingPriority) {
        return false;
      }
    }

    return true;
  });

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
    resources,
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

    // Subtask operations
    createSubtask,
    updateSubtask,
    deleteSubtask,

    // Filter operations
    applyFilters,
    clearFilters,

    // Utility functions
    clearError,
    refreshData,
    loadTimelines
  };
};
