import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Avatar } from "@heroui/avatar";
import { Badge } from "@heroui/badge";
import { Card, CardBody } from "@heroui/card";
import {
  CalendarDays,
  Clock,
  Users,
  Tag,
  Building2,
  FileText,
  CheckCircle2,
} from "lucide-react";

import { MemberTask } from "@/types/membersTasks";
import { useLanguage } from "@/contexts/LanguageContext";

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: MemberTask | null;
}

export const TaskDetailsModal = ({
  isOpen,
  onClose,
  task,
}: TaskDetailsModalProps) => {
  const { t } = useLanguage();

  if (!task) return null;

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "success";
    if (progress >= 60) return "primary";
    if (progress >= 40) return "warning";

    return "danger";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="3xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground truncate">
                {task.name}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: task.department.color }}
                />
                <span className="text-sm text-foreground-600">
                  {task.department.name}
                </span>
                {task.isOverdue && (
                  <Badge color="danger" variant="flat">
                    {t("overdueTask")}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Chip color={task.status.color as any} size="md" variant="flat">
                {task.status.label}
              </Chip>
              <Chip
                color={task.priority.color as any}
                size="md"
                variant="solid"
              >
                {task.priority.label}
              </Chip>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="gap-6">
          {/* Description */}
          <Card>
            <CardBody>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-foreground-600" />
                <span className="text-sm font-medium text-foreground">
                  {t("timeline.detailsPanel.description")}
                </span>
              </div>
              <p className="text-foreground-700 leading-relaxed">
                {task.description}
              </p>
            </CardBody>
          </Card>

          {/* Progress */}
          <Card>
            <CardBody>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-foreground-600" />
                <span className="text-sm font-medium text-foreground">
                  {t("taskProgress")}
                </span>
                <span className="text-lg font-bold text-foreground ml-auto">
                  {task.progress}%
                </span>
              </div>
              <Progress
                className="mb-2"
                color={getProgressColor(task.progress)}
                size="lg"
                value={task.progress}
              />
            </CardBody>
          </Card>

          {/* Assignees */}
          <Card>
            <CardBody>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-foreground-600" />
                <span className="text-sm font-medium text-foreground">
                  {t("filterByAssignees")}
                </span>
              </div>

              {task.primaryAssignee && (
                <div className="mb-4">
                  <p className="text-xs text-foreground-500 mb-2 uppercase tracking-wide">
                    {t("primaryAssignee")}
                  </p>
                  <div className="flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                    <Avatar name={task.primaryAssignee.fullName} size="md" />
                    <div className="flex flex-col">
                      <span className="font-medium text-primary-700 dark:text-primary-300">
                        {task.primaryAssignee.gradeName}{" "}
                        {task.primaryAssignee.fullName}
                      </span>
                      <span className="text-sm text-primary-500 dark:text-primary-400">
                        {task.primaryAssignee.department}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {task.assignedMembers.length > 1 && (
                <div>
                  <p className="text-xs text-foreground-500 mb-2 uppercase tracking-wide">
                    {t("otherAssignees")}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {task.assignedMembers.slice(1).map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-3 bg-default-100 rounded-lg"
                      >
                        <Avatar name={member.fullName} size="sm" />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-medium text-foreground truncate">
                            {member.gradeName} {member.fullName}
                          </span>
                          <span className="text-sm text-foreground-600 truncate">
                            {member.department}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Time and Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardBody>
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays className="w-4 h-4 text-foreground-600" />
                  <span className="text-sm font-medium text-foreground">
                    Timeline
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-foreground-500 uppercase tracking-wide">
                      Start Date
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(task.startDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground-500 uppercase tracking-wide">
                      End Date
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(task.endDate)}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-foreground-600" />
                  <span className="text-sm font-medium text-foreground">
                    Time Tracking
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-foreground-500 uppercase tracking-wide">
                      {t("timeSpent")}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {task.timeSpent} hours
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground-500 uppercase tracking-wide">
                      {t("estimatedTime")}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {task.estimatedTime} hours
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Project and Requirement */}
          <Card>
            <CardBody>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-foreground-600" />
                <span className="text-sm font-medium text-foreground">
                  Project Details
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-foreground-500 uppercase tracking-wide">
                    Project
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {task.project.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-foreground-500 uppercase tracking-wide">
                    Requirement
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {task.requirement.name}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Tags */}
          {task.tags.length > 0 && (
            <Card>
              <CardBody>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-foreground-600" />
                  <span className="text-sm font-medium text-foreground">
                    {t("taskTags")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag, index) => (
                    <Chip key={index} size="sm" variant="flat">
                      {tag}
                    </Chip>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-foreground-500">
                <div>
                  <p className="uppercase tracking-wide">Created</p>
                  <p>{formatDateTime(task.createdAt)}</p>
                </div>
                <div>
                  <p className="uppercase tracking-wide">Last Updated</p>
                  <p>{formatDateTime(task.updatedAt)}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" onPress={onClose}>
            Close
          </Button>
          <Button color="primary" onPress={onClose}>
            Edit Task
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
