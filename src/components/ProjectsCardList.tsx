import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";
import { Avatar, AvatarGroup } from "@heroui/avatar";
import { Tooltip } from "@heroui/tooltip";
import { Progress } from "@heroui/progress";
import { Calendar, FileText, ListTodo } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useProjectStatus } from "@/hooks/useProjectStatus";
import { formatDateOnly } from "@/utils/dateFormatter";

interface ProjectCardData {
  id: number;
  name: string;
  statusId: number;
  statusName: string;
  startDate: string;
  expectedEndDate: string;
  daysRemaining?: number;
  teamMembers?: Array<{
    id: number;
    fullName: string;
    gradeName: string;
    avatar?: string;
  }>;
  budget?: number;
  progress?: number;
  timelineCount?: number;
  taskCount?: number;
}

interface ProjectsCardListProps {
  projects: ProjectCardData[];
  loading?: boolean;
  onProjectClick?: (project: ProjectCardData) => void;
}

export default function ProjectsCardList({
  projects,
  loading = false,
  onProjectClick,
}: ProjectsCardListProps) {
  const { t, language } = useLanguage();
  const { getProjectStatusName, getProjectStatusColor } = useProjectStatus();

  const getStatusColor = (
    statusId: number,
  ): "default" | "primary" | "success" | "warning" | "danger" => {
    // Use the hook's color function which matches the projects page
    return getProjectStatusColor(statusId) as
      | "default"
      | "primary"
      | "success"
      | "warning"
      | "danger";
  };

  const getStatusIcon = (statusId: number) => {
    switch (statusId) {
      case 1: // Under Study
        return "○";
      case 2: // Delayed
        return "⏸";
      case 3: // Under Review
        return "◐";
      case 4: // Under Development
        return "◐";
      case 5: // Production
        return "✓";
      default:
        return "○";
    }
  };

  const calculateDaysRemaining = (endDate: string): number => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="border border-default-200">
            <CardBody className="p-4">
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-8 w-20 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-lg" />
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-default-500 text-lg">
          {t("timeline.noProjectsAvailable")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => {
        const daysRemaining = calculateDaysRemaining(project.expectedEndDate);
        const statusColor = getStatusColor(project.statusId);

        return (
          <Card
            key={project.id}
            isPressable
            className="border border-default-200 transition-all duration-200 hover:shadow-lg"
            onPress={() => onProjectClick?.(project)}
          >
            <CardBody className="p-4">
              <div className="space-y-3">
                {/* Header: Project Name & Status */}
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-default-900 line-clamp-1 flex-1 text-right" dir="rtl">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Chip
                      color={statusColor}
                      size="sm"
                      startContent={
                        <span className="text-xs">
                          {getStatusIcon(project.statusId)}
                        </span>
                      }
                      variant="flat"
                    >
                      {getProjectStatusName(project.statusId)}
                    </Chip>
                  </div>
                </div>
                
                {/* Days Remaining */}
                {daysRemaining >= 0 && project.statusId !== 3 && (
                  <div className="flex justify-end">
                    <span className="text-xs text-default-500">
                      {daysRemaining}{" "}
                      {language === "ar" ? "يوم متبقي" : "Days Remaining"}
                    </span>
                  </div>
                )}

                {/* Progress Bar */}
                {project.progress !== undefined && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-default-600 font-medium">
                        {language === "ar" ? "التقدم" : "Progress"}
                      </span>
                      <span className="font-semibold text-default-700">
                        {project.progress}%
                      </span>
                    </div>
                    <Progress
                      value={project.progress}
                      color={
                        project.progress === 0
                          ? "default"
                          : project.progress >= 70
                            ? "success"
                            : project.progress >= 40
                              ? "warning"
                              : "danger"
                      }
                      size="sm"
                      className="w-full"
                    />
                  </div>
                )}

                {/* Timeline and Task Counts */}
                <div className="flex items-center gap-4 text-sm">
                  {project.timelineCount !== undefined && (
                    <div className="flex items-center gap-1.5 text-default-600">
                      <FileText className="w-4 h-4" />
                      <span className="font-medium">
                        {project.timelineCount}
                      </span>
                      <span className="text-xs">
                        {language === "ar" ? "جدول زمني" : "Timelines"}
                      </span>
                    </div>
                  )}
                  {project.taskCount !== undefined && (
                    <div className="flex items-center gap-1.5 text-default-600">
                      <ListTodo className="w-4 h-4" />
                      <span className="font-medium">
                        {project.taskCount}
                      </span>
                      <span className="text-xs">
                        {language === "ar" ? "مهام" : "Tasks"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Dates Section */}
                <div className="space-y-2 bg-default-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-default-400" />
                    <span className="text-default-600 font-medium">
                      {t("timeline.startDate")}:
                    </span>
                    <span className="text-default-700">
                      {formatDateOnly(project.startDate, language)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-default-400" />
                    <span className="text-default-600 font-medium">
                      {t("timeline.expectedEndDate")}:
                    </span>
                    <span className="text-default-700">
                      {formatDateOnly(project.expectedEndDate, language)}
                    </span>
                  </div>
                </div>

                {/* Footer: Team & Budget */}
                <div className="flex items-center justify-between pt-2 border-t border-default-200">
                  {project.teamMembers && project.teamMembers.length > 0 ? (
                    <AvatarGroup isBordered max={3} size="sm">
                      {project.teamMembers.map((member) => (
                        <Tooltip
                          key={member.id}
                          content={
                            <div className="px-1 py-2">
                              <div className="text-sm font-semibold">
                                {member.fullName}
                              </div>
                              <div className="text-xs text-default-500">
                                {member.gradeName}
                              </div>
                            </div>
                          }
                        >
                          <Avatar
                            name={member.fullName}
                            src={member.avatar}
                          />
                        </Tooltip>
                      ))}
                    </AvatarGroup>
                  ) : (
                    <div className="w-8" />
                  )}

                  {project.budget && (
                    <div className="text-right">
                      <p className="text-lg font-semibold text-default-900">
                        ${project.budget.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
