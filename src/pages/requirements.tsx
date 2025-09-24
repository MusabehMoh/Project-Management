import type { AssignedProject } from "@/types/projectRequirement";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/spinner";
import { Select, SelectItem } from "@heroui/select";
import { useNavigate } from "react-router-dom";
import { FolderOpen, Clock, Users, Info, Calendar } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
} from "@heroui/drawer";
import { Input } from "@heroui/input";

import { useLanguage } from "@/contexts/LanguageContext";
import { useProjectRequirements } from "@/hooks/useProjectRequirements";
import { GlobalPagination } from "@/components/GlobalPagination";
import { usePageTitle } from "@/hooks";
import { useProjectStatus } from "@/hooks/useProjectStatus";
import { PAGE_SIZE_OPTIONS, normalizePageSize } from "@/constants/pagination";

export default function RequirementsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Set page title
  usePageTitle("requirements.title");

  // Phases hook for dynamic phase management
  const { getProjectStatusName, getProjectStatusColor } = useProjectStatus();

  // Drawer state for project details
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProject, setSelectedProject] =
    useState<AssignedProject | null>(null);

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
    setSelectedProject(project);
    setIsDrawerOpen(true);
  };

  // Show global spinner only for non-assigned-projects loading states
  if (loading && !assignedProjectsLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spinner label={t("common.loading")} size="lg" />
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
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Input
                  aria-label={t("common.search")}
                  className="w-full sm:w-80"
                  placeholder={t("common.search") + "..."}
                  value={localSearch}
                  onValueChange={(val) => setLocalSearch(val)}
                />
              </div>

              {/* Page Size Selector */}
              {!assignedProjectsLoading && totalAssignedProjects > 0 && (
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

            {assignedProjectsLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center space-y-4">
                  <Spinner color="primary" size="lg" />
                  <div>
                    <p className="text-default-600">{t("common.loading")}</p>
                    <p className="text-sm text-default-500">
                      {assignedProjectsCurrentPage > 1
                        ? t("pagination.loadingPage").replace(
                            "{page}",
                            assignedProjectsCurrentPage.toString()
                          )
                        : t("common.pleaseWait")}
                    </p>
                  </div>
                </div>
              </div>
            ) : !assignedProjects || assignedProjects.length === 0 ? (
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
                                    100
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

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          color="default"
                          size="sm"
                          variant="faded"
                          onPress={() => handleViewRequirements(project)}
                        >
                          {t("requirements.viewRequirements")}
                        </Button>
                        <Button
                          className="flex-1"
                          color="default"
                          size="sm"
                          variant="solid"
                          startContent={<Info className="w-4 h-4" />}
                          onPress={() => handleViewDetails(project)}
                        >
                          {t("requirements.viewDetails")}
                        </Button>
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
      <Drawer
        isOpen={isDrawerOpen}
        placement="right"
        size="lg"
        onOpenChange={setIsDrawerOpen}
      >
        <DrawerContent>
          <DrawerHeader className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">
              {selectedProject?.applicationName}
            </h2>
            <p className="text-sm text-default-500">
              {t("requirements.projectDetails")}
            </p>
          </DrawerHeader>
          <DrawerBody>
            {selectedProject && (
              <div className="space-y-6">
                {/* Project Status */}
                <div className="flex gap-4">
                  <Chip
                    color={getStatusColor(selectedProject.status)}
                    size="sm"
                    variant="flat"
                  >
                    {getStatusText(selectedProject.status)}
                  </Chip>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {t("requirements.projectDescription")}
                  </h3>
                  <div className="bg-default-50 dark:bg-default-100/10 p-4 rounded-lg">
                    <p className="text-sm leading-relaxed">
                      {selectedProject.description ||
                        t("requirements.noDescription")}
                    </p>
                  </div>
                </div>

                {/* Project Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-default-600 mb-1">
                      {t("requirements.projectId")}
                    </h4>
                    <p className="text-sm">{selectedProject.id}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-default-600 mb-1">
                      {t("requirements.lastActivity")}
                    </h4>
                    <p className="text-sm">
                      {formatDate(selectedProject.lastActivity)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-default-600 mb-1">
                      {t("requirements.projectOwner")}
                    </h4>
                    <p className="text-sm">{selectedProject.projectOwner}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-default-600 mb-1">
                      {t("requirements.owningUnit")}
                    </h4>
                    <p className="text-sm">{selectedProject.owningUnit}</p>
                  </div>
                </div>

                {/* Requirements Statistics */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {t("requirements.requirementsCount")}
                  </h3>
                  <div className="bg-default-50 dark:bg-default-100/10 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {selectedProject.requirementsCount}
                        </div>
                        <div className="text-xs text-default-500">
                          {t("requirements.requirementsCount")}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-success">
                          {selectedProject.completedRequirements}
                        </div>
                        <div className="text-xs text-default-500">
                          {t("requirements.completedRequirements")}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 mt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-default-600">
                          {t("common.progress")}
                        </span>
                        <span className="text-default-500">
                          {selectedProject.requirementsCount > 0
                            ? Math.round(
                                (selectedProject.completedRequirements /
                                  selectedProject.requirementsCount) *
                                  100
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
                              selectedProject.requirementsCount > 0
                                ? (selectedProject.completedRequirements /
                                    selectedProject.requirementsCount) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analysts Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Users className="w-5 h-5 text-default-400" />
                    {t("requirements.analysts")}
                  </h3>
                  <div className="bg-default-50 dark:bg-default-100/10 p-4 rounded-lg">
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.analysts ? (
                        selectedProject.analysts
                          .split(", ")
                          .map((analyst, index) => (
                            <Chip
                              key={index}
                              color="secondary"
                              size="sm"
                              variant="flat"
                            >
                              {analyst}
                            </Chip>
                          ))
                      ) : (
                        <p className="text-sm text-default-500">
                          {t("requirements.noAnalysts")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Created/Updated At */}
              </div>
            )}
          </DrawerBody>
          <DrawerFooter>
            <div className="flex justify-between w-full">
              <Button
                color="primary"
                onPress={() => {
                  if (selectedProject) {
                    handleViewRequirements(selectedProject);
                  }
                  setIsDrawerOpen(false);
                }}
              >
                {t("requirements.viewRequirements")}
              </Button>
              <Button
                color="danger"
                variant="light"
                onPress={() => setIsDrawerOpen(false)}
              >
                {t("common.close")}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
