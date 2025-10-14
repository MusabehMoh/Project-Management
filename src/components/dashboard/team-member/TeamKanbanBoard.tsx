import type { MemberTask } from "@/types/membersTasks";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Skeleton } from "@heroui/skeleton";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Tooltip } from "@heroui/tooltip";
import {
  ListTodo,
  PlayCircle,
  Eye,
  RotateCcw,
  CheckCircle,
  Clock,
  Flag,
  Calendar as CalendarIcon,
  Lock,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useTaskStatusLookups } from "@/hooks/useTaskLookups";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { membersTasksService, tasksService } from "@/services/api";
import ErrorWithRetry from "@/components/ErrorWithRetry";
import {
  getKanbanConfigForRoles,
  getColumnAccessibility,
  ColumnRestrictionReason,
} from "@/utils/kanbanRoleConfig";
import { getTaskTypeText, getTaskTypeColor } from "@/constants/taskTypes";

interface KanbanColumn {
  id: number;
  title: string;
  titleAr: string;
  icon: React.ReactNode;
  color: string;
  tasks: MemberTask[];
}

interface TeamKanbanBoardProps {
  onTaskUpdate?: (taskId: number, newStatus: string) => void;
}

export default function TeamKanbanBoard({
  onTaskUpdate,
}: TeamKanbanBoardProps) {
  const { t, language } = useLanguage();
  const { user } = useCurrentUser();
  const {
    taskStatuses,
    loading: statusesLoading,
    getStatusLabel,
    getStatusColor,
  } = useTaskStatusLookups();
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [draggedTask, setDraggedTask] = useState<MemberTask | null>(null);
  const [draggedFromColumn, setDraggedFromColumn] = useState<number | null>(
    null,
  );

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
  const initializeColumns = (tasks: MemberTask[]): KanbanColumn[] => {
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
      tasks: tasks.filter((t) => t.statusId === status.value),
    }));
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await membersTasksService.getTasks({
        page: 1,
        limit: 100, // Get all tasks for kanban view
      });

      if (response.success && response.data) {
        const allColumns = initializeColumns(response.data.tasks);

        setColumns(allColumns);
      } else {
        throw new Error(response.message || "Failed to fetch tasks");
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch tasks"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wait for statuses to load before fetching tasks
    if (!statusesLoading && taskStatuses.length > 0) {
      fetchTasks();
    }
  }, [statusesLoading, taskStatuses]);

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

    try {
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
        // Fallback: keep existing progress for unknown statuses
        updatedProgress = draggedTask.progress;
      }

      console.log(
        `Kanban: Moving task ${draggedTask.id} from status ${draggedFromColumn} to ${targetColumnId}, setting progress to ${updatedProgress}%`,
      );

      // Update task status via API using TasksController PATCH endpoint
      // This creates a status history record and updates the task (including progress)
      const response = await tasksService.updateTaskStatus(
        parseInt(draggedTask.id),
        targetColumnId,
        `Status changed from ${getStatusLabel(draggedFromColumn.toString())} to ${getStatusLabel(targetColumnId.toString())} via Kanban board`,
        updatedProgress,
      );

      if (response.success) {
        // Update local state optimistically
        setColumns((prevColumns) => {
          const newColumns = [...prevColumns];

          // Remove from source column
          const sourceColumn = newColumns.find(
            (col) => col.id === draggedFromColumn,
          );

          if (sourceColumn) {
            sourceColumn.tasks = sourceColumn.tasks.filter(
              (t) => t.id !== draggedTask.id,
            );
          }

          // Add to target column with updated status and progress
          const targetColumn = newColumns.find(
            (col) => col.id === targetColumnId,
          );

          if (targetColumn) {
            // Create updated task with new status and progress
            const updatedTask = {
              ...draggedTask,
              statusId: targetColumnId,
              progress: updatedProgress,
            };

            console.log(`Kanban: Updated task in UI:`, updatedTask);
            targetColumn.tasks.push(updatedTask);
          }

          return newColumns;
        });

        // Notify parent component
        if (onTaskUpdate) {
          onTaskUpdate(parseInt(draggedTask.id), targetColumnId.toString());
        }
      }
    } catch (err) {
      console.error("Failed to update task status:", err);
      // TODO: Show error toast notification to user
      // TODO: Revert optimistic update on failure
    } finally {
      setDraggedTask(null);
      setDraggedFromColumn(null);
    }
  };

  const getPriorityColor = (priorityId: number) => {
    switch (priorityId) {
      case 1:
        return "success"; // Low
      case 2:
        return "warning"; // Medium
      case 3:
        return "danger"; // High
      default:
        return "default";
    }
  };

  const getPriorityLabel = (priorityId: number) => {
    switch (priorityId) {
      case 1:
        return language === "ar" ? "منخفض" : "Low";
      case 2:
        return language === "ar" ? "متوسط" : "Medium";
      case 3:
        return language === "ar" ? "عالي" : "High";
      default:
        return language === "ar" ? "غير محدد" : "Unknown";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (loading || statusesLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="flex items-center gap-3 pb-4">
          <Skeleton className="w-6 h-6 rounded" />
          <Skeleton className="w-48 h-6 rounded" />
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="w-full h-24 rounded-lg" />
                <Skeleton className="w-full h-24 rounded-lg" />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardBody className="min-h-[400px]">
          <ErrorWithRetry error={error.message} onRetry={fetchTasks} />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex items-center gap-3 pb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-default-100">
          <ListTodo className="w-5 h-5 text-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">
            {t("teamDashboard.kanban.title")}
          </h3>
          <p className="text-sm text-default-500">
            {t("teamDashboard.kanban.subtitle")}
          </p>
        </div>
      </CardHeader>

      <CardBody className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {columns.map((column) => {
            const columnAccess = getColumnAccessibility(userRoleIds, column.id);
            const isDroppable =
              draggedFromColumn !== null &&
              kanbanConfig.canDropTo(column.id, draggedFromColumn);

            return (
              <div
                key={column.id}
                className={`flex flex-col gap-3 ${!columnAccess.isDroppable && draggedFromColumn !== null ? "opacity-50" : ""}`}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <Card
                  className={`bg-${column.color}/10 backdrop-blur-sm ${!columnAccess.isDraggable && !columnAccess.isDroppable ? "relative" : ""}`}
                  shadow="sm"
                >
                  <CardBody className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`text-${column.color}`}>
                          {column.icon}
                        </div>
                        <span className="font-semibold text-sm">
                          {language === "ar" ? column.titleAr : column.title}
                        </span>
                        {!columnAccess.isDraggable &&
                          !columnAccess.isDroppable && (
                            <Tooltip
                              content={getRestrictionReason(
                                columnAccess.reasonCode,
                              )}
                            >
                              <Lock className="w-3 h-3 text-default-400" />
                            </Tooltip>
                          )}
                      </div>
                      <Chip
                        color={column.color as any}
                        size="sm"
                        variant="flat"
                      >
                        {column.tasks.length}
                      </Chip>
                    </div>
                  </CardBody>
                </Card>

                {/* Divider */}
                <Divider className={`bg-${column.color}/20`} />

                {/* Column Tasks */}
                <ScrollShadow hideScrollBar className="h-[500px]">
                  <div className="space-y-3 pr-2">
                    {column.tasks.length === 0 ? (
                      <div className="text-center text-sm text-default-400 py-8">
                        {t("teamDashboard.kanban.noTasks")}
                      </div>
                    ) : (
                      column.tasks.map((task) => {
                        const canDrag = columnAccess.isDraggable;

                        return (
                          <Card
                            key={task.id}
                            className={`${canDrag ? "cursor-move hover:shadow-lg" : "cursor-default"} transition-shadow`}
                            draggable={canDrag}
                            shadow="sm"
                            onDragStart={() =>
                              canDrag && handleDragStart(task, column.id)
                            }
                          >
                            <CardBody className="p-3 space-y-2">
                              {/* Task Title */}
                              <h4 className="font-semibold text-sm line-clamp-2">
                                {task.name}
                              </h4>

                              {/* Priority & Task Type */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-1">
                                  <Flag className="w-3 h-3" />
                                  <Chip
                                    color={
                                      getPriorityColor(task.priorityId) as any
                                    }
                                    size="sm"
                                    variant="flat"
                                  >
                                    {getPriorityLabel(task.priorityId)}
                                  </Chip>
                                </div>
                                <Chip
                                  color={getTaskTypeColor(task.typeId) as any}
                                  size="sm"
                                  variant="bordered"
                                >
                                  {t(getTaskTypeText(task.typeId))}
                                </Chip>
                              </div>

                              {/* Project & Requirement */}
                              <div className={`space-y-1 text-xs text-default-500 ${language === "ar" ? "text-right" : "text-left"}`}>
                                {task.project && (
                                  <div className="line-clamp-1">
                                    <strong>
                                      {t("teamDashboard.kanban.project")}:
                                    </strong>{" "}
                                    {task.project.applicationName}
                                  </div>
                                )}
                                {task.requirement && (
                                  <div className="line-clamp-1">
                                    <strong>
                                      {t("teamDashboard.kanban.requirement")}:
                                    </strong>{" "}
                                    {task.requirement.name}
                                  </div>
                                )}
                              </div>

                              {/* End Date & Progress */}
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1 text-default-500">
                                  <CalendarIcon className="w-3 h-3" />
                                  {formatDate(task.endDate)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-default-400" />
                                  <span
                                    className={
                                      task.progress === 100
                                        ? "text-success font-semibold"
                                        : task.progress >= 70
                                          ? "text-success"
                                          : task.progress >= 40
                                            ? "text-warning"
                                            : task.progress > 0
                                              ? "text-danger"
                                              : "text-default-600"
                                    }
                                  >
                                    {task.progress}%
                                  </span>
                                </div>
                              </div>

                              {/* Overdue Badge */}
                              {task.isOverdue && (
                                <Chip
                                  className="w-full"
                                  color="danger"
                                  size="sm"
                                  variant="flat"
                                >
                                  {t("teamDashboard.kanban.overdue")}
                                </Chip>
                              )}
                            </CardBody>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </ScrollShadow>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
