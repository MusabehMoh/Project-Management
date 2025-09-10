// Re-export types from main app for mock API consistency
export interface Department {
  id: string | number;
  name: string;
  color: string;
  description?: string;
}

export interface MemberSearchResult {
  id: number;
  userName: string;
  militaryNumber: string;
  fullName: string;
  gradeName: string;
  statusId: number;
  department: string;
}

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
  memberIds?: number[]; // Multiple assignee filtering
  memberFilterMode?: "any" | "all"; // AND/OR logic for assignees
  departmentIds?: string[];
  statusIds?: number[];
  priorityIds?: number[];
  isOverdue?: boolean;
  dateRange?: { start: string; end: string };
  sortBy?: "name" | "startDate" | "endDate" | "priority" | "progress";
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
