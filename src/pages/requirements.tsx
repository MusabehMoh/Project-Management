import type { AssignedProject } from "@/types/projectRequirement";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Skeleton } from "@heroui/skeleton";
import { Select, SelectItem } from "@heroui/select";
import { useNavigate } from "react-router-dom";
import { FolderOpen, Clock, Users, Info, X } from "lucide-react";
import { Input } from "@heroui/input";
import { Tooltip } from "@heroui/tooltip";

import { useLanguage } from "@/contexts/LanguageContext";
import LoadingLogo from "@/components/LoadingLogo";
import { useProjectDetails } from "@/hooks/useProjectDetails";
import { useProjectRequirements } from "@/hooks/useProjectRequirements";
import { GlobalPagination } from "@/components/GlobalPagination";
import { usePageTitle } from "@/hooks";
import { useProjectStatus } from "@/hooks/useProjectStatus";
import { PAGE_SIZE_OPTIONS, normalizePageSize } from "@/constants/pagination";
import ProjectDetailsDrawer from "@/components/ProjectDetailsDrawer";

export default function RequirementsPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Set page title
  usePageTitle("requirements.title");

  // Phases hook for dynamic phase management
  const { phases, getProjectStatusName, getProjectStatusColor } =
    useProjectStatus();

  // Drawer state for project details
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProject, setSelectedProject] =
    useState<AssignedProject | null>(null);
  const [projectIdForDetails, setProjectIdForDetails] = useState<
    number | undefined
  >(undefined);
  const [isOptionOpen, setIsOptionOpen] = useState(false);

  // Hook to fetch project details for drawer view
  const { project: projectDetailsData, loading: detailsLoading } =
    useProjectDetails({
      projectId: projectIdForDetails,
      enabled: projectIdForDetails !== undefined,
    });

  const {
    assignedProjects,
    loading,
    error,
    loadAssignedProjects,
    clearError,
    // Pagination for assigned projects
    assignedProjectsCurrentPage,
    assignedProjectsTotalPages,
    totalAssignedProjects,
    assignedProjectsPageSize,
    assignedProjectsSearch,
    assignedProjectsLoading,
    handleAssignedProjectsPageChange,
    handleAssignedProjectsPageSizeChange,
    handleAssignedProjectsSearchChange,
  } = useProjectRequirements();

  // Local debounced search to avoid re-rendering and focus loss on each keystroke
  const [localSearch, setLocalSearch] = useState(assignedProjectsSearch || "");

  // Additional filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("lastActivity");

  useEffect(() => {
    setLocalSearch(assignedProjectsSearch || "");
  }, [assignedProjectsSearch]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (localSearch !== assignedProjectsSearch) {
        handleAssignedProjectsSearchChange(localSearch);
      }
    }, 300);

    return () => clearTimeout(id);
  }, [localSearch, assignedProjectsSearch, handleAssignedProjectsSearchChange]);

  // Ensure current page size is part of the allowed options list
  const effectivePageSize = normalizePageSize(assignedProjectsPageSize, 10);

  // Clear filters function
  const resetFilters = () => {
    setLocalSearch("");
    handleAssignedProjectsSearchChange("");
    setStatusFilter("all");
    setSortBy("lastActivity");
  };

  // Check if any filters are active
  const hasActiveFilters =
    localSearch.trim() !== "" ||
    statusFilter !== "all" ||
    sortBy !== "lastActivity";

  useEffect(() => {
    loadAssignedProjects();
  }, [loadAssignedProjects]);

  // Keyboard shortcuts for pagination
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if no input is focused
      if (document.activeElement?.tagName === "INPUT") return;

      if (
        event.key === "ArrowLeft" &&
        event.ctrlKey &&
        assignedProjectsCurrentPage > 1
      ) {
        event.preventDefault();
        handleAssignedProjectsPageChange(assignedProjectsCurrentPage - 1);
      } else if (
        event.key === "ArrowRight" &&
        event.ctrlKey &&
        assignedProjectsCurrentPage < assignedProjectsTotalPages
      ) {
        event.preventDefault();
        handleAssignedProjectsPageChange(assignedProjectsCurrentPage + 1);
      } else if (
        event.key === "Home" &&
        event.ctrlKey &&
        assignedProjectsCurrentPage > 1
      ) {
        event.preventDefault();
        handleAssignedProjectsPageChange(1);
      } else if (
        event.key === "End" &&
        event.ctrlKey &&
        assignedProjectsCurrentPage < assignedProjectsTotalPages
      ) {
        event.preventDefault();
        handleAssignedProjectsPageChange(assignedProjectsTotalPages);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    assignedProjectsCurrentPage,
    assignedProjectsTotalPages,
    handleAssignedProjectsPageChange,
  ]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: number) => {
    return getProjectStatusColor(status);
  };

  const getStatusText = (status: number) => {
    return getProjectStatusName(status);
  };

  const handleViewRequirements = (project: AssignedProject) => {
    navigate(`/requirements/${project.id}`);
  };

  // Function to open project details drawer
  const handleViewDetails = (project: AssignedProject) => {
    setProjectIdForDetails(project.id);
    setIsDrawerOpen(true);
  };

  // Effect to populate selected project when data is fetched
  useEffect(() => {
    if (projectDetailsData) {
      setSelectedProject(projectDetailsData as unknown as AssignedProject);

      // Reset projectIdForDetails to allow re-triggering on next view
      setProjectIdForDetails(undefined);
    }
  }, [projectDetailsData]);

  // Filter and sort assigned projects
  const filteredAndSortedProjects = assignedProjects
    .filter((project) => {
      // Status filter
      if (
        statusFilter !== "all" &&
        project.status.toString() !== statusFilter
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Sort logic
      switch (sortBy) {
        case "lastActivity":
          return (
            new Date(b.lastActivity).getTime() -
            new Date(a.lastActivity).getTime()
          );
        case "requirementsCount":
          return b.requirementsCount - a.requirementsCount;
        case "completionRate":
          const aRate =
            a.requirementsCount > 0
              ? (a.completedRequirements / a.requirementsCount) * 100
              : 0;
          const bRate =
            b.requirementsCount > 0
              ? (b.completedRequirements / b.requirementsCount) * 100
              : 0;

          return bRate - aRate;
        case "name":
          return a.applicationName.localeCompare(b.applicationName);
        default:
          return 0;
      }
    });

  // Show global loading logo only for non-assigned-projects loading states
  if (loading && !assignedProjectsLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingLogo showText size="lg" text={t("common.loading")} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
        <div className="text-danger text-center">
          <h3 className="text-lg font-semibold">
            {t("common.unexpectedError")}
          </h3>
          <p className="text-default-500">{error}</p>
        </div>
        <Button
          color="primary"
          onPress={() => {
            clearError();
            loadAssignedProjects();
          }}
        >
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">{t("requirements.title")}</h1>
          <p className="text-default-500">{t("requirements.subtitle")}</p>
        </div>

        {/* Assigned Projects Section */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              <h2 className="text-xl font-semibold">
                {t("requirements.assignedProjects")}
              </h2>
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-3 w-full lg:items-center lg:justify-between">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-wrap">
                <Input
                  aria-label={t("common.search")}
                  className="w-full sm:w-80"
                  placeholder={t("common.search") + "..."}
                  value={localSearch}
                  onValueChange={(val) => setLocalSearch(val)}
                />

                {/* Status Filter */}
                <Select
                  aria-label={t("projects.filterByStatus")}
                  className="w-full sm:w-52"
                  items={[
                    { key: "all", label: t("projects.allStatuses") },
                    ...phases.map((phase) => ({
                      key: phase.code.toString(),
                      label: language === "ar" ? phase.nameAr : phase.nameEn,
                    })),
                  ]}
                  placeholder={t("projects.filterByStatus")}
                  selectedKeys={statusFilter !== "all" ? [statusFilter] : []}
                  size="md"
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;

                    setStatusFilter(value || "all");
                  }}
                >
                  {(item) => (
                    <SelectItem key={item.key}>{item.label}</SelectItem>
                  )}
                </Select>

                {/* Sort By Filter */}
                <Select
                  aria-label={t("projects.sortBy")}
                  className="w-full sm:w-52"
                  items={[
                    {
                      key: "lastActivity",
                      label: t("projects.sortByLastActivity"),
                    },
                    { key: "name", label: t("projects.sortByName") },
                    {
                      key: "requirementsCount",
                      label: t("projects.sortByRequirementsCount"),
                    },
                    {
                      key: "completionRate",
                      label: t("projects.sortByCompletionRate"),
                    },
                  ]}
                  placeholder={t("projects.sortBy")}
                  selectedKeys={sortBy !== "lastActivity" ? [sortBy] : []}
                  size="md"
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;

                    setSortBy(value || "lastActivity");
                  }}
                >
                  {(item) => (
                    <SelectItem key={item.key}>{item.label}</SelectItem>
                  )}
                </Select>
              </div>

              {/* Page Size Selector */}
              {!assignedProjectsLoading && totalAssignedProjects > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-default-600">
                    {t("common.show")}:
                  </span>
                  <Select
                    className="w-24"
                    disallowEmptySelection={true}
                    isOpen={isOptionOpen}
                    selectedKeys={[effectivePageSize.toString()]}
                    size="sm"
                    onOpenChange={setIsOptionOpen}
                    onSelectionChange={(keys) => {
                      const newSizeStr = Array.from(keys)[0] as string;

                      if (!newSizeStr) return;

                      const newSize = parseInt(newSizeStr, 10);

                      if (!Number.isNaN(newSize)) {
                        handleAssignedProjectsPageSizeChange(newSize);
                      }
                    }}
                  >
                    {PAGE_SIZE_OPTIONS.map((opt) => {
                      const val = opt.toString();

                      return (
                        <SelectItem
                          key={val}
                          textValue={val}
                          onPress={() => {
                            setIsOptionOpen(false); // Force close when any item is clicked
                          }}
                        >
                          {val}
                        </SelectItem>
                      );
                    })}
                  </Select>
                  <span className="text-sm text-default-600">
                    {t("pagination.perPage")}
                  </span>
                </div>
              )}
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 -mt-2">
                <Button
                  color="secondary"
                  size="sm"
                  startContent={<X size={16} />}
                  variant="flat"
                  onPress={resetFilters}
                >
                  {t("requirements.clearFilters")}
                </Button>
                <span className="text-sm text-default-500">
                  {t("projects.projectsFound").replace(
                    "{count}",
                    filteredAndSortedProjects.length.toString(),
                  )}
                </span>
              </div>
            )}

            {assignedProjectsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card
                    key={`skeleton-${index}`}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex justify-between items-start">
                          <Skeleton className="h-6 w-3/4 rounded" />
                          <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                      </div>
                    </CardHeader>
                    <Divider />
                    <CardBody className="space-y-4">
                      {/* Project Info Skeleton */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-4 w-24 rounded" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-4 w-20 rounded" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-4 w-16 rounded" />
                        </div>
                      </div>

                      {/* Requirements Skeleton */}
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32 rounded" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-full rounded" />
                          <Skeleton className="h-4 w-full rounded" />
                          <Skeleton className="h-4 w-3/4 rounded" />
                        </div>
                      </div>

                      {/* Action Button Skeleton */}
                      <Skeleton className="h-10 w-full rounded-lg" />
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : !filteredAndSortedProjects ||
              filteredAndSortedProjects.length === 0 ? (
              <Card>
                <CardBody className="text-center py-12">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-24 h-24 bg-default-100 rounded-full flex items-center justify-center">
                      <FolderOpen className="w-12 h-12 text-default-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-default-700">
                        {hasActiveFilters
                          ? t("requirements.noResultsTitle")
                          : t("requirements.noAssignedProjects")}
                      </h3>
                      <p className="text-default-500">
                        {hasActiveFilters
                          ? t("requirements.noResultsDescription")
                          : t("requirements.checkBackLater")}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedProjects?.map((project) => (
                  <Card
                    key={project.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-semibold line-clamp-2">
                            {project.applicationName}
                          </h3>
                          <Chip
                            color={getStatusColor(project.status)}
                            size="sm"
                            variant="flat"
                          >
                            {getStatusText(project.status)}
                          </Chip>
                        </div>
                      </div>
                    </CardHeader>
                    <Divider />
                    <CardBody className="space-y-4">
                      {/* Project Info */}
                      <div className="space-y-2">
                        <Tooltip content={t("requirements.projectOwner")}>
                          <div className="flex items-center gap-2 text-sm text-default-600 w-fit cursor-help">
                            <Users className="w-4 h-4" />
                            <span>{project.projectOwner}</span>
                          </div>
                        </Tooltip>
                        <Tooltip content={t("requirements.owningUnit")}>
                          <div
                            className="text-sm text-default-500 w-fit cursor-help"
                            dir={language === "ar" ? "rtl" : "ltr"}
                          >
                            {project.owningUnit}
                          </div>
                        </Tooltip>
                      </div>

                      {/* Requirements Stats */}
                      <div className="flex gap-3">
                        <div className="flex-1 bg-default-50 dark:bg-default-100/10 rounded-lg px-3 py-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-semibold text-default-700">
                              {project.requirementsCount}
                            </span>
                            <span className="text-xs text-default-500">
                              {t("requirements.total")}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 bg-success-50 dark:bg-success-100/10 rounded-lg px-3 py-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-semibold text-success-600 dark:text-success-500">
                              {project.completedRequirements}
                            </span>
                            <span className="text-xs text-success-600/70 dark:text-success-500/70">
                              {t("requirements.done")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Last Activity */}
                      <div className="flex items-center gap-2 text-sm text-default-500">
                        <Clock className="w-4 h-4" />
                        <span>
                          {t("requirements.lastActivity")}:{" "}
                          {formatDate(project.lastActivity)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-default-600">
                            {t("common.progress")}
                          </span>
                          <span className="text-default-500">
                            {project.requirementsCount > 0
                              ? Math.round(
                                  (project.completedRequirements /
                                    project.requirementsCount) *
                                    100,
                                )
                              : 0}
                            %
                          </span>
                        </div>
                        <div className="w-full bg-default-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              project.requirementsCount > 0
                                ? (project.completedRequirements /
                                    project.requirementsCount) *
                                    100 >=
                                  70
                                  ? "bg-success"
                                  : (project.completedRequirements /
                                        project.requirementsCount) *
                                        100 >=
                                      40
                                    ? "bg-warning"
                                    : "bg-danger"
                                : "bg-default-300"
                            }`}
                            style={{
                              width: `${
                                project.requirementsCount > 0
                                  ? (project.completedRequirements /
                                      project.requirementsCount) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          color="default"
                          size="sm"
                          variant="bordered"
                          onPress={() => handleViewRequirements(project)}
                        >
                          {t("requirements.viewRequirements")}
                        </Button>
                        <Tooltip content={t("requirements.viewDetails")}>
                          <Button
                            isIconOnly
                            color="default"
                            size="sm"
                            variant="bordered"
                            onPress={() => handleViewDetails(project)}
                          >
                            <Info className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!assignedProjectsLoading &&
              totalAssignedProjects > assignedProjectsPageSize && (
                <div className="flex justify-center py-6">
                  <GlobalPagination
                    className="w-full max-w-md"
                    currentPage={assignedProjectsCurrentPage}
                    isLoading={assignedProjectsLoading}
                    pageSize={effectivePageSize}
                    showInfo={true}
                    totalItems={totalAssignedProjects}
                    totalPages={assignedProjectsTotalPages}
                    onPageChange={handleAssignedProjectsPageChange}
                  />
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Project Details Drawer */}
      <ProjectDetailsDrawer
        isOpen={isDrawerOpen}
        loading={detailsLoading}
        project={selectedProject}
        onOpenChange={setIsDrawerOpen}
        onViewRequirements={handleViewRequirements}
      />
    </>
  );
}
