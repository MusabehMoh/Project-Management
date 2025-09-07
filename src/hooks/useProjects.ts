import { useState, useEffect, useCallback } from "react";

import {
  Project,
  User,
  OwningUnit,
  ProjectFilters,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectStats,
} from "@/types/project";
import { projectService } from "@/services/api";
import SearchService from "@/services/searchService";

// Custom hook for projects data management
export const useProjects = (initialFilters?: ProjectFilters) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [owningUnits, setOwningUnits] = useState<OwningUnit[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProjectFilters>(initialFilters || {});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Load projects from API with pagination
  const loadProjects = useCallback(
    async (page = 1, limit = pageSize) => {
      try {
        setLoading(true);
        setError(null);

        const response = await projectService.getProjects(filters, page, limit);

        if (response.success) {
          setProjects(response.data);
          // Set pagination info from API response
          setCurrentPage(response.pagination?.page || page);
          setTotalPages(response.pagination?.totalPages || 1);
          setTotalProjects(response.pagination?.total || response.data.length);
          setPageSize(response.pagination?.limit || limit);
        } else {
          throw new Error(response.message || "Failed to load projects");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load projects";

        setError(errorMessage);
        console.error("Error loading projects:", err);
      } finally {
        setLoading(false);
      }
    },
    [filters, pageSize],
  );

  // Load users from API
  const loadUsers = useCallback(async () => {
    try {
      const response = await projectService.getProjectUsers();

      if (response.success) {
        setUsers(response.data);
      } else {
        throw new Error(response.message || "Failed to load users");
      }
    } catch (err) {
      console.error("Error loading users:", err);
    }
  }, []);

  // Load owning units from API
  const loadOwningUnits = useCallback(async () => {
    try {
      const response = await projectService.getOwningUnits();

      if (response.success) {
        setOwningUnits(response.data);
      } else {
        throw new Error(response.message || "Failed to load owning units");
      }
    } catch (err) {
      console.error("Error loading owning units:", err);
    }
  }, []);

  // Load project statistics
  const loadStats = useCallback(async () => {
    try {
      const response = await projectService.getProjectStats();

      if (response.success) {
        setStats(response.data);
      } else {
        throw new Error(response.message || "Failed to load statistics");
      }
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  }, []);

  // Create a new project
  const createProject = useCallback(
    async (projectData: CreateProjectRequest): Promise<Project | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await projectService.createProject(projectData);

        if (response.success) {
          // Refresh the projects list
          await loadProjects();
          await loadStats();

          return response.data;
        } else {
          throw new Error(response.message || "Failed to create project");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create project";

        setError(errorMessage);
        console.error("Error creating project:", err);

        return null;
      } finally {
        setLoading(false);
      }
    },
    [loadProjects, loadStats],
  );

  // Update an existing project
  const updateProject = useCallback(
    async (projectData: UpdateProjectRequest): Promise<Project | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await projectService.updateProject(projectData);

        if (response.success) {
          // Update the project in the local state
          setProjects((prev) =>
            prev.map((p) => (p.id === response.data.id ? response.data : p)),
          );
          await loadStats();

          return response.data;
        } else {
          throw new Error(response.message || "Failed to update project");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update project";

        setError(errorMessage);
        console.error("Error updating project:", err);

        return null;
      } finally {
        setLoading(false);
      }
    },
    [loadStats],
  );

  // Delete a project
  const deleteProject = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const response = await projectService.deleteProject(id);

        if (response.success) {
          // Remove the project from local state
          setProjects((prev) => prev.filter((p) => p.id !== id));
          await loadStats();

          return true;
        } else {
          throw new Error(response.message || "Failed to delete project");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete project";

        setError(errorMessage);
        console.error("Error deleting project:", err);

        return false;
      } finally {
        setLoading(false);
      }
    },
    [loadStats],
  );

  // Filter users for autocomplete using unified search service
  const filterUsers = useCallback(
    (searchValue: string): User[] => {
      // Use the unified search service for consistent search behavior
      const results = SearchService.universalSearch(
        users as any[],
        searchValue,
      ) as User[];

      // Sort by relevance for better user experience
      return SearchService.sortByRelevance(
        results as any[],
        searchValue,
      ) as User[];
    },
    [users],
  );

  // Update filters and reload projects
  const updateFilters = useCallback((newFilters: ProjectFilters) => {
    setFilters(newFilters);
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([
      loadProjects(),
      loadUsers(),
      loadOwningUnits(),
      loadStats(),
    ]);
  }, [loadProjects, loadUsers, loadOwningUnits, loadStats]);

  // Calculate local statistics (fallback if API stats fail)
  const calculateLocalStats = useCallback((): ProjectStats => {
    return {
      total: projects.length,
      new: projects.filter((p) => p.status === 1).length, // New (جديد)
      delayed: projects.filter((p) => p.status === 2).length, // Delayed (مؤجل)
      underReview: projects.filter((p) => p.status === 3).length, // Under Review (قيد الدراسة)
      underDevelopment: projects.filter((p) => p.status === 4).length, // Under Development (قيد التطوير)
      production: projects.filter((p) => p.status === 5).length, // Production Environment (بيئة الانتاج)
    };
  }, [projects]);

  // Initial data load - only run once on mount
  useEffect(() => {
    refreshData();
  }, []); // ✅ Empty dependency array - run only once

  // Reload projects when filters change
  useEffect(() => {
    loadProjects(1); // Reset to first page when filters change
  }, [JSON.stringify(filters)]); // ✅ Only when filters actually change

  // Pagination functions
  const handlePageChange = useCallback(
    (page: number) => {
      loadProjects(page);
    },
    [loadProjects],
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      setPageSize(newPageSize);
      loadProjects(1, newPageSize); // Reset to first page with new page size
    },
    [loadProjects],
  );

  return {
    // Data
    projects,
    users,
    owningUnits,
    stats: stats || calculateLocalStats(),

    // State
    loading,
    error,
    filters,

    // Pagination
    currentPage,
    totalPages,
    totalProjects,
    pageSize,

    // Actions
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    filterUsers,
    updateFilters,
    refreshData,
    handlePageChange,
    handlePageSizeChange,

    // Utilities
    clearError: () => setError(null),
  };
};
