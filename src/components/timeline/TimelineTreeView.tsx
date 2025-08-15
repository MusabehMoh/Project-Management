import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Avatar } from "@heroui/avatar";
import { Input } from "@heroui/input";
import { Slider } from "@heroui/slider";
import { Tooltip } from "@heroui/tooltip";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";

import { 
  Timeline,
  Sprint,
  Task,
  Subtask,
  Department,
  Resource,
  TimelineFilters,
  CreateSprintRequest,
  CreateTaskRequest,
  CreateSubtaskRequest,
  UpdateSprintRequest,
  UpdateTaskRequest,
  UpdateSubtaskRequest
} from "@/types/timeline";
import { 
  ChevronRightIcon, 
  ChevronDownIcon, 
  PlusIcon, 
  EditIcon, 
  DeleteIcon, 
  MoreVerticalIcon,
  SearchIcon
} from "@/components/icons";

interface TimelineTreeViewProps {
  timeline: Timeline;
  onItemSelect: (itemId: string, itemType: 'timeline' | 'sprint' | 'task' | 'subtask') => void;
  onCreateSprint: (data: CreateSprintRequest) => Promise<Sprint | null>;
  onCreateTask: (data: CreateTaskRequest) => Promise<Task | null>;
  onCreateSubtask: (data: CreateSubtaskRequest) => Promise<Subtask | null>;
  onUpdateSprint: (data: UpdateSprintRequest) => Promise<Sprint | null>;
  onUpdateTask: (data: UpdateTaskRequest) => Promise<Task | null>;
  onUpdateSubtask: (data: UpdateSubtaskRequest) => Promise<Subtask | null>;
  onDeleteSprint: (id: string) => Promise<boolean>;
  onDeleteTask: (id: string) => Promise<boolean>;
  onDeleteSubtask: (id: string) => Promise<boolean>;
  departments: Department[];
  resources: Resource[];
  filters: TimelineFilters;
  selectedItem?: string;
  loading?: boolean;
}

export default function TimelineTreeView({
  timeline,
  onItemSelect,
  onCreateSprint,
  onCreateTask,
  onCreateSubtask,
  onUpdateSprint,
  onUpdateTask,
  onUpdateSubtask,
  onDeleteSprint,
  onDeleteTask,
  onDeleteSubtask,
  departments,
  resources,
  filters,
  selectedItem,
  loading = false
}: TimelineTreeViewProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set([timeline.id]));
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editModalData, setEditModalData] = useState<{
    type: 'timeline' | 'sprint' | 'task' | 'subtask';
    item: any;
  } | null>(null);
  const [quickSearch, setQuickSearch] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeScrollRef = useRef<HTMLElement | null>(null);

  // Scroll detection for showing scroll-to-top button (detect actual scrollable element inside tree)
  useEffect(() => {
    const root = scrollContainerRef.current;
    if (!root) return;

    // Helper: find the first descendant that actually scrolls
    const findScrollable = (node: HTMLElement): HTMLElement | null => {
      // Prefer elements with overflow-y: auto|scroll and real overflow
      const candidates = Array.from(node.querySelectorAll<HTMLElement>("*"));
      for (const el of [node, ...candidates]) {
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
        if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 1) {
          return el;
        }
      }
      // Fallback to root if none found
      return node;
    };

    const target = findScrollable(root);
    activeScrollRef.current = target;

    const handleScroll = () => {
      const el = activeScrollRef.current;
      if (!el) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      const nearBottom = scrollTop + clientHeight >= scrollHeight - 24; // within 24px of bottom
      setShowScrollTop(nearBottom);
    };

    target.addEventListener('scroll', handleScroll, { passive: true });
    // Initial check after layout settles
    const t = setTimeout(handleScroll, 50);
    return () => {
      clearTimeout(t);
      target.removeEventListener('scroll', handleScroll);
    };
  }, [expandedItems]);

  // Reset expanded state when timeline changes - force a clean reset
  useEffect(() => {
    setExpandedItems(new Set([timeline.id]));
  }, [timeline.id, timeline.name]);

  // Color legend component
  const renderColorLegend = () => (
    <div className="mb-4 p-3 bg-default-50 rounded-lg space-y-3">
      <div>
        <h4 className="text-sm font-medium mb-2 text-default-700">Hierarchy Color Legend</h4>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-blue-500 rounded"></div>
            <span className="text-default-600">Timeline</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-green-500 rounded"></div>
            <span className="text-default-600">Sprints</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-orange-500 rounded"></div>
            <span className="text-default-600">Tasks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-purple-500 rounded"></div>
            <span className="text-default-600">Subtasks</span>
          </div>
        </div>
      </div>
      <div>
        <h4 className="text-sm font-medium mb-2 text-default-700">Progress Color Legend</h4>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-red-500 rounded"></div>
            <span className="text-default-600">0-25% (Critical)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-blue-500 rounded"></div>
            <span className="text-default-600">26-50% (Behind)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-yellow-500 rounded"></div>
            <span className="text-default-600">51-75% (On Track)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-green-500 rounded"></div>
            <span className="text-default-600">76-100% (Excellent)</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Filter data based on filters
  const filteredTimeline = useMemo(() => {
    if (!filters.search && filters.departments.length === 0 && filters.resources.length === 0 && 
        filters.status.length === 0 && filters.priority.length === 0) {
      return timeline;
    }

    const filteredSprints = timeline.sprints.map(sprint => {
      // Check if sprint matches filters
      const sprintMatches = (
        (!filters.search || sprint.name.toLowerCase().includes(filters.search.toLowerCase()) ||
         sprint.description?.toLowerCase().includes(filters.search.toLowerCase())) &&
        (filters.departments.length === 0 || !sprint.department || filters.departments.includes(sprint.department)) &&
        (filters.resources.length === 0 || !sprint.resources || sprint.resources.some(r => filters.resources.includes(r)))
      );

      const filteredTasks = sprint.tasks.map(task => {
        const taskMatches = (
          (!filters.search || task.name.toLowerCase().includes(filters.search.toLowerCase()) ||
           task.description?.toLowerCase().includes(filters.search.toLowerCase())) &&
          (filters.departments.length === 0 || !task.department || filters.departments.includes(task.department)) &&
          (filters.resources.length === 0 || !task.resources || task.resources.some(r => filters.resources.includes(r))) &&
          (filters.status.length === 0 || filters.status.includes(task.status)) &&
          (filters.priority.length === 0 || filters.priority.includes(task.priority))
        );

        const filteredSubtasks = task.subtasks.filter(subtask => {
          return (
            (!filters.search || subtask.name.toLowerCase().includes(filters.search.toLowerCase()) ||
             subtask.description?.toLowerCase().includes(filters.search.toLowerCase())) &&
            (filters.departments.length === 0 || !subtask.department || filters.departments.includes(subtask.department)) &&
            (filters.resources.length === 0 || !subtask.resources || subtask.resources.some(r => filters.resources.includes(r))) &&
            (filters.status.length === 0 || filters.status.includes(subtask.status)) &&
            (filters.priority.length === 0 || filters.priority.includes(subtask.priority))
          );
        });

        if (taskMatches || filteredSubtasks.length > 0) {
          return { ...task, subtasks: filteredSubtasks };
        }
        return null;
      }).filter(Boolean) as Task[];

      if (sprintMatches || filteredTasks.length > 0) {
        return { ...sprint, tasks: filteredTasks };
      }
      return null;
    }).filter(Boolean) as Sprint[];

    return { ...timeline, sprints: filteredSprints };
  }, [timeline, filters]);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleOpenEditModal = (type: 'timeline' | 'sprint' | 'task' | 'subtask', item: any) => {
    console.log('Opening edit modal for:', { type, item });
    setEditModalData({ type, item });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditModalData(null);
  };

  // Navigation helper functions
  const scrollToTop = () => {
    const el = activeScrollRef.current || scrollContainerRef.current;
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSprint = (sprintId: string) => {
    const element = document.getElementById(`sprint-${sprintId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Ensure the sprint is expanded
      if (!expandedItems.has(sprintId)) {
        setExpandedItems(prev => new Set([...prev, sprintId]));
      }
    }
  };

  const handleCreateSprint = async () => {
    try {
      await onCreateSprint({
        timelineId: timeline.id,
        name: 'New Sprint',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'New sprint description'
      });
      // Expand timeline to show new sprint
      setExpandedItems(prev => new Set(prev).add(timeline.id));
    } catch (error) {
      console.error('Failed to create sprint:', error);
    }
  };

  const handleCreateTask = async (sprintId: string) => {
    try {
      await onCreateTask({
        sprintId,
        name: 'New Task',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'New task description',
        status: 'not-started',
        priority: 'medium',
        progress: 0
      });
      // Expand sprint to show new task
      setExpandedItems(prev => new Set(prev).add(sprintId));
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleCreateSubtask = async (taskId: string) => {
    try {
      await onCreateSubtask({
        taskId,
        name: 'New Subtask',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'New subtask description',
        status: 'not-started',
        priority: 'medium',
        progress: 0
      });
      // Expand task to show new subtask
      setExpandedItems(prev => new Set(prev).add(taskId));
    } catch (error) {
      console.error('Failed to create subtask:', error);
    }
  };

  const handleDelete = async (id: string, type: 'sprint' | 'task' | 'subtask') => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      if (type === 'sprint') {
        await onDeleteSprint(id);
      } else if (type === 'task') {
        await onDeleteTask(id);
      } else if (type === 'subtask') {
        await onDeleteSubtask(id);
      }
    } catch (error) {
      console.error(`Failed to delete ${type}:`, error);
    }
  };

  const getStatusColor = (status: string) => {
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'primary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  // Search component
  const renderQuickSearch = () => (
    <div className="mb-4">
      <Input
        size="sm"
        placeholder="Search sprints, tasks, subtasks..."
        value={quickSearch}
        onChange={(e) => setQuickSearch(e.target.value)}
        startContent={<SearchIcon className="w-4 h-4" />}
        clearable
        onClear={() => setQuickSearch("")}
      />
      
      {quickSearch && (
        <div className="mt-2 max-h-32 overflow-y-auto space-y-1 bg-default-50 rounded-lg p-2">
          {filteredTimeline.sprints
            .filter(sprint => 
              sprint.name.toLowerCase().includes(quickSearch.toLowerCase()) ||
              sprint.tasks.some(task => 
                task.name.toLowerCase().includes(quickSearch.toLowerCase()) ||
                task.subtasks.some(subtask => 
                  subtask.name.toLowerCase().includes(quickSearch.toLowerCase())
                )
              )
            )
            .map(sprint => (
              <div key={sprint.id} className="text-xs">
                <button
                  className="w-full text-left p-2 hover:bg-default-100 rounded flex items-center gap-2"
                  onClick={() => scrollToSprint(sprint.id)}
                >
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="font-medium">{sprint.name}</span>
                  <span className="text-default-500">({sprint.tasks.length} tasks)</span>
                </button>
                {sprint.tasks
                  .filter(task => task.name.toLowerCase().includes(quickSearch.toLowerCase()))
                  .slice(0, 3)
                  .map(task => (
                    <div key={task.id} className="ml-5 p-1 text-default-600 flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded"></div>
                      <span>{task.name}</span>
                    </div>
                  ))
                }
                {sprint.tasks
                  .flatMap(task => 
                    task.subtasks
                      .filter(subtask => subtask.name.toLowerCase().includes(quickSearch.toLowerCase()))
                      .map(subtask => ({ ...subtask, parentTaskName: task.name }))
                  )
                  .slice(0, 3)
                  .map(subtask => (
                    <div key={subtask.id} className="ml-8 p-1 text-default-600 flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded"></div>
                      <span>{subtask.name}</span>
                      <span className="text-xs text-default-400">in {subtask.parentTaskName}</span>
                    </div>
                  ))
                }
              </div>
            ))
          }
        </div>
      )}
    </div>
  );

  const getDepartmentColor = (departmentName?: string) => {
    const dept = departments.find(d => d.name === departmentName);
    return dept?.color || '#6B7280';
  };

  const getResourceName = (resourceId: string) => {
    const resource = resources.find(r => r.id === resourceId);
    return resource?.name || resourceId;
  };

  const renderTimelineHeader = () => (
    <div 
      id={`timeline-${timeline.id}`}
      className={`p-4 border-l-4 cursor-pointer hover:bg-default-50 transition-colors ${
        selectedItem === timeline.id ? 'bg-primary-50' : ''
      } border-blue-500`}
      onClick={() => onItemSelect(timeline.id, 'timeline')}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-6 h-6 hover:bg-default-100 rounded cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded(timeline.id);
            }}
          >
            {expandedItems.has(timeline.id) ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{timeline.name}</h3>
            <p className="text-sm text-default-600">{timeline.description}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-default-500">
              <span>{timeline.startDate} → {timeline.endDate}</span>
              <span>{filteredTimeline.sprints.length} sprints</span>
              {filters.search && (
                <Chip size="sm" color="warning" variant="flat">
                  Filtered
                </Chip>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            color="default"
            size="sm"
            variant="light"
            startContent={<EditIcon />}
            onPress={() => handleOpenEditModal('timeline', timeline)}
            onClick={(e) => e.stopPropagation()}
          >
            Edit Timeline
          </Button>
          <Button
            color="primary"
            size="sm"
            startContent={<PlusIcon />}
            onPress={handleCreateSprint}
            isLoading={loading}
            onClick={(e) => e.stopPropagation()}
          >
            Add Sprint
          </Button>
        </div>
      </div>
    </div>
  );

  const renderSprint = (sprint: Sprint) => (
    <div key={sprint.id} className="ml-8" id={`sprint-${sprint.id}`}>
      <div 
        className={`p-3 border-l-4 cursor-pointer hover:bg-default-50 transition-colors ${
          selectedItem === sprint.id ? 'bg-primary-50' : ''
        } border-green-500`}
        onClick={() => onItemSelect(sprint.id, 'sprint')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-6 h-6 hover:bg-default-100 rounded cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(sprint.id);
              }}
            >
              {expandedItems.has(sprint.id) ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
            </div>
            <div>
              <h4 className="font-medium">{sprint.name}</h4>
              <p className="text-sm text-default-600">{sprint.description}</p>
              <div className="flex items-center gap-4 mt-1 text-xs text-default-500">
                <span>{sprint.startDate} → {sprint.endDate}</span>
                <span>{sprint.duration} days</span>
                {sprint.department && (
                  <Chip 
                    size="sm" 
                    variant="flat"
                    style={{ backgroundColor: getDepartmentColor(sprint.department), color: 'white' }}
                  >
                    {sprint.department}
                  </Chip>
                )}
                <span>{sprint.tasks.length} tasks</span>
              </div>
              {sprint.resources && sprint.resources.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  {sprint.resources.slice(0, 3).map(resourceId => (
                    <Avatar
                      key={resourceId}
                      name={getResourceName(resourceId)}
                      size="sm"
                      className="w-6 h-6 text-xs"
                    />
                  ))}
                  {sprint.resources.length > 3 && (
                    <span className="text-xs text-default-500">
                      +{sprint.resources.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              color="primary"
              size="sm"
              variant="light"
              startContent={<PlusIcon />}
              onPress={() => handleCreateTask(sprint.id)}
              isLoading={loading}
              onClick={(e) => e.stopPropagation()}
            >
              Add Task
            </Button>
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly variant="light" size="sm" onClick={(e) => e.stopPropagation()}>
                  <MoreVerticalIcon />
                </Button>
              </DropdownTrigger>
              <DropdownMenu onAction={(key) => {
                if (key === 'edit') {
                  handleOpenEditModal('sprint', sprint);
                } else if (key === 'delete') {
                  handleDelete(sprint.id, 'sprint');
                }
              }}>
                <DropdownItem key="edit" startContent={<EditIcon />}>
                  Edit Sprint
                </DropdownItem>
                <DropdownItem 
                  key="delete" 
                  className="text-danger" 
                  color="danger"
                  startContent={<DeleteIcon />}
                >
                  Delete Sprint
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>
      
      {expandedItems.has(sprint.id) && sprint.tasks.map((task) => renderTask(task))}
    </div>
  );

  const renderTask = (task: Task) => (
    <div key={task.id} className="ml-8">
      <div 
        className={`p-3 border-l-4 cursor-pointer hover:bg-default-50 transition-colors ${
          selectedItem === task.id ? 'bg-primary-50' : ''
        } border-orange-500`}
        onClick={() => onItemSelect(task.id, 'task')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-6 h-6 hover:bg-default-100 rounded cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(task.id);
              }}
            >
              {expandedItems.has(task.id) ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
            </div>
            <div>
              <h5 className="font-medium">{task.name}</h5>
              <p className="text-sm text-default-600">{task.description}</p>
              <div className="flex items-center gap-4 mt-1 text-xs text-default-500">
                <span>{task.startDate} → {task.endDate}</span>
                <span>{task.duration} days</span>
                <Chip size="sm" color={getStatusColor(task.status)} variant="flat">
                  {task.status.replace('-', ' ')}
                </Chip>
                <Chip size="sm" color={getPriorityColor(task.priority)} variant="flat">
                  {task.priority}
                </Chip>
                {task.department && (
                  <Chip 
                    size="sm" 
                    variant="flat"
                    style={{ backgroundColor: getDepartmentColor(task.department), color: 'white' }}
                  >
                    {task.department}
                  </Chip>
                )}
                <span>{task.subtasks.length} subtasks</span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <Progress 
                  value={task.progress} 
                  className="max-w-md" 
                  color={getProgressColor(task.progress)}
                  size="sm"
                  aria-label={`Task progress: ${task.progress}%`}
                />
                <span className="text-xs text-default-500">{task.progress}%</span>
              </div>
              {task.resources && task.resources.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  {task.resources.slice(0, 3).map(resourceId => (
                    <Avatar
                      key={resourceId}
                      name={getResourceName(resourceId)}
                      size="sm"
                      className="w-6 h-6 text-xs"
                    />
                  ))}
                  {task.resources.length > 3 && (
                    <span className="text-xs text-default-500">
                      +{task.resources.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              color="primary"
              size="sm"
              variant="light"
              startContent={<PlusIcon />}
              onPress={() => handleCreateSubtask(task.id)}
              isLoading={loading}
              onClick={(e) => e.stopPropagation()}
            >
              Add Subtask
            </Button>
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly variant="light" size="sm" onClick={(e) => e.stopPropagation()}>
                  <MoreVerticalIcon />
                </Button>
              </DropdownTrigger>
              <DropdownMenu onAction={(key) => {
                if (key === 'edit') {
                  handleOpenEditModal('task', task);
                } else if (key === 'delete') {
                  handleDelete(task.id, 'task');
                }
              }}>
                <DropdownItem key="edit" startContent={<EditIcon />}>
                  Edit Task
                </DropdownItem>
                <DropdownItem 
                  key="delete" 
                  className="text-danger" 
                  color="danger"
                  startContent={<DeleteIcon />}
                >
                  Delete Task
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>
      
      {expandedItems.has(task.id) && task.subtasks.map((subtask) => renderSubtask(subtask))}
    </div>
  );

  const renderSubtask = (subtask: Subtask) => (
    <div key={subtask.id} className="ml-8">
      <div 
        className={`p-3 border-l-4 cursor-pointer hover:bg-default-50 transition-colors ${
          selectedItem === subtask.id ? 'bg-primary-50' : ''
        } border-purple-500`}
        onClick={() => onItemSelect(subtask.id, 'subtask')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6" /> {/* Spacer for alignment */}
            <div>
              <h6 className="font-medium">{subtask.name}</h6>
              <p className="text-sm text-default-600">{subtask.description}</p>
              <div className="flex items-center gap-4 mt-1 text-xs text-default-500">
                <span>{subtask.startDate} → {subtask.endDate}</span>
                <span>{subtask.duration} days</span>
                <Chip size="sm" color={getStatusColor(subtask.status)} variant="flat">
                  {subtask.status.replace('-', ' ')}
                </Chip>
                <Chip size="sm" color={getPriorityColor(subtask.priority)} variant="flat">
                  {subtask.priority}
                </Chip>
                {subtask.department && (
                  <Chip 
                    size="sm" 
                    variant="flat"
                    style={{ backgroundColor: getDepartmentColor(subtask.department), color: 'white' }}
                  >
                    {subtask.department}
                  </Chip>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2">
                <Progress 
                  value={subtask.progress} 
                  className="max-w-md" 
                  color={getProgressColor(subtask.progress)}
                  size="sm"
                  aria-label={`Subtask progress: ${subtask.progress}%`}
                />
                <span className="text-xs text-default-500">{subtask.progress}%</span>
              </div>
              {subtask.resources && subtask.resources.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  {subtask.resources.slice(0, 3).map(resourceId => (
                    <Avatar
                      key={resourceId}
                      name={getResourceName(resourceId)}
                      size="sm"
                      className="w-6 h-6 text-xs"
                    />
                  ))}
                  {subtask.resources.length > 3 && (
                    <span className="text-xs text-default-500">
                      +{subtask.resources.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly variant="light" size="sm" onClick={(e) => e.stopPropagation()}>
                <MoreVerticalIcon />
              </Button>
            </DropdownTrigger>
            <DropdownMenu onAction={(key) => {
              if (key === 'edit') {
                handleOpenEditModal('subtask', subtask);
              } else if (key === 'delete') {
                handleDelete(subtask.id, 'subtask');
              }
            }}>
              <DropdownItem key="edit" startContent={<EditIcon />}>
                Edit Subtask
              </DropdownItem>
              <DropdownItem 
                key="delete" 
                className="text-danger" 
                color="danger"
                startContent={<DeleteIcon />}
              >
                Delete Subtask
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </div>
  );

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

  // Scroll to top button (bottom-left of tree container, show near bottom with fade)
  const renderScrollToTop = () => (
    <div
      className={`absolute bottom-4 left-4 z-10 transition-all duration-300 ${
        showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
      }`}
    >
      <Button
        isIconOnly
        color="default"
        variant="light"
        size="sm"
        onPress={scrollToTop}
        className="h-8 min-w-8"
        aria-label="Scroll to top"
      >
        <ChevronRightIcon className="w-3 h-3 rotate-[-90deg]" />
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <div className="text-default-600">Loading timeline...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={scrollContainerRef} className="h-full overflow-auto relative">
        <Card className="h-full">
          <CardBody className="p-4">
            {renderColorLegend()}
            {renderQuickSearch()}
            <div className="space-y-1 pb-8">
              {renderTimelineHeader()}
              {expandedItems.has(timeline.id) && filteredTimeline.sprints.map((sprint) => renderSprint(sprint))}
            </div>
          </CardBody>
        </Card>
        {renderScrollToTop()}
      </div>
      {renderEditModal()}
    </>
  );
}
