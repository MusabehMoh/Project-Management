import { useCallback, useState, useEffect } from "react";

import { timelineService } from "@/services/api";
import { WorkItem } from "@/types/timeline";

export interface TaskSearchOptions {
  /** Maximum number of results to return */
  maxResults?: number;
  /** Load tasks when component mounts */
  loadInitialResults?: boolean;
  /** Timeline ID to filter tasks within specific timeline */
  timelineId?: number;
}

export function useTaskSearch(options: TaskSearchOptions = {}) {
  const defaultOptions: TaskSearchOptions = {
    maxResults: 100,
    loadInitialResults: true,
  };

  const config = { ...defaultOptions, ...options };
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Load all timeline tasks instead of searching
  const loadAllTimelineTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await timelineService.getAllTimelineTasks(
        config.timelineId,
        config.maxResults,
      );

      if (response.success) {
        setWorkItems(response.data || []);
      } else {
        throw new Error(response.message || "Failed to load timeline tasks");
      }
    } catch (err) {
      // Log error for debugging
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setWorkItems([]);
    } finally {
      setLoading(false);
    }
  }, [config.timelineId, config.maxResults]);

  // Load tasks on mount if configured
  useEffect(() => {
    if (config.loadInitialResults) {
      loadAllTimelineTasks();
    }
  }, [loadAllTimelineTasks, config.loadInitialResults]);

  // Keep the same function name for backward compatibility
  const searchTasks = useCallback(
    (query: string) => {
      // If query is empty, load all tasks
      if (!query.trim()) {
        loadAllTimelineTasks();
        
        return;
      }

      // Filter already loaded tasks by query
      setWorkItems(
        (currentItems) =>
          currentItems.filter(
            (item) =>
              item.name.toLowerCase().includes(query.toLowerCase()) ||
              (item.description &&
                item.description.toLowerCase().includes(query.toLowerCase())),
          ),
      );
    },
    [loadAllTimelineTasks],
  );

  return {
    workItems,
    loading,
    error,
    searchTasks,
    // For API compatibility with old version
    clearResults: () => setWorkItems([]),
    clearCache: () => {}, // No-op since we're not using cache
    loadInitialResults: loadAllTimelineTasks,
  };
}

export default useTaskSearch;
