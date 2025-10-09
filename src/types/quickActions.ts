export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  priority: "high" | "medium" | "low";
  count?: number;
  action: QuickActionType;
  permissions?: string[];
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "warning" | "danger" | "success";
  isDisabled?: boolean;
}

export type QuickActionType =
  | "CREATE_PROJECT"
  | "REVIEW_REQUIREMENTS"
  | "ASSIGN_TASKS"
  | "ASSIGN_PROJECTS"
  | "APPROVE_STATUS"
  | "VIEW_OVERDUE"
  | "GENERATE_REPORT"
  | "MANAGE_TEAM"
  | "VIEW_ANALYTICS"
  | "ADD_REQUIREMENTS"
  | "ASSIGN_AVAILABLE_MEMBERS";

export interface QuickActionStats {
  // New stats for ModernQuickStats
  activeProjects: number;
  totalTasks: number;
  activeProjectRequirements: number;
  teamMembers: number;
  
  // Legacy stats for backward compatibility
  pendingRequirements: number;
  unassignedTasks: number;
  unassignedProjects: number;
  pendingApprovals: number;
  overdueItems: number;
  newNotifications: number;
  projectsWithoutRequirements: number;
  availableMembers: number;
}

export interface QuickActionData {
  stats: QuickActionStats;
  actions: QuickAction[];
  lastUpdated: string;
}

export interface OverdueItem {
  id: number;
  title: string;
  type: "project" | "task" | "requirement";
  dueDate: string;
  priority: "high" | "medium" | "low";
  assignee?: string;
  projectName?: string;
}

export interface PendingApproval {
  id: number;
  title: string;
  type: "project_status" | "requirement" | "task_completion";
  requestedBy: string;
  requestedAt: string;
  currentStatus: string;
  requestedStatus: string;
  priority: "high" | "medium" | "low";
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  department: string;
  currentTasks: number;
  workload: "low" | "medium" | "high";
  availability: "available" | "busy" | "unavailable";
}

export interface QuickActionApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}
