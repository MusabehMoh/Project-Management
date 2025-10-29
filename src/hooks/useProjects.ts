import { useState, useEffect, useCallback, useRef } from "react";

import {
  Project,
  User,
  OwningUnit,
  ProjectFilters,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectStats,
} from "@/types/project";
import { projectService, timelineService } from "@/services/api";
import { MemberSearchResult } from "@/types/timeline";
import SearchService from "@/services/searchService";

// Custom hook for projects data management
export const useProjects = (options?: {
  skip?: boolean;
  initialFilters?: ProjectFilters;
}) => {
  const { skip = false, initialFilters } = options || {};
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
  const inFlightProjectsRef = useRef<{
    key: string;
    promise: Promise<void>;
  } | null>(null);
  const inFlightUsersRef = useRef<Promise<void> | null>(null);
  const inFlightOwningUnitsRef = useRef<Promise<void> | null>(null);
  const inFlightStatsRef = useRef<Promise<void> | null>(null);

  const recentCallsRef = useRef<{ key: string; t: number }[]>([]);

  const loadProjects = useCallback(
    async (page = 1, limit = pageSize) => {
      const key = JSON.stringify({ filters, page, limit });

      // Rate-limit / loop protection (same params >5 times within 5s)
      const now = Date.now();
      const recent = recentCallsRef.current;

      // purge old
      while (recent.length && now - recent[0].t > 5000) recent.shift();
      recent.push({ key, t: now });
      const sameKeyCount = recent.filter((r) => r.key === key).length;

      if (sameKeyCount > 5) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.warn(
            "loadProjects aborted to prevent potential infinite loop (same params >5 times in 5s)",
            key,
          );
        }

        return;
      }

      // Dedupe identical in-flight requests (prevents StrictMode double-call spam)
      if (inFlightProjectsRef.current?.key === key) {
        return inFlightProjectsRef.current.promise;
      }

      const exec = (async () => {
        try {
          setLoading(true);
          setError(null);

          const response = await projectService.getProjects(
            filters,
            page,
            limit,
          );

          if (response.success) {
            // Deduplicate projects by id to avoid React key collisions if API returns duplicates
            const seen = new Set<number>();
            const duplicates: number[] = [];
            const unique = response.data.filter((p: Project) => {
              if (seen.has(p.id)) {
                duplicates.push(p.id);

                return false;
              }
              seen.add(p.id);

              return true;
            });

            if (duplicates.length && process.env.NODE_ENV !== "production") {
              // eslint-disable-next-line no-console
              console.warn(
                "Duplicate project IDs detected in API response (deduplicated locally):",
                Array.from(new Set(duplicates)),
              );
            }
            setProjects(unique);
            // Set pagination info from API response
            setCurrentPage(response.pagination?.page || page);
            setTotalPages(response.pagination?.totalPages || 1);
            setTotalProjects(
              response.pagination?.total || response.data.length,
            );
            setPageSize(response.pagination?.limit || limit);
          } else {
            throw new Error(response.message || "Failed to load projects");
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to load projects";

          setError(errorMessage);
          if (process.env.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.error("Error loading projects:", err);
          }
        } finally {
          setLoading(false);
          // Clear in-flight reference when done
          if (inFlightProjectsRef.current?.key === key) {
            inFlightProjectsRef.current = null;
          }
        }
      })();

      inFlightProjectsRef.current = { key, promise: exec };

      return exec;
    },
    [filters, pageSize],
  );

  // Load department employees from API instead of general users
  const loadUsers = useCallback(async () => {
    if (inFlightUsersRef.current) return inFlightUsersRef.current;
    const run = (async () => {
      try {
        // Use timelineService to fetch all department employees (without search query)
        const response = await timelineService.getAllDepartmentEmployees();

        if (response.success) {
          // Convert MemberSearchResult to User format for compatibility
          const departmentEmployees = response.data.map(
            (employee: MemberSearchResult) => ({
              id: employee.id,
              userName: employee.userName,
              prsId: employee.id, // Using id as prsId for compatibility
              statusId: employee.statusId,
              fullName: employee.fullName,
              militaryNumber: employee.militaryNumber,
              gradeName: employee.gradeName,
              department: employee.department,
              // Add any other required fields with defaults
              createdAt: undefined,
              updatedAt: undefined,
            }),
          );

          setUsers(departmentEmployees);
        } else {
          throw new Error(
            response.message || "Failed to load department employees",
          );
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.error("Error loading department employees:", err);
        }
      } finally {
        inFlightUsersRef.current = null;
      }
    })();

    inFlightUsersRef.current = run;

    return run;
  }, []);

  // Load owning units from API
  const loadOwningUnits = useCallback(async () => {
    if (inFlightOwningUnitsRef.current) return inFlightOwningUnitsRef.current;
    const run = (async () => {
      try {
        const response = await projectService.getOwningUnits();

        if (response.success) {
          setOwningUnits(response.data);
        } else {
          throw new Error(response.message || "Failed to load owning units");
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.error("Error loading owning units:", err);
        }
      } finally {
        inFlightOwningUnitsRef.current = null;
      }
    })();

    inFlightOwningUnitsRef.current = run;

    return run;
  }, []);

  // Load project statistics
  const loadStats = useCallback(async () => {
    if (inFlightStatsRef.current) return inFlightStatsRef.current;
    const run = (async () => {
      try {
        const response = await projectService.getProjectStats();

        if (response.success) {
          setStats(response.data);
        } else {
          throw new Error(response.message || "Failed to load statistics");
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.error("Error loading stats:", err);
        }
      } finally {
        inFlightStatsRef.current = null;
      }
    })();

    inFlightStatsRef.current = run;

    return run;
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
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.error("Error creating project:", err);
        }

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
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.error("Error updating project:", err);
        }

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
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.error("Error deleting project:", err);
        }

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
      ) as unknown as User[];

      // Sort by relevance for better user experience
      return SearchService.sortByRelevance(
        results as any[],
        searchValue,
      ) as unknown as User[];
    },
    [users],
  );

  // Update filters and reload projects
  const updateFilters = useCallback((newFilters: ProjectFilters) => {
    setFilters(newFilters);
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([loadProjects(), loadOwningUnits(), loadStats()]);
  }, [loadProjects, loadOwningUnits, loadStats]);

  // Calculate local statistics (fallback if API stats fail)
  const calculateLocalStats = useCallback((): ProjectStats => {
    return {
      total: projects.length,
      new: projects.filter((p) => p.status === 1).length, // New (جديد)
      delayed: projects.filter((p) => p.status === 2).length, // Delayed (مؤجل)
      underStudy: projects.filter((p) => p.status === 3).length, // Under Review (قيد الدراسة)
      underTesting: projects.filter((p) => p.status === 4).length, // Under Testing (قيد الأختبار)
      underDevelopment: projects.filter((p) => p.status === 4).length, // Under Development (قيد التطوير)
      production: projects.filter((p) => p.status === 5).length, // Production Environment (بيئة الانتاج)
    };
  }, [projects]);

  // Track first render to avoid duplicate initial load (esp. under StrictMode)
  const firstRenderRef = useRef(true);

  // Initial data load - only run once on mount
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    if (!skip) {
      refreshData(); // includes loadProjects
    }
  }, [refreshData, skip]);

  // Reload projects when filters change (skip very first render because refreshData already did it)
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;

      return;
    }
    loadProjects(1); // Reset to first page when filters change
  }, [filters, loadProjects]);

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
