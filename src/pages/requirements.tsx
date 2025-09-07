import type { AssignedProject } from "@/types/projectRequirement";

import { useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";
import { Select, SelectItem } from "@heroui/select";
import { useNavigate } from "react-router-dom";
import { FolderOpen, Clock, Users } from "lucide-react";

import { Input } from "@heroui/input";

import DefaultLayout from "@/layouts/default";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProjectRequirements } from "@/hooks/useProjectRequirements";
import { GlobalPagination } from "@/components/GlobalPagination";

export default function RequirementsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
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
    handleAssignedProjectsPageChange,
    handleAssignedProjectsPageSizeChange,
    handleAssignedProjectsSearchChange,
  } = useProjectRequirements();

  // Ensure current page size is part of the allowed options list
  const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];
  const effectivePageSize = PAGE_SIZE_OPTIONS.includes(assignedProjectsPageSize)
    ? assignedProjectsPageSize
    : 20;

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
    switch (status) {
      case 1:
        return "warning";
      case 2:
        return "danger";
      case 3:
        return "primary";
      case 4:
        return "secondary";
      case 5:
        return "success";
      default:
        return "default";
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 1:
        return t("projects.underStudy");
      case 2:
        return t("projects.delayed");
      case 3:
        return t("projects.underReview");
      case 4:
        return t("projects.underDevelopment");
      case 5:
        return t("projects.production");
      default:
        return "Unknown";
    }
  };

  const handleViewRequirements = (project: AssignedProject) => {
    navigate(`/requirements/${project.id}`);
  };

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center min-h-96">
          <Spinner label={t("common.loading")} size="lg" />
        </div>
      </DefaultLayout>
    );
  }

  if (error) {
    return (
      <DefaultLayout>
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
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
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
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Input
                  aria-label={t("common.search")}
                  className="w-full sm:w-80"
                  placeholder={t("common.search") + "..."}
                  value={assignedProjectsSearch}
                  onValueChange={(val) =>
                    handleAssignedProjectsSearchChange(val)
                  }
                />
              </div>

              {/* Page Size Selector */}
              {!loading && totalAssignedProjects > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-default-600">
                    {t("common.show")}:
                  </span>
                  <Select
                    className="w-24"
                    selectedKeys={[effectivePageSize.toString()]}
                    size="sm"
                    onSelectionChange={(keys) => {
                      const newSizeStr = Array.from(keys)[0] as string;

                      if (!newSizeStr) {
                        return;
                      }

                      const newSize = parseInt(newSizeStr, 10);

                      if (!Number.isNaN(newSize)) {
                        handleAssignedProjectsPageSizeChange(newSize);
                      }
                    }}
                  >
                    {PAGE_SIZE_OPTIONS.map((opt) => {
                      const val = opt.toString();

                      return (
                        <SelectItem key={val} textValue={val}>
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

            {/* Results info */}
            {!loading && totalAssignedProjects > 0 && (
              <div className="text-sm text-default-600">
                {t("pagination.showing")}{" "}
                {(assignedProjectsCurrentPage - 1) * assignedProjectsPageSize +
                  1}{" "}
                {t("pagination.to")}{" "}
                {Math.min(
                  assignedProjectsCurrentPage * assignedProjectsPageSize,
                  totalAssignedProjects,
                )}{" "}
                {t("pagination.of")} {totalAssignedProjects}{" "}
                {t("projects.totalProjects").toLowerCase()}
              </div>
            )}

            {!assignedProjects || assignedProjects.length === 0 ? (
              <Card>
                <CardBody className="text-center py-12">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-24 h-24 bg-default-100 rounded-full flex items-center justify-center">
                      <FolderOpen className="w-12 h-12 text-default-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-default-700">
                        {t("requirements.noAssignedProjects")}
                      </h3>
                      <p className="text-default-500">
                        {t("requirements.checkBackLater")}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignedProjects?.map((project) => (
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
                        <div className="flex items-center gap-2 text-sm text-default-600">
                          <Users className="w-4 h-4" />
                          <span>{project.projectOwner}</span>
                        </div>
                        <div className="text-sm text-default-500">
                          {project.owningUnit}
                        </div>
                      </div>

                      {/* Requirements Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {project.requirementsCount}
                          </div>
                          <div className="text-xs text-default-500">
                            {t("requirements.requirementsCount")}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-success">
                            {project.completedRequirements}
                          </div>
                          <div className="text-xs text-default-500">
                            {t("requirements.completedRequirements")}
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
                            className="bg-primary h-2 rounded-full transition-all duration-300"
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

                      {/* Action Button */}
                      <Button
                        className="w-full"
                        color="primary"
                        size="sm"
                        variant="flat"
                        onPress={() => handleViewRequirements(project)}
                      >
                        {t("requirements.viewRequirements")}
                      </Button>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalAssignedProjects > assignedProjectsPageSize && (
              <div className="flex justify-center py-6">
                <GlobalPagination
                  className="w-full max-w-md"
                  currentPage={assignedProjectsCurrentPage}
                  isLoading={loading}
                  pageSize={assignedProjectsPageSize}
                  showInfo={false}
                  totalItems={totalAssignedProjects}
                  totalPages={assignedProjectsTotalPages}
                  onPageChange={handleAssignedProjectsPageChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
