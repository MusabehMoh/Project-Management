import { Employee } from "./project";

export interface ProjectRequirement {
  id: number;
  projectId: number;
  name: string;
  description: string;
  priority: number; // 1=Low, 2=Medium, 3=High, 4=Critical (matches RequirementPriority enum)
  type: number; // 1=New, 2=ChangeRequest (matches RequirementType enum)
  status: number; // 1=New, 2=UnderStudy, 3=UnderDevelopment, 4=UnderTesting, 5=Completed, 6=Approved (matches RequirementStatusEnum)
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
  attachments?: ProjectRequirementAttachment[];
  // Task information if exists
  requirementTask?: RequirementTask;
  // Timeline information if exists
  timeline?: {
    id: number;
    name: string;
  };
  // Project information for display
  project?: {
    id: number;
    applicationName: string;
    projectOwner: string;
    owningUnit: string;
    analysts?: string; // Display names for analysts (comma-separated)
    analystIds?: number[]; // Actual IDs for analysts
  };
}

export interface ProjectRequirementAttachment {
  id: number;
  projectRequirementId: number;
  fileName: string; // Physical file name (should be unique/hashed)
  originalName: string; // Original file name from user
  fileData?: string; // Relative path to the file
  fileSize: number;
  contentType?: string; // MIME type
  uploadedAt: string;
}

// Task creation for requirements
export interface RequirementTask {
  id: number;
  requirementId: number;
  developerId?: number;
  developerName?: string;
  qcId?: number;
  qcName?: string;
  designerId?: number;
  designerName?: string;
  gradeName?: string;
  controllerId?: number;
  controllerName?: string;
  description?: string;
  // Developer dates
  developerStartDate?: string;
  developerEndDate?: string;
  // QC dates
  qcStartDate?: string;
  qcEndDate?: string;
  // Designer dates
  designerStartDate?: string;
  designerEndDate?: string;
  status: "not-started" | "in-progress" | "testing" | "completed";
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  // Navigation properties - full Employee objects returned from backend
  developer?: Employee;
  qc?: Employee;
  designer?: Employee;
}

export interface CreateRequirementTaskRequest {
  requirementId: number;
  developerId?: number;
  developerIds?: number[];
  qcId?: number;
  designerId?: number;
  description?: string;
  // Developer dates
  developerStartDate?: string;
  developerEndDate?: string;
  // QC dates
  qcStartDate?: string;
  qcEndDate?: string;
  // Designer dates
  designerStartDate?: string;
  designerEndDate?: string;
}

export interface UpdateRequirementTaskRequest
  extends CreateRequirementTaskRequest {
  id: number;
}

export interface AssignedProject {
  id: number;
  applicationName: string;
  projectOwner: string;
  owningUnit: string;
  projectOwnerEmployee: Employee;
  status: number;
  requirementsCount: number;
  completedRequirements: number;
  lastActivity: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  analysts?: string; // Display names for analysts (comma-separated)
}

export interface CreateProjectRequirementRequest {
  name: string;
  description: string;
  priority: number; // Backend expects integer values
  type: number; // Backend expects integer values (1=New, 2=ChangeRequest)
  expectedCompletionDate: any;
  assignedTo?: number;
  projectId: number;
  dueDate?: string;
  estimatedHours?: number;
  tags?: string[];
  status?: number; // Add optional status field for integer values
}

export interface UpdateProjectRequirementRequest {
  id: number;
  projectId?: number;
  name?: string;
  description?: string;
  priority?: number; // Backend expects integer values
  type?: number; // Backend expects integer values (1=New, 2=ChangeRequest)
  status?: number; // Backend expects integer values (1-6)
  assignedTo?: number;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
}

export interface ProjectRequirementFilters {
  status?: string;
  projectId?: number;
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
  managerReview: number;
  approved: number;
  inDevelopment: number;
  underTesting: number;
  completed: number;
  byStatus: {
    draft: number;
    managerReview: number;
    approved: number;
    rejected: number;
    in_development: number;
    underTesting: number;
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
