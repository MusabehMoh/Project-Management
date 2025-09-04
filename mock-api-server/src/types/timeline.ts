export interface Timeline {
  id: number;
  treeId: string;
  projectId: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  sprints: Sprint[];
}

export interface Sprint {
  id: number;
  treeId: string;
  timelineId: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  duration: number; // in days
  statusId: number;
  departmentId?: number;
  requirements: Requirement[];
  createdAt: string;
  updatedAt: string;
}

export interface Requirement {
  id: number;
  treeId: string;
  sprintId: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  duration: number; // in days
  tasks: Task[];
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

export interface Task {
  id: number;
  treeId: string;
  requirementId: number;
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
  description: string;
  assigneeId?: number;
  assigneeName?: string;
  statusId: number;
  priorityId?: number;
  departmentId?: number;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
  updatedAt: string;
  dependentTasks: Task[];
  members: MemberSearchResult[];
  depTasks: WorkItem[];
}

export interface Department {
  id: number;
  name: string;
  nameAr: string;
}

export interface Resource {
  id: number;
  name: string;
  email: string;
  departmentId: number;
  departmentName: string;
  role: string;
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

export type SprintStatus = "planning" | "active" | "completed" | "cancelled";
export type TaskStatus = "todo" | "in_progress" | "review" | "done" | "blocked";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface ProjectWithTimelines {
  projectId: number;
  projectName: string;
  timelineCount: number;
  timelines: Timeline[];
}
