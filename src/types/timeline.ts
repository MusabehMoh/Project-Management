export interface Timeline {
  id: string;
  projectId: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  sprints: Sprint[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Sprint {
  id: string;
  timelineId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  duration: number; // in days
  tasks: Task[];
  notes?: string;
  department?: string;
  resources?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  id: string;
  sprintId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  duration: number; // in days
  subtasks: Subtask[];
  notes?: string;
  department?: string;
  resources?: string[];
  status: TaskStatus;
  priority: TaskPriority;
  progress: number; // 0-100
  createdAt?: string;
  updatedAt?: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  duration: number; // in days
  notes?: string;
  department?: string;
  resources?: string[];
  status: TaskStatus;
  priority: TaskPriority;
  progress: number; // 0-100
  createdAt?: string;
  updatedAt?: string;
}

export type TaskStatus = 'not-started' | 'in-progress' | 'completed' | 'on-hold' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Resource {
  id: string;
  name: string;
  type: 'person' | 'equipment' | 'material';
  department?: string;
  isAvailable: boolean;
  skills?: string[];
}

export interface Department {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface TimelineView {
  type: 'gantt' | 'tree' | 'timeline';
  showDetails: boolean;
  selectedItem?: string;
  selectedItemType?: 'timeline' | 'sprint' | 'task' | 'subtask';
  filters: TimelineFilters;
}

export interface TimelineFilters {
  departments: string[];
  resources: string[];
  status: TaskStatus[];
  priority: TaskPriority[];
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}

export interface GanttBarData {
  id: string;
  type: 'timeline' | 'sprint' | 'task' | 'subtask';
  parentId?: string;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  resources: string[];
  department?: string;
  status: TaskStatus;
  priority: TaskPriority;
  level: number; // 0 = timeline, 1 = sprint, 2 = task, 3 = subtask
  isExpanded?: boolean;
  children?: GanttBarData[];
}

export interface TimelineFormData {
  name: string;
  description?: string;
  startDate: any; // CalendarDate | null
  endDate: any; // CalendarDate | null
}

export interface SprintFormData {
  name: string;
  description?: string;
  startDate: any; // CalendarDate | null
  endDate: any; // CalendarDate | null
  department?: string;
  resources?: string[];
  notes?: string;
}

export interface TaskFormData {
  name: string;
  description?: string;
  startDate: any; // CalendarDate | null
  endDate: any; // CalendarDate | null
  department?: string;
  resources?: string[];
  notes?: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
}

export interface SubtaskFormData {
  name: string;
  description?: string;
  startDate: any; // CalendarDate | null
  endDate: any; // CalendarDate | null
  department?: string;
  resources?: string[];
  notes?: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
}

// API Response types
export interface TimelineResponse {
  success: boolean;
  data: Timeline[];
  message?: string;
  timestamp: string;
}

export interface CreateTimelineRequest {
  projectId: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
}

export interface UpdateTimelineRequest extends Partial<CreateTimelineRequest> {
  id: string;
}

export interface CreateSprintRequest {
  timelineId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  department?: string;
  resources?: string[];
  notes?: string;
}

export interface UpdateSprintRequest extends Partial<CreateSprintRequest> {
  id: string;
}

export interface CreateTaskRequest {
  sprintId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  department?: string;
  resources?: string[];
  notes?: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  id: string;
}

export interface CreateSubtaskRequest {
  taskId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  department?: string;
  resources?: string[];
  notes?: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
}

export interface UpdateSubtaskRequest extends Partial<CreateSubtaskRequest> {
  id: string;
}
