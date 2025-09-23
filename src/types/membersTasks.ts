import { Department, MemberSearchResult } from "./timeline";

export interface MemberTask {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  progress: number; // 0-100
  status: { id: number; label: string; color: string };
  priority: { id: number; label: string; color: string };
  department: Department;
  assignedMembers: MemberSearchResult[]; // Multiple assignees array
  primaryAssignee?: MemberSearchResult; // Main responsible person
  memberIds: number[]; // For API filtering
  project: { id: string; name: string };
  requirement: { id: string; name: string };
  canRequestDesign: boolean;
  //canChangeStatus: boolean;
  timeSpent: number; // hours
  estimatedTime: number; // hours
  tags: string[];
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskSearchParams {
  page?: number;
  limit?: number;
  search?: string; // Task name search
  statusId?: number;
  priorityId?: number;
  projectId?: number;
}

export interface TasksResponse {
  tasks: MemberTask[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface TaskFiltersData {
  statuses: { id: number; label: string; color: string }[];
  priorities: { id: number; label: string; color: string }[];
  departments: Department[];
  members: MemberSearchResult[];
}

export interface TaskConfigData {
  totalTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  taskStatus: TaskStatus[];
  taskPriority: TaskStatus[];
  projects: ProjectBasicInfo[];
}

export interface TaskStatus {
  id: number;
  label: string;
}

export interface ProjectBasicInfo {
  id: string;
  name: string;
}

export interface AdhocTask {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  assignedMembers: string[]; ///array of member ids
}
