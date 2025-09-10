import React from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Spinner } from "@heroui/spinner";
import { Progress } from "@heroui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePipeline } from "@/hooks/usePipeline";
import type { PipelineProject } from "@/services/api/pipelineService";

// Helper function to get priority color
const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case "high":
    case "critical":
      return "danger";
    case "medium":
      return "warning";
    case "low":
      return "success";
    default:
      return "default";
  }
};

// Helper function to get progress color
const getProgressColor = (progress: number) => {
  if (progress >= 80) return "success";
  if (progress >= 50) return "primary";
  if (progress >= 25) return "warning";
  return "danger";
};

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'short',
    year: 'numeric'
  });
};

// Project card component
const ProjectCard: React.FC<{ project: PipelineProject }> = ({ project }) => {
  const { t } = useLanguage();

  return (
    <Card className="mb-3 shadow-sm hover:shadow-md transition-shadow duration-200 border border-default-200">
      <CardBody className="p-4">
        <div className="space-y-3">
          {/* Header with title and priority */}
          <div className="flex justify-between items-start gap-2">
            <h4 className="font-semibold text-sm text-foreground leading-tight flex-1">
              {project.applicationName}
            </h4>
            <Chip
              size="sm"
              variant="flat"
              color={getPriorityColor(project.priority)}
              className="shrink-0"
            >
              {project.priority}
            </Chip>
          </div>

          {/* Project owner */}
          <p className="text-xs text-default-600 truncate">
            <span className="font-medium">{t("common.owner")}:</span> {project.projectOwner}
          </p>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-default-600">{t("common.progress")}</span>
              <span className="font-medium text-foreground">{project.progress}%</span>
            </div>
            <Progress
              size="sm"
              value={project.progress}
              color={getProgressColor(project.progress)}
              className="w-full"
              aria-label={`Progress: ${project.progress}%`}
            />
          </div>

          {/* Due date and budget */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-default-500">
              {t("common.due")}: {formatDate(project.expectedCompletionDate)}
            </span>
            <span className="font-medium text-primary">
              ${project.budget.toLocaleString()}
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
  count: number;
  projects: PipelineProject[];
  color: "primary" | "warning" | "success";
  borderColor: string;
}> = ({ title, count, projects, color, borderColor }) => {
  const { t, language } = useLanguage();

  return (
    <Card className={`border-t-4 ${borderColor} h-full`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between w-full">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <Chip 
            size="sm" 
            color={color} 
            variant="flat" 
            className={language === "ar" ? "mr-2" : "ml-2"}
          >
            {count}
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
              <p className="text-sm text-default-400">{t("pipeline.noProjects")}</p>
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
  const { planning, inProgress, completed, stats, loading, error } = usePipeline();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-danger mb-4">{error}</p>
        <p className="text-sm text-default-500">{t("common.tryAgainLater")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pipeline overview stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="bg-primary-50 border border-primary-200">
          <CardBody className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.planning}</div>
            <div className="text-sm text-primary-600">{t("pipeline.planning")}</div>
          </CardBody>
        </Card>
        <Card className="bg-warning-50 border border-warning-200">
          <CardBody className="p-4 text-center">
            <div className="text-2xl font-bold text-warning">{stats.inProgress}</div>
            <div className="text-sm text-warning-600">{t("pipeline.inProgress")}</div>
          </CardBody>
        </Card>
        <Card className="bg-success-50 border border-success-200">
          <CardBody className="p-4 text-center">
            <div className="text-2xl font-bold text-success">{stats.completed}</div>
            <div className="text-sm text-success-600">{t("pipeline.completed")}</div>
          </CardBody>
        </Card>
      </div>

      {/* Pipeline stages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PipelineStage
          title={t("pipeline.planning")}
          count={stats.planning}
          projects={planning}
          color="primary"
          borderColor="border-t-primary"
        />
        <PipelineStage
          title={t("pipeline.inProgress")}
          count={stats.inProgress}
          projects={inProgress}
          color="warning"
          borderColor="border-t-warning"
        />
        <PipelineStage
          title={t("pipeline.completed")}
          count={stats.completed}
          projects={completed}
          color="success"
          borderColor="border-t-success"
        />
      </div>
    </div>
  );
};

export default ProjectPipeline;
