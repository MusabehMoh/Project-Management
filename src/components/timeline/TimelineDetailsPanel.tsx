import { useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Avatar } from "@heroui/avatar";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Slider } from "@heroui/slider";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";

import { 
  Timeline,
  Sprint,
  Task,
  Subtask,
  Department,
  Resource,
  UpdateTimelineRequest,
  UpdateSprintRequest,
  UpdateTaskRequest,
  UpdateSubtaskRequest
} from "@/types/timeline";
import { EditIcon } from "@/components/icons";

interface TimelineDetailsPanelProps {
  timeline: Timeline;
  selectedItem?: string;
  selectedItemType?: 'timeline' | 'sprint' | 'task' | 'subtask';
  onUpdateTimeline: (data: UpdateTimelineRequest) => Promise<Timeline | null>;
  onUpdateSprint: (data: UpdateSprintRequest) => Promise<Sprint | null>;
  onUpdateTask: (data: UpdateTaskRequest) => Promise<Task | null>;
  onUpdateSubtask: (data: UpdateSubtaskRequest) => Promise<Subtask | null>;
  departments: Department[];
  resources: Resource[];
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
  resources,
  loading = false
}: TimelineDetailsPanelProps) {

  // Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editModalData, setEditModalData] = useState<{
    type: 'timeline' | 'sprint' | 'task' | 'subtask';
    item: any;
  } | null>(null);

  // Modal functions
  const handleOpenEditModal = (type: 'timeline' | 'sprint' | 'task' | 'subtask', item: any) => {
    console.log('Opening edit modal for:', { type, item });
    setEditModalData({ type, item });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditModalData(null);
  };

  // Find the selected item
  const currentItem = useMemo(() => {
    if (!selectedItem || !selectedItemType) {
      return timeline;
    }

    if (selectedItemType === 'timeline') {
      return timeline;
    }

    if (selectedItemType === 'sprint') {
      return timeline.sprints.find(s => s.id === selectedItem);
    }

    if (selectedItemType === 'task') {
      for (const sprint of timeline.sprints) {
        const task = sprint.tasks.find(t => t.id === selectedItem);
        if (task) return task;
      }
    }

    if (selectedItemType === 'subtask') {
      for (const sprint of timeline.sprints) {
        for (const task of sprint.tasks) {
          const subtask = task.subtasks.find(s => s.id === selectedItem);
          if (subtask) return subtask;
        }
      }
    }

    return timeline;
  }, [timeline, selectedItem, selectedItemType]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'primary';
      case 'on-hold': return 'warning';
      case 'not-started': return 'default';
      case 'cancelled': return 'danger';
      default: return 'default';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 76) return 'success';      // Green: 76-100%
    if (progress >= 51) return 'warning';      // Yellow: 51-75%
    if (progress >= 26) return 'primary';      // Blue: 26-50%
    return 'danger';                           // Red: 0-25%
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'primary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getDepartmentColor = (departmentName?: string) => {
    const dept = departments.find(d => d.name === departmentName);
    return dept?.color || '#6B7280';
  };

  const getResourceInfo = (resourceId: string) => {
    return resources.find(r => r.id === resourceId);
  };

  const renderTimelineDetails = () => (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-lg">{timeline.name}</h4>
        <p className="text-sm text-default-600 mt-1">{timeline.description}</p>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-default-700">Duration</p>
          <p className="text-sm text-default-600">{timeline.startDate} → {timeline.endDate}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-default-700">Project ID</p>
          <p className="text-sm text-default-600">{timeline.projectId}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-default-700">Structure</p>
          <div className="flex gap-2 mt-1">
            <Chip size="sm" variant="flat" color="primary">
              {timeline.sprints.length} Sprint{timeline.sprints.length !== 1 ? 's' : ''}
            </Chip>
            <Chip size="sm" variant="flat" color="secondary">
              {timeline.sprints.reduce((acc, sprint) => acc + sprint.tasks.length, 0)} Task{timeline.sprints.reduce((acc, sprint) => acc + sprint.tasks.length, 0) !== 1 ? 's' : ''}
            </Chip>
            <Chip size="sm" variant="flat" color="warning">
              {timeline.sprints.reduce((acc, sprint) => 
                acc + sprint.tasks.reduce((taskAcc, task) => taskAcc + task.subtasks.length, 0), 0
              )} Subtask{timeline.sprints.reduce((acc, sprint) => 
                acc + sprint.tasks.reduce((taskAcc, task) => taskAcc + task.subtasks.length, 0), 0
              ) !== 1 ? 's' : ''}
            </Chip>
          </div>
        </div>
      </div>

      <Button
        color="primary"
        variant="light"
        startContent={<EditIcon />}
        size="sm"
        isDisabled={loading}
        onPress={() => {
          handleOpenEditModal('timeline', timeline);
        }}
      >
        Edit Timeline
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
            <Chip size="sm" color="secondary" variant="flat">Sprint</Chip>
          </div>
          <p className="text-sm text-default-600">{sprint.description}</p>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-default-700">Duration</p>
            <p className="text-sm text-default-600">{sprint.startDate} → {sprint.endDate}</p>
            <p className="text-xs text-default-500">{sprint.duration} days</p>
          </div>

          {sprint.department && (
            <div>
              <p className="text-sm font-medium text-default-700">Department</p>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getDepartmentColor(sprint.department) }}
                />
                <span className="text-sm text-default-600">{sprint.department}</span>
              </div>
            </div>
          )}

          {sprint.resources && sprint.resources.length > 0 && (
            <div>
              <p className="text-sm font-medium text-default-700">Resources</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {sprint.resources.map(resourceId => {
                  const resource = getResourceInfo(resourceId);
                  return (
                    <div key={resourceId} className="flex items-center gap-2">
                      <Avatar
                        name={resource?.name || resourceId}
                        size="sm"
                        className="w-6 h-6"
                      />
                      <span className="text-sm text-default-600">
                        {resource?.name || resourceId}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-default-700">Tasks</p>
            <Chip size="sm" variant="flat" color="success">
              {sprint.tasks.length} Task{sprint.tasks.length !== 1 ? 's' : ''}
            </Chip>
          </div>

          {sprint.notes && (
            <div>
              <p className="text-sm font-medium text-default-700">Notes</p>
              <p className="text-sm text-default-600">{sprint.notes}</p>
            </div>
          )}
        </div>

        <Button
          color="primary"
          variant="light"
          startContent={<EditIcon />}
          size="sm"
          isDisabled={loading}
          onPress={() => {
            handleOpenEditModal('sprint', currentItem);
          }}
        >
          Edit Sprint
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
            <Chip size="sm" color="success" variant="flat">Task</Chip>
          </div>
          <p className="text-sm text-default-600">{task.description}</p>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-default-700">Duration</p>
            <p className="text-sm text-default-600">{task.startDate} → {task.endDate}</p>
            <p className="text-xs text-default-500">{task.duration} days</p>
          </div>

          <div>
            <p className="text-sm font-medium text-default-700">Status & Priority</p>
            <div className="flex gap-2 mt-1">
              <Chip size="sm" color={getStatusColor(task.status)} variant="flat">
                {task.status.replace('-', ' ')}
              </Chip>
              <Chip size="sm" color={getPriorityColor(task.priority)} variant="flat">
                {task.priority}
              </Chip>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-default-700">Progress</p>
            <div className="flex items-center gap-3 mt-1">
              <Progress
                value={task.progress}
                color={getProgressColor(task.progress)}
                size="sm"
                className="flex-1"
              />
              <span className="text-sm text-default-600">{task.progress}%</span>
            </div>
          </div>

          {task.department && (
            <div>
              <p className="text-sm font-medium text-default-700">Department</p>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getDepartmentColor(task.department) }}
                />
                <span className="text-sm text-default-600">{task.department}</span>
              </div>
            </div>
          )}

          {task.resources && task.resources.length > 0 && (
            <div>
              <p className="text-sm font-medium text-default-700">Resources</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {task.resources.map(resourceId => {
                  const resource = getResourceInfo(resourceId);
                  return (
                    <div key={resourceId} className="flex items-center gap-2">
                      <Avatar
                        name={resource?.name || resourceId}
                        size="sm"
                        className="w-6 h-6"
                      />
                      <span className="text-sm text-default-600">
                        {resource?.name || resourceId}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-default-700">Subtasks</p>
            <Chip size="sm" variant="flat" color="warning">
              {task.subtasks.length} Subtask{task.subtasks.length !== 1 ? 's' : ''}
            </Chip>
          </div>

          {task.notes && (
            <div>
              <p className="text-sm font-medium text-default-700">Notes</p>
              <p className="text-sm text-default-600">{task.notes}</p>
            </div>
          )}
        </div>

        <Button
          color="primary"
          variant="light"
          startContent={<EditIcon />}
          size="sm"
          isDisabled={loading}
          onPress={() => {
            handleOpenEditModal('task', currentItem);
          }}
        >
          Edit Task
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
            <Chip size="sm" color="warning" variant="flat">Subtask</Chip>
          </div>
          <p className="text-sm text-default-600">{subtask.description}</p>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-default-700">Duration</p>
            <p className="text-sm text-default-600">{subtask.startDate} → {subtask.endDate}</p>
            <p className="text-xs text-default-500">{subtask.duration} days</p>
          </div>

          <div>
            <p className="text-sm font-medium text-default-700">Status & Priority</p>
            <div className="flex gap-2 mt-1">
              <Chip size="sm" color={getStatusColor(subtask.status)} variant="flat">
                {subtask.status.replace('-', ' ')}
              </Chip>
              <Chip size="sm" color={getPriorityColor(subtask.priority)} variant="flat">
                {subtask.priority}
              </Chip>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-default-700">Progress</p>
            <div className="flex items-center gap-3 mt-1">
              <Progress
                value={subtask.progress}
                color={getProgressColor(subtask.progress)}
                size="sm"
                className="flex-1"
              />
              <span className="text-sm text-default-600">{subtask.progress}%</span>
            </div>
          </div>

          {subtask.department && (
            <div>
              <p className="text-sm font-medium text-default-700">Department</p>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getDepartmentColor(subtask.department) }}
                />
                <span className="text-sm text-default-600">{subtask.department}</span>
              </div>
            </div>
          )}

          {subtask.resources && subtask.resources.length > 0 && (
            <div>
              <p className="text-sm font-medium text-default-700">Resources</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {subtask.resources.map(resourceId => {
                  const resource = getResourceInfo(resourceId);
                  return (
                    <div key={resourceId} className="flex items-center gap-2">
                      <Avatar
                        name={resource?.name || resourceId}
                        size="sm"
                        className="w-6 h-6"
                      />
                      <span className="text-sm text-default-600">
                        {resource?.name || resourceId}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {subtask.notes && (
            <div>
              <p className="text-sm font-medium text-default-700">Notes</p>
              <p className="text-sm text-default-600">{subtask.notes}</p>
            </div>
          )}
        </div>

        <Button
          color="primary"
          variant="light"
          startContent={<EditIcon />}
          size="sm"
          isDisabled={loading}
          onPress={() => {
            handleOpenEditModal('subtask', currentItem);
          }}
        >
          Edit Subtask
        </Button>
      </div>
    );
  };

  const renderContent = () => {
    if (!currentItem) {
      return (
        <div className="text-center py-8">
          <p className="text-default-500">No item selected</p>
        </div>
      );
    }

    if (selectedItemType === 'sprint' && currentItem !== timeline) {
      return renderSprintDetails();
    }

    if (selectedItemType === 'task' && currentItem !== timeline) {
      return renderTaskDetails();
    }

    if (selectedItemType === 'subtask' && currentItem !== timeline) {
      return renderSubtaskDetails();
    }

    return renderTimelineDetails();
  };

  const renderEditModal = () => (
    <Modal 
      isOpen={isEditModalOpen} 
      onClose={handleCloseEditModal}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Edit {editModalData?.type?.charAt(0).toUpperCase()}{editModalData?.type?.slice(1)}
        </ModalHeader>
        <ModalBody>
          {editModalData && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <Input
                  placeholder="Enter name"
                  defaultValue={editModalData.item.name}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Input
                  placeholder="Enter description"
                  defaultValue={editModalData.item.description}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <Input
                    type="date"
                    defaultValue={editModalData.item.startDate}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <Input
                    type="date"
                    defaultValue={editModalData.item.endDate}
                  />
                </div>
              </div>

              {editModalData.type !== 'timeline' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Department</label>
                  <Input
                    placeholder="Department"
                    defaultValue={editModalData.item.department}
                  />
                </div>
              )}

              {(editModalData.type === 'task' || editModalData.type === 'subtask') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <Input
                      placeholder="Status"
                      defaultValue={editModalData.item.status}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Priority</label>
                    <Input
                      placeholder="Priority"
                      defaultValue={editModalData.item.priority}
                    />
                  </div>
                </div>
              )}

              {(editModalData.type === 'task' || editModalData.type === 'subtask') && (
                <div>
                  <label className="block text-sm font-medium mb-2">Progress (%)</label>
                  <Slider
                    size="md"
                    step={5}
                    maxValue={100}
                    minValue={0}
                    defaultValue={editModalData.item.progress || 0}
                    color={getProgressColor(editModalData.item.progress || 0)}
                    showTooltip={true}
                    marks={[
                      { value: 0, label: "0%" },
                      { value: 25, label: "25%" },
                      { value: 50, label: "50%" },
                      { value: 75, label: "75%" },
                      { value: 100, label: "100%" }
                    ]}
                    className="max-w-md"
                    getValue={(value) => `${value}%`}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <Input
                  placeholder="Additional notes"
                  defaultValue={editModalData.item.notes}
                />
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleCloseEditModal}>
            Cancel
          </Button>
          <Button color="primary" onPress={() => {
            // TODO: Implement save functionality
            console.log('Save clicked for:', editModalData);
            handleCloseEditModal();
          }}>
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

  return (
    <>
      <div className="h-full overflow-auto p-4">
        {renderContent()}
      </div>
      {renderEditModal()}
    </>
  );
}
