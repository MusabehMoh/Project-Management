import type { Project } from "@/types/project";

import { useState, useEffect } from "react";

import { projectsApi } from "@/services/api/projects";

interface UseProjectDetailsOptions {
  projectId: number | string | undefined;
  enabled?: boolean; // Allow conditional fetching
}

interface UseProjectDetailsResult {
  project: Project | null;
  projectName: string;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch and manage project details
 * @param options - Configuration options for the hook
 * @returns Project details, loading state, error state, and refetch function
 */
export function useProjectDetails(
  options: UseProjectDetailsOptions,
): UseProjectDetailsResult {
  const { projectId, enabled = true } = options;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjectDetails = async () => {
    if (!projectId || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const id =
        typeof projectId === "string" ? parseInt(projectId) : projectId;
      const response = await projectsApi.getProjectById(id);

      if (response.data) {
        setProject(response.data);
      } else {
        setError("Project not found");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch project details";

      setError(errorMessage);
      console.error("Error fetching project details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId, enabled]);

  return {
    project,
    projectName: project?.applicationName || "",
    loading,
    error,
    refetch: fetchProjectDetails,
  };
}
