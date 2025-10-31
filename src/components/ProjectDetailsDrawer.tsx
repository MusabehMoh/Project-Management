import type { AssignedProject } from "@/types/projectRequirement";

import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
} from "@heroui/drawer";
import { Skeleton } from "@heroui/skeleton";
import { Users } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useProjectStatus } from "@/hooks/useProjectStatus";

interface ProjectDetailsDrawerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  project: AssignedProject | null;
  loading?: boolean;
  onViewRequirements?: (project: AssignedProject) => void;
}

export default function ProjectDetailsDrawer({
  isOpen,
  onOpenChange,
  project,
  loading = false,
  onViewRequirements,
}: ProjectDetailsDrawerProps) {
  const { t } = useLanguage();
  const { getProjectStatusName, getProjectStatusColor } = useProjectStatus();

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

  const getAnalystsData = () => {
    if (!project) return [];

    // Check if project has analystEmployees (full Employee objects from Project type)
    if (
      (project as any).analystEmployees &&
      Array.isArray((project as any).analystEmployees)
    ) {
      return (project as any).analystEmployees.map(
        (employee: any) => `${employee.gradeName} ${employee.fullName}`,
      );
    }
    // Check if project has analysts (comma-separated string from AssignedProject type)
    if (project.analysts) {
      return project.analysts.split(", ");
    }

    return [];
  };

  const analystsData = getAnalystsData();

  const handleViewRequirements = () => {
    if (project && onViewRequirements) {
      onViewRequirements(project);
      onOpenChange(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      placement="right"
      size="lg"
      onOpenChange={onOpenChange}
    >
      <DrawerContent>
        <DrawerHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">
            {loading || !project
              ? t("common.loading")
              : project.applicationName}
          </h2>
        </DrawerHeader>
        <DrawerBody>
          {loading || !project ? (
            <div className="space-y-6">
              {/* Loading skeleton for status */}
              <div className="flex gap-4">
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>

              {/* Loading skeleton for description */}
              <div>
                <Skeleton className="h-6 w-40 mb-2" />
                <div className="bg-default-50 dark:bg-default-100/10 p-4 rounded-lg">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>

              {/* Loading skeleton for project details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                </div>
              </div>

              {/* Loading skeleton for requirements stats */}
              <div>
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="flex gap-3 mb-4">
                  <Skeleton className="h-12 flex-1 rounded-lg" />
                  <Skeleton className="h-12 flex-1 rounded-lg" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>

              {/* Loading skeleton for analysts */}
              <div>
                <Skeleton className="h-6 w-32 mb-2" />
                <div className="bg-default-50 dark:bg-default-100/10 p-4 rounded-lg">
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-18 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ) : project ? (
            <div className="space-y-6">
              {/* Project Status */}
              <div className="flex gap-4 ">
                <Chip
                  color={getStatusColor(project.status)}
                  size="sm"
                  variant="flat"
                >
                  {getStatusText(project.status)}
                </Chip>
              </div>

              {/* Project Details */}
              <div className="space-y-4 pt-2 border-t border-default-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-default-600 mb-1">
                      {t("requirements.projectOwner")}
                    </h4>
                    <p className="text-sm">
                      {(project as any).projectOwnerEmployee
                        ? `${(project as any).projectOwnerEmployee.gradeName} ${(project as any).projectOwnerEmployee.fullName}`
                        : t("common.none")}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-default-600 mb-1">
                      {t("requirements.owningUnit")}
                    </h4>
                    <p className="text-sm">{project.owningUnit}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-default-200">
                  <div>
                    <h4 className="text-sm font-medium text-default-600 mb-1">
                      {t("projects.alternativeOwner")}
                    </h4>
                    <p className="text-sm">
                      {(project as any).alternativeOwnerEmployee
                        ? `${(project as any).alternativeOwnerEmployee.gradeName} ${(project as any).alternativeOwnerEmployee.fullName}`
                        : t("common.none")}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-default-600 mb-1">
                      {t("projects.responsibleManager")}
                    </h4>
                    <p className="text-sm">
                      {(project as any).responsibleUnitManagerEmployee
                        ? `${(project as any).responsibleUnitManagerEmployee.gradeName} ${(project as any).responsibleUnitManagerEmployee.fullName}`
                        : t("common.none")}
                    </p>
                  </div>
                </div>

                {/* Start and End Dates */}
                {((project as any).startDate ||
                  (project as any).expectedCompletionDate) && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-default-200">
                    {(project as any).startDate && (
                      <div>
                        <h4 className="text-sm font-medium text-default-600 mb-1">
                          {t("projects.startDate") || "Start Date"}
                        </h4>
                        <p className="text-sm">
                          {formatDate((project as any).startDate)}
                        </p>
                      </div>
                    )}
                    {(project as any).expectedCompletionDate && (
                      <div>
                        <h4 className="text-sm font-medium text-default-600 mb-1">
                          {t("projects.expectedCompletionDate") ||
                            "Expected Completion Date"}
                        </h4>
                        <p className="text-sm">
                          {formatDate((project as any).expectedCompletionDate)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Requirements Statistics */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  {t("requirements.requirementsCount")}
                </h3>

                {/* Modern Minimalist Stats - Same as Cards */}
                <div className="flex gap-3 mb-4">
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
              </div>

              {/* Analysts Section */}
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Users className="w-5 h-5 text-default-400" />
                  {t("requirements.analysts")}
                </h3>
                <div className="bg-default-50 dark:bg-default-100/10 p-4 rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    {analystsData.length > 0 ? (
                      analystsData.map((analyst: string, index: number) => (
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

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {t("requirements.projectDescription")}
                </h3>
                <div className="bg-default-50 dark:bg-default-100/10 p-4 rounded-lg">
                  <p className="text-sm leading-relaxed">
                    {project.description || t("requirements.noDescription")}
                  </p>
                </div>
              </div>

              {/* Remarks */}
              {(project as any).remarks && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {t("projects.remarks") || "Remarks"}
                  </h3>
                  <div className="bg-default-50 dark:bg-default-100/10 p-4 rounded-lg">
                    <p className="text-sm leading-relaxed">
                      {(project as any).remarks}
                    </p>
                  </div>
                </div>
              )}

              {/* Created/Updated At */}
            </div>
          ) : (
            <div className="flex justify-center items-center py-12">
              <p className="text-default-500">
                {t("requirements.noProjectData")}
              </p>
            </div>
          )}
        </DrawerBody>
        <DrawerFooter>
          <div className="flex justify-between w-full">
            {/* Only show View Requirements button if status is not "New" (status !== 1) */}
            {project && project.status !== 1 && (
              <Button color="primary" onPress={handleViewRequirements}>
                {t("requirements.viewRequirements")}
              </Button>
            )}
            <Button
              color="danger"
              variant="light"
              onPress={() => onOpenChange(false)}
            >
              {t("common.close")}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
