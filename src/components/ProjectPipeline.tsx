import React from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Spinner } from "@heroui/spinner";
import { Progress } from "@heroui/progress";
import { Button } from "@heroui/button";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePipeline } from "@/hooks/usePipeline";
import type { PipelineProject } from "@/services/api/pipelineService";

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
  const navigate = useNavigate();

  const handleViewRequirements = () => {
    navigate(`/requirements/${project.id}`);
  };

  // Calculate completion percentage
  const completionPercentage = project.requirementsCount > 0 
    ? Math.round((project.completedRequirements / project.requirementsCount) * 100) 
    : 0;

  return (
    <Card 
      className="mb-3 shadow-sm hover:shadow-md transition-shadow duration-200 border border-default-200 cursor-pointer" 
      isPressable
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
              <span className="font-medium">{t("common.owner")}:</span> {project.projectOwner}
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
              <span className="font-medium text-foreground">{completionPercentage}%</span>
            </div>
            <Progress
              size="sm"
              value={completionPercentage}
              color={completionPercentage >= 80 ? "success" : completionPercentage >= 50 ? "primary" : "warning"}
              className="w-full"
              aria-label={`Requirements completion: ${completionPercentage}%`}
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
            size="sm" 
            color={color} 
            variant="flat" 
            className={language === "ar" ? "mr-2" : "ml-2"}
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
  const { planning, inProgress, completed, loading, error } = usePipeline();

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
      {/* Pipeline stages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PipelineStage
          title={t("pipeline.planning")}
          projects={planning}
          color="primary"
          borderColor="border-t-primary"
        />
        <PipelineStage
          title={t("pipeline.inProgress")}
          projects={inProgress}
          color="warning"
          borderColor="border-t-warning"
        />
        <PipelineStage
          title={t("pipeline.completed")}
          projects={completed}
          color="success"
          borderColor="border-t-success"
        />
      </div>
    </div>
  );
};

export default ProjectPipeline;
