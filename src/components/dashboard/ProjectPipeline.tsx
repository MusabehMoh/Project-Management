import type { PipelineProject } from "@/services/api/pipelineService";

import React from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Skeleton } from "@heroui/skeleton";
import { Progress } from "@heroui/progress";
import { useNavigate } from "react-router-dom";

import { useLanguage } from "@/contexts/LanguageContext";
import ErrorWithRetry from "@/components/ErrorWithRetry";
import { usePipeline } from "@/hooks/usePipeline";

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Project card component
const ProjectCard: React.FC<{ project: PipelineProject }> = ({ project }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleViewRequirements = () => {
    navigate(`/requirements/${project.id}`);
  };

  // Calculate completion percentage
  const completionPercentage =
    project.requirementsCount > 0
      ? Math.round(
          (project.completedRequirements / project.requirementsCount) * 100,
        )
      : 0;

  return (
    <Card
      isPressable
      className="mb-3 shadow-sm hover:shadow-md transition-shadow duration-200 border border-default-200 cursor-pointer"
      onPress={handleViewRequirements}
    >
      <CardBody className="p-4">
        <div className="space-y-3">
          {/* Header with title */}
          <div className="flex justify-between items-start gap-2">
            <h4 className="font-semibold text-sm text-foreground leading-tight flex-1">
              {project.applicationName}
            </h4>
          </div>

          {/* Project owner and unit */}
          <div className="space-y-1">
            <p className="text-xs text-default-600 truncate">
              <span className="font-medium">{t("common.owner")}:</span>{" "}
              {project.projectOwner}
            </p>
            <p className="text-xs text-default-500 truncate">
              {project.owningUnit}
            </p>
          </div>

          {/* Requirements Info */}
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">
                {project.requirementsCount || 0}
              </div>
              <div className="text-xs text-default-500">
                {t("requirements.requirementsCount")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-success">
                {project.completedRequirements || 0}
              </div>
              <div className="text-xs text-default-500">
                {t("requirements.completedRequirements")}
              </div>
            </div>
          </div>

          {/* Requirements progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-default-600">{t("common.progress")}</span>
              <span className="font-medium text-foreground">
                {completionPercentage}%
              </span>
            </div>
            <Progress
              aria-label={`Requirements completion: ${completionPercentage}%`}
              className="w-full"
              color={
                completionPercentage >= 80
                  ? "success"
                  : completionPercentage >= 50
                    ? "primary"
                    : "warning"
              }
              size="sm"
              value={completionPercentage}
            />
          </div>

          {/* Last activity and action */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-default-500">
              {t("common.lastActivity")}: {formatDate(project.lastActivity)}
            </span>
            <span className="text-primary font-medium">
              {t("requirements.viewRequirements")}
            </span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

// Pipeline stage component
const PipelineStage: React.FC<{
  title: string;
  projects: PipelineProject[];
  color: "primary" | "warning" | "success";
  borderColor: string;
}> = ({ title, projects, color, borderColor }) => {
  const { t, language } = useLanguage();

  return (
    <Card className={`border-t-4 ${borderColor} h-full`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between w-full">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <Chip
            className={language === "ar" ? "mr-2" : "ml-2"}
            color={color}
            size="sm"
            variant="flat"
          >
            {projects.length}
          </Chip>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="p-3 h-80">
        <ScrollShadow hideScrollBar className="h-full">
          {projects.length > 0 ? (
            <div className="space-y-2">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-default-400">
                {t("pipeline.noProjects")}
              </p>
            </div>
          )}
        </ScrollShadow>
      </CardBody>
    </Card>
  );
};

// Main pipeline component
const ProjectPipeline: React.FC = () => {
  const { t } = useLanguage();
  const { planning, inProgress, completed, loading, error, refetch } = usePipeline();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pipeline columns skeleton */}
        {[...Array(3)].map((_, colIndex) => (
          <div key={colIndex} className="space-y-4">
            {/* Column header */}
            <div className="space-y-2">
              <Skeleton className="h-6 w-24 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>

            {/* Project cards */}
            <div className="space-y-3">
              {[...Array(4)].map((_, cardIndex) => (
                <div
                  key={cardIndex}
                  className="p-4 border border-default-200 rounded-lg space-y-3"
                >
                  <Skeleton className="h-5 w-full rounded" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-4 w-20 rounded" />
                  </div>
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-16 rounded" />
                    <Skeleton className="h-6 w-12 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorWithRetry
        error={error}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Pipeline stages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PipelineStage
          borderColor="border-t-primary"
          color="primary"
          projects={planning}
          title={t("pipeline.planning")}
        />
        <PipelineStage
          borderColor="border-t-warning"
          color="warning"
          projects={inProgress}
          title={t("pipeline.inProgress")}
        />
        <PipelineStage
          borderColor="border-t-success"
          color="success"
          projects={completed}
          title={t("pipeline.completed")}
        />
      </div>
    </div>
  );
};

export default ProjectPipeline;
