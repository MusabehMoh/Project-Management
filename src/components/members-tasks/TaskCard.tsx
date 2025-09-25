import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Badge } from "@heroui/badge";
import { CalendarDays, Clock } from "lucide-react";
import { Button } from "@heroui/button";

import { MemberTask } from "@/types/membersTasks";
import { useLanguage } from "@/contexts/LanguageContext";

interface TaskCardProps {
  task: MemberTask;
  onClick?: (task: MemberTask) => void;
  onRequestDesign?: (task: MemberTask) => void;
  onChangeStatus?: (task: MemberTask) => void;
  onChangeAssignees?: (task: MemberTask) => void;
  isTeamManager: boolean;
}

export const TaskCard = ({
  task,
  onClick,
  onRequestDesign,
  onChangeStatus,
  onChangeAssignees,
  isTeamManager,
}: TaskCardProps) => {
  const { t } = useLanguage();

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "success";
    if (progress >= 60) return "primary";
    if (progress >= 40) return "warning";

    return "danger";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleCardClick = () => {
    if (onClick) {
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

  const getBorderColor = () => {
    switch (task.status.id) {
      case 1: /// Not Started
        return "border-l-4 border-l-default-500 bg-default-50/30 dark:bg-default-900/20";
      case 2: /// In Progress
        return "border-l-4 border-l-primary-500 bg-primary-50/30 dark:bg-primary-900/20";
      case 3: /// Review
        return "border-l-4 border-l-success-500 bg-success-50/30 dark:bg-success-900/20";
      default:
        return "border-l-4 border-l-default-500 bg-default-50/30 dark:bg-default-900/20";
    }
  };

  return (
    <Card
      isPressable
      className={`min-h-[400px] cursor-pointer transition-all duration-200 hover:shadow-lg ${
        task.isOverdue
          ? "border-l-4 border-l-danger-500 bg-danger-50/30 dark:bg-danger-900/20"
          : `border-l-4 border-l-${task.status.color as any}-500 bg-${task.status.color as any}-50/30 dark:bg-${task.status.color as any}-900/20`
      }`}
      onPress={handleCardClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start w-full gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground truncate">
              {task.name}
            </h3>
            <p className="text-sm text-foreground-600 line-clamp-2 mt-1">
              {task.description}
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end flex-shrink-0">
            <Chip color={task.status.color as any} size="sm" variant="flat">
              {task.status.label}
            </Chip>
            <Chip color={task.priority.color as any} size="sm" variant="solid">
              {task.priority.label}
            </Chip>
          </div>
        </div>
      </CardHeader>

      <CardBody className="pt-0">
        {/* Department indicator */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: task.department.color }}
          />
          <span className="text-sm text-foreground-600">
            {task.department.name}
          </span>
          {task.isOverdue && (
            <Badge color="danger" size="sm" variant="flat">
              {t("overdueTask")}
            </Badge>
          )}
        </div>

        {/* Assignees Display */}
        {/* <div className="mb-4">
          <p className="text-xs text-foreground-500 mb-2 uppercase tracking-wide">
            {t("filterByAssignees")}
          </p>

          {task.primaryAssignee && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
              <Avatar
                className="flex-shrink-0"
                name={task.primaryAssignee.fullName}
                size="sm"
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-medium text-primary-700 dark:text-primary-300 truncate">
                  {task.primaryAssignee.gradeName}{" "}
                  {task.primaryAssignee.fullName}
                </span>
                <span className="text-xs text-primary-500 dark:text-primary-400">
                  {t("primaryAssignee")}
                </span>
              </div>
            </div>
          )}

          {task.assignedMembers.length > 1 && (
            <div className="flex items-center gap-2">
              <AvatarGroup
                isBordered
                className="flex-shrink-0"
                max={3}
                size="sm"
              >
                {task.assignedMembers.slice(1).map((member) => (
                  <Avatar
                    key={member.id}
                    className="text-xs"
                    name={member.fullName}
                  />
                ))}
              </AvatarGroup>
              {task.assignedMembers.length > 4 && (
                <Chip size="sm" variant="flat">
                  +{task.assignedMembers.length - 4} {t("moreAssignees")}
                </Chip>
              )}
            </div>
          )}
        </div> */}

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
                {task.startDate}
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
                {task.endDate}
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
          <div className="text-xs text-foreground-500 space-y-1">
            <div>
              <span className="font-medium">Project: </span>
              <span>{task.project.name}</span>
            </div>
            <div>
              <span className="font-medium">Requirement: </span>
              <span>{task.requirement.name}</span>
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
                onPress={() => handleChangeAssigneesClick()}
              >
                {t("changeAssignees")}
              </Button>
            </div>
          ) : (
            /* actions for members */
            <div className="flex gap-3">
              {task.canRequestDesign && (
                <Button
                  className="flex-1"
                  color="default"
                  size="sm"
                  variant="faded"
                  onPress={() => handleRequestDesignClick()}
                >
                  {t("changeAssignees")}
                </Button>
              )}

              <Button
                className="flex-1"
                color="default"
                size="sm"
                variant="solid"
                onPress={() => handleChangeStatusClick()}
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
