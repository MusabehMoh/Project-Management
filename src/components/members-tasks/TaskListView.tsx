import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Avatar, AvatarGroup } from "@heroui/avatar";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Badge } from "@heroui/badge";
import { CalendarDays, Clock } from "lucide-react";

import { MemberTask } from "@/types/membersTasks";
import { useLanguage } from "@/contexts/LanguageContext";

interface TaskListViewProps {
  tasks: MemberTask[];
  onTaskClick?: (task: MemberTask) => void;
}

export const TaskListView = ({ tasks, onTaskClick }: TaskListViewProps) => {
  const { t } = useLanguage();

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "success";
    if (progress >= 60) return "primary";
    if (progress >= 40) return "warning";

    return "danger";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
      case "عالي":
        return "danger";
      case "medium":
      case "متوسط":
        return "warning";
      case "low":
      case "منخفض":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "مكتمل":
        return "success";
      case "in progress":
      case "قيد التنفيذ":
        return "primary";
      case "pending":
      case "معلق":
        return "warning";
      case "cancelled":
      case "ملغي":
        return "danger";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const columns = [
    { key: "name", label: t("taskName") || "Task Name" },
    { key: "assignees", label: t("assignees") || "Assignees" },
    { key: "department", label: t("department") || "Department" },
    { key: "status", label: t("status") || "Status" },
    { key: "priority", label: t("priority") || "Priority" },
    { key: "progress", label: t("progress") || "Progress" },
    { key: "dates", label: t("dates") || "Start - End" },
    { key: "tags", label: t("tags") || "Tags" },
  ];

  const renderCell = (task: MemberTask, columnKey: string) => {
    switch (columnKey) {
      case "name":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm capitalize font-medium">
              {task.name}
            </p>
            {task.description && (
              <p className="text-tiny text-default-400 truncate max-w-[200px]">
                {task.description}
              </p>
            )}
          </div>
        );

      case "assignees":
        return (
          <div className="flex items-center gap-2">
            {task.assignedMembers && task.assignedMembers.length > 0 ? (
              <>
                <AvatarGroup max={3} size="sm">
                  {task.assignedMembers.map((assignee) => (
                    <Avatar
                      key={assignee.id}
                      name={assignee.fullName}
                      size="sm"
                    />
                  ))}
                </AvatarGroup>
                {task.assignedMembers.length > 3 && (
                  <Badge color="primary" size="sm" variant="flat">
                    +{task.assignedMembers.length - 3}
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-default-400 text-sm">No assignees</span>
            )}
          </div>
        );

      case "department":
        return (
          <Chip
            size="sm"
            style={{
              backgroundColor: `${task.department.color}20`,
              color: task.department.color,
            }}
            variant="flat"
          >
            {task.department.name}
          </Chip>
        );

      case "status":
        return (
          <Chip
            color={getStatusColor(task.status.label)}
            size="sm"
            variant="flat"
          >
            {task.status.label}
          </Chip>
        );

      case "priority":
        return (
          <Chip
            color={getPriorityColor(task.priority.label)}
            size="sm"
            variant="flat"
          >
            {task.priority.label}
          </Chip>
        );

      case "progress":
        return (
          <div className="flex flex-col gap-1 min-w-[120px]">
            <Progress
              showValueLabel
              color={getProgressColor(task.progress)}
              size="sm"
              value={task.progress}
            />
          </div>
        );

      case "dates":
        return (
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center gap-1 text-default-600">
              <CalendarDays className="w-3 h-3" />
              <span className="text-tiny">{formatDate(task.startDate)}</span>
            </div>
            <div className="flex items-center gap-1 text-default-600">
              <Clock className="w-3 h-3" />
              <span className="text-tiny">{formatDate(task.endDate)}</span>
            </div>
            {task.isOverdue && (
              <Badge color="danger" size="sm" variant="flat">
                Overdue
              </Badge>
            )}
          </div>
        );

      case "tags":
        return (
          <div className="flex flex-wrap gap-1 max-w-[150px]">
            {task.tags && task.tags.length > 0 ? (
              <>
                {task.tags.slice(0, 2).map((tag, index) => (
                  <Chip
                    key={index}
                    className="text-tiny"
                    size="sm"
                    variant="bordered"
                  >
                    {tag}
                  </Chip>
                ))}
                {task.tags.length > 2 && (
                  <Badge color="default" size="sm" variant="flat">
                    +{task.tags.length - 2}
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-default-400 text-tiny">No tags</span>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      <Table
        aria-label="Tasks table"
        classNames={{
          wrapper: "min-h-[400px]",
        }}
        selectionMode="none"
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key} align="start">
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={tasks}>
          {(task) => (
            <TableRow
              key={task.id}
              className={`cursor-pointer hover:bg-default-100 transition-colors ${
                task.isOverdue ? "bg-danger-50/30 dark:bg-danger-900/20" : ""
              }`}
              onClick={() => onTaskClick?.(task)}
            >
              {(columnKey) => (
                <TableCell>{renderCell(task, String(columnKey))}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
