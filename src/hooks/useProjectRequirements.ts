import type {
  ProjectRequirement,
  AssignedProject,
  CreateProjectRequirementRequest,
  UpdateProjectRequirementRequest,
  ProjectRequirementFilters,
  ProjectRequirementStats,
} from "@/types/projectRequirement";

import { useState, useEffect, useCallback, useRef } from "react";
import { addToast } from "@heroui/toast";

import { projectRequirementsService } from "@/services/api/projectRequirementsService";
import { useLanguage } from "@/contexts/LanguageContext";

interface UseProjectRequirementsProps {
  projectId?: number;
  initialFilters?: ProjectRequirementFilters;
  pageSize?: number;
  onSearchNoResults?: () => void;
}

export function useProjectRequirements({
  projectId,
  initialFilters = {},
  pageSize = 10,
  onSearchNoResults,
}: UseProjectRequirementsProps = {}) {
  const { t } = useLanguage();
  const [requirements, setRequirements] = useState<ProjectRequirement[]>([]);
  const [assignedProjects, setAssignedProjects] = useState<AssignedProject[]>(
    [],
  );
  const [stats, setStats] = useState<ProjectRequirementStats | null>(null);
  const [loading, setLoading] = useState(false);
  // Separate loading flag for assigned projects to avoid full-page reloads on search
  const [assignedProjectsLoading, setAssignedProjectsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track in-flight request by key to prevent duplicate calls with same params (e.g., StrictMode)
  const inFlightKeyRef = useRef<string | null>(null);
  // Separate in-flight tracker for assigned projects to avoid duplicate calls (e.g. StrictMode + re-renders)
  const assignedInFlightKeyRef = useRef<string | null>(null);

  // Pagination for requirements
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRequirements, setTotalRequirements] = useState(0);

  // Pagination for assigned projects
  const [assignedProjectsCurrentPage, setAssignedProjectsCurrentPage] =
    useState(1);
  const [assignedProjectsTotalPages, setAssignedProjectsTotalPages] =
    useState(1);
  const [totalAssignedProjects, setTotalAssignedProjects] = useState(0);
  const [assignedProjectsPageSize, setAssignedProjectsPageSize] =
    useState(pageSize);
  // Assigned projects filters
  const [assignedProjectsSearch, setAssignedProjectsSearch] = useState("");
  const [assignedProjectsProjectId, setAssignedProjectsProjectId] = useState<
    number | undefined
  >(undefined);

  // Filters
  const [filters, setFilters] =
    useState<ProjectRequirementFilters>(initialFilters);

  /**
   * Load assigned projects for the current analyst
   */
  const loadAssignedProjects = useCallback(
    async (userId?: number) => {
      const key = `${userId || "current"}|${assignedProjectsCurrentPage}|${assignedProjectsPageSize}|${assignedProjectsSearch}|${assignedProjectsProjectId || "all"}`;

      if (assignedInFlightKeyRef.current === key) {
        return; // prevent duplicate identical request
      }
      assignedInFlightKeyRef.current = key;
      setAssignedProjectsLoading(true);
      setError(null);

      try {
        const result = await projectRequirementsService.getAssignedProjects(
          userId,
          {
            page: assignedProjectsCurrentPage,
            limit: assignedProjectsPageSize,
            search: assignedProjectsSearch || undefined,
            projectId: assignedProjectsProjectId,
          },
        );

        setAssignedProjects(result.data);
        setAssignedProjectsTotalPages(result.pagination.totalPages);
        setTotalAssignedProjects(result.pagination.total);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to load assigned projects";

        setError(errorMessage);
        addToast({
          title: "Error",
          description: errorMessage,
          color: "danger",
        });
      } finally {
        setAssignedProjectsLoading(false);
        assignedInFlightKeyRef.current = null;
      }
    },
    [
      assignedProjectsCurrentPage,
      assignedProjectsPageSize,
      assignedProjectsSearch,
      assignedProjectsProjectId,
    ],
  );

  /**
   * Load all projects (not filtered by user assignments)
   */
  const loadAllProjects = useCallback(async () => {
    const key = `all-projects|${assignedProjectsCurrentPage}|${assignedProjectsPageSize}|${assignedProjectsSearch}`;

    if (assignedInFlightKeyRef.current === key) {
      return; // prevent duplicate identical request
    }
    assignedInFlightKeyRef.current = key;
    setAssignedProjectsLoading(true);
    setError(null);

    try {
      const result = await projectRequirementsService.getAllProjects({
        page: assignedProjectsCurrentPage,
        limit: assignedProjectsPageSize,
        search: assignedProjectsSearch || undefined,
      });

      setAssignedProjects(result.data);
      setAssignedProjectsTotalPages(result.pagination.totalPages);
      setTotalAssignedProjects(result.pagination.total);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load all projects";

      setError(errorMessage);
      addToast({
        title: "Error",
        description: errorMessage,
        color: "danger",
      });
    } finally {
      setAssignedProjectsLoading(false);
      assignedInFlightKeyRef.current = null;
    }
  }, [
    assignedProjectsCurrentPage,
    assignedProjectsPageSize,
    assignedProjectsSearch,
  ]);

  /**
   * Load requirements for a specific project
   */
  const loadRequirements = useCallback(async () => {
    if (!projectId) return;
    const key = `${projectId}|${currentPage}|${pageSize}|${JSON.stringify(filters)}`;

    if (inFlightKeyRef.current === key) {
      // Duplicate call with identical params; skip
      return;
    }
    inFlightKeyRef.current = key;

    setLoading(true);
    setError(null);

    try {
      const result = await projectRequirementsService.getProjectRequirements(
        projectId,
        {
          ...filters,
          page: currentPage,
          limit: pageSize,
        },
      );

      setRequirements(result.data);
      setTotalPages(result.pagination.totalPages);
      setTotalRequirements(result.pagination.total);

      // If search was performed but no results found, call the callback
      if (
        filters.search &&
        result.data.length === 0 &&
        result.pagination.total === 0
      ) {
        onSearchNoResults?.();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load requirements";

      setError(errorMessage);
      addToast({
        title: "Error",
        description: errorMessage,
        color: "danger",
      });
    } finally {
      setLoading(false);
      inFlightKeyRef.current = null;
    }
  }, [projectId, filters, currentPage, pageSize]);

  /**
   * Load requirement statistics
   */
  const loadStats = useCallback(async () => {
    if (!projectId) return;

    try {
      const projectStats =
        await projectRequirementsService.getRequirementStats(projectId);

      setStats(projectStats);
    } catch {
      // Silently ignore stats loading errors
    }
  }, [projectId]);

  /**
   * Create a new requirement
   */
  const createRequirement = useCallback(
    async (data: CreateProjectRequirementRequest) => {
      if (!projectId) throw new Error("Project ID is required");

      setLoading(true);
      try {
        const newRequirement =
          await projectRequirementsService.createRequirement(projectId, data);

        // Reload the requirements list to get fresh data with proper pagination
        await Promise.all([loadRequirements(), loadStats()]);
        addToast({
          title: "Success",
          description: t("requirements.createSuccess"),
          color: "success",
        });

        return newRequirement;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create requirement";

        addToast({
          title: "Error",
          description: errorMessage,
          color: "danger",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [projectId, loadRequirements, loadStats],
  );

  /**
   * Update an existing requirement
   */
  const updateRequirement = useCallback(
    async (requirementId: number, data: UpdateProjectRequirementRequest) => {
      setLoading(true);
      try {
        const updatedRequirement =
          await projectRequirementsService.updateRequirement(
            requirementId,
            data,
          );

        // Reload the requirements list to get fresh data with proper pagination
        await Promise.all([loadRequirements(), loadStats()]);
        addToast({
          title: "Success",
          description: t("requirements.updateSuccess"),
          color: "success",
        });

        return updatedRequirement;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update requirement";

        addToast({
          title: "Error",
          description: errorMessage,
          color: "danger",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadRequirements, loadStats],
  );

  /**
   * Delete a requirement
   */
  const deleteRequirement = useCallback(
    async (requirementId: number) => {
      setLoading(true);
      try {
        await projectRequirementsService.deleteRequirement(requirementId);
        setRequirements((prev) =>
          prev.filter((req) => req.id !== requirementId),
        );
        await loadStats(); // Refresh stats
        addToast({
          title: "Success",
          description: t("requirements.deleteSuccess"),
          color: "success",
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete requirement";

        addToast({
          title: "Error",
          description: errorMessage,
          color: "danger",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadStats],
  );

  /**
   * Send requirement to development manager
   */
  const sendRequirement = useCallback(
    async (requirementId: number, status?: number) => {
      setLoading(true);
      try {
        const updatedRequirement =
          await projectRequirementsService.sendRequirement(
            requirementId,
            status,
          );

        setRequirements((prev) =>
          prev.map((req) =>
            req.id === requirementId ? updatedRequirement : req,
          ),
        );
        await loadStats(); // Refresh stats
        addToast({
          title: "Success",
          description: t("requirements.sendSuccess"),
          color: "success",
        });

        return updatedRequirement;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to send requirement";

        addToast({
          title: "Error",
          description: errorMessage,
          color: "danger",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadStats],
  );

  /**
   * Update filters and reset to first page
   */
  const updateFilters = useCallback((newFilters: ProjectRequirementFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  /**
   * Handle assigned projects page change
   */
  const handleAssignedProjectsPageChange = useCallback((page: number) => {
    setAssignedProjectsCurrentPage(page);
  }, []);

  /**
   * Handle assigned projects page size change
   */
  const handleAssignedProjectsPageSizeChange = useCallback((size: number) => {
    setAssignedProjectsCurrentPage(1);
    setAssignedProjectsPageSize(size);
  }, []);

  /**
   * Handle assigned projects search change
   */
  const handleAssignedProjectsSearchChange = useCallback((value: string) => {
    setAssignedProjectsCurrentPage(1);
    setAssignedProjectsSearch(value);
  }, []);

  /**
   * Handle assigned projects project filter change
   */
  const handleAssignedProjectsProjectIdChange = useCallback(
    (projectId?: number) => {
      setAssignedProjectsCurrentPage(1);
      setAssignedProjectsProjectId(projectId);
    },
    [],
  );

  /**
   * Handle page change
   */
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  /**
   * Handle page size change
   */
  const handlePageSizeChange = useCallback((_size: number) => {
    setCurrentPage(1);
    // pageSize is handled by parent component through props
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refresh all data
   */
  const refreshData = useCallback(async () => {
    if (projectId) {
      await Promise.all([loadRequirements(), loadStats()]);
    } else {
      await loadAssignedProjects();
    }
  }, [projectId, loadRequirements, loadStats, loadAssignedProjects]);

  // Single orchestrating effect to avoid duplicate fetches
  useEffect(() => {
    if (!projectId) return;

    loadRequirements();
    loadStats();
  }, [projectId, JSON.stringify(filters), currentPage, pageSize]);

  // Effect for assigned projects pagination
  useEffect(() => {
    if (projectId) return; // Only for assigned projects view

    loadAssignedProjects();
  }, [
    assignedProjectsCurrentPage,
    assignedProjectsPageSize,
    loadAssignedProjects,
    projectId,
  ]);

  /**
   * Upload attachments for a requirement
   */
  const uploadAttachments = useCallback(
    async (requirementId: number, files: File[]) => {
      if (files.length === 0) return [];

      setLoading(true);
      try {
        const uploadedAttachments =
          await projectRequirementsService.uploadAttachments(
            requirementId,
            files,
          );

        // Update the requirement in the local state to include new attachments
        setRequirements((prev) =>
          prev.map((req) =>
            req.id === requirementId
              ? {
                  ...req,
                  attachments: [
                    ...(req.attachments || []),
                    ...uploadedAttachments,
                  ],
                }
              : req,
          ),
        );

        addToast({
          title: "Success",
          description: `${uploadedAttachments.length} file(s) ${t("requirements.uploadSuccess")}`,
          color: "success",
        });

        return uploadedAttachments;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to upload files";

        addToast({
          title: "Error",
          description: errorMessage,
          color: "danger",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Delete an attachment from a requirement
   */
  const deleteAttachment = useCallback(
    async (requirementId: number, attachmentId: number) => {
      setLoading(true);
      try {
        await projectRequirementsService.deleteAttachment(
          requirementId,
          attachmentId,
        );

        // Update the requirement in the local state to remove the attachment
        setRequirements((prev) =>
          prev.map((req) =>
            req.id === requirementId
              ? {
                  ...req,
                  attachments:
                    req.attachments?.filter((att) => att.id !== attachmentId) ||
                    [],
                }
              : req,
          ),
        );

        addToast({
          title: "Success",
          description: t("requirements.attachmentDeleteSuccess"),
          color: "success",
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete attachment";

        addToast({
          title: "Error",
          description: errorMessage,
          color: "danger",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Download an attachment
   */
  const downloadAttachment = useCallback(
    async (requirementId: number, attachmentId: number, filename: string) => {
      try {
        const blob = await projectRequirementsService.downloadAttachment(
          requirementId,
          attachmentId,
        );

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);

        addToast({
          title: "Success",
          description: t("requirements.downloadSuccess"),
          color: "success",
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to download file";

        addToast({
          title: "Error",
          description: errorMessage,
          color: "danger",
        });
        throw err;
      }
    },
    [],
  );

  return {
    // Data
    requirements,
    assignedProjects,
    stats,
    loading,
    error,

    // Pagination for requirements
    currentPage,
    totalPages,
    totalRequirements,
    pageSize,

    // Pagination for assigned projects
    assignedProjectsCurrentPage,
    assignedProjectsTotalPages,
    totalAssignedProjects,
    assignedProjectsPageSize,
    assignedProjectsSearch,
    assignedProjectsProjectId,

    // Loading state specific to assigned projects
    assignedProjectsLoading,

    // Filters
    filters,

    // Actions
    loadAssignedProjects,
    loadAllProjects,
    loadRequirements,
    createRequirement,
    updateRequirement,
    deleteRequirement,
    sendRequirement,
    updateFilters,
    handlePageChange,
    handlePageSizeChange,
    handleAssignedProjectsPageChange,
    handleAssignedProjectsPageSizeChange,
    handleAssignedProjectsSearchChange,
    handleAssignedProjectsProjectIdChange,
    clearError,
    refreshData,
    uploadAttachments,
    deleteAttachment,
    downloadAttachment,
  };
}
