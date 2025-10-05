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
import { formatDateOnly } from "@/utils/dateFormatter";

interface TaskListViewProps {
  tasks: MemberTask[];
  onTaskClick?: (task: MemberTask) => void;
  getStatusColor: (
    status: number,
  ) => "warning" | "danger" | "primary" | "secondary" | "success" | "default";
  getStatusText: (status: number) => string;
  getPriorityColor: (
    priority: number,
  ) => "warning" | "danger" | "primary" | "secondary" | "success" | "default";
  getPriorityLabel: (priority: number) => string | undefined;
}

export const TaskListView = ({
  tasks,
  onTaskClick,
  getStatusColor,
  getStatusText,
  getPriorityColor,
  getPriorityLabel,
}: TaskListViewProps) => {
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

  const columns = [
    { key: "name", label: t("taskName") },
    { key: "assignees", label: t("assignees") },
    { key: "department", label: t("department") },
    { key: "status", label: t("status") },
    { key: "priority", label: t("priority") },
    { key: "progress", label: t("taskProgress") },
    { key: "dates", label: t("dates") },
    { key: "tags", label: t("tags") },
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
              <p
                dangerouslySetInnerHTML={{
                  __html: task.description,
                }}
                className="text-tiny text-default-400 truncate max-w-[200px]"
              />
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
          <Chip size="sm" variant="flat">
            {task.department?.name || ""}
          </Chip>
        );

      case "status":
        return (
          <Chip color={getStatusColor(task.statusId)} size="sm" variant="flat">
            {getStatusText(task.statusId)}
          </Chip>
        );

      case "priority":
        return (
          <Chip
            color={getPriorityColor(task.priorityId)}
            size="sm"
            variant="flat"
          >
            {getPriorityLabel(task.priorityId) || ""}
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
              <Chip color="danger" size="sm" variant="flat">
                Overdue
              </Chip>
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
              className={`cursor-pointer transition-colors ${
                task.isOverdue
                  ? "bg-danger-50/50 dark:bg-danger-950/30 hover:bg-danger-100/70 dark:hover:bg-red-500/40 dark:hover:border-red-500/50"
                  : "hover:bg-default-50 dark:hover:bg-default-100/20"
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
