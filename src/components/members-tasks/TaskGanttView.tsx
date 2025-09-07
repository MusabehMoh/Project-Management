import { Card, CardBody, CardHeader } from "@heroui/card";
import { Avatar, AvatarGroup } from "@heroui/avatar";
import { Chip } from "@heroui/chip";
import { Badge } from "@heroui/badge";
import { CalendarDays, Clock } from "lucide-react";

import { MemberTask } from "@/types/membersTasks";
import { useLanguage } from "@/contexts/LanguageContext";

interface TaskGanttViewProps {
  tasks: MemberTask[];
  onTaskClick?: (task: MemberTask) => void;
}

export const TaskGanttView = ({ tasks, onTaskClick }: TaskGanttViewProps) => {
  const { language } = useLanguage();

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
    const date = new Date(dateString);

    return date.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Calculate timeline positions
  const getAllDates = () => {
    const dates = tasks.flatMap((task) => [
      new Date(task.startDate),
      new Date(task.endDate),
    ]);

    return {
      minDate: new Date(Math.min(...dates.map((d) => d.getTime()))),
      maxDate: new Date(Math.max(...dates.map((d) => d.getTime()))),
    };
  };

  const { minDate, maxDate } = getAllDates();
  const totalDays = Math.ceil(
    (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  const getTaskPosition = (task: MemberTask) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    const startOffset = Math.ceil(
      (taskStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const duration = Math.ceil(
      (taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${Math.max((duration / totalDays) * 100, 2)}%`, // Minimum 2% width
    };
  };

  return (
    <div className="w-full space-y-4">
      {/* Timeline Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold">
              {language === "ar" ? "مخطط جانت" : "Gantt Timeline"}
            </h3>
            <div className="flex items-center gap-4 text-sm text-foreground-600">
              <div className="flex items-center gap-1">
                <CalendarDays className="w-4 h-4" />
                <span>
                  {formatDate(minDate.toISOString())} -{" "}
                  {formatDate(maxDate.toISOString())}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>
                  {totalDays} {language === "ar" ? "يوم" : "days"}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          {/* Month headers */}
          <div className="relative mb-4 h-8 bg-content2 rounded-lg">
            {Array.from({ length: Math.ceil(totalDays / 30) }, (_, index) => {
              const monthDate = new Date(minDate);

              monthDate.setMonth(monthDate.getMonth() + index);
              const monthPosition = ((index * 30) / totalDays) * 100;

              return (
                <div
                  key={index}
                  className="absolute top-0 h-full flex items-center px-2 text-xs font-medium text-foreground-600 border-r border-divider"
                  style={{ left: `${monthPosition}%` }}
                >
                  {monthDate.toLocaleDateString(
                    language === "ar" ? "ar-EG" : "en-US",
                    {
                      month: "short",
                      year: "numeric",
                    },
                  )}
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Tasks Timeline */}
      <div className="space-y-3">
        {tasks.map((task) => {
          const position = getTaskPosition(task);

          return (
            <Card
              key={task.id}
              isPressable
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                task.isOverdue
                  ? "border-l-4 border-l-danger-500 bg-danger-50/30 dark:bg-danger-900/20"
                  : ""
              }`}
              onPress={() => onTaskClick?.(task)}
            >
              <CardBody className="py-3">
                <div className="grid grid-cols-12 gap-4 items-start">
                  {/* Task Info - More space for task name */}
                  <div className="col-span-5">
                    <h4 className="font-semibold text-sm text-foreground mb-2 leading-tight">
                      {task.name}
                    </h4>
                    <div className="flex items-center gap-1 flex-wrap">
                      <Chip
                        className="text-xs"
                        color={getStatusColor(task.status.label)}
                        size="sm"
                        variant="flat"
                      >
                        {task.status.label}
                      </Chip>
                      <Chip
                        className="text-xs"
                        color={getPriorityColor(task.priority.label)}
                        size="sm"
                        variant="flat"
                      >
                        {task.priority.label}
                      </Chip>
                    </div>
                  </div>

                  {/* Assignees - Compact */}
                  <div className="col-span-2">
                    {task.assignedMembers && task.assignedMembers.length > 0 ? (
                      <AvatarGroup size="sm" max={2}>
                        {task.assignedMembers.map((assignee) => (
                          <Avatar
                            key={assignee.id}
                            name={assignee.fullName}
                            size="sm"
                          />
                        ))}
                      </AvatarGroup>
                    ) : (
                      <span className="text-default-400 text-xs">
                        Unassigned
                      </span>
                    )}
                  </div>

                  {/* Timeline Bar - Adjusted space */}
                  <div className="col-span-3">
                    <div className="relative h-6 bg-content2 rounded-lg">
                      <div
                        className="absolute top-0 h-full bg-gradient-to-r from-primary to-primary-600 rounded-lg"
                        style={position}
                      >
                        {/* Progress overlay */}
                        <div
                          className="absolute top-0 left-0 h-full bg-success-500/40 rounded-lg"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-foreground-600 mt-1" />
                  </div>

                  {/* Progress */}
                  <div className="col-span-2 text-right">
                    <div className="text-sm font-medium text-foreground">
                      {task.progress}%
                    </div>
                    {task.isOverdue && (
                      <Badge color="danger" size="sm" variant="flat">
                        {language === "ar" ? "متأخر" : "Overdue"}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
