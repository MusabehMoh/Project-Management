export interface ProjectRequirement {
  id: number;
  projectId: number;
  name: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "draft" | "pending" | "approved" | "in-development" | "completed";
  createdBy: number;
  assignedTo?: number;
  assignedAnalyst?: number;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  expectedCompletionDate: any;
  tags?: string[];
  attachments?: string[];
  // Project information for display
  project?: {
    id: number;
    applicationName: string;
    projectOwner: string;
    owningUnit: string;
  };
}

export interface AssignedProject {
  id: number;
  applicationName: string;
  projectOwner: string;
  owningUnit: string;
  status: number;
  requirementsCount: number;
  completedRequirements: number;
  lastActivity: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  pendingRequirementsCount?: number;
}

export interface CreateProjectRequirementRequest {
  name: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  expectedCompletionDate: any;
  assignedTo?: number;
  projectId: number;
  dueDate?: string;
  estimatedHours?: number;
  tags?: string[];
  attachments?: string[];
}

export interface UpdateProjectRequirementRequest {
  id: number;
  projectId?: number;
  name?: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "critical";
  status?: "draft" | "in_development" | "completed";
  assignedTo?: number;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  attachments?: string[];
}

export interface ProjectRequirementFilters {
  status?: string;
  priority?: string;
  assignedTo?: number;
  createdBy?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
}

export interface ProjectRequirementStats {
  total: number;
  draft: number;
  inDevelopment: number;
  completed: number;
  byStatus: {
    draft: number;
    pending: number;
    approved: number;
    rejected: number;
    in_development: number;
    completed: number;
  };
  byPriority: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  averageCompletionTime?: number; // in days
  totalEstimatedHours: number;
  totalActualHours: number;
}
