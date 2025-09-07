import { useState, useCallback } from "react";

import { Project } from "@/types/project";
import { projectService } from "@/services/api";

/**
 * Lightweight hook for timeline page - only loads projects data
 * Avoids unnecessary API calls to users, owning-units, and stats
 */
export const useTimelineProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load projects from API with pagination
  const loadProjects = useCallback(
    async (page: number = 1, limit: number = 10) => {
      setLoading(true);
      setError(null);

      try {
        const response = await projectService.getProjects(
          undefined,
          page,
          limit,
        );

        if (response.success && response.data) {
          setProjects(response.data);
        } else {
          throw new Error(response.message || "Failed to load projects");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";

        console.error("Error loading projects:", err);
        setError(errorMessage);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    projects,
    loading,
    error,
    loadProjects,
  };
};
