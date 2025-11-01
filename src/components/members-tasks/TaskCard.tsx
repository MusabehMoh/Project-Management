import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Badge } from "@heroui/badge";
import { CalendarDays, CheckCircle } from "lucide-react";
import { Button } from "@heroui/button";
import { Switch } from "@heroui/switch";
import { Tooltip } from "@heroui/tooltip";
import { useState } from "react";

import TaskCreateModal from "./TaskCreateModal";

import { MemberTask } from "@/types/membersTasks";
import { MemberSearchResult } from "@/types/timeline";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDateOnly } from "@/utils/dateFormatter";
import {
  getTaskTypeText,
  getTaskTypeColor,
  TASK_TYPES,
} from "@/constants/taskTypes";
import { TASK_STATUSES } from "@/constants/taskStatuses";
import { tasksService } from "@/services/api";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { RoleIds } from "@/constants/roles";

interface TaskCardProps {
  task: MemberTask;
  onClick?: (task: MemberTask) => void;
  onRequestDesign?: (task: MemberTask) => void;
  onChangeStatus?: (task: MemberTask) => void;
  onChangeAssignees?: (task: MemberTask) => void;
  onTaskComplete?: () => void; // Callback to refresh tasks after completion
  onCreateTask?: (parentTask: MemberTask) => void; // Callback to create a new task based on parent task
  onTaskCreated?: () => void; // Callback to refresh tasks after task creation
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
  onTaskComplete,
  onCreateTask: _onCreateTask,
  onTaskCreated,
  isTeamManager,
  getStatusColor,
  getStatusText,
  getPriorityColor,
  getPriorityLabel,
}: TaskCardProps) => {
  const { t, language } = useLanguage();
  const { user } = useCurrentUser();
  const [isHovered, setIsHovered] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const isQcManager =
    user?.roles?.some((role) => role.id === RoleIds.QUALITY_CONTROL_MANAGER) ??
    false;

  const isAdhoc = task.typeId === TASK_TYPES.ADHOC;
  const canComplete = isAdhoc && task.statusId !== TASK_STATUSES.COMPLETED; // Only if not already completed

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

  const handleCreateTaskClick = () => {
    setIsCreateModalOpen(true);
  };

  const handleCompleteAdhocTask = async () => {
    setIsCompleting(true);

    try {
      // Move task to completed status (5) with 100% progress
      const response = await tasksService.updateTaskStatus(
        parseInt(task.id),
        TASK_STATUSES.COMPLETED, // Completed status
        `Adhoc task completed via quick action`,
        100, // Set progress to 100%
      );

      if (response.success) {
        showSuccessToast(t("teamDashboard.kanban.taskCompleted"));

        // Notify parent to refresh tasks
        if (onTaskComplete) {
          onTaskComplete();
        }
      }
    } catch {
      showErrorToast(t("teamDashboard.kanban.taskCompleteFailed"));
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Card
      isPressable
      className={`min-h-[400px] cursor-pointer transition-all duration-500 ease-in-out bg-content1 overflow-hidden ${
        isAdhoc && isHovered
          ? "shadow-2xl border-2 border-success ring-2 ring-success/20"
          : "hover:shadow-lg border-2 border-transparent"
      } ${
        task.isOverdue
          ? "border-l-4 border-l-danger-500"
          : `border-l-4 border-l-${getStatusColor(task.statusId)}-500`
      } ${language === "ar" ? "text-right" : ""}`}
      dir={language === "ar" ? "rtl" : "ltr"}
      onMouseEnter={() => isAdhoc && setIsHovered(true)}
      onMouseLeave={() => isAdhoc && setIsHovered(false)}
      onPress={handleCardClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start w-full gap-3">
          <div className="flex-1 min-w-0">
            <h3
              className={`text-lg font-semibold text-foreground line-clamp-2 break-words ${language === "ar" ? "text-right" : "text-left"}`}
            >
              {task.name}
            </h3>
          </div>
          <div className="flex flex-col gap-2 items-end flex-shrink-0">
            <div className="flex gap-2 items-center">
              <Chip
                color={getStatusColor(task.statusId)}
                size="sm"
                variant="flat"
              >
                {getStatusText(task.statusId)}
              </Chip>
              {isAdhoc && canComplete && isHovered && (
                <Tooltip content={t("teamDashboard.kanban.markComplete")}>
                  <div
                    className="flex-shrink-0"
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation(); // Prevent card click
                      }
                    }}
                  >
                    <Switch
                      color="success"
                      isDisabled={isCompleting}
                      size="sm"
                      thumbIcon={({ isSelected, className }) =>
                        isSelected ? (
                          <CheckCircle className={className} />
                        ) : null
                      }
                      onValueChange={(isChecked) => {
                        if (isChecked) {
                          handleCompleteAdhocTask();
                        }
                      }}
                    />
                  </div>
                </Tooltip>
              )}
            </div>
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

      <CardBody className="pt-0 overflow-hidden">
        {/* Department indicator */}
        <div className="flex items-center gap-2 mb-3 overflow-hidden">
          <span className="text-sm text-foreground-600 truncate">
            {task.department?.name || ""}
          </span>
          {task.isOverdue && (
            <Badge
              className="flex-shrink-0"
              color="danger"
              size="sm"
              variant="flat"
            >
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
        <div
          className={`grid grid-cols-2 gap-6 mb-4 ${language === "ar" ? " text-right" : ""}`}
        >
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

        {/* Assignees */}
        {task.assignedMembers && task.assignedMembers.length > 0 && (
          <div className="space-y-2">
            <h4
              className={`text-xs font-medium text-default-600 ${language === "ar" ? "text-right" : "text-left"}`}
            >
              {t("timeline.assignedMembers")}
            </h4>
            <div className="flex flex-wrap gap-1">
              {task.assignedMembers
                .slice(0, 2)
                .map((assignee: MemberSearchResult, index: number) => (
                  <Tooltip
                    key={index}
                    content={`${assignee.gradeName} ${assignee.fullName}`}
                  >
                    <Chip
                      className="max-w-[140px]"
                      color="primary"
                      size="sm"
                      variant="flat"
                    >
                      <span className="block truncate">
                        {`${assignee.gradeName} ${assignee.fullName}`}
                      </span>
                    </Chip>
                  </Tooltip>
                ))}
              {task.assignedMembers.length > 2 && (
                <Chip size="sm" variant="flat">
                  +{task.assignedMembers.length - 2}
                </Chip>
              )}
            </div>
          </div>
        )}

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
        <div className="mt-3 pt-3 border-t border-divider overflow-hidden">
          <div
            className={`text-xs text-foreground-500 space-y-1 overflow-hidden ${
              language === "ar" ? "text-right" : "text-left"
            }`}
          >
            <div className="overflow-hidden">
              <span className="font-medium">{t("projectLabel")} </span>
              <span className="break-words">
                {task.project?.applicationName ||
                  t("tasks.noAssociatedProject")}
              </span>
            </div>
            <div className="overflow-hidden">
              <span className="font-medium">{t("requirementLabel")} </span>
              <span className="break-words">
                {task.requirement?.name || t("common.none")}
              </span>
            </div>
            <div className="overflow-hidden">
              <span className="font-medium">{t("task.type")} </span>
              <span className="break-words">
                {t(getTaskTypeText(task.typeId))}
              </span>
            </div>
          </div>
        </div>

        {/* buttons */}
        <div className="mt-3 pt-3 border-t border-divider">
          <div className="flex flex-col gap-2">
            {task.completedFromDeveloper && (
              <div
                className={`flex items-center ${language === "ar" ? "justify-start" : "justify-start"}`}
              >
                <Chip
                  color="primary"
                  size="sm"
                  startContent={<CheckCircle className="w-3 h-3" />}
                  variant="flat"
                >
                  {t("completedByDeveloper")}
                </Chip>
              </div>
            )}
            {isTeamManager ? (
              /* actions for team managers */
              <div className="flex gap-2">
                {task.hasNoDependentTasks && isQcManager ? (
                  <Tooltip content={t("task.createTaskHint")}>
                    <Button
                      className="flex-1"
                      color="primary"
                      size="sm"
                      variant="solid"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateTaskClick();
                      }}
                    >
                      {t("task.createTask")}
                    </Button>
                  </Tooltip>
                ) : (
                  <Button
                    className="flex-1"
                    color="default"
                    isDisabled={
                      task.statusId === TASK_STATUSES.BLOCKED ||
                      task.statusId === TASK_STATUSES.COMPLETED
                    }
                    size="sm"
                    variant="solid"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChangeAssigneesClick();
                    }}
                  >
                    {t("changeAssignees")}
                  </Button>
                )}
              </div>
            ) : (
              /* actions for members */
              <div className="flex gap-2">
                {task.hasDesignRequest ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Chip
                      color="success"
                      size="sm"
                      startContent={<CheckCircle className="w-3 h-3" />}
                      variant="flat"
                    >
                      {t("requestedAlready")}
                    </Chip>
                  </div>
                ) : task.roleType?.toLowerCase() === "developer" ? (
                  <Button
                    className="flex-1"
                    color="default"
                    isDisabled={
                      task.statusId === TASK_STATUSES.BLOCKED ||
                      task.statusId === TASK_STATUSES.COMPLETED
                    }
                    size="sm"
                    variant="faded"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRequestDesignClick();
                    }}
                  >
                    {t("requestDesign")}
                  </Button>
                ) : (
                  <div className="flex-1" />
                )}

                <Button
                  className="flex-1"
                  color="default"
                  isDisabled={
                    task.statusId === TASK_STATUSES.BLOCKED ||
                    task.statusId === TASK_STATUSES.COMPLETED
                  }
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
        </div>
      </CardBody>

      <TaskCreateModal
        isOpen={isCreateModalOpen}
        parentTask={task}
        onOpenChange={setIsCreateModalOpen}
        onTaskCreated={onTaskCreated}
      />
    </Card>
  );
};
