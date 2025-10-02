export interface Timeline {
  id: number;
  treeId: string;
  projectId: number;
  projectRequirementId?: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  sprints: Sprint[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Sprint {
  id: number;
  treeId: string;
  timelineId: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  department: string;
  duration: number; // in days
  tasks: Task[];
  notes?: string;
  departmentId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  id: number;
  treeId: string;
  sprintId: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  duration: number; // in days
  subtasks?: Subtask[]; // Optional for backward compatibility with mock data
  notes?: string;
  departmentId?: string | number;
  resources?: string[];
  statusId: number;
  priorityId: number;
  progress: number; // 0-100
  createdAt?: string;
  updatedAt?: string;
  dependentTasks: Task[];
  members: MemberSearchResult[];
  depTasks: WorkItem[];
}

export interface Subtask {
  id: number;
  treeId: string;
  taskId: number;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  duration?: number; // in days
  notes?: string;
  departmentId?: number;
  resources?: string[];
  statusId: number;
  priorityId: number;
  progress?: number; // 0-100
  assigneeId?: number;
  assigneeName?: string;
  estimatedHours?: number;
  actualHours?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type TaskStatus =
  | "not-started"
  | "in-progress"
  | "completed"
  | "on-hold"
  | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "critical";

// Lookup interfaces for dynamic data
export interface TaskStatusLookup {
  id: string;
  key: TaskStatus;
  label: string;
  color: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface TaskPriorityLookup {
  id: string;
  key: TaskPriority;
  label: string;
  color: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  icon?: string;
}

// Generic Lookup DTO that matches the backend API response
export interface LookupDto {
  id: number;
  code: string;
  name: string;
  nameAr: string;
  value: number;
  isActive: boolean;
}

export interface Department {
  id: string | number;
  name: string;
  color: string;
  description?: string;
}

export interface TimelineView {
  type: "gantt" | "tree" | "timeline";
  showDetails: boolean;
  selectedItem?: string;
  selectedItemType?: "timeline" | "sprint" | "task" | "subtask" | "requirement";
  filters: TimelineFilters;
}

export interface TimelineFilters {
  departments: string[];
  members: string[]; // User/member IDs
  status: TaskStatus[];
  priority: TaskPriority[];
  search?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface GanttBarData {
  id: string;
  type: "timeline" | "sprint" | "task";
  parentId?: string;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  departmentId?: string | number;
  statusId: number;
  priorityId: number;
  level: number; // 0 = timeline, 1 = sprint,  2 = task
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
  departmentId?: string;
  resources?: string[];
  notes?: string;
}

export interface RequirementFormData {
  name: string;
  description?: string;
  startDate: any; // CalendarDate | null
  endDate: any; // CalendarDate | null
  departmentId?: string;
  resources?: string[];
  notes?: string;
  statusId: number;
  priorityId: number;
  progress: number;
}

export interface TaskFormData {
  name: string;
  description?: string;
  startDate: any; // CalendarDate | null
  endDate: any; // CalendarDate | null
  departmentId?: string;
  resources?: string[];
  notes?: string;
  statusId: number;
  priorityId: number;
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
  projectRequirementId?: number;
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
  departmentId?: string;
  resources?: string[];
  notes?: string;
}

export interface UpdateSprintRequest extends Partial<CreateSprintRequest> {
  id: string;
}

export interface CreateTaskRequest {
  sprintId: string;
  timelineId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  departmentId?: string;
  resources?: string[];
  notes?: string;
  statusId: number;
  priorityId: number;
  progress: number;
  memberIds?: number[];
  depTaskIds?: number[];
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  id: string;
}

export interface CreateSubtaskRequest {
  taskId: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  resources?: string[];
  notes?: string;
  statusId: number;
  priorityId: number;
  progress?: number;
  assigneeId?: number;
  assigneeName?: string;
  estimatedHours?: number;
  actualHours?: number;
}

// Search Types
export interface MemberSearchResult {
  id: number;
  userName: string;
  militaryNumber: string;
  fullName: string;
  gradeName: string;
  statusId: number;
  department: string;
}

// Search tasks and subTask
export interface WorkItem {
  id: string;
  sprintId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  duration: number; // in days
  department?: string;
  // resources?: string[];
  status: TaskStatus;
  priority: TaskPriority;
  progress: number; // 0-100
  members: MemberSearchResult[];
}

export interface UpdateSubtaskRequest extends Partial<CreateSubtaskRequest> {
  id: string;
}
