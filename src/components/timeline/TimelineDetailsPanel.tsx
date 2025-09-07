import { useMemo, useState } from "react";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Button } from "@heroui/button";

import TimelineEditModal, {
  TimelineEditModalFormData,
} from "./TimelineEditModal";

import { useLanguage } from "@/contexts/LanguageContext";
import { useTimelineHelpers } from "@/hooks/useTimelineHelpers";
import {
  Timeline,
  Sprint,
  Task,
  Subtask,
  Department,
  UpdateTimelineRequest,
  UpdateSprintRequest,
  UpdateTaskRequest,
  UpdateSubtaskRequest,
} from "@/types/timeline";
import { EditIcon } from "@/components/icons";

interface TimelineDetailsPanelProps {
  timeline: Timeline;
  selectedItem?: string;
  selectedItemType?: "timeline" | "sprint" | "task" | "subtask" | "requirement";
  onUpdateTimeline: (data: UpdateTimelineRequest) => Promise<Timeline | null>;
  onUpdateSprint: (data: UpdateSprintRequest) => Promise<Sprint | null>;
  onUpdateTask: (data: UpdateTaskRequest) => Promise<Task | null>;
  onUpdateSubtask: (data: UpdateSubtaskRequest) => Promise<Subtask | null>;
  departments: Department[];
  loading?: boolean;
}

export default function TimelineDetailsPanel({
  timeline,
  selectedItem,
  selectedItemType,
  onUpdateTimeline,
  onUpdateSprint,
  onUpdateTask,
  onUpdateSubtask,
  departments,
  loading = false,
}: TimelineDetailsPanelProps) {
  const { t, direction } = useLanguage();
  const {
    getStatusColor,
    getProgressColor,
    getPriorityColor,
    getDepartmentColor,
    getStatusName,
    getPriorityName,
    getDepartmentName,
    STATUS_OPTIONS,
    PRIORITY_OPTIONS,
  } = useTimelineHelpers(departments);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editModalType, setEditModalType] = useState<
    "timeline" | "sprint"  | "task" | "subtask"
  >("timeline");
  const [editModalInitialValues, setEditModalInitialValues] =
    useState<TimelineEditModalFormData>({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      departmentId: "",
      statusId: 1,
      priorityId: 2,
      progress: 0,
      notes: "",
    });
  const [editingItem, setEditingItem] = useState<any>(null);

  // Modal functions
  const handleOpenEditModal = (
    type: "timeline" | "sprint" | "task" | "subtask",
    item: any,
  ) => {
    setEditModalType(type);
    setEditingItem(item);
    setEditModalInitialValues({
      name: item.name || "",
      description: item.description || "",
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      departmentId: item.departmentId?.toString() || "",
      statusId: item.statusId || 1,
      priorityId: item.priorityId || 2,
      progress: item.progress || 0,
      notes: item.notes || "",
      members: item.members || [],
      memberIds: item.members ? item.members.map((m: any) => m.id) : [],
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmitEdit = async (formData: TimelineEditModalFormData) => {
    if (!editingItem) return;

    try {
      if (editModalType === "timeline") {
        await onUpdateTimeline({
          id: editingItem.id,
          ...formData,
        });
      } else if (editModalType === "sprint") {
        await onUpdateSprint({
          id: editingItem.id,
          // Preserve current timeline association on sprint update
          timelineId: (editingItem.timelineId ?? timeline.id).toString(),
          ...formData,
        });
      } else if (editModalType === "task") {
        await onUpdateTask({
          id: editingItem.id,
          ...formData,
          statusId: formData.statusId,
          priorityId: formData.priorityId,
        });
      } else if (editModalType === "subtask") {
        await onUpdateSubtask({
          id: editingItem.id,
          ...formData,
          statusId: formData.statusId,
          priorityId: formData.priorityId,
        });
      }
    } catch (error) {
      console.error(`Failed to update ${editModalType}:`, error);
      throw error; // Re-throw to let the modal handle it
    }
  };

  // Find the selected item
  const currentItem = useMemo(() => {
    if (!selectedItem) {
      return timeline;
    }

    if (selectedItemType === "timeline") {
      return timeline;
    }

    if (selectedItemType === "sprint") {
      const sprint = timeline.sprints.find(
        (s) => s.treeId.toString() === selectedItem,
      );

      return sprint || timeline;
    }
 

    if (selectedItemType === "task") {
      for (const sprint of timeline.sprints) {
        // Check requirements structure first
        for (const requirement of sprint.tasks || []) {
          const task = (requirement.subtasks || []).find(
            (t) => t.treeId.toString() === selectedItem,
          );

          if (task) return task;
        }
        // Check direct sprint tasks (for current mock data structure)
        if ((sprint as any).tasks) {
          const task = (sprint as any).tasks.find(
            (t: any) => t.treeId.toString() === selectedItem,
          );

          if (task) return task;
        }
      }
    }
    return timeline;
  }, [timeline, selectedItem, selectedItemType]);

  const renderTimelineDetails = () => (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-lg">{timeline.name}</h4>
        <p className="text-sm text-default-600 mt-1">{timeline.description}</p>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-default-700">
            {t("timeline.detailsPanel.duration")}
          </p>
          <p className="text-sm text-default-600">
            {timeline.startDate} {direction === "rtl" ? "←" : "→"}{" "}
            {timeline.endDate}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-default-700">
            {t("timeline.detailsPanel.projectId")}
          </p>
          <p className="text-sm text-default-600">{timeline.projectId}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-default-700">
            {t("timeline.detailsPanel.structure")}
          </p>
          <div className="flex gap-2 mt-1">
            <Chip color="primary" size="sm" variant="flat">
              {timeline.sprints.length} {t("timeline.sprints")}
              {timeline.sprints.length !== 1 ? "" : ""}
            </Chip>
            <Chip color="warning" size="sm" variant="flat">
              {timeline.sprints.reduce((acc, sprint) => {
                // Count from requirements structure
                const reqSubtasks = (sprint.tasks || []).reduce(
                  (reqAcc, req) =>
                    reqAcc +
                    (req.subtasks || []).reduce(
                      (taskAcc, task) => taskAcc + (task.subtasks?.length || 0),
                      0,
                    ),
                  0,
                );
                // Count from direct sprint tasks (for current mock data)
                const sprintSubtasks =
                  (sprint as any).tasks?.reduce(
                    (taskAcc: number, task: any) =>
                      taskAcc + (task.subtasks?.length || 0),
                    0,
                  ) || 0;

                return acc + reqSubtasks + sprintSubtasks;
              }, 0)}{" "}
              {t("timeline.subtasks")}
            </Chip>
          </div>
        </div>
      </div>

      <Button
        color="primary"
        isDisabled={loading}
        size="sm"
        startContent={<EditIcon />}
        variant="light"
        onPress={() => {
          handleOpenEditModal("timeline", timeline);
        }}
      >
        {t("timeline.treeView.editModalTitle")}{" "}
        {t("timeline.treeView.timelineLabel")}
      </Button>
    </div>
  );

  const renderSprintDetails = () => {
    const sprint = currentItem as Sprint;

    return (
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold">{sprint.name}</h4>
            <Chip color="secondary" size="sm" variant="flat">
              {t("timeline.sprint")}
            </Chip>
          </div>
          <p className="text-sm text-default-600">{sprint.description}</p>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-default-700">
              {t("timeline.detailsPanel.duration")}
            </p>
            <p className="text-sm text-default-600">
              {sprint.startDate} {direction === "rtl" ? "←" : "→"}{" "}
              {sprint.endDate}
            </p>
            <p className="text-xs text-default-500">
              {sprint.duration} {t("timeline.detailsPanel.days")}
            </p>
          </div>

          {sprint.departmentId && (
            <div>
              <p className="text-sm font-medium text-default-700">
                {t("timeline.detailsPanel.department")}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: getDepartmentColor(sprint.departmentId),
                  }}
                />
                <span className="text-sm text-default-600">
                  {getDepartmentName(sprint.departmentId)}
                </span>
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-default-700">
              {t("timeline.detailsPanel.tasks")}
            </p>
            <Chip color="success" size="sm" variant="flat">
              {(sprint.tasks || []).reduce(
                (acc, task) => acc + (task.subtasks?.length || 0),
                0,
              )}{" "}
              {t("timeline.tasks")}
            </Chip>
          </div>

          {sprint.notes && (
            <div>
              <p className="text-sm font-medium text-default-700">
                {t("timeline.treeView.notes")}
              </p>
              <p className="text-sm text-default-600">{sprint.notes}</p>
            </div>
          )}
        </div>

        <Button
          color="primary"
          isDisabled={loading}
          size="sm"
          startContent={<EditIcon />}
          variant="light"
          onPress={() => {
            handleOpenEditModal("sprint", currentItem);
          }}
        >
          {t("timeline.treeView.editModalTitle")} {t("timeline.sprint")}
        </Button>
      </div>
    );
  };

  const renderTaskDetails = () => {
    const task = currentItem as Task;

    return (
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold">{task.name}</h4>
            <Chip color="success" size="sm" variant="flat">
              {t("timeline.task")}
            </Chip>
          </div>
          <p className="text-sm text-default-600">{task.description}</p>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-default-700">
              {t("timeline.detailsPanel.duration")}
            </p>
            <p className="text-sm text-default-600">
              {task.startDate} {direction === "rtl" ? "←" : "→"} {task.endDate}
            </p>
            <p className="text-xs text-default-500">
              {task.duration} {t("timeline.detailsPanel.days")}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-default-700">
              {t("timeline.detailsPanel.statusAndPriority")}
            </p>
            <div className="flex gap-2 mt-1">
              <Chip
                color={getStatusColor(task.statusId)}
                size="sm"
                variant="flat"
              >
                {getStatusName(task.statusId)}
              </Chip>
              <Chip
                color={getPriorityColor(task.priorityId)}
                size="sm"
                variant="flat"
              >
                {getPriorityName(task.priorityId)}
              </Chip>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-default-700">
              {t("timeline.detailsPanel.progress")}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <Progress
                className="flex-1"
                color={getProgressColor(task.progress)}
                size="sm"
                value={task.progress}
              />
              <span className="text-sm text-default-600">{task.progress}%</span>
            </div>
          </div>

          {task.departmentId && (
            <div>
              <p className="text-sm font-medium text-default-700">
                {t("timeline.detailsPanel.department")}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: getDepartmentColor(task.departmentId),
                  }}
                />
                <span className="text-sm text-default-600">
                  {getDepartmentName(task.departmentId)}
                </span>
              </div>
            </div>
          )}

          {task.members && task.members.length > 0 && (
            <div>
              <p className="text-sm font-medium text-default-700">
                {t("timeline.assignedMembers")}
              </p>
              <div className="flex flex-wrap gap-2 mt-1">
                {task.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 bg-primary-50 rounded-lg px-3 py-2"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-primary-800">
                        {member.gradeName} {member.fullName}
                      </span>
                      <span className="text-xs text-primary-600">
                        {member.department}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-default-700">
              {t("timeline.detailsPanel.subtasks")}
            </p>
            <Chip color="warning" size="sm" variant="flat">
              {task.subtasks?.length || 0} {t("timeline.subtasks")}
            </Chip>
          </div>

          {task.notes && (
            <div>
              <p className="text-sm font-medium text-default-700">
                {t("timeline.treeView.notes")}
              </p>
              <p className="text-sm text-default-600">{task.notes}</p>
            </div>
          )}
        </div>

        <Button
          color="primary"
          isDisabled={loading}
          size="sm"
          startContent={<EditIcon />}
          variant="light"
          onPress={() => {
            handleOpenEditModal("task", currentItem);
          }}
        >
          {t("timeline.treeView.editModalTitle")} {t("timeline.task")}
        </Button>
      </div>
    );
  };

  const renderSubtaskDetails = () => {
    const subtask = currentItem as Subtask;

    return (
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold">{subtask.name}</h4>
            <Chip color="warning" size="sm" variant="flat">
              {t("timeline.subtask")}
            </Chip>
          </div>
          <p className="text-sm text-default-600">{subtask.description}</p>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-default-700">
              {t("timeline.detailsPanel.duration")}
            </p>
            <p className="text-sm text-default-600">
              {subtask.startDate} {direction === "rtl" ? "←" : "→"}{" "}
              {subtask.endDate}
            </p>
            <p className="text-xs text-default-500">
              {subtask.duration} {t("timeline.detailsPanel.days")}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-default-700">
              {t("timeline.detailsPanel.statusAndPriority")}
            </p>
            <div className="flex gap-2 mt-1">
              <Chip
                color={getStatusColor(subtask.statusId)}
                size="sm"
                variant="flat"
              >
                {getStatusName(subtask.statusId)}
              </Chip>
              <Chip
                color={getPriorityColor(subtask.priorityId)}
                size="sm"
                variant="flat"
              >
                {getPriorityName(subtask.priorityId)}
              </Chip>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-default-700">
              {t("timeline.detailsPanel.progress")}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <Progress
                className="flex-1"
                color={getProgressColor(subtask.progress || 0)}
                size="sm"
                value={subtask.progress || 0}
              />
              <span className="text-sm text-default-600">
                {subtask.progress || 0}%
              </span>
            </div>
          </div>

          {subtask.departmentId && (
            <div>
              <p className="text-sm font-medium text-default-700">
                {t("timeline.detailsPanel.department")}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: getDepartmentColor(subtask.departmentId),
                  }}
                />
                <span className="text-sm text-default-600">
                  {getDepartmentName(subtask.departmentId)}
                </span>
              </div>
            </div>
          )}

          {subtask.notes && (
            <div>
              <p className="text-sm font-medium text-default-700">
                {t("timeline.treeView.notes")}
              </p>
              <p className="text-sm text-default-600">{subtask.notes}</p>
            </div>
          )}
        </div>

        <Button
          color="primary"
          isDisabled={loading}
          size="sm"
          startContent={<EditIcon />}
          variant="light"
          onPress={() => {
            handleOpenEditModal("subtask", currentItem);
          }}
        >
          {t("timeline.treeView.editModalTitle")} {t("timeline.subtask")}
        </Button>
      </div>
    );
  };

  const renderContent = () => {
    if (!currentItem) {
      return (
        <div className="text-center py-8">
          <p className="text-default-500">
            {t("timeline.detailsPanel.noItemSelected")}
          </p>
          <p className="text-sm text-default-400 mt-2">
            {t("timeline.detailsPanel.selectAnItem")}
          </p>
        </div>
      );
    }

    if (selectedItemType === "sprint" && currentItem !== timeline) {
      return renderSprintDetails();
    }

    if (selectedItemType === "task" && currentItem !== timeline) {
      return renderTaskDetails();
    }

    if (selectedItemType === "subtask" && currentItem !== timeline) {
      return renderSubtaskDetails();
    }

    return renderTimelineDetails();
  };

  return (
    <>
      <div
        className={`h-full overflow-auto p-4 ${direction === "rtl" ? "text-right" : "text-left"}`}
      >
        {renderContent()}
      </div>
      <TimelineEditModal
        departments={departments}
        getProgressColor={getProgressColor}
        initialValues={editModalInitialValues}
        isOpen={isEditModalOpen}
        loading={loading}
        priorityOptions={PRIORITY_OPTIONS}
        statusOptions={STATUS_OPTIONS}
        type={editModalType}
        onClose={handleCloseEditModal}
        onSubmit={handleSubmitEdit}
      />
    </>
  );
}
