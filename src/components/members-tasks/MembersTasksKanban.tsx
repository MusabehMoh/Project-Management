import type { MemberTask } from "@/types/membersTasks";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Skeleton } from "@heroui/skeleton";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Tooltip } from "@heroui/tooltip";
import { Switch } from "@heroui/switch";
import {
  ListTodo,
  PlayCircle,
  Eye,
  RotateCcw,
  CheckCircle,
  Flag,
  Calendar as CalendarIcon,
  Lock,
  AlertTriangle,
  Maximize2,
  Minimize2,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useTaskStatusLookups } from "@/hooks/useTaskLookups";
import { usePriorityLookups } from "@/hooks/usePriorityLookups";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { tasksService } from "@/services/api";
import ErrorWithRetry from "@/components/ErrorWithRetry";
import {
  getKanbanConfigForRoles,
  getColumnAccessibility,
  ColumnRestrictionReason,
} from "@/utils/kanbanRoleConfig";
import {
  getTaskTypeText,
  getTaskTypeColor,
  TASK_TYPES,
} from "@/constants/taskTypes";
import { showSuccessToast, showErrorToast } from "@/utils/toast";

interface KanbanColumn {
  id: number;
  title: string;
  titleAr: string;
  icon: React.ReactNode;
  color: string;
  tasks: MemberTask[];
}

interface MembersTasksKanbanProps {
  tasks: MemberTask[];
  loading?: boolean;
  onTaskUpdate?: () => void;
  onTaskClick?: (task: MemberTask) => void;
}

export default function MembersTasksKanban({
  tasks,
  loading = false,
  onTaskUpdate,
  onTaskClick,
}: MembersTasksKanbanProps) {
  const { t, language } = useLanguage();
  const { user } = useCurrentUser();
  const {
    taskStatuses,
    loading: statusesLoading,
    getStatusLabel,
    getStatusColor,
  } = useTaskStatusLookups();
  const { getPriorityLabel, getPriorityColor } = usePriorityLookups();
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [draggedTask, setDraggedTask] = useState<MemberTask | null>(null);
  const [draggedFromColumn, setDraggedFromColumn] = useState<number | null>(
    null,
  );
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(
    new Set(),
  );
  const [dragStartPos, setDragStartPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  // Refs to preserve scroll positions
  const scrollRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const scrollPositions = useRef<Map<number, number>>(new Map());

  // Save scroll positions before update
  const saveScrollPositions = () => {
    scrollRefs.current.forEach((element, columnId) => {
      if (element) {
        scrollPositions.current.set(columnId, element.scrollTop);
      }
    });
  };

  // Restore scroll positions after update
  const restoreScrollPositions = () => {
    requestAnimationFrame(() => {
      scrollPositions.current.forEach((scrollTop, columnId) => {
        const element = scrollRefs.current.get(columnId);

        if (element) {
          element.scrollTop = scrollTop;
        }
      });
    });
  };

  // Get user's role IDs for permission checking
  const userRoleIds = useMemo(() => {
    return user?.roles?.map((role) => role.id) || [];
  }, [user]);

  // Get Kanban configuration based on user's roles
  const kanbanConfig = useMemo(() => {
    return getKanbanConfigForRoles(userRoleIds);
  }, [userRoleIds]);

  // Get translated restriction reason
  const getRestrictionReason = (
    reasonCode?: ColumnRestrictionReason,
  ): string => {
    if (!reasonCode) return t("teamDashboard.kanban.restricted");

    switch (reasonCode) {
      case ColumnRestrictionReason.NOT_ACCESSIBLE:
        return t("teamDashboard.kanban.notAccessible");
      case ColumnRestrictionReason.CANNOT_MODIFY:
        return t("teamDashboard.kanban.cannotModify");
      case ColumnRestrictionReason.CANNOT_DRAG_FROM:
        return t("teamDashboard.kanban.cannotDragFrom");
      case ColumnRestrictionReason.CANNOT_DROP_TO:
        return t("teamDashboard.kanban.cannotDropTo");
      default:
        return t("teamDashboard.kanban.restricted");
    }
  };

  // Status icons mapping
  const statusIcons: Record<number, React.ReactNode> = {
    1: <ListTodo className="w-4 h-4" />,
    2: <PlayCircle className="w-4 h-4" />,
    3: <Eye className="w-4 h-4" />,
    4: <RotateCcw className="w-4 h-4" />,
    5: <CheckCircle className="w-4 h-4" />,
  };

  // Status colors mapping to HeroUI color variants
  const statusColors: Record<number, string> = {
    1: "default", // To Do
    2: "primary", // In Progress
    3: "warning", // In Review
    4: "danger", // Rework
    5: "success", // Completed
  };

  // Initialize columns using lookup service
  const initializeColumns = (tasksList: MemberTask[]): KanbanColumn[] => {
    // Filter to only show statuses 1-5
    const relevantStatuses = taskStatuses.filter(
      (status) => status.value >= 1 && status.value <= 5,
    );

    return relevantStatuses.map((status) => ({
      id: status.value,
      title: status.name,
      titleAr: status.nameAr,
      icon: statusIcons[status.value],
      color: statusColors[status.value] || "default",
      tasks: tasksList.filter((t) => t.statusId === status.value),
    }));
  };

  // Update columns when tasks prop changes
  useEffect(() => {
    if (!statusesLoading && taskStatuses.length > 0 && tasks) {
      // Don't update columns if we're in the middle of dragging or updating
      // This prevents scroll reset during active operations
      if (draggedTask || updatingTaskId || completingTaskId) {
        return;
      }

      // Don't update if we just performed an API update (prevent scroll reset)
      // Give 500ms for the parent to refetch and provide updated data

      let tasksToDisplay = tasks;

      // Filter tasks for Analyst role: Only show adhoc tasks (typeId = 3)
      const isAnalyst = userRoleIds.includes(3); // RoleIds.ANALYST = 3
      const isOnlyAnalyst = userRoleIds.length === 1 && isAnalyst;

      if (isAnalyst && isOnlyAnalyst) {
        tasksToDisplay = tasksToDisplay.filter(
          (task) => task.typeId === TASK_TYPES.ADHOC,
        );
      }

      const allColumns = initializeColumns(tasksToDisplay);

      // Preserve scroll position before refreshing columns
      saveScrollPositions();
      setColumns(allColumns);

      // Reset completed task IDs when new tasks are loaded
      setCompletedTaskIds(new Set());

      setTimeout(() => {
        restoreScrollPositions();
      }, 30);
    }
  }, [tasks, statusesLoading, taskStatuses, userRoleIds]);

  // Drag and drop handlers with role-based permissions
  const handleDragStart = (task: MemberTask, columnId: number) => {
    // Check if user can drag from this status
    if (!kanbanConfig.canDragFrom(columnId)) {
      console.warn(
        `User does not have permission to drag from status ${columnId}`,
      );

      return;
    }

    setDraggedTask(task);
    setDraggedFromColumn(columnId);
  };

  const handleMouseDown = (
    e: React.MouseEvent,
    task: MemberTask,
    columnId: number,
  ) => {
    // Store the position where drag started
    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleCardClick = (e: React.MouseEvent, task: MemberTask) => {
    // Prevent default to stop any default click behavior
    e.preventDefault();
    e.stopPropagation();

    console.log("handleCardClick called for task:", task.id, task.name);
    console.log("dragStartPos:", dragStartPos);
    console.log("onTaskClick exists:", !!onTaskClick);

    // Always trigger click if onTaskClick is available
    if (onTaskClick) {
      console.log("Triggering onTaskClick for task:", task.name);
      onTaskClick(task);
    } else {
      console.log("onTaskClick not available");
    }
  };

  const handleDragOver = (e: React.DragEvent, targetColumnId: number) => {
    // Only allow drag over if transition is permitted
    if (
      draggedFromColumn !== null &&
      kanbanConfig.canDropTo(targetColumnId, draggedFromColumn)
    ) {
      e.preventDefault();
    }
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: number) => {
    e.preventDefault();

    if (
      !draggedTask ||
      draggedFromColumn === null ||
      draggedFromColumn === targetColumnId
    ) {
      setDraggedTask(null);
      setDraggedFromColumn(null);

      return;
    }

    // Check if user can drop to this status
    if (!kanbanConfig.canDropTo(targetColumnId, draggedFromColumn)) {
      console.warn(
        `User does not have permission to move task from status ${draggedFromColumn} to ${targetColumnId}`,
      );
      setDraggedTask(null);
      setDraggedFromColumn(null);

      return;
    }

    // Calculate progress based on target status
    let updatedProgress: number;

    // Set progress based on the target status
    if (targetColumnId === 1) {
      updatedProgress = 0; // To Do
    } else if (targetColumnId === 2) {
      updatedProgress = 25; // In Progress
    } else if (targetColumnId === 3) {
      updatedProgress = 75; // In Review
    } else if (targetColumnId === 4) {
      updatedProgress = 50; // Rework
    } else if (targetColumnId === 5) {
      updatedProgress = 100; // Completed
    } else {
      updatedProgress = draggedTask.progress ?? 0;
    }

    // Proceed with status update
    await performStatusUpdate(
      draggedTask,
      targetColumnId,
      updatedProgress,
      draggedFromColumn,
    );
  };

  const performStatusUpdate = async (
    task: MemberTask,
    newStatusId: number,
    progress: number,
    fromStatusId: number,
  ) => {
    try {
      setUpdatingTaskId(task.id);

      // Get status names for comment
      const fromStatusLabel = getStatusLabel(fromStatusId.toString());
      const toStatusLabel = getStatusLabel(newStatusId.toString());

      const comment = `${t("teamDashboard.kanban.statusChangedFrom")} ${fromStatusLabel} ${t("teamDashboard.kanban.to")} ${toStatusLabel} ${t("teamDashboard.kanban.viaKanban")}`;

      // Optimistic update
      setColumns((prevColumns) =>
        prevColumns.map((col) => {
          if (col.id === fromStatusId) {
            return {
              ...col,
              tasks: col.tasks.filter((t) => t.id !== task.id),
            };
          } else if (col.id === newStatusId) {
            return {
              ...col,
              tasks: [
                ...col.tasks,
                { ...task, statusId: newStatusId, progress },
              ],
            };
          }

          return col;
        }),
      );

      // Call API to update status with audit trail
      await tasksService.updateTaskStatus(
        parseInt(task.id),
        newStatusId,
        comment,
        progress,
      );

      showSuccessToast(t("teamDashboard.kanban.taskStatusUpdated"));

      // Update parent data immediately but track time to prevent useEffect from resetting UI
      if (onTaskUpdate) {
        onTaskUpdate();
      }
    } catch (error) {
      console.error("Failed to update task status:", error);
      showErrorToast(t("teamDashboard.kanban.errorUpdatingStatus"));

      // Revert optimistic update on error
      setColumns((prevColumns) =>
        prevColumns.map((col) => {
          if (col.id === newStatusId) {
            return {
              ...col,
              tasks: col.tasks.filter((t) => t.id !== task.id),
            };
          } else if (col.id === fromStatusId) {
            return {
              ...col,
              tasks: [...col.tasks, task],
            };
          }

          return col;
        }),
      );
    } finally {
      setUpdatingTaskId(null);
      setDraggedTask(null);
      setDraggedFromColumn(null);
    }
  };

  // Handle adhoc task quick completion via switch
  const handleQuickComplete = async (task: MemberTask, columnId: number) => {
    if (completingTaskId === task.id) return; // Prevent double-clicking

    try {
      setCompletingTaskId(task.id);

      // First, show the switch toggle animation
      setCompletedTaskIds((prev) => new Set(prev).add(task.id));

      // Wait 300ms to show the toggle animation before moving the card
      await new Promise((resolve) => setTimeout(resolve, 300));

      const comment = `${t("teamDashboard.kanban.markComplete")}`;

      // Optimistic update - move card to completed column
      setColumns((prevColumns) =>
        prevColumns.map((col) => {
          if (col.id === columnId) {
            return {
              ...col,
              tasks: col.tasks.filter((t) => t.id !== task.id),
            };
          } else if (col.id === 5) {
            // Completed column
            return {
              ...col,
              tasks: [...col.tasks, { ...task, statusId: 5, progress: 100 }],
            };
          }

          return col;
        }),
      );

      // Call API to update status to Completed (5) with 100% progress
      await tasksService.updateTaskStatus(parseInt(task.id), 5, comment, 100);

      showSuccessToast(t("teamDashboard.kanban.taskCompleted"));

      // Update parent data immediately but track time to prevent useEffect from resetting UI
      if (onTaskUpdate) {
        onTaskUpdate();
      }
    } catch (error) {
      console.error("Failed to complete task:", error);
      showErrorToast(t("teamDashboard.kanban.taskCompleteFailed"));

      // Revert optimistic update
      setCompletedTaskIds((prev) => {
        const newSet = new Set(prev);

        newSet.delete(task.id);

        return newSet;
      });
      setColumns((prevColumns) =>
        prevColumns.map((col) => {
          if (col.id === 5) {
            return {
              ...col,
              tasks: col.tasks.filter((t) => t.id !== task.id),
            };
          } else if (col.id === columnId) {
            return {
              ...col,
              tasks: [...col.tasks, task],
            };
          }

          return col;
        }),
      );
    } finally {
      setCompletingTaskId(null);
    }
  };

  // Get progress color based on percentage
  const getProgressColor = (progress: number, total: number): string => {
    if (total === 0) return "bg-default-300";

    const percentage = (progress / total) * 100;

    if (percentage >= 70) return "bg-success";
    if (percentage >= 40) return "bg-warning";

    return "bg-danger";
  };

  // Check if column is accessible and get restriction reason
  const getColumnInfo = (columnId: number) => {
    return getColumnAccessibility(userRoleIds, columnId);
  };

  // Check if task is overdue
  const isOverdue = (task: MemberTask): boolean => {
    if (!task.endDate) return false;

    const today = new Date();
    const endDate = new Date(task.endDate);

    return endDate < today && task.statusId !== 5;
  };

  if (error) {
    return (
      <ErrorWithRetry
        error={error.message || t("teamDashboard.kanban.errorLoadingTasks")}
        onRetry={() => {
          setError(null);
          if (onTaskUpdate) onTaskUpdate();
        }}
      />
    );
  }

  // Show skeletons only on initial load or when no data exists yet
  if ((loading || statusesLoading) && (!tasks || tasks.length === 0)) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-48 rounded-lg" />
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-8 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card className={`w-full ${isMaximized ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
        <CardHeader className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {t("teamDashboard.kanban.title")}
          </h3>
          <Tooltip content={isMaximized ? t("common.minimize") : t("common.maximize")}>
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={() => setIsMaximized(!isMaximized)}
            >
              {isMaximized ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </Tooltip>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {columns.map((column) => {
              const columnInfo = getColumnInfo(column.id);

              return (
                <div
                  key={column.id}
                  className={`flex flex-col rounded-lg ${
                    column.id === 1
                      ? "bg-default/5"
                      : column.id === 2
                        ? "bg-primary/5"
                        : column.id === 3
                          ? "bg-warning/5"
                          : column.id === 4
                            ? "bg-danger/5"
                            : "bg-success/5"
                  }`}
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  {/* Column Header */}
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Chip
                        color={column.color as any}
                        size="sm"
                        startContent={column.icon}
                        variant="flat"
                      >
                        {language === "ar" ? column.titleAr : column.title}
                      </Chip>
                      {!columnInfo.isVisible && (
                        <Tooltip
                          content={getRestrictionReason(columnInfo.reasonCode)}
                        >
                          <Lock className="w-4 h-4 text-danger" />
                        </Tooltip>
                      )}
                    </div>
                    <Chip size="sm" variant="flat">
                      {column.tasks.length}
                    </Chip>
                  </div>

                  {/* Tasks */}
                  <ScrollShadow
                    key={`column-scroll-${column.id}`}
                    ref={(el) => {
                      if (el) {
                        const scrollElement = el as any;
                        const innerElement = scrollElement?.ref?.current;

                        if (innerElement) {
                          scrollRefs.current.set(column.id, innerElement);
                        }
                      }
                    }}
                    hideScrollBar
                    className="flex-1 px-3 pb-3 space-y-2"
                    style={{ maxHeight: "700px" }}
                  >
                    {column.tasks.map((task) => {
                      const canDrag = kanbanConfig.canDragFrom(column.id);
                      const isAdhocTask = task.typeId === TASK_TYPES.ADHOC;
                      const canQuickComplete =
                        isAdhocTask && task.statusId !== 5;
                      const isHovered = hoveredTaskId === task.id;

                      return (
                        <div
                          key={task.id}
                          className={`group bg-content1 dark:bg-content2 rounded-lg p-3 cursor-pointer transition-all duration-500 ease-in-out ${
                            canDrag ? "cursor-grab" : "cursor-default"
                          } ${
                            draggedTask?.id === task.id
                              ? "opacity-50"
                              : "opacity-100"
                          } ${
                            updatingTaskId === task.id
                              ? "animate-pulse pointer-events-none"
                              : ""
                          } ${
                            canQuickComplete && isHovered
                              ? "shadow-2xl border-2 border-success ring-2 ring-success/20"
                              : "border-2 border-transparent hover:shadow-lg"
                          }`}
                          draggable={canDrag}
                          onClick={(e) => handleCardClick(e, task)}
                          onDragStart={() => handleDragStart(task, column.id)}
                          onMouseDown={(e) =>
                            handleMouseDown(e, task, column.id)
                          }
                          onMouseEnter={() => setHoveredTaskId(task.id)}
                          onMouseLeave={() => setHoveredTaskId(null)}
                        >
                          {/* Task Header with Title and Quick Complete Switch */}
                          <div
                            className={`flex items-start gap-2 mb-2 ${
                              language === "ar" ? "flex-row-reverse" : ""
                            }`}
                          >
                            <h4
                              className={`text-sm font-medium flex-1 line-clamp-2 ${
                                language === "ar" ? "text-right" : ""
                              }`}
                            >
                              {task.name}
                            </h4>
                            {canQuickComplete && isHovered && (
                              <div
                                className={
                                  language === "ar" ? "order-first" : ""
                                }
                              >
                                <Tooltip
                                  content={t(
                                    "teamDashboard.kanban.markComplete",
                                  )}
                                >
                                  <Switch
                                    color="success"
                                    isDisabled={completingTaskId === task.id}
                                    isSelected={completedTaskIds.has(task.id)}
                                    size="sm"
                                    startContent={
                                      <CheckCircle className="w-3 h-3" />
                                    }
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleQuickComplete(task, column.id);
                                    }}
                                  />
                                </Tooltip>
                              </div>
                            )}
                          </div>

                          {/* Task Type */}
                          <div className="mb-2">
                            <Chip
                              color={getTaskTypeColor(task.typeId) as any}
                              size="sm"
                              variant="bordered"
                            >
                              {t(getTaskTypeText(task.typeId))}
                            </Chip>
                          </div>

                          {/* Priority */}
                          <div className="flex items-center gap-2 mb-2">
                            <Flag className="w-3 h-3 text-default-400" />
                            <Chip
                              color={getPriorityColor(task.priorityId) as any}
                              size="sm"
                              variant="flat"
                            >
                              {getPriorityLabel(task.priorityId)}
                            </Chip>
                          </div>

                          {/* Project/Requirement Info */}
                          <div className="text-xs text-default-500 space-y-1 mb-2">
                            {task.project && (
                              <div
                                className={`flex items-center gap-1 ${
                                  language === "ar"
                                    ? "flex-row-reverse text-right"
                                    : ""
                                }`}
                              >
                                <span className="font-medium">
                                  {t("common.project")}:
                                </span>
                                <span className="truncate">
                                  {task.project.applicationName}
                                </span>
                              </div>
                            )}
                            {task.requirement && (
                              <div
                                className={`flex items-center gap-1 ${
                                  language === "ar"
                                    ? "flex-row-reverse text-right"
                                    : ""
                                }`}
                              >
                                <span className="font-medium">
                                  {t("requirements.requirement")}:
                                </span>
                                <span className="truncate">
                                  {task.requirement.name}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* End Date and Overdue Badge */}
                          {task.endDate && (
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-1 text-xs text-default-500">
                                <CalendarIcon className="w-3 h-3" />
                                <span>
                                  {new Date(task.endDate).toLocaleDateString(
                                    language === "ar" ? "ar-EG" : "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                    },
                                  )}
                                </span>
                              </div>
                              {isOverdue(task) && (
                                <Chip
                                  color="danger"
                                  size="sm"
                                  startContent={
                                    <AlertTriangle className="w-3 h-3" />
                                  }
                                  variant="flat"
                                >
                                  {t("common.overdue")}
                                </Chip>
                              )}
                            </div>
                          )}

                          {/* Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-default-500">
                                {t("common.progress")}
                              </span>
                              <span
                                className={`font-semibold ${
                                  task.progress === 100
                                    ? "text-success font-bold"
                                    : task.progress >= 70
                                      ? "text-success"
                                      : task.progress >= 40
                                        ? "text-warning"
                                        : task.progress > 0
                                          ? "text-danger"
                                          : "text-default-400"
                                }`}
                              >
                                {task.progress || 0}%
                              </span>
                            </div>
                            <div className="w-full bg-default-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  task.progress === 100
                                    ? "bg-success"
                                    : task.progress >= 70
                                      ? "bg-success"
                                      : task.progress >= 40
                                        ? "bg-warning"
                                        : task.progress > 0
                                          ? "bg-danger"
                                          : "bg-default-300"
                                }`}
                                style={{ width: `${task.progress || 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {column.tasks.length === 0 && (
                      <div className="text-center py-8 text-default-400 text-sm">
                        {t("teamDashboard.kanban.noTasks")}
                      </div>
                    )}
                  </ScrollShadow>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </>
  );
}
