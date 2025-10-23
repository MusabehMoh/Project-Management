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
import { Users } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useProjectStatus } from "@/hooks/useProjectStatus";

interface ProjectDetailsDrawerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  project: AssignedProject | null;
  onViewRequirements?: (project: AssignedProject) => void;
}

export default function ProjectDetailsDrawer({
  isOpen,
  onOpenChange,
  project,
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
          <h2 className="text-xl font-semibold">{project?.applicationName}</h2>
          <p className="text-sm text-default-500">
            {t("requirements.projectDetails")}
          </p>
        </DrawerHeader>
        <DrawerBody>
          {project && (
            <div className="space-y-6">
              {/* Project Status */}
              <div className="flex gap-4">
                <Chip
                  color={getStatusColor(project.status)}
                  size="sm"
                  variant="flat"
                >
                  {getStatusText(project.status)}
                </Chip>
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

              {/* Project Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-default-600 mb-1">
                      {t("requirements.projectId")}
                    </h4>
                    <p className="text-sm">{project.id}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-default-600 mb-1">
                      {t("requirements.projectOwner")}
                    </h4>
                    <p className="text-sm">{project.projectOwner}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-default-600 mb-1">
                      {t("requirements.owningUnit")}
                    </h4>
                    <p className="text-sm">{project.owningUnit}</p>
                  </div>
                </div>

                {/* Responsible Manager Section */}
                {(project as any).responsibleUnitManagerEmployee && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <Users className="w-5 h-5 text-default-400" />
                      {t("projects.responsibleManager") || "Responsible Manager"}
                    </h3>
                    <div className="bg-default-50 dark:bg-default-100/10 p-4 rounded-lg">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          {
                            (project as any).responsibleUnitManagerEmployee
                              ?.gradeName
                          }{" "}
                          {
                            (project as any).responsibleUnitManagerEmployee
                              ?.fullName
                          }
                        </p>
                        <p className="text-xs text-default-500">
                          {(project as any).responsibleUnitManagerEmployee
                            ?.militaryNumber || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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

                {/* Additional Project Info */}
                {((project as any).priority ||
                  (project as any).budget ||
                  (project as any).progress) && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-default-200">
                    {(project as any).priority && (
                      <div>
                        <h4 className="text-sm font-medium text-default-600 mb-1">
                          {t("common.priority") || "Priority"}
                        </h4>
                        <Chip
                          color={
                            (project as any).priority === "high"
                              ? "danger"
                              : (project as any).priority === "medium"
                                ? "warning"
                                : "default"
                          }
                          size="sm"
                          variant="flat"
                        >
                          {(project as any).priority}
                        </Chip>
                      </div>
                    )}
                    {(project as any).budget && (
                      <div>
                        <h4 className="text-sm font-medium text-default-600 mb-1">
                          {t("projects.budget") || "Budget"}
                        </h4>
                        <p className="text-sm">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format((project as any).budget)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                 
                {/* Remarks */}
                {(project as any).remarks && (
                  <div className="pt-2 border-t border-default-200">
                    <h4 className="text-sm font-medium text-default-600 mb-2">
                      {t("projects.remarks") || "Remarks"}
                    </h4>
                    <div className="bg-default-50 dark:bg-default-100/10 p-3 rounded-lg">
                      <p className="text-sm leading-relaxed">
                        {(project as any).remarks}
                      </p>
                    </div>
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
                    {project.analysts ? (
                      project.analysts.split(", ").map((analyst, index) => (
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

              {/* Alternative Owner Section */}
              {(project as any).alternativeOwnerEmployee && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Users className="w-5 h-5 text-default-400" />
                    {t("projects.alternativeOwner") || "Alternative Owner"}
                  </h3>
                  <div className="bg-default-50 dark:bg-default-100/10 p-4 rounded-lg">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        {(project as any).alternativeOwnerEmployee?.gradeName}{" "}
                        {(project as any).alternativeOwnerEmployee?.fullName}
                      </p>
                      <p className="text-xs text-default-500">
                        {(project as any).alternativeOwnerEmployee
                          ?.militaryNumber || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Project Owner Employee Details */}
              {(project as any).projectOwnerEmployee && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Users className="w-5 h-5 text-default-400" />
                    {t("projects.projectOwnerDetails") ||
                      "Project Owner Details"}
                  </h3>
                  <div className="bg-default-50 dark:bg-default-100/10 p-4 rounded-lg">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        {(project as any).projectOwnerEmployee?.gradeName}{" "}
                        {(project as any).projectOwnerEmployee?.fullName}
                      </p>
                      <p className="text-xs text-default-500">
                        {(project as any).projectOwnerEmployee
                          ?.militaryNumber || "N/A"}
                      </p>
                      {(project as any).projectOwnerEmployee?.department && (
                        <p className="text-xs text-default-500">
                          {t("common.department")}:{" "}
                          {(project as any).projectOwnerEmployee?.department}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Created/Updated At */}
            </div>
          )}
        </DrawerBody>
        <DrawerFooter>
          <div className="flex justify-between w-full">
            <Button color="primary" onPress={handleViewRequirements}>
              {t("requirements.viewRequirements")}
            </Button>
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
