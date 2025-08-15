import { useState, useMemo } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { format, parseISO, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

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
import { PlusIcon } from "@/components/icons";

interface TimelineGanttViewProps {
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

interface GanttItem {
  id: string;
  name: string;
  type: 'timeline' | 'sprint' | 'task' | 'subtask';
  startDate: Date;
  endDate: Date;
  progress: number;
  level: number;
  parent?: string;
  status?: string;
  priority?: string;
  department?: string;
  resources?: string[];
}

export default function TimelineGanttView({
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
}: TimelineGanttViewProps) {
  const [viewStartDate, setViewStartDate] = useState<Date>(() => {
    return startOfMonth(parseISO(timeline.startDate));
  });
  
  const [viewEndDate, setViewEndDate] = useState<Date>(() => {
    return endOfMonth(parseISO(timeline.endDate));
  });

  // Generate Gantt items hierarchy
  const ganttItems = useMemo((): GanttItem[] => {
    const items: GanttItem[] = [];

    // Add timeline
    items.push({
      id: timeline.id,
      name: timeline.name,
      type: 'timeline',
      startDate: parseISO(timeline.startDate),
      endDate: parseISO(timeline.endDate),
      progress: 0, // Calculate overall progress
      level: 0
    });

    // Add sprints
    timeline.sprints.forEach(sprint => {
      items.push({
        id: sprint.id,
        name: sprint.name,
        type: 'sprint',
        startDate: parseISO(sprint.startDate),
        endDate: parseISO(sprint.endDate),
        progress: 0, // Calculate sprint progress
        level: 1,
        parent: timeline.id,
        department: sprint.department,
        resources: sprint.resources
      });

      // Add tasks
      sprint.tasks.forEach(task => {
        items.push({
          id: task.id,
          name: task.name,
          type: 'task',
          startDate: parseISO(task.startDate),
          endDate: parseISO(task.endDate),
          progress: task.progress,
          level: 2,
          parent: sprint.id,
          status: task.status,
          priority: task.priority,
          department: task.department,
          resources: task.resources
        });

        // Add subtasks
        task.subtasks.forEach(subtask => {
          items.push({
            id: subtask.id,
            name: subtask.name,
            type: 'subtask',
            startDate: parseISO(subtask.startDate),
            endDate: parseISO(subtask.endDate),
            progress: subtask.progress,
            level: 3,
            parent: task.id,
            status: subtask.status,
            priority: subtask.priority,
            department: subtask.department,
            resources: subtask.resources
          });
        });
      });
    });

    return items;
  }, [timeline]);

  // Generate date columns
  const dateColumns = useMemo(() => {
    const days = eachDayOfInterval({ start: viewStartDate, end: viewEndDate });
    return days.map(day => ({
      date: day,
      label: format(day, 'MMM dd'),
      isWeekend: day.getDay() === 0 || day.getDay() === 6
    }));
  }, [viewStartDate, viewEndDate]);

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

  const getDepartmentColor = (departmentName?: string) => {
    const dept = departments.find(d => d.name === departmentName);
    return dept?.color || '#6B7280';
  };

  const getResourceName = (resourceId: string) => {
    const resource = resources.find(r => r.id === resourceId);
    return resource?.name || resourceId;
  };

  // Calculate bar position and width
  const calculateBarPosition = (item: GanttItem) => {
    const totalDays = differenceInDays(viewEndDate, viewStartDate) + 1;
    const startOffset = differenceInDays(item.startDate, viewStartDate);
    const duration = differenceInDays(item.endDate, item.startDate) + 1;
    
    const left = Math.max(0, (startOffset / totalDays) * 100);
    const width = Math.min(100 - left, (duration / totalDays) * 100);
    
    return { left: `${left}%`, width: `${width}%` };
  };

  const renderGanttBar = (item: GanttItem) => {
    const position = calculateBarPosition(item);
    const color = item.status ? getStatusColor(item.status) : 
                  item.department ? getDepartmentColor(item.department) : 'default';

    return (
      <div
        className="absolute h-6 rounded-md cursor-pointer hover:opacity-80 transition-opacity"
        style={{
          left: position.left,
          width: position.width,
          backgroundColor: item.department ? getDepartmentColor(item.department) : 
                          item.type === 'timeline' ? '#3B82F6' :
                          item.type === 'sprint' ? '#8B5CF6' :
                          item.type === 'task' ? '#10B981' : '#F59E0B',
          opacity: 0.8
        }}
        onClick={() => onItemSelect(item.id, item.type)}
      >
        <div className="h-full rounded-md relative">
          {item.progress > 0 && (
            <div
              className="h-full bg-white bg-opacity-30 rounded-md"
              style={{ width: `${item.progress}%` }}
            />
          )}
          <div className="absolute inset-0 flex items-center px-2">
            <span className="text-xs text-white font-medium truncate">
              {item.name}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderTreeColumn = () => (
    <div className="w-80 border-r border-default-200 bg-default-50">
      <div className="p-4 border-b border-default-200 bg-default-100">
        <h4 className="font-semibold">Task Hierarchy</h4>
      </div>
      <div className="overflow-auto h-full">
        {ganttItems.map(item => (
          <div
            key={item.id}
            className={`p-3 border-b border-default-100 cursor-pointer hover:bg-default-100 transition-colors ${
              selectedItem === item.id ? 'bg-primary-50' : ''
            }`}
            style={{ paddingLeft: `${12 + item.level * 20}px` }}
            onClick={() => onItemSelect(item.id, item.type)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{item.name}</span>
                  {item.type === 'timeline' && (
                    <Chip size="sm" color="primary" variant="flat">Timeline</Chip>
                  )}
                  {item.type === 'sprint' && (
                    <Chip size="sm" color="secondary" variant="flat">Sprint</Chip>
                  )}
                  {item.type === 'task' && (
                    <Chip size="sm" color="success" variant="flat">Task</Chip>
                  )}
                  {item.type === 'subtask' && (
                    <Chip size="sm" color="warning" variant="flat">Subtask</Chip>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-default-500">
                    {format(item.startDate, 'MMM dd')} - {format(item.endDate, 'MMM dd')}
                  </span>
                  {item.status && (
                    <Chip size="sm" color={getStatusColor(item.status)} variant="flat">
                      {item.status.replace('-', ' ')}
                    </Chip>
                  )}
                  {item.progress > 0 && (
                    <span className="text-xs text-default-500">{item.progress}%</span>
                  )}
                </div>
                {item.department && (
                  <div className="flex items-center gap-1 mt-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getDepartmentColor(item.department) }}
                    />
                    <span className="text-xs text-default-500">{item.department}</span>
                  </div>
                )}
              </div>
              {item.type === 'sprint' && (
                <Button
                  size="sm"
                  variant="light"
                  isIconOnly
                  onPress={() => {/* Add task */}}
                >
                  <PlusIcon />
                </Button>
              )}
              {item.type === 'task' && (
                <Button
                  size="sm"
                  variant="light"
                  isIconOnly
                  onPress={() => {/* Add subtask */}}
                >
                  <PlusIcon />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGanttChart = () => (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="border-b border-default-200 bg-default-100 p-2">
        <div className="flex">
          {dateColumns.map(col => (
            <div
              key={col.date.toISOString()}
              className={`flex-1 text-center text-xs py-2 ${
                col.isWeekend ? 'bg-default-200' : ''
              }`}
              style={{ minWidth: '40px' }}
            >
              {col.label}
            </div>
          ))}
        </div>
      </div>

      {/* Chart Body */}
      <div className="relative">
        {ganttItems.map((item, index) => (
          <div
            key={item.id}
            className={`relative h-12 border-b border-default-100 ${
              index % 2 === 0 ? 'bg-white' : 'bg-default-50'
            }`}
          >
            {/* Weekend columns */}
            {dateColumns.map(col => (
              col.isWeekend && (
                <div
                  key={col.date.toISOString()}
                  className="absolute inset-y-0 bg-default-100 opacity-50"
                  style={{
                    left: `${(differenceInDays(col.date, viewStartDate) / (dateColumns.length - 1)) * 100}%`,
                    width: `${100 / (dateColumns.length - 1)}%`
                  }}
                />
              )
            ))}
            
            {/* Gantt bar */}
            <div className="absolute inset-0 px-2 py-3">
              {renderGanttBar(item)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <div className="text-default-600">Loading Gantt chart...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b border-default-200 bg-default-50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Gantt Chart</h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="bordered"
              onPress={() => {
                const newStart = new Date(viewStartDate);
                const newEnd = new Date(viewEndDate);
                newStart.setMonth(newStart.getMonth() - 1);
                newEnd.setMonth(newEnd.getMonth() - 1);
                setViewStartDate(newStart);
                setViewEndDate(newEnd);
              }}
            >
              ← Previous Month
            </Button>
            <Button
              size="sm"
              variant="bordered"
              onPress={() => {
                setViewStartDate(startOfMonth(parseISO(timeline.startDate)));
                setViewEndDate(endOfMonth(parseISO(timeline.endDate)));
              }}
            >
              Fit to Timeline
            </Button>
            <Button
              size="sm"
              variant="bordered"
              onPress={() => {
                const newStart = new Date(viewStartDate);
                const newEnd = new Date(viewEndDate);
                newStart.setMonth(newStart.getMonth() + 1);
                newEnd.setMonth(newEnd.getMonth() + 1);
                setViewStartDate(newStart);
                setViewEndDate(newEnd);
              }}
            >
              Next Month →
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {renderTreeColumn()}
        {renderGanttChart()}
      </div>
    </div>
  );
}
