import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Badge } from "@heroui/badge";
import { CalendarDays, Clock, CheckCircle } from "lucide-react";
import { Button } from "@heroui/button";

import { MemberTask } from "@/types/membersTasks";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDateOnly } from "@/utils/dateFormatter";
import { getTaskTypeText, getTaskTypeColor } from "@/constants/taskTypes";

interface TaskCardProps {
  task: MemberTask;
  onClick?: (task: MemberTask) => void;
  onRequestDesign?: (task: MemberTask) => void;
  onChangeStatus?: (task: MemberTask) => void;
  onChangeAssignees?: (task: MemberTask) => void;
  isTeamManager: boolean;
  getStatusColor: (
    statusId: number,
  ) => "warning" | "danger" | "primary" | "secondary" | "success" | "default";
  getStatusText: (status: number) => string;
  getPriorityColor: (
    priorityId: number,
  ) => "warning" | "danger" | "primary" | "secondary" | "success" | "default";
  getPriorityLabel: (priority: number) => string | undefined;
}

export const TaskCard = ({
  task,
  onClick,
  onRequestDesign,
  onChangeStatus,
  onChangeAssignees,
  isTeamManager,
  getStatusColor,
  getStatusText,
  getPriorityColor,
  getPriorityLabel,
}: TaskCardProps) => {
  const { t, language } = useLanguage();

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "success";
    if (progress >= 60) return "primary";
    if (progress >= 40) return "warning";

    return "danger";
  };

  const formatDate = (dateString: string) => {
    return formatDateOnly(dateString, language);
  };

  const handleCardClick = () => {
    console.log("TaskCard clicked:", task.id, task.name);

    if (onClick) {
      // Pass the task to the parent component
      onClick(task);
    }
  };

  const handleRequestDesignClick = () => {
    if (onRequestDesign) {
      onRequestDesign(task);
    }
  };

  const handleChangeStatusClick = () => {
    if (onChangeStatus) {
      onChangeStatus(task);
    }
  };

  const handleChangeAssigneesClick = () => {
    if (onChangeAssignees) {
      onChangeAssignees(task);
    }
  };

  return (
    <Card
      isPressable
      className={`min-h-[400px] cursor-pointer transition-all duration-200 hover:shadow-lg ${
        task.isOverdue
          ? "border-l-4 border-l-danger-500 bg-danger-50/30 dark:bg-danger-900/20"
          : `border-l-4 border-l-${getStatusColor(task.statusId)}-500 bg-${getStatusColor(task.statusId)}-50/30 dark:bg-${getStatusColor(task.statusId)}-900/20`
      } ${language === "ar" ? "text-right" : ""}`}
      dir={language === "ar" ? "rtl" : "ltr"}
      onPress={handleCardClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start w-full gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground truncate">
              {task.name}
            </h3>
          </div>
          <div className="flex flex-col gap-2 items-end flex-shrink-0">
            <Chip
              color={getStatusColor(task.statusId)}
              size="sm"
              variant="flat"
            >
              {getStatusText(task.statusId)}
            </Chip>
            <div className="flex gap-1 items-center">
              <Chip
                color={getTaskTypeColor(task.typeId)}
                size="sm"
                variant="bordered"
              >
                {t(getTaskTypeText(task.typeId))}
              </Chip>
              <Chip
                color={getPriorityColor(task.priorityId)}
                size="sm"
                variant="solid"
              >
                {getPriorityLabel(task.priorityId)}
              </Chip>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardBody className="pt-0">
        {/* Department indicator */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-foreground-600">
            {task.department?.name || "Unknown Department"}
          </span>
          {task.isOverdue && (
            <Badge color="danger" size="sm" variant="flat">
              {t("overdueTask")}
            </Badge>
          )}
        </div>
        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-foreground-600">
              {t("taskProgress")}
            </span>
            <span className="text-sm font-medium text-foreground">
              {task.progress}%
            </span>
          </div>
          <Progress
            className="mb-1"
            color={getProgressColor(task.progress)}
            size="sm"
            value={task.progress}
          />
        </div>

        {/* Time tracking */}
        <div className="grid grid-cols-2 gap-6 mb-4">
          {/* Start Date */}
          <div className="flex gap-2">
            <CalendarDays className="w-4 h-4 text-foreground-500 mt-1" />
            <div className="flex flex-col justify-start min-w-0">
              <span className="text-xs text-foreground-500">
                {t("startDate")}
              </span>
              <span className="text-sm font-medium text-foreground">
                {formatDate(task.startDate)}
              </span>
            </div>
          </div>

          {/* End Date */}
          <div className="flex gap-2">
            <CalendarDays className="w-4 h-4 text-foreground-500 mt-1" />
            <div className="flex flex-col justify-start min-w-0">
              <span className="text-xs text-foreground-500">
                {t("endDate")}
              </span>
              <span className="text-sm font-medium text-foreground">
                {formatDate(task.endDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-foreground-500" />
          <p className="text-xs text-foreground-500">{t("estimatedTime")}</p>
          <p className="text-sm font-medium text-foreground">
            {task.estimatedTime}h
          </p>
        </div>

        {/* Tags */}
        {/* {task.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="w-3 h-3 text-foreground-500" />
            {task.tags.slice(0, 3).map((tag, index) => (
              <Chip key={index} size="sm" variant="flat">
                {tag}
              </Chip>
            ))}
            {task.tags.length > 3 && (
              <Chip size="sm" variant="flat">
                +{task.tags.length - 3}
              </Chip>
            )}
          </div>
        )} */}

        {/* Project & Requirement info */}
        <div className="mt-3 pt-3 border-t border-divider">
          <div
            className={`text-xs text-foreground-500 space-y-1 ${
              language === "ar" ? "text-right" : "text-left"
            }`}
          >
            <div>
              <span className="font-medium">{t("projectLabel")} </span>
              <span>{task.project?.applicationName || ""}</span>
            </div>
            <div>
              <span className="font-medium">{t("requirementLabel")} </span>
              <span>{task.requirement?.name || "Unknown Requirement"}</span>
            </div>
            <div>
              <span className="font-medium">{t("task.type")} </span>
              <span>{t(getTaskTypeText(task.typeId))}</span>
            </div>
          </div>
        </div>

        {/* buttons */}
        <div className="mt-3 pt-3 border-t border-divider flex flex-col gap-3">
          {isTeamManager ? (
            /* actions for team managers */
            <div className="flex gap-3">
              <Button
                className="flex-1"
                color="default"
                size="sm"
                variant="solid"
                onClick={(e) => {
                  e.stopPropagation();
                  handleChangeAssigneesClick();
                }}
              >
                {t("changeAssignees")}
              </Button>
            </div>
          ) : (
            /* actions for members */
            <div className="flex gap-3">
              {task.hasDesignRequest ? (
                <Chip
                  className="flex-1"
                  color="success"
                  size="sm"
                  startContent={<CheckCircle className="w-3 h-3" />}
                  variant="flat"
                >
                  {t("requestedAlready")}
                </Chip>
              ) : (
                <Button
                  className="flex-1"
                  color="default"
                  size="sm"
                  variant="faded"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRequestDesignClick();
                  }}
                >
                  {t("requestDesign")}
                </Button>
              )}

              <Button
                className="flex-1"
                color="default"
                size="sm"
                variant="solid"
                onClick={(e) => {
                  e.stopPropagation();
                  handleChangeStatusClick();
                }}
              >
                {t("changeStatus")}
              </Button>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
