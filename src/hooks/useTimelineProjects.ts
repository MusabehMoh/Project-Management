import { useState, useCallback } from "react";

import { ProjectWithTimelinesAndTeam, PaginationInfo } from "@/types";
import { projectService } from "@/services/api";

/**
 * Lightweight hook for timeline page - only loads projects data with timeline and team info
 * Includes pagination support for the projects overview cards
 */
export const useTimelineProjects = () => {
  const [projects, setProjects] = useState<ProjectWithTimelinesAndTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  // Load projects from API with pagination
  const loadProjects = useCallback(
    async (page: number = 1, limit: number = 10, search?: string) => {
      console.log(
        `🔄 Loading projects - Page: ${page}, Limit: ${limit}, Search: ${search || "none"}`,
      );
      setLoading(true);
      setError(null);

      try {
        const response = await projectService.getProjectsWithTimelinesAndTeam(
          page,
          limit,
          search,
        );

        console.log("📦 API Response:", response);
        console.log("📊 Pagination:", response.pagination);
        console.log("📋 Projects count:", response.data?.length);

        if (response.success && response.data) {
          setProjects(response.data);
          setPagination(response.pagination || null);
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
    pagination,
    loadProjects,
  };
};
