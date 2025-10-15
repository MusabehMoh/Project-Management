import { Department, MemberSearchResult } from "./timeline";

export interface MemberTask {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  progress: number; // 0-100
  statusId: number;
  priorityId: number;
  typeId?: number; // 1=TimeLine, 2=ChangeRequest, 3=AdHoc
  department: Department;
  assignedMembers: MemberSearchResult[]; // Multiple assignees array
  primaryAssignee?: MemberSearchResult; // Main responsible person
  memberIds: number[]; // For API filtering
  project: { id: string; applicationName: string };
  requirement: { id: string; name: string };
  canRequestDesign: boolean;
  hasDesignRequest: boolean; // Whether a design request already exists for this task
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
  memberIds?: number[]; // Filter by member IDs
  memberFilterMode?: "any" | "all"; // How to apply member filter
  departmentIds?: string[]; // Filter by department IDs
  statusIds?: number[]; // Filter by status IDs
  priorityIds?: number[]; // Filter by priority IDs
  statusId?: number; // Legacy single status filter
  priorityId?: number; // Legacy single priority filter
  projectId?: number;
  typeId?: number; // Filter by task type (1=Timeline, 2=ChangeRequest, 3=Adhoc)
  isOverdue?: boolean; // Show only overdue tasks
  dateRange?: {
    start: string;
    end: string;
  };
  sortBy?: "startDate" | "endDate" | "priority" | "status" | "name";
  sortOrder?: "asc" | "desc";
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
